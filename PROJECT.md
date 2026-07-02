# เอกสารออกแบบระบบ: Debt Ledger — สมุดเก็บเงิน (พร้อมระบบ LINE Login)

เอกสารการออกแบบสถาปัตยกรรมระบบติดตามยอดเงินที่ต้องเก็บจากสมาชิก พร้อมระบบ Invite Code และผูกบัญชีผ่าน **LINE Login (LIFF)** เพื่อแยกสิทธิ์การเข้าถึงระหว่าง Admin และ Viewer อย่างชัดเจน และให้ผู้ใช้เข้าใช้งานได้สะดวกที่สุด

---

## 1. ภาพรวมระบบและ Business Logic (System Overview & Rules)

### 1.1 Flow การเข้าใช้งาน (Login & Account Selection)

**ทุกครั้งต้อง Login ด้วย LINE ก่อนเสมอ** — ระบบใช้ `line_uid` เป็นตัวตนหลัก (1 LINE user = 1 record ในตาราง `users`) ผู้ใช้ 1 คนสามารถเป็นสมาชิกได้**หลายบัญชี**พร้อมกัน

1. **Login LINE** → ระบบ upsert `users` จาก `line_uid`
2. **หน้าเลือกบัญชี (Account Hub)** → แสดงรายการบัญชีที่ผู้ใช้เป็นสมาชิก (จากตาราง `memberships`) พร้อม 2 ทางเลือก:
   - ➕ **สร้างบัญชีของตัวเอง** → ได้ `admin_code` ใหม่ + เป็น **Admin** ของบัญชีนั้น
   - 🔑 **เข้าร่วมบัญชีคนอื่นด้วยโค้ด** → บทบาทขึ้นกับชนิดโค้ด (ดูตารางล่าง)
3. **เลือกบัญชี** → เข้าสู่ Dashboard ตามบทบาทในบัญชีนั้น

### 1.2 บทบาทผู้ใช้ในแต่ละบัญชี (Roles per Membership)
| บทบาท (Role) | ได้มาโดย | สิทธิ์การใช้งาน (Permissions) |
| :--- | :--- | :--- |
| **Admin** (ผู้ดูแล) | สร้างบัญชีใหม่ **หรือ** กรอก **โค้ดบัญชีหลัก (Book Code)** เพื่อเข้าร่วมเป็นผู้ดูแลร่วม | จัดการข้อมูลทั้งหมด: เพิ่ม/ลบคน, เพิ่ม/ลบรายการ, อัปเดตสถานะการจ่ายเงิน และดูสรุปยอดของทุกคน |
| **Viewer** (สมาชิก) | กรอก **โค้ดส่วนตัว (Personal Code)** เพื่อผูกตัวเองกับรายชื่อในบัญชี | ดูยอดค้างชำระและประวัติการจ่ายเงินของตัวเองเท่านั้น ไม่สามารถแก้ไขข้อมูลใดๆ ได้ |

### 1.3 กติกาหลักของระบบ (Core Rules)
- **Multi-Account Membership:** 1 LINE user (`users`) เป็นสมาชิกได้หลายบัญชี ผ่านตาราง `memberships` (user × book × role) — เป็น Admin ของบัญชีตัวเอง และเป็น Viewer/Admin ในบัญชีคนอื่นได้พร้อมกัน
- **Data Hierarchy:** 1 บัญชีหลัก (Book) มีสมาชิกได้หลายคน (People) และสมาชิกแต่ละคนมีรายการได้หลายรายการ (Entries)
- **LINE Integration (Login):**
  - ต้อง Login ผ่าน LINE (LIFF) เสมอ ระบบดึง `line_uid` มา upsert ตาราง `users`
  - หลัง login พาเข้า **หน้าเลือกบัญชี (Account Hub)** เสมอ — ไม่ข้ามไป Dashboard อัตโนมัติ (เพราะมีได้หลายบัญชี)
  - การเข้าร่วมบัญชีใหม่ทำได้จาก hub: สร้างบัญชีเอง หรือกรอกโค้ด (Book Code = Admin, Personal Code = Viewer)
- **Payment Tracking:** รองรับการจ่ายบางส่วน (Partial Payment) โดยเก็บ "ยอดเต็ม (Amount)" และ "ยอดที่จ่ายแล้ว (Paid Amount)"
- **On-the-fly Calculation:** ยอดค้างชำระ (Remaining) คำนวณสดจาก `Amount - Paid Amount` ฝั่ง Application/Query
- **Cascade Deletion:** ลบรายชื่อบุคคล (Person) ออกจากบัญชี ➔ รายการ (Entries) ของคนนั้นจะถูกลบทิ้งทั้งหมด

