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
   per això les seues empremtes aprovades continuen valent.
   Ordre del Mestre, 13-10-2026 (pla 261013_1405, front E): la Cabina d'Avió
   és una vista del Tauler (CabinaAvio.jsx, que munta la closca) amb el seu
   model (nucli/cabinaAvio.js, dins de dadesDelTauler): les dues són fonts del
   Tauler, i el model també de l'Històric, que el troba per Tauler.jsx →
   targetesTauler.js. CabinaAvio.jsx no és a les peces de l'Històric: Tauler.jsx
   no la importa. */
const UI_TAULER = [
  'src/sections/gestoria/tauler/CabinaAvio.jsx',
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
  'src/sections/gestoria/nucli/extracteCsv.js',
  'src/sections/gestoria/nucli/model.js',
  'src/sections/gestoria/nucli/movimentsBanc.js',
  'src/sections/gestoria/nucli/nif.js',
  'src/sections/gestoria/nucli/proveidors.js',
  'src/sections/gestoria/tauler/nucli/cabinaAvio.js',
  'src/sections/gestoria/tauler/nucli/resumTauler.js',
  'src/sections/gestoria/tauler/nucli/targetesTauler.js',
  'src/sections/gestoria/tauler/nucli/tractorTauler.js'
];

/* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front D): els extractes del
   Tauler també poden ser els que l'Escàner Local troba a la carpeta que tries i
   tu hi aboques. Els bytes els llig igualment este tractor, amb la seua
   aprovació (llig[0]). */
export const TRACTOR_TAULER = Object.freeze({
  schema: 'sdp.tractor.v1',
  id: 'gestoria.tauler',
  nom: 'Gestoria · Tauler de l’empresa',
  versio: '1.0.0',
  descripcio: 'Llig només en este ordinador els extractes del banc que tries (Norma 43 o el CSV de moviments) i en calcula la caixa real, la cobertura, les finances dels últims 30 dies i la tresoreria de cada compte.',
  fitxa: 'src/sections/gestoria/fitxes/gestoria_tauler.md',
  fonts: Object.freeze([...PORTA_APROVACIO, ...UI_TAULER, ...NUCLI_TAULER].sort()),
  llig: Object.freeze([
    'Els extractes del banc que tries amb el selector del sistema, o els que l’Escàner Local troba a la carpeta que tries i tu aboques al Tauler: Norma 43 (.n43, .aeb, .c43, .q43, .txt, .dat) o el CSV de moviments',
    'Si el tries també, el fitxer de configuració de l’empresa (.json): només el nom i la població de la boina'
  ]),
  escriu: Object.freeze(['Res']),
  xarxa: 'cap',
  dadesPersonals: true,
  nivellMinim: 'signatura',
  caducitatDies: 90
});

/* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front D): l'Escàner Local
   recorre la carpeta arrel sencera, hi troba els extractes del banc i les
   factures de cada trimestre, avisa dels duplicats, de les dates que no
   quadren i dels buits, i proposa abocar els extractes al Tauler. És una
   lectura nova de dades personals i té el seu tractor, separat dels altres
   (el precedent del Tauler, 261004, i de l'Històric, 261009): les seues fonts
   són el seu panell i el seu hook (UI_ESCANER), el seu nucli i els lectors que
   reutilitza (NUCLI_ESCANER), que només s'importen. El graf estàtic sencer de
   PanellEscaner.jsx, useEscaner.js, tractorEscaner.js i escaner.js és ací:
   PORTA_APROVACIO, BASE_GESTORIA (la Font i nucli/tractor.js) i estes dues
   llistes. Cap font dels altres quatre canvia. Abocar els extractes al Tauler
   no salta la seua porta: els bytes els llig executaTractorTauler, amb
   l'aprovació de 'gestoria.tauler'. */
export const UI_ESCANER = Object.freeze([
  'src/sections/gestoria/escaner/PanellEscaner.jsx',
  'src/sections/gestoria/escaner/useEscaner.js'
]);

