/**
 * Onada R32.39 · Lot 01 · Diccionari diferit d'accessibilitat (landmarks i regions)
 * per a BrainTaxonomia en les 5 llengües oficials (ca, es, en, eu, gl).
 * Mòdul 100 % pur (zero JSX) i fora del paquet estàtic d'arrencada (+0 B al nucli).
 */
const DICCIONARI_BRAIN_TAXONOMIA = Object.freeze({
  ca: Object.freeze({
    segonBrainAria: 'Segon Brain de categories i etiquetes',
    procedenciaAria: 'Procedència i cobertura del Brain',
    vistesAria: 'Vistes del Brain',
    dimensionsAria: 'Dimensions del Brain',
    fitxaMitAria: 'Fitxa MIT del node',
    propostesMestreAria: 'Sis noms proposats pel Mestre',
    collisionsAria: 'Col·lisions de noms de prova',
    lecturaSimulacioAria: 'Lectura accessible de la simulació',
    nomsEtapaAria: (etapa) => `Noms: ${etapa}`,
    etapaAbans: 'Abans',
    etapaDespres: 'Després',
  }),
  es: Object.freeze({
    segonBrainAria: 'Segundo Brain de categorías y etiquetas',
    procedenciaAria: 'Procedencia y cobertura del Brain',
    vistesAria: 'Vistas del Brain',
    dimensionsAria: 'Dimensiones del Brain',
    fitxaMitAria: 'Ficha MIT del nodo',
    propostesMestreAria: 'Seis nombres propuestos por el Mestre',
    collisionsAria: 'Colisiones de nombres de prueba',
    lecturaSimulacioAria: 'Lectura accesible de la simulación',
    nomsEtapaAria: (etapa) => `Nombres: ${etapa}`,
    etapaAbans: 'Antes',
    etapaDespres: 'Después',
  }),
  en: Object.freeze({
    segonBrainAria: 'Second Brain of categories and tags',
    procedenciaAria: 'Brain provenance and coverage',
    vistesAria: 'Brain views',
    dimensionsAria: 'Brain dimensions',
    fitxaMitAria: 'Node MIT record',
    propostesMestreAria: 'Six names proposed by the Mestre',
    collisionsAria: 'Test name collisions',
    lecturaSimulacioAria: 'Accessible simulation readout',
    nomsEtapaAria: (etapa) => `Names: ${etapa}`,
    etapaAbans: 'Before',
    etapaDespres: 'After',
  }),
  eu: Object.freeze({
    segonBrainAria: 'Kategorien eta etiketen Bigarren Brain-a',
    procedenciaAria: 'Brain-aren jatorria eta estaldura',
    vistesAria: 'Brain-aren ikuspegiak',
    dimensionsAria: 'Brain-aren dimentsioak',
    fitxaMitAria: 'Nodoaren MIT fitxa',
    propostesMestreAria: 'Mestreak proposatutako sei izenak',
    collisionsAria: 'Probako izenen talkak',
    lecturaSimulacioAria: 'Simulazioaren irakurketa irisgarria',
    nomsEtapaAria: (etapa) => `Izenak: ${etapa}`,
    etapaAbans: 'Aurretik',
    etapaDespres: 'Ondoren',
  }),
  gl: Object.freeze({
    segonBrainAria: 'Segundo Brain de categorías e etiquetas',
    procedenciaAria: 'Procedencia e cobertura do Brain',
    vistesAria: 'Vistas do Brain',
    dimensionsAria: 'Dimensións do Brain',
    fitxaMitAria: 'Ficha MIT do nodo',
    propostesMestreAria: 'Seis nomes propostos polo Mestre',
    collisionsAria: 'Colisións de nomes de proba',
    lecturaSimulacioAria: 'Lectura accesible da simulación',
    nomsEtapaAria: (etapa) => `Nomes: ${etapa}`,
    etapaAbans: 'Antes',
    etapaDespres: 'Despois',
  }),
});

export function codiLlenguaBrainTaxonomia(language = 'ca') {
  const base = String(language || 'ca').toLowerCase().split('-')[0];
  return Object.hasOwn(DICCIONARI_BRAIN_TAXONOMIA, base) ? base : 'ca';
}

export function textosBrainTaxonomiaA11y(language = 'ca') {
  return DICCIONARI_BRAIN_TAXONOMIA[codiLlenguaBrainTaxonomia(language)];
}
