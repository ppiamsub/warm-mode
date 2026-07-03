// GET /api/me/activity — ประวัติที่เกี่ยวกับ Viewer (การเพิ่ม/จ่าย/แผน ของตัวเอง)  [Viewer]
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireSession } from '@/lib/guard';

export const dynamic = 'force-dynamic';

export async function GET() {
  let session;
  try {
    session = requireSession();
  } catch (res) {
    return res as NextResponse;
  }
  if (session.role !== 'viewer' || !session.personId) {
    return NextResponse.json({ error: 'ต้องเป็นสมาชิก (Viewer) ของบัญชีนี้' }, { status: 403 });
  }

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('activity_log')
    .select('id, action, actor_name, person_name, entry_id, summary, created_at')
    .eq('person_id', session.personId)
    .order('created_at', { ascending: false })
    .limit(300);

  if (error) return NextResponse.json({ activities: [], ready: false });
  return NextResponse.json({ activities: data ?? [], ready: true });
}
