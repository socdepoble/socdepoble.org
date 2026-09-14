---
tipus: document
estat: esborrany
description: Mini-Bundle d'Arquitectura (Plantilla Enxufable) per a Z
---
# Mini-Bundle d'Arquitectura (Plantilla Enxufable) per a Z

Aquest és el codi real actual per a que pugues fer la passada de reconciliació (noms exactes i rutes).

## `src/components/universal/UniversalEditorShell.jsx`

```jsx
import { Image as ImageIcon, Lock, Globe } from 'lucide-react';
import { Dropdown } from '../ui/Dropdown';
import { DateTimeControl } from '../ui/controls';
import { sanitizeHtml } from '../../utils/sanitize.js';
import useHeroImageHandler from '../../hooks/useHeroImageHandler.js';
import React, { Component, useRef, useCallback, useEffect } from 'react';
import { useContent } from './ContentProvider.jsx';

// Error Boundary per protegir l'editor i evitar tombar la pàgina hoste
class EditorErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("EditorErrorBoundary:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="sdp-estat sdp-estat--error">
          <div className="sdp-estat__contenidor">
            <h3 className="sdp-estat__titol">L'editor ha fallat</h3>
            <p className="sdp-estat__descripcio">S'ha produït un error inesperat dins del motor d'edició. Torna a carregar la pàgina per a continuar.</p>
          </div>
        </div>
      );
    }
    return this.props.children; 
  }
}

export function EditableField({ html, placeholder, onChange, onBlur, className }) {
  if (html === null) return null;
  return (
    <span
      className={className}
      contentEditable
      suppressContentEditableWarning
      onInput={(e) => onChange?.(sanitizeHtml(e.currentTarget.innerHTML))}
      onBlur={(e) => onBlur?.(sanitizeHtml(e.currentTarget.innerHTML))}
      data-placeholder={placeholder}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html || '') }}
    />
  );
}

export function UniversalEditorShell({
  id,
  titleHtml,
  subtitleHtml,
  leadHtml,
  onSaveField,
  onLocalChange,
  heroImage,
  logoImage,
  topBar,
  children,
  labels,
  isPublished = false,
  onImageUpload = null,
  formattedTime,
  formattedDate,
  showStatusToggle = true,
  previewTitle = "Previsualitzar / Tancar",
  previewHelp = "No oblides desar els canvis.",
  onToast = (msg, type) => console.log(`[Toast ${type}] ${msg}`),
  className = ''
}) {
  const debounceTimeouts = useRef({});
  const onSaveFieldRef = useRef(onSaveField);
  const onLocalChangeRef = useRef(onLocalChange);

  onSaveFieldRef.current = onSaveField;
  onLocalChangeRef.current = onLocalChange;

  const flushField = useCallback((field) => {
    const pending = debounceTimeouts.current[field];
    if (!pending) return;

    clearTimeout(pending.timeoutId);
    delete debounceTimeouts.current[field];
    onSaveFieldRef.current?.(field, pending.value, pending.id);
  }, []);

  const handleFieldChange = useCallback((field, value) => {
    onLocalChangeRef.current?.(field, value, id);

    const previous = debounceTimeouts.current[field];
    if (previous) {
      clearTimeout(previous.timeoutId);
    }
    const timeoutId = setTimeout(() => flushField(field), 800);
    debounceTimeouts.current[field] = { timeoutId, value, id };
  }, [flushField, id]);

  const handleFieldBlur = useCallback((field, value) => {
    const pending = debounceTimeouts.current[field];
    if (pending) {
      pending.value = value;
      flushField(field);
      return;
    }
    onSaveFieldRef.current?.(field, value, id);
  }, [flushField, id]);

  useEffect(() => () => {
    Object.keys(debounceTimeouts.current).forEach(flushField);
  }, [id, flushField]);

  useEffect(() => {
    const flushAllFields = () => {
      Object.keys(debounceTimeouts.current).forEach(flushField);
    };
    const flushWhenHidden = () => {
      if (document.visibilityState === 'hidden') flushAllFields();
    };

    window.addEventListener('pagehide', flushAllFields);
    document.addEventListener('visibilitychange', flushWhenHidden);
    return () => {
      window.removeEventListener('pagehide', flushAllFields);
      document.removeEventListener('visibilitychange', flushWhenHidden);
    };
  }, [flushField]);

  const shellData = useEditorShell({
    onSaveField: (field, value) => onSaveFieldRef.current?.(field, value, id),
    onImageUpload,
    heroImage,
    logoImage,
    isPublished,
    formattedTime,
    formattedDate,
    showStatusToggle,
    previewTitle,
    previewHelp,
    onToast
  });

  const contentContext = useContent();
  const config = contentContext?.config || {};
  const barAuthorAvatar = config.barAuthorAvatar || '/assets/system/ui/default-avatar.jpg';
  const barAuthorName = config.barAuthorName || 'Foraster';
  const barAuthorLocation = config.barAuthorLocation || 'Identitat Lliure';

  return (
    <EditorErrorBoundary>
      <div className={`ues-root ${className}`}>
        <header className="ues-header">
          {topBar}
        </header>
        <div className="ues-scroll">
          {shellData.topBarData.heroComponent ? (
            <div className="hero-image">
              {shellData.topBarData.heroComponent}
            </div>
          ) : null}
          
          <section className="bar-orange bar-orange--embed bar-orange--top" aria-label="Autoria i data">
            <div className="sp-card-author">
              <img
                className="sp-card-avatar"
                src={barAuthorAvatar}
                alt="Avatar"
                decoding="async"
                width="48"
                height="48"
              />
              <div className="sp-card-author-info">
                <div className="sp-card-author-name">{barAuthorName}</div>
                <div className="sp-card-author-location">{barAuthorLocation}</div>
              </div>
            </div>
            <div className="bar-actions">
              {shellData.topBarData.barActions}
            </div>
          </section>

          <div className="ues-canvas">
            <div className="page-title">
              {shellData.topBarData.logoComponent}
              <EditableField 
                key={`${id}-title`} 
                className="editor-title-input" 
                html={titleHtml} 
                placeholder="Títol..." 
                onChange={(val) => handleFieldChange('title', val)} 
                onBlur={(val) => handleFieldBlur('title', val)} 
              />
              {labels && labels.length > 0 && (
                <ul className="sp-card-labels page-title-labels" aria-label="Categories" style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                  {labels.map((label, idx) => (
                    <li key={idx} className={`sdp-badge sdp-badge-${label.type}`}>
                      {label.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <EditableField 
              key={`${id}-subtitle`} 
              className="editor-subtitle-input" 
              html={subtitleHtml} 
              placeholder="Subtítol opcional..." 
              onChange={(val) => handleFieldChange('subtitle', val)} 
              onBlur={(val) => handleFieldBlur('subtitle', val)} 
            />
            <EditableField 
              key={`${id}-lead`} 
              className="editor-lead-input" 
              html={leadHtml} 
              placeholder="Entradilla opcional..." 
              onChange={(val) => handleFieldChange('lead', val)} 
              onBlur={(val) => handleFieldBlur('lead', val)} 
            />
            {children}
          </div>
        </div>
      </div>
    </EditorErrorBoundary>
  );
}

export function useEditorShell({ 
  onSaveField, 
  onImageUpload = null,
  heroImage, 
  logoImage, 
  isPublished, 
  formattedTime, 
  formattedDate,
  showStatusToggle = true,
  previewTitle = "Exemple de Publicació",
  previewHelp = "Aquesta targeta és una previsualització de com quedarà al Mur. Utilitza l'editor inferior per modificar el contingut.",
  onToast = console.log
}) {
  const heroHandler = useHeroImageHandler({ 
    onSaveField, 
    fieldName: 'heroImage',
    onImageUpload,
    onError: (msg) => onToast(msg, 'error'),
    onConfirmDelete: () => {
      onToast("Imatge esborrada", "success");
      return true;
    }
  });
  
  const logoHandler = useHeroImageHandler({ 
    onSaveField, 
    fieldName: 'logoImage',
    onImageUpload,
    onError: (msg) => onToast(msg, 'error'),
    onConfirmDelete: () => {
      onToast("Logotip esborrat", "success");
      return true;
    }
  });

  return {
    heroImage,
    logoImage,
    isPublished,
    formattedTime,
    formattedDate,
    topBarData: {
      logoComponent: (logoImage && !logoHandler.isEditing) ? (
        <img 
          src={logoImage} 
          alt="Logotip" 
          className="page-title-logo hero-image" 
          onClick={logoHandler.startEdit}
          title="Clica per canviar el logotip"
        />
      ) : (
        <div className="sdp-alerta__accions sdp-camp">
          <input type="file" accept="image/*" ref={logoHandler.fileInputRef} onChange={logoHandler.handleFileChange} className="sdp-nomes-lector" />
          <button type="button" className="sdp-boto sdp-boto--secundari" onClick={() => logoHandler.fileInputRef.current?.click()}>
            <ImageIcon size={16} /> Inserir Logotip
          </button>
          {logoImage && (
            <div className="sdp-alerta__accions">
              <button type="button" className="sdp-boto sdp-boto--fantasma" onClick={logoHandler.cancelEdit}>Enrere</button>
              <button type="button" className="sdp-boto sdp-boto--perill" onClick={logoHandler.handleDelete}>Esborrar</button>
            </div>
          )}
        </div>
      ),
      heroComponent: (heroImage && !heroHandler.isEditing) ? (
        <img 
          src={heroImage} 
          alt="Capçalera" 
          className="hero-image" 
          onClick={heroHandler.startEdit}
          title="Clica per canviar la imatge"
        />
      ) : (
        <div className="sdp-alerta__accions sdp-camp">
          <input type="file" accept="image/*" ref={heroHandler.fileInputRef} onChange={heroHandler.handleFileChange} className="sdp-nomes-lector" />
          <button type="button" className="sdp-boto sdp-boto--secundari" onClick={() => heroHandler.fileInputRef.current?.click()}>
            <ImageIcon size={16} /> Inserir Capçalera
          </button>
          {heroImage && (
            <div className="sdp-alerta__accions">
              <button type="button" className="sdp-boto sdp-boto--fantasma" onClick={heroHandler.cancelEdit}>Enrere</button>
              <button type="button" className="sdp-boto sdp-boto--perill" onClick={heroHandler.handleDelete}>Esborrar</button>
            </div>
          )}
        </div>
      ),
      barActions: (
        <>
          {showStatusToggle && (
            <Dropdown
              right
              minWidth="320px"
              trigger={
                <button type="button" className={`btn-icon-orange ${isPublished ? 'published' : ''}`}>
                  {isPublished ? <Globe size={16} /> : <Lock size={16} />}
                </button>
              }
            >
              <div className="sdp-camp">
                <strong className="sdp-alerta__titol">{isPublished ? previewTitle : 'Pàgina en Edició'}</strong>
                <p className="sdp-camp__ajuda">{previewHelp}</p>
              </div>
            </Dropdown>
          )}
          <DateTimeControl time={formattedTime} date={formattedDate} />
        </>
      )
    }
  };
}

export default UniversalEditorShell;

```

