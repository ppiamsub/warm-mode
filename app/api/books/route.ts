// POST /api/books — สร้างบัญชีใหม่ + membership เป็น Admin + set context ลง Session
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireSession } from '@/lib/guard';
import { setSessionCookie } from '@/lib/auth';
import { generateBookCode } from '@/lib/codes';

export async function POST(req: Request) {
  let session;
  try {
    session = requireSession();
  } catch (res) {
    return res as NextResponse;
  }

  let name = 'บัญชีของฉัน';
  try {
    const body = await req.json();
    if (body?.name?.trim()) name = body.name.trim();
  } catch {
    /* ใช้ชื่อ default */
  }

  const db = getSupabaseAdmin();

  // gen admin_code ที่ไม่ซ้ำ (ลองสูงสุด 5 ครั้ง)
  for (let i = 0; i < 5; i++) {
    const admin_code = generateBookCode();
    const { data: book, error } = await db
      .from('books')
      .insert({ name, admin_code })
      .select('id, admin_code')
      .single();

    if (error) {
      if (/duplicate|unique/i.test(error.message)) continue;
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // สร้าง membership เป็น Admin ให้ผู้สร้าง
    const mem = await db
      .from('memberships')
      .insert({ user_id: session.userId, book_id: book.id, role: 'admin' });
    if (mem.error) return NextResponse.json({ error: mem.error.message }, { status: 500 });

    setSessionCookie({ ...session, bookId: book.id, role: 'admin', personId: undefined });
    return NextResponse.json({ bookId: book.id, admin_code: book.admin_code }, { status: 201 });
  }
  return NextResponse.json({ error: 'สร้างโค้ดไม่สำเร็จ ลองใหม่' }, { status: 500 });
}
