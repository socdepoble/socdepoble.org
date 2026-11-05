/**
 * sanejaTextFederat.js · AH-07 (Ronda 9)
 *
 * Utilitats pures i deterministes per al sanejament de textos, HTML, avisos de
 * contingut (CW) i autoria procedents de Mastodon / ActivityPub abans de
 * persistir-los a PostgreSQL `jsonb` o renderitzar-los a la interfície.
 *
 * Garanties de seguretat (core-seguretat-audit):
 * 1. Zero surrogats UTF-16 orfes (\uD800..\uDFFF desaparellats) que farien
 *    fallar PostgreSQL `jsonb` en tallar a 220 o 500 caràcters.
 * 2. Truncament segur per grafemes (`Intl.Segmenter`) per no partir mai
 *    emoticones compostes (ZWJ), banderes ni accents combinats.
 * 3. Neutralització de caràcters invisibles de control bidireccional
 *    (U+202A..U+202E, U+2066..U+2069, U+200E, U+200F, U+061C) contra atacs
 *    Trojan Source / suplantació visual de dominis.
 * 4. Neteja d'HTML de Mastodon en temps lineal O(n) sense regexes amb
 *    backtracking: elimina `<span class="invisible">...</span>`, conserva el
 *    text visible d'`ellipsis`, transforma `<br>` i `</p>` en salts de línia
 *    nets i descodifica `&amp;` en últim lloc (zero doble descodificació).
 */

const RE_CONTROL_BIDI = /[\u202A-\u202E\u2066-\u2069\u200E\u200F\u061C]/g;

const segmentadorGrafemes = typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
  ? new Intl.Segmenter('ca', { granularity: 'grapheme' })
  : null;

/**
 * Elimina qualsevol unitat subrogada UTF-16 desaparellada en una sola passada
 * lineal O(n), preservant intactes tots els parells subrogats legítims.
 */
export function purgaSurrogatsOrfes(entrada) {
  const text = String(entrada ?? '');
  if (!text) return '';
  let net = '';
  let inici = 0;
  for (let i = 0; i < text.length; i += 1) {
    const codi = text.charCodeAt(i);
    if (codi >= 0xd800 && codi <= 0xdbff) {
      const seguent = text.charCodeAt(i + 1);
      if (seguent >= 0xdc00 && seguent <= 0xdfff) {
        i += 1;
        continue;
      }
    } else if (codi < 0xdc00 || codi > 0xdfff) {
      continue;
    }
    net += text.slice(inici, i);
    inici = i + 1;
  }
  return net + text.slice(inici);
}

/**
 * Elimina els caràcters de control bidireccional invisibles que poden invertir
 * visualment URLs o noms d'usuari federats.
 */
export function neutralitzaControlBidi(entrada) {
  const text = String(entrada ?? '');
  if (!text) return '';
  return text.replace(RE_CONTROL_BIDI, '');
}

/**
 * Segmenta una cadena en grafemes complets (o punts de codi si Intl.Segmenter
 * no està disponible) després de purgar surrogats orfes i controls bidi.
 */
export function segmentaGrafemes(entrada) {
  const net = neutralitzaControlBidi(purgaSurrogatsOrfes(entrada));
  if (!net) return [];
  if (segmentadorGrafemes) {
    const out = [];
    for (const seg of segmentadorGrafemes.segment(net)) {
      out.push(seg.segment);
    }
    return out;
  }
  return Array.from(net);
}

/**
 * Trunca un text a un màxim de grafemes sense partir mai un parell subrogat
 * UTF-16 ni un emoji ZWJ compost. Garantix que l'eixida és 100% vàlida per a
 * PostgreSQL `jsonb`.
 */
export function truncaPerGrafemesSegur(text, maxGrafemes = 500, sufix = '…') {
  const limit = typeof maxGrafemes === 'number' && Number.isFinite(maxGrafemes)
    ? Math.floor(maxGrafemes)
    : 500;
  if (limit <= 0) return '';

  const grafemes = segmentaGrafemes(text);
  if (grafemes.length <= limit) {
    return grafemes.join('');
  }

  const grafemesSufix = segmentaGrafemes(sufix);
  if (grafemesSufix.length === 0 || limit <= grafemesSufix.length) {
    return purgaSurrogatsOrfes(grafemes.slice(0, limit).join(''));
  }

  const tall = limit - grafemesSufix.length;
  return purgaSurrogatsOrfes(grafemes.slice(0, tall).join('') + grafemesSufix.join(''));
}

