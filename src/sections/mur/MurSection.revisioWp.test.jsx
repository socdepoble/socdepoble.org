import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  setSearchParams: vi.fn(),
  params: new URLSearchParams('revisio=wordpress'),
  t: (_, alternativa) => alternativa,
  core: { status: 'ready', error: null, pageCopy: {}, towns: [] },
  mur: { status: 'ready', error: null, sortedMarketItems: [], sortedEvents: [], sortedFeedPosts: [] },
  sessio: null,
}));

vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [mocks.params, mocks.setSearchParams],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children),
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', async original => ({ ...await original(),
  useUIActions: () => ({ t: mocks.t }),
  useUIState: () => ({ externalConfig: {} }),
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('./MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('./MapaFotografic.jsx', () => ({ default: () => null }));
/* P0-31 / IDEA-121 · El Mur ja no consulta el rol (MurSection.p031.test.js). La sessió simulada es queda
   perquè, si mai tornara una barra només per a superadmin, les proves de baix caurien. */
vi.mock('../../app/contexts/SessionContext.jsx', async (importOriginal) => ({
  ...(await importOriginal()),
  useSessioOpcional: () => mocks.sessio,
}));

import MurSection from './MurSection.jsx';
import { _reiniciaArticlesImportatsPerAProves } from '../../utils/articlesImportatsMandros.js';

beforeEach(() => {
  window.localStorage.clear();
  mocks.params = new URLSearchParams('revisio=wordpress');
  mocks.sessio = null;
});

afterEach(() => {
  cleanup();
  /* D-B4-3 · El carregador torna a l'import() de veres (una prova el fa fallar). */
  _reiniciaArticlesImportatsPerAProves();
});

test('AH-28 / IDEA-88 · /mur?revisio=wordpress obri el Mode Revisió d’Importació amb els 425 articles, filtres per cas d’ús i botó d’aprovar', async () => {
  render(<MurSection />);

  /* B3-4 · Els articles (amb el tesaurus) arriben en diferit: primer «Carregant». */
  expect(screen.getByText('Carregant contingut...')).toBeTruthy();
  const panell = await screen.findByTestId('mur-revisio-wordpress');
  expect(panell).toBeTruthy();
  expect(panell.textContent).toContain('425 articles');
  expect(panell.textContent).toContain('0 aprovats');

  const botoAprovar = panell.querySelectorAll('button');
  const aprovarPrimer = [...botoAprovar].find((b) => b.textContent.includes('Aprovar'));
  expect(aprovarPrimer).toBeTruthy();

  fireEvent.click(aprovarPrimer);
  expect(panell.textContent).toContain('1 aprovats');
});

test('P0-31 / IDEA-121 · sense ?revisio, un convidat i un no superadmin no veuen la barra de revisió', () => {
  mocks.params = new URLSearchParams('');
  const { container, rerender } = render(<MurSection />);
  expect(container.querySelector('.sdp-mur-revisio-bar')).toBeNull();
  expect(container.querySelector('.sdp-mur-revisio-toggle')).toBeNull();
  mocks.sessio = { estat: 'llest', currentUser: { id: 'u1' }, esSuperadmin: false, rol: 'veí' };
  rerender(<MurSection />);
  expect(container.querySelector('.sdp-mur-revisio-bar')).toBeNull();
  expect(container.querySelector('.sdp-mur-revisio-toggle')).toBeNull();
  expect(screen.queryByTestId('mur-revisio-wordpress')).toBeNull();
});

test('P0-31 / IDEA-121 · el botó 🔍 Mode Revisió d’Importació (Admin) s’ha eliminat de /mur fins i tot per a superadmin (la bancada viu a /el-meu-perfil)', () => {
  mocks.params = new URLSearchParams('');
  mocks.sessio = { estat: 'llest', currentUser: { id: 'u1' }, esSuperadmin: true, rol: 'superadmin' };
  const { container } = render(<MurSection />);
  expect(container.querySelector('.sdp-mur-revisio-bar')).toBeNull();
  expect(container.querySelector('.sdp-mur-revisio-toggle')).toBeNull();
  expect(screen.queryByText(/Mode Revisió d.Importació \(Admin\)/i)).toBeNull();
  expect(screen.queryByTestId('mur-revisio-wordpress')).toBeNull();
});

/* D-B4-3 (Onada R6, Bloc 4; decisió de MarIA) · Si la càrrega dels articles
   falla, l'avís porta «Reintentar», que la torna a demanar de debò (el
   carregador ja no guarda la promesa fallida: D-B4-4). */
test('D-B4-3 · la càrrega falla: l’avís porta «Reintentar», que torna a carregar i el panell arriba', async () => {
  let intents = 0;
  _reiniciaArticlesImportatsPerAProves(() => {
    intents += 1;
    return intents === 1 ? Promise.reject(new Error('xarxa')) : import('../../utils/transformadorEditorialWpBlogger.js');
  });
  render(<MurSection />);
  const alerta = await screen.findByRole('alert');
  expect(alerta.textContent).toContain('Revisa la connexió i torna-ho a provar.');
  expect(screen.queryByTestId('mur-revisio-wordpress')).toBeNull();
  const reintenta = within(alerta).getByRole('button', { name: 'Reintentar' });
  expect(reintenta.getAttribute('type')).toBe('button');
  fireEvent.click(reintenta);
  const panell = await screen.findByTestId('mur-revisio-wordpress');
  expect(panell.textContent).toContain('425 articles');
  expect(intents).toBe(2);
  expect(screen.queryByRole('button', { name: 'Reintentar' })).toBeNull();
});

test('D-B4-3 · «Reintentar» passa per la clau i18n del Mur', async () => {
  const claus = [];
  const tAnterior = mocks.t;
  mocks.t = (clau, alternativa) => { claus.push(clau); return alternativa; };
  _reiniciaArticlesImportatsPerAProves(() => Promise.reject(new Error('xarxa')));
  try {
    render(<MurSection />);
    await screen.findByRole('button', { name: 'Reintentar' });
    expect(claus).toContain('section.mur.revisioWp.reintenta');
  } finally {
    mocks.t = tAnterior;
  }
});
