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
- **แผนผ่อนแบบเปิด/ปิด (collapsible):** หัวข้อ "แผนผ่อน N งวด" กดยุบ/ขยายดูรายการงวดได้ (เริ่มต้นยุบไว้) + แสดงสรุป "จ่ายแล้ว x/N" + ลูกศร chevron หมุนตามสถานะ (`components/EntryCard.tsx`, เพิ่ม `IconChevron`)
- **หน้ารายงานสรุป group ตามกำหนดชำระ (installment due schedule):** รายเดือน/รายปีจัดกลุ่มจาก **due_date ของงวดผ่อน** (ไม่ใช่ entry_date) → ข้อมูลเริ่มเดือนที่มียอดต้องจ่ายจริง (เช่น ก.ย.) · แต่ละเดือนแสดง **ต้องจ่าย / เก็บแล้ว / ค้างจ่าย** โดยเก็บแล้วอิงยอดงวดที่กดจ่าย + มี stamp "จ่ายจริง <วันที่ paid_at>" · **กดการ์ดเดือนเพื่อ drill-in เปิด bottom sheet ดูรายการงวดทั้งหมด** (สมาชิก/งวดที่/กำหนดชำระ/ยอด/stamp จ่ายจริง/สถานะ) · รายการไม่มีแผนผ่อนนับเป็นก้อนเดียวอิง entry_date
- **แบรนด์ Warm Mode (โลโก้มาสคอต):** ใช้ `src/logo.png` (หมาไซเบอร์แว่นเขียวนีออน) เป็นโลโก้ · คอมโพเนนต์ `components/ui/BrandLogo.tsx` (next/image auto-optimize; โลโก้ใหม่พื้นเข้ม → จัดใส่ **"การ์ดมืดนีออน"** gradient เขียวเข้ม + ring/เงานีออนมรกต + ประกายด้านบน ให้ดูตั้งใจและเข้าธีมไซเบอร์) · หน้า login โชว์โลโก้เป็น hero + wordmark "Warm Mode"/"สมุดเก็บเงิน" (แทนกล่อง ฿ เดิม) · Header หน้า Hub เพิ่ม wordmark "WARM MODE" + จุดนีออนเขียว · favicon `app/icon.svg` (อุ้งเท้านีออนบนพื้นมรกต, เลี่ยงแนบ PNG 5.9MB) · metadata title = "Warm Mode — สมุดเก็บเงิน"
- **ทุกหน้าดูเป็นทางเดียวกัน (unified header):** คอมโพเนนต์ `BrandMark` (จุดนีออน + "WARM MODE") วางเป็นแถบบนสุดของ header สีเขียวทุกหน้าเหมือนกัน — Hub, Admin, สมาชิก(person), สรุปยอด, ประวัติ, Viewer
- **รายงาน: ย้ายปุ่ม Export ขึ้นบนสุด**
- **รายงาน: แท็บ รายเดือน/รายปี (โครงใหม่):** *รายเดือน* = เฉพาะเดือนของ**ปีนี้** (ใหม่สุดก่อน) กดดูรายละเอียดงวด · *รายปี* = การ์ดสรุปต่อปี กดเข้าไปเปิด sheet **list เดือนของปีนั้น** แล้วกดเดือนดูงวดต่อได้ · Export เปลี่ยนเป็น **ชีต 1 = "สรุปรายปี"** (รวมยอดต่อปี) + **ชีตแยกเดือน เรียงใหม่สุด/เดือนปัจจุบันก่อน (sheet 2,3,4…)** ตัดถึงเดือนปัจจุบัน
- **Fix: ยอด "ในเดือนนี้" หน้าหลัก/สมาชิก ไม่ตรงกับรายงาน** — `dueThisMonth` เดิมนับเฉพาะงวดผ่อน ไม่รวม**รายการที่ไม่มีแผนผ่อน** แต่รายงานรวมด้วย → ต่างกัน · เพิ่ม `dueUpToThisMonth(entries, installments)` ที่รวมยอดคงเหลือของรายการไม่มีแผน (อิง entry_date ≤ เดือนนี้) ด้วย · ใช้ใน `/api/overview`, หน้าสมาชิก, viewer home, และ `ReportView` (monthlyFirst) ให้ตรงกันทั้งหมด
- **Viewer summary แสดงยอดแบบรายเดือนก่อน:** `ReportView` เพิ่ม prop `monthlyFirst` — การ์ดสรุปบนสุดแสดง **"ยอดที่ต้องจ่ายในเดือนนี้"** + **"ค้างชำระทั้งหมด"** (เหมือนหน้ารายการ Viewer) · `/viewer/summary` ส่ง `monthlyFirst` · Admin summary คงเดิม (ยอดต้องจ่ายทั้งหมด)
- **Admin เห็นโปรไฟล์ LINE ของผู้เข้าร่วม + นำออกได้:** เก็บรูป LINE (`users.picture_url`, **migration 004**) จาก login · `/api/auth/line` อัปเดตชื่อ/รูปล่าสุด · `GET /api/people/:id` คืน `viewer {display_name, picture_url}` · หน้าสมาชิกโชว์การ์ดผู้เข้าร่วม (รูป+ชื่อ LINE) + ปุ่ม **"นำออก"** · `DELETE /api/people/:id/viewer` ลบ membership viewer + เคลียร์ `people.user_id` (ผู้ใช้หมดสิทธิ์ดูบัญชี) + log
- **เอา BrandMark ออก → ใช้โลโก้เป็นลายน้ำพื้นหลัง:** ลบ `BrandMark` (โลโก้เล็ก) ออกจากทุกหน้า · สร้าง `components/ui/GreenHeader.tsx` — header สีเขียวที่มี **โลโก้ใหญ่ จาง ๆ** เป็นลายน้ำ (`mix-blend-mode:screen` + opacity .16 ให้พื้นดำของโลโก้กลืนหายไปกับสีเขียว, `overflow:hidden` คลิปส่วนเกิน, เนื้อหาลอยเหนือด้วย z-index) · ทุกหน้าเปลี่ยนกรอบ header มาใช้ `GreenHeader`
- **Fix: แถบเมนูล่างไม่โผล่บน LINE LIFF:** `.phone` เปลี่ยนจาก `min-height:100dvh` (ความสูงไม่แน่นอน → flex:1 ของ ScrollArea ยืดดันเมนูตกจอ) เป็น **`height:100dvh`** (ความสูงแน่นอน เมนูถูกตรึงในจอ) · เพิ่ม `viewport-fit=cover` + padding-bottom แบบ `env(safe-area-inset-bottom)` ให้ BottomNav เลี่ยง home indicator (iOS/LIFF)
- **Viewer ได้ dashboard/ประวัติ/excel เหมือน Admin (เฉพาะข้อมูลตัวเอง):** extract `components/ReportView.tsx` (dashboard รายเดือน/รายปี + export) และ `components/ActivityList.tsx` (timeline) ให้ Admin+Viewer ใช้ร่วม · Admin summary/activity refactor มาใช้ของกลาง · `BottomNav` เพิ่ม `variant="viewer"` (หน้าหลัก/สรุป/ประวัติ→ `/viewer/*`) · หน้าใหม่ `/viewer/summary` (ReportView), `/viewer/activity` (ActivityList, ไม่โชว์ actor) · `GET /api/me/activity` (กรอง `person_id` = ตัวเอง) · Viewer home เพิ่ม BottomNav + **ยอดค้างชำระรายเดือนก่อน** ("ยอดที่ต้องชำระเดือนนี้" + pill "ค้างชำระทั้งหมด") concept เดียวกับ Admin
- **โลโก้มาสคอตเล็กในทุกหัวหน้า:** `BrandMark` ใส่ชิปโลโก้ (crop โฟกัสหน้า+แว่นเขียว, ดำนีออน) คู่กับ "WARM MODE" → แคปหน้าจอหน้าไหนก็มีโลโก้ติดเสมอ
- **รายงาน: แสดงแค่ถึงเดือนปัจจุบัน + ปรับ Excel:** หน้า `/admin/summary` กรองการ์ดเดือน/ปีให้แสดง**สูงสุดถึงงวดปัจจุบัน** (ไม่โชว์อนาคต, อิงเวลาไทยผ่าน `currentMonthKeyTH`) · Export .xlsx: ชีต **"สรุปรายการ"** (ต่อรายการ: แบบชำระ, ยอดทั้งหมด, ยอดผ่อนต่องวด, งวดที่จ่ายแล้ว/งวดทั้งหมด, จ่ายแล้ว, คงเหลือ) + **แยกชีตต่อเดือน** (ชื่อชีต = เดือนไทย เช่น "ก.ค. 2568" แต่ละชีตมีงวดของเดือนนั้น + แถวรวมท้ายชีต) · **ตัดถึงเดือนปัจจุบัน**ทั้งบนจอและใน Excel (ไม่รวมงวด/รายการที่ยังไม่ถึงกำหนดในอนาคต)
- **เมนูประวัติการทำรายการ (Activity Log):** ตาราง `activity_log` (**migration 003 — ต้องรันใน Supabase**) เก็บ book_id, actor (user+ชื่อ), action, person/entry, summary, detail(JSONB) · helper `lib/activity.ts` (`logActivity` แบบไม่ throw + `entryLogContext`) · บันทึกทุก mutation: **เพิ่ม/แก้ไข(ยอด·ชื่อ·วันที่)/ลบรายการ, กดจ่าย, สร้าง/ยกเลิกแผนผ่อน, เก็บ/ยกเลิกงวด, แก้ยอดงวด, เปลี่ยนชื่อ/ลบสมาชิก, เปลี่ยนชื่อบัญชี** · `GET /api/activity` (ล่าสุดก่อน, limit 300, คืน `ready:false` ถ้ายังไม่ได้รัน migration) · หน้า `/admin/activity` timeline จัดกลุ่มตามวัน + ไอคอน/สีตามประเภท · BottomNav เปลี่ยน tab "สมาชิก"(ซ้ำ /admin) → **"ประวัติ"** (`IconHistory`)
- **ยอดค้างเก็บ — แยก "ในเดือนนี้" เมื่อมีแผนผ่อน:** หน้าบัญชี (`/admin`) และหน้ารายการสมาชิก (`SummaryCard`) — ถ้าบัญชี/สมาชิกนั้น**มีงวดผ่อน** ตัวเลขใหญ่เป็น **"ยอดค้างเก็บในเดือนนี้"** (งวดที่ยังไม่จ่าย + ครบกำหนดในเดือนปัจจุบัน ตามเวลาไทย UTC+7) พร้อม pill **"ค้างเก็บทั้งหมด"** · ถ้า**ไม่มีแผนผ่อน** แสดง **"ยอดค้างเก็บทั้งหมด"** อย่างเดียว · helper `currentMonthKeyTH` + `dueThisMonth` ใน `lib/calc.ts` · `/api/overview` คืน `headline.hasPlan` + `headline.dueThisMonth` (นับงวดที่ยังไม่จ่ายและครบกำหนด**ถึงเดือนนี้** = รวมงวดค้างสะสมจากเดือนก่อนด้วย, ไม่รวมงวดอนาคต)
- **รองรับทศนิยม 2 ตำแหน่งทั้งระบบ:** เพิ่ม helper `round2` / `sanitizeAmount` / `formatAmountInput` ใน `lib/calc.ts` · `baht()` แสดงทศนิยม (integer ไม่โชว์, มีเศษโชว์ .xx) · input ยอด (AddEntrySheet, PaymentSheet, แก้ไขงวด) รับจุดทศนิยมได้สูงสุด 2 หลัก + คอมมาอัตโนมัติ · `splitAmount` แบ่งงวดเป็น "สตางค์" (งวดสุดท้ายรับเศษ, รวมกลับได้พอดี) · `recomputeEntryPaid` รวมแบบ cents · API (`POST /entries`, `PATCH /entries/:id`, `PATCH /installments/:id`) ปัด `round2` ก่อนบันทึก · DB คอลัมน์ NUMERIC อยู่แล้ว ไม่ต้อง migrate
- **การ์ดแผนผ่อน — layout + ล็อกเมื่อชำระแล้ว:** ปุ่ม **ยกเลิกแผนย้ายไปซ้าย** (กดแล้วมีขั้น **ยืนยัน?** ก่อนลบจริง) · ปุ่ม **expand ย้ายไปขวา** (chevron ท้ายสุด) · **ถ้ามียอดชำระแล้ว (paid_amount>0 หรือมีงวด paid) → แก้ไขยอดงวด/ยกเลิกแผนไม่ได้** แสดง "ชำระแล้ว · ยกเลิกไม่ได้" · guard ฝั่ง server ด้วย: `DELETE /plan` และ `PATCH /installments/:id` (แก้ amount/due_date) คืน **409** ถ้ามีงวดจ่ายแล้ว (toggle paid ยังทำได้) · `GET /api/book/entries` คืน `installments` ต่อ entry · Export .xlsx เปลี่ยนเป็นตารางกำหนดชำระ (กำหนดชำระ/งวดที่/ต้องจ่าย/สถานะ/จ่ายจริงเมื่อ/ค้างจ่าย)
