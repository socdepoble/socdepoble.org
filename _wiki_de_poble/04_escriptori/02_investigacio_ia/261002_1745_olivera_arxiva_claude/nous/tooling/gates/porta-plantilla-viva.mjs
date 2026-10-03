#!/usr/bin/env node
/**
 * porta-plantilla-viva.mjs — Tractor Salvavides de MarIA.
 *
 * Cap `_prompt_` ni `_pla_` de l'Escriptori pot existir fora de la seua
 * plantilla viva. No és un recordatori: és un vigilant del sistema de fitxers,
 * i per això no depén de l'arnés de qui escriu (Antigravity no executa els
 * hooks de Claude Code, i MarIA escriu des d'Antigravity).
 *
 * El forat que tapa. `validateDocument` (tooling/documental/turns.mjs:109-113)
 * no sap quina ruta té un document sense rebut: hi afig l'error del `reflex`
 * i l'esquema, i ja no mira seccions, blocs fixos ni Registre. Un prompt escrit
 * a mà ix amb un sol error encara que li falte mig contracte. Esta porta
 * deduïx la ruta del nom (catàleg de `taxonomia_documental.md`) i els diu tots.
 *
 * Noms parany (261002, O13). L'identificador d'una ruta no és una categoria:
 * «el nom demana planificacio» es va llegir com a categoria i va nàixer
 * `planificacio_*`, fora de la taxonomia i fora de tota vigilància. Ara un nom
 * que comença per l'identificador d'una ruta de pla es vigila, i el missatge
 * diu el prefix correcte (`pla_implementacio_` o `pla_`), mai la id de la ruta.
 *
 * Dos nivells:
 *   estructura  el que s'exigix en desar: nom, rebut vinculat al fitxer, ruta
 *               del rebut coherent amb el nom, claus de frontmatter que porta
 *               la plantilla, esquema, `type`, seccions de la ruta en el seu
 *               ordre i sense afegits, blocs fixos literals i files del
 *               Registre. Una secció encara pot dir «[pendent]».
 *   complet     l'anterior més `validateDocument` sencer (tancament).
 *
 * Modes (un per invocació):
 *   --fitxer CAMÍ [--complet]   un document; JSON a l'eixida, exit 1 si falla
 *   --escriptori [--complet]    tots els vigilats del primer nivell
 *   --staged                    afegits o modificats a l'índex (pre-commit)
 *   --vigila [--quarantena] [--avisa]
 *                               vigilant de l'Escriptori. Sense --quarantena
 *                               només denuncia. Amb --quarantena mou a
 *                               `.sdp-paperera/plantilles/` el document SENSE
 *                               rebut que no passa, i hi deixa el motiu.
 *   --llancador                 imprimix el plist de launchd amb les rutes
 *                               d'esta màquina (no entren al repositori)
 *
 * Superfície declarada: primer nivell de `04_escriptori/`. Les subcarpetes
 * (`00_bandeja_d_entrada/` inclosa) queden fora: és on un humà esborranya a mà.
 * Mai mou un fitxer amb rebut ni un que cite un torn, perquè trencaria el
 * registre del torn: eixos es denuncien. Mai esborra res. Els documents que ja
 * hi eren en arrencar es denuncien i no es mouen (deute heretat).
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { arrelSegura, esMain } from '../lib/arrel.mjs';
import {
  DESK, json, parseDocument, loadContract, readContract, resolveRoute,
  validateSchema, sections, withoutCode, receiptPattern, relativePath
} from '../documental/core.mjs';
import { validateDocument, protectedTurnFiles } from '../documental/turns.mjs';

export const QUARANTENA = '.sdp-paperera/plantilles';
export const REGISTRE_VIGILANT = '.agents/runtime/plantilla-viva.log';
const NOM_TAXONOMIC = /^\d{6}_\d{4}_[a-z0-9_]+\.md$/;

/* Catàleg de taxonomia_documental.md restringit a prompts i plans, amb la
   ruta que admet cada categoria. El prefix més llarg guanya:
   `pla_implementacio_x` és pla_implementacio, no pla. */
export const CATEGORIES_VIGILADES = Object.freeze([
  ['pla_implementacio', Object.freeze(['pla.implementacio'])],
  ['macro_prompt', Object.freeze(['prompt.consell'])],
  ['micro_prompt', Object.freeze(['prompt.consell'])],
  ['petorreta', Object.freeze(['prompt.local', 'prompt.consell'])],
  ['prompt', Object.freeze(['prompt.local', 'prompt.consell'])],
  ['pla', Object.freeze(['planificacio'])],
]);

