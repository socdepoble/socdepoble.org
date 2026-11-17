/**
 * natiu/actualitzacioAppNativa.js — Onada R32.3 (ordre directa del Mestre, 16-11-2026 22:09:
 * «les actualitzacions han de ser completament automàtiques i en tot el sistema») · El
 * detector de versió nova de l'App de Capacitor (Android i iOS).
 *
 * Integrat a la maquinària que ja hi havia (lliçó 261007: una sola barra): no pinta res
 * propi. Quan troba una versió nova, la publica al registre de config/actualitzacioRecomanada.js
 * i la pinta BarraActualitzacioRecomanada (App.jsx), en les 5 llengües, amb el botó d'un toc i
 * l'ajornament per versió de sempre.
 *
 * QUAN · En arrencar i en tornar a primer pla: `visibilitychange` (visible) i l'esdeveniment
 * `resume` del document que disparen els dos ponts de Capacitor 8 (Android:
 * MockCordovaWebViewImpl.handleResume; iOS: CapacitorBridge, willEnterForeground). Cap paquet
 * natiu nou: @capacitor/app (appStateChange) no és al projecte.
 *
 * QUÈ · Un GET de https://socdepoble.org/.well-known/ard.json, l'únic manifest de versió que
 * llig l'App. Hi mana el build de cada plataforma, el número que la botiga sap ordenar
 * (versionCode d'Android, CFBundleVersion d'iOS; el mateix que VERSIO_CLIENT_NATIU):
 *   · `androidBuild` / `iosBuild` · el darrer build que JA DONA el canal que obri el botó
 *     (Google Play a Android; l'App Store a iOS, no TestFlight). Mai el compilat ni un de pujat
 *     que la botiga encara no servix: una xifra més alta prometria una versió que no hi és i la
 *     barra tornaria a cada obertura. Si s'avança, el manifest el pot retirar (FONT, ací davall);
 *   · `version` · la versió semàntica del sistema (package.json). Només veta: un servidor
 *     amb una versió semàntica més vella que la de l'App no anuncia res, encara que el build
 *     siga més alt (un manifest incoherent no fa baixar ningú).
 * Hi ha versió nova si i només si build del servidor > VERSIO_CLIENT_NATIU i versió del servidor
 * ≥ VERSIO_SISTEMA (config/versio.js). public/versio-viva.json no el llig cap App
 * (versioViva.botigues.test.js).
 *
 * COM · Fail-silent i net: sense xarxa, amb un tall (TEMPS_MAXIM_CONSULTA_MS), una resposta
 * no 2xx, un JSON trencat o massa gran, l'App continua igual i la consola queda neta. Mai
 * dues consultes alhora. Només una consulta que duu un manifest vàlid gasta la franja sencera
 * (INTERVAL_MINIM_CONSULTES_MS: les tornades a primer pla en ràfega no pregunten); una de
 * fallida torna a provar-ho al cap de poc (RETROCES_FALLADA_MS) mentre l'App siga visible, i
 * navigator.onLine === false no pregunta: l'esdeveniment 'online' hi tornarà. Amb l'App oberta i
 * visible, una comprovació cada INTERVAL_PERIODIC_MS (una App que no es tanca mai també s'assabenta);
 * en segon pla, cap. Sense galetes, sense Referer i amb revalidació (cache: 'no-cache': un 304).
 *
 * FONT · Publica com a FONT_MANIFEST: la barra mostra la recomanació més alta entre esta font i
 * la del port del node, i un manifest que retira el build (o el rebaixa) retira el que esta
 * font havia publicat, dins de la mateixa sessió. Una consulta fallida no retira res.
 *
 * DIAGNOSI · Cada pas deixa { motiu, quan, … } a anotaDiagnosiActualitzacio (registre de config/,
 * llegible fora de src/natiu/): 'inert-plataforma', 'inert-csp', 'sense-xarxa', 'tall',
 * 'http-<codi>', 'json', 'manifest-invalid', 'al-dia', 'publicada', 'error-publica'… Mai a la consola.
 *
 * CANALS DE PROVES · Onada v1.2.7 · P0-123 (ordre directa del Mestre, 17-11-2026: «actualització
 * automàtica real als mòbils de prova») · androidBuild i iosBuild són el sòl de les botigues públiques
 * i els mòbils de prova (TestFlight i l'APK directe) no rebien cap avís. Ara el detector pregunta d'on
 * ve l'App (natiu/origenInstallacio.js) i llig dos canals més del manifest (config/manifestVersio.js):
 *   · iOS · només si l'App ve de TestFlight (demostrat: el rebut de proves) i `testflightIosBuild` > el
 *     build instal·lat: l'avís obri TestFlight (canal 'testflight'). Si no, i també quan l'origen no es
 *     pot saber (P0123-02: una App de l'App Store amb el pont mut no ha de vore mai TestFlight), el de
 *     l'App Store, com sempre. L'App en App Review també porta el rebut de proves: la guarda és de
 *     publica-tot.mjs --sincronitza-proves, que no anuncia TestFlight per damunt d'un build en revisió.
 *   · Android · si l'App NO ve de Google Play (instal·lació directa) i `apkDirectBuild` > el build
 *     instal·lat: l'avís obri la baixada de l'APK signat i diu la seua SHA-256 (canal 'apk'). Si no, o
 *     si ve de Google Play, o si no es pot saber, el de Google Play, com sempre.
 *   · El veto de la versió semàntica val igual per a tots els canals, i un manifest d'abans (sense els
 *     camps nous) o amb un camp nou mal format dona exactament el comportament d'abans.
 * Els camps nous només els escriu scripts/botigues/publica-tot.mjs --sincronitza-proves, quan la
 * pujada a App Store Connect (puja-ios.mjs, registre de pujades) o l'APK publicat (--publica-apk) ho
 * acrediten.
 *
 * PORTES · Només a 'android' i 'ios' (la web, la PWA i el connector de WordPress no hi arriben:
 * src/natiu/ és un pou, frontera.test.js). I només si la CSP de la closca nativa (la meta que
 * escriu vite.natiu.config.js) permet connectar amb socdepoble.org: sense meta CSP (fora de
 * la closca) o sense permís, el detector queda inert ('inert-csp') i no deixa cap «Refused to
 * connect» a la consola. tests/agentic-browsing-ard-llms.test.mjs lliga eixa porta amb la CSP REAL
 * (cspNativa) i amb la capçalera Access-Control-Allow-Origin de /.well-known/ard.json a firebase.json,
 * que permet la lectura entre orígens (capacitor://localhost, https://localhost).
 */
