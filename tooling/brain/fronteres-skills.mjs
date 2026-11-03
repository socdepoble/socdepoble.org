#!/usr/bin/env node
/**
 * fronteres-skills.mjs — Porta Fronteres de Skills (P1-30, Mòdul 9 del Llibre Mestre).
 *
 * QUÈ FA
 *   Comprova que cada skill de `.agents/skills/*\/SKILL.md` complix el seu contracte
 *   executable (REGLES, F1-F5) i manté un deute conegut en trinquet (DEUTE_ACCEPTAT).
 *   Només llig: no importa child_process, no escriu cap fitxer i no executa cap ordre
 *   de les skills. Un `node <camí>` es comprova al disc; un `npm run <script>`, a
 *   package.json. Res més.
 *
 * CRÈDIT
 *   L'esquelet ve del kit de Codex, auditat com a dada i no integrat en cru
 *   (`codex_onada2/b1_run_portes_exit0_complet/payload/tooling/brain/fronteres-skills.mjs`):
 *   inventari() de cataleg_skills.mjs, la classe i els motors. Les regles, el deute i el
 *   trinquet són de B10-GOVERN §2.2 (marató 261101_2143, torn_3d9af83b).
 *
 * CICLE DE VIDA DEL DEUTE (B10G-ARB-05, D-7)
 *   1. Hook: `main` ix amb 0 si només hi ha deute ranci, i l'avisa. Un segell parcial no
 *      bloqueja la resta de commits.
 *   2. Suite Node primària (tests/fronteres-skills.test.mjs): exigix noves = [] i, en una
 *      prova a part, deuteRanci = [].
 *   3. Una entrada només hi entra amb pegat a `skills-per-segellar/`; se'n retira en el
 *      mateix lot de governança que el segell del Mestre.
 *   4. El trinquet s'estreny: retirada l'entrada, la mateixa violació torna a ser nova.
 *
 * ÚS
 *   node tooling/brain/fronteres-skills.mjs [--json] [--arrel=<dir>]
 *   0 = cap violació nova (el deute ranci només avisa) · 1 = violacions noves · 2 = ús o error.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { CAMINS, arrel as arrelImposada, arrelSegura, esMain } from '../lib/arrel.mjs';
import { font, inventari, segura } from './cataleg_skills.mjs';
import { parseFrontmatter, splitFrontmatter } from '../wiki/lib/frontmatter.mjs';

export const ESQUEMA = 'sdp.fronteres-skills.v2';

export const REGLES = Object.freeze({
  F1: 'contracte.llig i contracte.escriu: llistes no buides de camins canònics que existixen',
  F2: 'cada `node <camí>` és un fitxer regular canònic dins de l’arrel, sense symlinks; cada `npm run <script>` és a package.json (també dins de blocs de codi)',
  F3: 'cap ordre d’escriptura recursiva (sed -i, perl -i, find … -exec/-delete, xargs rm|sed|perl) sense excloure 01_produccio',
  F4: 'cada var(--sdp-*) està declarat a src/**/*.css; cap color, ombra ni radi literal fora d’una prohibició o del valor del token que la línia nomena',
  F5: 'el que una ordre de la skill llig (require(\'./…\'), readFileSync(\'…\'), cat <camí>) cap dins de contracte.llig o contracte.escriu'
});

/** Empremta estable d'una violació: no depén de la línia, només de la regla, la skill i el detall. */
export const empremta = (regla, skill, detall) =>
  createHash('sha256').update(`${regla}|${skill}|${detall}`).digest('hex').slice(0, 16);

/** Motiu canònic d'una entrada de deute (exportat: amb el deute buidat continua tenint ús). */
export const motiuDeute = (skill) =>
  `pegat a skills-per-segellar/${skill}; el segell és del Mestre i retira esta entrada en el mateix lot (B10 marató 261101_2143)`;

/** Deute conegut, amb empremta estable. Cicle de vida a la capçalera (D-7). */
export const DEUTE_ACCEPTAT = Object.freeze([]);

/* Una línia de prohibició («Mai …», «prohibit …», «cap component …») pot citar el literal que prohibix.
   Ni `ni` ni `cap` sols: eximirien qualsevol frase descriptiva (B10G-ARB-06). */
