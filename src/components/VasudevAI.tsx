'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Sparkles, Send, Loader2, Bot, X, Trophy, Calendar, Info, ShieldCheck, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { vasudevAssistant } from '@/ai/flows/vasudev-ai-flow';
import { triggerHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, limit, orderBy } from 'firebase/firestore';
import { Match, Standing } from '@/lib/types';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export function VasudevAI() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: "Namaste, Warrior! I am Vasudev.ai, your companion on this journey to greatness. Whether you seek the path to victory or the wisdom of the rules, I am here by your side. How shall we conquer today?" 
    }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const db = useFirestore();

  // Fetch real-time context to feed into the AI
  const matchesQuery = useMemo(() => query(collection(db, 'matches'), orderBy('updatedAt', 'desc'), limit(10)), [db]);
  const standingsQuery = useMemo(() => query(collection(db, 'standings'), limit(20)), [db]);

  const { data: recentMatches } = useCollection<Match>(matchesQuery);
  const { data: standings } = useCollection<Standing>(standingsQuery);

  const appStateContext = useMemo(() => {
    let ctx = "REAL-TIME TOURNAMENT DATA:\n";
    
    if (recentMatches && recentMatches.length > 0) {
      ctx += "\nRECENT/LIVE MATCHES:\n";
      recentMatches.forEach(m => {
        ctx += `- ${m.sport.toUpperCase()}: ${m.teamA} ${m.scoreA} - ${m.scoreB} ${m.teamB} (${m.status}, ${m.phase})\n`;
      });
    }

    if (standings && standings.length > 0) {
      ctx += "\nSTANDINGS SUMMARY:\n";
      standings.slice(0, 10).forEach(s => {
        ctx += `- ${s.team} (${s.sport}): ${s.points} pts, Played: ${s.played}, Won: ${s.won}\n`;
      });
    }

    return ctx;
  }, [recentMatches, standings]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent | string) => {
    if (typeof e !== 'string') e.preventDefault();
    
    const userMsg = typeof e === 'string' ? e : input.trim();
    if (!userMsg || loading) return;

    if (typeof e !== 'string') setInput('');
    
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    triggerHaptic('medium');

    try {
      const result = await vasudevAssistant({ 
        query: userMsg,
        context: appStateContext
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: result.answer }]);
      triggerHaptic('success');
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'assistant', content: "My friend, the signal is fluctuating like the wind. Please, ask your question once more." }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    { label: "One-Step Penalty Rule", value: "What are the rules for football penalties?", icon: ShieldCheck },
    { label: "Path to Victory", value: "Who is leading the championship standings?", icon: Trophy },
    { label: "The Zero Hour", value: "When is the Kampus Run flag-off?", icon: Calendar },
    { label: "Match Dharma", value: "Are there any live matches right now?", icon: Flame },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          className="fixed bottom-20 right-4 md:bottom-8 md:right-8 h-16 w-16 rounded-full shadow-[0_0_40px_rgba(124,58,237,0.5)] z-[45] group p-0 bg-primary hover:bg-primary/90 border-2 border-white/20 transition-all hover:scale-110 active:scale-90"
          onClick={() => triggerHaptic('light')}
        >
          <div className="relative h-full w-full flex items-center justify-center">
            <Bot className="h-8 w-8 text-white group-hover:rotate-12 transition-transform" />
            <div className="absolute -top-1 -right-1 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <Sparkles className="relative inline-flex h-5 w-5 text-accent fill-accent" />
            </div>
          </div>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] sm:h-[700px] p-0 border-t-primary border-t-4 rounded-t-[3rem] bg-background/98 backdrop-blur-3xl shadow-2xl overflow-hidden">
        <SheetHeader className="p-8 border-b border-border bg-gradient-to-br from-primary/10 via-background to-transparent relative rounded-t-[3rem]">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/30 group">
              <Bot className="h-8 w-8 text-white group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <SheetTitle className="text-3xl font-black italic uppercase tracking-tighter text-primary leading-none">Vasudev.ai</SheetTitle>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-50 mt-1">Your Divine Sports Companion</p>
            </div>
          </div>
          <SheetClose className="absolute right-8 top-10 opacity-40 hover:opacity-100 hover:rotate-90 transition-all">
            <X className="h-7 w-7" />
          </SheetClose>
        </SheetHeader>

        <div className="flex flex-col h-[calc(90vh-140px)] sm:h-[560px]">
          {/* Suggestions Horizontal Scroll */}
          <div className="flex gap-2 p-4 bg-muted/5 border-b border-border/50 overflow-x-auto no-scrollbar scroll-smooth">
            {suggestions.map((s, idx) => (
              <Button 
                key={idx} 
                variant="outline" 
                size="sm" 
                className="shrink-0 h-9 text-[9px] font-black uppercase rounded-full gap-2 border-primary/20 bg-background/50 hover:bg-primary/5 hover:border-primary/40 transition-all" 
                onClick={() => handleSend(s.value)}
                disabled={loading}
              >
                <s.icon className="h-3.5 w-3.5 text-primary" />
                {s.label}
              </Button>
            ))}
          </div>

          <ScrollArea className="flex-grow px-6 py-6">
            <div className="flex flex-col gap-8 max-w-2xl mx-auto pb-20">
              {messages.map((m, i) => (
                <div key={i} className={cn(
                  "flex flex-col animate-in fade-in slide-in-from-bottom-3 duration-500",
                  m.role === 'user' ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "max-w-[88%] md:max-w-[85%] p-5 rounded-[2rem] text-sm md:text-base font-bold leading-relaxed shadow-sm transition-all",
                    m.role === 'user' 
                      ? "bg-primary text-white rounded-tr-none shadow-primary/20" 
                      : "bg-muted/40 border border-border/60 rounded-tl-none italic text-foreground shadow-inner"
                  )}>
                    {m.content}
                  </div>
                  {m.role === 'assistant' && (
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-20 ml-5 mt-2">Vasudev Guidance</span>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-4 text-primary py-3 px-6 bg-primary/5 rounded-full w-fit animate-pulse border border-primary/10">
                  <div className="relative">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-accent animate-pulse" />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-[0.2em]">Consulting the Heavens...</span>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="p-8 border-t border-border bg-background/50 backdrop-blur-md mb-safe">
            <form onSubmit={handleSend} className="max-w-2xl mx-auto flex gap-4">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything, my friend..."
                className="flex-grow h-16 bg-muted/20 border-border/50 rounded-[1.5rem] font-bold text-base px-8 focus-visible:ring-4 focus-visible:ring-primary/10 focus-visible:bg-muted/10 transition-all placeholder:opacity-30"
              />
              <Button type="submit" size="icon" className="h-16 w-16 rounded-[1.5rem] shrink-0 shadow-2xl shadow-primary/30 transition-all active:scale-90 bg-primary hover:bg-primary/90" disabled={loading}>
                <Send className="h-7 w-7 text-white" />
              </Button>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
