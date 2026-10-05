/* Salut · l'ESTRUCTURA del diari miccional real (node:test).
   Obri _wiki_de_poble/04_escriptori/01_produccio/salut/diari-miccional-socdepoble.xlsx
   NOMÉS EN LECTURA i n'imprimix l'estructura per a dissenyar l'importador de
   Salut: les entrades del paquet, les fulles, les dimensions, les cel·les
   combinades, les fórmules, les validacions, la fila de capçalera (etiquetes)
   i, per columna, el tipus dominant i els recomptes.

   PRIVACITAT (dades de salut, RGPD art. 9). Cap valor d'una cel·la de dades
   s'imprimix ni s'afirma: ni volums, ni hores, ni notes, ni noms. Del text
   només ix la FORMA («hora en text», «sí/no», «text lliure»…), la llargada i
   quants valors distints hi ha. De les dates, com a molt, el mes («aaaa-mm»).
   De les files de damunt de la capçalera només ixen les etiquetes de
   formulari (el text que acaba en «:»), mai el valor del costat; un títol
   fusionat només diu quants caràcters té. Les etiquetes senceres de la
   plantilla (la capçalera de la graella i el resum) només ixen després de
   comprovar que la plantilla és buida: cap franja plena i cap cel·la de
   valor del resum (pacient, data, alçar-se, anar a dormir) escrita; si n'hi
   ha cap, la prova se salta sense dir-ne el valor. Les propietats del document
   (docProps: autor, dates) no es lligen. Si el fitxer no hi és (la CI, un
   altre ordinador), tot se salta.

   El lector és el que podria fer servir l'importador al navegador: el
   directori central del ZIP i el DEFLATE cru en JS pur (inflateRawPur), que
   es contrasta amb node:zlib. Safari 16.0–16.3 no té DecompressionStream i
   Chrome 100 i Firefox 100 no tenen 'deflate-raw': un XLSX d'Excel (mètode 8)
   només es pot obrir a tota la Baseline amb el motor pur. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';
import { inflateRawPur } from '../src/sections/gestoria/nucli/inflate.js';
import { detectaFormat, diesDe, proposaApunts } from '../src/apps/salut/nucli/importacio.js';
import { llegixLlibre } from '../src/utils/fulls/index.js';
import { crc32 } from '../src/utils/fulls/zip.js';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FITXER = path.join(ARREL, '_wiki_de_poble', '04_escriptori', '01_produccio', 'salut', 'diari-miccional-socdepoble.xlsx');
const SALTA = existsSync(FITXER) ? false : 'no hi ha el diari miccional real en esta màquina';

/* ── ZIP: directori central, STORE i DEFLATE ────────────────────────────── */

const SIGNATURA_LOCAL = 0x04034b50;
const SIGNATURA_CENTRAL = 0x02014b50;
const SIGNATURA_FINAL = 0x06054b50;
const MIDA_FINAL = 22;
const MAX_EIXIDA = 64 * 1024 * 1024;

/* Les entrades del paquet, encara comprimides. El registre final es busca des
   del final (pot portar comentari). Sense ZIP64 ni xifrat. */
function entradesZip(bytes) {
  const vista = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const minim = Math.max(0, bytes.length - MIDA_FINAL - 0xffff);
  let fi = bytes.length - MIDA_FINAL;
  while (fi >= minim && vista.getUint32(fi, true) !== SIGNATURA_FINAL) fi -= 1;
  if (fi < minim) throw new TypeError('No és un ZIP: falta el registre final.');
  const total = vista.getUint16(fi + 10, true);
  let pos = vista.getUint32(fi + 16, true);
  if (total === 0xffff || pos === 0xffffffff) throw new TypeError('ZIP64: no suportat.');
  const descodificador = new TextDecoder('utf-8');
  const entrades = [];
  for (let i = 0; i < total; i += 1) {
    if (vista.getUint32(pos, true) !== SIGNATURA_CENTRAL) throw new TypeError('Directori central malmés.');
    const llargNom = vista.getUint16(pos + 28, true);
    const nom = descodificador.decode(bytes.subarray(pos + 46, pos + 46 + llargNom));
    const local = vista.getUint32(pos + 42, true);
    if (vista.getUint32(local, true) !== SIGNATURA_LOCAL) throw new TypeError(`Capçalera local malmesa: ${nom}`);
    const comprimida = vista.getUint32(pos + 20, true);
    const inici = local + 30 + vista.getUint16(local + 26, true) + vista.getUint16(local + 28, true);
    entrades.push({
      nom,
      xifrat: (vista.getUint16(pos + 8, true) & 1) === 1,
      metode: vista.getUint16(pos + 10, true),
      crc: vista.getUint32(pos + 16, true),
      mida: vista.getUint32(pos + 24, true),
      crues: bytes.subarray(inici, inici + comprimida)
    });
    pos += 46 + llargNom + vista.getUint16(pos + 30, true) + vista.getUint16(pos + 32, true);
  }
  return entrades;
}

const MOTORS = Object.freeze({
  node: (crues) => new Uint8Array(inflateRawSync(crues)),
  pur: (crues) => inflateRawPur(crues, { maxEixida: MAX_EIXIDA })
});

function descomprimix(entrada, motor) {
  if (entrada.xifrat) throw new TypeError(`Entrada xifrada: ${entrada.nom}`);
  if (entrada.metode === 0) return entrada.crues.slice();
  if (entrada.metode === 8) return MOTORS[motor](entrada.crues);
  throw new TypeError(`Mètode de compressió ${entrada.metode} no suportat: ${entrada.nom}`);
}

/* ── XML mínim (sense DOM): només el que cal per a l'estructura ─────────── */

const ENTITATS = Object.freeze({ amp: '&', lt: '<', gt: '>', quot: '"', apos: '\'' });
const desescapa = (text) => String(text ?? '')
  .replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (sencer, nom) => {
    if (nom[0] === '#') return String.fromCodePoint(nom[1] === 'x' || nom[1] === 'X' ? parseInt(nom.slice(2), 16) : Number(nom.slice(1)));
    return ENTITATS[nom.toLowerCase()] ?? sencer;
  })
  .replace(/_x([0-9A-Fa-f]{4})_/g, (sencer, hex) => String.fromCharCode(parseInt(hex, 16)));

function atributs(text) {
  const resultat = {};
  for (const m of String(text ?? '').matchAll(/([\w:.-]+)\s*=\s*"([^"]*)"/g)) {
    resultat[m[1]] = m[2];
    const local = m[1].split(':').pop();
    if (!(local in resultat)) resultat[local] = m[2];
  }
  return resultat;
}

const textsDe = (xml) => [...String(xml ?? '').matchAll(/<(?:\w+:)?t(?:\s[^>]*)?>([\s\S]*?)<\/(?:\w+:)?t>/g)].map((m) => desescapa(m[1])).join('');

function relacions(xml) {
  const mapa = new Map();
  for (const m of String(xml ?? '').matchAll(/<(?:\w+:)?Relationship\b([^>]*?)\/?>/g)) {
    const a = atributs(m[1]);
    mapa.set(a.Id, { desti: a.Target, tipus: String(a.Type ?? '').split('/').pop(), extern: a.TargetMode === 'External' });
  }
  return mapa;
}

/* La ruta dins del paquet d'un destí relatiu a la part `base`. */
const resolDesti = (base, desti) => (desti.startsWith('/') ? desti.slice(1) : path.posix.normalize(path.posix.join(path.posix.dirname(base), desti)));
const relsDe = (part) => `${path.posix.dirname(part)}/_rels/${path.posix.basename(part)}.rels`;

/* Les cadenes compartides, sense la fonètica (rPh). */
function cadenesCompartides(xml) {
  return [...String(xml ?? '').matchAll(/<(?:\w+:)?si>([\s\S]*?)<\/(?:\w+:)?si>/g)]
    .map((m) => textsDe(m[1].replace(/<(?:\w+:)?rPh\b[\s\S]*?<\/(?:\w+:)?rPh>/g, '')));
}

