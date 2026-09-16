/**
 * arrel.mjs — L'ÚNICA font de veritat sobre on és l'arrel del projecte.
 *
 * PER QUÈ EXISTIX AQUEST FITXER
 * ─────────────────────────────
 * L'auditoria 260830 va trobar tres definicions incompatibles d'"arrel":
 *
 *   tooling/wiki/tractor-cognitiu.mjs   ['AGENTS.md', 'package.json']
 *   tooling/wiki/lib/project_paths.mjs  4 fitxers + 2 directoris, tots obligatoris
 *   tooling/gates/tractor-doctrina.mjs  AGENTS.md || .agents/AGENTS.md
 *
 * Quan l'"Operació Tret al Cap" va moure AGENTS.md a .agents/, la primera va
 * quedar depenent d'un flag màgic (`--arrel=.`) per a arrancar, i la segona va
 * començar a llançar una excepció crua perquè exigia `_wiki_de_poble`, que és
 * un repositori separat i pot no estar clonat.
 *
 * REGLA: cap eina de `tooling/` torna a calcular l'arrel pel seu compte.
 * Importa d'ací. `tooling/gates/tractor-arrel.mjs` ho fa complir.
 *
 * PRINCIPIS
 *   · Zero dependències. Node natiu. (Pedra Seca)
 *   · Mai es dedueix per `cwd` ni comptant `..`. Es descobrix per estructura.
 *   · Un sol marcador OBLIGATORI. La resta són corroboradors: es reporten,
 *     no maten. Un repo sense la Wiki clonada ha de poder passar les portes.
 *   · Guanya l'arrel MÉS PROPERA (com fa git). Si n'hi ha més d'una, es diu.
 *   · Els errors són diagnòstics, mai un stack trace cru: han de dir què s'ha
 *     buscat, on, i què fer a continuació.
 *
 * ÚS
 *   import { ARREL, R, rel, CAMINS, dins } from '../lib/arrel.mjs';
 *   const skills = R(CAMINS.skills);
 *
 * ÚS AMB SOBREESCRIPTURA (proves, CI, monorepo)
 *   SDP_ARREL=/ruta node tooling/gates/tancament.mjs
 *   node tooling/gates/tancament.mjs --arrel=/ruta
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/* ══════════════════════ Contracte estructural ══════════════════════ */

/**
 * L'únic fitxer que defineix "ací comença Sóc de Poble".
 * Si algun dia es torna a moure, es canvia ACÍ i enlloc més.
 */
export const MARCADOR = '.agents/AGENTS.md';

/**
 * Corroboradors: la seua absència NO impedix identificar l'arrel, però es
 * reporta. Serveixen perquè `diagnostic()` puga dir «has trobat l'arrel però
 * et falta mitja instal·lació» en compte de fallar en sec més avant.
 *
 *   critic:true  → una porta en mode estricte pot decidir plantar-se.
 *   critic:false → informatiu (repositori separat, opcional, generat).
 */
export const CORROBORADORS = [
  { cami: 'package.json', tipus: 'fitxer', critic: true, nota: 'manifest npm i scripts de portes' },
  { cami: '.agents/ESTAT.md', tipus: 'fitxer', critic: true, nota: 'present efímer (Marmota)' },
  { cami: '.agents/LEDGER.md', tipus: 'fitxer', critic: true, nota: 'llibre d\'obra' },
  { cami: '.agents/skills', tipus: 'directori', critic: true, nota: 'autoritat executiva' },
  { cami: 'src', tipus: 'directori', critic: true, nota: 'codi font del Frontend' },
  { cami: 'tooling', tipus: 'directori', critic: true, nota: 'eines i portes' },
  { cami: '_wiki_de_poble', tipus: 'directori', critic: false, nota: 'Wiki d\'Obsidian; pot ser un repositori separat' },
];

/**
 * Camins canònics. Cap eina torna a escriure aquestes cadenes a pèl: si una
 * carpeta es mou, es canvia una línia d'ací i tot el tooling la seguix.
 */
