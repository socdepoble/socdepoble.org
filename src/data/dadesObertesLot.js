/**
 * dadesObertesLot.js — Les formes de les dades obertes d'un poble (T2 ·
 * D04/D10; assalt 261101, pla 261101_1246, D-3). Pur: cap xarxa, rellotge ni
 * React, i només importa el contracte i el slug de activitypub.js.
 *
 *   fallesDeDadesObertes(valor)       la resposta de llegixDadesObertes
 *                                      (capacitat 'dadesObertes'): la usa la
 *                                      recollida del paquet Open Data.
 *   validaLotDadesObertes(lot)         el lot que restauraDadesObertes accepta
 *                                      (capacitat 'restauracioDadesObertes'):
 *                                      el fa el restaurador
 *                                      (importaMunicipiOpenData.js) i el
 *                                      revalida cada adaptador.
 *   estatBuitDeDadesObertes()          el magatzem d'un adaptador que restaura,
 *   fusionaLotDadesObertes(estat, lot, { ocupats })
 *                                      una restauració atòmica i idempotent
 *                                      (ocupats: el que el node ja té fora
 *                                      del magatzem, Gauntlet D-01), i
 *   llegixDeLEstat(estat, { poble })   el que el magatzem servix d'un poble.
 *
 * El lot és el contingut PÚBLIC del poble i res més: llista blanca de camps
 * per col·lecció, valors de text o null, ids opacs i únics, visibility
 * 'public', tot del mateix poble i signat per una entitat. Mai cap persona:
 * cap clau de persona propietària ni cap correu hi cap (no són a la llista).
 */
import { COLECCIONS_DADES_OBERTES, LIMIT_DADES_OBERTES } from './contracte.js';
import { normalitzaSlugMunicipi } from './activitypub.js';

export const FORMAT_LOT = 'socdepoble.dadesobertes.v1';
/* Les col·leccions del lot: les de llegixDadesObertes més el directori. */
export const COLECCIONS_DEL_LOT = Object.freeze(['entitats', ...COLECCIONS_DADES_OBERTES]);
/* Els ÚNICS camps de cada col·lecció del lot. */
export const CAMPS_DEL_LOT = Object.freeze({
  entitats: Object.freeze(['id', 'slug', 'name', 'kind', 'parent_organization_id', 'lema', 'description', 'logo_url', 'hero_url',
    'copyright', 'town_name', 'visibility']),
  noticies: Object.freeze(['id', 'title', 'subtitle', 'entradilla', 'body', 'created_at', 'updated_at', 'image_url', 'author_org_id',
    'poble_id', 'copyright', 'visibility']),
  agenda: Object.freeze(['id', 'title', 'subtitle', 'entradilla', 'inici', 'fi', 'location', 'image_url', 'author_org_id', 'poble_id',
    'copyright', 'created_at', 'updated_at', 'visibility']),
  memoria: Object.freeze(['id', 'title', 'entradilla', 'text', 'created_at', 'updated_at', 'image_url', 'author_org_id', 'poble_id',
    'copyright', 'visibility']),
  memoriaOral: Object.freeze(['id', 'okf', 'author_org_id', 'copyright', 'created_at', 'updated_at', 'visibility'])
});
const CLAUS_LOT = Object.freeze(['format', 'versio', 'municipi', ...COLECCIONS_DEL_LOT]);
const CLAUS_MUNICIPI_LOT = Object.freeze(['slug', 'nom', 'descripcio', 'wikidata', 'lat', 'lng']);
const CLAUS_OKF = Object.freeze(['cami', 'frontmatter', 'cos']);
const KINDS = Object.freeze(['company', 'entity', 'group']);
/* Les claus que mai poden arribar a un objecte (contaminació del prototip). */
const CLAUS_PERILLOSES = Object.freeze(['__proto__', 'constructor', 'prototype']);
/* Un id és opac: cap blanc, control ni angle, com a l'exportador. */
const ID = /^[^\s\u0000-\u001f\u007f<>]{1,128}$/;
const SEMVER = /^\d{1,4}\.\d{1,4}\.\d{1,4}$/;
const WIKIDATA = /^Q[1-9]\d{0,11}$/;
/* Sostres de mida: un text de més no s'emmagatzema (cap paquet legítim hi arriba). */
const MAXIM_TEXT = 1024 * 1024;
const MAXIM_COS_OKF = 256 * 1024;
const MAXIM_NOM_POBLE = 120;
const PROFUNDITAT_MAXIMA = 8;

