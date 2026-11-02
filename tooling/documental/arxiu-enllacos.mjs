/** Arxivat amb enllaços (B1 · 261101): el pla del que `porta-olivera.mjs --arxiva` reescriu.
 *
 *  Quan un document de l'Escriptori se'n va a `90_arxiu_historic/`, els enllaços dels
 *  documents vius que el resolien es quedarien penjats (LINK_INVALID a l'SCC) i els torns
 *  que els segellen o els van vore quedarien rojos. Este mòdul ho calcula tot ABANS de
 *  moure res:
 *
 *    · Un sol resolutor: `resolveDocumentLink` (el de l'SCC), amb el mateix conjunt de
 *      fitxers que `VerificadorSCC.getAllMarkdownFiles`, més `.agents/ESTAT.md` i
 *      `.agents/ON_ESTIC.md` com a fonts. Un enllaç es reescriu si, i només si, resolia al
 *      document que es mou; el camí nou és relatiu a la carpeta de cada font.
 *    · Esmena estreta: només el torn tancat del rebut propi del document reescrit, amb la
 *      preimatge comprovada (verification.files[rel] === hash d'abans). Cap verificació nova.
 *    · Els torns oberts i vigents, de qualsevol abast: plan.hash si es reescriu el seu pla i
 *      relocated si veien el document mogut.
 *    · Tot el que aturaria l'operació (zona humana, laboratori, fitxer fora de la Wiki,
 *      preimatge divergent a l'Escriptori, enllaç ambigu, enllaç del frontmatter que en
 *      trencaria l'esquema, autor ambigu) ix com a aturada.
 *    · Gauntlet 261101 (G1-A-integ-01/02): també s'atura el que deixaria roges dues portes del
 *      hook després del trasllat: un viu amb una fallada F9 nova a «## Vincles» (Porta
 *      Frontmatter; p. ex. sense cap nota viva) i un camí al document mogut citat fora
 *      d'enllaços (codi inline o prosa) que la Porta Doctrina llig a `.agents`. Cap dels dos
 *      es reescriu a cegues: el missatge nomena el document i la línia. L'índex de l'Escriptori
 *      es jutja amb el text que en deixa `despenja`; els camins de la Doctrina, normalitzats
 *      com `path.join` (`./…`, `x/../…`). El deute F9 que el viu ja portava no atura.
 *
 *  L'arxiu històric no s'obri mai: del destí només es comprova que no existix.
 *  No importa `porta-olivera.mjs`: la porta el carrega amb `import()` només per a --arxiva.
 */
import fs from 'node:fs';
import path from 'node:path';
import { CAMINS } from '../lib/arrel.mjs';
import { markdownProse } from '../lib/markdown-prose.mjs';
import { resolveDocumentLink } from '../lib/document-links.mjs';
import { VerificadorSCC } from '../gates/verificador-scc.mjs';
import { splitFrontmatter, parseFrontmatter } from '../wiki/lib/frontmatter.mjs';
import { sha, json, parseDocument, checkSchema, validateSchema, receiptPattern, turnPattern, humanZone } from './core.mjs';
import { readTurn, isActiveReceipt } from './turns.mjs';

/** Els mateixos extractors que `extractDocumentLinks`: el que veu l'SCC és el que es reescriu. */
const WIKI = /\[\[([^\]]+)\]\]/g;
const MARKDOWN = /\[[^\]]*\]\(([^)]+)\)/g;
const ESQUEMA = /^[a-z][a-z0-9+.-]*:/i;
/** Fonts de fora de l'SCC que la porta també reescriu: l'estat viu i el seu punter. */
export const FONTS_AGENTS = Object.freeze(['.agents/ESTAT.md', '.agents/ON_ESTIC.md']);
const TORNS = `${CAMINS.agents}/runtime/turns`;
const LAB = `${CAMINS.escriptori}/02_investigacio_ia/`;

export const hashBytes = (bytes) => sha(bytes);
const senseMd = (nom) => nom.replace(/\.md$/i, '');
const curt = (id) => String(id).slice(0, 13);
const relatiu = (arrel, abs) => path.relative(arrel, abs).split(path.sep).join('/');

/** Enllaç amb el nom d'un document mogut que no s'hi pot resoldre: atura l'arxivat. */
export class ErrorEnllac extends Error {
  constructor(font, enllac, motiu) {
    super(`${font}: l'enllaç «${enllac}» ${motiu}`);
    this.font = font;
    this.enllac = enllac;
    this.motiu = motiu;
  }
}

/** Classe d'una font: només les reescriptibles es toquen; la resta, si cal, atura. */
export function classeDe(rel) {
  if (humanZone(rel)) return 'humana';
  if (rel.toLowerCase().startsWith(LAB.toLowerCase())) return 'laboratori';
  if (rel.startsWith(`${CAMINS.wiki}/`) || FONTS_AGENTS.includes(rel)) return 'reescriptible';
  return 'fora';
}

/** El conjunt de l'SCC (per al resolutor) i les fonts amb la seua classe. */
export async function documentsAuditats(arrel) {
  arrel = path.resolve(arrel);
  const scc = new VerificadorSCC(arrel);
  const fitxers = await scc.getAllMarkdownFiles(scc.wikiRoot);
  const fonts = fitxers.map((abs) => { const rel = relatiu(arrel, abs); return { rel, abs, classe: classeDe(rel) }; });
  for (const rel of FONTS_AGENTS) {
    const abs = path.join(arrel, rel);
    let stat;
    try { stat = fs.lstatSync(abs); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    if (stat.isFile() && !stat.isSymbolicLink()) fonts.push({ rel, abs, classe: 'reescriptible' });
  }
  return { fitxers, fonts, errors: scc.errors };
}

function liniaDe(text, i) {
  const inici = text.lastIndexOf('\n', i - 1) + 1;
  const final = text.indexOf('\n', i);
  return text.slice(inici, final < 0 ? text.length : final);
}
/** Fila de taula: un «|» fora dels wikilinks. Ací no s'afig àlies (rompria la cel·la). */
const esFilaDeTaula = (linia) => linia.replace(/\[\[[^\]\n]*\]\]/g, '').includes('|');