const PROHIBICIO = /\b(?:mai|prohibi\w*|cap\s+component)\b/iu;
/* `node ./tooling/…` és el mateix motor que `node tooling/…`: el prefix `./` no entra a la captura (B10G-B-ARB-04). */
const RE_NODE = /\bnode\s+(?:\.\/)?((?:tooling|scripts|\.agents)\/[A-Za-z0-9_./-]+\.(?:mjs|cjs|js))\b/g;
const RE_NPM = /\bnpm\s+run\s+([A-Za-z0-9:_-]+)/g;
const RE_VAR = /var\(\s*(--sdp-[a-z0-9-]+)\s*[,)]/g;
const RE_SPAN = /`([^`]+)`/g;
const RE_COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\([^()]*\)|hsla?\([^()]*\)/g;
/* Cada declaració box-shadow/border-radius del tros, no només la primera: també després d'un selector
   o d'una altra declaració (B10G-B-ARB-04). El valor acaba al primer `;` o `}` (indexOf, sense retrocés). */
const RE_DECL = /(?:^|[;{\s])(box-shadow|border-radius)\s*:/g;
/* Les arrels canòniques ixen de CAMINS (arrel.mjs), mai escrites a mà (Porta Rutes, R1). */
const escapa = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const arrels = (...noms) => noms.map(escapa).join('|');
const RE_LECTURA = new RegExp(
  `require\\(\\s*['"]\\.\\/([^'"]+)['"]\\s*\\)|readFileSync\\(\\s*['"](?:\\.\\/)?([^'"]+)['"]`
  + `|\\bcat\\s+((?:${arrels(CAMINS.agents, CAMINS.wiki, 'src', 'tooling')})\\/[^\\s\`]+)`, 'g');
const RE_TANCA = /^\s*(`{3,}|~{3,})/;
/* Avisos A1 (heurístics, no bloquegen). */
const VERB_LLIG = /\b(?:revisa|llig|llegix|llegir|consulta|carrega|contrasta)\b/i;
const VERB_ESCRIU = /\b(?:escriu|escriure|actualitza|registra|afig|afegix|crea|desa|edita|modifica)\b/i;
const RE_CAMI = new RegExp(
  `\`((?:${arrels(CAMINS.agents, CAMINS.wiki, 'src', 'tooling', 'scripts', 'supabase', 'public', 'tests')})\\/[^\`\\s]*`
  + '|AGENTS\\.md|CLAUDE\\.md|package\\.json)`', 'g');

const compacta = (v) => String(v).toLowerCase().replace(/\s+/g, '');
const senseBarra = (p) => (typeof p === 'string' && p.endsWith('/') ? p.slice(0, -1) : p);
const dins = (p, llista) => Array.isArray(llista) && llista.some((b) => {
  const q = senseBarra(String(b));
  return p === q || p.startsWith(`${q}/`);
});

/** Lleva els comentaris CSS sense expressions regulars (cap retrocés). */
function senseComentaris(css) {
  let eixida = '';
  let i = 0;
  while (i < css.length) {
    const obri = css.indexOf('/*', i);
    if (obri === -1) { eixida += css.slice(i); break; }
    eixida += `${css.slice(i, obri)} `;
    const tanca = css.indexOf('*/', obri + 2);
    if (tanca === -1) break;
    i = tanca + 2;
  }
  return eixida;
}

/**
 * Tokens `--sdp-*` declarats a src/**\/*.css → Map<nom, valor resolt>.
 * Tema clar = primera declaració: src/css/tokens.css primer (font canònica de Pedra Seca),
 * després la resta per ordre de camí. Els comentaris no declaren res. Els `var(--x)` es
 * resolen fins a 5 salts; un cicle o un nom desconegut es queda tal com està.
 */
export function tokensDeclarats(arrel) {
  const src = path.join(arrel, 'src');
  const fitxers = [];
  const camina = (dir) => {
    const entrades = fs.readdirSync(dir, { withFileTypes: true })
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const e of entrades) {
      if (e.isSymbolicLink() || e.name === 'node_modules') continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) camina(p);
      else if (e.isFile() && e.name.endsWith('.css')) fitxers.push(p);
    }
  };
  let estat = null;
  try { estat = fs.lstatSync(src); } catch { /* sense src/: cap token */ }
  if (estat?.isDirectory()) camina(src);
  const canonic = path.join(src, 'css', 'tokens.css');
  fitxers.sort((a, b) => (a === canonic ? -1 : b === canonic ? 1 : a < b ? -1 : a > b ? 1 : 0));
  const crus = new Map();
  for (const f of fitxers) {
    const css = senseComentaris(fs.readFileSync(f, 'utf8'));
    for (const m of css.matchAll(/(--sdp-[a-z0-9-]+)\s*:\s*([^;{}]+)/g)) {
      if (!crus.has(m[1])) crus.set(m[1], m[2].trim());
    }
  }
  const resol = (valor, salts) => (salts >= 5 ? valor
    : valor.replace(/var\(\s*(--sdp-[a-z0-9-]+)\s*(?:,[^()]*)?\)/g,
      (tot, nom) => (crus.has(nom) ? resol(crus.get(nom), salts + 1) : tot)));
  return new Map([...crus].map(([nom, valor]) => [nom, resol(valor, 0).trim().toLowerCase().replace(/\s+/g, ' ')]));
}

