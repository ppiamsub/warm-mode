import type { Metadata, Viewport } from 'next';
import './globals.css';
import { LiffProvider } from '@/components/LiffProvider';

export const metadata: Metadata = {
  title: 'สมุดเก็บเงิน — Debt Ledger',
  description: 'ติดตามยอดเก็บเงินจากสมาชิก ง่ายๆ ครบ จบ ในที่เดียว',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#127a4c',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <LiffProvider>{children}</LiffProvider>
      </body>
    </html>
  );
}