/* ── Formats de nombre: dates, hores i nombres ──────────────────────────── */

const FORMATS_PREDEFINITS = Object.freeze({
  0: 'General', 1: '0', 2: '0.00', 3: '#,##0', 4: '#,##0.00', 9: '0%', 10: '0.00%', 14: 'data curta', 15: 'd-mmm-yy', 16: 'd-mmm',
  17: 'mmm-yy', 18: 'h:mm AM/PM', 19: 'h:mm:ss AM/PM', 20: 'h:mm', 21: 'h:mm:ss', 22: 'data i hora', 45: 'mm:ss', 46: '[h]:mm:ss',
  47: 'mm:ss.0', 49: '@'
});
const CLASSE_PREDEFINIDA = Object.freeze({
  14: 'data', 15: 'data', 16: 'data', 17: 'data', 22: 'data-hora', 18: 'hora', 19: 'hora', 20: 'hora', 21: 'hora', 45: 'hora', 46: 'durada', 47: 'hora', 49: 'text'
});

function estils(xml) {
  const formats = new Map();
  for (const m of String(xml ?? '').matchAll(/<(?:\w+:)?numFmt\b([^>]*?)\/?>/g)) {
    const a = atributs(m[1]);
    formats.set(Number(a.numFmtId), desescapa(a.formatCode));
  }
  const bloc = /<(?:\w+:)?cellXfs\b[^>]*>([\s\S]*?)<\/(?:\w+:)?cellXfs>/.exec(String(xml ?? ''));
  const xfs = bloc ? [...bloc[1].matchAll(/<(?:\w+:)?xf\b([^>]*?)\/?>/g)].map((m) => Number(atributs(m[1]).numFmtId ?? 0)) : [];
  return { formats, xfs };
}

const codiFormat = (id, formats) => formats.get(id) ?? FORMATS_PREDEFINITS[id] ?? `#${id}`;

/* data · hora · data-hora · durada · text · nombre, a partir del codi de format. */
function classeFormat(id, formats) {
  if (!formats.has(id)) return CLASSE_PREDEFINIDA[id] ?? 'nombre';
  const net = formats.get(id).replace(/"[^"]*"/g, '').replace(/\\./g, '').replace(/\[(?![hms]\])[^\]]*\]/gi, '').split(';')[0].toLowerCase();
  const teHora = /[hs]/.test(net) || /\[[hms]\]/.test(net);
  const teData = /[dy]/.test(net) || (!teHora && /m/.test(net) && !/[0#]/.test(net));
  if (teData && teHora) return 'data-hora';
  if (teData) return 'data';
  if (teHora) return 'hora';
  if (net.includes('@')) return 'text';
  return 'nombre';
}

/* ── Les cel·les d'una fulla ────────────────────────────────────────────── */

function indexColumna(lletres) {
  let n = 0;
  for (const c of lletres) n = n * 26 + (c.charCodeAt(0) - 64);
  return n - 1;
}

function lletraColumna(i) {
  let n = i + 1;
  let text = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    text = String.fromCharCode(65 + r) + text;
    n = Math.floor((n - 1) / 26);
  }
  return text;
}

function llegixCelles(xml) {
  const celles = [];
  let senseRef = 0;
  for (const m of xml.matchAll(/<(?:\w+:)?c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:\w+:)?c>)/g)) {
    const a = atributs(m[1]);
    const ref = /^([A-Z]+)(\d+)$/.exec(a.r ?? '');
    if (!ref) {
      senseRef += 1;
      continue;
    }
    const interior = m[2] ?? '';
    const v = /<(?:\w+:)?v>([\s\S]*?)<\/(?:\w+:)?v>/.exec(interior)?.[1];
    const f = /<(?:\w+:)?f\b[^>]*?(?:\/>|>([\s\S]*?)<\/(?:\w+:)?f>)/.exec(interior);
    celles.push({
      col: indexColumna(ref[1]),
      fila: Number(ref[2]),
      t: a.t ?? 'n',
      s: Number(a.s ?? 0),
      v: v === undefined ? null : desescapa(v),
      formula: Boolean(f),
      textFormula: f && f[1] ? desescapa(f[1]) : null,
      inline: a.t === 'inlineStr' ? textsDe(interior) : null
    });
  }
  return { celles, senseRef };
}

/* El tipus d'una cel·la, i el text o el nombre NOMÉS per a fer recomptes (mai s'imprimixen). */
function tipusCela(c, cadenes, est) {
  if (c.t === 's' || c.t === 'inlineStr' || c.t === 'str') {
    const text = c.t === 's' ? cadenes[Number(c.v)] ?? '' : c.t === 'str' ? c.v ?? '' : c.inline ?? '';
    return text.trim() === '' ? { tipus: 'buit' } : { tipus: 'text', text };
  }
  if (c.t === 'b') return { tipus: 'boolea' };
  if (c.t === 'e') return { tipus: 'error' };
  if (c.t === 'd') return { tipus: 'data-iso' };
  if (c.v === null || c.v === '') return { tipus: 'buit' };
  const n = Number(c.v);
  if (!Number.isFinite(n)) return { tipus: 'text', text: c.v };
  const classe = classeFormat(est.xfs[c.s] ?? 0, est.formats);
  return { tipus: classe === 'text' ? 'nombre' : classe, n };
}

