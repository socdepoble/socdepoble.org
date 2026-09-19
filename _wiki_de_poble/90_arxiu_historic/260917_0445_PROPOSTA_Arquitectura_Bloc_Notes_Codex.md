---
type: arquitectura
status: proposta
description: Bloc de Notes Universal · arquitectura lògica de la Fase 1
---

# Bloc de Notes Universal · arquitectura lògica de la Fase 1

## 1. Dictamen executiu

El motor demanat **ja ha començat a existir al repositori**. No convé crear un segon sistema paral·lel:

- `AppGridShell.jsx` ja resol la base funcional de tres columnes, el comportament responsive, els divisors accessibles i la persistència de les amplades; encara té deutes de conformitat visual/topològica enumerats més avall.
- `UniversalWorkspace.jsx` ja és la frontera genèrica entre domini i graella: filtra, selecciona i injecta un editor mitjançant un slot.
- `NotesSection.jsx` ja consumeix `UniversalWorkspace` amb carpetes, notes i `NotesEditor`.
- `DesignSection.jsx` encara funciona amb una navegació horitzontal per `?pagina=` i pàgines JSX separades; és el consumidor que falta migrar.

Per tant, la decisió correcta és:

> **Consolidar `UniversalWorkspace` com a únic motor estructural, corregir-ne els buits de selecció i convertir Notes i Disseny en adaptadors de domini. `AppGridShell` continuarà sent només layout.**

No s’ha modificat el projecte original. El seu worktree ja conté molts canvis aliens a esta anàlisi i l’accés demanat era de lectura.

### Nota sobre les fonts

La ruta indicada `_wiki_de_poble/04_arquitectura_disseny/pedra_seca.md` no existeix en el checkout actual ni en `HEAD`. D’acord amb `.agents/AGENTS.md`, les fonts vives consultades han sigut:

- `.agents/skills/pedra-seca/SKILL.md`
- `.agents/skills/app-grid-shell/SKILL.md`

La segona fixa una regla important: `UniversalPage` només pot aparéixer **dins de la columna de detall**, mai embolicant tota la graella.

## 2. Situació real del codi

| Peça | Responsabilitat actual | Decisió |
|---|---|---|
| `AppGridShell` | Tres slots, breakpoints per contenidor, overlays mòbils, `inert`, amplades i resizers | Conservar com a infraestructura pura |
| `UniversalWorkspace` | Context, facetes, cerca, llista, selecció i slot d’editor | Convertir-lo en el motor canònic i estabilitzar l’API |
| `NotesContext` / `NotesDataContext` | Dades, esborrany local, guardat remot, publicació | Mantindre fora del motor genèric |
| `NotesSection` | Adapta notes i carpetes al workspace | Simplificar sobre el contracte nou |
| `DesignSection` | `UniversalPage` global + píndoles + pàgina lazy | Migrar a un adaptador read-only del mateix workspace |
| `registre.js` | Inventari parcial del catàleg | Convertir-lo en manifest normalitzat amb IDs estables |
| `sections.js` | Registre de navegació, no de rutes | No és part del motor; Notes i Disseny ja hi són |

### Buits reals trobats en `UniversalWorkspace`

1. `colLeftCollapsed` i `colMiddleCollapsed` existeixen al context, però no arriben a `AppGridShell` ni governen cap capçalera.
2. `pageLayout`, `pageTitle`, `pageSubtitle`, `pageLead` i `pageChrome` s’accepten però no s’usen; també hi ha un import mort de `UniversalPage`.
3. `onActionCreate` ignora l’ítem retornat. Per això crear una nota no la selecciona.
4. `initialItemId` només s’aplica al muntatge; no hi ha mode controlat ni sincronització posterior amb la URL.
5. Quan un filtre oculta l’ítem actiu, el codi canvia silenciosament al primer resultat visible. En un editor açò pot fer saltar l’usuari a una altra nota mentre escriu.
6. Categoria principal i filtres secundaris estan barrejats dins de `facets`.
7. Els IDs DOM `app-grid-sidebar`, `app-grid-list` i `app-grid-main` són globals; dos workspaces simultanis col·lidirien.
8. `AppGridShell` comparteix la clau `sdp-grid-widths` entre tots els consumidors. Pot ser una preferència universal intencionada; si no ho és, cal un `storageKey` explícit.
9. El catàleg té tres fonts desnormalitzades: `PAGINES`, el mapa lazy `PAGINA` i els IDs interns d’`Especimen`.
10. `registre.js` marca `AppGridShell + UniversalWorkspace` com a `obsolet` mentre Notes l’usa i la skill canònica el documenta com a patró viu. Cal resoldre eixa contradicció d’autoritat.
11. El shell actual injecta variables dinàmiques amb `style={liveStyles}`, encara que la skill d’AppGrid prohibeix `style=`; és un deute explícit per a la fase visual, no una conformitat assumida.
12. Hi ha un conflicte canònic sobre el scroll: `pedra-seca` reserva el desbordament al visor, mentre `PaginaEstructura` documenta scroll independent en cada cos i el CSS actual activa scroll en les tres columnes. El Consell ha de dictaminar quina norma preval abans de tocar CSS.
13. Els fons actuals de les columnes no implementen encara de manera inequívoca la «Roca» fosca immutable exigida per Pedra Seca. Queda diferit i etiquetat com a deute visual, no lògic.

