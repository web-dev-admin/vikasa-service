import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Request Confirmation | Vikasa Services',
  description: 'Your Vikasa interior or home service request confirmation.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RequestSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

