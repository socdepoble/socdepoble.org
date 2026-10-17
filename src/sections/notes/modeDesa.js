/**
 * modeDesa.js · T7C (P1) · El Snippet Curador a la URL del Bloc de Notes.
 *
 * El Snippet Curador és el mateix espai de treball del Bloc en mode compacte
 * (UniversalWorkspace `compacte`), obert amb una consulta i sense cap ruta
 * nova:
 *
 *   /notes?mode=desa&url=…&titol=…[&subtitol=…][&entradilla=…][&text=…]
 *
 * Tot el seu estat és a la URL (Clàusula dels Slugs): un enllaç copiat obri
 * el mateix snippet amb la mateixa tria.
 *
 *   · mode=desa             obri el snippet en lloc del Bloc.
 *   · url, titol (o title), subtitol, entradilla, text
 *                           el contingut de fora, amb les regles de
 *                           /connectar (contingutExtern.js). Carregar la ruta
 *                           no crea res: només el botó «Desar».
 *   · carpeta               on arriba (seleccioUrl.js). Sense, o si no és una
 *                           carpeta del Bloc, la Safata d’Entrada.
 *   · categoria, etiqueta   repetibles: una clau per valor.
 *   · emoticona             un sol emoji (utils/emoji.emojiSol).
 *   · desti                 SN (261003) · per a què és l'enllaç: sense, el
 *                           Bloc de notes; «lector», una font del Lector de
 *                           notícies (només si el Lector és disponible).
 *   · categoria-font        la categoria del poble de la font del Lector.
 *
 * Desar crea la nota (notaDeContingutExtern amb la carpeta triada, i les
 * categories, les etiquetes i l'emoticona) i porta a /notes?carpeta=…&nota=…
 * amb replace: Arrere no torna a un snippet ja desat. Amb «lector», l'enllaç
 * s'afig al Lector com una font personal, pendent del connector
 * (plataforma/destinacions.js), i es va a la gestió de fonts del Lector.
 *
 * Disparador. El botó visible a la Pàgina Universal és decisió del Mestre:
 * ací no se n'afig cap. Mentrestant, bookmarkletDesa() construïx el
 * bookmarklet que obri el snippet des de qualsevol web (amb { desti:
 * 'lector' }, amb el Lector de notícies ja triat). Model B: cap domini
 * fixat; l'origen és el de l'app que el genera (window.location.origin), on
 * l'SPA servix /notes. Porta el títol de la pàgina (300 caràcters com a
 * màxim, MAXIM_CAMP_ORIGEN) i, si hi ha text seleccionat, l'entradeta (256,
 * MAXIM_LEMA). E1 del Gauntlet (261016) · Hidrata a la manera d'OpenGraph:
 * el títol és og:title (o twitter:title) i, si no n'hi ha, el de la pàgina;
 * el subtítol, og:description (o twitter:description), tallat a 300 punts de
 * codi. La imatge (og:image) no: la doctrina de privacitat la deixa fora
 * (contingutExtern.js) i canviar-la és decisió del Mestre. La prova
 * modeDesa.test.js l'executa: si la URL que construïx deixa de ser un snippet
 * vàlid, falla.
 *
 * Privacitat (correcció T7C-R5). La finestra s'obri amb una petició GET: la
 * consulta (l'adreça, el títol, el subtítol i el text seleccionat) arriba al servidor que
 * servix l'app abans de cap clic a «Desar», i pot quedar als seus registres.
 * Per això l'adreça viatja SENSE el fragment (#…): ací van els testimonis
 * d'una tornada OAuth (#access_token=…). Una pàgina que només es distingix
 * pel fragment (rutes amb #/…) es desa amb l'adreça de davant del #. La
 * consulta de la pàgina (?…) sí que viatja, perquè sovint és l'adreça
 * mateixa; si porta un testimoni, també arriba. Passar-ho tot fora de la
 * consulta xoca amb la Clàusula dels Slugs: ho ha de decidir el Mestre.
 * Per la mateixa raó l'origen ha de ser https (o http només en local): la
 * consulta no viatja mai en clar per la xarxa.
 *
 * Pur: sense React ni xarxa.
 */
