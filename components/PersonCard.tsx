'use client';
// การ์ดสมาชิก 1 คน (หน้า Admin Dashboard)
import React from 'react';
import { colors, font } from '@/lib/theme';
import { baht } from '@/lib/calc';
import { ProgressBar, StatusBadge } from '@/components/ui/Primitives';
import type { PersonSummary } from '@/types';

export function PersonCard({
  person,
  avatarBg = '#dff0e6',
  avatarColor = colors.green,
  onClick,
}: {
  person: PersonSummary;
  avatarBg?: string;
  avatarColor?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 16,
        padding: 13,
        boxShadow: '0 1px 2px rgba(16,40,28,.04)',
        width: '100%',
        textAlign: 'left',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: avatarBg,
          color: avatarColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: font.display,
          fontWeight: 600,
          fontSize: 18,
          flex: 'none',
        }}
      >
        {person.initial}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: colors.ink }}>{person.name}</div>
        <div style={{ fontSize: 12, color: colors.inkMuted, marginTop: 2 }}>
          {person.entryCount} รายการ · {person.updatedLabel}
        </div>
        <div style={{ marginTop: 8 }}>
          <ProgressBar value={person.progress} height={5} />
        </div>
      </div>

      <div style={{ textAlign: 'right', flex: 'none' }}>
        <div
          className="tabular"
          style={{
            fontFamily: font.display,
            fontWeight: 700,
            fontSize: 16,
            color: person.totalRemaining === 0 ? colors.inkFaint : colors.ink,
          }}
        >
          {baht(person.totalRemaining)}
        </div>
        <div style={{ marginTop: 5 }}>
          <StatusBadge status={person.status} />
        </div>
      </div>
    </button>
  );
}
