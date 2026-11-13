/**
 * DialegEnquadrament — T46 (ordre del Mestre, 260928). Re-enquadrar la foto de
 * capçalera abans de desar-la. La miniatura del llistat (ItemMedia) i la
 * targeta del Mur pinten la mateixa heroImage: l'enquadrament val per a totes
 * (la del Mur és la còpia publicada: canvia quan la nota es torna a publicar).
 *
 * PRINCIPI: l'enquadrament es «cou» dins de l'arxiu. onDesa rep un File ja
 * retallat; al servidor no hi ha paràmetres de retall (sense migració, D2).
 * Per això re-enquadrar una imatge ja retallada només pot tancar més el pla,
 * i el diàleg ho diu abans de desar.
 *
 * CONTRACTE
 *   obert (true) · font (File | URL ja resolta) · formatInicial ('1:1') ·
 *   formats (FORMATS) · titol · descripcio · onTanca(motiu) ·
 *   onDesa(fitxer, { format, rect, sencera }) → Promise<boolean>: el pare el
 *   tanca; si llança, el missatge es mostra ací i el diàleg continua obert ·
 *   carregador / exportador / dibuixant: injectables per a les proves.
 *   «Original» sense zoom amb un File torna el MATEIX File (el camí d'abans);
 *   amb una URL no hi ha res a desar i es tanca.
 *
 * El visor és un <canvas> WYSIWYG (mida en atributs, sense style=): es mou
 * amb el dit o el ratolí (pointer events amb captura) i s'amplia amb dos dits.
 * El teclat i el lector de pantalla van pels lliscadors natius (al costat en
 * escriptori, davall en mòbil: correcció C19).
 *
 * ONADA 4, T3a (RETALLADOR i ADR multimèdia) · Ampliacions opcionals; sense
 * elles, el contracte T46 és exactament el d'abans.
 *   sortida ({ ampladaMaxima, format: 'image/webp' (reserva JPEG), qualitat })
 *     · el diàleg lliura el fitxer final i SEMPRE el torna a codificar: cap
 *     camí torna el fitxer original, que podria portar EXIF (D4).
 *   permetGeolocalitzacio (false) · ensenya «Vull geolocalitzar aquesta
 *     imatge», apagada. Encesa: llig el GPS i la data del fitxer ORIGINAL,
 *     deixa corregir-los o escriure'ls i triar la precisió. També força la
 *     recodificació.
 *   onDesa rep un tercer argument, sempre: metadades = { geolocalitzacio:
 *     { lat, lng, precisio_m, origen: 'exif'|'manual' } | null, dataCaptura }.
 *     Les coordenades viatgen com a camps, mai dins del fitxer (D6). Amb
 *     l'opció apagada, tot és null i no s'ha llegit cap GPS.
 *   lectorMetadades: injectable per a les proves.
 *   Límits (limits.js): 25 MB, 16.384 px per costat, 50 MP i HEIC, amb un
 *   avís en línia. Teclat sobre el visor: fletxes, + i −, Retorn desa.
 *
 * ONADA 4 (retallador senzill, ordre del Mestre 261008) · Calcat de la
 * finestra «Retallar foto» de Claude, per a les imatges del Perfil. Sense
 * estes dues props, el DOM i el comportament T46 són exactament els d'abans
 * (Llei del Píxel: el retallador de les Notes no canvia).
 *   senzill (false) · Títol curt i la línia d'ajuda davall (descripcio); el
 *     visor sol, centrat; una fila de zoom (−, lliscador «Ampliació», +) i la
 *     roda del ratolí; sense lliscadors de posició, sense «Forma» (si només
 *     n'hi ha una: vegeu la Directiva 261024, davall) i sense
 *     geolocalització. Peu: «Restablir» a l'esquerra; «Cancel·lar» i
 *     «Guardar» a la dreta. Sense la X: Escape continua tancant.
 *   mascara (null | 'cercle') · Amb 'cercle', el vel enfosquix el que queda
 *     fora del cercle (l'avatar es pinta redó). El fitxer continua quadrat.
 *   Directiva del Mestre (261024, àudio 22:47) · «El quadrat únic és una
 *     limitació inacceptable»: si `formats` en porta més d'una (la capçalera,
 *     FORMES.capcalera), el mode senzill pinta davall de la fila de zoom, i
 *     abans de la casella de l'EXIF, la mateixa «Forma» del T46 (GrupOpcions).
 *     Amb una sola forma (l'avatar, el logotip) el DOM és exactament el
 *     d'abans. El visor seguix la forma triada: el <canvas> pren la mida de
 *     midaVisor (atributs) i la caixa (.sdp-enquadrament__visor-caixa,
 *     fit-content) i el canvas (width i height auto amb els dos max, bloc T46
 *     de modules.css) en conserven la proporció; només el cercle de la
 *     màscara és redó. L'eixida és `sortida` (amb `costatLlarg`, 1.200 pel
 *     costat llarg) sobre el retall de la forma triada.
 *   Directiva del Mestre (261025, pla 261025_0045, T3: «el disseny és com el
 *     soroll per a allò usable») · DEROGADA la llista vertical de GrupOpcions
 *     en el mode senzill: nou ràdios amb la seua ajuda empenyien el visor fora
 *     de la vista. Ara, davall del zoom, una fila de píndoles d'un sol toc
 *     (ràdios natius en un fieldset role="radiogroup", com el selector de
 *     variants del Mercat: Tab entra per la triada i les fletxes canvien, cap
 *     JS de teclat) amb l'etiqueta curta («1:1», «16:9», «Original»…) i el nom
 *     sencer com a nom accessible («Panoràmic (16:9)»), i UNA línia de
 *     didàctica amb la forma triada i la seua ajuda. El diàleg passa a mida m
 *     i el visor es limita també per l'alçada de la pantalla
 *     (.sdp-enquadrament--formes, modules.css): la foto no ix mai de la vista
 *     mentre es tria. Amb una sola forma, el DOM de sempre (mida s).
 *
 * GAUNTLET 261016 (Bloc 1.2, mandat del Mestre, pla §0.1.3) · L'EXIF de la
 * foto es conserva de sèrie, amb la tria de la persona. Sense esta prop, el
 * diàleg és exactament el d'abans.
 *   ofereixConservarExif (false) · Si la foto triada (un File) porta EXIF
 *     (exifPublicable, exifIncrustat.js), ensenya la casella, MARCADA de
 *     sèrie, en els dos modes, davall dels controls. El text s'adapta al que
 *     porta (Codex, relleu 02:26): «Conserva la ubicació i la data de la
 *     foto» si en porta la ubicació o la data (l'avís diu la ubicació o, si
 *     no n'hi ha, la data), i «Conserva les dades de la càmera de la foto» si
 *     només porta la càmera (marca, model, MakerNote…). onDesa rep llavors, a
 *     metadades.exif, les opcions de la pujada: { conservaExif: true,
 *     original } (marcada; la compressió hi torna a posar l'EXIF publicable de
 *     l'original) o { conservaExif: false } (desmarcada: la foto ix neta, com
 *     abans). Sense casella, metadades no porta `exif`. El fitxer que lliura
 *     el diàleg no canvia: és la compressió de qui puja (compressImage) la que
 *     hi posa l'EXIF.
 *     Un EXIF que hi és però no es pot conservar (ESTAT_EXIF.NO_CONSERVABLE)
 *     també té casella, i el seu avís ho diu (errorExifNoConservable). Desar-la
 *     marcada no desa: el mateix avís dalt del diàleg, que continua obert;
 *     desmarcada, la foto ix neta. Mai una foto neta en silenci.
 *     Gauntlet 261016 (Bloc B) · Tres precisions:
 *       · Una adreça ja desada (re-enquadrar la capçalera) també: es llig
 *         l'EXIF del blob que ha obert el carregador (carregaImatge el torna),
 *         amb la mateixa casella, i `original` és eixe blob. Desmarcada, es
 *         desa neta encara que el retall siga la foto sencera. Un blob:
 *         directe no té bytes per llegir: cap casella, com abans.
 *       · L'etiqueta i l'avís diuen el que porta el bloc que es publicarà
 *         (contingut, exifIncrustat.js), i l'avís nomena les dades que
 *         identifiquen la càmera (marca, model, número de sèrie, un nom de
 *         persona) quan n'hi ha. La tria de sèrie no canvia (pla §0.1.3).
 *       · Qui desa abans d'haver vist la casella (la lectura no havia acabat)
 *         no publica res a cegues: si la lectura porta un EXIF per a la
 *         casella, no es desa; la casella apareix, marcada, amb AVIS_REVISA_EXIF,
 *         i és el segon clic el que desa. Si no porta res, es desa com abans.
 *   exifTriat (false) · Gauntlet R22 (ronda 4) · La destinació publica la
 *     tria de preparaTiffTriat (exifIncrustat.js), no el bloc sencer: el
 *     fitxer privat de les Notes, que ix al Mur per promoteToPublic
 *     (storage.js · ambExifTriat). L'avís diu llavors el que porta la còpia
 *     pública: amb la ubicació o la data, només eixes (cap dada de la
 *     càmera); amb només la càmera, la marca i el model, mai el número de
 *     sèrie ni cap nom; si no en queda cap, que no es publicaran. Sense la
 *     prop (la capçalera d'una fitxa del Perfil, que puja el bloc sencer de
 *     preparaTiff), l'avís de sempre. L'etiqueta i la tria no canvien.
 *   lectorExif: injectable per a les proves.
 *
 * ORDRE DEL MESTRE (18-10-2026, relleu del Pla 2000, punt 2) · «Agrupa
 * "Canviar foto", "Llevar avatar" i "Guardar enquadre" dins del propi
 * diàleg». Props opcionals noves, només per al mode senzill; sense elles, el
 * DOM i el comportament són exactament els d'abans (Llei del Píxel):
 *   onCanviaFoto (null) · (fitxer) → missatge | null. Amb ella, davall del
 *     visor, el botó «Canviar foto» (etiquetaCanviaFoto) i un selector de
 *     fitxers DINS del diàleg (acceptFoto): fora, el modal el deixaria inert.
 *     El pare valida el fitxer i, si l'accepta, canvia `font`: la foto nova
 *     s'obri en el mateix diàleg, centrada i sense zoom. Si torna un missatge,
 *     l'avís ix dins (el modal tapa qualsevol toast) i la foto d'abans es
 *     queda. Tancar el selector sense triar no tanca el diàleg.
 *   ajudaFoto (null) · el text dels formats admesos, davall d'eixos botons,
 *     lligat a «Canviar foto» (aria-describedby).
 *   onLleva (null) · amb ella, el botó etiquetaLleva al costat: el pare fa el
 *     que ja feia (la seua confirmació); mentre desa, desactivat.
 *   etiquetaDesa (null) · el nom del botó principal (per defecte, «Guardar»
 *     en el mode senzill i «Desar l’enquadrament» en el T46).
 *
 * P1-64 (pla 261028_1526 §3.1.1; Mestre 261028, decisions 7 i 8) · La
 * política diferenciada del GPS. Dues ampliacions; sense elles, el diàleg és
 * exactament el d'abans (Llei del Píxel):
 *   avisaGpsEliminat (false) · Una foto d'IDENTITAT (l'avatar de totes les
 *     menes i la capçalera d'una persona): mai cap casella. La foto ix neta
 *     sempre (el canvas la recodifica) i, NOMÉS si l'original portava una
 *     ubicació de veres (teUbicacio: el GPS llegit o un GPS IFD amb entrades
 *     que no són la versió), el diàleg ho diu amb AVIS_GPS_ELIMINAT_PERFIL,
 *     literal del Mestre, on aniria la casella. Dir que s'ha eliminat el que
 *     no hi era seria fals (Llei del Llop). onDesa rep metadades.exif =
 *     { conservaExif: false } i metadades.gpsEliminat (boolean), perquè qui
 *     puja ho torne a dir si la finestra ja s'ha tancat. Desar abans que acabe
 *     la lectura espera la lectura, però no demana revisar res (no hi ha
 *     casella). Una adreça ja desada amb GPS (re-enquadrar) no es dona per
 *     bona encara que siga sencera: es torna a retallar, i ix neta. Mana sobre
 *     ofereixConservarExif.
 *   La precisió (amb ofereixConservarExif) · Amb la casella marcada i una
 *     ubicació a la foto, davall de la casella, les píndoles de PRECISIONS
 *     (de sèrie PRECISIO_PER_DEFECTE_PUBLICACIO, 'exacta': decisió 8) i la
 *     línia «Es desarà: …». En desar, metadades.exif porta també `precisio`
 *     (la compressió hi arrodonix la ubicació del fitxer: ajustaPrecisioGps),
 *     metadades.geolocalitzacio, la de geolocalitzacio({ …, origen: 'exif' })
 *     a eixa precisió, i metadades.dataCaptura, la de la foto. Desmarcada,
 *     tot com abans. La casella amb les píndoles és CasellaExif, que també fa
 *     servir l'ordre «/» Imatge del text enriquit (DocumentEditor).
 *
 * P1-22 (assalt 261101) · Tots els textos passen pel traductor de la
 * interfície (TEXTOS_ENQUADRAMENT, TEXTOS_UBICACIO i els parells dels mòduls
 * purs, amb `t` opcional). Fora de l'app (sense UIProvider), el valencià de
 * sempre, lletra per lletra. titol, descripcio, etiquetaCanviaFoto,
 * etiquetaLleva i etiquetaDesa: si el pare els passa, es respecten tal qual;
 * si no, els de sèrie en la llengua de la interfície.
 *
 * P0-80 / IDEA-211 (llei del Mestre, 09-11-2026: ENQUADRAMENT NO DESTRUCTIU) ·
 * Deroga el PRINCIPI de dalt («l'enquadrament es cou dins de l'arxiu») per a
 * qui passa `noDestructiu` (la capçalera: les Notes, el Mur, les targetes i
 * la fitxa del Perfil). Sense la prop, el contracte d'abans, lletra per
 * lletra (l'avatar i el logotip: Llei del Quadrat, pendent del Mestre).
 *   noDestructiu (false) · Cap foto es retalla:
 *     · Una foto nova (File) ix SEMPRE sencera, rect { x: 0, y: 0, w: W, h:
 *       H }, a l'eixida de `sortida` sense `exacta` (la capçalera: 1.200 pel
 *       costat llarg de la foto), i onDesa rep info = { format, rect (el
 *       sencer), sencera: true, retall (el rect del marc, informatiu),
 *       enquadrament (l'estat net del marc, o null si és la foto sencera) }.
 *       Qui puja desa l'adreça que torne amb el fragment #sdp-crop= de
 *       l'enquadrament (utils/enquadramentUrl.js · ambEnquadrament).
 *     · Una adreça (re-enquadrar la que ja hi ha) es carrega SENSE el seu
 *       fragment, i el diàleg comença en el marc que porta (si la forma és de
 *       `formats`). En desar, si no cal tornar a codificar res, onDesa rep un
 *       TEXT: la mateixa adreça amb el fragment nou. Cap pujada ni cap
 *       retall: obrir i tornar a desar no perd cap píxel. Si el marc no ha
 *       canviat, es tanca sense desar (com una adreça sencera abans). Cal
 *       tornar a codificar (la foto sencera, mai el retall) quan la casella de
 *       l'EXIF s'ha desmarcat, quan una foto d'identitat porta GPS o amb la
 *       geolocalització: llavors un File sencer, com una foto nova.
 *     · R16a (revisió final, troballa 3) · Les píndoles de la precisió s'obrin
 *       en la que ja porta el GPS del fitxer (precisioDeGps; una càmera,
 *       l'exacta). Triar-ne una de més grossa és un canvi encara que el marc no
 *       es moga, i torna a codificar la foto sencera: la pujada hi arrodonix la
 *       ubicació (metadades.exif.precisio). Si no es canvia, cap pujada.
 *     · Una imatge d'abans, ja retallada i sense fragment, s'obri tal com és
 *       (en «Original»): no es torna a retallar, i desar-la amb un marc nou
 *       només hi afig el fragment.
 */
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Camera, Minus, Plus, Trash2 } from 'lucide-react';
import { Alerta, Boto, Camp, CampText, Carregant, Casella, Dialeg, GrupOpcions } from '../../PedraSeca/index.js';
import { tradueix, useTraductorOpcional } from '../../PedraSeca/hooks/useTraductorOpcional.js';
import { omple } from '../../../config/moderacio.js';
import {
  FORMATS, FORMAT_PER_DEFECTE, ambLliscador, ambRoda, ambTecla, arrossega, esSencera, estatInicial, etiquetaDeForma, limita,
  lliscador, marges, midaVisor, opcionsSortida, pessic, proporcio, rectDeRetall, textAmpliacio, zoomMaxim,
} from './enquadrament.js';
import { llegixMetadadesImatge, senseDades } from './exif.js';
import {
  errorExifNoConservable, esNoConservable, etiquetaConservaExif, exifPublicable, precisioDeGps, teData, teExifPerConservar,
  teUbicacio,
} from './exifIncrustat.js';
import {
  PRECISIONS, PRECISIO_PER_DEFECTE, PRECISIO_PER_DEFECTE_PUBLICACIO, errorUbicacio, geolocalitzacio, llegixCoordenada,
  precisionsTraduides, textUbicacio,
} from './geolocalitzacio.js';
import { carregaImatge, dibuixaVisor, exportaRetall } from './imatgeCanvas.js';
import { comprovaDimensions, comprovaPes, esHeic, missatgeLimit } from './limits.js';
import { TEXTOS_UBICACIO, UbicacioImatge } from './UbicacioImatge.jsx';
import {
  ambEnquadrament, enquadramentNet, llevaEnquadrament, mateixEnquadrament, separaEnquadrament,
} from '../../../utils/enquadramentUrl.js';

