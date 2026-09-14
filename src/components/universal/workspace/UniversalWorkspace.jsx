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
import { UniversalPage } from '../UniversalPage';
import AppGridShell from '../../layout/AppGridShell';
import { ManagerProvider, useManager } from '../manager/ManagerContext';
import ManagerFacets from '../manager/ManagerFacets';
import ManagerList from '../manager/ManagerList';
import { SlotErrorBoundary } from './SlotErrorBoundary';

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
