import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/* ═══════════════════════════════════════════════════════════════════
   ORDRE DEL MESTRE (18-10-2026, RELLEU DEL PLA 2000, PUNT 2) · L'AVATAR
   DEL PERFIL: EL CERCLE SOL I LA FINESTRA QUE HO AGRUPA TOT

   «Neteja visual total sota l'avatar: elimina la llista de botons
   repetitius ([Avatar], [Llevar avatar]) i el text dels 10 MB. En fer clic
   directament sobre el cercle de l'avatar, obri directament
   DialegEnquadrament carregant la imatge que ja hi ha. Permet zoom i
   desplaçament continu sobre la foto existent (per ajustar p. ex. la
   il·lustració de la IAIA MarIA i amagar el marc quadrat) i agrupa "Canviar
   foto", "Llevar avatar" i "Guardar enquadre" dins del propi diàleg.»

   De punta a punta (PerfilEditor → DocumentEditor → UniversalEditorShell →
   UniversalPage → PageFrame), amb la cua d'autodesament de veres. jsdom no
   té canvas: la frontera amb el navegador (imatgeCanvas.js), compressImage i
   el fetch del data URL se simulen. El port resol un sdp-media:// a una
   adreça https (useResolvedAsset): mai es pinta ni es carrega l'esquema cru.
   ═══════════════════════════════════════════════════════════════════ */

const RESOLTA = 'https://mitjans.test/t/u/avatars/a.webp';
const m = vi.hoisted(() => ({ perfil: null, updateProfile: null, showToast: null }));
const dobles = vi.hoisted(() => ({ carregaImatge: vi.fn(), exportaRetall: vi.fn(), compressImage: vi.fn(), dibuixaVisor: vi.fn(() => true) }));
vi.mock('../../hooks/useResolvedAsset.js', () => {
  const resol = (ref) => (typeof ref === 'string' && ref.startsWith('sdp-media://') ? 'https://mitjans.test/t/u/avatars/a.webp' : ref);
  return {
    useResolvedAsset: (ref) => resol(ref),
    useResolvedAssetState: (ref) => ({ url: resol(ref), status: ref ? 'ready' : 'idle', error: null, isLoading: false, retry: () => {}, cancel: () => {} }),
  };
});
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
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.showToast }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: () => false,
  getCurrentUser: () => ({ id: 'U' }),
  updateProfile: (...args) => m.updateProfile(...args),
}));
vi.mock('./PerfilContext.jsx', () => ({ usePerfil: () => m.perfil }));
vi.mock('../../components/universal/richText', () => ({
  useUniversalRichText: () => null,
  useTipTapToolbarAdapter: () => ({ state: {}, exec: {} }),
  UniversalRichTextToolbar: () => null,
  UniversalRichTextContent: () => null,
}));
vi.mock('../../components/universal/richText/extensions', () => ({ extensionsRiques: () => [] }));
vi.mock('../../components/universal/DocumentPrintPreview.jsx', () => ({ default: () => null }));
vi.mock('../../components/universal/enquadrament/imatgeCanvas.js', () => ({
  carregaImatge: dobles.carregaImatge,
  dibuixaVisor: dobles.dibuixaVisor,
  exportaRetall: dobles.exportaRetall,
}));
vi.mock('../../utils/imageUtils.js', () => ({ compressImage: dobles.compressImage }));

import {
  ETIQUETA_AJUSTA_AVATAR, ETIQUETA_GUARDA_ENQUADRE, ETIQUETA_LLEVA_AVATAR_FINESTRA, ETIQUETA_POSA_AVATAR, PerfilEditor,
} from './PerfilEditor.jsx';
import { AJUDA_FOTO, ERROR_TIPUS_FOTO } from '../../components/universal/enquadrament/useEnquadramentImatge.jsx';
import { AVIS_IMATGE_PUJANT } from './useImatgeDeFitxa.jsx';
import { cuaDesament } from '../../data/autodesament/cua.js';
import { ambitDe } from '../../data/autodesament/ambit.js';

