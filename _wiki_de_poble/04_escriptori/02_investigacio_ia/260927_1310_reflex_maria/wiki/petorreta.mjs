#!/usr/bin/env node
/**
 * petorreta.mjs — Una sola ordre per a una petorreta local i el seu Pla.
 *
 * DESTÍ: tooling/wiki/petorreta.mjs (laboratori 260927_1310_reflex_maria/wiki/).
 * Els imports ja són els de la ubicació final: instal·lar és copiar.
 *
 * El forat que tapa. MarIA escriu des d'Antigravity, que no executa cap porta
 * (`.agents/hooks.json:2`). Per a ella, el camí correcte eren cinc ordres amb
 * identificador de torn (obrir torn, context, create, completar, check) i el
 * camí curt, un sol write_to_file. Sense barrera, guanya el curt. Ací el camí
 * correcte passa a ser el més barat: una ordre obri el torn, entrega les dues
 * plantilles amb rebut, crea el Pla i la petorreta amb la mateixa hora
 * termodinàmica i ompli la secció 0 amb fets calculats. Una casella només porta
 * [x] si esta eina ha fet la comprovació; mai és una declaració de l'autor.
 *
 * No toca res fins que sap que pot acabar: comprova les opcions, l'Escriptori
 * (`ranci()` de porta-olivera), que cap dels dos noms existix, l'esquema del
 * frontmatter i que el lock de `writeIndexedDraft` és lliure. Un rebut per a un
 * fitxer que després no naix bloqueja el torn per sempre (rebut fantasma), per
 * això tot això es mira abans d'obrir-lo. Després, cada document reutilitza el
 * seu únic rebut en els reintents d'escriptura (lock ocupat o CAS de l'índex);
 * si tot i així no naix, l'error ho diu amb eixes paraules i dona el torn per
 * inservible.
 *
 * No vincula el Pla (`document.mjs plan`): el vincle guarda el hash, i el Pla
 * encara s'ha d'omplir i aprovar. Ho diu l'eixida, pas a pas.
 *
 * Ús:
 *   node tooling/wiki/petorreta.mjs --actor maria --per claude,codex \
 *     --cognom perfil_empresa --titol "Perfil d'empresa" \
 *     --descripcio "12-220 caràcters" [--model "…"] [--tokens "…"]
 *
 * Eixida: JSON amb turn_id, rutes, rebuts, seccions [pendent] i les ordres de
 * validació. Exit 1 si no ha pogut generar o si queda cap error estructural.
 */
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { esMain, CAMINS } from '../lib/arrel.mjs';
import { ROOT, options } from '../documental/cli.mjs';
import { DESK, parseDocument, sections, receiptPattern, loadContract, resolveRoute, validateSchema } from '../documental/core.mjs';
import { checkDraftDestinations, writeIndexedDraft } from '../documental/draft-write.mjs';
import { openTurn, readTurn, validateDocument, ownPaths, deliverContext } from '../documental/turns.mjs';
import { avui, ranci, plaDeHui, ancoratge } from '../gates/porta-olivera.mjs';
import { draft } from './document.mjs';

