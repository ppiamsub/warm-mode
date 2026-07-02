'use client';
// Dashboard สรุปยอด — รายเดือน/รายปี + export .xlsx
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, font, gradients } from '@/lib/theme';
import { baht } from '@/lib/calc';
import { Phone, ScrollArea } from '@/components/ui/Primitives';
import { BottomNav } from '@/components/ui/BottomNav';
import { IconBack } from '@/components/ui/Icons';

interface Row {
  id: string;
  description: string;
  amount: number;
  paid_amount: number;
  remaining: number;
  entry_date: string;
  person_name: string;
}

const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

interface Bucket {
  key: string;
  label: string;
  amount: number;
  paid: number;
  remaining: number;
  count: number;
}

export default function SummaryPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'month' | 'year'>('month');
  const [exporting, setExporting] = useState(false);

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

  const buckets = useMemo<Bucket[]>(() => {
    const map = new Map<string, Bucket>();
    for (const r of rows) {
      const d = new Date(r.entry_date);
      if (isNaN(d.getTime())) continue;
      const key = mode === 'month' ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` : `${d.getFullYear()}`;
      const label = mode === 'month' ? `${TH_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}` : `ปี ${d.getFullYear() + 543}`;
      const b = map.get(key) ?? { key, label, amount: 0, paid: 0, remaining: 0, count: 0 };
      b.amount += Number(r.amount);
      b.paid += Number(r.paid_amount);
      b.remaining += Number(r.remaining);
      b.count += 1;
      map.set(key, b);
    }
    return Array.from(map.values()).sort((a, b) => (a.key < b.key ? 1 : -1));
  }, [rows, mode]);

  const grand = useMemo(
    () => rows.reduce((s, r) => ({ amount: s.amount + Number(r.amount), paid: s.paid + Number(r.paid_amount), remaining: s.remaining + Number(r.remaining) }), { amount: 0, paid: 0, remaining: 0 }),
    [rows]
  );

  const exportXlsx = async () => {
    setExporting(true);
    try {
      const XLSX = await import('xlsx');
      const data = rows.map((r) => ({
        วันที่: r.entry_date,
        สมาชิก: r.person_name,
        รายการ: r.description,
        ยอด: Number(r.amount),
        จ่ายแล้ว: Number(r.paid_amount),
        คงเหลือ: Number(r.remaining),
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 24 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'รายการ');
      XLSX.writeFile(wb, `debt-ledger-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Phone>
      <div style={{ height: '100%', minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: colors.bg }}>
        <div style={{ flex: 'none', background: gradients.header, padding: '56px 20px 24px', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={() => router.push('/admin')} style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconBack size={18} color="#fff" />
            </button>
            <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 16 }}>สรุปยอด</div>
            <div style={{ width: 38 }} />
          </div>

          {/* ยอดรวมทั้งหมด */}
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 13, opacity: 0.85 }}>ยอดรวมทั้งบัญชี</div>
            <div className="tabular" style={{ fontFamily: font.display, fontWeight: 700, fontSize: 38, marginTop: 2 }}>{baht(grand.amount)}</div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.18)', borderRadius: 12, padding: '9px 12px' }}>
              <div style={{ fontSize: 11, opacity: 0.82 }}>เก็บแล้ว</div>
              <div className="tabular" style={{ fontFamily: font.display, fontWeight: 600, fontSize: 15 }}>{baht(grand.paid)}</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.18)', borderRadius: 12, padding: '9px 12px' }}>
              <div style={{ fontSize: 11, opacity: 0.82 }}>คงเหลือ</div>
              <div className="tabular" style={{ fontFamily: font.display, fontWeight: 600, fontSize: 15 }}>{baht(grand.remaining)}</div>
            </div>
          </div>
        </div>

        <ScrollArea style={{ padding: '16px 16px 16px' }}>
          {/* toggle รายเดือน/รายปี */}
          <div style={{ display: 'flex', background: '#eef2ef', borderRadius: 14, padding: 4, gap: 4, marginBottom: 14 }}>
            {(['month', 'year'] as const).map((m) => {
              const on = mode === m;
              return (
                <button key={m} onClick={() => setMode(m)} style={{ flex: 1, textAlign: 'center', padding: '9px 0', borderRadius: 11, background: on ? colors.surface : 'transparent', boxShadow: on ? '0 1px 3px rgba(16,40,28,.1)' : 'none', color: on ? colors.ink : '#7c8c83', fontWeight: on ? 600 : 500, fontSize: 13.5 }}>
                  {m === 'month' ? 'รายเดือน' : 'รายปี'}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', color: colors.inkMuted, fontSize: 14, padding: '30px 0' }}>กำลังโหลด...</div>
          ) : buckets.length === 0 ? (
            <div style={{ textAlign: 'center', color: colors.inkMuted, fontSize: 14, padding: '30px 0' }}>ยังไม่มีข้อมูล</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {buckets.map((b) => (
                <div key={b.key} style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 14, boxShadow: '0 1px 2px rgba(16,40,28,.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 15, color: colors.ink }}>{b.label}</div>
                    <div style={{ fontSize: 12, color: colors.inkMuted }}>{b.count} รายการ</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <Stat label="ยอดรวม" value={baht(b.amount)} />
                    <Stat label="เก็บแล้ว" value={baht(b.paid)} color={colors.paidText} />
                    <Stat label="คงเหลือ" value={baht(b.remaining)} color={colors.partialText} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* export */}
          <button
            onClick={exportXlsx}
            disabled={exporting || rows.length === 0}
            style={{ marginTop: 16, width: '100%', height: 50, borderRadius: 14, border: `1.5px solid ${colors.green}`, background: colors.surface, color: colors.green, fontFamily: font.display, fontWeight: 600, fontSize: 15, opacity: exporting || rows.length === 0 ? 0.6 : 1 }}
          >
            {exporting ? 'กำลังสร้างไฟล์...' : '⬇ Export รายการ (.xlsx)'}
          </button>
        </ScrollArea>

        <div style={{ flex: 'none', background: colors.surface, borderTop: `1px solid ${colors.border}` }}>
          <BottomNav active="summary" />
        </div>
      </div>
    </Phone>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ flex: 1, background: '#f6f8f7', borderRadius: 11, padding: '9px 10px', textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: colors.inkMuted }}>{label}</div>
      <div className="tabular" style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14, color: color ?? colors.ink, marginTop: 2 }}>{value}</div>
    </div>
  );
}
