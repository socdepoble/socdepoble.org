/**
 * transformadorEditorialWpBlogger.js — Motor i Banc de Transformació Editorial
 * per a WordPress REST API, WordPress WXR (.xml) i Blogger Atom (.xml) cap a
 * l'arquitectura Pedra Seca de Sóc de Poble.
 */
import {
  resolRutaInternaSocDePobleNet,
  reescriuEnllacosHtmlSocDePobleNet,
} from '../data/importacio/mapaEnllacosInternsWp.js';
import {
  ARTICLES_SIMULADOR_IA_425,
  PAGINES_WP_18,
} from '../data/taxonomia/tesaurusDoctoralSocDePoble.js';
/* P1-f (Onada R6, Bloc 2) · L'estat de revisió viu a un mòdul lleuger (sense
   tesaurus) perquè el detail del Mur el puga usar sense arrossegar este. */
import {
  CASOS_US_EDITORIALS,
  CLAU_STORAGE_REVISIO_WP,
  DESTINACIONS_WORKSPACE_WP,
  INSIGNIES_CASOS_US_IMPORTACIO,
  WP_IDS_CATALEG_ARBRES_RENTONAR,
  desaDestinacioArticleImportat,
  desaEstatRevisioEditorial,
  desaRevisioArticleImportat,
  desaRevisioArticleImportatAmbServidor,
  destinacioWorkspaceWp,
  esWpIdCatalegArbresRentonar,
  estatInicialArticleImportatWp,
  llegeixEstatRevisioEditorial,
  sincronitzaRevisionsEditorialsWpAmbServidor,
} from './revisioEditorialWp.js';
import {
  AUTORIA_RENTONAR,
  AVATAR_RENTONAR,
  COPYRIGHT_RENTONAR_ARBRES,
  ESTUDI_TECNIC_RENTONAR,
  RUTA_PERFIL_RENTONAR,
  trobaItemCatalegArbresRentonar,
} from '../data/importacio/catalegArbresRentonarWp.js';
import { carregaPaginesTrilogiaIMoliWp, esPaginaTrilogiaIMoliWp, trobaPaginaTrilogiaIMoliWp } from '../data/importacio/paginesTrilogiaIMoliWp.js';
import { transformaPaginaTrilogiaIMoliWp } from '../data/importacio/paginesTrilogiaIMoliEditorial.js';

export {
  CASOS_US_EDITORIALS,
  CLAU_STORAGE_REVISIO_WP,
  DESTINACIONS_WORKSPACE_WP,
  INSIGNIES_CASOS_US_IMPORTACIO,
  WP_IDS_CATALEG_ARBRES_RENTONAR,
  desaDestinacioArticleImportat,
  desaEstatRevisioEditorial,
  desaRevisioArticleImportat,
  desaRevisioArticleImportatAmbServidor,
  esWpIdCatalegArbresRentonar,
  estatInicialArticleImportatWp,
  llegeixEstatRevisioEditorial,
  sincronitzaRevisionsEditorialsWpAmbServidor,
};

/* B3-4 (Onada R6, Bloc 3) · INSIGNIES_CASOS_US_IMPORTACIO i CASOS_US_EDITORIALS
   viuen a revisioEditorialWp.js (el Mur les usa sense el tesaurus); es
   reexporten ací amb els mateixos noms. */

const HOSTS_VIDEO_SEGURS = new Set([
  'youtube.com',
  'www.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'youtu.be',
  'vimeo.com',
  'player.vimeo.com',
]);

export const LIMIT_BYTES_IMPORTACIO_EDITORIAL = 8 * 1024 * 1024;

function textImportable(valor) {
  if (typeof valor !== 'string' || valor.length > LIMIT_BYTES_IMPORTACIO_EDITORIAL
    || new TextEncoder().encode(valor).byteLength > LIMIT_BYTES_IMPORTACIO_EDITORIAL) {
    throw new TypeError('El contingut d’importació supera el límit de 8 MiB.');
  }
  return valor;
}

