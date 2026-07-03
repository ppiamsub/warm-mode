// Logic ช่วยเหลือสำหรับแผนผ่อนจ่าย (installments)
import type { SupabaseClient } from '@supabase/supabase-js';

/** แบ่งยอดรวมเป็น n งวด (คำนวณเป็นสตางค์ รองรับทศนิยม 2 ตำแหน่ง งวดสุดท้ายรับเศษ) */
export function splitAmount(total: number, count: number): number[] {
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / count);
  const arr = Array(count).fill(base);
  arr[count - 1] = cents - base * (count - 1); // งวดสุดท้ายรับส่วนที่เหลือ
  return arr.map((c) => c / 100);
}

/** บวกเดือน (คงวันที่เดิม เท่าที่เดือนนั้นมี) — คืน YYYY-MM-DD */
export function addMonthsISO(startISO: string, months: number): string {
  const d = new Date(startISO + 'T00:00:00');
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** book_id ของ entry (ผ่าน person) — ใช้ตรวจสิทธิ์ */
export async function entryBookId(db: SupabaseClient, entryId: string): Promise<string | null> {
  const { data: e } = await db.from('entries').select('person_id').eq('id', entryId).maybeSingle();
  if (!e) return null;
  const { data: p } = await db.from('people').select('book_id').eq('id', e.person_id).maybeSingle();
  return p?.book_id ?? null;
}

/** คำนวณ paid_amount ของ entry ใหม่จากงวดที่จ่ายแล้ว (เรียกหลังแก้ installments) */
export async function recomputeEntryPaid(db: SupabaseClient, entryId: string): Promise<void> {
  const { data } = await db.from('installments').select('amount, paid').eq('entry_id', entryId);
  if (!data || data.length === 0) return; // ไม่มีแผนผ่อน — ไม่ยุ่งกับ paid_amount
  const cents = data.filter((i: any) => i.paid).reduce((s: number, i: any) => s + Math.round(Number(i.amount) * 100), 0);
  await db.from('entries').update({ paid_amount: cents / 100 }).eq('id', entryId);
}