const tipusDe = (valor) => (valor === null ? 'null' : Array.isArray(valor) ? 'array' : typeof valor);
/* Un objecte pla de dades (literal o de JSON.parse), mai una instància. */
const esObjectePla = (valor) => {
  if (valor === null || typeof valor !== 'object' || Array.isArray(valor)) return false;
  const proto = Object.getPrototypeOf(valor);
  return proto === Object.prototype || proto === null;
};
const esTextNoBuit = (valor) => typeof valor === 'string' && valor.trim() !== '';
const clausPerilloses = (objecte) => CLAUS_PERILLOSES.filter((clau) => Object.hasOwn(objecte, clau));

/**
 * Les falles d'una resposta de llegixDadesObertes (contracte.js, capacitat
 * 'dadesObertes'): les quatre claus presents i cap més, cada una null o una
 * llista d'objectes. Buida = vàlida. No mira el contingut de cada fila: això
 * ho fa qui exporta, amb la seua llista blanca.
 * @returns {string[]}
 */
export function fallesDeDadesObertes(valor) {
  if (!esObjectePla(valor)) return [`havia de ser un objecte i és ${tipusDe(valor)}`];
  const falles = [];
  for (const clau of Object.keys(valor)) if (!COLECCIONS_DADES_OBERTES.includes(clau)) falles.push(`clau de més: ${clau.slice(0, 40)}`);
  for (const coleccio of COLECCIONS_DADES_OBERTES) {
    if (!Object.hasOwn(valor, coleccio)) { falles.push(`falta ${coleccio}`); continue; }
    const llista = valor[coleccio];
    if (llista === null) continue;
    if (!Array.isArray(llista)) { falles.push(`${coleccio} havia de ser una llista o null i és ${tipusDe(llista)}`); continue; }
    if (!llista.every((fila) => fila !== null && typeof fila === 'object' && !Array.isArray(fila))) falles.push(`${coleccio} té elements que no són objectes`);
  }
  return falles;
}

/* Les falles d'un valor de dades lliure (el frontmatter OKF): cap clau
   perillosa, només text, nombres finits, booleans, null, llistes i objectes
   plans, i una profunditat fitada. */
function fallesDeDadesLliures(valor, cami, profunditat = 0) {
  if (profunditat > PROFUNDITAT_MAXIMA) return [`${cami}: massa niat`];
  if (valor === null || typeof valor === 'boolean') return [];
  if (typeof valor === 'string') return valor.length > MAXIM_TEXT ? [`${cami}: text massa llarg`] : [];
  if (typeof valor === 'number') return Number.isFinite(valor) ? [] : [`${cami}: nombre no finit`];
  if (Array.isArray(valor)) return valor.flatMap((fill, i) => fallesDeDadesLliures(fill, `${cami}[${i}]`, profunditat + 1));
  if (!esObjectePla(valor)) return [`${cami}: valor de tipus ${tipusDe(valor)}`];
  const perilloses = clausPerilloses(valor);
  if (perilloses.length) return [`${cami}: clau prohibida ${perilloses[0]}`];
  return Object.keys(valor).flatMap((clau) => fallesDeDadesLliures(valor[clau], `${cami}.${clau.slice(0, 40)}`, profunditat + 1));
}

function fallesDelMunicipi(municipi) {
  if (!esObjectePla(municipi)) return ['municipi havia de ser { slug, nom }'];
  const falles = [];
  for (const clau of Object.keys(municipi)) if (!CLAUS_MUNICIPI_LOT.includes(clau)) falles.push(`municipi: clau de més ${clau.slice(0, 40)}`);
  if (typeof municipi.slug !== 'string' || !municipi.slug || normalitzaSlugMunicipi(municipi.slug) !== municipi.slug) falles.push('municipi.slug no és cap slug');
  if (!esTextNoBuit(municipi.nom) || [...municipi.nom].length > MAXIM_NOM_POBLE) falles.push('municipi.nom ha de ser un text no buit');
  if (municipi.descripcio !== undefined && (typeof municipi.descripcio !== 'string' || municipi.descripcio.length > MAXIM_TEXT)) falles.push('municipi.descripcio ha de ser text');
  if (municipi.wikidata !== undefined && !(typeof municipi.wikidata === 'string' && WIKIDATA.test(municipi.wikidata))) falles.push('municipi.wikidata no és cap Q de Wikidata');
  const geo = [municipi.lat, municipi.lng];
  if (geo.some((v) => v !== undefined)) {
    const [lat, lng] = geo;
    if (!(Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180)) falles.push('municipi.lat i municipi.lng han de ser coordenades');
  }
  return falles;
}

