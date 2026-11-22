/**
 * Onada R32.30b · Lot 02 · Diccionari diferit d'accessibilitat i capçaleres de
 * Dispositius en les 5 llengües oficials (ca, es, en, eu, gl).
 * Conserva byte a byte el valencià (ca) i no toca src/config/idiomes/*.js (0 B al nucli).
 */
const DICCIONARI_DISPOSITIUS_A11Y = Object.freeze({
  ca: Object.freeze({
    seoTitle: 'Dispositius',
    seoDescription: 'Gestió de dispositius i connexions locals entre pestanyes',
    title: 'Dispositius',
    subtitle: 'Descobrix instàncies obertes i parla en local',
    lead: 'Connecta pestanyes i finestres obertes en este mateix navegador i envia missatges directes sense passar per cap servidor.',
    modePublicTitle: 'Mode públic',
    modePrivatTitle: 'Mode privat',
    nomDispositiuLabel: 'Nom del dispositiu',
    nomDispositiuPlaceholder: 'Nom del dispositiu',
    missatgeDirecteLabel: 'Missatge directe',
    missatgeDirectePlaceholder: 'Escriu un missatge directe...',
  }),
  es: Object.freeze({
    seoTitle: 'Dispositivos',
    seoDescription: 'Gestión de dispositivos y conexiones locales entre pestañas',
    title: 'Dispositivos',
    subtitle: 'Descubre instancias abiertas y habla en local',
    lead: 'Conecta pestañas y ventanas abiertas en este mismo navegador y envía mensajes directos sin pasar por ningún servidor.',
    modePublicTitle: 'Modo público',
    modePrivatTitle: 'Modo privado',
    nomDispositiuLabel: 'Nombre del dispositivo',
    nomDispositiuPlaceholder: 'Nombre del dispositivo',
    missatgeDirecteLabel: 'Mensaje directo',
    missatgeDirectePlaceholder: 'Escribe un mensaje directo...',
  }),
  en: Object.freeze({
    seoTitle: 'Devices',
    seoDescription: 'Local device discovery and cross-tab messaging',
    title: 'Devices',
    subtitle: 'Discover open tabs and chat locally',
    lead: 'Connect tabs and windows open in this same browser and send direct messages without going through any server.',
    modePublicTitle: 'Public mode',
    modePrivatTitle: 'Private mode',
    nomDispositiuLabel: 'Device name',
    nomDispositiuPlaceholder: 'Device name',
    missatgeDirecteLabel: 'Direct message',
    missatgeDirectePlaceholder: 'Write a direct message...',
  }),
  eu: Object.freeze({
    seoTitle: 'Gailuak',
    seoDescription: 'Gailuen kudeaketa eta fitxen arteko tokiko konexioak',
    title: 'Gailuak',
    subtitle: 'Aurkitu irekitako instantziak eta hitz egin lokalean',
    lead: 'Konektatu nabigatzaile honetan bertan irekitako fitxak eta leihoak eta bidali mezu zuzenak inongo zerbitzaritatik igaro gabe.',
    modePublicTitle: 'Modu publikoa',
    modePrivatTitle: 'Modu pribatua',
    nomDispositiuLabel: 'Gailuaren izena',
    nomDispositiuPlaceholder: 'Gailuaren izena',
    missatgeDirecteLabel: 'Mezu zuzena',
    missatgeDirectePlaceholder: 'Idatzi mezu zuzen bat...',
  }),
  gl: Object.freeze({
    seoTitle: 'Dispositivos',
    seoDescription: 'Xestión de dispositivos e conexións locais entre lapelas',
    title: 'Dispositivos',
    subtitle: 'Descobre instancias abertas e fala en local',
    lead: 'Conecta lapelas e xanelas abertas neste mesmo navegador e envía mensaxes directas sen pasar por ningún servidor.',
    modePublicTitle: 'Modo público',
    modePrivatTitle: 'Modo privado',
    nomDispositiuLabel: 'Nome do dispositivo',
    nomDispositiuPlaceholder: 'Nome do dispositivo',
    missatgeDirecteLabel: 'Mensaxe directa',
    missatgeDirectePlaceholder: 'Escribe unha mensaxe directa...',
  }),
});

export function codiLlenguaDispositius(language = 'ca') {
  const base = String(language || 'ca').toLowerCase().split('-')[0];
  return Object.hasOwn(DICCIONARI_DISPOSITIUS_A11Y, base) ? base : 'ca';
}

export function textosDispositiusA11y(language = 'ca') {
  return DICCIONARI_DISPOSITIUS_A11Y[codiLlenguaDispositius(language)];
}
