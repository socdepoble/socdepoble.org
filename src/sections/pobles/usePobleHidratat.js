/**
 * usePobleHidratat.js · Fase 3a de l'eina de pobles nous (disseny
 * nit/viquipedia_disseny.md §4.3, passos 3a-2 i 3a-3) · La capçalera de la
 * pàgina d'un poble, la seua pàgina viva al Xat i la seua targeta de /pobles
 * completen els buits de la fitxa amb el que la Viquipèdia ja va tornar en
 * este navegador (cauDeViquipedia.js). Només LLEGIXEN la cau: cap petició a
 * Wikimedia (això només ho fa el panell, després d'un clic), cap escriptura.
 *
 * Llei del Píxel: amb una fitxa completa (totes les de la llavor) es torna el
 * MATEIX objecte (o la mateixa llista), no s'importa la cau i no s'obri cap
 * base IndexedDB.
 */
import { useEffect, useMemo, useReducer } from 'react';
import { clauDeViquipedia, fitxaCompleta, fusionaAmbViquipedia } from './fitxaDelPoble.js';

let promesa = null;
let cauCarregada = null;

/** La cau diferida (un tros a banda); la mateixa per a tota l'app. */
export function carregaCauDeViquipedia() {
  promesa ||= import('./cauDeViquipedia.js').then((modul) => {
    cauCarregada = modul.cauDeViquipedia();
    return cauCarregada;
  }, (error) => {
    /* Un tros que no arriba (una connexió que cau) no queda enganxat: el pròxim poble ho torna a provar. */
    promesa = null;
    throw error;
  });
  return promesa;
}

const CAP = Object.freeze([]);
const clauDe = (town) => (town && typeof town === 'object' && !fitxaCompleta(town) ? clauDeViquipedia(town) : null);

/* Llig de la cau les claus donades i torna a pintar quan arriben o canvien.
   Sense cap clau, no fa res: ni import ni base. Torna la cau (o null) i un
   comptador que puja amb cada canvi. */
function useCauDeLesClaus(claus) {
  const [versio, refresca] = useReducer((n) => n + 1, 0);
  const firma = claus.join('\n');
  useEffect(() => {
    if (!firma) return undefined;
    let viu = true;
    let desfes = null;
    carregaCauDeViquipedia().then((cau) => {
      if (!viu) return undefined;
      desfes = cau.subscriu(() => { if (viu) refresca(); });
      return Promise.all(firma.split('\n').map((clau) => cau.llig(clau))).then(() => { if (viu) refresca(); });
    }).catch(() => { /* sense cau, la fitxa de sempre */ });
    return () => {
      viu = false;
      desfes?.();
    };
  }, [firma]);
  /* Una instantània nova amb cada canvi de la cau (o de les claus): qui la
     llig la posa a les dependències i torna a hidratar. */
  return useMemo(() => ({ cau: firma ? cauCarregada : null, versio }), [firma, versio]);
}

const hidrata = (cau, town) => {
  const clau = clauDe(town);
  const entrada = clau ? cau.entradaEnMemoria(clau) : null;
  return entrada ? fusionaAmbViquipedia(town, entrada) : town;
};

/** La fitxa d'un poble amb els buits omplits per la cau, o la mateixa fitxa. */
export function usePobleHidratat(item, actiu = true) {
  const clau = actiu ? clauDe(item) : null;
  const instantania = useCauDeLesClaus(clau ? [clau] : CAP);
  return useMemo(() => (instantania.cau && clau ? hidrata(instantania.cau, item) : item), [instantania, clau, item]);
}

/** La llista de /pobles amb els buits omplits; la mateixa llista si no cal. */
export function usePoblesHidratats(llista) {
  const claus = useMemo(() => (Array.isArray(llista) ? [...new Set(llista.map(clauDe).filter(Boolean))] : CAP), [llista]);
  const instantania = useCauDeLesClaus(claus);
  return useMemo(() => {
    const { cau } = instantania;
    if (!cau || !claus.length) return llista;
    const resultat = llista.map((town) => hidrata(cau, town));
    return resultat.some((town, i) => town !== llista[i]) ? resultat : llista;
  }, [llista, instantania, claus]);
}
