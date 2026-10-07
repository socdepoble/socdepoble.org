/**
 * Revisió del 261007 · Un mateix producte diu el mateix a les tres
 * superfícies: la targeta del Mercat, la del Mur i la seua pàgina.
 *  · I1 i M3-02 · els drets: els triats al producte o, sense, el text de
 *    sèrie (COPYRIGHT_SDP, CC BY-NC-SA 4.0). El Mercat escrivia a mà
 *    «© Sóc de Poble / …» i no llegia item.copyright.
 *  · I2 · la foto principal: la primera de les fotos del producte
 *    (imatgesDeProducte), mai el logotip de qui ven. En remot, el mapejador
 *    posa el logotip a image_url quan el producte no porta image_url ni
 *    image, i el Mur el pintava davant de la foto. Sense cap foto pròpia, cada
 *    targeta conserva la seua reserva (pendent del Mestre).
 */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), mur: null }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa }),
  useUIState: () => ({ externalConfig: {} })
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../mur/MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ status: 'ready', towns: [] }) }));
vi.mock('../multimedia/MultimediaContext', () => ({ useMultimedia: () => ({ status: 'ready', mediaItems: [] }) }));

import MercatSection from './MercatSection.jsx';
import { MARKET_ITEMS } from './marketContent.js';
import { TargetaDelMur } from '../mur/TargetaDelMur.jsx';
import { paginaDElement } from '../detail/elementDeSeccio.js';
import { buildMercatDetailSectionMeta } from '../detail/detailSectionMeta.jsx';
import { COPYRIGHT_SDP } from '../../components/universal/editorial.js';

const t = (_, alternativa) => alternativa;
const LOGO = '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg';
const SAMARRETA = MARKET_ITEMS.find((item) => item.id === 'samarreta-socdepoble');

const targetaDe = (arrel, titol) => [...arrel.querySelectorAll('article')]
  .find((article) => article.querySelector('.sp-card-title')?.textContent === titol);
const dretsDe = (targeta) => targeta.querySelector('.sp-card-copyright')?.textContent ?? null;
const fotoDe = (targeta) => targeta.querySelector('img.sp-card-media')?.getAttribute('src') ?? null;

/* Les tres superfícies d'un producte: { mercat, mur, pagina }. */
function superficies(item) {
  mocks.mur = { status: 'ready', sortedMarketItems: [item] };
  const mercat = targetaDe(render(<MercatSection />).container, item.title);
  const mur = render(<TargetaDelMur item={item} />).container.querySelector('article');
  const pagina = paginaDElement(buildMercatDetailSectionMeta({ marketItems: [item], t }), item);
  return { mercat, mur, pagina };
}

afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); });

describe('I1 · M3-02 · els drets', () => {
  test('sense drets propis (la Samarreta de la llavor): el text de sèrie, el mateix a les tres', () => {
    expect(SAMARRETA.copyright).toBeUndefined();
    const { mercat, mur, pagina } = superficies(SAMARRETA);
    expect([dretsDe(mercat), dretsDe(mur), pagina.copyright]).toEqual([COPYRIGHT_SDP, COPYRIGHT_SDP, COPYRIGHT_SDP]);
    expect(dretsDe(mercat)).not.toContain('©');
  });

  test('amb drets propis: els seus, el mateix a les tres', () => {
    const propis = 'CC BY 4.0 Pepa Ferrer';
    const { mercat, mur, pagina } = superficies({ ...SAMARRETA, id: 'cistella', title: 'Cistella de vímet', copyright: propis });
    expect([dretsDe(mercat), dretsDe(mur), pagina.copyright]).toEqual([propis, propis, propis]);
  });
});

describe('I2 · la foto principal', () => {
  test('la Samarreta de la llavor: la xica, a les tres', () => {
    const { mercat, mur, pagina } = superficies(SAMARRETA);
    expect([fotoDe(mercat), fotoDe(mur), pagina.heroImage]).toEqual([SAMARRETA.images[0], SAMARRETA.images[0], SAMARRETA.images[0]]);
  });

  test('en remot, amb fotos i el logotip a image_url (el mapejador): la foto, mai el logotip, a les tres', () => {
    const remot = {
      id: 'banc', type: 'product', title: 'Banc de fusta', seller: 'Pepa', author_id: 'pepa',
      avatar_url: LOGO, imageSrc: LOGO, image_url: LOGO, image: LOGO,
      images: ['/assets/uploads/banc-1.jpg', '/assets/uploads/banc-2.jpg'],
      created_at: '2026-09-02T10:00:00.000Z'
    };
    const { mercat, mur, pagina } = superficies(remot);
    expect([fotoDe(mercat), fotoDe(mur), pagina.heroImage]).toEqual(['/assets/uploads/banc-1.jpg', '/assets/uploads/banc-1.jpg', '/assets/uploads/banc-1.jpg']);
  });

  /* Llei del Píxel · Sense cap foto pròpia, les targetes conserven la seua
     reserva de sempre i la pàgina no porta portada. Si la reserva s'ha de
     llevar és decisió pendent del Mestre. */
  test('sense cap foto pròpia: la reserva de sempre a les targetes, i cap portada a la pàgina', () => {
    const senseFoto = {
      id: 'cadira', type: 'product', title: 'Cadira de bova', seller: 'Pepa', author_id: 'pepa',
      avatar_url: LOGO, imageSrc: LOGO, image_url: LOGO, image: LOGO, created_at: '2026-09-01T10:00:00.000Z'
    };
    const { mercat, mur, pagina } = superficies(senseFoto);
    expect([fotoDe(mercat), fotoDe(mur), pagina.heroImage]).toEqual([LOGO, LOGO, null]);
  });
});
