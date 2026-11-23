/**
 * revisionsEditorialsDelNavegador.js — Onada R30 · A4 (marge del sostre
 * d'arrencada del paquet WordPress) · La meitat del navegador de
 * revisionsEditorials.js, traslladada literalment: el registre reactiu per
 * clau `${seccio}:${id}` (memòria + localStorage, la clau
 * `publicacions.revisions.v1`), els seus oients i el solapament
 * (revisaElement, revisaLlista). La documentació de la forma desada i del
 * flux R12 continua a revisionsEditorials.js, que reexporta cada nom públic
 * d'ací amb el mateix nom: qui l'importava d'allí no canvia.
 *
 * Per què una fulla: MurContext (arrencada del paquet) només en llig
 * revisaLlista, subscriuRevisionsEditorials i versioRevisionsEditorials, i
 * en importar el mòdul sencer arrossegava al camí síncron l'escriptura al
 * servidor (desaRevisioEditorialAmbServidor, la migració i els avisos) i, amb
 * ella, src/data/seedRevisions.js. Cap d'ells no fa falta per al primer
 * pintat. Ara MurContext importa d'ací i el mòdul sencer queda diferit
 * (tests/standalone-build.test.mjs ho vigila sobre el build real).
 *
 * Un sol estat: la memòria, els oients i l'escolta de `storage` viuen ací i
 * revisionsEditorials.js els fa servir a través dels noms interns de baix
 * (versioValida, normalitzaClau, carregaMapa, persisteixMapa, notifica,
 * igual), que no reexporta. Cap altre mòdul no els ha d'importar.
 */
import { STORAGE_PREFIX, getVal, setVal } from '../config/storage.js';
/* v1.2.8 · wikiAlMur.js es carrega en diferit (backendPort.js) i s'hi registra en carregar-se: fins
   aleshores no hi ha cap capítol de la Wiki per fusionar (el mateix que fusionaCapitolsWiki sense catàleg). */
let fusionaCapitolsWiki = (llista) => llista;
export function registraCapitolsWiki(fusiona) { fusionaCapitolsWiki = typeof fusiona === 'function' ? fusiona : (llista) => llista; }
import { esVisibleAlMur } from './visibilitatMur.js';

const CLAU_STORAGE = 'publicacions.revisions.v1';
const SECCIONS_VALIDES = Object.freeze(new Set(['mur', 'events', 'sistema']));
/* Camp de la nota → claus de l'element, en l'ordre de lectura. */
const CLAUS_DE_L_ELEMENT = Object.freeze({
  title: Object.freeze(['title', 'name']),
  subtitle: Object.freeze(['post_subtitle', 'subtitle']),
  lead: Object.freeze(['entradilla', 'lead', 'summary']),
  content: Object.freeze(['content']),
  heroImage: Object.freeze(['image_url', 'image']),
  logoImage: Object.freeze(['logo_image']),
  copyright: Object.freeze(['copyright']),
  icon: Object.freeze(['icon']),
  publishDate: Object.freeze(['publish_date']),
  tags: Object.freeze(['tags']),
  mostrarAlMur: Object.freeze(['mostrarAlMur'])
});
export const CAMPS_DE_LA_REVISIO = Object.freeze(Object.keys(CLAUS_DE_L_ELEMENT));
const MAX_COS = 600000;
const MAX_TEXT = 4000;
const MAX_ETIQUETES = 50;

let versio = 0;
const oients = new Set();
let cacheMem = null;
let escoltaStorage = null;

export const versioValida = (valor) => Number.isSafeInteger(valor) && valor > 0;

export function normalitzaClau(seccio, id) {
  const s = String(seccio || '').trim().toLowerCase();
  const i = id == null ? '' : String(id).trim();
  if (!SECCIONS_VALIDES.has(s) || !i) return null;
  return `${s}:${i}`;
}

/* Només els camps coneguts, del tipus esperat i amb topall: el storage és de la persona, no de confiança. */
export function campsValids(camps) {
  if (!camps || typeof camps !== 'object' || Array.isArray(camps)) return null;
  const nets = {};
  for (const camp of CAMPS_DE_LA_REVISIO) {
    if (!Object.prototype.hasOwnProperty.call(camps, camp)) continue;
    const valor = camps[camp];
    if (camp === 'mostrarAlMur') {
      if (typeof valor === 'boolean') nets.mostrarAlMur = valor;
    } else if (camp === 'tags') {
      if (Array.isArray(valor)) {
        nets.tags = valor.filter((etiqueta) => typeof etiqueta === 'string' && etiqueta.length <= 80).slice(0, MAX_ETIQUETES);
      }
    } else if (camp === 'publishDate' && valor === null) {
      nets.publishDate = null;
    } else if (typeof valor === 'string' && valor.length <= (camp === 'content' ? MAX_COS : MAX_TEXT)) {
      nets[camp] = valor;
    }
  }
  return Object.keys(nets).length ? Object.freeze(nets) : null;
}

