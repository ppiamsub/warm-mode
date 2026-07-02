// ข้อมูลตัวอย่างตรงกับ Debt Ledger.dc.html — ใช้แสดง UI ระหว่างยังไม่ต่อ Supabase
import type { Account, Entry, Person } from '@/types';

export const MOCK_USER = { id: 'u1', name: 'คุณสมชาย', initial: 'ส' };

export const MOCK_BOOK = {
  id: 'book-1',
  shopName: 'ร้านป้านิด',
  adminInitial: 'น',
};

// บัญชีที่ผู้ใช้เป็นสมาชิก (หน้า Hub) — เป็น Admin บัญชีตัวเอง + Viewer ในบัญชีคนอื่น
export const MOCK_ACCOUNTS: Account[] = [
  { bookId: 'book-1', bookName: 'ร้านป้านิด', role: 'admin', subtitle: 'ผู้ดูแล · 8 สมาชิก · ค้างเก็บ ฿48,750' },
  { bookId: 'book-2', bookName: 'ร้านเจ๊หมวย', role: 'viewer', personId: 'p1', subtitle: 'สมาชิก · ยอดของฉันค้าง ฿9,000' },
];

// รายชื่อสมาชิก (หน้า Admin Dashboard)
export const MOCK_PEOPLE: (Person & { avatarBg: string; avatarColor: string })[] = [
  { id: 'p1', book_id: 'book-1', name: 'สมชาย ใจดี', personal_code: 'SC-8842', user_id: null, created_at: '2025-07-02', avatarBg: '#dff0e6', avatarColor: '#1f8a5b' },
  { id: 'p2', book_id: 'book-1', name: 'อารีย์ แซ่ลี้', personal_code: 'AR-1120', user_id: null, created_at: '2025-07-01', avatarBg: '#dceeee', avatarColor: '#167e73' },
  { id: 'p3', book_id: 'book-1', name: 'ธนพล วงศ์ทอง', personal_code: 'TN-3390', user_id: null, created_at: '2025-06-30', avatarBg: '#e8efd8', avatarColor: '#5c7a2a' },
  { id: 'p4', book_id: 'book-1', name: 'ปิยะ มั่งมี', personal_code: 'PY-7781', user_id: null, created_at: '2025-06-28', avatarBg: '#e3f4ea', avatarColor: '#1f8a5b' },
];

// วันที่อัปเดตล่าสุดของแต่ละคน (label ในการ์ด)
export const MOCK_UPDATED: Record<string, string> = {
  p1: 'อัปเดต 2 ก.ค.',
  p2: 'อัปเดต 1 ก.ค.',
  p3: 'อัปเดต 30 มิ.ย.',
  p4: 'อัปเดต 28 มิ.ย.',
};

// รายการหนี้ต่อคน
export const MOCK_ENTRIES: Record<string, Entry[]> = {
  p1: [
    { id: 'e1', person_id: 'p1', description: 'ค่าของชำ', amount: 5000, paid_amount: 5000, entry_date: '2025-06-15', created_at: '2025-06-15' },
    { id: 'e2', person_id: 'p1', description: 'ค่าเครื่องดื่ม', amount: 6000, paid_amount: 1000, entry_date: '2025-06-20', created_at: '2025-06-20' },
    { id: 'e3', person_id: 'p1', description: 'ค่าสินค้าฝากซื้อ', amount: 4000, paid_amount: 0, entry_date: '2025-06-25', created_at: '2025-06-25' },
  ],
  p2: [
    { id: 'e4', person_id: 'p2', description: 'ค่าวัตถุดิบ', amount: 12000, paid_amount: 1500, entry_date: '2025-06-18', created_at: '2025-06-18' },
    { id: 'e5', person_id: 'p2', description: 'ค่าขนส่ง', amount: 8000, paid_amount: 0, entry_date: '2025-06-22', created_at: '2025-06-22' },
  ],
  p3: [
    { id: 'e6', person_id: 'p3', description: 'ค่าเช่าแผง', amount: 10000, paid_amount: 8000, entry_date: '2025-06-10', created_at: '2025-06-10' },
    { id: 'e7', person_id: 'p3', description: 'ค่าน้ำแข็ง', amount: 2500, paid_amount: 2000, entry_date: '2025-06-20', created_at: '2025-06-20' },
  ],
  p4: [
    { id: 'e8', person_id: 'p4', description: 'ค่าของฝาก', amount: 3000, paid_amount: 3000, entry_date: '2025-06-28', created_at: '2025-06-28' },
  ],
};

// สรุปยอดรวมทั้งร้าน (หัวการ์ด Admin) — ตรงกับดีไซน์
export const MOCK_HEADLINE = {
  totalRemaining: 48750,
  collectedThisMonth: 12300,
  peopleCount: 8,
};

export function getPersonEntries(personId: string): Entry[] {
  return MOCK_ENTRIES[personId] ?? [];
}
