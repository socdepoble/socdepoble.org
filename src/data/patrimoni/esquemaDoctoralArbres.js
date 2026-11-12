import { capturaEdicioRevisioPatrimoni } from '../revisionsPatrimoni.js';
import { FONT_CATALEG_ARBRES_2020 } from './arbresMonumentals2020.js';
import { escriuCsvDoctoral, lligCsvDoctoral, textDeCelaDoctoral } from './csvDoctoralArbres.js';
import { puntWgs84DesDUtmEtrs89 } from './georeferenciaDoctoralArbres.js';
import { sha256Hex } from '../federacio/portabilitatFediversity.js';

export const ESQUEMA_DOCTORAL_ARBRES = 'sdp.dendrologia.doctoral.v1';
export const LIMIT_BYTES_FITXES_DOCTORALS = 8 * 1024 * 1024;
const MAX_FITXES = 1000;
const MAX_REVISIONS = 9999;
const ID_FONT_LA_TORRE = 'la-torre-de-les-macanes-2007-2020';
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*(?![\s\S])/u;
const NAMESPACE = 'https://socdepoble.org/ns/dendrologia#';
export const FORMATS_FITXES_DOCTORALS = Object.freeze([
  Object.freeze({ id: 'jsonld', titol: 'JSON-LD', mime: 'application/ld+json', extensio: 'jsonld' }),
  Object.freeze({ id: 'csv', titol: 'Darwin Core CSV', mime: 'text/csv;charset=utf-8', extensio: 'csv' }),
  Object.freeze({ id: 'geojson', titol: 'GeoJSON', mime: 'application/geo+json', extensio: 'geojson' }),
  Object.freeze({ id: 'bibtex', titol: 'Citació BibTeX', mime: 'application/x-bibtex', extensio: 'bib' }),
  Object.freeze({ id: 'datacite', titol: 'Esborrany DataCite', mime: 'application/json', extensio: 'json' })
]);

