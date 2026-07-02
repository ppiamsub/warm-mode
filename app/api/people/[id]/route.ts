// /api/people/:id — GET รายละเอียด (person + entries) · DELETE ลบคน (Cascade)  [Admin]
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/guard';

export const dynamic = 'force-dynamic';

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

  return NextResponse.json({ person, entries: entries ?? [] });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  let session;
  try {
    session = requireAdmin();
  } catch (res) {
    return res as NextResponse;
  }

  const db = getSupabaseAdmin();
  // จำกัดให้ลบได้เฉพาะคนในบัญชีของตัวเอง
  const { error } = await db.from('people').delete().eq('id', params.id).eq('book_id', session.bookId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