## `src/components/universal/manager/UniversalManager.jsx`

```jsx
import React from 'react';
import AppGridShell from '../../layout/AppGridShell';
import { ManagerProvider, useManager } from './ManagerContext';
import ManagerFacets from './ManagerFacets';
import ManagerList from './ManagerList';
import { UniversalPage } from '../UniversalPage';

function UniversalManagerInner({ getItemCard, renderDetail, onActionCreate, createLabel, listTitle, listIcon }) {
  const { activeItem, facetsTitle } = useManager();

  return (
    <UniversalPage layout="contained">
      <AppGridShell
        leftColumn={<ManagerFacets />}
        middleColumn={
          <ManagerList 
            getItemCard={getItemCard} 
            onActionCreate={onActionCreate} 
            createLabel={createLabel} 
            listTitle={listTitle}
            listIcon={listIcon}
          />
        }
        rightColumn={renderDetail ? renderDetail(activeItem) : null}
        leftTitle={facetsTitle}
        middleTitle={listTitle}
      />
    </UniversalPage>
  );
}

export function UniversalManager({
  items = [],
  facets = [],
  facetsTitle = 'CARPETES',
  listTitle = 'LLISTA',
  listIcon = null,
  getItemId,
  getItemSearchText,
  getItemCard,
  renderDetail,
  onActionCreate,
  createLabel = 'CREAR',
  initialItemId = null,
  initialActiveFacets = {},
}) {
  return (
    <ManagerProvider
      items={items}
      facets={facets}
      facetsTitle={facetsTitle}
      getItemId={getItemId}
      getItemSearchText={getItemSearchText}
      initialItemId={initialItemId}
      initialActiveFacets={initialActiveFacets}
    >
      <UniversalManagerInner 
        getItemCard={getItemCard}
        renderDetail={renderDetail}
        onActionCreate={onActionCreate}
        createLabel={createLabel}
        listTitle={listTitle}
        listIcon={listIcon}
      />
    </ManagerProvider>
  );
}

```

