import React, { useCallback, useLayoutEffect, useMemo, useRef, useState, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { Search, Settings, SlidersHorizontal, Inbox, Bookmark, Hash, ChevronDown, ArrowDownAZ, Folder, ArrowLeft } from 'lucide-react';
import AppGridShell, { useAppGrid } from '../../layout/AppGridShell.jsx';
import AppGridColumn from '../../layout/AppGridColumn.jsx';
import { SlotErrorBoundary } from './SlotErrorBoundary.jsx';
import { WorkspaceProvider, useWorkspace } from './WorkspaceContext.jsx';
import { entradaMestreDetall, recordaNivell } from './nivellMestreDetall.js';
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
 *   - `columnesInicials` → (opcional, T7 P3) { left, middle }: columnes que
 *                       arrenquen plegades en rail en «ample». Sense, cap.
 *   - `inclouDescendents` → (opcional, T7 P5) triar una carpeta també mostra
 *                       els elements de les seues subcarpetes.
 *   - `compacte`     → (opcional, T7C P1) el mode compacte: el detall és la
 *                       vista i no és cap element (el Snippet Curador del
 *                       Bloc). Quatre canvis, i cap més:
 *                         · navegació i llista arrenquen plegades en rail en
 *                           «ample» (un `columnesInicials` explícit mana);
 *                         · triar una categoria no obri cap element
 *                           (WorkspaceProvider categoriaSenseElement) i, en
 *                           «mitja» i «estret», tanca el panell i torna al
 *                           detall, en lloc d'obrir la llista;
 *                         · la navegació no porta «Tot»: tria una categoria;
 *                         · si les dades fallen, el detall porta
 *                           «Reintentar» (la llista, que el porta, és plegada).
 *                       La closca porta la classe `sdp-workspace--compacte`.
 *                       Límit (correcció T7C-R4), derogat en part (ordre
 *                       del Mestre, 261004: «com a mínim una barra visible
 *                       que permeta desplegar l'altra»): en «estret»
 *                       navegació i llista continuen sent panells tancats,
 *                       però el rail de la closca (#app-grid-rail) és a la
 *                       vista i les obri. La secció continua duent la tria
 *                       al detall; un obridor al detall és decisió del
 *                       Mestre. El mestre-detall (MD) no s'hi aplica.
 *                       Cap xifra pròpia: els punts de tall són els de
 *                       layout/graella.js, via AppGridShell (`mida`).
 *   - `mestreDetall` → (opcional, MD, ordre del Mestre 261003) el patró
 *                       mestre-detall en «estret», com WhatsApp:
 *                         · false (per defecte): com sempre, el detall és la
 *                           primera vista;
 *                         · 'navegacio' (o true): la primera vista és la
 *                           navegació, o la llista si no n'hi ha;
 *                         · 'detall': un enllaç profund (la secció llig la
 *                           URL crua): la primera vista és el detall;
 *                         · { clau, element } (revisió de MD, la forma de les
 *                           seccions): qui és el mòdul i l'element de la URL
 *                           crua. Sense element, la navegació; amb el mateix
 *                           element de quan la persona va deixar el mòdul
 *                           (Arrere, recàrrega), el nivell on era; amb un
 *                           altre, el detall (nivellMestreDetall.js).
 *                       Es llig en muntar. La cascada és la de sempre
 *                       (carpeta → llista → detall), la fletxa ← del detall
 *                       torna a la llista (tornaDelDetall de la closca) i
 *                       l'obridor de carpetes de la llista obri al primer
 *                       toc. Mai dos panells oberts. En «ample» i «mitja» res
 *                       no canvia. Ignorat en mode compacte.
 *   - `tornaDeLaLlista` → (opcional, MD) sense navegació la llista és la
 *                       primera vista en «estret» i no té on tornar dins de
 *                       l'espai: amb esta funció, la seua capçalera porta la
 *                       fletxa ← (`labels.back`). Només en estret i amb el
 *                       mestre-detall (Admin: tornar al Tauler).
 *
 * Si demà cal una «Gestoria», només canvia el que s'injecta; el JSX estructural no.
 */

const CAP = Object.freeze([]);
const SENSE_ICONES = Object.freeze({});
/* T7C · En mode compacte, navegació i llista arrenquen plegades en rail. */
const COLUMNES_COMPACTE = Object.freeze({ left: true, middle: true });

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
  /* MD · La fletxa ← de la llista sense navegació (tornaDeLaLlista). */
  back: 'Tornar arrere',
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
  className = '',
  columnesInicials,
  inclouDescendents = false,
  compacte = false,
  mestreDetall = false,
  tornaDeLaLlista = null
}) {
  const copy = { ...DEFAULT_LABELS, ...labels };

  /* MD · El nivell on és la persona en estret viu ací, FORA del
     WorkspaceProvider amb clau: un remuntatge per workspaceKey (la sessió
     que l'amfitrió torna a injectar) no la trau de l'editor ni de la llista.
     L'entrada es llig una vegada, en muntar (nivellMestreDetall.js). */
  const ambMestreDetall = Boolean(mestreDetall) && !compacte;
  const [entrada] = useState(() => entradaMestreDetall(mestreDetall));
  const nivell = useRef(entrada);
  /* Revisió de MD · Amb { clau, element }, el mòdul recorda l'element de la
     URL i el nivell: tornar-hi amb l'Arrere o recarregar no és cap enllaç. */
  const memoria = ambMestreDetall && mestreDetall && typeof mestreDetall === 'object' ? mestreDetall.clau : null;
  const element = memoria ? (mestreDetall.element ?? null) : null;
  const elementRef = useRef(element);
  useEffect(() => {
    elementRef.current = element;
    if (memoria) recordaNivell(memoria, element, nivell.current);
  }, [memoria, element]);
  const grups = model.navigationGroups ?? CAP;
  const teNavegacio = grups.length
    ? grups.some((grup) => grup.options?.length)
    : Boolean(model.categories?.length);
  /* Correcció dels verificadors (261004) · Si la secció declara una
     navegació: grups (encara que siguen buits mentre carreguen) o
     categories. Admin passa navigationGroups: [] i cap categoria, i el rail
     de «mitja» li donava un Expandir cap a un panell buit. Es llig de
     l'estructura i no de les opcions (teNavegacio): així el rail no apareix
     de colp, i el detall no es mou 56 px, quan arriben les carpetes. */
  const declaraNavegacio = grups.length > 0 || Boolean(model.categories?.length);
  const panellEstret = useCallback(
    () => (nivell.current === 'left' && !teNavegacio ? 'middle' : nivell.current),
    [teNavegacio]
  );
  const recordaPanell = useCallback((panell) => {
    nivell.current = panell;
    if (memoria) recordaNivell(memoria, elementRef.current, panell);
  }, [memoria]);

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
      columnesInicials={columnesInicials ?? (compacte ? COLUMNES_COMPACTE : undefined)}
      inclouDescendents={inclouDescendents}
      categoriaSenseElement={compacte}
    >
      <WorkspaceFrame
        compacte={compacte}
        declaraNavegacio={declaraNavegacio}
        mestreDetall={ambMestreDetall}
        panellEstret={panellEstret}
        onPanell={recordaPanell}
        tornaDeLaLlista={ambMestreDetall ? tornaDeLaLlista : null}
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
  compacte, declaraNavegacio, mestreDetall, panellEstret, onPanell, tornaDeLaLlista, error, onCreate, onCreateError, onManageCategories, renderItem, renderDetail,
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
      /* Barres (ordre del Mestre, 261004) · sdp-workspace--universal és
         l'abast positiu de la reserva de la barra mòbil als scrollers del
         Workspace (modules.css): el Xat també porta sdp-workspace i ja la
         reserva dins dels seus contenidors. */
      className={['sdp-workspace', 'sdp-workspace--universal', compacte ? 'sdp-workspace--compacte' : '', className].filter(Boolean).join(' ')}
      leftTitle={labels.categories}
      middleTitle={labels.items}
      leftIcon={icons.categories}
      middleIcon={icons.items}
      leftCollapsed={workspace.state.collapsed.left}
      middleCollapsed={workspace.state.collapsed.middle}
      /* MD · Sense l'activació, null: la closca d'abans. */
      panellEstret={mestreDetall ? panellEstret : null}
      tornaEstret={mestreDetall ? 'middle' : null}
      onPanell={mestreDetall ? onPanell : null}
      /* P6 (ordre del Mestre, 261003) · La llista té desplegador en
         pantalles xicotetes: en «mitja», fora del mode compacte (el Snippet
         arrenca amb la llista plegada i en mitja s'ha de vore); en «estret»,
         només amb el mestre-detall (sense, estret és com abans). */
      railMitja={!compacte}
      /* Barres (ordre del Mestre, 261004: «com a mínim una d'elles visible
         que permeta desplegar l'altra») · També en mode compacte: el Snippet
         en «estret» no tenia cap barra ni cap obridor (límit T7C-R4). El
         rail de la closca no és cap obridor al detall (el que T7C-R4 deixa
         al Mestre): és la columna plegada, a l'esquerra del detall, que
         continua sent la vista d'eixida. El mestre-detall no s'hi aplica. */
      railEstret={mestreDetall || compacte}
      /* Barres (ordre del Mestre, 261004: «la columna de la Wiki ha d'estar
         fixa i visible, almenys plegada, en tots els formats») · En «mitja»
         la navegació és un rail fix i desplegar-la obri el panell. Fora del
         mode compacte, com railMitja: el Snippet té el seu límit (T7C-R4).
         Correcció dels verificadors · I només si la secció declara una
         navegació: Admin (FILTRES sense cap filtre) es queda com era. */
      railEsquerra={!compacte && declaraNavegacio}
      leftColumn={
        <CategoryColumn
          compacte={compacte}
          mestreDetall={mestreDetall}
          focusTarget={compacte ? detailFocusRef : listFocusRef}
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
            mestreDetall={mestreDetall}
            tornaDeLaLlista={tornaDeLaLlista}
            rootRef={listFocusRef}
            detailFocusRef={detailFocusRef}
            onCreate={onCreate}
            onCreateError={onCreateError}
            renderItem={renderItem}
            labels={labels}
            icon={icons.items}
            categoryIcon={icons.categories}
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
            onRetryLoad={compacte ? onRetry : null}
          />
        </SlotErrorBoundary>
      }
    />
  );
}

