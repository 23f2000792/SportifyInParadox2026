"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { generateMatchRecap, GenerateMatchRecapOutput } from '@/ai/flows/ai-match-recap-tool';
import { Match } from '@/lib/types';
import { Sparkles, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export function MatchRecapButton({ match }: { match: Match }) {
  const [loading, setLoading] = useState(false);
  const [recap, setRecap] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleGenerate = async () => {
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
      console.error('Failed to generate recap', error);
      setRecap("Oops! We couldn't generate the recap at this moment. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-primary hover:text-primary hover:bg-primary/10 gap-2"
        onClick={handleGenerate}
      >
        <Sparkles className="h-4 w-4" />
        AI Match Recap
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Match Summary
            </DialogTitle>
            <DialogDescription>
              {match.teamA} vs {match.teamB}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground animate-pulse">Our AI is drafting your recap...</p>
              </div>
            ) : (
              <p className="text-lg leading-relaxed italic text-foreground/90 font-medium">
                "{recap}"
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
