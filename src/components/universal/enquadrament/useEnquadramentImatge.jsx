import { useCallback, useRef, useState } from 'react';
import { DialegEnquadrament } from './DialegEnquadrament.jsx';
import { FORMATS, FORMAT_DE_LA_FONT, tipusDeSortida } from './enquadrament.js';
import { MIDA_AVATAR, MIDA_CAPCALERA, MIDA_LOGOTIP } from '../../../utils/pujadaImatge.js';

/**
 * useEnquadramentImatge — Onada 4 (retallador senzill, ordre del Mestre
 * 261008). Una sola finestra de retall, calcada de la de Claude, per a les
 * tres imatges d'una fitxa: només canvien la proporció i la màscara.
 *   · avatar (persona, agent): cercle 1:1, el vel fora del cercle, exportat
 *     a 400 × 400 exactes (MIDA_AVATAR, Gauntlet 261016, Bloc 1);
 *   · logotip (organització): quadrat 1:1, exportat a 600 × 600 exactes;
 *   · capçalera: forma lliure, la que tria la persona entre tots els FORMATS
 *     (superpanoràmic, panoràmic, apaisat, quadrat, vertical o l'original),
 *     amb el quadrat 1:1 de sèrie, exportada a 1.200 pel costat llarg
 *     (costatLlarg; l'altre costat seguix la forma): en 1:1, 1.200 × 1.200
 *     com abans; en 16:9, 1.200 × 675; en 9:16, 675 × 1.200. Directiva del
 *     Mestre (261024, àudio 22:47): «el quadrat únic és una limitació
 *     inacceptable». Deroga, només per a la capçalera, la «capçalera quadrada
 *     1.200 × 1.200 exactes» (Gauntlet 261016, Bloc 1, Llei del Quadrat; abans
 *     16:9 i 1.200 × 675, ordre 261008). PROPORCIO_CAPCALERA diu la forma de
 *     sèrie i AMPLADA_CAPCALERA, el costat llarg. L'enquadrament es continua
 *     coent dins del fitxer (principi T46): cap camp ni migració al servidor.
 *     L'avatar i el logotip no canvien (Llei del Píxel).
 * Totes: el mode senzill del diàleg, sense geolocalitzar, el fitxer SEMPRE
 * recodificat i 10 MB d'entrada, dits abans de triar la foto (AJUDA_FOTO).
 * Gauntlet 261016 (Bloc 1.2, mandat del Mestre, pla §0.1.3) · L'avatar i la
 * capçalera oferixen la casella de l'EXIF (marcada de sèrie) quan la foto en
 * porta: «Conserva la ubicació i la data de la foto» o, si només porta la
 * càmera, «Conserva les dades de la càmera de la foto» (Codex, 02:26).
 * Marcada, la compressió hi torna a posar l'EXIF publicable de l'original. Si
 * és ell el que no cap, l'avís és ERROR_PRESSUPOST_EXIF (o el de la càmera), i
 * si no es pot conservar, ERROR_EXIF_NO_CONSERVABLE (o el de la càmera): qui
 * puja els diu tal qual (esAvisDeLaFoto, utils/pujadaImatge.js). El logotip no
 * (conservaExif: false): no és cap fotografia del poble i, en Safari 16, ix en
 * PNG, que no el porta. Una `config` sense `conservaExif: false` també
 * l'oferix (el mandat és de sèrie).
 * P1-64 (pla 261028_1526 §3.1.1; Mestre 261028, decisió 7) · DEROGAT per a
 * la IDENTITAT el «de sèrie» del Bloc 1.2: l'avatar (de totes les menes) i,
 * amb { identitat: true }, qualsevol forma (la capçalera d'una persona)
 * pugen SEMPRE nets, sense casella (conservaExif: false), i el diàleg diu
 * AVIS_GPS_ELIMINAT_PERFIL només si la foto portava GPS (avisGpsEliminat:
 * true). La capçalera d'una organització o d'un agent i les fotos de
 * publicació conserven la casella. Una `config` amb `avisGpsEliminat: true`
 * fa el mateix (el T46 de l'avatar, useEnquadramentAvatar).
 *
 * CONTRACTE
 *   useEnquadramentImatge({ forma, onEnquadrat, onError, config?, identitat? })
 *   forma ('avatar' | 'logotip' | 'capcalera') · una fila de FORMES.
 *   identitat (false) · P1-64: la foto és d'identitat (configDeForma).
 *   onEnquadrat(fitxer, info, exif) → Promise: puja el File ja retallat. Si
 *     acaba bé, el diàleg es tanca; si llança, el missatge ix dins del diàleg,
 *     que continua obert (el modal tapa qualsevol toast). `exif` és la tria de
 *     la casella, a punt per a les opcions de la pujada ({ conservaExif: true,
 *     original } o { conservaExif: false }), o undefined si no n'hi ha hagut.
 *     P1-64 · En una foto d'identitat, `info.gpsEliminat` diu si l'original
 *     portava GPS (qui puja ho torna a dir: AVIS_GPS_ELIMINAT_PERFIL).
 *   onError(missatge) · la foto triada no es pot processar (validaFotoDeFitxa):
 *     no s'obri res i l'avís va fora (cap modal no el tapa).
 *   config · la configuració sencera, per a qui no és cap de les tres formes
 *     (useEnquadramentAvatar conserva així el retallador T46 de l'avatar).
 *   Torna { obri(font) → boolean, obert, tanca, dialeg }. `font` és un File o
 *   una adreça ja resolta (l'espècimen del catàleg): una adreça no es valida.
 *
 * Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 2) · Dues peces
 * opcionals; sense elles, el de sempre:
 *   extres · les props opcionals noves del diàleg (onCanviaFoto, ajudaFoto,
 *     onLleva, etiquetaLleva, etiquetaDesa: DialegEnquadrament), tal qual.
 *   canvia(font) → missatge | null (també tornat) · una foto nova en la
 *     MATEIXA finestra oberta (validada com la d'obri; una adreça no es
 *     valida): null si s'hi obri; si no, el missatge, i la finestra continua
 *     amb la d'abans. Sense finestra oberta no fa res (null).
 *   obri(font, { formatDeLaFont: true }) (correcció F3 de la revisió) · per a
 *     la imatge que ja hi ha (una adreça): el retall ix en el format de la
 *     imatge carregada (FORMAT_DE_LA_FONT), no en JPEG, i un PNG o un WebP
 *     amb transparència no torna amb fons blanc. Sense l'opció, el de sempre.
 */

