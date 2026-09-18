import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { loadMultimedia } from '../../data/backendPort.js';
import { useIdentitat } from '../../app/contexts/IdentitatContext.jsx';

const MultimediaContext = createContext(null);

export function MultimediaProvider({ children, config }) {
  const { actorId, actorKey } = useIdentitat();
  const [data, setData] = useState({ status: 'loading', error: null, payload: null });
  const loadGen = useRef(0);

  useEffect(() => {
    let active = true;
    const myGen = ++loadGen.current;
    
    async function load() {
      try {
        const payload = await loadMultimedia(actorId, config);
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
    if (data.status !== 'ready' || !data.payload) return { status: data.status, error: data.error, mediaItems: [], mediaTimelineGroups: [] };
    return {
      status: data.status,
      error: data.error,
      mediaItems: data.payload.mediaItems || [],
      mediaTimelineGroups: data.payload.mediaTimelineGroups || []
    };
  }, [data]);

  return <MultimediaContext.Provider value={value}>{children}</MultimediaContext.Provider>;
}

export function useMultimedia() {
  return useContext(MultimediaContext) || { status: 'loading', mediaItems: [], mediaTimelineGroups: [] };
}
