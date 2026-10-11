/**
 * Onada 10 (261010; decisió del Mestre del 261010) · El perfil públic de la
 * IAIA MarIA (/perfil/<id> i /perfil/iaia-maria) porta el text «Qui és la
 * IAIA MarIA?», amb la seua veu: un h3 i quatre paràgrafs.
 *
 *  · UNA sola font: AGENTS_MAP.IAIA.presentacio_html (data/agentsSeed.js). El
 *    padró (AGENTS_IA_SEED) el copia i el perfil el pinta en llavor i en
 *    local (data/localPerfils.js), que és on el seu perfil ix del paquet.
 *  · El cos passa pel sanejador únic sense perdre res (h3, p i strong) i cap
 *    de sobra al límit de la presentació (perfilCamps.js).
 *  · L'avís «Este perfil és una intel·ligència artificial…» es queda.
 *  · El text no promet res que l'app no faça: cada afirmació s'ancora al codi.
 *
 * La pàgina és la de veres (UniversalPage i PageFrame); el port és el
 * magatzem local de perfils, que en llavor i en local fa de servidor.
 */
import { createElement } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  id: 'iaia-maria', navigate: vi.fn(), load: vi.fn(), seo: vi.fn(), toast: vi.fn(),
  config: { dataMode: 'seed' }, t: (_, alternativa) => alternativa, resolveAsset: (valor) => valor,
  identitat: { memberships: [], actor: null, setActor: () => true }
}));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => mocks.identitat }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useParams: () => ({ agentId: mocks.id }),
  useNavigate: () => mocks.navigate,
  useLocation: () => ({ pathname: `/perfil/${mocks.id}` }),
  useRouter: () => ({ navigate: mocks.navigate, currentPath: `/perfil/${mocks.id}`, basename: '' }),
  Link: ({ to, children, ...resta }) => createElement('a', { href: to, ...resta }, children)
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
import { MAXIM_PRESENTACIO, valorPerDesar } from './perfilCamps.js';
import { SECTIONS } from '../../config/sections.js';
import { AGENTS_MAP } from '../../data/agentsSeed.js';
import { AGENTS_IA_SEED, IAIA_ID, RESPOSTA_IAIA } from '../../data/identitatsSeed.js';
import { createLocalPerfilsAdapter } from '../../data/localPerfils.js';
import { AJUDA_PER_CLAU } from '../../data/xatsPerDefecte.js';
import { PAGE_COPY } from '../text/pageContent.js';
import { sanitizeHtml } from '../../utils/sanitize.js';

const TEXT = AGENTS_MAP.IAIA.presentacio_html;
const PRIMERES_PARAULES = ['Sóc la IAIA MarIA', 'La meua faena de cada dia', 'Als veïns i veïnes', 'A qui pica codi'];
const AVIS = 'Este perfil és una intel·ligència artificial';

/* L'HTML del text en un document inert: cap recurs del document viu. */
const cosDe = (html) => new DOMParser().parseFromString(html, 'text/html').body;
const negretes = () => [...cosDe(TEXT).querySelectorAll('strong')].map((node) => node.textContent);

let perfils;
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.id = 'iaia-maria';
  perfils = createLocalPerfilsAdapter();
  mocks.load.mockImplementation(async (clau) => perfils.loadPerfilPublic(clau, null));
});

describe('la font única del text', () => {
  test('el padró copia la presentació del catàleg, com el nom, el rol, el lema i l’avatar', () => {
    const [iaia] = AGENTS_IA_SEED;
    expect(iaia.presentacio_html).toBe(TEXT);
    expect([iaia.id, iaia.name, iaia.role, iaia.lema, iaia.short_bio, iaia.avatar_url]).toEqual([
      IAIA_ID, AGENTS_MAP.IAIA.name, AGENTS_MAP.IAIA.role, AGENTS_MAP.IAIA.lema, AGENTS_MAP.IAIA.short_bio, AGENTS_MAP.IAIA.avatar_url
    ]);
  });

  test('un h3 i quatre paràgrafs, amb l’apòstrof tipogràfic i sense cap resta del text antic', () => {
    const fills = [...cosDe(TEXT).children];
    expect(fills.map((fill) => fill.tagName)).toEqual(['H3', 'P', 'P', 'P', 'P']);
    expect(fills[0].textContent).toBe('Qui és la IAIA MarIA?');
    expect(fills.slice(1).map((fill, i) => fill.textContent.startsWith(PRIMERES_PARAULES[i]))).toEqual([true, true, true, true]);
    expect(TEXT).not.toContain("'");
    expect(TEXT.match(/’/g)).toHaveLength(7);
    for (const antic of ['cor cibernètic', 'Les meues obligacions diàries', 'Claude', 'Codex']) {
      expect([antic, TEXT.includes(antic)]).toEqual([antic, false]);
    }
  });

  test('el sanejador el deixa tal qual i cap de sobra al límit de la presentació', () => {
    expect(sanitizeHtml(TEXT)).toBe(TEXT);
    expect(valorPerDesar('agent', 'content', TEXT)).toEqual({ columna: 'presentacio_html', valor: TEXT });
    expect([...TEXT].length).toBeLessThan(MAXIM_PRESENTACIO / 4);
  });

  /* Onada 11 (261010; prompt 261010_1730, tasca 6, D7) · La bio curta és
     l'extracte del Cercador i del directori: una frase coherent amb el text
     del perfil, sense castellanismes ni promeses. DEROGADA l'antiga («Gestora
     suprema… "Cocinera de Rebost". Capaç de tot.»). */
  test('D7 · la bio curta és una frase coherent amb la presentació, sense castellanismes ni promeses', () => {
    expect(AGENTS_MAP.IAIA.short_bio).toBe('La intel·ligència artificial que posa ordre al Mas de Sóc de Poble: guarda la memòria de casa i recorda que les coses es fan amb trellat.');
    expect(AGENTS_IA_SEED[0].short_bio).toBe(AGENTS_MAP.IAIA.short_bio);
    /* Cada tros de la frase és al text del perfil, amb la mateixa veu. */
    const text = cosDe(TEXT).textContent;
    for (const tros of ['posa ordre al Mas de Sóc de Poble', 'guardar la memòria de casa', 'trellat']) {
      expect([tros, text.includes(tros)]).toEqual([tros, true]);
    }
    for (const antic of ['Gestora suprema', 'Cocinera', 'Capaç de tot', 'L\'Ull', 'Jutgessa']) {
      expect([antic, AGENTS_MAP.IAIA.short_bio.includes(antic)]).toEqual([antic, false]);
    }
    expect(AGENTS_MAP.IAIA.short_bio).not.toContain('"');
  });

  test('el perfil públic el porta per id i per slug, en lloc de la bio curta', () => {
    for (const clau of [IAIA_ID, 'iaia-maria']) {
      const perfil = perfils.loadPerfilPublic(clau, null);
      expect([clau, perfil.tipus, perfil.esIA, perfil.nom, perfil.presentacioHtml === TEXT]).toEqual([clau, 'ia', true, 'IAIA MarIA', true]);
      expect(perfil.presentacioHtml).not.toContain(AGENTS_MAP.IAIA.short_bio);
    }
  });
});

