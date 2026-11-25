/**
 * i18nOpfsIpad.js — Textos en 5 llengües (ca, es, en, eu, gl) per al botó d'importació
 * directa de fotos o fitxers en iPadOS / Safari / navegadors sense showDirectoryPicker
 * amb persistència OPFS/IndexedDB compatible amb `fontArxiusOpfs.js` (Onada v1.2.25 · Lot G2 · FN0-007).
 */

const LLENGUES = new Set(['ca', 'es', 'en', 'eu', 'gl']);

export function normalitzaIdiomaOpfs(locale = 'ca') {
  const codi = String(locale || 'ca').trim().toLowerCase().slice(0, 2);
  return LLENGUES.has(codi) ? codi : 'ca';
}

export const TEXTOS_OPFS_IPAD = Object.freeze({
  ca: Object.freeze({
    boto: 'Importa fotos o fitxers (iPad / navegador)',
    aria: 'Importa fotos o fitxers en este iPad o navegador',
    volumNom: 'Còpia privada del navegador',
    avisCopiaPrivada: 'Importar crea una còpia privada en este navegador i no modifica mai els originals del dispositiu. No substituïx una còpia de seguretat externa.',
    desatOpfs: 'S’han importat {n} fitxers a la còpia privada del navegador ({tipus}). Els originals del dispositiu no s’han tocat.',
    desatSessio: 'S’han obert {n} fitxers només per a esta sessió (sense emmagatzematge privat persistent en este navegador).',
    senseEspai: 'No queda prou espai al navegador per a completar la importació. Allibera espai i torna-ho a provar.',
    importacioParcial: 'S’han importat {importats} fitxers, però ha fallat «{fallit}». La llista s’ha refrescat amb les còpies completades.',
    errorImportacio: 'No s’ha pogut completar la importació en la còpia privada del navegador.',
    operacioParcialConfirmada: 'Part de l’operació ja s’havia confirmat al disc ({confirmades}). S’ha refrescat la vista amb l’estat real.',
    errorLlistaCarpetes: 'No s’ha pogut llegir la llista de carpetes vinculades. Torna a provar-ho més tard.'
  }),
  es: Object.freeze({
    boto: 'Importa fotos o archivos (iPad / navegador)',
    aria: 'Importa fotos o archivos en este iPad o navegador',
    volumNom: 'Copia privada del navegador',
    avisCopiaPrivada: 'Importar crea una copia privada en este navegador y nunca modifica los originales del dispositivo. No sustituye una copia de seguridad externa.',
    desatOpfs: 'Se han importado {n} archivos a la copia privada del navegador ({tipus}). Los originales del dispositivo no se han tocado.',
    desatSessio: 'Se han abierto {n} archivos solo para esta sesión (sin almacenamiento privado persistente en este navegador).',
    senseEspai: 'No queda espacio suficiente en el navegador para completar la importación. Libera espacio e inténtalo de nuevo.',
    importacioParcial: 'Se han importado {importats} archivos, pero ha fallado «{fallit}». La lista se ha refrescado con las copias completadas.',
    errorImportacio: 'No se ha podido completar la importación en la copia privada del navegador.',
    operacioParcialConfirmada: 'Parte de la operación ya se había confirmado en disco ({confirmades}). Se ha refrescado la vista con el estado real.',
    errorLlistaCarpetes: 'No se ha podido leer la lista de carpetas vinculadas. Vuelve a intentarlo más tarde.'
  }),
  en: Object.freeze({
    boto: 'Import photos or files (iPad / browser)',
    aria: 'Import photos or files on this iPad or browser',
    volumNom: 'Private browser copy',
    avisCopiaPrivada: 'Importing creates a private copy inside this browser and never modifies the original files on your device. It does not replace an external backup.',
    desatOpfs: 'Imported {n} files into private browser storage ({tipus}). Your original device files remain untouched.',
    desatSessio: 'Opened {n} files for this session only (persistent private browser storage unavailable).',
    senseEspai: 'Not enough browser storage space left to finish importing. Free up space and try again.',
    importacioParcial: 'Imported {importats} files, but «{fallit}» failed. The list has been refreshed with the completed copies.',
    errorImportacio: 'Could not complete importing into private browser storage.',
    operacioParcialConfirmada: 'Part of the operation had already been committed ({confirmades}). The view has been refreshed with the actual state.',
    errorLlistaCarpetes: 'Could not read the list of linked folders. Please try again later.'
  }),
  eu: Object.freeze({
    boto: 'Inportatu argazkiak edo fitxategiak (iPad / nabigatzailea)',
    aria: 'Inportatu argazkiak edo fitxategiak iPad edo nabigatzaile honetan',
    volumNom: 'Nabigatzaileko kopia pribatua',
    avisCopiaPrivada: 'Inportatzeak kopia pribatu bat sortzen du nabigatzaile honetan eta ez ditu inoiz gailuko jatorrizkoak aldatzen. Ez du kanpoko segurtasun-kopia ordezkatzen.',
    desatOpfs: '{n} fitxategi inportatu dira nabigatzaileko biltegi pribatura ({tipus}). Gailuko jatorrizkoak ez dira ukitu.',
    desatSessio: '{n} fitxategi ireki dira saio honetarako soilik (ez dago biltegi pribatu iraunkorrik).',
    senseEspai: 'Ez dago behar adina lekurik nabigatzailean inportazioa osatzeko. Askatu tokia eta saiatu berriro.',
    importacioParcial: '{importats} fitxategi inportatu dira, baina «{fallit}» fitxategiak huts egin du. Zerrenda freskatu da osatutako kopiekin.',
    errorImportacio: 'Ezin izan da inportazioa osatu nabigatzaileko kopia pribatuan.',
    operacioParcialConfirmada: 'Eragiketaren zati bat diskoan berretsita zegoen ({confirmades}). Ikuspegia benetako egoerarekin freskatu da.',
    errorLlistaCarpetes: 'Ezin izan da lotutako karpeten zerrenda irakurri. Saiatu berriro geroago.'
  }),
  gl: Object.freeze({
    boto: 'Importa fotos ou ficheiros (iPad / navegador)',
    aria: 'Importa fotos ou ficheiros neste iPad ou navegador',
    volumNom: 'Copia privada do navegador',
    avisCopiaPrivada: 'Importar crea unha copia privada neste navegador e nunca modifica os orixinais do dispositivo. Non substitúe unha copia de seguridade externa.',
    desatOpfs: 'Importáronse {n} ficheiros á copia privada do navegador ({tipus}). Os orixinais do dispositivo non se tocaron.',
    desatSessio: 'Abríronse {n} ficheiros só para esta sesión (sen almacenamento privado persistente neste navegador).',
    senseEspai: 'Non queda espazo abondo no navegador para completar a importación. Libera espazo e téntao de novo.',
    importacioParcial: 'Importáronse {importats} ficheiros, pero fallou «{fallit}». A lista refrescouse coas copias completadas.',
    errorImportacio: 'Non se puido completar a importación na copia privada do navegador.',
    operacioParcialConfirmada: 'Parte da operación xa fora confirmada no disco ({confirmades}). A vista refrescouse co estado real.',
    errorLlistaCarpetes: 'Non se puido ler a lista de cartafoles vinculados. Téntao de novo máis tarde.'
  })
});

export function textOpfsIpad(locale, clau, valors = null) {
  const codi = normalitzaIdiomaOpfs(locale);
  const plantilla = TEXTOS_OPFS_IPAD[codi]?.[clau] ?? TEXTOS_OPFS_IPAD.ca[clau] ?? clau;
  if (!valors) return plantilla;
  return String(plantilla).replace(/\{(\w+)\}/g, (_, k) => (valors[k] != null ? String(valors[k]) : ''));
}
