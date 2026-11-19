/**
 * Calendari i PanellFontsCalendari · i18n modular en 5 llengües (ca, es, en, eu, gl).
 * Conserva el valencià byte-per-byte idèntic a la còpia original.
 */
const TEXTOS_CALENDARI_EXTRA = Object.freeze({
  ca: Object.freeze({
    titolPantallaCompleta: 'Calendari a pantalla completa',
    avisAgenda: 'Ara mateix no podem consultar els actes de l’agenda: el calendari mostra només les targetes del poble.',
    tornaAProvar: 'Torna a provar',
    panellTitol: 'Els meus calendaris',
    carregant: 'Carregant…',
    fases: Object.freeze({
      desconnectat: 'Sense connectar.',
      connectant: 'Esperant la finestra d’autorització…',
      connectat: 'Connectat. Només es llig: no s’hi escriu res.',
    }),
    desconnecta: 'Desconnecta',
    cancella: 'Cancel·la',
    connectaAmb: (proveidor) => `Connecta amb ${proveidor}`,
  }),
  es: Object.freeze({
    titolPantallaCompleta: 'Calendario a pantalla completa',
    avisAgenda: 'Ahora mismo no podemos consultar los actos de la agenda: el calendario muestra solo las tarjetas del pueblo.',
    tornaAProvar: 'Volver a probar',
    panellTitol: 'Mis calendarios',
    carregant: 'Cargando…',
    fases: Object.freeze({
      desconnectat: 'Sin conectar.',
      connectant: 'Esperando la ventana de autorización…',
      connectat: 'Conectado. Solo lectura: no se escribe nada.',
    }),
    desconnecta: 'Desconectar',
    cancella: 'Cancelar',
    connectaAmb: (proveidor) => `Conectar con ${proveidor}`,
  }),
  en: Object.freeze({
    titolPantallaCompleta: 'Full-screen calendar',
    avisAgenda: 'We cannot load external agenda events right now: the calendar is showing village cards only.',
    tornaAProvar: 'Try again',
    panellTitol: 'My calendars',
    carregant: 'Loading…',
    fases: Object.freeze({
      desconnectat: 'Not connected.',
      connectant: 'Waiting for authorisation window…',
      connectat: 'Connected. Read-only: nothing is written back.',
    }),
    desconnecta: 'Disconnect',
    cancella: 'Cancel',
    connectaAmb: (proveidor) => `Connect with ${proveidor}`,
  }),
  eu: Object.freeze({
    titolPantallaCompleta: 'Egutegia pantaila osoan',
    avisAgenda: 'Une honetan ezin ditugu agendako ekitaldiak kontsultatu: egutegiak herriko txartelak soilik erakusten ditu.',
    tornaAProvar: 'Berriz saiatu',
    panellTitol: 'Nire egutegiak',
    carregant: 'Kargatzen…',
    fases: Object.freeze({
      desconnectat: 'Konektatu gabe.',
      connectant: 'Baimen-leihoaren zain…',
      connectat: 'Konektatuta. Irakurtzeko soilik: ez da ezer idazten.',
    }),
    desconnecta: 'Deskonektatu',
    cancella: 'Utzi',
    connectaAmb: (proveidor) => `Konektatu ${proveidor} bidez`,
  }),
  gl: Object.freeze({
    titolPantallaCompleta: 'Calendario a pantalla completa',
    avisAgenda: 'Agora mesmo non podemos consultar os actos da axenda: o calendario amosa só as tarxetas da vila.',
    tornaAProvar: 'Tentar de novo',
    panellTitol: 'Os meus calendarios',
    carregant: 'Cargando…',
    fases: Object.freeze({
      desconnectat: 'Sen conectar.',
      connectant: 'Agardando a xanela de autorización…',
      connectat: 'Conectado. Só lectura: non se escribe nada.',
    }),
    desconnecta: 'Desconectar',
    cancella: 'Cancelar',
    connectaAmb: (proveidor) => `Conectar con ${proveidor}`,
  }),
});

export function textosCalendariExtra(idioma) {
  const codi = String(idioma || 'ca').toLowerCase().split('-')[0];
  return Object.hasOwn(TEXTOS_CALENDARI_EXTRA, codi) ? TEXTOS_CALENDARI_EXTRA[codi] : TEXTOS_CALENDARI_EXTRA.ca;
}