/** Pes màxim de la foto que es tria per a una fitxa (el retall que ix és molt més menut). */
export const PES_MAXIM_FOTO = 10 * 1024 * 1024;
/** Els formats que s'admeten, en l'ordre que es diuen. */
export const TIPUS_FOTO = Object.freeze(['image/png', 'image/jpeg', 'image/webp']);
/** L'`accept` del selector de fitxers. */
export const ACCEPT_FOTO = TIPUS_FOTO.join(',');
/** El que es diu ABANS de triar la foto (sota el botó). */
export const AJUDA_FOTO = 'PNG, JPEG o WebP, fins a 10 MB.';
/** La línia d'ajuda de davall del títol, com a la finestra de Claude. */
export const AJUDA_RETALL = 'Arrossega o usa les fletxes per a reposicionar. Usa el lliscador o la roda per a fer zoom.';

export const ERROR_SENSE_FOTO = 'No has triat cap imatge.';
export const ERROR_TIPUS_FOTO = 'Només pots pujar fotos PNG, JPEG o WebP.';
export const ERROR_PES_FOTO = 'Esta foto ocupa més de 10 MB. Tria’n una de més lleugera.';

/* Gauntlet 261016 (Bloc 1, Llei del Quadrat) · Les mides ixen de la font
   única (utils/pujadaImatge.js), la mateixa que llig la pujada: el costat
   llarg de la capçalera (MIDA_CAPCALERA, 1.200), el costat de l'avatar
   (MIDA_AVATAR, 400) i el del logotip (MIDA_LOGOTIP, 600), que ja no són el
   mateix. */
/** La capçalera: la forma de sèrie i el costat llarg del fitxer (el costat, a la font única). */
export const PROPORCIO_CAPCALERA = Object.freeze({ valor: '1:1', ratio: 1 });
export const AMPLADA_CAPCALERA = MIDA_CAPCALERA;

const QUADRAT = Object.freeze([Object.freeze({ valor: '1:1', etiqueta: 'Quadrat (1:1)', ratio: 1 })]);

