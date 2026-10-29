/**
 * xifratXatRecuperacio.js — la recuperació social dels xats privats (IDEA-48):
 * Shamir amb k = 3 sobre GF(2⁸), els formats del cercle i dels dos sobres
 * (aval i alliberament) i la verificació SAS amb compromís (P1-12 / IDEA-19;
 * disseny final §5.6 i pas 5 de §16: `_investigacio_ia_de_poble/
 * 261028_2330_p112_e2ee_claude/disseny_final_e2ee.md`; esmenes_qa_261029.md §5
 * (nivells de revocació), §6 (sobre d'alliberament), §7 («No sóc jo», només el
 * format SDPN), §8 (pressupost i comprovació lineal), §9 (Shamir exacte i
 * vectors) i §13.1 (R2, R6 i R7)). Quan el disseny i les esmenes difereixen,
 * manen les esmenes.
 *
 * JS pur sobre les primitives de xifratXatCripto.js: sense DOM, React,
 * emmagatzematge ni xarxa, i sense cap consumidor encara (no activa res). Cada
 * funció rep l'objecte `cripto` injectat, com al cofre; ningú d'ací el pren de
 * cap global. El número de seguretat, les fixacions, la frase i la còpia, i la
 * màquina d'estats de la petició (gestos, comptadors, estats) són del protocol
 * (xifratXatProtocol.js) i de F7: ací només hi ha l'aritmètica, els bytes i les
 * comprovacions que es poden fer amb els bytes sols.
 *
 * Què hi ha:
 *   · GF(2⁸) d'AES, m(X) = X⁸ + X⁴ + X³ + X + 1 (0x11B, FIPS-197 §4.2): suma
 *     (XOR), producte «camperol rus» amb la reducció 0x1B per màscares (cap
 *     bifurcació sobre cap operand, cap taula indexada per bytes secrets) i
 *     invers a⁻¹ = a²⁵⁴ amb una cadena fixa de quadrats i productes; 0 dona 0 i
 *     no llança res: que 0 no té invers el fa complir la validació dels índexs
 *     (x ≠ 0 i distints, valors públics) abans de cap divisió (esmenes §9.1);
 *   · Shamir exacte (§5.6.1): per a cada byte b de RK, f_b(X) = s_b ⊕ a₁X ⊕ a₂X²
 *     amb 64 B de coeficients nous del `cripto` a cada repartiment (uniformes,
 *     0 inclòs); x = 1..n en l'ordre dels amics; fragment = x ‖ y (33 B);
 *     Combinar per Lagrange en 0 amb tres punts; Comprovar amb la comprovació
 *     lineal de les esmenes §8.3 (cada punt de més ha de donar la mateixa RK
 *     que els tres primers), equivalent a enumerar totes les ternes;
 *   · els formats binaris de les esmenes §6 (màgia ASCII i versió 0x01, mides
 *     exactes): SDPH (info de l'aval, 87 B), SDPV (la T de la verificació,
 *     175 B), SDPP (compromís, 69 B), SDPO (aprovació A, 133 B), SDPL (info de
 *     l'alliberament, 175 B), SDPC (declaració del cercle, 83 + 97·n B) i SDPN
 *     («No sóc jo», 61 B), i la càrrega de l'alliberament (fragment ‖ σA, 97 B);
 *   · l'aval (HPKE SealBase a la clau DH de l'amic amb info = SDPH i AAD buida,
 *     49 B) i el seu envHash; el compromís hF = SHA-256(SDPH ‖ fragment);
 *     l'alliberament (SealBase a l'EPK amb info = SDPL i AAD = A, 113 B), que
 *     l'aparell nou només obri amb el codi de tornada de l'amic (R7) i amb la
 *     σA vàlida;
 *   · la verificació SAS amb compromís (esmenes §4): cD = SHA-256(SDPP), i el
 *     codi i la tornada de 6 xifres per HKDF-SHA256 amb hT de sal;
 *   · recuperaRk: la reconstrucció autenticada (§5.6.6) de 3 a 8 alliberaments
 *     ja oberts: cap repartiment barrejat, cap amic ni x repetit, hF de
 *     cadascun, consistència i Combinar amb els tres primers. Obrir la còpia amb
 *     la RK i comprovar el kid és de qui crida (§5.1).
 * Els errors porten un codi estable (errorAmbCodi); els de format són
 * FORMAT_INVALID amb `format`, `camp` i `motiu`, com a xifratXatFormats.js.
 *
 * Higiene de memòria, honesta: els coeficients, els fragments i la RK són
 * Uint8Array que es posen a zero en acabar o en fallar (esborraBytes), i
 * l'aparell de la persona no guarda mai coeficients ni fragments (R2), ni el de
 * l'amic (R6). JavaScript no garantix res més: els Number intermedis del
 * producte, les còpies internes del motor i els bytes de qui crida no s'hi poden
 * tocar.
 */
import {
  ajunta, aleatori, bytesIguals, errorAmbCodi, esPuntP256, exigixCripto, hkdfExpand, hkdfExtract, infoHkdf, obriBase, segellaBase,
  sha256, verificaSignatura
} from './xifratXatCripto.js';

export const VERSIO_FORMAT = 1;
/* k = 3 fix (DM-7, D-14 a); n d'amics de 3 a 255 (el CHECK `n between k and 255`). */
export const LLINDAR = 3;
export const MIN_AMICS = 3;
export const MAX_AMICS = 255;
/* El pressupost de §5.6.6: 8 alliberaments vàlids per petició, 16 processats comptant els descartats. */
export const MAX_ALLIBERAMENTS_VALIDS = 8;
export const MAX_ALLIBERAMENTS_PROCESSATS = 16;
/* La petició caduca com a molt 2 h després de crear-se (§5.6.2, CHECK `caduca_ms <= creat_ms + 7200000`). */
export const MAX_CADUCITAT_MS = 7200000;
export const BYTES_RK = 32;
export const BYTES_FRAGMENT = 33;
export const BYTES_NONCE_SAS = 32;
export const BYTES_CT_AVAL = 49;
export const BYTES_CARREGA_ALLIBERAMENT = 97;
export const BYTES_CT_ALLIBERAMENT = 113;
export const XIFRES_CODI = 6;
/* El polinomi d'AES (FIPS-197 §4.2) i la seua reducció d'un byte. */
export const POLINOMI_GF = 0x11b;
const REDUCCIO = 0x1b;

