// src/components/universal/workspace/WorkspaceContext.jsx
import {
  createContext, useCallback, useContext, useEffect,
  useMemo, useReducer, useRef, useState
} from 'react';
import {
  ALL_CATEGORY_ID, createWorkspaceState,
  filterWorkspaceItems, workspaceReducer
} from './workspaceState.js';

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({
  navigationGroups,
  categories,
  items = [],
  itemsComplete = false,
  resolveItemId,
  resolutionKey = 0,
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

  // La identitat d'este token invalida també respostes de resolucions anteriors.
  const requestKey = useMemo(() => ({
    missingId, resolveItemId, resolutionKey, resolutionAttempt, selectionToken,
    selectionIsSynced, status, itemsComplete, pendingItemId: state.pendingItemId
  }), [
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

  const value = useMemo(() => ({
    navigationGroups,
    categories: normalizedCategories,
    items: normalizedItems,
    filteredItems,
    activeItem,
    status,
    state,
    itemResolution,
    retryItemResolution,
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
    itemResolution, retryItemResolution, selectCategory, selectItem, requestItem, status]);

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
