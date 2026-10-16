import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

/* ═══════════════════════════════════════════════════════════════════
   GAUNTLET 261016 (ENCÀRREC D) · UNA SOLA FOTO A TOTES LES SUPERFÍCIES
   DEL PERFIL

   Pla, Onada 1.1.4: «la targeta central (TargetaViva) i el panell d'edició
   (PerfilEditor) han de beure exactament de la mateixa instància de dades.
   És inadmissible que a la mateixa pantalla es mostre una foto al centre i
   una altra a la dreta.» El Bloc 3.5.4 i la F1 ho van fer per a l'editor, la
   barra taronja, la targeta viva i «Les vistes»; la fitxa compacta de la
   llista central (DefaultItemCard, item.image) i «El compte» (DetallCompte)
   continuaven llegint identitat.avatar, la foto del servidor: després d'un
   avatar rebutjat, una foto al centre i una altra a la dreta. Ara totes
   lligen avatarDeLaFitxa (fitxaDePerfil.js).

   De punta a punta, com PerfilShell.targetaViva.test.jsx: PerfilShell →
   UniversalWorkspace (llista i detall) → PerfilEditor, DetallVistes i
   DetallCompte de veres, amb la cua d'autodesament de veres i el 403/42501
   injectat al port (updateProfile, updateOrganization). Es simulen el
   context del Perfil, la frontera del retallador (jsdom no té canvas),
   TipTap, el router i les peces que no hi entren. Dades sintètiques.
   ═══════════════════════════════════════════════════════════════════ */

const m = vi.hoisted(() => ({
  perfil: null, usuari: null, updateProfile: null, updateOrganization: null, params: new URLSearchParams(),
}));
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
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => ({ actorId: null, actor: null, refresh: vi.fn() }) }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ agents: [], towns: [] }) }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({
  useSession: () => ({ currentUser: null, estat: 'fora', generacio: 1, logout: vi.fn() }),
  useSessioOpcional: () => null,
}));
vi.mock('../../app/contexts/RouterContext', () => ({
  useRouter: () => ({ navigate: vi.fn(), location: { pathname: '/el-meu-perfil' } }),
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/el-meu-perfil' }),
  useSearchParams: () => [m.params],
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
    updateOrganization: (...args) => (m.updateOrganization ?? original.updateOrganization)(...args),
  };
});
/* «El compte» de veres: el catàleg d'ajustos (ajustosPersona, ajustosOrganitzacio) és el del context. */
vi.mock('./PerfilContext.jsx', async (importOriginal) => ({
  ...(await importOriginal()),
  PerfilProvider: ({ children }) => children,
  usePerfil: () => m.perfil,
  usePerfilOpcional: () => m.perfil,
}));
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

import { cuaDesament } from '../../data/autodesament/cua.js';
import { ambitDe } from '../../data/autodesament/ambit.js';
import PerfilShell from './PerfilShell.jsx';

const CONFIG = Object.freeze({ tenantId: '00000000-0000-4000-8000-000000000000' });
const AMBIT = ambitDe(CONFIG, 'U');
const VELLA = '/assets/a.webp';
const NOVA = '/assets/nou.webp';
const LOGO_VELL = '/assets/rentonar.webp';
const error403 = (taula) => Object.assign(
  new Error(`Supabase 403: {"code":"42501","message":"permission denied for table ${taula}"}`), { status: 403, code: '42501' },
);

const javi = {
  id: 'jo', mena: 'persona', nom: 'Javi Llinares', rol: 'Persona', avatar: VELLA,
  dades: { id: 'U', full_name: 'Javi Llinares', bio: 'Llaurador', town_name: 'La Torre de les Maçanes', is_public: false, avatar_url: VELLA },
};
const rentonar = {
  id: 'R', mena: 'grup', nom: 'El Rentonar', rol: 'Propietària', avatar: LOGO_VELL,
  dades: { name: 'El Rentonar', visibility: 'public', role: 'owner', town_name: 'La Torre de les Maçanes', logo_url: LOGO_VELL },
};

