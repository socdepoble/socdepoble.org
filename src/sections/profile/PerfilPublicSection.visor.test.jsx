import React from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/* Gauntlet 261025_0545 (CUR-01) · La fitxa pública es llig PER A QUI MIRA:
   `propietari` («La teua fitxa», «Edita la fitxa») i «Veïnat connectat amb
   tu» (quiEmSegueix, la llista privada de la persona que té la sessió) són
   d'eixa persona. Si la sessió s'acaba (eixida en una altra pestanya,
   renovació fallida, expulsió de l'amfitrió) o canvia d'A a B, la fitxa
   d'abans no es queda a la pantalla: es buida en el mateix pintat, es torna a
   llegir per a qui mira ara i una resposta tardana de l'altra identitat es
   descarta. La mateixa persona amb un objecte d'usuari nou (la renovació
   del JWT) no torna a llegir res (T9-1).
   Els mateixos dobles que PerfilPublicSection.seguidors.test.jsx, més la
   sessió de React (useSessioOpcional) i el comptador d'entrades. */
const mocks = vi.hoisted(() => ({
  id: 'pepa', navigate: vi.fn(), load: vi.fn(), qui: vi.fn(), seo: vi.fn(), toast: vi.fn(),
  config: { dataMode: 'seed' }, t: (_, alternativa) => alternativa, resolveAsset: (v) => v, agents: [],
  capacitats: new Set(['directori', 'seguiments']),
  identitat: { memberships: [], actor: null, setActor: vi.fn() },
  xat: { senseSessio: false },
  sessio: null, entrada: 0
}));
vi.mock('../xat/XatContext', () => ({ useXat: () => mocks.xat }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => mocks.identitat }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({
  useSession: () => mocks.sessio,
  useSessioOpcional: () => mocks.sessio
}));
vi.mock('../../data/identitat.js', async (importOriginal) => ({
  ...(await importOriginal()),
  entradaSessio: () => mocks.entrada
}));
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
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: (capacitat) => mocks.capacitats.has(capacitat),
  loadPerfilPublic: mocks.load,
  quiEmSegueix: (...args) => mocks.qui(...args)
}));
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));
import PerfilPublicSection, { FitxaPublica } from './PerfilPublicSection.jsx';
import { oblidaEntitatDelProjecte } from '../../config/navigation.js';

const PEPA = {
  tipus: 'persona', id: 'pepa', slug: 'pepa', nom: 'Pepa Garcia', avatar: '', hero: '', lema: '', bio: 'Mestra jubilada',
  presentacioHtml: '', poble: 'La Torre de les Maçanes', esIA: false, publicat: true, propietari: false, copyright: ''
};
const DE_PEPA = Object.freeze({ ...PEPA, propietari: true });
const sessioDe = (id) => ({ currentUser: id ? { id, email: `${id}@poble.test` } : null, estat: id ? 'dins' : 'fora' });
const titol = () => screen.queryByRole('heading', { level: 3, name: 'Veïnat connectat amb tu' });
const insignia = () => screen.queryByText('La teua fitxa');
const llistaPrivada = () => screen.queryByText(/Rosa Pérez/);
const diferida = () => {
  let resol;
  const promesa = new Promise((r) => { resol = r; });
  return { promesa, resol };
};
const espera = (ms = 30) => act(async () => { await new Promise((r) => setTimeout(r, ms)); });

/* La fitxa pròpia de Pepa, amb la llista privada pintada. */
async function pintaLaDePepa() {
  mocks.load.mockResolvedValueOnce(DE_PEPA);
  const vista = render(<PerfilPublicSection agents={mocks.agents} />);
  expect(await screen.findByText(/Rosa Pérez/)).toBeTruthy();
  expect(insignia()).toBeTruthy();
  expect(mocks.load).toHaveBeenCalledTimes(1);
  expect(mocks.qui).toHaveBeenCalledTimes(1);
  return vista;
}

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.load.mockReset();
  mocks.id = 'pepa';
  mocks.capacitats = new Set(['directori', 'seguiments']);
  mocks.qui.mockResolvedValue([{ id: 'u-rosa', nom: 'Rosa Pérez', creatAl: '2026-10-24T09:00:00Z' }]);
  mocks.identitat = { memberships: [], actor: null, setActor: vi.fn(() => true) };
  mocks.xat = { senseSessio: false };
  mocks.sessio = sessioDe('pepa');
  mocks.entrada = 1;
  oblidaEntitatDelProjecte();
});

