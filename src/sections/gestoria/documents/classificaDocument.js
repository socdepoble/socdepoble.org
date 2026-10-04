/**
 * classificaDocument.js — de quin tipus del catàleg és cada document, i per què.
 *
 * El classificador d'autoneteja (MAPA de l'empresa i de la llar, §3.3), en
 * tres passes que sumen punts per a cada tipus de catalegTipus.js:
 *   1. Pel nom i la ruta: primer, l'opinió de nucli/classifica.js (factures,
 *      rebuts, fulls, extractes), reutilitzada sense tocar-la; després, les
 *      receptes de nom d'ací (extensions, paraules del nom i de les carpetes).
 *   2. Pel text extret (de nucli/pdfText.js o d'un CSV): paraules clau, el
 *      proveïdor del catàleg (detectaProveidor de nucli/receptes.js) i
 *      l'organisme emissor per les paraules de la capçalera.
 *   3. Duplicats, a classificaDocuments: el mateix sha256 és una còpia
 *      (nucli/classifica.js, detectaDuplicats). Es marca la còpia, mai
 *      l'original; una còpia que només ho sembla pel nom va a «revisa'l».
 *
 * FAIL-CLOSED: si el millor tipus no arriba al llindar, o el segon li queda a
 * prop, el document és 'desconegut' i diu «revisa'l». Mai s'endevina.
 * El text sencer no es guarda mai: l'eixida porta el tipus, la confiança i els
 * motius (quina recepta ha casat), però cap tros del text ni dels bytes.
 * JS pur: sense DOM ni React; cap xarxa.
 */
import { classificaDocument as classificaPerNom, detectaDuplicats } from '../nucli/classifica.js';
import { extreuTextPdf } from '../nucli/pdfText.js';
import { detectaProveidor } from '../nucli/receptes.js';
import { CATALEG_TIPUS, TIPUS_DESCONEGUT, fitxaTipus } from './catalegTipus.js';

/** Punts mínims perquè un tipus es done per bo. */
export const LLINDAR_TIPUS = 40;
/** Distància mínima amb el segon candidat: si no hi arriba, el classificador dubta. */
export const MARGE_TIPUS = 15;
/** Punts a partir dels quals la confiança és alta. */
export const TIPUS_SEGUR = 70;
/** Caràcters del text que es lligen: la capçalera i el cos d'un document normal. */
export const MAX_TEXT = 20000;

