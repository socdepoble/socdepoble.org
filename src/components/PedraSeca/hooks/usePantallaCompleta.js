/**
 * usePantallaCompleta.js — l'estat de PantallaCompleta i el retorn del focus.
 *
 * Ordre del Mestre, 261001 · L'estat és efímer (decisió D6): no va a la URL,
 * i recarregar o compartir l'enllaç obri el bloc en mode normal. Viu a qui
 * munta la pàgina (CalendariSection), per damunt del que es refresca: així
 * sobreviu quan les dades tornen a carregar.
 *
 * usePantallaCompleta() → { oberta, obri(e), tanca(), idObridor }.
 *   obri rep l'event del clic i en guarda l'arrel (el Document a la SPA i el
 *   ShadowRoot dins d'un <soc-de-poble>: tots dos tenen getElementById).
 *   En tancar, el focus torna a l'element amb idObridor, que és el botó
 *   d'entrar tornat a muntar: per id, perquè el botó és nou i Boto no fa
 *   forwardRef. Si encara no hi és (s'ix mentre la pàgina carrega i el
 *   carregant no porta el botó), el retorn queda pendent i es torna a provar
 *   a cada commit de qui munta el hook, fins que el botó aparega o fins que
 *   algú porte el focus a una altra banda (mai se li pren).
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react';

/* El focus no és enlloc: el body del document (o res). Dins d'un ShadowRoot,
   que l'arrel no en tinga cap no basta: pot ser a la pàgina amfitriona. */
function focusLliure(arrel) {
  const doc = arrel.ownerDocument ?? arrel;
  const actiu = arrel.activeElement;
  if (actiu && actiu !== doc.body) return false;
  return !doc.activeElement || doc.activeElement === doc.body;
}

export function usePantallaCompleta() {
  const [oberta, setOberta] = useState(false);
  const idObridor = useId();
  const arrel = useRef(null);
  const eraOberta = useRef(false);
  const retornPendent = useRef(false);
  const obri = useCallback((e) => {
    arrel.current = e?.currentTarget?.getRootNode?.() ?? null;
    setOberta(true);
  }, []);
  const tanca = useCallback(() => setOberta(false), []);
  useEffect(() => {
    const tancada = eraOberta.current && !oberta;
    eraOberta.current = oberta;
    if (oberta) {
      retornPendent.current = false;
      return;
    }
    if (!tancada) return;
    const boto = arrel.current?.getElementById?.(idObridor);
    if (boto) boto.focus();
    else retornPendent.current = typeof arrel.current?.getElementById === 'function';
  }, [oberta, idObridor]);
  // Sense dependències: el botó pot arribar en un commit posterior al tancament.
  useEffect(() => {
    if (!retornPendent.current) return;
    if (!focusLliure(arrel.current)) {
      retornPendent.current = false;
      return;
    }
    const boto = arrel.current.getElementById(idObridor);
    if (!boto) return;
    retornPendent.current = false;
    boto.focus();
  });
  return { oberta, obri, tanca, idObridor };
}
