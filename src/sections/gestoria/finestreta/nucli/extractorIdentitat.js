/**
 * extractorIdentitat.js — de text d'un paper a PROPOSTES de camps de la
 * Fitxa d'identitat. Mai a la fitxa directament: la persona les revisa.
 *
 * Ordre del Mestre, 13-10-2026 (pla 261013_1405, front H). Mètode, en
 * receptes que són dades ({ tipus, camp, etiquetes, finestra, valor,
 * normalitza, confianca }):
 *   1. Cada etiqueta es busca en el text plegat (minúscules, sense accents).
 *   2. En la finestra de darrere (80 caràcters) es pren el PRIMER valor que
 *      té la forma i passa el validador del camp. El valor es copia de
 *      l'original, amb la Ñ i els accents.
 *   3. Sense etiqueta no hi ha proposta (falla tancat): cap número solt es
 *      pren per un DNI o un NAF.
 * Guardes:
 *   · Si el text porta dades de salut (teSalut), el document sencer no dona
 *     res: ni un sol camp.
 *   · Cap IBAN, compte de 20 xifres ni codi segur de verificació (CSV) es
 *     proposa mai: els seus trams es bloquegen abans de buscar, i la fitxa no
 *     té camp on posar-los.
 *   · El NIF de la persona exigix DNI o NIE: el CIF de l'organisme (SUMA,
 *     Red.es, l'agent digitalitzador) no hi entra mai.
 *   · L'eixida no porta mai text ni bytes del document: només el valor, la
 *     regla que l'ha trobat, la confiança i la font (ruta i sha256).
 * Les etiquetes són heurístiques: [A VERIFICAR en local amb els PDF del
 * Mestre, sense copiar-ne cap valor al codi ni a les proves].
 * JS pur: sense DOM, React, xarxa ni emmagatzematge.
 */
import { parseImport } from '../../nucli/diners.js';
import { normalitzaNif } from '../../nucli/nif.js';
import { dataDelNom, TIPUS_DOCUMENT_IDENTITAT } from './filtreDocuments.js';
import { CAMPS_IDENTITAT, congela, normalitzaIpf, plegaAlineat, plegaText, validaCamp } from './validadorsIdentitat.js';

const FINESTRA = 80;
const SHA256 = /^[0-9a-f]{64}$/i;
export const CONFIANCES = Object.freeze(['alta', 'mitjana', 'baixa']);

/* Una etiqueta: l'expressió en text plegat, on un espai val per qualsevol
   blanc. Davant i darrere, cap lletra ni xifra: «naf» no casa dins d'una paraula. */
const et = (...fonts) => Object.freeze(fonts.map((font) => new RegExp(`(?:^|[^a-z0-9])(?:${font.replace(/ /g, '\\s+')})(?![a-z0-9])`, 'g')));

/* Les formes dels valors, sobre el text plegat. El grup 1 és el valor i va
   sempre al final de la coincidència (la vora d'abans es consumix: sense
   mirada arrere, que Safari 16.0 no coneix). */
const V = Object.freeze({
  nifPersona: /(?:^|[^a-z0-9])((?:[xyz][\s.-]?)?\d(?:[\s.-]?\d){6,9}[\s.-]?[a-z])(?![a-z0-9])/g,
  nifEntitat: /(?:^|[^a-z0-9])([abcdefghjnpqrsuvw][\s.-]?\d{2}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?[0-9a-j])(?![a-z0-9])/g,
  naf: /(?:^|\D)(\d{2}[\s/-]?\d{8}[\s/-]?\d{2})(?!\d)/g,
  data: /(?:^|\D)(\d{1,2}[/.-]\d{1,2}[/.-]\d{4}|\d{1,2}\s+(?:de\s+)?[a-z]{3,10}\.?\s+(?:del?\s+)?\d{4})(?!\d)/g,
  codiPostal: /(?:^|\D)(\d{5})(?!\d)/g,
  cadastral: /(?:^|[^a-z0-9])([0-9a-z]{7}\s?[0-9a-z]{7}\s?[0-9a-z]{4}\s?[a-z]{2})(?![a-z0-9])/g,
  token: /(?:^|[^a-z0-9])([a-z0-9]+(?:[/.-][a-z0-9]+){0,5})(?![a-z0-9])/g,
  paraula: /(?:^|[^a-z0-9])([a-z0-9]+)(?![a-z0-9])/g,
  diners: /(?:^|[^\d.,])(\d{1,3}(?:\.\d{3})+,\d{2}|\d+,\d{2})(?![\d,])/g,
  cnae: /(?:^|[^\d.])(\d{2}\.?\d{2})(?!\d|\.\d)/g,
  epigraf: /(?:^|[^\d.])(\d{1,4}(?:\.\d{1,2})?)(?!\d|\.\d)/g,
  concepte: /(?:^|[^a-z])(bienes inmuebles[a-z\s]{0,30}?(?:urbana|rustica)|ibi[\s.-]*(?:de\s+)?(?:naturaleza\s+)?(?:urbana|rustica)|ivtm|vehiculos de traccion mecanica|iae|actividades economicas|tasa|taxa)(?![a-z])/g,
  carrec: /(?:^|[^a-z])(vicepresident[ae]?|president[ae]?|secretari[ao]?|tesorer[ao]|tresorer[a]?|vocal|apoderad[oa]|apoderat)(?![a-z])/g
});

