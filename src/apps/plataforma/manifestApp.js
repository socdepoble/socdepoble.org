/**
 * Plataforma d'Apps Enxufables · el manifest `sdp.app.v1`.
 *
 * Un manifest és DADA PURA: diu qui és l'app, quines entrades té la seua barra
 * lateral i amb quines condicions s'encén. No porta HTML, ni SVG, ni rutes
 * declarables: la ruta es deriva de l'id (/app/<id>), i les icones són noms
 * d'una llista tancada de lucide (iconesApp.js les resol).
 *
 * Tres orígens:
 *   · interna  · viu a src/apps/<id>/manifest.js i porta `carrega`
 *                (() => import('./AppX.jsx') darrere del literal de compilació,
 *                o null quan el build no la inclou);
 *   · externa  · la registra un amfitrió (WordPress, Sollutia) amb
 *                registraAppExterna: porta `element`, l'etiqueta d'un custom
 *                element amb un prefix de PREFIXOS_ELEMENT, i cap `carrega`;
 *   · modul    · contracte sdp.modul.v1 (ADR-2026-12): una app compilada a
 *                banda del paquet que l'amfitrió registra amb registraModul.
 *                Porta `cos` ({ cami, integrity sha384 }: el script que la
 *                lliura), `estils` opcionals amb la mateixa forma i `nucli`,
 *                el rang del nucli que necessita ('^1'). Ni `carrega` ni
 *                `element`: el cos el carrega carregaModul.js, del mateix
 *                origen que la pàgina i amb la seua integritat.
 *
 * validaManifestApp torna { ok, errors, manifest }: el manifest normalitzat i
 * congelat, o null. L'esquema és tancat: una clau desconeguda és un error,
 * perquè ningú hi puga colar res que la plataforma no sàpia llegir.
 */
import { CAPACITATS } from '../../data/contracte.js';
import { PATRO_RANG_NUCLI } from './contracteNucli.js';

export const ESQUEMA_APP = 'sdp.app.v1';
export const ORIGENS_APP = Object.freeze(['interna', 'externa', 'modul']);
export const LLENGUES_APP = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);

/* Llista tancada d'icones (noms de lucide-react). Afegir-ne una és una decisió
   de la plataforma: iconesApp.js ha de tindre exactament estes claus. */
export const NOMS_ICONES = Object.freeze([
  'Activity', 'AppWindow', 'BookOpen', 'Boxes', 'Building2', 'Calculator', 'CalendarDays', 'ChartColumn', 'ChefHat',
  'ClipboardList', 'Coffee', 'Contact', 'CupSoda', 'Droplet', 'FileSpreadsheet', 'FileText', 'HeartHandshake', 'HeartPulse', 'Inbox',
  'Landmark', 'LayoutDashboard', 'LayoutGrid', 'NotebookPen', 'Package', 'Percent', 'Phone', 'Pill', 'Puzzle', 'Receipt',
  'ScanLine', 'Settings', 'ShoppingCart', 'Stethoscope', 'Store', 'Users', 'Utensils', 'Wrench'
]);

/* Prefixos admesos per a l'element d'una app externa. El nucli no en coneix
   cap altre: un amfitrió nou demana el seu prefix, no se l'inventa. */
export const PREFIXOS_ELEMENT = Object.freeze(['sollutia-', 'sdp-ext-']);

export const PERMISOS_VEURE = Object.freeze(['public', 'sessio', 'superadmin']);
export const PERMISOS_ESCRIURE = Object.freeze(['sessio', 'superadmin']);
/* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B: la boina de la
   Gestoria porta el titular de la sessió) · permisos.titular 'sessio': l'app
   rep pel pont (useSessioApp().titular) el nom, l'avatar i el poble de la
   persona que ha entrat. Només una app interna el pot declarar: cap codi
   d'un amfitrió (externa) ni compilat a banda (modul) no rep cap dada de la
   persona. Sense, el titular és sempre null. */
export const PERMISOS_TITULAR = Object.freeze(['sessio']);
export const NIVELLS = Object.freeze(['gratuit', 'premium']);
export const ENTORNS = Object.freeze(['produccio', 'desenvolupament']);
export const DADES_PERSONALS = Object.freeze([false, 'salut', 'financeres']);

