/* Sóc de Poble · service worker de l'entrada pròpia (Fase 0 de l'empaquetat
   mòbil, 261003; closca de les apps, 261007). Disseny i raons: _wiki_de_poble/
   04_escriptori/02_investigacio_ia/261003_1330_empaquetat_mobil_claude/
   FASE0_PWA.txt i _wiki_de_poble/02_saber/architecture/
   ADR-2026-10-APPS-DEL-DISPOSITIU.md (esmena de l'ADR-2026-08).

   Online-first (ADR-2026-08): el servidor és la font de veritat i este worker
   no en guarda cap dada. Fa tres coses i prou:
     · navegacions de l'origen propi → xarxa, amb precàrrega de navegació (la
       petició ix mentre el worker arrenca); sense xarxa, una pàgina honesta
       «Sense connexió» que viu dins d'este fitxer;
     · la closca de les apps (ordre del Mestre, 261007: una app de /app/* ja
       visitada ha d'arrencar sense xarxa al lloc propi): una per app, amb la
       clau /app/<id>/ (el portal, /app/). Una navegació a /app/<id>/* que
       respon bé (200, mateix origen, HTML, sense consulta ni redirecció)
       deixa una còpia de l'HTML en una memòria a banda (MEMORIA_CLOSCA), amb
       els recursos amb empremta que demana l'HTML. La pàgina d'eixa app,
       quan ja s'ha carregat, hi afig els que ella ha carregat (el chunk de
       RutaApps, el de l'app i les seues vistes), si és del mateix build: és
       la confirmació. Només es dona sense xarxa, a una navegació de la
       mateixa app, si la pàgina l'ha confirmada i si tots eixos recursos
       continuen desats; amb xarxa, cada navegació la refresca. Fora de
       /app/* no es guarda mai cap HTML;
     · recursos del build amb empremta (/assets/<nom>-<hash de 8>.js|css|woff2,
       a l'arrel de /assets/) → memòria cau primer: el nom canvia amb el
       contingut. La memòria té sostre d'entrades i de bytes. La pàgina d'una
       app (src/pwa/registre.js) li pot demanar, per missatge, que escalfe els
       que ja ha carregat abans que este worker la controlara, que els afija
       a la closca de l'app i que la refresque: amb els mateixos filtres i els
       mateixos sostres.
   Tota la resta passa sense tocar-la: API i autenticació (Supabase, /rest/,
   /auth/, /functions/, /storage/), qualsevol altre origen, peticions que no
   són GET, amb Authorization o Range, i recursos amb consulta.

   Script clàssic (Firefox 100 no té workers de mòdul) i sense importScripts.
   Només el registra src/pwa/registre.js, des de src/main.jsx i en producció.
   Cap amfitrió el rep: és a PROPIS_DEL_LLOC (vite.standalone.config.js).
   Sense skipWaiting: una versió nova espera que es tanquen les pestanyes.
   L'única excepció és l'ordre de la PWA de juny (MISSATGE_LLEGAT_SALTA_ESPERA),
   que la pàgina d'ara no envia mai (261023).
   Les funcions pures de dalt es proven a src/pwa/sw.test.js. */
'use strict';

const VERSIO = 'v1';
const PREFIX_PROPI = 'sdp-pwa-';
const MEMORIA_RECURSOS = `${PREFIX_PROPI}recursos-${VERSIO}`;
/* La closca va a banda i amb versió pròpia: pujar VERSIO_CLOSCA invalida la
   vella en activar i deixa els recursos on són. */
const VERSIO_CLOSCA = 'v1';
const MEMORIA_CLOSCA = `${PREFIX_PROPI}closca-${VERSIO_CLOSCA}`;
const MEMORIES_VIVES = Object.freeze([MEMORIA_RECURSOS, MEMORIA_CLOSCA]);
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
/* Igual per a la closca: els camins dels recursos que demana l'HTML, separats
   per espais. Són l'empremta del build: dos closques amb la mateixa llista són
   del mateix build. */
