// Logic สร้าง/ตรวจสอบ Invite Code (Book Code / Personal Code)
import { randomInt } from 'crypto';

// เลี่ยงตัวอักษรที่สับสน (0/O, 1/I) เพื่อให้กรอกง่ายบนมือถือ
// prefix โค้ดส่วนตัวต้องเป็น "ตัวอักษรล้วน" (ไม่มีเลข) เพื่อให้ผ่าน isValidCodeFormat
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

function randomLetters(len: number): string {
  let out = '';
  for (let i = 0; i < len; i++) out += LETTERS[randomInt(LETTERS.length)];
  return out;
}

/** โค้ดบัญชีหลักของ Admin เช่น "BK-482913" */
export function generateBookCode(): string {
  let digits = '';
  for (let i = 0; i < 6; i++) digits += randomInt(10);
  return `BK-${digits}`;
}

/** โค้ดส่วนตัวของ Viewer เช่น "SC-8842" (นำ initial ของชื่อมาเป็น prefix ได้)
 *  prefix เป็นตัวอักษร A-Z เสมอ 2 ตัว — ดึงจากชื่อได้เท่าไรก็เติมสุ่มให้ครบ 2 */
export function generatePersonalCode(nameInitial?: string): string {
  let prefix = (nameInitial || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
  if (prefix.length < 2) prefix += randomLetters(2 - prefix.length);
  let digits = '';
  for (let i = 0; i < 4; i++) digits += randomInt(10);
  return `${prefix}-${digits}`;
}

/** normalize โค้ดที่ผู้ใช้กรอก (ตัดช่องว่าง, พิมพ์ใหญ่) */
export function normalizeCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, '');
}

// prefix 1–2 ตัว (อักษร/เลข) + เลข 4–6 หลัก — ยืดหยุ่นพอรับโค้ดเก่าที่เคย gen ผิดรูป
// (เป็นแค่ตัวกรองกันยิงมั่วก่อนถาม DB — การตรวจจริงคือ lookup ในฐานข้อมูล)
const CODE_RE = /^[A-Z0-9]{1,2}-?\d{4,6}$/;

/** ตรวจรูปแบบเบื้องต้นก่อนยิง DB (กันการยิงมั่ว) */
export function isValidCodeFormat(input: string): boolean {
  return CODE_RE.test(normalizeCode(input));
}