export const REFERENCIES_DOCTORALS_ARBRES = Object.freeze([
  Object.freeze({ id: 'dwc', titol: 'Darwin Core · TDWG', url: 'https://dwc.tdwg.org/list/' }),
  Object.freeze({ id: 'apg', titol: 'APG IV · Angiospermes', url: 'https://doi.org/10.1111/boj.12385' }),
  Object.freeze({ id: 'powo', titol: 'Plants of the World Online · Kew', url: 'https://powo.science.kew.org/' }),
  Object.freeze({ id: 'flora', titol: 'Flora Iberica · Real Jardín Botánico, CSIC', url: 'https://www.floraiberica.es/' }),
  Object.freeze({ id: 'granada', titol: 'Norma Granada · AEPJP', url: 'https://www.aepjp.es/comprar-manual-norma-granada/' }),
  Object.freeze({ id: 'vta', titol: 'Mattheck i Breloer · VTA', url: 'https://doi.org/10.1080/03071375.1994.9746995' }),
  Object.freeze({ id: 'rivas', titol: 'Rivas-Martínez · Bioclimatologia', url: 'https://doi.org/10.5616/gg110001' }),
  Object.freeze({ id: 'llei', titol: 'Llei 4/2006 de patrimoni arbori monumental', url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2006-11581' }),
  Object.freeze({ id: 'geojson', titol: 'GeoJSON · RFC 7946', url: 'https://www.rfc-editor.org/rfc/rfc7946' }),
  Object.freeze({ id: 'datacite', titol: 'DataCite · Esquema 4.6', url: 'https://schema.datacite.org/meta/kernel-4.6/' })
]);

export const LIMITS_MESURES_DOCTORALS = Object.freeze({
  alcadaM: Object.freeze({ minim: 0, maxim: 200, unitat: 'm' }),
  diametreCapcadaM: Object.freeze({ minim: 0, maxim: 200, unitat: 'm' }),
  perimetreNormalCm: Object.freeze({ minim: 0, maxim: 100000, unitat: 'cm' }),
  perimetreBasalCm: Object.freeze({ minim: 0, maxim: 100000, unitat: 'cm' })
});

export function esMesuraDendrometricaValida(camp, valor) {
  const limit = Object.hasOwn(LIMITS_MESURES_DOCTORALS, camp) ? LIMITS_MESURES_DOCTORALS[camp] : null;
  return Boolean(limit && typeof valor === 'number' && Number.isFinite(valor)
    && valor >= limit.minim && valor <= limit.maxim);
}

function invalid() {
  throw new TypeError('Les dades de la fitxa doctoral d’arbres no són vàlides.');
}

function objecte(input, camps, opcionals = {}) {
  if (!input || ![Object.prototype, null].includes(Object.getPrototypeOf(input))) invalid();
  const claus = Reflect.ownKeys(input);
  const net = {};
  for (const clau of claus) {
    if (typeof clau !== 'string'
      || (!Object.hasOwn(camps, clau) && !Object.hasOwn(opcionals, clau))) invalid();
  }
  const presents = Object.entries(opcionals).filter(([clau]) => Object.hasOwn(input, clau));
  for (const [clau, captura] of [...Object.entries(camps), ...presents]) {
    const descriptor = Object.getOwnPropertyDescriptor(input, clau);
    if (!descriptor || !Object.hasOwn(descriptor, 'value')) invalid();
    net[clau] = captura(descriptor.value);
  }
  return Object.freeze(net);
}

function llista(input, captura, maxim) {
  if (!Array.isArray(input) || input.length > maxim || Reflect.ownKeys(input).length !== input.length + 1) invalid();
  const neta = [];
  for (let i = 0; i < input.length; i += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(input, String(i));
    if (!descriptor || !Object.hasOwn(descriptor, 'value')) invalid();
    neta.push(captura(descriptor.value));
  }
  return Object.freeze(neta);
}

function text(valor, maxim = 16000) {
  if (typeof valor !== 'string' || valor.length > maxim * 2
    || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/u.test(valor)
    || /[\uD800-\uDFFF]/u.test(valor) || [...valor].length > maxim) invalid();
  return valor;
}
const textCurt = valor => text(valor, 256);
const textObligatori = valor => {
  const net = text(valor);
  if (!net.trim()) invalid();
  return net;
};
const slug = valor => {
  const net = text(valor, 128);
  if (!SLUG.test(net)) invalid();
  return net;
};
const nullable = captura => valor => valor === null ? null : captura(valor);
const boolea = valor => {
  if (typeof valor !== 'boolean') invalid();
  return valor;
};
const nombre = (minim, maxim) => valor => {
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < minim || valor > maxim) invalid();
  return valor;
};
const enter = (minim, maxim) => valor => {
  const net = nombre(minim, maxim)(valor);
  if (!Number.isInteger(net)) invalid();
  return net;
};
const any = enter(1, 9999);
function data(valor) {
  const net = text(valor, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(net)) invalid();
  const instant = new Date(net + 'T00:00:00Z');
  if (!Number.isFinite(instant.getTime()) || instant.toISOString().slice(0, 10) !== net) invalid();
  return net;
}
function url(valor) {
  const net = text(valor, 2048);
  let parsed;
  try { parsed = new URL(net); } catch { invalid(); }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password
    || /[\u0000-\u0020\u007F-\u009F\s]/u.test(net)) invalid();
  return net;
}
function mitja(valor) {
  const net = text(valor, 2048);
  if (!net.startsWith('/')) return url(net);
  if (!net.startsWith('/assets/') || net.includes('\\') || net.includes('%')
    || net.split('/').some(tros => tros === '.' || tros === '..') || /[\u0000-\u0020\u007F]/u.test(net)) invalid();
  return net;
}

