<USER_REQUEST>
He llegit l’addenda sencera. **No he modificat fitxers ni executat codi de l’aplicació o proves.**

La correcció de P1-2 necessita també ampliar `loadNotes`: amb les primeres 50 notes, el Workspace no pot distingir «no carregada» de «inexistent». A continuació tens els blocs de substitució.

Dues precisions sobre el contracte:

- «No trobada» significa **absent de les fonts accessibles amb el tenant, propietari i permisos actuals**. El client no pot demostrar que una fila oculta per RLS no existeix físicament.
- L’addenda no inclou `backendPort.js` ni el component que munta `WorkspaceProvider`. La proposta utilitza l’operació existent `loadNotes(userId, config)`, afegint `config.noteId`. El port ha de transmetre aquesta opció i retornar els camps nous sense eliminar-los.

**1. P1-2 — Consulta per ID i completitud explícita**

En `src/data/supabase/notes.js`, substitueix **només `loadNotes`** per aquest bloc. Conserva els imports, `nota`, `createNote` i `updateNote`.

La consulta per ID comprova les tres fonts que ja alimenten la llista. Una resposta fallida mai es converteix en una absència.

```javascript
export async function loadNotes(
  ownerUserId = getDefaultUserId(),
  config = {}
) {
  const {
    runtimeDataMode,
    hasSupabaseConfig,
    tenantId
  } = getResolvedConfig(config);

  const requestedId = config.noteId == null
    ? null
    : String(config.noteId);

  if (requestedId === '') {
    throw new Error('Cal un ID de nota no buit.');
  }

  function buildResult(notes, noteFolders, notesComplete) {
    if (requestedId === null) {
      return { notes, noteFolders, notesComplete };
    }

    const matches = notes.filter(
      (note) => String(note.id) === requestedId
    );

    return {
      notes: matches,
      noteFolders,
      // Aquesta resposta conté un detall, no la llista completa.
      notesComplete: false,
      noteResolution: {
        id: requestedId,
        status: matches.length > 0 ? 'found' : 'not-found'
      }
    };
  }

  if (runtimeDataMode === 'seed') {
    const seed = await buildSeedAppData(ownerUserId);

    return buildResult(
      seed.notes || [],
      seed.noteFolders || [],
      true
    );
  }

  if (!hasSupabaseConfig) {
    throw new Error(
      'Falten credencials de Supabase per carregar les Notes.'
    );
  }

  const safeOwnerId = ownerUserId || getDefaultUserId();
  const tenant = encodeURIComponent(tenantId);
  const owner = encodeURIComponent(safeOwnerId);

  const noteFilter = requestedId === null
    ? ''
    : `&id=eq.${encodeURIComponent(requestedId)}`;

  const submissionFilter = requestedId === null
    ? ''
    : `&payload->>id=eq.${encodeURIComponent(requestedId)}`;

  const [contentRows, submissions, rows] = await Promise.all([
    request(
      `/rest/v1/app_content?select=key,payload,version`
        + `&key=in.(notes,noteFolders)&tenant_id=eq.${tenant}`,
      config,
      { signal: config.signal }
    ),
    request(
      `/rest/v1/section_submissions?select=*`
        + `&tenant_id=eq.${tenant}`
        + `&section_id=eq.notes`
        + submissionFilter
        + `&order=created_at.desc,id.desc&limit=50`,
      config,
      { signal: config.signal }
    ),
    request(
      `/rest/v1/notes?select=*`
        + `&tenant_id=eq.${tenant}`
        + `&owner_user_id=eq.${owner}`
        + noteFilter
        + `&order=updated_at.desc,id.desc&limit=50`,
      config,
      { signal: config.signal }
    )
  ]);

  // Un error de contracte no és una llista buida.
  if (
    !Array.isArray(contentRows)
    || !Array.isArray(submissions)
    || !Array.isArray(rows)
  ) {
    throw new Error('Resposta de Notes amb un format inesperat.');
  }

  const base = mapContentRowsToData(contentRows);
  const nativeNotes = rows.map(nota);
  const submittedNotes = submissions
    .map((submission) => submission.payload)
    .filter((note) => note && note.id != null);

  const notes = mergeById(
    mergeById(base.notes || [], nativeNotes),
    submittedNotes
  );

  // Sense recompte o cursor d'esgotament, no podem certificar que
  // les respostes paginades incloguen tota la col·lecció.
  return buildResult(notes, base.noteFolders || [], false);
}
```

