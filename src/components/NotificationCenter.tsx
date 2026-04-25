
'use client';

import { useMemo } from 'react';
import { Bell, Megaphone, Clock, ShieldCheck, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useFirestore, useCollection, useNotifications } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Broadcast } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export function NotificationCenter() {
  const db = useFirestore();
  const { permission, requestPermission, loading: permissionLoading } = useNotifications();

  const broadcastQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'broadcasts'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
  }, [db]);

  const { data: broadcasts, loading } = useCollection<Broadcast>(broadcastQuery);

  const hasActive = useMemo(() => {
    return broadcasts?.some(b => b.active);
  }, [broadcasts]);

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return '';
    }
  };

  const isEnabled = permission === 'granted';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-xl border border-border bg-white/[0.03] hover:bg-white/[0.06] text-muted-foreground hover:text-primary transition-all"
        >
          <Bell className="h-[18px] w-[18px]" />
          {hasActive && (
            <span className="absolute top-2.5 right-2.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 border-border bg-card/95 backdrop-blur-2xl shadow-2xl" align="end">
        <div className="p-4 border-b border-border bg-muted/20 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Live Bulletins</h3>
            <span className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-widest">Sportify Broadcast</span>
          </div>
          
          {/* Notification Opt-in */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/50">
            <div className="space-y-0.5">
              <Label htmlFor="notif-toggle" className="text-[9px] font-black uppercase tracking-wider block">Mobile Alerts</Label>
              <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-tight">System Push Notifications</p>
            </div>
            {permissionLoading ? (
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
            ) : (
              <Switch 
                id="notif-toggle" 
                checked={isEnabled} 
                onCheckedChange={(checked) => {
                  if (checked && permission !== 'granted') requestPermission();
                }} 
              />
            )}
          </div>
        </div>

        <ScrollArea className="h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-20">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/20 animate-pulse">Syncing...</span>
            </div>
          ) : broadcasts && broadcasts.length > 0 ? (
            <div className="divide-y divide-border">
              {broadcasts.map((b) => (
                <div key={b.id} className={cn(
                  "p-4 space-y-2 transition-colors",
                  b.active ? "bg-primary/[0.02]" : "opacity-60"
                )}>
                  <div className="flex items-start gap-3">
                    <Megaphone className={cn("h-3.5 w-3.5 mt-0.5", b.active ? "text-primary" : "text-muted-foreground")} />
                    <p className="text-xs font-bold leading-relaxed text-foreground break-words italic">
                      {b.message}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 pl-7">
                    <Clock className="h-2.5 w-2.5 text-muted-foreground/40" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">
                      {formatTimestamp(b.timestamp)}
                    </span>
                    {b.active && (
                      <span className="ml-auto text-[8px] font-black uppercase text-primary tracking-tighter bg-primary/10 px-1.5 py-0.5 rounded">Live</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-10 text-center space-y-3">
              <div className="h-10 w-10 rounded-full bg-muted/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-muted-foreground/20" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 leading-relaxed">
                No active broadcasts. Updates will appear here.
              </p>
            </div>
          )}
        </ScrollArea>
        <div className="p-3 border-t border-border bg-muted/10 text-center">
          <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/20">Official Sportify Feed</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
