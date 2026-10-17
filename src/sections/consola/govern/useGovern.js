import { useCallback, useEffect, useState } from 'react';
import { useFontDev } from '../useFontDev.js';
import { carregaGovern, llegixFitxerDeGovern } from './governContent.js';
import { crearMagatzemCertificacions, empremtesDe } from './certificacions.js';

/* Quan el Mestre obri un fitxer pel botó que no és el seu, es diu quin és. */
const ERROR_DE_TIPUS = Object.freeze({
  matriu: 'Este fitxer és un trasllat, no una matriu: obri’l a la pàgina del Balanç, amb «Obri un trasllat (trasllat.json)».',
  trasllat: 'Este fitxer és una matriu, no un trasllat: obri’l amb «Obri una matriu (mcr.json)».'
});

/**
 * El Govern del Mestre per a totes les pàgines de /consola: es munta una
 * sola vegada a ConsolaSection (com consola.json i el Mapa), i navegar entre
 * el tauler i les quatre pàgines no torna a llegir res ni perd el fitxer obert.
 *
 *  · `servidor`: la lectura de /__iaia/govern.json (useFontDev). Fora de DEV,
 *    o mentre MarIA no endolle la ruta, 'absent'.
 *  · `matriu`: la del fitxer que el Mestre ha obert, si n'ha obert cap; si
 *    no, la del servidor; o null. `origen` diu quina: 'fitxer' | 'servidor'.
 *  · `head`: el commit d'ara, si el servidor el diu (la caducitat el compara
 *    amb el de la matriu també quan la matriu ve d'un fitxer).
 *  · `empremtes`: Map id → sha256 de cada fila (asíncron: WebCrypto). Sense
 *    WebCrypto (fora d'https o de localhost), `errorEmpremtes` i cap botó de
 *    certificació.
 *  · `certificacions`: el registre de decisions d'este navegador
 *    (certificacions.js), `registres` null mentre es llig.
 *
 * `actiu: false` no llig el servidor. `subtle` i `magatzem` són per a les
 * proves: per defecte, el WebCrypto i l'IndexedDB del navegador.
 */
export function useGovern({ actiu = true, subtle, magatzem: injectat = null } = {}) {
  const servidor = useFontDev(carregaGovern, { actiu });
  const [fitxer, setFitxer] = useState(null);
  const [trasllatFitxer, setTrasllatFitxer] = useState(null);
  const [errorFitxer, setErrorFitxer] = useState(null);
  const [llegintFitxer, setLlegintFitxer] = useState(false);

  const deServidor = servidor.valor ?? null;
  const matriu = fitxer?.matriu ?? deServidor?.matriu ?? null;
  const origen = fitxer ? 'fitxer' : deServidor?.matriu ? 'servidor' : null;
  const trasllat = trasllatFitxer?.trasllat ?? deServidor?.trasllat ?? null;
  const origenTrasllat = trasllatFitxer ? 'fitxer' : deServidor?.trasllat ? 'servidor' : null;

  /* Quants fitxers de cada classe no s'han pogut obrir. Revisió adversarial del
     carril F1 (selectors del peu) · El selector de cada classe la porta de
     `key`: un fitxer rebutjat el fa tornar a començar («Cap fitxer triat»),
     i no diu que n'hi ha un de triat quan no s'ha obert res. Derogat: el
     comptador de tancaments (`tancades`); ara el selector d'una classe no es
     pinta mentre n'hi ha un fitxer obert (PeuGovern), i en tancar-los torna net. */
  const [rebutjos, setRebutjos] = useState({ matriu: 0, trasllat: 0 });

  /* Llig el fitxer en este navegador (cap pujada) i el posa en lloc del que hi havia. */
  const obri = useCallback(async (f, esperat) => {
    setErrorFitxer(null);
    setLlegintFitxer(true);
    try {
      const llegit = await llegixFitxerDeGovern(f);
      if (llegit.tipus !== esperat) throw new Error(ERROR_DE_TIPUS[esperat]);
      if (esperat === 'matriu') setFitxer({ nom: llegit.nom, matriu: llegit.valor });
      else setTrasllatFitxer({ nom: llegit.nom, trasllat: llegit.valor });
    } catch (e) {
      setErrorFitxer(e?.message ?? String(e));
      setRebutjos((r) => ({ ...r, [esperat]: r[esperat] + 1 }));
    } finally {
      setLlegintFitxer(false);
    }
  }, []);
  const obriMatriu = useCallback((f) => obri(f, 'matriu'), [obri]);
  const obriTrasllat = useCallback((f) => obri(f, 'trasllat'), [obri]);
  const tancaFitxers = useCallback(() => {
    setFitxer(null);
    setTrasllatFitxer(null);
    setErrorFitxer(null);
  }, []);

  /* Les empremtes són de la matriu que es pinta: una de vella no val per a la nova. */
  const [empremtes, setEmpremtes] = useState({ de: null, mapa: null, error: null });
  useEffect(() => {
    if (!matriu) return undefined;
    let viu = true;
    empremtesDe(matriu, subtle).then(
      (mapa) => { if (viu) setEmpremtes({ de: matriu, mapa, error: null }); },
      (e) => { if (viu) setEmpremtes({ de: matriu, mapa: null, error: e?.message ?? String(e) }); }
    );
    return () => { viu = false; };
  }, [matriu, subtle]);
  const delaMatriu = empremtes.de === matriu && matriu !== null;

  const [magatzem] = useState(() => injectat ?? crearMagatzemCertificacions());
  const [registres, setRegistres] = useState(null);
  const [errorMagatzem, setErrorMagatzem] = useState(null);
  const recarrega = useCallback(async () => {
    try {
      const llista = await magatzem.registres();
      setRegistres(llista);
      setErrorMagatzem(null);
    } catch (e) {
      setErrorMagatzem(e?.message ?? String(e));
      setRegistres((r) => r ?? []);
    }
  }, [magatzem]);
  useEffect(() => {
    recarrega();
    return () => magatzem.tanca?.();
  }, [magatzem, recarrega]);
  /* Afig una decisió i torna a llegir el registre sencer: el que es pinta és el que hi ha. */
  const afegix = useCallback(async (registre) => {
    await magatzem.afegix(registre);
    await recarrega();
  }, [magatzem, recarrega]);
  const exporta = useCallback(() => magatzem.exporta(), [magatzem]);

  return {
    servidor: { estat: servidor.estat, error: servidor.error, carrega: servidor.carrega, generat: deServidor?.generat ?? null },
    matriu,
    origen,
    nomFitxer: fitxer?.nom ?? null,
    head: deServidor?.head ?? null,
    trasllat,
    origenTrasllat,
    nomTrasllat: trasllatFitxer?.nom ?? null,
    obriMatriu,
    obriTrasllat,
    tancaFitxers,
    rebutjos,
    errorFitxer,
    llegintFitxer,
    empremtes: delaMatriu ? empremtes.mapa : null,
    errorEmpremtes: delaMatriu ? empremtes.error : null,
    certificacions: {
      registres,
      persistent: magatzem.persistent,
      error: errorMagatzem,
      afegix,
      exporta
    }
  };
}
