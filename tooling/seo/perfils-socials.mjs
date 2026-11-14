/** P0-SEO-UNIVERSAL (ordre del Mestre, 13-11-2026) · Les adreces de les fitxes
 * públiques (persones del paquet, entitats, grups i la IAIA) que el prerender
 * ha d'escriure: la canònica ÚNICA de cada fitxa i els seus àlies en cada
 * família de ruta que el Router accepta (/perfil, /gent, /empresa, /entitats,
 * /ajuntament i /grup, llegides del Router per rutes-del-router.mjs), per slug
 * i per id. Pur: sense xarxa, sense disc, sense rellotge. No llança mai per una
 * dada: un camí que no es pot assignar es PERD i ix a `conflictes` o `avisos`.
 *
 * Entrades:
 *   · elements: els del snapshot amb sectionId 'perfil' (fonts-veinals.mjs ·
 *     projectaEntitat), ja sanejats: {id, slug, tipus, title, description,
 *     image, imageAlt}; cada un és una entitat pública del directori;
 *   · families: els prefixos de la fitxa pública al Router;
 *   · moduls: {metadades (src/config/metadadesDePerfil.js), paquet
 *     (src/sections/profile/perfilsDelPaquet.js)}: les MATEIXES funcions que
 *     crida el client; res es reescriu ací;
 *   · opcions: les del selector d'imatge social (origen, supabaseUrl, permesos).
 *
 * Resolució d'una clau, la del client per a un visitant sense sessió: un UUID
 * es busca per id; la resta, per slug; i damunt, ambReservaDelPaquet (la IA
 * del paquet i les tres identitats del Mestre).
 *
 * Assignació de camins en tres passades, sense «mana el primer que arriba»:
 *   1. les claus que declara el paquet (ids, slugs i àlies de la llavor);
 *   2. l'id de cada entitat remota;
 *   3. el slug de cada entitat remota, si pot ser clau (slugPotSerClau: ni la
 *      forma d'un UUID, ni una clau reservada pel paquet amb un id no declarat).
 * Un camí ja assignat no es reassigna: així una empresa amb el slug 'javi',
 * 'iaia-maria' o amb la forma de l'id d'una altra fitxa no es queda mai la
 * targeta d'un altre (P2, segrest de targeta). Els camins es comparen sense
 * majúscules: en el disc del Mac serien el mateix fitxer.
 */

/* El segment net que admet el prerender (prerender-social.mjs · SEGMENT). */
const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9_-]{0,179}$/;
const escrivible = ruta => typeof ruta === 'string' && ruta.startsWith('/') && ruta.slice(1).split('/').every(segment => SEGMENT.test(segment));
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TIPUS_REMOTS = new Set(['entitat', 'grup']);

/** Si un element del snapshot té la forma d'una fitxa del directori (el que escriu projectaEntitat). */
export function esElementDePerfil(element, formaUuid) {
  return Boolean(element) && typeof element === 'object' && element.sectionId === 'perfil'
    && typeof element.id === 'string' && formaUuid.test(element.id) && element.id === element.id.toLowerCase()
    && (element.slug === null || (typeof element.slug === 'string' && element.slug.length <= 160 && SLUG.test(element.slug)))
    && TIPUS_REMOTS.has(element.tipus) && typeof element.title === 'string' && element.title !== ''
    && typeof element.description === 'string' && element.description !== ''
    && (element.image === null || typeof element.image === 'string');
}

/**
 * Torna { canoniques, alies, conflictes, avisos }:
 *   · canoniques: [{ ruta, title, description, image, imageAlt, imatge, schema,
 *     index, origen: 'paquet' | 'veinal', id }], una per fitxa, ordenades;
 *   · alies: [[cami, canonica]], ordenats;
 *   · conflictes: [{ cami, de, motiu }], els camins que algú ha perdut;
 *   · avisos: text, per al rebut.
 */
