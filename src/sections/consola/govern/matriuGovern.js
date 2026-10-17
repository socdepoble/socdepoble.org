/**
 * matriuGovern.js — la Matriu de Conformitat de Requeriments (MCR) per al
 * Govern del Mestre (/consola/govern/*), pura: sense React, sense disc i
 * sense xarxa.
 *
 * Pla 261016_1530, Onada 0.5 (Mandat Suprem), mòdul 1: «Taula visual que
 * mostra la Matriu de Conformitat (MCR) en temps real: què està [FET I
 * SEGELLAT], què està [PARCIAL] i què està [PENDENT DE SEGÜENT TANDA].»
 * Relleu de Codex (pla 261016_1639, fila I09): «estat desconegut obsolet
 * sense transformar-lo en verd».
 *
 * L'esquema és el que ja escriu Codex (mcr.json de l'auditoria 261016_1632),
 * sense inventar-ne cap altre: { at, baseline_head, scope, statuses,
 * requirements: [{ id, source, requirement, status, evidence, owner,
 * priority, acceptance }] }. Les claus de la matriu es conserven tal qual
 * (`brut`) perquè l'empremta de cada fila la puga recalcular qualsevol agent.
 *
 * Dues lleis:
 *  · Un estat que no és del vocabulari no es pot dir bo: la fila és
 *    «obsoleta» i mai es pinta de verd.
 *  · Una matriu caducada (sense data, de fa més d'un dia, amb una data que
 *    encara no ha arribat, o feta sobre un codi que ja no és el d'ara) també:
 *    totes les seues files són obsoletes.
 *    El que la matriu deia es conserva (`estat`) i es diu; el que es pinta és
 *    `estatVist`.
 */
import { plural } from '../concordanca.js';
import { toDeColor } from '../semafor.js';

/** Els estats que la Consola pinta, en l'ordre de les taules i dels filtres. */
export const ESTATS_VISTOS = Object.freeze(['fet', 'parcial', 'pendent', 'obsolet']);

/** El vocabulari literal del pla (261016_1530, Onada 0.5, mòdul 1), i el d'una fila obsoleta. */
export const ETIQUETA_ESTAT = Object.freeze({
  fet: '[FET I SEGELLAT]',
  parcial: '[PARCIAL]',
  pendent: '[PENDENT DE SEGÜENT TANDA]',
  obsolet: 'Obsolet'
});

/* El color de cada estat amb el semàfor de la Consola (semafor.js): el que
   està fet, verd; el que va a mitges o espera la tanda següent, taronja (no
   ha fallat del tot: el roig és per al que falla del tot); el que no es pot
   creure, taronja com DESCONEGUT. Cap estat de la matriu és roig. */
const COLOR_ESTAT = Object.freeze({ fet: 'verd', parcial: 'taronja', pendent: 'taronja', obsolet: 'taronja' });

/** El to d'Insignia d'un estat vist; un estat que no és ací, el d'obsolet (mai verd). */
export const toDeLEstat = (estat) => toDeColor(COLOR_ESTAT[estat] ?? COLOR_ESTAT.obsolet);

/* Els valors de `status` que s'entenen, ja nets (sense claudàtors, en
   majúscules i amb un sol espai): els de mcr.json («[FET I SEGELLAT]»,
   «[PARCIAL]», «[NO FET / PENDENT]»), els de la taula dels auditors del
   pla (:104, «[NO FET / BLOC PENDENT]») i els del mòdul 1 (:118).
   Revisió adversarial del carril F1 (problema 11) · «[FET]» de la taula dels
   auditors no és cap segell: pintar-lo «[FET I SEGELLAT]» i en verd hi
   afegiria un «SEGELLAT» que la font no diu. Ja no s'entén com a fet: cau a
   desconegut (Obsolet, taronja) amb el seu text literal al costat. Derogat:
   «[FET]» → fet. Només és verd el que la matriu diu segellat. */
const DE_STATUS = new Map([
  ['FET I SEGELLAT', 'fet'],
  ['PARCIAL', 'parcial'],
  ['NO FET / PENDENT', 'pendent'],
  ['NO FET / BLOC PENDENT', 'pendent'],
  ['PENDENT DE SEGÜENT TANDA', 'pendent'],
  ['PENDENT', 'pendent'],
  ['NO FET', 'pendent']
]);

const netDeStatus = (status) => String(status).normalize('NFC').toLocaleUpperCase('ca')
  .replace(/[[\]]/g, '').replace(/\s*\/\s*/g, ' / ').replace(/\s+/g, ' ').trim();

/** L'estat d'un `status` de la matriu: 'fet', 'parcial' o 'pendent'; null si no s'entén. */
export function estatDeStatus(status) {
  if (typeof status !== 'string' || !status.trim()) return null;
  return DE_STATUS.get(netDeStatus(status)) ?? null;
}