/* L'id és un slug: el primer tram de /app/<id>. */
export const PATRO_ID_APP = /^[a-z][a-z0-9-]{1,30}$/;
/* Slug d'entrada, de grup i d'interruptor: minúscules, xifres i guions solts. */
export const PATRO_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PATRO_DRET = /^sdp\.app\.[a-z0-9-]+(?:\.[a-z0-9-]+)*$/;
const PATRO_ELEMENT = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$/;
/* Cap HTML ni caràcter de control dins d'un text: es pinta sempre com a text,
   però un manifest que en porta no és de fiar. */
const PATRO_TEXT_PROHIBIT = /[<>\u0000-\u001F\u007F-\u009F]/;

const MAX_TITOL = 60;
const MAX_ENTRADES = 20;
const MAX_INTERRUPTORS = 20;

const CLAUS_COMUNES = ['schema', 'id', 'titol', 'icona', 'entrades', 'grups', 'entradaPerDefecte', 'permisos',
  'capacitats', 'nivell', 'dret', 'actiuPerDefecte', 'entorn', 'dadesPersonals', 'interruptors'];
const CLAUS_INTERNA = new Set([...CLAUS_COMUNES, 'carrega']);
const CLAUS_EXTERNA = new Set([...CLAUS_COMUNES, 'element']);
const CLAUS_MODUL = new Set([...CLAUS_COMUNES, 'cos', 'estils', 'nucli']);
const CLAUS_RECURS = new Set(['cami', 'integrity']);
/* SRI d'un recurs d'un mòdul: sha384 en base64 (48 octets, 64 caràcters). */
export const PATRO_INTEGRITAT = /^sha384-[A-Za-z0-9+/]{64}$/;
const MAX_CAMI = 2048;
/* Ni espais, ni barres invertides (el navegador les llig com a «/» i
   '/\x' seria un altre domini), ni cometes, ni caràcters de control. */
const PATRO_CAMI_PROHIBIT = /[\s\\"'<>`\u0000-\u001F\u007F-\u009F]/;
const CLAUS_ENTRADA = new Set(['slug', 'titol', 'icona', 'grup', 'permis']);
const CLAUS_GRUP = new Set(['id', 'titol']);
const CLAUS_INTERRUPTOR = new Set(['id', 'titol', 'nivell', 'dret', 'actiuPerDefecte']);
const CLAUS_PERMISOS = new Set(['veure', 'escriure', 'titular']);

const esObjecte = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);
const esIdApp = (valor) => typeof valor === 'string' && PATRO_ID_APP.test(valor) && !valor.endsWith('-') && !valor.includes('--');
const esSlug = (valor) => typeof valor === 'string' && valor.length <= 40 && PATRO_SLUG.test(valor);

export { esIdApp };

/** El text d'un títol en la llengua demanada o, si no n'hi ha, en valencià. */
export function titolDe(titol, idioma = 'ca') {
  if (!esObjecte(titol)) return '';
  return (typeof titol[idioma] === 'string' && titol[idioma]) || titol.ca || '';
}

/** Ruta d'una app: /app/<id> i, si n'hi ha, els trams que hi pengen. */
export function rutaDeApp(id, ...trams) {
  const resta = trams.filter((tram) => tram !== undefined && tram !== null && tram !== '').map(String);
  return ['/app', id, ...resta].join('/');
}

function clausDesconegudes(objecte, permeses, on, errors) {
  for (const clau of Object.keys(objecte)) {
    if (!permeses.has(clau)) errors.push(`${on}: clau desconeguda «${clau}»`);
  }
}

function validaTitol(titol, on, errors) {
  if (!esObjecte(titol)) { errors.push(`${on}: el títol ha de ser un objecte { ca, … }`); return null; }
  const net = {};
  for (const [llengua, text] of Object.entries(titol)) {
    if (!LLENGUES_APP.includes(llengua)) { errors.push(`${on}: llengua desconeguda «${llengua}»`); continue; }
    if (typeof text !== 'string' || !text.trim()) { errors.push(`${on}: el títol en ${llengua} és buit`); continue; }
    if (text.length > MAX_TITOL) errors.push(`${on}: el títol en ${llengua} passa de ${MAX_TITOL} caràcters`);
    if (PATRO_TEXT_PROHIBIT.test(text)) errors.push(`${on}: el títol en ${llengua} porta HTML o caràcters de control`);
    net[llengua] = text.trim();
  }
  if (!net.ca) errors.push(`${on}: falta el títol en valencià (ca)`);
  return Object.freeze(net);
}

