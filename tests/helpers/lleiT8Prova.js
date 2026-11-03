/**
 * lleiT8Prova.js — NOMÉS per a les proves (com jpegProva.js): el codi de
 * producció no l'importa. Gauntlet 261030, cicle 2 · La llei T8 en un sol
 * lloc, per a paginaDeText.test.js (el text de PAGE_COPY) i per als qui pinten
 * el cos d'una pàgina de text (PageDetailSection.consola.test.jsx a
 * /page/consola i /page/cervell, i PublicacioDetall.sistema.test.jsx al lector
 * del Mas). Abans vivia dins de paginaDeText.test.js, i les dues proves dels
 * consumidors continuaven exigint els «sis paràgrafs, sense cap títol» que les
 * ordres del 261030 deroguen (troballa proves-roges-sis-paragrafs-consola-cervell).
 *
 * ── La llei T8 (Gauntlet 261030, cicle 2) ────────────────────────────────
 * Ordres del Mestre del 30-10-2026 (decisions 261030; lliçons 261030 de
 * sdp-universal-page: «H3 just després de l'entradilla», «hipervincles vius
 * obligatoris» i «zero taules de prosa») · DEROGA la T8 del 261001 per a
 * /fedivers («cap enllaç ni cap atribut») i la de l'Onada 10 per a la Consola
 * i el Cervell («sis paràgrafs, sense cap títol»). Ara el cos de les tres:
 * comença en un H3 (entradilla → H3), no porta ni H1 ni H2 ni cap salt de
 * nivell, i només hi entren h3-h6, p, ul/ol/li, strong, em, code,
 * blockquote, a (ruta interna viva o https de fora amb target="_blank" i
 * rel="noopener noreferrer") i img locals (amb alt, mides que són les del
 * fitxer i loading="lazy"). Mai script, iframe, taula, style ni atributs on*.
 * Onada 7 (T2.6) · L'única excepció és un grup de targetes de primer nivell
 * (CosAmbTargetes): <div data-sdp-targetes class="sdp-targetes"
 * data-forma="sola" data-alineacio="dreta"> amb una sola <div
 * data-sdp-targeta class="sdp-targeta"> d'atributs de formaDelGrup, ruta
 * viva coherent amb la clau, data-imatge local i, com a únic contingut,
 * l'enllaç de reserva a la mateixa ruta. Un grup niat o qualsevol altra cosa
 * dins del grup continua sent una infracció; i el cos pintat porta les
 * mateixes targetes (nombre i ruta) que el text.
 * Escrit amb classes ([12], [1-6]): design_guard llig els literals de
 * capçalera de qualsevol .js.
 *
 *   · infraccionsT8(html): la llei, sobre el text de PAGE_COPY.
 *   · infraccionsDelCosPintat(cos, html): el cos que rep qui llig
 *     (article.cms-preview, després del sanejador) és el de PAGE_COPY, peça a
 *     peça, i continua dins de la llei.
 *   · cosDe(html) i midesWebp(cami): les eines comunes.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PAGE_COPY } from '../../src/sections/text/pageContent.js';
import { SECTIONS } from '../../src/config/sections.js';
import { pageKeyDeRuta } from '../../src/sections/text/paginaDeText.js';
import { IDS_PAGINES, paginaConsola } from '../../src/sections/consola/consolaPagines.js';
import { clauDeRutaInterna } from '../../src/components/universal/richText/extensions/targetes/formaDelGrup.js';

export const ETIQUETES_T8 = new Set(['h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'code', 'blockquote', 'a', 'img']);
const ATRIBUTS_T8 = { a: ['href', 'target', 'rel'], img: ['src', 'alt', 'width', 'height', 'loading', 'decoding'] };
/* Les rutes que l'app servix: les seccions i les seues subrutes, el tauler i
   les nou pàgines de la Consola (/consola/*) i les pàgines de text de
   /page/:slug que es resolen (App.jsx, PageDetailSection). */
