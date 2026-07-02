// GET /api/book/entries — รายการทั้งหมดในบัญชี พร้อมชื่อสมาชิก (สำหรับสรุปยอด + export)
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

  const { data: people } = await db.from('people').select('id, name').eq('book_id', session.bookId);
  const nameById = new Map<string, string>((people ?? []).map((p) => [p.id, p.name]));
  const ids = (people ?? []).map((p) => p.id);

  let rows: any[] = [];
  if (ids.length) {
    const { data } = await db
      .from('entries')
      .select('id, person_id, description, amount, paid_amount, entry_date, created_at')
      .in('person_id', ids)
      .order('entry_date', { ascending: false });
    rows = (data ?? []).map((e) => ({
      ...e,
      person_name: nameById.get(e.person_id) ?? '',
      remaining: Math.max(Number(e.amount) - Number(e.paid_amount), 0),
    }));
  }

  return NextResponse.json({ entries: rows });
}
