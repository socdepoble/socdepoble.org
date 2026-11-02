/**
 * xifratXatAlta.js — l'alta silenciosa F2a dels xats privats: la identitat
 * extraïble una sola vegada, la `RK`, la còpia xifrada, la frase de 6 paraules,
 * la restauració amb la frase i la frase nova sense canviar d'identitat
 * (P1-12 / IDEA-19; disseny final §4.3, §5.1-§5.4 i §14:
 * `_investigacio_ia_de_poble/261028_2330_p112_e2ee_claude/disseny_final_e2ee.md`;
 * especificació B2d de la marató 261101_2143, `specs/B2-E2EE.md` §2.4).
 *
 * Fitxer a part de xifratXatRecuperacio.js a posta (desviació reversible de
 * §21.9): la prova de puresa d'aquell exigix que només importe
 * xifratXatCripto.js, i així Shamir queda aïllat. Ací s'importen les
 * primitives (xifratXatCripto.js), els bytes de cada format
 * (xifratXatFormats.js) i, amb import() dinàmic, la llista de paraules
 * (xifratXatParaules.js, §5.3).
 *
 * Només el motor: cap pantalla, cap servei, cap xarxa i cap consumidor. No
 * encén res (E2EE_ACTIU_PER_DEFECTE continua false) i no mira el servidor: qui
 * cride creaAlta ha de saber que el compte no té cap identitat activa (si en
 * té, toca restauraAmbFrase; el servidor ho fa complir amb SDP-XAT-041) i mai
 * l'ha de cridar perquè IndexedDB siga buit (QA-E06). L'ordre previst del
 * servei (encara no escrit): creaAlta → cerimònia → publicaIdentitatXat(
 * publicacio) → magatzem.desaIdentitat(ci, identitat). La frase no es dona per
 * bona fins que la publicació ha guanyat (§4.3).
 *
 * Porta de la llista (DM-2): mentre REVISADA_PEL_MESTRE siga false, la llista
 * encara pot canviar paraules d'índex, i una frase escrita ara deixaria
 * d'obrir la còpia. Per això creaAlta i fraseNova fallen amb LLISTA_PENDENT
 * abans de generar res, si no és amb { permetLlistaPendent: true }, que només
 * fan servir les proves.
 *
 * Els formats (§5.1), tots de xifratXatFormats.js:
 *   copia    = 0x01 ‖ d‖x‖y d'IK_sig ‖ d‖x‖y d'IK_dh ‖ K_ll (225 B)
 *   copia_ct = AES-256-GCM(RK, iv, copia, aad = SDPB ‖ usuari16 ‖ kid16) (241 B)
 *   entrada  = SDPR ‖ llistaVersio ‖ 6 índexs de 11 bits (15 B)
 *   KEK_f    = PBKDF2-HMAC-SHA256(entrada, sal16, iteracions) → AES-256-GCM no extraïble
 *   rk_ct    = AES-256-GCM(KEK_f, iv, RK, aad = SDPW ‖ usuari16 ‖ kid16 ‖ iter ‖ sal16) (48 B)
 * La `RK` a l'aparell (D-07 a) va embolcallada amb una clau local `DK` no
 * extraïble i un AAD local «sdp-xat-v1/rk-local» ‖ 0x00 ‖ usuari16 ‖ kid16,
 * que no ix mai de l'aparell.
 *
 * Les iteracions: de 600.000 a 10.000.000, com el cofre i el servidor; les
 * proves en poden baixar el sòl amb { minIteracions }, mai per davall de 1.000.
 * Tot ix abans de cap derivació si estan fora de rang.
 *
 * Errors amb codi estable (CODI_ALTA, i els de baix tal qual: UUID_INVALID,
 * ITERACIONS_FORA_DE_RANG, FORMAT_INVALID…). El text que ve del servidor no
 * entra mai als missatges.
 *
 * Higiene de memòria, honesta (§4.3, QA-E07): la `RK`, `K_ll`, la còpia en
 * clar, l'entrada de la KDF i els escalars privats són Uint8Array que es posen
 * a zero en acabar o en fallar. No es pot esborrar: les cadenes JWK amb «d»
 * (WebCrypto no deriva la pública de «d» ni importa escalars en brut), la
 * llista d'índexs congelada que el constructor de SDPR rellig per a
 * comprovar-se, les CryptoKey extraïbles del primer moment (només es deixen
 * de referenciar) ni les còpies internes del motor.
 */
