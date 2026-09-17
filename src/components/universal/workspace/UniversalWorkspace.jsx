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

function adaptLegacyContract(props) {
  const {
    items = [],
    facets = [],
    facetsTitle,
    getItemId,
    getItemSearchText,
    getItemCard,
    initialActiveFacets,
    onActionCreate,
    createLabel,
    renderEditor
  } = props;

  const model = {
    categories: facets.map(f => ({ id: f.id, label: f.label, order: 0 })),
    items: items.map(item => {
      const id = getItemId ? getItemId(item) : item.id;
      const card = getItemCard ? getItemCard(item) : item;
      return {
        id,
        categoryIds: typeof item.facets === 'function' ? item.facets() : (item.facets || card.facets || []),
        title: card.titol || card.title || '',
        subtitle: card.subtitol || card.subtitle || '',
        searchText: getItemSearchText ? getItemSearchText(item) : '',
        tags: card.tags || [],
        detailKey: id,
        _legacyItem: item
      };
    })
  };

  return {
    model,
    onCreate: onActionCreate,
    labels: { categories: facetsTitle || 'CATEGORIES', items: 'ELEMENTS', create: createLabel || 'NOU' },
    renderDetail: ({ item }) => {
       return renderEditor ? renderEditor(item._legacyItem) : null;
    }
  };
}
