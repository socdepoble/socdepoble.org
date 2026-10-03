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
 *       l'índex, cap àncora a un document absent i cap fitxer solt fora de la
 *       forma `aammdd_hhmm_categoria_titol.md`.
 *    2. Hi ha un Pla d'Implementació d'aquesta jornada: la pissarra compartida
 *       existix abans de convocar ningú.
 *    3. La petorreta porta la secció 0 i cap casella sense marcar. La secció es
 *       pot dir «0. Abans de generar» o «0. Preflight», que és el nom que du la
 *       plantilla `prompt_local.md`: un prompt fet bé des de la plantilla no pot
 *       quedar bloquejat pel nom de la capçalera.
 *
 *  La taula es jutja quan la petorreta naix (261002, D11). Mentre no és al disc,
 *  o la versió del disc encara no porta la secció 0 completa, es comproven les
 *  tres coses: és el moment en què l'autor certifica la taula. Una petorreta ja
 *  nascuda només ha de conservar la secció 0 completa: un document nou d'un altre
 *  agent no bloqueja l'edició d'un prompt que ja va passar la porta.
 *
 *  Viu per declaració, no per data (260930). A les 00:00 el rellotge convertia en
 *  brossa el prompt que s'estava executant. Ara decidix qui treballa: tot document
 *  llistat davall d'una capçalera «Activitat en curs» de l'índex continua viu,
 *  siga del dia que siga, i `ranci()` no el toca. La capçalera és de nivell 2 o 3,
 *  no distingix caixa i admet un prefix no alfabètic (`## 🌿 Activitat en curs`).
 *  La tria és explícita i auditable: l'informe la mostra sencera.
 *
 *  Sense Escriptori no hi ha verd (260930b). Si a l'arrel jutjada falta la
 *  carpeta o l'índex (un SDP_ARREL desviat), la taula no és vàlida: un inventari
 *  buit no és una taula neta. L'arrel ve de `SDP_ARREL` o d'`arrelSegura()`
 *  (tooling/lib/arrel.mjs), mai del directori de treball (261002, D6).
 *
 *  Àncores planes (260930b). Una àncora compta pel nom sense àlies, fragment ni
 *  `.md` (`[[X|àlies]]`, `[[X#T6]]` i `[[X.md]]` són X), i el mateix analitzador
 *  servix per a l'ancoratge i per als vius (D3). Una àncora amb camí apunta fora
 *  del primer nivell (l'arxiu, una subcarpeta): ni ancora cap document de la taula
 *  ni pot ser-ne fantasma.
 *
 *  L'informe (`npm run porta:olivera`) jutja la taula, no la petorreta: ix amb 0
 *  quan `checkTaula` és vàlid. El «pla de hui» només té sentit quan s'escriu una
 *  petorreta, i per això el demana el hook i no l'informe; si no, un Escriptori
 *  acabat de netejar al matí no passaria mai abans del primer pla. Les categories
 *  fora de `tooling/wiki/taxonomia.json` ixen com a avís, sense canviar el verd.
 *
 *  No esborra res mai. `--arxiva` és un sol acte (261002):
 *    · valida tots els noms abans de moure res i diu tots els errors junts (D1);
 *      per nom ix qualsevol document solt amb nom taxonòmic, i el filtre de
 *      categories de torn queda només per a l'arxivat sense noms;
 *    · una col·lisió amb l'arxiu no mou res i ix amb 1 (D5);
 *    · trasllada a `90_arxiu_historic/` i, en el mateix acte, fa el relleu de tots
 *      els torns vius que citen el document: tots els rebuts amb eixe fitxer i el
 *      pla dels torns que el tenen com a pla (D7, D8, O15, O19). Si el relleu
 *      falla, el document torna al seu lloc, cap torn queda a mitges i ix amb 2;
 *    · reapunta cap a l'arxiu cada àncora plana del document, en qualsevol posició
 *      de la línia, sense emportar-se les altres (D4). Dins de «Vincles» i
 *      d'«Activitat en curs» l'àncora se n'ix; si el document es queda sense cap
 *      àncora, s'afig davall de «## Arxivat amb la Porta Olivera», perquè el
 *      torn que el cita el trobe (`anchored` admet l'àncora amb camí).
 *  `--arxiva --sec` no toca res i fa mecànic l'Acte Reflex Pre-Arxivament: per a
 *  cada document diu quins torns, quines línies d'ESTAT, quins fitxers dels
 *  laboratoris i quins documents de la taula el citen encara.
 *
 *  Ús:
 *    porta-olivera.mjs [--informe]          # auditoria de l'Escriptori (eixida 1 si brut); mai llig stdin
 *    porta-olivera.mjs --hook               # hook: llig el payload per stdin
 *    porta-olivera.mjs --arxiva [--sec]     # mou els consumits de jornades anteriors
 *    porta-olivera.mjs --arxiva --nom F.md [--nom G.md] [--sec]
 *                                           # mou documents concrets, també d'avui
 *  Eixides de --arxiva: 0 fet (o res a fer), 1 col·lisió amb l'arxiu, 2 noms
 *  invàlids, relleu fallit o trasllat trencat.
 *
 *  El mode hook és explícit: sense bandera, `readFileSync(0)` esperava un EOF que
 *  un terminal (o un pipe que ningú tanca) no envia mai, i la porta es penjava
 *  just quan la skill manava executar-la.
 */
import { CAMINS, arrelSegura } from '../lib/arrel.mjs';
import { hashFile } from '../documental/core.mjs';
import { relocateDocument, turnsCiting } from '../documental/turns.mjs';
import fs from 'node:fs';
import path from 'node:path';
import tty from 'node:tty';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * Arrel jutjada (261002, D6). `SDP_ARREL` mana tal com ve (les proves i el CI
 * hi posen un Mas sintètic); sense, la de `tooling/lib/arrel.mjs`, que es
 * descobrix des d'este mòdul i no des del cwd. Si tampoc n'hi ha, null: la CLI
 * ho diu i ix amb 2.
 */
function arrelDeLaPorta() {
  if (process.env.SDP_ARREL) return path.resolve(process.env.SDP_ARREL);
  try { return arrelSegura(); } catch { return null; }
}

export const ARREL = arrelDeLaPorta();
const ESCRIPTORI = CAMINS.escriptori;
const ARXIU = CAMINS.arxiuHistoric;
const INDEX = CAMINS.indexEscriptori;
const ESTAT = CAMINS.estat;
const LABORATORIS = `${ESCRIPTORI}/02_investigacio_ia`;
const NOM_INDEX = path.posix.basename(INDEX);
/** Camí de l'arxiu vist des de l'Escriptori, per a les àncores reapuntades. */
const CAP_A_ARXIU = path.posix.relative(ESCRIPTORI, ARXIU);
/** Secció on queden ancorats els arxivats que no tenien cap altra àncora. */
export const SECCIO_ARXIVATS = 'Arxivat amb la Porta Olivera';
/** Catàleg de categories: el de l'arbre d'esta porta, com fa el hook d'Antigravity. */
const CATALEG = fileURLToPath(new URL('../wiki/taxonomia.json', import.meta.url));

/** Categories de treball d'un torn: naixen, servixen i se'n van a l'arxiu. Només mana en l'arxivat sense noms. */
export const TRANSITORIES = /^(prompt|macro_prompt|micro_prompt|petorreta|auditoria|informe|bundle|macro_bundle|micro_bundle|pla|acta|tasques)$/;

const NOM = /^(\d{6})_(\d{4})_([a-z0-9]+(?:_[a-z0-9]+)*)\.md$/;

/** Capçalera que declara vius els documents que llista: sense distingir caixa, amb un prefix no alfabètic opcional. */
const ACTIVITAT = /^[^\p{L}]*activitat en curs/iu;

/** Secció 0 d'una petorreta: el nom de les proves antigues i el de la plantilla viva. */
const SECCIO_ZERO = /^##[ \t]+0\.[ \t]+(?:Abans de generar|Preflight)[^\n]*\n([\s\S]*?)(?=^#{1,2}[ \t]+|(?![\s\S]))/m;

const sense = (nom) => nom.replace(/\.md$/, '');

/** `aammdd` d'avui, en hora local: és el segell que porten els noms de fitxer. */
export function avui(ara = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${p(ara.getFullYear() % 100)}${p(ara.getMonth() + 1)}${p(ara.getDate())}`;
}

/**
 * Nom pla d'una àncora (`X|àlies`, `X#secció` i `X.md` són X), o null si porta camí.
 * Dins d'una taula Obsidian escapa la barra de l'àlies (`X\|àlies`): també és X (OLIV-R7).
 */
export function ancoraPlana(cru) {
  const nom = String(cru).replace(/\\\|/g, '|').split('|')[0].split('#')[0].trim().replace(/\.md$/i, '');
  return nom && !nom.includes('/') ? nom : null;
}

/** Àncores planes d'un text, en l'ordre en què apareixen. */
const ancoresPlanes = (text) => [...text.matchAll(/\[\[([^\]]+)\]\]/g)].map((m) => ancoraPlana(m[1])).filter(Boolean);

/** Fitxers no ocults del primer nivell de l'Escriptori, índex inclòs. */
function solts(arrel) {
  const dir = path.join(arrel, ESCRIPTORI);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && !e.name.startsWith('.'))
    .map((e) => e.name)
    .sort();
}

/** Documents solts de l'Escriptori, amb data, categoria i cognom. */
export function inventari(arrel = ARREL) {
  const dir = path.join(arrel, ESCRIPTORI);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && !e.name.startsWith('.') && e.name.endsWith('.md'))
    .map((e) => {
      const m = NOM.exec(e.name);
      if (!m) return null;
      const [, data, hora, resta] = m;
      const categoria = resta.startsWith('pla_implementacio') ? 'pla' : resta.split('_')[0];
      return { nom: e.name, rel: `${ESCRIPTORI}/${e.name}`, data, hora, categoria, resta };
    })
    .filter(Boolean);
}

