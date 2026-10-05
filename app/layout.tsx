import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'VIKASA — Interior & Home Services | Certified Technicians in Salem',
  description:
    'Book verified plumbers, electricians, carpenters, AC technicians, and interior services in Salem, Tamil Nadu. Fast doorstep dispatch. Helpline & WhatsApp: 9865652420.',
  keywords: ['vikasa interior', 'home services', 'plumber salem', 'electrician salem', 'carpenter salem', 'ac service salem', 'salem', 'tamil nadu'],
  icons: {
    icon: '/logo/vikasa_interior_logo.png',
    apple: '/logo/vikasa_interior_logo.png',
  },
  openGraph: {
    title: 'VIKASA — Interior & Home Services | Salem',
    description: 'Trusted local doorstep service coordination for Salem and surrounding areas. Call/WhatsApp: 9865652420.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className={`${inter.className} min-h-full flex flex-col`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
