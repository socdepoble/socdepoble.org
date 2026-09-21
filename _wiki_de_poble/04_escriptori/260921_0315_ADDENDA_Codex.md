A continuació et facilite el contingut exacte dels fitxers que has sol·licitat, en el seu estat actual:

### src/sections/notes/NotesDataContext.jsx
```javascript
import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import { loadNotes, updateNote as apiUpdateNote, createNote as apiCreateNote, getCurrentUser } from '../../data/backendPort.js';
import { useIdentitat } from '../../app/contexts/IdentitatContext.jsx';
import { getDraftsForScope } from './GlobalSaveManager.js';

import { useRecarregaExterna } from '../../app/contexts/useRecarregaExterna.jsx';

import { useSession } from '../../app/contexts/SessionContext.jsx';

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
  const { generacio } = useSession();
  const scopeKey = `${config?.backendId || 'supabase'}_${actorKey}_${config?.tenantId || 'global'}`;
  
  const [data, setData] = useState({ status: 'loading', error: null, payload: null, scopeKey });
  const [tick, setTick] = useState(0);
  const loadGen = useRef(0);

  useEffect(() => {
    let active = true;
    const myGen = ++loadGen.current;
    const controller = new AbortController();

    // F06: Adoptar explícitament el nou scope al començar la càrrega
    setData(prev => {
      if (prev.scopeKey === scopeKey) {
        if (prev.status === 'loading' || prev.status === 'revalidating') return prev;
        return { ...prev, status: 'loading', error: null };
      }
      // Neteja aïllada: si canvia el tenant/usuari, esborrem el payload anterior de la memòria per no barrejar esborranys.
      // Els esborranys pendents queden en la cua persistent d'IndexedDB (si està activada).
      return { status: 'loading', scopeKey, error: null, payload: null };
    });

    async function load() {
      try {
        let userId = null;
        try { userId = getCurrentUser()?.id; } catch { /* Sollutia pot no implementar-ho */ }
        if (!userId) {
          if (!active || myGen !== loadGen.current) return;
          setData(prev => prev.scopeKey === scopeKey ? { status: 'ready', error: null, payload: { notes: [], noteFolders: [] }, scopeKey } : prev);
          return;
        }
        await import('../../host.js').then(m => m.quanLlest());
        
        const [payload, persistentDrafts] = await Promise.all([
          loadNotes(userId, { ...config, signal: controller.signal }),
          getDraftsForScope(scopeKey)
        ]);

        if (!active || myGen !== loadGen.current) return;
        
        setData(prev => {
          if (prev.scopeKey !== scopeKey) return prev; // old fetch
          
          let newNotes = payload.notes;
          // F13: Fusió intel·ligent dels drafts d'IndexedDB amb el payload remot
          if (newNotes && Object.keys(persistentDrafts).length > 0) {
            newNotes = newNotes.map(n => {
              const draft = persistentDrafts[n.id];
              if (!draft) return n;
              if (draft._draftTimestamp && n.updatedAt && draft._draftTimestamp < new Date(n.updatedAt).getTime()) {
                return n;
              }
              const { _draftTimestamp, ...draftData } = draft;
              return { ...n, ...draftData };
            });
          }

          if (!prev.payload || !prev.payload.notes) {
            return { status: 'ready', error: null, payload: { ...payload, notes: newNotes }, scopeKey };
          }
          // F03: Reconciliar respostes de càrrega amb mutacions locals més recents del MATEIX SCOPE
          const localMap = new Map(prev.payload.notes.map(n => [n.id, n]));
          const mergedNotes = newNotes.map(remoteNote => {
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
          
          return { status: 'ready', error: null, payload: { ...payload, notes: [...mergedNotes, ...localOnly] }, scopeKey };
        });
      } catch (error) {
        if (!active || error?.name === 'AbortError') return;
        // F09: Fetch pot llançar TypeError per problemes de xarxa. No ho tractem com a error de programació.
        if (error instanceof ReferenceError) throw error;
        
        if (error instanceof TypeError || error?.message?.includes('fetch') || error?.message?.includes('network')) {
           console.warn(`[NotesDataContext] Error de xarxa silenciat (scope: ${scopeKey}):`, error);
           setData(prev => prev.scopeKey === scopeKey ? { ...prev, status: prev.payload ? 'ready' : 'error', error: prev.payload ? null : error } : prev);
           return;
        }

        console.error(`[NotesDataContext] Error carregant dades (scope: ${scopeKey}):`, error);
        
        setData(prev => prev.scopeKey === scopeKey ? { ...prev, status: 'error', error } : prev);
      }
    }

    load();
    return () => { 
      active = false;
      controller.abort();
    };
  }, [scopeKey, config, tick, generacio]);

  const value = useMemo(() => {
    if ((data.status !== 'ready' && data.status !== 'revalidating') || !data.payload || data.scopeKey !== scopeKey) {
      return { ...BUIT, status: data.scopeKey !== scopeKey ? 'loading' : data.status, error: data.error };
    }
    return {
      status: data.status,
      error: data.error,
      scopeKey: data.scopeKey,
      notes: data.payload.notes || [],
      noteFolders: data.payload.noteFolders || [],
      updateNote: async (id, updates, rev) => {
        try {
          const updated = await apiUpdateNote(id, updates, rev, config);
          setData((prev) => {
            if (!prev.payload || prev.scopeKey !== scopeKey) return prev;
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
            setData(prev => ({ ...prev, status: 'revalidating' }));
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
        const myScopeKey = scopeKey;
        const creada = await apiCreateNote(nota, config);
        
        // F04: Comprovar que no ha canviat el tenant/actor durant la creació pendent
        setData((prev) => {
          if (!prev.payload || prev.scopeKey !== myScopeKey) return prev;
          return {
            ...prev,
            payload: { ...prev.payload, notes: [creada, ...(prev.payload.notes || [])] }
          };
        });
        return creada;
      },
      refresh: () => {
        setData(prev => ({ ...prev, status: 'loading', scopeKey }));
        setTick(t => t + 1);
      }
    };
  }, [data, config, actorKey, scopeKey]);

  useRecarregaExterna(() => {
    if (data.status !== 'loading') {
      setData(prev => ({ ...prev, status: 'loading', scopeKey }));
      setTick(t => t + 1);
    }
  });

  return <NotesDataContext.Provider value={value}>{children}</NotesDataContext.Provider>;
}

export function useNotesData() {
  return useContext(NotesDataContext) || BUIT;
}
```
### src/components/universal/workspace/WorkspaceContext.jsx
```javascript
// src/components/universal/workspace/WorkspaceContext.jsx
import {
  createContext, useCallback, useContext, useEffect,
  useMemo, useReducer, useRef
} from 'react';
import {
  ALL_CATEGORY_ID, createWorkspaceState,
  filterWorkspaceItems, workspaceReducer
} from './workspaceState.js';

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({
  navigationGroups,
  categories,
  items,
  status = 'ready',
  initialSelection,
  selection,
  onSelectionChange,
  children
}) {
  const [state, dispatch] = useReducer(
    workspaceReducer,
    initialSelection,
    createWorkspaceState
  );

  // Normalització única a la frontera: des d’ací tots els IDs són strings.
  const normalizedCategories = useMemo(() => {
    // Si pasen navigationGroups, extraiem les opcions per tindre-les planes per al mapa
    if (navigationGroups && navigationGroups.length > 0) {
      return navigationGroups.flatMap(g => (g.options || []).map(category => ({
        ...category,
        groupId: g.id,
        id: String(category.id),
        parentId: category.parentId == null ? null : String(category.parentId)
      })));
    }
    return (categories || []).map((category) => ({
      ...category,
      id: String(category.id),
      parentId: category.parentId == null ? null : String(category.parentId)
    }));
  }, [categories, navigationGroups]);

  const normalizedItems = useMemo(() => items.map((item) => ({
    ...item,
    id: String(item.id),
    categoryIds: (item.categoryIds || []).map(String),
    tags: (item.tags || []).map(String)
  })), [items]);

  const categoryById = useMemo(
    () => new Map(normalizedCategories.map((category) => [category.id, category])),
    [normalizedCategories]
  );
  const itemById = useMemo(
    () => new Map(normalizedItems.map((item) => [item.id, item])),
    [normalizedItems]
  );
  const { activeCategoryId, activeTagIds, query } = state;
  const filteredItems = useMemo(
    () => filterWorkspaceItems(normalizedItems, { activeCategoryId, activeTagIds, query }),
    [normalizedItems, activeCategoryId, activeTagIds, query]
  );
  const activeItem = state.activeItemId
    ? itemById.get(state.activeItemId) || null
    : null;

  // Evita ecos quan els adaptadors creen callbacks nous. La notificació
  // s’emet des d’accions/reconciliació, mai com a reflex de `selection`.
  const onSelectionChangeRef = useRef(onSelectionChange);
  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);
  const emitSelection = useCallback((next, reason) => {
    onSelectionChangeRef.current?.(next, { reason });
  }, []);

  const stateRef = useRef(state);
  const normalizedItemsRef = useRef(normalizedItems);
  const statusRef = useRef(status);

  useEffect(() => {
    stateRef.current = state;
    normalizedItemsRef.current = normalizedItems;
    statusRef.current = status;
  }, [state, normalizedItems, status]);

  const selectCategory = useCallback((categoryId) => {
    if (statusRef.current !== 'ready') return;
    const currentState = stateRef.current;
    const items = normalizedItemsRef.current;

    const id = String(categoryId);
    const candidates = filterWorkspaceItems(items, {
      ...currentState,
      activeCategoryId: id
    });
    const remembered = currentState.lastItemByCategory[id];
    const itemId = candidates.some((item) => String(item.id) === remembered)
      ? remembered
      : candidates[0]?.id ?? null;
    
    dispatch({ type: 'category/select', categoryId: id, itemId });
    emitSelection({ categoryId: id, itemId }, 'user');
  }, [emitSelection]);

  const selectItem = useCallback((itemId) => {
    if (statusRef.current !== 'ready') return;
    const id = itemId == null ? null : String(itemId);
    dispatch({ type: 'item/select', itemId: id });
    emitSelection({ categoryId: stateRef.current.activeCategoryId, itemId: id }, 'user');
  }, [emitSelection]);

  const requestItem = useCallback((itemId) => {
    if (statusRef.current !== 'ready') return;
    const id = String(itemId);
    dispatch({ type: 'item/request', itemId: id });
    emitSelection({ categoryId: stateRef.current.activeCategoryId, itemId: id }, 'create');
  }, [emitSelection]);

  const syncPending = useRef(false);
  
  // Mode controlat opcional: necessari perquè back/forward o un canvi de URL
  // posterior al muntatge actualitze la selecció.
  useEffect(() => {
    if (!selection) return;
    // Només silenciem la reconciliació quan la URL fixa un element concret.
    // Si no en porta cap (p. ex. /disseny?categoria=fonaments), la reconciliació
    // ha de continuar per triar el primer element; si no, el detall queda buit.
    syncPending.current = selection.itemId !== undefined;
    dispatch({
      type: 'selection/sync',
      categoryId: selection.categoryId,
      itemId: selection.itemId
    });
  }, [selection?.categoryId, selection?.itemId]);

  // Només repara IDs desapareguts; els filtres no mouen l’editor.
  useEffect(() => {
    // “Encara carregant” no significa “l’ID del deep link ha desaparegut”.
    if (status !== 'ready') return;
    if (syncPending.current) {
      syncPending.current = false;
      return;
    }

    let categoryId = state.activeCategoryId;
    if (categoryId !== ALL_CATEGORY_ID && !categoryById.has(categoryId)) {
      categoryId = normalizedCategories[0]?.id == null
        ? ALL_CATEGORY_ID
        : normalizedCategories[0].id;
    }

    let itemId = state.activeItemId;
    if (state.pendingItemId && !itemById.has(state.pendingItemId)) return;

    if (state.needsInitialSelection && itemId == null) {
      itemId = normalizedItems.find((item) =>
        categoryId === ALL_CATEGORY_ID || item.categoryIds.includes(categoryId)
      )?.id ?? null;
    }
    if (itemId && !itemById.has(itemId)) {
      itemId = normalizedItems.find((item) =>
        categoryId === ALL_CATEGORY_ID || item.categoryIds.includes(categoryId)
      )?.id ?? null;
    }

    const selectedItem = itemId == null ? null : itemById.get(String(itemId));
    if (
      selectedItem
      && categoryId !== ALL_CATEGORY_ID
      && !selectedItem.categoryIds.includes(categoryId)
    ) {
      categoryId = selectedItem.categoryIds[0] ?? ALL_CATEGORY_ID;
    }

    itemId = itemId == null ? null : String(itemId);
    const selectionChanged = categoryId !== state.activeCategoryId
      || itemId !== state.activeItemId;
    if (selectionChanged || state.needsInitialSelection || state.pendingItemId) {
      dispatch({ type: 'selection/reconcile', categoryId, itemId, pendingItemId: null });
      if (selectionChanged || state.needsInitialSelection) {
        emitSelection({ categoryId, itemId }, 'reconcile');
      }
    }
  }, [categoryById, emitSelection, itemById, normalizedCategories, normalizedItems,
    state.activeCategoryId, state.activeItemId, state.needsInitialSelection,
    state.pendingItemId, status]);

  const value = useMemo(() => ({
    navigationGroups,
    categories: normalizedCategories,
    items: normalizedItems,
    filteredItems,
    activeItem,
    status,
    state,
    selectCategory,
    selectItem,
    requestItem,
    setQuery: (query) => dispatch({ type: 'query/set', query }),
    toggleTag: (tagId) => dispatch({ type: 'tag/toggle', tagId }),
    clearFilters: () => dispatch({ type: 'filters/clear' }),
    openSearch: () => dispatch({ type: 'search/open' }),
    closeSearch: () => dispatch({ type: 'search/close' }),
    toggleColumn: (column) => dispatch({ type: 'column/toggle', column })
  }), [navigationGroups, normalizedCategories, normalizedItems, filteredItems, activeItem, state,
    selectCategory, selectItem, requestItem, status]);

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error('useWorkspace ha de viure dins de WorkspaceProvider');
  return value;
}
```
### src/components/universal/workspace/workspaceState.js
```javascript
// src/components/universal/workspace/workspaceState.js
export const ALL_CATEGORY_ID = '__all__';

export function createWorkspaceState(initial = {}) {
  return {
    activeCategoryId: initial.categoryId == null
      ? ALL_CATEGORY_ID
      : String(initial.categoryId),
    activeItemId: initial.itemId == null ? null : String(initial.itemId),
    query: initial.query || '',
    activeTagIds: (initial.tagIds || []).map(String),
    lastItemByCategory: {},
    collapsed: { left: false, middle: false },
    searchOpen: Boolean(initial.query),
    needsInitialSelection: initial.itemId === undefined,
    pendingItemId: null
  };
}

export function workspaceReducer(state, action) {
  switch (action.type) {
    case 'category/select': {
      const categoryId = String(action.categoryId);
      const hasItemId = Object.prototype.hasOwnProperty.call(action, 'itemId');
      const memory = state.activeItemId
        ? { ...state.lastItemByCategory, [state.activeCategoryId]: state.activeItemId }
        : state.lastItemByCategory;

      return {
        ...state,
        activeCategoryId: categoryId,
        activeItemId: hasItemId
          ? (action.itemId == null ? null : String(action.itemId))
          : (memory[categoryId] ?? null),
        lastItemByCategory: memory,
        needsInitialSelection: false,
        pendingItemId: null
      };
    }

    case 'item/select':
      return {
        ...state,
        activeItemId: action.itemId == null ? null : String(action.itemId),
        lastItemByCategory: action.itemId == null
          ? state.lastItemByCategory
          : {
              ...state.lastItemByCategory,
              [state.activeCategoryId]: String(action.itemId)
            },
        needsInitialSelection: false,
        pendingItemId: null
      };

    case 'item/request': {
      const itemId = String(action.itemId);
      return {
        ...state,
        activeItemId: itemId,
        pendingItemId: itemId,
        needsInitialSelection: false
      };
    }

    case 'query/set':
      return { ...state, query: action.query };

    case 'tag/toggle': {
      const tagId = String(action.tagId);
      const present = state.activeTagIds.includes(tagId);
      return {
        ...state,
        activeTagIds: present
          ? state.activeTagIds.filter((id) => id !== tagId)
          : [...state.activeTagIds, tagId]
      };
    }

    case 'filters/clear':
      return { ...state, query: '', activeTagIds: [] };

    case 'search/open':
      return { ...state, searchOpen: true };

    case 'search/close':
      // Les etiquetes viuen dins de la cerca: tancar-la no pot deixar un filtre invisible actiu.
      return { ...state, searchOpen: false, query: '', activeTagIds: [] };

    case 'selection/reconcile':
      return {
        ...state,
        activeCategoryId: String(action.categoryId),
        activeItemId: action.itemId == null ? null : String(action.itemId),
        pendingItemId: action.pendingItemId == null
          ? null
          : String(action.pendingItemId),
        needsInitialSelection: false
      };

    case 'selection/sync': {
      const hasItemId = action.itemId !== undefined;
      const nextCategoryId = action.categoryId === undefined
        ? state.activeCategoryId
        : (action.categoryId == null ? ALL_CATEGORY_ID : String(action.categoryId));
      const categoryChanged = nextCategoryId !== state.activeCategoryId;
      const nextItemId = !hasItemId
        ? (categoryChanged ? null : state.activeItemId)
        : (action.itemId == null ? null : String(action.itemId));
      const nextNeedsInitialSelection = hasItemId
        ? false
        : (categoryChanged || state.needsInitialSelection);
      const nextPendingItemId = hasItemId ? null : state.pendingItemId;

      if (
        nextCategoryId === state.activeCategoryId
        && nextItemId === state.activeItemId
        && nextNeedsInitialSelection === state.needsInitialSelection
        && nextPendingItemId === state.pendingItemId
      ) {
        return state;
      }

      return {
        ...state,
        activeCategoryId: nextCategoryId,
        activeItemId: nextItemId,
        needsInitialSelection: nextNeedsInitialSelection,
        pendingItemId: nextPendingItemId
      };
    }

    case 'column/toggle':
      return {
        ...state,
        collapsed: {
          ...state.collapsed,
          [action.column]: !state.collapsed[action.column]
        }
      };

    default:
      return state;
  }
}

const normalitza = (value) =>
  String(value ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('ca');

export function filterWorkspaceItems(items, state) {
  const query = normalitza(state.query.trim());

  return items.filter((item) => {
    const categories = (item.categoryIds || []).map(String);
    const inCategory = state.activeCategoryId === ALL_CATEGORY_ID
      || categories.includes(state.activeCategoryId);
    if (!inCategory) return false;

    const tags = (item.tags || []).map(String);
    if (!state.activeTagIds.every((tag) => tags.includes(tag))) return false;

    if (!query) return true;
    return normalitza(
      item.searchText || `${item.title || ''} ${item.subtitle || ''} ${tags.join(' ')}`
    ).includes(query);
  });
}
```
### src/hooks/useResolvedAsset.js
```javascript
import { useState, useEffect } from 'react';
import { resolveAsset as resolveAssetSync } from '../config/assetResolver.js';
import { resolveAsset as resolveAssetAsync, teCapacitat } from '../data/backendPort.js';

/**
 * Hook per a resoldre referències opaques (sdp-media://) a URLs vàlides.
 * Funciona de manera asíncrona per als recursos que necessiten signatures (com el bucket mitjans_privats).
 * 
 * @param {string} assetRef Referència de l'actiu (ex. sdp-media://..., /assets/...)
 * @returns {string} L'URL resolta i llesta per a posar-se a l'atribut `src`.
 */
export function useResolvedAsset(assetRef) {
  const [resolvedUrl, setResolvedUrl] = useState('');

  useEffect(() => {
    let isMounted = true;
    
    if (!assetRef) {
      setResolvedUrl('');
      return;
    }

    if (assetRef.startsWith('sdp-media://')) {
      setResolvedUrl('');
      if (!teCapacitat('mitjans')) {
        return; // No hi ha backend de mitjans
      }
      // Resolució asíncrona a través del contracte
      resolveAssetAsync(assetRef)
        .then(url => {
          if (isMounted) setResolvedUrl(url);
        })
        .catch(err => {
          console.error("Error resolent asset:", assetRef, err);
          if (isMounted) setResolvedUrl('');
        });
    } else {
      // Resolució síncrona per als assets locals, http, etc.
      setResolvedUrl(resolveAssetSync(assetRef));
    }

    return () => {
      isMounted = false;
    };
  }, [assetRef]);

  return resolvedUrl;
}
```
### src/components/universal/workspace/ItemMedia.jsx
```javascript
import React, { useState, useEffect } from 'react';
import { useResolvedAsset } from '../../../hooks/useResolvedAsset.js';

/**
 * Primitiva compartida per a resoldre i mostrar actius de targetes al Workspace.
 * Compleix amb l'auditoria: resolució asíncrona segura, fallback a icona, i inicial com a últim recurs.
 * Manté l'estructura quadrada consistent.
 */
export function ItemMedia({ item, titleFallback, className = '' }) {
  const src = useResolvedAsset(item?.image || '');
  const [imgError, setImgError] = useState(false);
  
  useEffect(() => {
    setImgError(false);
  }, [src]);

  const Icon = item?.icon;
  const t = String(item?.title || titleFallback || '?').trim();
  const inicial = t ? t.charAt(0).toLocaleUpperCase('ca') : '?';

  return (
    <span className={`sdp-gestor-fitxa__media ${className}`} aria-hidden="true" style={{ background: 'var(--sdp-fons-subtil)' }}>
      {src && !imgError ? (
        <img className="sdp-gestor-fitxa__imatge" src={src} alt="" loading="lazy" onError={() => setImgError(true)} />
      ) : Icon ? (
        <Icon size={24} className="sdp-gestor-fitxa__icona" />
      ) : (
        <span className="sdp-gestor-fitxa__inicial">{inicial}</span>
      )}
    </span>
  );
}
```
### src/components/layout/AppGridShell.jsx
```javascript
import { useLayoutEffect, useRef, useState, createContext, useContext, useMemo, useCallback } from 'react';
import { getVal, setVal } from '../../config/storage.js';
import AppGridResizer from './AppGridResizer';

const AppGridContext = createContext(null);
export { AppGridContext };

const COLUMN_LIMITS = Object.freeze({
  left: { min: 200, max: 420 },
  middle: { min: 240, max: 520 },
});
const DEFAULT_COLUMN_WIDTHS = Object.freeze({ left: 270, middle: 300 });
const PRESETS = Object.freeze({
  compacta: { left: 220, middle: 260 },
  defecte: DEFAULT_COLUMN_WIDTHS,
  ampla: { left: 320, middle: 380 }
});
const RIGHT_COLUMN_MIN = 320;
const RESIZER_WIDTH = 1;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const SANEJA_AMPLADA = (v, min, max, def) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? Math.round(n) : def;
};
export function useAppGrid() {
  const ctx = useContext(AppGridContext);
  if (!ctx) throw new Error('useAppGrid ha de ser utilitzat dins de AppGridShell');
  return ctx;
}

export default function AppGridShell({
  children,
  leftColumn,
  middleColumn,
  rightColumn,
  leftTitle = 'ESQUERRA',
  middleTitle = 'CENTRE',
  leftIcon: LeftIcon = null,
  middleIcon: MiddleIcon = null,
  leftCollapsed = false,
  middleCollapsed = false,
  initialPane = null,
  'aria-label': ariaLabel = 'Graella de l\'aplicació',
  className = '',
}) {
  const [mida, setMida] = useState('ample');
  const [panellObert, setPanellObert] = useState(initialPane);
  const [columnWidths, setColumnWidths] = useState(() => {
    const brut = getVal('sdp-grid-widths', DEFAULT_COLUMN_WIDTHS) || {};
    return {
      left: SANEJA_AMPLADA(brut.left, COLUMN_LIMITS.left.min, COLUMN_LIMITS.left.max, DEFAULT_COLUMN_WIDTHS.left),
      middle: SANEJA_AMPLADA(brut.middle, COLUMN_LIMITS.middle.min, COLUMN_LIMITS.middle.max, DEFAULT_COLUMN_WIDTHS.middle),
    };
  });
  const pageRef = useRef(null);

  const widthsRef = useRef(columnWidths);
  const midaRef = useRef(mida);
  useLayoutEffect(() => {
    widthsRef.current = columnWidths;
    midaRef.current = mida;
  }, [columnWidths, mida]);

  const measureRef = useRef(null);

  const collapsedRef = useRef({ left: leftCollapsed, middle: middleCollapsed });
  useLayoutEffect(() => {
    collapsedRef.current = { left: leftCollapsed, middle: middleCollapsed };
  }, [leftCollapsed, middleCollapsed]);

  useLayoutEffect(() => {
    const page = pageRef.current;
    if (!page) return;

    const measure = () => {
      const w = page.clientWidth;
      const cw = widthsRef.current;
      const { left, middle } = collapsedRef.current;
      const actualLeft = left ? 56 : cw.left;
      const actualMiddle = middle ? 56 : cw.middle;
      const minAmple = Math.max(1090, actualLeft + actualMiddle + RIGHT_COLUMN_MIN + RESIZER_WIDTH * 2);
      
      let novaMida = 'ample';
      if (w < 720) novaMida = 'estret';
      else if (w < minAmple) novaMida = 'mitja';

      const prevMida = midaRef.current;
      if (prevMida !== novaMida) {
        setMida(novaMida);
        if (novaMida === 'ample') setPanellObert(null);
        if (novaMida === 'estret' && prevMida === 'ample') setPanellObert(null);
      }
    };
    measureRef.current = measure;

    measure();
    const observer = new ResizeObserver(() => measureRef.current());
    observer.observe(page);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    measureRef.current?.();
  }, [columnWidths]);

  useLayoutEffect(() => {
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
  }, [columnWidths.left, columnWidths.middle]);

  const toggleLeft = useCallback(() => setPanellObert((p) => (p === 'left' ? null : 'left')), []);
  const toggleMiddle = useCallback(() => setPanellObert((p) => (p === 'middle' ? null : 'middle')), []);

  const resizeColumn = useCallback((column, requestedWidth) => {
    const containerWidth = pageRef.current?.clientWidth || 0;
    let nextStateToSave = null;
    setColumnWidths((current) => {
      const otherColumn = column === 'left' ? 'middle' : 'left';
      const otherWidth = current[otherColumn];
      const availableMax = containerWidth - otherWidth - RIGHT_COLUMN_MIN - RESIZER_WIDTH * 2;
      const limits = COLUMN_LIMITS[column];
      const max = Math.max(limits.min, Math.min(limits.max, availableMax));
      const nextWidth = clamp(requestedWidth, limits.min, max);
      if (nextWidth === current[column]) return current;
      
      const nextState = { ...current, [column]: nextWidth };
      nextStateToSave = nextState;
      return nextState;
    });
    if (nextStateToSave) setVal('sdp-grid-widths', nextStateToSave);
  }, []);

  const applyPreset = useCallback((presetName) => {
    if (!PRESETS[presetName]) return;
    const nextState = PRESETS[presetName];
    setColumnWidths(nextState);
    setVal('sdp-grid-widths', nextState);
  }, []);

  const tancada = {
    left: mida !== 'ample' && panellObert !== 'left',
    middle: mida === 'estret' && panellObert !== 'middle',
    right: mida === 'estret' && panellObert !== null,
  };

  /* Classes modificadores en lloc de :has() (Baseline 2022). */
  const contentMods = [
    'app-grid-content',
    leftCollapsed && mida === 'ample' ? 'has-left-collapsed' : '',
    middleCollapsed && mida === 'ample' ? 'has-middle-collapsed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const tancaPanells = useCallback(() => setPanellObert(null), []);

  const ctxValue = useMemo(() => ({
    mida,
    panellObert,
    setPanellObert,
    tancaPanells,
    columnWidths,
    applyPreset
  }), [mida, panellObert, columnWidths, tancaPanells, applyPreset]);

  return (
    <AppGridContext.Provider value={ctxValue}>
      <div ref={pageRef} className={`app-grid-page ${className}`.trim()}>

        {children}

        <article
          className="app-grid-shell"
          data-layout={mida}
          data-panell={panellObert || ''}
          aria-label={ariaLabel}
        >
          {mida !== 'ample' && (
            <div className="app-grid-headers">
              <button
                type="button"
                className={`app-grid-header-btn ${panellObert === 'left' ? 'active' : ''}`}
                aria-expanded={panellObert === 'left'}
                aria-controls="app-grid-sidebar"
                onClick={toggleLeft}
              >
                {LeftIcon ? <LeftIcon size={18} aria-hidden focusable="false" /> : null}
                <span>{leftTitle}</span>
              </button>
              {mida === 'estret' && (
                <button
                  type="button"
                  className={`app-grid-header-btn ${panellObert === 'middle' ? 'active' : ''}`}
                  aria-expanded={panellObert === 'middle'}
                  aria-controls="app-grid-list"
                  onClick={toggleMiddle}
                >
                  {MiddleIcon ? <MiddleIcon size={18} aria-hidden focusable="false" /> : null}
                  <span>{middleTitle}</span>
                </button>
              )}
            </div>
          )}

          <div className={contentMods}>
            <section
              className="app-grid-column app-grid-column--left"
              id="app-grid-sidebar"
              data-obert={!tancada.left}
              inert={tancada.left ? "true" : undefined}
              aria-hidden={tancada.left ? true : undefined}
            >
              {leftColumn}
            </section>
            {mida === 'ample' && !leftCollapsed ? (
              <AppGridResizer
                className="app-grid-resizer--left"
                label={`Redimensionar ${leftTitle}`}
                value={columnWidths.left}
                min={COLUMN_LIMITS.left.min}
                max={COLUMN_LIMITS.left.max}
                onResize={(value) => resizeColumn('left', value)}
              />
            ) : null}
            <section
              className="app-grid-column app-grid-column--middle"
              id="app-grid-list"
              data-obert={!tancada.middle}
              inert={tancada.middle ? "true" : undefined}
              aria-hidden={tancada.middle ? true : undefined}
            >
              {middleColumn}
            </section>
            {mida === 'ample' && !middleCollapsed ? (
              <AppGridResizer
                className="app-grid-resizer--middle"
                label={`Redimensionar ${middleTitle}`}
                value={columnWidths.middle}
                min={COLUMN_LIMITS.middle.min}
                max={COLUMN_LIMITS.middle.max}
                onResize={(value) => resizeColumn('middle', value)}
              />
            ) : null}
            <section
              className="app-grid-column app-grid-column--right"
              id="app-grid-main"
              data-obert={!tancada.right}
              inert={tancada.right ? "true" : undefined}
              aria-hidden={tancada.right ? true : undefined}
            >
              {rightColumn}
            </section>
          </div>
        </article>
      </div>
    </AppGridContext.Provider>
  );
}
```
### src/data/supabase/notes.js
```javascript
import { getDefaultUserId } from '../appSeed.js';
import { mergeById } from '../mapejadorSeccions.js';
import { ErrorSupabase, buildSeedAppData, generateUUID, getCurrentUser, getResolvedConfig, mapContentRowsToData, request } from './runtime.js';

const nota = (row) => ({ id: row.id, folderId: row.folder_id, title: row.title, subtitle: row.subtitle,
  lead: row.lead, content: row.content, categories: row.categories, tags: row.tags,
  heroImage: row.hero_image, logoImage: row.logo_image, isPublished: row.is_published,
  publishedSubmissionId: row.published_submission_id, revision: row.revision,
  createdAt: row.created_at, updatedAt: row.updated_at });

export async function loadNotes(ownerUserId = getDefaultUserId(), config = {}) {
  const { runtimeDataMode, hasSupabaseConfig, tenantId } = getResolvedConfig(config);
  if (runtimeDataMode === 'seed') {
    const seed = await buildSeedAppData(ownerUserId);
    return { notes: seed.notes, noteFolders: seed.noteFolders };
  }
  if (!hasSupabaseConfig) throw new Error('Falten credencials de Supabase per carregar les Notes.');
  const safeOwnerId = ownerUserId || getDefaultUserId();
  const [contentRows, submissions, rows] = await Promise.all([
    request(`/rest/v1/app_content?select=key,payload,version&key=in.(notes,noteFolders)&tenant_id=eq.${encodeURIComponent(tenantId)}`, config, { signal: config.signal }),
    request(`/rest/v1/section_submissions?select=*&tenant_id=eq.${encodeURIComponent(tenantId)}&order=created_at.desc&limit=50`, config, { signal: config.signal }),
    request(`/rest/v1/notes?select=*&tenant_id=eq.${encodeURIComponent(tenantId)}&owner_user_id=eq.${encodeURIComponent(safeOwnerId)}&order=updated_at.desc&limit=50`, config, { signal: config.signal })
  ]);
  const base = mapContentRowsToData(contentRows || []);
  const merged = mergeById(base.notes || [], Array.isArray(rows) ? rows.map(nota) : []);
  return {
    notes: mergeById(merged, (submissions || []).filter((s) => s.section_id === 'notes').map((s) => s.payload)),
    noteFolders: base.noteFolders || []
  };
}

export async function createNote(input, config = {}) {
  const { tenantId, hasSupabaseConfig } = getResolvedConfig(config);
  const user = getCurrentUser();
  if (!hasSupabaseConfig) throw new Error('No es pot crear la nota sense connexió.');
  if (!user) throw new Error('Cal iniciar sessió per crear una nota.');
  const rows = await request('/rest/v1/notes', config, {
    method: 'POST', headers: { Prefer: 'return=representation' },
    body: { id: input.id || generateUUID(), tenant_id: tenantId, owner_user_id: user.id,
      folder_id: input.folderId || 'f-notes', title: input.title || '', content: input.content || '',
      categories: input.categories || [], tags: input.tags || [] }
  });
  if (!rows?.[0]) throw new ErrorSupabase('Error al crear la nota.', 500);
  return nota(rows[0]);
}

export async function updateNote(id, updates, expectedRevision, config = {}) {
  const { hasSupabaseConfig, tenantId } = getResolvedConfig(config);
  if (!hasSupabaseConfig) throw new Error('ATURADOR CRÍTIC: No es pot actualitzar una nota sense connexió al servidor.');
  if (expectedRevision === undefined || expectedRevision === null) throw new Error('ATURADOR CRÍTIC: expectedRevision és obligatori.');
  const payload = { folder_id: updates.folderId, title: updates.title, subtitle: updates.subtitle,
    lead: updates.lead, content: updates.content, categories: updates.categories, tags: updates.tags,
    hero_image: updates.heroImage, logo_image: updates.logoImage, is_published: updates.isPublished,
    published_submission_id: updates.publishedSubmissionId };
  for (const key of Object.keys(payload)) if (payload[key] === undefined) delete payload[key];
  const revision = expectedRevision != null ? `&revision=eq.${expectedRevision}` : '';
  const rows = await request(`/rest/v1/notes?id=eq.${encodeURIComponent(id)}&tenant_id=eq.${encodeURIComponent(tenantId)}${revision}`, config,
    { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: payload });
  if (!rows?.[0]) {
    // F10: Comprovar si existeix realment per distingir entre conflicte i no trobada
    const verifica = await request(`/rest/v1/notes?id=eq.${encodeURIComponent(id)}&tenant_id=eq.${encodeURIComponent(tenantId)}&select=id`, config);
    if (!verifica?.[0]) {
      throw new ErrorSupabase("No accessible o eliminada.", 404);
    }
    throw new ErrorSupabase("Conflicte de concurrència de revisió.", 409);
  }
  return nota(rows[0]);
}
```
Aquestes són les referències principals que has sol·licitat. Amb això, ja pots retornar les solucions exactes (en blocs de codi per separat) i la nota final.