export const NUCLI_ESCANER = Object.freeze([
  'src/sections/gestoria/documents/catalegTipus.js',
  'src/sections/gestoria/documents/classificaDocument.js',
  'src/sections/gestoria/escaner/nucli/escaner.js',
  'src/sections/gestoria/escaner/nucli/tractorEscaner.js',
  'src/sections/gestoria/nucli/c43.js',
  'src/sections/gestoria/nucli/classifica.js',
  'src/sections/gestoria/nucli/extracteCsv.js',
  'src/sections/gestoria/nucli/inflate.js',
  'src/sections/gestoria/nucli/movimentsBanc.js',
  'src/sections/gestoria/nucli/pdfText.js',
  'src/sections/gestoria/nucli/receptes.js',
  'src/sections/gestoria/tauler/nucli/tractorTauler.js'
]);

export const TRACTOR_ESCANER = Object.freeze({
  schema: 'sdp.tractor.v1',
  id: 'gestoria.escaner',
  nom: 'Gestoria · Escàner Local de la carpeta',
  versio: '1.0.0',
  descripcio: 'Recorre només en este ordinador la carpeta arrel que tries, troba els extractes del banc, classifica les factures de cada trimestre, avisa de duplicats, dates que no quadren i buits, i et proposa abocar els extractes al Tauler.',
  fitxa: 'src/sections/gestoria/fitxes/gestoria_escaner.md',
  fonts: Object.freeze([...PORTA_APROVACIO, ...BASE_GESTORIA, ...UI_ESCANER, ...NUCLI_ESCANER].sort()),
  llig: Object.freeze([
    'La carpeta que tries amb el selector del sistema, sencera: el nom, la mida i la data de cada fitxer',
    'Els bytes de les factures i dels extractes que tenen la mateixa mida que un altre, només per a calcular-ne l’empremta sha256 (duplicats); mai els de la identitat, de l’arxiu ni de les credencials',
    'Els primers 4 kB dels extractes candidats (Norma 43 i CSV), només per a saber si el Tauler els pot llegir'
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

/* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front H): la Fitxa
   d'identitat privada sobirana i la Finestreta única. Auditoria Codex
   261013_1510 §2.1: un model privat separat, cap dada legal a
   public.profiles, a cap metadata ni a la xarxa. Tractor NOU, separat dels
   altres (el precedent del Tauler, 261004, i de l'Històric, 261009): les
   seues fonts són la vista i el seu hook (UI_IDENTITAT), el seu nucli i el
   lector de PDF que reutilitza (NUCLI_IDENTITAT), la carpeta i el nucli base
   (BASE_GESTORIA: la Font i nucli/tractor.js, amb el que este carrega
   després, DINAMICS_DE_LA_FONT) i el cofre sencer (COFRE_HISTORIC: el
   mateix cofre, col·lecció 'identitat'), que només s'importen. El graf
   sencer de Finestreta.jsx i tractorIdentitat.js és ací (les proves de
   tractorIdentitat.test.js ho comproven). Cap font dels altres canvia. La
   integració de l'onada 3 l'afig a TRACTORS_GESTORIA, amb les proves de la
   clausura (tractors/clausura.test.js). */
export const UI_IDENTITAT = Object.freeze([
  'src/sections/gestoria/finestreta/Finestreta.jsx',
  'src/sections/gestoria/finestreta/useFinestreta.js'
]);

export const NUCLI_IDENTITAT = Object.freeze([
  'src/sections/gestoria/finestreta/nucli/extractorIdentitat.js',
  'src/sections/gestoria/finestreta/nucli/filtreDocuments.js',
  'src/sections/gestoria/finestreta/nucli/fitxaIdentitat.js',
  'src/sections/gestoria/finestreta/nucli/formularisFinestreta.js',
  'src/sections/gestoria/finestreta/nucli/tractorIdentitat.js',
  'src/sections/gestoria/finestreta/nucli/validadorsIdentitat.js',
  'src/sections/gestoria/nucli/inflate.js',
  'src/sections/gestoria/nucli/pdfText.js'
]);

/* La Font (font/fontNavegador.js) importa nucli/tractor.js, i este carrega
   amb import() dinàmic, després de l'aprovació del full o del correu, els
   lectors de les factures i del correu. La Fitxa no els executa mai, però
   són al seu graf: entren a l'empremta, perquè la clausura (com la de
   l'Històric) no admet cap fitxer del graf fora de les fonts pròpies. */
const DINAMICS_DE_LA_FONT = [
  'src/sections/gestoria/nucli/classifica.js',
  'src/sections/gestoria/nucli/correus.js',
  'src/sections/gestoria/nucli/fullModel.js',
  'src/sections/gestoria/nucli/plantilla.js',
  'src/sections/gestoria/nucli/receptes.js'
];

export const TRACTOR_IDENTITAT = Object.freeze({
  schema: 'sdp.tractor.v1',
  id: 'gestoria.identitat',
  nom: 'Gestoria · Fitxa d’identitat i Finestreta',
  versio: '1.0.0',
  descripcio: 'Llig només en este ordinador els papers d’identitat de la carpeta que tries (01_Identitat_Legal i 03_Burocracia/SUMA; mai els de salut, banc, credencials, renda ni herència), et proposa els camps legals perquè els confirmes, en desa xifrats només els confirmats i te’ls prepara per a copiar-los als tràmits, sense signar ni presentar res.',
  fitxa: 'src/sections/gestoria/fitxes/gestoria_identitat.md',
  fonts: Object.freeze([...PORTA_APROVACIO, ...BASE_GESTORIA, ...DINAMICS_DE_LA_FONT, ...COFRE_HISTORIC, ...UI_IDENTITAT, ...NUCLI_IDENTITAT].sort()),
  llig: Object.freeze([
    'La carpeta arrel de la Gestoria que tries amb el selector del sistema: el nom i la mida de cada fitxer, per a decidir què es llig i què no abans d’obrir-ne cap',
    'Dins de 01_Identitat_Legal i de 03_Burocracia/SUMA, el PDF generat per màquina o el text pla dels papers permesos (vida laboral, afiliació, RETA, informe de bases, SUMA, Kit Digital, registre i estatuts d’associacions, representació) i dels que tu marques; mai salut, banc, credencials, renda, herència, model 145 ni imatges',
    'Quan prems «Comprova el paper» a «D’on ix», torna a llegir en este ordinador eixe paper de la carpeta triada, en comprova l’empremta i, si coincidix, l’obri en una pestanya d’este navegador; mai els vetats, només PDF i text pla i sense traure’n cap text',
    'Amb el cofre obert, la teua fitxa d’identitat desada: només els valors que has confirmat'
  ]),
  escriu: Object.freeze([
    'Res durant la lectura: les propostes viuen en la memòria de la pàgina',
    'Cada valor que confirmes o entres a mà, xifrat al cofre d’este navegador (AES-GCM-256, col·lecció identitat); mai una proposta sense confirmar ni el text dels papers',
    'Res als tràmits: la Finestreta prepara els camps per a copiar-los un a un i un esborrany per a imprimir; no signa ni presenta res'
  ]),
  xarxa: 'cap',
  dadesPersonals: true,
  nivellMinim: 'signatura',
  caducitatDies: 90
});

/* El catàleg de la Gestoria. Ordre del Mestre, 13-10-2026 (pla 261013_1405,
   fronts D i H): el cinqué, l'Escàner Local ('gestoria.escaner'), i el sisé,
   la Fitxa d'identitat i la Finestreta ('gestoria.identitat'). Entren
   «pendents»: cap no llig res fins que el Mestre els signa, i les empremtes
   dels altres quatre no en depenen (tractors/clausura.test.js ho comprova). */
export const TRACTORS_GESTORIA = Object.freeze([
  TRACTOR_FACTURES, TRACTOR_CORREUS, TRACTOR_TAULER, TRACTOR_HISTORIC, TRACTOR_ESCANER, TRACTOR_IDENTITAT
]);