const capturaDimensions = valor => objecte(valor, {
  alcadaM: nullable(nombre(LIMITS_MESURES_DOCTORALS.alcadaM.minim, LIMITS_MESURES_DOCTORALS.alcadaM.maxim)),
  diametreCapcadaM: nullable(nombre(LIMITS_MESURES_DOCTORALS.diametreCapcadaM.minim, LIMITS_MESURES_DOCTORALS.diametreCapcadaM.maxim)),
  perimetreNormalCm: nullable(nombre(LIMITS_MESURES_DOCTORALS.perimetreNormalCm.minim, LIMITS_MESURES_DOCTORALS.perimetreNormalCm.maxim)),
  perimetreBasalCm: nullable(nombre(LIMITS_MESURES_DOCTORALS.perimetreBasalCm.minim, LIMITS_MESURES_DOCTORALS.perimetreBasalCm.maxim)),
  diametreEquivalentCm: nullable(nombre(0, 40000)),
  peusMenys130m: nullable(enter(0, 100000)),
  edatEstimada: textCurt,
  anyNaixencaAprox: nullable(any),
  notaDendrometrica: nullable(text)
}, {
  exemplarsDelConjunt: nullable(enter(0, 100000))
});
const capturaUtm = valor => {
  const net = objecte(valor, {
    fus: enter(28, 38), x: nombre(100000, 900000), y: nombre(0, 9329005),
    altitudM: nullable(nombre(-500, 9000)), fontUtm: textObligatori, notaEdicio2020: nullable(text)
  });
  puntWgs84DesDUtmEtrs89(net);
  return net;
};
const capturaCadastre = valor => objecte(valor, {
  poligon: nullable(textCurt), parcella: nullable(textCurt), ambit: text
});
const capturaFotos = valor => objecte(valor, {
  foto2007: nullable(mitja), fotoDetall2007: nullable(mitja), foto2020: nullable(mitja),
  dataFoto2020: nullable(data), mapa: nullable(mitja)
});
const capturaPaginesFont = valor => objecte(valor, {
  cataleg2007: nullable(enter(1, 100000)), edicio2020: nullable(enter(1, 100000))
});
const capturaDocumentFont = valor => objecte(valor, {
  cami: nullable(v => text(v, 2048)),
  sha256: nullable(valorSha => {
    const net = text(valorSha, 64);
    if (!/^[a-f0-9]{64}$/u.test(net)) invalid();
    return net;
  }),
  estat: textObligatori
});
const capturaFont = valor => objecte(valor, {
  id: slug, titol: textObligatori, municipi: textObligatori,
  dataInspeccioBase: nullable(data), dataAcordPlenari: nullable(data),
  registreEixidaAlcaldia: nullable(text), anyEdicioRevisada: nullable(any),
  autoriaTecnica: textObligatori, entitatPromotora: textObligatori,
  marcNormatiu: v => llista(v, textObligatori, 20), llicencia: textObligatori
}, {
  documentFont: capturaDocumentFont, llicenciaAcreditadaPer: nullable(text)
});
const capturaVerificacioTaxonomica = valor => objecte(valor, {
  nomAcceptat: textObligatori, familia: nullable(textCurt), ordre: nullable(textCurt),
  sistema: nullable(textCurt), font: url, data: data, determinador: textObligatori
});
const capturaBioclima = valor => objecte(valor, {
  termotip: textObligatori, ombrotip: textObligatori, periode: textObligatori,
  estacio: textObligatori, font: url
});
const capturaGranada = valor => objecte(valor, {
  data: data, tecnic: textObligatori, edicio: textCurt, valorEUR: nombre(0, 1e12),
  metode: textObligatori, font: textObligatori
});
const capturaVta = valor => objecte(valor, {
  data: data, observador: textObligatori, cavitats: text, risc: textObligatori,
  mesures: text, metode: textObligatori, font: textObligatori
});
const capturaFontOral = valor => objecte(valor, {
  testimoni: textObligatori, recollitPer: textObligatori, data: data, referencia: textObligatori
});
const capturaConservacio = valor => objecte(valor, {
  estatSalut: text, amenaces: nullable(text), mesuresPropostes: nullable(text)
});
const capturaArbre = valor => objecte(valor, {
  ordre: enter(1, 100000), id: slug, nom: textObligatori, especieCientifica: textObligatori,
  nomComu: textObligatori, categoria: textCurt, monumental: boolea, paratge: text,
  propietari: nullable(text), titularitatCief: text, accesLliure: boolea, orientacio: text,
  pendent: text, sol: nullable(text), comunitatVegetal: nullable(text), descripcio: text, acces: text,
  valorCulturalHistoric: text, observacions: text, utmEtrs89: nullable(capturaUtm),
  cadastre: nullable(capturaCadastre), dimensions2007: capturaDimensions,
  conservacio2007: capturaConservacio, fotos: capturaFotos, enllacOriginal2007: nullable(url)
}, {
  paginesFont: capturaPaginesFont
});