export function rutesDePerfils({elements = [], families = [], moduls, opcions = {}, indexable = () => true} = {}) {
  const {metadades, paquet} = moduls || {};
  if (!metadades || !paquet) throw new Error('rutesDePerfils necessita els mòduls de metadades i del paquet.');
  const {CLAUS_RESERVADES, FORMA_UUID, indexDePerfil, metadadesDePerfil, rutaPublicaDePerfil, schemaDePerfil, slugPotSerClau} = metadades;
  const canoniques = new Map(), assignats = new Map(), conflictes = [], avisos = [];
  if (!Array.isArray(families) || !families.length) return {canoniques: [], alies: [], conflictes, avisos};
  const plega = cami => cami.toLowerCase();

  /* Les fitxes remotes, ordenades per id: el resultat no depén de l'ordre d'entrada. */
  const remotes = [...elements].filter(element => esElementDePerfil(element, FORMA_UUID)).sort((a, b) => a.id.localeCompare(b.id));
  if (remotes.length !== elements.length) avisos.push(`${elements.length - remotes.length} element(s) de perfil amb una forma inesperada: fora`);
  const perId = new Map(), perSlug = new Map();
  for (const element of remotes) {
    if (perId.has(element.id)) { conflictes.push({cami: `id:${element.id}`, de: element.id, motiu: 'id repetit al snapshot'}); continue; }
    perId.set(element.id, element);
  }
  for (const element of perId.values()) {
    if (!element.slug || !slugPotSerClau(element.slug, element.id)) continue;
    if (perSlug.has(element.slug)) { conflictes.push({cami: `slug:${element.slug}`, de: element.id, motiu: 'slug repetit: es queda la primera per id'}); continue; }
    perSlug.set(element.slug, element);
  }
  const fitxaRemota = new Map(); // element → perfil (un sol objecte per fitxa)
  const perfilDe = element => {
    if (!fitxaRemota.has(element)) {
      fitxaRemota.set(element, {tipus: element.tipus, id: element.id, slug: element.slug, nom: element.title, esIA: false, publicat: true});
    }
    return fitxaRemota.get(element);
  };
  const resol = clau => {
    const element = FORMA_UUID.test(clau) ? perId.get(clau.toLowerCase()) : perSlug.get(clau);
    const remot = element ? perfilDe(element) : null;
    const perfil = paquet.ambReservaDelPaquet(clau, remot);
    return perfil ? {perfil, element: perfil === remot ? element : null} : null;
  };

  /* La canònica d'una fitxa: es declara una vegada, i el seu camí queda assignat a ella mateixa. */
  function declara({perfil, element}) {
    const ruta = rutaPublicaDePerfil(perfil);
    if (!escrivible(ruta)) { avisos.push(`fitxa ${String(perfil?.id).slice(0, 60)}: la seua adreça no és escrivible; fora`); return null; }
    if (canoniques.has(ruta)) return ruta;
    if (assignats.has(plega(ruta))) { conflictes.push({cami: ruta, de: String(perfil.id), motiu: 'la canònica ja és un camí d’una altra fitxa'}); return null; }
    const meta = element
      ? {title: element.title, description: element.description, image: element.image, imageAlt: element.imageAlt || element.title, imatge: {estat: element.image ? 'triada' : 'absent'}}
      : (() => { const m = metadadesDePerfil(perfil, opcions); return {title: m.title, description: m.description, image: m.image, imageAlt: m.title, imatge: m.imatge}; })();
    canoniques.set(ruta, {ruta, ...meta, schema: schemaDePerfil(perfil), index: indexDePerfil(perfil, ruta) && indexable(ruta) === true,
      origen: element ? 'veinal' : 'paquet', id: String(perfil.id)});
    assignats.set(plega(ruta), ruta);
    return ruta;
  }
  function assigna(cami, canonica, de) {
    if (!escrivible(cami)) { avisos.push(`camí no escrivible, fora: ${cami.slice(0, 120)}`); return; }
    const actual = assignats.get(plega(cami));
    if (actual === undefined) { assignats.set(plega(cami), canonica); return; }
    if (actual !== canonica) conflictes.push({cami, de, motiu: `ja és de ${actual}`});
  }
  const camins = clau => families.map(familia => `/${familia}/${clau}`);

  /* Passada 1 · Les claus del paquet. Per a cada adreça canònica, si alguna de les
     seues claus la resol el servidor (la fila de l'entitat pilot, per exemple), mana
     el servidor, com a l'app; si no, el paquet. */
  const grups = new Map(); // canònica provisional → [{clau, resolta}]
  for (const clau of [...CLAUS_RESERVADES].sort()) {
    const resolta = resol(clau);
    if (!resolta) continue;
    const ruta = rutaPublicaDePerfil(resolta.perfil);
    if (!ruta) continue;
    if (!grups.has(ruta)) grups.set(ruta, []);
    grups.get(ruta).push({clau, resolta});
  }
  for (const [, membres] of [...grups].sort(([a], [b]) => a.localeCompare(b))) {
    const tria = membres.find(m => m.resolta.element) || membres[0];
    const canonica = declara(tria.resolta);
    if (!canonica) continue;
    for (const {clau} of membres) for (const cami of camins(clau)) assigna(cami, canonica, tria.resolta.perfil.id);
  }
  /* Passada 2 · L'id de cada entitat remota. */
  const canonicaDe = new Map();
  for (const element of perId.values()) {
    const canonica = declara({perfil: perfilDe(element), element});
    if (!canonica) continue;
    canonicaDe.set(element, canonica);
    for (const cami of camins(element.id)) assigna(cami, canonica, element.id);
  }
  /* Passada 3 · El slug de cada entitat remota, si pot ser clau. */
  for (const [slug, element] of perSlug) {
    const canonica = canonicaDe.get(element);
    if (!canonica) continue;
    for (const cami of camins(slug)) assigna(cami, canonica, element.id);
  }
  for (const element of perId.values()) {
    if (element.slug && !slugPotSerClau(element.slug, element.id)) {
      conflictes.push({cami: `slug:${element.slug}`, de: element.id, motiu: 'slug reservat o amb forma d’UUID: la fitxa només ix pel seu id'});
    }
  }
  const alies = [];
  /* Els àlies: cada camí assignat que no és la seua canònica, amb la grafia original. */
  const grafia = new Map();
  for (const [, membres] of grups) for (const {clau} of membres) for (const cami of camins(clau)) if (!grafia.has(plega(cami))) grafia.set(plega(cami), cami);
  for (const element of perId.values()) {
    for (const cami of camins(element.id)) if (!grafia.has(plega(cami))) grafia.set(plega(cami), cami);
    if (element.slug) for (const cami of camins(element.slug)) if (!grafia.has(plega(cami))) grafia.set(plega(cami), cami);
  }
  for (const [plegat, canonica] of assignats) {
    const cami = grafia.get(plegat);
    if (cami && cami !== canonica && plegat !== plega(canonica)) alies.push([cami, canonica]);
  }
  return {
    canoniques: [...canoniques.values()].sort((a, b) => a.ruta.localeCompare(b.ruta)),
    alies: alies.sort(([a], [b]) => a.localeCompare(b)),
    conflictes, avisos
  };
}