/** Línies del cos (sense frontmatter), amb el número real de línia i el tipus: prosa, codi o tanca. */
function liniesDelCos(text) {
  const { hasFrontmatter, body } = splitFrontmatter(text);
  const prefix = hasFrontmatter ? text.slice(0, text.length - body.length) : '';
  const desplacament = prefix.split('\n').length - 1;
  const linies = [];
  let obert = null;
  body.split(/\r?\n/).forEach((l, i) => {
    const n = desplacament + i + 1;
    const m = RE_TANCA.exec(l);
    if (m && (obert === null || m[1][0] === obert)) {
      obert = obert === null ? m[1][0] : null;
      linies.push({ n, text: l, tipus: 'tanca' });
    } else linies.push({ n, text: l, tipus: obert === null ? 'prosa' : 'codi' });
  });
  return linies;
}

/** Ordre d'escriptura recursiva dins d'un tros. Les banderes prèvies (`sed -E -i`, `perl -0777 -pi`,
 *  `xargs -0 rm`) també compten; cada repetició va delimitada per espais (cap retrocés imbricat). */
function esOrdreRecursiva(tros) {
  if (/\bsed\b(?:\s+-\S+)*?\s+(?:-[a-zA-Z]*i|--in-place)/.test(tros)) return true;
  if (/\bperl\b(?:\s+-\S+)*?\s+-[a-hj-z]*i/.test(tros)) return true;
  if (/\bxargs\b(?:\s+-\S+)*\s+(?:rm|sed|perl)\b/.test(tros)) return true;
  const find = tros.search(/\bfind\b/);
  return find !== -1 && /\s-(?:exec|execdir|delete)\b/.test(tros.slice(find));
}

/* Exempció d'F3 només per una exclusió explícita de 01_produccio dins del mateix tros, mai per la simple
   menció: escriure dins de 01_produccio és justament el que la regla vol vore (B10G-B-ARB-01).
   Es mira per paraules (split), sense expressions amb retrocés. */
const FILTRE_FIND = /^-i?(?:path|wholename|name)$/;
const COMETES = new Set(["'", '"']);
const nu = (p) => {
  let [ini, fi] = [0, p.length];
  while (ini < fi && COMETES.has(p[ini])) ini++;
  while (fi > ini && COMETES.has(p[fi - 1])) fi--;
  return p.slice(ini, fi);
};
function exclou01Produccio(tros) {
  const p = tros.split(/\s+/).map(nu);
  const te01 = (s) => typeof s === 'string' && s.includes('01_produccio');
  for (let i = 0; i < p.length; i++) {
    const [a, b, c] = [p[i], p[i + 1], p[i + 2]];
    if ((a === '-not' || a === '!' || a === '\\!') && FILTRE_FIND.test(b || '') && te01(c)) return true; // find … -not -path '*01_produccio*'
    if (FILTRE_FIND.test(a) && te01(b) && c === '-prune') return true;                                   // find … -path '*01_produccio*' -prune
    if (/^--exclude(?:-dir)?=/.test(a) && te01(a)) return true;                                           // rsync/grep/tar --exclude(-dir)=…
    if ((a === '--exclude' || a === '--exclude-dir') && te01(b)) return true;
    if (a === 'grep' && b === '-v' && te01(c)) return true;                                              // … | grep -v 01_produccio | xargs …
  }
  return false;
}

