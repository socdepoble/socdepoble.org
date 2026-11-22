/** Bridge for creaSessioRural({ transportCrdtRemot }). Existing session timeout,
 * lifecycle cancellation and atomic local CAS remain the only persistence path.
 */
import { capturaSessio } from './identitat.js';
import { normalizeBackendConfig } from '../config/backendConfig.js';

export function creaTransportCrdtRuralRemot({ autoritat, config = {} }) {
  let u;
  try { u = new URL(autoritat); } catch { throw new TypeError('Autoritat remota invàlida.'); }
  if (u.protocol !== 'https:' || u.origin !== autoritat) throw new TypeError('Autoritat remota invàlida.');
  const captured = { ...config };
  return Object.freeze({ tipus: 'remot', autoritat, envia: async (request, { signal } = {}) => {
    const check = capturaSessio(), callConfig = { ...normalizeBackendConfig(captured), signal: signal ?? captured.signal };
    const comprova = () => {
      check();
      if (callConfig.signal?.aborted) throw new DOMException('Operació cancel·lada.', 'AbortError');
    };
    comprova();
    if (callConfig.backendUrl && callConfig.backendUrl !== autoritat) throw Object.assign(new Error('Autoritat de configuració diferent.'), { code: 'RURAL_CRDT_ACK_INVALID' });
    const port = await import('./backendPort.js');
    comprova();
    if (!port.teCapacitat('ackCrdtRural')) throw Object.assign(new Error('El backend no confirma captures.'), { code: 'RURAL_CRDT_ACK_UNAVAILABLE' });
    // The public implementation can only be captured after the lazy import.
    const backend = Object.hasOwn(port, 'getBackendImplementation') ? port.getBackendImplementation() : null;
    const vigent = () => {
      comprova();
      if (backend && port.getBackendImplementation() !== backend) throw new DOMException('El backend ha canviat.', 'AbortError');
    };
    vigent();
    let ack;
    try { ack = await port.confirmaCapturaCrdtRural(request, callConfig); }
    catch (error) { vigent(); throw error; }
    vigent();
    if (ack?.autoritat !== autoritat) throw Object.assign(new Error('Autoritat ACK diferent.'), { code: 'RURAL_CRDT_ACK_INVALID' });
    return ack;
  } });
}
