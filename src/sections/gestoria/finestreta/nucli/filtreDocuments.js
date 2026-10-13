/**
 * filtreDocuments.js — què es llig i què no, decidit NOMÉS pel nom del fitxer
 * i per les carpetes, abans d'obrir cap byte.
 *
 * Ordre del Mestre, 13-10-2026 (pla 261013_1405, front H): la Fitxa
 * d'identitat naix dels papers de la persona, però la salut, el banc, les
 * credencials, la renda i les herències no s'obrin mai. Tres decisions:
 *   · 'ometre': no es llig. El VETAT sempre guanya, encara que el nom porte
 *     també una paraula permesa («vida laboral» amb «mèdic» no es llig).
 *   · 'llegir': un tipus de paper conegut i permés, amb les seues receptes.
 *   · 'demanar': un nom opac. Només es llig si la persona el marca.
 * Abast: només 01_Identitat_Legal/** i 03_Burocracia/SUMA/**. Fora, i dins de
 * les carpetes 90_*, de quarantena o de l'Agència Tributària, res.
 *
 * El nom s'avalua plegat (minúscules, sense accents) i amb els guions baixos,
 * els punts i els guionets com a espais. `motiu` és un codi estable
 * (MOTIUS el diu en paraules) i mai repetix el nom del fitxer.
 * JS pur: sense DOM, React, xarxa ni emmagatzematge.
 */
import { esDataValida } from '../../nucli/dates.js';
import { congela, plegaText } from './validadorsIdentitat.js';

/* Els tipus de paper que coneixen les receptes de l'extractor. */
export const TIPUS_DOCUMENT_IDENTITAT = Object.freeze([
  'vida-laboral', 'resolucio-afiliacio', 'reta', 'informe-bases', 'suma', 'kit-digital', 'registre-associacions', 'estatuts',
  'certificat-representacio', 'desconegut'
]);

export const MOTIUS = Object.freeze({
  'fora-dabast': 'Fora de 01_Identitat_Legal i de 03_Burocracia/SUMA: la Fitxa no hi mira.',
  'carpeta-exclosa': 'Carpeta exclosa (arxiu 90, quarantena o Agència Tributària).',
  ocult: 'Fitxer ocult o temporal del sistema.',
  salut: 'Dades de salut: no s’obrin mai des de la Gestoria.',
  'model-145': 'Model 145: porta dades familiars i de discapacitat.',
  banc: 'Dades bancàries o rebuts de cotització: no entren a la Fitxa.',
  credencials: 'Credencials: no s’obrin mai.',
  'renda-herencia': 'Renda o herència: fora de la Fitxa d’identitat.',
  'format-vetat': 'Signatura, enllaç o document d’una altra aplicació: no es llig.',
  imatge: 'Imatge: no hi ha reconeixement de text; les dades s’entren a mà.',
  'format-sense-lector': 'Format sense lector: només es lligen PDF i text pla.',
  'opt-in': 'Document del SEPE o de LABORA: només si ho demanes expressament.',
  permes: 'Paper conegut i permés.',
  'nom-opac': 'El nom no diu què és: només es llig si el marques.'
});

const LLEGIBLES = Object.freeze(['pdf', 'txt']);
const IMATGES = Object.freeze(['jpg', 'jpeg', 'png', 'heic', 'heif', 'gif', 'webp', 'tif', 'tiff', 'bmp', 'svg', 'avif']);
const FORMATS_VETATS = Object.freeze(['p7s', 'xsig', 'webloc', 'pages', 'url', 'lnk']);

/* Banc i cotització. Revisió adversarial 13-10-2026, troballes ID-F2 i ID-F6:
   també els avisos de càrrec i les domiciliacions (en valencià i en castellà),
   l'IBAN i el mandat SEPA. «Compte propi» i «cuenta propia» són el RETA
   (treballadors per compte propi), i la «base de cotització» és l'informe de
   bases: cap dels dos és banc. Tota la resta de «cotització» sí que ho és
   (rebuts, liquidacions, justificants). Sense mirada arrere (Safari 16.0): la
   paraula d'abans es consumix i una mirada avant descarta «bases», «de», «la»…;
   la segona alternativa caça un rebut a quatre paraules o menys, encara que
   hi haja «bases» pel mig. */
