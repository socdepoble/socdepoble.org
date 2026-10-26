#!/usr/bin/env node
/**
 * mapa-consola.mjs — closca de node del Mapa de la Consola (sdp.mapa.v1).
 *
 * DESTÍ: tooling/brain/mapa-consola.mjs (els imports relatius són els del destí).
 *
 * CANVIS D'ESTA VERSIÓ (260930_0040, T10 i T12 del pla
 * 260930_0040_pla_implementacio_consola):
 *   1. Codex (T10): `hooksCodex` llig `.codex/hooks.json` amb el mateix helper
 *      que `.agents/hooks.json` (font obligatòria: si falta, avís alt);
 *      `agentsMd` diu si hi ha `AGENTS.md` a l'arrel, que Codex llig per
 *      convenció del client com Claude Code llig CLAUDE.md; i
 *      `contextArrencada` passa les SOURCES que injecta el SessionStart de
 *      `context-local.mjs`, perquè el compilador en derive la càrrega
 *      d'arrencada sense copiar la llista a mà. Importar-lo no escriu res:
 *      afig el descobriment d'arrel de documental/cli.mjs (`ROOT`), que llança
 *      en carregar si no troba `.agents/AGENTS.md` o si SDP_ARREL/--arrel són
 *      invàlids, i la guarda CLI, que fa realpath de process.argv[1]. La
 *      cadena de vite ja fallava igual per tooling/wiki/lib/project_paths.mjs
 *      (`PROJECT_DIR`), i tooling/gates/hooks-local.mjs l'importa igual.
 *   2. Vigilància (T12): `torns`, `escriptori`, `ledger` i `estat`, resums de
 *      només lectura de ./fonts-vigilancia.mjs (null si la font no hi és).
 *
 * VERSIÓ ANTERIOR (260926_1200, infraestructura de fons):
 *   1. `hooksGit`: llig `.husky/<esdeveniment>` i `git config core.hooksPath`
 *      perquè el compilador pur puga jutjar les tasques `git-hook` (viu si el
 *      hook cita l'script, mort si no, desconegut si no s'ha pogut llegir).
 *   2. Error de registre: es mira la cua del fitxer d'errors (30 línies), no
 *      només l'última, i només compta si l'ha escrit l'última execució (el
 *      registre d'errors és tan recent com el d'eixida). Abans, un plist en
 *      bucle de KeepAlive acabava amb «Node.js v24…» i passava per viu; i un
 *      error de fa dies a `.immunitari/cron.err` hauria matat Plaquetes.
 *   3. `mencionsDeSkills` ignora la secció «## Historial» d'una skill: les
 *      skills absorbides o fusionades que s'hi citen no són crides.
 *
 * Llig les fonts declarades del Mas, les passa al compilador pur
 * src/sections/consola/mapa/construeixMapa.js i torna el JSON. És de només
 * lectura: no escriu cap fitxer ni llig `.sdp-reflex/`. Només executa `git`
 * (lectura) i, si existixen, la frontissa de contingut en mode --json i les
 * dues portes de només lectura que mesuren `conformitat-documental` i
 * `cadena-portes` (porta-documents.mjs i run-portes.mjs --diagnostic).
 * Matís 261026: el `git status` d'ací i el `git diff HEAD` de
 * porta-documents.mjs poden reescriure la memòria cau d'estat de
 * `.git/index` (mai el contingut) quan un fitxer seguit té la data de disc
 * envellida. En el cas de `git diff`, git ho fa encara que
 * GIT_OPTIONAL_LOCKS=0.
 *
 * El middleware només-dev de la Consola (tooling/vite/consola-iaia.mjs) el
 * servix a GET /__iaia/mapa.json. El Mapa descriu la maquinària interna: no
 * entra al paquet públic ni al de WordPress (04_contracte_de_dades.md).
 *
 * Ús:
 *   node tooling/brain/mapa-consola.mjs --json    # el mapa sencer
 *   node tooling/brain/mapa-consola.mjs           # resum per a humans
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { arrelSegura, esMain } from '../lib/arrel.mjs';
import { parseDocument, validateSchema } from '../documental/core.mjs';
import { construeixMapa } from '../../src/sections/consola/mapa/construeixMapa.js';
import { SOURCES as FONTS_CONTEXT_LOCAL } from './context-local.mjs';
import { resumTorns, resumEscriptori, resumLedger, resumEstat } from './fonts-vigilancia.mjs';
import { seleccionaPassos } from '../gates/run-portes.mjs';

const llig = (abs) => { try { return fs.readFileSync(abs, 'utf8'); } catch { return null; } };
const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');

/** Script de SessionStart que injecta fonts senceres (el disparen Claude Code i Codex). */
const SCRIPT_CONTEXT_LOCAL = 'tooling/brain/context-local.mjs';

