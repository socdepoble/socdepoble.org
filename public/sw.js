/* Sóc de Poble · service worker de l'entrada pròpia (Fase 0 de l'empaquetat
   mòbil, 261003). Disseny i raons: _wiki_de_poble/04_escriptori/
   02_investigacio_ia/261003_1330_empaquetat_mobil_claude/FASE0_PWA.txt.

   Online-first (ADR-2026-08): el servidor és la font de veritat i este worker
   no en guarda cap dada. Fa dues coses i prou:
     · navegacions de l'origen propi → xarxa, amb precàrrega de navegació (la
       petició ix mentre el worker arrenca); sense xarxa, una pàgina honesta
       «Sense connexió» que viu dins d'este fitxer (no es guarda cap HTML);
     · recursos del build amb empremta (/assets/<nom>-<hash de 8>.js|css|woff2,
       a l'arrel de /assets/) → memòria cau primer: el nom canvia amb el
       contingut. La memòria té sostre d'entrades i de bytes.
   Tota la resta passa sense tocar-la: API i autenticació (Supabase, /rest/,
   /auth/, /functions/, /storage/), qualsevol altre origen, peticions que no
   són GET, amb Authorization o Range, i adreces amb consulta.

   Script clàssic (Firefox 100 no té workers de mòdul) i sense importScripts.
   Només el registra src/pwa/registre.js, des de src/main.jsx i en producció.
   Cap amfitrió el rep: és a PROPIS_DEL_LLOC (vite.standalone.config.js).
   Sense skipWaiting: una versió nova espera que es tanquen les pestanyes.
   Les funcions pures de dalt es proven a src/pwa/sw.test.js. */
'use strict';

const VERSIO = 'v1';
const PREFIX_PROPI = 'sdp-pwa-';
const MEMORIA_RECURSOS = `${PREFIX_PROPI}recursos-${VERSIO}`;
/* Els chunks amb empremta s'acumulen entre desplegaments (este fitxer no
   canvia a cada build) i el chunk d'entrada (~1 MB) canvia de nom a cada
   desplegament: poda FIFO per damunt d'estes entrades O d'estos bytes, el que
   arribe primer. Les entrades queden per damunt dels chunks d'un build (~190 el
   261003) perquè un ús intens no expulse i torne a desar el build viu a cada
   càrrega; els bytes, per damunt del doble del JS d'un build (~3 MB el 261003).
   Si el build creix fins a la meitat de MAXIM_BYTES, cal pujar-lo. */
const MAXIM_RECURSOS = 300;
const MAXIM_BYTES = 8 * 1024 * 1024;
/* La mida desada viatja a la clau (una capçalera de la petició guardada):
   keys() la torna d'una tirada i la resposta es guarda intacta. */
const CAPCALERA_MIDA = 'x-sdp-mida';
/* Memòries de la PWA retirada per l'ADR-2026-08 (Workbox): fora en activar. */
const PREFIXOS_LLEGATS = ['workbox-'];
/* Camins de servei: mai es toquen, tampoc en navegació (relé OAuth inclòs). */
const PREFIXOS_DE_SERVEI = ['/rest/', '/auth/', '/functions/', '/storage/', '/realtime/', '/graphql/', '/api/'];
/* Eixida de Rollup a l'arrel de /assets/: <nom>-<hash base64url de 8>.<ext>.
   Les subcarpetes de /assets/ són còpies de public/assets i no hi entren. */
const RECURS_AMB_EMPREMTA = /^\/assets\/[^/]+-[A-Za-z0-9_-]{8}\.(js|mjs|css|woff2?)$/;
const CLASSE = Object.freeze({ NAVEGACIO: 'navegacio', RECURS: 'recurs-amb-empremta' });
const CSP_SENSE_CONNEXIO = "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'";

/**
 * Què fa el worker amb una petició: CLASSE.NAVEGACIO, CLASSE.RECURS o null
 * (passa: el worker no hi respon i el navegador fa el de sempre).
 * `peticio`: { metode, url, mode, cache, teAutoritzacio, teRang }.
 */
