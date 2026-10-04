/* Manifests dels tractors de la Gestoria (contracte sdp.tractor.v1 de
   ../tractors/nucli/registre.js). L'empremta que el Mestre aprova a la Wiki
   cobrix el manifest, la fitxa i cada font llistada: canviar-ne una sola
   línia torna el tractor a «pendent». Les rutes van des de l'arrel del
   repositori, perquè el navegador i Node en calculen la mateixa empremta.

   La porta d'aprovació sencera també hi entra (el nucli, el catàleg que
   calcula l'empremta, el hook que la llig i els diàlegs on s'aprova), i la
   UI de la Gestoria que aplica la segona i la tercera aprovació i fa les
   eixides: qui toca la porta o la UI, toca el tractor, i el Mestre ho ha de
   tornar a mirar. tractors/clausura.test.js comprova que no en falte cap. */

const PORTA_APROVACIO = [
  'src/sections/tractors/DialegAprovacio.jsx',
  'src/sections/tractors/PanellTractors.jsx',
  'src/sections/tractors/nucli/aprovacio.js',
  'src/sections/tractors/nucli/canonic.js',
  'src/sections/tractors/nucli/empremta.js',
  'src/sections/tractors/nucli/magatzem.js',
  'src/sections/tractors/nucli/registre.js',
  'src/sections/tractors/nucli/webauthn.js',
  'src/sections/tractors/registreTractors.js',
  'src/sections/tractors/useTractors.js'
];

/* La UI que fan servir els dos tractors: llig les fonts, exigix l'aprovació
   abans de cada acció i aplica la revisió humana de la proposta. */
const UI_GESTORIA = [
  'src/sections/gestoria/ContenidorGestoria.jsx',
  'src/sections/gestoria/PanellGestoria.jsx',
  'src/sections/gestoria/useGestoria.js'
];

const BASE_GESTORIA = [
  'src/sections/gestoria/font/fontNavegador.js',
  'src/sections/gestoria/nucli/auditoria.js',
  'src/sections/gestoria/nucli/cataleg.js',
  'src/sections/gestoria/nucli/csv.js',
  'src/sections/gestoria/nucli/dates.js',
  'src/sections/gestoria/nucli/diners.js',
  'src/sections/gestoria/nucli/model.js',
  'src/sections/gestoria/nucli/nif.js',
  'src/sections/gestoria/nucli/proveidors.js',
  'src/sections/gestoria/nucli/tractor.js'
];

export const TRACTOR_FACTURES = Object.freeze({
  schema: 'sdp.tractor.v1',
  id: 'gestoria.factures',
  nom: 'Gestoria · Full trimestral de factures',
  versio: '1.0.0',
  descripcio: 'Llig només en este ordinador la carpeta de factures que tries, proposa el full trimestral per a la gestoria i avisa de les factures que podrien faltar.',
  fitxa: 'src/sections/gestoria/fitxes/gestoria_factures.md',
  fonts: Object.freeze([
    ...PORTA_APROVACIO,
    ...BASE_GESTORIA,
    ...UI_GESTORIA,
    'src/sections/gestoria/VistaPreviaFull.jsx',
    'src/sections/gestoria/enviament/EnviamentGestoria.jsx',
    'src/sections/gestoria/enviament/correuGestoria.js',
    'src/sections/gestoria/enviament/revisioAdjunts.js',
    'src/sections/gestoria/nucli/classifica.js',
    'src/sections/gestoria/nucli/entregables.js',
    'src/sections/gestoria/nucli/fullModel.js',
    'src/sections/gestoria/nucli/inflate.js',
    'src/sections/gestoria/nucli/pdfText.js',
    'src/sections/gestoria/nucli/plantilla.js',
    'src/sections/gestoria/nucli/receptes.js',
    'src/sections/gestoria/nucli/xlsx.js',
    'src/sections/gestoria/nucli/zip.js'
  ].sort()),
  llig: Object.freeze([
    'La carpeta de factures que tries amb el selector del sistema: PDF, CSV i fulls dels trimestres'
  ]),
  escriu: Object.freeze([
    'Res durant l’anàlisi',
    'Després d’aprovar la proposta: el CSV i l’XLSX del trimestre, descarregats o a la carpeta del trimestre',
    'Si ho demanes: l’esborrany del correu per a la gestoria (.eml o redacció de Gmail); l’enviament el fas tu'
  ]),
  xarxa: 'cap',
  dadesPersonals: true,
  nivellMinim: 'signatura',
  caducitatDies: 90
});