/** Una matriu té més d'un dia: ja no diu com està la faena hui. */
export const LLINDAR_MATRIU_HORES = 24;
const HORA_MS = 60 * 60 * 1000;
/**
 * El marge del rellotge: una matriu amb una data de més d'açò en el futur
 * (rellotge desajustat o data mal escrita) no caducaria mai per data, i és
 * obsoleta. Cinc minuts cobrixen un desajust normal entre màquines.
 */
export const MARGE_FUTUR_MINUTS = 5;
const MINUT_MS = 60 * 1000;

/** Els camps de cada fila de la matriu, en l'ordre de Codex: els de l'empremta. */
export const CAMPS_FILA = Object.freeze(['id', 'source', 'requirement', 'status', 'evidence', 'owner', 'priority', 'acceptance']);

const text = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);
/**
 * L'instant (ms) d'una data ISO, o null. Codex escriu microsegons
 * («15:02:56.740108+00:00»): si el navegador no els accepta, es lligen els
 * mil·lisegons i prou (Baseline 2022: Safari 16 inclòs).
 */
export function instantISO(iso) {
  if (typeof iso !== 'string' || !iso.trim()) return null;
  let t = Date.parse(iso);
  if (!Number.isFinite(t)) t = Date.parse(iso.replace(/(\.\d{3})\d+/, '$1'));
  return Number.isFinite(t) ? t : null;
}
const instant = instantISO;
const PATRO_COMMIT = /^[0-9a-f]{7,40}$/i;
const commit = (v) => (typeof v === 'string' && PATRO_COMMIT.test(v.trim()) ? v.trim().toLowerCase() : null);

/** Dos commits són el mateix si un és el prefix de l'altre (un sha curt i un de sencer). */
export function mateixCommit(a, b) {
  const x = commit(a);
  const y = commit(b);
  return Boolean(x && y) && (x.startsWith(y) || y.startsWith(x));
}

/**
 * Un text de la matriu en paraules planes: els enllaços Markdown es queden
 * amb el seu text (les rutes absolutes amb el directori personal no
 * s'ensenyen: fila F02), sense accents greus ni negretes, i qualsevol
 * directori personal que quede diu «~». Null si no hi ha text.
 */
