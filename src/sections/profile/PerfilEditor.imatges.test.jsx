import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/* ═══════════════════════════════════════════════════════════════════
   ONADA 4 (RETALLADOR SENZILL, ORDRE DEL MESTRE 261008) · LES IMATGES DE
   LA FITXA DEL PERFIL

   «Volem separar clarament els botons de pujada perquè l'usuari no
   s'embolique: un botó dedicat a "Capçalera" i un altre a "Avatar" o
   "Logotip".» De punta a punta (PerfilEditor → DocumentEditor →
   UniversalEditorShell → UniversalPage → PageFrame), tot de veres, amb la
   cua d'autodesament. jsdom no té canvas: la frontera amb el navegador
   (imatgeCanvas.js), compressImage i el fetch del data URL se simulen.
   Línia I2 (pla 261008_1201) · Per la mateixa cadena, el que el Perfil
   passa ara a la closca: la guarda de pujada (heroPujant, logoPujant,
   avatarAutor.pujant), el límit dit abans de triar (logoEditHelp,
   ajudaAmbImatge, avatarAutor.ajuda), la píndola dels drets (dretsTriats)
   i el check del desat després d'un reintent (estatDesament.reintentant).
   ═══════════════════════════════════════════════════════════════════ */

const m = vi.hoisted(() => ({ perfil: null, updateProfile: null, updateOrganization: null, showToast: null }));
const dobles = vi.hoisted(() => ({ carregaImatge: vi.fn(), exportaRetall: vi.fn(), compressImage: vi.fn() }));
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
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.showToast }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: () => false,
  getCurrentUser: () => ({ id: 'U' }),
  updateProfile: (...args) => m.updateProfile(...args),
  updateOrganization: (...args) => m.updateOrganization(...args),
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
  dibuixaVisor: () => true,
  exportaRetall: dobles.exportaRetall,
}));
vi.mock('../../utils/imageUtils.js', () => ({ compressImage: dobles.compressImage }));

import { PerfilEditor, avisDeImatgeNoDesada } from './PerfilEditor.jsx';
import { AVIS_IMATGE_PUJANT } from './useImatgeDeFitxa.jsx';
import { AVISOS_TARGETA_VIVA, TargetaViva, useDocumentViu } from '../../components/universal/TargetaViva.jsx';
import { DEFAULT_AUTHOR } from '../../components/universal/UniversalUtils.js';
import { AJUDA_FOTO } from '../../components/universal/enquadrament/useEnquadramentImatge.jsx';
import { AJUDA_IMATGE_PUJANT } from '../../components/universal/UniversalEditorShell.jsx';
import { TEXTOS_ESTAT_DESAMENT } from '../../components/universal/EstatDesament.jsx';
import { ENTITAT_PILOT_ID } from '../../data/identitatsSeed.js';
import { oblidaEntitatDelProjecte } from '../../config/navigation.js';
import { cuaDesament } from '../../data/autodesament/cua.js';
import { ambitDe } from '../../data/autodesament/ambit.js';

const CONFIG = Object.freeze({ tenantId: '00000000-0000-4000-8000-000000000000' });
const jo = { id: 'jo', mena: 'persona', nom: 'Pep', rol: 'Persona', dades: { id: 'U', full_name: 'Pep', town_name: 'La Torre' } };
const ambAvatar = { ...jo, avatar: '/assets/a.webp', dades: { ...jo.dades, avatar_url: '/assets/a.webp' } };
const agent = { id: 'A', mena: 'agent', nom: 'IAIA', rol: 'Agent IA', dades: { name: 'IAIA' } };
const org = (role, extra = {}) => ({ id: 'O', mena: 'empresa', nom: 'Forn', rol: 'Membre', ...extra, dades: { name: 'Forn', visibility: 'public', role, ...extra.dades } });

beforeEach(async () => {
  m.updateProfile = vi.fn(async (canvis) => ({ id: 'U', ...canvis }));
  m.updateOrganization = vi.fn(async (id, canvis) => ({ id, ...canvis }));
  m.showToast = vi.fn();
  m.perfil = {
    identitats: [], guardarCampPerfil: vi.fn(), pujaMitja: vi.fn(async () => '/assets/nou.webp'), recarrega: vi.fn(),
    autodesament: { ambit: ambitDe(CONFIG, 'U'), context: CONFIG },
  };
  await cuaDesament.reinicia();
  dobles.carregaImatge.mockReset().mockResolvedValue({ amplada: 2000, alcada: 1500, tipus: 'image/png', element: {}, allibera: vi.fn() });
  dobles.exportaRetall.mockReset().mockResolvedValue(new File(['y'], 'enquadrament.png', { type: 'image/png' }));
  dobles.compressImage.mockReset().mockResolvedValue('data:image/webp;base64,AAAA');
  vi.stubGlobal('fetch', vi.fn(async () => ({ blob: async () => new Blob(['w'], { type: 'image/webp' }) })));
});
afterEach(() => {
  cleanup();
  oblidaEntitatDelProjecte();
  vi.unstubAllGlobals();
});

const capcalera = () => document.querySelector('.sdp-editor-document header.page-title');
/* Encàrrec d'harmonització (261018) · Ordre del Mestre: «fitxa neta; tota la
   gestió d'imatges va dins d'Edició avançada». L'avatar redó (amb «Avatar» i
   «Llevar l’avatar»), la ranura «Avatar» o «Logotip» i el botó «Capçalera» ja
   no van damunt de l'H1: viuen dins del <details> plegat de la closca
   (UniversalEditorShell). Les proves l'obrin com ho faria la persona, amb un
   clic al resum, abans de tocar-hi res. */
const desplegable = () => document.querySelector('.sdp-editor-document details.sdp-edicio-avancada');
const obriEdicioAvancada = () => {
  const detalls = desplegable();
  expect(detalls).not.toBeNull();
  if (!detalls.open) fireEvent.click(detalls.querySelector('summary.sdp-edicio-avancada__resum'));
  expect(detalls.open).toBe(true);
  return detalls;
};
/* L'avatar redó de la persona o l'agent (identitatEdicioAvancada) i la ranura
   del logotip o de l'avatar buit (logoComponent), dins del desplegable. */
const identitatAvancada = () => desplegable()?.querySelector('.sdp-edicio-avancada__identitat') ?? null;
const ranuraAvancada = () => desplegable()?.querySelector('[data-sdp-ranura="logotip"]') ?? null;
/* Damunt de l'H1 de la persona ja no hi ha res d'imatge: ni l'avatar redó, ni
   les seues píndoles, ni la ranura. */
const capcaleraNeta = () => {
  expect(capcalera().querySelector('.page-title-avatar, .page-title-avatar-accions, .page-title-logo-personalitzat')).toBeNull();
};
const selector = (camp) => document.querySelector(`input[type="file"][data-imatge-de-fitxa="${camp}"]`);
/* Els noms dels botons d'imatge de tota la fitxa, en l'ordre del document. */
const NOMS_IMATGE = new Set(['Capçalera', 'Avatar', 'Logotip', 'Editar capçalera i avatar', 'Editar logotip']);
const botonsImatge = () => screen.queryAllByRole('button').map((b) => b.textContent.trim()).filter((nom) => NOMS_IMATGE.has(nom));
/* Correcció de la revisió (261008) · L'ajuda que acompanya UN botó d'imatge:
   la línia .sdp-camp__ajuda del seu mateix camp, o null si no en té cap. */
const ajudaDe = (boto) => boto.closest('.sdp-camp')?.querySelector('.sdp-camp__ajuda')?.textContent ?? null;
/* El text que la ranura de la closca diu de sèrie (UniversalEditorShell). */
const AJUDA_DE_LA_RANURA = "Pots pujar qualsevol tipus d'imatge o arxiu multimèdia.";

/* Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 2) · La finestra de
   l'avatar desa amb «Guardar enquadre»; la capçalera i el logotip, amb
   «Guardar», com sempre. */
const nomDeGuardar = (finestra) => (finestra === 'Retalla la foto' ? 'Guardar enquadre' : 'Guardar');
/* Pla 2000 (punt 2) · El cercle de l'avatar (identitatEdicioAvancada): sol, el
   botó; sense foto, buit amb la càmera. */
const cercle = () => identitatAvancada()?.querySelector('button.page-title-avatar--canvia') ?? null;

async function triaIGuarda(camp, finestra, fitxer = new File(['x'], 'foto.png', { type: 'image/png' })) {
  await act(async () => { fireEvent.change(selector(camp), { target: { files: [fitxer] } }); });
  await act(async () => {});
  const dialeg = screen.getByRole('dialog', { name: finestra });
  return {
    dialeg,
    guarda: async () => {
      fireEvent.click(within(dialeg).getByRole('button', { name: nomDeGuardar(finestra) }));
      await waitFor(() => expect(screen.queryByRole('dialog', { name: finestra })).toBeNull());
    },
  };
}

