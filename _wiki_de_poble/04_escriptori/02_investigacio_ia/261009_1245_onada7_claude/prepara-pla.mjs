#!/usr/bin/env node
/**
 * prepara-pla.mjs — pla sdp.mutation.v1 del paquet 261009_1245 «Onada 7: nom i ruta abans
 * del rebut, i actes fora de la taula» (front d'incidències de taxonomia i d'higiene).
 *
 *   T1 · taxonomia: deliverContext (tooling/documental/turns.mjs) rebutja el nom d'un prompt
 *        o d'un pla que no és de la ruta abans d'emetre cap rebut, i handoffDocument no el
 *        torna a lligar a un nom d'una altra ruta. La porta de plantilla viva diu el prefix
 *        que ha de portar el nom i, en recuperar, proposa un nom que context admet. Un id de
 *        ruta usat com a categoria («planificacio_x», O13 del 261002) es vigila i no admet cap
 *        ruta. El catàleg de noms passa a tooling/documental/core.mjs (la porta el reexporta)
 *        perquè turns.mjs el llija sense importar la porta, que ja importa de turns.mjs.
 *   T2 · higiene: tooling/documental/draft-write.mjs ancora els documents de fora del primer
 *        nivell (les actes de 10_actes/) a «## Actes i documents fora de la taula», i no al
 *        final de l'índex, que ara és «## Arxivat amb la Porta Olivera». import.mjs passa per
 *        la mateixa àncora (ancoraAlIndex).
 *   Proves: tests/documental.test.mjs (noves), tests/porta-olivera-v3.test.mjs,
 *        tests/cognitive-preflight.test.mjs i tests/plantilla-viva-installacio.test.mjs.
 *
 * L'ha escrit Claude (Opus 5.5) el 261009 en una sessió on el hook no deixa córrer node sobre
 * res que no siga una prova. Les peces pures (substitucions, aplicaCanvis, estat, mostra,
 * transaccio, preparaPla, la Petorreta i el manifest) les prova
 * tests/laboratori-onada7-261009.test.js; les ordres del Reflex (open, seal, executor) són
 * les del model provat del 261006 i del 261009_0400_consola_claude, i no s'han executat.
 *
 * La CAS és doble, com al model de la Consola:
 *  1. Cada canvi de nous/substitucions.json és una substitució exacta: el text «abans» ha
 *     d'aparéixer una sola vegada i el «despres» cap. Si el «despres» ja hi és (una vegada) i
 *     l'«abans» no hi és fora d'ell, el canvi està aplicat. Qualsevol altra cosa, o un fitxer
 *     amb canvis aplicats i canvis pendents alhora, és deriva: el pla es nega i es refà el paquet.
 *  2. El pla porta el sha256 del fitxer tal com és en preparar-lo (`before`), i
 *     executor-mutacio el torna a comprovar en executar (validatePlan, CAS).
 * No toca cap skill: no hi ha projeccions del catàleg. El segell de skills el recalcula
 * l'executor (executor-mutacio.mjs:75-87), que el rebutja si el previ no és vàlid (:42).
 *
 * Ús (des de l'arrel del repositori; LAB és la carpeta d'este fitxer):
 *   node LAB/prepara-pla.mjs comprova [--session=ID]   # resum, deriva i ordres
 *   node LAB/prepara-pla.mjs [pla] [--session=ID]      # pla JSON per stdout
 *   node LAB/prepara-pla.mjs petorreta --session=ID    # Petorreta del bootstrap per stdout
 *   node LAB/prepara-pla.mjs manifest                  # context.json del bootstrap per stdout
 *   node LAB/prepara-pla.mjs mostra RUTA               # el fitxer tal com quedaria
 * No escriu res: el que cal deixar a .sdp-reflex/ ho escriu per stdout i la redirecció la fa
 * el Mestre amb les ordres que imprimix `comprova --session=ID`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const LAB = path.dirname(fileURLToPath(import.meta.url));
/** LAB és _wiki_de_poble/04_escriptori/02_investigacio_ia/261009_1245_onada7_claude: quatre nivells. */
export const ARREL = path.resolve(LAB, '../../../..');
export const REL_LAB = '_wiki_de_poble/04_escriptori/02_investigacio_ia/261009_1245_onada7_claude';
export const NOUS = path.join(LAB, 'nous');
export const SUBSTITUCIONS = path.join(NOUS, 'substitucions.json');
export const SESSIO_ZERO = '00000000-0000-4000-8000-000000000000';
export const INTENT = 'Paquet 261009_1245 Onada 7: el nom i la ruta es comproven abans del rebut i del relleu a turns.mjs, la porta de plantilla viva diu el prefix del nom i recupera amb un nom bo, i draft-write i import ancoren les actes fora de la taula, amb executor-mutacio';
export const LLEGIU = `${REL_LAB}/LLEGIU_PRIMER.txt`;
/** reflex_petorreta.mjs:807-812 exigix YYMMDD_HHMM_PROMPT_ i un títol de 8 a 12 paraules: este en té 12. */
export const NOM_PETORRETA = '261009_1245_PROMPT_nom_i_ruta_abans_del_rebut_i_actes_fora_de_la_taula.md';
/** Prefix de l'operationId del pla: el marcador que l'executor deixa a .agents/seal-transactions/. */
export const OPERACIO = 'sdp-onada7-taxonomia-261009-';
const TRANSACCIONS = '.agents/seal-transactions';
/** Superfície declarada del paquet: no toca res més. */
const SUPERFICIE = /^(?:tooling\/(?:documental|gates)\/[a-z0-9-]+\.mjs|tests\/[a-z0-9-]+\.test\.mjs)$/;
const US = `Ús: ${REL_LAB}/prepara-pla.mjs [pla|comprova|petorreta|manifest] [--session=ID] | mostra RUTA`;

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

