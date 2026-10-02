/**
 * nif.js — identificadors fiscals de factura: DNI, NIE, CIF i NIF-IVA de la UE.
 *
 * Els espanyols es validen amb el dígit o la lletra de control. Els NIF-IVA
 * d'altres països de la UE només es validen de forma (prefix de país i de 2 a
 * 12 caràcters alfanumèrics amb almenys una xifra): la comprovació de debò és
 * de VIES, i això és xarxa, fora d'aquest nucli. JS pur: sense DOM ni React.
 */

const LLETRES_DNI = 'TRWAGMYFPDXBNJZSQVHLCKE';
const LLETRES_CONTROL_CIF = 'JABCDEFGHI';
/* Organitzacions que porten sempre lletra de control, i societats que porten sempre xifra. */
const CIF_AMB_LLETRA = 'NPQRSW';
const CIF_AMB_XIFRA = 'ABEH';
const PAISOS_UE = new Set([
  'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'EL', 'ES', 'FI', 'FR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV',
  'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK', 'XI'
]);

const DNI = /^(\d{8})([A-Z])$/;
const NIE = /^([XYZ])(\d{7})([A-Z])$/;
const CIF = /^([ABCDEFGHJNPQRSUVW])(\d{7})([0-9A-J])$/;
const IVA_UE = /^([A-Z]{2})([A-Z0-9]{2,12})$/;
/* La forma d'un NIF espanyol, per a saber si «ES» és un prefix d'IVA que es pot llevar. */
const FORMA_ESPANYOLA = /^(?:\d{8}[A-Z]|[XYZ]\d{7}[A-Z]|[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J])$/;

/**
 * Majúscules, sense espais (també els durs), punts ni guions; i sense el
 * prefix «ES» quan el que ve darrere té forma de NIF espanyol.
 * @param {string} text
 * @returns {string}
 */
export function normalitzaNif(text) {
  if (text == null) return '';
  const net = String(text).toUpperCase().replace(/[\s.-]/g, '');
  return net.startsWith('ES') && FORMA_ESPANYOLA.test(net.slice(2)) ? net.slice(2) : net;
}

/* Dígit de control d'un CIF: les posicions senars (1a, 3a, 5a, 7a) es doblen i se'n sumen les xifres. */
function controlCif(xifres) {
  let suma = 0;
  for (let i = 0; i < 7; i += 1) {
    const n = Number(xifres[i]);
    if (i % 2 === 0) {
      const doble = n * 2;
      suma += Math.floor(doble / 10) + (doble % 10);
    } else {
      suma += n;
    }
  }
  return (10 - (suma % 10)) % 10;
}

function cifValid(lletra, xifres, control) {
  const c = controlCif(xifres);
  const ambXifra = control === String(c);
  const ambLletra = control === LLETRES_CONTROL_CIF[c];
  if (CIF_AMB_LLETRA.includes(lletra)) return ambLletra;
  if (CIF_AMB_XIFRA.includes(lletra)) return ambXifra;
  return ambXifra || ambLletra;
}

/**
 * Valida un identificador fiscal.
 * @param {string} text
 * @returns {{ valid: boolean, tipus: 'DNI'|'NIE'|'CIF'|'IVA-UE'|'desconegut', normalitzat: string }}
 */
export function validaNif(text) {
  const normalitzat = normalitzaNif(text);
  const resultat = (valid, tipus) => ({ valid, tipus, normalitzat });
  let r = DNI.exec(normalitzat);
  if (r) return resultat(LLETRES_DNI[Number(r[1]) % 23] === r[2], 'DNI');
  r = NIE.exec(normalitzat);
  if (r) return resultat(LLETRES_DNI[Number(`${'XYZ'.indexOf(r[1])}${r[2]}`) % 23] === r[3], 'NIE');
  r = CIF.exec(normalitzat);
  if (r) return resultat(cifValid(r[1], r[2], r[3]), 'CIF');
  r = IVA_UE.exec(normalitzat);
  if (r && PAISOS_UE.has(r[1]) && /\d/.test(r[2])) {
    /* Un «ES» que no s'ha pogut llevar no té forma de NIF espanyol: no és vàlid. */
    return resultat(r[1] !== 'ES', 'IVA-UE');
  }
  return resultat(false, 'desconegut');
}
