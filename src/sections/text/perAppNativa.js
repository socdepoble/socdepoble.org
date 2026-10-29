/**
 * perAppNativa.js — Pla 261027_0845 (Guarda Nocturna), T1-06 · El text de les
 * pàgines dins de l'app nativa, sense nomenar cap altra plataforma mòbil.
 *
 * La regla 2.3.10 de l'App Store no deixa nomenar, dins de l'app d'iOS, cap
 * altra plataforma mòbil ni cap altra botiga d'aplicacions. El Full de ruta i
 * l'Avís legal en nomenaven (Google Play dins d'un comentari HTML que el text
 * pla de la cerca sí que llegia; «l'aplicació Sóc de Poble per a Android i
 * iPhone»), i totes dues pàgines s'obrin dins de l'app: la targeta del Mur, la
 * cerca i les connexions de Notes.
 *
 * Qui hi passa. TextSection (la capçalera, la descripció de useSEO i el cos),
 * CosDeLaPagina (també el cos de PublicacioDetall i de PluginPage),
 * paginaDeRuta (el lector de connexions i les targetes incrustades), la
 * targeta del Mur (mur/targetesMur.js · targetesDeSistema: el Mur, el
 * Calendari i usePaginesDelSistema) i la cerca (search/useCercaGlobal.js
 * indexa paginaPerAppNativa(pàgina): ni el comentari del Full de ruta ni la
 * frase de l'Avís legal no hi entren; SearchSection.test.jsx ho vigila).
 * Encara no: la Wiki (00_index enllaça una acta amb «google_play» al nom).
 *
 * PAGE_COPY no es toca: la frontissa de contingut
 * (tooling/gates/frontissa-contingut.mjs) en guarda l'empremta, i la web
 * continua dient el mateix, byte a byte. El text s'adapta en pintar-lo, i
 * només dins de l'app nativa (esAppNativa; a iOS i a Android, com
 * Descàrregues). De més fi a més gros:
 *   1. fora els comentaris HTML: mai es veuen (DOMPurify ja els lleva), però
 *      el text pla (llevaEtiquetes) en llig el text;
 *   2. fora els enllaços a les altres botigues (el text es queda), les
 *      imatges que en porten el nom o el distintiu, i els atributs que es
 *      lligen o se senten (title, alt, aria-label…) quan en nomenen alguna;
 *   3. les adaptacions declarades (ADAPTACIONS): la frase es queda i només
 *      perd la menció;
 *   4. la xarxa, si el text que es llig encara en nomena alguna:
 *      a. el bloc de text més menut (un paràgraf, un element de llista, un
 *         encapçalament…) que en nomena alguna no es pinta, i una cel·la de
 *         taula es buida;
 *      b. el tros de línia entre dos blocs (el text solt, o el que va al
 *         costat d'una llista niuada) que en nomena alguna, encara que una
 *         etiqueta de línia la partisca («<em>Google</em> Play»), perd el
 *         text; les etiquetes que hi queden buides, també se'n van;
 *      c. la comprovació final: si encara en queda alguna (partida entre dos
 *         blocs), es buiden els trossos de text que la formen; i si ni així,
 *         el cos no es pinta (''). D'ací no n'ix cap.
 *   Una menció nova que no tinga adaptació perd text dins de l'app: la prova
 *   del contingut real (perAppNativa.test.js) exigix que el Full de ruta i
 *   l'Avís legal no arriben mai a la xarxa, perquè cap paràgraf legal
 *   desaparega sense que algú ho haja decidit.
 *
 * «El text que es llig» té dos lectures, i n'hi ha prou amb una: la de
 * llevaEtiquetes (cada etiqueta, un espai) i la de la pantalla (les etiquetes
 * de línia no separen: «<b>Andr</b>oid» es llig «Android»).
 *
 * Les mencions d'Apple (l'App Store, l'iPhone, iOS) es queden: la regla només
 * parla de les ALTRES plataformes, i cap regla de Google Play no les prohibix
 * dins de l'app d'Android. Fora de l'app nativa, tot torna tal qual: el mateix
 * objecte i el mateix text.
 *
 * Pur: sense React ni DOM, només cadenes. Cap regex no mira arrere (WebKit
 * antic no les entén) ni recorre el text dues vegades per cada «<».
 */
import { llevaEtiquetes } from '../../config/contentHelpers.js';
import { esAppNativa } from '../../config/origenPublic.js';