## `src/components/universal/manager/ManagerContext.jsx`

```jsx
import {
  createContext,
  useCallback,
  useContext,
  useDeferredValue,
  useMemo,
  useState,
} from 'react';

const ManagerContext = createContext(null);

export function ManagerProvider({
  children,
  items = [],
  facets = [],
  facetsTitle = 'CARPETES',
  getItemId = (item) => item.id,
  getItemSearchText = (item) => item.searchText || item.title || '',
  initialActiveFacets = {},
  initialItemId = null,
}) {
  const [activeFacets, setActiveFacets] = useState(initialActiveFacets);
  const [activeItemId, setActiveItemId] = useState(initialItemId);
  const [searchQuery, setSearchQuery] = useState('');
  const [colLeftCollapsed, setColLeftCollapsed] = useState(false);
  const [colMiddleCollapsed, setColMiddleCollapsed] = useState(false);

  const deferredSearchQuery = useDeferredValue(searchQuery);

  const facetById = useMemo(() => {
    const map = new Map();
    for (const facet of facets) map.set(facet.id, facet);
    return map;
  }, [facets]);

  const setFacet = useCallback((facetId, value) => {
    setActiveFacets((prev) => {
      if (prev[facetId] === value) return prev;
      return { ...prev, [facetId]: value };
    });
  }, []);

  const clearFacet = useCallback((facetId) => {
    setActiveFacets((prev) => {
      if (prev[facetId] == null) return prev;
      return { ...prev, [facetId]: null };
    });
  }, []);

  const filteredItems = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();

    const treeAllowedByFacet = new Map();
    for (const facet of facets) {
      if (facet.type !== 'tree') continue;
      const selected = activeFacets[facet.id];
      if (selected == null) continue;

      // Amb facet.options tenim l'arbre pre-construït. Recollim l'id seleccionat i tots els seus descendents
      const allowed = new Set();
      const findNodeAndChildren = (nodes, isUnderSelected = false) => {
        if (!nodes) return;
        for (const node of nodes) {
          const match = isUnderSelected || node.id === selected;
          if (match) allowed.add(node.id);
          if (node.children) findNodeAndChildren(node.children, match);
        }
      };
      findNodeAndChildren(facet.options);
      
      treeAllowedByFacet.set(facet.id, allowed);
    }

    const flatSelections = new Map();
    for (const facet of facets) {
      if (facet.type !== 'flat') continue;
      const selected = activeFacets[facet.id];
      if (selected == null) continue;
      flatSelections.set(facet.id, selected);
    }

    if (treeAllowedByFacet.size === 0 && flatSelections.size === 0 && !query) {
      return items;
    }

    return items.filter((item) => {
      for (const [facetId, allowed] of treeAllowedByFacet) {
        const facet = facetById.get(facetId);
        const value = facet.getValue(item);
        if (value == null || !allowed.has(value)) return false;
      }

      for (const [facetId, selected] of flatSelections) {
        const facet = facetById.get(facetId);
        const value = facet.getValue(item);
        if (Array.isArray(value)) {
          if (!value.includes(selected)) return false;
        } else if (value !== selected) {
          return false;
        }
      }

      if (query) {
        const text = String(getItemSearchText(item) || '').toLowerCase();
        if (!text.includes(query)) return false;
      }

      return true;
    });
  }, [
    items,
    facets,
    facetById,
    activeFacets,
    deferredSearchQuery,
    getItemSearchText,
  ]);

  const activeItem = useMemo(() => {
    if (activeItemId != null) {
      const found = filteredItems.find((item) => getItemId(item) === activeItemId);
      if (found) return found;
    }
    return filteredItems[0] || null;
  }, [filteredItems, activeItemId, getItemId]);

  // Si l'element actiu canvia (ex. pel filtre), sincronitzem l'estat local perquè la selecció canvie visualment
  // però ho fem a través de setState en el següent render per no trencar les regles de React
  const finalActiveItemId = activeItem ? getItemId(activeItem) : null;

  const value = useMemo(() => ({
    items,
    facets,
    filteredItems,
    activeItem,
    activeItemId: finalActiveItemId,
    activeFacets,
    searchQuery,
    colLeftCollapsed,
    colMiddleCollapsed,
    facetsTitle,
    setFacet,
    clearFacet,
    setActiveItemId,
    setSearchQuery,
    setColLeftCollapsed,
    setColMiddleCollapsed,
    getItemId,
    getItemSearchText,
  }), [
    items,
    facets,
    filteredItems,
    activeItem,
    finalActiveItemId,
    activeFacets,
    searchQuery,
    colLeftCollapsed,
    colMiddleCollapsed,
    facetsTitle,
    setFacet,
    clearFacet,
    getItemId,
    getItemSearchText,
  ]);

  return (
    <ManagerContext.Provider value={value}>
      {children}
    </ManagerContext.Provider>
  );
}

export function useManager() {
  const ctx = useContext(ManagerContext);
  if (!ctx) {
    throw new Error('useManager ha de ser usat dins de ManagerProvider');
  }
  return ctx;
}

```