`notesComplete: false` és deliberat: no deduïm completitud a partir d’una pàgina curta sense conéixer els límits efectius del servidor. La consulta exacta resol igualment els enllaços profunds.

Substitueix **tot `src/sections/notes/NotesDataContext.jsx`** per:

```jsx
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
        await import('../../host.js').then((module) =>
          module.quanLlest()
        );

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

        if (!isCurrent()) return;

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
        if (!isCurrent()) return;

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
```

En `src/components/universal/workspace/workspaceState.js`, afegeix aquest camp a l’objecte retornat per `createWorkspaceState`:

```javascript
selectionToken: null,
```

Substitueix **només el cas `selection/sync`**. El pendent d’una creació sobreviu a l’eco de la mateixa selecció; una navegació a un altre element el cancel·la.

```javascript
case 'selection/sync': {
  const hasItemId = action.itemId !== undefined;
  const selectionToken = action.selectionToken ?? null;

  const nextCategoryId = action.categoryId === undefined
    ? state.activeCategoryId
    : (
        action.categoryId == null
          ? ALL_CATEGORY_ID
          : String(action.categoryId)
      );

  const categoryChanged =
    nextCategoryId !== state.activeCategoryId;

  const nextItemId = hasItemId
    ? (action.itemId == null ? null : String(action.itemId))
    : (categoryChanged ? null : state.activeItemId);

  const nextNeedsInitialSelection = hasItemId
    ? false
    : (categoryChanged || state.needsInitialSelection);

  const nextPendingItemId =
    nextItemId !== null && nextItemId === state.pendingItemId
      ? state.pendingItemId
      : null;

  if (
    nextCategoryId === state.activeCategoryId
    && nextItemId === state.activeItemId
    && nextNeedsInitialSelection === state.needsInitialSelection
    && nextPendingItemId === state.pendingItemId
    && selectionToken === state.selectionToken
  ) {
    return state;
  }

  return {
    ...state,
    activeCategoryId: nextCategoryId,
    activeItemId: nextItemId,
    needsInitialSelection: nextNeedsInitialSelection,
    pendingItemId: nextPendingItemId,
    selectionToken
  };
}
```

En `src/components/universal/workspace/WorkspaceContext.jsx`:

1. Afegeix `useState` a l’import de React.
2. Canvia `items` per `items = []` en les propietats.
3. Afegeix aquestes propietats:

```javascript
itemsComplete = false,
resolveItemId,
resolutionKey = 0,
```

4. Substitueix **des de `const syncPending = useRef(false);` fins al final de l’efecte de reconciliació** pel bloc següent:

