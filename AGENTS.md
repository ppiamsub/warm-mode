# ข้อกำหนด AI Agents สำหรับโครงการ: Debt Ledger (สมุดเก็บเงิน)

เอกสารฉบับนี้กำหนดบทบาท หน้าที่ และข้อจำกัดสำหรับ AI Agents ที่จะเข้ามาช่วยพัฒนาโค้ดในโปรเจกต์ Debt Ledger ซึ่งเป็นระบบติดตามยอดเงินที่ต้องเก็บจากสมาชิก

## 1. Frontend Developer Agent (UI & LIFF Integration)

* **เทคโนโลยีที่รับผิดชอบ:** Next.js (React) และ LINE LIFF SDK v2
* **เป้าหมายหลัก:** พัฒนาส่วนแสดงผลและผูกระบบกับแอปพลิเคชัน LINE เพื่อความสะดวกของผู้ใช้
* **งานที่ต้องทำ:** * พัฒนาหน้า Dashboard แยกสำหรับ Admin และ Viewer
  * สร้าง `LiffProvider.tsx` เพื่อ Initialize LINE LIFF และดึง `line_uid`
* **กฎเหล็ก 1:** ห้ามเชื่อถือ `line_uid` จากฝั่ง Client แบบ 100% ในด้านความปลอดภัย ให้ใช้เพื่อการแสดงผลและส่งไปยืนยันที่ Backend เท่านั้น
* **กฎเหล็ก 2:** ออกแบบ UI ให้รองรับการเข้าสู่ระบบครั้งถัดไปแบบ Auto-login ด้วย LINE UID ทันทีหากเคยผูกบัญชีแล้ว

---

## 2. Backend & API Route Agent

* **เทคโนโลยีที่รับผิดชอบ:** Next.js API Routes
* **เป้าหมายหลัก:** จัดการ Business Logic, ตรวจสอบความถูกต้อง (Validation) และดูแลการเข้าสู่ระบบ (Authentication)
* **งานที่ต้องทำ:** * สร้าง Endpoint `/api/auth/line` เพื่อรับค่าและตรวจสอบ `line_uid` ในฐานข้อมูล
  * สร้าง Endpoint `/api/auth/code` เพื่อตรวจสอบ Invite Code และผูก `line_uid` เข้ากับบัญชีผู้ใช้
  * พัฒนา API สำหรับ CRUD ข้อมูลบุคคล (People) และรายการ (Entries)
* **กฎเหล็ก 1:** Session จากการล็อกอินสำเร็จ ต้องถูกเก็บเป็น HTTP-Only Cookie เสมอ
* **กฎเหล็ก 2:** ต้องคำนวณยอดค้างชำระ (Remaining) แบบสด (On-the-fly) จาก Amount ลบด้วย Paid Amount ฝั่ง Application หรือ Query
* **กฎเหล็ก 3:** ต้องมีการทำ Code Rate Limiting เพื่อป้องกันการยิงเดา Invite Code

---

## 3. Database Architect Agent (Supabase & Security)

* **เทคโนโลยีที่รับผิดชอบ:** Supabase (PostgreSQL)
* **เป้าหมายหลัก:** ออกแบบโครงสร้างตาราง เก็บรักษาข้อมูล และบังคับใช้กฎความปลอดภัยระดับฐานข้อมูล
* **งานที่ต้องทำ:** * สร้างและปรับปรุง Schema ของตาราง `books`, `people` และ `entries`
  * จัดการ Constraint ของฐานข้อมูล เช่น การตั้งค่า `ON DELETE CASCADE` เพื่อลบรายการทั้งหมดหากรายชื่อสมาชิกถูกลบ
* **กฎเหล็ก 1:** ต้องเปิดใช้งานและตั้งค่า Row Level Security (RLS) เพื่อบล็อกการดึงข้อมูลข้ามบัญชีหรือข้ามบุคคล
* **กฎเหล็ก 2:** ฟิลด์ `amount` ต้องมีค่ามากกว่า 0 และ `paid_amount` ต้องมีค่ามากกว่าหรือเท่ากับ 0 เสมอ
* **กฎเหล็ก 3:** `line_uid` เป็นหัวใจของ Auto-login — ต้องเก็บไว้ที่ตาราง `users` เป็น `UNIQUE NOT NULL` ที่เดียว (ย้ายออกจาก `books`/`people` แล้ว) การเชื่อมผู้ใช้กับบัญชีให้ทำผ่านตาราง `memberships` (user × book × role) เพื่อรองรับ 1 user หลายบัญชี ห้ามผูก `line_uid` ซ้ำหลายที่

---

## 4. DevOps & Deployment Agent

* **เทคโนโลยีที่รับผิดชอบ:** Vercel และ GitHub CI/CD
* **เป้าหมายหลัก:** ดูแลการนำโค้ดขึ้นระบบจริง (Deploy) และจัดการ Environment Variables
* **งานที่ต้องทำ:** ตรวจสอบความพร้อมของไฟล์ `.env.local` สำหรับ Liff ID และ Supabase Keys ก่อนทำการ Deploy
* **กฎเหล็ก 1:** ห้าม Commit ไฟล์ `.env.local` หรือความลับของระบบขึ้น GitHub เด็ดขาด