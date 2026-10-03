/**
 * La Nevera de Casa · el nucli (funcions pures, cap React, cap xarxa, cap disc).
 *
 * És la intel·ligència de dades de La Compra; l'esquelet comú (src/apps/comu)
 * només la pinta. Cada operació rep l'estat i torna l'estat nou, sense tocar
 * mai el d'entrada; si no canvia res, torna EL MATEIX objecte (la vista ho fa
 * servir per a no desar en va).
 *
 *   estat {
 *     esquema       'sdp.nevera.estat.v1'
 *     seq           el número del pròxim id nou (l-<n>, p-<n>)
 *     llistes       [{ id, nom, linies, recents, ordre, amagades }]
 *                   · linies   [{ articleId, especificacio }]: el que falta comprar
 *                   · recents  [{ articleId, especificacio }]: el que s'ha comprat, l'últim primer
 *                   · ordre    tots els ids de secció, en l'ordre d'esta llista
 *                   · amagades les seccions que esta llista no mostra al catàleg
 *     propis        [{ id: 'p-<n>', nom }]: els articles que crea la persona
 *     casa          [{ articleId, estat: 'hi-ha' | 'se-n-acaba' | 'acabat' }]
 *     darreraLlista l'id de la llista activa (la de la URL, o l'última oberta)
 *   }
 *
 * normalitzaEstat és la llista blanca: tot el que arriba de fora (el disc, una
 * còpia) hi passa i ix net, dins dels límits i amb les invariants complides.
 * Cap preu, cap quantitat obligatòria: l'especificació («2 kg», «sense
 * lactosa») és text lliure i curt.
 */
import { ARTICLES_BASE, CATEGORIES, ID_PROPIS } from './cataleg.js';

export const ESQUEMA_ESTAT = 'sdp.nevera.estat.v1';
export const ESTATS_CASA = Object.freeze(['hi-ha', 'se-n-acaba', 'acabat']);
export const LIMITS = Object.freeze({
  llistes: 30, linies: 300, recents: 20, propis: 300, casa: 600, nom: 60, especificacio: 80
});

/* La primera llista. Cada entrada porta la llista al camí (/app/nevera/<entrada>/<llista>),
   i els trams dels panells que van al mateix lloc no poden ser mai l'id d'una
   llista: /llista/cataleg, /cataleg/propis, /casa/cal-comprar i /ajustos/dades
   són panells (vistes/constants.js; AppNevera.test.jsx ho comprova sobre la taula de rutes). */
export const LLISTA_INICIAL = Object.freeze({ id: 'casa', nom: 'Casa' });
export const IDS_RESERVATS = Object.freeze(['cataleg', 'propis', 'cal-comprar', 'dades']);

const PATRO_ID = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const PATRO_PROPI = /^p-(\d{1,12})$/;
const PATRO_NOU = /^[lp]-(\d{1,12})$/;
const MAX_SEQ = 999999999999;
/* Fora de tot text: els controls (C0, C1 i els separadors de línia) passen
   a ser espais; les amplades zero, el guionet tou, les marques bidi i el BOM
   desapareixen. S'escriuen amb \u{…}: l'eina d'edició descodifica la forma
   curta d'estos caràcters i els deixaria invisibles al codi. */
const CONTROLS = /[\u{0}-\u{1F}\u{7F}-\u{9F}\u{2028}\u{2029}]/gu;
const INVISIBLES = /[\u{AD}\u{200B}-\u{200F}\u{202A}-\u{202E}\u{2060}-\u{2069}\u{FEFF}]/gu;
/* Els apòstrofs que es teclegen per a «d’oliva»: el tipogràfic (’ ‘), el
   modificador (ʼ) i l'accent agut solt (´) valen com el recte ('). */
const APOSTROFS = /[\u{2018}\u{2019}\u{2BC}\u{B4}]/gu;
const URGENCIA = Object.freeze({ acabat: 0, 'se-n-acaba': 1 });

