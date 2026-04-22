import { EVENTS, MOCK_MATCHES } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Trophy, Zap, CircleDot, Target, Gavel, ArrowRight, Play } from 'lucide-react';

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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero Section */}
      <section className="space-y-2">
        <h1 className="text-3xl md:text-4xl">Sportify in Paradox 2026</h1>
        <p className="text-muted-foreground max-w-2xl">
          Welcome to the central dashboard for the annual college sports fest. Stay updated with live scores, schedules, and standings.
        </p>
      </section>

      {/* Live Now Section */}
      {liveMatches.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
            </div>
            <h2 className="text-xl font-semibold">Live Now</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveMatches.map((match) => (
              <Card key={match.id} className="border-l-4 border-l-yellow-400 shadow-md">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      {match.sport.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-medium">{match.time}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <div className="flex-1 text-center">
                      <p className="font-bold text-lg">{match.teamA}</p>
                      <p className="text-3xl font-black mt-1">{match.scoreA}</p>
                    </div>
                    <div className="px-4 text-muted-foreground font-bold">VS</div>
                    <div className="flex-1 text-center">
                      <p className="font-bold text-lg">{match.teamB}</p>
                      <p className="text-3xl font-black mt-1">{match.scoreB}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Quick Navigation Cards */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Events</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {EVENTS.map((event) => {
            const IconComp = ICON_MAP[event.icon];
            return (
              <Link key={event.id} href={`/events/${event.slug}`} className="group block">
                <Card className="h-full transition-all group-hover:shadow-lg group-hover:border-primary/20 group-hover:-translate-y-1">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-bold">{event.name}</CardTitle>
                    <div className="p-2 rounded-lg bg-accent/20 group-hover:bg-accent/40 transition-colors">
                      <IconComp className="h-5 w-5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {event.description}
                    </p>
                    <div className="flex items-center text-xs font-semibold text-primary group-hover:underline">
                      View details <ArrowRight className="ml-1 h-3 w-3" />
                    </div>
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