/** Un text de substitucions.json: una cadena o una llista de línies que es junten amb \n. */
function text(valor, on) {
  if (typeof valor === 'string') return valor;
  if (Array.isArray(valor) && valor.every((l) => typeof l === 'string')) return valor.join('\n');
  throw new Error(`${on}: ha de ser un text o una llista de línies`);
}

/** Les substitucions del paquet, validades i amb els textos resolts. */
export function substitucions(fitxer = SUBSTITUCIONS) {
  const brut = JSON.parse(fs.readFileSync(fitxer, 'utf8'));
  if (brut?.schema !== 'sdp.onada7.substitucions.v1' || !Array.isArray(brut.fitxers) || !brut.fitxers.length) {
    throw new Error('nous/substitucions.json no té la forma sdp.onada7.substitucions.v1');
  }
  const vistes = new Set();
  return brut.fitxers.map((f) => {
    rutaSegura(f.ruta);
    if (!SUPERFICIE.test(f.ruta)) throw new Error(`Fora de la superfície del paquet: ${f.ruta}`);
    if (vistes.has(f.ruta)) throw new Error(`Fitxer repetit: ${f.ruta}`);
    vistes.add(f.ruta);
    if (!Array.isArray(f.canvis) || !f.canvis.length) throw new Error(`${f.ruta}: cap canvi`);
    const canvis = f.canvis.map((c, i) => {
      const on = `${f.ruta}, canvi ${i + 1}`;
      const abans = text(c.abans, `${on} («abans»)`);
      const despres = text(c.despres, `${on} («despres»)`);
      if (!abans || !despres || abans === despres) throw new Error(`${on}: «abans» i «despres» han de ser textos diferents i no buits`);
      if (typeof c.motiu !== 'string' || !c.motiu.trim()) throw new Error(`${on}: sense motiu`);
      return { motiu: c.motiu, abans, despres };
    });
    return { ruta: f.ruta, canvis };
  });
}

/** Quantes vegades apareix `agulla` dins de `text` (sense solapar). */
export function ocurrencies(text, agulla) {
  let n = 0;
  for (let i = text.indexOf(agulla); i !== -1; i = text.indexOf(agulla, i + agulla.length)) n += 1;
  return n;
}

/**
 * Aplica els canvis d'un fitxer en ordre. Un canvi és pendent (l'«abans» hi és una vegada i
 * el «despres» cap) o aplicat (el «despres» hi és una vegada i l'«abans» només dins d'ell).
 * Qualsevol altra cosa, i un fitxer amb canvis aplicats i pendents alhora, llança: deriva.
 * Torna { contingut, aplicats, pendents }.
 */
