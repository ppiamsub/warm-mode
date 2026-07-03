'use client';
// หน้าเลือกบัญชี (Account Hub) — หลัง Login LINE
// แสดงโปรไฟล์ LINE + บัญชีที่เป็นสมาชิก + สร้าง/เข้าร่วมด้วยโค้ด
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, font, gradients } from '@/lib/theme';
import { Phone, ScrollArea } from '@/components/ui/Primitives';
import { GreenHeader } from '@/components/ui/GreenHeader';
import { IconPlus, IconSearch } from '@/components/ui/Icons';
import { useLiff } from '@/components/LiffProvider';
import type { Account } from '@/types';

export default function AccountHubPage() {
  const router = useRouter();
  const { profile, mockMode } = useLiff();
  const [joining, setJoining] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [userName, setUserName] = useState('ผู้ใช้');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const filtered = accounts.filter((a) => a.bookName.includes(query.trim()));

  // ชื่อ + รูปจาก LINE (fallback เป็นชื่อจาก DB / ตัวอักษรแรก)
  const displayName = profile?.displayName ?? userName;
  const pictureUrl = profile?.pictureUrl;

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

  const selectAccount = async (acc: Account) => {
    try {
      await fetch('/api/accounts/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: acc.bookId }),
      });
    } catch {
      /* โหมด demo */
    }
    router.push(acc.role === 'admin' ? '/admin' : '/viewer');
  };

  // ออกจากบัญชี (ตัดการเชื่อมต่อ Viewer) โดยตรงจากหน้า Hub
  const disconnectViewer = async (acc: Account) => {
    if (!window.confirm(`ออกจากบัญชี "${acc.bookName}"?\nคุณจะไม่เห็นข้อมูลบัญชีนี้อีก (เข้าใหม่ด้วยรหัสส่วนตัวได้ภายหลัง)`)) return;
    try {
      const res = await fetch('/api/me/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: acc.bookId }),
      });
      if (res.ok) {
        setAccounts((prev) => prev.filter((a) => a.bookId !== acc.bookId));
      } else {
        window.alert('ออกจากบัญชีไม่สำเร็จ');
      }
    } catch {
      window.alert('ออกจากบัญชีไม่สำเร็จ');
    }
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

  const logout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch {
      /* ignore */
    }
    if (!mockMode) {
      try {
        const liff = (await import('@line/liff')).default;
        if (liff.isLoggedIn()) liff.logout();
      } catch {
        /* ignore */
      }
    }
    router.replace('/');
  };

  return (
    <Phone>
      <div style={{ height: '100%', minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: colors.bg }}>
        {/* ── Header + โปรไฟล์ LINE ── */}
        <GreenHeader style={{ padding: '52px 20px 26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              {pictureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pictureUrl}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                  style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,.55)', flex: 'none' }}
                />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font.display, fontWeight: 600, fontSize: 20, flex: 'none' }}>
                  {displayName.charAt(0)}
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, opacity: 0.82 }}>เข้าสู่ระบบด้วย LINE แล้ว</div>
                <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 18, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</div>
              </div>
            </div>
            <button
              onClick={logout}
              style={{ flex: 'none', padding: '7px 13px', borderRadius: 999, background: 'rgba(255,255,255,.16)', border: '1px solid rgba(255,255,255,.22)', color: '#fff', fontSize: 12.5, fontWeight: 600 }}
            >
              ออกจากระบบ
            </button>
          </div>
          <div style={{ marginTop: 22, fontFamily: font.display, fontWeight: 700, fontSize: 23 }}>เลือกบัญชี</div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>เลือกบัญชีที่ต้องการเข้าใช้งาน หรือเพิ่มบัญชีใหม่</div>
        </GreenHeader>

        <ScrollArea style={{ padding: '18px 16px 24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: colors.inkMuted, fontSize: 14, padding: '40px 0' }}>กำลังโหลด...</div>
          ) : (
            <>
              {/* section label */}
              {accounts.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '2px 4px 12px' }}>
                  <span style={{ fontFamily: font.display, fontWeight: 600, fontSize: 15, color: colors.ink }}>บัญชีของคุณ</span>
                  <span style={{ fontSize: 12.5, color: colors.inkMuted }}>{accounts.length} บัญชี</span>
                </div>
              )}

              {/* ค้นหาชื่อบัญชี (แสดงเมื่อมีหลายบัญชี) */}
              {accounts.length > 3 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 14, padding: '11px 14px', marginBottom: 12 }}>
                  <IconSearch size={17} color="#9fb3a8" strokeWidth={2} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="ค้นหาชื่อบัญชี..."
                    style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: colors.ink, minWidth: 0 }}
                  />
                </div>
              )}

              {/* empty state */}
              {accounts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '28px 16px 24px', background: colors.surface, border: `1px dashed ${colors.border}`, borderRadius: 20 }}>
                  <div style={{ width: 60, height: 60, borderRadius: 18, background: colors.paidBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, margin: '0 auto 14px' }}>📒</div>
                  <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 16, color: colors.ink }}>ยังไม่มีบัญชี</div>
                  <div style={{ fontSize: 13, color: colors.inkMuted, marginTop: 4, lineHeight: 1.6 }}>
                    เริ่มด้วยการสร้างบัญชีของคุณ
                    <br />
                    หรือเข้าร่วมบัญชีคนอื่นด้วยโค้ด
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {filtered.length === 0 && (
                    <div style={{ textAlign: 'center', color: colors.inkMuted, fontSize: 14, padding: '16px 0' }}>ไม่พบบัญชีที่ค้นหา</div>
                  )}
                  {filtered.map((acc) => {
                    const isAdmin = acc.role === 'admin';
                    return (
                      <div
                        key={acc.bookId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          background: colors.surface,
                          border: `1px solid ${colors.border}`,
                          borderRadius: 18,
                          padding: 15,
                          boxShadow: '0 2px 8px rgba(16,40,28,.05)',
                        }}
                      >
                        <button
                          onClick={() => selectAccount(acc)}
                          style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 13, background: 'transparent', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}
                        >
                          <div style={{ width: 50, height: 50, borderRadius: 15, background: isAdmin ? gradients.brandDiag : colors.paidBg, color: isAdmin ? '#fff' : colors.green, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font.display, fontWeight: 700, fontSize: 23, flex: 'none' }}>
                            {acc.bookName.charAt(0)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ fontSize: 16, fontWeight: 600, color: colors.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{acc.bookName}</div>
                              <span style={{ flex: 'none', fontSize: 11, fontWeight: 600, color: isAdmin ? colors.green : colors.partialText, background: isAdmin ? colors.paidBg : colors.partialBg, padding: '2px 8px', borderRadius: 999 }}>
                                {isAdmin ? 'ผู้ดูแล' : 'สมาชิก'}
                              </span>
                            </div>
                            <div style={{ fontSize: 12.5, color: colors.inkMuted, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{acc.subtitle}</div>
                          </div>
                        </button>
                        {isAdmin ? (
                          <div style={{ color: colors.inkFaint, fontSize: 22, flex: 'none' }}>›</div>
                        ) : (
                          <button
                            onClick={() => disconnectViewer(acc)}
                            style={{ flex: 'none', padding: '8px 12px', borderRadius: 999, background: '#fbe9e6', color: colors.overdueText, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}
                          >
                            ออกจากบัญชี
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* divider "เพิ่มบัญชี" */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 2px 14px' }}>
                <div style={{ flex: 1, height: 1, background: colors.border }} />
                <span style={{ fontSize: 12.5, color: colors.inkFaint }}>เพิ่มบัญชี</span>
                <div style={{ flex: 1, height: 1, background: colors.border }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={createBook}
                  style={{ width: '100%', height: 52, borderRadius: 15, background: gradients.brand, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#fff', fontFamily: font.display, fontWeight: 600, fontSize: 15.5, boxShadow: '0 10px 22px rgba(31,138,91,.28)' }}
                >
                  <IconPlus size={18} color="#fff" />
                  สร้างบัญชีของฉัน
                </button>
                <button
                  onClick={() => setJoining(true)}
                  style={{ width: '100%', height: 52, borderRadius: 15, border: `1.5px solid ${colors.green}`, background: colors.paidBg, color: colors.green, fontFamily: font.display, fontWeight: 600, fontSize: 15.5 }}
                >
                  🔑 เข้าร่วมบัญชีด้วยโค้ด
                </button>
              </div>
            </>
          )}
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
          style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, border: `1.5px solid ${error ? colors.overdueText : '#bcd8c8'}`, borderRadius: 14, padding: '15px 16px', background: '#f7fbf9' }}
        >
          <span style={{ color: '#9fb3a8', fontFamily: font.display, fontWeight: 600, fontSize: 18 }}>#</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="เช่น BK-482913 หรือ SC-8842"
            autoFocus
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: font.display, fontWeight: 600, fontSize: 18, letterSpacing: 2, color: colors.ink, minWidth: 0 }}
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
