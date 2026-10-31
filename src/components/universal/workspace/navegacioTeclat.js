/**
 * navegacioTeclat.js — IDEA-58 (ordre del Mestre, 29-10-2026 23:22 CET):
 * navegació completa amb les fletxes del teclat (↑ ↓ ← →, Inici i Fi) a
 * l'UniversalWorkspace i a les graelles de fotos i d'arxius, com al Finder
 * de macOS (D08, WCAG 2.2, 2.1.1).
 *
 * Dues menes de peces, i cap de React:
 *   · funcions pures: el destí d'una tecla en una llista (destiDeLlista) i
 *     en una graella (destiDeGraella), i les columnes reals d'una graella a
 *     partir de les caixes de les cel·les (columnesPerGeometria);
 *   · ajudants de DOM: les guardes comunes (ignoraTecla), la disponibilitat
 *     d'un destí (disponible), el focus (enfoca) i els cinc manejadors que
 *     els components pengen amb onKeyDown: la llista de la Columna 2
 *     (gestionaTeclaLlista), l'arbre de la Columna 1 (gestionaTeclaArbre),
 *     els rails de les columnes plegades (gestionaTeclaRail), l'Escape del
 *     detall (gestionaEscapeDelDetall) i les graelles 2D
 *     (gestionaTeclaGraella).
 *
 * Regles comunes (decisions de l'orquestrador, IDEA-58):
 *   · Cap manejador actua amb la tecla ja atesa (defaultPrevented), amb Alt,
 *     Control, Cmd o Maj, mentre un mètode d'entrada compon text, o des d'un
 *     camp editable (un camp de cerca, un editor). Una casella, un ràdio o
 *     un <input> que és un botó no són camps editables (Gemini 261030, G5):
 *     l'Escape del detall hi torna a la fitxa; les fletxes d'un ràdio, però,
 *     continuen sent del seu grup (el navegador hi mou la tria).
 *   · Quan actua, crida preventDefault (la pàgina no es desplaça). Quan no
 *     té destí, no el crida, excepte als extrems (↑ al primer, ↓ a l'últim,
 *     Inici al primer, Fi a l'últim; a les graelles, també la cel·la sense
 *     veïna): la tecla no fa res i la pàgina no es mou, com al Finder.
 *   · Un destí no disponible (dins de [hidden], [inert], [aria-hidden="true"]
 *     o d'un <dialog> tancat, o desconnectat) no rep el focus: el manejador
 *     no fa res i no crida preventDefault.
 *   · Cap tabulació no canvia (cap tabIndex itinerant): les fletxes s'hi
 *     afigen. Enter i Espai continuen fent el clic de sempre.
 */

const TECLES_VERTICALS = new Set(['ArrowUp', 'ArrowDown', 'Home', 'End']);
const TECLES_GRAELLA = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End']);
const ROLS_EDITABLES = new Set(['textbox', 'combobox', 'slider', 'spinbutton', 'searchbox']);
/* Els tipus d'<input> on les fletxes no escriuen ni mouen cap cursor: les
   caselles, els ràdios i els que són botons (G5). */
const INPUTS_SENSE_CURSOR = new Set(['checkbox', 'radio', 'button', 'submit', 'reset', 'image', 'file', 'color']);
const FLETXES = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
/* Dins d'una capa que porta el seu propi teclat, l'Escape és seu. */
const CAPES_AMB_ESCAPE = 'dialog, [role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]';
const NO_DISPONIBLE = '[hidden], [inert], [aria-hidden="true"], dialog:not([open])';
/* Els elements que reben el focus amb el tabulador (els de tabindex negatiu
   en queden fora, a enfocables). */
const SELECTOR_ENFOCABLE = [
  'a[href]', 'area[href]', 'button:not([disabled])', 'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])', 'textarea:not([disabled])', 'iframe', 'audio[controls]', 'video[controls]',
  'summary', '[contenteditable]:not([contenteditable="false"])', '[tabindex]'
].join(', ');
/* El control principal d'una fitxa de la llista: el botó de DefaultItemCard
   (i de NotaFitxa i FilaNoticia, que porten la mateixa classe) o l'enllaç
   de tota la targeta d'UniversalCard (TargetaViva, la fitxa activa del Bloc
   i del Perfil, que pot dur abans un control de la capçalera). */
