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
  size = 240,
  priority = false,
}: {
  size?: number;
  priority?: boolean;
}) {
  // มาสคอตอยู่บนพื้นเข้ม — จัดใส่ "การ์ดมืดนีออน" ให้ดูตั้งใจ + เข้ากับธีมไซเบอร์
  return (
    <div
      style={{
        position: 'relative',
        width: size,
        borderRadius: 30,
        padding: 12,
        background: 'linear-gradient(160deg,#123125 0%,#0a2318 55%,#06160f 100%)',
        boxShadow:
          '0 22px 46px rgba(6,28,18,.38), inset 0 0 0 1px rgba(102,230,166,.20), 0 0 36px rgba(40,183,121,.20)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* ประกายนีออนด้านบน */}
      <div
        aria-hidden
        style={{ position: 'absolute', inset: 0, borderRadius: 30, background: 'linear-gradient(180deg, rgba(102,230,166,.10) 0%, rgba(102,230,166,0) 38%)', pointerEvents: 'none' }}
      />
      <Image
        src={logo}
        alt="Warm Mode"
        priority={priority}
        sizes={`${size}px`}
        style={{ position: 'relative', zIndex: 1, width: '100%', height: 'auto', display: 'block', borderRadius: 20 }}
      />
    </div>
  );
}
