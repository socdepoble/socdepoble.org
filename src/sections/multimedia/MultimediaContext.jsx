import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { loadMultimedia } from '../../data/backendPort.js';
import { useIdentitat } from '../../app/contexts/IdentitatContext.jsx';

import { useRecarregaExterna } from '../../app/contexts/useRecarregaExterna.jsx';

const MultimediaContext = createContext(null);

export function MultimediaProvider({ children, config }) {
  const { actorId, actorKey } = useIdentitat();
  const [data, setData] = useState({ status: 'loading', error: null, payload: null });
  const [tick, setTick] = useState(0);
  const loadGen = useRef(0);

  useEffect(() => {
    let active = true;
    const myGen = ++loadGen.current;
    const controller = new AbortController();
    
    async function load() {
      try {
        const { quanLlest } = await import('../../host.js');
        await quanLlest();
        const payload = await loadMultimedia(actorId, { ...config, signal: controller.signal });
        if (!active || myGen !== loadGen.current) return;
        setData({ status: 'ready', error: null, payload });
      } catch (error) {
        if (!active || error?.name === 'AbortError') return;
        setData({ status: 'error', error, payload: null });
      }
    }
    
    load();
    return () => { 
      active = false;
      controller.abort();
    };
  }, [actorKey, config, tick]);

  const value = useMemo(() => {
    if (data.status !== 'ready' || !data.payload) return { 
      status: data.status, 
      error: data.error, 
      mediaItems: [], 
      mediaTimelineGroups: [],
      refresh: () => {
        setData(prev => ({ ...prev, status: 'loading' }));
        setTick(t => t + 1);
      }
    };
    return {
      status: data.status,
      error: data.error,
      mediaItems: data.payload.mediaItems || [],
      mediaTimelineGroups: data.payload.mediaTimelineGroups || [],
      refresh: () => {
        setData(prev => ({ ...prev, status: 'loading' }));
        setTick(t => t + 1);
      }
    };
  }, [data]);

  useRecarregaExterna(() => {
    if (data.status !== 'loading') {
      setData(prev => ({ ...prev, status: 'loading' }));
      setTick(t => t + 1);
    }
  });

  return <MultimediaContext.Provider value={value}>{children}</MultimediaContext.Provider>;
}

export function useMultimedia() {
  return useContext(MultimediaContext) || { status: 'loading', mediaItems: [], mediaTimelineGroups: [] };
}
