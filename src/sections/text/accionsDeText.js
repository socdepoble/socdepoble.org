/**
 * accionsDeText.js — Onada 10 (261010; decisió del Mestre del 261010) ·
 * L'acció gran d'una pàgina de text amb ruta pròpia (TextRoute, App.jsx).
 *
 * «L'Ànima de la IAIA» (/iaia) porta, dins del bloc blanc de l'H1, el botó
 * «Anar al xat», que entra directe al xat amb la IAIA MarIA: la mateixa peça
 * (PortaDePagina) i el mateix text que el botó de /page/xat.
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
 */
import { accioDeLaPagina } from '../../config/systemPages.js';
import { rutaDelXatDeLaIAIA } from '../xat/useObriXatPerDefecte.js';

/* pageKey de PAGE_COPY → { id, desti }. `desti` rep el mode de dades del xat
   (useXat().modeDades) i torna una ruta de l'app. */
const ACCIONS_DE_TEXT = Object.freeze({
  anima: Object.freeze({ id: 'anar-al-xat-de-la-iaia', desti: rutaDelXatDeLaIAIA })
});

/**
 * La porta de l'acció gran de la pàgina de text `pageKey` ({ id, verb, desti,
 * varietat }, la forma de PortesTargeta.jsx), o null si la pàgina no en té
 * (hui només en té 'anima'). `t` és el traductor de la interfície; sense, la
 * reserva en valencià. `modeDades` és el del xat; sense, la via del remot.
 * Claus sempre pròpies (Object.hasOwn): «constructor» no és cap pàgina.
 */
export function accioDeLaPaginaDeText(pageKey, t, modeDades) {
  if (typeof pageKey !== 'string' || !Object.hasOwn(ACCIONS_DE_TEXT, pageKey)) return null;
  const delXat = accioDeLaPagina('xat', t);
  if (!delXat) return null;
  const { id, desti } = ACCIONS_DE_TEXT[pageKey];
  return { id, verb: delXat.verb, desti: desti(modeDades), varietat: delXat.varietat };
}
