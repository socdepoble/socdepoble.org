#!/usr/bin/env node
/**
 * prepara-pla.mjs — pla sdp.mutation.v1 del tractor de fatiga 261002
 * (torn torn_ffcc22bb-7c72-4381-8eed-a3f88b3e82c6, encàrrec 1).
 *
 * Adaptació del de 260930_0400_governanca_claude. Recorre ./nous i mapeja cada
 * fitxer a la seua ruta real; `.md.txt` passa a `.md` (el sufix només evita que
 * el Reflex jutge com a document de la Wiki una norma que encara viu al
 * laboratori). La diferència: no porta una taula de hashes, sinó el commit base
 * del paquet (COMMIT_BASE). Cada original es contrasta amb el seu blob en eixe
 * commit (`git cat-file blob`, que torna els bytes desats sense textconv ni
 * filtres): si algú l'ha canviat després, el pla es nega, perquè una còpia
 * sencera tornaria enrere el seu canvi en silenci. Un fitxer nou no pot existir
 * ni al commit base ni al disc. Un fitxer que ja és idèntic al de nous/ està
 * aplicat i ix del pla. Quan l'executor ja ha deixat la transacció acceptada
 * del paquet (operationId `sdp-fatiga-261002-*`), el pla es nega.
 *
 * Seguix el flux de la lease: open → bootstrap → seal → executor. No escriu cap
 * fitxer: el que cal deixar a .sdp-reflex/plans/ i al bootstrap ho escriu per
 * stdout, i la redirecció `>` la fa el Mestre amb les ordres que imprimix
 * `comprova --session=ID`.
 *
 * Ús (des de l'arrel del repositori; LAB és la carpeta d'este fitxer):
 *   node LAB/prepara-pla.mjs [pla] [--session=ID]      # pla JSON per stdout
 *   node LAB/prepara-pla.mjs comprova [--session=ID]   # resum, ordre d'open i ordres següents
 *   node LAB/prepara-pla.mjs petorreta --session=ID    # Petorreta del bootstrap per stdout
 *   node LAB/prepara-pla.mjs manifest                  # context.json del bootstrap per stdout
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const LAB = path.dirname(fileURLToPath(import.meta.url));
export const ARREL = path.resolve(LAB, '../../../..');
export const REL_LAB = '_wiki_de_poble/04_escriptori/02_investigacio_ia/261002_1510_tractor_fatiga_claude';
export const NOUS = path.join(LAB, 'nous');
export const SESSIO_ZERO = '00000000-0000-4000-8000-000000000000';
/** Commit on es va preparar el paquet: cap dels originals tenia canvis sense commit. */
export const COMMIT_BASE = '62b623339';
export const INTENT = 'Torn torn_ffcc22bb encarrec 1: tractor de fatiga 261002 (termometre unic, hook sdp-fatiga PreInvocation, cas 4 de core-context-panic i registre de tasques) amb executor-mutacio';
export const PLA_DOC = '_wiki_de_poble/04_escriptori/261002_1245_pla_implementacio_alarma_fatiga.md';
export const LLEGIU = `${REL_LAB}/LLEGIU_PRIMER.txt`;
export const NOM_PETORRETA = '261002_1510_PROMPT_tractor_de_fatiga_cognitiva_amb_hook_preinvocation_i_executor.md';
/** Prefix de l'operationId del pla: el marcador que l'executor deixa a .agents/seal-transactions/. */
export const OPERACIO = 'sdp-fatiga-261002-';
const TRANSACCIONS = '.agents/seal-transactions';
const US = `Ús: ${REL_LAB}/prepara-pla.mjs [pla|comprova|petorreta|manifest] [--session=ID]`;

export const sha = (valor) => createHash('sha256').update(valor).digest('hex');

