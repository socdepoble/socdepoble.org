import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* ═══════════════════════════════════════════════════════════════════
   AUDITORIA 261007 (RETOCS DE L'ORDRE E) · ON VA EL FOCUS EN DESAR L'AVATAR

   Una persona sense avatar el posa des de la ranura de damunt de l'H1 i
   desa: la ranura es desmunta, ix l'avatar redó i el focus, que tornava al
   botó que l'havia obert (ja fora del DOM), queia al body. Ara, quan la
   imatge pròpia s'ha desat (o llevat), el focus va al botó de l'avatar o, si
   encara hi és, a la ranura.
   Onada 4 (retallador senzill, 261008) · Sense diàleg intermedi: la ranura i
   l'avatar redó obrin el selector i la finestra de retall (useImatgeDeFitxa),
   i «Llevar l'avatar» és avatarAutor.onLleva, amb confirmació. De punta a
   punta (PerfilEditor → DocumentEditor → UniversalEditorShell →
   UniversalPage → PageFrame) amb la cua d'autodesament de veres. jsdom no té
   canvas: la frontera amb el navegador (imatgeCanvas.js), compressImage i el
   fetch del data URL se simulen. DocumentEditor és el de veres, embolcallat
   per a llegir-ne l'adaptador (onLleva encara no té botó propi a PageFrame
   fins al CONTRACTE-1).
   Encàrrec d'harmonització (261018) · L'avatar redó (amb «Llevar l'avatar»,
   ja una píndola de veres) i la ranura viuen dins del desplegable «Edició
   avançada», no damunt de l'H1: les proves l'obrin abans de tocar-hi res.
   Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 2) · Expectatives
   actualitzades a propòsit: la persona ja no té ranura ni píndoles. El cercle
   és sempre el botó (buit, sense foto: el selector; amb foto, la finestra de
   retall amb eixa foto), «Llevar avatar» és dins de la finestra, i el focus
   torna sempre al cercle.
   ═══════════════════════════════════════════════════════════════════ */

const m = vi.hoisted(() => ({ perfil: null, updateProfile: null, adapter: null }));
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
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
/* T47 · La fitxa es desa per la cua d'autodesament: la sessió és la de «U». */
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
  dibuixaVisor: () => true,
  exportaRetall: dobles.exportaRetall,
}));
vi.mock('../../utils/imageUtils.js', () => ({ compressImage: dobles.compressImage }));
vi.mock('../../components/universal/DocumentEditor', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    DocumentEditor: (props) => {
      m.adapter = props.adapter;
      return <real.DocumentEditor {...props} />;
    },
  };
});

import { PerfilEditor } from './PerfilEditor.jsx';
import { cuaDesament } from '../../data/autodesament/cua.js';
import { ambitDe } from '../../data/autodesament/ambit.js';

const CONFIG = Object.freeze({ tenantId: '00000000-0000-4000-8000-000000000000' });
const jo = { id: 'jo', mena: 'persona', nom: 'Pep', rol: 'Persona', dades: { id: 'U', full_name: 'Pep', town_name: 'La Torre' } };
const ambAvatar = { ...jo, avatar: '/assets/a.webp', dades: { ...jo.dades, avatar_url: '/assets/a.webp' } };

