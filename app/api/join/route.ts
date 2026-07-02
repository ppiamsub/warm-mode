// POST /api/join — เข้าร่วมบัญชีด้วยโค้ด (Book Code=Admin / Personal Code=Viewer)
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireSession } from '@/lib/guard';
import { setSessionCookie } from '@/lib/auth';
import { normalizeCode, isValidCodeFormat } from '@/lib/codes';
import { rateLimit, clientIp } from '@/lib/rateLimit';

export async function POST(req: Request) {
  // กัน brute-force เดาโค้ด (5 ครั้ง/นาที ต่อ IP)
  const limit = rateLimit(`join:${clientIp(req)}`, 5, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'พยายามบ่อยเกินไป ลองใหม่ภายหลัง' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
    );
  }

  let session;
  try {
    session = requireSession();
  } catch (res) {
    return res as NextResponse;
  }

  let code = '';
  try {
    code = normalizeCode((await req.json())?.code || '');
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }
  if (!isValidCodeFormat(code)) {
    return NextResponse.json({ error: 'รูปแบบโค้ดไม่ถูกต้อง' }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  // 1) เป็น Book Code (admin_code) ➔ เข้าร่วมเป็น Admin
  const { data: book } = await db.from('books').select('id').eq('admin_code', code).maybeSingle();
  if (book) {
    const up = await db
      .from('memberships')
      .upsert({ user_id: session.userId, book_id: book.id, role: 'admin' }, { onConflict: 'user_id,book_id' });
    if (up.error) return NextResponse.json({ error: up.error.message }, { status: 500 });
    setSessionCookie({ ...session, bookId: book.id, role: 'admin', personId: undefined });
    return NextResponse.json({ role: 'admin', bookId: book.id });
  }

  // 2) เป็น Personal Code ➔ ผูก user กับ person + เข้าร่วมเป็น Viewer
  const { data: person } = await db
    .from('people')
    .select('id, book_id')
    .eq('personal_code', code)
    .maybeSingle();
  if (person) {
    await db.from('people').update({ user_id: session.userId }).eq('id', person.id);
    const up = await db.from('memberships').upsert(
      { user_id: session.userId, book_id: person.book_id, role: 'viewer', person_id: person.id },
      { onConflict: 'user_id,book_id' }
    );
    if (up.error) return NextResponse.json({ error: up.error.message }, { status: 500 });
    setSessionCookie({ ...session, bookId: person.book_id, role: 'viewer', personId: person.id });
    return NextResponse.json({ role: 'viewer', bookId: person.book_id });
  }

  return NextResponse.json({ error: 'ไม่พบโค้ดนี้ในระบบ' }, { status: 404 });
}
