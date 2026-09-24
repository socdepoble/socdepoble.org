#!/usr/bin/env node
/**
 * mapa-consola.mjs — closca de node del Mapa de la Consola (sdp.mapa.v1).
 *
 * DESTÍ: tooling/brain/mapa-consola.mjs (en quarantena al laboratori fins que
 * el Mestre el copie; els imports relatius són els del destí).
 *
 * Llig les fonts declarades del Mas, les passa al compilador pur
 * src/sections/consola/mapa/construeixMapa.js i torna el JSON. És de només
 * lectura: no escriu cap fitxer. Només executa `git` (lectura) i, si existix,
 * la frontissa de contingut en mode --json.
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
import { execFileSync } from 'node:child_process';
import { arrelSegura, esMain } from '../lib/arrel.mjs';
import { parseDocument, validateSchema } from '../documental/core.mjs';
import { construeixMapa } from '../../src/sections/consola/mapa/construeixMapa.js';

const llig = (abs) => { try { return fs.readFileSync(abs, 'utf8'); } catch { return null; } };
const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');

/** Mencions de skills dins de la prosa: sempre inferides, mai declarades. */
const MENCIO_SKILL = /(?<![\w./-])((?:core|sdp|wiki)-[a-z0-9]+(?:-[a-z0-9]+)*)(?![\w-]|\.[a-z])/g;
const LLICONS = /^##\s+Lliçons del Mestre\s*$/m;
const ERROR_DE_LOG = /(?:Error:|MODULE_NOT_FOUND|npm ERR!|Traceback)/;

function git(arrel, args) {
  try {
    return execFileSync('git', ['-C', arrel, ...args], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 10000
    }).trim();
  } catch { return null; }
}

/** Entrades de la secció «Lliçons del Mestre» (línies que comencen per «- »). */
export function compteLlicons(cos) {
  const m = LLICONS.exec(cos);
  if (!m) return 0;
  const resta = cos.slice(m.index + m[0].length);
  const fi = resta.search(/^##\s/m);
  return (fi === -1 ? resta : resta.slice(0, fi)).split('\n').filter((l) => /^\s*-\s+\S/.test(l)).length;
}

export function mencionsDeSkills(cos) {
  return [...new Set([...cos.matchAll(MENCIO_SKILL)].map((m) => m[1]))].sort();
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
    interval: enter('StartInterval'),
    keepAlive: cert('KeepAlive'),
    enArrencar: cert('RunAtLoad'),
    directori: cadena('WorkingDirectory'),
    eixida: cadena('StandardOutPath'),
    errors: cadena('StandardErrorPath')
  };
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
    const logs = [p.eixida, p.errors].filter(Boolean).map((l) => path.resolve(base, l));
    let activitat = null;
    for (const l of logs) {
      try {
        const t = fs.statSync(l).mtime.toISOString();
        if (!activitat || t > activitat) activitat = t;
      } catch { /* sense registre: activitat desconeguda */ }
    }
    const ultima = p.errors ? (llig(path.resolve(base, p.errors)) ?? '').trimEnd().split('\n').at(-1) ?? '' : '';
    resultat.push({
      etiqueta: p.etiqueta,
      fitxer: privat(path.join(dir, nom)),
      script: absScript ? (dinsRepo ? path.relative(arrel, absScript).split(path.sep).join('/') : privat(absScript)) : null,
      scriptAbsolut: absScript,
      interval: p.interval,
      keepAlive: p.keepAlive,
      enArrencar: p.enArrencar,
      activitat,
      ultimaLiniaError: ERROR_DE_LOG.test(ultima)
    });
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
    packageJson: json('package.json'),
    registreTasques: json('.agents/cron/registre_tasques.json'),
    segell: json('.agents/SKILLS_SEAL.json'),
    claudeImports: claude === null ? null : [...claude.matchAll(/^@(\S+)\s*$/gm)].map((m) => m[1]),
    skillsDisc,
    skillsClaude,
    llancadors: llancadors(arrel, home, plataforma),
    frontissa: frontissa(arrel),
    timeMachine: ultimaInstantania ? { ultima: ultimaInstantania } : null
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
