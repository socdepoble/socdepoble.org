import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { loadMur, appendSectionSubmissionNetworkOnly } from '../../data/backendPort.js';
import { sortPinnedContent } from '../../config/contentHelpers';
import { useIdentitat } from '../../app/contexts/IdentitatContext.jsx';
import { useCoreContent } from '../../app/contexts/CoreContentContext.jsx';
import { useRecarregaExterna } from '../../app/contexts/useRecarregaExterna.jsx';

const MurContext = createContext(null);

export function MurProvider({ children, config }) {
  const { actorId, actorKey } = useIdentitat();
  const [data, setData] = useState({ status: 'loading', error: null, payload: null });
  const [tick, setTick] = useState(0);
  const loadGen = useRef(0);

  useEffect(() => {
    let active = true;
    const myGen = ++loadGen.current;
    
    async function load() {
      try {
        const payload = await loadMur(actorId, config);
        if (!active || myGen !== loadGen.current) return;
        setData({ status: 'ready', error: null, payload });
      } catch (error) {
        if (!active) return;
        setData({ status: 'error', error, payload: null });
      }
    }
    
    load();
    return () => { active = false; };
  }, [actorKey, config, tick]);

  const value = useMemo(() => {
    if (data.status !== 'ready' || !data.payload) return { status: data.status, error: data.error, feedPosts: [], events: [], marketItems: [], sortedFeedPosts: [], sortedEvents: [], sortedMarketItems: [], sendSectionSubmission: async () => { throw new Error('El Mur no està llest o no té dades disponibles.'); } };
    return {
      status: data.status,
      error: data.error,
      feedPosts: data.payload.feedPosts || [],
      events: data.payload.events || [],
      marketItems: data.payload.marketItems || [],
      sortedFeedPosts: data.payload.feedPosts ? sortPinnedContent(data.payload.feedPosts) : [],
      sortedEvents: data.payload.events ? sortPinnedContent(data.payload.events) : [],
      sortedMarketItems: data.payload.marketItems ? sortPinnedContent(data.payload.marketItems) : [],
      sendSectionSubmission: async (sub) => {
        return await appendSectionSubmissionNetworkOnly(sub, config);
      },
      refresh: () => {
        setData(prev => ({ ...prev, status: 'loading' }));
        setTick(t => t + 1);
      }
    };
  }, [data, config]);

  useRecarregaExterna(() => {
    if (data.status !== 'loading') {
      setData(prev => ({ ...prev, status: 'loading' }));
      setTick(t => t + 1);
    }
  });

  return <MurContext.Provider value={value}>{children}</MurContext.Provider>;
}

export function useMur() {
  return useContext(MurContext) || { status: 'loading', feedPosts: [], events: [], marketItems: [], sortedFeedPosts: [], sortedEvents: [], sortedMarketItems: [], sendSectionSubmission: async () => { throw new Error('El Mur no està llest o no té dades disponibles.'); } };
}
