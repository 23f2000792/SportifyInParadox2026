
import type {Metadata} from 'next';
import './globals.css';
import {Navbar} from '@/components/Navbar';
import {Toaster} from '@/components/ui/toaster';
import {FirebaseClientProvider} from '@/firebase';

export const metadata: Metadata = {
  title: 'Sportify in Paradox 2026',
  description: 'Premium real-time sports control dashboard for Sportify in Paradox 2026',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground selection:bg-primary/30">
        <FirebaseClientProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow container mx-auto px-6 py-10 md:py-12 max-w-5xl">
              {children}
            </main>
            <footer className="py-10 border-t border-white/5 bg-black/40 text-center space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">
                Sportify in Paradox 2026 • Real-Time Broadcast Control
              </p>
              <p className="text-[9px] font-medium text-muted-foreground/10 uppercase tracking-widest">
                © 2026 Paradox Interactive Sports. All Rights Reserved.
              </p>
            </footer>
          </div>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
