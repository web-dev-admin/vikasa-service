import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { VIKASA_CONFIG } from '@/lib/constants';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vikasaservices.in';

export const viewport: Viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Vikasa Services & Interiors — Home Services, Interior Design & Plywood Works in Tamil Nadu',
    template: '%s | Vikasa Services & Interiors',
  },
  description:
    'Vikasa Services (vikasaservices.in) is Tamil Nadu\'s trusted destination for turnkey interior design, modular kitchens, custom plywood craftsmanship, and on-demand verified technicians (carpentry, electrical, plumbing, painting, and AC repairs). Serving Erode, Coimbatore, Salem, Tiruppur & across Tamil Nadu. Call/WhatsApp: +91 98656 52420.',
  keywords: [
    'vikasa services',
    'vikasaservices.in',
    'vikasa interiors',
    'vikasa interior erode',
    'interior designers in erode',
    'interior design erode',
    'home interiors erode',
    'plywood interior work erode',
    'modular kitchen erode',
    'custom wardrobes erode',
    'false ceiling designers erode',
    'home services tamil nadu',
    'verified technicians erode',
    'carpenter in erode',
    'carpentry woodwork erode',
    'electrician in erode',
    'plumber in erode',
    'ac service erode',
    'painting contractors erode',
    'residential interiors erode',
    'commercial interiors erode',
    'erode interior decorators',
    'tamil nadu home renovation',
    'turnkey home interiors tamil nadu',
  ],
  authors: [{ name: 'Vikasa Services & Interiors', url: baseUrl }],
  creator: 'Vikasa Services',
  publisher: 'Vikasa Services',
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
    title: 'Vikasa Services & Interiors — Home Services & Interior Design in Tamil Nadu',
    description:
      'Turnkey interior design, custom plywood woodwork, and verified technicians for carpentry, electrical, plumbing, painting & AC services in Erode and Tamil Nadu. Visit vikasaservices.in.',
    url: baseUrl,
    siteName: 'Vikasa Services',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/logo/vikasa_interior_logo.png',
        width: 512,
        height: 512,
        alt: 'Vikasa Services & Interiors Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vikasa Services & Interiors — Home Services & Plywood Craftsmanship',
    description:
      'Modular kitchens, custom wardrobes, false ceilings, and verified home technicians across Tamil Nadu. Call/WhatsApp: +91 98656 52420.',
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
      '@type': ['HomeAndConstructionBusiness', 'ProfessionalService', 'LocalBusiness'],
      '@id': `${baseUrl}/#business`,
      name: 'Vikasa Services & Interiors',
      alternateName: ['Vikasa Services', 'Vikasa Interiors', 'Vikasa Services Tamil Nadu', 'vikasaservices.in'],
      url: baseUrl,
      logo: `${baseUrl}/logo/vikasa_interior_logo.png`,
      image: `${baseUrl}/logo/vikasa_interior_logo.png`,
      telephone: '+919865652420',
      priceRange: '₹₹',
      currenciesAccepted: 'INR',
      paymentAccepted: 'Cash, UPI, Bank Transfer, Online',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Perundurai Road',
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
        { '@type': 'City', name: 'Coimbatore' },
        { '@type': 'City', name: 'Salem' },
        { '@type': 'City', name: 'Tiruppur' },
        { '@type': 'AdministrativeArea', name: 'Erode District' },
        { '@type': 'AdministrativeArea', name: 'Tamil Nadu' },
      ],
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Vikasa Services & Interior Solutions',
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
              name: 'Carpentry & Woodwork Services',
              description: 'Door repairs, hardware fixing, custom furniture craftsmanship, and precision plywood fittings.',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Electrical & Lighting Solutions',
              description: 'Wiring installation, switchboard repair, fan/light fittings, and safety electrical checks.',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Plumbing & Pipe Repair Services',
              description: 'Tap replacements, leakage rectification, bathroom fittings, and water line diagnostics.',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'Painting & Surface Finishing',
              description: 'Interior wall painting, waterproof putty coatings, primer finish, and exterior textures.',
            },
          },
          {
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: 'AC & Appliance Services',
              description: 'Air conditioner servicing, gas charging, filter sanitization, and cooling maintenance.',
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
      name: 'Vikasa Services',
      alternateName: 'Vikasa Services & Interiors',
      description: 'Home Services, Interior Design & Plywood Craftsmanship in Tamil Nadu (vikasaservices.in)',
      publisher: {
        '@id': `${baseUrl}/#business`,
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${baseUrl}/request?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
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
