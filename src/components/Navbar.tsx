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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const LOGO_URL = "https://ik.imagekit.io/qaugsnc1c/sportify_logo1.png?updatedAt=1762330168970";

const ICON_MAP: Record<string, any> = {
  Zap: Zap,
  Trophy: Trophy,
  CircleDot: CircleDot,
  Target: Target,
};

const SHORT_NAMES: Record<string, string> = {
  'kampus-run': 'Run',
  'football': 'Football',
  'volleyball': 'Volley',
  'badminton': 'Bdmntn',
};

export function Navbar() {
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md h-16 flex items-center justify-between px-4 pt-safe">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative h-8 w-8 overflow-hidden rounded-md bg-muted p-1 border border-border">
            <Image 
              src={LOGO_URL}
              alt="Sportify Logo"
              fill
              className="object-contain p-0.5"
              priority
            />
          </div>
          <div className="hidden xs:block">
            <p className="text-[10px] font-black tracking-tighter text-foreground uppercase leading-none">SPORTIFY</p>
            <p className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] mt-0.5">Paradox 2026</p>
          </div>
        </Link>
        
        <div className="flex items-center gap-2">
          <NotificationCenter />
          <ThemeToggle />
          <Link
            href="/admin"
            className={cn(
              "h-9 w-9 flex items-center justify-center rounded-md transition-all border",
              pathname.startsWith("/admin") 
                ? "text-primary bg-primary/10 border-primary/20" 
                : "text-muted-foreground border-border bg-muted/30 hover:bg-muted/50"
            )}
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex w-full border-b border-border bg-muted/5">
        <div className="container mx-auto max-w-5xl flex items-center px-4">
          <Link
            href="/"
            className={cn(
              "px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-colors",
              pathname === "/" 
                ? "text-primary border-primary bg-primary/5" 
                : "text-muted-foreground/60 border-transparent hover:text-foreground"
            )}
          >
            Home
          </Link>
          {EVENTS.map((event) => {
            const isActive = pathname === `/events/${event.slug}`;
            const shortName = SHORT_NAMES[event.slug] || event.name;
            return (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className={cn(
                  "px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-colors",
                  isActive 
                    ? "text-primary border-primary bg-primary/5" 
                    : "text-muted-foreground/60 border-transparent hover:text-foreground"
                )}
              >
                {shortName}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-md border-t border-border h-16 flex items-center justify-around px-4 pb-safe shadow-lg">
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