// Mateixos patrons que reflex_petorreta.mjs (SENSITIVE_PATTERNS): si casen, el seal fallaria.
export const PATRONS_SENSIBLES = [
  ['clau privada', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['secret assignat', /(?:api[_-]?key|secret|token|password)\s*[:=]\s*["'][^"']{12,}["']/i],
  ['IBAN', /\b[A-Z]{2}\d{2}(?:[ ]?\d{4}){4,7}\b/],
  ['correu electrònic', /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i],
  ['DNI o NIE', /\b(?:\d{8}|[XYZ]\d{7})[A-Z]\b/i],
  ['telèfon personal probable', /(?<![A-Za-z0-9])(?:\+34[ .-]?)?[6789]\d{2}(?:[ .-]?\d{3}){2}(?![A-Za-z0-9])/],
];
export function sensibles(text) {
  return PATRONS_SENSIBLES.filter(([, re]) => re.test(text)).map(([tipus]) => tipus);
}

function rutaSegura(ruta) {
  if (typeof ruta !== 'string' || !ruta || path.isAbsolute(ruta) || ruta.includes('\\')
    || ruta.split('/').some((p) => !p || p === '.' || p === '..')) throw new Error(`Ruta no canònica: ${String(ruta)}`);
  return ruta;
}

/** Ruta real d'un fitxer de nous/: `.md.txt` → `.md`. */
export function rutaReal(relNous) {
  return relNous.endsWith('.md.txt') ? relNous.slice(0, -'.txt'.length) : relNous;
}

/** Fitxers de nous/, en ordre estable, amb la ruta real. El `.DS_Store` del Finder no compta. */
export function fitxersNous(nous = NOUS) {
  const out = [];
  (function recorre(rel) {
    const entrades = fs.readdirSync(rel ? path.join(nous, rel) : nous, { withFileTypes: true })
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const e of entrades) {
      if (e.name === '.DS_Store') continue;
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) recorre(r);
      else if (e.isFile()) out.push({ nou: r, ruta: rutaSegura(rutaReal(r)) });
      else throw new Error(`nous/${r}: només s'admeten fitxers regulars`);
    }
  })('');
  return out;
}

/** Comprova una vegada que el commit base existix al repositori. */
function exigixBase(root, commit) {
  const r = spawnSync('git', ['cat-file', '-e', `${commit}^{commit}`], { cwd: root, encoding: 'utf8' });
  if (r.error) throw new Error(`git no disponible: ${r.error.message}`);
  if (r.status !== 0) throw new Error(`El commit base ${commit} no és al repositori: no es pot contrastar cap original`);
}

/** Bytes de `ruta` al commit base, o null si no hi era. */
export function contingutBase(root, ruta, commit = COMMIT_BASE) {
  const objecte = `${commit}:${ruta}`;
  const r = spawnSync('git', ['cat-file', '-e', objecte], { cwd: root });
  if (r.error) throw new Error(`git no disponible: ${r.error.message}`);
  if (r.status !== 0) return null;
  return execFileSync('git', ['cat-file', 'blob', objecte], { cwd: root, maxBuffer: 64 * 1024 * 1024 });
}

/**
 * Estat de cada fitxer contra el disc: `pendent` (l'original és el del commit
 * base, o un fitxer nou que encara no existix), `aplicat` (ja és idèntic al de
 * nous/) o `deriva` (ni una cosa ni l'altra). Només llig.
 */
export function estat(root = ARREL, { nous = NOUS, commit = COMMIT_BASE } = {}) {
  exigixBase(root, commit);
  return fitxersNous(nous).map((f) => {
    const contingut = fs.readFileSync(path.join(nous, f.nou), 'utf8');
    const abs = path.join(root, f.ruta);
    const original = fs.existsSync(abs) ? fs.readFileSync(abs) : null;
    const actual = original === null ? null : sha(original);
    if (original !== null && original.toString('utf8') === contingut) return { ...f, contingut, before: actual, estat: 'aplicat' };
    const base = contingutBase(root, f.ruta, commit);
    if (base === null) {
      if (original === null) return { ...f, contingut, before: null, estat: 'pendent' };
      return { ...f, contingut, before: actual, estat: 'deriva', motiu: `fitxer nou que ja existix al disc (sha actual ${actual}) i no era al commit ${commit}: algú l'ha creat; refés el paquet, no el forces` };
    }
    if (original === null) return { ...f, contingut, before: null, estat: 'deriva', motiu: `era al commit ${commit} i ja no és al disc` };
    if (!original.equals(base)) {
      return { ...f, contingut, before: actual, estat: 'deriva', motiu: `el disc no és el del commit ${commit}: actual ${actual}, base ${sha(base)}. Algú l'ha canviat des del 261002; refés el paquet, no el forces` };
    }
    return { ...f, contingut, before: actual, estat: 'pendent' };
  });
}

/**
 * Transacció acceptada d'este paquet, o null. L'executor la deixa quan aplica el
 * pla (executor-mutacio.mjs, estat `accepted`), i només llavors. Després, els
 * fitxers reals poden evolucionar legítimament; esta marca és el que diu
 * «aplicat», no la igualtat amb nous/. Un registre il·legible no compta.
 */