const IDS_CATEGORIES = Object.freeze(CATEGORIES.map((categoria) => categoria.id));
const NOM_CATEGORIA = new Map(CATEGORIES.map((categoria) => [categoria.id, categoria.nom]));
const BASE_PER_ID = new Map(ARTICLES_BASE.map((article) => [article.id, article]));

const esObjecte = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);
const llistaDe = (valor) => (Array.isArray(valor) ? valor : []);

/** Un id que pot anar a la URL (Clàusula dels Slugs) i que no és cap tram reservat. */
export const esIdNevera = (valor) => typeof valor === 'string' && PATRO_ID.test(valor) && !IDS_RESERVATS.includes(valor);

/** Text net: sense invisibles ni controls, espais plegats i, com a molt, `max` caràcters. */
export function netejaText(valor, max) {
  if (typeof valor !== 'string') return '';
  const net = valor.replace(CONTROLS, ' ').replace(INVISIBLES, '').replace(/\s+/g, ' ').trim();
  return [...net].slice(0, max).join('').trim();
}

/**
 * La clau d'un nom: «Creïlles», «creilles» i « CREÏLLES » són el mateix
 * article, i «oli d'oliva» (apòstrof recte) és «Oli d’oliva».
 */
export function clauDeNom(nom) {
  return netejaText(nom, LIMITS.nom).replace(APOSTROFS, '\'').normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('ca');
}

/* ── Lectura ─────────────────────────────────────────────────────────── */

/** Tots els articles: els de base i els propis ({ id, nom, categoriaId, propi? }). */
export function articlesDe(estat) {
  return [...ARTICLES_BASE, ...estat.propis.map((p) => ({ id: p.id, nom: p.nom, categoriaId: ID_PROPIS, propi: true }))];
}

export function articlePerId(estat, id) {
  if (BASE_PER_ID.has(id)) return BASE_PER_ID.get(id);
  const propi = estat.propis.find((p) => p.id === id);
  return propi ? { id: propi.id, nom: propi.nom, categoriaId: ID_PROPIS, propi: true } : null;
}

/** L'article (de base o propi) que es diu així, o null. */
export function articlePerNom(estat, nom) {
  const clau = clauDeNom(nom);
  if (!clau) return null;
  return articlesDe(estat).find((article) => clauDeNom(article.nom) === clau) || null;
}

export function llistaPerId(estat, id) {
  return estat.llistes.find((llista) => llista.id === id) || null;
}

/** Les seccions d'una llista en el seu ordre: { id, nom, ordre, visible } (sense llista, les de base). */
export function categoriesDeLlista(estat, llistaId, { totesVisibles = false } = {}) {
  const llista = llistaPerId(estat, llistaId);
  const ordre = llista ? llista.ordre : IDS_CATEGORIES;
  const amagades = new Set(llista ? llista.amagades : []);
  return ordre.map((id, posicio) => ({ id, nom: NOM_CATEGORIA.get(id), ordre: posicio, visible: totesVisibles || !amagades.has(id) }));
}

/** Les línies que falten, en l'ordre de les seccions de la llista (com al súper), i dins de cada una en l'ordre d'arribada. */
export function liniesOrdenades(estat, llistaId) {
  const llista = llistaPerId(estat, llistaId);
  if (!llista) return [];
  const posicio = new Map(llista.ordre.map((id, i) => [id, i]));
  const seccio = (linia) => posicio.get(articlePerId(estat, linia.articleId)?.categoriaId) ?? IDS_CATEGORIES.length;
  return llista.linies.map((linia, i) => ({ linia, i, s: seccio(linia) }))
    .sort((a, b) => a.s - b.s || a.i - b.i)
    .map(({ linia }) => linia);
}

/** Els recents que ara no són a la llista (per a tornar-los a posar d'un toc). */
export function recentsDisponibles(estat, llistaId) {
  const llista = llistaPerId(estat, llistaId);
  if (!llista) return [];
  const aLaLlista = new Set(llista.linies.map((linia) => linia.articleId));
  return llista.recents.filter((recent) => !aLaLlista.has(recent.articleId));
}

