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
 *     (App.jsx, <Navigate>). P0-62 (08-11-2026) · La guia ja enllaça la fitxa de l'App Store (canal
 *     app-store de src/config/canalsDeBotiga.js); Google Play encara no en té cap de pública. El camí
 *     SVG és precalculat (qrGuiaDescarregues.js) amb el codificador de la
 *     Gestoria, que des d'ací no es pot importar (G8-14);
 *   · R54 incorpora el connector de push natiu i els permisos al projecte. El canal local i
 *     el registre del client no acrediten credencials del servidor o recepció en dispositiu.
 *     Sanejament R15 (B3 · P1-03, R15A-NAT-01, P2-05): el cicle de push natiu només s'encén amb
 *     la bandera de build VITE_SDP_PUSH_NATIU=1. Apagada (avui), el canal d'Android és el canal
 *     LOCAL d'avisos «Missatges del xat», no cap canal de FCM (G8-16), i els passos diuen el que
 *     falta, com a HEAD: google-services.json i el compte de servei de FCM;
 *   · P0-62 bis (08-11-2026; ordre del Mestre al xat de Claude) · l'App Store oberta (la fitxa i la
 *     versió de la botiga, 1.0, a part de la del projecte, 1.1.0 build 2) i, a Google Play, els tres
 *     passos dels verificadors, els mateixos de /page/descarregues.
 * Pur: sense React, DOM ni xarxa.
 */
import { QR_GUIA_DESCARREGUES } from './qrGuiaDescarregues.js';

export { QR_GUIA_DESCARREGUES };

/** La guia pública (també el destí del QR). */
export const URL_GUIA_DESCARREGUES = QR_GUIA_DESCARREGUES.text;

/* Sanejament R15 (B3) · La bandera del push natiu, literal (tooling/vite/banderes-de-capacitat.mjs):
   la mateixa que governa src/natiu/avisosPushNatius.js. */
const PUSH_NATIU_ACTIU = import.meta.env.VITE_SDP_PUSH_NATIU === '1';

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

/* P0-62 / IDEA-193 (ordre del Mestre, 261108) · El fet llegit, datat: Apple va publicar la 1.0 el
   6-11-2026 (consulta d'Apple del 8-11-2026, trackId 6826441844). El panell no ho torna a llegir;
   assistentBotigues.test.jsx contrasta l'identificador amb el canal app-store de canalsDeBotiga.js. */
export const ESTAT_APP_STORE = 'Publicada en obert a l’App Store (id6826441844): versió 1.0, del 6-11-2026 (consulta d’Apple del 8-11-2026)';

/* P0-62 bis (08-11-2026; ordre del Mestre al xat de Claude) · L'App Store oberta i els tres passos de
   Google Play, els mateixos de /page/descarregues (PAGE_COPY.descarregues; la prova ho contrasta).
   La fitxa és la del canal app-store de src/config/canalsDeBotiga.js (la prova la contrasta: ací no
   s'importa, perquè el panell va en un altre tros diferit). L'adreça dels verificadors és un enllaç
   d'instruccions, NO cap canal de botiga: google-play continua tancat a canalsDeBotiga.js. */
export const URL_FITXA_APP_STORE = 'https://apps.apple.com/es/app/s%C3%B3c-de-poble/id6826441844';
export const ADRECA_VERIFICADORS_GOOGLE_PLAY = 'https://play.google.com/apps/testing/org.socdepoble.app';
/* Google demana 12 verificadors amb l'app instal·lada durant 14 dies seguits per a publicar-la (P0-53). */
export const VERIFICADORS_DE_GOOGLE = Object.freeze({ persones: 12, dies: 14 });
export const PASSOS_VERIFICADOR_GOOGLE_PLAY = Object.freeze([
  'Pas 1 · Pantalla 1: entrar a play.google.com/apps/testing/org.socdepoble.app i prémer el botó blau gran «Become a tester» (Convertir-se en verificador).',
  'Pas 2 · Pantalla 2, «You’re a tester»: NO tocar el botó de baix, «Leave the program», sinó l’enllaç blau del final del segon paràgraf, el que diu «download it on Google Play».',
  `Pas 3 · Pantalla 3, Google Play: prémer «Instal·lar» perquè l’app quede instal·lada al mòbil. És imprescindible: Google només compta dins dels ${VERIFICADORS_DE_GOOGLE.persones} verificadors qui la té instal·lada durant ${VERIFICADORS_DE_GOOGLE.dies} dies.`
]);
const ESTAT_GOOGLE_PLAY = `Guia de preparació: prova tancada amb el grup de verificadors (Google en demana ${VERIFICADORS_DE_GOOGLE.persones} durant ${VERIFICADORS_DE_GOOGLE.dies} dies seguits). Este panell no llig quants en són: és a Google Play Console › Proves › Prova tancada`;