/* P0-80 / IDEA-211 · L'eixida de la foto sencera: la de `sortida` sense la
   mida exacta (que és la d'un retall: l'avatar i el logotip no hi passen).
   Sense `sortida`, la de sempre (midaSortida). */
const sortidaSencera = (sortida) => (sortida
  ? Object.fromEntries(Object.entries(sortida).filter(([clau]) => clau !== 'exacta'))
  : null);

/* P1-22 (assalt 261101) · La forma original, curta, a la seua píndola. */
const PARELL_ORIGINAL_CURTA = Object.freeze(['editor.enquadrament.formaOriginalCurta', 'Orig.']);

/* T3 (pla 261025_0045) · L'etiqueta curta d'una forma a la seua píndola: la
   proporció («16:9») o «Original». El nom accessible és l'etiqueta sencera. */
/* «Orig.» (prompt 261025_0045, T3): les nou píndoles caben en una fila a la mida m; el nom sencer el diu
   l'aria-label del ràdio i la didàctica. P1-22 · `t` (opcional): el traductor; sense, el valencià. */
export const etiquetaCurtaDeForma = (forma, t) => (forma?.valor === 'original' ? tradueix(t, PARELL_ORIGINAL_CURTA) : String(forma?.valor ?? ''));
/** T3 · La línia de didàctica de la forma triada: «Panoràmic (16:9) · <ajuda>», o només el nom. */
export const didacticaDeForma = (forma, t) => (forma ? [etiquetaDeForma(forma, t), forma.ajuda].filter(Boolean).join(' · ') : '');

