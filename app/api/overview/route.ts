// GET /api/overview — ข้อมูลหน้า Admin Dashboard (สรุปยอด + รายชื่อสมาชิกพร้อม summary)
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/guard';
import { summarize, thaiShort, dueThisMonth } from '@/lib/calc';
import type { Entry, Person, PersonSummary } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  let session;
  try {
    session = requireAdmin();
  } catch (res) {
    return res as NextResponse;
  }

  const db = getSupabaseAdmin();

  const [{ data: book }, { data: people }] = await Promise.all([
    db.from('books').select('name').eq('id', session.bookId).maybeSingle(),
    db.from('people').select('id, book_id, name, personal_code, user_id, created_at').eq('book_id', session.bookId),
  ]);

  const peopleList = (people ?? []) as Person[];
  const ids = peopleList.map((p) => p.id);

  let entries: Entry[] = [];
  if (ids.length) {
    const { data } = await db
      .from('entries')
      .select('id, person_id, description, amount, paid_amount, entry_date, created_at')
      .in('person_id', ids);
    entries = (data ?? []) as Entry[];
  }

  // จัดกลุ่ม entries ตาม person แล้วสรุปยอด
  const byPerson = new Map<string, Entry[]>();
  for (const e of entries) {
    const arr = byPerson.get(e.person_id) ?? [];
    arr.push(e);
    byPerson.set(e.person_id, arr);
  }

  const summaries: PersonSummary[] = peopleList.map((p) => {
    const es = byPerson.get(p.id) ?? [];
    const latest = es.reduce<string>((acc, e) => (e.entry_date > acc ? e.entry_date : acc), '');
    const label = latest ? `อัปเดต ${thaiShort(latest)}` : 'ยังไม่มีรายการ';
    return summarize(p, es, label);
  });

  const totalRemaining = summaries.reduce((s, x) => s + x.totalRemaining, 0);
  const totalPaid = entries.reduce((s, e) => s + Number(e.paid_amount), 0);

  // งวดผ่อนทั้งบัญชี → มีแผนผ่อนไหม + ยอดค้างเก็บในเดือนนี้
  let installments: { amount: number; due_date: string; paid: boolean }[] = [];
  const entryIds = entries.map((e) => e.id);
  if (entryIds.length) {
    const { data } = await db.from('installments').select('amount, due_date, paid').in('entry_id', entryIds);
    installments = (data ?? []) as typeof installments;
  }
  const hasPlan = installments.length > 0;
  const dueThisMonthAmount = dueThisMonth(installments);

  return NextResponse.json({
    bookId: session.bookId,
    bookName: book?.name ?? 'บัญชีของฉัน',
    headline: { totalRemaining, totalPaid, peopleCount: peopleList.length, hasPlan, dueThisMonth: dueThisMonthAmount },
    people: summaries,
  });
}