/* La taula pura de les tres formes. `exacta`: el fitxer fa exactament eixa
   mida (també si cal ampliar el retall); sense, `midaSortida` és el màxim.
   Gauntlet 261016 (Bloc 1) · L'avatar i el logotip són exactes: l'avatar
   també ix a 400 × 400 quan el retall és més menut (abans quedava a la mida
   del retall).
   Directiva del Mestre (261024, àudio 22:47) · La capçalera ja no és exacta:
   oferix tots els FORMATS i porta `costatLlarg`, el costat llarg exacte del
   fitxer (també si cal ampliar), amb l'altre costat a la proporció triada. */
/* P1-11 (integració 261024) · Les files de FORMATS porten les ajudes del
   retallador de les Notes («Si la nota ja és al Mur…»), que no escauen a una
   fitxa del Perfil: la capçalera porta les seues, amb el que fa hui la
   targeta (.sp-card-media-container 1:1, object-fit cover; Gemini G2230,
   «Doble Escala Harmònica»). Les formes, les mateixes. */
export const AJUDA_CAPCALERA_QUADRADA = 'Recomanat: la fitxa i la seua targeta ensenyen la mateixa imatge sencera.';
export const AJUDA_CAPCALERA_LLIURE = 'A la fitxa es veu sencera, amb esta forma; a les targetes es retalla en quadrat.';
const FORMATS_CAPCALERA = Object.freeze(FORMATS.map((f) => Object.freeze({
  ...f, ajuda: f.ratio === 1 ? AJUDA_CAPCALERA_QUADRADA : AJUDA_CAPCALERA_LLIURE,
})));

export const FORMES = Object.freeze({
  avatar: Object.freeze({
    format: '1:1', formats: QUADRAT, mascara: 'cercle', titol: 'Retalla la foto', midaSortida: MIDA_AVATAR,
    /* P1-64 (Mestre 261028) · L'avatar és identitat: sempre net, amb l'avís si portava GPS. */
    exacta: Object.freeze({ amplada: MIDA_AVATAR, alcada: MIDA_AVATAR }), conservaExif: false, avisGpsEliminat: true,
  }),
  logotip: Object.freeze({
    format: '1:1', formats: QUADRAT, mascara: null, titol: 'Retalla el logotip', midaSortida: MIDA_LOGOTIP,
    exacta: Object.freeze({ amplada: MIDA_LOGOTIP, alcada: MIDA_LOGOTIP }), conservaExif: false,
  }),
  capcalera: Object.freeze({
    format: PROPORCIO_CAPCALERA.valor, formats: FORMATS_CAPCALERA, mascara: null, titol: 'Retalla la capçalera',
    midaSortida: AMPLADA_CAPCALERA, costatLlarg: AMPLADA_CAPCALERA, conservaExif: true,
  }),
});

/** Una forma coneguda; una de desconeguda cau a l'avatar. */
export const formaDe = (forma) => FORMES[forma] || FORMES.avatar;

/** El costat llarg del fitxer que ix d'una forma (el que la pujada no ha de tornar a reduir). */
export function costatDeSortida(forma) {
  const f = formaDe(forma);
  // Directiva 261024 · La capçalera: el seu costat llarg (1.200), siga quina siga la forma triada.
  if (f.exacta) return Math.max(f.exacta.amplada, f.exacta.alcada);
  return f.costatLlarg || f.midaSortida;
}

/**
 * La foto triada per a una fitxa: el missatge que es diu o null si es pot
 * obrir. PNG, JPEG o WebP (el que diu AJUDA_FOTO) i fins a 10 MB.
 */
export function validaFotoDeFitxa(fitxer) {
  if (!fitxer) return ERROR_SENSE_FOTO;
  if (!TIPUS_FOTO.includes(String(fitxer.type || '').toLowerCase())) return ERROR_TIPUS_FOTO;
  if (Number(fitxer.size) > PES_MAXIM_FOTO) return ERROR_PES_FOTO;
  return null;
}

/* El tipus del fitxer que ix: el PNG conserva la transparència d'un
   logotip (també el d'un WebP); la resta, JPEG. Després, la pujada el passa
   a WebP com sempre, a la mateixa mida (una foto, en JPEG si el navegador no
   sap fer WebP: fotoDinsDelPressupost). */
const tipusDe = (font) => tipusDeSortida(typeof Blob !== 'undefined' && font instanceof Blob ? font.type : '');

/**
 * La configuració del diàleg per a una forma (la consumix el hook). P1-64 ·
 * Amb `identitat`, qualsevol forma puja neta i sense casella, amb l'avís del
 * GPS (la capçalera d'una persona). Els noms de forma no canvien: menaDeImatge
 * i MIDES (useHeroImageHandler.js) en depenen.
 */