function validaIcona(icona, on, errors) {
  if (!NOMS_ICONES.includes(icona)) errors.push(`${on}: icona fora de la llista tancada («${String(icona)}»)`);
}

function validaGrups(grups, errors) {
  if (grups === undefined) return Object.freeze([]);
  if (!Array.isArray(grups)) { errors.push('grups: ha de ser una llista'); return Object.freeze([]); }
  const vistos = new Set();
  return Object.freeze(grups.map((grup, i) => {
    const on = `grups[${i}]`;
    if (!esObjecte(grup)) { errors.push(`${on}: ha de ser un objecte`); return null; }
    clausDesconegudes(grup, CLAUS_GRUP, on, errors);
    if (!esSlug(grup.id)) errors.push(`${on}: l'id ha de ser un slug`);
    else if (vistos.has(grup.id)) errors.push(`${on}: id repetit «${grup.id}»`);
    vistos.add(grup.id);
    return Object.freeze({ id: grup.id, titol: validaTitol(grup.titol, on, errors) });
  }).filter(Boolean));
}

function validaEntrades(entrades, grups, errors) {
  if (!Array.isArray(entrades) || entrades.length === 0) { errors.push('entrades: cal almenys una entrada'); return Object.freeze([]); }
  if (entrades.length > MAX_ENTRADES) errors.push(`entrades: com a màxim ${MAX_ENTRADES}`);
  const idsGrups = new Set(grups.map((grup) => grup.id));
  const vistos = new Set();
  return Object.freeze(entrades.map((entrada, i) => {
    const on = `entrades[${i}]`;
    if (!esObjecte(entrada)) { errors.push(`${on}: ha de ser un objecte`); return null; }
    clausDesconegudes(entrada, CLAUS_ENTRADA, on, errors);
    if (!esSlug(entrada.slug)) errors.push(`${on}: el slug ha de ser [a-z0-9-]`);
    else if (vistos.has(entrada.slug)) errors.push(`${on}: slug repetit «${entrada.slug}»`);
    vistos.add(entrada.slug);
    validaIcona(entrada.icona, on, errors);
    if (entrada.grup !== undefined && !idsGrups.has(entrada.grup)) errors.push(`${on}: el grup «${String(entrada.grup)}» no existix`);
    if (entrada.permis !== undefined && !PERMISOS_VEURE.includes(entrada.permis)) errors.push(`${on}: permís desconegut`);
    return Object.freeze({
      slug: entrada.slug,
      titol: validaTitol(entrada.titol, on, errors),
      icona: entrada.icona,
      ...(entrada.grup !== undefined ? { grup: entrada.grup } : {}),
      ...(entrada.permis !== undefined ? { permis: entrada.permis } : {})
    });
  }).filter(Boolean));
}

function validaInterruptors(interruptors, errors) {
  if (interruptors === undefined) return Object.freeze([]);
  if (!Array.isArray(interruptors)) { errors.push('interruptors: ha de ser una llista'); return Object.freeze([]); }
  if (interruptors.length > MAX_INTERRUPTORS) errors.push(`interruptors: com a màxim ${MAX_INTERRUPTORS}`);
  const vistos = new Set();
  return Object.freeze(interruptors.map((interruptor, i) => {
    const on = `interruptors[${i}]`;
    if (!esObjecte(interruptor)) { errors.push(`${on}: ha de ser un objecte`); return null; }
    clausDesconegudes(interruptor, CLAUS_INTERRUPTOR, on, errors);
    if (!esSlug(interruptor.id)) errors.push(`${on}: l'id ha de ser un slug`);
    else if (vistos.has(interruptor.id)) errors.push(`${on}: id repetit «${interruptor.id}»`);
    vistos.add(interruptor.id);
    const nivell = interruptor.nivell ?? 'gratuit';
    if (!NIVELLS.includes(nivell)) errors.push(`${on}: nivell desconegut`);
    if (nivell === 'premium' && !(typeof interruptor.dret === 'string' && PATRO_DRET.test(interruptor.dret))) {
      errors.push(`${on}: un interruptor premium necessita un dret sdp.app.<…>`);
    }
    const actiuPerDefecte = interruptor.actiuPerDefecte ?? true;
    if (typeof actiuPerDefecte !== 'boolean') errors.push(`${on}: actiuPerDefecte ha de ser booleà`);
    return Object.freeze({
      id: interruptor.id,
      titol: validaTitol(interruptor.titol, on, errors),
      nivell,
      ...(interruptor.dret !== undefined ? { dret: interruptor.dret } : {}),
      actiuPerDefecte
    });
  }).filter(Boolean));
}

