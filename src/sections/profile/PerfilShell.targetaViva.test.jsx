import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';

/* ═══════════════════════════════════════════════════════════════════
   T50 · LA TARGETA VIVA DEL PERFIL, DE PUNTA A PUNTA

   Decisió del Mestre (260928): «Llista + dreta si hi cap». La fitxa activa
   de la columna central és la targeta viva del document que s'escriu a la
   tercera columna, i l'editor la porta també a la seua dreta (aside).

   Ací va tot de veres: PerfilShell → UniversalWorkspace (llista i detall) →
   PerfilEditor → DocumentEditor → UniversalEditorShell (EditableField).
   Només es simulen el context del Perfil (sense cua d'autodesament: el que
   s'escriu viu a l'estat local de l'editor), TipTap, el router i les
   peces que no hi entren.
   ═══════════════════════════════════════════════════════════════════ */

const m = vi.hoisted(() => ({ perfil: null }));
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} }),
}));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorId: null, refresh: vi.fn() }) }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ agents: [] }) }));
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
vi.mock('./PerfilContext.jsx', () => ({ PerfilProvider: ({ children }) => children, usePerfil: () => m.perfil }));
vi.mock('./DetallCompte.jsx', () => ({ DetallCompte: ({ identitat }) => <p>{`compte de ${identitat.nom}`}</p> }));
vi.mock('./DetallPrivacitat.jsx', () => ({ DetallPrivacitat: () => null }));
vi.mock('./DialegNovaOrganitzacio.jsx', () => ({ DialegNovaOrganitzacio: () => null }));
vi.mock('../../components/universal/richText', () => ({
  useUniversalRichText: () => null,
  useTipTapToolbarAdapter: () => ({ state: {}, exec: {} }),
  UniversalRichTextToolbar: () => null,
  UniversalRichTextContent: () => null,
}));
vi.mock('../../components/universal/richText/extensions', () => ({ extensionsRiques: () => [] }));
vi.mock('../notes/NotesSection.jsx', () => ({ LLAVOR_NOTA: '<p>llavor</p>' }));
vi.mock('../../components/universal/DocumentPrintPreview.jsx', () => ({ default: () => null }));
/* D4 · Un espia damunt de la targeta per defecte del Workspace, la de veres:
   el Workspace la crida per dins (enllaç local) i el Perfil per l'export. */
vi.mock('../../components/universal/workspace/UniversalWorkspace.jsx', async (importOriginal) => {
  const original = await importOriginal();
  return { ...original, DefaultItemCard: vi.fn(original.DefaultItemCard) };
});

import { sanitizeHtml } from '../../utils/sanitize.js';
import { aHtml } from './perfilCamps.js';
import { llegixDocumentViu } from '../../components/universal/documentViu.js';
import { DefaultItemCard } from '../../components/universal/workspace/UniversalWorkspace.jsx';
import PerfilShell from './PerfilShell.jsx';

const jo = {
  id: 'jo', mena: 'persona', nom: 'Javi Llinares', rol: 'Persona',
  dades: { full_name: 'Javi Llinares', bio: 'Llaurador', lema: 'Del Mas de Baix', town_name: 'La Torre', is_public: false },
};

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  }
  // jsdom no fa layout: sense amplada, AppGridShell cauria a «estret» i tancaria la llista.
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1400 });
});
beforeEach(() => {
  m.perfil = {
    identitats: [jo], carregant: false, error: null, autodesament: null,
    guardarAjust: vi.fn(), guardarCampPerfil: vi.fn(), pujaMitja: vi.fn(), recarrega: vi.fn(), creaOrganitzacio: vi.fn(),
  };
});
afterEach(cleanup);

const llista = (container) => container.querySelector('.sdp-gestor-llista');
const detall = (container) => container.querySelector('.sdp-workspace-detail');
const camp = (container, nom) => detall(container).querySelector(`.editor-${nom}-input`);
/* Una tecla: el navegador ja ha escrit al DOM quan arriba l'«input».
   Passa pel sanejador per complir la porta tractor-innerhtml. */
function escriu(container, nom, text) {
  const el = camp(container, nom);
  fireEvent.focus(el);
  el.innerHTML = sanitizeHtml(aHtml(text));
  fireEvent.input(el);
}