/**
 * Fitxers solts del primer nivell fora de la forma `aammdd_hhmm_categoria_titol.md`
 * (accents, guions, noms sense data, fitxers que no són .md). La porta no els pot
 * jutjar, i per això ixen amb un error propi en compte de desaparéixer.
 */
export function forasters(arrel = ARREL) {
  return solts(arrel).filter((n) => n !== NOM_INDEX && !NOM.test(n));
}

/** Què falta perquè hi haja taula a l'arrel jutjada: la carpeta de l'Escriptori o el seu índex. */
export function absencies(arrel = ARREL) {
  const dir = path.join(arrel, ESCRIPTORI);
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return [ESCRIPTORI];
  return fs.existsSync(path.join(arrel, INDEX)) ? [] : [INDEX];
}

/** Cos de cada secció «Activitat en curs» (nivell 2 o 3): fins a la capçalera següent del mateix nivell o més alt. */
function blocsActivitat(text) {
  const blocs = [];
  let actual = null;
  let nivell = 0;
  for (const linia of text.split('\n')) {
    const h = /^(#{1,6})[ \t]+(.*)$/.exec(linia);
    if (h && actual && h[1].length <= nivell) { blocs.push(actual.join('\n')); actual = null; }
    if (h && !actual && h[1].length >= 2 && h[1].length <= 3 && ACTIVITAT.test(h[2])) { actual = []; nivell = h[1].length; continue; }
    if (actual) actual.push(linia);
  }
  if (actual) blocs.push(actual.join('\n'));
  return blocs;
}

/**
 * Noms (sense `.md`) que l'índex declara vius davall de qualsevol «Activitat en
 * curs». Només compten les àncores planes, com a `ancoratge()`: una àncora amb `/`
 * apunta fora del primer nivell i no pot protegir cap document de la taula.
 */
export function vius(arrel = ARREL) {
  const p = path.join(arrel, INDEX);
  const text = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
  return new Set(blocsActivitat(text).flatMap(ancoresPlanes));
}

/** El que hauria d'estar a l'arxiu: categoria de torn, data anterior a hui i cap declaració de viu. */
export function ranci(arrel = ARREL, dia = avui()) {
  const viu = vius(arrel);
  return inventari(arrel).filter((d) => TRANSITORIES.test(d.categoria) && d.data < dia && !viu.has(sense(d.nom)));
}

/** Documents de torn d'avui sense declarar vius: els que l'arxivat sense noms no mou mai (D2). */
export function candidatsDeHui(arrel = ARREL, dia = avui()) {
  const viu = vius(arrel);
  return inventari(arrel).filter((d) => TRANSITORIES.test(d.categoria) && d.data === dia && !viu.has(sense(d.nom)));
}

/** Pissarra compartida d'aquesta jornada. */
export function plaDeHui(arrel = ARREL, dia = avui()) {
  return inventari(arrel).filter((d) => /^pla_implementacio(?:_|$)/.test(d.resta) && d.data === dia);
}

/**
 * Elements de la Safata d'Entrada, que ha d'estar sempre buida (AGENTS §12). La
 * carpeta es busca sense distingir caixa: el codi en conserva `00_Bandeja_d_Entrada`
 * i el disc du `00_bandeja_d_entrada`, i a Linux una comparació exacta no la veuria.
 */
export function safata(arrel = ARREL) {
  const dir = path.join(arrel, ESCRIPTORI);
  if (!fs.existsSync(dir)) return { carpeta: null, elements: [] };
  const carpeta = fs.readdirSync(dir, { withFileTypes: true })
    .find((e) => e.isDirectory() && /^00_bandeja_d_entrada$/i.test(e.name));
  if (!carpeta) return { carpeta: null, elements: [] };
  const elements = fs.readdirSync(path.join(dir, carpeta.name)).filter((n) => !n.startsWith('.')).sort();
  return { carpeta: `${ESCRIPTORI}/${carpeta.name}`, elements };
}

/**
 * Documents de l'Escriptori sense àncora a l'índex, i àncores a fitxers absents.
 * Només compten les àncores planes, com a `vius()`: les que porten camí apunten
 * fora del primer nivell. Un fantasma és una àncora plana sense cap fitxer solt
 * amb eixe nom, siga o no taxonòmic (el nom dolent ja té el seu error).
 */
export function ancoratge(arrel = ARREL) {
  const indexPath = path.join(arrel, INDEX);
  const text = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : '';
  const planes = [...new Set(ancoresPlanes(text))];
  const ancorats = new Set(planes);
  const presents = new Set(solts(arrel).flatMap((n) => [n, n.replace(/\.md$/, '')]));
  return {
    senseAncora: inventari(arrel).filter((d) => !ancorats.has(sense(d.nom))).map((d) => d.nom),
    fantasma: planes.filter((a) => !presents.has(a))
  };
}

/* ── Catàleg i avisos ─────────────────────────────────────────────────────── */

let catalegCache;
/** Categories de `tooling/wiki/taxonomia.json`, de la més llarga a la més curta; null si no es pot llegir. */
export function categoriesCataleg() {
  if (catalegCache !== undefined) return catalegCache;
  try { catalegCache = Object.keys(JSON.parse(fs.readFileSync(CATALEG, 'utf8')).categories ?? {}).sort((a, b) => b.length - a.length); }
  catch { catalegCache = null; }
  return catalegCache;
}

/** Categoria del catàleg d'un nom (prefix més llarg), null si no hi és, undefined si no hi ha catàleg. */
export function categoriaDelCataleg(resta, cataleg = categoriesCataleg()) {
  if (!cataleg) return undefined;
  return cataleg.find((c) => resta === c || resta.startsWith(`${c}_`)) ?? null;
}

/**
 * Avisos que no fan caure la taula (261002, D1): categories fora del catàleg, i
 * documents de jornades anteriors que no són de torn i ningú declara vius. La
 * porta no els arxiva sola, però els diu, amb l'ordre que ho resol.
 */
export function avisos(arrel = ARREL, { dia = avui() } = {}) {
  const out = [];
  const docs = inventari(arrel);
  const cataleg = categoriesCataleg();
  if (!cataleg) out.push(`No s'ha pogut llegir el catàleg tooling/wiki/taxonomia.json: les categories no s'han comprovat.`);
  else {
    const fora = docs.filter((d) => categoriaDelCataleg(d.resta, cataleg) === null);
    if (fora.length) {
      out.push(`Categoria fora de tooling/wiki/taxonomia.json: ${fora.map((d) => `${d.nom} («${d.resta.split('_')[0]}»)`).join(', ')}. Si continua viu, reanomena'l amb una categoria del catàleg; si està consumit, node tooling/gates/porta-olivera.mjs --arxiva --sec --nom NOM.md i després sense --sec.`);
    }
  }
  const viu = vius(arrel);
  const vells = docs.filter((d) => !TRANSITORIES.test(d.categoria) && d.data < dia && !viu.has(sense(d.nom)));
  if (vells.length) {
    out.push(`De jornades anteriors, fora de les categories de torn i sense declarar vius: ${vells.map((d) => d.nom).join(', ')}. Declara'ls davall de «## Activitat en curs» si continuen, o arxiva'ls per nom (--arxiva --nom).`);
  }
  return out;
}

/**
 * El remei concret d'una àncora fantasma (D2). Si el document ja és a l'arxiu,
 * l'àncora que li toca i, per a cada torn viu que el cita encara a l'Escriptori,
 * l'ordre de relleu sencera. Només mira si el fitxer existix i llig els torns.
 */
function remeiFantasma(arrel, nom) {
  if (!fs.existsSync(path.join(arrel, ARXIU, `${nom}.md`))) {
    return `${nom}: no és a la taula ni a ${ARXIU}/; si viu en una subcarpeta, l'àncora porta el camí ([[02_investigacio_ia/${nom}]], [[../10_actes/${nom}]]); si s'ha esborrat, avisa el Mestre (AGENTS §5)`;
  }
  let ordres = [];
  try {
    ordres = turnsCiting(arrel, `${ESCRIPTORI}/${nom}.md`).filter((c) => c.live)
      .map((c) => `node tooling/wiki/document.mjs handoff --turn-id ${c.id} --file ${ESCRIPTORI}/${nom}.md --to ${ARXIU}/${nom}.md`);
  } catch { /* sense torns llegibles, el remei és només l'àncora */ }
  return `${nom}: ja és a ${ARXIU}/; l'àncora és [[${CAP_A_ARXIU}/${nom}]]${ordres.length ? `, i falta el relleu: ${ordres.join(' ; ')}` : ''}`;
}

/**
 * Escriptori net: la definició única (AGENTS §0.1) i el que jutja l'informe.
 * Brossa, Safata, noms i àncores; el «pla de hui» no hi entra, és cosa de la petorreta.
 * Cada error porta el remei concret (D2). Els avisos no canvien el verd.
 */
export function checkTaula(arrel = ARREL, { dia = avui() } = {}) {
  const falten = absencies(arrel);
  if (falten.length) {
    return { valid: false, errors: [`Escriptori absent a ${arrel}: falta ${falten.join(' i ')}; no s'ha comprovat res. Corregix SDP_ARREL o executa la porta des d'un clon complet del repositori.`], avisos: [] };
  }
  const errors = [];

  const bruts = ranci(arrel, dia);
  if (bruts.length) {
    errors.push(`Escriptori sense classificar: ${bruts.length} document(s) de jornades anteriors encara damunt la taula (${bruts.map((d) => d.nom).join(', ')}). Si estan consumits: node tooling/gates/porta-olivera.mjs --arxiva --sec i després --arxiva; si continuen vius, declara'ls davall de «## Activitat en curs» a ${INDEX}`);
  }

  const bustia = safata(arrel);
  if (bustia.elements.length) {
    errors.push(`Safata d'entrada amb ${bustia.elements.length} element(s) (${bustia.carpeta}: ${bustia.elements.slice(0, 5).join(', ')}${bustia.elements.length > 5 ? '…' : ''}). La Safata s'ha de buidar sempre (AGENTS §12).`);
  }

  const fora = forasters(arrel);
  if (fora.length) {
    errors.push(`Noms fora de taxonomia al primer nivell (aammdd_hhmm_categoria_titol.md, AGENTS §2): ${fora.join(', ')}. La porta no els pot jutjar: reanomena'ls o trasllada'ls.`);
  }

  const anc = ancoratge(arrel);
  if (anc.senseAncora.length) {
    errors.push(`Sense àncora a l’índex: ${anc.senseAncora.join(', ')}. Si és viu, afig «- [[NOM]]» davall de «## Activitat en curs» a ${INDEX}; si està consumit, node tooling/gates/porta-olivera.mjs --arxiva --nom NOM.md (mai a mà: el trasllat i el relleu són un sol acte).`);
  }
  if (anc.fantasma.length) {
    errors.push(`Àncores a documents absents: ${anc.fantasma.join(', ')}. ${anc.fantasma.map((n) => remeiFantasma(arrel, n)).join(' · ')}`);
  }

  return { valid: errors.length === 0, errors, avisos: avisos(arrel, { dia }) };
}

/** Errors de la secció 0 d'una petorreta: ha d'existir i no pot dur caselles sense marcar. */
export function errorsSeccioZero(contingut) {
  const section = SECCIO_ZERO.exec(String(contingut ?? ''));
  if (!section) {
    return ["La petorreta no porta la secció 0: «0. Abans de generar (per a l'autor, no per al destinatari)» o «0. Preflight», com la plantilla prompt_local.md. És la precondició d'higiene i ha de viatjar dins del document, no a la memòria de qui l'escriu."];
  }
  if (/^[ \t]*[-*+][ \t]+\[[ \t]\]/m.test(section[1])) return ['La secció 0 té caselles sense marcar. Cap petorreta ix del Mas amb la llista a mitges.'];
  return [];
}

/** Les tres comprovacions de la transició Pla → Petorreta: la taula, el pla i la secció 0. */
export function checkOlivera(arrel = ARREL, { contingut = null, dia = avui() } = {}) {
  const errors = [...checkTaula(arrel, { dia }).errors];

  if (!plaDeHui(arrel, dia).length) {
    errors.push(`Cap Pla d'Implementació de hui (${dia}) a l'Escriptori. Les altres IAs arriben a una habitació sense pissarra. Genera'l abans: node tooling/wiki/document.mjs context --turn-id ID --route pla.implementacio --file ${ESCRIPTORI}/${dia}_HHMM_pla_implementacio_COGNOM.md (el nom comença per «aammdd_hhmm_pla_implementacio_»: un «pla_» o un «planificacio_» no compten)`);
  }

  if (typeof contingut === 'string') errors.push(...errorsSeccioZero(contingut));

  return { valid: errors.length === 0, errors };
}

/** Una petorreta és nascuda quan la versió del disc ja porta la secció 0 completa. */
export function nascuda(arrel, rel) {
  let text;
  try { text = fs.readFileSync(path.join(arrel, rel), 'utf8'); } catch { return false; }
  return errorsSeccioZero(text).length === 0;
}

/**
 * La porta d'una escriptura a una petorreta (261002, D11). Mentre naix, les tres
 * comprovacions; ja nascuda, només la secció 0 del contingut nou.
 */
export function checkPetorreta(arrel, rel, contingut, { dia = avui() } = {}) {
  if (nascuda(arrel, rel)) {
    const errors = errorsSeccioZero(contingut);
    return { valid: errors.length === 0, errors, nascuda: true };
  }
  return { ...checkOlivera(arrel, { contingut, dia }), nascuda: false };
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

export function checkPayload(payload, arrel = ARREL) {
  if (!payload || typeof payload !== 'object' || !payload.tool_name || (!payload.tool_input && !payload.toolArgs)) return {code: 2, errors: ['Payload de hook incomplet']};
  const { dialecte, fitxer, contingut } = rutaIContingut(payload);
  if (!fitxer) {
    const reads = ['Read', 'Glob', 'Grep', 'read_file', 'view_file', 'list_dir', 'grep_search', 'search_code'];
    return reads.includes(payload.tool_name) ? {code: 0, errors: []} : {code: 2, errors: ['Hook sense destí verificable; usa hooks-local per a shell i eines no documentals']};
  }
  const rel = path.isAbsolute(fitxer) ? path.relative(arrel, fitxer) : fitxer;
  if (!esPetorreta(rel)) return { code: 0, errors: [] };
  if (typeof contingut !== 'string') return {code: 2, errors: ['Petorreta sense contingut complet verificable; usa escriptura documental explícita'], file: rel};
  const r = checkPetorreta(arrel, rel, contingut);
  return { code: r.valid ? 0 : (dialecte === 'claude' ? 2 : 1), errors: r.errors, file: rel };
}

/* ── Arxivat explícit ─────────────────────────────────────────────────────── */

const errorAmbCodi = (missatge, codi, extra = {}) => Object.assign(new Error(missatge), { codi, ...extra });

/**
 * Què mouria `--arxiva`. Sense noms: els rancis (jornades anteriors, categories
 * de torn, no declarats vius). Amb noms: exactament eixos documents, també d'avui
 * i de qualsevol categoria, sempre que siguen documents solts del primer nivell
 * amb nom taxonòmic (D1). Tots els noms es validen abans de moure res i tots els
 * errors ixen junts: un nom dolent atura el lot, però no n'amaga cap altre.
 */
export function arxivables(arrel = ARREL, { noms = [], dia = avui() } = {}) {
  if (!noms.length) return ranci(arrel, dia);
  const inv = inventari(arrel);
  const triats = [];
  const errors = [];
  for (const cru of noms) {
    const pla = String(cru).split('\\').join('/').replace(/^\.\//, '');
    const solt = pla.startsWith(`${ESCRIPTORI}/`) ? pla.slice(ESCRIPTORI.length + 1) : pla;
    if (!solt || solt.includes('/')) {
      errors.push(`--nom ${cru}: només s'arxiven per nom documents solts del primer nivell de ${ESCRIPTORI}; les subcarpetes (Safata, 01_produccio, 02_investigacio_ia) queden fora`);
      continue;
    }
    const nom = solt.endsWith('.md') ? solt : `${solt}.md`;
    const d = inv.find((x) => x.nom === nom);
    if (!d) {
      errors.push(NOM.test(nom) && fs.existsSync(path.join(arrel, ARXIU, nom))
        ? `--nom ${cru}: ja és a ${ARXIU}/ i no a la taula: el trasllat ja està fet. L'àncora és [[${CAP_A_ARXIU}/${sense(nom)}]] i, si portava rebut, falta el relleu (node tooling/wiki/document.mjs handoff --turn-id ID --file ${ESCRIPTORI}/${nom} --to ${ARXIU}/${nom})`
        : `--nom ${cru}: no és cap document solt de ${ESCRIPTORI} amb nom aammdd_hhmm_categoria_titol.md`);
      continue;
    }
    if (!triats.includes(d)) triats.push(d);
  }
  if (errors.length) {
    throw errorAmbCodi(`${errors.length === 1 ? 'Un nom no es pot arxivar' : `${errors.length} noms no es poden arxivar`}; no s'ha mogut res:\n${errors.map((e) => `  - ${e}`).join('\n')}`, 2, { errors });
  }
  return triats;
}

/** Línies (numerades des d'1) d'un fitxer de text que esmenten un nom. */
function liniesQueCiten(fitxer, nom) {
  let text;
  try { text = fs.readFileSync(fitxer, 'utf8'); } catch { return []; }
  return text.split('\n').flatMap((l, i) => (l.includes(nom) ? [i + 1] : []));
}

const TEXTUALS = /\.(?:md|txt|mjs|js|cjs|json|sh|ya?ml|html|csv)$/i;
const MAX_REFERENCIES = 20;
/** Fitxers de text d'un directori, recursiu, que esmenten un nom. Camins relatius a l'arrel. */
function fitxersQueCiten(arrel, dir, nom) {
  const out = [];
  (function recorre(rel) {
    let entrades;
    try { entrades = fs.readdirSync(path.join(arrel, rel), { withFileTypes: true }); } catch { return; }
    for (const e of entrades.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) {
      if (out.length >= MAX_REFERENCIES || e.name.startsWith('.') || e.name === 'node_modules') continue;
      const r = `${rel}/${e.name}`;
      if (e.isDirectory()) { recorre(r); continue; }
      if (!e.isFile() || !TEXTUALS.test(e.name)) continue;
      try {
        if (fs.statSync(path.join(arrel, r)).size > 2 * 1024 * 1024) continue;
        if (fs.readFileSync(path.join(arrel, r), 'utf8').includes(nom)) out.push(r);
      } catch { /* un fitxer il·legible no cita res */ }
    }
  })(dir);
  return out;
}

/**
 * Qui cita encara un document (261002): l'Acte Reflex Pre-Arxivament fet mecànic.
 * Torns (rebuts i pla), línies d'ESTAT, fitxers dels laboratoris i documents de
 * la taula. Només llig.
 */
export function referencies(arrel, d) {
  const nom = sense(d.nom);
  let torns;
  try {
    torns = turnsCiting(arrel, d.rel).map((c) => (c.illegible ? { id: c.id, illegible: c.illegible }
      : { id: c.id, actor: c.actor, estat: c.state, viu: c.live, rebuts: c.receipts.length, pla: c.plan }));
  } catch (e) { torns = [{ id: '(torns)', illegible: e.message }]; }
  return {
    torns,
    estat: liniesQueCiten(path.join(arrel, ESTAT), nom).map((n) => `${ESTAT}:${n}`),
    laboratoris: fitxersQueCiten(arrel, LABORATORIS, nom),
    documents: inventari(arrel).filter((x) => x.nom !== d.nom && liniesQueCiten(path.join(arrel, x.rel), nom).length).map((x) => x.nom),
  };
}

/** Capçalera i nivell d'una línia de Markdown, o null. */
const capcalera = (linia) => {
  const h = /^ {0,3}(#{1,6})[ \t]+(.+?)[ \t]*$/.exec(linia);
  return h ? { nivell: h[1].length, text: h[2] } : null;
};

/**
 * Reapunta cap a l'arxiu cada àncora plana dels documents moguts, en qualsevol
 * posició de la línia (prosa, taules, llistes de qualsevol marca). L'àlies, el
 * fragment i la resta de la línia es conserven, i les àncores d'altres documents
 * no es toquen mai (D4). Dins de «## Vincles» (que només admet notes del corpus,
 * F9 de tractor-frontmatter) i d'«Activitat en curs» (que només llista vius)
 * l'àncora moguda se n'ix, amb l'espai que la precedix, i la línia només se'n va
 * si no li queda cap altra àncora. Si un document mogut es queda sense cap àncora
 * a l'índex, s'afig davall de «## Arxivat amb la Porta Olivera»: el torn que el
 * cita el troba allí (D7). Torna si l'índex ha canviat.
 */
function reapunta(arrel, noms) {
  const indexPath = path.join(arrel, INDEX);
  if (!noms.size || !fs.existsSync(indexPath)) return false;
  const abans = fs.readFileSync(indexPath, 'utf8');
  let seccio = null;
  let nivellActivitat = 0;
  const ancorats = new Set();
  const linies = [];
  for (const linia of abans.split('\n')) {
    const h = capcalera(linia);
    if (h) {
      if (seccio === 'activitat' && h.nivell <= nivellActivitat) seccio = null;
      if (seccio === 'vincles' && h.nivell <= 2) seccio = null;
      if (h.nivell === 2 && h.text === 'Vincles') seccio = 'vincles';
      else if (h.nivell >= 2 && h.nivell <= 3 && ACTIVITAT.test(h.text)) { seccio = 'activitat'; nivellActivitat = h.nivell; }
    }
    const treu = seccio !== null;
    let toca = false;
    // L'àlies pot portar la barra escapada d'una taula (`\|`, OLIV-R7): es conserva tal qual.
    const nova = linia.replace(/([ \t]?)\[\[([^\]|]+?)((?:\\?\|[^\]]*)?)\]\]/g, (tot, espai, desti, alies) => {
      const nom = ancoraPlana(desti);
      if (!nom) {
        // Una àncora que ja apunta a l'arxiu també ancora el document mogut.
        const cami = desti.split('#')[0].trim().replace(/\.md$/i, '');
        const arxivat = cami.startsWith(`${CAP_A_ARXIU}/`) ? cami.slice(CAP_A_ARXIU.length + 1) : null;
        if (arxivat && noms.has(arxivat) && !treu) ancorats.add(arxivat);
        return tot;
      }
      if (!noms.has(nom)) return tot;
      toca = true;
      if (treu) return '';
      ancorats.add(nom);
      return `${espai}[[${CAP_A_ARXIU}/${desti.trim()}${alies}]]`;
    });
    if (!(treu && toca && !nova.includes('[['))) linies.push(nova);
  }
  const falten = [...noms].filter((n) => !ancorats.has(n)).sort();
  if (falten.length) {
    const entrades = falten.map((n) => `- [[${CAP_A_ARXIU}/${n}]]`);
    const inici = linies.findIndex((l) => { const h = capcalera(l); return h && h.nivell === 2 && h.text === SECCIO_ARXIVATS; });
    if (inici === -1) {
      while (linies.length && linies.at(-1).trim() === '') linies.pop();
      linies.push('', `## ${SECCIO_ARXIVATS}`, '', ...entrades, '');
    } else {
      let fi = linies.findIndex((l, i) => { if (i <= inici) return false; const h = capcalera(l); return h && h.nivell <= 2; });
      if (fi === -1) fi = linies.length;
      let punt = fi;
      while (punt > inici + 1 && linies[punt - 1].trim() === '') punt -= 1;
      linies.splice(punt, 0, ...entrades);
    }
  }
  const despres = linies.join('\n');
  if (despres === abans) return false;
  fs.writeFileSync(indexPath, despres, 'utf8');
  return true;
}

/**
 * Trasllat a l'arxiu, relleu i àncores en un sol acte. Amb `sec` només respon
 * què faria i qui cita cada document: cap fitxer mogut, cap torn ni índex tocat.
 * Errors amb `codi`: 1 col·lisió, 2 la resta; un lot trencat a mitges porta
 * `moguts` (els ja traslladats, amb relleu fet i àncora reapuntada). Sense
 * Escriptori o sense índex a l'arrel jutjada no hi ha «res a arxivar», sinó cap
 * comprovació feta: codi 2, també amb `sec` (OLIV-R5, com l'informe).
 */
export function arxiva(arrel = ARREL, { noms = [], sec = false, dia = avui() } = {}) {
  const falten = absencies(arrel);
  if (falten.length) {
    throw errorAmbCodi(`Escriptori absent a ${arrel}: falta ${falten.join(' i ')}. No s'ha comprovat ni mogut res. Corregix SDP_ARREL o executa la porta des d'un clon complet del repositori.`, 2);
  }
  const bruts = arxivables(arrel, { noms, dia });
  if (!bruts.length) return { moguts: [], index: false, sec, candidats: noms.length ? [] : candidatsDeHui(arrel, dia).map((d) => d.nom) };
  const desti = path.join(arrel, ARXIU);
  const colisions = bruts.filter((d) => fs.existsSync(path.join(desti, d.nom)));

  if (sec) {
    const moguts = bruts.map((d) => ({
      ...d,
      nota: colisions.includes(d) ? 'simulació: ja existix a l’arxiu; no es mouria (col·lisió)' : 'simulació: es mouria',
      referencies: referencies(arrel, d),
    }));
    return { moguts, index: false, sec };
  }

  if (colisions.length) {
    throw errorAmbCodi(`Col·lisió amb l'arxiu: ${colisions.map((d) => `${ARXIU}/${d.nom}`).join(', ')} ja existix. No s'ha mogut res i no se sobreescriu mai. Compara les dues versions i decidix amb el Mestre: si són el mateix document, el de la taula és una còpia que no s'esborra sense preguntar (AGENTS §5); si no, reanomena el de la taula amb una hora nova i torna a arxivar.`, 1, { colisions: colisions.map((d) => d.nom) });
  }

  // Cap trasllat si el relleu ja se sap impossible: un registre de torn que cita el document i no es pot llegir.
  const illegibles = bruts.flatMap((d) => turnsCiting(arrel, d.rel).filter((c) => c.illegible).map((c) => `${d.nom}: ${c.id} (${c.illegible})`));
  if (illegibles.length) {
    throw errorAmbCodi(`Registres de torn il·legibles (${illegibles.join(', ')}): el relleu no es pot fer i no s'ha mogut res. Fusible (AGENTS §10): avisa el Mestre.`, 2);
  }

  fs.mkdirSync(desti, { recursive: true });
  const moguts = [];
  let fallada = null;
  for (const d of bruts) {
    const origen = path.join(arrel, d.rel);
    const final = path.join(desti, d.nom);
    try {
      const hash = hashFile(origen);
      fs.renameSync(origen, final);
      let relleu;
      try { relleu = relocateDocument(arrel, d.rel, `${ARXIU}/${d.nom}`, { hash }); }
      catch (e) {
        // El relleu ha fallat i cap torn ha canviat: el document torna a la taula.
        let tornada = '';
        try { fs.renameSync(final, origen); }
        catch (e2) { tornada = `; a més, ${d.nom} NO ha pogut tornar a la taula (${e2.message}): és a ${ARXIU}/ sense relleu, avisa el Mestre`; }
        throw errorAmbCodi(`Relleu de ${d.nom} fallit (${e.message}): el document torna a la taula i cap torn s'ha modificat${tornada}.`, 2, { cause: e });
      }
      moguts.push({ ...d, nota: 'mogut', relleu });
    } catch (e) {
      fallada = e;
      break;
    }
  }

  // Siga com siga el final del lot, el que ja és a l'arxiu no pot deixar àncores fantasma.
  let index = false;
  try {
    index = reapunta(arrel, new Set(moguts.map((m) => sense(m.nom))));
  } catch (e) {
    // Una doble fallada no n'amaga cap: la del lot mana i porta la de l'índex.
    const avis = `l'índex no s'ha pogut reapuntar (${e.message}): les àncores dels moguts queden fantasma fins que es corregixen a ${INDEX}`;
    if (fallada) fallada.message = `${fallada.message}; a més, ${avis}`;
    else fallada = errorAmbCodi(`Documents moguts, però ${avis}`, 2, { cause: e });
  }
  if (fallada) {
    // El cridador diu què s'ha mogut abans de propagar l'error.
    fallada.moguts = moguts;
    fallada.codi ??= 2;
    throw fallada;
  }
  return { moguts, index, sec };
}

/* ── CLI ──────────────────────────────────────────────────────────────────── */

const US = 'Ús: porta-olivera.mjs [--informe] | --hook | --arxiva [--nom FITXER.md]... [--sec]';

/** Banderes de la línia d'ordres. Una bandera desconeguda no es llig com a informe: falla. */
function opcions(argv) {
  const o = { informe: false, hook: false, arxiva: false, sec: false, noms: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--informe') o.informe = true;
    else if (a === '--hook') o.hook = true;
    else if (a === '--arxiva') o.arxiva = true;
    else if (a === '--sec') o.sec = true;
    else if (a === '--nom' || a.startsWith('--nom=')) {
      const valor = a === '--nom' ? argv[++i] : a.slice('--nom='.length);
      if (!valor || valor.startsWith('--')) throw new Error(`--nom necessita el nom d'un document. ${US}`);
      o.noms.push(valor);
    } else throw new Error(`Argument desconegut: ${a}. ${US}`);
  }
  if ([o.informe, o.hook, o.arxiva].filter(Boolean).length > 1) throw new Error(`Tria un sol mode. ${US}`);
  if ((o.noms.length || o.sec) && !o.arxiva) throw new Error(`--nom i --sec només valen amb --arxiva. ${US}`);
  return o;
}

function informe(arrel, dia = avui()) {
  const falten = absencies(arrel);
  if (falten.length) {
    console.log(`[Porta Olivera] ❌ Escriptori absent a ${arrel}: falta ${falten.join(' i ')}. No s'ha comprovat res.`);
    return 1;
  }
  const docs = inventari(arrel);
  const presents = new Set(docs.map((d) => sense(d.nom)));
  const viu = [...vius(arrel)].filter((n) => presents.has(n)).sort();
  const bruts = ranci(arrel, dia);
  const bustia = safata(arrel);
  const fora = forasters(arrel);
  const anc = ancoratge(arrel);
  const pla = plaDeHui(arrel, dia);
  const taula = checkTaula(arrel, { dia });
  console.log(`[Porta Olivera] Escriptori: ${docs.length} documents solts.`);
  console.log(`   Arrel jutjada: ${arrel}`);
  console.log(viu.length
    ? `🌿 Declarats vius a «## Activitat en curs» (es conserven): ${viu.join(', ')}`
    : '🌿 Cap document de la taula declarat viu a «## Activitat en curs».');
  if (bruts.length) {
    console.log(`❌ ${bruts.length} de jornades anteriors sense declarar vius (han d'anar a ${ARXIU}/ amb --arxiva):`);
    for (const d of bruts) console.log(`   · ${d.nom}`);
  } else console.log('✅ Cap document consumit de jornades anteriors.');
  console.log(bustia.elements.length ? `❌ Safata d'entrada amb ${bustia.elements.length} element(s): ${bustia.elements.join(', ')}` : "✅ Safata d'entrada buida.");
  if (fora.length) console.log(`❌ Noms fora de taxonomia: ${fora.join(', ')}`);
  if (anc.senseAncora.length) console.log(`❌ Sense àncora a l'índex: ${anc.senseAncora.join(', ')} (vius: «- [[NOM]]» a «## Activitat en curs»; consumits: --arxiva --nom NOM.md)`);
  if (anc.fantasma.length) {
    console.log(`❌ Àncores a documents absents (fan caure la porta): ${anc.fantasma.join(', ')}`);
    for (const n of anc.fantasma) console.log(`   · ${remeiFantasma(arrel, n)}`);
  }
  for (const a of taula.avisos) console.log(`⚠️ ${a}`);
  console.log(pla.length
    ? `ℹ️ Pla d'Implementació de hui: ${pla.map((d) => d.nom).join(', ')}`
    : "ℹ️ Cap Pla d'Implementació de hui: el demana l'escriptura d'una petorreta, no l'Escriptori net.");
  return taula.valid ? 0 : 1;
}

/** Una línia per document: on va, què ha passat i amb quin relleu. */
function liniaDeDocument(m) {
  const parts = [`   · ${m.nom} → ${ARXIU}/ (${m.nota})`];
  if (m.relleu) {
    const fets = m.relleu.relleuats.map((r) => `${r.id} (${[r.receipts ? `${r.receipts} rebut${r.receipts > 1 ? 's' : ''}` : null, r.plan ? `pla${r.planModificat ? ' ja modificat abans: cal tornar-lo a vincular' : ''}` : null].filter(Boolean).join(', ')})`);
    const historics = m.relleu.historics.map((h) => `${h.id} (${h.state}${h.state !== 'closed' ? ', caducat' : ''})`);
    parts.push(fets.length ? `       relleu fet: ${fets.join('; ')}` : '       relleu: cap torn viu el cita');
    if (historics.length) parts.push(`       història que no es reescriu: ${historics.join('; ')}`);
  }
  if (m.referencies) {
    const r = m.referencies;
    const torns = r.torns.map((c) => (c.illegible ? `${c.id} (il·legible: ${c.illegible})` : `${c.id} (${c.viu ? 'viu' : c.estat}${c.rebuts ? `, ${c.rebuts} rebut${c.rebuts > 1 ? 's' : ''}` : ''}${c.pla ? ', pla' : ''})`));
    parts.push(`       torns: ${torns.length ? torns.join('; ') : 'cap'}`);
    parts.push(`       ESTAT: ${r.estat.length ? r.estat.join(', ') : 'cap'}`);
    parts.push(`       laboratoris: ${r.laboratoris.length ? r.laboratoris.join(', ') : 'cap'}`);
    parts.push(`       taula: ${r.documents.length ? r.documents.join(', ') : 'cap'}`);
  }
  return parts.join('\n');
}

function main(argv = process.argv.slice(2)) {
  const o = opcions(argv);
  const arrel = ARREL;
  if (!arrel) {
    try { arrelSegura(); } catch (e) { console.error(typeof e.informe === 'function' ? e.informe() : e.message); }
    console.error('[Porta Olivera] Sense arrel: ni SDP_ARREL ni el marcador .agents/AGENTS.md des d’este mòdul. No s’ha comprovat res.');
    process.exitCode = 2;
    return;
  }

  if (o.arxiva) {
    const r = arxiva(arrel, { noms: o.noms, sec: o.sec });
    if (o.sec) console.log('[Porta Olivera] Simulació (--sec): no es mou cap fitxer ni es toca cap torn ni l’índex.');
    if (!r.moguts.length) {
      console.log('[Porta Olivera] Res a arxivar.');
      if (!o.noms.length) {
        console.log("   L'arxivat sense noms només mou documents de torn de jornades anteriors. Per a un d'avui ja consumit: node tooling/gates/porta-olivera.mjs --arxiva --sec --nom NOM.md, i després el mateix sense --sec.");
        if (r.candidats?.length) console.log(`   Documents de torn d'avui sense declarar vius: ${r.candidats.join(', ')}`);
      }
    }
    for (const m of r.moguts) console.log(liniaDeDocument(m));
    if (r.index) console.log(`   · ${INDEX} actualitzat.`);
    if (o.sec && r.moguts.length) console.log('   Acte Reflex Pre-Arxivament: si algú dels de dalt encara necessita el document, no l’arxives.');
    process.exitCode = 0;
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
if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  try { main(); } catch (e) {
    // Un lot trencat a mitges diu què ja és a l'arxiu (amb relleu i àncora) abans de l'error.
    for (const m of e.moguts ?? []) console.error(liniaDeDocument(m));
    console.error(e.message);
    process.exitCode = e.codi ?? 2;
  }
}
