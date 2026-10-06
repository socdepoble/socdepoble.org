#!/usr/bin/env node
/**
 * prepara-pla.mjs — pla sdp.mutation.v1 del paquet 261006 «Olivera àncores»
 * (tasques T2 i T3 del Mestre: arxivat per nom de qualsevol extensió, carpeta de
 * sessió, reapuntat, àncora dels rebuts de torn obert, remei dels fantasmes,
 * --repara, --renomena i anchorDraft sense línies en blanc pròpies ni duplicats).
 *
 * Adaptat del de 261002_1745_olivera_arxiva_claude, sense git: cada original es
 * contrasta amb el sha256 que tenia a HEAD quan es va preparar el paquet (BASES).
 * Si el disc ja no és eixe, deriva i el pla es nega: una còpia sencera tornaria
 * enrere en silenci un canvi d'una altra mà. Un fitxer que ja és idèntic al de
 * nous/ està aplicat i ix del pla. Quan l'executor ja ha deixat la transacció
 * acceptada del paquet (operationId `sdp-olivera-ancores-261006-*`), el pla es nega.
 *
 * Seguix el flux de la lease: open → bootstrap → seal → executor. No escriu cap
 * fitxer: el que cal deixar a .sdp-reflex/plans/ i al bootstrap ho escriu per
 * stdout, i la redirecció `>` la fa el Mestre amb les ordres que imprimix
 * `comprova --session=ID`.
 *
 * Ús (des de l'arrel del repositori; LAB és la carpeta d'este fitxer):
 *   node LAB/prepara-pla.mjs [pla] [--session=ID]      # pla JSON per stdout
 *   node LAB/prepara-pla.mjs comprova [--session=ID]   # resum, deriva, precondició i ordre d'open
 *   node LAB/prepara-pla.mjs petorreta --session=ID    # Petorreta del bootstrap per stdout
 *   node LAB/prepara-pla.mjs manifest                  # context.json del bootstrap per stdout
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const LAB = path.dirname(fileURLToPath(import.meta.url));
export const ARREL = path.resolve(LAB, '../../../..');
export const REL_LAB = '_wiki_de_poble/04_escriptori/02_investigacio_ia/261006_0055_olivera_ancores_opus';
export const NOUS = path.join(LAB, 'nous');
export const SESSIO_ZERO = '00000000-0000-4000-8000-000000000000';
/** Commit on es va preparar el paquet: cap dels originals tenia canvis sense commit. */
export const HEAD = '44e2b8e2';
/** sha256 de cada original a HEAD. És la base de la CAS de l'executor (`before`). */
export const BASES = Object.freeze({
  'tests/cognitive-preflight.test.mjs': '105c0f02153483acd315c3ba43c446ec582d43ca9a94f0d3d27e941169a03d90',
  'tests/porta-olivera-diagnosi.test.mjs': 'f3905bd56441c6f24ab71c0a2492557ae66cf3252956b577befbd62036289e95',
  'tests/porta-olivera-v3.test.mjs': 'f72550d193237f4e3ebc7fbdf80236b57593e1875ba1ef44001ca049515544a7',
  'tooling/documental/draft-write.mjs': '1eb5e1152d0b8bad48d6693661867b1c75efdcadbcc4d4daf65714c71f2c4170',
  'tooling/gates/porta-olivera.mjs': 'cfb79f0d22b2e5eb323c83acba35a31e1a3618afaa39f45fe6f51c1510287631',
});
export const INTENT = 'Paquet 261006 Olivera ancores: arxivat per nom de qualsevol extensio, carpeta de sessio, reapuntat, remei de les ancores fantasma, repara i renomena a la porta Olivera, i anchorDraft sense linies en blanc ni duplicats, amb executor-mutacio';
export const LLEGIU = `${REL_LAB}/LLEGIU_PRIMER.txt`;
export const NOM_PETORRETA = '261006_0055_PROMPT_olivera_ancores_amb_executor.md';
/** Prefix de l'operationId del pla: el marcador que l'executor deixa a .agents/seal-transactions/. */
export const OPERACIO = 'sdp-olivera-ancores-261006-';
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

