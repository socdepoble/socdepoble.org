import React, { useCallback, useId, useLayoutEffect, useMemo, useRef, useState, useEffect, useSyncExternalStore, memo } from 'react';
import { createPortal } from 'react-dom';
import { Search, Settings, SlidersHorizontal, Inbox, Bookmark, Hash, ChevronDown, ArrowDownAZ, Folder, ArrowLeft } from 'lucide-react';
import AppGridShell, { useAppGrid } from '../../layout/AppGridShell.jsx';
import AppGridColumn from '../../layout/AppGridColumn.jsx';
import { SlotErrorBoundary } from './SlotErrorBoundary.jsx';
import { WorkspaceProvider, useWorkspace } from './WorkspaceContext.jsx';
import { entradaMestreDetall, recordaNivell } from './nivellMestreDetall.js';
import { buildWorkspaceFolderForest } from './workspaceFolderForest.js';
import { carpetesAmagadesDe, desaCarpetaAmagada, espaiDe, subscriuCarpetesVisibles } from './carpetesVisibles.js';
import { ALL_CATEGORY_ID } from './workspaceState.js';
import { ItemMedia } from './ItemMedia.jsx';
import { NavGlyph, GlifCategoriaContext, GLIF_DOCUMENT, emojiInicial, primerGlif } from './NavGlyph.jsx';
import { Dialeg, Boto } from '../../PedraSeca/index.js';
import { Interruptor } from '../../PedraSeca/organismes/formulari.jsx';
/* El traductor de la interfície, o null fora de l'app (o amb una prova que
   simula UIContext sense esta exportació): aleshores, la reserva en
   valencià. La còpia única de Pedra Seca (revisió del 261007). */
import { tradueix, useTraductorOpcional } from '../../PedraSeca/hooks/useTraductorOpcional.js';
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
 *   - `idEspai`      → (opcional, Llei de la Roda Dentada, ordre del Mestre
 *                       261007) qui és l'espai de treball per a les seues
 *                       preferències («Carpetes a la vista» de la roda
 *                       dentada, carpetesVisibles.js). Minúscules, xifres i
 *                       guions. Sense, la reserva estable: la clau del
 *                       mestre-detall ({ clau } de `mestreDetall`: 'wiki',
 *                       'notes', 'disseny', 'perfil') i, si tampoc n'hi ha,
 *                       l'espai comú (ESPAI_COMU).
 *
 * La roda dentada (⚙️) de la capçalera de la navegació és el lloc estàndard
 * de la personalització de l'espai de treball (Llei de la Roda Dentada): hi
 * és sempre, desplegada o en rail, i obri «Amplada de les columnes» i, si la
 * navegació té carpetes o categories, «Carpetes a la vista».
 * Una carpeta amagada mai és l'activa (correcció R1 del verificador): si la
 * selecció de la secció (`initialSelection`, `selection`) en porta una, o
 * una de les seues subcarpetes, l'espai la mostra des de «Tot», amb el
 * mateix document (seleccioALaVista): ni la selecció de la secció ni la
 * seua URL no canvien. En mode compacte, i sense cap categoria triada per
 * la secció, ho vigila la columna de navegació (CategoryColumn).
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

/* Amplàries predefinides de les columnes (AppGridShell.PRESETS), amb la seua
   etiqueta en parell [clau i18n, reserva en valencià]: les claus són les de
   les mateixes tres opcions als Ajustos del xat (section.xat.control.espai.*,
   amb el mateix valor valencià). */
const PRESETS_AMPLARIA = Object.freeze([
  ['compacta', Object.freeze(['section.xat.control.espai.compacta', 'Compacta'])],
  ['defecte', Object.freeze(['section.xat.control.espai.defecte', 'Per defecte'])],
  ['ampla', Object.freeze(['section.xat.control.espai.ampla', 'Ampla'])]
]);

/* Llei de la Roda Dentada (ordre del Mestre, 261007) · Els textos de la
   roda, en parells [clau i18n, reserva en valencià]: la reserva és el valor
   valencià del diccionari (i18n.js). {tot} és l'etiqueta de «Tot»
   (labels.all), {carpeta} el nom de la carpeta, i {esquerra} i {mig}
   l'amplada de la navegació i del llistat.
   Revisió del 261007 (M2-02, M2-09) · També «Fet», la línia d'estat i el
   «Sí»/«No» dels interruptors, abans fixos en valencià; i l'ajuda del mode
   compacte, que no té «Tot». */
