/** Sidecar d'entrega: usa la màquina rural existent i conserva només IDs,
 * seq i proves de progrés. Cap text, payload, cursor propi ni ACK de push. */
import { creaRegistreMissatgeRural, confirmaEnviamentServidor, aplicaCursorDestinatari,
  ESTATS_MISSATGE_RURAL } from './estatSincronitzacioRural.js';
const names = Object.freeze({ cua_local: 'cua_local', enviat_servidor: 'enviat_servidor',
  entregat_destinatari: 'rebut_destinatari', llegit_destinatari: 'llegit_confirmat' });
const read = (object, key) => {
  if (!object || typeof object !== 'object' || Array.isArray(object)) return undefined;
  const d = Object.getOwnPropertyDescriptor(object, key);
  return d && Object.hasOwn(d, 'value') ? d.value : undefined;
};
export function iniciaEntregaHonesta(ambit, filId, clientMsgId) {
  return creaRegistreMissatgeRural({ ambit, filId, clientMsgId, text: '', persistitLocal: false });
}
export function confirmaAckEntrega(registre, resposta, remot) {
  if (!remot || read(resposta, 'encuat') === true || read(resposta, 'filId') !== registre.filId) return registre;
  const id = read(resposta, 'id'), seq = read(resposta, 'seq');
  if (typeof id !== 'string' || id.length > 36 || !Number.isSafeInteger(seq) || seq < 1
    || registre.seq !== null && registre.seq !== seq) return registre;
  try { return confirmaEnviamentServidor(registre, { id, seq, font: 'rpc_xat_envia' }); }
  catch { return registre; }
}
export function descriptorEntregaHonesta(registre, rebutsConeguts = false) {
  const estat = names[registre.estat] ?? 'cua_local';
  return Object.freeze({ estat, seq: registre.seq, confirmatServidor: registre.seq !== null,
    rebutConfirmat: ['rebut_destinatari', 'llegit_confirmat'].includes(estat),
    lecturaConfirmada: estat === 'llegit_confirmat', rebutsConeguts });
}
/** El port retorna Conversa[] després de completar la resposta. Un envelope
 * parcial, una fila amb getters o una llista ambigua no és cap cursor acreditat. */
export function aplicaConsultaEntrega(registre, files) {
  if (!Array.isArray(files) || files.length > 5000 || registre.seq === null) return { registre, coneguts: false };
  let fila = null;
  for (let i = 0; i < files.length; i++) {
    const item = Object.getOwnPropertyDescriptor(files, String(i));
    if (!item || !Object.hasOwn(item, 'value')) return { registre, coneguts: false };
    const candidata = item.value;
    if (read(candidata, 'id') !== registre.filId) continue;
    if (fila) return { registre, coneguts: false };
    fila = candidata;
  }
  if (!fila || read(fila, 'esPropi') === true || read(fila, 'tipus') === 'propi'
    || read(fila, 'perDefecte') === true || read(fila, 'participant') === false) return { registre, coneguts: false };
  const rebut = read(fila, 'rebutPelsAltresFinsSeq'), llegit = read(fila, 'llegitPelsAltresFinsSeq');
  const valid = n => Number.isSafeInteger(n) && n >= 0;
  const rebutValid = valid(rebut), llegitValid = valid(llegit);
  if (!rebutValid && !llegitValid) return { registre, coneguts: false };
  return { registre: aplicaCursorDestinatari(registre, { font: 'cursor_xat_membres',
    ...(rebutValid ? { rebutPelsAltresFinsSeq: rebut } : {}),
    ...(llegitValid ? { llegitPelsAltresFinsSeq: llegit } : {}) }), coneguts: rebutValid };
}
export const entregaConfirmadaAlServidor = registre => registre.estat !== ESTATS_MISSATGE_RURAL.CUA_LOCAL && registre.seq !== null;
