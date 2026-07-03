// โลโก้แบรนด์ Warm Mode (มาสคอตหมาไซเบอร์) — วางบน backdrop เรืองแสงมรกตให้ดูเป็นโลโก้
import React from 'react';
import Image from 'next/image';
import logo from '@/src/logo.png';

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
        height: size, // เพิ่ม height
        borderRadius: '50%',
        padding: 12,
        background:
          'transparent linear-gradient(180deg, rgba(29, 160, 101, 0.8) 0%, rgba(17, 97, 60, 0.6) 100%) 0% 0% no-repeat padding-box',
        boxShadow:
          '0 22px 46px rgba(6,28,18,.38), inset 0 0 0 1px rgba(85, 206, 166, 0.2), 0 0 36px rgba(68, 228, 159, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
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
