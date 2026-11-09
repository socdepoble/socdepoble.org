import { dataDeDocument, dataHoraDeBarra } from '../../components/universal/editorial.js';
import { pluginPerId } from '../plugins/registrePlugins.js';
import { DATA_DEL_SNIPPET } from '../control/destiSnippet.js';
import { PAGE_COPY } from '../text/pageContent.js';

/* P0-54 / R55 · Font documental dels sis apartats de sistema originals.
   git log -S de cada ID i comparació amb el pare: les sis definicions naixen
   en este commit i es mantenen iguals. És CREACIÓ DE LA DEFINICIÓ en Git,
   no una evidència d’hora de publicació o desplegament del lloc públic.
   Una entrada nova ha d’aportar la seua data; no hereta esta ni la de hui. */
export const CREACIO_ADMINISTRACIO_DEL_PERFIL = Object.freeze({
  instant: '2026-11-05T16:40:48+01:00',
  commit: 'c49d173c440367cfdc79be577404ceb6b8d7aa52',
  fitxer: 'src/sections/profile/perfilModel.js',
  ids: Object.freeze([
    'admin-taxonomia', 'admin-importacio', 'admin-crom',
    'admin-vistes-columnes', 'admin-nodes-fedivers', 'admin-empaquetats',
  ]),
});
const IDS_ADMINISTRACIO = new Set(CREACIO_ADMINISTRACIO_DEL_PERFIL.ids);
const PLUGIN_DE_L_APLICACIO = Object.freeze({
  gestoria: 'gestoria', rebost: 'rebost', salut: 'salut', genealogia: 'genealogia',
  'lector-rss': 'rss', tpv: 'tpv',
});

const primeraDataValida = candidats => candidats.flatMap(valor => Array.isArray(valor) ? valor : [valor])
  .find(valor => typeof valor === 'string' && dataDeDocument({ creat: valor }));

/** Només dates reals en el format original; un dia no guanya cap hora.
    Reutilitza el lector editorial i no conserva tipus executables o Date.
    Sense font vàlida, no afig camps ni fabrica l’instant del muntatge. */
export function metadadesDatesDelPerfil(entrada) {
  const creat = primeraDataValida([entrada?.creat, entrada?.created_at, entrada?.date, entrada?.data]);
  const modificat = primeraDataValida([entrada?.modificat, entrada?.updated_at]);
  const publicat = primeraDataValida([entrada?.publicat, entrada?.publish_date]);
  return {
    ...(creat ? { creat } : null),
    ...(modificat ? { modificat } : null),
    ...(publicat ? { publicat } : null),
  };
}

/** Cridada NOMÉS en declarar APLICACIONS del node. Les dates del registre
    de plugins i PAGE_COPY són les dates editorials canòniques vigents:
    no certifiquen publicació, disponibilitat del servei ni desplegament.
    Una app federada no passa per esta funció pel fet de compartir un ID. */
export function metadadesAplicacioDelNode(id) {
  const plugin = Object.hasOwn(PLUGIN_DE_L_APLICACIO, id) ? pluginPerId(PLUGIN_DE_L_APLICACIO[id]) : null;
  const creat = plugin?.data
    ?? (id === 'snippet' ? DATA_DEL_SNIPPET : undefined)
    ?? (id === 'metriques' ? PAGE_COPY.consola?.date : undefined)
    ?? (id === 'cervell' ? PAGE_COPY.cervell?.date : undefined);
  return metadadesDatesDelPerfil({ creat });
}

export function datesDAdministracio(item) {
  const fonts = metadadesDatesDelPerfil(item);
  if (!fonts.creat && IDS_ADMINISTRACIO.has(item?.id)) fonts.creat = CREACIO_ADMINISTRACIO_DEL_PERFIL.instant;
  return dataHoraDeBarra(fonts);
}

/** Resolució per dades de la fitxa, sense fallback d’ID cap al node local. */
export function datesDAplicacio(aplicacio) {
  return dataHoraDeBarra(metadadesDatesDelPerfil(aplicacio));
}
