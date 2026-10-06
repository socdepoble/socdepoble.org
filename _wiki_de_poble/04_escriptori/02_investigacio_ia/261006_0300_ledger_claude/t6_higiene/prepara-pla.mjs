#!/usr/bin/env node
/**
 * prepara-pla.mjs — pla sdp.mutation.v1 del paquet 261006 «Higiene T6»
 * (front T6b del Mestre: per què l'orquestradora no neteja l'Escriptori per
 * iniciativa pròpia). Peces: el hook d'Antigravity (briefing de taula amb tots
 * els declarats vius al primer crit de cada conversa, guarda de l'índex contra
 * l'escriptura per shell o per scripts ad hoc, guarda de 90_arxiu_historic i
 * motiu de cada injecció a la traça), les seues proves, i dues skills:
 * core-higiene-escriptori 3.4.0 (moments fixos de la neteja i les ordres del
 * paquet 261006_0055) i core-identitat (pas 5 de l'arrencada).
 *
 * Còpia adaptada del de 261006_0055_olivera_ancores_opus, sense git: cada original
 * es contrasta amb el sha256 que tenia a HEAD quan es va preparar el paquet
 * (BASES). Si el disc ja no és eixe, deriva i el pla es nega: una còpia sencera
 * tornaria enrere en silenci un canvi d'una altra mà. Un fitxer que ja és idèntic
 * al de nous/ està aplicat i ix del pla. Quan l'executor ja ha deixat la
 * transacció acceptada del paquet (operationId `sdp-higiene-t6-261006-*`), el pla
 * es nega.
 *
 * Dues dependències, comprovades i no suposades:
 *   · El paquet 261006_0055 ha d'estar aplicat: la skill 3.4.0 mana --repara,
 *     --renomena, --sessio i --nom de qualsevol extensió, que només existixen amb
 *     ell. Sense el 0055, el pla es nega (una skill que mana banderes que la porta
 *     no coneix fabrica «Argument desconegut»).
 *   · El catàleg de skills: la description nova de core-higiene-escriptori es
 *     projecta a .agents/skills/00_INDEX_SKILLS.md. Si el catàleg carrega (després
 *     del paquet T2, t2_t5_skills), la projecció entra al pla amb la seua CAS; si
 *     no carrega (CS-01 a HEAD), el pla avisa i no la porta.
 *
 * Seguix el flux de la lease: open → bootstrap → seal → executor. No escriu cap
 * fitxer del repositori: el que cal deixar a .sdp-reflex/plans/ i al bootstrap ho
 * escriu per stdout, i la redirecció `>` la fa el Mestre amb les ordres que
 * imprimix `comprova --session=ID`. L'única escriptura és una còpia mínima de
 * .agents/ a os.tmpdir() per a calcular la projecció del catàleg, que es retira.
 *
 * Ús (des de l'arrel del repositori; LAB és la carpeta d'este fitxer):
 *   node LAB/prepara-pla.mjs [pla] [--session=ID]      # pla JSON per stdout
 *   node LAB/prepara-pla.mjs comprova [--session=ID]   # resum, deriva, dependències, precondició i ordre d'open
 *   node LAB/prepara-pla.mjs petorreta --session=ID    # Petorreta del bootstrap per stdout
 *   node LAB/prepara-pla.mjs manifest                  # context.json del bootstrap per stdout
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const LAB = path.dirname(fileURLToPath(import.meta.url));
export const ARREL = path.resolve(LAB, '../../../../..');
export const REL_LAB = '_wiki_de_poble/04_escriptori/02_investigacio_ia/261006_0300_ledger_claude/t6_higiene';
export const NOUS = path.join(LAB, 'nous');
export const SESSIO_ZERO = '00000000-0000-4000-8000-000000000000';
/** Commit on es va preparar el paquet: cap dels originals tenia canvis sense commit. */
export const HEAD = '76947e5d';
/** sha256 de cada original a HEAD. És la base de la CAS de l'executor (`before`). */
export const BASES = Object.freeze({
  '.agents/skills/core-higiene-escriptori/SKILL.md': 'f189e004beb30c04ead911f9b74e1ed81798f7d562678a8474387b7c9a1912c3',
  '.agents/skills/core-identitat/SKILL.md': '11fc2c9705fa8b6b64ec3ec80ea01a49df3146c660f887a2693176af83c840d2',
  'tests/antigravity-hook.test.mjs': 'defc759b88b04dd93b7300ee2d34825db95c4d1189fc81579599d63e9aa144ab',
  'tooling/gates/antigravity-hook.mjs': 'c79c0801c571755a7c9b553556564c0d263a5f0d2ecd7e37e5562a4e44382ed3',
});
/** Projeccions del catàleg que la description nova pot canviar (cataleg_skills.mjs, projeccions()). */
export const PROJECCIONS = Object.freeze(['.agents/manifest.yaml', '.agents/skills/00_INDEX_SKILLS.md']);
export const INTENT = 'Paquet 261006 Higiene T6: briefing de taula del hook Antigravity amb tots els declarats vius, guarda de l index i de l arxiu, traca del motiu de cada injeccio, proves, i les skills core-higiene-escriptori i core-identitat amb els moments fixos de la neteja, amb executor-mutacio';
export const LLEGIU = `${REL_LAB}/LLEGIU_PRIMER.txt`;
export const DIAGNOSI = `${REL_LAB}/DIAGNOSI.txt`;
/** reflex_petorreta.mjs:807-812 exigix YYMMDD_HHMM_PROMPT_ i un títol de 8 a 12 paraules: este en té 11. */
export const NOM_PETORRETA = '261006_0300_PROMPT_briefing_de_taula_guarda_de_l_index_i_neteja_amb_executor.md';
/** Prefix de l'operationId del pla: el marcador que l'executor deixa a .agents/seal-transactions/. */
export const OPERACIO = 'sdp-higiene-t6-261006-';
/** El paquet del qual depén la skill 3.4.0. */
export const DEP_0055 = Object.freeze({
  lab: '_wiki_de_poble/04_escriptori/02_investigacio_ia/261006_0055_olivera_ancores_opus',
  operacio: 'sdp-olivera-ancores-261006-',
  fitxer: 'tooling/gates/porta-olivera.mjs',
});
const TRANSACCIONS = '.agents/seal-transactions';
const FONTS_CATALEG = Object.freeze(['PROFILE.md', 'AGENTS.md', 'BASELINE.md', 'consell.json']);
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
    const contingut = fs.readFileSync(path.join(nous, f.nou), 'utf8');
    const abs = path.join(root, f.ruta);
    const original = fs.existsSync(abs) ? fs.readFileSync(abs) : null;
    const actual = original === null ? null : sha(original);
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

