'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Settings, Zap, Trophy, CircleDot, Target, Radio, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EVENTS } from '@/lib/mock-data';
import { ThemeToggle } from '@/components/ThemeToggle';

const LOGO_URL = "https://ik.imagekit.io/qaugsnc1c/sportify_logo1.png?updatedAt=1762330168970";

const ICON_MAP: Record<string, any> = {
  Zap: Zap,
  Trophy: Trophy,
  CircleDot: CircleDot,
  Target: Target,
};

export function Navbar() {
  const pathname = usePathname();

  return (
    <>
      {/* Universal Top Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.05] bg-background/80 backdrop-blur-xl h-16 flex items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative h-8 w-8 overflow-hidden rounded-xl bg-white/[0.03] border border-white/[0.05] p-1.5">
            <Image 
              src={LOGO_URL}
              alt="Sportify Logo"
              fill
              className="object-contain p-1"
              priority
            />
          </div>
          <div className="hidden xs:block">
            <p className="text-[10px] font-black tracking-tighter text-foreground uppercase leading-none">SPORTIFY</p>
            <p className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] mt-0.5">Paradox 2026</p>
          </div>
        </Link>
        
        <div className="flex items-center gap-3 md:gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/[0.02] border border-border rounded-full">
            <Radio className="h-3 w-3 text-primary" />
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Broadcast Active</span>
          </div>
          
          <ThemeToggle />

          <Link
            href="/admin"
            className={cn(
              "h-9 w-9 flex items-center justify-center rounded-xl transition-all border",
              pathname.startsWith("/admin") 
                ? "text-primary bg-primary/10 border-primary/20" 
                : "text-muted-foreground border-border bg-white/[0.03] hover:bg-white/[0.06] hover:text-foreground"
            )}
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex w-full border-b border-border bg-background/40 backdrop-blur-sm">
        <div className="container mx-auto max-w-5xl flex items-center px-4">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap",
              pathname === "/" 
                ? "text-primary border-primary bg-primary/[0.02]" 
                : "text-muted-foreground/40 border-transparent hover:text-foreground hover:bg-white/[0.01]"
            )}
          >
            Home
          </Link>
          {EVENTS.map((event) => {
            const isActive = pathname === `/events/${event.slug}`;
            return (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className={cn(
                  "flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap",
                  isActive 
                    ? "text-primary border-primary bg-primary/[0.02]" 
                    : "text-muted-foreground/40 border-transparent hover:text-foreground hover:bg-white/[0.01]"
                )}
              >
                {event.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-2xl border-t border-border h-16 flex items-center justify-around px-4 pb-safe">
        <Link href="/" className={cn("flex flex-col items-center gap-1 transition-all", pathname === "/" ? "text-primary" : "text-muted-foreground/30")}>
          <Home className="h-4 w-4" />
          <span className="text-[9px] font-black uppercase tracking-widest">Home</span>
        </Link>
        {EVENTS.map((event) => {
          const IconComp = ICON_MAP[event.icon];
          const isActive = pathname === `/events/${event.slug}`;
          return (
            <Link
              key={event.id}
              href={`/events/${event.slug}`}
              className={cn("flex flex-col items-center gap-1 transition-all", isActive ? "text-primary" : "text-muted-foreground/30")}
            >
              {IconComp && <IconComp className="h-4 w-4" />}
              <span className="text-[9px] font-black uppercase tracking-widest">{event.name.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
