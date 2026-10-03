/**
 * Lector de notícies · l'analitzador de feeds (nucli pur).
 *
 *   analitzaFeed(text, { fontId, base }) → { font, articles, errors }
 *     font      { titol, enllac, descripcio, imatge } (o null si no és un feed)
 *     articles  [{ id, fontId, titol, enllac, data, autor, resum, contingutHtml,
 *                 mitjansOmesos, imatge }], en l'ordre del document
 *     errors    el que s'ha recuperat o per què no s'ha pogut llegir
 * Mai no llança: un text que no és un feed torna font null i cap article.
 *
 * Formats: RSS 2.0 (i 0.9x), Atom 1.0 (títols i continguts text, html i
 * xhtml) i RSS 1.0 (RDF). Extensions: content:encoded, dc:creator, dc:date i
 * Media RSS (media:content, media:thumbnail, media:group).
 *
 *   id       idArticle(fontId, guid | id d'Atom | rdf:about | enllaç | títol+data)
 *   enllac   absolut i web; les relatives, contra `base` o l'enllaç del feed
 *   data     ISO UTC (dates.js) o null
 *   autor    el nom; mai un correu («correu (Nom)» → «Nom»)
 *   resum    text pla de 200 a 280 caràcters (model.js · resumDeText)
 *   contingutHtml  l'HTML per la llista blanca (html.js); mitjansOmesos,
 *            quantes imatges o vídeos s'hi han llevat
 *   imatge   media:content d'imatge › media:thumbnail › enclosure d'imatge ›
 *            l'enllaç enclosure d'Atom › la primera <img> del contingut
 */
import { plega } from './entitats.js';
import { llegixData } from './dates.js';
import { arbreDeText, htmlDeArbre, sanejaHtml } from './html.js';
import { idArticle } from './ids.js';
import { LIMITS_MODEL, resumDeText, textCurt } from './model.js';
import { urlAbsoluta } from './urls.js';
import { NS, atributDe, fillDe, fillsDe, llegixXml, textDe } from './xml.js';

export const MAX_ARTICLES = 200;

