/**
 * ComptadorGlobalXat.jsx — R24 · xat_entrega (IDEA-260 b, P1-4).
 *
 * Qui entra pel Mur (o per qualsevol secció) ha de saber que té missatges.
 * El comptador és useXat().totalNoLlegits (sumaNoLlegits: sense silenciades ni
 * arxivades, i 0 sense sessió). La closca viu per damunt de XatProvider: el
 * total hi arriba pel pont de noLlegitsGlobalsXat.js, que ComptadorGlobalXat
 * (muntat dins de XatProvider) publica. Ix en tres llocs:
 *   · l'entrada «Xat» de la barra lateral i de la barra mòbil (App.jsx): la
 *     pastilla del Xat (PastillaNoLlegits) i el nom accessible de l'enllaç,
 *     «Xat, 3 missatges no llegits» (l'aria-label de l'enllaç mana sobre el
 *     text de dins);
 *   · el títol de la pestanya fora del Xat, «(3) Mur | Sóc de Poble», pel
 *     propietari únic del <head> (seoHead.fixaPrefixDelTitol). Dins del Xat el
 *     posa XatSection, com sempre;
 *   · la insígnia de l'app instal·lada (navigator.setAppBadge), només si el
 *     navegador la té. Un rebuig (pestanya normal, iframe) es calla: cap soroll
 *     a la consola. R24 · Gauntlet (G-client-5) · La insígnia és de l'ORIGEN
 *     del document: incrustat en un amfitrió (__SDP_EMBEDDED__, un iframe o un
 *     amfitrió que no cedix el <head>), el Mas no l'escriu ni l'esborra mai.
 *     App.jsx passa `amaDelDocument` (esAmaDelDocument(externalConfig), el
 *     criteri del contrast i de la llengua); sense la prop, només l'escriu un
 *     document de primer nivell que no és incrustat.
 */
import { useEffect } from 'react';
import { useLocation } from '../../app/contexts/RouterContext';
import { fixaPrefixDelTitol } from '../../hooks/seoHead.js';
import { useXat } from './XatContext.jsx';
import PastillaNoLlegits from './components/PastillaNoLlegits.jsx';
import { useFixaNoLlegitsGlobalsXat, useNoLlegitsGlobalsXat } from './noLlegitsGlobalsXat.js';
import {
  RUTA_XAT,
  actualitzaInsigniaApp,
  esDocumentPropi,
  quantsNoLlegits,
  textNoLlegits,
  traductorXat,
} from './comptadorGlobalXatModel.js';

/**
 * L'entrada «Xat» amb el comptador: `children(nomAccessible, insignia)` pinta
 * l'enllaç de sempre. Sense no llegits, el nom de sempre i cap insígnia.
 */
export function AmbNoLlegitsDelXat({ etiqueta, t, children }) {
  const n = quantsNoLlegits(useNoLlegitsGlobalsXat());
  if (!n) return children(etiqueta, null);
  const tr = traductorXat(t);
  return children(`${etiqueta}, ${textNoLlegits(n, tr)}`, (
    <span className="nav-item__insignia" aria-hidden="true">
      <PastillaNoLlegits quants={n} t={tr} />
    </span>
  ));
}

/** Muntat una sola vegada dins de XatProvider (App.jsx): el pont, el títol i la insígnia. */
export function ComptadorGlobalXat({ amaDelDocument } = {}) {
  const { totalNoLlegits } = useXat();
  const { pathname } = useLocation();
  const fixa = useFixaNoLlegitsGlobalsXat();
  const n = quantsNoLlegits(totalNoLlegits);
  const dinsDelXat = RUTA_XAT.test(pathname || '');
  useEffect(() => {
    fixa?.(n);
  }, [fixa, n]);
  useEffect(() => () => fixa?.(0), [fixa]);
  useEffect(() => {
    fixaPrefixDelTitol(n && !dinsDelXat ? `(${n}) ` : '');
  }, [n, dinsDelXat]);
  useEffect(() => () => fixaPrefixDelTitol(''), []);
  const potInsignia = amaDelDocument === undefined ? esDocumentPropi() : amaDelDocument === true;
  useEffect(() => {
    if (potInsignia) actualitzaInsigniaApp(n);
  }, [n, potInsignia]);
  return null;
}
