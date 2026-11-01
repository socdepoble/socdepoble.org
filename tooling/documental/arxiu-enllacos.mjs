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
import { splitFrontmatter } from '../wiki/lib/frontmatter.mjs';
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