const SELECTOR_FITXA = '.sdp-gestor-fitxa, .sp-card-link-overlay';
/* Les files de l'arbre de la Columna 1: les capçaleres de grup i els botons
   de nom. El chevron (.sdp-workspace-folder-toggle) no és cap parada. */
const SELECTOR_FILES = '.sdp-workspace-group-heading > button, .sdp-workspace-folder-row > .sdp-workspace-nav-item:not(.sdp-workspace-folder-toggle)';
const SELECTOR_NOM_DE_FILA = ':scope > .sdp-workspace-nav-item:not(.sdp-workspace-folder-toggle)';
/* La tolerància, en píxels, per a dir que dues cel·les són a la mateixa fila. */
const TOLERANCIA_FILA = 2;

/* ── Funcions pures ── */

/**
 * El destí d'una tecla en una llista vertical de `total` elements, des de
 * `index`: ↓ el següent, ↑ l'anterior, Inici el primer i Fi l'últim. Als
 * extrems torna el mateix `index` (no hi ha on anar). Null si la tecla no és
 * de la llista o la llista és buida.
 */
export function destiDeLlista(tecla, index, total) {
  if (!TECLES_VERTICALS.has(tecla) || !(total > 0)) return null;
  if (tecla === 'Home') return 0;
  if (tecla === 'End') return total - 1;
  if (tecla === 'ArrowDown') return Math.min(index + 1, total - 1);
  return Math.max(index - 1, 0);
}

/**
 * Les columnes d'una graella a partir de les caixes de les seues cel·les
 * (getBoundingClientRect, en ordre): les cel·les inicials que comparteixen
 * el `top` de la primera (amb TOLERANCIA_FILA de marge). Com a mínim 1. Si
 * totes les caixes són 0×0 (sense maquetació: jsdom, una graella amagada),
 * 1: la graella es recorre com una llista.
 */
export function columnesPerGeometria(caixes, tolerancia = TOLERANCIA_FILA) {
  if (!caixes?.length || caixes.every((caixa) => !caixa.width && !caixa.height)) return 1;
  const dalt = caixes[0].top;
  let columnes = 0;
  for (const caixa of caixes) {
    if (Math.abs(caixa.top - dalt) > tolerancia) break;
    columnes += 1;
  }
  return Math.max(1, columnes);
}

/**
 * El destí d'una tecla en una graella de `total` cel·les i `columnes`
 * columnes, des de `index`: → +1 i ← −1 (l'ordre de lectura: la fila es
 * continua a la següent), ↓ i ↑ ± `columnes` (la mateixa columna de la fila
 * de davall o de dalt), Inici la primera i Fi l'última. Sense veïna (la vora
 * de la graella, o una fila de davall més curta), el mateix `index`. Null si
 * la tecla no és de la graella o la graella és buida.
 */
export function destiDeGraella(tecla, index, total, columnes = 1) {
  if (!TECLES_GRAELLA.has(tecla) || !(total > 0)) return null;
  const pas = Math.max(1, Math.floor(columnes) || 1);
  switch (tecla) {
    case 'Home': return 0;
    case 'End': return total - 1;
    case 'ArrowRight': return Math.min(index + 1, total - 1);
    case 'ArrowLeft': return Math.max(index - 1, 0);
    case 'ArrowDown': return index + pas < total ? index + pas : index;
    default: return index - pas >= 0 ? index - pas : index;
  }
}

/* ── Guardes i focus ── */

/**
 * Si l'element és un camp on les fletxes escriuen o mouen un cursor: un
 * <textarea>, un <select>, un <input> de text (també de número, de data o un
 * interval), dins d'un contenteditable o amb un rol de camp. Una casella, un
 * ràdio o un <input> que és un botó no ho són (G5), tret que visquen dins
 * d'un contenteditable o porten un rol de camp.
 */
