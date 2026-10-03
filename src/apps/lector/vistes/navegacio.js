/**
 * Lector de notícies · on és la persona i els camins de l'app.
 *
 *   /app/lector/noticies                    carpetes (en estret)
 *   /app/lector/noticies/<carpeta>          les notícies d'una carpeta
 *   /app/lector/noticies/<carpeta>/fonts    les fonts d'una carpeta (en estret)
 *   /app/lector/noticies/<carpeta>/<font>   les notícies d'una font
 *   ?article=<id>                           el lector, al detall
 *   /app/lector/fonts[/colleccio]           el catàleg de fonts i les que seguixes
 * La carpeta és 'hui', 'despres' o l'id d'una categoria. Res de text lliure
 * a la URL (Clàusula dels Slugs): només ids opacs.
 */
import { CARPETES_FIXES, DESPRES, HUI } from '../nucli/index.js';
import { useVistaLector } from './context.js';

export const NOTICIES = 'noticies';
export const FONTS = 'fonts';
export const TRAM_FONTS = 'fonts';
export const TOTES = 'totes';

export const NOM_CARPETA_FIXA = Object.freeze({ [HUI]: 'Hui', [DESPRES]: 'Per a després' });

/** La carpeta i la font de la ruta, i els seus noms (null si no existixen). */
export function useSeleccio(params) {
  const { noticies } = useVistaLector();
  const carpeta = params?.carpeta || HUI;
  const fontId = params?.font || null;
  const categoria = noticies.categories.find((c) => c.id === carpeta) || null;
  const font = fontId ? noticies.fonts.find((f) => f.id === fontId) || null : null;
  const fixa = CARPETES_FIXES.includes(carpeta);
  const llest = noticies.estat === 'llest';
  return {
    carpeta,
    fontId,
    categoria,
    font,
    nomCarpeta: fixa ? NOM_CARPETA_FIXA[carpeta] : categoria?.nom || null,
    /* Mentre es carrega no se sap: es dona per bona. */
    carpetaExistix: fixa || Boolean(categoria) || !llest,
    fontExistix: !fontId || Boolean(font) || !llest
  };
}