export const DESTINATARIS = Object.freeze(['claude', 'codex']);
const SLUG = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;
const ACTOR = /^[a-z0-9][a-z0-9_-]{0,39}$/;
const FILA = /^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/gm;
const SECCIO_0_PENDENT = /^(## 0\.[ \t]+Abans de generar[^\n]*\n\n)\[pendent\]$/m;
const SECCIO_0 = /^##[ \t]+0\.[ \t]+Abans de generar[^\n]*\n([\s\S]*?)(?=^#{1,2}[ \t]+|(?![\s\S]))/m;
const CASELLA_BUIDA = /^[ \t]*[-*+][ \t]+\[[ \t]\]/m;
const ESTAT_PLA = '**Estat del Pla:** [en elaboració | aprovat | acabat | descartat]';
// Lock i missatge de CAS de tooling/documental/draft-write.mjs (:69 i :12).
const LOCK_CREATE = path.posix.join(CAMINS.agents, 'runtime', 'document-create.lock');
const CAS_INDEX = 'Destí documental substituït, enllaçat o fora de l’arrel.';

const US = `Ús: node tooling/wiki/petorreta.mjs --actor NOM --per claude|codex|claude,codex --cognom SLUG --titol "TÍTOL" --descripcio "12-220 caràcters" [--model "MOTOR"] [--tokens "XIFRA o no exposat"]`;

/** Opcions netes o un error que diu què cal canviar. No toca el disc. */
export function normalitza({ actor, per, cognom, titol, descripcio, model, tokens } = {}) {
  const text = (v) => (typeof v === 'string' ? v.trim() : '');
  const errors = [];
  const a = text(actor), c = text(cognom), t = text(titol), d = text(descripcio);
  if (!ACTOR.test(a)) errors.push(`--actor: «${a}» no val; cal un nom curt en minúscules (ex.: maria)`);
  const dest = [...new Set(text(per).toLowerCase().split(',').map((x) => x.trim()).filter(Boolean))];
  if (!dest.length || dest.some((x) => !DESTINATARIS.includes(x))) errors.push(`--per: «${text(per)}» no val; usa claude, codex o claude,codex`);
  if (!SLUG.test(c) || c.length > 60) errors.push(`--cognom: «${c}» no és un slug (minúscules sense accents, xifres i «_», fins a 60 caràcters; ex.: perfil_empresa)`);
  if (!t || /[\r\n]/.test(t) || t.length > 200) errors.push('--titol: cal un títol d’una línia, fins a 200 caràcters');
  const n = [...d].length;
  if (n < 12 || n > 220 || /[\r\n]/.test(d)) errors.push(`--descripcio: cal una línia de 12 a 220 caràcters (en té ${n})`);
  for (const [nom, v] of [['--model', model], ['--tokens', tokens]]) {
    if (v !== undefined && (!text(v) || /[\r\n|]/.test(text(v)))) errors.push(`${nom}: cal un valor d’una línia sense «|»`);
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return { actor: a, per: dest, cognom: c, titol: t, descripcio: d, model: text(model) || null, tokens: text(tokens) || null };
}

/** Hora termodinàmica `aammdd_hhmm`, en hora local com els noms de fitxer. */
export function segell(ara = new Date()) {
  const p = (x) => String(x).padStart(2, '0');
  return `${avui(ara)}_${p(ara.getHours())}${p(ara.getMinutes())}`;
}

/** Data i hora locals, les mateixes que porta el nom del fitxer. */
function horaLocal(d) {
  const p = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())} (hora local)`;
}

/** Pausa síncrona i acotada: el generador és síncron de dalt a baix. */
const dorm = (ms) => { if (ms > 0) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); };

/** Contenció passatgera: un altre create té el lock, o algú ha tocat l'índex entre la lectura i el rename. */
const passatger = (e) => (e?.code === 'EEXIST' && typeof e.path === 'string' && path.basename(e.path) === path.posix.basename(LOCK_CREATE)) || e?.message === CAS_INDEX;

/** `fer()` amb reintents només per a contenció passatgera; la resta d'errors ixen al primer intent. */
function ambReintents(fer, { reintents, espera }) {
  for (let intent = 1; ; intent += 1) {
    try { return fer(); }
    catch (e) { if (intent >= reintents || !passatger(e)) throw e; dorm(espera); }
  }
}

/** Seccions i files del Registre que encara diuen exactament «[pendent]». */
export function pendents(raw) {
  const s = sections(parseDocument(raw).body);
  return {
    seccions: [...s].filter(([, cos]) => /^\[pendent\]$/i.test(cos)).map(([nom]) => nom),
    registre: [...(s.get('Registre') || '').matchAll(FILA)].filter((m) => m[2].trim() === '[pendent]').map((m) => m[1].trim()),
  };
}

const llig = (root, rel) => fs.readFileSync(path.join(root, rel), 'utf8');

/** El rebut del frontmatter, només si el registre del torn el reconeix per a este fitxer i esta ruta. */
function rebutDe(root, rel, route, turnId) {
  const reflex = parseDocument(llig(root, rel)).data.reflex;
  const m = typeof reflex === 'string' ? receiptPattern.exec(reflex) : null;
  if (!m || m[1] !== turnId) return null;
  const receipt = readTurn(root, m[1]).receipts[m[2]];
  return receipt && receipt.file === rel && receipt.route === route ? reflex : null;
}

/** Substitució amb CAS: temporal al costat i rename; si el fitxer ha canviat, no s'escriu. */
function reescriu(root, rel, abans, despres) {
  if (abans === despres) return;
  const file = path.join(root, rel);
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) throw new Error(`Destí substituït o enllaçat: ${rel}`);
  const tmp = `${file}.${randomUUID()}.tmp`;
  try {
    fs.writeFileSync(tmp, despres, { flag: 'wx', mode: stat.mode & 0o777 });
    if (fs.readFileSync(file, 'utf8') !== abans) throw new Error(`Escriptura concurrent a ${rel}; no es sobreescriu`);
    fs.renameSync(tmp, file);
  } finally { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); }
}

/** Files del Registre que l'eina sap de cert. Mai inventa telemetria: sense valor, queda [pendent]. */
function registre(raw, { destinataris = null, model, tokens }) {
  let out = raw;
  if (destinataris) out = out.replace(/^\| Propietari \| [^\n]*\|$/m, (fila) => `${fila}\n| Destinatari | ${destinataris.join(', ')} |`);
  if (model) out = out.replace(/^\| Model IA \| \[pendent\] \|$/m, () => `| Model IA | ${model} |`);
  if (tokens) out = out.replace(/^\| Tokens consumits \| \[pendent\] \|$/m, () => `| Tokens consumits | ${tokens} |`);
  return out;
}

/** Secció 0 amb fets calculats. Les etiquetes són les que llig porta-olivera (v1 i v2). */
function preflight({ ara, turnId, dia, rancis, pla, plaOk, plaReflex, propiReflex, senseAncora }) {
  const x = (ok) => (ok ? '[x]' : '[ ]');
  const linies = [
    `Preflight calculat per \`tooling/wiki/petorreta.mjs\` (${horaLocal(ara)}, torn \`${turnId}\`). Cada casella és una comprovació que ha fet l’eina en generar este fitxer, no una declaració de l’autor.`,
    '',
    `- ${x(!rancis.length)} **Escriptori classificat**: ${rancis.length} document(s) de jornades anteriors al primer nivell de \`${DESK}/\` (\`ranci()\` de porta-olivera, jornada ${dia})${rancis.length ? `: ${rancis.join(', ')}` : ''}.`,
    `- ${x(plaOk)} **Pla d'Implementació**: \`${path.posix.basename(pla)}\`, d’avui i amb el mateix segell i cognom, ${plaReflex ? `amb rebut \`${plaReflex}\` de la ruta pla.implementacio` : 'SENSE rebut vàlid al registre del torn'}.`,
    `- ${x(Boolean(propiReflex))} **Rebut obtingut** per a este fitxer: ${propiReflex ? `\`${propiReflex}\` (ruta prompt.local)` : 'cap rebut vàlid al registre del torn'}.`,
  ];
  if (senseAncora.length) linies.push(`- Avís no bloquejant: ${senseAncora.length} document(s) de l’Escriptori sense àncora a l’índex (${senseAncora.join(', ')}).`);
  return linies.join('\n');
}

/** Errors que no són una secció o una fila encara [pendent]: eixos són de contracte. */
function informe(root, rel, route, reflex) {
  const raw = llig(root, rel);
  const p = pendents(raw);
  const esperat = (e) => p.seccions.some((s) => e === `Secció absent o pendent: ${s}`) || p.registre.some((k) => e === `Registre: falta ${k}`);
  const estructurals = validateDocument(root, raw, rel, { closed: true }).filter((e) => !esperat(e));
  const s0 = SECCIO_0.exec(raw);
  if (s0 && CASELLA_BUIDA.test(s0[1])) estructurals.push('La secció 0 té caselles sense marcar: algun fet no s’ha pogut comprovar.');
  return { ruta: rel, route, reflex, pendents: p, estructurals };
}

/**
 * Genera el Pla i la petorreta en una sola passada. `arrel` s'injecta (proves);
 * `ara` fixa l'hora; `reintents`, `espera` i `escriu` fixen la contenció a les
 * proves. Llança un Error amb el motiu si no pot començar.
 */
export function generaPetorreta(arrel, opcions, { ara = new Date(), reintents = 5, espera = 200, escriu = writeIndexedDraft } = {}) {
  const o = normalitza(opcions);
  const root = fs.realpathSync(arrel);
  const dia = avui(ara), marca = segell(ara);

  const bruts = ranci(root, dia).map((d) => d.nom);
  if (bruts.length) {
    throw new Error(`Escriptori brut: ${bruts.length} document(s) de jornades anteriors damunt la taula (${bruts.join(', ')}). Classifica'ls abans de convocar ningú: node tooling/gates/porta-olivera.mjs --informe, i --arxiva per a moure'ls. No s'ha obert cap torn ni creat cap fitxer.`);
  }
  const pla = `${DESK}/${marca}_pla_implementacio_${o.cognom}.md`;
  const prompt = `${DESK}/${marca}_prompt_${o.cognom}.md`;
  for (const rel of [pla, prompt]) {
    try { checkDraftDestinations(root, path.join(root, rel)); }
    catch (e) { throw new Error(`${rel}: ${e.code === 'EEXIST' ? 'ja existix; tria un altre cognom o espera al minut següent' : e.message}. No s'ha obert cap torn.`); }
  }
  // L'esquema que createDraft comprova després d'emetre el rebut, ací abans d'obrir el torn.
  for (const route of ['pla.implementacio', 'prompt.local']) {
    const contract = loadContract(root, { route });
    const errors = validateSchema({ ...resolveRoute(contract, { route }).output, description: o.descripcio, visibility: 'private', reflex: 'sdp:previ' }, contract.schema);
    if (errors.length) throw new Error(`${route}: ${errors.join('; ')}. No s'ha obert cap torn.`);
  }
  // Un lock orfe de writeIndexedDraft faria fallar cada create després d'emetre el rebut.
  for (let intent = 1; fs.existsSync(path.join(root, LOCK_CREATE)); intent += 1) {
    if (intent >= reintents) throw new Error(`${LOCK_CREATE} ocupat: hi ha un altre create documental en curs o és un lock orfe. Si cap agent està creant documents, avisa el Mestre. No s'ha obert cap torn.`);
    dorm(espera);
  }

  const turn = openTurn(root, { actor: o.actor, scope: 'documents' });
  const crea = (route, file, title) => {
    let reflex = null;
    try {
      // createDraft desplegat: el rebut s'emet una vegada i els reintents d'escriptura el reutilitzen.
      const delivery = deliverContext(root, turn.turn_id, { route, file });
      reflex = delivery.reflex;
      const raw = draft(delivery, { title, description: o.descripcio, actor: o.actor });
      const errors = validateSchema({ ...delivery.route.output, description: o.descripcio, visibility: 'private', reflex }, loadContract(root, { templates: false }).schema);
      if (errors.length) throw new Error(errors.join('; '));
      ambReintents(() => escriu(root, path.join(root, file), raw), { reintents, espera });
    } catch (e) {
      const estat = reflex
        ? `Rebut fantasma: el torn ${turn.turn_id} té el rebut ${reflex} per a un fitxer que no ha nascut; torn inservible, no el reutilitzes.`
        : `Torn ${turn.turn_id} inservible, no el reutilitzes.`;
      const parcial = file !== pla && fs.existsSync(path.join(root, pla)) ? ` El pla ${pla} sí que s'ha creat i queda sense petorreta.` : '';
      throw new Error(`No s'ha pogut crear ${file} (${route}): ${e.message}. ${estat}${parcial} Quan el motiu estiga resolt, torna a executar petorreta.mjs: obrirà un torn nou.`);
    }
  };
  crea('pla.implementacio', pla, `Pla d'Implementació — ${o.titol}`);
  crea('prompt.local', prompt, o.titol);
  // Arbre compartit: el torn respon dels seus dos documents, no dels que escriuen els altres agents.
  ownPaths(root, turn.turn_id, [pla, prompt]);

  // Fets, mesurats després de crear: cap casella es dedueix de l'ordre d'execució.
  const plaReflex = rebutDe(root, pla, 'pla.implementacio', turn.turn_id);
  const propiReflex = rebutDe(root, prompt, 'prompt.local', turn.turn_id);
  const rancis = ranci(root, dia).map((d) => d.nom);
  const plaOk = Boolean(plaReflex) && plaDeHui(root, dia).some((d) => d.rel === pla);
  const { senseAncora } = ancoratge(root);

  const plaAbans = llig(root, pla);
  reescriu(root, pla, plaAbans, registre(plaAbans.replace(ESTAT_PLA, '**Estat del Pla:** en elaboració'), o));
  const promptAbans = llig(root, prompt);
  const cos0 = preflight({ ara, turnId: turn.turn_id, dia, rancis, pla, plaOk, plaReflex, propiReflex, senseAncora });
  const amb0 = promptAbans.replace(SECCIO_0_PENDENT, (_, cap) => cap + cos0);
  if (amb0 === promptAbans) throw new Error(`La plantilla prompt.local ha canviat: no trobe la secció 0 [pendent] a ${prompt}. Torn ${turn.turn_id} obert; avisa el Mestre.`);
  reescriu(root, prompt, promptAbans, registre(amb0, { ...o, destinataris: o.per }));

  const fitxers = { pla: informe(root, pla, 'pla.implementacio', plaReflex), petorreta: informe(root, prompt, 'prompt.local', propiReflex) };
  const errorsEstructurals = Object.values(fitxers).flatMap((f) => f.estructurals.map((e) => `${f.ruta}: ${e}`));
  const validacio = [pla, prompt].map((rel) => `node tooling/wiki/document.mjs check --file ${rel}`);
  return {
    valid: !errorsEstructurals.length,
    turn_id: turn.turn_id,
    actor: o.actor,
    destinataris: o.per,
    segell: marca,
    caducitat: turn.expiresAt,
    fitxers: Object.fromEntries(Object.entries(fitxers).map(([k, { estructurals, ...f }]) => [k, f])),
    preflight: { escriptoriNet: !rancis.length, pla: plaOk, rebut: Boolean(propiReflex), senseAncora },
    errorsEstructurals,
    seguent: [
      'Omple NOMÉS les seccions i files que diuen [pendent] (llista a fitxers.*.pendents). No toques «Context» ni «Protocol de la Reunió a l’Olivera»: són còpia literal de la plantilla i es comparen byte a byte.',
      'Model IA i Tokens consumits: el valor real o «no exposat». Mai una xifra inventada.',
      ...validacio.map((ordre) => `${ordre}  → ha d'eixir "valid": true. Si falla, para i avisa el Mestre.`),
      `Quan el Mestre aprove el Pla, i abans de ${horaLocal(new Date(turn.expiresAt))} (el torn caduca 24 h després d'obrir-se i document.mjs plan ja no l'accepta): node tooling/wiki/document.mjs plan --turn-id ${turn.turn_id} --file ${pla}`,
    ],
    validacio,
  };
}

function main() {
  const o = options();
  if (o.help) { console.log(US); return; }
  const root = path.resolve(o.arrel || ROOT);
  const r = generaPetorreta(root, { actor: o.actor, per: o.per, cognom: o.cognom, titol: o.titol, descripcio: o.descripcio, model: o.model, tokens: o.tokens });
  console.log(JSON.stringify(r, null, 2));
  process.exitCode = r.valid ? 0 : 1;
}

if (esMain(import.meta.url)) {
  try { main(); } catch (e) { console.error(JSON.stringify({ valid: false, error: e.message, us: US }, null, 2)); process.exitCode = 1; }
}