import {
  BYTES_CLAU, BYTES_IV, BYTES_SAL, ITERACIONS_KDF, MAX_ITERACIONS, MIN_ITERACIONS_PROVES, aBase64url, ajunta, aleatori, bytesIguals,
  deBase64url, desxifraAesGcm, errorAmbCodi, exigixCripto, exigixPuntP256, exportaPublica, generaParellaDh, generaParellaSignatura,
  importaClauAesGcm, infoHkdf, kekPbkdf2, secretDh, signa, uuid16, verificaSignatura, xifraAesGcm
} from './xifratXatCripto.js';
import {
  BYTES_KID, MIDES, PARAULES_FRASE, construeixAadCopia, construeixAadEmbolcallRk, construeixCopia, construeixDeclaracioClau,
  construeixEntradaFrase, kidDe, llegixCopia, llegixDeclaracioClau
} from './xifratXatFormats.js';

/* La versió de la llista que va dins de SDPR; ha de ser la de xifratXatParaules.js. */
export const VERSIO_LLISTA_FRASE = 1;
export const BYTES_RK = BYTES_CLAU;
export const BYTES_COPIA_XIFRADA = 241;
export const BYTES_RK_XIFRADA = 48;
export const KDF_FRASE = 'PBKDF2-HMAC-SHA256';
export const CODI_ALTA = Object.freeze({
  llistaPendent: 'LLISTA_PENDENT', llistaInvalida: 'LLISTA_INVALIDA', indexsInvalids: 'INDEXS_INVALIDS',
  entradaInvalida: 'ENTRADA_INVALIDA', fraseErronia: 'FRASE_ERRONIA', copiaInvalida: 'COPIA_INVALIDA',
  parellaInvalida: 'PARELLA_INVALIDA', registreInvalid: 'REGISTRE_INVALID', rkLocalInvalida: 'RK_LOCAL_INVALIDA'
});

const MASCARA_INDEX = 0x7ff;
const PREFIX_SDPR = Uint8Array.of(0x53, 0x44, 0x50, 0x52, 0x01);
const ETIQUETA_RK_LOCAL = 'rk-local';
const USOS_FIRMA = Object.freeze(['sign']);
const USOS_DH = Object.freeze(['deriveBits']);
const CLAUS_COPIA = Object.freeze(['ct', 'iv', 'rk_ct', 'rk_iv', 'sal', 'iteracions', 'llista']);
/* El servidor hi afig `kdf` i `al` en llegir (xat_la_meua_identitat). */
const CLAUS_COPIA_LLEGIDA = Object.freeze([...CLAUS_COPIA, 'kdf', 'al']);

/* ── Ajudes ────────────────────────────────────────────────────────────── */

const esTipus = (valor, nom) => Object.prototype.toString.call(valor) === `[object ${nom}]`;
const esBytes = (valor) => esTipus(valor, 'Uint8Array');
const esBytesDe = (valor, mida) => esBytes(valor) && valor.length === mida;
const esObjectePla = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor)
  && [Object.prototype, null].includes(Object.getPrototypeOf(valor));
const esObjecte = (valor) => valor !== null && typeof valor === 'object';
const subtleDe = (cripto) => exigixCripto(cripto).subtle;

/* Posa a zero els bytes que es puguen (Uint8Array, Uint16Array…); la resta no es toca. */
function esborra(...trossos) {
  for (const tros of trossos) if (ArrayBuffer.isView(tros) && typeof tros.fill === 'function') tros.fill(0);
}

const error = (codi, missatge, extra = {}) => Object.assign(errorAmbCodi(codi, missatge), extra);
const registreInvalid = (motiu) => error(CODI_ALTA.registreInvalid, 'La identitat que servix el servidor no és vàlida.', { motiu });

/* El sòl d'iteracions de qui crida (600.000 si no en diu cap) i el rang; ITERACIONS_FORA_DE_RANG com el cofre. */
function exigixIteracions(iteracions, minIteracions) {
  const sol = Math.max(MIN_ITERACIONS_PROVES, Number.isSafeInteger(minIteracions) ? Math.min(minIteracions, MAX_ITERACIONS) : ITERACIONS_KDF);
  if (!Number.isSafeInteger(iteracions) || iteracions < sol || iteracions > MAX_ITERACIONS) {
    throw errorAmbCodi('ITERACIONS_FORA_DE_RANG', `Les iteracions de la frase han de ser entre ${sol} i ${MAX_ITERACIONS}.`);
  }
  return sol;
}

function exigixUsuariKid(usuari, kid) {
  uuid16(usuari);
  if (!esBytesDe(kid, BYTES_KID)) throw new TypeError('El kid són 16 bytes.');
}

