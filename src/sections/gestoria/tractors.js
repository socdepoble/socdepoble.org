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

/* Onada 6, ordre del Mestre (261009): «importar tot l'històric (des de l'any
   passat fins al trimestre passat)», «calcular les despeses massives en IA»,
   «fer simulacions» i «descarregar-se un full de càlcul per a la gestora».
   Tractor NOU (decisió per defecte 6 de la nit del 261009), separat dels tres
   d'abans: les seues fonts són la vista de l'Històric, el seu nucli i les
   peces del Tauler que reutilitza (lectors del banc, lectura reduïda, unió de
   comptes i targetes), que només s'importen. Cap font dels altres tres canvia,
   i per això les seues empremtes aprovades continuen valent. El que el
   tractor llig ho classifica dins: només en torna dates, imports, categoria i
   proveïdor, mai el text dels conceptes. */
const UI_HISTORIC = [
  'src/sections/gestoria/historic/Historic.jsx',
  'src/sections/gestoria/historic/PanellSimulacio.jsx',
  'src/sections/gestoria/historic/useHistoric.js'
];

const NUCLI_HISTORIC = [
  'src/sections/gestoria/despeses/nucli/categories.js',
  'src/sections/gestoria/despeses/nucli/serieHistorica.js',
  'src/sections/gestoria/historic/nucli/llibreGestora.js',
  'src/sections/gestoria/historic/nucli/operacions.js',
  'src/sections/gestoria/historic/nucli/targetesHistoric.js',
  'src/sections/gestoria/historic/nucli/tractorHistoric.js',
  'src/sections/gestoria/impostos/nucli/simulacio.js'
];

/* Les peces de la UI del Tauler que la vista reutilitza (targetes, pàgina
   de targeta, xifra amagada i ull): també són fonts d'este tractor. */
const PECES_TAULER_HISTORIC = [
  'src/sections/gestoria/tauler/Tauler.jsx',
  'src/sections/gestoria/tauler/TargetaTauler.jsx'
];

/* Integració de l'Onada 6, ordre del Mestre (261009): «xifra-ho i protegeix-ho
   perquè el Mestre puga provar amb dades reals». La vista es pinta darrere del
   cofre xifrat i hi desa, xifrada, la configuració de la persona: el cofre
   sencer (la porta, el hook, l'autobloqueig, el magatzem i el nucli
   criptogràfic) és part del que s'executa amb les dades, i per això entra a
   l'empremta d'este tractor (tractors/clausura.test.js ho exigix). Cap
   d'estos fitxers és font dels altres tres. */
const COFRE_HISTORIC = [
  'src/sections/gestoria/cofre/PortaCofre.jsx',
  'src/sections/gestoria/cofre/autobloqueig.js',
  'src/sections/gestoria/cofre/cofre.js',
  'src/sections/gestoria/cofre/magatzemCofre.js',
  'src/sections/gestoria/cofre/nucli/cripto.js',
  'src/sections/gestoria/cofre/useCofre.js'
];

export const TRACTOR_HISTORIC = Object.freeze({
  schema: 'sdp.tractor.v1',
  id: 'gestoria.historic',
  nom: 'Gestoria · Històric del banc i despesa en IA',
  versio: '1.0.0',
  descripcio: 'Llig només en este ordinador els extractes del banc que tries (fins a 60, Norma 43 o el CSV de moviments), classifica cada moviment per categoria i proveïdor sense guardar-ne el text, i en calcula l’històric per mes, trimestre i any, la despesa en IA, les estimacions d’impostos i el llibre per a la gestora.',
  fitxa: 'src/sections/gestoria/fitxes/gestoria_historic.md',
  fonts: Object.freeze([...PORTA_APROVACIO, ...UI_HISTORIC, ...NUCLI_HISTORIC, ...PECES_TAULER_HISTORIC, ...NUCLI_TAULER, ...COFRE_HISTORIC].sort()),
  llig: Object.freeze([
    'Els extractes del banc que tries amb el selector del sistema: Norma 43 (.n43, .aeb, .c43, .q43, .txt, .dat) o el CSV de moviments, fins a 60 fitxers de 10 MB',
    'Amb el cofre obert, la teua configuració desada (regles, reclassificacions, paràmetres, suposicions i escenari)'
  ]),
  escriu: Object.freeze([
    'Res durant la lectura',
    'Cada canvi de la teua configuració, xifrat al cofre d’este navegador (AES-GCM-256); mai els moviments del banc, que es tornen a llegir dels extractes',
    'Si ho demanes i ho confirmes: el llibre XLSX per a la gestora (sense xifrar), descarregat'
  ]),
  xarxa: 'cap',
  dadesPersonals: true,
  nivellMinim: 'signatura',
  caducitatDies: 90
});

export const TRACTORS_GESTORIA = Object.freeze([TRACTOR_FACTURES, TRACTOR_CORREUS, TRACTOR_TAULER, TRACTOR_HISTORIC]);
