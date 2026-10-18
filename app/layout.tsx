import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://vikasa.in'),
  title: 'VIKASA — Interior & Home Services | Certified Technicians in Salem',
  description:
    'Book verified plumbers, electricians, carpenters, AC technicians, and interior services in Salem, Tamil Nadu. Fast doorstep dispatch. Helpline & WhatsApp: 9865652420.',
  keywords: ['vikasa interior', 'home services', 'plumber salem', 'electrician salem', 'carpenter salem', 'ac service salem', 'salem', 'tamil nadu'],
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/logo/vikasa_interior_logo.png',
    apple: '/logo/vikasa_interior_logo.png',
  },
  openGraph: {
    title: 'VIKASA — Interior & Home Services | Salem',
    description: 'Trusted local doorstep service coordination for Salem and surrounding areas. Call/WhatsApp: 9865652420.',
    type: 'website',
    locale: 'en_IN',
  },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'HomeAndConstructionBusiness',
  name: 'VIKASA Interior & Home Services',
  image: 'https://vikasa.in/logo/vikasa_interior_logo.png',
  telephone: '+919865652420',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Fairlands',
    addressLocality: 'Salem',
    addressRegion: 'Tamil Nadu',
    postalCode: '636016',
    addressCountry: 'IN',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 11.6643,
    longitude: 78.146,
  },
  areaServed: [
    {
      '@type': 'AdministrativeArea',
      name: 'Salem, Tamil Nadu',
    },
    {
      '@type': 'AdministrativeArea',
      name: 'Tamil Nadu',
    },
  ],
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    opens: '08:00',
    closes: '20:00',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className={`${inter.className} min-h-full flex flex-col`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