export function aplicaCanvis(ruta, original, canvis) {
  let contingut = original;
  let aplicats = 0;
  let pendents = 0;
  for (const [i, c] of canvis.entries()) {
    const nAbans = ocurrencies(contingut, c.abans);
    const nDespres = ocurrencies(contingut, c.despres);
    if (nDespres === 1 && nAbans === ocurrencies(c.despres, c.abans)) { aplicats += 1; continue; }
    if (nAbans === 1 && nDespres === 0) {
      const at = contingut.indexOf(c.abans);
      contingut = `${contingut.slice(0, at)}${c.despres}${contingut.slice(at + c.abans.length)}`;
      pendents += 1;
      continue;
    }
    throw new Error(`${ruta}, canvi ${i + 1} (${c.motiu}): l'«abans» hi és ${nAbans} vegades i el «despres» ${nDespres}. Algú ha tocat el fitxer: refeu el paquet, no el forceu.`);
  }
  if (aplicats && pendents) throw new Error(`${ruta}: ${aplicats} canvi(s) ja hi són i ${pendents} no. Aplicació a mitges: refeu el paquet, no el forceu.`);
  return { contingut, aplicats, pendents };
}

/**
 * Com coincidix la còpia de lectura amb el contingut que eixiria. L'eina d'escriptura de
 * Claude no conserva l'espai final d'una línia (turns.mjs en té una de quatre espais): eixa
 * diferència es diu amb les línies, i mai mana, perquè el pla porta els bytes de les
 * substitucions, no els de la còpia.
 */
function comparaLectura(copia, contingut) {
  if (copia === contingut) return 'coincidix';
  const net = (t) => t.split('\n').map((l) => l.replace(/[ \t]+$/, '')).join('\n');
  if (net(copia) !== net(contingut)) return 'DIFERIX';
  const deLaCopia = copia.split('\n');
  const linies = contingut.split('\n').map((l, i) => (l !== deLaCopia[i] ? i + 1 : 0)).filter(Boolean);
  return `coincidix llevat dels espais finals (línies ${linies.join(', ')})`;
}

/**
 * Estat de cada fitxer del paquet contra el disc de `root`: `pendent`, `aplicat` o `deriva`
 * (amb el motiu). `lectura` diu si la còpia de lectura nous/<ruta>.txt coincidix amb el
 * contingut que eixiria. Només llig.
 */
export function estat(root = ARREL, { subst = substitucions(), nous = NOUS } = {}) {
  return subst.map((f) => {
    const abs = path.join(root, f.ruta);
    if (!fs.existsSync(abs)) return { ruta: f.ruta, estat: 'deriva', motiu: 'el fitxer no és al disc', before: null };
    const bytes = fs.readFileSync(abs);
    let r;
    try { r = aplicaCanvis(f.ruta, bytes.toString('utf8'), f.canvis); }
    catch (error) { return { ruta: f.ruta, estat: 'deriva', motiu: error.message, before: sha(bytes) }; }
    const copia = path.join(nous, `${f.ruta}.txt`);
    const lectura = fs.existsSync(copia) ? comparaLectura(fs.readFileSync(copia, 'utf8'), r.contingut) : 'sense còpia de lectura';
    return { ruta: f.ruta, estat: r.pendents ? 'pendent' : 'aplicat', before: sha(bytes), contingut: r.contingut, canvis: f.canvis.length, lectura };
  });
}

/** El fitxer tal com quedaria amb el paquet, per a llegir-lo sencer abans d'aprovar. */
export function mostra(root, ruta, { subst = substitucions() } = {}) {
  const f = subst.find((x) => x.ruta === ruta);
  if (!f) throw new Error(`${ruta} no és del paquet`);
  return aplicaCanvis(ruta, fs.readFileSync(path.join(root, ruta), 'utf8'), f.canvis).contingut;
}

