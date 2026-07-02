'use client';
// แถบเมนูล่างสำหรับหน้า Admin
import React from 'react';
import { colors } from '@/lib/theme';
import { IconHome, IconPeople, IconChart, IconProfile } from '@/components/ui/Icons';

type Tab = 'home' | 'people' | 'summary' | 'profile';

const items: { key: Tab; label: string; Icon: typeof IconHome }[] = [
  { key: 'home', label: 'หน้าหลัก', Icon: IconHome },
  { key: 'people', label: 'สมาชิก', Icon: IconPeople },
  { key: 'summary', label: 'สรุปยอด', Icon: IconChart },
  { key: 'profile', label: 'โปรไฟล์', Icon: IconProfile },
];

export function BottomNav({ active = 'home' }: { active?: Tab }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-around', padding: '2px 20px 26px' }}>
      {items.map(({ key, label, Icon }) => {
        const on = key === active;
        return (
          <div
            key={key}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              color: on ? colors.green : colors.inkFaint,
            }}
          >
            <Icon size={22} />
            <span style={{ fontSize: 10.5, fontWeight: on ? 600 : 500 }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}