## `src/components/universal/manager/ManagerList.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import AppGridColumn from '../../layout/AppGridColumn';
import { useAppGrid } from '../../layout/AppGridShell';
import { useManager } from './ManagerContext';
import ManagerItemCard from './ManagerItemCard';
import { Search, Plus } from 'lucide-react';


/**
 * La llista del gestor. És l'ÚNICA que pinta fitxes: els consumidors només
 * projecten dades amb `getItemCard(item) → { titol, subtitol, imatge, icona }`.
 *
 * P0 · 260911: la identitat de cada fila és `getItemId(item)`, la mateixa que
 * usa el context. Abans era `item.id`: al Perfil els id d'ajust es repetixen
 * entre identitats, les claus xocaven i clicar qualsevol ajust obria el primer.
 */
export default function ManagerList({ getItemCard, onActionCreate, createLabel = 'CREAR', listTitle = 'LLISTA', listIcon = null }) {
  const {
    filteredItems,
    activeItemId,
    setActiveItemId,
    getItemId,
    searchQuery: ctxSearchQuery,
    setSearchQuery: setCtxSearchQuery,
    colMiddleCollapsed,
    setColMiddleCollapsed
  } = useManager();

  const { mida, setPanellObert } = useAppGrid();
  const isCompact = mida !== 'ample';
  const [localQuery, setLocalQuery] = useState(ctxSearchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (ctxSearchQuery !== localQuery) {
        setCtxSearchQuery(localQuery);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [localQuery, ctxSearchQuery, setCtxSearchQuery]);

  const handleSelect = (id) => {
    setActiveItemId(id);
    if (isCompact) setPanellObert(null);
  };

  if (colMiddleCollapsed && !isCompact) {
    return (
      <aside className="notes-column collapsed">
        <AppGridColumn
          variant="collapsed"
          titol={listTitle}
          icona={Search}
          onReplega={() => setColMiddleCollapsed(false)}
        />
      </aside>
    );
  }

  return (
    <aside className="notes-column">
      <AppGridColumn
        titol={listTitle}
        icona={listIcon}
        plegable={!isCompact}
        onReplega={() => setColMiddleCollapsed(true)}
      />

      <div className="notes-list-header univ-manager-toolbar univ-manager-toolbar--list">
        <div className="search-bar univ-manager-search">
          <Search size={16} aria-hidden="true" />
          <input
            type="text"
            placeholder="Cerca..."
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            aria-label="Cercar elements"
          />
        </div>
        {onActionCreate && (
          <button
            className="btn btn-primary"
            onClick={onActionCreate}
            title={createLabel}
          >
            <Plus size={16} />
            <span className="d-desktop-only">{createLabel}</span>
          </button>
        )}
      </div>

      <div className="notes-column__body notes-column__body--sense-marge sdp-scrollable">
        <ul className="sdp-gestor-llista">
          {filteredItems.map((item) => {
            const id = getItemId(item);
            const fitxa = getItemCard
              ? getItemCard(item)
              : { titol: item.name || item.title || String(id) };
            return (
              <li key={id}>
                <ManagerItemCard
                  {...fitxa}
                  actiu={id === activeItemId}
                  onSelecciona={() => handleSelect(id)}
                />
              </li>
            );
          })}
          {filteredItems.length === 0 && (
            <li className="sdp-gestor-buit">Cap element trobat.</li>
          )}
        </ul>
      </div>


    </aside>
  );
}

```

## `src/components/universal/richText/UniversalRichTextToolbar.jsx`

```jsx
import UniversalToolbar from '../UniversalToolbar';
import { SCHEMA_VISIBLE, ESTAT_BUIT, EXEC_BUIT } from './toolbarContract.js';

/**
 * Barra muda. No rep `editor`, no importa cap motor, no fa cap crida
 * d'edició. Rep dades (`state`) i una porta (`exec`), i itera l'esquema.
 *
 * La projecció cap a les cinc ranures de UniversalToolbar és mecànica i
 * la declara l'esquema (`slot`), no este component: quan UniversalToolbar
 * accepte una llista de botons, este bucle es queda igual i el `slot`
 * desapareix.
 */
export function UniversalRichTextToolbar({
  state = ESTAT_BUIT,
  exec = EXEC_BUIT,
  onPublish,
  publishDisabled,
  isPublished,
  t = (key, def) => def
}) {
  const formatState = {};
  const formatActions = {};

  for (const boto of SCHEMA_VISIBLE) {
    formatState[boto.slot.estat] = Boolean(state.actiu?.[boto.id]);
    if (state.disponible && state.pot?.[boto.id]) {
      formatActions[boto.slot.accio] = () => exec(boto.id);
    }
  }

  return (
    <UniversalToolbar
      onPublish={onPublish}
      publishDisabled={publishDisabled}
      isPublished={isPublished}
      formatState={formatState}
      formatActions={formatActions}
      t={t}
    />
  );
}

```

## `src/components/universal/UniversalPage.jsx`

```jsx
import { useNavigate, Link } from '../../app/contexts/RouterContext';
import { showToast } from './AvisadorEfimer';
import { useContent } from './ContentProvider';
import { PageFrame } from './PageFrame';

export function UniversalPage(props) {
  const contentContext = useContent();
  const config = contentContext?.config || {};

  const navigate = useNavigate();
  
  const title = props.title ?? config.title;
  const actualTitleText = props.titleText || config.titleText || (typeof title === 'string' ? title : '');
  
  const handleConnect = props.onConnect || (() => navigate('/connectar?item_id=' + encodeURIComponent(actualTitleText || 'page')));
  const handleBack = props.onBack || (() => navigate(-1));
  const handleForward = props.onForward || (() => navigate(1));
  
  const handleComment = props.onComment || (() => navigate('/xat'));
  const handleShare = props.onShare || (() => {
    const safeHref = isSafeUrl(window.location.href) ? window.location.href : window.location.origin;
    if (navigator.share) {
      navigator.share({ title: title || document.title, url: safeHref }).catch(console.error);
    } else {
      navigator.clipboard.writeText(safeHref);
      showToast('Enllaç copiat al porta-retalls');
    }
  });

  const barDateTime = props.topBarData?.dateTime ?? props.dateTime ?? config.dateTime;
  const barDate = props.topBarData?.date ?? props.date ?? config.date;
  
  const handleDateTime = props.onDateTime || config.onDateTime || ((e) => {
    e.preventDefault();
    e.stopPropagation();
    let yyyymmdd;
    if (barDateTime) {
      yyyymmdd = barDateTime.split('T')[0];
    } else if (barDate) {
      const parts = barDate.split('/');
      if (parts.length === 3) {
        let [dd, mm, yy] = parts;
        if (yy.length === 2) yy = '20' + yy;
        if (isValidDate(dd, mm, yy)) {
          yyyymmdd = `${yy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
        }
      } else {
        const d = new Date(barDate);
        if (!isNaN(d.getTime())) yyyymmdd = d.toISOString().split('T')[0];
      }
    }
    if (yyyymmdd) {
      navigate(`/mur?date=${encodeURIComponent(yyyymmdd)}`);
    } else {
      navigate('/mur');
    }
  });

  return (
    <PageFrame
      {...config}
      {...props}
      onConnect={handleConnect}
      onBack={handleBack}
      onForward={handleForward}
      onComment={handleComment}
      onShare={handleShare}
      onDateTime={handleDateTime}
      LinkComponent={Link}
    />
  );
}

```

## `src/sections/notes/NotesEditor.jsx`

```jsx
import { FileText } from 'lucide-react';
import { useNotes, etiquetesDeNota } from './NotesContext';
import { useManager } from '../../components/universal/manager/ManagerContext';
import { UniversalEditorShell } from '../../components/universal/UniversalEditorShell';
import { useUniversalRichText, useTipTapToolbarAdapter, UniversalRichTextToolbar, UniversalRichTextContent } from '../../components/universal/richText';
import { extensionsRiques } from '../../components/universal/richText/extensions/index.js';
import { uploadToStorage, teCapacitat } from '../../data/backendPort.js';
import { PageFrame } from '../../components/universal/PageFrame';
import { useMemo } from 'react';

export default function NotesEditor() {
  const { saveNoteField, setLocalNoteField, publishNote, noteFolders, t } = useNotes();
  const { activeItem: activeNote } = useManager();

  const extensions = useMemo(() => {
    return extensionsRiques({
      onImageUpload: teCapacitat('mitjans')
        ? async (fitxer) => {
            const res = await uploadToStorage(fitxer, { carpeta: 'notes' });
            return res.url;
          }
        : null
    });
  }, []);

  const editor = useUniversalRichText({
    content: activeNote?.content || '',
    id: activeNote?.id,
    extensions,
    onChange: (html, noteId) => {
      if (noteId) setLocalNoteField(noteId, 'content', html);
    },
    onSave: (html, noteId) => {
      if (noteId) saveNoteField(noteId, 'content', html);
    },
    debounceMs: 800
  });

  const { state, exec } = useTipTapToolbarAdapter(editor);

  if (!activeNote) {
    return (
      <section className="editor-shell--main">
        <div className="chat-empty">
          <FileText size={64} />
          <h2 className="section-title">{t('section.notes.open', 'Obre un solc')}</h2>
        </div>
      </section>
    );
  }

  const topBar = (
    <UniversalRichTextToolbar 
      state={state}
      exec={exec}
      onPublish={() => publishNote(activeNote)}
      publishDisabled={!activeNote}
      isPublished={activeNote?.isPublished}
      t={t}
    />
  );

  return (
    <PageFrame
      chrome="none"
      variant="embed"
      layout="editor"
    >
      <UniversalEditorShell
        key={activeNote.id}
        id={activeNote.id}
        topBar={topBar}
        titleHtml={activeNote.title}
        subtitleHtml={activeNote.subtitle}
        leadHtml={activeNote.lead}
        heroImage={activeNote.heroImage}
        logoImage={activeNote.logoImage}
        isPublished={activeNote.isPublished}
        formattedTime={activeNote.formattedTime}
        formattedDate={activeNote.formattedDate}
        labels={etiquetesDeNota(activeNote, noteFolders, {})}
        onImageUpload={teCapacitat('mitjans') ? async (f) => (await uploadToStorage(f, { carpeta: 'notes' })).url : null}
        onLocalChange={(field, val, noteId) => setLocalNoteField(noteId, field, val)}
        onSaveField={(field, val, noteId) => saveNoteField(noteId, field, val)}
        onToast={(msg, type) => console.log('Toast:', msg, type)}
      >
        <UniversalRichTextContent editor={editor} />
      </UniversalEditorShell>
    </PageFrame>
  );
}

```

## `src/sections/profile/PerfilShell.jsx`

```jsx
import { useMemo } from 'react';
import { useContent } from '../../components/universal/UniversalElements';
import { PerfilProvider, usePerfil, ajustosPersona, ajustosOrganitzacio } from './PerfilContext.jsx';
import DetallAjust from './DetallAjust.jsx';
import perfilStyles from './PerfilShell.css?inline';
import { useUI } from '../../app/contexts/UIContext';
import { UniversalManager } from '../../components/universal/manager/UniversalManager';
import { UserRound, Building2, Lock } from 'lucide-react';

function PerfilManagerInner() {
  const { 
    identitats,
    guardarAjust,
    guardarCampPerfil,
    pujaMitja
  } = usePerfil();

  const totsElsAjustos = useMemo(() => {
    return identitats.flatMap(identitat => {
      const ajustosIdentitat = identitat.mena === 'persona' 
        ? ajustosPersona(identitat.dades || {}) 
        : ajustosOrganitzacio(identitat.dades || {});
      return ajustosIdentitat.map(a => ({
        ...a,
        uniqueId: `${identitat.id}-${a.id}`,
        identitatId: identitat.id,
        identitatMena: identitat.mena,
        identitatNom: identitat.nom
      }));
    });
  }, [identitats]);

  const facets = useMemo(() => [
    {
      id: 'identitat',
      label: 'Identitat',
      options: identitats.map(i => ({
        value: i.id,
        label: i.nom
      })),
      getValue: item => item?.identitatId
    }
  ], [identitats]);

  return (
    <div className="sdp-gestor-pagina">
      <UniversalManager
        items={totsElsAjustos}
        facets={facets}
        facetsTitle="IDENTITATS"
        getItemId={item => item.uniqueId}
        getItemSearchText={item => item.titol}
        initialActiveFacets={{ identitat: 'jo' }}
        getItemCard={(ajust) => ({
          titol: ajust.titol,
          subtitol: ajust.id === 'avatar' ? '' : (ajust.valor || (ajust.obert ? '' : ajust.motiu)),
          imatge: ajust.id === 'avatar' ? ajust.valor : undefined,
          icona: !ajust.obert ? Lock : ajust.identitatMena === 'persona' ? UserRound : Building2,
        })}
        renderDetail={(item) => (
          <DetallAjust 
            ajust={item} 
            identitat={identitats.find(i => i.id === item?.identitatId)} 
            guardarAjust={guardarAjust} 
            guardarCampPerfil={guardarCampPerfil}
            pujaMitja={pujaMitja}
          />
        )}
        onActionCreate={null}
      />
    </div>
  );
}

export default function PerfilShell() {
  const { externalConfig } = useUI();
  const contentContext = useContent();
  const config = contentContext?.config || externalConfig || {};

  return (
    <>
      <style data-perfil-styles>{perfilStyles}</style>
      <PerfilProvider config={config}>
        <PerfilManagerInner />
      </PerfilProvider>
    </>
  );
}

```

## `src/sections/profile/DetallAjust.jsx`

```jsx
import { useEffect, useState } from 'react';
import { logout } from '../../data/backendPort.js';
import { useNavigate } from '../../app/contexts/RouterContext';
import { compressImage } from '../../utils/imageUtils.js';
import { sanitizeHtml } from '../../utils/sanitize.js';
import UniversalToolbar from '../../components/universal/UniversalToolbar';
import { UniversalEditorShell } from '../../components/universal/UniversalEditorShell';
import { UniversalPage } from '../../components/universal/UniversalPage';

/** Un data URL comprimit tornat a Blob, per a pujar-lo com a fitxer. */
async function aBlob(dataUrl) {
  const resposta = await fetch(dataUrl);
  return await resposta.blob();
}

export default function DetallAjust({ ajust, identitat, guardarAjust, guardarCampPerfil, pujaMitja }) {
  const navigate = useNavigate();

  const [valorTemp, setValorTemp] = useState('');
  const [desant, setDesant] = useState(false);
  const [pujant, setPujant] = useState(false);
  const [missatge, setMissatge] = useState(null);

  useEffect(() => {
    setValorTemp(ajust?.valor || '');
    setMissatge(null);
  }, [ajust?.id, identitat?.id]);

  /* FASE 4. Abans es desava el data URL sencer al perfil, i eixe base64
     acabava dins de user_metadata, és a dir, dins del JWT de cada petició.
     Ara es comprimix igual, però es puja com a fitxer i només es guarda
     la URL. Si el backend no té la capacitat 'mitjans', `pujaMitja` torna
     null i es cau al comportament antic en compte de deixar l'usuari
     sense poder canviar la foto. */
  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMissatge({ tipus: 'error', text: 'Només imatges, de moment.' });
      return;
    }

    setPujant(true);
    setMissatge(null);
    try {
      const dataUrl = await compressImage(file, { maxSize: 600, format: 'image/webp', quality: 0.8 });

      if (typeof pujaMitja !== 'function') {
        setValorTemp(dataUrl);
        return;
      }

      const blob = await aBlob(dataUrl);
      const fitxer = new File([blob], `avatar.webp`, { type: 'image/webp' });
      const url = await pujaMitja(fitxer, 'avatars');

      if (url) {
        setValorTemp(url);
        setMissatge({ tipus: 'exit', text: 'Imatge pujada. Ara dóna-li a Guardar.' });
      } else {
        setValorTemp(dataUrl);
      }
    } catch (error) {
      console.warn("Upload to storage failed, falling back to local dataUrl", error);
      setValorTemp(dataUrl);
      setMissatge({ tipus: 'advertencia', text: 'S\'ha produït un error de xarxa o de permisos a l\'Storage, s\'usarà la versió local. Dóna-li a Guardar.' });
    } finally {
      setPujant(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!ajust) return;
    
    setDesant(true);
    setMissatge(null);
    try {
      await guardarAjust(ajust.id, valorTemp);
      setMissatge({ tipus: 'exit', text: 'Desat correctament.' });
      
      setTimeout(() => setMissatge(null), 3000);
    } catch (error) {
      setMissatge({ tipus: 'error', text: error.message || 'Error en desar.' });
    } finally {
      setDesant(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  function renderitzaFormulari() {
    if (!ajust.obert) {
      return (
        <p className="perfil-detall-buit">
          {ajust.motiu || 'Aquest ajust no es pot modificar.'}
        </p>
      );
    }

    if (ajust.accio === 'logout') {
      return (
        <div className="sdp-buit">
          <button type="button" className="sdp-boto sdp-boto--perill" onClick={handleLogout}>
            Confirmar eixida
          </button>
        </div>
      );
    }

    const esMultilinia = ajust.id === 'descripcio' || ajust.id === 'biografia';
    const esContrasenya = ajust.id === 'contrasenya';
    const esAvatar = ajust.id === 'avatar';

    return (
      <form onSubmit={handleSubmit} className="form-trellat">
        <div className="sdp-camp">
          <label className="sdp-camp__etiqueta" htmlFor={`ajust-${ajust.id}`}>
            Nou valor per a {ajust.titol.toLowerCase()}:
          </label>
          
          {esAvatar ? (
            <div className="sdp-alerta__accions">
              {valorTemp && (
                <div className="sdp-avatar sdp-avatar--xl">
                  <img 
                    src={valorTemp} 
                    alt="Previsualització" 
                    className="sdp-avatar__imatge" 
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                id={`ajust-${ajust.id}`}
                className="sdp-control"
                onChange={handleFileChange}
                disabled={pujant}
              />
              {pujant && <p className="sdp-camp__ajuda">Pujant la imatge...</p>}
            </div>
          ) : esMultilinia ? (
            <textarea
              id={`ajust-${ajust.id}`}
              className="sdp-control sdp-control--area"
              rows="5"
              value={valorTemp}
              onChange={(e) => setValorTemp(e.target.value)}
            />
          ) : (
            <input
              type={esContrasenya ? 'password' : 'text'}
              id={`ajust-${ajust.id}`}
              className="sdp-control"
              value={valorTemp}
              onChange={(e) => setValorTemp(e.target.value)}
              placeholder={esContrasenya ? 'Introdueix nova contrasenya...' : ''}
            />
          )}

          {missatge && (
            <p className={missatge.tipus === 'exit' ? 'sdp-text-exit' : 'sdp-camp__error'}>
              {missatge.text}
            </p>
          )}

          <div className="sdp-alerta__accions">
            <button type="submit" className="sdp-boto sdp-boto--primari" disabled={desant || pujant}>
              {desant ? 'Desant...' : 'Guardar'}
            </button>
          </div>
        </div>
      </form>
    );
  }

  if (!identitat) {
    return (
      <UniversalPage
        titleText="El Meu Perfil"
        heroImage="/assets/system/ui/login-fons.jpg"
        logoImage="/assets/system/ui/logo-socdepoble-cuadrat-verd.svg"
        title={<span dangerouslySetInnerHTML={{ __html: sanitizeHtml("Benvingut al teu perfil") }} />}
        subtitle={<span dangerouslySetInnerHTML={{ __html: sanitizeHtml("L'ànima de la IAIA") }} />}
        lead={<span dangerouslySetInnerHTML={{ __html: sanitizeHtml("Registra't per a tindre la teua pròpia veu, crear targetes i personalitzar el teu entorn.") }} />}
        isPublished={true}
      >
        <div className="perfil-detall-buit">
          Crea el teu compte o inicia sessió per a començar.
        </div>
      </UniversalPage>
    );
  }

  const dades = identitat.dades || {};
  const isPersona = identitat.mena === 'persona';

  /* La closca rep una capacitat, no un backend. Si el host no en passa,
     `useHeroImageHandler` es queda amb el data URL de sempre. */
  async function pujaDesDeLaClosca(file) {
    if (typeof pujaMitja !== 'function') return null;
    return await pujaMitja(file, isPersona ? 'avatars' : 'organitzacions');
  }

  return (
    <UniversalEditorShell 
      id={identitat.id}
      topBar={
        <UniversalToolbar 
          onPublish={() => alert("El perfil es desarà automàticament")} 
          isPublished={dades.is_public} 
          publishDisabled={false} 
        />
      }
      titleHtml={identitat.nom || ''}
      subtitleHtml={isPersona ? null : (dades.lema || '')}
      leadHtml={isPersona ? null : (dades.description || '')}
      heroImage={dades.hero_image}
      logoImage={dades.avatar_url || dades.logo_url}
      isPublished={Boolean(dades.is_public)}
      onImageUpload={pujaDesDeLaClosca}
      onSaveField={(field, value, identitatId) => {
        if (field === 'title') guardarCampPerfil(isPersona ? 'full_name' : 'name', value, identitatId);
        if (field === 'subtitle' && !isPersona) guardarCampPerfil('lema', value, identitatId);
        if (field === 'lead' && !isPersona) guardarCampPerfil('description', value, identitatId);
        if (field === 'logoImage') guardarCampPerfil(isPersona ? 'avatar_url' : 'logo_url', value, identitatId);
        if (field === 'heroImage') guardarCampPerfil('hero_image', value, identitatId);
      }}
      showStatusToggle={false}
    >
      <div className="perfil-detall">
        {ajust ? (
          renderitzaFormulari()
        ) : (
          <p className="perfil-detall-buit">
            Selecciona un ajust de l'esquerra per a modificar-lo.
          </p>
        )}
      </div>
    </UniversalEditorShell>
  );
}

```

## `src/components/universal/richText/useUniversalRichText.js`

```jsx
import { useEffect, useMemo, useRef, useCallback } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export function useUniversalRichText({
  content = '',
  onChange,
  onSave,
  id,
  debounceMs = 800,
  /* FASE 4. Extensions que injecta el host. L'editor base no engreixa
     si ningú les demana. */
  extensions = []
}) {
  const timeoutRef = useRef(null);
  const pendingSaveRef = useRef({ id: null, content: null });
  const currentIdRef = useRef(id);
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);

  // Sync refs with latest props
  currentIdRef.current = id;
  onChangeRef.current = onChange;
  onSaveRef.current = onSave;

  /* Si l'array arriba nou a cada render, useEditor reconstruïx l'editor
     i perds el cursor a cada tecla. El host ha de memoritzar-lo; ací es
     memoritza la composició per si de cas. */
  const totesLesExtensions = useMemo(
    () => [StarterKit.configure({ heading: { levels: [2, 3, 4] } }), ...extensions],
    [extensions]
  );

  // The flush function reads from the draft, never from the editor, 
  // preventing empty-string overwrites if the editor is already destroyed.
  const flush = useCallback((expectedId) => {
    const pending = pendingSaveRef.current;
    if (pending.content === null) return;
    if (expectedId !== undefined && pending.id !== expectedId) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    pendingSaveRef.current = { id: null, content: null };
    
    if (pending.id != null) {
      onSaveRef.current?.(pending.content, pending.id);
    }
  }, []);

  const editor = useEditor({
    extensions: totesLesExtensions,
    content: content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const currentId = currentIdRef.current;
      pendingSaveRef.current = { id: currentId, content: html };
      
      onChangeRef.current?.(html, currentId);

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => flush(currentId), debounceMs);
    },
    editorProps: {
      attributes: {
        class: 'editor-content page-content sdp-text-cos sdp-prose'
      },
    },
  });

  /* Sync incoming content changes (e.g. when changing notes).
     TipTap 3 va llevar el segon argument posicional `emitUpdate`. Amb
     `setContent(html, false)` la supressió s'ignora, l'onUpdate dispara
     i cada canvi de nota programa un desat del contingut que acabes de
     carregar: el desat fantasma. L'objecte d'opcions és obligatori. */
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    try {
      if (editor.getHTML() !== content) {
        editor.commands.setContent(content || '', { emitUpdate: false });
      }
    } catch (err) {
      console.warn('Editor sync skipped', err);
    }
  }, [content, editor, id]);

  // Global exit hooks (pagehide, visibilitychange)
  useEffect(() => {
    const flushSave = () => flush();
    const flushWhenHidden = () => {
      if (document.visibilityState === 'hidden') flushSave();
    };

    window.addEventListener('pagehide', flushSave);
    document.addEventListener('visibilitychange', flushWhenHidden);
    return () => {
      window.removeEventListener('pagehide', flushSave);
      document.removeEventListener('visibilitychange', flushWhenHidden);
      flushSave();
    };
  }, [flush]);

  // Flush when note ID changes or component unmounts
  useEffect(() => {
    return () => flush(id);
  }, [id, flush]);

  /* LLEVAT A POSTA (Fase 4). Ací hi havia un `editor.view.destroy()` de
     neteja. `useEditor` ja destruïx l'editor en desmuntar, i això destruïx
     la vista: era una doble destrucció. Amb l'StarterKit pelat no es notava;
     amb node views (imatges, embeds) trenca la desconstrucció dels nodes. */

  return editor;
}

```

