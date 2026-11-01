/**
 * facetesCerca.js — Les facetes de l'espai de cerca en tres columnes
 * (IDEA-46, fase 1; B6-B1 de la marató 261101_2143), en funcions pures.
 *
 * Sense React, sense rellotge propi i sense xarxa: rep les entrades de
 * l'índex (indexCerca.js · entrada, les que torna cercaEntrades) i el moment
 * `ara` injectat, i torna els criteris de la columna de navegació i els
 * elements de la llista amb la forma de UniversalWorkspace. Cap mòdul el
 * munta encara: la vista (EspaiCerca) és de l'onada 2.
 *
 * Tres grups de criteris, cadascun amb el seu recompte (`count`):
 *   · Tipus: els de TIPUS_CERCA (sense «tot»), en el seu ordre;
 *   · Pobles: el poble llegible de l'entrada (`poble`); la clau és el slug
 *     del poble plegat («La Torre» i «la torre» són una sola opció) i
 *     l'etiqueta, la primera grafia vista; mai un correu;
 *   · Data: trams acumulatius del dia local (vegeu tramsDeData).
 * Un element compta a cada opció que porta entre els seus `categoryIds`, i
 * el recompte d'una opció és sempre el nombre d'elements que la porten.
 */
import { TIPUS_CERCA, plega } from './indexCerca.js';

/* `text` és el valor per defecte de la clau d'i18n `clau` (com TIPUS_CERCA). */
export const GRUPS_FACETES = Object.freeze([
  Object.freeze({ id: 'tipus', clau: 'section.search.espai.grup.tipus', text: 'Tipus' }),
  Object.freeze({ id: 'pobles', clau: 'section.search.espai.grup.pobles', text: 'Pobles' }),
  Object.freeze({ id: 'data', clau: 'section.search.espai.grup.data', text: 'Data' })
]);

export const TRAMS_DATA = Object.freeze([
  Object.freeze({ id: 'futur', clau: 'section.search.espai.data.futur', text: 'Pròximament' }),
  Object.freeze({ id: 'hui', clau: 'section.search.espai.data.hui', text: 'Hui' }),
  Object.freeze({ id: 'setmana', clau: 'section.search.espai.data.setmana', text: 'Esta setmana' }),
  Object.freeze({ id: 'mes', clau: 'section.search.espai.data.mes', text: 'Este mes' }),
  Object.freeze({ id: 'any', clau: 'section.search.espai.data.any', text: 'Este any' }),
  Object.freeze({ id: 'abans', clau: 'section.search.espai.data.abans', text: 'Abans' })
]);

/** L'id d'una opció de l'espai: 'tipus:agenda', 'poble:la-torre-de-les-macanes', 'data:hui'. */
export const idDeFaceta = (grup, valor) => `${grup}:${valor}`;

const TIPUS_DE_FACETA = Object.freeze(TIPUS_CERCA.filter((tipus) => tipus.id !== 'tot'));
const IDS_TIPUS_DE_FACETA = new Set(TIPUS_DE_FACETA.map((tipus) => tipus.id));

/* ── Data ───────────────────────────────────────────────────────────────── */

const DIA_MS = 86_400_000;
const MINUT_MS = 60_000;
/* El límit d'un Date d'ECMAScript: més enllà, cap data és vàlida. */
const LIMIT_DATA_MS = 8.64e15;
/* De UTC−14 a UTC+14: qualsevol altre desfasament és invàlid i compta com 0. */
const DESFAS_MAXIM = 14 * 60;

/* Una marca de l'índex: un número finit dins del rang d'un Date. 0 és
   «sense data» (indexCerca.js · marcaTemps). */
const esMarcaValida = (valor) => typeof valor === 'number' && Number.isFinite(valor) && valor !== 0
  && Math.abs(valor) <= LIMIT_DATA_MS;

function marcaDeLAra(ara) {
  const ms = ara instanceof Date ? ara.getTime() : ara;
  return typeof ms === 'number' && Number.isFinite(ms) && Math.abs(ms) <= LIMIT_DATA_MS ? ms : null;
}

const desfasValid = (valor) => (typeof valor === 'number' && Number.isFinite(valor) && Math.abs(valor) <= DESFAS_MAXIM
  ? valor : 0);