export function transaccio(root = ARREL) {
  const dir = path.join(root, TRANSACCIONS);
  if (!fs.existsSync(dir)) return null;
  for (const nom of fs.readdirSync(dir).filter((n) => n.endsWith('.json')).sort()) {
    let t;
    try { t = JSON.parse(fs.readFileSync(path.join(dir, nom), 'utf8')); } catch { continue; }
    if (t?.state === 'accepted' && typeof t.operationId === 'string' && t.operationId.startsWith(OPERACIO) && Array.isArray(t.files)) return t;
  }
  return null;
}

/** Directori existent més pròxim de cada target, sense scopes niats: el Reflex només admet scopes que existixen. */
export function scopesDe(root, targets) {
  const crus = [...new Set(targets.map((ruta) => {
    let r = ruta;
    while (r !== '.' && !fs.existsSync(path.join(root, r))) r = path.posix.dirname(r);
    return r;
  }))];
  return crus.filter((s) => !crus.some((o) => o !== s && (o === '.' || s.startsWith(`${o}/`)))).sort();
}

/** Pla dels fitxers pendents, validat amb el mateix validatePlan de l'executor. Cap escriptura. */
export async function preparaPla(root = ARREL, { sessio = SESSIO_ZERO, validar = true } = {}) {
  const feta = transaccio(root);
  if (feta) throw new Error(`Paquet de fatiga 261002 ja aplicat per la transacció ${feta.id} (${TRANSACCIONS}/). No es torna a aplicar: arxiveu el laboratori.`);
  const fitxers = estat(root);
  const deriva = fitxers.filter((f) => f.estat === 'deriva');
  if (deriva.length) throw new Error(deriva.map((f) => `${f.ruta}: ${f.motiu}`).join('\n'));
  const pendents = fitxers.filter((f) => f.estat === 'pendent');
  if (!pendents.length) throw new Error('Res a aplicar: tots els fitxers de nous/ ja són al disc. Arxiveu el laboratori.');
  const plan = {
    schema: 'sdp.mutation.v1',
    session: sessio,
    operationId: `${OPERACIO}${sessio.slice(0, 8)}`,
    files: pendents.map((f) => ({ path: f.ruta, before: f.before, content: f.contingut })),
  };
  if (validar) {
    const { validatePlan } = await import(pathToFileURL(path.join(root, 'tooling/gates/executor-mutacio.mjs')).href);
    validatePlan(fs.realpathSync(root), plan);
  }
  const targets = pendents.map((f) => f.ruta);
  return { plan, scopes: scopesDe(root, targets), targets, aplicats: fitxers.filter((f) => f.estat === 'aplicat').map((f) => f.ruta) };
}

/** Manifest del bootstrap: el pla d'origen (si encara és a l'Escriptori) i el LLEGIU_PRIMER del laboratori. */
export function manifest(root = ARREL) {
  const sources = [];
  if (fs.existsSync(path.join(root, PLA_DOC))) {
    sources.push({ path: PLA_DOC, reason: "Pla d'origen de l'alarma de fatiga (esborrany de MarIA): l'encàrrec 1 del torn torn_ffcc22bb el porta a un hook PreInvocation.", classification: 'internal', role: 'reference' });
  }
  sources.push({ path: LLEGIU, reason: 'Fets, contingut, ordres, decisions obertes i proves del tractor de fatiga 261002.', classification: 'internal', role: 'reference' });
  return `${JSON.stringify({ sources }, null, 2)}\n`;
}