const TEXTOS_AJUSTOS = Object.freeze({
  descripcio: Object.freeze(['workspace.ajustos.descripcio', 'Personalitza este espai de treball. El tema clar o fosc es tria a la barra superior.']),
  fet: Object.freeze(['workspace.ajustos.fet', 'Fet']),
  amplada: Object.freeze(['workspace.ajustos.amplada', 'Amplada de les columnes']),
  ara: Object.freeze(['workspace.ajustos.ara', 'Ara: navegació {esquerra}px · llistat {mig}px']),
  restableix: Object.freeze(['workspace.ajustos.amplada.restableix', 'Restablir l’amplada de les columnes']),
  carpetes: Object.freeze(['workspace.ajustos.carpetes', 'Carpetes a la vista']),
  ajuda: Object.freeze(['workspace.ajustos.carpetes.ajuda', 'Amagar una carpeta la lleva de la navegació, però no l’esborra: els seus documents continuen a «{tot}» i a la cerca.']),
  ajudaCompacte: Object.freeze(['workspace.ajustos.carpetes.ajudaCompacte', 'Amagar una carpeta la lleva de la navegació, però no l’esborra: els seus documents continuen a la cerca.']),
  vullVore: Object.freeze(['workspace.ajustos.carpetes.vullVore', 'Vull vore {carpeta}']),
  ultima: Object.freeze(['workspace.ajustos.carpetes.ultima', 'Sempre n’hi ha d’haver almenys una a la vista.']),
  si: Object.freeze(['workspace.ajustos.interruptor.si', 'Sí']),
  no: Object.freeze(['workspace.ajustos.interruptor.no', 'No'])
});

/* Revisió del 261007 (M2-10) · Omple un text amb { marcador: valor }. El
   reemplaçador és una funció: amb una cadena, String.replace interpretaria
   «$&», «$$»… del nom d'una carpeta que escriu la persona. */
const omple = (text, valors) => Object.entries(valors)
  .reduce((acumulat, [marcador, valor]) => acumulat.replace(`{${marcador}}`, () => String(valor)), text);

/* El nom d'una carpeta o categoria de la navegació. */
const nomDe = (node) => String(node.label ?? node.nom ?? node.name ?? node.id);

/* Correcció R1 del verificador (Llei de la Roda Dentada, 261007) · La
   navegació (els grups, cadascun amb el seu bosc de carpetes) es calcula una
   sola vegada, a UniversalWorkspace i des del model, i la columna de
   navegació pinta eixe mateix bosc: així l'espai pot mirar la selecció de
   la secció a través de les carpetes a la vista ABANS de donar-la al
   WorkspaceProvider. La normalització és la del proveïdor (ids i parentId
   en text; amb grups, cada opció porta el groupId del seu grup) i
   l'agrupació, la que feia la columna. */
const normalitzaCategoria = (category) => ({
  ...category,
  id: String(category.id),
  parentId: category.parentId == null ? null : String(category.parentId)
});

function grupsDeNavegacio(navigationGroups, categories) {
  const ambGrups = navigationGroups.length > 0;
  const opcions = ambGrups
    ? navigationGroups.flatMap((group) => (group.options || []).map((category) => ({ ...normalitzaCategoria(category), groupId: group.id })))
    : categories.map(normalitzaCategoria);
  const grups = ambGrups
    ? navigationGroups.map((group) => ({ ...group, options: opcions.filter((category) => category.groupId === group.id) }))
    : [{ id: 'default', label: null, options: opcions }];
  return grups.map((group) => ({ ...group, tree: buildWorkspaceFolderForest(group.options) }));
}

/* La carpeta de primer nivell que conté una categoria (ella mateixa, si ho
   és), o null si no és a la navegació. */
function arrelDeCategoria(grups, categoryId) {
  if (categoryId == null) return null;
  const id = String(categoryId);
  for (const group of grups) {
    let node = group.tree.nodes.get(id) || null;
    while (node?.parentId != null) node = group.tree.nodes.get(node.parentId) || null;
    if (node) return node.id;
  }
  return null;
}

