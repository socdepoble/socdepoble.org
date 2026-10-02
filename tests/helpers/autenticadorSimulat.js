/**
 * autenticadorSimulat.js — SUPORT DE PROVES, no és codi de producció.
 *
 * Un autenticador WebAuthn de plataforma simulat per a provar els tractors de
 * nivell «signatura» (els de la Gestoria, que toquen dades personals) sense
 * cap navegador: una clau P-256 de WebCrypto que signa en DER, com Touch ID o
 * Windows Hello. És el mateix model que les proves del nucli
 * (src/sections/tractors/nucli/aprovacio.test.js i webauthn.test.js), però el
 * registre passa per signaAmbWebAuthn de veres i la porta (exigeixAprovacio)
 * el verifica de veres: cap drecera.
 *
 * Viu a tests/helpers/, fora de src/: el catàleg de tractors
 * (registreTractors.js) no l'empaqueta, i la porta Pedra Seca (LLEI_08) no el
 * compta com un subarbre orfe de src/. src/sections/tractors/clausura.test.js
 * comprova que cap fitxer de producció dels carrils l'importa.
 */
import { preparaRegistre, signaAmbWebAuthn } from '../../src/sections/tractors/nucli/aprovacio.js';
import { base64url, concatena, resolSubtle, sha256, utf8 } from '../../src/sections/tractors/nucli/canonic.js';
import { FLAG_UP, FLAG_UV } from '../../src/sections/tractors/nucli/webauthn.js';

export const ORIGEN_PROVA = 'http://localhost';
export const RP_ID_PROVA = 'localhost';
const CREAT_PROVA = '2026-10-01T00:00:00.000Z';

const buffer = (bytes) => bytes.slice().buffer;

/* WebAuthn torna la signatura ECDSA en DER; WebCrypto la dona crua (r ‖ s). */
function crudaADer(crua) {
  const enter = (b) => {
    let i = 0;
    while (i < b.length - 1 && b[i] === 0) i += 1;
    let v = [...b.subarray(i)];
    if (v[0] & 0x80) v = [0, ...v];
    return [0x02, v.length, ...v];
  };
  const cos = [...enter(crua.subarray(0, 32)), ...enter(crua.subarray(32))];
  return new Uint8Array([0x30, cos.length, ...cos]);
}

/**
 * @param {object} [opcions]
 * @param {SubtleCrypto} [opcions.subtle] per defecte, crypto.subtle
 * @param {string} [opcions.origen] l'origen que posa a clientDataJSON
 * @param {string} [opcions.rpId]
 * @param {Uint8Array} [opcions.id] l'identificador de la credencial (16 bytes)
 * @returns {Promise<{ clau: object, claus: object[], credentials: object, origen: string, rpId: string,
 *   signa: (p: { manifest: object, empremta: string, ara: number|string|Date, nonce?: Uint8Array }) => Promise<object> }>}
 */
export async function creaAutenticadorSimulat({
  subtle, origen = ORIGEN_PROVA, rpId = RP_ID_PROVA, id = new Uint8Array(16).fill(7)
} = {}) {
  const s = resolSubtle(subtle);
  const parell = await s.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const { x, y } = await s.exportKey('jwk', parell.publicKey);
  const credencial = base64url(id);
  const clau = Object.freeze({ credencial, jwk: Object.freeze({ kty: 'EC', crv: 'P-256', x, y }), creat: CREAT_PROVA, etiqueta: 'Autenticador simulat' });

  /* Imita navigator.credentials.get amb presència (UP) i verificació d'usuari (UV). */
  const credentials = {
    async get({ publicKey }) {
      const authenticatorData = concatena(await sha256(publicKey.rpId, s), new Uint8Array([FLAG_UP | FLAG_UV, 0, 0, 0, 1]));
      const clientDataJSON = utf8(JSON.stringify({
        type: 'webauthn.get', challenge: base64url(publicKey.challenge), origin: origen, crossOrigin: false
      }));
      const crua = new Uint8Array(await s.sign(
        { name: 'ECDSA', hash: 'SHA-256' }, parell.privateKey, concatena(authenticatorData, await sha256(clientDataJSON, s))
      ));
      return {
        rawId: buffer(id),
        response: { authenticatorData: buffer(authenticatorData), clientDataJSON: buffer(clientDataJSON), signature: buffer(crudaADer(crua)) }
      };
    }
  };

  /* Un registre «aprovat» de nivell signatura, amb la prova WebAuthn. */
  async function signa({ manifest, empremta, ara, nonce = new Uint8Array(16) }) {
    const registre = preparaRegistre({ manifest, empremta, decisio: 'aprovat', nivell: 'signatura', ara, nonce });
    return signaAmbWebAuthn({ registre, credencial, credentials, rpId, subtle: s });
  }

  return { clau, claus: [clau], credentials, origen, rpId, signa };
}
