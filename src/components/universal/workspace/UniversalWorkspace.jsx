/**
 * UniversalWorkspace.jsx — LA PLANTILLA ENXUFABLE
 *
 * Consolida l'antic UniversalManager + UniversalEditorShell en UN sol
 * component que:
 *   1. Proporciona la graella de 3 columnes (AppGridShell).
 *   2. Proporciona l'estat compartit (ManagerProvider).
 *   3. Rep la columna d'editor com a slot (renderEditor).
 *
 * És l'ÚNICA frontera entre el domini (notes, perfils, gestoria) i la
 * infraestructura visual (Pedra Seca).
 *
 * INVARIANT: Aquest component NO importa res de `src/sections/`.
 * Si un dia ho fa, la plantilla ha deixat de ser genèrica.
 *
 * ─────────────────────────────────────────────────────────────────
 * CONTRACTE DEL SLOT D'EDITOR (llegeix abans d'afegir un domini)
 * ─────────────────────────────────────────────────────────────────
 * `renderEditor` és una funció ESTABLE (constant de mòdul o useCallback)
 * que rep l'item actiu —que pot ser null— i torna un ReactNode.
 *
 *   - Sense selecció, el TEU editor Decideix què pintar (estat buit).
 *   - Convenció: l'editor es subscriu ell mateix al ManagerContext
 *     (`useManager().activeItem`) com a font de veritat; l'argument del
 *     slot és comoditat per a dominis sense context propi o per a tests.
 *     No barreges les dues fonts dins del mateix component.
 *   - Si el teu slot no depén de res de l'escop, defineix-lo com a
 *     constant de mòdul (vegeu NotesSection.jsx).
 *   - Una excepció dins del slot —inclòs mentre crea l'element— queda
 *     aïllada per SlotErrorBoundary: la pàgina sobreviu.
 *
 * @typedef {Object} FacetConfig
 * @property {string} id
 * @property {string} label
 * @property {{value: string, label: string}[]} options
 * @property {(item: object) => string} getValue
 *
 * @callback EditorSlotFn
 * @param {object|null} activeItem
 * @returns {import('react').ReactNode}
 */
