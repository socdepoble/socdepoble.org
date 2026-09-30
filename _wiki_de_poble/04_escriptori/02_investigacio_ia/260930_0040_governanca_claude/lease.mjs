#!/usr/bin/env node
/**
 * lease.mjs — Generador del paquet de governança del torn torn_d8024ad3 (260930).
 *
 * Aplica EN MEMÒRIA els pegats de ./pegats (en ordre, encadenant els que toquen
 * el mateix fitxer), construïx un pla sdp.mutation.v1 validat amb el mateix
 * validatePlan de tooling/gates/executor-mutacio.mjs i, amb una sessió del
 * Reflex oberta pel Mestre, escriu la Petorreta i el manifest dins del
 * bootstrap reservat i el pla a .sdp-reflex/plans/. MAI escriu un fitxer de
 * governança: això ho fa només l'executor amb la lease segellada.
 *
 * Ús (des de l'arrel del repositori):
 *   node _wiki_de_poble/04_escriptori/02_investigacio_ia/260930_0040_governanca_claude/lease.mjs comprova
 *   node _wiki_de_poble/04_escriptori/02_investigacio_ia/260930_0040_governanca_claude/lease.mjs bootstrap --session=ID
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const LAB = path.dirname(fileURLToPath(import.meta.url));
export const ARREL = path.resolve(LAB, '../../../..');
const REL_LAB = '_wiki_de_poble/04_escriptori/02_investigacio_ia/260930_0040_governanca_claude';
export const ORDRE = ['t1-skills', 't5-olivera', 't13-t14-maria', 't10-t12-mapa', 't15-relleu'];
export const SESSIO_ZERO = '00000000-0000-4000-8000-000000000000';
export const INTENT = 'Torn torn_d8024ad3 T1-T16: paquet de governanca (skills i esquema, porta Olivera v3, closca del Mapa, AGENTS 0.1, hook Antigravity, relleu ESTAT i LEDGER) amb executor-mutacio';
export const PLA_DOC = '_wiki_de_poble/04_escriptori/260930_0040_pla_implementacio_consola.md';
export const NOM_PETORRETA = '260930_0310_PROMPT_paquet_de_governanca_del_torn_t1_t16_amb_executor.md';

const sha = (valor) => createHash('sha256').update(valor).digest('hex');

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
    || ruta.split('/').some((p) => !p || p === '.' || p === '..')) throw new Error(`Ruta de pegat no canònica: ${String(ruta)}`);
  return ruta;
}

/** Aplica tots els pegats en memòria i torna el pla i els scopes. Cap escriptura. */
export async function preparaPla(root = ARREL, { sessio = SESSIO_ZERO, operationId = 'sdp-t1-t16-260930', validar = true } = {}) {
  const originals = new Map(); // ruta → Buffer | null
  const nous = new Map();      // ruta → contingut encadenat
  const ordre = [];
  for (const nom of ORDRE) {
    const mod = await import(pathToFileURL(path.join(LAB, 'pegats', `${nom}.mjs`)).href);
    if (!Array.isArray(mod.operacions)) throw new Error(`${nom}: no exporta operacions`);
    for (const op of mod.operacions) {
      const ruta = rutaSegura(op?.ruta);
      const abs = path.join(root, ruta);
      if (!originals.has(ruta)) originals.set(ruta, fs.existsSync(abs) ? fs.readFileSync(abs) : null);
      const original = originals.get(ruta);
      const actual = nous.has(ruta) ? nous.get(ruta) : (original === null ? null : original.toString('utf8'));
      for (const d of op.depen || []) if (!nous.has(d)) throw new Error(`${nom} · ${ruta}: depén de ${d}, que encara no s'ha aplicat`);
      let nou;
      if (op.crea) {
        if (actual !== null) throw new Error(`${nom} · ${ruta}: ja existix; «crea» no sobreescriu`);
        nou = fs.readFileSync(path.join(LAB, rutaSegura(op.crea)), 'utf8');
      } else if (op.substituix) {
        if (actual === null) throw new Error(`${nom} · ${ruta}: no existix; «substituix» necessita l'original`);
        if (sha(actual) !== op.base) throw new Error(`${nom} · ${ruta}: el fitxer ha canviat des que es va preparar el pegat (base ${String(op.base).slice(0, 8)}, actual ${sha(actual).slice(0, 8)}); refés-lo, no el forces`);
        nou = fs.readFileSync(path.join(LAB, rutaSegura(op.substituix)), 'utf8');
      } else if (typeof op.aplica === 'function') {
        if (actual === null) throw new Error(`${nom} · ${ruta}: no existix; «aplica» necessita l'original`);
        nou = op.aplica(actual, nous);
      } else throw new Error(`${nom} · ${ruta}: operació sense crea, substituix ni aplica`);
      if (typeof nou !== 'string' || nou === actual) throw new Error(`${nom} · ${ruta}: el pegat no produïx cap canvi`);
      nous.set(ruta, nou);
      if (!ordre.includes(ruta)) ordre.push(ruta);
    }
  }
  const files = ordre.map((ruta) => ({
    path: ruta,
    before: originals.get(ruta) === null ? null : sha(originals.get(ruta)),
    content: nous.get(ruta),
  }));
  const plan = { schema: 'sdp.mutation.v1', session: sessio, operationId, files };
  if (validar) {
    const { validatePlan } = await import(pathToFileURL(path.join(root, 'tooling/gates/executor-mutacio.mjs')).href);
    validatePlan(fs.realpathSync(root), plan);
  }
  const scopes = [...new Set(ordre.map((ruta) => {
    let r = ruta;
    while (!fs.existsSync(path.join(root, r))) r = path.posix.dirname(r);
    return r;
  }))];
  return { plan, scopes, targets: ordre };
}