/** La font és part de la identitat, amb compatibilitat del primer catàleg. */
export function slugRevisionsDoctoralsArbre(arbreId, fontId = ID_FONT_LA_TORRE) {
  const id = slug(arbreId);
  const font = slug(fontId);
  return font === ID_FONT_LA_TORRE ? id
    : 'arbre-' + sha256Hex(JSON.stringify([ESQUEMA_DOCTORAL_ARBRES, font, id]));
}

function capturaRevisions(input, idArbre) {
  const revisions = llista(input, valor => capturaEdicioRevisioPatrimoni(valor, 1), MAX_REVISIONS);
  const anys = new Set();
  const ids = new Set();
  for (const revisio of revisions) {
    if (revisio.entitatTipus !== 'arbre' || revisio.entitatSlug !== idArbre
      || anys.has(revisio.campanyaAny) || ids.has(revisio.id)) invalid();
    anys.add(revisio.campanyaAny);
    ids.add(revisio.id);
  }
  return Object.freeze([...revisions].sort((a, b) => b.campanyaAny - a.campanyaAny));
}

/** Captura completa i immutable del perfil d'intercanvi del projecte. */
export function validaFitxaDoctoralArbre(input) {
  const fitxa = objecte(input, {
    id: slug, nom: textObligatori, ordre: enter(1, 100000),
    taxonomia: valor => objecte(valor, {
      nomCientific: textObligatori, nomComu: textObligatori,
      verificacio: nullable(capturaVerificacioTaxonomica)
    }),
    georeferenciacio: valor => objecte(valor, {
      municipi: textObligatori, paratge: text, utmEtrs89: nullable(capturaUtm),
      bioclima: nullable(capturaBioclima), cadastre: nullable(capturaCadastre),
      orientacio: text, pendent: text, sol: nullable(text), comunitatVegetal: nullable(text)
    }),
    biometria: valor => objecte(valor, {
      base: v => objecte(v, { data: nullable(data), dimensions: capturaDimensions }),
      normaGranada: nullable(capturaGranada), revisions: v => llista(v, r => capturaEdicioRevisioPatrimoni(r, 1), MAX_REVISIONS)
    }),
    avaluacio: valor => objecte(valor, {
      descripcio: text, observacions: text, estatSalut: text, amenaces: nullable(text),
      mesuresPropostes: nullable(text), vta: nullable(capturaVta)
    }),
    proteccio: valor => objecte(valor, {
      categoria: textCurt, monumental: boolea, propietari: nullable(text),
      titularitatCief: text, accesLliure: boolea, acces: text,
      marcNormatiu: v => llista(v, textObligatori, 20)
    }),
    memoria: valor => objecte(valor, {
      valorCulturalHistoric: text, fontOral: nullable(capturaFontOral)
    }),
    documentacio: valor => objecte(valor, { fotos: capturaFotos, urlOriginal: nullable(url) }, {
      paginesFont: capturaPaginesFont
    }),
    font: capturaFont
  });
  const revisions = capturaRevisions(fitxa.biometria.revisions, slugRevisionsDoctoralsArbre(fitxa.id, fitxa.font.id));
  if (fitxa.georeferenciacio.municipi !== fitxa.font.municipi
    || fitxa.biometria.base.data !== fitxa.font.dataInspeccioBase) invalid();
  return Object.freeze({
    ...fitxa,
    biometria: Object.freeze({ ...fitxa.biometria, revisions })
  });
}

function fontPerDefecte() {
  return {
    id: ID_FONT_LA_TORRE,
    titol: FONT_CATALEG_ARBRES_2020.titol,
    municipi: FONT_CATALEG_ARBRES_2020.municipi,
    dataInspeccioBase: FONT_CATALEG_ARBRES_2020.dataInspeccioBase,
    dataAcordPlenari: FONT_CATALEG_ARBRES_2020.dataAcordPlenari,
    registreEixidaAlcaldia: FONT_CATALEG_ARBRES_2020.registreEixidaAlcaldia,
    anyEdicioRevisada: FONT_CATALEG_ARBRES_2020.anyEdicioRevisada,
    autoriaTecnica: FONT_CATALEG_ARBRES_2020.autoriaTecnica,
    entitatPromotora: FONT_CATALEG_ARBRES_2020.entitatPromotora,
    marcNormatiu: FONT_CATALEG_ARBRES_2020.marcNormatiu,
    llicencia: FONT_CATALEG_ARBRES_2020.llicencia,
    ...Object.fromEntries(['documentFont', 'llicenciaAcreditadaPer']
      .filter(camp => Object.hasOwn(FONT_CATALEG_ARBRES_2020, camp))
      .map(camp => [camp, FONT_CATALEG_ARBRES_2020[camp]]))
  };
}