const ESTENSIO_IMATGE = /\.(?:jpe?g|png|gif|webp|avif)(?:[?#]|$)/i;
const esTipusImatge = (tipus) => /^image\//i.test(tipus || '');

/* Un text que pot portar HTML (un títol RSS amb entitats, un resum) en text pla. */
const textPla = (valor) => plega(sanejaHtml(String(valor ?? '')).text);

/* «correu (Nom)» → «Nom»; un correu sol no és un nom i no es mostra. */
function nomDAutor(valor) {
  const net = plega(valor);
  if (!net) return null;
  const parentesi = net.match(/\(([^()]+)\)\s*$/);
  const nom = textCurt(parentesi ? parentesi[1] : net, LIMITS_MODEL.autor);
  return nom && !nom.includes('@') ? nom : null;
}

/* La imatge d'un element d'un feed (veure la capçalera), o null. */
function imatgeDe(element, base, imatgesDelContingut) {
  const grups = fillsDe(element, 'group', NS.media);
  const continguts = [element, ...grups].flatMap((pare) => fillsDe(pare, 'content', NS.media));
  const candidates = [
    ...continguts.filter((c) => {
      const medi = atributDe(c, 'medium');
      const tipus = atributDe(c, 'type');
      return medi === 'image' || esTipusImatge(tipus) || (!medi && !tipus && ESTENSIO_IMATGE.test(atributDe(c, 'url') || ''));
    }).map((c) => atributDe(c, 'url')),
    ...[element, ...grups].flatMap((pare) => fillsDe(pare, 'thumbnail', NS.media)).map((t) => atributDe(t, 'url')),
    ...fillsDe(element, 'enclosure').filter((e) => esTipusImatge(atributDe(e, 'type'))).map((e) => atributDe(e, 'url')),
    ...fillsDe(element, 'link', NS.atom).filter((l) => atributDe(l, 'rel') === 'enclosure' && esTipusImatge(atributDe(l, 'type')))
      .map((l) => atributDe(l, 'href')),
    ...imatgesDelContingut
  ];
  for (const candidata of candidates) {
    const url = urlAbsoluta(candidata ?? '', base);
    if (url) return url;
  }
  return null;
}

/* Un article a partir de les parts ja trobades. `resumText`: el text pla del
   resum del feed (description, summary) o null, i llavors ix del contingut. */
function article({ fontId, clau, titol, enllac, data, autor, contingut, resumText, imatge }) {
  const titolNet = textCurt(titol, LIMITS_MODEL.titol);
  if (!titolNet) return null;
  const resum = resumDeText(resumText || contingut.text);
  return {
    id: idArticle(fontId, clau || enllac || `${titolNet}|${data || ''}`),
    fontId,
    titol: titolNet,
    enllac,
    data,
    autor,
    resum,
    contingutHtml: contingut.html,
    mitjansOmesos: contingut.omesos,
    imatge
  };
}

/* ── RSS 2.0 i 0.9x ─────────────────────────────────────────────────────── */

function rss2(arrel, { fontId, base }) {
  const canal = fillDe(arrel, 'channel');
  if (!canal) return { font: null, articles: [], errors: ['RSS sense <channel>'] };
  const enllacFeed = urlAbsoluta(textDe(fillDe(canal, 'link')).trim(), base) || urlAbsoluta(base);
  const font = {
    titol: textCurt(textPla(textDe(fillDe(canal, 'title'))), LIMITS_MODEL.nom),
    enllac: enllacFeed,
    descripcio: textCurt(textPla(textDe(fillDe(canal, 'description'))), LIMITS_MODEL.descripcio),
    imatge: urlAbsoluta(textDe(fillDe(fillDe(canal, 'image'), 'url')).trim(), enllacFeed)
  };
  const elements = [...fillsDe(canal, 'item'), ...fillsDe(arrel, 'item')];
  const articles = elements.slice(0, MAX_ARTICLES).map((item) => {
    const guidNode = fillDe(item, 'guid');
    const guid = plega(textDe(guidNode));
    const permanent = guidNode && atributDe(guidNode, 'isPermaLink') !== 'false';
    const enllac = urlAbsoluta(plega(textDe(fillDe(item, 'link'))), enllacFeed)
      || (permanent ? urlAbsoluta(guid, enllacFeed) : null);
    const codificat = fillDe(item, 'encoded', NS.content);
    const descripcio = fillDe(item, 'description');
    const contingut = sanejaHtml(textDe(codificat || descripcio), { base: enllac || enllacFeed });
    return article({
      fontId,
      clau: guid,
      titol: textPla(textDe(fillDe(item, 'title'))),
      enllac,
      data: llegixData(textDe(fillDe(item, 'pubDate'))) || llegixData(textDe(fillDe(item, 'date', NS.dc))),
      autor: nomDAutor(textDe(fillDe(item, 'creator', NS.dc))) || nomDAutor(textDe(fillDe(item, 'author'))),
      contingut,
      resumText: descripcio ? textPla(textDe(descripcio)) : null,
      imatge: imatgeDe(item, enllac || enllacFeed, contingut.imatges)
    });
  });
  return { font, articles, errors: [] };
}

/* ── Atom 1.0 ───────────────────────────────────────────────────────────── */

/* Un element de text d'Atom (title, summary, content) com a { html, text, omesos, imatges }. */
function textAtom(node, base) {
  if (!node) return { html: '', text: '', omesos: 0, imatges: [] };
  const tipus = (atributDe(node, 'type') || 'text').toLowerCase();
  if (tipus === 'xhtml') return sanejaHtml(node.fills, { base });
  if (tipus === 'html' || tipus === 'text/html') return sanejaHtml(textDe(node), { base });
  const arbre = arbreDeText(textDe(node));
  return { html: htmlDeArbre(arbre), text: arbre.map((p) => p.c.join('')).join('\n'), omesos: 0, imatges: [] };
}

/* L'enllaç «alternate» (o sense rel), millor si és text/html. */
function enllacAtom(element, base) {
  const enllacos = fillsDe(element, 'link', NS.atom)
    .filter((l) => ['alternate', null].includes(atributDe(l, 'rel')));
  const html = enllacos.find((l) => /html/i.test(atributDe(l, 'type') || 'text/html'));
  return urlAbsoluta(atributDe(html || enllacos[0], 'href') || '', base);
}

function atom(arrel, { fontId, base }) {
  const enllacFeed = enllacAtom(arrel, base) || urlAbsoluta(base);
  const font = {
    titol: textCurt(textAtom(fillDe(arrel, 'title', NS.atom), enllacFeed).text, LIMITS_MODEL.nom),
    enllac: enllacFeed,
    descripcio: textCurt(textAtom(fillDe(arrel, 'subtitle', NS.atom), enllacFeed).text, LIMITS_MODEL.descripcio),
    imatge: urlAbsoluta(plega(textDe(fillDe(arrel, 'logo', NS.atom) || fillDe(arrel, 'icon', NS.atom))), enllacFeed)
  };
  const articles = fillsDe(arrel, 'entry', NS.atom).slice(0, MAX_ARTICLES).map((entrada) => {
    const enllac = enllacAtom(entrada, enllacFeed);
    const baseEntrada = enllac || enllacFeed;
    const contingutNode = fillDe(entrada, 'content', NS.atom);
    const sumari = fillDe(entrada, 'summary', NS.atom);
    /* Un content amb src apunta fora: no porta text, i val el resum. */
    const contingut = textAtom(contingutNode && !atributDe(contingutNode, 'src') ? contingutNode : sumari, baseEntrada);
    const autor = fillDe(fillDe(entrada, 'author', NS.atom) || fillDe(arrel, 'author', NS.atom), 'name', NS.atom);
    return article({
      fontId,
      clau: plega(textDe(fillDe(entrada, 'id', NS.atom))),
      titol: textAtom(fillDe(entrada, 'title', NS.atom), baseEntrada).text,
      enllac,
      data: llegixData(textDe(fillDe(entrada, 'published', NS.atom))) || llegixData(textDe(fillDe(entrada, 'updated', NS.atom))),
      autor: nomDAutor(textDe(autor)),
      contingut,
      resumText: sumari ? textAtom(sumari, baseEntrada).text : null,
      imatge: imatgeDe(entrada, baseEntrada, contingut.imatges)
    });
  });
  return { font, articles, errors: [] };
}

/* ── RSS 1.0 (RDF) ──────────────────────────────────────────────────────── */

function rss1(arrel, { fontId, base }) {
  const canal = fillDe(arrel, 'channel', NS.rss1);
  const enllacFeed = urlAbsoluta(plega(textDe(fillDe(canal, 'link', NS.rss1))), base) || urlAbsoluta(base);
  const font = {
    titol: textCurt(textPla(textDe(fillDe(canal, 'title', NS.rss1))), LIMITS_MODEL.nom),
    enllac: enllacFeed,
    descripcio: textCurt(textPla(textDe(fillDe(canal, 'description', NS.rss1))), LIMITS_MODEL.descripcio),
    imatge: urlAbsoluta(plega(textDe(fillDe(fillDe(arrel, 'image', NS.rss1), 'url', NS.rss1))), enllacFeed)
  };
  const articles = fillsDe(arrel, 'item', NS.rss1).slice(0, MAX_ARTICLES).map((item) => {
    const enllac = urlAbsoluta(plega(textDe(fillDe(item, 'link', NS.rss1))), enllacFeed);
    const descripcio = fillDe(item, 'description', NS.rss1);
    const codificat = fillDe(item, 'encoded', NS.content);
    const contingut = sanejaHtml(textDe(codificat || descripcio), { base: enllac || enllacFeed });
    return article({
      fontId,
      clau: atributDe(item, 'rdf:about'),
      titol: textPla(textDe(fillDe(item, 'title', NS.rss1))),
      enllac,
      data: llegixData(textDe(fillDe(item, 'date', NS.dc))),
      autor: nomDAutor(textDe(fillDe(item, 'creator', NS.dc))),
      contingut,
      resumText: descripcio ? textPla(textDe(descripcio)) : null,
      imatge: imatgeDe(item, enllac || enllacFeed, contingut.imatges)
    });
  });
  return { font, articles, errors: canal ? [] : ['RSS 1.0 sense <channel>'] };
}

/**
 * Analitza un feed RSS o Atom a partir del seu TEXT.
 * `fontId`: el prefix dels ids (l'id de la font a l'app). `base`: l'adreça del
 * feed, per a resoldre les relatives quan el feed no en diu cap.
 */
export function analitzaFeed(text, { fontId = 'a', base = null } = {}) {
  const { arrel, errors } = llegixXml(text);
  if (!arrel) return { font: null, articles: [], errors };
  const opcions = { fontId, base };
  let resultat;
  if (arrel.local === 'rss') {
    resultat = rss2(arrel, opcions);
  } else if (arrel.local === 'feed' && (arrel.ns === NS.atom || arrel.ns === NS.cap)) {
    resultat = atom(arrel.ns === NS.atom ? arrel : ambEspai(arrel, NS.atom), opcions);
  } else if (arrel.local === 'RDF') {
    resultat = rss1(arrel, opcions);
  } else {
    return { font: null, articles: [], errors: [...errors, `format desconegut: «${arrel.nom}»`] };
  }
  /* Un mateix id dues vegades (un guid repetit): es queda el primer. */
  const vistos = new Set();
  const articles = resultat.articles.filter((a) => a && !vistos.has(a.id) && vistos.add(a.id));
  return { font: resultat.font, articles, errors: [...errors, ...resultat.errors] };
}

/* Un Atom sense xmlns (passa): es llig com si en duguera. */
function ambEspai(node, ns) {
  if (typeof node === 'string') return node;
  return { ...node, ns: node.ns === NS.cap ? ns : node.ns, fills: node.fills.map((fill) => ambEspai(fill, ns)) };
}
