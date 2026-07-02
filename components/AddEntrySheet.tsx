'use client';
// Bottom sheet เพิ่มรายการใหม่ — กรอก รายละเอียด + ยอด + วันที่ (default วันนี้)
import React, { useState } from 'react';
import { colors, font, gradients } from '@/lib/theme';

// วันที่วันนี้ในรูปแบบ YYYY-MM-DD (อิงเวลาเครื่อง)
function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function AddEntrySheet({
  onClose,
  onSubmit,
  initial,
  title = 'เพิ่มรายการ',
  subtitle = 'บันทึกรายการที่ค้างชำระ',
  submitLabel = 'เพิ่มรายการ',
}: {
  onClose: () => void;
  onSubmit: (data: { description: string; amount: number; entry_date: string }) => Promise<void>;
  initial?: { description: string; amount: number; entry_date: string };
  title?: string;
  subtitle?: string;
  submitLabel?: string;
}) {
  const [description, setDescription] = useState(initial?.description ?? '');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [entryDate, setEntryDate] = useState(initial?.entry_date ?? todayISO());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountNum = Number((amount || '').replace(/[^\d.]/g, ''));
  const valid = description.trim().length > 0 && amountNum > 0;

  const submit = async () => {
    if (!valid) {
      setError('กรอกรายละเอียดและยอดให้ครบ (ยอดต้องมากกว่า 0)');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ description: description.trim(), amount: amountNum, entry_date: entryDate });
    } finally {
      setBusy(false);
    }
  };

  const labelStyle: React.CSSProperties = { fontSize: 13, color: colors.inkSoft, fontWeight: 500, marginTop: 16 };
  const fieldStyle: React.CSSProperties = {
    marginTop: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    border: '1.5px solid #bcd8c8',
    borderRadius: 14,
    padding: '14px 16px',
    background: '#f7fbf9',
  };
  const inputStyle: React.CSSProperties = {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontFamily: font.body,
    fontSize: 16,
    color: colors.ink,
    minWidth: 0,
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'absolute', inset: 0, background: 'rgba(14,44,31,.55)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', zIndex: 50 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: colors.surface, borderRadius: '28px 28px 0 0', padding: '10px 20px 30px', boxShadow: '0 -20px 50px rgba(0,0,0,.3)' }}
      >
        <div style={{ width: 40, height: 5, borderRadius: 999, background: '#d7ddd8', margin: '2px auto 16px' }} />
        <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 20, color: colors.ink }}>{title}</div>
        <div style={{ fontSize: 13, color: colors.inkMuted, marginTop: 3 }}>{subtitle}</div>

        {/* รายละเอียด */}
        <div style={labelStyle}>รายละเอียด</div>
        <div style={fieldStyle}>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="เช่น ค่าของชำ"
            autoFocus
            style={inputStyle}
          />
        </div>

        {/* ยอด */}
        <div style={labelStyle}>ยอด (บาท)</div>
        <div style={fieldStyle}>
          <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 20, color: colors.green }}>฿</span>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
            inputMode="numeric"
            placeholder="0"
            style={{ ...inputStyle, fontFamily: font.display, fontWeight: 700, fontSize: 20, color: colors.ink }}
          />
        </div>

        {/* วันที่ (default วันนี้) */}
        <div style={labelStyle}>วันที่</div>
        <div style={fieldStyle}>
          <input
            type="date"
            value={entryDate}
            max={todayISO()}
            onChange={(e) => setEntryDate(e.target.value)}
            style={inputStyle}
          />
        </div>

        {error && <div style={{ color: colors.overdueText, fontSize: 12.5, marginTop: 10 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, height: 52, borderRadius: 15, border: '1.5px solid #dbe3dd', color: '#5a6b62', fontFamily: font.display, fontWeight: 600, fontSize: 15.5, background: colors.surface }}
          >
            ยกเลิก
          </button>
          <button
            onClick={submit}
            disabled={busy || !valid}
            style={{ flex: 1.4, height: 52, borderRadius: 15, background: gradients.brand, color: '#fff', fontFamily: font.display, fontWeight: 600, fontSize: 15.5, boxShadow: '0 10px 22px rgba(31,138,91,.3)', opacity: busy || !valid ? 0.6 : 1 }}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