/** El que hi ha a casa d'un article ('hi-ha' | 'se-n-acaba' | 'acabat'), o null si no se'n fa seguiment. */
export function estatACasa(estat, articleId) {
  return estat.casa.find((entrada) => entrada.articleId === articleId)?.estat ?? null;
}

/**
 * Les propostes d'«A casa»: el que s'ha acabat o se n'acaba i encara no és a
 * la llista. Primer el que s'ha acabat; dins de cada grup, per nom.
 */
export function propostesDeCasa(estat, llistaId) {
  const llista = llistaPerId(estat, llistaId);
  const aLaLlista = new Set((llista ? llista.linies : []).map((linia) => linia.articleId));
  return estat.casa
    .filter((entrada) => entrada.estat !== 'hi-ha' && !aLaLlista.has(entrada.articleId))
    .map((entrada) => ({ ...entrada, nom: articlePerId(estat, entrada.articleId)?.nom ?? entrada.articleId }))
    .sort((a, b) => URGENCIA[a.estat] - URGENCIA[b.estat] || a.nom.localeCompare(b.nom, 'ca'))
    .map(({ articleId, estat: valor }) => ({ articleId, estat: valor }));
}

/* ── Ajudants interns ────────────────────────────────────────────────── */

function llistaBuida(id, nom) {
  return { id, nom, linies: [], recents: [], ordre: [...IDS_CATEGORIES], amagades: [] };
}

/* Canvia una llista. Si la llista no hi és o el canvi no canvia res, torna `estat`. */
function ambLlista(estat, llistaId, canvi) {
  const i = estat.llistes.findIndex((llista) => llista.id === llistaId);
  if (i < 0) return estat;
  const actual = estat.llistes[i];
  const nova = canvi(actual);
  if (nova === actual) return estat;
  const llistes = estat.llistes.slice();
  llistes[i] = nova;
  return { ...estat, llistes };
}

/* El pròxim id lliure amb el prefix ('l-' o 'p-') i el comptador nou; null
   si el comptador s'ha esgotat (un id més llarg no passaria la llista blanca). */
function idNou(estat, prefix, ocupats) {
  let n = estat.seq;
  while (ocupats.has(`${prefix}${n}`)) n += 1;
  return n > MAX_SEQ ? null : { id: `${prefix}${n}`, seq: n + 1 };
}

function especificacioDe(valor) {
  return valor === undefined ? undefined : netejaText(valor, LIMITS.especificacio);
}

/* ── Llistes ─────────────────────────────────────────────────────────── */

/** Una llista nova, que passa a ser l'activa. Sense nom, «Llista nova». */
export function creaLlista(estat, nom) {
  if (estat.llistes.length >= LIMITS.llistes) return estat;
  const nou = idNou(estat, 'l-', new Set(estat.llistes.map((llista) => llista.id)));
  if (!nou) return estat;
  const llista = llistaBuida(nou.id, netejaText(nom, LIMITS.nom) || 'Llista nova');
  return { ...estat, seq: nou.seq, llistes: [...estat.llistes, llista], darreraLlista: nou.id };
}

export function reanomenaLlista(estat, llistaId, nom) {
  const net = netejaText(nom, LIMITS.nom);
  if (!net) return estat;
  return ambLlista(estat, llistaId, (llista) => (llista.nom === net ? llista : { ...llista, nom: net }));
}

/** Esborra una llista. L'última no s'esborra mai: sempre n'hi ha almenys una. */
export function esborraLlista(estat, llistaId) {
  if (estat.llistes.length < 2 || !llistaPerId(estat, llistaId)) return estat;
  const llistes = estat.llistes.filter((llista) => llista.id !== llistaId);
  const darreraLlista = estat.darreraLlista === llistaId ? llistes[0].id : estat.darreraLlista;
  return { ...estat, llistes, darreraLlista };
}

