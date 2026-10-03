/**
 * cataleg.js — catàleg integrat de proveïdors comuns per a reconéixer factures.
 *
 * Només dades públiques d'empreses (raó social, NIF publicat, dominis
 * oficials): res de personal. El NIF va només on el tenim contrastat; si no,
 * null. Un domini dubtós no s'hi posa. La cadència i l'IVA habitual només on
 * se saben: null vol dir «no ho sabem», no «no en té». JS pur: sense DOM.
 *
 * Forma de cada proveïdor: { clau, nom, nif, nifsAlternatius, pais, dominis,
 * patronsFitxer, patronsNum, paraulesText, cadencia, ivaHabitual, notes? }.
 * Els patrons no porten mai les banderes g ni y (test() sense estat).
 *
 * nifsAlternatius (G3T-12): els NIF d'altres societats del mateix grup que
 * també facturen o passen els rebuts del proveïdor. Només s'hi posa un NIF
 * confirmat amb una factura; buit vol dir «no en sabem cap».
 * pais: el codi ISO del país on està establert el proveïdor, només on se sap
 * (el prefix del seu NIF-IVA, o «ES» si el NIF és espanyol); null si no.
 * L'auditoria el fa servir quan la factura no porta el NIF de l'emissor.
 */
import { normalitzaNif } from './nif.js';

function proveidor(dades) {
  const p = {
    nif: null,
    nifsAlternatius: [],
    pais: null,
    dominis: [],
    patronsFitxer: [],
    patronsNum: [],
    paraulesText: [],
    cadencia: null,
    ivaHabitual: null,
    ...dades
  };
  for (const camp of ['nifsAlternatius', 'dominis', 'patronsFitxer', 'patronsNum', 'paraulesText']) p[camp] = Object.freeze([...p[camp]]);
  return Object.freeze(p);
}

export const CATALEG_PROVEIDORS = Object.freeze([
  proveidor({
    clau: 'google-cloud',
    nom: 'Google Cloud EMEA Limited',
    nif: 'IE3668997OH',
    pais: 'IE',
    dominis: ['google.com', 'payments.google.com'],
    patronsFitxer: [/^\d{10}\.(pdf|csv)$/, /google/i],
    paraulesText: ['Google Cloud EMEA', 'Google Cloud', 'Google Workspace'],
    cadencia: 'mensual',
    ivaHabitual: 0,
    notes: 'Inversió del subjecte passiu: empresa irlandesa, la factura no porta IVA espanyol.'
  }),
  proveidor({
    clau: 'som-energia',
    nom: 'Som Energia, SCCL',
    nif: 'F55091367',
    pais: 'ES',
    dominis: ['somenergia.coop'],
    patronsFitxer: [/^(factura_)?FE\d{10}\.pdf$/i],
    patronsNum: [/FE\d{10}/],
    paraulesText: ['Som Energia'],
    cadencia: 'mensual',
    ivaHabitual: null,
    notes: "L'IVA de l'electricitat ha variat (21 %, 10 %, 5 %): no se'n fixa cap d'habitual."
  }),
  proveidor({
    clau: 'lowi',
    nom: 'Vodafone España S.A.U. (Lowi)',
    nif: 'A80907397',
    pais: 'ES',
    dominis: ['lowi.es', 'vodafone.es'],
    patronsFitxer: [/lowi/i],
    patronsNum: [/CI\d{14}/],
    paraulesText: ['Lowi', 'Vodafone España'],
    cadencia: 'mensual',
    ivaHabitual: 21,
    notes: "Els rebuts poden vindre d'una altra societat del grup: quan una factura en confirme el NIF, va a nifsAlternatius."
  }),
  proveidor({
    clau: 'siteground',
    nom: 'SiteGround Spain S.L.',
    nif: 'B87194171',
    pais: 'ES',
    dominis: ['siteground.com', 'siteground.es'],
    patronsFitxer: [/siteground/i],
    paraulesText: ['SiteGround'],
    cadencia: 'anual',
    ivaHabitual: 21
  }),
  proveidor({
    clau: 'dondominio',
    nom: 'Soluciones Corporativas IP, S.L. (DonDominio)',
    nif: 'B57333601',
    pais: 'ES',
    dominis: ['dondominio.com'],
    patronsFitxer: [/dondominio/i],
    patronsNum: [/DD\d{4}-\d+/],
    paraulesText: ['DonDominio', 'Soluciones Corporativas IP'],
    cadencia: 'anual',
    ivaHabitual: 21
  }),
  proveidor({
    clau: 'adobe',
    nom: 'Adobe Systems Software Ireland Ltd',
    nif: 'IE6364992H',
    pais: 'IE',
    dominis: ['adobe.com'],
    patronsFitxer: [/adobe/i],
    paraulesText: ['Adobe'],
    cadencia: 'mensual',
    ivaHabitual: 0,
    notes: 'Empresa irlandesa: sense IVA espanyol si la compra es fa amb NIF-IVA (inversió del subjecte passiu).'
  }),
  proveidor({
    clau: 'fal-ai',
    nom: 'fal.ai',
    pais: 'US',
    dominis: ['fal.ai'],
    patronsFitxer: [/^fal-(invoice|receipt)/i],
    paraulesText: ['fal.ai'],
    notes: 'Empresa dels Estats Units.'
  }),
  proveidor({
    clau: 'sollutia',
    nom: 'Sollutia',
    patronsFitxer: [/-sollutia\.pdf$/i],
    paraulesText: ['Sollutia']
  }),
  proveidor({ clau: 'iberdrola', nom: 'Iberdrola', dominis: ['iberdrola.es', 'iberdrola.com'], patronsFitxer: [/iberdrola/i], paraulesText: ['Iberdrola'] }),
  proveidor({ clau: 'endesa', nom: 'Endesa', dominis: ['endesa.com'], patronsFitxer: [/endesa/i], paraulesText: ['Endesa'] }),
  proveidor({
    clau: 'movistar',
    nom: 'Telefónica (Movistar)',
    dominis: ['movistar.es', 'telefonica.com'],
    patronsFitxer: [/movistar/i, /telef[oó]nica/i],
    paraulesText: ['Movistar', 'Telefónica'],
    cadencia: 'mensual'
  }),
  proveidor({ clau: 'orange', nom: 'Orange', dominis: ['orange.es'], patronsFitxer: [/orange/i], paraulesText: ['Orange'], cadencia: 'mensual' }),
  proveidor({ clau: 'amazon', nom: 'Amazon', dominis: ['amazon.es', 'amazon.com'], patronsFitxer: [/amazon/i], paraulesText: ['Amazon'], cadencia: 'puntual' }),
  proveidor({ clau: 'apple', nom: 'Apple', dominis: ['apple.com'], patronsFitxer: [/apple/i], paraulesText: ['Apple'] }),
  proveidor({ clau: 'microsoft', nom: 'Microsoft', dominis: ['microsoft.com'], patronsFitxer: [/microsoft/i], paraulesText: ['Microsoft'] }),
  proveidor({ clau: 'openai', nom: 'OpenAI', dominis: ['openai.com'], patronsFitxer: [/openai/i], paraulesText: ['OpenAI'] }),
  proveidor({
    clau: 'anthropic',
    nom: 'Anthropic',
    pais: 'IE',
    dominis: ['anthropic.com'],
    patronsFitxer: [/anthropic/i],
    paraulesText: ['Anthropic'],
    notes: "A la Unió Europea factura la seua societat d'Irlanda."
  }),
  proveidor({ clau: 'github', nom: 'GitHub', dominis: ['github.com'], patronsFitxer: [/github/i], paraulesText: ['GitHub'] }),
  proveidor({ clau: 'cloudflare', nom: 'Cloudflare', dominis: ['cloudflare.com'], patronsFitxer: [/cloudflare/i], paraulesText: ['Cloudflare'] }),
  proveidor({ clau: 'ionos', nom: 'IONOS', dominis: ['ionos.es', 'ionos.com'], patronsFitxer: [/ionos/i], paraulesText: ['IONOS'] }),
  proveidor({ clau: 'hostinger', nom: 'Hostinger', dominis: ['hostinger.es', 'hostinger.com'], patronsFitxer: [/hostinger/i], paraulesText: ['Hostinger'] }),
  proveidor({ clau: 'ovhcloud', nom: 'OVHcloud', dominis: ['ovhcloud.com', 'ovh.com', 'ovh.es'], patronsFitxer: [/ovh/i], paraulesText: ['OVHcloud', 'OVH'] }),
  proveidor({ clau: 'digitalocean', nom: 'DigitalOcean', dominis: ['digitalocean.com'], patronsFitxer: [/digital-?ocean/i], paraulesText: ['DigitalOcean'] })
]);