export function configDeForma(forma, { identitat = false } = {}) {
  const f = formaDe(forma);
  const delPerfil = identitat || f.avisGpsEliminat === true;
  return {
    senzill: true,
    mascara: f.mascara,
    formatInicial: f.format,
    formats: f.formats,
    titol: f.titol,
    descripcio: AJUDA_RETALL,
    valida: validaFotoDeFitxa,
    /* Directiva 261024 · `costatLlarg` (la capçalera) passa a l'eixida quan la forma el porta. */
    sortida: (font) => ({
      ampladaMaxima: f.midaSortida, format: tipusDe(font),
      ...(f.exacta ? { exacta: f.exacta } : null), ...(f.costatLlarg ? { costatLlarg: f.costatLlarg } : null),
    }),
    conservaExif: delPerfil ? false : f.conservaExif !== false,
    avisGpsEliminat: delPerfil,
  };
}

export function useEnquadramentImatge({
  forma = 'avatar', config = null, onEnquadrat, onError, extres = null, identitat = false,
} = {}) {
  const cfg = config || configDeForma(forma, { identitat });
  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;
  /* Cada obertura és una sessió pròpia (objecte nou): un desat que acaba
     tard tanca només la seua, mai una de més nova. */
  const [sessio, setSessio] = useState(null);
  const enquadratRef = useRef(onEnquadrat);
  enquadratRef.current = onEnquadrat;
  const errorRef = useRef(onError);
  errorRef.current = onError;

  const obri = useCallback((font, { formatDeLaFont = false } = {}) => {
    const avis = typeof font === 'string' && font ? null : cfgRef.current.valida(font);
    if (avis) {
      errorRef.current?.(avis);
      return false;
    }
    setSessio(formatDeLaFont && typeof font === 'string' ? { font, formatDeLaFont: true } : { font });
    return true;
  }, []);

  const tanca = useCallback(() => setSessio(null), []);

  /* Pla 2000 (punt 2) · Una sessió nova amb la foto nova: el diàleg és el
     mateix (cap remuntatge: el focus de tornada i el modal es queden), i un
     desat que acabara tard no tancaria la de després. */
  const obertaRef = useRef(false);
  obertaRef.current = Boolean(sessio);
  const canvia = useCallback((font) => {
    if (!obertaRef.current) return null;
    const avis = typeof font === 'string' && font ? null : cfgRef.current.valida(font);
    if (avis) return avis;
    setSessio((actual) => (actual ? { font } : actual));
    return null;
  }, []);

  const dialeg = sessio ? (
    <DialegEnquadrament
      {...extres}
      font={sessio.font}
      /* IDEA-20 (revisió adversarial 261024) · La imatge que ja hi ha
         (formatDeLaFont) es re-enquadra des de la seua forma («Original») si la
         forma n'oferix més d'una (la capçalera): mai el quadrat de sèrie, que la
         tornaria a tallar. L'avatar i el logotip, només quadrats, com sempre. */
      formatInicial={sessio.formatDeLaFont && cfg.formats.some((f) => f.valor === 'original') ? 'original' : cfg.formatInicial}
      formats={cfg.formats}
      sortida={sessio.formatDeLaFont ? { ...cfg.sortida(sessio.font), format: FORMAT_DE_LA_FONT } : cfg.sortida(sessio.font)}
      permetGeolocalitzacio={false}
      senzill={cfg.senzill}
      mascara={cfg.mascara}
      titol={cfg.titol}
      descripcio={cfg.descripcio}
      ofereixConservarExif={cfg.avisGpsEliminat !== true && cfg.conservaExif !== false}
      {...(cfg.avisGpsEliminat === true ? { avisaGpsEliminat: true } : null)}
      onTanca={tanca}
      onDesa={async (fitxer, info, metadades) => {
        /* Bloc 1.2 · La tria de la casella (o res) va a qui puja, com a tercer argument.
           P1-64 · En una foto d'identitat, info diu també si s'ha eliminat el GPS. */
        const infoDesat = cfg.avisGpsEliminat === true ? { ...info, gpsEliminat: metadades?.gpsEliminat === true } : info;
        await enquadratRef.current?.(fitxer, infoDesat, metadades?.exif);
        setSessio((actual) => (actual === sessio ? null : actual));
        return true;
      }}
    />
  ) : null;

  return { obri, obert: Boolean(sessio), tanca, canvia, dialeg };
}

export default useEnquadramentImatge;