/* La forma d'un text, mai el text. */
function formaText(text) {
  const t = text.trim();
  if (/^\d{1,2}[:.h']\d{2}(?:[:.]\d{2})?\s*h?$/i.test(t)) return 'hora en text';
  if (/^\d{1,2}[/.-]\d{1,2}(?:[/.-]\d{2,4})?$/.test(t) || /^\d{4}-\d{2}-\d{2}/.test(t)) return 'data en text';
  if (/^[-+]?\d+(?:[.,]\d+)?$/.test(t)) return 'nombre en text';
  if (/^[-+]?\d+(?:[.,]\d+)?\s*[a-zA-Zµ]{1,4}\.?$/.test(t)) return 'nombre amb unitat';
  if (/^[xX✓✔✗•*+-]$/.test(t)) return 'marca d’un caràcter';
  if (/^(?:s[ií]|no|yes|y|n)$/i.test(t)) return 'sí/no';
  if (/^\p{L}[\p{L}'’-]*$/u.test(t) && t.length <= 15) return 'una paraula';
  if (t.length <= 25 && t.split(/\s+/).length <= 3) return 'text curt';
  return 'text lliure';
}
const unitatDe = (text) => /^[-+]?\d+(?:[.,]\d+)?\s*([a-zA-Zµ]{1,4})\.?$/.exec(text.trim())?.[1].toLowerCase() ?? null;

/* El vocabulari genèric d'un diari miccional (ca, es, en). Un text només
   s'imprimix si TOTES les seues paraules hi són: un nom propi, una xifra de
   dos dígits o més, o un «sí/no» no hi són mai, i aleshores només ix la
   llargada. Els textos de les files amb valors apuntats no passen per ací. */
const VOCABULARI = new Set(`
  diari miccional miccions micció miccio miccion hora hores dia dies data nit matí mati tarda vesprada migdia orina orines orinar volum volums
  quantitat quant líquid líquids liquids ingesta ingestes beguda begudes begut beure aigua urgència urgencia urgències escapament
  escapaments pèrdua pèrdues perdua perdues fuita fuites compresa compreses bolquer bolquers absorbent absorbents canvi canvis total
  totals suma mitjana alçar alcar se llevar llit anar dormir gitar despertar despertars observacions observació notes nota comentaris
  pacient nom setmana dilluns dimarts dimecres dijous divendres dissabte diumenge resum taula gràfic grafic entrada entrades sortida
  sortides eixida balanç balanc diferència diferencia mesura mesurat vegades nombre número numero màxim maxim mínim minim capacitat
  bufeta ganes intensitat esforç diürna diurna nocturna nocturn freqüència frequencia del de la el els les a al i o en per amb sense
  ml cc l h min g kg
  diario micción micciones horas día días fecha noche mañana orinas volumen cantidad líquido líquidos bebida bebidas agua urgencia
  escape escapes pérdida pérdidas fuga fugas pañal pañales cambio cambios media levantarse levantar acostarse acostar ir cama
  observaciones notas paciente nombre semana lunes martes miércoles jueves viernes sábado domingo resumen exportación tabla hoja
  dibujos gráfico salida balance los las y por con sin máximo mínimo número veces vejiga
  hour hours time date day night volume urine intake fluid urgency leak leakage pad pads change total notes
  beguts ingerit ingerits ingerides consumits presos pixat pixats pixar pixada pixades orinat orinada orinades urgents urgent
  dolor cremor coïssor molèsties molestia molèstia sensació sensacions deposició deposicions femta ventre restrenyiment son set gana
  febre fuga roba gotes goteig degoteig mullat mullada mullades sec seca humit humida xop xopa tos esforç activitat esport caminar
  llet cafè te infusió infusions suc sucs refresc refrescs sopa brou fruita alcohol vi cervesa altres altre altra aigües
  nivell grau escala lleu moderat moderada fort forta intens intensa poc poca molt molta gens cops vegada
  picor picors pica coure cou mal ardor escozor molestias sensación deposición pressió buidar buidatge incomplet incompleta
  tisana gasosa bebida leche zumo café té agua franja franges pañales compresas pis pipí pipi caca
`.split(/\s+/).filter(Boolean));
const UNITATS = new Set(['ml', 'cc', 'l', 'h', 'min', 'g', 'kg', '%']);

function reconegut(text) {
  const paraules = String(text).toLowerCase().normalize('NFC').split(/[^\p{L}\p{N}%]+/u).filter(Boolean);
  return paraules.length > 0 && paraules.every((p) => VOCABULARI.has(p) || /^\d$/.test(p));
}

/* Una etiqueta per a la consola: només si és vocabulari genèric; si no, la llargada. */
const etiqueta = (text) => {
  const net = String(text).replace(/\s+/g, ' ').trim();
  return reconegut(net) ? `«${net.slice(0, 40)}»` : `‹${net.length} car.›`;
};

/* Una fórmula com a patró relatiu (R[df]C[dc]) i sense els textos literals que no són vocabulari. */
function patroFormula(text, fila, col) {
  return text
    .replace(/"([^"]*)"/g, (sencer, dins) => (dins === '' || reconegut(dins) ? sencer : '"‹text›"'))
    .replace(/(?<![A-Za-z0-9_.])(\$?)([A-Z]{1,3})(\$?)(\d+)(?![\w(])/g, (sencer, absC, lletres, absF, num) => {
      const c = indexColumna(lletres);
      const f = Number(num);
      return `R${absF ? f : `[${f - fila}]`}C${absC ? c + 1 : `[${c - col}]`}`;
    });
}

function mesDeSerial(serial, date1904) {
  const data = new Date(Date.UTC(1899, 11, 30) + (Math.floor(serial) + (date1904 ? 1462 : 0)) * 86400000);
  return `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, '0')}`;
}

const rangDe = (ref) => {
  const m = /^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/.exec(ref);
  if (!m) return null;
  return { c1: indexColumna(m[1]), f1: Number(m[2]), c2: indexColumna(m[3] ?? m[1]), f2: Number(m[4] ?? m[2]) };
};

/* ── L'anàlisi d'una fulla ──────────────────────────────────────────────── */

const NUMERICS = new Set(['nombre', 'data', 'data-hora', 'hora', 'durada', 'data-iso']);

function analitzaFulla(xml, cadenes, est, date1904) {
  const { celles, senseRef } = llegixCelles(xml);
  const perFila = new Map();
  for (const c of celles) {
    if (!perFila.has(c.fila)) perFila.set(c.fila, new Map());
    perFila.get(c.fila).set(c.col, { ...c, ...tipusCela(c, cadenes, est) });
  }
  const files = [...perFila.keys()].sort((a, b) => a - b);
  const delaFila = (fila) => [...(perFila.get(fila)?.values() ?? [])];
  const compta = (fila, pred) => delaFila(fila).filter(pred).length;
  const plenes = (fila) => compta(fila, (i) => i.tipus !== 'buit');
  const numeriques = (fila) => compta(fila, (i) => NUMERICS.has(i.tipus));
  const textos = (fila) => compta(fila, (i) => i.tipus === 'text');
  /* Una fila de dades: dos cel·les que no són text, o una i tres de plenes. */
  const primeraDeDades = files.find((f) => numeriques(f) >= 2 || (numeriques(f) >= 1 && plenes(f) >= 3)) ?? null;
  /* La capçalera: l'última fila amb dos textos o més abans de la primera de dades. */
  const capcalera = primeraDeDades === null ? null : [...files].reverse().find((f) => f < primeraDeDades && textos(f) >= 2) ?? null;
  const combinacions = [...xml.matchAll(/<(?:\w+:)?mergeCell\b[^>]*\bref="([^"]*)"/g)].map((m) => rangDe(m[1])).filter(Boolean);
  const combinadaA = (fila, col) => combinacions.find((r) => r.f1 === fila && r.c1 === col && (r.c2 > r.c1 || r.f2 > r.f1)) ?? null;

  /* Les files de damunt de la capçalera: etiquetes de formulari i grups fusionats. */
  const damunt = files.filter((f) => capcalera !== null && f < capcalera).map((f) => {
    const textosFila = delaFila(f).filter((i) => i.tipus === 'text').sort((a, b) => a.col - b.col);
    const fusionats = textosFila.filter((i) => combinadaA(f, i.col));
    const grups = fusionats.length >= 2 ? fusionats.map((i) => `${lletraColumna(i.col)}: ${etiqueta(i.text)}`) : [];
    const titol = fusionats.length === 1 ? `títol fusionat de ${fusionats[0].text.trim().length} caràcters` : '';
    const formulari = textosFila.filter((i) => /:\s*$/.test(i.text) && i.text.trim().length <= 40).map((i) => `${lletraColumna(i.col)}: ${etiqueta(i.text)}`);
    return { fila: f, plenes: plenes(f), textos: textosFila.length, numeriques: numeriques(f), grups, titol, formulari };
  });

  const etiquetes = new Map(capcalera === null ? [] : delaFila(capcalera).filter((i) => i.tipus === 'text').map((i) => [i.col, i.text]));
  const textCapcalera = new Set([...etiquetes.values()].map((t) => t.trim().toLowerCase()));
  const dades = files.filter((f) => (capcalera === null ? true : f > capcalera));

  /* Blocs de files seguides i capçaleres repetides dins de la zona de dades. */
  let blocs = 0;
  let anterior = null;
  let repetides = 0;
  for (const f of dades) {
    if (plenes(f) === 0) continue;
    if (anterior === null || f > anterior + 1) blocs += 1;
    anterior = f;
    const iguals = delaFila(f).filter((i) => i.tipus === 'text' && textCapcalera.has(i.text.trim().toLowerCase())).length;
    if (etiquetes.size >= 2 && iguals >= Math.min(3, etiquetes.size)) repetides += 1;
  }

  const columnes = new Map();
  const perfil = (col) => {
    if (!columnes.has(col)) {
      columnes.set(col, {
        tipus: {}, formats: new Set(), formes: {}, unitats: new Set(), distints: new Set(), llargMax: 0,
        enters: 0, decimals: 0, fraccions: 0, negatius: 0, dies: new Set(), mesos: new Set(), horesAmbDia: 0, formules: 0
      });
    }
    return columnes.get(col);
  };
  for (const col of etiquetes.keys()) perfil(col);
  let formules = 0;
  for (const f of dades) {
    for (const i of delaFila(f)) {
      if (i.tipus === 'buit' && !etiquetes.has(i.col) && !columnes.has(i.col)) continue;
      const p = perfil(i.col);
      p.tipus[i.tipus] = (p.tipus[i.tipus] ?? 0) + 1;
      if (i.formula) {
        p.formules += 1;
        formules += 1;
      }
      if (i.tipus !== 'buit' && i.tipus !== 'text') p.formats.add(codiFormat(est.xfs[i.s] ?? 0, est.formats));
      if (i.tipus === 'text') {
        const forma = formaText(i.text);
        p.formes[forma] = (p.formes[forma] ?? 0) + 1;
        const unitat = unitatDe(i.text);
        if (unitat) p.unitats.add(unitat);
        p.distints.add(i.text.trim().toLowerCase());
        p.llargMax = Math.max(p.llargMax, i.text.trim().length);
      }
      if (i.tipus === 'nombre') {
        if (Number.isInteger(i.n)) p.enters += 1;
        else p.decimals += 1;
        if (i.n > 0 && i.n < 1) p.fraccions += 1;
        if (i.n < 0) p.negatius += 1;
      }
      if (i.tipus === 'data' || i.tipus === 'data-hora') {
        p.dies.add(Math.floor(i.n));
        p.mesos.add(mesDeSerial(i.n, date1904));
      }
      if (i.tipus === 'hora' && i.n >= 1) p.horesAmbDia += 1;
    }
  }
  const totalFormules = celles.filter((c) => c.formula).length;
  return { celles: celles.length, senseRef, perFila, files, primeraDeDades, capcalera, combinacions, damunt, etiquetes, dades, blocs, repetides, columnes, formules, totalFormules };
}

/* El mapa de la graella: una lletra per cel·la, mai el valor.
   H hora · D data · N nombre · T text · B sí/no · E error · · buida amb estil · = dins d'una combinació
   (en minúscula, si ve d'una fórmula; f: fórmula buida) */
const CODI_TIPUS = Object.freeze({ hora: 'H', durada: 'H', data: 'D', 'data-hora': 'D', 'data-iso': 'D', nombre: 'N', text: 'T', boolea: 'B', error: 'E' });
function mapaGraella(a) {
  const maxCol = Math.max(-1, ...[...a.perFila.values()].flatMap((fila) => [...fila.keys()]), ...a.combinacions.map((r) => r.c2));
  const cobertes = new Set();
  for (const r of a.combinacions) {
    for (let f = r.f1; f <= r.f2; f += 1) for (let c = r.c1; c <= r.c2; c += 1) if (f !== r.f1 || c !== r.c1) cobertes.add(`${f}:${c}`);
  }
  const ultima = Math.max(0, ...a.files, ...a.combinacions.map((r) => r.f2));
  const linies = [`     ${Array.from({ length: maxCol + 1 }, (_, c) => lletraColumna(c).slice(-1)).join('')}`];
  for (let f = 1; f <= ultima; f += 1) {
    const fila = a.perFila.get(f) ?? new Map();
    let text = '';
    for (let c = 0; c <= maxCol; c += 1) {
      const i = fila.get(c);
      if (cobertes.has(`${f}:${c}`) && (!i || i.tipus === 'buit')) text += '=';
      else if (!i) text += ' ';
      else if (i.tipus === 'buit') text += i.formula ? 'f' : '·';
      else text += i.formula ? CODI_TIPUS[i.tipus].toLowerCase() : CODI_TIPUS[i.tipus];
    }
    linies.push(`${String(f).padStart(4, ' ')} ${text.replace(/\s+$/, '')}`);
  }
  return linies;
}

/* La zona de dades: de la primera a l'última fila amb una hora o una data escrita a mà (la clau
   de cada fila); si no n'hi ha, les files amb dos nombres escrits a mà que no són una escala.
   Fora d'eixa zona hi ha les capçaleres i els totals. */
const esClau = (i) => !i.formula && ['hora', 'data', 'data-hora', 'data-iso'].includes(i.tipus);
const nombresAMa = (cel) => [...cel.values()].filter((i) => !i.formula && i.tipus === 'nombre').sort((x, y) => x.col - y.col);

/* Trossos de cel·les veïnes amb enters seguits que comencen per 0 o 1 i no passen de 10: una escala de capçalera. */
function escales(nombres) {
  const trossos = [];
  let actual = [];
  for (const i of nombres) {
    const darrer = actual[actual.length - 1];
    if (darrer && i.col === darrer.col + 1 && i.n === darrer.n + 1) actual.push(i);
    else {
      if (actual.length >= 2) trossos.push(actual);
      actual = [i];
    }
  }
  if (actual.length >= 2) trossos.push(actual);
  return trossos.filter((t) => Number.isInteger(t[0].n) && (t[0].n === 0 || t[0].n === 1) && t[t.length - 1].n <= 10);
}

function zonaDades(a) {
  const ambClau = a.files.filter((f) => [...a.perFila.get(f).values()].some(esClau));
  const candidates = ambClau.length ? ambClau : a.files.filter((f) => {
    const nombres = nombresAMa(a.perFila.get(f));
    const enEscala = escales(nombres).reduce((n, t) => n + t.length, 0);
    return nombres.length - enEscala >= 2;
  });
  return candidates.length ? { des: candidates[0], fins: candidates[candidates.length - 1], perClau: ambClau.length > 0 } : null;
}

/* Les validacions de dades (també les d'extLst, x14): tipus, abast i fórmula (llistes d'opcions de la plantilla). */
function validacions(xml) {
  return [...xml.matchAll(/<(?:\w+:)?dataValidation\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:\w+:)?dataValidation>)/g)].map((m) => {
    const a = atributs(m[1]);
    const interior = m[2] ?? '';
    const formula = desescapa((/<(?:\w+:)?formula1>([\s\S]*?)<\/(?:\w+:)?formula1>/.exec(interior)?.[1] ?? '').replace(/<[^>]+>/g, ''));
    const abast = a.sqref ?? /<(?:\w+:)?sqref>([\s\S]*?)<\/(?:\w+:)?sqref>/.exec(interior)?.[1] ?? '';
    return { tipus: a.type ?? 'cap', abast, formula: formula.slice(0, 60) };
  });
}

/* ── El llibre sencer, una sola vegada ──────────────────────────────────── */

let lectura = null;
function llibre() {
  lectura ??= (() => {
    const bytes = new Uint8Array(readFileSync(FITXER));
    const entrades = entradesZip(bytes);
    const parts = new Map(entrades.map((e) => [e.nom, descomprimix(e, 'node')]));
    const text = (nom) => (parts.has(nom) ? new TextDecoder('utf-8').decode(parts.get(nom)) : null);
    const arrel = relacions(text('_rels/.rels'));
    const document = [...arrel.values()].find((r) => r.tipus === 'officeDocument');
    const partLlibre = document ? resolDesti('', document.desti) : 'xl/workbook.xml';
    const xmlLlibre = text(partLlibre) ?? '';
    const relsLlibre = relacions(text(relsDe(partLlibre)));
    const destiDe = (tipus) => [...relsLlibre.values()].filter((r) => r.tipus === tipus).map((r) => resolDesti(partLlibre, r.desti));
    const cadenes = cadenesCompartides(destiDe('sharedStrings').map(text).join(''));
    const est = estils(destiDe('styles').map(text).join(''));
    const date1904 = /<(?:\w+:)?workbookPr\b[^>]*\bdate1904="(?:1|true)"/.test(xmlLlibre);
    const fulles = [...xmlLlibre.matchAll(/<(?:\w+:)?sheet\b([^>]*?)\/?>/g)].map((m) => {
      const a = atributs(m[1]);
      const rel = relsLlibre.get(a['r:id'] ?? a.id);
      const part = rel ? resolDesti(partLlibre, rel.desti) : null;
      return { nom: desescapa(a.name ?? ''), estat: a.state ?? 'visible', tipus: rel?.tipus ?? '?', part };
    });
    const nomsDefinits = [...xmlLlibre.matchAll(/<(?:\w+:)?definedName\b([^>]*)>/g)].map((m) => atributs(m[1]).name ?? '');
    return { bytes, entrades, parts, text, partLlibre, cadenes, est, date1904, fulles, nomsDefinits };
  })();
  return lectura;
}

const llistaComptes = (objecte) => Object.entries(objecte).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ');

/* ── Proves ─────────────────────────────────────────────────────────────── */

test('el paquet: cada entrada es llig, el CRC quadra i el DEFLATE pur dona els mateixos bytes que node:zlib', { skip: SALTA }, () => {
  const { bytes, entrades, parts } = llibre();
  assert.ok(entrades.length > 0, 'el ZIP té entrades');
  const metodes = {};
  const perCarpeta = new Map();
  for (const e of entrades) {
    assert.equal(e.xifrat, false, `entrada sense xifrar: ${e.nom}`);
    assert.ok(e.metode === 0 || e.metode === 8, `mètode STORE o DEFLATE: ${e.nom}`);
    metodes[e.metode === 8 ? 'DEFLATE' : 'STORE'] = (metodes[e.metode === 8 ? 'DEFLATE' : 'STORE'] ?? 0) + 1;
    const dades = parts.get(e.nom);
    assert.equal(dades.length, e.mida, `mida descomprimida: ${e.nom}`);
    assert.equal(crc32(dades), e.crc, `CRC: ${e.nom}`);
    assert.deepEqual(descomprimix(e, 'pur'), dades, `el motor pur coincidix amb node:zlib: ${e.nom}`);
    const carpeta = e.nom.includes('/') ? e.nom.slice(0, e.nom.lastIndexOf('/')) : '(arrel)';
    const acumulat = perCarpeta.get(carpeta) ?? { n: 0, bytes: 0 };
    perCarpeta.set(carpeta, { n: acumulat.n + 1, bytes: acumulat.bytes + e.mida });
  }
  console.log(`\n# Paquet: ${bytes.length} bytes, ${entrades.length} entrades (${llistaComptes(metodes)})`);
  for (const [carpeta, { n, bytes: mida }] of [...perCarpeta].sort()) console.log(`#   ${carpeta}: ${n} ${n === 1 ? 'entrada' : 'entrades'}, ${mida} bytes`);
  console.log(`#   entrades: ${entrades.map((e) => e.nom).filter((nom) => !nom.startsWith('docProps/')).join(' · ')}`);
});

test('el llibre: fulles, sistema de dates, cadenes, estils i noms definits', { skip: SALTA }, () => {
  const { partLlibre, fulles, date1904, cadenes, est, nomsDefinits, parts } = llibre();
  assert.ok(fulles.length > 0, 'hi ha almenys una fulla');
  for (const f of fulles.filter((x) => x.tipus === 'worksheet')) assert.ok(parts.has(f.part), `la fulla té la seua part: ${f.part}`);
  console.log(`\n# Llibre: ${partLlibre}; ${fulles.length} fulles; sistema de dates ${date1904 ? '1904' : '1900'}; `
    + `${cadenes.length} cadenes compartides; ${est.xfs.length} estils de cel·la; ${est.formats.size} formats propis`);
  for (const [id, codi] of est.formats) console.log(`#   format propi ${id}: «${codi}» → ${classeFormat(id, est.formats)}`);
  fulles.forEach((f, i) => console.log(`#   fulla ${i + 1}: ${etiqueta(f.nom)} · ${f.tipus} · ${f.estat}`));
  if (nomsDefinits.length) console.log(`#   noms definits: ${nomsDefinits.map(etiqueta).join(', ')}`);
});

test('cada fulla: dimensió, combinacions, fórmules, validacions, capçalera i perfil de columnes (sense valors)', { skip: SALTA }, () => {
  const { fulles, text, cadenes, est, date1904 } = llibre();
  const deTreball = fulles.filter((f) => f.tipus === 'worksheet');
  assert.ok(deTreball.length > 0, 'almenys una fulla de treball');
  for (const f of deTreball) {
    const xml = text(f.part);
    assert.match(xml, /<(?:\w+:)?sheetData\b/, `la fulla porta sheetData: ${f.part}`);
    const a = analitzaFulla(xml, cadenes, est, date1904);
    const dimensio = /<(?:\w+:)?dimension\b[^>]*\bref="([^"]*)"/.exec(xml)?.[1] ?? '—';
    const relsFulla = relacions(text(relsDe(f.part)));
    const perTipus = {};
    for (const r of relsFulla.values()) perTipus[r.tipus] = (perTipus[r.tipus] ?? 0) + 1;
    const comentaris = [...relsFulla.values()].filter((r) => r.tipus === 'comments')
      .reduce((n, r) => n + [...(text(resolDesti(f.part, r.desti)) ?? '').matchAll(/<(?:\w+:)?comment\b/g)].length, 0);
    const taules = [...relsFulla.values()].filter((r) => r.tipus === 'table').map((r) => text(resolDesti(f.part, r.desti)) ?? '');
    const valides = validacions(xml);
    const condicionals = [...xml.matchAll(/<(?:\w+:)?conditionalFormatting\b/g)].length;
    const ocultes = { files: [...xml.matchAll(/<(?:\w+:)?row\b[^>]*\bhidden="(?:1|true)"/g)].length, columnes: [...xml.matchAll(/<(?:\w+:)?col\b[^>]*\bhidden="(?:1|true)"/g)].length };
    const fixada = /<(?:\w+:)?pane\b[^>]*\bstate="frozen"/.test(xml);

    console.log(`\n# Fulla ${etiqueta(f.nom)} (${f.part}): dimensió ${dimensio}; ${a.celles} cel·les escrites`
      + `${a.senseRef ? ` (${a.senseRef} sense referència)` : ''}; files ${a.files[0] ?? '—'}–${a.files[a.files.length - 1] ?? '—'}`);
    console.log(`#   combinacions ${a.combinacions.length}; fórmules ${a.totalFormules}; validacions ${valides.length}; formats condicionals ${condicionals}; `
      + `files ocultes ${ocultes.files}; columnes ocultes ${ocultes.columnes}; panell fixat ${fixada ? 'sí' : 'no'}; relacions ${llistaComptes(perTipus) || 'cap'}; comentaris ${comentaris}`);
    for (const v of valides) console.log(`#   validació ${v.tipus} a ${v.abast}${v.formula ? `: ${v.formula}` : ''}`);
    for (const t of taules) {
      const nom = atributs(/<(?:\w+:)?table\b([^>]*)>/.exec(t)?.[1]).displayName ?? '?';
      const cols = [...t.matchAll(/<(?:\w+:)?tableColumn\b[^>]*\bname="([^"]*)"/g)].map((m) => etiqueta(desescapa(m[1])));
      console.log(`#   taula ${etiqueta(nom)} a ${atributs(/<(?:\w+:)?table\b([^>]*)>/.exec(t)?.[1]).ref ?? '?'}: ${cols.join(', ')}`);
    }
    console.log(`#   primera fila de dades: ${a.primeraDeDades ?? '—'}; fila de capçalera: ${a.capcalera ?? '—'}; files de dades ${a.dades.length}; `
      + `blocs seguits ${a.blocs}; capçaleres repetides dins de les dades ${a.repetides}; fórmules a les dades ${a.formules}`);
    for (const d of a.damunt) {
      const detall = [d.titol, d.grups.length ? `grups: ${d.grups.join(', ')}` : '', d.formulari.length ? `etiquetes: ${d.formulari.join(', ')}` : '']
        .filter(Boolean).join(' · ');
      console.log(`#   damunt, fila ${d.fila}: ${d.plenes} plenes (${d.textos} text, ${d.numeriques} nombre o data)${detall ? ` · ${detall}` : ''}`);
    }
    for (const [col, p] of [...a.columnes].sort((x, y) => x[0] - y[0])) {
      const nom = a.etiquetes.has(col) ? etiqueta(a.etiquetes.get(col)) : '(sense etiqueta)';
      const ambDades = Object.entries(p.tipus).filter(([t]) => t !== 'buit');
      const dominant = ambDades.sort((x, y) => y[1] - x[1])[0]?.[0] ?? 'buit';
      const parts2 = [`dominant ${dominant}`, llistaComptes(p.tipus) || 'cap cel·la'];
      if (p.formats.size) parts2.push(`formats [${[...p.formats].join(' | ')}]`);
      if (p.enters || p.decimals) parts2.push(`enters ${p.enters}, decimals ${p.decimals}, entre 0 i 1 ${p.fraccions}, negatius ${p.negatius}`);
      if (p.dies.size) {
        const mesos = [...p.mesos].sort();
        parts2.push(`${p.dies.size} dies distints, de ${mesos[0]} a ${mesos[mesos.length - 1]}`);
      }
      if (p.horesAmbDia) parts2.push(`${p.horesAmbDia} hores amb dia`);
      if (Object.keys(p.formes).length) {
        parts2.push(`text: ${llistaComptes(p.formes)}; ${p.distints.size} distints; fins a ${p.llargMax} caràcters${p.unitats.size ? `; unitats ${[...p.unitats].sort().join(', ')}` : ''}`);
      }
      if (p.formules) parts2.push(`fórmules ${p.formules}`);
      console.log(`#   ${lletraColumna(col)} ${nom}: ${parts2.join(' · ')}`);
    }
    if (a.celles === 0) continue;
    console.log(`#   combinacions: ${a.combinacions.map((r) => `${lletraColumna(r.c1)}${r.f1}:${lletraColumna(r.c2)}${r.f2}`).join(' ') || 'cap'}`);
    console.log('#   mapa (H hora, D data, N nombre, T text, B sí/no, E error, · buida, = combinada; minúscula: fórmula):');
    for (const linia of mapaGraella(a)) console.log(`#   ${linia}`);
    /* Fora de la zona de dades (capçaleres, totals): els textos (vocabulari o llargada) i les escales.
       Dins: només les unitats i, de les claus horàries, la forma de les franges. */
    const zona = zonaDades(a);
    const dins = (fila) => zona !== null && fila >= zona.des && fila <= zona.fins;
    console.log(`#   zona de dades: ${zona ? `files ${zona.des}–${zona.fins} (${zona.perClau ? 'per la clau d’hora o data' : 'per nombres escrits a mà'})` : 'cap'}`);
    const textos = [];
    for (const [fila, cel] of [...a.perFila].sort((x, y) => x[0] - y[0])) {
      const ambText = [...cel.values()].filter((i) => i.tipus === 'text' && !i.formula).sort((x, y) => x.col - y.col);
      if (!dins(fila)) {
        textos.push(...ambText.map((i) => `${lletraColumna(i.col)}${fila} ${etiqueta(i.text)}`));
        for (const t of escales(nombresAMa(cel))) {
          textos.push(`${lletraColumna(t[0].col)}${fila}–${lletraColumna(t[t.length - 1].col)}${fila} escala ${t[0].n}…${t[t.length - 1].n}`);
        }
        const solts = nombresAMa(cel).length - escales(nombresAMa(cel)).reduce((n, t) => n + t.length, 0);
        if (solts) textos.push(`fila ${fila}: ${solts} nombres escrits a mà fora d’escala`);
      } else {
        textos.push(...ambText.filter((i) => UNITATS.has(i.text.trim().toLowerCase())).map((i) => `${lletraColumna(i.col)}${fila} «${i.text.trim()}» (unitat)`));
      }
    }
    if (textos.length) console.log(`#   fora de la zona: ${textos.join(' · ')}`);
    /* Les cel·les buides amb estil: quin format esperen (el camp per omplir), sense cap valor. */
    const buidesFora = [];
    const buidesDins = new Map();
    for (const [fila, cel] of a.perFila) {
      for (const i of cel.values()) {
        if (i.tipus !== 'buit' || i.formula) continue;
        const id = est.xfs[i.s] ?? 0;
        if (id === 0) continue;
        const descripcio = `${classeFormat(id, est.formats)} «${codiFormat(id, est.formats)}»`;
        if (dins(fila)) {
          if (!buidesDins.has(i.col)) buidesDins.set(i.col, new Set());
          buidesDins.get(i.col).add(descripcio);
        } else buidesFora.push(`${lletraColumna(i.col)}${fila} ${descripcio}`);
      }
    }
    if (buidesFora.length) console.log(`#   buides amb format, fora de la zona: ${buidesFora.sort().join(' · ')}`);
    if (buidesDins.size) {
      console.log(`#   buides amb format, dins de la zona: ${[...buidesDins].sort((x, y) => x[0] - y[0]).map(([col, s]) => `${lletraColumna(col)} ${[...s].join('/')}`).join(' · ')}`);
    }
    /* Les claus horàries de la zona: quantes franges, si són hores en punt i seguides, i quants dies de calendari porten. */
    const claus = zona ? a.files.filter(dins).flatMap((f) => [...a.perFila.get(f).values()].filter((i) => !i.formula && i.tipus === 'hora')) : [];
    for (const col of [...new Set(claus.map((i) => i.col))]) {
      const delaColumna = claus.filter((i) => i.col === col).sort((x, y) => x.fila - y.fila);
      const minuts = delaColumna.map((i) => Math.round((i.n - Math.floor(i.n)) * 1440) % 1440);
      const hores = minuts.map((m) => Math.floor(m / 60));
      const seguides = hores.every((h, k) => k === 0 || h === (hores[k - 1] + 1) % 24);
      const dies = new Set(delaColumna.map((i) => Math.floor(i.n)));
      const mesos = [...new Set(delaColumna.map((i) => mesDeSerial(i.n, date1904)))].sort();
      console.log(`#   clau horària ${lletraColumna(col)}: ${delaColumna.length} franges, ${new Set(hores).size} hores distintes, `
        + `${minuts.every((m) => m % 60 === 0) ? 'totes en punt' : 'amb minuts'}, ${seguides ? 'seguides d’hora en hora' : 'no seguides'}; `
        + `part de data: ${dies.size} ${dies.size === 1 ? 'dia' : 'dies'} (${mesos[0]}${mesos.length > 1 ? `..${mesos[mesos.length - 1]}` : ''})`);
    }
    /* Les fórmules com a patrons relatius, amb quantes vegades i la primera cel·la. */
    const patrons = new Map();
    for (const [fila, cel] of a.perFila) {
      for (const i of cel.values()) {
        if (!i.textFormula) continue;
        const patro = patroFormula(i.textFormula, fila, i.col);
        const actual = patrons.get(patro) ?? { n: 0, primera: null };
        const ref = `${lletraColumna(i.col)}${fila}`;
        patrons.set(patro, { n: actual.n + 1, primera: actual.primera ?? ref });
      }
    }
    const compartides = [...a.perFila.values()].flatMap((cel) => [...cel.values()]).filter((i) => i.formula && !i.textFormula).length;
    for (const [patro, { n, primera }] of patrons) console.log(`#   fórmula ×${n} (des de ${primera}): =${patro}`);
    if (compartides) console.log(`#   fórmules compartides sense text propi: ${compartides}`);
  }
});