function validaPermisos(permisos, origen, errors) {
  if (!esObjecte(permisos)) { errors.push('permisos: cal { veure, escriure?, titular? }'); return Object.freeze({ veure: 'public' }); }
  clausDesconegudes(permisos, CLAUS_PERMISOS, 'permisos', errors);
  if (!PERMISOS_VEURE.includes(permisos.veure)) errors.push('permisos.veure: public | sessio | superadmin');
  if (permisos.escriure !== undefined && !PERMISOS_ESCRIURE.includes(permisos.escriure)) errors.push('permisos.escriure: sessio | superadmin');
  if (permisos.titular !== undefined) {
    if (!PERMISOS_TITULAR.includes(permisos.titular)) errors.push('permisos.titular: sessio');
    else if (origen !== 'interna') errors.push('permisos.titular: només les apps internes reben el titular de la sessió');
  }
  return Object.freeze({
    veure: permisos.veure,
    ...(permisos.escriure !== undefined ? { escriure: permisos.escriure } : {}),
    ...(permisos.titular !== undefined ? { titular: permisos.titular } : {})
  });
}

function validaCapacitats(capacitats, errors) {
  if (!Array.isArray(capacitats)) { errors.push('capacitats: ha de ser una llista (pot ser buida)'); return Object.freeze([]); }
  for (const capacitat of capacitats) {
    if (!Object.hasOwn(CAPACITATS, capacitat)) errors.push(`capacitats: «${String(capacitat)}» no és cap capacitat del contracte`);
  }
  return Object.freeze([...capacitats]);
}

/**
 * Cert si `cami` pot ser el camí d'un recurs d'un mòdul amb l'extensió
 * donada: un camí des de l'arrel ('/…', mai '//…') o una URL http(s) absoluta
 * sense credencials. El mateix origen que la pàgina el comprova el
 * carregador (carregaModul.js) en carregar: ací no hi ha cap pàgina.
 */
export function esCamiDeRecurs(cami, extensio) {
  if (typeof cami !== 'string' || !cami || cami.length > MAX_CAMI || PATRO_CAMI_PROHIBIT.test(cami)) return false;
  let url;
  try {
    url = cami.startsWith('/') ? (cami.startsWith('//') ? null : new URL(cami, 'https://amfitrio.invalid')) : new URL(cami);
  } catch {
    return false;
  }
  if (!url || (url.protocol !== 'https:' && url.protocol !== 'http:') || url.username || url.password) return false;
  return url.pathname.endsWith(extensio);
}

function validaRecurs(recurs, on, extensio, errors) {
  if (!esObjecte(recurs)) { errors.push(`${on}: cal { cami, integrity }`); return null; }
  clausDesconegudes(recurs, CLAUS_RECURS, on, errors);
  if (!esCamiDeRecurs(recurs.cami, extensio)) errors.push(`${on}.cami: camí des de l'arrel o URL http(s) d'un fitxer ${extensio}`);
  if (!(typeof recurs.integrity === 'string' && PATRO_INTEGRITAT.test(recurs.integrity))) errors.push(`${on}.integrity: sha384-<base64>`);
  return Object.freeze({ cami: recurs.cami, integrity: recurs.integrity });
}

/** Valida l'element d'una app externa (custom element amb prefix permés). */
export function esElementPermes(element) {
  return typeof element === 'string' && element.length <= 60 && PATRO_ELEMENT.test(element)
    && PREFIXOS_ELEMENT.some((prefix) => element.startsWith(prefix) && element.length > prefix.length);
}

