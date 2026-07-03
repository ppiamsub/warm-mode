// DELETE /api/people/:id/viewer — นำผู้เข้าร่วม (Viewer) ออกจากสมาชิกคนนี้  [Admin]
// ลบ membership viewer + เคลียร์ people.user_id → ผู้ใช้คนนั้นหมดสิทธิ์ดูบัญชีนี้
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/guard';
import { logActivity } from '@/lib/activity';

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  let session;
  try {
    session = requireAdmin();
  } catch (res) {
    return res as NextResponse;
  }

  const db = getSupabaseAdmin();
  const { data: person } = await db
    .from('people')
    .select('id, name, user_id')
    .eq('id', params.id)
    .eq('book_id', session.bookId)
    .maybeSingle();
  if (!person) return NextResponse.json({ error: 'ไม่พบสมาชิกในบัญชีนี้' }, { status: 404 });
  if (!person.user_id) return NextResponse.json({ error: 'สมาชิกนี้ยังไม่มีผู้เข้าร่วม' }, { status: 400 });

  // ลบสิทธิ์ viewer ของผู้ใช้คนนั้นในบัญชีนี้ + ปลดการผูกกับสมาชิก
  await db.from('memberships').delete().eq('user_id', person.user_id).eq('book_id', session.bookId).eq('role', 'viewer');
  await db.from('people').update({ user_id: null }).eq('id', params.id);

  await logActivity(db, {
    bookId: session.bookId,
    session,
    action: 'person_rename', // ใช้หมวดแก้ไขทั่วไป
    summary: `นำผู้เข้าร่วม (Viewer) ออกจากสมาชิก "${person.name}"`,
    personId: params.id,
    personName: person.name,
  });

  return NextResponse.json({ ok: true });
}
