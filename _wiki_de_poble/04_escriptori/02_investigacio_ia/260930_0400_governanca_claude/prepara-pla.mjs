#!/usr/bin/env node
/**
 * prepara-pla.mjs — pla sdp.mutation.v1 del paquet de governança 260930b
 * (torn torn_2c40cd77, llesca L7, decisió D6 del pla 260930_0320_pla_implementacio_claude).
 *
 * Recorre ./nous i mapeja cada fitxer a la seua ruta real. `.md.txt` passa a
 * `.md`: el sufix només evita que el Reflex jutge com a document de la Wiki
 * una norma que encara viu al laboratori. Cada original es contrasta amb la
 * base que tenia quan es va preparar el paquet (BASES): si algú l'ha canviat
 * després, el pla es nega, perquè una còpia sencera tornaria enrere el seu
 * canvi en silenci. Un fitxer que ja és idèntic al de nous/ està aplicat i ix
 * del pla. Quan l'executor ja ha deixat la transacció acceptada del paquet
 * (operationId `sdp-governanca-260930b-*`), el pla es nega: el paquet és aplicat
 * encara que després algú evolucione els fitxers, i els corredors salten.
 *
 * Seguix el flux del T1-T16 (lease.mjs del laboratori 260930_0040):
 * open → bootstrap → seal → executor. No escriu cap fitxer: el que cal deixar
 * a .sdp-reflex/plans/ i al bootstrap ho escriu per stdout, i la redirecció `>`
 * la fa el Mestre amb les ordres que imprimix `comprova --session=ID`.
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
import { fileURLToPath, pathToFileURL } from 'node:url';

export const LAB = path.dirname(fileURLToPath(import.meta.url));
export const ARREL = path.resolve(LAB, '../../../..');
export const REL_LAB = '_wiki_de_poble/04_escriptori/02_investigacio_ia/260930_0400_governanca_claude';
export const NOUS = path.join(LAB, 'nous');
export const SESSIO_ZERO = '00000000-0000-4000-8000-000000000000';
export const INTENT = 'Torn torn_2c40cd77 L7: paquet de governanca 260930b (hook Antigravity, porta Olivera, hooks-local, torns retirats, normes de .agents/rules, despertar, abast de frontmatter i closca del Mapa) amb executor-mutacio';
export const PLA_DOC = '_wiki_de_poble/04_escriptori/260930_0320_pla_implementacio_claude.md';
export const LLEGIU = `${REL_LAB}/LLEGIU_PRIMER.txt`;
export const NOM_PETORRETA = '260930_0400_PROMPT_paquet_de_governanca_portes_torns_retirats_i_frontmatter_amb_executor.md';
/** Prefix de l'operationId del pla: el marcador que l'executor deixa a .agents/seal-transactions/. */
export const OPERACIO = 'sdp-governanca-260930b-';
const TRANSACCIONS = '.agents/seal-transactions';
const US =`Ús: ${REL_LAB}/prepara-pla.mjs [pla|comprova|petorreta|manifest] [--session=ID]`;

/**
 * sha256 de cada original quan es va preparar el paquet (el de HEAD 638a6f333:
 * cap d'ells tenia canvis sense commit); null és una alta. La skill d'higiene
 * no és d'esta llesca: la va deixar a nous/ la incidència de l'Escriptori
 * (notes/escriptori.txt) per a la mateixa lease.
 */
