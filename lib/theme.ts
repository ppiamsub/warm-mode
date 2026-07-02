// Design tokens สกัดจาก Debt Ledger.dc.html (ธีมเขียว)
// ใช้ร่วมกันทุก component เพื่อความสม่ำเสมอของ UI

export const colors = {
  // Brand green
  green: '#1f8a5b',
  greenBright: '#23a06a',
  greenDeep: '#127a4c',
  greenDeepest: '#0d6340',
  greenDark: '#0e2c1f',

  // Backgrounds
  bg: '#eef4ef',
  bgCanvas: '#e6ebe6',
  surface: '#ffffff',

  // Text
  ink: '#14231c',
  inkSoft: '#6d7f75',
  inkMuted: '#8a9990',
  inkFaint: '#9aa7a0',

  // Borders
  border: '#e8eee9',
  borderSoft: '#eef2ef',

  // Progress track
  track: '#e2eae5',

  // Status: จ่ายครบ (paid)
  paidText: '#1f8a5b',
  paidBg: '#e3f4ea',
  // Status: จ่ายบางส่วน (partial)
  partialText: '#b26b12',
  partialBg: '#fdf1df',
  // Status: ค้างชำระ (overdue)
  overdueText: '#c1483a',
  overdueBg: '#fbe9e6',
} as const;

export const gradients = {
  brand: 'linear-gradient(180deg,#23a06a,#1a7f52)',
  brandDiag: 'linear-gradient(155deg,#23a06a,#127a4c)',
  header: 'linear-gradient(158deg,#219561,#127a4c 62%,#0d6340)',
  progress: 'linear-gradient(90deg,#2fae74,#5cc08e)',
  logo: 'linear-gradient(155deg,#23a06a,#0f6340)',
  canvas: 'radial-gradient(1200px 600px at 20% -10%, #eef4ef 0%, #e6ebe6 60%)',
} as const;

export const shadows = {
  card: '0 1px 2px rgba(16,40,28,.04)',
  raised: '0 12px 34px rgba(16,40,28,.07)',
  float: '0 14px 32px rgba(16,40,28,.12)',
  brand: '0 12px 24px rgba(31,138,91,.32)',
  brandSoft: '0 10px 22px rgba(31,138,91,.28)',
  sheet: '0 -20px 50px rgba(0,0,0,.3)',
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
