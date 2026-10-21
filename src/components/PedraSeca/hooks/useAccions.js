import { useEffect, useRef } from 'react';
import { useNavigate, useRouter } from '../../../app/contexts/RouterContext';
import { resolRuta, treuBase } from '../../../app/contexts/politicaRouter.js';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { registraEsdeveniment, seccioActual } from '../../../data/telemetria.js';
import {
  esPrivat, esRutaInterna, interlocutorDe, modeXat, objecteDePagina, rutaConnectarObjecte, rutaXatDePagina, rutaXatPrivat
} from '../../../config/objecteConnectable.js';
import { useXatSocDePoble } from './xatSocDePoble.js';
import { useModeracio } from './moderacioDePoble.js';
import { origenDeLaPagina, origenPublic, urlDeLaPagina } from '../../../config/origenPublic.js';

/* T63.2 · La via pública de Comentar cridada on no hi ha cap xat públic (una
   pàgina sense xat comú, un element que no s'ha trobat): ho diu, no navega
   enlloc. Des del menú no passa: la fila es queda desactivada (261007). */
export const AVIS_SENSE_XAT = 'Ací no hi ha cap xat comú on comentar.';

/* Connectar substituïx el «M'agrada»: és un acte conscient i el comptem.
   Només valors tancats: cap títol, etiqueta ni text de la persona pot
   colar-se a la telemetria per esta porta. */
const ORIGENS = new Set(['targeta', 'pagina']);
const MODES = new Set(['previsualitzacio']);

/**
 * Registra l'esdeveniment «connectar» sense esperar-lo: `registraEsdeveniment`
 * és síncron i el `fetch` que llança no s'espera. Si peta, el clic continua.
 */
export function registraConnectar({ origen, mode } = {}) {
  const dades = { seccio: seccioActual(), origen: ORIGENS.has(origen) ? origen : 'targeta' };
  if (MODES.has(mode)) dades.mode = mode;
  try { registraEsdeveniment('connectar', dades); } catch { /* la telemetria mai trenca el clic */ }
}

/**
 * T43a-1 (C3) · El router on viu l'app, si n'hi ha cap de llegible:
 * { memoria, basename, currentPath, searchParams }. null vol dir «llig la barra
 * d'adreces, com abans»: un arbre sense RouterProvider o una prova que simula
 * RouterContext només amb useNavigate (UniversalEditorShell, DocumentEditor,
 * PageFrame, UniversalCard…), on llegir useRouter peta.
 * L'ordre dels hooks no canvia mai: useRouter fa el seu useContext abans de
 * queixar-se, i una exportació simulada que falta peta abans de cridar-ne cap.
 * La forma `return useRouter()` és la que rules-of-hooks accepta dins d'un try:
 * una assignació (`r = useRouter()`) el fa passar per condicional.
 */
export function useUbicacioApp() {
  try {
    return useRouter() ?? null;
  } catch {
    return null;
  }
}

const esRutaDeLApp = (valor) => typeof valor === 'string' && valor.startsWith('/') && !valor.startsWith('//');

/* La ruta sencera (camí + consulta) si el contracte l'admet; si no, el camí; si tampoc, cap. */
function rutaAdmesa(cami, consulta) {
  const sencera = `${cami}${consulta}`;
  return esRutaInterna(sencera) ? sencera : (esRutaInterna(cami) ? cami : '');
}

/* La ruta de l'app en MEMÒRIA, en camí i consulta ('?…' o ''): l'entrada actual del router. */
function partsDeMemoria(router) {
  const cami = typeof router.currentPath === 'string' ? router.currentPath : '';
  const consulta = router.searchParams ? String(router.searchParams) : '';
  return [cami, consulta ? `?${consulta}` : ''];
}

/* Correcció C6 · On és la persona ara, només per a comparar-ho amb on era
   en un clic: l'entrada del router en MEMÒRIA o, si no, la barra d'adreces
   tal qual (camí i consulta). */
function ubicacioDeLApp(router) {
  if (router?.memoria === true) return partsDeMemoria(router).join('');
  if (typeof window === 'undefined' || !window.location) return '';
  return `${window.location.pathname}${window.location.search}`;
}

