import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* IDEA-25 (marató 261101_2143, B4; RGPD, minimització) · La targeta de
   contacte d'una persona, des del botó de la seua fitxa publicada, només porta
   el que la fitxa ja ensenya a tothom: el nom, el @usuari en la forma del
   servidor, la bio, el lema i l'adreça de la fitxa. Mai cap correu (tampoc el
   del compte, que pot arribar al DTO de la fitxa pròpia), telèfon, adreça,
   codi postal ni poble, i cap valor hi pot injectar una propietat nova. Entra
   al pre-commit pel nom (*.seguretat.test.jsx). Els dobles són els de
   PerfilPublicSection.vcard.test.jsx; la descàrrega (desaVcard) se simula i
   se'n llig el text. */
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
  useLocation: () => ({ pathname: '/gent/pepa-1' }),
  useRouter: () => ({ navigate: mocks.navigate, currentPath: '/gent/pepa-1', basename: '' }),
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

const BOTO = { name: 'Descarrega el contacte (vCard)' };
const espera = () => act(async () => { await new Promise((r) => setTimeout(r, 20)); });
const desplega = (text) => text.replace(/\r\n /g, '').split('\r\n').filter(Boolean);
const propietats = (text) => desplega(text).map((l) => l.split(/[:;]/)[0]);

/* Un DTO amb tot el que no ha d'eixir: el correu, el telèfon, el carrer, el
   codi postal, l'organització i el poble (que és a la pàgina com a píndola,
   però no és cap domicili i la targeta d'una persona no el porta). */
const PEPA = Object.freeze({
  tipus: 'persona', id: 'pepa-1', slug: null, nom: 'Pepa Ferrer', avatar: '', hero: '', lema: 'Faig pa', bio: 'Forner',
  presentacioHtml: '', poble: 'Benifallim', esIA: false, publicat: true, propietari: false, copyright: '',
  usuari: 'pepaferrer', correu: 'pepa@privat.cat', email: 'compte@privat.cat', telefon: '+34 600 123 456',
  adreca: 'Carrer Major, 4', codiPostal: '03816', organitzacio: 'Cooperativa'
});
const PRIVAT = /privat\.cat|600|Major|03816|Cooperativa|Benifallim/;

async function targetaDe(perfil) {
  render(<FitxaPublica perfil={perfil} />);
  await espera();
  fireEvent.click(screen.getByRole('button', BOTO));
  expect(mocks.desa).toHaveBeenCalledOnce();
  return mocks.desa.mock.calls[0][0];
}

beforeEach(() => { mocks.desa.mockClear(); });
afterEach(() => { cleanup(); delete window.Capacitor; });

test.each([
  ['vista per una altra persona', false],
  ['la fitxa pròpia (el DTO pot portar el correu del compte)', true]
])('una persona publicada, %s: cap correu, telèfon, adreça, codi postal, organització ni poble', async (_cas, propietari) => {
  const text = await targetaDe({ ...PEPA, propietari });
  expect(propietats(text)).toEqual(['BEGIN', 'VERSION', 'N', 'FN', 'NICKNAME', 'NOTE', 'URL', 'END']);
  expect(text).not.toMatch(PRIVAT);
  expect(text).not.toMatch(/EMAIL|TEL|ADR|ORG|X-ABShowAs/);
});

test('cap valor de la fitxa injecta una propietat: salts de línia, «;» i «,» escapats', async () => {
  const text = await targetaDe({
    ...PEPA, nom: 'Pepa\r\nEMAIL:robat@x.cat', bio: 'Bio\nTEL:666', lema: 'Lema;ADR:;;Carrer;;;', usuari: 'pepa\r\nEMAIL:robat@x.cat'
  });
  expect(propietats(text)).toEqual(['BEGIN', 'VERSION', 'N', 'FN', 'NOTE', 'URL', 'END']);
  expect(desplega(text)).toContain('FN:Pepa\\nEMAIL:robat@x.cat');
  expect(desplega(text)).toContain('NOTE:Bio\\nTEL:666\\nLema\\;ADR:\\;\\;Carrer\\;\\;\\;');
  // Cap línia física comença per una propietat que la fitxa no ha posat.
  expect(text.split('\r\n').some((l) => /^(EMAIL|TEL|ADR)/.test(l))).toBe(false);
});

test('el @usuari fora de la forma del servidor no hi entra (com a la píndola de la fitxa)', async () => {
  const text = await targetaDe({ ...PEPA, usuari: 'Pepa Ferrer' });
  expect(text).not.toMatch(/NICKNAME|@/);
  expect(screen.queryByText('@Pepa Ferrer')).toBeNull();
});