/** La Petorreta mecànica de la sessió: prompt editorial amb les marques que el seal exigix. */
export function construeixPetorreta({ sessio, intentSha256, rulesSha256, planSha256, targets }) {
  return `---
type: prompt
status: esborrany
description: Petorreta del Reflex per al tractor de fatiga 261002 del torn torn_ffcc22bb, aplicat amb executor-mutacio i lease del Mestre.
---
# Tractor de fatiga 261002: termòmetre únic i hook PreInvocation

Reflex-Session: ${sessio}
Intent-SHA256: ${intentSha256}
Rules-SHA256: ${rulesSha256}
Plan-SHA256: ${planSha256}

## Context

El cas 4 de core-context-panic demanava a MarIA que intuïra la pròpia saturació, i el termòmetre que comptava artefactes només l'importava un preflight que cap host executa. Les converses llargues d'Antigravity han arribat a 2890 passos, 43 resums automàtics i 213 pujades sense cap avís, i el Mestre parla per veu: la majoria dels seus torns porten la petició escrita buida. El hook viu d'Antigravity és sdp-olivera; el paquet de governança 260930b, encara sense aplicar, en reescriu el script. Per a no xocar-hi, la fatiga entra com un segon hook amb nom, sdp-fatiga, a PreInvocation. El hook de Claude denega tota escriptura directa a .agents i tooling; per això el remei viatja en un sol pla sdp.mutation.v1 que només pot aplicar l'executor de mutacions amb esta lease. Les versions noves completes viuen al laboratori ${REL_LAB}/nous, i cada original es contrasta amb el commit ${COMMIT_BASE}.

## Tasques

- Termòmetre únic (tooling/brain/termometre_context.mjs): resol la conversa pel payload i mai per la més recent, compta passos, pujades i MB, llig els avisos ja injectats, els reconeixements escrits del Mestre i els disparaments d'un /schedule, i decidix el nivell N0 a N3 amb llindars configurables; conserva comptaArtefactes, avis i MISSATGE.
- Hook nou (tooling/gates/fatiga-hook.mjs): PreInvocation que mai llança, amb interruptor, mode fase 0 i traça d'una línia sense valors del payload.
- .agents/hooks.json: clau nova sdp-fatiga; sdp-olivera intacte.
- Skill core-context-panic: cas 4 reescrit amb el disparador del hook, la frase literal conservada i la regla dels /schedule; frontmatter idèntic.
- Registre de tasques: tasca fatiga-cognitiva amb llançador antigravity-hook.

Fitxers del pla (${targets.length}): ${targets.join(', ')}.

## Riscos

- Entre el seal i l'executor no pot canviar res del repositori: el Reflex compara HEAD i l'estat de git sencer, i el scope de tooling/gates és una carpeta sencera.
- La prova real dins de l'IDE no s'ha pogut fer: cal una sessió en fase 0 per a acreditar que l'IDE envia conversationId o transcriptPath i que fusiona els efímers dels dos hooks.
- La porta Reflex quedarà roja fins al commit, perquè el pla toca camins de governança.
- Si l'executor falla a mitges, el pending bloqueja noves mutacions fins a una reconciliació revisada; no es reintenta a cegues.

## Criteris d'acceptació

- L'executor torna valid:true i deixa una transacció a .agents/seal-transactions amb operationId sdp-fatiga-261002.
- Passen tests/fatiga-261002.test.mjs (ara contra els fitxers reals), tests/antigravity-hook.test.mjs i tests/backend_consolidacio.test.mjs.
- Amb la marca de fase 0, una sessió real deixa línies a .agents/runtime/fatiga-hook.log amb les claus del payload i un nivell, i cap efímer.
- El segell de les skills queda coherent després de l'executor.
`;
}

function llegeixSessio(root, sessio) {
  if (!/^[0-9a-f-]{36}$/i.test(sessio ?? '')) throw new Error(`Cal --session=ID (el que ha imprés open). ${US}`);
  const s = JSON.parse(fs.readFileSync(path.join(root, '.sdp-reflex/sessions', `${sessio}.json`), 'utf8'));
  if (s.status !== 'open') throw new Error(`La sessió no està oberta: ${s.status}`);
  if (!s.operations?.includes('governance-write') || s.risk !== 'high') throw new Error('La sessió ha de ser --risk=high amb --operation=governance-write');
  return s;
}

/** Pla de la sessió, Petorreta i manifest, amb les mateixes comprovacions que farà el seal. */
async function preparaSessio(root, sessio) {
  const s = llegeixSessio(root, sessio);
  const { plan, targets } = await preparaPla(root, { sessio });
  const fora = targets.filter((t) => !s.scopes.some((sc) => sc === '.' || t === sc || t.startsWith(`${sc}/`)));
  if (fora.length) throw new Error(`Targets fora dels scopes de la sessió: ${fora.join(', ')}`);
  const petorreta = construeixPetorreta({ sessio, intentSha256: s.intentSha256, rulesSha256: s.rulesDigest, planSha256: sha(JSON.stringify(plan)), targets });
  const text = manifest(root);
  const { validatePetorreta } = await import(pathToFileURL(path.join(root, 'tooling/wiki/reflex_petorreta.mjs')).href);
  const errors = validatePetorreta(path.join(root, s.bootstrap.path, NOM_PETORRETA), petorreta);
  const fonts = JSON.parse(text).sources.map((f) => fs.readFileSync(path.join(root, f.path), 'utf8'));
  const perills = [...sensibles(petorreta), ...sensibles(text), ...fonts.flatMap(sensibles)];
  if (errors.length || perills.length) throw new Error(`La Petorreta o el manifest no passarien el seal: ${[...errors, ...perills].join('; ')}`);
  return { s, plan, targets, petorreta, manifest: text };
}