import {
  CANALS_ACTUALITZACIO,
  ENLLAC_ANDROID_MARKET,
  ENLLAC_APK_DIRECTE,
  ENLLAC_TESTFLIGHT,
  FONT_MANIFEST,
  anotaDiagnosiActualitzacio,
  enllacBotigaPerDefecte,
  publicaActualitzacioRecomanada
} from '../config/actualitzacioRecomanada.js';
import { comparaSemver, llegixCanalsManifest } from '../config/manifestVersio.js';
import { ORIGEN_PUBLIC_PER_DEFECTE } from '../config/origenPublic.js';
import { VERSIO_CLIENT_NATIU } from '../data/contracte.js';
import { ORIGENS, consultaOrigenInstallacio } from './origenInstallacio.js';

/* v1.2.7 · La comparació viu ara a config/manifestVersio.js (la llig també la PWA); ací es reexporta. */
export { comparaSemver };

/* La versió de package.json (config/versio.js) arriba per import() i només quan el detector
   pregunta de veres: fora de la closca (la web, les proves de l'entrada) el graf de mòduls de
   l'entrada nativa queda igual que abans. Al paquet natiu ja hi és (el peu de les pàgines). */
const versioDelPaquet = () => import('../config/versio.js').then((modul) => modul.VERSIO_SISTEMA);

