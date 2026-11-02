#!/usr/bin/env node
/** Consum acreditat · detector de només lectura del cicle documental de l'Escriptori (P2-12).
 *
 *  Port de `candidatsConsum()` del pegat de Claude 261025_1705 (`olivera.patch`), que ja no
 *  aplicava sobre la porta Olivera de B1 (L08). El motor viu ací, a part: la porta només
 *  n'exporta les funcions internes que fa servir este mòdul (cap canvi de comportament ni
 *  cap import nou), i ni `--informe`, ni el hook, ni el tancament el criden.
 *
 *  El problema (261025). `ranci()` només veu jornades anteriors, i draft-write declara viu,
 *  sense motiu, cada document que naix: l'onada 0545, consolidada i superada, es quedava a la
 *  taula amb la porta en verd. El detector reutilitza el motor de vida de la porta (torns,
 *  declaracions i motius) i separa dues coses:
 *    · «senseVida» (triatge): algun senyal del cicle de vida i cap motiu explícit;
 *    · «consumit» (consum acreditat): a més, l'última acta posterior que el cita en el cos no
 *      el manté viu, i el document és el de HEAD i el mateix que quan eixa acta es va
 *      consolidar. Porta consumidor, la línia que el cita, commit i hash.
 *  És una proposta per a l'Acte Reflex, no una lectura provada.
 *
 *  Només llig. No mou, no reanomena ni escriu res, i no té `--arxiva`: el Mestre o MarIA
 *  arxiven per nom amb `porta-olivera.mjs --arxiva --sec --nom F [--torn ID]` (i després sense
 *  `--sec`), que ja reapunta els enllaços dels vius (B1). De Git només fa `rev-parse`,
 *  `ls-tree` i `log -1`, sense les variables `GIT_*` del cridador i sense locks opcionals.
 *
 *  Fase «avis», sense bandera pròpia: el CLI ix amb 0 sempre que ha pogut comprovar la taula,
 *  haja candidats o no, i siga quina siga la fase de la convocatòria. Ix amb 2 si no ha pogut
 *  comprovar res (argument desconegut o estructura de l'Escriptori invàlida): cap verd fingit.
 *
 *  Ús:
 *    node tooling/documental/consum-acreditat.mjs          # informe llegible
 *    node tooling/documental/consum-acreditat.mjs --json   # el mateix, en JSON
 */
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { CAMINS, arrelSegura, esMain } from '../lib/arrel.mjs';
import {
  TRANSITORIES, avui, inventari, nomsSolts, prosaIndex, ranci,
  categoriaDe, curt, entrades, errorsEstructura, estatTorn, llegeixSiPots, perNomDe, reflexDe, referent, senseMd, tall, viusExactes,
} from '../gates/porta-olivera.mjs';

export const ESQUEMA = 'sdp.consum-acreditat.v1';

const ESCRIPTORI = CAMINS.escriptori;
const ARXIU = CAMINS.arxiuHistoric;
const ACTES = CAMINS.actes;
/** Registres de torn (turns.mjs), llegits amb fs com fa la porta. */
const TORNS = `${CAMINS.agents}/runtime/turns`;
const VIA_PORTA = 'node tooling/gates/porta-olivera.mjs';

/** Les mateixes formes que `porta-olivera.mjs` (la prova en vigila la deriva). */
export const FORMES = Object.freeze({
  NOM: /^(\d{6})_(\d{4})_([a-z0-9]+(?:_[a-z0-9]+)*)\.md$/,
  COMPOSTES: /^(pla_implementacio|macro_prompt|micro_prompt|macro_bundle|micro_bundle)(?=_|$)/,
  ANCORA: /(!?)\[\[([^[\]\n]+)\]\]/g,
});
const { NOM, COMPOSTES, ANCORA } = FORMES;

const existeix = (abs) => {
  try { fs.lstatSync(abs); return true; }
  catch (error) { if (error.code === 'ENOENT') return false; throw error; }
};

/* ── Senyals del cicle de vida ────────────────────────────────────────────── */

