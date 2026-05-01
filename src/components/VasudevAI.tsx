
'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Sparkles, Send, Loader2, Bot, X, Trophy, Calendar, Info, ShieldCheck, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { vasudevAssistant } from '@/ai/flows/vasudev-ai-flow';
import { triggerHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, limit, orderBy } from 'firebase/firestore';
import { Match, Standing } from '@/lib/types';
import ReactMarkdown from 'react-markdown';

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
      content: "Namaste, Warrior! I am **Vasudev.ai**, your divine companion on this journey to greatness. Whether you seek the path to victory or the wisdom of the tournament laws, I am here by your side. How shall we conquer today?" 
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
    { label: "Penalty Rule", value: "What are the rules for football penalties?", icon: ShieldCheck },
    { label: "Victory's Path", value: "Who is leading the championship standings?", icon: Trophy },
    { label: "The Zero Hour", value: "When is the Kampus Run flag-off?", icon: Calendar },
    { label: "Match Dharma", value: "Are there any live matches right now?", icon: Flame },
  ];

  return (
    <>
      {/* Floating Trigger Button */}
      {!open && (
        <Button 
          className="fixed bottom-20 right-4 md:bottom-8 md:right-8 h-16 w-16 rounded-full shadow-[0_0_40px_rgba(124,58,237,0.5)] z-[60] group p-0 bg-primary hover:bg-primary/90 border-2 border-white/20 transition-all hover:scale-110 active:scale-90"
          onClick={() => {
            triggerHaptic('light');
            setOpen(true);
          }}
        >
          <div className="relative h-full w-full flex items-center justify-center">
            <Bot className="h-8 w-8 text-white group-hover:rotate-12 transition-transform" />
            <div className="absolute -top-1 -right-1 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <Sparkles className="relative inline-flex h-5 w-5 text-accent fill-accent" />
            </div>
          </div>
        </Button>
      )}

      {/* Square Popup Container */}
      {open && (
        <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 w-[92vw] sm:w-[400px] h-[600px] max-h-[85vh] bg-card/98 backdrop-blur-3xl shadow-2xl rounded-3xl border-t-primary border-t-4 z-[60] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 slide-in-from-bottom-10 duration-300">
          
          {/* Header */}
          <div className="p-6 border-b border-border bg-gradient-to-br from-primary/10 via-background to-transparent relative shrink-0">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-xl shadow-primary/30">
                <Bot className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-primary leading-none">Vasudev.ai</h3>
                <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-50 mt-1">Divine Companion</p>
              </div>
            </div>
            <button 
              onClick={() => {
                triggerHaptic('light');
                setOpen(false);
              }}
              className="absolute right-6 top-8 opacity-40 hover:opacity-100 hover:rotate-90 transition-all p-1"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Suggestions Horizontal Scroll */}
          <div className="flex gap-2 p-3 bg-muted/5 border-b border-border/50 overflow-x-auto no-scrollbar scroll-smooth shrink-0">
            {suggestions.map((s, idx) => (
              <Button 
                key={idx} 
                variant="outline" 
                size="sm" 
                className="shrink-0 h-8 text-[8px] font-black uppercase rounded-full gap-1.5 border-primary/20 bg-background/50 hover:bg-primary/5 transition-all px-3" 
                onClick={() => handleSend(s.value)}
                disabled={loading}
              >
                <s.icon className="h-3 w-3 text-primary" />
                {s.label}
              </Button>
            ))}
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-grow p-4 md:p-6">
            <div className="flex flex-col gap-6 max-w-full pb-10">
              {messages.map((m, i) => (
                <div key={i} className={cn(
                  "flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-400",
                  m.role === 'user' ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "max-w-[90%] p-4 rounded-2xl text-[13px] leading-relaxed shadow-sm transition-all whitespace-pre-wrap",
                    m.role === 'user' 
                      ? "bg-primary text-white rounded-tr-none shadow-primary/20 font-bold" 
                      : "bg-muted/40 border border-border/60 rounded-tl-none italic text-foreground shadow-inner text-justify"
                  )}>
                    {m.role === 'assistant' ? (
                      <ReactMarkdown 
                        components={{
                          ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 mb-2 mt-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 mb-2 mt-2">{children}</ol>,
                          li: ({ children }) => <li className="text-[13px] leading-snug">{children}</li>,
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          strong: ({ children }) => <strong className="font-black text-primary uppercase text-[12px]">{children}</strong>
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    ) : (
                      m.content
                    )}
                  </div>
                  {m.role === 'assistant' && (
                    <span className="text-[7px] font-black uppercase tracking-widest opacity-20 ml-2 mt-1">Vasudev Guidance</span>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-3 text-primary py-2 px-4 bg-primary/5 rounded-full w-fit animate-pulse border border-primary/10">
                  <div className="relative">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <Sparkles className="absolute -top-1 -right-1 h-2.5 w-2.5 text-accent animate-pulse" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">Consulting the heavens...</span>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-border bg-background/50 backdrop-blur-md shrink-0">
            <form onSubmit={handleSend} className="flex gap-2">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything, my friend..."
                className="flex-grow h-12 bg-muted/20 border-border/50 rounded-xl font-bold text-sm px-4 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-muted/10 transition-all"
              />
              <Button type="submit" size="icon" className="h-12 w-12 rounded-xl shrink-0 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all active:scale-90" disabled={loading}>
                <Send className="h-5 w-5 text-white" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
