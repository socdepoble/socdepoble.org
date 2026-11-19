/**
 * textosPortalApps.js — Textos de la interfície del portal /app i de RutaApps
 * en les 5 llengües de Sóc de Poble (`ca`, `es`, `en`, `eu`, `gl`) · Onada R30.2 + R32.13.
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
    testersAdmin: 'Tauler de botigues (/admin)',
    tornaApps: 'Torna a les apps',
    carregantApp: 'Carregant l’app…',
    adrecaInvalidaTitol: 'Esta adreça no és vàlida',
    adrecaInvalidaText: 'Les adreces de les apps només porten minúscules, xifres i guions.',
    appDesconegudaTitol: 'No coneixem esta app',
    appDesconegudaText: 'Este node no té cap app amb este nom.',
    appNoActivada: 'Esta app no està activada',
    appNoPotObrirAci: 'Esta app no es pot obrir ací',
    appNoPotObrir: 'Esta app no es pot obrir',
    appMalDeclarada: 'Les seues pàgines estan mal declarades. Ho ha d’arreglar qui la manté.',
    paginaInexistentTitol: 'Esta pàgina de l’app no existix',
    paginaInexistentText: 'Pot ser que l’enllaç siga antic o estiga mal copiat.',
    vesA: (nom) => `Ves a ${nom}`,
    navegacioCol: 'Navegació',
    llistaCol: 'Llista'
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
    testersAdmin: 'Panel de tiendas (/admin)',
    tornaApps: 'Volver a las apps',
    carregantApp: 'Cargando la app…',
    adrecaInvalidaTitol: 'Esta dirección no es válida',
    adrecaInvalidaText: 'Las direcciones de las apps solo llevan minúsculas, cifras y guiones.',
    appDesconegudaTitol: 'No conocemos esta app',
    appDesconegudaText: 'Esta web no tiene ninguna app con este nombre.',
    appNoActivada: 'Esta app no está activada',
    appNoPotObrirAci: 'Esta app no se puede abrir aquí',
    appNoPotObrir: 'Esta app no se puede abrir',
    appMalDeclarada: 'Sus páginas están mal declaradas. Debe arreglarlo quien la mantiene.',
    paginaInexistentTitol: 'Esta página de la app no existe',
    paginaInexistentText: 'Puede que el enlace sea antiguo o esté mal copiado.',
    vesA: (nom) => `Ir a ${nom}`,
    navegacioCol: 'Navegación',
    llistaCol: 'Lista'
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
    testersAdmin: 'Stores dashboard (/admin)',
    tornaApps: 'Back to apps',
    carregantApp: 'Loading app…',
    adrecaInvalidaTitol: 'Invalid app address',
    adrecaInvalidaText: 'App addresses only contain lowercase letters, digits, and hyphens.',
    appDesconegudaTitol: 'Unknown app',
    appDesconegudaText: 'There is no app with this name here.',
    appNoActivada: 'This app is switched off',
    appNoPotObrirAci: 'This app cannot be opened here',
    appNoPotObrir: 'This app cannot be opened',
    appMalDeclarada: 'Its pages are misconfigured. Its maintainer needs to fix them.',
    paginaInexistentTitol: 'This app page does not exist',
    paginaInexistentText: 'The link may be outdated or mistyped.',
    vesA: (nom) => `Go to ${nom}`,
    navegacioCol: 'Navigation',
    llistaCol: 'List'
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
    testersAdmin: 'Denden panela (/admin)',
    tornaApps: 'Itzuli aplikazioetara',
    carregantApp: 'Aplikazioa kargatzen…',
    adrecaInvalidaTitol: 'Helbide hau ez da baliozkoa',
    adrecaInvalidaText: 'Aplikazioen helbideek letra xeheak, zifrak eta marratxoak baino ez dituzte.',
    appDesconegudaTitol: 'Ez dugu aplikazio hau ezagutzen',
    appDesconegudaText: 'Ez dago izen hau duen aplikaziorik hemen.',
    appNoActivada: 'Aplikazio hau ez dago aktibatuta',
    appNoPotObrirAci: 'Aplikazio hau ezin da hemen ireki',
    appNoPotObrir: 'Aplikazio hau ezin da ireki',
    appMalDeclarada: 'Bere orriak gaizki adierazita daude. Mantentzen duenak konpondu behar du.',
    paginaInexistentTitol: 'Aplikazioko orri hau ez da existitzen',
    paginaInexistentText: 'Baliteke esteka zaharra izatea edo gaizki kopiatuta egotea.',
    vesA: (nom) => `Joan ${nom} atalera`,
    navegacioCol: 'Nabigazioa',
    llistaCol: 'Zerrenda'
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
    testersAdmin: 'Panel de tendas (/admin)',
    tornaApps: 'Volver ás apps',
    carregantApp: 'Cargando a app…',
    adrecaInvalidaTitol: 'Este enderezo non é válido',
    adrecaInvalidaText: 'Os enderezos das apps só levan minúsculas, cifras e guións.',
    appDesconegudaTitol: 'Non coñecemos esta app',
    appDesconegudaText: 'Non hai ningunha app con este nome aquí.',
    appNoActivada: 'Esta app non está activada',
    appNoPotObrirAci: 'Esta app non se pode abrir aquí',
    appNoPotObrir: 'Esta app non se pode abrir',
    appMalDeclarada: 'As súas páxinas están mal declaradas. Debe arranxalo quen a mantén.',
    paginaInexistentTitol: 'Esta páxina da app non existe',
    paginaInexistentText: 'Pode que a ligazón sexa antiga ou estea mal copiada.',
    vesA: (nom) => `Ir a ${nom}`,
    navegacioCol: 'Navegación',
    llistaCol: 'Lista'
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