const CAPCALERA_RECURSOS = 'x-sdp-recursos';
/* I els que la pàgina d'eixa app ha carregat en el mateix build (revisió F1,
   261007: l'HTML només nomena el chunk d'entrada, i RutaApps i l'app són
   lazy). Que la capçalera hi siga (amb '-' si la pàgina no hi afig cap
   recurs) vol dir que la pàgina l'ha confirmada; sense ella, la closca no es
   dona. */
const CAPCALERA_RECURSOS_PAGINA = 'x-sdp-recursos-pagina';
/* Memòries de la PWA retirada per l'ADR-2026-08 (Workbox): fora en activar.
   Per prefix, la precàrrega (workbox-precache-v2-…); pel nom exacte, les de
   temps d'execució de juny (src/sw.js de f484b6986: static-resources, CacheFirst
   sense caducitat; wasm-worker-cache, NetworkFirst) i la del public/
   service-worker.js d'abril (d9b064012, sdp-v1). El nom exacte i no un prefix:
   cap altra memòria del lloc (sdp-salut, sdp-v2…) s'hi toca (261023). */
const PREFIXOS_LLEGATS = ['workbox-'];
const NOMS_LLEGATS = Object.freeze(['static-resources', 'wasm-worker-cache', 'sdp-v1']);
/* Camins de servei: mai es toquen, tampoc en navegació (relé OAuth inclòs). */
const PREFIXOS_DE_SERVEI = ['/rest/', '/auth/', '/functions/', '/storage/', '/realtime/', '/graphql/', '/api/'];
/* Eixida de Rollup a l'arrel de /assets/: <nom>-<hash base64url de 8>.<ext>.
   Les subcarpetes de /assets/ són còpies de public/assets i no hi entren. */