```javascript
const controlled = selection != null;
const selectedCategory = selection?.categoryId;
const selectedItemId = selection?.itemId;

const selectionToken = useMemo(() => (
  controlled
    ? {
        categoryId: selectedCategory,
        itemId: selectedItemId
      }
    : null
), [controlled, selectedCategory, selectedItemId]);

useEffect(() => {
  dispatch({
    type: 'selection/sync',
    categoryId: selectionToken?.categoryId,
    itemId: selectionToken?.itemId,
    selectionToken
  });
}, [selectionToken]);

// Barrera explícita: si la URL ha canviat, esperem que el reducer
// haja incorporat aquella versió abans de reconciliar.
const selectionIsSynced =
  state.selectionToken === selectionToken;

const missingId =
  state.activeItemId != null && !itemById.has(state.activeItemId)
    ? state.activeItemId
    : null;

const [resolutionAttempt, setResolutionAttempt] = useState(0);
const [resolution, setResolution] = useState(null);

const retryItemResolution = useCallback(() => {
  setResolutionAttempt((value) => value + 1);
}, []);

const requestKey = useMemo(() => ({}), [
  missingId,
  resolveItemId,
  resolutionKey,
  resolutionAttempt,
  selectionToken,
  selectionIsSynced,
  status,
  itemsComplete,
  state.pendingItemId
]);

useEffect(() => {
  if (
    !selectionIsSynced
    || status !== 'ready'
    || missingId === null
  ) {
    return;
  }

  // Una llista completa pot demostrar absència, però no invalida
  // una creació pendent d'aparéixer en les propietats del Workspace.
  if (itemsComplete && state.pendingItemId === null) {
    return;
  }

  if (typeof resolveItemId !== 'function') {
    setResolution({
      key: requestKey,
      id: missingId,
      status: 'error',
      error: new Error(
        'La llista és parcial o té una creació pendent, '
        + 'però no disposa de resolució per ID.'
      )
    });
    return;
  }

  const controller = new AbortController();

  setResolution({
    key: requestKey,
    id: missingId,
    status: 'loading',
    error: null
  });

  async function resolve() {
    try {
      const result = await resolveItemId(missingId, {
        signal: controller.signal
      });

      if (controller.signal.aborted) return;

      if (!['found', 'not-found'].includes(result?.status)) {
        throw new Error('Resultat de resolució per ID no vàlid.');
      }

      setResolution({
        key: requestKey,
        id: missingId,
        status: result.status,
        error: null
      });
    } catch (error) {
      if (controller.signal.aborted) return;

      setResolution({
        key: requestKey,
        id: missingId,
        status: 'error',
        error
      });
    }
  }

  void resolve();
  return () => controller.abort();
}, [
  requestKey,
  selectionIsSynced,
  status,
  missingId,
  itemsComplete,
  state.pendingItemId,
  resolveItemId
]);

const itemResolution = useMemo(() => {
  if (missingId === null) {
    return { id: null, status: 'idle', error: null };
  }

  if (
    selectionIsSynced
    && status === 'ready'
    && itemsComplete
    && state.pendingItemId === null
  ) {
    return { id: missingId, status: 'not-found', error: null };
  }

  if (resolution?.key === requestKey) {
    return {
      id: resolution.id,
      status: resolution.status,
      error: resolution.error
    };
  }

  return { id: missingId, status: 'loading', error: null };
}, [
  missingId,
  selectionIsSynced,
  status,
  itemsComplete,
  state.pendingItemId,
  resolution,
  requestKey
]);

useEffect(() => {
  if (status !== 'ready' || !selectionIsSynced) return;

  let categoryId = state.activeCategoryId;

  if (
    categoryId !== ALL_CATEGORY_ID
    && !categoryById.has(categoryId)
  ) {
    categoryId = normalizedCategories[0]?.id ?? ALL_CATEGORY_ID;
  }

  let itemId = state.activeItemId;

  const firstItemId = () => normalizedItems.find((item) =>
    categoryId === ALL_CATEGORY_ID
    || item.categoryIds.includes(categoryId)
  )?.id ?? null;

  if (itemId !== null && !itemById.has(itemId)) {
    // Error, càrrega i "found però encara no injectat" conserven
    // l'ID. Cap d'aquests estats autoritza el fallback.
    if (itemResolution.status !== 'not-found') return;
    itemId = firstItemId();
  } else if (state.needsInitialSelection && itemId === null) {
    itemId = firstItemId();

    // Una pàgina buida parcial no tanca la selecció inicial.
    if (itemId === null && !itemsComplete) return;
  }

  const selectedItem = itemId === null
    ? null
    : itemById.get(itemId);

  if (
    selectedItem
    && categoryId !== ALL_CATEGORY_ID
    && !selectedItem.categoryIds.includes(categoryId)
  ) {
    categoryId = selectedItem.categoryIds.find(
      (id) => categoryById.has(id)
    ) ?? ALL_CATEGORY_ID;
  }

  const selectionChanged =
    categoryId !== state.activeCategoryId
    || itemId !== state.activeItemId;

  if (
    selectionChanged
    || state.needsInitialSelection
    || state.pendingItemId !== null
  ) {
    dispatch({
      type: 'selection/reconcile',
      categoryId,
      itemId,
      pendingItemId: null
    });

    if (selectionChanged || state.needsInitialSelection) {
      emitSelection({ categoryId, itemId }, 'reconcile');
    }
  }
}, [
  status,
  selectionIsSynced,
  categoryById,
  normalizedCategories,
  normalizedItems,
  itemById,
  itemsComplete,
  itemResolution.status,
  state.activeCategoryId,
  state.activeItemId,
  state.needsInitialSelection,
  state.pendingItemId,
  emitSelection
]);
```

