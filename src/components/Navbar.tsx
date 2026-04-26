
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Settings, Zap, Trophy, CircleDot, Target, Radio, Home, HelpCircle, Bell } from 'lucide-react';
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
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background h-20 md:h-24 pt-safe shadow-sm">
        <div className="container mx-auto h-full px-4 flex items-center justify-between gap-4">
          
          {/* Left: Logo & Branding */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="relative h-11 w-11 overflow-hidden rounded-sm bg-black p-1 border border-white/10">
              <Image 
                src={LOGO_URL}
                alt="Sportify Logo"
                fill
                className="object-contain p-0.5"
                priority
              />
            </div>
            <div className="hidden sm:block">
              <p className="text-[13px] font-black tracking-tighter text-foreground uppercase leading-none">SPORTIFY</p>
              <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em] mt-0.5">Paradox 2026</p>
            </div>
          </Link>

          {/* Center: Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center justify-center flex-1 h-full px-4">
            <div className="flex h-full items-center gap-1 xl:gap-4">
              <Link 
                href="/" 
                className={cn(
                  "relative h-full flex items-center px-4 text-[10px] font-black uppercase tracking-widest transition-all",
                  pathname === "/" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Home
                {pathname === "/" && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary" />}
              </Link>
              {EVENTS.map((event) => {
                const isActive = pathname === `/events/${event.slug}`;
                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.slug}`}
                    className={cn(
                      "relative h-full flex items-center px-4 text-[10px] font-black uppercase tracking-widest transition-all text-center",
                      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {event.name}
                    {isActive && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary" />}
                  </Link>
                );
              })}
            </div>
          </nav>
          
          {/* Right: Tools & Live Sync */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="hidden md:flex items-center gap-2 border border-border px-4 py-2 rounded-full h-10">
              <Radio className="h-3.5 w-3.5 text-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Live Sync</span>
            </div>
            
            <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground/40 hidden xl:flex">
              <HelpCircle className="h-5 w-5" />
            </Button>
            
            <NotificationCenter />
            <ThemeToggle />
            
            <Link
              href="/admin"
              className={cn(
                "h-10 w-10 flex items-center justify-center transition-all border rounded-sm",
                pathname.startsWith("/admin") 
                  ? "text-white bg-primary border-primary" 
                  : "text-muted-foreground border-border bg-muted/20 hover:bg-muted/40"
              )}
            >
              <Settings className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background border-t border-border h-16 flex items-center justify-around px-4 pb-safe shadow-lg">
        <Link href="/" className={cn("flex flex-col items-center gap-1", pathname === "/" ? "text-primary" : "text-muted-foreground/40")}>
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
              className={cn("flex flex-col items-center gap-1", isActive ? "text-primary" : "text-muted-foreground/40")}
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