/** La Petorreta mecànica de la sessió (P-04): prompt editorial amb les marques del Reflex. */
export function construeixPetorreta({ sessio, intentSha256, rulesSha256, planSha256, targets }) {
  return `---
type: prompt
status: esborrany
description: Petorreta del Reflex per al paquet de governança del torn torn_d8024ad3 (T1-T16), aplicat amb executor-mutacio i lease del Mestre.
---
# Paquet de governança del torn torn_d8024ad3 (T1-T16)

Reflex-Session: ${sessio}
Intent-SHA256: ${intentSha256}
Rules-SHA256: ${rulesSha256}
Plan-SHA256: ${planSha256}

## Context

El torn de Claude (Opus 5.5) ha implementat a src les tasques T2-T12 i T15 del prompt 260929_2346 de MarIA sense tocar cap fitxer de governança. El hook de Claude denega tota escriptura directa a .agents, tooling, package.json i AGENTS.md; per això la resta viatja en un sol pla sdp.mutation.v1 que només pot aplicar l'executor de mutacions amb esta lease. El pla es va construir aplicant en memòria els pegats del laboratori 260930_0040_governanca_claude contra el contingut del disc en el moment del bootstrap, amb els hashes previs calculats llavors, i es va validar amb el mateix validatePlan de l'executor. El segell de skills es va reconciliar abans (0c91c0dd, alta de core-neteja-brossa) i l'executor el resegellarà en acabar.

## Tasques

- T1: core-neteja-brossa amb type, status, disparadors i Vincles; contracte.llig a quatre skills; esquema, pany i deute amb el SHA nou; índexs de skills; test:node amb les bateries noves.
- T5: porta Olivera v3 (vius declarats a Activitat en curs, arxivat per nom i simulació, secció Preflight acceptada, mode hook explícit) i skill d'higiene reescrita.
- T10 i T12: closca del Mapa que llig la configuració de Codex, AGENTS.md, les fonts d'arrencada i les fonts de vigilància (torns, Escriptori, LEDGER, ESTAT).
- T13 i T14: AGENTS 0.1 amb la definició única d'Escriptori net i l'orquestradora resolutiva, mirall generat, skill de reflex, hooks d'Antigravity en el format documentat de l'IDE i adaptador amb interruptor d'apagada.
- T16: bloc ESTAT_ACTUAL i entrada signada del LEDGER.

Fitxers del pla (${targets.length}): ${targets.join(', ')}.

## Riscos

- Entre el seal i l'executor no pot canviar res del repositori: el Reflex compara HEAD i l'estat de git sencer.
- El hook d'Antigravity no s'ha pogut provar dins de l'IDE; falla cap a preguntar i es pot apagar amb el fitxer d'interruptor.
- La Porta Reflex quedarà roja fins al commit, perquè el pla toca camins crítics (package.json, AGENTS.md, esquema, sdp-workflow).
- Si l'executor falla a mitges, el pending bloqueja noves mutacions fins a una reconciliació revisada; no es reintenta a cegues.

## Criteris d'acceptació

- L'executor torna valid:true i deixa una transacció a .agents/seal-transactions amb el segell nou.
- node tooling/gates/segella.mjs ix verd; les bateries de test:node i les proves noves (porta-olivera-v3, antigravity-hook, fonts-vigilancia, mapa-consola) passen.
- La Consola servida mostra Codex a Els que conversen i les mètriques de vigilància amb valor.
- tancament.mjs --check del torn és vàlid abans del --close.
`;
}

function parseArgs(argv) {
  const [ordre, ...resta] = argv;
  const opts = {};
  for (const a of resta) {
    const m = /^--session=([0-9a-f-]{36})$/i.exec(a);
    if (m) opts.sessio = m[1]; else throw new Error(`Argument desconegut: ${a}`);
  }
  return { ordre, ...opts };
}