/* Les falles d'una fila d'una col·lecció del lot. */
function fallesDeLaFila(coleccio, fila, n, municipi, idsEntitats) {
  const on = `${coleccio}[${n}]`;
  if (!esObjectePla(fila)) return [`${on} havia de ser un objecte`];
  const perilloses = clausPerilloses(fila);
  if (perilloses.length) return [`${on}: clau prohibida ${perilloses[0]}`];
  const falles = [];
  const permesos = CAMPS_DEL_LOT[coleccio];
  for (const clau of Object.keys(fila)) if (!permesos.includes(clau)) falles.push(`${on}: camp no admés ${clau.slice(0, 40)}`);
  for (const clau of Object.keys(fila)) {
    if (clau === 'okf' || !permesos.includes(clau)) continue;
    const valor = fila[clau];
    if (valor !== null && typeof valor !== 'string') falles.push(`${on}.${clau} ha de ser text o null`);
    else if (typeof valor === 'string' && valor.length > MAXIM_TEXT) falles.push(`${on}.${clau}: text massa llarg`);
  }
  if (!(typeof fila.id === 'string' && ID.test(fila.id))) falles.push(`${on}.id no és cap identificador opac`);
  if (fila.visibility !== 'public') falles.push(`${on}.visibility ha de ser 'public'`);
  if (coleccio === 'entitats') {
    if (fila.town_name !== municipi?.nom) falles.push(`${on}.town_name no és el del municipi`);
    if (!esTextNoBuit(fila.name)) falles.push(`${on}.name ha de ser un text no buit`);
    if (fila.kind !== undefined && fila.kind !== null && !KINDS.includes(fila.kind)) falles.push(`${on}.kind no és company, entity ni group`);
    if (fila.slug !== undefined && fila.slug !== null && normalitzaSlugMunicipi(fila.slug) !== fila.slug) falles.push(`${on}.slug no és cap slug`);
    const pare = fila.parent_organization_id;
    if (pare !== undefined && pare !== null && !idsEntitats.has(pare)) falles.push(`${on}.parent_organization_id no és cap entitat del lot`);
    return falles;
  }
  if (!(typeof fila.author_org_id === 'string' && ID.test(fila.author_org_id))) falles.push(`${on}.author_org_id: cal l'entitat que la signa`);
  if (coleccio !== 'memoriaOral') {
    if (fila.poble_id !== municipi?.slug) falles.push(`${on}.poble_id no és el del municipi`);
    return falles;
  }
  const okf = fila.okf;
  if (!esObjectePla(okf) || Object.keys(okf).length !== CLAUS_OKF.length || CLAUS_OKF.some((clau) => !Object.hasOwn(okf, clau))) {
    return [...falles, `${on}.okf ha de ser { cami, frontmatter, cos }`];
  }
  if (typeof okf.cami !== 'string' || !okf.cami || okf.cami.length > 200) falles.push(`${on}.okf.cami ha de ser un camí`);
  if (typeof okf.cos !== 'string' || okf.cos.length > MAXIM_COS_OKF) falles.push(`${on}.okf.cos ha de ser text de com a molt 256 KiB`);
  if (!esObjectePla(okf.frontmatter)) falles.push(`${on}.okf.frontmatter ha de ser un objecte`);
  else {
    falles.push(...fallesDeDadesLliures(okf.frontmatter, `${on}.okf.frontmatter`));
    if (okf.frontmatter.municipi !== municipi?.slug) falles.push(`${on}.okf.frontmatter.municipi no és el del municipi`);
  }
  return falles;
}

