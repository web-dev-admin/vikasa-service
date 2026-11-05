import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Track Service Request | Vikasa Services',
  description: 'Track real-time status of your Vikasa interior or home service request.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function TrackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