/* ── La llista de paraules (import() dinàmic, §5.3) ─────────────────────── */

async function carregaParaules() {
  const modul = await import('./xifratXatParaules.js');
  if (modul.VERSIO_LLISTA !== VERSIO_LLISTA_FRASE) {
    throw errorAmbCodi(CODI_ALTA.llistaInvalida, 'La versió de la llista de paraules no és la que espera l’alta.');
  }
  return modul;
}

/* DM-2: cap frase real abans que el Mestre revise la llista. */
async function exigixLlistaRevisada(permetLlistaPendent) {
  const { REVISADA_PEL_MESTRE } = await carregaParaules();
  if (REVISADA_PEL_MESTRE !== true && permetLlistaPendent !== true) {
    throw errorAmbCodi(CODI_ALTA.llistaPendent, 'La llista de paraules encara no l’ha revisada el Mestre: no es genera cap frase.');
  }
}

/** Els sis índexs d'una frase escrita (accents, majúscules i ela geminada no compten); els errors de la llista tal qual. */
export async function indexsDeText(text) {
  const { indexsDeFrase } = await carregaParaules();
  const llista = indexsDeFrase(text);
  try {
    return Uint16Array.from(llista);
  } finally {
    llista.fill(0);
  }
}

/** Les sis paraules d'uns índexs, per a la targeta de la cerimònia (encara no hi ha cap pantalla). */
export async function paraulesDeFrase(indexs) {
  const { paraulesDeIndexs } = await carregaParaules();
  return paraulesDeIndexs(indexs);
}

/* ── La frase (§5.1-§5.2) ──────────────────────────────────────────────── */

/**
 * Sis índexs d'11 bits: un sol getRandomValues de 6 × 16 bits i la màscara
 * 0x7FF, sense biaix perquè 65.536 = 32 × 2.048. Uint16Array perquè qui els
 * mostra els puga posar a zero en acabar.
 */
export function generaIndexsFrase(cripto) {
  const indexs = new Uint16Array(PARAULES_FRASE);
  exigixCripto(cripto).getRandomValues(indexs);
  for (let i = 0; i < indexs.length; i += 1) indexs[i] &= MASCARA_INDEX;
  return indexs;
}

/** L'entrada de la KDF (SDPR, 15 B): la KDF va sobre els índexs, mai sobre el text (M2-c, IS-18). */
export function entradaFrase({ indexs, llistaVersio = VERSIO_LLISTA_FRASE } = {}) {
  if (!Array.isArray(indexs) && !esTipus(indexs, 'Uint16Array')) {
    throw errorAmbCodi(CODI_ALTA.indexsInvalids, `Una frase són ${PARAULES_FRASE} índexs.`);
  }
  const llista = Array.from(indexs);
  try {
    return construeixEntradaFrase({ llistaVersio, indexs: llista });
  } finally {
    llista.fill(0);
  }
}

/**
 * La KEK_f (§5.1): PBKDF2-HMAC-SHA256 sobre una entrada SDPR (mai un text) amb
 * sal de 16 B → AES-256-GCM no extraïble. La derivació costa: 48-177 ms als
 * navegadors de l'M4 i fins a uns segons en un mòbil modest (§5.2).
 */
export async function kekDeFrase(cripto, { entrada, sal, iteracions = ITERACIONS_KDF, minIteracions = ITERACIONS_KDF } = {}) {
  const sol = exigixIteracions(iteracions, minIteracions);
  if (!esBytesDe(entrada, MIDES.entradaFrase) || !bytesIguals(entrada.subarray(0, PREFIX_SDPR.length), PREFIX_SDPR)) {
    throw errorAmbCodi(CODI_ALTA.entradaInvalida, 'La KDF de la frase només deriva una entrada SDPR.');
  }
  return kekPbkdf2(cripto, entrada, sal, { iteracions, minIteracions: sol });
}

const aadEmbolcall = ({ usuari, kid, iteracions, sal }, sol) => construeixAadEmbolcallRk({ usuari, kid, iteracions, sal }, { minIteracions: sol });

/** rk_ct (§5.1): la RK sota la KEK_f, amb les iteracions i la sal dins de l'AAD SDPW. */
export async function embolcallaRk(cripto, { kek, rk, usuari, kid, iteracions = ITERACIONS_KDF, sal, minIteracions = ITERACIONS_KDF } = {}) {
  const sol = exigixIteracions(iteracions, minIteracions);
  exigixUsuariKid(usuari, kid);
  if (!esBytesDe(rk, BYTES_RK)) throw new TypeError('La RK són 32 bytes.');
  const { iv, xifrat } = await xifraAesGcm(cripto, kek, { dades: rk, aad: aadEmbolcall({ usuari, kid, iteracions, sal }, sol) });
  return Object.freeze({ iv, ct: xifrat });
}