describe('el perfil pintat', () => {
  test.each([['per id', IAIA_ID], ['per slug', 'iaia-maria']])('%s: el títol i els quatre paràgrafs, davall de l’avís i del botó', async (_, clau) => {
    mocks.id = clau;
    render(<PerfilPublicSection agents={[]} />);
    expect(await screen.findByRole('heading', { level: 1, name: 'IAIA MarIA' })).toBeTruthy();
    expect(mocks.load).toHaveBeenCalledWith(clau, mocks.config);
    const cos = document.querySelector('article.detail-content');
    expect([...cos.children].map((fill) => fill.tagName)).toEqual(['H3', 'P', 'P', 'P', 'P']);
    expect(cos.querySelector('h3').textContent).toBe('Qui és la IAIA MarIA?');
    expect([...cos.querySelectorAll('p')].map((p, i) => p.textContent.startsWith(PRIMERES_PARAULES[i]))).toEqual([true, true, true, true]);
    expect(cos.innerHTML).toBe(TEXT);
    expect(document.querySelectorAll('article.detail-content')).toHaveLength(1);
    /* L'avís d'intel·ligència artificial es queda, i va abans del text. El
       que diu («en proves», «no substituïx cap persona del poble») és el que
       el text repetix amb la veu de la IAIA. */
    const avis = screen.getByRole('status');
    expect(avis.textContent).toContain(AVIS);
    expect(avis.textContent).toContain('en proves');
    expect(avis.textContent).toContain('no substituïx cap persona del poble');
    expect(avis.compareDocumentPosition(cos) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Parla amb la IAIA' }));
    expect(mocks.navigate).toHaveBeenCalledWith(`/xat?amb=${IAIA_ID}`);
  });
});

describe('el text no promet res que l’app no faça', () => {
  test('«en proves» i «a poc a poc aniré aprenent» són la seua resposta fixa del Xat', () => {
    expect(negretes()).toContain('en proves');
    expect(RESPOSTA_IAIA).toContain('en proves');
    expect(TEXT).toContain('A poc a poc aniré aprenent.');
    expect(RESPOSTA_IAIA).toContain('poc a poc aniré aprenent');
    /* «No substituïsc cap persona del poble» és l'avís del perfil, en primera persona. */
    expect(negretes()).toContain('no substituïsc cap persona del poble');
  });

  test('«em trobareu al Xat»: la IAIA és un dels dos contactes d’ajuda de la llista de converses', () => {
    expect(negretes()).toContain('Xat');
    expect(AJUDA_PER_CLAU.iaia).toMatchObject({ clau: 'iaia', nom: 'IAIA MarIA', tipus: 'ia' });
    expect(SECTIONS.find((seccio) => seccio.id === 'xat')).toMatchObject({ path: '/xat' });
  });

  test('la Constitució, el Disseny Pedra Seca, el Full de ruta i la Wiki de Poble són pàgines de l’app', () => {
    const pagines = { constitucio: 'Constitució', disseny: 'Disseny Pedra Seca', roadmap: 'Full de ruta', wikidepoble: 'Wiki de Poble' };
    for (const [clau, titol] of Object.entries(pagines)) {
      expect([clau, PAGE_COPY[clau].title]).toEqual([clau, titol]);
      expect([clau, negretes().includes(titol)]).toEqual([clau, true]);
      expect([clau, SECTIONS.some((seccio) => seccio.path === `/${clau}`)]).toEqual([clau, true]);
    }
  });

  test('«programari lliure»: la pàgina «Drets d’autor» en diu la llicència del codi', () => {
    expect(negretes()).toContain('programari lliure');
    expect(PAGE_COPY['drets-autor'].html).toContain('AGPL-3.0');
  });
});
