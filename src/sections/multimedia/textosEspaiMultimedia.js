/**
 * textosEspaiMultimedia.js — Els textos de l'espai de treball de /multimedia
 * (IDEA-55 + P1-71 · Onada 261029_1605, Bloc E): les tres columnes
 * d'UniversalWorkspace (MULTIMÈDIA · ARXIUS · la pàgina) que unixen la
 * Fototeca publicada i les carpetes locals del Gestor d'arxius.
 *
 * Cada text és un parell ['section.multimedia.espai.…', 'reserva']: la clau i
 * la reserva valenciana, que és el valor de ca.js (i18n.multimedia.test.js ho
 * comprova, i també que les cinc llengües tenen la clau i conserven els
 * marcadors). Les reserves no porten cap apòstrof recte (cal ’). Els textos
 * del Gestor (volums, operacions, insígnies…) continuen a textosGestorLocal.js.
 */

const congela = (objecte) => Object.freeze(Object.fromEntries(
  Object.entries(objecte).map(([nom, parell]) => [nom, Object.freeze(parell)])
));

/** Els textos de l'espai, pel sufix de la clau (`E.portada`, `E.colFont`). */
export const TEXTOS_ESPAI = congela({
  categories: ['section.multimedia.espai.categories', 'MULTIMÈDIA'],
  items: ['section.multimedia.espai.items', 'ARXIUS'],
  tria: ['section.multimedia.espai.tria', 'Tria una carpeta o un arxiu.'],
  cerca: ['section.multimedia.espai.cerca', 'Cercar arxius'],
  buit: ['section.multimedia.espai.buit', 'Esta carpeta no té cap arxiu.'],
  portada: ['section.multimedia.espai.portada', 'Arxiu Visual i Gestor d’Arxius'],
  portadaSubtitol: ['section.multimedia.espai.portadaSubtitol', 'Fototeca publicada i carpetes del teu ordinador'],
  portadaEntradeta: ['section.multimedia.espai.portadaEntradeta', 'Tria a l’esquerra una galeria publicada o una carpeta local. Les carpetes locals es lligen en este navegador i cap arxiu no es puja a Internet.'],
  accesRapid: ['section.multimedia.espai.accesRapid', 'Accés ràpid'],
  galeriaTots: ['section.multimedia.espai.galeriaTots', 'Galeria publicada · Tots'],
  galeriaIaia: ['section.multimedia.espai.galeriaIaia', 'Creacions IAIA / Nano Banana'],
  cronologia: ['section.multimedia.espai.cronologia', 'Cronologia per mesos'],
  local: ['section.multimedia.espai.local', 'Carpeta local · Volums muntats'],
  vistaCarpeta: ['section.multimedia.espai.vistaCarpeta', 'Fototeca de «{nom}»'],
  imatges: ['section.multimedia.espai.imatges', '{n} imatges'],
  mesos: ['section.multimedia.espai.mesos', '{n} mesos'],
  arxius: ['section.multimedia.espai.arxius', '{n} arxius · {pes}'],
  ambRecompte: ['section.multimedia.espai.ambRecompte', '{nom} ({n})'],
  document: ['section.multimedia.espai.document', 'Document'],
  publicada: ['section.multimedia.espai.publicada', 'Galeria publicada'],
  senseTitol: ['section.multimedia.espai.senseTitol', 'Imatge sense títol'],
  fitxaArxiu: ['section.multimedia.espai.fitxaArxiu', 'Dades de l’arxiu'],
  comparador: ['section.multimedia.espai.comparador', 'Original local ↔ publicada a la web'],
  originalLocal: ['section.multimedia.espai.originalLocal', 'Original local ({pes})'],
  webPublicada: ['section.multimedia.espai.webPublicada', 'Publicada a la web'],
  llistaRetallada: ['section.multimedia.espai.llistaRetallada', 'La llista mostra {n} de {total} arxius; la Fototeca els té tots.'],
  colFont: ['section.multimedia.espai.col.font', 'Font'],
  colData: ['section.multimedia.espai.col.data', 'Data'],
  dadesFoto: ['section.multimedia.espai.dadesFoto', 'Dades de la imatge'],
  senseImatges: ['section.multimedia.espai.senseImatges', 'Esta galeria encara no té cap imatge.'],
  /* Gauntlet 261029 (cicle 1, i18n) · Les formes en singular (cap «1 arxius»):
     les tria segonsNombre, amb n = 1. En basc coincidixen amb el plural. */
  imatgesUn: ['section.multimedia.espai.imatges.un', '{n} imatge'],
  mesosUn: ['section.multimedia.espai.mesos.un', '{n} mes'],
  arxiusUn: ['section.multimedia.espai.arxius.un', '{n} arxiu · {pes}'],
  elements: ['section.multimedia.espai.elements', '{n} elements'],
  elementsUn: ['section.multimedia.espai.elements.un', '{n} element'],
  /* La cel·la d'una imatge publicada sense src ni títol (nom per al lector). */
  senseImatge: ['section.multimedia.espai.senseImatge', 'Sense imatge'],
  /* Gauntlet 261029 (cicle 1) · La Columna 2 buida per la cerca (labels.noResults):
     «Esta carpeta no té cap arxiu» era fals quan la carpeta en té. */
  senseCoincidencies: ['section.multimedia.espai.senseCoincidencies', 'Cap arxiu coincidix amb la cerca.'],
  /* Les etiquetes de l'UniversalWorkspace que la secció passa traduïdes (la
     reserva és la del workspace, tret del títol del menú d'ordenar, que ací
     parla d'arxius i no de notes). */
  tot: ['section.multimedia.espai.tot', 'Tot'],
  ajustos: ['section.multimedia.espai.ajustos', 'Configuració de l’espai de treball'],
  torna: ['section.multimedia.espai.torna', 'Tornar arrere'],
  carregant: ['section.multimedia.espai.carregant', 'Carregant…'],
  error: ['section.multimedia.espai.error', 'No s’han pogut carregar les dades.'],
  reintenta: ['section.multimedia.espai.reintenta', 'Reintentar'],
  tanca: ['section.multimedia.espai.tanca', 'Tancar'],
  neteja: ['section.multimedia.espai.neteja', 'Netejar'],
  etiquetes: ['section.multimedia.espai.etiquetes', 'Filtrar per etiquetes'],
  desplega: ['section.multimedia.espai.desplega', 'Desplegar {nom}'],
  plega: ['section.multimedia.espai.plega', 'Plegar {nom}'],
  ordena: ['section.multimedia.espai.ordena', 'Ordenar per data o nom'],
  ordenaTitol: ['section.multimedia.espai.ordena.titol', 'Ordenar arxius per'],
  ordenaData: ['section.multimedia.espai.ordena.data', 'Data d’actualització'],
  ordenaNom: ['section.multimedia.espai.ordena.nom', 'Nom (A-Z)'],
  /* El mes de la Cronologia quan el navegador no porta les dades de la
     llengua (Chrome no en té d'eu ni de gl i hi posaria el castellà):
     {mes} és el nom del mes (MESOS_ESPAI) i {any}, l'any. */
  plantillaMes: ['section.multimedia.espai.mes.plantilla', '{mes} del {any}']
});

