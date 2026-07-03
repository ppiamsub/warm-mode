'use client';
// Dashboard สรุปยอด (Admin) — ใช้คอมโพเนนต์ ReportView ร่วมกับ Viewer
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, font } from '@/lib/theme';
import { Phone } from '@/components/ui/Primitives';
import { GreenHeader } from '@/components/ui/GreenHeader';
import { BottomNav } from '@/components/ui/BottomNav';
import { IconBack } from '@/components/ui/Icons';
import { ReportView, type ReportRow } from '@/components/ReportView';

export default function SummaryPage() {
  const router = useRouter();
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/book/entries');
        if (res.ok) setRows((await res.json()).entries ?? []);
        else if (res.status === 401 || res.status === 403) router.replace('/');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Phone>
      <div style={{ height: '100%', minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: colors.bg }}>
        <GreenHeader style={{ padding: '56px 20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={() => router.push('/admin')} style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconBack size={18} color="#fff" />
            </button>
            <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 16 }}>สรุปยอด</div>
            <div style={{ width: 38 }} />
          </div>
        </GreenHeader>

        {loading ? (
          <div style={{ flex: 1, textAlign: 'center', color: colors.inkMuted, fontSize: 14, padding: '40px 0' }}>กำลังโหลด...</div>
        ) : (
          <ReportView rows={rows} exportName="warm-mode-summary" />
        )}

        <div style={{ flex: 'none', background: colors.surface, borderTop: `1px solid ${colors.border}` }}>
          <BottomNav active="summary" />
        </div>
      </div>
    </Phone>
  );
}