/* L'amfitrió d'un domini, correu («Nom <compte@domini>») o URL: minúscules, sense www. */
function amfitrioDe(text) {
  let s = String(text ?? '').trim().toLowerCase();
  const arroba = s.lastIndexOf('@');
  if (arroba >= 0) s = s.slice(arroba + 1);
  s = s.replace(/^[a-z][a-z0-9+.-]*:\/\//, '');
  return s.split(/[/?:>\s]/)[0].replace(/\.$/, '').replace(/^www\./, '');
}

/**
 * El proveïdor d'un domini, correu o URL (també dels subdominis), o null.
 * Si en casen diversos, guanya el domini més llarg.
 */
export function proveidorPerDomini(domini) {
  const amfitrio = amfitrioDe(domini);
  if (!amfitrio) return null;
  let millor = null;
  let llargaria = 0;
  for (const p of CATALEG_PROVEIDORS) {
    for (const d of p.dominis) {
      if ((amfitrio === d || amfitrio.endsWith(`.${d}`)) && d.length > llargaria) {
        millor = p;
        llargaria = d.length;
      }
    }
  }
  return millor;
}

/** Tots els NIF d'un proveïdor normalitzats: el principal (si en té) i els alternatius. */
export const nifsDelProveidor = (p) => [p?.nif, ...(p?.nifsAlternatius ?? [])].map(normalitzaNif).filter(Boolean);

/**
 * El proveïdor d'un NIF (normalitzat: amb o sense «ES», guions o espais), o
 * null. Casa amb el NIF principal i amb els alternatius.
 * @param {string} nif
 * @param {object[]} [cataleg] per defecte, CATALEG_PROVEIDORS
 */
export function proveidorPerNif(nif, cataleg = CATALEG_PROVEIDORS) {
  const n = normalitzaNif(nif);
  if (!n) return null;
  return (cataleg ?? []).find((p) => nifsDelProveidor(p).includes(n)) ?? null;
}

/** El primer proveïdor del catàleg amb un patró que casa amb el nom del fitxer (sense carpetes), o null. */
export function proveidorPerNomFitxer(nom) {
  const base = String(nom ?? '').split(/[\\/]/).pop().trim();
  if (!base) return null;
  return CATALEG_PROVEIDORS.find((p) => p.patronsFitxer.some((patro) => patro.test(base))) ?? null;
}
