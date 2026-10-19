import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';

/* ═══════════════════════════════════════════════════════════════════
   T50 · LA TARGETA VIVA DEL PERFIL, DE PUNTA A PUNTA

   Decisió del Mestre (260928): «Llista + dreta si hi cap». La fitxa activa
   de la columna central és la targeta viva del document que s'escriu a la
   tercera columna.
   Pla 261015_1900 (Onada 1.2: «poda de la quarta columna») · L'editor ja
   no la porta a la seua dreta (cap aside): la targeta viva es queda a la
   llista i a «Les vistes». Directiva de Dignitat Humana (Onada 1.1) · La
   targeta d'una persona no porta drets d'autor ni la píndola «Persona».
   Onada 1.3 · Els apartats compactes porten el seu emoji en XL.

   Ací va tot de veres: PerfilShell → UniversalWorkspace (llista i detall) →
   PerfilEditor → DocumentEditor → UniversalEditorShell (EditableField).
   Només es simulen el context del Perfil (sense cua d'autodesament: el que
   s'escriu viu a l'estat local de l'editor), TipTap, el router i les
   peces que no hi entren.
   ═══════════════════════════════════════════════════════════════════ */

/* Bloc 3.5.4 (Gauntlet 261016) · `usuari` i `updateProfile` només els posa la
   prova del 403 (amb la cua d'autodesament); nul·les, el port de sempre. jsdom
   no té canvas: la frontera del retallador i compressImage, simulades. */