export function carregaMapa() {
  if (cacheMem) return cacheMem;
  const mapa = new Map();
  try {
    const desat = getVal(CLAU_STORAGE, null);
    if (desat && typeof desat === 'object' && !Array.isArray(desat)) {
      for (const [clau, entrada] of Object.entries(desat)) {
        const [seccio, ...resta] = String(clau).split(':');
        const normal = normalitzaClau(seccio, resta.join(':'));
        const camps = normal === clau ? campsValids(entrada?.camps) : null;
        if (camps) {
          const servidor = versioValida(entrada?.servidor?.versio) ? Object.freeze({ versio: entrada.servidor.versio,
            ...(entrada.servidor.tipus === 'seed' ? { tipus: 'seed', fontVersio: entrada.servidor.fontVersio } : {}) }) : null;
          mapa.set(clau, Object.freeze({ camps, desadaEl: typeof entrada.desadaEl === 'string' ? entrada.desadaEl : null, ...(servidor ? { servidor } : null) }));
        }
      }
    }
  } catch {
    /* sense storage disponible */
  }
  cacheMem = mapa;
  return cacheMem;
}

export function persisteixMapa(mapa) {
  try {
    setVal(CLAU_STORAGE, Object.fromEntries(mapa));
  } catch {
    /* sense storage disponible: la revisió viu en memòria fins a la recàrrega */
  }
}

export function notifica() {
  versio += 1;
  for (const fn of oients) {
    try { fn(); } catch { /* ignora error d'oient */ }
  }
}

/* Una altra pestanya ha desat o esborrat: es torna a llegir el storage. */
function enCanviDeStorage(event) {
  if (event?.key != null && event.key !== STORAGE_PREFIX + CLAU_STORAGE) return;
  cacheMem = null;
  notifica();
}

export function subscriuRevisionsEditorials(callback) {
  oients.add(callback);
  if (!escoltaStorage && typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    escoltaStorage = enCanviDeStorage;
    window.addEventListener('storage', escoltaStorage);
  }
  return () => {
    oients.delete(callback);
    if (!oients.size && escoltaStorage && typeof window !== 'undefined') {
      window.removeEventListener('storage', escoltaStorage);
      escoltaStorage = null;
    }
  };
}

export function versioRevisionsEditorials() {
  return versio;
}

/** Els camps revisats d'un element ({ title, content, … }) o null. */
export function revisioEditorial(seccio, id) {
  const clau = normalitzaClau(seccio, id);
  return clau ? carregaMapa().get(clau)?.camps || null : null;
}

/** Desa (fusionant amb la revisió anterior) els camps d'una revisió. Torna false si no n'accepta cap. */
export function desaRevisioEditorial(seccio, id, camps) {
  const clau = normalitzaClau(seccio, id);
  const nous = clau ? campsValids(camps) : null;
  if (!nous) return false;
  const mapa = carregaMapa();
  const fusionats = Object.freeze({ ...(mapa.get(clau)?.camps || {}), ...nous });
  mapa.set(clau, Object.freeze({ camps: fusionats, desadaEl: new Date().toISOString() }));
  persisteixMapa(mapa);
  notifica();
  return true;
}

export function oblidaRevisioEditorial(seccio, id) {
  const clau = normalitzaClau(seccio, id);
  const mapa = carregaMapa();
  if (!clau || !mapa.has(clau)) return false;
  mapa.delete(clau);
  persisteixMapa(mapa);
  notifica();
  return true;
}

const clauDeDesti = (element, claus) => claus.find((clau) => {
  const valor = element[clau];
  return typeof valor === 'string' ? valor !== '' : valor != null;
}) || claus[0];

export const igual = (a, b) => (Array.isArray(a) && Array.isArray(b)
  ? a.length === b.length && a.every((valor, index) => valor === b[index])
  : a === b);

const CLAUS_PAGINA_SISTEMA = Object.freeze({
  title: 'title',
  subtitle: 'subtitle',
  lead: 'lead',
  content: 'html',
  heroImage: 'image',
  logoImage: 'logo_image',
  copyright: 'copyright',
  icon: 'icon',
  publishDate: 'date'
});

