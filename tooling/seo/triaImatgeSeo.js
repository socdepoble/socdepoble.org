/**
 * triaImatgeSeo.js — Selector intel·ligent d'imatge SEO (og:image) per a
 * publicacions editorials i esdeveniments multi-data (Skill sdp-importacio-editorial).
 *
 * Regles canòniques del Mestre Javi Llinares (2026-11-03):
 *   1. No usar una captura genèrica del vídeo com a imatge SEO (og:image) quan
 *      la publicació ja disposa de cartells o fotografies informatives reals al cos
 *      o a la galeria.
 *   2. Quan una notícia o esdeveniment agrupa diverses tandes o convocatòries
 *      amb dates pròpies (ex. Fageca a l'octubre i Alcosser al novembre), el
 *      selector compara la data de referència (`ara`, YYYY-MM-DD) amb la data
 *      final (`fi`) de cada tanda:
 *        · Tria la PRIMERA imatge la tanda de la qual continue vigent o futura (`fi >= ara`).
 *        · Si totes les tandes són futures o no tenen data, tria la primera.
 *        · Si totes les tandes ja han passat (arxiu històric), conserva la primera.
 */

const MESOS_CA = Object.freeze({
  gener: '01',
  febrer: '02',
  marc: '03',
  març: '03',
  abril: '04',
  maig: '05',
  juny: '06',
  juliol: '07',
  agost: '08',
  setembre: '09',
  octubre: '10',
  novembre: '11',
  desembre: '12'
});

const ES_CAPTURA_VIDEO = /(?:^|[_/-])(?:poster|captura|frame|thumb_video)(?:[_.-]|$)/i;