function atributsEditorials(text) {
  const atributs = Object.create(null);
  let cursor = 0;
  while (cursor < text.length) {
    while (cursor < text.length && /[\s/]/u.test(text[cursor])) cursor += 1;
    const inici = cursor;
    while (cursor < text.length && !/[\s=]/u.test(text[cursor])) cursor += 1;
    const clau = text.slice(inici, cursor).toLowerCase();
    while (cursor < text.length && /\s/u.test(text[cursor])) cursor += 1;
    if (text[cursor] !== '=') continue;
    cursor += 1;
    while (cursor < text.length && /\s/u.test(text[cursor])) cursor += 1;
    const cometa = text[cursor];
    if (cometa !== '"' && cometa !== "'") { cursor += 1; continue; }
    const fi = text.indexOf(cometa, cursor + 1);
    if (fi === -1) break;
    if (!Object.hasOwn(atributs, clau)) atributs[clau] = text.slice(cursor + 1, fi);
    cursor = fi + 1;
  }
  return atributs;
}

/** Recorrut cap avant: un element sense tancament acaba la lectura. */
function tancamentEditorial(text, minuscules, tancament, des) {
  let cursor = des;
  for (;;) {
    const inici = text.indexOf('<', cursor);
    if (inici === -1) return -1;
    if (text.startsWith('<![CDATA[', inici)) {
      const fi = text.indexOf(']]>', inici + 9);
      if (fi === -1) return -1;
      cursor = fi + 3;
    } else if (text.startsWith('<!--', inici)) {
      const fi = text.indexOf('-->', inici + 4);
      if (fi === -1) return -1;
      cursor = fi + 3;
    } else if (minuscules.startsWith(tancament, inici)) return inici;
    else cursor = inici + 1;
  }
}

function* elementsEditorials(text, nom, nomesObertura = false) {
  // Els noms de les etiquetes són ASCII. El contingut conserva els seus índexs Unicode.
  const minuscules = text.replace(/[A-Z]/g, caracter => caracter.toLowerCase());
  const iniciEtiqueta = '<' + nom;
  const tancament = '</' + nom + '>';
  let cursor = 0;
  for (;;) {
    const inici = minuscules.indexOf(iniciEtiqueta, cursor);
    if (inici === -1) return;
    const des = inici + iniciEtiqueta.length;
    if (des < text.length && !/[\s/>]/u.test(text[des])) { cursor = des; continue; }
    let fiObertura = des;
    let cometa = null;
    while (fiObertura < text.length) {
      const caracter = text[fiObertura];
      if (cometa) { if (caracter === cometa) cometa = null; }
      else if (caracter === '"' || caracter === "'") cometa = caracter;
      else if (caracter === '>') break;
      fiObertura += 1;
    }
    if (fiObertura === text.length) return;
    const rawAtributs = text.slice(des, fiObertura);
    const autoconclos = rawAtributs.trimEnd().endsWith('/');
    const fiCos = nomesObertura || autoconclos ? fiObertura + 1 : tancamentEditorial(text, minuscules, tancament, fiObertura + 1);
    if (fiCos === -1) return;
    const fi = nomesObertura || autoconclos ? fiObertura + 1 : fiCos + tancament.length;
    yield { inici, fi, atributs: atributsEditorials(rawAtributs),
      contingut: nomesObertura || autoconclos ? '' : text.slice(fiObertura + 1, fiCos) };
    cursor = fi;
  }
}

function textElementEditorial(contingut) {
  const text = contingut.trim();
  return text.startsWith('<![CDATA[') && text.endsWith(']]>') ? text.slice(9, -3).trim() : text;
}

function primerTextEditorial(text, nom) {
  const primer = elementsEditorials(text, nom).next().value;
  return primer ? textElementEditorial(primer.contingut) : '';
}

function llevaComentarisGutenberg(text) {
  const trossos = [];
  let cursor = 0;
  for (;;) {
    const inici = text.indexOf('<!--', cursor);
    if (inici === -1) break;
    const fi = text.indexOf('-->', inici + 4);
    if (fi === -1) break;
    trossos.push(text.slice(cursor, inici));
    if (!/^\s*\/?wp:/u.test(text.slice(inici + 4, fi))) trossos.push(text.slice(inici, fi + 3));
    cursor = fi + 3;
  }
  trossos.push(text.slice(cursor));
  return trossos.join('');
}

