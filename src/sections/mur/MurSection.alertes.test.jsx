/**
 * T3.3 (marató nocturna 261101, carril B3) · Les alertes d'emergència i els
 * bàndols urgents al Mur, de comportament (MurSection + TargetaDelMur):
 *  · el distintiu ix a la publicació d'un AJUNTAMENT amb l'etiqueta (normalitzada)
 *    i no a la d'un veí ni a la d'una altra entitat amb la mateixa etiqueta;
 *  · el directori (capacitat 'directoriEntitats') diu qui és un ajuntament:
 *    sense capacitat o amb error, cap distintiu (fail-closed); sense cap
 *    candidata, cap petició i el DOM de sempre;
 *  · les vigents pugen al capdamunt; una de fa dies, no (però porta el distintiu);
 *  · una sola regió viva (role="status"), muntada buida abans de la resposta;
 *    el distintiu de cada targeta és text visible fora de cap regió viva.
 */
import React from 'react';
import { cleanup, render, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(), t: (_, alternativa) => alternativa, core: {}, mur: {},
  capacitats: new Set(['directoriEntitats']), directori: vi.fn()
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [new URLSearchParams()],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: mocks.t }),
  useUIState: () => ({ externalConfig: {} })
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('./MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: (capacitat) => mocks.capacitats.has(capacitat),
  listPublicOrganizations: (...args) => mocks.directori(...args)
}));
import MurSection from './MurSection.jsx';
import { VIGENCIA_ALERTA_MS, dataDeCaducitat } from './alertesMunicipals.js';

const AJUNTAMENT = '7d2c1a40-0000-4000-8000-00000000a1a1';
const FORN = '7d2c1a40-0000-4000-8000-00000000f0f0';
const DIRECTORI = [
  { id: AJUNTAMENT, slug: 'ajuntament', name: 'Ajuntament', kind: 'city_hall' },
  { id: FORN, slug: 'forn', name: 'Forn del poble', kind: 'company' }
];
const HORA = 3600 * 1000;
const fa = (hores) => new Date(Date.now() - hores * HORA).toISOString();
const publicacio = (camps) => ({ type: 'feed', ...camps });

/* La targeta d'un títol (l'article de la graella). */
const targeta = (titol) => {
  const article = [...document.querySelectorAll('.sdp-card-grid article')]
    .find((element) => element.querySelector('.sp-card-title')?.textContent === titol);
  expect(article, titol).toBeTruthy();
  return article;
};
const titols = () => [...document.querySelectorAll('.sdp-card-grid .sp-card-title')].map((titol) => titol.textContent);
const regio = (container) => container.querySelector('.content-wrapper > [role="status"]');
const fixaMur = (feed) => {
  mocks.mur = { status: 'ready', error: null, sortedEvents: [], sortedMarketItems: [], sortedFeedPosts: feed };
};

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.capacitats = new Set(['directoriEntitats']);
  mocks.directori.mockImplementation(async () => DIRECTORI);
  mocks.core = { status: 'ready', error: null, pageCopy: {} };
  fixaMur([]);
});

