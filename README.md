# Debt Ledger — สมุดเก็บเงิน

ระบบติดตามยอดเงินที่ต้องเก็บจากสมาชิก พร้อม LINE Login (LIFF) แยกสิทธิ์ Admin / Viewer

UI implement ตามดีไซน์ `Debt Ledger.dc.html` (5 หน้าจอ · ธีมเขียว · ภาษาไทย · มือถือ)

## Tech Stack
- **Next.js 14** (App Router) + TypeScript
- **LINE LIFF SDK v2** — auto-login ด้วย LINE UID
- **Supabase** (PostgreSQL) — ข้อมูล + RLS
- **Vercel** — hosting

## เริ่มใช้งาน (Dev)
```bash
npm install
cp .env.example .env.local   # ใส่ค่า LIFF ID / Supabase keys
npm run dev
```
เปิด http://localhost:3000

> เปิดบนเบราว์เซอร์ปกติได้เลย — ถ้าไม่ตั้ง `NEXT_PUBLIC_LIFF_ID` ระบบจะเข้าโหมด mock
> (ปุ่ม "เข้าสู่ระบบ" พาเข้า dashboard ตามบทบาทที่เลือก โดยใช้ข้อมูลตัวอย่าง)

## หน้าจอ
| # | Route | หน้าจอ |
| :- | :-- | :-- |
| 1 | `/` | เข้าสู่ระบบ (แท็บ Admin/Viewer + โค้ด + LINE) |
| 2 | `/admin` | แดชบอร์ด Admin (สรุปยอด + รายชื่อสมาชิก) |
| 3 | `/admin/person/[id]` | รายละเอียดสมาชิก + รายการ |
| 4 | (bottom sheet) | อัปเดตการจ่ายเงิน |
| 5 | `/viewer` | หน้าสมาชิก (ยอดของฉัน + ประวัติจ่าย) |

## โครงสร้าง
```
app/            หน้า + API Routes
components/     UI (PersonCard, EntryRow, SummaryCard, PaymentSheet, LiffProvider)
lib/            theme, calc, supabase, codes, auth, guard, rateLimit, mock
types/          โครงสร้างข้อมูล
supabase/       schema.sql (ตาราง + RLS)
```

## Database
รัน `supabase/schema.sql` ใน Supabase SQL Editor เพื่อสร้างตาราง `books`, `people`, `entries` พร้อม RLS

## ความปลอดภัย
- Session เก็บเป็น **HTTP-Only Cookie** เซ็นด้วย HMAC (`lib/auth.ts`)
- `line_uid` ฝั่ง client ใช้แสดงผล + ส่งไปยืนยันที่ Backend เท่านั้น
- **Rate limiting** กันการเดา Invite Code (`lib/rateLimit.ts`)
- ยอดค้างชำระคำนวณสด (`amount - paid_amount`) — `lib/calc.ts`
