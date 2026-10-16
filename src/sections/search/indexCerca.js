/**
 * indexCerca.js — L'índex i la cerca de /cerca (T45), en funcions pures.
 *
 * Sense React ni backend: rep els arrays que ja porten els contextos i torna
 * entrades planes. Cada adaptador tria els camps que es poden buscar (mai el
 * `searchText` d'origen, que no sempre hi és ni sempre plega accents) i mai
 * indexa ni mostra un correu.
 *
 * `cercaEntrades` fa la cerca: una fitxa per paraula, lògica AND, plegat
 * d'accents als dos costats i rànquing (títol igual > prefix al títol >
 * dins del títol > dins del cos), amb desempat per data i per ordre alfabètic.
 */
import { isSafeAsset } from '../../components/universal/UniversalUtils.js';
import { normalizeSearchText, stripMarkdownImages } from '../../config/contentHelpers.js';
import { getSectionItemPath, resolveItemPath, resolvePageSlugPath, rutaDePerfil } from '../../config/navigation.js';
import { tipusDAgent } from '../../data/agentsSeed.js';
import { clauFundacional } from '../../data/identitatsSeed.js';
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
const RE_CORREU = /[^\s@]+@[^\s@]+\.[^\s@]+/;

export const esCorreu = (valor) => RE_CORREU.test(String(valor ?? ''));

/** Minúscules, sense accents ni punt volat, espais plegats. */
export function plega(valor) {
  return normalizeSearchText(String(valor ?? '').replace(PUNT_VOLAT, ''));
}

/** Les paraules d'una consulta, plegades i sense repetir. */
export function fitxes(consulta) {
  return [...new Set(plega(consulta).split(/[^a-z0-9]+/).filter(Boolean))];
}

function plegaCaracter(caracter) {
  return caracter.toLowerCase().normalize('NFD').replace(COMBINANTS, '').replace(PUNT_VOLAT, '');
}

/* El text plegat caràcter a caràcter, amb l'índex original de cada caràcter
   plegat: així una coincidència sobre «guell» es pot marcar sobre «Güell». */
function mapaPlegat(text) {
  let plegat = '';
  const index = [];
  for (let i = 0; i < text.length; i += 1) {
    const peca = plegaCaracter(text[i]);
    for (let j = 0; j < peca.length; j += 1) {
      plegat += peca[j];
      index.push(i);
    }
  }
  return { plegat, index };
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
  const { plegat, index } = mapaPlegat(net);
  const trams = [];
  for (const fitxa of cerca) {
    let posicio = plegat.indexOf(fitxa);
    while (posicio >= 0) {
      trams.push([index[posicio], index[posicio + fitxa.length - 1] + 1]);
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

/** Text pla d'un camp que pot portar HTML o Markdown. Mai passa per innerHTML. */
export function textPla(valor) {
  if (valor == null || typeof valor === 'object') return '';
  return stripMarkdownImages(String(valor))
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
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
 * avatar, href, accio, data, privada, propia, titolPlegat, text }. Sense id no
 * n'hi ha: la clau és la que deduplica. Sense títol ni extracte tampoc (no es
 * podria pintar). `detall` és el text llarg (cos de la pàgina, de la nota…):
 * d'ací ix l'extracte quan la coincidència no és a l'entradilla.
 */
function entrada({ tipus, id, titol, meta = [], extracte = '', detall = '', cos = [], imatge = null, avatar = null,
  href = null, accio = null, data = null, privada = false, propia = false, fotoDe = null }) {
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
    avatar: avatar ? { nom: textTitol, src: primeraImatge(avatar.src), llavor: avatar.llavor ?? id } : null,
    href: href || null,
    accio,
    data: marcaTemps(data),
    privada: Boolean(privada),
    propia,
    /* La clau de l'article del qual esta entrada és la foto (deMedia), o null. */
    fotoDe,
    titolPlegat: plega(textTitol),
    text: plega([textTitol, textExtracte, textDetall, ...cos.map((valor) => textPla(valor))].join(' '))
  };
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
    meta: [perfil === 'ia' ? opcions.etiquetes?.ia : null, agent?.role, agent?.town_name],
    extracte: primerText(agent?.short_bio, agent?.lema),
    cos: [agent?.role, agent?.town_name, agent?.tag, agent?.lema],
    avatar: { src: agent?.avatar_url, llavor: agent?.id },
    href: rutaDePerfil(perfil, agent?.id)
  });
}

