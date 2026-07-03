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

    const entries = data ?? [];

    // ดึงงวดผ่อนของทุกรายการในบัญชี (ใช้จัดกลุ่มรายงานตามกำหนดชำระ)
    const entryIds = entries.map((e) => e.id);
    const instByEntry = new Map<string, any[]>();
    if (entryIds.length) {
      const { data: inst } = await db
        .from('installments')
        .select('id, entry_id, seq, amount, due_date, paid, paid_at')
        .in('entry_id', entryIds)
        .order('seq', { ascending: true });
      for (const i of inst ?? []) {
        const arr = instByEntry.get(i.entry_id) ?? [];
        arr.push(i);
        instByEntry.set(i.entry_id, arr);
      }
    }

    rows = entries.map((e) => ({
      ...e,
      person_name: nameById.get(e.person_id) ?? '',
      remaining: Math.max(Number(e.amount) - Number(e.paid_amount), 0),
      installments: instByEntry.get(e.id) ?? [],
    }));
  }

  return NextResponse.json({ entries: rows });
}