export const URL_MANIFEST_VERSIO = `${ORIGEN_PUBLIC_PER_DEFECTE}/.well-known/ard.json`;
export const TEMPS_MAXIM_CONSULTA_MS = 5000;
export const INTERVAL_MINIM_CONSULTES_MS = 10 * 60 * 1000;
/** Amb l'App oberta i visible, una comprovació cada hora. */
export const INTERVAL_PERIODIC_MS = 60 * 60 * 1000;
/** Després de la 1a, 2a, 3a i 4a fallada seguides; després, l'interval mínim. */
export const RETROCES_FALLADA_MS = Object.freeze([30 * 1000, 60 * 1000, 2 * 60 * 1000, 5 * 60 * 1000]);
export const MIDA_MAXIMA_MANIFEST = 64 * 1024;

/** El camp del build de cada plataforma al manifest. */
export const CAMP_BUILD = Object.freeze({ android: 'androidBuild', ios: 'iosBuild' });

/**
 * { versio, build } de la plataforma (la botiga pública), o null si el manifest no porta les dues
 * coses ben formades. v1.2.7 · I, només quan hi són i són vàlids, el canal de proves de la
 * plataforma: `testflightBuild` a iOS; `apkBuild` i `apkSha256` (sempre junts) a Android.
 */
export function llegixManifestVersio(manifest, plataforma) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) return null;
  const camp = Object.hasOwn(CAMP_BUILD, plataforma) ? CAMP_BUILD[plataforma] : null;
  if (!camp) return null;
  const canals = llegixCanalsManifest(manifest);
  const versio = canals?.versio ?? null;
  const build = canals?.[camp] ?? null;
  if (versio === null || build === null) return null;
  if (plataforma === 'ios' && canals.testflightIosBuild !== null) return { versio, build, testflightBuild: canals.testflightIosBuild };
  if (plataforma === 'android' && canals.apkDirectBuild !== null) {
    return { versio, build, apkBuild: canals.apkDirectBuild, apkSha256: canals.apkSha256 };
  }
  return { versio, build };
}

/**
 * L'avís per al registre de la barra si el servidor té una versió més nova; si no, null.
 * El build mana; la versió semàntica només veta un servidor més vell.
 * v1.2.7 · `origen` (natiu/origenInstallacio.js; per defecte, desconegut) tria el canal: TestFlight
 * només per a una App de TestFlight a iOS (P0123-02: l'origen desconegut va a l'App Store), l'APK
 * directe per a una App que no ve de Google Play a Android; si el canal de proves no té res de nou, la
 * botiga pública, com sempre.
 */
export function novaVersioDisponible(manifest, {
  plataforma, versioLocal, buildLocal = VERSIO_CLIENT_NATIU, origen = ORIGENS.DESCONEGUT
} = {}) {
  if (!manifest || !Object.hasOwn(CAMP_BUILD, plataforma)) return null;
  if (!Number.isSafeInteger(buildLocal)) return null;
  const ordre = comparaSemver(manifest.versio, versioLocal);
  if (ordre === null || ordre < 0) return null;
  const mesNou = (build) => Number.isSafeInteger(build) && build > buildLocal;
  if (plataforma === 'ios' && origen === ORIGENS.TESTFLIGHT && mesNou(manifest.testflightBuild)) {
    return {
      plataforma,
      canal: CANALS_ACTUALITZACIO.TESTFLIGHT,
      versioRecomanada: manifest.testflightBuild,
      versio: manifest.versio,
      enllac: ENLLAC_TESTFLIGHT,
      marketUrl: null
    };
  }
  if (plataforma === 'android' && origen === ORIGENS.DIRECTA && mesNou(manifest.apkBuild) && typeof manifest.apkSha256 === 'string') {
    return {
      plataforma,
      canal: CANALS_ACTUALITZACIO.APK,
      versioRecomanada: manifest.apkBuild,
      versio: manifest.versio,
      enllac: ENLLAC_APK_DIRECTE,
      marketUrl: null,
      sha256: manifest.apkSha256
    };
  }
  if (!mesNou(manifest.build)) return null;
  return {
    plataforma,
    versioRecomanada: manifest.build,
    versio: manifest.versio,
    enllac: enllacBotigaPerDefecte(plataforma),
    marketUrl: plataforma === 'android' ? ENLLAC_ANDROID_MARKET : null
  };
}