5. Afegeix al `value` del context aquestes dues propietats, i també a les dependències del seu `useMemo`:

```javascript
itemResolution,
retryItemResolution,
```

La connexió amb Notes és obligatòria. En el component que ja obté `useNotesData()`, extrau també:

```javascript
const {
  notesComplete,
  resolveNote,
  workspaceKey
} = useNotesData();
```

Afig aquestes propietats al `WorkspaceProvider` existent, conservant les altres:

```jsx
key={workspaceKey}
itemsComplete={notesComplete}
resolveItemId={resolveNote}
```

Els Workspaces amb col·leccions locals exhaustives han de passar `itemsComplete={true}`. En Notes, `items` ha de continuar derivant de **totes les notes del context**, inclosa la que acaba d’incorporar `resolveNote`; els filtres visuals continuen dins del Workspace.

Per mostrar un error de resolució i permetre reintentar-lo, aquest component es pot inserir dins del proveïdor:

```jsx
function WorkspaceResolutionError() {
  const {
    itemResolution,
    retryItemResolution
  } = useWorkspace();

  if (itemResolution.status !== 'error') return null;

  return (
    <div role="alert">
      <p>No s’ha pogut carregar l’element seleccionat.</p>
      <button type="button" onClick={retryItemResolution}>
        Torna-ho a provar
      </button>
    </div>
  );
}
```

**2. P2-6 — Resolució observable i cancel·lació**

Substitueix **tot `src/hooks/useResolvedAsset.js`**. El nou `useResolvedAssetState` exposa el resultat complet. `useResolvedAsset` conserva el retorn `string`, de manera que els consumidors no inclosos en l’addenda continuen funcionant.

La cancel·lació descarta sempre resultats obsolets. La cancel·lació física de xarxa requereix que el resolutor accepte i transmeta `signal`; el contracte adjunt de `backendPort` no permet verificar-ho. Per això el resolutor existent es crida amb la seua signatura coneguda, i el hook admet un resolutor cancel·lable explícit.

