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

export const CLAU_STORAGE_REVISIO_WP = 'sdp_revisio_editorial_wp_v1';

export const INSIGNIES_CASOS_US_IMPORTACIO = Object.freeze({
  galeria_fotos: {
    id: 'galeria_fotos',
    icona: '🖼️',
    etiqueta: 'Galeria de fotos',
    descripcio: 'Transformada en mosaic Pedra Seca amb VisorImatges accessible.',
  },
  video_youtube_vimeo: {
    id: 'video_youtube_vimeo',
    icona: '🎬',
    etiqueta: 'Vídeo (YouTube/Vimeo)',
    descripcio: ' Incrustació responsive amb càrrega diferida i títol accessible.',
  },
  pdf_drive_docs: {
    id: 'pdf_drive_docs',
    icona: '📄',
    etiqueta: 'Document PDF / Drive',
    descripcio: 'Targeta documental descarregable sense iframe trencat.',
  },
  iframe_extern_substituit: {
    id: 'iframe_extern_substituit',
    icona: '🛡️',
    etiqueta: 'Iframe extern substituït',
    descripcio: 'Substituït per component natiu o targeta d’enllaç segura.',
  },
  enllacos_interns_reescrits: {
    id: 'enllacos_interns_reescrits',
    icona: '🔗',
    etiqueta: 'Enllaços interns reescrits',
    descripcio: 'Enllaços de socdepoble.net redirigits a /mur, /events, /page o /pobles.',
  },
  pobles_etiquetats: {
    id: 'pobles_etiquetats',
    icona: '📍',
    etiqueta: 'Pobles etiquetats',
    descripcio: 'Connectat automàticament al mur de cada poble i comarca.',
  },
});

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

  // 5. Substituir iframes externs insegurs (que no siguen YouTube/Vimeo) per targeta Pedra Seca
  net = net.replace(
    /<iframe\b[^>]*src=(["'])([^"']+)\1[^>]*>[\s\S]*?<\/iframe>/gi,
    (fullIframe, _q, srcUrl) => {
      if (/youtube\.com|youtube-nocookie\.com|player\.vimeo\.com/i.test(srcUrl)) {
        casosUs.add('video_youtube_vimeo');
        return `<div class="sdp-embed-video"><iframe src="${srcUrl}" title="Vídeo incrustat" loading="lazy" allowFullScreen></iframe></div>`;
      }
      casosUs.add('iframe_extern_substituit');
      return `<div class="sdp-targeta-enllac-extern" data-original-iframe="${srcUrl}"><a href="${srcUrl}" target="_blank" rel="noopener noreferrer">Obrir contingut extern verificat (${srcUrl})</a></div>`;
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

export function llegeixEstatRevisioEditorial(storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return { estats: {}, anotacions: {} };
  try {
    const raw = storage.getItem(CLAU_STORAGE_REVISIO_WP);
    if (!raw) return { estats: {}, anotacions: {} };
    const parsed = JSON.parse(raw);
    return {
      estats: parsed?.estats || {},
      anotacions: parsed?.anotacions || {},
    };
  } catch {
    return { estats: {}, anotacions: {} };
  }
}

export function desaEstatRevisioEditorial(nouEstat, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  if (!storage) return;
  try {
    storage.setItem(CLAU_STORAGE_REVISIO_WP, JSON.stringify(nouEstat));
  } catch {
    /* Ignora quota */
  }
}

export function obteInventariImportacioComplet() {
  return {
    articles: ARTICLES_SIMULADOR_IA_425,
    pagines: PAGINES_WP_18,
  };
}

export const CASOS_US_EDITORIALS = Object.freeze(
  Object.values(INSIGNIES_CASOS_US_IMPORTACIO).map((c) => ({
    id: c.id,
    icona: c.icona,
    titol: c.etiqueta,
    label: `${c.icona} ${c.etiqueta}`,
    etiqueta: c.etiqueta,
    descripcio: c.descripcio,
  }))
);

export function lligArticlesImportatsAmbRevisio(storage = typeof window !== 'undefined' ? window.localStorage : null) {
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
    return {
      ...art,
      wp_id: wpId,
      ruta_canonica: art.rutaDestiCanonica || `/mur/${art.slug}`,
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

export function desaRevisioArticleImportat(wpId, { estat, nota } = {}, storage = typeof window !== 'undefined' ? window.localStorage : null) {
  const actual = llegeixEstatRevisioEditorial(storage);
  const nouEstat = {
    estats: { ...actual.estats, ...(estat ? { [wpId]: estat } : {}) },
    anotacions: { ...actual.anotacions, ...(nota !== undefined ? { [wpId]: nota } : {}) },
  };
  desaEstatRevisioEditorial(nouEstat, storage);
  return nouEstat;
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

