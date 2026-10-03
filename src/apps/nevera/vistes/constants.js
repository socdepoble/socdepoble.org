/**
 * La Nevera de Casa · les constants de la vista que comparteixen la taula de
 * rutes, les columnes i AppNevera. useColleccioActiva i rutesCatalegColleccio
 * s'han de cridar amb LES MATEIXES opcions (contracte de l'esquelet).
 *
 * Clàusula dels Slugs: la llista que es veu va SEMPRE al camí, a totes les
 * entrades (/app/nevera/<entrada>/<llista>[/<tram>]). Sense llista al camí,
 * AppNevera hi posa la per defecte amb replace. Els trams dels panells que
 * van al lloc de la llista són ids reservats del nucli (IDS_RESERVATS).
 */
import { esIdNevera } from '../nucli/index.js';

/** La llista activa al camí: un id que la llista blanca del nucli admet. */
const RUTA_LLISTA = Object.freeze({ parametre: 'llista', valida: esIdNevera });

/** La compra: la llista primer en el mòbil; el catàleg és el panell /llista/<id>/cataleg. */
export const COMPRA = Object.freeze({ entrada: 'llista', primer: 'colleccio', tram: 'cataleg', rutaColleccio: RUTA_LLISTA });

/** Catàleg: el catàleg primer; els articles propis són el panell /cataleg/<id>/propis. */
export const CATALEG = Object.freeze({ entrada: 'cataleg', primer: 'cataleg', tram: 'propis', rutaColleccio: RUTA_LLISTA });

/** A casa: el que hi ha a casa primer; el que cal comprar és el panell /casa/<id>/cal-comprar. */
export const CASA = Object.freeze({ entrada: 'casa', primer: 'cataleg', tram: 'cal-comprar', rutaColleccio: RUTA_LLISTA });

/** Ajustos: els de la llista i, al costat (o en /ajustos/<id>/dades), les dades i la còpia. */
export const AJUSTOS = Object.freeze({ entrada: 'ajustos', tramDades: 'dades' });

/** Temporada: la llista per temporada primer; «De temporada a…» és el panell /temporada/<id>/cataleg
    (el tram és un id que el nucli ja reserva: cap canvi d'esquema). */
export const TEMPORADA = Object.freeze({ entrada: 'temporada', primer: 'colleccio', tram: 'cataleg' });

export const ENTRADA_LLISTES = 'llistes';

/** Les entrades que porten la llista al camí: totes. */
export const ENTRADES_AMB_LLISTA = Object.freeze([
  ENTRADA_LLISTES, COMPRA.entrada, CATALEG.entrada, CASA.entrada, TEMPORADA.entrada, AJUSTOS.entrada
]);

/** El validador del paràmetre :llista de les rutes que no fa rutesCatalegColleccio. */
export const PARAMS_LLISTA = Object.freeze({ llista: esIdNevera });
