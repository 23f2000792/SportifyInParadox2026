
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Settings, Zap, Trophy, CircleDot, Target, Radio, Home, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EVENTS } from '@/lib/mock-data';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationCenter } from '@/components/NotificationCenter';
import { Button } from '@/components/ui/button';

const LOGO_URL = "https://ik.imagekit.io/qaugsnc1c/sportify_logo1.png?updatedAt=1762330168970";

const ICON_MAP: Record<string, any> = {
  Zap: Zap,
  Trophy: Trophy,
  CircleDot: CircleDot,
  Target: Target,
};

const SHORT_NAMES: Record<string, string> = {
  'kampus-run': 'Run',
  'football': 'FB',
  'volleyball': 'VB',
  'badminton': 'BD',
};

export function Navbar() {
  const pathname = usePathname();

  return (
    <>
      {/* Top Header - Main Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm h-20 md:h-24 pt-safe shadow-sm">
        <div className="container mx-auto h-full px-4 flex items-center justify-between gap-4">
          
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="relative h-10 w-10 md:h-12 md:w-12 overflow-hidden rounded-sm bg-black/5 dark:bg-white/5 p-1 border border-border">
              <Image 
                src={LOGO_URL}
                alt="Sportify Logo"
                fill
                className="object-contain p-0.5"
                priority
              />
            </div>
            <div className="hidden lg:block min-w-0">
              <p className="text-[12px] font-black tracking-tighter text-foreground uppercase leading-none">SPORTIFY</p>
              <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] mt-0.5">Paradox 2026</p>
            </div>
          </Link>

          {/* Center: Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center justify-center flex-1 h-full px-4">
            <div className="flex h-full items-center">
              <Link 
                href="/" 
                className={cn(
                  "relative h-full flex items-center px-6 text-[11px] font-black uppercase tracking-widest transition-all",
                  pathname === "/" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Home
                {pathname === "/" && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-sm" />}
              </Link>
              {EVENTS.map((event) => {
                const isActive = pathname === `/events/${event.slug}`;
                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.slug}`}
                    className={cn(
                      "relative h-full flex items-center px-6 text-[11px] font-black uppercase tracking-widest transition-all",
                      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {event.name}
                    {isActive && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-sm" />}
                  </Link>
                );
              })}
            </div>
          </nav>
          
          {/* Right: Tools & Live Sync */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2 bg-muted/30 border border-border px-3 py-1.5 rounded-full mr-2">
              <Radio className="h-3 w-3 text-primary animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-foreground">Live Sync</span>
            </div>
            
            <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground/40 hidden md:flex">
              <HelpCircle className="h-5 w-5" />
            </Button>
            
            <NotificationCenter />
            <ThemeToggle />
            
            <Link
              href="/admin"
              className={cn(
                "h-10 w-10 flex items-center justify-center rounded-sm transition-all border",
                pathname.startsWith("/admin") 
                  ? "text-primary bg-primary/10 border-primary/20" 
                  : "text-muted-foreground border-border bg-muted/30 hover:bg-muted/50"
              )}
            >
              <Settings className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-md border-t border-border h-16 flex items-center justify-around px-4 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <Link href="/" className={cn("flex flex-col items-center gap-1 min-w-[50px]", pathname === "/" ? "text-primary" : "text-muted-foreground/40")}>
          <Home className="h-5 w-5" />
          <span className="text-[8px] font-black uppercase tracking-widest">Home</span>
        </Link>
        {EVENTS.map((event) => {
          const IconComp = ICON_MAP[event.icon];
          const isActive = pathname === `/events/${event.slug}`;
          const shortName = SHORT_NAMES[event.slug] || event.name.split(' ')[0];
          return (
            <Link
              key={event.id}
              href={`/events/${event.slug}`}
              className={cn("flex flex-col items-center gap-1 min-w-[50px]", isActive ? "text-primary" : "text-muted-foreground/40")}
            >
              {IconComp && <IconComp className="h-5 w-5" />}
              <span className="text-[8px] font-black uppercase tracking-widest">{shortName}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
