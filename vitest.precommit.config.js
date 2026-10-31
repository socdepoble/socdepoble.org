/**
 * vitest.precommit.config.js · T4 (261024_1800, P1-10) · La suite ràpida del
 * pre-commit (`npm run test:precommit`): les proves unitàries i de seguretat
 * essencials, en menys de 30 s (uns 21-23 s en el Mac del Mestre amb 4 workers,
 * 261024), perquè el hook (tooling/gates/git-staged.mjs, 120 s per pas) puga
 * passar sense --no-verify. NO substituïx la suite sencera (`npm test`, uns
 * 9 min): eixa continua sent la del tancament d'una Onada i la de qualsevol
 * canvi gran. `npm run test:precommit` hi afig després les proves de node de
 * la fortificació i dels secrets del build (tests/fortificacio.test.mjs,
 * tests/dist-secrets.test.mjs), menys d'1 s.
 *
 * Què hi entra (PRECOMMIT_INCLUDE), i per què:
 *   · supabase/**: les Edge Functions (l'anti-SSRF de noticies, la revocació
 *     d'Apple, la purga de fitxers) i les seues paritats;
 *   · src/data/**: el port de backend, els adaptadors (també els locals, que
 *     fan de servidor en seed/local) i les proves estàtiques de les
 *     migracions (*.migracio.test.js: RLS, permisos, quotes, codis);
 *   · la seguretat de la resta de src: els sanejadors (també l'HTML del
 *     Lector), les fronteres dels mòduls (frontera*.test.js), les
 *     *.seguretat.test.*, les guardes d'auth de les rutes (també la de la
 *     Consola), la detecció d'enllaços sospitosos del xat i els interns,
 *     l'entrada nativa i el social login, els orígens permesos (iframe,
 *     Sollutia, origen públic), la cripto del cofre i webauthn.
 * Una prova nova de seguretat fora d'estes carpetes entra amb el seu nom
 * (*.seguretat.test.js) o afegint-ne la ruta ací i a FRONTERES de la guarda
 * src/config/precommit.cobertura.seguretat.test.js. La guarda llig esta llista
 * com a codi (acorn): cada entrada ha de ser una cadena literal, i l'include i
 * l'exclude de Vitest només es tocen a la línia de `config.test.include`.
 *
 * Hereta tota la configuració de vite.config.js (alias, entorn jsdom, la zona
 * horària de les proves, l'exclude) i només canvia l'include, els workers i el
 * temps màxim de cada prova.
 */
import os from 'node:os';
import { defineConfig, mergeConfig } from 'vitest/config';
import configBase from './vite.config.js';

