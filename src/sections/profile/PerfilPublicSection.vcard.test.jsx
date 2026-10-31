import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* P1-59 (b) (Llibre Mestre, Fita 23 i IDEA-45; guàrdia nocturna 261030, Fase
   3) · «Descarrega el contacte (vCard)» a la fitxa d'una organització
   PÚBLICA (entitat o grup): la targeta es fa en local amb el que la fitxa ja
   ensenya. Mai a la d'una persona, d'una IA, d'una organització no pública
   ni dins de l'app nativa (un enllaç blob: no hi desa res). Els dobles són
   els de PerfilPublicSection.visor.test.jsx; la descàrrega (desaVcard) se
   simula i se'n llig el text. */
const mocks = vi.hoisted(() => ({
  navigate: vi.fn(), seo: vi.fn(), toast: vi.fn(), desa: vi.fn(() => true),
  config: { dataMode: 'seed' }, t: (_, alternativa) => alternativa, resolveAsset: (v) => v,
  capacitats: new Set(['directori']),
  identitat: { memberships: [], actor: null, setActor: vi.fn() },
  xat: { senseSessio: false }, sessio: null
}));
vi.mock('../xat/XatContext', () => ({ useXat: () => mocks.xat }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => mocks.identitat }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => mocks.sessio, useSessioOpcional: () => mocks.sessio }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useParams: () => ({}),
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ pathname: '/empresa/forn' }),
  useRouter: () => ({ navigate: mocks.navigate, currentPath: '/empresa/forn', basename: '' }),
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
  loadPerfilPublic: vi.fn(),
  quiEmSegueix: vi.fn(async () => [])
}));
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));
vi.mock('./vcardOrganitzacio.js', async (importOriginal) => ({
  ...(await importOriginal()),
  desaVcard: (...args) => mocks.desa(...args)
}));
import { FitxaPublica } from './PerfilPublicSection.jsx';

const FORN = Object.freeze({
  tipus: 'entitat', id: 'forn-1', slug: 'forn', nom: 'Forn de la Plaça', avatar: '', hero: '', lema: 'Pa de llenya', bio: 'Forn',
  presentacioHtml: '', poble: 'La Torre de les Maçanes', esIA: false, publicat: true, propietari: false, copyright: '', correu: 'forn@exemple.cat'
});
const BOTO = { name: 'Descarrega el contacte (vCard)' };
const espera = () => act(async () => { await new Promise((r) => setTimeout(r, 20)); });

beforeEach(() => { mocks.desa.mockClear(); });
afterEach(() => { cleanup(); delete window.Capacitor; });

test('una entitat pública: el botó, i el clic desa la vCard d’empresa amb el que la fitxa ensenya', async () => {
  render(<FitxaPublica perfil={FORN} />);
  await espera();
  fireEvent.click(screen.getByRole('button', BOTO));
  expect(mocks.desa).toHaveBeenCalledOnce();
  const [text, nom] = mocks.desa.mock.calls[0];
  expect(nom).toBe('forn-de-la-placa.vcf');
  const linies = text.replace(/\r\n /g, '').split('\r\n');
  expect(linies).toEqual(expect.arrayContaining([
    'BEGIN:VCARD', 'VERSION:3.0', 'FN:Forn de la Plaça', 'ORG:Forn de la Plaça', 'X-ABShowAs:COMPANY',
    'ADR;TYPE=WORK:;;;La Torre de les Maçanes;;;', 'EMAIL;TYPE=INTERNET,WORK:forn@exemple.cat', 'END:VCARD'
  ]));
  expect(linies.find((l) => l.startsWith('URL:'))).toMatch(/^URL:https?:\/\/[^/]+\/.+/);
  // El correu és el que la pàgina ja ensenya.
  expect(screen.getByRole('link', { name: 'forn@exemple.cat' })).toBeTruthy();
});

test('un grup públic sense correu públic: el botó, i la vCard no porta cap correu', async () => {
  render(<FitxaPublica perfil={{ ...FORN, tipus: 'grup', correu: '' }} />);
  await espera();
  fireEvent.click(screen.getByRole('button', BOTO));
  expect(mocks.desa.mock.calls[0][0]).not.toMatch(/EMAIL/);
});

test.each([
  ['una persona', { tipus: 'persona' }],
  ['una IA', { esIA: true }],
  ['una organització que no és pública', { publicat: false }],
  ['una organització sense la marca de pública', { publicat: undefined }]
])('%s: cap botó de vCard', async (_cas, canvi) => {
  render(<FitxaPublica perfil={{ ...FORN, ...canvi }} />);
  await espera();
  expect(screen.queryByRole('button', BOTO)).toBeNull();
});

test('dins de l’app nativa: cap botó (un enllaç blob: no hi desa res)', async () => {
  window.Capacitor = { isNativePlatform: () => true };
  render(<FitxaPublica perfil={FORN} />);
  await espera();
  expect(screen.queryByRole('button', BOTO)).toBeNull();
});