export const CAMINS = Object.freeze({
  agents: '.agents',
  bios: '.agents/AGENTS.md',
  estat: '.agents/ESTAT.md',
  ledger: '.agents/LEDGER.md',
  bootstrap: '.agents/BOOTSTRAP.md',
  protocol: '.agents/PROTOCOL_PETORRETA.md',
  manifest: '.agents/manifest.yaml',
  skills: '.agents/skills',
  indexSkills: '.agents/skills/00_INDEX_SKILLS.md',
  genoma: '.agents/GENOMA.md',

  wiki: '_wiki_de_poble',
  escriptori: '_wiki_de_poble/04_ESCRIPTORI',
  indexEscriptori: '_wiki_de_poble/04_escriptori/00_index_escriptori.md',
  arxiuHistoric: '_wiki_de_poble/90_arxiu_historic',
  actes: '_wiki_de_poble/10_actes',
  skillsMirror: '_wiki_de_poble/02_saber/skills_mirror',

  src: 'src',
  tooling: 'tooling',
  portes: 'tooling/gates',
  cervell: 'tooling/brain',
  toolingWiki: 'tooling/wiki',
  dist: 'dist',
});

/** Directoris que cap recorregut del tooling ha de trepitjar mai. */
export const EXCLOSOS = Object.freeze(new Set([
  'node_modules', '.git', 'dist', 'build', '.next', 'vendor', 'coverage',
  '.sdp-paperera', '.sdp-reflex', '.brain-reports', '.gemini', '.obsidian', '90_arxiu_historic'
]));

/* ══════════════════════ Error diagnòstic ══════════════════════ */

export class ErrorArrel extends Error {
  constructor(missatge, detalls = {}) {
    super(missatge);
    this.name = 'ErrorArrel';
    this.detalls = detalls;
  }

  /** Text per a humans. Cap porta ha de mostrar un stack trace cru. */
  informe() {
    const l = [];
    l.push('');
    l.push("❌ [ARREL] No s'ha pogut determinar l'arrel del projecte.");
    l.push('');
    l.push(`   Marcador buscat : ${MARCADOR}`);
    if (this.detalls.desDe) l.push(`   Cerca iniciada a: ${this.detalls.desDe}`);
    if (this.detalls.revisats?.length) {
      l.push(`   Directoris revisats (${this.detalls.revisats.length}):`);
      for (const d of this.detalls.revisats.slice(0, 12)) l.push(`     · ${d}`);
      if (this.detalls.revisats.length > 12) l.push(`     · … i ${this.detalls.revisats.length - 12} més`);
    }
    if (this.detalls.motiu) l.push(`   Motiu           : ${this.detalls.motiu}`);
    l.push('');
    l.push('   Què fer:');
    l.push('     · Executa des de dins del repositori, o');
    l.push('     · passa --arrel=/ruta/al/repositori, o');
    l.push('     · exporta SDP_ARREL=/ruta/al/repositori');
    l.push('');
    return l.join('\n');
  }
}

/* ══════════════════════ Utilitats de sistema de fitxers ══════════════════════ */

function estat(p) {
  try { return fs.lstatSync(p); } catch { return null; }
}

function realNet(p) {
  try { return fs.realpathSync(p); } catch { return null; }
}

/** El marcador ha de ser un fitxer regular, no un symlink (evita segrest d'arrel). */
function teMarcador(dir) {
  const s = estat(path.join(dir, MARCADOR));
  return Boolean(s && s.isFile() && !s.isSymbolicLink());
}

/**
 * Comprova que `cami` queda dins de `base` un cop resolts els symlinks.
 * Retorna la ruta absoluta resolta, o `null` si s'escapa.
 */
export function dins(base, cami) {
  const abs = path.resolve(base, cami);
  const arrelReal = realNet(base);
  if (!arrelReal) return null;
  // Resolem l'ancestre existent més pròxim: el fitxer pot encara no existir.
  let sonda = abs;
  while (!estat(sonda)) {
    const pare = path.dirname(sonda);
    if (pare === sonda) return null;
    sonda = pare;
  }
  const sondaReal = realNet(sonda);
  if (!sondaReal) return null;
  const r = path.relative(arrelReal, sondaReal);
  if (r !== '' && (r.startsWith('..') || path.isAbsolute(r))) return null;
  return abs;
}

