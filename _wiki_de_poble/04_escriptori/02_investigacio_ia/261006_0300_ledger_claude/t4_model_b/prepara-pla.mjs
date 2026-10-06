#!/usr/bin/env node
/**
 * prepara-pla.mjs — pla sdp.mutation.v1 del paquet de governança del front T4
 * (ENX-01, Model B). Decisió del Mestre (261006, xat): candidata S amb la
 * variant final, «ADR + port neutral»; l'ADR-2026-09 queda signada el 2026-10-06.
 *
 * La part de la Wiki i de src/ ja és aplicada (Edit, segona onada): l'ADR, la
 * plantilla prompt_local, l'estàndard d'integració, dos comentaris de codi i un
 * títol de prova. Este paquet porta només el que el hook no deixa editar:
 *   · AGENTS.md:53 i el seu mirall .agents/AGENTS.md, amb els mateixos bytes;
 *   · .agents/QUI_SOC.md:37;
 *   · .agents/protocolledge.json:70 (ruta prompt.local, 3.3.0 → 3.4.0).
 *
 * Format de l'Olivera (261006_0055_olivera_ancores_opus): les versions noves
 * completes viuen a nous/ amb la ruta real (un .md es guarda com .md.txt).
 * BASES fixa el sha256 de cada original al tall i és el `before` de la CAS: si
 * el disc ja no és eixe, deriva i el pla es nega, perquè una còpia sencera
 * tornaria enrere en silenci el canvi d'una altra mà. Un fitxer idèntic al de
 * nous/ està aplicat i ix del pla. Quan l'executor ja ha deixat la transacció
 * acceptada del paquet (operationId `sdp-model-b-enx01-261006-*`), el pla es nega.
 *
 * Precondició mecànica: la frase canònica ha de ser ja, una sola vegada, a la
 * plantilla i a l'ADR (substitucions.json, llocsDeLaFrase). Si no hi és, el pla
 * es nega: AGENTS.md no pot dir una frase que la Wiki ja no diu.
 *
 * Seguix el flux de la lease: open → bootstrap → seal → executor. No escriu cap
 * fitxer: el pla, la Petorreta i el manifest van a stdout, i la redirecció `>`
 * la fa el Mestre amb les ordres que imprimix `comprova --session=ID`.
 *
 * Ús (des de l'arrel del repositori; LAB és la carpeta d'este fitxer):
 *   node LAB/prepara-pla.mjs [pla] [--session=ID]      # pla JSON per stdout
 *   node LAB/prepara-pla.mjs comprova [--session=ID]   # resum, deriva, precondició i ordre d'open
 *   node LAB/prepara-pla.mjs petorreta --session=ID    # Petorreta del bootstrap per stdout
 *   node LAB/prepara-pla.mjs manifest                  # context.json del bootstrap per stdout
 *   node LAB/prepara-pla.mjs genera                    # refà nous/ des del disc del tall (només el laboratori)
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const LAB = path.dirname(fileURLToPath(import.meta.url));
export const ARREL = path.resolve(LAB, '../../../../..');
export const REL_LAB = '_wiki_de_poble/04_escriptori/02_investigacio_ia/261006_0300_ledger_claude/t4_model_b';
export const NOUS = path.join(LAB, 'nous');
export const FITXER_FONT = path.join(LAB, 'substitucions.json');
export const SESSIO_ZERO = '00000000-0000-4000-8000-000000000000';
/** Tall: HEAD 76947e5d. Cap dels quatre originals tenia canvis sense commit en preparar el paquet. */
export const HEAD = '76947e5d';
/** sha256 de cada original al tall. És la base de la CAS de l'executor (`before`). */
export const BASES = Object.freeze({
  '.agents/AGENTS.md': '5efd440f0c0c22ab5268ea91602a3ea6ad3ef4b80565aab71d628e142eaa5e8a',
  '.agents/QUI_SOC.md': '88c7864696183ffed1db0860cf36e7260594cb49b43b25143caf536d60c58435',
  '.agents/protocolledge.json': '126758b52e7a1e8209c04b0e49a3738d428bcc085e1554451555c0b0648491ef',
  'AGENTS.md': '5efd440f0c0c22ab5268ea91602a3ea6ad3ef4b80565aab71d628e142eaa5e8a',
});
export const ORIGEN_MIRALL = 'AGENTS.md';
export const MIRALL = '.agents/AGENTS.md';
export const INTENT = "Front T4 ENX-01: frase canonica del Model B (ADR + port neutral, decisio del Mestre 261006) a AGENTS.md seccio 8 i al seu mirall, QUI_SOC.md i la versio 3.4.0 de prompt.local a protocolledge.json, amb executor-mutacio";
export const LLEGIU = `${REL_LAB}/LLEGIU_PRIMER.txt`;
export const NOM_PETORRETA = '261006_0300_PROMPT_model_b_frase_canonica_agents_mirall_quisoc_protocolledge_executor.md';
/** Prefix de l'operationId del pla: el marcador que l'executor deixa a .agents/seal-transactions/. */
export const OPERACIO = 'sdp-model-b-enx01-261006-';
const TRANSACCIONS = '.agents/seal-transactions';
const ADR = '_wiki_de_poble/02_saber/architecture/ADR-2026-09-SOLLUTIA-MODEL-B.md';
const SIGNATURA = 'Aprovació humana: signada.';
const US = `Ús: ${REL_LAB}/prepara-pla.mjs [pla|comprova|petorreta|manifest|genera] [--session=ID]`;

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

