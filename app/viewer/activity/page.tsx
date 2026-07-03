'use client';
// ประวัติการจ่าย/การเพิ่ม ของสมาชิก (Viewer)
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, font } from '@/lib/theme';
import { Phone, ScrollArea } from '@/components/ui/Primitives';
import { GreenHeader } from '@/components/ui/GreenHeader';
import { BottomNav } from '@/components/ui/BottomNav';
import { IconBack } from '@/components/ui/Icons';
import { ActivityList, type Activity } from '@/components/ActivityList';

export default function ViewerActivityPage() {
  const router = useRouter();
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/me/activity');
        if (res.ok) setItems((await res.json()).activities ?? []);
        else if (res.status === 401 || res.status === 403) router.replace('/');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Phone>
      <div style={{ height: '100%', minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: colors.bg }}>
        <GreenHeader style={{ padding: '56px 20px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={() => router.push('/viewer')} style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconBack size={18} color="#fff" />
            </button>
            <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 16 }}>ประวัติการจ่าย</div>
            <div style={{ width: 38 }} />
          </div>
          <div style={{ marginTop: 14, fontSize: 12.5, opacity: 0.85 }}>บันทึกการเพิ่มรายการ / กดจ่าย / แผนผ่อน ของคุณ</div>
        </GreenHeader>

        <ScrollArea style={{ padding: '16px 16px 16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: colors.inkMuted, fontSize: 14, padding: '30px 0' }}>กำลังโหลด...</div>
          ) : (
            <ActivityList items={items} showActor={false} />
          )}
        </ScrollArea>

        <div style={{ flex: 'none', background: colors.surface, borderTop: `1px solid ${colors.border}` }}>
          <BottomNav active="activity" variant="viewer" />
        </div>
      </div>
    </Phone>
  );
}