/** La llista activa (la que obrin les altres entrades). */
export function triaLlista(estat, llistaId) {
  if (estat.darreraLlista === llistaId || !llistaPerId(estat, llistaId)) return estat;
  return { ...estat, darreraLlista: llistaId };
}

/* ── El que falta comprar ────────────────────────────────────────────── */

/**
 * Posa un article a la llista. Si ja hi és, només en canvia l'especificació
 * (si se'n dona una). Si no se'n dona cap i és als recents, recupera la que
 * tenia l'última vegada («Llet · sense lactosa» torna com era).
 */
export function afig(estat, llistaId, articleId, { especificacio } = {}) {
  if (!articlePerId(estat, articleId)) return estat;
  const nova = especificacioDe(especificacio);
  return ambLlista(estat, llistaId, (llista) => {
    const i = llista.linies.findIndex((linia) => linia.articleId === articleId);
    if (i >= 0) {
      if (nova === undefined || nova === llista.linies[i].especificacio) return llista;
      const linies = llista.linies.slice();
      linies[i] = { articleId, especificacio: nova };
      return { ...llista, linies };
    }
    if (llista.linies.length >= LIMITS.linies) return llista;
    const recent = llista.recents.find((r) => r.articleId === articleId);
    return { ...llista, linies: [...llista.linies, { articleId, especificacio: nova ?? recent?.especificacio ?? '' }] };
  });
}

/** Lleva un article de la llista sense comprar-lo (no va als recents). */
export function lleva(estat, llistaId, articleId) {
  return ambLlista(estat, llistaId, (llista) => (llista.linies.some((linia) => linia.articleId === articleId)
    ? { ...llista, linies: llista.linies.filter((linia) => linia.articleId !== articleId) }
    : llista));
}

/** El toc del catàleg: si és a la llista el lleva; si no, el posa. */
export function commuta(estat, llistaId, articleId) {
  const llista = llistaPerId(estat, llistaId);
  if (!llista) return estat;
  return llista.linies.some((linia) => linia.articleId === articleId)
    ? lleva(estat, llistaId, articleId)
    : afig(estat, llistaId, articleId);
}

/**
 * Comprat: ix de la llista i passa el primer als recents (sense repetits, com
 * a molt LIMITS.recents). Si se'n feia seguiment a casa, ara n'hi ha.
 */
export function marcaComprat(estat, llistaId, articleId) {
  const linia = llistaPerId(estat, llistaId)?.linies.find((l) => l.articleId === articleId);
  if (!linia) return estat;
  const nou = ambLlista(estat, llistaId, (llista) => ({
    ...llista,
    linies: llista.linies.filter((l) => l.articleId !== articleId),
    recents: [linia, ...llista.recents.filter((r) => r.articleId !== articleId)].slice(0, LIMITS.recents)
  }));
  const aCasa = estatACasa(nou, articleId);
  if (aCasa === null || aCasa === 'hi-ha') return nou;
  return { ...nou, casa: nou.casa.map((entrada) => (entrada.articleId === articleId ? { articleId, estat: 'hi-ha' } : entrada)) };
}

/* ── Articles propis ─────────────────────────────────────────────────── */

/** Un article propi nou (a «Articles propis»). Si ja n'hi ha un amb el mateix nom, no en fa cap. */
export function creaArticlePropi(estat, nom) {
  const net = netejaText(nom, LIMITS.nom);
  if (!net || articlePerNom(estat, net) || estat.propis.length >= LIMITS.propis) return estat;
  const nou = idNou(estat, 'p-', new Set(estat.propis.map((p) => p.id)));
  if (!nou) return estat;
  return { ...estat, seq: nou.seq, propis: [...estat.propis, { id: nou.id, nom: net }] };
}

/** «Necessite…»: l'article que es diu així (o un de propi nou) a la llista. */
export function afigPerNom(estat, llistaId, nom, opcions = {}) {
  if (!llistaPerId(estat, llistaId)) return estat;
  const existent = articlePerNom(estat, nom);
  if (existent) return afig(estat, llistaId, existent.id, opcions);
  const ambPropi = creaArticlePropi(estat, nom);
  if (ambPropi === estat) return estat;
  return afig(ambPropi, llistaId, ambPropi.propis[ambPropi.propis.length - 1].id, opcions);
}

