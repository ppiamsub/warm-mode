'use client';
// Context Provider สำหรับ Initialize LINE LIFF และดึง line_uid
// กฎเหล็ก: line_uid ฝั่ง Client ใช้เพื่อการแสดงผล + ส่งไปยืนยันที่ Backend เท่านั้น
import React, { createContext, useContext, useEffect, useState } from 'react';

interface LiffProfile {
  userId: string; // line_uid
  displayName: string;
  pictureUrl?: string;
}

interface LiffState {
  ready: boolean;
  loggedIn: boolean;
  profile: LiffProfile | null;
  // true เมื่อไม่มี LIFF ID (dev บนเบราว์เซอร์ปกติ) — ข้าม LINE ไปใช้โค้ดล้วน
  mockMode: boolean;
  login: () => void;
  error: string | null;
}

const LiffContext = createContext<LiffState>({
  ready: false,
  loggedIn: false,
  profile: null,
  mockMode: true,
  login: () => {},
  error: null,
});

export function useLiff() {
  return useContext(LiffContext);
}

export function LiffProvider({ children }: { children: React.ReactNode }) {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  const [state, setState] = useState<Omit<LiffState, 'login'>>({
    ready: false,
    loggedIn: false,
    profile: null,
    mockMode: !liffId,
    error: null,
  });

  useEffect(() => {
    // ไม่มี LIFF ID ➔ ทำงานแบบ mock (เปิดบนเบราว์เซอร์ปกติได้เลย)
    if (!liffId) {
      setState((s) => ({ ...s, ready: true, mockMode: true }));
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const liff = (await import('@line/liff')).default;
        await liff.init({ liffId });
        if (cancelled) return;

        if (!liff.isLoggedIn()) {
          setState((s) => ({ ...s, ready: true, loggedIn: false, mockMode: false }));
          return;
        }

        const p = await liff.getProfile();
        if (cancelled) return;
        setState({
          ready: true,
          loggedIn: true,
          mockMode: false,
          error: null,
          profile: { userId: p.userId, displayName: p.displayName, pictureUrl: p.pictureUrl },
        });
      } catch (e) {
        if (cancelled) return;
        setState((s) => ({ ...s, ready: true, error: (e as Error).message }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [liffId]);

  const login = () => {
    if (!liffId) return;
    import('@line/liff').then(({ default: liff }) => liff.login());
  };

  return <LiffContext.Provider value={{ ...state, login }}>{children}</LiffContext.Provider>;
}