/* Els trams que no es proposen mai: IBAN, compte antic de 20 xifres i el que
   ve darrere d'una etiqueta de codi segur de verificació. */
const IBAN = /(?:^|[^a-z0-9])([a-z]{2}\d{2}(?:[\s-]?[a-z0-9]{4}){3,7}(?:[\s-]?[a-z0-9]{1,3})?)/g;
const COMPTE = /(?:^|\D)(\d{4}[\s-]?\d{4}[\s-]?\d{2}[\s-]?\d{10})(?!\d)/g;
const ETIQUETA_CSV = /codigo seguro de verificacion|codi segur de verificacio|codigo de verificacion|(?:^|[^a-z])c\.?s\.?v(?![a-z])/g;
const VERIFICACIO = /codigo seguro de verificacion|codi segur de verificacio|codigo de verificacion|(?:^|[^a-z])c\.?s\.?v(?![a-z])/;

/* Senyals de dades de salut de la persona (no la cobertura d'un règim: una
   resolució del RETA parla d'incapacitat temporal i de malaltia professional
   com a cobertures, i això no és cap dada de salut). Revisió adversarial
   13-10-2026, troballa ID-F8: també en valencià (part de baixa, part mèdic,
   informe mèdic, procés i prestació d'incapacitat temporal, pagament directe,
   grau de minusvalidesa). «Incapacitat temporal» sola continua sense ser cap
   senyal: és la cobertura del RETA. */
const SALUT = /parte medico|parte de baja|parte de confirmacion|baja medica|baixa medica|alta medica|informe medico|historia clinica|diagnostic|grado de discapacidad|grau de discapacitat|grado de minusvalia|pago directo|proceso de incapacidad temporal|prestacion (?:economica )?por incapacidad temporal|(?:^|[^a-z])part (?:medic )?de (?:baixa|alta|confirmacio)|(?:^|[^a-z])part medic|informe medic|proces d.incapacitat temporal|prestacio (?:economica )?(?:per |d.)incapacitat temporal|pagament directe|grau de minusvalidesa/;

/** Cert si el text porta dades de salut: el document sencer no proposa res.
    Els blancs seguits (un salt de línia del PDF enmig d'«informe mèdic») valen per un espai. */
export const teSalut = (text) => SALUT.test(plegaText(text).replace(/\s+/g, ' '));

/** Cert si el text porta un codi segur de verificació (el valor no es proposa mai). */
export const teCodiVerificacio = (text) => VERIFICACIO.test(plegaText(text));

/* ---------- Normalitzadors i descomposicions ---------- */

const PARTICULES = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'i', 'san', 'santa', 'da', 'dos', 'van', 'von']);

/* «COGNOM1 COGNOM2, NOM»: les partícules (de, del, la…) van amb el cognom que
   les seguix. Un o dos cognoms; si n'ixen més, o no hi ha la coma, res. */
function descomponNom(tros) {
  const parts = tros.split(',');
  if (parts.length !== 2) return null;
  const nom = parts[1].replace(/\s+/g, ' ').trim();
  const grups = [];
  let pendent = [];
  for (const paraula of parts[0].trim().split(/\s+/)) {
    pendent.push(paraula);
    if (!PARTICULES.has(plegaText(paraula))) {
      grups.push(pendent.join(' '));
      pendent = [];
    }
  }
  if (nom === '' || pendent.length || grups.length < 1 || grups.length > 2 || grups.includes('')) return null;
  return { 'identificacio.nom': nom, 'identificacio.cognom1': grups[0], 'identificacio.cognom2': grups[1] ?? null };
}

