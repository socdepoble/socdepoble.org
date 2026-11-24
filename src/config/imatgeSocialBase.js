export const ORIGEN_SOCIAL_PER_DEFECTE = 'https://socdepoble.org';
const congela = (objecte) => {
  for (const valor of Object.values(objecte)) if (valor && typeof valor === 'object') congela(valor);
  return Object.freeze(objecte);
};
export const CAP_SOCIAL_BASE = congela({
  title: 'Sóc de Poble',
  description: 'Portal de pobles connectats',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  image: {
    url: '/assets/system/ui/og-socdepoble-1200x630.png',
    type: 'image/png',
    width: '1200',
    height: '630',
    alt: 'Logotip de Sóc de Poble, Portal de Pobles Connectats, sobre el mapa verd'
  }
});
export const ATRIBUT_SSR = 'data-sdp-ssr';
export const MARQUES = Object.freeze({
  avatar: '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png',
  clar: '/assets/system/ui/logo-socdepoble-rect-negre-985x256.png',
  fosc: '/assets/system/ui/logo-socdepoble-rect-blanc-985x256.png'
});
export const MARQUES_SVG_ANTIGUES = Object.freeze({
  avatar: '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg',
  clar: '/assets/system/ui/logo-socdepoble-rect-negre.svg',
  fosc: '/assets/system/ui/logo-socdepoble-rect-blanc.svg'
});
export const HERO_PER_DEFECTE = '/assets/uploads/brain/hero_panoramic_rural_view_1774720664221.png';