---

## 2. โครงสร้างฐานข้อมูล (Data Model)

แยกตัวตนผู้ใช้ (`users`) ออกจากบัญชี แล้วเชื่อมด้วยตาราง `memberships` เพื่อรองรับ 1 user หลายบัญชี · `line_uid` ย้ายมาอยู่ที่ `users` (unique ที่เดียว)

```sql
-- 1. ตารางผู้ใช้ (1 LINE user = 1 record) — ตัวตนหลักของระบบ
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_uid TEXT UNIQUE NOT NULL, -- LINE UID (หัวใจของ Auto-login)
  display_name TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- 2. ตารางสมุดบัญชีหลัก
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'บัญชีของฉัน',
  admin_code TEXT UNIQUE NOT NULL, -- Book Code: กรอกเพื่อเข้าร่วมเป็น Admin
  created_at TIMESTAMP DEFAULT now()
);

-- 3. ตารางรายชื่อสมาชิกในบัญชี
CREATE TABLE people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  personal_code TEXT UNIQUE NOT NULL, -- Personal Code: กรอกเพื่อเข้าร่วมเป็น Viewer
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- LINE user ที่ผูกกับคนนี้
  created_at TIMESTAMP DEFAULT now()
);

-- 4. ตารางความเป็นสมาชิก (หัวใจของ multi-account) — แหล่งข้อมูลของหน้า Hub
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin','viewer')),
  person_id UUID REFERENCES people(id) ON DELETE CASCADE, -- set เมื่อ role='viewer'
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE (user_id, book_id) -- 1 user มีได้ 1 บทบาทต่อบัญชี
);

-- 5. ตารางรายการ
CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES people(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  paid_amount NUMERIC DEFAULT 0 CHECK (paid_amount >= 0),
  entry_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT now()
);
```

---

## 3. เทคโนโลยีที่ใช้ (Tech Stack)

| ส่วนประกอบ | เทคโนโลยีที่เลือกใช้ | เหตุผล |
| :--- | :--- | :--- |
| **Frontend** | Next.js (React) | รองรับ SSR และ API Routes ขึ้นโปรเจกต์ได้รวดเร็ว |
| **LINE Integration**| LINE LIFF SDK v2 | ดึง Profile และ `line_uid` ของผู้ใช้ได้อัตโนมัติเมื่อเปิดผ่าน LINE |
| **Backend** | Next.js API Routes | จัดการ Logic ฝั่ง Server และ Validation |
| **Database & Auth** | Supabase (PostgreSQL) | จัดการ Database, ใช้ RLS สร้าง Policy ความปลอดภัย |
| **Hosting** | Vercel | ผูกกับ GitHub ทำ CI/CD Deploy อัตโนมัติ |

---

## 4. โครงสร้างโฟลเดอร์ (Project Structure)

```text
debt-ledger/
├── app/
│   ├── page.tsx                   # หน้าแรก (Login ด้วย LINE เสมอ)
│   ├── accounts/page.tsx          # หน้าเลือกบัญชี (Hub) + สร้าง/เข้าร่วมด้วยโค้ด
│   ├── admin/page.tsx             # Dashboard สำหรับ Admin
│   ├── viewer/page.tsx            # หน้าแสดงยอดค้างชำระส่วนตัวสำหรับ Viewer
│   └── api/
│       ├── auth/line/route.ts     # upsert users จาก line_uid ➔ คืน Session + memberships
│       ├── accounts/route.ts      # ดึงรายการบัญชีของผู้ใช้ (Hub)
│       ├── accounts/select/route.ts # เลือกบัญชี ➔ set context ลง Session
│       ├── books/route.ts         # สร้างบัญชีใหม่ + membership Admin
│       ├── join/route.ts          # เข้าร่วมด้วยโค้ด (Book/Personal Code)
│       ├── people/route.ts        # API สำหรับ CRUD คน
│       └── entries/route.ts       # API สำหรับ CRUD รายการ
├── components/
│   ├── LiffProvider.tsx           # Context Provider สำหรับ Initialize LINE LIFF
│   ├── PersonCard.tsx             
│   ├── EntryRow.tsx               
│   └── SummaryCard.tsx            
├── lib/
│   ├── supabase.ts                # Client เชื่อมต่อ Supabase
│   ├── codes.ts                   # Logic สร้าง/ตรวจสอบ Invite Code
│   └── auth.ts                    # ฟังก์ชันจัดการ Session Cookie
├── types/
│   └── index.ts                   
├── .env.local                     # เก็บ Liff ID, Supabase Keys (ห้าม Commit)
├── package.json
└── next.config.js
```