/**
 * T43 (ordre del Mestre, 260928) · La ruta on està la persona, llegida en el
 * moment del clic. Inclou la consulta (?item=… de la Wiki) si hi cap.
 * T43a-1 (C3) · Ve del router (useUbicacioApp), no de la barra d'adreces:
 *  · MEMÒRIA (per defecte a tota incrustació): l'entrada actual del router. La
 *    barra d'adreces és de la pàgina amfitriona i no diu on està l'app.
 *  · NAVEGADOR: la barra d'adreces en el moment del clic (el router la llig
 *    d'allí mateix), sense la base: navigate() ja la hi posa. Fora de la base,
 *    cap. Sense base (socdepoble.org) és exactament la d'abans.
 *  · Sense router llegible (null, o cridada sense argument): la barra d'adreces
 *    tal qual, com abans.
 */
export function rutaActual(router = null) {
  if (router?.memoria === true) return rutaAdmesa(...partsDeMemoria(router));
  if (typeof window === 'undefined' || !window.location) return '';
  const { pathname = '', search = '' } = window.location;
  const cami = router?.basename ? treuBase(pathname, router.basename) : pathname;
  return cami === null ? '' : rutaAdmesa(cami, search);
}

/**
 * T43 · El Connectar per defecte d'una targeta sense descriptor propi: una
 * 'pagina' amb la ruta del detall (mainHref) o, si no n'hi ha, la d'on està
 * la persona (`router`: el de useUbicacioApp). Sense detall, la clau és el
 * títol, com abans.
 */
export function rutaConnectarPerDefecte(title, mainHref, router = null) {
  const titol = typeof title === 'string' ? title : '';
  const detall = esRutaInterna(mainHref) ? mainHref : '';
  return rutaConnectarObjecte(objecteDePagina({ titol, ruta: detall || rutaActual(router), id: detall || titol }));
}

/**
 * T63.2 (doctrina del Mestre, 260928) · El Comentar per defecte sense
 * descriptor propi: el xat comú de la 'pagina' del detall (mainHref). Només
 * la barra d'una pàgina (`pagina: true`) pren, sense detall, la ruta d'on està
 * la persona: una targeta d'una llista no és la llista, i totes les targetes
 * compartirien un sol xat amb títols diferents. La clau és la ruta, mai el
 * títol. null si no n'hi ha cap que valga per al contracte (subjecteDeXat: la
 * llista tancada de pàgines amb xat), com una pàgina privada, una fitxa amb
 * consulta o una ruta de detall. `router`: el de useUbicacioApp (rutaActual).
 */
export function rutaXatPerDefecte(title, mainHref, { pagina = false, router = null } = {}) {
  const titol = typeof title === 'string' ? title : '';
  const ruta = esRutaInterna(mainHref) ? mainHref : (pagina ? rutaActual(router) : '');
  return ruta ? rutaXatDePagina(objecteDePagina({ titol, ruta })) : null;
}

/* Origen dels enllaços compartits des de MEMÒRIA: el canònic del build si el
   porta (VITE_CANONICAL_URL) o, si no, el de la pàgina amfitriona; i la base,
   com als href dels enllaços. És la mateixa fórmula que la URL canònica de
   useSEO.js. Ordre del Mestre (261021, pla 261021_0015 §13, P1-03) · Una sola
   font: origenPublic (src/config/origenPublic.js). */
function prefixDeMemoria(router) {
  return `${origenPublic()}${router.basename || ''}`;
}

/**
 * URL absoluta del detall (href); si no n'hi ha, la de la pàgina.
 *  · Sense router llegible, o NAVEGADOR sense base (socdepoble.org): la
 *    d'abans, byte a byte: l'origen de la barra d'adreces + href, o la barra
 *    d'adreces sencera.
 *  · NAVEGADOR amb base: origen + base + ruta de l'app, com als href dels
 *    enllaços (hrefDe de RouterContext). Sense href, la barra ja la porta.
 *  · MEMÒRIA (C3): la barra d'adreces és de l'amfitrió i no diu on està l'app.
 *    Es compon amb la ruta de l'app (el detall, o l'entrada actual del
 *    router): VITE_CANONICAL_URL + base + ruta si el build el porta; si no,
 *    window.location.origin + base + ruta (a tota incrustació la base és '').
 *    DECISIÓ PENDENT del Mestre: quin origen ha de portar un enllaç compartit
 *    des d'un amfitrió. Sense canònic, la ruta pot no existir a l'amfitrió.
 *  · APP NATIVA (ordre del Mestre, 261021, pla 261021_0015 §13, P1-03): el
 *    router és de NAVEGADOR sense base, però la barra és capacitor://localhost
 *    o https://localhost: l'origen de la barra se substituïx per l'origen
 *    públic (origenPublic.js), amb el mateix camí, consulta i fragment.
 * Un href de fora de l'app (un altre origen, 'mailto:') es resol com sempre.
 */