/* Les carpetes de primer nivell amagades (un Set d'ids), segons la
   preferència de l'espai (carpetesAmagadesDe). Sense «Tot» (el mode
   compacte), sempre en queda una a la vista: la primera, si la preferència
   les amagava totes. */
function carpetesAmagadesDeLaNavegacio(grups, preferides, compacte) {
  const ids = new Set();
  let totes = 0;
  let primera = null;
  for (const group of grups) {
    for (const node of group.tree.roots) {
      totes += 1;
      if (primera === null) primera = node.id;
      if (preferides[node.id] === false) ids.add(node.id);
    }
  }
  if (compacte && totes > 0 && ids.size >= totes) ids.delete(primera);
  return ids;
}

/* La selecció que demana la secció, vista des de la navegació: si la seua
   categoria és una carpeta amagada (o hi viu dins), «Tot», amb el mateix
   document. Sense categoria, o amb una a la vista, la mateixa selecció (la
   mateixa referència). */
function seleccioALaVista(seleccio, grups, amagades) {
  if (!amagades.size || seleccio?.categoryId == null) return seleccio;
  const arrel = arrelDeCategoria(grups, seleccio.categoryId);
  return arrel != null && amagades.has(arrel) ? { ...seleccio, categoryId: ALL_CATEGORY_ID } : seleccio;
}

/* Les tornades automàtiques seguides a la vista, com a molt, sense cap tria
   de la persona entremig (CategoryColumn): una secció que tornara a imposar
   una carpeta amagada no fa cap bucle. */
const TORNADES_MAXIMES = 2;

/**
 * Configuració pròpia de cada espai de treball, darrere de la roda dentada.
 * La roda és SEMPRE present (sdp-app-grid-shell §2; pla 260924_1710 §3.4):
 * si la secció no injecta la seua pròpia configuració, obri esta.
 *
 * Llei de la Roda Dentada (ordre del Mestre, 261007) · És el lloc estàndard
 * de la personalització de l'espai a tots els UniversalWorkspace (el Xat té
 * el seu full «Ajustos»). Dues seccions:
 *   · «Amplada de les columnes»: els tres valors predefinits d'AppGridShell i
 *     «Restablir l'amplada de les columnes» (el valor per defecte).
 *   · «Carpetes a la vista»: un interruptor per cada carpeta o categoria de
 *     primer nivell de la navegació («Tot» no s'amaga mai), a la manera
 *     d'una llista d'ajustos de WhatsApp (icona, nom, interruptor). Sense
 *     carpetes (Admin), la secció no es pinta.
 * En tancar, el Dialeg torna el focus a la roda que l'havia obert.
 */