/**
 * Valida i normalitza un manifest. `origen`: 'interna' (per defecte),
 * 'externa' o 'modul'.
 * @returns {{ ok: boolean, errors: string[], manifest: object|null }}
 */
export function validaManifestApp(m, { origen = 'interna' } = {}) {
  const errors = [];
  if (!esObjecte(m)) return { ok: false, errors: ['el manifest ha de ser un objecte'], manifest: null };
  const externa = origen === 'externa';
  const modul = origen === 'modul';
  clausDesconegudes(m, externa ? CLAUS_EXTERNA : modul ? CLAUS_MODUL : CLAUS_INTERNA, 'manifest', errors);
  if (m.schema !== ESQUEMA_APP) errors.push(`schema: ha de ser «${ESQUEMA_APP}»`);
  if (!esIdApp(m.id)) errors.push('id: slug /^[a-z][a-z0-9-]{1,30}$/ sense guions al final ni dobles');
  const titol = validaTitol(m.titol, 'titol', errors);
  validaIcona(m.icona, 'icona', errors);
  const grups = validaGrups(m.grups, errors);
  const entrades = validaEntrades(m.entrades, grups, errors);
  if (!entrades.some((entrada) => entrada.slug === m.entradaPerDefecte)) errors.push('entradaPerDefecte: ha de ser el slug d’una entrada');
  for (const grup of grups) {
    if (!entrades.some((entrada) => entrada.grup === grup.id)) errors.push(`grups: el grup «${grup.id}» no té cap entrada`);
  }
  const permisos = validaPermisos(m.permisos, externa ? 'externa' : modul ? 'modul' : 'interna', errors);
  const capacitats = validaCapacitats(m.capacitats, errors);
  if (!NIVELLS.includes(m.nivell)) errors.push('nivell: gratuit | premium');
  if (m.nivell === 'premium' && !(typeof m.dret === 'string' && PATRO_DRET.test(m.dret))) errors.push('dret: una app premium necessita un dret sdp.app.<id>');
  if (m.dret !== undefined && !(typeof m.dret === 'string' && PATRO_DRET.test(m.dret))) errors.push('dret: forma sdp.app.<…>');
  if (typeof m.actiuPerDefecte !== 'boolean') errors.push('actiuPerDefecte: ha de ser booleà');
  if (!ENTORNS.includes(m.entorn)) errors.push('entorn: produccio | desenvolupament');
  if (!DADES_PERSONALS.includes(m.dadesPersonals)) errors.push("dadesPersonals: false | 'salut' | 'financeres'");
  const interruptors = validaInterruptors(m.interruptors, errors);

  let delModul = null;
  if (externa) {
    if (!esElementPermes(m.element)) errors.push(`element: custom element amb prefix ${PREFIXOS_ELEMENT.join(' o ')}`);
  } else if (modul) {
    const cos = validaRecurs(m.cos, 'cos', '.js', errors);
    const estils = m.estils === undefined ? null : validaRecurs(m.estils, 'estils', '.css', errors);
    if (!(typeof m.nucli === 'string' && PATRO_RANG_NUCLI.test(m.nucli))) errors.push("nucli: el rang del nucli, '^<major>' (p. ex. '^1')");
    delModul = { cos, ...(estils ? { estils } : {}), nucli: m.nucli };
  } else if (!(m.carrega === null || typeof m.carrega === 'function')) {
    errors.push('carrega: () => import(…) darrere del literal de compilació, o null');
  }

  if (errors.length) return { ok: false, errors, manifest: null };
  return {
    ok: true,
    errors: [],
    manifest: Object.freeze({
      schema: ESQUEMA_APP,
      id: m.id,
      origen: externa ? 'externa' : modul ? 'modul' : 'interna',
      titol,
      icona: m.icona,
      entrades,
      grups,
      entradaPerDefecte: m.entradaPerDefecte,
      permisos,
      capacitats,
      nivell: m.nivell,
      ...(m.dret !== undefined ? { dret: m.dret } : {}),
      actiuPerDefecte: m.actiuPerDefecte,
      entorn: m.entorn,
      dadesPersonals: m.dadesPersonals,
      interruptors,
      ...(externa ? { element: m.element } : modul ? delModul : { carrega: m.carrega })
    })
  };
}
