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
 *
 * v1.2.23 · D-V1223-TEXT-BANCAL (ordre del Mestre 261123) · La descripció diu la veritat matemàtica del
 * Mode Bancal de hui, mesurada als tokens de src/css/tokens.css (estat combinat data-sdp-senior +
 * data-contrast="bancal", en clar i en fosc): el pitjor parell de text és el pedra-900 damunt del taronja
 * de marca #FF7300 (7,12:1), i en fosc el taronja viu primary-400 queda a 7,44:1 sobre el subtil. Per això
 * diu «AAA (≥ 7:1)» i no el «≥ 10:1» d'abans, que va deixar de ser cert amb IDEA-328 v2 (v1.2.22). El cos
 * de 18 px i la jerarquia Títol > Subtítol > Paràgraf (24 > 20 > 18 px a les targetes) són els de
 * diferit-mode-senior.css, i els botons de 56 px, el min-height de 3.5rem de les dianes primàries.
 * Ho guarda ControlModeSenior.etiquetaCurta.v1216.test.jsx.
 *
 * v1.2.23 · L3-01 (Gauntlet R1) · La mesura inclou ara el text de senyal (--sdp-error-text, --sdp-avis-text,
 * --sdp-exit-text i --sdp-info-text), i el pitjor parell passa a ser --sdp-avis-text damunt del subtil clar (7,07:1):
 * continua sent AAA (≥ 7:1), i la descripció no canvia. Ho guarda textosModeSenior.veritatBancal.v1223.test.js.
 */
export const TEXTOS_MODE_SENIOR = Object.freeze({
  ca: Object.freeze({
    xip: 'Mode Bancal · Sol i Lletra Gran',
    xipCurt: 'Mode Bancal',
    descripcio: 'Lletra més gran (cos de 18 px i jerarquia Títol > Subtítol > Paràgraf), botons amples de 56 px, contrast màxim AAA (≥ 7:1) i el taronja de marca #FF7300, per a llegir al sol o amb vista cansada.',
    actiu: 'Actiu',
    inactiu: 'Desactivat',
    seccioPerfil: 'Accessibilitat i lectura',
    regio: 'Preferència ràpida d’accessibilitat',
  }),
  es: Object.freeze({
    xip: 'Modo Bancal · Sol y Letra Grande',
    xipCurt: 'Modo Bancal',
    descripcio: 'Letra más grande (cuerpo de 18 px y jerarquía Título > Subtítulo > Párrafo), botones amplios de 56 px, contraste máximo AAA (≥ 7:1) y el naranja de marca #FF7300, para leer al sol o con la vista cansada.',
    actiu: 'Activo',
    inactiu: 'Desactivado',
    seccioPerfil: 'Accesibilidad y lectura',
    regio: 'Preferencia rápida de accesibilidad',
  }),
  en: Object.freeze({
    xip: 'Bancal Mode · Sun & Large Text',
    xipCurt: 'Bancal Mode',
    descripcio: 'Larger text (18 px body and a Title > Subtitle > Paragraph hierarchy), wide 56 px buttons, maximum AAA contrast (≥ 7:1) and the brand orange #FF7300, for reading in the sun or with tired eyes.',
    actiu: 'Active',
    inactiu: 'Off',
    seccioPerfil: 'Accessibility and reading',
    regio: 'Quick accessibility preference',
  }),
  eu: Object.freeze({
    xip: 'Bankal Modua · Eguzkia eta Letra Handia',
    xipCurt: 'Bankal Modua',
    descripcio: 'Letra handiagoa (18 px-ko testu-gorputza eta Izenburua > Azpititulua > Paragrafoa hierarkia), 56 px-ko botoi zabalak, AAA kontraste handiena (≥ 7:1) eta markako laranja #FF7300, eguzkitan edo ikusmen nekatuarekin irakurtzeko.',
    actiu: 'Aktibo',
    inactiu: 'Itzalita',
    seccioPerfil: 'Irisgarritasuna eta irakurketa',
    regio: 'Irisgarritasun hobespen azkarra',
  }),
  gl: Object.freeze({
    xip: 'Modo Bancal · Sol e Letra Grande',
    xipCurt: 'Modo Bancal',
    descripcio: 'Letra máis grande (corpo de 18 px e xerarquía Título > Subtítulo > Parágrafo), botóns amplos de 56 px, contraste máximo AAA (≥ 7:1) e a cor laranxa da marca #FF7300, para ler ao sol ou coa vista cansa.',
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