export function textPla(valor) {
  const t = text(valor);
  if (t === null) return null;
  return t
    .replace(/\[([^\]]*)\]\(<[^>]*>\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)\s]*\)/g, '$1')
    .replace(/\*\*|`/g, '')
    .replace(/\/(?:Users|home)\/[^/\s]+\//g, '~/')
    .replace(/\s+/g, ' ')
    .trim() || null;
}

const errorMatriu = (motiu) => new Error(`Este fitxer no és una matriu de requeriments: ${motiu}.`);

/** El prefix de la identitat d'una matriu que no diu de quin pla és: «mcr@» i la seua data, en UTC. */
export const PREFIX_IDENTITAT_DATA = 'mcr@';

/**
 * La matriu tal com arriba (mcr.json), normalitzada. Llança si no és una
 * matriu: un objecte amb la llista `requirements`. Cada fila sense `id`
 * es descarta i es compta; un `id` repetit es queda amb la primera fila i
 * es diu. Cap camp s'inventa: el que falta és null.
 *
 * `pla` és la identitat de la matriu, la que porta cada decisió del Mestre
 * (certificacions.js aparella per pla i id). Revisió adversarial del carril
 * F1 (correcció del camp «pla») · Si la matriu diu de quin pla és (`pla` o
 * `plan`), eixe; si no ho diu (el mcr.json de Codex d'ara: at, baseline_head,
 * scope, statuses i requirements), «mcr@» i la seua data normalitzada: una
 * matriu nova, d'una altra data, no hereta les decisions d'una altra que
 * reutilitze els mateixos identificadors per a una altra tasca. La identitat
 * ix només de la matriu: és la mateixa oberta d'un fitxer o servida pel
 * servidor de desenvolupament, i cap decisió apuntada en una via deixa de
 * casar en l'altra. `plaDeclarat` diu si la va donar la matriu. Sense pla ni
 * data, null. Derogat: `pla` null quan la matriu no el declara.
 */
export function normalitzaMcr(brut) {
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) throw errorMatriu('no és un objecte JSON');
  if (!Array.isArray(brut.requirements)) throw errorMatriu('li falta la llista «requirements»');
  const vistos = new Set();
  const duplicats = [];
  let descartades = 0;
  const files = [];
  for (const r of brut.requirements) {
    const id = r && typeof r === 'object' && !Array.isArray(r) ? text(r.id) : null;
    if (id === null) { descartades += 1; continue; }
    if (vistos.has(id)) { duplicats.push(id); continue; }
    vistos.add(id);
    const estat = estatDeStatus(r.status);
    files.push({
      id,
      font: text(r.source),
      requeriment: textPla(r.requirement),
      status: text(r.status),
      estat: estat ?? 'obsolet',
      desconegut: estat === null,
      evidencia: textPla(r.evidence),
      responsable: text(r.owner),
      prioritat: text(r.priority),
      acceptacio: textPla(r.acceptance),
      // Els camps de Codex, tal qual (null si falten): la base de l'empremta.
      brut: Object.fromEntries(CAMPS_FILA.map((c) => [c, typeof r[c] === 'string' ? r[c] : null]))
    });
  }
  const declarats = brut.statuses && typeof brut.statuses === 'object' && !Array.isArray(brut.statuses)
    ? Object.fromEntries(Object.entries(brut.statuses).filter(([, n]) => Number.isSafeInteger(n) && n >= 0))
    : null;
  const t = instant(brut.at);
  // En UTC i amb mil·lisegons: la mateixa data es llig igual a tots els navegadors.
  const at = t === null ? null : new Date(t).toISOString();
  const declarat = text(brut.pla) ?? text(brut.plan);
  return {
    at,
    baselineHead: commit(brut.baseline_head),
    scope: text(brut.scope),
    pla: declarat ?? (at === null ? null : `${PREFIX_IDENTITAT_DATA}${at}`),
    plaDeclarat: declarat !== null,
    declarats,
    files,
    descartades,
    duplicats
  };
}

/**
 * Si els recomptes que la matriu declara (`statuses`) quadren amb les seues
 * files: true, false, o null si no en declara cap.
 */
export function quadrenElsRecomptes(matriu) {
  if (!matriu?.declarats) return null;
  const reals = new Map();
  for (const f of matriu.files) if (f.status) reals.set(f.status, (reals.get(f.status) ?? 0) + 1);
  const claus = new Set([...Object.keys(matriu.declarats), ...reals.keys()]);
  return [...claus].every((k) => (matriu.declarats[k] ?? 0) === (reals.get(k) ?? 0));
}

/**
 * La caducitat d'una matriu: { obsoleta, motius: [{ clau, text }],
 * commitComprovat, hores }. `head` és el commit d'ara, si la font el sap
 * (govern.json); una matriu oberta d'un fitxer sense servidor no el sap, i
 * aleshores el commit no es comprova (commitComprovat: false), però la data sí.
 */
export function caducitatDe(matriu, { head = null, ara = Date.now() } = {}) {
  const motius = [];
  const t = instant(matriu?.at);
  const hores = t === null ? null : Math.max(0, Math.floor((ara - t) / HORA_MS));
  if (t === null) motius.push({ clau: 'sense-data', text: 'La matriu no diu quan es va fer.' });
  else if (t - ara > MARGE_FUTUR_MINUTS * MINUT_MS) {
    // Revisió adversarial del carril F1 (problema 6) · Una data futura no caduca mai: la matriu és obsoleta.
    motius.push({ clau: 'data-futura', text: 'La matriu diu una data que encara no ha arribat.' });
  } else if (ara - t > LLINDAR_MATRIU_HORES * HORA_MS) {
    motius.push({ clau: 'vella', text: `La matriu es va fer fa ${plural(hores, 'hora', 'hores')}: passa del dia de marge.` });
  }
  const actual = commit(head);
  const base = matriu?.baselineHead ?? null;
  if (actual && !base) {
    motius.push({ clau: 'sense-commit', text: 'La matriu no diu sobre quin codi es va fer.' });
  } else if (actual && !mateixCommit(actual, base)) {
    motius.push({ clau: 'commit-divergent', text: 'El codi ha canviat des que es va fer la matriu.' });
  }
  return { obsoleta: motius.length > 0, motius, commitComprovat: Boolean(actual && base), hores };
}

/**
 * La matriu com es pinta: la caducitat i, per a cada fila, `obsolet` i
 * `estatVist` (el seu estat, o 'obsolet' si la matriu és caducada o l'estat
 * no s'entén). Null sense matriu.
 */
export function vistaMatriu(matriu, opcions = {}) {
  if (!matriu) return null;
  const caducitat = caducitatDe(matriu, opcions);
  const files = matriu.files.map((f) => {
    const obsolet = caducitat.obsoleta || f.desconegut;
    return { ...f, obsolet, estatVist: obsolet ? 'obsolet' : f.estat };
  });
  return { ...matriu, caducitat, files, quadren: quadrenElsRecomptes(matriu) };
}

/** Quantes files hi ha de cada estat vist: { fet, parcial, pendent, obsolet }. */
export function recompteVist(files) {
  const r = Object.fromEntries(ESTATS_VISTOS.map((e) => [e, 0]));
  for (const f of files ?? []) r[f.estatVist] = (r[f.estatVist] ?? 0) + 1;
  return r;
}

/** Les files d'un filtre ('tots' o un estat vist). */
export function filtraFiles(files, filtre) {
  return filtre === 'tots' || !ESTATS_VISTOS.includes(filtre) ? files : files.filter((f) => f.estatVist === filtre);
}
