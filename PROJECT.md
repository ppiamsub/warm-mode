# เอกสารออกแบบระบบ: Debt Ledger — สมุดเก็บเงิน (พร้อมระบบ LINE Login)

เอกสารการออกแบบสถาปัตยกรรมระบบติดตามยอดเงินที่ต้องเก็บจากลูกหนี้ พร้อมระบบ Invite Code และผูกบัญชีผ่าน **LINE Login (LIFF)** เพื่อแยกสิทธิ์การเข้าถึงระหว่าง Admin และ Viewer อย่างชัดเจน และให้ผู้ใช้เข้าใช้งานได้สะดวกที่สุด

---

## 1. ภาพรวมระบบและ Business Logic (System Overview & Rules)

### 1.1 บทบาทผู้ใช้ (User Roles)
| บทบาท (Role) | การเข้าสู่ระบบครั้งแรก | การเข้าสู่ระบบครั้งถัดไป | สิทธิ์การใช้งาน (Permissions) |
| :--- | :--- | :--- | :--- |
| **Admin** (เจ้าหนี้) | กรอก **โค้ดบัญชีหลัก (Book Code)** | **Auto-login ด้วย LINE UID** | จัดการข้อมูลทั้งหมด: เพิ่ม/ลบคน, เพิ่ม/ลบรายการหนี้, อัปเดตสถานะการจ่ายเงิน และดูสรุปยอดของทุกคน |
| **Viewer** (ลูกหนี้) | กรอก **โค้ดส่วนตัว (Personal Code)** | **Auto-login ด้วย LINE UID** | ดูยอดหนี้และประวัติการจ่ายเงินของตัวเองเท่านั้น ไม่สามารถแก้ไขข้อมูลใดๆ ได้ |

### 1.2 กติกาหลักของระบบ (Core Rules)
- **Data Hierarchy:** 1 บัญชีหลัก (Book) สามารถมีลูกหนี้ได้หลายคน (People) และลูกหนี้แต่ละคนมีรายการหนี้ได้หลายรายการ (Entries)
- **LINE Integration (Seamless Login):** 
  - เมื่อเปิดแอปผ่าน LINE (LIFF) ระบบจะดึง `line_uid` มาตรวจสอบ
  - ถ้าระบบจำได้ว่า `line_uid` นี้ผูกกับ Admin หรือ Viewer คนไหน จะข้ามหน้ากรอกโค้ดและพาเข้า Dashboard ทันที
  - หากเป็นผู้ใช้ใหม่ ระบบจะให้กรอก Code (Admin/Viewer) เมื่อกรอกสำเร็จ ระบบจะผูก `line_uid` กับข้อมูลนั้นให้โดยอัตโนมัติ
- **Payment Tracking:** รองรับการจ่ายบางส่วน (Partial Payment) โดยเก็บ "ยอดเต็ม (Amount)" และ "ยอดที่จ่ายแล้ว (Paid Amount)"
- **On-the-fly Calculation:** ยอดค้างชำระ (Remaining) คำนวณสดจาก `Amount - Paid Amount` ฝั่ง Application/Query
- **Cascade Deletion:** ลบรายชื่อบุคคล (Person) ออกจากบัญชี ➔ รายการหนี้ (Entries) ของคนนั้นจะถูกลบทิ้งทั้งหมด

---

## 2. โครงสร้างฐานข้อมูล (Data Model)

เพิ่มฟิลด์ `line_uid` ในตาราง `books` (สำหรับ Admin) และ `people` (สำหรับ Viewer) เพื่อใช้จำค่าการ Login ของ LINE

