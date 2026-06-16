import { NextRequest, NextResponse } from 'next/server';
import { getWorkflowRuns } from '@/services/runs';
import type { RunStatus } from '@prisma/client';

const RUN_STATUSES: RunStatus[] = ['PENDING', 'RUNNING', 'SUCCESS', 'FAILED', 'CANCELLED', 'TIMED_OUT'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const requestedStatus = searchParams.get('status');
    const status = RUN_STATUSES.find((item) => item === requestedStatus);
    if (requestedStatus && !status) {
      return NextResponse.json({ error: 'Invalid run status.' }, { status: 400 });
    }
    const workflowId = searchParams.get('workflowId') ?? undefined;

    const runs = await getWorkflowRuns({
      workflowId,
      status: status ?? undefined,
      limit: 100,
    });

    return NextResponse.json({ runs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
