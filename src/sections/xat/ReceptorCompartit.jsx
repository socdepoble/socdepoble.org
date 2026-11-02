/**
 * ReceptorCompartit.jsx — 261026 (ordre del Mestre, prompt 261026_1615,
 * tasques 2 i 3). Les entrades que porten la persona al Xat, siga on siga de
 * l'App:
 *   · el menú «Compartir» del dispositiu: el lot arriba al registre
 *     (config/compartirNatiu.js) i el Xat obri «Envia a…» (DialegCompartir);
 *   · el toc d'un avís local del sistema (config/avisosNatius.js): obri el
 *     seu xat;
 *   · B8C-6 (marató 261101_2143) · els avisos push del Xat
 *     (config/avisosPushXat.js): la sincronització sense preguntar
 *     (useSincronitzaAvisosPush) i el toc d'un avís, que és cec i obri la
 *     conversa resolta amb la sessió d'ara (useObriDesDeLAvis).
 * Muntat per App.jsx dins de XatProvider, on hi ha el router. A la web, els
 * dos primers registres hi queden buits; els avisos push hi entren només amb
 * la bandera encesa (AVISOS_PUSH_XAT_ACTIUS): apagada, no fan res.
 */
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from '../../app/contexts/RouterContext';
import { escoltaTocAvis } from '../../config/avisosNatius.js';
import useCompartitPendent from './useCompartitPendent.js';
import { useSincronitzaAvisosPush } from './useAvisosPushXat.js';
import useObriDesDeLAvis from './useObriDesDeLAvis.js';

const RUTA_XAT = /(^|\/)xat(\/|$)/;

export default function ReceptorCompartit() {
  const lot = useCompartitPendent();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const portat = useRef(null);
  useSincronitzaAvisosPush();
  useObriDesDeLAvis();
  useEffect(() => {
    if (!lot || lot.desti || portat.current === lot.id) return;
    portat.current = lot.id;
    if (!RUTA_XAT.test(String(pathname || ''))) navigate('/xat');
  }, [lot, pathname, navigate]);
  useEffect(() => escoltaTocAvis(({ filId }) => navigate(`/xat/${encodeURIComponent(filId)}`)), [navigate]);
  return null;
}