export const ERROR_CARREGA_FITXER = 'No s’ha pogut obrir esta foto. Prova amb una imatge JPEG, PNG o WebP.';
export const ERROR_CARREGA_URL = 'No s’ha pogut obrir esta imatge per a enquadrar-la. Torna-la a pujar des del dispositiu.';
export const ERROR_EXPORTA = 'No s’ha pogut preparar la imatge enquadrada. Torna-ho a provar.';
/* Gauntlet 261016 (Bloc 1.2) · L'avís de la casella: què es publica si es deixa marcada. */
export const AJUDA_CONSERVA_UBICACIO = 'Si la deixes marcada, la ubicació es publicarà amb la foto.';
export const AJUDA_CONSERVA_DATA = 'Si la deixes marcada, la data es publicarà amb la foto.';
/* Gauntlet 261016 (Codex, 02:26) · Una foto que només porta la càmera. */
export const AJUDA_CONSERVA_CAMERA = 'Si la deixes marcada, les dades de la càmera es publicaran amb la foto.';
/* Gauntlet 261016 (Bloc B, P3) · Qui ha desat abans de veure la casella: no es desa encara. */
export const AVIS_REVISA_EXIF = 'Esta foto porta dades que es publicarien amb ella. Revisa la casella i torna a desar.';
/* P1-64 (Mestre 261028, decisió 7) · L'avís literal del Mestre: només quan la foto d'identitat portava GPS. */
export const AVIS_GPS_ELIMINAT_PERFIL = '🔒 Per la teua privacitat, s\'han eliminat les dades GPS de la foto de perfil';
/* P1-64 · Les píndoles de la precisió (nom accessible del grup) i la línia del que es desarà. */
export const LLEGENDA_PRECISIO = 'Precisió de la ubicació';

/* Gauntlet 261016 (Bloc B, P2) · Les dades que identifiquen la càmera o una
   persona que es publicarien (contingut, exifIncrustat.js), en l'ordre que es
   diuen: «la marca, el model i el número de sèrie», o '' si no n'hi ha cap. */
const PARTS_CAMERA = Object.freeze([
  ['marca', Object.freeze(['editor.enquadrament.cameraMarca', 'la marca'])],
  ['model', Object.freeze(['editor.enquadrament.cameraModel', 'el model'])],
  ['serie', Object.freeze(['editor.enquadrament.cameraSerie', 'el número de sèrie'])],
  ['nom', Object.freeze(['editor.enquadrament.cameraNom', 'un nom de persona'])],
]);
/* Gauntlet R22 (ronda 4) · Les que publica una destinació que tria
   (exifTriat; exifIncrustat.preparaTiffTriat, TRIA_CAMERA): la marca i el
   model, mai el número de sèrie ni el nom. */
