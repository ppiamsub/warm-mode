'use client';
// ประวัติการทำรายการ (Activity Log) — timeline ของทุกการกระทำในบัญชี
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, font, gradients } from '@/lib/theme';
import { thaiFull } from '@/lib/calc';
import { Phone, ScrollArea } from '@/components/ui/Primitives';
import { BottomNav } from '@/components/ui/BottomNav';
import { IconBack, IconPlus, IconCheck, IconLines, IconChart } from '@/components/ui/Icons';

interface Activity {
  id: string;
  action: string;
  actor_name: string | null;
  person_name: string | null;
  entry_id: string | null;
  summary: string;
  created_at: string;
}

// จับกลุ่มประเภทการกระทำ → ไอคอน + สี
function styleFor(action: string): { Icon: typeof IconPlus; bg: string; color: string } {
  if (action === 'entry_add') return { Icon: IconPlus, bg: colors.paidBg, color: colors.green };
  if (action === 'pay' || action === 'installment_pay') return { Icon: IconCheck, bg: colors.paidBg, color: colors.paidText };
  if (action === 'plan_create') return { Icon: IconChart, bg: '#e4f1ee', color: '#167e73' };
  if (action === 'entry_delete' || action === 'plan_delete' || action === 'person_delete' || action === 'installment_unpay')
    return { Icon: IconLines, bg: '#fbe9e6', color: colors.overdueText };
  // แก้ไขทั่วไป (ยอด/ชื่อ/งวด/บัญชี)
  return { Icon: IconLines, bg: colors.partialBg, color: colors.partialText };
}

function timeHM(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function ActivityPage() {
  const router = useRouter();
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/activity');
        if (res.ok) setItems((await res.json()).activities ?? []);
        else if (res.status === 401 || res.status === 403) router.replace('/');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // จัดกลุ่มตามวัน (ล่าสุดก่อน)
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

  return (
    <Phone>
      <div style={{ height: '100%', minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: colors.bg }}>
        <div style={{ flex: 'none', background: gradients.header, padding: '56px 20px 24px', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={() => router.push('/admin')} style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconBack size={18} color="#fff" />
            </button>
            <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 16 }}>ประวัติการทำรายการ</div>
            <div style={{ width: 38 }} />
          </div>
          <div style={{ marginTop: 14, fontSize: 12.5, opacity: 0.85 }}>บันทึกการเพิ่ม / แก้ไข / ลบ / กดจ่าย / แผนผ่อน ทั้งหมดในบัญชี</div>
        </div>

        <ScrollArea style={{ padding: '16px 16px 16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: colors.inkMuted, fontSize: 14, padding: '30px 0' }}>กำลังโหลด...</div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', color: colors.inkMuted, fontSize: 14, padding: '40px 0' }}>ยังไม่มีประวัติการทำรายการ</div>
          ) : (
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
                              {a.actor_name ? ` · โดย ${a.actor_name}` : ''}
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
          )}
        </ScrollArea>

        <div style={{ flex: 'none', background: colors.surface, borderTop: `1px solid ${colors.border}` }}>
          <BottomNav active="activity" />
        </div>
      </div>
    </Phone>
  );
}
