/**
 * textosPortalApps.js — Textos de la interfície del portal /app en les 5
 * llengües de Sóc de Poble (`ca`, `es`, `en`, `eu`, `gl`) · Onada R30.2 (D11).
 *
 * Viu dins del tros diferit de `/app` perquè no engreixe el diccionari
 * d'arrencada (`ca.js`) del paquet de l'amfitrió i mantinga zero col·lisió CAS.
 */

export const TEXTOS_PORTAL_APPS = Object.freeze({
  ca: Object.freeze({
    titol: 'Apps',
    entradeta: 'Eines del poble que s’enxufen i es desenxufen. El node decidix quines porta; tu, quines vols vore.',
    estat: Object.freeze({
      available: 'Disponible',
      disabled: 'Apagada',
      unavailable: 'No disponible'
    }),
    vullVore: 'Vull vore {titol}',
    obri: 'Obri',
    buitTitol: 'Encara no hi ha cap app',
    buitCos: 'Quan este node en porte alguna, la voràs ací.',
    testersTitol: 'Gestió de verificadors i botigues',
    testersCos: 'Accés directe per a l’administració del grup obert de Google Groups, el programa de proves d’Android i les botigues oficials.',
    testersGrup: 'Grup Google Groups (socdepoble-testers)',
    testersPlay: 'Proves a Google Play',
    testersAppStore: 'App Store (iOS)',
    testersAdmin: 'Tauler de botigues (/admin)'
  }),
  es: Object.freeze({
    titol: 'Apps',
    entradeta: 'Herramientas del pueblo que se enchufan y se desenchufan. El nodo decide cuáles lleva; tú, cuáles quieres ver.',
    estat: Object.freeze({
      available: 'Disponible',
      disabled: 'Apagada',
      unavailable: 'No disponible'
    }),
    vullVore: 'Quiero ver {titol}',
    obri: 'Abrir',
    buitTitol: 'Todavía no hay ninguna app',
    buitCos: 'Cuando este nodo lleve alguna, la verás aquí.',
    testersTitol: 'Gestión de verificadores y tiendas',
    testersCos: 'Acceso directo para la administración del grupo abierto de Google Groups, el programa de pruebas de Android y las tiendas oficiales.',
    testersGrup: 'Grupo Google Groups (socdepoble-testers)',
    testersPlay: 'Pruebas en Google Play',
    testersAppStore: 'App Store (iOS)',
    testersAdmin: 'Panel de tiendas (/admin)'
  }),
  en: Object.freeze({
    titol: 'Apps',
    entradeta: 'Village tools that plug in and unplug. The node decides which ones it carries; you choose which ones to see.',
    estat: Object.freeze({
      available: 'Available',
      disabled: 'Switched off',
      unavailable: 'Unavailable'
    }),
    vullVore: 'Show {titol}',
    obri: 'Open',
    buitTitol: 'There are no apps yet',
    buitCos: 'When this node carries one, you will see it here.',
    testersTitol: 'Testers and app stores management',
    testersCos: 'Direct access to manage the open Google Groups community, the Android testing programme, and the official app stores.',
    testersGrup: 'Google Groups (socdepoble-testers)',
    testersPlay: 'Google Play testing',
    testersAppStore: 'App Store (iOS)',
    testersAdmin: 'Stores dashboard (/admin)'
  }),
  eu: Object.freeze({
    titol: 'Aplikazioak',
    entradeta: 'Entxufatzen eta desentxufatzen diren herriko tresnak. Nodoak erabakitzen du zeintzuk dakartzan; zuk, zeintzuk ikusi nahi dituzun.',
    estat: Object.freeze({
      available: 'Eskuragarri',
      disabled: 'Itzalita',
      unavailable: 'Ez dago eskuragarri'
    }),
    vullVore: '{titol} ikusi nahi dut',
    obri: 'Ireki',
    buitTitol: 'Oraindik ez dago aplikaziorik',
    buitCos: 'Nodo honek baten bat dakarrenean, hemen ikusiko duzu.',
    testersTitol: 'Egiaztatzaileen eta denden kudeaketa',
    testersCos: 'Sarbide zuzena Google Groups talde irekia, Android proben programa eta denda ofizialak kudeatzeko.',
    testersGrup: 'Google Groups taldea (socdepoble-testers)',
    testersPlay: 'Probak Google Play-n',
    testersAppStore: 'App Store (iOS)',
    testersAdmin: 'Denden panela (/admin)'
  }),
  gl: Object.freeze({
    titol: 'Apps',
    entradeta: 'Ferramentas da vila que se enchufan e se desenchufan. O nodo decide cales leva; ti, cales queres ver.',
    estat: Object.freeze({
      available: 'Dispoñible',
      disabled: 'Apagada',
      unavailable: 'Non dispoñible'
    }),
    vullVore: 'Quero ver {titol}',
    obri: 'Abrir',
    buitTitol: 'Aínda non hai ningunha app',
    buitCos: 'Cando este nodo leve algunha, verala aquí.',
    testersTitol: 'Xestión de verificadores e tendas',
    testersCos: 'Acceso directo para a administración do grupo aberto de Google Groups, o programa de probas de Android e as tendas oficiais.',
    testersGrup: 'Grupo Google Groups (socdepoble-testers)',
    testersPlay: 'Probas en Google Play',
    testersAppStore: 'App Store (iOS)',
    testersAdmin: 'Panel de tendas (/admin)'
  })
});

export function textosPortalApps(idioma) {
  const codi = String(idioma || 'ca').toLowerCase().split('-')[0];
  return Object.hasOwn(TEXTOS_PORTAL_APPS, codi)
    ? TEXTOS_PORTAL_APPS[codi]
    : TEXTOS_PORTAL_APPS.ca;
}

export function etiquetaEstatApp(estat, idioma) {
  const mapa = textosPortalApps(idioma).estat;
  return Object.hasOwn(mapa, estat) ? mapa[estat] : '';
}