test('els gràfics: tipus, títols reconeguts i rangs de les sèries (mai la memòria cau de valors)', { skip: SALTA }, () => {
  const { entrades, text } = llibre();
  const grafics = entrades.map((e) => e.nom).filter((nom) => /^xl\/charts\/chart\d+\.xml$/.test(nom));
  console.log(`\n# Gràfics: ${grafics.length}`);
  const refDe = (bloc) => desescapa(/<(?:\w+:)?f>([\s\S]*?)<\/(?:\w+:)?f>/.exec(bloc ?? '')?.[1] ?? '');
  for (const nom of grafics) {
    const xml = text(nom);
    const tipus = [...new Set([...xml.matchAll(/<(?:\w+:)?(\w+)Chart>/g)].map((m) => m[1]))];
    const titols = [...xml.matchAll(/<(?:\w+:)?title>([\s\S]*?)<\/(?:\w+:)?title>/g)].map((m) => {
      const t = [...m[1].matchAll(/<(?:\w+:)?t>([\s\S]*?)<\/(?:\w+:)?t>/g)].map((x) => desescapa(x[1])).join('');
      return t ? etiqueta(t) : refDe(m[1]) || '—';
    });
    const series = [...xml.matchAll(/<(?:\w+:)?ser>([\s\S]*?)<\/(?:\w+:)?ser>/g)].map((m) => {
      const bloc = (nomBloc) => new RegExp(`<(?:\\w+:)?${nomBloc}>([\\s\\S]*?)<\\/(?:\\w+:)?${nomBloc}>`).exec(m[1])?.[1];
      const tx = bloc('tx');
      const literal = /<(?:\w+:)?v>([\s\S]*?)<\/(?:\w+:)?v>/.exec(tx ?? '')?.[1];
      const nomSerie = refDe(tx) || (literal ? etiqueta(desescapa(literal)) : '—');
      return `nom ${nomSerie}; categories ${refDe(bloc('cat') ?? bloc('xVal')) || '—'}; valors ${refDe(bloc('val') ?? bloc('yVal')) || '—'}`;
    });
    console.log(`#   ${nom}: ${tipus.join(', ') || '?'} · títols ${titols.join(' | ') || 'cap'}`);
    for (const s of series) console.log(`#     sèrie: ${s}`);
  }
  assert.ok(Array.isArray(grafics));
});