import { CARPETA_CONNECTATS } from './carpetes.js';
import { contingutExternDeParams, notaDeContingutExtern } from '../connectar/contingutExtern.js';
import { emojiSol } from '../../utils/emoji.js';
import { escriuSeleccio, llegixSeleccio } from '../../components/universal/workspace/seleccioUrl.js';

/** El valor de `mode` que obri el snippet. */
export const MODE_DESA = 'desa';

/** Les claus pròpies del snippet a la consulta. */
export const CLAUS_DESA = Object.freeze({
  mode: 'mode',
  categoria: 'categoria',
  etiqueta: 'etiqueta',
  emoticona: 'emoticona'
});

/** T7 (P9) · A la URL del Bloc l'element es diu «nota» (?carpeta=&nota=&seccio=). */
export const CLAUS_BLOC = Object.freeze({ item: 'nota' });

const CAP = Object.freeze([]);

function comParams(params) {
  if (params instanceof URLSearchParams) return params;
  if (typeof params === 'string') return new URLSearchParams(params);
  return new URLSearchParams();
}

/* Valors de text nets i sense repetir, en l'ordre que arriben. */
const unics = (valors) => [...new Set((valors || CAP).map((v) => String(v ?? '').trim()).filter(Boolean))];

/** Si la consulta obri el snippet. */
export const esModeDesa = (params) => comParams(params).get(CLAUS_DESA.mode) === MODE_DESA;

/**
 * La carpeta on arribarà l'enllaç: la de la URL si és una de `carpetes`
 * ({ id }), i si no la Safata d’Entrada (on arriba tot el que es connecta).
 */
export function carpetaDeDesa(params, carpetes = CAP) {
  const { carpeta } = llegixSeleccio(params, CLAUS_BLOC);
  return carpeta !== null && carpetes.some((c) => String(c?.id) === carpeta) ? carpeta : CARPETA_CONNECTATS;
}

/**
 * La tria del snippet que porta la URL:
 * { contingut, categories, etiquetes, emoticona }. `contingut` és el de
 * contingutExternDeParams: null sense cap adreça, { ok: false, errors } si
 * no val i { ok: true, valor } si es pot desar.
 */
export function llegixDesa(params) {
  const p = comParams(params);
  return {
    contingut: contingutExternDeParams(p),
    categories: unics(p.getAll(CLAUS_DESA.categoria)),
    etiquetes: unics(p.getAll(CLAUS_DESA.etiqueta)),
    emoticona: emojiSol(p.get(CLAUS_DESA.emoticona)) || ''
  };
}

/**
 * Una còpia dels paràmetres amb la tria escrita. Per a cada camp, `undefined`
 * no el toca. `carpeta` com a seleccioUrl (null l'esborra); les llistes
 * substituïxen tots els seus valors (una llista buida els esborra); una
 * emoticona que no és un sol emoji, o buida, s'esborra.
 */
export function escriuDesa(params, { carpeta, categories, etiquetes, emoticona } = {}) {
  const next = escriuSeleccio(params, carpeta === undefined ? {} : { carpeta }, CLAUS_BLOC);
  const posaLlista = (clau, valors) => {
    if (valors === undefined) return;
    next.delete(clau);
    for (const valor of unics(valors)) next.append(clau, valor);
  };
  posaLlista(CLAUS_DESA.categoria, categories);
  posaLlista(CLAUS_DESA.etiqueta, etiquetes);
  if (emoticona !== undefined) {
    const net = emojiSol(emoticona);
    if (net) next.set(CLAUS_DESA.emoticona, net);
    else next.delete(CLAUS_DESA.emoticona);
  }
  return next;
}

/**
 * La consulta del Bloc amb una nota oberta: ?carpeta=…&nota=…, sense res del
 * snippet. Sense nota, només la carpeta.
 */
export function paramsDeLaNota({ carpeta = null, nota = null } = {}) {
  return escriuSeleccio(new URLSearchParams(), { carpeta, item: nota }, CLAUS_BLOC);
}

/* ── El bookmarklet (Model B: l'origen ix de l'execució) ───────────────── */

