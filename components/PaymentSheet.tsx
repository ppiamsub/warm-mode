'use client';
// Screen 4 · Bottom sheet อัปเดตการจ่ายเงิน (รับชำระเต็ม/บางส่วน)
import React, { useState } from 'react';
import { colors, font, gradients } from '@/lib/theme';
import { baht, round2, sanitizeAmount, formatAmountInput } from '@/lib/calc';
import { IconLines } from '@/components/ui/Icons';
import type { EntryView } from '@/types';

export function PaymentSheet({
  entry,
  onClose,
  onSave,
}: {
  entry: EntryView;
  onClose: () => void;
  onSave: (addAmount: number) => void;
}) {
  const [addStr, setAddStr] = useState<string>(String(Math.min(2000, entry.remaining)));
  const add = Math.min(round2(Number(addStr || 0)), entry.remaining);
  const remainingAfter = round2(Math.max(entry.remaining - add, 0));

  const setNum = (n: number) => setAddStr(String(round2(Math.min(Math.max(n, 0), entry.remaining))));
  const quick = (v: number) => setNum(add + v);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(14,44,31,.55)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: colors.surface,
          borderRadius: '28px 28px 0 0',
          padding: '10px 20px 30px',
          boxShadow: '0 -20px 50px rgba(0,0,0,.3)',
        }}
      >
        <div style={{ width: 40, height: 5, borderRadius: 999, background: '#d7ddd8', margin: '2px auto 16px' }} />
        <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 20, color: colors.ink }}>อัปเดตการจ่ายเงิน</div>
        <div style={{ fontSize: 13, color: colors.inkMuted, marginTop: 3 }}>บันทึกยอดที่สมาชิกจ่ายเข้ามา</div>

        {/* รายการที่กำลังจ่าย */}
        <div
          style={{
            marginTop: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: '#f3f8f4',
            border: '1px solid #e3ede7',
            borderRadius: 16,
            padding: '13px 14px',
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 11, background: colors.paidBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <IconLines size={20} color={colors.green} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: colors.ink }}>{entry.description}</div>
            <div style={{ fontSize: 12, color: colors.inkMuted }}>{entry.entry_date}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: colors.inkMuted }}>ยอดเต็ม</div>
            <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 15, color: colors.ink }}>{baht(entry.amount)}</div>
          </div>
        </div>

        {/* สรุป 3 ช่อง */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <Stat label="ยอดเต็ม" value={baht(entry.amount)} />
          <Stat label="จ่ายแล้ว" value={baht(entry.paid_amount)} />
          <Stat label="คงเหลือ" value={baht(entry.remaining)} highlight />
        </div>

        {/* จำนวนที่จ่ายเพิ่ม */}
        <div style={{ marginTop: 18, fontSize: 13, color: colors.inkSoft, fontWeight: 500 }}>จำนวนที่จ่ายเพิ่ม</div>
        <div
          style={{
            marginTop: 8,
            border: `1.5px solid ${colors.green}`,
            borderRadius: 16,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            background: '#f7fbf9',
          }}
        >
          <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 26, color: colors.green }}>฿</span>
          <input
            value={formatAmountInput(addStr)}
            onChange={(e) => setAddStr(sanitizeAmount(e.target.value))}
            inputMode="decimal"
            style={{
              width: `${Math.max(formatAmountInput(addStr).length, 1)}ch`,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: font.display,
              fontWeight: 700,
              fontSize: 30,
              color: colors.green,
              textAlign: 'center',
              fontVariantNumeric: 'tabular-nums',
            }}
          />
        </div>

        {/* ปุ่มลัด */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            onClick={() => setNum(entry.remaining)}
            style={{ flex: 1, textAlign: 'center', padding: '9px 0', borderRadius: 11, background: colors.paidBg, color: colors.green, fontSize: 13, fontWeight: 600, border: '1.5px solid #b7e0c8' }}
          >
            จ่ายครบ {baht(entry.remaining)}
          </button>
          <button onClick={() => quick(1000)} style={quickBtn}>+1,000</button>
          <button onClick={() => quick(500)} style={quickBtn}>+500</button>
        </div>

        {/* คงเหลือหลังจ่าย */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, background: '#e9f5ee', borderRadius: 14, padding: '13px 16px' }}>
          <span style={{ fontSize: 13, color: colors.green, fontWeight: 600 }}>คงเหลือหลังจ่าย</span>
          <span className="tabular" style={{ fontFamily: font.display, fontWeight: 700, fontSize: 19, color: colors.green }}>
            {baht(remainingAfter)}
          </span>
        </div>

        {/* ปุ่ม */}
        <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, height: 52, borderRadius: 15, border: '1.5px solid #dbe3dd', color: '#5a6b62', fontFamily: font.display, fontWeight: 600, fontSize: 15.5, background: colors.surface }}
          >
            ยกเลิก
          </button>
          <button
            onClick={() => onSave(add)}
            style={{ flex: 1.4, height: 52, borderRadius: 15, background: gradients.brand, color: '#fff', fontFamily: font.display, fontWeight: 600, fontSize: 15.5, boxShadow: '0 10px 22px rgba(31,138,91,.3)' }}
          >
            บันทึกการจ่าย
          </button>
        </div>
      </div>
    </div>
  );
}

const quickBtn: React.CSSProperties = {
  flex: 'none',
  padding: '9px 14px',
  borderRadius: 11,
  background: '#f2f5f3',
  color: '#5a6b62',
  fontSize: 13,
  fontWeight: 600,
};

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ flex: 1, background: highlight ? colors.partialBg : '#f6f8f7', borderRadius: 13, padding: 11, textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: highlight ? colors.partialText : colors.inkMuted }}>{label}</div>
      <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 15, color: highlight ? colors.partialText : colors.ink, marginTop: 2 }}>{value}</div>
    </div>
  );
}
