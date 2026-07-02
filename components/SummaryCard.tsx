'use client';
// การ์ดสรุปยอดค้างชำระของสมาชิก 1 คน (ลอยทับ header หน้ารายละเอียด)
import React from 'react';
import { colors, font } from '@/lib/theme';
import { baht } from '@/lib/calc';
import { ProgressBar } from '@/components/ui/Primitives';

export function SummaryCard({
  remaining,
  paid,
  total,
  floating = true,
}: {
  remaining: number;
  paid: number;
  total: number;
  floating?: boolean;
}) {
  const progress = total > 0 ? paid / total : 0;
  const pct = Math.round(progress * 100);

  return (
    <div
      style={{
        background: colors.surface,
        borderRadius: 20,
        padding: 18,
        border: `1px solid ${colors.borderSoft}`,
        boxShadow: floating ? '0 14px 32px rgba(16,40,28,.12)' : '0 1px 2px rgba(16,40,28,.04)',
        marginTop: floating ? -38 : 0,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 12.5, color: colors.inkMuted }}>ยอดค้างชำระ</div>
          <div
            className="tabular"
            style={{ fontFamily: font.display, fontWeight: 700, fontSize: 32, color: colors.ink, marginTop: 2 }}
          >
            {baht(remaining)}
          </div>
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: colors.paidText,
            background: colors.paidBg,
            padding: '5px 11px',
            borderRadius: 999,
          }}
        >
          ชำระแล้ว {pct}%
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <ProgressBar value={progress} height={8} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 9, fontSize: 12, color: colors.inkMuted }}>
        <span>จ่ายแล้ว {baht(paid)}</span>
        <span>ยอดรวม {baht(total)}</span>
      </div>
    </div>
  );
}
