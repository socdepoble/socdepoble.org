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
  getCurrentUser,
  getDefaultUserId,
  getRuntimeDataMode
} from '../../data/backendPort.js';

import { backendScope } from '../../config/backendConfig.js';
import { useIdentitat } from '../../app/contexts/IdentitatContext.jsx';
import { useSession } from '../../app/contexts/SessionContext.jsx';

let _hostPromise = null;
function assegurarHost(signal) {
  if (!_hostPromise) {
    _hostPromise = import('../../host.js').catch(err => {
      _hostPromise = null;
      throw err;
    });
  }
  return _hostPromise.then(hostModule => {
    const quanLlestFn = hostModule.quanLlest || (hostModule.default && hostModule.default.quanLlest);
    return quanLlestFn({ signal }).then(() => hostModule);
  });
}
import { useRecarregaExterna } from '../../app/contexts/useRecarregaExterna.jsx';
import { getDraftsForScope, draftFields } from './GlobalSaveManager.js';

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
  activate: () => () => {},
  refresh: () => {}
};

function abortError() {
  return new DOMException('Operació cancel·lada.', 'AbortError');
}

function applyDraft(note, drafts) {
  const draft = drafts?.[note.id];
  if (!draft) return note;

  const fields = draftFields(draft);
  // D01 · Un esborrany començat sobre una revisió anterior no es fusiona en
  // silenci: es mostra (és feina de la persona), però marcat, perquè la UI
  // demane una decisió explícita abans de sobreescriure res. Els esborranys
  // antics sense _baseRevision prenen la remota com a base: cap conflicte nou.
  const base = Number(draft._baseRevision ?? note.revision ?? 0);
  const remota = Number(note.revision ?? 0);
  if (Object.keys(fields).length && base < remota) {
    return { ...note, ...fields, draftConflict: { baseRevision: base, remoteRevision: remota } };
  }
  return { ...note, ...fields };
}

function mergeNotes(current, incoming, complete = false) {
  const remaining = new Map(
    current.map((note) => [String(note.id), note])
  );

  const merged = incoming.map((remote) => {
    const id = String(remote.id);
    const local = remaining.get(id);
    remaining.delete(id);

    if (local && local.revision > remote.revision) return local;
    // Una pàgina de resums no elimina un detall de la mateixa revisió.
    if (local && local.revision === remote.revision && remote.contentLoaded === false
        && local.contentLoaded !== false) return { ...remote, content: local.content, contentLoaded: true };
    return remote;
  });

  return complete ? merged : [...merged, ...remaining.values()];
}

export function NotesDataProvider({ children, config }) {
  const { actorKey } = useIdentitat();
  const { generacio, estat, currentUser } = useSession();

  // Preserve personal draft keys; shared entity actors also need the auth user.
  const draftActor = actorKey === `persona::${currentUser?.id}`
    ? actorKey : `${currentUser?.id || 'anonymous'}_${actorKey}`;
  const scopeKey =
    `${backendScope(config)}_${draftActor}_`
    + `${config?.tenantId || 'global'}`;

  const workspaceKey = JSON.stringify([scopeKey, generacio]);

  // Una resposta antiga no pot entrar en una sessió nova,
  // encara que després tornem al mateix tenant i actor.
  const token = useMemo(
    () => ({ scopeKey, generacio, config }),
    [scopeKey, generacio, config]
  );

  const operationRef = useRef(null);
  const loadGen = useRef(0);
  const [tick, setTick] = useState(0);
  const [consumers, setConsumers] = useState(0);
  const activate = useCallback(() => {
    setConsumers(value => value + 1);
    return () => setConsumers(value => value - 1);
  }, []);

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
      if (estat === 'comprovant') return; // wait until resolved

      try {
        await assegurarHost(controller.signal);

        if (!isCurrent()) return;

        // El cami `seed` serveix contingut d'exemple sense mirar la sessio.
        // El guarda d'aci baix nomes te sentit quan les dades son remotes.
        const ownerId = getCurrentUser()?.id
          || (getRuntimeDataMode(config) !== 'remote' ? getDefaultUserId() : null);
        if (!ownerId) {
          setData((previous) => {
            if (!isCurrent() || previous.token !== token) return previous;
            return {
              token,
              status: 'ready',
              error: null,
              payload: { notes: [], noteFolders: [], notesComplete: true }
            };
          });
          return;
        }

        const drafts = await getDraftsForScope(scopeKey);
        if (!isCurrent()) return;
        let cursor = null;
        let collected = [];
        const seen = new Set();
        // Pressupost de recorregut: 1.024 pàgines, mai un bucle sense final.
        for (let pageNumber = 0; pageNumber < 1024; pageNumber++) {
          const payload = await loadNotes(ownerId, {
            ...config, ...(cursor === null ? {} : { cursor }), signal: controller.signal
          });
          if (!isCurrent()) return;
          if (!Array.isArray(payload?.notes)) throw new Error('Resposta de Notes amb un format inesperat.');
          collected = mergeNotes(collected, payload.notes.map(note => applyDraft(note, drafts)));
          setData(previous => {
            if (!isCurrent() || previous.token !== token) return previous;
            return { token, status: 'ready', error: null, payload: {
              ...payload,
              notes: mergeNotes(previous.payload?.notes || [], collected, payload.notesComplete === true)
            } };
          });
          if (payload.notesComplete === true || payload.nextCursor == null || !consumers) return;
          if (seen.has(payload.nextCursor)) throw new Error('El cursor de Notes no avança.');
          seen.add(payload.nextCursor);
          cursor = payload.nextCursor;
        }
        throw new Error('S’ha arribat al límit de pàgines de Notes; cal acotar la consulta.');

      } catch (error) {
        // Una càrrega cancel·lada (doble muntatge de StrictMode, canvi d'àmbit) no és cap error.
        if (error?.name === 'AbortError') return;
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
  }, [token, tick, config, scopeKey, estat, consumers]);

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

    await assegurarHost(signal);

    assertCurrent();

    const userId = getCurrentUser()?.id || (getRuntimeDataMode(config) !== 'remote' ? getDefaultUserId() : null);
    if (!userId) {
      return { status: 'not-found' };
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

      if (operationRef.current !== operation) throw abortError();
      return updated;
    } catch (error) { 
      if (
        operationRef.current === operation
        && (
          error?.status === 409
          || error?.name === 'TimeoutError'
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

    if (operationRef.current !== operation) throw abortError();
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
      config,
      canCreate: (Boolean(currentUser?.id) || config?.dataMode === 'seed' || config?.dataMode === 'local') && current && data.status === 'ready',
      notes: payload?.notes || [],
      noteFolders: payload?.noteFolders || [],
      notesComplete:
        current
        && data.status === 'ready'
        && payload?.notesComplete === true,
      activate,
      resolveNote,
      updateNote,
      creaNota,
      refresh
    };
  }, [
    data, token, scopeKey, workspaceKey, config, currentUser,
    resolveNote, updateNote, creaNota, refresh, activate
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
