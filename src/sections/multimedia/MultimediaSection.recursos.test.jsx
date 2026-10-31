/** T5 · /multimedia amb la base dels recursos: la graella i la cronologia
 *  pinten el src resolt; sense base, el de sempre (Llei del Píxel). */
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext.jsx';

const LOGO = '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg';
const ERA = '/assets/towns/tibi/1.jpg';
const mocks = vi.hoisted(() => ({ multimedia: null }));

vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ children }) => <main>{children}</main>
}));
/* Onada 0.3 (Gauntlet 261016) · La secció carrega el cens de public/assets:
   un cens buit, perquè la prova continue mirant només els src de la graella i
   de la cronologia. Bloc E (IDEA-55 + P1-71) · El router en memòria de
   veres: la Fototeca és la vista de ?categoria=galeria_tots i la Cronologia,
   la de ?categoria=galeria_cronologia. */
vi.mock('./MultimediaContext', () => ({ useMultimedia: () => mocks.multimedia }));
vi.mock('./useCensImatges.js', () => ({ useCensImatges: () => ({ mitjans: [], cens: new Map() }) }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ towns: [] }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, text) => text }), useUIStateOpcional: () => null }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
import MultimediaSection from './MultimediaSection.jsx';
import { fixaBaseRecursos } from '../../config/assetResolver.js';

const PAQUET = 'https://wp.example/wp-content/plugins/socdepoble-enxufe/dist';

/* Un producte del Mercat (el logo cru de marketSeed), un poble i una URL ja
   absoluta, que no s'ha de tocar. */
mocks.multimedia = {
  mediaItems: [
    { id: 'market-0', title: 'Oli', src: LOGO, created_at: '2026-09-01T10:00:00Z' },
    { id: 'town-tibi', title: 'Tibi', src: ERA, created_at: '2026-08-01T10:00:00Z' },
    { id: 'feed-0', title: 'Fora', src: 'https://cdn.example/x.jpg', created_at: '2026-07-01T10:00:00Z' }
  ],
  mediaTimelineGroups: [{ key: '2026-09', label: 'Setembre 2026', items: [{ id: 'market-0', title: 'Oli', src: LOGO }, { id: 'town-tibi', title: 'Tibi', src: ERA }] }]
};

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1400);
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => {
  cleanup();
  fixaBaseRecursos('/');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/* Només la graella de la pàgina: la Columna 2 també pinta imatges a les fitxes. */
const srcs = (container) => [...container.querySelectorAll('.photo-grid img')].map((img) => img.getAttribute('src'));
const munta = (ruta) => render(<MemoryRouter rutaInicial={ruta}><MultimediaSection /></MemoryRouter>);

test('sense base, la graella i la cronologia pinten el src de sempre', () => {
  const graella = munta('/multimedia?categoria=galeria_tots');
  expect(srcs(graella.container)).toEqual([LOGO, ERA, 'https://cdn.example/x.jpg']);
  cleanup();
  const cronologia = munta('/multimedia?categoria=galeria_cronologia');
  expect(srcs(cronologia.container)).toEqual([LOGO, ERA]);
});

test('amb base, cap img de la graella ni de la cronologia demana /assets/ a l’arrel', () => {
  fixaBaseRecursos(PAQUET);
  const graella = munta('/multimedia?categoria=galeria_tots');
  expect(srcs(graella.container)).toEqual([`${PAQUET}${LOGO}`, `${PAQUET}${ERA}`, 'https://cdn.example/x.jpg']);
  expect(graella.container.querySelectorAll('.photo-grid img[src^="/assets/"]')).toHaveLength(0);
  cleanup();
  const cronologia = munta('/multimedia?categoria=galeria_cronologia');
  expect(srcs(cronologia.container)).toEqual([`${PAQUET}${LOGO}`, `${PAQUET}${ERA}`]);
  expect(cronologia.container.querySelectorAll('.photo-grid img[src^="/assets/"]')).toHaveLength(0);
});
