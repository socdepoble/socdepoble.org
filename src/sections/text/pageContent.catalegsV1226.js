/** Dades editorials diferides; el llibre conserva la ruta del lector existent. */
import { DRETS_QUE_DINEM } from './pageContent.dretsPatrimoni.js';
import { rutaCataleg } from '../../data/patrimoni/catalegsMultipoble.js';

/* IDEA-366 (22:26) · /page/herbari és la Biblioteca Multipoble d'Herbaris; l'Herbari de La Torre (117 plantes del
   terme de La Torre de les Maçanes) n'és el primer llibre. L'entradeta conserva la xifra, el topònim i el nom del llibre en cada llengua, els de les traduccions anteriors (Herbario de La Torre, La Torre Herbarium, La Torreko herbarioa). */
const HERBARI = {
 ca:['Herbari','Biblioteca Multipoble d’Herbaris','Una biblioteca oberta als herbaris dels pobles. El primer llibre és l’Herbari de La Torre, amb 117 plantes documentades al terme de La Torre de les Maçanes.'],
 es:['Herbario','Biblioteca Multipueblo de Herbarios','Una biblioteca abierta a los herbarios de los pueblos. El primer libro es el Herbario de La Torre, con 117 plantas documentadas en el término de La Torre de les Maçanes.'],
 en:['Herbarium','Multi-village Herbarium Library','An open library for village herbaria. The first book is the La Torre Herbarium, with 117 plants documented in the municipality of La Torre de les Maçanes.'],
 eu:['Herbarioa','Herrietako Herbarioen Liburutegia','Herrietako herbarioentzako liburutegi irekia. Lehen liburua La Torreko herbarioa da, La Torre de les Maçanes udalerrian dokumentatutako 117 landarerekin.'],
 gl:['Herbario','Biblioteca Multipobo de Herbarios','Unha biblioteca aberta aos herbarios dos pobos. O primeiro libro é o Herbario de La Torre, con 117 plantas documentadas no termo de La Torre de les Maçanes.']
};
export function aplicaBibliotequesV1226(copy) {
 const herbari=copy.herbari;
 if(herbari){
  for(const [lang,[title,subtitle,lead]] of Object.entries(HERBARI)) {
   const page=lang==='ca'?herbari:herbari.translations?.[lang];
   if(page)Object.assign(page,{title,subtitle,lead});
  }
  // IDEA-366 · Una sola URL per llibre: el camí que servix CatalegWorkspace (catalegsMultipoble.js · rutaCataleg).
  herbari.llibres=[{id:'herbari-la-torre',slug:'herbari-la-torre',title:'Herbari de La Torre',href:rutaCataleg('/page/herbari','herbari-la-torre'),presentacioId:'presentacio-herbari-la-torre'}];
 }
}

/* IDEA-367 (23:06, punt 3) i C26-2 #4 · La card del llibre «Què dinem?» al /mur: FORA Sistema, amb Mur + Catàlegs +
   PDF (classificacioPaginesPubliques.js · SISTEMES_DE_PAGINA) i fidel a l'autoria i la llicència del llibre (IDEA-366:
   «fidel a l'autoria i llicència de cada llibre»). No és cap pàgina de PAGE_COPY: obri el lector del llibre,
   /page/receptes/que-dinem, i no hi ha cap /page/que-dinem pública duplicada. Els literals són els d'OBRA_QUE_DINEM
   (data/patrimoni/queDinem.js, 221 kB, diferit) i PORTADA_LLIBRE_QUE_DINEM (ReceptesWorkspaceSection.jsx), que no
   s'importen ací per no arrossegar-los al tros del Mur; la paritat la fixa targetesMur.v1226.test.js. */
export const OBRA_TARGETA_QUE_DINEM = Object.freeze({
 titol: 'Què dinem?',
 associacio: 'Associació Gastronòmica i Cultural «Fins rebentar com Sangonereta»',
 lloc: 'Muro, El Comtat',
 any: 2019,
 portada: '/assets/uploads/patrimoni/portada_que_dinem_muro.webp',
 ruta: '/page/receptes/que-dinem'
});
const QD = OBRA_TARGETA_QUE_DINEM;
const TEXTOS_QUE_DINEM = {
 ca:[`Receptari tradicional de Muro (${QD.any})`,`El llibre de receptes de l’${QD.associacio} (${QD.lloc}, ${QD.any}), amb la seua presentació, la llicència i el PDF original.`,`Portada del llibre «${QD.titol}» de l’${QD.associacio} (${QD.lloc}, ${QD.any})`],
 es:[`Recetario tradicional de Muro (${QD.any})`,`El libro de recetas de la ${QD.associacio} (${QD.lloc}, ${QD.any}), con su presentación, la licencia y el PDF original.`,`Portada del libro «${QD.titol}» de la ${QD.associacio} (${QD.lloc}, ${QD.any})`],
 en:[`Traditional recipe book from Muro (${QD.any})`,`The recipe book of the ${QD.associacio} (${QD.lloc}, ${QD.any}), with its presentation, licence and original PDF.`,`Cover of the book «${QD.titol}» by the ${QD.associacio} (${QD.lloc}, ${QD.any})`],
 eu:[`Muroko errezeta-liburu tradizionala (${QD.any})`,`${QD.associacio} elkartearen errezeta-liburua (${QD.lloc}, ${QD.any}), bere aurkezpenarekin, lizentziarekin eta jatorrizko PDFarekin.`,`${QD.associacio} elkartearen «${QD.titol}» liburuaren azala (${QD.lloc}, ${QD.any})`],
 gl:[`Receitario tradicional de Muro (${QD.any})`,`O libro de receitas da ${QD.associacio} (${QD.lloc}, ${QD.any}), coa súa presentación, a licenza e o PDF orixinal.`,`Portada do libro «${QD.titol}» da ${QD.associacio} (${QD.lloc}, ${QD.any})`]
};
const campsQueDinem = ([subtitle, lead, imageAlt]) => ({ title: QD.titol, subtitle, lead, imageAlt });

/** La card del llibre, amb la data de publicació de la seua biblioteca (`mare`, PAGE_COPY.receptes). */
export function targetaQueDinem(mare) {
 if (!mare || typeof mare !== 'object') return null;
 return {
  ...campsQueDinem(TEXTOS_QUE_DINEM.ca),
  date: mare.date,
  contentLanguage: 'ca',
  image: QD.portada,
  imageWidth: 1200,
  imageHeight: 675,
  author_name: QD.associacio,
  author_location: QD.lloc,
  copyright: DRETS_QUE_DINEM,
  href: QD.ruta,
  labels: [],
  translations: Object.fromEntries(['es', 'en', 'eu', 'gl'].map((lang) => [lang, { ...campsQueDinem(TEXTOS_QUE_DINEM[lang]), contentLanguage: lang }]))
 };
}