describe('els botons', () => {
  /* Pla 2000 (punt 2: «neteja visual total sota l'avatar») · Expectativa
     actualitzada a propòsit: la ranura «Avatar» (amb el text dels 10 MB) ja
     no hi és; la persona sense foto té el cercle buit amb la càmera. */
  /* Expectativa actualitzada a propòsit: ordre del Mestre (18-10-2026, relleu
     del Pla 2000, punt 2: «lleva la línia dels 10 MB de davall del cercle, amb
     una prop opcional a UniversalEditorShell que conserve l'avís de pujada») ·
     Amb el cercle de l'avatar, la píndola «Capçalera» ja no porta cap línia en
     repòs (ajudaNomesEnPujada); mentre la capçalera puja, l'avís de sempre. */
  test('persona sense avatar: «Capçalera» i el cercle buit, separats; cap línia dels 10 MB davall', () => {
    render(<PerfilEditor identitat={jo} />);
    /* Encàrrec d'harmonització (261018) · El control de l'avatar viu dins d'«Edició avançada», no damunt de l'H1. */
    obriEdicioAvancada();
    expect(botonsImatge()).toEqual(['Capçalera']);
    expect(ranuraAvancada()).toBeNull();
    expect(cercle().getAttribute('aria-label')).toBe('Posa un avatar');
    expect(cercle().querySelector('img')).toBeNull();
    expect(identitatAvancada().textContent).not.toContain('10 MB');
    capcaleraNeta();
    // Cap línia visible: el límit, només per al lector de pantalla, lligat al botó.
    const capcalera = screen.getByRole('button', { name: 'Capçalera' });
    expect(ajudaDe(capcalera)).toBeNull();
    const descripcio = document.getElementById(capcalera.getAttribute('aria-describedby'));
    expect(descripcio.className).toBe('sdp-nomes-lector');
    expect(descripcio.textContent).toBe(AJUDA_FOTO);
    expect([...document.querySelectorAll('.sdp-camp__ajuda')].map((p) => p.textContent)).not.toContain(AJUDA_FOTO);
    // Cap diàleg «Capçalera i avatar» ni ràdios de destí.
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('radio')).toBeNull();
    expect(document.querySelector('input[type="file"][accept="image/png,image/jpeg,image/webp"]')).not.toBeNull();
  });

  /* Pla 2000 (punt 2) · Expectativa actualitzada a propòsit: fora les
     píndoles «Avatar» i «Llevar l’avatar» i la línia dels 10 MB. El cercle sol
     és el botó, i el clic obri directament la finestra de retall amb la
     imatge que ja hi ha (cap selector de fitxers). */
  test('persona amb avatar: «Capçalera» i l’avatar redó, sense la ranura ni píndoles; el cercle obri el retall de la imatge que ja hi ha', async () => {
    render(<PerfilEditor identitat={ambAvatar} />);
    /* Encàrrec d'harmonització (261018) · Fora l'avatar gegant del centre: el
       redó viu dins d'«Edició avançada» i és l'únic de l'editor; damunt de
       l'H1 no queda res (ja va a la barra taronja). */
    obriEdicioAvancada();
    expect(botonsImatge()).toEqual(['Capçalera']);
    expect(ranuraAvancada()).toBeNull();
    capcaleraNeta();
    expect(document.querySelectorAll('.sdp-editor-document button.page-title-avatar--canvia')).toHaveLength(1);
    expect(within(identitatAvancada()).getAllByRole('button')).toEqual([cercle()]);
    expect(identitatAvancada().querySelector('.page-title-avatar-accions, .sdp-camp__ajuda')).toBeNull();
    const obri = vi.spyOn(selector('logoImage'), 'click');
    await act(async () => { fireEvent.click(cercle()); });
    expect(obri).not.toHaveBeenCalled();
    const dialeg = screen.getByRole('dialog', { name: 'Retalla la foto' });
    expect(dobles.carregaImatge.mock.calls.map(([font]) => font)).toEqual(['/assets/a.webp']);
    expect(dialeg.querySelector('.sdp-enquadrament__visor-caixa--cercle canvas')).not.toBeNull();
  });

  /* Pla 2000 (punt 2) · Expectativa actualitzada a propòsit: «Llevar avatar»
     és dins de la finestra; llevat, el cercle es queda buit al seu lloc (cap
     ranura «Avatar»). */
  test('persona amb avatar: «Llevar avatar» (dins de la finestra) confirma i, en llevar-lo, el cercle es queda buit', async () => {
    render(<PerfilEditor identitat={ambAvatar} />);
    /* Encàrrec d'harmonització (261018) · L'avatar, dins d'«Edició avançada». */
    obriEdicioAvancada();
    await act(async () => { fireEvent.click(cercle()); });
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Retalla la foto' })).getByRole('button', { name: 'Llevar avatar' }));
    const confirma = screen.getByRole('dialog', { name: 'Llevar l’avatar?' });
    fireEvent.click(within(confirma).getByRole('button', { name: 'Llevar l’avatar' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Llevar l’avatar?' })).toBeNull());
    expect(screen.queryByRole('dialog', { name: 'Retalla la foto' })).toBeNull();
    expect(m.updateProfile).toHaveBeenCalledWith({ avatar_url: null }, CONFIG);
    expect(cercle().querySelector('img')).toBeNull();
    expect(cercle().getAttribute('aria-label')).toBe('Posa un avatar');
    expect(ranuraAvancada()).toBeNull();
    expect(within(desplegable()).queryByRole('button', { name: 'Avatar' })).toBeNull();
    capcaleraNeta();
  });

  /* Pla 2000 (punt 2) · Expectativa actualitzada a propòsit: com la persona,
     el cercle buit en lloc de la ranura «Avatar». */
  test('agent IA sense avatar: «Capçalera» i el cercle buit', () => {
    render(<PerfilEditor identitat={agent} />);
    expect(botonsImatge()).toEqual(['Capçalera']);
    obriEdicioAvancada();
    expect(cercle().getAttribute('aria-label')).toBe('Posa un avatar');
  });

  test('organització (també un grup): «Capçalera» i «Logotip»', () => {
    render(<PerfilEditor identitat={org('owner')} />);
    expect(botonsImatge().sort()).toEqual(['Capçalera', 'Logotip']);
    cleanup();
    render(<PerfilEditor identitat={org('admin', { mena: 'grup', nom: 'Colla' })} />);
    expect(botonsImatge().sort()).toEqual(['Capçalera', 'Logotip']);
  });

  test('l’entitat pilot: només «Capçalera» (el logotip és fix)', () => {
    render(<PerfilEditor identitat={{ ...org('owner'), id: ENTITAT_PILOT_ID, nom: 'Sóc de Poble' }} />);
    /* Encàrrec d'harmonització (261018) · La ranura del logotip viuria ara dins
       d'«Edició avançada»: la pilot no en té ni allí ni damunt de l'H1. */
    obriEdicioAvancada();
    expect(botonsImatge()).toEqual(['Capçalera']);
    expect(ranuraAvancada()).toBeNull();
    expect(capcalera().querySelector('.page-title-logo-personalitzat')).toBeNull();
  });

  test('en lectura (un membre sense permís, una baixa en curs): cap botó d’imatge ni cap selector', () => {
    for (const identitat of [org('member'), { ...ambAvatar, dades: { ...ambAvatar.dades, baixa_demanada_at: '2026-09-26T10:00:00Z' } }]) {
      render(<PerfilEditor identitat={identitat} />);
      expect(botonsImatge(), identitat.nom).toEqual([]);
      expect(document.querySelector('input[type="file"]'), identitat.nom).toBeNull();
      expect(document.querySelector('dialog'), identitat.nom).toBeNull();
      /* Encàrrec d'harmonització (261018) · Ni el desplegable on ara viuen els controls d'imatge. */
      expect(document.querySelector('details.sdp-edicio-avancada'), identitat.nom).toBeNull();
      cleanup();
    }
  });
});

describe('les finestres', () => {
  /* Pla 2000 (punt 2) · Expectativa actualitzada a propòsit: el cercle buit
     (no la ranura) obri el selector; el peu de la finestra diu «Guardar
     enquadre»; desada, la foto nova al mateix cercle. */
  test('persona · el cercle buit → «Retalla la foto» en cercle → UNA pujada → la foto nova al cercle', async () => {
    render(<PerfilEditor identitat={jo} />);
    /* Encàrrec d'harmonització (261018) · El cercle, dins d'«Edició avançada». */
    obriEdicioAvancada();
    fireEvent.click(cercle());
    const { dialeg, guarda } = await triaIGuarda('logoImage', 'Retalla la foto');
    expect(dialeg.querySelector('.sdp-enquadrament__visor-caixa--cercle')).not.toBeNull();
    expect([...dialeg.querySelectorAll('.sdp-dialeg__peu button')].map((b) => b.textContent)).toEqual(['Restablir', 'Cancel·lar', 'Guardar enquadre']);
    // Sense cap imatge pròpia, res a llevar: només «Canviar foto» i els formats.
    expect(within(dialeg).queryByRole('button', { name: 'Llevar avatar' })).toBeNull();
    expect(within(dialeg).getByRole('button', { name: 'Canviar foto', description: AJUDA_FOTO })).toBeTruthy();
    await guarda();
    expect(m.perfil.pujaMitja).toHaveBeenCalledTimes(1);
    expect(m.perfil.pujaMitja.mock.calls[0][1]).toBe('avatars');
    expect(m.updateProfile).toHaveBeenCalledWith({ avatar_url: '/assets/nou.webp' }, CONFIG);
    expect(cercle().querySelector('img').getAttribute('src')).toBe('/assets/nou.webp');
    expect(ranuraAvancada()).toBeNull();
    capcaleraNeta();
  });

  test('organització · «Logotip» → «Retalla el logotip» en quadrat (sense cercle) → 600 × 600 exactes → logo_url', async () => {
    render(<PerfilEditor identitat={org('owner')} />);
    /* Encàrrec d'harmonització (261018) · La ranura del logotip, dins d'«Edició avançada». */
    obriEdicioAvancada();
    fireEvent.click(within(ranuraAvancada()).getByRole('button', { name: 'Logotip' }));
    const { dialeg, guarda } = await triaIGuarda('logoImage', 'Retalla el logotip');
    expect(dialeg.querySelector('.sdp-enquadrament__visor-caixa')).not.toBeNull();
    expect(dialeg.querySelector('.sdp-enquadrament__visor-caixa--cercle')).toBeNull();
    await guarda();
    expect(dobles.exportaRetall.mock.calls[0].slice(1)).toEqual([{ x: 250, y: 0, w: 1500, h: 1500 }, { amplada: 600, alcada: 600, tipus: 'image/png' }]);
    expect(m.perfil.pujaMitja.mock.calls.map(([, carpeta]) => carpeta)).toEqual(['organitzacions']);
    expect(m.updateOrganization).toHaveBeenCalledWith('O', { logo_url: '/assets/nou.webp' }, CONFIG);
  });

  /* Gauntlet 261016 (Bloc 1, Llei del Quadrat) · Abans 16:9 i 1.200 × 675
     (ordre 261008): la capçalera és ara la mateixa imatge que la targeta. */
  test('«Capçalera» → «Retalla la capçalera» en quadrat → 1.200 × 1.200 → hero_url; el botó torna a la imatge', async () => {
    render(<PerfilEditor identitat={jo} />);
    /* Encàrrec d'harmonització (261018) · El botó «Capçalera» viu dins d'«Edició avançada». */
    obriEdicioAvancada();
    fireEvent.click(screen.getByRole('button', { name: 'Capçalera' }));
    const { guarda } = await triaIGuarda('heroImage', 'Retalla la capçalera');
    await guarda();
    expect(dobles.exportaRetall.mock.calls[0][2]).toEqual({ amplada: 1200, alcada: 1200, tipus: 'image/png' });
    expect(m.updateProfile).toHaveBeenCalledWith({ hero_url: '/assets/nou.webp' }, CONFIG);
    expect(document.querySelector('img.sdp-hero__imatge').getAttribute('src')).toBe('/assets/nou.webp');
  });
});

/* Correcció de la revisió (261008) · La guarda de pujada de l'ordre E
   (261007) a la fitxa. Escape tanca la finestra encara que estiga desant, i
   el desat continua (useImatgeDeFitxa): tornar a obrir, o llevar l'avatar,
   no pot llançar res que trepitge la pujada en curs. */
describe('la guarda de pujada', () => {
  /* La primera pujada no acaba fins que la prova ho diu. */
  function pujadaPendent() {
    const estat = {};
    m.perfil.pujaMitja = vi.fn()
      .mockImplementationOnce(() => new Promise((resol) => { estat.resol = resol; }))
      .mockResolvedValue('/assets/segona.webp');
    return estat;
  }
  async function guardaIEscapa(camp, finestra) {
    await act(async () => { fireEvent.change(selector(camp), { target: { files: [new File(['x'], 'foto.png', { type: 'image/png' })] } }); });
    await act(async () => {});
    const dialeg = screen.getByRole('dialog', { name: finestra });
    await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: nomDeGuardar(finestra) })); });
    await waitFor(() => expect(m.perfil.pujaMitja).toHaveBeenCalledTimes(1));
    await act(async () => { fireEvent(dialeg, new Event('cancel', { cancelable: true })); });
    expect(screen.queryByRole('dialog', { name: finestra })).toBeNull();
  }
  const ambLogotip = () => org('owner', { avatar: '/assets/forn.webp', dades: { logo_url: '/assets/forn.webp' } });
  /* Encàrrec d'harmonització (261018) · La ranura del logotip i l'avatar redó
     ja no són damunt de l'H1: viuen dins d'«Edició avançada», que cada prova
     obri abans de triar res, com la persona. */
  const ranura = ranuraAvancada;

  /* Línia I2 (pla 261008_1201) · Abans, el botó continuava actiu i el clic
     només ho deia amb un avís (AVIS_IMATGE_PUJANT). Ara la closca sap que la
     fitxa puja (logoPujant): el botó ix desactivat, i ja no cal cap avís. */
  test('organització amb logotip: Escape a mitja pujada → «Logotip» desactivat (cap selector ni segona pujada); queda el primer i després es torna a poder canviar', async () => {
    const estat = pujadaPendent();
    render(<PerfilEditor identitat={ambLogotip()} />);
    obriEdicioAvancada();
    fireEvent.click(within(ranura()).getByRole('button', { name: 'Logotip' }));
    await guardaIEscapa('logoImage', 'Retalla el logotip');
    const obri = vi.spyOn(selector('logoImage'), 'click');
    const boto = within(ranura()).getByRole('button', { name: 'Logotip' });
    expect(boto.disabled).toBe(true);
    fireEvent.click(boto);
    expect(obri).not.toHaveBeenCalled();
    expect(m.showToast).not.toHaveBeenCalledWith(AVIS_IMATGE_PUJANT, 'info');
    await act(async () => { estat.resol('/assets/nou.webp'); });
    await waitFor(() => expect(m.updateOrganization).toHaveBeenCalledWith('O', { logo_url: '/assets/nou.webp' }, CONFIG));
    expect(m.perfil.pujaMitja).toHaveBeenCalledTimes(1);
    expect(m.updateOrganization).toHaveBeenCalledTimes(1);
    // Acabada, es torna a poder canviar.
    await waitFor(() => expect(within(ranura()).getByRole('button', { name: 'Logotip' }).disabled).toBe(false));
    fireEvent.click(within(ranura()).getByRole('button', { name: 'Logotip' }));
    expect(obri).toHaveBeenCalledTimes(1);
  });

  /* Línia I2 · La capçalera, el mateix: la closca sap que puja (heroPujant). */
  test('persona sense capçalera: Escape a mitja pujada → «Capçalera» desactivat i diu que s’està desant; en acabar, la imatge i el botó actiu', async () => {
    const estat = pujadaPendent();
    render(<PerfilEditor identitat={jo} />);
    obriEdicioAvancada();
    fireEvent.click(screen.getByRole('button', { name: 'Capçalera' }));
    await guardaIEscapa('heroImage', 'Retalla la capçalera');
    const boto = screen.getByRole('button', { name: 'Capçalera' });
    expect(boto.disabled).toBe(true);
    expect(ajudaDe(boto)).toBe(AJUDA_IMATGE_PUJANT);
    await act(async () => { estat.resol('/assets/nou.webp'); });
    await waitFor(() => expect(m.updateProfile).toHaveBeenCalledWith({ hero_url: '/assets/nou.webp' }, CONFIG));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Capçalera' }).disabled).toBe(false));
    expect(document.querySelector('img.sdp-hero__imatge').getAttribute('src')).toBe('/assets/nou.webp');
    // Expectativa actualitzada a propòsit (Pla 2000, punt 2) · acabada la pujada, cap línia en repòs.
    expect(ajudaDe(screen.getByRole('button', { name: 'Capçalera' }))).toBeNull();
  });

  /* Línia I2 · Les dues píndoles de l'avatar redó porten avatarAutor.pujant:
     desactivades i aria-busy mentre puja (PageFrame).
     Pla 2000 (punt 2) · Expectativa actualitzada a propòsit: ja no hi ha
     píndoles. Mentre puja, el cercle ho diu (aria-busy) i el clic només ho
     avisa (cap finestra ni confirmació, cap segona pujada); acabada, torna a
     obrir la finestra, amb «Llevar avatar» i la seua confirmació. */
  test('persona amb avatar: a mitja pujada, el cercle diu que puja (aria-busy) i no obri res; la foto nova arriba i no s’esborra', async () => {
    const estat = pujadaPendent();
    render(<PerfilEditor identitat={ambAvatar} />);
    obriEdicioAvancada();
    await act(async () => { fireEvent.click(cercle()); });
    await guardaIEscapa('logoImage', 'Retalla la foto');
    expect(cercle().getAttribute('aria-busy')).toBe('true');
    await act(async () => { fireEvent.click(cercle()); });
    expect(m.showToast).toHaveBeenCalledWith(AVIS_IMATGE_PUJANT, 'info');
    expect(screen.queryByRole('dialog')).toBeNull();
    await act(async () => { estat.resol('/assets/nou.webp'); });
    await waitFor(() => expect(m.updateProfile).toHaveBeenCalledWith({ avatar_url: '/assets/nou.webp' }, CONFIG));
    expect(m.updateProfile).not.toHaveBeenCalledWith({ avatar_url: null }, CONFIG);
    expect(m.perfil.pujaMitja).toHaveBeenCalledTimes(1);
    // Acabada, el cercle ja no puja i torna a obrir la finestra, amb «Llevar avatar» i la seua confirmació.
    await waitFor(() => expect(cercle().hasAttribute('aria-busy')).toBe(false));
    await act(async () => { fireEvent.click(cercle()); });
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Retalla la foto' })).getByRole('button', { name: 'Llevar avatar' }));
    expect(screen.getByRole('dialog', { name: 'Llevar l’avatar?' })).toBeTruthy();
  });

  /* Línia I2 · Girada del [DEFECTE]: la closca sap que la fitxa puja
     (logoPujant) i el panell de la ranura es bloqueja com amb la seua guarda. */
  test('organització amb logotip: mentre puja, el panell de la closca té «Logotip» i «Esborrar» desactivats i diu que s’està desant (logoPujant)', async () => {
    const estat = pujadaPendent();
    render(<PerfilEditor identitat={ambLogotip()} />);
    obriEdicioAvancada();
    fireEvent.click(within(ranura()).getByRole('button', { name: 'Logotip' }));
    await guardaIEscapa('logoImage', 'Retalla el logotip');
    fireEvent.click(ranura().querySelector('img[role="button"]'));
    const esborra = within(ranura()).getByRole('button', { name: 'Esborrar' });
    const boto = within(ranura()).getByRole('button', { name: 'Logotip' });
    expect(esborra.disabled).toBe(true);
    expect(boto.disabled).toBe(true);
    expect(ajudaDe(boto)).toBe(AJUDA_IMATGE_PUJANT);
    // Desactivat: el clic no buida el logotip que encara puja.
    fireEvent.click(esborra);
    expect(m.updateOrganization).not.toHaveBeenCalled();
    await act(async () => { estat.resol('/assets/nou.webp'); });
    await waitFor(() => expect(m.updateOrganization).toHaveBeenCalledWith('O', { logo_url: '/assets/nou.webp' }, CONFIG));
    expect(m.updateOrganization).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(within(ranura()).getByRole('button', { name: 'Logotip' }).disabled).toBe(false));
  });

  /* Correcció de la revisió de les línies I1 i I2 (prova 3) · Mentre puja,
     les línies d'ajuda diuen per què els controls no fan res; en acabar,
     tornen a dir el límit.
     Pla 2000 (punt 2) · Expectativa actualitzada a propòsit: davall del
     cercle ja no hi ha cap línia; el que diu que puja és el cercle mateix
     (aria-busy). La de «Capçalera» continua sense saber-ne res. */
  test('persona amb avatar i capçalera: mentre puja l’avatar, el cercle diu que puja; la línia de «Capçalera» no en sap res', async () => {
    const estat = pujadaPendent();
    render(<PerfilEditor identitat={{ ...ambAvatar, dades: { ...ambAvatar.dades, hero_url: '/assets/h.webp' } }} />);
    obriEdicioAvancada();
    await act(async () => { fireEvent.click(cercle()); });
    await guardaIEscapa('logoImage', 'Retalla la foto');
    expect(cercle().getAttribute('aria-busy')).toBe('true');
    expect(identitatAvancada().querySelector('.sdp-camp__ajuda')).toBeNull();
    // Expectativa actualitzada a propòsit (Pla 2000, punt 2) · la «Capçalera» no puja: cap línia.
    expect(ajudaDe(screen.getByRole('button', { name: 'Capçalera' }))).toBeNull();
    await act(async () => { estat.resol('/assets/nou.webp'); });
    await waitFor(() => expect(cercle().hasAttribute('aria-busy')).toBe(false));
    expect(ajudaDe(screen.getByRole('button', { name: 'Capçalera' }))).toBeNull();
  });

  test('capçalera desada: mentre puja, la línia de davall de «Capçalera» diu que s’està desant', async () => {
    const estat = pujadaPendent();
    render(<PerfilEditor identitat={{ ...jo, dades: { ...jo.dades, hero_url: '/assets/h.webp' } }} />);
    obriEdicioAvancada();
    fireEvent.click(screen.getByRole('button', { name: 'Capçalera' }));
    await guardaIEscapa('heroImage', 'Retalla la capçalera');
    expect(ajudaDe(screen.getByRole('button', { name: 'Capçalera' }))).toBe(AJUDA_IMATGE_PUJANT);
    await act(async () => { estat.resol('/assets/nou.webp'); });
    // Expectativa actualitzada a propòsit (Pla 2000, punt 2) · acabada la pujada, cap línia en repòs.
    await waitFor(() => expect(ajudaDe(screen.getByRole('button', { name: 'Capçalera' }))).toBeNull());
  });
});

