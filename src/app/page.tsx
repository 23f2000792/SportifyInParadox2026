'use client';

import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Trophy, Zap, CircleDot, Target, ChevronRight } from 'lucide-react';
import { EVENTS } from '@/lib/mock-data';

const ICON_MAP: Record<string, any> = {
  Zap: Zap,
  Trophy: Trophy,
  CircleDot: CircleDot,
  Target: Target,
};

export default function Home() {
  return (
    <div className="space-y-10 max-w-5xl mx-auto py-10 px-4">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
          Paradox 2026
        </h1>
        <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-primary">
          Select a Sport
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {EVENTS.map((event) => {
          const IconComp = ICON_MAP[event.icon];
          return (
            <Link key={event.id} href={`/events/${event.slug}`}>
              <Card className="premium-card group h-full overflow-hidden border-white/5 hover:border-primary/50 transition-all duration-500">
                <CardContent className="p-0">
                  <div className="flex h-40">
                    <div className="w-1/4 bg-primary/10 flex items-center justify-center border-r border-white/5 group-hover:bg-primary/20 transition-colors">
                      <IconComp className="h-10 w-10 text-primary" />
                    </div>
                    <div className="w-3/4 p-6 flex flex-col justify-center space-y-2">
                      <h2 className="text-xl font-black italic uppercase tracking-tighter">{event.name}</h2>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest leading-tight">{event.description}</p>
                      <div className="pt-2 flex items-center text-[10px] font-black uppercase text-primary gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        View Details <ChevronRight className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