/**
 * Una fila del padró (membres_del_poble o la llavor del xat). Mai porta correu.
 * Poliment T45 · Sense `opcions.fitxesDePersones`, el títol d'una persona (o
 * d'una IA) no hi enllaça: l'acció és «Escriu-li». Qui sap obrir-les el passa:
 * seed i local i, des de l'ordre del Mestre (261002), el remot amb la capacitat
 * 'directori' (RPC perfil_public, useCercaGlobal). Una entitat sempre enllaça:
 * organization_directory es pot llegir.
 */
export function deMembre(membre, opcions = {}) {
  const id = membre?.usuari_id ?? membre?.usuariId ?? null;
  const nom = membre?.nom ?? membre?.name;
  if (esCorreu(nom)) return null;
  const perfil = membre?.tipus === 'entitat' ? 'entitat' : membre?.tipus === 'ia' ? 'ia' : 'persona';
  const filId = membre?.fil_id ?? membre?.filId ?? null;
  const fitxaOberta = perfil === 'entitat' || opcions.fitxesDePersones === true;
  return entrada({
    tipus: perfil === 'entitat' ? 'entitats' : 'persones',
    id,
    titol: nom,
    meta: [perfil === 'ia' ? opcions.etiquetes?.ia : null],
    avatar: { src: membre?.avatar_url ?? membre?.avatarUrl, llavor: id },
    href: fitxaOberta ? rutaDePerfil(perfil, id) : null,
    accio: id == null ? null : {
      tipus: 'escriu',
      href: filId ? getSectionItemPath('xat', filId) : `/xat?amb=${encodeURIComponent(String(id))}`
    }
  });
}

/**
 * La persona de la sessió i les entitats que gestiona (IdentitatContext).
 * El padró les deixa fora a propòsit; sense açò, ningú es trobaria a si mateix.
 * Si el nom és el correu (nomDePersona hi cau), es mostra `opcions.nomCompte`.
 */
export function deIdentitat(identitat, opcions = {}) {
  if (!identitat) return null;
  const esEntitat = identitat.tipus === 'entitat';
  const nomBrut = typeof identitat.nom === 'string' ? identitat.nom.trim() : '';
  const correu = typeof opcions.correu === 'string' ? opcions.correu.trim().toLowerCase() : '';
  const amagat = !nomBrut || esCorreu(nomBrut) || (correu && nomBrut.toLowerCase() === correu);
  const nom = amagat ? (esEntitat ? null : opcions.nomCompte) : nomBrut;
  return entrada({
    tipus: esEntitat ? 'entitats' : 'persones',
    id: identitat.id,
    titol: nom,
    meta: esEntitat ? [] : [opcions.poble],
    cos: esEntitat ? [identitat.slug] : [opcions.poble],
    avatar: { src: identitat.avatar, llavor: identitat.id },
    href: esEntitat ? rutaDePerfil('entitat', identitat.id) : '/el-meu-perfil',
    propia: esEntitat ? 'entitat' : 'persona'
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
    imatge: { src: primeraImatge(acte?.image_url, acte?.imageSrc) },
    href: resolveItemPath({ ...acte, sectionId: acte?.sectionId || 'events' }),
    data: acte?.date || acte?.created_at
  });
}

export function deProducte(producte) {
  const venedor = primerText(producte?.seller, producte?.author_name);
  return entrada({
    tipus: 'mercat',
    id: producte?.id,
    titol: producte?.title,
    meta: [producte?.price, venedor, producte?.population],
    extracte: primerText(producte?.subtitle, producte?.summary, producte?.description),
    detall: producte?.description,
    cos: [producte?.subtitle, venedor, producte?.tag, producte?.category_slug, producte?.population],
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
    imatge: { src: primeraImatge(pagina?.image), alt: '' },
    href: clau == null ? null : (resolvePageSlugPath(clau) || `/page/${encodeURIComponent(String(clau))}`),
    data: pagina?.date
  });
}

/* ── La cerca ───────────────────────────────────────────────────────────── */

function puntua(entradaCerca, llistaFitxes, frase) {
  const titol = entradaCerca.titolPlegat || '';
  const paraules = titol.split(/[^a-z0-9]+/).filter(Boolean);
  let punts = paraules.join(' ') === frase ? 8 : 0;
  for (const fitxa of llistaFitxes) {
    if (paraules.some((paraula) => paraula.startsWith(fitxa))) punts += 4;
    else if (titol.includes(fitxa)) punts += 2;
    else punts += 1;
  }
  return punts;
}