/* Correcció de la revisió de la línia I2 (prova 2) · Escape a mitja pujada:
   la finestra torna el focus a qui l'havia oberta, que en eixe moment està
   desactivat (la píndola «Avatar», «Capçalera», «Logotip»): el focus cau al
   body. Quan la pujada acaba, i només si continua perdut, torna a un
   control viu: desada, al mateix destí que el camí de sempre (l'avatar
   redó, o el botó que l'ha oberta); fallada, al control que l'ha oberta. */
/* Relleu del Pla 2000 (punt 2; revisió adversarial) · L'organització no té el
   cercle de l'avatar: la píndola «Capçalera» conserva la seua línia visible. */
describe('l’organització, com sempre', () => {
  test('la «Capçalera» d’una organització diu el límit en una línia visible, amb capçalera o sense', () => {
    for (const hero_url of ['', '/assets/h.webp']) {
      render(<PerfilEditor identitat={{ ...org('owner'), dades: { ...org('owner').dades, hero_url } }} />);
      obriEdicioAvancada();
      expect(ajudaDe(screen.getByRole('button', { name: 'Capçalera' }))).toBe(AJUDA_FOTO);
      cleanup();
    }
  });
});

describe('el focus després d’Escape a mitja pujada', () => {
  function pujadaPendent() {
    const estat = {};
    m.perfil.pujaMitja = vi.fn()
      .mockImplementationOnce(() => new Promise((resol, rebutja) => { estat.resol = resol; estat.rebutja = rebutja; }))
      .mockResolvedValue('/assets/segona.webp');
    return estat;
  }
  /* Pla 2000 (punt 2) · El cercle de l'avatar no es desactiva mentre puja (la
     guarda és d'useImatgeDeFitxa): `desactivat` diu si el control ho fa. */
  async function obriGuardaIEscapa(control, camp, finestra, { desactivat = true } = {}) {
    control.focus();
    expect(document.activeElement).toBe(control);
    await act(async () => { fireEvent.click(control); });
    await act(async () => { fireEvent.change(selector(camp), { target: { files: [new File(['x'], 'foto.png', { type: 'image/png' })] } }); });
    await act(async () => {});
    const dialeg = screen.getByRole('dialog', { name: finestra });
    await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: nomDeGuardar(finestra) })); });
    await waitFor(() => expect(m.perfil.pujaMitja).toHaveBeenCalledTimes(1));
    await act(async () => { fireEvent(dialeg, new Event('cancel', { cancelable: true })); });
    expect(screen.queryByRole('dialog', { name: finestra })).toBeNull();
    /* El defecte, tal com passa al navegador. Allí el focus era dins de la
       finestra (showModal), que ja no hi és, i la finestra el torna al
       control que l'ha oberta, que ara és desactivat: focus() no fa res (un
       control desactivat no és una àrea enfocable, HTML) i el focus queda al
       body. jsdom no mou el focus a la finestra ni el trau d'un control que
       s'ha desactivat (i blur() d'un control desactivat tampoc no fa res):
       es reprodueix amb un element de la finestra que desapareix. */
    expect(control.disabled).toBe(desactivat);
    const dinsDeLaFinestra = document.createElement('button');
    document.body.append(dinsDeLaFinestra);
    dinsDeLaFinestra.focus();
    dinsDeLaFinestra.remove();
    expect(document.activeElement).toBe(document.body);
  }
  /* Encàrrec d'harmonització (261018) · L'avatar redó, les seues píndoles i la
     ranura del logotip viuen dins d'«Edició avançada» (cap ja damunt de
     l'H1): el destí del focus és el mateix control, al seu lloc nou.
     Pla 2000 (punt 2) · Expectativa actualitzada a propòsit: la píndola
     «Avatar» ja no hi és; el control és el cercle, que obri la finestra amb
     la foto que ja hi ha (i el selector de fora la canvia, com «Canviar
     foto»). No es desactiva: el focus perdut es reprodueix igual. */
  const avatarRedo = () => identitatAvancada()?.querySelector('button.page-title-avatar--canvia') ?? null;
  const ranura = ranuraAvancada;

  test('el cercle, desada: si el focus cau al body mentre puja, en acabar va a l’avatar redó', async () => {
    const estat = pujadaPendent();
    render(<PerfilEditor identitat={ambAvatar} />);
    obriEdicioAvancada();
    await obriGuardaIEscapa(avatarRedo(), 'logoImage', 'Retalla la foto', { desactivat: false });
    expect(document.activeElement).toBe(document.body);
    await act(async () => { estat.resol('/assets/nou.webp'); });
    await waitFor(() => expect(m.updateProfile).toHaveBeenCalledWith({ avatar_url: '/assets/nou.webp' }, CONFIG));
    expect(avatarRedo()).not.toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(avatarRedo()));
  });

  test('el cercle, fallada: en acabar, el focus torna al cercle i l’avís va fora', async () => {
    const estat = pujadaPendent();
    render(<PerfilEditor identitat={ambAvatar} />);
    obriEdicioAvancada();
    await obriGuardaIEscapa(avatarRedo(), 'logoImage', 'Retalla la foto', { desactivat: false });
    expect(document.activeElement).toBe(document.body);
    await act(async () => { estat.rebutja(new Error('Sense xarxa')); });
    await waitFor(() => expect(avatarRedo().hasAttribute('aria-busy')).toBe(false));
    expect(document.activeElement).toBe(avatarRedo());
    expect(m.showToast).toHaveBeenCalled();
    expect(m.updateProfile).not.toHaveBeenCalled();
  });

  test('«Capçalera» sense imatge: en desar-se, el focus va al botó «Capçalera» (la closca, heroPujant)', async () => {
    const estat = pujadaPendent();
    render(<PerfilEditor identitat={jo} />);
    obriEdicioAvancada();
    await obriGuardaIEscapa(screen.getByRole('button', { name: 'Capçalera' }), 'heroImage', 'Retalla la capçalera');
    expect(document.activeElement).toBe(document.body);
    await act(async () => { estat.resol('/assets/nou.webp'); });
    await waitFor(() => expect(document.querySelector('img.sdp-hero__imatge')).not.toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Capçalera' })));
  });

  test('«Logotip» d’una organització amb logotip: en desar-se, el focus torna al botó «Logotip» de la ranura', async () => {
    const estat = pujadaPendent();
    render(<PerfilEditor identitat={org('owner', { avatar: '/assets/forn.webp', dades: { logo_url: '/assets/forn.webp' } })} />);
    obriEdicioAvancada();
    await obriGuardaIEscapa(within(ranura()).getByRole('button', { name: 'Logotip' }), 'logoImage', 'Retalla el logotip');
    expect(document.activeElement).toBe(document.body);
    await act(async () => { estat.resol('/assets/nou.webp'); });
    await waitFor(() => expect(m.updateOrganization).toHaveBeenCalledWith('O', { logo_url: '/assets/nou.webp' }, CONFIG));
    await waitFor(() => expect(document.activeElement).toBe(within(ranura()).getByRole('button', { name: 'Logotip' })));
  });

  /* Pla 2000 (punt 2) · Expectativa actualitzada a propòsit: «Llevar avatar»
     és dins de la finestra. Cancel·lar la confirmació torna el focus al botó
     de la finestra (que continua oberta), no al cercle: el focus pendent
     d'abans no reapareix. Tancada la finestra, el focus torna al cercle que
     l'ha oberta. */
  test('si mentrestant la persona ha anat a un altre control, no se li roba el focus (i el pendent no reapareix després)', async () => {
    const estat = pujadaPendent();
    render(<PerfilEditor identitat={ambAvatar} />);
    obriEdicioAvancada();
    await obriGuardaIEscapa(avatarRedo(), 'logoImage', 'Retalla la foto', { desactivat: false });
    const altre = screen.getByRole('button', { name: 'Capçalera' });
    altre.focus();
    await act(async () => { estat.resol('/assets/nou.webp'); });
    await waitFor(() => expect(avatarRedo().hasAttribute('aria-busy')).toBe(false));
    expect(document.activeElement).toBe(altre);
    // «Llevar l’avatar?» obert i cancel·lat: el focus pendent d'abans no el porta a l'avatar.
    avatarRedo().focus();
    await act(async () => { fireEvent.click(avatarRedo()); });
    const finestra = screen.getByRole('dialog', { name: 'Retalla la foto' });
    const lleva = within(finestra).getByRole('button', { name: 'Llevar avatar' });
    lleva.focus();
    fireEvent.click(lleva);
    const confirma = screen.getByRole('dialog', { name: 'Llevar l’avatar?' });
    await act(async () => { fireEvent.click(within(confirma).getByRole('button', { name: 'Cancel·lar' })); });
    expect(screen.queryByRole('dialog', { name: 'Llevar l’avatar?' })).toBeNull();
    expect(screen.getByRole('dialog', { name: 'Retalla la foto' })).toBe(finestra);
    expect(document.activeElement).toBe(lleva);
    await act(async () => { fireEvent.click(within(finestra).getByRole('button', { name: 'Cancel·lar' })); });
    expect(screen.queryByRole('dialog', { name: 'Retalla la foto' })).toBeNull();
    expect(document.activeElement).toBe(avatarRedo());
    expect(m.updateProfile).not.toHaveBeenCalledWith({ avatar_url: null }, CONFIG);
  });
});

