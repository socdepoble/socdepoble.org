#!/usr/bin/env node
/**
 * prepara-pla.mjs — pla sdp.mutation.v1 del paquet 261009_0400 «Consola a zero
 * avisos» (Onada 6, requisit 10): quatre SKILL.md i les dues projeccions del
 * catàleg de skills.
 *
 * NO EXECUTAT. L'ha escrit Claude (Opus 5.5) el 261009 en una sessió on el hook
 * no deixa córrer node sobre res que no siga una prova. Les peces pures
 * (substitucions, ocurrencies, aplicaCanvis, estat i sensibles) tenen prova a
 * src/sections/consola/laboratori261009.test.js; catalegSuperposat, preparaPla,
 * la Petorreta i les ordres del Reflex, no. Seguix pas per pas el model provat del 261006
 * (261006_0300_ledger_claude/t2_t5_skills/prepara-pla.mjs) i n'hereta les
 * ordres del Reflex (open, seal i executor). Abans de fiar-vos-en, `comprova` ha
 * de passar sense errors i la revisió del pla imprés ha de quadrar amb el
 * LLEGIU_PRIMER.
 *
 * Diferència amb el model: no hi ha BASES de sha256 fixades a mà (esta sessió no
 * podia calcular-les). La CAS és doble:
 *  1. Cada canvi de nous/substitucions.json és una substitució exacta sobre els
 *     bytes del disc: el text «abans» ha d'aparéixer exactament una vegada. Si no
 *     hi és i «despres» sí, el canvi ja està aplicat; qualsevol altra cosa és
 *     deriva i el pla es nega (algú ha tocat el fitxer: refeu el paquet).
 *  2. El pla porta el sha256 del fitxer tal com és en preparar-lo (`before`), i
 *     executor-mutacio el torna a comprovar en executar (validatePlan, CAS).
 * Les dues projeccions del catàleg (.agents/manifest.yaml i
 * .agents/skills/00_INDEX_SKILLS.md) es calculen amb l'inventari() i les
 * projeccions() reals de tooling/brain/cataleg_skills.mjs sobre una còpia mínima
 * de .agents/ a os.tmpdir() amb el paquet superposat (catalegSuperposat, com el
 * model). Entren al pla només si canvien.
 *
 * El segell de skills no va al pla: executor-mutacio.mjs el recalcula sobre el
 * disc resultant i el desa amb la transacció (executor-mutacio.mjs:75-87), i
 * validatePlan rebutja .agents/SKILLS_SEAL.json com a target.
 *
 * Ús (des de l'arrel del repositori; LAB és la carpeta d'este fitxer):
 *   node LAB/prepara-pla.mjs comprova [--session=ID]   # resum, deriva i ordres
 *   node LAB/prepara-pla.mjs [pla] [--session=ID]      # pla JSON per stdout
 *   node LAB/prepara-pla.mjs petorreta --session=ID    # Petorreta del bootstrap per stdout
 *   node LAB/prepara-pla.mjs manifest                  # context.json del bootstrap per stdout
 * L'única escriptura és la còpia temporal de catalegSuperposat, que es retira.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const LAB = path.dirname(fileURLToPath(import.meta.url));
/** LAB és _wiki_de_poble/04_escriptori/02_investigacio_ia/261009_0400_consola_claude: quatre nivells. */
export const ARREL = path.resolve(LAB, '../../../..');
export const REL_LAB = '_wiki_de_poble/04_escriptori/02_investigacio_ia/261009_0400_consola_claude';
export const NOUS = path.join(LAB, 'nous');
export const SESSIO_ZERO = '00000000-0000-4000-8000-000000000000';
export const INTENT = 'Paquet 261009_0400 Consola a zero avisos: frontmatter de core-llegibilitat-text i core-higiene-escriptori, disparadors de sdp-clon-loiverse, prosa de core-maquetacio-markdown i projeccions del cataleg, amb executor-mutacio';
export const LLEGIU = `${REL_LAB}/LLEGIU_PRIMER.txt`;
export const NOM_PETORRETA = '261009_0400_PROMPT_quatre_skills_i_cataleg_cap_a_zero_avisos.md';
/** Prefix de l'operationId del pla: el marcador que l'executor deixa a .agents/seal-transactions/. */
export const OPERACIO = 'sdp-consola-zero-avisos-261009-';
const TRANSACCIONS = '.agents/seal-transactions';
const US = `Ús: ${REL_LAB}/prepara-pla.mjs [pla|comprova|petorreta|manifest] [--session=ID]`;

