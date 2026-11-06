/**
 * assistentBotigues.js — Onada R9 · C3 (IDEA-120 / P0-30; G8-04, G8-12, G8-14 i G8-16) · Les dades
 * de l'assistent de botigues de l'Administració (només superadmin, dins del tros diferit del panell).
 *
 * Res no s'inventa ni es certifica:
 *   · FITXA_NATIVA són els valors dels fitxers del projecte (package.json, android/variables.gradle,
 *     android/app/build.gradle i el .pbxproj d'iOS); assistentBotigues.test.js els torna a llegir
 *     amb scripts/botigues/estat.mjs i cau si divergixen (G8-04: minSdk 24, targetSdk 36, 1.1.0);
 *   · el QR és el de la guia pública de descàrregues, l'única adreça que existix per als tres
 *     canals: /descarregues redirigix a /page/descarregues i no llig cap paràmetre de plataforma
 *     (App.jsx, <Navigate>); no hi ha cap fitxa publicada a l'App Store ni a Google Play que es
 *     puga enllaçar. El camí SVG és precalculat (qrGuiaDescarregues.js) amb el codificador de la
 *     Gestoria, que des d'ací no es pot importar (G8-14);
 *   · el canal d'Android és el canal LOCAL d'avisos «Missatges del xat» (LocalNotifications), no
 *     cap canal de FCM (G8-16): l'app nativa encara no porta avisos push remots.
 * Pur: sense React, DOM ni xarxa.
 */
import { QR_GUIA_DESCARREGUES } from './qrGuiaDescarregues.js';

export { QR_GUIA_DESCARREGUES };

/** La guia pública (també el destí del QR). */
export const URL_GUIA_DESCARREGUES = QR_GUIA_DESCARREGUES.text;

/** El que diuen els fitxers del projecte (assistentBotigues.test.js ho contrasta). */
export const FITXA_NATIVA = Object.freeze({
  versioWeb: '1.1.0',
  paquet: 'org.socdepoble.app',
  extensioCompartir: 'org.socdepoble.app.compartir',
  versio: '1.1.0',
  build: 2,
  iosMinim: '16.0',
  minSdk: 24,
  compileSdk: 36,
  targetSdk: 36
});

const ESTAT_BOTIGA = 'Guia de preparació: la disponibilitat a la botiga no es verifica des d’este panell';

export const CANALS_BOTIGUES = Object.freeze([
  Object.freeze({
    id: 'pwa',
    titol: '📲 Web i PWA (Android, iPhone, iPad i ordinador)',
    identificador: 'https://socdepoble.org/manifest.webmanifest',
    versio: `web ${FITXA_NATIVA.versioWeb}`,
    estat: 'Pública: la guia és a /descarregues (redirigix a /page/descarregues)',
    comandament: null,
    passos: Object.freeze([
      'Obri el menú del navegador i tria l’opció d’instal·lar Sóc de Poble com a aplicació (al mòbil, «Afegeix a la pantalla d’inici»).',
      'A l’iPhone i a l’iPad, amb Safari: prem Compartir ⬆️ i toca «Afegeix a la pantalla d’inici».'
    ])
  }),
  Object.freeze({
    id: 'ios',
    titol: '🍎 App Store i TestFlight (iPhone i iPad)',
    identificador: `${FITXA_NATIVA.paquet} · iOS ${FITXA_NATIVA.iosMinim} o posterior · extensió ${FITXA_NATIVA.extensioCompartir}`,
    versio: `${FITXA_NATIVA.versio} (build ${FITXA_NATIVA.build})`,
    estat: ESTAT_BOTIGA,
    comandament: 'npm run build:natiu && npx cap sync ios',
    passos: Object.freeze([
      'Obri ios/App/App.xcodeproj amb Xcode → Product › Archive → Distribute App › App Store Connect (TestFlight).',
      'Els avisos push natius encara no hi són: falten el connector de push natiu de Capacitor (push-notifications), aps-environment a App.entitlements i la clau d’APNs als secrets de notifica-xat. Decidir-ho és del Mestre.'
    ])
  }),
  Object.freeze({
    id: 'android',
    titol: '🤖 Google Play (Android App Bundle .aab)',
    identificador: `${FITXA_NATIVA.paquet} · minSdk ${FITXA_NATIVA.minSdk} · targetSdk ${FITXA_NATIVA.targetSdk}`,
    versio: `${FITXA_NATIVA.versio} (versionCode ${FITXA_NATIVA.build}) · canal local d’avisos «Missatges del xat»`,
    estat: ESTAT_BOTIGA,
    comandament: 'npm run build:natiu && npx cap sync android && cd android && ./gradlew bundleRelease',
    passos: Object.freeze([
      'Genera l’AAB signat: android/app/build/outputs/bundle/release/app-release.aab.',
      'Puja l’AAB a Google Play Console (prova interna o tancada). Els avisos push natius (FCM) encara no hi són: falten el connector, google-services.json i el compte de servei de FCM als secrets de notifica-xat.'
    ])
  })
]);