/* Línia I2 (pla 261008_1201) · Ordre del Mestre (261008): el límit, «dit
   abans de triar la foto», a tots els botons d'imatge de la fitxa. Girades
   les dues proves [DEFECTE] que reproduïen el deute (la ranura deia el text
   de sèrie de la closca i, amb imatge, no es deia res). */
describe('l’ajuda es diu abans de triar', () => {
  /* Encàrrec d'harmonització (261018) · Les ranures, dins d'«Edició avançada»: l'ajuda les acompanya allí. */
  /* Pla 2000 (punt 2) · Expectativa actualitzada a propòsit: la persona ja no
     té ranura; el límit de la seua foto el diu la finestra de retall, davall
     de «Canviar foto», abans de triar-ne cap altra. */
  test('la ranura «Logotip» diu AJUDA_FOTO, no el text de sèrie de la closca; la de l’avatar, dins de la finestra', async () => {
    render(<PerfilEditor identitat={jo} />);
    obriEdicioAvancada();
    expect(ranuraAvancada()).toBeNull();
    expect(identitatAvancada().querySelector('.sdp-camp__ajuda')).toBeNull();
    fireEvent.click(cercle());
    const { dialeg } = await triaIGuarda('logoImage', 'Retalla la foto');
    expect(within(dialeg).getByRole('button', { name: 'Canviar foto', description: AJUDA_FOTO })).toBeTruthy();
    cleanup();
    render(<PerfilEditor identitat={org('owner')} />);
    obriEdicioAvancada();
    expect(ajudaDe(within(ranuraAvancada()).getByRole('button', { name: 'Logotip' }))).toBe(AJUDA_FOTO);
    expect(screen.queryByText(AJUDA_DE_LA_RANURA)).toBeNull();
  });

  /* Pla 2000 (punt 2: «elimina … el text dels 10 MB» de sota l'avatar) ·
     Expectativa actualitzada a propòsit: amb imatge, davall del botó
     «Capçalera», una línia; davall del cercle, cap. La de l'avatar ix a la
     finestra de retall, que s'obri amb la foto que ja hi ha. */
  /* Expectativa actualitzada a propòsit (ordre del Mestre, 18-10-2026: «lleva
     la línia dels 10 MB de davall del cercle») · Ja tampoc davall del botó
     «Capçalera»: l'única línia de formats és la de la finestra de retall. */
  test('amb imatge, també: cap línia dels 10 MB davall de «Capçalera» ni del cercle (la diu la finestra)', async () => {
    render(<PerfilEditor identitat={{ ...ambAvatar, dades: { ...ambAvatar.dades, hero_url: '/assets/h.webp' } }} />);
    /* Encàrrec d'harmonització (261018) · L'avatar redó, dins d'«Edició avançada». */
    obriEdicioAvancada();
    expect(ajudaDe(screen.getByRole('button', { name: 'Capçalera' }))).toBeNull();
    expect(cercle()).not.toBeNull();
    expect(identitatAvancada().querySelector('.page-title-avatar-accions, .sdp-camp__ajuda')).toBeNull();
    // Cap línia visible amb el límit; la de la «Capçalera», només per al lector.
    expect([...document.querySelectorAll('.sdp-camp__ajuda')].map((p) => p.textContent)).not.toContain(AJUDA_FOTO);
    const capcalera = screen.getByRole('button', { name: 'Capçalera' });
    expect(document.getElementById(capcalera.getAttribute('aria-describedby')).className).toBe('sdp-nomes-lector');
    await act(async () => { fireEvent.click(cercle()); });
    const dialeg = screen.getByRole('dialog', { name: 'Retalla la foto' });
    expect(within(dialeg).getByText(AJUDA_FOTO).id).toBe(within(dialeg).getByRole('button', { name: 'Canviar foto' }).getAttribute('aria-describedby'));
  });

  test('organització amb logotip: la ranura en repòs diu AJUDA_FOTO davall del botó «Logotip»', () => {
    render(<PerfilEditor identitat={org('owner', { avatar: '/assets/forn.webp', dades: { logo_url: '/assets/forn.webp' } })} />);
    /* Encàrrec d'harmonització (261018) · La ranura en repòs, dins d'«Edició avançada». */
    obriEdicioAvancada();
    const ranura = ranuraAvancada();
    expect(ranura.querySelector('img[role="button"]')).not.toBeNull();
    expect(ajudaDe(within(ranura).getByRole('button', { name: 'Logotip' }))).toBe(AJUDA_FOTO);
  });

  test('en lectura, cap ajuda: ni la ranura ni l’avatar redó', () => {
    render(<PerfilEditor identitat={{ ...ambAvatar, dades: { ...ambAvatar.dades, baixa_demanada_at: '2026-09-26T10:00:00Z' } }} />);
    expect(screen.queryAllByText(AJUDA_FOTO)).toEqual([]);
    expect(document.querySelector('.page-title-avatar-accions')).toBeNull();
  });
});

