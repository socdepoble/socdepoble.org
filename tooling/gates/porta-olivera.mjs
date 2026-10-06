#!/usr/bin/env node
/** Porta Olivera · higiene d'Escriptori en la transició Pla → Petorreta.
 *
 *  El problema que resol, dit sense adornar-lo: la precondició d'higiene («neteja
 *  l'Escriptori i escriu el Pla abans de cridar les altres IAs») vivia a les
 *  Lliçons d'una skill, i el moment de decisió té davant un altre document. Una
 *  regla que ha de disparar en el moment X ha de viure al canal que corre en el
 *  moment X. Qualsevol altra ubicació és decorativa.
 *
 *  Per això açò no és un recordatori: és una porta `PreToolUse`. Quan algú escriu
 *  una petorreta a l'Escriptori, comprova tres coses i bloqueja si no es complixen:
 *
 *    1. L'Escriptori està net (`checkTaula`, la definició única d'AGENTS §0.1):
 *       cap prompt, auditoria, pla o bundle consumit de jornades anteriors solt
 *       damunt la taula, la Safata d'Entrada buida, cada document ancorat a
 *       l'índex i cap àncora a un document absent.
 *    2. Hi ha un Pla d'Implementació d'aquesta jornada: la pissarra compartida
 *       existix abans de convocar ningú.
 *    3. La petorreta porta la secció 0 i cap casella sense marcar. La secció es
 *       pot dir «0. Abans de generar» o «0. Preflight», que és el nom que du la
 *       plantilla `prompt_local.md`: un prompt fet bé des de la plantilla no pot
 *       quedar bloquejat pel nom de la capçalera.
 *
 *  Viu per declaració, no per data (260930). A les 00:00 el rellotge convertia en
 *  brossa el prompt que s'estava executant. Ara decidix qui treballa: tot document
 *  llistat davall d'una capçalera «## Activitat en curs» de l'índex continua viu,
 *  siga del dia que siga, i `ranci()` no el toca. La tria és explícita i
 *  auditable: l'informe la mostra sencera.
 *
 *  L'informe (`npm run porta:olivera`) jutja la taula, no la petorreta: ix amb 0
 *  quan `checkTaula` és vàlid. El «pla de hui» només té sentit quan s'escriu una
 *  petorreta, i per això el demana el hook i no l'informe; si no, un Escriptori
 *  acabat de netejar al matí no passaria mai abans del primer pla.
 *
 *  No esborra res mai. `--arxiva` mou a `90_arxiu_historic/` (o a una carpeta de
 *  sessió amb `--sessio`) i despenja o reapunta les entrades de l'índex, i és una
 *  ordre explícita: AGENTS §5 prohibix l'esborrat automàtic i el trasllat
 *  silenciós d'allò que encara pot estar viu.
 *
 *  Àncores (261006). Cada àncora fantasma diu on és el document, buscat només pel
 *  nom (readdir, mai contingut) a l'arxiu, a les actes i a les subcarpetes de
 *  l'Escriptori. `--repara` aplica els remeis únics i `--renomena` és el
 *  reanomenat dins del circuit: el `mv` a mà deixava l'àncora del nom vell.
 *  Totes les escriptures de l'índex prenen el lock de draft-write.mjs i
 *  substituïxen el fitxer per temporal i rename. Cap trasllat trepitja un destí.
 *  Un document amb rebut d'un torn obert conserva una àncora amb camí després
 *  d'arxivar-lo, perquè el handoff que imprimix la porta deixe el torn tancable;
 *  i no es reanomena si eixe handoff ja no és possible.
 *
 *  Ús:
 *    porta-olivera.mjs [--informe]          # auditoria de l'Escriptori (eixida 1 si brut); mai llig stdin
 *    porta-olivera.mjs --hook               # hook: llig el payload per stdin
 *    porta-olivera.mjs --arxiva [--sec]     # mou els consumits de jornades anteriors
 *    porta-olivera.mjs --arxiva --nom F [--nom G] [--sessio aammdd_Nom] [--reapunta] [--sec]
 *                                           # mou artefactes de torn concrets (qualsevol extensió), també d'avui
 *    porta-olivera.mjs --repara [--sec]     # reapunta les àncores fantasma amb destí únic
 *    porta-olivera.mjs --renomena VELL --a NOU [--sec]
 *                                           # reanomena un document solt i reescriu les seues àncores
 *
 *  El mode hook és explícit: sense bandera, `readFileSync(0)` esperava un EOF que
 *  un terminal (o un pipe que ningú tanca) no envia mai, i la porta es penjava
 *  just quan la skill manava executar-la.
 */
import { CAMINS, arrelSegura, esMain } from '../lib/arrel.mjs';
import fs from 'node:fs';
import path from 'node:path';
import tty from 'node:tty';

// La ubicació de l'eina resol l'arrel. Conservar l'error permet importar les
// funcions amb una arrel explícita en fixtures, sense donar cap verd implícit.
let errorArrel = null;
export const ARREL = (() => {
  try { return process.env.SDP_ARREL ? path.resolve(process.env.SDP_ARREL) : arrelSegura(); }
  catch (error) { errorArrel = error; return null; }
})();
function arrelPerDefecte() {
  if (ARREL) return ARREL;
  throw errorArrel;
}
const ESCRIPTORI = CAMINS.escriptori;
const ARXIU = CAMINS.arxiuHistoric;
const INDEX = CAMINS.indexEscriptori;
const ACTES = CAMINS.actes;
/** El mateix lock exclusiu que draft-write.mjs: una sola escriptura documental de l'índex alhora. */
const LOCK = `${CAMINS.agents}/runtime/document-create.lock`;
/** Registres de torn (turns.mjs). Es lligen amb fs: turns.mjs ja importa esta porta. */
const TORNS = `${CAMINS.agents}/runtime/turns`;
/** Marge perquè el torn no caduque entre l'ordre i el handoff que imprimix. */
const MARGE_RELLEU = 10 * 60 * 1000;

/** Categories de treball d'un torn: naixen, servixen i se'n van a l'arxiu. */
export const TRANSITORIES = /^(prompt|macro_prompt|micro_prompt|petorreta|auditoria|informe|bundle|macro_bundle|micro_bundle|pla|acta|tasques)$/;
/** Per nom ixen també l'evidència de producció i les avaluacions; l'envelliment no les toca. */
export const PER_NOM = /^(produccio|avaluacio)$/;

const NOM = /^(\d{6})_(\d{4})_([a-z0-9]+(?:_[a-z0-9]+)*)\.md$/;
/** Qualsevol artefacte termodinàmic: extensió simple, doble o en majúscules. Sense extensió queda fora. */
const NOM_ARTEFACTE = /^(\d{6})_(\d{4})_([a-z0-9]+(?:_[a-z0-9]+)*)((?:\.[A-Za-z0-9]+)+)$/;
/** Categories compostes: guanya el prefix llarg, com a porta-taxonomia. */
const COMPOSTES = /^(pla_implementacio|macro_prompt|micro_prompt|macro_bundle|micro_bundle)(?=_|$)/;
/** Carpeta de sessió dins de l'arxiu: un sol segment `aammdd_Nom`. */
const SESSIO = /^\d{6}_[A-Za-z0-9]+(?:_[A-Za-z0-9]+)*$/;
/** Àncora wiki d'una sola línia, amb la «!» d'incrustació: un «[[» obert no s'empassa la línia següent. */
const ANCORA = /(!?)\[\[([^[\]\n]+)\]\]/g;

/** Secció on queda l'àncora amb camí d'un arxivat que no en conserva cap altra (--reapunta). */
export const SECCIO_ARXIVATS = 'Arxivat amb la Porta Olivera';
/** Secció on --repara deixa constància de les àncores que no tenen cap destí. */
export const SECCIO_SENSE_DESTI = 'Àncores sense destí (Porta Olivera)';

