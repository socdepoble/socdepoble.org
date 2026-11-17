import { errorBar, esCents, esId, esMoment, suma, textNet } from './comu.js';
import { MAX_QUANTITAT, origenNet, totals } from './comanda.js';
import { METODES } from './cobrament.js';
import { desglossaIva } from './iva.js';
import { compta, totalLinia, TIPUS_DESCOMPTE } from './linia.js';
import { MAX_AVISOS, validaTraspas } from './traspas.js';

export const ESQUEMA_COPIA_BAR = 'sdp.bar.copia.v1';
export const MAX_BYTES_COPIA_BAR = 32 * 1024 * 1024;
const STORES = ['cataleg', 'sala', 'comandes', 'tiquets', 'torns', 'meta'];
export const CLAUS_META = Object.freeze(['establiment', 'tornActual', 'traspas', 'tancament']);
const esRegistre = (valor) => valor !== null && typeof valor === 'object' && !Array.isArray(valor);
const enterPositiu = (valor) => Number.isSafeInteger(valor) && valor > 0;
const rebutja = () => errorBar('COPIA_INVALIDA', 'El fitxer no és una còpia vàlida del Bar.');

function comandaValida(registre, torns) {
  if (!torns.has(registre.tornId) || !esMoment(registre.obertaA)
    || !Number.isSafeInteger(registre.rev) || registre.rev < 0 || !Array.isArray(registre.linies)
    || !Array.isArray(registre.pagaments) || !Array.isArray(registre.historial)) return false;
  origenNet(registre.origen);
  const linies = new Set();
  for (const linia of registre.linies) {
    const importLinia = registre.tipus === 'devolucio' ? linia?.importCents : linia?.preuUnitariCents;
    if (!esId(linia?.id) || linies.has(linia.id) || !enterPositiu(linia.quantitat) || linia.quantitat > MAX_QUANTITAT
      || !esCents(importLinia) || importLinia < 0 || !Number.isSafeInteger(linia.ivaPercent)
      || linia.ivaPercent < 0 || linia.ivaPercent > 100
      || !['nova', 'marxada', 'anullada'].includes(linia.estat)
      || (linia.costUnitariCents !== undefined && (!esCents(linia.costUnitariCents) || linia.costUnitariCents < 0))) return false;
    /* Un descompte d'import pot passar del brut: canviaQuantitat baixa
       unitats sense tocar-lo i descompteLinia el limita (FISC-01). */
    if (linia.descompte !== undefined) {
      const d = linia.descompte;
      if (!esRegistre(d) || !TIPUS_DESCOMPTE.includes(d.tipus) || !enterPositiu(d.valor) || !textNet(d.motiu, 80)
        || (d.tipus === 'percent' && d.valor > 100)) return false;
    }
    if (linia.convidada !== undefined && (!esRegistre(linia.convidada) || !textNet(linia.convidada.motiu, 80))) return false;
    if (registre.tipus !== 'devolucio' && (!Array.isArray(linia.modificadors)
      || linia.modificadors.some((m) => !esCents(m?.deltaCents) || m.deltaCents < 0))) return false;
    linies.add(linia.id);
  }
  if (registre.tipus !== 'devolucio' && totals(registre).pendentCents < 0) return false;
  const pagaments = new Set();
  return registre.pagaments.every((p) => {
    const devolucio = registre.tipus === 'devolucio';
    if (!esId(p?.id) || pagaments.has(p.id) || !METODES.includes(p.metode) || !esCents(p.importCents) || !esMoment(p.moment)
      || (devolucio ? p.importCents > 0 : p.importCents <= 0)
      || (p.part !== undefined && (!Number.isSafeInteger(p.part) || p.part < 1 || p.part > 50))) return false;
    pagaments.add(p.id);
    if (!devolucio && p.metode === 'efectiu') {
      return esCents(p.lliuratCents) && p.lliuratCents >= p.importCents
        && esCents(p.canviCents) && p.canviCents === p.lliuratCents - p.importCents;
    }
    return p.lliuratCents === undefined && p.canviCents === undefined;
  });
}

