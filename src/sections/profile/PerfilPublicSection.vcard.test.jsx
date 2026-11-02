import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* P1-59 (b) (Llibre Mestre, Fita 23 i IDEA-45; guàrdia nocturna 261030, Fase
   3) · «Descarrega el contacte (vCard)» a la fitxa d'una organització
   PÚBLICA (entitat o grup) i, des d'IDEA-25 (marató 261101_2143, B4), a la
   d'una persona PUBLICADA: la targeta es fa en local amb el que la fitxa ja
   ensenya, i totes dues passen per la porta única (V-03, vcardDePerfilPublic).
   Mai a la d'una IA, d'una fitxa no publicada, d'un tipus desconegut ni dins
   de l'app nativa (un enllaç blob: no hi desa res). Els dobles són els de
   PerfilPublicSection.visor.test.jsx; la descàrrega (desaVcard) se simula i
   se'n llig el text. La privadesa de la persona té el seu fitxer:
   PerfilPublicSection.vcardPersona.seguretat.test.jsx (pre-commit). */
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
import { vcardDOrganitzacio } from './vcardOrganitzacio.js';

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

/* V-03 (marató 261101_2143, B4) · El botó d'una organització passa per la
   porta única i la targeta és la de vcardOrganitzacio.js byte a byte, amb el
   mateix correu que ensenya el mailto: retallat si porta espais, i cap si no
   té forma vàlida (llavors la pàgina tampoc no l'ensenya). */
test.each([
  ['el correu públic tal qual', 'forn@exemple.cat', 'forn@exemple.cat'],
  ['el correu amb espais (el mailto el retalla)', '  forn@exemple.cat  ', 'forn@exemple.cat'],
  ['un correu sense forma vàlida (cap mailto)', 'forn@', ''],
  ['un correu amb una línia injectada', 'forn@exemple.cat\r\nTEL:666', '']
])('V-03 · una entitat amb %s: la targeta de vcardDOrganitzacio byte a byte', async (_cas, correu, ensenyat) => {
  render(<FitxaPublica perfil={{ ...FORN, correu }} />);
  await espera();
  if (ensenyat) expect(screen.getByRole('link', { name: ensenyat }).getAttribute('href')).toBe(`mailto:${ensenyat}`);
  else expect(document.querySelector('a[href^="mailto:"]')).toBeNull();
  fireEvent.click(screen.getByRole('button', BOTO));
  const [text] = mocks.desa.mock.calls[0];
  const url = text.replace(/\r\n /g, '').split('\r\n').find((l) => l.startsWith('URL:')).slice(4);
  expect(text).toBe(vcardDOrganitzacio({ nom: FORN.nom, poble: FORN.poble, correu: ensenyat, url }));
  expect(text).not.toMatch(/\r\nTEL/);
});

/* IDEA-25 (marató 261101_2143, B4) · La fitxa PUBLICADA d'una persona també
   porta el botó, amb la mateixa etiqueta: la targeta de vcardDePersona
   (utils/exportaVCard.js), amb el que la fitxa ja ensenya i res més. */
const PEPA = Object.freeze({
  tipus: 'persona', id: 'pepa-1', slug: null, nom: 'Pepa Ferrer', avatar: '', hero: '', lema: 'Faig pa', bio: 'Forner del carrer Major',
  presentacioHtml: '', poble: 'La Torre de les Maçanes', esIA: false, publicat: true, propietari: false, copyright: '',
  usuari: 'pepaferrer', correu: 'pepa@exemple.cat'
});

test('una persona publicada: el botó, i la vCard de persona amb el nom, el @usuari, la bio, el lema i la fitxa', async () => {
  render(<FitxaPublica perfil={PEPA} />);
  await espera();
  const boto = screen.getByRole('button', BOTO);
  expect(boto.tagName).toBe('BUTTON');
  fireEvent.click(boto);
  expect(mocks.desa).toHaveBeenCalledOnce();
  const [text, nom] = mocks.desa.mock.calls[0];
  expect(nom).toBe('pepa-ferrer.vcf');
  const linies = text.replace(/\r\n /g, '').split('\r\n').filter(Boolean);
  expect(linies).toEqual([
    'BEGIN:VCARD', 'VERSION:3.0', 'N:;Pepa Ferrer;;;', 'FN:Pepa Ferrer', 'NICKNAME:@pepaferrer',
    'NOTE:Forner del carrer Major\\nFaig pa', expect.stringMatching(/^URL:https?:\/\/[^/]+\/gent\/pepa-1$/), 'END:VCARD'
  ]);
  // Una persona no té cap correu a la pàgina ni a la targeta.
  expect(document.querySelector('a[href^="mailto:"]')).toBeNull();
});

test('la fitxa pròpia publicada d’una persona també porta el botó', async () => {
  render(<FitxaPublica perfil={{ ...PEPA, propietari: true }} />);
  await espera();
  expect(screen.getByRole('button', BOTO)).toBeTruthy();
});

test.each([
  ['una persona sense publicar', { ...PEPA, publicat: false }],
  ['una persona sense la marca de publicada', { ...PEPA, publicat: undefined }],
  ['una persona amb una marca que no és el booleà true', { ...PEPA, publicat: 'true' }],
  ['la fitxa pròpia sense publicar', { ...PEPA, publicat: false, propietari: true }],
  ['una persona marcada com a IA', { ...PEPA, esIA: true }],
  ['una IA', { ...FORN, esIA: true }],
  ['una IA del catàleg (tipus ia)', { ...FORN, tipus: 'ia', esIA: true }],
  ['un tipus desconegut (la fitxa el pinta com a persona)', { ...PEPA, tipus: 'cosa' }],
  ['una organització que no és pública', { ...FORN, publicat: false }],
  ['una organització sense la marca de pública', { ...FORN, publicat: undefined }]
])('%s: cap botó de vCard', async (_cas, perfil) => {
  render(<FitxaPublica perfil={perfil} />);
  await espera();
  expect(screen.queryByRole('button', BOTO)).toBeNull();
});

test.each([['una entitat', FORN], ['una persona', PEPA]])('dins de l’app nativa: cap botó (un enllaç blob: no hi desa res) · %s', async (_cas, perfil) => {
  window.Capacitor = { isNativePlatform: () => true };
  render(<FitxaPublica perfil={perfil} />);
  await espera();
  expect(screen.queryByRole('button', BOTO)).toBeNull();
});