/* Els tipus de via, amb l'abreviatura canònica que es guarda. */
const TIPUS_VIA = Object.freeze([
  ['CL', ['c/', 'c', 'cl', 'calle', 'carrer']], ['AV', ['av', 'avda', 'avenida', 'avinguda']], ['PZ', ['pl', 'pz', 'plaza', 'placa']],
  ['CM', ['cm', 'camino', 'cami']], ['PD', ['pd', 'pda', 'ptda', 'partida']], ['PS', ['ps', 'paseo', 'passeig']],
  ['CR', ['ctra', 'carretera']], ['UR', ['urb', 'urbanizacion', 'urbanitzacio']], ['TR', ['travesia', 'travessera']], ['RD', ['ronda']]
]);
const CANONIC_VIA = new Map(TIPUS_VIA.flatMap(([canonic, formes]) => formes.map((forma) => [forma, canonic])));
const FORMES_VIA = [...CANONIC_VIA.keys()].sort((a, b) => b.length - a.length).map((f) => f.replace('/', '\\/')).join('|');
/* Revisió adversarial 13-10-2026, troballa ID-F7: una via que comença per un
   número és una data («9 d'Octubre», «25 de Abril», «1 de Maig»): la xifra,
   la partícula (opcional) i el mes, en valencià o en castellà. */
const MESOS = 'gener|febrer|marc|abril|maig|juny|juliol|agost|setembre|octubre|novembre|desembre|enero|febrero|marzo|mayo|junio|julio|agosto|septiembre|setiembre|noviembre|diciembre';
const VIA_DATA = `\\d{1,2}\\s+(?:de\\s+|d['’]\\s*|d\\s+)?(?:${MESOS})(?![a-z])`;
const PARTS_ADRECA = new RegExp(`^(?:(${FORMES_VIA})\\.?\\s+)?(${VIA_DATA}|[a-z][a-z'’·\\s.-]*?)[\\s,]+(?:n[.º]?\\s*)?(\\d{1,5}[a-z]?|s\\s?\\/?\\s?n)(?![a-z0-9])[\\s,]*(.*)$`, 'd');
/* El complement només si té la forma d'un pis, una porta o una escala; el que
   ve darrere d'un codi postal ja no és de l'adreça. Revisió adversarial
   13-10-2026, troballa ID-F3: una paraula clau o una lletra sola només valen
   si no les seguix cap altra lletra; una paraula qualsevol (el municipi de la
   mateixa línia) ja no hi passa lletra a lletra. */
const COMPLEMENT = /^(?:(?:(?:esc|escalera|escala|bl|bloque|bloc|pis|piso|planta|pta|puerta|porta|portal|izq|izqda|izda|dcha|drcha|dch|esq|esquerra|dreta|bj|bajo|baix|baixos|atico|atic)(?![a-z])|\d{1,3}\s*[ºª]?|[a-z](?![a-z]))[\s.,ºª-]*)+$/;

/* «CL MAJOR, 5 2º B» en tipus de via, via, número i complement. Si la línia
   no té esta forma, res: una adreça mal partida és pitjor que cap. */
function descomponAdreca(tros, plegat) {
  const m = PARTS_ADRECA.exec(plegat);
  if (!m) return null;
  const [, tipus, viaPlegada, numero] = m;
  /* Revisió adversarial 13-10-2026, troballa ID-F7: sense tipus de via, ni una via que comença per una xifra
     ni una via que és només un tipus de via («CL 3 CREUS 5» partit com a via «CL», número «3»): falla tancat. */
  const nomVia = viaPlegada.trim().replace(/\.$/, '');
  if (!tipus && (/^\d/.test(nomVia) || CANONIC_VIA.has(nomVia))) return null;
  const via = tros.slice(m.indices[2][0], m.indices[2][1]).trim();
  let resta = tros.slice(m.indices[4][0], m.indices[4][1]);
  const cp = /(?:^|\s)\d{5}(?:\s|$)/.exec(resta);
  if (cp) resta = resta.slice(0, cp.index);
  resta = resta.replace(/[\s,]+$/, '').trim();
  const complement = resta !== '' && COMPLEMENT.test(plegaText(resta)) ? resta : null;
  return {
    'domicili.tipusVia': tipus ? CANONIC_VIA.get(tipus) : null,
    'domicili.via': via,
    'domicili.numero': numero.toUpperCase(),
    'domicili.complement': complement
  };
}

