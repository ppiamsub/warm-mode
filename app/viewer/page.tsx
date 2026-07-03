'use client';
// Screen 5 · หน้าสมาชิก (Viewer) — ยอดของฉัน + รายการ + ประวัติการจ่าย (ข้อมูลจริง, อ่านอย่างเดียว)
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, font } from '@/lib/theme';
import { baht, toEntryView, thaiFull, dueUpToThisMonth } from '@/lib/calc';
import { Phone, ScrollArea } from '@/components/ui/Primitives';
import { GreenHeader } from '@/components/ui/GreenHeader';
import { BottomNav } from '@/components/ui/BottomNav';
import { EntryCard } from '@/components/EntryCard';
import { IconInfo, IconCheck, IconChat } from '@/components/ui/Icons';
import type { Entry, Installment, Person } from '@/types';

export default function ViewerPage() {
  const router = useRouter();
  const [person, setPerson] = useState<Person | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/me');
        if (res.ok) {
          const data = await res.json();
          setPerson(data.person);
          setEntries(data.entries);
          setInstallments(data.installments ?? []);
        } else if (res.status === 401 || res.status === 403) {
          router.replace('/');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const views = useMemo(() => entries.map(toEntryView), [entries]);
  const installmentsByEntry = useMemo(() => {
    const m = new Map<string, Installment[]>();
    for (const ins of installments) {
      const arr = m.get(ins.entry_id) ?? [];
      arr.push(ins);
      m.set(ins.entry_id, arr);
    }
    return m;
  }, [installments]);
  const total = entries.reduce((s, e) => s + Number(e.amount), 0);
  const paid = entries.reduce((s, e) => s + Number(e.paid_amount), 0);
  const remaining = Math.max(total - paid, 0);
  const progress = total > 0 ? paid / total : 0;
  const history = views.filter((v) => v.paid_amount > 0);
  // ยอดค้างชำระแบบรายเดือนก่อน (concept เดียวกับ Admin) — งวดที่ต้องจ่ายถึงเดือนนี้
  const hasPlan = installments.length > 0;
  const dueMonth = dueUpToThisMonth(entries, installments);

  if (loading) {
    return (
      <Phone>
        <div style={{ padding: 40, textAlign: 'center', color: colors.inkMuted }}>กำลังโหลด...</div>
      </Phone>
    );
  }

  const displayName = person?.name?.split(' ')[0] ?? 'สมาชิก';
  const initial = person?.name?.charAt(0) ?? 'ส';

  return (
    <Phone>
      <div style={{ height: '100%', minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: colors.bg }}>
        {/* Header */}
        <GreenHeader style={{ padding: '56px 20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.82 }}>สวัสดี</div>
              <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 16 }}>คุณ{displayName}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <button
                onClick={() => router.push('/accounts')}
                style={{ padding: '4px 11px', borderRadius: 999, background: 'rgba(255,255,255,.2)', fontSize: 12, fontWeight: 600, color: '#fff' }}
              >
                สลับบัญชี
              </button>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font.display, fontWeight: 600, fontSize: 17 }}>
                {initial}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 22 }}>
            {hasPlan ? (
              <>
                <div style={{ fontSize: 13, opacity: 0.85 }}>ยอดที่ต้องชำระเดือนนี้</div>
                <div className="tabular" style={{ fontFamily: font.display, fontWeight: 700, fontSize: 44, letterSpacing: '-.5px', marginTop: 3 }}>{baht(dueMonth)}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.18)', borderRadius: 999, padding: '4px 12px' }}>
                  <span style={{ fontSize: 12, opacity: 0.85 }}>ค้างชำระทั้งหมด</span>
                  <span className="tabular" style={{ fontFamily: font.display, fontWeight: 600, fontSize: 13.5 }}>{baht(remaining)}</span>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 13, opacity: 0.85 }}>ยอดค้างชำระทั้งหมด</div>
                <div className="tabular" style={{ fontFamily: font.display, fontWeight: 700, fontSize: 44, letterSpacing: '-.5px', marginTop: 3 }}>{baht(remaining)}</div>
              </>
            )}
          </div>

          <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,.22)', marginTop: 16, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.round(progress * 100)}%`, background: 'rgba(255,255,255,.9)', borderRadius: 999 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, opacity: 0.85 }}>
            <span>จ่ายแล้ว {baht(paid)}</span>
            <span>ยอดรวม {baht(total)}</span>
          </div>
        </GreenHeader>

        {/* เนื้อหา */}
        <ScrollArea style={{ padding: '16px 16px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#e9f5ee', border: '1px solid #d3ebdc', borderRadius: 14, padding: '12px 14px', marginBottom: 18 }}>
            <IconInfo size={18} color={colors.green} strokeWidth={2} style={{ flex: 'none', marginTop: 1 }} />
            <div style={{ fontSize: 12.5, color: '#2d6a4a', lineHeight: 1.5 }}>
              ยอดจะอัปเดตอัตโนมัติเมื่อผู้ดูแลบันทึกการจ่าย · คุณดูข้อมูลได้อย่างเดียว
            </div>
          </div>

          {/* รายการของฉัน */}
          <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 16, color: colors.ink, margin: '0 2px 12px' }}>รายการของฉัน</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {views.map((v) => (
              <EntryCard key={v.id} entry={v} installments={installmentsByEntry.get(v.id) ?? []} readOnly />
            ))}
            {views.length === 0 && (
              <div style={{ textAlign: 'center', color: colors.inkMuted, fontSize: 14, padding: '20px 0' }}>ยังไม่มีรายการ</div>
            )}
          </div>

          {/* ประวัติการจ่าย */}
          <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 16, color: colors.ink, margin: '20px 2px 12px' }}>ประวัติการจ่าย</div>
          <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 16, padding: '4px 16px', boxShadow: '0 1px 2px rgba(12,44,28,.05), 0 8px 20px rgba(16,64,42,.06)' }}>
            {history.map((v, i) => (
              <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', borderBottom: i < history.length - 1 ? `1px solid ${colors.borderSoft}` : 'none' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: colors.paidBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                  <IconCheck size={16} color={colors.green} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: colors.ink }}>{v.description}</div>
                  <div style={{ fontSize: 11.5, color: colors.inkMuted }}>{thaiFull(v.entry_date)}</div>
                </div>
                <div className="tabular" style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, color: colors.green }}>+{baht(v.paid_amount)}</div>
              </div>
            ))}
            {history.length === 0 && (
              <div style={{ textAlign: 'center', color: colors.inkMuted, fontSize: 13, padding: '16px 0' }}>ยังไม่มีประวัติการจ่าย</div>
            )}
          </div>

          <button style={{ marginTop: 18, width: '100%', height: 48, borderRadius: 14, border: '1.5px solid #cfe0d6', background: colors.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: colors.green, fontFamily: font.display, fontWeight: 600, fontSize: 15 }}>
            <IconChat size={17} color={colors.green} strokeWidth={2} />
            ติดต่อผู้ดูแล
          </button>
        </ScrollArea>

        <div style={{ flex: 'none', background: colors.surface, borderTop: `1px solid ${colors.border}` }}>
          <BottomNav active="home" variant="viewer" />
        </div>
      </div>
    </Phone>
  );
}
