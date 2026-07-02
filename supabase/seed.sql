-- ═══════════════════════════════════════════════════════════
-- Debt Ledger — ข้อมูลตัวอย่าง (Seed) ตรงกับดีไซน์
-- รันหลัง schema.sql · ใช้ทดสอบ flow จริง
-- Book Code สำหรับเข้าร่วมเป็น Admin: BK-482913
-- Personal Code (สมชาย) สำหรับเข้าร่วมเป็น Viewer: SC-8842
-- ═══════════════════════════════════════════════════════════

WITH b AS (
  INSERT INTO books (name, admin_code)
  VALUES ('ร้านป้านิด', 'BK-482913')
  RETURNING id
),
p AS (
  INSERT INTO people (book_id, name, personal_code)
  SELECT b.id, v.name, v.code
  FROM b, (VALUES
    ('สมชาย ใจดี', 'SC-8842'),
    ('อารีย์ แซ่ลี้', 'AR-1120'),
    ('ธนพล วงศ์ทอง', 'TN-3390'),
    ('ปิยะ มั่งมี', 'PY-7781')
  ) AS v(name, code)
  RETURNING id, name
)
INSERT INTO entries (person_id, description, amount, paid_amount, entry_date)
SELECT p.id, e.description, e.amount, e.paid, e.d::date
FROM p JOIN (VALUES
  ('สมชาย ใจดี',  'ค่าของชำ',        5000, 5000, '2025-06-15'),
  ('สมชาย ใจดี',  'ค่าเครื่องดื่ม',   6000, 1000, '2025-06-20'),
  ('สมชาย ใจดี',  'ค่าสินค้าฝากซื้อ', 4000,    0, '2025-06-25'),
  ('อารีย์ แซ่ลี้', 'ค่าวัตถุดิบ',      12000, 1500, '2025-06-18'),
  ('อารีย์ แซ่ลี้', 'ค่าขนส่ง',         8000,    0, '2025-06-22'),
  ('ธนพล วงศ์ทอง', 'ค่าเช่าแผง',       10000, 8000, '2025-06-10'),
  ('ธนพล วงศ์ทอง', 'ค่าน้ำแข็ง',        2500, 2000, '2025-06-20'),
  ('ปิยะ มั่งมี',   'ค่าของฝาก',         3000, 3000, '2025-06-28')
) AS e(pname, description, amount, paid, d) ON e.pname = p.name;