```javascript
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import {
  resolveAsset as resolveAssetSync
} from '../config/assetResolver.js';

import {
  resolveAsset as resolveAssetAsync,
  teCapacitat
} from '../data/backendPort.js';

// Conserva la signatura coneguda del port.
// Un resolutor alternatiu pot acceptar (ref, { signal }).
const defaultResolver = (ref) => resolveAssetAsync(ref);

export function useResolvedAssetState(
  assetRef,
  { scopeKey = '', resolver = defaultResolver } = {}
) {
  const ref = typeof assetRef === 'string' ? assetRef.trim() : '';
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  const activeRequest = useRef(null);

  const key = useMemo(
    () => ({}),
    [ref, scopeKey, resolver, attempt]
  );

  const retry = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  const cancel = useCallback(() => {
    const request = activeRequest.current;
    if (!request || request.key !== key || request.finished) return;

    request.controller.abort();

    setResult({
      key,
      status: 'cancelled',
      url: '',
      error: null
    });
  }, [key]);

  useEffect(() => {
    const controller = new AbortController();
    const request = { key, controller, finished: false };
    activeRequest.current = request;

    const publish = (status, url = '', error = null) => {
      if (
        controller.signal.aborted
        || activeRequest.current !== request
      ) {
        return;
      }

      request.finished = status !== 'loading';
      setResult({ key, status, url, error });
    };

    async function resolve() {
      if (!ref) {
        publish('idle');
        return;
      }

      publish('loading');

      try {
        let value;

        if (ref.startsWith('sdp-media://')) {
          if (!teCapacitat('mitjans')) {
            publish('unsupported');
            return;
          }

          value = await resolver(ref, {
            signal: controller.signal
          });
        } else {
          value = resolveAssetSync(ref);
        }

        if (value != null && typeof value !== 'string') {
          throw new TypeError(
            'El resolutor de recursos ha de retornar una URL o null.'
          );
        }

        const url = value?.trim() || '';
        publish(url ? 'ready' : 'missing', url);
      } catch (error) {
        if (controller.signal.aborted) return;

        publish(
          error?.name === 'AbortError' ? 'cancelled' : 'error',
          '',
          error
        );
      }
    }

    void resolve();

    return () => {
      controller.abort();

      if (activeRequest.current === request) {
        activeRequest.current = null;
      }
    };
  }, [key, ref, resolver]);

  // Evita exposar la URL de l'actiu anterior durant el render
  // que precedeix l'execució del nou efecte.
  const current = result?.key === key
    ? result
    : {
        status: ref ? 'loading' : 'idle',
        url: '',
        error: null
      };

  return {
    status: current.status,
    url: current.url,
    error: current.error,
    isLoading: current.status === 'loading',
    retry,
    cancel
  };
}

// Compatibilitat amb els consumidors que esperen una string.
export function useResolvedAsset(assetRef, options) {
  return useResolvedAssetState(assetRef, options).url;
}
```

Substitueix **tot `src/components/universal/workspace/ItemMedia.jsx`**:

```jsx
import React, { useState } from 'react';
import {
  useResolvedAssetState
} from '../../../hooks/useResolvedAsset.js';

function ResolvedImage({ src, fallback }) {
  const [failed, setFailed] = useState(false);

  if (failed) return fallback;

  return (
    <img
      className="sdp-gestor-fitxa__imatge"
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export function ItemMedia({
  item,
  titleFallback,
  className = '',
  assetScopeKey = ''
}) {
  const assetRef = typeof item?.image === 'string'
    ? item.image.trim()
    : '';

  const { url, status } = useResolvedAssetState(assetRef, {
    scopeKey: assetScopeKey
  });

  const Icon = item?.icon;

  const title =
    String(item?.title ?? '').trim()
    || String(titleFallback ?? '').trim()
    || '?';

  const initial = Array.from(title)[0].toLocaleUpperCase('ca');

  const fallback = Icon ? (
    <Icon size={24} className="sdp-gestor-fitxa__icona" />
  ) : (
    <span className="sdp-gestor-fitxa__inicial">
      {initial}
    </span>
  );

  return (
    <span
      className={`sdp-gestor-fitxa__media ${className}`.trim()}
      aria-hidden="true"
      data-asset-status={status}
      style={{ background: 'var(--sdp-fons-subtil)' }}
    >
      {status === 'ready' && url ? (
        <ResolvedImage
          key={JSON.stringify([assetScopeKey, assetRef, url])}
          src={url}
          fallback={fallback}
        />
      ) : fallback}
    </span>
  );
}
```

