import { LIMITS_ESTAT, normalitzaEstat } from './estat.js';
import { LIMITS_PERSONALS, normalitzaPersonals } from './personals.js';
import { llegixOpml } from './opml.js';

export const ESQUEMA_COPIA_LECTOR = 'sdp.lector.copia.v1';
export const MAX_BYTES_COPIA_LECTOR = 16 * 1024 * 1024;
const errorCopia = (codi, missatge) => Object.assign(new Error(missatge), { codi });
const invalida = () => errorCopia('COPIA_INVALIDA', 'El fitxer no és una còpia vàlida del Lector.');

export function llegixCopiaLector(text) {
  if (typeof text !== 'string' || text.length > MAX_BYTES_COPIA_LECTOR
    || new TextEncoder().encode(text).byteLength > MAX_BYTES_COPIA_LECTOR) throw invalida();
  if (text.trimStart().startsWith('<')) return llegixOpml(text);
  let copia;
  try { copia = JSON.parse(text); } catch { throw invalida(); }
  if (copia?.schema !== ESQUEMA_COPIA_LECTOR || !Array.isArray(copia.personals?.fonts)
    || Object.entries(LIMITS_ESTAT).some(([clau, limit]) => !Array.isArray(copia.estat?.[clau])
      || copia.estat[clau].length > limit) || copia.personals.fonts.length > LIMITS_PERSONALS.fonts) throw invalida();
  const estat = normalitzaEstat(copia.estat);
  const personals = normalitzaPersonals(copia.personals);
  if (Object.keys(LIMITS_ESTAT).some((clau) => estat[clau].length !== copia.estat[clau].length)
    || personals.fonts.length !== copia.personals.fonts.length) throw invalida();
  return { estat, personals };
}

function unix(actuals, entrants, limit, clau = (valor) => valor) {
  const existents = new Map(actuals.map((valor) => [clau(valor), valor]));
  for (const entrant of entrants) if (!existents.has(clau(entrant))) existents.set(clau(entrant), entrant);
  if (existents.size > limit) throw errorCopia('COPIA_PLENA', 'La còpia i les dades actuals juntes superen la capacitat del Lector.');
  return [...existents.values()];
}

/** Afegix sense substituir cap font o notícia local. */
export function fusionaCopiaLector(actual, entrant) {
  const perId = (valor) => valor.id;
  return {
    estat: {
      llegits: unix(actual.estat.llegits, entrant.estat.llegits, LIMITS_ESTAT.llegits),
      despres: unix(actual.estat.despres, entrant.estat.despres, LIMITS_ESTAT.despres, perId),
      noSeguides: unix(actual.estat.noSeguides, entrant.estat.noSeguides, LIMITS_ESTAT.noSeguides)
    },
    personals: { fonts: unix(actual.personals.fonts, entrant.personals.fonts, LIMITS_PERSONALS.fonts, perId) }
  };
}