export const BASES = Object.freeze({
  '.agents/rules/firebase_hosting.md': '63ea0bceb05fb5bf44004c637f45ce6877e428172aefbdd4a1e44242541da7ab',
  '.agents/rules/supabase_grants.md': 'b051ea35797eb3e24843a6ead7c0b09fbc9408bb2ed72c18029fe1599620dfe2',
  '.agents/skills/core-higiene-escriptori/SKILL.md': '854bdf06fbbdaa914e61fe6d4c3883f1f59eba3c105f31837996b4f90a3efc38',
  'tests/antigravity-hook.test.mjs': 'cec915948b24545b07fb155b4a15de59dfb89c5d1fcbd7c90a1d67e826eec519',
  'tests/porta-olivera-v3.test.mjs': 'f72550d193237f4e3ebc7fbdf80236b57593e1875ba1ef44001ca049515544a7',
  'tests/turns-retirats.test.mjs': null,
  'tooling/brain/despertar.mjs': '609bee9f89b501ca4101fd8c9f00adf79f416a899c468ae663f08a8889d21544',
  'tooling/brain/mapa-consola.mjs': 'cea65b97395a55a5a611bbd5ffc0dd698244b9cdcd59d05ed8dff9c027c29b98',
  'tooling/documental/turns.mjs': '5bf2388b94bd9eba5e81100e60700a8d93fba22c3a18992de0f6e0974da528b6',
  'tooling/gates/antigravity-hook.mjs': 'f5895f6b6f964558ea046b831f78c1985db68fa32665e1aa47974d5f9c86f7a7',
  'tooling/gates/hooks-local.mjs': '16a4ce70aa88d7f44e3571e9d9bdb888c0027ac0ab8ec099a5945fa0cdf91311',
  'tooling/gates/porta-olivera.mjs': 'f54b37a53cb2ac1224bae5fdbce063f9c5f7451fb877206d715eb346da59f9c6',
  'tooling/gates/retira_torns.mjs': null,
  'tooling/wiki/frontmatter-abast.json': '5cbf487d903310789939c67548c6af43a6893899170198cb612d5ca07c19933e',
});

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
 * Estat de cada fitxer contra el disc: `pendent` (l'original és la base),
 * `aplicat` (ja és idèntic al de nous/) o `deriva` (ni una cosa ni l'altra; el
 * motiu porta el sha actual). Només llig.
 */
export function estat(root = ARREL, { nous = NOUS, bases = BASES } = {}) {
  const fitxers = fitxersNous(nous);
  const sobrants = Object.keys(bases).filter((r) => !fitxers.some((f) => f.ruta === r));
  if (sobrants.length) throw new Error(`BASES declara rutes sense fitxer a nous/: ${sobrants.join(', ')}`);
  return fitxers.map((f) => {
    const contingut = fs.readFileSync(path.join(nous, f.nou), 'utf8');
    const abs = path.join(root, f.ruta);
    const original = fs.existsSync(abs) ? fs.readFileSync(abs) : null;
    const actual = original === null ? null : sha(original);
    if (original !== null && original.toString('utf8') === contingut) return { ...f, contingut, before: actual, estat: 'aplicat' };
    if (!Object.hasOwn(bases, f.ruta)) return { ...f, contingut, before: actual, estat: 'deriva', motiu: `sense base a BASES (sha actual ${actual})` };
    if (actual !== bases[f.ruta]) {
      return { ...f, contingut, before: actual, estat: 'deriva', motiu: `el disc no és la base preparada: actual ${actual}, base ${bases[f.ruta]}. Algú l'ha canviat des del 260930; refés el paquet, no el forces` };
    }
    return { ...f, contingut, before: actual, estat: 'pendent' };
  });
}

/**
 * Transacció acceptada d'este paquet, o null. L'executor la deixa quan aplica el
 * pla (executor-mutacio.mjs, estat `accepted`), i només llavors: una fallada a
 * mitges deixa un pending i cap transacció. Després, els fitxers reals poden
 * evolucionar legítimament; esta marca és el que diu «aplicat», no la igualtat
 * amb nous/. Un registre il·legible no compta. Només llig.
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
  if (feta) throw new Error(`Paquet 260930b ja aplicat per la transacció ${feta.id} (${TRANSACCIONS}/). No es torna a aplicar: arxiveu el laboratori.`);
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

/** Manifest del bootstrap: el pla aprovat (si encara és a l'Escriptori) i el LLEGIU_PRIMER del laboratori. */
export function manifest(root = ARREL) {
  const sources = [];
  if (fs.existsSync(path.join(root, PLA_DOC))) {
    sources.push({ path: PLA_DOC, reason: "Pla d'implementació aprovat del torn torn_2c40cd77: decisió D6 i abast de la llesca L7 de governança.", classification: 'internal', role: 'reference' });
  }
  sources.push({ path: LLEGIU, reason: 'Troballes, contingut, ordres i proves del paquet de governança 260930b.', classification: 'internal', role: 'reference' });
  return `${JSON.stringify({ sources }, null, 2)}\n`;
}

/** La Petorreta mecànica de la sessió: prompt editorial amb les marques que el seal exigix. */
export function construeixPetorreta({ sessio, intentSha256, rulesSha256, planSha256, targets }) {
  return `---
type: prompt
status: esborrany
description: Petorreta del Reflex per al paquet de governança 260930b del torn torn_2c40cd77, aplicat amb executor-mutacio i lease del Mestre.
---
# Paquet de governança 260930b: portes, torns retirats i frontmatter

Reflex-Session: ${sessio}
Intent-SHA256: ${intentSha256}
Rules-SHA256: ${rulesSha256}
Plan-SHA256: ${planSha256}

## Context

La revisió adversarial del torn torn_2c40cd77 va confirmar que el hook d'Antigravity responia allow per a tot el que no jutjava, i per a l'IDE això autoaprova l'eina: amb el matcher universal, el hook era un aprovador de shell i d'escriptures. També va confirmar forats de caixa i de shell al mateix hook, una porta Olivera que deia net sense Escriptori, i 101 torns caducats que cap eina podia tancar ni retirar. El hook de Claude denega tota escriptura directa a .agents i tooling; per això el remei viatja en un sol pla sdp.mutation.v1 que només pot aplicar l'executor de mutacions amb esta lease. Les versions noves completes viuen al laboratori ${REL_LAB}/nous, amb el sha de cada original preparat; el pla es va construir contra el disc del moment i es va validar amb el mateix validatePlan de l'executor.

## Tasques

- Hook d'Antigravity: allow només per a les tres lectures acreditades; la resta, ask; interruptor que pregunta; autoprotecció i Escriptori sense distingir caixa; un document existent escrit amb una altra caixa del nom es jutja com el real; categoria fora del catàleg, cp, rm, rsync, ditto, >| i 01_produccio per shell, ask; traça amb l'ordre i els secrets en línia emmascarats.
- Porta Olivera: Escriptori absent, noms fora de taxonomia, àncores reapuntades per token després del lot, sense perdre cap error si també falla l'índex, capçalera tolerant, àncores planes amb fragment i extensió; a Vincles només se'n va l'àncora moguda.
- hooks-local: fora la línia morta de Bash.
- Torns: estat terminal retired a turns.mjs i CLI retira_torns.mjs, amb --sec per defecte.
- Frontmatter: normes de .agents/rules, Vincles a l'ON_ESTIC que genera despertar, immutables de 001 NEXUS.
- Closca del Mapa: git status sense locks opcionals.
- Skill core-higiene-escriptori: la lliçó 260930 de la incidència de l'Escriptori, sense tocar el frontmatter.

Fitxers del pla (${targets.length}): ${targets.join(', ')}.

## Riscos

- Entre el seal i l'executor no pot canviar res del repositori: el Reflex compara HEAD i l'estat de git sencer, i els scopes de tests i tooling/gates són carpetes senceres.
- La prova real del hook dins de l'IDE no s'ha pogut fer: ask respecta la memòria Always Allow de l'IDE, i el motiu de cada ask diu per què.
- La porta Reflex quedarà roja fins al commit, perquè el pla toca camins de governança.
- Si l'executor falla a mitges, el pending bloqueja noves mutacions fins a una reconciliació revisada; no es reintenta a cegues.

## Criteris d'acceptació

- L'executor torna valid:true i deixa una transacció a .agents/seal-transactions.
- Passen les proves que entren amb el codi i les guardes: antigravity-hook, porta-olivera-v3, turns-retirats, documental, sistema_nervios, hooks-local i mapa-consola; els corredors del laboratori fan skip perquè la transacció del paquet ja és a .agents/seal-transactions.
- La porta Frontmatter ja no marca .agents/rules, l'ON_ESTIC regenerat ni 001 NEXUS.
- retira_torns --sec llista els caducats i --escriu --nota els retira sense tocar cap torn viu ni tancat.
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

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  main(process.argv.slice(2)).catch((e) => { console.error(`[prepara-pla] ${e.message}`); process.exitCode = 1; });
}
