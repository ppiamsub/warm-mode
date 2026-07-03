-- ═══════════════════════════════════════════════════════════
-- Migration 003 — ประวัติการทำรายการ (Activity Log)
-- รันใน Supabase SQL Editor (ต่อจาก schema.sql / 002)
-- ═══════════════════════════════════════════════════════════

-- บันทึกทุกการกระทำสำคัญในบัญชี (เพิ่ม/แก้ไข/ลบ/กดจ่าย/แผนผ่อน)
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  actor_user_id UUID,           -- user ที่ทำ (อาจ null)
  actor_name TEXT,              -- ชื่อผู้ทำ ณ ตอนนั้น (denormalized กันข้อมูลหาย)
  action TEXT NOT NULL,         -- ประเภทการกระทำ (entry_add, entry_edit, pay, ...)
  person_id UUID,              -- สมาชิกที่เกี่ยวข้อง (อาจ null)
  person_name TEXT,            -- ชื่อสมาชิก ณ ตอนนั้น
  entry_id UUID,               -- รายการที่เกี่ยวข้อง (อาจ null)
  summary TEXT NOT NULL,       -- ข้อความสรุปพร้อมแสดงผล
  detail JSONB,                -- ข้อมูลเสริม (before/after)
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_book ON activity_log(book_id, created_at DESC);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
-- ไม่มี policy ให้ anon = เข้าถึงผ่าน API (service_role) เท่านั้น
