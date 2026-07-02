// GET /api/me — ข้อมูลของ Viewer (person + entries ของตัวเอง)
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireSession } from '@/lib/guard';

export const dynamic = 'force-dynamic';

export async function GET() {
  let session;
  try {
    session = requireSession();
  } catch (res) {
    return res as NextResponse;
  }
  if (session.role !== 'viewer' || !session.personId) {
    return NextResponse.json({ error: 'ต้องเป็นสมาชิก (Viewer) ของบัญชีนี้' }, { status: 403 });
  }

  const db = getSupabaseAdmin();
  const { data: person } = await db
    .from('people')
    .select('id, book_id, name, personal_code, user_id, created_at')
    .eq('id', session.personId)
    .maybeSingle();
  if (!person) return NextResponse.json({ error: 'ไม่พบข้อมูล' }, { status: 404 });

  const { data: entries } = await db
    .from('entries')
    .select('id, person_id, description, amount, paid_amount, entry_date, created_at')
    .eq('person_id', session.personId)
    .order('entry_date', { ascending: false });

  return NextResponse.json({ person, entries: entries ?? [] });
}