function classificaPeticio(peticio, origenPropi) {
  if (!peticio || peticio.metode !== 'GET') return null;
  if (peticio.teAutoritzacio || peticio.teRang) return null;
  if (peticio.cache === 'only-if-cached' && peticio.mode !== 'same-origin') return null;
  let url;
  try {
    url = new URL(peticio.url);
  } catch {
    return null;
  }
  if (url.origin !== origenPropi) return null;
  if (PREFIXOS_DE_SERVEI.some((prefix) => url.pathname.startsWith(prefix))) return null;
  if (peticio.mode === 'navigate') return CLASSE.NAVEGACIO;
  if (url.search || url.username || url.password) return null;
  return RECURS_AMB_EMPREMTA.test(url.pathname) ? CLASSE.RECURS : null;
}

/**
 * Si una resposta de recurs amb empremta es pot guardar. La reescriptura SPA
 * torna index.html amb 200 per a un chunk que ja no existix: eixe HTML no ha
 * d'entrar mai com si fóra JavaScript.
 * `resposta`: { status, tipus, redirigida, contentType, cacheControl, cami }.
 */
function esRespostaGuardable(resposta) {
  if (!resposta || resposta.status !== 200 || resposta.tipus !== 'basic' || resposta.redirigida) return false;
  if (/\b(?:no-store|private)\b/i.test(resposta.cacheControl || '')) return false;
  const tipus = String(resposta.contentType || '').toLowerCase();
  if (!tipus || tipus.includes('text/html')) return false;
  const extensio = (RECURS_AMB_EMPREMTA.exec(resposta.cami || '') || [])[1];
  if (extensio === 'js' || extensio === 'mjs') return tipus.includes('javascript');
  if (extensio === 'css') return tipus.includes('text/css');
  return extensio === 'woff' || extensio === 'woff2';
}

/** Memòries que s'esborren en activar: versions velles pròpies i les llegades. */
function cachesAEsborrar(noms, actual) {
  return noms.filter((nom) => nom !== actual &&
    (nom.startsWith(PREFIX_PROPI) || PREFIXOS_LLEGATS.some((prefix) => nom.startsWith(prefix))));
}

/**
 * Les claus més velles que sobren per damunt de `maxim` entrades o de
 * `maximBytes` en total. `entrades`: [{ clau, mida }] en l'ordre de keys(), que
 * és el d'inserció. La més nova no s'esborra mai.
 */
function clausSobrants(entrades, maxim, maximBytes) {
  let queden = entrades.length;
  let bytes = entrades.reduce((suma, entrada) => suma + entrada.mida, 0);
  const sobrants = [];
  for (const entrada of entrades.slice(0, -1)) {
    if (queden <= maxim && bytes <= maximBytes) break;
    sobrants.push(entrada.clau);
    queden -= 1;
    bytes -= entrada.mida;
  }
  return sobrants;
}

/** La mida que porta una clau desada; 0 si no en porta o no és un nombre. */
function midaDeLaClau(clau) {
  const mida = Number(clau && clau.headers && clau.headers.get(CAPCALERA_MIDA));
  return Number.isFinite(mida) && mida > 0 ? mida : 0;
}

/** La pàgina «Sense connexió»: sense JavaScript, amb els valors dels tokens de Pedra Seca. */
function paginaSenseConnexio() {
  return `<!doctype html>
<html lang="ca">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sense connexió · Sóc de Poble</title>
<style>
:root { color-scheme: light dark; }
body { margin: 0; min-height: 100vh; box-sizing: border-box; display: flex; align-items: center; justify-content: center; padding: 24px; background: #f3f0ec; color: #0e0d0c; font-family: 'Noto Sans', system-ui, -apple-system, 'Segoe UI', sans-serif; line-height: 1.5; }
main { max-width: 32rem; }
h1 { margin: 0 0 12px; font-size: 1.5rem; }
p { margin: 0 0 16px; color: #3d3b35; }
a { display: inline-block; min-height: 44px; box-sizing: border-box; padding: 10px 20px; border-radius: 999px; background: #004983; color: #ffffff; font-weight: 600; text-decoration: none; }
a:focus-visible { outline: 3px solid #0984e3; outline-offset: 2px; }
@media (prefers-color-scheme: dark) {
  body { background: #0e0d0c; color: #ffffff; }
  p { color: #efece7; }
}
</style>
</head>
<body>
<main>
<h1>Sense connexió</h1>
<p>Sóc de Poble necessita la xarxa per a mostrar-te el poble: les dades viuen al servidor i este dispositiu no en guarda cap còpia.</p>
<p>Quan torne la connexió, torna-ho a provar.</p>
<a href="">Torna-ho a provar</a>
</main>
</body>
</html>
`;
}