const RECURS_AMB_EMPREMTA = /^\/assets\/[^/]+-[A-Za-z0-9_-]{8}\.(js|mjs|css|woff2?)$/;
/* Els src i href d'un HTML que apunten a un recurs amb empremta. */
const REFERENCIA_A_RECURS = /\b(?:src|href)\s*=\s*["']?(\/assets\/[^"'\s>]+)/g;
/* Les apps de la Plataforma: /app i tot el que penja de /app/ (no /apps ni /application). */
const CAMI_D_APP = /^\/app(?:\/|$)/;
/* Una closca per app (revisió F1, 261007): l'HTML és el mateix a tot /app/*,
   però els recursos que calen per a arrencar cada app, no. La clau és
   /app/<id>/, amb l'id com el valida la Plataforma (esIdOpac de
   src/apps/plataforma/rutesAplicacio.js); el portal, /app i /app/, va a
   CAMI_DEL_PORTAL. Un camí amb un id que la Plataforma no admet no en té cap. */
const APP_DE_LA_RUTA = /^\/app\/([a-z0-9][a-z0-9_-]{0,63})(?:\/|$)/;
const CAMI_DEL_PORTAL = '/app/';
/* Com a molt estes closques (una per app visitada; l'HTML pesa uns pocs kB):
   en desar-ne una de més, ix la que fa més temps que no es desa. */
const MAXIM_CLOSQUES = 32;
/* El missatge de la pàgina (src/pwa/registre.js, MISSATGE_ESCALFAMENT). */
const MISSATGE_ESCALFAMENT = 'sdp-escalfa';
/* L'ordre del botó «Actualitzar ara» de la PWA de juny (PwaUpdater.jsx de
   f484b6986: updateServiceWorker(true) de vite-plugin-pwa, que envia
   { type: 'SKIP_WAITING' } al worker en espera). Els navegadors que la van
   tindre servixen l'app de juny des de la precàrrega de Workbox (/ → /chats,
   la clau vella de Supabase) fins que este worker pren el control. Sense
   atendre l'ordre, el botó es queda en «Actualitzant…» i l'espera dura fins
   que es tanquen totes les pestanyes i l'app instal·lada (261023). */
const MISSATGE_LLEGAT_SALTA_ESPERA = 'SKIP_WAITING';
const CLASSE = Object.freeze({ NAVEGACIO: 'navegacio', RECURS: 'recurs-amb-empremta' });
const CSP_SENSE_CONNEXIO = "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'";

/** Si un camí és d'una app: /app o una ruta de davall de /app/. */
function esCamiDApp(cami) {
  return CAMI_D_APP.test(String(cami || ''));
}

/**
 * El camí de la closca d'una ruta de /app/*: /app/<id>/ per a una app, el
 * del portal per a /app i /app/, o null (fora de /app/* o amb un id que la
 * Plataforma no admet: majúscules, '%', una barra doble…).
 */
function camiDeLaClosca(cami) {
  const text = String(cami || '');
  if (text === '/app' || text === CAMI_DEL_PORTAL) return CAMI_DEL_PORTAL;
  const app = APP_DE_LA_RUTA.exec(text);
  return app ? `/app/${app[1]}/` : null;
}

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
 * Si una resposta de recurs amb empremta es pot guardar. Una reescriptura SPA
 * que també cobrira /assets/ tornaria index.html amb 200 per a un chunk que ja
 * no existix (la de firebase.json deixa fora /assets/ i torna 404): eixe HTML
 * no ha d'entrar mai com si fóra JavaScript.
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

/**
 * Si la resposta a una navegació es pot guardar com a closca de les apps:
 * un camí de /app/* que tinga closca (camiDeLaClosca) i sense consulta (cap
 * testimoni d'OAuth no queda desat), 200 del mateix origen, sense redirecció
 * (una navegació no admet una resposta redirigida) i HTML. Tampoc amb
 * no-store ni private: una pàgina privada pot portar dades de la persona, i
 * esta còpia sobreviu a l'eixida de la sessió. Una petició amb Authorization
 * no arriba mai ací (classificaPeticio).
 * `resposta`: { status, tipus, redirigida, contentType, cacheControl, cami, consulta }.
 */
function esCloscaGuardable(resposta) {
  if (!resposta || resposta.status !== 200 || resposta.tipus !== 'basic' || resposta.redirigida) return false;
  if (!camiDeLaClosca(resposta.cami) || resposta.consulta) return false;
  if (/\b(?:no-store|private)\b/i.test(resposta.cacheControl || '')) return false;
  return String(resposta.contentType || '').toLowerCase().includes('text/html');
}

/**
 * Els recursos amb empremta que demana un HTML (els src i href de /assets/),
 * sense consulta ni fragment i sense repetir. Cada camí passa pel parser
 * d'URL: queda en ASCII (percent-encoding), com el pathname d'una petició, i
 * pot viatjar en una capçalera. Una pàgina que no en demana cap no és la
 * closca de l'SPA.
 */
function recursosDeLHtml(html) {
  const camins = [];
  for (const [, referencia] of String(html || '').matchAll(REFERENCIA_A_RECURS)) {
    let url;
    try {
      url = new URL(referencia, 'https://sdp.invalid');
    } catch {
      continue;
    }
    if (url.search || url.hash || !RECURS_AMB_EMPREMTA.test(url.pathname) || camins.includes(url.pathname)) continue;
    camins.push(url.pathname);
  }
  return camins;
}

/** Els recursos que porta una clau de closca desada a `capcalera` (per
 *  defecte, els de l'HTML); cap si no en porta. */
function recursosDeLaClau(clau, capcalera = CAPCALERA_RECURSOS) {
  const valor = clau && clau.headers && clau.headers.get(capcalera);
  return String(valor || '').split(' ').filter((cami) => RECURS_AMB_EMPREMTA.test(cami));
}

/** Si la pàgina d'eixa app ha confirmat la closca: la capçalera hi és. */
function esCloscaConfirmada(clau) {
  return Boolean(clau && clau.headers && clau.headers.has(CAPCALERA_RECURSOS_PAGINA));
}

/** Si una pàgina que ha carregat `carregats` és del build d'un HTML que
 *  demana `html`: n'ha carregat tots els recursos. */
function esDelBuild(html, carregats) {
  return Array.isArray(html) && html.length > 0 && Array.isArray(carregats) && html.every((cami) => carregats.includes(cami));
}

/**
 * Les llistes d'una closca que es desa: { html, pagina }, amb pagina null si
 * la pàgina encara no l'ha confirmada. `html`: els recursos que demana
 * l'HTML nou. `anterior`: la closca d'eixa app que ja hi havia ({ html,
 * pagina } o null). `afegits`: els recursos que la pàgina d'eixa app, d'este
 * mateix build, ha carregat i ja són a la memòria (null en una navegació).
 *   · Amb el mateix HTML que l'anterior (el mateix build) es conserva el que
 *     la pàgina ja havia confirmat; d'un altre build, res: cal que la pàgina
 *     nova ho torne a confirmar.
 *   · Els afegits s'hi sumen (unió): la closca demana tot el que la pàgina ha
 *     necessitat, també les vistes que s'han obert després.
 *   · Entre les dos, com a molt MAXIM_RECURSOS + 1: una closca que en demana
 *     més dels que caben a la memòria no es dona mai (recursosPerArrencar), i
 *     la capçalera no creix sense límit.
 */
function llistesDeLaClosca(html, anterior, afegits) {
  const mateixHtml = Boolean(anterior) && Array.isArray(anterior.html) && anterior.html.length === html.length &&
    html.every((cami) => anterior.html.includes(cami));
  let pagina = mateixHtml && Array.isArray(anterior.pagina) ? anterior.pagina.slice() : null;
  if (Array.isArray(afegits)) {
    pagina = pagina || [];
    for (const cami of afegits) {
      if (!html.includes(cami) && !pagina.includes(cami)) pagina.push(cami);
    }
  }
  return { html, pagina: pagina && pagina.slice(0, Math.max(0, MAXIM_RECURSOS + 1 - html.length)) };
}

/** Les capçaleres de la clau d'una closca. Una confirmació sense cap recurs
 *  més que els de l'HTML s'escriu '-': la capçalera hi ha de ser igual. */
function capcaleresDeLaClosca(llistes) {
  const capcaleres = { [CAPCALERA_RECURSOS]: llistes.html.join(' ') };
  if (llistes.pagina) capcaleres[CAPCALERA_RECURSOS_PAGINA] = llistes.pagina.join(' ') || '-';
  return capcaleres;
}

/**
 * Els recursos que han de ser a la memòria per a donar una closca desada, o
 * null si no es pot donar: sense recursos de l'HTML, sense la confirmació de
 * la pàgina o amb més recursos dels que caben a la memòria.
 */
function recursosPerArrencar(clau) {
  const html = recursosDeLaClau(clau);
  if (!html.length || !esCloscaConfirmada(clau)) return null;
  const tots = html.concat(recursosDeLaClau(clau, CAPCALERA_RECURSOS_PAGINA));
  return tots.length <= MAXIM_RECURSOS ? tots : null;
}

/** Una adreça de l'origen propi (relativa o absoluta) o null. */
function urlPropia(cami, origenPropi) {
  if (typeof cami !== 'string' || !cami) return null;
  try {
    const url = new URL(cami, origenPropi);
    return url.origin === origenPropi && !url.username && !url.password ? url : null;
  } catch {
    return null;
  }
}

/**
 * Què demana un missatge de la pàgina: { recursos, closca } o null. Tot es
 * torna a validar ací: cada recurs ha de passar classificaPeticio com a
 * recurs amb empremta del mateix origen i sense consulta, sense repetir i com
 * a molt MAXIM_RECURSOS; la closca, un camí de /app/* de l'origen propi,
 * sense consulta i que en tinga (camiDeLaClosca).
 * `dades`: { tipus: MISSATGE_ESCALFAMENT, recursos: [camí], closca: camí }.
 */
function planDEscalfament(dades, origenPropi) {
  if (!dades || typeof dades !== 'object' || dades.tipus !== MISSATGE_ESCALFAMENT) return null;
  const recursos = [];
  for (const cami of Array.isArray(dades.recursos) ? dades.recursos : []) {
    if (recursos.length >= MAXIM_RECURSOS) break;
    const url = urlPropia(cami, origenPropi);
    if (!url || classificaPeticio({ metode: 'GET', url: url.href, mode: 'cors', cache: 'default' }, origenPropi) !== CLASSE.RECURS) continue;
    if (!recursos.includes(url.pathname)) recursos.push(url.pathname);
  }
  const url = urlPropia(dades.closca, origenPropi);
  const closca = url && !url.search && camiDeLaClosca(url.pathname) &&
    !PREFIXOS_DE_SERVEI.some((prefix) => url.pathname.startsWith(prefix)) ? url.pathname : null;
  return recursos.length || closca ? { recursos, closca } : null;
}

/** Memòries que s'esborren en activar: versions velles pròpies i les llegades. */
function cachesAEsborrar(noms, actuals) {
  const vives = [].concat(actuals);
  return noms.filter((nom) => !vives.includes(nom) &&
    (nom.startsWith(PREFIX_PROPI) || PREFIXOS_LLEGATS.some((prefix) => nom.startsWith(prefix)) ||
      NOMS_LLEGATS.includes(nom)));
}

/** Si un missatge és l'ordre de saltar l'espera de la PWA de juny: un objecte amb `type` exactament 'SKIP_WAITING'. */
function esOrdreLlegadaDeSaltarEspera(dades) {
  return Boolean(dades) && typeof dades === 'object' && dades.type === MISSATGE_LLEGAT_SALTA_ESPERA;
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

/**
 * La pàgina «Sense connexió»: sense JavaScript, amb els valors dels tokens de
 * Pedra Seca. `deLesApps`: per a una navegació de /app/* sense closca que es
 * puga arrencar, diu com deixar l'app preparada; la resta, el text de sempre.
 */
function paginaSenseConnexio(deLesApps = false) {
  const explicacio = deLesApps
    ? "<p>Esta app encara no està guardada en este dispositiu per a obrir-se sense connexió. Obri-la una vegada amb connexió i la pròxima vegada també s'obrirà sense xarxa.</p>"
    : '<p>Sóc de Poble necessita la xarxa per a mostrar-te el poble: les dades viuen al servidor i este dispositiu no en guarda cap còpia.</p>';
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
${explicacio}
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
  const adreca = new URL(url);
  return {
    status: resposta.status,
    tipus: resposta.type,
    redirigida: resposta.redirected === true,
    contentType: resposta.headers.get('content-type') || '',
    cacheControl: resposta.headers.get('cache-control') || '',
    cami: adreca.pathname,
    consulta: adreca.search !== ''
  };
}

function respostaSenseConnexio(deLesApps = false) {
  return new Response(paginaSenseConnexio(deLesApps), {
    status: 503,
    statusText: 'Service Unavailable',
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Security-Policy': CSP_SENSE_CONNEXIO
    }
  });
}

/** La clau (URL) de la closca de la ruta `cami`, en l'origen propi, o null. */
function urlDeLaClosca(cami) {
  const propi = camiDeLaClosca(cami);
  return propi ? new URL(propi, self.location.origin).href : null;
}

/** La clau desada amb esta URL, o null: keys() torna les capçaleres. */
async function clauDeLaMemoria(memoria, url) {
  return (await memoria.keys()).find((clau) => clau.url === url) || null;
}

/** La closca d'una clau desada tal com la llig llistesDeLaClosca, o null. */
function closcaAnterior(clau) {
  if (!clau) return null;
  return { html: recursosDeLaClau(clau), pagina: esCloscaConfirmada(clau) ? recursosDeLaClau(clau, CAPCALERA_RECURSOS_PAGINA) : null };
}

/* Les escriptures de la closca (llegir la clau, combinar les llistes i
   escriure) van en fila: una navegació i un missatge que arriben alhora no es
   trepitgen, i cap confirmació es perd. Una feina que falla no para la fila. */
let filaDeLaClosca = Promise.resolve();
function enFila(feina) {
  const resultat = filaDeLaClosca.then(feina);
  filaDeLaClosca = resultat.catch(() => {});
  return resultat;
}

/* Com a molt MAXIM_CLOSQUES: ixen les que fa més temps que es van desar (un
   put d'una clau que ja hi és la porta al final). */
function podaLesClosques(memoria) {
  return memoria.keys().then((claus) => Promise.all(
    clausSobrants(claus.map((clau) => ({ clau, mida: 0 })), MAXIM_CLOSQUES, Infinity).map((clau) => memoria.delete(clau))
  ));
}

/* Desa la closca de l'app de la ruta `cami`. `perLlegir` i `perDesar` són dos
   còpies: llegir-ne una no consumix l'altra ni la de la pàgina. Un HTML que
   no demana cap recurs amb empremta no es desa. Des d'una navegació
   (`carregats` null) es conserva la confirmació si l'HTML és del mateix
   build. Des de l'escalfament, `carregats` són els recursos de la pàgina, ja
   tots a la memòria: si la pàgina no és del build de l'HTML (una pestanya
   vella), no es toca res; si ho és, la closca queda confirmada amb ells. */
async function desaCloscaDe(cami, perLlegir, perDesar, carregats = null) {
  const url = urlDeLaClosca(cami);
  if (!url) return;
  const html = recursosDeLHtml(await perLlegir.text());
  if (!html.length || (carregats && !esDelBuild(html, carregats))) return;
  await enFila(async () => {
    const memoria = await caches.open(MEMORIA_CLOSCA);
    const llistes = llistesDeLaClosca(html, closcaAnterior(await clauDeLaMemoria(memoria, url)), carregats);
    await memoria.put(new Request(url, { headers: capcaleresDeLaClosca(llistes) }), perDesar);
    await podaLesClosques(memoria);
  });
}

/* Confirma la closca desada de l'app de la ruta `cami` amb els recursos que
   la seua pàgina ha carregat (`carregats`, ja tots a la memòria), si la
   pàgina és del build de la closca. Torna si la closca desada és d'eixe
   build: llavors no cal demanar-la a la xarxa. Si no hi ha res de nou, no
   la torna a escriure. */
function confirmaLaClosca(cami, carregats) {
  const url = urlDeLaClosca(cami);
  if (!url) return Promise.resolve(true);
  return enFila(async () => {
    const memoria = await caches.open(MEMORIA_CLOSCA);
    const clau = await clauDeLaMemoria(memoria, url);
    const anterior = closcaAnterior(clau);
    if (!anterior || !esDelBuild(anterior.html, carregats)) return false;
    const llistes = llistesDeLaClosca(anterior.html, anterior, carregats);
    if (anterior.pagina && llistes.pagina.length === anterior.pagina.length) return true;
    const resposta = await memoria.match(clau, { ignoreVary: true });
    if (!resposta) return false;
    await memoria.put(new Request(url, { headers: capcaleresDeLaClosca(llistes) }), resposta);
    return true;
  });
}

/* La closca de l'app de la ruta `cami` (revisió F1: mai la d'una altra app),
   només si la seua pàgina l'ha confirmada i si tots els recursos que demana,
   els de l'HTML i els que la pàgina ha carregat, continuen a la memòria: si la
   poda (o una versió nova del worker) se n'ha endut cap, arrencar-la donaria
   un error de càrrega, i val més la pàgina honesta. Si la memòria falla,
   tampoc n'hi ha. */
async function closcaDesada(cami) {
  try {
    const url = urlDeLaClosca(cami);
    if (!url) return null;
    const memoria = await caches.open(MEMORIA_CLOSCA);
    const clau = await clauDeLaMemoria(memoria, url);
    const recursos = recursosPerArrencar(clau);
    if (!recursos) return null;
    const desats = await caches.open(MEMORIA_RECURSOS);
    for (const recurs of recursos) {
      if (!(await desats.match(new URL(recurs, self.location.origin).href, { ignoreVary: true }))) return null;
    }
    return (await memoria.match(clau, { ignoreVary: true })) || null;
  } catch {
    return null;
  }
}

/* Xarxa primer. Primer la precàrrega de navegació (ja ha eixit mentre el
   worker arrencava); si no n'hi ha, o falla, la xarxa una vegada. Un error
   HTTP del servidor arriba tal qual; només la falta de xarxa porta la pàgina
   honesta. Fora de /app/* no s'obri cap memòria i cap navegació es guarda.
   A /app/*, una resposta bona es desa com a closca de la seua app i, sense
   xarxa, es dona la closca d'eixa app si encara es pot arrencar. */
async function navega(event) {
  const cami = new URL(event.request.url).pathname;
  const app = esCamiDApp(cami);
  let resposta = null;
  try {
    resposta = (await event.preloadResponse) || null;
  } catch {
    /* precàrrega fallida: es prova la xarxa */
  }
  if (!resposta) {
    try {
      resposta = await fetch(event.request);
    } catch {
      if (!app) return respostaSenseConnexio();
      return (await closcaDesada(cami)) || respostaSenseConnexio(true);
    }
  }
  if (app && esCloscaGuardable(descriuResposta(resposta, event.request.url))) {
    event.waitUntil(desaCloscaDe(cami, resposta.clone(), resposta.clone()).catch(() => {}));
  }
  return resposta;
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

/* L'escalfament que demana la pàgina d'una app: primer els recursos que ja
   ha carregat i encara no són a la memòria, d'un en un, amb els filtres i els
   sostres d'un fetch (desa poda a cada entrada); sense xarxa, després del
   primer error ja no en demana cap més. Després, la closca de l'app de la
   pàgina, només si TOTS eixos recursos són a la memòria (un que no s'ha pogut
   desar no confirma res: la closca que ja hi havia queda com estava):
     · si la closca desada és del build de la pàgina, la confirma amb ells
       (confirmaLaClosca), sense xarxa;
     · si no n'hi ha o és d'un altre build, la demana a la xarxa i la desa
       confirmada, si la pàgina és del build que torna el servidor.
   Cap petició porta Authorization: les fa el worker, de zero. */
async function escalfa(pla) {
  const origen = self.location.origin;
  const memoria = await caches.open(MEMORIA_RECURSOS);
  let senseXarxa = false;
  let falten = 0;
  for (const cami of pla.recursos) {
    const peticio = new Request(new URL(cami, origen).href);
    if (await memoria.match(peticio)) continue;
    let resposta = null;
    if (!senseXarxa) {
      try {
        resposta = await fetch(peticio);
      } catch {
        senseXarxa = true;
      }
    }
    if (resposta && esRespostaGuardable(descriuResposta(resposta, peticio.url))) await desa(memoria, peticio, resposta.clone(), resposta.clone());
    else falten += 1;
  }
  /* Sense recursos de la pàgina no hi ha res amb què confirmar-la. */
  if (!pla.closca || !pla.recursos.length || falten > 0 || await confirmaLaClosca(pla.closca, pla.recursos)) return;
  const url = new URL(pla.closca, origen).href;
  let resposta;
  try {
    resposta = await fetch(new Request(url, { credentials: 'same-origin', cache: 'no-cache', headers: { Accept: 'text/html' } }));
  } catch {
    return;
  }
  if (esCloscaGuardable(descriuResposta(resposta, url))) await desaCloscaDe(pla.closca, resposta.clone(), resposta, pla.recursos);
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
      caches.keys().then((noms) => Promise.all(cachesAEsborrar(noms, MEMORIES_VIVES).map((nom) => caches.delete(nom))))
    ]).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const classe = classificaPeticio(descriuPeticio(event.request), self.location.origin);
  if (classe === CLASSE.NAVEGACIO) event.respondWith(navega(event));
  else if (classe === CLASSE.RECURS) event.respondWith(recursAmbEmpremta(event));
});

/* Només missatges de pàgines de l'origen propi: l'ordre de juny (salta
   l'espera, i en activar ix la seua precàrrega) o la forma de
   planDEscalfament; la resta, res. */
self.addEventListener('message', (event) => {
  if (event.origin && event.origin !== self.location.origin) return;
  if (esOrdreLlegadaDeSaltarEspera(event.data)) {
    const salt = Promise.resolve(self.skipWaiting()).catch(() => {});
    if (typeof event.waitUntil === 'function') event.waitUntil(salt);
    return;
  }
  const pla = planDEscalfament(event.data, self.location.origin);
  if (!pla) return;
  const feina = escalfa(pla).catch(() => {});
  if (typeof event.waitUntil === 'function') event.waitUntil(feina);
});
