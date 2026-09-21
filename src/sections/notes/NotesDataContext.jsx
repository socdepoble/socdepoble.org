import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import {
  loadNotes,
  updateNote as apiUpdateNote,
  createNote as apiCreateNote,
  getCurrentUser
} from '../../data/backendPort.js';

import { useIdentitat } from '../../app/contexts/IdentitatContext.jsx';
import { useSession } from '../../app/contexts/SessionContext.jsx';

let _hostPromise = null;
import { useRecarregaExterna } from '../../app/contexts/useRecarregaExterna.jsx';
import { getDraftsForScope } from './GlobalSaveManager.js';

const NotesDataContext = createContext(null);

const unavailable = async () => {
  throw new Error('El bloc de notes encara no està disponible.');
};

const BUIT = {
  status: 'loading',
  error: null,
  scopeKey: null,
  workspaceKey: null,
  notes: [],
  noteFolders: [],
  notesComplete: false,
  resolveNote: unavailable,
  updateNote: unavailable,
  creaNota: unavailable,
  refresh: () => {}
};

function abortError() {
  return new DOMException('Operació cancel·lada.', 'AbortError');
}

function applyDraft(note, drafts) {
  const draft = drafts?.[note.id];
  if (!draft) return note;

  if (
    draft._draftTimestamp
    && note.updatedAt
    && draft._draftTimestamp < new Date(note.updatedAt).getTime()
  ) {
    return note;
  }

  const { _draftTimestamp, ...changes } = draft;
  return { ...note, ...changes };
}

function mergeNotes(current, incoming) {
  const remaining = new Map(
    current.map((note) => [String(note.id), note])
  );

  const merged = incoming.map((remote) => {
    const id = String(remote.id);
    const local = remaining.get(id);
    remaining.delete(id);

    return local && local.revision > remote.revision
      ? local
      : remote;
  });

  return [...merged, ...remaining.values()];
}

