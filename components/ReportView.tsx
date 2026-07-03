'use client';
// Dashboard สรุปยอด (ใช้ร่วมกัน Admin + Viewer) — แท็บรายเดือน/รายปี + drill-in + export .xlsx
import React, { useMemo, useState } from 'react';
import { colors, font } from '@/lib/theme';
import { baht, currentMonthKeyTH, round2, thaiFull } from '@/lib/calc';
import { ScrollArea } from '@/components/ui/Primitives';
import { IconChevron } from '@/components/ui/Icons';

export interface ReportInst {
  id: string;
  seq: number;
  amount: number;
  due_date: string;
  paid: boolean;
  paid_at: string | null;
}

export interface ReportRow {
  id: string;
  description: string;
  amount: number;
  paid_amount: number;
  remaining: number;
  entry_date: string;
  person_name: string;
  installments: ReportInst[];
}

const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

interface DueItem {
  key: string;
  person_name: string;
  description: string;
  seq: number | null;
  due_date: string;
  amount: number;
  paid: boolean;
  paid_at: string | null;
  collected: number;
}

interface Bucket {
  key: string;
  label: string;
  due: number;
  collected: number;
  outstanding: number;
  count: number;
  items: DueItem[];
}

interface YearBucket {
  key: string;
  label: string;
  due: number;
  collected: number;
  outstanding: number;
  count: number;
  paidCount: number;
  months: Bucket[];
}

