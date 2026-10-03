/**
 * El Bar · rutesBar.js — la taula de rutes de ClosaAplicacio (disseny del
 * Bar §A.7, adaptat a /app/bar i a l'esquelet comú).
 *
 * Paths relatius a /app/bar; el primer tram és una entrada del manifest.
 * On és la persona va al CAMÍ i només porta slugs i ids opacs: la taula
 * (/taules/t5), la comanda (/caixa/c-…), el tiquet, el torn o el pas del
 * tancament. Mai imports, noms ni text lliure.
 *
 *   caixa · caixa/<comanda> · taules/<taula>   ESQUELET COMÚ: rutesCatalegColleccio
 *                                              (catàleg i comanda, i /colleccio en estret)
 *   …/cobrar · …/dividir                       la comanda i el cobrament
 *   taules · emportar · tiquets · torn · tancament · torns · carta · ajustos
 *
 * Les columnes són constants del mòdul (ClosaAplicacio no desmunta la que
 * es repetix entre dues rutes): les dades els arriben per l'estat del Bar.
 */
import { rutesCatalegColleccio } from '../comu/esquelet/index.js';
import { esIdOpac, esSlug } from '../plataforma/index.js';
import { AjustTriat, ApartatsAjustos } from './vistes/Ajustos.jsx';
import { CatalegCaixa, ComandaCaixa, EmportarInici, TiquetsOberts, TiquetsObertsSenseActiu } from './vistes/Caixa.jsx';
import {
  CategoriesCarta, EditorProducte, EscandallTriat, EscandallsCarta, GrupTriat, GrupsModificadors, IngredientTriat, IngredientsCarta,
  ProductesCarta, TriaProducte
} from './vistes/Carta.jsx';
import { CobramentCaixa, DivisioCaixa } from './vistes/Cobrament.jsx';
import { RUTA_COMANDA, esIdComanda, esPas, esSeccioAjustos } from './vistes/punt.js';
import { PasTancament, PassosTancament } from './vistes/Tancament.jsx';
import { PlanolSala } from './vistes/Taules.jsx';
import { RetornTiquet, TiquetTriat, TiquetsTorn, TriaTiquet } from './vistes/Tiquets.jsx';
import { MovimentsTorn, TornActual } from './vistes/Torn.jsx';
import { DetallTorn, HistorialTorns, TriaTorn } from './vistes/Torns.jsx';

/* Les columnes de la caixa: les mateixes a la barra, a una comanda i a una taula. */
const CAIXA = Object.freeze({ Cataleg: CatalegCaixa, Colleccio: ComandaCaixa, Esquerra: TiquetsOberts, primer: 'cataleg' });

/* Cobrar i dividir: la comanda al mig, el teclat al detall (el que es veu primer en estret). */
const cobraIDividix = (base, params) => [
  { path: `${base}/cobrar`, ...(params ? { params } : {}), Esquerra: TiquetsOberts, Mig: ComandaCaixa, Detall: CobramentCaixa, estret: 'detall' },
  { path: `${base}/dividir`, ...(params ? { params } : {}), Esquerra: TiquetsOberts, Mig: ComandaCaixa, Detall: DivisioCaixa, estret: 'detall' }
];

const P_TAULA = Object.freeze({ taula: esSlug });
const P_COMANDA = Object.freeze({ comanda: esIdComanda });

export const RUTES_BAR = Object.freeze([
  /* La caixa: /caixa (la barra) i /caixa/<comanda>, amb el panell /colleccio. */
  ...rutesCatalegColleccio({ path: 'caixa', ...CAIXA, rutaColleccio: RUTA_COMANDA }),
  ...cobraIDividix('caixa'),
  ...cobraIDividix('caixa/:comanda', P_COMANDA),
  /* Una taula: la seua comanda (o una de nova en tocar el primer producte). */
  ...rutesCatalegColleccio({ path: 'taules/:taula', params: P_TAULA, ...CAIXA }),
  ...cobraIDividix('taules/:taula', P_TAULA),
  /* Al plànol i a «per emportar» la persona no és a cap comanda: cap tiquet és l'actual (BAR-R8). */
  { path: 'taules', Mig: TiquetsObertsSenseActiu, Detall: PlanolSala, estret: 'detall' },
  { path: 'emportar', Mig: TiquetsObertsSenseActiu, Detall: EmportarInici, estret: 'detall' },
  /* Els tiquets del torn i les devolucions. */
  { path: 'tiquets', Mig: TiquetsTorn, Detall: TriaTiquet },
  { path: 'tiquets/:tiquet', params: { tiquet: esIdOpac }, Mig: TiquetsTorn, Detall: TiquetTriat, estret: 'detall' },
  { path: 'tiquets/:tiquet/retorn', params: { tiquet: esIdOpac }, Mig: TiquetsTorn, Detall: RetornTiquet, estret: 'detall' },
  /* El torn, el tancament i l'historial. */
  { path: 'torn', Mig: MovimentsTorn, Detall: TornActual, estret: 'detall' },
  { path: 'tancament', Mig: PassosTancament, Detall: PasTancament, estret: 'detall' },
  { path: 'tancament/:pas', params: { pas: esPas }, Mig: PassosTancament, Detall: PasTancament, estret: 'detall' },
  { path: 'torns', Mig: HistorialTorns, Detall: TriaTorn },
  { path: 'torns/:torn', params: { torn: esIdOpac }, Mig: HistorialTorns, Detall: DetallTorn, estret: 'detall' },
  /* La carta. */
  { path: 'productes', Mig: ProductesCarta, Detall: TriaProducte },
  { path: 'productes/:producte', params: { producte: esSlug }, Mig: ProductesCarta, Detall: EditorProducte, estret: 'detall' },
  { path: 'categories', Mig: ProductesCarta, Detall: CategoriesCarta, estret: 'detall' },
  { path: 'modificadors', Mig: GrupsModificadors, Detall: GrupTriat },
  { path: 'modificadors/:grup', params: { grup: esSlug }, Mig: GrupsModificadors, Detall: GrupTriat, estret: 'detall' },
  { path: 'escandalls', Mig: EscandallsCarta, Detall: EscandallTriat },
  { path: 'escandalls/:producte', params: { producte: esSlug }, Mig: EscandallsCarta, Detall: EscandallTriat, estret: 'detall' },
  { path: 'ingredients', Mig: IngredientsCarta, Detall: IngredientTriat },
  { path: 'ingredients/:ingredient', params: { ingredient: esSlug }, Mig: IngredientsCarta, Detall: IngredientTriat, estret: 'detall' },
  /* Els ajustos. */
  { path: 'ajustos', Mig: ApartatsAjustos, Detall: AjustTriat, estret: 'detall' },
  { path: 'ajustos/:seccio', params: { seccio: esSeccioAjustos }, Mig: ApartatsAjustos, Detall: AjustTriat, estret: 'detall' }
]);

/** Els noms dels separadors de les columnes de la closca. */
export const TITOLS_BAR = Object.freeze({ esquerra: 'Tiquets oberts', mig: 'Llista' });
