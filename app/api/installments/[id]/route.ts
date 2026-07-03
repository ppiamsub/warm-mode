// PATCH /api/installments/:id — แก้ไขยอด/กำหนดชำระ/เก็บงวด · DELETE ลบงวด  [Admin]
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/guard';
import { entryBookId, recomputeEntryPaid } from '@/lib/installments';
import { round2, baht } from '@/lib/calc';
import { logActivity, entryLogContext } from '@/lib/activity';

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ตรวจว่า installment อยู่ในบัญชีของ admin + คืน entry_id
async function ownedEntryId(db: ReturnType<typeof getSupabaseAdmin>, instId: string, bookId: string) {
  const { data: inst } = await db.from('installments').select('entry_id').eq('id', instId).maybeSingle();
  if (!inst) return null;
  const b = await entryBookId(db, inst.entry_id);
  return b === bookId ? inst.entry_id : null;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  let session;
  try {
    session = requireAdmin();
  } catch (res) {
    return res as NextResponse;
  }

  let body: { amount?: number; due_date?: string; paid?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  const entryId = await ownedEntryId(db, params.id, session.bookId);
  if (!entryId) return NextResponse.json({ error: 'ไม่พบงวดในบัญชีนี้' }, { status: 404 });

  // แก้ไขยอด/กำหนดชำระไม่ได้ถ้ารายการมีการชำระแล้ว (แต่ toggle paid ยังทำได้)
  const editsPlan = body.amount != null || body.due_date != null;
  if (editsPlan) {
    const { data: paidRows } = await db.from('installments').select('id').eq('entry_id', entryId).eq('paid', true).limit(1);
    if (paidRows && paidRows.length) {
      return NextResponse.json({ error: 'รายการนี้มีการชำระแล้ว แก้ไขงวดไม่ได้' }, { status: 409 });
    }
  }

  const patch: Record<string, unknown> = {};
  if (body.amount != null) {
    const amount = round2(Number(body.amount));
    if (!(amount > 0)) return NextResponse.json({ error: 'ยอดต้องมากกว่า 0' }, { status: 400 });
    patch.amount = amount;
  }
  if (body.due_date) patch.due_date = body.due_date;
  if (body.paid != null) {
    patch.paid = body.paid;
    patch.paid_at = body.paid ? todayISO() : null;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'ไม่มีข้อมูลให้แก้ไข' }, { status: 400 });
  }

  const { data, error } = await db.from('installments').update(patch).eq('id', params.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await recomputeEntryPaid(db, entryId); // อัปเดต paid_amount ของ entry ตามงวดที่จ่าย

  // บันทึก log
  const ctx = await entryLogContext(db, entryId);
  const logBase = { bookId: session.bookId, session, personId: ctx.personId, personName: ctx.personName, entryId };
  const forEntry = ctx.description ? ` — "${ctx.description}"` : '';
  if (body.paid != null) {
    await logActivity(db, {
      ...logBase,
      action: data.paid ? 'installment_pay' : 'installment_unpay',
      summary: data.paid ? `เก็บงวดที่ ${data.seq} ${baht(Number(data.amount))}${forEntry}` : `ยกเลิกการเก็บงวดที่ ${data.seq}${forEntry}`,
    });
  } else {
    const changes: string[] = [];
    if (body.amount != null) changes.push(`ยอดเป็น ${baht(Number(data.amount))}`);
    if (body.due_date != null) changes.push(`กำหนดชำระเป็น ${data.due_date}`);
    if (changes.length) {
      await logActivity(db, { ...logBase, action: 'installment_edit', summary: `แก้ไขงวดที่ ${data.seq} — ${changes.join(', ')}${forEntry}` });
    }
  }
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  let session;
  try {
    session = requireAdmin();
  } catch (res) {
    return res as NextResponse;
  }
  const db = getSupabaseAdmin();
  const entryId = await ownedEntryId(db, params.id, session.bookId);
  if (!entryId) return NextResponse.json({ error: 'ไม่พบงวดในบัญชีนี้' }, { status: 404 });

  const { error } = await db.from('installments').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await recomputeEntryPaid(db, entryId);
  return NextResponse.json({ ok: true });
}
