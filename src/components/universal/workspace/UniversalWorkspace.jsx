import React, { useMemo, useRef, useState, useEffect, memo } from 'react';
import { Search, Settings, Inbox, Folder, Bookmark, Hash } from 'lucide-react';
import AppGridShell, { useAppGrid } from '../../layout/AppGridShell.jsx';
import AppGridColumn from '../../layout/AppGridColumn.jsx';
import { SlotErrorBoundary } from './SlotErrorBoundary.jsx';
import { WorkspaceProvider, useWorkspace } from './WorkspaceContext.jsx';
import { useResolvedAsset } from '../../../hooks/useResolvedAsset.js';

const CAP = Object.freeze([]);

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
  labels = {},
  className = ''
}) {
  const copy = { ...DEFAULT_LABELS, ...labels };

  return (
    <WorkspaceProvider
      navigationGroups={model.navigationGroups ?? CAP}
      categories={model.categories ?? CAP}
      items={model.items ?? CAP}
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
        model={model}
        className={className}
      />
    </WorkspaceProvider>
  );
}

function WorkspaceFrame({ error, onCreate, onCreateError, onManageCategories, renderDetail, labels, model, className }) {
  const workspace = useWorkspace();
  const listFocusRef = useRef(null);
  const detailFocusRef = useRef(null);
  const collapseLeftRef = useRef(null);
  const expandLeftRef = useRef(null);
  const collapseMiddleRef = useRef(null);
  const expandMiddleRef = useRef(null);

  return (
    <AppGridShell
      aria-label="Espai de treball de tres columnes"
      className={className}
      leftTitle={labels.categories}
      middleTitle={labels.items}
      leftCollapsed={workspace.state.collapsed.left}
      middleCollapsed={workspace.state.collapsed.middle}
      leftColumn={
        <CategoryColumn
          focusTarget={listFocusRef}
          onManageCategories={onManageCategories}
          labels={labels}
          collapseBtnRef={collapseLeftRef}
          expandBtnRef={expandLeftRef}
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
            collapseBtnRef={collapseMiddleRef}
            expandBtnRef={expandMiddleRef}
            model={model}
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
            activeItem={workspace.activeItem}
            status={workspace.status}
            activeCategoryId={workspace.state.activeCategoryId}
            activeItemId={workspace.state.activeItemId}
            isNotesList={model?.presentation?.list === 'notes'}
          />
        </SlotErrorBoundary>
      }
    />
  );
}

