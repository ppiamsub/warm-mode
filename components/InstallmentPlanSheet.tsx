'use client';
// Bottom sheet สร้างแผนผ่อน — กำหนดจำนวนงวด + วันเริ่ม (แบ่งยอดเท่า ๆ กัน รายเดือน)
import React, { useState } from 'react';
import { colors, font, gradients } from '@/lib/theme';
import { baht } from '@/lib/calc';

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function InstallmentPlanSheet({
  total,
  onClose,
  onSubmit,
}: {
  total: number;
  onClose: () => void;
  onSubmit: (data: { count: number; startDate: string }) => Promise<void>;
}) {
  const [count, setCount] = useState(3);
  const [startDate, setStartDate] = useState(todayISO());
  const [busy, setBusy] = useState(false);

  const perFirst = Math.floor(total / count);
  const last = total - perFirst * (count - 1);

  const submit = async () => {
    setBusy(true);
    try {
      await onSubmit({ count, startDate });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'absolute', inset: 0, background: 'rgba(14,44,31,.55)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', zIndex: 50 }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ background: colors.surface, borderRadius: '28px 28px 0 0', padding: '10px 20px 30px', boxShadow: '0 -20px 50px rgba(0,0,0,.3)' }}>
        <div style={{ width: 40, height: 5, borderRadius: 999, background: '#d7ddd8', margin: '2px auto 16px' }} />
        <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 20, color: colors.ink }}>สร้างแผนผ่อนจ่าย</div>
        <div style={{ fontSize: 13, color: colors.inkMuted, marginTop: 3 }}>แบ่งยอด {baht(total)} ออกเป็นงวด ๆ กำหนดชำระรายเดือน</div>

        {/* จำนวนงวด */}
        <div style={{ marginTop: 18, fontSize: 13, color: colors.inkSoft, fontWeight: 500 }}>จำนวนงวด</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
          <button onClick={() => setCount((c) => Math.max(2, c - 1))} style={stepBtn}>−</button>
          <div style={{ flex: 1, textAlign: 'center', fontFamily: font.display, fontWeight: 700, fontSize: 26, color: colors.green }}>{count} งวด</div>
          <button onClick={() => setCount((c) => Math.min(60, c + 1))} style={stepBtn}>+</button>
        </div>

        {/* วันเริ่มงวดแรก */}
        <div style={{ marginTop: 16, fontSize: 13, color: colors.inkSoft, fontWeight: 500 }}>กำหนดชำระงวดแรก</div>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', border: '1.5px solid #bcd8c8', borderRadius: 14, padding: '13px 16px', background: '#f7fbf9' }}>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: font.body, fontSize: 16, color: colors.ink, minWidth: 0 }} />
        </div>

        {/* พรีวิว */}
        <div style={{ marginTop: 16, background: '#f3f8f4', border: '1px solid #e3ede7', borderRadius: 14, padding: '13px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: colors.inkMuted }}>ยอดต่องวด</span>
          <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 16, color: colors.ink }}>
            {baht(perFirst)}{last !== perFirst ? ` (งวดสุดท้าย ${baht(last)})` : ''}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
          <button onClick={onClose} style={{ flex: 1, height: 52, borderRadius: 15, border: '1.5px solid #dbe3dd', color: '#5a6b62', fontFamily: font.display, fontWeight: 600, fontSize: 15.5, background: colors.surface }}>ยกเลิก</button>
          <button onClick={submit} disabled={busy} style={{ flex: 1.4, height: 52, borderRadius: 15, background: gradients.brand, color: '#fff', fontFamily: font.display, fontWeight: 600, fontSize: 15.5, boxShadow: '0 10px 22px rgba(31,138,91,.3)', opacity: busy ? 0.6 : 1 }}>สร้างแผน</button>
        </div>
      </div>
    </div>
  );
}

const stepBtn: React.CSSProperties = {
  width: 46,
  height: 46,
  borderRadius: 13,
  background: colors.paidBg,
  color: colors.green,
  fontFamily: font.display,
  fontWeight: 700,
  fontSize: 24,
  flex: 'none',
};