describe('el distintiu, només per a un ajuntament', () => {
  test('l’ajuntament amb «Bàndol urgent» el porta; un veí i un forn amb l’etiqueta d’alerta, no', async () => {
    fixaMur([
      publicacio({ id: 'aigua', title: 'Tall d’aigua dimecres', created_at: fa(2), labels: [{ text: 'Bàndol urgent', className: 'sdp-badge-category' }], author_org_id: AJUNTAMENT }),
      publicacio({ id: 'gat', title: 'Gat perdut', created_at: fa(1), labels: ['ALERTA'], ownerUserId: 'u-vei', author_org_id: null }),
      publicacio({ id: 'pa', title: 'Pa calent', created_at: fa(3), labels: [{ text: 'Emergència' }], author_org_id: FORN })
    ]);
    render(<MurSection />);
    await waitFor(() => expect(targeta('Tall d’aigua dimecres').querySelector('.sdp-mur-alerta')).not.toBeNull());

    const aigua = targeta('Tall d’aigua dimecres');
    const distintiu = aigua.querySelector('.sdp-mur-alerta');
    expect(distintiu.textContent).toBe('Bàndol urgent');
    expect(distintiu.querySelector('.sdp-insignia.sdp-insignia--avis')).not.toBeNull();
    // Icona redundant: amagada al lector; el text és el que diu què és.
    expect(distintiu.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
    expect(aigua.classList.contains('sdp-mur-alerta-targeta--avis')).toBe(true);
    // El distintiu va davall del títol, al capdamunt del cos.
    expect(aigua.querySelector('.sp-card-title').compareDocumentPosition(distintiu) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // L'enllaç de la targeta el porta com a descripció accessible.
    const enllac = aigua.querySelector('a.sp-card-link-overlay');
    expect(document.getElementById(enllac.getAttribute('aria-describedby')).textContent).toBe('Bàndol urgent');

    for (const titol of ['Gat perdut', 'Pa calent']) {
      const article = targeta(titol);
      expect(article.querySelector('.sdp-mur-alerta'), titol).toBeNull();
      expect(article.className, titol).not.toMatch(/sdp-mur-alerta-targeta/);
      expect(article.querySelector('a.sp-card-link-overlay').hasAttribute('aria-describedby'), titol).toBe(false);
    }
    // Una sola consulta al directori, per a les entitats candidates.
    expect(mocks.directori).toHaveBeenCalledTimes(1);
    expect(mocks.directori.mock.calls[0][0]).toMatchObject({ limit: 500 });
  });

  test('la normalització arriba a la targeta: «EMERGÈNCIA» és una Alerta municipal, amb el to de perill', async () => {
    fixaMur([publicacio({ id: 'pluja', title: 'Pluges fortes', created_at: fa(1), labels: [{ text: '  EMERGÈNCIA ' }], author_org_id: AJUNTAMENT })]);
    render(<MurSection />);
    await waitFor(() => expect(targeta('Pluges fortes').querySelector('.sdp-mur-alerta')).not.toBeNull());
    const article = targeta('Pluges fortes');
    expect(article.querySelector('.sdp-mur-alerta').textContent).toBe('Alerta municipal');
    expect(article.querySelector('.sdp-mur-alerta .sdp-insignia--error')).not.toBeNull();
    expect(article.classList.contains('sdp-mur-alerta-targeta--perill')).toBe(true);
  });

  test('sense la capacitat del directori, cap petició i cap distintiu (fail-closed)', async () => {
    mocks.capacitats = new Set();
    fixaMur([publicacio({ id: 'aigua', title: 'Tall d’aigua', created_at: fa(1), labels: ['Bàndol urgent'], author_org_id: AJUNTAMENT })]);
    const { container } = render(<MurSection />);
    await new Promise((resolta) => setTimeout(resolta, 0));
    expect(mocks.directori).not.toHaveBeenCalled();
    expect(targeta('Tall d’aigua').querySelector('.sdp-mur-alerta')).toBeNull();
    expect(regio(container).textContent).toBe('');
  });

  test('si el directori falla, cap distintiu (fail-closed)', async () => {
    mocks.directori.mockImplementation(async () => { throw Object.assign(new Error('Caigut'), { status: 503 }); });
    fixaMur([publicacio({ id: 'aigua', title: 'Tall d’aigua', created_at: fa(1), labels: ['Bàndol urgent'], author_org_id: AJUNTAMENT })]);
    const { container } = render(<MurSection />);
    await waitFor(() => expect(mocks.directori).toHaveBeenCalledTimes(1));
    await new Promise((resolta) => setTimeout(resolta, 0));
    expect(targeta('Tall d’aigua').querySelector('.sdp-mur-alerta')).toBeNull();
    expect(regio(container).textContent).toBe('');
  });

  test('sense cap publicació candidata, cap petició, cap regió i el DOM de sempre', async () => {
    fixaMur([
      publicacio({ id: 'festa', title: 'Festa major', created_at: fa(1), labels: [{ text: 'Festes' }], author_org_id: AJUNTAMENT }),
      publicacio({ id: 'gat', title: 'Gat perdut', created_at: fa(2), labels: ['Alerta'], ownerUserId: 'u-vei' })
    ]);
    const { container } = render(<MurSection />);
    await new Promise((resolta) => setTimeout(resolta, 0));
    expect(mocks.directori).not.toHaveBeenCalled();
    expect(regio(container)).toBeNull();
    expect(container.querySelector('.sdp-mur-alerta, [class*="sdp-mur-alerta-targeta"]')).toBeNull();
  });
});

describe('ordre i vigència', () => {
  test('les alertes vigents pugen al capdamunt; una de fa cinc dies es queda al seu lloc, amb el distintiu', async () => {
    fixaMur([
      publicacio({ id: 'nova', title: 'Crònica de hui', created_at: fa(1), labels: ['Publicació'] }),
      publicacio({ id: 'aigua', title: 'Tall d’aigua', created_at: fa(30), labels: ['Bàndol urgent'], author_org_id: AJUNTAMENT }),
      publicacio({ id: 'mig', title: 'Crònica d’ahir', created_at: fa(40), labels: ['Publicació'] }),
      publicacio({ id: 'vella', title: 'Bàndol vell', created_at: fa(5 * 24), labels: ['Bàndol urgent'], author_org_id: AJUNTAMENT }),
      publicacio({ id: 'pluja', title: 'Pluges', created_at: fa(50), labels: ['Emergència'], author_org_id: AJUNTAMENT })
    ]);
    render(<MurSection />);
    expect(titols()).toEqual(['Crònica de hui', 'Tall d’aigua', 'Crònica d’ahir', 'Pluges', 'Bàndol vell']);
    await waitFor(() => expect(titols()[0]).toBe('Tall d’aigua'));
    expect(titols()).toEqual(['Tall d’aigua', 'Pluges', 'Crònica de hui', 'Crònica d’ahir', 'Bàndol vell']);
    expect(targeta('Bàndol vell').querySelector('.sdp-mur-alerta').textContent).toBe('Bàndol urgent');
  });
});

describe('semàntica accessible', () => {
  test('una sola regió viva, role="status", muntada buida abans de la resposta i plena després', async () => {
    let respon;
    mocks.directori.mockImplementation(() => new Promise((resolta) => { respon = resolta; }));
    fixaMur([
      publicacio({ id: 'aigua', title: 'Tall d’aigua', created_at: fa(2), labels: ['Bàndol urgent'], author_org_id: AJUNTAMENT }),
      publicacio({ id: 'pluja', title: 'Pluges', created_at: fa(1), labels: ['Emergència'], author_org_id: AJUNTAMENT })
    ]);
    const { container } = render(<MurSection />);
    const viva = regio(container);
    expect(viva).not.toBeNull();
    expect(viva.textContent).toBe('');
    expect(viva.getAttribute('role')).toBe('status');

    await waitFor(() => expect(mocks.directori).toHaveBeenCalled());
    respon(DIRECTORI);
    await waitFor(() => expect(viva.textContent).toContain('Hi ha 2 avisos municipals urgents'));
    // El mateix node (la regió ja existia): el lector anuncia el canvi.
    expect(regio(container)).toBe(viva);
    /* T7 · S2 (assalt 261101) · Cada avís diu fins quan és vigent: data
       absoluta (la de la targeta + 72 h) dins d'un <time>, mai un compte enrere. */
    const data = (titol) => dataDeCaducitat(Date.parse(mocks.mur.sortedFeedPosts.find((p) => p.title === titol).created_at) + VIGENCIA_ALERTA_MS, 'ca-ES');
    expect(within(viva).getAllByRole('listitem').map((li) => li.textContent)).toEqual([`Alerta municipal: Pluges · vigent fins a ${data('Pluges')}`, `Bàndol urgent: Tall d’aigua · vigent fins a ${data('Tall d’aigua')}`]);
    expect([...viva.querySelectorAll('li time')].map((temps) => temps.textContent)).toEqual([data('Pluges'), data('Tall d’aigua')]);
    expect(within(viva).getByRole('link', { name: 'Tall d’aigua' }).getAttribute('href')).toBe('/mur/aigua');
    // Dins de la regió no hi ha cap altra regió viva ni cap role="alert".
    expect(viva.querySelector('[role], [aria-live]')).toBeNull();

    // Cap altra regió viva del Mur parla de les alertes.
    const vives = [...container.querySelectorAll('[role="status"], [role="alert"], [aria-live]')]
      .filter((element) => /avís municipal|avisos municipals|Alerta municipal|Bàndol urgent/.test(element.textContent));
    expect(vives).toEqual([viva]);
    // El distintiu de cada targeta és text visible fora de cap regió viva.
    const distintius = [...container.querySelectorAll('.sdp-card-grid .sdp-mur-alerta')];
    expect(distintius).toHaveLength(2);
    for (const distintiu of distintius) expect(distintiu.closest('[role="status"], [role="alert"], [aria-live]')).toBeNull();
  });

  test('amb una sola vigent, el títol de l’avís ho diu en singular', async () => {
    fixaMur([publicacio({ id: 'aigua', title: 'Tall d’aigua', created_at: fa(2), labels: ['Bàndol urgent'], author_org_id: AJUNTAMENT })]);
    const { container } = render(<MurSection />);
    await waitFor(() => expect(regio(container).textContent).toContain('Hi ha 1 avís municipal urgent'));
  });
});
