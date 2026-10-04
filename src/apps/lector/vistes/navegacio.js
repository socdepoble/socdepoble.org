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
import { ENTITAT_PROJECTE, autoriaDe } from '../../plataforma/index.js';
import { CARPETES_FIXES, DESPRES, HUI, llocDe } from '../nucli/index.js';
import { useVistaLector } from './context.js';

export const NOTICIES = 'noticies';
export const FONTS = 'fonts';
export const TRAM_FONTS = 'fonts';
export const TOTES = 'totes';

export const NOM_CARPETA_FIXA = Object.freeze({ [HUI]: 'Hui', [DESPRES]: 'Per a després' });

/* Ordre del Mestre, 261004 (integració final, arreglo 6) · L'anatomia de les targetes de
   navegació (NavTargetes, comunes.jsx), amb dades reals:
     · ENTRADETA_CARPETA_FIXA: què és cada carpeta de l'app, el que en diu el nucli (HUI, la
       finestra de 24 hores de les fonts que seguixes; DESPRES, les desades, que s'hi lligen encara
       que la font ja no les servisca);
     · textFontsSeguides(n): quantes fonts hi seguix la persona, el nombre real;
     · autoriaDeLApp(): la boina de les carpetes, que són de l'app: l'entitat Sóc de Poble,
       resolta per identificador a la plataforma (regla del Mestre per a les targetes de sistema);
     · autoriaDeFont(font) i entradetaDeFont(font): la font signa la seua targeta (sense enllaç:
       la targeta sencera ja porta a les seues notícies) i la descriu ella o el seu lloc web. */
export const ENTRADETA_CARPETA_FIXA = Object.freeze({
  [HUI]: 'Les notícies de les últimes 24 hores de les fonts que seguixes',
  [DESPRES]: 'Les notícies que has desat, encara que la font ja no les servisca'
});

export const textFontsSeguides = (n) => {
  if (!Number.isSafeInteger(n) || n <= 0) return 'Cap font que seguixes';
  return `${n} ${n === 1 ? 'font' : 'fonts'} que seguixes`;
};

export const autoriaDeLApp = () => autoriaDe(ENTITAT_PROJECTE) || undefined;

export const autoriaDeFont = (font) => ({ nom: font.nom, avatar: font.imatge || undefined });

export const entradetaDeFont = (font) => font.descripcio || llocDe(font.lloc) || undefined;

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
