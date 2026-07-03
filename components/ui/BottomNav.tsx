'use client';
// แถบเมนูล่าง — ใช้ทั้งฝั่ง Admin และ Viewer (สลับปลายทางด้วย variant)
import React from 'react';
import { useRouter } from 'next/navigation';
import { colors } from '@/lib/theme';
import { IconHome, IconChart, IconHistory, IconProfile } from '@/components/ui/Icons';

type Tab = 'home' | 'summary' | 'activity' | 'profile';

const ADMIN: { key: Tab; label: string; Icon: typeof IconHome; href: string }[] = [
  { key: 'home', label: 'หน้าหลัก', Icon: IconHome, href: '/admin' },
  { key: 'summary', label: 'สรุปยอด', Icon: IconChart, href: '/admin/summary' },
  { key: 'activity', label: 'ประวัติ', Icon: IconHistory, href: '/admin/activity' },
  { key: 'profile', label: 'บัญชี', Icon: IconProfile, href: '/accounts' },
];

const VIEWER: { key: Tab; label: string; Icon: typeof IconHome; href: string }[] = [
  { key: 'home', label: 'หน้าหลัก', Icon: IconHome, href: '/viewer' },
  { key: 'summary', label: 'สรุปยอด', Icon: IconChart, href: '/viewer/summary' },
  { key: 'activity', label: 'ประวัติ', Icon: IconHistory, href: '/viewer/activity' },
  { key: 'profile', label: 'บัญชี', Icon: IconProfile, href: '/accounts' },
];

export function BottomNav({ active = 'home', variant = 'admin' }: { active?: Tab; variant?: 'admin' | 'viewer' }) {
  const router = useRouter();
  const items = variant === 'viewer' ? VIEWER : ADMIN;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-around', padding: '2px 20px 26px' }}>
      {items.map(({ key, label, Icon, href }) => {
        const on = key === active;
        return (
          <button
            key={key}
            onClick={() => router.push(href)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              color: on ? colors.green : colors.inkFaint,
              background: 'none',
            }}
          >
            <Icon size={22} />
            <span style={{ fontSize: 10.5, fontWeight: on ? 600 : 500 }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
