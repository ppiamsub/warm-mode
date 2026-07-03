'use client';
// UI primitives ที่ใช้ซ้ำ: กรอบมือถือ, badge สถานะ, progress bar
import React from 'react';
import { colors, gradients, statusLabel, statusStyle, type PaymentStatus } from '@/lib/theme';

/** กรอบมือถือ (เต็มจอบน LIFF / กรอบกลางจอบน desktop) */
export function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="phone-shell">
      <div className="phone">{children}</div>
    </div>
  );
}

/** พื้นที่เนื้อหาแบบ scroll ได้ (ระหว่าง header กับ bottom bar) */
export function ScrollArea({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  // minHeight:0 ให้ flex item หดได้จริงและ scroll ภายใน (กันดันแถบเมนูล่างตกจอ)
  return (
    <div className="no-scrollbar" style={{ flex: 1, minHeight: 0, overflow: 'auto', ...style }}>
      {children}
    </div>
  );
}

/** ป้ายสถานะการชำระ */
export function StatusBadge({ status, label }: { status: PaymentStatus; label?: string }) {
  const s = statusStyle[status];
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: s.color,
        background: s.background,
        padding: '3px 9px',
        borderRadius: 999,
        whiteSpace: 'nowrap',
      }}
    >
      {label ?? statusLabel[status]}
    </span>
  );
}

/** แถบความคืบหน้าการชำระ (0..1) */
export function ProgressBar({ value, height = 6 }: { value: number; height?: number }) {
  return (
    <div
      style={{
        height,
        borderRadius: 999,
        background: colors.track,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${Math.round(Math.min(Math.max(value, 0), 1) * 100)}%`,
          background: gradients.progress,
          borderRadius: 999,
          transition: 'width .3s ease',
        }}
      />
    </div>
  );
}

/** ปุ่มหลัก (gradient เขียว) */
export function PrimaryButton({
  children,
  onClick,
  style,
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        height: 52,
        width: '100%',
        borderRadius: 15,
        background: gradients.brand,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        color: '#fff',
        fontFamily: "'Anuphan', sans-serif",
        fontWeight: 600,
        fontSize: 16,
        boxShadow: '0 12px 24px rgba(31,138,91,.32)',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