/** El catàleg aporta text i cotes. Una comprovació acadèmica nova exigix font. */
export function creaFitxaDoctoralArbre(arbre, opcions = {}) {
  const descriptors = Object.getOwnPropertyDescriptors(opcions);
  const admeses = ['font', 'revisions', 'verificacioTaxonomica', 'bioclima', 'valoracioGranada', 'avaluacioVta', 'fontOral'];
  if (![Object.prototype, null].includes(Object.getPrototypeOf(opcions))
    || Reflect.ownKeys(descriptors).some(k => !admeses.includes(k) || !Object.hasOwn(descriptors[k], 'value'))) invalid();
  const font = capturaFont(opcions.font === undefined ? fontPerDefecte() : opcions.font);
  const exemplar = capturaArbre(arbre);
  const conservacio = exemplar.conservacio2007;
  return validaFitxaDoctoralArbre({
    id: exemplar.id, nom: exemplar.nom, ordre: exemplar.ordre,
    taxonomia: {
      nomCientific: exemplar.especieCientifica, nomComu: exemplar.nomComu,
      verificacio: opcions.verificacioTaxonomica ?? null
    },
    georeferenciacio: {
      municipi: font.municipi, paratge: exemplar.paratge, utmEtrs89: exemplar.utmEtrs89,
      bioclima: opcions.bioclima ?? null, cadastre: exemplar.cadastre,
      orientacio: exemplar.orientacio, pendent: exemplar.pendent, sol: exemplar.sol,
      comunitatVegetal: exemplar.comunitatVegetal
    },
    biometria: {
      base: { data: font.dataInspeccioBase, dimensions: exemplar.dimensions2007 },
      normaGranada: opcions.valoracioGranada ?? null, revisions: opcions.revisions ?? []
    },
    avaluacio: {
      descripcio: exemplar.descripcio, observacions: exemplar.observacions,
      estatSalut: conservacio.estatSalut, amenaces: conservacio.amenaces,
      mesuresPropostes: conservacio.mesuresPropostes, vta: opcions.avaluacioVta ?? null
    },
    proteccio: {
      categoria: exemplar.categoria, monumental: exemplar.monumental, propietari: exemplar.propietari,
      titularitatCief: exemplar.titularitatCief, accesLliure: exemplar.accesLliure, acces: exemplar.acces,
      marcNormatiu: font.marcNormatiu
    },
    memoria: { valorCulturalHistoric: exemplar.valorCulturalHistoric, fontOral: opcions.fontOral ?? null },
    documentacio: {
      fotos: exemplar.fotos, urlOriginal: exemplar.enllacOriginal2007,
      ...(Object.hasOwn(exemplar, 'paginesFont') ? { paginesFont: exemplar.paginesFont } : {})
    },
    font
  });
}

const COTES_DELTA = Object.freeze([
  ['alcadaM', 'm'], ['diametreCapcadaM', 'm'], ['perimetreNormalCm', 'cm'], ['perimetreBasalCm', 'cm']
]);

