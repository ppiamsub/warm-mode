import type { Metadata, Viewport } from 'next';
import './globals.css';
import { LiffProvider } from '@/components/LiffProvider';

export const metadata: Metadata = {
  title: 'Warm Mode — สมุดเก็บเงิน',
  description: 'ติดตามยอดเก็บเงินจากสมาชิก ง่ายๆ ครบ จบ ในที่เดียว',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover', // ให้ env(safe-area-inset-*) ใช้งานได้ (เว้นขอบ home indicator บน iOS/LIFF)
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
