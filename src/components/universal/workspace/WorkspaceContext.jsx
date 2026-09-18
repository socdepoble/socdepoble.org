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

  const selectCategory = useCallback((categoryId) => {
    const id = String(categoryId);
    const candidates = filterWorkspaceItems(normalizedItems, {
      ...state,
      activeCategoryId: id
    });
    const remembered = state.lastItemByCategory[id];
    const itemId = candidates.some((item) => String(item.id) === remembered)
      ? remembered
      : candidates[0]?.id ?? null;
    dispatch({ type: 'category/select', categoryId: id, itemId });
    emitSelection({ categoryId: id, itemId }, 'user');
  }, [emitSelection, normalizedItems, state]);

  const selectItem = useCallback((itemId) => {
    const id = itemId == null ? null : String(itemId);
    dispatch({ type: 'item/select', itemId: id });
    emitSelection({ categoryId: state.activeCategoryId, itemId: id }, 'user');
  }, [emitSelection, state.activeCategoryId]);

  const requestItem = useCallback((itemId) => {
    const id = String(itemId);
    dispatch({ type: 'item/request', itemId: id });
    emitSelection({ categoryId: state.activeCategoryId, itemId: id }, 'create');
  }, [emitSelection, state.activeCategoryId]);

  const syncPending = useRef(false);
  
  // Mode controlat opcional: necessari perquè back/forward o un canvi de URL
  // posterior al muntatge actualitze la selecció.
  useEffect(() => {
    if (!selection) return;
    syncPending.current = true;
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
