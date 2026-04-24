import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aayush — AI/ML Engineer',
  description: 'Portfolio of Aayush, CSE (AI & ML) student at Manipal University Jaipur',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
  openGraph: {
    title: 'Aayush — AI/ML Engineer',
    description: 'Talk to my AI clone. Built different.',
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