function descodificaEntitatsSegur(entrada) {
  const text = String(entrada ?? '');
  if (!text || !text.includes('&')) return text;

  /* 1) Entitats amb nom (excepte &amp;, que va estrictament al final) i numèriques */
  const pas1 = text
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&apos;', "'")
    .replace(/&#(\d{1,10});|&#x([0-9a-fA-F]{1,8});/g, (coincidencia, dec, hex) => {
      const codi = dec !== undefined ? Number(dec) : parseInt(hex, 16);
      if (
        !Number.isInteger(codi)
        || codi < 32
        || codi > 0x10ffff
        || (codi >= 0xd800 && codi <= 0xdfff)
        || (codi >= 0x202a && codi <= 0x202e)
        || (codi >= 0x2066 && codi <= 0x2069)
      ) {
        return '';
      }
      return String.fromCodePoint(codi);
    });

  /* 2) &amp; es descodifica en últim lloc per impedir doble descodificació (&amp;lt; -> &lt;) */
  return pas1.replaceAll('&amp;', '&');
}

function teClasseHtml(etiquetaMinuscules, nomClasse) {
  const idxClass = etiquetaMinuscules.indexOf('class=');
  if (idxClass === -1) return false;
  const resta = etiquetaMinuscules.slice(idxClass + 6).trimStart();
  const cometa = resta[0];
  if (cometa !== '"' && cometa !== "'") return false;
  const fi = resta.indexOf(cometa, 1);
  if (fi === -1) return false;
  const classes = resta.slice(1, fi).split(/\s+/);
  return classes.includes(nomClasse);
}

/**
 * Converteix l'HTML d'una publicació de Mastodon / ActivityPub en text pla net:
 * - Elimina `<span class="invisible">...</span>` i blocs `<script>`/`<style>`.
 * - Conserva el text visible de `<span class="ellipsis">...</span>`.
 * - Converteix `<br>` i `</p>`/`</li>` en salts de línia nets (`\n`) o espais
 *   si `opcions.unaSolaLinia === true`.
 * - Descodifica entitats deixant `&amp;` en últim lloc.
 * - Neutralitza caràcters bidi i surrogats orfes.
 */
export function netejaHtmlMastodonATextPla(html, opcions = {}) {
  const brut = neutralitzaControlBidi(purgaSurrogatsOrfes(html));
  if (!brut) return '';

  const unaSolaLinia = opcions?.unaSolaLinia === true;
  const maxGrafemes = opcions?.maxGrafemes ?? null;
  const sufix = opcions?.sufix ?? '…';

  let acumulat = '';
  let dinsEtiqueta = false;
  let etiquetaActual = '';
  let profunditatInvisible = 0;
  let profunditatIgnorada = 0;

  for (let i = 0; i < brut.length; i += 1) {
    const ch = brut[i];
    if (ch === '<') {
      dinsEtiqueta = true;
      etiquetaActual = '';
    } else if (ch === '>' && dinsEtiqueta) {
      dinsEtiqueta = false;
      const neta = etiquetaActual.trim().toLowerCase();
      const esTancament = neta.startsWith('/');
      const cosTag = esTancament ? neta.slice(1).trimStart() : neta;
      const nomBase = cosTag.split(/[\s/>]/)[0];
      const nomTag = esTancament ? `/${nomBase}` : nomBase;

      if (nomTag === 'script' || nomTag === 'style') {
        if (!neta.endsWith('/')) profunditatIgnorada += 1;
      } else if ((nomTag === '/script' || nomTag === '/style') && profunditatIgnorada > 0) {
        profunditatIgnorada -= 1;
      } else if (profunditatIgnorada === 0) {
        if (nomTag === 'span') {
          if (profunditatInvisible > 0) {
            if (!neta.endsWith('/')) profunditatInvisible += 1;
          } else if (teClasseHtml(neta, 'invisible') && !neta.endsWith('/')) {
            profunditatInvisible = 1;
          }
        } else if (nomTag === '/span' && profunditatInvisible > 0) {
          profunditatInvisible -= 1;
        } else if (
          profunditatInvisible === 0
          && (nomTag === 'br' || nomTag === '/p' || nomTag === '/li' || nomTag === '/div' || nomTag === '/blockquote')
        ) {
          acumulat += '\n';
        }
      }
    } else if (dinsEtiqueta) {
      if (etiquetaActual.length < 256) etiquetaActual += ch;
    } else if (profunditatIgnorada === 0 && profunditatInvisible === 0) {
      acumulat += ch;
    }
  }

  const descodificat = neutralitzaControlBidi(purgaSurrogatsOrfes(descodificaEntitatsSegur(acumulat)));
  const linies = descodificat
    .split('\n')
    .map((linia) => linia.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const unit = unaSolaLinia ? linies.join(' ') : linies.join('\n');
  if (typeof maxGrafemes === 'number' && Number.isFinite(maxGrafemes)) {
    return truncaPerGrafemesSegur(unit, maxGrafemes, sufix);
  }
  return unit;
}