/**
 * Les falles d'un lot de restauració. Buida = vàlid.
 *   { format: FORMAT_LOT, versio: 'x.y.z', municipi: { slug, nom, descripcio?, wikidata?, lat?, lng? },
 *     entitats: [], noticies: [], agenda: [], memoria: [], memoriaOral: [] }
 * Les cinc col·leccions, sempre (buides si no n'hi ha); cap clau més.
 * @returns {string[]}
 */
export function validaLotDadesObertes(lot) {
  if (!esObjectePla(lot)) return [`el lot havia de ser un objecte i és ${tipusDe(lot)}`];
  const perilloses = clausPerilloses(lot);
  if (perilloses.length) return [`clau prohibida ${perilloses[0]}`];
  const falles = [];
  for (const clau of Object.keys(lot)) if (!CLAUS_LOT.includes(clau)) falles.push(`clau de més: ${clau.slice(0, 40)}`);
  if (lot.format !== FORMAT_LOT) falles.push(`format havia de ser ${FORMAT_LOT}`);
  if (!(typeof lot.versio === 'string' && SEMVER.test(lot.versio))) falles.push('versio ha de ser una versió x.y.z');
  const ambMunicipi = Object.hasOwn(lot, 'municipi');
  if (!ambMunicipi) falles.push('falta el municipi');
  else falles.push(...fallesDelMunicipi(lot.municipi));
  const municipi = ambMunicipi && esObjectePla(lot.municipi) ? lot.municipi : null;
  const idsEntitats = new Set(Array.isArray(lot.entitats) ? lot.entitats.filter(esObjectePla).map((fila) => fila.id) : []);
  for (const coleccio of COLECCIONS_DEL_LOT) {
    const llista = lot[coleccio];
    if (!Array.isArray(llista)) { falles.push(`${coleccio} havia de ser una llista`); continue; }
    if (llista.length > LIMIT_DADES_OBERTES) { falles.push(`${coleccio} passa de ${LIMIT_DADES_OBERTES} elements`); continue; }
    const vistos = new Set();
    const camins = new Set();
    const slugs = new Set();
    llista.forEach((fila, n) => {
      falles.push(...fallesDeLaFila(coleccio, fila, n, municipi, idsEntitats));
      if (esObjectePla(fila) && typeof fila.id === 'string') {
        if (vistos.has(fila.id)) falles.push(`${coleccio}: id repetit ${fila.id.slice(0, 80)}`);
        vistos.add(fila.id);
      }
      /* Gauntlet D-02 · El slug és el nom llegible de l'entitat: dues amb el mateix no caben al node. */
      const slug = coleccio === 'entitats' && esObjectePla(fila) && typeof fila.slug === 'string' && fila.slug ? fila.slug : null;
      if (slug !== null) {
        if (slugs.has(slug)) falles.push(`entitats: slug repetit ${slug.slice(0, 80)}`);
        slugs.add(slug);
      }
      /* T2-G03 · El camí OKF és el nom del fitxer al paquet: dues fitxes amb el mateix no s'exporten (Camí OKF repetit). */
      const cami = coleccio === 'memoriaOral' && esObjectePla(fila) && esObjectePla(fila.okf) ? fila.okf.cami : null;
      if (typeof cami === 'string') {
        if (camins.has(cami)) falles.push(`memoriaOral: camí OKF repetit ${cami.slice(0, 120)}`);
        camins.add(cami);
      }
    });
  }
  return falles;
}

/** Un magatzem buit: una Map per col·lecció i una per als pobles (slug → municipi). */
export function estatBuitDeDadesObertes() {
  return Object.freeze({ pobles: new Map(), ...Object.fromEntries(COLECCIONS_DEL_LOT.map((coleccio) => [coleccio, new Map()])) });
}

/* Igualtat profunda de dades de JSON (claus en qualsevol ordre). */
function iguals(a, b) {
  if (a === b) return true;
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((valor, i) => iguals(valor, b[i]));
  }
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  const [ca, cb] = [Object.keys(a), Object.keys(b)];
  return ca.length === cb.length && ca.every((clau) => Object.hasOwn(b, clau) && iguals(a[clau], b[clau]));
}

