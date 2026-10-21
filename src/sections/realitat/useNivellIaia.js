/**
 * useNivellIaia.js — Onada 6 (tasca 12 del pla 261009_0245) · El nivell d'IA
 * (0-3) del Selector de Realitat, viu, per a qui el pinta en React: amb el
 * nivell 0 (Apagada) la IAIA no apareix al xat.
 *
 * Arrenca amb el nivell desat (nivellIaiaDesat) i el seguix per dos camins:
 *   · EVENT_NIVELL_IAIA a `window`, que llança SelectorRealitat en esta mateixa
 *     pestanya (anunciaNivellIaia);
 *   · l'esdeveniment 'storage', perquè un canvi fet en una altra pestanya del
 *     mateix navegador també hi arribe sense tornar a carregar.
 * nivellIaia.js continua sense React: este hook és l'única peça que hi
 * afig. Un valor fora de 0-3 cau a Passiva (1), com nivellIaiaDesat.
 */
import { useEffect, useState } from 'react';
import { STORAGE_PREFIX } from '../../config/storage.js';
import { CLAU_NIVELL_IAIA, EVENT_NIVELL_IAIA, nivellIaiaDesat } from './nivellIaia.js';

/* La clau de localStorage que escriu setVal (config/storage.js porta el prefix). */
const CLAU_EMMAGATZEMADA = `${STORAGE_PREFIX}${CLAU_NIVELL_IAIA}`;

/* El nivell d'un esdeveniment, o null si no és un dels quatre. */
function nivellValid(valor) {
  const nivell = Number(valor);
  return Number.isInteger(nivell) && nivell >= 0 && nivell <= 3 ? nivell : null;
}

/** El nivell d'IA vigent (0-3) en este navegador. */
export default function useNivellIaia() {
  const [nivell, setNivell] = useState(nivellIaiaDesat);
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const alNivell = (e) => setNivell(nivellValid(e?.detail) ?? nivellIaiaDesat());
    /* `key` null: una altra pestanya ha buidat tot l'emmagatzematge. */
    const alStorage = (e) => {
      if (e?.key == null || e.key === CLAU_EMMAGATZEMADA) setNivell(nivellIaiaDesat());
    };
    window.addEventListener(EVENT_NIVELL_IAIA, alNivell);
    window.addEventListener('storage', alStorage);
    /* Entre el primer pintat i este efecte el nivell pot haver canviat. */
    setNivell(nivellIaiaDesat());
    return () => {
      window.removeEventListener(EVENT_NIVELL_IAIA, alNivell);
      window.removeEventListener('storage', alStorage);
    };
  }, []);
  return nivell;
}