function escapaAtributHtml(valor) {
  return String(valor || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function parsejaUrlExternaSegura(rawUrl) {
  try {
    const parsed = new URL(String(rawUrl || '').trim());
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Transforma un fragment HTML de WordPress o Blogger a HTML net Pedra Seca
 * i detecta tots els casos d'ús editorials presents.
 */
export function transformaHtmlEditorialPedraSeca(rawHtml = '', meta = {}) {
  const htmlOriginal = textImportable(String(rawHtml || ''));
  const casosUs = new Set(Array.isArray(meta.casosUsInicials) ? meta.casosUsInicials : []);

  // 1. Eliminar comentaris de blocs Gutenberg <!-- wp:... --> i <!-- /wp:... -->
  let net = llevaComentarisGutenberg(htmlOriginal);

  // 2. Detectar galeries i múltiples imatges
  const imgMatches = [...elementsEditorials(net, 'img', true)].filter(img => Boolean(img.atributs.src || img.atributs['data-src']));
  if (imgMatches.length >= 2 || /wp-block-gallery|gallery-item/i.test(htmlOriginal)) {
    casosUs.add('galeria_fotos');
  }

  // 3. Detectar vídeos de YouTube / Vimeo
  if (/youtube\.com|youtu\.be|vimeo\.com/i.test(net)) {
    casosUs.add('video_youtube_vimeo');
  }

  // 4. Detectar documents PDF o Google Drive / Docs
  if (/\.pdf(?:["'?#]|$)|drive\.google\.com|docs\.google\.com/i.test(net)) {
    casosUs.add('pdf_drive_docs');
  }

  // 5. Substituir iframes externs insegurs (que no siguen YouTube/Vimeo verificats per hostname) per targeta Pedra Seca
  const trossos = [];
  let cursor = 0;
  for (const iframe of elementsEditorials(net, 'iframe')) {
    trossos.push(net.slice(cursor, iframe.inici));
    const srcUrl = iframe.atributs.src || iframe.atributs['data-src'];
    let substitut = net.slice(iframe.inici, iframe.fi);
    if (!srcUrl) {
      casosUs.add('iframe_extern_substituit');
      substitut = '';
    } else {
      const parsedUrl = parsejaUrlExternaSegura(srcUrl);
      if (!parsedUrl) {
        casosUs.add('iframe_extern_substituit');
        substitut = '';
      } else {
        const hrefSegur = escapaAtributHtml(parsedUrl.href);
        const hostname = parsedUrl.hostname.toLowerCase();
        if (hostname.endsWith('facebook.com') && /\/plugins\/like/i.test(parsedUrl.pathname)) {
          casosUs.add('iframe_extern_substituit');
          substitut = '';
        } else if (HOSTS_VIDEO_SEGURS.has(hostname)) {
          casosUs.add('video_youtube_vimeo');
          substitut = `<div class="sdp-embed-video"><iframe src="${hrefSegur}" title="Vídeo incrustat" loading="lazy" allowFullScreen></iframe></div>`;
        } else {
          casosUs.add('iframe_extern_substituit');
          substitut = `<div class="sdp-targeta-enllac-extern" data-original-iframe="${hrefSegur}"><a href="${hrefSegur}" target="_blank" rel="noopener noreferrer">Obrir contingut extern verificat (${hrefSegur})</a></div>`;
        }
      }
    }
    trossos.push(substitut);
    cursor = iframe.fi;
  }
  trossos.push(net.slice(cursor));
  net = trossos.join('');

  // 6. Reescriure enllaços interns de socdepoble.net i antic Blogger
  const { html: htmlAmbEnllacos, totalReescrits, enllacosReescrits } = reescriuEnllacosHtmlSocDePobleNet(net);
  if (totalReescrits > 0) {
    casosUs.add('enllacos_interns_reescrits');
  }

  if (Array.isArray(meta.poblesDetectats) && meta.poblesDetectats.length > 0) {
    casosUs.add('pobles_etiquetats');
  }

  return {
    htmlNet: htmlAmbEnllacos.trim(),
    casosUsDetectats: [...casosUs],
    totalEnllacosReescrits: totalReescrits,
    enllacosReescrits,
    totalImatges: imgMatches.length,
  };
}

/**
 * Transforma un objecte JSON procedent de la WP REST API (/wp-json/wp/v2/posts o pages).
 */
export function transformaPostWpRestApi(wpItem = {}) {
  const title = typeof wpItem.title === 'object' ? wpItem.title?.rendered || '' : String(wpItem.title || '');
  const contentRaw = typeof wpItem.content === 'object' ? wpItem.content?.rendered || '' : String(wpItem.content || '');
  const slug = String(wpItem.slug || '').trim();
  const link = String(wpItem.link || `https://socdepoble.net/${slug}/`);
  const poblesDetectats = Array.isArray(wpItem.poblesDetectats) ? wpItem.poblesDetectats : [];

  const transformacio = transformaHtmlEditorialPedraSeca(contentRaw, {
    poblesDetectats,
    casosUsInicials: wpItem.casosUsDetectats || [],
  });

  return {
    id: wpItem.id || slug,
    fontOrigen: 'wp-rest-api',
    slug,
    title,
    date: wpItem.date || new Date().toISOString(),
    linkOriginal: link,
    rutaDestiCanonica: resolRutaInternaSocDePobleNet(link) || `/mur/${slug}`,
    htmlNet: transformacio.htmlNet,
    casosUsDetectats: transformacio.casosUsDetectats,
    enllacosReescrits: transformacio.enllacosReescrits,
    poblesDetectats,
    estat_revisio: 'pendent_admin',
    destinacio_workspace: destinacioWorkspaceWp(wpItem.destinacio_workspace, wpItem.type === 'page' ? 'pagina' : 'mur'),
  };
}

/**
 * Parseja i transforma un fitxer XML d'exportació WordPress WXR (<rss><channel><item>...).
 */
export function parsejaWordPressWxrXml(xmlText = '', { destinacio_workspace } = {}) {
  if (typeof xmlText !== 'string') return [];
  textImportable(xmlText);
  const items = [];
  for (const item of elementsEditorials(xmlText, 'item')) {
    const block = item.contingut;
    const extract = tag => primerTextEditorial(block, tag);
    const title = extract('title');
    const link = extract('link');
    const slug = extract('wp:post_name') || link.split('/').filter(Boolean).pop() || 'sense-slug';
    const postType = extract('wp:post_type') || 'post';
    const pubDate = extract('wp:post_date') || extract('pubDate');
    const contentRaw = extract('content:encoded');

    const categories = [];
    const tags = [];
    for (const categoria of elementsEditorials(block, 'category')) {
      const domain = categoria.atributs.domain;
      const val = textElementEditorial(categoria.contingut);
      if (domain === 'category' && val) categories.push(val);
      if (domain === 'post_tag' && val) tags.push(val);
    }

    const transformacio = transformaHtmlEditorialPedraSeca(contentRaw, {
      poblesDetectats: categories.filter((c) => c !== 'Xarxa de Pobles'),
    });

    items.push({
      id: `wxr-${slug}`,
      fontOrigen: 'wordpress-wxr-xml',
      postType,
      slug,
      title,
      date: pubDate,
      linkOriginal: link,
      rutaDestiCanonica: resolRutaInternaSocDePobleNet(link) || (postType === 'page' ? `/page/${slug}` : `/mur/${slug}`),
      poblesDetectats: categories.filter((c) => c !== 'Xarxa de Pobles'),
      etiquetes: tags,
      htmlNet: transformacio.htmlNet,
      casosUsDetectats: transformacio.casosUsDetectats,
      enllacosReescrits: transformacio.enllacosReescrits,
      estat_revisio: 'pendent_admin',
      destinacio_workspace: destinacioWorkspaceWp(destinacio_workspace, postType === 'page' ? 'pagina' : 'mur'),
    });
  }
  return items;
}

/**
 * Parseja i transforma un fitxer XML Atom d'exportació de Blogger (<feed><entry>...).
 */
export function parsejaBloggerAtomXml(xmlText = '', { destinacio_workspace } = {}) {
  if (typeof xmlText !== 'string') return [];
  textImportable(xmlText);
  const entries = [];
  for (const entry of elementsEditorials(xmlText, 'entry')) {
    const block = entry.contingut;
    const categories = [...elementsEditorials(block, 'category', true)];
    // Ignorar entrades de configuració o plantilla de Blogger si no són post/page
    if (categories.some(({ atributs }) => atributs.scheme === 'http://schemas.google.com/g/2005#kind'
      && ['settings', 'template', 'comment'].includes((atributs.term || '').split('#').at(-1)))) {
      continue;
    }
    const extract = tag => primerTextEditorial(block, tag);
    const title = extract('title');
    const published = extract('published') || extract('updated');
    const contentRaw = extract('content')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&');

    const altLink = [...elementsEditorials(block, 'link', true)].find(link => link.atributs.rel === 'alternate');
    const linkOriginal = altLink?.atributs.href || '';
    const rawSlug = linkOriginal
      ? linkOriginal.split('/').filter(Boolean).pop()?.replace(/\.html$/i, '')
      : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const slug = rawSlug || 'blogger-entry';

    const labels = [];
    for (const { atributs } of categories) {
      const term = atributs.term;
      if (term && !term.startsWith('http://')) labels.push(term);
    }

    const transformacio = transformaHtmlEditorialPedraSeca(contentRaw, {
      poblesDetectats: [],
    });

    entries.push({
      id: `blogger-${slug}`,
      fontOrigen: 'blogger-atom-xml',
      slug,
      title,
      date: published,
      linkOriginal,
      rutaDestiCanonica: `/mur/${slug}`,
      etiquetes: labels,
      htmlNet: transformacio.htmlNet,
      casosUsDetectats: transformacio.casosUsDetectats,
      enllacosReescrits: transformacio.enllacosReescrits,
      estat_revisio: 'pendent_admin',
      destinacio_workspace: destinacioWorkspaceWp(destinacio_workspace),
    });
  }
  return entries;
}

export function obteInventariImportacioComplet() {
  return {
    articles: ARTICLES_SIMULADOR_IA_425,
    pagines: PAGINES_WP_18,
  };
}

/** La publicació és una referència al WP id; el cos continua en el corpus. */
export function fontReferenciaArticleImportat(article) {
  const id = typeof article?.wp_id === 'number' && Number.isSafeInteger(article.wp_id) ? String(article.wp_id) : '';
  if (!/^[1-9][0-9]{0,9}$/.test(id) || typeof article.title !== 'string') {
    throw new TypeError('El registre importat no és vàlid.');
  }
  return { font: 'importacio-wp', id, title: article.title,
    subtitle: `socdepoble.net · WP #${id}`, lead: typeof article.date === 'string' ? article.date : '' };
}

function enriqueixEntradaImportada(art, { estats, anotacions, destinacions = {}, esPagina = false }) {
  const wpId = art.id;
  const itemRentonar = trobaItemCatalegArbresRentonar(wpId) || trobaItemCatalegArbresRentonar(art.slug);
  const estatPerDefecte = estatInicialArticleImportatWp(wpId, art.estat_revisio);
  const estat = estats[wpId] || estats[String(wpId)] || estatPerDefecte;
  const nota = anotacions[wpId] ?? anotacions[String(wpId)] ?? '';
  const casosUs = art.casosUsDetectats || [];
  const casosUsMeta = casosUs
    .map((id) => INSIGNIES_CASOS_US_IMPORTACIO[id])
    .filter(Boolean)
    .map((c) => ({ id: c.id, icona: c.icona, titol: c.etiqueta, descripcio: c.descripcio }));
  const rutaCanonica = itemRentonar
    ? itemRentonar.rutaCanonica
    : art.slug === 'aplec-pel-territori-2023'
      ? '/events/aplec-2023'
      : (art.rutaDestiCanonica || (esPagina ? `/page/${art.slug}` : `/mur/${art.slug}`));
  const destinacioDefecte = itemRentonar || wpId === 619
    ? 'arbres-monumentals'
    : (esPagina ? 'pagina' : 'mur');
  return {
    ...art,
    wp_id: wpId,
    tipus_wp: esPagina ? 'page' : 'post',
    author: itemRentonar ? AUTORIA_RENTONAR : (art.author || 'Sóc de Poble'),
    author_href: itemRentonar ? RUTA_PERFIL_RENTONAR : null,
    author_avatar: itemRentonar ? AVATAR_RENTONAR : null,
    estudi_tecnic: itemRentonar ? ESTUDI_TECNIC_RENTONAR : null,
    copyright: itemRentonar ? COPYRIGHT_RENTONAR_ARBRES : null,
    serie_patrimoni: itemRentonar ? 'arbres-emblematics' : null,
    verticalProposada: itemRentonar ? itemRentonar.desti : (art.verticalProposada || (esPagina ? 'page' : 'mur')),
    geolocalitzacio: itemRentonar
      ? { lat: itemRentonar.lat, lng: itemRentonar.lng, precisio: 'exacta', precisio_m: 10, origen: 'exif' }
      : (art.geolocalitzacio || null),
    ruta_canonica: rutaCanonica,
    source_url: art.link || `https://socdepoble.net/${art.slug}/`,
    pobles_etiquetats: art.poblesDetectats || (itemRentonar ? ['la-torre-de-les-macanes'] : []),
    etiquetes_netes: art.etiquetesNetes || [],
    casos_us: casosUs,
    casos_us_meta: casosUsMeta,
    categoria_tematica: itemRentonar
      ? 'Medi Natural i Arbres Emblemàtics'
      : (art.categoriaTematicaProposadaLabel || ''),
    estat_revisio: estat,
    nota_revisio: nota,
    destinacio_workspace: destinacioWorkspaceWp(destinacions[wpId] ?? destinacions[String(wpId)], destinacioDefecte),
  };
}

export function lligArticlesImportatsAmbRevisio(storage) {
  const { estats, anotacions, destinacions } = llegeixEstatRevisioEditorial(storage);
  return ARTICLES_SIMULADOR_IA_425.map((art) => enriqueixEntradaImportada(art, { estats, anotacions, destinacions, esPagina: false }));
}

export function lligPaginesImportadesAmbRevisio(storage) {
  const { estats, anotacions, destinacions } = llegeixEstatRevisioEditorial(storage);
  return PAGINES_WP_18.map((pag) => enriqueixEntradaImportada(pag, { estats, anotacions, destinacions, esPagina: true }));
}

export function lligCorpusImportatCompletAmbRevisio(storage) {
  return [
    ...lligArticlesImportatsAmbRevisio(storage),
    ...lligPaginesImportadesAmbRevisio(storage),
  ];
}

export function trobaArticleImportatComAPublicacio(itemId, storage, { revisioPrivada = false } = {}) {
  if (itemId == null || itemId === '') return null;
  const clau = String(itemId).trim();
  // These full pages are quarantined review drafts: only the private review
  // asks for the body. Without revisioPrivada the lookup keeps falling to the
  // metadata-only summary card (the one /mur has always shown), so loading the
  // admin preview never exposes the body and /mur/<id> does not turn into a 404.
  if (revisioPrivada && esPaginaTrilogiaIMoliWp(clau)) {
    const pagina = trobaPaginaTrilogiaIMoliWp(clau);
    return pagina ? transformaPaginaTrilogiaIMoliWp(pagina) : null;
  }
  const articles = lligCorpusImportatCompletAmbRevisio(storage);
  const art = articles.find((a) => String(a.slug) === clau || String(a.wp_id) === clau || String(a.id) === clau);
  if (!art) return null;
  const esRentonar = Boolean(art.estudi_tecnic);
  const poblePrincipal = art.poblePrincipal || art.pobles_etiquetats[0] || 'La Torre de les Maçanes';
  const titolSegur = escapaAtributHtml(art.title);
  const urlSegura = escapaAtributHtml(art.source_url);
  const rutaCanonicaSegura = escapaAtributHtml(art.ruta_canonica);
  const resumHtml = art.htmlNet
    || (esRentonar
      ? `<p>Fitxa patrimonial del <strong>Catàleg d’Arbres Emblemàtics i Monumentals de La Torre de les Maçanes</strong> (WP #${escapaAtributHtml(art.wp_id)}), custodiada per l’<strong>${escapaAtributHtml(AUTORIA_RENTONAR)}</strong> amb estudi tècnic i fotografies base de <strong>${escapaAtributHtml(ESTUDI_TECNIC_RENTONAR)}</strong> (maig 2007).</p><p><a href="${rutaCanonicaSegura}">Obrir la fitxa canònica a Natura i Patrimoni Viu (${titolSegur})</a> · <a href="${urlSegura}" target="_blank" rel="noopener noreferrer">Consultar la publicació històrica a socdepoble.net</a></p>`
      : `<p>Article del fons documental de <strong>Sóc de Poble</strong> (WP #${escapaAtributHtml(art.wp_id)}) catalogat en <strong>${escapaAtributHtml(art.categoria_tematica || 'Memòria i Territori')}</strong> per a <strong>${escapaAtributHtml(poblePrincipal)}</strong>.</p><p><a href="${urlSegura}" target="_blank" rel="noopener noreferrer">Consultar l'entrada original a socdepoble.net (${titolSegur})</a></p>`);
  return {
    id: art.slug,
    slug: art.slug,
    wp_id: art.wp_id,
    title: art.title,
    post_subtitle: esRentonar
      ? `${AUTORIA_RENTONAR} · Estudi tècnic: ${ESTUDI_TECNIC_RENTONAR} · Patrimoni arbori de ${poblePrincipal}`
      : art.categoria_tematica
        ? `${art.categoria_tematica} · Previsualització d'importació editorial de socdepoble.net`
        : "Previsualització d'importació editorial de socdepoble.net",
    author: art.author || 'Sóc de Poble',
    author_name: art.author || 'Sóc de Poble',
    ...(art.author_href ? { author_href: art.author_href } : {}),
    ...(art.author_avatar ? { author_avatar: art.author_avatar } : {}),
    ...(art.estudi_tecnic ? { estudi_tecnic: art.estudi_tecnic } : {}),
    ...(art.copyright ? { copyright: art.copyright } : {}),
    ...(art.geolocalitzacio ? { geolocalitzacio: art.geolocalitzacio } : {}),
    town_name: poblePrincipal,
    created_at: art.date || '2024-01-01',
    tags: art.etiquetes_netes || [],
    pobles_etiquetats: art.pobles_etiquetats || [],
    source_url: art.source_url,
    ruta_canonica: art.ruta_canonica,
    casos_us_meta: art.casos_us_meta || [],
    categoria_tematica: art.categoria_tematica || '',
    vertical_proposada: art.verticalProposada || 'mur',
    estat_revisio: art.estat_revisio || 'pendent_admin',
    nota_revisio: art.nota_revisio || '',
    destinacio_workspace: art.destinacio_workspace,
    num_imatges: art.numImatges || 0,
    num_videos: art.numVideos || 0,
    num_iframes: art.numIframes || 0,
    num_pdfs: art.numPdfs || 0,
    esImportatWp: true,
    content: resumHtml,
  };
}

export async function carregaPaginaImportadaPerRevisio(itemId, { signal } = {}) {
  if (!esPaginaTrilogiaIMoliWp(itemId)) return null;
  await carregaPaginesTrilogiaIMoliWp({ signal });
  return trobaArticleImportatComAPublicacio(itemId, null, { revisioPrivada: true });
}

export function estadistiquesRevisioImportacio(storage) {
  const articles = lligArticlesImportatsAmbRevisio(storage);
  const pagines = lligPaginesImportadesAmbRevisio(storage);
  let pendents = 0;
  let aprovats = 0;
  let ambObservacions = 0;
  const perCasUs = {};
  for (const cas of Object.values(INSIGNIES_CASOS_US_IMPORTACIO)) {
    perCasUs[cas.id] = 0;
  }
  for (const a of articles) {
    if (a.estat_revisio === 'aprovat') aprovats += 1;
    else if (a.estat_revisio === 'amb_observacions') ambObservacions += 1;
    else pendents += 1;
    for (const c of a.casos_us) {
      perCasUs[c] = (perCasUs[c] || 0) + 1;
    }
  }
  let pendentsPagines = 0;
  let aprovatsPagines = 0;
  let ambObservacionsPagines = 0;
  for (const p of pagines) {
    if (p.estat_revisio === 'aprovat') aprovatsPagines += 1;
    else if (p.estat_revisio === 'amb_observacions') ambObservacionsPagines += 1;
    else pendentsPagines += 1;
  }
  return {
    total: articles.length,
    pendents,
    pendent_admin: pendents,
    aprovats,
    aprovat: aprovats,
    ambObservacions,
    amb_observacions: ambObservacions,
    perCasUs,
    totalPagines: pagines.length,
    totalCorpus443: articles.length + pagines.length,
    aprovatsCorpus443: aprovats + aprovatsPagines,
    pendentsCorpus443: pendents + pendentsPagines,
    ambObservacionsCorpus443: ambObservacions + ambObservacionsPagines,
  };
}

