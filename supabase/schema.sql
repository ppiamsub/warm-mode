-- ═══════════════════════════════════════════════════════════
-- Debt Ledger — Supabase Schema + Row Level Security
-- โมเดล Multi-Account: users ⇄ memberships ⇄ books
-- รันใน Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- 1. ผู้ใช้ (1 LINE user = 1 record) — ตัวตนหลัก
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_uid TEXT UNIQUE NOT NULL,      -- หัวใจของ Auto-login (unique ที่เดียว)
  display_name TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- 2. สมุดบัญชีหลัก
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'บัญชีของฉัน',
  admin_code TEXT UNIQUE NOT NULL,    -- Book Code: เข้าร่วมเป็น Admin
  created_at TIMESTAMP DEFAULT now()
);

-- 3. รายชื่อสมาชิกในบัญชี
CREATE TABLE IF NOT EXISTS people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  personal_code TEXT UNIQUE NOT NULL, -- Personal Code: เข้าร่วมเป็น Viewer
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- LINE user ที่ผูกกับคนนี้
  created_at TIMESTAMP DEFAULT now()
);

-- 4. ความเป็นสมาชิก (หัวใจ multi-account) — แหล่งข้อมูลหน้า Hub
CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin','viewer')),
  person_id UUID REFERENCES people(id) ON DELETE CASCADE, -- set เมื่อ role='viewer'
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE (user_id, book_id)           -- 1 user มีได้ 1 บทบาทต่อบัญชี
);

-- 5. รายการ
CREATE TABLE IF NOT EXISTS entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES people(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),         -- ต้องมากกว่า 0
  paid_amount NUMERIC DEFAULT 0 CHECK (paid_amount >= 0), -- ต้อง >= 0
  entry_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT now()
);

-- 6. งวดผ่อนจ่ายของแต่ละรายการ (installment plan)
CREATE TABLE IF NOT EXISTS installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
  seq INT NOT NULL,                                   -- งวดที่ (1,2,3,...)
  amount NUMERIC NOT NULL CHECK (amount > 0),         -- ยอดงวดนี้ (แก้ไขได้)
  due_date DATE NOT NULL,                             -- กำหนดชำระ
  paid BOOLEAN NOT NULL DEFAULT false,               -- เก็บงวดนี้แล้วหรือยัง
  paid_at DATE,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_book ON memberships(book_id);
CREATE INDEX IF NOT EXISTS idx_people_book ON people(book_id);
CREATE INDEX IF NOT EXISTS idx_entries_person ON entries(person_id);
CREATE INDEX IF NOT EXISTS idx_installments_entry ON installments(entry_id);

-- ═══════════════════════════════════════════════════════════
-- Row Level Security
-- API Routes ใช้ service_role (ข้าม RLS) และบังคับสิทธิ์เองผ่าน session
-- เปิด RLS เพื่อบล็อกการเข้าถึงจาก anon/publishable key ฝั่ง client โดยตรง
-- ═══════════════════════════════════════════════════════════
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;

-- ไม่มี policy ให้ anon = ปฏิเสธการเข้าถึงจาก client โดยตรง
-- (ทุก query ต้องผ่าน API Route ที่ตรวจ session แล้วเท่านั้น)
