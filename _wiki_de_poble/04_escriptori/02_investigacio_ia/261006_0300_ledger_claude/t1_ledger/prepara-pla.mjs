#!/usr/bin/env node
/**
 * prepara-pla.mjs — pla sdp.mutation.v1 del paquet 261006 «LEDGER: peus històrics
 * i línies enganxades» (T1 del prompt 261006_0224_prompt_claude_ledger).
 *
 * Dues parts en un sol pla:
 *   1. Codi: tooling/brain/fonts-vigilancia.mjs (analitzaLedger: els peus
 *      intercalats són `peusHistorics`; `fossils` només compta el segell
 *      enganxat que cap línia mal formada recull) i les seues dues proves. Cada
 *      original es contrasta amb el sha256 que tenia a HEAD (BASES): si el disc
 *      ja no és eixe, deriva i el pla es nega. Un fitxer idèntic al de nous/ ja
 *      està aplicat i ix del pla.
 *   2. LEDGER: NO hi ha cap còpia congelada (creix cada hora). El LEDGER es llig
 *      del disc en el moment de preparar el pla, cada línia enganxada es localitza
 *      pel seu contingut (FUSIONS, mai pel número) i s'hi inserix UN sol salt de
 *      línia al punt de fusió. Abans de tornar el pla es comprova que, llevant els
 *      salts inserits, el text és idèntic byte a byte a l'original. Una fusió ja
 *      separada es deixa estar; una que no es troba, o que es troba dues vegades,
 *      és deriva. El `before` de la CAS del LEDGER és el sha256 del disc en eixe
 *      moment: si algú hi escriu entre el pla i l'executor, la CAS el rebutja.
 *
 * La signatura és del Mestre. Este script no la calcula per a escriure-la: només
 * informa de si la signatura final és vàlida ara, de quina línia explica el
 * trencament si n'hi ha una, i de què haurà de segellar el Mestre després.
 *
 * Seguix el flux de la lease: open → bootstrap → seal → executor. No escriu cap
 * fitxer: el que cal deixar a .sdp-reflex/plans/ i al bootstrap ho escriu per
 * stdout, i la redirecció `>` la fa el Mestre amb les ordres que imprimix
 * `comprova --session=ID`.
 *
 * Ús (des de l'arrel del repositori; LAB és la carpeta d'este fitxer):
 *   node LAB/prepara-pla.mjs [pla] [--session=ID]      # pla JSON per stdout
 *   node LAB/prepara-pla.mjs comprova [--session=ID]   # resum, deriva, LEDGER i ordre d'open
 *   node LAB/prepara-pla.mjs petorreta --session=ID    # Petorreta del bootstrap per stdout
 *   node LAB/prepara-pla.mjs manifest                  # context.json del bootstrap per stdout
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const LAB = path.dirname(fileURLToPath(import.meta.url));
export const ARREL = path.resolve(LAB, '../../../../..');
export const REL_LAB = '_wiki_de_poble/04_escriptori/02_investigacio_ia/261006_0300_ledger_claude/t1_ledger';
export const NOUS = path.join(LAB, 'nous');
export const SESSIO_ZERO = '00000000-0000-4000-8000-000000000000';
/** Commit on es va preparar el paquet: cap dels tres originals de codi tenia canvis sense commit. */
export const HEAD = '76947e5d';
/** sha256 de cada original de codi a HEAD. És la base de la CAS de l'executor (`before`). */
export const BASES = Object.freeze({
  'tests/fonts-vigilancia.test.mjs': '329a3b8fa58046895626d4935a88a449b16d525b44953d3ca2e4cb4987b8b4ca',
  'tests/mapa-consola.test.mjs': 'e4e226ba60fb6fc6c4232896239f09f54c682b346ac7a553e4952a6aba151817',
  'tooling/brain/fonts-vigilancia.mjs': 'b37404944e7b50314e77bc21cf666550a185f757f87beec08ecd6a184e9ad0ff',
});
export const LEDGER = '.agents/LEDGER.md';
/**
 * Les dues línies enganxades del LEDGER (auditoria Opus 261006_0025 §8.2: línies
 * 605 i 619 el 261006). `abans` és el text que acaba just al punt de fusió i
 * `despres` el que hi comença; entre els dos s'inserix un sol "\n".
 */