/* L'espai entre dos paraules d'un nom: també el dur, el guió baix i el guionet
   (google_play, Google-Play), o cap (GooglePlay). ALLOW_RAW_COLOR: &#160; és entitat HTML */
const JUNT = /* ALLOW_RAW_COLOR */ '(?:[\\s_-]|&nbsp;|&#160;)*';

/** Les altres plataformes mòbils i les seues botigues. «androide» (el robot) i «display store» no en són cap. */
export const PLATAFORMA_ALIENA = new RegExp(
  `Google${JUNT}Play|\\bPlay${JUNT}Store|\\bAndroid\\b|\\bAPKs?\\b|F-Droid|AppGallery|Galaxy${JUNT}Store|HarmonyOS`,
  'i'
);
const PLATAFORMA_ALIENA_TOTES = new RegExp(PLATAFORMA_ALIENA.source, 'gi');

/* El mateix en un nom de fitxer, un alt o un title (google-play-badge.png). */
const IMATGE_ALIENA = /google[\s_-]*play|play[\s_-]*store|\bandroid\b|\bapks?\b|f-droid|appgallery|galaxy[\s_-]*store|harmonyos/i;
const BOTIGA_ALIENA = /play\.google\.com|f-droid\.org|appgallery\.huawei\.com|galaxystore\.samsung\.com/i;

/** Cert si el text (o l'HTML) nomena una altra plataforma mòbil o la seua botiga. */
export function nomenaPlataformaAliena(text) {
  return PLATAFORMA_ALIENA.test(String(text ?? ''));
}