/* Text en minúscules, sense accents i amb un sol espai. */
const plega = (text) => String(text ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ');
/* Una expressió que no pot començar ni acabar dins d'una altra paraula. */
const paraula = (expressio) => new RegExp(`(?:^|[^a-z0-9])(?:${expressio})(?![a-z0-9])`);
/* Separador flexible entre paraules d'un nom: «vida_laboral», «vida-laboral», «vida laboral». */
const S = '[^a-z0-9]*';
const segments = (ruta) => String(ruta ?? '').split(/[\\/]/).filter((s) => s !== '' && s !== '.' && s !== '..');

const recepta = (tipus, patro, punts, motiu) => Object.freeze({ tipus, patro, punts, motiu });

/**
 * L'extensió sola no classifica. Una extensió que pot portar qualsevol
 * contingut (.html, .js, .css, .py, .sh, .php, .log, .bak, .tmp: una factura
 * desada en HTML, la còpia .bak d'un contracte) és un indici que suma menys
 * que el llindar, i cal un altre indici (el nom, la carpeta o el text)
 * perquè el tipus es done per bo; si no n'hi ha, «revisa'l». Només
 * classifiquen soles les extensions que SÓN el format del tipus: un .webloc
 * sempre és un marcador, un .afpub sempre és un fitxer editable de disseny,
 * un .p7s sempre és una signatura separada.
 */
export const PUNTS_EXTENSIO_OBERTA = 25;

/**
 * Receptes pel nom. Casen amb el nom del fitxer (punts sencers) o amb el nom
 * d'una carpeta de la ruta (la meitat). Ordre: de la més concreta a la més general.
 */
export const RECEPTES_NOM = Object.freeze([
  recepta('enllac', /\.webloc$/, 70, "marcador d'un servei (.webloc)"),
  recepta('font-disseny', /\.(?:afpub|afdesign|afphoto|psd|sketch)$/, 70, 'fitxer editable de disseny'),
  recepta('signatura-electronica', /\.(?:p7s|xsig)$/, 70, 'signatura electrònica separada'),
  recepta('signatura-electronica', paraula(`informe${S}(?:de${S})?(?:firma|signatura)`), 50, 'informe de signatura pel nom'),
  recepta('copia-automatica', /\.gnucash\.\d{14}\.(?:gnucash|log)$/, 70, 'còpia automàtica de GnuCash'),
  recepta('copia-automatica', /\.(?:log|bak|tmp)$/, PUNTS_EXTENSIO_OBERTA, 'extensió de còpia o registre intermedi (sola no basta)'),
  recepta('codi-antic', /\.(?:js|mjs|jsx|py|sh|php|html|css)$/, PUNTS_EXTENSIO_OBERTA, 'extensió de codi font (sola no basta)'),
  recepta('codi-antic', paraula('prototip|prototipo|prototype|scripts?|codi|codigo|src|legacy'), 30, 'codi o prototip pel nom'),
  recepta('model-145', paraula(`(?:modelo|model)${S}145`), 70, 'model 145 pel nom'),
  recepta('model-presentat', paraula(`(?:modelo|model)${S}(?:303|130|349|390|347)`), 50, 'model tributari pel nom'),
  recepta('declaracio-renda', paraula(`renta|renda|(?:modelo|model)${S}100`), 40, 'declaració de la renda pel nom'),
  recepta('informe-vida-laboral', paraula(`vida${S}laboral|informe${S}(?:de${S})?bases`), 50, 'informe de vida laboral o de bases pel nom'),
  recepta('rebut-cotitzacio', paraula(`rlc|recibo${S}(?:de${S})?(?:liquidacion|cotizacion)|rebut${S}(?:de${S})?cotitzacio`), 40, 'rebut de cotització pel nom'),
  recepta('acte-seguretat-social', paraula(`reta|tgss|seguridad${S}social|(?:alta|baja|baixa)${S}(?:de${S})?autonom[oa]`), 30, 'acte de la Seguretat Social pel nom'),
  recepta('certificat-titularitat', paraula('titularidad|titularitat'), 50, 'certificat de titularitat pel nom'),
  recepta('demanda-ocupacio', paraula(`demanda${S}(?:de${S}|d${S})?(?:empleo|ocupacio)|darde|autoentrevista`), 50, "demanda d'ocupació pel nom"),
  recepta('incapacitat-temporal', paraula(`incapacidad${S}temporal|incapacitat${S}temporal|(?:baja|baixa)${S}medica|parte${S}(?:de${S})?baja`), 50, 'incapacitat temporal pel nom'),
  recepta('mostra-salut', paraula('miccional|medicacion|medicacio|agitacion|agitacio|glucosa'), 50, 'full de salut pel nom'),
  recepta('credencial-clar', paraula(`contrasena|contrasenya|password|passwd|clave|credencial(?:es|s)?|pin${S}(?:de${S})?(?:firma|signatura)`), 60, 'credencial pel nom'),
  recepta('notificacio-administrativa', paraula('notificacion|notificacio|resolucion|resolucio|requerimiento|requeriment'), 40, 'notificació o resolució pel nom'),
  recepta('rebut-tribut-local', paraula(`ibi|ivtm|tributs?|impuesto${S}(?:de${S})?vehiculos`), 40, 'tribut local pel nom'),
  recepta('expedient-marca', paraula('marca|marques|marcas|oepm|bopi'), 40, 'expedient de marca pel nom'),
  recepta('subvencio', paraula(`kit${S}digital|acelera${S}pyme|bono${S}digital|subvencion(?:es)?|subvencio(?:ns)?|ayuda|ajuda`), 40, 'ajuda o subvenció pel nom'),
  recepta('titol-propietat', paraula(`escritura|escriptura|hipoteca|herencia|testamento|testament|nota${S}simple`), 50, 'títol de propietat pel nom'),
  recepta('document-identitat', paraula(`dni|nie|pasaporte|passaport|passport|carnet${S}(?:de${S})?conducir`), 50, "document d'identitat pel nom"),
  recepta('polissa-asseguranca', paraula('poliza|polissa|seguro|asseguranca'), 40, "pòlissa d'assegurança pel nom"),
  recepta('garantia', paraula('garantia|warranty'), 40, 'garantia pel nom'),
  recepta('tiquet-simplificat', paraula(`tiquet|ticket|tique|factura${S}simplificada`), 40, 'tiquet pel nom'),
  recepta('pressupost', paraula('pressupost|presupuesto'), 40, 'pressupost pel nom'),
  recepta('cataleg-botiga', paraula(`catalogo|cataleg|tarifas?|lista${S}(?:de${S})?precios|llista${S}(?:de${S})?preus`), 40, 'catàleg o llista de preus pel nom'),
  recepta('plantilla-en-blanc', paraula(`plantilla|template|en${S}blanco?`), 40, 'plantilla pel nom'),
  recepta('rebut-domestic', paraula('luz|llum|agua|aigua|gas|telefono|telefon|fibra|comunidad|comunitat|alquiler|lloguer'), 30, 'rebut domèstic pel nom')
]);

/** Receptes pel text extret (ja plegat: minúscules i sense accents). */
export const RECEPTES_TEXT = Object.freeze([
  recepta('factura-emesa', paraula('factura|invoice'), 10, 'el text diu «factura»'),
  recepta('factura-rebuda', paraula('factura|invoice'), 10, 'el text diu «factura»'),
  recepta('tiquet-simplificat', paraula(`factura${S}simplificada|ticket|tiquet`), 30, 'el text diu «factura simplificada» o «tiquet»'),
  recepta('pressupost', paraula('presupuesto|pressupost'), 30, 'el text diu «pressupost»'),
  recepta('pressupost', paraula('validez|validesa'), 10, 'el text parla de la validesa'),
  recepta('model-presentat', paraula(`justificante${S}(?:de${S})?presentacion|justificant${S}(?:de${S})?presentacio`), 30, 'justificant de presentació'),
  recepta('model-presentat', paraula(`(?:modelo|model)${S}(?:303|130|349|390|347)`), 30, 'número de model tributari'),
  recepta('declaracio-renda', paraula(`declaracion${S}(?:de${S})?(?:la${S})?renta|declaracio${S}(?:de${S})?(?:la${S})?renda|(?:modelo|model)${S}100`), 40, 'declaració de la renda'),
  recepta('extracte-bancari', paraula(`extracto|extracte|saldo${S}(?:anterior|final)|movimientos`), 25, 'moviments o saldo del compte'),
  recepta('informe-vida-laboral', paraula(`informe${S}(?:de${S})?vida${S}laboral`), 50, 'informe de vida laboral'),
  recepta('rebut-cotitzacio', paraula(`recibo${S}(?:de${S})?liquidacion${S}(?:de${S})?cotizaciones`), 50, 'rebut de liquidació de cotitzacions'),
  recepta('acte-seguretat-social', paraula(`regimen${S}especial${S}(?:de${S})?(?:los${S})?trabajadores${S}(?:por${S}cuenta${S}propia${S}o${S})?autonomos`), 40, 'règim especial de treballadors autònoms'),
  recepta('certificat-titularitat', paraula(`certificado${S}(?:de${S})?titularidad|certificat${S}(?:de${S})?titularitat`), 50, 'certificat de titularitat'),
  recepta('demanda-ocupacio', paraula(`demanda${S}(?:de${S})?empleo|demandante${S}(?:de${S})?empleo`), 40, "demanda d'ocupació"),
  recepta('model-145', paraula(`(?:modelo|model)${S}145|comunicacion${S}(?:de${S})?datos${S}al${S}pagador`), 50, 'model 145'),
  recepta('incapacitat-temporal', paraula(`incapacidad${S}temporal|incapacitat${S}temporal|parte${S}(?:medico${S})?de${S}baja`), 50, 'incapacitat temporal'),
  recepta('notificacio-administrativa', paraula(`notificacion|recurso${S}(?:de${S})?(?:alzada|reposicion)`), 25, 'notificació amb termini de recurs'),
  recepta('rebut-tribut-local', paraula(`impuesto${S}(?:sobre${S})?bienes${S}inmuebles|vehiculos${S}(?:de${S})?traccion${S}mecanica`), 40, 'tribut local'),
  recepta('expedient-marca', paraula(`solicitud${S}(?:de${S})?marca|concesion${S}(?:de${S})?(?:la${S})?marca`), 30, 'expedient de marca'),
  recepta('subvencio', paraula(`resolucion${S}(?:de${S})?concesion|bono${S}digital|agente${S}digitalizador|beneficiario`), 30, 'ajuda o subvenció'),
  recepta('polissa-asseguranca', paraula('tomador|asegurado|poliza'), 25, "pòlissa d'assegurança"),
  recepta('titol-propietat', paraula(`escritura${S}(?:de${S})?(?:compraventa|herencia|prestamo)|notario|registro${S}(?:de${S})?(?:la${S})?propiedad`), 40, 'títol de propietat'),
  recepta('credencial-clar', paraula(`contrasena|password|clave${S}privada|begin${S}(?:rsa${S})?private${S}key`), 60, 'el text porta una credencial')
]);

const organisme = (clau, patro, suma) => Object.freeze({ clau, patro, suma: Object.freeze(suma) });

/** Organismes emissors per les paraules de la capçalera, i els tipus que fan més probables. */
export const ORGANISMES = Object.freeze([
  organisme('TGSS', paraula(`tesoreria${S}general${S}(?:de${S})?(?:la${S})?seguridad${S}social|tgss`), {
    'acte-seguretat-social': 15, 'rebut-cotitzacio': 15, 'informe-vida-laboral': 15, 'notificacio-administrativa': 10
  }),
  organisme('AEAT', paraula(`agencia${S}(?:estatal${S}(?:de${S})?administracion${S})?tributaria|aeat`), {
    'model-presentat': 15, 'declaracio-renda': 15, 'notificacio-administrativa': 10
  }),
  organisme('SUMA', paraula(`suma${S}gestion?${S}tributaria`), { 'rebut-tribut-local': 25, 'notificacio-administrativa': 10 }),
  organisme('OEPM', paraula(`oficina${S}espanola${S}(?:de${S})?patentes${S}(?:y${S})?marcas|oepm|bopi`), { 'expedient-marca': 25 }),
  organisme('Red.es', paraula(`red\\.es|kit${S}digital`), { subvencio: 25 }),
  organisme('SEPE', paraula(`servicio${S}publico${S}(?:de${S})?empleo|sepe|labora`), { 'demanda-ocupacio': 20 })
]);

/* L'ordre del catàleg desfà els empats (determinista). */
const ORDRE = new Map(CATALEG_TIPUS.map((t, i) => [t.id, i]));

/* La primera opinió, la de nucli/classifica.js: una factura sense sentit conegut és un indici feble. */
function passaBase(base, suma) {
  if (!base) return;
  if (base.tipus === 'model-trimestral') suma('full-trimestral', 50, base.motiu);
  else if (base.tipus === 'extracte') suma('extracte-bancari', 50, base.motiu);
  else if (base.tipus === 'csv-factura') suma('factura-rebuda', 50, base.motiu);
  else if (base.tipus === 'rebut') suma('rebut-pagament', 40, base.motiu);
  else if (base.tipus === 'factura' && base.sentit === 'emesa') suma('factura-emesa', 40, base.motiu);
  else if (base.tipus === 'factura' && base.sentit === 'rebuda') suma('factura-rebuda', 40, base.motiu);
  else if (base.tipus === 'factura') {
    suma('factura-emesa', 10, 'és un PDF: pot ser una factura');
    suma('factura-rebuda', 10, 'és un PDF: pot ser una factura');
  }
}

/* Receptes de nom: el nom del fitxer compta sencer; una carpeta, la meitat (cada recepta, una vegada). */
function passaNom(ruta, suma) {
  const parts = segments(ruta).map(plega);
  const nom = parts.pop() ?? '';
  for (const r of RECEPTES_NOM) {
    if (r.patro.test(nom)) suma(r.tipus, r.punts, r.motiu);
    else if (parts.some((carpeta) => r.patro.test(carpeta))) suma(r.tipus, Math.round(r.punts / 2), `${r.motiu} (per la carpeta)`);
  }
}

/* Receptes de text, proveïdor del catàleg i organisme emissor. Torna l'organisme o null. */
function passaText(text, nomFitxer, suma) {
  const net = String(text ?? '').slice(0, MAX_TEXT);
  if (net.trim() === '') return null;
  const plec = plega(net);
  for (const r of RECEPTES_TEXT) if (r.patro.test(plec)) suma(r.tipus, r.punts, r.motiu);
  const { proveidor } = detectaProveidor({ text: net, nomFitxer });
  if (proveidor) suma('factura-rebuda', 30, `proveïdor del catàleg: ${proveidor.nom}`);
  const trobat = ORGANISMES.find((o) => o.patro.test(plec)) ?? null;
  if (trobat) {
    for (const [tipus, punts] of Object.entries(trobat.suma)) suma(tipus, punts, `organisme emissor: ${trobat.clau}`);
  }
  return trobat?.clau ?? null;
}

/* La fitxa del tipus decidit, sense res del document. */
function resultat(ruta, tipus, { revisa, confianca, motius, candidats, organisme: org }) {
  const fitxa = fitxaTipus(tipus);
  return {
    ruta,
    tipus: fitxa.id,
    revisa,
    confianca,
    motius,
    candidats,
    organisme: org,
    ambit: fitxa.ambit,
    sensibilitat: fitxa.sensibilitat,
    protegit: fitxa.protegit,
    queEs: fitxa.queEs,
    perAQueServix: fitxa.perAQueServix,
    quanEsborrar: fitxa.quanEsborrar
  };
}

/**
 * Classifica un document per les passes 1 (nom i ruta) i 2 (text, si n'hi ha).
 * Els fitxers ocults del sistema tornen null, com a nucli/classifica.js.
 * @param {{ ruta: string, mida?: number, text?: string }} doc el text no es guarda
 * @param {{ serie?: RegExp|null }} [opcions] la sèrie de les factures emeses (classifica.js)
 * @returns {object|null} { ruta, tipus, revisa, confianca, motius, candidats, organisme, ambit, sensibilitat, protegit, queEs, perAQueServix, quanEsborrar }
 */
export function classificaDocument(doc, { serie = null } = {}) {
  const ruta = String(doc?.ruta ?? '');
  const base = classificaPerNom({ ruta, mida: doc?.mida }, { serie });
  if (!base) return null;
  const punts = new Map();
  const motius = new Map();
  const suma = (tipus, n, motiu) => {
    punts.set(tipus, (punts.get(tipus) ?? 0) + n);
    motius.set(tipus, [...(motius.get(tipus) ?? []), motiu]);
  };
  passaBase(base, suma);
  passaNom(ruta, suma);
  const org = passaText(doc?.text, segments(ruta).pop() ?? '', suma);

  const candidats = [...punts.entries()]
    .map(([tipus, n]) => ({ tipus, punts: n }))
    .sort((a, b) => b.punts - a.punts || ORDRE.get(a.tipus) - ORDRE.get(b.tipus));
  const [millor, segon] = candidats;
  if (!millor || millor.punts < LLINDAR_TIPUS) {
    return resultat(ruta, TIPUS_DESCONEGUT, {
      revisa: true, confianca: 'baixa', candidats, organisme: org,
      motius: ["cap tipus arriba al llindar: revisa'l"]
    });
  }
  if (segon && millor.punts - segon.punts < MARGE_TIPUS) {
    return resultat(ruta, TIPUS_DESCONEGUT, {
      revisa: true, confianca: 'baixa', candidats, organisme: org,
      motius: [`dubte entre «${fitxaTipus(millor.tipus).nom}» i «${fitxaTipus(segon.tipus).nom}»: revisa'l`]
    });
  }
  return resultat(ruta, millor.tipus, {
    revisa: false,
    confianca: millor.punts >= TIPUS_SEGUR ? 'alta' : 'mitjana',
    candidats,
    organisme: org,
    motius: motius.get(millor.tipus)
  });
}

/* El document sense el contingut: ni text ni bytes passen mai a l'eixida. */
function senseContingut(doc) {
  const net = { ...doc };
  delete net.text;
  delete net.bytes;
  return net;
}

/**
 * Classifica una llista (passes 1 i 2) i hi aplica la passa 3, els duplicats.
 * Una còpia amb el mateix sha256 que l'original passa a 'duplicat-exacte' i
 * porta `original` (la ruta de l'original), amb l'àmbit i la sensibilitat de
 * l'original. Una còpia que només ho sembla pel nom no canvia de tipus però
 * va a «revisa'l». L'original no es toca mai.
 * @param {Array<{ ruta: string, mida?: number, sha256?: string, text?: string }>} documents
 * @param {{ serie?: RegExp|null }} [opcions]
 * @returns {object[]} cada document, sense text ni bytes, amb la seua classificació
 */
export function classificaDocuments(documents, opcions = {}) {
  const classificats = [];
  for (const doc of documents ?? []) {
    const c = classificaDocument(doc, opcions);
    if (c) classificats.push({ ...senseContingut(doc), ...c });
  }
  const perRuta = new Map(classificats.map((c) => [c.ruta, c]));
  const grups = detectaDuplicats(classificats.map(({ ruta, mida, sha256 }) => ({ ruta, mida, sha256 })));
  for (const { documents: membres } of grups) {
    const original = perRuta.get(membres[0].ruta);
    for (const membre of membres.slice(1)) {
      const copia = perRuta.get(membre.ruta);
      const exacta = typeof copia.sha256 === 'string' && copia.sha256 !== '' && copia.sha256 === original.sha256;
      if (exacta) {
        const fitxa = fitxaTipus('duplicat-exacte');
        Object.assign(copia, {
          tipus: fitxa.id,
          revisa: false,
          confianca: 'alta',
          motius: [`mateix contingut (sha256) que «${original.ruta}»`],
          original: original.ruta,
          ambit: original.ambit,
          sensibilitat: original.sensibilitat,
          protegit: fitxa.protegit,
          queEs: fitxa.queEs,
          perAQueServix: fitxa.perAQueServix,
          quanEsborrar: fitxa.quanEsborrar
        });
      } else {
        copia.revisa = true;
        copia.motius = [...copia.motius, `pot ser una còpia de «${original.ruta}» pel nom, però el contingut no s'ha comprovat: revisa-la`];
      }
    }
  }
  return classificats;
}

/**
 * Classifica un PDF pel nom i pel seu text, que s'extrau ací mateix amb
 * extreuTextPdf (amb el seu pressupost contra PDF maliciosos) i es deixa anar
 * en acabar: no ix mai d'esta funció. Un PDF xifrat o sense text es
 * classifica només pel nom, i ho diu.
 * @param {{ ruta: string, mida?: number, sha256?: string, bytes: Uint8Array|ArrayBuffer }} doc
 * @param {{ serie?: RegExp|null, inflate?: Function|null, pressupost?: number }} [opcions]
 * @returns {Promise<object|null>}
 */
export async function classificaPdf(doc, { serie = null, ...lectura } = {}) {
  const ruta = String(doc?.ruta ?? '');
  if (!classificaPerNom({ ruta }, { serie })) return null;
  const { text, xifrat } = await extreuTextPdf(doc?.bytes, lectura);
  const c = classificaDocument({ ruta, mida: doc?.mida, text: xifrat ? '' : text }, { serie });
  if (xifrat) c.motius = [...c.motius, "el PDF està xifrat: no se n'ha llegit el contingut"];
  else if (String(text ?? '').trim() === '') c.motius = [...c.motius, 'el PDF no porta text (potser escanejat)'];
  return { ...senseContingut(doc), ...c };
}
