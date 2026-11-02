// src/components/universal/workspace/workspaceState.js
export const ALL_CATEGORY_ID = '__all__';

/* P1-73 (T3, prompt 261102_1532) · Les dues ordenacions de la llista
   d'UniversalWorkspace; la primera és la de muntar. */
export const ORDENACIONS = Object.freeze(['date', 'name']);

/* T7 (P3) · `columnes` diu quines columnes arrenquen plegades en rail
   ({ left, middle }); sense, cap, com sempre. Només compta en «ample»: en
   mitjà i estret la navegació ja comença tancada (AppGridShell).
   P1-73 (T3, prompt 261102_1532) · `ordre` ({ sortable, sortBy }) és l'ordre
   de la llista en muntar; sense, per data i sense ordenar, com la llista. */
export function createWorkspaceState(initial = {}, columnes = {}, ordre = {}) {
  return {
    activeCategoryId: initial.categoryId == null
      ? ALL_CATEGORY_ID
      : String(initial.categoryId),
    activeItemId: initial.itemId == null ? null : String(initial.itemId),
    query: initial.query || '',
    activeTagIds: (initial.tagIds || []).map(String),
    lastItemByCategory: {},
    collapsed: { left: columnes?.left === true, middle: columnes?.middle === true },
    searchOpen: Boolean(initial.query),
    needsInitialSelection: initial.itemId === undefined,
    pendingItemId: null,
    selectionToken: null,
    sortBy: ORDENACIONS.includes(ordre?.sortBy) ? ordre.sortBy : ORDENACIONS[0],
    sortable: Boolean(ordre?.sortable)
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
        needsInitialSelection: action.needsInitialSelection === true,
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

    case 'column/toggle':
      return {
        ...state,
        collapsed: {
          ...state.collapsed,
          [action.column]: !state.collapsed[action.column]
        }
      };

    /* P1-73 (T3, prompt 261102_1532) · L'ordre de la llista ({ sortBy?,
       sortable? }). Un sortBy desconegut no canvia res; sense cap canvi, el
       mateix estat (cap pintat de més). */
    case 'sort/set': {
      const sortBy = ORDENACIONS.includes(action.sortBy) ? action.sortBy : state.sortBy;
      const sortable = action.sortable === undefined ? state.sortable : Boolean(action.sortable);
      if (sortBy === state.sortBy && sortable === state.sortable) return state;
      return { ...state, sortBy, sortable };
    }

    default:
      return state;
  }
}

const normalitza = (value) =>
  String(value ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('ca');

/**
 * P1-73 (T3, prompt 261102_1532) · El comparador de la llista
 * d'UniversalWorkspace, l'únic: per nom, el títol (localeCompare 'ca'); per
 * data (i qualsevol altre valor), updatedAt descendent. Pur.
 */
export function comparadorElements(sortBy) {
  if (sortBy === 'name') {
    return (a, b) => (a?.title || '').localeCompare(b?.title || '', 'ca');
  }
  return (a, b) => (Date.parse(b?.updatedAt) || 0) - (Date.parse(a?.updatedAt) || 0);
}

/**
 * P1-73 (T3, prompt 261102_1532) · La llista tal com la pinta
 * UniversalWorkspace: una còpia (mai muta l'entrada) en l'ordre d'entrada o,
 * amb `sortable`, ordenada per `sortBy`; a «Tot» (`categoryId`), els
 * `fixatATot: true` (el booleà, D-4) davant, en el mateix ordre, i la resta
 * darrere i en el seu. Pura.
 */
export function ordenaElements(items, { sortable = false, sortBy = ORDENACIONS[0], categoryId } = {}) {
  const ordenats = Array.isArray(items) ? [...items] : [];
  if (sortable) ordenats.sort(comparadorElements(sortBy));
  if (categoryId !== ALL_CATEGORY_ID) return ordenats;
  const fixats = ordenats.filter((item) => item?.fixatATot === true);
  return fixats.length ? [...fixats, ...ordenats.filter((item) => item?.fixatATot !== true)] : ordenats;
}

/**
 * P1-73 / O2-T5 · La primera candidata en el mateix ordre que la llista,
 * també fora de Tot i sense fixats. Les reserves pròpies d'una secció les
 * filtra canAutoSelect abans d'arribar ací. Sense sortable conserva l'ordre
 * d'entrada (i la prioritat fixatATot); no muta les candidates.
 */
export function primerElementTriable(items, categoryId, ordre = {}) {
  return ordenaElements(items, { ...ordre, categoryId })[0] ?? null;
}

/* T7 (P5) · `ambit`, opcional: el Set d'ids que compten com la categoria
   activa (ella i les seues subcarpetes, WorkspaceProvider amb
   inclouDescendents). Sense, només la categoria activa, com sempre. */
export function filterWorkspaceItems(items, state, { ambit = null, ambConsulta = true } = {}) {
  /* B6-B2 (IDEA-46, marató 261101_2143) · Amb `ambConsulta: false` (només el
     booleà) la consulta no filtra: la secció ja dona els elements de la seua
     cerca. La carpeta i les etiquetes continuen filtrant. */
  const query = ambConsulta === false ? '' : normalitza(state.query.trim());

  return items.filter((item) => {
    const categories = (item.categoryIds || []).map(String);
    const inCategory = state.activeCategoryId === ALL_CATEGORY_ID
      || (ambit
        ? categories.some((id) => ambit.has(id))
        : categories.includes(state.activeCategoryId));
    if (!inCategory) return false;

    const tags = (item.tags || []).map(String);
    if (!state.activeTagIds.every((tag) => tags.includes(tag))) return false;

    if (!query) return true;
    return normalitza(
      item.searchText || `${item.title || ''} ${item.subtitle || ''} ${tags.join(' ')}`
    ).includes(query);
  });
}
