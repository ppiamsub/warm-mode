// POST /api/accounts/select — เลือกบัญชี ➔ set context (bookId, role) ลง Session
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireSession } from '@/lib/guard';
import { setSessionCookie } from '@/lib/auth';

export async function POST(req: Request) {
  let session;
  try {
    session = requireSession();
  } catch (res) {
    return res as NextResponse;
  }

  let bookId: string | undefined;
  try {
    ({ bookId } = await req.json());
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }
  if (!bookId) return NextResponse.json({ error: 'ต้องระบุ bookId' }, { status: 400 });

  const db = getSupabaseAdmin();
  // ตรวจว่าผู้ใช้เป็นสมาชิกของบัญชีนี้จริง
  const { data: m } = await db
    .from('memberships')
    .select('role, person_id')
    .eq('user_id', session.userId)
    .eq('book_id', bookId)
    .maybeSingle();
  if (!m) return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าบัญชีนี้' }, { status: 403 });

  setSessionCookie({
    ...session,
    bookId,
    role: m.role,
    personId: m.person_id ?? undefined,
  });
  return NextResponse.json({ role: m.role });
}
