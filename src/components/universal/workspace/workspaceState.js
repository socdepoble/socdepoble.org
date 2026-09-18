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
      return { ...state, searchOpen: false, query: '' };

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
