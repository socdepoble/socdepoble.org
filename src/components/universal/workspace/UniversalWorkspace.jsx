import React, { useCallback, useMemo, useRef, useState, useEffect, memo } from 'react';
import { Search, Settings, SlidersHorizontal, Inbox, Bookmark, Hash, ChevronDown, ArrowDownAZ } from 'lucide-react';
import AppGridShell, { useAppGrid } from '../../layout/AppGridShell.jsx';
import AppGridColumn from '../../layout/AppGridColumn.jsx';
import { SlotErrorBoundary } from './SlotErrorBoundary.jsx';
import { WorkspaceProvider, useWorkspace } from './WorkspaceContext.jsx';
import { buildWorkspaceFolderForest } from './workspaceFolderForest.js';
import { ItemMedia } from './ItemMedia.jsx';
import { NavGlyph, GlifCategoriaContext, GLIF_DOCUMENT, emojiInicial, primerGlif } from './NavGlyph.jsx';
import { Dialeg, Boto } from '../../PedraSeca/index.js';
import { TEXTOS_LLAVOR } from '../textosLlavor.js';

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
  settings: 'Configuració de l’espai de treball',
  loading: 'Carregant…',
  error: 'No s’han pogut carregar les dades.',
  empty: 'No hi ha elements.',
  select: 'Selecciona un element.',
  untitled: TEXTOS_LLAVOR.titol
};

/* Amplàries predefinides de les columnes (AppGridShell.PRESETS). */
const PRESETS_AMPLARIA = Object.freeze([
  ['compacta', 'Compacta'],
  ['defecte', 'Per defecte'],
  ['ampla', 'Ampla']
]);

/**
 * Configuració pròpia de cada espai de treball, darrere de la roda dentada.
 * La roda és SEMPRE present (sdp-app-grid-shell §2; pla 260924_1710 §3.4):
 * si la secció no injecta la seua pròpia configuració, obri esta.
 */
function WorkspaceSettingsDialog({ obert, onTanca, labels }) {
  const { applyPreset, columnWidths } = useAppGrid();
  return (
    <Dialeg
      obert={obert}
      onTanca={onTanca}
      titol={labels.settings}
      mida="s"
      descripcio="Amplària de les columnes de navegació i de llistat. El tema clar o fosc es tria a la barra superior."
      accions={<Boto varietat="secundari" onClick={() => onTanca?.('boto')}>Fet</Boto>}
    >
      <div>
        <p className="sdp-workspace-settings__estat">
          Ara: navegació {columnWidths.left}px · llistat {columnWidths.middle}px
        </p>
        <div className="sdp-workspace-settings__opcions" role="group" aria-label="Amplària de columnes">
          {PRESETS_AMPLARIA.map(([id, text]) => (
            <Boto key={id} varietat="secundari" onClick={() => applyPreset(id)}>{text}</Boto>
          ))}
        </div>
      </div>
    </Dialeg>
  );
}

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
  collapsibleNavigation = true,
  replegaTotaCapcalera = false,
  sortable = false,
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
        collapsibleNavigation={collapsibleNavigation}
        replegaTotaCapcalera={replegaTotaCapcalera}
        sortable={sortable}
        canCreate={model.canCreate !== false}
        onRetry={model.refresh}
        listClassName={listClassName}
        detailClassName={detailClassName}
        className={className}
      />
    </WorkspaceProvider>
  );
}

function WorkspaceFrame({
  error, onCreate, onCreateError, onManageCategories, renderItem, renderDetail,
  labels, icons, tagFilter, collapsibleNavigation, replegaTotaCapcalera, sortable, canCreate, onRetry, listClassName, detailClassName, className
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
      className={`sdp-workspace ${className}`.trim()}
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
          collapsibleNavigation={collapsibleNavigation}
          replegaTotaCapcalera={replegaTotaCapcalera}
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
            sortable={sortable}
            replegaTotaCapcalera={replegaTotaCapcalera}
            canCreate={canCreate}
            onRetry={onRetry}
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
            resolution={workspace.itemResolution}
            onRetry={workspace.retryItemResolution}
          />
        </SlotErrorBoundary>
      }
    />
  );
}

/* ── Columna esquerra: navegació per grups (carpetes, categories, etiquetes…) ── */