/* El desfasament d'una marca: el número fix, o el que torna la funció
   injectada per a eixa marca (vegeu tramsDeData). Una funció que llança o
   torna un valor invàlid compta com 0, igual que un número invàlid. */
function desfasDe(desfasMinuts, ms) {
  if (typeof desfasMinuts !== 'function') return desfasValid(desfasMinuts);
  try {
    return desfasValid(desfasMinuts(ms));
  } catch {
    return 0;
  }
}

/* El número del dia local d'una marca: dies des de l'1-1-1970 en l'hora local. */
const diaLocal = (ms, desfas) => Math.floor((ms + desfas * MINUT_MS) / DIA_MS);

/* El dia local de fa `mesos` mesos, amb el dia retallat a l'últim del mes
   (el 31 de març, un mes enrere, és el 28 o el 29 de febrer). */
function diaDeFaMesos(dia, mesos) {
  const data = new Date(dia * DIA_MS);
  const any = data.getUTCFullYear();
  const mes = data.getUTCMonth() - mesos;
  const ultim = new Date(Date.UTC(any, mes + 1, 0)).getUTCDate();
  return Math.floor(Date.UTC(any, mes, Math.min(data.getUTCDate(), ultim)) / DIA_MS);
}

/**
 * Els trams de data d'una marca (ms), en l'ordre de TRAMS_DATA.
 *   · `ara`: el moment de la consulta (ms o Date), injectat; sense, cap tram.
 *   · `desfasMinuts`: els minuts que l'hora local va per davant d'UTC (CET
 *     = 60, CEST = 120). Ull: és el signe contrari de
 *     Date#getTimezoneOffset (-60 en CET). Pot ser un número fix o una
 *     funció (ms) => minuts, que es pregunta per separat per a `ara` i per a
 *     la marca. La vista ha de passar la funció,
 *     (ms) => -new Date(ms).getTimezoneOffset(): amb un número fix, una
 *     data «AAAA-MM-DD» de l'horari d'estiu (la mitjanit local, en CEST)
 *     avaluada a l'hivern cauria al dia d'abans.
 * Per dies locals, i acumulatius: una entrada d'avui és alhora `hui`,
 * `setmana`, `mes` i `any`. `setmana`, `mes` i `any` arriben fins al mateix
 * dia de fa una setmana, un mes o un any, eixe dia inclòs; `abans` és el que
 * queda més enrere, i `futur`, el que cau després del final del dia local
 * (l'agenda). Una data absent o invàlida no entra en cap tram.
 */
export function tramsDeData(marcaMs, { ara, desfasMinuts = 0 } = {}) {
  const ms = marcaDeLAra(ara);
  if (ms == null || !esMarcaValida(marcaMs)) return [];
  const hui = diaLocal(ms, desfasDe(desfasMinuts, ms));
  const dia = diaLocal(marcaMs, desfasDe(desfasMinuts, marcaMs));
  if (dia > hui) return ['futur'];
  const limitMes = diaDeFaMesos(hui, 1);
  const limitAny = diaDeFaMesos(hui, 12);
  if (!Number.isFinite(limitMes) || !Number.isFinite(limitAny)) return [];
  if (dia < limitAny) return ['abans'];
  const trams = [];
  if (dia === hui) trams.push('hui');
  if (dia >= hui - 7) trams.push('setmana');
  if (dia >= limitMes) trams.push('mes');
  trams.push('any');
  return trams;
}

/* ── Pobles ─────────────────────────────────────────────────────────────── */

const slugDe = (plegat) => String(plegat ?? '').split(/[^a-z0-9]+/).filter(Boolean).join('-');
/* L'últim desempat, estable i sense dependre de la llengua. */
const ordreDeText = (a, b) => {
  if (a === b) return 0;
  return a < b ? -1 : 1;
};

/* { id, text } del poble d'una entrada, o null. `text` és la grafia llegible
   ('' si l'entrada només en porta el plegat: una fusió de fonts, vegeu
   indexCerca.js · fusiona). Un correu, sencer o tallat, no és mai cap poble:
   si la grafia o el plegat porten una arrova, l'entrada no en té (l'índex
   buida la grafia d'un correu però en conserva el plegat, i caure-hi
   tornaria a fer-ne una opció). `includes` i no esCorreu: lineal amb una
   entrada que no ve de l'índex i porta milers de caràcters. */
