/**
 * ReceptorCompartit.jsx — 261026 (ordre del Mestre, prompt 261026_1615,
 * tasques 2 i 3). Les dues entrades natives que porten la persona al Xat, siga
 * on siga de l'App:
 *   · el menú «Compartir» del dispositiu: el lot arriba al registre
 *     (config/compartirNatiu.js) i el Xat obri «Envia a…» (DialegCompartir);
 *   · el toc d'un avís del sistema (config/avisosNatius.js): obri el seu xat.
 * Muntat per App.jsx dins de XatProvider, on hi ha el router. A la web no
 * passa mai res: els dos registres hi queden buits.
 */
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from '../../app/contexts/RouterContext';
import { escoltaTocAvis } from '../../config/avisosNatius.js';
import useCompartitPendent from './useCompartitPendent.js';

const RUTA_XAT = /(^|\/)xat(\/|$)/;

export default function ReceptorCompartit() {
  const lot = useCompartitPendent();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const portat = useRef(null);
  useEffect(() => {
    if (!lot || lot.desti || portat.current === lot.id) return;
    portat.current = lot.id;
    if (!RUTA_XAT.test(String(pathname || ''))) navigate('/xat');
  }, [lot, pathname, navigate]);
  useEffect(() => escoltaTocAvis(({ filId }) => navigate(`/xat/${encodeURIComponent(filId)}`)), [navigate]);
  return null;
}
