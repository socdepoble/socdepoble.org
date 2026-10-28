import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* P1-68 (pla 261028_1526, §3.8.2.3; decisions del Mestre, 261028) · A la
   fitxa de la persona (la primera entrada després d'entrar, també amb Google
   o Apple), el @usuari proposat per l'alta i el poble principal. Només amb
   la columna del servidor (dades.username) i qui pot editar; l'identificador
   va per guardarCampPerfil('username') (updateProfile → RPC) i el poble per
   'town_name'. L'harnés és el de PerfilEditor.logotip.test.jsx. */
const m = vi.hoisted(() => ({ perfil: null, towns: [] }));
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} }),
}));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorId: null, refresh: vi.fn() }) }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ agents: [], towns: m.towns }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: null, estat: 'fora', generacio: 1 }) }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useRouter: () => ({ navigate: vi.fn(), location: { pathname: '/el-meu-perfil' } }),
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/el-meu-perfil' }),
  useSearchParams: () => [new URLSearchParams()],
  Link: ({ to, children }) => <a href={to}>{children}</a>,
}));
vi.mock('../../app/contexts/UIContext', () => ({
  useUI: () => ({ externalConfig: {} }),
  useUIActions: () => ({ t: (_clau, text) => text }),
}));
vi.mock('../../components/universal/ContentProvider', () => ({ useContent: () => null }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({ ...(await importOriginal()), teCapacitat: () => false }));
vi.mock('./PerfilContext.jsx', () => ({ usePerfil: () => m.perfil }));
vi.mock('../../components/universal/richText', () => ({
  useUniversalRichText: () => null,
  useTipTapToolbarAdapter: () => ({ state: {}, exec: {} }),
  UniversalRichTextToolbar: () => null,
  UniversalRichTextContent: () => null,
}));
vi.mock('../../components/universal/richText/extensions', () => ({ extensionsRiques: () => [] }));
vi.mock('../../components/universal/DocumentPrintPreview.jsx', () => ({ default: () => null }));

import { PerfilEditor } from './PerfilEditor.jsx';
import { ETIQUETA_POBLE, ETIQUETA_USUARI, TITOL_IDENTITAT_AL_POBLE } from '../onboarding/IdentitatAlPoble.jsx';

const persona = (dades = {}) => ({ id: 'jo', mena: 'persona', nom: 'Pep Sala', rol: 'Persona',
  dades: { id: 'U', full_name: 'Pep Sala', town_name: 'La Torre de les Maçanes', ...dades } });

beforeEach(() => {
  m.perfil = { identitats: [], autodesament: null, guardarCampPerfil: vi.fn(async () => {}), pujaMitja: vi.fn(), recarrega: vi.fn() };
  m.towns = [{ title: 'La Torre de les Maçanes' }, { title: 'Penàguila' }];
});
afterEach(cleanup);

test('la primera entrada: la proposta i «D’acord» la desa per guardarCampPerfil(username)', async () => {
  render(<PerfilEditor identitat={persona({ username: 'pepsala', username_confirmat_at: null })} />);
  expect(screen.getByRole('group', { name: TITOL_IDENTITAT_AL_POBLE })).toBeTruthy();
  expect(screen.getByLabelText(ETIQUETA_USUARI).value).toBe('pepsala');
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'D’acord, vull @pepsala' })); });
  expect(m.perfil.guardarCampPerfil).toHaveBeenCalledWith('username', 'pepsala', 'jo');
});

/* Revisió del Bloc H (R1) · Germà del DocumentEditor, dins del detall
   (overflow: hidden), deixava l'editor a 0 px en mòbil. Ara és el peu de la
   pàgina de l'editor: dins del contenidor que fa scroll, després de
   l'article i fora d'ell, en un section amb el nom del bloc. */
test('el bloc va dins del contenidor que fa scroll de l’editor (peuDePagina), no com a germà', () => {
  const { container } = render(<PerfilEditor identitat={persona({ username: 'pepsala', username_confirmat_at: null })} />);
  const grup = screen.getByRole('group', { name: TITOL_IDENTITAT_AL_POBLE });
  const closca = container.querySelector('.sdp-editor-shell-atomic');
  const pagina = closca.querySelector('.sdp-universal-page-container');
  expect(pagina.contains(grup)).toBe(true);
  const peu = screen.getByRole('region', { name: TITOL_IDENTITAT_AL_POBLE });
  expect(peu.matches('section.sdp-pagina-peu')).toBe(true);
  expect(peu.contains(grup)).toBe(true);
  expect(peu.closest('article')).toBeNull();
  expect([...pagina.children].slice(-2).map((e) => `${e.tagName}.${e.className}`)).toEqual(['ARTICLE.content-wrapper', 'SECTION.sdp-pagina-peu']);
  // Cap germà del DocumentEditor: el primer fill és la closca i el bloc no hi és fora.
  expect(container.firstElementChild).toBe(closca);
  expect([...container.children].some((fill) => fill !== closca && fill.contains(grup))).toBe(false);
  // Sense el bloc (cap username), cap peu: el DOM de sempre.
  cleanup();
  const sense = render(<PerfilEditor identitat={persona()} />);
  expect(sense.container.querySelector('.sdp-pagina-peu')).toBeNull();
});

test('el poble principal es desa per town_name, amb els altres darrere', async () => {
  render(<PerfilEditor identitat={persona({ username: 'pepsala', username_confirmat_at: '2026-10-28T21:00:00Z', town_name: 'La Torre de les Maçanes · Bel·lús' })} />);
  await act(async () => { fireEvent.change(screen.getByLabelText(ETIQUETA_POBLE), { target: { value: 'Penàguila' } }); });
  expect(m.perfil.guardarCampPerfil).toHaveBeenCalledWith('town_name', 'Penàguila · La Torre de les Maçanes · Bel·lús', 'jo');
});

test('sense la columna del servidor, amb la fila de reserva, d’una organització o en lectura: res', () => {
  render(<PerfilEditor identitat={persona()} />);
  expect(screen.queryByRole('group', { name: TITOL_IDENTITAT_AL_POBLE })).toBeNull();
  cleanup();
  render(<PerfilEditor identitat={persona({ username: 'pepsala', reserva: true })} />);
  expect(screen.queryByRole('group', { name: TITOL_IDENTITAT_AL_POBLE })).toBeNull();
  cleanup();
  render(<PerfilEditor identitat={persona({ username: 'pepsala', baixa_demanada_at: '2026-10-28T21:00:00Z' })} />);
  expect(screen.queryByRole('group', { name: TITOL_IDENTITAT_AL_POBLE })).toBeNull();
  cleanup();
  render(<PerfilEditor identitat={{ id: 'O', mena: 'empresa', nom: 'Forn', rol: 'Propietari', dades: { name: 'Forn', role: 'owner', username: 'forn' } }} />);
  expect(screen.queryByRole('group', { name: TITOL_IDENTITAT_AL_POBLE })).toBeNull();
});