async function comprova(root) {
  const { calculaSegell, verificaSegell } = await import(pathToFileURL(path.join(root, 'tooling/gates/segella.mjs')).href);
  const estat = verificaSegell(root);
  console.log(`Segell: ${estat.ok ? 'intacte' : estat.motiu} · actual ${calculaSegell(root).hash} · segellat ${estat.anterior}`);
  const { plan, scopes, targets } = await preparaPla(root);
  console.log(`Pla vàlid: ${targets.length} fitxers, ${Buffer.byteLength(JSON.stringify(plan))} bytes.`);
  for (const f of plan.files) console.log(`  ${f.before ? 'M' : 'A'} ${f.path}`);
  console.log('\nOrdre d\'open:');
  console.log(`node tooling/wiki/reflex_petorreta.mjs open --intent="${INTENT}" --risk=high --operation=governance-write ${scopes.map((s) => `--scope=${s}`).join(' ')}`);
}

async function bootstrap(root, sessio) {
  if (!sessio) throw new Error('Cal --session=ID (el que ha imprés open)');
  const fitxerSessio = path.join(root, '.sdp-reflex/sessions', `${sessio}.json`);
  const sessio_ = JSON.parse(fs.readFileSync(fitxerSessio, 'utf8'));
  if (sessio_.status !== 'open') throw new Error(`La sessió no està oberta: ${sessio_.status}`);
  if (!sessio_.operations?.includes('governance-write') || sessio_.risk !== 'high') throw new Error('La sessió ha de ser --risk=high amb --operation=governance-write');
  const { plan, targets } = await preparaPla(root, { sessio, operationId: `sdp-t1-t16-${sessio.slice(0, 8)}` });
  const fora = targets.filter((t) => !sessio_.scopes.some((s) => s === '.' || t === s || t.startsWith(`${s}/`)));
  if (fora.length) throw new Error(`Targets fora dels scopes de la sessió: ${fora.join(', ')}`);
  const textPla = JSON.stringify(plan);
  const planSha256 = sha(textPla);
  const dirBootstrap = path.join(root, sessio_.bootstrap.path);
  if (!fs.statSync(dirBootstrap).isDirectory() || fs.readdirSync(dirBootstrap).length) throw new Error('El bootstrap reservat no existix o no és buit');
  const petorreta = construeixPetorreta({ sessio, intentSha256: sessio_.intentSha256, rulesSha256: sessio_.rulesDigest, planSha256, targets });
  const manifest = `${JSON.stringify({ sources: [{ path: PLA_DOC, reason: 'Pla d\'implementació aprovat del torn torn_d8024ad3: abast de la part de governança.', classification: 'internal', role: 'reference' }] }, null, 2)}\n`;
  const { validatePetorreta } = await import(pathToFileURL(path.join(root, 'tooling/wiki/reflex_petorreta.mjs')).href);
  const errors = validatePetorreta(path.join(dirBootstrap, NOM_PETORRETA), petorreta);
  const perills = [...sensibles(petorreta), ...sensibles(manifest), ...sensibles(fs.readFileSync(path.join(root, PLA_DOC), 'utf8'))];
  if (errors.length || perills.length) throw new Error(`Petorreta o manifest no passarien el seal: ${[...errors, ...perills].join('; ')}`);
  const dirPlans = path.join(root, '.sdp-reflex/plans');
  fs.mkdirSync(dirPlans, { recursive: true, mode: 0o700 });
  fs.writeFileSync(path.join(dirPlans, `${sessio}.json`), textPla, { flag: 'wx', mode: 0o600 });
  fs.writeFileSync(path.join(dirBootstrap, NOM_PETORRETA), petorreta, { flag: 'wx', mode: 0o600 });
  fs.writeFileSync(path.join(dirBootstrap, 'context.json'), manifest, { flag: 'wx', mode: 0o600 });
  const relB = sessio_.bootstrap.path;
  console.log(`Pla: .sdp-reflex/plans/${sessio}.json (${targets.length} fitxers) · Plan-SHA256 ${planSha256}`);
  console.log('\nSeal (posa-hi el nonce que t\'ha imprés open):');
  console.log(`node tooling/wiki/reflex_petorreta.mjs seal --session=${sessio} --nonce=NONCE --petorreta=${relB}/${NOM_PETORRETA} --manifest=${relB}/context.json`);
  console.log('\nExecutor:');
  console.log(`node tooling/gates/executor-mutacio.mjs .sdp-reflex/plans/${sessio}.json .sdp-reflex/sessions/${sessio}.json`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  try {
    const { ordre, sessio } = parseArgs(process.argv.slice(2));
    if (ordre === 'comprova') await comprova(ARREL);
    else if (ordre === 'bootstrap') await bootstrap(ARREL, sessio);
    else throw new Error(`Ús: ${REL_LAB}/lease.mjs comprova | bootstrap --session=ID`);
  } catch (e) { console.error(`[lease] ${e.message}`); process.exitCode = 1; }
}
