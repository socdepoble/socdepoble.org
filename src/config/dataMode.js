import { delEfimer, delVal, getEfimer, getVal, setEfimer, setVal } from './storage.js';

const CLAU = 'data-mode-choice';
/* Encàrrec 261018_1220 · L'elecció de proves, per pestanya (capa efímera). */
const CLAU_PROVES = 'data-mode-proves';
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

/* Encàrrec 261018_1220 (Tasques 0 i 2, ordre del Mestre) · L'elecció simètrica
   de desenvolupament: un paquet que demana 'remote' passa al mode de proves en
   este navegador perquè la persona pilot hi puga entrar (data/sessioPilot.js).
   Només val en desenvolupament i amb l'empremta del procés `vite` que la va
   fer (T13): un `npm run dev` nou torna al mode del paquet, i en un build no
   existix. Revisió adversarial (261018) · Viu a la capa efímera, de la
   pestanya: un clic en una pestanya no passa les altres al mode de proves en
   recarregar-les. Dins de la pestanya mana sobre l'elecció remota, i entrar al
   servidor (enterRemoteMode) l'esborra. */
export const MODE_DE_PROVES = 'seed';
const eleccioDeProvesVigent = (choice) => import.meta.env.DEV === true && choice?.v === 1
  && choice.mode === MODE_DE_PROVES && (choice.servidor ?? '') === empremtaDev();
const snapshotsDeProves = new Map();
/* Fora de desenvolupament no llig res: el camí d'un build queda com era. Un
   emmagatzematge il·legible val per «cap elecció». Retrat per document. */
function provesActives(node) {
  if (import.meta.env.DEV !== true) return false;
  if (!snapshotsDeProves.has(node)) {
    let eleccio = null;
    try { eleccio = getEfimer(`${CLAU_PROVES}:${node}`, null); } catch { /* cap elecció */ }
    snapshotsDeProves.set(node, eleccioDeProvesVigent(eleccio));
  }
  return snapshotsDeProves.get(node);
}

/** Una elecció nova només entra en vigor en la pròxima càrrega del document.
 * Així una altra pestanya no pot convertir una operació local en una de remota. */
export function resolveDataMode(config = {}) {
  const requested = ['remote', 'seed', 'local'].includes(config.dataMode) ? config.dataMode : 'remote';
  const node = nodeKey(config);
  if (!modesLocals.has(requested)) return provesActives(node) ? MODE_DE_PROVES : requested;
  /* Un paquet local amb l'elecció de proves d'esta pestanya: el seu mode, encara
     que el navegador guarde una elecció remota. */
  if (provesActives(node)) return requested;
  if (!snapshots.has(node)) {
    snapshots.set(node, eleccioVigent(getVal(`${CLAU}:${node}`, null)));
  }
  return snapshots.get(node) ? 'remote' : requested;
}

/** L'entrada real reinicia el muntatge i, per tant, el handshake de sessió.
 * No migra comptes, converses ni tokens del pilot al servidor. */
export function enterRemoteMode(config = {}, reload = () => window.location.reload()) {
  resolveDataMode(config);
  /* Encàrrec 261018_1220 · Entrar al servidor deixa el mode de proves d'esta pestanya. */
  try { delEfimer(`${CLAU_PROVES}:${nodeKey(config)}`); } catch { /* sense capa efímera */ }
  const servidor = empremtaDev();
  if (!setVal(`${CLAU}:${nodeKey(config)}`, servidor ? { v: 1, mode: 'remote', servidor } : { v: 1, mode: 'remote' })) {
    throw new Error('No s’ha pogut guardar l’elecció. Permet l’emmagatzematge del navegador i torna a provar.');
  }
  reload();
}

/* T2 (ordre del Mestre, 260930) · L'eixida simètrica. En un build l'elecció
   remota no caduca mai (T13) i, sense eixida, un servidor aturat deixava l'app
   trencada per a sempre en eixe navegador. */

/** Cert només si este document ha substituït un mode local ('seed' o 'local')
 * per l'elecció remota desada per a este node. En una release, que demana
 * 'remote', és sempre fals. Rep la configuració normalitzada
 * (normalizeBackendConfig), que és la que ha fet el retrat del document. */
export function eleccioRemotaActiva(config = {}) {
  return snapshots.get(nodeKey(config)) === true;
}

/** Torna al mode que demana el paquet: esborra l'elecció d'este node i
 * recarrega. Com enterRemoteMode, no migra ni revoca comptes ni tokens. */
export function exitRemoteMode(config = {}, reload = () => window.location.reload()) {
  if (!delVal(`${CLAU}:${nodeKey(config)}`)) {
    throw new Error('No s’ha pogut esborrar l’elecció. Permet l’emmagatzematge del navegador i torna a provar.');
  }
  reload();
}

/** Encàrrec 261018_1220 · Passa este node al mode de proves en la pròxima
 * càrrega d'esta pestanya, només en desenvolupament: desa l'elecció de proves a
 * la capa efímera (mana sobre una elecció remota) i recarrega. Com
 * enterRemoteMode, no migra ni revoca comptes ni tokens; la sessió remota d'esta
 * pestanya no passa al mode de proves (identitat.js · configuraBackendSessio
 * buida l'àmbit en canviar de mode). */
export function enterTestMode(config = {}, reload = () => window.location.reload()) {
  if (import.meta.env.DEV !== true) {
    throw new Error('El mode de proves només es pot triar en desenvolupament.');
  }
  if (!setEfimer(`${CLAU_PROVES}:${nodeKey(config)}`, { v: 1, mode: MODE_DE_PROVES, servidor: empremtaDev() })) {
    throw new Error('No s’ha pogut guardar l’elecció. Permet l’emmagatzematge del navegador i torna a provar.');
  }
  reload();
}
