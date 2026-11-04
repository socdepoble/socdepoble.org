import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({
  user: { id: 'U' }, capacitat: true, navigate: vi.fn(), solicita: vi.fn(),
  creaFil: vi.fn(), enviaXat: vi.fn(), inclou: vi.fn(), desaMembre: vi.fn(),
  router: { memoria: true, currentPath: '/connectar', searchParams: new URLSearchParams() }
}));
vi.mock('../../../app/contexts/RouterContext', () => ({ useNavigate: () => m.navigate, useRouter: () => m.router }));
vi.mock('../../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_key, alternativa) => alternativa }),
  useUIActionsOpcional: () => ({ t: (_key, alternativa) => alternativa })
}));
vi.mock('../../../app/contexts/SessionContext', () => ({ useSession: () => ({ currentUser: m.user }) }));
vi.mock('../../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ memberships: [] }) }));
vi.mock('../../xat/XatContext.jsx', () => ({ useXat: () => ({ creaFil: m.creaFil, sendChatMessage: m.enviaXat }) }));
vi.mock('../../../data/backendPort.js', async importOriginal => ({
  ...(await importOriginal()), teCapacitat: cap => cap === 'connexionsPubliques' && m.capacitat,
  solicitaUnirSeAEntitat: (...args) => m.solicita(...args),
  inclouPersonaEnEntitat: (...args) => m.inclou(...args),
  desaMembreOrganitzacio: (...args) => m.desaMembre(...args)
}));
import { BlocFormarPart } from './BlocFormarPart.jsx';
import { configuraBackendSessio, desaSessio } from '../../../data/identitat.js';

const CONFIG = Object.freeze({ backendUrl: 'https://backend-a.example', dataMode: 'local', tenantId: '11111111-1111-4111-8111-111111111111' });
const CONTACTE = Object.freeze({
  tipus: 'entitat', nom: 'La Colla', id: 'org-canonic', deFitxa: true,
  seguiment: { tipus: 'entitat', id: 'org-canonic' }, interlocutor: { id: 'org-canonic', tipus: 'entitat' }
});
const AJUDA = 'La sol·licitud queda pendent: no et dona cap rol ni permís fins que l’entitat l’aprove.';
const PENDENT = 'Sol·licitud guardada, pendent de revisió per l’entitat.';
const ERROR = 'No s’ha pogut guardar el vincle. Comprova els teus permisos i torna-ho a provar.';
const vista = props => <BlocFormarPart orgId="slug-de-la-query" contacte={CONTACTE} config={CONFIG} {...props} />;
const entra = id => { m.user = { id }; desaSessio({ access_token: `synthetic-token-${id}`, user: { id } }); };
const diferit = () => { let resol, rebutja; const promesa = new Promise((r, j) => { resol = r; rebutja = j; }); return { promesa, resol, rebutja }; };
function obri(rol = null) {
  if (rol) fireEvent.click(screen.getByRole('radio', { name: rol }));
  fireEvent.click(screen.getByRole('button', { name: 'Demanar formar part de La Colla' }));
  return screen.getByRole('dialog', { name: 'Demanar formar part de La Colla' });
}
async function confirma(dialeg) {
  await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Enviar la sol·licitud' })); });
}
const capAltaNiXat = () => {
  expect(m.creaFil).not.toHaveBeenCalled(); expect(m.enviaXat).not.toHaveBeenCalled();
  expect(m.inclou).not.toHaveBeenCalled(); expect(m.desaMembre).not.toHaveBeenCalled(); expect(m.navigate).not.toHaveBeenCalled();
};
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks(); m.capacitat = true;
  m.router = { memoria: true, currentPath: '/connectar', searchParams: new URLSearchParams() };
  configuraBackendSessio(CONFIG); entra('U');
  m.solicita.mockImplementation(async ({ orgId, rol }) => ({ orgId, personaId: 'U', rol, estat: 'pendent' }));
  m.creaFil.mockResolvedValue('fil-legacy'); m.enviaXat.mockResolvedValue([{ id: 'missatge-legacy' }]);
});

