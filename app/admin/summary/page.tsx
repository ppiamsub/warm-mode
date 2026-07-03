'use client';
// Dashboard สรุปยอด — รายเดือน/รายปี + export .xlsx
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, font, gradients } from '@/lib/theme';
import { baht } from '@/lib/calc';
import { Phone, ScrollArea } from '@/components/ui/Primitives';
import { BottomNav } from '@/components/ui/BottomNav';
import { IconBack, IconChevron } from '@/components/ui/Icons';
import { thaiFull } from '@/lib/calc';

interface Inst {
  id: string;
  seq: number;
  amount: number;
  due_date: string;
  paid: boolean;
  paid_at: string | null;
}

interface Row {
  id: string;
  description: string;
  amount: number;
  paid_amount: number;
  remaining: number;
  entry_date: string;
  person_name: string;
  installments: Inst[];
}

const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

// รายการที่ต้องจ่าย 1 ชิ้น — งวดผ่อน หรือรายการที่ไม่มีแผน (นับเป็นก้อนเดียว)
interface DueItem {
  key: string;
  person_name: string;
  description: string;
  seq: number | null; // งวดที่ (null = ไม่มีแผนผ่อน)
  due_date: string; // เดือนที่ต้องเริ่มจ่าย → ใช้จัดกลุ่ม
  amount: number; // ยอดที่ต้องจ่าย
  paid: boolean;
  paid_at: string | null; // stamp วันที่กดว่าจ่ายจริง
  collected: number; // ยอดที่เก็บได้จริง
}

interface Bucket {
  key: string;
  label: string;
  due: number; // ยอดที่ต้องจ่ายรวมในเดือน
  collected: number; // เก็บแล้ว (อิงยอดที่ต้องจ่าย)
  outstanding: number; // ค้างจ่าย
  count: number;
  items: DueItem[];
}

