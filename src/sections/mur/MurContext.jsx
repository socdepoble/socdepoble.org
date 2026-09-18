import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { loadMur, appendSectionSubmissionNetworkOnly } from '../../data/backendPort.js';
import { sortPinnedContent } from '../../config/contentHelpers';
import { useIdentitat } from '../../app/contexts/IdentitatContext.jsx';
import { useCoreContent } from '../../app/contexts/CoreContentContext.jsx';

const MurContext = createContext(null);

export function MurProvider({ children, config }) {
  const { actorId, actorKey } = useIdentitat();
  const [data, setData] = useState({ status: 'loading', error: null, payload: null });
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
  }, [actorKey, config]);

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
      }
    };
  }, [data, config]);

  return <MurContext.Provider value={value}>{children}</MurContext.Provider>;
}

export function useMur() {
  return useContext(MurContext) || { status: 'loading', feedPosts: [], events: [], marketItems: [], sortedFeedPosts: [], sortedEvents: [], sortedMarketItems: [], sendSectionSubmission: async () => { throw new Error('El Mur no està llest o no té dades disponibles.'); } };
}