```sql
-- 1. ตารางสมุดบัญชีหลัก (สำหรับ Admin)
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_code TEXT UNIQUE NOT NULL,
  line_uid TEXT UNIQUE, -- เก็บ LINE UID ของ Admin
  created_at TIMESTAMP DEFAULT now()
);

-- 2. ตารางรายชื่อลูกหนี้ (สำหรับ Viewer)
CREATE TABLE people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  personal_code TEXT UNIQUE NOT NULL,
  line_uid TEXT UNIQUE, -- เก็บ LINE UID ของลูกหนี้
  created_at TIMESTAMP DEFAULT now()
);

-- 3. ตารางรายการหนี้สิน
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
│   ├── page.tsx                   # หน้าแรก (ตรวจสอบ LINE UID / ฟอร์มกรอก Code)
│   ├── admin/page.tsx             # Dashboard สำหรับ Admin
│   ├── viewer/page.tsx            # หน้าแสดงยอดหนี้ส่วนตัวสำหรับ Viewer
│   └── api/
│       ├── auth/
│       │   ├── line/route.ts      # API ตรวจสอบ LINE UID ➔ คืน Session หากเคยผูกแล้ว
│       │   └── code/route.ts      # API ตรวจสอบ Code ➔ ผูก LINE UID ➔ คืน Session
│       ├── people/route.ts        # API สำหรับ CRUD คน
│       └── entries/route.ts       # API สำหรับ CRUD รายการหนี้
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
| `POST` | `/api/books` | สร้างสมุดบัญชีใหม่ พร้อม Gen `admin_code` |
| `POST` | `/api/auth/line` | รับ `line_uid` ➔ ตรวจสอบใน DB ➔ หากพบ คืน Session พร้อม Role (Auto-login) |
| `POST` | `/api/auth/code` | รับ Code + `line_uid` ➔ ตรวจสอบ ➔ หากถูกต้องให้ผูก `line_uid` เข้ากับบัญชี ➔ คืน Session |
| `POST` | `/api/people` | เพิ่มคนลงในบัญชี พร้อม Gen `personal_code` |
| `DELETE` | `/api/people/:id` | ลบรายชื่อคน (Cascade ลบ entries ด้วย) |
| `POST` | `/api/entries` | เพิ่มรายการหนี้ใหม่ |
| `PATCH` | `/api/entries/:id` | อัปเดตยอดจ่าย `paid_amount` (จ่ายครบ/บางส่วน) |
| `DELETE` | `/api/entries/:id` | ลบรายการหนี้ทิ้ง |

---

## 6. มาตรการความปลอดภัย (Security Checklist)

- [ ] **Row Level Security (RLS):** ตั้ง Policy บน Supabase เพื่อบล็อกการดึงข้อมูลข้ามบัญชี/ข้ามบุคคล
- [ ] **Secure Session:** Session จากการล็อกอินสำเร็จ ต้องเก็บเป็น HTTP-Only Cookie เสมอ
- [ ] **LIFF Security:** การยืนยันตัวตน LINE ต้องเช็คผ่าน API Backend โดยไม่เชื่อ `line_uid` จากฝั่ง Client แบบ 100% (อาจใช้ ID Token Verify ของ LINE ถ้าต้องการความปลอดภัยสูงสุด)
- [ ] **Code Rate Limiting:** ป้องกันการยิง Brute-Force เดา Invite Code

---

## 7. ขั้นตอนการพัฒนา (Roadmap)

1. [x] รวบรวม Requirement และอัปเดต Business Logic (เพิ่ม LINE Login)
2. [ ] สร้าง LINE Login Channel ใน LINE Developers Console และดึง LIFF ID
3. [ ] ตั้งค่า Supabase Project และ Run Schema ใหม่
4. [ ] ติดตั้ง Next.js และ LINE LIFF SDK (`@line/liff`)
5. [ ] พัฒนา API `/api/auth/line` และ `/api/auth/code` เพื่อจัดการ Flow การล็อกอิน
6. [ ] พัฒนาหน้า Frontend: LiffProvider ➔ เช็คสถานะ ➔ หน้า Login/Dashboard
7. [ ] เปิดใช้งานและคอนฟิก RLS Policy บน Supabase
8. [ ] ทดสอบ Edge Cases (ล็อกอินด้วยมือถือเครื่องอื่น, ถอนสิทธิ์แอป LINE)
9. [ ] Deploy ขึ้น Vercel
