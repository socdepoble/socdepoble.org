/**
 * indexCerca.js — L'índex i la cerca de /cerca (T45), en funcions pures.
 *
 * Sense React ni backend: rep els arrays que ja porten els contextos i torna
 * entrades planes. Cada adaptador tria els camps que es poden buscar (mai el
 * `searchText` d'origen, que no sempre hi és ni sempre plega accents) i mai
 * indexa ni mostra un correu.
 *
 * `cercaEntrades` fa la cerca: una fitxa per paraula, lògica AND, plegat
 * d'accents als dos costats i rànquing per camps (vegeu puntua: frase igual >
 * paraula del títol > prefix al títol > dins del títol > lema o ofici > cos),
 * amb el pes de cada paraula segons com n'és de rara a l'índex, un desempat
 * pel poble actiu i, després, per data i per ordre alfabètic.
 */
import { isSafeAsset } from '../../components/universal/UniversalUtils.js';
import { llevaEtiquetes, llevaScriptsIEstils, normalizeSearchText, stripMarkdownImages } from '../../config/contentHelpers.js';
import {
  getSectionItemPath, resolveItemPath, resolvePageSlugPath, RUTA_FITXA_IAIA, RUTES_CANONIQUES, rutaDePerfil
} from '../../config/navigation.js';
import { tipusDAgent } from '../../data/agentsSeed.js';
import {
  ENTITAT_PILOT_SLUG, PERSONA_PILOT, POBLE_FUNDACIONAL, clauFundacional, entitatSeed, esIAIA, fundacionalDeLaClau
} from '../../data/identitatsSeed.js';
import { fotoDelBucketPublic } from '../../utils/mitjaOpac.js';
import { imatgesDeProducte } from '../mercat/imatgesDeProducte.js';

/* Els tipus de la cerca, en l'ordre en què es pinten els grups i els filtres.
   `text` és el valor per defecte de la clau d'i18n `clau`. */
export const TIPUS_CERCA = Object.freeze([
  Object.freeze({ id: 'tot', clau: 'section.search.tipus.tot', text: 'Tot' }),
  Object.freeze({ id: 'persones', clau: 'section.search.tipus.persones', text: 'Persones' }),
  Object.freeze({ id: 'entitats', clau: 'section.search.tipus.entitats', text: 'Entitats' }),
  Object.freeze({ id: 'pobles', clau: 'section.search.tipus.pobles', text: 'Pobles' }),
  Object.freeze({ id: 'publicacions', clau: 'section.search.tipus.publicacions', text: 'Publicacions' }),
  Object.freeze({ id: 'agenda', clau: 'section.search.tipus.agenda', text: 'Agenda' }),
  Object.freeze({ id: 'mercat', clau: 'section.search.tipus.mercat', text: 'Mercat' }),
  Object.freeze({ id: 'multimedia', clau: 'section.search.tipus.multimedia', text: 'Multimèdia' }),
  Object.freeze({ id: 'notes', clau: 'section.search.tipus.notes', text: 'Notes' }),
  Object.freeze({ id: 'converses', clau: 'section.search.tipus.converses', text: 'Converses' }),
  Object.freeze({ id: 'pagines', clau: 'section.search.tipus.pagines', text: 'Pàgines' })
]);
export const IDS_TIPUS = Object.freeze(TIPUS_CERCA.map((tipus) => tipus.id));

/** Un `?tipus=` desconegut (o absent) és «tot». */
export const tipusValid = (valor) => (IDS_TIPUS.includes(valor) ? valor : 'tot');

/* ── Plegat ─────────────────────────────────────────────────────────────── */

const COMBINANTS = /[\u0300-\u036f]/g;
/* El punt volat de «l·l» no separa paraules: «col·legi» i «collegi» són la mateixa. */
const PUNT_VOLAT = /[\u00b7\u2027\u2219]/g;
/* Pla 261022_1955 (Cercador Universal, T2: «plegat exhaustiu […] l·l») · Tres
   formes més de la ela geminada i de les lletres que NFD no descompon:
     · el punt baix entre dues eles, el substitut de teclat («col.legi»,
       «il.lusió»), és el mateix punt volat; mai entre altres lletres («Sr.
       Lluís» o una adreça no s'ajunten);
     · «ŀ» (U+0140, un sol caràcter) i les lligadures o lletres d'amplada
       completa: NFKD les descompon («ŀ» en «l·», «ﬁ» en «fi»);
     · les lletres soltes sense descomposició (œ, æ, ß, ø, ł, đ, ı), per la
       seua forma llatina. */
const PUNT_BAIX_DE_GEMINADA = /([lL])\.(?=[lL])/g;
const LLETRES_SOLTES = Object.freeze({ 'œ': 'oe', 'æ': 'ae', 'ß': 'ss', 'ø': 'o', 'ł': 'l', 'đ': 'd', 'ı': 'i' });
const RE_LLETRES_SOLTES = /[œæßøłđı]/g;
const lletraSolta = (lletra) => LLETRES_SOLTES[lletra];
const esEla = (caracter) => caracter === 'l' || caracter === 'L';
const RE_CORREU = /[^\s@]+@[^\s@]+\.[^\s@]+/;

export const esCorreu = (valor) => RE_CORREU.test(String(valor ?? ''));

/** Minúscules, sense accents, punt volat ni lligadures, espais plegats. */
export function plega(valor) {
  const net = String(valor ?? '').replace(PUNT_BAIX_DE_GEMINADA, '$1').normalize('NFKD').replace(PUNT_VOLAT, '');
  return normalizeSearchText(net).replace(RE_LLETRES_SOLTES, lletraSolta);
}

/** Les paraules d'una consulta, plegades i sense repetir. */
export function fitxes(consulta) {
  return [...new Set(plega(consulta).split(/[^a-z0-9]+/).filter(Boolean))];
}

/* El mateix plegat que `plega`, d'un sol caràcter (el punt baix de la
   geminada el decidix mapaPlegat, que en veu els veïns). */
function plegaCaracter(caracter) {
  return caracter.normalize('NFKD').toLowerCase().normalize('NFD').replace(COMBINANTS, '').replace(PUNT_VOLAT, '')
    .replace(RE_LLETRES_SOLTES, lletraSolta);
}

/* El text plegat caràcter a caràcter, amb l'índex original de cada caràcter
   plegat: així una coincidència sobre «guell» es pot marcar sobre «Güell». */
function mapaPlegat(text) {
  let plegat = '';
  const index = [];
  /* Gauntlet (crític de l'índex, confirmat) · Per punt de codi, no per unitat
     UTF-16: una lletra del pla astral («𝐅» de les negretes que es copien de
     les xarxes) es plega com un tot (NFKD la fa «f», igual que `plega`), i el
     final del tram (`fi`) és el del caràcter sencer: mai mig parell suplent. */
  const fi = [];
  for (let i = 0; i < text.length;) {
    const caracter = String.fromCodePoint(text.codePointAt(i));
    const seguent = i + caracter.length;
    if (caracter === '.' && esEla(text[i - 1]) && esEla(text[seguent])) { i = seguent; continue; }
    const peca = plegaCaracter(caracter);
    for (let j = 0; j < peca.length; j += 1) {
      plegat += peca[j];
      index.push(i);
      fi.push(seguent);
    }
    i = seguent;
  }
  return { plegat, index, fi };
}