/* __ORIGEN__ és l'origen de l'app, en JSON, i __DESTI__ la tria de la
   destinació, buida per al Bloc (bookmarkletDesa). La mida de la finestra no
   és cap punt de tall: qualitat.test.js en lleva la línia de davall.
   E1 del Gauntlet (ordre del Mestre, 261016, I05/I07: «hidrata títol,
   subtítol, entradeta, URL») · m(n): el content del meta de la pàgina
   (property="n" o name="n"), net d'espais; o(k): l'OpenGraph og:k i, si no
   n'hi ha, el de Twitter twitter:k. c(t, n): el text tallat a n punts de codi
   (mai un emoji partit), com els compta validaContingutExtern, que rebutja i no
   talla: abans es retallen 2n unitats perquè una selecció enorme no es
   desplegue sencera. Títol: og:title o document.title (300, MAXIM_CAMP_ORIGEN);
   subtítol: og:description (300), només si n'hi ha; entradeta: la selecció
   (256, MAXIM_LEMA); la url, sense el fragment. Cap imatge (og:image): la
   doctrina de contingutExtern.js no importa la de l'altra web. */
const PLANTILLA_BOOKMARKLET = "javascript:(()=>{const u=new URL('/notes',__ORIGEN__);const p=u.searchParams;const m=n=>((document.querySelector('meta[property=\"'+n+'\"],meta[name=\"'+n+'\"]')||{}).content||'').trim();const o=k=>m('og:'+k)||m('twitter:'+k);const c=(t,n)=>[...String(t).trim().slice(0,n*2)].slice(0,n).join('');p.set('mode','desa');__DESTI__p.set('url',location.href.split('#')[0]);p.set('titol',c(o('title')||document.title,300));const d=c(o('description'),300);if(d)p.set('subtitol',d);const s=c(getSelection()||'',256);if(s)p.set('entradilla',s);open(u.href,'sdp-desa','width=480,height=720');})();";

/* Bucle local: només ací s'admet http (desenvolupament). */
const esLocal = (host) => host === 'localhost' || host.endsWith('.localhost') || host === '127.0.0.1' || host === '[::1]';

/**
 * L'origen on s'obrirà el snippet: el d'una adreça https (o http en local),
 * sense camí, consulta, fragment ni credencials. null si no n'és cap.
 */
export function origenDelSnippet(valor) {
  let url;
  try { url = new URL(String(valor ?? '')); } catch { return null; }
  if (url.username || url.password) return null;
  if (url.protocol === 'https:' || (url.protocol === 'http:' && esLocal(url.hostname))) return url.origin;
  return null;
}

/**
 * El bookmarklet que obri el snippet a l'app d'`origen`; per defecte, la que
 * el genera (window.location.origin de l'SPA, on viu /notes). Cap domini de
 * reserva: sense un origen vàlid (origenDelSnippet), null.
 *
 * Ordre del Mestre, 261016 (prompt 261016_0015, Bloc 0: «L'usuari ha de poder
 * capturar contingut i decidir fàcilment si el destí és el Bloc de notes o el
 * Lector RSS») · `desti`, opcional: 'bloc' (el de sempre: el mateix
 * bookmarklet, caràcter a caràcter, que sense `desti`) o 'lector', que obri
 * el snippet amb ?desti=lector, el Lector ja triat. E1 del Gauntlet (261016) ·
 * El bookmarklet de sempre canvia a posta (la hidratació OpenGraph de la
 * plantilla), però la igualtat entre 'bloc' i sense `desti` continua: és el
 * mateix text. Els ja instal·lats no es tornen a generar i continuen valent: el
 * snippet no demana cap clau nova (el subtítol és opcional a
 * contingutExternDeParams). El Curador continua
 * decidint: només l'oferix si el Lector és disponible i, si no, és el Bloc
 * (SnippetCurador.jsx, correcció SN-R1). Qualsevol altre valor, null: cap
 * bookmarklet que porte una destinació que no existix.
 * @param {string} [origen]
 * @param {{ desti?: 'bloc'|'lector' }} [opcions]
 * @returns {string|null} un href javascript: o null
 */
