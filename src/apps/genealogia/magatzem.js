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
 *                i, si la base està xifrada, els paràmetres 'xifrat' (cap secret)
 *   cofre        { id: 'bolcat', v, iv, ct }: la resta de stores, xifrada (P1-81)
 *
 * Xifrat opcional (P1-81 / IDEA-253): amb una frase de pas, activaXifrat
 * xifra tot el contingut (AES-GCM, nucli/xifratLocal.js) en un sol registre
 * del store cofre i buida els altres: des d'eixe moment l'app només desa
 * dades xifrades. Buidar un store és un esborrat lògic d'IndexedDB: el motor
 * del navegador pot tardar a esborrar del disc les còpies anteriors en clar,
 * i açò l'app no ho pot forçar. obreCofre ho desxifra en un magatzem NOMÉS de
 * memòria, on treballa l'app, i desaCofre ho torna a xifrar (IV nou) després
 * de cada escriptura. Les funcions de dalt (desaArbre, actualitzaArbre…)
 * valen per als dos magatzems.
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
import {
  AAD_GENEALOGIA, BYTES_IV, ITERACIONS_KDF, derivaClau, desxifra, esBase64DeBytes, esBase64Fitat, exigixFrase,
  netejaParametres, nousParametres, xifra
} from './nucli/xifratLocal.js';

export const NOM_BASE = 'sdp-genealogia';
export const VERSIO_BASE = 2;
export const CLAUS_META = Object.freeze(['avis', 'arbreActiu', 'ultimaCopia', 'xifrat']);
/* Els stores que es xifren (la meta, sencera llevat de 'xifrat'); també els
   que toquen desaArbre, actualitzaArbre i esborraArbre, que no toquen el cofre. */
const STORES_XIFRATS = Object.freeze(['arbres', 'persones', 'relacions', 'entrevistes', 'meta']);
const ID_COFRE = 'bolcat';
/* El text xifrat en base64: prou per a MAX_PERSONES amb notes, i un sostre. */
export const MAX_CARACTERS_COFRE = 128 * 1024 * 1024;

const errorAmbCodi = (codi, missatge) => Object.assign(new Error(missatge), { codi });

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
    case 'xifrat':
      return { clau, valor: netejaParametres(valor) };
    default:
      throw new TypeError(`Clau de meta desconeguda: ${String(clau)}`);
  }
}

/* El cofre: un sol registre amb el sobre xifrat, i res més. */
export function netejaCofre(registre) {
  const { id, v, iv, ct } = registre || {};
  if (id !== ID_COFRE || v !== 1 || !esBase64DeBytes(iv, BYTES_IV) || !esBase64Fitat(ct, MAX_CARACTERS_COFRE)) {
    throw new TypeError('Registre del cofre no vàlid.');
  }
  return { id, v, iv, ct };
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
      meta: { clau: 'clau' },
      cofre: { clau: 'id' }
    },
    llistaBlanca: {
      arbres: netejaArbre,
      persones: (registre) => netejaPersona(registre, { anyActual: any }),
      relacions: netejaRelacio,
      entrevistes: netejaEntrevista,
      meta: netejaMeta,
      cofre: netejaCofre
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

const parametresDelBolcat = (bolcat) => bolcat.meta.find((r) => r.clau === 'xifrat')?.valor ?? null;

function metaDelBolcat(bolcat) {
  const meta = new Map(bolcat.meta.map((r) => [r.clau, r.valor]));
  return { avis: meta.get('avis') ?? null, arbreActiu: meta.get('arbreActiu') ?? null, ultimaCopia: meta.get('ultimaCopia') ?? null };
}

/** Un arbre sencer (persones, relacions i entrevista), o null si no hi és. */
export async function carregaArbre(magatzem, arbreId) {
  return esIdValid(arbreId) ? arbreDelBolcat(await magatzem.bolca(), arbreId) : null;
}

/**
 * Meta, selecció i arbre es lligen dins de la mateixa transacció. `xifrat`:
 * la base del disc està xifrada (llavors arbres i meta del disc són buits).
 */
export async function carregaEstatGenealogia(magatzem, preferit) {
  const bolcat = await magatzem.bolca();
  const meta = metaDelBolcat(bolcat);
  const arbres = bolcat.arbres.sort(ordenaArbres);
  const actiu = [preferit, meta.arbreActiu].find((id) => id && arbres.some((a) => a.id === id)) ?? arbres[0]?.id ?? null;
  return { meta, arbres, complet: arbreDelBolcat(bolcat, actiu), xifrat: Boolean(parametresDelBolcat(bolcat)) };
}

/* Els bolcats són objectes del model, amb claus i llistes ordenades. */
export const igualRegistre = (a, b) => JSON.stringify(a) === JSON.stringify(b);
export const arbreDesactualitzat = () => errorCamp('arbre', 'desactualitzat');

function posaArbreAlBolcat(actual, arbreId, complet, activa) {
  /* Amb la base xifrada, mai cap persona en clar al disc: s'escriu al magatzem de memòria. */
  if (parametresDelBolcat(actual)) throw errorAmbCodi('xifrat-tancat', 'La base està xifrada: cal obrir-la amb la frase.');
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
  }, STORES_XIFRATS);
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
  }, STORES_XIFRATS);
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
  }, STORES_XIFRATS);
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

/* ── Xifrat opcional (P1-81 / IDEA-253) ──────────────────────────────────
   WebCrypto és asíncron i el callback d'actualitzaBolcat és síncron: es
   xifra FORA de la transacció i, dins, es comprova que el disc no ha canviat
   des de la lectura (si ha canviat, 'desactualitzat' i no s'escriu res). */

