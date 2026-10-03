/**
 * usePobleAmfitrio.js — el poble que declara l'amfitrió ({ id, nom } o null),
 * llegit de la configuració externa i tornat a sanejar (pobleAmfitrio.js).
 * Estable mentre no canvien `poble` ni `nomPoble`.
 */
import { useMemo } from 'react';
import { useUIState } from '../../app/contexts/UIContext';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { avatarDelPoble, pobleDeConfig } from './pobleAmfitrio.js';

export default function usePobleAmfitrio() {
  const { externalConfig } = useUIState();
  const poble = externalConfig?.poble;
  const nomPoble = externalConfig?.nomPoble;
  return useMemo(() => pobleDeConfig({ poble, nomPoble }), [poble, nomPoble]);
}

/**
 * Onada 3 (AV, revisió) · El poble de l'amfitrió i la seua cara, la de la
 * fitxa de Pobles (avatarDelPoble), per a les superfícies que pinten fils fora
 * de XatSection: el rail de la closca (ClosCaXat) i els Preferits del full
 * «Ajustos» (FullAjustos). Amb sessió, el servidor no dona cap imatge a la
 * comunitat d'un poble, i sense això eixes superfícies hi pintaven les
 * inicials mentre la llista ja portava la cara. Sense poble o sense fitxa,
 * `cara` és null i res no canvia.
 */
export function useCaraDelPoble() {
  const poble = usePobleAmfitrio();
  const { towns } = useCoreContent();
  const cara = useMemo(() => avatarDelPoble(poble, towns), [poble, towns]);
  return { poble, cara };
}