function totalsValids(tiquet) {
  if (tiquet.estat !== 'tancada' || !esRegistre(tiquet.totals) || !Array.isArray(tiquet.totals.perIva)) return false;
  const retorn = tiquet.tipus === 'devolucio'
    ? -suma(tiquet.linies, (linia) => linia.importCents) || 0 : 0;
  const calculats = tiquet.tipus === 'venda' ? totals(tiquet) : {
    brutCents: retorn, descomptesCents: 0, convidadesCents: 0, totalCents: retorn, anullatsCents: 0,
    perIva: desglossaIva(tiquet.linies, (linia) => -linia.importCents)
  };
  const camps = ['brutCents', 'descomptesCents', 'convidadesCents', 'totalCents', 'anullatsCents'];
  const pagat = suma(tiquet.pagaments, (pagament) => pagament.importCents);
  const taxes = new Map(calculats.perIva.map((fila) => [fila.ivaPercent, fila]));
  return camps.every((camp) => esCents(tiquet.totals[camp]) && tiquet.totals[camp] === calculats[camp])
    && esCents(pagat) && pagat === calculats.totalCents
    && tiquet.totals.perIva.length === taxes.size
    && new Set(tiquet.totals.perIva.map((fila) => fila?.ivaPercent)).size === taxes.size
    && tiquet.totals.perIva.every((fila) => {
      const esperada = taxes.get(fila?.ivaPercent);
      return esperada && fila.baseCents === esperada.baseCents && fila.quotaCents === esperada.quotaCents;
    });
}

/* Una devolució no inventa una venda: congela la mateixa línia, i totes les
   parts juntes respecten les unitats i els cèntims encara retornables.
   El bolcat pot estar desordenat; validem el conjunt, sense llegir-lo com
   una seqüència d'operacions. creaDevolucio arredonix l'ACUMULAT: cada part
   és floor o ceil de la seua proporció i l'acumulat ha de quadrar exacte. */
function devolucionsValides(tiquets) {
  const vendes = new Map(tiquets.filter((t) => t.tipus === 'venda').map((t) => [t.id, t]));
  const acumulats = new Map();
  const campsCongelats = ['producteId', 'varianteId', 'categoriaId', 'nomCongelat', 'varianteNomCongelat', 'ivaPercent', 'costUnitariCents'];
  for (const tiquet of tiquets.filter((t) => t.tipus === 'devolucio')) {
    const venda = vendes.get(tiquet.tiquetOrigenId);
    if (!venda) return false;
    const originals = new Map(venda.linies.map((l) => [l.id, l]));
    const repetides = new Set();
    let delTiquet = acumulats.get(venda.id);
    if (!delTiquet) { delTiquet = new Map(); acumulats.set(venda.id, delTiquet); }
    for (const linia of tiquet.linies) {
      const original = typeof linia.liniaOrigenId === 'string' ? originals.get(linia.liniaOrigenId) : null;
      if (!original || !compta(original) || repetides.has(original.id) || linia.estat !== 'marxada'
        || linia.descompte !== undefined || linia.convidada !== undefined
        || campsCongelats.some((camp) => linia[camp] !== original[camp])) return false;
      repetides.add(original.id);
      const total = totalLinia(original);
      if (!esCents(total) || total < 0) return false;
      const totalGran = BigInt(total);
      const unitatsVenda = BigInt(original.quantitat);
      const unitats = BigInt(linia.quantitat);
      const import_ = BigInt(linia.importCents);
      const proporcio = totalGran * unitats;
      if (import_ < proporcio / unitatsVenda || import_ > (proporcio + unitatsVenda - 1n) / unitatsVenda) return false;
      const anterior = delTiquet.get(original.id) || { unitats: 0n, import_: 0n };
      const acumulat = { unitats: anterior.unitats + unitats, import_: anterior.import_ + import_, total: totalGran, unitatsVenda };
      if (acumulat.unitats > unitatsVenda || acumulat.import_ > totalGran) return false;
      delTiquet.set(original.id, acumulat);
    }
  }
  for (const linies of acumulats.values()) {
    for (const { unitats, import_, total, unitatsVenda } of linies.values()) {
      const esperat = (total * unitats * 2n + unitatsVenda) / (unitatsVenda * 2n);
      if (import_ !== esperat) return false;
    }
  }
  return true;
}

function establimentValid(establiment) {
  return esRegistre(establiment) && typeof establiment.nom === 'string' && establiment.nom.trim().length > 0
    && typeof establiment.slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(establiment.slug)
    && Number.isSafeInteger(establiment.ivaPerDefecte) && establiment.ivaPerDefecte >= 0 && establiment.ivaPerDefecte <= 100
    && Array.isArray(establiment.denominacions) && establiment.denominacions.length > 0
    && establiment.denominacions.every(enterPositiu);
}

function tancamentValid(esborrany) {
  return esborrany == null || (esRegistre(esborrany)
    && esRegistre(esborrany.perDenominacio) && Object.values(esborrany.perDenominacio).every((n) => esCents(n) && n >= 0)
    && esCents(esborrany.fonsDeixatCents) && esborrany.fonsDeixatCents >= 0
    && Array.isArray(esborrany.avisos) && esborrany.avisos.length <= MAX_AVISOS
    && esborrany.avisos.every((avis) => typeof avis === 'string' && avis.length <= 80));
}