let fetchDAbans;
beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  }
  // jsdom no fa layout: sense amplada, AppGridShell cauria a «estret» i tancaria la llista.
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1400 });
});
beforeEach(async () => {
  await cuaDesament.reinicia();
  m.usuari = { id: 'U' };
  m.params = new URLSearchParams();
  m.updateProfile = vi.fn(async () => { throw error403('profiles'); });
  m.updateOrganization = vi.fn(async () => { throw error403('organizations'); });
  m.perfil = {
    identitats: [javi, rentonar], carregant: false, error: null, contactes: {}, ambMembres: false,
    autodesament: { ambit: AMBIT, context: CONFIG },
    guardarAjust: vi.fn(), guardarCampPerfil: vi.fn(), pujaMitja: vi.fn(async () => NOVA), recarrega: vi.fn(), creaOrganitzacio: vi.fn(),
  };
  dobles.carregaImatge.mockReset().mockResolvedValue({ amplada: 2000, alcada: 1500, tipus: 'image/png', element: {}, allibera: vi.fn() });
  dobles.exportaRetall.mockReset().mockResolvedValue(new File(['y'], 'enquadrament.png', { type: 'image/png' }));
  dobles.compressImage.mockReset().mockResolvedValue('data:image/webp;base64,AAAA');
  /* Només el fetch del data URL: vi.unstubAllGlobals també trauria el ResizeObserver de beforeAll. */
  fetchDAbans = globalThis.fetch;
  globalThis.fetch = vi.fn(async () => ({ blob: async () => new Blob(['w'], { type: 'image/webp' }) }));
});
afterEach(async () => {
  globalThis.fetch = fetchDAbans;
  cleanup();
  await cuaDesament.reinicia();
});

const llista = (container) => container.querySelector('.sdp-gestor-llista');
const detall = (container) => container.querySelector('.sdp-workspace-detail');
const srcDe = (img) => img?.getAttribute('src') ?? null;
const apartat = (container, nom) => within(llista(container)).getByRole('button', { name: new RegExp(nom) });

/* Les superfícies on es pinta la imatge pròpia de la fitxa:
   · llista: la fitxa de la columna central, la targeta viva (l'avatar de
     l'autoria) mentre l'editor és muntat o, a qualsevol altre apartat, la
     compacta de sempre (DefaultItemCard: el quadrat d'ItemMedia);
   · barra: la barra taronja de la pàgina del detall (fora de cap targeta);
   · editor: l'avatar redó o el logotip de la ranura, damunt de l'H1;
   · targeta: la «Vista targeta» de «Les vistes» (l'avatar de l'autoria). */
function imatges(container) {
  const arrel = llista(container);
  const viva = arrel.querySelector('article.sdp-targeta-viva-carta');
  const pagina = detall(container);
  const barra = [...pagina.querySelectorAll('section.bar-orange')].find((s) => !s.closest('.sdp-targeta-viva-carta'));
  const editor = pagina.querySelector('.sdp-editor-document header.page-title');
  const vista = pagina.querySelector('.perfil-vistes__targeta article.sdp-targeta-viva-carta');
  return {
    llista: viva
      ? srcDe(viva.querySelector('.sp-card-author img.sp-card-avatar'))
      : srcDe(apartat(container, 'La fitxa').querySelector('img.sdp-gestor-fitxa__imatge')),
    barra: srcDe(barra?.querySelector('img.sp-card-avatar')),
    ...(editor ? {
      editor: srcDe(editor.querySelector('button.page-title-avatar--canvia img, .page-title-logo-personalitzat img[role="button"]')),
    } : null),
    ...(vista ? { targeta: srcDe(vista.querySelector('.sp-card-author img.sp-card-avatar')) } : null),
  };
}

/* La imatge nova, pel camí de la persona: el botó obri el retallador, Guardar
   puja (pujaMitja) i la cua la desa; el port torna 403, la finestra es queda
   oberta amb el motiu i la persona la tanca (Cancel·lar). La cua la conserva. */
async function pujaIRebutja(container, obri, finestra) {
  fireEvent.click(obri);
  const selector = container.ownerDocument.querySelector('input[type="file"][data-imatge-de-fitxa="logoImage"]');
  await act(async () => { fireEvent.change(selector, { target: { files: [new File(['x'], 'foto.png', { type: 'image/png' })] } }); });
  await act(async () => {});
  await act(async () => {
    fireEvent.click(within(screen.getByRole('dialog', { name: finestra })).getByRole('button', { name: 'Guardar' }));
  });
  await waitFor(() => expect(within(screen.getByRole('dialog', { name: finestra })).getByRole('alert').textContent)
    .toContain('El servidor no ha acceptat la imatge'));
  await act(async () => {
    fireEvent.click(within(screen.getByRole('dialog', { name: finestra })).getByRole('button', { name: 'Cancel·lar' }));
  });
  expect(screen.queryByRole('dialog', { name: finestra })).toBeNull();
}