La `key` reinicia l’error d’imatge quan canvia el recurs. Per a recursos privats en components que sobreviuen a un canvi de sessió, passa una clau d’àmbit que incloga tenant, actor i generació de sessió mitjançant `assetScopeKey` —o `scopeKey` si utilitzen directament el hook.

**3. P2-7 — Mesura després del commit i persistència fora dels updaters**

En `src/components/layout/AppGridShell.jsx`, afegeix `useEffect` a l’import de React.

Substitueix **des de `const pageRef = useRef(null);` fins just abans de `const toggleLeft = ...`** per:

```javascript
const pageRef = useRef(null);
const widthsRef = useRef(columnWidths);
const midaRef = useRef(mida);
const collapsedRef = useRef({
  left: leftCollapsed,
  middle: middleCollapsed
});
const measureRef = useRef(null);
const lastPersistedRef = useRef(columnWidths);

// Aquest efecte corre després que React haja aplicat les classes
// de plec al DOM i abans de mesurar.
useLayoutEffect(() => {
  widthsRef.current = columnWidths;
  midaRef.current = mida;
  collapsedRef.current = {
    left: leftCollapsed,
    middle: middleCollapsed
  };

  const page = pageRef.current;
  if (!page) return;

  page.style.setProperty(
    '--app-grid-col-sidebar',
    `${columnWidths.left}px`
  );

  page.style.setProperty(
    '--app-grid-col-list',
    `${columnWidths.middle}px`
  );
}, [columnWidths, mida, leftCollapsed, middleCollapsed]);

useLayoutEffect(() => {
  const page = pageRef.current;
  if (!page) return;

  const measure = () => {
    const width = page.clientWidth;
    if (width <= 0) return;

    const widths = widthsRef.current;
    const collapsed = collapsedRef.current;

    const actualLeft = collapsed.left ? 56 : widths.left;
    const actualMiddle = collapsed.middle ? 56 : widths.middle;

    const resizerCount =
      Number(!collapsed.left) + Number(!collapsed.middle);

    const minWide = Math.max(
      1090,
      actualLeft
        + actualMiddle
        + RIGHT_COLUMN_MIN
        + RESIZER_WIDTH * resizerCount
    );

    const nextSize = width < 720
      ? 'estret'
      : width < minWide
        ? 'mitja'
        : 'ample';

    const previousSize = midaRef.current;
    if (previousSize === nextSize) return;

    // Evita repetir la transició entre callbacks de l'observador
    // mentre React encara està processant l'actualització.
    midaRef.current = nextSize;
    setMida(nextSize);

    if (
      nextSize === 'ample'
      || (nextSize === 'estret' && previousSize === 'ample')
    ) {
      setPanellObert(null);
    }
  };

  measureRef.current = measure;
  measure();

  const observer = new ResizeObserver(measure);
  observer.observe(page);

  return () => {
    observer.disconnect();

    if (measureRef.current === measure) {
      measureRef.current = null;
    }
  };
}, []);

// El plec pot canviar sense canviar l'amplada del contenidor.
// Per això ResizeObserver, tot sol, no és suficient.
useLayoutEffect(() => {
  measureRef.current?.();
}, [columnWidths, leftCollapsed, middleCollapsed]);

// Només persistim amplades que ja han arribat a un commit.
// Cap efecte lateral dins de setColumnWidths.
useEffect(() => {
  const previous = lastPersistedRef.current;

  if (
    previous.left === columnWidths.left
    && previous.middle === columnWidths.middle
  ) {
    return;
  }

  try {
    setVal('sdp-grid-widths', {
      left: columnWidths.left,
      middle: columnWidths.middle
    });

    lastPersistedRef.current = columnWidths;
  } catch (error) {
    console.warn(
      '[AppGridShell] No s’han pogut guardar les amplades.',
      error
    );
  }
}, [columnWidths]);
```

Conserve el llindar mínim existent de `1090px`: la correcció no redefineix els breakpoints del producte.

Substitueix **`resizeColumn` i `applyPreset`** per:

