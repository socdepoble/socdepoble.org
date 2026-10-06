#!/usr/bin/env node
/**
 * prepara-pla.mjs — pla sdp.mutation.v1 del paquet 261006 «Catàleg de skills»
 * (encàrrecs T2 i T5 del prompt 261006_0224: frontmatter canònic de
 * core-comprensio-reflexiva i core-tecniques-investigacio, skill nova
 * core-maquetacio-markdown i les dues projeccions del catàleg).
 *
 * Seguix el model de 261006_0055_olivera_ancores_opus/prepara-pla.mjs, sense git:
 * cada original es contrasta amb el sha256 que tenia quan es va preparar el paquet
 * (BASES). Si el disc ja no és eixe, deriva i el pla es nega: una còpia sencera
 * tornaria enrere en silenci un canvi d'una altra mà. Un fitxer que ja és idèntic
 * al de nous/ està aplicat i ix del pla. Quan l'executor ja ha deixat la transacció
 * acceptada del paquet (operationId `sdp-skills-cataleg-261006-*`), el pla es nega.
 *
 * La CAS de BASES només vigila els fitxers que el pla sobreescriu. Les dues
 * projeccions del catàleg (manifest.yaml i 00_INDEX_SKILLS.md) citen també les
 * altres 30 skills, que el pla no toca. Per això, abans d'emetre el pla, es passa
 * l'inventari() i les projeccions() reals de cataleg_skills.mjs sobre el disc amb el
 * paquet superposat (catalegSuperposat): si una altra skill ha canviat la
 * description, el catàleg no seria vàlid o un disparador del paquet xoca amb un
 * altre, el pla es nega per deriva del catàleg.
 *
 * El segell de skills no va al pla: executor-mutacio.mjs el recalcula sobre el disc
 * resultant i el desa amb la transacció (executor-mutacio.mjs:75-87), i
 * validatePlan rebutja .agents/SKILLS_SEAL.json com a target (línia 27).
 *
 * Flux de la lease: open → bootstrap → seal → executor. No escriu cap fitxer del
 * repositori: el que cal deixar a .sdp-reflex/plans/ i al bootstrap ho escriu per
 * stdout, i la redirecció la fa el Mestre amb les ordres que imprimix
 * `comprova --session=ID`. L'única escriptura és la còpia mínima de `.agents/` que
 * catalegSuperposat munta a os.tmpdir() i retira en acabar.
 *
 * Ús (des de l'arrel del repositori; LAB és la carpeta d'este fitxer):
 *   node LAB/prepara-pla.mjs [pla] [--session=ID]      # pla JSON per stdout
 *   node LAB/prepara-pla.mjs comprova [--session=ID]   # resum, deriva, precondició i ordre d'open
 *   node LAB/prepara-pla.mjs petorreta --session=ID    # Petorreta del bootstrap per stdout
 *   node LAB/prepara-pla.mjs manifest                  # context.json del bootstrap per stdout
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const LAB = path.dirname(fileURLToPath(import.meta.url));
/** LAB és a _wiki_de_poble/04_escriptori/02_investigacio_ia/261006_0300_ledger_claude/t2_t5_skills: cinc nivells. */
export const ARREL = path.resolve(LAB, '../../../../..');
export const REL_LAB = '_wiki_de_poble/04_escriptori/02_investigacio_ia/261006_0300_ledger_claude/t2_t5_skills';
export const NOUS = path.join(LAB, 'nous');
export const SESSIO_ZERO = '00000000-0000-4000-8000-000000000000';
/** Commit on es va preparar el paquet: cap dels originals tenia canvis sense commit. */
export const HEAD = '76947e5d';
/** sha256 de cada original a HEAD. És la base de la CAS de l'executor (`before`). La skill nova no hi és: naix amb before null. */
export const BASES = Object.freeze({
  '.agents/manifest.yaml': 'a59d1cc2aa1787b408cd68f8736f4f06bf6c83496139da239197824cac7ce476',
  '.agents/skills/00_INDEX_SKILLS.md': '003f85a67dd7e609e6dbd41642b315b862f08d7a18bab26af4ccc6ebc18e9d1d',
  '.agents/skills/core-comprensio-reflexiva/SKILL.md': '4f25cfbf361a25e9d929634a0fcede2e227c6393a9551e9a5666211d91684b66',
  '.agents/skills/core-tecniques-investigacio/SKILL.md': '9920f3bfc8cd39b520219f384eb9195805a22259cb0b96efb8c9c02367891da8',
});
/**
 * Skills reparades (T2): l'encàrrec només en canvia el frontmatter. Del fitxer de
 * nous/ el pla en pren només el frontmatter i hi enganxa el cos del disc byte a
 * byte, protegit per la CAS de BASES. La SKILL.md.txt de nous/ és la versió completa
 * per a llegir-la, però no porta els dos espais finals de les línies 9 i 12 de
 * core-tecniques-investigacio, que l'editor de la sessió no conserva.
 */