export function esCampEditable(element) {
  if (!element || element.nodeType !== 1) return false;
  if (element.matches('textarea, select')) return true;
  if (element.matches('input') && !INPUTS_SENSE_CURSOR.has(element.type)) return true;
  const editable = element.closest('[contenteditable]');
  if (editable && editable.getAttribute('contenteditable') !== 'false') return true;
  const rol = (element.getAttribute('role') || '').trim().split(/\s+/)[0];
  return ROLS_EDITABLES.has(rol);
}

/**
 * Les guardes comunes: true si el manejador no ha de fer res amb esta tecla
 * (ja atesa, amb un modificador, composició d'un mètode d'entrada, o des
 * d'un camp editable). Val per a l'esdeveniment de React i per al natiu.
 * Les fletxes d'un ràdio natiu són del seu grup (el navegador hi mou la
 * tria): s'ignoren; Inici, Fi i l'Escape, no (G5).
 */
export function ignoraTecla(event) {
  if (!event || event.defaultPrevented) return true;
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return true;
  if (event.isComposing || event.nativeEvent?.isComposing || event.keyCode === 229) return true;
  const desti = event.target;
  if (esCampEditable(desti)) return true;
  return FLETXES.has(event.key) && desti?.nodeType === 1 && desti.matches('input') && desti.type === 'radio';
}

/** Si un destí pot rebre el focus: connectat, no desactivat i fora de les capes amagades. */
export function disponible(element) {
  if (!element || !element.isConnected || element.disabled === true) return false;
  return !element.closest(NO_DISPONIBLE);
}

/* Sense maquetació (jsdom), cap caixa té mida: la visibilitat no es pot mirar. */
const senseMaquetacio = (element) => {
  const caixa = element.ownerDocument?.documentElement?.getBoundingClientRect?.();
  return !caixa || (!caixa.width && !caixa.height);
};
const visible = (element) => element.getClientRects().length > 0 || senseMaquetacio(element);

/** Els elements de dins d'`arrel` que reben el focus amb el tabulador i són disponibles, en ordre de document. */
export function enfocables(arrel) {
  if (!arrel?.querySelectorAll) return [];
  return [...arrel.querySelectorAll(SELECTOR_ENFOCABLE)]
    .filter((element) => !(element.hasAttribute('tabindex') && element.tabIndex < 0) && disponible(element));
}

/**
 * Enfoca un element i el porta a la vista pel camí més curt
 * (scrollIntoView({ block: 'nearest' }), si el navegador el té: jsdom no).
 * El focus no desplaça res pel seu compte (preventScroll): així el
 * desplaçament és només el «nearest». Torna si l'element té el focus.
 */
export function enfoca(element) {
  if (!element || typeof element.focus !== 'function') return false;
  element.focus({ preventScroll: true });
  if (typeof element.scrollIntoView === 'function') element.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  return element.getRootNode?.()?.activeElement === element;
}

/* ── Llista de la Columna 2 (ItemListColumn) ── */

/**
 * El control principal d'una fila (<li>) de la llista: el de la fitxa
 * (SELECTOR_FITXA) o, si la fitxa és pròpia d'una secció i no en porta cap,
 * el primer element enfocable de la fila. Null si no n'hi ha cap de
 * disponible.
 */
export function fitxaPrincipal(fila) {
  const candidats = enfocables(fila);
  return candidats.find((element) => element.matches(SELECTOR_FITXA)) ?? candidats[0] ?? null;
}

const esActual = (element) => {
  const valor = element.getAttribute('aria-current');
  return valor != null && valor !== 'false';
};

/**
 * La fitxa activa de la Columna 2 (la de l'element obert, aria-current) a
 * partir de la columna, de la llista (.sdp-gestor-llista) o del rail de
 * documents de la llista plegada (.sdp-workspace-rail--documents). Amb
 * `primera`, si no n'hi ha cap d'activa, la primera. Null si no n'hi ha cap
 * de disponible.
 */