export const sha = (valor) => createHash('sha256').update(valor).digest('hex');

// Mateixos patrons que el model (reflex_petorreta.mjs, SENSITIVE_PATTERNS): si casen, el seal fallaria.
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

/** Les substitucions del paquet (nous/substitucions.json), validades. */
export function substitucions(nous = NOUS) {
  const brut = JSON.parse(fs.readFileSync(path.join(nous, 'substitucions.json'), 'utf8'));
  if (brut?.schema !== 'sdp.consola.substitucions.v1' || !Array.isArray(brut.fitxers) || !brut.fitxers.length) {
    throw new Error('nous/substitucions.json no té la forma sdp.consola.substitucions.v1');
  }
  return brut.fitxers.map((f) => {
    rutaSegura(f.ruta);
    if (!/^\.agents\/skills\/[a-z0-9-]+\/SKILL\.md$/.test(f.ruta)) throw new Error(`Este paquet només toca SKILL.md: ${f.ruta}`);
    if (!Array.isArray(f.canvis) || !f.canvis.length) throw new Error(`${f.ruta}: cap canvi`);
    for (const c of f.canvis) {
      if (typeof c.abans !== 'string' || !c.abans || typeof c.despres !== 'string' || c.abans === c.despres) {
        throw new Error(`${f.ruta}: un canvi sense «abans» o «despres», o amb els dos iguals`);
      }
    }
    return f;
  });
}

/** Quantes vegades apareix `agulla` dins de `text` (sense solapar). */
export function ocurrencies(text, agulla) {
  let n = 0;
  for (let i = text.indexOf(agulla); i !== -1; i = text.indexOf(agulla, i + agulla.length)) n += 1;
  return n;
}

/**
 * Aplica els canvis d'un fitxer sobre el seu text. Torna { contingut, aplicats,
 * pendents } o llança si un canvi no es pot aplicar sense ambigüitat (deriva).
 */
export function aplicaCanvis(ruta, original, canvis) {
  let text = original;
  let aplicats = 0;
  let pendents = 0;
  for (const [i, c] of canvis.entries()) {
    const n = ocurrencies(text, c.abans);
    if (n === 1) { text = text.replace(c.abans, () => c.despres); pendents += 1; continue; }
    if (n === 0 && ocurrencies(text, c.despres) >= 1) { aplicats += 1; continue; }
    throw new Error(`${ruta}, canvi ${i + 1}: el text «abans» hi és ${n} vegades i el «despres» ${ocurrencies(text, c.despres)}. Algú ha tocat el fitxer: refeu el paquet, no el forceu.`);
  }
  return { contingut: text, aplicats, pendents };
}

/**
 * Estat de cada SKILL.md del paquet contra el disc: `pendent`, `aplicat` (tots
 * els canvis ja hi són) o `deriva` (amb el motiu). `nous` diu si la còpia de
 * lectura de nous/ (si n'hi ha) coincidix amb el contingut que eixiria. Només llig.
 */
export function estat(root = ARREL, { nous = NOUS } = {}) {
  return substitucions(nous).map((f) => {
    const abs = path.join(root, f.ruta);
    if (!fs.existsSync(abs)) return { ruta: f.ruta, estat: 'deriva', motiu: 'el fitxer no és al disc' };
    const bytes = fs.readFileSync(abs);
    const original = bytes.toString('utf8');
    let resultat;
    try { resultat = aplicaCanvis(f.ruta, original, f.canvis); } catch (e) {
      return { ruta: f.ruta, estat: 'deriva', motiu: e.message, before: sha(bytes) };
    }
    const lectura = path.join(nous, `${f.ruta}.txt`);
    const copia = fs.existsSync(lectura) ? fs.readFileSync(lectura, 'utf8') : null;
    return {
      ruta: f.ruta,
      before: sha(bytes),
      contingut: resultat.contingut,
      estat: resultat.pendents ? 'pendent' : 'aplicat',
      avisos: f.avisos ?? [],
      nous: copia === null ? 'sense còpia de lectura' : copia === resultat.contingut ? 'coincidix' : 'DIFERIX'
    };
  });
}

