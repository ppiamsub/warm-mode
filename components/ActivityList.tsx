'use client';
// รายการประวัติการทำรายการ (timeline) — ใช้ร่วมกัน Admin + Viewer
import React, { useMemo } from 'react';
import { colors, font } from '@/lib/theme';
import { thaiFull } from '@/lib/calc';
import { IconPlus, IconCheck, IconLines, IconChart } from '@/components/ui/Icons';

export interface Activity {
  id: string;
  action: string;
  actor_name: string | null;
  person_name: string | null;
  entry_id: string | null;
  summary: string;
  created_at: string;
}

function styleFor(action: string): { Icon: typeof IconPlus; bg: string; color: string } {
  if (action === 'entry_add') return { Icon: IconPlus, bg: colors.paidBg, color: colors.green };
  if (action === 'pay' || action === 'installment_pay') return { Icon: IconCheck, bg: colors.paidBg, color: colors.paidText };
  if (action === 'plan_create') return { Icon: IconChart, bg: '#e4f1ee', color: '#167e73' };
  if (action === 'entry_delete' || action === 'plan_delete' || action === 'person_delete' || action === 'installment_unpay')
    return { Icon: IconLines, bg: '#fbe9e6', color: colors.overdueText };
  return { Icon: IconLines, bg: colors.partialBg, color: colors.partialText };
}

function timeHM(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function ActivityList({ items, showActor = true }: { items: Activity[]; showActor?: boolean }) {
  const groups = useMemo(() => {
    const map = new Map<string, { label: string; items: Activity[] }>();
    for (const a of items) {
      const key = String(a.created_at).slice(0, 10);
      const g = map.get(key) ?? { label: thaiFull(a.created_at), items: [] };
      g.items.push(a);
      map.set(key, g);
    }
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([, g]) => g);
  }, [items]);

  if (items.length === 0) {
    return <div style={{ textAlign: 'center', color: colors.inkMuted, fontSize: 14, padding: '40px 0' }}>ยังไม่มีประวัติการทำรายการ</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {groups.map((g) => (
        <div key={g.label}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.inkMuted, marginBottom: 9, marginLeft: 2 }}>{g.label}</div>
          <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 2px rgba(12,44,28,.05), 0 8px 20px rgba(16,64,42,.06)' }}>
            {g.items.map((a, i) => {
              const s = styleFor(a.action);
              return (
                <div key={a.id} style={{ display: 'flex', gap: 11, padding: '12px 13px', borderTop: i === 0 ? 'none' : `1px solid ${colors.borderSoft}` }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                    <s.Icon size={16} color={s.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: colors.ink, lineHeight: 1.35 }}>{a.summary}</div>
                    <div style={{ fontSize: 11.5, color: colors.inkMuted, marginTop: 3 }}>
                      {timeHM(a.created_at)}
                      {showActor && a.actor_name ? ` · โดย ${a.actor_name}` : ''}
                      {a.person_name ? ` · ${a.person_name}` : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
