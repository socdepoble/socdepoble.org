/** P1-27: cua fitada. Una cancel·lació no allibera un transport que encara vola. */
import { CODI_BACKEND_INABASTABLE } from '../errorsBackend.js';
import { registraIncident } from '../../utils/autocuracio.js';
export const MAX_STORAGE_EN_VOL = 4;
export const MAX_STORAGE_EN_CUA = 32;
const observadors = new Set();
/* Els tipus d'operacioStorage (storage.js) que poden deixar un efecte al servidor. */
const MUTACIONS_STORAGE = Object.freeze(['pujada', 'esborrat']);
export function observaReconciliacioStorage(fn) { observadors.add(fn); return () => observadors.delete(fn); }
export function informaReconciliacioStorage(detall) {
  /* T1 · F6 (assalt 261101) · Una reconciliació que no s'ha pogut assentar
     (un efecte tardà que pot haver quedat al servidor) deixa rastre al
     registre local d'autoreparacions: només l'etiqueta, mai la ruta ni l'uid.
     Només les mutacions: una lectura o una signatura que acaba després d'un
     canvi de sessió no deixa res al servidor (storage.js · avisaCanvi). */
  if (detall?.estat === 'pendent' && MUTACIONS_STORAGE.includes(detall.tipus)) registraIncident('dades', 'storage', 'reconciliacio-pendent');
  for (const fn of observadors) { try { fn(Object.freeze({ ...detall })); } catch { /* un observador no bloqueja la cua */ } }
  if (typeof globalThis.window?.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
    globalThis.window.dispatchEvent(new CustomEvent('sdp:storage-reconciliat', { detail: detall }));
  }
}
const cancel = () => new DOMException('Operació cancel·lada.', 'AbortError');
const timeout = () => Object.assign(new Error('Storage no ha respost a temps.'), { name: 'TimeoutError', codi: CODI_BACKEND_INABASTABLE });
const ocupat = () => Object.assign(new Error('Storage està ocupat.'), { codi: CODI_BACKEND_INABASTABLE });
export function creaControlStorage({ maxim = MAX_STORAGE_EN_VOL, cuaMaxima = MAX_STORAGE_EN_CUA } = {}) {
  if (!Number.isSafeInteger(maxim) || maxim < 1 || !Number.isSafeInteger(cuaMaxima) || cuaMaxima < 0) throw new TypeError('Límits de Storage invàlids.');
  const enVol = new Set();
  const cua = [];
  const bombeja = () => { while (enVol.size < maxim && cua.length) cua.shift().arranca(); };
  // El termini més llarg de les que poden ocupar plaça abans que una nova: les que volen i les que té davant (la cua és FIFO).
  const terminiMesLlarg = () => { let max = 0; for (const op of enVol) max = Math.max(max, op.ms); for (const op of cua) max = Math.max(max, op.ms); return max; };
  return Object.freeze({
    estat: () => ({ enVol: enVol.size, enCua: cua.length }),
    executa(feina, { ms, signal, reconcilia } = {}) {
      if (!(ms > 0) || !Number.isFinite(ms)) return Promise.reject(new TypeError('Cal un termini finit.'));
      if (signal?.aborted) return Promise.reject(cancel());
      if (enVol.size >= maxim && cua.length >= cuaMaxima) return Promise.reject(ocupat());
      return new Promise((resol, rebutja) => {
        const controlador = new AbortController();
        let tancada = false, iniciada = false, rellotge = null, espera = null;
        const acaba = (error, valor) => {
          if (tancada) return;
          tancada = true; clearTimeout(espera); clearTimeout(rellotge); signal?.removeEventListener('abort', avorta);
          if (!iniciada) { const index = cua.indexOf(op); if (index >= 0) cua.splice(index, 1); }
          if (error) rebutja(error); else resol(valor);
        };
        const talla = error => { acaba(error); controlador.abort(error); };
        const avorta = () => talla(cancel());
        /* R2-COR-06, V1-01 i V2-01 · El termini (ms) compta des que l'operació
           arranca, no des que entra a la cua: una signatura darrere de quatre
           pujades grans té el seu termini sencer. L'espera a la cua té el seu
           propi sostre, perquè cap crida sense senyal no espere per sempre
           (PN-04) si els transports en vol no acaben mai: el seu ms més el
           termini més llarg de les operacions que poden ocupar plaça abans que
           ella (les que volen i les que té davant a la cua). Si s'esgota sense
           arrancar, és «Storage està ocupat» (backend-inabastable), no un
           TimeoutError d'una operació que no ha començat. El senyal extern
           (signal) la pot traure de la cua abans, també sense arrancar-la. */
        const op = { ms, arranca() {
          if (tancada) return;
          iniciada = true; enVol.add(op); clearTimeout(espera);
          rellotge = setTimeout(() => talla(timeout()), ms);
          // Manté la plaça fins que el SDK i la reconciliació s’han assentat.
          Promise.resolve().then(() => { if (controlador.signal.aborted) throw controlador.signal.reason; return feina(controlador.signal); })
            .then(async valor => { if (tancada) await reconcilia?.({ valor }); else acaba(null, valor); },
              async error => { if (tancada) await reconcilia?.({ error }); else acaba(error); })
            .catch(() => { /* la fallada tardana no torna a la vista ni queda sense capturar */ })
            .finally(() => { enVol.delete(op); bombeja(); });
        } };
        signal?.addEventListener('abort', avorta, { once: true });
        const sostreDeCua = ms + terminiMesLlarg();
        cua.push(op); bombeja();
        if (!iniciada && !tancada) espera = setTimeout(() => acaba(ocupat()), sostreDeCua);
      });
    }
  });
}
// Un sol sostre físic per document: renovar JWT o canviar de client no crea més places.
const controlCompartit = creaControlStorage();
export function controlStorageDe(client) {
  if (!client || (typeof client !== 'object' && typeof client !== 'function')) throw new TypeError('Cal una instància de Storage.');
  return controlCompartit;
}