/** Final del bloc de frontmatter (0 si no n'hi ha): és YAML, no prosa. */
function finalFrontmatter(text) {
  const s = splitFrontmatter(text);
  return s.hasFrontmatter ? text.length - s.body.length : 0;
}

/** Errors d'esquema (tooling/wiki/schema.json) que té `despres` i no tenia `abans`. Sense esquema llegible, no es pot jutjar: error. */
function errorsNousEsquema(arrel, abans, despres) {
  let esquema;
  try { esquema = json(path.join(arrel, 'tooling/wiki/schema.json')); checkSchema(esquema); }
  catch (error) { return [`no es pot llegir tooling/wiki/schema.json (${error.message})`]; }
  const errors = (text) => { try { return validateSchema(parseDocument(text).data, esquema); } catch (error) { return [error.message]; } };
  const vells = new Set(errors(abans));
  return errors(despres).filter((e) => !vells.has(e));
}

/** Camí relatiu des de la carpeta de la font fins al destí, amb la forma de l'original. */
function nouCami(rel, desti, { wiki, ambExtensio, codificat }) {
  let cami = path.posix.relative(path.posix.dirname(rel), desti);
  if (!cami.startsWith('.')) cami = `./${cami}`;
  if (wiki && !ambExtensio) cami = cami.replace(/\.md$/, '');
  return codificat ? encodeURI(cami) : cami;
}

/**
 * Pura respecte de l'escriptura: llig el disc només per a resoldre (i l'esquema, si toca el
 * frontmatter). Torna el text nou i les substitucions sobre el text d'entrada. Conserva àlies,
 * fragments, consultes, títols, incrustacions i els bytes de fora del camí. Codi i comentaris
 * són opacs (markdownProse). Al frontmatter (YAML) no s'afig àlies, i si el camí nou hi trenca
 * l'esquema llança ErrorEnllac: el pla s'atura i, a l'aplicació, es desfà tot.
 * `nomesMarkdown`: l'índex de l'Escriptori, els wikilinks del qual porta `despenja`.
 */
