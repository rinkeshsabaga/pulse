import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { getUsageSummary } from '@/services/usage';

export async function GET() {
  try {
    const { dbOrgId } = await getAuthContext();
    const summary = await getUsageSummary(dbOrgId);
    return NextResponse.json(summary);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
