// GET /api/accounts — ดึงรายการบัญชีของผู้ใช้ปัจจุบัน (หน้า Hub)
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireSession } from '@/lib/guard';
import { loadAccounts } from '@/lib/accounts';

// อ่าน session cookie ➔ ต้องเรนเดอร์แบบ dynamic (ห้าม prerender)
export const dynamic = 'force-dynamic';

export async function GET() {
  let session;
  try {
    session = requireSession();
  } catch (res) {
    return res as NextResponse;
  }
  const db = getSupabaseAdmin();
  const accounts = await loadAccounts(db, session.userId);
  return NextResponse.json({ name: session.name, accounts });
}