/**
 * Estat de cada fitxer de nous/ contra el disc: `pendent` (l'original és el fixat
 * a BASES, o un fitxer nou que encara no existix), `aplicat` (ja és idèntic al de
 * nous/) o `deriva` (ni una cosa ni l'altra). Només llig.
 */
export function estat(root = ARREL, { nous = NOUS, bases = BASES } = {}) {
  return fitxersNous(nous).map((f) => {
    const contingut = fs.readFileSync(path.join(nous, f.nou), 'utf8');
    const abs = path.join(root, f.ruta);
    const original = fs.existsSync(abs) ? fs.readFileSync(abs) : null;
    const actual = original === null ? null : sha(original);
    if (original !== null && original.toString('utf8') === contingut) return { ...f, contingut, before: actual, estat: 'aplicat' };
    if (!Object.hasOwn(bases, f.ruta)) {
      if (original === null) return { ...f, contingut, before: null, estat: 'pendent' };
      return { ...f, contingut, before: actual, estat: 'deriva', motiu: `fitxer nou que ja existix al disc (sha ${actual}): algú l'ha creat; refés el paquet, no el forces` };
    }
    if (original === null) return { ...f, contingut, before: null, estat: 'deriva', motiu: `era a HEAD ${HEAD} i ja no és al disc` };
    if (actual !== bases[f.ruta]) {
      return { ...f, contingut, before: actual, estat: 'deriva', motiu: `el disc no és el de HEAD ${HEAD}: actual ${actual}, base ${bases[f.ruta]}. Algú l'ha canviat; refés el paquet, no el forces` };
    }
    return { ...f, contingut, before: actual, estat: 'pendent' };
  });
}

/**
 * Transacció acceptada d'este paquet, o null. L'executor la deixa quan aplica el
 * pla (executor-mutacio.mjs, estat `accepted`), i només llavors. Un registre
 * il·legible no compta.
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

/**
 * Precondició de l'open (lliçó 261002 de wiki-documentacio-i-reflex, «Aprovació
 * explícita al frontend»): un tractor nou no és efectiu abans que el Mestre aprove
 * des de la Wiki el document que n'explica el flux. Este script no ho pot
 * comprovar: ho recorda abans de l'ordre d'open.
 */
export const PRECONDICIO_WIKI = Object.freeze([
  "Precondició (lliçó 261002 de wiki-documentacio-i-reflex): abans d'este open, MarIA crea a la Wiki el document",
  'que explica el flux nou (arxivat per nom de qualsevol extensió, --sessio, --reapunta, --repara i --renomena)',
  "i el Mestre l'aprova des de la pàgina. Sense eixa aprovació no es fa l'open: el tractor no pot ser efectiu abans.",
]);

