import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthContext } from '@/lib/auth';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/webhooks/[workflowId]/events
//
// Returns recent webhook events received by this workflow.
// Used by the Edit Trigger dialog to show real payloads.
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  try {
    const { dbOrgId } = await getAuthContext();
    const { workflowId } = await params;

    // Verify workflow belongs to this org
    const workflow = await db.workflow.findFirst({
      where: { id: workflowId, organizationId: dbOrgId },
      select: { id: true },
    });

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Fetch last 20 webhook-triggered runs
    const runs = await db.workflowRun.findMany({
      where: {
        workflowId,
        organizationId: dbOrgId,
        trigger: 'webhook',
      },
      select: {
        id: true,
        triggerData: true,
        startedAt: true,
        status: true,
      },
      orderBy: { startedAt: 'desc' },
      take: 20,
    });

    const events = runs.map((run) => {
      const triggerData = (run.triggerData ?? {}) as Record<string, unknown>;
      return {
        id: run.id,
        method: (triggerData.method as string) ?? 'POST',
        headers: (triggerData.headers as Record<string, string>) ?? {},
        body: triggerData.body ?? {},
        query: {},
        receivedAt: (triggerData.receivedAt as string) ?? run.startedAt.toISOString(),
        status: run.status,
      };
    });

    return NextResponse.json({ events });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
