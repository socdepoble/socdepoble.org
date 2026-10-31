/* Pla 261028_1526 (P1-61, Fase 2) · Les metadades socials (títol, descripció i
   imatge del <head>) d'una pàgina de text i d'un detall de llavor, una sola
   regla per a qui les escriu: el client (TextSection) i el prerender del
   build (tooling/seo/build-social-manifest.mjs). Si divergiren, el head servit
   d'una ruta (que seoHead respecta mentre s'hi està) diria una cosa i l'app
   una altra. Pur i carregable des de node: només importa mòduls purs.
   Decisió per defecte (261028, D6) · La descripció d'una pàgina és
   l'entradeta i, sense, el subtítol (lead-first), igual al client i al
   prerender. */
import { CAP_SOCIAL_BASE, primeraImatgeSocial } from './imatgeSocial.js';
import { nomDeLaGent } from '../sections/pobles/nomsDelPoble.js';

export const LIMIT_TITOL = 160;
export const LIMIT_DESCRIPCIO = 300;

const ENTITATS = Object.freeze({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&#39;': "'" });

/* Revisió adversarial (261028) · Una tirada de marques d'èmfasi (*, _ i ~)
   només és èmfasi a la vora d'una paraula: entre dues lletres o xifres és
   text (doc_to_app, created_at, 02_saber, sb_secret_…) i es queda. Abans
   se n'anava qualsevol guió baix: els títols de la Wiki eixien «doctoapp» i
   la guarda de secrets del build (plainText) ja no reconeixia cap sb_…
   Lineal: cada tirada es mira una vegada, amb el caràcter de cada costat. */
const LLETRA_A_LA_FI = /[\p{L}\p{N}]$/u;
const LLETRA_A_L_INICI = /^[\p{L}\p{N}]/u;
const senseEmfasi = (text) => text.replace(/[*_~]+/g, (tirada, posicio, tot) => (
  LLETRA_A_LA_FI.test(tot.slice(Math.max(0, posicio - 2), posicio))
    && LLETRA_A_L_INICI.test(tot.slice(posicio + tirada.length, posicio + tirada.length + 2)) ? tirada : ''));

/* El text pla d'una metadada: sense etiquetes HTML (ni scripts), sense la
   sintaxi d'enllaç, de codi ni d'èmfasi del Markdown, amb les entitats bàsiques
   descodificades, sense caràcters de control (\p{Cc}) i amb un sol espai. Es retalla
   a `limit` unitats UTF-16 sense partir cap caràcter (un emoji sencer o res),
   sense espai final i sense cap marca solta al final (el tall d'un
   doc_to_app), i per això tornar-lo a passar no el canvia. */
export function textPla(valor, limit = LIMIT_DESCRIPCIO) {
  if (typeof valor !== 'string') return '';
  const text = senseEmfasi(valor.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]*>/g, ' ').replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1').replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`/g, '')).replace(/&(?:amp|lt|gt|quot|apos|#39);/g, (entitat) => ENTITATS[entitat])
    .replace(/\p{Cc}/gu, ' ').replace(/\s+/g, ' ').trim();
  let retallat = '';
  for (const caracter of text) {
    if (retallat.length + caracter.length > limit) break;
    retallat += caracter;
  }
  return retallat.replace(/[*_~]+$/, '').trimEnd();
}

/* La imatge del <head> amb el seu alt, o null (la targeta genèrica): només
   una 'triada' hi va. Sense MIME ni mides: el client no les llig dels bytes
   (el prerender sí, de dist/). */
const imatgeDelHead = (imatge, alt) => {
  if (imatge.estat !== 'triada') return null;
  const text = textPla(alt, LIMIT_TITOL);
  return text ? { url: imatge.url, alt: text } : imatge.url;
};

/**
 * Les metadades d'una pàgina de text (PAGE_COPY o el copy del core):
 *   · title: el títol;
 *   · description: l'entradeta o, sense, el subtítol; sense cap dels dos, la
 *     de CAP_SOCIAL_BASE;
 *   · imatge: el que torna primeraImatgeSocial('pagina'), amb l'estat
 *     ('triada', 'bloquejada' o 'absent'): el prerender fa porta roja d'una
 *     'bloquejada';
 *   · image: la del <head> (una 'triada' amb el seu alt) o null. L'alt és el
 *     de page.image (imageAlt) si la triada és ella; si no, el títol.
 * `opcions` són les d'urlSocialDe (origen, supabaseUrl, permesos).
 */
export function metadadesDePagina(page, opcions) {
  const pagina = page && typeof page === 'object' ? page : {};
  const imatge = primeraImatgeSocial('pagina', pagina, opcions);
  const esLaPortada = imatge.estat === 'triada' && typeof pagina.image === 'string' && pagina.image.trim() === imatge.ref;
  return {
    title: textPla(pagina.title, LIMIT_TITOL),
    description: textPla(pagina.lead || pagina.subtitle, LIMIT_DESCRIPCIO) || CAP_SOCIAL_BASE.description,
    imatge,
    image: imatgeDelHead(imatge, (esLaPortada && pagina.imageAlt) || pagina.title)
  };
}

/**
 * Ordre del Mestre (30-10-2026, prompt 2208, T1.1) · Les metadades de la
 * pàgina d'un plugin (/plugin/<id>, PluginPage.jsx), amb la regla de
 * metadadesDePagina sobre els camps del registre (registrePlugins.js): el
 * títol, l'entradeta i, sense, el subtítol, i la il·lustració que pinta la
 * portada (imatge) amb el seu alt. La crida el client i el prerender del build.
 */
export function metadadesDePlugin(plugin, opcions) {
  const p = plugin && typeof plugin === 'object' ? plugin : {};
  return metadadesDePagina({ title: p.titol, lead: p.entradilla, subtitle: p.subtitol, image: p.imatge, imageAlt: p.imatgeAlt }, opcions);
}

/* El títol i l'entradeta que pinta el detall de cada secció amb llavor al
   repositori, els de detail/detailSectionMeta.jsx (getTitle) i
   elementDeSeccio.js (paginaDElement · lead): la descripció del <head>
   d'ItemDetailSection és `pagina.lead || getSubtitle(item)`. Una prova de
   paritat (metadadesSocials.test.js) els compara amb els de veres. */
const DETALLS = Object.freeze({
  mercat: Object.freeze({
    titol: (item) => item.title || 'Producte',
    descripcio: (item) => item.entradilla || item.subtitle || item.description || item.summary
  }),
  events: Object.freeze({
    titol: (item) => item.title || 'Acte',
    descripcio: (item) => item.entradilla || item.subtitle
  }),
  pobles: Object.freeze({
    titol: (item) => item.author || nomDeLaGent(item.title || item.name) || 'Gent de Poble',
    descripcio: (item) => item.entradilla || item.content || item.title || item.name
  })
});
export const SECCIONS_DE_DETALL = Object.freeze(Object.keys(DETALLS));

/**
 * Les metadades del detall d'un element de llavor (/mercat/<id>,
 * /events/<id>, /pobles/<id>), amb la mateixa forma que metadadesDePagina:
 * la imatge és primeraImatgeSocial(seccio) i el seu alt, el títol (heroAlt).
 * Una secció sense regla ací torna null.
 */
export function metadadesDeDetall(seccio, item, opcions) {
  const regla = Object.hasOwn(DETALLS, seccio) ? DETALLS[seccio] : null;
  if (!regla || !item || typeof item !== 'object') return null;
  const titol = regla.titol(item);
  const imatge = primeraImatgeSocial(seccio, item, opcions);
  return {
    title: textPla(titol, LIMIT_TITOL),
    description: textPla(regla.descripcio(item), LIMIT_DESCRIPCIO) || CAP_SOCIAL_BASE.description,
    imatge,
    image: imatgeDelHead(imatge, titol)
  };
}