/* ══════════════════════ Descobriment ══════════════════════ */

function puja(desDe) {
  const trobades = [];
  const revisats = [];
  let cursor = desDe;
  for (let i = 0; i < 64; i += 1) {
    revisats.push(cursor);
    if (teMarcador(cursor)) trobades.push(cursor);
    const pare = path.dirname(cursor);
    if (pare === cursor) break;
    cursor = pare;
  }
  return { trobades, revisats };
}

function directoriInicial(inici) {
  const cru = inici instanceof URL || String(inici).startsWith('file:')
    ? fileURLToPath(inici instanceof URL ? inici : new URL(String(inici)))
    : path.resolve(String(inici));
  const s = estat(cru);
  const dir = s?.isDirectory() ? cru : path.dirname(cru);
  return realNet(dir) ?? dir;
}

function llegeixFlagArrel(argv) {
  const i = argv.findIndex((a) => a === '--arrel' || a.startsWith('--arrel='));
  if (i === -1) return null;
  const a = argv[i];
  if (a.startsWith('--arrel=')) return a.slice('--arrel='.length) || null;
  return argv[i + 1] && !argv[i + 1].startsWith('-') ? argv[i + 1] : null;
}

/** Valida una arrel imposada des de fora. Fail-closed amb explicació. */
function validaImposada(cru, origen) {
  const abs = path.resolve(cru);
  const s = estat(abs);
  if (!s?.isDirectory()) {
    throw new ErrorArrel(`Arrel imposada inexistent: ${abs}`, {
      motiu: `${origen} apunta a un directori que no existix.`, desDe: abs,
    });
  }
  const real = realNet(abs) ?? abs;
  if (!teMarcador(real)) {
    throw new ErrorArrel(`Arrel imposada sense marcador: ${real}`, {
      motiu: `${origen} apunta a un directori que no conté ${MARCADOR}.`, desDe: real,
    });
  }
  return real;
}

/**
 * Descobrix l'arrel del projecte.
 *
 * Ordre de precedència (el primer que resol, guanya):
 *   1. opcions.arrel        — crida programàtica
 *   2. --arrel=…            — línia d'ordres
 *   3. SDP_ARREL            — entorn (CI, contenidors)
 *   4. estructura des d'ací — la ubicació d'aquest mòdul
 *   5. estructura des de cwd
 *
 * @returns {string} ruta absoluta i canònica (symlinks resolts)
 * @throws {ErrorArrel}
 */
export function arrel(opcions = {}) {
  const { argv = process.argv.slice(2), env = process.env, desDe = import.meta.url } = opcions;

  if (opcions.arrel) return validaImposada(opcions.arrel, 'opcions.arrel');
  const flag = llegeixFlagArrel(argv);
  if (flag) return validaImposada(flag, '--arrel');
  if (env.SDP_ARREL) return validaImposada(env.SDP_ARREL, 'SDP_ARREL');

  const revisats = [];
  for (const punt of [directoriInicial(desDe), realNet(process.cwd()) ?? process.cwd()]) {
    const r = puja(punt);
    revisats.push(...r.revisats);
    // La més propera guanya: `puja` ja les torna d'endins cap a fora.
    if (r.trobades.length > 0) return r.trobades[0];
  }

  throw new ErrorArrel('Arrel no trobada', {
    desDe: directoriInicial(desDe),
    revisats: [...new Set(revisats)],
    motiu: `Cap directori ancestre conté ${MARCADOR} com a fitxer regular.`,
  });
}

/* ══════════════════════ Instància per defecte ══════════════════════ */

/**
 * Es resol una vegada en carregar el mòdul. Si falla, NO peta l'import:
 * es guarda l'error i es llança quan algú l'use de veres, perquè una porta
 * puga capturar-lo i imprimir `informe()` en compte d'un stack trace.
 */
