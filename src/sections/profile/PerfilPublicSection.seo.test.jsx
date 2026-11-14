/**
 * P0-SEO-UNIVERSAL (ordre del Mestre, 13-11-2026) · El head de la fitxa pública amb el head SERVIT pel
 * prerender (dist/empresa/<slug>/index.html), amb useSEO i seoHead de veres sobre el document:
 *   · a la ruta del head servit, el head no es purga mentre la fitxa carrega ni quan arriba (abans, el
 *     index:false de la càrrega el feia purgar en el primer pintat);
 *   · oberta per un àlies, la fitxa declara la seua adreça canònica única (rutaPublicaDePerfil) i la
 *     imatge sdp-media:// arriba resolta (abans, la targeta genèrica);
 *   · una fitxa no trobada no s'indexa i el head servit se'n va;
 *   · amb la clau de la IAIA i un servidor que torna una organització, es pinta la IAIA del paquet.
 * El head servit s'escriu amb el renderitzador del build (renderSocialHead), no amb una còpia.
 */
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  pathname: '/empresa/olidelatorre', id: 'olidelatorre', navigate: vi.fn(), load: vi.fn(), capacitats: new Set(['directori']),
  t: (_, alternativa) => alternativa, identitat: { memberships: [], actor: null, setActor: vi.fn() },
  ui: { externalConfig: { dataMode: 'remote', manageDocumentHead: true } }
}));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => mocks.identitat }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useLocation: () => ({ pathname: mocks.pathname, search: '' }),
  useRouter: () => ({ basename: '' }),
  useParams: () => ({ agentId: mocks.id }),
  useNavigate: () => mocks.navigate
}));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: mocks.t, resolveAsset: (ref) => ref }),
  useUIState: () => mocks.ui
}));
vi.mock('../../config/opcionsImatgeSocial.js', () => ({
  opcionsDeLaImatgeSocial: () => ({ origen: 'https://socdepoble.org', supabaseUrl: 'https://exemple.supabase.co', permesos: [] })
}));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: (capacitat) => mocks.capacitats.has(capacitat),
  loadPerfilPublic: (...args) => mocks.load(...args)
}));
vi.mock('../../host.js', () => ({ quanLlest: async () => {} }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: (props) => <header className="page-title"><h1>{props.title}</h1></header>
}));
import PerfilPublicSection from './PerfilPublicSection.jsx';
import { ATRIBUT_SSR } from '../../config/imatgeSocial.js';
import { oblidaEntitatDelProjecte } from '../../config/navigation.js';
import { IAIA_ID } from '../../data/identitatsSeed.js';
import { renderSocialHead } from '../../../tooling/seo/social-edge.mjs';

const ORIGEN = 'https://socdepoble.org';
const PORTADA = 'sdp-media://mitjans/t1/u1/organitzacions/portada.webp';
const OLI = { tipus: 'entitat', id: '3073b933-69fc-4c3e-80dc-b0df9c6b8391', slug: 'olidelatorre', nom: 'Oli de La Torre', avatar: '', hero: PORTADA,
  lema: 'El millor oli', bio: '', presentacioHtml: '', poble: '', esIA: false, publicat: true, propietari: false, copyright: '' };
const IMATGE_OG = `${ORIGEN}/assets/og/0123456789abcdef01234567.jpg`;
/* El head que servix Firebase per a /empresa/olidelatorre (i per als seus àlies), tal com l'escriu el build. */
function serveixElHead() {
  const cap = renderSocialHead({ title: 'Oli de La Torre', description: 'El millor oli', type: 'website', schema: 'Organization', index: true,
    canonical: `${ORIGEN}/empresa/olidelatorre`, image: { url: IMATGE_OG, alt: 'Oli de La Torre', type: 'image/jpeg', width: 1200, height: 630 } }, ORIGEN);
  const servit = new DOMParser().parseFromString(`<!doctype html><html><head>${cap}</head><body></body></html>`, 'text/html');
  document.head.replaceChildren(...[...servit.head.childNodes].map((node) => document.importNode(node, true)));
}
/* El head genèric d'index.html, abans que res el toque. */
function capGeneric() {
  const titol = document.createElement('title');
  titol.textContent = 'Sóc de Poble';
  document.head.replaceChildren(titol);
}
const marcats = () => document.head.querySelectorAll(`[${ATRIBUT_SSR}]`).length;
const meta = (selector) => document.head.querySelector(selector)?.getAttribute('content') ?? null;
const canonical = () => document.head.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.pathname = '/empresa/olidelatorre'; mocks.id = 'olidelatorre';
  vi.stubEnv('VITE_CANONICAL_URL', `${ORIGEN}/`);
  oblidaEntitatDelProjecte();
  capGeneric();
});
afterEach(() => { cleanup(); vi.unstubAllEnvs(); document.head.replaceChildren(); });