/** Primera transacció acceptada amb un prefix d'operationId, o null. Un registre il·legible no compta. */
export function transaccio(root = ARREL, prefix = OPERACIO) {
  const dir = path.join(root, TRANSACCIONS);
  if (!fs.existsSync(dir)) return null;
  for (const nom of fs.readdirSync(dir).filter((n) => n.endsWith('.json')).sort()) {
    let t;
    try { t = JSON.parse(fs.readFileSync(path.join(dir, nom), 'utf8')); } catch { continue; }
    if (t?.state === 'accepted' && typeof t.operationId === 'string' && t.operationId.startsWith(prefix) && Array.isArray(t.files)) return t;
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

/** Pla dels fitxers pendents, validat amb el validatePlan de l'executor. Cap escriptura. */
export async function preparaPla(root = ARREL, { sessio = SESSIO_ZERO, validar = true, subst = substitucions() } = {}) {
  const feta = transaccio(root);
  if (feta) throw new Error(`Paquet 261009_1245 ja aplicat per la transacció ${feta.id} (${TRANSACCIONS}/). No es torna a aplicar: arxiveu el laboratori.`);
  const fitxers = estat(root, { subst });
  const deriva = fitxers.filter((f) => f.estat === 'deriva');
  if (deriva.length) throw new Error(deriva.map((f) => `${f.ruta}: ${f.motiu}`).join('\n'));
  const pendents = fitxers.filter((f) => f.estat === 'pendent');
  if (!pendents.length) throw new Error('Res a aplicar: el disc ja és el del paquet. Arxiveu el laboratori.');
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
  const targets = plan.files.map((f) => f.path);
  return { plan, scopes: scopesDe(root, targets), targets, fitxers };
}

/** Manifest del bootstrap: el LLEGIU_PRIMER del laboratori. */
export function manifest() {
  const sources = [
    { path: LLEGIU, reason: 'Què canvia el paquet 261009_1245 (nom i ruta abans del rebut, actes fora de la taula), per què, com s’aplica, decisions del Mestre i límits.', classification: 'internal', role: 'reference' },
  ];
  return `${JSON.stringify({ sources }, null, 2)}\n`;
}

/** La Petorreta mecànica de la sessió: prompt editorial amb les marques que el seal exigix. */
export function construeixPetorreta({ sessio, intentSha256, rulesSha256, planSha256, targets }) {
  return `---
type: prompt
status: esborrany
description: Petorreta del Reflex per al paquet 261009_1245 de l'Onada 7 (nom i ruta abans del rebut, actes fora de la taula), aplicat amb executor-mutacio i lease del Mestre.
---
# Onada 7 261009: nom i ruta abans del rebut, i actes fora de la taula

Reflex-Session: ${sessio}
Intent-SHA256: ${intentSha256}
Rules-SHA256: ${rulesSha256}
Plan-SHA256: ${planSha256}

## Context

El 261009 MarIA va crear el pla de l'Onada 7 amb document.mjs create, la ruta pla.implementacio i el nom 261009_1203_pla_onada7.md. Un nom pla_ és de la ruta planificacio, però deliverContext no ho mirava: el rebut va nàixer lligat al nom dolent, i la porta de plantilla viva només ho va dir quan es va desar, amb un missatge que posava un id de ruta on el lector esperava un prefix de nom. Ho va resoldre reanomenant el document i fent-ne el handoff. El handoff tampoc no mirava el nom, la recuperació que imprimix la porta proposava el nom vell, i un nom planificacio_ (l'id de la ruta usat com a categoria) no es vigilava. A més, draft-write i import afegien l'àncora al final de l'índex, i ara el final de l'índex és la secció dels arxivats que la neteja poda: tres actes vives hi han caigut. El paquet complet viu al laboratori ${REL_LAB}, amb substitucions exactes a nous/substitucions.json, provat a tests/laboratori-onada7-261009.test.js contra una còpia del repositori.

## Tasques

- tooling/documental/core.mjs: el catàleg de noms vigilats, amb prefixosDeRuta, nomIRuta, paranyDelNom i nomPerALaRuta.
- tooling/documental/turns.mjs: deliverContext i handoffDocument rebutgen el nom incoherent amb la ruta abans de tocar el registre.
- tooling/gates/porta-plantilla-viva.mjs: reexporta el catàleg, diu el prefix que ha de portar el nom i recupera amb un nom que context admet.
- tooling/documental/draft-write.mjs i tooling/documental/import.mjs: les àncores de fora del primer nivell van a la secció «Actes i documents fora de la taula», i l'import ancora com create.
- tests/documental.test.mjs, tests/porta-olivera-v3.test.mjs, tests/cognitive-preflight.test.mjs i tests/plantilla-viva-installacio.test.mjs: proves noves i rebuts d'abans de la guarda reescrits com els vells.

Fitxers del pla (${targets.length}): ${targets.join(', ')}.

## Riscos

- Entre el seal i l'executor no pot canviar res del repositori: el Reflex compara l'estat de git sencer.
- Si un altre paquet toca un d'estos fitxers abans, el pla es nega per deriva i s'ha de refer.
- Un rebut emés abans de la guarda continua al seu torn: la porta de plantilla viva el para en desar, com fins ara, i en recuperar proposa el reanomenat amb handoff.
- Un nom planificacio_ passa a ser vigilat: els hooks d'escriptura i la porta de plantilla viva el paren on abans el deixaven passar.
- porta-olivera --renomena no mira la ruta (la porta no importa el circuit documental): el handoff que ve després sí, i un reanomenat dolent es desfà amb el retorn que imprimix.
- Si l'executor falla a mitges, el pending bloqueja noves mutacions fins a una reconciliació revisada.

## Criteris d'acceptació

- L'executor torna valid:true i deixa una transacció a ${TRANSACCIONS} amb operationId ${OPERACIO}.
- Passen node --test tests/documental.test.mjs tests/porta-olivera-v3.test.mjs tests/cognitive-preflight.test.mjs tests/plantilla-viva-installacio.test.mjs sense cap fallada nova.
- npx vitest run tests/laboratori-onada7-261009.test.js es retira sol i node tooling/gates/segella.mjs diu intacte.
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
  const { plan, scopes, targets, fitxers } = await preparaPla(root, { sessio: sessio ?? SESSIO_ZERO });
  console.log(`Pla vàlid: ${targets.length} fitxers, ${Buffer.byteLength(JSON.stringify(plan))} bytes.`);
  for (const f of fitxers) console.log(`  ${f.estat === 'pendent' ? 'M' : '='} ${f.ruta} · ${f.canvis} canvi(s) · còpia de nous/: ${f.lectura}`);
  if (!sessio) {
    console.log('');
    console.log("Ordre d'open (vegeu el LLEGIU_PRIMER, §4):");
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
  const opts = { ruta: null };
  for (const a of resta) {
    const m = /^--session=([0-9a-f-]{36})$/i.exec(a);
    if (m) opts.sessio = m[1];
    else if (ordre === 'mostra' && !a.startsWith('--') && opts.ruta === null) opts.ruta = a;
    else throw new Error(`Argument desconegut: ${a}. ${US}`);
  }
  return { ordre, ...opts };
}

/** La CLI. `root` només el canvien les proves; el Mestre l'executa des de l'arrel. */
export async function main(argv, { root = ARREL } = {}) {
  const { ordre, sessio, ruta } = parseArgs(argv);
  if (ordre === 'pla') {
    if (!sessio) console.error('[prepara-pla] Sense --session: pla amb la sessió zero, només per a revisar-lo.');
    const { plan } = sessio ? await preparaSessio(root, sessio) : await preparaPla(root);
    process.stdout.write(`${JSON.stringify(plan)}\n`);
  } else if (ordre === 'comprova') await comprova(root, sessio);
  else if (ordre === 'petorreta') process.stdout.write((await preparaSessio(root, sessio)).petorreta);
  else if (ordre === 'manifest') process.stdout.write(manifest());
  else if (ordre === 'mostra') {
    if (!ruta) throw new Error(`Cal la RUTA del fitxer. ${US}`);
    process.stdout.write(mostra(root, ruta));
  } else throw new Error(US);
}

// La guarda que no salta mai és `file://${argv[1]}`: l'arrel té espais (memòria del projecte).
function esEntrada() {
  try { return Boolean(process.argv[1]) && pathToFileURL(fs.realpathSync(process.argv[1])).href === import.meta.url; }
  catch { return false; }
}
if (esEntrada()) {
  main(process.argv.slice(2)).catch((e) => { console.error(`[prepara-pla] ${e.message}`); process.exitCode = 1; });
}
