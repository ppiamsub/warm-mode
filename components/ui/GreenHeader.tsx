'use client';
// Header สีเขียว + โลโก้ใหญ่จาง ๆ เป็นลายน้ำพื้นหลัง (blend กับสีเขียว) — ใช้ทุกหน้า
import React from 'react';
import Image from 'next/image';
import logo from '@/src/logo.png';
import { gradients } from '@/lib/theme';

export function GreenHeader({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ flex: 'none', position: 'relative', overflow: 'hidden', background: gradients.header, color: '#fff', ...style }}>
      {/* ลายน้ำโลโก้ — ใหญ่ จาง ผสานกับพื้นเขียว */}
      <div
        aria-hidden
        style={{ position: 'absolute', right: -48, bottom: -40, width: 320, opacity: 0.16, mixBlendMode: 'screen', pointerEvents: 'none', zIndex: 0 }}
      >
        <Image src={logo} alt="" width={320} height={273} sizes="320px" style={{ width: '100%', height: 'auto', display: 'block' }} />
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
}
