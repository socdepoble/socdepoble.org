/** Bridge for creaSessioRural({ transportCrdtRemot }). Existing session timeout,
 * lifecycle cancellation and atomic local CAS remain the only persistence path.
 */
export function creaTransportCrdtRuralRemot({ autoritat, config = {} }) {
  let u;
  try { u = new URL(autoritat); } catch { throw new TypeError('Autoritat remota invàlida.'); }
  if (u.protocol !== 'https:' || u.origin !== autoritat) throw new TypeError('Autoritat remota invàlida.');
  const captured = { ...config };
  return Object.freeze({ tipus: 'remot', autoritat, envia: async (request, { signal } = {}) => {
    const port = await import('./backendPort.js');
    if (!port.teCapacitat('ackCrdtRural')) throw Object.assign(new Error('El backend no confirma captures.'), { code: 'RURAL_CRDT_ACK_UNAVAILABLE' });
    const ack = await port.confirmaCapturaCrdtRural(request, { ...captured, signal });
    if (ack?.autoritat !== autoritat) throw Object.assign(new Error('Autoritat ACK diferent.'), { code: 'RURAL_CRDT_ACK_INVALID' });
    return ack;
  } });
}