function descriuPeticio(peticio) {
  return {
    metode: peticio.method,
    url: peticio.url,
    mode: peticio.mode,
    cache: peticio.cache,
    teAutoritzacio: peticio.headers.has('authorization'),
    teRang: peticio.headers.has('range')
  };
}

function descriuResposta(resposta, url) {
  return {
    status: resposta.status,
    tipus: resposta.type,
    redirigida: resposta.redirected === true,
    contentType: resposta.headers.get('content-type') || '',
    cacheControl: resposta.headers.get('cache-control') || '',
    cami: new URL(url).pathname
  };
}

function respostaSenseConnexio() {
  return new Response(paginaSenseConnexio(), {
    status: 503,
    statusText: 'Service Unavailable',
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Security-Policy': CSP_SENSE_CONNEXIO
    }
  });
}

/* Xarxa primer, i res més: cap navegació es guarda. Primer la precàrrega de
   navegació (ja ha eixit mentre el worker arrencava); si no n'hi ha, o falla,
   la xarxa una vegada. Un error HTTP del servidor arriba tal qual; només la
   falta de xarxa porta la pàgina honesta. */
async function navega(event) {
  try {
    const precarregada = await event.preloadResponse;
    if (precarregada) return precarregada;
  } catch {
    /* precàrrega fallida: es prova la xarxa */
  }
  try {
    return await fetch(event.request);
  } catch {
    return respostaSenseConnexio();
  }
}

function poda(memoria) {
  return memoria.keys().then((claus) => {
    const entrades = claus.map((clau) => ({ clau, mida: midaDeLaClau(clau) }));
    return Promise.all(clausSobrants(entrades, MAXIM_RECURSOS, MAXIM_BYTES).map((clau) => memoria.delete(clau)));
  });
}

/* Desa la resposta intacta amb la seua mida a la clau i poda. `perMesurar` és
   una altra còpia: llegir-la no consumix ni la de la pàgina ni la que es desa. */
async function desa(memoria, peticio, perDesar, perMesurar) {
  const mida = (await perMesurar.blob()).size;
  const capcaleres = new Headers(peticio.headers);
  capcaleres.set(CAPCALERA_MIDA, String(mida));
  await memoria.put(new Request(peticio.url, { headers: capcaleres }), perDesar);
  await poda(memoria);
}

/* Memòria cau primer. Si la memòria falla (quota, mode privat), la xarxa de sempre. */
async function recursAmbEmpremta(event) {
  const peticio = event.request;
  let memoria = null;
  try {
    memoria = await caches.open(MEMORIA_RECURSOS);
    const desada = await memoria.match(peticio);
    if (desada) return desada;
  } catch {
    memoria = null;
  }
  const resposta = await fetch(peticio);
  if (memoria && esRespostaGuardable(descriuResposta(resposta, peticio.url))) {
    event.waitUntil(desa(memoria, peticio, resposta.clone(), resposta.clone()).catch(() => {}));
  }
  return resposta;
}

/* Safari 15.4, Chrome 59 i Firefox 99 la tenen; sense ella, la navegació va igual. */
function activaPrecarrega() {
  const precarrega = self.registration && self.registration.navigationPreload;
  return precarrega ? Promise.resolve().then(() => precarrega.enable()).catch(() => {}) : Promise.resolve();
}

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      activaPrecarrega(),
      caches.keys().then((noms) => Promise.all(cachesAEsborrar(noms, MEMORIA_RECURSOS).map((nom) => caches.delete(nom))))
    ]).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const classe = classificaPeticio(descriuPeticio(event.request), self.location.origin);
  if (classe === CLASSE.NAVEGACIO) event.respondWith(navega(event));
  else if (classe === CLASSE.RECURS) event.respondWith(recursAmbEmpremta(event));
});