/** Primera transacció acceptada amb un prefix d'operationId, o null. Un registre il·legible no compta. */
function transaccioAmb(root, prefix) {
  const dir = path.join(root, TRANSACCIONS);
  if (!fs.existsSync(dir)) return null;
  for (const nom of fs.readdirSync(dir).filter((n) => n.endsWith('.json')).sort()) {
    let t;
    try { t = JSON.parse(fs.readFileSync(path.join(dir, nom), 'utf8')); } catch { continue; }
    if (t?.state === 'accepted' && typeof t.operationId === 'string' && t.operationId.startsWith(prefix) && Array.isArray(t.files)) return t;
  }
  return null;
}

/**
 * Transacció acceptada d'este paquet, o null. L'executor la deixa quan aplica el
 * pla (executor-mutacio.mjs, estat `accepted`), i només llavors.
 */
export function transaccio(root = ARREL) {
  return transaccioAmb(root, OPERACIO);
}

/**
 * El paquet 261006_0055 és aplicat si l'executor n'ha deixat la transacció, o si
 * la porta instal·lada és byte a byte la del seu nous/ (mentre el laboratori hi
 * siga). Només llig.
 */
export function dependencia0055(root = ARREL) {
  const t = transaccioAmb(root, DEP_0055.operacio);
  if (t) return { aplicat: true, motiu: `transacció ${t.id}` };
  const nou = path.join(root, DEP_0055.lab, 'nous', DEP_0055.fitxer);
  const instal = path.join(root, DEP_0055.fitxer);
  if (fs.existsSync(nou) && fs.existsSync(instal) && fs.readFileSync(nou).equals(fs.readFileSync(instal))) {
    return { aplicat: true, motiu: `${DEP_0055.fitxer} és el del laboratori` };
  }
  return {
    aplicat: false,
    motiu: `el paquet 261006_0055 (${DEP_0055.lab}) no està aplicat: ni hi ha cap transacció ${DEP_0055.operacio}* ni ${DEP_0055.fitxer} és el del seu nous/. La skill 3.4.0 mana --repara, --renomena, --sessio i --nom de qualsevol extensió, que només porta eixe paquet. Apliqueu-lo primer`,
  };
}