/* «03837 LA TORRE DE LES MAÇANES (ALACANT)» → el nom del municipi. */
const municipiDe = (tros) => tros.replace(/^\d{5}[\s,-]*/, '').replace(/\s*\([^)]*\)\s*$/, '').trim();

function concepteDe(text) {
  const t = plegaText(text);
  if (/rustica/.test(t)) return 'IBI-rustica';
  if (/urbana/.test(t)) return 'IBI-urbana';
  if (/ivtm|vehiculos/.test(t)) return 'IVTM';
  if (/iae|actividades/.test(t)) return 'IAE';
  if (/tasa|taxa/.test(t)) return 'taxa';
  return null;
}

function carrecDe(text) {
  const t = plegaText(text);
  if (t.startsWith('vice')) return 'vicepresident';
  if (t.startsWith('president')) return 'president';
  if (t.startsWith('secretari')) return 'secretari';
  if (t.startsWith('tesorer') || t.startsWith('tresorer')) return 'tresorer';
  if (t === 'vocal') return 'vocal';
  return t.startsWith('apodera') ? 'apoderat' : null;
}

const tal = (text) => text;
const majuscules = (text) => text.toUpperCase();

/* ---------- Les receptes ---------- */

const SEGURETAT_SOCIAL = ['vida-laboral', 'resolucio-afiliacio', 'reta', 'informe-bases'];
const ENTITAT = ['registre-associacions', 'estatuts', 'certificat-representacio'];

/* `confianca` és un text o un mapa per tipus de document amb '*' per a la resta. */
const recepta = (id, { tipus, camp, etiquetes, valor = null, normalitza = tal, confianca = 'mitjana', finestra = FINESTRA, mode = 'finestra', descompon = null, constant = null }) => Object.freeze({
  id, tipus: Object.freeze(tipus), camp, etiquetes, valor, normalitza, confianca, finestra, mode, descompon, constant
});