test('T50 · la fitxa activa de la llista és la targeta viva; la resta d’apartats, les fitxes compactes de sempre', () => {
  const { container } = render(<PerfilShell />);
  const targeta = llista(container).querySelector('article.sp-card.sp-card--pla');
  expect(targeta).not.toBeNull();
  expect(targeta.querySelector('.sp-card-title').textContent).toBe('Javi Llinares');
  expect(targeta.querySelector('.sp-card-subtitle').textContent).toBe('Llaurador');
  expect(targeta.querySelector('.sp-card-text').textContent).toBe('Del Mas de Baix');
  expect(targeta.querySelector('.sp-card-author-name').textContent).toBe('Javi Llinares');
  expect(targeta.querySelector('.sp-card-author-location').textContent).toBe('La Torre');
  expect(within(targeta).getByText('Persona')).toBeTruthy();
  // El compte (i, des de T9, «Els nodes») continuen sent fitxes compactes.
  expect([...llista(container).querySelectorAll('.sdp-gestor-fitxa__titol')].map((e) => e.textContent)).toEqual(['El compte', 'Els nodes']);
  // L'editor porta la mateixa targeta a la seua dreta.
  expect(detall(container).querySelector('aside.sdp-targeta-viva .sp-card-title').textContent).toBe('Javi Llinares');
});

test('T50 · escriure al títol, a l’H2 i a l’entradilla actualitza la targeta viva de la llista i la de l’aside', () => {
  const { container } = render(<PerfilShell />);
  act(() => { escriu(container, 'title', 'Javi del Mas & Cia'); });
  act(() => { escriu(container, 'subtitle', 'Llaurador de tomaques'); });
  act(() => { escriu(container, 'lead', 'Visc a la Torre des de sempre.'); });
  for (const arrel of [llista(container), detall(container).querySelector('aside.sdp-targeta-viva')]) {
    // Text pla: l'&amp; de l'editor no arriba a la targeta.
    expect(arrel.querySelector('.sp-card-title').textContent).toBe('Javi del Mas & Cia');
    expect(arrel.querySelector('.sp-card-subtitle').textContent).toBe('Llaurador de tomaques');
    expect(arrel.querySelector('.sp-card-text').textContent).toBe('Visc a la Torre des de sempre.');
  }
  // El nom accessible de la fitxa (que la torna a triar) segueix el títol.
  expect(within(llista(container)).getByRole('button', { name: 'Javi del Mas & Cia' })).toBeTruthy();
});

test('T50 · canviar d’apartat desmunta l’editor: l’entrada viva es retira i «La fitxa» torna a compacta', () => {
  const { container } = render(<PerfilShell />);
  expect(llegixDocumentViu('jo')).not.toBeNull();
  fireEvent.click(within(llista(container)).getByRole('button', { name: /El compte/ }));
  expect(within(detall(container)).getByText('compte de Javi Llinares')).toBeTruthy();
  expect(llegixDocumentViu('jo')).toBeNull();
  expect(llista(container).querySelector('.sp-card')).toBeNull();
  expect([...llista(container).querySelectorAll('.sdp-gestor-fitxa__titol')].map((e) => e.textContent)).toEqual(['La fitxa', 'El compte', 'Els nodes']);
  // I en tornar a la fitxa, torna la targeta viva.
  fireEvent.click(within(llista(container)).getByRole('button', { name: /La fitxa/ }));
  expect(llista(container).querySelector('.sp-card-title').textContent).toBe('Javi Llinares');
});

test('T50 · els botons de la targeta de la llista no naveguen: avís de previsualització', () => {
  const { container } = render(<PerfilShell />);
  fireEvent.click(within(llista(container)).getByRole('button', { name: /Comentar Javi Llinares/ }));
  expect(screen.getByRole('dialog', { name: 'Això és una previsualització' }).open).toBe(true);
});

/* ── T66 (ordre del Mestre, 260928) · L'emoticona de la fitxa ─────────── */
const emoticonaDe = (arrel) => arrel.querySelector('.sp-card .sdp-emoticona-barra');

test('T66 · sense emoticona triada, cap targeta en pinta (ni la ploma); amb una, la llista i l’aside la porten', () => {
  const { container } = render(<PerfilShell />);
  expect(emoticonaDe(llista(container))).toBeNull();
  expect(emoticonaDe(detall(container).querySelector('aside.sdp-targeta-viva'))).toBeNull();
  cleanup();
  m.perfil.identitats = [{ ...jo, dades: { ...jo.dades, icon: '🌾' } }];
  const ambIcon = render(<PerfilShell />);
  expect(emoticonaDe(llista(ambIcon.container)).textContent).toBe('🌾');
  expect(emoticonaDe(detall(ambIcon.container).querySelector('aside.sdp-targeta-viva')).textContent).toBe('🌾');
});