const RUTES_VIVES = new Set([
  ...SECTIONS.flatMap((seccio) => [seccio.path, ...(seccio.subrutes ?? [])]),
  '/consola', ...IDS_PAGINES.map((id) => paginaConsola(id).ruta)
]);
const rutaViva = (href) => RUTES_VIVES.has(href)
  || (/^\/page\/[a-z0-9-]+$/.test(href) && Object.hasOwn(PAGE_COPY, href.slice(6)) && pageKeyDeRuta(href) === href.slice(6));
/** Les mides d'una WebP (VP8X, VP8 o VP8L), dels seus bytes. */
export function midesWebp(cami) {
  const bytes = readFileSync(resolve(process.cwd(), 'public', cami.replace(/^\//, '')));
  if (bytes.toString('latin1', 0, 4) !== 'RIFF' || bytes.toString('latin1', 8, 12) !== 'WEBP') return null;
  const tros = bytes.toString('latin1', 12, 16);
  if (tros === 'VP8X') return [1 + bytes.readUIntLE(24, 3), 1 + bytes.readUIntLE(27, 3)];
  if (tros === 'VP8 ') return [bytes.readUInt16LE(26) & 0x3fff, bytes.readUInt16LE(28) & 0x3fff];
  if (tros === 'VP8L') {
    const bits = bytes.readUInt32LE(21);
    return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1];
  }
  return null;
}
/* Un grup de targetes de PRIMER NIVELL (l'únic que CosAmbTargetes hidrata). */
const esGrupDePrimerNivell = (node) => node.localName === 'div' && node.hasAttribute('data-sdp-targetes');
export const cosDe = (html) => {
  const body = new DOMParser().parseFromString(html, 'text/html').body;
  [...body.children].filter(esGrupDePrimerNivell).forEach((grup) => grup.remove());
  return body;
};
/* Les rutes de les targetes de primer nivell d'un HTML, en ordre. */
const rutesDeTargetes = (html) => [...new DOMParser().parseFromString(html, 'text/html').body.children]
  .filter(esGrupDePrimerNivell).map((grup) => grup.firstElementChild?.getAttribute('data-ruta') ?? '');
const ATRIBUTS_GRUP_T8 = 'class,data-alineacio,data-forma,data-sdp-targetes';
const ATRIBUTS_TARGETA_T8 = new Set(['data-sdp-targeta', 'class', 'data-ruta', 'data-titol', 'data-subtitol', 'data-entradilla', 'data-autor', 'data-autor-ruta', 'data-poble', 'data-imatge']);
function validaGrupsTargetesT8(html, errors) {
  const body = new DOMParser().parseFromString(html, 'text/html').body;
  for (const grup of body.querySelectorAll('[data-sdp-targetes], [data-sdp-targeta]')) {
    if (!grup.hasAttribute('data-sdp-targetes')) {
      if (!grup.parentElement?.hasAttribute('data-sdp-targetes')) errors.push('targeta data-sdp-targeta fora d\'un grup');
      continue;
    }
    if (grup.parentElement !== body || grup.localName !== 'div') errors.push('grup data-sdp-targetes niat (només s\'hidraten els de primer nivell)');
    if (grup.getAttributeNames().sort().join() !== ATRIBUTS_GRUP_T8 || grup.getAttribute('class') !== 'sdp-targetes'
      || grup.getAttribute('data-forma') !== 'sola' || grup.getAttribute('data-alineacio') !== 'dreta') {
      errors.push('grup data-sdp-targetes fora del format sola/dreta');
    }
    if ([...grup.childNodes].some((node) => node.nodeType !== 1 && node.textContent.trim())) errors.push('text solt dins del grup data-sdp-targetes');
    const targetes = [...grup.children];
    if (targetes.length !== 1) errors.push('grup data-sdp-targetes sense una sola targeta');
    for (const t of targetes) {
      const ruta = t.getAttribute('data-ruta') ?? '';
      const estranys = t.getAttributeNames().filter((nom) => !ATRIBUTS_TARGETA_T8.has(nom));
      const imatge = t.getAttribute('data-imatge');
      const autorRuta = t.getAttribute('data-autor-ruta');
      if (t.localName !== 'div' || t.getAttribute('class') !== 'sdp-targeta' || !rutaViva(ruta)
        || !t.getAttribute('data-sdp-targeta') || clauDeRutaInterna(ruta) !== t.getAttribute('data-sdp-targeta') || estranys.length
        || (imatge !== null && (!/^\/assets\/[\w/.-]+\.webp$/.test(imatge) || !existsSync(resolve(process.cwd(), 'public', imatge.slice(1)))))
        || (autorRuta !== null && !rutaViva(autorRuta))) {
        errors.push(`targeta incrustada T8 invàlida: ${ruta}${estranys.length ? ` (atributs ${estranys.join(', ')})` : ''}`);
      }
      const [reserva, ...mes] = t.querySelectorAll('*');
      if (mes.length || reserva?.localName !== 'a' || reserva.parentElement !== t || reserva.getAttribute('href') !== ruta
        || reserva.getAttributeNames().some((nom) => !['href', 'rel'].includes(nom)) || !reserva.textContent.trim()
        || [...t.childNodes].some((node) => node !== reserva && node.textContent.trim())) {
        errors.push(`la targeta ${ruta} no porta com a únic contingut l'enllaç de reserva a la seua ruta`);
      }
    }
  }
}
/** Les infraccions de la llei T8 d'un cos (una llista buida si no n'hi ha cap). */
export function infraccionsT8(html) {
  const errors = [];
  if (!html.trim().startsWith('<h3>')) errors.push('el cos no comença en un H3 (entradilla → H3)');
  if (/<h[12]\b/i.test(html)) errors.push('H1 o H2 dins del cos');
  if (/<(?:script|iframe|object|embed|table|style|form)\b|\son[a-z]+\s*=|\sstyle\s*=|javascript:/i.test(html)) errors.push('script, iframe, taula, style o atribut on*');
  validaGrupsTargetesT8(html, errors);
  const cos = cosDe(html);
  for (const element of cos.querySelectorAll('*')) {
    const nom = element.localName;
    if (!ETIQUETES_T8.has(nom)) errors.push(`etiqueta <${nom}>`);
    for (const { name } of element.attributes) if (!(ATRIBUTS_T8[nom] ?? []).includes(name)) errors.push(`atribut ${name} a <${nom}>`);
  }
  for (const a of cos.querySelectorAll('a')) {
    const href = a.getAttribute('href') ?? '';
    if (href.startsWith('https://') || href === 'http://socdepoble.cat') {
      if (a.getAttribute('target') !== '_blank' || a.getAttribute('rel') !== 'noopener noreferrer') errors.push(`${href} sense target="_blank" i rel="noopener noreferrer"`);
    } else if (!href.startsWith('/') || href.startsWith('//') || a.hasAttribute('target') || !rutaViva(href)) {
      errors.push(`enllaç que no porta a cap ruta viva: ${href}`);
    }
    if (!a.textContent.trim()) errors.push(`enllaç sense text: ${href}`);
  }
  for (const img of cos.querySelectorAll('img')) {
    const src = img.getAttribute('src') ?? '';
    if (!/^\/assets\/[\w/.-]+\.webp$/.test(src) || !existsSync(resolve(process.cwd(), 'public', src.slice(1)))) { errors.push(`imatge que no és local: ${src}`); continue; }
    if ((img.getAttribute('alt') ?? '').length <= 40) errors.push(`${src} sense alt que la descriga`);
    if (JSON.stringify([Number(img.getAttribute('width')), Number(img.getAttribute('height'))]) !== JSON.stringify(midesWebp(src))) errors.push(`${src}: width i height no són les del fitxer`);
    if (img.getAttribute('loading') !== 'lazy') errors.push(`${src} sense loading="lazy"`);
  }
  const capcaleres = [...cos.querySelectorAll('h3, h4, h5, h6')];
  capcaleres.forEach((h, i) => {
    if (i > 0 && Number(h.tagName[1]) > Number(capcaleres[i - 1].tagName[1]) + 1) errors.push(`salt de nivell a «${h.textContent}»`);
    if (h.children.length || !h.textContent.trim() || h.textContent.trim().endsWith('.')) errors.push(`títol «${h.textContent}»: buit, amb etiquetes o acabat en punt`);
  });
  return errors;
}

/* El que en comparem: cada peça de primer nivell, cada enllaç (href, target i
   text) i cada imatge (src, alt, mides i loading). El sanejador (utils/
   sanitize.js) hi afig rel="noopener noreferrer nofollow" als enllaços i
   decoding i referrerpolicy a les imatges: això no es compara. */
const pecesDe = (node) => [...node.children].map((fill) => fill.tagName);
const enllacosDe = (node) => [...node.querySelectorAll('a')].map((a) => [a.getAttribute('href'), a.getAttribute('target'), a.textContent].join(' · '));
const imatgesDe = (node) => [...node.querySelectorAll('img')].map((img) => ['src', 'alt', 'width', 'height', 'loading'].map((nom) => img.getAttribute(nom)).join(' · '));
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Les infraccions del cos PINTAT d'una pàgina de text (l'element que rep qui
 * llig: article.cms-preview) contra el seu `html` de PAGE_COPY (una llista
 * buida si no n'hi ha cap): comença en un H3; porta les mateixes peces de
 * primer nivell, els mateixos enllaços i les mateixes imatges que el text (el
 * sanejador no n'ha perdut ni n'ha afegit cap); només hi ha etiquetes de la
 * llei i cap atribut on*; els enllaços que s'obrin a part porten rel
 * «noopener noreferrer»; i cada paràgraf té text i negretes (les negretes, només
 * als paràgrafs: un H3, un H4, una llista o una imatge no en porten).
 */
function normalitzaCosPintat(cos, html, errors) {
  const net = cos.cloneNode(true);
  const grups = [...net.querySelectorAll(':scope > .sdp-targetes')];
  const pintades = grups.map((grup) => {
    const enllacos = [...grup.querySelectorAll(':scope > .sdp-targeta a')].map((a) => a.getAttribute('href') ?? a.getAttribute('to'));
    return grup.querySelectorAll(':scope > .sdp-targeta').length === 1 ? (rutesDeTargetes(html).find((ruta) => enllacos.includes(ruta)) ?? enllacos[0] ?? '') : '';
  });
  if (!igual(pintades, rutesDeTargetes(html))) errors.push(`les targetes pintades (${pintades.join(' ')}) no són les del text (${rutesDeTargetes(html).join(' ')})`);
  grups.forEach((grup) => grup.remove());
  for (const tros of [...net.querySelectorAll(':scope > .sdp-cos-tros')]) {
    while (tros.firstChild) net.insertBefore(tros.firstChild, tros);
    tros.remove();
  }
  return net;
}
export function infraccionsDelCosPintat(cos, html) {
  if (!cos) return ['cap cos pintat'];
  const errors = [];
  const origen = cosDe(html);
  const net = normalitzaCosPintat(cos, html, errors);
  if (net.firstElementChild?.tagName !== 'H3') errors.push('el cos pintat no comença en un H3 (entradilla → H3)');
  if (!igual(pecesDe(net), pecesDe(origen))) errors.push(`les peces del cos pintat (${pecesDe(net).join(' ')}) no són les del text (${pecesDe(origen).join(' ')})`);
  for (const element of net.querySelectorAll('*')) {
    if (!ETIQUETES_T8.has(element.localName)) errors.push(`etiqueta <${element.localName}> al cos pintat`);
    for (const { name } of element.attributes) if (/^on/i.test(name)) errors.push(`atribut ${name} a <${element.localName}> del cos pintat`);
  }
  if (!igual(enllacosDe(net), enllacosDe(origen))) errors.push(`els enllaços pintats no són els del text: ${enllacosDe(net).join(' | ')}`);
  for (const a of net.querySelectorAll('a[target="_blank"]')) {
    const rel = (a.getAttribute('rel') ?? '').split(/\s+/);
    if (!rel.includes('noopener') || !rel.includes('noreferrer')) errors.push(`${a.getAttribute('href')} s'obri a part sense rel="noopener noreferrer"`);
  }
  if (!igual(imatgesDe(net), imatgesDe(origen))) errors.push(`les imatges pintades no són les del text: ${imatgesDe(net).join(' | ')}`);
  for (const p of net.querySelectorAll('p')) {
    if (!p.textContent.trim() || !p.querySelector('strong')) errors.push(`paràgraf buit o sense negretes: «${p.textContent.trim().slice(0, 60)}»`);
  }
  return errors;
}
