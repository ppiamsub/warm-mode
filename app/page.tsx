'use client';
// Screen 1 · หน้าเข้าสู่ระบบ — Login ด้วย LINE เสมอ ➔ ไปหน้าเลือกบัญชี (Hub)
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, font, gradients } from '@/lib/theme';
import { Phone } from '@/components/ui/Primitives';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { useLiff } from '@/components/LiffProvider';

export default function LoginPage() {
  const router = useRouter();
  const { ready, loggedIn, profile, mockMode, login } = useLiff();
  const [submitting, setSubmitting] = useState(false);

  // เมื่อ login LINE สำเร็จ ➔ upsert user แล้วพาไปหน้าเลือกบัญชี
  useEffect(() => {
    if (!ready || mockMode || !loggedIn || !profile) return;
    (async () => {
      try {
        await fetch('/api/auth/line', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ line_uid: profile.userId, display_name: profile.displayName }),
        });
      } catch {
        /* ไม่เป็นไร — ไปหน้า hub ต่อ (โหมด demo) */
      }
      router.replace('/accounts');
    })();
  }, [ready, mockMode, loggedIn, profile, router]);

  // โหมด mock (ไม่มี LIFF ID): dev-login ด้วย line_uid คงที่ ➔ สร้าง session จริง ต่อ DB ได้
  const handleMockLogin = async () => {
    setSubmitting(true);
    try {
      await fetch('/api/auth/line', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line_uid: 'dev-local-user', display_name: 'ผู้ใช้ทดสอบ (Dev)' }),
      });
    } catch {
      /* ไม่เป็นไร — ไปหน้า hub ต่อ */
    }
    router.push('/accounts');
  };

  return (
    <Phone>
      <div style={{ height: '100%', minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: colors.bg }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '54px 24px 30px' }}>
          {/* โลโก้มาสคอต + สโลแกน */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
            <BrandLogo size={244} priority />
            <div style={{ textAlign: 'center', marginTop: 2 }}>
              <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 30, letterSpacing: '.5px', color: colors.ink }}>WARM MODE</div>
              <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 15.5, color: colors.green, marginTop: 3 }}>สมุดเก็บเงิน</div>
            </div>
            <div style={{ fontSize: 14, color: colors.inkSoft, textAlign: 'center', lineHeight: 1.5, maxWidth: 250 }}>
              ติดตามยอดเก็บเงินจากสมาชิก
              <br />
              ง่ายๆ ครบ จบ ในที่เดียว
            </div>
          </div>

          {/* ปุ่ม Login LINE */}
          <button
            onClick={mockMode ? handleMockLogin : login}
            disabled={submitting}
            style={{
              width: '100%',
              height: 54,
              borderRadius: 15,
              background: gradients.brand,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              color: '#fff',
              fontFamily: font.display,
              fontWeight: 600,
              fontSize: 16.5,
              boxShadow: '0 14px 28px rgba(31,138,91,.32)',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            <span
              style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <span style={{ width: 13, height: 10, borderRadius: 3, background: '#fff' }} />
            </span>
            เข้าสู่ระบบด้วย LINE
          </button>

          {mockMode && (
            <div style={{ textAlign: 'center', fontSize: 11.5, color: colors.inkFaint, marginTop: 10 }}>
              โหมดทดสอบ (ยังไม่ตั้งค่า LIFF ID) — กดเพื่อเข้าหน้าเลือกบัญชี
            </div>
          )}

          <div style={{ textAlign: 'center', fontSize: 12.5, color: colors.inkFaint, lineHeight: 1.7, marginTop: 18 }}>
            เข้าสู่ระบบด้วย LINE เพื่อความปลอดภัย
            <br />
            ระบบจะจำบัญชีของคุณให้อัตโนมัติในครั้งต่อไป
          </div>
        </div>
      </div>
    </Phone>
  );
}