/** Diferències entre cotes registrades de dos anys, amb les unitats originals. */
export function calculaDeltaBiometricArbre(input) {
  const fitxa = validaFitxaDoctoralArbre(input);
  const base = fitxa.biometria.base;
  const serie = [];
  if (base.data) serie.push({ any: Number(base.data.slice(0, 4)), mesures: base.dimensions });
  for (const revisio of [...fitxa.biometria.revisions].reverse()) {
    serie.push({ any: revisio.campanyaAny, mesures: revisio.mesures });
  }
  const diferencies = [];
  for (const [camp, unitat] of COTES_DELTA) {
    const anys = new Map();
    for (const punt of serie) {
      const valor = punt.mesures[camp];
      if (esMesuraDendrometricaValida(camp, valor)) anys.set(punt.any, valor);
    }
    const cotes = [...anys].sort(([a], [b]) => a - b);
    if (cotes.length < 2) continue;
    const [anyInicial, inicial] = cotes[0];
    const [anyFinal, final] = cotes[cotes.length - 1];
    diferencies.push(Object.freeze({ camp, unitat, anyInicial, anyFinal, inicial, final,
      delta: Number((final - inicial).toPrecision(12)) }));
  }
  return Object.freeze(diferencies);
}

const CONTEXT_JSONLD = Object.freeze({
  sdp: NAMESPACE,
  dwc: 'http://rs.tdwg.org/dwc/terms/',
  dcterms: 'http://purl.org/dc/terms/',
  fitxa: Object.freeze({ '@id': NAMESPACE + 'fitxa', '@type': '@json' })
});
const CAPCALERA_DWC = Object.freeze([
  'occurrenceID', 'basisOfRecord', 'scientificName', 'vernacularName', 'eventDate',
  'recordedBy', 'locality', 'decimalLongitude', 'decimalLatitude', 'geodeticDatum',
  'coordinateUncertaintyInMeters', 'georeferenceRemarks', 'verbatimElevation',
  'license', 'sdp:dendrologia'
]);
const NOTA_PROJECCIO = 'Inversa UTM sobre GRS80 i aproximació ETRS89 → WGS84 EPSG:1149. Incertesa de la presa de dades pendent de documentació.';

function idOccurrence(fitxa) {
  return 'urn:sdp:arbre:' + fitxa.font.id + ':' + fitxa.id;
}

function llistaFitxes(input) {
  let bytes = 0;
  const fitxes = llista(input, valor => {
    const fitxa = validaFitxaDoctoralArbre(valor);
    bytes += new TextEncoder().encode(JSON.stringify(fitxa)).byteLength;
    if (bytes > LIMIT_BYTES_FITXES_DOCTORALS) invalid();
    return fitxa;
  }, MAX_FITXES);
  const ids = new Set();
  for (const fitxa of fitxes) {
    const id = idOccurrence(fitxa);
    if (ids.has(id)) invalid();
    ids.add(id);
  }
  return fitxes;
}

function projeccioDwc(fitxa) {
  const utm = fitxa.georeferenciacio.utmEtrs89;
  const punt = puntWgs84DesDUtmEtrs89(utm);
  const altitud = utm?.altitudM;
  return {
    occurrenceID: idOccurrence(fitxa),
    basisOfRecord: 'HumanObservation',
    scientificName: fitxa.taxonomia.nomCientific,
    vernacularName: fitxa.taxonomia.nomComu,
    eventDate: fitxa.biometria.base.data ?? '',
    recordedBy: fitxa.font.autoriaTecnica,
    locality: fitxa.georeferenciacio.municipi + ' · ' + fitxa.georeferenciacio.paratge,
    decimalLongitude: punt?.[0] ?? '',
    decimalLatitude: punt?.[1] ?? '',
    geodeticDatum: punt ? 'WGS84' : '',
    coordinateUncertaintyInMeters: '',
    georeferenceRemarks: punt ? NOTA_PROJECCIO : '',
    verbatimElevation: altitud === null || altitud === undefined ? '' : String(altitud) + ' m',
    license: fitxa.font.llicencia
  };
}

function elementJsonld(fitxa) {
  const projeccio = projeccioDwc(fitxa);
  const element = { '@id': idOccurrence(fitxa), '@type': 'dwc:Occurrence' };
  for (const [clau, valor] of Object.entries(projeccio)) {
    if (valor !== '') element[(clau === 'license' ? 'dcterms:' : 'dwc:') + clau] = valor;
  }
  element.fitxa = fitxa;
  return element;
}

function geometria(fitxa) {
  const punt = puntWgs84DesDUtmEtrs89(fitxa.georeferenciacio.utmEtrs89);
  // La cota del catàleg no especifica datum vertical el·lipsoidal.
  return punt ? { type: 'Point', coordinates: punt } : null;
}

