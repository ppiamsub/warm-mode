'use client';
// การ์ดรายการ 1 รายการ + งวดผ่อน (ถ้ามีแผน) — ใช้หน้ารายละเอียดสมาชิก
import React from 'react';
import { colors, font, statusLabel } from '@/lib/theme';
import { baht, thaiFull } from '@/lib/calc';
import { ProgressBar, StatusBadge } from '@/components/ui/Primitives';
import { IconCheck } from '@/components/ui/Icons';
import type { EntryView, Installment } from '@/types';

export function EntryCard({
  entry,
  installments,
  readOnly = false,
  onPay,
  onCreatePlan,
  onToggleInstallment,
  onEditInstallment,
  onDeletePlan,
  onEdit,
}: {
  entry: EntryView;
  installments: Installment[];
  readOnly?: boolean;
  onPay?: () => void;
  onCreatePlan?: () => void;
  onToggleInstallment?: (inst: Installment) => void;
  onEditInstallment?: (inst: Installment) => void;
  onDeletePlan?: () => void;
  onEdit?: () => void;
}) {
  const hasPlan = installments.length > 0;
  // แก้ไขรายการได้เฉพาะเมื่อยังไม่มีการจ่าย และไม่มีแผนผ่อน
  const editable = !readOnly && entry.paid_amount === 0 && !hasPlan;

  return (
    <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 16, padding: 14, boxShadow: '0 1px 2px rgba(12,44,28,.05), 0 8px 20px rgba(16,64,42,.06)' }}>
      {/* หัวรายการ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: colors.ink }}>{entry.description}</div>
          <div style={{ fontSize: 12, color: colors.inkMuted, marginTop: 3 }}>{thaiFull(entry.entry_date)}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {editable && onEdit && (
            <button onClick={onEdit} style={{ fontSize: 12.5, color: colors.green, fontWeight: 600 }}>แก้ไข</button>
          )}
          <div className="tabular" style={{ fontFamily: font.display, fontWeight: 700, fontSize: 16, color: colors.ink }}>{baht(entry.amount)}</div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <ProgressBar value={entry.progress} height={6} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <div style={{ fontSize: 12, color: colors.inkMuted }}>จ่าย {baht(entry.paid_amount)} · คงเหลือ {baht(entry.remaining)}</div>
        <StatusBadge status={entry.status} label={statusLabel[entry.status]} />
      </div>

      {/* งวดผ่อน */}
      {hasPlan ? (
        <div style={{ marginTop: 12, borderTop: `1px dashed ${colors.border}`, paddingTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: colors.ink }}>แผนผ่อน {installments.length} งวด</span>
            {!readOnly && onDeletePlan && (
              <button onClick={onDeletePlan} style={{ fontSize: 12, color: colors.overdueText, fontWeight: 600 }}>ยกเลิกแผน</button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {installments.map((ins) => (
              <div key={ins.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: ins.paid ? colors.paidBg : '#f6f8f7', borderRadius: 11, padding: '9px 11px' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: ins.paid ? colors.green : '#dfe6e1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', fontSize: 12, fontWeight: 700, fontFamily: font.display }}>
                  {ins.paid ? <IconCheck size={14} color="#fff" /> : ins.seq}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: colors.ink }}>งวดที่ {ins.seq}</div>
                  <div style={{ fontSize: 11, color: colors.inkMuted }}>กำหนด {thaiFull(ins.due_date)}{ins.paid && ins.paid_at ? ` · จ่าย ${thaiFull(ins.paid_at)}` : ''}</div>
                </div>
                {!readOnly && onEditInstallment ? (
                  <button onClick={() => onEditInstallment(ins)} className="tabular" style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14, color: colors.ink, textDecoration: 'underline dotted', textUnderlineOffset: 3 }}>
                    {baht(ins.amount)}
                  </button>
                ) : (
                  <div className="tabular" style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14, color: colors.ink }}>{baht(ins.amount)}</div>
                )}
                {readOnly ? (
                  <span style={{ flex: 'none', fontSize: 11, fontWeight: 600, color: ins.paid ? colors.paidText : colors.partialText, background: ins.paid ? '#d8efe1' : colors.partialBg, padding: '3px 8px', borderRadius: 999 }}>
                    {ins.paid ? 'จ่ายแล้ว' : 'รอชำระ'}
                  </span>
                ) : (
                  <button
                    onClick={() => onToggleInstallment?.(ins)}
                    style={{ flex: 'none', fontSize: 11.5, fontWeight: 600, color: ins.paid ? colors.inkMuted : '#fff', background: ins.paid ? '#e6ece8' : colors.green, padding: '6px 11px', borderRadius: 999 }}
                  >
                    {ins.paid ? 'ยกเลิก' : 'เก็บงวด'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        !readOnly && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={onPay} style={{ flex: 1, height: 40, borderRadius: 12, background: colors.paidBg, color: colors.green, fontFamily: font.display, fontWeight: 600, fontSize: 13.5 }}>จ่ายเพิ่ม</button>
            <button onClick={onCreatePlan} style={{ flex: 1, height: 40, borderRadius: 12, border: `1.5px solid ${colors.green}`, color: colors.green, fontFamily: font.display, fontWeight: 600, fontSize: 13.5, background: colors.surface }}>ผ่อนจ่าย</button>
          </div>
        )
      )}
    </div>
  );
}
