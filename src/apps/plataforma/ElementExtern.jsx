/**
 * Plataforma d'Apps Enxufables · el pont amb una app externa.
 *
 * Una app externa (WordPress, Sollutia) és un custom element registrat per
 * l'amfitrió. La closca el pinta amb dos atributs i res més:
 *   data-sdp-app   · l'id de l'app;
 *   data-sdp-ruta  · el camí dins de l'app ('/caixa/t-3'), ja validat.
 * L'element demana navegar amb un CustomEvent ESDEVENIMENT_NAVEGA disparat
 * DES DE L'ELEMENT (o composed des del seu Shadow DOM), amb
 * detail: { ruta: 'caixa/t-3', replace?: true }. La closca valida els trams
 * (rutesAplicacio.js) i que el primer siga una entrada del manifest, i fa push
 * (replace només si l'element canonitza). Els tokens --sdp-* hereten a
 * través de la frontera del Shadow DOM.
 */
import { createElement, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from '../../app/contexts/RouterContext';
import { rutaDeApp } from './manifestApp.js';
import { restaDeApp, tramsSegurs } from './rutesAplicacio.js';

export const ESDEVENIMENT_NAVEGA = 'sdp:app-navega';

export function ElementExtern({ manifest }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const ref = useRef(null);
  const resta = restaDeApp(pathname);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const alNavegar = (event) => {
      const desti = event?.detail?.ruta;
      const trams = tramsSegurs(typeof desti === 'string' ? desti : '');
      if (!trams || !trams.length || !manifest.entrades.some((entrada) => entrada.slug === trams[0])) return;
      navigate(rutaDeApp(manifest.id, ...trams), { replace: event.detail.replace === true });
    };
    node.addEventListener(ESDEVENIMENT_NAVEGA, alNavegar);
    return () => node.removeEventListener(ESDEVENIMENT_NAVEGA, alNavegar);
  }, [manifest, navigate]);

  return createElement(manifest.element, { ref, 'data-sdp-app': manifest.id, 'data-sdp-ruta': `/${resta}` });
}
