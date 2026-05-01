
'use client';

import { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CountdownTimer({ targetDate, targetTime }: { targetDate: string, targetTime: string }) {
  const [timeLeft, setTimeLeft] = useState<{ h: number, m: number, s: number } | null>(null);

  useEffect(() => {
    const calculateTime = () => {
      try {
        // Parse "HH:MM AM/PM"
        const timeParts = targetTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (!timeParts) return null;
        
        let hours = parseInt(timeParts[1]);
        const minutes = parseInt(timeParts[2]);
        const ampm = timeParts[3].toUpperCase();
        
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;

        const target = new Date(`${targetDate}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`);
        const now = new Date();
        const diff = target.getTime() - now.getTime();

        if (diff <= 0) return null;

        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        return { h, m, s };
      } catch (e) {
        return null;
      }
    };

    const timer = setInterval(() => {
      const remaining = calculateTime();
      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, targetTime]);

  if (!timeLeft) return null;

  return (
    <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full border border-primary/20 animate-in fade-in zoom-in duration-300">
      <Timer className="h-3 w-3 text-primary animate-pulse" />
      <span className="text-[10px] font-black uppercase tracking-widest text-primary tabular-nums">
        Starts in: {timeLeft.h.toString().padStart(2, '0')}:{timeLeft.m.toString().padStart(2, '0')}:{timeLeft.s.toString().padStart(2, '0')}
      </span>
    </div>
  );
}
