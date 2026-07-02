-- ═══════════════════════════════════════════════════════════
-- Migration 002 — แผนผ่อนจ่าย (Installments)
-- รันใน Supabase SQL Editor (ต่อจาก schema.sql)
-- ═══════════════════════════════════════════════════════════

-- ตารางงวดผ่อนของแต่ละรายการ (1 entry มีได้หลายงวด)
CREATE TABLE IF NOT EXISTS installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
  seq INT NOT NULL,                                   -- งวดที่ (1,2,3,...)
  amount NUMERIC NOT NULL CHECK (amount > 0),         -- ยอดงวดนี้ (แก้ไขได้)
  due_date DATE NOT NULL,                             -- กำหนดชำระ
  paid BOOLEAN NOT NULL DEFAULT false,               -- เก็บงวดนี้แล้วหรือยัง
  paid_at DATE,                                       -- วันที่จ่ายจริง
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_installments_entry ON installments(entry_id);

ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
-- ไม่มี policy ให้ anon = เข้าถึงผ่าน API (service_role) เท่านั้น