/* Noms parany (261002, O13): identificadors de ruta que pareixen categories.
   No són al catàleg i cap porta els vigilava; ara es vigilen i es corregixen. */
export const NOMS_PARANY = Object.freeze([
  ['planificacio', Object.freeze(['pla.implementacio', 'planificacio'])],
]);

/** Forma comparable d'un nom: sense accents, en minúscules i amb `_`. */
function forma(nom) {
  return nom.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9_.]+/g, '_');
}

/** Categoria vigilada d'un nom amb data i hora, o null. Tolera majúscules per a no deixar-ne escapar cap. */
export function categoriaDelNom(nom) {
  const m = /^\d{6}_\d{4}_(.+)\.md$/i.exec(nom);
  if (!m) return null;
  const resta = forma(m[1]);
  const trobada = CATEGORIES_VIGILADES.find(([c]) => resta === c || resta.startsWith(`${c}_`));
  return trobada ? trobada[0] : null;
}

/** Nom parany d'un nom amb data i hora (`planificacio_*`), o null. */
export function paranyDelNom(nom) {
  const m = typeof nom === 'string' ? /^\d{6}_\d{4}_(.+)\.md$/i.exec(nom) : null;
  if (!m) return null;
  const resta = forma(m[1]);
  const trobat = NOMS_PARANY.find(([p]) => resta === p || resta.startsWith(`${p}_`));
  return trobat ? trobat[0] : null;
}

/** Prefixos de nom (categories) que admet una ruta: per a dir el remei, mai la id de la ruta. */
export function prefixosDeRuta(routeId) {
  return CATEGORIES_VIGILADES.filter(([, rutes]) => rutes.includes(routeId)).map(([c]) => c);
}

const formaPrefixos = (prefixos) => prefixos.map((p) => `«aammdd_hhmm_${p}_…»`).join(' o ');

/** Un prompt o un pla, tant si el nom seguix la taxonomia com si no. */
export function vigilat(nom) {
  if (typeof nom !== 'string' || nom.startsWith('.') || !/\.md$/i.test(nom)) return false;
  if (/^\d{6}_\d{4}_/.test(nom)) return categoriaDelNom(nom) !== null || paranyDelNom(nom) !== null;
  return /(^|_)(prompt|petorreta|pla)(_|\.md$)/.test(forma(nom));
}

/** Rutes del contracte que pot tindre un document pel seu nom. */
export function rutesDelNom(nom) {
  const c = categoriaDelNom(nom);
  if (c) return CATEGORIES_VIGILADES.find(([k]) => k === c)[1];
  const p = paranyDelNom(nom);
  if (p) return NOMS_PARANY.find(([k]) => k === p)[1];
  const f = forma(nom);
  if (/(^|_)pla_(d_)?implementacio/.test(f)) return ['pla.implementacio'];
  if (/(^|_)pla(_|\.md$)/.test(f)) return ['planificacio'];
  return ['prompt.local', 'prompt.consell'];
}

/**
 * El remei d'un nom per a una ruta: el prefix que hi correspon, dit com a nom
 * de fitxer. Per a un nom parany sense ruta coneguda, els dos prefixos de pla.
 */
export function suggeriment(nom, routeId = null) {
  const parany = paranyDelNom(nom);
  const prefixos = routeId ? prefixosDeRuta(routeId) : parany ? ['pla_implementacio', 'pla'] : [];
  if (!prefixos.length) return null;
  const que = parany ? `«${parany}» és l'identificador d'una ruta, no una categoria` : 'el nom no correspon a la ruta';
  return `${que}: ${routeId ? `per a la ruta «${routeId}» ` : ''}el nom ha de començar per ${formaPrefixos(prefixos)}`;
}

/**
 * Revisió estructural pura: no llig disc. `route` ve del contracte carregat
 * amb plantilles (porta `output` i `fixedBlocks`).
 */
