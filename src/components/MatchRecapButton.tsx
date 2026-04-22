
"use client";

import { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { generateMatchRecap } from '@/ai/flows/ai-match-recap-tool';
import { Match } from '@/lib/types';
import { Sparkles, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export const MatchRecapButton = memo(function MatchRecapButton({ match }: { match: Match }) {
  const [loading, setLoading] = useState(false);
  const [recap, setRecap] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleGenerate = async () => {
    if (loading) return;
    setLoading(true);
    setOpen(true);
    try {
      const result = await generateMatchRecap({
        sport: match.sport,
        teamA_name: match.teamA,
        teamA_score: match.scoreA,
        teamB_name: match.teamB,
        teamB_score: match.scoreB,
        keyEvents: match.keyEvents || [],
      });
      setRecap(result.recap);
    } catch (error) {
      setRecap("Recap temporarily unavailable. Please try again soon.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-7 text-[10px] font-black uppercase text-primary hover:text-primary hover:bg-primary/5 gap-1.5"
        onClick={handleGenerate}
      >
        <Sparkles className="h-3 w-3" />
        AI Recap
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-primary text-white">
            <DialogTitle className="flex items-center gap-2 text-lg font-black uppercase tracking-tight">
              <Sparkles className="h-5 w-5" />
              Match Recap
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80 font-bold text-xs uppercase">
              {match.teamA} {match.scoreA} - {match.scoreB} {match.teamB}
            </DialogDescription>
          </DialogHeader>
          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-6 space-y-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase text-muted-foreground animate-pulse tracking-widest">Drafting...</p>
              </div>
            ) : (
              <p className="text-sm leading-relaxed font-medium text-foreground italic border-l-2 border-primary/20 pl-4 py-1">
                "{recap}"
              </p>
            )}
          </div>
          <div className="px-6 pb-6 flex justify-end">
            <Button variant="outline" size="sm" className="text-[10px] font-black uppercase h-8" onClick={() => setOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});
