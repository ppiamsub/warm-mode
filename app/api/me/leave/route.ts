// POST /api/me/leave — สมาชิก (Viewer) ออกจากบัญชีนี้ด้วยตัวเอง
// รับ bookId ทาง body ได้ (กดจากหน้า Hub) — ถ้าไม่ส่งมาจะใช้บัญชีที่เลือกอยู่ใน session
// ลบ membership viewer + ปลดการผูกกับ person + ถ้าออกจากบัญชีที่เลือกอยู่ ให้ reset session เป็นฐาน
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireSession } from '@/lib/guard';
import { setSessionCookie } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function POST(req: Request) {
  let session;
  try {
    session = requireSession();
  } catch (res) {
    return res as NextResponse;
  }

  // bookId มาจาก body (กดออกจาก Hub) หรือ fallback เป็นบัญชีที่เลือกอยู่ใน session (กดจากหน้า Viewer)
  const body = await req.json().catch(() => ({}));
  const bookId: string | undefined = body?.bookId || session.bookId;
  if (!bookId) {
    return NextResponse.json({ error: 'ต้องระบุบัญชี' }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  // ตรวจว่าผู้ใช้เป็น "สมาชิก (Viewer)" ของบัญชีนี้จริง + ดึง person_id จาก membership เอง (ไม่พึ่ง session)
  const { data: mem } = await db
    .from('memberships')
    .select('role, person_id')
    .eq('user_id', session.userId)
    .eq('book_id', bookId)
    .maybeSingle();
  if (!mem || mem.role !== 'viewer') {
    return NextResponse.json({ error: 'ต้องเป็นสมาชิก (Viewer) ของบัญชีนี้' }, { status: 403 });
  }

  const personId: string | null = mem.person_id;
  const { data: person } = personId
    ? await db.from('people').select('name').eq('id', personId).maybeSingle()
    : { data: null };

  await db.from('memberships').delete().eq('user_id', session.userId).eq('book_id', bookId).eq('role', 'viewer');
  if (personId) {
    await db.from('people').update({ user_id: null }).eq('id', personId).eq('user_id', session.userId);
  }

  await logActivity(db, {
    bookId,
    session,
    action: 'person_rename', // หมวดแก้ไขทั่วไป
    summary: `ผู้เข้าร่วม "${person?.name ?? ''}" ออกจากบัญชีเอง`,
    personId: personId ?? undefined,
    personName: person?.name ?? null,
  });

  // ถ้ากำลังออกจากบัญชีที่เลือกอยู่ใน session → ล้างบริบทบัญชี (เหลือแค่ตัวตน LINE)
  if (session.bookId === bookId) {
    setSessionCookie({ lineUid: session.lineUid, userId: session.userId, name: session.name });
  }

  return NextResponse.json({ ok: true });
}