/** Esborra un article propi del catàleg, de totes les llistes (recents inclosos) i d'«A casa». */
export function esborraArticlePropi(estat, articleId) {
  if (!estat.propis.some((p) => p.id === articleId)) return estat;
  const sense = (files) => files.filter((fila) => fila.articleId !== articleId);
  return {
    ...estat,
    propis: estat.propis.filter((p) => p.id !== articleId),
    llistes: estat.llistes.map((llista) => ({ ...llista, linies: sense(llista.linies), recents: sense(llista.recents) })),
    casa: sense(estat.casa)
  };
}

/* ── Seccions (ordre i visibilitat de cada llista) ───────────────────── */

/** Mou una secció una posició amunt (-1) o avall (+1) en l'ordre d'una llista. */
export function mouSeccio(estat, llistaId, categoriaId, direccio) {
  return ambLlista(estat, llistaId, (llista) => {
    const i = llista.ordre.indexOf(categoriaId);
    const j = i + (direccio < 0 ? -1 : 1);
    if (i < 0 || j < 0 || j >= llista.ordre.length) return llista;
    const ordre = llista.ordre.slice();
    [ordre[i], ordre[j]] = [ordre[j], ordre[i]];
    return { ...llista, ordre };
  });
}

/** Amaga (o torna a mostrar) una secció al catàleg d'una llista. */
export function amagaSeccio(estat, llistaId, categoriaId, amagada) {
  if (!NOM_CATEGORIA.has(categoriaId)) return estat;
  return ambLlista(estat, llistaId, (llista) => {
    const ja = llista.amagades.includes(categoriaId);
    if (ja === Boolean(amagada)) return llista;
    return { ...llista, amagades: amagada ? [...llista.amagades, categoriaId] : llista.amagades.filter((id) => id !== categoriaId) };
  });
}

/** Torna l'ordre de sempre i mostra totes les seccions. */
export function restableixSeccions(estat, llistaId) {
  return ambLlista(estat, llistaId, (llista) => {
    const igual = llista.amagades.length === 0 && llista.ordre.every((id, i) => id === IDS_CATEGORIES[i]);
    return igual ? llista : { ...llista, ordre: [...IDS_CATEGORIES], amagades: [] };
  });
}

/* ── A casa (la nevera i el rebost) ──────────────────────────────────── */

/** Què hi ha a casa d'un article. `valor` null deixa de seguir-lo. */
export function marcaACasa(estat, articleId, valor) {
  if (!articlePerId(estat, articleId)) return estat;
  const actual = estatACasa(estat, articleId);
  if (valor === null || valor === undefined) {
    return actual === null ? estat : { ...estat, casa: estat.casa.filter((entrada) => entrada.articleId !== articleId) };
  }
  if (!ESTATS_CASA.includes(valor) || actual === valor) return estat;
  if (actual !== null) {
    return { ...estat, casa: estat.casa.map((entrada) => (entrada.articleId === articleId ? { articleId, estat: valor } : entrada)) };
  }
  if (estat.casa.length >= LIMITS.casa) return estat;
  return { ...estat, casa: [...estat.casa, { articleId, estat: valor }] };
}

/** Posa a la llista totes les propostes d'«A casa». */
export function afigPropostes(estat, llistaId) {
  return propostesDeCasa(estat, llistaId).reduce((acumulat, { articleId }) => afig(acumulat, llistaId, articleId), estat);
}

/* ── La llista blanca ────────────────────────────────────────────────── */

function filesNetes(cru, existents, maxim) {
  const vistos = new Set();
  const netes = [];
  for (const fila of llistaDe(cru)) {
    if (netes.length >= maxim) break;
    if (!esObjecte(fila) || !existents.has(fila.articleId) || vistos.has(fila.articleId)) continue;
    vistos.add(fila.articleId);
    netes.push({ articleId: fila.articleId, especificacio: netejaText(fila.especificacio, LIMITS.especificacio) });
  }
  return netes;
}

