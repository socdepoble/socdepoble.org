import React, { useMemo, useRef, useState, useEffect, memo } from 'react';
import { Search, Settings, Inbox, Folder, Bookmark, Hash } from 'lucide-react';
import AppGridShell, { useAppGrid } from '../../layout/AppGridShell.jsx';
import AppGridColumn from '../../layout/AppGridColumn.jsx';
import { SlotErrorBoundary } from './SlotErrorBoundary.jsx';
import { WorkspaceProvider, useWorkspace } from './WorkspaceContext.jsx';
import { useResolvedAsset } from '../../../hooks/useResolvedAsset.js';
import { ItemMedia } from './ItemMedia.jsx';

/**
 * UniversalWorkspace — esquelet genèric de tres columnes (navegació · llistat · detall).
 *
 * És 100% atòmic: no sap res del Bloc de Notes, de la Gestoria ni del Disseny.
 * Cada secció l'omple injectant:
 *   - `model`        → { status, error, navigationGroups | categories, items }
 *   - `labels`       → textos de capçaleres i botons
 *   - `icons`        → { categories, items } icones decoratives de cada capçalera
 *   - `renderItem`   → (opcional) targeta pròpia per a cada element del llistat
 *   - `renderDetail` → l'editor o visor de la columna dreta
 *   - `listClassName` / `detailClassName` → ganxos CSS per a la pell de la secció
 *
 * Si demà cal una «Gestoria», només canvia el que s'injecta; el JSX estructural no.
 */

const CAP = Object.freeze([]);
const SENSE_ICONES = Object.freeze({});

const DEFAULT_LABELS = {
  categories: 'CATEGORIES',
  items: 'ELEMENTS',
  create: 'CREAR',
  creating: 'CREANT…',
  all: 'Tot',
  search: 'Cercar elements',
  close: 'Tancar',
  clear: 'Netejar',
  tags: 'Filtrar per etiquetes',
  manage: 'Configurar categories',
  loading: 'Carregant…',
  error: 'No s’han pogut carregar les dades.',
  empty: 'No hi ha elements.',
  select: 'Selecciona un element.',
  untitled: 'Sense títol'
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
  renderItem,
  renderDetail,
  labels = {},
  icons = SENSE_ICONES,
  tagFilter = true,
  listClassName = '',
  detailClassName = '',
  className = ''
}) {
  const copy = { ...DEFAULT_LABELS, ...labels };

  return (
    <WorkspaceProvider
      key={model.workspaceKey}
      itemsComplete={model.itemsComplete}
      resolveItemId={model.resolveItemId}
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
        renderItem={renderItem}
        renderDetail={renderDetail}
        labels={copy}
        icons={icons}
        tagFilter={tagFilter}
        listClassName={listClassName}
        detailClassName={detailClassName}
        className={className}
      />
    </WorkspaceProvider>
  );
}

function WorkspaceFrame({
  error, onCreate, onCreateError, onManageCategories, renderItem, renderDetail,
  labels, icons, tagFilter, listClassName, detailClassName, className
}) {
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
      leftIcon={icons.categories}
      middleIcon={icons.items}
      leftCollapsed={workspace.state.collapsed.left}
      middleCollapsed={workspace.state.collapsed.middle}
      leftColumn={
        <CategoryColumn
          focusTarget={listFocusRef}
          onManageCategories={onManageCategories}
          labels={labels}
          icon={icons.categories}
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
            renderItem={renderItem}
            labels={labels}
            icon={icons.items}
            tagFilter={tagFilter}
            listClassName={listClassName}
            collapseBtnRef={collapseMiddleRef}
            expandBtnRef={expandMiddleRef}
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
            className={detailClassName}
            activeItem={workspace.activeItem}
            status={workspace.status}
            activeCategoryId={workspace.state.activeCategoryId}
            activeItemId={workspace.state.activeItemId}
          />
        </SlotErrorBoundary>
      }
    />
  );
}

/* ── Columna esquerra: navegació per grups (carpetes, categories, etiquetes…) ── */