const conflicte = (missatge) => Object.assign(new Error(missatge), { code: 'conflicte-identificador' });
const recompte = () => Object.fromEntries(COLECCIONS_DEL_LOT.map((coleccio) => [coleccio, 0]));
/* El poble d'una fila desada: el slug que la lliga al seu municipi. */
const pobleDeLaFila = (coleccio, fila, pobles) => {
  if (coleccio === 'entitats') return [...pobles.values()].find((poble) => poble.nom === fila.town_name)?.slug ?? null;
  if (coleccio === 'memoriaOral') return fila.okf.frontmatter.municipi;
  return fila.poble_id;
};

/**
 * Una restauració sobre `estat`: torna un estat NOU (Maps noves; l'entrada no
 * es toca mai) i l'informe { creats, actualitzats, iguals }. Atòmica: valida
 * i comprova cada conflicte ABANS d'escriure res, i qui la crida intercanvia
 * l'estat sencer. Idempotent: una fila igual a la desada compta a `iguals`.
 * Mai esborra cap fila. El lot es clona abans de validar-lo: mutar-lo després
 * no canvia res.
 *
 * Gauntlet D-01/D-02 · `ocupats` és el que el servidor ja té FORA d'este
 * magatzem (la llavor, `dades`, el padró d'entitats), perquè un lot no se
 * l'apropie. Totes les claus són opcionals i només se'n crida has/get:
 *   entitats, noticies, agenda, memoria, memoriaOral  id → slug del poble
 *       (null: una fila sense poble, que cap lot no pot portar);
 *   pobles          slug → nom (una Map: també es recorre; null: un slug
 *       reservat, una altra clau d'un poble de la base, que cap lot no pot portar);
 *   slugsEntitats   slug → id de l'entitat que el porta.
 * @returns {{ estat, informe: { creats, actualitzats, iguals } }}
 */