export const RECEPTES = Object.freeze([
  recepta('nif-persona', {
    tipus: [...SEGURETAT_SOCIAL, 'suma', 'kit-digital', 'certificat-representacio', 'desconegut'], camp: 'identificacio.nif',
    etiquetes: et('d\\.?\\s*n\\.?\\s*i', 'n\\.?\\s*i\\.?\\s*f', 'n\\.?\\s*i\\.?\\s*e', 'documento (?:nacional )?de identi(?:dad|ficacion)', 'i\\.?\\s*p\\.?\\s*f', 'identificador de persona fisica'),
    valor: V.nifPersona, normalitza: normalitzaIpf, confianca: { '*': 'alta', 'certificat-representacio': 'baixa' }
  }),
  recepta('naf', {
    tipus: [...SEGURETAT_SOCIAL, 'desconegut'], camp: 'seguretatSocial.naf',
    etiquetes: et('numero de (?:la )?seguridad social', 'numero de afiliacion', 'num\\.? (?:de )?afiliacion', 'n\\.?\\s*[ºo°]\\.? (?:de )?afiliacion', 'n\\.?\\s*a\\.?\\s*f'),
    valor: V.naf, normalitza: (t) => t.replace(/[\s/-]/g, ''), confianca: { '*': 'mitjana', 'resolucio-afiliacio': 'alta' }
  }),
  recepta('nom-cognoms', {
    tipus: [...SEGURETAT_SOCIAL, 'suma', 'certificat-representacio'], camp: 'identificacio.nom', mode: 'linia',
    etiquetes: et('(?:nombre y )?apellidos(?:,? (?:y )?nombre)?', 'cognoms(?:,? (?:i )?nom)?', 'nom i cognoms', 'titular', 'sujeto pasivo'),
    descompon: descomponNom, confianca: { '*': 'mitjana', 'certificat-representacio': 'baixa' }
  }),
  recepta('data-naixement', {
    tipus: ['vida-laboral', 'resolucio-afiliacio'], camp: 'identificacio.dataNaixement',
    etiquetes: et('fecha de nacimiento', 'data de naixement'), valor: V.data
  }),
  recepta('domicili', {
    tipus: SEGURETAT_SOCIAL, camp: 'domicili.via', mode: 'linia',
    etiquetes: et('domicilio(?! (?:social|tributario|fiscal|del objeto))', 'domicili(?! (?:social|fiscal))'), descompon: descomponAdreca
  }),
  recepta('domicili-fiscal', {
    tipus: ['suma', 'kit-digital'], camp: 'domicili.via', mode: 'linia',
    etiquetes: et('domicilio fiscal', 'domicili fiscal'), descompon: descomponAdreca
  }),
  recepta('codi-postal', {
    tipus: [...SEGURETAT_SOCIAL, 'kit-digital'], camp: 'domicili.codiPostal',
    etiquetes: et('codigo postal', 'codi postal', 'c\\.?\\s*p'), valor: V.codiPostal
  }),
  recepta('municipi', {
    tipus: [...SEGURETAT_SOCIAL, 'kit-digital'], camp: 'domicili.municipi', mode: 'linia',
    etiquetes: et('localidad', 'municipio', 'municipi', 'poblacion', 'poblacio'), normalitza: municipiDe
  }),
  recepta('regim-reta', {
    tipus: ['reta'], camp: 'seguretatSocial.regim', mode: 'constant', constant: 'RETA',
    etiquetes: et('regimen especial de (?:los )?trabajadores (?:por cuenta propia|autonomos)', 'r\\.?\\s*e\\.?\\s*t\\.?\\s*a')
  }),
  recepta('alta-reta', {
    tipus: ['reta'], camp: 'seguretatSocial.dataAlta', etiquetes: et('fecha (?:real )?de alta', 'data d.alta'), valor: V.data
  }),
  recepta('alta-reta-vida-laboral', {
    tipus: ['vida-laboral'], camp: 'seguretatSocial.dataAlta',
    etiquetes: et('(?:regimen especial (?:de )?)?(?:los )?trabajadores (?:por cuenta propia (?:o )?)?autonomos', 'r\\.?\\s*e\\.?\\s*t\\.?\\s*a'),
    valor: V.data, confianca: 'baixa'
  }),
  recepta('efectes', {
    tipus: ['reta'], camp: 'seguretatSocial.dataEfectes', etiquetes: et('fecha de efectos', 'data d.efectes', 'efectos'), valor: V.data
  }),
  recepta('base-cotitzacio', {
    tipus: ['reta'], camp: 'seguretatSocial.baseCotitzacio', etiquetes: et('base (?:de cotizacion|elegida|de cotitzacio)'),
    valor: V.diners, normalitza: parseImport
  }),
  recepta('cnae', {
    tipus: ['reta', 'kit-digital'], camp: 'activitat.cnae',
    etiquetes: et('c\\.?\\s*n\\.?\\s*a\\.?\\s*e', 'actividad economica', 'codigo de actividad'), valor: V.cnae
  }),
  recepta('epigraf-iae', {
    tipus: ['kit-digital'], camp: 'activitat.epigrafIae', etiquetes: et('epigrafe(?: (?:del )?i\\.?\\s*a\\.?\\s*e)?', 'epigraf'), valor: V.epigraf
  }),
  recepta('alta-censal', {
    tipus: ['kit-digital'], camp: 'activitat.dataAltaCensal',
    etiquetes: et('fecha de alta(?: en el censo)?', 'fecha de inicio de (?:la )?actividad'), valor: V.data, confianca: 'baixa'
  }),
  recepta('referencia-cadastral', {
    tipus: ['suma'], camp: 'tribut.referenciaCadastral',
    etiquetes: et('referencia catastral', 'ref\\.? catastral', 'referencia cadastral'), valor: V.cadastral, normalitza: majuscules, confianca: 'alta'
  }),
  recepta('referencia-suma', {
    tipus: ['suma'], camp: 'tribut.referenciaSuma',
    etiquetes: et('n\\.?\\s*[ºo°]\\.? fijo', 'numero fijo', 'num\\.? fijo', 'numero fix', 'objeto tributario', 'referencia del objeto'),
    valor: V.token, normalitza: majuscules
  }),
  recepta('concepte', {
    tipus: ['suma'], camp: 'tribut.concepte', etiquetes: et('concepto', 'concepte', 'tributo', 'impuesto'), valor: V.concepte, normalitza: concepteDe
  }),
  recepta('adreca-tribut', {
    tipus: ['suma'], camp: 'tribut.adreca', mode: 'linia',
    etiquetes: et('domicilio tributario', 'situacion(?: del objeto)?', 'emplazamiento', 'domicilio del objeto', 'direccion del objeto', 'ubicacion')
  }),
  recepta('nif-entitat', {
    tipus: ENTITAT, camp: 'entitat.nif',
    etiquetes: et('c\\.?\\s*i\\.?\\s*f', 'n\\.?\\s*i\\.?\\s*f', 'numero de identificacion fiscal'), valor: V.nifEntitat, normalitza: normalitzaNif, confianca: 'alta'
  }),
  recepta('denominacio', {
    tipus: ENTITAT, camp: 'entitat.denominacio', mode: 'linia',
    etiquetes: et('denominacion', 'denominacio', 'razon social', 'nombre de la (?:entidad|asociacion)')
  }),
  recepta('domicili-social', {
    tipus: ENTITAT, camp: 'entitat.domiciliSocial', mode: 'linia', etiquetes: et('domicilio social', 'domicili social', 'sede social')
  }),
  recepta('numero-inscripcio', {
    tipus: ['registre-associacions', 'certificat-representacio'], camp: 'registre.numeroInscripcio',
    etiquetes: et('n(?:umero|um)?\\.?\\s*[ºo°]?\\.? (?:de )?inscripcion', 'numero registral', 'numero de registro', 'numero d.inscripcio'),
    valor: V.token, normalitza: majuscules
  }),
  recepta('seccio', {
    tipus: ['registre-associacions', 'certificat-representacio'], camp: 'registre.seccio', etiquetes: et('seccion', 'seccio'), valor: V.paraula, normalitza: majuscules
  }),
  recepta('data-inscripcio', {
    tipus: ['registre-associacions'], camp: 'registre.dataInscripcio', etiquetes: et('fecha (?:de )?inscripcion', 'data d.inscripcio'), valor: V.data
  }),
  recepta('carrec', {
    tipus: ['certificat-representacio'], camp: 'representacio.carrec',
    etiquetes: et('cargo', 'carrec', 'en (?:su )?calidad de', 'en condicion de', 'en qualitat de'), valor: V.carrec, normalitza: carrecDe
  }),
  recepta('vigent-des', {
    tipus: ['certificat-representacio'], camp: 'representacio.vigentDes',
    etiquetes: et('fecha de (?:nombramiento|eleccion)', 'vigente desde', 'data de nomenament'), valor: V.data, confianca: 'baixa'
  }),
  recepta('vigent-fins', {
    tipus: ['certificat-representacio'], camp: 'representacio.vigentFins',
    etiquetes: et('vigente hasta', 'fecha de (?:fin|finalizacion) del mandato'), valor: V.data, confianca: 'baixa'
  })
]);