const CONFIG = Object.freeze({ tenantId: '00000000-0000-4000-8000-000000000000' });
const MITJA = 'sdp-media://mitjans/t/u/avatars/a.webp';
const NOVA = '/assets/nou.webp';
const jo = { id: 'jo', mena: 'persona', nom: 'Pep', rol: 'Persona', dades: { id: 'U', full_name: 'Pep', town_name: 'La Torre' } };
const ambAvatar = { ...jo, avatar: MITJA, dades: { ...jo.dades, avatar_url: MITJA } };
/* La il·lustració de la IAIA MarIA: un quadrat amb el seu marc, que l'ajust ha de poder amagar. */
const iaia = { id: 'A', mena: 'agent', nom: 'IAIA MarIA', rol: 'Agent IA', dades: { name: 'IAIA MarIA', avatar_url: '/assets/iaia_maria.png' } };

beforeEach(async () => {
  m.updateProfile = vi.fn(async (canvis) => ({ id: 'U', ...canvis }));
  m.showToast = vi.fn();
  m.perfil = {
    identitats: [], guardarCampPerfil: vi.fn(), pujaMitja: vi.fn(async () => NOVA), recarrega: vi.fn(),
    autodesament: { ambit: ambitDe(CONFIG, 'U'), context: CONFIG },
  };
  await cuaDesament.reinicia();
  dobles.carregaImatge.mockReset().mockResolvedValue({ amplada: 1600, alcada: 1200, tipus: 'image/webp', element: {}, allibera: vi.fn() });
  dobles.exportaRetall.mockReset().mockResolvedValue(new File(['y'], 'enquadrament.jpg', { type: 'image/jpeg' }));
  dobles.compressImage.mockReset().mockResolvedValue('data:image/webp;base64,AAAA');
  dobles.dibuixaVisor.mockClear();
  vi.stubGlobal('fetch', vi.fn(async () => ({ blob: async () => new Blob(['w'], { type: 'image/webp' }) })));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const desplegable = () => document.querySelector('.sdp-editor-document details.sdp-edicio-avancada');
const obriEdicioAvancada = () => {
  const detalls = desplegable();
  if (!detalls.open) fireEvent.click(detalls.querySelector('summary.sdp-edicio-avancada__resum'));
  expect(detalls.open).toBe(true);
  return detalls;
};
const identitat = () => desplegable().querySelector('.sdp-edicio-avancada__identitat');
const cercle = () => identitat()?.querySelector('button.page-title-avatar--canvia') ?? null;
const selectorDeFora = () => document.querySelector('input[type="file"][data-imatge-de-fitxa="logoImage"]');
const finestra = () => screen.queryByRole('dialog', { name: 'Retalla la foto' });
const selectorDeDins = () => finestra().querySelector('input[type="file"][data-enquadrament-foto]');
const ampliacio = () => within(finestra()).getByLabelText('Ampliació');
const visor = () => finestra().querySelector('canvas.sdp-enquadrament__visor');

/** El cercle amb el focus damunt, com al navegador, i un clic: la finestra amb la imatge que ja hi ha. */
async function obriElCercle() {
  cercle().focus();
  await act(async () => { fireEvent.click(cercle()); });
  await act(async () => {});
  expect(finestra()).not.toBeNull();
  return finestra();
}

describe('davall del cercle, res', () => {
  test('amb avatar: el cercle sol, «Ajusta o canvia l’avatar», amb la càmera; cap píndola ni cap text dels 10 MB', () => {
    render(<PerfilEditor identitat={ambAvatar} />);
    obriEdicioAvancada();
    expect(within(identitat()).getAllByRole('button')).toEqual([cercle()]);
    expect(cercle().getAttribute('aria-label')).toBe(ETIQUETA_AJUSTA_AVATAR);
    expect(cercle().getAttribute('aria-haspopup')).toBe('dialog');
    expect(cercle().querySelector('.page-title-avatar__marca')).not.toBeNull();
    // La imatge resolta pel port, mai l'esquema opac.
    expect(cercle().querySelector('img').getAttribute('src')).toBe(RESOLTA);
    expect(identitat().innerHTML).not.toContain('sdp-media:');
    expect(identitat().querySelector('.page-title-avatar-accions, .sdp-camp__ajuda')).toBeNull();
    expect(identitat().textContent).not.toContain('10 MB');
    expect(screen.queryByRole('button', { name: 'Avatar' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Llevar l’avatar' })).toBeNull();
  });
});

describe('el clic al cercle', () => {
  test('amb avatar, obri DialegEnquadrament amb la imatge que ja hi ha (resolta), sense el selector de fitxers', async () => {
    render(<PerfilEditor identitat={ambAvatar} />);
    obriEdicioAvancada();
    const clic = vi.spyOn(selectorDeFora(), 'click');
    const d = await obriElCercle();
    expect(clic).not.toHaveBeenCalled();
    expect(dobles.carregaImatge.mock.calls.map(([font]) => font)).toEqual([RESOLTA]);
    expect(d.querySelector('.sdp-enquadrament__visor-caixa--cercle canvas')).not.toBeNull();
    // Dins: «Canviar foto» (amb els formats), «Llevar avatar» i, al peu, «Guardar enquadre».
    expect(within(d).getByRole('button', { name: 'Canviar foto', description: AJUDA_FOTO })).toBeTruthy();
    expect(within(d).getByRole('button', { name: ETIQUETA_LLEVA_AVATAR_FINESTRA })).toBeTruthy();
    expect([...d.querySelectorAll('.sdp-dialeg__peu button')].map((b) => b.textContent)).toEqual(['Restablir', 'Cancel·lar', ETIQUETA_GUARDA_ENQUADRE]);
    expect(document.querySelector('[style]')).toBeNull();
  });

  test('sense avatar, el cercle buit («Posa un avatar») obri el selector de fitxers; cap finestra fins que es tria', () => {
    render(<PerfilEditor identitat={jo} />);
    obriEdicioAvancada();
    expect(cercle().getAttribute('aria-label')).toBe(ETIQUETA_POSA_AVATAR);
    expect(cercle().hasAttribute('aria-haspopup')).toBe(false);
    expect(cercle().querySelector('img')).toBeNull();
    const clic = vi.spyOn(selectorDeFora(), 'click');
    fireEvent.click(cercle());
    expect(clic).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(dobles.carregaImatge).not.toHaveBeenCalled();
  });

  test('mentre puja una foto, el cercle ho diu (aria-busy) i el clic només ho avisa', async () => {
    let resol;
    m.perfil.pujaMitja = vi.fn(() => new Promise((r) => { resol = r; }));
    render(<PerfilEditor identitat={ambAvatar} />);
    obriEdicioAvancada();
    const d = await obriElCercle();
    act(() => { fireEvent.change(within(d).getByLabelText('Ampliació'), { target: { value: '2' } }); });
    await act(async () => { fireEvent.click(within(finestra()).getByRole('button', { name: ETIQUETA_GUARDA_ENQUADRE })); });
    await waitFor(() => expect(m.perfil.pujaMitja).toHaveBeenCalledTimes(1));
    await act(async () => { fireEvent(finestra(), new Event('cancel', { cancelable: true })); });
    expect(finestra()).toBeNull();
    expect(cercle().getAttribute('aria-busy')).toBe('true');
    /* Correcció de la revisió · I es veu i s'anuncia: el carregador al lloc
       de la càmera i l'avís de sempre en una regió d'estat amagada, germana
       del cercle (cap línia visible davall). */
    const estat = () => identitat().querySelector('.sdp-sr-only[role="status"]');
    expect(cercle().querySelector('.page-title-avatar__marca .page-title-avatar__gir')).not.toBeNull();
    expect(estat().textContent).toBe(AVIS_IMATGE_PUJANT);
    expect(cercle().contains(estat())).toBe(false);
    await act(async () => { fireEvent.click(cercle()); });
    expect(finestra()).toBeNull();
    expect(m.showToast).toHaveBeenCalledWith(AVIS_IMATGE_PUJANT, 'info');
    await act(async () => { resol(NOVA); });
    await waitFor(() => expect(cercle().hasAttribute('aria-busy')).toBe(false));
    expect(cercle().querySelector('.page-title-avatar__gir')).toBeNull();
    expect(estat().textContent).toBe('');
  });
});

describe('zoom i desplaçament continus sobre la foto que ja hi ha', () => {
  test('la roda i el lliscador amplien sense salts; arrossegar i les fletxes mouen; Restablir torna al principi', async () => {
    render(<PerfilEditor identitat={iaia} />);
    obriEdicioAvancada();
    await obriElCercle();
    expect(dobles.carregaImatge.mock.calls[0][0]).toBe('/assets/iaia_maria.png');
    expect(ampliacio().getAttribute('aria-valuetext')).toBe('100 %');
    expect(ampliacio().getAttribute('step')).toBe('0.01');
    // La roda: un pas sencer per osca, passos menuts per a un trackpad.
    let lliure;
    act(() => { lliure = fireEvent.wheel(visor(), { deltaY: -100 }); });
    expect(lliure).toBe(false);
    expect(ampliacio().getAttribute('aria-valuetext')).toBe('110 %');
    act(() => { fireEvent.wheel(visor(), { deltaY: -10 }); });
    expect(ampliacio().getAttribute('aria-valuetext')).toBe('112 %');
    // El lliscador, a qualsevol punt del rang (continu): ací, per a amagar el marc de la il·lustració.
    act(() => { fireEvent.change(ampliacio(), { target: { value: '1.37' } }); });
    expect(ampliacio().getAttribute('aria-valuetext')).toBe('137 %');
    // El teclat sobre el visor mou la foto i ho anuncia.
    act(() => { fireEvent.keyDown(visor(), { key: 'ArrowRight' }); });
    expect(finestra().querySelector('[aria-live="polite"].sdp-nomes-lector').textContent).toContain('Posició');
    // Arrossegar amb el ratolí també (pointer events): el retall que es pinta es mou.
    visor().getBoundingClientRect = () => ({ width: 480, height: 480, top: 0, left: 0, right: 480, bottom: 480 });
    const abans = dobles.dibuixaVisor.mock.lastCall[2];
    act(() => {
      fireEvent.pointerDown(visor(), { pointerId: 1, button: 0, buttons: 1, clientX: 200, clientY: 200 });
      fireEvent.pointerMove(visor(), { pointerId: 1, buttons: 1, clientX: 150, clientY: 180 });
      fireEvent.pointerUp(visor(), { pointerId: 1 });
    });
    const despres = dobles.dibuixaVisor.mock.lastCall[2];
    expect(despres.w).toBe(abans.w);
    expect([despres.x, despres.y]).not.toEqual([abans.x, abans.y]);
    act(() => { fireEvent.click(within(finestra()).getByRole('button', { name: 'Restablir' })); });
    expect(ampliacio().getAttribute('aria-valuetext')).toBe('100 %');
  });
});

describe('«Canviar foto»', () => {
  test('obri el selector de DINS de la finestra; la foto triada s’hi obri, centrada i sense zoom, en la mateixa finestra', async () => {
    render(<PerfilEditor identitat={ambAvatar} />);
    obriEdicioAvancada();
    const d = await obriElCercle();
    act(() => { fireEvent.change(ampliacio(), { target: { value: '2' } }); });
    const fora = vi.spyOn(selectorDeFora(), 'click');
    const dins = vi.spyOn(selectorDeDins(), 'click');
    fireEvent.click(within(d).getByRole('button', { name: 'Canviar foto' }));
    expect(dins).toHaveBeenCalledTimes(1);
    expect(fora).not.toHaveBeenCalled();
    const nova = new File(['x'], 'nova.png', { type: 'image/png' });
    await act(async () => { fireEvent.change(selectorDeDins(), { target: { files: [nova] } }); });
    await act(async () => {});
    expect(finestra()).toBe(d);
    expect(dobles.carregaImatge).toHaveBeenLastCalledWith(nova, expect.anything());
    expect(ampliacio().getAttribute('aria-valuetext')).toBe('100 %');
    // Tancar el selector sense triar no tanca la finestra.
    fireEvent(selectorDeDins(), new Event('cancel', { bubbles: true, cancelable: true }));
    expect(finestra()).toBe(d);
  });

  test('una foto que no s’admet ho diu dins de la finestra (cap toast) i la d’abans es queda', async () => {
    render(<PerfilEditor identitat={ambAvatar} />);
    obriEdicioAvancada();
    const d = await obriElCercle();
    await act(async () => { fireEvent.change(selectorDeDins(), { target: { files: [new File(['x'], 'a.gif', { type: 'image/gif' })] } }); });
    expect(within(d).getByRole('alert').textContent).toBe(ERROR_TIPUS_FOTO);
    expect(dobles.carregaImatge).toHaveBeenCalledTimes(1);
    expect(m.showToast).not.toHaveBeenCalled();
  });

  test('una imatge desada que no es pot obrir (CORS): l’avís i «Canviar foto», l’eixida', async () => {
    dobles.carregaImatge.mockRejectedValueOnce(new Error('CORS'));
    render(<PerfilEditor identitat={ambAvatar} />);
    obriEdicioAvancada();
    const d = await obriElCercle();
    expect(within(d).getByRole('alert').textContent).toContain('No s’ha pogut obrir esta imatge');
    await act(async () => { fireEvent.change(selectorDeDins(), { target: { files: [new File(['x'], 'b.jpg', { type: 'image/jpeg' })] } }); });
    await act(async () => {});
    expect(within(d).queryByRole('alert')).toBeNull();
    expect(within(d).getByRole('button', { name: ETIQUETA_GUARDA_ENQUADRE }).disabled).toBe(false);
  });
});

describe('«Guardar enquadre»', () => {
  test('desa el retall nou pel camí de sempre: 400 × 400, UNA pujada (carpeta avatars) i avatar_url; la persona no torna a triar cap fitxer', async () => {
    render(<PerfilEditor identitat={ambAvatar} />);
    obriEdicioAvancada();
    const clic = vi.spyOn(selectorDeFora(), 'click');
    await obriElCercle();
    act(() => { fireEvent.change(ampliacio(), { target: { value: '2' } }); });
    await act(async () => { fireEvent.click(within(finestra()).getByRole('button', { name: ETIQUETA_GUARDA_ENQUADRE })); });
    await waitFor(() => expect(finestra()).toBeNull());
    expect(clic).not.toHaveBeenCalled();
    // 1600 × 1200 en quadrat, a 2×: el quadrat central de 600, que ix a 400 × 400 (Llei del Quadrat).
    /* Expectativa actualitzada a propòsit (correcció F3 de la revisió): la
       imatge carregada és un WebP, i el retall ix en PNG (conserva la
       transparència), no en JPEG amb fons blanc. */
    expect(dobles.exportaRetall.mock.calls[0].slice(1)).toEqual([{ x: 500, y: 300, w: 600, h: 600 }, { amplada: 400, alcada: 400, tipus: 'image/png' }]);
    expect(dobles.compressImage.mock.calls[0][1]).toEqual({ maxSize: 400, format: 'image/webp', quality: 0.8 });
    expect(m.perfil.pujaMitja).toHaveBeenCalledTimes(1);
    expect(m.perfil.pujaMitja.mock.calls[0][1]).toBe('avatars');
    expect(m.updateProfile.mock.calls).toEqual([[{ avatar_url: NOVA }, CONFIG]]);
    expect(cercle().querySelector('img').getAttribute('src')).toBe(NOVA);
    expect(document.activeElement).toBe(cercle());
  });

  test('una imatge desada sencera, sense tocar: no hi ha res a desar, la finestra es tanca i no puja res', async () => {
    dobles.carregaImatge.mockResolvedValue({ amplada: 400, alcada: 400, tipus: 'image/webp', element: {}, allibera: vi.fn() });
    render(<PerfilEditor identitat={ambAvatar} />);
    obriEdicioAvancada();
    await obriElCercle();
    await act(async () => { fireEvent.click(within(finestra()).getByRole('button', { name: ETIQUETA_GUARDA_ENQUADRE })); });
    expect(finestra()).toBeNull();
    expect(dobles.exportaRetall).not.toHaveBeenCalled();
    expect(m.perfil.pujaMitja).not.toHaveBeenCalled();
    expect(m.updateProfile).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(cercle());
  });
});

describe('«Llevar avatar»', () => {
  test('la confirmació de sempre, damunt de la finestra; confirmat, avatar_url buit, les dues es tanquen i el focus va al cercle buit', async () => {
    render(<PerfilEditor identitat={ambAvatar} />);
    obriEdicioAvancada();
    const d = await obriElCercle();
    fireEvent.click(within(d).getByRole('button', { name: ETIQUETA_LLEVA_AVATAR_FINESTRA }));
    const confirma = screen.getByRole('dialog', { name: 'Llevar l’avatar?' });
    expect(confirma.textContent).toContain('La fitxa es quedarà sense foto.');
    await act(async () => { fireEvent.click(within(confirma).getByRole('button', { name: 'Llevar l’avatar' })); });
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Llevar l’avatar?' })).toBeNull());
    expect(finestra()).toBeNull();
    expect(m.updateProfile.mock.calls).toEqual([[{ avatar_url: null }, CONFIG]]);
    expect(cercle().querySelector('img')).toBeNull();
    expect(cercle().getAttribute('aria-label')).toBe(ETIQUETA_POSA_AVATAR);
    expect(document.activeElement).toBe(cercle());
  });

  test('sense imatge pròpia a la fitxa (la foto de la sessió), «Llevar avatar» no hi és: no hi ha res a llevar', async () => {
    render(<PerfilEditor identitat={{ ...jo, avatar: 'https://proveidor.test/foto.jpg' }} />);
    obriEdicioAvancada();
    const d = await obriElCercle();
    expect(dobles.carregaImatge.mock.calls[0][0]).toBe('https://proveidor.test/foto.jpg');
    expect(within(d).queryByRole('button', { name: ETIQUETA_LLEVA_AVATAR_FINESTRA })).toBeNull();
    expect(within(d).getByRole('button', { name: 'Canviar foto' })).toBeTruthy();
  });
});

describe('el focus torna al cercle', () => {
  test('Escape, «Cancel·lar»: la finestra es tanca sense desar i el focus torna al cercle que l’ha oberta', async () => {
    render(<PerfilEditor identitat={ambAvatar} />);
    obriEdicioAvancada();
    await obriElCercle();
    await act(async () => { fireEvent(finestra(), new Event('cancel', { cancelable: true })); });
    expect(finestra()).toBeNull();
    expect(document.activeElement).toBe(cercle());
    await obriElCercle();
    await act(async () => { fireEvent.click(within(finestra()).getByRole('button', { name: 'Cancel·lar' })); });
    expect(finestra()).toBeNull();
    expect(document.activeElement).toBe(cercle());
    expect(m.perfil.pujaMitja).not.toHaveBeenCalled();
    expect(m.updateProfile).not.toHaveBeenCalled();
  });

  test('com a Safari, un clic que no enfoca el botó: el cercle es queda el focus i el rep en tancar', async () => {
    render(<PerfilEditor identitat={ambAvatar} />);
    obriEdicioAvancada();
    document.activeElement?.blur();
    expect(document.activeElement).toBe(document.body);
    // jsdom, com Safari, no enfoca el botó en clicar-lo.
    await act(async () => { fireEvent.click(cercle()); });
    expect(finestra()).not.toBeNull();
    await act(async () => { fireEvent(finestra(), new Event('cancel', { cancelable: true })); });
    expect(finestra()).toBeNull();
    expect(document.activeElement).toBe(cercle());
  });

  /* Correcció F4 de la revisió · El cercle buit obri el selector i la
     finestra arriba després de triar el fitxer: sense el focus al cercle, en
     Safari la finestra prenia el body com a qui l'havia oberta. */
  test('com a Safari, el cercle buit: després de triar la foto, «Cancel·lar» i Escape tornen el focus al cercle', async () => {
    render(<PerfilEditor identitat={jo} />);
    obriEdicioAvancada();
    const png = () => new File(['x'], 'foto.png', { type: 'image/png' });
    for (const tanca of [
      () => fireEvent.click(within(finestra()).getByRole('button', { name: 'Cancel·lar' })),
      () => fireEvent(finestra(), new Event('cancel', { cancelable: true })),
    ]) {
      document.activeElement?.blur();
      expect(document.activeElement).toBe(document.body);
      // jsdom, com Safari, no enfoca el botó en clicar-lo.
      await act(async () => { fireEvent.click(cercle()); });
      expect(finestra()).toBeNull();
      await act(async () => { fireEvent.change(selectorDeFora(), { target: { files: [png()] } }); });
      await act(async () => {});
      expect(finestra()).not.toBeNull();
      await act(async () => { tanca(); });
      expect(finestra()).toBeNull();
      expect(document.activeElement).toBe(cercle());
    }
    expect(m.perfil.pujaMitja).not.toHaveBeenCalled();
  });
});
