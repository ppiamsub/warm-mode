// โครงสร้างข้อมูลหลักของ Debt Ledger (โมเดล multi-account — อ้างอิง PROJECT.md)

export type Role = 'admin' | 'viewer';

// ── Database rows ─────────────────────────────────────────

export interface User {
  id: string;
  line_uid: string;
  display_name: string | null;
  created_at: string;
}

export interface Book {
  id: string;
  name: string;
  admin_code: string;
  created_at: string;
}

export interface Person {
  id: string;
  book_id: string;
  name: string;
  personal_code: string;
  user_id: string | null;
  created_at: string;
}

export interface Membership {
  id: string;
  user_id: string;
  book_id: string;
  role: Role;
  person_id: string | null;
  created_at: string;
}

export interface Entry {
  id: string;
  person_id: string;
  description: string;
  amount: number;
  paid_amount: number;
  entry_date: string;
  created_at: string;
}

// ── Session (HTTP-Only cookie) ────────────────────────────
// ตัวตนหลัก = user (จาก LINE) · context ปัจจุบัน = บัญชีที่เลือกอยู่
export interface Session {
  lineUid: string;
  userId: string;
  name: string;
  // set เมื่อเลือกบัญชีจากหน้า Hub แล้ว
  bookId?: string;
  role?: Role;
  personId?: string;
}

// ── View models ───────────────────────────────────────────

import type { PaymentStatus } from '@/lib/theme';

// การ์ดบัญชี 1 ใบในหน้า Hub
export interface Account {
  bookId: string;
  bookName: string;
  role: Role;
  personId?: string;
  subtitle: string; // เช่น "ผู้ดูแล · 8 สมาชิก" หรือ "สมาชิก · ค้าง ฿9,000"
}

export interface EntryView extends Entry {
  remaining: number;
  status: PaymentStatus;
  progress: number;
}

export interface PersonSummary {
  id: string;
  name: string;
  initial: string;
  entryCount: number;
  updatedLabel: string;
  totalRemaining: number;
  progress: number;
  status: PaymentStatus;
}