export const FUSIONS = Object.freeze([
  Object.freeze({
    id: 'peu 0a2f3a6e + entrada 260927 claude-fable (QA)',
    abans: '<!-- HASH: 0a2f3a6e8309d0acbeb2d4b9bef536f2475b3f8558e4ae24fd38e7ff3c07090d -->',
    despres: '260927 | torn | claude-fable | QA sense commit, 15 troballes T5/T6 refutades a dos veus, rail del Xat WhatsApp.',
  }),
  Object.freeze({
    id: 'entrada 260927 claude-fable (UI) + entrada 260928 claude (T33)',
    abans: 'cancel·lada i retirada, 1.220 proves verdes.',
    despres: '260928 | torn | claude | T33–T38 aplicades i verificades; auditoria 0035; torn obert sense lease',
  }),
]);
export const INTENT = 'Paquet 261006 LEDGER: peus intercalats com a peus historics a fonts-vigilancia (Mapa de la Consola) i separacio de les dues linies enganxades del LEDGER sense esborrar cap caracter, amb executor-mutacio';
export const LLEGIU = `${REL_LAB}/LLEGIU_PRIMER.txt`;
export const NOM_PETORRETA = '261006_0300_PROMPT_ledger_peus_historics_i_linies_enganxades_amb_executor_i_lease.md';
/** Prefix de l'operationId del pla: el marcador que l'executor deixa a .agents/seal-transactions/. */
export const OPERACIO = 'sdp-ledger-peus-261006-';
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
 * a BASES), `aplicat` (ja és idèntic al de nous/) o `deriva` (ni una cosa ni
 * l'altra). Només llig.
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

/* ══════════════════════ LEDGER: separació per contingut ══════════════════════ */

/** Posicions de totes les aparicions (sense solapament) d'`agulla` a `text`. */
function aparicions(text, agulla) {
  const out = [];
  for (let i = text.indexOf(agulla); i !== -1; i = text.indexOf(agulla, i + agulla.length)) out.push(i);
  return out;
}

const NOMES_PEU = /^<!-- HASH: [a-f0-9]{64} -->$/;
const ENTRADA = /^\d{6} \| [^|\n]+ \| [^|\n]+ \| \S/;

/**
 * On és cada fusió al text: `enganxada` (una sola aparició, amb la posició on
 * s'inserix el salt), `separada` (ja té el salt; no es toca) o `deriva` (no hi
 * és, hi és més d'una vegada, o el punt no parteix una línia en dues peces
 * canòniques).
 */
export function localitzaFusions(text, fusions = FUSIONS) {
  return fusions.map((f) => {
    const juntes = aparicions(text, f.abans + f.despres);
    const separades = aparicions(text, `${f.abans}\n${f.despres}`);
    const linia = (i) => text.slice(0, i).split('\n').length;
    if (juntes.length === 0 && separades.length === 1) return { id: f.id, estat: 'separada', linia: linia(separades[0]) };
    if (juntes.length !== 1 || separades.length !== 0) {
      return { id: f.id, estat: 'deriva', motiu: `fusió trobada ${juntes.length} vegades i separada ${separades.length}: el LEDGER no és el que esperava el paquet` };
    }
    const posicio = juntes[0] + f.abans.length;
    const inici = text.lastIndexOf('\n', posicio - 1) + 1;
    const fiLinia = text.indexOf('\n', posicio);
    const esquerra = text.slice(inici, posicio);
    const dreta = text.slice(posicio, fiLinia === -1 ? text.length : fiLinia);
    if (!(NOMES_PEU.test(esquerra) || ENTRADA.test(esquerra)) || !ENTRADA.test(dreta)) {
      return { id: f.id, estat: 'deriva', motiu: 'el punt de fusió no parteix la línia en un peu o una entrada i una entrada' };
    }
    return { id: f.id, estat: 'enganxada', posicio, linia: linia(posicio) };
  });
}

/**
 * Separa les fusions enganxades: un "\n" just al punt de fusió, res més.
 * `insercions` són posicions del text original, en ordre creixent.
 */
export function separa(text, fusions = FUSIONS) {
  const llocs = localitzaFusions(text, fusions);
  const deriva = llocs.filter((l) => l.estat === 'deriva');
  if (deriva.length) throw new Error(`LEDGER: ${deriva.map((l) => `${l.id}: ${l.motiu}`).join('; ')}`);
  const insercions = llocs.filter((l) => l.estat === 'enganxada').map((l) => l.posicio).sort((a, b) => a - b);
  let nou = '';
  let des = 0;
  for (const p of insercions) { nou += `${text.slice(des, p)}\n`; des = p; }
  nou += text.slice(des);
  return { nou, insercions, llocs };
}

/** Desfà la separació: lleva el salt que hi ha a cada posició inserida (desplaçada pels anteriors). */
export function desfes(nou, insercions) {
  let text = nou;
  for (let k = insercions.length - 1; k >= 0; k -= 1) {
    const i = insercions[k] + k;
    if (text[i] !== '\n') throw new Error(`a la posició ${i} no hi ha el salt inserit`);
    text = text.slice(0, i) + text.slice(i + 1);
  }
  return text;
}

/** La separació només afig salts: llevant-los, el text és idèntic byte a byte a l'original. */
export function reversible(original, nou, insercions) {
  return Buffer.byteLength(nou) === Buffer.byteLength(original) + insercions.length
    && Buffer.from(desfes(nou, insercions), 'utf8').equals(Buffer.from(original, 'utf8'));
}

/* ══════════════════════ LEDGER: signatura (només lectura) ══════════════════════ */

/** Mateixa regla que tooling/verify-ledger.mjs:20 i :31. */
const PEU_FINAL = /\n\n<!-- HASH: ([a-f0-9]{64}) -->$/;

/** Peu final i si segella el cos, com ho jutja verify-ledger.mjs sense --sign. */
export function signatura(text) {
  const m = PEU_FINAL.exec(text);
  if (!m) return { peu: null, valid: false, esperat: sha(text) };
  const esperat = sha(text.slice(0, m.index));
  return { peu: m[1], valid: esperat === m[1], esperat };
}

/**
 * Si la signatura final està trencada i l'explica una sola línia del cos
 * (afegida després de signar), torna els números d'eixes línies. Només
 * diagnòstic per al Mestre: no reescriu res.
 */
export function explicaTrencament(text) {
  const m = PEU_FINAL.exec(text);
  if (!m) return [];
  const linies = text.slice(0, m.index).split('\n');
  const out = [];
  for (let i = 0; i < linies.length; i += 1) {
    if (sha([...linies.slice(0, i), ...linies.slice(i + 1)].join('\n')) === m[1]) out.push(i + 1);
  }
  return out;
}

/** Tot el que el pla necessita del LEDGER, llegit ara del disc. */
export function estatLedger(root = ARREL) {
  // Una sola lectura: el `before` de la CAS i el text que es separa són els mateixos bytes.
  const bytes = fs.readFileSync(path.join(root, LEDGER));
  const original = bytes.toString('utf8');
  if (!Buffer.from(original, 'utf8').equals(bytes)) throw new Error('LEDGER: no és UTF-8 vàlid; no es prepara cap pla');
  const { nou, insercions, llocs } = separa(original);
  if (!reversible(original, nou, insercions)) throw new Error('LEDGER: la separació no és reversible byte a byte; no es prepara cap pla');
  const ara = signatura(original);
  return {
    before: sha(bytes),
    original, nou, insercions, llocs,
    canvia: insercions.length > 0,
    signatura: ara,
    explicacio: ara.valid ? [] : explicaTrencament(original),
    linies: original.split('\n'),
  };
}

/* ══════════════════════ Pla ══════════════════════ */

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

/** Directori existent més pròxim de cada target, sense scopes niats: el Reflex només admet scopes que existixen. */
export function scopesDe(root, targets) {
  const crus = [...new Set(targets.map((ruta) => {
    let r = ruta;
    while (r !== '.' && !fs.existsSync(path.join(root, r))) r = path.posix.dirname(r);
    return r;
  }))];
  return crus.filter((s) => !crus.some((o) => o !== s && (o === '.' || s.startsWith(`${o}/`)))).sort();
}

/** Pla dels fitxers pendents i de la separació del LEDGER, validat amb el validatePlan de l'executor. Cap escriptura. */
export async function preparaPla(root = ARREL, { sessio = SESSIO_ZERO, validar = true } = {}) {
  const feta = transaccio(root);
  if (feta) throw new Error(`Paquet 261006 LEDGER ja aplicat per la transacció ${feta.id} (${TRANSACCIONS}/). No es torna a aplicar: arxiveu el laboratori.`);
  const fitxers = estat(root);
  const deriva = fitxers.filter((f) => f.estat === 'deriva');
  if (deriva.length) throw new Error(deriva.map((f) => `${f.ruta}: ${f.motiu}`).join('\n'));
  const ledger = estatLedger(root);
  const files = fitxers.filter((f) => f.estat === 'pendent').map((f) => ({ path: f.ruta, before: f.before, content: f.contingut }));
  if (ledger.canvia) files.push({ path: LEDGER, before: ledger.before, content: ledger.nou });
  if (!files.length) throw new Error('Res a aplicar: el codi de nous/ ja és al disc i les dues línies del LEDGER ja estan separades. Arxiveu el laboratori.');
  files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  const plan = { schema: 'sdp.mutation.v1', session: sessio, operationId: `${OPERACIO}${sessio.slice(0, 8)}`, files };
  if (validar) {
    const { validatePlan } = await import(pathToFileURL(path.join(root, 'tooling/gates/executor-mutacio.mjs')).href);
    validatePlan(fs.realpathSync(root), plan);
  }
  const targets = files.map((f) => f.path);
  return { plan, scopes: scopesDe(root, targets), targets, aplicats: fitxers.filter((f) => f.estat === 'aplicat').map((f) => f.ruta), ledger };
}

/** Línies de `comprova` sobre el LEDGER: fusions, signatura d'ara i què haurà de segellar el Mestre. */
export function liniesLedger(ledger) {
  const out = [];
  for (const l of ledger.llocs) out.push(`  LEDGER · ${l.id}: ${l.estat === 'enganxada' ? `enganxada a la línia ${l.linia}; s'hi inserix un salt` : `ja separada (línia ${l.linia}); no es toca`}`);
  out.push(`  LEDGER · reversible byte a byte: sí (${ledger.insercions.length} salts inserits, cap caràcter esborrat)`);
  const s = ledger.signatura;
  if (s.valid) out.push(`  Signatura final d'ara: vàlida (${s.peu.slice(0, 8)}).`);
  else if (!s.peu) out.push('  Signatura final d\'ara: cap peu final al final del fitxer (verify-ledger.mjs diria «no conté cap signatura»).');
  else {
    out.push(`  Signatura final d'ara: TRENCADA (peu ${s.peu.slice(0, 8)}, cos ${s.esperat.slice(0, 8)}).`);
    if (ledger.explicacio.length) {
      for (const n of ledger.explicacio) out.push(`    L'explica la línia ${n}, afegida després de signar: «${ledger.linies[n - 1].slice(0, 110)}»`);
    } else out.push('    No l\'explica cap línia sola: reviseu el LEDGER amb git abans de signar.');
  }
  out.push('  Després de l\'executor, la signatura final quedarà trencada per estos salts: la signa el Mestre (LLEGIU_PRIMER §3).');
  return out;
}

/** Manifest del bootstrap: el LLEGIU_PRIMER del laboratori, que porta el què, el perquè i les decisions. */
export function manifest() {
  const sources = [{ path: LLEGIU, reason: 'Què canvia el paquet 261006 del LEDGER, per què, com s’aplica i es signa, decisions del Mestre i límits declarats.', classification: 'internal', role: 'reference' }];
  return `${JSON.stringify({ sources }, null, 2)}\n`;
}

/** La Petorreta mecànica de la sessió: prompt editorial amb les marques que el seal exigix. */
export function construeixPetorreta({ sessio, intentSha256, rulesSha256, planSha256, targets }) {
  return `---
type: prompt
status: esborrany
description: Petorreta del Reflex per al paquet 261006 del LEDGER (peus històrics i línies enganxades), aplicat amb executor-mutacio i lease del Mestre.
---
# LEDGER 261006: els peus intercalats són història i les dues línies enganxades se separen sense esborrar cap caràcter

Reflex-Session: ${sessio}
Intent-SHA256: ${intentSha256}
Rules-SHA256: ${rulesSha256}
Plan-SHA256: ${planSha256}

## Context

Ordre del Mestre (prompt 261006_0224_prompt_claude_ledger, T1): que el Mapa de la Consola tracte els deu peus intercalats del LEDGER com a elements històrics, sense esborrar-los, i que les dues línies enganxades se separen sense esborrar cap caràcter. El recompte viu a tooling/brain/fonts-vigilancia.mjs (analitzaLedger), que la closca mapa-consola.mjs passa tal qual al compilador de la Consola. Les versions noves completes viuen al laboratori ${REL_LAB}/nous, provades a tests/laboratori-ledger-261006.test.js, i cada original de codi es contrasta amb el sha256 que tenia a ${HEAD}. El LEDGER es llig del disc en preparar el pla i cada fusió es localitza pel contingut.

## Tasques

- fonts-vigilancia.mjs: analitzaLedger torna peusHistorics (tots els peus intercalats) i fossils passa a comptar només el segell enganxat a un text que cap línia mal formada recull. La resta del mòdul no canvia.
- tests/fonts-vigilancia.test.mjs i tests/mapa-consola.test.mjs: el contracte del LEDGER amb peusHistorics i les proves noves «LEDGER 261006».
- .agents/LEDGER.md: un salt de línia a cadascun dels dos punts de fusió (peu 0a2f3a6e + entrada 260927, i entrada 260927 + entrada 260928). Res més.

Fitxers del pla (${targets.length}): ${targets.join(', ')}.

## Riscos

- Entre el seal i l'executor no pot canviar res del repositori: el Reflex compara HEAD i l'estat de git sencer, i la CAS del LEDGER rebutja qualsevol línia escrita després de preparar el pla.
- Després de l'executor la signatura final del LEDGER queda trencada pels dos salts: la signa el Mestre, en l'ordre del LLEGIU_PRIMER, per no reemplaçar el peu final sense voler.
- Canviar fonts-vigilancia.mjs desperta les proves adormides dels corredors de 260930_0040, que fan skip només mentre el fitxer siga idèntic al del laboratori. Són de la suite laboratory, fora de test:ci; cap prova es retira (política de tooling/tests/node-suite-manifest.json:8); acceptar el roig de laboratori o arxivar 260930_0040 és decisió del Mestre (LLEGIU_PRIMER §5).

## Criteris d'acceptació

- L'executor torna valid:true i deixa una transacció a .agents/seal-transactions amb operationId ${OPERACIO}.
- Passen tests/fonts-vigilancia.test.mjs i tests/mapa-consola.test.mjs.
- node tooling/brain/mapa-consola.mjs --json dona ledger-fossils 0 i ledger-mal-formades 0; després de signar, node tooling/verify-ledger.mjs ix amb 0.
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
  const { plan, scopes, targets, aplicats, ledger } = await preparaPla(root, { sessio: sessio ?? SESSIO_ZERO });
  console.log(`Pla vàlid: ${targets.length} fitxers, ${Buffer.byteLength(JSON.stringify(plan))} bytes.`);
  for (const f of plan.files) console.log(`  ${f.before ? 'M' : 'A'} ${f.path}`);
  for (const r of aplicats) console.log(`  = ${r} (ja aplicat; fora del pla)`);
  for (const l of liniesLedger(ledger)) console.log(l);
  if (!sessio) {
    console.log('');
    console.log("Ordre d'open:");
    console.log(`node tooling/wiki/reflex_petorreta.mjs open --intent="${INTENT}" --risk=high --operation=governance-write ${scopes.map((s) => `--scope=${s}`).join(' ')}`);
    return;
  }
  const { s } = await preparaSessio(root, sessio);
  const dirBootstrap = path.join(root, s.bootstrap.path);
  if (!fs.statSync(dirBootstrap).isDirectory() || fs.readdirSync(dirBootstrap).length) throw new Error('El bootstrap reservat no existix o no és buit');
  const relB = s.bootstrap.path;
  const lab = `node ${REL_LAB}/prepara-pla.mjs`;
  console.log('\nSessió vàlida. Petorreta i manifest passarien el seal. Ordres següents (des de l’arrel, sense escriure res al LEDGER entremig):');
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