/** Els dotze mesos, en minúscula (la Cronologia en fa majúscula la primera lletra). */
export const MESOS_ESPAI = Object.freeze([
  ['section.multimedia.espai.mes.1', 'gener'],
  ['section.multimedia.espai.mes.2', 'febrer'],
  ['section.multimedia.espai.mes.3', 'març'],
  ['section.multimedia.espai.mes.4', 'abril'],
  ['section.multimedia.espai.mes.5', 'maig'],
  ['section.multimedia.espai.mes.6', 'juny'],
  ['section.multimedia.espai.mes.7', 'juliol'],
  ['section.multimedia.espai.mes.8', 'agost'],
  ['section.multimedia.espai.mes.9', 'setembre'],
  ['section.multimedia.espai.mes.10', 'octubre'],
  ['section.multimedia.espai.mes.11', 'novembre'],
  ['section.multimedia.espai.mes.12', 'desembre']
].map((parell) => Object.freeze(parell)));

/** El parell en singular amb n = 1 («1 arxiu»); si no, el plural. */
export const segonsNombre = (n, plural, singular) => (Number(n) === 1 && singular ? singular : plural);

/**
 * La taula de mesos de reserva per a etiquetaDelMes (cronologia.js), ja
 * traduïda: { mesos: [12 noms], plantilla }. `tr` és el traductor de parells
 * de la secció (tradueix lligat a `t`).
 * @param {(parell: readonly [string, string]) => string} tr
 */
export const calendariDe = (tr) => ({ mesos: MESOS_ESPAI.map((parell) => tr(parell)), plantilla: tr(TEXTOS_ESPAI.plantillaMes) });
