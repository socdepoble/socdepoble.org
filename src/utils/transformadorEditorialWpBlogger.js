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
import { INSIGNIES_CASOS_US_IMPORTACIO, llegeixEstatRevisioEditorial } from './revisioEditorialWp.js';

export {
  CASOS_US_EDITORIALS,
  CLAU_STORAGE_REVISIO_WP,
  INSIGNIES_CASOS_US_IMPORTACIO,
  desaEstatRevisioEditorial,
  desaRevisioArticleImportat,
  llegeixEstatRevisioEditorial,
} from './revisioEditorialWp.js';

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
  const htmlOriginal = String(rawHtml || '');
  const casosUs = new Set(Array.isArray(meta.casosUsInicials) ? meta.casosUsInicials : []);

  // 1. Eliminar comentaris de blocs Gutenberg <!-- wp:... --> i <!-- /wp:... -->
  let net = htmlOriginal.replace(/<!--\s*\/?wp:[\s\S]*?-->/g, '');

  // 2. Detectar galeries i múltiples imatges
  const imgMatches = [...net.matchAll(/<img\b[^>]*src=(["'])([^"']+)\1[^>]*>/gi)];
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
  net = net.replace(
    /<iframe\b[^>]*src=(["'])([^"']+)\1[^>]*>[\s\S]*?<\/iframe>/gi,
    (_fullIframe, _q, srcUrl) => {
      const parsedUrl = parsejaUrlExternaSegura(srcUrl);
      if (!parsedUrl) {
        casosUs.add('iframe_extern_substituit');
        return '';
      }
      const hrefSegur = escapaAtributHtml(parsedUrl.href);
      const hostname = parsedUrl.hostname.toLowerCase();
      if (HOSTS_VIDEO_SEGURS.has(hostname)) {
        casosUs.add('video_youtube_vimeo');
        return `<div class="sdp-embed-video"><iframe src="${hrefSegur}" title="Vídeo incrustat" loading="lazy" allowFullScreen></iframe></div>`;
      }
      casosUs.add('iframe_extern_substituit');
      return `<div class="sdp-targeta-enllac-extern" data-original-iframe="${hrefSegur}"><a href="${hrefSegur}" target="_blank" rel="noopener noreferrer">Obrir contingut extern verificat (${hrefSegur})</a></div>`;
    }
  );

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
  };
}

/**
 * Parseja i transforma un fitxer XML d'exportació WordPress WXR (<rss><channel><item>...).
 */
export function parsejaWordPressWxrXml(xmlText = '') {
  if (typeof xmlText !== 'string' || !xmlText.includes('<item>')) return [];
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  for (const match of xmlText.matchAll(itemRegex)) {
    const block = match[1];
    const extract = (tag) => {
      const m = new RegExp(`<${tag}>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))<\\/${tag}>`, 'i').exec(block);
      return (m?.[1] ?? m?.[2] ?? '').trim();
    };
    const title = extract('title');
    const link = extract('link');
    const slug = extract('wp:post_name') || link.split('/').filter(Boolean).pop() || 'sense-slug';
    const postType = extract('wp:post_type') || 'post';
    const pubDate = extract('wp:post_date') || extract('pubDate');
    const contentRaw = extract('content:encoded');

    const categories = [];
    const tags = [];
    for (const catMatch of block.matchAll(/<category\s+domain=(["'])([^"']+)\1[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/category>/gi)) {
      const domain = catMatch[2];
      const val = (catMatch[3] ?? catMatch[4] ?? '').trim();
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
    });
  }
  return items;
}

/**
 * Parseja i transforma un fitxer XML Atom d'exportació de Blogger (<feed><entry>...).
 */
export function parsejaBloggerAtomXml(xmlText = '') {
  if (typeof xmlText !== 'string' || !xmlText.includes('<entry>')) return [];
  const entries = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
  for (const match of xmlText.matchAll(entryRegex)) {
    const block = match[1];
    // Ignorar entrades de configuració o plantilla de Blogger si no són post/page
    if (/scheme=["']http:\/\/schemas\.google\.com\/g\/2005#kind["'][^>]*term=["'][^"']*#(?:settings|template|comment)["']/i.test(block)) {
      continue;
    }
    const extract = (tag) => {
      const m = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))<\\/${tag}>`, 'i').exec(block);
      return (m?.[1] ?? m?.[2] ?? '').trim();
    };
    const title = extract('title');
    const published = extract('published') || extract('updated');
    const contentRaw = extract('content')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&');

    const altLinkMatch = /<link\b[^>]*rel=(["'])alternate\1[^>]*href=(["'])([^"']+)\2/i.exec(block);
    const linkOriginal = altLinkMatch ? altLinkMatch[3] : '';
    const rawSlug = linkOriginal
      ? linkOriginal.split('/').filter(Boolean).pop()?.replace(/\.html$/i, '')
      : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const slug = rawSlug || 'blogger-entry';

    const labels = [];
    for (const catMatch of block.matchAll(/<category\b[^>]*term=(["'])([^"']+)\1/gi)) {
      const term = catMatch[2];
      if (!term.startsWith('http://')) labels.push(term);
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

export function lligArticlesImportatsAmbRevisio(storage) {
  const { estats, anotacions } = llegeixEstatRevisioEditorial(storage);
  return ARTICLES_SIMULADOR_IA_425.map((art) => {
    const wpId = art.id;
    const estat = estats[wpId] || art.estat_revisio || 'pendent_admin';
    const nota = anotacions[wpId] || '';
    const casosUs = art.casosUsDetectats || [];
    const casosUsMeta = casosUs
      .map((id) => INSIGNIES_CASOS_US_IMPORTACIO[id])
      .filter(Boolean)
      .map((c) => ({ id: c.id, icona: c.icona, titol: c.etiqueta, descripcio: c.descripcio }));
    const rutaCanonica = art.slug === 'aplec-pel-territori-2023'
      ? '/events/aplec-2023'
      : (art.rutaDestiCanonica || `/mur/${art.slug}`);
    return {
      ...art,
      wp_id: wpId,
      ruta_canonica: rutaCanonica,
      source_url: art.link || `https://socdepoble.net/${art.slug}/`,
      pobles_etiquetats: art.poblesDetectats || [],
      etiquetes_netes: art.etiquetesNetes || [],
      casos_us: casosUs,
      casos_us_meta: casosUsMeta,
      categoria_tematica: art.categoriaTematicaProposadaLabel || '',
      estat_revisio: estat,
      nota_revisio: nota,
    };
  });
}

export function trobaArticleImportatComAPublicacio(itemId, storage) {
  if (itemId == null || itemId === '') return null;
  const clau = String(itemId).trim();
  const articles = lligArticlesImportatsAmbRevisio(storage);
  const art = articles.find((a) => String(a.slug) === clau || String(a.wp_id) === clau || String(a.id) === clau);
  if (!art) return null;
  const poblePrincipal = art.poblePrincipal || art.pobles_etiquetats[0] || 'La Torre de les Maçanes';
  const titolSegur = escapaAtributHtml(art.title);
  const urlSegura = escapaAtributHtml(art.source_url);
  const resumHtml = art.htmlNet
    || `<p>Article del fons documental de <strong>Sóc de Poble</strong> (WP #${escapaAtributHtml(art.wp_id)}) catalogat en <strong>${escapaAtributHtml(art.categoria_tematica || 'Memòria i Territori')}</strong> per a <strong>${escapaAtributHtml(poblePrincipal)}</strong>.</p><p><a href="${urlSegura}" target="_blank" rel="noopener noreferrer">Consultar l'entrada original a socdepoble.net (${titolSegur})</a></p>`;
  return {
    id: art.slug,
    slug: art.slug,
    wp_id: art.wp_id,
    title: art.title,
    post_subtitle: art.categoria_tematica
      ? `${art.categoria_tematica} · Previsualització d'importació editorial de socdepoble.net`
      : "Previsualització d'importació editorial de socdepoble.net",
    author: 'Sóc de Poble',
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
    num_imatges: art.numImatges || 0,
    num_videos: art.numVideos || 0,
    num_iframes: art.numIframes || 0,
    num_pdfs: art.numPdfs || 0,
    esImportatWp: true,
    content: resumHtml,
  };
}

export function estadistiquesRevisioImportacio(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  const articles = lligArticlesImportatsAmbRevisio(storage);
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
  return {
    total: articles.length,
    pendents,
    pendent_admin: pendents,
    aprovats,
    aprovat: aprovats,
    ambObservacions,
    amb_observacions: ambObservacions,
    perCasUs,
    totalPagines: PAGINES_WP_18.length,
  };
}

