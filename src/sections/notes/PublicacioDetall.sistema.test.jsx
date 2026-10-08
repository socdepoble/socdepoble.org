/**
 * Grup E de l'Onada 4 (prompt 261008_1201, tasca 2; decisió del Mestre del
 * 261008: el «Sóc de Poble loguejat» és l'ENTITAT socdepoble) · Una pàgina del
 * sistema que el Mur signa com a «Sóc de Poble» (isSystem), oberta des del
 * Bloc de l'entitat, es llig com la seua ruta: les props de TextSection
 * (propsDePaginaDeText) i el cos pel mateix camí (CosDeLaPagina). Només
 * lectura: «Obri la pàgina» a la seua ruta, Compartir amb eixe enllaç,
 * Comentar al xat comú de la pàgina, l'acció gran si en té (El Xat) i, al
 * peu, el que l'entitat ja té publicat al Mur, sense ella mateixa.
 */
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(), toast: vi.fn(), pagina: null, t: (_, alternativa) => alternativa,
  identitat: null, core: null, media: { status: 'ready', mediaItems: [] }, mur: null
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => mocks.navigate,
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: mocks.t }),
  /* Sense UIProvider: fora de l'app, cap crida al port. */
  useUIState: () => { throw new Error('fora de l’app'); }
}));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: { id: 'U' } }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => mocks.identitat }));
vi.mock('../mur/MurContext', () => ({ useMur: () => mocks.mur }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => mocks.core }));
vi.mock('../multimedia/MultimediaContext', () => ({ useMultimedia: () => mocks.media }));
/* La pàgina de veres, però amb les props a la vista. */
vi.mock('../../components/universal/UniversalPage', async (importOriginal) => {
  const real = await importOriginal();
  return { UniversalPage: (props) => { mocks.pagina = props; return React.createElement(real.UniversalPage, props); } };
});

import { PublicacioDetall } from './PublicacioDetall.jsx';
import { publicacioComANota } from './masDeLUsuari.js';
import { targetesDeSistema } from '../mur/targetesMur.js';
import { propsDePaginaDeText } from '../text/paginaDeText.js';
import { PAGE_COPY } from '../text/pageContent.js';
import { ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG } from '../../data/identitatsSeed.js';
import { TEXTOS_COMENTAR } from '../../components/PedraSeca/organismes/textosComentar.js';

const SISTEMA = targetesDeSistema(PAGE_COPY);
const pagina = (clau) => publicacioComANota(SISTEMA.find((targeta) => targeta.id === clau), 'mur');
const escriu = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  mocks.pagina = null;
  mocks.identitat = { actor: { tipus: 'entitat', id: ENTITAT_PILOT_ID, slug: ENTITAT_PILOT_SLUG, rol: 'owner' } };
  mocks.core = { status: 'ready', pageCopy: PAGE_COPY, refresh: () => {} };
  mocks.mur = { status: 'ready', refresh: vi.fn(), sortedFeedPosts: [], sortedMarketItems: [], sortedEvents: [] };
  escriu.mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText: escriu }, configurable: true });
});
afterEach(cleanup);

/* El menú de Comentar de la barra blava i la seua via (patró de ConnexioDetall.test.jsx). */
const destiXat = () => {
  const url = new URL(mocks.navigate.mock.calls.at(-1)[0], 'http://localhost');
  return { cami: url.pathname, ...Object.fromEntries(url.searchParams) };
};
function via(container, nom) {
  const boto = container.querySelector('header.bar-blue .sp-card-actions').children[1];
  expect(boto.getAttribute('aria-label')).toBe('Comentar');
  if (boto.getAttribute('aria-expanded') !== 'true') fireEvent.click(boto);
  return within(container.querySelector('header.bar-blue [role="menu"]')).getByRole('menuitem', { name: nom });
}