---

## 5. API Endpoints

| Method | Path | หน้าที่การทำงาน |
| :--- | :--- | :--- |
| `POST` | `/api/auth/line` | รับ `line_uid` ➔ upsert `users` ➔ คืน Session ฐาน + รายการบัญชี (memberships) |
| `GET` | `/api/accounts` | ดึงรายการบัญชีของผู้ใช้ปัจจุบัน (สำหรับหน้า Hub) |
| `POST` | `/api/accounts/select` | เลือกบัญชี (set `bookId`+`role` ลง Session) ➔ เข้า Dashboard |
| `POST` | `/api/books` | สร้างบัญชีใหม่ พร้อม Gen `admin_code` + สร้าง membership เป็น Admin |
| `POST` | `/api/join` | กรอกโค้ดเข้าร่วม ➔ Book Code=Admin / Personal Code=Viewer ➔ สร้าง membership |
| `POST` | `/api/people` | เพิ่มคนลงในบัญชี พร้อม Gen `personal_code` |
| `DELETE` | `/api/people/:id` | ลบรายชื่อคน (Cascade ลบ entries ด้วย) |
| `POST` | `/api/entries` | เพิ่มรายการใหม่ |
| `PATCH` | `/api/entries/:id` | อัปเดตยอดจ่าย `paid_amount` (จ่ายครบ/บางส่วน) |
| `DELETE` | `/api/entries/:id` | ลบรายการทิ้ง |

---

## 6. มาตรการความปลอดภัย (Security Checklist)

- [ ] **Row Level Security (RLS):** ตั้ง Policy บน Supabase เพื่อบล็อกการดึงข้อมูลข้ามบัญชี/ข้ามบุคคล
- [ ] **Secure Session:** Session จากการล็อกอินสำเร็จ ต้องเก็บเป็น HTTP-Only Cookie เสมอ
- [ ] **LIFF Security:** การยืนยันตัวตน LINE ต้องเช็คผ่าน API Backend โดยไม่เชื่อ `line_uid` จากฝั่ง Client แบบ 100% (อาจใช้ ID Token Verify ของ LINE ถ้าต้องการความปลอดภัยสูงสุด)
- [ ] **Code Rate Limiting:** ป้องกันการยิง Brute-Force เดา Invite Code

---

## 7. ขั้นตอนการพัฒนา (Roadmap)

1. [x] รวบรวม Requirement และอัปเดต Business Logic (เพิ่ม LINE Login + Multi-Account Hub)
2. [x] ติดตั้ง Next.js + LINE LIFF SDK (`@line/liff`) + `@supabase/ssr`
3. [x] ตั้งค่า Supabase Project และ Run Schema (`users`, `books`, `people`, `memberships`, `entries`) + Seed
4. [x] พัฒนา API Auth Flow: `/api/auth/line` (upsert user), `/api/join`, `/api/accounts`, `/api/accounts/select`, `/api/books`
5. [x] พัฒนาหน้า Frontend: LiffProvider ➔ Login (LINE) ➔ Hub เลือกบัญชี ➔ Dashboard (Admin/Viewer)
6. [x] ต่อ Dashboard กับข้อมูลจริง: `/api/overview`, `/api/people/:id`, `/api/me` + ปุ่มบันทึกจ่าย/เพิ่มรายการ/เพิ่มสมาชิก (PATCH/POST จริง)
7. [x] เปิด RLS บนทุกตาราง (API ใช้ service_role + บังคับสิทธิ์ผ่าน session cookie) · ทดสอบ end-to-end ผ่าน (create/join/pay/add)
8. [ ] สร้าง LINE Login Channel + LIFF ID จริง (ตอนนี้ใช้ dev-login แทนในโหมด mock)
9. [ ] ทดสอบ Edge Cases (ล็อกอินเครื่องอื่น, ถอนสิทธิ์แอป LINE, RLS policy ละเอียด)
10. [~] Deploy ขึ้น Vercel (deploy แล้วที่ `https://warm-mode.vercel.app` — เหลือใส่ env vars บน Vercel)

---

## 8. บันทึกคำสั่ง & การเปลี่ยนแปลงสำคัญ (Change Log)

> บันทึกคำสั่ง/การตัดสินใจสำคัญจากผู้ใช้ เพื่อ track ย้อนหลังได้ (ต่อท้ายเรื่อย ๆ)