/**
 * La RK d'un rk_ct. FRASE_ERRONIA si l'etiqueta no quadra: frase errònia,
 * o sal, iteracions, persona o kid que no són els de l'embolcall (no hi ha
 * paraula de control, §5.2). REGISTRE_INVALID si les mides no hi són.
 */
export async function obriRk(cripto, { kek, iv, ct, usuari, kid, iteracions = ITERACIONS_KDF, sal, minIteracions = ITERACIONS_KDF } = {}) {
  const sol = exigixIteracions(iteracions, minIteracions);
  exigixUsuariKid(usuari, kid);
  if (!esBytesDe(ct, BYTES_RK_XIFRADA) || !esBytesDe(iv, BYTES_IV)) throw registreInvalid('mida');
  const aad = aadEmbolcall({ usuari, kid, iteracions, sal }, sol);
  try {
    return await desxifraAesGcm(cripto, kek, { xifrat: ct, aad, iv });
  } catch (causa) {
    if (causa?.codi === 'XIFRAT_MANIPULAT') throw error(CODI_ALTA.fraseErronia, 'La frase no obri la còpia de recuperació.');
    throw causa;
  }
}

/* ── La còpia (§5.1) i la comprovació de la parella (CS-18) ─────────────── */

/* Una privada P-256 no extraïble des dels seus 3 trossos (d, x, y). La cadena «d» no es pot esborrar. */
async function importaPrivada(cripto, nom, { d, x, y }, usos) {
  const jwk = { kty: 'EC', crv: 'P-256', x: aBase64url(x), y: aBase64url(y), d: aBase64url(d), ext: false };
  return subtleDe(cripto).importKey('jwk', jwk, { name: nom, namedCurve: 'P-256' }, false, [...usos]);
}

/* Les dues privades no extraïbles. Un motor que no les importa (alguns rebutgen una «d» que no és de x, y) és PARELLA_INVALIDA. */
async function importaPrivades(cripto, sig, dh) {
  try {
    return { sigPriv: await importaPrivada(cripto, 'ECDSA', sig, USOS_FIRMA), dhPriv: await importaPrivada(cripto, 'ECDH', dh, USOS_DH) };
  } catch (causa) {
    throw error(CODI_ALTA.parellaInvalida, 'La clau privada no s’importa.', { cause: causa });
  }
}

/* Els trossos d'una JWK privada exportada: d, x i y de 32 B (els que copia la còpia). */
function trossosDeJwk(jwk) {
  if (!esObjecte(jwk) || jwk.kty !== 'EC' || jwk.crv !== 'P-256') throw error(CODI_ALTA.parellaInvalida, 'La clau exportada no és P-256.');
  return { d: deBase64url(jwk.d, 32), x: deBase64url(jwk.x, 32), y: deBase64url(jwk.y, 32) };
}

/**
 * La parella és de veres, amb operacions (WebCrypto no deriva la pública de
 * «d», CS-18): signar un repte i verificar-lo amb la pública, i ECDH contra
 * una efímera en els dos sentits. PARELLA_INVALIDA si no.
 */
export async function comprovaParella(cripto, { sigPriv, sigPub, dhPriv, dhPub } = {}) {
  const falla = (causa) => error(CODI_ALTA.parellaInvalida, 'La clau privada no és la de la pública.', causa === undefined ? {} : { cause: causa });
  let meu;
  let seu;
  try {
    const repte = aleatori(cripto, 32);
    const firma = await signa(cripto, sigPriv, repte);
    if (!(await verificaSignatura(cripto, exigixPuntP256(sigPub), firma, repte))) throw falla();
    const efimera = await generaParellaDh(cripto);
    meu = await secretDh(cripto, dhPriv, await exportaPublica(cripto, efimera.publicKey));
    seu = await secretDh(cripto, efimera.privateKey, exigixPuntP256(dhPub));
    if (!bytesIguals(meu, seu)) throw falla();
    return true;
  } catch (causa) {
    throw causa?.codi === CODI_ALTA.parellaInvalida ? causa : falla(causa);
  } finally {
    esborra(meu, seu);
  }
}

