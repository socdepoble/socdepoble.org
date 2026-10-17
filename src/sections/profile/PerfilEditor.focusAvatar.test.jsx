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
const botoAvatar = () => capcalera().querySelector('button.page-title-avatar--canvia');
/* La ranura, pel seu contenidor (el nom l'escriu l'adaptador: «Avatar»). */
const ranura = () => capcalera().querySelector('.page-title-logo-personalitzat button');
const selector = (camp) => document.querySelector(`input[type="file"][data-imatge-de-fitxa="${camp}"]`);

/* Clica el control amb el focus damunt, com a la finestra de veres, tria la
   foto i guarda; espera que la finestra es tanque. */
async function posaImatge(control, camp, finestra) {
  control.focus();
  act(() => { fireEvent.click(control); });
  await act(async () => { fireEvent.change(selector(camp), { target: { files: [new File(['x'], 'foto.jpg', { type: 'image/jpeg' })] } }); });
  await act(async () => {});
  fireEvent.click(within(screen.getByRole('dialog', { name: finestra })).getByRole('button', { name: 'Guardar' }));
  await waitFor(() => expect(screen.queryByRole('dialog', { name: finestra })).toBeNull());
}

test('Auditoria 261007 · sense avatar: desar des de la ranura porta el focus a l’avatar redó que ix al seu lloc', async () => {
  render(<PerfilEditor identitat={jo} />);
  const boto = ranura();
  expect(boto.textContent).toContain('Avatar');
  await posaImatge(boto, 'logoImage', 'Retalla la foto');
  // La ranura ja no hi és: al seu lloc, l'avatar redó amb la imatge nova, i el focus damunt.
  expect(ranura()).toBeNull();
  expect(botoAvatar().querySelector('img').getAttribute('src')).toBe('/assets/nou.webp');
  expect(document.activeElement).toBe(botoAvatar());
  expect(m.updateProfile).toHaveBeenCalledWith(expect.objectContaining({ avatar_url: '/assets/nou.webp' }), CONFIG);
});

test('Auditoria 261007 · amb avatar: «Llevar l’avatar» (onLleva, confirmat) porta el focus a la ranura que ix al seu lloc', async () => {
  render(<PerfilEditor identitat={ambAvatar} />);
  botoAvatar().focus();
  act(() => { m.adapter.avatarAutor.onLleva({ currentTarget: botoAvatar() }); });
  const confirma = screen.getByRole('dialog', { name: 'Llevar l’avatar?' });
  fireEvent.click(within(confirma).getByRole('button', { name: 'Llevar l’avatar' }));
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Llevar l’avatar?' })).toBeNull());
  expect(botoAvatar()).toBeNull();
  expect(document.activeElement).toBe(ranura());
  expect(m.updateProfile).toHaveBeenCalledWith({ avatar_url: null }, CONFIG);
});

test('Auditoria 261007 · la capçalera desada no mou el focus a l’avatar ni a la ranura', async () => {
  render(<PerfilEditor identitat={jo} />);
  await posaImatge(screen.getByRole('button', { name: 'Capçalera' }), 'heroImage', 'Retalla la capçalera');
  expect(document.activeElement).not.toBe(ranura());
  expect(botoAvatar()).toBeNull();
  expect(m.updateProfile).toHaveBeenCalledWith(expect.objectContaining({ hero_url: '/assets/nou.webp' }), CONFIG);
});