export const NOMES_FRONTMATTER = Object.freeze(['.agents/skills/core-comprensio-reflexiva/SKILL.md', '.agents/skills/core-tecniques-investigacio/SKILL.md']);

/** Separa el frontmatter (amb els dos delimitadors i el salt final) del cos, sense tocar cap byte. */
export function partix(text) {
  const m = /^---\n[\s\S]*?\n---\n/.exec(text);
  if (!m) throw new Error('Sense frontmatter tancat a la primera línia');
  return { frontmatter: m[0], cos: text.slice(m[0].length) };
}

/** Contingut que ha de quedar al disc: el de nous/, o el frontmatter de nous/ amb el cos del disc per a les reparades. */
export function contingutDesitjat(ruta, nou, original) {
  if (!NOMES_FRONTMATTER.includes(ruta) || original === null) return nou;
  return partix(nou).frontmatter + partix(original).cos;
}
export const INTENT = 'Paquet 261006 Cataleg de skills: frontmatter canonic de core-comprensio-reflexiva i core-tecniques-investigacio, skill nova core-maquetacio-markdown i projeccions del cataleg, amb executor-mutacio';
export const LLEGIU = `${REL_LAB}/LLEGIU_PRIMER.txt`;
export const FLUX = `${REL_LAB}/FLUX_APROVACIO.md.txt`;
export const NOM_PETORRETA = '261006_0300_PROMPT_frontmatter_canonic_de_dues_skills_i_skill_nova_de_maquetacio.md';
/** Prefix de l'operationId del pla: el marcador que l'executor deixa a .agents/seal-transactions/. */
export const OPERACIO = 'sdp-skills-cataleg-261006-';
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
    const abs = path.join(root, f.ruta);
    const original = fs.existsSync(abs) ? fs.readFileSync(abs) : null;
    const actual = original === null ? null : sha(original);
    const contingut = contingutDesitjat(f.ruta, fs.readFileSync(path.join(nous, f.nou), 'utf8'), original === null ? null : original.toString('utf8'));
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

/** Les dues projeccions de cataleg_skills.mjs (projeccions(), línies 71-86). */
export const PROJECCIONS = Object.freeze(['.agents/manifest.yaml', '.agents/skills/00_INDEX_SKILLS.md']);
/** Fonts que inventari() exigix fora de les skills (cataleg_skills.mjs:68). */
const FONTS_CATALEG = Object.freeze(['.agents/PROFILE.md', '.agents/AGENTS.md', '.agents/BASELINE.md', '.agents/consell.json']);
const SKILL_DE = (ruta) => /^\.agents\/skills\/([^/]+)\/SKILL\.md$/.exec(ruta)?.[1] ?? null;

/**
 * Catàleg que quedaria al disc després d'aplicar el pla, calculat amb l'inventari() i
 * les projeccions() reals de cataleg_skills.mjs, les mateixes que farà `--check`.
 * Munta a os.tmpdir() una còpia mínima de `.agents/`: cada carpeta de skills del disc
 * amb la seua SKILL.md, les del paquet superposades (contingut desitjat de `estat`)
 * i les quatre fonts de la línia 68. Després la retira.
 * Torna { skills, divergencies, xocs, error }:
 *  - divergencies: projecció de nous/ diferent de la que generaria el catàleg, amb
 *    les línies que falten i les que sobren;
 *  - xocs: disparador d'una skill del paquet que conté o és contingut per un
 *    d'una altra skill (persona_router.mjs:60 dispara per subcadena);
 *  - error: missatge d'inventari() si el catàleg resultant no és vàlid.
 */
