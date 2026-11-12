/**
 * magatzem.js — Arbre Genealògic · on viuen les dades: la base local
 * «sdp-genealogia» d'este dispositiu, a través de utils/magatzemLocal.js.
 * És l'ÚNIC fitxer de l'app que en parla (privacitat.test.js ho vigila) i viu
 * a l'arrel de l'app, com el de Salut, perquè la regla transversal de la
 * plataforma (plataforma/fronteres.test.js) només deixa importar el motor
 * local des de src/apps/<id>/magatzem.js.
 *
 *   arbres       { id, titol, malnomCasa, poble, mas, arrelId, creat, modificat }
 *   persones     Persona                   índex: arbreId
 *   relacions    Relacio                   índex: arbreId
 *   entrevistes  EstatEntrevista (clau: arbreId)
 *   meta         { clau, valor }: avís acceptat, arbre actiu, última còpia
 *
 * Cada store passa per la llista blanca del model (nucli/model.js): el que no
 * hi és no arriba al disc. L'àmbit és l'arbre (arbreId), perquè l'app no rep
 * cap id de persona del pont de sessió. Cap xarxa, cap sincronització.
 *
 * Importa nucli/model.js directament, i no la façana nucli/index.js, perquè
 * la façana reexporta useGenealogia, que importa este fitxer (cap cicle).
 */
import { creaMagatzemIdb } from '../../utils/magatzemLocal.js';
import { errorCamp, MAX_PERSONES, MAX_RELACIONS } from './nucli/segur.js';
import { esIdValid, esInstantIso, netejaArbre, netejaEntrevista, netejaPersona, netejaRelacio } from './nucli/model.js';

export const NOM_BASE = 'sdp-genealogia';
export const VERSIO_BASE = 1;
export const CLAUS_META = Object.freeze(['avis', 'arbreActiu', 'ultimaCopia']);

/* La meta: només les claus conegudes, cada una amb el seu valor net. */
export function netejaMeta(registre) {
  const { clau, valor } = registre || {};
  switch (clau) {
    case 'avis':
      if (!valor || !esInstantIso(valor.acceptatA) || !Number.isSafeInteger(valor.versio) || valor.versio < 1) throw new TypeError('Avís no vàlid.');
      return { clau, valor: { acceptatA: valor.acceptatA, versio: valor.versio } };
    case 'arbreActiu':
      if (valor !== null && !esIdValid(valor)) throw new TypeError('Arbre actiu no vàlid.');
      return { clau, valor };
    case 'ultimaCopia':
      if (valor !== null && !esInstantIso(valor)) throw new TypeError('Data de còpia no vàlida.');
      return { clau, valor };
    default:
      throw new TypeError(`Clau de meta desconeguda: ${String(clau)}`);
  }
}

/**
 * El magatzem de l'Arbre Genealògic. `idb`, `navegador` i `Canal` només per a
 * proves (undefined: els del navegador; idb null: només memòria). `anyActual`
 * fixa el límit superior de les dates que admet la llista blanca.
 */
export function creaMagatzemGenealogia({ idb, navegador, Canal, anyActual } = {}) {
  const any = Number.isSafeInteger(anyActual) ? anyActual : new Date().getFullYear();
  const opcions = {
    nom: NOM_BASE,
    versio: VERSIO_BASE,
    stores: {
      arbres: { clau: 'id' },
      persones: { clau: 'id', indexs: ['arbreId'] },
      relacions: { clau: 'id', indexs: ['arbreId'] },
      entrevistes: { clau: 'arbreId' },
      meta: { clau: 'clau' }
    },
    llistaBlanca: {
      arbres: netejaArbre,
      persones: (registre) => netejaPersona(registre, { anyActual: any }),
      relacions: netejaRelacio,
      entrevistes: netejaEntrevista,
      meta: netejaMeta
    }
  };
  if (idb !== undefined) opcions.idb = idb;
  if (navegador !== undefined) opcions.navegador = navegador;
  if (Canal !== undefined) opcions.Canal = Canal;
  return creaMagatzemIdb(opcions);
}

/** Els arbres d'este dispositiu, per títol i després per id. */
export async function llistaArbres(magatzem) {
  const arbres = await magatzem.totes('arbres');
  return arbres.sort(ordenaArbres);
}

const perId = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const ordenaArbres = (a, b) => a.titol.localeCompare(b.titol) || perId(a, b);

function arbreDelBolcat(bolcat, arbreId) {
  const arbre = bolcat.arbres.find((registre) => registre.id === arbreId);
  if (!arbre) return null;
  return {
    arbre,
    persones: bolcat.persones.filter((p) => p.arbreId === arbreId).sort(perId),
    relacions: bolcat.relacions.filter((r) => r.arbreId === arbreId).sort(perId),
    entrevista: bolcat.entrevistes.find((e) => e.arbreId === arbreId) ?? null
  };
}

function metaDelBolcat(bolcat) {
  const meta = new Map(bolcat.meta.map((r) => [r.clau, r.valor]));
  return { avis: meta.get('avis') ?? null, arbreActiu: meta.get('arbreActiu') ?? null, ultimaCopia: meta.get('ultimaCopia') ?? null };
}

/** Un arbre sencer (persones, relacions i entrevista), o null si no hi és. */
export async function carregaArbre(magatzem, arbreId) {
  return esIdValid(arbreId) ? arbreDelBolcat(await magatzem.bolca(), arbreId) : null;
}