export const CANALS_BOTIGUES = Object.freeze([
  Object.freeze({
    id: 'pwa',
    titol: '📲 Web i PWA (Android, iPhone, iPad i ordinador)',
    identificador: 'https://socdepoble.org/manifest.webmanifest',
    versio: `web ${FITXA_NATIVA.versioWeb}, la dels fitxers del projecte`,
    estat: 'Pública: la guia és a /descarregues (redirigix a /page/descarregues)',
    comandament: null,
    passos: Object.freeze([
      'Obri el menú del navegador i tria l’opció d’instal·lar Sóc de Poble com a aplicació (al mòbil, «Afegeix a la pantalla d’inici»).',
      'A l’iPhone i a l’iPad, amb Safari: prem Compartir ⬆️ i toca «Afegeix a la pantalla d’inici».'
    ])
  }),
  Object.freeze({
    id: 'ios',
    // P0-62 bis · L'App Store és oberta: el títol ja no diu TestFlight, i la versió de la botiga va a part de la del projecte.
    titol: '🍎 App Store (iPhone i iPad)',
    identificador: `${FITXA_NATIVA.paquet} · iOS ${FITXA_NATIVA.iosMinim} o posterior · extensió ${FITXA_NATIVA.extensioCompartir}`,
    versioBotiga: '1.0, publicada a l’App Store el 6-11-2026',
    versio: `${FITXA_NATIVA.versio} (build ${FITXA_NATIVA.build}), la dels fitxers del projecte (la pròxima que es compile), no la publicada`,
    estat: ESTAT_APP_STORE,
    fitxa: URL_FITXA_APP_STORE,
    comandament: 'npm run build:natiu && npx cap sync ios',
    passos: Object.freeze([
      'Per a instal·lar-la: a l’iPhone o a l’iPad, obri la fitxa de l’App Store (el botó «Disponible a l’App Store») i instal·la-la, gratis.',
      'Per a una versió nova: obri ios/App/App.xcodeproj amb Xcode → Product › Archive → Distribute App › App Store Connect, i envia-la a revisió d’Apple.',
      PUSH_NATIU_ACTIU
        ? 'El connector de push natiu i els permisos ja estan construïts. Cal verificar la configuració del servidor, la signatura i el provisioning, i la recepció en un iPhone real.'
        : 'Els avisos push natius encara no hi són: el connector de push natiu i aps-environment ja són al projecte, però este build no els encén (VITE_SDP_PUSH_NATIU) i falta la clau d’APNs als secrets de notifica-xat. Decidir-ho és del Mestre.'
    ])
  }),
  Object.freeze({
    id: 'android',
    titol: '🤖 Google Play (Android App Bundle .aab)',
    identificador: `${FITXA_NATIVA.paquet} · minSdk ${FITXA_NATIVA.minSdk} · targetSdk ${FITXA_NATIVA.targetSdk}`,
    versioBotiga: 'cap de pública: prova tancada amb el grup de verificadors',
    versio: `${FITXA_NATIVA.versio} (versionCode ${FITXA_NATIVA.build}), la dels fitxers del projecte · canal local d’avisos «Missatges del xat»`,
    estat: ESTAT_GOOGLE_PLAY,
    verificadors: Object.freeze({ adreca: ADRECA_VERIFICADORS_GOOGLE_PLAY, passos: PASSOS_VERIFICADOR_GOOGLE_PLAY }),
    comandament: 'npm run build:natiu && npx cap sync android && cd android && ./gradlew bundleRelease',
    passos: Object.freeze([
      'Genera l’AAB signat: android/app/build/outputs/bundle/release/app-release.aab.',
      PUSH_NATIU_ACTIU
        ? 'Puja l’AAB a Google Play Console (prova interna o tancada). El connector de push natiu ja està construït; la configuració del servidor, la signatura i la recepció en Android s’han de verificar per separat.'
        : 'Puja l’AAB a Google Play Console (prova interna o tancada). Els avisos push natius (FCM) encara no hi són: falten google-services.json i el compte de servei de FCM als secrets de notifica-xat. El connector és al projecte, però apagat fins que el build es faça amb VITE_SDP_PUSH_NATIU=1.'
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
   supabase/README.md, secció «Funció notifica-xat»: ací no se'n copia cap nom ni cap RPC de la funció.
   Ho vigilen dues coses. A tot src/, les fronteres de notifica-xat/gestor.test.js i
   purga-fitxers/gestor.test.js: cada RPC que criden els dos workers (des de R10 · VFC-05, també la que
   desa les credencials dels enviadors natius) i els secrets privats, no tots els noms del catàleg. En
   este mòdul, la prova G3 d'assistentBotigues.test.jsx, que hi prohibix qualsevol nom de secret del
   servidor. L'estat és el llegit a producció el 6-11-2026 amb GET de lectura: la taula de la 2611020417
   existix i el build web no porta la clau pública VAPID. */
export const CATALEG_SERVIDOR_PUSH = 'supabase/README.md, secció «Funció notifica-xat»';

/* FBV-04 · El fet llegit va a part: no és cap pas pendent del Mestre. */
export const ESTAT_SERVIDOR_PUSH = 'La migració supabase/migrations/2611020417_xat_avisos_push.sql ja és a producció (acta 261102_1456; lectura REST del 6-11-2026: la taula existix).';

/** El que falta perquè arriben avisos (cap valor ni cap nom de secret: només el catàleg del servidor). */
export const PASSOS_SERVIDOR_PUSH = Object.freeze([
  'Falta la clau pública VAPID al build web (VITE_PUSH_VAPID_PUBLICA): sense ella, cap navegador no es pot subscriure.',
  `Si cal, revisar la funció supabase/functions/notifica-xat (secrets, desplegament i cron) i l’ajust push_xat_actiu: des d’este panell no es veu si estan fets. Els noms i l’ordre són a ${CATALEG_SERVIDOR_PUSH}.`,
  PUSH_NATIU_ACTIU
    ? `Per a l’app nativa: el connector i els permisos ja estan construïts. Verificar la configuració del servidor, la signatura/provisioning i la recepció en dispositiu; la guia és a ${CATALEG_SERVIDOR_PUSH}.`
    : `Per a l’app nativa: els secrets d’APNs, google-services.json i el compte de servei d’FCM, i compilar amb VITE_SDP_PUSH_NATIU=1 a .env.natiu.local. El connector de push natiu i aps-environment ja són al projecte, apagats (també a ${CATALEG_SERVIDOR_PUSH}).`
]);