/** Categories que poden fer de prompt d'una auditoria (CONS-D). */
const PROMPTS = /^(prompt|macro_prompt|micro_prompt|petorreta)$/;
/** Nom termodinàmic citat amb `.md` en prosa o en codi, com els cita una acta. */
const NOM_CITAT = /(?<![A-Za-z0-9_])(\d{6}_\d{4}_[a-z0-9]+(?:_[a-z0-9]+)*\.md)(?![A-Za-z0-9_])/g;
/** `aammddhhmm`: l'ordre termodinàmic dels noms, comparable com a text. */
const clauDe = (d) => `${d.data}${d.hora}`;
const perClau = (a, b) => clauDe(a).localeCompare(clauDe(b));
const esPla = (d) => /^pla_implementacio(?:_|$)/.test(d.resta);
/**
 * El text sense comentaris HTML, en una passada (G1-B-seg-03): sense regex, cap retrocés amb un
 * «<!--» sense tancar. El «-->» es busca després de l'obertura sencera i el primer tanca. Sense
 * «-->», la cua es queda tal qual, com feia la regex d'abans: no s'amaga cap línia que podria
 * mantindre viu el document (lectura prudent).
 */
function senseComentaris(text) {
  const font = String(text ?? '');
  let eixida = '';
  let i = 0;
  for (;;) {
    const obri = font.indexOf('<!--', i);
    if (obri < 0) return eixida + font.slice(i);
    const tanca = font.indexOf('-->', obri + 4);
    if (tanca < 0) return eixida + font.slice(i);
    eixida += font.slice(i, obri);
    i = tanca + 3;
  }
}
/**
 * Títol (el nom sense data ni categoria) que només diu qui l'escriu, com `auditoria_claude`, o
 * buit: dos documents així poden ser de dues onades, i el més nou no substituïx el vell (CONS-B).
 */
const TITOL_DE_IA = /^(?:(?:claude|codex|gemini\d*|opus|chatgpt|gpt\d*|maria|iaia)(?:_|$))*$/;
const titolDe = (resta) => resta.slice((COMPOSTES.exec(resta)?.[1] ?? resta.split('_')[0]).length + 1);
/**
 * Paraules que, en la línia d'una acta que cita un document o en una capçalera damunt d'ella (el
 * títol inclòs: una acta de relleu passa la feina al torn següent), el mantenen viu: un relleu, un
 * pendent, una feina en curs o per fer, el punt de partida del torn següent. Tres actes de la
 * història de la taula el citaven així (261007_0025: «Passar el prompt de relleu … perquè inicie
 * la propera marató»; 261014_2050: «Auditoria Claude: En curs a …»; 261022_0235: «El següent torn
 * ha de partir d'esta acta i dels límits de …»). Una paraula de més només deixa el document en
 * triatge.
 */