test('a la ruta del head servit, el head no es purga mentre la fitxa carrega ni quan arriba', async () => {
  serveixElHead();
  const servits = marcats();
  expect(servits).toBeGreaterThan(10);
  let resol;
  mocks.load.mockReturnValue(new Promise((ok) => { resol = ok; }));
  render(<PerfilPublicSection />);
  await screen.findByRole('heading', { level: 1, name: 'Carregant el perfil…' });
  // Mentre carrega: el head servit, sencer (abans, el index:false de la càrrega el purgava ací).
  expect(marcats()).toBe(servits);
  expect([document.title, canonical(), meta('meta[property="og:image"]'), meta('meta[name="robots"]')])
    .toEqual(['Oli de La Torre | Sóc de Poble', `${ORIGEN}/empresa/olidelatorre`, IMATGE_OG, null]);
  await act(async () => { resol(OLI); });
  await screen.findByRole('heading', { level: 1, name: 'Oli de La Torre' });
  // Quan arriba la fitxa: el mateix head servit, amb la imatge materialitzada i el JSON-LD del build.
  expect(marcats()).toBe(servits);
  expect([document.title, canonical(), meta('meta[property="og:image"]')]).toEqual(['Oli de La Torre | Sóc de Poble', `${ORIGEN}/empresa/olidelatorre`, IMATGE_OG]);
  expect(JSON.parse(document.head.querySelector(`script[type="application/ld+json"][${ATRIBUT_SSR}]`).textContent)['@type']).toBe('Organization');
});

test('oberta per un àlies, declara la canònica única i la imatge sdp-media:// arriba resolta', async () => {
  serveixElHead();
  mocks.pathname = `/gent/${OLI.id}`; mocks.id = OLI.id;
  mocks.load.mockResolvedValue(OLI);
  render(<PerfilPublicSection />);
  await screen.findByRole('heading', { level: 1, name: 'Oli de La Torre' });
  // El head servit no és el d'esta adreça (el seu canonical és un altre): se'n va, i el del client diu el mateix.
  expect(marcats()).toBe(0);
  expect(document.title).toBe('Oli de La Torre | Sóc de Poble');
  expect(canonical()).toBe(`${ORIGEN}/empresa/olidelatorre`);
  expect(meta('meta[property="og:url"]')).toBe(`${ORIGEN}/empresa/olidelatorre`);
  expect(meta('meta[name="description"]')).toBe('El millor oli');
  expect(meta('meta[property="og:image"]')).toBe('https://exemple.supabase.co/storage/v1/object/public/mitjans/t1/u1/organitzacions/portada.webp');
  expect(meta('meta[property="og:image:alt"]')).toBe('Oli de La Torre');
  expect(meta('meta[name="robots"]')).toBeNull();
});

test('sense head servit, mentre carrega no s’indexa (com sempre); una fitxa no trobada no s’indexa i el head servit se’n va', async () => {
  let resol;
  mocks.load.mockReturnValue(new Promise((ok) => { resol = ok; }));
  render(<PerfilPublicSection />);
  await screen.findByRole('heading', { level: 1, name: 'Carregant el perfil…' });
  expect([document.title, meta('meta[name="robots"]'), canonical()]).toEqual(['Carregant el perfil… | Sóc de Poble', 'noindex, nofollow', null]);
  await act(async () => { resol(null); });
  await screen.findByRole('heading', { level: 1, name: 'Perfil no trobat' });
  expect([meta('meta[name="robots"]'), canonical()]).toEqual(['noindex, nofollow', null]);
  cleanup();
  // Amb un head servit (una fitxa que ja no existix i encara té el fitxer vell): se'n va en saber-ho.
  serveixElHead();
  mocks.load.mockResolvedValue(null);
  render(<PerfilPublicSection />);
  await screen.findByRole('heading', { level: 1, name: 'Perfil no trobat' });
  expect(marcats()).toBe(0);
  expect([document.title, meta('meta[name="robots"]'), canonical(), meta('meta[property="og:url"]')]).toEqual(['Perfil no trobat | Sóc de Poble', 'noindex, nofollow', null, null]);
});

test('amb la clau de la IAIA i un servidor que torna una organització, es pinta la IAIA del paquet, amb la seua canònica', async () => {
  for (const clau of ['iaia-maria', IAIA_ID]) {
    mocks.pathname = `/perfil/${clau}`; mocks.id = clau;
    mocks.load.mockResolvedValue({ ...OLI, slug: clau, nom: 'SEGREST' });
    render(<PerfilPublicSection />);
    await screen.findByRole('heading', { level: 1, name: 'IAIA MarIA' });
    expect(screen.queryByText('SEGREST')).toBeNull();
    expect(document.title).toBe('IAIA MarIA | Sóc de Poble');
    // /perfil/* és sense indexar: el client no declara canonical ni og:url (com sempre), i mai el nom d'un altre.
    expect(meta('meta[name="robots"]')).toBe('noindex, nofollow');
    expect(document.head.textContent).not.toContain('SEGREST');
    expect([...document.head.querySelectorAll('meta')].some((node) => (node.getAttribute('content') || '').includes('SEGREST'))).toBe(false);
    cleanup();
    capGeneric();
  }
});
