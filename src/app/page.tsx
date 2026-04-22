import { EVENTS, MOCK_MATCHES } from '@/lib/mock-data';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Trophy, Zap, CircleDot, Target, Gavel, ChevronRight } from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  Zap: Zap,
  Trophy: Trophy,
  CircleDot: CircleDot,
  Target: Target,
  Gavel: Gavel,
};

export default function Home() {
  const liveMatches = MOCK_MATCHES.filter(m => m.status === 'Live');
  
  return (
    <div className="space-y-6">
      {/* Live Now: Compact Data View */}
      {liveMatches.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-live animate-pulse"></div>
              <h2 className="text-[10px] font-black uppercase tracking-widest text-live">Live Now</h2>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {liveMatches.map((match) => (
              <Card key={match.id} className="border-none shadow-sm ring-1 ring-live/20">
                <CardContent className="p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-black uppercase text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{match.sport}</span>
                    <span className="text-[9px] font-bold text-live animate-pulse">LIVE</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col flex-1 items-end">
                      <p className="text-xs font-black truncate max-w-[80px]">{match.teamA}</p>
                      <p className="text-xl font-black">{match.scoreA}</p>
                    </div>
                    <div className="text-[9px] font-black text-muted-foreground/40">VS</div>
                    <div className="flex flex-col flex-1 items-start">
                      <p className="text-xs font-black truncate max-w-[80px]">{match.teamB}</p>
                      <p className="text-xl font-black">{match.scoreB}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Navigation Grid */}
      <section className="space-y-3">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Event Categories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {EVENTS.map((event) => {
            const IconComp = ICON_MAP[event.icon];
            return (
              <Link key={event.id} href={`/events/${event.slug}`} className="group">
                <Card className="border-none shadow-sm hover:ring-2 hover:ring-primary/30 transition-all duration-200">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors">
                        <IconComp className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <h3 className="text-sm font-black group-hover:text-primary transition-colors">{event.name}</h3>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">View Schedule & Stats</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