```javascript
const resizeColumn = useCallback((column, requestedWidth) => {
  if (!Object.prototype.hasOwnProperty.call(COLUMN_LIMITS, column)) {
    return;
  }

  const requested = Number(requestedWidth);
  if (!Number.isFinite(requested)) return;

  const containerWidth = pageRef.current?.clientWidth || 0;
  if (containerWidth <= 0) return;

  const collapsed = { ...collapsedRef.current };
  if (collapsed[column]) return;

  setColumnWidths((current) => {
    const otherColumn = column === 'left' ? 'middle' : 'left';

    const otherWidth = collapsed[otherColumn]
      ? 56
      : current[otherColumn];

    const resizerCount =
      Number(!collapsed.left) + Number(!collapsed.middle);

    const availableMax =
      containerWidth
      - otherWidth
      - RIGHT_COLUMN_MIN
      - RESIZER_WIDTH * resizerCount;

    const limits = COLUMN_LIMITS[column];

    const max = Math.max(
      limits.min,
      Math.min(limits.max, Math.floor(availableMax))
    );

    const nextWidth = clamp(
      Math.round(requested),
      limits.min,
      max
    );

    return nextWidth === current[column]
      ? current
      : { ...current, [column]: nextWidth };
  });
}, []);

const applyPreset = useCallback((presetName) => {
  if (!Object.prototype.hasOwnProperty.call(PRESETS, presetName)) {
    return;
  }

  const preset = PRESETS[presetName];

  setColumnWidths((current) => (
    current.left === preset.left
    && current.middle === preset.middle
      ? current
      : { left: preset.left, middle: preset.middle }
  ));
}, []);
```

El JSX restant es conserva. Les amplades desplegades continuen guardades encara que una columna es plegue; el plec continua controlat per les propietats del component.

**Nota i veredicte**

**9/10 provisional per la proposta de remediació; encara no un 10/10 verificat de producció.** És una valoració del disseny proposat, assumint les altres quatre correccions, no una puntuació obtinguda executant l’aplicació.

Per tancar les set troballes cal comprovar la transmissió del contracte per `backendPort`, la connexió real del Workspace i aquests casos:

- ID existent fora de la primera pàgina: s’obri sense fallback.
- ID absent: fallback després de la resposta autoritativa.
- Error de xarxa: conserva l’ID i permet reintentar.
- Navegació A → B i canvi de sessió: les respostes antigues no s’apliquen.
- Recurs canviat, cancel·lat o trencat: no mostra la imatge anterior.
- Plec, desplegament i redimensionament en Strict Mode: recàlcul correcte i persistència de l’estat confirmat.

La cancel·lació física de recursos també queda condicionada al suport de `signal` del port. Sense veure eixe contracte ni executar aquestes comprovacions, qualificar-ho de «10/10 definitiu» seria afirmar més del que acredita l’addenda.
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-09-21T03:25:32+02:00.

The user's current state is as follows:
Active Document: /Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/04_escriptori/260921_0315_ADDENDA_Codex.md (LANGUAGE_MARKDOWN)
Cursor is on line: 1
Other open documents:
- /Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/04_escriptori/260921_0245_PROMPT_Auditoria_Extrema_Verificacio.md (LANGUAGE_MARKDOWN)
- /Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/04_escriptori/260921_0215_PROMPT_auditoria_extrema_workspace.md (LANGUAGE_MARKDOWN)
- /Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/04_escriptori/260920_2015_PROMPT_Universal_Workspace_Refinament.md (LANGUAGE_MARKDOWN)
- /Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/_wiki_de_poble/04_escriptori/260920_1945_PROMPT_Universal_Workspace_UI.md (LANGUAGE_MARKDOWN)
- /Users/javillinares/Documents/Antigravity/Som de Poble/socdepoble.org/.agents/ESTAT.md (LANGUAGE_MARKDOWN)
</ADDITIONAL_METADATA>