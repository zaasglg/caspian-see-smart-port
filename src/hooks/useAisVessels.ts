'use client';

import { useEffect, useRef, useState } from 'react';
import {
  aisToVessel,
  type AisConnectionStatus,
  type AisStreamEvent,
  type AisVesselSnapshot,
} from '@/lib/ais';
import type { Vessel } from '@/types/port';

const STALE_MS = 15 * 60 * 1000;

export function useAisVessels() {
  const [status, setStatus] = useState<AisConnectionStatus>('idle');
  const [message, setMessage] = useState('');
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [liveCount, setLiveCount] = useState(0);
  const snapsRef = useRef<Map<string, AisVesselSnapshot>>(new Map());
  const stopRetryRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let es: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    stopRetryRef.current = false;

    const rebuild = () => {
      const now = Date.now();
      const fresh = [...snapsRef.current.values()]
        .filter((s) => now - s.updatedAt < STALE_MS)
        .sort((a, b) => a.mmsi.localeCompare(b.mmsi));
      setLiveCount(fresh.length);
      setVessels(fresh.map((s, i) => aisToVessel(s, i)));
    };

    const connect = () => {
      if (cancelled || stopRetryRef.current) return;
      setStatus('connecting');
      es = new EventSource('/api/ais/stream');

      es.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data) as AisStreamEvent;
          if (data.type === 'status' && data.status) {
            setStatus(data.status);
            if (data.message) setMessage(data.message);
            if (data.status === 'unavailable') {
              stopRetryRef.current = true;
              es?.close();
            }
          }
          if (data.type === 'error' && data.message) {
            setMessage(data.message);
          }
          if (data.type === 'vessel' && data.vessel) {
            snapsRef.current.set(data.vessel.mmsi, data.vessel);
            rebuild();
            setStatus('live');
          }
          if (data.type === 'ping' && typeof data.count === 'number') {
            setLiveCount(data.count);
            rebuild();
          }
        } catch {
          // ignore
        }
      };

      es.onerror = () => {
        es?.close();
        if (cancelled || stopRetryRef.current) return;
        setStatus((prev) => (prev === 'unavailable' ? prev : 'error'));
        setMessage('Переподключение к AIS…');
        retryTimer = setTimeout(connect, 5000);
      };
    };

    connect();
    const prune = setInterval(rebuild, 30000);

    return () => {
      cancelled = true;
      es?.close();
      if (retryTimer) clearTimeout(retryTimer);
      clearInterval(prune);
    };
  }, []);

  return { status, message, vessels, liveCount };
}