/* ── El lector de producció (utils/fulls) contra el d'esta prova ───────── */

/* llegixLlibre és el que farà servir l'importador al navegador: DEFLATE pur,
   sense DOM, i sense descomprimir imatges ni gràfics. Es contrasta amb el
   lector independent de dalt i només n'ixen recomptes: cap valor. */

/* El tipus de cada lector amb els mateixos noms. Les diferències són de nom,
   no de lectura: la durada ([h]:mm) de la prova és una hora per a
   llegixLlibre; un booleà o una data ISO sense valor és buit; i un text
   només d'espais, que la prova compta com a buit, llegixLlibre el conserva
   com a text. Una data ISO (t="d") la classifica llegixLlibre pel format. */
const tipusDeLaProva = (p) => {
  if (p.tipus === 'durada') return 'hora';
  return (p.tipus === 'boolea' || p.tipus === 'data-iso') && (p.v === null || p.v === '') ? 'buit' : p.tipus;
};
const tipusDelLector = (c) => (c.tipus === 'text' && c.valor.trim() === '' ? 'buit' : c.tipus);
const mateixTipus = (c, p) => tipusDelLector(c) === tipusDeLaProva(p)
  || (tipusDeLaProva(p) === 'data-iso' && ['data', 'data-hora', 'hora', 'text'].includes(c.tipus));

