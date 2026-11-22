import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

/* v1.2.19 · P0-CONSOLA-ZERO (ordre del Mestre, 22-11-2026 00:02; captura
   01_produccio/261122_0002_captura_errors_consola_vite_preload_404_i_socdepoble_cat_video.png) · El curs de pedra en sec
   del Mur porta un vídeo de socdepoble.cat. Amb preload="metadata" el navegador el demanava en muntar la targeta, i quan
   l'origen no responia la consola de producció ixia en roig (ERR_CONNECTION_TIMED_OUT). En repòs, la targeta només
   pinta el pòster local: el vídeo es demana quan algú prem «reproduir». */
vi.mock('../../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children),
}));
vi.mock('../../universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa }),
  useUIActionsOpcional: () => null,
  useUIState: () => ({ externalConfig: {} }),
  useUIStateOpcional: () => null,
}));

import { UniversalCard } from './UniversalCard.jsx';
import { CURSOS_PEDRA_EN_SEC_2026_EVENT as CURS } from '../../../sections/mur/eventsSeed.js';

afterEach(() => cleanup());

describe('P0-CONSOLA-ZERO · el vídeo editorial no es demana en repòs', () => {
  test('la targeta del curs de pedra en sec pinta el pòster local i el vídeo amb preload="none"', () => {
    expect(CURS.video_url).toBe('https://socdepoble.cat/media/cursos-pedra-en-sec-fageca-alcosser-2026.mp4');
    expect(CURS.image_url).toBe('/assets/events/cursos_pedra_en_sec_2026_poster.webp');
    const { container } = render(<UniversalCard title={CURS.title} imageUrl={CURS.image_url} imageAlt={CURS.imageAlt} videoUrl={CURS.video_url} />);
    const video = container.querySelector('video.sp-card-media--video');
    expect(video).toBeTruthy();
    expect(video.getAttribute('preload')).toBe('none');
    expect(video.getAttribute('poster')).toBe(CURS.image_url);
    expect(video.hasAttribute('autoplay')).toBe(false);
    expect(container.querySelectorAll('video[preload="metadata"], video[preload="auto"], video:not([preload])')).toHaveLength(0);
  });
});
