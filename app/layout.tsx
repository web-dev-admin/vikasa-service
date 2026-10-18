import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { VIKASA_CONFIG } from '@/lib/constants';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vikasainteriors.in';

export const viewport: Viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Vikasa Interiors — Interior Design & Custom Plywood Work in Erode',
    template: '%s | Vikasa Interiors Erode',
  },
  description:
    'Premier interior design and bespoke plywood craftsmanship in Erode, Tamil Nadu. Specialist in modular kitchens, designer wardrobes, false ceilings, and complete turnkey home interiors. Call/WhatsApp: +91 98656 52420.',
  keywords: [
    'interior designers in erode',
    'interior design erode',
    'home interiors erode',
    'plywood interior work erode',
    'modular kitchen erode',
    'custom wardrobes erode',
    'false ceiling designers erode',
    'vikasa interiors',
    'residential interiors erode',
    'commercial interiors erode',
    'carpentry woodwork erode',
    'erode interior decorators',
    'tamil nadu home renovation',
  ],
  authors: [{ name: 'Vikasa Interiors' }],
  creator: 'Vikasa Interiors',
  publisher: 'Vikasa Interiors',
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/logo/vikasa_interior_logo.png',
    apple: '/logo/vikasa_interior_logo.png',
  },
  openGraph: {
    title: 'Vikasa Interiors — Interior Design & Plywood Craftsmanship in Erode',
    description:
      'Turnkey interior design and custom plywood woodwork in Erode and surrounding regions. Modular kitchens, designer wardrobes, and home renovations. Call/WhatsApp: +91 98656 52420.',
    url: baseUrl,
    siteName: 'Vikasa Interiors',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/logo/vikasa_interior_logo.png',
        width: 512,
        height: 512,
        alt: 'Vikasa Interiors Erode Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vikasa Interiors — Interior Design & Plywood Work in Erode',
    description:
      'Expert modular kitchens, designer wardrobes, false ceilings & precision plywood work in Erode. Free consultation: +91 98656 52420.',
    images: ['/logo/vikasa_interior_logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': ['HomeAndConstructionBusiness', 'ProfessionalService'],
      '@id': `${baseUrl}/#business`,
      name: 'Vikasa Interiors',
      alternateName: 'Vikasa Interior & Plywood Works',
      url: baseUrl,
      logo: `${baseUrl}/logo/vikasa_interior_logo.png`,
      image: `${baseUrl}/logo/vikasa_interior_logo.png`,
      telephone: '+919865652420',
      priceRange: '₹₹',
      currenciesAccepted: 'INR',
      paymentAccepted: 'Cash, UPI, Bank Transfer',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Erode City',
        addressLocality: 'Erode',
        addressRegion: 'Tamil Nadu',
        postalCode: '638001',
        addressCountry: 'IN',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 11.341,
        longitude: 77.7172,
      },
      areaServed: [
        { '@type': 'City', name: 'Erode' },
        { '@type': 'City', name: 'Perundurai' },
        { '@type': 'City', name: 'Bhavani' },
        { '@type': 'City', name: 'Gobichettipalayam' },
        { '@type': 'City', name: 'Chithode' },
        { '@type': 'City', name: 'Modakkurichi' },
        { '@type': 'City', name: 'Thindal' },
        { '@type': 'AdministrativeArea', name: 'Erode District' },
        { '@type': 'AdministrativeArea', name: 'Tamil Nadu' },
      ],
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Interior Design & Plywood Craftsmanship',
        itemListElement: [
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Modular Kitchen Design & Installation',
              description: 'Custom modular kitchens with waterproof marine plywood, acrylic and laminate finishes, and soft-close hardware.',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Custom Plywood Wardrobes & Storage',
              description: 'Bespoke sliding, openable, and walk-in wardrobe units designed for optimized space and longevity.',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Living Room TV Entertainment Units',
              description: 'Contemporary fluted paneling, LED profile lighting, and custom media console woodwork.',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'False Ceiling & Architectural Lighting',
              description: 'Designer gypsum and POP ceilings with ambient recessed and cove lighting integration.',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Turnkey Residential & Commercial Interiors',
              description: 'End-to-end design, woodwork fabrication, painting, electrical, and full space transformation.',
            },
          },
        ],
      },
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          opens: '09:00',
          closes: '20:00',
        },
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${baseUrl}/#website`,
      url: baseUrl,
      name: 'Vikasa Interiors',
      description: 'Interior Design & Custom Plywood Work in Erode, Tamil Nadu',
      publisher: {
        '@id': `${baseUrl}/#business`,
      },
    },
  ],
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