export function reescriuEnllacos(arrel, rel, text, moviments, fitxers, { nomesMarkdown = false } = {}) {
  arrel = path.resolve(arrel);
  const font = path.resolve(arrel, rel);
  const perOrigen = new Map(moviments.map((m) => [path.resolve(arrel, m.rel), m]));
  // APFS no distingix majúscules: el camí real (amb la caixa del disc) també identifica el mogut.
  const real = (abs) => { try { return fs.realpathSync.native(abs); } catch { return null; } };
  const perReal = new Map(moviments.map((m) => [real(path.resolve(arrel, m.rel)), m]).filter(([clau]) => clau));
  const destins = new Set(moviments.map((m) => path.resolve(arrel, m.desti)));
  const noms = new Set(moviments.map((m) => senseMd(m.nom)));
  const net = markdownProse(text);
  const fm = finalFrontmatter(text);
  const substitucions = [];

  // Un enllaç que ja apunta al destí (escrit per avançat) no és cap enllaç trencat.
  const apuntaAlDesti = (kind, target) => {
    let t;
    try { t = decodeURIComponent(target); } catch { return false; }
    const variants = kind === 'wiki' && !path.extname(t) ? [t, `${t}.md`] : [t];
    return variants.some((v) => {
      const llocs = kind === 'markdown' || v.startsWith('./') || v.startsWith('../') ? [path.resolve(path.dirname(font), v)]
        : v.includes('/') ? [path.resolve(arrel, v), path.resolve(arrel, CAMINS.wiki, v), path.resolve(path.dirname(font), v)] : [];
      return llocs.some((l) => destins.has(l));
    });
  };
  /** { estat: 'mogut' | 'altre' | 'fallit' | 'nom', mv?, error? } */
  const resol = (kind, target) => {
    if (!target || ESQUEMA.test(target) || apuntaAlDesti(kind, target)) return { estat: 'altre' };
    let trobat;
    try { trobat = resolveDocumentLink({ kind, target }, font, fitxers, arrel); }
    catch (error) {
      let nom;
      try { nom = path.posix.basename(decodeURIComponent(target)); } catch { return { estat: 'fallit' }; }
      return noms.has(senseMd(nom)) ? { estat: 'nom', error } : { estat: 'fallit' };
    }
    const mv = perOrigen.get(trobat) ?? perReal.get(real(trobat));
    return mv ? { estat: 'mogut', mv } : { estat: 'altre' };
  };
  const atura = (mostra, error) => {
    throw new ErrorEnllac(rel, mostra, `porta el nom d'un document que es mou però no s'hi resol (${error.message}): fes-lo inequívoc amb camí o corregix-lo abans d'arxivar; no s'ha mogut res`);
  };

  if (!nomesMarkdown) for (const m of net.matchAll(WIKI)) {
    const inici = m.index + 2, final = m.index + m[0].length - 2;
    const interior = text.slice(inici, final);
    const target = interior.replace(/\\(?=[|#])/g, '').split('|')[0].split('#')[0].trim();
    const r = resol('wiki', target);
    if (r.estat === 'nom') atura(`[[${interior}]]`, r.error);
    if (r.estat !== 'mogut') continue;
    let tall = interior.search(/[|#]/);
    if (tall > 0 && interior[tall - 1] === '\\') tall -= 1;
    const cru = tall < 0 ? interior : interior.slice(0, tall);
    const sufix = tall < 0 ? '' : interior.slice(tall);
    const cami = nouCami(rel, r.mv.desti, { wiki: true, ambExtensio: Boolean(path.extname(target)), codificat: /%[0-9a-f]{2}/i.test(target) });
    const davant = cru.slice(0, cru.length - cru.trimStart().length);
    const darrere = cru.slice(cru.trimEnd().length);
    // C7: el text visible es conserva amb un àlies, fora d'incrustacions, de files de taula i del frontmatter.
    const incrustat = m.index > 0 && text[m.index - 1] === '!';
    const alies = !incrustat && m.index >= fm && !sufix.includes('|') && !esFilaDeTaula(liniaDe(net, m.index)) ? `|${interior.trim()}` : '';
    substitucions.push({ inici, final, de: interior, a: `${davant}${cami}${darrere}${sufix}${alies}` });
  }

  for (const m of net.matchAll(MARKDOWN)) {
    const contingut = m[1];
    const base = m.index + m[0].length - 1 - contingut.length;
    const objectiuScc = contingut.trim().replace(/^<|>$/g, '').split('#')[0].split('?')[0];
    // La URL: entre <> o fins al primer espai; títol, fragment i consulta es conserven.
    const marge = contingut.length - contingut.trimStart().length;
    const cos = contingut.slice(marge);
    let ui, uf;
    if (cos.startsWith('<')) { ui = marge + 1; const t = cos.indexOf('>'); uf = t < 0 ? contingut.length : marge + t; }
    else { ui = marge; const s = cos.search(/\s/); uf = s < 0 ? contingut.length : marge + s; }
    const url = contingut.slice(ui, uf);
    const q = url.search(/[?#]/);
    const camiCru = q < 0 ? url : url.slice(0, q);
    let mv = null, nom = null, decidit = false;
    for (const target of [...new Set([objectiuScc, camiCru.trim()])].filter(Boolean)) {
      const r = resol('markdown', target);
      if (r.estat === 'mogut') { mv = r.mv; decidit = true; break; }
      if (r.estat === 'altre') { decidit = true; break; }
      if (r.estat === 'nom') nom ??= r.error;
    }
    if (!decidit && nom) atura(`[…](${contingut})`, nom);
    if (!mv) continue;
    const cami = nouCami(rel, mv.desti, { wiki: false, codificat: /%[0-9a-f]{2}/i.test(camiCru) });
    const davant = camiCru.slice(0, camiCru.length - camiCru.trimStart().length);
    const darrere = camiCru.slice(camiCru.trimEnd().length);
    substitucions.push({ inici: base + ui, final: base + ui + camiCru.length, de: camiCru, a: `${davant}${cami}${darrere}` });
  }

  substitucions.sort((a, b) => a.inici - b.inici);
  for (let i = 1; i < substitucions.length; i++) {
    if (substitucions[i].inici < substitucions[i - 1].final) throw new ErrorEnllac(rel, substitucions[i].de, 'es encavalca amb un altre enllaç: corregix-lo a mà abans d\'arxivar; no s\'ha mogut res');
  }
  let nou = text;
  for (const s of [...substitucions].reverse()) nou = nou.slice(0, s.inici) + s.a + nou.slice(s.final);
  const alFrontmatter = substitucions.find((s) => s.inici < fm);
  if (alFrontmatter) {
    const nous = errorsNousEsquema(arrel, text, nou);
    if (nous.length) throw new ErrorEnllac(rel, alFrontmatter.de, `és al frontmatter i reapuntar-lo trencaria l'esquema (${nous.join('; ')}): corregix-lo a mà abans d'arxivar; no s'ha mogut res`);
  }
  return { text: nou, substitucions };
}

/** Inversa exacta: torna els bytes d'abans a partir del text nou i del rastre. */
export function desfesSubstitucions(textNou, substitucions) {
  let eixida = '', pos = 0, desplacament = 0;
  for (const s of [...substitucions].sort((a, b) => a.inici - b.inici)) {
    const inici = s.inici + desplacament;
    if (textNou.slice(inici, inici + s.a.length) !== s.a) throw new Error(`Rastre que no casa amb el text a l'offset ${s.inici}`);
    eixida += textNou.slice(pos, inici) + s.de;
    pos = inici + s.a.length;
    desplacament += s.a.length - (s.final - s.inici);
  }
  return eixida + textNou.slice(pos);
}

/** Registres de torn llegibles. Un registre il·legible és un avís: no es pot jutjar. */
function llegeixTorns(arrel, avisos) {
  const dir = path.join(arrel, TORNS);
  const torns = new Map();
  let noms;
  try { noms = fs.readdirSync(dir); } catch (error) { if (error.code === 'ENOENT') return torns; throw error; }
  for (const nom of noms.filter((n) => n.endsWith('.json')).sort()) {
    const id = nom.slice(0, -5);
    if (!turnPattern.test(id)) continue;
    try { torns.set(id, readTurn(arrel, id, { closed: true, expired: true })); }
    catch (error) { avisos.push(`Registre de torn il·legible: ${TORNS}/${nom} (${error.message}); no s'ha pogut jutjar.`); }
  }
  return torns;
}

const genuina = (torn) => Array.isArray(torn.verification?.checks) && torn.verification.checks.length > 0
  && !torn.verification.checks.every((c) => c === 'expire-close');

function rebutDe(text) {
  let reflex = null;
  try { reflex = parseDocument(text).data.reflex; } catch { return null; }
  const m = typeof reflex === 'string' ? receiptPattern.exec(reflex) : null;
  return m ? { torn: m[1], rebut: m[2] } : null;
}

/* ── Porta Frontmatter (F9) des del pla · Gauntlet G1-A-integ-01 ──────────────────────────
   Un vincle reescrit a `[[../90_arxiu_historic/X|X]]` és vàlid però no compta com a nota viva:
   si X era l'única de «## Vincles», el viu guanya «Falta una nota interna única i diferent» i
   el hook queda roig («Zero tolerància» al fitxer modificat o «El deute ha pujat»). Un viu que
   la porta no reescriu (fora de les fonts) hi guanyaria «unresolved». El tractor és una CLI i
   no s'importa: ací se'n replica l'abast (frontmatter-abast.json) i la regla de validaVincles,
   amb el mateix resolutor (parse.mjs); tests/olivera-arxiva-enllacos.test.mjs ho compara amb
   el tractor real. */
const ABAST_FM = 'tooling/wiki/frontmatter-abast.json';
const ABAST_FM_DEFECTE = Object.freeze({
  arrels: ['.'],
  exclou: ['node_modules', '.git', '.hg', '.svn', 'dist', 'build', 'coverage',
    '.vite', '.next', '.nuxt', '.cache', '.turbo', '.obsidian', '.sdp-paperera',
    '90_historic', '90_arxiu_historic', '.quarantena-*', 'bot'],
  immutables: [],
});
const ARXIU_HISTORIC = `${CAMINS.arxiuHistoric}/`;
const SESSIO_ARXIU = /^\d{6}_[A-Za-z0-9]+(?:_[A-Za-z0-9]+)*$/;
const FALTA_VIVA = 'Falta una nota interna única i diferent';
/** Glob de l'abast, idèntic al del tractor (`**` i `*`). */
const globRegex = (p) => new RegExp('^' + p
  .replace(/[.+^${}()|[\]\\]/g, '\\$&')
  .replace(/\*\*\//g, '\u0001')
  .replace(/\*\*/g, '\u0000')
  .replace(/\*/g, '[^/]*')
  .replace(/\u0000/g, '.*')
  .replace(/\u0001/g, '(?:.*/)?') + '$');

/* Graf d'importació estable (el control D6 de porta-olivera-diagnosi en copia la llista): els
   mòduls de les portes es carreguen amb import() i només quan un filtre textual barat diu que
   cal. Si no es poden carregar, s'atura (fail-closed). */
const plana = (s) => String(s).normalize('NFC').toLocaleLowerCase('ca').trim(); // normalitza() de wiki/lib/text.mjs

/** Recorregut del tractor sense podar l'arxiu: isDocumentArchive és per prefix i es pot aplicar després, fitxer a fitxer. */
function documentsAmplis(arrel) {
  const abast = path.join(arrel, ABAST_FM);
  const cfg = fs.existsSync(abast) ? { ...ABAST_FM_DEFECTE, ...json(abast) } : ABAST_FM_DEFECTE;
  const exclou = cfg.exclou.map((p) => globRegex(p.includes('/') ? p : `**/${p}`));
  const immutables = cfg.immutables.map(globRegex);
  const trobats = [];
  const recorre = (rel) => {
    let entrades;
    try { entrades = fs.readdirSync(rel ? path.join(arrel, rel) : arrel, { withFileTypes: true }); } catch { return; }
    for (const e of entrades) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (exclou.some((re) => re.test(r))) continue;
      if (e.isSymbolicLink()) continue;
      if (e.isDirectory()) recorre(r);
      else if (e.name.toLowerCase().endsWith('.md')) trobats.push(r);
    }
  };
  for (const a of cfg.arrels.join(',').split(',').map((s) => s.trim()).filter(Boolean)) {
    recorre(a === '.' ? '' : a.replace(/^\.\//, '').replace(/\/+$/, ''));
  }
  return [...new Set(trobats)].sort()
    .filter((n) => !immutables.some((re) => re.test(n)))
    .map((n) => { try { return { relPath: n, content: fs.readFileSync(path.join(arrel, n), 'utf8') }; } catch { return null; } })
    .filter(Boolean);
}

/** Els documents que jutja la Porta Frontmatter ({ relPath, content }), amb el mateix abast i recorregut. */
export async function universFrontmatter(arrel) {
  const { isDocumentArchive } = await import('../lib/document-corpus.mjs');
  return documentsAmplis(path.resolve(arrel)).filter((d) => !isDocumentArchive(d.relPath));
}

/** esNotaArxivada del tractor; `afegits`: destins que encara no hi són (els moviments del pla). */
function arxivadesDe(arrel, afegits = []) {
  const extra = new Map();
  for (const desti of afegits) {
    const carpeta = `${path.posix.dirname(desti)}/`;
    if (!extra.has(carpeta)) extra.set(carpeta, new Set());
    extra.get(carpeta).add(path.posix.basename(desti));
  }
  const noms = new Map();
  return (target, relPath) => {
    const t = target.trim();
    if (!/(^|\/)90_arxiu_historic\//.test(t)) return false;
    const cami = path.posix.normalize(path.posix.join(path.posix.dirname(relPath), `${t.replace(/\.md$/i, '')}.md`));
    if (!cami.startsWith(ARXIU_HISTORIC)) return false;
    const parts = cami.slice(ARXIU_HISTORIC.length).split('/');
    if (parts.length > 2 || (parts.length === 2 && !SESSIO_ARXIU.test(parts[0]))) return false;
    const carpeta = parts.length === 2 ? `${ARXIU_HISTORIC}${parts[0]}/` : ARXIU_HISTORIC;
    if (!noms.has(carpeta)) {
      let presents;
      try {
        presents = new Set(fs.readdirSync(path.join(arrel, carpeta), { withFileTypes: true }).filter((e) => e.isFile()).map((e) => e.name));
      } catch { presents = new Set(); }
      for (const n of extra.get(carpeta) ?? []) presents.add(n);
      noms.set(carpeta, presents);
    }
    return noms.get(carpeta).has(parts[parts.length - 1]);
  };
}

/** validaVincles del tractor (mateixos missatges), més les notes vives que compta. `P`: parse.mjs. */
function avaluaVincles(doc, resolver, P, esArxivada) {
  const p = parseFrontmatter(doc.content);
  if (p.malformed || p.errors.length) return { errors: ['YAML no llegible'], vives: [] };
  const seccions = [];
  let actual = null;
  for (const line of P.liveMarkdown(p.body).split('\n')) {
    const h = /^ {0,3}(#{1,6})[\t ]+(.+?)(?:[\t ]+#+)?[\t ]*$/.exec(line);
    if (h && h[1].length <= 2) {
      actual = h[1].length === 2 && h[2] === 'Vincles' ? [] : null;
      if (actual) seccions.push(actual);
    } else if (actual) {
      actual.push(line);
    }
  }
  if (seccions.length !== 1) return { errors: ['Cal exactament una secció real ## Vincles'], vives: [] };
  const errors = [], vives = [];
  for (const line of seccions[0]) {
    if (!line.trim()) continue;
    const item = /^ {0,3}[-*][\t ]+(\[\[[^[\]\n]+\]\])[\t ]*$/.exec(line);
    if (!item || item[1].includes('\\')) { errors.push('Vincles només admet una llista de wikilinks sencers'); continue; }
    const links = P.extractLinks(item[1]);
    if (links.length !== 1 || /[#^]/.test(links[0].target)) { errors.push('Cal enllaçar una nota sencera, sense fragments'); continue; }
    const r = P.resolveLink(links[0], doc, resolver);
    if (r.status === 'resolved' && r.doc.relPath !== doc.relPath) vives.push(r.doc.relPath);
    else if (r.status === 'unresolved' && esArxivada(P.safeDecode(links[0].target), doc.relPath)) continue;
    else errors.push(`${links[0].target}: ${r.status === 'resolved' ? 'autoreferència' : r.status}`);
  }
  if (!vives.length) errors.push(FALTA_VIVA);
  return { errors, vives };
}

/** F9 de tot l'abast amb la regla replicada ({ relPath: errors }): la prova de paritat la compara amb el tractor. */
export async function fallidesF9(arrel) {
  arrel = path.resolve(arrel);
  const P = await import('../wiki/core/parse.mjs');
  const univers = await universFrontmatter(arrel);
  const resolver = P.buildResolver(univers);
  const esArxivada = arxivadesDe(arrel);
  const out = {};
  for (const d of univers) {
    const { errors } = avaluaVincles(d, resolver, P, esArxivada);
    if (errors.length) out[d.relPath] = errors;
  }
  return out;
}

/** Filtre ample i sense resolutor: algun [[…]] des del primer «## Vincles» porta el nom base o un àlies d'un mogut? */
function nomenaMoguts(content, bases, alies) {
  const inici = content.search(/##[\t ]+Vincles/);
  if (inici < 0) return false;
  for (const m of content.slice(inici).matchAll(/\[\[([^[\]\n]+)\]\]/g)) {
    let t = m[1].split('|')[0];
    try { t = decodeURIComponent(t); } catch { /* com safeDecode: es queda cru */ }
    t = t.replace(/\\/g, '/').replace(/[#^].*$/, '').trim().replace(/\.md$/i, '');
    if (bases.has(plana(path.posix.basename(t))) || alies.has(plana(t))) return true;
  }
  return false;
}

/** nomsSolts de la porta: fitxers regulars visibles del primer nivell de l'Escriptori, el cens de resolAncora. */
function escriptoriSolts(arrel) {
  try {
    return new Set(fs.readdirSync(path.join(arrel, CAMINS.escriptori), { withFileTypes: true })
      .filter((e) => e.isFile() && !e.name.startsWith('.')).map((e) => e.name));
  } catch { return new Set(); } // cens buit: no es lleva res de l'índex i un vincle al mogut hi falla (fail-closed)
}

/** resolAncora de porta-olivera.mjs (referent, nomPrimerNivell i resolNomExacte): nom del primer nivell d'una àncora crua. */
function ancoraPrimerNivell(raw, presents) {
  const ref = path.posix.normalize(raw.replace(/\\(?=[|#])/g, '').split(/[|#]/)[0].trim());
  const cami = [path.posix.join(CAMINS.escriptori, ref), path.posix.join(CAMINS.wiki, ref), ref]
    .find((c) => path.posix.dirname(c) === CAMINS.escriptori);
  if (!cami) return null;
  const nom = path.posix.basename(cami);
  return presents.has(nom) ? nom : !path.posix.extname(nom) && presents.has(`${nom}.md`) ? `${nom}.md` : null;
}

/** L'índex tal com el deixa `despenja`, per a F9: fora els ítems d'un sol wikilink que resolAncora porta a un mogut
 *  (amb --reapunta passen a l'arxiu, que tampoc compta com a viu ni falla). Un àlies o un altre nom hi queda. */
function indexDespenjat(content, nomsMoguts, presents) {
  return content.split(/(?<=\n)/).filter((linia) => {
    const item = /^ {0,3}[-*][\t ]+\[\[([^[\]\n]+)\]\][\t ]*\r?\n?$/.exec(linia);
    return !(item && nomsMoguts.has(ancoraPrimerNivell(item[1], presents)));
  }).join('');
}

const missatgeF9 = (rel, guanyats) => `${rel}: després de l'arxivat, «## Vincles» ${guanyats.includes(FALTA_VIVA) ? 'quedaria sense cap nota viva resoluble' : 'guanyaria fallades'} a la Porta Frontmatter (F9: ${guanyats.join('; ')}). Afig-hi una nota viva (p. ex. «- [[00_index]]») o corregix el vincle a mà abans d'arxivar; no s'ha mogut res.`;

/** Aturades per F9 nou: compara cada viu afectat abans i després (moguts fora, textos reescrits, destins a l'arxiu). */
async function aturadesF9(arrel, moviments, reescriptures) {
  let amplis;
  try { amplis = documentsAmplis(arrel); }
  catch (error) { return [`No es pot reproduir l'abast de la Porta Frontmatter (${ABAST_FM}: ${error.message}): sense abast no es pot garantir F9; no s'ha mogut res.`]; }
  const moguts = new Set(moviments.map((m) => m.rel));
  const bases = new Set(moviments.map((m) => plana(senseMd(m.nom))));
  const alies = new Set();
  for (const m of moviments) {
    let a = null;
    try { a = parseFrontmatter(fs.readFileSync(path.join(arrel, m.rel), 'utf8')).data.aliases; } catch { /* sense àlies llegibles */ }
    if (Array.isArray(a)) for (const x of a) alies.add(plana(x));
  }
  const candidats = amplis.filter((d) => !moguts.has(d.relPath) && nomenaMoguts(d.content, bases, alies));
  if (!candidats.length) return [];
  // parse.mjs resol l'arrel en carregar-se: només es carrega si cal i, si no pot, s'atura (fail-closed).
  let P, isDocumentArchive;
  try { [P, { isDocumentArchive }] = await Promise.all([import('../wiki/core/parse.mjs'), import('../lib/document-corpus.mjs')]); }
  catch (error) { return [`${candidats.map((d) => d.relPath).join(', ')}: «## Vincles» nomena un document que es mou, però el resolutor de la Porta Frontmatter no s'ha pogut carregar (${error.message}); sense resolutor no es pot garantir F9: no s'ha mogut res.`]; }
  const univers = amplis.filter((d) => !isDocumentArchive(d.relPath));
  const afectats = candidats.filter((d) => !isDocumentArchive(d.relPath));
  const nous = new Map(reescriptures.map((r) => [r.rel, r.despres]));
  const despres = univers.filter((d) => !moguts.has(d.relPath))
    .map((d) => (nous.has(d.relPath) ? { relPath: d.relPath, content: nous.get(d.relPath) } : d));
  const perRel = new Map(despres.map((d) => [d.relPath, d]));
  const resolAbans = P.buildResolver(univers), resolDespres = P.buildResolver(despres);
  const arxAbans = arxivadesDe(arrel), arxDespres = arxivadesDe(arrel, moviments.map((m) => m.desti));
  const nomsMoguts = new Set(moviments.map((m) => m.nom));
  const presents = escriptoriSolts(arrel);
  const aturades = [];
  for (const d of afectats) {
    const abans = avaluaVincles(d, resolAbans, P, arxAbans);
    // L'índex no és cap reescriptura: el reescriu `despenja` en aplicar, i es jutja amb el text que en deixa.
    const despresDoc = d.relPath === CAMINS.indexEscriptori
      ? { relPath: d.relPath, content: indexDespenjat(d.content, nomsMoguts, presents) }
      : perRel.get(d.relPath);
    // Només atura el que guanya: el deute F9 que el viu ja portava no és cosa de l'arxivat.
    const vells = new Set(abans.errors);
    const guanyats = [...new Set(avaluaVincles(despresDoc, resolDespres, P, arxDespres).errors.filter((e) => !vells.has(e)))];
    if (guanyats.length) aturades.push(missatgeF9(d.relPath, guanyats));
  }
  return aturades;
}

/* ── Porta Doctrina des del pla · Gauntlet G1-A-integ-02 ─────────────────────────────────
   La porta només reescriu enllaços ([[…]] i […](…)); un camí en codi inline o en prosa no
   ho és, però tooling/gates/tractor-doctrina.mjs el llig a l'abast per defecte (.agents, amb
   el text operatiu d'ESTAT i LEDGER) i, després del trasllat, el camí vell seria ABSENT.
   Defecte conservador: s'atura i es nomena la línia; reescriure codi a cegues, mai. Es
   replica l'extracció de candidatsDeLinia (la CLI no s'importa). Un nom sol sense carpeta no
   atura: la Doctrina el troba a l'arxiu pel sufix. */
const DOCTRINA_EXCLOU_DIR = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'vendor', 'coverage', '.sdp-paperera', '.sdp-reflex']);
const DOCTRINA_IGNORA = ['.agents/doctrina-ignora.txt', 'tooling/gates/doctrina-ignora.txt'];

/** Els .md de l'abast per defecte de la Doctrina (recullMd), sense podar l'evidència d'execució: es filtra després. */
function documentsDoctrina(arrel) {
  const out = [];
  const recull = (rel) => {
    let entrades;
    try { entrades = fs.readdirSync(path.join(arrel, rel), { withFileTypes: true }); } catch { return; }
    for (const e of entrades) {
      if (DOCTRINA_EXCLOU_DIR.has(e.name)) continue;
      const r = `${rel}/${e.name}`;
      if (e.isDirectory()) recull(r);
      else if (e.name.endsWith('.md')) out.push(r);
    }
  };
  recull(CAMINS.agents);
  return out;
}

/** Els tokens que candidatsDeLinia prova, amb la forma en què apareixen. */
function* candidatsDoctrina(linia, dinsCodi) {
  for (const m of linia.matchAll(/`([^`\n]+)`/g)) for (const tros of m[1].split(/\s+/)) yield [tros, 'en codi inline'];
  for (const m of linia.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
    if (!/^doc-[0-9a-f-]+/i.test(m[1])) yield [m[1].split('#')[0], "a la destinació d'un enllaç Markdown"];
  }
  if (dinsCodi) return;
  const netejada = linia.replace(/`[^`\n]*`/g, ' ').replace(/\[\[[^\]]*\]\]/g, ' ');
  for (const m of netejada.matchAll(/[A-Za-z0-9_./~-]+\.[a-z0-9]{1,6}\b/g)) yield [m[0], 'en prosa'];
}

/** Aturades per camins al document mogut que la Doctrina veuria ABSENT (sobre el text que quedaria). */
async function aturadesDoctrina(arrel, moviments, reescriptures) {
  const nous = new Map(reescriptures.map((r) => [r.rel, r.despres]));
  // Filtre barat: cap camí al mogut sense el seu nom de fitxer (la Doctrina no descodifica res).
  const noms = moviments.map((m) => m.nom.toLowerCase());
  const textos = [];
  for (const rel of documentsDoctrina(arrel)) {
    let text = nous.get(rel);
    if (text === undefined) { try { text = fs.readFileSync(path.join(arrel, rel), 'utf8'); } catch { continue; } }
    const baix = text.toLowerCase();
    if (noms.some((n) => baix.includes(n))) textos.push([rel, text]);
  }
  if (!textos.length) return [];
  let isExecutionEvidence, operationalDocumentText;
  try { [{ operationalDocumentText }, { isExecutionEvidence }] = await Promise.all([import('../lib/document-corpus.mjs'), import('../lib/corpus-scope.mjs')]); }
  catch (error) { return [`${textos.map(([rel]) => rel).join(', ')}: citen un document que es mou, però l'abast de la Porta Doctrina no s'ha pogut carregar (${error.message}); no s'ha mogut res.`]; }
  const fitxerIgnora = DOCTRINA_IGNORA.map((r) => path.join(arrel, r)).find((f) => fs.existsSync(f));
  const ignorats = fitxerIgnora
    ? fs.readFileSync(fitxerIgnora, 'utf8').split(/\r?\n/).map((l) => l.replace(/#.*$/, '').trim()).filter(Boolean)
    : [];
  const esIgnorat = (p) => ignorats.some((pref) => p === pref || p.startsWith(pref.endsWith('/') ? pref : `${pref}/`));
  const moguts = moviments.map((m) => ({ m, baix: m.rel.toLowerCase() }));
  const aturades = [];
  for (const [rel, text] of textos) {
    if (isExecutionEvidence(rel)) continue;
    const operatiu = operationalDocumentText(text, rel);
    const inici = operatiu === text ? 0 : text.indexOf(operatiu);
    const desplacament = inici > 0 ? text.slice(0, inici).split(/\r?\n/).length - 1 : 0;
    const vistos = new Set();
    let dinsCodi = false;
    for (const [i, linia] of operatiu.split(/\r?\n/).entries()) {
      if (/^\s*(```|~~~)/.test(linia)) { dinsCodi = !dinsCodi; continue; }
      for (const [brut, forma] of candidatsDoctrina(linia, dinsCodi)) {
        // La normalització d'esCandidat: puntuació final, sufix de línia i barra final.
        const c = brut.trim().replace(/[.,;:]+$/, '')
          .replace(/:[0-9]+(?:[-–][0-9]+)?(?:,[0-9]+(?:[-–][0-9]+)?)*(?::[0-9]+)?$/, '').replace(/\/+$/, '');
        if (!c.includes('/') || c.length > 240 || /[\s*?<>|"']/.test(c) || /^(https?:|mailto:|#|<|\{)/.test(c)) continue;
        if (c.startsWith('../') || c.startsWith('~/') || c.startsWith('/') || esIgnorat(c) || vistos.has(c)) continue;
        // Els tres llocs on resol() la trobaria: arrel (R() és path.join: normalitza «./» i «x/../»),
        // sufix únic (cru, com la porta) i carpeta del document (APFS: sense caixa).
        const baix = c.toLowerCase();
        const desDeLArrel = path.posix.normalize(baix);
        const desDelDoc = path.posix.normalize(path.posix.join(path.posix.dirname(rel), c)).toLowerCase();
        const hit = moguts.find((x) => desDeLArrel === x.baix || x.baix.endsWith(`/${baix}`) || desDelDoc === x.baix);
        if (!hit) continue;
        vistos.add(c);
        aturades.push(`${rel}:${desplacament + i + 1} cita «${c}» ${forma}, el camí d'un document que es mou (${hit.m.rel}): la porta no reescriu camins fora d'enllaços i la Porta Doctrina el veuria ABSENT després del trasllat. Corregix-lo a mà (p. ex. «${hit.m.desti}») o lleva'l abans d'arxivar; no s'ha mogut res.`);
      }
    }
  }
  return aturades;
}

/**
 * El pla sencer, sobre el disc d'abans. `bruts`: el que torna `arxivables` ({ nom, rel }).
 * Les col·lisions de destí no es mouen (la nota de sempre) i no entren als moviments.
 */
export async function planificaArxiu(arrel, { bruts = [], carpeta = CAMINS.arxiuHistoric, reapunta = false, torn = null, ara = Date.now() } = {}) {
  arrel = path.resolve(arrel);
  const aturades = [], avisos = [];
  const moviments = [];
  for (const d of bruts) {
    const desti = `${carpeta}/${d.nom}`;
    try { fs.lstatSync(path.join(arrel, desti)); continue; } catch (error) { if (error.code !== 'ENOENT') throw error; }
    const bytes = fs.readFileSync(path.join(arrel, d.rel));
    moviments.push({ nom: d.nom, rel: d.rel, desti, hash: hashBytes(bytes), rebut: d.nom.endsWith('.md') ? rebutDe(bytes.toString('utf8')) : null });
  }

  const { fitxers, fonts, errors } = await documentsAuditats(arrel);
  for (const e of errors) {
    const lloc = (e.affected_files || []).join(', ');
    if (e.code === 'SCC_IO') aturades.push(`No s'ha pogut llegir el conjunt de l'SCC (${lloc}: ${e.message}): sense conjunt sencer no es pot saber qui enllaça els moguts.`);
    else avisos.push(`SCC: ${e.code} ${lloc}`);
  }

  const reescriptures = [];
  let index = null;
  const moguts = new Set(moviments.map((m) => m.rel));
  if (moviments.length) for (const f of fonts) {
    if (moguts.has(f.rel)) continue;
    const esIndex = f.rel === CAMINS.indexEscriptori;
    let text;
    try { text = fs.readFileSync(f.abs, 'utf8'); } catch (error) { aturades.push(`${f.rel}: no es pot llegir (${error.code || error.message}).`); continue; }
    let r;
    try { r = reescriuEnllacos(arrel, f.rel, text, moviments, fitxers, { nomesMarkdown: esIndex }); }
    catch (error) { if (error instanceof ErrorEnllac) { aturades.push(error.message); continue; } throw error; }
    if (!r.substitucions.length) continue;
    const quins = [...new Set(r.substitucions.map((s) => s.de.trim()))].join(', ');
    if (f.classe !== 'reescriptible') {
      const on = { humana: 'zona humana (01_produccio)', laboratori: 'laboratori (02_investigacio_ia)', fora: 'fora de la Wiki' }[f.classe];
      aturades.push(`${f.rel} (${on}) enllaça ${quins}: fora de l'abast de la porta; corregix-ho a mà o decidix-ho amb el Mestre abans d'arxivar.`);
      continue;
    }
    const stat = fs.lstatSync(f.abs);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) { aturades.push(`${f.rel} enllaça ${quins} però no és un fitxer regular propi (enllaç dur o simbòlic): no es reescriu a cegues.`); continue; }
    if (esIndex) { index = { enllacos: r.substitucions.length }; continue; }
    reescriptures.push({ rel: f.rel, abans: text, despres: r.text, hashAbans: sha(text), hashDespres: sha(r.text), substitucions: r.substitucions, rebut: null });
  }
  // Gauntlet G1-A-integ-01/02: el que deixaria roges la Porta Frontmatter (F9) o la Doctrina també atura, abans de moure res.
  if (moviments.length) {
    aturades.push(...await aturadesF9(arrel, moviments, reescriptures));
    aturades.push(...await aturadesDoctrina(arrel, moviments, reescriptures));
  }

  const registres = llegeixTorns(arrel, avisos);
  const vigent = (t) => t.state !== 'closed' && Date.parse(t.expiresAt) > ara;
  const oberts = [...registres.values()].filter(vigent);
  const tancats = [], plans = [], relocated = [];

  for (const r of reescriptures) {
    const rebut = rebutDe(r.abans);
    if (!rebut) continue;
    const t = registres.get(rebut.torn);
    let motiu;
    if (t && t.state !== 'closed') {
      // validateDocument no compara hashes de torns oberts: no cal cap esmena.
      r.rebut = { torn: rebut.torn, accio: 'obert' };
      if (!vigent(t)) avisos.push(`${r.rel}: el seu rebut és d'un torn obert però caducat (${rebut.torn}); porta-documents ja el marcava i el continuarà marcant.`);
      continue;
    }
    if (!t) motiu = 'sense registre llegible';
    else {
      const rec = t.receipts?.[rebut.rebut];
      let actiu = false;
      try { actiu = Boolean(rec) && rec.id === rebut.rebut && rec.file === r.rel && isActiveReceipt(rec); } catch { actiu = false; }
      if (genuina(t) && actiu && t.verification?.files?.[r.rel] === r.hashAbans) {
        r.rebut = { torn: rebut.torn, accio: 'esmena' };
        tancats.push({ id: rebut.torn, rel: r.rel, de: r.hashAbans, a: r.hashDespres, substitucions: r.substitucions });
        continue;
      }
      motiu = !genuina(t) ? 'tancat sense verificació genuïna (buida o només expire-close)'
        : !actiu ? 'tancat, amb el rebut absent o vinculat a un altre document'
          : 'tancat, amb una preimatge que ja no casa amb el segell (el document es va editar després del tancament)';
    }
    if (r.rel.startsWith(`${CAMINS.escriptori}/`)) {
      aturades.push(`${r.rel}: el seu torn ${rebut.torn} està ${motiu}; reescriure'l deixaria roja porta-documents o rentaria una edició anterior. Decidix-ho amb el Mestre abans d'arxivar.`);
    } else {
      r.rebut = { torn: rebut.torn, accio: 'sense-esmena' };
      avisos.push(`${r.rel}: es reescriu sense esmenar el torn ${rebut.torn} (${motiu}); fora de l'Escriptori cap porta en compara el hash.`);
    }
  }

  for (const t of oberts) {
    const pla = reescriptures.find((r) => r.rel === t.plan?.file);
    if (pla) {
      if (t.plan.hash === pla.hashAbans) plans.push({ id: t.turn_id, rel: pla.rel, de: pla.hashAbans, a: pla.hashDespres });
      else avisos.push(`El pla del torn ${t.turn_id} (${pla.rel}) ja divergia del seu plan.hash: es reescriu sense rentar-lo.`);
    }
    const plaMogut = moviments.find((m) => m.rel === t.plan?.file);
    if (plaMogut && plaMogut.rebut?.torn !== t.turn_id) avisos.push(`${plaMogut.rel} és el pla vinculat del torn obert ${t.turn_id}: després del trasllat, el seu tancament demanarà un pla nou.`);
    const rels = moviments.filter((m) => (Object.hasOwn(t.initial, m.rel) || (t.ownedPaths || []).includes(m.rel)) && !(t.relocated || []).includes(m.rel)).map((m) => m.rel);
    if (rels.length) relocated.push({ id: t.turn_id, rels });
  }

  const registrar = reescriptures.length > 0 || tancats.length > 0 || plans.length > 0;
  let autor = null;
  if (torn !== null) {
    const t = typeof torn === 'string' && turnPattern.test(torn) ? registres.get(torn) : null;
    if (!t || !vigent(t)) aturades.push(`--torn ${torn}: ha de ser un torn obert i vigent de ${TORNS}/.`);
    else autor = torn;
  } else if (registrar) {
    const candidats = oberts.filter((t) => t.scope === 'documents').map((t) => t.turn_id);
    if (candidats.length === 1) autor = candidats[0];
    else aturades.push(candidats.length
      ? `Cal dir qui arxiva: hi ha ${candidats.length} torns documentals oberts (${candidats.join(', ')}); tria'n un amb --torn ID.`
      : "Cal dir qui arxiva: no hi ha cap torn documental obert i vigent; obri'n un o passa --torn ID.");
  }

  return { carpeta, reapunta, fitxers, moviments, reescriptures, index, torns: { tancats, plans, relocated, autor }, aturades, avisos };
}

/** Hi ha res a registrar o a reescriure, a banda del trasllat i el despenjat? */
export function plaAmbEfectes(pla) {
  const t = pla.torns;
  return Boolean(pla.reescriptures.length || pla.index || t.tancats.length || t.plans.length || t.relocated.length);
}

const ACCIONS = { esmena: 'torn tancat: esmena de verification.files', obert: 'torn obert: sense esmena', 'sense-esmena': 'torn tancat: sense esmena' };

/** Línies d'informe per a --sec i per a l'eixida real. */
export function textPla(pla, { sec = false } = {}) {
  const l = [];
  const t = pla.torns;
  const n = pla.reescriptures.length;
  l.push(`[Porta Olivera] Enllaços dels documents vius (resolutor de l'SCC): ${n ? `${n} document(s) ${sec ? 'es reescriurien' : 'reescrits'}` : 'cap document viu enllaça els que es mouen'}${pla.index ? ` · índex: ${pla.index.enllacos} enllaç(os) Markdown` : ''}.`);
  for (const r of pla.reescriptures) l.push(`   · ${r.rel}: ${r.substitucions.length} enllaç(os)${r.rebut ? ` · rebut ${curt(r.rebut.torn)} (${ACCIONS[r.rebut.accio]})` : ''}`);
  for (const x of t.tancats) l.push(`   · Torn tancat ${x.id}: verification.files[${x.rel}] ${x.de.slice(0, 12)}… → ${x.a.slice(0, 12)}… (rastre archive-links)`);
  for (const x of t.plans) l.push(`   · Torn obert ${x.id}: plan.hash de ${x.rel} → ${x.a.slice(0, 12)}…`);
  for (const x of t.relocated) l.push(`   · Torn obert ${x.id}: relocated += ${x.rels.join(', ')}`);
  if (t.autor && (n || t.tancats.length || t.plans.length || t.relocated.length)) l.push(`   · Autor del rastre: ${t.autor}`);
  for (const a of pla.avisos) l.push(`   ⚠️ ${a}`);
  for (const a of pla.aturades) l.push(`   ❌ ${a}`);
  if (pla.aturades.length) l.push(sec ? "[Porta Olivera] L'arxivat s'aturaria: no es mouria res." : "[Porta Olivera] Aturat: no s'ha mogut res.");
  return l;
}

/** Què s'ha de versionar junts després d'un arxivat amb efectes. */
export function liniaVersiona(pla, resultat) {
  const docs = [...new Set([...(resultat.reescrits || []), ...(resultat.index ? [CAMINS.indexEscriptori] : [])])];
  const torns = (resultat.torns || []).map((x) => `${TORNS}/${x.id}.json`);
  if (!docs.length && !torns.length) return null;
  return `[Porta Olivera] Versiona junts: ${[...docs, ...torns].join(', ')}.`;
}
