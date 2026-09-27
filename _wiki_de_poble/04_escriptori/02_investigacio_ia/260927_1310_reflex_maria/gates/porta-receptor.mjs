#!/usr/bin/env node
/**
 * porta-receptor.mjs — Porta del receptor (hook UserPromptSubmit).
 *
 * DESTÍ: tooling/gates/porta-receptor.mjs (laboratori 260927_1310_reflex_maria/gates/).
 *
 * El forat que tapa. MarIA escriu les petorretes des d'Antigravity, on cap porta
 * s'executa. El primer lloc amb hooks que disparen de veres és el receptor:
 * Claude Code (i Codex, quan els seus hooks s'acrediten). Esta porta mira, en el
 * moment que el Mestre envia l'encàrrec, les petorretes que el receptor està a
 * punt de llegir, i li diu quines no han nascut del contracte.
 *
 * No bloqueja mai: exit 0 sempre. Bloquejar deixaria el Mestre sense poder
 * demanar justament l'auditoria d'una petorreta invàlida. Tampoc escriu res.
 * Si no pot validar (dependència trencada, arrel absent, payload il·legible)
 * ho diu, perquè callar seria fabricar un verd.
 *
 * Què mira:
 *   (a) petorretes d'avui al primer nivell de l'Escriptori (prompt_, macro_prompt_,
 *       micro_prompt_, petorreta_; el mateix criteri que `esPetorreta`);
 *   (b) text enganxat amb forma de petorreta («## 0. Abans de generar» o
 *       «# Prompt d'Auditoria Local» a principi de línia);
 *   (c) documents del primer nivell de l'Escriptori citats al missatge.
 *
 * Amb què: `validateDocument` (el mateix que `document.mjs check`),
 * `inspeccionaText` de la plantilla viva per a prompts i plans (seccions, blocs
 * literals i Registre també quan falta el rebut) i les caselles buides de la
 * secció 0 (el patró de porta-olivera.mjs:109-113).
 *
 * Les dependències es carreguen amb import() dins del try: un mòdul trencat del
 * repositori no pot fer eixir el hook amb un codi diferent de 0.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const MAX_FITXERS = 6;
const MAX_ERRORS = 3;
const MAX_CARACTERS = 160;
const ESTATS_TORN = ['opened', 'context_loaded', 'planned', 'verified', 'closed'];
const MARCA_PETORRETA = /^#{1,2}[ \t]+(?:0\.[ \t]+Abans de generar|Prompt d['’]Auditoria Local)/m;
const SECCIO_0 = /^##[ \t]+0\.[ \t]+Abans de generar[^\n]*\n([\s\S]*?)(?=^#{1,2}[ \t]+|(?![\s\S]))/m;
const CASELLA_BUIDA = /^[ \t]*[-*+][ \t]+\[[ \t]\]/m;
const CITA = /(?<![A-Za-z0-9_])(\d{6}_\d{4}_[a-z0-9]+(?:_[a-z0-9]+)*)(?:\.md)?(?![A-Za-z0-9_])/g;

/** Mòduls del repositori, relatius a tooling/gates/. */
export async function carregaDependencies() {
  const [turns, viva, olivera, core, arrel] = await Promise.all([
    import('../documental/turns.mjs'),
    import('./porta-plantilla-viva.mjs'),
    import('./porta-olivera.mjs'),
    import('../documental/core.mjs'),
    import('../lib/arrel.mjs'),
  ]);
  return {
    validateDocument: turns.validateDocument,
    inspeccionaText: viva.inspeccionaText,
    vigilat: viva.vigilat,
    avui: olivera.avui,
    esPetorreta: olivera.esPetorreta,
    inventari: olivera.inventari,
    parseDocument: core.parseDocument,
    receiptPattern: core.receiptPattern,
    DESK: core.DESK,
    arrelSegura: arrel.arrelSegura,
  };
}