const m = vi.hoisted(() => ({ perfil: null, usuari: null, updateProfile: null }));
const dobles = vi.hoisted(() => ({ carregaImatge: vi.fn(), exportaRetall: vi.fn(), compressImage: vi.fn() }));
vi.mock('../../components/universal/enquadrament/imatgeCanvas.js', () => ({
  carregaImatge: dobles.carregaImatge,
  dibuixaVisor: () => true,
  exportaRetall: dobles.exportaRetall,
}));
vi.mock('../../utils/imageUtils.js', () => ({ compressImage: dobles.compressImage }));
vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({ url: ref, status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} }),
}));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorId: null, refresh: vi.fn() }) }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ agents: [] }) }));
/* Gauntlet 261016 (Bloc 3.4) · PerfilShell també llig useSessioOpcional (qui és superadmin). */
vi.mock('../../app/contexts/SessionContext.jsx', () => ({
  useSession: () => ({ currentUser: null, estat: 'fora', generacio: 1 }),
  useSessioOpcional: () => null,
}));
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
vi.mock('../../data/backendPort.js', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    teCapacitat: () => false,
    getCurrentUser: (...args) => (m.usuari ?? original.getCurrentUser(...args)),
    updateProfile: (...args) => (m.updateProfile ?? original.updateProfile)(...args),
  };
});
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
import { cuaDesament } from '../../data/autodesament/cua.js';
import { ambitDe } from '../../data/autodesament/ambit.js';
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
  m.usuari = null;
  m.updateProfile = null;
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
  // Dignitat Humana (261015) · Ni la píndola «Persona» ni drets d'autor: el poble va a l'autoria.
  expect(within(targeta).queryByText('Persona')).toBeNull();
  expect(targeta.querySelector('.sp-card-labels')).toBeNull();
  expect(targeta.querySelector('.sp-card-copyright')).toBeNull();
  // El compte (i, des de T9, «Els nodes»; des del 261008, «Les vistes») continuen sent fitxes compactes.
  // Expectativa actualitzada a propòsit: Pla 261018_1605, Tasca 4 («Multimèdia», l’últim apartat de la persona).
  expect([...llista(container).querySelectorAll('.sdp-gestor-fitxa__titol')].map((e) => e.textContent)).toEqual(['Les vistes', 'El compte', 'Els nodes', 'Multimèdia']);
  // Pla 261015 · L'editor ja no porta la targeta a la seua dreta: ni l'embolcall ni l'aside.
  expect(detall(container).querySelector('.sdp-editor-shell-atomic')).not.toBeNull();
  expect(detall(container).querySelector('.sdp-editor-amb-targeta')).toBeNull();
  expect(detall(container).querySelector('aside.sdp-targeta-viva')).toBeNull();
  expect(screen.queryByRole('complementary', { name: 'Previsualització de la targeta' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Vista targeta' })).toBeNull();
});

test('T50 · escriure al títol, a l’H2 i a l’entradilla actualitza la targeta viva de la llista', () => {
  const { container } = render(<PerfilShell />);
  act(() => { escriu(container, 'title', 'Javi del Mas & Cia'); });
  act(() => { escriu(container, 'subtitle', 'Llaurador de tomaques'); });
  act(() => { escriu(container, 'lead', 'Visc a la Torre des de sempre.'); });
  const arrel = llista(container);
  // Text pla: l'&amp; de l'editor no arriba a la targeta.
  expect(arrel.querySelector('.sp-card-title').textContent).toBe('Javi del Mas & Cia');
  expect(arrel.querySelector('.sp-card-subtitle').textContent).toBe('Llaurador de tomaques');
  expect(arrel.querySelector('.sp-card-text').textContent).toBe('Visc a la Torre des de sempre.');
  // El nom accessible de la fitxa (que la torna a triar) segueix el títol.
  expect(within(llista(container)).getByRole('button', { name: 'Javi del Mas & Cia' })).toBeTruthy();
});

/* Pla 261015_1900 (Onada 1.3) · Els apartats compactes de la llista porten el
   seu emoji en XL al quadrat de la fitxa (ItemMedia, sdp-fitxa-emoji-xl), com
   la Wiki i Disseny; el nom accessible de cada fitxa no canvia. */
test('Pla 261015 · «Les vistes», «El compte» i «Els nodes» porten el seu emoji XL; el nom accessible, el de sempre', () => {
  const { container } = render(<PerfilShell />);
  const emojiDe = (nom) => within(llista(container)).getByRole('button', { name: new RegExp(nom) })
    .querySelector('.sdp-fitxa-emoji-xl')?.textContent;
  expect(emojiDe('Les vistes')).toBe('\u{1F441}\u{FE0F}');
  expect(emojiDe('El compte')).toBe('\u{1F510}');
  expect(emojiDe('Els nodes')).toBe('\u{1F310}');
});

test('T50 · canviar d’apartat desmunta l’editor: l’entrada viva es retira i «La fitxa» torna a compacta', () => {
  const { container } = render(<PerfilShell />);
  expect(llegixDocumentViu('jo')).not.toBeNull();
  fireEvent.click(within(llista(container)).getByRole('button', { name: /El compte/ }));
  expect(within(detall(container)).getByText('compte de Javi Llinares')).toBeTruthy();
  expect(llegixDocumentViu('jo')).toBeNull();
  expect(llista(container).querySelector('.sp-card')).toBeNull();
  // Expectativa actualitzada a propòsit: Pla 261018_1605, Tasca 4 («Multimèdia», l’últim apartat de la persona).
  expect([...llista(container).querySelectorAll('.sdp-gestor-fitxa__titol')].map((e) => e.textContent)).toEqual(['La fitxa', 'Les vistes', 'El compte', 'Els nodes', 'Multimèdia']);
  // I en tornar a la fitxa, torna la targeta viva.
  fireEvent.click(within(llista(container)).getByRole('button', { name: /La fitxa/ }));
  expect(llista(container).querySelector('.sp-card-title').textContent).toBe('Javi Llinares');
});

/* Ordre del Mestre (261008) · «Les vistes», de punta a punta: l'editor es
   desmunta (cap entrada viva) i la pàgina refà la targeta de la fitxa, amb
   la mateixa autoria i l'avís del Perfil. Ací no hi ha cua d'autodesament:
   la fitxa del servidor. */
test('261008 · «Les vistes» porta la targeta de la fitxa fora de l’editor, amb l’autoria i l’avís del Perfil', () => {
  const { container } = render(<PerfilShell />);
  fireEvent.click(within(llista(container)).getByRole('button', { name: /Les vistes/ }));
  expect(llegixDocumentViu('jo')).toBeNull();
  const pagina = detall(container);
  expect(within(pagina).getByRole('heading', { level: 1, name: 'Les vistes' })).toBeTruthy();
  expect(pagina.querySelector('.sdp-editor-document')).toBeNull();
  const carta = within(pagina).getByRole('heading', { level: 2, name: 'Vista targeta' }).closest('section').querySelector('article.sdp-targeta-viva-carta');
  expect(carta.querySelector('.sp-card-title').textContent).toBe('Javi Llinares');
  expect(carta.querySelector('.sp-card-subtitle').textContent).toBe('Llaurador');
  expect(carta.querySelector('.sp-card-author-location').textContent).toBe('La Torre');
  fireEvent.click(within(carta).getByRole('button', { name: /Comentar Javi Llinares/ }));
  expect(screen.getByRole('dialog', { name: 'Això és una previsualització' }).textContent).toContain('Així es veu esta fitxa en format targeta.');
});

test('T50 · els botons de la targeta de la llista no naveguen: avís de previsualització', () => {
  const { container } = render(<PerfilShell />);
  fireEvent.click(within(llista(container)).getByRole('button', { name: /Comentar Javi Llinares/ }));
  expect(screen.getByRole('dialog', { name: 'Això és una previsualització' }).open).toBe(true);
});

/* ── T66 (ordre del Mestre, 260928) · L'emoticona de la fitxa ─────────── */
const emoticonaDe = (arrel) => arrel.querySelector('.sp-card .sdp-emoticona-barra');

test('T66 · sense emoticona triada, cap targeta en pinta (ni la ploma); amb una, la llista la porta', () => {
  const { container } = render(<PerfilShell />);
  expect(emoticonaDe(llista(container))).toBeNull();
  cleanup();
  m.perfil.identitats = [{ ...jo, dades: { ...jo.dades, icon: '🌾' } }];
  const ambIcon = render(<PerfilShell />);
  expect(emoticonaDe(llista(ambIcon.container)).textContent).toBe('🌾');
});

/* Ordre del Mestre (261007) · «Aplica a TargetaViva.jsx (quan actua com a
   ítem de llista)»: sense capçalera i amb una emoticona triada, l'emoji XL
   ocupa el quadrat de «La fitxa» a la llista. Pla 261015 · Ja no hi ha cap
   aside a l'editor que la repetisca. */
test('261007 · sense imatge, l’emoticona triada de la fitxa ocupa el quadrat en XL a la llista; l’editor, sense aside', () => {
  const quadrat = (arrel) => arrel.querySelector('.sp-card-body > .sp-card-calendar-badge .sp-card-calendar-badge__emoji');
  const { container } = render(<PerfilShell />);
  expect(quadrat(llista(container))).toBeNull();
  cleanup();
  m.perfil.identitats = [{ ...jo, dades: { ...jo.dades, icon: '🌾' } }];
  const ambIcon = render(<PerfilShell />);
  expect(quadrat(llista(ambIcon.container)).textContent).toBe('🌾');
  expect(quadrat(llista(ambIcon.container)).getAttribute('aria-hidden')).toBe('true');
  expect(detall(ambIcon.container).querySelector('aside.sdp-targeta-viva')).toBeNull();
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
  // 261008 · «Les vistes» va entre «La fitxa» i «El compte».
  const [fitxa, vistes, compte] = [...llista(container).querySelectorAll('li > button')];
  for (const boto of [fitxa, vistes, compte]) {
    expect(boto.className).toBe('sdp-gestor-fitxa');
    expect([...boto.children].map((e) => e.className).at(-1)).toBe('sdp-gestor-fitxa__text');
  }
  expect(fitxa.hasAttribute('aria-current')).toBe(false);
  expect(vistes.hasAttribute('aria-current')).toBe(false);
  expect(compte.getAttribute('aria-current')).toBe('true');
});

/* ── Bloc 3.5.4 (Gauntlet 261016; pla, Onada 1.1.4) ────────────────────────
   «A PerfilShell, la targeta central (TargetaViva) i el panell d'edició
   (PerfilEditor) han de beure exactament de la mateixa instància de dades.»
   El contraexemple de Codex (relleu 02:26, P2), ara de punta a punta per la
   pantalla de veres: la targeta viva de la llista i l'editor del detall, amb
   la cua d'autodesament i un 403/42501 injectat al PATCH de profiles. */
test('Bloc 3.5.4 · després d’un 403 al desat de l’avatar, la targeta de la llista i l’editor porten la mateixa foto, i el retallador continua obert amb el motiu', async () => {
  const CONFIG = Object.freeze({ tenantId: '00000000-0000-4000-8000-000000000000' });
  const VELLA = '/assets/a.webp';
  const NOVA = '/assets/nou.webp';
  await cuaDesament.reinicia();
  m.usuari = { id: 'U' };
  m.updateProfile = vi.fn(async () => {
    throw Object.assign(new Error('Supabase 403: {"code":"42501","message":"permission denied for table profiles"}'), { status: 403, code: '42501' });
  });
  const javi = { ...jo, avatar: VELLA, dades: { ...jo.dades, id: 'U', avatar_url: VELLA } };
  m.perfil = {
    ...m.perfil, identitats: [javi], autodesament: { ambit: ambitDe(CONFIG, 'U'), context: CONFIG },
    pujaMitja: vi.fn(async () => NOVA),
  };
  dobles.carregaImatge.mockReset().mockResolvedValue({ amplada: 2000, alcada: 1500, tipus: 'image/png', element: {}, allibera: vi.fn() });
  dobles.exportaRetall.mockReset().mockResolvedValue(new File(['y'], 'enquadrament.png', { type: 'image/png' }));
  dobles.compressImage.mockReset().mockResolvedValue('data:image/webp;base64,AAAA');
  /* Només el fetch del data URL: vi.unstubAllGlobals també trauria el ResizeObserver de beforeAll. */
  const fetchDAbans = globalThis.fetch;
  globalThis.fetch = vi.fn(async () => ({ blob: async () => new Blob(['w'], { type: 'image/webp' }) }));
  try {
    const { container } = render(<PerfilShell />);
    const deLaLlista = () => llista(container).querySelector('article.sdp-targeta-viva-carta img.sp-card-avatar')?.getAttribute('src');
    const delEditor = () => detall(container).querySelector('button.page-title-avatar--canvia img')?.getAttribute('src');
    expect([deLaLlista(), delEditor()]).toEqual([VELLA, VELLA]);
    fireEvent.click(detall(container).querySelector('button.page-title-avatar--canvia'));
    const selector = container.ownerDocument.querySelector('input[type="file"][data-imatge-de-fitxa="logoImage"]');
    await act(async () => { fireEvent.change(selector, { target: { files: [new File(['x'], 'foto.png', { type: 'image/png' })] } }); });
    await act(async () => {});
    /* Expectativa actualitzada a propòsit: ordre del Mestre (18-10-2026, relleu
       del Pla 2000, punt 2) · la finestra de l'avatar desa amb «Guardar enquadre». */
    await act(async () => {
      fireEvent.click(within(screen.getByRole('dialog', { name: 'Retalla la foto' })).getByRole('button', { name: 'Guardar enquadre' }));
    });
    await waitFor(() => expect(within(screen.getByRole('dialog', { name: 'Retalla la foto' })).getByRole('alert').textContent)
      .toContain('El servidor no ha acceptat la imatge (falta un permís al servidor per a desar este camp'));
    expect(m.updateProfile.mock.calls).toEqual([[{ avatar_url: NOVA }, CONFIG]]);
    expect([deLaLlista(), delEditor()]).toEqual([NOVA, NOVA]);
    expect(cuaDesament.llig({ ambit: ambitDe(CONFIG, 'U'), entitat: 'perfil', id: 'jo' }).camps.logoImage).toBe(NOVA);
  } finally {
    globalThis.fetch = fetchDAbans;
    cleanup();
    await cuaDesament.reinicia();
  }
});