describe('PublicacioDetall · una pàgina del sistema', () => {
  test('es llig com la seua ruta: les props de TextSection, la data del copy i el cos de la pàgina', () => {
    const { container } = render(<PublicacioDetall item={pagina('projecte')} />);
    expect(mocks.pagina).toMatchObject({
      ...propsDePaginaDeText(PAGE_COPY.projecte, 'projecte', mocks.t),
      chrome: 'context', layout: 'contained', onConnect: false
    });
    expect(container.querySelector('header.page-title h1').textContent).toContain(PAGE_COPY.projecte.title);
    const cos = container.querySelector('article.cms-preview');
    expect(cos).not.toBeNull();
    expect(cos.textContent.trim().length).toBeGreaterThan(0);
    // Només lectura: cap editor ni camp editable.
    expect(container.querySelector('[contenteditable]')).toBeNull();
    expect(container.querySelector('.sdp-editor-shell-atomic')).toBeNull();
  });

  test('«Obri la pàgina» porta a la seua ruta (mainHref), mai a /mur/:id', () => {
    render(<PublicacioDetall item={pagina('projecte')} />);
    expect(screen.queryByRole('button', { name: 'Obri al Mur' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Obri la pàgina' }));
    expect(mocks.navigate).toHaveBeenCalledWith('/projecte');
  });

  test('Compartir envia l’enllaç de la pàgina, no el del Bloc', async () => {
    render(<PublicacioDetall item={pagina('xat')} />);
    fireEvent.click(screen.getByRole('button', { name: 'Compartir' }));
    await waitFor(() => expect(escriu).toHaveBeenCalledWith(new URL('/page/xat', window.location.origin).href));
    expect(escriu.mock.calls[0][0]).not.toContain('nota=');
  });

  test('Comentar «En públic» obri el xat comú de la pàgina, com la seua targeta del Mur', () => {
    const { container } = render(<PublicacioDetall item={pagina('constitucio')} />);
    expect(mocks.pagina.objecte).toMatchObject({ tipus: 'pagina', ruta: '/constitucio' });
    fireEvent.click(via(container, TEXTOS_COMENTAR.public[1]));
    expect(destiXat()).toMatchObject({ cami: '/xat', sobre: 'pagina:/constitucio', ruta: '/constitucio' });
  });

  test('El Xat porta la seua acció gran davall de l’H1 («Anar al xat» cap a /xat); una pàgina sense, cap', () => {
    const { unmount } = render(<PublicacioDetall item={pagina('xat')} />);
    expect(mocks.pagina.accioPrincipal).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Anar al xat' }).getAttribute('href')).toBe('/xat');
    unmount();
    render(<PublicacioDetall item={pagina('projecte')} />);
    expect(Object.hasOwn(mocks.pagina, 'accioPrincipal')).toBe(false);
  });

  test('al peu, «Ja publicat al Mur» amb les altres pàgines de l’entitat i sense la mateixa', () => {
    render(<PublicacioDetall item={pagina('xat')} />);
    const peu = screen.getByRole('region', { name: 'Ja publicat al Mur' });
    const titols = [...peu.querySelectorAll('.sp-card-title')].map((titol) => titol.textContent);
    expect(titols).toHaveLength(SISTEMA.length - 1);
    expect(titols).toContain(PAGE_COPY.projecte.title);
    expect(titols).not.toContain(PAGE_COPY.xat.title);
  });

  /* Revisió del grup E (troballa 2) · /disseny munta DesignSection, /notes el
     Bloc i /wikidepoble la Wiki: cap de les tres pinta el text de PAGE_COPY, i
     paginaDeText.js ja les deixa fora del lector de connexions perquè «el
     lector mostraria una pàgina que no és la de la ruta». Ací, igual: la
     capçalera de la seua targeta del Mur i «Obri la pàgina», sense cos. Les
     altres set són pàgines de text de la seua ruta i porten el cos. */
  test('una pàgina del sistema que no és de text (Disseny, Notes, Wiki) no pinta cap cos: la capçalera i «Obri la pàgina»', () => {
    const SENSE_COS = ['disseny', 'notes', 'wikidepoble'];
    expect(SISTEMA).toHaveLength(10);
    for (const targeta of SISTEMA) {
      const { container, unmount } = render(<PublicacioDetall item={pagina(targeta.id)} />);
      const ambCos = !SENSE_COS.includes(targeta.id);
      expect([targeta.id, Boolean(container.querySelector('article.cms-preview'))]).toEqual([targeta.id, ambCos]);
      expect(container.querySelector('header.page-title h1').textContent).toContain(PAGE_COPY[targeta.id].title);
      fireEvent.click(screen.getByRole('button', { name: 'Obri la pàgina' }));
      expect(mocks.navigate).toHaveBeenLastCalledWith(targeta.mainHref);
      unmount();
    }
  });

  test('el Foraster no veu cap peu', () => {
    mocks.identitat = { actor: { tipus: 'persona', id: '00000000-0000-4000-8000-0000000c0f1d', rol: 'convidat' } };
    const { container } = render(<PublicacioDetall item={pagina('projecte')} />);
    expect(container.querySelector('.sdp-pagina-peu')).toBeNull();
  });
});
