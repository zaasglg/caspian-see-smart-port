import type { Metadata } from 'next';
import { Geist, Geist_Mono, Libre_Bodoni } from 'next/font/google';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import './globals.css';

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

const libreBodoni = Libre_Bodoni({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'Caspian Smart Port AI · Порт Актау',
  description:
    'Ситуационный центр мультимодальной логистики порта Актау: AI-оптимизация причалов, КТЖ и штормовых рисков.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={cn(
        'h-full antialiased',
        geistSans.variable,
        geistMono.variable,
        libreBodoni.variable,
        'font-sans',
      )}
    >
      <body className="min-h-full bg-background text-foreground">
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