export function fitxaActivaDeLlista(arrel, { primera = false } = {}) {
  if (!arrel?.querySelector) return null;
  const llista = arrel.matches('.sdp-gestor-llista') ? arrel : arrel.querySelector('.sdp-gestor-llista');
  if (llista) {
    const files = [...llista.children];
    const fila = files.find((li) => esActual(li) || li.querySelector('[aria-current]:not([aria-current="false"])'))
      ?? (primera ? files[0] : null);
    return fila ? fitxaPrincipal(fila) : null;
  }
  const rail = arrel.matches('.sdp-workspace-rail--documents') ? arrel : arrel.querySelector('.sdp-workspace-rail--documents');
  const botons = enfocables(rail);
  return botons.find(esActual) ?? (primera ? botons[0] ?? null : null);
}

/**
 * L'opció activa de la Columna 1, on porta ← des de la llista: la carpeta o
 * categoria activa de l'arbre (aria-current="page") o, si no n'hi ha cap a
 * l'arbre (per exemple, «Tot»), la primera fila. Amb la columna plegada, el
 * botó actiu del rail (l'exacte o el que la conté) o, si no n'hi ha, el seu
 * Expandir (`expandir`).
 */
export function opcioActivaDeNavegacio(arrel, expandir = null) {
  if (!arrel?.querySelector) return null;
  const grups = arrel.querySelector('.sdp-workspace-groups');
  const candidats = grups
    ? [grups.querySelector('[aria-current="page"]'), filesDeLArbre(grups)[0]]
    : [
      arrel.querySelector('.sdp-workspace-rail [aria-current="page"]'),
      arrel.querySelector('.sdp-workspace-rail [aria-current="true"]'),
      expandir
    ];
  return candidats.find((element) => element && disponible(element)) ?? null;
}

/**
 * L'entrada de la Columna 3, on porta → des de la llista: si el detall porta
 * una graella de teclat ([data-graella-teclat]), la seua cel·la activa
 * (aria-pressed="true" o aria-current) o la primera; si no, el primer element
 * enfocable visible del detall; si no n'hi ha cap, l'arrel del detall (que
 * porta tabIndex=-1). Null si el detall no és disponible.
 */
export function entradaDelDetall(arrel) {
  if (!arrel?.querySelector || !disponible(arrel)) return null;
  const graella = [...arrel.querySelectorAll('[data-graella-teclat]')]
    .find((element) => disponible(element) && visible(element));
  if (graella) {
    const objectius = cellesDeGraella(graella).map(objectiuDeCella).filter(Boolean);
    const activa = objectius.find((element) => element.getAttribute('aria-pressed') === 'true' || esActual(element));
    if (activa ?? objectius[0]) return activa ?? objectius[0];
  }
  return enfocables(arrel).find(visible) ?? arrel;
}

/**
 * El manejador de teclat de la llista de la Columna 2 (onKeyDown de
 * l'<ul class="sdp-gestor-llista">, delegat). Només actua des del control
 * principal d'una fila (fitxaPrincipal), no des d'un botó secundari de dins.
 *   · ↑ ↓ Inici Fi: `onTria(index)` (la secció tria l'element com amb el clic)
 *     i el focus va a la fitxa nova.
 *   · ←: el focus va a l'opció activa de la Columna 1 (`navegacio`, la
 *     columna; `expandir`, el seu Expandir quan és plegada).
 *   · →: el focus va a l'entrada del detall (`detall`, l'arrel de la Columna 3).
 * Torna l'índex triat, o null si no ha triat res.
 */
export function gestionaTeclaLlista(event, { onTria, navegacio = null, expandir = null, detall = null } = {}) {
  if (!TECLES_GRAELLA.has(event.key) || ignoraTecla(event)) return null;
  const llista = event.currentTarget;
  const files = [...llista.children];
  const index = files.findIndex((fila) => fila.contains(event.target));
  if (index < 0 || fitxaPrincipal(files[index]) !== event.target) return null;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    const objectiu = event.key === 'ArrowLeft' ? opcioActivaDeNavegacio(navegacio, expandir) : entradaDelDetall(detall);
    if (!objectiu) return null;
    event.preventDefault();
    enfoca(objectiu);
    return null;
  }
  const desti = destiDeLlista(event.key, index, files.length);
  if (desti === index) {
    event.preventDefault();
    return null;
  }
  const objectiu = fitxaPrincipal(files[desti]);
  if (!objectiu) return null;
  event.preventDefault();
  onTria?.(desti);
  enfoca(objectiu);
  return desti;
}