/**
 * Trossos de `text` amb les coincidències marcades: [{ text, marca }].
 * Qui pinta fa un <mark> per a cada tros marcat; ací no hi ha HTML.
 */
export function partsRessaltades(text, llistaFitxes = []) {
  const net = String(text ?? '');
  if (!net) return [];
  const cerca = (Array.isArray(llistaFitxes) ? llistaFitxes : []).filter(Boolean);
  if (!cerca.length) return [{ text: net, marca: false }];
  const { plegat, index, fi } = mapaPlegat(net);
  const trams = [];
  for (const fitxa of cerca) {
    let posicio = plegat.indexOf(fitxa);
    while (posicio >= 0) {
      trams.push([index[posicio], fi[posicio + fitxa.length - 1]]);
      posicio = plegat.indexOf(fitxa, posicio + fitxa.length);
    }
  }
  if (!trams.length) return [{ text: net, marca: false }];
  trams.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const units = [];
  for (const tram of trams) {
    const ultim = units[units.length - 1];
    if (ultim && tram[0] <= ultim[1]) ultim[1] = Math.max(ultim[1], tram[1]);
    else units.push([...tram]);
  }
  const parts = [];
  let cursor = 0;
  for (const [inici, fi] of units) {
    if (inici > cursor) parts.push({ text: net.slice(cursor, inici), marca: false });
    parts.push({ text: net.slice(inici, fi), marca: true });
    cursor = fi;
  }
  if (cursor < net.length) parts.push({ text: net.slice(cursor), marca: false });
  return parts;
}

/**
 * Un extracte de `max` caràcters que comença prop de la primera coincidència
 * (a l'estil d'un cercador web), tallat per paraules i amb «…» als talls.
 */
export function extracteAmbContext(text, llistaFitxes = [], max = 200) {
  const net = String(text ?? '');
  if (net.length <= max) return net;
  const { plegat, index } = mapaPlegat(net);
  let primera = -1;
  for (const fitxa of (Array.isArray(llistaFitxes) ? llistaFitxes : [])) {
    if (!fitxa) continue;
    const posicio = plegat.indexOf(fitxa);
    if (posicio >= 0 && (primera < 0 || posicio < primera)) primera = posicio;
  }
  let inici = 0;
  if (primera >= 0) {
    const original = index[primera];
    const marge = Math.floor(max / 3);
    if (original > marge) {
      inici = original - marge;
      const espai = net.indexOf(' ', inici);
      if (espai >= 0 && espai < original) inici = espai + 1;
    }
  }
  let fi = Math.min(net.length, inici + max);
  if (fi < net.length) {
    const espai = net.lastIndexOf(' ', fi);
    if (espai > inici + max / 2) fi = espai;
  }
  return `${inici > 0 ? '…' : ''}${net.slice(inici, fi).trim()}${fi < net.length ? '…' : ''}`;
}

/* ── Text i dates ───────────────────────────────────────────────────────── */

const ENTITATS = Object.freeze({ '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&apos;': "'" });

/** Text pla d'un camp que pot portar HTML o Markdown. Mai passa per innerHTML.
 *  Auditoria de seguretat 261019 (R1) · Els blocs <script> i <style> i les
 *  etiquetes, en temps lineal (contentHelpers.js · llevaScriptsIEstils i llevaEtiquetes), amb
 *  el mateix resultat que /<(script|style)[\s\S]*?<\/\1>/gi i /<[^>]*>/g.
 *  Eren quadràtiques amb un cos de molts '<' o '<script' sense tancar, i /cerca
 *  les passa per a tothom sobre cada publicació i cada producte. */
