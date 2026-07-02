'use client';
// Screen 2 · แดชบอร์ด Admin — สรุปยอด + รายชื่อสมาชิก (ข้อมูลจริงจาก Supabase)
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, font, gradients } from '@/lib/theme';
import { baht } from '@/lib/calc';
import { Phone, ScrollArea } from '@/components/ui/Primitives';
import { PersonCard } from '@/components/PersonCard';
import { BottomNav } from '@/components/ui/BottomNav';
import { IconBell, IconSearch, IconPlus } from '@/components/ui/Icons';
import type { PersonSummary } from '@/types';

// พาเลตต์สี avatar (วนตามลำดับ)
const AVATARS = [
  { bg: '#dff0e6', color: '#1f8a5b' },
  { bg: '#dceeee', color: '#167e73' },
  { bg: '#e8efd8', color: '#5c7a2a' },
  { bg: '#e3f4ea', color: '#1f8a5b' },
  { bg: '#fdeede', color: '#b26b12' },
];

interface Overview {
  bookName: string;
  headline: { totalRemaining: number; totalPaid: number; peopleCount: number };
  people: PersonSummary[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      const res = await fetch('/api/overview');
      if (res.ok) setData(await res.json());
      else if (res.status === 401 || res.status === 403) router.replace('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () => (data?.people ?? []).filter((p) => p.name.includes(query.trim())),
    [data, query]
  );

  const addPerson = async () => {
    const name = window.prompt('ชื่อสมาชิกใหม่');
    if (!name?.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        const p = await res.json();
        window.alert(`เพิ่ม "${p.name}" แล้ว\nโค้ดส่วนตัว: ${p.personal_code}`);
        await load();
      } else {
        window.alert('เพิ่มไม่สำเร็จ');
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <Phone>
      <div style={{ height: '100%', minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: colors.bg }}>
        {/* ── Header สีเขียว ── */}
        <div style={{ flex: 'none', background: gradients.header, padding: '56px 20px 24px', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <button
                onClick={() => router.push('/accounts')}
                style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font.display, fontWeight: 600, fontSize: 18, color: '#fff' }}
              >
                {(data?.bookName ?? '·').charAt(0)}
              </button>
              <div>
                <div style={{ fontSize: 12, opacity: 0.82 }}>บัญชี</div>
                <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 16 }}>{data?.bookName ?? '...'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ padding: '4px 11px', borderRadius: 999, background: 'rgba(255,255,255,.2)', fontSize: 12, fontWeight: 600 }}>Admin</div>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconBell size={19} color="#fff" />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: 13, opacity: 0.85 }}>ยอดค้างเก็บทั้งหมด</div>
            <div className="tabular" style={{ fontFamily: font.display, fontWeight: 700, fontSize: 42, letterSpacing: '-.5px', marginTop: 3 }}>
              {data ? baht(data.headline.totalRemaining) : '—'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.18)', borderRadius: 14, padding: '11px 13px' }}>
              <div style={{ fontSize: 11.5, opacity: 0.82 }}>เก็บแล้วทั้งหมด</div>
              <div className="tabular" style={{ fontFamily: font.display, fontWeight: 600, fontSize: 17, marginTop: 2 }}>{data ? baht(data.headline.totalPaid) : '—'}</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.18)', borderRadius: 14, padding: '11px 13px' }}>
              <div style={{ fontSize: 11.5, opacity: 0.82 }}>สมาชิกทั้งหมด</div>
              <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 17, marginTop: 2 }}>{data ? `${data.headline.peopleCount} คน` : '—'}</div>
            </div>
          </div>
        </div>

        {/* ── รายชื่อสมาชิก ── */}
        <ScrollArea style={{ padding: '18px 16px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 17, color: colors.ink }}>สมาชิก</div>
            <div style={{ fontSize: 13, color: colors.green, fontWeight: 600 }}>ดูทั้งหมด</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 14, padding: '12px 14px', marginBottom: 14 }}>
            <IconSearch size={17} color="#9fb3a8" strokeWidth={2} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาชื่อสมาชิก..."
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: colors.ink, minWidth: 0 }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loading && <div style={{ textAlign: 'center', color: colors.inkMuted, fontSize: 14, padding: '24px 0' }}>กำลังโหลด...</div>}
            {!loading &&
              filtered.map((p, i) => (
                <PersonCard
                  key={p.id}
                  person={p}
                  avatarBg={AVATARS[i % AVATARS.length].bg}
                  avatarColor={AVATARS[i % AVATARS.length].color}
                  onClick={() => router.push(`/admin/person/${p.id}`)}
                />
              ))}
            {!loading && filtered.length === 0 && (
              <div style={{ textAlign: 'center', color: colors.inkMuted, fontSize: 14, padding: '24px 0' }}>
                {query ? 'ไม่พบสมาชิกที่ค้นหา' : 'ยังไม่มีสมาชิก — กด "เพิ่มสมาชิก" ด้านล่าง'}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* ── ปุ่มเพิ่ม + เมนูล่าง ── */}
        <div style={{ flex: 'none', background: colors.surface, borderTop: `1px solid ${colors.border}` }}>
          <div style={{ padding: '12px 16px 10px' }}>
            <button
              onClick={addPerson}
              disabled={creating}
              style={{ width: '100%', height: 50, borderRadius: 15, background: gradients.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#fff', fontFamily: font.display, fontWeight: 600, fontSize: 15.5, boxShadow: '0 10px 22px rgba(31,138,91,.28)', opacity: creating ? 0.7 : 1 }}
            >
              <IconPlus size={18} color="#fff" />
              เพิ่มสมาชิก
            </button>
          </div>
          <BottomNav active="home" />
        </div>
      </div>
    </Phone>
  );
}