/** Capçalera que declara vius els documents que llista. N'hi pot haver més d'una, amb sufix. */
const ACTIVITAT = /^##[ \t]+Activitat en curs[^\n]*\n([\s\S]*?)(?=^##[ \t]|(?![\s\S]))/gm;

/** Secció 0 d'una petorreta: el nom de les proves antigues i el de la plantilla viva. */
const SECCIO_ZERO = /^##[ \t]+0\.[ \t]+(?:Abans de generar|Preflight)[^\n]*\n([\s\S]*?)(?=^#{1,2}[ \t]+|(?![\s\S]))/m;

/** `aammdd` d'avui, en hora local: és el segell que porten els noms de fitxer. */
export function avui(ara = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${p(ara.getFullYear() % 100)}${p(ara.getMonth() + 1)}${p(ara.getDate())}`;
}

/** Artefactes regulars visibles del primer nivell, de qualsevol extensió.
 * Els controls ocults no formen part de la taula documental; Safata i carpetes
 * permanents conserven els seus circuits. Diagnosticar mai els mou ni els llig.
 */
function fitxersSolts(arrel) {
  const dir = path.join(arrel, ESCRIPTORI);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isFile() && !e.name.startsWith('.'))
    .map(e => ({ nom: e.name, rel: `${ESCRIPTORI}/${e.name}` }));
}

/** Noms del primer nivell de l'Escriptori: el cens amb què es resolen les àncores. */
export function nomsSolts(arrel = arrelPerDefecte()) {
  return new Set(fitxersSolts(arrel).map(f => f.nom));
}

/** Categoria d'un nom termodinàmic; les compostes no es parteixen pel primer «_». */
function categoriaDe(resta) {
  const m = COMPOSTES.exec(resta);
  if (!m) return resta.split('_')[0];
  return m[1] === 'pla_implementacio' ? 'pla' : m[1];
}

/** Documents Markdown termodinàmics: política d'envelliment i arxivat intacta. */
export function inventari(arrel = arrelPerDefecte()) {
  return fitxersSolts(arrel)
    .map((e) => {
      const m = NOM.exec(e.nom);
      if (!m) return null;
      const [, data, hora, resta] = m;
      return { ...e, data, hora, categoria: categoriaDe(resta), resta };
    })
    .filter(Boolean);
}

/** Artefactes termodinàmics de qualsevol extensió: el que pot eixir per nom. */
export function artefactes(arrel = arrelPerDefecte()) {
  return fitxersSolts(arrel)
    .map((e) => {
      const m = NOM_ARTEFACTE.exec(e.nom);
      if (!m) return null;
      const [, data, hora, resta, ext] = m;
      return { ...e, data, hora, categoria: categoriaDe(resta), resta, ext };
    })
    .filter(Boolean);
}

/**
 * Noms (sense `.md`) que l'índex declara vius davall de qualsevol «## Activitat en
 * curs». Comparteix resolució amb `ancoratge()`: només compta si el camí
 * resol al primer nivell; un homònim d'una altra carpeta no protegix la taula.
 */
function viusExactes(arrel) {
  const p = path.join(arrel, INDEX);
  const text = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
  const noms = new Set();
  const presents = nomsSolts(arrel);
  for (const bloc of prosaIndex(text).matchAll(ACTIVITAT)) {
    for (const a of bloc[1].matchAll(ANCORA)) {
      const resolt = resolAncora(a[2], presents);
      if (resolt) noms.add(resolt);
    }
  }
  return noms;
}
export function vius(arrel = arrelPerDefecte()) {
  // Conserva l'API històrica sense .md; la política de ranci compara el fitxer
  // complet perquè un recurs homònim no acredite la vida d'un altre document.
  return new Set([...viusExactes(arrel)].map(nom => nom.replace(/\.md$/, '')));
}

/** El que hauria d'estar a l'arxiu: categoria de torn, data anterior a hui i cap declaració de viu. */
export function ranci(arrel = arrelPerDefecte(), dia = avui()) {
  const viu = viusExactes(arrel);
  return inventari(arrel).filter((d) => TRANSITORIES.test(d.categoria) && d.data < dia && !viu.has(d.nom));
}

/** Pissarra compartida d'aquesta jornada. */
export function plaDeHui(arrel = arrelPerDefecte(), dia = avui()) {
  return inventari(arrel).filter((d) => /^pla_implementacio(?:_|$)/.test(d.resta) && d.data === dia);
}

/**
 * Elements de la Safata d'Entrada, que ha d'estar sempre buida (AGENTS §12). La
 * carpeta es busca sense distingir caixa: el codi en conserva `00_Bandeja_d_Entrada`
 * i el disc du `00_bandeja_d_entrada`, i a Linux una comparació exacta no la veuria.
 */
export function safata(arrel = arrelPerDefecte()) {
  const dir = path.join(arrel, ESCRIPTORI);
  if (!fs.existsSync(dir)) return { carpeta: null, elements: [] };
  const carpeta = fs.readdirSync(dir, { withFileTypes: true })
    .find((e) => e.isDirectory() && /^00_bandeja_d_entrada$/i.test(e.name));
  if (!carpeta) return { carpeta: null, elements: [] };
  const elements = fs.readdirSync(path.join(dir, carpeta.name)).filter((n) => !n.startsWith('.')).sort();
  return { carpeta: `${ESCRIPTORI}/${carpeta.name}`, elements };
}

/** Prosa amb offsets intactes: comentaris i codi no acrediten cap àncora. */
export function prosaIndex(text) {
  const mask = part => part.replace(/[^\r\n]/g, ' ');
  let fence = null;
  return text.replace(/<!--[\s\S]*?-->/g, mask).split(/(?<=\n)/).map(line => {
    const mark = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (mark) {
      if (!fence) fence = mark[1];
      else if (mark[1][0] === fence[0] && mark[1].length >= fence.length) fence = null;
      return mask(line);
    }
    return fence ? mask(line) : line;
  }).join('').replace(/`[^`]*`/g, mask);
}
const referent = (raw, senseMarkdown = true) => {
  const ref = raw.replace(/\\(?=[|#])/g,'').split(/[|#]/)[0].trim();
  return senseMarkdown ? ref.replace(/\.md$/, '') : ref;
};
function nomPrimerNivell(ref) {
  const normalized = path.posix.normalize(ref);
  for (const candidate of [path.posix.join(ESCRIPTORI,normalized),path.posix.join(CAMINS.wiki,normalized),normalized]) {
    if (path.posix.dirname(candidate) === ESCRIPTORI) return path.posix.basename(candidate);
  }
  return null;
}

// Una extensió explícita sempre identifica eixe recurs. Només un referent
// sense extensió pot abreviar .md; noms Markdown amb punts usen .md explícit.
function resolNomExacte(nom, presents) {
  return presents.has(nom) ? nom : !path.posix.extname(nom) && presents.has(`${nom}.md`) ? `${nom}.md` : null;
}

/** Nom del primer nivell al qual resol una àncora crua: la regla única d'ancoratge, vius i despenjat. */
export function resolAncora(raw, presents) {
  const nom = nomPrimerNivell(referent(raw, false));
  return nom ? resolNomExacte(nom, presents) : null;
}

/** Àncores reals d'un índex amb offsets: comentaris i codi no compten. */
export function ancoresDe(text) {
  return [...prosaIndex(text).matchAll(ANCORA)]
    .map(m => ({ inici: m.index, final: m.index + m[0].length, marca: m[1], raw: m[2] }));
}

/**
 * Una àncora crua de l'índex apunta al fitxer `rel` (camí des del repositori)? Al
 * primer nivell, amb la regla d'ancoratge(); fora, amb la de core.anchored().
 */
export function apuntaA(raw, rel, presents = null) {
  const objectiu = path.posix.normalize(rel);
  const ref = referent(raw, false);
  if (path.posix.dirname(objectiu) === ESCRIPTORI) {
    const base = path.posix.basename(objectiu);
    const nom = nomPrimerNivell(ref);
    return Boolean(nom) && resolNomExacte(nom, presents ?? new Set([base])) === base;
  }
  const sense = s => s.replace(/\.md$/, '');
  return [path.posix.join(ESCRIPTORI, ref), path.posix.join(CAMINS.wiki, ref), ref]
    .some(c => sense(path.posix.normalize(c)) === sense(objectiu));
}

/** `.md` s'omet a l'àncora només si el nom no porta cap altra extensió. */
function senseMd(nom) {
  return nom.endsWith('.md') && !path.posix.extname(nom.slice(0, -3)) ? nom.slice(0, -3) : nom;
}
/** Àlies o fragment d'una àncora crua, escapament inclòs; buit si no en té. */
function sufixDe(raw) {
  const i = raw.search(/\\?[|#]/);
  return i < 0 ? '' : raw.slice(i);
}

/** Documents de l'Escriptori sense àncora a l'índex, i àncores a documents absents. */
export function ancoratge(arrel = arrelPerDefecte()) {
  const indexPath = path.join(arrel, INDEX);
  const text = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : '';
  const ancores = ancoresDe(text).map(a => referent(a.raw, false));
  const presents = fitxersSolts(arrel);
  const docs = presents.filter(d => d.nom !== '00_index_escriptori.md');
  const noms = new Set(presents.map(d => d.nom));
  // Obsidian permet ometre .md. Un nom exacte present preval sobre eixa
  // abreviatura: [[x.jpg]] mai acredita alhora x.jpg i x.jpg.md.
  const resol = nom => resolNomExacte(nom, noms);
  const referents = ancores.map(ref => ({ ref, nom: nomPrimerNivell(ref) })).filter(a => a.nom);
  const ancorats = new Set(referents.map(a => resol(a.nom)).filter(Boolean));
  return {
    senseAncora: docs.filter(d => !ancorats.has(d.nom)).map(d => d.nom),
    fantasma: referents.filter(a => !resol(a.nom)).map(a => a.ref)
  };
}

/* ── Remei de les àncores fantasma ────────────────────────────────────────── */

/** Fitxers i carpetes visibles d'una carpeta: només noms, mai contingut. */
function entrades(arrel, rel) {
  try { return fs.readdirSync(path.join(arrel, rel), { withFileTypes: true }).filter(e => !e.name.startsWith('.')); }
  catch (error) { if (['ENOENT', 'ENOTDIR'].includes(error.code)) return []; throw error; }
}
/** On pot haver anat un document: l'arxiu i les seues sessions, les actes i les subcarpetes de l'Escriptori. */
function llocsDeCerca(arrel) {
  const subcarpetes = rel => entrades(arrel, rel).filter(e => e.isDirectory()).map(e => `${rel}/${e.name}`);
  return [ARXIU, ...subcarpetes(ARXIU), ACTES, ...subcarpetes(ESCRIPTORI)]
    .map(rel => ({ rel, noms: new Set(entrades(arrel, rel).filter(e => e.isFile()).map(e => e.name)) }));
}

/**
 * Per a cada àncora fantasma, on és el document amb eixe nom i quina àncora amb
 * camí el reprén. La cerca és només per nom de fitxer (readdir).
 */
export function remeis(arrel = arrelPerDefecte(), fantasmes = ancoratge(arrel).fantasma) {
  if (!fantasmes.length) return [];
  const llocs = llocsDeCerca(arrel);
  return fantasmes.map(ref => {
    const nom = nomPrimerNivell(ref);
    const trobats = nom ? llocs.flatMap(l => {
      const resolt = resolNomExacte(nom, l.noms);
      return resolt ? [`${l.rel}/${resolt}`] : [];
    }) : [];
    const ancora = trobats.length === 1 ? senseMd(path.posix.relative(ESCRIPTORI, trobats[0])) : null;
    return { ref, trobats, ancora };
  });
}
/** Abast real de la cerca: un nivell, i no més. Un document més fons no s'hi veu. */
const LLOCS_CERCATS = `${ARXIU}/ i les seues subcarpetes, ${ACTES}/ i les subcarpetes de l'Escriptori; la cerca no baixa més d'un nivell`;
function descriuFantasma(r) {
  if (r.ancora) return `${r.ref} → és a ${r.trobats[0]}; l'àncora bona és [[${r.ancora}]]`;
  if (r.trobats.length) return `${r.ref} → ambigu: ${r.trobats.join(', ')}; tria a mà l'àncora amb camí`;
  return `${r.ref} → no és a cap dels llocs cercats (${LLOCS_CERCATS}); recupera'l o lleva l'àncora`;
}
function textFantasmes(arrel, fantasmes) {
  const rs = remeis(arrel, fantasmes);
  const reparables = rs.some(r => r.ancora || !r.trobats.length);
  return `${rs.map(descriuFantasma).join(' · ')}${reparables ? ' (MarIA o el Mestre: node tooling/gates/porta-olivera.mjs --repara --sec, i després sense --sec)' : ''}`;
}

/**
 * Escriptori net: la definició única (AGENTS §0.1) i el que jutja l'informe.
 * Brossa, Safata i àncores; el «pla de hui» no hi entra, és cosa de la petorreta.
 */
function errorsEstructura(arrel) {
  const errors = [];
  for (const [rel, directory] of [[ESCRIPTORI, true], [INDEX, false]]) {
    try {
      const stat = fs.lstatSync(path.join(arrel, rel));
      if (stat.isSymbolicLink() || !(directory ? stat.isDirectory() : stat.isFile()))
        errors.push(`Estructura de l'Escriptori invàlida: ${rel}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      errors.push(`Estructura de l'Escriptori absent: ${rel}`);
    }
  }
  return errors;
}
export function checkTaula(arrel = arrelPerDefecte(), { dia = avui() } = {}) {
  const errors = errorsEstructura(arrel);
  if (errors.length) return { valid: false, errors };

  const bruts = ranci(arrel, dia);
  if (bruts.length) {
    errors.push(`Escriptori sense classificar: ${bruts.length} document(s) de jornades anteriors encara damunt la taula (${bruts.map((d) => d.nom).join(', ')}). Arxiva'ls amb: node tooling/gates/porta-olivera.mjs --arxiva, o declara'ls vius davall de «## Activitat en curs» a ${INDEX}`);
  }

  const bustia = safata(arrel);
  if (bustia.elements.length) {
    errors.push(`Safata d'entrada amb ${bustia.elements.length} element(s) (${bustia.carpeta}: ${bustia.elements.slice(0, 5).join(', ')}${bustia.elements.length > 5 ? '…' : ''}). La Safata s'ha de buidar sempre (AGENTS §12).`);
  }

  const anc = ancoratge(arrel);
  if (anc.senseAncora.length) errors.push(`Sense àncora a l’índex: ${anc.senseAncora.join(', ')}`);
  if (anc.fantasma.length) errors.push(`Àncores a documents absents: ${textFantasmes(arrel, anc.fantasma)}`);

  return { valid: errors.length === 0, errors };
}

/** Les tres comprovacions de la transició Pla → Petorreta: la taula, el pla i la secció 0. */
export function checkOlivera(arrel = arrelPerDefecte(), { contingut = null, dia = avui() } = {}) {
  const errors = [...checkTaula(arrel, { dia }).errors];

  if (!plaDeHui(arrel, dia).length) {
    errors.push(`Cap Pla d'Implementació de hui (${dia}) a l'Escriptori. Les altres IAs arriben a una habitació sense pissarra. Genera'l abans: node tooling/wiki/document.mjs context --turn-id ID --route pla.implementacio --file ${ESCRIPTORI}/${dia}_HHMM_pla_implementacio_COGNOM.md`);
  }

  if (typeof contingut === 'string') {
    const section = SECCIO_ZERO.exec(contingut);
    if (!section) {
      errors.push("La petorreta no porta la secció 0: «0. Abans de generar (per a l'autor, no per al destinatari)» o «0. Preflight», com la plantilla prompt_local.md. És la precondició d'higiene i ha de viatjar dins del document, no a la memòria de qui l'escriu.");
    } else if (/^[ \t]*[-*+][ \t]+\[[ \t]\]/m.test(section[1])) {
      errors.push('La secció 0 té caselles sense marcar. Cap petorreta ix del Mas amb la llista a mitges.');
    }
  }

  return { valid: errors.length === 0, errors };
}

/** És una petorreta de l'Escriptori? Només eixe cas dispara la porta. */
export function esPetorreta(rel) {
  const pla = rel.split(path.sep).join('/');
  if (!pla.startsWith(`${ESCRIPTORI}/`)) return false;
  if (pla.slice(ESCRIPTORI.length + 1).includes('/')) return false;
  const m = NOM.exec(path.basename(pla));
  return !!m && /^(prompt|macro_prompt|micro_prompt|petorreta)_/.test(m[3]);
}

/* ── Hook ─────────────────────────────────────────────────────────────────── */

/**
 * Una redirecció de shell escriu sense passar per cap eina de fitxers, i eixa és
 * la via per la qual els documents d'aquesta jornada van arribar al disc sense
 * rebut. Ací només mirem el destí: si apunta a una petorreta de l'Escriptori,
 * la porta actua igual que amb una escriptura normal.
 */
export function destiDeShell(ordre) {
  if (typeof ordre !== 'string') return null;
  const m = /(?:>>?|\|\s*tee(?:\s+-a)?)\s*(?:'([^']+)'|"([^"]+)"|(\S+))/.exec(ordre);
  const desti = m && (m[1] || m[2] || m[3]);
  return desti && esPetorreta(desti.replace(/^\.\//, '')) ? desti : null;
}

function rutaIContingut(payload) {
  const ti = payload.tool_input;
  const ta = payload.toolArgs;
  const dialecte = ti ? 'claude' : 'antigravity';
  const fitxer = ti?.file_path || ti?.notebook_path || ta?.TargetFile
    || destiDeShell(ti?.command || ta?.Command || ta?.CommandLine) || null;
  const contingut = typeof ti?.content === 'string' ? ti.content
    : typeof ta?.CodeContent === 'string' ? ta.CodeContent
      : null;
  return { dialecte, fitxer, contingut };
}

export function checkPayload(payload, arrel = arrelPerDefecte()) {
  if (!payload || typeof payload !== 'object' || !payload.tool_name || (!payload.tool_input && !payload.toolArgs)) return {code: 2, errors: ['Payload de hook incomplet']};
  const { dialecte, fitxer, contingut } = rutaIContingut(payload);
  if (!fitxer) {
    const reads = ['Read', 'Glob', 'Grep', 'read_file', 'view_file', 'list_dir', 'grep_search', 'search_code'];
    return reads.includes(payload.tool_name) ? {code: 0, errors: []} : {code: 2, errors: ['Hook sense destí verificable; usa hooks-local per a shell i eines no documentals']};
  }
  const rel = path.isAbsolute(fitxer) ? path.relative(arrel, fitxer) : fitxer;
  if (!esPetorreta(rel)) return { code: 0, errors: [] };
  if (typeof contingut !== 'string') return {code: 2, errors: ['Petorreta sense contingut complet verificable; usa escriptura documental explícita'], file: rel};
  const r = checkOlivera(arrel, { contingut });
  return { code: r.valid ? 0 : (dialecte === 'claude' ? 2 : 1), errors: r.errors, file: rel };
}

/* ── Escriptura de l'índex ────────────────────────────────────────────────── */

const existeix = (abs) => {
  try { fs.lstatSync(abs); return true; }
  catch (error) { if (error.code === 'ENOENT') return false; throw error; }
};

/** L'índex que es reescriurà ha de ser un fitxer propi: es comprova abans de moure res. */
function comprovaIndex(arrel) {
  const stat = fs.lstatSync(path.join(arrel, INDEX));
  if (stat.isSymbolicLink() || !stat.isFile() || stat.nlink !== 1) throw new Error(`Estructura de l'Escriptori invàlida: ${INDEX}`);
}

/** Lock exclusiu de draft-write.mjs (obert amb wx): ningú més escriu l'índex mentrestant. */
function ambLock(arrel, fer) {
  const lock = path.join(arrel, LOCK);
  fs.mkdirSync(path.dirname(lock), { recursive: true });
  let fd;
  try { fd = fs.openSync(lock, 'wx', 0o600); }
  catch (error) {
    if (error.code === 'EEXIST') throw new Error(`Índex ocupat: ${LOCK} ja existix (una creació documental en curs o un lock orfe). No s'ha mogut res; torna-ho a provar i, si persistix, revisa'l amb el Mestre.`);
    throw error;
  }
  const propi = fs.fstatSync(fd);
  try { return fer(); }
  finally {
    fs.closeSync(fd);
    try {
      const ara = fs.lstatSync(lock);
      if (ara.dev === propi.dev && ara.ino === propi.ino) fs.unlinkSync(lock);
    } catch { /* el lock ja no hi és */ }
  }
}

/**
 * Reescriu l'índex amb `transforma(original)`: temporal ocult i rename, mai damunt
 * del seu inode. Si algú l'ha tocat entre la lectura i el rename (un editor no pren
 * el lock), es torna a calcular sobre la versió nova.
 */
function escriuIndex(arrel, transforma) {
  const fitxer = path.join(arrel, INDEX);
  for (let intent = 0; intent < 3; intent++) {
    const abans = fs.lstatSync(fitxer);
    if (abans.isSymbolicLink() || !abans.isFile() || abans.nlink !== 1) throw new Error(`Estructura de l'Escriptori invàlida: ${INDEX}`);
    const original = fs.readFileSync(fitxer, 'utf8');
    const nou = transforma(original);
    if (nou === original) return false;
    const temporal = path.join(path.dirname(fitxer), `.${path.basename(fitxer)}.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`);
    const fd = fs.openSync(temporal, 'wx', abans.mode & 0o777);
    try {
      try { fs.writeFileSync(fd, nou, 'utf8'); fs.fsyncSync(fd); }
      finally { fs.closeSync(fd); }
      const ara = fs.lstatSync(fitxer);
      if (ara.dev === abans.dev && ara.ino === abans.ino && fs.readFileSync(fitxer, 'utf8') === original) {
        fs.renameSync(temporal, fitxer);
        return true;
      }
    } finally {
      // Ni una CAS perduda ni un rename fallit deixen el temporal a la taula.
      if (existeix(temporal)) fs.unlinkSync(temporal);
    }
  }
  throw new Error(`${INDEX} ha canviat tres vegades mentre s'escrivia: no es reescriu a cegues.`);
}

/**
 * Aplica substitucions de tokens. Només una línia que es queda sense res més que la
 * vinyeta desapareix; en taula, prosa o línia compartida es lleva el token i es
 * conserva la resta. Si llevar-la deixa dues línies en blanc seguides, se'n plega
 * una (ANC-W6), només en eixe tram.
 */
function aplica(text, canvis) {
  if (!canvis.length) return text;
  let offset = 0;
  const linies = text.split(/(?<=\n)/).map(linia => {
    const inici = offset; offset += linia.length;
    const meus = canvis.filter(c => c.inici >= inici && c.final <= inici + linia.length).sort((a, b) => b.inici - a.inici);
    if (!meus.length) return linia;
    let neta = linia;
    for (const c of meus) neta = neta.slice(0, c.inici - inici) + c.text + neta.slice(c.final - inici);
    return meus.some(c => c.text === '') && /^[ \t]*(?:[-*][ \t]*)?(?:\r?\n)?$/.test(neta) ? null : neta;
  });
  const blanca = l => /^[ \t]*\r?\n$/.test(l);
  const eixida = [];
  let plega = false;
  for (const linia of linies) {
    if (linia === null) { plega ||= eixida.length > 0 && blanca(eixida.at(-1)); continue; }
    if (plega && blanca(linia)) { plega = false; continue; }
    plega = false;
    eixida.push(linia);
  }
  return eixida.join('');
}

/**
 * Insereix línies de llista a l'inici d'una secció (`inici` és just després de la
 * capçalera): darrere de les línies en blanc que la seguixen i sense cap línia en
 * blanc pròpia (ANC-W6). Només quan el que ve és prosa o una taula cal un blanc,
 * perquè no es faça continuació de la llista.
 */
export function insereixLlista(text, inici, linies) {
  if (inici > 0 && text[inici - 1] !== '\n') return `${text.slice(0, inici)}\n${linies.join('\n')}\n${text.slice(inici)}`;
  const blancs = /(?:[ \t]*\r?\n)*/y;
  blancs.lastIndex = inici;
  blancs.exec(text);
  const i = blancs.lastIndex;
  const seguent = /^[^\r\n]*/.exec(text.slice(i))[0];
  const separa = seguent.trim() && !/^ {0,3}(?:[-*+][ \t]|\d+[.)][ \t]|#{1,6}(?:[ \t]|$))/.test(seguent) ? '\n' : '';
  return `${text.slice(0, i)}${linies.join('\n')}\n${separa}${text.slice(i)}`;
}

/** Afig línies a una secció `## titol`; si no existix, la crea al final. */
function afigASeccio(text, titol, linies) {
  const escapat = titol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const capcalera = new RegExp(`^##[ \\t]+${escapat}[ \\t]*(?:\\r?\\n|$)`, 'm').exec(prosaIndex(text));
  if (capcalera) return insereixLlista(text, capcalera.index + capcalera[0].length, linies);
  const separador = !text ? '' : text.endsWith('\n\n') ? '' : text.endsWith('\n') ? '\n' : '\n\n';
  return `${text}${separador}## ${titol}\n\n${linies.join('\n')}\n`;
}

/* ── Arxivat explícit ─────────────────────────────────────────────────────── */

/** Nom solt del primer nivell a partir del que escriu l'usuari; les subcarpetes no hi entren. */
function nomSolt(cru, bandera) {
  const pla = String(cru).split('\\').join('/').replace(/^\.\//, '');
  const solt = pla.startsWith(`${ESCRIPTORI}/`) ? pla.slice(ESCRIPTORI.length + 1) : pla;
  if (!solt || solt.includes('/')) {
    throw new Error(`${bandera} ${cru}: només s'admeten per nom documents solts del primer nivell de ${ESCRIPTORI}; les subcarpetes (Safata, 01_produccio, 02_investigacio_ia) queden fora`);
  }
  return solt;
}

/**
 * Què mouria `--arxiva`. Sense noms: els rancis (jornades anteriors, no declarats
 * vius; només Markdown). Amb noms: exactament eixos artefactes, de qualsevol
 * extensió i també d'avui. Cada nom es valida abans de moure res, i un sol nom
 * dolent atura el lot sencer: subcarpetes, noms que no són a la taula i categories
 * que no són de torn ni de producció o avaluació.
 */
export function arxivables(arrel = arrelPerDefecte(), { noms = [], dia = avui() } = {}) {
  // Fins i tot una simulació o un lot buit ha comprovat la seua estructura.
  // No convertir una còpia buida/índex absent en «Res a arxivar» amb èxit.
  const errors = errorsEstructura(arrel);
  if (errors.length) throw new Error(errors.join('\n'));
  if (!noms.length) return ranci(arrel, dia);
  const arts = artefactes(arrel);
  const presents = new Set(arts.map(a => a.nom));
  const triats = [];
  for (const cru of noms) {
    const solt = nomSolt(cru, '--nom');
    const nom = resolNomExacte(solt, presents);
    const d = nom && arts.find((x) => x.nom === nom);
    if (!d) throw new Error(`--nom ${cru}: no és cap document solt de ${ESCRIPTORI} amb nom aammdd_hhmm_categoria_titol.ext`);
    if (!TRANSITORIES.test(d.categoria) && !PER_NOM.test(d.categoria)) {
      throw new Error(`--nom ${cru}: la categoria «${d.categoria}» no és de torn; per nom només ixen prompts, petorretes, auditories, informes, bundles, plans, actes, tasques, avaluacions i artefactes de producció`);
    }
    if (!triats.includes(d)) triats.push(d);
  }
  return triats;
}

/** L'arxiu i la carpeta de sessió, si ja existixen, han de ser directoris reals. */
function comprovaCarpeta(arrel, carpeta) {
  for (const rel of new Set([ARXIU, carpeta])) {
    let stat;
    try { stat = fs.lstatSync(path.join(arrel, rel)); }
    catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`Estructura de l'arxiu invàlida: ${rel} no és un directori real`);
  }
}

/** Rebut de torn que du el frontmatter d'un Markdown de la taula: `{ torn, rebut }`, o null. */
function reflexDe(abs) {
  if (!abs.endsWith('.md')) return null;
  let text;
  try { text = fs.readFileSync(abs, 'utf8'); } catch { return null; }
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  const m = fm && /^reflex:[ \t]*["']?sdp:(torn_[0-9a-f-]{36}):([0-9a-f-]{36})["']?[ \t]*$/m.exec(fm[1]);
  return m ? { torn: m[1], rebut: m[2] } : null;
}

/**
 * Es pot fer el relleu (document.mjs handoff) d'este rebut des de `rel`? Són les
 * guardes de readTurn i handoffDocument, mirades abans de moure res: registre
 * vàlid, torn obert i vigent amb marge, rebut del fitxer `rel` i, si naix amb
 * fase de creació, consolidat. Llig el registre amb fs, com porta-plantilla-viva.
 * `fitxer` és el que diu el rebut, també quan no és `rel`.
 */
function relleu(arrel, reflex, rel, ara = Date.now()) {
  if (!reflex) return null;
  let torn;
  try { torn = JSON.parse(fs.readFileSync(path.join(arrel, TORNS, `${reflex.torn}.json`), 'utf8')); }
  catch { return { ...reflex, possible: false, fitxer: null, motiu: `el registre del torn no és a ${TORNS}/` }; }
  const rebut = torn?.receipts?.[reflex.rebut];
  const fitxer = rebut?.id === reflex.rebut && typeof rebut.file === 'string' ? rebut.file : null;
  const motiu = torn?.turn_id !== reflex.torn || torn.schema !== 'sdp.turn.v1' ? 'registre de torn invàlid'
    : torn.state === 'closed' ? 'torn ja tancat'
      : !(Date.parse(torn.expiresAt) > ara + MARGE_RELLEU) ? 'torn caducat o a menys de 10 minuts de caducar'
        : !fitxer ? 'el rebut no és al registre del torn'
          : fitxer !== rel ? `el rebut és de ${fitxer}`
            : Object.hasOwn(rebut, 'creation') && rebut.creation?.state !== 'committed' ? 'rebut de creació sense consolidar'
              : null;
  return { ...reflex, possible: !motiu, fitxer, motiu };
}

/** Trasllat que mai trepitja: l'enllaç dur falla si el destí ja existix (error amb code EEXIST). */
function mouSenseTrepitjar(origen, desti) {
  const ocupat = () => Object.assign(new Error(`${path.basename(desti)} ja existix; no es sobreescriu`), { code: 'EEXIST' });
  try { fs.linkSync(origen, desti); }
  catch (error) {
    if (error.code === 'EEXIST') throw ocupat();
    if (!['EPERM', 'ENOTSUP', 'EXDEV', 'EMLINK'].includes(error.code)) throw error;
    if (existeix(desti)) throw ocupat();
    fs.renameSync(origen, desti);
    return;
  }
  // Si l'origen no es pot llevar, es desfà l'enllaç: mai dos noms per al mateix document.
  try { fs.unlinkSync(origen); }
  catch (error) { fs.unlinkSync(desti); throw error; }
}

/**
 * Despenja o reapunta les àncores dels documents moguts. Resol amb la mateixa regla
 * que ancoratge() i amb el cens pres abans del trasllat: [[H]] és el recurs H si
 * existia, i arxivar H.md no se l'emporta. Amb `reapunta`, fora d'«Activitat en
 * curs» l'àncora passa a portar camí; dins, se n'ix. Un document que es queda sense
 * cap àncora la rep davall de «## Arxivat amb la Porta Olivera», perquè el
 * tancament del torn després del handoff la troba: amb `reapunta`, tots; sense,
 * només els que porten rebut d'un torn obert amb relleu possible.
 */
function despenja(text, moguts, presentsAbans, { reapunta, carpeta }) {
  const perNom = new Set(moguts.map(m => m.nom));
  const actives = [...prosaIndex(text).matchAll(ACTIVITAT)].map(m => [m.index, m.index + m[0].length]);
  const relCarpeta = path.posix.relative(ESCRIPTORI, carpeta);
  const canvis = [];
  const reapuntats = new Set();
  for (const a of ancoresDe(text)) {
    const nom = resolAncora(a.raw, presentsAbans);
    if (!nom || !perNom.has(nom)) continue;
    const viu = actives.some(([inici, final]) => a.inici >= inici && a.inici < final);
    if (!reapunta || viu) { canvis.push({ ...a, text: '' }); continue; }
    canvis.push({ ...a, text: `${a.marca}[[${relCarpeta}/${senseMd(nom)}${sufixDe(a.raw)}]]` });
    reapuntats.add(nom);
  }
  let nou = aplica(text, canvis);
  const ancores = ancoresDe(nou);
  const falten = moguts.filter(m => (reapunta || m.relleu) && !reapuntats.has(m.nom) && !ancores.some(a => apuntaA(a.raw, m.desti)));
  if (falten.length) nou = afigASeccio(nou, SECCIO_ARXIVATS, falten.map(m => `- [[${relCarpeta}/${senseMd(m.nom)}]]`));
  return nou;
}

/** Trasllat a l'arxiu. Amb `sec` només respon què faria: cap fitxer mogut ni índex tocat. */
export function arxiva(arrel = arrelPerDefecte(), { noms = [], sec = false, dia = avui(), sessio = null, reapunta = false } = {}) {
  if (sessio !== null && !SESSIO.test(String(sessio))) throw new Error(`--sessio ${sessio}: ha de ser aammdd_Nom, un sol segment dins de ${ARXIU}/`);
  const bruts = arxivables(arrel, { noms, dia });
  if (!bruts.length) return { moguts: [], index: false, sec };
  const carpeta = sessio ? `${ARXIU}/${sessio}` : ARXIU;
  comprovaCarpeta(arrel, carpeta);
  const desti = d => `${carpeta}/${d.nom}`;

  if (sec) {
    const moguts = bruts.map((d) => ({ ...d, desti: desti(d), nota: existeix(path.join(arrel, carpeta, d.nom)) ? 'simulació: ja existix a l’arxiu; no es mouria' : 'simulació: es mouria' }));
    return { moguts, index: false, sec };
  }

  comprovaIndex(arrel);
  return ambLock(arrel, () => {
    // El cens del despenjat es pren dins del lock, just abans del primer trasllat.
    const presentsAbans = nomsSolts(arrel);
    fs.mkdirSync(path.join(arrel, carpeta), { recursive: true });
    const moguts = [];
    const fets = () => moguts.filter(m => m.nota === 'mogut');
    let fallada = null;
    let errorIndex = null;
    let index = false;
    try {
      for (const d of bruts) {
        const origen = path.join(arrel, d.rel);
        const xoca = { ...d, desti: desti(d), nota: 'ja existia a l’arxiu; no es sobreescriu' };
        if (existeix(path.join(arrel, carpeta, d.nom))) { moguts.push(xoca); continue; }
        const r = relleu(arrel, reflexDe(origen), d.rel);
        // Un destí que apareix després de la comprovació tampoc es trepitja.
        try { mouSenseTrepitjar(origen, path.join(arrel, carpeta, d.nom)); }
        catch (error) { if (error.code !== 'EEXIST') throw error; moguts.push(xoca); continue; }
        moguts.push({ ...d, desti: desti(d), nota: 'mogut', ...(r && { torn: r.torn, relleu: r.possible, motiu: r.motiu }) });
      }
    } catch (error) {
      fallada = error;
    } finally {
      // T2-LOT: el que ja s'ha mogut perd l'àncora encara que el lot caiga a mitges.
      try { index = fets().length > 0 && escriuIndex(arrel, text => despenja(text, fets(), presentsAbans, { reapunta, carpeta })); }
      catch (error) { errorIndex = error; }
    }
    if (fallada || errorIndex) {
      const llista = fets().map(m => m.nom).join(', ') || 'cap';
      const error = fallada ?? new Error(`${INDEX} no s'ha pogut actualitzar: ${errorIndex.message}`);
      if (fallada && errorIndex) error.message += `\n${INDEX} tampoc s'ha pogut actualitzar: ${errorIndex.message}`;
      error.message += errorIndex
        ? `\n[Porta Olivera] Moguts sense despenjar: ${llista}. Les seues àncores queden fantasma fins que es reparen (--repara).`
        : `\n[Porta Olivera] Moguts abans de la fallada, ja despenjats de l'índex: ${llista}`;
      throw error;
    }
    return { moguts, index, sec };
  });
}

/* ── Reparació i reanomenat ───────────────────────────────────────────────── */

function reparaText(text, arrel, dia) {
  const presents = nomsSolts(arrel);
  const fantasmes = ancoresDe(text).filter(a => {
    const nom = nomPrimerNivell(referent(a.raw, false));
    return nom && !resolNomExacte(nom, presents);
  });
  const perRef = new Map(remeis(arrel, [...new Set(fantasmes.map(a => referent(a.raw, false)))]).map(r => [r.ref, r]));
  const canvis = [];
  const retirades = new Set();
  for (const a of fantasmes) {
    const r = perRef.get(referent(a.raw, false));
    if (r.ancora) canvis.push({ ...a, text: `${a.marca}[[${r.ancora}${sufixDe(a.raw)}]]` });
    else if (!r.trobats.length) { canvis.push({ ...a, text: '' }); retirades.add(r.ref); }
  }
  const nou = aplica(text, canvis);
  if (!retirades.size) return nou;
  return afigASeccio(nou, SECCIO_SENSE_DESTI, [...retirades].map(ref =>
    `- ${dia} · \`${ref}\`: cap fitxer amb eixe nom als llocs cercats (${LLOCS_CERCATS}); retirada per --repara.`));
}

/**
 * Remei de les àncores fantasma. Les que tenen un sol destí es reescriuen al mateix
 * lloc amb camí, conservant àlies i fragment; les que no en tenen cap ixen de la
 * prosa i en queda constància, sense enllaç viu, a la secció pròpia. Les ambigües
 * no es toquen. Només MarIA o el Mestre: hooks-local no la deixa als agents.
 */
export function repara(arrel = arrelPerDefecte(), { sec = false, dia = avui() } = {}) {
  const errors = errorsEstructura(arrel);
  if (errors.length) throw new Error(errors.join('\n'));
  const diagnosi = remeis(arrel);
  const unics = diagnosi.filter(r => r.ancora);
  const senseDesti = diagnosi.filter(r => !r.trobats.length);
  const ambigus = diagnosi.filter(r => r.trobats.length > 1);
  if (sec || (!unics.length && !senseDesti.length)) return { unics, senseDesti, ambigus, index: false, sec };
  comprovaIndex(arrel);
  const index = ambLock(arrel, () => escriuIndex(arrel, text => reparaText(text, arrel, dia)));
  return { unics, senseDesti, ambigus, index, sec };
}

function reanomenaText(text, vell, nou, presents) {
  // Com abreuja a draft-write: si un recurs sense extensió es diu com el nou sense
  // .md, l'àncora abreujada resoldria a ell i el document quedaria sense àncora.
  const curt = presents.has(senseMd(nou)) ? nou : senseMd(nou);
  const canvis = [];
  for (const a of ancoresDe(text)) {
    if (resolAncora(a.raw, presents) !== vell) continue;
    const i = a.raw.search(/\\?[|#]/);
    const cap = (i < 0 ? a.raw : a.raw.slice(0, i)).trim();
    const base = path.posix.basename(cap);
    canvis.push({ ...a, text: `${a.marca}[[${cap.slice(0, cap.length - base.length)}${base === vell ? nou : curt}${sufixDe(a.raw)}]]` });
  }
  return aplica(text, canvis);
}

/**
 * Reanomena un document solt dins de l'Escriptori i reescriu totes les formes de la
 * seua àncora ([[x]], [[x.md]], [[x|àlies]], [[04_escriptori/x]], ![[x]]). Els dos
 * noms han de ser taxonòmics, amb la mateixa extensió, i el nou no pot existir.
 * Si el document porta rebut de torn, el relleu ha de ser possible abans de moure
 * res (torn obert i vigent, rebut del nom vell); si no, el document reanomenat
 * quedaria amb un rebut d'un altre fitxer per a sempre. Torna l'ordre handoff
 * exacta. Si el rebut ja és del nom nou, el reanomenat el torna al seu lloc i no
 * cal cap handoff (`retorn`): és també la recuperació d'un handoff fallit.
 */
export function renomena(arrel = arrelPerDefecte(), { vell, nou, sec = false } = {}) {
  const errors = errorsEstructura(arrel);
  if (errors.length) throw new Error(errors.join('\n'));
  const v = nomSolt(vell, '--renomena');
  const n = nomSolt(nou, '--a');
  for (const [nom, bandera] of [[v, '--renomena'], [n, '--a']]) {
    if (!NOM_ARTEFACTE.test(nom)) throw new Error(`${bandera} ${nom}: no és un nom taxonòmic aammdd_hhmm_categoria_titol.ext`);
  }
  if (v === n) throw new Error(`--a ${n}: és el mateix nom; no hi ha res a reanomenar`);
  if (NOM_ARTEFACTE.exec(v)[4] !== NOM_ARTEFACTE.exec(n)[4]) throw new Error(`--a ${n}: ha de conservar l'extensió de ${v}`);
  const presents = nomsSolts(arrel);
  if (!presents.has(v)) throw new Error(`--renomena ${v}: no és cap document solt de ${ESCRIPTORI}`);
  const origen = path.join(arrel, ESCRIPTORI, v);
  const desti = path.join(arrel, ESCRIPTORI, n);
  if (existeix(desti)) throw new Error(`--a ${n}: ja existix a ${ESCRIPTORI}; no es sobreescriu`);
  const r = relleu(arrel, reflexDe(origen), `${ESCRIPTORI}/${v}`);
  const retorn = Boolean(r) && r.fitxer === `${ESCRIPTORI}/${n}`;
  if (r && !r.possible && !retorn) {
    throw new Error(`--renomena ${v}: el relleu del torn ${r.torn} no és possible (${r.motiu}). No s'ha mogut res: el document conserva el nom, perquè reanomenat quedaria amb un rebut d'un altre fitxer. Un nom nou naix de nou amb document.mjs context i create.`);
  }
  const ordre = r && !retorn ? `node tooling/wiki/document.mjs handoff --turn-id ${r.torn} --file ${ESCRIPTORI}/${v} --to ${ESCRIPTORI}/${n}` : null;
  const ancores = ancoresDe(fs.readFileSync(path.join(arrel, INDEX), 'utf8')).filter(a => resolAncora(a.raw, presents) === v).length;
  if (sec) return { vell: v, nou: n, ancores, ordre, retorn, index: false, sec };
  comprovaIndex(arrel);
  return ambLock(arrel, () => {
    // Com a l'arxivat, el cens que resol les àncores es pren dins del lock.
    const cens = nomsSolts(arrel);
    mouSenseTrepitjar(origen, desti);
    try {
      const index = escriuIndex(arrel, text => reanomenaText(text, v, n, cens));
      return { vell: v, nou: n, ancores, ordre, retorn, index, sec };
    } catch (error) {
      mouSenseTrepitjar(desti, origen);
      throw error;
    }
  });
}

/* ── CLI ──────────────────────────────────────────────────────────────────── */

const US = 'Ús: porta-olivera.mjs [--informe] | --hook | --arxiva [--nom FITXER]... [--sessio aammdd_Nom] [--reapunta] [--sec] | --repara [--sec] | --renomena VELL --a NOU [--sec]';

/** Banderes de la línia d'ordres. Una bandera desconeguda no es llig com a informe: falla. */
function opcions(argv) {
  const o = { informe: false, hook: false, arxiva: false, repara: false, renomena: null, a: null, sec: false, reapunta: false, sessio: null, noms: [] };
  const valor = (i, nom, que) => {
    const a = argv[i];
    const v = a === nom ? argv[i + 1] : a.slice(nom.length + 1);
    if (!v || v.startsWith('--')) throw new Error(`${nom} necessita ${que}. ${US}`);
    return v;
  };
  const una = (actual, nom) => { if (actual !== null) throw new Error(`${nom} només es pot donar una vegada. ${US}`); };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const amb = nom => a === nom || a.startsWith(`${nom}=`);
    if (a === '--informe') o.informe = true;
    else if (a === '--hook') o.hook = true;
    else if (a === '--arxiva') o.arxiva = true;
    else if (a === '--repara') o.repara = true;
    else if (a === '--sec') o.sec = true;
    else if (a === '--reapunta') o.reapunta = true;
    else if (amb('--nom')) { o.noms.push(valor(i, '--nom', "el nom d'un document")); if (a === '--nom') i++; }
    else if (amb('--sessio')) { una(o.sessio, '--sessio'); o.sessio = valor(i, '--sessio', 'el nom de la carpeta de sessió (aammdd_Nom)'); if (a === '--sessio') i++; }
    else if (amb('--renomena')) { una(o.renomena, '--renomena'); o.renomena = valor(i, '--renomena', 'el nom actual del document'); if (a === '--renomena') i++; }
    else if (amb('--a')) { una(o.a, '--a'); o.a = valor(i, '--a', 'el nom nou del document'); if (a === '--a') i++; }
    else throw new Error(`Argument desconegut: ${a}. ${US}`);
  }
  if ([o.informe, o.hook, o.arxiva, o.repara, o.renomena !== null].filter(Boolean).length > 1) throw new Error(`Tria un sol mode. ${US}`);
  const mal = 'només valen amb --arxiva; --sec també amb --repara i --renomena';
  if ((o.noms.length || o.sessio !== null || o.reapunta) && !o.arxiva) throw new Error(`--nom, --sessio, --reapunta i --sec ${mal}. ${US}`);
  if (o.sec && !o.arxiva && !o.repara && o.renomena === null) throw new Error(`--nom, --sessio, --reapunta i --sec ${mal}. ${US}`);
  if ((o.renomena === null) !== (o.a === null)) throw new Error(`--renomena i --a van junts: --renomena VELL --a NOU. ${US}`);
  return o;
}

function informe(arrel, dia = avui()) {
  const taula = checkTaula(arrel, { dia });
  if (taula.errors.some(error => error.startsWith("Estructura de l'Escriptori"))) {
    for (const error of taula.errors) console.error(`[Porta Olivera] ${error}`);
    return 1;
  }
  const docs = inventari(arrel);
  const activitat = viusExactes(arrel);
  const viu = docs.filter(d => activitat.has(d.nom)).map(d => d.nom.replace(/\.md$/, '')).sort();
  const bruts = ranci(arrel, dia);
  const rancis = new Set(bruts.map(d => d.nom));
  const perNom = artefactes(arrel).filter(d => d.data < dia && (TRANSITORIES.test(d.categoria) || PER_NOM.test(d.categoria)) && !activitat.has(d.nom) && !rancis.has(d.nom));
  const bustia = safata(arrel);
  const anc = ancoratge(arrel);
  const pla = plaDeHui(arrel, dia);
  console.log(`[Porta Olivera] Escriptori: ${docs.length} documents solts.`);
  console.log(`ℹ️ Artefactes regulars visibles de primer nivell: ${fitxersSolts(arrel).filter(d => d.nom !== '00_index_escriptori.md').length}; tots exigixen àncora. Per nom (--arxiva --nom, qualsevol extensió) ixen les categories de torn, produccio i avaluacio; l'envelliment automàtic continua limitat a Markdown.`);
  if (perNom.length) console.log(`ℹ️ Artefactes de jornades anteriors que poden eixir per nom (no fan caure la porta): ${perNom.length} (${perNom.slice(0, 5).map(d => d.nom).join(', ')}${perNom.length > 5 ? '…' : ''})`);
  console.log(viu.length
    ? `🌿 Declarats vius a «## Activitat en curs» (es conserven): ${viu.join(', ')}`
    : '🌿 Cap document de la taula declarat viu a «## Activitat en curs».');
  if (bruts.length) {
    console.log(`❌ ${bruts.length} de jornades anteriors sense declarar vius (han d'anar a ${ARXIU}/):`);
    for (const d of bruts) console.log(`   · ${d.nom}`);
  } else console.log('✅ Cap document consumit de jornades anteriors.');
  console.log(bustia.elements.length ? `❌ Safata d'entrada amb ${bustia.elements.length} element(s): ${bustia.elements.join(', ')}` : "✅ Safata d'entrada buida.");
  if (anc.senseAncora.length) console.log(`❌ Sense àncora a l'índex: ${anc.senseAncora.join(', ')}`);
  if (anc.fantasma.length) console.log(`❌ Àncores a documents absents (fan caure la porta): ${textFantasmes(arrel, anc.fantasma)}`);
  console.log(pla.length
    ? `ℹ️ Pla d'Implementació de hui: ${pla.map((d) => d.nom).join(', ')}`
    : "ℹ️ Cap Pla d'Implementació de hui: el demana l'escriptura d'una petorreta, no l'Escriptori net.");
  return checkTaula(arrel, { dia }).valid ? 0 : 1;
}

function main(argv = process.argv.slice(2)) {
  const o = opcions(argv);
  const arrel = arrelPerDefecte();

  if (o.arxiva) {
    const r = arxiva(arrel, { noms: o.noms, sec: o.sec, sessio: o.sessio, reapunta: o.reapunta });
    if (o.sec) console.log('[Porta Olivera] Simulació (--sec): no es mou cap fitxer ni es toca l’índex.');
    if (!r.moguts.length) console.log('[Porta Olivera] Res a arxivar.');
    for (const m of r.moguts) console.log(`   · ${m.nom} → ${path.posix.dirname(m.desti)}/ (${m.nota})`);
    if (r.index) console.log(`   · ${INDEX} actualitzat.`);
    for (const m of r.moguts.filter(x => x.nota === 'mogut' && x.nom.endsWith('.md'))) {
      if (m.relleu) console.log(`   Relleu del torn: node tooling/wiki/document.mjs handoff --turn-id ${m.torn} --file ${m.rel} --to ${m.desti} (l'índex ja porta l'àncora amb camí al destí)`);
      else if (m.torn) console.log(`   Rebut del torn ${m.torn} sense relleu possible (${m.motiu}): no hi ha cap handoff a fer.`);
      else console.log(`   Si porta rebut de torn: node tooling/wiki/document.mjs handoff --turn-id ID --file ${m.rel} --to ${m.desti}`);
    }
    process.exitCode = !o.sec && r.moguts.some(m=>m.nota !== 'mogut') ? 1 : 0;
    return;
  }

  if (o.repara) {
    const r = repara(arrel, { sec: o.sec });
    if (o.sec) console.log('[Porta Olivera] Simulació (--sec): no es toca l’índex.');
    if (!r.unics.length && !r.senseDesti.length && !r.ambigus.length) console.log('[Porta Olivera] Cap àncora fantasma: res a reparar.');
    for (const x of r.unics) console.log(`   · ${x.ref} → [[${x.ancora}]] (és a ${x.trobats[0]})`);
    for (const x of r.senseDesti) console.log(`   · ${x.ref} → sense destí: ${o.sec ? 'es retiraria' : 'retirada'} a «## ${SECCIO_SENSE_DESTI}»`);
    if (o.sec && r.senseDesti.length) console.log(`   Avís: sense destí vol dir que no és als llocs cercats (${LLOCS_CERCATS}). Un document més fons es retiraria igual: comprova'l abans de reparar.`);
    for (const x of r.ambigus) console.log(`   · ${x.ref} → ambigua (${x.trobats.join(', ')}): no es toca; tria l'àncora a mà`);
    if (r.index) console.log(`   · ${INDEX} actualitzat.`);
    for (const x of r.unics.filter(u => u.trobats[0].endsWith('.md'))) {
      console.log(`   Si portava rebut de torn: node tooling/wiki/document.mjs handoff --turn-id ID --file ${ESCRIPTORI}/${path.posix.basename(x.trobats[0])} --to ${x.trobats[0]}`);
    }
    process.exitCode = r.ambigus.length ? 1 : 0;
    return;
  }

  if (o.renomena !== null) {
    const r = renomena(arrel, { vell: o.renomena, nou: o.a, sec: o.sec });
    if (o.sec) console.log('[Porta Olivera] Simulació (--sec): no es mou cap fitxer ni es toca l’índex.');
    console.log(`   · ${r.vell} → ${r.nou} (${r.ancores} àncora/es de l'índex ${o.sec ? 'es reescriurien' : 'reescrites'})`);
    if (r.index) console.log(`   · ${INDEX} actualitzat.`);
    if (r.ordre) {
      console.log(`   Relleu del torn: ${r.ordre}`);
      console.log(`   Si el handoff falla, torna'l al nom vell: node tooling/gates/porta-olivera.mjs --renomena ${r.nou} --a ${r.vell}`);
    } else console.log(r.retorn ? '   El rebut del torn ja és del nom nou: el document torna al seu lloc i no cal cap handoff.' : '   Sense rebut de torn al frontmatter: no cal cap handoff.');
    return;
  }

  if (!o.hook) { process.exitCode = informe(arrel); return; }

  // Mode hook: sense payload no hi ha res a jutjar, i no es pot fingir un verd.
  if (tty.isatty(0)) {
    console.error('[PORTA-OLIVERA] --hook espera el payload JSON per stdin; des d’un terminal usa el mode informe (sense bandera).');
    process.exitCode = 2;
    return;
  }
  const raw = fs.readFileSync(0, 'utf8');
  if (!raw.trim()) {
    console.error('[PORTA-OLIVERA] --hook amb payload buit; cap comprovació executada.');
    process.exitCode = 2;
    return;
  }

  // Un payload il·legible no acredita cap comprovació: falla tancat.
  let result;
  try { result = checkPayload(JSON.parse(raw), arrel); }
  catch (e) {
    console.error(`[PORTA-OLIVERA] payload il·legible (${e.message}); cap comprovació executada.`);
    result = { code: 2, errors: ['Payload il·legible: cap autorització'] };
  }

  if (result.errors.length) {
    console.error(`[PORTA-OLIVERA] BLOQUEIG · ${result.file ?? '(sense destí)'}\n${result.errors.map((e) => `- ${e}`).join('\n')}\nLa Reunió a l'Olivera comença amb la taula classificada i el Pla damunt.`);
  }
  process.exitCode = result.code;
}

// `import.meta.url` porta el camí REAL i `process.argv[1]` el camí tal com
// s'ha escrit: sota un symlink (/var cap a /private/var a macOS, i qualsevol
// fixture de proves a os.tmpdir()) no coincidixen, el mòdul es carrega en
// silenci i la porta ix 0 sense comprovar res. Resoldre el symlink és el que
// fa que la guarda parle sempre.
if (esMain(import.meta.url)) {
  try { main(); } catch (e) { console.error(e.message); process.exitCode = 2; }
}
