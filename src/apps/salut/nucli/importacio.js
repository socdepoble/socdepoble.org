/**
 * importacio.js — importar un diari fet en un full de càlcul (nucli pur).
 *
 * Dos formes conegudes (detectaFormat):
 *   graella-horaria  la plantilla de diari miccional d'un dia (Numbers, Excel,
 *                    LibreOffice, o el CSV d'una taula): una fila per franja
 *                    horària (la columna HORA) i grups de columnes (LÍQUID
 *                    INGERIT, MICCIÓ, PÈRDUA, URGÈNCIA…), amb un full resum al
 *                    costat (Data, Alçar-se del llit, Anar a dormir)
 *   diari-salut      la fulla «Diari» que exporta la mateixa Salut (full.js)
 * La plantilla es reconeix per les ETIQUETES (PERFIL_GRAELLA_HORARIA), mai per
 * les coordenades: si s'hi afig una fila o es mou un grup, es llig igual.
 *
 * proposaApunts no escriu res: torna una proposta perquè la persona la mire i
 * la confirme (vistes/ImportarFull.jsx), que només es desa amb
 * salut.importa(…, 'afegir').
 *   · Un apunt per cel·la plena. El moment és la data triada i l'hora de la
 *     franja (mai la data que Numbers posa a les claus de la plantilla), amb la
 *     nota «Hora aproximada (franja)». La franja on cau l'hora d'alçar-se (les
 *     07:30, a la de les 07) es posa a l'hora d'alçar-se: el que s'hi apunta és
 *     el primer del dia, no la nit d'abans (avís franja-alcar).
 *   · Cada apunt passa per validaApunt: el que no és vàlid es descarta i es
 *     diu on és i per què (mai el valor).
 *   · L'id és determinista (fitxer, fulla, cel·la, moment i tipus): tornar a
 *     importar el mateix full no duplica res. Amb `existents`, tampoc entra un
 *     apunt igual a un que ja hi és (el mateix tipus, moment i contingut).
 *   · El pacient no es llig mai. Les fórmules i la fila TOTALS no s'importen
 *     (una fórmula escrita en una franja es descarta i es diu on és): els
 *     totals només es contrasten amb les franges (`contrast`), amb els
 *     nombres de les franges que s'han llegit, com fa SUM.
 *   · Els grups que l'app no sap llegir (MUDA, QUÈ FEIA?) no s'importen.
 * Els camps que el full no porta prenen el valor per defecte del diccionari,
 * com al formulari: una micció, al vàter; un escapament, «No se sap» quan.
 * L'exportació pròpia tampoc no porta on ha orinat, l'ajuda, les molèsties ni
 * com era l'orina, quan ha passat un escapament ni per què s'ha despertat: la
 * proposta ho diu (avís camps-per-defecte) i la còpia (.json) ho porta tot.
 */
import { llegixCsv, llegixLlibre } from '../../../utils/fulls/index.js';
import { campDe, opcionsDe, tipusDe, validaApunt, valorsPerDefecte } from './diccionari.js';
import { COLUMNES_DIARI } from './full.js';
import { assignaJornades, dataCurta, dataDe, esData, esHora, momentDe, ofsetLocal, sumaDies } from './hores.js';

export const FORMATS_FULL = Object.freeze(['graella-horaria', 'diari-salut', 'desconegut']);
export const NOTA_FRANJA = 'Hora aproximada (franja)';
/* Un diari de molts dies cap de sobra; més és un fitxer equivocat (el mateix límit que lector.js). */
const MAX_BYTES = 20 * 1024 * 1024;
const MAX_CELLES = 200000;
/* Una graella té almenys unes quantes franges; menys és una taula qualsevol amb «Hora». */
const MIN_FRANGES = 4;
const UNITATS = /^(?:ml|cc|l)$/;

/** Una etiqueta per a comparar: sense accents ni majúscules, espais simples i sense «:» ni «?». */
export function normalitzaEtiqueta(text) {
  return String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[¿?:]/g, ' ').replace(/\s+/g, ' ').trim();
}

const congela = (objecte) => Object.freeze(objecte);

/**
 * La plantilla de diari miccional, per etiquetes (ja normalitzades).
 *   clau        la columna de les franges horàries
 *   totals      la fila que tanca la graella
 *   grups       els grups que s'importen: begudes (una columna per beguda,
 *               per la sub-capçalera), volum (ml d'una micció) i escala (una
 *               columna per nivell, amb una marca)
 *   noImportats els grups coneguts que no s'importen, i per què
 *   resum       les etiquetes del full resum que es lligen (el pacient, mai)
 * L'etiqueta E2 de la plantilla real és «Menjar», dins de LÍQUID INGERIT: el
 * líquid del menjar compta al BEGUT del full i a la beguda de Salut, com a
 * «Una altra», amb una nota. MUDA (0–3) i QUÈ FEIA? (0–4) no diuen què vol dir
 * cada nivell: no s'importen fins que el Mestre ho diga.
 */
export const PERFIL_GRAELLA_HORARIA = congela({
  id: 'graella-horaria',
  clau: /^hora$/,
  totals: /^totals?$/,
  grups: congela([
    congela({
      id: 'ingesta', etiqueta: /^liquids? ingerits?$/, tipus: 'begudes',
      columnes: congela([
        congela({ etiqueta: /^aigua$/, beguda: 'aigua' }),
        congela({ etiqueta: /^cafe$/, beguda: 'cafe' }),
        congela({ etiqueta: /^alcohol$/, beguda: 'alcohol' }),
        congela({ etiqueta: /^menjar$/, beguda: 'altra', nota: 'Líquid del menjar' })
      ])
    }),
    congela({ id: 'miccio', etiqueta: /^miccio$/, tipus: 'volum' }),
    congela({ id: 'perdua', etiqueta: /^perdua$/, tipus: 'escala', nivells: congela({ 1: 'gotes', 2: 'humit', 3: 'xopat' }) }),
    congela({ id: 'urgencia', etiqueta: /^urgencia$/, tipus: 'escala', nivells: congela({ 0: 0, 1: 1, 2: 2, 3: 3, 4: 4 }) })
  ]),
  noImportats: congela([
    congela({ etiqueta: /^muda$/, perque: 'el full no diu què vol dir cada nivell' }),
    congela({ etiqueta: /^que feia$/, perque: 'l’app no té cap camp per a dir què feia' })
  ]),
  resum: congela({ data: /^data$/, alcar: /^alcar-se( del llit)?$/, dormir: /^anar a dormir$/ })
});

