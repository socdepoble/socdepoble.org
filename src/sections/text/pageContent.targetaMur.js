/* IDEA-116 (Onada R9, carril C2; ordre del Mestre del 261106) · La primera
   targeta incrustada del cos de /page/fediversity, en totes les llengües on
   la pàgina té cos: la de la primera publicació del Mur, «Noves tecnologies
   aplicades a la cultura rural» (/mur/noves-tecnologies-aplicades-a-la-cultura-rural).

   El mecanisme és el de sempre (skill sdp-universal-page, 261007): un grup
   `data-sdp-targetes` amb una targeta `publicacio:<id>` que CosAmbTargetes
   hidrata amb les dades vives del Mur; la instantània dels atributs és la
   reserva (el títol, el subtítol i l'entradeta de la llavor, en valencià, la
   llengua de la publicació). Es posa davant del cos, que ja porta la
   targeta del Node 0 més avall: així és la primera.

   Va en un mòdul a banda perquè pageContent.r10.js (el balanç datat) el
   reescriuen altres carrils: ací només s'afig la targeta després
   d'aplicaDossierR10 (pageContent.js).

   G1-N02 (Gauntlet de l'arbre R9) · A les traduccions, la targeta porta
   l'atribut estàndard lang="ca": formaDelGrup.js el llig i UniversalCard
   el posa al títol, al subtítol i a l'entradeta (i al nom de l'enllaç de la
   targeta, que és el títol), no als botons del peu, que són de la
   interfície. En valencià, la targeta de sempre, sense cap lang. */
import { NOVES_TECNOLOGIES_CULTURA_RURAL_POST as PUBLICACIO } from '../mur/articles/novesTecnologiesCulturaRuralContent.js';

const atribut = (text) => String(text ?? '')
  .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const RUTA_PRIMERA_TARGETA_FEDIVERSITY = `/mur/${PUBLICACIO.id}`;
export const CLAU_PRIMERA_TARGETA_FEDIVERSITY = `publicacio:${PUBLICACIO.id}`;

/** La llengua de la publicació del Mur (la de la llavor). */
export const LLENGUA_PRIMERA_TARGETA_FEDIVERSITY = 'ca';

const grupDeLaTargeta = (llengua) => [
  '<div data-sdp-targetes="" class="sdp-targetes" data-forma="sola" data-alineacio="dreta">',
  `<div data-sdp-targeta="${CLAU_PRIMERA_TARGETA_FEDIVERSITY}" class="sdp-targeta" data-ruta="${RUTA_PRIMERA_TARGETA_FEDIVERSITY}"${llengua ? ` lang="${llengua}"` : ''}`,
  ` data-titol="${atribut(PUBLICACIO.title)}" data-subtitol="${atribut(PUBLICACIO.post_subtitle)}"`,
  ` data-entradilla="${atribut(PUBLICACIO.entradilla)}"${PUBLICACIO.image_url ? ` data-imatge="${atribut(PUBLICACIO.image_url)}"` : ''} data-autor="${atribut(PUBLICACIO.author_name)}" data-autor-ruta="/projecte">`,
  `<a href="${RUTA_PRIMERA_TARGETA_FEDIVERSITY}" rel="noopener noreferrer nofollow">${atribut(PUBLICACIO.title)}</a>`,
  '</div></div>'
].join('');

export const GRUP_PRIMERA_TARGETA_FEDIVERSITY = grupDeLaTargeta(null);
/** El mateix grup a les traduccions de la pàgina: la targeta diu en quina llengua és el seu text. */
export const GRUP_PRIMERA_TARGETA_FEDIVERSITY_TRADUIDA = grupDeLaTargeta(LLENGUA_PRIMERA_TARGETA_FEDIVERSITY);

/** Posa la targeta al principi del cos de /page/fediversity i de cada traducció (una sola vegada).
 *  Sense cap blanc al davant: un tros d'HTML buit pintaria un .sdp-cos-tros buit davant del grup. */
export function afigPrimeraTargetaFediversity(copy) {
  const pagina = copy?.fediversity;
  if (!pagina || typeof pagina !== 'object') return;
  const davant = (html, grup) => (typeof html === 'string' && !html.includes(CLAU_PRIMERA_TARGETA_FEDIVERSITY)
    ? `${grup}${html}`
    : html);
  const grupPer = (llengua) => (llengua === LLENGUA_PRIMERA_TARGETA_FEDIVERSITY ? GRUP_PRIMERA_TARGETA_FEDIVERSITY : GRUP_PRIMERA_TARGETA_FEDIVERSITY_TRADUIDA);
  pagina.html = davant(pagina.html, grupPer(pagina.contentLanguage ?? LLENGUA_PRIMERA_TARGETA_FEDIVERSITY));
  for (const [llengua, traduccio] of Object.entries(pagina.translations || {})) {
    if (traduccio && typeof traduccio === 'object') traduccio.html = davant(traduccio.html, grupPer(llengua));
  }
}