describe('Gauntlet 261016 (encàrrec D) · després d’un 403 al desat de la imatge, la mateixa foto a totes les superfícies', () => {
  test('Javi Llinares · l’avatar rebutjat: l’editor, la targeta viva, «Les vistes», «El compte» i la fitxa compacta de la llista porten la foto nova de la cua', async () => {
    const { container } = render(<PerfilShell />);
    expect(imatges(container)).toEqual({ llista: VELLA, barra: VELLA, editor: VELLA });
    await pujaIRebutja(container, detall(container).querySelector('button.page-title-avatar--canvia'), 'Retalla la foto');
    expect(m.updateProfile.mock.calls).toEqual([[{ avatar_url: NOVA }, CONFIG]]);
    const estat = cuaDesament.llig({ ambit: AMBIT, entitat: 'perfil', id: 'jo' });
    expect([estat.estat, estat.camps.logoImage, estat.errors.logoImage.tipus]).toEqual(['error', NOVA, 'servidor']);
    // «La fitxa»: l'editor, la seua barra i la targeta viva de la llista.
    expect(imatges(container)).toEqual({ llista: NOVA, barra: NOVA, editor: NOVA });
    // «Les vistes»: la barra i la «Vista targeta» a la dreta; al centre, «La fitxa» compacta.
    fireEvent.click(apartat(container, 'Les vistes'));
    expect(imatges(container)).toEqual({ llista: NOVA, barra: NOVA, targeta: NOVA });
    // «El compte»: la barra a la dreta; al centre, «La fitxa» compacta.
    fireEvent.click(apartat(container, 'El compte'));
    expect(within(detall(container)).getByRole('heading', { level: 1, name: 'El compte' })).toBeTruthy();
    expect(imatges(container)).toEqual({ llista: NOVA, barra: NOVA });
  });

  test('Javi Llinares · «Tornar al que hi ha desat» (la cua neta) torna totes les superfícies a la foto del servidor', async () => {
    const { container } = render(<PerfilShell />);
    await pujaIRebutja(container, detall(container).querySelector('button.page-title-avatar--canvia'), 'Retalla la foto');
    const avis = detall(container).querySelector('.sdp-avisos-camps');
    await act(async () => { fireEvent.click(within(avis).getByRole('button', { name: 'Tornar al que hi ha desat' })); });
    expect(cuaDesament.llig({ ambit: AMBIT, entitat: 'perfil', id: 'jo' }).camps).toEqual({});
    expect(imatges(container)).toEqual({ llista: VELLA, barra: VELLA, editor: VELLA });
    fireEvent.click(apartat(container, 'Les vistes'));
    expect(imatges(container)).toEqual({ llista: VELLA, barra: VELLA, targeta: VELLA });
    fireEvent.click(apartat(container, 'El compte'));
    expect(imatges(container)).toEqual({ llista: VELLA, barra: VELLA });
  });

  test('El Rentonar · el logotip rebutjat: la mateixa imatge a l’editor, la targeta viva, «Les vistes», «El compte» i la fitxa compacta', async () => {
    m.params = new URLSearchParams({ organitzacio: 'R' });
    const { container } = render(<PerfilShell />);
    expect(imatges(container)).toEqual({ llista: LOGO_VELL, barra: LOGO_VELL, editor: LOGO_VELL });
    const ranura = detall(container).querySelector('.page-title-logo-personalitzat');
    await pujaIRebutja(container, within(ranura).getByRole('button', { name: 'Logotip' }), 'Retalla el logotip');
    expect(m.updateOrganization.mock.calls).toEqual([['R', { logo_url: NOVA }, CONFIG]]);
    expect(cuaDesament.llig({ ambit: AMBIT, entitat: 'organitzacio', id: 'R' }).errors.logoImage.tipus).toBe('servidor');
    expect(imatges(container)).toEqual({ llista: NOVA, barra: NOVA, editor: NOVA });
    fireEvent.click(apartat(container, 'Les vistes'));
    expect(imatges(container)).toEqual({ llista: NOVA, barra: NOVA, targeta: NOVA });
    fireEvent.click(apartat(container, 'El compte'));
    expect(imatges(container)).toEqual({ llista: NOVA, barra: NOVA });
  });
});
