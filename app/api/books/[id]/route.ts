// /api/books/:id — PATCH เปลี่ยนชื่อบัญชี · DELETE ลบบัญชี (Cascade)  [Admin ของบัญชีนั้น]
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/guard';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  let session;
  try {
    session = requireAdmin();
  } catch (res) {
    return res as NextResponse;
  }
  if (params.id !== session.bookId) {
    return NextResponse.json({ error: 'จัดการได้เฉพาะบัญชีที่เลือกอยู่' }, { status: 403 });
  }

  let name: string | undefined;
  try {
    ({ name } = await req.json());
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }
  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'ต้องระบุชื่อบัญชี' }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  const { data, error } = await db.from('books').update({ name: name.trim() }).eq('id', params.id).select('id, name').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  let session;
  try {
    session = requireAdmin();
  } catch (res) {
    return res as NextResponse;
  }
  if (params.id !== session.bookId) {
    return NextResponse.json({ error: 'จัดการได้เฉพาะบัญชีที่เลือกอยู่' }, { status: 403 });
  }

  const db = getSupabaseAdmin();
  // ลบบัญชี ➔ people / entries / memberships ถูกลบตาม ON DELETE CASCADE
  const { error } = await db.from('books').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