/** Ocurrències exactes (sense solapar) d'un text dins d'un altre. */
export function compta(text, fragment) {
  if (!fragment) throw new Error('Fragment buit');
  let n = 0;
  for (let i = text.indexOf(fragment); i >= 0; i = text.indexOf(fragment, i + fragment.length)) n += 1;
  return n;
}

/** substitucions.json, validat: la frase, els llocs on ha de viure i els parells vell → nou. */
export function carrega(fitxer = FITXER_FONT) {
  const dades = JSON.parse(fs.readFileSync(fitxer, 'utf8'));
  if (dades?.schema !== 'sdp.t4.governanca.v2') throw new Error('substitucions.json: esquema desconegut');
  if (typeof dades.frase !== 'string' || !dades.frase.startsWith('**Model B:** ')) throw new Error('substitucions.json: falta la frase canònica');
  if (!dades.llocsDeLaFrase || !Array.isArray(dades.governanca) || !Array.isArray(dades.aplicat)) throw new Error('substitucions.json: incomplet');
  return dades;
}

/** Un text de substitucions.json amb la frase al lloc de {{FRASE}}. */
export function expandix(text, dades) {
  return text.replaceAll('{{FRASE}}', dades.frase);
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

/** Substitucions de la governança agrupades per fitxer, en l'ordre de substitucions.json. */
export function perFitxer(dades = carrega()) {
  const grups = new Map();
  for (const s of dades.governanca) grups.set(rutaSegura(s.fitxer), [...(grups.get(s.fitxer) ?? []), s]);
  return grups;
}

/** Text final d'un fitxer: l'original amb cada «vell» (una sola vegada) canviat pel seu «nou». */
export function aplica(original, subs, dades) {
  let text = original;
  for (const s of subs) {
    if (compta(text, s.vell) !== 1) throw new Error(`${s.id} (línia ${s.linia}): el text vell hi apareix ${compta(text, s.vell)} vegades`);
    text = text.replace(s.vell, () => expandix(s.nou, dades));
  }
  return text;
}

/**
 * Genera nous/ des del disc del tall més les substitucions, byte a byte (els
 * espais finals de línia de l'original es conserven, cosa que una còpia a mà no
 * garantix). Només escriu dins de nous/ i es nega si un original no és el de
 * BASES. És l'única via per a refer nous/ després d'editar substitucions.json.
 */
export function genera(root = ARREL, { nous = NOUS, dades = carrega(), bases = BASES } = {}) {
  const escrits = [];
  for (const [ruta, subs] of perFitxer(dades)) {
    const original = fs.readFileSync(path.join(root, ruta));
    if (sha(original) !== bases[ruta]) throw new Error(`${ruta}: el disc no és el del tall ${HEAD}; no es genera nous/`);
    const rel = ruta.endsWith('.md') ? `${ruta}.txt` : ruta;
    fs.mkdirSync(path.dirname(path.join(nous, rel)), { recursive: true });
    fs.writeFileSync(path.join(nous, rel), aplica(original.toString('utf8'), subs, dades));
    escrits.push(rel);
  }
  return escrits;
}

/**
 * Precondicions de la Wiki: la frase canònica, una sola vegada i en la seua
 * forma, a cada lloc que no porta el paquet; i l'ADR signada. Torna la llista
 * d'incompliments (buida = es pot obrir).
 */
export function precondicions(root = ARREL, dades = carrega()) {
  const errors = [];
  const llig = (rel) => (fs.existsSync(path.join(root, rel)) ? fs.readFileSync(path.join(root, rel), 'utf8') : null);
  for (const [ruta, forma] of Object.entries(dades.llocsDeLaFrase)) {
    if (ruta === ORIGEN_MIRALL || ruta === MIRALL) continue;
    const text = llig(ruta);
    if (text === null) { errors.push(`${ruta}: no és al disc`); continue; }
    if (compta(text, dades.frase) !== 1 || compta(text, expandix(forma, dades)) !== 1) {
      errors.push(`${ruta}: la frase canònica no hi és una sola vegada en la forma «${forma}»`);
    }
  }
  const adr = llig(ADR);
  if (adr !== null && !adr.includes(SIGNATURA)) errors.push(`${ADR}: falta «${SIGNATURA}»`);
  return errors;
}

/**
 * Estat de cada fitxer de nous/ contra el disc: `pendent` (l'original és el
 * fixat a BASES), `aplicat` (ja és idèntic al de nous/) o `deriva` (ni una cosa
 * ni l'altra). El mirall ha de portar els mateixos bytes que AGENTS.md dins de
 * nous/; si no, el paquet mateix està trencat. Només llig.
 */
export function estat(root = ARREL, { nous = NOUS, bases = BASES } = {}) {
  const fitxers = fitxersNous(nous);
  const origen = fitxers.find((f) => f.ruta === ORIGEN_MIRALL);
  const mirall = fitxers.find((f) => f.ruta === MIRALL);
  if (!origen || !mirall || !fs.readFileSync(path.join(nous, origen.nou)).equals(fs.readFileSync(path.join(nous, mirall.nou)))) {
    throw new Error('nous/: el mirall .agents/AGENTS.md ha de portar els mateixos bytes que AGENTS.md (porta-autoritat.mjs:12)');
  }
  return fitxers.map((f) => {
    const contingut = fs.readFileSync(path.join(nous, f.nou), 'utf8');
    const abs = path.join(root, f.ruta);
    const original = fs.existsSync(abs) ? fs.readFileSync(abs) : null;
    const actual = original === null ? null : sha(original);
    if (original !== null && original.toString('utf8') === contingut) return { ...f, contingut, before: actual, estat: 'aplicat' };
    if (!Object.hasOwn(bases, f.ruta)) return { ...f, contingut, before: actual, estat: 'deriva', motiu: 'fitxer fora de BASES: el paquet no en porta cap de nou' };
    if (original === null) return { ...f, contingut, before: null, estat: 'deriva', motiu: `era al tall ${HEAD} i ja no és al disc` };
    if (actual !== bases[f.ruta]) {
      return { ...f, contingut, before: actual, estat: 'deriva', motiu: `el disc no és el del tall ${HEAD}: actual ${actual}, base ${bases[f.ruta]}. Algú l'ha canviat; refés el paquet, no el forces` };
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

/** Fitxer o directori existent més pròxim de cada target, sense scopes niats: el Reflex només admet scopes que existixen. */
export function scopesDe(root, targets) {
  const crus = [...new Set(targets.map((ruta) => {
    let r = ruta;
    while (r !== '.' && !fs.existsSync(path.join(root, r))) r = path.posix.dirname(r);
    return r;
  }))];
  return crus.filter((s) => !crus.some((o) => o !== s && (o === '.' || s.startsWith(`${o}/`)))).sort();
}

/** Línies que imprimix `comprova` sense sessió: la condició humana i l'ordre d'open. */
export function liniesOpen(scopes) {
  return [
    "Condició: decisió del Mestre del 261006 (candidata S amb la variant final, ADR-2026-09 signada). La Wiki ja porta la frase; esta ordre només obri la lease de la governança.",
    '',
    "Ordre d'open:",
    `node tooling/wiki/reflex_petorreta.mjs open --intent="${INTENT}" --risk=high --operation=governance-write ${scopes.map((s) => `--scope=${s}`).join(' ')}`,
  ];
}

/**
 * Pla dels fitxers pendents, validat amb el mateix validatePlan de l'executor.
 * Cap escriptura. `eines` és l'arrel d'on s'importa tooling/ (la mateixa en ús real).
 */
export async function preparaPla(root = ARREL, { sessio = SESSIO_ZERO, validar = true, eines = root, dades = carrega() } = {}) {
  const feta = transaccio(root);
  if (feta) throw new Error(`El paquet de governança del T4 ja s'ha aplicat amb la transacció ${feta.id} (${TRANSACCIONS}/). No es torna a aplicar: arxiveu el laboratori.`);
  const pre = precondicions(root, dades);
  if (pre.length) throw new Error(`Precondició de la Wiki incomplida (refés el paquet, no el forces):\n${pre.join('\n')}`);
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
    const { validatePlan } = await import(pathToFileURL(path.join(eines, 'tooling/gates/executor-mutacio.mjs')).href);
    validatePlan(fs.realpathSync(root), plan);
  }
  const targets = pendents.map((f) => f.ruta);
  return { plan, scopes: scopesDe(root, targets), targets, aplicats: fitxers.filter((f) => f.estat === 'aplicat').map((f) => f.ruta) };
}

/** Manifest del bootstrap: el LLEGIU_PRIMER del laboratori, que porta el què, el perquè i l'ordre. */
export function manifest() {
  const sources = [{ path: LLEGIU, reason: 'Decisió del Mestre sobre el Model B, què s’ha aplicat a la Wiki i a src/, què porta el paquet de governança, ordre d’aplicació, efectes i decisions pendents.', classification: 'internal', role: 'reference' }];
  return `${JSON.stringify({ sources }, null, 2)}\n`;
}

/** La Petorreta mecànica de la sessió: prompt editorial amb les marques que el seal exigix. */
export function construeixPetorreta({ sessio, intentSha256, rulesSha256, planSha256, targets }) {
  return `---
type: prompt
status: esborrany
description: Petorreta del Reflex per al paquet de governança del Model B (ENX-01), aplicat amb executor-mutacio i lease del Mestre.
---
# Model B: la frase canònica a AGENTS.md, al seu mirall, a QUI_SOC i la versió 3.4.0 de prompt.local

Reflex-Session: ${sessio}
Intent-SHA256: ${intentSha256}
Rules-SHA256: ${rulesSha256}
Plan-SHA256: ${planSha256}

## Context

L'auditoria Opus 261006 (ENX-01, P0, decisió humana) va trobar tres lectures del Model B: AGENTS.md §8 parlava de Sollutia com a backend, la plantilla prompt_local deia que el Supabase era un endoll intercanviable i l'ADR-2026-09 deia que el Supabase de Sóc de Poble és la font de veritat i que a Sollutia només se li llig per GET a través de la Frontissa. El 261006 el Mestre va triar al xat «ADR + port neutral» (candidata S amb la variant final) i va signar l'ADR-2026-09. La segona onada ja ha posat la frase canònica a l'ADR i a la plantilla prompt_local, i ha corregit l'estàndard d'integració i dos comentaris de codi. Falta la governança, que només es toca amb l'executor i una lease: les versions noves completes viuen a ${REL_LAB}/nous, i cada original es contrasta amb el sha256 que tenia al tall ${HEAD}.

## Tasques

- AGENTS.md §8 i el seu mirall .agents/AGENTS.md: la línia 53 passa a ser la frase canònica, amb els mateixos bytes als dos fitxers.
- .agents/QUI_SOC.md, línia 37: el sistema usa el Supabase de Sóc de Poble, única font de veritat, i Sollutia n'és l'amfitrió (Model B).
- .agents/protocolledge.json: la ruta prompt.local passa de 3.3.0 a 3.4.0, la mateixa versió que ja diu la plantilla.

Fitxers del pla (${targets.length}): ${targets.join(', ')}.

## Riscos

- Entre el seal i l'executor no pot canviar res del repositori: el Reflex compara HEAD i l'estat de git sencer.
- Pujar la versió de protocolledge canvia el hash del contracte: un torn obert amb algun rebut sense instantània deixaria de tancar. El corredor els compta i exigix que tots estiguen caducats.
- El panell d'Agents de la Wiki mostra AGENTS.md tal qual: aplicar el paquet canvia eixe text (contingut decidit pel Mestre, cap canvi de disseny).
- Si l'executor falla a mitges, el pending bloqueja noves mutacions fins a una reconciliació revisada; no es reintenta a cegues.

## Criteris d'acceptació

- L'executor torna valid:true i deixa una transacció a .agents/seal-transactions amb operationId ${OPERACIO}.
- node tooling/gates/porta-autoritat.mjs torna valid:true (mirall idèntic) i node tooling/gates/porta-plantilles.mjs i node tooling/gates/tractor-doctrina.mjs ixen amb 0.
- La frase canònica apareix una sola vegada, idèntica, a AGENTS.md, al mirall, a la plantilla prompt_local i a l'ADR-2026-09.
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
export async function preparaSessio(root, sessio, { eines = root } = {}) {
  const s = llegeixSessio(root, sessio);
  const { plan, targets } = await preparaPla(root, { sessio, eines });
  const fora = targets.filter((t) => !s.scopes.some((sc) => sc === '.' || t === sc || t.startsWith(`${sc}/`)));
  if (fora.length) throw new Error(`Targets fora dels scopes de la sessió: ${fora.join(', ')}`);
  const petorreta = construeixPetorreta({ sessio, intentSha256: s.intentSha256, rulesSha256: s.rulesDigest, planSha256: sha(JSON.stringify(plan)), targets });
  const text = manifest();
  const { validatePetorreta } = await import(pathToFileURL(path.join(eines, 'tooling/wiki/reflex_petorreta.mjs')).href);
  const errors = validatePetorreta(path.join(root, s.bootstrap.path, NOM_PETORRETA), petorreta);
  const fonts = JSON.parse(text).sources.map((f) => fs.readFileSync(path.join(root, f.path), 'utf8'));
  const perills = [...sensibles(petorreta), ...sensibles(text), ...fonts.flatMap(sensibles)];
  if (errors.length || perills.length) throw new Error(`La Petorreta o el manifest no passarien el seal: ${[...errors, ...perills].join('; ')}`);
  return { s, plan, targets, petorreta, manifest: text };
}

export async function comprova(root, sessio, { eines = root } = {}) {
  const { plan, scopes, targets, aplicats } = await preparaPla(root, { sessio: sessio ?? SESSIO_ZERO, eines });
  console.log(`Pla vàlid: ${targets.length} fitxers, ${Buffer.byteLength(JSON.stringify(plan))} bytes.`);
  for (const f of plan.files) console.log(`  M ${f.path}  before ${f.before}`);
  for (const r of aplicats) console.log(`  = ${r} (ja aplicat; fora del pla)`);
  if (!sessio) {
    console.log('');
    for (const linia of liniesOpen(scopes)) console.log(linia);
    return;
  }
  const { s } = await preparaSessio(root, sessio, { eines });
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

export function parseArgs(argv) {
  const ordre = argv[0] && !argv[0].startsWith('--') ? argv[0] : 'pla';
  const resta = argv[0] && !argv[0].startsWith('--') ? argv.slice(1) : argv;
  if (!['pla', 'comprova', 'petorreta', 'manifest', 'genera'].includes(ordre)) throw new Error(`Ordre desconeguda: ${ordre}. ${US}`);
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
  else if (ordre === 'genera') for (const rel of genera(ARREL)) console.log(`nous/${rel}`);
  else process.stdout.write(manifest());
}

// La guarda que no salta mai és `file://${argv[1]}`: l'arrel té espais.
function esEntrada() {
  try { return Boolean(process.argv[1]) && pathToFileURL(fs.realpathSync(process.argv[1])).href === import.meta.url; }
  catch { return false; }
}
if (esEntrada()) {
  main(process.argv.slice(2)).catch((e) => { console.error(`[prepara-pla] ${e.message}`); process.exitCode = 1; });
}
