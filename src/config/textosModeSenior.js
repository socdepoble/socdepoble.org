/**
 * textosModeSenior.js — Onada R32.15 · P1-80 / IDEA-252 · Textos de Mode Sènior / Lectura Gran
 * en les 5 llengües oficials (ca, es, en, eu, gl).
 *
 * Viu fora de src/config/idiomes/ perquè només l'importen les superfícies diferides
 * (/el-meu-perfil, /control, L'Avisador i l'accés del Xat): 0 B d'augment al tros d'arrencada
 * estàtica de WordPress.
 *
 * P0-ANDROID-PUSH (v1.2.16) · B11c (ordre del Mestre 261121; prompt 0216, T2.5) · `xipCurt`, l'etiqueta
 * curta del xip a l'accés del Xat (ControlModeSenior amb `etiquetaCurta`): «Lletra gran». El basc i el
 * gallec necessiten revisió nadiua.
 *
 * IDEA-323.4 · DOL-31 (v1.2.22, ordre del Mestre del 261122) · Un sol «Mode Bancal»: els rètols del xip
 * (complet i curt) i la descripció són els literals de l'ordre en les cinc llengües; la descripció de
 * l'es, l'en, l'eu i el gl és traducció de la del valencià (revisió nadiua pendent per al basc i el gallec).
 */
export const TEXTOS_MODE_SENIOR = Object.freeze({
  ca: Object.freeze({
    xip: 'Mode Bancal · Sol i Lletra Gran',
    xipCurt: 'Mode Bancal',
    descripcio: 'Lletra més gran, botons amples de 56 px i màxim contrast (≥ 10:1) per a llegir al sol o amb vista cansada.',
    actiu: 'Actiu',
    inactiu: 'Desactivat',
    seccioPerfil: 'Accessibilitat i lectura',
    regio: 'Preferència ràpida d’accessibilitat',
  }),
  es: Object.freeze({
    xip: 'Modo Bancal · Sol y Letra Grande',
    xipCurt: 'Modo Bancal',
    descripcio: 'Letra más grande, botones amplios de 56 px y máximo contraste (≥ 10:1) para leer al sol o con la vista cansada.',
    actiu: 'Activo',
    inactiu: 'Desactivado',
    seccioPerfil: 'Accesibilidad y lectura',
    regio: 'Preferencia rápida de accesibilidad',
  }),
  en: Object.freeze({
    xip: 'Bancal Mode · Sun & Large Text',
    xipCurt: 'Bancal Mode',
    descripcio: 'Larger text, wide 56 px buttons and maximum contrast (≥ 10:1) for reading in the sun or with tired eyes.',
    actiu: 'Active',
    inactiu: 'Off',
    seccioPerfil: 'Accessibility and reading',
    regio: 'Quick accessibility preference',
  }),
  eu: Object.freeze({
    xip: 'Bankal Modua · Eguzkia eta Letra Handia',
    xipCurt: 'Bankal Modua',
    descripcio: 'Letra handiagoa, 56 px-ko botoi zabalak eta kontraste handiena (≥ 10:1) eguzkitan edo ikusmen nekatuarekin irakurtzeko.',
    actiu: 'Aktibo',
    inactiu: 'Itzalita',
    seccioPerfil: 'Irisgarritasuna eta irakurketa',
    regio: 'Irisgarritasun hobespen azkarra',
  }),
  gl: Object.freeze({
    xip: 'Modo Bancal · Sol e Letra Grande',
    xipCurt: 'Modo Bancal',
    descripcio: 'Letra máis grande, botóns amplos de 56 px e máximo contraste (≥ 10:1) para ler ao sol ou coa vista cansa.',
    actiu: 'Activo',
    inactiu: 'Desactivado',
    seccioPerfil: 'Accesibilidade e lectura',
    regio: 'Preferencia rápida de accesibilidade',
  }),
});

export function resolLlenguaModeSenior(llengua, t) {
  if (typeof llengua === 'string' && llengua.trim()) {
    const codi = llengua.trim().toLowerCase().split('-')[0];
    if (Object.hasOwn(TEXTOS_MODE_SENIOR, codi)) return codi;
  }
  if (typeof t === 'function') {
    const mostra = t('section.xat.ajustos.tancaSessio', 'Tanca la sessió');
    if (mostra === 'Cerrar sesión') return 'es';
    if (mostra === 'Log out') return 'en';
    if (mostra === 'Itxi saioa') return 'eu';
    if (mostra === 'Pechar sesión') return 'gl';
  }
  return 'ca';
}

export function textosModeSenior(llengua, t) {
  return TEXTOS_MODE_SENIOR[resolLlenguaModeSenior(llengua, t)] || TEXTOS_MODE_SENIOR.ca;
}