const compara = (a, b) => (b.punts - a.punts)
  || ((b.entrada.data || 0) - (a.entrada.data || 0))
  || a.entrada.titol.localeCompare(b.entrada.titol, 'ca');

const llistaDe = (valor) => (Array.isArray(valor) ? valor : []);

/* Dues entrades amb la mateixa clau: es pinta la primera, completada amb el
   que li falte de l'altra, i es busca en el text de totes dues. */
function fusiona(primera, altra) {
  const senseText = !primera.extracte && !primera.detall;
  const avatar = primera.avatar && !primera.avatar.src && altra.avatar?.src
    ? { ...primera.avatar, src: altra.avatar.src }
    : primera.avatar || altra.avatar || null;
  return {
    ...primera,
    meta: [...new Set([...llistaDe(primera.meta), ...llistaDe(altra.meta)])],
    extracte: senseText ? altra.extracte || '' : primera.extracte,
    detall: senseText ? altra.detall || '' : primera.detall,
    imatge: primera.imatge || altra.imatge || null,
    avatar,
    href: primera.href || altra.href || null,
    accio: primera.accio || altra.accio || null,
    data: primera.data || altra.data || 0,
    text: [primera.text, altra.text].filter((valor) => typeof valor === 'string' && valor).join(' ')
  };
}

/**
 * Una entrada per clau, en l'ordre de la primera aparició. Una mateixa
 * persona pot arribar de més d'una font: la IAIA és al padró (només el nom)
 * i al catàleg d'agents (rol, lema, bio). La primera és la que mana (la
 * identitat pròpia porta /el-meu-perfil; el padró, «Escriu-li»), però el
 * text de les altres també compta: si no, «matriarca» deixaria de trobar-la
 * quan arriba el padró.
 */
export function fusionaPerClau(entrades) {
  const perClau = new Map();
  for (const actual of llistaDe(entrades)) {
    if (!actual?.clau) continue;
    const previa = perClau.get(actual.clau);
    perClau.set(actual.clau, previa ? fusiona(previa, actual) : actual);
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
 * fusionaPerClau en fa una sola fitxa: mana la pròpia (/el-meu-perfil) i el
 * text de l'altra també es busca. Sense «Escriu-li»: ningú no s'escriu a si
 * mateix (el padró ja deixa fora qui busca).
 * La regla del Bloc -1 es manté per als homònims: una persona amb un altre id
 * i el mateix nom continua sent una altra fitxa, amb el seu enllaç.
 */
export function ambLaIdentitatPropia(entrades, alies = []) {
  const llista = llistaDe(entrades);
  const propia = llista.find((actual) => actual?.propia === 'persona');
  if (!propia) return llista;
  const clauDe = (id) => clauFundacional({ tipus: 'persona', id });
  const fundacional = [propia.id, ...llistaDe(alies)].map(clauDe).find(Boolean);
  if (!fundacional) return llista;
  return llista.map((actual) => (actual && actual !== propia && !actual.propia && actual.tipus === propia.tipus
    && clauDe(actual.id) === fundacional ? { ...actual, clau: propia.clau, accio: null } : actual));
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
 */
export function cercaEntrades(entrades, consulta, tipus = 'tot') {
  const llistaFitxes = fitxes(consulta);
  const perTipus = Object.fromEntries(IDS_TIPUS.map((id) => [id, 0]));
  if (!llistaFitxes.length) return { llista: [], perTipus, total: 0, fitxes: llistaFitxes };
  const frase = llistaFitxes.join(' ');
  const filtre = tipusValid(tipus);
  const coincidents = fusionaPerClau(entrades).filter((actual) => {
    const text = typeof actual.text === 'string' ? actual.text : '';
    return llistaFitxes.every((fitxa) => text.includes(fitxa));
  });
  const clausTrobades = new Set(coincidents.map((actual) => actual.clau));
  const trobades = [];
  for (const actual of coincidents) {
    const repetida = Boolean(actual.fotoDe) && clausTrobades.has(actual.fotoDe);
    if (actual.tipus in perTipus) perTipus[actual.tipus] += 1;
    if (!repetida) perTipus.tot += 1;
    if (filtre === 'tot' ? !repetida : actual.tipus === filtre) {
      trobades.push({ entrada: actual, punts: puntua(actual, llistaFitxes, frase) });
    }
  }
  trobades.sort(compara);
  const llista = trobades.map((trobada) => trobada.entrada);
  return { llista, perTipus, total: llista.length, fitxes: llistaFitxes };
}
