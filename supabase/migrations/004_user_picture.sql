-- ═══════════════════════════════════════════════════════════
-- Migration 004 — เก็บรูปโปรไฟล์ LINE ของผู้ใช้ (สำหรับให้ Admin เห็นผู้เข้าร่วม Viewer)
-- รันใน Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

ALTER TABLE users ADD COLUMN IF NOT EXISTS picture_url TEXT;
