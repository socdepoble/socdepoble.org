/**
 * El Bar · nucli/tiquet.js — tiquets tancats i devolucions (§A.3-§A.6, flux 5).
 *
 * Un tiquet tancat no s'edita ni s'esborra (invariant 2). Una correcció és un
 * tiquet de DEVOLUCIÓ enllaçat (`tiquetOrigenId`), amb motiu obligatori, que
 * entra al tancament del torn on es fa. Imports en negatiu només ací
 * (invariant 1). Cap tiquet és una factura: la nota diu «no és factura».
 *
 * Línia de devolució: { id, liniaOrigenId, producteId, varianteId, categoriaId,
 * nomCongelat, varianteNomCongelat?, ivaPercent, costUnitariCents?, quantitat,
 * importCents (el que es torna, positiu), estat: 'marxada' }.
 */
import { aliesNet, congela, errorBar, esId, esMoment, mitjaAmunt, suma, textNet } from './comu.js';
import { METODES } from './cobrament.js';
import { desglossaIva } from './iva.js';
import { compta, totalLinia } from './linia.js';

export { desglossaIva } from './iva.js';

const exigeix = (condicio, codi, missatge) => {
  if (!condicio) throw errorBar(codi, missatge);
};

/** El signe d'un tiquet: +1 venda, −1 devolució. */
export const signeDe = (tiquet) => (tiquet?.tipus === 'devolucio' ? -1 : 1);

/** L'import d'una línia de tiquet amb el signe del tiquet (0 si està anul·lada). */
export function importLiniaTiquet(tiquet, linia) {
  return signeDe(tiquet) * totalLinia(linia);
}

/** Unitats ja retornades de cada línia d'un tiquet de venda: Map(liniaId → { quantitat, importCents }). */
export function retornatPerLinia(tiquetId, devolucions) {
  const mapa = new Map();
  for (const devolucio of devolucions || []) {
    if (devolucio.tipus !== 'devolucio' || devolucio.tiquetOrigenId !== tiquetId) continue;
    for (const linia of devolucio.linies) {
      const actual = mapa.get(linia.liniaOrigenId) || { quantitat: 0, importCents: 0 };
      mapa.set(linia.liniaOrigenId, { quantitat: actual.quantitat + linia.quantitat, importCents: actual.importCents + linia.importCents });
    }
  }
  return mapa;
}

/**
 * Crea un tiquet de devolució congelat.
 *   seleccio [{ liniaId, quantitat }] · motiu (obligatori) · metode · id · ara ·
 *   numero (del torn on es fa) · tornId · per · devolucionsPrevies (les ja fetes d'este tiquet)
 * No es pot tornar més del que es va vendre (comptant les devolucions prèvies).
 * L'import de cada línia és proporcional al seu total (amb descomptes i
 * convidades); l'última unitat torna el que falta, perquè la suma quadre.
 */
export function creaDevolucio(tiquet, seleccio, {
  motiu, metode, id, ara, numero, tornId, per, devolucionsPrevies = []
} = {}) {
  exigeix(tiquet && tiquet.tipus === 'venda' && tiquet.estat === 'tancada', 'TIQUET', 'Només es pot retornar d’un tiquet de venda tancat.');
  const motiuNet = textNet(motiu, 80);
  exigeix(motiuNet, 'SENSE_MOTIU', 'Una devolució necessita el motiu.');
  exigeix(METODES.includes(metode), 'METODE', 'El mètode és efectiu, targeta o altre.');
  exigeix(esId(id) && esId(tornId), 'ID', 'La devolució necessita id i torn.');
  exigeix(esMoment(ara), 'MOMENT', 'Cal el moment de la devolució.');
  exigeix(Number.isSafeInteger(numero) && numero >= 1, 'NUMERO', 'La devolució necessita el número del torn.');
  exigeix(Array.isArray(seleccio) && seleccio.length > 0, 'SELECCIO', 'Tria almenys una línia a retornar.');
  exigeix(new Set(seleccio.map((s) => s.liniaId)).size === seleccio.length, 'SELECCIO', 'Una línia només es pot triar una vegada.');
  const retornat = retornatPerLinia(tiquet.id, devolucionsPrevies);
  const linies = seleccio.map(({ liniaId, quantitat }, i) => {
    const linia = tiquet.linies.find((l) => l.id === liniaId);
    exigeix(linia && compta(linia), 'LINIA', 'Esta línia no es pot retornar.');
    const ja = retornat.get(liniaId) || { quantitat: 0, importCents: 0 };
    const queden = linia.quantitat - ja.quantitat;
    exigeix(Number.isSafeInteger(quantitat) && quantitat >= 1, 'QUANTITAT', 'La quantitat a retornar és un enter positiu.');
    exigeix(quantitat <= queden, 'DEVOLUCIO_MASSA', `De «${linia.nomCongelat}» només en queden ${queden} per retornar.`);
    const total = totalLinia(linia);
    /* L'arrodoniment es fa sobre l'ACUMULAT (el retornat fins ara més esta
       part), no sobre cada tros: és monòton, mai negatiu, mai passa del
       total i l'última unitat tanca exactament el total (BAR-R4). El límit
       protegix de devolucions prèvies calculades d'una altra manera. */
    const fins = quantitat === queden ? total : mitjaAmunt(total * (ja.quantitat + quantitat), linia.quantitat);
    const importCents = Math.max(0, Math.min(fins, total) - ja.importCents);
    return {
      id: `${id}-${i + 1}`,
      liniaOrigenId: linia.id,
      producteId: linia.producteId,
      varianteId: linia.varianteId,
      categoriaId: linia.categoriaId,
      nomCongelat: linia.nomCongelat,
      ...(linia.varianteNomCongelat ? { varianteNomCongelat: linia.varianteNomCongelat } : {}),
      ivaPercent: linia.ivaPercent,
      ...(Number.isSafeInteger(linia.costUnitariCents) ? { costUnitariCents: linia.costUnitariCents } : {}),
      quantitat,
      importCents,
      estat: 'marxada'
    };
  });
  /* -0 no és cap import: una devolució d'una línia convidada torna 0. */
  const retorn = -suma(linies, (l) => l.importCents) || 0;
  const negatiu = (l) => -l.importCents || 0;
  return congela({
    id,
    tornId,
    tipus: 'devolucio',
    tiquetOrigenId: tiquet.id,
    numero,
    origen: { ...tiquet.origen },
    linies,
    pagaments: [{ id: `${id}-p`, metode, importCents: retorn, moment: ara }],
    estat: 'tancada',
    obertaA: ara,
    tancatA: ara,
    atesPer: aliesNet(per),
    motiu: motiuNet,
    rev: 0,
    totals: {
      brutCents: retorn,
      descomptesCents: 0,
      convidadesCents: 0,
      totalCents: retorn,
      anullatsCents: 0,
      perIva: desglossaIva(linies, negatiu)
    },
    historial: [{ moment: ara, tipus: 'devolucio', motiu: motiuNet, per: aliesNet(per), altra: tiquet.id }]
  });
}
