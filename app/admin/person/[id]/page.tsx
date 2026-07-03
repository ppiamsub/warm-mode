'use client';
// Screen 3 · รายละเอียดสมาชิก (Admin) + Screen 4 · อัปเดตการจ่าย (ข้อมูลจริง)
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { colors, font, gradients } from '@/lib/theme';
import { toEntryView, round2, dueThisMonth as calcDueThisMonth } from '@/lib/calc';
import { Phone, ScrollArea } from '@/components/ui/Primitives';
import { BrandMark } from '@/components/ui/BrandLogo';
import { SummaryCard } from '@/components/SummaryCard';
import { EntryCard } from '@/components/EntryCard';
import { PaymentSheet } from '@/components/PaymentSheet';
import { AddEntrySheet } from '@/components/AddEntrySheet';
import { InstallmentPlanSheet } from '@/components/InstallmentPlanSheet';
import { IconBack, IconPlus, IconSearch } from '@/components/ui/Icons';
import type { Entry, EntryView, Installment, Person } from '@/types';

export default function PersonDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [person, setPerson] = useState<Person | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EntryView | null>(null);
  const [planFor, setPlanFor] = useState<EntryView | null>(null);
  const [editEntry, setEditEntry] = useState<EntryView | null>(null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [entryQuery, setEntryQuery] = useState('');

  const load = async () => {
    try {
      const res = await fetch(`/api/people/${id}`);
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
  };

  // งวดผ่อนจัดกลุ่มตาม entry
  const installmentsByEntry = useMemo(() => {
    const m = new Map<string, Installment[]>();
    for (const ins of installments) {
      const arr = m.get(ins.entry_id) ?? [];
      arr.push(ins);
      m.set(ins.entry_id, arr);
    }
    return m;
  }, [installments]);

  // สร้างแผนผ่อน
  const submitPlan = async (data: { count: number; startDate: string }) => {
    if (!planFor) return;
    const res = await fetch(`/api/entries/${planFor.id}/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setPlanFor(null);
      await load();
    } else {
      window.alert('สร้างแผนไม่สำเร็จ');
    }
  };

  // เก็บ/ยกเลิกงวด
  const toggleInstallment = async (ins: Installment) => {
    await fetch(`/api/installments/${ins.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paid: !ins.paid }),
    });
    await load();
  };

  // แก้ไขยอดงวด
  const editInstallment = async (ins: Installment) => {
    const input = window.prompt(`แก้ไขยอดงวดที่ ${ins.seq} (บาท)`, String(ins.amount));
    if (input == null) return;
    const amount = round2(Number(input.replace(/[^\d.]/g, '')));
    if (!amount || amount <= 0) {
      window.alert('ยอดต้องมากกว่า 0');
      return;
    }
    const res = await fetch(`/api/installments/${ins.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });
    if (res.status === 409) {
      window.alert('รายการนี้มีการชำระแล้ว แก้ไขงวดไม่ได้');
      return;
    }
    await load();
  };

  // ยกเลิกแผนผ่อน
  const deletePlan = async (entryId: string) => {
    // ยืนยันแล้วในการ์ด (EntryCard) — ยกเลิกไม่ได้ถ้ามียอดชำระแล้ว (server ป้องกันซ้ำ 409)
    const res = await fetch(`/api/entries/${entryId}/plan`, { method: 'DELETE' });
    if (res.status === 409) {
      alert('รายการนี้มีการชำระแล้ว ยกเลิกแผนไม่ได้');
      return;
    }
    await load();
  };

  // แก้ไขรายการ (ยอด/รายละเอียด/วันที่) — ได้เฉพาะเมื่อยังไม่มีการจ่าย
  const submitEditEntry = async (data: { description: string; amount: number; entry_date: string }) => {
    if (!editEntry) return;
    const res = await fetch(`/api/entries/${editEntry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setEditEntry(null);
      await load();
    } else {
      const d = await res.json().catch(() => ({}));
      window.alert(d.error || 'แก้ไขไม่สำเร็จ');
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const views = useMemo(() => entries.map(toEntryView), [entries]);
  const shownViews = useMemo(
    () => views.filter((v) => v.description.includes(entryQuery.trim())),
    [views, entryQuery]
  );
  const total = entries.reduce((s, e) => s + Number(e.amount), 0);
  const paid = entries.reduce((s, e) => s + Number(e.paid_amount), 0);
  const remaining = Math.max(total - paid, 0);
  const hasPlan = installments.length > 0;
  const dueThisMonth = calcDueThisMonth(installments);

  // บันทึกการจ่าย ➔ PATCH paid_amount ลง DB
  const handleSave = async (addAmount: number) => {
    if (!editing) return;
    setBusy(true);
    const newPaid = round2(Math.min(editing.paid_amount + addAmount, editing.amount));
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

  // แก้ชื่อสมาชิก
  const renameMember = async () => {
    if (!person) return;
    const name = window.prompt('แก้ไขชื่อสมาชิก', person.name);
    if (!name?.trim()) return;
    const res = await fetch(`/api/people/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (res.ok) await load();
    else window.alert('แก้ไขไม่สำเร็จ');
  };

  // ลบสมาชิก (ลบรายการทั้งหมดของคนนี้ด้วย)
  const deleteMember = async () => {
    if (!person) return;
    if (!window.confirm(`ลบสมาชิก "${person.name}" และรายการทั้งหมด?`)) return;
    const res = await fetch(`/api/people/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin');
    else window.alert('ลบไม่สำเร็จ');
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
          <BrandMark style={{ marginBottom: 16 }} />
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
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 20 }}>{person.name}</div>
              <div style={{ display: 'inline-block', marginTop: 5, padding: '3px 10px', borderRadius: 999, background: 'rgba(255,255,255,.2)', fontSize: 12, fontFamily: font.display, letterSpacing: 1 }}>
                รหัส {person.personal_code}
              </div>
            </div>
          </div>
          {/* จัดการสมาชิก */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={renameMember} style={{ flex: 1, height: 38, borderRadius: 11, background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.25)', color: '#fff', fontSize: 13, fontWeight: 600 }}>
              แก้ไขชื่อ
            </button>
            <button onClick={deleteMember} style={{ flex: 1, height: 38, borderRadius: 11, background: 'rgba(193,72,58,.9)', color: '#fff', fontSize: 13, fontWeight: 600 }}>
              ลบสมาชิก
            </button>
          </div>
        </div>

        {/* เนื้อหา */}
        <ScrollArea style={{ padding: '0 16px 16px' }}>
          <SummaryCard remaining={remaining} paid={paid} total={total} hasPlan={hasPlan} dueThisMonth={dueThisMonth} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '18px 2px 12px' }}>
            <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 16, color: colors.ink }}>รายการ</div>
            <div style={{ fontSize: 12.5, color: colors.inkMuted }}>{views.length} รายการ</div>
          </div>

          {/* ค้นหารายการ (แสดงเมื่อมีหลายรายการ) */}
          {views.length > 3 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 14, padding: '11px 14px', marginBottom: 12 }}>
              <IconSearch size={17} color="#9fb3a8" strokeWidth={2} />
              <input
                value={entryQuery}
                onChange={(e) => setEntryQuery(e.target.value)}
                placeholder="ค้นหารายการ..."
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: colors.ink, minWidth: 0 }}
              />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {shownViews.map((v) => (
              <EntryCard
                key={v.id}
                entry={v}
                installments={installmentsByEntry.get(v.id) ?? []}
                onPay={() => setEditing(v)}
                onCreatePlan={() => setPlanFor(v)}
                onToggleInstallment={toggleInstallment}
                onEditInstallment={editInstallment}
                onDeletePlan={() => deletePlan(v.id)}
                onEdit={() => setEditEntry(v)}
              />
            ))}
            {views.length === 0 && (
              <div style={{ textAlign: 'center', color: colors.inkMuted, fontSize: 14, padding: '20px 0' }}>ยังไม่มีรายการ</div>
            )}
            {views.length > 0 && shownViews.length === 0 && (
              <div style={{ textAlign: 'center', color: colors.inkMuted, fontSize: 14, padding: '20px 0' }}>ไม่พบรายการที่ค้นหา</div>
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
        {/* Bottom sheet สร้างแผนผ่อน */}
        {planFor && <InstallmentPlanSheet total={planFor.amount} onClose={() => setPlanFor(null)} onSubmit={submitPlan} />}
        {/* Bottom sheet แก้ไขรายการ (เฉพาะยังไม่จ่าย) */}
        {editEntry && (
          <AddEntrySheet
            initial={{ description: editEntry.description, amount: editEntry.amount, entry_date: editEntry.entry_date }}
            title="แก้ไขรายการ"
            subtitle="แก้ไขได้เฉพาะรายการที่ยังไม่มีการจ่าย"
            submitLabel="บันทึก"
            onClose={() => setEditEntry(null)}
            onSubmit={submitEditEntry}
          />
        )}
      </div>
    </Phone>
  );
}