test('llegixLlibre (utils/fulls) obri el diari real: 4 fulles, sistema de 1904 i la mateixa estructura (sense valors)', { skip: SALTA }, () => {
  const { bytes, fulles, text, cadenes, est, date1904 } = llibre();
  const llegit = llegixLlibre(bytes);
  const deTreball = fulles.filter((f) => f.tipus === 'worksheet');
  assert.equal(llegit.fulles.length, 4, 'quatre fulles de treball');
  assert.equal(llegit.date1904, true, 'sistema de dates de 1904 (Numbers)');
  assert.equal(llegit.date1904, date1904, 'el mateix sistema de dates que el lector de la prova');
  assert.ok(deTreball.length === llegit.fulles.length && llegit.fulles.every((f, i) => f.nom === deTreball[i].nom), 'els mateixos noms de fulla, en el mateix ordre');
  const tipus = {};
  const desglossament = { lector: {}, prova: {} };
  const suma = (comptes, clau) => {
    comptes[clau] = (comptes[clau] ?? 0) + 1;
  };
  llegit.fulles.forEach((f, i) => {
    const a = analitzaFulla(text(deTreball[i].part), cadenes, est, date1904);
    assert.equal(f.celles.length, a.celles, `les mateixes cel·les escrites a la fulla ${i + 1}`);
    assert.equal(f.combinacions.length, a.combinacions.length, `les mateixes combinacions a la fulla ${i + 1}`);
    assert.equal(f.celles.filter((c) => c.formula !== null).length, a.totalFormules, `les mateixes fórmules a la fulla ${i + 1}`);
    for (const c of f.celles) tipus[c.tipus] = (tipus[c.tipus] ?? 0) + 1;
    /* Cel·la a cel·la, el tipus. Si falla, el missatge diu la referència i els dos tipus, mai el valor. */
    const delaProva = (c) => a.perFila.get(c.fila)?.get(c.col);
    const diferents = f.celles.filter((c) => !delaProva(c) || !mateixTipus(c, delaProva(c)))
      .map((c) => `${c.ref} ${c.tipus}/${delaProva(c)?.tipus ?? 'cap'}`);
    assert.equal(diferents.length, 0, `el mateix tipus a cada cel·la de la fulla ${i + 1} (lector/prova): ${diferents.slice(0, 10).join(', ')}`);
    /* El desglossament per tipus, comptat per cada lector sobre les seues cel·les. */
    for (const c of f.celles) suma(desglossament.lector, tipusDelLector(c));
    for (const [fila, cel] of a.perFila) {
      for (const p of cel.values()) {
        const t = tipusDeLaProva(p);
        suma(desglossament.prova, t === 'data-iso' ? tipusDelLector(f.celles.find((c) => c.fila === fila && c.col === p.col) ?? { tipus: t }) : t);
      }
    }
  });
  assert.deepEqual(desglossament.lector, desglossament.prova, 'el mateix desglossament per tipus en tot el llibre (només recomptes)');
  /* La clau de la graella: les 24 franges de la columna A són hores (Numbers hi posa una part de data, que el lector lleva). */
  const horesClau = llegit.fulles[2].celles.filter((c) => c.col === 0 && c.tipus === 'hora' && c.formula === null).length;
  assert.equal(horesClau, 24, 'les 24 franges horàries de la graella es lligen com a hores');
  console.log(`\n# llegixLlibre: ${llegit.fulles.length} fulles; ${llegit.fulles.reduce((n, f) => n + f.celles.length, 0)} cel·les (${llistaComptes(tipus)}); `
    + `${llegit.fulles.reduce((n, f) => n + f.combinacions.length, 0)} combinacions; claus horàries ${horesClau}`);
});