/* Les màgies de les esmenes (disseny §4.1, llista del 261029). */
export const MAGIES_RECUPERACIO = Object.freeze({
  infoAval: 'SDPH', verificacio: 'SDPV', compromis: 'SDPP', aprovacio: 'SDPO', infoAlliberament: 'SDPL',
  declaracio: 'SDPC', noSocJo: 'SDPN'
});
/* Les etiquetes HKDF de §5.6.2 (infoHkdf hi posa «sdp-xat-v1/» davant i 0x00 darrere). */
export const ETIQUETES_SAS = Object.freeze({ codi: 'sas-recuperacio', tornada: 'sas-tornada' });

const BUIT = new Uint8Array(0);
const MODUL_CODI = 1000000n;
const FORMA_CODI = /^\d{6}$/;

/* ── Errors ────────────────────────────────────────────────────────────── */

/* FORMAT_INVALID amb `motiu` (tipus, magia, versio, truncat, sobrants, mida, rang, no-canonic,
   desordenat, duplicat, desconegut o falta), `format` i `camp`, com a xifratXatFormats.js. */
function rebuig(motiu, missatge, camp = null) {
  return Object.assign(errorAmbCodi('FORMAT_INVALID', missatge), { motiu, format: null, camp });
}

function situa(error, format, camp) {
  if (error?.codi === 'FORMAT_INVALID') {
    error.format ??= format;
    error.camp ??= camp;
  }
  return error;
}

function enCamp(format, camp, fn) {
  try {
    return fn();
  } catch (error) {
    throw situa(error, format, camp);
  }
}

/* ── Bytes ─────────────────────────────────────────────────────────────── */

const ascii = (text) => Uint8Array.from(text, (c) => c.charCodeAt(0));
const esBytes = (valor) => Object.prototype.toString.call(valor) === '[object Uint8Array]';
const esZeros = (bytes) => bytes.every((byte) => byte === 0);
const copiaDe = (bytes) => new Uint8Array(bytes);
const esObjectePla = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor)
  && [Object.prototype, null].includes(Object.getPrototypeOf(valor));
/* Només una propietat pròpia: res heretat d'un prototip contaminat. */
const propi = (objecte, clau) => (Object.hasOwn(objecte, clau) ? objecte[clau] : undefined);

/** Posa a zero els Uint8Array que rep (els que no ho són s'ignoren). Millor esforç: JS no garantix res més. */
export function esborraBytes(...buffers) {
  for (const buffer of buffers) if (esBytes(buffer)) buffer.fill(0);
}

function exigixBytes(valor, mida) {
  if (!esBytes(valor)) throw rebuig('tipus', 'Calen bytes (Uint8Array).');
  if (valor.length !== mida) throw rebuig('mida', `Calen ${mida} bytes, no ${valor.length}.`);
  return valor;
}

function noZeros(bytes) {
  if (esZeros(bytes)) throw rebuig('no-canonic', 'Tot zeros vol dir «absent», i ací cal un valor.');
  return bytes;
}

function aEnter(valor, mida) {
  const eixida = new Uint8Array(mida);
  let resta = valor;
  for (let i = mida - 1; i >= 0; i -= 1) {
    eixida[i] = resta % 256;
    resta = Math.floor(resta / 256);
  }
  return eixida;
}

/* null si no cap en un enter segur (2⁵³ − 1). */
function deEnter(bytes) {
  if (bytes.length === 8 && (bytes[0] !== 0 || bytes[1] > 0x1f)) return null;
  let valor = 0;
  for (const byte of bytes) valor = valor * 256 + byte;
  return valor;
}

function exigixClaus(valors, permeses, requerides) {
  if (!esObjectePla(valors)) throw rebuig('tipus', 'Calen els valors en un objecte.');
  for (const clau of Object.keys(valors)) if (!permeses.includes(clau)) throw rebuig('desconegut', `Camp desconegut: ${clau}.`, clau);
  for (const clau of requerides) if (propi(valors, clau) === undefined) throw rebuig('falta', `Falta el camp ${clau}.`, clau);
}

/* ── uuid16 (canònic en minúscules; el nul vol dir «absent») ───────────── */

const FORMA_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function uuidABytes(uuid) {
  if (typeof uuid !== 'string' || !FORMA_UUID.test(uuid)) throw rebuig('no-canonic', 'Un uuid va en la forma canònica, en minúscules.');
  const hex = uuid.replaceAll('-', '');
  return noZeros(Uint8Array.from(hex.match(/../g), (parell) => Number.parseInt(parell, 16)));
}

