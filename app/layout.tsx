import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'VIKASA — Location-Based Service Coordination & Dispatch',
  description:
    'Managed service coordination platform connecting customers with verified nearby trade specialists through human-in-the-loop dispatch.',
  keywords: ['service dispatch', 'plumber', 'electrician', 'carpenter', 'salem', 'tamil nadu', 'local services'],
  openGraph: {
    title: 'VIKASA — Location-Based Service Coordination & Dispatch',
    description: 'Trusted local service coordination for Salem and surrounding areas.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${inter.className} min-h-full flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
