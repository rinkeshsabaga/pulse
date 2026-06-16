import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { inngest } from '@/inngest/client';
import { checkWorkflowRunEntitlement } from '@/services/usage';
import { isAppTriggerStep, type WorkflowStepData } from '@/lib/types';
import {
  verifyBase64HmacSha256Signature,
  verifyPulseWebhookSignature,
} from '@/lib/webhook-signature';

// ─── Rate Limiting ────────────────────────────────────────────────────────────
// Uses Upstash Redis for distributed rate limiting. Falls through if Upstash
// is not configured (e.g., local development without Redis).

let rateLimiter: { limit: (key: string) => Promise<{ success: boolean }> } | null = null;

async function getRateLimiter() {
  if (rateLimiter) return rateLimiter;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  try {
    const { Ratelimit } = await import('@upstash/ratelimit');
    const { Redis } = await import('@upstash/redis');
    rateLimiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
      prefix: 'pulse:webhook',
    });
    return rateLimiter;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/webhooks/[workflowId]
//
// Incoming webhook trigger endpoint.
// - Rate limited per IP + workflowId (100 req/min)
// - Validates the HMAC signature (X-Pulse-Signature header)
// - Supports WooCommerce app triggers with X-WC-Webhook-Signature
// - Verifies workflow exists and is PUBLISHED
// - Fires an Inngest 'workflow/run' event
// - Returns 200 immediately (async execution)
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  const { workflowId } = await params;

  // Rate limit by IP + workflowId
  const limiter = await getRateLimiter();
  if (limiter) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const { success: allowed } = await limiter.limit(`${ip}:${workflowId}`);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again in a moment.' },
        { status: 429 }
      );
    }
  }

  const { searchParams } = new URL(request.url);
  const app = searchParams.get('app');
  const event = searchParams.get('event');

  // Read raw body for signature validation
  const rawBody = await request.text();

  // Load workflow
  const workflow = await db.workflow.findFirst({
    where: { id: workflowId },
    select: {
      id: true,
      organizationId: true,
      status: true,
      webhookSecret: true,
      steps: true,
    },
  });

  if (!workflow) {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
  }

  const steps = workflow.steps as WorkflowStepData[];
  const appTrigger = app && event ? findAppTriggerStep(steps, app, event) : null;
  if ((app || event) && !appTrigger) {
    return NextResponse.json(
      { error: 'No matching published app trigger exists for this app and event.' },
      { status: 400 }
    );
  }

  if (isWooCommercePing(app, rawBody)) {
    return NextResponse.json(
      { success: true, message: 'WooCommerce webhook ping acknowledged' },
      { status: 200 }
    );
  }

  if (workflow.status !== 'PUBLISHED') {
    return NextResponse.json(
      { error: 'Workflow is not published' },
      { status: 403 }
    );
  }

  if (workflow.webhookSecret && !hasValidWebhookSignature(workflow.webhookSecret, rawBody, request.headers, app)) {
    return NextResponse.json({ error: 'Invalid or missing signature' }, { status: 401 });
  }

  try {
    await checkWorkflowRunEntitlement(workflow.organizationId, steps);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Workflow is over plan limits.' },
      { status: 402 }
    );
  }

  // Parse body
  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(rawBody);
  } catch {
    // Non-JSON body — treat as empty
  }

  // Collect headers (sanitized)
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (
      !lowerKey.includes('authorization') &&
      !lowerKey.includes('secret') &&
      !lowerKey.includes('signature') &&
      lowerKey !== 'cookie'
    ) {
      headers[key] = value;
    }
  });

  // Fire the Inngest event (async — returns immediately)
  await inngest.send({
    name: 'workflow/run',
    data: {
      workflowId: workflow.id,
      organizationId: workflow.organizationId,
      trigger: appTrigger ? 'app' : 'webhook',
      triggerData: {
        ...(appTrigger && {
          app,
          event,
          stepId: appTrigger.id,
          provider: app?.toLowerCase().replace(/\s+/g, '_'),
        }),
        method: request.method,
        headers,
        body,
        receivedAt: new Date().toISOString(),
      },
    },
  });

  return NextResponse.json(
    { success: true, message: 'Workflow triggered' },
    { status: 200 }
  );
}

// Allow GET for webhook verification (e.g., Shopify ping)
export async function GET(
  request: NextRequest,
  _context: { params: Promise<{ workflowId: string }> }
) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('hub.challenge');
  if (challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ status: 'ok' });
}

function findAppTriggerStep(
  steps: WorkflowStepData[],
  app: string,
  event: string
): WorkflowStepData | null {
  return steps.find((step) => (
    isAppTriggerStep(step) &&
    step.data?.appTrigger?.app === app &&
    step.data.appTrigger.event === event
  )) ?? null;
}

function hasValidWebhookSignature(
  secret: string,
  body: string,
  headers: Headers,
  app: string | null
): boolean {
  const pulseSignature = headers.get('x-pulse-signature');
  if (verifyPulseWebhookSignature(secret, body, pulseSignature)) {
    return true;
  }

  if (app === 'WooCommerce') {
    return verifyBase64HmacSha256Signature(
      secret,
      body,
      headers.get('x-wc-webhook-signature')
    );
  }

  return false;
}

function isWooCommercePing(app: string | null, body: string): boolean {
  return app === 'WooCommerce' && body.startsWith('webhook_id=');
}
