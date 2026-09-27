/**
 * PanellInicialMobil.jsx — en mode estret (UX-A05, UX-C04, UX-D08) primer es
 * veu la llista i, en obrir una conversa, la conversa a pantalla completa.
 *
 * AppGridShell perd el panell inicial en passar a estret (AppGridShell.jsx,
 * mesura): este component, muntat dins de la closca, li ho recorda amb
 * useAppGrid() sense tocar AppGridShell. No pinta res.
 */
import { useEffect } from 'react';
import { useAppGrid } from '../../../components/layout/AppGridShell.jsx';

export default function PanellInicialMobil({ llistaPrimer = true }) {
  const { mida, setPanellObert, tancaPanells } = useAppGrid();
  useEffect(() => {
    if (mida !== 'estret') return;
    if (llistaPrimer) setPanellObert('middle');
    else tancaPanells();
  }, [mida, llistaPrimer, setPanellObert, tancaPanells]);
  return null;
}