describe('CUR-01 · la fitxa pública és de qui mira', () => {
  test('la sessió de Pepa s’acaba: la llista privada i «La teua fitxa» se’n van i la fitxa es torna a llegir sense sessió', async () => {
    const vista = await pintaLaDePepa();
    /* El que el port torna sense sessió: la mateixa fitxa, de ningú. */
    const sense = diferida();
    mocks.load.mockReturnValueOnce(sense.promesa);
    mocks.sessio = sessioDe(null);
    mocks.entrada = 2;
    mocks.xat = { senseSessio: true };
    vista.rerender(<PerfilPublicSection agents={mocks.agents} />);
    /* En el mateix pintat: res de Pepa a la pantalla mentre es torna a llegir. */
    expect(llistaPrivada()).toBeNull();
    expect(titol()).toBeNull();
    expect(insignia()).toBeNull();
    await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(2));
    await act(async () => { sense.resol(PEPA); });
    expect(await screen.findByRole('heading', { level: 1, name: 'Pepa Garcia' })).toBeTruthy();
    expect(llistaPrivada()).toBeNull();
    expect(titol()).toBeNull();
    expect(insignia()).toBeNull();
    /* Cap relectura de quiEmSegueix sense sessió. */
    expect(mocks.qui).toHaveBeenCalledTimes(1);
  });

  test('la sessió passa de Pepa a Biel: Biel no veu la llista de Pepa ni «La teua fitxa»', async () => {
    const vista = await pintaLaDePepa();
    mocks.load.mockResolvedValueOnce(PEPA);
    mocks.qui.mockResolvedValue([{ id: 'u-toni', nom: 'Toni de Biel', creatAl: '2026-10-25T09:00:00Z' }]);
    mocks.sessio = sessioDe('biel');
    mocks.entrada = 2;
    vista.rerender(<PerfilPublicSection agents={mocks.agents} />);
    expect(llistaPrivada()).toBeNull();
    expect(insignia()).toBeNull();
    expect(await screen.findByRole('heading', { level: 1, name: 'Pepa Garcia' })).toBeTruthy();
    await espera();
    expect(mocks.load).toHaveBeenCalledTimes(2);
    expect(llistaPrivada()).toBeNull();
    expect(screen.queryByText(/Toni de Biel/)).toBeNull();
    expect(titol()).toBeNull();
    expect(insignia()).toBeNull();
    expect(mocks.qui).toHaveBeenCalledTimes(1);
  });

  test('una resposta tardana de la identitat d’abans es descarta: mana la de qui mira ara', async () => {
    const dePepa = diferida();
    const deBiel = diferida();
    mocks.load.mockReturnValueOnce(dePepa.promesa).mockReturnValueOnce(deBiel.promesa);
    const vista = render(<PerfilPublicSection agents={mocks.agents} />);
    await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(1));
    mocks.sessio = sessioDe('biel');
    mocks.entrada = 2;
    vista.rerender(<PerfilPublicSection agents={mocks.agents} />);
    await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(2));
    /* La de Pepa arriba tard (un amfitrió que no fa cas del senyal): no es pinta. */
    await act(async () => { dePepa.resol(DE_PEPA); });
    await espera();
    expect(insignia()).toBeNull();
    expect(titol()).toBeNull();
    expect(mocks.qui).not.toHaveBeenCalled();
    await act(async () => { deBiel.resol(PEPA); });
    expect(await screen.findByRole('heading', { level: 1, name: 'Pepa Garcia' })).toBeTruthy();
    expect(insignia()).toBeNull();
    expect(titol()).toBeNull();
    expect(mocks.qui).not.toHaveBeenCalled();
  });

  test('tornar a entrar (la mateixa persona, entrada nova) també torna a llegir la fitxa', async () => {
    const vista = await pintaLaDePepa();
    mocks.load.mockResolvedValueOnce(DE_PEPA);
    mocks.entrada = 2;
    mocks.sessio = sessioDe('pepa');
    vista.rerender(<PerfilPublicSection agents={mocks.agents} />);
    await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(2));
    expect(await screen.findByText(/Rosa Pérez/)).toBeTruthy();
    expect(mocks.qui).toHaveBeenCalledTimes(2);
  });

  test('T9-1 · la mateixa persona i la mateixa entrada (la renovació del JWT, un objecte nou) no tornen a llegir res', async () => {
    const vista = await pintaLaDePepa();
    mocks.sessio = { ...sessioDe('pepa'), currentUser: { id: 'pepa', email: 'pepa@poble.test', nom: 'Pepa' } };
    vista.rerender(<PerfilPublicSection agents={mocks.agents} />);
    expect(llistaPrivada()).toBeTruthy();
    await espera();
    expect(mocks.load).toHaveBeenCalledTimes(1);
    expect(mocks.qui).toHaveBeenCalledTimes(1);
    expect(llistaPrivada()).toBeTruthy();
    expect(insignia()).toBeTruthy();
  });

  test('sense cap proveïdor de sessió (una peça muntada sola), el de sempre: la fitxa pròpia porta la llista', async () => {
    mocks.sessio = null;
    mocks.load.mockResolvedValueOnce(DE_PEPA);
    render(<PerfilPublicSection agents={mocks.agents} />);
    expect(await screen.findByText(/Rosa Pérez/)).toBeTruthy();
    expect(titol()).toBeTruthy();
    expect(mocks.load).toHaveBeenCalledTimes(1);
  });
});

describe('CUR-01 · FitxaPublica només pinta la llista privada per a la persona de la fitxa', () => {
  test('una fitxa marcada `propietari` d’una altra persona (la sessió és de Biel) no porta la llista de ningú', async () => {
    mocks.sessio = sessioDe('biel');
    render(<FitxaPublica perfil={DE_PEPA} />);
    await espera();
    expect(titol()).toBeNull();
    expect(mocks.qui).not.toHaveBeenCalled();
  });

  test('sense sessió, tampoc', async () => {
    mocks.sessio = sessioDe(null);
    render(<FitxaPublica perfil={DE_PEPA} />);
    await espera();
    expect(titol()).toBeNull();
    expect(mocks.qui).not.toHaveBeenCalled();
  });

  test('la de Pepa amb la sessió de Pepa, sí', async () => {
    render(<FitxaPublica perfil={DE_PEPA} />);
    expect(await screen.findByText(/Rosa Pérez/)).toBeTruthy();
    expect(mocks.qui).toHaveBeenCalledTimes(1);
  });
});
