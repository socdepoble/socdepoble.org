/* B8C-2 (marató 261101_2143; Bloc B8, ordre del Mestre 261101) · Capacitat
   'avisosPush' de l'adaptador Supabase: els aparells que reben els avisos
   push del Xat. Contracte únic amb el servidor, B8-SERVIDOR §2.9:
     desaDispositiuAvisos(d, config)   → xat_push_desa(p_plataforma, p_adreca, p_caduca_al, p_llengua, p_gest)
     retiraDispositiuAvisos(d, config) → xat_push_retira(p_plataforma, p_adreca)
   d = { plataforma: 'web'|'ios'|'android', adreca, caducaMs?, llengua?, gest? }.
   Cap dels dos no torna res del servidor. Paràmetres amb nom i cap jsonb: el
   cos és exactament eixe, camp a camp, i mai porta les claus de la
   subscripció (p256dh, auth) encara que l'objecte d'entrada en porte.

   El nom del fitxer NO és `avisosPush.js` a posta: les fronteres N1/N2
   compten els importadors de src/pwa/avisosPush.js pel nom del mòdul
   (B8-CLIENT, ARB-02).

   Sense servidor (llavor, local, o sense configuració de Supabase):
   NO-DISPONIBLE i cap petició. Abans del transport, coacció primitiva amb
   les regles de private.xat_push_adreca_valida, sense cap regex amb retrocés
   (una sola classe per patró, ancorada):
     · web: com a molt 2048 caràcters, https:// i ASCII visible, sense '#';
       la llista blanca dels serveis la torna a mirar el servidor (003);
     · ios: el testimoni d'APNs en hexadecimal de 64 a 200, que es passa a
       minúscula (el servidor també ho fa: retirar casa amb el desat);
     · android: el testimoni de FCM, de 32 a 1024 de [A-Za-z0-9_:-];
     · caducaMs: absent o null → null; un número finit amb 0 < x ≤ 8.64e15 →
       ISO; qualsevol altre valor → AVISOS_INVALID (mai un RangeError);
     · llengua: una de les cinc de l'app o null (el servidor hi posa 'ca');
     · gest: només `true` és gest (p_gest); sense gest, el servidor no canvia
       mai l'amo d'un aparell (SDP-PUSH-011).
   Errors: AVISOS_INVALID (entrada o SDP-PUSH-002/003/004), AVISOS_ALIE
   (SDP-PUSH-011; el registre, src/config/avisosPushXat.js, el reconeix pel
   codi) i NO-DISPONIBLE (el 404 de runtime.rpc, que ja cobrix PGRST202, o
   SDP-PUSH-010, els avisos apagats). La resta es propaga tal qual. */
import { PLATAFORMES_AVISOS } from '../contracte.js';
import { getResolvedConfig, rpc } from './runtime.js';

/* Com la versió mínima (versioClient.js): cap gest de la persona no espera
   més que això per una petició penjada. */
const TOPALL_AVISOS_MS = 8000;
const LLENGUES = new Set(['ca', 'es', 'en', 'eu', 'gl']);
const MAXIM_ADRECA_WEB = 2048;
const MAXIM_TESTIMONI_APNS = 200;
const MINIM_TESTIMONI_FCM = 32;
const MAXIM_TESTIMONI_FCM = 1024;
const MAXIM_DATA_MS = 8.64e15;
const RE_WEB = /^https:\/\/[!-~]+$/;
const RE_APNS = /^[0-9a-f]{64,200}$/;
const RE_FCM = /^[A-Za-z0-9_:-]+$/;
/* El mateix codi que CODI_DISPOSITIU_ALIE del registre (prova de paritat). */
const CODI_ALIE = 'AVISOS_ALIE';

const errorAmbCodi = (missatge, code, cause) =>
  Object.assign(new Error(missatge, cause ? { cause } : undefined), { code, codi: code });
const invalid = (cause) => errorAmbCodi('Les dades de l’aparell d’avisos no són vàlides.', 'AVISOS_INVALID', cause);
const noDisponible = (cause) => errorAmbCodi('Este servidor encara no envia avisos push.', 'NO-DISPONIBLE', cause);