/* ---------- El motor ---------- */

/* Els trams [inici, fi) que no es poden proposar. */
function tramsBloquejats(plegat) {
  const trams = [];
  for (const patro of [IBAN, COMPTE]) {
    for (const m of plegat.matchAll(patro)) {
      const inici = m.index + m[0].length - m[1].length;
      trams.push([inici, inici + m[1].length]);
    }
  }
  for (const m of plegat.matchAll(ETIQUETA_CSV)) {
    let inici = m.index + m[0].length;
    while (inici < plegat.length && /[\s:.-]/.test(plegat[inici])) inici += 1;
    let fi = plegat.indexOf('\n', inici);
    if (fi < 0) fi = plegat.length;
    trams.push([m.index, Math.min(fi, inici + FINESTRA)]);
  }
  return trams;
}

const bloquejat = (trams, inici, fi) => trams.some(([a, b]) => inici < b && a < fi);

/* Valida cada camp; tot o res: si una part d'una descomposició no val, cap. */
function validats(parts) {
  const fora = [];
  for (const [camp, valor] of Object.entries(parts)) {
    if (valor === null || valor === undefined || valor === '') continue;
    const v = validaCamp(camp, valor);
    if (!v.valid) return [];
    fora.push({ camp, valor: v.normalitzat, avis: v.avis });
  }
  return fora;
}