export function urlPerCompartir(href, router = null) {
  if (router?.memoria === true) {
    const [cami, consulta] = partsDeMemoria(router);
    // Una ruta relativa es resol sobre la de l'app, com ho fa navigate().
    const ruta = href ? resolRuta(href, cami || '/') : `${cami}${consulta}`;
    if (ruta !== null) return `${prefixDeMemoria(router)}${ruta}`;
  }
  /* P1-03 (261021, pla 261021_0015 §13) · Dins de l'app nativa la barra és
     capacitor://localhost o https://localhost: el mateix camí, a l'origen
     públic. Fora, la barra d'adreces, byte a byte (origenPublic.js). */
  if (!href) return urlDeLaPagina();
  const base = router?.basename && esRutaDeLApp(href) ? router.basename : '';
  try { return new URL(`${base}${href}`, origenDeLaPagina()).href; } catch { return urlDeLaPagina(); }
}

/**
 * Onada 8 (261009) · Amb qui obri el xat «En privat» un descriptor, o null:
 * aleshores, el xat amb Sóc de Poble. L'autor de l'element o el mateix perfil
 * (interlocutorDe), encara que qui mira no el conega: el backend ja el pot
 * obrir (crea_fil_directe). Van al xat amb Sóc de Poble, com abans:
 *  · el pilot (la marca `projecte` de navigation.js: id, àlies o UUID
 *    registrat), perquè este xat ja és el seu;
 *  · un element sense autor conegut (una pàgina, un poble, un nom sense id);
 *  · una publicació pròpia (`esDeQuiMira`, del proveïdor de l'app): el
 *    servidor no obri cap xat amb tu mateix (SDP-XAT-002);
 *  · un autor sense nom: el menú diria «entre tu i Sóc de Poble» i portaria a
 *    un altre xat;
 *  · en llavor, un autor que el xat local no pot obrir (`directeAmb`, del
 *    proveïdor): abans de l'Onada 8 anava a Sóc de Poble, i no ha de caure en
 *    «Esta persona és forastera en este poble.» (SDP-XAT-004; el text és de
 *    l'Onada 10, 261010; pla 261010_1121; decisió del Mestre del 261010).
 *    Amb un àlies (el Mac Mini de 'javillinares'), l'id del padró que torna
 *    directeAmb;
 *  · una ruta que el contracte no admet (esRutaInterna).
 * `xat` és el valor de useXatSocDePoble: { esDeQuiMira?, directeAmb? }.
 */
export function interlocutorDelPrivat(objecte, xat = null) {
  const interlocutor = interlocutorDe(objecte);
  if (!interlocutor || interlocutor.projecte || !interlocutor.nom.trim()) return null;
  const esDeQuiMira = typeof xat?.esDeQuiMira === 'function' ? xat.esDeQuiMira : () => false;
  if (esDeQuiMira(interlocutor.id)) return null;
  const id = typeof xat?.directeAmb === 'function' ? xat.directeAmb(interlocutor) : interlocutor.id;
  if (!id) return null;
  const amb = id === interlocutor.id ? interlocutor : { ...interlocutor, id: String(id) };
  if (amb !== interlocutor && esDeQuiMira(amb.id)) return null;
  return esRutaInterna(rutaXatPrivat(amb)) ? amb : null;
}