beforeEach(async () => {
  m.adapter = null;
  m.updateProfile = vi.fn(async (canvis) => ({ id: 'U', ...canvis }));
  m.perfil = {
    identitats: [], guardarCampPerfil: vi.fn(), pujaMitja: vi.fn(async () => '/assets/nou.webp'), recarrega: vi.fn(),
    autodesament: { ambit: ambitDe(CONFIG, 'U'), context: CONFIG },
  };
  await cuaDesament.reinicia();
  dobles.carregaImatge.mockReset().mockResolvedValue({ amplada: 1600, alcada: 1200, tipus: 'image/jpeg', element: {}, allibera: vi.fn() });
  dobles.exportaRetall.mockReset().mockResolvedValue(new File(['y'], 'enquadrament.jpg', { type: 'image/jpeg' }));
  dobles.compressImage.mockReset().mockResolvedValue('data:image/webp;base64,AAAA');
  vi.stubGlobal('fetch', vi.fn(async () => ({ blob: async () => new Blob(['w'], { type: 'image/webp' }) })));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const capcalera = () => document.querySelector('.sdp-editor-document header.page-title');
/* Encàrrec d'harmonització (261018, ordre del Mestre: «la gestió d'imatges va
   dins d'Edició avançada») · L'avatar redó i la ranura ja no són damunt de
   l'H1: viuen dins del desplegable PLEGAT «Edició avançada» (l'avatar a
   .sdp-edicio-avancada__identitat, la ranura a [data-sdp-ranura="logotip"]).
   La persona l'obri clicant el resum abans de tocar-hi res. */
const desplegable = () => document.querySelector('.sdp-editor-document details.sdp-edicio-avancada');
const botoAvatar = () => desplegable().querySelector('.sdp-edicio-avancada__identitat button.page-title-avatar--canvia');
/* La ranura, pel seu contenidor (el nom l'escriu l'adaptador: «Avatar»).
   Pla 2000 (punt 2) · La persona ja no en té: ha de ser sempre null. */
const ranura = () => desplegable().querySelector('[data-sdp-ranura="logotip"] button');
const selector = (camp) => document.querySelector(`input[type="file"][data-imatge-de-fitxa="${camp}"]`);
function obriEdicioAvancada() {
  expect(desplegable().open).toBe(false);
  fireEvent.click(desplegable().querySelector('summary'));
  expect(desplegable().open).toBe(true);
  // Damunt de l'H1 ja no hi ha ni l'avatar redó ni la ranura.
  expect(capcalera().querySelector('.page-title-avatar, .page-title-logo-personalitzat')).toBeNull();
}

/* Clica el control amb el focus damunt, com a la finestra de veres, tria la
   foto i guarda; espera que la finestra es tanque.
   Pla 2000 (punt 2) · La finestra de l'avatar desa amb «Guardar enquadre». */
async function posaImatge(control, camp, finestra) {
  control.focus();
  act(() => { fireEvent.click(control); });
  await act(async () => { fireEvent.change(selector(camp), { target: { files: [new File(['x'], 'foto.jpg', { type: 'image/jpeg' })] } }); });
  await act(async () => {});
  const desa = finestra === 'Retalla la foto' ? 'Guardar enquadre' : 'Guardar';
  fireEvent.click(within(screen.getByRole('dialog', { name: finestra })).getByRole('button', { name: desa }));
  await waitFor(() => expect(screen.queryByRole('dialog', { name: finestra })).toBeNull());
}

/* Pla 2000 (punt 2) · Expectativa actualitzada a propòsit: sense avatar, el
   control és el cercle buit (ja no la ranura «Avatar»); desat, el mateix
   cercle porta la foto nova i el focus. */
test('Auditoria 261007 · sense avatar: desar des del cercle buit porta el focus al cercle, ja amb la foto nova', async () => {
  render(<PerfilEditor identitat={jo} />);
  /* Encàrrec d'harmonització (261018) · El control, dins d'«Edició avançada». */
  obriEdicioAvancada();
  expect(ranura()).toBeNull();
  const boto = botoAvatar();
  expect(boto.getAttribute('aria-label')).toBe('Posa un avatar');
  expect(boto.querySelector('img')).toBeNull();
  await posaImatge(boto, 'logoImage', 'Retalla la foto');
  expect(ranura()).toBeNull();
  expect(botoAvatar().querySelector('img').getAttribute('src')).toBe('/assets/nou.webp');
  expect(botoAvatar().getAttribute('aria-label')).toBe('Ajusta o canvia l’avatar');
  expect(document.activeElement).toBe(botoAvatar());
  expect(m.updateProfile).toHaveBeenCalledWith(expect.objectContaining({ avatar_url: '/assets/nou.webp' }), CONFIG);
});

/* Encàrrec d'harmonització (261018) · avatarAutor ja no és a l'adaptador
   d'edició. Pla 2000 (punt 2) · Expectativa actualitzada a propòsit:
   «Llevar avatar» és dins de la finestra de retall que obri el cercle;
   confirmat, les dues finestres es tanquen i el focus va al cercle, ara buit
   (cap ranura al seu lloc). */
test('Auditoria 261007 · amb avatar: «Llevar avatar» (dins de la finestra, confirmat) porta el focus al cercle, ara buit', async () => {
  render(<PerfilEditor identitat={ambAvatar} />);
  expect(m.adapter).not.toHaveProperty('avatarAutor');
  obriEdicioAvancada();
  expect(ranura()).toBeNull();
  // Davall del cercle, res: ni píndoles ni la línia dels 10 MB.
  expect(desplegable().querySelector('.sdp-edicio-avancada__identitat .page-title-avatar-accions')).toBeNull();
  botoAvatar().focus();
  await act(async () => { fireEvent.click(botoAvatar()); });
  const finestra = screen.getByRole('dialog', { name: 'Retalla la foto' });
  const lleva = within(finestra).getByRole('button', { name: 'Llevar avatar' });
  lleva.focus();
  act(() => { fireEvent.click(lleva); });
  const confirma = screen.getByRole('dialog', { name: 'Llevar l’avatar?' });
  fireEvent.click(within(confirma).getByRole('button', { name: 'Llevar l’avatar' }));
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Llevar l’avatar?' })).toBeNull());
  expect(screen.queryByRole('dialog', { name: 'Retalla la foto' })).toBeNull();
  expect(botoAvatar().querySelector('img')).toBeNull();
  expect(botoAvatar().getAttribute('aria-label')).toBe('Posa un avatar');
  expect(ranura()).toBeNull();
  expect(document.activeElement).toBe(botoAvatar());
  expect(m.updateProfile).toHaveBeenCalledWith({ avatar_url: null }, CONFIG);
});

/* Encàrrec d'harmonització (261018) · «Capçalera» i el control de l'avatar,
   dins d'«Edició avançada». Pla 2000 (punt 2) · Expectativa actualitzada a
   propòsit: el control de la persona sense foto és el cercle buit. */
test('Auditoria 261007 · la capçalera desada no mou el focus a l’avatar ni a la ranura', async () => {
  render(<PerfilEditor identitat={jo} />);
  obriEdicioAvancada();
  expect(botoAvatar()).not.toBeNull();
  await posaImatge(within(desplegable()).getByRole('button', { name: 'Capçalera' }), 'heroImage', 'Retalla la capçalera');
  expect(botoAvatar()).not.toBeNull();
  expect(document.activeElement).not.toBe(botoAvatar());
  expect(ranura()).toBeNull();
  expect(m.updateProfile).toHaveBeenCalledWith(expect.objectContaining({ hero_url: '/assets/nou.webp' }), CONFIG);
});
