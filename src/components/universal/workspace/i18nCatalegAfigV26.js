/**
 * i18nCatalegAfigV26.js — Diccionari diferit en 5 llengües (ca, es, en, eu, gl)
 * per al botó uniforme «Afig Catàleg / Fitxa» i el modal dual (IDEA-367).
 *
 * Prefix exclusiu `catalegAfigV26*` · +0 B al nucli WP d'arrencada.
 */

const TEXTOS = Object.freeze({
  ca: Object.freeze({
    catalegAfigV26Boto: 'Afig Catàleg / Fitxa',
    catalegAfigV26Titol: 'Afig Catàleg / Fitxa',
    catalegAfigV26Subtitol: 'Tria com vols incorporar una fitxa o un llibre nou a esta col·lecció.',
    catalegAfigV26CamiATitol: 'Camí A · Crear al Bloc de Notes',
    catalegAfigV26CamiACos: 'Obri el Bloc de Notes amb la categoria Catàlegs i este catàleg ja preassignats per redactar una fitxa nova.',
    catalegAfigV26CamiABoto: 'Obrir el Bloc de Notes',
    catalegAfigV26CamiBTitol: 'Camí B · Pujar PDF o document',
    catalegAfigV26CamiBCos: 'Selecciona un PDF, Markdown o document de text per convertir-lo en llibre o en fitxes del catàleg.',
    catalegAfigV26CamiBSelector: 'Selecciona un document (.pdf, .md, .docx, .odt, .txt)',
    catalegAfigV26CamiBPreparat: 'Document seleccionat: {nom} ({mida}).',
    catalegAfigV26CamiBContinua: 'Continuar al Bloc de Notes',
    catalegAfigV26CamiBAdmin: 'Obrir panell d’importació',
    catalegAfigV26Tanca: 'Tancar'
  }),
  es: Object.freeze({
    catalegAfigV26Boto: 'Añadir Catálogo / Ficha',
    catalegAfigV26Titol: 'Añadir Catálogo / Ficha',
    catalegAfigV26Subtitol: 'Elige cómo incorporar una ficha o un libro nuevo a esta colección.',
    catalegAfigV26CamiATitol: 'Camino A · Crear en el Bloc de Notas',
    catalegAfigV26CamiACos: 'Abre el Bloc de Notas con la categoría Catálogos y este catálogo ya preasignados para redactar una ficha nueva.',
    catalegAfigV26CamiABoto: 'Abrir el Bloc de Notas',
    catalegAfigV26CamiBTitol: 'Camino B · Subir PDF o documento',
    catalegAfigV26CamiBCos: 'Selecciona un PDF, Markdown o documento de texto para convertirlo en libro o en fichas del catálogo.',
    catalegAfigV26CamiBSelector: 'Selecciona un documento (.pdf, .md, .docx, .odt, .txt)',
    catalegAfigV26CamiBPreparat: 'Documento seleccionado: {nom} ({mida}).',
    catalegAfigV26CamiBContinua: 'Continuar en el Bloc de Notas',
    catalegAfigV26CamiBAdmin: 'Abrir panel de importación',
    catalegAfigV26Tanca: 'Cerrar'
  }),
  en: Object.freeze({
    catalegAfigV26Boto: 'Add Catalogue / Entry',
    catalegAfigV26Titol: 'Add Catalogue / Entry',
    catalegAfigV26Subtitol: 'Choose how to add a new entry or book to this collection.',
    catalegAfigV26CamiATitol: 'Path A · Create in Notepad',
    catalegAfigV26CamiACos: 'Opens the Notepad with the Catalogues category and this collection preselected for a new entry.',
    catalegAfigV26CamiABoto: 'Open Notepad',
    catalegAfigV26CamiBTitol: 'Path B · Upload PDF or document',
    catalegAfigV26CamiBCos: 'Choose a PDF, Markdown or text document to convert into a book or catalogue entries.',
    catalegAfigV26CamiBSelector: 'Select a document (.pdf, .md, .docx, .odt, .txt)',
    catalegAfigV26CamiBPreparat: 'Selected document: {nom} ({mida}).',
    catalegAfigV26CamiBContinua: 'Continue in Notepad',
    catalegAfigV26CamiBAdmin: 'Open import panel',
    catalegAfigV26Tanca: 'Close'
  }),
  eu: Object.freeze({
    catalegAfigV26Boto: 'Gehitu Katalogoa / Fitxa',
    catalegAfigV26Titol: 'Gehitu Katalogoa / Fitxa',
    catalegAfigV26Subtitol: 'Aukeratu nola gehitu fitxa edo liburu berri bat bilduma honetara.',
    catalegAfigV26CamiATitol: 'A bidea · Sortu Ohar-blokean',
    catalegAfigV26CamiACos: 'Ohar-blokea irekitzen du Katalogoak kategoria eta katalogo hau aurrez esleituta fitxa berri bat idazteko.',
    catalegAfigV26CamiABoto: 'Ireki Ohar-blokea',
    catalegAfigV26CamiBTitol: 'B bidea · Igo PDF edo dokumentua',
    catalegAfigV26CamiBCos: 'Hautatu PDF, Markdown edo testu-dokumentu bat liburu edo katalogoko fitxa bihurtzeko.',
    catalegAfigV26CamiBSelector: 'Hautatu dokumentu bat (.pdf, .md, .docx, .odt, .txt)',
    catalegAfigV26CamiBPreparat: 'Hautatutako dokumentua: {nom} ({mida}).',
    catalegAfigV26CamiBContinua: 'Jarraitu Ohar-blokean',
    catalegAfigV26CamiBAdmin: 'Ireki inportazio-panela',
    catalegAfigV26Tanca: 'Itxi'
  }),
  gl: Object.freeze({
    catalegAfigV26Boto: 'Engadir Catálogo / Ficha',
    catalegAfigV26Titol: 'Engadir Catálogo / Ficha',
    catalegAfigV26Subtitol: 'Escolle como incorporar unha ficha ou un libro novo a esta colección.',
    catalegAfigV26CamiATitol: 'Camiño A · Crear no Bloc de Notas',
    catalegAfigV26CamiACos: 'Abre o Bloc de Notas coa categoría Catálogos e este catálogo xa preasignados para redactar unha ficha nova.',
    catalegAfigV26CamiABoto: 'Abrir o Bloc de Notas',
    catalegAfigV26CamiBTitol: 'Camiño B · Subir PDF ou documento',
    catalegAfigV26CamiBCos: 'Selecciona un PDF, Markdown ou documento de texto para convertelo en libro ou en fichas do catálogo.',
    catalegAfigV26CamiBSelector: 'Selecciona un documento (.pdf, .md, .docx, .odt, .txt)',
    catalegAfigV26CamiBPreparat: 'Documento seleccionado: {nom} ({mida}).',
    catalegAfigV26CamiBContinua: 'Continuar no Bloc de Notas',
    catalegAfigV26CamiBAdmin: 'Abrir panel de importación',
    catalegAfigV26Tanca: 'Pechar'
  })
});

export function codiIdiomaCatalegAfigV26(idioma) {
  const curt = String(idioma || 'ca').trim().toLowerCase().slice(0, 2);
  return Object.hasOwn(TEXTOS, curt) ? curt : 'ca';
}

export function textosCatalegAfigV26(idioma = 'ca') {
  return TEXTOS[codiIdiomaCatalegAfigV26(idioma)];
}

export const CLAUS_I18N_CATALEG_AFIG_V26 = Object.freeze(Object.keys(TEXTOS.ca));
export const DICCIONARIS_I18N_CATALEG_AFIG_V26 = TEXTOS;
