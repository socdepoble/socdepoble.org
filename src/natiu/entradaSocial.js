/* Fase D (261020, tasca 1; ordre del Mestre) · L'adaptador natiu de l'entrada
   amb Apple i Google: el full del sistema (Sign in with Apple, el selector de
   comptes de Google) i el nonce, i res més. El testimoni que en trau va al port
   (capacitat 'entradaAmbToken', grant id_token de GoTrue): ací no hi ha cap
   sessió ni cap petició al backend.
   És l'ÚNIC fitxer que nomena el connector (decisió D0 del Mestre:
   @capgo/capacitor-social-login 8.5.12 exacte) i només per un import() dinàmic,
   al primer toc: el seu JS d'entrada importa de seguida els proveïdors web i llig
   l'emmagatzematge, i ni la web ni el connector de WordPress no l'han de vore mai
   (src/natiu/frontera.test.js). La plataforma es llig del pont que l'app injecta
   abans de la pàgina; mai s'importa el nucli de l'app nativa.
   Decisions del Mestre (261020 15:15): Apple NOMÉS a iOS; Android, Google natiu i
   el correu; Google a iOS sempre amb forcePrompt. */
import { CODI_ENTRADA_NATIVA } from '../config/entradaNativa.js';
import { esquemaInvertitDeGoogleIos } from '../config/publicCredentials.js';
import { nonceNou, sha256Hex } from './resum.js';

const PLATAFORMES = new Set(['ios', 'android']);
const TOPALL_INICI_MS = 20000;   // càrrega del connector + initialize; el full no en té
const textNet = (v) => (typeof v === 'string' ? v.trim() : '');
const errorNatiu = (code, missatge, causa) => Object.assign(new Error(missatge, { cause: causa }), { code });

/** Del pont que l'app nativa injecta abans de la pàgina (precedent: pwa/registre.js). Mai llança. */
export function plataformaDelDispositiu(finestra = globalThis) {
  try {
    const plataforma = finestra?.Capacitor?.getPlatform?.();
    return PLATAFORMES.has(plataforma) ? plataforma : 'web';
  } catch { return 'web'; }
}

/* Quins proveïdors oferix este dispositiu. Apple a Android queda fora per decisió
   del Mestre (D7: caldria el flux del navegador del sistema, §3.3). A iOS, Google
   només amb els dos clients i l'iOS amb forma de client: sense iOSClientId (o sense
   el seu esquema a Info.plist, que el build natiu contrasta), GoogleSignIn peta en natiu. */
export function proveidorsDe(plataforma, { googleWeb, googleIos } = {}) {
  const web = textNet(googleWeb);
  if (plataforma === 'ios') return ['apple', ...(web && esquemaInvertitDeGoogleIos(googleIos) ? ['google'] : [])];
  if (plataforma === 'android') return web ? ['google'] : [];
  return [];
}

/** Les opcions d'initialize: només dels proveïdors oferits, i Apple només a iOS. */
export function opcionsDInici(plataforma, { googleWeb, googleIos } = {}, proveidors = []) {
  const opcions = {};
  if (proveidors.includes('google')) {
    opcions.google = plataforma === 'ios'
      ? { iOSClientId: textNet(googleIos), iOSServerClientId: textNet(googleWeb), mode: 'online' }
      : { webClientId: textNet(googleWeb), mode: 'online' };
  }
  if (proveidors.includes('apple') && plataforma === 'ios') opcions.apple = { redirectUrl: '', useProperTokenExchange: true };
  return opcions;
}

/* forcePrompt a iOS: abans de la 8.7.1 del connector, una sessió de Google
   restaurada torna un testimoni sense el nostre nonce. Mai scopes: a Android
   rebutgen sense canvis a MainActivity. */
export const opcionsDeLogin = (plataforma, proveidor, nonceXifrat) =>
  (proveidor === 'google' && plataforma === 'ios' ? { nonce: nonceXifrat, forcePrompt: true } : { nonce: nonceXifrat });

/* El connector ja traduïx les cancel·lacions a USER_CANCELLED (iOS i Android); el
   text és la reserva estreta d'ASAuthorizationError 1001 i de «cancelled by user». */
const CANCELACIO_TEXT = /AuthorizationError error 1001\b|\bcancell?ed by (?:the )?user\b/i;
export const esCancelacio = (e) => String(e?.code ?? '') === 'USER_CANCELLED' || CANCELACIO_TEXT.test(String(e?.message ?? ''));

/**
 * La credencial per al port. El nom només d'Apple (no és dins del testimoni); l'accés només de Google (at_hash).
 * T1 (261024; P0-04, App Store 5.1.1(v)) · El codi d'autorització, només d'Apple: amb
 * useProperTokenExchange i sense redirectUrl el connector el torna cru i sense gastar,
 * i el backend el canvia al servidor per un testimoni que la baixa pot revocar.
 */
