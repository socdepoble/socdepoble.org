/**
 * magatzem.js — on viuen les dades de Salut: la base local «sdp-salut» d'este
 * dispositiu, a través de utils/magatzemLocal.js. És l'ÚNIC fitxer de Salut
 * que en parla (privacitat.test.js ho vigila).
 *
 *   apunts       { id, tipus, moment, ofsetMin, jornada, … }   índex: jornada
 *   jornades     { data, completa, notes? }
 *   periodes     { id, inici, dies, estat }
 *   valoracions  { id, setmanaInici, … }
 *   meta         { clau, valor }: persona, avís acceptat, alertes descartades,
 *                última còpia i els apartats apagats (agitació, medicació, deposicions)
 *
 * Cada store té llista blanca: els apunts passen pel diccionari (el que no hi
 * és no arriba mai al disc). Cap preferència va a un altre emmagatzematge del
 * navegador: la marca de l'avís acceptat i el que la família no vol apuntar
 * (que també diu alguna cosa de la persona) són ací, i «Esborra-ho tot» ho oblida.
 * Res d'això ix del dispositiu: cap xarxa, cap sincronització.
 */
import { creaMagatzemIdb } from '../../utils/magatzemLocal.js';
import { INTERRUPTOR_DE_TIPUS, netejaApunt, netejaJornada, netejaPeriode, netejaValoracio, validaPersona } from './nucli/diccionari.js';

export const NOM_BASE = 'sdp-salut';
export const VERSIO_BASE = 1;
export const CLAUS_META = Object.freeze(['persona', 'avis', 'descartades', 'ultimaCopia', 'apagats']);
/* Els interruptors de Salut (manifest.interruptors): els únics valors de la meta «apagats». */
export const IDS_INTERRUPTORS = Object.freeze([...new Set(Object.values(INTERRUPTOR_DE_TIPUS))].sort());

const esInstantIso = (valor) => typeof valor === 'string' && valor.length <= 30 && !Number.isNaN(Date.parse(valor));

/* La meta: només les claus conegudes, cada una amb el seu valor net. */
function netejaMeta(registre) {
  const { clau, valor } = registre || {};
  switch (clau) {
    case 'persona':
      return { clau, valor: validaPersona(valor).persona };
    case 'avis':
      if (!valor || !esInstantIso(valor.acceptatA) || !Number.isSafeInteger(valor.versio)) throw new TypeError('Avís no vàlid.');
      return { clau, valor: { acceptatA: valor.acceptatA, versio: valor.versio } };
    case 'descartades':
      if (!Array.isArray(valor) || valor.length > 1000 || !valor.every((c) => typeof c === 'string' && /^[a-z-]+@\d{4}-\d{2}-\d{2}\.\.\d{4}-\d{2}-\d{2}$/.test(c))) {
        throw new TypeError('Llista de descartades no vàlida.');
      }
      return { clau, valor: [...new Set(valor)] };
    case 'ultimaCopia':
      if (!esInstantIso(valor)) throw new TypeError('Data de còpia no vàlida.');
      return { clau, valor };
    case 'apagats':
      if (!Array.isArray(valor) || !valor.every((id) => IDS_INTERRUPTORS.includes(id))) throw new TypeError('Llista d’apartats apagats no vàlida.');
      return { clau, valor: [...new Set(valor)].sort() };
    default:
      throw new TypeError(`Clau de meta desconeguda: ${String(clau)}`);
  }
}

/**
 * El magatzem de Salut. `idb`, `navegador` i `Canal` només per a proves
 * (undefined: els del navegador; idb null: només memòria).
 */
export function creaMagatzemSalut({ idb, navegador, Canal } = {}) {
  const opcions = {
    nom: NOM_BASE,
    versio: VERSIO_BASE,
    stores: {
      apunts: { clau: 'id', indexs: ['jornada'] },
      jornades: { clau: 'data' },
      periodes: { clau: 'id' },
      valoracions: { clau: 'id' },
      meta: { clau: 'clau' }
    },
    llistaBlanca: {
      apunts: netejaApunt,
      jornades: netejaJornada,
      periodes: netejaPeriode,
      valoracions: netejaValoracio,
      meta: netejaMeta
    }
  };
  if (idb !== undefined) opcions.idb = idb;
  if (navegador !== undefined) opcions.navegador = navegador;
  if (Canal !== undefined) opcions.Canal = Canal;
  return creaMagatzemIdb(opcions);
}

/** Tot el que hi ha, en una sola lectura: { persona, avis, descartades, ultimaCopia, apagats, apunts, jornades, periodes, valoracions }. */
export async function carregaTot(magatzem) {
  const bolcat = await magatzem.bolca();
  const meta = new Map((bolcat.meta || []).map((registre) => [registre.clau, registre.valor]));
  return {
    persona: validaPersona(meta.get('persona') || {}).persona,
    avis: meta.get('avis') || null,
    descartades: meta.get('descartades') || [],
    ultimaCopia: meta.get('ultimaCopia') || null,
    apagats: meta.get('apagats') || [],
    apunts: bolcat.apunts || [],
    jornades: bolcat.jornades || [],
    periodes: bolcat.periodes || [],
    valoracions: bolcat.valoracions || []
  };
}

/** Desa un valor de meta. */
export const desaMeta = (magatzem, clau, valor) => magatzem.desa('meta', { clau, valor });
