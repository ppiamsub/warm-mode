// บันทึกประวัติการทำรายการ (Activity Log) — เรียกจาก API Routes หลัง mutation สำเร็จ
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Session } from '@/types';

export type ActivityAction =
  | 'entry_add' // เพิ่มรายการ
  | 'entry_edit' // แก้ไขรายการ (ยอด/ชื่อ/วันที่)
  | 'entry_delete' // ลบรายการ
  | 'pay' // กดจ่าย (รับชำระ)
  | 'plan_create' // สร้างแผนผ่อน
  | 'plan_delete' // ยกเลิกแผนผ่อน
  | 'installment_edit' // แก้ไขยอด/กำหนดชำระของงวด
  | 'installment_pay' // เก็บงวด
  | 'installment_unpay' // ยกเลิกการเก็บงวด
  | 'person_rename' // เปลี่ยนชื่อสมาชิก
  | 'person_delete' // ลบสมาชิก
  | 'book_rename'; // เปลี่ยนชื่อบัญชี

interface LogInput {
  bookId: string;
  session: Pick<Session, 'userId' | 'name'>;
  action: ActivityAction;
  summary: string;
  personId?: string | null;
  personName?: string | null;
  entryId?: string | null;
  detail?: Record<string, unknown> | null;
}

/** บันทึก log — ห่อ try/catch ไม่ให้ความล้มเหลวของ log ไปกระทบ operation หลัก */
export async function logActivity(db: SupabaseClient, input: LogInput): Promise<void> {
  try {
    await db.from('activity_log').insert({
      book_id: input.bookId,
      actor_user_id: input.session.userId ?? null,
      actor_name: input.session.name ?? null,
      action: input.action,
      person_id: input.personId ?? null,
      person_name: input.personName ?? null,
      entry_id: input.entryId ?? null,
      summary: input.summary,
      detail: input.detail ?? null,
    });
  } catch {
    // เงียบไว้ — log ล้มเหลวไม่ควรทำให้ request หลักพัง
  }
}

/** ดึง context ของรายการ (person + description) สำหรับใส่ใน log */
export async function entryLogContext(
  db: SupabaseClient,
  entryId: string
): Promise<{ personId: string | null; personName: string | null; description: string | null }> {
  const { data: e } = await db.from('entries').select('person_id, description').eq('id', entryId).maybeSingle();
  if (!e) return { personId: null, personName: null, description: null };
  const { data: p } = await db.from('people').select('name').eq('id', e.person_id).maybeSingle();
  return { personId: e.person_id, personName: p?.name ?? null, description: e.description };
}