const contingutXifrable = (bolcat) => ({
  ...Object.fromEntries(STORES_XIFRATS.map((store) => [store, bolcat[store]])),
  meta: bolcat.meta.filter((r) => r.clau !== 'xifrat')
});
const igualStores = (a, b, stores) => stores.every((store) => igualRegistre(a[store], b[store]));
const TOTS_ELS_STORES = [...STORES_XIFRATS, 'cofre'];

/** Els paràmetres de xifrat del disc, o null si la base no està xifrada. */
export async function parametresXifrat(magatzem) {
  return parametresDelBolcat({ meta: await magatzem.totes('meta') });
}

/**
 * Xifra la base amb una frase de pas (la regla d'exigixFrase): el contingut va
 * al cofre i els altres stores queden buits. Torna la clau (en memòria).
 */
export async function activaXifrat(magatzem, frase, { iteracions = ITERACIONS_KDF, cripto } = {}) {
  const text = exigixFrase(frase);
  const bolcat = await magatzem.bolca();
  if (parametresDelBolcat(bolcat)) throw errorAmbCodi('ja-xifrat', 'La base ja està xifrada.');
  const parametres = nousParametres(iteracions, { cripto });
  const clau = await derivaClau(text, parametres.sal, parametres.iteracions, { cripto });
  const sobre = await xifra(clau, contingutXifrable(bolcat), AAD_GENEALOGIA, { cripto });
  await magatzem.actualitzaBolcat((actual) => {
    if (!igualStores(actual, bolcat, TOTS_ELS_STORES)) throw arbreDesactualitzat();
    return {
      arbres: [], persones: [], relacions: [], entrevistes: [],
      meta: [{ clau: 'xifrat', valor: parametres }],
      cofre: [{ id: ID_COFRE, ...sobre }]
    };
  });
  return clau;
}

/* El sobre i els paràmetres del disc; 'no-xifrat' si la base no ho està. */
function cofreDelBolcat(bolcat) {
  const parametres = parametresDelBolcat(bolcat);
  const sobre = bolcat.cofre.find((r) => r.id === ID_COFRE);
  if (!parametres || !sobre) throw errorAmbCodi('no-xifrat', 'La base no està xifrada.');
  return { parametres, sobre };
}

/**
 * Obri la base xifrada amb la clau ja derivada: desxifra el cofre en un
 * magatzem nou que viu NOMÉS en memòria (sense IndexedDB, sense bloqueig ni
 * canal). Torna { memoria, clau, sal, iv } (iv: el del cofre llegit, per a desaCofre).
 */
export async function obreCofreAmbClau(magatzem, clau, { anyActual, cripto } = {}) {
  const { parametres, sobre } = cofreDelBolcat(await magatzem.bolca());
  const contingut = await desxifra(clau, sobre, AAD_GENEALOGIA, { cripto });
  const memoria = creaMagatzemGenealogia({ idb: null, navegador: null, Canal: null, anyActual });
  /* El contingut desxifrat també passa per la llista blanca de cada store. */
  await memoria.actualitzaBolcat(() => ({ ...contingutXifrable(contingut), cofre: [] }));
  return { memoria, clau, sal: parametres.sal, iv: sobre.iv };
}

/** Obri la base xifrada amb la frase. Una frase errònia: codi 'frase-incorrecta', i el disc no es toca. */
export async function obreCofre(magatzem, frase, { anyActual, cripto } = {}) {
  const { parametres } = cofreDelBolcat(await magatzem.bolca());
  const clau = await derivaClau(frase, parametres.sal, parametres.iteracions, { cripto });
  return obreCofreAmbClau(magatzem, clau, { anyActual, cripto });
}

/**
 * Torna a xifrar el magatzem de memòria al cofre del disc, amb un IV nou a
 * cada desat, i en torna l'IV. Amb `sal`, comprova que la base és la mateixa
 * que es va obrir (si algú l'ha desxifrada o xifrada amb una altra frase:
 * 'xifrat-canviat'). Amb `iv`, comprova que el cofre del disc és el que es va
 * llegir o escriure l'última vegada (si no, 'desactualitzat' i no s'escriu
 * res). Qui crida ha de fer els desats d'una mateixa memòria d'un en un.
 */
export async function desaCofre(magatzem, memoria, clau, { sal, iv, cripto } = {}) {
  const sobre = await xifra(clau, contingutXifrable(await memoria.bolca()), AAD_GENEALOGIA, { cripto });
  await magatzem.actualitzaBolcat((actual) => {
    const parametres = parametresDelBolcat(actual);
    if (!parametres || (sal !== undefined && parametres.sal !== sal)) throw errorAmbCodi('xifrat-canviat', 'La base xifrada ha canviat.');
    if (iv !== undefined && actual.cofre.find((r) => r.id === ID_COFRE)?.iv !== iv) throw arbreDesactualitzat();
    return { meta: actual.meta, cofre: [{ id: ID_COFRE, ...sobre }] };
  }, ['meta', 'cofre']);
  return sobre.iv;
}

/** Desxifra la base (cal la frase) i la torna a deixar en clar al disc. */
export async function desactivaXifrat(magatzem, frase, { cripto } = {}) {
  const bolcat = await magatzem.bolca();
  const { parametres, sobre } = cofreDelBolcat(bolcat);
  const clau = await derivaClau(frase, parametres.sal, parametres.iteracions, { cripto });
  const contingut = await desxifra(clau, sobre, AAD_GENEALOGIA, { cripto });
  await magatzem.actualitzaBolcat((actual) => {
    if (!igualStores(actual, bolcat, TOTS_ELS_STORES)) throw arbreDesactualitzat();
    return { ...contingutXifrable(contingut), cofre: [] };
  });
}