/* El primer valor de la finestra que té la forma i passa el validador. */
function deLaFinestra(r, ctx, inici) {
  let fi = Math.min(ctx.plegat.length, inici + r.finestra);
  while (fi < ctx.plegat.length && /[a-z0-9]/.test(ctx.plegat[fi])) fi += 1;
  const finestra = ctx.plegat.slice(inici, fi);
  for (const m of finestra.matchAll(r.valor)) {
    const tros = m[1] ?? m[0];
    const a = inici + m.index + m[0].length - tros.length;
    if (bloquejat(ctx.trams, a, a + tros.length)) continue;
    const valor = r.normalitza(ctx.original.slice(a, a + tros.length));
    if (valor === null || valor === undefined) continue;
    const trobats = validats({ [r.camp]: valor });
    if (trobats.length) return trobats;
  }
  return [];
}

/* La resta de la línia (o la línia següent, si l'etiqueta la tanca), tallada
   a la primera columna (dos blancs seguits) i a la finestra. */
function deLaLinia(r, ctx, inici) {
  let i = inici;
  while (i < ctx.plegat.length && /[\s:.=–-]/.test(ctx.plegat[i])) i += 1;
  let fi = ctx.plegat.indexOf('\n', i);
  if (fi < 0) fi = ctx.plegat.length;
  fi = Math.min(fi, i + r.finestra);
  let tros = ctx.original.slice(i, fi);
  const columna = /\s{2,}|\t/.exec(tros);
  if (columna) tros = tros.slice(0, columna.index);
  tros = tros.trim();
  if (tros === '' || bloquejat(ctx.trams, i, i + tros.length)) return [];
  const parts = r.descompon ? r.descompon(tros, plegaAlineat(tros)) : { [r.camp]: r.normalitza(tros) };
  return parts ? validats(parts) : [];
}

function aplica(r, ctx) {
  for (const etiqueta of r.etiquetes) {
    for (const m of ctx.plegat.matchAll(etiqueta)) {
      const fi = m.index + m[0].length;
      const trobats = r.mode === 'constant' ? validats({ [r.camp]: r.constant })
        : r.mode === 'linia' ? deLaLinia(r, ctx, fi) : deLaFinestra(r, ctx, fi);
      if (trobats.length) return trobats;
    }
  }
  return [];
}

const confiancaDe = (r, tipus) => (typeof r.confianca === 'string' ? r.confianca : r.confianca[tipus] ?? r.confianca['*']);

/**
 * Les propostes d'un document.
 * @param {{ tipus: string, text: string, font: { ruta: string, sha256: string } }} entrada
 *   tipus: un de TIPUS_DOCUMENT_IDENTITAT (el del filtre); text: el text del
 *   document, que no ix d'ací; font: la ruta i l'empremta del fitxer.
 * @returns {ReadonlyArray<{ titularRol: string, camp: string, valor: string|number, regla: string, confianca: string, font: object }>}
 */
export function extreuPropostes({ tipus, text, font } = {}) {
  if (!font || typeof font.ruta !== 'string' || font.ruta.trim() === '' || font.ruta.length > 1024 || !SHA256.test(font.sha256 ?? '')) {
    throw new TypeError('Cal la font del document: la ruta i el sha256.');
  }
  if (!TIPUS_DOCUMENT_IDENTITAT.includes(tipus) || typeof text !== 'string' || text === '' || teSalut(text)) return congela([]);
  const plegat = plegaAlineat(text);
  const ctx = { original: text, plegat, trams: tramsBloquejats(plegat) };
  const dataDocument = dataDelNom(font.ruta);
  const propostes = [];
  const vistes = new Set();
  for (const r of RECEPTES) {
    if (!r.tipus.includes(tipus)) continue;
    for (const { camp, valor, avis } of aplica(r, ctx)) {
      const definicio = CAMPS_IDENTITAT[camp];
      const clau = `${camp}\u0000${valor}`;
      if (!definicio || definicio.manual || vistes.has(clau)) continue;
      vistes.add(clau);
      const confianca = tipus === 'desconegut' || avis ? 'baixa' : confiancaDe(r, tipus);
      propostes.push({
        titularRol: definicio.rol,
        camp,
        valor,
        regla: r.id,
        confianca,
        font: {
          tipus: 'document', ruta: font.ruta, sha256: font.sha256.toLowerCase(), tipusDocument: tipus, regla: r.id,
          ...(dataDocument ? { dataDocument } : {})
        }
      });
    }
  }
  return congela(propostes);
}
