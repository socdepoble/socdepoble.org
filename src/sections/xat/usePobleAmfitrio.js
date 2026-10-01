/**
 * usePobleAmfitrio.js — el poble que declara l'amfitrió ({ id, nom } o null),
 * llegit de la configuració externa i tornat a sanejar (pobleAmfitrio.js).
 * Estable mentre no canvien `poble` ni `nomPoble`.
 */
import { useMemo } from 'react';
import { useUIState } from '../../app/contexts/UIContext';
import { pobleDeConfig } from './pobleAmfitrio.js';

export default function usePobleAmfitrio() {
  const { externalConfig } = useUIState();
  const poble = externalConfig?.poble;
  const nomPoble = externalConfig?.nomPoble;
  return useMemo(() => pobleDeConfig({ poble, nomPoble }), [poble, nomPoble]);
}