/* ── Les etiquetes de la plantilla (text de formulari, mai valors) ──────── */

/* Les etiquetes de la plantilla es necessiten senceres per a mapejar els
   grups que el vocabulari no reconeix (E2, R1, V1…). Només s'imprimixen si
   la plantilla està BUIDA: abans es comprova que les cel·les de valor del
   resum (pacient, data, alçar-se i anar a dormir) i totes les cel·les de les
   franges (files de la clau horària, columnes de la B en avant, sense les
   fórmules) són buides. Si n'hi ha cap de plena (la família ja l'ha omplit),
   la prova se SALTA: no s'imprimix res i no es torna roja per una cosa que
   és l'objectiu del diari. De la graella, només les files de damunt de la
   primera franja; del resum, els textos escrits a mà que no són cap cel·la
   de valor. */
const normalitza = (text) => String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const ETIQUETES_DE_VALOR = Object.freeze([/^pacient/, /^data$/, /^alcar/, /dormir/]);

/* El rang que ocupa una cel·la (la seua combinació, o ella sola). */
const rangDeCella = (fulla, c) => fulla.combinacions.find((r) => r.fila === c.fila && r.col === c.col)
  ?? { fila: c.fila, col: c.col, filaFi: c.fila, colFi: c.col };

/* La cel·la de valor d'una etiqueta: el rang que comença just a la dreta del de l'etiqueta. */
function rangDeValor(fulla, etiqueta) {
  const propi = rangDeCella(fulla, etiqueta);
  const col = propi.colFi + 1;
  return fulla.combinacions.find((r) => r.fila === etiqueta.fila && r.col === col) ?? { fila: etiqueta.fila, col, filaFi: etiqueta.fila, colFi: col };
}
const dinsDe = (r, c) => c.fila >= r.fila && c.fila <= r.filaFi && c.col >= r.col && c.col <= r.colFi;