/* Línia I2 (pla 261008_1201) · La píndola dels drets diu la llicència
   TRIADA de veres (dretsTriats), no el «© Nom» que perfilCamps.js posa a la
   fitxa quan no n'hi ha cap.
   Directiva de Dignitat Humana (pla 261015_1900) · Ara, l'organització. */
describe('la píndola dels drets d’autor', () => {
  test('sense llicència desada, «Elegir drets d’autor» (encara que la fitxa porte «© Forn»)', () => {
    render(<PerfilEditor identitat={org('owner')} />);
    expect(screen.getByRole('button', { name: /Elegir drets d'autor/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Drets d'autor:/ })).toBeNull();
    cleanup();
    render(<PerfilEditor identitat={org('owner', { dades: { copyright: '' } })} />);
    expect(screen.getByRole('button', { name: /Elegir drets d'autor/ })).toBeTruthy();
  });

  test('amb «CC BY 4.0» desada, la píndola plena la diu: «Drets d’autor: CC BY 4.0»', () => {
    render(<PerfilEditor identitat={org('owner', { dades: { copyright: 'CC BY 4.0' } })} />);
    const pindola = screen.getByRole('button', { name: "Drets d'autor: CC BY 4.0" });
    expect(pindola.textContent).toBe('CC BY 4.0');
    expect(screen.queryByRole('button', { name: /Elegir drets d'autor/ })).toBeNull();
  });
});

/* Directiva de Dignitat Humana (pla 261015_1900, Onada 1.1) · De punta a punta
   (PerfilEditor → DocumentEditor real → PageFrame): la capçalera de la fitxa
   d'una persona no porta cap rastre de drets d'autor (ni la píndola, ni la
   línia de copyright, ni la reserva «© Sóc de Poble», ni la vista de drets) ni
   la llista de categories amb «Persona», també amb una llicència desada. La
   d'una organització, com sempre. */
describe('Dignitat Humana · la capçalera de la fitxa de persona', () => {
  const senseDrets = () => {
    const cap = capcalera();
    expect(cap).not.toBeNull();
    expect(cap.querySelector('[data-sdp-drets]')).toBeNull();
    expect(cap.querySelector('.page-title-copyright')).toBeNull();
    expect(cap.querySelector('ul[aria-label="Categories"]')).toBeNull();
    expect(cap.textContent).not.toMatch(/©|CC BY|Persona|Drets d/);
    /* Encàrrec d'harmonització (261018) · Els drets d'una organització es trien
       ara dins d'«Edició avançada»: el de la persona tampoc no en porta cap allí. */
    const avancada = obriEdicioAvancada();
    expect(avancada.querySelector('[data-sdp-drets], .sdp-copyright-control')).toBeNull();
    expect(within(avancada).queryByRole('button', { name: /Drets d'autor|Elegir drets d'autor/ })).toBeNull();
    expect(avancada.textContent).not.toMatch(/©|CC BY|Persona|Drets d/);
  };

  test('sense llicència i amb «CC BY 4.0» desada: cap drets ni cap categoria', () => {
    render(<PerfilEditor identitat={jo} />);
    senseDrets();
    cleanup();
    render(<PerfilEditor identitat={{ ...jo, dades: { ...jo.dades, copyright: 'CC BY 4.0' } }} />);
    senseDrets();
  });

  test('en lectura (baixa en curs): cap drets; l’estat sí, que és un avís', () => {
    render(<PerfilEditor identitat={{ ...jo, dades: { ...jo.dades, copyright: 'CC BY 4.0', baixa_demanada_at: '2026-09-26T10:00:00Z' } }} />);
    const cap = capcalera() || document.querySelector('header.page-title');
    expect(cap.querySelector('.page-title-copyright')).toBeNull();
    expect(cap.textContent).not.toMatch(/©|CC BY|Persona/);
    expect(cap.textContent).toContain('Baixa en curs');
  });

  /* Encàrrec d'harmonització (261018, ordre del Mestre: «el copyright va dins
     del desplegable Edició avançada») · En edició, la píndola dels drets de
     l'organització viu dins d'«Edició avançada» i entre l'H1 i el Subtítol ja
     no es pinta la línia (decisió del Bloc 3.9, la mateixa del Bloc de Notes);
     en lectura, la línia de copyright continua a la capçalera, com sempre. */
  test('control: l’organització conserva la línia de copyright i la píndola dels drets', () => {
    render(<PerfilEditor identitat={org('owner', { dades: { copyright: 'CC BY 4.0' } })} />);
    expect(capcalera().querySelector('.page-title-copyright')).toBeNull();
    const avancada = obriEdicioAvancada();
    expect(within(avancada).getByRole('button', { name: "Drets d'autor: CC BY 4.0" }).closest('.page-title-classificacio')).not.toBeNull();
    cleanup();
    render(<PerfilEditor identitat={org('member', { dades: { copyright: 'CC BY 4.0' } })} />);
    const deLectura = document.querySelector('header.page-title');
    expect(deLectura.querySelector('.page-title-copyright')?.textContent).toBe('CC BY 4.0');
  });
});

/* Línia I2 (pla 261008_1201) · Un error temporal (sense xarxa) la cua el
   torna a provar sola: estatDesament porta `reintentant` i, quan el servidor
   ho confirma, la icona de la barra taronja pinta el check. Sense la clau,
   l'error passava a 'net' sense dir res (la cua no diu 'enviant' en el
   reintent). Rellotge de mentida: el reintent espera el seu retrocés. */
describe('el check del desat després d’un reintent', () => {
  test('error temporal → la cua el torna a provar sola → el servidor ho confirma: la barra pinta el check', async () => {
    vi.useFakeTimers();
    try {
      m.updateProfile.mockRejectedValueOnce(Object.assign(new Error('Sense xarxa'), { status: 0 }));
      render(<PerfilEditor identitat={jo} />);
      const camp = document.querySelector('.editor-subtitle-input');
      fireEvent.focus(camp);
      camp.textContent = 'Llaurador';
      fireEvent.input(camp);
      fireEvent.blur(camp);
      await act(async () => { await vi.advanceTimersByTimeAsync(0); });
      expect(m.updateProfile).toHaveBeenCalledTimes(1);
      expect(document.querySelector('.sdp-estat-desament').dataset.estat).toBe('error');
      expect(document.querySelector('.sdp-estat-desament--desat')).toBeNull();
      await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
      expect(m.updateProfile).toHaveBeenCalledTimes(2);
      expect(m.updateProfile).toHaveBeenLastCalledWith({ bio: 'Llaurador' }, CONFIG);
      const desat = document.querySelector('.sdp-estat-desament--desat');
      expect(desat).not.toBeNull();
      expect(desat.getAttribute('aria-label')).toBe(TEXTOS_ESTAT_DESAMENT.net);
    } finally {
      vi.useRealTimers();
    }
  });
});

/* ═══════════════════════════════════════════════════════════════════
   BLOC 3.5.4 (GAUNTLET 261016) · AVATARS SINCRONITZATS I FRACÀS HONEST
   DEL DESAT

   Pla, Onada 1.1.4: «la targeta central (TargetaViva) i el panell d'edició
   (PerfilEditor) han de beure exactament de la mateixa instància de dades.
   És inadmissible que a la mateixa pantalla es mostre una foto al centre i
   una altra a la dreta.» El contraexemple de Codex (relleu 02:26, P2): amb
   un 403/42501 injectat al desat, l'editor ensenyava la foto nova i la
   targeta viva la vella, el retallador es tancava com si haguera desat i
   useImatgeDeFitxa no propagava el false de saveRemote. Ací, el mateix
   muntatge (editor, handler, cua i TargetaViva de veres; backend, pujada i
   Canvas simulats), amb la conducta correcta per a Javi Llinares, Sóc de
   Poble i El Rentonar.
   ═══════════════════════════════════════════════════════════════════ */
describe('Bloc 3.5.4 · un 403 al desat d’una imatge (P2 de Codex)', () => {
  const VELLA = '/assets/a.webp';
  const NOVA = '/assets/nou.webp';
  const CAPCALERA_VELLA = '/assets/h.webp';
  const MOTIU_403 = 'falta un permís al servidor per a desar este camp: cal aplicar-hi una migració pendent';
  /* jsdom no té IndexedDB: la cua és només de la pestanya (llocDelText). */
  const AVIS_403 = `El servidor no ha acceptat la imatge (${MOTIU_403}). No s’ha desat: es guarda en esta pestanya fins que tanques la sessió, i la pots tornar a provar.`;
  const error403 = (taula) => Object.assign(
    new Error(`Supabase 403: {"code":"42501","message":"permission denied for table ${taula}"}`), { status: 403, code: '42501' },
  );
  const javi = {
    id: 'jo', mena: 'persona', nom: 'Javi Llinares', rol: 'Persona', avatar: VELLA,
    dades: { id: 'U', full_name: 'Javi Llinares', town_name: 'La Torre de les Maçanes', avatar_url: VELLA, hero_url: CAPCALERA_VELLA },
  };
  const rentonar = {
    id: 'R', mena: 'grup', nom: 'El Rentonar', rol: 'Propietària', avatar: '/assets/rentonar.webp',
    dades: { name: 'El Rentonar', visibility: 'public', role: 'owner', town_name: 'La Torre de les Maçanes', logo_url: '/assets/rentonar.webp' },
  };
  const socDePoble = {
    ...org('owner'), id: ENTITAT_PILOT_ID, nom: 'Sóc de Poble',
    dades: { name: 'Sóc de Poble', visibility: 'public', role: 'owner', town_name: 'La Torre de les Maçanes', hero_url: CAPCALERA_VELLA },
  };
  const refDe = (id, entitat) => ({ ambit: m.perfil.autodesament.ambit, context: CONFIG, entitat, id });

  /* La fitxa de la llista de PerfilShell (FitxaDePerfil): la targeta viva que publica l'editor. */
  function FitxaDeLaLlista({ clau }) {
    const viu = useDocumentViu(clau);
    return viu ? <TargetaViva {...viu} avis={AVISOS_TARGETA_VIVA.perfil} actual /> : null;
  }
  const munta = (identitat) => render(<><PerfilEditor identitat={identitat} /><FitxaDeLaLlista clau={identitat.id} /></>);

  const srcDe = (img) => img?.getAttribute('src') ?? null;
  const targeta = () => document.querySelector('article.sdp-targeta-viva-carta');
  const barraDeLEditor = () => [...document.querySelectorAll('section.bar-orange')].find((s) => !s.closest('.sdp-targeta-viva-carta'));
  /* La imatge pròpia a les tres superfícies: l'avatar redó (o la ranura del
     logotip), la barra taronja de l'editor i la targeta viva.
     Encàrrec d'harmonització (261018) · L'avatar redó i la ranura ja no són
     damunt de l'H1: el control de l'editor viu dins d'«Edició avançada». */
  const imatgesPropies = () => ({
    editor: srcDe(desplegable()?.querySelector('.sdp-edicio-avancada__identitat button.page-title-avatar--canvia img, [data-sdp-ranura="logotip"] img[role="button"]')),
    barra: srcDe(barraDeLEditor()?.querySelector('img.sp-card-avatar')),
    targeta: srcDe(targeta()?.querySelector('img.sp-card-avatar')),
  });
  /* Encàrrec d'harmonització (261018) · El que es configura es veu al seu lloc
     real: el logotip desat d'una organització, damunt de l'H1 (logoEntitat);
     la persona no hi porta res. */
  const logoDelTitol = () => srcDe(capcalera().querySelector('img.page-title-logo'));
  /* Encàrrec d'harmonització (261018) · El control «Capçalera» (img.sdp-hero__imatge)
     viu dins d'«Edició avançada»; la capçalera desada es pinta, a més, dalt de
     la pàgina (.hero-image). Les tres, la mateixa imatge. */
  const capcaleres = () => ({
    editor: srcDe(desplegable()?.querySelector('[data-sdp-ranura="capcalera"] img.sdp-hero__imatge')),
    pagina: srcDe(document.querySelector('.sdp-editor-document .hero-image img')),
    targeta: srcDe(targeta()?.querySelector('img.sp-card-media')),
  });
  const totes = (src) => ({ editor: src, barra: src, targeta: src });

  async function triaIGuardaSenseTancar(camp, finestra) {
    await act(async () => { fireEvent.change(selector(camp), { target: { files: [new File(['x'], 'foto.png', { type: 'image/png' })] } }); });
    await act(async () => {});
    const dialeg = screen.getByRole('dialog', { name: finestra });
    await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: nomDeGuardar(finestra) })); });
    return dialeg;
  }
  const avisDeLaFinestra = (finestra) => within(screen.getByRole('dialog', { name: finestra })).queryByRole('alert')?.textContent ?? null;

  test('Javi Llinares · avatar: després del 403 la finestra continua oberta amb el motiu, la cua guarda la foto, i editor, barra i targeta viva porten la mateixa', async () => {
    m.updateProfile = vi.fn(async () => { throw error403('profiles'); });
    munta(javi);
    expect(imatgesPropies()).toEqual(totes(VELLA));
    // Encàrrec d'harmonització (261018) · Damunt de l'H1 de la persona, res: l'avatar és a la barra i dins d'«Edició avançada».
    expect(logoDelTitol()).toBeNull();
    capcaleraNeta();
    fireEvent.click(obriEdicioAvancada().querySelector('.sdp-edicio-avancada__identitat button.page-title-avatar--canvia'));
    await triaIGuardaSenseTancar('logoImage', 'Retalla la foto');
    await waitFor(() => expect(avisDeLaFinestra('Retalla la foto')).toBe(AVIS_403));
    // El retallador no es tanca com si haguera desat: cap toast, cap recàrrega, un sol PATCH.
    expect(m.updateProfile.mock.calls).toEqual([[{ avatar_url: NOVA }, CONFIG]]);
    expect(m.showToast).not.toHaveBeenCalled();
    expect(m.perfil.recarrega).not.toHaveBeenCalled();
    // La mateixa instància a tota la pantalla: l'esborrany que la cua conserva per a reintentar.
    expect(imatgesPropies()).toEqual(totes(NOVA));
    const estat = cuaDesament.llig(refDe('jo', 'perfil'));
    expect([estat.estat, estat.camps.logoImage, estat.errors.logoImage.tipus]).toEqual(['error', NOVA, 'servidor']);
    // El servidor ja l'accepta: tornar a Guardar la desa, tanca la finestra i la cua queda neta.
    m.updateProfile = vi.fn(async (canvis) => ({ id: 'U', ...canvis }));
    await act(async () => { fireEvent.click(within(screen.getByRole('dialog', { name: 'Retalla la foto' })).getByRole('button', { name: 'Guardar enquadre' })); });
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Retalla la foto' })).toBeNull());
    expect(m.updateProfile).toHaveBeenCalledWith({ avatar_url: NOVA }, CONFIG);
    expect(cuaDesament.llig(refDe('jo', 'perfil')).camps).toEqual({});
    expect(imatgesPropies()).toEqual(totes(NOVA));
  });

  test('Javi Llinares · avatar: Cancel·lar després del 403 no perd res; l’avís en línia ho diu i «Tornar a provar» envia el valor de la cua', async () => {
    m.updateProfile = vi.fn(async () => { throw error403('profiles'); });
    munta(javi);
    // Encàrrec d'harmonització (261018) · L'avatar redó, dins d'«Edició avançada».
    fireEvent.click(obriEdicioAvancada().querySelector('.sdp-edicio-avancada__identitat button.page-title-avatar--canvia'));
    await triaIGuardaSenseTancar('logoImage', 'Retalla la foto');
    await waitFor(() => expect(avisDeLaFinestra('Retalla la foto')).toBe(AVIS_403));
    await act(async () => { fireEvent.click(within(screen.getByRole('dialog', { name: 'Retalla la foto' })).getByRole('button', { name: 'Cancel·lar' })); });
    expect(screen.queryByRole('dialog', { name: 'Retalla la foto' })).toBeNull();
    expect(imatgesPropies()).toEqual(totes(NOVA));
    const avis = document.querySelector('.sdp-avisos-camps');
    expect(avis.textContent).toContain(`El servidor no ha acceptat el canvi (${MOTIU_403})`);
    m.updateProfile = vi.fn(async (canvis) => ({ id: 'U', ...canvis }));
    await act(async () => { fireEvent.click(within(avis).getByRole('button', { name: 'Tornar a provar' })); });
    await waitFor(() => expect(cuaDesament.llig(refDe('jo', 'perfil')).camps).toEqual({}));
    expect(m.updateProfile.mock.calls).toEqual([[{ avatar_url: NOVA }, CONFIG]]);
    expect(m.perfil.pujaMitja).toHaveBeenCalledTimes(1);
    expect(imatgesPropies()).toEqual(totes(NOVA));
  });

  test('Javi Llinares · capçalera: les mateixes regles; el quadrat de l’editor i el de la targeta viva són la mateixa imatge', async () => {
    m.updateProfile = vi.fn(async () => { throw error403('profiles'); });
    munta(javi);
    // Encàrrec d'harmonització (261018) · També la capçalera de dalt de la pàgina (pagina), la mateixa imatge.
    expect(capcaleres()).toEqual({ editor: CAPCALERA_VELLA, pagina: CAPCALERA_VELLA, targeta: CAPCALERA_VELLA });
    obriEdicioAvancada();
    fireEvent.click(screen.getByRole('button', { name: 'Capçalera' }));
    await triaIGuardaSenseTancar('heroImage', 'Retalla la capçalera');
    await waitFor(() => expect(avisDeLaFinestra('Retalla la capçalera')).toBe(AVIS_403));
    expect(capcaleres()).toEqual({ editor: NOVA, pagina: NOVA, targeta: NOVA });
    expect(cuaDesament.llig(refDe('jo', 'perfil')).camps.heroImage).toBe(NOVA);
    // L'avatar no s'ha mogut de cap banda.
    expect(imatgesPropies()).toEqual(totes(VELLA));
  });

  test('El Rentonar · logotip: 403, la finestra oberta i una sola imatge; «Tornar al que hi ha desat» torna les tres superfícies al logotip del servidor', async () => {
    m.updateOrganization = vi.fn(async () => { throw error403('organizations'); });
    munta(rentonar);
    expect(imatgesPropies()).toEqual(totes('/assets/rentonar.webp'));
    // Encàrrec d'harmonització (261018) · La ranura, dins d'«Edició avançada»; el logotip desat, també damunt de l'H1.
    expect(logoDelTitol()).toBe('/assets/rentonar.webp');
    fireEvent.click(within(obriEdicioAvancada().querySelector('[data-sdp-ranura="logotip"]')).getByRole('button', { name: 'Logotip' }));
    await triaIGuardaSenseTancar('logoImage', 'Retalla el logotip');
    await waitFor(() => expect(avisDeLaFinestra('Retalla el logotip')).toBe(AVIS_403));
    expect(m.updateOrganization.mock.calls).toEqual([['R', { logo_url: NOVA }, CONFIG]]);
    expect(imatgesPropies()).toEqual(totes(NOVA));
    expect(logoDelTitol()).toBe(NOVA);
    await act(async () => { fireEvent.click(within(screen.getByRole('dialog', { name: 'Retalla el logotip' })).getByRole('button', { name: 'Cancel·lar' })); });
    const avis = document.querySelector('.sdp-avisos-camps');
    await act(async () => { fireEvent.click(within(avis).getByRole('button', { name: 'Tornar al que hi ha desat' })); });
    expect(cuaDesament.llig(refDe('R', 'organitzacio')).camps).toEqual({});
    expect(imatgesPropies()).toEqual(totes('/assets/rentonar.webp'));
    expect(logoDelTitol()).toBe('/assets/rentonar.webp');
  });

  test('Sóc de Poble · capçalera: 403, la finestra oberta; la barra i la targeta viva continuen amb el logotip oficial', async () => {
    m.updateOrganization = vi.fn(async () => { throw error403('organizations'); });
    munta(socDePoble);
    obriEdicioAvancada();
    fireEvent.click(screen.getByRole('button', { name: 'Capçalera' }));
    await triaIGuardaSenseTancar('heroImage', 'Retalla la capçalera');
    await waitFor(() => expect(avisDeLaFinestra('Retalla la capçalera')).toBe(AVIS_403));
    // Encàrrec d'harmonització (261018) · També la capçalera de dalt de la pàgina (pagina).
    expect(capcaleres()).toEqual({ editor: NOVA, pagina: NOVA, targeta: NOVA });
    const { barra, targeta: deLaTargeta } = imatgesPropies();
    expect([barra, deLaTargeta]).toEqual([DEFAULT_AUTHOR.avatarUrl, DEFAULT_AUTHOR.avatarUrl]);
  });

  test('Escape a mitja pujada i després un 403: l’avís honest va fora (toast) i res no es dona per desat', async () => {
    const estat = {};
    m.perfil.pujaMitja = vi.fn(() => new Promise((resol) => { estat.resol = resol; }));
    m.updateProfile = vi.fn(async () => { throw error403('profiles'); });
    munta(javi);
    // Encàrrec d'harmonització (261018) · L'avatar redó, dins d'«Edició avançada».
    fireEvent.click(obriEdicioAvancada().querySelector('.sdp-edicio-avancada__identitat button.page-title-avatar--canvia'));
    const dialeg = await triaIGuardaSenseTancar('logoImage', 'Retalla la foto');
    await waitFor(() => expect(m.perfil.pujaMitja).toHaveBeenCalledTimes(1));
    await act(async () => { fireEvent(dialeg, new Event('cancel', { cancelable: true })); });
    await act(async () => { estat.resol(NOVA); });
    await waitFor(() => expect(m.showToast).toHaveBeenCalledWith(AVIS_403, 'error'));
    expect(imatgesPropies()).toEqual(totes(NOVA));
    expect(cuaDesament.llig(refDe('jo', 'perfil')).errors.logoImage.tipus).toBe('servidor');
  });

  test('avisDeImatgeNoDesada · el motiu de la cua, dit per a una imatge, i on es guarda', () => {
    const lloc = { persistent: true };
    expect(avisDeImatgeNoDesada({ ...lloc, errors: { logoImage: { tipus: 'servidor', missatge: `${MOTIU_403}.` } } }, 'logoImage'))
      .toBe(`El servidor no ha acceptat la imatge (${MOTIU_403}). No s’ha desat: es guarda en este dispositiu fins que tanques la sessió, i la pots tornar a provar.`);
    expect(avisDeImatgeNoDesada({ persistent: false, errors: { heroImage: { tipus: 'columna', columna: 'hero_url' } } }, 'heroImage'))
      .toBe('El servidor no ha acceptat la imatge (Este camp encara no té columna al servidor «hero_url»). No s’ha desat: es guarda en esta pestanya fins que tanques la sessió, i la pots tornar a provar.');
    expect(avisDeImatgeNoDesada({ ...lloc, errors: {}, problema: { tipus: 'temporal', missatge: 'Sense xarxa' } }, 'logoImage'))
      .toBe('No s’ha pogut desar la imatge (Sense xarxa). Es tornarà a provar sola; mentrestant, es guarda en este dispositiu fins que tanques la sessió.');
    // Sense error ni problema temporal (la sessió es renova): pendent, mai «desada».
    expect(avisDeImatgeNoDesada({ ...lloc, errors: {}, problema: null }, 'logoImage'))
      .toBe('La imatge encara no s’ha desat al servidor. Es guarda en este dispositiu fins que tanques la sessió, i eixirà sola quan es puga.');
  });
});
