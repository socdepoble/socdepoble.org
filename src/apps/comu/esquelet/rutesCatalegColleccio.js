/**
 * Esquelet comú de catàleg i col·lecció · les rutes per a ClosaAplicacio.
 *
 * Dues rutes amb les mateixes columnes (cap es desmunta en passar de l'una a
 * l'altra): la col·lecció al mig i el catàleg al detall, el més ample, com
 * diu el disseny del Bar (§A.7). En tauleta i escriptori es veuen de costat;
 * en pantalla estreta, la ruta diu quina es veu:
 *
 *   primer 'cataleg' (el TPV):     <path> → catàleg · <path>/colleccio → col·lecció
 *   primer 'colleccio' (La Compra): <path> → col·lecció · <path>/cataleg → catàleg
 *
 * Amb DIVERSES col·leccions (els tiquets oberts del TPV, les llistes de La
 * Compra), `rutaColleccio: { parametre, valida? }` posa l'activa al camí
 * (Clàusula dels Slugs) i afig dues rutes més, darrere de les literals:
 *
 *   <path>/:<parametre>          la col·lecció <id> (p. ex. /caixa/taula-3)
 *   <path>/:<parametre>/<tram>   el seu panell en pantalla estreta
 *
 * `valida` és per defecte esIdOpac; el tram del panell mai no és cap
 * col·lecció (/caixa/colleccio és el panell). L'app llig l'activa amb
 * useColleccioActiva; la columna de col·leccions la marca sola.
 *
 *   const RUTES = [
 *     ...rutesCatalegColleccio({ path: 'caixa', Cataleg: Productes, Colleccio: Comanda,
 *       Esquerra: Tiquets, rutaColleccio: { parametre: 'tiquet' } }),
 *     { path: 'taules', Mig: Taules, Detall: Taula }
 *   ];
 *
 * El primer tram de `path` ha de ser una entrada del manifest, `tram` un slug
 * i `parametre` un nom de paràmetre (minúscules i xifres): validaTaulaDeClosa
 * ho comprova i una taula dolenta no obri l'app.
 */
import { useLocation } from '../../../app/contexts/RouterContext';
import { coincidixRuta, esIdOpac } from '../../plataforma/index.js';
import { primerDe, tramDe } from './vistes.js';

export function rutesCatalegColleccio({ path, params, Cataleg, Colleccio, Esquerra, primer, tram, rutaColleccio } = {}) {
  const primerNet = primerDe(primer);
  const tramNet = tramDe(primerNet, tram);
  const catalegPrimer = primerNet === 'cataleg';
  const columnes = (validadors) => ({
    ...(validadors ? { params: validadors } : {}),
    ...(Esquerra ? { Esquerra } : {}),
    Mig: Colleccio,
    Detall: Cataleg
  });
  const parell = (base, validadors) => [
    { path: base, ...columnes(validadors), estret: catalegPrimer ? 'detall' : 'mig' },
    { path: `${base}/${tramNet}`, ...columnes(validadors), estret: catalegPrimer ? 'mig' : 'detall' }
  ];
  const rutes = parell(path, params);
  if (!rutaColleccio) return rutes;
  /* Un paràmetre que no és cap nom deixa un tram buit: la validació el rebutja. */
  const nom = typeof rutaColleccio.parametre === 'string' ? rutaColleccio.parametre : '';
  const valida = typeof rutaColleccio.valida === 'function' ? rutaColleccio.valida : esIdOpac;
  const delaColleccio = (valor) => valor !== tramNet && valida(valor) === true;
  return [...rutes, ...parell(`${path}/:${nom}`, { ...params, [nom]: delaColleccio })];
}

const CAP = () => null;

/**
 * L'id de la col·lecció activa segons el camí (rutaColleccio), o null si la
 * URL no en porta cap. Per a l'app que munta EsqueletCatalegColleccio o la
 * seua taula: amb les mateixes opcions que les rutes, llig el mateix camí.
 */
export function useColleccioActiva({ entrada, params, primer, tram, rutaColleccio } = {}) {
  const { pathname } = useLocation();
  const nom = rutaColleccio?.parametre;
  if (typeof nom !== 'string' || typeof entrada !== 'string') return null;
  const rutes = rutesCatalegColleccio({ path: entrada, params, primer, tram, rutaColleccio, Cataleg: CAP, Colleccio: CAP });
  /* El camí dins de l'app: /app/<id>/<resta>. */
  const trams = String(pathname || '').split('/');
  const resta = trams[1] === 'app' && trams[2] ? trams.slice(3).join('/') : '';
  return coincidixRuta(rutes, resta)?.params[nom] ?? null;
}
