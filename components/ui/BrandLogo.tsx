// โลโก้แบรนด์ Warm Mode (มาสคอตหมาไซเบอร์) — ตัดเป็นวงกลม ไม่มีสีพื้นหลัง มีแค่เงา + แสงเขียวเรือง
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
  // ตัดรูปโลโก้เป็นวงกลม — ไม่ใส่สีพื้นหลัง มีเพียงเงาเข้มและแสงเขียวเรืองรอบขอบ
  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        background: 'transparent',
        boxShadow:
          '0 22px 46px rgba(6,28,18,.38), inset 0 0 0 1px rgba(85, 206, 166, 0.25), 0 0 44px rgba(68, 228, 159, 0.35)',
        boxSizing: 'border-box',
      }}
    >
      <Image
        src={logo}
        alt="Warm Mode"
        priority={priority}
        sizes={`${size}px`}
        style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.32) translateY(-5%)', transformOrigin: 'center' }}
      />
    </div>
  );
}
