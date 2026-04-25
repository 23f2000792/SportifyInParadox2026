
'use client';

import { useState, useEffect } from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    function handleOnline() {
      setIsOffline(false);
    }
    function handleOffline() {
      setIsOffline(true);
    }

    setIsOffline(!navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-destructive text-white px-4 py-2 flex items-center justify-center gap-3 animate-in slide-in-from-top duration-300 shadow-xl">
      <WifiOff className="h-4 w-4 animate-pulse" />
      <div className="flex flex-col">
        <p className="text-[10px] font-black uppercase tracking-widest leading-none">Connection Lost</p>
        <p className="text-[8px] font-bold uppercase opacity-80 tracking-tight">Live updates paused. Reconnecting...</p>
      </div>
      <AlertTriangle className="h-3 w-3 ml-2 opacity-40" />
    </div>
  );
}
