'use client';
// หน้าเลือกบัญชี (Account Hub) — หลัง Login LINE
// แสดงบัญชีที่ผู้ใช้เป็นสมาชิก + สร้างบัญชีใหม่ + เข้าร่วมด้วยโค้ด
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, font, gradients } from '@/lib/theme';
import { Phone, ScrollArea } from '@/components/ui/Primitives';
import { IconPlus } from '@/components/ui/Icons';
import type { Account } from '@/types';

export default function AccountHubPage() {
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [userName, setUserName] = useState('ผู้ใช้');
  const [loading, setLoading] = useState(true);

  // โหลดรายการบัญชีจริงจาก DB
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/accounts');
        if (res.ok) {
          const data = await res.json();
          setAccounts(data.accounts ?? []);
          if (data.name) setUserName(data.name);
        }
      } catch {
        /* ไม่มี session — แสดงรายการว่าง */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // เลือกบัญชี ➔ set context ลง session แล้วเข้า dashboard ตามบทบาท
  const selectAccount = async (acc: Account) => {
    try {
      await fetch('/api/accounts/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: acc.bookId }),
      });
    } catch {
      /* โหมด demo — ข้ามไปได้ */
    }
    router.push(acc.role === 'admin' ? '/admin' : '/viewer');
  };

  const createBook = async () => {
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        router.push('/admin');
        return;
      }
    } catch {
      /* โหมด demo */
    }
    router.push('/admin');
  };

  return (
    <Phone>
      <div style={{ height: '100%', minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: colors.bg }}>
        {/* Header */}
        <div style={{ flex: 'none', background: gradients.header, padding: '56px 20px 26px', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                background: 'rgba(255,255,255,.2)',
                border: '1px solid rgba(255,255,255,.28)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: font.display,
                fontWeight: 600,
                fontSize: 19,
              }}
            >
              {userName.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: 12.5, opacity: 0.85 }}>เข้าสู่ระบบด้วย LINE แล้ว</div>
              <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 18 }}>{userName}</div>
            </div>
          </div>
          <div style={{ marginTop: 20, fontFamily: font.display, fontWeight: 700, fontSize: 22 }}>เลือกบัญชี</div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>เลือกบัญชีที่ต้องการเข้าใช้งาน</div>
        </div>

        <ScrollArea style={{ padding: '18px 16px 20px' }}>
          {/* รายการบัญชี */}
          {loading ? (
            <div style={{ textAlign: 'center', color: colors.inkMuted, fontSize: 14, padding: '24px 0' }}>กำลังโหลด...</div>
          ) : accounts.length === 0 ? (
            <div style={{ textAlign: 'center', color: colors.inkMuted, fontSize: 14, padding: '20px 0 4px', lineHeight: 1.6 }}>
              ยังไม่มีบัญชี
              <br />
              เริ่มด้วยการสร้างบัญชีของคุณ หรือเข้าร่วมด้วยโค้ด
            </div>
          ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {accounts.map((acc) => (
              <button
                key={acc.bookId}
                onClick={() => selectAccount(acc)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 13,
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 18,
                  padding: 16,
                  boxShadow: '0 1px 2px rgba(16,40,28,.04)',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: acc.role === 'admin' ? gradients.brandDiag : colors.paidBg,
                    color: acc.role === 'admin' ? '#fff' : colors.green,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: font.display,
                    fontWeight: 700,
                    fontSize: 22,
                    flex: 'none',
                  }}
                >
                  {acc.bookName.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: colors.ink }}>{acc.bookName}</div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: acc.role === 'admin' ? colors.green : colors.partialText,
                        background: acc.role === 'admin' ? colors.paidBg : colors.partialBg,
                        padding: '2px 8px',
                        borderRadius: 999,
                      }}
                    >
                      {acc.role === 'admin' ? 'ผู้ดูแล' : 'สมาชิก'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, color: colors.inkMuted, marginTop: 3 }}>{acc.subtitle}</div>
                </div>
                <div style={{ color: colors.inkFaint, fontSize: 20, flex: 'none' }}>›</div>
              </button>
            ))}
          </div>
          )}

          {/* ปุ่มสร้าง / เข้าร่วม */}
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={createBook}
              style={{
                width: '100%',
                height: 52,
                borderRadius: 15,
                background: gradients.brand,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                color: '#fff',
                fontFamily: font.display,
                fontWeight: 600,
                fontSize: 15.5,
                boxShadow: '0 10px 22px rgba(31,138,91,.28)',
              }}
            >
              <IconPlus size={18} color="#fff" />
              สร้างบัญชีของฉัน
            </button>
            <button
              onClick={() => setJoining(true)}
              style={{
                width: '100%',
                height: 52,
                borderRadius: 15,
                border: `1.5px solid ${colors.green}`,
                background: colors.paidBg,
                color: colors.green,
                fontFamily: font.display,
                fontWeight: 600,
                fontSize: 15.5,
              }}
            >
              🔑 เข้าร่วมบัญชีด้วยโค้ด
            </button>
          </div>
        </ScrollArea>

        {joining && <JoinSheet onClose={() => setJoining(false)} onJoined={(role) => router.push(role === 'admin' ? '/admin' : '/viewer')} />}
      </div>
    </Phone>
  );
}

// ── Bottom sheet: เข้าร่วมด้วยโค้ด ────────────────────────────
function JoinSheet({ onClose, onJoined }: { onClose: () => void; onJoined: (role: 'admin' | 'viewer') => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (res.ok) {
        const data = await res.json();
        onJoined(data.role);
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'เข้าร่วมไม่สำเร็จ');
    } catch {
      // โหมด demo: เดาบทบาทจาก prefix (BK = admin, อื่น ๆ = viewer)
      onJoined(code.trim().toUpperCase().startsWith('BK') ? 'admin' : 'viewer');
      return;
    } finally {
      setBusy(false);
    }
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
        <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 20, color: colors.ink }}>เข้าร่วมบัญชี</div>
        <div style={{ fontSize: 13, color: colors.inkMuted, marginTop: 3 }}>
          กรอกโค้ดที่ได้รับ — Book Code เข้าเป็นผู้ดูแล · Personal Code เข้าเป็นสมาชิก
        </div>

        <div
          style={{
            marginTop: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            border: `1.5px solid ${error ? colors.overdueText : '#bcd8c8'}`,
            borderRadius: 14,
            padding: '15px 16px',
            background: '#f7fbf9',
          }}
        >
          <span style={{ color: '#9fb3a8', fontFamily: font.display, fontWeight: 600, fontSize: 18 }}>#</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="เช่น BK-482913 หรือ SC-8842"
            autoFocus
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: font.display,
              fontWeight: 600,
              fontSize: 18,
              letterSpacing: 2,
              color: colors.ink,
              minWidth: 0,
            }}
          />
        </div>
        {error && <div style={{ color: colors.overdueText, fontSize: 12.5, marginTop: 8 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, height: 52, borderRadius: 15, border: '1.5px solid #dbe3dd', color: '#5a6b62', fontFamily: font.display, fontWeight: 600, fontSize: 15.5, background: colors.surface }}
          >
            ยกเลิก
          </button>
          <button
            onClick={submit}
            disabled={busy || code.trim().length < 4}
            style={{ flex: 1.4, height: 52, borderRadius: 15, background: gradients.brand, color: '#fff', fontFamily: font.display, fontWeight: 600, fontSize: 15.5, boxShadow: '0 10px 22px rgba(31,138,91,.3)', opacity: busy || code.trim().length < 4 ? 0.6 : 1 }}
          >
            เข้าร่วม
          </button>
        </div>
      </div>
    </div>
  );
}
