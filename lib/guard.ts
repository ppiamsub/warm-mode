// ตัวช่วยตรวจสิทธิ์ใน API Routes
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import type { Session } from '@/types';

/** คืน session ใดๆ ที่ผ่าน LINE login แล้ว (มี userId) */
export function requireSession(): Session {
  const s = getSession();
  if (!s || !s.userId) throw NextResponse.json({ error: 'ยังไม่ได้เข้าสู่ระบบ' }, { status: 401 });
  return s;
}

/** คืน session ที่เลือกบัญชีเป็น Admin แล้ว (มี bookId + role=admin) */
export function requireAdmin(): Session & { bookId: string } {
  const s = requireSession();
  if (s.role !== 'admin' || !s.bookId) {
    throw NextResponse.json({ error: 'ต้องเป็นผู้ดูแลของบัญชีนี้' }, { status: 403 });
  }
  return s as Session & { bookId: string };
}
