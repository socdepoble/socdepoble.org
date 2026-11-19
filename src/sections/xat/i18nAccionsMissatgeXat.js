/**
 * i18nAccionsMissatgeXat.js — Textos localitzats en les 5 llengües oficials
 * (ca, es, en, eu, gl) per als avisos de reenviament i error d'acció sobre
 * missatges a XatSection.jsx, sense tocar els fitxers globals src/config/idiomes/*.js
 * (Onada R32.12 · Lot 03).
 */

const TEXTOS_ACCIONS_MISSATGE = Object.freeze({
  ca: Object.freeze({
    accioError: "No s'ha pogut completar l'acció.",
    reenviaError: "No s'ha pogut reenviar el missatge.",
    reenviaParcial: "Alguns missatges no s'han pogut reenviar.",
    reenviat: 'Missatge reenviat',
  }),
  es: Object.freeze({
    accioError: 'No se ha podido completar la acción.',
    reenviaError: 'No se ha podido reenviar el mensaje.',
    reenviaParcial: 'Algunos mensajes no se han podido reenviar.',
    reenviat: 'Mensaje reenviado',
  }),
  en: Object.freeze({
    accioError: 'Could not complete the action.',
    reenviaError: 'Could not forward the message.',
    reenviaParcial: 'Some messages could not be forwarded.',
    reenviat: 'Message forwarded',
  }),
  eu: Object.freeze({
    accioError: 'Ezin izan da ekintza osatu.',
    reenviaError: 'Ezin izan da mezua birbidali.',
    reenviaParcial: 'Mezu batzuk ezin izan dira birbidali.',
    reenviat: 'Mezua birbidalita',
  }),
  gl: Object.freeze({
    accioError: 'Non se puido completar a acción.',
    reenviaError: 'Non se puido reenviar a mensaxe.',
    reenviaParcial: 'Algunhas mensaxes non se puideron reenviar.',
    reenviat: 'Mensaxe reenviada',
  }),
});

function resolIdioma(idiomaOCodi = 'ca') {
  const base = String(idiomaOCodi || 'ca').toLowerCase().split('-')[0];
  return TEXTOS_ACCIONS_MISSATGE[base] ? base : 'ca';
}

export function textAccioMissatgeXat(idiomaOCodi, clau) {
  const dict = TEXTOS_ACCIONS_MISSATGE[resolIdioma(idiomaOCodi)];
  return dict[clau] ?? TEXTOS_ACCIONS_MISSATGE.ca[clau] ?? '';
}
