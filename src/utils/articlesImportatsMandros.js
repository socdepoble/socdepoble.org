/**
 * articlesImportatsMandros.js — P1-f (Onada R6, Bloc 2) · Els articles
 * importats de socdepoble.net, carregats només quan algú en demana un.
 *
 * transformadorEditorialWpBlogger.js porta el tesaurus doctoral sencer
 * (≈450 KB al build). El detall del Mur, Connectar, Notes, el Xat i les
 * pàgines de text passen per elementDeSeccio.js, i amb un import estàtic
 * tots baixaven el tesaurus per a resoldre, de tant en tant, un article
 * importat. Ací:
 *   - l'índex de claus (indexArticlesImportats.js, generat) diu de manera
 *     síncrona si una clau és d'un article importat;
 *   - el transformador sencer arriba amb import() la primera volta que cal;
 *   - trobaArticleImportatComAPublicacio torna EXACTAMENT el mateix que la del
 *     transformador quan ja és carregat, i null mentre no ho és;
 *   - useEstatArticleImportat torna a pintar el component quan arriba, i diu
 *     'carregant' mentre tant (o 'error' si l'import ha fallat).
 *
 * D-B4-4 (Onada R6, Bloc 4; Gauntlet del Node 0: Qwen 2.5 Coder 14B, Qwen 3
 * 8B i la IAIA MarIA) · Un reintent torna a carregar de debò: la promesa
 * fallida ja no hi és, l'intent nou torna l'estat a 'carregant' (no es queda
 * en 'error' mentre es reintenta) i un intent vell que arriba tard no xafa el
 * d'ara. El ganxo demana la càrrega per CLAU (no per estat): un canvi ràpid
 * d'itemId continua subscrit i coherent, i una clau nova després d'una
 * fallada la torna a provar una volta, sense cap bucle.
 */
import { useEffect, useSyncExternalStore } from 'react';
import { CLAUS_ARTICLES_IMPORTATS } from '../data/taxonomia/indexArticlesImportats.js';

const importaDeVeres = () => import('./transformadorEditorialWpBlogger.js');
let importa = importaDeVeres;
let transformador = null;
let promesa = null;
let fallada = false;
let versio = 0;
/* Cada intent porta el seu número: només l'últim escriu l'estat. */
let intents = 0;
const subscriptors = new Set();

function avisa() {
  versio += 1;
  for (const avis of [...subscriptors]) avis();
}

function subscriu(avis) {
  subscriptors.add(avis);
  return () => subscriptors.delete(avis);
}

const versioActual = () => versio;

/** Si la clau (slug o id de WordPress) és d'un article importat. Síncron. */
export function esClauDArticleImportat(itemId) {
  if (itemId == null || itemId === '') return false;
  return CLAUS_ARTICLES_IMPORTATS.has(String(itemId).trim());
}

/** Carrega (una sola volta) el transformador sencer, amb el tesaurus. Si
 *  falla, la crida següent torna a provar-ho (un import() nou). */
export function carregaArticlesImportats() {
  if (transformador) return Promise.resolve(transformador);
  if (!promesa) {
    const intent = ++intents;
    let carrega;
    try {
      carrega = Promise.resolve(importa());
    } catch (error) {
      carrega = Promise.reject(error);
    }
    promesa = carrega.then((modul) => {
      if (intent === intents) {
        transformador = modul;
        fallada = false;
        avisa();
      }
      return modul;
    }, (error) => {
      if (intent === intents) {
        promesa = null;
        fallada = true;
        avisa();
      }
      throw error;
    });
    /* Un reintent després d'una fallada: 'carregant' mentre dura. */
    if (fallada) {
      fallada = false;
      avisa();
    }
  }
  return promesa;
}

/** Només per a proves: oblida el transformador i l'intent en curs, i fa servir
 *  `importador` (o el de veres) en el pròxim import(). */
export function _reiniciaArticlesImportatsPerAProves(importador = null) {
  importa = typeof importador === 'function' ? importador : importaDeVeres;
  transformador = null;
  promesa = null;
  fallada = false;
  intents += 1;
  avisa();
}

/** La publicació d'un article importat, com la del transformador; null si la
 *  clau no n'és cap o si el transformador encara no ha arribat. */
export function trobaArticleImportatComAPublicacio(itemId, storage) {
  if (!transformador || !esClauDArticleImportat(itemId)) return null;
  return transformador.trobaArticleImportatComAPublicacio(itemId, storage);
}

/** 'carregant' | 'error' | null (no és d'un article importat, o ja es pot resoldre). */
export function estatArticleImportat(itemId) {
  if (transformador || !esClauDArticleImportat(itemId)) return null;
  return fallada ? 'error' : 'carregant';
}

/** Ganxo: demana el transformador si la clau és d'un article importat i
 *  torna a pintar quan arriba. Passa null quan la secció no és el Mur. */
export function useEstatArticleImportat(itemId) {
  useSyncExternalStore(subscriu, versioActual, versioActual);
  const clau = esClauDArticleImportat(itemId) ? String(itemId).trim() : null;
  /* D-B4-4 · Per clau: A → B ràpid torna a demanar (la mateixa promesa si
     encara vola: cap import doble); la mateixa clau en 'error' no reintenta
     sola, una clau nova sí (una volta). */
  useEffect(() => {
    if (clau && !transformador) carregaArticlesImportats().catch(() => {});
  }, [clau]);
  return estatArticleImportat(itemId);
}
