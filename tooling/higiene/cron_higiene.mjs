#!/usr/bin/env node
/**
 * cron_higiene.mjs — Cron d'higiene del Mas (Onada 6, 261009).
 *
 * El llança launchd cada dia a les 05:30 (scripts/immunitari/org.socdepoble.higiene.plist)
 * amb --aplica. Tres nivells, i cadascun fa menys del que el seu nom faria pensar:
 *
 *   L0 · Informe, sempre: .immunitari/higiene/aammdd.json (fora de git). Brossa solta de
 *        l'arrel, fitxers .bak, .tmp, .orig, .rej, ~, .old i .abans-aammdd versionats (només
 *        es llisten), retenció dels ZIP de wordpress-plugin/builds/, mida dels logs de
 *        .agents/runtime, receptes de Plaquetes repetides, la porta Olivera (checkTaula i,
 *        amb la porta v4, la convocatòria i el sediment de l'índex) i, si s'absté, per què.
 *   L1 · Només el que es pot desfer, amb --aplica:
 *        · la brossa no versionada de l'arrel va a .sdp-paperera/quarantena-ISO amb
 *          MANIFEST.json (neteja_brossa_arrel.mjs: la mateixa llista negra de sempre);
 *        · els logs de traça de .agents/runtime que passen d'1 MiB es reanomenen a
 *          NOM.aammdd_hhmm.log (el hook en comença un de nou; *.log continua fora de git), i
 *          dels rotats es queden els ROTATS_CONSERVATS més nous de cada log: els altres van a
 *          .sdp-paperera/quarantena-ISO-logs amb MANIFEST.json;
 *        · les receptes de Plaquetes no versionades i repetides (mateixa empremta) van a
 *          .sdp-paperera/quarantena-ISO-receptes amb MANIFEST.json; es queda la més nova
 *          de cada empremta i tota recepta aprovada.
 *        Les quarantenes del circuit les ignora git (.gitignore del paquet): el que s'hi mou
 *        no torna a entrar al repositori per una altra ruta.
 *   L2 · Amb porta humana. --l2 només mostra la proposta i el seu codi; --l2 --confirma
 *        CODI l'aplica, i només des d'un terminal. Retenció dels ZIP (es conserven els que
 *        nomena stable.json, el més recent de cada producte i carpeta i els que cita
 *        l'última Acta Marmota; la resta va a ../.sdp-paperera-builds/retencio-ISO, fora del
 *        repositori, amb MANIFEST.json i el sha256 de cada paquet; el cron no l'esborra
 *        mai, la buida el Mestre a mà) i purga de les quarantenes .sdp-paperera/quarantena-*
 *        del circuit de més de 30 dies.
 *
 * MAI: entrades que comencen per punt (incident del 260929), fitxers versionats,
 * 04_escriptori, 01_produccio, 02_investigacio_ia, 90_arxiu_historic, .iaia_auth ni .env*.
 * Les úniques entrades amb punt que toca són camins exactes del mateix circuit:
 * .agents/runtime/ (només els logs de ROTABLES i els seus rotats), .immunitari/receptes/
 * (només NNN_RECEPTA.json), .immunitari/higiene/ (l'informe) i les quarantenes
 * .sdp-paperera/quarantena-* que porten MANIFEST.json.
 * S'absté de L1 i de L2 amb una escriptura documental o una mutació en curs
 * (.agents/runtime/document-create.lock, mutation.lock o mutation.pending.json) o amb un
 * torn obert tocat en les últimes dues hores. L'informe diu per què.
 *
 * Ús (des de l'arrel):
 *   node tooling/higiene/cron_higiene.mjs                       # L0
 *   node tooling/higiene/cron_higiene.mjs --aplica              # L0 + L1 (el launchd)
 *   node tooling/higiene/cron_higiene.mjs --l2                  # proposta L2 i el seu codi
 *   node tooling/higiene/cron_higiene.mjs --l2 --confirma CODI  # aplica la L2 (terminal humà)
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { arrelSegura, esMain } from '../lib/arrel.mjs';
import { candidats, neteja } from './neteja_brossa_arrel.mjs';
import * as olivera from '../gates/porta-olivera.mjs';

export const INFORMES = '.immunitari/higiene';
export const RUNTIME = '.agents/runtime';
export const RECEPTES = '.immunitari/receptes';
export const APROVACIONS = '.immunitari/aprovacions';
export const PAPERERA = '.sdp-paperera';
export const BUILDS = 'wordpress-plugin/builds';
export const ACTES = '_wiki_de_poble/10_actes';
/** Logs de traça que es poden rotar: els escriuen els hooks i ningú no els llig com a memòria. */
export const ROTABLES = Object.freeze(['antigravity-hook.log', 'fatiga-hook.log']);
export const LLINDAR_LOG = 1024 * 1024;
/** Logs rotats que es queden al costat del viu, per log: la resta va a quarantena (L1) i la L2 la purga. */
export const ROTATS_CONSERVATS = 3;
export const FINESTRA_TORN_MS = 2 * 60 * 60 * 1000;
export const DIES_QUARANTENA = 30;
const BLOQUEJOS = Object.freeze([`${RUNTIME}/document-create.lock`, `${RUNTIME}/mutation.lock`, `${RUNTIME}/mutation.pending.json`]);
const ZONES_PROHIBIDES = /(?:^|\/)(?:04_escriptori|01_produccio|02_investigacio_ia|90_arxiu_historic|\.iaia_auth|\.env[^/]*|\.git)(?:\/|$)/i;
/** Còpies i restes versionades que l'informe llista (mai les mou): .bak, .tmp, .orig, .rej, ~, .old i .abans-aammdd. */
const SOSPITOSOS = /(?:\.bak|\.tmp|\.orig|\.rej|~|\.old|\.abans-\d{6})$/i;
/** Reconeix la taxonomia de zips: canònica (data al davant) o històrica (data al final). */
export function parseZip(nom) {
  // Canònica: AAMMDD_HHMM_categoria_titol_vX.Y.Z.zip
  const mCanonic = /^(\d{6}_\d{4})_(wordpress_enxufe|wordpress_directori|estatic_spa)_v(\d+\.\d+\.\d+)\.zip$/.exec(nom);
  if (mCanonic) return { canonic: true, segell: mCanonic[1], producte: mCanonic[2], versio: mCanonic[3] };
  // Històrica: socdepoble-(enxufe|spa)-vX.Y.Z-AAMMDD_HHMM.zip
  const mHistoric = /^socdepoble-(enxufe|spa)-v(\d+\.\d+\.\d+)-(\d{6}_\d{4})\.zip$/.exec(nom);
  if (mHistoric) return { canonic: false, segell: mHistoric[3], producte: mHistoric[1], versio: mHistoric[2] };
  return null;
}
const US = 'Ús: cron_higiene.mjs [--aplica] | --l2 [--confirma CODI]';

