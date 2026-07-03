'use client';
// Header สีเขียว + โลโก้ใหญ่จาง ๆ เป็นลายน้ำพื้นหลัง (blend กับสีเขียว) — ใช้ทุกหน้า
import React from 'react';
import Image from 'next/image';
import logoIcon from '@/src/logo_icon.png';
import { gradients } from '@/lib/theme';

export function GreenHeader({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ flex: 'none', position: 'relative', overflow: 'hidden', background: gradients.header, color: '#fff', ...style }}>
      {/* ลายน้ำโลโก้ไอคอน (พื้นหลังโปร่งใส) — ใหญ่ จาง ผสานกับพื้นเขียว */}
      <div
        aria-hidden
        style={{ position: 'absolute', right: -40, bottom: -36, width: 320, opacity: 0.18, mixBlendMode: 'screen', pointerEvents: 'none', zIndex: 0 }}
      >
        <Image src={logoIcon} alt="" width={320} height={320} sizes="320px" style={{ width: '100%', height: 'auto', display: 'block' }} />
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
}
