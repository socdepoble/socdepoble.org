import { useMemo, useRef, useState } from 'react';
import { Search, Settings } from 'lucide-react';
import AppGridShell, { useAppGrid } from '../../layout/AppGridShell.jsx';
import AppGridColumn from '../../layout/AppGridColumn.jsx';
import { SlotErrorBoundary } from './SlotErrorBoundary.jsx';
import { WorkspaceProvider, useWorkspace } from './WorkspaceContext.jsx';

const DEFAULT_LABELS = {
  categories: 'CATEGORIES',
  items: 'ELEMENTS',
  create: 'CREAR',
  all: 'Tot',
  search: 'Cercar elements',
  empty: 'No hi ha elements.',
  select: 'Selecciona un element.'
};

function focusAfterLayout(ref) {
  if (typeof requestAnimationFrame !== 'function') {
    ref.current?.focus();
    return;
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(() => ref.current?.focus());
  });
}

export function UniversalWorkspace({
  model = {},
  initialSelection,
  selection,
  onSelectionChange,
  onCreate,
  onCreateError,
  onManageCategories,
  renderDetail,
  labels = {}
}) {
  const copy = { ...DEFAULT_LABELS, ...labels };

  return (
    <WorkspaceProvider
      navigationGroups={model.navigationGroups || []}
      categories={model.categories || []}
      items={model.items || []}
      status={model.status || 'ready'}
      initialSelection={initialSelection}
      selection={selection}
      onSelectionChange={onSelectionChange}
    >
      <WorkspaceFrame
        error={model.error || null}
        onCreate={onCreate}
        onCreateError={onCreateError}
        onManageCategories={onManageCategories}
        renderDetail={renderDetail}
        labels={copy}
      />
    </WorkspaceProvider>
  );
}

function WorkspaceFrame({ error, onCreate, onCreateError, onManageCategories, renderDetail, labels }) {
  const workspace = useWorkspace();
  const listFocusRef = useRef(null);
  const detailFocusRef = useRef(null);

  return (
    <AppGridShell
      aria-label="Espai de treball de tres columnes"
      leftTitle={labels.categories}
      middleTitle={labels.items}
      leftCollapsed={workspace.state.collapsed.left}
      middleCollapsed={workspace.state.collapsed.middle}
      leftColumn={
        <CategoryColumn
          focusTarget={listFocusRef}
          onManageCategories={onManageCategories}
          labels={labels}
        />
      }
      middleColumn={
        <SlotErrorBoundary domini="llista" resetKey={workspace.state.activeCategoryId}>
          <ItemListColumn
            rootRef={listFocusRef}
            detailFocusRef={detailFocusRef}
            onCreate={onCreate}
            onCreateError={onCreateError}
            labels={labels}
          />
        </SlotErrorBoundary>
      }
      rightColumn={
        <SlotErrorBoundary domini="detall" resetKey={workspace.activeItem?.id || '~buit'}>
          <DetailColumn
            rootRef={detailFocusRef}
            error={error}
            renderDetail={renderDetail}
            labels={labels}
          />
        </SlotErrorBoundary>
      }
    />
  );
}