function tornValid(torn) {
  if (!esMoment(torn.obertA) || !Array.isArray(torn.moviments) || !esCents(torn.fonsInicialCents)
    || torn.fonsInicialCents < 0) return false;
  const moviments = new Set();
  for (const m of torn.moviments) {
    if (!esId(m?.id) || moviments.has(m.id) || !['entrada', 'eixida'].includes(m.tipus)
      || !enterPositiu(m.importCents) || !textNet(m.motiu, 80) || !esMoment(m.moment)) return false;
    moviments.add(m.id);
  }
  if (torn.estat === 'obert') return true;
  return torn.estat === 'tancat' && esMoment(torn.tancatA) && esRegistre(torn.resum)
    && esRegistre(torn.resum.vendesPerMetode) && esRegistre(torn.resum.retornatPerMetode)
    && Array.isArray(torn.resum.perCategoria) && Array.isArray(torn.resum.perProducte)
    && esRegistre(torn.arqueig) && esCents(torn.arqueig.totalCents)
    && torn.traspas?.tornId === torn.id && validaTraspas(torn.traspas).ok;
}

export function llegixCopiaBar(text) {
  if (typeof text !== 'string' || text.length > MAX_BYTES_COPIA_BAR
    || new TextEncoder().encode(text).byteLength > MAX_BYTES_COPIA_BAR) throw rebutja();
  try {
    const copia = JSON.parse(text);
    if (copia?.schema !== ESQUEMA_COPIA_BAR || !esMoment(copia.desadaA)
      || STORES.some((store) => !Array.isArray(copia[store]))
      || STORES.reduce((total, store) => total + copia[store].length, 0) > 200_000
      || copia.cataleg.length !== 1 || copia.cataleg[0]?.id !== 'carta'
      || copia.sala.length !== 1 || copia.sala[0]?.id !== 'sala') throw rebutja();

    const bolcat = Object.fromEntries(STORES.map((store) => [store, copia[store]]));
    for (const store of STORES) {
      const camp = store === 'meta' ? 'clau' : 'id';
      const clauValida = store === 'meta' ? (clau) => CLAUS_META.includes(clau) : esId;
      const claus = new Set();
      for (const registre of bolcat[store]) {
        if (!esRegistre(registre) || !clauValida(registre[camp]) || claus.has(registre[camp])) throw rebutja();
        claus.add(registre[camp]);
      }
    }
    const meta = new Map(bolcat.meta.map(({ clau, valor }) => [clau, valor]));
    const traspas = meta.get('traspas');
    if (!establimentValid(meta.get('establiment')) || !tancamentValid(meta.get('tancament'))
      || (traspas != null && !validaTraspas(traspas).ok)) throw rebutja();
    const torns = new Map(bolcat.torns.map((torn) => [torn.id, torn]));
    const oberts = bolcat.torns.filter((torn) => torn.estat === 'obert');
    if (oberts.length > 1 || (oberts[0]?.id ?? null) !== (meta.get('tornActual') ?? null)
      || bolcat.torns.some((torn) => !tornValid(torn))) throw rebutja();
    const vendes = new Set(bolcat.tiquets.filter((tiquet) => tiquet.tipus === 'venda').map((tiquet) => tiquet.id));
    /* Les versions anteriors podien guardar el tiquet abans de llevar la
       comanda. Un tiquet confirma que eixa comanda s'havia tancat. */
    bolcat.comandes = bolcat.comandes.filter((c) => !vendes.has(c.id));
    if (bolcat.comandes.some((c) => c.estat !== 'oberta' || !comandaValida(c, torns))) throw rebutja();
    const numeros = new Set();
    for (const tiquet of bolcat.tiquets) {
      const clau = `${tiquet.tornId}:${tiquet.numero}`;
      if (!['venda', 'devolucio'].includes(tiquet.tipus) || !enterPositiu(tiquet.numero) || numeros.has(clau)
        || !esMoment(tiquet.tancatA) || !comandaValida(tiquet, torns) || !totalsValids(tiquet)
        || (tiquet.tipus === 'devolucio' && !vendes.has(tiquet.tiquetOrigenId))) throw rebutja();
      numeros.add(clau);
    }
    if (!devolucionsValides(bolcat.tiquets)) throw rebutja();
    return bolcat;
  } catch (error) {
    if (error?.codi === 'COPIA_INVALIDA') throw error;
    throw rebutja();
  }
}