export function bookmarkletDesa(origen = globalThis.location?.origin, { desti = DESTINS.bloc } = {}) {
  const net = origenDelSnippet(origen);
  if (!net || (desti !== DESTINS.bloc && desti !== DESTINS.lector)) return null;
  /* La clau i el valor són constants d'este mòdul (CLAUS_DESTI, DESTINS), mai text de fora. */
  const tria = desti === DESTINS.lector ? `p.set('${CLAUS_DESTI.desti}','${DESTINS.lector}');` : '';
  return PLANTILLA_BOOKMARKLET.replace('__DESTI__', () => tria).replace('__ORIGEN__', () => JSON.stringify(net));
}

/* ── SN (261003) · Per a què és l'enllaç: el Bloc o el Lector ──────────── */

/** Les destinacions del snippet: el Bloc de notes (per defecte) i el Lector de notícies. */
export const DESTINS = Object.freeze({ bloc: 'bloc', lector: 'lector' });
/** L'id de l'app del Lector a la plataforma (src/apps/lector/manifest.js). */
export const APP_LECTOR = 'lector';
/** Les claus de la destinació a la consulta (a banda de CLAUS_DESA). */
export const CLAUS_DESTI = Object.freeze({ desti: 'desti', categoriaFont: 'categoria-font' });

/**
 * La destinació que porta la URL: { desti, categoriaFont }. `desti` és
 * 'lector' només amb ?desti=lector; qualsevol altra cosa, el Bloc.
 * `categoriaFont`: el text de ?categoria-font= o null (la valida el Lector).
 */
export function llegixDesti(params) {
  const p = comParams(params);
  const categoria = String(p.get(CLAUS_DESTI.categoriaFont) ?? '').trim();
  return {
    desti: p.get(CLAUS_DESTI.desti) === DESTINS.lector ? DESTINS.lector : DESTINS.bloc,
    categoriaFont: categoria || null
  };
}

/**
 * Una còpia dels paràmetres amb la destinació escrita. `undefined` no toca;
 * el Bloc (la de per defecte) i una categoria buida o null s'esborren.
 */
export function escriuDesti(params, { desti, categoriaFont } = {}) {
  const next = new URLSearchParams(comParams(params));
  if (desti !== undefined) {
    if (desti === DESTINS.lector) next.set(CLAUS_DESTI.desti, DESTINS.lector);
    else next.delete(CLAUS_DESTI.desti);
  }
  if (categoriaFont !== undefined) {
    const net = String(categoriaFont ?? '').trim();
    if (net) next.set(CLAUS_DESTI.categoriaFont, net);
    else next.delete(CLAUS_DESTI.categoriaFont);
  }
  return next;
}

/**
 * El nom proposat per a la font del Lector: el títol que porta l'enllaç o,
 * sense títol, el domini sense «www.»; tallat a `maxim` unitats sense partir
 * cap emoji (com el talla el Lector).
 */
export function nomProposat(valor, maxim = 80) {
  if (!valor) return '';
  const base = valor.titol && valor.titol !== valor.lloc ? valor.titol : String(valor.lloc ?? '').replace(/^www\./, '');
  let eixida = '';
  for (const caracter of base) {
    if (eixida.length + caracter.length > maxim) break;
    eixida += caracter;
  }
  return eixida.trim();
}

/**
 * L'entrada de la destinació del Lector per al contingut validat: l'adreça,
 * el nom (net d'espais) i la categoria (o null). null sense contingut.
 */
export function entradaDeFont(valor, { nom = '', categoriaId = null } = {}) {
  if (!valor?.url) return null;
  return { url: valor.url, nom: String(nom ?? '').trim(), categoriaId: categoriaId || null };
}

/**
 * L'entrada de creaNota per al contingut validat (`valor` de llegixDesa) a la
 * carpeta triada, amb les categories, les etiquetes i l'emoticona; null si
 * el contingut no val (notaDeContingutExtern).
 */
export function entradaDeDesa(valor, { carpeta = CARPETA_CONNECTATS, categories = CAP, etiquetes = CAP, emoticona = '' } = {}) {
  const entrada = notaDeContingutExtern(valor, { carpeta });
  if (!entrada) return null;
  const cats = unics(categories);
  const tags = unics(etiquetes);
  const icon = emojiSol(emoticona);
  return {
    ...entrada,
    ...(cats.length ? { categories: cats } : {}),
    ...(tags.length ? { tags } : {}),
    ...(icon ? { icon } : {})
  };
}
