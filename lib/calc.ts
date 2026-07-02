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

/** ฟอร์แมตเงินบาทแบบมีคอมมา: 48750 ➔ "฿48,750" */
export function baht(n: number): string {
  return '฿' + Math.round(n).toLocaleString('en-US');
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
