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
 *
 * Peça C (ordre del Mestre, 261007, prompt 261007_1628) · `lleva` és
 * llevaDelMagatzem (fontsPersonals.js), l'única implementació de llevar una
 * font personal: abans n'hi havia una còpia ací. Sense la guarda del disc de
 * llevaFontPersonal, i a propòsit: eixa guarda és per al magatzem de pas, que
 * es crea, escriu i es tanca i podia caure en una memòria que es llançava. El
 * d'ací és el de l'app, i el motor (utils/magatzemLocal.js) ja no passa mai a
 * memòria en silenci després d'haver obert la base (llança NO_DISPONIBLE,
 * que arriba a `error`). Si treballa en memòria des del principi, no hi pot
 * haver cap font personal: només s'afigen amb el disc. Afegir-hi la guarda
 * seria una obertura més de la base a cada paperera, per a un cas que no pot
 * passar.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { llevaDelMagatzem } from './fontsPersonals.js';

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
      const { llevada, registre } = await llevaDelMagatzem(magatzem, id);
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