/**
 * Ordre del Mestre (261007) · «Comentaris = xat» · La via «En privat»: el xat
 * privat amb Sóc de Poble (useXatSocDePoble). Torna la funció del clic, amb
 * la lògica de sempre de Comentar, ara també per a la fila d'ajuda per
 * defecte del Xat (sections/xat/useObriXatPerDefecte.js), sense cap còpia.
 * Viu ací i no a xatSocDePoble.js, que este fitxer ja importa (cap cicle).
 * Onada 8 (261009) · Amb un `interlocutor` (interlocutorDelPrivat), el clic
 * obri el xat amb ell (/xat?amb=<id>), sense esperar cap resolució. Sense
 * (la fila del Xat, el pilot, una pàgina), el de Sóc de Poble, com sempre.
 *
 * Amb el xat ja resolt, hi va. Si no: diu l'avís del proveïdor (encara es
 * busca, o no està disponible) i, si encara es pot resoldre, el demana UNA
 * vegada per a tota l'app (resol) i hi va quan arriba; si no arriba, ho diu.
 * Correcció C6 · Quan arriba, només fa res si és l'última tria de l'app
 * (`darrera`: dos «En privat» mentre es resol no fan dues navegacions) i si
 * la persona no s'ha mogut des del clic.
 * `opcions` (opcional) són les de navigate: la fila del xat hi passa
 * `{ replace: true }`, perquè la seua ruta de pas no quede a l'historial.
 * Sense opcions, la navegació és la de sempre, navigate(href).
 */
export function useComentaEnPrivat(interlocutor = null) {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const router = useUbicacioApp();
  const xatSocDePoble = useXatSocDePoble();
  /* Correcció C6 · On és la persona en cada pintat i si la peça continua
     muntada: la navegació que espera el xat ho mira quan arriba. */
  const ubicacio = useRef(router);
  ubicacio.current = router;
  const muntada = useRef(true);
  useEffect(() => {
    muntada.current = true;
    return () => { muntada.current = false; };
  }, []);
  return (opcions) => {
    const ves = (ruta) => (opcions ? navigate(ruta, opcions) : navigate(ruta));
    if (interlocutor) {
      ves(rutaXatPrivat(interlocutor));
      return;
    }
    const { href, avis, resol } = xatSocDePoble;
    if (href) {
      ves(href);
      return;
    }
    if (avis) showToast(avis);
    if (typeof resol !== 'function') return;
    const onEra = ubicacioDeLApp(ubicacio.current);
    resol().then((xat) => {
      const vigent = xat?.darrera !== false && muntada.current && ubicacioDeLApp(ubicacio.current) === onEra;
      if (!vigent) return;
      if (xat?.href) ves(xat.href);
      else if (xat?.avis && xat.avis !== avis) showToast(xat.avis);
    });
  };
}