function feature(fitxa) {
  const geometry = geometria(fitxa);
  return {
    type: 'Feature', id: idOccurrence(fitxa), geometry,
    properties: { esquema: ESQUEMA_DOCTORAL_ARBRES, georeferenceRemarks: geometry ? NOTA_PROJECCIO : '', fitxa }
  };
}

function capturaTextFitxer(input) {
  if (typeof input !== 'string' || input.length > LIMIT_BYTES_FITXES_DOCTORALS
    || new TextEncoder().encode(input).byteLength > LIMIT_BYTES_FITXES_DOCTORALS) invalid();
  return input.startsWith('\uFEFF') ? input.slice(1) : input;
}

function jsonDe(input) {
  try { return JSON.parse(input); } catch { invalid(); }
}

function equivalencia(actual, esperat) {
  if (esperat === null || typeof esperat !== 'object') {
    if (actual !== esperat) invalid();
    return;
  }
  if (actual === null || typeof actual !== 'object') invalid();
  if (Array.isArray(esperat)) {
    const net = llista(actual, valor => valor, esperat.length);
    if (net.length !== esperat.length) invalid();
    net.forEach((valor, index) => equivalencia(valor, esperat[index]));
    return;
  }
  const camps = Object.fromEntries(Object.entries(esperat).map(([clau, valor]) => [
    clau, candidat => { equivalencia(candidat, valor); return candidat; }
  ]));
  objecte(actual, camps);
}

function importaJsonld(input) {
  const paquet = objecte(jsonDe(input), {
    '@context': valor => { equivalencia(valor, CONTEXT_JSONLD); return valor; },
    esquema: valor => { if (valor !== ESQUEMA_DOCTORAL_ARBRES) invalid(); return valor; },
    '@graph': valor => llista(valor, element => {
      const descriptor = Object.getOwnPropertyDescriptor(element, 'fitxa');
      if (!descriptor || !Object.hasOwn(descriptor, 'value')) invalid();
      const fitxa = validaFitxaDoctoralArbre(descriptor.value);
      equivalencia(element, elementJsonld(fitxa));
      return fitxa;
    }, MAX_FITXES)
  });
  return llistaFitxes(paquet['@graph']);
}

function importaGeojson(input) {
  const paquet = objecte(jsonDe(input), {
    type: valor => { if (valor !== 'FeatureCollection') invalid(); return valor; },
    esquema: valor => { if (valor !== ESQUEMA_DOCTORAL_ARBRES) invalid(); return valor; },
    features: valor => llista(valor, element => {
      const propietats = Object.getOwnPropertyDescriptor(element, 'properties');
      if (!propietats || !Object.hasOwn(propietats, 'value')) invalid();
      const registre = Object.getOwnPropertyDescriptor(propietats.value, 'fitxa');
      if (!registre || !Object.hasOwn(registre, 'value')) invalid();
      const fitxa = validaFitxaDoctoralArbre(registre.value);
      equivalencia(element, feature(fitxa));
      return fitxa;
    }, MAX_FITXES)
  });
  return llistaFitxes(paquet.features);
}

function filaDwc(fitxa) {
  const camps = projeccioDwc(fitxa);
  return [...Object.values(camps), JSON.stringify(fitxa)];
}

function importaCsv(input) {
  const files = lligCsvDoctoral(input, MAX_FITXES + 1, CAPCALERA_DWC.length);
  if (!files.length) invalid();
  equivalencia(files[0], CAPCALERA_DWC);
  const fitxes = files.slice(1).map(fila => {
    if (fila.length !== CAPCALERA_DWC.length) invalid();
    const fitxa = validaFitxaDoctoralArbre(jsonDe(fila[fila.length - 1]));
    const esperada = filaDwc(fitxa).map(textDeCelaDoctoral);
    equivalencia(fila, esperada);
    return fitxa;
  });
  return llistaFitxes(fitxes);
}

function escapaBibtex(valor) {
  const canvis = {
    '\\': '\\textbackslash{}', '{': '\\{', '}': '\\}', '%': '\\%', '&': '\\&',
    '#': '\\#', '_': '\\_', '$': '\\$', '~': '\\textasciitilde{}', '^': '\\textasciicircum{}'
  };
  return [...valor].map(caracter => canvis[caracter] ?? (caracter === '\n' || caracter === '\r' ? ' ' : caracter)).join('');
}

