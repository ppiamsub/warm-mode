// GET /api/activity — ประวัติการทำรายการของบัญชี (ล่าสุดก่อน)  [Admin]
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/guard';

export const dynamic = 'force-dynamic';

export async function GET() {
  let session;
  try {
    session = requireAdmin();
  } catch (res) {
    return res as NextResponse;
  }

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('activity_log')
    .select('id, action, actor_name, person_name, entry_id, summary, created_at')
    .eq('book_id', session.bookId)
    .order('created_at', { ascending: false })
    .limit(300);

  // ถ้ายังไม่ได้รัน migration (ตารางไม่มี) — คืนลิสต์ว่างแทนที่จะพัง
  if (error) return NextResponse.json({ activities: [], ready: false });
  return NextResponse.json({ activities: data ?? [], ready: true });
}
