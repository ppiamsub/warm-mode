// /api/people/:id — GET รายละเอียด · PATCH แก้ชื่อ · DELETE ลบคน (Cascade)  [Admin]
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/guard';
import { logActivity } from '@/lib/activity';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  let session;
  try {
    session = requireAdmin();
  } catch (res) {
    return res as NextResponse;
  }

  let name: string | undefined;
  try {
    ({ name } = await req.json());
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }
  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'ต้องระบุชื่อ' }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  const { data: before } = await db.from('people').select('name').eq('id', params.id).eq('book_id', session.bookId).maybeSingle();
  const { data, error } = await db
    .from('people')
    .update({ name: name.trim() })
    .eq('id', params.id)
    .eq('book_id', session.bookId) // เฉพาะคนในบัญชีตัวเอง
    .select('id, name, personal_code')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (before && before.name !== data.name) {
    await logActivity(db, {
      bookId: session.bookId,
      session,
      action: 'person_rename',
      summary: `เปลี่ยนชื่อสมาชิก "${before.name}" → "${data.name}"`,
      personId: params.id,
      personName: data.name,
    });
  }
  return NextResponse.json(data);
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  let session;
  try {
    session = requireAdmin();
  } catch (res) {
    return res as NextResponse;
  }

  const db = getSupabaseAdmin();
  const { data: person } = await db
    .from('people')
    .select('id, book_id, name, personal_code, user_id, created_at')
    .eq('id', params.id)
    .eq('book_id', session.bookId) // จำกัดเฉพาะคนในบัญชีตัวเอง
    .maybeSingle();
  if (!person) return NextResponse.json({ error: 'ไม่พบสมาชิก' }, { status: 404 });

  const { data: entries } = await db
    .from('entries')
    .select('id, person_id, description, amount, paid_amount, entry_date, created_at')
    .eq('person_id', params.id)
    .order('entry_date', { ascending: false });

  const entryIds = (entries ?? []).map((e) => e.id);
  let installments: unknown[] = [];
  if (entryIds.length) {
    const { data } = await db
      .from('installments')
      .select('id, entry_id, seq, amount, due_date, paid, paid_at, created_at')
      .in('entry_id', entryIds)
      .order('seq', { ascending: true });
    installments = data ?? [];
  }

  return NextResponse.json({ person, entries: entries ?? [], installments });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  let session;
  try {
    session = requireAdmin();
  } catch (res) {
    return res as NextResponse;
  }

  const db = getSupabaseAdmin();
  const { data: before } = await db.from('people').select('name').eq('id', params.id).eq('book_id', session.bookId).maybeSingle();
  // จำกัดให้ลบได้เฉพาะคนในบัญชีของตัวเอง
  const { error } = await db.from('people').delete().eq('id', params.id).eq('book_id', session.bookId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (before) {
    await logActivity(db, {
      bookId: session.bookId,
      session,
      action: 'person_delete',
      summary: `ลบสมาชิก "${before.name}"`,
      personId: params.id,
      personName: before.name,
    });
  }
  return NextResponse.json({ ok: true });
}