/* ── Arbre de la Columna 1 (CategoryColumn) ── */

/** Les files visibles de l'arbre (capçaleres de grup i botons de nom), en ordre de document. */
export function filesDeLArbre(grups) {
  if (!grups?.querySelectorAll) return [];
  return [...grups.querySelectorAll(SELECTOR_FILES)].filter(disponible);
}

/** La fila d'un element de l'arbre: ell mateix, o el botó de nom si és el chevron. Null fora de l'arbre. */
export function filaDe(element, grups) {
  if (!element || element.nodeType !== 1 || !grups?.contains(element)) return null;
  if (element.matches(SELECTOR_FILES)) return element;
  if (!element.matches('.sdp-workspace-folder-toggle')) return null;
  return element.closest('.sdp-workspace-folder-row')?.querySelector(SELECTOR_NOM_DE_FILA) ?? null;
}

/**
 * La fila pare: el botó de nom de la carpeta que conté la fila; per a una
 * carpeta de primer nivell d'un grup amb capçalera, la capçalera. Null si no
 * en té (una capçalera, o una arrel del grup sense etiqueta).
 */
export function filaPare(fila, grups) {
  const li = fila.closest('li');
  if (!li || !grups.contains(li)) return null;
  const pare = li.parentElement?.closest('li');
  if (pare && grups.contains(pare)) {
    return pare.querySelector(':scope > .sdp-workspace-folder-row')?.querySelector(SELECTOR_NOM_DE_FILA) ?? null;
  }
  return fila.closest('.sdp-workspace-group')?.querySelector(':scope > .sdp-workspace-group-heading > button') ?? null;
}

/**
 * El manejador de teclat de l'arbre de la Columna 1 (onKeyDown de
 * .sdp-workspace-groups, delegat).
 *   · ↑ ↓ Inici Fi: només mouen el focus entre les files (no trien res).
 *   · →: una fila plegada (aria-expanded="false") es desplega
 *     (`onDesplega(fila)`) i el focus es queda; si no, el focus va a la
 *     fitxa activa de la Columna 2 (`llista`, la columna), o a la primera.
 *   · ←: una fila desplegada es plega (`onPlega(fila)`) i el focus es queda;
 *     si no, el focus puja a la fila pare.
 * Plegar o desplegar no canvia cap selecció.
 */
export function gestionaTeclaArbre(event, { llista = null, onDesplega, onPlega } = {}) {
  if (!TECLES_GRAELLA.has(event.key) || ignoraTecla(event)) return;
  const grups = event.currentTarget;
  const fila = filaDe(event.target, grups);
  if (!fila) return;
  const expandida = fila.getAttribute('aria-expanded');
  if (event.key === 'ArrowRight' && expandida === 'false') {
    event.preventDefault();
    onDesplega?.(fila);
    return;
  }
  if (event.key === 'ArrowLeft' && expandida === 'true') {
    event.preventDefault();
    onPlega?.(fila);
    return;
  }
  let objectiu = null;
  if (event.key === 'ArrowRight') objectiu = fitxaActivaDeLlista(llista, { primera: true });
  else if (event.key === 'ArrowLeft') objectiu = filaPare(fila, grups);
  else {
    const files = filesDeLArbre(grups);
    const index = files.indexOf(fila);
    const desti = index < 0 ? null : destiDeLlista(event.key, index, files.length);
    if (desti == null) return;
    if (desti === index) {
      event.preventDefault();
      return;
    }
    objectiu = files[desti];
  }
  if (!objectiu || !disponible(objectiu)) return;
  event.preventDefault();
  enfoca(objectiu);
}

/* ── Rails de les columnes plegades (CategoryRail, DocumentRail) ── */

/** Els botons d'un rail plegat (.sdp-workspace-rail__boto) que poden rebre el focus, en ordre de document. */
export function botonsDelRail(rail) {
  if (!rail?.querySelectorAll) return [];
  return [...rail.querySelectorAll('.sdp-workspace-rail__boto')].filter(disponible);
}

