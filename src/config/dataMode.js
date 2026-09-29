import { getVal, setVal } from './storage.js';

const CLAU = 'data-mode-choice';
const modesLocals = new Set(['seed', 'local']);
const snapshots = new Map();

// La preferència pertany al node complet, mai a les credencials ni a un usuari.
const nodeKey = (config) => JSON.stringify([
  config.backendId || 'supabase',
  String(config.backendUrl ?? config.backend_url ?? config.supabaseUrl ?? '').replace(/\/$/, ''),
  config.tenant_id ?? config.tenantId ?? null
]);

/* T13 · En desenvolupament l'elecció porta l'empremta del procés `vite` que la
   va fer: un `npm run dev` nou torna al mode de VITE_DATA_MODE. En un build
   DEV és false (es reemplaça en compilar) i l'elecció dura com sempre, també
   les desades abans de T13. */
const empremtaDev = () => (import.meta.env.DEV && import.meta.env.VITE_SDP_SERVIDOR_DEV) || '';
const eleccioVigent = (choice) => choice?.v === 1 && choice.mode === 'remote'
  && (choice.servidor ?? '') === empremtaDev();

/** Una elecció nova només entra en vigor en la pròxima càrrega del document.
 * Així una altra pestanya no pot convertir una operació local en una de remota. */
export function resolveDataMode(config = {}) {
  const requested = ['remote', 'seed', 'local'].includes(config.dataMode) ? config.dataMode : 'remote';
  if (!modesLocals.has(requested)) return requested;
  const node = nodeKey(config);
  if (!snapshots.has(node)) {
    snapshots.set(node, eleccioVigent(getVal(`${CLAU}:${node}`, null)));
  }
  return snapshots.get(node) ? 'remote' : requested;
}

/** L'entrada real reinicia el muntatge i, per tant, el handshake de sessió.
 * No migra comptes, converses ni tokens del pilot al servidor. */
export function enterRemoteMode(config = {}, reload = () => window.location.reload()) {
  resolveDataMode(config);
  const servidor = empremtaDev();
  if (!setVal(`${CLAU}:${nodeKey(config)}`, servidor ? { v: 1, mode: 'remote', servidor } : { v: 1, mode: 'remote' })) {
    throw new Error('No s’ha pogut guardar l’elecció. Permet l’emmagatzematge del navegador i torna a provar.');
  }
  reload();
}
