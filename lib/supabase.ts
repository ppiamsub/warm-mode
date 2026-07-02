import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Client ฝั่งเบราว์เซอร์ (ใช้ anon key — จำกัดสิทธิ์ด้วย RLS)
let browserClient: SupabaseClient | null = null;

// หมายเหตุ: ใน React component ควรใช้ createClient จาก @/utils/supabase/client (@supabase/ssr)
// ฟังก์ชันนี้เก็บไว้สำหรับ non-component code ที่ต้องการ client แบบง่าย
export function getSupabaseBrowser(): SupabaseClient {
  if (browserClient) return browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('ยังไม่ได้ตั้งค่า NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  }
  browserClient = createClient(url, key);
  return browserClient;
}

// Client ฝั่ง Server (service role — ข้าม RLS ใช้เฉพาะใน API Routes เท่านั้น)
// กฎเหล็ก: ห้ามนำ service role key ออกฝั่ง Client เด็ดขาด
export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) {
    throw new Error('ยังไม่ได้ตั้งค่า SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
