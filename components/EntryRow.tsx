'use client';
// การ์ดรายการ 1 รายการ (หน้ารายละเอียดสมาชิกฝั่ง Admin)
import React from 'react';
import { colors, font, statusLabel } from '@/lib/theme';
import { baht } from '@/lib/calc';
import { ProgressBar, StatusBadge } from '@/components/ui/Primitives';
import type { EntryView } from '@/types';

function formatThaiDate(iso: string): string {
  const d = new Date(iso);
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}

export function EntryRow({ entry, onClick }: { entry: EntryView; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 16,
        padding: 14,
        boxShadow: '0 1px 2px rgba(16,40,28,.04)',
        width: '100%',
        textAlign: 'left',
        display: 'block',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: colors.ink }}>{entry.description}</div>
          <div style={{ fontSize: 12, color: colors.inkMuted, marginTop: 3 }}>{formatThaiDate(entry.entry_date)}</div>
        </div>
        <div className="tabular" style={{ fontFamily: font.display, fontWeight: 700, fontSize: 16, color: colors.ink }}>
          {baht(entry.amount)}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <ProgressBar value={entry.progress} height={6} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <div style={{ fontSize: 12, color: colors.inkMuted }}>
          จ่าย {baht(entry.paid_amount)} · คงเหลือ {baht(entry.remaining)}
        </div>
        <StatusBadge status={entry.status} label={statusLabel[entry.status]} />
      </div>
    </button>
  );
}