## 3. Fronteres de l’arquitectura

```text
Fonts de domini
├── NotesDataProvider → NotesContext → adaptador de Notes ─────┐
└── manifest del catàleg → adaptador de Disseny ───────────────┤
                                                               ▼
                    UniversalWorkspace
                selecció · cerca · etiquetes
                 estat de les columnes
                       │             │
             selectors purs      slots de domini
                       │             │
                       ▼             ▼
                  AppGridShell   Editor / visor
                  layout pur      NotesEditor
                                  Especimen viu
```

Regles de frontera:

- `AppGridShell` no sap què és una nota, una carpeta o un component.
- `UniversalWorkspace` no importa res de `src/sections/` ni parla amb Supabase.
- El workspace governa únicament **navegació estructural**: categoria, ítem, cerca, etiquetes i columnes plegades.
- La URL la sincronitza l’adaptador de secció; el motor continua independent del router.
- El domini governa **contingut i mutacions**: editar, guardar, publicar, pujar fitxers o carregar un espècimen.
- Cap component React, funció lazy o dada no serialitzable entra a la base de dades. El catàleg usa una clau `detailKey` i un registre de renderitzadors en codi.
- `UniversalPage`, quan faça falta, es renderitza dins del slot dret.

## 4. Model de dades genèric

El motor rep descriptors normalitzats. La forma interna de Notes o del catàleg queda amagada darrere de l’adaptador.

```js
/** Categoria de la primera columna. */
export const exempleCategoria = {
  id: 'reunions',
  label: 'Reunions',
  parentId: null,        // reservat per a arbre futur
  order: 20,
  iconKey: 'calendar'    // clau serialitzable; no un component React
};

/** Descriptor lleuger per a la segona columna. */
export const exempleItem = {
  id: 'nota-42',
  categoryIds: ['reunions'],
  kind: 'note',          // 'note' | 'component-doc' | futurs dominis
  title: 'Consell de setembre',
  subtitle: 'Actualitzada hui',
  tags: ['consell', 'arquitectura'],
  searchText: 'consell setembre arquitectura',
  detailKey: null,       // p. ex. 'formularis/boto' al catàleg
  revision: 7,
  updatedAt: '2026-09-17T02:00:00Z',
  data: null             // objecte del domini en memòria; mai es persisteix tal qual
};
```

Per a grans volums, la mateixa forma es pot normalitzar sense canviar l’API pública:

```js
const model = {
  categoryOrder: ['personal', 'reunions'],
  categoriesById: {
    personal: { id: 'personal', label: 'Llibreta personal' },
    reunions: { id: 'reunions', label: 'Reunions' }
  },
  itemOrder: ['nota-42', 'nota-41'],
  itemsById: {
    'nota-42': { id: 'nota-42', categoryIds: ['reunions'], kind: 'note' }
  }
};
```

### Estat React del motor

```js
const workspaceState = {
  activeCategoryId: '__all__',
  activeItemId: null,
  query: '',
  activeTagIds: [],
  lastItemByCategory: {},
  collapsed: { left: false, middle: false },
  searchOpen: false
};
```

No han d’estar en este estat:

- HTML de la nota.
- Esborranys o cua offline.
- Revisió remota o operacions CRDT.
- Estat intern d’un espècimen interactiu.
- Components React o imports lazy.

## 5. Semàntica de selecció

La selecció ha de ser previsible i no dependre accidentalment d’un filtre:

1. Seleccionar una categoria recorda l’últim ítem visitat en l’anterior i obri l’últim visitat o el primer visible de la nova.
2. Escriure una cerca o activar una etiqueta **no canvia l’editor actiu**. Si l’ítem queda fora de la llista filtrada, el detall continua obert i pot mostrar l’avís “fora del filtre”.
3. Només s’escull un fallback si l’ítem actiu ja no existeix, s’ha esborrat o l’usuari canvia explícitament de categoria.
4. Crear un ítem és una transacció lògica: `crear → incorporar a la font → seleccionar`.
5. Una URL amb `item` vàlid té prioritat; si la categoria no correspon, es deriva de l’ítem.
6. L’ID és estable i es compara sempre com a `String(id)` a la frontera del motor.

## 6. Reducer proposat

Este codi és l’evolució del `ManagerProvider` actual, no un segon context en paral·lel.

> **Estat dels snippets:** són una especificació lògica revisable, no un pedaç llest per enganxar. Pedra Seca obliga a catalogar primer els estats del workspace en `DesignSection`; després cal integrar-los amb tests i amb compatibilitat per als consumidors actuals.