function uuidDeBytes(bytes) {
  noZeros(exigixBytes(bytes, 16));
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** El repartiment16 (§5.6.1): un uuid v4 del generador de `cripto`, generat pel client. */
export function generaRepartiment(cripto) {
  const bytes = aleatori(cripto, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return uuidDeBytes(bytes);
}

/* ── GF(2⁸) = GF(2)[X] / (X⁸ + X⁴ + X³ + X + 1) (esmenes §9.1) ─────────── */

function exigixElement(valor) {
  if (!Number.isInteger(valor) || valor < 0 || valor > 255) throw new TypeError('Un element de GF(2⁸) és un enter de 0 a 255.');
  return valor;
}

/** La suma del cos: XOR. */
export function gfSuma(a, b) {
  return exigixElement(a) ^ exigixElement(b);
}

/**
 * El producte «camperol rus» amb la reducció per 0x1B. Sempre 8 voltes i cap
 * bifurcació sobre els bits de cap operand: cada bit selecciona per màscara
 * (−(p & 1) és 0 o tot uns) i la reducció també (−(s >> 7)). El `& 0xff`
 * manté `s` dins del byte: sense ell, un Number se n'ix (§5.6.1, tercera
 * passada).
 */
export function gfMul(a, b) {
  let s = exigixElement(a);
  let p = exigixElement(b);
  let r = 0;
  for (let i = 0; i < 8; i += 1) {
    r ^= s & -(p & 1);
    s = ((s << 1) & 0xff) ^ (REDUCCIO & -(s >> 7));
    p >>= 1;
  }
  return r;
}

/**
 * L'invers a⁻¹ = a²⁵⁴ (a²⁵⁵ = 1 per a a ≠ 0): a² ‖ a⁴ ‖ … ‖ a¹²⁸ per quadrats
 * successius, tots multiplicats, sempre els mateixos 13 productes. 0 dona 0
 * (0²⁵⁴ = 0) i no llança res: 0 no té invers i ho rebutja la validació dels
 * índexs, que són públics, abans de cap divisió.
 */
export function gfInv(a) {
  let quadrat = gfMul(a, a);
  let r = quadrat;
  for (let i = 0; i < 6; i += 1) {
    quadrat = gfMul(quadrat, quadrat);
    r = gfMul(r, quadrat);
  }
  return r;
}

/* ── Shamir exacte (§5.6.1, esmenes §9) ────────────────────────────────── */

const fragmentInvalid = (motiu) => errorAmbCodi('FRAGMENT_INVALID', `Un fragment són 33 bytes, x ‖ y (${motiu}).`);
const indexInvalid = () => errorAmbCodi('INDEX_INVALID', 'L’índex x d’un fragment va d’1 a 255: 0 és el secret.');

function exigixRk(rk) {
  if (!esBytes(rk) || rk.length !== BYTES_RK) throw errorAmbCodi('RK_INVALIDA', 'La RK que es repartix són 32 bytes.');
  return rk;
}

function exigixNombreAmics(n) {
  if (!Number.isSafeInteger(n) || n < MIN_AMICS || n > MAX_AMICS) {
    throw errorAmbCodi('AMICS_FORA_DE_RANG', `Un cercle té de ${MIN_AMICS} a ${MAX_AMICS} amics.`);
  }
  return n;
}

/** Un fragment ben format: 33 B i x ≠ 0. Torna { x, y } amb `y` com a VISTA del fragment (cap còpia secreta més). */
export function llegixFragment(fragment) {
  if (!esBytes(fragment)) throw fragmentInvalid('tipus');
  if (fragment.length !== BYTES_FRAGMENT) throw fragmentInvalid('mida');
  if (fragment[0] === 0) throw indexInvalid();
  return Object.freeze({ x: fragment[0], y: fragment.subarray(1) });
}

/* Els fragments d'una combinació: ben formats i amb els x distints. */
function exigixFragments(fragments) {
  if (!Array.isArray(fragments)) throw new TypeError('Els fragments van en una llista.');
  const vistos = new Set();
  return Array.from(fragments, (fragment) => {
    const llegit = llegixFragment(fragment);
    if (vistos.has(llegit.x)) throw errorAmbCodi('INDEX_REPETIT', 'Dos fragments amb el mateix x no es poden combinar.');
    vistos.add(llegit.x);
    return llegit;
  });
}

/**
 * Repartix una RK de 32 B en n fragments (x = 1..n), amb k = 3: per a cada byte,
 * f(X) = s ⊕ a₁X ⊕ a₂X² avaluat per Horner, amb 64 B de coeficients del `cripto`
 * (una sola crida, nous a cada repartiment, mai derivats de RK). Els coeficients
 * es posen a zero en acabar; els fragments els posa a zero qui crida
 * (esborraBytes) quan els ha segellat. RK_INVALIDA, AMICS_FORA_DE_RANG.
 * @returns {Uint8Array[]} n fragments de 33 B.
 */
export function reparteixRk(cripto, rk, n) {
  exigixRk(rk);
  exigixNombreAmics(n);
  const coeficients = aleatori(cripto, 2 * BYTES_RK);
  try {
    const fragments = [];
    for (let x = 1; x <= n; x += 1) {
      const fragment = new Uint8Array(BYTES_FRAGMENT);
      fragment[0] = x;
      for (let b = 0; b < BYTES_RK; b += 1) {
        // Horner: ((a₂·x) ⊕ a₁)·x ⊕ s; l'acumulador és secret i x públic.
        fragment[1 + b] = gfMul(gfMul(coeficients[BYTES_RK + b], x) ^ coeficients[b], x) ^ rk[b];
      }
      fragments.push(fragment);
    }
    return fragments;
  } finally {
    coeficients.fill(0);
  }
}

/* Els λ de Lagrange en X = 0 per a tres x distints i no nuls: λ_j = Π_{m≠j} x_m / (x_m ⊕ x_j). Només depenen dels x (públics). */
function lambdes(xs) {
  return xs.map((xj, j) => {
    let numerador = 1;
    let denominador = 1;
    xs.forEach((xm, m) => {
      if (m === j) return;
      numerador = gfMul(numerador, xm);
      denominador = gfMul(denominador, xm ^ xj);
    });
    return gfMul(numerador, gfInv(denominador));
  });
}

/* s_b = ⊕_j λ_j · y_{j,b} sobre els tres punts donats. */
function combina(punts) {
  const l = lambdes(punts.map((punt) => punt.x));
  const rk = new Uint8Array(BYTES_RK);
  for (let b = 0; b < BYTES_RK; b += 1) rk[b] = gfMul(l[0], punts[0].y[b]) ^ gfMul(l[1], punts[1].y[b]) ^ gfMul(l[2], punts[2].y[b]);
  return rk;
}

/**
 * Recompon la RK amb exactament tres fragments de 33 B (Lagrange en 0).
 * LLINDAR_INCORRECTE si no en són tres; FRAGMENT_INVALID, INDEX_INVALID (x = 0)
 * o INDEX_REPETIT si no es poden combinar. Qui crida posa a zero la RK en acabar.
 */
export function recomponRk(fragments) {
  if (!Array.isArray(fragments) || fragments.length !== LLINDAR) {
    throw errorAmbCodi('LLINDAR_INCORRECTE', `Recompondre la RK demana exactament ${LLINDAR} fragments.`);
  }
  return combina(exigixFragments(fragments));
}

/**
 * La comprovació lineal de les esmenes §8.3: amb n ≥ 3 fragments, cada punt a
 * partir del quart ha de donar, combinat amb els dos primers, la mateixa RK que
 * els tres primers. És equivalent, byte a byte, a «totes les ternes donen la
 * mateixa RK» (demostració a §8.3), amb n − 3 combinacions en lloc de C(n, 3).
 * Fals si algun punt no és del mateix polinomi; FRAGMENTS_INSUFICIENTS amb menys
 * de tres, MASSA_FRAGMENTS amb més de 255, i els rebuigs de recomponRk.
 */
export function comprovaConsistencia(fragments) {
  if (!Array.isArray(fragments)) throw new TypeError('Els fragments van en una llista.');
  if (fragments.length < LLINDAR) throw errorAmbCodi('FRAGMENTS_INSUFICIENTS', `La comprovació demana almenys ${LLINDAR} fragments.`);
  if (fragments.length > MAX_AMICS) throw errorAmbCodi('MASSA_FRAGMENTS', `Un repartiment no té més de ${MAX_AMICS} fragments.`);
  const punts = exigixFragments(fragments);
  const referencia = combina(punts.slice(0, LLINDAR));
  try {
    let consistent = true;
    for (let l = LLINDAR; l < punts.length; l += 1) {
      const candidata = combina([punts[0], punts[1], punts[l]]);
      // Sense eixir abans d'hora: totes les ternes es calculen igual.
      consistent = bytesIguals(candidata, referencia) && consistent;
      candidata.fill(0);
    }
    return consistent;
  } finally {
    referencia.fill(0);
  }
}

/* ── Els formats de les esmenes §6: camps de mida fixa, en l'ordre exacte ── */

function exigixPunt(bytes) {
  if (!esPuntP256(bytes)) throw rebuig('no-canonic', 'Una pública va sense comprimir (0x04 ‖ x ‖ y) i sobre la corba P-256.');
  return bytes;
}

const fix = (mida, comprova = (bytes) => bytes) => Object.freeze({
  mida, escriu: (valor) => comprova(exigixBytes(valor, mida)), llig: (bytes) => copiaDe(comprova(bytes))
});
const enter = (mida, minim, maxim) => Object.freeze({
  mida,
  escriu: (valor) => {
    if (!Number.isSafeInteger(valor) || valor < minim || valor > maxim) throw rebuig('rang', `Cal un enter de ${minim} a ${maxim}.`);
    return aEnter(valor, mida);
  },
  llig: (bytes) => {
    const valor = deEnter(bytes);
    if (valor === null || valor < minim || valor > maxim) throw rebuig('rang', `Cal un enter de ${minim} a ${maxim}.`);
    return valor;
  }
});
/* Un byte que sempre val el mateix (k = 3): es pot ometre o donar (un valor llegit es torna a
   construir tal qual), però cap altre valor no val; la lectura el comprova. */
const constant = (valor) => Object.freeze({
  mida: 1, constant: true,
  escriu: (entrada) => {
    if (entrada !== undefined && entrada !== valor) throw rebuig('rang', `Ací sempre va ${valor}.`);
    return Uint8Array.of(valor);
  },
  llig: (bytes) => {
    if (bytes[0] !== valor) throw rebuig('rang', `Ací sempre va ${valor}.`);
    return valor;
  }
});

const CAMP = Object.freeze({
  uuid: Object.freeze({ mida: 16, escriu: uuidABytes, llig: uuidDeBytes }),
  uuidOpcional: Object.freeze({
    mida: 16, opcional: true,
    escriu: (valor) => (valor === null || valor === undefined ? new Uint8Array(16) : uuidABytes(valor)),
    llig: (bytes) => (esZeros(bytes) ? null : uuidDeBytes(bytes))
  }),
  kid: fix(16, noZeros),
  bytes32: fix(32),
  hash: fix(32, noZeros),
  punt: fix(65, exigixPunt),
  index: enter(1, 1, MAX_AMICS),
  llindar: constant(LLINDAR),
  total: enter(1, MIN_AMICS, MAX_AMICS),
  versio: enter(4, 1, 2147483647),
  ms: enter(8, 1, Number.MAX_SAFE_INTEGER)
});

function defineix(magia, camps) {
  const prefix = ajunta(ascii(magia), Uint8Array.of(VERSIO_FORMAT));
  return Object.freeze({
    nom: magia, prefix, camps, entrades: camps.map(([camp]) => camp),
    requerides: camps.filter(([, tipus]) => !tipus.constant && !tipus.opcional).map(([camp]) => camp),
    mida: prefix.length + camps.reduce((total, [, tipus]) => total + tipus.mida, 0)
  });
}

/* Escriu els camps d'un esquema (sense la relectura: la fa `construeix`). */
function escriuCamps(esquema, valors) {
  const { nom, camps, entrades, requerides } = esquema;
  enCamp(nom, null, () => exigixClaus(valors, entrades, requerides));
  return camps.map(([camp, tipus]) => enCamp(nom, camp, () => tipus.escriu(propi(valors, camp))));
}

function construeix(esquema, valors) {
  const bytes = ajunta(esquema.prefix, ...escriuCamps(esquema, valors));
  llegix(esquema, bytes);
  return bytes;
}

/* Màgia, versió i mida exacta; després cada camp. */
function llegixPrefix(esquema, bytes, midaTotal) {
  const { nom, prefix } = esquema;
  const falla = (motiu, missatge, camp = null) => situa(rebuig(motiu, missatge), nom, camp);
  if (!esBytes(bytes)) throw falla('tipus', 'Calen bytes (Uint8Array).');
  if (bytes.length < prefix.length) throw falla('truncat', 'Falten bytes.');
  if (!bytesIguals(bytes.subarray(0, prefix.length - 1), prefix.subarray(0, prefix.length - 1))) throw falla('magia', `No és ${nom}: la màgia no hi és.`);
  if (bytes[prefix.length - 1] !== VERSIO_FORMAT) throw falla('versio', `${nom}: versió desconeguda.`);
  if (midaTotal !== null && bytes.length !== midaTotal) {
    throw falla(bytes.length < midaTotal ? 'truncat' : 'sobrants', bytes.length < midaTotal ? 'Falten bytes.' : 'Sobren bytes al final.');
  }
  return falla;
}

function llegixCamps(esquema, bytes, des, valors) {
  let i = des;
  for (const [camp, tipus] of esquema.camps) {
    const tros = bytes.subarray(i, i + tipus.mida);
    i += tipus.mida;
    valors[camp] = enCamp(esquema.nom, camp, () => tipus.llig(tros));
  }
  return i;
}

function llegix(esquema, bytes) {
  llegixPrefix(esquema, bytes, esquema.mida);
  const valors = {};
  llegixCamps(esquema, bytes, esquema.prefix.length, valors);
  return Object.freeze(valors);
}

const C = CAMP;
/* Els camps de T i d'info_L són els mateixos, en el mateix ordre (esmenes §6.1): només canvia la màgia. */
const CAMPS_VERIFICACIO = Object.freeze([
  ['usuari', C.uuid], ['kid', C.kid], ['repartiment', C.uuid], ['peticio', C.uuid], ['epk', C.punt],
  ['amic', C.uuid], ['kidAmic', C.kid], ['x', C.index], ['caducaMs', C.ms]
]);
const ESQUEMA = Object.freeze({
  /* info_H = "SDPH" ‖ 0x01 ‖ usuari16 ‖ kidP16 ‖ repartiment16 ‖ u8 x ‖ u8 k ‖ amic16 ‖ kidAmic16 (87 B). N no hi va. */
  infoAval: defineix('SDPH', [
    ['usuari', C.uuid], ['kid', C.kid], ['repartiment', C.uuid], ['x', C.index], ['llindar', C.llindar], ['amic', C.uuid], ['kidAmic', C.kid]
  ]),
  /* T = "SDPV" ‖ 0x01 ‖ … ‖ u8 x ‖ u64be(caducaMs) (175 B): el que autentica el SAS (§5.6.2). */
  verificacio: defineix('SDPV', CAMPS_VERIFICACIO),
  /* info_L = "SDPL" ‖ 0x01 ‖ … (175 B): la info de l'alliberament (§5.6.3). */
  infoAlliberament: defineix('SDPL', CAMPS_VERIFICACIO),
  /* El que es fa hash per al compromís: "SDPP" ‖ 0x01 ‖ hT32 ‖ nD32 (69 B). */
  compromis: defineix('SDPP', [['hT', C.hash], ['nD', C.bytes32]]),
  /* A = "SDPO" ‖ 0x01 ‖ hT32 ‖ cD32 ‖ nD32 ‖ nA32 (133 B): l'AAD de l'alliberament i el que signa l'amic. */
  aprovacio: defineix('SDPO', [['hT', C.hash], ['cD', C.hash], ['nD', C.bytes32], ['nA', C.bytes32]]),
  /* La capçalera de SDPC (83 B); darrere, n entrades de 97 B. */
  declaracio: defineix('SDPC', [
    ['usuari', C.uuid], ['kid', C.kid], ['repartiment', C.uuid], ['repartimentAnterior', C.uuidOpcional], ['versio', C.versio],
    ['llindar', C.llindar], ['total', C.total], ['creatMs', C.ms]
  ]),
  /* SDPN = "SDPN" ‖ 0x01 ‖ usuari16 ‖ kidP16 ‖ peticio16 ‖ u64be(ms) (61 B): el que signa l'aparell vell. */
  noSocJo: defineix('SDPN', [['usuari', C.uuid], ['kid', C.kid], ['peticio', C.uuid], ['ms', C.ms]])
});
/* Una entrada de la declaració: amic16 ‖ kidAmic16 ‖ u8 x ‖ envHash32 ‖ hF32 (97 B). */
const ENTRADA_DECLARACIO = Object.freeze({
  nom: 'SDPC',
  camps: Object.freeze([['amic', C.uuid], ['kidAmic', C.kid], ['x', C.index], ['envHash', C.hash], ['hF', C.hash]]),
  mida: 97
});

/** Les mides de les esmenes §6.2 (en bytes). */
export const MIDES_RECUPERACIO = Object.freeze({
  infoAval: ESQUEMA.infoAval.mida, verificacio: ESQUEMA.verificacio.mida, infoAlliberament: ESQUEMA.infoAlliberament.mida,
  compromis: ESQUEMA.compromis.mida, aprovacio: ESQUEMA.aprovacio.mida, capcaleraDeclaracio: ESQUEMA.declaracio.mida,
  entradaDeclaracio: ENTRADA_DECLARACIO.mida, noSocJo: ESQUEMA.noSocJo.mida, fragment: BYTES_FRAGMENT, ctAval: BYTES_CT_AVAL,
  carregaAlliberament: BYTES_CARREGA_ALLIBERAMENT, ctAlliberament: BYTES_CT_ALLIBERAMENT
});
/** 83 + 97·n: la mida d'una declaració amb n amics. */
export const midaDeclaracio = (n) => ESQUEMA.declaracio.mida + ENTRADA_DECLARACIO.mida * exigixNombreAmics(n);

/* SDPH */
export const construeixInfoAval = (valors) => construeix(ESQUEMA.infoAval, valors);
export const llegixInfoAval = (bytes) => llegix(ESQUEMA.infoAval, bytes);
/* SDPV */
export const construeixVerificacio = (valors) => construeix(ESQUEMA.verificacio, valors);
export const llegixVerificacio = (bytes) => llegix(ESQUEMA.verificacio, bytes);
/* SDPL */
export const construeixInfoAlliberament = (valors) => construeix(ESQUEMA.infoAlliberament, valors);
export const llegixInfoAlliberament = (bytes) => llegix(ESQUEMA.infoAlliberament, bytes);
/* SDPP */
export const construeixCompromis = (valors) => construeix(ESQUEMA.compromis, valors);
export const llegixCompromis = (bytes) => llegix(ESQUEMA.compromis, bytes);
/* SDPO */
export const construeixAprovacio = (valors) => construeix(ESQUEMA.aprovacio, valors);
export const llegixAprovacio = (bytes) => llegix(ESQUEMA.aprovacio, bytes);
/* SDPN */
export const construeixNoSocJo = (valors) => construeix(ESQUEMA.noSocJo, valors);
export const llegixNoSocJo = (bytes) => llegix(ESQUEMA.noSocJo, bytes);

/* Les entrades de SDPC: x estrictament creixent (l'ordre de la declaració) i cap amic repetit. */
function comprovaAmicsDeclaracio(amics) {
  const vistos = new Set();
  amics.forEach((entrada, k) => {
    const camp = `amics[${k}]`;
    if (k > 0 && entrada.x <= amics[k - 1].x) throw rebuig('desordenat', 'Els x de la declaració van estrictament creixents.', camp);
    if (vistos.has(entrada.amic)) throw rebuig('duplicat', 'Un amic repetit a la declaració.', camp);
    vistos.add(entrada.amic);
  });
}

/**
 * SDPC: la capçalera (usuari, kid, repartiment, repartimentAnterior o null,
 * versio, creatMs; k = 3 i n = amics.length els posa el format) i n entrades
 * {amic, kidAmic, x, envHash, hF} amb x estrictament creixent i cap amic repetit.
 * 83 + 97·n B. La firma_c (ECDSA de la persona) la posa el protocol.
 */
export function construeixDeclaracio(valors) {
  const esquema = ESQUEMA.declaracio;
  const { nom } = esquema;
  // `total` el posa la llista: es pot ometre o donar (una declaració llegida), però ha de ser n.
  enCamp(nom, null, () => exigixClaus(valors, [...esquema.entrades, 'amics'], [...esquema.requerides.filter((camp) => camp !== 'total'), 'amics']));
  const amics = propi(valors, 'amics');
  if (!Array.isArray(amics)) throw situa(rebuig('tipus', 'Els amics van en una llista.'), nom, 'amics');
  if (amics.length < MIN_AMICS || amics.length > MAX_AMICS) throw situa(rebuig('rang', `De ${MIN_AMICS} a ${MAX_AMICS} amics.`), nom, 'amics');
  const total = propi(valors, 'total');
  if (total !== undefined && total !== amics.length) throw situa(rebuig('incoherent', 'n és el nombre d’amics de la llista.'), nom, 'total');
  const { amics: llista, ...capcalera } = valors;
  const trossos = escriuCamps(esquema, { ...capcalera, total: llista.length });
  const nomsEntrada = ENTRADA_DECLARACIO.camps.map(([camp]) => camp);
  // Array.from i no map: un forat de la llista arriba com a undefined i falla com a tipus.
  const codificades = Array.from(llista, (entrada, k) => {
    enCamp(nom, `amics[${k}]`, () => exigixClaus(entrada, nomsEntrada, nomsEntrada));
    return ENTRADA_DECLARACIO.camps.map(([camp, tipus]) => enCamp(nom, `amics[${k}].${camp}`, () => tipus.escriu(propi(entrada, camp))));
  });
  const bytes = ajunta(esquema.prefix, ...trossos, ...codificades.flat());
  llegixDeclaracio(bytes);
  return bytes;
}

/** SDPC estricte → {usuari, kid, repartiment, repartimentAnterior, versio, llindar, total, creatMs, amics}. */
export function llegixDeclaracio(bytes) {
  const esquema = ESQUEMA.declaracio;
  const falla = llegixPrefix(esquema, bytes, null);
  if (bytes.length < esquema.mida) throw falla('truncat', 'Falten bytes.');
  const valors = {};
  let i = llegixCamps(esquema, bytes, esquema.prefix.length, valors);
  const total = esquema.mida + ENTRADA_DECLARACIO.mida * valors.total;
  if (bytes.length !== total) throw falla(bytes.length < total ? 'truncat' : 'sobrants', bytes.length < total ? 'Falten bytes.' : 'Sobren bytes al final.', 'amics');
  const amics = [];
  for (let k = 0; k < valors.total; k += 1) {
    const entrada = {};
    for (const [camp, tipus] of ENTRADA_DECLARACIO.camps) {
      const tros = bytes.subarray(i, i + tipus.mida);
      i += tipus.mida;
      entrada[camp] = enCamp(esquema.nom, `amics[${k}].${camp}`, () => tipus.llig(tros));
    }
    amics.push(Object.freeze(entrada));
  }
  enCamp(esquema.nom, 'amics', () => comprovaAmicsDeclaracio(amics));
  valors.amics = Object.freeze(amics);
  return Object.freeze(valors);
}

/* ── La càrrega de l'alliberament: fragment33 ‖ σA64 (97 B) ────────────── */

/** pt_L = fragment ‖ σA. FRAGMENT_INVALID / INDEX_INVALID si el fragment no ho és; FORMAT_INVALID si σA no fa 64 B. */
export function construeixCarregaAlliberament({ fragment, firma } = {}) {
  llegixFragment(fragment);
  enCamp('carregaAlliberament', 'firma', () => exigixBytes(firma, 64));
  return ajunta(fragment, firma);
}

/** El contrari, estricte: 97 B → { fragment (33 B, còpia), firma (64 B, còpia) }. */
export function llegixCarregaAlliberament(bytes) {
  enCamp('carregaAlliberament', null, () => exigixBytes(bytes, BYTES_CARREGA_ALLIBERAMENT));
  const fragment = copiaDe(bytes.subarray(0, BYTES_FRAGMENT));
  try {
    llegixFragment(fragment);
  } catch (error) {
    fragment.fill(0);
    throw error;
  }
  return Object.freeze({ fragment, firma: copiaDe(bytes.subarray(BYTES_FRAGMENT)) });
}

/* ── L'aval: el fragment segellat per a l'amic (§5.6.3) ────────────────── */

const sobreInvalid = () => errorAmbCodi('SOBRE_INVALID', 'El sobre no s’ha pogut obrir: no és per a esta clau o l’han manipulat.');
const indexIncoherent = () => errorAmbCodi('INDEX_INCOHERENT', 'L’x del fragment no és el de la declaració ni el de l’info.');

/** hF = SHA-256(info_H ‖ fragment33): el compromís de cada fragment que va a la declaració signada. */
export async function compromisFragment(cripto, infoAval, fragment) {
  const info = esBytes(infoAval) ? infoAval : construeixInfoAval(infoAval);
  const { x } = llegixFragment(fragment);
  if (llegixInfoAval(info).x !== x) throw indexIncoherent();
  const entrada = ajunta(info, fragment);
  try {
    return await sha256(cripto, entrada);
  } finally {
    entrada.fill(0);
  }
}

/**
 * aval = HPKE.SealBase(pkR = IK_dh(amic), info = SDPH, aad = "", pt = fragment33) → ct de 49 B.
 * `infoAval` són els valors de SDPH (o els seus bytes); el seu x ha de ser el del fragment.
 * @returns {Promise<{ enc: Uint8Array, ct: Uint8Array }>}
 */
export async function segellaAval(cripto, { pkR, infoAval, fragment } = {}) {
  const info = esBytes(infoAval) ? infoAval : construeixInfoAval(infoAval);
  const { x } = llegixFragment(fragment);
  if (llegixInfoAval(info).x !== x) throw indexIncoherent();
  return segellaBase(cripto, { pkR, info, aad: BUIT, pt: fragment });
}

/**
 * El contrari, al client de l'amic i només dins d'un alliberament (R6): el
 * fragment de 33 B, amb l'x de l'info. SOBRE_INVALID si el xifrat no fa 49 B o
 * no s'obri; el fragment obert es posa a zero si no és vàlid.
 */
export async function obriAval(cripto, { skR, pkR, enc, ct, infoAval } = {}) {
  const info = esBytes(infoAval) ? infoAval : construeixInfoAval(infoAval);
  const { x } = llegixInfoAval(info);
  if (!esBytes(ct) || ct.length !== BYTES_CT_AVAL) throw sobreInvalid();
  const fragment = await obriBase(cripto, { skR, pkR, enc, info, aad: BUIT, ct });
  try {
    if (llegixFragment(fragment).x !== x) throw indexIncoherent();
  } catch (error) {
    fragment.fill(0);
    throw error;
  }
  return fragment;
}

/** envHash = SHA-256(enc65 ‖ ct49): el de la declaració, que l'amic compara amb el seu aval. */
export async function hashAval(cripto, enc, ct) {
  enCamp('envHash', 'enc', () => exigixPunt(exigixBytes(enc, 65)));
  enCamp('envHash', 'ct', () => exigixBytes(ct, BYTES_CT_AVAL));
  return sha256(cripto, ajunta(enc, ct));
}

/* ── El repartiment sencer: fragments, info i hF per a cada amic ────────── */

/** Posa a zero els fragments d'un repartiment (els de reparteix o una llista de 33 B). */
export function esborraFragments(fragments) {
  for (const entrada of fragments ?? []) esborraBytes(esBytes(entrada) ? entrada : entrada?.fragment);
}

/* Els amics d'un repartiment: de 3 a 255 objectes {amic, kidAmic} i cap amic repetit. */
function exigixAmics(amics) {
  if (!Array.isArray(amics)) throw new TypeError('Els amics van en una llista.');
  exigixNombreAmics(amics.length);
  const vistos = new Set();
  return Array.from(amics, (entrada, k) => {
    enCamp('SDPH', `amics[${k}]`, () => exigixClaus(entrada, ['amic', 'kidAmic'], ['amic', 'kidAmic']));
    const amic = enCamp('SDPH', `amics[${k}].amic`, () => uuidDeBytes(uuidABytes(propi(entrada, 'amic'))));
    if (vistos.has(amic)) throw errorAmbCodi('AMIC_REPETIT', 'Un amic no pot tindre dos fragments del mateix repartiment.');
    vistos.add(amic);
    return { amic, kidAmic: propi(entrada, 'kidAmic') };
  });
}

/**
 * Un repartiment nou de la RK per a un cercle (§5.6.1, R2): genera el
 * repartiment16, assigna x = 1..n en l'ordre dels amics i torna, per a cada
 * amic, el fragment (33 B, secret), l'info SDPH i el seu hF. Qui crida segella
 * cada fragment per a la clau DH de l'amic (segellaAval), posa el hF i
 * l'envHash a la declaració i posa a zero els fragments (esborraFragments):
 * l'aparell no guarda mai coeficients ni fragments. Canviar la clau d'un amic
 * o afegir-ne un és un repartiment nou, mai un segellat nou del mateix fragment.
 * @returns {Promise<{ repartiment: string, fragments: ReadonlyArray<{ x, amic, kidAmic, fragment, infoAval, hF }> }>}
 */
export async function reparteix(cripto, { rk, usuari, kid, amics } = {}) {
  exigixCripto(cripto);
  exigixRk(rk);
  const llista = exigixAmics(amics);
  const repartiment = generaRepartiment(cripto);
  // Primer tots els info (cap secret encara): una entrada mal formada no deixa cap fragment viu.
  const infos = llista.map(({ amic, kidAmic }, k) => construeixInfoAval({ usuari, kid, repartiment, x: k + 1, amic, kidAmic }));
  const fragments = reparteixRk(cripto, rk, llista.length);
  try {
    const eixida = [];
    for (const [k, { amic, kidAmic }] of llista.entries()) {
      const hF = await compromisFragment(cripto, infos[k], fragments[k]);
      eixida.push(Object.freeze({ x: k + 1, amic, kidAmic: copiaDe(kidAmic), fragment: fragments[k], infoAval: infos[k], hF }));
    }
    return Object.freeze({ repartiment, fragments: Object.freeze(eixida) });
  } catch (error) {
    esborraFragments(fragments);
    throw error;
  }
}

/* ── La verificació SAS amb compromís (esmenes §4, §5.6.2) ─────────────── */

/* Els 32 B d'un nonce o d'un hash del SAS, amb el nom del camp a l'error. */
const exigixValor32 = (valor, camp) => enCamp('SAS', camp, () => exigixBytes(valor, 32));

/** hT = SHA-256(T), amb T els bytes de SDPV o els seus valors. */
export async function hashVerificacio(cripto, verificacio) {
  const t = esBytes(verificacio) ? verificacio : construeixVerificacio(verificacio);
  llegixVerificacio(t);
  return sha256(cripto, t);
}

/** cD = SHA-256("SDPP" ‖ 0x01 ‖ hT ‖ nD): el compromís de l'aparell nou, abans de veure nA. */
export async function compromisSas(cripto, { hT, nD } = {}) {
  return sha256(cripto, construeixCompromis({ hT, nD }));
}

/** Si cD és el compromís de (hT, nD): el que comprova l'amic al pas 4 abans de calcular res. */
export async function comprovaCompromisSas(cripto, { hT, nD, cD } = {}) {
  return bytesIguals(await compromisSas(cripto, { hT, nD }), exigixValor32(cD, 'cD'));
}

/* u64be(HKDF-SHA256(ikm = nD ‖ nA, sal = hT, info = "sdp-xat-v1/<etiqueta>" ‖ 0x00, 8)) mod 10⁶, en 6 xifres. */
async function codiDeSas(cripto, etiqueta, { hT, nD, nA }) {
  exigixValor32(hT, 'hT');
  exigixValor32(nD, 'nD');
  exigixValor32(nA, 'nA');
  const ikm = ajunta(nD, nA);
  let prk;
  let okm;
  try {
    prk = await hkdfExtract(cripto, hT, ikm);
    okm = await hkdfExpand(cripto, prk, infoHkdf(etiqueta), 8);
    let n = 0n;
    for (const byte of okm) n = (n << 8n) | BigInt(byte);
    return String(n % MODUL_CODI).padStart(XIFRES_CODI, '0');
  } finally {
    esborraBytes(ikm, prk, okm);
  }
}

/** El codi d'anada (pas 5 de §5.6.2): el mostra l'aparell nou, la persona el dicta i l'amic l'escriu. */
export const codiSas = (cripto, valors = {}) => codiDeSas(cripto, ETIQUETES_SAS.codi, valors);
/** El codi de tornada (pas 7, R7): el mostra l'amic només si el d'anada ha casat; la persona l'escriu a l'aparell nou. */
export const codiTornada = (cripto, valors = {}) => codiDeSas(cripto, ETIQUETES_SAS.tornada, valors);

/** Si el codi escrit és l'esperat: dos textos de 6 xifres comparats byte a byte, sense eixir abans d'hora. */
export function codisIguals(escrit, esperat) {
  if (typeof escrit !== 'string' || typeof esperat !== 'string' || !FORMA_CODI.test(esperat)) return false;
  return FORMA_CODI.test(escrit) && bytesIguals(ascii(escrit), ascii(esperat));
}

/* ── L'alliberament: el fragment tornat a segellar per a l'EPK (§5.6.3) ─── */

/**
 * Al client de l'amic, després del ✅: (enc, ct_L) = HPKE.SealBase(pkR = EPK,
 * info = SDPL, aad = A, pt = fragment33 ‖ σA64) → ct de 113 B. `infoAlliberament`
 * són els valors de SDPL (o els bytes) construïts amb la T de l'amic; `aprovacio`
 * són els 133 B d'A, i `firma` la σA = ECDSA(IK_sig(amic), A) ja feta. L'x del
 * fragment ha de ser el de l'info; l'EPK de l'info ha de ser pkR.
 * @returns {Promise<{ enc: Uint8Array, ct: Uint8Array }>}
 */
export async function segellaAlliberament(cripto, { pkR, infoAlliberament, aprovacio, fragment, firma } = {}) {
  const info = esBytes(infoAlliberament) ? infoAlliberament : construeixInfoAlliberament(infoAlliberament);
  const { x, epk } = llegixInfoAlliberament(info);
  llegixAprovacio(aprovacio);
  const carrega = construeixCarregaAlliberament({ fragment, firma });
  try {
    if (carrega[0] !== x) throw indexIncoherent();
    if (!bytesIguals(epk, pkR)) throw situa(rebuig('incoherent', 'L’EPK de l’info ha de ser la clau a què es segella.'), 'SDPL', 'epk');
    return await segellaBase(cripto, { pkR, info, aad: aprovacio, pt: carrega });
  } finally {
    carrega.fill(0);
  }
}

/**
 * A l'aparell nou, en l'ordre de §5.6.3: (1) la tornada escrita ha de ser la
 * que es deriva de la pròpia A (hT, nD, nA): sense ella no s'obri res
 * (TORNADA_INCORRECTA, R7); (4) s'obri el sobre amb la info i l'AAD pròpies
 * (SOBRE_INVALID); l'x del fragment és el de l'info (INDEX_INCOHERENT); (5) σA
 * verifica amb la clau de signatura de l'amic (SIGNATURA_INVALIDA). El pas 6
 * (hF) i la combinació són de recuperaRk. Si falla després d'obrir, el fragment
 * es posa a zero abans de llançar.
 * @returns {Promise<{ fragment: Uint8Array, firma: Uint8Array }>}
 */
export async function obriAlliberament(cripto, { skR, pkR, enc, ct, infoAlliberament, aprovacio, tornada, sigPubAmic } = {}) {
  const info = esBytes(infoAlliberament) ? infoAlliberament : construeixInfoAlliberament(infoAlliberament);
  const { x, epk } = llegixInfoAlliberament(info);
  const { hT, nD, nA } = llegixAprovacio(aprovacio);
  if (typeof tornada !== 'string') throw new TypeError('La tornada és el text de 6 xifres que ha dictat l’amic.');
  if (!codisIguals(tornada, await codiTornada(cripto, { hT, nD, nA }))) {
    throw errorAmbCodi('TORNADA_INCORRECTA', 'El codi de tornada no és el d’este intent: l’alliberament no s’obri.');
  }
  if (!esBytes(ct) || ct.length !== BYTES_CT_ALLIBERAMENT || !bytesIguals(epk, pkR)) throw sobreInvalid();
  const carrega = await obriBase(cripto, { skR, pkR, enc, info, aad: aprovacio, ct });
  let fragment;
  try {
    ({ fragment } = llegixCarregaAlliberament(carrega));
    const firma = carrega.slice(BYTES_FRAGMENT);
    if (fragment[0] !== x) throw indexIncoherent();
    if (!(await verificaSignatura(cripto, sigPubAmic, firma, aprovacio))) {
      throw errorAmbCodi('SIGNATURA_INVALIDA', 'L’aprovació no està signada per l’amic: l’alliberament es descarta.');
    }
    return { fragment, firma };
  } catch (error) {
    esborraBytes(fragment);
    throw error;
  } finally {
    carrega.fill(0);
  }
}

/* ── La reconstrucció autenticada (§5.6.6, esmenes §8) ─────────────────── */

const CLAUS_ALLIBERAT = Object.freeze(['repartiment', 'amic', 'kidAmic', 'x', 'hF', 'fragment']);

/**
 * La RK a partir de 3 a 8 alliberaments ja oberts (obriAlliberament), cada un
 * amb el repartiment i l'x del seu info, l'amic, el kidAmic i el hF de la
 * declaració vigent, i el fragment. En este ordre: repartiment de la petició
 * (REPARTIMENT_BARREJAT), fragment ben format i x el declarat (FRAGMENT_INVALID,
 * INDEX_INVALID, INDEX_INCOHERENT), hF recalculat amb l'info SDPH
 * (COMPROMIS_INVALID), cap amic ni x repetit (AMIC_REPETIT, INDEX_REPETIT), la
 * comprovació lineal (FRAGMENTS_INCONSISTENTS: s'atura, no es restaura res) i
 * Combinar amb els tres primers. FRAGMENTS_INSUFICIENTS amb menys de tres,
 * MASSA_FRAGMENTS amb més de 8 (el sostre de §5.6.6). Obrir la còpia amb la RK
 * i comprovar el kid és de qui crida, que posa la RK a zero en acabar.
 */
export async function recuperaRk(cripto, { usuari, kid, repartiment, alliberats } = {}) {
  exigixCripto(cripto);
  if (!Array.isArray(alliberats)) throw new TypeError('Els alliberaments van en una llista.');
  if (alliberats.length < LLINDAR) throw errorAmbCodi('FRAGMENTS_INSUFICIENTS', `Calen ${LLINDAR} alliberaments vàlids per a recompondre la RK.`);
  if (alliberats.length > MAX_ALLIBERAMENTS_VALIDS) {
    throw errorAmbCodi('MASSA_FRAGMENTS', `L’aparell nou combina com a molt ${MAX_ALLIBERAMENTS_VALIDS} alliberaments vàlids.`);
  }
  const repartimentPeticio = uuidDeBytes(enCamp('SDPH', 'repartiment', () => uuidABytes(repartiment)));
  const amics = new Set();
  const indexs = new Set();
  const fragments = [];
  for (const [k, entrada] of Array.from(alliberats).entries()) {
    enCamp('alliberament', `alliberats[${k}]`, () => exigixClaus(entrada, CLAUS_ALLIBERAT, CLAUS_ALLIBERAT));
    const propiDe = enCamp('alliberament', `alliberats[${k}].repartiment`, () => uuidDeBytes(uuidABytes(entrada.repartiment)));
    if (propiDe !== repartimentPeticio) throw errorAmbCodi('REPARTIMENT_BARREJAT', 'Un alliberament d’un altre repartiment no es combina.');
    const { x } = llegixFragment(entrada.fragment);
    if (x !== entrada.x) throw indexIncoherent();
    const infoAval = construeixInfoAval({ usuari, kid, repartiment: repartimentPeticio, x, amic: entrada.amic, kidAmic: entrada.kidAmic });
    const hF = await compromisFragment(cripto, infoAval, entrada.fragment);
    if (!bytesIguals(hF, entrada.hF)) throw errorAmbCodi('COMPROMIS_INVALID', 'El fragment no és el que la declaració signada compromet (hF).');
    const amic = llegixInfoAval(infoAval).amic;
    if (amics.has(amic)) throw errorAmbCodi('AMIC_REPETIT', 'Dos alliberaments del mateix amic.');
    if (indexs.has(x)) throw errorAmbCodi('INDEX_REPETIT', 'Dos alliberaments amb el mateix x.');
    amics.add(amic);
    indexs.add(x);
    fragments.push(entrada.fragment);
  }
  if (!comprovaConsistencia(fragments)) {
    throw errorAmbCodi('FRAGMENTS_INCONSISTENTS', 'Els fragments no són d’un sol polinomi: no es restaura res (declaració falsa o error del client).');
  }
  return recomponRk(fragments.slice(0, LLINDAR));
}