/** Meta, selecció i arbre es lligen dins de la mateixa transacció. */
export async function carregaEstatGenealogia(magatzem, preferit) {
  const bolcat = await magatzem.bolca();
  const meta = metaDelBolcat(bolcat);
  const arbres = bolcat.arbres.sort(ordenaArbres);
  const actiu = [preferit, meta.arbreActiu].find((id) => id && arbres.some((a) => a.id === id)) ?? arbres[0]?.id ?? null;
  return { meta, arbres, complet: arbreDelBolcat(bolcat, actiu) };
}

/* Els bolcats són objectes del model, amb claus i llistes ordenades. */
export const igualRegistre = (a, b) => JSON.stringify(a) === JSON.stringify(b);
export const arbreDesactualitzat = () => errorCamp('arbre', 'desactualitzat');

function posaArbreAlBolcat(actual, arbreId, complet, activa) {
  const { arbre, persones = [], relacions = [], entrevista = null } = complet;
  if (arbre.id !== arbreId || persones.some((p) => p.arbreId !== arbreId) || relacions.some((r) => r.arbreId !== arbreId)
    || (entrevista && entrevista.arbreId !== arbreId)) {
    throw new TypeError('Totes les persones i relacions han de ser de l’arbre que es desa.');
  }
  if (persones.length > MAX_PERSONES || relacions.length > MAX_RELACIONS) throw errorCamp('arbre', 'maxim');
  const ids = new Set(persones.map((p) => p.id));
  if ((arbre.arrelId && !ids.has(arbre.arrelId)) || relacions.some((r) => !ids.has(r.de) || !ids.has(r.a))) {
    throw errorCamp('arbre', 'referencia-trencada');
  }
  for (const [store, entrants] of [['persones', persones], ['relacions', relacions]]) {
    const aliens = new Set(actual[store].filter((r) => r.arbreId !== arbreId).map((r) => r.id));
    if (entrants.some((r) => aliens.has(r.id))) throw new TypeError('Un id entrant pertany a un altre arbre.');
  }
  return {
    arbres: [...actual.arbres.filter((r) => r.id !== arbreId), arbre],
    persones: [...actual.persones.filter((r) => r.arbreId !== arbreId), ...persones],
    relacions: [...actual.relacions.filter((r) => r.arbreId !== arbreId), ...relacions],
    entrevistes: [...actual.entrevistes.filter((r) => r.arbreId !== arbreId), ...(entrevista ? [entrevista] : [])],
    meta: activa
      ? [...actual.meta.filter((r) => r.clau !== 'arbreActiu'), { clau: 'arbreActiu', valor: arbreId }]
      : actual.meta
  };
}

/** Una alta o substitució. El valor esperat es verifica dins de la transacció. */
export async function desaArbre(magatzem, complet, { activa = false, nou = false, esperat, nomesPrimer = false } = {}) {
  const entrant = structuredClone(complet);
  const arbreId = entrant.arbre.id;
  await magatzem.actualitzaBolcat((actual) => {
    const existent = arbreDelBolcat(actual, arbreId);
    if (nomesPrimer && actual.arbres.length) throw arbreDesactualitzat();
    if (nou && existent) throw errorCamp('arbre', 'repetit');
    if (esperat !== undefined && !igualRegistre(existent, esperat)) throw arbreDesactualitzat();
    return posaArbreAlBolcat(actual, arbreId, entrant, activa);
  });
}

/** Aplica una mutació síncrona a l'arbre vigent i en torna el resultat. */
export async function actualitzaArbre(magatzem, arbreId, calcula) {
  let resultat;
  await magatzem.actualitzaBolcat((bolcat) => {
    const actual = arbreDelBolcat(bolcat, arbreId);
    if (!actual) throw arbreDesactualitzat();
    resultat = calcula(actual);
    if (!resultat) return undefined;
    return posaArbreAlBolcat(bolcat, arbreId, resultat, false);
  });
  return resultat;
}

/** Esborra l'arbre i el que en penja en una sola transacció. */
export async function esborraArbre(magatzem, arbreId, esperat) {
  await magatzem.actualitzaBolcat((actual) => {
    const existent = arbreDelBolcat(actual, arbreId);
    if (esperat !== undefined && !igualRegistre(existent, esperat)) throw arbreDesactualitzat();
    if (!existent) return undefined;
    return {
      arbres: actual.arbres.filter((r) => r.id !== arbreId),
      persones: actual.persones.filter((r) => r.arbreId !== arbreId),
      relacions: actual.relacions.filter((r) => r.arbreId !== arbreId),
      entrevistes: actual.entrevistes.filter((r) => r.arbreId !== arbreId),
      meta: actual.meta.map((r) => r.clau === 'arbreActiu' && r.valor === arbreId ? { ...r, valor: null } : r)
    };
  });
}

/** La meta: { avis: { acceptatA, versio } | null, arbreActiu, ultimaCopia }. */
export async function carregaMeta(magatzem) {
  return metaDelBolcat({ meta: await magatzem.totes('meta') });
}

/** No deixa un punter nou cap a un arbre que ja s'ha esborrat. */
export function activaArbre(magatzem, arbreId) {
  if (arbreId === null) return desaMeta(magatzem, 'arbreActiu', null);
  if (!esIdValid(arbreId)) throw errorCamp('arbre');
  return magatzem.actualitzaRegistres([['arbres', arbreId], ['meta', 'arbreActiu']], ([arbre]) => {
    if (!arbre) throw arbreDesactualitzat();
    return [undefined, { clau: 'arbreActiu', valor: arbreId }];
  });
}

/** Desa un valor de meta. */
export const desaMeta = (magatzem, clau, valor) => magatzem.desa('meta', { clau, valor });
