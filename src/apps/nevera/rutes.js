/**
 * La Nevera de Casa · LA taula de rutes (una sola ClosaAplicacio per a tota
 * l'app). Les tres pantalles de catàleg i col·lecció ixen de
 * rutesCatalegColleccio, l'esquelet comú del TPV i La Compra; Llistes,
 * Temporada i Ajustos són rutes més amb les mateixes regles (mig i detall; en
 * pantalla estreta, la que diu `estret`).
 *
 *   /app/nevera/llistes/<id>                    les llistes · la llista
 *   /app/nevera/llista/<id>[/cataleg]           llistes · la llista · el catàleg
 *                                               (?categoria=, ?vista=graella|llista, ?article=)
 *   /app/nevera/cataleg/<id>[/propis]           els propis · el catàleg sencer
 *   /app/nevera/casa/<id>[/cal-comprar]         cal comprar · el que hi ha a casa
 *   /app/nevera/temporada/<id>[/cataleg]        la llista per temporada · de temporada
 *                                               (?mes=1..12, ?filtre=temporada)
 *   /app/nevera/ajustos/<id>[/dades]            la llista · les dades i la còpia
 * La llista (<id>) va al camí a totes les entrades (Clàusula dels Slugs).
 * Cada entrada també casa sense <id> (l'enllaç de la barra de l'app):
 * AppNevera hi posa la llista per defecte amb replace.
 * Tot l'estat que es veu viu a la URL; el que s'escriu, mai.
 */
import { rutesCatalegColleccio } from '../comu/esquelet/index.js';
import { ColumnaAjustosLlista, ColumnaDades } from './vistes/Ajustos.jsx';
import { ColumnaACasa, ColumnaCalComprar } from './vistes/Casa.jsx';
import { ColumnaArticlesPropis, ColumnaCatalegSencer } from './vistes/Cataleg.jsx';
import { ColumnaCatalegCompra, ColumnaLaCompra, ColumnaLlistaActiva, ColumnaLlistes } from './vistes/Compra.jsx';
import { AJUSTOS, CASA, CATALEG, COMPRA, ENTRADA_LLISTES, PARAMS_LLISTA, TEMPORADA } from './vistes/constants.js';
import { ColumnaDeTemporada, ColumnaLlistaPerTemporada } from './vistes/Temporada.jsx';

const opcions = ({ primer, tram, rutaColleccio }) => ({ primer, tram, rutaColleccio });
const LLISTES = Object.freeze({ Mig: ColumnaLlistes, Detall: ColumnaLlistaActiva, estret: 'mig' });
const AJUSTOS_MIG = Object.freeze({ Mig: ColumnaAjustosLlista, Detall: ColumnaDades, estret: 'mig' });
const AJUSTOS_DADES = Object.freeze({ Mig: ColumnaAjustosLlista, Detall: ColumnaDades, estret: 'detall' });
const TEMPORADA_MIG = Object.freeze({ Mig: ColumnaLlistaPerTemporada, Detall: ColumnaDeTemporada, estret: 'mig' });
const TEMPORADA_DETALL = Object.freeze({ Mig: ColumnaLlistaPerTemporada, Detall: ColumnaDeTemporada, estret: 'detall' });

/* Com fa rutesCatalegColleccio: primer les rutes literals, després les de :llista. */
export const RUTES = Object.freeze([
  { path: ENTRADA_LLISTES, ...LLISTES },
  { path: `${ENTRADA_LLISTES}/:llista`, params: PARAMS_LLISTA, ...LLISTES },
  ...rutesCatalegColleccio({ path: COMPRA.entrada, ...opcions(COMPRA), Esquerra: ColumnaLlistes, Colleccio: ColumnaLaCompra, Cataleg: ColumnaCatalegCompra }),
  ...rutesCatalegColleccio({ path: CATALEG.entrada, ...opcions(CATALEG), Colleccio: ColumnaArticlesPropis, Cataleg: ColumnaCatalegSencer }),
  ...rutesCatalegColleccio({ path: CASA.entrada, ...opcions(CASA), Colleccio: ColumnaCalComprar, Cataleg: ColumnaACasa }),
  { path: TEMPORADA.entrada, ...TEMPORADA_MIG },
  { path: `${TEMPORADA.entrada}/${TEMPORADA.tram}`, ...TEMPORADA_DETALL },
  { path: `${TEMPORADA.entrada}/:llista`, params: PARAMS_LLISTA, ...TEMPORADA_MIG },
  { path: `${TEMPORADA.entrada}/:llista/${TEMPORADA.tram}`, params: PARAMS_LLISTA, ...TEMPORADA_DETALL },
  { path: AJUSTOS.entrada, ...AJUSTOS_MIG },
  { path: `${AJUSTOS.entrada}/${AJUSTOS.tramDades}`, ...AJUSTOS_DADES },
  { path: `${AJUSTOS.entrada}/:llista`, params: PARAMS_LLISTA, ...AJUSTOS_MIG },
  { path: `${AJUSTOS.entrada}/:llista/${AJUSTOS.tramDades}`, params: PARAMS_LLISTA, ...AJUSTOS_DADES }
]);

/*
 * Els separadors de la closca (ClosaAplicacio titols) de cada entrada: el del
 * mig du el nom de la columna del mig («Redimensionar Cal comprar»…). Només
 * La compra té columna esquerra («Les meues llistes»); a la resta, la
 * plataforma hi posa el seu títol per defecte.
 */
const TITOLS_PER_ENTRADA = Object.freeze({
  [ENTRADA_LLISTES]: Object.freeze({ mig: 'Les meues llistes' }),
  [COMPRA.entrada]: Object.freeze({ esquerra: 'Les meues llistes', mig: 'La llista' }),
  [CATALEG.entrada]: Object.freeze({ mig: 'Articles propis' }),
  [CASA.entrada]: Object.freeze({ mig: 'Cal comprar' }),
  [TEMPORADA.entrada]: Object.freeze({ mig: 'La llista per temporada' }),
  [AJUSTOS.entrada]: Object.freeze({ mig: 'Ajustos de la llista' })
});

/** Els titols de la closca per a una entrada (els de La compra si no n'és cap). */
export function titolsDe(entrada) {
  return Object.hasOwn(TITOLS_PER_ENTRADA, entrada) ? TITOLS_PER_ENTRADA[entrada] : TITOLS_PER_ENTRADA[COMPRA.entrada];
}
