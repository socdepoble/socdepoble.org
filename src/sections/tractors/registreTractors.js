/**
 * registreTractors.js — el catàleg de tractors que veu la porta d'aprovació.
 *
 * Cada tractor porta el text exacte de la seua fitxa i de cada font declarada,
 * tal com el servix Vite (?raw), perquè el Mestre llija el mateix que es
 * resumix. Una font absent no trenca res: el tractor queda «incomplet», amb
 * la llista del que falta, i no es pot aprovar ni executar.
 *
 * Només per a Vite (import.meta.glob és de compilació): en Node, l'empremta
 * es calcula llegint els fitxers del disc amb calculaEmpremta del nucli.
 */
import { TRACTORS_GESTORIA } from '../gestoria/tractors.js';
import { calculaEmpremta, empremtaCurta } from './nucli/empremta.js';
import TEXT_DEL_REGISTRE from './registreTractors.js?raw';

/* On viu este mòdul, des de l'arrel del repositori: hi pengen les claus relatives del glob. */
export const BASE_REGISTRE = 'src/sections/tractors';

/* Tot el codi de producció dels dos carrils, JSX inclòs: la UI que aplica les
   aprovacions i la porta sencera també poden ser fonts d'un manifest. Les
   proves i el suport de proves no hi entren mai. El glob de Vite no torna
   mai el fitxer que el crida: el text d'este mòdul entra a part (?raw). */
const FITXERS = {
  ...import.meta.glob(
    ['../gestoria/**/*.{js,jsx,md}', '../tractors/**/*.{js,jsx}', '!**/*.test.*', '!**/__fixtures__/**'],
    { query: '?raw', import: 'default', eager: true }
  ),
  './registreTractors.js': TEXT_DEL_REGISTRE
};

function normalitza(trossos) {
  const pila = [];
  for (const tros of trossos) {
    if (tros === '' || tros === '.') continue;
    if (tros === '..') {
      if (!pila.length) return null;
      pila.pop();
    } else {
      pila.push(tros);
    }
  }
  return pila.length ? pila.join('/') : null;
}

/* Clau del glob («./nucli/x.js», «../gestoria/x.md» o «/src/...») → ruta des
   de l'arrel del repositori, com les declaren els manifests. null si no n'és cap. */
export function rutaDesDeArrel(clau, base = BASE_REGISTRE) {
  if (typeof clau !== 'string' || !clau || clau.includes('\\')) return null;
  if (clau.startsWith('/')) return normalitza(clau.slice(1).split('/'));
  if (!clau.startsWith('./') && !clau.startsWith('../')) return null;
  return normalitza([...base.split('/'), ...clau.split('/')]);
}

export function textosPerRuta(fitxers, base = BASE_REGISTRE) {
  const textos = new Map();
  for (const [clau, contingut] of Object.entries(fitxers ?? {})) {
    const ruta = rutaDesDeArrel(clau, base);
    if (ruta && typeof contingut === 'string') textos.set(ruta, contingut);
  }
  return textos;
}

/* fontsAbsents també inclou la fitxa si falta: és part del que s'aprova. */
export function construixTractor(manifest, textos) {
  const fonts = [];
  const fontsAbsents = [];
  const fitxa = textos.get(manifest.fitxa) ?? null;
  if (fitxa === null) fontsAbsents.push(manifest.fitxa);
  for (const ruta of manifest.fonts) {
    if (textos.has(ruta)) fonts.push(Object.freeze({ ruta, contingut: textos.get(ruta) }));
    else fontsAbsents.push(ruta);
  }
  return Object.freeze({
    id: manifest.id,
    manifest,
    fitxa,
    fonts: Object.freeze(fonts),
    fontsAbsents: Object.freeze(fontsAbsents)
  });
}

export function catalegTractors(manifests, fitxers, base = BASE_REGISTRE) {
  const textos = textosPerRuta(fitxers, base);
  return Object.freeze(manifests.map((manifest) => construixTractor(manifest, textos)));
}

export const TRACTORS = catalegTractors(TRACTORS_GESTORIA, FITXERS);

/* Les rutes que el glob pot servir com a font: el que un manifest pot declarar. */
export const RUTES_DEL_CATALEG = Object.freeze([...textosPerRuta(FITXERS).keys()].sort());

const missatgeDe = (error) => error?.message ?? String(error);

/* { id, estat: 'ok' | 'incomplet' | 'error', empremta, curta, fontsAbsents, motiu }.
   No llança mai: una versió que no es pot resumir no es pot aprovar, i prou. */
export async function empremtaDe(tractor, subtle) {
  const resultat = (estat, camps = {}) => ({
    id: tractor.id, estat, empremta: null, curta: null, fontsAbsents: [], motiu: '', ...camps
  });
  const incomplet = (absents) => resultat('incomplet', {
    fontsAbsents: [...absents],
    motiu: `Falten ${absents.length === 1 ? 'un fitxer declarat' : `${absents.length} fitxers declarats`}: no es pot calcular l'empremta i el tractor no s'executa.`
  });
  if (tractor.fontsAbsents.length) return incomplet(tractor.fontsAbsents);
  try {
    const empremta = await calculaEmpremta({ manifest: tractor.manifest, fitxa: tractor.fitxa, fonts: tractor.fonts }, subtle);
    return resultat('ok', { empremta, curta: empremtaCurta(empremta) });
  } catch (error) {
    if (error?.codi === 'EMPREMTA_INCOMPLETA') return incomplet(Array.isArray(error.detalls) ? error.detalls : []);
    return resultat('error', { motiu: `No s'ha pogut calcular l'empremta: ${missatgeDe(error)}` });
  }
}

export function empremtesDe(tractors, subtle) {
  return Promise.all(tractors.map((tractor) => empremtaDe(tractor, subtle)));
}

export function empremtesDelsTractors(subtle) {
  return empremtesDe(TRACTORS, subtle);
}