export function revisaEstructura({ nom, data, body, route, schema, registre = [] }) {
  const errors = [];
  if (!NOM_TAXONOMIC.test(nom)) errors.push(`nom: «${nom}» no seguix aammdd_hhmm_categoria_titol.md en minúscules`);
  for (const clau of Object.keys(route.output || {})) {
    if (!Object.hasOwn(data, clau)) errors.push(`frontmatter: falta «${clau}», que la plantilla porta`);
  }
  errors.push(...validateSchema(data, schema));
  if (data.type !== route.tipus) errors.push(`type: «${data.type ?? '(absent)'}», i la ruta ${route.id} exigix «${route.tipus}»`);

  const titols = [...withoutCode(body).matchAll(/^##\s+(.+?)\s*$/gm)].map((m) => m[1]);
  const esperades = route.seccions;
  for (const s of esperades) if (!titols.includes(s)) errors.push(`secció absent: «## ${s}»`);
  for (const s of new Set(titols)) {
    if (!esperades.includes(s)) errors.push(`secció fora de plantilla: «## ${s}» (posa-la com a ### dins d'una secció canònica)`);
    else if (titols.filter((t) => t === s).length > 1) errors.push(`secció repetida: «## ${s}»`);
  }
  const comunes = titols.filter((s) => esperades.includes(s));
  const ordre = esperades.filter((s) => comunes.includes(s));
  if (comunes.join('\u0000') !== ordre.join('\u0000')) errors.push(`ordre de seccions: la plantilla diu ${esperades.join(' → ')}`);

  const contingut = sections(body);
  for (const [s, esperat] of Object.entries(route.fixedBlocks || {})) {
    if (contingut.has(s) && contingut.get(s) !== esperat) errors.push(`bloc normatiu alterat: «${s}» ha de ser còpia literal de la plantilla`);
  }
  const files = new Set([...(contingut.get('Registre') || '').matchAll(/^\|\s*([^|]+?)\s*\|/gm)].map((m) => m[1].trim()));
  for (const k of registre) if (!files.has(k)) errors.push(`Registre: falta la fila «${k}»`);
  return errors;
}

/** Rebut del document al registre del torn. La caducitat del torn no n'anul·la la procedència. */
function rebutDelDocument(root, reflex, rel) {
  const m = typeof reflex === 'string' ? receiptPattern.exec(reflex) : null;
  if (!m) return { error: 'reflex: sense rebut de document.mjs context; la plantilla no s’ha entregat' };
  let turn;
  try { turn = json(path.join(root, '.agents/runtime/turns', `${m[1]}.json`)); }
  catch { return { error: `reflex: el torn ${m[1]} no és en este arbre` }; }
  const receipt = turn?.receipts?.[m[2]];
  if (turn?.turn_id !== m[1] || !receipt || receipt.id !== m[2]) return { error: 'reflex: el rebut no és al registre del torn' };
  if (receipt.file !== rel) return { error: `reflex: el rebut és de «${receipt.file}», no d'este fitxer` };
  return { receipt, id: `${m[1]}:${m[2]}` };
}

/** Revisa un TEXT (candidat o del disc). Torna {fitxer, ruta, rebut, errors}. */
export function inspeccionaText(root, rel, raw, { complet = false } = {}) {
  const nom = path.posix.basename(rel);
  const informe = { fitxer: rel, ruta: null, rebut: null, errors: [] };
  const parany = paranyDelNom(nom);
  let parsed;
  try { parsed = parseDocument(raw); }
  catch (e) {
    informe.errors.push(`frontmatter: ${e.message}`);
    if (parany) informe.errors.push(`nom: ${suggeriment(nom)}`);
    return informe;
  }

  const permeses = rutesDelNom(nom);
  let routeId = permeses[0], contract;
  const rebut = rebutDelDocument(root, parsed.data.reflex, rel);
  if (rebut.error) informe.errors.push(rebut.error);
  else {
    informe.rebut = rebut.id;
    routeId = rebut.receipt.route;
    if (!permeses.includes(routeId)) {
      const categoria = categoriaDelNom(nom);
      informe.errors.push(`ruta: el rebut és de la ruta «${routeId}», i un nom «${categoria ?? forma(nom).replace(/^\d{6}_\d{4}_/, '').split('_')[0]}_…» és de la ruta ${permeses.map((r) => `«${r}»`).join(' o ')}. Per a «${routeId}» el nom ha de començar per ${formaPrefixos(prefixosDeRuta(routeId))}`);
    }
    try { if (rebut.receipt.contractSnapshot) contract = readContract(root, rebut.receipt.contractSnapshot); }
    catch (e) { informe.errors.push(`contracte del rebut: ${e.message}`); }
  }
  if (parany) informe.errors.push(`nom: ${suggeriment(nom, rebut.error ? null : routeId)}`);
  try {
    contract ??= loadContract(root, { route: routeId });
    const route = resolveRoute(contract, { route: routeId });
    informe.ruta = route.id;
    informe.errors.push(...revisaEstructura({
      nom, data: parsed.data, body: parsed.body, route, schema: contract.schema, registre: contract.router.registre
    }));
  } catch (e) { informe.errors.push(`contracte: ${e.message}`); }
  if (complet) {
    for (const e of validateDocument(root, raw, rel, { closed: true })) if (!informe.errors.includes(e)) informe.errors.push(e);
  }
  return informe;
}

/** Revisa un document del disc. */
export function inspecciona(root, rel, opcions = {}) {
  let raw;
  try { raw = fs.readFileSync(path.join(root, rel), 'utf8'); }
  catch (e) { return { fitxer: rel, ruta: null, rebut: null, errors: [`lectura: ${e.message}`] }; }
  return inspeccionaText(root, rel, raw, opcions);
}

/** Ordres de recuperació: el document torna a nàixer de la plantilla, no de la memòria. */
export function recuperacio(rel, ruta = 'prompt.local') {
  const nom = path.posix.basename(rel);
  const net = NOM_TAXONOMIC.test(nom) ? rel : `${DESK}/AAMMDD_HHMM_categoria_titol.md`;
  return [
    'node tooling/gates/obrir_torn.mjs --actor NOM --scope documents',
    `node tooling/wiki/document.mjs context --turn-id ID --route ${ruta} --file ${net}`,
    'Llig sencera la plantilla que torna context.',
    `node tooling/wiki/document.mjs create --turn-id ID --route ${ruta} --file ${net} --title "TÍTOL" --description "DESCRIPCIÓ"`,
    `Completa les seccions [pendent] i valida: node tooling/gates/porta-plantilla-viva.mjs --fitxer ${net}`,
  ];
}

/** Mou a la paperera el document sense rebut que no passa. Mai el que té rebut o cita un torn. */
export function quarantena(root, rel, informe, { ara = new Date() } = {}) {
  if (informe.rebut) return { mogut: false, motiu: 'té rebut: es denuncia, no es mou' };
  if (path.posix.dirname(rel) !== DESK) return { mogut: false, motiu: 'fora del primer nivell de l’Escriptori' };
  if (protectedTurnFiles(root).has(rel)) return { mogut: false, motiu: 'el cita un torn' };
  const dir = path.join(root, QUARANTENA);
  fs.mkdirSync(dir, { recursive: true });
  const marca = ara.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  let desti = path.join(dir, path.posix.basename(rel));
  if (fs.existsSync(desti)) desti = path.join(dir, `${marca}_${path.posix.basename(rel)}`);
  fs.renameSync(path.join(root, rel), desti);
  const quarantenat = path.relative(root, desti).split(path.sep).join('/');
  const motiu = {
    fitxer: rel, quarantena: quarantenat, quan: ara.toISOString(), ruta: informe.ruta,
    errors: informe.errors, recuperacio: recuperacio(rel, informe.ruta || rutesDelNom(path.posix.basename(rel))[0])
  };
  fs.writeFileSync(`${desti}.rebuig.json`, `${JSON.stringify(motiu, null, 2)}\n`, { flag: 'wx' });
  return { mogut: true, desti: quarantenat };
}

function notifica(text) {
  if (process.platform !== 'darwin') return;
  try {
    execFileSync('osascript', ['-e', `display notification ${JSON.stringify(text)} with title "Plantilla viva"`], { stdio: 'ignore', timeout: 5000 });
  } catch { /* l'avís és un extra: el registre ja ho diu */ }
}

/** Documents vigilats del primer nivell de l'Escriptori. */
export function candidats(root) {
  const dir = path.join(root, DESK);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && vigilat(e.name)).map((e) => `${DESK}/${e.name}`).sort();
}

/** Afegits o modificats a l'índex, dins de la superfície. */
export function fitxersStaged(root) {
  const eixida = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'], { cwd: root, encoding: 'utf8' });
  return eixida.split('\0').filter(Boolean)
    .filter((f) => path.posix.dirname(f) === DESK && vigilat(path.posix.basename(f))).sort();
}

/** Bytes preparats a l'índex: el pre-commit jutja el que es commitejarà, no el disc. */
export function blobPreparat(root, rel) {
  return execFileSync('git', ['cat-file', 'blob', `:${rel}`], { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
}

/**
 * Vigilant de l'Escriptori. `revisor` i `log` s'injecten a les proves.
 * El fitxer mogut genera el seu propi esdeveniment; en no existir, s'ignora.
 */
export function vigila(root, { quarantena: moure = false, avisa = false, espera = 1500, revisor = inspecciona, log = console.log } = {}) {
  const dir = path.join(root, DESK);
  const pendents = new Map();
  const revisa = (nom) => {
    pendents.delete(nom);
    const rel = `${DESK}/${nom}`;
    let stat;
    try { stat = fs.lstatSync(path.join(root, rel)); } catch { return; }
    if (!stat.isFile() || stat.isSymbolicLink()) return;
    const informe = revisor(root, rel);
    if (!informe.errors.length) { log(`✅ [Plantilla viva] ${rel}`); return; }
    let accio;
    try { accio = moure ? quarantena(root, rel, informe) : { mogut: false, motiu: 'mode avís' }; }
    catch (e) { accio = { mogut: false, motiu: `no s'ha pogut moure: ${e.message}` }; }
    log(JSON.stringify({ t: new Date().toISOString(), ...informe, accio }));
    if (avisa) notifica(`${nom}: ${informe.errors.length} incompliments${accio.mogut ? ' · mogut a la paperera' : ''}`);
  };
  const watcher = fs.watch(dir, { persistent: true }, (_tipus, nom) => {
    const n = nom ? String(nom) : '';
    if (!n || n.includes('/') || !vigilat(n)) return;
    clearTimeout(pendents.get(n));
    pendents.set(n, setTimeout(() => revisa(n), espera));
  });
  return { tanca: () => { watcher.close(); for (const t of pendents.values()) clearTimeout(t); pendents.clear(); } };
}

export function plist(root, node = process.execPath) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const script = path.join(root, 'tooling/gates/porta-plantilla-viva.mjs');
  const log = path.join(root, REGISTRE_VIGILANT);
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>org.socdepoble.plantilla-viva</string>
  <key>ProgramArguments</key>
  <array>
    <string>${esc(node)}</string>
    <string>${esc(script)}</string>
    <string>--vigila</string>
    <string>--quarantena</string>
    <string>--avisa</string>
  </array>
  <key>WorkingDirectory</key><string>${esc(root)}</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>${esc(log)}</string>
  <key>StandardErrorPath</key><string>${esc(log)}</string>
</dict>
</plist>
`;
}

const US = 'Ús: porta-plantilla-viva.mjs --fitxer CAMÍ [--complet] | --escriptori [--complet] | --staged | --vigila [--quarantena] [--avisa] | --llancador';

function main(argv) {
  const root = arrelSegura();
  const te = (flag) => argv.includes(flag);
  const valor = (flag) => { const i = argv.indexOf(flag); return i >= 0 ? argv[i + 1] : undefined; };
  if (te('--llancador')) { process.stdout.write(plist(root)); return 0; }
  if (te('--vigila')) {
    const opcions = { quarantena: te('--quarantena'), avisa: te('--avisa') };
    const heretats = candidats(root).map((rel) => inspecciona(root, rel)).filter((i) => i.errors.length);
    for (const i of heretats) console.log(JSON.stringify({ t: new Date().toISOString(), heretat: true, ...i }));
    console.log(`👁️  [Plantilla viva] Vigilant ${DESK} · ${opcions.quarantena ? 'quarantena activa' : 'només denuncia'} · ${heretats.length} documents heretats fora de plantilla (es denuncien, no es mouen).`);
    vigila(root, opcions);
    return null;
  }
  let fitxers;
  if (te('--staged')) fitxers = fitxersStaged(root);
  else if (te('--escriptori')) fitxers = candidats(root);
  else if (valor('--fitxer')) fitxers = [relativePath(root, valor('--fitxer'), process.cwd())];
  else { console.error(US); return 2; }
  const complet = te('--complet');
  const informes = fitxers.map((rel) => (te('--staged')
    ? inspeccionaText(root, rel, blobPreparat(root, rel), { complet })
    : inspecciona(root, rel, { complet })));
  const dolents = informes.filter((i) => i.errors.length);
  console.log(JSON.stringify({ valid: dolents.length === 0, revisats: informes.length, informes: dolents }, null, 2));
  if (dolents.length) {
    console.error(`❌ [Plantilla viva] ${dolents.length} document(s) fora de plantilla. Un prompt o un pla naix de document.mjs, no de la memòria:`);
    for (const pas of recuperacio(dolents[0].fitxer, dolents[0].ruta || undefined)) console.error(`   ${pas}`);
  }
  return dolents.length ? 1 : 0;
}

if (esMain(import.meta.url)) {
  try {
    const codi = main(process.argv.slice(2));
    if (codi !== null) process.exitCode = codi;
  } catch (e) { console.error(`[Plantilla viva] ${e.message}`); process.exitCode = 2; }
}