const VIU_EN_ACTA = /(?<![\p{L}\p{N}_])(?:(?:pendents?|en curs|relleus?|vigents?|vius?|viva|vives|proper(?:a|s|es)?|pr[oò]xim(?:a|s|es)?|seg[uü]ents?|continu(?:a|ar|arà|en)|encara|esborranys?|a mitges|inacaba(?:t|da|ts|des)|obert(?:a|s|es)?|(?:encet|inici|comen[cç]|prepar)(?:at|ada|ats|ades)|preparaci[oó]|llest(?:a|s|es)?|a punt|per fer|(?:re)?llegir|revisar|entregar|llançar)(?![\p{L}\p{N}_])|parti(?:r|nt) d[e'’])/iu;
/** Element de llista amb la casella sense marcar, també dins de codi en línia: feina per fer (261009_0745). */
const CASELLA_OBERTA = /^[ \t]*(?:[-*+]|\d+\.)[ \t]+`?\[ \]`?/;
/**
 * «](destí)» → «]», en una passada (ARB-F3I3-01): la regex d'abans, `/\]\([^)\n]*\)/g`, tornava a
 * recórrer la línia fins al final per cada «](» sense «)». La mateixa lectura: el destí acaba en el
 * primer «)», no creua cap salt de línia, i sense «)» el text es queda tal qual. `tanca` i `salt`
 * només avancen.
 */
function senseDestins(text) {
  let eixida = '';
  let i = 0;
  let tanca = -1;
  let salt = -1;
  for (;;) {
    const obri = text.indexOf('](', i);
    if (obri < 0) return eixida + text.slice(i);
    if (tanca < obri + 2) {
      tanca = text.indexOf(')', obri + 2);
      if (tanca < 0) return eixida + text.slice(i);
    }
    if (salt < obri + 2) {
      salt = text.indexOf('\n', obri + 2);
      if (salt < 0) salt = Infinity;
    }
    // Un salt abans del «)» fa caure tots els «](» d'abans del salt: es reprén darrere d'ell.
    if (salt < tanca) {
      eixida += text.slice(i, salt + 1);
      i = salt + 1;
      continue;
    }
    eixida += `${text.slice(i, obri)}]`;
    i = tanca + 1;
  }
}
/** Prosa d'una línia: sense àncores, codi en línia ni destins d'enllaç, on viuen els noms dels fitxers. */
const prosaDe = (linia) => senseDestins(linia.replace(/!?\[\[[^[\]\n]*\]\]/g, ' ').replace(/`[^`\n]*`/g, ' '));

/** Blob de git d'un fitxer (sha1 de «blob <mida>\0<bytes>»): el hash del candidat i el que guarda HEAD. */
function blobDe(abs) {
  try {
    const bytes = fs.readFileSync(abs);
    return crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
  } catch { return null; }
}

/**
 * Què guarda HEAD del primer nivell de l'Escriptori i de les actes: `{ commit, blobs, versioEn }`
 * (camí → blob). `versioEn(acta, document)` diu quin commit va consolidar per última vegada
 * l'acta i quin blob tenia el document en eixe commit (null si encara no hi era): la versió que
 * l'acta podia haver llegit. Es calcula a demanda, una sola vegada per acta. Només llig:
 * `git rev-parse`, `git ls-tree` i `git log -1`. Fora d'un repositori, sense git o si l'arrel no
 * és la del repositori torna null, i llavors cap consum queda acreditat.
 */
export function capDeGit(arrel) {
  // Sense GIT_DIR, GIT_INDEX_FILE… del cridador (un hook o un índex temporal) i sense locks opcionals.
  const env = { ...Object.fromEntries(Object.entries(process.env).filter(([clau]) => !clau.startsWith('GIT_'))), GIT_OPTIONAL_LOCKS: '0' };
  const git = (args) => spawnSync('git', ['-C', arrel, ...args], { encoding: 'utf8', env, timeout: 10000, maxBuffer: 32 * 1024 * 1024 });
  const rev = git(['rev-parse', '--show-toplevel', '--short', 'HEAD']);
  if (rev.error || rev.status !== 0) return null;
  const [top, commit] = rev.stdout.trim().split('\n');
  try { if (!top || !commit || fs.realpathSync(top) !== fs.realpathSync(arrel)) return null; }
  catch { return null; }
  const ls = git(['ls-tree', '-z', 'HEAD', '--', `${ESCRIPTORI}/`, `${ACTES}/`]);
  if (ls.error || ls.status !== 0) return null;
  const blobs = new Map();
  for (const entrada of ls.stdout.split('\0').filter(Boolean)) {
    const m = /^\d+ blob ([0-9a-f]{40,64})\t([\s\S]+)$/.exec(entrada);
    if (m && [ESCRIPTORI, ACTES].includes(path.posix.dirname(m[2]))) blobs.set(m[2], m[1]);
  }
  const consolidacions = new Map();
  const versioEn = (acta, document) => {
    if (!consolidacions.has(acta)) {
      const log = git(['log', '-1', '--format=%H %h', 'HEAD', '--', acta]);
      const [llarg, curtCommit] = !log.error && log.status === 0 ? log.stdout.trim().split(' ') : [];
      consolidacions.set(acta, llarg && curtCommit ? { llarg, curt: curtCommit } : null);
    }
    const c = consolidacions.get(acta);
    if (!c) return null;
    const r = git(['rev-parse', '-q', '--verify', `${c.llarg}:${document}`]);
    return { commit: c.curt, blob: !r.error && r.status === 0 ? r.stdout.trim() : null };
  };
  return { commit, blobs, versioEn };
}

/**
 * CONS-A: el torn del rebut ja no sosté el document. Compten l'estat «closed», el rebut que és
 * d'un altre fitxer i la caducitat, esta només en un document d'una jornada anterior: un torn
 * viu 24 hores i pot fer nàixer hui un document de l'onada en curs. Cap d'ells no prova la
 * lectura: són triatge. Un rebut que encara diu el nom vell, absent de la taula, és el relleu
 * pendent d'un `--renomena` (`pendent`) mentre el torn siga obert i vigent: el document no és
 * candidat fins al handoff. Amb el torn tancat o caducat eixe handoff ja no es pot fer, i el
 * rebut és un senyal més. Un registre absent o il·legible no prova res.
 */
function senyalTorn(arrel, d, reflex, { dia, ara }) {
  if (!reflex) return null;
  let registre;
  try { registre = JSON.parse(fs.readFileSync(path.join(arrel, TORNS, `${reflex.torn}.json`), 'utf8')); }
  catch { return null; }
  if (registre?.turn_id !== reflex.torn || registre.schema !== 'sdp.turn.v1') return null;
  const rebut = registre.receipts?.[reflex.rebut];
  const fitxer = rebut?.id === reflex.rebut && typeof rebut.file === 'string' ? path.posix.normalize(rebut.file) : null;
  const obert = registre.state !== 'closed' && Date.parse(registre.expiresAt) > ara;
  if (fitxer && fitxer !== d.rel) {
    if (path.posix.dirname(fitxer) === ESCRIPTORI && !existeix(path.join(arrel, fitxer))) {
      return obert
        ? { pendent: true, text: `relleu pendent des de ${fitxer}` }
        : { codi: 'CONS-A', text: `el rebut de ${curt(reflex.torn)} encara diu ${fitxer}, que ja no és a la taula, i el torn ${registre.state === 'closed' ? 'està tancat' : 'ha caducat'}: el relleu ja no es pot fer` };
    }
    return { codi: 'CONS-A', text: `el rebut de ${curt(reflex.torn)} és de ${fitxer}` };
  }
  if (registre.state === 'closed') return { codi: 'CONS-A', text: `${curt(reflex.torn)} ja està tancat` };
  if (!(Date.parse(registre.expiresAt) > ara) && d.data < dia) {
    return { codi: 'CONS-A', text: `${curt(reflex.torn)} ha caducat (${registre.expiresAt}) i el document és d'una jornada anterior` };
  }
  return null;
}

/**
 * Motiu explícit de la línia d'«Activitat en curs» que protegix un candidat: una retenció del
 * Mestre o un `torn_ID` obert. Els `per a [[consumidor]]` es tornen a banda: protegixen mentre
 * el consumidor no siga candidat ell mateix. Ni la declaració nua ni el rebut implícit del
 * frontmatter no hi compten: draft-write declara viu cada document que naix.
 */
function proteccioDe(arrel, nom, linies, { dia, ara }) {
  const consumidors = [];
  for (const m of linies.flatMap((l) => l.motius)) {
    if (m.tipus === 'mestre' && m.data <= dia && m.motiu.length >= 3) return { explicita: `Mestre ${m.data}: ${tall(m.motiu)}`, consumidors };
    if (m.tipus === 'torn' && estatTorn(arrel, m.torn, ara).valid) return { explicita: `${curt(m.torn)} obert`, consumidors };
    if (m.tipus === 'consumidor') consumidors.push(...m.consumidors.map((c) => c.nom).filter((c) => c && c !== nom));
  }
  return { explicita: null, consumidors };
}

/** Noms dels fitxers de l'arxiu (l'arrel i les carpetes de sessió): només noms, mai contingut. */
function nomsArxivats(arrel) {
  const carpetes = [ARXIU, ...entrades(arrel, ARXIU).filter((e) => e.isDirectory()).map((e) => `${ARXIU}/${e.name}`)];
  return new Set(carpetes.flatMap((rel) => entrades(arrel, rel).filter((e) => e.isFile()).map((e) => e.name)));
}

/**
 * Prompts que cita una auditoria pel nom, frontmatter inclòs: àncores i noms amb `.md`. Cada un
 * és a la taula o ja a l'arxiu; un nom que no és enlloc no compta. L'hora no hi entra: un prompt
 * d'una altra línia de treball nascut abans no és el seu prompt.
 */
function promptsCitats(text, nom, presents, arxivats) {
  const net = senseComentaris(text);
  const refs = [...[...net.matchAll(ANCORA)].map((a) => path.posix.basename(referent(a[2], false))), ...[...net.matchAll(NOM_CITAT)].map((m) => m[1])];
  const out = new Map();
  for (const ref of refs) {
    const fitxer = ref.endsWith('.md') ? ref : `${ref}.md`;
    const m = NOM.exec(fitxer);
    if (!m || fitxer === nom || !PROMPTS.test(categoriaDe(m[3]))) continue;
    if (presents.has(fitxer)) out.set(fitxer, { nom: fitxer, arxivat: false });
    else if (arxivats.has(fitxer)) out.set(fitxer, { nom: fitxer, arxivat: true });
  }
  return [...out.values()];
}

/** El text cita el document pel nom: una àncora (amb camí, àlies o fragment) o el nom amb `.md`. */
function patroDeCita(nom) {
  const tija = senseMd(nom).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![A-Za-z0-9_])${tija}(?:\\.md(?![A-Za-z0-9_])|(?=\\]\\]|\\\\?\\||#))`);
}
const citaPelNom = (text, nom) => patroDeCita(nom).test(text);