import React, { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { UniversalPage } from '../UniversalPage';
import AppGridShell from '../../layout/AppGridShell';
import AppGridColumn from '../../layout/AppGridColumn';
import { SlotErrorBoundary } from './SlotErrorBoundary';
import { FileText, Inbox, Plus, Search } from 'lucide-react';

const ManagerContext = React.createContext(null);
export function ManagerProvider({
  children, items, facets, facetsTitle, getItemId, getItemSearchText,
  initialItemId, initialActiveFacets,
}) {
  const [activeFacets, setActiveFacets] = useState(initialActiveFacets);
  const [activeItemId, setActiveItemId] = useState(initialItemId);
  const [searchQuery, setSearchQuery] = useState('');
  const [colLeftCollapsed, setColLeftCollapsed] = useState(false);
  const [colMiddleCollapsed, setColMiddleCollapsed] = useState(false);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const setFacet = useCallback((facetId, value) => {
    setActiveFacets((prev) => ({ ...prev, [facetId]: value }));
  }, []);
  const clearFacets = useCallback(() => setActiveFacets({}), []);

  const filteredItems = useMemo(() => {
    const query = deferredSearchQuery.trim().toLocaleLowerCase('ca');
    return items.filter((item) => {
      if (query && !String(getItemSearchText(item) || '').toLocaleLowerCase('ca').includes(query)) return false;
      return facets.every((facet) => {
        const selected = activeFacets[facet.id];
        if (selected == null) return true;
        const value = facet.getValue(item);
        return Array.isArray(value) ? value.includes(selected) : value === selected;
      });
    });
  }, [activeFacets, deferredSearchQuery, facets, getItemSearchText, items]);

  const activeItem = useMemo(() => {
    const selected = activeItemId == null ? null : String(activeItemId);
    return filteredItems.find((item) => String(getItemId(item)) === selected) || filteredItems[0] || null;
  }, [activeItemId, filteredItems, getItemId]);
  const resolvedActiveItemId = activeItem ? getItemId(activeItem) : null;

  const value = useMemo(() => ({
    activeFacets, activeItem, activeItemId: resolvedActiveItemId, clearFacets,
    colLeftCollapsed, colMiddleCollapsed, facets, facetsTitle, filteredItems,
    getItemId, searchQuery, setActiveItemId, setColLeftCollapsed,
    setColMiddleCollapsed, setFacet, setSearchQuery,
  }), [activeFacets, activeItem, clearFacets, colLeftCollapsed, colMiddleCollapsed,
    facets, facetsTitle, filteredItems, getItemId, resolvedActiveItemId, searchQuery, setFacet]);

  return <ManagerContext.Provider value={value}>{children}</ManagerContext.Provider>;
}
export function useManager() {
  const value = React.useContext(ManagerContext);
  if (!value) throw new Error('useManager ha de ser usat dins de ManagerProvider');
  return value;
}
function ManagerFacets() {
  const { activeFacets, clearFacets, facets, facetsTitle, setFacet } = useManager();
  return (
    <aside className="notes-column">
      <AppGridColumn titol={facetsTitle || 'CARPETES'} />
      <div className="notes-list-header univ-manager-toolbar univ-manager-toolbar--facets">
        <button type="button" className="univ-manager-inbox" onClick={clearFacets}>
          <Inbox size={18} aria-hidden="true" /><span>Tot</span>
        </button>
      </div>
      <div className="notes-column__body notes-column__body--sense-marge sdp-scrollable">
        {facets.map((facet) => (
          <div key={facet.id}>
            {!facet.hideHeader ? <AppGridColumn variant="accordion" titol={facet.label || facet.id} /> : null}
            <div className="notes-column__body">
              {(facet.options || []).map((option) => (
                <button key={option.id ?? option.value} type="button"
                  className={`univ-manager-facet-item ${activeFacets[facet.id] === (option.id ?? option.value) ? 'univ-manager-facet-item--active' : ''}`}
                  onClick={() => setFacet(facet.id, option.id ?? option.value)}>
                  <span>{option.label || option.name}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
function ManagerList({ getItemCard, onActionCreate, createLabel, listTitle, listIcon: ListIcon }) {
  const { activeItemId, filteredItems, getItemId, searchQuery, setActiveItemId, setSearchQuery } = useManager();
  return (
    <aside className="notes-column">
      <AppGridColumn titol={listTitle} icona={ListIcon || FileText} />
      <div className="notes-list-header univ-manager-toolbar univ-manager-toolbar--list">
        <label className="univ-manager-header-search">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Cercar elements</span>
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Cerca…" />
        </label>
        {onActionCreate ? (
          <button type="button" className="btn btn-primary" onClick={onActionCreate}>
            <Plus size={16} aria-hidden="true" /><span className="d-desktop-only">{createLabel}</span>
          </button>
        ) : null}
      </div>
      <div className="notes-column__body notes-column__body--sense-marge sdp-scrollable">
        <ul className="sdp-gestor-llista">
          {filteredItems.map((item) => {
            const id = getItemId(item);
            const card = getItemCard(item) || {};
            return (
              <li key={id}>
                <button type="button" className="sdp-gestor-fitxa"
                  aria-current={String(id) === String(activeItemId) ? 'true' : undefined}
                  onClick={() => setActiveItemId(id)}>
                  <span className="sdp-gestor-fitxa__media" aria-hidden="true"><FileText size={28} /></span>
                  <span className="sdp-gestor-fitxa__text">
                    <span className="sdp-gestor-fitxa__titol">{card.titol ?? card.title ?? item.title ?? ''}</span>
                    {(card.subtitol ?? card.subtitle) ? <span className="sdp-gestor-fitxa__subtitol">{card.subtitol ?? card.subtitle}</span> : null}
                  </span>
                </button>
              </li>
            );
          })}
          {filteredItems.length === 0 ? <li className="sdp-gestor-buit">Cap element trobat.</li> : null}
        </ul>
      </div>
    </aside>
  );
}

/* ── Defaults ESTABLES ──────────────────────────────────────────────
   Els defaults de desestructuració (`= {}`, `= (item) => …`) es
   tornen a crear a cada render i invaliden qualsevol comparació per
   identitat als memos de davall. Ara són UNA referència per mòdul. */
const getIdPerDefecte = (item) => item?.id;
const getTextPerDefecte = (item) => item?.searchText || item?.title || item?.name || '';
const getCardPerDefecte = (item) => ({ titol: item?.title || item?.name || String(item?.id ?? '') });
const FACETS_BUDES = {};

/**
 * En DEV, la plantilla verifica el seu propi contracte: ids duplicats
 * fan col·lisionar claus de React i emboliquen la selecció; facets
 * malformats moren més endavant amb errors incomprensibles. Ací moren
 * aviat, amb el culpable a la consola. En producció: cost zero.
 */
function comprovaInvariants(items, facets, getItemId) {
  if (!import.meta.env.DEV) return;
  const vists = new Set();
  for (const item of items) {
    const id = getItemId(item);
    if (id == null) {
      console.error('[UniversalWorkspace] getItemId ha tornat null/undefined: la selecció i les claus de React queden corruptes.', item);
      continue;
    }
    const clau = String(id);
    if (vists.has(clau)) {
      console.error(`[UniversalWorkspace] Id duplicat "${clau}": React fusionarà files i la selecció serà ambigua.`);
    }
    vists.add(clau);
  }
  for (const facet of facets) {
    if (!facet?.id || !Array.isArray(facet?.options) || typeof facet?.getValue !== 'function') {
      console.error('[UniversalWorkspace] Facet malformat (cal id, options[] i getValue):', facet);
    }
  }
}

/**
 * La frontera única entre domini i infraestructura.
 *
 * @param {object} props
 * @param {object[]} props.items Items del domini (forma lliure).
 * @param {FacetConfig[]} [props.facets] Filtres laterals.
 * @param {(item: object) => (string|number)} [props.getItemId]
 * @param {(item: object) => string} [props.getItemSearchText]
 * @param {(item: object) => {titol: string, subtitol?: string, imatge?: string, icona?: *}} [props.getItemCard]
 * @param {() => void} [props.onActionCreate]
 * @param {EditorSlotFn} [props.renderEditor]
 * @param {(string|number)} [props.initialItemId]
 * @param {Object<string, string>} [props.initialActiveFacets]
 *
 * @example // Un domini nou (Gestoria) es cableja així, i res més:
 * function GestoriaSection() {
 *   return (
 *     <UniversalWorkspace
 *       items={assentaments}
 *       facets={facetsPerExercici}
 *       getItemId={(a) => a.numero}
 *       getItemCard={(a) => ({ titol: a.concepte, subtitol: a.import })}
 *       onActionCreate={creaAssentament}
 *       renderEditor={(a) => <AssentamentEditor assentament={a} />}
 *     />
 *   );
 * }
 */
export function UniversalWorkspace({
  items = [],
  facets = [],
  getItemId = getIdPerDefecte,
  getItemSearchText = getTextPerDefecte,
  getItemCard = getCardPerDefecte,
  onActionCreate = null,
  createLabel = 'CREAR',

  facetsTitle = 'CARPETES',
  listTitle = 'LLISTA',
  listIcon = null,

  renderEditor = null,

  initialItemId = null,
  initialActiveFacets = FACETS_BUDES,

  pageLayout = 'contained',
  pageTitle,
  pageSubtitle,
  pageLead,
  pageChrome = 'system',
  className = '',
}) {
  comprovaInvariants(items, facets, getItemId);

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
      <UniversalWorkspaceInner
        getItemId={getItemId}
        getItemCard={getItemCard}
        onActionCreate={onActionCreate}
        createLabel={createLabel}
        listTitle={listTitle}
        listIcon={listIcon}
        renderEditor={renderEditor}
        pageLayout={pageLayout}
        pageTitle={pageTitle}
        pageSubtitle={pageSubtitle}
        pageLead={pageLead}
        pageChrome={pageChrome}
        className={className}
      />
    </ManagerProvider>
  );
}

function UniversalWorkspaceInner({
  getItemId,
  getItemCard,
  onActionCreate,
  createLabel,
  listTitle,
  listIcon,
  renderEditor,
  pageLayout,
  pageTitle,
  pageSubtitle,
  pageLead,
  pageChrome,
  className,
}) {
  // useManager() requereix viure dins del ManagerProvider: ho garanteix el pare.
  const { activeItem, facetsTitle } = useManager();

  /* Clau de restabliment: canviar d'item neteja l'error del boundary,
     perquè l'error era de l'item anterior. */
  const clauDeItem = activeItem == null ? '~buit' : String(getItemId(activeItem) ?? '~sense-id');

  return (
    <AppGridShell
      className={className}
      /* ManagerFacets és 100% plantilla: si peta, volem que PETE alto
         i clar (bug nostre, no del domini). Sense boundary. */
      leftColumn={<ManagerFacets />}
      /* ManagerList executa CODI DE DOMINI dins del seu render
         (getItemCard, getItemId): un adapter que llança no pot
         matar la pàgina sencera. */
      middleColumn={
        <SlotErrorBoundary domini="llista" resetKey={clauDeItem}>
          <ManagerList
            getItemCard={getItemCard}
            onActionCreate={onActionCreate}
            createLabel={createLabel}
            listTitle={listTitle}
            listIcon={listIcon}
          />
        </SlotErrorBoundary>
      }
      /* El slot és territori del domini: màxim aïllament. */
      rightColumn={
        <SlotErrorBoundary domini="editor" resetKey={clauDeItem}>
          <EditorSlot renderEditor={renderEditor} activeItem={activeItem} />
        </SlotErrorBoundary>
      }
      leftTitle={facetsTitle}
      middleTitle={listTitle}
    />
  );
}

/**
 * Aïlla la CRIDA a renderEditor dins del fill del boundary. Si el codi
 * del domini llança mentre CONSTRUEIX l'element, l'excepció ocorre ací
 * —sota el boundary— i no dins del render del Inner, per damunt
 * d'qualsevol protecció. Semblant tècnic, forat real.
 */
function EditorSlot({ renderEditor, activeItem }) {
  return renderEditor ? renderEditor(activeItem) : null;
}