/* El text que es veu d'un tros d'HTML, per a dir què s'ha retirat. */
const textDe = (html) => llevaEtiquetes(html).replace(/* ALLOW_RAW_COLOR */ /&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ').trim();

const DISPOSITIU = "(?:l['’])?(?:Android|iPhone|iPad|iPadOS|iOS)";

/**
 * Les adaptacions declarades: la frase es queda i només perd la menció. Cada
 * una porta el seu motiu; `canvi` rep el tros trobat i en torna el substitut.
 */
export const ADAPTACIONS = Object.freeze([
  Object.freeze({
    motiu: "Avís legal, «Com esborrar el teu compte»: «l'aplicació Sóc de Poble per a Android i iPhone» → «l'aplicació Sóc de Poble». "
      + 'La llista de dispositius fora; una llista només d’Apple es queda.',
    patro: new RegExp(`\\s+per\\s+a\\s+${DISPOSITIU}(?:\\s*(?:,|\\bi\\b|\\bo\\b)\\s*${DISPOSITIU})*`, 'g'),
    canvi: (tros) => (nomenaPlataformaAliena(tros) ? '' : tros)
  })
]);

const adaptaFrases = (text) => ADAPTACIONS.reduce((actual, { patro, canvi }) => actual.replace(patro, canvi), text);

/* Els blocs que poden portar text. Un bloc «fulla» no en porta cap altre dins:
   és el més menut que conté la menció. */
const ETIQUETES_DE_BLOC = 'p|li|dt|dd|h[1-6]|blockquote|figcaption|figure|pre|caption|td|th|tr|thead|tbody|tfoot|table|ul|ol|dl|div|section|article|aside|header|footer|nav|details|summary';
const BLOC_FULLA = new RegExp(
  `(<(${ETIQUETES_DE_BLOC})\\b[^<>]*>)((?:(?!<\\/?(?:${ETIQUETES_DE_BLOC})\\b)[\\s\\S])*)(<\\/\\2\\s*>)`,
  'gi'
);
const CELLA = /^t[dh]$/i;
const MAX_VOLTES = 64;

/* On talla una línia: els blocs, el salt i la ratlla. Un tros de línia és el
   que hi ha entre dos talls, amb les seues etiquetes de línia (<em>, <a>…). */
const TALLS = `${ETIQUETES_DE_BLOC}|br|hr`;
const TROS_DE_LINIA = new RegExp(`(<\\/?(?:${TALLS})\\b[^<>]*>)|((?:(?!<\\/?(?:${TALLS})\\b)[\\s\\S])+)`, 'gi');
const ETIQUETA_BUIDA = new RegExp(
  '<([a-z][a-z0-9-]*)\\b[^<>]*>' + /* ALLOW_RAW_COLOR */ '(?:\\s|&nbsp;|&#160;)*<\\/\\1\\s*>',
  'gi'
);
/* Les etiquetes que, pintades, separen dos paraules (també una imatge). */
const SEPARA = new RegExp(`^<\\/?(?:${TALLS}|img)\\b`, 'i');

/* Els atributs que es lligen (un title, un alt) o se senten (aria-label). */
const ETIQUETA_OBERTA = /<[a-z][^<>]*>/gi;
const ATRIBUT_QUE_ES_LLIG = /\s(?:title|alt|aria-label|aria-description|aria-roledescription|placeholder|label|summary)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/gi;

/* Un tros de text tal com es llig: l'espai dur, un espai; el guionet de
   partició (&shy;), res. */
const comEsLlig = (text) => text.replace(/* ALLOW_RAW_COLOR */ /&nbsp;|&#160;|&#xa0;/gi, ' ').replace(/* ALLOW_RAW_COLOR */ /&shy;|&#173;|&#xad;|­/gi, '');

/* Les dos lectures d'un HTML (vegeu la capçalera) i els seus trossos de text:
   on són a l'HTML (des, fins) i on comencen a cada lectura. Les etiquetes es
   troben com les troba llevaEtiquetes: de «<» al primer «>». */
function lectures(html) {
  const trossos = [];
  let solta = '';
  let junta = '';
  const afig = (des, fins) => {
    if (fins <= des) return;
    const text = comEsLlig(html.slice(des, fins));
    trossos.push({ des, fins, enSolta: solta.length, enJunta: junta.length, llarg: text.length });
    solta += text;
    junta += text;
  };
  let fet = 0;
  let inici = html.indexOf('<');
  while (inici !== -1) {
    const fi = html.indexOf('>', inici + 1);
    if (fi === -1) break;
    afig(fet, inici);
    solta += ' ';
    if (SEPARA.test(html.slice(inici, fi + 1))) junta += ' ';
    fet = fi + 1;
    inici = html.indexOf('<', fet);
  }
  afig(fet, html.length);
  return { trossos, solta, junta };
}

/* Cert si el text que es llig d'un tros d'HTML, en qualsevol de les dos
   lectures, nomena una altra plataforma. */
function nomenaAlText(html) {
  const { solta, junta } = lectures(html);
  return nomenaPlataformaAliena(solta) || nomenaPlataformaAliena(junta);
}

/* 2 · Fora els atributs que es lligen o se senten i en nomenen alguna. */
const netejaAtributs = (html, retirats) => html.replace(ETIQUETA_OBERTA, (etiqueta) => etiqueta.replace(
  ATRIBUT_QUE_ES_LLIG,
  (atribut, doble, simple, solt) => {
    const valor = doble ?? simple ?? solt ?? '';
    if (!nomenaPlataformaAliena(valor)) return atribut;
    retirats.push(valor.trim());
    return '';
  }
));

/* 4b · Un tros de línia sense el seu text: les etiquetes es queden (l'HTML
   continua ben tancat) i les que queden buides se'n van. */
function senseText(tros) {
  let net = tros.replace(/(^|>)[^<]*/g, '$1');
  for (let volta = 0; volta < MAX_VOLTES; volta += 1) {
    const abans = net;
    net = net.replace(ETIQUETA_BUIDA, '');
    if (net === abans) break;
  }
  return net;
}

/* 4c · Els trossos de text que formen una menció, en qualsevol lectura, buits. */
function buidaMencions(html, retirats) {
  const { trossos, solta, junta } = lectures(html);
  const marcats = new Set();
  for (const [lectura, camp] of [[solta, 'enSolta'], [junta, 'enJunta']]) {
    for (const mencio of lectura.matchAll(PLATAFORMA_ALIENA_TOTES)) {
      const des = mencio.index;
      const fins = des + mencio[0].length;
      trossos.forEach((tros, i) => {
        if (tros[camp] < fins && tros[camp] + tros.llarg > des) marcats.add(i);
      });
    }
  }
  if (!marcats.size) return html;
  const ordre = [...marcats].sort((a, b) => a - b);
  for (const i of ordre) retirats.push(textDe(html.slice(trossos[i].des, trossos[i].fins)));
  return ordre.reduceRight((net, i) => net.slice(0, trossos[i].des) + net.slice(trossos[i].fins), html);
}

/**
 * L'HTML d'una pàgina per a l'app nativa: { html, retirats }. `retirats` és
 * el text que la xarxa ha llevat (blocs, cel·les, trossos de línia i de text)
 * i el dels atributs i les imatges que se'n van; els comentaris, els enllaços
 * desfets i les adaptacions no hi compten, perquè no fan perdre res del que es
 * llig. Del que torna, cap lectura (ni cap atribut que es llig) no en nomena
 * cap altra plataforma.
 */
export function adaptaHtml(html) {
  if (typeof html !== 'string' || !html) return { html, retirats: [] };
  const retirats = [];
  let net = html
    .replace(/<!--[\s\S]*?(?:-->|$)/g, '')
    .replace(/<a\b([^<>]*)>([\s\S]*?)<\/a\s*>/gi, (enllac, atributs, dins) => (BOTIGA_ALIENA.test(atributs) ? dins : enllac))
    .replace(/<img\b[^<>]*>/gi, (imatge) => {
      if (!IMATGE_ALIENA.test(imatge)) return imatge;
      retirats.push(/\balt\s*=\s*["']([^"']*)["']/i.exec(imatge)?.[1] || imatge);
      return '';
    });
  net = netejaAtributs(adaptaFrases(net), retirats);
  if (!nomenaAlText(net)) return { html: net, retirats };
  for (let volta = 0; volta < MAX_VOLTES; volta += 1) {
    const abans = net;
    net = net.replace(BLOC_FULLA, (bloc, obri, etiqueta, dins, tanca) => {
      if (!nomenaAlText(dins)) return bloc;
      retirats.push(textDe(dins));
      return CELLA.test(etiqueta) ? `${obri}${tanca}` : '';
    });
    if (net === abans) break;
  }
  net = net.replace(TROS_DE_LINIA, (tros, tall, linia) => {
    if (tall || !nomenaAlText(linia)) return tros;
    retirats.push(textDe(linia));
    return senseText(linia);
  });
  for (let volta = 0; volta < MAX_VOLTES && nomenaAlText(net); volta += 1) {
    const abans = net;
    net = buidaMencions(net, retirats);
    if (net === abans) break;
  }
  if (nomenaAlText(net)) {
    retirats.push(textDe(net));
    return { html: '', retirats };
  }
  return { html: net, retirats };
}

/** L'HTML d'una pàgina per a l'app nativa (vegeu adaptaHtml). Sense HTML, tal qual. */
export function htmlPerAppNativa(html) {
  return adaptaHtml(html).html;
}

/* Les frases d'un text pla. Només talla un punt (o un «!», un «?», uns punts
   suspensius) que va davant d'un espai o al final: «v2.0» i «socdepoble.org»
   no són dos frases. */
const FRASES = /(?:[^.!?…]|[.!?…]+(?=[^\s.!?…]))*(?:[.!?…]+|$)\s*/g;

/**
 * Un text pla (títol, subtítol, entradilla, text alternatiu) per a l'app
 * nativa: les adaptacions declarades i, si encara en nomena alguna, fora la
 * frase sencera; les que es queden, separades per un espai. Sense text, tal
 * qual.
 */
export function textPerAppNativa(text) {
  if (typeof text !== 'string' || !text) return text;
  const adaptat = adaptaFrases(text);
  if (!nomenaPlataformaAliena(adaptat)) return adaptat;
  return (adaptat.match(FRASES) || [])
    .map((frase) => frase.trim())
    .filter((frase) => frase && !nomenaPlataformaAliena(frase))
    .join(' ');
}

/* Els camps de text pla d'una pàgina que pinten TextSection (la capçalera i
   la descripció de useSEO), qui pinte la pàgina de paginaDeRuta, la targeta
   del Mur i la cerca (vegeu la capçalera). */
const CAMPS_DE_TEXT = Object.freeze(['title', 'subtitle', 'lead', 'imageAlt', 'description']);

/**
 * La pàgina (PAGE_COPY o la del contingut core) tal com es pinta dins de
 * l'app nativa (`nativa`, per defecte esAppNativa): l'HTML i els camps de
 * text, adaptats. Si no hi ha res a adaptar, o fora de l'app nativa, el
 * MATEIX objecte.
 */
export function paginaPerAppNativa(page, { nativa = esAppNativa() } = {}) {
  if (!nativa || !page || typeof page !== 'object') return page;
  const canvis = {};
  if (typeof page.html === 'string') {
    const html = htmlPerAppNativa(page.html);
    if (html !== page.html) canvis.html = html;
  }
  for (const camp of CAMPS_DE_TEXT) {
    if (typeof page[camp] !== 'string') continue;
    const text = textPerAppNativa(page[camp]);
    if (text !== page[camp]) canvis[camp] = text;
  }
  return Object.keys(canvis).length ? { ...page, ...canvis } : page;
}
