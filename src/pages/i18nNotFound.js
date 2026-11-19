/**
 * i18nNotFound.js — Diccionari modular 5 llengües (ca, es, en, eu, gl) per a
 * la pàgina 404 Pedra Seca 10/10 (`src/pages/NotFoundPage.jsx` · Onada R32.13).
 *
 * Viu fora dels diccionaris de config (0 B a l'arrencada estàtica WP),
 * conserva l'H1 històric en valencià («Ací no hi ha res») verificat per les
 * proves de rutes canòniques i connectors, i aplica Llei 32 = 0 i Llei 35.
 */

export const TEXTOS_NOT_FOUND = Object.freeze({
  ca: Object.freeze({
    seoTitle: '404 - Pàgina no trobada',
    seoDescription: 'La pàgina sol·licitada no existix al servidor de Sóc de Poble o ha canviat d’adreça.',
    title: 'Ací no hi ha res',
    subtitle: 'Error 404 · Camí fora del terme',
    lead: 'L’adreça que has obert no existix al servidor de Sóc de Poble o s’ha mogut a una ruta canònica nova.',
    labels: Object.freeze(['404', 'No trobat']),
    cosTitol: 'Torna a un espai viu del poble',
    cosAbansNegreta: 'Pots continuar explorant el ',
    cosNegreta: 'Mur, els Pobles, el Mercat o el Mapa',
    cosDespresNegreta: ' des de les dreceres directes de baix.',
    navAriaLabel: 'Dreceres principals de Sóc de Poble',
    inici: 'Tornar a l’inici',
    mur: 'Anar al Mur',
    pobles: 'Explorar Pobles',
    mercat: 'Visitar el Mercat',
    mapa: 'Obrir el Mapa'
  }),
  es: Object.freeze({
    seoTitle: '404 - Página no encontrada',
    seoDescription: 'La página solicitada no existe en el servidor de Sóc de Poble o ha cambiado de dirección.',
    title: 'Aquí no hay nada',
    subtitle: 'Error 404 · Camino fuera del término',
    lead: 'La dirección que has abierto no existe en el servidor de Sóc de Poble o se ha movido a una ruta canónica nueva.',
    labels: Object.freeze(['404', 'No encontrado']),
    cosTitol: 'Vuelve a un espacio vivo del pueblo',
    cosAbansNegreta: 'Puedes seguir explorando el ',
    cosNegreta: 'Muro, los Pueblos, el Mercado o el Mapa',
    cosDespresNegreta: ' desde los accesos directos inferiores.',
    navAriaLabel: 'Accesos principales de Sóc de Poble',
    inici: 'Volver al inicio',
    mur: 'Ir al Muro',
    pobles: 'Explorar Pueblos',
    mercat: 'Visitar el Mercado',
    mapa: 'Abrir el Mapa'
  }),
  en: Object.freeze({
    seoTitle: '404 - Page not found',
    seoDescription: 'The requested page does not exist on the Sóc de Poble server or has moved to a new address.',
    title: 'Nothing here',
    subtitle: 'Error 404 · Off the village path',
    lead: 'The address you opened does not exist on the Sóc de Poble server or has moved to a new canonical route.',
    labels: Object.freeze(['404', 'Not found']),
    cosTitol: 'Return to a living village space',
    cosAbansNegreta: 'You can keep exploring the ',
    cosNegreta: 'Wall, Villages, Market, or Map',
    cosDespresNegreta: ' using the direct shortcuts below.',
    navAriaLabel: 'Main Sóc de Poble shortcuts',
    inici: 'Back to home',
    mur: 'Go to Wall',
    pobles: 'Explore Villages',
    mercat: 'Visit Market',
    mapa: 'Open Map'
  }),
  eu: Object.freeze({
    seoTitle: '404 - Orria ez da aurkitu',
    seoDescription: 'Eskatutako orria ez dago Sóc de Pobleren zerbitzarian edo helbidez aldatu da.',
    title: 'Hemen ez dago ezer',
    subtitle: '404 errorea · Herriko bidetik kanpo',
    lead: 'Ireki duzun helbidea ez dago Sóc de Pobleren zerbitzarian edo ibilbide kanoniko berri batera aldatu da.',
    labels: Object.freeze(['404', 'Ez da aurkitu']),
    cosTitol: 'Itzuli herriko espazio bizi batera',
    cosAbansNegreta: 'Jarraitu dezakezu ',
    cosNegreta: 'Horma, Herriak, Azoka edo Mapa',
    cosDespresNegreta: ' arakatzen beheko lasterbide zuzenetatik.',
    navAriaLabel: 'Sóc de Pobleren lasterbide nagusiak',
    inici: 'Itzuli hasierara',
    mur: 'Joan Hormara',
    pobles: 'Arakatu Herriak',
    mercat: 'Bisitatu Azoka',
    mapa: 'Ireki Mapa'
  }),
  gl: Object.freeze({
    seoTitle: '404 - Páxina non atopada',
    seoDescription: 'A páxina solicitada non existe no servidor de Sóc de Poble ou cambiou de enderezo.',
    title: 'Aquí non hai nada',
    subtitle: 'Erro 404 · Camiño fóra do termo',
    lead: 'O enderezo que abriches non existe no servidor de Sóc de Poble ou moveuse a unha ruta canónica nova.',
    labels: Object.freeze(['404', 'Non atopado']),
    cosTitol: 'Volve a un espazo vivo da vila',
    cosAbansNegreta: 'Podes seguir explorando o ',
    cosNegreta: 'Muro, as Vilas, o Mercado ou o Mapa',
    cosDespresNegreta: ' dende os atallos directos inferiores.',
    navAriaLabel: 'Atallos principais de Sóc de Poble',
    inici: 'Volver ao inicio',
    mur: 'Ir ao Muro',
    pobles: 'Explorar Vilas',
    mercat: 'Visitar o Mercado',
    mapa: 'Abrir o Mapa'
  })
});

export function textosNotFound(idioma) {
  const codi = String(idioma || 'ca').toLowerCase().split('-')[0];
  return Object.hasOwn(TEXTOS_NOT_FOUND, codi)
    ? TEXTOS_NOT_FOUND[codi]
    : TEXTOS_NOT_FOUND.ca;
}
