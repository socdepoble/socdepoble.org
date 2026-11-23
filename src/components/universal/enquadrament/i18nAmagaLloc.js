/**
 * i18nAmagaLloc.js — v1.2.23 · IDEA-331 (ordre del Mestre 261123) · Els
 * textos de l'interruptor «Amaga el lloc» de l'enquadrament que no viuen al
 * diccionari síncron d'arrencada (ca.js), en les 5 llengües oficials (`ca`,
 * `es`, `en`, `eu`, `gl`):
 *   · revisaLloc · qui desa abans que acabe la lectura de l'EXIF d'una foto amb
 *     una ubicació que es pot conservar: el control que apareix és
 *     l'interruptor, no la casella (AVIS_REVISA_EXIF continua per a la casella
 *     de les fotos sense ubicació o que no es poden conservar). «{lloc}» és el
 *     rètol curt de l'interruptor amb la seua clau de sempre
 *     (section.xat.adjunts.amagaLloc): l'avís nomena el control que es veu.
 *   · tambeData · la línia, a banda i just davall de l'interruptor apagat, quan
 *     la foto també porta la data, que es publica amb ella (el bloc sencer o la
 *     tria TRIA_UBICACIO_I_DATA d'exifIncrustat.js, i metadades.dataCaptura).
 *     No va dins de l'ajuda: la descripció de l'interruptor és el literal del
 *     Mestre tot sol (CasellaExif, DialegEnquadrament.jsx).
 *   · noConservableLloc i pressupostLloc · v1.2.23 · L2-03 (Gauntlet R1) · la
 *     pujada rebutja una foto amb l'interruptor apagat perquè la ubicació i la
 *     data no s'hi poden posar (ERROR_EXIF_NO_CONSERVABLE) o no hi caben
 *     (ERROR_PRESSUPOST_EXIF, utils/pujadaImatge.js). Eixos avisos diuen
 *     «desmarca «Conserva la ubicació i la data de la foto»», una casella que
 *     no es veu: estos diuen que s'encenga «{lloc}». El diàleg (desaImatge) i el
 *     cos de DocumentEditor els posen en lloc dels d'abans només en eixe cas.
 * Viu al mòdul diferit de l'enquadrament (+0 B a pesDelNucli), com
 * i18nEdicioSistema.js de les Notes. La llengua és la del text de la
 * interfície (llenguaDelText, la del traductor que pinta la resta del diàleg);
 * sense UIProvider (un espècimen solt), el valencià.
 */
import { useUIStateOpcional } from '../../../app/contexts/UIContext';

export const TEXTOS_AMAGA_LLOC = Object.freeze({
  ca: Object.freeze({
    revisaLloc: 'Esta foto porta dades que es publicarien amb ella. Revisa «{lloc}» i torna a desar.',
    tambeData: 'També es publicarà la data de la foto.',
    noConservableLloc: 'No es pot conservar la ubicació i la data d’esta foto; encén «{lloc}» per a pujar-la sense.',
    pressupostLloc: 'La foto pesa massa amb la ubicació i la data; encén «{lloc}» o prova amb una altra foto.',
  }),
  es: Object.freeze({
    revisaLloc: 'Esta foto lleva datos que se publicarían con ella. Revisa «{lloc}» y vuelve a guardar.',
    tambeData: 'También se publicará la fecha de la foto.',
    noConservableLloc: 'No se pueden conservar la ubicación y la fecha de esta foto; activa «{lloc}» para subirla sin ellas.',
    pressupostLloc: 'La foto pesa demasiado con la ubicación y la fecha; activa «{lloc}» o prueba con otra foto.',
  }),
  en: Object.freeze({
    revisaLloc: 'This photo carries data that would be published with it. Review “{lloc}” and save again.',
    tambeData: 'The photo’s date will also be published.',
    noConservableLloc: 'This photo’s location and date cannot be kept; turn on “{lloc}” to upload it without them.',
    pressupostLloc: 'The photo is too heavy with its location and date; turn on “{lloc}” or try another photo.',
  }),
  eu: Object.freeze({
    revisaLloc: 'Argazki honek berarekin argitaratuko liratekeen datuak ditu. Berrikusi «{lloc}» aukera eta gorde berriro.',
    tambeData: 'Argazkiaren data ere argitaratuko da.',
    noConservableLloc: 'Ezin dira argazki honen kokapena eta data gorde; aktibatu «{lloc}» aukera, haiek gabe igotzeko.',
    pressupostLloc: 'Argazkiak pisu gehiegi du kokapenarekin eta datarekin; aktibatu «{lloc}» aukera edo saiatu beste argazki batekin.',
  }),
  gl: Object.freeze({
    revisaLloc: 'Esta foto leva datos que se publicarían con ela. Revisa «{lloc}» e volve gardar.',
    tambeData: 'Tamén se publicará a data da foto.',
    noConservableLloc: 'Non se poden conservar a localización e a data desta foto; activa «{lloc}» para subila sen elas.',
    pressupostLloc: 'A foto pesa demasiado coa localización e a data; activa «{lloc}» ou proba con outra foto.',
  }),
});

/** Els textos d'una llengua; una llengua desconeguda o absent, el valencià. */
export function textosAmagaLloc(idioma) {
  return TEXTOS_AMAGA_LLOC[idioma] || TEXTOS_AMAGA_LLOC.ca;
}

/* La llengua del text de la interfície, o undefined fora de l'App (o amb una
   prova que simula UIContext sense eixa exportació). La forma `return …` dins
   del try és la de useTraductorOpcional. */
export function useLlenguaDelTextOpcional() {
  try {
    const ui = useUIStateOpcional();
    return ui?.llenguaDelText || ui?.language;
  } catch {
    return undefined;
  }
}