/** Cert si el text d'una política CSP deixa connectar amb l'origen de `desti`. */
function politicaPermet(politica, desti) {
  let fonts = null;
  let perDefecte = null;
  for (const bloc of String(politica ?? '').split(';')) {
    const [nom, ...valors] = bloc.trim().split(/\s+/);
    const directiva = nom?.toLowerCase();
    if (directiva === 'connect-src' && fonts === null) fonts = valors;
    else if (directiva === 'default-src' && perDefecte === null) perDefecte = valors;
  }
  const efectives = fonts ?? perDefecte;
  if (efectives === null) return true;
  return efectives.some((font) => font === '*' || font.toLowerCase() === desti.protocol
    || font.replace(/\/+$/, '').toLowerCase() === desti.origin);
}

/**
 * Cert només dins d'una closca amb CSP (la meta de l'App nativa) que deixa connectar amb l'origen
 * de `url`. Sense cap meta CSP, fals (fora de la closca no es pregunta). Mai llança.
 */
export function connexioPermesaPerCsp(url, document) {
  try {
    const desti = new URL(url);
    const metes = [...(document?.querySelectorAll?.('meta[http-equiv]') ?? [])]
      .filter((meta) => String(meta.getAttribute('http-equiv')).toLowerCase() === 'content-security-policy');
    return metes.length > 0 && metes.every((meta) => politicaPermet(meta.getAttribute('content'), desti));
  } catch {
    return false;
  }
}

/**
 * La consulta amb el seu resultat: { json } o { motiu } ('sense-xarxa', 'tall', 'http-<codi>',
 * 'massa-gran', 'json'). Mai llança ni escriu a la consola.
 */
async function consultaAmbMotiu({ url, fetchImpl, tempsMaxim, rellotge }) {
  if (typeof fetchImpl !== 'function') return { motiu: 'sense-fetch' };
  let control = null;
  try { control = typeof AbortController === 'function' ? new AbortController() : null; } catch { control = null; }
  let temporitzador = null;
  const tall = new Promise((resolve) => {
    temporitzador = rellotge.setTimeout(() => {
      try { control?.abort(); } catch { /* res */ }
      resolve({ motiu: 'tall' });
    }, tempsMaxim);
  });
  const lectura = (async () => {
    let resposta;
    try {
      resposta = await fetchImpl(url, {
        method: 'GET',
        cache: 'no-cache',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        headers: { Accept: 'application/json' },
        ...(control ? { signal: control.signal } : {})
      });
    } catch {
      return { motiu: 'sense-xarxa' };
    }
    if (!resposta?.ok) return { motiu: `http-${Number.isSafeInteger(resposta?.status) ? resposta.status : 0}` };
    const text = await resposta.text();
    if (typeof text !== 'string') return { motiu: 'json' };
    if (text.length > MIDA_MAXIMA_MANIFEST) return { motiu: 'massa-gran' };
    try { return { json: JSON.parse(text) }; } catch { return { motiu: 'json' }; }
  })().catch(() => ({ motiu: 'sense-xarxa' }));
  try {
    return await Promise.race([lectura, tall]);
  } finally {
    try { rellotge.clearTimeout(temporitzador); } catch { /* res */ }
  }
}

/**
 * Llig el manifest. Torna l'objecte JSON o null (sense xarxa, tall, no 2xx, massa gran o
 * trencat). Mai llança ni escriu a la consola.
 */
