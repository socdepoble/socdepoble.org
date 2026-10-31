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
export const cosDe = (html) => new DOMParser().parseFromString(html, 'text/html').body;
/** Les infraccions de la llei T8 d'un cos (una llista buida si no n'hi ha cap). */
export function infraccionsT8(html) {
  const errors = [];
  if (!html.trim().startsWith('<h3>')) errors.push('el cos no comença en un H3 (entradilla → H3)');
  if (/<h[12]\b/i.test(html)) errors.push('H1 o H2 dins del cos');
  if (/<(?:script|iframe|object|embed|table|style|form)\b|\son[a-z]+\s*=|\sstyle\s*=|javascript:/i.test(html)) errors.push('script, iframe, taula, style o atribut on*');
  const cos = cosDe(html);
  for (const element of cos.querySelectorAll('*')) {
    const nom = element.localName;
    if (!ETIQUETES_T8.has(nom)) errors.push(`etiqueta <${nom}>`);
    for (const { name } of element.attributes) if (!(ATRIBUTS_T8[nom] ?? []).includes(name)) errors.push(`atribut ${name} a <${nom}>`);
  }
  for (const a of cos.querySelectorAll('a')) {
    const href = a.getAttribute('href') ?? '';
    if (href.startsWith('https://')) {
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
export function infraccionsDelCosPintat(cos, html) {
  if (!cos) return ['cap cos pintat'];
  const errors = [];
  const origen = cosDe(html);
  if (cos.firstElementChild?.tagName !== 'H3') errors.push('el cos pintat no comença en un H3 (entradilla → H3)');
  if (!igual(pecesDe(cos), pecesDe(origen))) errors.push(`les peces del cos pintat (${pecesDe(cos).join(' ')}) no són les del text (${pecesDe(origen).join(' ')})`);
  for (const element of cos.querySelectorAll('*')) {
    if (!ETIQUETES_T8.has(element.localName)) errors.push(`etiqueta <${element.localName}> al cos pintat`);
    for (const { name } of element.attributes) if (/^on/i.test(name)) errors.push(`atribut ${name} a <${element.localName}> del cos pintat`);
  }
  if (!igual(enllacosDe(cos), enllacosDe(origen))) errors.push(`els enllaços pintats no són els del text: ${enllacosDe(cos).join(' | ')}`);
  for (const a of cos.querySelectorAll('a[target="_blank"]')) {
    const rel = (a.getAttribute('rel') ?? '').split(/\s+/);
    if (!rel.includes('noopener') || !rel.includes('noreferrer')) errors.push(`${a.getAttribute('href')} s'obri a part sense rel="noopener noreferrer"`);
  }
  if (!igual(imatgesDe(cos), imatgesDe(origen))) errors.push(`les imatges pintades no són les del text: ${imatgesDe(cos).join(' | ')}`);
  for (const p of cos.querySelectorAll('p')) {
    if (!p.textContent.trim() || !p.querySelector('strong')) errors.push(`paràgraf buit o sense negretes: «${p.textContent.trim().slice(0, 60)}»`);
  }
  return errors;
}