/** copia_ct (§5.1): la còpia en clar (225 B) sota la RK amb l'AAD SDPB; la còpia en clar es posa a zero. */
export async function xifraCopia(cripto, { rk, usuari, kid, sig, dh, kll } = {}) {
  exigixUsuariKid(usuari, kid);
  if (!esObjecte(sig) || !esObjecte(dh)) throw new TypeError('La còpia porta sig i dh, cadascuna amb d, x i y.');
  const copia = construeixCopia({ sigD: sig.d, sigX: sig.x, sigY: sig.y, dhD: dh.d, dhX: dh.x, dhY: dh.y, clauLlibreta: kll });
  try {
    const clau = await importaClauAesGcm(cripto, rk);
    const { iv, xifrat } = await xifraAesGcm(cripto, clau, { dades: copia, aad: construeixAadCopia({ usuari, kid }) });
    return Object.freeze({ iv, ct: xifrat });
  } finally {
    esborra(copia);
  }
}

/**
 * Obri una còpia amb la RK: l'AAD (persona i kid), la forma, el kid recalculat
 * de les públiques de dins i la parella amb operacions. Torna CryptoKey no
 * extraïbles (cap byte secret no ix d'ací): { sigPub, dhPub, sigPriv, dhPriv,
 * clauLlibreta }. COPIA_INVALIDA o PARELLA_INVALIDA si no.
 */
export async function obriCopia(cripto, { rk, iv, ct, usuari, kid } = {}) {
  exigixUsuariKid(usuari, kid);
  const invalida = (causa) => error(CODI_ALTA.copiaInvalida, 'La còpia de recuperació no és d’esta identitat.', causa === undefined ? {} : { cause: causa });
  if (!esBytesDe(ct, BYTES_COPIA_XIFRADA) || !esBytesDe(iv, BYTES_IV)) throw invalida();
  const clau = await importaClauAesGcm(cripto, rk);
  let bytes;
  let valors;
  try {
    try {
      bytes = await desxifraAesGcm(cripto, clau, { xifrat: ct, aad: construeixAadCopia({ usuari, kid }), iv });
      valors = llegixCopia(bytes);
    } catch (causa) {
      throw invalida(causa);
    }
    const sigPub = ajunta(Uint8Array.of(0x04), valors.sigX, valors.sigY);
    const dhPub = ajunta(Uint8Array.of(0x04), valors.dhX, valors.dhY);
    let quadra = false;
    try {
      quadra = bytesIguals(await kidDe(cripto, { usuari, sigPub: exigixPuntP256(sigPub), dhPub: exigixPuntP256(dhPub) }), kid);
    } catch (causa) {
      throw invalida(causa);
    }
    if (!quadra) throw invalida();
    const { sigPriv, dhPriv } = await importaPrivades(cripto, { d: valors.sigD, x: valors.sigX, y: valors.sigY },
      { d: valors.dhD, x: valors.dhX, y: valors.dhY });
    await comprovaParella(cripto, { sigPriv, sigPub, dhPriv, dhPub });
    const clauLlibreta = await importaClauAesGcm(cripto, valors.clauLlibreta);
    return Object.freeze({ sigPub, dhPub, sigPriv, dhPriv, clauLlibreta });
  } finally {
    esborra(bytes);
    if (valors) esborra(...Object.values(valors));
  }
}

/* ── La RK a l'aparell (D-07 a) ────────────────────────────────────────── */

const aadRkLocal = (usuari, kid) => infoHkdf(ETIQUETA_RK_LOCAL, uuid16(usuari), kid);

/* { dk, iv, rk }: la forma de `recuperacio` que desa xifratXatMagatzem.js (rk = la RK xifrada, 48 B). */
async function rkLocalDe(cripto, { rk, usuari, kid }) {
  const dk = await subtleDe(cripto).generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  const { iv, xifrat } = await xifraAesGcm(cripto, dk, { dades: rk, aad: aadRkLocal(usuari, kid) });
  return Object.freeze({ dk, iv, rk: xifrat });
}

async function rkDeLocal(cripto, { rkLocal, usuari, kid }) {
  const invalida = () => errorAmbCodi(CODI_ALTA.rkLocalInvalida, 'La RK d’este aparell no s’obri.');
  if (!esObjecte(rkLocal) || !esObjecte(rkLocal.dk) || !esBytesDe(rkLocal.iv, BYTES_IV) || !esBytesDe(rkLocal.rk, BYTES_RK_XIFRADA)) throw invalida();
  try {
    return await desxifraAesGcm(cripto, rkLocal.dk, { xifrat: rkLocal.rk, aad: aadRkLocal(usuari, kid), iv: rkLocal.iv });
  } catch {
    throw invalida();
  }
}