/** Línies que imprimix `comprova` sense sessió: la precondició de la Wiki i, després, l'ordre d'open. */
export function liniesOpen(scopes) {
  return [
    ...PRECONDICIO_WIKI,
    '',
    "Ordre d'open (només amb la Wiki aprovada):",
    `node tooling/wiki/reflex_petorreta.mjs open --intent="${INTENT}" --risk=high --operation=governance-write ${scopes.map((s) => `--scope=${s}`).join(' ')}`,
  ];
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
  if (feta) throw new Error(`Paquet 261006 Olivera àncores ja aplicat per la transacció ${feta.id} (${TRANSACCIONS}/). No es torna a aplicar: arxiveu el laboratori.`);
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

/** Manifest del bootstrap: el LLEGIU_PRIMER del laboratori, que porta el què, el perquè i les decisions. */
export function manifest() {
  const sources = [{ path: LLEGIU, reason: 'Què canvia el paquet 261006, per què, com s’aplica, decisions del Mestre i límits declarats.', classification: 'internal', role: 'reference' }];
  return `${JSON.stringify({ sources }, null, 2)}\n`;
}

/** La Petorreta mecànica de la sessió: prompt editorial amb les marques que el seal exigix. */
export function construeixPetorreta({ sessio, intentSha256, rulesSha256, planSha256, targets }) {
  return `---
type: prompt
status: esborrany
description: Petorreta del Reflex per al paquet 261006 Olivera àncores, aplicat amb executor-mutacio i lease del Mestre.
---
# Olivera àncores 261006: arxivat de qualsevol artefacte, reapuntat, remei dels fantasmes i reanomenat dins del circuit

Reflex-Session: ${sessio}
Intent-SHA256: ${intentSha256}
Rules-SHA256: ${rulesSha256}
Plan-SHA256: ${planSha256}

## Context

L'autòpsia de les àncores fantasma (lents ancores-escriptors, ancores-jutge i ancores-evidencia, refutades) va trobar que la causa dominant és el trasllat i el reanomenat a mà: l'eina no podia arxivar artefactes que no foren Markdown, ni les categories produccio i avaluacio, ni portar-los a una carpeta de sessió, i el circuit no tenia reanomenat. Les versions noves completes viuen al laboratori ${REL_LAB}/nous, provades a tests/laboratori-olivera-261006.test.js contra una còpia de HEAD, i cada original es contrasta amb el sha256 que tenia a ${HEAD}.

## Tasques

- porta-olivera.mjs: artefactes de qualsevol extensió per nom (categories de torn, produccio i avaluacio), categories compostes senceres, --sessio, --reapunta, secció dels arxivats per als rebuts de torn obert (també sense --reapunta), despenjat amb la regla d'ancoratge i el cens previ, lot amb finally i trasllat que no trepitja, índex per temporal i rename dins del lock de draft-write, remei de cada fantasma només pel nom, --repara, --renomena amb el relleu comprovat abans de moure i àncores d'una sola línia.
- draft-write.mjs: anchorDraft dins de la llista sense línia en blanc pròpia i sense duplicats per referent normalitzat.
- tests/porta-olivera-v3.test.mjs, tests/cognitive-preflight.test.mjs i tests/porta-olivera-diagnosi.test.mjs: les proves noves, la inversió de cognitive-preflight:215 i la de la diagnosi D7 (el relleu ja no deixa el torn sense àncora).

Fitxers del pla (${targets.length}): ${targets.join(', ')}.

## Riscos

- Entre el seal i l'executor no pot canviar res del repositori: el Reflex compara HEAD i l'estat de git sencer.
- Un macro_prompt o micro_prompt de jornades anteriors passa a ser ranci i bloqueja les convocatòries fins que s'arxive o es declare viu.
- La skill core-higiene-escriptori (línies 36, 38 i 50) s'ha d'harmonitzar a part, amb resegellat del Mestre.
- Si l'executor falla a mitges, el pending bloqueja noves mutacions fins a una reconciliació revisada; no es reintenta a cegues.

## Criteris d'acceptació

- L'executor torna valid:true i deixa una transacció a .agents/seal-transactions amb operationId ${OPERACIO}.
- Passen tests/porta-olivera-v3.test.mjs, tests/porta-olivera-diagnosi.test.mjs, tests/cognitive-preflight.test.mjs, tests/cognitive-hook-safety.test.mjs, tests/cognitive-document-handoff.test.mjs i tests/antigravity-hook.test.mjs.
- node tooling/gates/porta-olivera.mjs ix amb 0 i el corredor tests/laboratori-olivera-261006.test.js es retira.
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
  const text = manifest();
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
    console.log('');
    for (const linia of liniesOpen(scopes)) console.log(linia);
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
  else if (ordre === 'manifest') process.stdout.write(manifest());
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
