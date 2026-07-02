'use client';
// Screen 3 · รายละเอียดสมาชิก (Admin) + Screen 4 · อัปเดตการจ่าย (ข้อมูลจริง)
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { colors, font, gradients } from '@/lib/theme';
import { toEntryView } from '@/lib/calc';
import { Phone, ScrollArea } from '@/components/ui/Primitives';
import { SummaryCard } from '@/components/SummaryCard';
import { EntryRow } from '@/components/EntryRow';
import { PaymentSheet } from '@/components/PaymentSheet';
import { AddEntrySheet } from '@/components/AddEntrySheet';
import { IconBack, IconPlus } from '@/components/ui/Icons';
import type { Entry, EntryView, Person } from '@/types';

export default function PersonDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [person, setPerson] = useState<Person | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EntryView | null>(null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const res = await fetch(`/api/people/${id}`);
      if (res.ok) {
        const data = await res.json();
        setPerson(data.person);
        setEntries(data.entries);
      } else if (res.status === 401 || res.status === 403) {
        router.replace('/');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const views = useMemo(() => entries.map(toEntryView), [entries]);
  const total = entries.reduce((s, e) => s + Number(e.amount), 0);
  const paid = entries.reduce((s, e) => s + Number(e.paid_amount), 0);
  const remaining = Math.max(total - paid, 0);

  // บันทึกการจ่าย ➔ PATCH paid_amount ลง DB
  const handleSave = async (addAmount: number) => {
    if (!editing) return;
    setBusy(true);
    const newPaid = Math.min(editing.paid_amount + addAmount, editing.amount);
    try {
      const res = await fetch(`/api/entries/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paid_amount: newPaid }),
      });
      if (res.ok) {
        setEditing(null);
        await load();
      } else {
        window.alert('บันทึกไม่สำเร็จ');
      }
    } finally {
      setBusy(false);
    }
  };

  // เพิ่มรายการ ➔ POST /api/entries (รับ รายละเอียด + ยอด + วันที่)
  const submitEntry = async (data: { description: string; amount: number; entry_date: string }) => {
    const res = await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ person_id: id, ...data }),
    });
    if (res.ok) {
      setAdding(false);
      await load();
    } else {
      window.alert('เพิ่มไม่สำเร็จ');
    }
  };

  if (loading) {
    return (
      <Phone>
        <div style={{ padding: 40, textAlign: 'center', color: colors.inkMuted }}>กำลังโหลด...</div>
      </Phone>
    );
  }
  if (!person) {
    return (
      <Phone>
        <div style={{ padding: 40, textAlign: 'center', color: colors.inkMuted }}>ไม่พบข้อมูลสมาชิก</div>
      </Phone>
    );
  }

  return (
    <Phone>
      <div style={{ height: '100%', minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: colors.bg }}>
        {/* Header */}
        <div style={{ flex: 'none', background: gradients.header, padding: '56px 20px 52px', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={() => router.push('/admin')}
              style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <IconBack size={18} color="#fff" />
            </button>
            <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 16 }}>รายละเอียดสมาชิก</div>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2.5 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: 3.5, height: 3.5, borderRadius: '50%', background: '#fff' }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 18 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font.display, fontWeight: 700, fontSize: 24 }}>
              {person.name.charAt(0)}
            </div>
            <div>
              <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 20 }}>{person.name}</div>
              <div style={{ display: 'inline-block', marginTop: 5, padding: '3px 10px', borderRadius: 999, background: 'rgba(255,255,255,.2)', fontSize: 12, fontFamily: font.display, letterSpacing: 1 }}>
                รหัส {person.personal_code}
              </div>
            </div>
          </div>
        </div>

        {/* เนื้อหา */}
        <ScrollArea style={{ padding: '0 16px 16px' }}>
          <SummaryCard remaining={remaining} paid={paid} total={total} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '18px 2px 12px' }}>
            <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 16, color: colors.ink }}>รายการ</div>
            <div style={{ fontSize: 12.5, color: colors.inkMuted }}>{views.length} รายการ</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {views.map((v) => (
              <EntryRow key={v.id} entry={v} onClick={() => setEditing(v)} />
            ))}
            {views.length === 0 && (
              <div style={{ textAlign: 'center', color: colors.inkMuted, fontSize: 14, padding: '20px 0' }}>ยังไม่มีรายการ</div>
            )}
          </div>
        </ScrollArea>

        {/* ปุ่มเพิ่มรายการ */}
        <div style={{ flex: 'none', background: colors.surface, borderTop: `1px solid ${colors.border}`, padding: '12px 16px 28px' }}>
          <button
            onClick={() => setAdding(true)}
            disabled={busy}
            style={{ width: '100%', height: 52, borderRadius: 15, background: gradients.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#fff', fontFamily: font.display, fontWeight: 600, fontSize: 16, boxShadow: '0 10px 22px rgba(31,138,91,.28)', opacity: busy ? 0.7 : 1 }}
          >
            <IconPlus size={18} color="#fff" />
            เพิ่มรายการ
          </button>
        </div>

        {/* Bottom sheet อัปเดตการจ่าย */}
        {editing && <PaymentSheet entry={editing} onClose={() => setEditing(null)} onSave={handleSave} />}
        {/* Bottom sheet เพิ่มรายการ */}
        {adding && <AddEntrySheet onClose={() => setAdding(false)} onSubmit={submitEntry} />}
      </div>
    </Phone>
  );
}
