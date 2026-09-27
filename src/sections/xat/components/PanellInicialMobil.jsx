/**
 * PanellInicialMobil.jsx — en mode estret (UX-A05, UX-C04, UX-D08) primer es
 * veu la llista i, en obrir una conversa, la conversa a pantalla completa.
 *
 * AppGridShell perd el panell inicial en passar a estret (AppGridShell.jsx,
 * mesura): este component, muntat dins de la closca, li ho recorda amb
 * useAppGrid() sense tocar AppGridShell. No pinta res. Va en fase de layout:
 * així cap fotograma pinta la columna equivocada ni les pestanyes de la closca
 * abans que la llista s'òbriga.
 */
import { useLayoutEffect } from 'react';
import { useAppGrid } from '../../../components/layout/AppGridShell.jsx';

export default function PanellInicialMobil({ llistaPrimer = true }) {
  const { mida, panellObert, setPanellObert, tancaPanells } = useAppGrid();
  useLayoutEffect(() => {
    if (mida !== 'estret') return;
    if (llistaPrimer) setPanellObert('middle');
    else tancaPanells();
  }, [mida, llistaPrimer, setPanellObert, tancaPanells]);

  /* Guarda: en estret, sense conversa ni opció triada, cap panell obert
     (null) deixaria a la vista la columna dreta buida amb el seu avís. Passe
     el que passe amb el panell (tancar-lo des de fora, girar el dispositiu),
     torna la llista. */
  useLayoutEffect(() => {
    if (mida === 'estret' && llistaPrimer && panellObert === null) setPanellObert('middle');
  }, [mida, llistaPrimer, panellObert, setPanellObert]);
  return null;
}