function pobleDe(entrada) {
  const brut = typeof entrada?.poble === 'string' ? entrada.poble.trim() : '';
  const plegatDeLEntrada = typeof entrada?.poblePlegat === 'string' ? entrada.poblePlegat : '';
  if (brut.includes('@') || plegatDeLEntrada.includes('@')) return null;
  const id = slugDe(brut ? plega(brut) : plegatDeLEntrada);
  return id ? { id, text: brut } : null;
}

/* La forma de correu d'indexCerca.js · esCorreu («x@y.z» dins d'una paraula,
   /[^\s@]+@[^\s@]+\.[^\s@]+/), en temps lineal: l'expressió regular fa
   retrocés quadràtic amb una paraula llarga sense espais, i una meta (el
   poble d'una publicació) pot portar milers de caràcters. Dins de cada
   paraula, cada arrova amb algun caràcter davant (des de l'arrova anterior)
   i, fins a l'arrova següent, un punt amb algun caràcter a cada costat. */
function teFormaDeCorreu(valor) {
  for (const paraula of String(valor ?? '').split(/\s+/)) {
    const trossos = paraula.split('@');
    for (let i = 1; i < trossos.length; i += 1) {
      const domini = trossos[i];
      const punt = domini.indexOf('.', 1);
      if (trossos[i - 1] && punt > 0 && punt < domini.length - 1) return true;
    }
  }
  return false;
}

/* ── Facetes d'una entrada ──────────────────────────────────────────────── */

/**
 * Els `categoryIds` d'una entrada: el seu tipus, el seu poble i els seus
 * trams de data (`opcions`: { ara, desfasMinuts }, com tramsDeData).
 */
export function facetesDeLEntrada(entrada, opcions = {}) {
  if (!entrada || typeof entrada !== 'object') return [];
  const ids = [];
  if (IDS_TIPUS_DE_FACETA.has(entrada.tipus)) ids.push(idDeFaceta('tipus', entrada.tipus));
  const poble = pobleDe(entrada);
  if (poble) ids.push(idDeFaceta('poble', poble.id));
  for (const tram of tramsDeData(entrada.data, opcions)) ids.push(idDeFaceta('data', tram));
  return ids;
}

/* Una passada sobre les entrades: cada entrada vàlida una sola vegada (per
   clau, la primera), els seus categoryIds, la primera grafia de cada poble i
   el recompte de cada opció. L'id d'un poble que cap entrada no porta en
   grafia llegible no fa cap opció ni es queda a cap element. */
function catalegDe(entrades, opcions) {
  const vistes = new Set();
  const files = [];
  const retolsDePoble = new Map();
  for (const entrada of Array.isArray(entrades) ? entrades : []) {
    if (!entrada || typeof entrada !== 'object' || typeof entrada.clau !== 'string' || !entrada.clau) continue;
    if (vistes.has(entrada.clau)) continue;
    vistes.add(entrada.clau);
    const poble = pobleDe(entrada);
    if (poble?.text && !retolsDePoble.has(poble.id)) retolsDePoble.set(poble.id, poble.text);
    files.push({ entrada, ids: facetesDeLEntrada(entrada, opcions) });
  }
  const prefixPoble = idDeFaceta('poble', '');
  const recomptes = new Map();
  for (const fila of files) {
    fila.ids = fila.ids.filter((id) => !id.startsWith(prefixPoble) || retolsDePoble.has(id.slice(prefixPoble.length)));
    for (const id of fila.ids) recomptes.set(id, (recomptes.get(id) || 0) + 1);
  }
  return { files, recomptes, retolsDePoble };
}

/**
 * Els grups de criteris de la navegació, en l'ordre de GRUPS_FACETES:
 * [{ id, clau, text, options: [{ id, clau?, text, count }] }]. Només hi ha
 * les opcions amb recompte, i un grup sense cap opció no hi és.
 *   · Tipus: en l'ordre de TIPUS_CERCA.
 *   · Pobles: de més a menys recompte; en empat, pel nom ('ca') i per l'id.
 *     Sense `clau`: el nom d'un poble no es traduïx.
 *   · Data: en l'ordre de TRAMS_DATA.
 */