export function fusionaLotDadesObertes(estat, lot, { ocupats = {} } = {}) {
  let net;
  try { net = structuredClone(lot); } catch { throw new TypeError('Lot de dades obertes invàlid: no són dades.'); }
  const falles = validaLotDadesObertes(net);
  if (falles.length) throw new TypeError(`Lot de dades obertes invàlid: ${falles.slice(0, 5).join('; ')}`);
  const { slug, nom } = net.municipi;
  const desat = estat.pobles.get(slug);
  if (desat && desat.nom !== nom) throw conflicte(`El poble ${slug} ja és en este servidor amb un altre nom.`);
  const altreAmbElNom = [...estat.pobles.values()].find((poble) => poble.nom === nom && poble.slug !== slug);
  if (altreAmbElNom) throw conflicte(`Ja hi ha un altre poble amb el nom ${nom.slice(0, 80)}.`);
  /* D-01 · Els pobles de la base: el mateix slug amb un altre nom, o el mateix nom amb un altre slug, és un altre poble. */
  const nomDeLaBase = ocupats.pobles?.get(slug);
  /* V-A01 · Un slug reservat (l'id o el slug del nom d'un poble de la base que en té un altre) no és de cap lot. */
  if (nomDeLaBase === null) throw conflicte(`El slug ${slug} ja és d'un altre poble d'este servidor.`);
  if (nomDeLaBase !== undefined && nomDeLaBase !== nom) throw conflicte(`El poble ${slug} ja és en este servidor amb un altre nom.`);
  if (nomDeLaBase === undefined && [...(ocupats.pobles?.values() ?? [])].includes(nom)) {
    throw conflicte(`Ja hi ha un altre poble amb el nom ${nom.slice(0, 80)}.`);
  }
  for (const coleccio of COLECCIONS_DEL_LOT) {
    for (const fila of net[coleccio]) {
      const anterior = estat[coleccio].get(fila.id);
      const deLaBase = ocupats[coleccio]?.has(fila.id) === true;
      if ((anterior && pobleDeLaFila(coleccio, anterior, estat.pobles) !== slug) || (deLaBase && ocupats[coleccio].get(fila.id) !== slug)) {
        throw conflicte(`L'identificador ${fila.id.slice(0, 80)} de «${coleccio}» ja és d'un altre poble.`);
      }
    }
  }
  /* D-02 · El slug d'una entitat del lot no pot ser d'una altra (un altre id): ni
     d'una desada (es mira el resultat final, com els camins OKF) ni del padró. */
  const entitatsFinals = new Map(estat.entitats);
  for (const fila of net.entitats) entitatsFinals.set(fila.id, fila);
  const idsPerSlug = new Map();
  for (const entitat of entitatsFinals.values()) {
    if (typeof entitat.slug !== 'string' || !entitat.slug) continue;
    if (!idsPerSlug.has(entitat.slug)) idsPerSlug.set(entitat.slug, new Set());
    idsPerSlug.get(entitat.slug).add(entitat.id);
  }
  for (const fila of net.entitats) {
    if (typeof fila.slug !== 'string' || !fila.slug) continue;
    const delPadro = ocupats.slugsEntitats?.has(fila.slug) === true ? ocupats.slugsEntitats.get(fila.slug) : fila.id;
    if (idsPerSlug.get(fila.slug).size > 1 || delPadro !== fila.id) throw conflicte(`El slug ${fila.slug.slice(0, 80)} ja és d'una altra entitat.`);
  }
  /* T2-G03 · Mai s'esborra res: si una fitxa desada i una del lot, amb ids
     diferents, tenen el mateix camí OKF, el poble ja no es podria exportar
     (Camí OKF repetit). Es mira el resultat final de la memòria oral del poble. */
  const oralsFinals = new Map([...estat.memoriaOral].filter(([, desada]) => pobleDeLaFila('memoriaOral', desada, estat.pobles) === slug));
  for (const fila of net.memoriaOral) oralsFinals.set(fila.id, fila);
  const caminsFinals = new Map();
  for (const fila of oralsFinals.values()) {
    const altra = caminsFinals.get(fila.okf.cami);
    if (altra !== undefined) throw conflicte(`El camí OKF ${fila.okf.cami.slice(0, 120)} ja és d'una altra fitxa d'este poble (${altra.slice(0, 80)}).`);
    caminsFinals.set(fila.okf.cami, fila.id);
  }
  const nou = { pobles: new Map(estat.pobles), ...Object.fromEntries(COLECCIONS_DEL_LOT.map((coleccio) => [coleccio, new Map(estat[coleccio])])) };
  const informe = { creats: recompte(), actualitzats: recompte(), iguals: recompte() };
  nou.pobles.set(slug, net.municipi);
  for (const coleccio of COLECCIONS_DEL_LOT) {
    for (const fila of net[coleccio]) {
      const anterior = nou[coleccio].get(fila.id);
      const comptador = !anterior ? 'creats' : iguals(anterior, fila) ? 'iguals' : 'actualitzats';
      informe[comptador][coleccio] += 1;
      nou[coleccio].set(fila.id, fila);
    }
  }
  return { estat: Object.freeze(nou), informe };
}

const perId = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/**
 * Les dades obertes restaurades d'un poble, en la forma de llegixDadesObertes
 * (les quatre llistes, mai null), ordenades per id i clonades.
 * @param {{ poble: { slug: string } }} filtre
 */
export function llegixDeLEstat(estat, { poble } = {}) {
  const slug = poble?.slug;
  return Object.fromEntries(COLECCIONS_DADES_OBERTES.map((coleccio) => [coleccio, [...estat[coleccio].values()]
    .filter((fila) => pobleDeLaFila(coleccio, fila, estat.pobles) === slug)
    .sort(perId)
    .map((fila) => structuredClone(fila))]));
}

/** Les entitats restaurades (totes, o les del poble amb eixe NOM), ordenades per id i clonades. */
export function entitatsDeLEstat(estat, { nom = null } = {}) {
  return [...estat.entitats.values()]
    .filter((fila) => nom === null || fila.town_name === nom)
    .sort(perId)
    .map((fila) => structuredClone(fila));
}

/** Els pobles restaurats, ordenats per slug i clonats. */
export function poblesDeLEstat(estat) {
  return [...estat.pobles.values()].sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0)).map((poble) => structuredClone(poble));
}

/** Totes les files restaurades d'una col·lecció (de tots els pobles), ordenades per id i clonades. */
export function totesDeLEstat(estat, coleccio) {
  if (!COLECCIONS_DEL_LOT.includes(coleccio)) throw new TypeError(`Col·lecció desconeguda: ${String(coleccio).slice(0, 40)}`);
  return [...estat[coleccio].values()].sort(perId).map((fila) => structuredClone(fila));
}
