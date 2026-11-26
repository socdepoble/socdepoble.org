#!/usr/bin/env node
/** Avisos editorials deterministes; no substituïxen la revisió humana ni bloquegen res.
 * Font de la regla: .agents/skills/core-identitat/SKILL.md (IDEA-157, «de poble» vs. «del poble» i
 * «utilitza» vs. «usa») i la regla d'identitat lingüística del Mestre (Llibre Mestre, 25-11-2026 20:57).
 * v1.2.26 · C26-4 (Gauntlet #4 i #5) · La porta de coherència editorial la crida en mode avís sobre la
 * projecció pública (public/md i public/md/skills). */
import fs from 'node:fs';
import { esMain } from '../lib/arrel.mjs';
import { markdownProse } from '../lib/markdown-prose.mjs';

/* Contextos identitaris explícits (minúscules o majúscules): «l'ajuntament del poble» i altres usos d'un
   municipi concret són correctes. Les frases canòniques que documenta core-identitat (§2 i §3) i les de la
   regla del Mestre; cap substitució automàtica. Les més llargues primer. */
const FRASES_IDENTITARIES = Object.freeze(['intel·ligència artificial', 'sistema de disseny', 'identitat cultural',
  'manera de ser', 'llenguatge visual', 'al servei', 'experiències', 'tecnologia', 'filosofia', 'paraules', 'imatges',
  'memòria', 'eines', 'obres', 'iaia', 'vida', 'veu', 'ia']);
/* Les marques del sistema, amb la inicial en majúscula («Wiki del Poble»): «el mercat del poble» en
   minúscula és un mercat concret i no avisa. */
const MARQUES = Object.freeze(['Sóc', 'Manifest', 'Wiki', 'Gestoria', 'Rutes', 'Còmic', 'Mur', 'Mercat', 'Gent']);
/* «del poble» seguit d'un gentilici o adjectiu parla d'un poble etnolingüístic o d'una comunitat
   concreta («la identitat cultural del poble valencià»): no és cap calc de «de poble». Llista tancada. */
const GENTILICIS = new Set(['valencià', 'valenciana', 'català', 'catalana', 'gitano', 'gitana', 'romaní', 'basc', 'basca',
  'gallec', 'gallega', 'aragonès', 'aragonesa', 'andalús', 'andalusa', 'castellà', 'castellana', 'mallorquí', 'mallorquina',
  'menorquí', 'menorquina', 'eivissenc', 'eivissenca', 'occità', 'occitana', 'sard', 'sarda', 'cors', 'corsa', 'bretó',
  'bretona', 'kurd', 'kurda', 'palestí', 'palestina', 'sahrauí', 'jueu', 'jueva', 'amazic', 'saharià', 'sami', 'maia',
  'mapuche', 'indígena', 'originari', 'sobirà', 'sencer', 'unit', 'treballador']);
const PROPOSTES = Object.freeze({ 'imatges del poble': 'l’imaginari de poble', 'al servei del poble': 'al servei de la gent de poble' });

const escapa = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+');
const IDENTITARI = new RegExp(`(?<![\\p{L}\\p{N}_])(?:${FRASES_IDENTITARIES.map(escapa).join('|')})\\s+del\\s+poble(?![\\p{L}\\p{N}_])`, 'giu');
const MARCA = new RegExp(`(?<![\\p{L}\\p{N}_])(?:${MARQUES.map(escapa).join('|')})\\s+del\\s+[Pp]oble(?![\\p{L}\\p{N}_])`, 'gu');
/* «Usa» o «usen», també a l'inici de frase; «USA» (país o sigla), una ruta (/usa/), un mot compost
   (made-in-usa) i la cita castellana «se usa» no són el verb valencià. */
const VERB_USAR = /(?<![\p{L}\p{N}_\-/.@#])[Uu]s(?:a|en)(?![\p{L}\p{N}_])/gu;

/* L'URL d'un enllaç Markdown, d'una definició de referència o una adreça solta no és prosa. Es tapa amb
   espais (mateixos offsets i salts de línia). Totes les regex són lineals. */
const tapa = (text) => text.replace(/[^\n\r]/g, ' ');
function emmascaraUrls(prose) {
  return prose
    .replace(/\]\(([^)\n]*)\)/g, (tros, url) => `](${tapa(url)})`)
    .replace(/^( {0,3}\[[^\]\n]{1,200}\]:)([^\n]*)/gm, (tros, etiqueta, url) => etiqueta + tapa(url))
    .replace(/\b(?:https?|ftp):\/\/[^\s<>()[\]]+/gi, tapa);
}

/* Exempció metalingüística: la forma citada entre «» (amb cursiva o sense) que la mateixa frase marca com
   a incorrecta («mai «La IAIA usa…»», «no diem…», «que deien «imatges del poble», «paraules del poble»»)
   o que oposa amb «vs.» («utilitza vs. usa»). Una cadena de cites separades per comes, «i» o «o»
   comparteix la marca de la primera. Només dins de la mateixa línia. */