const textDe = (error) => {
  try { return String(error?.message ?? ''); } catch { return ''; }
};

function exigixServidor(config) {
  const { runtimeDataMode, hasSupabaseConfig } = getResolvedConfig(config);
  if (runtimeDataMode !== 'remote' || !hasSupabaseConfig) throw noDisponible();
}

/* L'adreça tal com viatja, o null si no casa la forma de la seua plataforma. */
function adrecaDe(plataforma, adreca) {
  if (typeof adreca !== 'string') return null;
  if (plataforma === 'web') {
    return adreca.length <= MAXIM_ADRECA_WEB && !adreca.includes('#') && RE_WEB.test(adreca) ? adreca : null;
  }
  if (plataforma === 'ios') {
    if (adreca.length > MAXIM_TESTIMONI_APNS) return null;
    const minuscula = adreca.toLowerCase();
    return RE_APNS.test(minuscula) ? minuscula : null;
  }
  return adreca.length >= MINIM_TESTIMONI_FCM && adreca.length <= MAXIM_TESTIMONI_FCM && RE_FCM.test(adreca) ? adreca : null;
}

/* Plataforma i adreça, camp a camp: cap altra clau de l'entrada passa. */
function aparellDe(d) {
  const font = d !== null && typeof d === 'object' ? d : {};
  const plataforma = font.plataforma;
  if (typeof plataforma !== 'string' || !PLATAFORMES_AVISOS.includes(plataforma)) throw invalid();
  const adreca = adrecaDe(plataforma, font.adreca);
  if (adreca === null) throw invalid();
  return { font, plataforma, adreca };
}

function caducitatDe(caducaMs) {
  if (caducaMs === undefined || caducaMs === null) return null;
  if (typeof caducaMs !== 'number' || !Number.isFinite(caducaMs) || caducaMs <= 0 || caducaMs > MAXIM_DATA_MS) throw invalid();
  return new Date(Math.floor(caducaMs)).toISOString();
}

function errorDelServidor(error) {
  if (Number(error?.status) === 404) return noDisponible(error);
  const text = textDe(error);
  if (text.includes('SDP-PUSH-010')) return noDisponible(error);
  if (text.includes('SDP-PUSH-011')) {
    return errorAmbCodi('Este aparell rep els avisos d’una altra sessió: cal activar-los amb el teu gest.', CODI_ALIE, error);
  }
  if (text.includes('SDP-PUSH-002') || text.includes('SDP-PUSH-003') || text.includes('SDP-PUSH-004')) return invalid(error);
  return error;
}

/**
 * Desa (o renova) l'aparell d'avisos de la persona de la sessió. Mai torna
 * res del servidor. Rebutja amb AVISOS_INVALID, AVISOS_ALIE o NO-DISPONIBLE.
 */
export async function desaDispositiuAvisos(d, config = {}) {
  exigixServidor(config);
  const { font, plataforma, adreca } = aparellDe(d);
  const cos = {
    p_plataforma: plataforma,
    p_adreca: adreca,
    p_caduca_al: caducitatDe(font.caducaMs),
    p_llengua: typeof font.llengua === 'string' && LLENGUES.has(font.llengua) ? font.llengua : null,
    p_gest: font.gest === true
  };
  try {
    await rpc('xat_push_desa', cos, config, { timeoutMs: TOPALL_AVISOS_MS });
  } catch (error) {
    throw errorDelServidor(error);
  }
}

/**
 * Retira l'aparell d'avisos de la persona de la sessió (de cortesia i
 * idempotent: també amb els avisos apagats al servidor). Mai torna res.
 */
export async function retiraDispositiuAvisos(d, config = {}) {
  exigixServidor(config);
  const { plataforma, adreca } = aparellDe(d);
  try {
    await rpc('xat_push_retira', { p_plataforma: plataforma, p_adreca: adreca }, config, { timeoutMs: TOPALL_AVISOS_MS });
  } catch (error) {
    throw errorDelServidor(error);
  }
}
