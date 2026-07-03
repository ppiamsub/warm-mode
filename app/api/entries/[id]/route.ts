// /api/entries/:id — PATCH: จ่ายเงิน (paid_amount) หรือแก้ไขรายการ · DELETE ลบรายการ  [Admin]
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/guard';
import { entryBookId } from '@/lib/installments';
import { round2, baht } from '@/lib/calc';
import { logActivity } from '@/lib/activity';

const SELECT = 'id, person_id, description, amount, paid_amount, entry_date, created_at';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  let session;
  try {
    session = requireAdmin();
  } catch (res) {
    return res as NextResponse;
  }

  let body: { paid_amount?: number; amount?: number; description?: string; entry_date?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  // ตรวจว่ารายการอยู่ในบัญชีของ admin จริง
  const bookId = await entryBookId(db, params.id);
  if (!bookId || bookId !== session.bookId) {
    return NextResponse.json({ error: 'ไม่พบรายการในบัญชีนี้' }, { status: 404 });
  }
  const { data: entry } = await db
    .from('entries')
    .select('person_id, description, amount, paid_amount, entry_date')
    .eq('id', params.id)
    .maybeSingle();
  if (!entry) return NextResponse.json({ error: 'ไม่พบรายการ' }, { status: 404 });
  const { data: person } = await db.from('people').select('name').eq('id', entry.person_id).maybeSingle();
  const logBase = { bookId: session.bookId, session, personId: entry.person_id, personName: person?.name ?? null, entryId: params.id };

  // ── โหมดแก้ไขรายการ (ยอด/รายละเอียด/วันที่) — เฉพาะเมื่อยังไม่มีการจ่าย ──
  const isEdit = body.amount != null || body.description != null || body.entry_date != null;
  if (isEdit) {
    if (Number(entry.paid_amount) > 0) {
      return NextResponse.json({ error: 'แก้ไขไม่ได้ — มีการจ่ายแล้ว' }, { status: 409 });
    }
    const { count } = await db
      .from('installments')
      .select('id', { count: 'exact', head: true })
      .eq('entry_id', params.id);
    if ((count ?? 0) > 0) {
      return NextResponse.json({ error: 'แก้ไขไม่ได้ — มีแผนผ่อนอยู่ กรุณายกเลิกแผนก่อน' }, { status: 409 });
    }

    const patch: Record<string, unknown> = {};
    if (body.amount != null) {
      const amount = round2(Number(body.amount));
      if (!(amount > 0)) return NextResponse.json({ error: 'ยอดต้องมากกว่า 0' }, { status: 400 });
      patch.amount = amount;
    }
    if (body.description != null) {
      if (!body.description.trim()) return NextResponse.json({ error: 'ต้องมีรายละเอียด' }, { status: 400 });
      patch.description = body.description.trim();
    }
    if (body.entry_date != null) patch.entry_date = body.entry_date;

    const { data, error } = await db.from('entries').update(patch).eq('id', params.id).select(SELECT).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // สรุปสิ่งที่แก้ไข (ยอด/ชื่อ/วันที่)
    const parts: string[] = [];
    if (patch.amount != null && Number(patch.amount) !== Number(entry.amount)) parts.push(`ยอด ${baht(Number(entry.amount))} → ${baht(Number(patch.amount))}`);
    if (patch.description != null && patch.description !== entry.description) parts.push(`ชื่อ "${entry.description}" → "${patch.description}"`);
    if (patch.entry_date != null && patch.entry_date !== entry.entry_date) parts.push(`วันที่ ${entry.entry_date} → ${patch.entry_date}`);
    if (parts.length) {
      await logActivity(db, { ...logBase, action: 'entry_edit', summary: `แก้ไขรายการ — ${parts.join(', ')}`, detail: { before: entry, patch } });
    }
    return NextResponse.json(data);
  }

  // ── โหมดจ่ายเงิน (paid_amount) ──
  const paid = body.paid_amount == null ? null : round2(Number(body.paid_amount));
  if (paid == null || paid < 0) {
    return NextResponse.json({ error: 'paid_amount ต้อง >= 0' }, { status: 400 });
  }
  const clamped = round2(Math.min(paid, Number(entry.amount))); // กันจ่ายเกินยอดเต็ม
  const { data, error } = await db.from('entries').update({ paid_amount: clamped }).eq('id', params.id).select(SELECT).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const delta = round2(clamped - Number(entry.paid_amount));
  if (delta !== 0) {
    const summary = delta > 0
      ? `กดจ่าย ${baht(delta)} — "${entry.description}"`
      : `ปรับลดยอดชำระ ${baht(-delta)} — "${entry.description}"`;
    await logActivity(db, { ...logBase, action: 'pay', summary, detail: { from: Number(entry.paid_amount), to: clamped } });
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
  const bookId = await entryBookId(db, params.id);
  if (!bookId || bookId !== session.bookId) {
    return NextResponse.json({ error: 'ไม่พบรายการในบัญชีนี้' }, { status: 404 });
  }

  // เก็บข้อมูลไว้ก่อนลบ เพื่อบันทึก log
  const { data: entry } = await db.from('entries').select('person_id, description, amount').eq('id', params.id).maybeSingle();
  const { data: person } = entry ? await db.from('people').select('name').eq('id', entry.person_id).maybeSingle() : { data: null };

  const { error } = await db.from('entries').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (entry) {
    await logActivity(db, {
      bookId: session.bookId,
      session,
      action: 'entry_delete',
      summary: `ลบรายการ "${entry.description}" ${baht(Number(entry.amount))}`,
      personId: entry.person_id,
      personName: person?.name ?? null,
    });
  }
  return NextResponse.json({ ok: true });
}