function avuiIso(ara) {
  if (typeof ara === 'string' && /^\d{4}-\d{2}-\d{2}/.test(ara.trim())) {
    return ara.trim().slice(0, 10);
  }
  if (ara instanceof Date && !Number.isNaN(ara.getTime())) {
    return ara.toISOString().slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
}

/**
 * Extreu la darrera data YYYY-MM-DD esmentada en un bloc de text HTML o pla
 * (ex. "23, 24, 30 i 31 d’octubre de 2026" -> "2026-10-31",
 *      "6, 7 i 14 de novembre de 2026" -> "2026-11-14",
 *      "Dissabte 14/11" amb any 2026 -> "2026-11-14").
 */
export function darreraDataDelText(text, anyPerDefecte = null) {
  if (typeof text !== 'string' || !text.trim()) return null;
  const net = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  const dates = [];

  for (const m of net.matchAll(/\b(20\d{2})-(\d{2})-(\d{2})\b/g)) {
    dates.push(`${m[1]}-${m[2]}-${m[3]}`);
  }

  const expressioLletres = /((?:\b\d{1,2}\b(?:\s*(?:,|i|y|al|a|-|–)\s*)?)+)\s*(?:de\s+|d['’])?(gener|febrer|març|marc|abril|maig|juny|juliol|agost|setembre|octubre|novembre|desembre)(?:\s+(?:de\s+|del\s+)?(20\d{2}))?/gi;
  for (const m of net.matchAll(expressioLletres)) {
    const mesNom = m[2].toLowerCase();
    const mes = MESOS_CA[mesNom];
    const any = m[3] || anyPerDefecte;
    if (!mes || !any) continue;
    const dies = [...m[1].matchAll(/\b(\d{1,2})\b/g)]
      .map((d) => Number(d[1]))
      .filter((d) => d >= 1 && d <= 31);
    for (const dia of dies) {
      dates.push(`${any}-${mes}-${String(dia).padStart(2, '0')}`);
    }
  }

  if (anyPerDefecte) {
    for (const m of net.matchAll(/\b(\d{1,2})\/(\d{1,2})(?:\/(20\d{2}))?\b/g)) {
      const dia = Number(m[1]);
      const mes = Number(m[2]);
      const any = m[3] || anyPerDefecte;
      if (dia >= 1 && dia <= 31 && mes >= 1 && mes <= 12) {
        dates.push(`${any}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`);
      }
    }
  }

  if (!dates.length) return null;
  dates.sort();
  return dates[dates.length - 1];
}

/**
 * Extreu les imatges del cos HTML junt amb la darrera data del seu bloc
 * editorial (des de l'últim <h3>/<h2> o principi de text fins al final de la <figure>).
 */
export function imatgesAmbDataDelCos(html, anyPerDefecte = null) {
  if (typeof html !== 'string' || !html.trim()) return [];
  const anyBase = anyPerDefecte || (/\b(20\d{2})\b/.exec(html)?.[1] ?? null);
  const resultat = [];
  const imgRegex = /<img\b([^>]*?)\/?>/gi;
  let darrerTall = 0;

  for (const m of html.matchAll(imgRegex)) {
    const atributs = m[1] || '';
    const srcMatch = /\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)')/i.exec(atributs);
    const src = srcMatch ? (srcMatch[1] || srcMatch[2] || '').trim() : '';
    if (!src) continue;
    const altMatch = /\balt\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(atributs);
    const alt = altMatch ? (altMatch[1] ?? altMatch[2] ?? '').trim() : '';

    const posicioImg = m.index ?? 0;
    const abans = html.slice(0, posicioImg);
    const ultimH3 = Math.max(abans.lastIndexOf('<h3'), abans.lastIndexOf('<h2'), darrerTall);
    const iniciBloc = ultimH3 >= 0 ? ultimH3 : darrerTall;
    const tancamentFigura = html.indexOf('</figure>', posicioImg);
    const fiBloc = tancamentFigura !== -1 ? tancamentFigura + 9 : posicioImg + m[0].length;
    const blocText = html.slice(iniciBloc, fiBloc);
    darrerTall = fiBloc;

    const fi = darreraDataDelText(`${ blocText } ${ alt }`, anyBase);
    resultat.push({ src, alt, fi });
  }
  return resultat;
}

/**
 * Selecciona la imatge SEO (og:image) més efectiva per a una publicació.
 *
 * @param {object} item - Objecte de la publicació o esdeveniment
 * @param {object} [opcions]
 * @param {string|Date} [opcions.ara] - Data de referència (YYYY-MM-DD)
 * @returns {{ imatge: string | null, alt: string, motiu: string, fi: string | null }}
 */
export function triaImatgeSeo(item, { ara } = {}) {
  if (!item || typeof item !== 'object') {
    return { imatge: null, alt: '', motiu: 'item-buit', fi: null };
  }

  const dataRef = avuiIso(ara);
  const anyBase = (typeof item.inici === 'string' && item.inici.slice(0, 4))
    || (typeof item.fi === 'string' && item.fi.slice(0, 4))
    || (typeof item.date === 'string' && item.date.slice(0, 4))
    || (typeof item.publish_date === 'string' && item.publish_date.slice(0, 4))
    || dataRef.slice(0, 4);

  const tandesExplicites = Array.isArray(item.imatges_seo)
    ? item.imatges_seo.filter((t) => t && typeof t.src === 'string' && t.src.trim())
    : [];

  const delCos = tandesExplicites.length
    ? tandesExplicites.map((t) => ({
        src: t.src.trim(),
        alt: typeof t.alt === 'string' ? t.alt.trim() : '',
        fi: typeof t.fi === 'string' ? t.fi.trim().slice(0, 10) : darreraDataDelText(t.alt || '', anyBase)
      }))
    : imatgesAmbDataDelCos(item.description || item.content || item.html || '', anyBase);

  const portada = typeof item.image_url === 'string' ? item.image_url.trim()
    : typeof item.image === 'string' ? item.image.trim() : '';
  const portadaEsCapturaVideo = Boolean(portada && (ES_CAPTURA_VIDEO.test(portada) || (item.video_url && delCos.length > 0)));

  const candidates = [];
  if (portada && !portadaEsCapturaVideo) {
    candidates.push({
      src: portada,
      alt: typeof item.imageAlt === 'string' ? item.imageAlt.trim() : (item.title || ''),
      fi: typeof item.fi === 'string' ? item.fi.slice(0, 10) : null
    });
  }
  for (const img of delCos) {
    if (!candidates.some((c) => c.src === img.src)) {
      candidates.push(img);
    }
  }
  if (!candidates.length && portada) {
    return {
      imatge: portada,
      alt: typeof item.imageAlt === 'string' ? item.imageAlt.trim() : (item.title || ''),
      motiu: 'reserva-portada-video',
      fi: typeof item.fi === 'string' ? item.fi.slice(0, 10) : null
    };
  }
  if (!candidates.length) {
    return { imatge: null, alt: '', motiu: 'sense-imatges', fi: null };
  }

  const ambData = candidates.filter((c) => c.fi);
  if (ambData.length >= 2) {
    const vigent = candidates.find((c) => c.fi && c.fi >= dataRef);
    if (vigent) {
      const index = candidates.indexOf(vigent);
      return {
        imatge: vigent.src,
        alt: vigent.alt || item.title || '',
        motiu: index === 0 ? 'primera-tanda-vigent' : `tanda-vigent-${index + 1}`,
        fi: vigent.fi
      };
    }
    return {
      imatge: candidates[0].src,
      alt: candidates[0].alt || item.title || '',
      motiu: 'totes-les-tandes-passades-primera-historica',
      fi: candidates[0].fi
    };
  }

  return {
    imatge: candidates[0].src,
    alt: candidates[0].alt || item.title || '',
    motiu: portadaEsCapturaVideo ? 'primera-imatge-editorial-sense-captura-video' : 'primera-imatge',
    fi: candidates[0].fi || null
  };
}