export function grupsDeFacetes(entrades, opcions = {}) {
  const { recomptes, retolsDePoble } = catalegDe(entrades, opcions);
  const recompte = (id) => recomptes.get(id) || 0;
  const tipus = TIPUS_DE_FACETA
    .map((unTipus) => ({
      id: idDeFaceta('tipus', unTipus.id), clau: unTipus.clau, text: unTipus.text, count: recompte(idDeFaceta('tipus', unTipus.id))
    }))
    .filter((opcio) => opcio.count > 0);
  const pobles = [...retolsDePoble]
    .map(([id, text]) => ({ id: idDeFaceta('poble', id), text, count: recompte(idDeFaceta('poble', id)) }))
    .filter((opcio) => opcio.count > 0)
    .sort((a, b) => (b.count - a.count) || a.text.localeCompare(b.text, 'ca') || ordreDeText(a.id, b.id));
  const data = TRAMS_DATA
    .map((tram) => ({ id: idDeFaceta('data', tram.id), clau: tram.clau, text: tram.text, count: recompte(idDeFaceta('data', tram.id)) }))
    .filter((opcio) => opcio.count > 0);
  const opcionsDelGrup = { tipus, pobles, data };
  return GRUPS_FACETES
    .map((grup) => ({ id: grup.id, clau: grup.clau, text: grup.text, options: opcionsDelGrup[grup.id] }))
    .filter((grup) => grup.options.length > 0);
}

/* ISO d'una marca vàlida, o undefined (toISOString llança fora de rang). */
const isoDe = (ms) => (esMarcaValida(ms) ? new Date(ms).toISOString() : undefined);

/**
 * Els elements de la llista de l'espai, en l'ordre de les entrades (el del
 * rànquing): { id: clau, title, subtitle, updatedAt?, categoryIds, entrada }
 * i `image` només si l'entrada en porta una que /cerca ja pinta
 * (`imatge.src`). Ni `searchText` ni `tags`: la consulta és la de la
 * secció (fase 1). La meta que té forma de correu no passa al subtítol.
 */
export function itemsDeLEspai(entrades, opcions = {}) {
  const { files } = catalegDe(entrades, opcions);
  return files.map(({ entrada, ids }) => {
    const meta = Array.isArray(entrada.meta)
      ? entrada.meta.filter((valor) => typeof valor === 'string' && valor.trim() && !teFormaDeCorreu(valor))
      : [];
    const item = {
      id: entrada.clau,
      title: typeof entrada.titol === 'string' ? entrada.titol : '',
      subtitle: meta.join(' · '),
      updatedAt: isoDe(entrada.data),
      categoryIds: ids,
      entrada
    };
    const src = typeof entrada.imatge?.src === 'string' ? entrada.imatge.src.trim() : '';
    if (src) item.image = src;
    return item;
  });
}

/**
 * Els grups amb `label`, el nom que pinta UniversalWorkspace: `t(clau,
 * text)` si l'opció porta clau i hi ha traductor; si no, el `text` tal qual
 * (el nom d'un poble). Torna objectes nous i no toca els de l'entrada.
 */
export function ambEtiquetes(grups, t = null) {
  const etiqueta = (clau, text) => {
    if (typeof t !== 'function' || typeof clau !== 'string' || !clau) return text;
    const traduit = t(clau, text);
    return typeof traduit === 'string' && traduit ? traduit : text;
  };
  return (Array.isArray(grups) ? grups : []).map((grup) => ({
    id: grup.id,
    clau: grup.clau,
    text: grup.text,
    label: etiqueta(grup.clau, grup.text),
    options: (Array.isArray(grup.options) ? grup.options : []).map((opcio) => ({
      id: opcio.id,
      ...(opcio.clau ? { clau: opcio.clau } : {}),
      text: opcio.text,
      label: etiqueta(opcio.clau, opcio.text),
      count: opcio.count
    }))
  }));
}
