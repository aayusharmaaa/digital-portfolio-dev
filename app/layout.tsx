import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aayush — AI/ML Engineer',
  description: 'Portfolio of Aayush, CSE (AI & ML) student at Manipal University Jaipur',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'Aayush — AI/ML Engineer',
    description: 'Talk to my AI clone. Built different.',
    images: ['/icon.svg'],
  },
  twitter: {
    card: 'summary',
    title: 'Aayush — AI/ML Engineer',
    description: 'Talk to my AI clone. Built different.',
    images: ['/icon.svg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Warm up avatar model download to reduce first-load delay */}
        <link rel="preload" href="/model.glb" as="fetch" type="model/gltf-binary" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