/** Solapa la revisió editorial d'una pàgina de Sistema (`sistema:<pageKey>`) sense mutar PAGE_COPY ni trencar referència si no canvia. */
export function revisaPaginaSistema(pageKey, page) {
  if (!page || typeof page !== 'object' || !pageKey) return page;
  const clau = normalitzaClau('sistema', pageKey);
  const camps = clau ? carregaMapa().get(clau)?.camps || null : null;
  if (!camps) return page;
  let canviat = false;
  const nou = { ...page };
  for (const [camp, valor] of Object.entries(camps)) {
    const desti = CLAUS_PAGINA_SISTEMA[camp];
    if (!desti || (camp === 'publishDate' && !valor)) continue;
    if (!igual(page[desti], valor)) {
      nou[desti] = Array.isArray(valor) ? [...valor] : valor;
      canviat = true;
    }
    if (camp === 'content' && Object.prototype.hasOwnProperty.call(page, 'content') && !igual(page.content, valor)) {
      nou.content = valor;
      canviat = true;
    }
  }
  if (!canviat) return page;
  if (Object.prototype.hasOwnProperty.call(camps, 'content') && nou.contentLanguage && nou.contentLanguage !== 'ca') {
    nou.contentLanguage = 'ca';
  }
  return nou;
}

/** L'element amb la seua revisió al damunt (un objecte nou) o el MATEIX element
 *  si no en té o ja la porta (aplicar-la dos voltes no canvia la identitat). */
export function revisaElement(seccio, element) {
  if (!element || typeof element !== 'object' || element.id == null) return element;
  if (String(seccio || '').trim().toLowerCase() === 'sistema') {
    return revisaPaginaSistema(element.id, element);
  }
  const clau = normalitzaClau(seccio, element.id);
  const entrada = clau ? carregaMapa().get(clau) : null;
  const camps = entrada?.camps || null;
  if (!camps) return element;
  /* R12 · El servidor ja l'ha acceptada i el lector porta eixa versió (o una de
     posterior, d'una altra mà): mana la fila, no la còpia del navegador. */
  const versioDelServidor = entrada.servidor?.tipus === 'seed' ? element._seedRevisioVersio : element._editorialVersio;
  if (entrada.servidor?.tipus === 'seed' && versioValida(entrada.servidor.fontVersio)
    && versioValida(element._seedFontVersio || element._editorialVersio)
    && entrada.servidor.fontVersio !== (element._seedFontVersio || element._editorialVersio)) return element;
  if (entrada.servidor && versioValida(versioDelServidor) && versioDelServidor >= entrada.servidor.versio) return element;
  const canvis = Object.entries(camps)
    .map(([camp, valor]) => [clauDeDesti(element, CLAUS_DE_L_ELEMENT[camp]), valor])
    .filter(([clau, valor]) => !igual(element[clau], valor));
  if (typeof camps.mostrarAlMur === 'boolean' && element.ocultarDelMur !== !camps.mostrarAlMur) canvis.push(['ocultarDelMur', !camps.mostrarAlMur]);
  if (!canvis.length) return element;
  const revisat = { ...element };
  for (const [clau, valor] of canvis) revisat[clau] = Array.isArray(valor) ? [...valor] : valor;
  if (typeof camps.mostrarAlMur === 'boolean') revisat.ocultarDelMur = !camps.mostrarAlMur;
  return revisat;
}

/** La llista amb les revisions al damunt; la MATEIXA llista si cap element en té. */
export function revisaLlista(llista, seccio) {
  if (!Array.isArray(llista)) return llista || [];
  const mapa = carregaMapa();
  const s = String(seccio || '').trim().toLowerCase();
  if (!SECCIONS_VALIDES.has(s)) return llista;
  const base = s === 'mur' ? fusionaCapitolsWiki(llista) : llista;
  const revisades = mapa.size && base.some(element => element?.id != null && mapa.has(`${s}:${String(element.id)}`))
    ? base.map(element => revisaElement(s, element)) : base;
  if (s !== 'mur' || revisades.every(esVisibleAlMur)) return revisades;
  return revisades.filter(esVisibleAlMur);
}

/** Només per a _reiniciaRevisionsEditorialsPerAProves (revisionsEditorials.js): buida la memòria i l'emmagatzematge i avisa els oients. */
export function _buidaRevisionsDelNavegadorPerAProves() {
  cacheMem = new Map();
  persisteixMapa(cacheMem);
  notifica();
}