export function ReportView({ rows, exportName = 'warm-mode-report' }: { rows: ReportRow[]; exportName?: string }) {
  const [exporting, setExporting] = useState(false);
  const [tab, setTab] = useState<'month' | 'year'>('month');
  const [selected, setSelected] = useState<Bucket | null>(null);
  const [selectedYear, setSelectedYear] = useState<YearBucket | null>(null);

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
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${TH_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
      const b = map.get(key) ?? { key, label, due: 0, collected: 0, outstanding: 0, count: 0, items: [] };
      b.due += it.amount;
      b.collected += it.collected;
      b.outstanding += it.amount - it.collected;
      b.count += 1;
      b.items.push(it);
      map.set(key, b);
    }
    for (const b of map.values()) {
      b.items.sort((a, z) => (a.paid === z.paid ? (a.due_date < z.due_date ? -1 : 1) : a.paid ? 1 : -1));
    }
    return Array.from(map.values()).sort((a, b) => (a.key < b.key ? 1 : -1));
  }, [dueItems]);

  const visibleBuckets = useMemo(() => {
    const cutoff = currentMonthKeyTH();
    return buckets.filter((b) => b.key <= cutoff);
  }, [buckets]);

  const currentYear = currentMonthKeyTH().slice(0, 4);
  const monthsThisYear = useMemo(() => visibleBuckets.filter((b) => b.key.slice(0, 4) === currentYear), [visibleBuckets, currentYear]);

  const yearBuckets = useMemo<YearBucket[]>(() => {
    const map = new Map<string, YearBucket>();
    for (const b of visibleBuckets) {
      const yk = b.key.slice(0, 4);
      const y = map.get(yk) ?? { key: yk, label: `ปี ${Number(yk) + 543}`, due: 0, collected: 0, outstanding: 0, count: 0, paidCount: 0, months: [] };
      y.due += b.due;
      y.collected += b.collected;
      y.outstanding += b.outstanding;
      y.count += b.count;
      y.paidCount += b.items.filter((i) => i.paid).length;
      y.months.push(b);
      map.set(yk, y);
    }
    return Array.from(map.values()).sort((a, b) => (a.key < b.key ? 1 : -1));
  }, [visibleBuckets]);

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
      const wb = XLSX.utils.book_new();
      const cutoff = currentMonthKeyTH();
      const mk = (d: string) => String(d).slice(0, 7);

      // ชีต 1: สรุปรายปี
      const yearSummaryRows = yearBuckets.map((y) => ({
        ปี: y.label,
        จำนวนงวด: y.count,
        งวดที่จ่ายแล้ว: y.paidCount,
        ต้องจ่าย: round2(y.due),
        เก็บแล้ว: round2(y.collected),
        ค้างจ่าย: round2(y.outstanding),
      }));
      const wsYear = XLSX.utils.json_to_sheet(yearSummaryRows);
      wsYear['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 13 }, { wch: 13 }, { wch: 13 }, { wch: 13 }];
      XLSX.utils.book_append_sheet(wb, wsYear, 'สรุปรายปี');

      // ชีตแยกตามเดือน — เดือนใหม่สุด/ปัจจุบันก่อน (sheet 2,3,4,...)
      const byMonth = new Map<string, DueItem[]>();
      for (const it of dueItems) {
        const key = mk(it.due_date);
        if (key > cutoff) continue;
        const arr = byMonth.get(key) ?? [];
        arr.push(it);
        byMonth.set(key, arr);
      }
      const monthLabel = (key: string) => {
        const [y, m] = key.split('-').map(Number);
        return `${TH_MONTHS[m - 1]} ${y + 543}`;
      };
      const usedNames = new Set<string>();
      for (const key of Array.from(byMonth.keys()).sort((a, b) => (a < b ? 1 : -1))) {
        const items = byMonth.get(key)!.slice().sort((a, b) => (a.due_date < b.due_date ? -1 : 1));
        const monthRows: Record<string, string | number>[] = items.map((it) => ({
          กำหนดชำระ: it.due_date,
          สมาชิก: it.person_name,
          รายการ: it.description,
          งวดที่: it.seq ?? '-',
          ต้องจ่าย: it.amount,
          สถานะ: it.paid ? 'จ่ายแล้ว' : 'ค้างจ่าย',
          จ่ายจริงเมื่อ: it.paid_at ?? '',
          ค้างจ่าย: round2(it.amount - it.collected),
        }));
        const due = round2(items.reduce((s, it) => s + it.amount, 0));
        const collected = round2(items.reduce((s, it) => s + it.collected, 0));
        monthRows.push({ กำหนดชำระ: 'รวม', สมาชิก: '', รายการ: '', งวดที่: '', ต้องจ่าย: due, สถานะ: `เก็บแล้ว ${collected}`, จ่ายจริงเมื่อ: '', ค้างจ่าย: round2(due - collected) });
        const wsM = XLSX.utils.json_to_sheet(monthRows);
        wsM['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 24 }, { wch: 8 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 12 }];
        let name = monthLabel(key).replace(/[[\]:*?/\\]/g, '').slice(0, 31);
        while (usedNames.has(name)) name = (name + '_').slice(0, 31);
        usedNames.add(name);
        XLSX.utils.book_append_sheet(wb, wsM, name);
      }

      XLSX.writeFile(wb, `${exportName}-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <ScrollArea style={{ padding: '16px 16px 16px' }}>
        {/* สรุปยอดรวม */}
        <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 18, padding: 16, boxShadow: '0 1px 2px rgba(12,44,28,.05), 0 8px 20px rgba(16,64,42,.06)', marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, color: colors.inkMuted }}>ยอดที่ต้องจ่ายทั้งหมด</div>
          <div className="tabular" style={{ fontFamily: font.display, fontWeight: 700, fontSize: 30, color: colors.ink, marginTop: 2 }}>{baht(grand.due)}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Stat label="เก็บแล้ว" value={baht(grand.collected)} color={colors.paidText} />
            <Stat label="ค้างจ่าย" value={baht(grand.outstanding)} color={colors.partialText} />
          </div>
        </div>

        {/* export */}
        <button
          onClick={exportXlsx}
          disabled={exporting || rows.length === 0}
          style={{ marginBottom: 14, width: '100%', height: 50, borderRadius: 14, border: `1.5px solid ${colors.green}`, background: colors.surface, color: colors.green, fontFamily: font.display, fontWeight: 600, fontSize: 15, opacity: exporting || rows.length === 0 ? 0.6 : 1 }}
        >
          {exporting ? 'กำลังสร้างไฟล์...' : '⬇ Export สรุป (.xlsx)'}
        </button>

        {/* toggle รายเดือน / รายปี */}
        <div style={{ display: 'flex', background: '#eef2ef', borderRadius: 14, padding: 4, gap: 4, marginBottom: 14 }}>
          {(['month', 'year'] as const).map((t) => {
            const on = tab === t;
            return (
              <button key={t} onClick={() => setTab(t)} style={{ flex: 1, textAlign: 'center', padding: '9px 0', borderRadius: 11, background: on ? colors.surface : 'transparent', boxShadow: on ? '0 1px 3px rgba(16,40,28,.1)' : 'none', color: on ? colors.ink : '#7c8c83', fontWeight: on ? 600 : 500, fontSize: 13.5 }}>
                {t === 'month' ? 'รายเดือน' : 'รายปี'}
              </button>
            );
          })}
        </div>

        {rows.length === 0 ? (
          <div style={{ textAlign: 'center', color: colors.inkMuted, fontSize: 14, padding: '30px 0' }}>ยังไม่มีข้อมูล</div>
        ) : tab === 'month' ? (
          monthsThisYear.length === 0 ? (
            <div style={{ textAlign: 'center', color: colors.inkMuted, fontSize: 14, padding: '30px 0' }}>ยังไม่มีข้อมูลของปีนี้</div>
          ) : (
            <>
              <div style={{ fontSize: 12, color: colors.inkMuted, margin: '0 2px 10px' }}>เฉพาะปี พ.ศ. {Number(currentYear) + 543}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {monthsThisYear.map((b) => (
                  <MonthCard key={b.key} b={b} onClick={() => setSelected(b)} />
                ))}
              </div>
            </>
          )
        ) : yearBuckets.length === 0 ? (
          <div style={{ textAlign: 'center', color: colors.inkMuted, fontSize: 14, padding: '30px 0' }}>ยังไม่มีข้อมูล</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {yearBuckets.map((y) => (
              <YearCard key={y.key} y={y} onClick={() => setSelectedYear(y)} />
            ))}
          </div>
        )}
      </ScrollArea>

      {selectedYear && (
        <YearDetailSheet
          year={selectedYear}
          onClose={() => setSelectedYear(null)}
          onPickMonth={(m) => {
            setSelectedYear(null);
            setSelected(m);
          }}
        />
      )}
      {selected && <MonthDetailSheet bucket={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function MonthCard({ b, onClick }: { b: Bucket; onClick: () => void }) {
  const paidCount = b.items.filter((i) => i.paid).length;
  return (
    <button
      onClick={onClick}
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
}

function YearCard({ y, onClick }: { y: YearBucket; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ display: 'block', width: '100%', textAlign: 'left', background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 14, boxShadow: '0 1px 2px rgba(12,44,28,.05), 0 8px 20px rgba(16,64,42,.06)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 15, color: colors.ink }}>{y.label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: colors.inkMuted }}>{y.months.length} เดือน · จ่ายแล้ว {y.paidCount}/{y.count} งวด</span>
          <IconChevron size={16} color={colors.inkMuted} style={{ transform: 'rotate(-90deg)' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <Stat label="ต้องจ่าย" value={baht(y.due)} />
        <Stat label="เก็บแล้ว" value={baht(y.collected)} color={colors.paidText} />
        <Stat label="ค้างจ่าย" value={baht(y.outstanding)} color={colors.partialText} />
      </div>
    </button>
  );
}

function YearDetailSheet({ year, onClose, onPickMonth }: { year: YearBucket; onClose: () => void; onPickMonth: (b: Bucket) => void }) {
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(14,44,31,.55)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', zIndex: 50 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: colors.surface, borderRadius: '28px 28px 0 0', boxShadow: '0 -20px 50px rgba(0,0,0,.3)', maxHeight: '82%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 'none', padding: '10px 20px 14px', borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ width: 40, height: 5, borderRadius: 999, background: '#d7ddd8', margin: '2px auto 14px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 20, color: colors.ink }}>{year.label}</div>
            <div style={{ fontSize: 12.5, color: colors.inkMuted }}>{year.months.length} เดือน · {year.count} งวด</div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Stat label="ต้องจ่าย" value={baht(year.due)} />
            <Stat label="เก็บแล้ว" value={baht(year.collected)} color={colors.paidText} />
            <Stat label="ค้างจ่าย" value={baht(year.outstanding)} color={colors.partialText} />
          </div>
        </div>
        <div className="no-scrollbar" style={{ flex: 1, overflow: 'auto', padding: '14px 16px 26px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {year.months.map((m) => (
            <MonthCard key={m.key} b={m} onClick={() => onPickMonth(m)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MonthDetailSheet({ bucket, onClose }: { bucket: Bucket; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(14,44,31,.55)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', zIndex: 50 }}>
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
