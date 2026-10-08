import { useCallback, useRef, useState } from 'react';
import { DialegEnquadrament } from './DialegEnquadrament.jsx';
import { tipusDeSortida } from './enquadrament.js';

/**
 * useEnquadramentImatge — Onada 4 (retallador senzill, ordre del Mestre
 * 261008). Una sola finestra de retall, calcada de la de Claude, per a les
 * tres imatges d'una fitxa: només canvien la proporció i la màscara.
 *   · avatar (persona, agent): cercle 1:1, el vel fora del cercle;
 *   · logotip (organització): quadrat 1:1, exportat a 600 × 600 exactes;
 *   · capçalera: rectangle 16:9, exportat a 1.200 × 675 (PROPORCIO_CAPCALERA
 *     i AMPLADA_CAPCALERA: una sola constant per a canviar-la).
 * Totes: el mode senzill del diàleg, sense geolocalitzar, el fitxer SEMPRE
 * recodificat (cap EXIF de l'original, ADR D4) i 10 MB d'entrada, dits
 * abans de triar la foto (AJUDA_FOTO).
 *
 * CONTRACTE
 *   useEnquadramentImatge({ forma, onEnquadrat, onError, config? })
 *   forma ('avatar' | 'logotip' | 'capcalera') · una fila de FORMES.
 *   onEnquadrat(fitxer, info) → Promise: puja el File ja retallat. Si acaba
 *     bé, el diàleg es tanca; si llança, el missatge ix dins del diàleg, que
 *     continua obert (el modal tapa qualsevol toast).
 *   onError(missatge) · la foto triada no es pot processar (validaFotoDeFitxa):
 *     no s'obri res i l'avís va fora (cap modal no el tapa).
 *   config · la configuració sencera, per a qui no és cap de les tres formes
 *     (useEnquadramentAvatar conserva així el retallador T46 de l'avatar).
 *   Torna { obri(font) → boolean, obert, tanca, dialeg }. `font` és un File o
 *   una adreça ja resolta (l'espècimen del catàleg): una adreça no es valida.
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

/** La capçalera: proporció i amplada del fitxer. Canviar-la és canviar estes dues línies. */
export const PROPORCIO_CAPCALERA = Object.freeze({ valor: '16:9', ratio: 16 / 9 });
export const AMPLADA_CAPCALERA = 1200;
/** El costat del logotip i de l'avatar. */
export const MIDA_QUADRADA = 600;

const QUADRAT = Object.freeze([Object.freeze({ valor: '1:1', etiqueta: 'Quadrat (1:1)', ratio: 1 })]);
const RECTANGLE_CAPCALERA = Object.freeze([
  Object.freeze({ valor: PROPORCIO_CAPCALERA.valor, etiqueta: `Capçalera (${PROPORCIO_CAPCALERA.valor})`, ratio: PROPORCIO_CAPCALERA.ratio }),
]);

/* La taula pura de les tres formes. `exacta`: el fitxer fa exactament eixa
   mida (també si cal ampliar el retall); sense, `midaSortida` és el màxim. */
export const FORMES = Object.freeze({
  avatar: Object.freeze({
    format: '1:1', formats: QUADRAT, mascara: 'cercle', titol: 'Retalla la foto', midaSortida: MIDA_QUADRADA, exacta: null,
  }),
  logotip: Object.freeze({
    format: '1:1', formats: QUADRAT, mascara: null, titol: 'Retalla el logotip', midaSortida: MIDA_QUADRADA,
    exacta: Object.freeze({ amplada: MIDA_QUADRADA, alcada: MIDA_QUADRADA }),
  }),
  capcalera: Object.freeze({
    format: PROPORCIO_CAPCALERA.valor, formats: RECTANGLE_CAPCALERA, mascara: null, titol: 'Retalla la capçalera',
    midaSortida: AMPLADA_CAPCALERA,
    exacta: Object.freeze({ amplada: AMPLADA_CAPCALERA, alcada: Math.round(AMPLADA_CAPCALERA / PROPORCIO_CAPCALERA.ratio) }),
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
   a WebP com sempre, a la mateixa mida. */
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
  };
}

export function useEnquadramentImatge({ forma = 'avatar', config = null, onEnquadrat, onError } = {}) {
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

  const obri = useCallback((font) => {
    const avis = typeof font === 'string' && font ? null : cfgRef.current.valida(font);
    if (avis) {
      errorRef.current?.(avis);
      return false;
    }
    setSessio({ font });
    return true;
  }, []);

  const tanca = useCallback(() => setSessio(null), []);

  const dialeg = sessio ? (
    <DialegEnquadrament
      font={sessio.font}
      formatInicial={cfg.formatInicial}
      formats={cfg.formats}
      sortida={cfg.sortida(sessio.font)}
      permetGeolocalitzacio={false}
      senzill={cfg.senzill}
      mascara={cfg.mascara}
      titol={cfg.titol}
      descripcio={cfg.descripcio}
      onTanca={tanca}
      onDesa={async (fitxer, info) => {
        await enquadratRef.current?.(fitxer, info);
        setSessio((actual) => (actual === sessio ? null : actual));
        return true;
      }}
    />
  ) : null;

  return { obri, obert: Boolean(sessio), tanca, dialeg };
}

export default useEnquadramentImatge;
