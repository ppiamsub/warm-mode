// Design tokens สกัดจาก Debt Ledger.dc.html (ธีมเขียว)
// ใช้ร่วมกันทุก component เพื่อความสม่ำเสมอของ UI

export const colors = {
  // Brand green (emerald — หรูหรา ทันสมัย)
  green: '#178a55',
  greenBright: '#28b479',
  greenDeep: '#0e7a4a',
  greenDeepest: '#095f39',
  greenDark: '#0a2b1e',

  // Backgrounds (ขาวอมเขียวนวล ๆ)
  bg: '#eef5f0',
  bgCanvas: '#e6efe9',
  surface: '#ffffff',

  // Text
  ink: '#122019',
  inkSoft: '#657a6f',
  inkMuted: '#89988f',
  inkFaint: '#9caba2',

  // Borders
  border: '#e6efe9',
  borderSoft: '#eef3ef',

  // Progress track
  track: '#e0eae4',

  // Status: จ่ายครบ (paid)
  paidText: '#137c4d',
  paidBg: '#e2f5ea',
  // Status: จ่ายบางส่วน (partial)
  partialText: '#b26b12',
  partialBg: '#fdf1df',
  // Status: ค้างชำระ (overdue)
  overdueText: '#c1483a',
  overdueBg: '#fbe9e6',
} as const;

export const gradients = {
  // ปุ่มหลัก — ไล่เฉดมรกตมีประกายด้านบน
  brand: 'linear-gradient(180deg,#2bb87c 0%,#1f9f68 52%,#12864f 100%)',
  brandDiag: 'linear-gradient(150deg,#2cba7d 0%,#0f7c4c 100%)',
  // Header — มรกตเข้มไล่ลึก 4 สต็อป
  header: 'linear-gradient(155deg,#23aa6f 0%,#149060 40%,#0c7046 76%,#08512f 100%)',
  progress: 'linear-gradient(90deg,#2bb87c,#6cdba6)',
  logo: 'linear-gradient(150deg,#2fbe80 0%,#0c6a40 100%)',
  canvas: 'radial-gradient(1100px 560px at 16% -12%, #f2f8f4 0%, #e9f0eb 46%, #e2ebe5 100%)',
  // ประกายแก้ว (glass sheen) ใช้ทับ header/การ์ดเพื่อความมีมิติ
  sheen: 'linear-gradient(180deg, rgba(255,255,255,.16) 0%, rgba(255,255,255,0) 42%)',
} as const;

export const shadows = {
  // เงาแบบเลเยอร์ อมเขียวเล็กน้อย ให้ดูมีมิติ
  card: '0 1px 2px rgba(12,44,28,.04), 0 6px 16px rgba(16,64,42,.05)',
  raised: '0 2px 6px rgba(12,44,28,.05), 0 16px 40px rgba(16,64,42,.10)',
  float: '0 4px 12px rgba(12,44,28,.08), 0 22px 48px rgba(16,64,42,.16)',
  brand: '0 10px 24px rgba(20,140,86,.30), 0 2px 6px rgba(10,80,50,.22)',
  brandSoft: '0 8px 20px rgba(20,140,86,.26), 0 2px 5px rgba(10,80,50,.18)',
  sheet: '0 -20px 55px rgba(8,40,26,.34)',
} as const;

export const font = {
  display: "'Anuphan', system-ui, sans-serif", // หัวข้อ + ตัวเลข
  body: "'IBM Plex Sans Thai', system-ui, sans-serif",
} as const;

// ประเภทสถานะการชำระ
export type PaymentStatus = 'paid' | 'partial' | 'overdue';

export const statusLabel: Record<PaymentStatus, string> = {
  paid: 'จ่ายครบ',
  partial: 'จ่ายบางส่วน',
  overdue: 'ค้างชำระ',
};

export const statusStyle: Record<PaymentStatus, { color: string; background: string }> = {
  paid: { color: colors.paidText, background: colors.paidBg },
  partial: { color: colors.partialText, background: colors.partialBg },
  overdue: { color: colors.overdueText, background: colors.overdueBg },
};
