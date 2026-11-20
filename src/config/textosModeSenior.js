/**
 * textosModeSenior.js — Onada R32.15 · P1-80 / IDEA-252 · Textos de Mode Sènior / Lectura Gran
 * en les 5 llengües oficials (ca, es, en, eu, gl).
 *
 * Viu fora de src/config/idiomes/ perquè només l'importen les superfícies diferides
 * (/el-meu-perfil, /control i L'Avisador): 0 B d'augment al tros d'arrencada estàtica de WordPress.
 */
export const TEXTOS_MODE_SENIOR = Object.freeze({
  ca: Object.freeze({
    xip: 'Mode Sènior · Lectura Gran',
    descripcio: 'Lletra més gran, botons amples de 56 px i contrast reforçat (≥ 10:1) en tota l’aplicació.',
    actiu: 'Actiu',
    inactiu: 'Desactivat',
    seccioPerfil: 'Accessibilitat i lectura',
    regio: 'Preferència ràpida d’accessibilitat',
  }),
  es: Object.freeze({
    xip: 'Modo Sénior · Lectura Grande',
    descripcio: 'Letra más grande, botones amplios de 56 px y contraste reforzado (≥ 10:1) en toda la aplicación.',
    actiu: 'Activo',
    inactiu: 'Desactivado',
    seccioPerfil: 'Accesibilidad y lectura',
    regio: 'Preferencia rápida de accesibilidad',
  }),
  en: Object.freeze({
    xip: 'Senior Mode · Large Print',
    descripcio: 'Larger text, wide 56 px buttons and enhanced contrast (≥ 10:1) across the entire app.',
    actiu: 'Active',
    inactiu: 'Off',
    seccioPerfil: 'Accessibility and reading',
    regio: 'Quick accessibility preference',
  }),
  eu: Object.freeze({
    xip: 'Senior Modua · Letra Handia',
    descripcio: 'Letra handiagoa, 56 px-ko botoi zabalak eta kontraste indartua (≥ 10:1) aplikazio osoan.',
    actiu: 'Aktibo',
    inactiu: 'Itzalita',
    seccioPerfil: 'Irisgarritasuna eta irakurketa',
    regio: 'Irisgarritasun hobespen azkarra',
  }),
  gl: Object.freeze({
    xip: 'Modo Sénior · Lectura Grande',
    descripcio: 'Letra máis grande, botóns amplos de 56 px e contraste reforzado (≥ 10:1) en toda a aplicación.',
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
