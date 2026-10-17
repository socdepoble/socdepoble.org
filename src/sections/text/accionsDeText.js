/**
 * accionsDeText.js — Onada 10 (261010; decisió del Mestre del 261010) ·
 * L'acció gran d'una pàgina de text amb ruta pròpia (TextRoute, App.jsx).
 *
 * «L'Ànima de la IAIA» (/anima des del Gauntlet 261016_1530, Bloc 3.6.3;
 * abans /iaia, que ara és la fitxa de la IAIA) porta, dins del bloc blanc de
 * l'H1, el botó «Anar al xat», que entra directe al xat amb la IAIA MarIA: la
 * mateixa peça (PortaDePagina) i el mateix text que el botó de /page/xat.
 *
 * Per què no viu a config/systemPages.js, amb les accions de les pàgines del
 * sistema: 'anima' no és cap entrada de SYSTEM_PAGES i no hi ha d'entrar (el
 * Mur en pintaria una targeta, i la IAIA és un agent amb perfil públic, no
 * una pàgina del sistema), i eixe mòdul no importa res, mentre que este destí
 * depén del mode de dades (rutaDelXatDeLaIAIA). El verb sí que ix d'allí: és
 * el d'accioDeLaPagina('xat'), una sola font per als dos botons.
 *
 * Funció pura: no llig cap context, no navega i no toca la xarxa. Qui la
 * pinta és AccioDeLaPaginaDeText.jsx.
 *
 * Onada 11 (261010; prompt 261010_1730, tasca 6) ·
 *   · D2 · el destí rep també `senseSessio` (useXat()): en remot i sense
 *     sessió, la conversa de mostra de la IAIA (rutaDelXatDeLaIAIA).
 *   · D4 · «dalt i al final», el mateix patró que «Obrir…» de /page/consola
 *     (accioAlFinal de config/systemPages.js): `final: true` diu que la
 *     pàgina repetix el botó després del cos (accioDeTextAlFinal).
 *
 * Gauntlet 261016_1530 (Bloc 3.6.3; relleu F64) · El xat PÚBLIC de «Comentar
 * → En públic» d'una pàgina de text és el de la seua ruta (useAccions). El
 * manifest ha deixat /iaia per /anima, i /anima no és a la llista tancada de
 * pàgines amb xat (PAGINES_AMB_XAT, data/contracte.js): afegir-la seria una
 * migració, i l'encàrrec diu que el contracte del servidor no canvia. Sense
 * res més, «En públic» s'hi quedaria desactivada. El xat públic de '/iaia'
 * (títol del servidor «L'ànima de la iaia») era el seu i continua sent el de
 * la IAIA MarIA, que ara viu a la mateixa ruta: el manifest el conserva amb
 * objecteDeLaPaginaDeText, el descriptor que TextSection ja sap passar
 * (`objecte`, revisió del 261007, M3-10). El menú i el destí, idèntics a
 * abans; Connectar continua desant /anima (no fa servir l'objecte).
 */
import { accioDeLaPagina } from '../../config/systemPages.js';
import { RUTA_FITXA_IAIA } from '../../config/navigation.js';
import { objecteDePagina } from '../../config/objecteConnectable.js';
import { rutaDelXatDeLaIAIA } from '../xat/useObriXatPerDefecte.js';

/* pageKey de PAGE_COPY → { id, desti, final }. `desti` rep el mode de dades
   del xat (useXat().modeDades) i si no hi ha sessió (useXat().senseSessio), i
   torna una ruta de l'app. `final`: el botó es repetix després del cos. */
const ACCIONS_DE_TEXT = Object.freeze({
  anima: Object.freeze({ id: 'anar-al-xat-de-la-iaia', desti: rutaDelXatDeLaIAIA, final: true })
});

/**
 * La porta de l'acció gran de la pàgina de text `pageKey` ({ id, verb, desti,
 * varietat }, la forma de PortesTargeta.jsx), o null si la pàgina no en té
 * (hui només en té 'anima'). `t` és el traductor de la interfície; sense, la
 * reserva en valencià. `modeDades` és el del xat; sense, la via del remot.
 * `senseSessio`: remot sense sessió, ja comprovat; sense, com amb sessió.
 * Claus sempre pròpies (Object.hasOwn): «constructor» no és cap pàgina.
 */
export function accioDeLaPaginaDeText(pageKey, t, modeDades, senseSessio = false) {
  if (typeof pageKey !== 'string' || !Object.hasOwn(ACCIONS_DE_TEXT, pageKey)) return null;
  const delXat = accioDeLaPagina('xat', t);
  if (!delXat) return null;
  const { id, desti } = ACCIONS_DE_TEXT[pageKey];
  return { id, verb: delXat.verb, desti: desti(modeDades, senseSessio), varietat: delXat.varietat };
}

/**
 * Onada 11 (D4) · Si la pàgina de text `pageKey` repetix el botó al final del
 * cos (div.sdp-pagina-accio), a més del de dins del bloc de l'H1. Pura, com
 * accioAlFinal de systemPages.js: qui la crida decidix amb la dada, mai amb
 * l'element.
 */
export function accioDeTextAlFinal(pageKey) {
  if (typeof pageKey !== 'string' || !Object.hasOwn(ACCIONS_DE_TEXT, pageKey)) return false;
  return ACCIONS_DE_TEXT[pageKey].final === true;
}

/* pageKey de PAGE_COPY → la ruta del xat públic que fa servir en lloc de la
   seua (Bloc 3.6.3). Hui només el manifest, amb el de la IAIA MarIA. */
const XAT_PUBLIC_DE_TEXT = Object.freeze({ anima: RUTA_FITXA_IAIA });

/**
 * Gauntlet 261016_1530 (Bloc 3.6.3) · El descriptor de «Comentar → En públic»
 * d'una pàgina de text amb ruta pròpia (objecteDePagina, amb `titol`, el
 * títol de la pàgina), o null si la pàgina comenta al xat de la seua ruta, com
 * sempre (TextSection no passa cap `objecte` quan és null). Pura.
 */
export function objecteDeLaPaginaDeText(pageKey, titol = '') {
  if (typeof pageKey !== 'string' || !Object.hasOwn(XAT_PUBLIC_DE_TEXT, pageKey)) return null;
  return objecteDePagina({ titol: typeof titol === 'string' ? titol : '', ruta: XAT_PUBLIC_DE_TEXT[pageKey] });
}