function bibtex(fitxes) {
  return fitxes.map(fitxa => {
    const autors = [fitxa.font.autoriaTecnica, fitxa.font.entitatPromotora]
      .map(autor => '{' + escapaBibtex(autor) + '}').join(' and ');
    const camps = [
      ['title', fitxa.nom + ' — ' + fitxa.font.titol],
      ['year', fitxa.font.anyEdicioRevisada === null ? '' : String(fitxa.font.anyEdicioRevisada)],
      ['url', fitxa.documentacio.urlOriginal ?? ''],
      ['note', fitxa.font.llicencia + ' · Perfil ' + ESQUEMA_DOCTORAL_ARBRES]
    ].filter(([, valor]) => valor !== '');
    return '@misc{sdp-' + fitxa.font.id + '-' + fitxa.id + ',\n'
      + '  author = {' + autors + '},\n'
      + camps.map(([clau, valor]) => '  ' + clau + ' = {' + escapaBibtex(valor) + '}').join(',\n')
      + '\n}';
  }).join('\n\n') + '\n';
}

function datacite(fitxes) {
  return {
    schemaVersion: 'http://datacite.org/schema/kernel-4',
    estat: 'esborrany',
    recursos: fitxes.map(fitxa => ({
      creators: [{ name: fitxa.font.autoriaTecnica }, { name: fitxa.font.entitatPromotora, nameType: 'Organizational' }],
      titles: [{ title: fitxa.nom + ' — ' + fitxa.font.titol }],
      publisher: fitxa.font.entitatPromotora,
      publicationYear: fitxa.font.anyEdicioRevisada,
      types: { resourceTypeGeneral: 'Dataset', resourceType: ESQUEMA_DOCTORAL_ARBRES },
      alternateIdentifiers: [{ alternateIdentifier: idOccurrence(fitxa), alternateIdentifierType: 'URN' }],
      relatedIdentifiers: fitxa.documentacio.urlOriginal
        ? [{ relatedIdentifier: fitxa.documentacio.urlOriginal, relatedIdentifierType: 'URL', relationType: 'IsDerivedFrom' }]
        : [],
      rightsList: [{ rights: fitxa.font.llicencia }],
      descriptions: [{ descriptionType: 'Abstract', description: fitxa.avaluacio.descripcio }]
    }))
  };
}

/**
 * Els tres primers formats són un perfil reversible. La citació es genera
 * com a metadades bibliogràfiques. DataCite queda en esborrany, sense DOI.
 */
export function exportaFitxesDoctoralsArbres(input, format = 'jsonld') {
  const fitxes = llistaFitxes(input);
  let eixida;
  switch (format) {
    case 'jsonld':
      eixida = JSON.stringify({ '@context': CONTEXT_JSONLD, esquema: ESQUEMA_DOCTORAL_ARBRES,
        '@graph': fitxes.map(elementJsonld) }, null, 2) + '\n';
      break;
    case 'csv':
      eixida = escriuCsvDoctoral([CAPCALERA_DWC, ...fitxes.map(filaDwc)]);
      break;
    case 'geojson':
      eixida = JSON.stringify({ type: 'FeatureCollection', esquema: ESQUEMA_DOCTORAL_ARBRES,
        features: fitxes.map(feature) }, null, 2) + '\n';
      break;
    case 'bibtex':
      eixida = bibtex(fitxes);
      break;
    case 'datacite':
      eixida = JSON.stringify(datacite(fitxes), null, 2) + '\n';
      break;
    default:
      throw new TypeError('Format d’exportació doctoral desconegut.');
  }
  return capturaTextFitxer(eixida);
}

export function importaFitxesDoctoralsArbres(input, format = 'jsonld') {
  const text = capturaTextFitxer(input);
  switch (format) {
    case 'jsonld': return importaJsonld(text);
    case 'csv': return importaCsv(text);
    case 'geojson': return importaGeojson(text);
    default: throw new TypeError('La importació doctoral admet JSON-LD, Darwin Core CSV i GeoJSON.');
  }
}