export function NotesDataProvider({ children, config }) {
  const { actorKey } = useIdentitat();
  const { generacio } = useSession();

  // Conservem la clau existent d'IndexedDB.
  const scopeKey =
    `${config?.backendId || 'supabase'}_${actorKey}_`
    + `${config?.tenantId || 'global'}`;

  const workspaceKey = JSON.stringify([scopeKey, generacio]);

  // Una resposta antiga no pot entrar en una sessió nova,
  // encara que després tornem al mateix tenant i actor.
  const token = useMemo(
    () => ({}),
    [scopeKey, generacio, config]
  );

  const operationRef = useRef(null);
  const loadGen = useRef(0);
  const [tick, setTick] = useState(0);

  const [data, setData] = useState({
    token: null,
    status: 'loading',
    error: null,
    payload: null
  });

  useLayoutEffect(() => {
    const operation = { token };
    operationRef.current = operation;

    return () => {
      if (operationRef.current === operation) {
        operationRef.current = null;
      }
    };
  }, [token]);

  useEffect(() => {
    const operation = operationRef.current;
    const generation = ++loadGen.current;
    const controller = new AbortController();

    const isCurrent = () =>
      !controller.signal.aborted
      && operationRef.current === operation
      && generation === loadGen.current;

    setData((previous) => ({
      token,
      status: previous.token === token && previous.payload
        ? 'revalidating'
        : 'loading',
      error: null,
      payload: previous.token === token ? previous.payload : null
    }));

    async function load() {
      try {
        if (!_hostPromise) _hostPromise = import('../../host.js');
        const hostModule = await _hostPromise;
        const quanLlestFn = hostModule.quanLlest || (hostModule.default && hostModule.default.quanLlest);
        await quanLlestFn();

        if (!isCurrent()) return;

        const userId = getCurrentUser()?.id;
        if (!userId) {
          throw new Error('Cal iniciar sessió per carregar les Notes.');
        }

        const [payload, drafts] = await Promise.all([
          loadNotes(userId, {
            ...config,
            signal: controller.signal
          }),
          getDraftsForScope(scopeKey)
        ]);

        if (!isCurrent()) { return; }

        if (!Array.isArray(payload?.notes)) {
          throw new Error('Resposta de Notes amb un format inesperat.');
        }

        const incoming = payload.notes.map((note) =>
          applyDraft(note, drafts)
        );

        setData((previous) => {
          if (!isCurrent() || previous.token !== token) {
            return previous;
          }

          return {
            token,
            status: 'ready',
            error: null,
            payload: {
              ...payload,
              notes: mergeNotes(
                previous.payload?.notes || [],
                incoming
              )
            }
          };
        });
      } catch (error) { 
        console.error("LOAD ERROR", error);
        if (!isCurrent()) { return; }

        setData((previous) => previous.token === token
          ? { ...previous, status: 'error', error }
          : previous
        );
      }
    }

    void load();
    return () => controller.abort();
  }, [token, tick, config, scopeKey]);

  const refresh = useCallback(() => {
    if (operationRef.current?.token !== token) return;

    setData((previous) => previous.token === token
      ? {
          ...previous,
          status: previous.payload ? 'revalidating' : 'loading',
          error: null
        }
      : previous
    );

    setTick((value) => value + 1);
  }, [token]);

  const resolveNote = useCallback(async (id, { signal } = {}) => {
    const requestedId = String(id);
    const operation = operationRef.current;

    const assertCurrent = () => {
      if (
        signal?.aborted
        || !operation
        || operation.token !== token
        || operationRef.current !== operation
      ) {
        throw abortError();
      }
    };

    assertCurrent();

    await import('../../host.js').then((module) =>
      module.quanLlest()
    );

    assertCurrent();

    const userId = getCurrentUser()?.id; 
    if (!userId) {
      throw new Error('Cal iniciar sessió per resoldre la nota.');
    }

    const payload = await loadNotes(userId, {
      ...config,
      noteId: requestedId,
      signal
    });

    assertCurrent();

    const resolution = payload?.noteResolution;

    if (
      resolution?.id !== requestedId
      || !['found', 'not-found'].includes(resolution.status)
      || !Array.isArray(payload.notes)
    ) {
      throw new Error(
        'El backend no implementa el contracte de resolució per ID.'
      );
    }

    const remoteNote = payload.notes.find(
      (note) => String(note.id) === requestedId
    );

    if (resolution.status === 'not-found') {
      if (remoteNote) {
        throw new Error('Resposta contradictòria en resoldre la nota.');
      }

      return { status: 'not-found' };
    }

    if (!remoteNote) {
      throw new Error('El backend declara una nota que no ha retornat.');
    }

    const drafts = await getDraftsForScope(scopeKey);
    assertCurrent();

    const note = applyDraft(remoteNote, drafts);

    setData((previous) => {
      if (
        signal?.aborted
        || operationRef.current !== operation
        || previous.token !== token
      ) {
        return previous;
      }

      return {
        ...previous,
        payload: {
          ...(previous.payload || {}),
          notes: mergeNotes(
            previous.payload?.notes || [],
            [note]
          )
        }
      };
    });

    // El Workspace espera que l'adaptador transforme aquesta nota
    // i la incorpore a `items`; no selecciona el primer element mentrestant.
    return { status: 'found' };
  }, [config, scopeKey, token]);

  const updateNote = useCallback(async (id, updates, revision) => {
    const operation = operationRef.current;

    if (!operation || operation.token !== token) {
      throw abortError();
    }

    try {
      const updated = await apiUpdateNote(
        id, updates, revision, config
      );

      if (operationRef.current === operation) {
        setData((previous) => {
          if (
            operationRef.current !== operation
            || previous.token !== token
            || !previous.payload
          ) {
            return previous;
          }

          return {
            ...previous,
            payload: {
              ...previous.payload,
              notes: previous.payload.notes.map((note) =>
                String(note.id) === String(id) ? updated : note
              )
            }
          };
        });
      }

      return updated;
    } catch (error) { 
      if (
        operationRef.current === operation
        && (
          error?.status === 409
          || error?.message?.includes('timeout')
        )
      ) {
        refresh();
      }

      throw error;
    }
  }, [config, token, refresh]);

  const creaNota = useCallback(async (input = {}) => {
    const operation = operationRef.current;

    if (!operation || operation.token !== token) {
      throw abortError();
    }

    const created = await apiCreateNote(input, config);

    if (operationRef.current === operation) {
      setData((previous) => {
        if (
          operationRef.current !== operation
          || previous.token !== token
        ) {
          return previous;
        }

        return {
          ...previous,
          payload: {
            ...(previous.payload || {}),
            notes: [
              created,
              ...(previous.payload?.notes || []).filter(
                (note) => String(note.id) !== String(created.id)
              )
            ]
          }
        };
      });
    }

    return created;
  }, [config, token]);

  useRecarregaExterna(refresh);

  const value = useMemo(() => {
    const current = data.token === token;
    const payload = current ? data.payload : null;

    return {
      status: current ? data.status : 'loading',
      error: current ? data.error : null,
      scopeKey,
      workspaceKey,
      notes: payload?.notes || [],
      noteFolders: payload?.noteFolders || [],
      notesComplete:
        current
        && data.status === 'ready'
        && payload?.notesComplete === true,
      resolveNote,
      updateNote,
      creaNota,
      refresh
    };
  }, [
    data, token, scopeKey, workspaceKey,
    resolveNote, updateNote, creaNota, refresh
  ]);

  return (
    <NotesDataContext.Provider value={value}>
      {children}
    </NotesDataContext.Provider>
  );
}

export function useNotesData() {
  return useContext(NotesDataContext) || BUIT;
}