export async function catalegSuperposat(root, fitxers) {
  const { inventari, projeccions } = await import(pathToFileURL(path.join(root, 'tooling/brain/cataleg_skills.mjs')).href);
  const desitjat = new Map(fitxers.map((f) => [f.ruta, f.contingut]));
  const tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-cataleg-261006-')));
  try {
    const dirSkills = path.join(root, '.agents/skills');
    fs.mkdirSync(path.join(tmp, '.agents/skills'), { recursive: true });
    const alDisc = new Set();
    for (const e of fs.readdirSync(dirSkills, { withFileTypes: true })) {
      const desti = path.join(tmp, '.agents/skills', e.name);
      // Un symlink es reproduïx tal qual perquè inventari() es negue igual que sobre el disc.
      if (e.isSymbolicLink()) { fs.symlinkSync(fs.readlinkSync(path.join(dirSkills, e.name)), desti); continue; }
      if (!e.isDirectory()) continue;
      alDisc.add(e.name);
      fs.mkdirSync(desti);
      const ruta = `.agents/skills/${e.name}/SKILL.md`;
      if (desitjat.has(ruta)) fs.writeFileSync(path.join(desti, 'SKILL.md'), desitjat.get(ruta));
      else if (fs.existsSync(path.join(root, ruta))) fs.copyFileSync(path.join(root, ruta), path.join(desti, 'SKILL.md'));
    }
    for (const [ruta, text] of desitjat) {
      const nom = SKILL_DE(ruta);
      if (nom && !alDisc.has(nom)) {
        fs.mkdirSync(path.join(tmp, '.agents/skills', nom));
        fs.writeFileSync(path.join(tmp, ruta), text);
      }
    }
    for (const ruta of FONTS_CATALEG) if (fs.existsSync(path.join(root, ruta))) fs.copyFileSync(path.join(root, ruta), path.join(tmp, ruta));

    let skills;
    try { skills = inventari(tmp); } catch (e) { return { skills: 0, divergencies: [], xocs: [], error: String(e.message).replaceAll(`${tmp}/`, '') }; }

    const divergencies = [];
    for (const [ruta, generada] of projeccions(skills)) {
      const abs = path.join(root, ruta);
      const esperada = desitjat.has(ruta) ? desitjat.get(ruta) : (fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null);
      if (esperada === generada) continue;
      const [g, e] = [generada.split('\n'), (esperada ?? '').split('\n')];
      divergencies.push({ ruta, falten: g.filter((l) => !e.includes(l)), sobren: e.filter((l) => !g.includes(l)) });
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
    return { skills: skills.length, divergencies, xocs, error: null };
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

/** Text de la negativa per deriva del catàleg, o null si el catàleg resultant és el de nous/. */
export function derivaCataleg(cataleg) {
  const curta = (linies) => linies.slice(0, 4).map((l) => l.slice(0, 140)).join(' | ') || '(cap)';
  const problemes = [
    ...(cataleg.error ? [`el catàleg no seria vàlid després d'aplicar el pla: ${cataleg.error}`] : []),
    ...cataleg.divergencies.map((d) => `${d.ruta}: nous/ no és la projecció que generaria cataleg_skills.mjs amb les skills del disc i el paquet superposat. Hi falta: ${curta(d.falten)}. Hi sobra: ${curta(d.sobren)}.`),
    ...cataleg.xocs.map((x) => `disparador que xoca: ${x}`),
  ];
  if (!problemes.length) return null;
  return `Deriva del catàleg: alguna skill fora del pla ha canviat des de ${HEAD}. Refés el paquet (projeccions de nous/ i, si cal, BASES); no el forces.\n${problemes.join('\n')}`;
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
 * explícita al frontend»): una skill nova no és efectiva abans que el Mestre aprove
 * des de la Wiki el document que n'explica el flux. Este script no ho pot
 * comprovar: ho recorda abans de l'ordre d'open.
 */
export const PRECONDICIO_WIKI = Object.freeze([
  "Precondició (lliçó 261002 de wiki-documentacio-i-reflex): abans d'este open, MarIA promou a la Wiki",
  `${FLUX} (què fa core-maquetacio-markdown, quan es dispara, què no fa i com es desactiva)`,
  "i el Mestre l'aprova des de la pàgina. Sense eixa aprovació no es fa l'open: la skill no pot ser efectiva abans.",
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

/** Directori o fitxer existent més pròxim de cada target, sense scopes niats: el Reflex només admet scopes que existixen. */
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
  if (feta) throw new Error(`Paquet 261006 Catàleg de skills ja aplicat per la transacció ${feta.id} (${TRANSACCIONS}/). No es torna a aplicar: arxiveu el laboratori.`);
  const fitxers = estat(root);
  const deriva = fitxers.filter((f) => f.estat === 'deriva');
  if (deriva.length) throw new Error(deriva.map((f) => `${f.ruta}: ${f.motiu}`).join('\n'));
  const pendents = fitxers.filter((f) => f.estat === 'pendent');
  if (!pendents.length) throw new Error('Res a aplicar: tots els fitxers de nous/ ja són al disc. Arxiveu el laboratori.');
  const cataleg = await catalegSuperposat(root, fitxers);
  const negativa = derivaCataleg(cataleg);
  if (negativa) throw new Error(negativa);
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
  return { plan, scopes: scopesDe(root, targets), targets, aplicats: fitxers.filter((f) => f.estat === 'aplicat').map((f) => f.ruta), cataleg: { skills: cataleg.skills } };
}

/** Manifest del bootstrap: el LLEGIU_PRIMER i el flux d'aprovació del laboratori. */
export function manifest() {
  const sources = [
    { path: LLEGIU, reason: 'Què canvia el paquet 261006 del catàleg de skills, per què, com s’aplica, decisions del Mestre i límits declarats.', classification: 'internal', role: 'reference' },
    { path: FLUX, reason: 'Flux de la skill nova core-maquetacio-markdown per a l’aprovació del Mestre a la Wiki.', classification: 'internal', role: 'reference' },
  ];
  return `${JSON.stringify({ sources }, null, 2)}\n`;
}

/** La Petorreta mecànica de la sessió: prompt editorial amb les marques que el seal exigix. */
export function construeixPetorreta({ sessio, intentSha256, rulesSha256, planSha256, targets }) {
  return `---
type: prompt
status: esborrany
description: Petorreta del Reflex per al paquet 261006 del catàleg de skills, aplicat amb executor-mutacio i lease del Mestre.
---
# Catàleg de skills 261006: frontmatter canònic de dues skills i skill nova de maquetació Markdown

Reflex-Session: ${sessio}
Intent-SHA256: ${intentSha256}
Rules-SHA256: ${rulesSha256}
Plan-SHA256: ${planSha256}

## Context

L'auditoria Opus 261006_0025 (secció 5, CS-01) va trobar el catàleg de skills roig: dues skills afegides sense frontmatter canònic fan llançar l'inventari de tooling/brain/cataleg_skills.mjs (línies 54 i 57), i per això tests/backend_consolidacio.test.mjs dona nou proves roges de catorze i test:ci és roig. El Mestre va ordenar afegir-los el frontmatter (T2) i crear una skill de maquetació Markdown a partir dels errors que va trobar a AGENTS.md (T5). Les versions noves completes viuen al laboratori ${REL_LAB}/nous, provades a tests/laboratori-skills-261006.test.js sobre una còpia del repositori, i cada original es contrasta amb el sha256 que tenia a ${HEAD}.

## Tasques

- core-comprensio-reflexiva i core-tecniques-investigacio: només el frontmatter (type skill, status actiu, name igual que la carpeta, tags del vocabulari tancat i triggers_on únics); el cos queda intacte byte a byte.
- core-maquetacio-markdown: skill nova amb vint-i-dues regles verificables, procediment, llista de comprovació i els errors reals d'AGENTS.md i de l'índex com a casos.
- .agents/manifest.yaml i .agents/skills/00_INDEX_SKILLS.md: les projeccions exactes que genera cataleg_skills.mjs amb les trenta-tres skills.
- El segell de skills el recalcula l'executor en acabar; no cal cap reconciliació manual.

Fitxers del pla (${targets.length}): ${targets.join(', ')}.

## Riscos

- Entre el seal i l'executor no pot canviar res del repositori: el Reflex compara HEAD i l'estat de git sencer.
- Si un altre paquet toca una SKILL.md o una projecció del catàleg abans d'este, el pla es nega per deriva i s'ha de refer.
- Les dues skills reparades continuen sense secció de vincles: la porta de frontmatter les marca (F9) mentre són fitxers modificats, fins que el Mestre decidisca si s'hi afig.
- Si l'executor falla a mitges, el pending bloqueja noves mutacions fins a una reconciliació revisada; no es reintenta a cegues.

## Criteris d'acceptació

- L'executor torna valid:true i deixa una transacció a .agents/seal-transactions amb operationId ${OPERACIO}.
- node --test tests/backend_consolidacio.test.mjs dona catorze de catorze.
- node tooling/brain/cataleg_skills.mjs --check ix amb 0 i node tooling/gates/segella.mjs diu que el segell és intacte amb el hash nou.
- npm run skills:index regenera l'índex del router amb les trenta-tres skills, i el corredor tests/laboratori-skills-261006.test.js es retira en el mateix commit.
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
  const { plan, scopes, targets, aplicats, cataleg } = await preparaPla(root, { sessio: sessio ?? SESSIO_ZERO });
  console.log(`Pla vàlid: ${targets.length} fitxers, ${Buffer.byteLength(JSON.stringify(plan))} bytes.`);
  for (const f of plan.files) console.log(`  ${f.before ? 'M' : 'A'} ${f.path}`);
  for (const r of aplicats) console.log(`  = ${r} (ja aplicat; fora del pla)`);
  console.log(`Catàleg: ${cataleg.skills} skills. Les projeccions de nous/ són les que generaria cataleg_skills.mjs sobre el disc amb el paquet superposat, i cap disparador del paquet xoca.`);
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
