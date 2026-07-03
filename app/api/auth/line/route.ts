// POST /api/auth/line — รับ line_uid ➔ upsert users ➔ คืน Session ฐาน + รายการบัญชี
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { setSessionCookie } from '@/lib/auth';
import { loadAccounts } from '@/lib/accounts';
import type { Session } from '@/types';

export async function POST(req: Request) {
  let line_uid: string | undefined;
  let display_name: string | undefined;
  let picture_url: string | undefined;
  try {
    ({ line_uid, display_name, picture_url } = await req.json());
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }
  if (!line_uid) {
    return NextResponse.json({ error: 'ต้องมี line_uid' }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  // upsert user จาก line_uid (ตัวตนหลัก) — อัปเดตชื่อ/รูป LINE ให้ล่าสุดเสมอ
  let { data: user } = await db.from('users').select('id, display_name').eq('line_uid', line_uid).maybeSingle();
  if (!user) {
    const ins = await db
      .from('users')
      .insert({ line_uid, display_name: display_name ?? null, picture_url: picture_url ?? null })
      .select('id, display_name')
      .single();
    if (ins.error) return NextResponse.json({ error: ins.error.message }, { status: 500 });
    user = ins.data;
  } else if (display_name || picture_url) {
    const patch: Record<string, unknown> = {};
    if (display_name) patch.display_name = display_name;
    if (picture_url) patch.picture_url = picture_url;
    await db.from('users').update(patch).eq('id', user.id);
  }

  // ตั้ง session ฐาน (ยังไม่เลือกบัญชี)
  const session: Session = {
    lineUid: line_uid,
    userId: user!.id,
    name: user!.display_name || display_name || 'ผู้ใช้ LINE',
  };
  setSessionCookie(session);

  const accounts = await loadAccounts(db, user!.id);
  return NextResponse.json({ userId: user!.id, accounts });
}