function CategoryColumn({ focusTarget, onManageCategories, labels }) {
  const { navigationGroups, categories, state, selectCategory, toggleColumn } = useWorkspace();
  const { mida, setPanellObert, tancaPanells } = useAppGrid();

  const orderedCategories = useMemo(
    () => [...categories].sort((a, b) => (a.order || 0) - (b.order || 0)),
    [categories]
  );

  const groupsToRender = navigationGroups?.length > 0
    ? navigationGroups
    : [{ id: 'default', label: null, options: orderedCategories }];

  const collapsed = state.collapsed.left && mida === 'ample';
  const settingsActions = onManageCategories ? [{
    id: 'settings',
    etiqueta: 'Configurar categories',
    icona: Settings,
    onAcciona: onManageCategories
  }] : [];

  const chooseCategory = (categoryId) => {
    selectCategory(categoryId);
    if (mida === 'estret') {
      setPanellObert('middle');
      focusAfterLayout(focusTarget);
    } else {
      tancaPanells();
    }
  };

  if (collapsed) {
    return (
      <aside className="sdp-workspace-column" aria-label={labels.categories}>
        <AppGridColumn
          variant="collapsed"
          titol={labels.categories}
          endActions={settingsActions}
          onReplega={() => toggleColumn('left')}
        />
      </aside>
    );
  }

  return (
    <aside className="sdp-workspace-column" aria-label={labels.categories}>
      <AppGridColumn
        titol={labels.categories}
        endActions={settingsActions}
        onReplega={() => toggleColumn('left')}
      />
      <nav className="sdp-workspace-column__body" aria-label={labels.categories}>
        <div className="sdp-workspace-groups">
          <ul className="sdp-workspace-categories sdp-workspace-categories--all">
            <CategoryItem
              active={state.activeCategoryId === '__all__'}
              label={labels.all}
              onSelect={() => chooseCategory('__all__')}
            />
          </ul>
          {groupsToRender.map(group => (
            <div key={group.id} className="sdp-workspace-group">
              {group.label && <h3 className="sdp-workspace-group__title">{group.label}</h3>}
              <ul className="sdp-workspace-categories">
                {(group.options || []).map((category) => (
                  <CategoryItem
                    key={category.id}
                    active={state.activeCategoryId === String(category.id)}
                    label={category.label}
                    onSelect={() => chooseCategory(category.id)}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>
    </aside>
  );
}

function CategoryItem({ active, label, onSelect }) {
  return (
    <li>
      <button
        type="button"
        className="sdp-workspace-category"
        data-active={active ? 'true' : 'false'}
        aria-current={active ? 'page' : undefined}
        onClick={onSelect}
      >
        {label}
      </button>
    </li>
  );
}

function ItemListColumn({ rootRef, detailFocusRef, onCreate, onCreateError, labels }) {
  const {
    items, filteredItems, state, selectItem, requestItem, setQuery,
    toggleTag, clearFilters, openSearch, closeSearch, toggleColumn
  } = useWorkspace();
  const { mida, tancaPanells } = useAppGrid();
  const [creating, setCreating] = useState(false);
  const collapsed = state.collapsed.middle && mida === 'ample';

  const availableTags = useMemo(
    () => [...new Set(items.flatMap((item) => item.tags || []))].sort(),
    [items]
  );
  const hasFilters = Boolean(state.query || state.activeTagIds.length);

  const createAndSelect = async () => {
    if (!onCreate || creating) return;
    setCreating(true);
    try {
      const created = await onCreate({ activeCategoryId: state.activeCategoryId });
      if (created?.id != null) {
        requestItem(created.id);
        tancaPanells();
        if (mida === 'estret') focusAfterLayout(detailFocusRef);
      }
    } catch (error) {
      if (onCreateError) onCreateError(error);
      else console.error('[UniversalWorkspace] Error creant element:', error);
    } finally {
      setCreating(false);
    }
  };

  const chooseItem = (itemId) => {
    selectItem(itemId);
    tancaPanells();
    if (mida === 'estret') focusAfterLayout(detailFocusRef);
  };

  const searchActions = [{
    id: 'search',
    etiqueta: labels.search,
    icona: Search,
    onAcciona: () => {
      if (collapsed) toggleColumn('middle');
      openSearch();
    }
  }];

  if (collapsed) {
    return (
      <aside ref={rootRef} tabIndex={-1} className="sdp-workspace-column" aria-label={labels.items}>
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
    <aside ref={rootRef} tabIndex={-1} className="sdp-workspace-column" aria-label={labels.items}>
      <AppGridColumn
        titol={labels.items}
        endActions={[
          ...searchActions,
          ...(onCreate ? [{
            id: 'create',
            etiqueta: labels.create,
            label: creating ? 'CREANT…' : labels.create,
            variant: 'primary',
            desactivat: creating,
            onAcciona: createAndSelect
          }] : [])
        ]}
        onReplega={() => toggleColumn('middle')}
      />

      {state.searchOpen ? (
        <div className="sdp-workspace-search-row">
          <label className="sdp-workspace-search">
            <span className="sr-only">{labels.search}</span>
            <Search size={18} aria-hidden="true" />
            <input
              autoFocus
              type="search"
              value={state.query}
              placeholder={labels.search}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <button type="button" className="sdp-workspace-clear" onClick={closeSearch}>
            Tancar
          </button>
        </div>
      ) : null}

      {availableTags.length ? (
        <div className="sdp-workspace-tags" aria-label="Filtrar per etiquetes">
          {availableTags.map((tag) => {
            const active = state.activeTagIds.includes(String(tag));
            return (
              <button
                key={tag}
                type="button"
                className="sdp-workspace-tag"
                aria-pressed={active}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            );
          })}
          {hasFilters ? (
            <button type="button" className="sdp-workspace-clear" onClick={clearFilters}>
              Netejar
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="sdp-workspace-column__body">
        {filteredItems.length ? (
          <ul className="sdp-gestor-llista">
            {filteredItems.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="sdp-gestor-fitxa"
                  aria-current={state.activeItemId === String(item.id) ? 'true' : undefined}
                  onClick={() => chooseItem(item.id)}
                >
                  <ItemMedia item={item} />
                  <span className="sdp-gestor-fitxa__text">
                    <span className="sdp-gestor-fitxa__titol">{item.title || 'Sense títol'}</span>
                    {item.subtitle ? (
                      <span className="sdp-gestor-fitxa__subtitol">{item.subtitle}</span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="sdp-workspace-state">{labels.empty}</p>
        )}
      </div>
    </aside>
  );
}

function ItemMedia({ item }) {
  const Icon = item.icon;
  return (
    <span className="sdp-gestor-fitxa__media" aria-hidden="true">
      {item.image ? (
        <img className="sdp-gestor-fitxa__imatge" src={item.image} alt="" />
      ) : Icon ? (
        <Icon size={24} />
      ) : (
        <span className="sdp-gestor-fitxa__inicial">
          {String(item.title || '?').trim().charAt(0).toLocaleUpperCase('ca')}
        </span>
      )}
    </span>
  );
}

function DetailColumn({ rootRef, error, renderDetail, labels }) {
  const workspace = useWorkspace();

  let content;
  if (workspace.status === 'loading') {
    content = <p role="status">Carregant…</p>;
  } else if (workspace.status === 'error') {
    content = <p role="alert">No s’han pogut carregar les dades.</p>;
  } else if (!workspace.activeItem) {
    content = <p>{labels.select}</p>;
  } else {
    content = renderDetail?.({
      item: workspace.activeItem,
      selection: {
        categoryId: workspace.state.activeCategoryId,
        itemId: workspace.state.activeItemId
      }
    }) ?? null;
  }

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      className="sdp-workspace-detail"
      data-error={error ? 'true' : 'false'}
    >
      {content}
    </div>
  );
}

