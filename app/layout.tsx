import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aayush — AI/ML Engineer',
  description: 'Portfolio of Aayush, CSE (AI & ML) student at Manipal University Jaipur',
  openGraph: {
    title: 'Aayush — AI/ML Engineer',
    description: 'Talk to my AI clone. Built different.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