const sha = (valor) => createHash('sha256').update(valor).digest('hex');
const p2 = (n) => String(n).padStart(2, '0');
const posix = (rel) => rel.split(path.sep).join('/');
/** `aammdd` en hora local, com els noms de fitxer. */
export const diaDe = (ara) => `${p2(ara.getFullYear() % 100)}${p2(ara.getMonth() + 1)}${p2(ara.getDate())}`;
const segellDe = (ara) => `${diaDe(ara)}_${p2(ara.getHours())}${p2(ara.getMinutes())}`;
const isoNet = (ara) => ara.toISOString().replace(/[:.]/g, '-');

/** Zona que el cron no toca mai, ni com a origen ni com a destí. */
export function intocable(rel) {
  return ZONES_PROHIBIDES.test(posix(String(rel)));
}

/** Tots els fitxers seguits per git, en camins posix, o null si git no respon: llavors no es mou res. */
export function versionats(arrel) {
  try {
    const out = execFileSync('git', ['-C', arrel, 'ls-files', '-z'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
    return new Set(out.split('\0').filter(Boolean));
  } catch { return null; }
}

/**
 * Per què el cron no ha de moure res ara, o null. Un lock d'escriptura documental o de
 * mutació, o un torn obert tocat fa menys de dues hores: algú treballa a la taula.
 */
export function motiuAbstencio(arrel, ara = Date.now()) {
  for (const rel of BLOQUEJOS) {
    if (fs.existsSync(path.join(arrel, rel))) return `${rel} present: hi ha una escriptura documental o una mutació en curs`;
  }
  const dir = path.join(arrel, RUNTIME, 'turns');
  let noms = [];
  try { noms = fs.readdirSync(dir).filter((n) => /^torn_[0-9a-f-]+\.json$/.test(n)); } catch { /* sense torns */ }
  for (const nom of noms) {
    const abs = path.join(dir, nom);
    let torn;
    let mtime;
    try { torn = JSON.parse(fs.readFileSync(abs, 'utf8')); mtime = fs.statSync(abs).mtimeMs; } catch { continue; }
    if (torn?.state === 'closed' || !(Date.parse(torn?.expiresAt) > ara)) continue;
    const tocat = Math.max(mtime, Date.parse(torn.updatedAt) || 0, Date.parse(torn.createdAt) || 0);
    if (ara - tocat < FINESTRA_TORN_MS) return `torn obert recent: ${nom.slice(0, 13)} (tocat fa ${Math.round((ara - tocat) / 60000)} min)`;
  }
  return null;
}

/* ── Retenció dels ZIP ────────────────────────────────────────────────────── */

function nomsZip(dir) {
  try { return fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isFile() && e.name.endsWith('.zip')).map((e) => e.name).sort(); }
  catch { return []; }
}

/** Camins de ZIP que cita un JSON (qualsevol text acabat en .zip que no siga una URL), relatius a builds/. */
function zipsCitats(valor, out = new Set()) {
  if (typeof valor === 'string') {
    if (/\.zip$/i.test(valor) && !/^[a-z][a-z0-9+.-]*:/i.test(valor)) out.add(path.posix.normalize(valor));
  } else if (Array.isArray(valor)) valor.forEach((v) => zipsCitats(v, out));
  else if (valor && typeof valor === 'object') Object.values(valor).forEach((v) => zipsCitats(v, out));
  return out;
}

/** Última Acta Marmota (per nom) i els ZIP que cita. */
function citatsActa(arrel) {
  let noms;
  try { noms = fs.readdirSync(path.join(arrel, ACTES)).filter((n) => /^\d{6}_\d{4}_acta.*\.md$/i.test(n)).sort(); }
  catch { return { acta: null, zips: new Set() }; }
  const acta = noms.at(-1) ?? null;
  if (!acta) return { acta: null, zips: new Set() };
  const text = fs.readFileSync(path.join(arrel, ACTES, acta), 'utf8');
  const trobats = text.match(/(?:socdepoble-(?:enxufe|spa)-v\d+\.\d+\.\d+-\d{6}_\d{4}|\d{6}_\d{4}_(?:wordpress_enxufe|wordpress_directori|estatic_spa)_v\d+\.\d+\.\d+)\.zip/g) ?? [];
  return { acta, zips: new Set(trobats) };
}

/**
 * Retenció de wordpress-plugin/builds/ i builds/directori/ (core-empaquetat-wp, §4). Es
 * conserven els ZIP que nomena stable.json, el més recent de cada producte i carpeta, els
 * que cita l'última acta i tot nom no canònic. Sense stable.json llegible es conserva tot.
 */
export function retencioZips(arrel) {
  const base = path.join(arrel, BUILDS);
  const avisos = [];
  const zips = [
    ...nomsZip(base).map((nom) => ({ rel: `${BUILDS}/${nom}`, carpeta: '', nom })),
    ...nomsZip(path.join(base, 'directori')).map((nom) => ({ rel: `${BUILDS}/directori/${nom}`, carpeta: 'directori', nom })),
  ];
  let estables = null;
  try { estables = new Set([...zipsCitats(JSON.parse(fs.readFileSync(path.join(base, 'stable.json'), 'utf8')))].map((c) => `${BUILDS}/${c}`)); }
  catch (error) { avisos.push(`stable.json il·legible o absent (${error.code ?? error.message}): no es proposa retirar cap ZIP`); }
  const acta = citatsActa(arrel);
  const darrers = new Map();
  let bytesTotal = 0;
  for (const z of zips) {
    let mida = 0;
    try { mida = fs.statSync(path.join(arrel, z.rel)).size; } catch { /* ha desaparegut mentre es mirava */ }
    bytesTotal += mida;
    const parsed = parseZip(z.nom);
    if (!parsed) {
      avisos.push(`[ANOMALIA DEDUCTIVA] Fitxer ZIP amb patró desconegut: ${z.rel} (${(mida / (1024 * 1024)).toFixed(2)} MB). Requereix revisió humana.`);
      continue;
    }
    const clau = `${z.carpeta}|${parsed.producte}`;
    const actual = darrers.get(clau);
    if (!actual || parseZip(actual.nom).segell < parsed.segell) darrers.set(clau, z);
  }
  if (bytesTotal > 25 * 1024 * 1024) {
    avisos.push(`[ALERTA DE PES] ${BUILDS} ocupa ${(bytesTotal / (1024 * 1024)).toFixed(1)} MB (llindar recomanat: 25 MB). Cal buidar a _builds_de_poble/.`);
  }
  const recents = new Set(darrers.values());
  const conserva = [];
  const retira = [];
  for (const z of zips) {
    const motius = [];
    const parsed = parseZip(z.nom);
    if (!parsed) motius.push('anomalia deductiva: nom no reconegut, es pregunta');
    if (!estables) motius.push('sense stable.json llegible');
    else if (estables.has(z.rel)) motius.push('estable (stable.json)');
    if (recents.has(z)) motius.push('el més recent del producte i la carpeta');
    if (acta.zips.has(z.nom)) motius.push(`citat a ${acta.acta}`);
    let mida = 0;
    try { mida = fs.statSync(path.join(arrel, z.rel)).size; } catch { /* ha desaparegut mentre es mirava */ }
    (motius.length ? conserva : retira).push({ rel: z.rel, mida, motius });
  }
  return { conserva, retira, acta: acta.acta, avisos };
}

/* ── Logs i receptes ──────────────────────────────────────────────────────── */

function logs(arrel) {
  const dir = path.join(arrel, RUNTIME);
  let noms = [];
  try { noms = fs.readdirSync(dir).filter((n) => n.endsWith('.log')).sort(); } catch { /* sense runtime */ }
  return noms.map((nom) => {
    let mida = 0;
    try { mida = fs.statSync(path.join(dir, nom)).size; } catch { /* rotat mentre es mirava */ }
    return { rel: `${RUNTIME}/${nom}`, mida, rotable: ROTABLES.includes(nom) && mida > LLINDAR_LOG };
  });
}

/**
 * Rotats d'un log de ROTABLES (NOM.aammdd_hhmm.log o NOM.aammdd_hhmm.N.log) que passen dels
 * `conserva` més nous: sense esta retenció, cada nit en deixaria un de nou per sempre.
 */
export function rotatsVells(arrel, conserva = ROTATS_CONSERVATS) {
  let noms = [];
  try { noms = fs.readdirSync(path.join(arrel, RUNTIME)); } catch { return []; }
  const out = [];
  for (const log of ROTABLES) {
    const base = log.slice(0, -'.log'.length);
    const rotats = noms
      .map((nom) => ({ nom, m: nom.startsWith(`${base}.`) ? /^\.(\d{6}_\d{4})(?:\.(\d+))?\.log$/.exec(nom.slice(base.length)) : null }))
      .filter((x) => x.m)
      .sort((a, b) => (a.m[1] === b.m[1] ? Number(a.m[2] ?? 0) - Number(b.m[2] ?? 0) : a.m[1] < b.m[1] ? -1 : 1));
    out.push(...rotats.slice(0, Math.max(0, rotats.length - conserva)).map((x) => `${RUNTIME}/${x.nom}`));
  }
  return out.sort();
}

/** Empremta d'una llista d'operacions de Plaquetes: el que fan, no quan s'han calculat. Igual que a plaquetes.mjs. */
export function empremtaOperacions(ops) {
  return sha(JSON.stringify((Array.isArray(ops) ? ops : []).map(({ tipus, fitxer, objectius, hashFont }) => ({ tipus, fitxer, objectius, hashFont }))));
}

/**
 * Receptes de Plaquetes. Per a cada empremta es queda la més nova; les altres, si no
 * tenen aprovació, són repetides. Una recepta il·legible no es toca mai.
 */
export function receptes(arrel, vers = null) {
  const dir = path.join(arrel, RECEPTES);
  let noms = [];
  try { noms = fs.readdirSync(dir).filter((n) => /^\d+_RECEPTA\.json$/.test(n)); } catch { /* sense receptes */ }
  noms.sort((a, b) => Number(a.split('_')[0]) - Number(b.split('_')[0]));
  let aprovades = new Set();
  try { aprovades = new Set(fs.readdirSync(path.join(arrel, APROVACIONS)).filter((n) => n.endsWith('.aprovat.json')).map((n) => n.slice(0, -'.aprovat.json'.length))); }
  catch { /* sense aprovacions */ }
  const llista = noms.map((nom) => {
    const rel = `${RECEPTES}/${nom}`;
    let empremta = null;
    try {
      const r = JSON.parse(fs.readFileSync(path.join(dir, nom), 'utf8'));
      empremta = typeof r.empremta === 'string' ? r.empremta : empremtaOperacions(r.operacions);
    } catch { /* il·legible: no es toca */ }
    return { nom, rel, empremta, versionada: vers ? vers.has(rel) : null, aprovada: aprovades.has(nom.slice(0, -'.json'.length)) };
  });
  const darrera = new Map();
  for (const r of llista) if (r.empremta) darrera.set(r.empremta, r.nom);
  const repetides = llista.filter((r) => r.empremta && darrera.get(r.empremta) !== r.nom && !r.aprovada);
  return { total: llista.length, versionades: vers ? llista.filter((r) => r.versionada).length : null, empremtes: darrera.size, repetides };
}

/* ── L0 · informe ─────────────────────────────────────────────────────────── */

function comptaDsStore(arrel) {
  let n = 0;
  const mira = (dir) => { try { if (fs.lstatSync(path.join(dir, '.DS_Store')).isFile()) n += 1; } catch { /* cap */ } };
  mira(arrel);
  let entrades = [];
  try { entrades = fs.readdirSync(arrel, { withFileTypes: true }); } catch { /* arrel il·legible */ }
  for (const e of entrades) if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules') mira(path.join(arrel, e.name));
  return n;
}

/** Diagnosi sense cap efecte: el cos de l'informe L0. */
export function diagnosi(arrel, { vers = null } = {}) {
  let brossa;
  try { brossa = candidats(arrel, { exigixGit: false }).filter((n) => !vers || !vers.has(n)); }
  catch (error) { brossa = { error: error.message }; }
  const zips = retencioZips(arrel);
  const r = receptes(arrel, vers);
  const taula = olivera.checkTaula(arrel);
  const conv = typeof olivera.checkConvocatoria === 'function' ? olivera.checkConvocatoria(arrel) : null;
  return {
    arrel: {
      brossa,
      sospitososVersionats: vers ? [...vers].filter((f) => SOSPITOSOS.test(f)).sort() : null,
      dsStore: comptaDsStore(arrel),
    },
    zips: {
      conserva: zips.conserva,
      retira: zips.retira,
      bytesRetirables: zips.retira.reduce((s, z) => s + z.mida, 0),
      acta: zips.acta,
      avisos: zips.avisos,
    },
    logs: logs(arrel),
    rotatsVells: rotatsVells(arrel),
    receptes: {
      total: r.total,
      versionades: r.versionades,
      empremtes: r.empremtes,
      repetides: r.repetides.length,
      repetidesNoVersionades: r.repetides.filter((x) => x.versionada === false).length,
    },
    olivera: {
      valid: taula.valid,
      errors: taula.errors,
      ...(conv && {
        fase: conv.fase,
        troballes: conv.troballes.map((t) => `[${t.codi}] ${t.missatge}`),
        vida: conv.vida.map((v) => ({ nom: v.nom, valid: v.valid, motiu: v.motiu })),
        sediment: conv.sediment,
      }),
    },
  };
}

/* ── L1 · reversible ──────────────────────────────────────────────────────── */

/** Trasllat a una quarantena del circuit, amb MANIFEST.json. Cap origen intocable ni versionat. */
function aQuarantena(arrel, rels, { ara, sufix, vers }) {
  const valids = rels.filter((rel) => !intocable(rel) && !vers.has(rel));
  if (!valids.length) return { quarantena: null, moguts: [] };
  const quarantena = path.join(arrel, PAPERERA, `quarantena-${isoNet(ara)}${sufix}`);
  fs.mkdirSync(quarantena, { recursive: true });
  const moguts = [];
  try {
    for (const rel of valids) {
      const carpeta = path.join(quarantena, path.posix.dirname(rel));
      fs.mkdirSync(carpeta, { recursive: true });
      let desti = path.join(carpeta, path.posix.basename(rel));
      for (let i = 1; fs.existsSync(desti); i += 1) desti = path.join(carpeta, `${path.posix.basename(rel)}.${i}`);
      fs.renameSync(path.join(arrel, rel), desti);
      moguts.push({ origen: rel, desti: posix(path.relative(arrel, desti)) });
    }
  } finally {
    // També si un trasllat falla a mitges: el manifest diu què s'ha mogut fins ací.
    fs.writeFileSync(path.join(quarantena, 'MANIFEST.json'), `${JSON.stringify({ data: ara.toISOString(), eina: 'tooling/higiene/cron_higiene.mjs', moguts }, null, 2)}\n`, { flag: 'wx' });
  }
  return { quarantena: posix(path.relative(arrel, quarantena)), moguts };
}

function nivell1(arrel, { ara, vers }) {
  // a) Brossa de l'arrel: l'eina de sempre (llista negra, mai punt, mai versionat, mai directoris).
  const n = neteja(arrel, { aplica: true, exigixGit: true, ara });
  const arrelFet = { paperera: n.paperera ? posix(path.relative(arrel, n.paperera)) : null, moguts: n.moguts };
  // b) Logs de traça que passen del llindar: es reanomenen al mateix directori.
  const logsFets = [];
  const dir = path.join(arrel, RUNTIME);
  for (const l of logs(arrel).filter((x) => x.rotable && !vers.has(x.rel))) {
    const base = path.posix.basename(l.rel, '.log');
    let desti = path.join(dir, `${base}.${segellDe(ara)}.log`);
    for (let i = 1; fs.existsSync(desti); i += 1) desti = path.join(dir, `${base}.${segellDe(ara)}.${i}.log`);
    fs.renameSync(path.join(arrel, l.rel), desti);
    logsFets.push({ origen: l.rel, desti: posix(path.relative(arrel, desti)), mida: l.mida });
  }
  // c) Retenció dels rotats: els més vells van a quarantena amb MANIFEST (la L2 els purga als 30 dies).
  const logsVells = aQuarantena(arrel, rotatsVells(arrel), { ara, sufix: '-logs', vers });
  // d) Receptes de Plaquetes repetides i no versionades.
  const r = receptes(arrel, vers);
  const receptesFet = aQuarantena(arrel, r.repetides.filter((x) => x.versionada === false).map((x) => x.rel), { ara, sufix: '-receptes', vers });
  return { arrel: arrelFet, logs: logsFets, logsVells, receptes: receptesFet };
}

/* ── Informe i L0 + L1 ────────────────────────────────────────────────────── */

function escriuInforme(arrel, informe, ara) {
  const dir = path.join(arrel, INFORMES);
  fs.mkdirSync(dir, { recursive: true });
  const desti = path.join(dir, `${diaDe(ara)}.json`);
  const temporal = `${desti}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(temporal, `${JSON.stringify(informe, null, 2)}\n`);
    fs.renameSync(temporal, desti);
  } finally {
    if (fs.existsSync(temporal)) fs.unlinkSync(temporal);
  }
}

/**
 * L0 sempre i, amb `aplica`, L1. `vers` és l'inventari de git (per a proves); sense,
 * es demana a git, i si git no respon L1 no es fa.
 */
export function higiene(arrel, { aplica = false, ara = new Date(), vers } = {}) {
  const v = vers === undefined ? versionats(arrel) : vers;
  const abstencio = motiuAbstencio(arrel, ara.getTime());
  const fitxer = `${INFORMES}/${diaDe(ara)}.json`;
  const informe = { schema: 'sdp.higiene.v1', data: ara.toISOString(), fitxer, nivell: aplica ? 'L1' : 'L0', abstencio, git: v !== null, l0: diagnosi(arrel, { vers: v }), l1: null };
  if (aplica) {
    if (abstencio) informe.l1 = { fet: false, motiu: `abstenció: ${abstencio}` };
    else if (v === null) informe.l1 = { fet: false, motiu: 'git no respon: sense inventari de versionats no es mou res' };
    else informe.l1 = { fet: true, ...nivell1(arrel, { ara, vers: v }) };
  }
  escriuInforme(arrel, informe, ara);
  return informe;
}

/* ── L2 · porta humana ────────────────────────────────────────────────────── */

/** Paperera dels ZIP retirats: germana del repositori, fora de git i de cap còpia del Mas. El cron no la purga mai. */
export function papereraBuilds(arrel) {
  return path.join(path.dirname(arrel), '.sdp-paperera-builds');
}

/**
 * Quarantenes .sdp-paperera/quarantena-* del circuit (amb MANIFEST.json) de més de `dies`
 * dies i sense cap fitxer versionat. La paperera dels ZIP (../.sdp-paperera-builds) no hi
 * entra: els ZIP només es traslladen.
 */
function quarantenesVelles(arrel, { ara, dies, vers }) {
  const llindar = ara.getTime() - dies * 86400000;
  const out = [];
  const dir = path.join(arrel, PAPERERA);
  let entrades = [];
  try { entrades = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entrades) {
    if (!e.isDirectory() || e.isSymbolicLink() || !e.name.startsWith('quarantena-')) continue;
    let mtime;
    // Sense MANIFEST.json no és una quarantena d'este circuit: no es toca.
    try { mtime = fs.statSync(path.join(dir, e.name, 'MANIFEST.json')).mtimeMs; } catch { continue; }
    if (mtime > llindar) continue;
    const rel = `${PAPERERA}/${e.name}`;
    if (vers && [...vers].some((f) => f.startsWith(`${rel}/`))) continue;
    out.push({ tipus: 'quarantena', rel });
  }
  return out;
}

/**
 * Proposta L2: els ZIP fora de la retenció i les quarantenes velles. El codi són els 12
 * primers caràcters del sha256 de la llista: si la llista canvia, el codi també.
 */
export function propostaL2(arrel, { ara = new Date(), dies = DIES_QUARANTENA, vers } = {}) {
  const v = vers === undefined ? versionats(arrel) : vers;
  const zips = retencioZips(arrel);
  const items = [
    ...zips.retira.filter((z) => !intocable(z.rel) && !(v && v.has(z.rel))).map((z) => ({ tipus: 'zip', rel: z.rel, mida: z.mida })),
    ...quarantenesVelles(arrel, { ara, dies, vers: v }),
  ];
  const hash = sha(JSON.stringify(items));
  return { items, hash, codi: hash.slice(0, 12), conserva: zips.conserva, avisos: zips.avisos, git: v !== null };
}

function mouSenseTrepitjar(origen, desti) {
  fs.mkdirSync(path.dirname(desti), { recursive: true });
  if (fs.existsSync(desti)) throw new Error(`${desti} ja existix; no es trepitja`);
  try { fs.renameSync(origen, desti); }
  catch (error) {
    if (error.code !== 'EXDEV') throw error;
    fs.copyFileSync(origen, desti, fs.constants.COPYFILE_EXCL);
    if (fs.statSync(desti).size !== fs.statSync(origen).size) throw new Error(`còpia incompleta de ${origen}`);
    fs.unlinkSync(origen);
  }
}

/**
 * Aplica la proposta L2 si `confirma` és el seu codi. Els ZIP es traslladen a la paperera
 * germana i el cron no els esborra mai; les quarantenes velles de .sdp-paperera/ es purguen,
 * que és l'única baixa definitiva del cron i per això només la fa una confirmació humana.
 */
export function aplicaL2(arrel, { confirma, ara = new Date(), dies = DIES_QUARANTENA, vers, paperera = papereraBuilds(arrel) } = {}) {
  const abstencio = motiuAbstencio(arrel, ara.getTime());
  if (abstencio) throw new Error(`L2 en abstenció: ${abstencio}`);
  const v = vers === undefined ? versionats(arrel) : vers;
  if (v === null) throw new Error('git no respon: sense inventari de versionats no es mou res');
  const p = propostaL2(arrel, { ara, dies, vers: v });
  if (!p.items.length) return { ...p, fets: [], manifest: null };
  if (confirma !== p.codi) throw new Error(`Confirmació incorrecta: la proposta L2 vigent té el codi ${p.codi}. Revisa-la amb --l2 i confirma-la amb eixe codi.`);
  const retencio = path.join(paperera, `retencio-${isoNet(ara)}`);
  const fets = [];
  const zips = p.items.filter((i) => i.tipus === 'zip');
  try {
    for (const z of zips) {
      const origen = path.join(arrel, z.rel);
      const empremta = sha(fs.readFileSync(origen));
      const desti = path.join(retencio, path.posix.relative(BUILDS, z.rel));
      mouSenseTrepitjar(origen, desti);
      fets.push({ tipus: 'zip', origen: z.rel, desti: posix(path.relative(arrel, desti)), mida: z.mida, sha256: empremta });
    }
  } finally {
    if (zips.length) {
      fs.mkdirSync(retencio, { recursive: true });
      fs.writeFileSync(path.join(retencio, 'MANIFEST.json'), `${JSON.stringify({ data: ara.toISOString(), eina: 'tooling/higiene/cron_higiene.mjs --l2', codi: p.codi, moguts: fets }, null, 2)}\n`, { flag: 'wx' });
    }
  }
  for (const q of p.items.filter((i) => i.tipus === 'quarantena')) {
    const abs = path.resolve(arrel, q.rel);
    fs.rmSync(abs, { recursive: true, force: false });
    fets.push({ tipus: 'quarantena', purgada: q.rel });
  }
  return { ...p, fets, manifest: zips.length ? posix(path.relative(arrel, path.join(retencio, 'MANIFEST.json'))) : null };
}

/* ── CLI ──────────────────────────────────────────────────────────────────── */

function opcions(argv) {
  const o = { aplica: false, l2: false, confirma: null };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--aplica') o.aplica = true;
    else if (a === '--l2') o.l2 = true;
    else if (a === '--confirma') { o.confirma = argv[i + 1] ?? null; i += 1; }
    else if (a.startsWith('--confirma=')) o.confirma = a.slice('--confirma='.length);
    else throw new Error(`Argument desconegut: ${a}. ${US}`);
  }
  if (o.l2 && o.aplica) throw new Error(`Tria --aplica (L1) o --l2. ${US}`);
  if (o.confirma !== null && !o.l2) throw new Error(`--confirma només val amb --l2. ${US}`);
  if (o.l2 && o.confirma !== null && !/^[0-9a-f]{12}$/.test(o.confirma)) throw new Error(`--confirma necessita el codi de 12 caràcters que imprimix --l2. ${US}`);
  return o;
}

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

function main(argv = process.argv.slice(2)) {
  const o = opcions(argv);
  const arrel = arrelSegura();
  if (o.l2) {
    if (o.confirma === null) {
      const p = propostaL2(arrel);
      if (!p.items.length) { console.log('[higiene · L2] Res a proposar.'); return 0; }
      for (const i of p.items) console.log(`   · ${i.tipus === 'zip' ? `ZIP ${i.rel} (${mb(i.mida)}) → ${posix(path.relative(arrel, papereraBuilds(arrel)))}/` : `purga ${i.rel}`}`);
      for (const c of p.conserva) console.log(`   = ${c.rel}: ${c.motius.join('; ')}`);
      for (const a of p.avisos) console.log(`   avís: ${a}`);
      console.log(`[higiene · L2] Codi de la proposta: ${p.codi}. Per a aplicar-la, des d'un terminal: node tooling/higiene/cron_higiene.mjs --l2 --confirma ${p.codi}`);
      return 0;
    }
    if (!process.stdin.isTTY) throw new Error('La L2 només s’aplica des d’un terminal humà.');
    const r = aplicaL2(arrel, { confirma: o.confirma });
    for (const f of r.fets) console.log(`   · ${f.tipus === 'zip' ? `${f.origen} → ${f.desti}` : `purgada ${f.purgada}`}`);
    console.log(`[higiene · L2] Fet. ${r.manifest ? `Manifest: ${r.manifest}` : ''}`);
    return 0;
  }
  const r = higiene(arrel, { aplica: o.aplica });
  const d = r.l0;
  console.log(`[higiene] ${r.data} · ${r.nivell} · informe ${r.fitxer}${r.abstencio ? ` · abstenció: ${r.abstencio}` : ''}`);
  console.log(`   Arrel: ${Array.isArray(d.arrel.brossa) ? d.arrel.brossa.length : 'error'} fitxer(s) de brossa; ${d.arrel.sospitososVersionats?.length ?? '?'} sospitós(os) versionat(s).`);
  console.log(`   ZIP: ${d.zips.retira.length} fora de la retenció (${mb(d.zips.bytesRetirables)}); ${d.zips.conserva.length} es conserven.`);
  if (d.zips.avisos?.length) {
    for (const a of d.zips.avisos) console.log(`   avís ZIP: ${a}`);
  }
  console.log(`   Receptes: ${d.receptes.total} (${d.receptes.empremtes} empremtes, ${d.receptes.repetides} repetides).`);
  console.log(`   Porta Olivera: ${d.olivera.valid ? 'verda' : 'roja'}${d.olivera.fase ? ` · convocatòria en fase «${d.olivera.fase}» amb ${d.olivera.troballes.length} troballa(es)` : ''}.`);
  if (r.l1) console.log(`   L1: ${r.l1.fet ? `${r.l1.arrel.moguts.length} de l'arrel, ${r.l1.logs.length} log(s) rotat(s), ${r.l1.logsVells.moguts.length} rotat(s) vell(s) i ${r.l1.receptes.moguts.length} recepta(es) a quarantena` : r.l1.motiu}.`);
  return 0;
}

if (esMain(import.meta.url)) {
  try { process.exitCode = main(); }
  catch (error) { console.error(`[higiene] ${error.message}`); process.exitCode = 1; }
}
