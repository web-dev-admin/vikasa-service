import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Join as a Verified Technician | Vikasa Services & Interiors',
  description:
    'Apply to join Vikasa Services verified artisan network in Erode and Tamil Nadu. Steady dispatches, verified projects, and local support for carpenters, electricians, plumbers, painters, and AC technicians.',
  alternates: {
    canonical: '/worker-register',
  },
  openGraph: {
    title: 'Join as a Verified Technician | Vikasa Services & Interiors',
    description:
      'Apply to join Vikasa Services verified artisan network in Erode and Tamil Nadu. Steady dispatches, verified projects, and local support.',
    url: '/worker-register',
  },
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://vikasaservices.in',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Join as a Verified Technician',
      item: 'https://vikasaservices.in/worker-register',
    },
  ],
};

export default function WorkerRegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {children}
    </>
  );
}