/* Ordre del Mestre (261007) · «Aplica a TargetaViva.jsx (quan actua com a
   ítem de llista)»: sense capçalera i amb una emoticona triada, l'emoji XL
   ocupa el quadrat de «La fitxa» a la llista. L'aside de l'editor no és cap
   ítem de llista i es queda sense quadrat (Llei del Píxel). */
test('261007 · sense imatge, l’emoticona triada de la fitxa ocupa el quadrat en XL a la llista; l’aside, sense quadrat', () => {
  const quadrat = (arrel) => arrel.querySelector('.sp-card-body > .sp-card-calendar-badge .sp-card-calendar-badge__emoji');
  const { container } = render(<PerfilShell />);
  expect(quadrat(llista(container))).toBeNull();
  cleanup();
  m.perfil.identitats = [{ ...jo, dades: { ...jo.dades, icon: '🌾' } }];
  const ambIcon = render(<PerfilShell />);
  expect(quadrat(llista(ambIcon.container)).textContent).toBe('🌾');
  expect(quadrat(llista(ambIcon.container)).getAttribute('aria-hidden')).toBe('true');
  const aside = detall(ambIcon.container).querySelector('aside.sdp-targeta-viva');
  expect(aside.querySelector('.sp-card')).not.toBeNull();
  expect(aside.querySelector('.sp-card-calendar-badge')).toBeNull();
  // L'emoticona continua a la caputxa de l'aside (T66).
  expect(emoticonaDe(aside).textContent).toBe('🌾');
});

test('T66 · triar l’emoticona des del botó de la barra taronja la posa a la targeta viva de seguida', () => {
  const { container } = render(<PerfilShell />);
  const boto = detall(container).querySelector('.bar-orange .sdp-emoticona-barra--boto');
  expect(boto.getAttribute('aria-label')).toBe('Triar l’emoticona del document');
  fireEvent.click(boto);
  const dialeg = screen.getByRole('dialog', { name: 'Emoticona del document' });
  fireEvent.change(within(dialeg).getByRole('textbox'), { target: { value: '🍅' } });
  act(() => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Desar' })); });
  expect(emoticonaDe(llista(container)).textContent).toBe('🍅');
  expect(detall(container).querySelector('.bar-orange .sdp-emoticona-barra--boto').textContent).toBe('🍅');
});

/* ── Poliment T50 (revisió: D1, D4 i D5) ───────────────────────────────── */
test('D1 · l’avís de la targeta del Perfil no promet cap publicació', () => {
  const { container } = render(<PerfilShell />);
  fireEvent.click(within(llista(container)).getByRole('button', { name: /Comentar Javi Llinares/ }));
  const avis = screen.getByRole('dialog', { name: 'Això és una previsualització' });
  expect(avis.textContent).toContain('Així es veu esta fitxa en format targeta.');
  expect(avis.textContent).not.toMatch(/publica/i);
});

test('D5 · la targeta viva exposa que és la fitxa triada; D4 · la compacta és la targeta per defecte del Workspace', () => {
  DefaultItemCard.mockClear();
  const { container } = render(<PerfilShell />);
  // El compte és la targeta per defecte del Workspace, per l'export (cap còpia al Perfil).
  expect(DefaultItemCard.mock.calls.map(([props]) => props.item.title)).toContain('El compte');
  const actuals = () => [...llista(container).querySelectorAll('[aria-current]')];
  expect(actuals()).toHaveLength(1);
  expect(actuals()[0].className).toBe('sp-card-link-overlay');
  expect(actuals()[0].getAttribute('aria-current')).toBe('true');
  expect(actuals()[0].getAttribute('aria-label')).toBe('Javi Llinares');
  fireEvent.click(within(llista(container)).getByRole('button', { name: /El compte/ }));
  // Ara les dues són compactes, amb el DOM de DefaultItemCard, i la triada ho diu.
  const [fitxa, compte] = [...llista(container).querySelectorAll('li > button')];
  for (const boto of [fitxa, compte]) {
    expect(boto.className).toBe('sdp-gestor-fitxa');
    expect([...boto.children].map((e) => e.className).at(-1)).toBe('sdp-gestor-fitxa__text');
  }
  expect(fitxa.hasAttribute('aria-current')).toBe(false);
  expect(compte.getAttribute('aria-current')).toBe('true');
});
