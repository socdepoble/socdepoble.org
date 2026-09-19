import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { loadCoreContent } from '../../data/backendPort.js';
import { byId } from '../../config/contentHelpers';
import { useIdentitat } from './IdentitatContext.jsx';
import { useRecarregaExterna } from './useRecarregaExterna.jsx';
import { useUIActions } from './UIContext.jsx';
import { useSession } from './SessionContext.jsx';

const CoreContentContext = createContext(null);

export function CoreContentProvider({ children, config }) {
  const { actorId, actorKey } = useIdentitat();
  const { generacio } = useSession();
  const { setGlobalStatus } = useUIActions();
  const [data, setData] = useState({ status: 'loading', error: null, payload: null });
  const [tick, setTick] = useState(0);
  const loadGen = useRef(0);

  useEffect(() => {
    let active = true;
    const myGen = ++loadGen.current;
    const controller = new AbortController();
    
    async function load() {
      setData(prev => ({ ...prev, status: 'loading', error: null }));
      setGlobalStatus('loading');
      try {
        const { quanLlest } = await import('../../host.js');
        await quanLlest();
        const payload = await loadCoreContent(actorId, { ...config, signal: controller.signal });
        if (!active || myGen !== loadGen.current) return;
        setData({ status: 'ready', error: null, payload });
        setGlobalStatus('ready');
      } catch (error) {
        if (!active || error?.name === 'AbortError') return;
        setData({ status: 'error', error, payload: null });
        setGlobalStatus('error');
      }
    }
    
    load();
    return () => { 
      active = false;
      controller.abort();
    };
  }, [actorKey, config, tick, generacio]);

  const value = useMemo(() => {
    if (data.status !== 'ready' || !data.payload) return { status: data.status, error: data.error, towns: [], pages: [], pageCopy: {}, agents: [], sortedTowns: [], featuredTowns: [], refresh: () => { setData(prev => ({ ...prev, status: 'loading' })); setGlobalStatus('loading'); setTick(t => t + 1); } };
    return {
      status: data.status,
      error: data.error,
      towns: data.payload.towns || [],
      sortedTowns: data.payload.towns ? byId(data.payload.towns) : [],
      featuredTowns: data.payload.towns ? byId(data.payload.towns).filter(t => t.is_featured) : [],
      pages: data.payload.pages || [],
      pageCopy: (data.payload.pages || []).reduce((acc, p) => ({ ...acc, [p.id]: { ...p } }), {}),
      agents: data.payload.agents || [],
      ownerUserId: data.payload.ownerUserId,
      refresh: () => {
        setData(prev => ({ ...prev, status: 'loading' }));
        setGlobalStatus('loading');
        setTick(t => t + 1);
      }
    };
  }, [data]);

  useRecarregaExterna(() => {
    if (data.status !== 'loading') {
      setData(prev => ({ ...prev, status: 'loading' }));
      setGlobalStatus('loading');
      setTick(t => t + 1);
    }
  });

  return <CoreContentContext.Provider value={value}>{children}</CoreContentContext.Provider>;
}

export function useCoreContent() {
  return useContext(CoreContentContext) || { status: 'loading', towns: [], pages: [], pageCopy: {}, agents: [], sortedTowns: [], featuredTowns: [] };
}