function seccionsNetes(cru) {
  const ordre = [...new Set(llistaDe(cru).filter((id) => NOM_CATEGORIA.has(id)))];
  return [...ordre, ...IDS_CATEGORIES.filter((id) => !ordre.includes(id))];
}

function propisNets(cru) {
  const vistos = new Set();
  const nets = [];
  for (const propi of llistaDe(cru)) {
    if (nets.length >= LIMITS.propis) break;
    const nom = esObjecte(propi) ? netejaText(propi.nom, LIMITS.nom) : '';
    if (!nom || typeof propi.id !== 'string' || !PATRO_PROPI.test(propi.id) || vistos.has(propi.id)) continue;
    vistos.add(propi.id);
    nets.push({ id: propi.id, nom });
  }
  return nets;
}

function llistesNetes(cru, existents) {
  const vistos = new Set();
  const netes = [];
  for (const llista of llistaDe(cru)) {
    if (netes.length >= LIMITS.llistes) break;
    if (!esObjecte(llista) || !esIdNevera(llista.id) || vistos.has(llista.id)) continue;
    vistos.add(llista.id);
    netes.push({
      id: llista.id,
      nom: netejaText(llista.nom, LIMITS.nom) || 'Llista',
      linies: filesNetes(llista.linies, existents, LIMITS.linies),
      recents: filesNetes(llista.recents, existents, LIMITS.recents),
      ordre: seccionsNetes(llista.ordre),
      amagades: [...new Set(llistaDe(llista.amagades).filter((id) => NOM_CATEGORIA.has(id)))]
    });
  }
  return netes;
}

function casaNeta(cru, existents) {
  const vistos = new Set();
  const neta = [];
  for (const entrada of llistaDe(cru)) {
    if (neta.length >= LIMITS.casa) break;
    if (!esObjecte(entrada) || !existents.has(entrada.articleId) || !ESTATS_CASA.includes(entrada.estat) || vistos.has(entrada.articleId)) continue;
    vistos.add(entrada.articleId);
    neta.push({ articleId: entrada.articleId, estat: entrada.estat });
  }
  return neta;
}

/**
 * L'estat net a partir de qualsevol cosa (el disc, una còpia, res). Mai
 * llança. Invariants: almenys una llista; ids únics i segurs per a la URL;
 * cap línia, recent ni entrada de casa d'un article que no existix ni
 * repetida; l'ordre de cada llista conté cada secció una vegada;
 * darreraLlista és una llista que existix; seq passa de tots els ids l-/p-.
 * Els camps desconeguts no passen.
 */
export function normalitzaEstat(cru) {
  const font = esObjecte(cru) ? cru : {};
  const propis = propisNets(font.propis);
  const existents = new Set([...BASE_PER_ID.keys(), ...propis.map((p) => p.id)]);
  const netes = llistesNetes(font.llistes, existents);
  const llistes = netes.length ? netes : [llistaBuida(LLISTA_INICIAL.id, LLISTA_INICIAL.nom)];
  const casa = casaNeta(font.casa, existents);
  const darreraLlista = llistes.some((llista) => llista.id === font.darreraLlista) ? font.darreraLlista : llistes[0].id;
  const usats = [...propis, ...llistes].map((fila) => fila.id.match(PATRO_NOU)).filter(Boolean).map((m) => Number(m[1]));
  const declarat = Number.isSafeInteger(font.seq) && font.seq > 0 && font.seq <= MAX_SEQ ? font.seq : 1;
  const seq = Math.min(Math.max(declarat, ...usats.map((n) => n + 1)), MAX_SEQ);
  return { esquema: ESQUEMA_ESTAT, seq, llistes, propis, casa, darreraLlista };
}

/** L'estat del primer dia: una llista buida («Casa»). */
export function estatInicial() {
  return normalitzaEstat(null);
}
