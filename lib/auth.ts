// จัดการ Session เป็น HTTP-Only Cookie (กฎเหล็ก: Secure Session)
import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import type { Session } from '@/types';

const COOKIE_NAME = 'dl_session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 วัน

function secret(): string {
  return process.env.SESSION_SECRET || 'dev-insecure-secret-change-me';
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

/** เข้ารหัส session ➔ "<base64 payload>.<hmac>" */
export function serializeSession(session: Session): string {
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

/** ถอดรหัส + ตรวจลายเซ็น (คืน null ถ้าถูกแก้ไข) */
export function parseSession(token: string | undefined): Session | null {
  if (!token) return null;
  const [payload, mac] = token.split('.');
  if (!payload || !mac) return null;
  const expected = sign(payload);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()) as Session;
  } catch {
    return null;
  }
}

/** ตั้ง session cookie แบบ HTTP-Only (เรียกใน Route Handler) */
export function setSessionCookie(session: Session) {
  cookies().set(COOKIE_NAME, serializeSession(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

/** อ่าน session ปัจจุบันจาก cookie */
export function getSession(): Session | null {
  return parseSession(cookies().get(COOKIE_NAME)?.value);
}

/** ล้าง session (logout) */
export function clearSessionCookie() {
  cookies().delete(COOKIE_NAME);
}