/* ── Cel·les ───────────────────────────────────────────────────────────── */

const clauCella = (fila, col) => `${fila}:${col}`;
const lletra = (col) => {
  let n = col + 1;
  let text = '';
  while (n > 0) {
    const resta = (n - 1) % 26;
    text = String.fromCharCode(65 + resta) + text;
    n = (n - 1 - resta) / 26;
  }
  return text;
};

/* Una fulla amb accés per coordenades i per combinació. */
function indexa(fulla) {
  const celles = new Map();
  for (const c of fulla.celles) celles.set(clauCella(c.fila, c.col), c);
  const combinacions = new Map((fulla.combinacions || []).map((r) => [clauCella(r.fila, r.col), r]));
  return {
    nom: fulla.nom,
    celles: fulla.celles,
    files: [...new Set(fulla.celles.map((c) => c.fila))].sort((a, b) => a - b),
    cella: (fila, col) => celles.get(clauCella(fila, col)) || null,
    rang: (fila, col) => combinacions.get(clauCella(fila, col)) || { fila, col, filaFi: fila, colFi: col }
  };
}

const esBuida = (c) => !c || c.tipus === 'buit' || (c.tipus === 'text' && c.valor.trim() === '') || (c.tipus === 'boolea' && c.valor === false);
const esText = (c) => Boolean(c) && c.tipus === 'text' && c.formula === null;
const etiquetaDe = (c) => (esText(c) ? normalitzaEtiqueta(c.valor) : '');
/* Una cel·la escrita a mà (les fórmules les calcula el full: no s'importen mai). */
const esPlena = (c) => !esBuida(c) && c.formula === null;
const dosXifres = (n) => String(n).padStart(2, '0');

