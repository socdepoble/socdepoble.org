/**
 * hmr-bfcache.mjs — Connector només-dev: el socket HMR de Vite i la bfcache
 * (Gauntlet 261029, cicle 1 · vite-hmr-ws-bfcache).
 *
 * Quan un document de l'app entra a la bfcache (una navegació completa i, després,
 * Arrere o Avant), Chrome talla el socket HMR de Vite i, en restaurar la pàgina,
 * escriu a la consola «WebSocket connection to 'ws://localhost:3340/?token=…'
 * failed: Page entered Back-Forward Cache.». El client de Vite 7.3 no escolta ni
 * pagehide ni pageshow.
 *
 * Este connector servix un script clàssic a RUTA_HMR_BFCACHE (el CSP d'index.html
 * és script-src 'self': cap script en línia) i el posa al principi del <head>.
 * S'executa abans del client de Vite, que és un mòdul (diferit): anota els sockets
 * amb el subprotocol 'vite-hmr' i, en un pagehide persistent, tanca nets (1000)
 * els que estan oberts. Cap altre socket de l'app no es toca.
 *
 * Després de la restauració, l'HMR d'eixa pàgina queda parat, igual que sense el
 * connector: el client de Vite ja ha vist beforeunload i no torna a connectar. Una
 * recàrrega el torna. No es recarrega sola: anul·laria la bfcache en desenvolupament
 * i amagaria els camins pageshow propis de l'app (Conversa.jsx, PedraSecaEmbed.jsx,
 * autobloqueig.js).
 *
 * `apply: 'serve'` → el build i el preview no el coneixen: producció no canvia.
 */
export const RUTA_HMR_BFCACHE = '/__sdp/hmr-bfcache.js';

/**
 * Instal·la el tancament a `entorn` (la finestra). Cert si l'ha instal·lat ara.
 * Autocontinguda (cap referència de fora): el navegador la rep amb toString().
 */
export function instalaTancamentHmr(entorn) {
  const Original = entorn && entorn.WebSocket;
  const marca = Symbol.for('sdp.hmrBfcache');
  if (typeof Original !== 'function' || typeof Proxy !== 'function' || entorn[marca]) return false;
  entorn[marca] = true;
  const hmr = new Set();
  const esHmr = (protocols) => protocols === 'vite-hmr' || (Array.isArray(protocols) && protocols.includes('vite-hmr'));
  /* Un Proxy, no una subclasse: instanceof, les constants (OPEN…) i la resta del
     constructor queden igual per a qualsevol altre socket de l'app. */
  entorn.WebSocket = new Proxy(Original, {
    construct(objectiu, args, nouObjectiu) {
      const socket = Reflect.construct(objectiu, args, nouObjectiu);
      if (esHmr(args[1])) {
        hmr.add(socket);
        socket.addEventListener('close', () => hmr.delete(socket), { once: true });
      }
      return socket;
    }
  });
  entorn.addEventListener('pagehide', (event) => {
    if (!event.persisted) return;
    for (const socket of hmr) {
      /* Només els oberts: tancar-ne un que encara connecta també escriu un error. */
      if (socket.readyState === Original.OPEN) socket.close(1000, 'bfcache');
    }
  });
  return true;
}

/** El script que es servix: la funció de dalt, cridada amb la finestra. */
export const CODI_HMR_BFCACHE = `(${instalaTancamentHmr.toString()})(globalThis);\n`;

export default function hmrBfcache() {
  return {
    name: 'sdp-hmr-bfcache',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(RUTA_HMR_BFCACHE, (_peticio, resposta) => {
        resposta.setHeader('Content-Type', 'text/javascript; charset=utf-8');
        resposta.setHeader('Cache-Control', 'no-store');
        resposta.end(CODI_HMR_BFCACHE);
      });
    },
    transformIndexHtml() {
      return [{ tag: 'script', attrs: { src: RUTA_HMR_BFCACHE }, injectTo: 'head-prepend' }];
    }
  };
}