const PARTS_CAMERA_TRIADES = Object.freeze(PARTS_CAMERA.filter(([clau]) => clau === 'marca' || clau === 'model'));
function dadesDeLaCamera(dades, t, partsCamera = PARTS_CAMERA) {
  const parts = partsCamera.filter(([clau]) => dades.contingut?.[clau]).map(([, parell]) => tradueix(t, parell));
  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} ${tradueix(t, TEXTOS_ENQUADRAMENT.llistaI)} ${parts.at(-1)}` : (parts[0] || '');
}

/* L'avís de la casella per al que porta la foto; si no es pot conservar, com
   eixir-ne. Bloc B · Decidit pel bloc que es publica (teUbicacio, teData), i
   amb les dades que identifiquen la càmera quan n'hi ha.
   Gauntlet R22 (ronda 4) · Amb `triat` (exifTriat), el que publica
   preparaTiffTriat: amb la ubicació o la data, cap dada de la càmera
   (TRIA_UBICACIO_I_DATA); sense, només la marca i el model (TRIA_CAMERA) i,
   si no n'hi ha cap, que les de la càmera no es publicaran. */
function ajudaConservaExif(dades, t, triat = false) {
  if (esNoConservable(dades)) return errorExifNoConservable(dades, t);
  if (teUbicacio(dades) || teData(dades)) {
    const base = tradueix(t, teUbicacio(dades) ? TEXTOS_ENQUADRAMENT.exifAjudaUbicacio : TEXTOS_ENQUADRAMENT.exifAjudaData);
    const camera = triat ? '' : dadesDeLaCamera(dades, t);
    return camera ? `${base} ${omple(tradueix(t, TEXTOS_ENQUADRAMENT.exifTambeCamera), { camera })}` : base;
  }
  const camera = dadesDeLaCamera(dades, t, triat ? PARTS_CAMERA_TRIADES : PARTS_CAMERA);
  if (camera) return omple(tradueix(t, TEXTOS_ENQUADRAMENT.exifNomesCamera), { camera });
  return tradueix(t, triat ? TEXTOS_ENQUADRAMENT.exifCameraNoEsPublica : TEXTOS_ENQUADRAMENT.exifAjudaCamera);
}

/**
 * P1-64 (pla 261028_1526 §3.1.1) · La casella de l'EXIF d'una foto de
 * PUBLICACIÓ (el hero i les fotos del cos), la de Pedra Seca. `dades` és el
 * que ha llegit exifPublicable; l'etiqueta i l'avís diuen el que porta (Codex,
 * 02:26). Amb `onPrecisio`, la casella marcada i una ubicació a la foto,
 * davall, les píndoles de PRECISIONS (ràdios natius en un fieldset
 * role="radiogroup", com les formes del mode senzill) i la línia «Es desarà:
 * …» amb el punt ja arrodonit. Sense `onPrecisio`, només la casella: el DOM
 * de sempre. Gauntlet R22 (ronda 4) · `exifTriat`: la destinació publica la
 * tria de preparaTiffTriat i l'avís ho diu (ajudaConservaExif).
 */
export function CasellaExif({
  dades, conserva, onConserva, precisio = PRECISIO_PER_DEFECTE_PUBLICACIO, onPrecisio = null, desactivat = false, exifTriat = false,
}) {
  const id = useId();
  const t = useTraductorOpcional();
  const precisions = useMemo(() => precisionsTraduides(t), [t]);
  const ambPrecisio = typeof onPrecisio === 'function' && conserva && teUbicacio(dades);
  const triada = precisions.find((p) => p.valor === precisio) || precisions[0];
  const punt = ambPrecisio && dades.gps ? geolocalitzacio({ lat: dades.gps.lat, lng: dades.gps.lng, precisio: triada.valor, origen: 'exif' }) : null;
  const idLinia = `${id}-desara`;
  return (
    <>
      <Casella etiqueta={etiquetaConservaExif(dades, t)} ajuda={ajudaConservaExif(dades, t, exifTriat === true)}
        checked={conserva} disabled={desactivat} onChange={(ev) => onConserva?.(ev.target.checked)} />
      {ambPrecisio ? (
        <fieldset className="sdp-enquadrament__formats" role="radiogroup" aria-labelledby={`${id}-llegenda`}
          aria-describedby={idLinia} disabled={desactivat}>
          <legend id={`${id}-llegenda`} className="sdp-nomes-lector">{tradueix(t, TEXTOS_ENQUADRAMENT.precisioLlegenda)}</legend>
          <div className="sdp-enquadrament__formats-pindoles">
            {precisions.map((p) => {
              const idOpcio = `${id}-precisio-${p.valor}`;
              return (
                <div key={p.valor} className="sdp-enquadrament__format">
                  <input type="radio" id={idOpcio} name={`${id}-precisio`} value={p.valor}
                    className="sdp-enquadrament__format-control sdp-nomes-lector"
                    checked={triada.valor === p.valor} onChange={() => onPrecisio(p.valor)} />
                  <label htmlFor={idOpcio} className="sdp-enquadrament__format-pindola">{p.etiqueta}</label>
                </div>
              );
            })}
          </div>
        </fieldset>
      ) : null}
      {ambPrecisio ? (
        <p id={idLinia} className="sdp-camp__ajuda" aria-live="polite">
          {punt
            ? `${omple(tradueix(t, TEXTOS_UBICACIO.desara), { ubicacio: textUbicacio(punt, triada.valor, t) })} ${triada.ajuda}`
            : triada.ajuda}
        </p>
      ) : null}
    </>
  );
}

/* Onada 4 (retallador senzill) · Un zoom «al límit» amb marge de coma flotant. */
const EPSILON_ZOOM = 1e-6;

const esFitxer = (font) => typeof Blob !== 'undefined' && font instanceof Blob;
const distancia = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/* R16a (revisió final, troballa 3: la precisió del GPS en re-enquadrar) · La
   precisió que ja porta la ubicació d'una lectura (la marca que hi deixa
   ajustaPrecisioGps: precisioDeGps del bloc TIFF), o null si no en porta cap.
   Una ubicació sense la marca, o que no s'entén, es pren per l'exacta: mai es
   dona per arrodonit el que potser no ho és. */
const precisioDelFitxer = (dades) => (teUbicacio(dades) ? (precisioDeGps(dades.tiff) || 'exacta') : null);
const metresDePrecisio = (valor) => PRECISIONS.find((p) => p.valor === valor)?.precisio_m ?? 0;
/* La precisió triada és més grossa (més vaga) que la que ja porta el fitxer?
   Llavors el fitxer s'ha de tornar a codificar: si no, es publicaria més
   precís del que diu el diàleg. Una de més fina no hi pot afegir res. */
const baixaLaPrecisio = (triada, delFitxer) => Boolean(delFitxer) && metresDePrecisio(triada) > metresDePrecisio(delFitxer);

/* Ordre del Mestre (18-10-2026, Pla 2000, punt 2) · Els noms de sèrie dels
   botons nous: la persona els llig tal com els va escriure el Mestre. */
export const ETIQUETA_CANVIA_FOTO = 'Canviar foto';
export const ETIQUETA_LLEVA_FOTO = 'Llevar la foto';
/* Tancar el selector de fitxers sense triar dispara `cancel` a l'input, i
   puja: el <dialog> el prendria per un Escape i es tancaria. Es para a l'input. */
const paraCancel = (e) => e.stopPropagation();

/* P1-22 (assalt 261101) · Els textos del diàleg en parells [clau, reserva]:
   la reserva és el valencià de sempre, lletra per lletra (les constants
   exportades d'amunt ho continuen sent: les importen les proves i qui puja).
   Dins, `t` és el traductor de la interfície o null (fora de l'app: un
   espècimen del catàleg muntat sol), i aleshores es pinta la reserva. Un
   titol, una descripcio o una etiqueta que passa el pare es respecten. */
export const TEXTOS_ENQUADRAMENT = Object.freeze({
  titol: Object.freeze(['editor.enquadrament.titol', 'Enquadrar la imatge']),
  descripcio: Object.freeze(['editor.enquadrament.descripcio',
    'Tria la forma i mou la foto fins que el que importa quede dins del marc. Només es guarda el que hi ha dins.']),
  restablir: Object.freeze(['editor.enquadrament.restablir', 'Restablir']),
  cancela: Object.freeze(['common.cancela', 'Cancel·lar']),
  guardar: Object.freeze(['editor.enquadrament.guardar', 'Guardar']),
  centrar: Object.freeze(['editor.enquadrament.centrar', 'Centrar']),
  desa: Object.freeze(['editor.enquadrament.desa', 'Desar l’enquadrament']),
  obrint: Object.freeze(['editor.enquadrament.obrint', 'Obrint la imatge…']),
  visorRetall: Object.freeze(['editor.enquadrament.visorRetall', 'Previsualització del retall']),
  visorEnquadrament: Object.freeze(['editor.enquadrament.visorEnquadrament', 'Previsualització de l’enquadrament']),
  allunya: Object.freeze(['editor.enquadrament.allunya', 'Allunyar']),
  apropa: Object.freeze(['editor.enquadrament.apropa', 'Apropar']),
  ampliacio: Object.freeze(['editor.enquadrament.ampliacio', 'Ampliació']),
  forma: Object.freeze(['editor.enquadrament.forma', 'Forma']),
  ajudaTeclat: Object.freeze(['editor.enquadrament.ajudaTeclat',
    'Arrossega la foto amb el dit o el ratolí per a moure-la; amb dos dits, l’amplies. També la pots moure i ampliar amb els lliscadors o, amb la foto seleccionada, amb les fletxes i les tecles + i −. Retorn la desa.']),
  massaXicoteta: Object.freeze(['editor.enquadrament.massaXicoteta', 'Esta foto és massa xicoteta per a ampliar-la més.']),
  posicioHoritzontal: Object.freeze(['editor.enquadrament.posicioHoritzontal', 'Posició horitzontal']),
  posicioVertical: Object.freeze(['editor.enquadrament.posicioVertical', 'Posició vertical']),
  senseMarge: Object.freeze(['editor.enquadrament.senseMarge', 'En esta direcció la foto ja omple tot el marc.']),
  valorEsquerra: Object.freeze(['editor.enquadrament.valorEsquerra', '{n} % des de l’esquerra']),
  valorDalt: Object.freeze(['editor.enquadrament.valorDalt', '{n} % des de dalt']),
  anunciPosicio: Object.freeze(['editor.enquadrament.anunciPosicio', 'Posició {x} % des de l’esquerra i {y} % des de dalt']),
  anunciAmpliacio: Object.freeze(['editor.enquadrament.anunciAmpliacio', 'Ampliació {valor}']),
  canviaFoto: Object.freeze(['editor.enquadrament.canviaFoto', ETIQUETA_CANVIA_FOTO]),
  llevaFoto: Object.freeze(['editor.enquadrament.llevaFoto', ETIQUETA_LLEVA_FOTO]),
  errorFitxer: Object.freeze(['editor.enquadrament.errorFitxer', ERROR_CARREGA_FITXER]),
  errorUrl: Object.freeze(['editor.enquadrament.errorUrl', ERROR_CARREGA_URL]),
  errorExporta: Object.freeze(['editor.enquadrament.errorExporta', ERROR_EXPORTA]),
  exifAjudaUbicacio: Object.freeze(['editor.enquadrament.exifAjudaUbicacio', AJUDA_CONSERVA_UBICACIO]),
  exifAjudaData: Object.freeze(['editor.enquadrament.exifAjudaData', AJUDA_CONSERVA_DATA]),
  exifAjudaCamera: Object.freeze(['editor.enquadrament.exifAjudaCamera', AJUDA_CONSERVA_CAMERA]),
  exifTambeCamera: Object.freeze(['editor.enquadrament.exifTambeCamera', 'També es publicaran les dades de la càmera: {camera}.']),
  exifNomesCamera: Object.freeze(['editor.enquadrament.exifNomesCamera',
    'Si la deixes marcada, les dades de la càmera es publicaran amb la foto: {camera}.']),
  /* Gauntlet R22 (ronda 4) · exifTriat i una càmera sense marca ni model: la còpia pública no en porta cap. */
  exifCameraNoEsPublica: Object.freeze(['editor.enquadrament.exifCameraNoEsPublica',
    'Si la deixes marcada, les dades de la càmera es conservaran, però no es publicaran amb la foto.']),
  exifRevisa: Object.freeze(['editor.enquadrament.exifRevisa', AVIS_REVISA_EXIF]),
  gpsEliminat: Object.freeze(['editor.enquadrament.gpsEliminat', AVIS_GPS_ELIMINAT_PERFIL]),
  llistaI: Object.freeze(['editor.enquadrament.llistaI', 'i']),
  precisioLlegenda: Object.freeze(['editor.enquadrament.precisioLlegenda', LLEGENDA_PRECISIO]),
});

/* Onada 4, T3a · Un límit o un HEIC tenen el seu avís; la resta, el de sempre. */
const missatgeCarrega = (err, font, t) => missatgeLimit(err?.codi, t)
  || (esHeic(font) ? missatgeLimit('heic', t)
    : tradueix(t, esFitxer(font) ? TEXTOS_ENQUADRAMENT.errorFitxer : TEXTOS_ENQUADRAMENT.errorUrl));

/* Onada 4, T3a · L'estat de «Vull geolocalitzar aquesta imatge». lat i lng
   són el text dels camps (la persona pot escriure «38,59»). */
const GEO_INICIAL = Object.freeze({
  actiu: false, llegint: false, trobada: false, lat: '', lng: '', origen: 'manual',
  precisio: PRECISIO_PER_DEFECTE, dataCaptura: null,
});

export function DialegEnquadrament({
  obert = true,
  font,
  formatInicial = FORMAT_PER_DEFECTE,
  formats = FORMATS,
  titol,
  descripcio,
  onTanca,
  onDesa,
  sortida = null,
  permetGeolocalitzacio = false,
  senzill = false,
  mascara = null,
  ofereixConservarExif = false,
  exifTriat = false,
  avisaGpsEliminat = false,
  noDestructiu = false,
  onCanviaFoto = null,
  etiquetaCanviaFoto,
  acceptFoto = 'image/*',
  ajudaFoto = null,
  onLleva = null,
  etiquetaLleva,
  etiquetaDesa = null,
  carregador = carregaImatge,
  exportador = exportaRetall,
  dibuixant = dibuixaVisor,
  lectorMetadades = llegixMetadadesImatge,
  lectorExif = exifPublicable,
}) {
  const id = useId();
  /* P1-22 · El traductor (o null) i, per als efectes asíncrons, el darrer. */
  const t = useTraductorOpcional();
  const tRef = useRef(t);
  tRef.current = t;
  const text = (parell) => tradueix(t, parell);
  /* Les formes amb el nom en la llengua de la interfície (una etiqueta pròpia del pare es respecta). */
  const formatsVistos = useMemo(
    () => (typeof t === 'function' ? formats.map((f) => ({ ...f, etiqueta: etiquetaDeForma(f, t) })) : formats),
    [formats, t],
  );
  const titolVist = titol ?? text(TEXTOS_ENQUADRAMENT.titol);
  const descripcioVista = descripcio ?? text(TEXTOS_ENQUADRAMENT.descripcio);
  const arrelRef = useRef(null);
  const canvasRef = useRef(null);
  const retornRef = useRef(null);
  const muntatRef = useRef(false);
  const formatsRef = useRef(formats);
  formatsRef.current = formats;
  const noDestructiuRef = useRef(noDestructiu);
  noDestructiuRef.current = noDestructiu;
  const [imatge, setImatge] = useState(null);
  const [errorCarrega, setErrorCarrega] = useState(null);
  /* { text, intent }: cada intent fallit és un valor nou, encara que el text
     es repetisca i React ajunte el «null» de l'intent amb l'error. */
  const [errorDesat, setErrorDesat] = useState(null);
  const intentsFallits = useRef(0);
  const [desant, setDesant] = useState(false);
  const [estat, setEstat] = useState(() => estatInicial(formatInicial));
  /* L'estat viu per als pointer events: dos moviments seguits abans d'un
     render parteixen del darrer valor, no del pintat. */
  const estatRef = useRef(estat);
  const punters = useRef(new Map());
  const pessicInici = useRef(null);
  const [geo, setGeo] = useState(GEO_INICIAL);
  /* La font de la darrera lectura d'EXIF: es llig una vegada per foto, i una
     lectura d'una foto anterior que arriba tard no trepitja la nova. */
  const lecturaGeo = useRef(null);
  const fontRef = useRef(font);
  fontRef.current = font;
  /* Onada 4, T3a · El que fa el teclat sobre el visor s'anuncia (els
     lliscadors ja s'anuncien sols). */
  const [anunci, setAnunci] = useState('');
  /* Gauntlet 261016 (Bloc 1.2) · El que s'ha llegit de l'EXIF de la foto si
     n'hi ha per a la casella (teExifPerConservar: publicable o que no es pot
     conservar), o null; i la tria, marcada de sèrie. La lectura és del
     fitxer ORIGINAL, una per foto. */
  const [exifOriginal, setExifOriginal] = useState(null);
  const [conservaExif, setConservaExif] = useState(true);
  const lecturaExif = useRef(null);
  /* P1-64 · La precisió triada (de sèrie, l'exacta: decisió 8) i, en una foto
     d'identitat, si l'original portava una ubicació que s'eliminarà. */
  const [precisioExif, setPrecisioExif] = useState(PRECISIO_PER_DEFECTE_PUBLICACIO);
  const [gpsEliminat, setGpsEliminat] = useState(false);
  /* Gauntlet 261016 (Bloc B, P2) · El blob que el carregador ha obert per a
     una adreça ({ font, blob }): d'ell es llig l'EXIF quan la font no és un
     File. D'on es llig: el File mateix, o el blob d'esta adreça (mai el d'una
     adreça anterior). */
  const [blobCarregat, setBlobCarregat] = useState(null);
  const origenExif = esFitxer(font) ? font : (blobCarregat?.font === font && esFitxer(blobCarregat.blob) ? blobCarregat.blob : null);
  /* Pla 2000 (punt 2) · «Canviar foto»: el selector de dins del diàleg, la
     foto que s'hi havia obert (una de nova torna a començar centrada i sense
     zoom) i el pare viu en un ref (no reengega cap càrrega). */
  const entradaFotoRef = useRef(null);
  const fontObertaRef = useRef(font);
  const canviaFotoRef = useRef(onCanviaFoto);
  canviaFotoRef.current = onCanviaFoto;
  const ambCanviaFoto = senzill && typeof onCanviaFoto === 'function';
  const ambLleva = senzill && typeof onLleva === 'function';

  const actualitza = useCallback((nou) => {
    estatRef.current = nou;
    setEstat(nou);
  }, []);

  /* El focus torna a qui l'ha obert. Es captura en layout (abans que Dialeg
     faça showModal) i es torna en la neteja passiva, quan el <dialog> ja no
     és al DOM: amb el modal obert, la resta del document és inert. Si qui
     l'ha obert ja no hi és (s'ha desat i la capçalera ha canviat), el pare
     decidix on va el focus. StrictMode (App.jsx) repetix els efectes en
     desenvolupament: es captura UNA vegada (la segona, el focus ja és dins del
     diàleg) i només es torna en el desmuntatge real, amb el node fora del DOM. */
  useLayoutEffect(() => {
    muntatRef.current = true;
    if (!retornRef.current) {
      const arrel = arrelRef.current?.getRootNode?.();
      retornRef.current = arrel?.activeElement || document.activeElement;
    }
    return () => { muntatRef.current = false; };
  }, []);
  useEffect(() => {
    const node = arrelRef.current;
    return () => {
      if (node?.isConnected) return;
      const element = retornRef.current;
      if (element?.isConnected && typeof element.focus === 'function') element.focus();
    };
  }, []);

  useEffect(() => {
    if (!obert || !font) return undefined;
    const controlador = new AbortController();
    let viu = true;
    let carregada = null;
    setImatge(null);
    setBlobCarregat(null);
    setErrorCarrega(null);
    setErrorDesat(null);
    setGeo(GEO_INICIAL);
    lecturaGeo.current = null;
    /* Pla 2000 (punt 2) · Amb «Canviar foto», una foto nova en el mateix
       diàleg comença centrada i sense zoom: l'enquadrament d'abans era d'una
       altra foto. Sense la prop, com sempre (el zoom d'abans, dins dels
       límits nous). */
    if (canviaFotoRef.current && fontObertaRef.current !== font) actualitza(estatInicial(estatRef.current.format));
    fontObertaRef.current = font;
    /* P0-80 · Una adreça amb el seu marc (#sdp-crop=) s'obri en eixe marc, si
       la forma és d'esta finestra: la foto sencera, i el marc on era. */
    const delFragment = noDestructiuRef.current && typeof font === 'string' ? separaEnquadrament(font).enquadrament : null;
    if (delFragment && formatsRef.current.some((f) => f.valor === delFragment.format)) actualitza({ ...delFragment });
    // Onada 4, T3a · Una foto massa pesada no es descodifica: l'avís arriba abans.
    if (esFitxer(font) && comprovaPes(font)) {
      setErrorCarrega(missatgeLimit(comprovaPes(font), tRef.current));
      return () => { viu = false; };
    }
    (async () => {
      try {
        /* P0-80 · El fragment no és de la foto: es carrega la base (una adreça sense fragment, tal qual). */
        const img = await carregador(typeof font === 'string' ? llevaEnquadrament(font) : font, { signal: controlador.signal });
        if (!viu) { img?.allibera?.(); return; }
        // Siga quin siga el carregador, una foto de massa píxels no s'enquadra.
        if (comprovaDimensions(img.amplada, img.alcada)) {
          img.allibera?.();
          setErrorCarrega(missatgeLimit('pixels', tRef.current));
          return;
        }
        carregada = img;
        actualitza(limita(estatRef.current, img.amplada, img.alcada, formatsRef.current));
        // Bloc B · En el mateix render que la imatge: la lectura de l'EXIF (en layout) ja hi és quan «Desar» s'activa.
        setBlobCarregat(esFitxer(font) ? null : { font, blob: img.blob ?? null });
        setImatge(img);
      } catch (err) {
        if (viu && err?.name !== 'AbortError') setErrorCarrega(missatgeCarrega(err, font, tRef.current));
      }
    })();
    return () => {
      viu = false;
      controlador.abort();
      carregada?.allibera?.();
    };
  }, [obert, font, carregador, actualitza]);

  /* Gauntlet 261016 (Bloc 1.2) · Cada foto nova torna a la tria de sèrie
     (conservar). Una lectura que arriba tard d'una foto anterior no pinta
     cap casella a la nova.
     Bloc B, P2 · Es llig d'origenExif: el File, o el blob que el carregador ha
     obert per a una adreça (arriba amb la imatge). En layout, i no després
     del pintat: la lectura queda registrada abans que «Desar» es puga clicar.
     P1-64 · També es llig amb avisaGpsEliminat (identitat): cap casella, només
     l'avís si hi havia una ubicació. Cada foto nova torna a l'exacta. */
  useLayoutEffect(() => {
    setExifOriginal(null);
    setConservaExif(true);
    setPrecisioExif(PRECISIO_PER_DEFECTE_PUBLICACIO);
    setGpsEliminat(false);
    lecturaExif.current = null;
    if (!obert || !(ofereixConservarExif || avisaGpsEliminat) || !origenExif) return undefined;
    let viu = true;
    const promesa = Promise.resolve().then(() => lectorExif(origenExif)).catch(() => null);
    lecturaExif.current = { font, origen: origenExif, promesa };
    promesa.then((dades) => {
      if (!viu) return;
      if (avisaGpsEliminat) {
        if (teUbicacio(dades)) setGpsEliminat(true);
      } else if (teExifPerConservar(dades)) {
        setExifOriginal(dades);
        /* R16a (troballa 3) · Amb noDestructiu, les píndoles s'obrin en la
           precisió que ja porta el fitxer (la d'una càmera és l'exacta, la de
           sèrie): la línia «Es desarà» diu el que hi ha, i tornar a desar sense
           canviar-la no torna a pujar res. Només en re-enquadrar una adreça
           desada (un text): una foto nova (un File) s'obri en l'exacta, com
           sempre (Llei del Píxel). */
        if (noDestructiuRef.current && typeof font === 'string' && teUbicacio(dades)) {
          setPrecisioExif(precisioDelFitxer(dades));
        }
      }
    });
    return () => { viu = false; };
  }, [obert, font, origenExif, ofereixConservarExif, avisaGpsEliminat, lectorExif]);

  /* En layout: el canvas es buida quan canvien els atributs de mida (canvi de
     forma) i així no hi ha cap fotograma en blanc. */
  useLayoutEffect(() => {
    if (!imatge) return;
    const rect = rectDeRetall(estat, imatge.amplada, imatge.alcada, formatsRef.current);
    dibuixant(canvasRef.current, imatge.element, rect);
  }, [imatge, estat, dibuixant]);

  /* T46 (ordre del Mestre, 260928). «Desar» és al peu fix i el cos del diàleg
     fa scroll: qui ha baixat fins als lliscadors no veuria l'avís de dalt.
     Cada intent fallit porta l'avís a la vista ('nearest': si ja es veu, no
     es mou res). La key el torna a inserir i role="alert" el torna a anunciar. */
  useEffect(() => {
    if (!errorDesat) return;
    arrelRef.current?.querySelector(':scope > [role="alert"]')?.scrollIntoView?.({ block: 'nearest' });
  }, [errorDesat]);

  /* Onada 4 (retallador senzill) · La roda del ratolí sobre el visor amplia.
     React escolta 'wheel' com a passiu (no deixa fer preventDefault): s'escolta
     ací, amb passive:false, perquè la roda no desplace el diàleg. El cos de
     l'escoltador és rodaRef, que es renova a cada render (estat i mides vius). */
  const rodaRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!senzill || !imatge || !canvas) return undefined;
    const escolta = (ev) => rodaRef.current?.(ev);
    canvas.addEventListener('wheel', escolta, { passive: false });
    return () => canvas.removeEventListener('wheel', escolta);
  }, [senzill, imatge]);

  const fallaDesat = (text) => {
    if (!muntatRef.current) return;
    intentsFallits.current += 1;
    setErrorDesat({ text, intent: intentsFallits.current });
  };

  const W = imatge?.amplada || 1;
  const H = imatge?.alcada || 1;
  const r = imatge ? proporcio(estat.format, W, H, formats) : (formats.find((f) => f.valor === estat.format)?.ratio ?? 1);
  const visor = midaVisor(r);
  const zMax = imatge ? zoomMaxim(W, H, r) : 1;
  const hiHaMarge = imatge ? marges(estat, W, H, formats) : { x: false, y: false };
  const posX = imatge ? lliscador(estat, 'x', W, H, formats) : 50;
  const posY = imatge ? lliscador(estat, 'y', W, H, formats) : 50;
  const quiet = !imatge || desant;

  /* Esc s'accepta sempre: el navegador pot tancar el <dialog> pel seu compte.
     La X, mentre desa, no: el desat continua i el pare el tanca en acabar. */
  const tanca = (motiu) => {
    if (!desant || motiu === 'esc') onTanca?.(motiu);
  };

  const canviaForma = (format) => {
    const nou = { ...estatRef.current, format };
    actualitza(imatge ? limita(nou, W, H, formats) : nou);
  };

  const centra = () => {
    const nou = estatInicial(estatRef.current.format);
    actualitza(imatge ? limita(nou, W, H, formats) : nou);
  };

  /* Poliment T46 (ordre del Mestre, 260928) · Només el botó principal
     arrossega (el dret és el menú contextual). Un moviment sense cap botó
     premut vol dir que el pointerup s'ha perdut (fora de la finestra): el
     punter s'allibera, com quan es perd la captura. */
  const onPointerDown = (e) => {
    if (quiet || e.button > 0) return;
    // Sense açò, un arrossegament amb el ratolí que ix del visor selecciona el text del diàleg.
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    punters.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (punters.current.size === 2) {
      const [a, b] = [...punters.current.values()];
      pessicInici.current = { d: distancia(a, b), zoom: estatRef.current.zoom };
    }
  };

  const onPointerMove = (e) => {
    const previ = punters.current.get(e.pointerId);
    if (!previ || quiet) return;
    if (e.buttons === 0) {
      deixaPunter(e);
      return;
    }
    const actual = { x: e.clientX, y: e.clientY };
    punters.current.set(e.pointerId, actual);
    if (punters.current.size >= 2 && pessicInici.current) {
      const [a, b] = [...punters.current.values()];
      actualitza(pessic(estatRef.current, pessicInici.current.zoom, pessicInici.current.d, distancia(a, b), W, H, formats));
      return;
    }
    const ample = e.currentTarget.getBoundingClientRect().width;
    actualitza(arrossega(estatRef.current, actual.x - previ.x, actual.y - previ.y, ample, W, H, formats));
  };

  const deixaPunter = (e) => {
    punters.current.delete(e.pointerId);
    if (punters.current.size < 2) pessicInici.current = null;
  };

  /* Onada 4, T3a (RETALLADOR §1) · Teclat sobre el visor: les fletxes mouen,
     + i − amplien, Retorn desa. Escape el gestiona el <dialog> (tanca). */
  const onTeclaVisor = (ev) => {
    if (quiet || ev.altKey || ev.ctrlKey || ev.metaKey) return;
    if (ev.key === 'Enter') {
      ev.preventDefault();
      desa();
      return;
    }
    const nou = ambTecla(estatRef.current, ev.key, W, H, formats, { gran: ev.shiftKey });
    if (!nou) return;
    ev.preventDefault();
    actualitza(nou);
    setAnunci(/^Arrow/.test(ev.key)
      ? omple(text(TEXTOS_ENQUADRAMENT.anunciPosicio), { x: lliscador(nou, 'x', W, H, formats), y: lliscador(nou, 'y', W, H, formats) })
      : omple(text(TEXTOS_ENQUADRAMENT.anunciAmpliacio), { valor: textAmpliacio(nou.zoom, t) }));
  };

  /* Onada 4 (retallador senzill) · La roda i els botons − i + fan el pas de
     l'ajudant pur (ambRoda, ambTecla): els límits són els del lliscador. */
  rodaRef.current = (ev) => {
    ev.preventDefault();
    if (quiet) return;
    const nou = ambRoda(estatRef.current, ev.deltaY, W, H, formats, { mode: ev.deltaMode });
    if (nou) actualitza(nou);
  };
  const pasZoom = (tecla) => {
    if (quiet) return;
    const nou = ambTecla(estatRef.current, tecla, W, H, formats);
    if (nou) actualitza(nou);
  };
  const potAllunyar = !quiet && estat.zoom > 1 + EPSILON_ZOOM;
  const potApropar = !quiet && estat.zoom < zMax - EPSILON_ZOOM;

  /* Pla 2000 (punt 2) · La foto triada amb «Canviar foto». La decidix el
     pare: si la rebutja (no és PNG, JPEG o WebP, massa pesada, una pujada en
     curs), l'avís ix ací dins i la foto d'abans es queda; si l'accepta, canvia
     `font` i l'efecte de càrrega l'obri (i esborra els avisos). Un ref de
     funció: l'escoltador de `cancel` va amb el node. */
  const refEntradaFoto = useCallback((node) => {
    entradaFotoRef.current?.removeEventListener('cancel', paraCancel);
    entradaFotoRef.current = node;
    node?.addEventListener('cancel', paraCancel);
  }, []);
  const triaFoto = (ev) => {
    const fitxer = ev.target.files?.[0];
    ev.target.value = '';
    if (!fitxer || desant) return;
    const avis = canviaFotoRef.current?.(fitxer);
    if (typeof avis === 'string' && avis) fallaDesat(avis);
  };
  const idAjudaFoto = `${id}-foto`;
  /* Els botons de la foto i els formats, també sense imatge (una adreça que
     no s'ha pogut obrir): «Canviar foto» n'és l'eixida. */
  const accionsFoto = ambCanviaFoto || ambLleva ? (
    <div className="sdp-enquadrament__foto">
      {ambCanviaFoto ? (
        <input ref={refEntradaFoto} type="file" accept={acceptFoto} onChange={triaFoto} className="sdp-nomes-lector"
          tabIndex={-1} aria-hidden="true" data-enquadrament-foto="" />
      ) : null}
      <div className="sdp-enquadrament__foto-accions">
        {ambCanviaFoto ? (
          <Boto varietat="secundari" icona={Camera} onClick={() => entradaFotoRef.current?.click()} disabled={desant}
            aria-describedby={ajudaFoto ? idAjudaFoto : undefined}>{etiquetaCanviaFoto ?? text(TEXTOS_ENQUADRAMENT.canviaFoto)}</Boto>
        ) : null}
        {ambLleva ? (
          <Boto varietat="secundari" icona={Trash2} onClick={onLleva} disabled={desant}>
            {etiquetaLleva ?? text(TEXTOS_ENQUADRAMENT.llevaFoto)}
          </Boto>
        ) : null}
      </div>
      {ajudaFoto ? <p id={idAjudaFoto} className="sdp-camp__ajuda">{ajudaFoto}</p> : null}
    </div>
  ) : null;

  /* Gauntlet 261016 (Bloc 1.2) · La casella de Pedra Seca (la mateixa de
     «Vull geolocalitzar aquesta imatge»), només si hi ha EXIF; l'etiqueta i
     l'avís diuen el que porta (Codex, 02:26). P1-64 · Amb les píndoles de la
     precisió (CasellaExif) i, en una foto d'identitat amb GPS, l'avís en el
     seu lloc. */
  const casellaExif = exifOriginal && imatge ? (
    <CasellaExif dades={exifOriginal} conserva={conservaExif} onConserva={setConservaExif}
      precisio={precisioExif} onPrecisio={setPrecisioExif} desactivat={desant} exifTriat={exifTriat === true} />
  ) : (gpsEliminat && imatge ? <Alerta to="info">{text(TEXTOS_ENQUADRAMENT.gpsEliminat)}</Alerta> : null);

  /* Onada 4, T3a · La ubicació que es desaria ara mateix (ja arrodonida), o null. */
  const ubicacio = geo.actiu
    ? geolocalitzacio({ lat: llegixCoordenada(geo.lat), lng: llegixCoordenada(geo.lng), precisio: geo.precisio, origen: geo.origen })
    : null;
  /* Amb `sortida` o amb la geolocalització, el diàleg lliura el fitxer final:
     sempre un canvas nou, mai l'original amb el seu EXIF (ADR D4). */
  const recodifica = Boolean(sortida) || permetGeolocalitzacio;

  /* L'EXIF es llig del fitxer ORIGINAL (no del retall, que ja no en porta),
     una sola vegada per foto i només quan la persona ho demana. */
  const activaGeo = async (actiu) => {
    setGeo((g) => ({ ...g, actiu }));
    if (!actiu || lecturaGeo.current === font) return;
    const llegida = font;
    lecturaGeo.current = llegida;
    if (!esFitxer(llegida)) return;
    setGeo((g) => ({ ...g, llegint: true }));
    let dades;
    try {
      dades = await lectorMetadades(llegida);
    } catch {
      dades = senseDades();
    }
    if (!muntatRef.current || fontRef.current !== llegida) return;
    const gps = dades?.gps || null;
    setGeo((g) => ({
      ...g,
      llegint: false,
      trobada: Boolean(gps),
      dataCaptura: dades?.dataCaptura || null,
      // Si la persona ja havia escrit res mentre es llegia, no se li esborra.
      ...(gps && g.lat === '' && g.lng === '' ? { lat: String(gps.lat), lng: String(gps.lng), origen: 'exif' } : {}),
    }));
  };

  /* Corregir un camp converteix el punt en «manual»: ja no és el de l'EXIF. */
  const canviaGeo = (camp, valor) => {
    setGeo((g) => (camp === 'precisio' ? { ...g, precisio: valor } : { ...g, [camp]: valor, origen: 'manual' }));
  };

  const desa = async () => {
    if (!imatge || desant || (geo.actiu && geo.llegint)) return;
    const e = estatRef.current;
    const rect = rectDeRetall(e, W, H, formats);
    const sencera = esSencera(e, W, H, formats);
    /* Gauntlet 261016 (Bloc B) · El que la persona tenia davant en clicar: la
       casella (si s'havia pintat) i la seua tria. Una adreça sencera no té res
       a desar, llevat que haja desmarcat la casella: llavors es desa neta. */
    const casellaVista = Boolean(exifOriginal);
    const treuExif = casellaVista && !conservaExif;
    /* P1-64 · La lectura d'esta foto (el File o el blob de l'adreça), si n'hi ha. */
    const lecturaDeLaFont = () => (lecturaExif.current?.font === font ? lecturaExif.current : null);
    /* P0-80 · El marc que es desarà (null: la foto sencera) i, d'una adreça,
       si és el mateix que ja porta: llavors no hi ha res a desar. */
    const enquadrament = noDestructiu && !sencera ? enquadramentNet(e) : null;
    const senseCanvi = noDestructiu
      ? !esFitxer(font) && mateixEnquadrament(enquadrament, separaEnquadrament(font).enquadrament)
      : sencera;
    /* R16a (troballa 3) · Una precisió més grossa que la del fitxer també és
       un canvi: triar «Només el poble» sense moure el marc no tanca sense desar. */
    const baixaVista = casellaVista && conservaExif && baixaLaPrecisio(precisioExif, precisioDelFitxer(exifOriginal));
    if (senseCanvi && !esFitxer(font) && !geo.actiu && !treuExif && !baixaVista) {
      /* P1-64 · Una adreça d'identitat sencera que porta GPS no es dona per
         bona: es torna a retallar (i ix neta). Sense GPS, es tanca com sempre. */
      const lecturaAbans = avisaGpsEliminat ? lecturaDeLaFont() : null;
      if (lecturaAbans) setDesant(true);
      const llegitAbans = lecturaAbans ? await lecturaAbans.promesa : null;
      if (lecturaAbans && (!muntatRef.current || fontRef.current !== font)) return;
      if (!teUbicacio(llegitAbans)) {
        if (lecturaAbans) setDesant(false);
        onTanca?.('boto');
        return;
      }
    }
    if (geo.actiu && !ubicacio) {
      fallaDesat(errorUbicacio(t));
      return;
    }
    const metadades = { geolocalitzacio: ubicacio, dataCaptura: geo.actiu ? geo.dataCaptura : null };
    setErrorDesat(null);
    setDesant(true);
    try {
      /* Gauntlet 261016 (Bloc 1.2) · La tria de l'EXIF. Si la lectura de
         l'original encara no ha acabat, s'espera: la tria de sèrie no depén
         de qui clica més de pressa. La casella marca la tria que hi havia en
         clicar (desmarcada, la foto ix neta). Codex, 02:26 · Marcada amb un
         EXIF que no es pot conservar, no es desa: l'avís, i el diàleg obert.
         Bloc B, P3 · Si la casella no s'havia vist i la lectura porta un EXIF
         per a ella, tampoc: ix la casella (marcada de sèrie) i l'avís, i desa
         el segon clic. L'original és d'on s'ha llegit (el File o el blob). */
      const lectura = lecturaDeLaFont();
      const llegit = lectura ? await lectura.promesa : null;
      if (avisaGpsEliminat) {
        /* P1-64 · Identitat: sempre neta, sense casella ni AVIS_REVISA_EXIF; qui
           puja sap si hi havia una ubicació per a dir-ho després. */
        metadades.exif = { conservaExif: false };
        metadades.gpsEliminat = teUbicacio(llegit);
      } else if (teExifPerConservar(llegit)) {
        if (!casellaVista) {
          if (muntatRef.current && fontRef.current === font) setExifOriginal(llegit);
          fallaDesat(text(TEXTOS_ENQUADRAMENT.exifRevisa));
          return;
        }
        if (conservaExif && esNoConservable(llegit)) {
          fallaDesat(errorExifNoConservable(llegit, t));
          return;
        }
        /* P1-64 · Marcada i amb una ubicació: la precisió triada va a la pujada
           (el fitxer) i al camp, amb la data de la foto. */
        const ambUbicacio = conservaExif && teUbicacio(llegit);
        metadades.exif = conservaExif
          ? { conservaExif: true, original: lectura.origen, ...(ambUbicacio ? { precisio: precisioExif } : null) }
          : { conservaExif: false };
        if (conservaExif && !geo.actiu) {
          if (ambUbicacio && llegit.gps) {
            metadades.geolocalitzacio = geolocalitzacio({ lat: llegit.gps.lat, lng: llegit.gps.lng, precisio: precisioExif, origen: 'exif' });
          }
          if (llegit.dataCaptura) metadades.dataCaptura = llegit.dataCaptura;
        }
      }
      let fitxer = font;
      let info = { format: e.format, rect, sencera };
      if (noDestructiu) {
        /* P0-80 · Mai el retall: la foto sencera (un File nou o una foto que
           s'ha de tornar a codificar, sense l'EXIF o sense el GPS) o, d'una
           adreça que no cal tocar, la mateixa adreça amb el marc nou. */
        const rectSencer = { x: 0, y: 0, w: W, h: H };
        info = { format: e.format, rect: rectSencer, sencera: true, retall: rect, enquadrament };
        /* R16a (troballa 3) · Una adreça amb una ubicació conservada i una
           precisió més grossa que la del fitxer també: la foto sencera passa per
           la pujada, que hi arrodonix el GPS (ajustaPrecisioGps). */
        const baixaPrecisio = metadades.exif?.conservaExif === true
          && baixaLaPrecisio(metadades.exif.precisio, precisioDelFitxer(llegit));
        const calCodificar = esFitxer(font) || treuExif || geo.actiu || metadades.gpsEliminat === true || baixaPrecisio;
        if (calCodificar) {
          try {
            fitxer = await exportador(imatge.element, rectSencer, opcionsSortida(rectSencer, imatge.tipus, sortidaSencera(sortida)));
          } catch {
            fallaDesat(text(TEXTOS_ENQUADRAMENT.errorExporta));
            return;
          }
        } else {
          fitxer = ambEnquadrament(font, enquadrament);
        }
      } else if (!sencera || recodifica || !esFitxer(font)) {
        // Bloc B · Una adreça no és cap fitxer per a lliurar: sempre el retall.
        try {
          fitxer = await exportador(imatge.element, rect, opcionsSortida(rect, imatge.tipus, sortida));
        } catch {
          fallaDesat(text(TEXTOS_ENQUADRAMENT.errorExporta));
          return;
        }
      }
      await onDesa?.(fitxer, info, metadades);
    } catch (err) {
      fallaDesat(err?.message || text(TEXTOS_ENQUADRAMENT.errorExporta));
    } finally {
      if (muntatRef.current) setDesant(false);
    }
  };

  /* Onada 4 (retallador senzill, ordre del Mestre 261008) · La finestra de
     Claude: títol, ajuda, el visor, la fila de zoom i tres botons. La resta
     del cos (avisos, càrrega, teclat, arrossegament i desat) és la de T46. */
  if (senzill) {
    const caixa = ['sdp-enquadrament__visor-caixa', mascara === 'cercle' && 'sdp-enquadrament__visor-caixa--cercle']
      .filter(Boolean).join(' ');
    /* T3 (pla 261025_0045) · Amb més d'una forma (la capçalera): les píndoles i la didàctica. */
    const ambFormes = formats.length > 1;
    const triada = formatsVistos.find((f) => f.valor === estat.format) || null;
    const idDidactica = `${id}-didactica`;
    return (
      <Dialeg
        obert={obert}
        onTanca={tanca}
        titol={titolVist}
        descripcio={descripcioVista}
        mida={ambFormes ? 'm' : 's'}
        className="sdp-enquadrament__dialeg sdp-enquadrament__dialeg--senzill"
        tancaEnVel={false}
        ambTanca={false}
        accions={(
          <>
            {/* Fantasma (botó de text) amb la seua pell al peu: bloc T46 de modules.css. */}
            <Boto varietat="fantasma" className="sdp-enquadrament__restablir" onClick={centra} disabled={quiet}>
              {text(TEXTOS_ENQUADRAMENT.restablir)}
            </Boto>
            <Boto varietat="secundari" onClick={() => tanca('boto')} disabled={desant}>{text(TEXTOS_ENQUADRAMENT.cancela)}</Boto>
            <Boto varietat="primari" onClick={desa} carregant={desant} disabled={!imatge}>
              {etiquetaDesa || text(TEXTOS_ENQUADRAMENT.guardar)}
            </Boto>
          </>
        )}
      >
        {/* Cicle 3 (261030, VD) · Sense sdp-enquadrament--senzill, que no tenia
            cap regla ni el declarava el vocabulari: el mode senzill ja el diu
            el diàleg (sdp-enquadrament__dialeg--senzill). */}
        <div ref={arrelRef} className={ambFormes ? 'sdp-enquadrament sdp-enquadrament--formes' : 'sdp-enquadrament'}>
          {errorCarrega ? <Alerta to="error">{errorCarrega}</Alerta> : null}
          {errorDesat ? <Alerta key={errorDesat.intent} to="error">{errorDesat.text}</Alerta> : null}
          {!errorCarrega && !imatge ? <Carregant etiqueta={text(TEXTOS_ENQUADRAMENT.obrint)} /> : null}
          {imatge ? (
            <>
              <div className={caixa}>
                <canvas
                  ref={canvasRef}
                  className="sdp-enquadrament__visor"
                  width={visor.amplada}
                  height={visor.alcada}
                  role="img"
                  aria-label={text(TEXTOS_ENQUADRAMENT.visorRetall)}
                  tabIndex={0}
                  aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Plus - Enter"
                  onKeyDown={onTeclaVisor}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={deixaPunter}
                  onPointerCancel={deixaPunter}
                  onLostPointerCapture={deixaPunter}
                />
              </div>
              <p className="sdp-nomes-lector" aria-live="polite">{anunci}</p>
              <div className="sdp-enquadrament__zoom">
                <button type="button" className="sdp-enquadrament__pas" aria-label={text(TEXTOS_ENQUADRAMENT.allunya)}
                  title={text(TEXTOS_ENQUADRAMENT.allunya)} disabled={!potAllunyar} onClick={() => pasZoom('-')}>
                  <Minus size={20} aria-hidden="true" focusable="false" />
                </button>
                <input type="range" className="sdp-control sdp-enquadrament__lliscador" aria-label={text(TEXTOS_ENQUADRAMENT.ampliacio)}
                  min={1} max={zMax} step={0.01} value={estat.zoom} aria-valuetext={textAmpliacio(estat.zoom, t)}
                  disabled={quiet || zMax <= 1}
                  onChange={(ev) => actualitza(limita({ ...estatRef.current, zoom: Number(ev.target.value) }, W, H, formats))} />
                <button type="button" className="sdp-enquadrament__pas" aria-label={text(TEXTOS_ENQUADRAMENT.apropa)}
                  title={text(TEXTOS_ENQUADRAMENT.apropa)} disabled={!potApropar} onClick={() => pasZoom('+')}>
                  <Plus size={20} aria-hidden="true" focusable="false" />
                </button>
              </div>
              {/* Directiva del Mestre (261024, àudio 22:47; 261025, T3) · La forma, només si n'hi ha
                  més d'una (la capçalera): píndoles d'un sol toc i una línia de didàctica. */}
              {ambFormes ? (
                <fieldset className="sdp-enquadrament__formats" role="radiogroup" aria-labelledby={`${id}-forma-llegenda`}
                  aria-describedby={idDidactica} disabled={desant}>
                  <legend id={`${id}-forma-llegenda`} className="sdp-nomes-lector">{text(TEXTOS_ENQUADRAMENT.forma)}</legend>
                  <div className="sdp-enquadrament__formats-pindoles">
                    {formatsVistos.map((f) => {
                      const idForma = `${id}-forma-${f.valor}`;
                      return (
                        <div key={f.valor} className="sdp-enquadrament__format">
                          <input type="radio" id={idForma} name={`${id}-forma`} value={f.valor}
                            className="sdp-enquadrament__format-control sdp-nomes-lector" aria-label={f.etiqueta}
                            checked={estat.format === f.valor} onChange={() => canviaForma(f.valor)} />
                          <label htmlFor={idForma} className="sdp-enquadrament__format-pindola">{etiquetaCurtaDeForma(f, t)}</label>
                        </div>
                      );
                    })}
                  </div>
                </fieldset>
              ) : null}
              {ambFormes ? (
                <p id={idDidactica} className="sdp-enquadrament__didactica" aria-live="polite">{didacticaDeForma(triada, t)}</p>
              ) : null}
              {casellaExif}
            </>
          ) : null}
          {accionsFoto}
        </div>
      </Dialeg>
    );
  }

  return (
    <Dialeg
      obert={obert}
      onTanca={tanca}
      titol={titolVist}
      descripcio={descripcioVista}
      mida="g"
      className="sdp-enquadrament__dialeg"
      tancaEnVel={false}
      accions={(
        <>
          <Boto varietat="secundari" onClick={() => tanca('boto')} disabled={desant}>{text(TEXTOS_ENQUADRAMENT.cancela)}</Boto>
          {/* Secundari i no fantasma: al peu del diàleg només es restituïxen
              secundari i perill (components.css, trampa de PerfilShell.css). */}
          <Boto varietat="secundari" onClick={centra} disabled={quiet}>{text(TEXTOS_ENQUADRAMENT.centrar)}</Boto>
          <Boto varietat="primari" onClick={desa} carregant={desant} disabled={!imatge || (geo.actiu && geo.llegint)}>
            {etiquetaDesa || text(TEXTOS_ENQUADRAMENT.desa)}
          </Boto>
        </>
      )}
    >
      <div ref={arrelRef} className="sdp-enquadrament">
        {errorCarrega ? <Alerta to="error">{errorCarrega}</Alerta> : null}
        {/* Dalt de tot i no al final: el cos fa scroll i «Desar» és al peu fix. */}
        {errorDesat ? <Alerta key={errorDesat.intent} to="error">{errorDesat.text}</Alerta> : null}
        {!errorCarrega && !imatge ? <Carregant etiqueta={text(TEXTOS_ENQUADRAMENT.obrint)} /> : null}
        {/* Correcció C19 (260928) · La foto i els lliscadors han de cabre alhora:
            a ≥721px, la vista a una banda i els controls a l'altra (bloc T46 de
            modules.css); en mòbil, en columna. Els lliscadors van abans que la
            forma (també en el DOM: l'ordre del focus és el que es veu). */}
        {imatge ? (
          <div className="sdp-enquadrament__obra">
            <div className="sdp-enquadrament__vista">
              <div className="sdp-enquadrament__visor-marc">
                <canvas
                  ref={canvasRef}
                  className="sdp-enquadrament__visor"
                  width={visor.amplada}
                  height={visor.alcada}
                  role="img"
                  aria-label={text(TEXTOS_ENQUADRAMENT.visorEnquadrament)}
                  aria-describedby={`${id}-ajuda`}
                  tabIndex={0}
                  /* WAI-ARIA 1.2: el «+» separa modificadors; la tecla més és «Plus». */
                  aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Plus - Enter"
                  onKeyDown={onTeclaVisor}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={deixaPunter}
                  onPointerCancel={deixaPunter}
                  onLostPointerCapture={deixaPunter}
                />
              </div>
              <p id={`${id}-ajuda`} className="sdp-camp__ajuda">{text(TEXTOS_ENQUADRAMENT.ajudaTeclat)}</p>
              <p className="sdp-nomes-lector" aria-live="polite">{anunci}</p>
            </div>
            <div className="sdp-enquadrament__controls">
              <div className="sdp-enquadrament__lliscadors">
                <Camp etiqueta={text(TEXTOS_ENQUADRAMENT.ampliacio)} ajuda={zMax <= 1 ? text(TEXTOS_ENQUADRAMENT.massaXicoteta) : undefined}>
                  <CampText tipus="range" className="sdp-enquadrament__lliscador" min={1} max={zMax} step={0.01}
                    value={estat.zoom} aria-valuetext={textAmpliacio(estat.zoom, t)} disabled={quiet || zMax <= 1}
                    onChange={(ev) => actualitza(limita({ ...estatRef.current, zoom: Number(ev.target.value) }, W, H, formats))} />
                </Camp>
                <Camp etiqueta={text(TEXTOS_ENQUADRAMENT.posicioHoritzontal)} ajuda={hiHaMarge.x ? undefined : text(TEXTOS_ENQUADRAMENT.senseMarge)}>
                  <CampText tipus="range" className="sdp-enquadrament__lliscador" min={0} max={100} step={1}
                    value={posX} aria-valuetext={omple(text(TEXTOS_ENQUADRAMENT.valorEsquerra), { n: posX })} disabled={quiet || !hiHaMarge.x}
                    onChange={(ev) => actualitza(ambLliscador(estatRef.current, 'x', ev.target.value, W, H, formats))} />
                </Camp>
                <Camp etiqueta={text(TEXTOS_ENQUADRAMENT.posicioVertical)} ajuda={hiHaMarge.y ? undefined : text(TEXTOS_ENQUADRAMENT.senseMarge)}>
                  <CampText tipus="range" className="sdp-enquadrament__lliscador" min={0} max={100} step={1}
                    value={posY} aria-valuetext={omple(text(TEXTOS_ENQUADRAMENT.valorDalt), { n: posY })} disabled={quiet || !hiHaMarge.y}
                    onChange={(ev) => actualitza(ambLliscador(estatRef.current, 'y', ev.target.value, W, H, formats))} />
                </Camp>
              </div>
              <GrupOpcions llegenda={text(TEXTOS_ENQUADRAMENT.forma)} opcions={formatsVistos} valor={estat.format} onCanvi={canviaForma}
                disabled={desant} />
              {casellaExif}
              {permetGeolocalitzacio ? (
                <UbicacioImatge geo={geo} resultat={ubicacio} desactivat={desant} onActiva={activaGeo} onCanvi={canviaGeo} />
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </Dialeg>
  );
}

export default DialegEnquadrament;