let _arrel = null;
let _error = null;
try { _arrel = arrel(); } catch (e) { _error = e; }

/** Ruta absoluta de l'arrel. Llança ErrorArrel si no s'ha pogut determinar. */
export const ARREL = new Proxy({}, {
  get(_, prop) {
    if (_error) throw _error;
    return Reflect.get(_arrel, prop, _arrel);
  },
});

/** Forma segura: retorna l'arrel o llança un ErrorArrel amb informe(). */
export function arrelSegura() {
  if (_error) throw _error;
  return _arrel;
}

/** Uneix trossos des de l'arrel. */
export function R(...trossos) {
  return path.join(arrelSegura(), ...trossos);
}

/** Ruta relativa a l'arrel, amb barres normalitzades. */
export function rel(abs) {
  const r = path.relative(arrelSegura(), abs);
  return (r || '.').split(path.sep).join('/');
}

/** Existix aquest camí (relatiu a l'arrel)? */
export function hi(camiRelatiu) {
  return Boolean(estat(R(camiRelatiu)));
}

/* ══════════════════════ Diagnòstic ══════════════════════ */

/**
 * Estat estructural del repositori. Les portes l'usen per a decidir si poden
 * treballar i per a explicar-ho quan no poden. No llança mai.
 *
 * @returns {{ok:boolean, arrel:string|null, error:ErrorArrel|null,
 *             presents:Array, absents:Array, absentsCritics:Array}}
 */
export function diagnostic() {
  if (_error) {
    return { ok: false, arrel: null, error: _error, presents: [], absents: [], absentsCritics: [] };
  }
  const presents = [];
  const absents = [];
  for (const c of CORROBORADORS) {
    const s = estat(path.join(_arrel, c.cami));
    const val = c.tipus === 'directori' ? s?.isDirectory() : s?.isFile();
    (val ? presents : absents).push(c);
  }
  const absentsCritics = absents.filter((c) => c.critic);
  return { ok: absentsCritics.length === 0, arrel: _arrel, error: null, presents, absents, absentsCritics };
}

/**
 * Prefaci estàndard per a portes. Imprimix l'arrel i, si falta res crític,
 * ho diu i retorna false perquè la porta puga eixir amb codi != 0.
 *
 * @param {string} nom  nom de la porta, per als missatges
 * @param {{estricte?:boolean, silenciós?:boolean}} opcions
 */
export function prefaci(nom, { estricte = false, silenciós = false } = {}) {
  const d = diagnostic();
  if (!d.ok && d.error) {
    console.error(d.error.informe());
    return false;
  }
  if (!silenciós) console.log(`\n${nom}\n   Arrel: ${d.arrel}`);

  if (d.absentsCritics.length) {
    console.error(`\n❌ [${nom}] Falten peces crítiques del repositori:`);
    for (const c of d.absentsCritics) console.error(`   · ${c.cami} — ${c.nota}`);
    console.error('');
    return false;
  }
  const opcionals = d.absents.filter((c) => !c.critic);
  if (opcionals.length && !silenciós) {
    console.log(`   ℹ️  absents no crítics: ${opcionals.map((c) => c.cami).join(', ')}`);
    if (estricte) {
      console.error(`\n❌ [${nom}] Mode estricte: cap absència tolerada.\n`);
      return false;
    }
  }
  return true;
}

/* ══════════════════════ CLI d'autodiagnòstic ══════════════════════ */

if (import.meta.url === `file://${process.argv[1]}`) {
  const d = diagnostic();
  if (d.error) { console.error(d.error.informe()); process.exit(1); }
  console.log(`\n📍 [ARREL] ${d.arrel}\n`);
  for (const c of d.presents) console.log(`   ✅ ${c.cami}`);
  for (const c of d.absents) console.log(`   ${c.critic ? '❌' : '⚪'} ${c.cami} — ${c.nota}`);
  console.log('');
  process.exit(d.ok ? 0 : 1);
}