/**
 * El manejador de teclat d'un rail plegat (onKeyDown de la <nav
 * class="sdp-workspace-rail">, delegat). Corrector del Gauntlet f4
 * (30-10-2026, idea58-rails-sense-fletxes) · ← des de la llista i → des de
 * l'arbre o l'Escape del detall porten el focus al rail de la columna
 * plegada (opcioActivaDeNavegacio, fitxaActivaDeLlista); sense este
 * manejador, cap fletxa no s'hi movia ni en tornava.
 *   · ↑ ↓ Inici Fi: només mouen el focus entre els botons del rail (no
 *     trien res: Enter i Espai continuen fent el clic de sempre).
 *   · Al rail de la navegació: → va a la fitxa activa de la Columna 2
 *     (`llista`, la columna), o a la primera; ← no té on anar.
 *   · Al rail de documents (.sdp-workspace-rail--documents): ← va a l'opció
 *     activa de la Columna 1 (`navegacio`; `expandir`, el seu Expandir
 *     quan és plegada) i → a l'entrada del detall (`detall`).
 * Només actua des d'un botó del rail, amb les guardes comunes.
 */
export function gestionaTeclaRail(event, { navegacio = null, expandir = null, llista = null, detall = null } = {}) {
  if (!TECLES_GRAELLA.has(event.key) || ignoraTecla(event)) return;
  const rail = event.currentTarget;
  const botons = botonsDelRail(rail);
  const index = botons.indexOf(event.target);
  if (index < 0) return;
  let objectiu = null;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    const deDocuments = rail.matches('.sdp-workspace-rail--documents');
    if (event.key === 'ArrowRight') {
      objectiu = deDocuments ? entradaDelDetall(detall) : fitxaActivaDeLlista(llista, { primera: true });
    } else if (deDocuments) {
      objectiu = opcioActivaDeNavegacio(navegacio, expandir);
    }
  } else {
    const desti = destiDeLlista(event.key, index, botons.length);
    if (desti === index) {
      event.preventDefault();
      return;
    }
    objectiu = botons[desti];
  }
  if (!objectiu || !disponible(objectiu)) return;
  event.preventDefault();
  enfoca(objectiu);
}

/* ── Escape del detall (DetailColumn) ── */

/**
 * El manejador de l'Escape de la Columna 3 (onKeyDown de l'arrel del
 * detall): torna el focus a la fitxa activa de la Columna 2 (`llista`, la
 * columna). No actua des d'un camp editable ni des d'una capa amb el seu
 * propi Escape (un diàleg, un menú, una llista d'opcions), ni si la fitxa
 * activa no és disponible.
 *
 * És la reserva: una secció pot tindre el seu propi Escape a l'arrel del
 * document (el Lector tanca l'article i torna a la llista, Lector.jsx), que
 * escolta després de l'arrel de React. Per això la decisió es pren quan la
 * tecla acaba el seu camí, a la finestra: si cap altre manejador l'ha atesa
 * (defaultPrevented), el focus torna a la fitxa, amb preventDefault. Si
 * algú atura la propagació, l'Escape és seu i ací no es fa res.
 *
 * L'oient de la finestra es lleva quan hi arriba esta tecla o, si no hi
 * arriba mai (algú n'ha aturat la propagació), en acabar la seua tasca
 * (setTimeout 0): no en queda cap de penjat (Gemini 261030, G5). Mai amb una
 * microtasca: amb una tecla de veres, el navegador buida les microtasques
 * entre un oient i el següent, abans que la tecla arribe a la finestra
 * (comprovat a Chrome el 30-10-2026), i l'Escape no faria res; un
 * dispatchEvent sintètic (jsdom) no les buida i ho amagaria.
 */