function CategoryColumn({ focusTarget, onManageCategories, labels, icon, collapseBtnRef, expandBtnRef }) {
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

  // El primer grup sense etiqueta es plega des de la mateixa capçalera de la columna;
  // la resta tenen la seua pròpia capçalera acordió.
  const headerGroup = groupsToRender.find((group) => !group.label) || null;
  const isGroupOpen = (id) => !collapsedGroups[id];

  const collapsed = state.collapsed.left && mida === 'ample';
  const settingsActions = onManageCategories ? [{
    id: 'settings',
    etiqueta: labels.manage,
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
          esDark={true}
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
        esDark={true}
        titol={labels.categories}
        icona={headerGroup ? null : icon}
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
        esDark={true}
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
                      icon={category.icon || group.icon}
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

/* Icona per defecte segons el tipus de grup; cada opció o grup pot dur la seua. */
const KIND_ICONS = Object.freeze({ categories: Bookmark, tags: Hash });

const CategoryItem = memo(function CategoryItem({ active, label, icon, kind, onSelect }) {
  const Icon = icon || KIND_ICONS[kind] || Folder;
  return (
    <button
      type="button"
      role="menuitem"
      aria-current={active ? 'page' : undefined}
      className="sdp-workspace-nav-item"
      onClick={onSelect}
    >
      <span className="sdp-workspace-nav-item__icon" aria-hidden="true">
        <Icon size={18} focusable="false" />
      </span>
      <span className="sdp-workspace-nav-item__label">{label}</span>
    </button>
  );
});

/* ── Columna central: cerca, filtres i llistat ── */

function ItemListColumn({
  rootRef, detailFocusRef, onCreate, onCreateError, renderItem, labels, icon,
  tagFilter, listClassName, collapseBtnRef, expandBtnRef
}) {
  const {
    items, categories, state, status, filteredItems, selectItem, requestItem,
    toggleColumn, setQuery, clearFilters, openSearch, closeSearch, toggleTag
  } = useWorkspace();
  const { mida, tancaPanells } = useAppGrid();
  const [creating, setCreating] = useState(false);
  const collapsed = state.collapsed.middle && mida === 'ample';

  const availableTags = useMemo(
    () => (tagFilter ? [...new Set(items.flatMap((item) => item.tags || []))].sort() : CAP),
    [items, tagFilter]
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
        icona={icon}
        collapseBtnRef={collapseBtnRef}
        onReplega={() => {
          toggleColumn('middle');
          focusAfterLayout(expandBtnRef);
        }}
      />
      <AppGridColumn
        startActions={searchActions}
        endActions={onCreate ? [{
          id: 'create',
          etiqueta: labels.create,
          label: creating ? labels.creating : labels.create,
          variant: 'primary',
          desactivat: creating,
          onAcciona: createAndSelect
        }] : CAP}
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
            {labels.close}
          </button>
        </div>
      ) : null}

      {/* Les píndoles d'etiquetes només acompanyen la cerca: tancada, no ocupen espai. */}
      {state.searchOpen && availableTags.length ? (
        <div className="sdp-workspace-tags" aria-label={labels.tags}>
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
              {labels.clear}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="sdp-workspace-column__body">
        {status === 'loading' ? (
          <p className="sdp-workspace-state" role="status" aria-live="polite">{labels.loading}</p>
        ) : status === 'error' ? (
          <p className="sdp-workspace-state" role="alert">{labels.error}</p>
        ) : filteredItems.length ? (
          <ul className={`sdp-gestor-llista ${listClassName}`.trim()}>
            {filteredItems.map((item) => {
              const active = state.activeItemId === String(item.id);
              const onSelect = () => chooseItem(item.id);
              return (
                <li key={item.id}>
                  {renderItem
                    ? renderItem({ item, active, onSelect })
                    : <DefaultItemCard item={item} active={active} onSelect={onSelect} untitled={labels.untitled} />}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="sdp-workspace-state">{labels.empty}</p>
        )}
      </div>
    </aside>
  );
}

/* Targeta per defecte: mitjà (imatge · icona · inicial) + títol + subtítol. */
function DefaultItemCard({ item, active, onSelect, untitled }) {
  return (
    <button
      type="button"
      className="sdp-gestor-fitxa"
      aria-current={active ? 'true' : undefined}
      onClick={onSelect}
    >
      <ItemMedia item={item} titleFallback={untitled} />
      <span className="sdp-gestor-fitxa__text">
        <span className="sdp-gestor-fitxa__titol">{item.title || untitled}</span>
        {item.subtitle ? (
          <span className="sdp-gestor-fitxa__subtitol">{item.subtitle}</span>
        ) : null}
      </span>
    </button>
  );
}

/* ── Columna dreta: detall injectat ── */

const DetailColumn = memo(function DetailColumn({
  rootRef, error, renderDetail, labels, className, activeItem, status, activeCategoryId, activeItemId
}) {
  let content;
  if (status === 'loading') {
    content = <p role="status">{labels.loading}</p>;
  } else if (status === 'error') {
    content = <p role="alert">{labels.error}</p>;
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
      className={`sdp-workspace-detail ${className}`.trim()}
      data-error={error ? 'true' : 'false'}
    >
      {content}
    </div>
  );
});
