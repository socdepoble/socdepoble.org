/* Onada 5 (F5, fase 2) · Traductors de la Viquipèdia, Wikidata i Commons, al
   patró ENX-13 de sollutia/recursos.js: cada un torna un DTO tancat i
   congelat amb només els camps que nomena, mai el JSON cru de Wikimedia. Un
   camp que l'API afija demà no arriba a la interfície fins que algú l'afig
   ací. Una forma que no és la capturada fa llançar, i la Frontissa ho
   convertix en INVALID_PAYLOAD (també l'{"error":…} que MediaWiki torna amb
   HTTP 200).

   Les formes són les de les captures reals de
   tests/frontissa/fixtures/viquipedia/ (261009), amb formatversion=2. */

/** «Municipi d'Espanya»: el P31 de la Torre i de Sella a Wikidata (captura del 261009). */
export const MUNICIPI_D_ESPANYA = 'Q2074737';

const QID = /^Q[1-9]\d{0,11}$/;
const SHA1 = /^[0-9a-f]{40}$/;
const CODI_INE = /^\d{5}$/;
const ORIGENS_D_IMATGE = Object.freeze(['https://upload.wikimedia.org', 'https://thumb.wikimedia.org']);
const ORIGENS_DE_FONT = Object.freeze(['https://commons.wikimedia.org']);

const congela = (objecte) => Object.freeze(objecte);
const esObjecte = (valor) => Boolean(valor) && typeof valor === 'object' && !Array.isArray(valor);
const text = (valor) => (typeof valor === 'string' ? valor : null);
const nombre = (valor) => (typeof valor === 'number' && Number.isFinite(valor) ? valor : null);

/* «Fitxer:El riu251.jpg» o «El_riu251.jpg» → «El riu251.jpg». El prefix de
   l'espai de noms ve traduït per cada wiki: es talla pel primer «:». */
export function nomDeFitxer(titol, { ambPrefix = false } = {}) {
  if (typeof titol !== 'string') return null;
  const sencer = titol.replace(/_/g, ' ').trim();
  const nom = ambPrefix ? sencer.slice(sencer.indexOf(':') + 1).trim() : sencer;
  return nom && (!ambPrefix || sencer.includes(':')) ? nom : null;
}

