/** T5 · /multimedia amb la base dels recursos: la graella i la cronologia
 *  pinten el src resolt; sense base, el de sempre (Llei del Píxel). */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

const LOGO = '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg';
const ERA = '/assets/towns/tibi/1.jpg';
const mocks = vi.hoisted(() => ({ multimedia: null }));

vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ children }) => <main>{children}</main>
}));
/* Onada 0.3 (Gauntlet 261016) · La secció llig ?foto= (el visor) i carrega el
   cens de public/assets: dobles del router i d'un cens buit, perquè la prova
   continue mirant només els src de la graella i de la cronologia. */
vi.mock('../../app/contexts/RouterContext', () => ({
  Link: ({ to, children, className }) => <a href={to} className={className}>{children}</a>,
  useSearchParams: () => [new URLSearchParams(''), () => {}],
  useLocation: () => ({ pathname: '/multimedia', search: '', state: null }),
  useNavigate: () => () => {}
}));
vi.mock('../../config/navigation', () => ({ getSectionItemPath: (seccio, id) => `/${seccio}/${id}` }));
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

afterEach(() => {
  cleanup();
  fixaBaseRecursos('/');
});

const srcs = (container) => [...container.querySelectorAll('img')].map((img) => img.getAttribute('src'));

test('sense base, la graella i la cronologia pinten el src de sempre', () => {
  const { container } = render(<MultimediaSection />);
  expect(srcs(container)).toEqual([LOGO, ERA, 'https://cdn.example/x.jpg']);
  fireEvent.click(screen.getByRole('button', { name: 'Cronologia' }));
  expect(srcs(container)).toEqual([LOGO, ERA]);
});

test('amb base, cap img de la graella ni de la cronologia demana /assets/ a l’arrel', () => {
  fixaBaseRecursos(PAQUET);
  const { container } = render(<MultimediaSection />);
  expect(srcs(container)).toEqual([`${PAQUET}${LOGO}`, `${PAQUET}${ERA}`, 'https://cdn.example/x.jpg']);
  fireEvent.click(screen.getByRole('button', { name: 'Cronologia' }));
  expect(srcs(container)).toEqual([`${PAQUET}${LOGO}`, `${PAQUET}${ERA}`]);
  expect(container.querySelectorAll('img[src^="/assets/"]')).toHaveLength(0);
});