/**
 * Línies del cos d'una acta que citen el document, cadascuna amb `viu`: el text que el manté viu
 * (VIU_EN_ACTA o CASELLA_OBERTA), siga la mateixa línia o una de les capçaleres sota les quals
 * cau, o null. El frontmatter i «## Vincles» no compten: una àncora de vincle no diu res del
 * consum. Les capçaleres es lligen dues vegades: en prosa (prosaIndex), on un «# …» dins d'una
 * tanca de codi no obri secció ni buida «## Pendents», i en cru, com el pegat 1705, on una tanca
 * que no es tanca no amaga les seccions de davall. Mana la lectura prudent: una línia és viva, o de
 * Vincles, si ho diu qualsevol de les dues (una capçalera de més només deixa el document en triatge).
 */
export function citesEnActa(text, nom) {
  const net = senseComentaris(text);
  const linies = net.split('\n');
  // prosaIndex només emmascara (conserva els salts): la línia i de la prosa és la línia i del text.
  const prosa = prosaIndex(net).split('\n');
  let i = 0;
  if (linies[0]?.trim() === '---') {
    const fi = linies.findIndex((l, j) => j > 0 && l.trim() === '---');
    i = fi > 0 ? fi + 1 : 0;
  }
  const cita = patroDeCita(nom);
  const enProsa = [];
  const enCru = [];
  const apila = (pila, nivell, titol) => {
    while (pila.length && pila.at(-1).nivell >= nivell) pila.pop();
    pila.push({ nivell, text: titol });
  };
  const out = [];
  for (; i < linies.length; i++) {
    const linia = linies[i];
    // El blanc es pren sencer, `(?![ \t])` (COR-F3I3-01): sense això, «#», milers d'espais i un «\r»
    // tornaven a provar cada tall del blanc, amb un cost quadràtic. Es reconeixen les mateixes capçaleres.
    const h = /^(#{1,6})[ \t]+(?![ \t])(.*)$/.exec(linia);
    if (h) {
      apila(enCru, h[1].length, h[2].trim());
      if (/^#{1,6}[ \t]/.test(prosa[i] ?? '')) apila(enProsa, h[1].length, h[2].trim());
    }
    const capcaleres = [...enProsa, ...enCru];
    if (capcaleres.some((c) => c.nivell === 2 && /^Vincles\b/i.test(c.text)) || !cita.test(linia)) continue;
    const viu = CASELLA_OBERTA.test(linia) || VIU_EN_ACTA.test(prosaDe(linia)) ? linia
      : capcaleres.map((c) => c.text).find((t) => VIU_EN_ACTA.test(prosaDe(t))) ?? null;
    out.push({ linia: tall(linia.trim(), 240), viu: viu === null ? null : tall(viu.trim(), 240) });
  }
  return out;
}

/**
 * Un germà d'onada que l'acta manté viu: un document amb el mateix aammdd_hhmm (la Trinitat de
 * pla i prompts naix amb la mateixa hora) o un dels prompts que cita l'auditoria. Una acta de
 * convocatòria nomena el pla com a «vigent» i el prompt al costat sense cap paraula: el prompt
 * tampoc no és consumit (261013_1420, 261022_1450).
 */
function germaViu(text, d, prompts = []) {
  const prefix = `${d.data}_${d.hora}_`;
  const citats = [...[...text.matchAll(NOM_CITAT)].map((m) => m[1]), ...[...text.matchAll(ANCORA)].map((a) => `${path.posix.basename(referent(a[2]))}.md`)];
  const germans = new Set([...citats.filter((n) => n.startsWith(prefix)), ...prompts].filter((n) => n !== d.nom));
  for (const nom of germans) {
    const viva = citesEnActa(text, nom).find((c) => c.viu);
    if (viva) return { nom, linia: viva.viu };
  }
  return null;
}

/** Actes, la destil·lació d'una onada: les de 10_actes/ i les del primer nivell de la taula. */
function actesDe(arrel) {
  const de = (rel) => entrades(arrel, rel).filter((e) => e.isFile()).map((e) => {
    const m = NOM.exec(e.name);
    return m && categoriaDe(m[3]) === 'acta' ? { nom: e.name, rel: `${rel}/${e.name}`, data: m[1], hora: m[2] } : null;
  }).filter(Boolean);
  return [...de(ACTES), ...de(ESCRIPTORI)];
}

/* ── El detector ──────────────────────────────────────────────────────────── */

/**
 * Candidats de consum pel cicle de vida: documents de torn del primer nivell, també d'avui i
 * també declarats sense motiu, amb algun senyal i cap motiu explícit que els protegisca:
 *   CONS-A  el torn del rebut: tancat, rebut d'un altre fitxer, o caducat en un document d'abans de hui;
 *   CONS-B  un homònim més nou a la taula (mateixa categoria i títol), si el títol no és només la IA;
 *   CONS-C  onada superada: a la taula hi ha un pla_implementacio amb aammdd_hhmm posterior;
 *   CONS-D  auditoria amb tots els prompts que cita (àncora o nom) ja a l'arxiu o candidats.
 * Cada candidat porta `{ document, hash, motiu, consumidor, provaDeConsum, cita }` i una `classe`:
 * «consumit» (consum acreditat) si l'última acta posterior que el cita en el cos no el manté viu
 * (citesEnActa), ni a ell ni a cap germà d'onada (germaViu), i el document és el de HEAD i el
 * mateix que hi havia quan eixa acta es va consolidar; si no, «senseVida» (triatge). `cita` és la
 * línia de l'acta, perquè qui arxiva la llija: l'acreditació és mecànica i no prova cap lectura.
 * Protegix un `· Mestre aammdd: motiu`, un `· torn_ID` obert o un `· per a [[consumidor]]` que no
 * siga candidat. És un punt fix des de dalt: tot comença candidat i ix el que es justifica, de
 * manera que un cicle de «per a» no sosté ningú. Els rancis no hi són (ja els jutja checkTaula),
 * però compten com a consumits per als altres. Només llig; git, només si una acta podria
 * acreditar algun candidat (`head`: undefined el calcula, null el salta). Només veu el primer
 * nivell de la taula: 01_produccio/ i 02_investigacio_ia/ mai hi entren.
 */
export function candidatsConsum(arrel, { dia = avui(), ara = Date.now(), head } = {}) {
  if (errorsEstructura(arrel).length) return [];
  const docs = inventari(arrel).filter((d) => TRANSITORIES.test(d.categoria));
  const rancis = new Set(ranci(arrel, dia).map((d) => d.nom));
  const plaVigent = docs.filter(esPla).sort(perClau).at(-1) ?? null;
  const base = new Map();
  for (const d of docs.filter((x) => !rancis.has(x.nom))) {
    const reflex = reflexDe(path.join(arrel, d.rel));
    const torn = senyalTorn(arrel, d, reflex, { dia, ara });
    if (torn?.pendent) continue;
    const senyals = torn ? [torn] : [];
    const homonim = !TITOL_DE_IA.test(titolDe(d.resta)) && docs.filter((x) => x.resta === d.resta && clauDe(x) > clauDe(d)).sort(perClau).at(-1);
    if (homonim) senyals.push({ codi: 'CONS-B', text: `substituït per l'homònim ${senseMd(homonim.nom)}` });
    if (plaVigent && clauDe(d) < clauDe(plaVigent)) senyals.push({ codi: 'CONS-C', text: `onada superada pel pla ${senseMd(plaVigent.nom)}` });
    base.set(d.nom, { d, torn: reflex?.torn ?? null, senyals });
  }
  if (!base.size) return [];
  const perNom = perNomDe(arrel);
  const proteccio = new Map([...base.keys()].map((nom) => [nom, proteccioDe(arrel, nom, perNom.get(nom) ?? [], { dia, ara })]));
  const auditories = [...base.values()].filter(({ d }) => d.categoria === 'auditoria');
  const presents = nomsSolts(arrel);
  const arxivats = auditories.length ? nomsArxivats(arrel) : new Set();
  const citats = new Map(auditories.map(({ d }) => [d.nom, promptsCitats(llegeixSiPots(path.join(arrel, d.rel)), d.nom, presents, arxivats)]));
  const senyalsDe = (nom, candidats) => {
    const s = [...base.get(nom).senyals];
    const seus = citats.get(nom) ?? [];
    if (seus.length && seus.every((p) => p.arxivat || rancis.has(p.nom) || candidats.has(p.nom))) {
      s.push({ codi: 'CONS-D', text: `els prompts que cita ja són a l'arxiu o candidats (${seus.map((p) => senseMd(p.nom)).join(', ')})` });
    }
    return s;
  };
  let candidats = new Set([...base.keys()].filter((nom) => !proteccio.get(nom).explicita));
  for (;;) {
    const nou = new Set([...candidats].filter((nom) => senyalsDe(nom, candidats).length
      && !proteccio.get(nom).consumidors.some((c) => !candidats.has(c) && !rancis.has(c))));
    // Decreixent: la mateixa mida vol dir el mateix conjunt.
    if (nou.size === candidats.size) break;
    candidats = nou;
  }
  if (!candidats.size) return [];

  const declarats = viusExactes(arrel);
  const actes = actesDe(arrel);
  const textos = new Map();
  const textDe = (a) => {
    if (!textos.has(a.rel)) textos.set(a.rel, senseComentaris(llegeixSiPots(path.join(arrel, a.rel))));
    return textos.get(a.rel);
  };
  // HEAD es demana una sola vegada, i només si una acta podria acreditar algun candidat.
  let cap;
  const capDe = () => (cap === undefined ? (cap = head === undefined ? capDeGit(arrel) : head) : cap);
  /** Per què l'acta no acredita el consum, o null. La versió es mira contra HEAD i contra el commit que la va consolidar. */
  const versioNoProvada = (acta, d, hash) => {
    const c = capDe();
    if (!c) return { falta: 'sense git a l’arrel la versió no es pot provar' };
    if (!hash || c.blobs?.get(d.rel) !== hash) return { falta: 'el document no és a HEAD sense canvis' };
    const blobActa = c.blobs?.get(acta.rel) ?? null;
    if (!blobActa || blobActa !== blobDe(path.join(arrel, acta.rel))) return { falta: 'l’acta no és a HEAD sense canvis' };
    const versio = typeof c.versioEn === 'function' ? c.versioEn(acta.rel, d.rel) : null;
    if (!versio?.blob) return { falta: 'el document encara no era consolidat quan es va consolidar l’acta' };
    if (versio.blob !== hash) return { falta: `el document ha canviat des que l’acta es va consolidar a ${versio.commit}` };
    return { falta: null, prova: { commit: versio.commit, head: c.commit, blob: hash, destillacio: acta.rel, blobDestillacio: blobActa } };
  };
  return [...candidats].sort().map((nom) => {
    const { d, torn } = base.get(nom);
    const senyals = senyalsDe(nom, candidats);
    const hash = blobDe(path.join(arrel, d.rel));
    // L'última paraula: la més nova de les actes posteriors que el citen en el cos.
    const acta = actes.filter((a) => clauDe(a) > clauDe(d) && citaPelNom(textDe(a), d.nom))
      .map((a) => ({ ...a, cites: citesEnActa(textDe(a), d.nom) })).filter((a) => a.cites.length).sort(perClau).at(-1) ?? null;
    const viva = acta?.cites.find((x) => x.viu) ?? null;
    const cita = viva ?? acta?.cites[0] ?? null;
    const germa = acta && !viva ? germaViu(textDe(acta), d, (citats.get(nom) ?? []).map((p) => p.nom)) : null;
    const { falta = null, prova = null } = !acta ? {}
      : viva ? { falta: `el manté viu: «${viva.linia}»${viva.viu !== viva.linia ? ` (davall de «${viva.viu}»)` : ''}` }
        : germa ? { falta: `manté viu ${senseMd(germa.nom)}, de la mateixa onada: «${germa.linia}»` }
          : versioNoProvada(acta, d, hash);
    const acreditat = Boolean(prova);
    const motiu = senyals.map((s) => `${s.codi}: ${s.text}`).join('; ');
    return {
      ...d,
      document: d.nom,
      hash,
      classe: acreditat ? 'consumit' : 'senseVida',
      motiu: falta ? `${motiu}; ${senseMd(acta.nom)} el cita, però ${falta}` : motiu,
      senyals,
      consumidor: acreditat ? acta.rel : null,
      provaDeConsum: acreditat ? { ...prova, cita: cita.linia } : null,
      cita: cita ? { acta: acta.rel, linia: cita.linia, viu: cita.viu } : null,
      torn,
      declarat: declarats.has(d.nom),
    };
  });
}

/* ── Informe ──────────────────────────────────────────────────────────────── */

/** L'ordre que el resol, sempre primer en simulació: arxivar per nom és de MarIA o del Mestre (AGENTS §0.1). */
const ordreDe = (c) => `${VIA_PORTA} --arxiva --sec --nom ${c.nom}`;

/** Una línia per candidat, amb el que el prova (o no), la línia de l'acta i l'ordre que el resol. */
export function textCandidat(c) {
  if (c.classe === 'consumit') {
    return `[CONS] Consum acreditat, proposta d'arxiu: ${senseMd(c.nom)} (${c.motiu}; ${c.consumidor} el cita: «${c.provaDeConsum.cita}»; versió ${c.hash.slice(0, 10)}, la mateixa que quan l'acta es va consolidar a ${c.provaDeConsum.commit}). Llig la línia i fes l'Acte Reflex (core-higiene-escriptori, pas 0): si ningú l'espera, MarIA o el Mestre l'arxiven per nom, ${ordreDe(c)} [--torn ID], i després sense --sec; si algú encara el necessita, dona-li motiu a «## Activitat en curs».`;
  }
  return `[CONS] Sense vida acreditada (triatge, no prova cap consum): ${senseMd(c.nom)} (${c.motiu}). Dona-li motiu a la seua línia (· per a [[consumidor]], · torn_ID o · Mestre aammdd: motiu) o, si ja ha complert el seu cicle, MarIA o el Mestre l'arxiven per nom: ${ordreDe(c)} [--torn ID]`;
}

const US = 'Ús: consum-acreditat.mjs [--json] (només lectura; per arxivar per nom: porta-olivera.mjs --arxiva --sec --nom F [--torn ID])';

/**
 * CLI. Torna el codi d'eixida: 0 amb l'informe fet (fase «avis», haja candidats o no), 2 si no
 * s'ha pogut comprovar res. `arrel`, `dia`, `ara` i `head` s'injecten a les proves.
 */
export function main(argv = process.argv.slice(2), { arrel = null, sortida = console, dia = avui(), ara = Date.now(), head } = {}) {
  let json = false;
  for (const a of argv) {
    if (a === '--json') json = true;
    else { sortida.error(`[Consum acreditat] Argument desconegut: ${a}. ${US}`); return 2; }
  }
  let base;
  try { base = arrel ?? (process.env.SDP_ARREL ? path.resolve(process.env.SDP_ARREL) : arrelSegura()); }
  catch (error) { sortida.error(`[Consum acreditat] ${error.message}`); return 2; }
  const estructura = errorsEstructura(base);
  if (estructura.length) {
    for (const e of estructura) sortida.error(`[Consum acreditat] ${e}: cap comprovació feta.`);
    return 2;
  }
  const cap = head === undefined ? capDeGit(base) : head;
  const candidats = candidatsConsum(base, { dia, ara, head: cap });
  const consumits = candidats.filter((c) => c.classe === 'consumit');
  if (json) {
    sortida.log(JSON.stringify({
      esquema: ESQUEMA, fase: 'avis', dia, head: cap?.commit ?? null, total: candidats.length, consumits: consumits.length, senseVida: candidats.length - consumits.length,
      candidats: candidats.map((c) => ({
        document: c.document, rel: c.rel, categoria: c.categoria, classe: c.classe, hash: c.hash, motiu: c.motiu, senyals: c.senyals,
        consumidor: c.consumidor, provaDeConsum: c.provaDeConsum, cita: c.cita, torn: c.torn, declarat: c.declarat, ordre: ordreDe(c),
      })),
    }, null, 2));
    return 0;
  }
  const git = cap ? `HEAD ${cap.commit}` : 'sense git a l’arrel: cap consum es pot acreditar, només triatge';
  if (!candidats.length) {
    sortida.log(`[Consum acreditat] Cap candidat de consum pel cicle de vida (torn, homònim, onada nova, prompt de l'auditoria) · ${git}.`);
    return 0;
  }
  sortida.log(`[Consum acreditat] ${candidats.length} candidat(s) de consum pel cicle de vida (${consumits.length} amb consum acreditat, ${candidats.length - consumits.length} de triatge) · ${git} · fase «avis»: només llig, no mou res i ix amb 0.`);
  for (const c of candidats) {
    const classe = c.classe === 'consumit'
      ? `consum acreditat per ${c.consumidor} (versió ${c.hash.slice(0, 10)}, la mateixa que quan l'acta es va consolidar a ${c.provaDeConsum.commit})`
      : 'sense vida acreditada (triatge)';
    sortida.log(`   · ${c.nom}${c.declarat ? ' (declarat sense motiu explícit)' : ''} ← ${classe}: ${c.motiu}`);
    if (c.classe === 'consumit') sortida.log(`     «${c.provaDeConsum.cita}»`);
  }
  if (consumits.length) sortida.log(`   Consum acreditat: és una proposta, no una lectura provada. Llig la línia de l'acta i fes l'Acte Reflex (core-higiene-escriptori, pas 0); si ningú l'espera, MarIA o el Mestre l'arxiven per nom, primer en simulació: ${VIA_PORTA} --arxiva --sec --nom FITXER [--torn ID] (i després sense --sec).`);
  if (consumits.length < candidats.length) sortida.log(`   Triatge: la caducitat o una onada nova no proven cap lectura. Dona-li motiu (· per a [[consumidor]], · torn_ID o · Mestre aammdd: motiu) o, si ja ha complert el seu cicle, arxiva'l per nom: ${VIA_PORTA} --arxiva --sec --nom FITXER [--torn ID].`);
  return 0;
}

// Com la porta: la guarda resol l'enllaç simbòlic de les fixtures a os.tmpdir(), i el CLI parla sempre.
if (esMain(import.meta.url)) {
  try { process.exitCode = main(); }
  catch (error) { console.error(`[Consum acreditat] ${error.message}`); process.exitCode = 2; }
}
