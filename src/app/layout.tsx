import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Household Chores',
  description: 'Shared chore tracker for your household',
  // manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body className='bg-gray-50 min-h-screen'>{children}</body>
    </html>
  );
}