/* Una frase nova per a una RK: índexs, sal, KEK_f i rk_ct, i la comprovació d'anada i tornada amb la mateixa KEK. */
async function embolcallaAmbFrase(cripto, { rk, usuari, kid, indexs, iteracions, sol }) {
  const sal = aleatori(cripto, BYTES_SAL);
  const entrada = entradaFrase({ indexs });
  let kek;
  try {
    kek = await kekDeFrase(cripto, { entrada, sal, iteracions, minIteracions: sol });
  } finally {
    esborra(entrada);
  }
  const { iv, ct } = await embolcallaRk(cripto, { kek, rk, usuari, kid, iteracions, sal, minIteracions: sol });
  // L'etiqueta GCM ja prova que l'embolcall s'obri amb esta KEK i este AAD (FRASE_ERRONIA si no).
  esborra(await obriRk(cripto, { kek, iv, ct, usuari, kid, iteracions, sal, minIteracions: sol }));
  return Object.freeze({ rk_ct: aBase64url(ct), rk_iv: aBase64url(iv), sal: aBase64url(sal), iteracions, llista: VERSIO_LLISTA_FRASE });
}

/* ── Els tres fluxos de F2a (§5.4) ─────────────────────────────────────── */

function exigixAnterior(anterior, usuari) {
  if (anterior === null) return;
  if (!esObjecte(anterior) || anterior.usuari !== usuari || !esBytesDe(anterior.kid, BYTES_KID) || !esBytes(anterior.sigPub)
    || !esObjecte(anterior.sigPriv)) {
    throw new TypeError('La identitat anterior és del mateix compte i porta kid, sigPub i sigPriv.');
  }
}

/**
 * L'alta (§5.4, primera fila; §4.3): IK_sig i IK_dh extraïbles una sola
 * vegada, la còpia, la RK, K_ll, la frase i la declaració SDPK autofirmada
 * (amb `anterior`, la identitat vella del mateix compte, també la firma de
 * continuïtat). Les privades es tornen a importar no extraïbles.
 * Torna { identitat, publicacio, indexs, rkLocal }:
 *   · identitat: la forma de magatzem.desaIdentitat (no extraïble), amb
 *     recuperacio = rkLocal i clauLlibreta;
 *   · publicacio: els paràmetres de publicaIdentitatXat, en base64url, amb la
 *     còpia {ct, iv, rk_ct, rk_iv, sal, iteracions, llista} que demana
 *     xat_publica_identitat;
 *   · indexs: la frase (Uint16Array), que qui la mostra posa a zero en acabar.
 */
export async function creaAlta(cripto, {
  usuari, creatMs, anterior = null, iteracions = ITERACIONS_KDF, minIteracions = ITERACIONS_KDF, permetLlistaPendent = false
} = {}) {
  const subtle = subtleDe(cripto);
  uuid16(usuari);
  if (!Number.isSafeInteger(creatMs) || creatMs < 0) throw new TypeError('creatMs és un enter de mil·lisegons.');
  exigixAnterior(anterior, usuari);
  const sol = exigixIteracions(iteracions, minIteracions);
  await exigixLlistaRevisada(permetLlistaPendent);

  const secrets = [];
  let indexs = null;
  let tornat = false;
  try {
    const sig = await generaParellaSignatura(cripto, { extraible: true });
    const dh = await generaParellaDh(cripto, { extraible: true });
    const sigB = trossosDeJwk(await subtle.exportKey('jwk', sig.privateKey));
    secrets.push(sigB.d);
    const dhB = trossosDeJwk(await subtle.exportKey('jwk', dh.privateKey));
    secrets.push(dhB.d);
    const sigPub = await exportaPublica(cripto, sig.publicKey);
    const dhPub = await exportaPublica(cripto, dh.publicKey);
    if (!bytesIguals(sigPub, ajunta(Uint8Array.of(0x04), sigB.x, sigB.y)) || !bytesIguals(dhPub, ajunta(Uint8Array.of(0x04), dhB.x, dhB.y))) {
      throw error(CODI_ALTA.parellaInvalida, 'La JWK exportada no és la de la pública.');
    }
    const kid = await kidDe(cripto, { usuari, sigPub, dhPub });
    const kidAnterior = anterior === null ? null : new Uint8Array(anterior.kid);
    const declaracio = construeixDeclaracioClau({ usuari, sigPub, dhPub, kidAnterior, creatMs });
    const autofirma = await signa(cripto, sig.privateKey, declaracio);
    let firmaContinuitat = null;
    if (anterior !== null) {
      firmaContinuitat = await signa(cripto, anterior.sigPriv, declaracio);
      if (!(await verificaSignatura(cripto, anterior.sigPub, firmaContinuitat, declaracio))) {
        throw new TypeError('La clau privada anterior no és la de la seua pública: cap continuïtat.');
      }
    }

    const rk = aleatori(cripto, BYTES_RK);
    secrets.push(rk);
    const kll = aleatori(cripto, BYTES_CLAU);
    secrets.push(kll);
    const copia = await xifraCopia(cripto, { rk, usuari, kid, sig: sigB, dh: dhB, kll });
    // Les claus d'este aparell ixen de la còpia publicada, oberta amb esta RK (AAD, kid recalculat i parella
    // comprovada): l'aparell té exactament el que una restauració tornaria.
    const { sigPriv, dhPriv, clauLlibreta } = await obriCopia(cripto, { rk, iv: copia.iv, ct: copia.ct, usuari, kid });
    indexs = generaIndexsFrase(cripto);
    const frase = await embolcallaAmbFrase(cripto, { rk, usuari, kid, indexs, iteracions, sol });
    const rkLocal = await rkLocalDe(cripto, { rk, usuari, kid });

    const identitat = Object.freeze({ usuari, kid, sigPub, dhPub, sigPriv, dhPriv, creatMs, recuperacio: rkLocal, clauLlibreta });
    const publicacio = Object.freeze({
      kidAnterior: kidAnterior === null ? null : aBase64url(kidAnterior),
      declaracio: aBase64url(declaracio),
      autofirma: aBase64url(autofirma),
      firmaContinuitat: firmaContinuitat === null ? null : aBase64url(firmaContinuitat),
      copia: Object.freeze({ ct: aBase64url(copia.ct), iv: aBase64url(copia.iv), ...frase })
    });
    tornat = true;
    return Object.freeze({ identitat, publicacio, indexs, rkLocal });
  } finally {
    esborra(...secrets);
    if (!tornat) esborra(indexs);
  }
}

