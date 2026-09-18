import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { loadNotes, updateNote as apiUpdateNote, createNote as apiCreateNote, getCurrentUser } from '../../data/backendPort.js';
import { useIdentitat } from '../../app/contexts/IdentitatContext.jsx';

import { useRecarregaExterna } from '../../app/contexts/useRecarregaExterna.jsx';

const NotesDataContext = createContext(null);

/** Estat degradat. Les accions llancen en compte de resoldre en silenci:
    una nota que l'usuari creu guardada i no ho està és pitjor que un error. */
const BUIT = {
  status: 'loading',
  error: null,
  notes: [],
  noteFolders: [],
  updateNote: async () => {},
  creaNota: async () => { throw new Error("El bloc de notes encara no ha carregat."); },
  refresh: () => {}
};

export function NotesDataProvider({ children, config }) {
  const { actorKey } = useIdentitat();
  const [data, setData] = useState({ status: 'loading', error: null, payload: null });
  const [tick, setTick] = useState(0);
  const loadGen = useRef(0);

  useEffect(() => {
    let active = true;
    const myGen = ++loadGen.current;
    const controller = new AbortController();

    async function load() {
      try {
        const userId = getCurrentUser()?.id;
        const payload = await loadNotes(userId, { ...config, signal: controller.signal });
        if (!active || myGen !== loadGen.current) return;
        
        setData(prev => {
          if (!prev.payload || !prev.payload.notes) {
            return { status: 'ready', error: null, payload };
          }
          // F03: Reconciliar respostes de càrrega amb mutacions locals més recents
          const localMap = new Map(prev.payload.notes.map(n => [n.id, n]));
          const mergedNotes = payload.notes.map(remoteNote => {
            const localNote = localMap.get(remoteNote.id);
            if (localNote && localNote.revision > remoteNote.revision) {
              localMap.delete(remoteNote.id);
              return localNote;
            }
            localMap.delete(remoteNote.id);
            return remoteNote;
          });
          
          // Retindre creacions confirmades que encara no estan en la resposta
          const localOnly = Array.from(localMap.values());
          
          return { status: 'ready', error: null, payload: { ...payload, notes: [...mergedNotes, ...localOnly] } };
        });
      } catch (error) {
        if (!active || error?.name === 'AbortError') return;
        // F09: Fetch pot llançar TypeError per problemes de xarxa. No ho tractem com a error de programació.
        if (error instanceof ReferenceError) throw error;
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
    if (data.status !== 'ready' || !data.payload) {
      return { ...BUIT, status: data.status, error: data.error };
    }
    return {
      status: data.status,
      error: data.error,
      notes: data.payload.notes || [],
      noteFolders: data.payload.noteFolders || [],
      updateNote: async (id, updates, rev) => {
        try {
          const updated = await apiUpdateNote(id, updates, rev, config);
          setData((prev) => {
            if (!prev.payload) return prev;
            return {
              ...prev,
              payload: {
                ...prev.payload,
                notes: (prev.payload.notes || []).map(n => n.id === id ? updated : n)
              }
            };
          });
          return updated;
        } catch (error) {
          if (error?.status === 409 || error?.message?.includes('timeout')) {
            setTick(t => t + 1);
          }
          throw error;
        }
      },

      /**
       * Crea una nota al servidor i la registra en memòria.
       *
       * PER QUÈ EL REGISTRE LOCAL NO ÉS OPCIONAL (P0 · 260908):
       * aquest proveïdor viu PER DAMUNT del Router (App.jsx › AppContent) i el
       * seu efecte de càrrega només depèn de `actorKey` i `config`. Navegar del
       * Xat a Notes no el desmunta ni el recarrega. Sense injectar la nota ací,
       * el Pont amb Notes escriuria correctament a Supabase i la secció Notes
       * continuaria pintant el llistat de la càrrega inicial. La nota existiria
       * i seria invisible fins a un remuntatge complet de l'aplicació.
       *
       * NO ES FA REFETCH: una segona volta a /rest/v1/notes és una petició de
       * xarxa sencera per a un resultat que ja tenim a la mà. Al bancal, amb
       * cobertura roïna, això és la diferència entre respondre i no respondre.
       */
      creaNota: async (nota = {}) => {
        const myConfig = config;
        const myActor = actorKey;
        const creada = await apiCreateNote(nota, config);
        
        // F04: Comprovar que no ha canviat el tenant/actor durant la creació pendent
        setData((prev) => {
          if (!prev.payload || myConfig.tenantId !== config.tenantId || myActor !== actorKey) return prev;
          return {
            ...prev,
            payload: { ...prev.payload, notes: [creada, ...(prev.payload.notes || [])] }
          };
        });
        return creada;
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

  return <NotesDataContext.Provider value={value}>{children}</NotesDataContext.Provider>;
}

export function useNotesData() {
  return useContext(NotesDataContext) || BUIT;
}
