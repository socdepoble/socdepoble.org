// src/components/universal/workspace/WorkspaceContext.jsx
import {
  createContext, useCallback, useContext, useEffect,
  useMemo, useReducer, useRef, useState
} from 'react';
import {
  ALL_CATEGORY_ID, createWorkspaceState,
  filterWorkspaceItems, workspaceReducer
} from './workspaceState.js';
import { buildWorkspaceFolderForest, descendentsDeCarpeta } from './workspaceFolderForest.js';

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({
  navigationGroups,
  categories,
  items = [],
  itemsComplete = false,
  resolveItemId,
  canAutoSelect,
  resolutionKey = 0,
  status = 'ready',
  initialSelection,
  selection,
  onSelectionChange,
  /* T7 (P3) · Columnes que arrenquen plegades en rail ({ left, middle }).
     Només es llig en muntar, com la selecció inicial. */
  columnesInicials,
  /* T7 (P5) · Amb true, triar una carpeta també mostra els elements de les
     seues subcarpetes. Sense, només els de la carpeta, com sempre. */
  inclouDescendents = false,
  /* T7C (P1) · Amb true, triar una categoria no obri cap element, ni la
     selecció inicial ni la reconciliació en trien cap de seu: el detall no és
     un element (el mode compacte d'UniversalWorkspace, el Snippet Curador).
     Un element només s'obri quan es tria (selectItem) o el porta `selection`.
     Sense, el de sempre: la categoria obri el seu primer element. */
  categoriaSenseElement = false,
  children
}) {
  const [state, dispatch] = useReducer(
    workspaceReducer,
    initialSelection,
    (inicial) => createWorkspaceState(inicial, columnesInicials)
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
  /* T7 (P5) · Els boscos de carpetes, un per grup (els pares no travessen
     grups), només si es demanen els descendents. */
  const boscos = useMemo(() => {
    if (!inclouDescendents) return null;
    const perGrup = new Map();
    for (const category of normalizedCategories) {
      const grup = category.groupId ?? '';
      if (!perGrup.has(grup)) perGrup.set(grup, []);
      perGrup.get(grup).push(category);
    }
    return [...perGrup.values()].map((grup) => buildWorkspaceFolderForest(grup));
  }, [inclouDescendents, normalizedCategories]);

  /* L'àmbit d'una categoria: ella i les seues subcarpetes. null vol dir
     «només ella», el comportament de sempre. */
  const ambitDe = useCallback((categoryId) => {
    if (!boscos || categoryId === ALL_CATEGORY_ID) return null;
    const bosc = boscos.find((candidat) => candidat.nodes.has(categoryId));
    if (!bosc) return null;
    const descendents = descendentsDeCarpeta(bosc, categoryId);
    return descendents.size ? new Set([categoryId, ...descendents]) : null;
  }, [boscos]);

  /* Si un element pertany a una categoria (o a l'àmbit d'esta). */
  const pertanyA = useCallback((item, categoryId) => {
    if (categoryId === ALL_CATEGORY_ID) return true;
    const ambit = ambitDe(categoryId);
    return ambit ? item.categoryIds.some((id) => ambit.has(id)) : item.categoryIds.includes(categoryId);
  }, [ambitDe]);

  const { activeCategoryId, activeTagIds, query } = state;
  const filteredItems = useMemo(
    () => filterWorkspaceItems(
      normalizedItems,
      { activeCategoryId, activeTagIds, query },
      { ambit: ambitDe(activeCategoryId) }
    ),
    [normalizedItems, activeCategoryId, activeTagIds, query, ambitDe]
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
  const ambitDeRef = useRef(ambitDe);
  const canAutoSelectRef = useRef(canAutoSelect);

  useEffect(() => {
    stateRef.current = state;
    normalizedItemsRef.current = normalizedItems;
    statusRef.current = status;
    ambitDeRef.current = ambitDe;
    canAutoSelectRef.current = canAutoSelect;
  }, [state, normalizedItems, status, ambitDe, canAutoSelect]);

  const selectCategory = useCallback((categoryId) => {
    if (statusRef.current !== 'ready') return;
    const currentState = stateRef.current;
    const items = normalizedItemsRef.current;

    const id = String(categoryId);
    let itemId = null;
    let deferred = false;
    if (!categoriaSenseElement) {
      const candidates = filterWorkspaceItems(items, {
        ...currentState,
        activeCategoryId: id
      }, { ambit: ambitDeRef.current(id) });
      // La pell pot ajornar sols la tria automàtica d'una carpeta pendent.
      // Una nota disponible continua elegible; selectItem i requestItem són manuals.
      const eligible = typeof canAutoSelectRef.current === 'function'
        ? candidates.filter(item => canAutoSelectRef.current({ categoryId: id, item }) !== false)
        : candidates;
      const remembered = currentState.lastItemByCategory[id];
      itemId = eligible.some((item) => String(item.id) === remembered)
        ? remembered
        : eligible[0]?.id ?? null;
      deferred = itemId === null && typeof canAutoSelectRef.current === 'function'
        && canAutoSelectRef.current({ categoryId: id, item: null }) === false;
    }

    dispatch({ type: 'category/select', categoryId: id, itemId, needsInitialSelection: deferred });
    emitSelection({ categoryId: id, itemId }, 'user');
  }, [emitSelection, categoriaSenseElement]);

  /* Gauntlet 261030 (cicle 2) · La raó d'una tria de la persona: 'user' (el
     clic, l'Enter, la primera fletxa d'un recorregut: les seccions fan push)
     o 'teclat' (les fletxes següents del mateix recorregut, IDEA-58: les
     seccions escriuen la URL amb replace, i tot el recorregut és una sola
     entrada de l'historial, com al Finder). Cap altra raó no hi entra. */
  const selectItem = useCallback((itemId, opcions) => {
    if (statusRef.current !== 'ready') return;
    const id = itemId == null ? null : String(itemId);
    const reason = opcions?.reason === 'teclat' ? 'teclat' : 'user';
    dispatch({ type: 'item/select', itemId: id });
    emitSelection({ categoryId: stateRef.current.activeCategoryId, itemId: id }, reason);
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

    // T7C · Amb categoriaSenseElement, cap element per defecte.
    // La política opcional només participa en les tries de reserva, mai en
    // una selecció existent. Sense política es conserva el comportament habitual.
    const permits = item => typeof canAutoSelect !== 'function'
      || canAutoSelect({ categoryId, item }) !== false;
    const firstItemId = () => (categoriaSenseElement ? null : normalizedItems.find((item) =>
      pertanyA(item, categoryId) && permits(item)
    )?.id ?? null);
    const deferred = itemId => itemId === null && !categoriaSenseElement && !permits(null);

    if (itemId !== null && !itemById.has(itemId)) {
      // Error, càrrega i "found però encara no injectat" conserven
      // l'ID. Cap d'aquests estats autoritza el fallback.
      if (itemResolution.status !== 'not-found') return;
      itemId = firstItemId();
      if (deferred(itemId)) return;
    } else if (state.needsInitialSelection && itemId === null) {
      itemId = firstItemId();
      if (deferred(itemId)) return;

      // Una pàgina buida parcial no tanca la selecció inicial (sense
      // element per defecte no hi ha res a esperar).
      if (itemId === null && !itemsComplete && !categoriaSenseElement) return;
    }

    const selectedItem = itemId === null
      ? null
      : itemById.get(itemId);

    if (
      selectedItem
      && !pertanyA(selectedItem, categoryId)
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
    emitSelection,
    pertanyA,
    categoriaSenseElement,
    canAutoSelect
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