/* El motiu de l'adaptador web quan el build no porta la clau pública VAPID (MOTIU_PUSH.SENSE_CLAU de
   src/pwa/avisosPush.js, que només pot importar l'adaptador; la prova en comprova la paritat). */
export const MOTIU_SENSE_CLAU = 'sense-clau';

/**
 * L'estat dels avisos push d'este navegador, en una frase, a partir de l'instantània del registre
 * (instantaniaAvisosPush). Pur.
 */
export function frasePushDelNavegador(inst) {
  if (!inst || inst.disponible !== true) return 'Encara no s’hi ha registrat cap adaptador (el motor i l’adaptador arriben després de l’arrencada) o este navegador no en pot tindre.';
  if (inst.motiu === MOTIU_SENSE_CLAU) return 'No s’oferixen: el build no porta la clau pública VAPID (VITE_PUSH_VAPID_PUBLICA). No es demana cap permís ni es fa cap petició.';
  if (inst.motiu) return `No s’oferixen en este navegador (motiu: ${inst.motiu}).`;
  return `S’oferixen en este navegador (estat: ${inst.estat}).`;
}

/* Gauntlet R9 · G3-01 i G3-02 · El catàleg del servidor (els noms dels secrets, l'ordre i les ordres) és
   supabase/README.md, secció «Funció notifica-xat»: ací no se'n copia cap nom ni cap RPC de la funció
   (les fronteres de notifica-xat/gestor.test.js i purga-fitxers/gestor.test.js ho vigilen). L'estat és el
   llegit a producció el 6-11-2026 amb GET de lectura: la taula de la 2611020417 existix i el build web
   no porta la clau pública VAPID. */
export const CATALEG_SERVIDOR_PUSH = 'supabase/README.md, secció «Funció notifica-xat»';

/* FBV-04 · El fet llegit va a part: no és cap pas pendent del Mestre. */
export const ESTAT_SERVIDOR_PUSH = 'La migració supabase/migrations/2611020417_xat_avisos_push.sql ja és a producció (acta 261102_1456; lectura REST del 6-11-2026: la taula existix).';

/** El que falta perquè arriben avisos (cap valor ni cap nom de secret: només el catàleg del servidor). */
export const PASSOS_SERVIDOR_PUSH = Object.freeze([
  'Falta la clau pública VAPID al build web (VITE_PUSH_VAPID_PUBLICA): sense ella, cap navegador no es pot subscriure.',
  `Si cal, revisar la funció supabase/functions/notifica-xat (secrets, desplegament i cron) i l’ajust push_xat_actiu: des d’este panell no es veu si estan fets. Els noms i l’ordre són a ${CATALEG_SERVIDOR_PUSH}.`,
  `Per a l’app nativa: el connector de push natiu, aps-environment, els secrets d’APNs, google-services.json i el compte de servei d’FCM (també a ${CATALEG_SERVIDOR_PUSH}).`
]);
