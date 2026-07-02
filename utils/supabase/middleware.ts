import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const updateSession = async (request: NextRequest) => {
  // response ผ่านทาง (passthrough) — ใช้เป็น fallback ด้วยหาก env หาย/เกิด error
  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  });

  // ถ้ายังไม่ได้ตั้ง env (เช่นบน Vercel ที่ยังไม่ใส่) อย่าให้ middleware crash ทั้งเว็บ
  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    // รีเฟรช session token ให้ทันสมัย (อย่าใส่โค้ดคั่นก่อน getUser)
    await supabase.auth.getUser();
  } catch {
    // เกิดปัญหาใด ๆ ก็ให้ผ่านทางไป ไม่ทำให้ทั้งเว็บล่ม
  }

  return supabaseResponse;
};
