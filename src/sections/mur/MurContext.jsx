import { backendScope } from '../../config/backendConfig.js';
import { useScopedResource } from '../../app/contexts/useScopedResource.js';
import React, { createContext, useContext, useMemo, useLayoutEffect, useRef } from 'react';
import { loadMur, appendSectionSubmissionNetworkOnly } from '../../data/backendPort.js';
import { sortPinnedContent } from '../../config/contentHelpers';
import { useIdentitat } from '../../app/contexts/IdentitatContext.jsx';
import { useRecarregaExterna } from '../../app/contexts/useRecarregaExterna.jsx';

import { useSession } from '../../app/contexts/SessionContext.jsx';

const MurContext = createContext(null);

export function MurProvider({ children, config }) {
  const { actorId, actorKey, actor } = useIdentitat();
  const { generacio, currentUser } = useSession();
  const scopeKey = JSON.stringify([backendScope(config),
    currentUser?.id, actorKey, generacio]);
  const data = useScopedResource(loadMur, actorId, scopeKey, config);

  /* I2 · Qui signa la publicació: la identitat activa. El port en trau
     author_org_id quan és una entitat; el servidor ho torna a comprovar. */
  const actorTipus = actor?.tipus === 'entitat' ? 'entitat' : 'persona';
  const actorSignant = actor?.id ?? actorId ?? null;
  const autoria = useMemo(() => ({ tipus: actorTipus, id: actorSignant }), [actorTipus, actorSignant]);

  const operation = useMemo(() => ({ scopeKey, config }), [scopeKey, config]);
  const currentOperation = useRef(null);
  useLayoutEffect(() => {
    currentOperation.current = operation;
    return () => { if (currentOperation.current === operation) currentOperation.current = null; };
  }, [operation]);

  const value = useMemo(() => {
    if (data.status !== 'ready' || !data.payload) return { refresh: data.refresh, status: data.status, error: data.error, feedPosts: [], events: [], marketItems: [], sortedFeedPosts: [], sortedEvents: [], sortedMarketItems: [], sendSectionSubmission: async () => { throw new Error('El Mur no està llest o no té dades disponibles.'); } };
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
        const assertCurrent = () => {
          if (currentOperation.current !== operation) throw new DOMException('Sessió canviada.', 'AbortError');
        };
        assertCurrent();
        const saved = await appendSectionSubmissionNetworkOnly({ ...sub, actor: autoria }, config);
        assertCurrent();
        data.refresh();
        return saved;
      },
      refresh: data.refresh
    };
  }, [data, config, operation, autoria]);

  useRecarregaExterna(data.refresh);

  return <MurContext.Provider value={value}>{children}</MurContext.Provider>;
}

export function useMur() {
  return useContext(MurContext) || { status: 'loading', feedPosts: [], events: [], marketItems: [], sortedFeedPosts: [], sortedEvents: [], sortedMarketItems: [], sendSectionSubmission: async () => { throw new Error('El Mur no està llest o no té dades disponibles.'); } };
}