function WorkspaceSettingsDialog({ obert, onTanca, labels, grupsDeCarpetes = CAP, amagades, onAlterna, ambTot = true }) {
  const { applyPreset, columnWidths } = useAppGrid();
  const t = useTraductorOpcional();
  const text = (parell) => tradueix(t, parell);
  const id = useId();
  const titolAmplada = text(TEXTOS_AJUSTOS.amplada);
  /* Sense «Tot» (el mode compacte), l'última carpeta a la vista no s'amaga. */
  const visibles = grupsDeCarpetes.reduce(
    (suma, { arrels }) => suma + arrels.filter((node) => !amagades.has(node.id)).length, 0
  );
  const ultimaBloquejada = !ambTot && visibles <= 1;
  const ambSubtitols = grupsDeCarpetes.length > 1;
  const textosEstat = { si: text(TEXTOS_AJUSTOS.si), no: text(TEXTOS_AJUSTOS.no) };
  return (
    <Dialeg
      obert={obert}
      onTanca={onTanca}
      titol={labels.settings}
      mida="s"
      descripcio={text(TEXTOS_AJUSTOS.descripcio)}
      accions={<Boto varietat="secundari" onClick={() => onTanca?.('boto')}>{text(TEXTOS_AJUSTOS.fet)}</Boto>}
    >
      <div className="sdp-workspace-settings">
        <section className="sdp-workspace-settings__seccio" aria-labelledby={`${id}-amplada`}>
          <h3 id={`${id}-amplada`} className="sdp-workspace-settings__titol">{titolAmplada}</h3>
          <p className="sdp-workspace-settings__estat">
            {omple(text(TEXTOS_AJUSTOS.ara), { esquerra: columnWidths.left, mig: columnWidths.middle })}
          </p>
          <div className="sdp-workspace-settings__opcions" role="group" aria-label={titolAmplada}>
            {PRESETS_AMPLARIA.map(([preset, etiqueta]) => (
              <Boto key={preset} varietat="secundari" onClick={() => applyPreset(preset)}>{text(etiqueta)}</Boto>
            ))}
          </div>
          <Boto varietat="secundari" className="sdp-workspace-settings__restableix" onClick={() => applyPreset('defecte')}>
            {text(TEXTOS_AJUSTOS.restableix)}
          </Boto>
        </section>
        {grupsDeCarpetes.length ? (
          <section className="sdp-workspace-settings__seccio" aria-labelledby={`${id}-carpetes`}>
            <h3 id={`${id}-carpetes`} className="sdp-workspace-settings__titol">{text(TEXTOS_AJUSTOS.carpetes)}</h3>
            {/* M2-09 · En compacte no hi ha «Tot»: l'ajuda no l'esmenta. */}
            <p className="sdp-workspace-settings__ajuda">
              {ambTot ? omple(text(TEXTOS_AJUSTOS.ajuda), { tot: labels.all }) : text(TEXTOS_AJUSTOS.ajudaCompacte)}
              {ambTot ? null : ` ${text(TEXTOS_AJUSTOS.ultima)}`}
            </p>
            {grupsDeCarpetes.map(({ grup, arrels }) => {
              const nomDelGrup = grup.label || labels.categories;
              return (
                <div key={grup.id} className="sdp-workspace-settings__grup">
                  {ambSubtitols ? <h4 className="sdp-workspace-settings__subtitol">{nomDelGrup}</h4> : null}
                  <ul className="sdp-workspace-settings__carpetes" aria-label={nomDelGrup}>
                    {arrels.map((node) => {
                      const visible = !amagades.has(node.id);
                      const nom = nomDe(node);
                      return (
                        <li key={node.id}>
                          <Interruptor
                            className="sdp-workspace-settings__carpeta"
                            etiqueta={(
                              <>
                                <span className="sdp-workspace-settings__glif" aria-hidden="true">
                                  <NavGlyph glyph={glifDeclarat(node, grup)} size={20} />
                                </span>
                                <span className="sdp-sr-only">{omple(text(TEXTOS_AJUSTOS.vullVore), { carpeta: nom })}</span>
                                <span aria-hidden="true">{nom}</span>
                              </>
                            )}
                            textosEstat={textosEstat}
                            actiu={visible}
                            desactivat={visible && ultimaBloquejada}
                            onCanvi={(actiu) => onAlterna?.(node.id, actiu)}
                          />
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </section>
        ) : null}
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
  tornaDeLaLlista = null,
  idEspai
}) {
  const copy = { ...DEFAULT_LABELS, ...labels };
  /* Llei de la Roda Dentada · Qui és l'espai per a les seues preferències:
     idEspai i, de reserva, la clau del mestre-detall (també en mode
     compacte: el Snippet és el mateix Bloc) o l'espai comú. */
  const espai = espaiDe(idEspai, mestreDetall && typeof mestreDetall === 'object' ? mestreDetall.clau : null);
  /* Correcció R1 del verificador · La navegació i les carpetes amagades
     d'este espai, una sola vegada (la columna de navegació les rep fetes).
     La selecció que demana la secció passa per les carpetes a la vista: una
     carpeta amagada (o una subcarpeta seua) es mostra des de «Tot», amb el
     mateix document, també en muntar i amb un enllaç. En mode compacte no:
     la carpeta triada és on arriba l'enllaç i la secció ho ha de saber; la
     columna la torna a la vista amb selectCategory, que li ho diu. */
  const grupsNavegacio = useMemo(
    () => grupsDeNavegacio(model.navigationGroups ?? CAP, model.categories ?? CAP),
    [model.navigationGroups, model.categories]
  );
  const preferides = useSyncExternalStore(
    subscriuCarpetesVisibles,
    () => carpetesAmagadesDe(espai),
    () => carpetesAmagadesDe(espai)
  );
  const amagades = useMemo(
    () => carpetesAmagadesDeLaNavegacio(grupsNavegacio, preferides, compacte),
    [grupsNavegacio, preferides, compacte]
  );
  const seleccioInicial = compacte ? initialSelection : seleccioALaVista(initialSelection, grupsNavegacio, amagades);
  const seleccio = compacte ? selection : seleccioALaVista(selection, grupsNavegacio, amagades);
  /* Sense cap categoria triada per la secció, o en compacte, la vigila la
     columna de navegació. */
  const vigilaAmagada = compacte || selection?.categoryId == null;

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
      canAutoSelect={model.canAutoSelect}
      navigationGroups={model.navigationGroups ?? CAP}
      categories={model.categories ?? CAP}
      items={model.items ?? CAP}
      status={model.status || 'ready'}
      initialSelection={seleccioInicial}
      selection={seleccio}
      onSelectionChange={onSelectionChange}
      columnesInicials={columnesInicials ?? (compacte ? COLUMNES_COMPACTE : undefined)}
      inclouDescendents={inclouDescendents}
      categoriaSenseElement={compacte}
    >
      <WorkspaceFrame
        compacte={compacte}
        espai={espai}
        grups={grupsNavegacio}
        amagades={amagades}
        vigilaAmagada={vigilaAmagada}
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
  compacte, espai, grups, amagades, vigilaAmagada, declaraNavegacio, mestreDetall, panellEstret, onPanell, tornaDeLaLlista, error, onCreate, onCreateError, onManageCategories, renderItem, renderDetail,
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
          espai={espai}
          grups={grups}
          amagades={amagades}
          vigilaAmagada={vigilaAmagada}
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

function CategoryColumn({
  compacte, espai, grups: groupsToRender, amagades, vigilaAmagada = false, mestreDetall = false, collapsibleNavigation, replegaTotaCapcalera, focusTarget,
  onManageCategories, labels, icon, collapseBtnRef, expandBtnRef
}) {
  const { state, status, selectCategory, toggleColumn } = useWorkspace();
  const { mida, setPanellObert, tancaPanells, obriPanell, ambRailNavegacio, navegacioEnRail } = useAppGrid();
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  const toggleGroup = (id) => setCollapsedGroups(prev => ({ ...prev, [id]: !prev[id] }));

  /* Llei de la Roda Dentada (ordre del Mestre, 261007) · Les carpetes de
     sistema no s'esborren mai, però la persona tria quines vol a la vista.
     S'amaguen les carpetes o categories de PRIMER NIVELL (les arrels de cada
     grup), amb tot el que porten dins, de l'arbre desplegat i del rail
     plegat; els documents continuen a «Tot» i a la cerca (el filtre és de
     la navegació, no de les dades). La preferència és de l'espai
     (carpetesVisibles.js) i només guarda les amagades. Correcció R1 · El
     bosc de la navegació (`grups`) i les amagades (`amagades`) venen fets
     d'UniversalWorkspace, que hi mira la selecció de la secció. */
  const grupsDeCarpetes = useMemo(
    () => groupsToRender
      .filter(group => group.tree.roots.length > 0)
      .map(group => ({ grup: group, arrels: group.tree.roots })),
    [groupsToRender]
  );
  const grupsVisibles = useMemo(() => (amagades.size ? groupsToRender.flatMap(group => {
    if (!group.tree.roots.some(node => amagades.has(node.id))) return [group];
    const roots = group.tree.roots.filter(node => !amagades.has(node.id));
    /* Un grup amb totes les arrels amagades no deixa cap capçalera buida. */
    return roots.length ? [{ ...group, tree: { ...group.tree, roots } }] : [];
  }) : groupsToRender), [groupsToRender, amagades]);

  /* La primera carpeta de primer nivell a la vista (sense comptar-ne una), o null. */
  const primeraALaVista = (excepte = null) => grupsDeCarpetes
    .flatMap(({ arrels }) => arrels)
    .find(node => node.id !== excepte && !amagades.has(node.id))?.id ?? null;
  /* On es torna si la carpeta activa s'amaga: «Tot»; sense «Tot» (el mode
     compacte), la primera carpeta que queda a la vista. */
  const destiALaVista = compacte ? primeraALaVista() : ALL_CATEGORY_ID;

  /* Correcció R1 · Les tornades automàtiques a la vista des de l'última tria
     de la persona (una carpeta, «Tot» o un interruptor), i si la passada
     d'espera ja s'ha fet (vegeu l'efecte de davall). */
  const tornadesRef = useRef(0);
  const esperaFetaRef = useRef(false);
  const [passada, setPassada] = useState(0);

  /* Amagar no esborra res. Si la carpeta activa (o la que la conté) s'amaga,
     es torna a «Tot»; sense «Tot» (el mode compacte), a la primera carpeta
     que queda a la vista. */
  const alternaCarpeta = (id, visible) => {
    tornadesRef.current = 0;
    desaCarpetaAmagada(espai, id, !visible);
    if (visible || arrelDeCategoria(groupsToRender, state.activeCategoryId) !== id) return;
    const desti = compacte ? primeraALaVista(id) : ALL_CATEGORY_ID;
    if (desti != null) selectCategory(desti);
  };

  /* Correcció R1 del verificador · La regla de l'interruptor val també quan
     s'hi arriba d'una altra manera: la carpeta activa mai queda amagada.
     Quan la secció tria la categoria (selection), ja ho resol
     UniversalWorkspace (seleccioALaVista, amb el mateix document). Ací, la
     resta (`vigilaAmagada`): sense categoria de la secció (el Perfil,
     l'entrada nua del Bloc), el mode compacte (la secció ha de saber on
     arriba l'enllaç) i l'interruptor premut mentre les dades carregaven o
     revalidaven (selectCategory no fa res fins a 'ready'). Es torna com amb
     l'interruptor (selectCategory), però una passada després: el proveïdor
     posa al dia els seus refs (estat i status) i aplica la selecció de la
     secció als seus efectes, que van després dels d'esta columna. Com a molt
     TORNADES_MAXIMES tornades seguides sense cap tria de la persona: una
     secció que la tornara a imposar no fa cap bucle. */
  const arrelActiva = arrelDeCategoria(groupsToRender, state.activeCategoryId);
  const activaAmagada = arrelActiva != null && amagades.has(arrelActiva);
  useEffect(() => {
    if (!vigilaAmagada || status !== 'ready' || !activaAmagada || destiALaVista == null) {
      esperaFetaRef.current = false;
      return;
    }
    if (!esperaFetaRef.current) {
      esperaFetaRef.current = true;
      setPassada((n) => n + 1);
      return;
    }
    if (tornadesRef.current >= TORNADES_MAXIMES) return;
    tornadesRef.current += 1;
    selectCategory(destiALaVista);
    /* Una passada més: si la secció la torna a imposar, es veu. */
    setPassada((n) => n + 1);
  }, [vigilaAmagada, status, activaAmagada, destiALaVista, passada, selectCategory]);

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
  /* Revisió del 261007 (M2-04) · Dels grups que es pinten: si totes les
     carpetes del grup sense etiqueta s'amaguen, el grup no es pinta i la
     capçalera no ha de plegar res (cap aria-expanded que no controle res). */
  const headerGroup = grupsVisibles.find((group) => !group.label) || null;
  const isGroupOpen = (id) => !collapsedGroups[id];

  /* Barres (ordre del Mestre, 261004) · En «mitja», amb el rail de la
     closca (navegacioEnRail: cap panell obert), la navegació es pinta
     plegada: Expandir, roda i rail de carpetes. El plegat d'«ample»
     (collapsed.left) no es toca: és la decisió de la persona en ample. */
  const collapsed = (state.collapsed.left && mida === 'ample') || navegacioEnRail;
  // La roda dentada no depén de cap secció: sense configuració injectada,
  // obri la de l'espai de treball (amplada de les columnes i, Llei de la Roda
  // Dentada, carpetes a la vista).
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
    <WorkspaceSettingsDialog
      obert={settingsOpen}
      onTanca={() => setSettingsOpen(false)}
      labels={labels}
      grupsDeCarpetes={grupsDeCarpetes}
      amagades={amagades}
      onAlterna={alternaCarpeta}
      ambTot={!compacte}
    />
  );

  const chooseCategory = (categoryId) => {
    tornadesRef.current = 0;
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
            groups={grupsVisibles}
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
          {grupsVisibles.map(group => (
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
