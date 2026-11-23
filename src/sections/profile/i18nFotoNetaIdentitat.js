/**
 * i18nFotoNetaIdentitat.js — v1.2.23 · L2-01 (Gauntlet R1) · Els avisos de «Multimèdia» quan una foto no es posa com
 * a avatar, logotip o capçalera d'una persona perquè porta dades dins del fitxer, o perquè no s'ha pogut comprovar
 * (fotoNetaDIdentitat.js), en les 5 llengües oficials (`ca`, `es`, `en`, `eu`, `gl`). Viu fora dels diccionaris
 * d'arrencada, al Perfil, que ja és diferit (+0 B a pesDelNucli), com i18nAmagaLloc.js de l'enquadrament. La llengua
 * és la del text de la interfície (useLlenguaDeLaUI); sense, el valencià.
 *   · avatar, logotip, capcalera · la foto porta dades (v1.2.23 · L2-01, Gauntlet R2: un EXIF que en diu alguna, un
 *     IPTC amb contingut, un XMP o un text de PNG; el bloc buit que posa ImageIO no compta): no s'ha posat, i es diu
 *     on es puja perquè isca neta (el camí d'identitat de la fitxa, useImatgeDeFitxa). «com la ubicació, la data o la càmera» són exemples:
 *     la guarda no diu quina en porta, només que en porta.
 *   · noComprovada · ara no s'ha pogut llegir la foto (la xarxa, el temps, una resposta del servidor que no és bona,
 *     el port que no ha resolt la referència): tampoc no s'ha posat, i tornar-ho a provar pot anar bé.
 *   · noComprovable · v1.2.23 · L2-01 (Gauntlet R2) · la foto no es podrà comprovar mai des d'ací (un format que la
 *     guarda no entén, com GIF, AVIF o SVG, un fitxer trencat o massa gran, una adreça de fora): tornar-ho a provar
 *     no hi canviaria res, així que diu on pujar-la perquè isca neta, la fitxa.
 */
export const TEXTOS_FOTO_NETA_IDENTITAT = Object.freeze({
  ca: Object.freeze({
    avatar: 'Esta foto porta dades dins del fitxer (com la ubicació, la data o la càmera) i l’avatar sempre va net, així que no s’ha posat. Puja-la com a avatar des de la fitxa, que la neteja.',
    logotip: 'Esta foto porta dades dins del fitxer (com la ubicació, la data o la càmera) i el logotip sempre va net, així que no s’ha posat. Puja-la com a logotip des de la fitxa, que la neteja.',
    capcalera: 'Esta foto porta dades dins del fitxer (com la ubicació, la data o la càmera) i la capçalera del teu perfil sempre va neta, així que no s’ha posat. Puja-la com a capçalera des de la fitxa, que la neteja.',
    noComprovada: 'No s’ha pogut comprovar que esta foto vaja neta de dades, així que no s’ha posat. Torna-ho a provar.',
    noComprovable: 'No es pot comprovar que esta foto vaja neta de dades, així que no s’ha posat. Puja-la des de la fitxa, que la neteja.',
  }),
  es: Object.freeze({
    avatar: 'Esta foto lleva datos dentro del archivo (como la ubicación, la fecha o la cámara) y el avatar siempre va limpio, así que no se ha puesto. Súbela como avatar desde la ficha, que la limpia.',
    logotip: 'Esta foto lleva datos dentro del archivo (como la ubicación, la fecha o la cámara) y el logotipo siempre va limpio, así que no se ha puesto. Súbela como logotipo desde la ficha, que la limpia.',
    capcalera: 'Esta foto lleva datos dentro del archivo (como la ubicación, la fecha o la cámara) y la cabecera de tu perfil siempre va limpia, así que no se ha puesto. Súbela como cabecera desde la ficha, que la limpia.',
    noComprovada: 'No se ha podido comprobar que esta foto vaya limpia de datos, así que no se ha puesto. Vuelve a intentarlo.',
    noComprovable: 'No se puede comprobar que esta foto vaya limpia de datos, así que no se ha puesto. Súbela desde la ficha, que la limpia.',
  }),
  en: Object.freeze({
    avatar: 'This photo carries data inside the file (such as the location, the date or the camera) and the avatar is always clean, so it has not been set. Upload it as the avatar from the profile page, which cleans it.',
    logotip: 'This photo carries data inside the file (such as the location, the date or the camera) and the logo is always clean, so it has not been set. Upload it as the logo from the profile page, which cleans it.',
    capcalera: 'This photo carries data inside the file (such as the location, the date or the camera) and your profile header is always clean, so it has not been set. Upload it as the header from the profile page, which cleans it.',
    noComprovada: 'It was not possible to check that this photo is free of data, so it has not been set. Try again.',
    noComprovable: 'This photo cannot be checked for data, so it has not been set. Upload it from the profile page, which cleans it.',
  }),
  eu: Object.freeze({
    avatar: 'Argazki honek datuak ditu fitxategiaren barruan (kokapena, data edo kamera, adibidez), eta avatarra beti garbi doa; beraz, ez da jarri. Igo ezazu avatar gisa fitxatik, han garbitzen baita.',
    logotip: 'Argazki honek datuak ditu fitxategiaren barruan (kokapena, data edo kamera, adibidez), eta logotipoa beti garbi doa; beraz, ez da jarri. Igo ezazu logotipo gisa fitxatik, han garbitzen baita.',
    capcalera: 'Argazki honek datuak ditu fitxategiaren barruan (kokapena, data edo kamera, adibidez), eta zure profilaren goiburua beti garbi doa; beraz, ez da jarri. Igo ezazu goiburu gisa fitxatik, han garbitzen baita.',
    noComprovada: 'Ezin izan da egiaztatu argazki honek daturik ez duenik; beraz, ez da jarri. Saiatu berriro.',
    noComprovable: 'Ezin da egiaztatu argazki honek daturik ez duenik; beraz, ez da jarri. Igo ezazu fitxatik, han garbitzen baita.',
  }),
  gl: Object.freeze({
    avatar: 'Esta foto leva datos dentro do ficheiro (como a localización, a data ou a cámara) e o avatar vai sempre limpo, así que non se puxo. Súbea como avatar desde a ficha, que a limpa.',
    logotip: 'Esta foto leva datos dentro do ficheiro (como a localización, a data ou a cámara) e o logotipo vai sempre limpo, así que non se puxo. Súbea como logotipo desde a ficha, que a limpa.',
    capcalera: 'Esta foto leva datos dentro do ficheiro (como a localización, a data ou a cámara) e a cabeceira do teu perfil vai sempre limpa, así que non se puxo. Súbea como cabeceira desde a ficha, que a limpa.',
    noComprovada: 'Non se puido comprobar que esta foto vaia limpa de datos, así que non se puxo. Téntao de novo.',
    noComprovable: 'Non se pode comprobar que esta foto vaia limpa de datos, así que non se puxo. Súbea desde a ficha, que a limpa.',
  }),
});

/** Els textos d'una llengua; una llengua desconeguda o absent, el valencià. */
export function textosFotoNetaIdentitat(idioma) {
  return TEXTOS_FOTO_NETA_IDENTITAT[idioma] || TEXTOS_FOTO_NETA_IDENTITAT.ca;
}

/** Quina imatge d'identitat és: el logotip d'una organització, l'avatar (persona o agent) o la capçalera d'una persona. */
export const quinaImatgeDIdentitat = (camp, mena) => {
  if (camp === 'heroImage') return 'capcalera';
  return mena === 'organitzacio' ? 'logotip' : 'avatar';
};