export const TRACTOR_CORREUS = Object.freeze({
  schema: 'sdp.tractor.v1',
  id: 'gestoria.correus',
  nom: 'Gestoria · Creuament amb el correu',
  versio: '1.0.0',
  descripcio: 'Llig només en este ordinador les capçaleres d’una exportació de correu que tries i les creua amb les factures del trimestre.',
  fitxa: 'src/sections/gestoria/fitxes/gestoria_correus.md',
  fonts: Object.freeze([
    ...PORTA_APROVACIO,
    ...BASE_GESTORIA,
    ...UI_GESTORIA,
    'src/sections/gestoria/nucli/correus.js'
  ].sort()),
  llig: Object.freeze([
    'Una exportació de correu que tries (.mbox o .eml): només remitent, assumpte, data i noms d’adjunts'
  ]),
  escriu: Object.freeze(['Res']),
  xarxa: 'cap',
  dadesPersonals: true,
  nivellMinim: 'signatura',
  caducitatDies: 90
});

/* Ordre del Mestre, 261004 (onada 2, pas 1 del MAPA; aprovat al xat): el
   Tauler de l'empresa llig els extractes del banc amb un tractor NOU, separat
   dels dos signats. Les seues fonts són la closca (tauler/), el seu nucli i
   els lectors del banc que ja existien; cap font dels altres dos canvia, i
   per això les seues empremtes aprovades continuen valent. */
const UI_TAULER = [
  'src/sections/gestoria/tauler/ShellGestoria.jsx',
  'src/sections/gestoria/tauler/TargetaTauler.jsx',
  'src/sections/gestoria/tauler/Tauler.jsx',
  'src/sections/gestoria/tauler/useTauler.js'
];

const NUCLI_TAULER = [
  'src/sections/gestoria/impostos/nucli/impostos.js',
  'src/sections/gestoria/nucli/c43.js',
  'src/sections/gestoria/nucli/cataleg.js',
  'src/sections/gestoria/nucli/concilia.js',
  'src/sections/gestoria/nucli/csv.js',
  'src/sections/gestoria/nucli/dates.js',
  'src/sections/gestoria/nucli/diners.js',
  'src/sections/gestoria/nucli/model.js',
  'src/sections/gestoria/nucli/movimentsBanc.js',
  'src/sections/gestoria/nucli/nif.js',
  'src/sections/gestoria/nucli/proveidors.js',
  'src/sections/gestoria/tauler/nucli/resumTauler.js',
  'src/sections/gestoria/tauler/nucli/targetesTauler.js',
  'src/sections/gestoria/tauler/nucli/tractorTauler.js'
];

export const TRACTOR_TAULER = Object.freeze({
  schema: 'sdp.tractor.v1',
  id: 'gestoria.tauler',
  nom: 'Gestoria · Tauler de l’empresa',
  versio: '1.0.0',
  descripcio: 'Llig només en este ordinador els extractes del banc que tries (Norma 43 o el CSV de moviments) i en calcula la caixa real, la cobertura, les finances dels últims 30 dies i la tresoreria de cada compte.',
  fitxa: 'src/sections/gestoria/fitxes/gestoria_tauler.md',
  fonts: Object.freeze([...PORTA_APROVACIO, ...UI_TAULER, ...NUCLI_TAULER].sort()),
  llig: Object.freeze([
    'Els extractes del banc que tries amb el selector del sistema: Norma 43 (.n43, .aeb, .c43, .q43, .txt, .dat) o el CSV de moviments',
    'Si el tries també, el fitxer de configuració de l’empresa (.json): només el nom i la població de la boina'
  ]),
  escriu: Object.freeze(['Res']),
  xarxa: 'cap',
  dadesPersonals: true,
  nivellMinim: 'signatura',
  caducitatDies: 90
});

export const TRACTORS_GESTORIA = Object.freeze([TRACTOR_FACTURES, TRACTOR_CORREUS, TRACTOR_TAULER]);
