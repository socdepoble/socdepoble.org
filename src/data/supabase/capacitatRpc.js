import { getEfimer } from '../../config/storage.js';
import { capturaSessio, CLAU_USUARI, versioSessio } from '../identitat.js';
import { esRpcAbsent, getResolvedConfig, rpc } from './runtime.js';

/* Només lectures optatives. No es desen resultats, cossos ni JWTs, i les RPC
   obligatòries continuen passant directament per runtime.rpc. */
const TTL_ABSENCIA_MS = 60_000;
const MAX_ABSENCIES = 256;
const absencies = new Map();
const pendents = new Map();
let generacio = 0;

export class ErrorCapacitatRpc extends Error {
  constructor() {
    super('La capacitat de servidor encara no està disponible.');
    this.name = 'ErrorCapacitatRpc';
    this.codi = 'capacitat-no-disponible';
  }
}
export const esCapacitatRpcNoDisponible = error => error instanceof ErrorCapacitatRpc;

export function reiniciaCapacitatsRpc() {
  generacio++;
  absencies.clear();
  pendents.clear();
}

const avortada = () => new DOMException('Operació cancel·lada.', 'AbortError');
function comprovaSenyal(signal) { if (signal?.aborted) throw avortada(); }

function clauDe(nom, cos, config, anonim) {
  const { supabaseUrl, supabaseAnonKey, tenantId } = getResolvedConfig(config);
  return JSON.stringify([supabaseUrl, supabaseAnonKey, tenantId,
    getEfimer(CLAU_USUARI, null)?.id ?? null, versioSessio, Boolean(anonim), nom,
    Object.keys(cos ?? {}).sort()]);
}

function absentAra(clau) {
  const instant = absencies.get(clau);
  const ara = Date.now();
  if (instant !== undefined && ara >= instant && ara - instant < TTL_ABSENCIA_MS) return true;
  absencies.delete(clau);
  return false;
}

function espera(pendent, signal) {
  comprovaSenyal(signal);
  if (!signal) return pendent;
  return new Promise((resolve, reject) => {
    const avorta = () => { signal.removeEventListener('abort', avorta); reject(avortada()); };
    signal.addEventListener('abort', avorta, { once: true });
    pendent.then(valor => {
      signal.removeEventListener('abort', avorta);
      resolve(valor);
    });
  });
}

/** `disponible` és una declaració de desplegament explícita, no una inferència
 * de l'existència del mètode local. Si el servidor desmentix la declaració amb
 * PGRST202, s'eviten sondes repetides durant 60 s. Una reconnexió, un nou build,
 * una sessió nova o l'esdeveniment sdp:rpc-capacitats-refresca ho redescobrix.
 * Els concurrents compartixen només la sonda d'absència, mai les dades. */
export async function rpcOpcional(nom, cos, config = {}, opcions = {}) {
  const { disponible = false, redescobreix = false, signal, timeoutMs, anonim = false } = opcions;
  // Esta API no admet capçaleres d'autoritat alternatives fora de l'àmbit
  // capturat. runtime.rpc conserva les seues opcions per a la resta del port.
  const peticio = { signal, ...(timeoutMs === undefined ? {} : { timeoutMs }), anonim };
  comprovaSenyal(peticio.signal);
  if (disponible !== true) throw new ErrorCapacitatRpc();
  const comprovaSessio = capturaSessio();
  const clau = clauDe(nom, cos, config, peticio.anonim);
  const entrada = generacio;
  if (redescobreix) absencies.delete(clau);
  if (absentAra(clau)) throw new ErrorCapacitatRpc();

  const anterior = pendents.get(clau);
  if (anterior) {
    const estat = await espera(anterior, peticio.signal);
    comprovaSessio();
    comprovaSenyal(peticio.signal);
    if (entrada === generacio && estat === 'absent' && absentAra(clau)) throw new ErrorCapacitatRpc();
    // La sonda no presta la seua resposta: cada recurs conserva la seua petició.
    return efectua();
  }

  let acaba;
  const pendent = new Promise(resolve => { acaba = resolve; });
  pendents.set(clau, pendent);
  let estat = 'indeterminat';
  try {
    const resultat = await efectua();
    estat = 'present';
    return resultat;
  } catch (error) {
    if (esCapacitatRpcNoDisponible(error)) estat = 'absent';
    throw error;
  } finally {
    if (pendents.get(clau) === pendent) pendents.delete(clau);
    acaba(estat);
  }

  async function efectua() {
    try {
      const resultat = await rpc(nom, cos, config, peticio);
      comprovaSessio();
      comprovaSenyal(peticio.signal);
      return resultat;
    } catch (error) {
      comprovaSessio();
      comprovaSenyal(peticio.signal);
      if (!esRpcAbsent(error)) throw error;
      if (entrada === generacio && clau === clauDe(nom, cos, config, peticio.anonim)) {
        if (absencies.size >= MAX_ABSENCIES && !absencies.has(clau)) absencies.delete(absencies.keys().next().value);
        absencies.set(clau, Date.now());
      }
      throw new ErrorCapacitatRpc();
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', reiniciaCapacitatsRpc);
  window.addEventListener('sdp:rpc-capacitats-refresca', reiniciaCapacitatsRpc);
  import.meta.hot?.dispose(() => {
    window.removeEventListener('online', reiniciaCapacitatsRpc);
    window.removeEventListener('sdp:rpc-capacitats-refresca', reiniciaCapacitatsRpc);
    reiniciaCapacitatsRpc();
  });
}