export async function consultaManifestVersio({
  url = URL_MANIFEST_VERSIO,
  fetchImpl = null,
  tempsMaxim = TEMPS_MAXIM_CONSULTA_MS,
  rellotge = globalThis
} = {}) {
  const resultat = await consultaAmbMotiu({ url, fetchImpl, tempsMaxim, rellotge });
  return Object.hasOwn(resultat, 'json') ? resultat.json : null;
}

const PLATAFORMES = new Set(Object.keys(CAMP_BUILD));

const missatgeDe = (error) => String(error?.message ?? error).slice(0, 200);

/**
 * Engega el detector: una consulta ara, una altra a cada tornada a primer pla i a cada tornada
 * de la xarxa (amb el límit de freqüència), un reintent curt després d'una fallada i una
 * comprovació periòdica mentre l'App siga visible. Torna { comprova(), tanca(), estat() } o null
 * si no hi ha res a fer (no és l'App nativa, no hi ha fetch o la CSP no ho permet; el motiu queda
 * a la diagnosi). Mai llança.
 */
export function iniciaActualitzacioAppNativa({
  plataforma,
  publica = publicaActualitzacioRecomanada,
  diagnostica = anotaDiagnosiActualitzacio,
  finestra = globalThis,
  fetchImpl = typeof finestra?.fetch === 'function' ? (url, opcions) => finestra.fetch(url, opcions) : null,
  ara = () => Date.now(),
  versioLocal = null,
  buildLocal = VERSIO_CLIENT_NATIU,
  url = URL_MANIFEST_VERSIO,
  intervalMinim = INTERVAL_MINIM_CONSULTES_MS,
  intervalPeriodic = INTERVAL_PERIODIC_MS,
  retroces = RETROCES_FALLADA_MS,
  tempsMaxim = TEMPS_MAXIM_CONSULTA_MS,
  consultaOrigen = null
} = {}) {
  const instantActual = () => { try { const t = ara(); return Number.isFinite(t) ? t : null; } catch { return null; } };
  let estat = null;
  const anota = (motiu, extra = {}) => {
    estat = Object.freeze({ motiu, quan: instantActual(), ...extra });
    try { diagnostica?.(estat); } catch { /* la diagnosi no tomba mai el detector */ }
    return estat;
  };
  try {
    if (!PLATAFORMES.has(plataforma)) { anota('inert-plataforma'); return null; }
    if (typeof fetchImpl !== 'function' || typeof publica !== 'function') { anota('inert-sense-fetch'); return null; }
    const document = finestra?.document;
    if (typeof document?.addEventListener !== 'function') { anota('inert-sense-document'); return null; }
    if (!connexioPermesaPerCsp(url, document)) { anota('inert-csp', { url }); return null; }
    const rellotge = typeof finestra.setTimeout === 'function' ? finestra : globalThis;
    /* v1.2.7 · L'origen de l'App no canvia mentre corre: un origen sabut es guarda; un de desconegut
       (un tall del pont, per exemple) es torna a preguntar en la comprovació següent. Mai llança. */
    const pregunta = typeof consultaOrigen === 'function'
      ? consultaOrigen
      : () => consultaOrigenInstallacio({ plataforma, finestra, rellotge });
    let origenSabut = null;
    const origen = async () => {
      if (origenSabut) return origenSabut;
      let resposta = ORIGENS.DESCONEGUT;
      try { resposta = await pregunta(); } catch { resposta = ORIGENS.DESCONEGUT; }
      const valid = Object.values(ORIGENS).includes(resposta) ? resposta : ORIGENS.DESCONEGUT;
      if (valid !== ORIGENS.DESCONEGUT) origenSabut = valid;
      return valid;
    };

    let tancat = false;
    let enCurs = null;
    let darrera = -Infinity;   // quan va eixir la darrera consulta
    let espera = 0;            // quant cal esperar des d'ella: l'interval mínim si va dur un manifest; un retrocés si no
    let fallades = 0;
    let publicada = null;      // el build que esta font té publicat a la barra (null: cap)
    let canalPublicat = null;  // v1.2.7 · i el seu canal (null: el de la botiga)
    let proper = null;         // la comprovació programada (reintent o periòdica)

    const visible = () => document.visibilityState !== 'hidden';
    const programa = (retard) => {
      try { if (proper !== null) rellotge.clearTimeout(proper); } catch { /* res */ }
      proper = null;
      if (tancat || !(retard > 0)) return;
      proper = rellotge.setTimeout(() => {
        proper = null;
        // En segon pla no es pregunta: la tornada a primer pla ja ho farà.
        if (!tancat && visible()) comprova();
      }, retard);
    };

    const comprova = () => {
      if (tancat) return Promise.resolve(null);
      if (enCurs) return enCurs;
      const instant = instantActual();
      if (instant === null) return Promise.resolve(null);
      // En valor absolut: un rellotge del telèfon que torna arrere no deixa el detector mut per hores.
      if (Math.abs(instant - darrera) < espera) return Promise.resolve(null);
      // Sense xarxa segur: no gasta cap franja; l'esdeveniment 'online' hi tornarà.
      if (finestra?.navigator?.onLine === false) { anota('sense-xarxa', { fallades }); return Promise.resolve(null); }
      darrera = instant;
      enCurs = consultaAmbMotiu({ url, fetchImpl, tempsMaxim, rellotge })
        .then(async (resultat) => {
          if (tancat) return null;
          const manifest = Object.hasOwn(resultat, 'json') ? llegixManifestVersio(resultat.json, plataforma) : null;
          if (!manifest) {
            // Una consulta fallida no retira res del que ja es va publicar i torna a provar-ho al cap de poc.
            fallades += 1;
            espera = Math.min(retroces[fallades - 1] ?? intervalMinim, intervalMinim);
            anota(resultat.motiu ?? 'manifest-invalid', { fallades });
            programa(espera);
            return null;
          }
          fallades = 0;
          espera = intervalMinim;
          programa(intervalPeriodic);
          const versio = versioLocal ?? await versioDelPaquet();
          if (tancat) return null;
          const deOn = await origen();
          if (tancat) return null;
          const avis = novaVersioDisponible(manifest, { plataforma, versioLocal: versio, buildLocal, origen: deOn });
          const build = avis?.versioRecomanada ?? null;
          const canal = avis?.canal ?? null;
          if (build !== publicada || canal !== canalPublicat) {
            // Una de nova, una de més alta o la retirada (null) del que esta font havia publicat.
            try {
              publica(avis, FONT_MANIFEST);
            } catch (error) {
              anota('error-publica', { build: manifest.build, error: missatgeDe(error) });
              return null;
            }
            publicada = build;
            canalPublicat = canal;
          }
          anota(avis ? 'publicada' : 'al-dia', {
            build: manifest.build,
            versio: manifest.versio,
            origen: deOn,
            ...(canal ? { canal, buildCanal: build } : null)
          });
          return avis;
        })
        .catch((error) => { anota('error', { error: missatgeDe(error) }); return null; })
        .finally(() => { enCurs = null; });
      return enCurs;
    };
    const enTornarVisible = () => { if (document.visibilityState === 'visible') comprova(); };
    const enReprendre = () => { comprova(); };
    const enTornarLaXarxa = () => { if (visible()) comprova(); };
    document.addEventListener('visibilitychange', enTornarVisible);
    document.addEventListener('resume', enReprendre);
    try { finestra.addEventListener?.('online', enTornarLaXarxa); } catch { /* res */ }
    anota('engegat');
    comprova();
    return {
      comprova,
      estat: () => estat,
      tanca() {
        if (tancat) return;
        tancat = true;
        programa(0);
        try {
          document.removeEventListener('visibilitychange', enTornarVisible);
          document.removeEventListener('resume', enReprendre);
          finestra.removeEventListener?.('online', enTornarLaXarxa);
        } catch { /* res */ }
      }
    };
  } catch (error) {
    anota('error', { error: missatgeDe(error) });
    return null;
  }
}
