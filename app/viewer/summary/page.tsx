'use client';
// สรุปยอดของสมาชิก (Viewer) — dashboard + export เหมือน Admin แต่เฉพาะข้อมูลตัวเอง
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, font, gradients } from '@/lib/theme';
import { Phone } from '@/components/ui/Primitives';
import { BrandMark } from '@/components/ui/BrandLogo';
import { BottomNav } from '@/components/ui/BottomNav';
import { IconBack } from '@/components/ui/Icons';
import { ReportView, type ReportRow, type ReportInst } from '@/components/ReportView';

export default function ViewerSummaryPage() {
  const router = useRouter();
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/me');
        if (res.ok) {
          const data = await res.json();
          const byEntry = new Map<string, ReportInst[]>();
          for (const ins of (data.installments ?? []) as (ReportInst & { entry_id: string })[]) {
            const arr = byEntry.get(ins.entry_id) ?? [];
            arr.push(ins);
            byEntry.set(ins.entry_id, arr);
          }
          const name = data.person?.name ?? '';
          setRows(
            (data.entries ?? []).map((e: any) => ({
              id: e.id,
              description: e.description,
              amount: Number(e.amount),
              paid_amount: Number(e.paid_amount),
              remaining: Math.max(Number(e.amount) - Number(e.paid_amount), 0),
              entry_date: e.entry_date,
              person_name: name,
              installments: byEntry.get(e.id) ?? [],
            }))
          );
        } else if (res.status === 401 || res.status === 403) {
          router.replace('/');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Phone>
      <div style={{ height: '100%', minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: colors.bg }}>
        <div style={{ flex: 'none', background: gradients.header, padding: '56px 20px 22px', color: '#fff' }}>
          <BrandMark style={{ marginBottom: 16 }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={() => router.push('/viewer')} style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconBack size={18} color="#fff" />
            </button>
            <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 16 }}>สรุปของฉัน</div>
            <div style={{ width: 38 }} />
          </div>
        </div>

        {loading ? (
          <div style={{ flex: 1, textAlign: 'center', color: colors.inkMuted, fontSize: 14, padding: '40px 0' }}>กำลังโหลด...</div>
        ) : (
          <ReportView rows={rows} exportName="warm-mode-ของฉัน" />
        )}

        <div style={{ flex: 'none', background: colors.surface, borderTop: `1px solid ${colors.border}` }}>
          <BottomNav active="summary" variant="viewer" />
        </div>
      </div>
    </Phone>
  );
}
