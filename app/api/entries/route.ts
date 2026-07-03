// /api/entries — GET รายการของบุคคล · POST เพิ่มรายการใหม่  [Admin]
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireSession, requireAdmin } from '@/lib/guard';
import { round2, baht } from '@/lib/calc';
import { logActivity } from '@/lib/activity';

export async function GET(req: Request) {
  let session;
  try {
    session = requireSession();
  } catch (res) {
    return res as NextResponse;
  }

  const personId = new URL(req.url).searchParams.get('person_id');
  // Viewer ดูได้เฉพาะรายการของตัวเอง
  const targetPerson = session.role === 'viewer' ? session.personId : personId;
  if (!targetPerson) return NextResponse.json({ error: 'ต้องระบุ person_id' }, { status: 400 });
  if (session.role === 'viewer' && personId && personId !== session.personId) {
    return NextResponse.json({ error: 'ไม่มีสิทธิ์ดูข้อมูลผู้อื่น' }, { status: 403 });
  }

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('entries')
    .select('id, person_id, description, amount, paid_amount, entry_date, created_at')
    .eq('person_id', targetPerson)
    .order('entry_date', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entries: data });
}

export async function POST(req: Request) {
  let session;
  try {
    session = requireAdmin();
  } catch (res) {
    return res as NextResponse;
  }

  let body: { person_id?: string; description?: string; amount?: number; entry_date?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  const { person_id, description, entry_date } = body;
  const amount = round2(Number(body.amount)); // ทศนิยมสูงสุด 2 ตำแหน่ง
  // Validate: amount ต้อง > 0 (กฎเหล็ก DB Agent)
  if (!person_id || !description?.trim() || !amount || amount <= 0) {
    return NextResponse.json({ error: 'ข้อมูลไม่ครบ หรือ amount ต้องมากกว่า 0' }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('entries')
    .insert({
      person_id,
      description: description.trim(),
      amount,
      paid_amount: 0,
      entry_date: entry_date || new Date().toISOString().slice(0, 10),
    })
    .select('id, person_id, description, amount, paid_amount, entry_date, created_at')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: person } = await db.from('people').select('name').eq('id', person_id).maybeSingle();
  await logActivity(db, {
    bookId: session.bookId,
    session,
    action: 'entry_add',
    summary: `เพิ่มรายการ "${data.description}" ${baht(Number(data.amount))}`,
    personId: person_id,
    personName: person?.name ?? null,
    entryId: data.id,
  });
  return NextResponse.json(data, { status: 201 });
}
