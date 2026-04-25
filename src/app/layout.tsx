import type {Metadata, Viewport} from 'next';
import './globals.css';
import {Navbar} from '@/components/Navbar';
import {Toaster} from '@/components/ui/toaster';
import {FirebaseClientProvider} from '@/firebase';

export const metadata: Metadata = {
  title: 'Sportify in Paradox 2026',
  description: 'Official Sportify Portal for Paradox 2026 - Real-time sports broadcast control.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Sportify',
  },
  icons: {
    icon: 'https://ik.imagekit.io/qaugsnc1c/sportify_logo1.png?updatedAt=1762330168970',
    apple: 'https://ik.imagekit.io/qaugsnc1c/sportify_logo1.png?updatedAt=1762330168970',
  }
};

export const viewport: Viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('paradox-theme');
                  if (!theme) theme = 'dark';
                  document.documentElement.classList.toggle('dark', theme === 'dark');
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="font-body antialiased bg-background text-foreground selection:bg-primary/30 overscroll-none">
        <FirebaseClientProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow container mx-auto px-4 py-8 md:py-12 max-w-5xl pb-safe">
              {children}
            </main>
            <footer className="py-10 border-t border-border bg-black/5 dark:bg-black/40 text-center space-y-2 mb-20 md:mb-0">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
                Sportify in Paradox 2026 • Real-Time Broadcast Control
              </p>
            </footer>
          </div>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}