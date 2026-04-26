
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
      {/* Top Header - Visible on both Desktop and Mobile */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm h-16 flex items-center justify-between px-4 pt-safe">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="relative h-8 w-8 overflow-hidden rounded-sm bg-muted p-1 border border-border">
              <Image 
                src={LOGO_URL}
                alt="Sportify Logo"
                fill
                className="object-contain p-0.5"
                priority
              />
            </div>
            <div className="hidden xs:block min-w-0">
              <p className="text-[10px] font-black tracking-tighter text-foreground uppercase leading-none truncate">SPORTIFY</p>
              <p className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] mt-0.5">Paradox 2026</p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link 
              href="/" 
              className={cn(
                "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-sm transition-colors",
                pathname === "/" ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-primary"
              )}
            >
              Home
            </Link>
            {EVENTS.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className={cn(
                  "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-sm transition-colors",
                  pathname === `/events/${event.slug}` ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-primary"
                )}
              >
                {event.name}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground/40 hidden sm:flex">
            <HelpCircle className="h-4 w-4" />
          </Button>
          <NotificationCenter />
          <ThemeToggle />
          <Link
            href="/admin"
            className={cn(
              "h-9 w-9 flex items-center justify-center rounded-sm transition-all border",
              pathname.startsWith("/admin") 
                ? "text-primary bg-primary/10 border-primary/20" 
                : "text-muted-foreground border-border bg-muted/30 hover:bg-muted/50"
            )}
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Mobile Bottom Navigation - Visible ONLY on Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-md border-t border-border h-16 flex items-center justify-around px-4 pb-safe shadow-lg">
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
