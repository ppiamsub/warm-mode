// Logic สร้าง/ตรวจสอบ Invite Code (Book Code / Personal Code)
import { randomInt } from 'crypto';

// เลี่ยงตัวอักษรที่สับสน (0/O, 1/I) เพื่อให้กรอกง่ายบนมือถือ
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomBlock(len: number): string {
  let out = '';
  for (let i = 0; i < len; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

/** โค้ดบัญชีหลักของ Admin เช่น "BK-482913" */
export function generateBookCode(): string {
  let digits = '';
  for (let i = 0; i < 6; i++) digits += randomInt(10);
  return `BK-${digits}`;
}

/** โค้ดส่วนตัวของ Viewer เช่น "SC-8842" (นำ initial ของชื่อมาเป็น prefix ได้) */
export function generatePersonalCode(nameInitial?: string): string {
  const prefix = (nameInitial || randomBlock(2)).toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || randomBlock(2);
  let digits = '';
  for (let i = 0; i < 4; i++) digits += randomInt(10);
  return `${prefix}-${digits}`;
}

/** normalize โค้ดที่ผู้ใช้กรอก (ตัดช่องว่าง, พิมพ์ใหญ่) */
export function normalizeCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, '');
}

const CODE_RE = /^[A-Z]{2}-?\d{4,6}$/;

/** ตรวจรูปแบบเบื้องต้นก่อนยิง DB (กันการยิงมั่ว) */
export function isValidCodeFormat(input: string): boolean {
  return CODE_RE.test(normalizeCode(input));
}
