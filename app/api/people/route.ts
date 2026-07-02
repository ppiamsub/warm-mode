// /api/people — GET รายชื่อในบัญชี · POST เพิ่มคน (Gen personal_code)  [Admin เท่านั้น]
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/guard';
import { generatePersonalCode } from '@/lib/codes';

export async function GET() {
  let session;
  try {
    session = requireAdmin();
  } catch (res) {
    return res as NextResponse;
  }
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('people')
    .select('id, book_id, name, personal_code, line_uid, created_at')
    .eq('book_id', session.bookId)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ people: data });
}

export async function POST(req: Request) {
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
  for (let i = 0; i < 5; i++) {
    const personal_code = generatePersonalCode(name.trim().charAt(0));
    const { data, error } = await db
      .from('people')
      .insert({ book_id: session.bookId, name: name.trim(), personal_code })
      .select('id, name, personal_code')
      .single();
    if (!error && data) return NextResponse.json(data, { status: 201 });
    if (error && !/duplicate|unique/i.test(error.message)) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
  return NextResponse.json({ error: 'สร้างโค้ดไม่สำเร็จ' }, { status: 500 });
}
