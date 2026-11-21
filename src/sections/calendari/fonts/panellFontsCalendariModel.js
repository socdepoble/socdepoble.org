/**
 * Model pur per a PanellFontsCalendari (R32.24).
 * Mapa explícit de classes literals (tractor-vocabulari, V2) i regles de reintent.
 */
import { ERRORS_DE_FONT } from './contracteFonts.js';

export const CLASSE_CASELLA = Object.freeze({
  accio: 'sdp-calendari-fonts-panell__casella sdp-calendari-fonts-panell__casella--accio',
  accent: 'sdp-calendari-fonts-panell__casella sdp-calendari-fonts-panell__casella--accent',
  exit: 'sdp-calendari-fonts-panell__casella sdp-calendari-fonts-panell__casella--exit',
  avis: 'sdp-calendari-fonts-panell__casella sdp-calendari-fonts-panell__casella--avis',
  error: 'sdp-calendari-fonts-panell__casella sdp-calendari-fonts-panell__casella--error',
});

export const REINTENTABLES = new Set([
  ERRORS_DE_FONT.XARXA,
  ERRORS_DE_FONT.RESPOSTA_INVALIDA,
]);

export const classeCasellaFont = (colorToken) => (
  CLASSE_CASELLA[colorToken] ?? CLASSE_CASELLA.accio
);

export const esErrorFontReintentable = (tipusError) => REINTENTABLES.has(tipusError);