/**
 * Declaracions box-shadow/border-radius d'un tros amb valor literal (px, rgb[a] o #hex, sense var(--sdp-*)).
 * → { decls: [{ text, valor }], resta }: `resta` és el tros sense eixes declaracions, per als colors solts.
 * Una declaració amb var(--sdp-*) no compta com a literal i els seus colors es miren com a solts.
 */
function declaracionsLiterals(tros) {
  const decls = [];
  let resta = '';
  let cursor = 0;
  for (const m of tros.matchAll(RE_DECL)) {
    const ini = m.index + m[0].indexOf(m[1]);
    if (ini < cursor) continue;
    const dosPunts = m.index + m[0].length;
    const fins = [tros.indexOf(';', dosPunts), tros.indexOf('}', dosPunts)].filter((i) => i !== -1);
    const fi = fins.length ? Math.min(...fins) : tros.length;
    const valor = tros.slice(dosPunts, fi);
    if (!/\d+px|rgba?\(|#[0-9a-f]/i.test(valor) || /var\(--sdp-/.test(valor)) continue;
    decls.push({ text: tros.slice(ini, fi).trim(), valor });
    resta += `${tros.slice(cursor, ini)} `;
    cursor = fi;
  }
  return { decls, resta: resta + tros.slice(cursor) };
}

function comprovaContracte(clau, llista, arrel, afig) {
  if (!Array.isArray(llista) || llista.length === 0) { afig('F1', `${clau} absent o buit`); return; }
  for (const p of llista) {
    const rel = senseBarra(p);
    let abs = null;
    try { abs = typeof rel === 'string' && rel ? segura(arrel, rel) : null; } catch { abs = null; }
    if (!abs) afig('F1', `${clau}: camí no canònic ${p}`);
    else if (!fs.existsSync(abs)) afig('F1', `${clau}: absent ${p}`);
  }
}

/**
 * Audita una skill de l'inventari ({ id, sha256, text }).
 * → { id, sha256, classe, llig, escriu, motors, violacions: [{ regla, empremta, detall, linies }], avisos }
 */
export function auditaSkill(skill, { arrel, scripts = {}, tokens = new Map() }) {
  const d = parseFrontmatter(skill.text).data;
  const llig = d['contracte.llig'];
  const escriu = d['contracte.escriu'];
  const trobades = new Map();
  const afig = (regla, detall, linia = null) => {
    const e = empremta(regla, skill.id, detall);
    if (!trobades.has(e)) trobades.set(e, { regla, empremta: e, detall, linies: [] });
    const v = trobades.get(e);
    if (linia !== null && !v.linies.includes(linia)) v.linies.push(linia);
  };
  comprovaContracte('contracte.llig', llig, arrel, afig);
  comprovaContracte('contracte.escriu', escriu, arrel, afig);

  const motors = new Set();
  const avisos = [];
  for (const { n, text: l, tipus } of liniesDelCos(skill.text)) {
    const prohibicio = PROHIBICIO.test(l);
    // F2 · motors i scripts, també dins de blocs de codi.
    for (const m of l.matchAll(RE_NODE)) {
      motors.add(m[1]);
      let abs;
      try { abs = segura(arrel, m[1]); }
      catch { afig('F2', `motor no canònic ${m[1]}`, n); continue; }
      if (!fs.existsSync(abs)) afig('F2', `motor absent ${m[1]}`, n);
      else if (!fs.lstatSync(abs).isFile()) afig('F2', `motor no és fitxer regular ${m[1]}`, n);
    }
    for (const m of l.matchAll(RE_NPM)) {
      if (!Object.hasOwn(scripts, m[1])) afig('F2', `script absent ${m[1]}`, n);
    }
    // F3 · a la prosa, dins de trossos `…`; dins d'un bloc de codi, la línia sencera.
    const trossos = tipus === 'codi' ? [l.trim()] : tipus === 'prosa' ? [...l.matchAll(RE_SPAN)].map((m) => m[1].trim()) : [];
    if (!prohibicio) {
      for (const tros of trossos) {
        if (esOrdreRecursiva(tros) && !exclou01Produccio(tros)) afig('F3', `ordre recursiva d’escriptura sense excloure 01_produccio: ${tros.slice(0, 120)}`, n);
      }
    }
    // F4 · tokens declarats (a tot arreu) i literals (només a la prosa, dins de `…`).
    const nomenats = new Set();
    for (const m of l.matchAll(RE_VAR)) {
      if (!tokens.has(m[1])) afig('F4', `token no declarat ${m[1]}`, n);
      else nomenats.add(compacta(tokens.get(m[1])));
    }
    if (tipus === 'prosa' && !prohibicio) {
      for (const span of l.matchAll(RE_SPAN)) {
        const { decls, resta } = declaracionsLiterals(span[1]);
        for (const d of decls) {
          if (!nomenats.has(compacta(d.text)) && !nomenats.has(compacta(d.valor))) afig('F4', `valor CSS literal ${d.text}`, n);
        }
        // Colors solts: fora de les declaracions ja comptades (una declaració compta una sola vegada, no també el seu rgba interior).
        for (const c of resta.matchAll(RE_COLOR)) {
          const lit = c[0].toLowerCase();
          if (!nomenats.has(compacta(lit))) afig('F4', `valor CSS literal ${lit}`, n);
        }
      }
    }
    // F5 · el que una ordre llig ha de ser dins del contracte.
    for (const m of l.matchAll(RE_LECTURA)) {
      const cru = m[1] || m[2] || m[3];
      const p = senseBarra(cru.replace(/^\.\//, '').replace(/[.,;:)]+$/, ''));
      if (!dins(p, llig) && !dins(p, escriu)) afig('F5', `lectura fora de contracte.llig ${p}`, n);
    }
    // A1 · avisos heurístics: camí entre `…` amb un verb de lectura o d'escriptura, fora del contracte.
    for (const m of l.matchAll(RE_CAMI)) {
      const p = senseBarra(m[1].replace(/[.,;:]$/, ''));
      if (VERB_ESCRIU.test(l) && !dins(p, escriu)) avisos.push({ tipus: 'escriu', cami: p, linia: n });
      else if (VERB_LLIG.test(l) && !dins(p, llig) && !dins(p, escriu)) avisos.push({ tipus: 'llig', cami: p, linia: n });
    }
  }
  const violacions = [...trobades.values()].map((v) => ({ ...v, linies: v.linies.sort((a, b) => a - b) }));
  return {
    id: skill.id, sha256: skill.sha256,
    classe: motors.size ? 'procediment_amb_motor' : 'procediment',
    llig, escriu, motors: [...motors], violacions, avisos
  };
}

/** Un deute mal escrit no pot eximir res: cada entrada ha de recalcular la seua empremta. */
function validaDeute(deute) {
  if (!Array.isArray(deute)) throw new Error('DEUTE_ACCEPTAT: ha de ser una llista');
  const vistes = new Set();
  for (const e of deute) {
    const camps = ['skill', 'regla', 'empremta', 'detall', 'motiu'];
    if (!e || camps.some((c) => typeof e[c] !== 'string' || !e[c].trim())) throw new Error(`DEUTE_ACCEPTAT: entrada incompleta ${JSON.stringify(e)}`);
    if (!Object.hasOwn(REGLES, e.regla)) throw new Error(`DEUTE_ACCEPTAT: regla desconeguda ${e.regla}`);
    if (empremta(e.regla, e.skill, e.detall) !== e.empremta) throw new Error(`DEUTE_ACCEPTAT: empremta incoherent ${e.skill} ${e.empremta}`);
    const clau = `${e.skill}|${e.empremta}`;
    if (vistes.has(clau)) throw new Error(`DEUTE_ACCEPTAT: entrada duplicada ${clau}`);
    vistes.add(clau);
  }
}

/** → { esquema, total, skills, noves, enDeute, deuteRanci, avisos, valid: noves.length === 0 } */
export function auditaSkills(arrel = arrelSegura(), { deute = DEUTE_ACCEPTAT } = {}) {
  validaDeute(deute);
  const inventariades = inventari(arrel);
  const pkg = JSON.parse(font(arrel, 'package.json').text);
  const scripts = pkg && typeof pkg.scripts === 'object' && pkg.scripts !== null ? pkg.scripts : {};
  const tokens = tokensDeclarats(arrel);
  const skills = inventariades.map((s) => auditaSkill(s, { arrel, scripts, tokens }));
  const acceptat = new Map(deute.map((e) => [`${e.skill}|${e.empremta}`, e]));
  const vistes = new Set();
  const noves = [];
  const enDeute = [];
  for (const s of skills) {
    for (const v of s.violacions) {
      const clau = `${s.id}|${v.empremta}`;
      if (acceptat.has(clau)) { vistes.add(clau); enDeute.push({ skill: s.id, ...v, motiu: acceptat.get(clau).motiu }); }
      else noves.push({ skill: s.id, ...v });
    }
  }
  const deuteRanci = deute.filter((e) => !vistes.has(`${e.skill}|${e.empremta}`)).map((e) => ({ ...e }));
  const avisos = skills.flatMap((s) => s.avisos.map((a) => ({ skill: s.id, ...a })));
  return { esquema: ESQUEMA, total: skills.length, skills, noves, enDeute, deuteRanci, avisos, valid: noves.length === 0 };
}

/** Informe curt per al hook i per a run-portes. */
export function informe(r) {
  const classes = r.skills.reduce((a, s) => ({ ...a, [s.classe]: (a[s.classe] || 0) + 1 }), {});
  const linies = [
    `Porta Fronteres de Skills (P1-30) · ${r.total} skills (${classes.procediment || 0} procediment, ${classes.procediment_amb_motor || 0} amb motor)`
    + ` · ${r.noves.length} violacions noves · ${r.enDeute.length} en deute · ${r.deuteRanci.length} deute ranci · ${r.avisos.length} avisos`
  ];
  const on = (v) => (v.linies.length ? ` (línies ${v.linies.join(', ')})` : '');
  for (const v of r.noves) linies.push(`  NOVA [${v.regla}] ${v.skill}: ${v.detall}${on(v)} · empremta ${v.empremta}`);
  for (const e of r.deuteRanci) {
    linies.push(`  AVÍS deute ranci [${e.regla}] ${e.skill}: ${e.detall} · empremta ${e.empremta}: ja no ix; retira-la de DEUTE_ACCEPTAT en el lot del segell (D-7)`);
  }
  if (r.noves.length) {
    linies.push('  Corregix la skill amb un pegat a skills-per-segellar (el segell és del Mestre). Regles: '
      + [...new Set(r.noves.map((v) => v.regla))].map((k) => `${k} = ${REGLES[k]}`).join(' | '));
  }
  return linies.join('\n');
}

export function main(argv = process.argv.slice(2), { arrel = null, sortida = console, deute = DEUTE_ACCEPTAT } = {}) {
  const ambArrel = (a) => a.startsWith('--arrel=') && a.length > '--arrel='.length;
  const desconeguts = argv.filter((a) => a !== '--json' && !ambArrel(a));
  if (desconeguts.length) {
    sortida.error(`Ús: node tooling/brain/fronteres-skills.mjs [--json] [--arrel=<dir>] (desconegut: ${desconeguts.join(' ')})`);
    return 2;
  }
  let r;
  try {
    // Precedència d'arrel.mjs: opció programàtica, després --arrel=<dir> d'este argv (validat amb el marcador).
    const desti = arrel || (argv.some(ambArrel) ? arrelImposada({ argv, env: {} }) : arrelSegura());
    r = auditaSkills(desti, { deute });
  }
  catch (e) { sortida.error(`Porta Fronteres de Skills: ${e.message}`); return 2; }
  sortida.log(argv.includes('--json') ? JSON.stringify(r, null, 2) : informe(r));
  return r.valid ? 0 : 1;
}

if (esMain(import.meta.url)) process.exitCode = main();
