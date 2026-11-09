import { CANALS_DE_BOTIGA, urlDeCanal } from '../../config/canalsDeBotiga.js';
import { normalizePublicationDate } from '../../utils/publicationDateControl.js';
import { FITXA_NATIVA } from '../profile/admin/assistentBotigues.js';
import { CONSELL_PUBLIC } from './consellPublic.js';

/** Projecció de l'encàrrec humà; no és una font de telemetria. */
export const COMPTADORS_COMUNICATS = Object.freeze({
  play: 2, objectiu: 12, web: 14,
  observatPlay: '2026-11-08T03:26:00+01:00',
  fontPlay: 'Comunicació de Javi Llinares, P0-53',
  fontWeb: 'Encàrrec R55: xifra 14 en web mòbil, sense hora, unitat o finestra de mesura acreditades',
});
export const VERSIO_WORDPRESS_LOCAL = '1.1.12';
export const URL_OPT_IN_PLAY = 'https://play.google.com/apps/testing/org.socdepoble.app';

/** El canal de proves és separat del canal públic de canalsDeBotiga. */
export function urlOptInDePlay(valor) {
  try {
    if (typeof valor !== 'string') return null;
    const u = new URL(valor);
    return u.protocol === 'https:' && u.hostname === 'play.google.com'
      && u.pathname === `/apps/testing/${FITXA_NATIVA.paquet}`
      && !u.username && !u.password && !u.port && !u.search && !u.hash ? u.href : null;
  } catch { return null; }
}

export function validaComptadorsComunicats(input) {
  try {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
    // Snapshot de primitives pròpies: cap accessor pot canviar entre validació i ús.
    const dades = {};
    for (const k of ['play', 'objectiu', 'web', 'observatPlay', 'fontPlay', 'fontWeb']) {
      const descriptor = Object.getOwnPropertyDescriptor(input, k);
      if (!descriptor || !Object.hasOwn(descriptor, 'value')) return null;
      dades[k] = descriptor.value;
    }
    for (const k of ['play', 'objectiu', 'web']) if (!Number.isSafeInteger(dades[k]) || dades[k] < 0 || dades[k] > 1000000) return null;
    if (dades.objectiu === 0) return null;
    for (const k of ['fontPlay', 'fontWeb']) if (typeof dades[k] !== 'string' || !dades[k].trim() || dades[k].length > 200) return null;
    const observatPlay = normalizePublicationDate(dades.observatPlay);
    return Object.freeze({ ...dades, observatPlay });
  } catch { return null; }
}

const DESCRIPCIONS = Object.freeze({
  'google-play': 'El canal públic és independent de l’enllaç de proves. La participació i la continuïtat s’han de comprovar en el programa de Google Play.',
  'app-store': `Projecte iOS ${FITXA_NATIVA.versio}, build ${FITXA_NATIVA.build}. Activació, signatura, pujada, revisió i disponibilitat no comprovades ací.`,
  'testflight': 'Un projecte iOS compilat no acredita un enllaç públic de TestFlight o una invitació vigent.',
  'apk-directe': 'Només s’enllaça l’APK oficial quan el canal té una adreça vàlida configurada; una descàrrega no compta com a participació en Play.',
  'wordpress-org': `El connector local declara la versió ${VERSIO_WORDPRESS_LOCAL}. L’enllaç del directori està configurat; la versió publicada no es consulta des d’esta pàgina.`,
});

export function creaModelBotigues({ comptadors = COMPTADORS_COMUNICATS, canals = CANALS_DE_BOTIGA, optInUrl = URL_OPT_IN_PLAY } = {}) {
  const dada = validaComptadorsComunicats(comptadors);
  const quan = dada ? new Intl.DateTimeFormat('ca-ES', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Madrid' }).format(new Date(dada.observatPlay)) : null;
  return Object.freeze({
    play: Object.freeze({
      comptador: dada ? `${dada.play}/${dada.objectiu}` : 'Sense dada',
      lector: dada ? `${dada.play} participants comunicats d’un objectiu de ${dada.objectiu}; no és un recompte en viu` : 'Recompte comunicat absent o invàlid',
      web: dada ? String(dada.web) : 'Sense dada',
      font: dada ? `${dada.fontPlay}: ${quan} (Europe/Madrid). ${dada.fontWeb}.` : 'Sense comunicació vàlida amb data i procedència.',
      explicacio: 'Les dos xifres són comunicacions separades, sense API de verificadors connectada. No acrediten la situació actual ni la continuïtat de participació.',
      optInUrl: urlOptInDePlay(optInUrl),
      live: false,
    }),
    versions: `Configuració local: web ${FITXA_NATIVA.versioWeb}; Android ${FITXA_NATIVA.versio}, versionCode ${FITXA_NATIVA.build}; iOS ${FITXA_NATIVA.versio}, build ${FITXA_NATIVA.build}; connector WordPress ${VERSIO_WORDPRESS_LOCAL}.`,
    canals: Object.freeze(CANALS_DE_BOTIGA.map((base) => {
      const coincidencies = Array.isArray(canals) ? canals.filter(c => c?.id === base.id) : [];
      return Object.freeze({ id: base.id, nom: base.nom, descripcio: DESCRIPCIONS[base.id], url: coincidencies.length === 1 ? urlDeCanal(coincidencies[0]) : null });
    })),
    flota: Object.freeze({
      font: `Cens del Consell ${CONSELL_PUBLIC.versio}, data declarada ${CONSELL_PUBLIC.dataDeclarada}: ${CONSELL_PUBLIC.membres.length} membres. No és una mesura de salut o disponibilitat.`,
      membres: CONSELL_PUBLIC.membres,
      runtimeVerified: false,
    }),
  });
}

export const MODEL_BOTIGUES = creaModelBotigues();

/** Només l'estat sanejat d'esta instància; cap token, persona o error remot. */
export function fraseEstatLocalAvisos(inst) {
  if (!inst || inst.disponible !== true) return 'Cap adaptador disponible en esta instància.';
  if (inst.motiu === 'sense-clau') return 'Els avisos web no s’oferixen perquè falta la configuració pública VAPID del build.';
  /* Sanejament R15 (B3/B4) · L'app nativa sense la configuració d'FCM i APNs (bandera VITE_SDP_PUSH_NATIU). */
  if (inst.motiu === 'sense-config') return 'Els avisos push natius no s’oferixen: este build de l’app no porta la configuració d’FCM i APNs.';
  if (inst.motiu === 'sense-connector') return 'Els avisos push natius no s’oferixen: este binari no porta el connector de push.';
  const textos = {
    'actiu': 'Activats en esta instància; entrega en dispositiu no comprovada.',
    'inactiu': 'Desactivats en esta instància.',
    'denegat': 'Permís d’avisos denegat en esta instància.',
    'error': 'No s’ha pogut completar el registre d’avisos.',
  };
  return Object.hasOwn(textos, inst.estat) ? textos[inst.estat] : 'Registre d’avisos sense confirmació operativa en esta instància.';
}
