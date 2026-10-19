import { useCallback, useRef, useState } from 'react';
import { DialegEnquadrament } from './DialegEnquadrament.jsx';
import { FORMAT_DE_LA_FONT, tipusDeSortida } from './enquadrament.js';
import { MIDA_AVATAR, MIDA_CAPCALERA, MIDA_LOGOTIP } from '../../../utils/pujadaImatge.js';

/**
 * useEnquadramentImatge — Onada 4 (retallador senzill, ordre del Mestre
 * 261008). Una sola finestra de retall, calcada de la de Claude, per a les
 * tres imatges d'una fitxa: només canvien la proporció i la màscara.
 *   · avatar (persona, agent): cercle 1:1, el vel fora del cercle, exportat
 *     a 400 × 400 exactes (MIDA_AVATAR, Gauntlet 261016, Bloc 1);
 *   · logotip (organització): quadrat 1:1, exportat a 600 × 600 exactes;
 *   · capçalera: quadrat 1:1, exportat a 1.200 × 1.200 exactes, la mateixa
 *     imatge que la targeta (Gauntlet 261016, Bloc 1, Llei del Quadrat; abans
 *     16:9 i 1.200 × 675, ordre 261008). PROPORCIO_CAPCALERA i
 *     AMPLADA_CAPCALERA: una sola constant per a canviar-la.
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
 *
 * CONTRACTE
 *   useEnquadramentImatge({ forma, onEnquadrat, onError, config? })
 *   forma ('avatar' | 'logotip' | 'capcalera') · una fila de FORMES.
 *   onEnquadrat(fitxer, info, exif) → Promise: puja el File ja retallat. Si
 *     acaba bé, el diàleg es tanca; si llança, el missatge ix dins del diàleg,
 *     que continua obert (el modal tapa qualsevol toast). `exif` és la tria de
 *     la casella, a punt per a les opcions de la pujada ({ conservaExif: true,
 *     original } o { conservaExif: false }), o undefined si no n'hi ha hagut.
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
   única (utils/pujadaImatge.js), la mateixa que llig la pujada: l'amplada de
   la capçalera (MIDA_CAPCALERA, 1.200), el costat de l'avatar (MIDA_AVATAR,
   400) i el del logotip (MIDA_LOGOTIP, 600), que ja no són el mateix. */
/** La capçalera: proporció i amplada del fitxer. Canviar-la és canviar estes dues línies (l'amplada, a la font única). */
export const PROPORCIO_CAPCALERA = Object.freeze({ valor: '1:1', ratio: 1 });
export const AMPLADA_CAPCALERA = MIDA_CAPCALERA;

const QUADRAT = Object.freeze([Object.freeze({ valor: '1:1', etiqueta: 'Quadrat (1:1)', ratio: 1 })]);
const FORMATS_CAPCALERA = Object.freeze([
  Object.freeze({ valor: PROPORCIO_CAPCALERA.valor, etiqueta: `Capçalera (${PROPORCIO_CAPCALERA.valor})`, ratio: PROPORCIO_CAPCALERA.ratio }),
]);

/* La taula pura de les tres formes. `exacta`: el fitxer fa exactament eixa
   mida (també si cal ampliar el retall); sense, `midaSortida` és el màxim.
   Gauntlet 261016 (Bloc 1) · Les tres són exactes: l'avatar també ix a
   400 × 400 quan el retall és més menut (abans quedava a la mida del retall). */
export const FORMES = Object.freeze({
  avatar: Object.freeze({
    format: '1:1', formats: QUADRAT, mascara: 'cercle', titol: 'Retalla la foto', midaSortida: MIDA_AVATAR,
    exacta: Object.freeze({ amplada: MIDA_AVATAR, alcada: MIDA_AVATAR }), conservaExif: true,
  }),
  logotip: Object.freeze({
    format: '1:1', formats: QUADRAT, mascara: null, titol: 'Retalla el logotip', midaSortida: MIDA_LOGOTIP,
    exacta: Object.freeze({ amplada: MIDA_LOGOTIP, alcada: MIDA_LOGOTIP }), conservaExif: false,
  }),
  capcalera: Object.freeze({
    format: PROPORCIO_CAPCALERA.valor, formats: FORMATS_CAPCALERA, mascara: null, titol: 'Retalla la capçalera',
    midaSortida: AMPLADA_CAPCALERA,
    exacta: Object.freeze({ amplada: AMPLADA_CAPCALERA, alcada: Math.round(AMPLADA_CAPCALERA / PROPORCIO_CAPCALERA.ratio) }),
    conservaExif: true,
  }),
});

/** Una forma coneguda; una de desconeguda cau a l'avatar. */
export const formaDe = (forma) => FORMES[forma] || FORMES.avatar;

/** El costat llarg del fitxer que ix d'una forma (el que la pujada no ha de tornar a reduir). */
export function costatDeSortida(forma) {
  const f = formaDe(forma);
  return f.exacta ? Math.max(f.exacta.amplada, f.exacta.alcada) : f.midaSortida;
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

/** La configuració del diàleg per a una forma (la consumix el hook). */
export function configDeForma(forma) {
  const f = formaDe(forma);
  return {
    senzill: true,
    mascara: f.mascara,
    formatInicial: f.format,
    formats: f.formats,
    titol: f.titol,
    descripcio: AJUDA_RETALL,
    valida: validaFotoDeFitxa,
    sortida: (font) => ({ ampladaMaxima: f.midaSortida, format: tipusDe(font), ...(f.exacta ? { exacta: f.exacta } : null) }),
    conservaExif: f.conservaExif !== false,
  };
}

export function useEnquadramentImatge({ forma = 'avatar', config = null, onEnquadrat, onError, extres = null } = {}) {
  const cfg = config || configDeForma(forma);
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
      formatInicial={cfg.formatInicial}
      formats={cfg.formats}
      sortida={sessio.formatDeLaFont ? { ...cfg.sortida(sessio.font), format: FORMAT_DE_LA_FONT } : cfg.sortida(sessio.font)}
      permetGeolocalitzacio={false}
      senzill={cfg.senzill}
      mascara={cfg.mascara}
      titol={cfg.titol}
      descripcio={cfg.descripcio}
      ofereixConservarExif={cfg.conservaExif !== false}
      onTanca={tanca}
      onDesa={async (fitxer, info, metadades) => {
        // Bloc 1.2 · La tria de la casella (o res) va a qui puja, com a tercer argument.
        await enquadratRef.current?.(fitxer, info, metadades?.exif);
        setSessio((actual) => (actual === sessio ? null : actual));
        return true;
      }}
    />
  ) : null;

  return { obri, obert: Boolean(sessio), tanca, canvia, dialeg };
}

export default useEnquadramentImatge;