```js
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
      return {
        ...state,
        activeCategoryId: nextCategoryId,
        activeItemId: !hasItemId
          ? (categoryChanged ? null : state.activeItemId)
          : (action.itemId == null ? null : String(action.itemId)),
        needsInitialSelection: hasItemId
          ? false
          : (categoryChanged || state.needsInitialSelection),
        pendingItemId: hasItemId ? null : state.pendingItemId
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

## 7. Context/controlador proposat

```jsx
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
  const normalizedCategories = useMemo(() => categories.map((category) => ({
    ...category,
    id: String(category.id),
    parentId: category.parentId == null ? null : String(category.parentId)
  })), [categories]);
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
  const filteredItems = useMemo(
    () => filterWorkspaceItems(normalizedItems, state),
    [normalizedItems, state]
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

  // Mode controlat opcional: necessari perquè back/forward o un canvi de URL
  // posterior al muntatge actualitze la selecció.
  useEffect(() => {
    if (!selection) return;
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
  }), [normalizedCategories, normalizedItems, filteredItems, activeItem, state,
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

En la implementació final convé estabilitzar amb `useCallback` també les quatre accions menudes creades dins del `value`. Ací s’han deixat visibles per fer evident el contracte.

## 8. Esquelet dels components

L’API `model={...}` és l’objectiu, però hui també consumeixen l’API antiga altres gestors (entre ells Perfil/Admin). No es pot substituir de colp: el component públic ha de mantindre una façana d’adaptació temporal sobre el mateix core, o tots els consumidors s’han de migrar en el mateix canvi atòmic.

```jsx
// src/components/universal/workspace/UniversalWorkspace.jsx
import { useState } from 'react';
import AppGridShell, { useAppGrid } from '../../layout/AppGridShell.jsx';
import AppGridColumn from '../../layout/AppGridColumn.jsx';
import { SlotErrorBoundary } from './SlotErrorBoundary.jsx';
import { WorkspaceProvider, useWorkspace } from './WorkspaceContext.jsx';
import { Search, Settings } from 'lucide-react';

// Façana temporal: adaptLegacyContract converteix l’API items/facets/getters
// al model nou. No és un segon motor; tots dos camins acaben al mateix core.
export function UniversalWorkspace(props) {
  const coreProps = props.model ? props : adaptLegacyContract(props);
  return <UniversalWorkspaceCore {...coreProps} />;
}

function UniversalWorkspaceCore({
  model,
  initialSelection,
  selection,
  onSelectionChange,
  onCreate,
  onCreateError,
  onManageCategories,
  renderDetail,
  labels = { categories: 'CATEGORIES', items: 'ELEMENTS', create: 'CREAR' }
}) {
  return (
    <WorkspaceProvider
      categories={model.categories}
      items={model.items}
      status={model.status ?? 'ready'}
      initialSelection={initialSelection}
      selection={selection}
      onSelectionChange={onSelectionChange}
    >
      <WorkspaceFrame
        onCreate={onCreate}
        onCreateError={onCreateError}
        onManageCategories={onManageCategories}
        renderDetail={renderDetail}
        labels={labels}
      />
    </WorkspaceProvider>
  );
}

function WorkspaceFrame({
  onCreate, onCreateError, onManageCategories, renderDetail, labels
}) {
  const workspace = useWorkspace();
  const [creating, setCreating] = useState(false);

  const createAndSelect = async () => {
    if (!onCreate || creating) return;
    setCreating(true);
    try {
      const created = await onCreate({
        activeCategoryId: workspace.state.activeCategoryId
      });
      // SlotErrorBoundary no captura errors de promeses ni event handlers.
      if (created?.id != null) workspace.requestItem(created.id);
    } catch (error) {
      if (onCreateError) onCreateError(error);
      else console.error('[UniversalWorkspace] Error creant l’ítem:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <AppGridShell
      aria-label="Espai de treball de tres columnes"
      leftTitle={labels.categories}
      middleTitle={labels.items}
      leftCollapsed={workspace.state.collapsed.left}
      middleCollapsed={workspace.state.collapsed.middle}
      leftColumn={
        <CategoryColumn
          title={labels.categories}
          onManageCategories={onManageCategories}
        />
      }
      middleColumn={
        <SlotErrorBoundary domini="llista" resetKey={workspace.state.activeCategoryId}>
          <ItemListColumn
            onCreate={onCreate ? createAndSelect : null}
            creating={creating}
            labels={labels}
          />
        </SlotErrorBoundary>
      }
      rightColumn={
        <SlotErrorBoundary
          domini="detall"
          resetKey={workspace.activeItem?.id || '~buit'}
        >
          <DetailColumn renderDetail={renderDetail} />
        </SlotErrorBoundary>
      }
    />
  );
}

function CategoryColumn({ title, onManageCategories }) {
  const { categories, state, selectCategory, toggleColumn } = useWorkspace();
  const { mida, setPanellObert, tancaPanells } = useAppGrid();
  const collapsed = state.collapsed.left && mida === 'ample';
  const settingsActions = onManageCategories ? [{
    id: 'settings',
    etiqueta: 'Configurar categories',
    icona: Settings,
    onAcciona: onManageCategories
  }] : [];

  const chooseCategory = (categoryId) => {
    selectCategory(categoryId);
    if (mida === 'estret') setPanellObert('middle');
    else tancaPanells();
  };

  if (collapsed) {
    return (
      <aside aria-label={title}>
        <AppGridColumn
          variant="collapsed"
          titol={title}
          accions={settingsActions}
          onReplega={() => toggleColumn('left')}
        />
      </aside>
    );
  }

  return (
    <aside aria-label={title}>
      <AppGridColumn
        titol={title}
        esquerra={(
          <button
            type="button"
            aria-current={state.activeCategoryId === '__all__' ? 'page' : undefined}
            onClick={() => chooseCategory('__all__')}
          >
            Tot
          </button>
        )}
        accions={settingsActions}
        onReplega={() => toggleColumn('left')}
      />
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          aria-current={state.activeCategoryId === category.id ? 'page' : undefined}
          onClick={() => chooseCategory(category.id)}
        >
          {category.label}
        </button>
      ))}
    </aside>
  );
}

function ItemListColumn({ onCreate, creating, labels }) {
  const {
    filteredItems, state, selectItem, setQuery,
    clearFilters, openSearch, closeSearch, toggleColumn
  } = useWorkspace();
  const { mida, tancaPanells } = useAppGrid();
  const collapsed = state.collapsed.middle && mida === 'ample';
  const searchActions = [{
    id: 'search',
    etiqueta: 'Cercar elements',
    icona: Search,
    onAcciona: () => {
      if (collapsed) toggleColumn('middle');
      openSearch();
    }
  }];

  if (collapsed) {
    return (
      <aside aria-label={labels.items}>
        <AppGridColumn
          variant="collapsed"
          titol={labels.items}
          accions={searchActions}
          onReplega={() => toggleColumn('middle')}
        />
      </aside>
    );
  }

  return (
    <aside aria-label={labels.items}>
      <AppGridColumn
        titol={labels.items}
        esquerra={(
          <button type="button" aria-label="Cercar elements" onClick={openSearch}>
            <Search size={18} aria-hidden="true" />
          </button>
        )}
        accions={onCreate ? [{
          id: 'create',
          etiqueta: labels.create,
          label: labels.create,
          variant: 'primary',
          desactivat: creating,
          onAcciona: onCreate
        }] : []}
        onReplega={() => toggleColumn('middle')}
      />
      {state.searchOpen ? (
        <>
          <label>
            <span className="sr-only">Cercar elements</span>
            <input
              autoFocus
              type="search"
              value={state.query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <button type="button" onClick={closeSearch}>Tancar cerca</button>
        </>
      ) : null}
      {/* Els botons d’etiqueta criden toggleTag(tagId); la UI es definirà després. */}
      <button type="button" onClick={clearFilters}>Netejar filtres</button>
      <ul>
        {filteredItems.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              aria-current={state.activeItemId === String(item.id) ? 'true' : undefined}
              onClick={() => {
                selectItem(item.id);
                tancaPanells();
              }}
            >
              <span>{item.title}</span>
              {item.subtitle ? <span>{item.subtitle}</span> : null}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function DetailColumn({ renderDetail }) {
  const workspace = useWorkspace();
  if (workspace.status === 'loading') return <p role="status">Carregant…</p>;
  if (workspace.status === 'error') return <p role="alert">No s’han pogut carregar les dades.</p>;
  if (!workspace.activeItem) return <p>Selecciona un element.</p>;
  return renderDetail({
    item: workspace.activeItem,
    selection: {
      categoryId: workspace.state.activeCategoryId,
      itemId: workspace.state.activeItemId
    }
  });
}
```

Este JSX és intencionadament lògic i sense CSS. En integrar-lo, `CategoryColumn` i `ItemListColumn` han d’usar `AppGridColumn` i les classes/tokens canònics ja existents; no s’ha de crear una segona capa visual.

## 9. Adaptador de Notes

```jsx
// src/sections/notes/NotesSection.jsx
const toWorkspaceNote = (note) => ({
  id: String(note.id),
  categoryIds: [String(note.folderId ?? 'f-notes')],
  kind: 'note',
  title: note.title || 'Sense títol',
  subtitle: note.formattedDate,
  tags: note.tags || [],
  searchText: note.searchText,
  revision: note.revision,
  updatedAt: note.updatedAt,
  data: note
});

function NotesSectionInner({ notaInicialId }) {
  const {
    status, notes, noteFolders, creaNota,
    obriConfiguracioNotes, informaError
  } = useNotes();
  const [params, setParams] = useSearchParams();

  const model = useMemo(() => ({
    status,
    categories: noteFolders
      .filter((folder) => String(folder.id) !== 'f-tot')
      .map((folder, order) => ({
      id: String(folder.id),
      label: folder.name,
      order
      })),
    items: notes.map(toWorkspaceNote)
  }), [status, noteFolders, notes]);

  const handleSelectionChange = useCallback(({ itemId }, meta) => {
    const current = params.get('nota');
    if ((current ?? null) === (itemId ?? null)) return;

    const next = new URLSearchParams(params);
    if (itemId == null) next.delete('nota');
    else next.set('nota', String(itemId));
    setParams(next);
    // El Router haurà d’acceptar replace/push: user → push;
    // reconcile/create → replace; external sync → cap eco.
  }, [params, setParams]);

  return (
    <UniversalWorkspace
      model={model}
      initialSelection={{ itemId: notaInicialId ?? undefined }}
      selection={{ itemId: params.get('nota') ?? undefined }}
      onSelectionChange={handleSelectionChange}
      onCreate={async ({ activeCategoryId }) => {
        const input = activeCategoryId === '__all__'
          ? {}
          : { folderId: activeCategoryId };
        const created = await creaNota(input);
        return toWorkspaceNote(created);
      }}
      onCreateError={informaError}
      onManageCategories={obriConfiguracioNotes}
      labels={{ categories: 'CARPETES', items: 'NOTES', create: 'CREAR NOTA' }}
      renderDetail={({ item }) => <NotesEditor activeNote={item.data} />}
    />
  );
}
```

Responsabilitats que continuen en Notes:

- Sanitització del contingut.
- Esborrany local i cua offline.
- Guardat, publicació i conflictes.
- Pujada d’imatges.
- Conversió entre DTO intern i forma de Supabase.

`NotesProvider` haurà d’exposar també `status` de `NotesDataContext`; sense distingir `loading` de `ready`, un deep link pot ser descartat abans que arriben les dades.
`obriConfiguracioNotes` i `informaError` són comandos proposats: el primer satisfà el contracte de la roda dentada i el segon tradueix errors asíncrons a l’avisador del domini.

Cal triar **un vocabulari DTO canònic**. Ara conviuen `folderId/title/content` en el runtime i `carpetaId/titol/contingutHtml` en l’adaptador nou; eixa doble forma no ha d’arribar al workspace.

## 10. Adaptador del catàleg de Disseny

El registre necessita IDs explícits i una clau de detall. No s’han de derivar IDs permanents del text visible.

```js
// src/sections/disseny/cataleg/manifest.js
export const CATALOG_CATEGORIES = [
  { id: 'fonaments', label: 'Fonaments', order: 10 },
  { id: 'estructura', label: 'Estructura', order: 20 },
  { id: 'formularis', label: 'Formularis', order: 30 }
];

export const CATALOG_ITEMS = [
  {
    id: 'formularis-boto',
    categoryIds: ['formularis'],
    kind: 'component-doc',
    title: 'Boto',
    subtitle: 'PedraSeca/atoms/Boto.jsx',
    tags: ['àtom', 'acció', 'accessible'],
    searchText: 'boto atom accio accessible',
    detailKey: 'formularis/boto',
    status: 'viu'
  }
];

// Taula explícita de compatibilitat; no s’assumeix que una pàgina legacy
// siga automàticament una categoria o un espècimen modern.
export const LEGACY_PAGE_TARGETS = {
  fonaments: { categoryId: 'fonaments', itemId: 'fonaments-overview' },
  estructura: { categoryId: 'estructura', itemId: 'estructura-overview' },
  formularis: { categoryId: 'formularis', itemId: 'formularis-overview' }
};
```

El codi executable queda en un registre separat i no serialitzable:

```jsx
// src/sections/disseny/cataleg/detailRegistry.jsx
import { lazy } from 'react';

export const CATALOG_DETAIL_LOADERS = {
  'formularis/boto': lazy(() => import('./detalls/EspecimenBoto.jsx')),
  'estructura/app-grid': lazy(() => import('./detalls/EspecimenAppGrid.jsx'))
};
```

```jsx
// src/sections/disseny/DesignSection.jsx
import { Suspense, useCallback, useMemo } from 'react';

function CatalogDetail({ item }) {
  const Detail = CATALOG_DETAIL_LOADERS[item.detailKey];
  if (!Detail) return <p>Espècimen encara no migrat.</p>;

  return (
    <UniversalPage
      chrome="context"
      title={item.title}
      subtitle={item.subtitle}
    >
      <Suspense fallback={<Carregant etiqueta="Carregant l’espècimen…" />}>
        <Detail />
      </Suspense>
    </UniversalPage>
  );
}

export default function DesignSection() {
  const [params, setParams] = useSearchParams();
  const legacy = LEGACY_PAGE_TARGETS[params.get('pagina')] || null;
  const categoryId = params.get('categoria')
    ?? legacy?.categoryId
    ?? 'fonaments';
  const itemId = params.get('item')
    ?? legacy?.itemId
    ?? undefined;
  const model = useMemo(() => ({
    status: 'ready',
    categories: CATALOG_CATEGORIES,
    items: CATALOG_ITEMS
  }), []);

  const handleSelectionChange = useCallback((selection, meta) => {
    const currentCategory = params.get('categoria');
    const currentItem = params.get('item');
    if (
      currentCategory === selection.categoryId
      && (currentItem ?? null) === (selection.itemId ?? null)
      && !params.has('pagina')
    ) return;

    const next = new URLSearchParams(params);
    next.set('categoria', selection.categoryId);
    if (selection.itemId == null) next.delete('item');
    else next.set('item', String(selection.itemId));
    next.delete('pagina');
    setParams(next);
    // Igual que Notes: el router ha de diferenciar push d’usuari i
    // replace de reconciliació; la selecció externa no torna a emetre.
  }, [params, setParams]);

  return (
    <UniversalWorkspace
      model={model}
      initialSelection={{ categoryId, itemId }}
      selection={{ categoryId, itemId }}
      onSelectionChange={handleSelectionChange}
      labels={{ categories: 'ÀREES', items: 'COMPONENTS', create: 'CREAR' }}
      renderDetail={({ item }) => <CatalogDetail item={item} />}
    />
  );
}
```

Migració segura del catàleg:

1. Afegir `id`, `tags` i `detailKey` a `REGISTRE` sense eliminar els camps que usa `tractor-cataleg.mjs`.
2. Fer que `PAGINES` derive de `CATALOG_CATEGORIES`.
3. Crear els ítems transitoris `*-overview` referenciats per `LEGACY_PAGE_TARGETS`.
4. Extraure `DesignSectionContent.jsx` gradualment: un espècimen per mòdul.
5. Durant la transició, un loader pot obrir una pàgina legacy sencera; no cal una migració “big bang”.
6. Actualitzar el gate perquè valide IDs únics, categoria existent i `detailKey` resoluble.

## 11. Flux de dades entre columnes

### Selecció

1. La columna 1 envia `category/select`.
2. El selector deriva els ítems de la categoria i la columna 2 es torna a renderitzar.
3. La columna 2 envia `item/select`.
4. El context resol `activeItem` per ID.
5. La columna 3 rep l’ítem a través de `renderDetail`.

### Edició

1. `NotesEditor` rep la nota activa.
2. L’edició local crida `NotesContext`, no `UniversalWorkspace`.
3. `NotesContext` actualitza l’esborrany i el repositori de dades.
4. La font `notes` emet una nova versió del mateix ID.
5. El descriptor de l’ítem canvia, però `activeItemId` continua estable; no es perd la selecció.

### Cerca i etiquetes

1. `query/set` i `tag/toggle` només modifiquen filtres.
2. `filteredItems` es deriva amb `useMemo`.
3. La columna 2 canvia, però la columna 3 no salta automàticament a un altre document.

### Creació

1. La columna 2 crida `onCreate` amb la categoria activa.
2. El repositori crea l’ítem i l’incorpora a la seua font abans de resoldre.
3. `UniversalWorkspace` marca l’ID retornat com a selecció pendent i no el reconcilia com a “esborrat” mentre arriba la nova projecció.
4. La columna 3 obri el nou document.

La selecció pendent necessita límit temporal/cancel·lació i un error visible si l’ítem no arriba; no pot quedar bloquejada indefinidament.

## 12. Persistència actual i futur CRDT

### Realitat actual

La taula `notes` usa una columna `revision` i un `PATCH ... &revision=eq.N`. Açò és **bloqueig optimista**, no un CRDT. Detecta un conflicte, però no fusiona edicions concurrents. A més, dos guardats de camps llançats alhora pel mateix client poden competir per la mateixa revisió si no hi ha una cua per nota.

Altres límits observats:

- l’overlay d’esborrany actual usa emmagatzematge efímer de sessió; no és un outbox durable i, a més, la restauració fa un segon `JSON.parse` encara que `getEfimer` ja ha deserialitzat el valor;
- `loadNotes()` fusiona `app_content`, files de `notes` i `section_submissions`, de manera que abans d’un CRDT cal declarar una única font autoritativa;
- el filtre de revisió actual s’omet si `expectedRevision` val `0`, perquè es comprova com a booleà;
- el límit de 50 notes de la càrrega actual no és un protocol de sincronització ni substitueix un cursor.

Per a la Fase 1 és acceptable si s’afegeix:

- una cua/debounce de guardat per nota;
- actualització del snapshot confirmat;
- davant d’un `409`, carregar la revisió actual, reconciliar o rebasar el canvi i només llavors reintentar; mai fer un reintent cec;
- tests de respostes fora d’ordre.

El debounce redueix peticions, però no substitueix la cua: tots els camps d’una mateixa nota s’han de serialitzar i cada operació ha d’usar la revisió retornada per l’anterior.

`localStorage` només ha de guardar preferències menudes. Una futura cua d’edició o oplog ha d’anar a IndexedDB.
IndexedDB és una memòria cau/outbox de resiliència transitòria; Supabase continua sent l’autoritat online, no es crea una segona font de veritat independent.

### Esquema CRDT hipotètic

No s’ha d’implementar fins a escollir formalment el CRDT. L’esquema següent és un **placeholder causal**: `causal_meta` canviarà segons el motor elegit (heads/deps, vector d’estat o equivalent), i `engine` + `codec_version` impediran barrejar formats incompatibles.

```sql
-- public.notes continua sent la projecció ràpida per a llista, cerca i RLS.
-- title/content poden mantindre compatibilitat durant la migració.

create table public.note_crdt_documents (
  note_id uuid primary key references public.notes(id) on delete restrict,
  engine text not null,
  codec_version smallint not null,
  causal_meta jsonb not null default '{}'::jsonb,
  snapshot bytea,
  snapshot_seq bigint not null default 0,
  schema_version smallint not null default 1,
  projection_seq bigint not null default 0,
  updated_at timestamptz not null default now()
);

create table public.note_crdt_changes (
  note_id uuid not null references public.notes(id) on delete restrict,
  change_id text not null,
  actor_id uuid not null,
  replica_id uuid not null,
  replica_seq bigint not null,
  causal_meta jsonb not null default '{}'::jsonb,
  change_bytes bytea not null,
  engine text not null,
  codec_version smallint not null,
  schema_version smallint not null default 1,
  server_seq bigint generated always as identity,
  created_at timestamptz not null default now(),
  primary key (note_id, change_id),
  unique (note_id, replica_id, replica_seq),
  unique (server_seq)
);

create index note_crdt_changes_order
  on public.note_crdt_changes(note_id, server_seq);
```

Invariants:

- Els canvis són append-only i idempotents per `change_id`.
- Un `change_id` repetit ha de portar exactament els mateixos bytes; si no, és corrupció i es rebutja. Idealment és un hash verificable del canvi.
- `(note_id, replica_id, replica_seq)` és únic i l’RPC valida que siga monòton; `UNIQUE` a soles no imposa monotonia. `replica_id` identifica una instal·lació, no només una persona.
- `causal_meta` identifica el context conegut. Si falta una dependència, l’RPC respon `missing_deps`; la projecció i els caps no avancen fins a completar-la.
- El snapshot és una compactació. Es poden podar canvis fins a `snapshot_seq` només si conserva el context causal necessari per aplicar canvis antics; un *squash* necessita epoch i protocol de rebase.
- Les dues taules necessiten RLS pròpia; una FK no hereta polítiques. L’accés es valida unint amb `notes`, i `INSERT` passa per RPC. `UPDATE/DELETE` directe sobre canvis queda revocat.
- Tenant, propietat i autoria es deriven/validen contra `notes` i la sessió; no es confia en el payload del client.
- `schema_version` és obligatori i una operació futura desconeguda es rebutja explícitament.
- `server_seq` només ordena transport i paginació **per nota**; mai decideix el guanyador d’un conflicte CRDT i els salts són normals.
- El text ric no es fusiona com una cadena HTML sencera. Cal un tipus seqüencial/blocs del CRDT elegit.
- Les etiquetes poden ser un OR-Set; carpeta i metadades simples poden usar LWW amb rellotge lògic i desempat per actor; l’esborrat necessita tombstone.
- Els fitxers adjunts són objectes immutables referenciats per ID/hash, no bytes dins del CRDT.

Flux offline futur:

1. L’editor aplica una operació local i actualitza la vista immediatament.
2. L’operació s’escriu a IndexedDB abans de considerar-la pendent d’enviament.
3. En recuperar xarxa, el client envia canvis idempotents junt amb el seu cursor `server_seq` per nota.
4. El servidor valida i insereix l’operació. Només actualitza la projecció en la mateixa transacció si hi ha un reductor autoritatiu d’eixe motor al servidor; altrament, un worker la calcula i `projection_seq` fa visible el retard. Mai s’accepta com a autoritativa una projecció calculada pel client.
5. El servidor retorna ACKs, rebuigs explícits i els canvis posteriors al cursor; Realtime només avisa que cal fer `pull`.
6. El client desa canvis i cursor en una única transacció IndexedDB, fusiona, actualitza el seu context causal i recalcula la projecció per a la llista.
7. Un procés de compactació genera snapshots sense destruir l’oplog encara necessari. Si el cursor és massa antic, el servidor torna snapshot + cursor nou.

Una nota creada offline usa un UUID del client. El primer sync passa per una RPC que crea, en una única transacció, la fila `notes` d’identitat/ACL i el primer canvi `note.create`, assignant tenant i propietari des de la sessió.

La progressió prudent del contingut és: primer oplog durable amb `document.replace` LWW (convergent però encara no col·laboratiu), després blocs amb IDs estables i, només si realment cal coedició dins del mateix paràgraf, un CRDT de text/arbre. L’HTML ha de ser una projecció de renderitzat, no la unitat de fusió.

Una publicació al Mur ha d’apuntar al snapshot/cursor concret que es va publicar. Les edicions posteriors de la nota no poden reescriure retroactivament la publicació.

El CRDT pertany al repositori de Notes. `UniversalWorkspace` només observa que l’ítem amb ID estable ha canviat.

## 13. Canvis mínims recomanats a `AppGridShell`

Sense tocar-ne el CSS en esta fase:

```jsx
<AppGridShell
  instanceId={optionalStableId} // si falta, el shell deriva un ID amb useId()
  storageKey="sdp-grid-widths" // explícit; compartit si es desitja
  leftCollapsed={...}
  middleCollapsed={...}
  leftColumn={...}
  middleColumn={...}
  rightColumn={...}
/>
```

Internament, el shell ha de sanititzar `instanceId ?? useId()` i derivar-ne els tres IDs i tots els `aria-controls`. Un prefix fix com `"notes"` no basta: dues instàncies de Notes tornarien a col·lidir.

La injecció actual `style={liveStyles}` s’ha de substituir en la fase visual per un mecanisme admés per la skill (per exemple, un `<style>` local acotat a l’ID únic), i el conflicte de scroll/fons s’ha de resoldre amb un dictamen explícit abans d’editar el CSS.

El context de `AppGridShell` continua sent responsable de `mida` i `panellObert`. El context del workspace no ha de duplicar eixe estat responsive.

## 14. Ordre d’implementació recomanat

0. **Gate Pedra Seca abans de funció:** catalogar `CategoryColumn`, `ItemListColumn`, capçaleres obertes/plegades, cerca oberta, buit, càrrega i error en `DesignSection`; no connectar APIs abans d’aprovar-ho.
1. **Tests de caracterització** de `UniversalWorkspace` actual i inventari de tots els consumidors de l’API antiga.
2. **Façana compatible o migració atòmica:** cap consumidor de Perfil/Admin pot quedar trencat pel nou contracte `model`.
3. **Fix de selecció i URL:** cerca/etiquetes no canvien l’editor; selecció controlable, hidratable i sincronitzable; ampliar el router per distingir `push`, `replace` i sincronització externa sense eco.
4. **Fix de creació:** estat pendent, `try/catch`, bloqueig de doble clic i selecció diferida de l’ítem retornat.
5. **Connectar plegat i flux mòbil** amb `AppGridShell`, `AppGridColumn` i `useAppGrid`.
6. **Eliminar API morta** de pàgina o implementar-la exclusivament dins del detall; preferible eliminar-la del motor.
7. **Afegir ID únic per instància** al shell i derivar-ne els `aria-controls`.
8. **Resoldre els deutes canònics visuals** (`style=`, scroll i fons) en la fase de Claude, amb gate explícit.
9. **Reparar l’esborrany efímer actual:** `getEfimer` ja deserialitza; Notes no ha de fer un segon `JSON.parse`, i `setEfimer` ha de rebre l’objecte directament.
10. **Migrar Notes** al descriptor normalitzat, respectant les carpetes canòniques, sense tocar encara el model de persistència.
11. **Normalitzar el manifest de Disseny** i conservar compatibilitat amb el gate.
12. **Migrar el catàleg per trossos** al workspace.
13. **Endurir el guardat revisionat** abans de plantejar CRDT.
14. **Dissenyar i provar el CRDT** en una fase pròpia, amb dos clients simulats i recuperació offline.

## 15. Criteris d’acceptació

- Notes i Disseny usen el mateix `UniversalWorkspace` i el mateix `AppGridShell`.
- Els estats nous han sigut prototipats i aprovats al catàleg abans de connectar funció o APIs.
- La façana antiga continua funcionant fins que Perfil/Admin i qualsevol altre consumidor hagen migrat.
- Cap fitxer del motor importa `src/sections/` ni el backend.
- Canviar cerca o tags no canvia la nota oberta.
- Crear una nota bloqueja el doble clic, tracta l’error asíncron i l’obri quan apareix a la font.
- Un canvi de `?nota=` o `?item=` després del muntatge actualitza la selecció.
- Un deep link no es descarta mentre les dades estan en `loading`.
- Les seleccions explícites usen historial `push`; reconciliacions internes usen `replace`; tornar arrere/endavant restaura categoria i ítem sense eco.
- Si l’ítem actiu s’elimina, el detall cau a un ítem vàlid o a estat buit.
- Dos workspaces no generen IDs DOM duplicats.
- La contradicció de scroll s’ha resolt en les fonts canòniques i el CSS compleix el dictamen; si preval Pedra Seca, només el visor desborda.
- `UniversalPage` no cobreix les tres columnes.
- No hi ha Tailwind ni dependències de UI noves.
- El registre del catàleg conserva la compatibilitat amb `tractor-cataleg.mjs` durant la migració.
- L’estat de domini i la persistència continuen fora del motor.

## 16. Conclusió

La peça arquitectònica no és un “bloc de notes” sinó un **controlador de navegació master-detail** amb tres projeccions. El repositori ja té les pedres principals; el treball de Fase 1 és alinear-les:

- `AppGridShell` = geometria i responsive.
- `UniversalWorkspace` = selecció, filtre i composició.
- adaptador de Notes = dades editables i persistència.
- adaptador de Disseny = manifest read-only i components vius.
- CRDT = capa futura del repositori de Notes, invisible per al workspace.

Esta separació permet que el mateix motor allotge després perfils, gestoria o qualsevol altre domini sense contaminar la infraestructura amb regles específiques.