async function comprova(root, sessio) {
  const { plan, scopes, targets, aplicats } = await preparaPla(root, { sessio: sessio ?? SESSIO_ZERO });
  console.log(`Pla vàlid: ${targets.length} fitxers, ${Buffer.byteLength(JSON.stringify(plan))} bytes.`);
  for (const f of plan.files) console.log(`  ${f.before ? 'M' : 'A'} ${f.path}`);
  for (const r of aplicats) console.log(`  = ${r} (ja aplicat; fora del pla)`);
  if (!sessio) {
    console.log("\nOrdre d'open:");
    console.log(`node tooling/wiki/reflex_petorreta.mjs open --intent="${INTENT}" --risk=high --operation=governance-write ${scopes.map((s) => `--scope=${s}`).join(' ')}`);
    return;
  }
  const { s } = await preparaSessio(root, sessio);
  const dirBootstrap = path.join(root, s.bootstrap.path);
  if (!fs.statSync(dirBootstrap).isDirectory() || fs.readdirSync(dirBootstrap).length) throw new Error('El bootstrap reservat no existix o no és buit');
  const relB = s.bootstrap.path;
  const lab = `node ${REL_LAB}/prepara-pla.mjs`;
  console.log('\nSessió vàlida. Petorreta i manifest passarien el seal. Ordres següents (des de l’arrel):');
  console.log('mkdir -p -m 700 .sdp-reflex/plans');
  console.log(`${lab} pla --session=${sessio} > .sdp-reflex/plans/${sessio}.json`);
  console.log(`${lab} petorreta --session=${sessio} > ${relB}/${NOM_PETORRETA}`);
  console.log(`${lab} manifest > ${relB}/context.json`);
  console.log(`node tooling/wiki/reflex_petorreta.mjs seal --session=${sessio} --nonce=NONCE --petorreta=${relB}/${NOM_PETORRETA} --manifest=${relB}/context.json`);
  console.log(`node tooling/gates/executor-mutacio.mjs .sdp-reflex/plans/${sessio}.json .sdp-reflex/sessions/${sessio}.json`);
}

function parseArgs(argv) {
  const ordre = argv[0] && !argv[0].startsWith('--') ? argv[0] : 'pla';
  const resta = argv[0] && !argv[0].startsWith('--') ? argv.slice(1) : argv;
  const opts = {};
  for (const a of resta) {
    const m = /^--session=([0-9a-f-]{36})$/i.exec(a);
    if (m) opts.sessio = m[1];
    else throw new Error(`Argument desconegut: ${a}. ${US}`);
  }
  return { ordre, ...opts };
}

async function main(argv) {
  const { ordre, sessio } = parseArgs(argv);
  if (ordre === 'pla') {
    if (!sessio) console.error('[prepara-pla] Sense --session: pla amb la sessió zero, només per a revisar-lo.');
    const { plan } = sessio ? await preparaSessio(ARREL, sessio) : await preparaPla(ARREL);
    process.stdout.write(`${JSON.stringify(plan)}\n`);
  } else if (ordre === 'comprova') await comprova(ARREL, sessio);
  else if (ordre === 'petorreta') process.stdout.write((await preparaSessio(ARREL, sessio)).petorreta);
  else if (ordre === 'manifest') process.stdout.write(manifest(ARREL));
  else throw new Error(US);
}

// La guarda que no salta mai és `file://${argv[1]}`: l'arrel té espais.
function esEntrada() {
  try { return Boolean(process.argv[1]) && pathToFileURL(fs.realpathSync(process.argv[1])).href === import.meta.url; }
  catch { return false; }
}
if (esEntrada()) {
  main(process.argv.slice(2)).catch((e) => { console.error(`[prepara-pla] ${e.message}`); process.exitCode = 1; });
}