/** La identitat activa (sense retirada_al) d'una llista de xat_la_meua_identitat; REGISTRE_INVALID si no n'hi ha just una. */
export function registreActiu(files) {
  if (!Array.isArray(files)) throw registreInvalid('forma');
  const actives = files.filter((fila) => esObjectePla(fila) && (fila.retiradaAl === null || fila.retiradaAl === undefined));
  if (actives.length !== 1) throw registreInvalid(actives.length === 0 ? 'sense-activa' : 'mes-d-una-activa');
  return actives[0];
}

/* Una cadena base64url canònica de la mida exacta; REGISTRE_INVALID amb el motiu si no. */
function bytesDelRegistre(text, mida, motiu) {
  try {
    return deBase64url(text, mida);
  } catch {
    throw registreInvalid(motiu);
  }
}

/* La fila del servidor (forma de mapejaClau, base64url) llegida i comprovada: SDPK de la persona, autofirma, kid recalculat i còpia. */
async function llegixRegistre(cripto, registre, usuari) {
  if (!esObjectePla(registre)) throw registreInvalid('forma');
  if (registre.retiradaAl !== null && registre.retiradaAl !== undefined) throw registreInvalid('retirada');
  if (registre.usuariId !== null && registre.usuariId !== undefined && registre.usuariId !== usuari) throw registreInvalid('usuari');
  const declaracio = bytesDelRegistre(registre.declaracio, MIDES.declaracioClau, 'declaracio');
  let v;
  try {
    v = llegixDeclaracioClau(declaracio);
  } catch {
    throw registreInvalid('declaracio');
  }
  if (v.usuari !== usuari) throw registreInvalid('usuari');
  const autofirma = bytesDelRegistre(registre.autofirma, 64, 'autofirma');
  if (!(await verificaSignatura(cripto, v.sigPub, autofirma, declaracio))) throw registreInvalid('autofirma');
  const kid = await kidDe(cripto, { usuari, sigPub: v.sigPub, dhPub: v.dhPub });
  if (!bytesIguals(bytesDelRegistre(registre.kid, BYTES_KID, 'kid'), kid)) throw registreInvalid('kid-no-quadra');
  for (const [camp, valor] of [['sigPub', v.sigPub], ['dhPub', v.dhPub]]) {
    if (registre[camp] !== undefined && !bytesIguals(bytesDelRegistre(registre[camp], 65, camp), valor)) throw registreInvalid('kid-no-quadra');
  }
  const c = registre.copia;
  if (!esObjectePla(c) || !Object.keys(c).every((clau) => CLAUS_COPIA_LLEGIDA.includes(clau)) || !CLAUS_COPIA.every((clau) => Object.hasOwn(c, clau))) {
    throw registreInvalid('copia');
  }
  if (c.kdf !== undefined && c.kdf !== KDF_FRASE) throw registreInvalid('kdf');
  if (!Number.isSafeInteger(c.llista) || c.llista < 1 || c.llista > 255) throw registreInvalid('llista');
  if (!Number.isSafeInteger(c.iteracions)) throw registreInvalid('iteracions');
  return {
    kid, sigPub: v.sigPub, dhPub: v.dhPub, creatMs: v.creatMs,
    copia: {
      ct: bytesDelRegistre(c.ct, BYTES_COPIA_XIFRADA, 'copia'), iv: bytesDelRegistre(c.iv, BYTES_IV, 'copia'),
      rkCt: bytesDelRegistre(c.rk_ct, BYTES_RK_XIFRADA, 'copia'), rkIv: bytesDelRegistre(c.rk_iv, BYTES_IV, 'copia'),
      sal: bytesDelRegistre(c.sal, BYTES_SAL, 'copia'), iteracions: c.iteracions, llista: c.llista
    }
  };
}

