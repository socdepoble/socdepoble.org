/**
 * Model pur per a PublicacionsDelPoble (puresa Vite Fast Refresh / HMR · R32.24).
 */
export const PESTANYA_PER_DEFECTE_PUBLICACIONS_POBLE = 'gent';

export const VARIETAT_PORTA_PUBLICACIONS_POBLE = 'secundari';

export const clauResetPublicacionsPoble = (
  poble,
  pestanya = PESTANYA_PER_DEFECTE_PUBLICACIONS_POBLE,
) => `${String(poble?.id ?? '')}:${pestanya}`;