/**
 * Projecció del catàleg de skills amb el paquet superposat. Munta a os.tmpdir()
 * una còpia mínima de .agents/ (les skills del disc, les de nous/ superposades i
 * les quatre fonts de cataleg_skills.mjs) i hi passa inventari() i projeccions()
 * del mòdul instal·lat. Torna:
 *   · { carrega: false, motiu } si el catàleg no carrega (CS-01 a HEAD);
 *   · { carrega: true, deriva } si el catàleg del disc ja no és la seua projecció
 *     abans del paquet (una altra mà): el pla s'ha de negar;
 *   · { carrega: true, fitxers } amb les projeccions que el paquet canvia i la CAS
 *     de cadascuna.
 * L'única escriptura és la còpia temporal, que es retira sempre.
 */
export async function projeccioCataleg(root = ARREL, { modul = root, nous = NOUS } = {}) {
  const { inventari, projeccions } = await import(pathToFileURL(path.join(modul, 'tooling/brain/cataleg_skills.mjs')).href);
  const tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-t6-cataleg-')));
  try {
    const muntaAgents = (dir, ambPaquet) => {
      fs.cpSync(path.join(root, '.agents/skills'), path.join(dir, '.agents/skills'), { recursive: true, verbatimSymlinks: true });
      for (const f of FONTS_CATALEG) {
        if (fs.existsSync(path.join(root, '.agents', f))) fs.copyFileSync(path.join(root, '.agents', f), path.join(dir, '.agents', f));
      }
      if (!ambPaquet) return;
      for (const f of fitxersNous(nous).filter((x) => x.ruta.startsWith('.agents/skills/'))) {
        fs.mkdirSync(path.dirname(path.join(dir, f.ruta)), { recursive: true });
        fs.writeFileSync(path.join(dir, f.ruta), fs.readFileSync(path.join(nous, f.nou)));
      }
    };
    const base = path.join(tmp, 'base');
    const paquet = path.join(tmp, 'paquet');
    muntaAgents(base, false);
    muntaAgents(paquet, true);
    let abans;
    let despres;
    try {
      abans = projeccions(inventari(base));
      despres = projeccions(inventari(paquet));
    } catch (e) {
      return { carrega: false, motiu: e.message, fitxers: [] };
    }
    const llig = (rel) => (fs.existsSync(path.join(root, rel)) ? fs.readFileSync(path.join(root, rel)) : null);
    const divergents = [...abans].filter(([rel, text]) => llig(rel)?.toString('utf8') !== text).map(([rel]) => rel);
    if (divergents.length) return { carrega: true, deriva: divergents, fitxers: [] };
    const fitxers = [];
    for (const [rel, text] of despres) {
      const actual = llig(rel);
      if (actual !== null && actual.toString('utf8') === text) continue;
      fitxers.push({ ruta: rel, before: actual === null ? null : sha(actual), contingut: text });
    }
    return { carrega: true, fitxers };
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

/**
 * Precondició de l'open (lliçó 261002 de wiki-documentacio-i-reflex, «Aprovació
 * explícita al frontend»): un tractor nou o canviat no és efectiu abans que el
 * Mestre aprove des de la Wiki el document que n'explica el flux. Este script no
 * ho pot comprovar: ho recorda abans de l'ordre d'open.
 */
export const PRECONDICIO_WIKI = Object.freeze([
  "Precondició (lliçó 261002 de wiki-documentacio-i-reflex): abans d'este open, MarIA crea a la Wiki el document",
  'que explica el flux nou (briefing de taula amb tots els declarats vius una vegada per conversa i jornada, guarda de',
  "l'índex i de l'arxiu, motiu de les injeccions a la traça i moments fixos de la neteja) i el Mestre l'aprova des de la pàgina.",
  "Sense eixa aprovació no es fa l'open.",
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

/** Directori existent més pròxim de cada target, sense scopes niats: el Reflex només admet scopes que existixen. */
export function scopesDe(root, targets) {
  const crus = [...new Set(targets.map((ruta) => {
    let r = ruta;
    while (r !== '.' && !fs.existsSync(path.join(root, r))) r = path.posix.dirname(r);
    return r;
  }))];
  return crus.filter((s) => !crus.some((o) => o !== s && (o === '.' || s.startsWith(`${o}/`)))).sort();
}

/**
 * Pla dels fitxers pendents, validat amb el mateix validatePlan de l'executor.
 * Cap escriptura al repositori. `exigix0055: false` només per a provar el pla
 * sense la dependència (el corredor); el flux real no el passa mai.
 */
export async function preparaPla(root = ARREL, { sessio = SESSIO_ZERO, validar = true, exigix0055 = true } = {}) {
  const feta = transaccio(root);
  if (feta) throw new Error(`Paquet 261006 Higiene T6 ja aplicat per la transacció ${feta.id} (${TRANSACCIONS}/). No es torna a aplicar: arxiveu el laboratori.`);
  const fitxers = estat(root);
  const deriva = fitxers.filter((f) => f.estat === 'deriva');
  if (deriva.length) throw new Error(deriva.map((f) => `${f.ruta}: ${f.motiu}`).join('\n'));
  const pendents = fitxers.filter((f) => f.estat === 'pendent');
  if (!pendents.length) throw new Error('Res a aplicar: tots els fitxers de nous/ ja són al disc. Arxiveu el laboratori.');
  const dep = dependencia0055(root);
  if (exigix0055 && !dep.aplicat) throw new Error(`Dependència: ${dep.motiu}.`);
  const cat = await projeccioCataleg(root);
  if (cat.deriva) throw new Error(`Deriva del catàleg: ${cat.deriva.join(', ')} ja no és la projecció de les skills del disc. Una altra mà l'ha canviat; refés el paquet, no el forces.`);
  const avisos = cat.carrega ? [] : [`El catàleg de skills no carrega (${cat.motiu}): la description nova de core-higiene-escriptori no es projecta a .agents/skills/00_INDEX_SKILLS.md. Ordre recomanat: el paquet T2 (t2_t5_skills), després el 261006_0055 i després este.`];
  const plan = {
    schema: 'sdp.mutation.v1',
    session: sessio,
    operationId: `${OPERACIO}${sessio.slice(0, 8)}`,
    files: [
      ...pendents.map((f) => ({ path: f.ruta, before: f.before, content: f.contingut })),
      ...cat.fitxers.map((f) => ({ path: f.ruta, before: f.before, content: f.contingut })),
    ],
  };
  if (validar) {
    const { validatePlan } = await import(pathToFileURL(path.join(root, 'tooling/gates/executor-mutacio.mjs')).href);
    validatePlan(fs.realpathSync(root), plan);
  }
  const targets = plan.files.map((f) => f.path);
  return { plan, scopes: scopesDe(root, targets), targets, aplicats: fitxers.filter((f) => f.estat === 'aplicat').map((f) => f.ruta), dependencia: dep, avisos };
}

/** Manifest del bootstrap: el LLEGIU_PRIMER i la DIAGNOSI del laboratori, que porten el què, el perquè i les decisions. */
export function manifest() {
  const sources = [
    { path: LLEGIU, reason: 'Què canvia el paquet 261006 Higiene T6, com s’aplica, dependències, decisions del Mestre i límits declarats.', classification: 'internal', role: 'reference' },
    { path: DIAGNOSI, reason: 'Per què l’orquestradora no neteja per iniciativa pròpia: causes amb pes, evidència recomptada i remeis.', classification: 'internal', role: 'reference' },
  ];
  return `${JSON.stringify({ sources }, null, 2)}\n`;
}

/** La Petorreta mecànica de la sessió: prompt editorial amb les marques que el seal exigix. */
export function construeixPetorreta({ sessio, intentSha256, rulesSha256, planSha256, targets }) {
  return `---
type: prompt
status: esborrany
description: Petorreta del Reflex per al paquet 261006 Higiene T6, aplicat amb executor-mutacio i lease del Mestre.
---
# Higiene T6 261006: briefing de taula, guarda de l'índex i moments fixos de la neteja

Reflex-Session: ${sessio}
Intent-SHA256: ${intentSha256}
Rules-SHA256: ${rulesSha256}
Plan-SHA256: ${planSha256}

## Context

La diagnosi del front T6b (${DIAGNOSI}) troba que la porta Olivera dona verd a tot el que està declarat viu a «Activitat en curs», que la declaració no caduca i que cap disparador de l'arrencada ni del tancament la fa revisar. El 2026-10-05 MarIA va passar la porta en arrencar i va informar l'Escriptori net amb dotze documents declarats vius, sis d'abans de hui i sis de la marató de la mateixa nit. Quan va netejar, npm run olivera:arxiva va dir «Res a arxivar», va moure la taula amb un mv massiu i la va tornar a verd amb dos scripts que reescrivien l'índex fora de cap porta. Les versions noves completes viuen al laboratori ${REL_LAB}/nous, provades a tests/laboratori-higiene-261006.test.js contra una còpia de HEAD, i cada original es contrasta amb el sha256 que tenia a ${HEAD}. El paquet depén del 261006_0055, que ha d'estar aplicat abans.

## Tasques

- antigravity-hook.mjs: briefing de taula a PreInvocation amb tots els declarats vius (els més antics primer i quants són d'abans de hui) i els artefactes d'abans de hui, una vegada per conversa i jornada, amb la memòria a .agents/runtime/antigravity-briefing.log; guarda de l'índex (heretoc, sed -i, perl -i, tee o script ad hoc que l'escriu, també amb el camí entre cometes i amb espais) i de 90_arxiu_historic (rm o mv), amb force_ask; el briefing no dona l'ordre --nom per als noms que la porta no deixa eixir per nom (majúscules de crear_bundle); motiu de cada injecció a la traça.
- tests/antigravity-hook.test.mjs: les proves noves del briefing, del cas del 2026-10-05, de les dues guardes i del procés real.
- core-higiene-escriptori 3.4.0: quan es neteja (arrencada, briefing o porta roja, convocatòria i tancament), criteri d'eixida de l'Aturada de Seguretat, les ordres de la porta del paquet 0055 i cap gest a mà sobre l'índex o l'arxiu. Les lliçons del Mestre es conserven tal com són.
- core-identitat: pas 5 de l'arrencada (porta i taula resolta abans de la primera resposta).
- Si el catàleg carrega, la projecció de la description nova a .agents/skills/00_INDEX_SKILLS.md.

Fitxers del pla (${targets.length}): ${targets.join(', ')}.

## Riscos

- Entre el seal i l'executor no pot canviar res del repositori: el Reflex compara HEAD i l'estat de git sencer.
- Si el catàleg no carrega quan s'aplica, la description nova queda sense projectar: el paquet T2 l'haurà de refer o caldrà cataleg_skills.mjs --escriu amb una altra lease.
- La guarda de l'índex pot preguntar per una ordre legítima que nomene l'índex i escriga per shell: la via és l'eina d'edició o les ordres de la porta.
- Si l'executor falla a mitges, el pending bloqueja noves mutacions fins a una reconciliació revisada; no es reintenta a cegues.

## Criteris d'acceptació

- L'executor torna valid:true i deixa una transacció a .agents/seal-transactions amb operationId ${OPERACIO}.
- Passen sense cap fallada tests/antigravity-hook.test.mjs, tests/cognitive-hook-safety.test.mjs i les proves que porta el paquet 0055 (tests/porta-olivera-diagnosi.test.mjs, tests/porta-olivera-v3.test.mjs i tests/cognitive-preflight.test.mjs).
- tests/governanca-260930-olivera.test.mjs no empitjora respecte de la base: és roja a HEAD per preimatges congelades, i el que hi passava continua passant.
- node tooling/gates/segella.mjs diu intacte i el corredor tests/laboratori-higiene-261006.test.js es retira.
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
  const { plan, scopes, targets, aplicats, dependencia, avisos } = await preparaPla(root, { sessio: sessio ?? SESSIO_ZERO });
  console.log(`Pla vàlid: ${targets.length} fitxers, ${Buffer.byteLength(JSON.stringify(plan))} bytes.`);
  for (const f of plan.files) console.log(`  ${f.before ? 'M' : 'A'} ${f.path}`);
  for (const r of aplicats) console.log(`  = ${r} (ja aplicat; fora del pla)`);
  console.log(`Dependència 261006_0055: aplicada (${dependencia.motiu}).`);
  for (const a of avisos) console.log(`Avís: ${a}`);
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