function CategoryColumn({ focusTarget, onManageCategories, labels, collapseBtnRef, expandBtnRef }) {
  const { navigationGroups, categories, state, selectCategory, toggleColumn } = useWorkspace();
  const { mida, setPanellObert, tancaPanells } = useAppGrid();
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const toggleGroup = (id) => setCollapsedGroups(prev => ({ ...prev, [id]: !prev[id] }));

  const orderedCategories = useMemo(
    () => [...categories].sort((a, b) => (a.order || 0) - (b.order || 0)),
    [categories]
  );

  const groupsToRender = navigationGroups?.length > 0
    ? navigationGroups
    : [{ id: 'default', label: null, options: orderedCategories }];

  // El primer grup sense etiqueta es pleja des de la mateixa capçalera de la columna
  // (p. ex. «CARPETES» al Bloc de Notes); la resta tenen la seua pròpia capçalera acordió.
  const headerGroup = groupsToRender.find((group) => !group.label) || null;
  const isGroupOpen = (id) => !collapsedGroups[id];

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
      if (mida === 'mitja') focusAfterLayout(focusTarget);
    }
  };

  if (collapsed) {
    return (
      <aside className="sdp-workspace-column" aria-label={labels.categories}>
        <AppGridColumn
          variant="collapsed"
          titol={labels.categories}
          endActions={settingsActions}
          expandBtnRef={expandBtnRef}
          onReplega={() => {
            toggleColumn('left');
            focusAfterLayout(collapseBtnRef);
          }}
        />
      </aside>
    );
  }

  return (
    <aside className="sdp-workspace-column" aria-label={labels.categories}>
      <AppGridColumn
        titol={labels.categories}
        plegable={Boolean(headerGroup)}
        obert={headerGroup ? isGroupOpen(headerGroup.id) : true}
        onPlega={headerGroup ? () => toggleGroup(headerGroup.id) : null}
        collapseBtnRef={collapseBtnRef}
        onReplega={() => {
          toggleColumn('left');
          focusAfterLayout(expandBtnRef);
        }}
      />
      <AppGridColumn
        variant="transparent"
        startActions={[{
          id: 'all',
          etiqueta: labels.all,
          label: labels.all,
          icona: Inbox,
          variant: 'text',
          onAcciona: () => chooseCategory('__all__'),
          pressed: state.activeCategoryId === '__all__'
        }]}
        endActions={settingsActions}
      />
      <nav className="sdp-workspace-column__body" aria-label={labels.categories}>
        <div className="sdp-workspace-groups">
          {groupsToRender.map(group => (
            <div
              key={group.id}
              className="sdp-workspace-group"
              data-group={group.id}
              data-obert={isGroupOpen(group.id) ? 'true' : 'false'}
            >
              {group.label && (
                <AppGridColumn
                  variant="accordion"
                  titol={group.label}
                  plegable={true}
                  obert={isGroupOpen(group.id)}
                  onPlega={() => toggleGroup(group.id)}
                />
              )}
              {isGroupOpen(group.id) && (
                <div role="menu" className="sdp-workspace-categories" aria-label={group.label || labels.categories}>
                  {(group.options || []).map((category) => (
                    <CategoryItem
                      key={category.id}
                      active={state.activeCategoryId === String(category.id)}
                      label={category.label}
                      icon={category.icon}
                      kind={group.id}
                      onSelect={() => chooseCategory(String(category.id))}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>
    </aside>
  );
}

const KIND_ICONS = Object.freeze({ categories: Bookmark, tags: Hash });

const CategoryItem = memo(function CategoryItem({ active, label, icon, kind, onSelect, compact }) {
  // TODO: compact es rebrà des de CategoryColumn si escau, de moment es passa false en UniversalWorkspace.
  const Icon = icon || KIND_ICONS[kind] || Folder;
  return (
    <button
      role="menuitem"
      aria-current={active ? 'page' : undefined}
      className="sdp-bloc-nav-item"
      onClick={onSelect}
      title={compact ? label : undefined}
    >
      <span className="sdp-bloc-nav-item__icon" aria-hidden="true">
        <Icon size={18} focusable="false" />
      </span>
      {!compact && (
        <span className="sdp-bloc-nav-item__label">{label}</span>
      )}
    </button>
  );
});

function ItemListColumn({ rootRef, detailFocusRef, onCreate, onCreateError, labels, collapseBtnRef, expandBtnRef, model }) {
  const {
    items, categories, state, status, filteredItems, selectItem, requestItem,
    toggleColumn, setQuery, clearFilters, openSearch, closeSearch, toggleTag
  } = useWorkspace();
  const { mida, tancaPanells } = useAppGrid();
  const [creating, setCreating] = useState(false);
  const collapsed = state.collapsed.middle && mida === 'ample';

  const availableTags = useMemo(
    () => [...new Set(items.flatMap((item) => item.tags || []))].sort(),
    [items]
  );
  const hasFilters = Boolean(state.query || state.activeTagIds.length);

  const createGenerationRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    createGenerationRef.current += 1;
  }, [state.activeCategoryId, state.activeItemId]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const createAndSelect = async () => {
    if (!onCreate || creating) return;
    setCreating(true);
    
    createGenerationRef.current += 1;
    const currentGen = createGenerationRef.current;
    const catId = state.activeCategoryId;
    const category = categories.find(c => c.id === catId);

    try {
      const created = await onCreate({ activeCategoryId: catId, category });
      if (!mountedRef.current || createGenerationRef.current !== currentGen) return;
      if (created?.id != null) {
        requestItem(created.id);
        tancaPanells();
        if (mida === 'estret') focusAfterLayout(detailFocusRef);
      }
    } catch (error) {
      if (!mountedRef.current || createGenerationRef.current !== currentGen) return;
      if (onCreateError) onCreateError(error);
      else console.error('[UniversalWorkspace] Error creant element:', error);
    } finally {
      if (mountedRef.current) setCreating(false);
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
          endActions={searchActions}
          expandBtnRef={expandBtnRef}
          onReplega={() => {
            toggleColumn('middle');
            focusAfterLayout(collapseBtnRef);
          }}
        />
      </aside>
    );
  }

  return (
    <aside ref={rootRef} tabIndex={-1} className="sdp-workspace-column" aria-label={labels.items}>
      <AppGridColumn
        titol={labels.items}
        collapseBtnRef={collapseBtnRef}
        onReplega={() => {
          toggleColumn('middle');
          focusAfterLayout(expandBtnRef);
        }}
      />
      <AppGridColumn
        variant="transparent"
        startActions={searchActions}
        endActions={[
          ...(onCreate ? [{
            id: 'create',
            etiqueta: labels.create,
            label: creating ? 'CREANT…' : labels.create,
            variant: 'primary',
            desactivat: creating,
            onAcciona: createAndSelect
          }] : [])
        ]}
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

      {availableTags.length && !model?.navigationGroups?.some(g => g.id === 'tags') ? (
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
        {status === 'loading' ? (
          <p className="sdp-workspace-state" role="status" aria-live="polite">Carregant...</p>
        ) : status === 'error' ? (
          <p className="sdp-workspace-state" role="alert">Error de connexió.</p>
        ) : filteredItems.length ? (
          model.presentation?.list === 'notes' ? (
            <NotesItems items={filteredItems} activeId={state.activeItemId} onSelect={chooseItem} />
          ) : (
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
          )
        ) : (
          <p className="sdp-workspace-state">{labels.empty}</p>
        )}
      </div>
    </aside>
  );
}

/**
 * Targeta rica de nota: miniatura quadrada a l'esquerra; a la dreta el títol (H1),
 * la data de modificació i l'entradeta (excerpt). Prémer-la obri l'edició.
 */
function NotesItems({ items, activeId, onSelect }) {
  return (
    <div className="sdp-bloc-list--notes">
      <ul className="sdp-gestor-llista">
        {items.map(item => (
          <li key={item.id}>
            <button
              type="button"
              className="sdp-gestor-fitxa sdp-nota-fitxa"
              aria-current={activeId === String(item.id) ? 'true' : undefined}
              onClick={() => onSelect(item.id)}
            >
              <NoteThumb item={item} />
              <span className="sdp-gestor-fitxa__text sdp-nota-fitxa__text">
                <span className="sdp-nota-fitxa__capcalera">
                  <span className="sdp-gestor-fitxa__titol sdp-nota-fitxa__titol">{item.title || 'Sense títol'}</span>
                  {item.subtitle ? (
                    <time className="sdp-nota-fitxa__data" dateTime={item.updatedAt || undefined}>
                      {item.subtitle}
                    </time>
                  ) : null}
                </span>
                {item.excerpt ? (
                  <span className="sdp-gestor-fitxa__subtitol sdp-nota-fitxa__entradeta">{item.excerpt}</span>
                ) : null}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* Miniatura de la nota: resol referències sdp-media:// i cau a la inicial si no hi ha imatge. */
function NoteThumb({ item }) {
  const src = useResolvedAsset(item.image || '');
  return (
    <span className="sdp-gestor-fitxa__media sdp-nota-fitxa__media" aria-hidden="true">
      {src ? (
        <img className="sdp-gestor-fitxa__imatge" src={src} alt="" loading="lazy" />
      ) : (
        <span className="sdp-gestor-fitxa__inicial">
          {String(item.title || '?').trim().charAt(0).toLocaleUpperCase('ca')}
        </span>
      )}
    </span>
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

const DetailColumn = memo(function DetailColumn({ 
  rootRef, error, renderDetail, labels, activeItem, status, activeCategoryId, activeItemId, isNotesList
}) {
  // Eliminat robatori de focus (L444 original)

  let content;
  if (status === 'loading') {
    content = <p role="status">Carregant…</p>;
  } else if (status === 'error') {
    content = <p role="alert">No s’han pogut carregar les dades.</p>;
  } else {
    content = renderDetail?.({
      item: activeItem || null,
      selection: {
        categoryId: activeCategoryId,
        itemId: activeItemId
      }
    }) ?? (activeItem ? null : <p>{labels.select}</p>);
  }

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      className={`sdp-workspace-detail ${isNotesList ? 'sdp-workspace-detail--editor' : ''}`}
      data-error={error ? 'true' : 'false'}
    >
      {content}
    </div>
  );
});
