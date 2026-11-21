/**
 * Model pur de projecció i camins per a TerritoriDelPoble (R32.24).
 */
import {
  DEMARCACIONS,
  comarcaDelPoble,
  provinciaDelPoble,
  rutaTerritorial,
} from './territoriDelPoble.js';

export const RUTA_XARXA_POBLES = '/pobles';

export const poblesArrelDeComarca = (pobles = []) => (
  pobles.filter((poble) => !poble.parent_poble_id)
);

export const fillsDirectesDePoble = (pobles = [], idPare) => (
  pobles.filter((fill) => fill.parent_poble_id === idPare)
);

export const titolVisiblePoble = (poble) => poble?.title || poble?.name || '';

export const rutaFitxaPoble = (idPoble) => `/pobles/${encodeURIComponent(idPoble)}`;

export function dadesCamiTerritorial(poble) {
  const provincia = DEMARCACIONS.find((item) => item.id === provinciaDelPoble(poble)) || null;
  return {
    provincia,
    rutaProvincia: provincia ? rutaTerritorial(provincia.id) : null,
    rutaComarca: poble?.comarca ? rutaTerritorial(provincia?.id, comarcaDelPoble(poble)) : null,
    rutaPare: poble?.parent_poble_id ? rutaFitxaPoble(poble.parent_poble_id) : null,
    titolActual: titolVisiblePoble(poble),
  };
}
