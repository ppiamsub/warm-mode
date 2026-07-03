// โลโก้แบรนด์ Warm Mode (มาสคอตหมาไซเบอร์) — วางบน backdrop เรืองแสงมรกตให้ดูเป็นโลโก้
import React from 'react';
import Image from 'next/image';
import logo from '@/src/logo.png';
import { font } from '@/lib/theme';

/** แถบแบรนด์ "WARM MODE" + จุดนีออน — ใช้บนหัว (header สีเขียว) ทุกหน้าให้ดูเป็นทางเดียวกัน */
export function BrandMark({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...style }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#66e6a6', boxShadow: '0 0 9px #66e6a6, 0 0 2px #fff', flex: 'none' }} />
      <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 13, letterSpacing: 2.5, color: '#fff', opacity: 0.95 }}>WARM MODE</span>
    </div>
  );
}

export function BrandLogo({
  size = 220,
  glow = true,
  priority = false,
}: {
  size?: number;
  glow?: boolean;
  priority?: boolean;
}) {
  return (
    <div style={{ position: 'relative', width: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {glow && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: '-10% -8%',
            background:
              'radial-gradient(58% 58% at 50% 46%, rgba(40,183,121,.32) 0%, rgba(40,183,121,.12) 46%, rgba(40,183,121,0) 72%)',
            filter: 'blur(8px)',
            zIndex: 0,
          }}
        />
      )}
      <Image
        src={logo}
        alt="Warm Mode"
        priority={priority}
        sizes={`${size}px`}
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: 'auto',
          filter: 'drop-shadow(0 14px 26px rgba(12,44,28,.30))',
        }}
      />
    </div>
  );
}