export function textPla(valor) {
  if (valor == null || typeof valor === 'object') return '';
  return llevaEtiquetes(llevaScriptsIEstils(stripMarkdownImages(String(valor))))
    .replace(/&(nbsp|amp|lt|gt|quot|apos|#39);/g, (entitat) => ENTITATS[entitat] || ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Mil·lisegons d'una data; «AAAA-MM-DD» és un dia local (no mitjanit UTC). 0 si no és data. */
export function marcaTemps(valor) {
  if (valor == null || valor === '') return 0;
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
  const text = String(valor);
  const dia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  const data = dia ? new Date(Number(dia[1]), Number(dia[2]) - 1, Number(dia[3])) : new Date(text);
  const ms = data.getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

export function formataData(valor, locale = 'ca-ES') {
  const ms = marcaTemps(valor);
  if (!ms) return '';
  const opcions = { day: 'numeric', month: 'short', year: 'numeric' };
  try {
    return new Date(ms).toLocaleDateString(locale || 'ca-ES', opcions);
  } catch {
    return new Date(ms).toLocaleDateString('ca-ES', opcions);
  }
}

const primerText = (...valors) => valors.find((valor) => typeof valor === 'string' && valor.trim()) || null;
/* La primera font que un <img> pot obrir tal qual (http(s), ruta pròpia o
   data:image), amb la mateixa regla d'UniversalCard. Una referència opaca
   (sdp-media://…) o un camp cru sense validar es salta i es prova el següent:
   ací no es resol res, i una miniatura trencada és pitjor que cap. */
const primeraImatge = (...valors) => {
  for (const valor of valors) {
    for (const candidat of (Array.isArray(valor) ? valor : [valor])) {
      const net = typeof candidat === 'string' ? candidat.trim() : '';
      if (net && isSafeAsset(net)) return net;
    }
  }
  return null;
};

/* ── L'entrada comuna ───────────────────────────────────────────────────── */

/**
 * Entrada { clau: 'tipus:id', tipus, id, titol, meta[], extracte, detall, imatge,
 * avatar, href, accio, data, privada, propia, canonica, titolPlegat, text }.
 * Sense id no n'hi ha: la clau és la que deduplica. Sense títol ni extracte
 * tampoc (no es podria pintar). `detall` és el text llarg (cos de la pàgina,
 * de la nota…): d'ací ix l'extracte quan la coincidència no és a l'entradilla.
 * `canonica` és la clau de la identitat d'una persona o d'una entitat
 * (clauCanonica), o null: amb ella, ambLaIdentitatPropia en deixa una fitxa.
 * Pla 261022_1955 (Cercador Universal, T2) · Dos camps més per al rànquing
 * (puntua), tots dos plegats i fora del que es pinta:
 *   · `etiquetes`, el lema, l'ofici o el rol, el subtítol o les etiquetes: el
 *     graó entre el títol i el cos (etiquetesPlegades);
 *   · `poble`, el poble de la fitxa, si en té (poblePlegat): la bonificació
 *     del poble actiu.
 * I l'avatar porta `ref` quan la seua foto és una referència opaca del bucket
 * PÚBLIC (fotoDelBucketPublic: un logo o una foto pujats): qui pinta la
 * demana al port (useResolvedAsset) en lloc de les inicials. La resta de
 * referències opaques (mitjans_privats, un camí brut) no en porten mai.
 */
function entrada({ tipus, id, titol, meta = [], extracte = '', detall = '', cos = [], etiquetes = [], poble = '',
  imatge = null, avatar = null, href = null, accio = null, data = null, privada = false, propia = false, fotoDe = null,
  canonica = null }) {
  if (id == null || String(id) === '') return null;
  const textExtracte = textPla(extracte);
  const textTitol = textPla(titol).slice(0, 200) || textExtracte.slice(0, 80);
  if (!textTitol) return null;
  const textDetall = textPla(detall);
  const src = primeraImatge(imatge?.src);
  return {
    clau: `${tipus}:${id}`,
    tipus,
    id: String(id),
    titol: textTitol,
    meta: meta.map((valor) => textPla(valor)).filter(Boolean),
    extracte: textExtracte,
    detall: textDetall === textExtracte ? '' : textDetall,
    imatge: src ? { src, alt: imatge?.alt || '' } : null,
    avatar: avatar ? avatarDeLEntrada(textTitol, avatar, id) : null,
    href: href || null,
    accio,
    data: marcaTemps(data),
    privada: Boolean(privada),
    propia,
    /* La clau de l'article del qual esta entrada és la foto (deMedia), o null. */
    fotoDe,
    canonica,
    titolPlegat: plega(textTitol),
    etiquetesPlegades: plega(etiquetes.map((valor) => textPla(valor)).join(' ')),
    poblePlegat: plega(textPla(poble)),
    text: plega([textTitol, textExtracte, textDetall, ...cos.map((valor) => textPla(valor))].join(' '))
  };
}

/* { nom, src, llavor } i, només si la foto és una referència del bucket públic, `ref` (vegeu entrada). */
function avatarDeLEntrada(nom, avatar, id) {
  const src = primeraImatge(avatar.src);
  const ref = src ? null : fotoDelBucketPublic(avatar.src);
  const llavor = avatar.llavor ?? id;
  return ref ? { nom, src, llavor, ref } : { nom, src, llavor };
}

/**
 * L'extracte que es pinta: de l'entradilla si hi ha la coincidència; si no,
 * del text llarg al voltant de la primera coincidència; si no n'hi ha cap,
 * l'entradilla tal qual.
 */
export function extracteDeResultat(resultat, llistaFitxes = [], max = 200) {
  const fitxesNetes = (Array.isArray(llistaFitxes) ? llistaFitxes : []).filter(Boolean);
  const conte = (text) => {
    if (!text) return false;
    const plegat = plega(text);
    return fitxesNetes.some((fitxa) => plegat.includes(fitxa));
  };
  const extracte = resultat?.extracte || '';
  const detall = resultat?.detall || '';
  if (conte(extracte) || !conte(detall)) return extracte ? extracteAmbContext(extracte, fitxesNetes, max) : '';
  return extracteAmbContext(detall, fitxesNetes, max);
}

/* ── Adaptadors (un per font) ───────────────────────────────────────────── */

/* Gauntlet 261016_1530 (Bloc 3.6.3; relleu F65; ordre del Mestre: «La ruta
   /iaia queda reservada per a la pròpia IAIA MarIA […], que és on s'ha
   d'accedir des del xat i des del cercador») · La IAIA, per identificador i
   amb el tipus 'ia' (mai pel nom), porta a la seua fitxa neta
   (RUTA_FITXA_IAIA). La resta, la ruta de perfil de sempre (rutaDePerfil).
   Ordre del Mestre (261019 21:34, punt 9: «la cerca pública ha d'enllaçar
   sempre a la fitxa pública (/javillinares o /gent/:id), mai a l'editor
   privat») · Les tres identitats del Mestre porten a la seua ruta canònica
   neta (RUTES_CANONIQUES: /javillinares, /socdepoble, /rentonar), per la seua
   clau canònica (clauCanonica). /gent/0001 i /empresa/socdepoble obrin la
   mateixa fitxa: la canònica és l'adreça neta. Cap altra fitxa canvia. */
const esLaIAIA = (perfil, id) => perfil === 'ia' && esIAIA(id);
const rutaDeLaFitxa = (perfil, id) => RUTES_CANONIQUES[clauCanonica(perfil, id)]
  || (esLaIAIA(perfil, id) ? RUTA_FITXA_IAIA : rutaDePerfil(perfil, id));

/**
 * Ordre del Mestre (261019 21:34, punt 9: «una sola fitxa canònica al graf
 * sense entrades duplicades», per a persones i per a organitzacions) · La clau
 * de la identitat d'una fitxa del Cercador: la fundacional d'una de les tres
 * identitats del Mestre (CLAUS_FUNDACIONALS), o null. Per identificador
 * declarat i amb el tipus que toca, mai pel nom ni pel slug d'una fila:
 *   · una persona, per clauFundacional (un àlies seu o un id remot declarat);
 *   · una entitat (empresa o grup: a la cerca totes són 'entitats'), per
 *     fundacionalDeLaClau, la regla de pobleDEntitat (la clau de la persona
 *     pilot no és mai d'una entitat), o perquè el seu id és a `delProjecte`:
 *     els ids que el backend ja ha reconegut com l'entitat pilot
 *     (esEntitatDelProjecte; els passa useCercaGlobal);
 *   · una IA o qualsevol altra, null: la seua clau és el seu id.
 */
export function clauCanonica(perfil, id, { delProjecte = [] } = {}) {
  if (id == null || String(id) === '') return null;
  if (perfil === 'persona') return clauFundacional({ tipus: 'persona', id });
  if (perfil !== 'entitat') return null;
  const fundacional = fundacionalDeLaClau(id);
  if (fundacional && fundacional !== PERSONA_PILOT.slug) return fundacional;
  return llistaDe(delProjecte).includes(String(id)) ? ENTITAT_PILOT_SLUG : null;
}

/** Catàleg d'agents del contingut base (seed o app_content.agents). */
export function deAgent(agent, opcions = {}) {
  /* Gauntlet 261016 (Bloc 3) · El vocabulari del directori i del perfil públic,
     de la seua font única (data/agentsSeed.js · tipusDAgent): AI i ANIMAL → ia,
     COMPANY → entitat. Abans n'hi havia una còpia ací, i un personatge ANIMAL
     eixia com a persona, sense l'etiqueta d'IA i cap a /gent. */
  const perfil = tipusDAgent(agent);
  return entrada({
    tipus: perfil === 'entitat' ? 'entitats' : 'persones',
    id: agent?.id,
    titol: agent?.name,
    /* Gauntlet 261022_0225 (Tasca 2) · El càrrec d'una persona pot ser el seu poble
       (la fitxa de Javi Llinares porta «La Torre de les Maçanes» als dos camps): una sola volta. */
    meta: [perfil === 'ia' ? opcions.etiquetes?.ia : null, agent?.role, agent?.town_name !== agent?.role ? agent?.town_name : null],
    extracte: primerText(agent?.short_bio, agent?.lema),
    cos: [agent?.role, agent?.town_name, agent?.tag, agent?.lema],
    etiquetes: [agent?.role, agent?.lema, agent?.tag],
    poble: agent?.town_name,
    avatar: { src: agent?.avatar_url, llavor: agent?.id },
    href: rutaDeLaFitxa(perfil, agent?.id),
    canonica: clauCanonica(perfil, agent?.id)
  });
}

/**
 * Gauntlet 261016 (Bloc 3.5.2; ordre del Mestre: «Prohibit mostrar entitats
 * sense poble») · El poble d'una entitat del Cercador:
 *   · el que diu el servidor (la fila del padró o la pertinença), si n'hi ha;
 *   · si no, el de la llavor (entitatSeed, per l'id);
 *   · si no, per a una de les entitats del Mestre (fundacionalDeLaClau: per
 *     l'id, un àlies declarat o un id remot declarat; mai pel nom ni pel slug
 *     de la fila), POBLE_FUNDACIONAL, com la fitxa pública
 *     (PerfilPublicSection.jsx).
 * Cap altra entitat s'inventa cap poble: '' i la meta de sempre. Només per a
 * entitats: una persona o una IA no passen per ací.
 */
function pobleDEntitat(id, ...delServidor) {
  const propi = delServidor.find((valor) => typeof valor === 'string' && valor.trim());
  if (propi) return propi.trim();
  const llavor = entitatSeed(id)?.town_name;
  if (typeof llavor === 'string' && llavor.trim()) return llavor.trim();
  const fundacional = fundacionalDeLaClau(id);
  return fundacional && fundacional !== PERSONA_PILOT.slug ? POBLE_FUNDACIONAL : '';
}

/**
 * Una fila del padró (membres_del_poble o la llavor del xat). Mai porta correu.
 * Poliment T45 · Sense `opcions.fitxesDePersones`, el títol d'una persona (o
 * d'una IA) no hi enllaça: l'acció és «Escriu-li». Qui sap obrir-les el passa:
 * seed i local i, des de l'ordre del Mestre (261002), el remot amb la capacitat
 * 'directori' (RPC perfil_public, useCercaGlobal). Una entitat sempre enllaça:
 * organization_directory es pot llegir.
 * Gauntlet 261016 (Bloc 3.5.2) · Una entitat porta el seu poble a la meta i al
 * cos (pobleDEntitat); una persona i una IA, la meta de sempre.
 * Gauntlet 261016_1530 (Bloc 3.6.3) · La IAIA MarIA (per id) sempre enllaça a
 * la seua fitxa, /iaia: la fitxa es pinta del paquet en tots els modes, també
 * en remot sense 'directori' (PerfilPublicSection.jsx, D12).
 * Ordre del Mestre (261019 21:34, punt 9) · El mateix per a la persona pilot
 * (per un àlies seu, clauCanonica): la seua fitxa també cau al paquet
 * (perfilFundacionalDelPaquet) i porta a /javillinares.
 */
export function deMembre(membre, opcions = {}) {
  const id = membre?.usuari_id ?? membre?.usuariId ?? null;
  const nom = membre?.nom ?? membre?.name;
  if (esCorreu(nom)) return null;
  const perfil = membre?.tipus === 'entitat' ? 'entitat' : membre?.tipus === 'ia' ? 'ia' : 'persona';
  const filId = membre?.fil_id ?? membre?.filId ?? null;
  const canonica = clauCanonica(perfil, id);
  const fitxaOberta = perfil === 'entitat' || opcions.fitxesDePersones === true || esLaIAIA(perfil, id) || Boolean(canonica);
  const poble = perfil === 'entitat' ? pobleDEntitat(id, membre?.town_name, membre?.townName) : '';
  return entrada({
    tipus: perfil === 'entitat' ? 'entitats' : 'persones',
    id,
    titol: nom,
    meta: [perfil === 'ia' ? opcions.etiquetes?.ia : null, poble],
    cos: poble ? [poble] : [],
    /* Pla 261022_1955 (T2) · El padró és el del poble de la sessió: qui hi
       consta n'és veí (opcions.pobleDelPadro, useCercaGlobal), també per a
       la bonificació del poble actiu. Mai es pinta a la meta: no és cap dada
       de la fila. */
    poble: poble || opcions.pobleDelPadro || '',
    avatar: { src: membre?.avatar_url ?? membre?.avatarUrl, llavor: id },
    href: fitxaOberta ? rutaDeLaFitxa(perfil, id) : null,
    accio: id == null ? null : {
      tipus: 'escriu',
      href: filId ? getSectionItemPath('xat', filId) : `/xat?amb=${encodeURIComponent(String(id))}`
    },
    canonica
  });
}

/**
 * La persona de la sessió i les entitats que gestiona (IdentitatContext).
 * El padró les deixa fora a propòsit; sense açò, ningú es trobaria a si mateix.
 * Si el nom és el correu (nomDePersona hi cau), es mostra `opcions.nomCompte`.
 * Gauntlet 261016 (Bloc 3.5.2) · Una entitat porta el seu poble a la meta i al
 * cos: el de la pertinença (IdentitatContext · poble) o el de la fila, si n'hi
 * ha; si no, el de pobleDEntitat. La persona, el de sempre (`opcions.poble`).
 * Ordre del Mestre (261019 21:34, punt 9: «la cerca pública ha d'enllaçar
 * sempre a la fitxa pública (/javillinares o /gent/:id), mai a l'editor
 * privat») · La persona pròpia porta a la seua fitxa pública (rutaDeLaFitxa:
 * /gent/<id> o la canònica), com qualsevol altra: abans portava a
 * /el-meu-perfil, l'editor privat. L'entitat, igual (/empresa/<id> o la
 * canònica). Editar la fitxa és cosa de la mateixa fitxa (el seu botó
 * d'editar, PerfilPublicSection), no del Cercador.
 * Revisió adversarial · La persona pròpia seguix la regla del padró
 * (deMembre): en remot sense la capacitat 'directori' la fitxa d'una persona
 * no s'obri, i `opcions.fitxesDePersones === false` (useCercaGlobal) li lleva
 * l'enllaç en lloc de portar-la a «Perfil no trobat». Mai torna a
 * /el-meu-perfil. Sense l'opció, l'enllaç de sempre; una identitat del Mestre
 * (clau canònica) i una entitat, sempre.
 */
export function deIdentitat(identitat, opcions = {}) {
  if (!identitat) return null;
  const esEntitat = identitat.tipus === 'entitat';
  const perfil = esEntitat ? 'entitat' : 'persona';
  const canonica = clauCanonica(perfil, identitat.id);
  const fitxaOberta = esEntitat || opcions.fitxesDePersones !== false || Boolean(canonica);
  const nomBrut = typeof identitat.nom === 'string' ? identitat.nom.trim() : '';
  const correu = typeof opcions.correu === 'string' ? opcions.correu.trim().toLowerCase() : '';
  const amagat = !nomBrut || esCorreu(nomBrut) || (correu && nomBrut.toLowerCase() === correu);
  const nom = amagat ? (esEntitat ? null : opcions.nomCompte) : nomBrut;
  const pobleDeLEntitat = esEntitat
    ? pobleDEntitat(identitat.id, identitat.poble, identitat.town_name, identitat.dades?.town_name)
    : '';
  return entrada({
    tipus: esEntitat ? 'entitats' : 'persones',
    id: identitat.id,
    titol: nom,
    meta: esEntitat ? [pobleDeLEntitat] : [opcions.poble],
    cos: esEntitat ? [identitat.slug, pobleDeLEntitat] : [opcions.poble],
    poble: esEntitat ? pobleDeLEntitat : opcions.poble,
    avatar: { src: identitat.avatar, llavor: identitat.id },
    href: fitxaOberta ? rutaDeLaFitxa(perfil, identitat.id) : null,
    propia: perfil,
    canonica
  });
}

/* El CHECK de organizations.slug (2609080000): l'únic slug que pot ser una ruta neta. */
const RE_SLUG_DE_RUTA = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const uuidNet = (valor) => (valor == null ? '' : String(valor).trim().toLowerCase());

/**
 * La clau de la ruta pública d'una fila del directori: el seu slug quan la
 * fitxa l'obri, i si no, el seu id. En remot, el perfil públic només resol un
 * slug dins del poble actiu (perfils.js · llegixPerfilRemot: `unique (tenant_id,
 * slug)`), i un id a tot el servidor: una entitat d'un altre tenant que el de
 * la configuració porta a /empresa/<id>, que sí que s'obri. Una fila sense
 * tenant (seed i local: un sol poble) porta el slug. Sense saber el tenant
 * actiu, l'id: mai un enllaç a «Perfil no trobat».
 */
function clauDeRutaDOrganitzacio(org, tenantActiu) {
  const slug = typeof org?.slug === 'string' ? org.slug.trim() : '';
  if (!RE_SLUG_DE_RUTA.test(slug)) return org.id;
  const seu = uuidNet(org?.tenant_id);
  if (!seu) return slug;
  return seu === uuidNet(tenantActiu) ? slug : org.id;
}

/**
 * Pla 261022_1955 (Cercador Universal, T2) · Una fila del directori públic
 * (organization_directory; port · listPublicOrganizations): una empresa, una
 * entitat o un grup públic de qualsevol poble, també sense sessió. A la cerca
 * totes són 'entitats', amb l'id de la fila: la mateixa clau que la del padró
 * (membres_del_poble, tipus 'entitat') i que la identitat pròpia
 * (IdentitatContext), i fusionaPerClau en fa una sola fitxa. La clau
 * canònica, per l'id (clauCanonica: mai pel slug ni pel nom de la fila);
 * l'entitat pilot amb l'id del servidor la reconeix després
 * ambLaIdentitatPropia (`delProjecte`).
 *   · el títol, el nom; la meta, el poble (pobleDEntitat); l'extracte, el lema
 *     o la descripció; el detall, la descripció i la presentació;
 *   · el logo és l'avatar (una referència opaca del bucket públic porta `ref`);
 *   · l'enllaç, la ruta canònica d'una identitat del Mestre o
 *     /empresa/<slug> (clauDeRutaDOrganitzacio; `opcions.tenantActiu`).
 * Mai cap correu: la vista no en porta, i un nom amb forma de correu no s'indexa.
 */
export function deOrganitzacio(org, opcions = {}) {
  const id = org?.id;
  if (id == null || String(id).trim() === '' || esCorreu(org?.name)) return null;
  const canonica = clauCanonica('entitat', id);
  const poble = pobleDEntitat(id, org?.town_name);
  const descripcio = typeof org?.description === 'string' ? org.description : '';
  return entrada({
    tipus: 'entitats',
    id,
    titol: org?.name,
    meta: [poble],
    extracte: primerText(org?.lema, descripcio),
    detall: [descripcio, textPla(org?.presentacio_html)].filter(Boolean).join(' · '),
    cos: [org?.slug, poble],
    etiquetes: [org?.lema],
    poble,
    avatar: { src: org?.logo_url, llavor: id },
    href: RUTES_CANONIQUES[canonica] || rutaDePerfil('entitat', clauDeRutaDOrganitzacio(org, opcions.tenantActiu)),
    data: org?.updated_at || org?.created_at,
    canonica
  });
}

export function dePoble(poble) {
  return entrada({
    tipus: 'pobles',
    id: poble?.id,
    titol: primerText(poble?.title, poble?.name),
    meta: [poble?.comarca, poble?.population],
    extracte: primerText(poble?.post_subtitle, poble?.content),
    detall: poble?.content,
    cos: [poble?.comarca, poble?.population, poble?.author],
    etiquetes: [poble?.comarca],
    poble: primerText(poble?.title, poble?.name),
    imatge: { src: primeraImatge(poble?.imageSrc, poble?.image_url, poble?.avatar_url) },
    href: poble?.id == null ? null : getSectionItemPath('pobles', poble.id),
    data: poble?.created_at
  });
}

/* T40 · La data d'una publicació és la mateixa que pinta el Mur (MurSection):
   la triada al calendari i, si no n'hi ha, la de creació. */
const dataDePublicacio = (post) => post?.date || post?.publish_date || post?.created_at || null;

export function dePublicacio(post, opcions = {}) {
  const autor = primerText(post?.author_name, post?.author);
  const data = dataDePublicacio(post);
  return entrada({
    tipus: 'publicacions',
    id: post?.id,
    titol: post?.title,
    meta: [autor, post?.town_name, formataData(data, opcions.locale)],
    extracte: primerText(post?.summary, post?.post_subtitle, post?.description, post?.content),
    detall: post?.content,
    cos: [post?.post_subtitle, post?.description, autor, post?.town_name, post?.tag],
    etiquetes: [post?.post_subtitle, post?.tag],
    poble: post?.town_name,
    imatge: { src: primeraImatge(post?.imageSrc, post?.image_url, post?.image) },
    href: resolveItemPath({ ...post, sectionId: post?.sectionId || 'mur' }),
    data
  });
}

export function deActe(acte, opcions = {}) {
  return entrada({
    tipus: 'agenda',
    id: acte?.id,
    titol: acte?.title,
    meta: [formataData(acte?.date, opcions.locale), acte?.time, acte?.author_name],
    extracte: primerText(acte?.summary, acte?.entradilla, acte?.subtitle, acte?.description),
    detall: acte?.description,
    cos: [acte?.subtitle, acte?.entradilla, acte?.author_name, acte?.author_location],
    etiquetes: [acte?.subtitle, acte?.entradilla],
    imatge: { src: primeraImatge(acte?.image_url, acte?.imageSrc) },
    href: resolveItemPath({ ...acte, sectionId: acte?.sectionId || 'events' }),
    data: acte?.date || acte?.created_at
  });
}

export function deProducte(producte) {
  /* Auditoria de seguretat 261019 (F14) · Qui ven, com la fitxa
     (detailSectionMeta.jsx · CompraDelProducte): l'author_name que força el
     servidor; el `seller` del payload, només per a un producte que no és
     d'un veí (sense ownerUserId) i no en porta cap. */
  const venedor = producte?.ownerUserId != null
    ? primerText(producte?.author_name)
    : primerText(producte?.author_name, producte?.seller);
  return entrada({
    tipus: 'mercat',
    id: producte?.id,
    titol: producte?.title,
    meta: [producte?.price, venedor, producte?.population],
    extracte: primerText(producte?.subtitle, producte?.summary, producte?.description),
    detall: producte?.description,
    cos: [producte?.subtitle, venedor, producte?.tag, producte?.category_slug, producte?.population],
    etiquetes: [producte?.subtitle, producte?.tag, producte?.category_slug],
    poble: producte?.population,
    /* Onada 12 (261011; ordres 261011_0130, punt 1) · La miniatura és la foto
       del producte, la mateixa regla de la targeta i del detall
       (imatgesDeProducte: `images` primer, mai l'avatar de qui ven). Abans
       manava imageSrc, que per als productes de la llavor és el logotip de
       qui ven (marketContent.js): el Mac Mini eixia amb el quadrat verd.
       Sense cap foto pròpia que es puga pintar, la reserva de sempre. */
    imatge: { src: primeraImatge(imatgesDeProducte(producte), producte?.imageSrc, producte?.image_url, producte?.image) },
    href: resolveItemPath({ ...producte, sectionId: producte?.sectionId || 'mercat' }),
    data: producte?.created_at
  });
}

/* Onada 12 (261011; ordres 261011_0130, punt 1: «hi ha dos Mac Mini») · El
   tipus de la cerca on ix l'article de cada secció: amb ell es fa la clau
   (`tipus:id`) de l'article d'una foto (mediaContent.js · `article`). */
const TIPUS_DE_SECCIO = Object.freeze({ mur: 'publicacions', mercat: 'mercat', events: 'agenda', pobles: 'pobles' });

function clauDeLArticle(article) {
  const tipus = Object.hasOwn(TIPUS_DE_SECCIO, article?.sectionId) ? TIPUS_DE_SECCIO[article.sectionId] : null;
  return tipus && article.id != null && String(article.id) !== '' ? `${tipus}:${article.id}` : null;
}

export function deMedia(media, opcions = {}) {
  /* Només una imatge es pot pintar en <img>: un vídeo o un so no porta miniatura. */
  const esImatge = !media?.kind || media.kind === 'image';
  return entrada({
    tipus: 'multimedia',
    id: media?.id,
    titol: media?.title,
    meta: [media?.source, formataData(media?.created_at, opcions.locale)],
    extracte: primerText(media?.description, media?.subtitle),
    detall: media?.description,
    cos: [media?.subtitle, media?.source, media?.tag],
    etiquetes: [media?.subtitle, media?.tag],
    imatge: esImatge ? { src: primeraImatge(media?.src, media?.imageSrc) } : null,
    href: resolveItemPath({ ...media, sectionId: media?.sectionId || 'multimedia' }),
    data: media?.created_at,
    /* La foto d'un article és una entrada de Multimèdia com les altres; qui
       compon els resultats (cercaEntrades) la retira de la vista «tot» quan
       el seu article ja hi ix. */
    fotoDe: clauDeLArticle(media?.article)
  });
}

/** Una nota pròpia. Privada: només la veu qui la té al Bloc. Sense miniatura
 *  (la portada pot ser un mitjà privat que un <img> no sap obrir). */
export function deNota(nota, opcions = {}) {
  const cos = primerText(nota?.plainText) || textPla(nota?.content);
  return entrada({
    tipus: 'notes',
    id: nota?.id,
    titol: nota?.title,
    meta: [formataData(nota?.updatedAt || nota?.updated_at || nota?.created_at, opcions.locale)],
    extracte: primerText(textPla(nota?.lead), textPla(nota?.subtitle), cos),
    detall: cos,
    cos: [nota?.subtitle, nota?.lead, ...(Array.isArray(nota?.tags) ? nota.tags : [])],
    etiquetes: [nota?.subtitle, ...(Array.isArray(nota?.tags) ? nota.tags : [])],
    href: nota?.id == null ? null : `/notes?nota=${encodeURIComponent(String(nota.id))}`,
    data: nota?.updatedAt || nota?.updated_at || nota?.created_at,
    privada: true
  });
}

/** Una conversa pròpia (el xat només en carrega les de la persona). Privada. */
export function deConversa(fil, opcions = {}) {
  return entrada({
    tipus: 'converses',
    id: fil?.id,
    titol: primerText(fil?.title, fil?.name),
    meta: [fil?.esIA ? opcions.etiquetes?.ia : null, formataData(fil?.ultimAl, opcions.locale)],
    extracte: fil?.ultimText,
    cos: [...(Array.isArray(fil?.altresNoms) ? fil.altresNoms : []), fil?.entitatNom],
    avatar: { src: fil?.avatar_url, llavor: fil?.id },
    href: fil?.id == null ? null : getSectionItemPath('xat', fil.id),
    data: fil?.ultimAl,
    privada: true
  });
}

/** Una pàgina de text del contingut base. */
export function dePagina(pagina) {
  const clau = pagina?.key ?? pagina?.slug ?? pagina?.id;
  return entrada({
    tipus: 'pagines',
    id: clau,
    titol: pagina?.title,
    extracte: primerText(pagina?.lead, pagina?.subtitle),
    detall: pagina?.html,
    cos: [pagina?.subtitle, pagina?.lead],
    etiquetes: [pagina?.subtitle],
    imatge: { src: primeraImatge(pagina?.image), alt: '' },
    href: clau == null ? null : (resolvePageSlugPath(clau) || `/page/${encodeURIComponent(String(clau))}`),
    data: pagina?.date
  });
}

/* ── La cerca ───────────────────────────────────────────────────────────── */

/* Pla 261022_1955 (Cercador Universal, T2: «Coincidència exacta > Prefix >
   Títol > Lema/Ofici > Contingut», amb el poble actiu de bonificació) · El
   graó de cada paraula segons on cau. La frase sencera igual al títol, o al
   seu començament, hi suma. El poble actiu NO suma punts: és la primera clau
   de desempat (compara), i així només ordena dins del mateix graó, mai el
   capgira (Gauntlet, crític de l'índex, confirmat: amb una bonificació fixa,
   una paraula freqüent, de pes IDF baix, deixava que el poble passara davant
   d'un graó més alt). */
const PES = Object.freeze({
  paraulaDelTitol: 6, prefixDelTitol: 4, dinsDelTitol: 2, prefixDeLEtiqueta: 1.5, dinsDeLEtiqueta: 1, cos: 0.5
});
const PES_FRASE_IGUAL = 10;
const PES_FRASE_PREFIX = 3;
const paraulesDe = (text) => (text || '').split(/[^a-z0-9]+/).filter(Boolean);

function graoDeLaFitxa(fitxa, { titol, paraules, etiquetes, paraulesEtiqueta }) {
  if (paraules.includes(fitxa)) return PES.paraulaDelTitol;
  if (paraules.some((paraula) => paraula.startsWith(fitxa))) return PES.prefixDelTitol;
  if (titol.includes(fitxa)) return PES.dinsDelTitol;
  if (paraulesEtiqueta.some((paraula) => paraula.startsWith(fitxa))) return PES.prefixDeLEtiqueta;
  if (etiquetes.includes(fitxa)) return PES.dinsDeLEtiqueta;
  return PES.cos;
}

/**
 * Els punts d'una entrada que ja casa amb totes les fitxes (AND). Cada fitxa
 * pesa segons com n'és de rara a l'índex (`pesos`, una IDF a l'estil de BM25
 * normalitzada entre 0,5 i 1): en «carmen torre», trobar «carmen» al títol
 * val més que trobar-hi «torre». Amb una sola paraula, o amb paraules
 * igual de rares, totes pesen 1.
 */
function puntua(entradaCerca, llistaFitxes, frase, pesos) {
  const titol = entradaCerca.titolPlegat || '';
  const paraules = paraulesDe(titol);
  const etiquetes = entradaCerca.etiquetesPlegades || '';
  const camps = { titol, paraules, etiquetes, paraulesEtiqueta: paraulesDe(etiquetes) };
  const titolNet = paraules.join(' ');
  let punts = titolNet === frase ? PES_FRASE_IGUAL : frase.includes(' ') && titolNet.startsWith(frase) ? PES_FRASE_PREFIX : 0;
  for (const fitxa of llistaFitxes) punts += graoDeLaFitxa(fitxa, camps) * (pesos.get(fitxa) ?? 1);
  return punts;
}

/* La IDF de cada fitxa sobre l'índex sencer (`n` entrades, `presencies` de
   cada fitxa), escalada a [0,5, 1] respecte a la més rara. */
function pesosDeLesFitxes(llistaFitxes, presencies, n) {
  const idf = new Map(llistaFitxes.map((fitxa) => {
    const amb = presencies.get(fitxa) || 0;
    return [fitxa, Math.log(1 + (n - amb + 0.5) / (amb + 0.5))];
  }));
  const maxim = Math.max(0, ...idf.values());
  return new Map(llistaFitxes.map((fitxa) => [fitxa, maxim > 0 ? 0.5 + 0.5 * (idf.get(fitxa) / maxim) : 1]));
}

/* Pla 261022_1955 (T2) · Punts; dins dels mateixos punts, el poble actiu
   (`delPoble`); després, la data i l'alfabet. */
const compara = (a, b) => (b.punts - a.punts)
  || ((b.delPoble || 0) - (a.delPoble || 0))
  || ((b.entrada.data || 0) - (a.entrada.data || 0))
  || a.entrada.titol.localeCompare(b.entrada.titol, 'ca');

const llistaDe = (valor) => (Array.isArray(valor) ? valor : []);

/* Dues entrades amb la mateixa clau: es pinta la primera, completada amb el
   que li falte de l'altra, i es busca en el text de totes dues. */
function fusiona(primera, altra) {
  const senseText = !primera.extracte && !primera.detall;
  const avatar = fusionaAvatar(primera.avatar, altra.avatar);
  return {
    ...primera,
    meta: [...new Set([...llistaDe(primera.meta), ...llistaDe(altra.meta)])],
    extracte: senseText ? altra.extracte || '' : primera.extracte,
    detall: senseText ? altra.detall || '' : primera.detall,
    imatge: primera.imatge || altra.imatge || null,
    avatar,
    href: hrefDeLaFusio(primera, altra),
    accio: primera.accio || altra.accio || null,
    data: primera.data || altra.data || 0,
    etiquetesPlegades: [primera.etiquetesPlegades, altra.etiquetesPlegades].filter((valor) => typeof valor === 'string' && valor).join(' '),
    poblePlegat: primera.poblePlegat || altra.poblePlegat || '',
    text: [primera.text, altra.text].filter((valor) => typeof valor === 'string' && valor).join(' ')
  };
}

/* Pla 261022_1955 (T3) · La ruta de la primera, llevat que siga la de reserva
   d'una entitat (/empresa/<id>: la identitat pròpia o el padró) i l'altra, de
   la mateixa clau, en porte una de neta (el slug o la canònica del directori,
   deOrganitzacio, que el servidor ja ha verificat). */
function hrefDeLaFusio(primera, altra) {
  const deReserva = primera.tipus === 'entitats' && primera.href === rutaDePerfil('entitat', primera.id);
  const neta = altra.tipus === 'entitats' && altra.href && altra.href !== rutaDePerfil('entitat', altra.id);
  if (deReserva && neta) return altra.href;
  return primera.href || altra.href || null;
}

/* La cara de la primera; si no en té, la foto de l'altra (una URL abans que
   una referència del port). */
function fusionaAvatar(primer, altre) {
  if (!primer) return altre || null;
  if (primer.src || !altre) return primer;
  if (altre.src) return { ...primer, src: altre.src };
  return !primer.ref && altre.ref ? { ...primer, ref: altre.ref } : primer;
}

/**
 * Una entrada per clau, en l'ordre de la primera aparició. Una mateixa
 * persona pot arribar de més d'una font: la IAIA és al padró (només el nom)
 * i al catàleg d'agents (rol, lema, bio). La primera és la que mana (la
 * identitat pròpia, «El teu perfil» sense «Escriu-li»; el padró, «Escriu-li»),
 * però el text de les altres també compta: si no, «matriarca» deixaria de
 * trobar-la quan arriba el padró.
 * Ordre del Mestre (261019 21:34, punt 9) · Si la que arriba després és la
 * pròpia (ambLaIdentitatPropia li ha donat la clau d'una altra), mana ella,
 * en el lloc de la primera aparició.
 */
export function fusionaPerClau(entrades) {
  const perClau = new Map();
  for (const actual of llistaDe(entrades)) {
    if (!actual?.clau) continue;
    const previa = perClau.get(actual.clau);
    if (!previa) perClau.set(actual.clau, actual);
    else perClau.set(actual.clau, actual.propia && !previa.propia ? fusiona(actual, previa) : fusiona(previa, actual));
  }
  return [...perClau.values()];
}

/**
 * Gauntlet 261016 (Bloc 3.5.1; ordre del Mestre: «Tria i deixa un sol perfil
 * per a cadascuna») · La persona de la sessió i la seua fitxa del padró o del
 * catàleg són UNA identitat quan ho declaren els seus identificadors, mai pel
 * nom (la doctrina de T6, config/navigation.js). `alies` són els de la sessió
 * (identitatsSeed · aliesDeLActor: en llavor, els de la persona pilot; en
 * remot, només el seu id, D12). Si algun és d'una identitat fundacional
 * (clauFundacional), l'entrada de persona amb eixa mateixa clau fundacional
 * (el '0001' del catàleg i del padró) passa a portar la clau de la pròpia, i
 * fusionaPerClau en fa una sola fitxa: mana la pròpia i el text de l'altra
 * també es busca. Sense «Escriu-li»: ningú no s'escriu a si mateix (el padró
 * ja deixa fora qui busca).
 * La regla del Bloc -1 es manté per als homònims: una persona amb un altre id
 * i el mateix nom continua sent una altra fitxa, amb el seu enllaç.
 *
 * Ordre del Mestre (261019 21:34, punt 9: «una sola fitxa canònica al graf
 * sense entrades duplicades», per a persones i per a organitzacions) · La
 * regla val per a TOTA fitxa amb clau canònica (clauCanonica), amb sessió o
 * sense: el '0001' del catàleg i un àlies seu del padró ('javi-llinares'), o
 * l'entitat pilot del catàleg ('socdepoble') i la mateixa entitat amb l'id del
 * servidor (`delProjecte`: els ids que el backend ja ha reconegut com
 * l'entitat pilot), són una sola fitxa. Mana la pròpia, si n'hi ha (la
 * persona de la sessió o una entitat que gestiona); si no, la primera que
 * arriba. La fitxa porta la ruta canònica neta (RUTES_CANONIQUES:
 * /javillinares, /socdepoble, /rentonar). Una fitxa sense clau canònica no es
 * toca: la seua clau continua sent el seu id.
 */
export function ambLaIdentitatPropia(entrades, alies = [], { delProjecte = [] } = {}) {
  const llista = llistaDe(entrades);
  const projecte = llistaDe(delProjecte).map(String);
  const canonicaDe = (actual) => {
    if (actual.propia === 'persona') {
      return [actual.id, ...llistaDe(alies)].map((id) => clauCanonica('persona', id)).find(Boolean) || null;
    }
    if (actual.canonica) return actual.canonica;
    return actual.tipus === 'entitats' ? clauCanonica('entitat', actual.id, { delProjecte: projecte }) : null;
  };
  const canoniques = new Map();
  for (const actual of llista) {
    const canonica = actual?.clau ? canonicaDe(actual) : null;
    if (canonica) canoniques.set(actual, canonica);
  }
  if (!canoniques.size) return llista;
  /* La primera fitxa de cada identitat (tipus i clau canònica): les pròpies
     primer, siga quin siga l'ordre de les fonts; després, la primera que arriba. */
  const identitatDe = (actual) => `${actual.tipus}:${canoniques.get(actual)}`;
  const primeres = new Map();
  for (const propies of [true, false]) {
    for (const actual of canoniques.keys()) {
      if (Boolean(actual.propia) === propies && !primeres.has(identitatDe(actual))) primeres.set(identitatDe(actual), actual);
    }
  }
  return llista.map((actual) => {
    if (!canoniques.has(actual)) return actual;
    const canonica = canoniques.get(actual);
    const primera = primeres.get(identitatDe(actual));
    const canvis = {};
    if (actual.clau !== primera.clau) canvis.clau = primera.clau;
    if (actual.canonica !== canonica) canvis.canonica = canonica;
    if (actual.href !== RUTES_CANONIQUES[canonica]) canvis.href = RUTES_CANONIQUES[canonica];
    /* «Ningú no s'escriu a si mateix» és de la PERSONA de la sessió. Una
       entitat que gestiones conserva l'«Escriu-li» del padró, com quan es
       fusiona per la seua clau (fusionaPerClau): la mateixa regla per a totes. */
    if (actual !== primera && primera.propia === 'persona' && actual.accio) canvis.accio = null;
    return Object.keys(canvis).length ? { ...actual, ...canvis } : actual;
  });
}

/**
 * Cerca `consulta` dins de les entrades (AND per paraula). Torna la llista del
 * filtre `tipus`, ordenada, i els recomptes de TOTS els tipus (per als filtres).
 * Una clau repetida compta una sola vegada (fusionaPerClau).
 * Onada 12 (261011; ordres 261011_0130, punt 1: «hi ha dos Mac Mini»;
 * correcció D3 de la refutació) · La foto d'un article (`fotoDe`) no es
 * repetix a la vista «tot» quan el seu article JA és entre els resultats: el
 * producte, el poble o la publicació ix una sola vegada, amb eixa foto de
 * miniatura. Amb el filtre del seu tipus (Multimèdia) la foto ix sempre, i
 * també a «tot» si l'article no casa amb la consulta o no és a l'índex. El
 * recompte de cada tipus és el que el seu filtre ensenya; el de «tot», el de
 * la vista «tot».
 * Pla 261022_1955 (T2) · `pobleActiu` (opcional): el poble de qui busca; una
 * entrada del mateix poble passa davant de les que tenen els mateixos punts
 * (compara), mai d'una de més punts.
 */
export function cercaEntrades(entrades, consulta, tipus = 'tot', { pobleActiu = '' } = {}) {
  const llistaFitxes = fitxes(consulta);
  const perTipus = Object.fromEntries(IDS_TIPUS.map((id) => [id, 0]));
  if (!llistaFitxes.length) return { llista: [], perTipus, total: 0, fitxes: llistaFitxes };
  /* Gauntlet (crític de l'índex, confirmat) · La frase, amb les paraules
     repetides: «Bora Bora» o «pas a pas» són títols exactes. Les fitxes (AND i
     IDF) continuen sense repetir. */
  const frase = plega(consulta).split(/[^a-z0-9]+/).filter(Boolean).join(' ');
  const filtre = tipusValid(tipus);
  const fusionades = fusionaPerClau(entrades);
  /* Una sola passada: qui casa amb totes (AND) i, per a la IDF, en quantes
     entrades de l'índex sencer apareix cada fitxa. */
  const presencies = new Map();
  const coincidents = fusionades.filter((actual) => {
    const text = typeof actual.text === 'string' ? actual.text : '';
    let totes = true;
    for (const fitxa of llistaFitxes) {
      if (text.includes(fitxa)) presencies.set(fitxa, (presencies.get(fitxa) || 0) + 1);
      else totes = false;
    }
    return totes;
  });
  const pesos = pesosDeLesFitxes(llistaFitxes, presencies, fusionades.length);
  const poble = plega(pobleActiu);
  const clausTrobades = new Set(coincidents.map((actual) => actual.clau));
  const trobades = [];
  for (const actual of coincidents) {
    const repetida = Boolean(actual.fotoDe) && clausTrobades.has(actual.fotoDe);
    if (actual.tipus in perTipus) perTipus[actual.tipus] += 1;
    if (!repetida) perTipus.tot += 1;
    if (filtre === 'tot' ? !repetida : actual.tipus === filtre) {
      trobades.push({
        entrada: actual,
        punts: puntua(actual, llistaFitxes, frase, pesos),
        delPoble: poble && actual.poblePlegat === poble ? 1 : 0
      });
    }
  }
  trobades.sort(compara);
  const llista = trobades.map((trobada) => trobada.entrada);
  return { llista, perTipus, total: llista.length, fitxes: llistaFitxes };
}