export function gestionaEscapeDelDetall(event, llista) {
  if (event.key !== 'Escape' || ignoraTecla(event)) return;
  const arrel = event.currentTarget;
  const desti = event.target;
  if (!desti || desti.nodeType !== 1 || !arrel.contains(desti) || desti.closest(CAPES_AMB_ESCAPE)) return;
  const natiu = event.nativeEvent ?? event;
  const torna = (tecla) => {
    if (tecla.defaultPrevented) return;
    const fitxa = fitxaActivaDeLlista(llista);
    if (!fitxa) return;
    tecla.preventDefault();
    enfoca(fitxa);
  };
  const finestra = arrel.ownerDocument?.defaultView;
  if (typeof finestra?.addEventListener !== 'function') {
    torna(natiu);
    return;
  }
  let rellotge = null;
  const alArribar = (tecla) => {
    if (tecla !== natiu) return;
    finestra.removeEventListener('keydown', alArribar);
    clearTimeout(rellotge);
    torna(tecla);
  };
  finestra.addEventListener('keydown', alArribar);
  rellotge = setTimeout(() => finestra.removeEventListener('keydown', alArribar), 0);
}

/* ── Graelles 2D ── */

/** Les cel·les d'una graella: els seus fills directes. */
export const cellesDeGraella = (contenidor) => [...(contenidor?.children ?? [])];

/** On va el focus dins d'una cel·la: la cel·la, si l'admet, o el seu primer element enfocable. */
export function objectiuDeCella(cella) {
  if (!cella) return null;
  if (cella.matches(SELECTOR_ENFOCABLE) && !(cella.hasAttribute('tabindex') && cella.tabIndex < 0)) {
    return disponible(cella) ? cella : null;
  }
  return enfocables(cella)[0] ?? null;
}

/** Les columnes reals d'una graella, per la geometria de les seues cel·les. */
export const columnesDeGraella = (celles) => columnesPerGeometria(celles.map((cella) => cella.getBoundingClientRect()));

/* La columna de la llista de l'espai de treball que conté `element`, o null
   fora d'un .sdp-workspace (el Gestor autònom). */
function llistaDeLEspai(element) {
  const espai = element.closest('.sdp-workspace');
  if (!espai) return null;
  const delMateixEspai = (candidat) => candidat.closest('.sdp-workspace') === espai;
  return [...espai.querySelectorAll('.sdp-gestor-llista')].find(delMateixEspai)
    ?? [...espai.querySelectorAll('.sdp-workspace-rail--documents')].find(delMateixEspai)
    ?? null;
}

/**
 * El manejador de teclat d'una graella (onKeyDown del contenidor, que porta
 * l'atribut data-graella-teclat). Les cel·les són els fills directes i el
 * focus va al primer enfocable de cada una. Les columnes es compten per
 * geometria en cada tecla (la graella respon a l'amplada). Cada graella és
 * independent (la Cronologia en porta una per mes).
 *   · → +1, ← −1; ↓ ↑ la fila de davall o de dalt; Inici, Fi.
 *   · ← des de la primera columna, dins d'un espai de treball amb fitxa
 *     activa a la Columna 2, torna a eixa fitxa.
 * No canvia cap selecció: Enter i Espai continuen fent el clic de sempre.
 */
export function gestionaTeclaGraella(event) {
  if (!TECLES_GRAELLA.has(event.key) || ignoraTecla(event)) return;
  const contenidor = event.currentTarget;
  const celles = cellesDeGraella(contenidor);
  const index = celles.findIndex((cella) => cella.contains(event.target));
  if (index < 0 || objectiuDeCella(celles[index]) !== event.target) return;
  const columnes = event.key === 'ArrowRight' || event.key === 'Home' || event.key === 'End' ? 1 : columnesDeGraella(celles);
  if (event.key === 'ArrowLeft' && index % columnes === 0) {
    const fitxa = fitxaActivaDeLlista(llistaDeLEspai(contenidor));
    if (fitxa) {
      event.preventDefault();
      enfoca(fitxa);
      return;
    }
  }
  const desti = destiDeGraella(event.key, index, celles.length, columnes);
  if (desti == null) return;
  if (desti === index) {
    event.preventDefault();
    return;
  }
  const objectiu = objectiuDeCella(celles[desti]);
  if (!objectiu) return;
  event.preventDefault();
  enfoca(objectiu);
}