export async function compartix(titol, url, showToast) {
  if (navigator.share) {
    try {
      await navigator.share({ title: titol || document.title, url });
      return;
    } catch (error) {
      if (error?.name === 'AbortError') return; // ha tancat el menú: no és cap error
      // Qualsevol altra fallada: provem el porta-retalls.
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    showToast('Enllaç copiat al porta-retalls.');
  } catch {
    showToast(`No s'ha pogut copiar. Enllaç: ${url}`, 6000);
  }
}

/**
 * Peça única de domini per a les accions de UI (Connectar, Traduir, Comentar, Compartir).
 * Cura el doble protocol i el prop drilling.
 *
 * `telemetria` ({ origen?: 'targeta' | 'pagina', mode?: 'previsualitzacio' }) diu
 * com es compta el Connectar. És l'únic lloc que el registra: UniversalPage
 * no l'embolcalla, i per això un clic a la barra de pàgina compta una vegada.
 *
 * Comentar (ordre del Mestre, 261007, «Comentaris = xat») · No hi ha fil de
 * comentaris: el debat és un xat. Sense onComment propi, Comentar obri SEMPRE
 * un menú amb dues vies (BotoComentar, el mateix a la barra blava i a la
 * targeta), i el menú crida handleComment amb la triada:
 *   · 'privat' · Onada 8 (261009) · el xat amb l'autor de l'objecte
 *     (interlocutorDelPrivat: /xat?amb=<id>, encara que no el conegues). Si
 *     no n'hi ha cap que valga (el pilot, cap autor, una publicació pròpia
 *     o, en llavor, un autor fora del padró del xat local), el xat privat
 *     amb Sóc de Poble, el missatge directe amb l'entitat
 *     (useXatSocDePoble: resolt UNA vegada per a tota l'app; sense
 *     proveïdor, el de la llavor). Sense xat on portar, l'avís del proveïdor
 *     i cap navegació. `comentarPrivatAmb` és el nom per al menú.
 *     Correcció C6 · Si encara s'ha de resoldre, la navegació espera i n'hi
 *     ha UNA sola: la de l'última tria de tota l'app (el proveïdor diu si una
 *     demanda és la `darrera`), i només si la persona continua on era quan
 *     va triar (ni ha canviat de ruta ni ha desmuntat la peça).
 *   · 'public' · el xat públic de l'element (T63.2), amb el seu títol com a
 *     nom: hi pot entrar tothom.
 * Sense via no fa res: Comentar sempre passa pel menú. `comentarXat` diu què
 * oferix el menú: 'comu' (les dues vies), 'privat' (la pública, desactivada:
 * ací no hi ha xat públic) o null (cap menú). Un onComment propi mana com
 * sempre (les previsualitzacions que avisen) i aleshores no hi ha menú, com
 * amb un onTranslate propi. El Panell de Control ja no en passa cap: les seues
 * targetes porten el menú de totes.
 *
 * `objecte` (T63.2) diu quin és el xat PÚBLIC:
 *   · un descriptor tipat (objecteDe, objecteDePerfil, objecteDePagina…): el
 *     seu xat comú (rutaXatDePagina), si el contracte l'admet (subjecteDeXat).
 *     Una persona o una IA no en tenen: el seu missatge directe no és cap xat
 *     públic. Una nota, una carpeta, una categoria o una etiqueta tampoc, i
 *     Comentar no es pinta, encara que showComment el demane.
 *   · null: la pàgina sap que ara no té cap element (carregant, no trobat, un
 *     contingut de fora). No hi ha xat públic.
 *   · sense (undefined): el valor per defecte, rutaXatPerDefecte (la barra
 *     d'una pàgina, `telemetria.origen === 'pagina'`, hi posa la seua ruta).
 * Sense xat públic, el botó es queda on era i el menú també: la fila pública
 * diu per què, desactivada (amagar-la canviaria la forma del menú).
 * Connectar no el fa servir: continua amb onConnect.
 *
 * `traduccio` (Traductor Sobirà, ordre del Mestre, 260930 · via B) és el que
 * torna useTraduccioPagina: el munta PageFrame per a la barra d'una pàgina.
 * Traduir ja no porta a /traduccions: obri el menú de llengües (menuTraduir,
 * per a BarraBlava) i la llengua triada crida el servei de l'amfitrió; sense
 * servei, el clic ho diu (AVIS_SENSE_TRADUCTOR) i no s'obri cap menú. Un
 * onTranslate propi mana com sempre, i aleshores no hi ha menú. Sense
 * `traduccio` (les targetes i l'editor), el de sempre: /traduccions.
 *
 * Fase D (261020, tasca 2; pla 261020_1300 · App Store 1.2 i Google Play
 * UGC) · `ambModeracio` (false): la targeta o la barra oferix «Més opcions»
 * (Moderacio.jsx: denunciar i bloquejar). Tres interruptors independents: la
 * prop, el proveïdor (useModeracio, null fora de l'app) i la capacitat
 * 'moderacio' del backend (`disponible`); i, damunt, que l'objecte es puga
 * denunciar (objectiuDeTargeta: ni el pilot, ni la IAIA, ni qui mira).
 * Sense tots quatre, `moderacio` és null i cap píxel canvia. Amb ells,
 * { objectiu, potBloquejar, onTria(via, obridor) }: 'bloqueja' obri la
 * confirmació del bloqueig i qualsevol altra via, la denúncia.
 */
export function useAccions({
  title,
  mainHref,
  objecte,
  onConnect,
  onTranslate,
  onComment,
  onShare,
  showConnect,
  showTranslate,
  showComment,
  showShare,
  hasFooter,
  telemetria,
  traduccio,
  ambModeracio = false
}) {
  const { showToast } = useToast();
  const navigate = useNavigate();
  // T43a-1 (C3) · on està l'app, per a Connectar, Comentar i Compartir per defecte.
  const router = useUbicacioApp();

  // T43 · sense handler propi, el Connectar porta un descriptor tipat (no només el títol).
  const connectar = onConnect || (() => navigate(rutaConnectarPerDefecte(title, mainHref, router)));
  // Primer es compta i després es fa el de sempre (handler propi o navegació).
  // `telemetria.comptar === false`: el botó principal no és un Connectar
  // (p. ex. «Obrir» o «Veure detall» de la Consola) i no entra a la mètrica.
  const handleConnect = (...args) => {
    if (telemetria?.comptar !== false) registraConnectar(telemetria);
    return connectar(...args);
  };
  const handleTranslate = onTranslate
    || (traduccio ? traduccio.commutaMenu : () => navigate('/traduccions'));
  // El menú només existix si hi ha servei i ningú no ha posat el seu propi Traduir.
  const menuTraduir = !onTranslate && traduccio?.disponible ? traduccio.menu : null;
  /* Ordre del Mestre (261007) · «Comentaris = xat» · Les dues vies del menú
     de Comentar. La pública (T63.2) és el xat comú de l'objecte tipat o, sense
     objecte, el del valor per defecte; la ruta d'on està la persona es llig
     en el clic, com la de Connectar. Una persona o una IA no en tenen: el seu
     missatge directe no és cap xat públic. La privada ve del proveïdor de
     l'app (una sola resolució per a totes les targetes i barres). */
  /* La via «En privat», la mateixa peça que fa servir la fila d'ajuda del
     xat (useComentaEnPrivat, més amunt).
     Onada 8 (261009) · Amb l'autor de l'objecte (interlocutorDelPrivat), o
     amb Sóc de Poble si no n'hi ha cap que valga. El nom va al menú. */
  const xatSocDePoble = useXatSocDePoble();
  const ambQui = interlocutorDelPrivat(objecte, xatSocDePoble);
  const comentaEnPrivat = useComentaEnPrivat(ambQui);
  const pagina = telemetria?.origen === 'pagina';
  const rutaXatPublic = () => {
    if (objecte === undefined) return rutaXatPerDefecte(title, mainHref, { pagina, router });
    return modeXat(objecte) === 'comu' ? rutaXatDePagina(objecte) : null;
  };
  const comentaEnPublic = () => {
    const ruta = rutaXatPublic();
    if (ruta) navigate(ruta);
    else showToast(AVIS_SENSE_XAT);
  };
  const handleComment = onComment || ((via) => {
    if (via === 'privat') comentaEnPrivat();
    else if (via === 'public') comentaEnPublic();
  });
  const handleShare = onShare || (() => compartix(title, urlPerCompartir(mainHref, router), showToast));

  const perDefecte = hasFooter === true;
  const privat = !onComment && esPrivat(objecte);
  const traduirVisible = showTranslate ?? (perDefecte || Boolean(onTranslate));
  const comentarVisible = !privat && (showComment ?? (perDefecte || Boolean(onComment)));
  const compartirVisible = showShare ?? (perDefecte || Boolean(onShare));
  const connectarVisible = showConnect ?? (perDefecte || Boolean(onConnect));
  /* Ordre del Mestre (261007) · Què oferix el menú de Comentar (BotoComentar,
     a la barra i a la targeta): 'comu' (les dues vies), 'privat' (la pública,
     desactivada: ací no hi ha xat públic) o null (cap menú: un handler
     propi, que mana, o un objecte privat, sense Comentar). Derogats els noms
     de T63.2 ('directe'): ara les vies les diu el menú. */
  const comentarXat = (onComment || privat) ? null : (rutaXatPublic() ? 'comu' : 'privat');

  /* Fase D (261020, tasca 2) · «Més opcions»: es crida sempre (l'ordre dels
     hooks no canvia mai); sense proveïdor és null. */
  const moderacioDePoble = useModeracio();
  const objectiu = ambModeracio === true && moderacioDePoble?.disponible === true
    ? moderacioDePoble.objectiuDeTargeta?.(objecte) ?? null
    : null;
  const moderacio = objectiu ? {
    objectiu,
    potBloquejar: moderacioDePoble.potBloquejar === true && objectiu.bloquejable === true,
    onTria: (via, obridor) => (via === 'bloqueja'
      ? moderacioDePoble.demanaBloqueig(objectiu, obridor)
      : moderacioDePoble.demanaDenuncia(objectiu, obridor))
  } : null;

  return {
    handleConnect,
    handleTranslate,
    handleComment,
    handleShare,
    traduirVisible,
    comentarVisible,
    compartirVisible,
    connectarVisible,
    comentarXat,
    /* Onada 8 (261009) · El nom de l'interlocutor de «En privat», o null:
       el menú diu «Un xat només entre tu i Sóc de Poble», el de sempre. */
    comentarPrivatAmb: ambQui ? ambQui.nom : null,
    menuTraduir,
    /* Fase D (261020, tasca 2) · { objectiu, potBloquejar, onTria } o null. */
    moderacio
  };
}