export function credencialDe(proveidor, resultat, nonce) {
  const testimoni = textNet(resultat?.idToken);
  if (!testimoni) throw errorNatiu(CODI_ENTRADA_NATIVA.FALLIDA, 'El telèfon no ha tornat cap identificació.');
  const nom = proveidor === 'apple'
    ? [resultat?.profile?.givenName, resultat?.profile?.familyName].map(textNet).filter(Boolean).join(' ')
    : '';
  const acces = proveidor === 'google' ? textNet(resultat?.accessToken?.token) : '';   // Apple: mai com a accés
  const codi = proveidor === 'apple' ? textNet(resultat?.authorizationCode) : '';
  return { testimoni, nonce, testimoniAcces: acces || null, nom: nom || null, codiAutoritzacio: codi || null };
}

const carregaPerDefecte = () => import('@capgo/capacitor-social-login').then((m) => m.SocialLogin);
const ambTopall = (promesa, ms) => {
  let id = null;
  const topall = new Promise((_, rebutja) => {
    id = setTimeout(() => rebutja(errorNatiu(CODI_ENTRADA_NATIVA.FALLIDA, 'El connector natiu no ha respost.')), ms);
  });
  return Promise.race([promesa, topall]).finally(() => clearTimeout(id));
};

/**
 * L'adaptador per a registraEntradaNativa (config/entradaNativa.js), o null
 * només a la web. El connector es carrega i s'inicialitza al primer toc, mai en
 * arrencar; un inici fallit es reintenta al toc següent.
 * Fase D (261020, revisió) · A iOS i Android sempre hi ha adaptador, també sense
 * cap proveïdor (proveidors: []): la plataforma queda registrada, no hi ha cap
 * botó, el connector no es carrega mai i el Google web no apareix dins de l'app.
 */
export function creaEntradaSocial({ plataforma, clients = {}, carregaConnector = carregaPerDefecte } = {}) {
  if (!PLATAFORMES.has(plataforma)) return null;
  const proveidors = proveidorsDe(plataforma, clients);
  let connector = null;
  const obri = () => (connector ??= ambTopall(
    Promise.resolve().then(carregaConnector).then(async (social) => {
      await social.initialize(opcionsDInici(plataforma, clients, proveidors));
      return social;
    }),
    TOPALL_INICI_MS
  ).catch((error) => { connector = null; throw error; }));
  return Object.freeze({
    plataforma,
    proveidors: Object.freeze([...proveidors]),
    /* Fase D (261020, revisió) · viu() fals després de carregar el connector i
       abans del full: ningú no l'espera ja («Cancel·la l'entrada»), i no s'obri. */
    async demana(proveidor, { viu = () => true } = {}) {
      try {
        const nonce = nonceNou();
        const nonceXifrat = await sha256Hex(nonce);
        const social = await obri();
        if (!viu()) throw errorNatiu(CODI_ENTRADA_NATIVA.CANCELADA, 'Entrada cancel·lada abans d’obrir el full.');
        const resposta = await social.login({ provider: proveidor, options: opcionsDeLogin(plataforma, proveidor, nonceXifrat) });
        return credencialDe(proveidor, resposta?.result, nonce);
      } catch (error) {
        if (error?.code === CODI_ENTRADA_NATIVA.FALLIDA || error?.code === CODI_ENTRADA_NATIVA.CANCELADA) throw error;
        throw esCancelacio(error)
          ? errorNatiu(CODI_ENTRADA_NATIVA.CANCELADA, 'Entrada cancel·lada.', error)
          : errorNatiu(CODI_ENTRADA_NATIVA.FALLIDA, 'El telèfon no ha pogut completar l’entrada.', error);
      }
    },
    /* Sense res carregat, res a oblidar: eixir no carrega el connector. */
    oblida: (proveidor) => (connector
      ? connector.then((social) => social.logout({ provider: proveidor })).catch(() => undefined)
      : Promise.resolve())
  });
}

/**
 * Fase D (261020, revisió) · La reserva de natiu/entrada.jsx quan l'adaptador no
 * s'ha pogut registrar: la plataforma i cap botó (només el correu), sense cap
 * connector. null a la web.
 */
export function entradaSenseProveidors(plataforma) {
  if (!PLATAFORMES.has(plataforma)) return null;
  return Object.freeze({
    plataforma,
    proveidors: Object.freeze([]),
    demana: () => Promise.reject(errorNatiu(CODI_ENTRADA_NATIVA.NO_DISPONIBLE, 'Esta manera d’entrar no està disponible en este dispositiu.'))
  });
}
