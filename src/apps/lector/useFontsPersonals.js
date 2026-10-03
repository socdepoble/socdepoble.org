/**
 * Lector de notícies · les fonts personals a la vista (SN, 261003).
 *
 *   const { fonts, llegides, error, lleva } = useFontsPersonals(magatzem);
 *
 *   fonts     les fonts que ha afegit la persona (nucli/personals.js)
 *   llegides  false fins a la primera lectura del disc
 *   error     el codi de l'últim error del disc o null
 *   lleva(id) la lleva (una transacció, actualitzaPersonals); torna si ho ha fet
 * Es tornen a llegir amb cada avís de canvi del magatzem: el d'esta pestanya,
 * el d'una altra i el del Snippet Curador, que les afig des del Bloc. Una
 * lectura que arriba després d'una altra més nova no la xafa.
 * El magatzem el tanca useLector (el mateix objecte): ací només s'escolta.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { llevaPersonal } from './nucli/index.js';

const CAP = Object.freeze([]);
const codiDe = (error) => (typeof error?.codi === 'string' ? error.codi : 'DESCONEGUT');

export function useFontsPersonals(magatzem) {
  const [fonts, setFonts] = useState(null);
  const [error, setError] = useState(null);
  /* Puja amb cada lectura i cada canvi: només s'aplica el més nou. */
  const rondaRef = useRef(0);

  const posa = useCallback((ronda, registre) => {
    if (ronda !== rondaRef.current) return;
    setFonts(registre.fonts);
    setError(null);
  }, []);

  useEffect(() => {
    let viu = true;
    const llig = () => {
      rondaRef.current += 1;
      const ronda = rondaRef.current;
      magatzem.llegixPersonals().then((registre) => {
        if (viu) posa(ronda, registre);
      }, (motiu) => {
        if (viu && ronda === rondaRef.current) setError(codiDe(motiu));
      });
    };
    const desfes = magatzem.subscriu((avis) => {
      if (avis.tipus === 'canvi') llig();
    });
    llig();
    return () => {
      viu = false;
      desfes();
    };
  }, [magatzem, posa]);

  const lleva = useCallback(async (id) => {
    rondaRef.current += 1;
    const ronda = rondaRef.current;
    try {
      let llevada = false;
      const registre = await magatzem.actualitzaPersonals((actual) => {
        const despres = llevaPersonal(actual, id);
        llevada = despres !== actual;
        return despres;
      });
      posa(ronda, registre);
      return llevada;
    } catch (motiu) {
      setError(codiDe(motiu));
      return false;
    }
  }, [magatzem, posa]);

  return useMemo(
    () => ({ fonts: fonts || CAP, llegides: fonts !== null, error, lleva }),
    [fonts, error, lleva]
  );
}