describe('Formar part · petició pendent del port realment accessible', () => {
  test.each([
    [/^Usuari \/ Membre/, 'usuari'], [/^Treballador \/ Soci/, 'treballador'], [/^Administrador/, 'administrador']
  ])('%s → %s, resposta pendent sense cap alta ni xat', async (radio, rol) => {
    const { container } = render(vista());
    expect(screen.getByText(AJUDA, { selector: 'p.sdp-connectar__ajuda' })).toBeTruthy();
    expect(container.textContent).not.toContain('La sol·licitud arribarà al xat privat');
    const dialeg = obri(radio);
    expect(within(dialeg).getByText(AJUDA)).toBeTruthy();
    expect(within(dialeg).queryByRole('textbox')).toBeNull();
    await confirma(dialeg);
    expect(m.solicita).toHaveBeenCalledTimes(1);
    expect(m.solicita.mock.calls[0][0]).toEqual({ orgId: 'org-canonic', rol });
    expect(m.solicita.mock.calls[0][1]).toEqual(CONFIG);
    expect(screen.getByText(PENDENT)).toBeTruthy();
    expect(screen.queryByText('Ja formes part de La Colla')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Demanar formar part de La Colla' })).toBeNull();
    capAltaNiXat();
  });

  test('el contacte públic sense interlocutor també pot demanar-ho', async () => {
    render(vista({ contacte: { ...CONTACTE, interlocutor: null } }));
    await confirma(obri()); expect(m.solicita).toHaveBeenCalledTimes(1); expect(screen.getByText(PENDENT)).toBeTruthy(); capAltaNiXat();
  });

  test.each([
    { orgId: 'org-aliena' }, { personaId: 'B' }, { rol: 'administrador' }, { estat: 'aprovat' }
  ])('rebutja resposta aliena o no pendent %j', async canvi => {
    m.solicita.mockResolvedValue({ orgId: 'org-canonic', personaId: 'U', rol: 'usuari', estat: 'pendent', ...canvi });
    render(vista()); await confirma(obri());
    expect(m.solicita).toHaveBeenCalledTimes(1); expect(screen.getByText(ERROR)).toBeTruthy();
    expect(screen.queryByText(PENDENT)).toBeNull(); capAltaNiXat();
  });

  test('RPC NO-DISPONIBLE és error honest sense fallback ni reintent automàtic', async () => {
    m.solicita.mockRejectedValue(Object.assign(new Error('no disponible'), { code: 'NO-DISPONIBLE' }));
    render(vista()); await confirma(obri());
    expect(screen.getByText(ERROR)).toBeTruthy(); expect(m.solicita).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(PENDENT)).toBeNull(); capAltaNiXat();
  });

  test('nova entrada del mateix usuari invalida la confirmació tardana i deixa operar la nova', async () => {
    const d = diferit(); m.solicita.mockReturnValueOnce(d.promesa);
    const v = render(vista()); await confirma(obri());
    entra('U'); v.rerender(vista());
    await act(async () => d.resol({ orgId: 'org-canonic', personaId: 'U', rol: 'usuari', estat: 'pendent' }));
    expect(screen.queryByText(PENDENT)).toBeNull(); expect(screen.queryByRole('alert')).toBeNull();
    await confirma(obri()); expect(m.solicita).toHaveBeenCalledTimes(2); expect(screen.getByText(PENDENT)).toBeTruthy(); capAltaNiXat();
  });

  test('canvi de backend ignora error anterior i captura la configuració de la petició', async () => {
    const config = { ...CONFIG }; const d = diferit(); m.solicita.mockReturnValueOnce(d.promesa);
    const v = render(vista({ config })); await confirma(obri());
    config.backendUrl = 'https://backend-b.example'; v.rerender(vista({ config }));
    await act(async () => d.rebutja(new Error('error anterior')));
    expect(m.solicita.mock.calls[0][1].backendUrl).toBe(CONFIG.backendUrl);
    expect(screen.queryByText(ERROR)).toBeNull(); expect(screen.queryByText(PENDENT)).toBeNull(); capAltaNiXat();
  });

  test('A→B→A i resposta antiga no confirmen una petició de la nova entrada', async () => {
    const d = diferit(); m.solicita.mockReturnValueOnce(d.promesa);
    const v = render(vista()); await confirma(obri()); entra('B'); v.rerender(vista()); entra('U'); v.rerender(vista());
    await act(async () => d.resol({ orgId: 'org-canonic', personaId: 'U', rol: 'usuari', estat: 'pendent' }));
    expect(screen.queryByText(PENDENT)).toBeNull(); expect(screen.queryByText(ERROR)).toBeNull(); capAltaNiXat();
  });

  test('desmuntar durant RPC no navega ni inicia cap pas posterior', async () => {
    const d = diferit(); m.solicita.mockReturnValueOnce(d.promesa);
    const v = render(vista()); await confirma(obri()); v.unmount();
    await act(async () => d.resol({ orgId: 'org-canonic', personaId: 'U', rol: 'usuari', estat: 'pendent' }));
    capAltaNiXat();
  });

  test('un doble clic de confirmació només crea una petició', async () => {
    const d = diferit(); m.solicita.mockReturnValueOnce(d.promesa);
    render(vista()); const boto = within(obri()).getByRole('button', { name: 'Enviar la sol·licitud' });
    await act(async () => { fireEvent.click(boto); fireEvent.click(boto); });
    expect(m.solicita).toHaveBeenCalledTimes(1);
    await act(async () => d.resol({ orgId: 'org-canonic', personaId: 'U', rol: 'usuari', estat: 'pendent' })); capAltaNiXat();
  });

  test('sense contacte públic no inventa una entitat a partir de la query', () => {
    render(vista({ contacte: null, nom: 'Nom de fitxa' }));
    expect(screen.queryByRole('button', { name: /Demanar formar part/ })).toBeNull(); expect(m.solicita).not.toHaveBeenCalled(); capAltaNiXat();
  });

  test('el modal conserva l’entrada de la vista abans de dispatch, també U→B i reentrada U sense rerender', async () => {
    for (const seguent of ['B', 'U']) {
      entra('U'); m.solicita.mockClear();
      render(vista()); const dialeg = obri();
      /* La sessió real canvia abans que React haja tornat a pintar el formulari. */
      entra(seguent);
      await confirma(dialeg);
      expect.soft(m.solicita, `entrada U→${seguent}`).not.toHaveBeenCalled();
      expect.soft(screen.queryByText(PENDENT)).toBeNull();
      capAltaNiXat(); cleanup();
    }
  });

  test('sense capacitat23 conserva el missatge legacy amb rol i la navegació al xat', async () => {
    m.capacitat = false; render(vista()); const dialeg = obri(/^Treballador \/ Soci/);
    expect(within(dialeg).getByRole('textbox')).toBeTruthy(); await confirma(dialeg);
    expect(m.solicita).not.toHaveBeenCalled(); expect(m.creaFil).toHaveBeenCalledTimes(1); expect(m.enviaXat).toHaveBeenCalledTimes(1);
    expect(m.enviaXat.mock.calls[0][1]).toBe('Sol·licitud per a formar part de La Colla.\nRol que demane: Treballador / Soci.');
    expect(m.navigate).toHaveBeenCalledWith('/xat/fil-legacy'); expect(m.inclou).not.toHaveBeenCalled(); expect(m.desaMembre).not.toHaveBeenCalled();
  });
});
