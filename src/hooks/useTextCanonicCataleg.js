import { useEffect, useMemo, useState } from 'react';
import { ambTextCanonic, carregaFitxesCanoniques, fontsCanoniquesPendents } from '../data/fitxesCanoniquesCataleg.js';

/** PRIVADESA-01 (R15b) · Les files d'una superfície (Mur, Mercat o un catàleg) amb el text de la seua fitxa
 * canònica (data/fitxesCanoniquesCataleg.js). Només es carreguen les fonts que demanen les files; mentre no han
 * arribat, les referències a una font canònica no es pinten. Les altres passen tal qual. */
export function useTextCanonicCataleg(items, llengua = 'ca') {
  const [versio, setVersio] = useState(0);
  const pendents = fontsCanoniquesPendents(items, llengua).join(' ');
  useEffect(() => {
    if (!pendents) return undefined;
    let viu = true;
    Promise.allSettled(pendents.split(' ').map(font => carregaFitxesCanoniques(font, llengua)))
      .then(() => { if (viu) setVersio(actual => actual + 1); });
    return () => { viu = false; };
  }, [pendents, llengua]);
  return useMemo(() => {
    void versio;
    return (Array.isArray(items) ? items : []).map(item => ambTextCanonic(item, llengua)).filter(Boolean);
  }, [items, llengua, versio]);
}