const MARCA_METALINGUISTICA = /(?:^|[^\p{L}])(?:mai|no\s+diem|no\s+escrivim|en\s+lloc\s+de|en\s+compte\s+de|evita|evitem|deien|diuen|vs\.?)[\s*_:]*$/iu;
const UNIO_DE_CITES = /»[*_]*\s*(?:,|\bi|\bo)\s*[*_]*$/u;
const FINESTRA = 80;
const ABAST_CITA = 400;
/* Retalla espais i marques de cursiva del final amb un sol pas enrere (cap regex amb retrocés). */
function retallaFinal(text) {
  let fi = text.length;
  while (fi > 0 && /[\s*_]/u.test(text[fi - 1])) fi -= 1;
  return text.slice(0, fi);
}
/* Tot es busca dins d'una finestra fixa al voltant de l'avís (ABAST_CITA): cost constant per avís. */
function esMetalinguistic(prose, index) {
  const base = Math.max(0, index - ABAST_CITA);
  const abansLocal = prose.slice(base, index);
  const iniciLinia = base + abansLocal.lastIndexOf('\n') + 1;
  // «mai *Sóc del Poble*»: la marca, i entre ella i la forma citada només cursiva o «.
  let cursor = index;
  let citada = false;
  while (cursor > iniciLinia && /[\s*_«]/u.test(prose[cursor - 1])) {
    if (/[*_«]/u.test(prose[cursor - 1])) citada = true;
    cursor -= 1;
  }
  if (citada && MARCA_METALINGUISTICA.test(prose.slice(Math.max(iniciLinia, cursor - FINESTRA), cursor))) return true;
  const obertura = base + abansLocal.lastIndexOf('«');
  if (obertura < iniciLinia || prose.slice(obertura, index).includes('»')) return false;
  const despres = prose.slice(index, index + ABAST_CITA);
  const salt = despres.indexOf('\n');
  const tancament = despres.indexOf('»');
  if (tancament === -1 || (salt !== -1 && tancament > salt)) return false;
  if (/\bvs\./u.test(prose.slice(obertura, index + tancament))) return true;
  let cita = obertura;
  for (let passos = 0; passos < 12; passos += 1) {
    const desde = Math.max(iniciLinia, cita - FINESTRA);
    const abans = retallaFinal(prose.slice(desde, cita));
    if (MARCA_METALINGUISTICA.test(abans)) return true;
    if (!UNIO_DE_CITES.test(abans)) return false;
    const anterior = prose.lastIndexOf('«', desde + abans.lastIndexOf('»'));
    if (anterior < iniciLinia) return false;
    cita = anterior;
  }
  return false;
}

export function policiaVocabulari(value, { llengua = 'ca' } = {}) {
  if (llengua !== 'ca' || typeof value !== 'string') return [];
  const prose = emmascaraUrls(markdownProse(value));
  const avisos = [];
  let line = 1;
  let cursor = 0;
  const add = (codi, index, original, proposta) => {
    while (cursor < index) if (prose[cursor++] === '\n') line++;
    avisos.push({ codi, severitat: 'avis', linia: line, original, proposta });
  };
  const matches = [];
  const dePoble = (m) => {
    const after = prose.slice(m.index + m[0].length, m.index + m[0].length + 40);
    if (/^\s+(?:de\s|d['’])/iu.test(after)) return;
    const seguent = /^\s+([\p{L}·]+)/u.exec(after)?.[1]?.toLocaleLowerCase('ca');
    if (seguent && GENTILICIS.has(seguent)) return;
    if (esMetalinguistic(prose, m.index)) return;
    const clau = m[0].replace(/\s+/g, ' ').toLocaleLowerCase('ca');
    matches.push({ codi: 'VOC-DE-POBLE', index: m.index, original: m[0],
      proposta: PROPOSTES[clau] ?? m[0].replace(/del(\s+)([Pp])oble$/u, 'de$1$2oble') });
  };
  for (const m of prose.matchAll(IDENTITARI)) dePoble(m);
  for (const m of prose.matchAll(MARCA)) dePoble(m);
  // Els blocs i spans de codi ja estan emmascarats per markdownProse.
  for (const m of prose.matchAll(VERB_USAR)) {
    if (/(?:^|[^\p{L}])se\s+$/iu.test(prose.slice(Math.max(0, m.index - 4), m.index))) continue;
    if (esMetalinguistic(prose, m.index)) continue;
    const plural = m[0].toLowerCase() === 'usen';
    matches.push({ codi: 'VOC-UTILITZA', index: m.index, original: m[0], proposta: plural ? 'utilitzen / fan servir' : 'utilitza / fa servir' });
  }
  matches.sort((a, b) => a.index - b.index);
  for (const m of matches) add(m.codi, m.index, m.original, m.proposta);
  return avisos;
}

if (esMain(import.meta.url)) {
  for (const file of process.argv.slice(2)) {
    const stat = fs.lstatSync(file);
    if (!stat.isFile() || stat.size > 2 * 1024 * 1024) throw new TypeError('Cal un fitxer de prosa de menys de 2 MiB.');
    for (const avis of policiaVocabulari(fs.readFileSync(file, 'utf8'))) console.warn(`${file}:${avis.linia} ${avis.codi}: ${avis.original} → ${avis.proposta}`);
  }
}
