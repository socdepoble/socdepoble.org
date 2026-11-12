import { costConsum, unitatsCompatibles } from './escandall.js';
import { universalItemCataleg } from '../cataleg/universalItemCataleg.js';

/** Porta asíncrona: cap fila del CSV entra en el paquet inicial. */
let pendent;

/* Onada R15 (P1-02) · El catàleg de Mercadona viatja amb la Nevera: la mateixa porta de compilació que
   src/apps/nevera/manifest.js, com a literal exacte. El nucli exposa esta funció a tots els mòduls
   (nucliModuls.js copia la plataforma sencera), i un import() sense porta emetria el tros
   mercadona.generated a qualsevol build públic. P0-113 (ordre del Mestre, 261111): la Nevera és oberta per
   defecte i el catàleg hi entra com a tros diferit; amb VITE_SDP_APP_NEVERA=0, no hi és. */
const importaCataleg = import.meta.env.VITE_SDP_APP_NEVERA !== '0'
  ? () => import('./mercadona.generated.js')
  : null;

export function carregaMercadona() {
  if (!importaCataleg) return Promise.reject(new Error('El catàleg de Mercadona no està inclòs en este build.'));
  if (!pendent) pendent = importaCataleg().then((modul) => Object.freeze({
    productes: modul.PRODUCTES_MERCADONA, metadades: modul.METADADES_MERCADONA,
    items: Object.freeze(modul.PRODUCTES_MERCADONA.map((p) => universalItemCataleg({ id: p.id, tipus: 'producte', nom: p.nom, font: { document: modul.METADADES_MERCADONA.font, sha256: modul.METADADES_MERCADONA.sha256, fila: p.filaFont }, dades: p })))
  })).catch((error) => { pendent = null; throw error; });
  return pendent;
}

/** Cost de consum segons PreuU del full; no inferix pes per unitat ni densitats. */
export function costMercadona(producte, { quantitat, unitat, minvaPercent = 0 } = {}) {
  if (!unitatsCompatibles(unitat, producte?.unitatPreuUnitari)) return Object.freeze({ estat: 'unitats-incompatibles', costCentims: null });
  if (!Number.isSafeInteger(producte.preuUnitariCentims) || producte.preuUnitariCentims < 0) throw new TypeError('El producte no té un PreuU vàlid.');
  const cost = costConsum({ preuCents: producte.preuUnitariCentims, quantitatCompra: 1, unitatCompra: producte.unitatPreuUnitari, quantitat, unitat, minvaPercent });
  return Object.freeze({ estat: 'calculat', costCentims: cost, font: 'mer', tall: producte.tall, metode: 'PreuU-del-full' });
}

export async function cotitzaMercadona(id, quantitat) {
  const { productes } = await carregaMercadona();
  const producte = productes.find((p) => p.id === id);
  return producte ? costMercadona(producte, quantitat) : Object.freeze({ estat: 'producte-desconegut', costCentims: null });
}

function dataValida(data) {
  const parts = typeof data === 'string' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(data) : null;
  if (!parts) return false;
  const [, anyText, mesText, diaText] = parts;
  const any = Number(anyText); const mes = Number(mesText); const dia = Number(diaText);
  const dies = [31, any % 4 === 0 && (any % 100 !== 0 || any % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return any > 0 && mes >= 1 && mes <= 12 && dia >= 1 && dia <= dies[mes - 1];
}

/** Comparació amb una oferta introduïda explícitament; no inventa cap preu de la cooperativa. */
export function comparaOfertaRural(producte, { preuCentims, quantitat, unitat, proveidor, data } = {}) {
  if (!Number.isSafeInteger(preuCentims) || preuCentims < 0) throw new TypeError('Cal un preu local en cèntims.');
  if (typeof proveidor !== 'string' || !proveidor.trim() || proveidor.length > 80 || !dataValida(data)) throw new TypeError('Cal identificar el proveïdor i una data vàlida de l’oferta local.');
  if (!(quantitat > 0)) throw new TypeError('Cal una quantitat local positiva.');
  const mercadona = costMercadona(producte, { quantitat, unitat });
  return Object.freeze({
    estat: mercadona.estat, proveidor: proveidor.trim(), data,
    preuLocalCentims: preuCentims, costMercadonaCentims: mercadona.costCentims,
    diferenciaCentims: mercadona.costCentims === null ? null : preuCentims - mercadona.costCentims,
    tallMercadona: producte.tall
  });
}