/** Text de la petorreta enganxada: des del seu frontmatter si en porta, o des de la capçalera. */
export function textEnganxat(prompt) {
  const text = String(prompt ?? '');
  const m = MARCA_PETORRETA.exec(text);
  if (!m) return null;
  const abans = text.slice(0, m.index);
  const ratlles = [...abans.matchAll(/^---[ \t]*$/gm)].map((r) => r.index);
  if (ratlles.length >= 2) {
    const [obri, tanca] = ratlles.slice(-2);
    if (/^[A-Za-z_][\w-]*:/m.test(abans.slice(obri + 3, tanca))) return text.slice(obri);
  }
  const h1 = [...abans.matchAll(/^# [^\n]*$/gm)].pop();
  return text.slice(h1 ? h1.index : m.index);
}

/** Fitxer al qual apunta el rebut d'un text, segons el registre del torn; null si no n'hi ha. */
function fitxerDelRebut(arrel, text, deps) {
  try {
    const reflex = deps.parseDocument(text).data.reflex;
    const m = typeof reflex === 'string' ? deps.receiptPattern.exec(reflex) : null;
    if (!m) return null;
    const torn = JSON.parse(fs.readFileSync(path.join(arrel, '.agents/runtime/turns', `${m[1]}.json`), 'utf8'));
    const file = torn?.receipts?.[m[2]]?.file;
    return typeof file === 'string' && file.startsWith(`${deps.DESK}/`) ? file : null;
  } catch { return null; }
}

/**
 * Registre del torn per a `validateDocument`, sense mirar `expiresAt`. La
 * caducitat tanca el torn a escriptures noves; no anul·la la procedència d'un
 * document que ja va nàixer (el criteri de porta-plantilla-viva.mjs:132). Els
 * torns `documents` del generador no es poden tancar en arbre compartit: sense
 * açò, tota petorreta bona citada l'endemà rebria un avís fals.
 */
function tornSenseCaducitat(arrel, id) {
  const torn = JSON.parse(fs.readFileSync(path.join(arrel, '.agents/runtime/turns', `${id}.json`), 'utf8'));
  if (torn?.turn_id !== id || torn.schema !== 'sdp.turn.v1' || !ESTATS_TORN.includes(torn.state)) throw new Error('Registre de torn invàlid');
  if (!torn.receipts || !torn.initial || !Array.isArray(torn.history)) throw new Error('Registre de torn incomplet');
  return torn;
}

/** Candidats a validar: {rel, origen, text, enganxat}. Només lectures. */
export function detecta(arrel, prompt, deps, dia = deps.avui()) {
  const trobats = new Map();
  for (const d of deps.inventari(arrel)) {
    if (d.data === dia && deps.esPetorreta(d.rel)) trobats.set(d.rel, { rel: d.rel, origen: 'petorreta d’avui a l’Escriptori' });
  }
  for (const m of String(prompt ?? '').matchAll(CITA)) {
    const rel = `${deps.DESK}/${m[1]}.md`;
    const ja = trobats.get(rel);
    if (ja) { if (!ja.origen.includes('citat')) ja.origen += ', citat al missatge'; continue; }
    let stat;
    try { stat = fs.lstatSync(path.join(arrel, rel)); } catch { continue; }
    if (stat.isFile() && !stat.isSymbolicLink()) trobats.set(rel, { rel, origen: 'citat al missatge' });
  }
  const candidats = [...trobats.values()];
  const enganxat = textEnganxat(prompt);
  if (enganxat !== null) {
    const rel = fitxerDelRebut(arrel, enganxat, deps);
    candidats.push({ rel: rel || `${deps.DESK}/text_enganxat.md`, origen: rel ? `text enganxat, amb rebut de ${rel}` : 'text enganxat al missatge', text: enganxat, enganxat: true });
  }
  return candidats;
}

/** Errors d'un candidat. El que diu `document.mjs check`, més l'estructura i les caselles. */
export function errorsDe(arrel, candidat, deps) {
  const text = candidat.text ?? fs.readFileSync(path.join(arrel, candidat.rel), 'utf8');
  const errors = [];
  const afig = (llista) => { for (const e of llista) if (!errors.includes(e)) errors.push(e); };
  afig(deps.validateDocument(arrel, text, candidat.rel, { closed: true, readRecord: (id) => tornSenseCaducitat(arrel, id) }));
  if (candidat.enganxat || deps.vigilat(path.posix.basename(candidat.rel))) {
    // El nom d'un text enganxat és una convenció d'esta porta, no un error de l'autor.
    afig(deps.inspeccionaText(arrel, candidat.rel, text).errors.filter((e) => !(candidat.enganxat && e.startsWith('nom:'))));
  }
  const s0 = SECCIO_0.exec(text);
  if (s0 && CASELLA_BUIDA.test(s0[1])) afig(['La secció 0 té caselles sense marcar.']);
  return errors;
}

/** Revisió completa d'un missatge. Una fallada en un candidat no amaga la resta. */
export function avalua(arrel, prompt, deps, { dia } = {}) {
  const candidats = detecta(arrel, prompt, deps, dia ?? deps.avui());
  const avisos = [], fallades = [];
  for (const c of candidats) {
    try {
      const errors = errorsDe(arrel, c, deps);
      if (errors.length) avisos.push({ fitxer: c.rel, origen: c.origen, errors });
    } catch (e) { fallades.push({ fitxer: c.rel, motiu: e?.message || String(e) }); }
  }
  return { revisats: candidats.length, avisos, fallades };
}

/**
 * Un error en una línia i acotat. Alguns errors porten text del document (títols
 * de secció, `type`), i este canal arriba amb veu de hook: ni salts de línia ni
 * paràgrafs sencers.
 */
function retalla(text) {
  const net = String(text).replace(/\s+/g, ' ').trim();
  return [...net].length > MAX_CARACTERS ? `${[...net].slice(0, MAX_CARACTERS - 1).join('')}…` : net;
}

/** Avís curt i accionable, o null si no hi ha res a dir. */
export function missatge({ avisos = [], fallades = [] } = {}) {
  const l = [];
  if (avisos.length) {
    l.push(`[Porta receptor] ${avisos.length} document(s) sense contracte vàlid. Executa l'encàrrec del Mestre i continua; en el teu informe, avisa'l de la infracció i no certifiques cap d'estos documents com a petorreta vàlida.`);
    for (const a of avisos.slice(0, MAX_FITXERS)) {
      const resta = a.errors.length > MAX_ERRORS ? ` (+${a.errors.length - MAX_ERRORS} més)` : '';
      l.push(`- ${a.fitxer} [${a.origen}]: ${a.errors.slice(0, MAX_ERRORS).map(retalla).join(' · ')}${resta}`);
    }
    if (avisos.length > MAX_FITXERS) l.push(`- … i ${avisos.length - MAX_FITXERS} document(s) més.`);
    l.push('Detall complet: node tooling/wiki/document.mjs check --file RUTA');
  }
  if (fallades.length) {
    l.push(`[Porta receptor] No s'ha pogut validar: ${fallades.map((f) => `${f.fitxer} (${retalla(f.motiu)})`).join('; ')}. Tracta'ls com a no verificats.`);
  }
  return l.length ? l.join('\n') : null;
}

/** Sobre de Claude Code per a UserPromptSubmit; cadena buida si no hi ha avís. */
export function eixida(context) {
  return context ? JSON.stringify({ hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: context } }) : '';
}

const NO_VALIDAT = "no s'ha pogut validar cap petorreta d'este missatge. Tracta-les com a no verificades i valida-les amb node tooling/wiki/document.mjs check --file RUTA.";

/** Payload cru → {codi, stdout}. Mai llança; el codi és sempre 0. */
export async function processa(raw, { arrel = null, deps = null, dia } = {}) {
  try {
    let payload = {};
    if (typeof raw === 'string' && raw.trim()) {
      try { payload = JSON.parse(raw); }
      catch (e) { return { codi: 0, stdout: eixida(`[Porta receptor] Payload il·legible (${e.message}): ${NO_VALIDAT}`) }; }
    }
    const prompt = [payload?.prompt, payload?.user_prompt, payload?.userPrompt, payload?.message, payload?.text].find((v) => typeof v === 'string') ?? '';
    const d = deps || await carregaDependencies();
    const root = arrel || d.arrelSegura();
    return { codi: 0, stdout: eixida(missatge(avalua(root, prompt, d, { dia }))) };
  } catch (e) {
    return { codi: 0, stdout: eixida(`[Porta receptor] Error intern (${e?.message || e}): ${NO_VALIDAT}`) };
  }
}

async function main() {
  let raw = '';
  try { raw = fs.readFileSync(0, 'utf8'); } catch { raw = ''; }
  const r = await processa(raw);
  if (r.stdout) process.stdout.write(`${r.stdout}\n`);
}

// Guarda amb el camí real (symlinks de /var i d'os.tmpdir): una guarda que no
// salta faria que el hook callara sense comprovar res.
let principal = false;
try { principal = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href; }
catch { principal = false; }
if (principal) {
  const zero = () => { process.exitCode = 0; };
  process.on('uncaughtException', zero);
  process.on('unhandledRejection', zero);
  process.stdout.on('error', zero);
  main().catch(zero).finally(zero);
}
