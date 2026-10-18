/* MD (ordre del Mestre, 261003; revisió) · La línia d'activació del Perfil,
   amb l'espai de treball de veres a 375 px: sense ?organitzacio=, primer
   PERFIL (la navegació); amb ?organitzacio= («Edita la fitxa de…»), la fitxa
   directament. Els detalls i el context del Perfil són dobles: ací es prova
   la closca. Dades sintètiques. */
import React from 'react';
import { cleanup, render, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ perfil: null, params: new URLSearchParams() }));
vi.mock('./PerfilContext.jsx', () => ({
  PerfilProvider: ({ children }) => children,
  usePerfil: () => m.perfil,
}));
/* El doble pinta el títol com la Pàgina Universal: l'H1 dins de la capçalera
   de pàgina (Regla de les Capçaleres, també als dobles). */
vi.mock('./PerfilEditor.jsx', () => ({
  PerfilEditor: ({ identitat }) => <header className="page-title"><h1>{`fitxa de ${identitat.nom}`}</h1></header>
}));
vi.mock('./DetallCompte.jsx', () => ({ DetallCompte: ({ identitat }) => <p>{`compte de ${identitat.nom}`}</p> }));
vi.mock('./DetallPrivacitat.jsx', () => ({ DetallPrivacitat: () => null }));
vi.mock('./DetallEspai.jsx', () => ({ DetallAplicacio: () => null, DetallNodes: () => null, DetallSenseOrganitzacions: () => null }));
vi.mock('./DialegNovaOrganitzacio.jsx', () => ({ DialegNovaOrganitzacio: () => null }));
vi.mock('../../components/universal/TargetaViva.jsx', () => ({
  AVISOS_TARGETA_VIVA: { perfil: '' }, TargetaViva: () => null, useDocumentViu: () => null,
}));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ refresh: () => {}, actor: null }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUI: () => ({ externalConfig: {}, status: 'ready', t: (_, alternativa) => alternativa }) }));
vi.mock('../../app/contexts/RouterContext', () => ({
  Link: ({ to, children }) => <a href={to}>{children}</a>,
  useSearchParams: () => [m.params],
  /* Encàrrec 261018_1220 · PerfilShell llig l'estat de l'historial (espaiIdentitat). */
  useLocation: () => ({ pathname: '/el-meu-perfil', search: '', state: null, hash: '' }),
}));
vi.mock('../../components/universal/ContentProvider', () => ({ useContent: () => null }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: () => {} }) }));
vi.mock('../../data/backendPort.js', () => ({ teCapacitat: () => false }));
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} })
}));

import PerfilShell from './PerfilShell.jsx';

const jo = { id: 'jo', mena: 'persona', nom: 'Pep', dades: {} };
const forn = { id: 'O', mena: 'empresa', nom: 'Forn', dades: { role: 'owner' } };

/* La memòria del nivell viu a la capa efímera: cada prova, una pestanya nova. */
beforeEach(() => {
  sessionStorage.clear();
  m.params = new URLSearchParams();
  m.perfil = {
    identitats: [jo, forn], carregant: false, error: null,
    guardarAjust: vi.fn(), pujaMitja: vi.fn(), recarrega: vi.fn(), creaOrganitzacio: vi.fn(),
  };
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(375);
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

const panell = (c) => c.querySelector('.app-grid-shell').dataset.panell;
const obertes = (c) => ['#app-grid-sidebar', '#app-grid-list', '#app-grid-main']
  .filter((id) => c.querySelector(id).getAttribute('aria-hidden') !== 'true');

test('MD · /el-meu-perfil a 375 px: primer PERFIL, sola', () => {
  const { container } = render(<PerfilShell />);
  expect([container.querySelector('.app-grid-shell').dataset.layout, panell(container)]).toEqual(['estret', 'left']);
  expect(obertes(container)).toEqual(['#app-grid-sidebar']);
  expect(within(container.querySelector('#app-grid-sidebar')).getByRole('button', { name: 'Pep' })).toBeTruthy();
});

test('MD · amb ?organitzacio= («Edita la fitxa de…») la fitxa s’obri directament', () => {
  m.params = new URLSearchParams('organitzacio=O');
  const { container } = render(<PerfilShell />);
  expect(panell(container)).toBe('');
  expect(obertes(container)).toEqual(['#app-grid-main']);
  expect(within(container.querySelector('#app-grid-main')).getByRole('heading', { level: 1 }).textContent).toBe('fitxa de Forn');
});