/* 'HH:MM' d'una cel·la d'hora, de data i hora o d'un text com «7:30», «7.30» o «7h30»; null si no n'és. */
function horaDeCella(c) {
  if (!c) return null;
  let m = null;
  if (c.tipus === 'hora') m = /^(\d{2}):(\d{2})/.exec(c.valor);
  else if (c.tipus === 'data-hora') m = /T(\d{2}):(\d{2})/.exec(c.valor);
  else if (c.tipus === 'text') m = /^\s*(\d{1,2})\s*[:.h']\s*(\d{2})\s*h?\s*$/i.exec(c.valor);
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return null;
  return `${dosXifres(Number(m[1]))}:${m[2]}`;
}

/* 'AAAA-MM-DD' d'una cel·la de data, de data i hora o d'un text DD/MM/AA(AA) o AAAA-MM-DD; null si no n'és. */
function dataDeCella(c) {
  if (!c) return null;
  if (c.tipus === 'data') return c.valor;
  if (c.tipus === 'data-hora') return c.valor.slice(0, 10);
  if (c.tipus !== 'text') return null;
  const iso = c.valor.trim();
  if (esData(iso)) return iso;
  const m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/.exec(iso);
  if (!m) return null;
  const data = `${m[3].length === 2 ? `20${m[3]}` : m[3]}-${dosXifres(Number(m[2]))}-${dosXifres(Number(m[1]))}`;
  return esData(data) ? data : null;
}

/* Un volum en ml: un enter, o un text «250» o «250 ml». null si no ho és. */
function volumDe(c) {
  if (c.tipus === 'nombre') return Number.isSafeInteger(c.valor) && c.valor >= 0 ? c.valor : null;
  if (c.tipus !== 'text') return null;
  const m = /^\s*(\d{1,5})\s*(?:ml\.?)?\s*$/i.exec(c.valor);
  return m ? Number(m[1]) : null;
}

/* Un enter d'una cel·la (un nombre o un text de xifres); undefined si no n'hi ha. */
function enterDe(c) {
  if (!c || esBuida(c)) return undefined;
  if (c.tipus === 'nombre') return c.valor;
  return c.tipus === 'text' && /^\s*-?\d+\s*$/.test(c.valor) ? Number(c.valor) : Number.NaN;
}

/* ── Llegir el fitxer ──────────────────────────────────────────────────── */

/* Una cel·la d'un CSV, tipada com les de lector.js (el CSV no porta tipus ni fórmules). */
function cellaDeText(fila, col, cru) {
  const text = cru.trim();
  const base = { fila, col, ref: `${lletra(col)}${fila}`, formula: null, format: 'General' };
  let m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(text);
  if (m && Number(m[1]) < 24 && Number(m[2]) < 60) {
    return { ...base, tipus: 'hora', valor: `${dosXifres(Number(m[1]))}:${m[2]}${m[3] ? `:${m[3]}` : ''}` };
  }
  const data = /^\d/.test(text) && /[/-]/.test(text) ? dataDeCella({ tipus: 'text', valor: text }) : null;
  if (data) return { ...base, tipus: 'data', valor: data };
  m = /^-?\d+(?:[.,]\d+)?$/.exec(text);
  if (m) return { ...base, tipus: 'nombre', valor: Number(text.replace(',', '.')) };
  return { ...base, tipus: 'text', valor: cru };
}

/**
 * Les files d'un CSV (llegixCsv) com un llibre d'una fulla, amb la forma de
 * llegixLlibre: així la graella i l'exportació pròpia es reconeixen igual.
 * @param {string[][]} files
 * @param {string} [nom] el nom de la fulla (el del fitxer)
 */
export function llibreDeCsv(files, nom = 'CSV') {
  const celles = [];
  files.forEach((fila, i) => fila.forEach((cru, col) => {
    if (String(cru).trim() === '') return;
    if (celles.length >= MAX_CELLES) throw new RangeError('El fitxer té massa cel·les per a llegir-lo ací.');
    celles.push(cellaDeText(i + 1, col, String(cru)));
  }));
  return { date1904: false, fulles: [{ nom, combinacions: [], celles }] };
}

const esCsv = (nom) => /\.(?:csv|txt)$/i.test(nom);

/**
 * Llig un fitxer triat per la persona (.xlsx o .csv), en este dispositiu. Mai llança.
 * @param {Uint8Array|ArrayBuffer} bytes
 * @param {string} nom el nom del fitxer (decidix si és un CSV)
 * @returns {{ ok: true, llibre: object } | { ok: false, error: string }}
 */
export function llegixFitxer(bytes, nom = '') {
  const mida = bytes?.byteLength ?? 0;
  if (mida === 0) return { ok: false, error: 'El fitxer és buit.' };
  if (mida > MAX_BYTES) return { ok: false, error: 'El fitxer passa de 20 MB: és massa gran per a ser un diari.' };
  try {
    if (esCsv(nom)) return { ok: true, llibre: llibreDeCsv(llegixCsv(bytes), nom.replace(/\.[^.]+$/, '')) };
    return { ok: true, llibre: llegixLlibre(bytes) };
  } catch (error) {
    return { ok: false, error: error instanceof TypeError || error instanceof RangeError ? error.message : 'No s’ha pogut llegir el fitxer.' };
  }
}

/* ── La graella horària ────────────────────────────────────────────────── */

/* La graella que comença en l'etiqueta de la clau, o null si davall no hi ha prou franges. */
function graellaDes(f, clau, perfil) {
  const filaGrups = clau.fila;
  const col = clau.col;
  const filaSub = horaDeCella(f.cella(filaGrups + 1, col)) ? null : filaGrups + 1;
  const franges = [];
  const senseHora = [];
  let filaTotals = null;
  let dia = 0;
  let anterior = null;
  for (const fila of f.files) {
    if (fila <= (filaSub ?? filaGrups)) continue;
    const c = f.cella(fila, col);
    if (perfil.totals.test(etiquetaDe(c))) {
      filaTotals = fila;
      break;
    }
    const hora = horaDeCella(c);
    if (!hora) {
      senseHora.push(fila);
      continue;
    }
    /* Una franja abans de l'anterior és de l'endemà (una plantilla que comença a les 07:00 i acaba a les 06:00). */
    if (anterior !== null && hora < anterior) dia += 1;
    franges.push({ fila, hora, dia });
    anterior = hora;
  }
  if (franges.length < MIN_FRANGES) return null;
  const ultimaFila = filaTotals ?? franges[franges.length - 1].fila;
  const deLaFila = f.celles.filter((c) => c.fila === filaGrups && c.col > col).sort((a, b) => a.col - b.col);
  /* Un grup s'acaba on acaba la seua combinació o, si no en té, abans de la cel·la següent de la fila. */
  const limits = deLaFila.filter((c) => !esBuida(c) || c.formula !== null).map((c) => c.col);
  /* Amb un bucle i no amb Math.max(...): una fulla gran passa del límit d'arguments de Safari (65.536). */
  let ultimaCol = col;
  for (const c of f.celles) if (c.fila >= filaGrups && c.fila <= ultimaFila && c.col > ultimaCol) ultimaCol = c.col;
  const grups = deLaFila.filter(esText).map((c) => {
    const rang = f.rang(filaGrups, c.col);
    const seguent = limits.find((x) => x > c.col);
    const colFi = rang.colFi > c.col ? rang.colFi : (seguent === undefined ? ultimaCol : seguent - 1);
    const etiqueta = normalitzaEtiqueta(c.valor);
    return {
      etiqueta: c.valor.trim(),
      col: c.col,
      colFi,
      def: perfil.grups.find((g) => g.etiqueta.test(etiqueta)) || null,
      noImportat: perfil.noImportats.find((g) => g.etiqueta.test(etiqueta)) || null
    };
  });
  if (!grups.some((g) => g.def && (g.def.tipus === 'begudes' || g.def.tipus === 'volum'))) return null;
  return { fulla: f, col, filaGrups, filaSub, filaTotals, franges, senseHora: senseHora.filter((fila) => fila < ultimaFila), grups };
}

function trobaGraella(f, perfil) {
  for (const c of f.celles) {
    if (!perfil.clau.test(etiquetaDe(c))) continue;
    const graella = graellaDes(f, c, perfil);
    if (graella) return graella;
  }
  return null;
}

const esResum = (f, perfil) => f.celles.some((c) => Object.values(perfil.resum).some((re) => re.test(etiquetaDe(c))));

/* La cel·la de valor d'una etiqueta del resum: la primera plena del rang que hi ha just a la dreta. */
function valorDelResum(f, re) {
  const etiqueta = f.celles.find((c) => re.test(etiquetaDe(c)));
  if (!etiqueta) return null;
  const propi = f.rang(etiqueta.fila, etiqueta.col);
  const r = f.rang(etiqueta.fila, propi.colFi + 1);
  for (let fila = r.fila; fila <= r.filaFi; fila += 1) {
    for (let col = r.col; col <= r.colFi; col += 1) {
      const c = f.cella(fila, col);
      if (!esBuida(c)) return c;
    }
  }
  return null;
}

const prefixDe = (nom) => (nom.includes(' - ') ? nom.slice(0, nom.lastIndexOf(' - ')) : null);

/* Els dies del llibre: cada graella amb el seu resum (el de la mateixa taula de Numbers, el de la mateixa fulla o l'únic).
   Si diverses graelles compartixen el prefix (diverses taules en una fulla de Numbers), s'aparellen per ordre amb els
   resums d'eixe prefix; si no n'hi ha el mateix nombre, cap no en pren (i es demana la data). El nom porta l'ordre. */
function analitzaDies(fulles, perfil) {
  const graelles = fulles.map((f) => trobaGraella(f, perfil)).filter(Boolean);
  const resums = fulles.filter((f) => esResum(f, perfil));
  const resumsSolts = resums.filter((r) => !graelles.some((g) => g.fulla === r));
  return graelles.map((g) => {
    const prefix = prefixDe(g.fulla.nom);
    const germanes = prefix === null ? [g] : graelles.filter((x) => prefixDe(x.fulla.nom) === prefix);
    const delPrefix = prefix === null ? [] : resumsSolts.filter((r) => prefixDe(r.nom) === prefix);
    const ordre = germanes.indexOf(g);
    const aparellat = germanes.length === 1 ? delPrefix[0] : (delPrefix.length === germanes.length ? delPrefix[ordre] : null);
    const resum = aparellat
      || (resums.includes(g.fulla) ? g.fulla : null)
      || (graelles.length === 1 && resums.length === 1 ? resums[0] : null);
    const valors = resum
      ? { data: valorDelResum(resum, perfil.resum.data), alcar: valorDelResum(resum, perfil.resum.alcar), dormir: valorDelResum(resum, perfil.resum.dormir) }
      : { data: null, alcar: null, dormir: null };
    const nom = prefix === null ? g.fulla.nom : (germanes.length > 1 ? `${prefix} (${ordre + 1})` : prefix);
    return { nom, graella: g, resum, ...valors, dataDelFull: dataDeCella(valors.data) };
  });
}

/* ── L'exportació pròpia (fulla «Diari») ───────────────────────────────── */

const TITOLS_DIARI = COLUMNES_DIARI.map((c) => normalitzaEtiqueta(c.titol));
const COLUMNA = Object.freeze(Object.fromEntries(COLUMNES_DIARI.map((c, i) => [c.font, i])));

const esDiariSalut = (f) => TITOLS_DIARI.every((titol, i) => etiquetaDe(f.cella(1, i)) === titol);

/* ── El format ─────────────────────────────────────────────────────────── */

/**
 * La forma d'un llibre (llegixLlibre o llibreDeCsv).
 * @returns {'graella-horaria'|'diari-salut'|'desconegut'}
 */
export function detectaFormat(llibre, perfil = PERFIL_GRAELLA_HORARIA) {
  if (!llibre || !Array.isArray(llibre.fulles)) return 'desconegut';
  const fulles = llibre.fulles.map(indexa);
  if (fulles.some(esDiariSalut)) return 'diari-salut';
  return fulles.some((f) => trobaGraella(f, perfil)) ? 'graella-horaria' : 'desconegut';
}

/**
 * Els dies que porta un llibre amb graelles: el nom de cada un (el de la taula
 * de Numbers o el de la fulla) i la data que diu el seu resum (o null). Per a
 * omplir d'eixida la data de cada dia a la vista.
 * @returns {Array<{ nom: string, data: string|null }>}
 */
export function diesDe(llibre, perfil = PERFIL_GRAELLA_HORARIA) {
  if (!llibre || !Array.isArray(llibre.fulles)) return [];
  const fulles = llibre.fulles.map(indexa);
  /* L'exportació pròpia porta la data a cada fila: no té dies per triar (com a proposaApunts). */
  if (fulles.some(esDiariSalut)) return [];
  return analitzaDies(fulles, perfil).map((d) => congela({ nom: d.nom, data: d.dataDelFull }));
}

/* ── Els apunts ────────────────────────────────────────────────────────── */

/* Un resum de 32 bits d'un text amb una llavor: FNV-1a i la barreja final de MurmurHash3. No és lineal; una
   CRC sí que ho és: dos claus de la mateixa llargada que col·lidixen amb una sal col·lidixen amb totes. */
function resum32(text, llavor) {
  let h = (0x811c9dc5 ^ Math.imul(llavor + 1, 0x9e3779b1)) >>> 0;
  for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/* Un UUID determinista (forma de la versió 5) a partir d'una clau: quatre resums de 32 bits amb llavors distintes.
   És un identificador de reimportació (el mateix full dona el mateix id), no un resum criptogràfic. */
export function idDeterminista(clau) {
  const h = [0, 1, 2, 3].map((llavor) => resum32(clau, llavor).toString(16).padStart(8, '0')).join('');
  const variant = ((parseInt(h[16], 16) & 0x3) | 0x8).toString(16);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${variant}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

const notaAmb = (...parts) => parts.filter(Boolean).join(' · ') || undefined;
const llistaHores = (hores) => hores.join(', ');

const FORMULA_EN_FRANJA = 'És una fórmula: el full la calcula i no s’importa (escriu-hi el valor).';

/* Els apunts (encara sense id ni ofset) d'un dia de graella, i el que no s'hi pot llegir, a `ix`.
   Torna l'hora d'alçar-se del resum (o null), per a l'avís de la nit. */
function apuntsDeGraella(dia, data, ix, horaHabitual = null) {
  const { graella: g } = dia;
  const f = g.fulla;
  const lloc = (fila, col) => `${f.nom}!${lletra(col)}${fila}`;
  /* La franja on cau l'hora d'alçar-se (la del resum o, si no n'hi ha, l'habitual): a l'hora en punt, el que s'hi
     apunta seria d'abans d'alçar-se i aniria a la nit d'abans (hores.js, jornadaDe). Es posa a l'hora d'alçar-se. */
  const horaDelResum = horaDeCella(dia.alcar);
  const horaAlcar = horaDelResum ?? horaHabitual;
  const franjaAlcar = horaAlcar === null ? null : g.franges.filter((franja) => franja.dia === 0 && franja.hora <= horaAlcar).pop() || null;
  let mogudes = 0;
  const momentDeFranja = (franja) => {
    if (franja === franjaAlcar && franja.hora < horaAlcar) {
      mogudes += 1;
      return momentDe(data, horaAlcar);
    }
    return momentDe(sumaDies(data, franja.dia), franja.hora);
  };
  const miccions = new Map();
  const illegibles = new Set();
  const urgencies = new Map();
  const avisaHores = [];

  for (const grup of g.grups) {
    const columnes = Array.from({ length: grup.colFi - grup.col + 1 }, (_, i) => grup.col + i);
    const sub = (col) => (g.filaSub === null ? null : f.cella(g.filaSub, col));
    const plenes = (cols) => g.franges.flatMap((franja) => cols.map((col) => ({ franja, col, c: f.cella(franja.fila, col) })).filter((x) => esPlena(x.c)));
    /* Una fórmula escrita en una franja (=200+150): el full la calcula, no s'importa i es diu on és. */
    for (const franja of g.franges) {
      for (const col of columnes) {
        const c = f.cella(franja.fila, col);
        if (c && c.formula !== null && !esBuida(c)) ix.descarta(lloc(franja.fila, col), FORMULA_EN_FRANJA);
      }
    }
    if (!grup.def) {
      const amb = plenes(columnes);
      if (amb.length) {
        const perque = grup.noImportat ? grup.noImportat.perque : 'l’app no el reconeix';
        ix.avisa('grup-no-importat', `El grup «${grup.etiqueta}» (${amb.length} ${amb.length === 1 ? 'cel·la' : 'cel·les'}) no s’importa: ${perque}.`);
        amb.forEach((x) => ix.descarta(lloc(x.franja.fila, x.col), `El grup «${grup.etiqueta}» no s’importa.`));
      }
      continue;
    }
    if (grup.def.tipus === 'begudes' || grup.def.tipus === 'volum') {
      const cols = grup.def.tipus === 'volum' ? [grup.col] : columnes;
      for (const col of cols) {
        const etiquetaSub = etiquetaDe(sub(col));
        const columna = grup.def.tipus === 'volum' ? { id: 'miccio' } : grup.def.columnes.find((x) => x.etiqueta.test(etiquetaSub));
        const amb = plenes([col]);
        const nomColumna = etiquetaSub !== '' && !UNITATS.test(etiquetaSub) ? sub(col).valor.trim() : grup.etiqueta;
        if (!columna) {
          if (!amb.length) continue;
          if (!UNITATS.test(etiquetaSub) && etiquetaSub !== '') {
            ix.avisa('columna-no-reconeguda', `La columna «${nomColumna}» de «${grup.etiqueta}» no es reconeix: no s’importa.`);
          }
          amb.forEach((x) => ix.descarta(lloc(x.franja.fila, col), `La columna «${nomColumna}» no s’importa.`));
          continue;
        }
        /* El que sumaria SUM a la fila TOTALS: els nombres llegits (un «250 ml» en text s'importa, però SUM no el compta). */
        let suma = 0;
        for (const { franja, c } of amb) {
          const volum = volumDe(c);
          if (volum === null) {
            ix.descarta(lloc(franja.fila, col), 'No és un volum en ml (un nombre sencer).');
            if (grup.def.tipus === 'volum') illegibles.add(franja.fila);
            continue;
          }
          if (c.tipus === 'nombre') suma += volum;
          if (volum === 0) continue;
          if (grup.def.tipus === 'volum') {
            const apunt = { ...valorsPerDefecte('miccio'), tipus: 'miccio', moment: momentDeFranja(franja), volumMl: volum, mesura: 'mesurat', nota: NOTA_FRANJA };
            miccions.set(franja.fila, { apunt, lloc: lloc(franja.fila, col) });
          } else {
            ix.proposa({
              ...valorsPerDefecte('ingesta'), tipus: 'ingesta', moment: momentDeFranja(franja), beguda: columna.beguda, volumMl: volum,
              nota: notaAmb(columna.nota, NOTA_FRANJA)
            }, lloc(franja.fila, col));
          }
        }
        ix.contrasta(g, grup.etiqueta, nomColumna, col, suma);
      }
      continue;
    }
    /* Una escala: una columna per nivell (la sub-capçalera) i una marca a la franja. */
    const nivellDe = new Map(columnes.map((col) => [col, enterDe(sub(col))]).filter(([, n]) => Number.isSafeInteger(n)));
    for (const franja of g.franges) {
      const marcades = columnes.filter((col) => esPlena(f.cella(franja.fila, col)));
      if (!marcades.length) continue;
      if (marcades.length > 1) {
        ix.descarta(lloc(franja.fila, marcades[0]), `Més d’una marca a «${grup.etiqueta}» en la mateixa franja: no se sap quina val.`);
        continue;
      }
      const nivell = nivellDe.get(marcades[0]);
      if (nivell === undefined || !(nivell in grup.def.nivells || (grup.def.id === 'perdua' && nivell === 0))) {
        ix.descarta(lloc(franja.fila, marcades[0]), `La marca de «${grup.etiqueta}» no és cap nivell que l’app entenga.`);
        continue;
      }
      /* Una marca és una «x», un signe, un 1 o el nivell de la columna. Un altre nombre (un 3 a la columna del 0)
         contradiu la columna: no s'endevina quin val. */
      const escrit = enterDe(f.cella(franja.fila, marcades[0]));
      if (Number.isFinite(escrit) && escrit !== nivell && escrit !== 1) {
        ix.descarta(lloc(franja.fila, marcades[0]), `La marca de «${grup.etiqueta}» porta un nombre que no és el nivell de la seua columna: no se sap quin val.`);
        continue;
      }
      if (grup.def.id === 'urgencia') urgencies.set(franja.fila, { nivell, lloc: lloc(franja.fila, marcades[0]), hora: franja.hora });
      else if (nivell > 0) {
        ix.proposa({
          ...valorsPerDefecte('escapament'), tipus: 'escapament', moment: momentDeFranja(franja), quantitat: grup.def.nivells[nivell], nota: NOTA_FRANJA
        }, lloc(franja.fila, marcades[0]));
      }
    }
    /* La fila TOTALS compta les cel·les plenes de cada nivell (COUNTA). */
    for (const [col, nivell] of nivellDe) {
      const plenesNivell = g.franges.filter((franja) => (f.cella(franja.fila, col)?.tipus ?? 'buit') !== 'buit').length;
      ix.contrasta(g, grup.etiqueta, `${grup.etiqueta} ${nivell}`, col, plenesNivell);
    }
  }

  /* La urgència és de cada micció: sense micció a la franja, no es pot desar. */
  for (const [fila, urgencia] of urgencies) {
    const miccio = miccions.get(fila);
    if (miccio) miccio.apunt.urgencia = urgencia.nivell;
    else if (illegibles.has(fila)) ix.descarta(urgencia.lloc, 'La micció d’esta franja no té un volum que es puga llegir: la urgència no es pot desar.');
    else {
      avisaHores.push(urgencia.hora);
      ix.descarta(urgencia.lloc, 'Urgència sense micció a la mateixa franja.');
    }
  }
  if (avisaHores.length) {
    ix.avisa('urgencia-sense-miccio', `Hi ha urgència apuntada sense cap micció a ${llistaHores(avisaHores)}: no es desa, perquè l’app guarda les ganes dins de cada micció.`);
  }
  for (const { apunt, lloc: on } of miccions.values()) ix.proposa(apunt, on);
  if (mogudes) {
    const [quants, es, compten] = mogudes === 1 ? ['1 apunt', 'es posa', 'compta com a primer'] : [`${mogudes} apunts`, 'es posen', 'compten com a primers'];
    ix.avisa('franja-alcar', `${quants} de la franja de les ${franjaAlcar.hora} ${es} a les ${horaAlcar}, l’hora d’alçar-se${horaDelResum ? '' : ' habitual'}: ${compten} del dia, no de la nit d’abans.`);
  }

  /* Les files de la graella sense hora no es poden posar en cap moment. */
  for (const fila of g.senseHora) {
    for (const grup of g.grups) {
      for (let col = grup.col; col <= grup.colFi; col += 1) if (esPlena(f.cella(fila, col))) ix.descarta(lloc(fila, col), 'Fila sense hora.');
    }
  }

  /* El resum: alçar-se i anar a dormir (la data ja l'ha triada la persona). */
  const son = (cella, event, etiqueta) => {
    if (!cella) return null;
    const hora = horaDeCella(cella);
    if (!hora) {
      ix.descarta(`${dia.resum.nom}!${cella.ref}`, `No s’entén l’hora de «${etiqueta}».`);
      return null;
    }
    return { hora, lloc: `${dia.resum.nom}!${cella.ref}`, event };
  };
  const alcar = son(dia.alcar, 'alcar-se', 'Alçar-se del llit');
  const dormir = son(dia.dormir, 'gitar-se', 'Anar a dormir');
  if (alcar) ix.proposa({ tipus: 'son', moment: momentDe(data, alcar.hora), event: 'alcar-se' }, alcar.lloc);
  /* Anar a dormir abans de l'hora d'alçar-se (o de migdia, si no se sap) és passada la mitjanit. */
  if (dormir) ix.proposa({ tipus: 'son', moment: momentDe(dormir.hora < (alcar?.hora ?? '12:00') ? sumaDies(data, 1) : data, dormir.hora), event: 'gitar-se' }, dormir.lloc);
  return alcar?.hora ?? null;
}

/* Un text d'una cel·la de l'exportació pròpia, sense la protecció de fórmules del CSV. */
function textDiari(c) {
  if (!c || esBuida(c)) return '';
  const text = String(c.valor).trim();
  return /^'[=+\-@]/.test(text) ? text.slice(1) : text;
}

/* Lleva un prefix conegut d'unes notes («No l’ha volguda · …»): [la resta, si hi era]. */
function trauPrefix(text, prefix) {
  if (text === prefix) return ['', true];
  return text.startsWith(`${prefix} · `) ? [text.slice(prefix.length + 3), true] : [text, false];
}

/* El valor d'una opció a partir de la seua etiqueta («Mesurat» → 'mesurat'); undefined si no hi és. */
function valorDeEtiqueta(tipus, clau, text) {
  const objectiu = normalitzaEtiqueta(text);
  return opcionsDe(campDe(tipus, clau)).find((o) => normalitzaEtiqueta(o.etiqueta) === objectiu)?.valor;
}

const NO_RECONSTRUIBLE = 'El full no porta tots els camps d’este apunt: per a recuperar-lo, importa la còpia (.json).';

/* Els camps que la fulla «Diari» no porta (full.js, COLUMNES_DIARI): tornen amb el valor per defecte, i es diu. */
function avisaCampsPerDefecte(crus, ix) {
  const parts = [
    crus.some((a) => a.tipus === 'miccio') ? 'de les miccions, on ha orinat, l’ajuda, les molèsties i com era l’orina' : '',
    crus.some((a) => a.tipus === 'escapament') ? 'dels escapaments, quan han passat' : '',
    crus.some((a) => a.tipus === 'son' && a.event === 'despertar') ? 'dels despertars, per què' : ''
  ].filter(Boolean);
  if (!parts.length) return;
  ix.avisa('camps-per-defecte', `Este full no porta tots els camps: ${parts.join('; ')}. Queden com els proposa el formulari (una micció, al vàter); per a recuperar-ho tot, importa la còpia (.json).`);
}

/* Els apunts de la fulla «Diari» de l'exportació de Salut: els del diari miccional (micció, beguda, escapament i son). */
function apuntsDeDiari(f, ix) {
  const prefixSon = `${tipusDe('son').boto} · `;
  const opcionsSon = opcionsDe(campDe('son', 'event'));
  for (const fila of f.files) {
    if (fila === 1) continue;
    const c = (font) => f.cella(fila, COLUMNA[font]);
    const t = (font) => textDiari(c(font));
    const lloc = `${f.nom}!A${fila}`;
    const data = dataDeCella(c('comuns.moment'));
    const hora = horaDeCella(c('derivats.hora'));
    if (!data || !hora) {
      ix.descarta(lloc, 'Fila sense data o hora.');
      continue;
    }
    const moment = momentDe(data, hora);
    const notes = t('comuns.nota');
    if (t('ingesta.beguda')) {
      const [senseRebuig, rebutjada] = trauPrefix(notes, 'No l’ha volguda');
      const [resta, estimat] = trauPrefix(senseRebuig, 'Calculat a ull');
      const volumMl = enterDe(c('ingesta.volumMl'));
      if (volumMl === undefined) {
        ix.descarta(lloc, rebutjada ? 'La beguda que no ha volgut no porta el volum al full.' : 'Falta el volum de la beguda.');
        continue;
      }
      ix.proposa({
        ...valorsPerDefecte('ingesta'), tipus: 'ingesta', moment, beguda: valorDeEtiqueta('ingesta', 'beguda', t('ingesta.beguda')),
        volumMl, estimat, rebutjada, nota: notaAmb(resta)
      }, lloc);
    } else if (t('miccio.mesura') || t('miccio.volumMl')) {
      const volumMl = enterDe(c('miccio.volumMl'));
      ix.proposa({
        ...valorsPerDefecte('miccio'), tipus: 'miccio', moment, volumMl,
        mesura: valorDeEtiqueta('miccio', 'mesura', t('miccio.mesura')) ?? (volumMl === undefined ? 'no-mesurat' : 'mesurat'),
        urgencia: enterDe(c('miccio.urgencia')), nota: notaAmb(notes)
      }, lloc);
    } else if (t('escapament.quantitat')) {
      ix.proposa({
        ...valorsPerDefecte('escapament'), tipus: 'escapament', moment, quantitat: valorDeEtiqueta('escapament', 'quantitat', t('escapament.quantitat')), nota: notaAmb(notes)
      }, lloc);
    } else if (['absorbent.estat', 'deposicio.bristol', 'conducta.intensitat', 'medicacio.nom'].some((font) => t(font))) {
      ix.descarta(lloc, NO_RECONSTRUIBLE);
    } else if (notes.startsWith(prefixSon)) {
      const resta = notes.slice(prefixSon.length);
      const opcio = opcionsSon.find((o) => {
        const etiqueta = o.etiqueta.toLocaleLowerCase('ca');
        return resta === etiqueta || resta.startsWith(`${etiqueta} · `);
      });
      if (!opcio) ix.descarta(lloc, 'No s’entén quin moment del son és.');
      else ix.proposa({ tipus: 'son', moment, event: opcio.valor, nota: notaAmb(resta.slice(opcio.etiqueta.length + 3)) }, lloc);
    } else {
      ix.descarta(lloc, notes ? NO_RECONSTRUIBLE : 'Fila buida.');
    }
  }
}

/* ── La proposta ───────────────────────────────────────────────────────── */

/* El que fa que dos apunts siguen el mateix encara que tinguen un id distint. */
const CAMPS_SIGNATURA = Object.freeze(['tipus', 'moment', 'volumMl', 'beguda', 'mesura', 'urgencia', 'quantitat', 'event']);
const signatura = (apunt) => CAMPS_SIGNATURA.map((camp) => String(apunt[camp] ?? '')).join('|');

/**
 * La proposta d'apunts d'un llibre. No escriu res.
 * @param {object} opcions
 * @param {object} opcions.llibre llegixLlibre o llibreDeCsv (llegixFitxer)
 * @param {object} [opcions.perfil] PERFIL_GRAELLA_HORARIA
 * @param {Array<string|null>} [opcions.dates] la data de cada dia (diesDe), en ordre; si en falta una, la del resum
 * @param {object} [opcions.persona] per a les jornades (hora d'alçar-se habitual)
 * @param {(moment: string) => number} [opcions.ofsetDe] l'ofset de cada moment (per defecte, el d'este dispositiu)
 * @param {string} [opcions.fitxer] el nom del fitxer, per a l'id determinista
 * @param {object[]} [opcions.existents] els apunts que ja hi ha: el que ja hi és no es proposa
 * @returns {{ format: string, dies: Array<{ nom: string, data: string|null }>, apunts: object[],
 *   avisos: Array<{ codi: string, text: string }>, descartats: Array<{ lloc: string, motiu: string }>,
 *   contrast: Array<{ fulla: string, grup: string, columna: string, total: number, suma: number, quadra: boolean }>, jaHiSon: number }}
 */
export function proposaApunts({
  llibre, perfil = PERFIL_GRAELLA_HORARIA, dates = [], persona = {}, ofsetDe = ofsetLocal, fitxer = '', existents = []
} = {}) {
  const format = detectaFormat(llibre, perfil);
  const avisos = [];
  const descartats = [];
  const contrast = [];
  const crus = [];
  const ix = {
    avisa: (codi, text) => avisos.push(congela({ codi, text })),
    descarta: (lloc, motiu) => descartats.push(congela({ lloc, motiu })),
    proposa: (cru, lloc) => crus.push({ cru, lloc }),
    /* Un total de la fila TOTALS (el valor que va guardar el full) contra el que diuen les franges. */
    contrasta(g, grup, columna, col, suma) {
      const c = g.filaTotals === null ? null : g.fulla.cella(g.filaTotals, col);
      if (!c || c.tipus !== 'nombre') return;
      contrast.push(congela({ fulla: g.fulla.nom, grup, columna, total: c.valor, suma, quadra: Math.abs(c.valor - suma) < 0.5 }));
    }
  };
  let dies = [];
  const alcades = new Map();
  if (format === 'desconegut') {
    ix.avisa('format-desconegut', 'Este full no té la forma d’un diari que l’app sàpia llegir: una graella amb la columna «HORA» i les franges, o la fulla «Diari» que exporta Salut.');
  } else {
    const fulles = llibre.fulles.map(indexa);
    if (format === 'diari-salut') {
      apuntsDeDiari(fulles.find(esDiariSalut), ix);
      avisaCampsPerDefecte(crus.map((x) => x.cru), ix);
    } else {
      const analitzats = analitzaDies(fulles, perfil);
      dies = analitzats.map((d, i) => congela({ nom: d.nom, data: esData(dates[i]) ? dates[i] : d.dataDelFull }));
      analitzats.forEach((dia, i) => {
        const data = dies[i].data;
        if (!esData(data)) {
          ix.avisa('falta-data', `Falta la data del full «${dia.nom}»: tria-la per a veure què s’hi afegirà.`);
          return;
        }
        alcades.set(data, apuntsDeGraella(dia, data, ix, esHora(persona.horaAlcarHabitual) ? persona.horaAlcarHabitual : null));
      });
      const noQuadren = contrast.filter((x) => !x.quadra);
      if (noQuadren.length) {
        ix.avisa('totals-no-quadren', `Els totals del full no quadren amb les franges a ${noQuadren.map((x) => `«${x.columna}» (total ${x.total}, franges ${x.suma})`).join(', ')}: revisa el full, pot haver-hi valors que no s’han pogut llegir.`);
      }
    }
  }

  /* L'id, l'ofset i la validació del diccionari; després, el que ja hi és. */
  const ids = new Set(existents.map((apunt) => apunt.id));
  const iguals = new Set(existents.map(signatura));
  const nous = [];
  let jaHiSon = 0;
  for (const { cru, lloc } of crus) {
    const id = idDeterminista(`${fitxer}|${lloc}|${cru.moment}|${cru.tipus}`);
    const { ok, errors, apunt } = validaApunt({ ...cru, id, ofsetMin: ofsetDe(cru.moment) }, { ambId: true });
    if (!ok) ix.descarta(lloc, Object.values(errors)[0]);
    else if (ids.has(apunt.id) || iguals.has(signatura(apunt))) jaHiSon += 1;
    else {
      ids.add(apunt.id);
      nous.push(apunt);
    }
  }
  const apunts = assignaJornades([...nous, ...existents], persona).slice(0, nous.length).map(congela);

  if (format === 'graella-horaria') avisosDeGraella({ apunts, existents, persona, ofsetDe, alcades, ix });
  return congela({
    format, dies: congela(dies), apunts: congela(apunts), avisos: congela(avisos), descartats: congela(descartats), contrast: congela(contrast), jaHiSon
  });
}

/* Els avisos que només es veuen amb tots els apunts: la nit, el matí següent i el canvi d'hora. */
function avisosDeGraella({ apunts, existents, persona, ofsetDe, alcades, ix }) {
  const deMatinada = apunts.filter((apunt) => apunt.jornada < dataDe(apunt.moment));
  if (deMatinada.length) {
    const alcar = [...alcades.values()].find(Boolean) ?? persona.horaAlcarHabitual ?? '07:00';
    const [quants, van] = deMatinada.length === 1 ? ['1 apunt', 'va'] : [`${deMatinada.length} apunts`, 'van'];
    ix.avisa('nit-jornada-anterior', `${quants} de la matinada (abans de les ${alcar}) ${van} a la jornada del dia d’abans: la nit és de la jornada que la precedix.`);
  }
  const ambJornada = assignaJornades([...apunts, ...existents], persona);
  const jornadesAmbMiccio = new Set(ambJornada.filter((apunt) => apunt.tipus === 'miccio').map((apunt) => apunt.jornada));
  const sense = [...new Set(apunts.filter((apunt) => apunt.tipus === 'miccio').map((apunt) => apunt.jornada))]
    .filter((jornada) => !jornadesAmbMiccio.has(sumaDies(jornada, 1))).sort();
  if (sense.length) {
    ix.avisa('falta-mati-seguent', `Per a tancar la nit del ${sense.map(dataCurta).join(', ')} cal la primera micció del matí següent, i no hi és: apunta-la a l’app o importa també el dia següent.`);
  }
  const canvien = [...new Set(apunts.map((apunt) => dataDe(apunt.moment)))].sort()
    .filter((data) => ofsetDe(momentDe(data, '00:00')) !== ofsetDe(momentDe(data, '23:00')));
  if (canvien.length) {
    ix.avisa('canvi-hora', `El ${canvien.map(dataCurta).join(', ')} canvia l’hora: les franges de la matinada poden quedar desplaçades una hora.`);
  }
}