export const PRECOMMIT_INCLUDE = Object.freeze([
  'supabase/**/*.test.{js,mjs,ts}',
  'src/data/**/*.test.{js,jsx}',
  'src/utils/sanitize*.test.js',
  'src/**/*.seguretat.test.{js,jsx}',
  'src/**/frontera*.test.js',
  'src/app/guards/**/*.test.{js,jsx}',
  'src/sections/xat/components/EnllacSegur.test.jsx',
  'src/sections/xat/enllacos.test.js',
  'src/app/enllacosInterns.test.js',
  'src/apps/lector/nucli/{html,analitzador}.test.js',
  'src/natiu/entrada*.test.{js,jsx}',
  'src/config/{hostIframeAdapter,origenPublic,origensSollutia}.test.js',
  'src/sections/gestoria/cofre/nucli/cripto.test.js',
  'src/sections/tractors/nucli/webauthn.test.js',
  /* Gauntlet 261026_1615 (Codex C1615-10, Gemini G1615-06) · El menú «Compartir»
     i els avisos natius: aïllament entre persones, no-pèrdua, frontera i projectes natius. */
  'src/natiu/{projecte*,avisosNatius}.test.js',
  'src/config/{compartirNatiu,avisosNatius}.test.js',
  'src/sections/xat/{ReceptorCompartit,XatContext.avisosNatius}.test.jsx',
  'src/sections/xat/components/{DialegCompartir,ControlsAdjunt.compartir}.test.jsx',
  /* Pla 261028_1526 (Bloc D, P1-31) · El canvi de sessió descarta el lot, també el que el pont encara llegia. */
  'src/sections/xat/XatContext.compartir.test.jsx',
  /* Pla 261028_1526 (Bloc F, P1-26) · El cens de l'Arxiu (mil·lisegons, entorn node). Les apps
     locals (src/app/App.appsLocals.test.jsx) es queden fora: amb elles la suite passava de 30 s
     (26,3 s → 32,1 s, 261028); continuen a la suite sencera. */
  'src/sections/multimedia/censImatges.test.js',
  /* Gauntlet 261029 (c1, precommit-sense-a01b) · Les blob: del Gestor d'arxius locals: la llista
     blanca del visor, la descàrrega retipada a application/octet-stream (el navegador la baixa, mai
     la pinta) i la revocació en tancar. Uns mil·lisegons. La invalidació en eixir de la sessió
     (QA-A01b) entra pel nom: useGestorArxiusLocals.eixida.seguretat.test.jsx. */
  'src/sections/multimedia/urlsArxiuLocal.test.js',
  /* Gauntlet 261030 (c2, precommit-sense-guardes-traductor) · El Traductor Sobirà: el href segur de
     l'arbre original, la resposta hostil del proveïdor (cap HTML seu al DOM), la segona porta de
     CosTraduit i el que mai no ix cap al motor (translate="no"). Uns 0,3 s. Les pàgines privades amb
     traduccio={false} entren pel nom: PageFrame.traduccio.privades.seguretat.test.js. */
  'src/components/universal/traduccio/blocsTraduibles.test.js',
  /* P1-26 (guàrdia nocturna 261030, Fase 3, P1Y) · Fronteres de seguretat que vivien només a la
     suite sencera: isSafeUrl i els esquemes admesos (javascript:, data:, capacitor: fora del seu
     host), la CSP i les capçaleres de conformitat de Firebase Hosting, el sanejador de la
     configuració de l'amfitrió (invisibles, bidi, rutes), el contingut de fora de /connectar
     (javascript:, data:, 2048 caràcters) i el service worker (l'API, l'autenticació,
     Authorization i els altres orígens passen sense memòria cau). Uns 2 s en total. La guarda
     src/config/precommit.cobertura.seguretat.test.js vigila que no en tornen a eixir. */
  'src/components/universal/UniversalUtils.capacitor.test.js',
  'src/config/{firebaseHosting,configAmfitrio}.test.js',
  'src/sections/connectar/contingutExtern.test.js',
  'src/pwa/sw.test.js',
  /* Gauntlet 261030 (c3, precommit-sense-guardes-fase3) · Les fronteres noves de la Fase 3, que
     només corrien a la suite sencera. Web Push (WP): la llista tancada de serveis de push (SSRF),
     cap p256dh ni auth cap al servidor, el permís només des d'un gest, cap crida al natiu sense
     connector i cap altre fitxer de producció que toque el service worker (registre.test.js).
     Viquipèdia (VQ): cap petició a Wikimedia abans del clic (Legal §21), fotos de Commons sense
     galetes ni referent, cap panell a l'app nativa, la llista blanca del que es llig de la cau
     (només https de Wikimedia) i, amb la fitxa completa, cap panell ni cap base IndexedDB; el
     text legal ancorat al codi. La vCard: cap injecció de propietats. Uns 2 s en total. */
  'src/pwa/{avisosPush,registre}.test.js',
  'src/natiu/avisosPushNatius.test.js',
  'src/sections/pobles/{cauDeViquipedia,fitxaDelPoble}.test.js',
  'src/sections/pobles/{PanellDeViquipedia,PoblesSection.lleiDelPixel}.test.jsx',
  'src/sections/detail/ItemDetailSection.pobleIncomplet.test.jsx',
  'src/sections/text/legal.viquipedia.test.js',
  'src/sections/profile/vcardOrganitzacio.test.js',
  /* Gauntlet 261030 (cicle 4, altc1-consola-fora-del-precommit) · ALT-C1: cap dada d'este
     ordinador (consola.json, el Mapa, la matriu de requeriments, els empaquetats) ix de
     /consola cap a un motor de traducció, pels dos transports del Traductor Sobirà. La ruta
     real, uns 2 s. La guarda estàtica (PAGINES_PRIVADES) i la fitxa de la Consola dins de la
     Wiki entren pel nom (*.seguretat.test.*). */
  'src/sections/consola/ConsolaSection.traduccio.test.jsx'
]);

/* La suite principal en fa servir 2 (vite.config.js: no satura els imports del catàleg); esta, que
   és més menuda, en fa servir fins a 4, deixant sempre dos nuclis lliures (amb 6 no anava més de
   pressa, 261024, i una altra IA pot estar provant alhora). */
const WORKERS = Math.max(2, Math.min(4, (os.availableParallelism?.() ?? os.cpus().length) - 2));
/* Amb més workers, una prova de CPU (la cerca no quadràtica de gestor.test.js, que es dona 10 s ella
   mateixa) pot passar dels 5 s de Vitest per contenció: 15 s, cap assertió relaxada. */
const TEMPS_PER_PROVA_MS = 15000;

export default defineConfig(async (entorn) => {
  const base = typeof configBase === 'function' ? await configBase(entorn) : configBase;
  const config = mergeConfig(base, { test: { maxWorkers: WORKERS, testTimeout: TEMPS_PER_PROVA_MS } });
  /* L'include es posa a mà (mergeConfig concatenaria les llistes). */
  config.test.include = [...PRECOMMIT_INCLUDE];
  return config;
});
