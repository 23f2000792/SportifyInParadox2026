
'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { paradoxAssistant } from '@/ai/flows/paradox-assistant-flow';
import { triggerHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export function ParadoxAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Welcome to Paradox 2026! I'm your official Sportify Assistant. How can I help you dominate today?" }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    triggerHaptic('medium');

    try {
      const result = await paradoxAssistant({ query: userMsg });
      setMessages((prev) => [...prev, { role: 'assistant', content: result.answer }]);
      triggerHaptic('success');
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'assistant', content: "Sorry, my frequency is a bit jammed! Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          className="fixed bottom-20 right-4 md:bottom-8 md:right-8 h-14 w-14 rounded-full shadow-2xl shadow-primary/40 z-[45] group p-0"
          onClick={() => triggerHaptic('light')}
        >
          <div className="relative h-full w-full flex items-center justify-center">
            <Bot className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
            <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-accent animate-pulse" />
          </div>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] sm:h-[600px] p-0 border-t-primary border-t-2 rounded-t-3xl bg-background/95 backdrop-blur-xl">
        <SheetHeader className="p-6 border-b border-border bg-muted/20">
          <SheetTitle className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            <span className="text-hype text-lg">Ask Paradox AI</span>
          </SheetTitle>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Official Concierge</p>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100%-120px)] sm:h-[480px]">
          <ScrollArea className="flex-grow p-6">
            <div className="flex flex-col gap-4">
              {messages.map((m, i) => (
                <div key={i} className={cn(
                  "flex flex-col",
                  m.role === 'user' ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "max-w-[85%] p-4 rounded-2xl text-xs font-bold leading-relaxed shadow-sm",
                    m.role === 'user' 
                      ? "bg-primary text-white rounded-tr-none" 
                      : "bg-muted border border-border rounded-tl-none italic text-foreground"
                  )}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-primary animate-pulse py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Processing...</span>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <form onSubmit={handleSend} className="p-4 border-t border-border bg-background flex gap-2 mb-safe">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about rules or schedules..."
              className="flex-grow h-12 bg-muted/30 border-none rounded-xl font-bold text-xs"
            />
            <Button type="submit" size="icon" className="h-12 w-12 rounded-xl" disabled={loading}>
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