const ENTITATS_HTML = Object.freeze({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' });

/**
 * El text d'un camp HTML de Commons (Artist, Credit): sense etiquetes i amb
 * les entitats resoltes. No és un sanejador: el resultat és text pla, que
 * React escapa, i no torna mai a ser HTML. Sense DOMParser, perquè el mateix
 * codi ha de poder córrer fora del navegador.
 */
export function textDeHtml(html) {
  if (typeof html !== 'string') return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entitat, nom) => {
      if (nom[0] === '#') {
        const codi = nom[1] === 'x' || nom[1] === 'X' ? parseInt(nom.slice(2), 16) : parseInt(nom.slice(1), 10);
        return Number.isInteger(codi) && codi > 31 && codi <= 0x10ffff ? String.fromCodePoint(codi) : ' ';
      }
      return ENTITATS_HTML[nom.toLowerCase()] ?? entitat;
    })
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* Una URL https d'un origen de la llista, sense consulta ni fragment: els
   paràmetres utm_* que Wikimedia hi afig no fan falta per a res. */
function urlNeta(valor, origens) {
  if (typeof valor !== 'string') return null;
  try {
    const url = new URL(valor);
    if (url.protocol !== 'https:' || url.username || url.password || !origens.includes(url.origin)) return null;
    url.search = '';
    url.hash = '';
    return url.href;
  } catch {
    return null;
  }
}

const urlHttps = (valor) => {
  if (typeof valor !== 'string') return null;
  try {
    const url = new URL(valor);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
};

/* ── Wikidata ─────────────────────────────────────────────────────────── */

/* Les declaracions vigents d'una propietat: cap 'deprecated' ni cap snak
   sense valor (somevalue/novalue). */
const declaracions = (entitat, propietat) => (Array.isArray(entitat?.claims?.[propietat]) ? entitat.claims[propietat] : [])
  .filter((declaracio) => declaracio?.rank !== 'deprecated' && declaracio?.mainsnak?.snaktype === 'value');

const valorsItem = (entitat, propietat) => declaracions(entitat, propietat)
  .map((declaracio) => declaracio.mainsnak.datavalue?.value?.id)
  .filter((id) => typeof id === 'string' && QID.test(id));

const primerText = (entitat, propietat) => {
  const valor = declaracions(entitat, propietat)
    .map((declaracio) => declaracio.mainsnak.datavalue?.value)
    .find((candidat) => typeof candidat === 'string' && candidat.trim());
  return valor ? valor.trim() : null;
};

/* La població: la declaració preferent; si no n'hi ha, la de data (P585) més
   recent. Wikidata dona la quantitat com a text amb signe («+749»). */
function poblacioDe(entitat) {
  const amb = declaracions(entitat, 'P1082')
    .map((declaracio) => ({
      rank: declaracio.rank,
      quan: String(declaracio.qualifiers?.P585?.[0]?.datavalue?.value?.time || ''),
      valor: Number(declaracio.mainsnak.datavalue?.value?.amount)
    }))
    .filter((d) => Number.isSafeInteger(d.valor) && d.valor >= 0);
  const preferent = amb.find((d) => d.rank === 'preferred');
  if (preferent) return preferent.valor;
  const [mesRecent] = amb.sort((a, b) => (a.quan < b.quan ? 1 : a.quan > b.quan ? -1 : 0));
  return mesRecent ? mesRecent.valor : null;
}

function coordenadesDe(entitat) {
  const valor = declaracions(entitat, 'P625')[0]?.mainsnak?.datavalue?.value;
  const lat = nombre(valor?.latitude);
  const lng = nombre(valor?.longitude);
  return lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : { lat: null, lng: null };
}

function entitatsDe(payload) {
  if (!esObjecte(payload) || !esObjecte(payload.entities)) throw new Error('Manca entities');
  return Object.values(payload.entities).filter((entitat) => esObjecte(entitat) && QID.test(entitat.id) && !('missing' in entitat));
}

function traductorDEntitats(payload) {
  return congela(entitatsDe(payload).map((entitat) => {
    const ine = primerText(entitat, 'P772');
    return congela({
      qid: entitat.id,
      etiqueta: text(entitat.labels?.ca?.value),
      titolCawiki: text(entitat.sitelinks?.cawiki?.title),
      esMunicipi: valorsItem(entitat, 'P31').includes(MUNICIPI_D_ESPANYA),
      ine: ine && CODI_INE.test(ine) ? ine : null,
      poblacio: poblacioDe(entitat),
      p18: nomDeFitxer(primerText(entitat, 'P18')),
      p94: nomDeFitxer(primerText(entitat, 'P94')),
      p131: congela(valorsItem(entitat, 'P131')),
      ...coordenadesDe(entitat)
    });
  }));
}

function traductorDEtiquetes(payload) {
  return congela(entitatsDe(payload).map((entitat) => congela({
    qid: entitat.id,
    etiqueta: text(entitat.labels?.ca?.value)
  })));
}

function traductorDeCerca(payload) {
  const resultats = payload?.query?.search;
  if (!Array.isArray(resultats)) throw new Error('Manca query.search');
  return congela(resultats.map((resultat) => resultat?.title).filter((titol) => typeof titol === 'string' && QID.test(titol)));
}

/* ── Viquipèdia ───────────────────────────────────────────────────────── */

function paginaDe(payload) {
  const pagines = payload?.query?.pages;
  if (!Array.isArray(pagines)) throw new Error('Manca query.pages');
  return pagines;
}

function traductorDArticle(payload) {
  const [pagina] = paginaDe(payload);
  if (!esObjecte(pagina) || typeof pagina.title !== 'string') throw new Error('Manca la pàgina');
  const propietats = esObjecte(pagina.pageprops) ? pagina.pageprops : {};
  const principal = Array.isArray(pagina.coordinates)
    ? (pagina.coordinates.find((c) => c?.primary === true) || pagina.coordinates[0])
    : null;
  const lat = nombre(principal?.lat);
  const lng = nombre(principal?.lon);
  return congela({
    titol: pagina.title,
    falta: pagina.missing === true || pagina.invalid === true,
    desambiguacio: Object.hasOwn(propietats, 'disambiguation'),
    qid: QID.test(propietats.wikibase_item) ? propietats.wikibase_item : null,
    extracte: text(pagina.extract) || '',
    imatgePagina: nomDeFitxer(pagina.pageimage),
    fitxers: congela((Array.isArray(pagina.images) ? pagina.images : [])
      .filter((imatge) => imatge?.ns === 6)
      .map((imatge) => nomDeFitxer(imatge.title, { ambPrefix: true }))
      .filter(Boolean)),
    lat: lat !== null && lng !== null ? lat : null,
    lng: lat !== null && lng !== null ? lng : null
  });
}

/* ── Commons ──────────────────────────────────────────────────────────── */

const metadada = (extmetadata, camp) => text(extmetadata?.[camp]?.value);

function traductorDeFitxers(payload) {
  return congela(paginaDe(payload).flatMap((pagina) => {
    const info = Array.isArray(pagina?.imageinfo) ? pagina.imageinfo[0] : null;
    const fitxer = nomDeFitxer(pagina?.title, { ambPrefix: true });
    if (!fitxer || pagina.missing === true || pagina.invalid === true || !esObjecte(info)) return [];
    const amplada = nombre(info.width);
    const alcada = nombre(info.height);
    const src = urlNeta(info.thumburl, ORIGENS_D_IMATGE) || urlNeta(info.url, ORIGENS_D_IMATGE);
    if (!src || !amplada || !alcada || typeof info.mime !== 'string') return [];
    const meta = esObjecte(info.extmetadata) ? info.extmetadata : {};
    return [congela({
      fitxer,
      mime: info.mime.toLowerCase(),
      amplada,
      alcada,
      src,
      sha1: SHA1.test(info.sha1) ? info.sha1 : null,
      autor: textDeHtml(metadada(meta, 'Artist')) || null,
      llicencia: textDeHtml(metadada(meta, 'LicenseShortName')) || null,
      llicenciaUrl: urlHttps(metadada(meta, 'LicenseUrl')),
      restriccions: textDeHtml(metadada(meta, 'Restrictions')),
      fontUrl: urlNeta(info.descriptionurl, ORIGENS_DE_FONT)
    })];
  }));
}

export const RECURSOS = Object.freeze({
  cercaMunicipi: Object.freeze({ traductor: traductorDeCerca }),
  entitats: Object.freeze({ traductor: traductorDEntitats }),
  etiquetes: Object.freeze({ traductor: traductorDEtiquetes }),
  article: Object.freeze({ traductor: traductorDArticle }),
  fitxers: Object.freeze({ traductor: traductorDeFitxers })
});