function CategoryColumn({ collapsibleNavigation, replegaTotaCapcalera, focusTarget, onManageCategories, labels, icon, collapseBtnRef, expandBtnRef }) {
  const { navigationGroups, categories, state, selectCategory, toggleColumn } = useWorkspace();
  const { mida, setPanellObert, tancaPanells } = useAppGrid();
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  const toggleGroup = (id) => setCollapsedGroups(prev => ({ ...prev, [id]: !prev[id] }));

  const groupsToRender = useMemo(() => {
    const groups = navigationGroups?.length
      ? navigationGroups.map(group => ({
          ...group, options: categories.filter(category => category.groupId === group.id)
        }))
      : [{ id: 'default', label: null, options: categories }];
    return groups.map(group => ({ ...group, tree: buildWorkspaceFolderForest(group.options) }));
  }, [navigationGroups, categories]);

  const folderKey = (groupId, id) => JSON.stringify([groupId, id]);
  useEffect(() => {
    const ancestors = [];
    const activeGroups = [];
    for (const group of groupsToRender) {
      let node = group.tree.nodes.get(state.activeCategoryId);
      if (node) activeGroups.push(group.id);
      while (node?.parentId != null) {
        ancestors.push(folderKey(group.id, node.parentId));
        node = group.tree.nodes.get(node.parentId);
      }
    }
    setExpandedFolders(previous => new Set([...previous, ...ancestors]));
    setCollapsedGroups(previous => {
      const next = { ...previous };
      for (const id of activeGroups) delete next[id];
      return next;
    });
  }, [state.activeCategoryId, groupsToRender]);

  const toggleFolder = (key) => setExpandedFolders(previous => {
    const next = new Set(previous);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  });
  const openFolder = (key) => setExpandedFolders(previous => (
    previous.has(key) ? previous : new Set(previous).add(key)
  ));

  // El primer grup sense etiqueta es plega des de la mateixa capçalera de la columna;
  // la resta tenen la seua pròpia capçalera acordió.
  const headerGroup = groupsToRender.find((group) => !group.label) || null;
  const isGroupOpen = (id) => !collapsedGroups[id];

  const collapsed = state.collapsed.left && mida === 'ample';
  // La roda dentada no depén de cap secció: sense configuració injectada,
  // obri la de l'espai de treball (amplàries de columna).
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsActions = [
    ...(onManageCategories ? [{
      id: 'manage-categories',
      etiqueta: labels.manage,
      icona: SlidersHorizontal,
      onAcciona: onManageCategories
    }] : []),
    {
      id: 'settings',
      etiqueta: labels.settings,
      icona: Settings,
      onAcciona: () => setSettingsOpen(true)
    }
  ];
  const settingsDialog = (
    <WorkspaceSettingsDialog obert={settingsOpen} onTanca={() => setSettingsOpen(false)} labels={labels} />
  );

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

  // El nom d'una carpeta amb fills també la desplega: si no és l'activa, es
  // desplega i se selecciona; si ja ho és, el clic només la plega o la desplega,
  // sense tornar-la a triar (el document obert no canvia). El chevron continua
  // sent un interruptor que no selecciona.
  const chooseFolder = (categoryId, key) => {
    if (state.activeCategoryId === categoryId) {
      toggleFolder(key);
      return;
    }
    openFolder(key);
    chooseCategory(categoryId);
  };

  // El rail no plega mai res: una carpeta amb fills queda oberta per a quan
  // es torne a desplegar la columna i se selecciona si no ho estava; una
  // fulla se selecciona sempre, com a l'arbre.
  const chooseFromRail = (group, category) => {
    if (!category.children.length) {
      chooseCategory(category.id);
      return;
    }
    openFolder(folderKey(group.id, category.id));
    if (state.activeCategoryId !== category.id) chooseCategory(category.id);
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
          controls={replegaTotaCapcalera ? 'app-grid-sidebar' : undefined}
          onReplega={() => {
            toggleColumn('left');
            focusAfterLayout(collapseBtnRef);
          }}
        >
          <CategoryRail
            groups={groupsToRender}
            activeId={state.activeCategoryId}
            onChoose={chooseFromRail}
            label={labels.categories}
          />
        </AppGridColumn>
        {settingsDialog}
      </aside>
    );
  }

  return (
    <aside className="sdp-workspace-column" aria-label={labels.categories}>
      {settingsDialog}
      <AppGridColumn
        esDark={true}
        titol={labels.categories}
        icona={icon}
        plegable={collapsibleNavigation && Boolean(headerGroup)}
        obert={headerGroup ? isGroupOpen(headerGroup.id) : true}
        onPlega={headerGroup ? () => toggleGroup(headerGroup.id) : null}
        collapseBtnRef={collapseBtnRef}
        replegaTotaCapcalera={replegaTotaCapcalera && mida === 'ample'}
        controls={replegaTotaCapcalera ? 'app-grid-sidebar' : undefined}
        onReplega={() => {
          toggleColumn('left');
          focusAfterLayout(expandBtnRef);
        }}
      />
      <AppGridColumn
        esDark="intens"
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
                <div className="sdp-workspace-group-heading">
                  <button
                    type="button"
                    className="sdp-workspace-nav-item"
                    onClick={() => toggleGroup(group.id)}
                    aria-expanded={isGroupOpen(group.id)}
                  >
                    <span className="sdp-workspace-nav-item__label">{group.label}</span>
                    <span className="sdp-workspace-group-chevron">
                      <ChevronDown size={18} aria-hidden="true" focusable="false" />
                    </span>
                  </button>
                </div>
              )}
              {isGroupOpen(group.id) && (
                <CategoryBranch
                  nodes={group.tree.roots}
                  group={group}
                  activeId={state.activeCategoryId}
                  expandedFolders={expandedFolders}
                  toggleFolder={toggleFolder}
                  chooseCategory={chooseCategory}
                  chooseFolder={chooseFolder}
                  label={group.label || labels.categories}
                />
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

/* Glif declarat d'una categoria: el propi, el del grup o el del tipus de grup
   (emoji o component). Null si no en declara cap: l'arbre i el rail hi posen
   la carpeta per defecte; la fitxa d'un document, la seua inicial. */
function glifDeclarat(category, group) {
  const tipus = group?.id ?? category?.groupId;
  const glifDelTipus = Object.prototype.hasOwnProperty.call(KIND_ICONS, tipus) ? KIND_ICONS[tipus] : null;
  return primerGlif(category?.icon, group?.icon, glifDelTipus);
}

/* Rail de la columna de navegació plegada: un botó d'icona per cada carpeta o
   categoria de primer nivell, grup a grup, amb el mateix gestor de selecció
   que l'arbre. Una arrel que conté la selecció (una subcarpeta activa) es
   declara aria-current="true"; l'activa exacta, "page", com a l'arbre. */
function CategoryRail({ groups, activeId, onChoose, label }) {
  const grups = groups.filter(group => group.tree.roots.length > 0);
  if (!grups.length) return null;
  return (
    <nav className="sdp-workspace-rail" aria-label={label}>
      {grups.map(group => {
        let arrelActiva = group.tree.nodes.get(activeId) || null;
        while (arrelActiva?.parentId != null) arrelActiva = group.tree.nodes.get(arrelActiva.parentId) || null;
        return (
          <ul key={group.id} className="sdp-workspace-rail__grup" aria-label={group.label || label}>
            {group.tree.roots.map(category => {
              const actual = activeId === category.id
                ? 'page'
                : arrelActiva?.id === category.id ? 'true' : undefined;
              return (
                <li key={category.id}>
                  <button
                    type="button"
                    className="sdp-workspace-rail__boto"
                    aria-label={category.label}
                    title={category.label}
                    aria-current={actual}
                    onClick={() => onChoose(group, category)}
                  >
                    <NavGlyph glyph={glifDeclarat(category, group)} size={20} />
                  </button>
                </li>
              );
            })}
          </ul>
        );
      })}
    </nav>
  );
}

function CategoryBranch({ nodes, group, activeId, expandedFolders, toggleFolder, chooseCategory, chooseFolder, label }) {
  return (
    <ul className="sdp-workspace-categories" aria-label={label}>
      {nodes.map(category => {
        const key = JSON.stringify([group.id, category.id]);
        const expanded = expandedFolders.has(key);
        const hasChildren = category.children.length > 0;
        return (
          <li key={category.id}>
            <div className="sdp-workspace-folder-row">
              {/* Amb fills, el nom també desplega: declara l'expansió igual que el chevron. */}
              <button
                type="button"
                aria-current={activeId === category.id ? 'page' : undefined}
                aria-expanded={hasChildren ? expanded : undefined}
                className="sdp-workspace-nav-item"
                onClick={() => (hasChildren ? chooseFolder(category.id, key) : chooseCategory(category.id))}
              >
                {/* Emoji o component: el resol NavGlyph (un emoji en text ja no peta). */}
                <span className="sdp-workspace-nav-item__icon" aria-hidden="true">
                  <NavGlyph glyph={glifDeclarat(category, group)} size={18} />
                </span>
                <span className="sdp-workspace-nav-item__label">{category.label}</span>
              </button>
              {hasChildren ? (
                <button
                  type="button"
                  className="sdp-workspace-nav-item sdp-workspace-folder-toggle"
                  aria-label={`${expanded ? 'Plegar' : 'Desplegar'} ${category.label}`}
                  aria-expanded={expanded}
                  onClick={() => toggleFolder(key)}
                >
                  <ChevronDown size={18} aria-hidden="true" focusable="false" />
                </button>
              ) : (
                <div className="sdp-workspace-folder-toggle-spacer" aria-hidden="true" />
              )}
            </div>
            {expanded && hasChildren && (
              <CategoryBranch
                nodes={category.children} group={group} activeId={activeId}
                expandedFolders={expandedFolders} toggleFolder={toggleFolder}
                chooseCategory={chooseCategory} chooseFolder={chooseFolder} label={category.label}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ── Columna central: cerca, filtres i llistat ── */

function ItemListColumn({
  rootRef, detailFocusRef, onCreate, onCreateError, renderItem, labels, icon,
  tagFilter, sortable, replegaTotaCapcalera, canCreate, onRetry, listClassName, collapseBtnRef, expandBtnRef
}) {
  const {
    items, categories, navigationGroups, state, status, filteredItems, selectItem, requestItem,
    toggleColumn, setQuery, clearFilters, openSearch, closeSearch, toggleTag
  } = useWorkspace();
  const { mida, tancaPanells } = useAppGrid();
  const [creating, setCreating] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sortOpen, setSortOpen] = useState(false);
  const sortedItems = useMemo(() => !sortable ? filteredItems : [...filteredItems].sort((a, b) =>
    sortBy === 'name' ? (a.title || '').localeCompare(b.title || '', 'ca')
      : (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0)
  ), [filteredItems, sortable, sortBy]);
  const collapsed = state.collapsed.middle && mida === 'ample';

  // Glif de categoria de cada document (per a la fitxa sense imatge i el rail):
  // primer el de la categoria activa, si el document hi pertany; després, el
  // de la primera categoria seua que en declare un.
  const categoryById = useMemo(() => new Map(categories.map(category => [category.id, category])), [categories]);
  const groupById = useMemo(() => new Map((navigationGroups || CAP).map(group => [group.id, group])), [navigationGroups]);
  const glifDeCategoria = useCallback((item) => {
    const ids = item?.categoryIds || CAP;
    const ordre = ids.includes(state.activeCategoryId) ? [state.activeCategoryId, ...ids] : ids;
    for (const id of ordre) {
      const category = categoryById.get(String(id));
      const glif = category ? glifDeclarat(category, groupById.get(category.groupId)) : null;
      if (glif) return glif;
    }
    return null;
  }, [categoryById, groupById, state.activeCategoryId]);

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
    const railVisible = status !== 'loading' && status !== 'error';
    return (
      <aside ref={rootRef} tabIndex={-1} className="sdp-workspace-column" aria-label={labels.items}>
        <AppGridColumn
          variant="collapsed"
          esDark="intens"
          titol={labels.items}
          endActions={searchActions}
          expandBtnRef={expandBtnRef}
          controls={replegaTotaCapcalera ? 'app-grid-list' : undefined}
          onReplega={() => {
            toggleColumn('middle');
            focusAfterLayout(collapseBtnRef);
          }}
        >
          {railVisible ? (
            <DocumentRail
              items={sortedItems}
              activeItemId={state.activeItemId}
              glifDeCategoria={glifDeCategoria}
              onChoose={chooseItem}
              label={labels.items}
              untitled={labels.untitled}
            />
          ) : null}
        </AppGridColumn>
      </aside>
    );
  }

  return (
    <aside ref={rootRef} tabIndex={-1} className="sdp-workspace-column" aria-label={labels.items}>
      <AppGridColumn
        esDark={true}
        titol={labels.items}
        icona={icon}
        collapseBtnRef={collapseBtnRef}
        replegaTotaCapcalera={replegaTotaCapcalera && mida === 'ample'}
        controls={replegaTotaCapcalera ? 'app-grid-list' : undefined}
        onReplega={() => {
          toggleColumn('middle');
          focusAfterLayout(expandBtnRef);
        }}
      />
      <AppGridColumn
        esDark="intens"
        startActions={searchActions}
        endActions={[
          ...(sortable ? [{ 
            id: 'sort', 
            etiqueta: 'Ordenar per data o nom', 
            icona: ArrowDownAZ, 
            iconSize: 20,
            pressed: sortOpen, 
            className: 'sdp-workspace-sort-action',
            onAcciona: () => setSortOpen(value => !value) 
          }] : []),
          /* Sense `onCreate` no hi ha res a crear: un botó mut és un fantasma
             (Disseny i Wiki en pintaven un de desactivat). */
          ...(canCreate && onCreate ? [{
            id: 'create',
            etiqueta: labels.create,
            label: creating ? labels.creating : labels.create,
            variant: 'primary',
            desactivat: status !== 'ready' || creating,
            onAcciona: createAndSelect
          }] : [])
        ]}
      />

      {sortable && sortOpen && (
        <div className="sdp-workspace-sort-menu">
          <div className="sdp-workspace-sort-menu__title">Ordenar notes per</div>
          <button type="button" className={`sdp-workspace-sort-menu__option ${sortBy === 'date' ? 'active' : ''}`} onClick={() => { setSortBy('date'); setSortOpen(false); }}>
            Data d'actualització
          </button>
          <button type="button" className={`sdp-workspace-sort-menu__option ${sortBy === 'name' ? 'active' : ''}`} onClick={() => { setSortBy('name'); setSortOpen(false); }}>
            Nom (A-Z)
          </button>
        </div>
      )}
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
        {status === 'loading' || (status === 'revalidating' && !filteredItems.length) ? (
          <p className="sdp-workspace-state" role="status" aria-live="polite">{labels.loading}</p>
        ) : status === 'error' ? (
          <div className="sdp-workspace-state" role="alert">{labels.error}{onRetry && <button type="button" onClick={onRetry}>Reintentar</button>}</div>
        ) : filteredItems.length ? (
          // Les fitxes sense imatge (també les injectades amb renderItem) hi
          // troben el glif de la seua categoria via ItemMedia.
          <GlifCategoriaContext.Provider value={glifDeCategoria}>
            <ul className={`sdp-gestor-llista ${listClassName}`.trim()}>
              {sortedItems.map((item) => {
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
          </GlifCategoriaContext.Provider>
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

/* Rail de la columna de documents plegada: el glif de cada document visible
   (el propi, l'emoji del títol, el de la categoria o el document per defecte;
   mai una lletra). Clicar-lo obri el document, com la fitxa. */
function DocumentRail({ items, activeItemId, glifDeCategoria, onChoose, label, untitled }) {
  if (!items.length) return null;
  return (
    <nav className="sdp-workspace-rail sdp-workspace-rail--documents" aria-label={label}>
      <ul className="sdp-workspace-rail__grup">
        {items.map((item) => {
          const titol = item.title || untitled;
          return (
            <li key={item.id}>
              <button
                type="button"
                className="sdp-workspace-rail__boto"
                aria-label={titol}
                title={titol}
                aria-current={activeItemId === String(item.id) ? 'true' : undefined}
                onClick={() => onChoose(item.id)}
              >
                <NavGlyph
                  glyph={primerGlif(item.icon, emojiInicial(item.title), glifDeCategoria(item))}
                  fallback={GLIF_DOCUMENT}
                  size={20}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* ── Columna dreta: detall injectat ── */

const DetailColumn = memo(function DetailColumn({
  rootRef, error, renderDetail, labels, className, activeItem, status, activeCategoryId, activeItemId, resolution, onRetry
}) {
  let content;
  if (status === 'loading') {
    content = <p role="status">{labels.loading}</p>;
  } else if (status === 'error') {
    content = <p role="alert">{labels.error}</p>;
  } else if (resolution?.status === 'loading') {
    content = <p role="status">{labels.loading}</p>;
  } else if (resolution?.status === 'error') {
    content = <div role="alert">No s’ha pogut obrir l’element. <button type="button" onClick={onRetry}>Reintentar</button></div>;
  } else if (resolution?.status === 'not-found') {
    content = <p role="status">L’element no és accessible o ja no existix.</p>;
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
