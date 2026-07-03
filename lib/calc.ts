// Logic คำนวณยอด — ใช้ร่วมกันทั้ง Frontend และ API (กฎ On-the-fly Calculation)
import type { Entry, EntryView, PersonSummary } from '@/types';
import type { PaymentStatus } from '@/lib/theme';

/** สถานะการชำระของ 1 รายการ จาก amount / paid_amount */
export function statusOf(amount: number, paid: number): PaymentStatus {
  if (paid <= 0) return 'overdue';
  if (paid >= amount) return 'paid';
  return 'partial';
}

/** แปลง Entry ดิบ ➔ view model พร้อม remaining / status / progress */
export function toEntryView(entry: Entry): EntryView {
  const remaining = Math.max(entry.amount - entry.paid_amount, 0);
  const progress = entry.amount > 0 ? Math.min(entry.paid_amount / entry.amount, 1) : 0;
  return { ...entry, remaining, progress, status: statusOf(entry.amount, entry.paid_amount) };
}

/** รวมยอดของบุคคลจากรายการทั้งหมด */
export function summarize(
  person: { id: string; name: string },
  entries: Entry[],
  updatedLabel: string
): PersonSummary {
  const total = entries.reduce((s, e) => s + e.amount, 0);
  const paid = entries.reduce((s, e) => s + e.paid_amount, 0);
  const totalRemaining = Math.max(total - paid, 0);
  const progress = total > 0 ? Math.min(paid / total, 1) : 1;

  let status: PaymentStatus;
  if (totalRemaining <= 0) status = 'paid';
  else if (paid > 0) status = 'partial';
  else status = 'overdue';

  return {
    id: person.id,
    name: person.name,
    initial: person.name.trim().charAt(0) || '?',
    entryCount: entries.length,
    updatedLabel,
    totalRemaining,
    progress,
    status,
  };
}

/** ปัดเป็นทศนิยม 2 ตำแหน่ง (กันความคลาดเคลื่อน float) */
export function round2(n: number): number {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

/** กรอง input ยอดเงิน: ตัวเลข + จุดทศนิยมได้สูงสุด 2 ตำแหน่ง (เก็บเป็น string ดิบ) */
export function sanitizeAmount(s: string): string {
  const cleaned = s.replace(/[^\d.]/g, '');
  const parts = cleaned.split('.');
  let out = parts[0];
  if (parts.length > 1) out += '.' + parts.slice(1).join('').slice(0, 2);
  return out;
}

/** ใส่คอมมาให้ input ยอดเงินโดยคงทศนิยมที่กำลังพิมพ์ไว้: "1234.5" ➔ "1,234.5" */
export function formatAmountInput(raw: string): string {
  if (raw === '' || raw === '.') return raw;
  const [i, d] = raw.split('.');
  const intF = (parseInt(i || '0', 10) || 0).toLocaleString('en-US');
  return d != null ? `${intF}.${d}` : intF;
}

/** ฟอร์แมตเงินบาทแบบมีคอมมา + ทศนิยมสูงสุด 2 ตำแหน่ง: 48750 ➔ "฿48,750", 48750.5 ➔ "฿48,750.50" */
export function baht(n: number): string {
  const r = round2(n);
  const hasFraction = Math.round(r * 100) % 100 !== 0;
  return '฿' + r.toLocaleString('en-US', { minimumFractionDigits: hasFraction ? 2 : 0, maximumFractionDigits: 2 });
}

/** คีย์เดือนปัจจุบันตามเวลาไทย (Asia/Bangkok, UTC+7): "YYYY-MM" */
export function currentMonthKeyTH(): string {
  const bkk = new Date(Date.now() + 7 * 3600 * 1000);
  return `${bkk.getUTCFullYear()}-${String(bkk.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** ยอดค้างเก็บถึงเดือนนี้ = งวดผ่อนที่ยังไม่จ่ายและครบกำหนดภายในเดือนปัจจุบันหรือก่อนหน้า (รวมงวดค้างสะสม, คำนวณเป็นสตางค์) */
export function dueThisMonth(installments: { amount: number; due_date: string; paid: boolean }[]): number {
  const mk = currentMonthKeyTH();
  const cents = installments
    .filter((i) => !i.paid && String(i.due_date).slice(0, 7) <= mk)
    .reduce((s, i) => s + Math.round(Number(i.amount) * 100), 0);
  return cents / 100;
}

const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

/** วันที่ไทยแบบสั้น: "2025-07-02" ➔ "2 ก.ค." */
export function thaiShort(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${d.getDate()} ${TH_MONTHS[d.getMonth()]}`;
}

/** วันที่ไทยเต็ม (พ.ศ.): "2025-06-15" ➔ "15 มิ.ย. 2568" */
export function thaiFull(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${d.getDate()} ${TH_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
}
