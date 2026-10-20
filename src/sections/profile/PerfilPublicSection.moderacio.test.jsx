import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* Fase D (261020, tasca 2; pla 261020_1300; crítica 261020, 6) · Des de
   2610181800 els perfils són públics per defecte: el nom, l'avatar i la
   presentació són contingut de la gent, i Google Play demana poder-los
   denunciar i bloquejar. La fitxa pública d'una altra persona porta «Més
   opcions» a la barra taronja; la pròpia, la del pilot i la de la IAIA, no.
   Els mateixos dobles que PerfilPublicSection.test.jsx, i un valor de
   moderació de mentida amb les regles de veres (config/moderacio.js). */
const mocks = vi.hoisted(() => ({
  id: 'pepa', navigate: vi.fn(), load: vi.fn(), seo: vi.fn(), toast: vi.fn(),
  config: {}, t: (_, alternativa) => alternativa, resolveAsset: (v) => v, agents: [],
  identitat: { memberships: [], actor: null, setActor: vi.fn() },
  xat: { senseSessio: false }
}));
vi.mock('../xat/XatContext', () => ({ useXat: () => mocks.xat }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => mocks.identitat }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useParams: () => ({ agentId: mocks.id }),
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ pathname: `/perfil/${mocks.id}` }),
  useRouter: () => ({ navigate: mocks.navigate, currentPath: `/perfil/${mocks.id}`, basename: '' }),
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: mocks.t, resolveAsset: mocks.resolveAsset }),
  useUIState: () => ({ externalConfig: mocks.config, locale: 'ca-ES', language: 'ca' })
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: (opcions) => mocks.seo(opcions) }));
vi.mock('../../data/backendPort.js', () => ({ teCapacitat: () => true, loadPerfilPublic: mocks.load }));
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));
import PerfilPublicSection from './PerfilPublicSection.jsx';
import { ModeracioContext } from '../../components/PedraSeca/hooks/moderacioDePoble.js';
import { objectiuDeTargeta } from '../../config/moderacio.js';
import { oblidaEntitatDelProjecte } from '../../config/navigation.js';

const PEPA = {
  tipus: 'persona', id: 'pepa', slug: 'pepa', nom: 'Pepa Garcia', avatar: '', hero: '', lema: '', bio: 'Mestra jubilada',
  presentacioHtml: '', poble: 'La Torre de les Maçanes', esIA: false, publicat: true, propietari: false, copyright: ''
};
const valor = () => ({
  disponible: true,
  potBloquejar: true,
  objectiuDeTargeta: (objecte) => objectiuDeTargeta(objecte),
  demanaDenuncia: vi.fn(),
  demanaBloqueig: vi.fn()
});
const arbre = (context) => (
  <ModeracioContext.Provider value={context}><PerfilPublicSection agents={mocks.agents} /></ModeracioContext.Provider>
);

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks(); mocks.id = 'pepa'; mocks.load.mockResolvedValue(PEPA);
  mocks.identitat = { memberships: [], actor: null, setActor: vi.fn(() => true) };
  oblidaEntitatDelProjecte();
});

test('la fitxa d’una altra persona porta «Més opcions»: «Denuncia Pepa Garcia» i «Bloqueja Pepa Garcia»', async () => {
  const context = valor();
  render(arbre(context));
  const boto = await screen.findByRole('button', { name: 'Més opcions: Pepa Garcia' });
  expect(boto.closest('section.bar-orange')).not.toBeNull();
  act(() => { fireEvent.click(boto); });
  expect(screen.getAllByRole('menuitem').map((fila) => fila.textContent)).toEqual(['Denuncia Pepa Garcia', 'Bloqueja Pepa Garcia']);
  act(() => { fireEvent.click(screen.getByRole('menuitem', { name: 'Denuncia Pepa Garcia' })); });
  expect(context.demanaDenuncia).toHaveBeenCalledWith(expect.objectContaining({
    tipus: 'persona', id: 'pepa', autor: expect.objectContaining({ tipus: 'persona', id: 'pepa', nom: 'Pepa Garcia' }), bloquejable: true
  }), boto);
});

test('la fitxa pròpia no en porta', async () => {
  mocks.load.mockResolvedValue({ ...PEPA, propietari: true });
  render(arbre(valor()));
  expect(await screen.findByRole('heading', { level: 1, name: 'Pepa Garcia' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: /^Més opcions/ })).toBeNull();
});

test('sense proveïdor de moderació, la fitxa de sempre', async () => {
  render(<PerfilPublicSection agents={mocks.agents} />);
  expect(await screen.findByRole('heading', { level: 1, name: 'Pepa Garcia' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: /^Més opcions/ })).toBeNull();
});
