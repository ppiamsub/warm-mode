// /api/entries/:id — PATCH อัปเดต paid_amount (จ่ายครบ/บางส่วน) · DELETE ลบรายการ  [Admin]
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/guard';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    requireAdmin();
  } catch (res) {
    return res as NextResponse;
  }

  let body: { paid_amount?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  const paid = body.paid_amount;
  // paid_amount ต้อง >= 0 (กฎเหล็ก DB Agent)
  if (paid == null || paid < 0) {
    return NextResponse.json({ error: 'paid_amount ต้อง >= 0' }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  // กันจ่ายเกินยอดเต็ม: clamp ไม่ให้เกิน amount
  const { data: entry } = await db.from('entries').select('amount').eq('id', params.id).maybeSingle();
  if (!entry) return NextResponse.json({ error: 'ไม่พบรายการ' }, { status: 404 });
  const clamped = Math.min(paid, Number(entry.amount));

  const { data, error } = await db
    .from('entries')
    .update({ paid_amount: clamped })
    .eq('id', params.id)
    .select('id, person_id, description, amount, paid_amount, entry_date, created_at')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    requireAdmin();
  } catch (res) {
    return res as NextResponse;
  }
  const db = getSupabaseAdmin();
  const { error } = await db.from('entries').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