const BANC = new RegExp([
  'bancari', 'banco', 'cuenta(?! propia)', 'compte(?! propi)', 'titularidad', 'titularitat', 'avisocc', 'aviso cc',
  'aviso?s? (?:de )?(?:carrec|cargo)', 'domicilia(?:ci|d|t)', '(?:^| )(?:rlc|iban|sepa)(?: |$)',
  '(?:^| )(?!(?:bases?|de|del|la|las|les|el|els|los) )[a-z0-9]+ (?:(?:de|del|la|las|les|el|els|los) )*(?:cotizacion|cotitzacio)',
  '(?:recib|rebut|justificant|adeudo|cargo|carrec|pago|pagament|liquidaci)[a-z]*(?: [a-z0-9]+){0,4} (?:cotizacion|cotitzacio)'
].join('|'));

/* VETAT, sobre el camí sencer (carpetes i nom), en l'ordre en què es diuen al
   motiu. «renta» i «renda» han de ser paraula sencera: «Rentonar» és el nom
   de l'associació i els seus papers sí que es lligen. Revisió adversarial
   13-10-2026, troballa ID-F2: cada vet també en valencià i en les variants
   habituals (model 145, contrasenyes, claus, pagament directe,
   minusvalidesa, IRPF, successions…). */
const VETS = Object.freeze([
  ['salut', /incapacita[dt] temporal|pago directo|pagament directe| it |baja medica|baixa medica|baja laboral|baixa laboral|parte de baja|part de baixa|comunicat medic|medic|discapacidad|discapacitat|minusvalia|minusvalid/],
  ['model-145', /(?:^| )(?:m|mod|model|modelo) ?145(?: |$)/],
  ['banc', BANC],
  ['credencials', /contrasen|password|passwd|clave|cl@ve|credencial|(?:^| )claus?(?: |$)/],
  ['renda-herencia', /(?:^| )(?:renta|renda|irpf)(?: |\d|$)|herencia|heretat|sucesion|successio|testament/]
]);

/* Documents del SEPE o de LABORA: fora per defecte; amb `ambOptIn`, es demanen.
   Revisió adversarial 13-10-2026, troballa ID-F4: tot el que du SEPE o LABORA
   (o els noms d'abans, INEM i SERVEF) en una carpeta o en el nom, i els papers
   de l'atur, no només el DARDE i l'autoentrevista. */
const OPT_IN = /darde|autoentrevista|(?:^| )(?:sepe|labora|servef|inem|atur|paro)(?: |$)|desempleo|desocupacio|demandante? (?:de empleo|d.?ocupacio)/;

/* PERMÈS, per paraula clau, en este ordre: el primer que casa dona el tipus.
   `tambe` és la segona condició quan la primera sola no basta; `abast`, la
   part de l'abast on val l'entrada. Revisió adversarial 13-10-2026, troballa
   ID-F1: les paraules es busquen NOMÉS en el nom del fitxer, mai en les
   carpetes (la carpeta SUMA ho casava tot i cap paper opac s'hi demanava). */
const PERMESOS = Object.freeze([
  { tipus: 'vida-laboral', organisme: 'TGSS', patro: /vida laboral/ },
  { tipus: 'informe-bases', organisme: 'TGSS', patro: /informe (?:de )?bases/ },
  { tipus: 'resolucio-afiliacio', organisme: 'TGSS', patro: /numero (?:de )?afiliacion|afiliacio/ },
  { tipus: 'reta', organisme: 'TGSS', patro: /(?:^| )reta(?: |$)/, tambe: /resguardo|resolucion|resolucio|variacion|variacio|modificacion|modificacio/ },
  { tipus: 'suma', organisme: 'SUMA', patro: /(?:^| )suma(?: |$)/ },
  /* Dins de 03_Burocracia/SUMA, els rebuts i les notificacions (la fitxa: «els rebuts i notificacions de SUMA»). */
  { tipus: 'suma', organisme: 'SUMA', abast: 'suma', patro: /(?:^| )(?:recibos?|rebuts?|notificaci(?:on|ones|o|ons))(?: |$)/ },
  { tipus: 'kit-digital', organisme: 'RED.ES', patro: /kit digital/ },
  { tipus: 'kit-digital', organisme: 'RED.ES', patro: /solicitud/, tambe: /c022/ },
  { tipus: 'registre-associacions', organisme: 'REGISTRE-ASSOCIACIONS', patro: /alta en el registro/ },
  { tipus: 'certificat-representacio', organisme: 'ALTRE', patro: /representacio/ },
  { tipus: 'estatuts', organisme: 'REGISTRE-ASSOCIACIONS', patro: /estatut/ }
]);

/* El camí en trossos plegats, sense buits («a//b», «./a»). */
function trossosDe(ruta) {
  return String(ruta).replace(/\\/g, '/').split('/').map((t) => plegaText(t).trim()).filter((t) => t !== '' && t !== '.');
}