### 2026-07-02
- Implement ดีไซน์ `Debt Ledger.dc.html` เป็น Next.js 14 (App Router) + LIFF + Supabase — 5 หน้าจอ
- เปลี่ยนคำเรียกผู้ใช้ทั้งระบบเป็น **ผู้ดูแล** และ **สมาชิก** (เลิกใช้คำเดิม)
- ต่อ Supabase จริง (`@supabase/ssr`, publishable key, middleware refresh session)

### 2026-07-03
- **Redesign เป็น Multi-Account:** เพิ่มตาราง `users` + `memberships`, หน้า Hub เลือกบัญชี, login ผ่าน LINE ก่อนเสมอ
- เข้าร่วมด้วยโค้ดตามชนิด: **Book Code → Admin**, **Personal Code → Viewer**
- Admin สร้างบัญชีใหม่เองได้ (Gen `admin_code` + membership)
- ต่อ Dashboard ทั้ง 3 หน้า (`/admin`, `/admin/person/[id]`, `/viewer`) ให้ดึงข้อมูลจริง + ปุ่มบันทึกจ่าย/เพิ่มรายการ/เพิ่มสมาชิก (เขียน DB จริง)
- **Deploy Vercel:** เพิ่ม `vercel.json` (framework nextjs), harden middleware กัน crash เมื่อ env หาย — ต้องใส่ env vars บน Vercel (Supabase + `SESSION_SECRET` + `NEXT_PUBLIC_LIFF_ID`)
- **LINE LIFF ID:** `2010579189-lrqE98iv` (Channel ID `2010579189`) — Endpoint URL ต้องตั้งเป็น URL ของ Vercel + scope `profile`,`openid`
- แสดง **รูปโปรไฟล์ + ชื่อ LINE** ที่หน้า Hub
- ปรับดีไซน์หน้า Hub: ปุ่มออกจากระบบ, section label, empty state, divider "เพิ่มบัญชี"
- **ข้อตกลงการทำงาน:** ต่อไปคำสั่ง/การตัดสินใจสำคัญ ให้บันทึกใน Change Log นี้เสมอ เพื่อ track ย้อนหลัง
- หน้าเพิ่มรายการ: เปลี่ยนจาก `prompt` เป็นฟอร์ม bottom sheet (รายละเอียด + ยอด + **วันที่ default = วันนี้**)
- ลบคำภาษาไทยที่แปลว่า debt ออกจากทุกข้อความทั้งระบบ (UI + เอกสาร) — ใช้ **"รายการ"** และ **"ยอดค้างชำระ"** แทน
- **เพิ่มการผ่อนจ่าย (Installment Plan):** ตาราง `installments` (migration 002), แบ่งยอดเป็น N งวด กำหนดชำระรายเดือน, เก็บ/ยกเลิกงวด, **แก้ไขยอดงวดได้**, `paid_amount` คำนวณจากงวดที่จ่าย · Viewer เห็นตารางงวดแบบอ่านอย่างเดียว · API: `POST/DELETE /api/entries/:id/plan`, `PATCH/DELETE /api/installments/:id`
- **แก้ไขรายการได้ (ยอด/รายละเอียด/วันที่) เฉพาะเมื่อยังไม่มีการจ่าย** (paid_amount=0 และไม่มีแผนผ่อน) — ถ้าจ่ายแล้วจะบล็อก (409) · `PATCH /api/entries/:id` รองรับทั้งจ่ายเงินและแก้ไข พร้อมตรวจสิทธิ์บัญชี
- **หน้า Hub:** เพิ่มค้นหาชื่อบัญชี (แสดงเมื่อ > 3 บัญชี)
- **หน้าบัญชี (Admin):** จัดการบัญชี (แก้ชื่อ/ลบ ผ่านปุ่ม gear → sheet), จัดการสมาชิก (แก้ชื่อ/ดูรหัส/ลบ ที่หน้ารายละเอียด), ค้นหารายการ · API: `PATCH/DELETE /api/books/:id`, `PATCH /api/people/:id`
- **Dashboard:** หน้าสรุปยอด `/admin/summary` (รายเดือน/รายปี) + **Export .xlsx** (SheetJS) · `GET /api/book/entries` · BottomNav กดสลับหน้าได้
- **ปรับธีมเขียว-ขาวให้หรูหรา/ทันสมัย:** ปรับ design tokens (`lib/theme.ts`) เฉดมรกต + gradient หลายสต็อป, เงาแบบเลเยอร์อมเขียว, พื้นหลัง `globals.css` มีแสงเรืองบาง ๆ + กรอบมือถือลอยพรีเมียม, เงาการ์ดทั้งแอปเป็นเลเยอร์นุ่ม