/* La plantilla real, només amb recomptes: la graella (24 franges), el resum (l'etiqueta del pacient), les
   etiquetes amb valor del resum i si totes les cel·les per omplir són buides. Cap valor ix d'ací. */
function estatPlantilla(fulles) {
  const graella = fulles.find((f) => f.celles.filter((c) => c.col === 0 && c.tipus === 'hora' && c.formula === null).length === 24) ?? null;
  const resum = fulles.find((f) => f.celles.some((c) => c.tipus === 'text' && /^pacient/.test(normalitza(c.valor)))) ?? null;
  if (!graella || !resum) return { graella, resum, etiquetesValor: [], rangsValor: [], primeraFranja: null, buida: false };
  /* 1. La graella: les cel·les per omplir de les franges (la clau horària fora, i les fórmules també). */
  const filesFranja = new Set(graella.celles.filter((c) => c.col === 0 && c.tipus === 'hora' && c.formula === null).map((c) => c.fila));
  const plenesFranja = graella.celles.filter((c) => filesFranja.has(c.fila) && c.col >= 1 && c.formula === null && c.tipus !== 'buit').length;
  /* 2. El resum: les cel·les de valor de pacient, data, alçar-se i anar a dormir. */
  const etiquetesValor = resum.celles.filter((c) => c.tipus === 'text' && c.formula === null && ETIQUETES_DE_VALOR.some((p) => p.test(normalitza(c.valor))));
  const rangsValor = etiquetesValor.map((c) => rangDeValor(resum, c));
  const plenesValor = resum.celles.filter((c) => rangsValor.some((r) => dinsDe(r, c)) && c.tipus !== 'buit').length;
  return { graella, resum, etiquetesValor, rangsValor, primeraFranja: Math.min(...filesFranja), buida: plenesFranja === 0 && plenesValor === 0 };
}

const PLENA = 'la plantilla ja porta valors: no s’imprimix ni s’afirma res que en depenga';

test('les etiquetes de la plantilla buida: graella (files de capçalera) i resum (sense cap cel·la de valor)', { skip: SALTA }, (t) => {
  const { bytes } = llibre();
  const { graella, resum, etiquetesValor, rangsValor, primeraFranja, buida } = estatPlantilla(llegixLlibre(bytes).fulles);
  assert.ok(graella, 'hi ha una graella amb 24 franges horàries');
  assert.ok(resum, 'hi ha un full resum amb l’etiqueta del pacient');
  assert.equal(etiquetesValor.length, 4, 'les quatre etiquetes amb valor del resum (pacient, data, alçar-se, anar a dormir)');
  if (!buida) {
    t.skip(PLENA);
    return;
  }

  /* 3. Ara sí: les etiquetes. */
  const textA = (c) => `${c.ref} «${String(c.valor).replace(/\s+/g, ' ').trim().slice(0, 40)}»`;
  const capcalera = graella.celles.filter((c) => c.fila < primeraFranja && c.tipus === 'text' && c.formula === null);
  const escalesCapcalera = graella.celles.filter((c) => c.fila < primeraFranja && c.tipus === 'nombre' && c.formula === null);
  const delResum = resum.celles.filter((c) => c.tipus === 'text' && c.formula === null && !rangsValor.some((r) => dinsDe(r, c)));
  console.log(`\n# Etiquetes de la graella «${graella.nom.slice(graella.nom.lastIndexOf(' - ') + 3)}» (files 1–${primeraFranja - 1}):`);
  for (let fila = 1; fila < primeraFranja; fila += 1) {
    const textos = capcalera.filter((c) => c.fila === fila).map(textA);
    const nombres = escalesCapcalera.filter((c) => c.fila === fila).map((c) => `${c.ref} ${c.valor}`);
    console.log(`#   fila ${fila}: ${[...textos, ...nombres].join(' · ') || 'cap'}`);
  }
  console.log(`#   combinacions de capçalera: ${graella.combinacions.filter((r) => r.fila < primeraFranja).map((r) => r.ref).join(' ') || 'cap'}`);
  console.log(`# Etiquetes del resum «${resum.nom.slice(resum.nom.lastIndexOf(' - ') + 3)}» (sense cap cel·la de valor): ${delResum.map(textA).join(' · ')}`);
  console.log(`#   cel·les de valor comprovades buides: ${rangsValor.map((r) => `${r.fila}:${r.col}–${r.filaFi}:${r.colFi}`).join(' ')}`);
});

/* ── L'importador de Salut sobre la plantilla real ──────────────────────── */

/* L'importador (src/apps/salut/nucli/importacio.js) és Node pur. Amb una
   data inventada (no la del full) es fa tot el camí. Dos proves:
   · la forma, sempre: el format, el nombre de dies i que el pacient no entra
     mai a la proposta (un booleà: el nom no ix ni en un error);
   · la plantilla buida (si la família ja l'ha omplida, se salta): cap apunt,
     cap descart, cap data i els totals quadren. Només n'ixen recomptes i
     codis d'avís, i les afirmacions sobre valors són booleans, perquè cap
     AssertionError porte una data o una xifra del diari com a `actual`. */
test('l’importador de Salut reconeix la plantilla real com a graella horària i el pacient no entra mai a la proposta', { skip: SALTA }, () => {
  const { bytes } = llibre();
  const llegit = llegixLlibre(bytes);
  assert.equal(detectaFormat(llegit), 'graella-horaria', 'la plantilla es reconeix per les etiquetes');
  assert.equal(diesDe(llegit).length, 1, 'un dia: una graella amb el seu resum');
  const proposta = proposaApunts({ llibre: llegit, dates: ['2000-01-03'], ofsetDe: () => 60, fitxer: 'plantilla.xlsx' });
  assert.equal(proposta.format, 'graella-horaria');
  const { resum, etiquetesValor } = estatPlantilla(llegit.fulles);
  const etiquetaPacient = etiquetesValor.find((c) => /^pacient/.test(normalitza(c.valor)));
  assert.ok(etiquetaPacient, 'el resum té l’etiqueta del pacient');
  const rang = rangDeValor(resum, etiquetaPacient);
  const pacient = resum.celles.filter((c) => dinsDe(rang, c) && c.tipus === 'text').map((c) => c.valor.trim()).join(' ').trim();
  assert.ok(pacient.length < 3 || !JSON.stringify(proposta).includes(pacient), 'el pacient no entra a la proposta');
  console.log(`\n# Importador (forma): format ${proposta.format}; 1 dia; el pacient no entra a la proposta`);
});

test('l’importador sobre la plantilla buida: cap apunt, cap descart, cap data i els totals quadren', { skip: SALTA }, (t) => {
  const { bytes } = llibre();
  const llegit = llegixLlibre(bytes);
  if (!estatPlantilla(llegit.fulles).buida) {
    t.skip(PLENA);
    return;
  }
  const dies = diesDe(llegit);
  assert.ok(dies.length === 1 && dies[0].data === null, 'un dia, i el resum no porta cap data (plantilla buida)');
  const proposta = proposaApunts({ llibre: llegit, dates: ['2000-01-03'], ofsetDe: () => 60, fitxer: 'plantilla.xlsx' });
  assert.equal(proposta.apunts.length, 0, 'cap apunt: totes les cel·les per omplir són buides');
  assert.equal(proposta.descartats.length, 0, 'res descartat: no hi ha res escrit');
  assert.ok(proposta.contrast.length > 0 && proposta.contrast.every((x) => x.quadra), 'els totals de la plantilla quadren amb les franges buides');
  const sense = proposaApunts({ llibre: llegit, ofsetDe: () => 60 });
  assert.deepEqual(sense.avisos.map((a) => a.codi), ['falta-data'], 'sense data, només es demana la data');
  console.log(`\n# Importador (buida): ${dies.length} dia; ${proposta.apunts.length} apunts; ${proposta.descartats.length} descartats; `
    + `${proposta.contrast.length} totals contrastats; avisos [${proposta.avisos.map((a) => a.codi).join(', ') || 'cap'}]`);
});