/* ── Columna esquerra: navegació per grups (carpetes, categories, etiquetes…) ── */

function CategoryColumn({ compacte, mestreDetall = false, collapsibleNavigation, replegaTotaCapcalera, focusTarget, onManageCategories, labels, icon, collapseBtnRef, expandBtnRef }) {
  const { navigationGroups, categories, state, selectCategory, toggleColumn } = useWorkspace();
  const { mida, setPanellObert, tancaPanells, obriPanell, ambRailNavegacio, navegacioEnRail } = useAppGrid();
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

  /* Barres (ordre del Mestre, 261004) · En «mitja», amb el rail de la
     closca (navegacioEnRail: cap panell obert), la navegació es pinta
     plegada: Expandir, roda i rail de carpetes. El plegat d'«ample»
     (collapsed.left) no es toca: és la decisió de la persona en ample. */
  const collapsed = (state.collapsed.left && mida === 'ample') || navegacioEnRail;
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
    /* T7C · En mode compacte el detall és la vista: triar torna a ell (el
       focus, `focusTarget`, és el detall), també en «estret». */
    if (compacte) {
      tancaPanells();
      if (mida !== 'ample') focusAfterLayout(focusTarget);
      return;
    }
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
  // MD (revisió) · En estret, amb el mestre-detall, la navegació és la primera
  // vista i no té tornada: el nom de la carpeta activa porta a la seua llista,
  // com qualsevol altra carpeta (sense tornar-la a triar), i la deixa
  // desplegada, com fa el nom de les altres. Plegar-la és cosa del chevron.
  // En mitja i en ample, el d'abans.
  const chooseFolder = (categoryId, key) => {
    if (state.activeCategoryId === categoryId) {
      if (mestreDetall && mida === 'estret') {
        openFolder(key);
        setPanellObert('middle');
        focusAfterLayout(focusTarget);
        return;
      }
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
          /* Barres · En el rail de «mitja», l'Expandir obri el panell de la
             navegació (amb el focus a la carpeta activa, obriPanell) i es
             declara obridor de la closca (aria-controls i data-obri-columna)
             per a la guarda del focus. En «ample», el plegat de sempre. */
          controls={replegaTotaCapcalera || navegacioEnRail ? 'app-grid-sidebar' : undefined}
          expandObridor={navegacioEnRail}
          onReplega={() => {
            if (navegacioEnRail) {
              obriPanell('left');
              return;
            }
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
          /* Barres (261004) · Fora d'«ample», la navegació desplegada és un
             panell: Replegar el tanca. Abans commutava el plegat d'«ample»:
             per davall del mínim d'ample no feia res visible i deixava
             l'estat latent.
               · Amb el rail de «mitja», torna al rail, amb el focus a
                 l'Expandir.
               · Sense rail (el mode compacte en «mitja»; correcció dels
                 verificadors), el panell es tanca igual i la guarda del
                 focus de la closca porta el focus a l'obridor de la
                 capçalera de la llista (data-obri-columna). */
          if (mida !== 'ample') {
            tancaPanells();
            if (ambRailNavegacio) focusAfterLayout(expandBtnRef);
            return;
          }
          toggleColumn('left');
          focusAfterLayout(expandBtnRef);
        }}
      />
      {/* T7C · En mode compacte es tria una categoria: sense «Tot». */}
      <AppGridColumn
        esDark="intens"
        startActions={compacte ? CAP : [{
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
  mestreDetall = false, tornaDeLaLlista = null, rootRef, detailFocusRef, onCreate, onCreateError, renderItem, labels, icon, categoryIcon,
  tagFilter, sortable, replegaTotaCapcalera, canCreate, onRetry, listClassName, collapseBtnRef, expandBtnRef
}) {
  const {
    items, categories, navigationGroups, state, status, filteredItems, selectItem, requestItem,
    toggleColumn, setQuery, clearFilters, openSearch, closeSearch, toggleTag
  } = useWorkspace();
  const { mida, panellObert, setPanellObert, tancaPanells, obriPanell, llistaPlegable, llistaEnRail, nodeRail } = useAppGrid();
  /* MD · En estret, amb el mestre-detall, l'obridor de la navegació l'obri
     al primer toc (toggleColumn commuta el rail d'«ample» i només obria en
     un toc de cada dos), du el focus a la carpeta activa i es declara obridor
     de la closca (data-obri-columna i aria-controls) per a la guarda del
     focus. Sense icona de la secció, la carpeta. En mitja i en ample, el
     d'abans. */
  const obridorEstret = mestreDetall && mida === 'estret' && (Boolean(categoryIcon) || categories.length > 0);
  /* MD (revisió) · Sense navegació, la llista és la primera vista en estret:
     si qui munta l'espai té on tornar (el Tauler d'Admin), la capçalera porta
     la fletxa ←. En mitja i en ample, res. */
  const tornadaEstret = mestreDetall && mida === 'estret' && !obridorEstret && typeof tornaDeLaLlista === 'function';
  /* P6 (ordre del Mestre, 261003) · Amb el desplegador de la llista
     (llistaPlegable de la closca), l'obridor de la navegació de «mitja» és
     el d'estret: obri al primer toc (abans commutava el rail d'«ample» i
     obria un toc de cada dos), sense tocar eixe rail, i es declara obridor
     de la closca. El rail de la llista plegada en porta un d'igual: la
     primera columna estreta dona el menú sense desplegar la llista. */
  /* Barres (261004) · En «estret» amb el rail i sense el mestre-detall (el
     mode compacte), la capçalera de la llista oberta porta el mateix
     obridor: abans era el toggleColumn d'«ample», que obria un toc de cada
     dos.
     Correcció dels verificadors (261004) · També en «mitja» sense el
     desplegador de la llista (el mode compacte, el Snippet en «mitja»):
     era l'única porta a la navegació i obria un toc de cada dos. Fora
     d'«ample», l'obridor de la capçalera és sempre este: el mateix botó i
     la mateixa icona, i ara obri al primer toc, tanca al segon i es declara
     obridor de la closca. El toggleColumn que hi havia ha quedat sense cap
     cas i s'ha retirat. */
  const obridorNavegacio = obridorEstret || (mida !== 'ample' && Boolean(categoryIcon));
  const obridorDelRail = llistaPlegable && (Boolean(categoryIcon) || categories.length > 0);
  /* P6 (revisió) · L'obridor declara aria-expanded: amb el panell obert, el
     torna a tancar. En «mitja» el panell de la navegació no tapa la llista i
     l'obridor continua a l'abast del teclat; abans no feia res i el panell
     només es tancava triant una carpeta. En estret, amb el panell obert,
     l'obridor és inert: res no canvia. */
  const commutaNavegacio = () => (panellObert === 'left' ? tancaPanells() : obriPanell('left'));
  /* P6 (revisió) · La lupa del rail d'estret porta el focus al camp de cerca.
     autoFocus només actua quan el camp naix: amb la cerca ja oberta (el camp
     continua muntat dins de la llista tancada), el focus es quedava a la
     lupa del rail que es tapa i la guarda de la closca l'alliberava a
     <body>. Efecte de layout: el del fill corre abans que la guarda de la
     closca, en el mateix commit. */
  const campCercaRef = useRef(null);
  const [cercaDemanada, setCercaDemanada] = useState(0);
  useLayoutEffect(() => {
    if (cercaDemanada) campCercaRef.current?.focus({ preventScroll: true });
  }, [cercaDemanada]);
  const [creating, setCreating] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sortOpen, setSortOpen] = useState(false);
  const sortedItems = useMemo(() => !sortable ? filteredItems : [...filteredItems].sort((a, b) =>
    sortBy === 'name' ? (a.title || '').localeCompare(b.title || '', 'ca')
      : (Date.parse(b.updatedAt) || 0) - (Date.parse(a.updatedAt) || 0)
  ), [filteredItems, sortable, sortBy]);
  /* P6 · En mitja, la closca diu si la columna de la llista es pinta en rail
     (llistaEnRail). En estret la columna continua sent el panell del
     mestre-detall i el rail viu a part (#app-grid-rail, railAPart). */
  const collapsed = (state.collapsed.middle && mida === 'ample') || (llistaEnRail && mida === 'mitja');

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

  /* P6 · En estret, el rail és a part i desplegar-lo és obrir el panell de
     la llista (el de la fletxa ←), no el rail d'«ample». En mitja i en
     ample, el plegat de sempre. */
  const enEstret = mida === 'estret' && llistaPlegable;
  const accionsDeCerca = (desDelRail) => [{
    id: 'search',
    etiqueta: labels.search,
    icona: Search,
    onAcciona: () => {
      /* El camp de cerca porta autoFocus: en estret el panell s'obri sense
         moure el focus (setPanellObert, no obriPanell) i el camp el rep
         també si ja era obert (cercaDemanada). */
      if (desDelRail && enEstret) {
        setPanellObert('middle');
        setCercaDemanada((n) => n + 1);
      } else if (desDelRail) toggleColumn('middle');
      openSearch();
    }
  }];

  /* La llista plegada: el desplegador (Expandir) dalt de tot i, davall, les
     accions i els glifs dels documents. P6 · Fora d'«ample», el rail és la
     primera columna estreta: porta també l'obridor de la navegació, i en
     estret l'Expandir es declara obridor de la llista (la guarda del focus
     hi torna quan el panell es tanca). */
  const pintaRail = () => (
    <AppGridColumn
      variant="collapsed"
      esDark="intens"
      titol={labels.items}
      startActions={obridorDelRail ? [{
        id: 'obri-navegacio',
        etiqueta: labels.categories,
        icona: categoryIcon || Folder,
        onAcciona: commutaNavegacio,
        controls: 'app-grid-sidebar',
        expanded: panellObert === 'left',
        obridor: true
      }] : CAP}
      endActions={accionsDeCerca(true)}
      expandBtnRef={expandBtnRef}
      expandObridor={enEstret}
      controls={replegaTotaCapcalera || llistaPlegable ? 'app-grid-list' : undefined}
      onReplega={() => {
        if (enEstret) {
          obriPanell('middle');
          return;
        }
        toggleColumn('middle');
        focusAfterLayout(collapseBtnRef);
      }}
    >
      {status !== 'loading' && status !== 'error' ? (
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
  );

  if (collapsed) {
    return (
      <aside ref={rootRef} tabIndex={-1} className="sdp-workspace-column" aria-label={labels.items}>
        {pintaRail()}
      </aside>
    );
  }

  /* P6 · En estret, el rail es pinta al seu lloc de la closca (nodeRail)
     amb un portal: el mateix component, el mateix estat (ordre, cerca) i els
     mateixos refs que la llista. */
  const railAPart = enEstret && nodeRail ? createPortal(
    <aside className="sdp-workspace-column" aria-label={labels.items}>
      {pintaRail()}
    </aside>,
    nodeRail
  ) : null;

  return (
    <>
    {railAPart}
    <aside ref={rootRef} tabIndex={-1} className="sdp-workspace-column" aria-label={labels.items}>
      <AppGridColumn
        esDark={true}
        titol={labels.items}
        icona={icon}
        esquerra={
          obridorNavegacio ? (
            <button
              type="button"
              className="app-grid-col-header__accio-icon"
              onClick={commutaNavegacio}
              aria-label={labels.categories}
              title={labels.categories}
              aria-controls="app-grid-sidebar"
              aria-expanded={panellObert === 'left'}
              data-obri-columna=""
            >
              {React.createElement(categoryIcon || Folder, { size: 24, "aria-hidden": true, focusable: "false" })}
            </button>
          ) : tornadaEstret ? (
            <button
              type="button"
              className="app-grid-col-header__accio-icon"
              onClick={() => tornaDeLaLlista()}
              aria-label={labels.back}
              title={labels.back}
            >
              <ArrowLeft size={24} aria-hidden="true" focusable="false" />
            </button>
          ) : null
        }
        collapseBtnRef={collapseBtnRef}
        replegaTotaCapcalera={replegaTotaCapcalera && mida === 'ample'}
        replegaCompacte={llistaPlegable}
        controls={replegaTotaCapcalera || llistaPlegable ? 'app-grid-list' : undefined}
        onReplega={() => {
          /* P6 · En estret, plegar és tancar el panell: el detall torna amb
             el rail, i el focus, a l'Expandir del rail. */
          if (enEstret) tancaPanells();
          else toggleColumn('middle');
          focusAfterLayout(expandBtnRef);
        }}
      />
      <AppGridColumn
        esDark="intens"
        startActions={accionsDeCerca(false)}
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
              ref={campCercaRef}
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
    </>
  );
}

/* Targeta per defecte: mitjà (imatge · icona · inicial) + títol + subtítol.
   S'exporta (correcció D4 de la revisió de T50): un `renderItem` que només
   canvia algunes fitxes (el Perfil, amb la targeta viva) hi cau per a la
   resta, sense copiar-ne el DOM. */
export function DefaultItemCard({ item, active, onSelect, untitled = DEFAULT_LABELS.untitled }) {
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

/* MD (revisió) · Els estats propis del detall (càrrega, error, element no
   accessible, cap element) no són cap Pàgina Universal i no porten cap
   fletxa: en estret, amb un enllaç profund i les dades en error, la persona
   quedava al detall sense camí cap a la llista, on hi ha «Reintentar». Quan
   la closca oferix la tornada (estret, mestre-detall, detall a la vista), una
   capçalera de columna porta la fletxa ←, la mateixa peça que el detall
   d'Admin. Fora d'això, res: ni en mitja ni en ample canvia cap píxel. */
function TornadaDelDetall() {
  const { tornaDelDetall } = useAppGrid();
  if (!tornaDelDetall) return null;
  return (
    <AppGridColumn
      esquerra={(
        <button
          type="button"
          className="app-grid-col-header__accio-icon"
          onClick={() => tornaDelDetall()}
          aria-label="Tornar a la llista"
          title="Tornar a la llista"
        >
          <ArrowLeft size={24} aria-hidden="true" focusable="false" />
        </button>
      )}
    />
  );
}

const DetailColumn = memo(function DetailColumn({
  rootRef, error, renderDetail, labels, className, activeItem, status, activeCategoryId, activeItemId, resolution, onRetry,
  onRetryLoad = null
}) {
  let content;
  /* Si el contingut és un estat propi (sense la fletxa d'una Pàgina Universal). */
  let estatPropi = true;
  if (status === 'loading') {
    content = <p role="status">{labels.loading}</p>;
  } else if (status === 'error') {
    /* T7C · En mode compacte la llista (que porta «Reintentar») és plegada:
       el detall el porta. Sense, el de sempre. */
    content = onRetryLoad
      ? <div role="alert">{labels.error} <Boto varietat="secundari" onClick={onRetryLoad}>Reintentar</Boto></div>
      : <p role="alert">{labels.error}</p>;
  } else if (resolution?.status === 'loading') {
    content = <p role="status">{labels.loading}</p>;
  } else if (resolution?.status === 'error') {
    content = <div role="alert">No s’ha pogut obrir l’element. <button type="button" onClick={onRetry}>Reintentar</button></div>;
  } else if (resolution?.status === 'not-found') {
    content = <p role="status">L’element no és accessible o ja no existix.</p>;
  } else {
    const injectat = renderDetail?.({
      item: activeItem || null,
      selection: {
        categoryId: activeCategoryId,
        itemId: activeItemId
      }
    });
    estatPropi = injectat == null && !activeItem;
    content = injectat ?? (activeItem ? null : <p>{labels.select}</p>);
  }

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      className={`sdp-workspace-detail ${className}`.trim()}
      data-error={error ? 'true' : 'false'}
    >
      {estatPropi ? <TornadaDelDetall /> : null}
      {content}
    </div>
  );
});