/**
 * Aparell o origen nou (§5.4, segona fila): la identitat activa del servidor
 * (una fila de xat_la_meua_identitat) i els índexs de la frase. Comprova la
 * declaració, l'autofirma i el kid recalculat; deriva la KEK_f; obri la RK
 * (FRASE_ERRONIA si la frase no és); obri la còpia i comprova la parella.
 * Torna la identitat amb la forma de magatzem.desaIdentitat (no extraïble),
 * amb una DK nova d'este aparell. La identitat no canvia: els contactes no
 * veuen res.
 */
export async function restauraAmbFrase(cripto, { usuari, registre, indexs, minIteracions = ITERACIONS_KDF } = {}) {
  exigixCripto(cripto);
  uuid16(usuari);
  const r = await llegixRegistre(cripto, registre, usuari);
  const { copia } = r;
  const sol = exigixIteracions(copia.iteracions, minIteracions);
  const entrada = entradaFrase({ indexs, llistaVersio: copia.llista });
  let kek;
  try {
    kek = await kekDeFrase(cripto, { entrada, sal: copia.sal, iteracions: copia.iteracions, minIteracions: sol });
  } finally {
    esborra(entrada);
  }
  const rk = await obriRk(cripto, {
    kek, iv: copia.rkIv, ct: copia.rkCt, usuari, kid: r.kid, iteracions: copia.iteracions, sal: copia.sal, minIteracions: sol
  });
  try {
    // obriCopia recalcula el kid de les públiques de dins i el compara amb el de la declaració: són les mateixes claus (IS-03).
    const claus = await obriCopia(cripto, { rk, iv: copia.iv, ct: copia.ct, usuari, kid: r.kid });
    const recuperacio = await rkLocalDe(cripto, { rk, usuari, kid: r.kid });
    return Object.freeze({
      usuari, kid: r.kid, sigPub: r.sigPub, dhPub: r.dhPub, sigPriv: claus.sigPriv, dhPriv: claus.dhPriv, creatMs: r.creatMs,
      recuperacio, clauLlibreta: claus.clauLlibreta
    });
  } finally {
    esborra(rk);
  }
}

/**
 * «Paper perdut, mòbil viu» (§5.4, D-07 a): la RK d'este aparell (rkLocal =
 * identitat.recuperacio) es torna a embolcallar amb una frase nova. Mateixa
 * identitat i mateixa còpia: només canvia l'embolcall. Torna { frase, indexs }:
 * frase = {rk_ct, rk_iv, sal, iteracions, llista} per a desaFraseXat.
 */
export async function fraseNova(cripto, {
  rkLocal, usuari, kid, iteracions = ITERACIONS_KDF, minIteracions = ITERACIONS_KDF, permetLlistaPendent = false
} = {}) {
  exigixCripto(cripto);
  exigixUsuariKid(usuari, kid);
  const sol = exigixIteracions(iteracions, minIteracions);
  await exigixLlistaRevisada(permetLlistaPendent);
  const rk = await rkDeLocal(cripto, { rkLocal, usuari, kid });
  let indexs = null;
  try {
    indexs = generaIndexsFrase(cripto);
    const frase = await embolcallaAmbFrase(cripto, { rk, usuari, kid, indexs, iteracions, sol });
    return Object.freeze({ frase, indexs });
  } catch (causa) {
    esborra(indexs);
    throw causa;
  } finally {
    esborra(rk);
  }
}