/* Un tros amb els separadors com a espais i un espai a cada vora, perquè les paraules senceres es puguen buscar amb « x ». */
const espaiat = (text) => ` ${text.replace(/[_\s.-]+/g, ' ').trim()} `;

/* Quina part de l'abast toca el camí: 'identitat', 'suma' o null. */
function abastDe(carpetes) {
  const plans = carpetes.map((c) => espaiat(c).trim());
  if (plans.includes('01 identitat legal')) return 'identitat';
  for (let i = 0; i + 1 < plans.length; i += 1) {
    if (plans[i] === '03 burocracia' && plans[i + 1] === 'suma') return 'suma';
  }
  return null;
}

const esCarpetaExclosa = (carpeta) => /^90[ _]/.test(carpeta) || /quarantena|cuarentena/.test(carpeta) || /agencia[ _-]?tributaria/.test(carpeta);

const decisio = (que, tipus, organisme, motiu) => congela({ decisio: que, tipus, organisme, motiu });

/**
 * Decidix si un fitxer es llig, pel nom i les carpetes, sense obrir-lo.
 * @param {string} ruta camí relatiu des de la carpeta de la Gestoria (també
 *   en serveix un que comence per 01_Identitat_Legal/ o 03_Burocracia/SUMA/)
 * @param {{ ambOptIn?: boolean }} [opcions] ambOptIn: els documents del SEPE
 *   o de LABORA passen a 'demanar' en lloc d'ometre's
 * @returns {Readonly<{ decisio: 'llegir'|'ometre'|'demanar', tipus: string|null, organisme: string|null, motiu: string }>}
 */
export function decidixLectura(ruta, { ambOptIn = false } = {}) {
  if (typeof ruta !== 'string' || ruta.trim() === '') return decisio('ometre', null, null, 'fora-dabast');
  const trossos = trossosDe(ruta);
  const nom = trossos[trossos.length - 1] ?? '';
  const carpetes = trossos.slice(0, -1);
  const abast = abastDe(carpetes);
  if (!abast) return decisio('ometre', null, null, 'fora-dabast');
  if (carpetes.some(esCarpetaExclosa)) return decisio('ometre', null, null, 'carpeta-exclosa');
  if (nom.startsWith('.') || nom.startsWith('~$')) return decisio('ometre', null, null, 'ocult');

  const punt = nom.lastIndexOf('.');
  const extensio = punt > 0 ? nom.slice(punt + 1) : '';
  const cami = espaiat(trossos.join(' '));
  for (const [motiu, patro] of VETS) {
    if (patro.test(cami)) return decisio('ometre', null, null, motiu);
  }
  if (FORMATS_VETATS.includes(extensio)) return decisio('ometre', null, null, 'format-vetat');
  if (IMATGES.includes(extensio)) return decisio('ometre', null, null, 'imatge');
  if (!LLEGIBLES.includes(extensio)) return decisio('ometre', null, null, 'format-sense-lector');
  if (OPT_IN.test(cami)) return ambOptIn ? decisio('demanar', 'desconegut', null, 'opt-in') : decisio('ometre', null, null, 'opt-in');

  /* Revisió adversarial 13-10-2026, troballa ID-F1: només el nom, sense les carpetes ni l'extensió. */
  const sensExtensio = espaiat(punt > 0 ? nom.slice(0, punt) : nom);
  let endevinat = null;
  for (const permes of PERMESOS) {
    if ((permes.abast && permes.abast !== abast) || !permes.patro.test(sensExtensio)) continue;
    if (!permes.tambe || permes.tambe.test(sensExtensio)) return decisio('llegir', permes.tipus, permes.organisme, 'permes');
    endevinat = endevinat ?? permes;
  }
  if (endevinat) return decisio('demanar', endevinat.tipus, endevinat.organisme, 'nom-opac');
  return abast === 'suma' ? decisio('demanar', 'suma', 'SUMA', 'nom-opac') : decisio('demanar', 'desconegut', null, 'nom-opac');
}

/**
 * La data del document segons el prefix «AAMMDD_» del nom, en «aaaa-mm-dd»,
 * o null. Només servix per a marcar quina font és la més recent; mai tria
 * sola un valor.
 * @param {string} ruta
 * @returns {string|null}
 */
export function dataDelNom(ruta) {
  if (typeof ruta !== 'string') return null;
  const nom = ruta.replace(/\\/g, '/').split('/').pop() ?? '';
  const r = /^(\d{2})(\d{2})(\d{2})[_ -]/.exec(nom);
  if (!r) return null;
  const data = { a: 2000 + Number(r[1]), m: Number(r[2]), d: Number(r[3]) };
  return esDataValida(data) ? `20${r[1]}-${r[2]}-${r[3]}` : null;
}
