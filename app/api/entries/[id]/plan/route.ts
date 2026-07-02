// POST /api/entries/:id/plan — สร้างแผนผ่อน (แบ่งยอดเป็น N งวด กำหนดชำระรายเดือน)  [Admin]
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/guard';
import { splitAmount, addMonthsISO, entryBookId, recomputeEntryPaid } from '@/lib/installments';

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  let session;
  try {
    session = requireAdmin();
  } catch (res) {
    return res as NextResponse;
  }

  let count = 0;
  let startDate = todayISO();
  let intervalMonths = 1;
  try {
    const body = await req.json();
    count = Number(body?.count) || 0;
    if (body?.startDate) startDate = String(body.startDate);
    if (body?.intervalMonths) intervalMonths = Math.max(1, Number(body.intervalMonths));
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }
  if (count < 2 || count > 60) {
    return NextResponse.json({ error: 'จำนวนงวดต้องอยู่ระหว่าง 2–60' }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  // ตรวจว่า entry อยู่ในบัญชีของ admin จริง
  const bookId = await entryBookId(db, params.id);
  if (!bookId || bookId !== session.bookId) {
    return NextResponse.json({ error: 'ไม่พบรายการในบัญชีนี้' }, { status: 404 });
  }

  const { data: entry } = await db.from('entries').select('amount').eq('id', params.id).maybeSingle();
  if (!entry) return NextResponse.json({ error: 'ไม่พบรายการ' }, { status: 404 });

  // ลบแผนเดิม (ถ้ามี) แล้วสร้างใหม่
  await db.from('installments').delete().eq('entry_id', params.id);

  const amounts = splitAmount(Number(entry.amount), count);
  const rows = amounts.map((amount, i) => ({
    entry_id: params.id,
    seq: i + 1,
    amount,
    due_date: addMonthsISO(startDate, i * intervalMonths),
    paid: false,
  }));

  const { data, error } = await db.from('installments').insert(rows).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // แผนใหม่ยังไม่จ่ายงวดไหน ➔ paid_amount = 0
  await recomputeEntryPaid(db, params.id);

  return NextResponse.json({ installments: data }, { status: 201 });
}

// DELETE /api/entries/:id/plan — ยกเลิกแผนผ่อน (ลบทุกงวดของรายการ)
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  let session;
  try {
    session = requireAdmin();
  } catch (res) {
    return res as NextResponse;
  }
  const db = getSupabaseAdmin();
  const bookId = await entryBookId(db, params.id);
  if (!bookId || bookId !== session.bookId) {
    return NextResponse.json({ error: 'ไม่พบรายการในบัญชีนี้' }, { status: 404 });
  }
  const { error } = await db.from('installments').delete().eq('entry_id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
