// POST /api/me/leave — สมาชิก (Viewer) ออกจากบัญชีนี้ด้วยตัวเอง
// ลบ membership viewer + ปลดการผูกกับ person + reset session เป็นฐาน (ไม่มีบัญชี)
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireSession } from '@/lib/guard';
import { setSessionCookie } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function POST() {
  let session;
  try {
    session = requireSession();
  } catch (res) {
    return res as NextResponse;
  }
  if (session.role !== 'viewer' || !session.bookId || !session.personId) {
    return NextResponse.json({ error: 'ต้องเป็นสมาชิก (Viewer) ของบัญชีนี้' }, { status: 403 });
  }

  const db = getSupabaseAdmin();
  const { data: person } = await db.from('people').select('name').eq('id', session.personId).maybeSingle();

  await db.from('memberships').delete().eq('user_id', session.userId).eq('book_id', session.bookId).eq('role', 'viewer');
  await db.from('people').update({ user_id: null }).eq('id', session.personId).eq('user_id', session.userId);

  await logActivity(db, {
    bookId: session.bookId,
    session,
    action: 'person_rename', // หมวดแก้ไขทั่วไป
    summary: `ผู้เข้าร่วม "${person?.name ?? ''}" ออกจากบัญชีเอง`,
    personId: session.personId,
    personName: person?.name ?? null,
  });

  // ล้างบริบทบัญชีออกจาก session (เหลือแค่ตัวตน LINE)
  setSessionCookie({ lineUid: session.lineUid, userId: session.userId, name: session.name });

  return NextResponse.json({ ok: true });
}