/** Mencions de skills dins de la prosa: sempre inferides, mai declarades. */
/** Un esquema d'URI (`sdp-media://bucket/camí`) no és cap skill: el `://` la talla. */
const MENCIO_SKILL = /(?<![\w./-])((?:core|sdp|wiki)-[a-z0-9]+(?:-[a-z0-9]+)*)(?![\w-]|\.[a-z]|:\/\/)/g;
const LLICONS = /^##\s+Lliçons del Mestre\s*$/m;
const HISTORIAL = /^##\s+Historial\s*$/m;
const ERROR_DE_LOG = /(?:Error:|MODULE_NOT_FOUND|npm ERR!|Traceback)/;
/** Línies finals del registre d'errors on es busca la traça de l'última caiguda. */
const CUA_ERRORS = 30;
/** Hooks de git que Husky pot instal·lar a `.husky/`. */
export const ESDEVENIMENTS_GIT = Object.freeze(['pre-commit', 'commit-msg', 'post-commit', 'pre-push']);

function git(arrel, args) {
  try {
    return execFileSync('git', ['-C', arrel, ...args], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 10000
    }).trim();
  } catch { return null; }
}

/** Text d'una secció H2 (fins al següent H2), o null si no hi és. */
function seccio(cos, capcalera) {
  const m = capcalera.exec(cos);
  if (!m) return null;
  const resta = cos.slice(m.index + m[0].length);
  const fi = resta.search(/^##\s/m);
  return { inici: m.index, text: fi === -1 ? resta : resta.slice(0, fi), fi: fi === -1 ? cos.length : m.index + m[0].length + fi };
}

/** Entrades de la secció «Lliçons del Mestre» (línies que comencen per «- »). */
export function compteLlicons(cos) {
  const s = seccio(cos, LLICONS);
  return s ? s.text.split('\n').filter((l) => /^\s*-\s+\S/.test(l)).length : 0;
}

/**
 * Mencions de skills a la prosa, fora de «## Historial»: una skill absorbida
 * o fusionada que s'hi cita és història, no una crida.
 */
export function mencionsDeSkills(cos) {
  const h = seccio(cos, HISTORIAL);
  const viu = h ? cos.slice(0, h.inici) + cos.slice(h.fi) : cos;
  return [...new Set([...viu.matchAll(MENCIO_SKILL)].map((m) => m[1]))].sort();
}

/**
 * Període d'un StartCalendarInterval (261009, cron d'higiene a les 05:30): mana la clau
 * més gran que fixa el dict (Month, un any; Day, un mes; Weekday, una setmana; Hour, un
 * dia; Minute, una hora; cap, un minut). Amb una llista de dicts, el més curt. Sense la
 * clau, null: el llançador continua sense interval, com abans.
 */
function intervalCalendari(xml) {
  const m = /<key>StartCalendarInterval<\/key>\s*(<dict>[\s\S]*?<\/dict>|<array>[\s\S]*?<\/array>)/.exec(xml);
  if (!m) return null;
  const dicts = [...m[1].matchAll(/<dict>([\s\S]*?)<\/dict>/g)].map((d) => d[1]);
  const periode = (dict) => {
    const te = (clau) => new RegExp(`<key>${clau}</key>\\s*<integer>\\d+</integer>`).test(dict);
    if (te('Month')) return 365 * 86400;
    if (te('Day')) return 31 * 86400;
    if (te('Weekday')) return 7 * 86400;
    if (te('Hour')) return 86400;
    return te('Minute') ? 3600 : 60;
  };
  return dicts.length ? Math.min(...dicts.map(periode)) : null;
}

/** Lectura mínima d'un plist d'Apple: només les claus que usa el calendari. */
export function llegeixPlist(xml) {
  const cadena = (clau) => new RegExp(`<key>${clau}</key>\\s*<string>([^<]*)</string>`).exec(xml)?.[1] ?? null;
  const cert = (clau) => new RegExp(`<key>${clau}</key>\\s*<true\\s*/>`).test(xml);
  const enter = (clau) => {
    const v = new RegExp(`<key>${clau}</key>\\s*<integer>(\\d+)</integer>`).exec(xml)?.[1];
    return v === undefined ? null : Number(v);
  };
  const args = /<key>ProgramArguments<\/key>\s*<array>([\s\S]*?)<\/array>/.exec(xml)?.[1] ?? '';
  return {
    etiqueta: cadena('Label'),
    programa: [...args.matchAll(/<string>([^<]*)<\/string>/g)].map((m) => m[1]),
    interval: enter('StartInterval') ?? intervalCalendari(xml),
    keepAlive: cert('KeepAlive'),
    enArrencar: cert('RunAtLoad'),
    directori: cadena('WorkingDirectory'),
    eixida: cadena('StandardOutPath'),
    errors: cadena('StandardErrorPath')
  };
}

/**
 * L'última execució ha deixat una traça d'error? Es mira la cua del registre
 * d'errors, i només compta si eixe registre és tan recent com el d'eixida:
 * un error antic a `cron.err` amb `cron.out` fresc és història, no estat.
 */
export function errorRecent({ errors, eixida }) {
  if (!errors) return false;
  const mtime = (abs) => { try { return fs.statSync(abs).mtimeMs; } catch { return null; } };
  const errM = mtime(errors);
  if (errM === null) return false;
  const outM = eixida && eixida !== errors ? mtime(eixida) : null;
  if (outM !== null && errM < outM) return false;
  const cua = (llig(errors) ?? '').trimEnd().split('\n').slice(-CUA_ERRORS).join('\n');
  return ERROR_DE_LOG.test(cua);
}

function llancadors(arrel, home, plataforma) {
  if (plataforma !== 'darwin') return [];
  const dir = path.join(home, 'Library', 'LaunchAgents');
  let noms;
  try { noms = fs.readdirSync(dir).filter((n) => n.endsWith('.plist')).sort(); } catch { return []; }
  const privat = (abs) => (abs.startsWith(home) ? `~${abs.slice(home.length)}` : abs);
  const resultat = [];
  for (const nom of noms) {
    const xml = llig(path.join(dir, nom));
    if (!xml || !(xml.includes(arrel) || /socdepoble/i.test(xml))) continue;
    const p = llegeixPlist(xml);
    if (!p.etiqueta) continue;
    const base = p.directori || arrel;
    const script = p.programa.find((a) => /\.(?:mjs|cjs|js|sh|py)$/.test(a)) ?? null;
    const absScript = script ? path.resolve(base, script) : null;
    const dinsRepo = absScript && (absScript === arrel || absScript.startsWith(`${arrel}${path.sep}`));
    const eixida = p.eixida ? path.resolve(base, p.eixida) : null;
    const errors = p.errors ? path.resolve(base, p.errors) : null;
    let activitat = null;
    for (const l of [eixida, errors].filter(Boolean)) {
      try {
        const t = fs.statSync(l).mtime.toISOString();
        if (!activitat || t > activitat) activitat = t;
      } catch { /* sense registre: activitat desconeguda */ }
    }
    resultat.push({
      etiqueta: p.etiqueta,
      fitxer: privat(path.join(dir, nom)),
      script: absScript ? (dinsRepo ? path.relative(arrel, absScript).split(path.sep).join('/') : privat(absScript)) : null,
      scriptAbsolut: absScript,
      interval: p.interval,
      keepAlive: p.keepAlive,
      enArrencar: p.enArrencar,
      activitat,
      ultimaLiniaError: errorRecent({ errors, eixida })
    });
  }
  return resultat;
}

/**
 * Hooks de git instal·lats. Husky els guarda a `.husky/<esdeveniment>` i git
 * només els executa si `core.hooksPath` apunta a `.husky/_` (o `.husky`). Un
 * hook present però sense eixa configuració es passa buit: git no el veu.
 * Torna null fora de git (cap font: les tasques queden desconegudes).
 */
export function hooksGit(arrel, { absents = null } = {}) {
  const hooksPath = git(arrel, ['config', '--get', 'core.hooksPath']);
  if (hooksPath === null && !fs.existsSync(path.join(arrel, '.git'))) return null;
  const actius = typeof hooksPath === 'string' && /^\.husky(?:\/_)?\/?$/.test(hooksPath);
  if (!actius && absents) absents.push({ ruta: '.husky/_', motiu: `core.hooksPath ${hooksPath ? `és «${hooksPath}»` : 'no està definit'}: git no executa els hooks de .husky/` });
  const resultat = {};
  for (const ev of ESDEVENIMENTS_GIT) {
    const text = llig(path.join(arrel, '.husky', ev));
    if (text === null) continue;
    resultat[ev] = actius ? text : '';
  }
  return resultat;
}

function frontissa(arrel) {
  const script = path.join(arrel, 'tooling/gates/frontissa-contingut.mjs');
  if (!fs.existsSync(script)) return null;
  let text;
  try {
    text = execFileSync(process.execPath, [script, '--json'], { cwd: arrel, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 20000 });
  } catch (error) {
    text = typeof error.stdout === 'string' ? error.stdout : null;   // exit 1 = frontissa roja, però el JSON hi és
  }
  try { return text ? JSON.parse(text) : null; } catch { return null; }
}

/**
 * Correcció 261026 (Consola: `conformitat-documental` i `cadena-portes` en
 * N/A) · El compilador ja les sabia mesurar (construeixMapa.js, Onada 6),
 * però esta closca no li passava mai `fonts.portaDocuments` ni
 * `fonts.cadenaPortes`. Ara executa les dues portes de només lectura com la
 * frontissa: en un procés fill, amb temps límit, i només llig el JSON de
 * l'eixida estàndard (exit 1 = porta roja, però el JSON hi és). Sense script,
 * sense JSON o amb el temps esgotat, null: la mètrica continua N/A, mai verd.
 * `ultimaLinia`: run-portes.mjs pinta el registre de cada pas i acaba amb una
 * línia JSON.
 */
export function eixidaDePorta(arrel, rel, args = [], { ultimaLinia = false, timeout = 20000 } = {}) {
  const script = path.join(arrel, rel);
  if (!fs.existsSync(script)) return null;
  const child = spawnSync(process.execPath, [script, ...args], {
    cwd: arrel, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout, maxBuffer: 20 * 1024 * 1024
  });
  // Partial stdout is not evidence after a timeout, signal, spawn or buffer error.
  if (child.error || child.signal || ![0, 1].includes(child.status) || !child.stdout) return null;
  const json = ultimaLinia ? child.stdout.trimEnd().split('\n').at(-1) : child.stdout;
  try {
    const r = JSON.parse(json);
    if (!r || typeof r !== 'object' || Array.isArray(r) || typeof r.valid !== 'boolean') return null;
    return r.valid === (child.status === 0) ? r : null;
  } catch { return null; }
}

/** A complete and coherent document-gate result; malformed DTOs stay N/A. */
function portaDocuments(arrel) {
  const r = eixidaDePorta(arrel, 'tooling/gates/porta-documents.mjs');
  if (!r || !Number.isInteger(r.checked) || r.checked < 0 || !Array.isArray(r.errors)
      || !r.errors.every(e => typeof e === 'string') || r.valid !== (r.errors.length === 0)) return null;
  return r;
}

/** Only the read-only diagnostic steps are counted; recursive diagnostics stay N/A. */
function cadenaPortes(arrel) {
  const r = eixidaDePorta(arrel, 'tooling/gates/run-portes.mjs', ['--diagnostic'], { ultimaLinia: true });
  const total = seleccionaPassos({ diagnostic: true }).length;
  if (!r || r.diagnostic !== true || !Number.isInteger(r.failures) || r.failures < 0 || r.failures > total
      || r.valid !== (r.failures === 0)) return null;
  return { ...r, total };
}

/**
 * Càrrega d'arrencada de `context-local.mjs`: les fonts ixen del codi
 * (SOURCES), no d'una llista copiada. Null si l'script no és a l'arrel que es
 * llig: el que no hi és no carrega res.
 */
function contextArrencada(arrel) {
  if (!fs.existsSync(path.join(arrel, SCRIPT_CONTEXT_LOCAL))) return null;
  return { script: SCRIPT_CONTEXT_LOCAL, fonts: [...FONTS_CONTEXT_LOCAL] };
}

/**
 * Llig totes les fonts. Cap excepció: el que falta va a `absents` i el
 * compilador ho pinta com a avís i N/A.
 */
export function recullFonts(arrel, { home = os.homedir(), plataforma = process.platform, ara = Date.now() } = {}) {
  const absents = [];
  const json = (rel, { opcional = false } = {}) => {
    const text = llig(path.join(arrel, rel));
    if (text === null) {
      if (!opcional) absents.push({ ruta: rel, motiu: 'absent' });
      return null;
    }
    try { return JSON.parse(text); } catch (e) {
      absents.push({ ruta: rel, motiu: `JSON il·legible: ${e.message}` });
      return null;
    }
  };
  const esFitxer = (rel) => { try { return fs.statSync(path.join(arrel, rel)).isFile(); } catch { return false; } };

  const schema = json('tooling/wiki/schema.json');
  const claude = llig(path.join(arrel, 'CLAUDE.md'));
  if (claude === null) absents.push({ ruta: 'CLAUDE.md', motiu: 'absent' });

  const dirSkills = path.join(arrel, '.agents/skills');
  let skillsDisc = null;
  try {
    skillsDisc = fs.readdirSync(dirSkills, { withFileTypes: true })
      .filter((e) => e.isDirectory() && fs.existsSync(path.join(dirSkills, e.name, 'SKILL.md')))
      .map((e) => e.name).sort()
      .map((nom) => {
        const cru = fs.readFileSync(path.join(dirSkills, nom, 'SKILL.md'), 'utf8');
        let frontmatter = null, cos = cru, errorsFrontmatter = [];
        try {
          const doc = parseDocument(cru);
          frontmatter = doc.data;
          cos = doc.body;
          errorsFrontmatter = schema ? validateSchema(doc.data, schema) : [];
        } catch (e) { errorsFrontmatter = [e.message]; }
        return {
          nom, frontmatter, errorsFrontmatter,
          paraules: cos.split(/\s+/).filter(Boolean).length,
          llicons: compteLlicons(cos),
          sha256: sha256(cru),
          mencions: mencionsDeSkills(cos).filter((m) => m !== nom)
        };
      });
  } catch { absents.push({ ruta: '.agents/skills', motiu: 'directori il·legible' }); }

  let skillsClaude = null;
  try { skillsClaude = fs.readdirSync(path.join(arrel, '.claude/skills')).filter((n) => !n.startsWith('.')).sort(); }
  catch { absents.push({ ruta: '.claude/skills', motiu: 'absent' }); }

  const branca = git(arrel, ['rev-parse', '--abbrev-ref', 'HEAD']);
  const commit = git(arrel, ['rev-parse', '--short', 'HEAD']);
  const estat = git(arrel, ['status', '--porcelain']);
  const ultimaInstantania = git(arrel, ['for-each-ref', '--sort=-committerdate', '--count=1', '--format=%(committerdate:iso-strict)', 'refs/time-machine/']);

  return {
    generat: new Date(ara).toISOString(),
    tall: branca || commit ? { branca, commit, arbre_net: estat === null ? null : estat === '' } : null,
    absents,
    protocolledge: json('.agents/protocolledge.json'),
    skillsIndex: json('.agents/skills_index.json'),
    cervell: json('.agents/cervell.json'),
    settings: json('.claude/settings.json'),
    hooksAntigravity: json('.agents/hooks.json'),
    // Format de hooks de Claude Code; obligatòria com .agents/hooks.json: si falta, avís alt i cap arnés Codex.
    hooksCodex: json('.codex/hooks.json'),
    agentsMd: esFitxer('AGENTS.md'),
    contextArrencada: contextArrencada(arrel),
    packageJson: json('package.json'),
    registreTasques: json('.agents/cron/registre_tasques.json'),
    segell: json('.agents/SKILLS_SEAL.json'),
    claudeImports: claude === null ? null : [...claude.matchAll(/^@(\S+)\s*$/gm)].map((m) => m[1]),
    skillsDisc,
    skillsClaude,
    llancadors: llancadors(arrel, home, plataforma),
    hooksGit: hooksGit(arrel, { absents }),
    frontissa: frontissa(arrel),
    // Les dues portes de només lectura de les mètriques de salut (null si no hi són o no responen).
    portaDocuments: portaDocuments(arrel),
    cadenaPortes: cadenaPortes(arrel),
    timeMachine: ultimaInstantania ? { ultima: ultimaInstantania } : null,
    // Vigilància: torns, Escriptori, LEDGER i relleu d'ESTAT (null si la font no hi és).
    torns: resumTorns(arrel),
    escriptori: resumEscriptori(arrel),
    ledger: resumLedger(arrel),
    estat: resumEstat(arrel)
  };
}

export function recullMapa(arrel = arrelSegura(), opcions = {}) {
  const ara = opcions.ara ?? Date.now();
  const fonts = recullFonts(arrel, { ...opcions, ara });
  const absoluts = new Map(fonts.llancadors.map((l) => [l.script, l.scriptAbsolut]));
  const existeix = (ruta) => {
    const abs = absoluts.get(ruta) ?? (path.isAbsolute(ruta) ? ruta : path.join(arrel, ruta));
    return fs.existsSync(abs);
  };
  for (const l of fonts.llancadors) delete l.scriptAbsolut;
  return construeixMapa(fonts, { existeix, ara });
}

function main() {
  const mapa = recullMapa();
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(mapa, null, 2));
    return;
  }
  const alts = mapa.avisos.filter((a) => a.severitat === 'alta');
  console.log(`🗺️  [Mapa] ${mapa.nodes.length} nodes · ${mapa.arestes.length} arestes · ${mapa.avisos.length} avisos (${alts.length} alts) · ${mapa.tasques.length} tasques`);
  for (const a of alts) console.log(`   ❌ ${a.node} · ${a.codi} · ${a.evidencia ?? ''}`);
  for (const m of mapa.salut) {
    const valor = m.valor === 'N/A' ? 'N/A' : m.unitat === 'fraccio' ? `${m.numerador}/${m.denominador}` : `${m.valor} ${m.unitat}`;
    console.log(`   · ${m.metrica}: ${valor}`);
  }
}

if (esMain(import.meta.url)) {
  try { main(); } catch (e) { console.error(`[Mapa] ${e.message}`); process.exitCode = 1; }
}