/** Fonts que inventari() exigix fora de les skills (cataleg_skills.mjs:68). */
const FONTS_CATALEG = Object.freeze(['.agents/PROFILE.md', '.agents/AGENTS.md', '.agents/BASELINE.md', '.agents/consell.json']);
const SKILL_DE = (ruta) => /^\.agents\/skills\/([^/]+)\/SKILL\.md$/.exec(ruta)?.[1] ?? null;

/**
 * Catàleg que quedaria al disc després d'aplicar el pla (model: catalegSuperposat
 * del 261006). Torna { skills, projeccions: [[ruta, text]], xocs, error }.
 */
export async function catalegSuperposat(root, desitjat) {
  const { inventari, projeccions } = await import(pathToFileURL(path.join(root, 'tooling/brain/cataleg_skills.mjs')).href);
  const tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-cataleg-261009-')));
  try {
    const dirSkills = path.join(root, '.agents/skills');
    fs.mkdirSync(path.join(tmp, '.agents/skills'), { recursive: true });
    for (const e of fs.readdirSync(dirSkills, { withFileTypes: true })) {
      const desti = path.join(tmp, '.agents/skills', e.name);
      // Un symlink es reproduïx tal qual perquè inventari() es negue igual que sobre el disc.
      if (e.isSymbolicLink()) { fs.symlinkSync(fs.readlinkSync(path.join(dirSkills, e.name)), desti); continue; }
      if (!e.isDirectory()) continue;
      fs.mkdirSync(desti);
      const ruta = `.agents/skills/${e.name}/SKILL.md`;
      if (desitjat.has(ruta)) fs.writeFileSync(path.join(desti, 'SKILL.md'), desitjat.get(ruta));
      else if (fs.existsSync(path.join(root, ruta))) fs.copyFileSync(path.join(root, ruta), path.join(desti, 'SKILL.md'));
    }
    for (const ruta of FONTS_CATALEG) if (fs.existsSync(path.join(root, ruta))) fs.copyFileSync(path.join(root, ruta), path.join(tmp, ruta));

    let skills;
    try { skills = inventari(tmp); } catch (e) {
      return { skills: 0, projeccions: [], xocs: [], error: String(e.message).replaceAll(`${tmp}/`, '') };
    }
    const propis = new Set([...desitjat.keys()].map(SKILL_DE).filter(Boolean));
    const xocs = [];
    for (const s of skills.filter((x) => propis.has(x.id))) {
      for (const t of s.triggers) {
        for (const o of skills) {
          if (o.id === s.id) continue;
          for (const u of o.triggers) {
            const [a, b] = [t.toLowerCase(), u.toLowerCase()];
            if (a.includes(b) || b.includes(a)) xocs.push(`${s.id} «${t}» ↔ ${o.id} «${u}»`);
          }
        }
      }
    }
    return { skills: skills.length, projeccions: [...projeccions(skills)], xocs, error: null };
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

/** Transacció acceptada d'este paquet, o null (l'executor la deixa en estat `accepted`). */
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

/** Directori o fitxer existent més pròxim de cada target, sense scopes niats (model, línies 286-293). */
export function scopesDe(root, targets) {
  const crus = [...new Set(targets.map((ruta) => {
    let r = ruta;
    while (r !== '.' && !fs.existsSync(path.join(root, r))) r = path.posix.dirname(r);
    return r;
  }))];
  return crus.filter((s) => !crus.some((o) => o !== s && (o === '.' || s.startsWith(`${o}/`)))).sort();
}

/** Línies de diferència d'una projecció (les que falten i les que sobren), per a revisar-la. */
function diferencia(abans, despres) {
  const [a, d] = [(abans ?? '').split('\n'), despres.split('\n')];
  return { entren: d.filter((l) => !a.includes(l)), ixen: a.filter((l) => !d.includes(l)) };
}

/** Pla dels fitxers pendents i de les projeccions que canvien, validat amb el validatePlan de l'executor. Cap escriptura. */
export async function preparaPla(root = ARREL, { sessio = SESSIO_ZERO, validar = true } = {}) {
  const feta = transaccio(root);
  if (feta) throw new Error(`Paquet 261009_0400 ja aplicat per la transacció ${feta.id} (${TRANSACCIONS}/). No es torna a aplicar: arxiveu el laboratori.`);
  const fitxers = estat(root);
  const deriva = fitxers.filter((f) => f.estat === 'deriva');
  if (deriva.length) throw new Error(deriva.map((f) => `${f.ruta}: ${f.motiu}`).join('\n'));
  const desitjat = new Map(fitxers.map((f) => [f.ruta, f.contingut]));
  const cataleg = await catalegSuperposat(root, desitjat);
  if (cataleg.error) throw new Error(`El catàleg no seria vàlid després d'aplicar el pla: ${cataleg.error}`);
  if (cataleg.xocs.length) throw new Error(`Disparadors que xoquen (persona_router.mjs dispara per subcadena):\n${cataleg.xocs.join('\n')}`);
  const projeccions = [];
  for (const [ruta, text] of cataleg.projeccions) {
    const abs = path.join(root, ruta);
    const disc = fs.existsSync(abs) ? fs.readFileSync(abs) : null;
    if (disc !== null && disc.toString('utf8') === text) continue;
    projeccions.push({ ruta, before: disc === null ? null : sha(disc), contingut: text, ...diferencia(disc?.toString('utf8') ?? null, text) });
  }
  const pendents = [...fitxers.filter((f) => f.estat === 'pendent'), ...projeccions];
  if (!pendents.length) throw new Error('Res a aplicar: el disc ja és el del paquet. Arxiveu el laboratori.');
  const plan = {
    schema: 'sdp.mutation.v1',
    session: sessio,
    operationId: `${OPERACIO}${sessio.slice(0, 8)}`,
    files: pendents.map((f) => ({ path: f.ruta, before: f.before, content: f.contingut }))
  };
  if (validar) {
    const { validatePlan } = await import(pathToFileURL(path.join(root, 'tooling/gates/executor-mutacio.mjs')).href);
    validatePlan(fs.realpathSync(root), plan);
  }
  const targets = pendents.map((f) => f.ruta);
  return { plan, scopes: scopesDe(root, targets), targets, fitxers, projeccions, cataleg: { skills: cataleg.skills } };
}

/** Manifest del bootstrap: el LLEGIU_PRIMER del laboratori. */
export function manifest() {
  const sources = [
    { path: LLEGIU, reason: 'Què canvia el paquet 261009_0400 per a deixar la Consola a zero avisos, quin avís lleva cada canvi, com s’aplica i les decisions del Mestre.', classification: 'internal', role: 'reference' }
  ];
  return `${JSON.stringify({ sources }, null, 2)}\n`;
}

/** La Petorreta mecànica de la sessió (forma del model del 261006). */
export function construeixPetorreta({ sessio, intentSha256, rulesSha256, planSha256, targets }) {
  return `---
type: prompt
status: esborrany
description: Petorreta del Reflex per al paquet 261009_0400 de la Consola a zero avisos, aplicat amb executor-mutacio i lease del Mestre.
---
# Consola a zero avisos 261009: quatre skills i les projeccions del catàleg

Reflex-Session: ${sessio}
Intent-SHA256: ${intentSha256}
Rules-SHA256: ${rulesSha256}
Plan-SHA256: ${planSha256}

## Context

El Mapa de la Consola (GET /__iaia/mapa.json) portava 36 avisos de deu causes el 261009. L'Onada 6 va corregir a src/ els avisos falsos del compilador; la resta són governança. Este paquet en lleva set de quatre skills: el frontmatter invàlid de core-llegibilitat-text i de core-higiene-escriptori, el contracte trencat de core-llegibilitat-text, els disparadors buits de sdp-clon-loiverse i la menció d'un esborrany a core-maquetacio-markdown. Les substitucions viuen al laboratori ${REL_LAB}/nous/substitucions.json.

## Tasques

- core-llegibilitat-text: tags del vocabulari tancat i contracte.llig cap al reglament de Pedra Seca.
- core-higiene-escriptori: description de 203 caràcters.
- sdp-clon-loiverse: triggers_on, sense cap xoc amb els disparadors de les altres skills.
- core-maquetacio-markdown: l'esborrany core-redaccio es diu pel nom del seu fitxer.
- .agents/manifest.yaml i .agents/skills/00_INDEX_SKILLS.md: les projeccions que genera cataleg_skills.mjs.
- El segell de skills el recalcula l'executor en acabar.

Fitxers del pla (${targets.length}): ${targets.join(', ')}.

## Riscos

- Entre el seal i l'executor no pot canviar res del repositori.
- Si un altre paquet toca una d'estes SKILL.md (el de neteja de l'Onada 6 reescriu core-higiene-escriptori), el pla es nega per deriva i s'ha de refer.
- Si l'executor falla a mitges, el pending bloqueja noves mutacions fins a una reconciliació revisada.

## Criteris d'acceptació

- L'executor torna valid:true i deixa una transacció a .agents/seal-transactions amb operationId ${OPERACIO}.
- node tooling/brain/cataleg_skills.mjs --check ix amb 0 i node tooling/gates/segella.mjs diu que el segell és intacte.
- npm run skills:index refà l'índex del router i node tooling/brain/mapa-consola.mjs ja no porta cap avís d'estes quatre skills.
`;
}

function llegeixSessio(root, sessio) {
  if (!/^[0-9a-f-]{36}$/i.test(sessio ?? '')) throw new Error(`Cal --session=ID (el que ha imprés open). ${US}`);
  const s = JSON.parse(fs.readFileSync(path.join(root, '.sdp-reflex/sessions', `${sessio}.json`), 'utf8'));
  if (s.status !== 'open') throw new Error(`La sessió no està oberta: ${s.status}`);
  if (!s.operations?.includes('governance-write') || s.risk !== 'high') throw new Error('La sessió ha de ser --risk=high amb --operation=governance-write');
  return s;
}

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
  const { plan, scopes, targets, fitxers, projeccions, cataleg } = await preparaPla(root, { sessio: sessio ?? SESSIO_ZERO });
  console.log(`Pla vàlid: ${targets.length} fitxers, ${Buffer.byteLength(JSON.stringify(plan))} bytes.`);
  for (const f of fitxers) {
    console.log(`  ${f.estat === 'pendent' ? 'M' : '='} ${f.ruta} · lleva ${f.avisos.join(', ') || '—'} · còpia de nous/: ${f.nous}`);
  }
  for (const p of projeccions) {
    console.log(`  ${p.before ? 'M' : 'A'} ${p.ruta} · entren ${p.entren.length} línies, ixen ${p.ixen.length}`);
    for (const l of p.entren.slice(0, 6)) console.log(`      + ${l.slice(0, 160)}`);
    for (const l of p.ixen.slice(0, 6)) console.log(`      - ${l.slice(0, 160)}`);
  }
  console.log(`Catàleg: ${cataleg.skills} skills, cap disparador del paquet xoca.`);
  if (!sessio) {
    console.log('');
    console.log("Ordre d'open (vegeu el LLEGIU_PRIMER, §3):");
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
  else if (ordre === 'manifest') process.stdout.write(manifest());
  else throw new Error(US);
}

// La guarda que no salta mai és `file://${argv[1]}`: l'arrel té espais (memòria del projecte).
function esEntrada() {
  try { return Boolean(process.argv[1]) && pathToFileURL(fs.realpathSync(process.argv[1])).href === import.meta.url; }
  catch { return false; }
}
if (esEntrada()) {
  main(process.argv.slice(2)).catch((e) => { console.error(`[prepara-pla] ${e.message}`); process.exitCode = 1; });
}