export default function SummaryPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'month' | 'year'>('month');
  const [exporting, setExporting] = useState(false);
  const [selected, setSelected] = useState<Bucket | null>(null);

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

  // แตกทุกรายการเป็น "รายการที่ต้องจ่าย" — งวดผ่อนอิง due_date, รายการไม่มีแผนอิง entry_date
  const dueItems = useMemo<DueItem[]>(() => {
    const out: DueItem[] = [];
    for (const r of rows) {
      if (r.installments && r.installments.length) {
        for (const ins of r.installments) {
          out.push({
            key: ins.id,
            person_name: r.person_name,
            description: r.description,
            seq: ins.seq,
            due_date: ins.due_date,
            amount: Number(ins.amount),
            paid: !!ins.paid,
            paid_at: ins.paid_at,
            collected: ins.paid ? Number(ins.amount) : 0,
          });
        }
      } else {
        out.push({
          key: r.id,
          person_name: r.person_name,
          description: r.description,
          seq: null,
          due_date: r.entry_date,
          amount: Number(r.amount),
          paid: r.remaining === 0 && Number(r.amount) > 0,
          paid_at: null,
          collected: Number(r.paid_amount),
        });
      }
    }
    return out;
  }, [rows]);

  const buckets = useMemo<Bucket[]>(() => {
    const map = new Map<string, Bucket>();
    for (const it of dueItems) {
      const d = new Date(it.due_date);
      if (isNaN(d.getTime())) continue;
      const key = mode === 'month' ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` : `${d.getFullYear()}`;
      const label = mode === 'month' ? `${TH_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}` : `ปี ${d.getFullYear() + 543}`;
      const b = map.get(key) ?? { key, label, due: 0, collected: 0, outstanding: 0, count: 0, items: [] };
      b.due += it.amount;
      b.collected += it.collected;
      b.outstanding += it.amount - it.collected;
      b.count += 1;
      b.items.push(it);
      map.set(key, b);
    }
    // เรียงงวดในแต่ละเดือน: ยังไม่จ่ายก่อน แล้วตามกำหนดชำระ
    for (const b of map.values()) {
      b.items.sort((a, z) => (a.paid === z.paid ? (a.due_date < z.due_date ? -1 : 1) : a.paid ? 1 : -1));
    }
    return Array.from(map.values()).sort((a, b) => (a.key < b.key ? 1 : -1));
  }, [dueItems, mode]);

  const grand = useMemo(
    () =>
      dueItems.reduce(
        (s, it) => ({ due: s.due + it.amount, collected: s.collected + it.collected, outstanding: s.outstanding + (it.amount - it.collected) }),
        { due: 0, collected: 0, outstanding: 0 }
      ),
    [dueItems]
  );

  const exportXlsx = async () => {
    setExporting(true);
    try {
      const XLSX = await import('xlsx');
      // export ตามกำหนดชำระ (งวดผ่อน) พร้อม stamp วันจ่ายจริง
      const data = dueItems
        .slice()
        .sort((a, b) => (a.due_date < b.due_date ? -1 : 1))
        .map((it) => ({
          กำหนดชำระ: it.due_date,
          สมาชิก: it.person_name,
          รายการ: it.description,
          งวดที่: it.seq ?? '-',
          ต้องจ่าย: it.amount,
          สถานะ: it.paid ? 'จ่ายแล้ว' : 'ค้างจ่าย',
          จ่ายจริงเมื่อ: it.paid_at ?? '',
          ค้างจ่าย: it.amount - it.collected,
        }));
      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 24 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 12 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'กำหนดชำระ');
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

          {/* ยอดรวมทั้งหมด — อิงยอดที่ต้องจ่ายตามกำหนดชำระ */}
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 13, opacity: 0.85 }}>ยอดที่ต้องจ่ายทั้งบัญชี</div>
            <div className="tabular" style={{ fontFamily: font.display, fontWeight: 700, fontSize: 38, marginTop: 2 }}>{baht(grand.due)}</div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.18)', borderRadius: 12, padding: '9px 12px' }}>
              <div style={{ fontSize: 11, opacity: 0.82 }}>เก็บแล้ว</div>
              <div className="tabular" style={{ fontFamily: font.display, fontWeight: 600, fontSize: 15 }}>{baht(grand.collected)}</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.18)', borderRadius: 12, padding: '9px 12px' }}>
              <div style={{ fontSize: 11, opacity: 0.82 }}>ค้างจ่าย</div>
              <div className="tabular" style={{ fontFamily: font.display, fontWeight: 600, fontSize: 15 }}>{baht(grand.outstanding)}</div>
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
              {buckets.map((b) => {
                const paidCount = b.items.filter((i) => i.paid).length;
                return (
                  <button
                    key={b.key}
                    onClick={() => setSelected(b)}
                    style={{ display: 'block', width: '100%', textAlign: 'left', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 14, boxShadow: '0 1px 2px rgba(12,44,28,.05), 0 8px 20px rgba(16,64,42,.06)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 15, color: colors.ink }}>{b.label}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12, color: colors.inkMuted }}>จ่ายแล้ว {paidCount}/{b.count} งวด</span>
                        <IconChevron size={16} color={colors.inkMuted} style={{ transform: 'rotate(-90deg)' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <Stat label="ต้องจ่าย" value={baht(b.due)} />
                      <Stat label="เก็บแล้ว" value={baht(b.collected)} color={colors.paidText} />
                      <Stat label="ค้างจ่าย" value={baht(b.outstanding)} color={colors.partialText} />
                    </div>
                  </button>
                );
              })}
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

        {selected && <MonthDetailSheet bucket={selected} onClose={() => setSelected(null)} />}
      </div>
    </Phone>
  );
}

// รายละเอียดของเดือน/ปีที่กดเข้าไป — ดูงวดทั้งหมด + stamp วันจ่ายจริง
function MonthDetailSheet({ bucket, onClose }: { bucket: Bucket; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'absolute', inset: 0, background: 'rgba(14,44,31,.55)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', zIndex: 50 }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ background: colors.surface, borderRadius: '28px 28px 0 0', boxShadow: '0 -20px 50px rgba(0,0,0,.3)', maxHeight: '82%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 'none', padding: '10px 20px 14px', borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ width: 40, height: 5, borderRadius: 999, background: '#d7ddd8', margin: '2px auto 14px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 20, color: colors.ink }}>{bucket.label}</div>
            <div style={{ fontSize: 12.5, color: colors.inkMuted }}>{bucket.count} งวด</div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Stat label="ต้องจ่าย" value={baht(bucket.due)} />
            <Stat label="เก็บแล้ว" value={baht(bucket.collected)} color={colors.paidText} />
            <Stat label="ค้างจ่าย" value={baht(bucket.outstanding)} color={colors.partialText} />
          </div>
        </div>

        <div className="no-scrollbar" style={{ flex: 1, overflow: 'auto', padding: '14px 16px 26px', display: 'flex', flexDirection: 'column', gap: 7 }}>
          {bucket.items.map((it) => (
            <div key={it.key} style={{ display: 'flex', alignItems: 'center', gap: 10, background: it.paid ? colors.paidBg : '#f6f8f7', borderRadius: 12, padding: '11px 12px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: colors.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {it.person_name}
                  {it.seq != null && <span style={{ color: colors.inkMuted, fontWeight: 500 }}> · งวดที่ {it.seq}</span>}
                </div>
                <div style={{ fontSize: 11.5, color: colors.inkMuted, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.description}</div>
                <div style={{ fontSize: 11, color: colors.inkMuted, marginTop: 2 }}>
                  กำหนด {thaiFull(it.due_date)}
                  {it.paid && it.paid_at ? ` · จ่ายจริง ${thaiFull(it.paid_at)}` : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right', flex: 'none' }}>
                <div className="tabular" style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, color: colors.ink }}>{baht(it.amount)}</div>
                <div style={{ fontSize: 10.5, fontWeight: 600, color: it.paid ? colors.paidText : colors.partialText, marginTop: 1 }}>{it.paid ? 'จ่ายแล้ว' : 'ค้างจ่าย'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
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
