import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/* ═══════════════════════════════════════════════════════════════════
   P1-64 (pla 261028_1526 §3.1.1; Mestre 261028, decisió 7) · Revisió
   adversarial 261028 (privacitat, 1 i 5) · De punta a punta, des de la fitxa
   del Perfil (PerfilEditor → useImatgeDeFitxa → DialegEnquadrament), la línia
   que decidix qui és identitat: la capçalera d'una PERSONA puja neta, sense
   casella i amb l'avís literal si la foto portava GPS; la d'una organització
   o d'un agent conserva la casella. I el text del Perfil no demana mai l'EXIF
   d'una foto del cos (DocumentEditor · fotosDePublicacio). Els mocks són els
   de PerfilEditor.imatges.test.jsx; la lectura de l'EXIF és la de veres.
   ═══════════════════════════════════════════════════════════════════ */

const m = vi.hoisted(() => ({ perfil: null, updateProfile: null, updateOrganization: null, showToast: null }));
const dobles = vi.hoisted(() => ({ carregaImatge: vi.fn(), exportaRetall: vi.fn(), compressImage: vi.fn(), extensions: vi.fn(() => []) }));
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
vi.mock('../../components/universal/richText/extensions', () => ({ extensionsRiques: (...args) => dobles.extensions(...args) }));
vi.mock('../../components/universal/DocumentPrintPreview.jsx', () => ({ default: () => null }));
vi.mock('../../components/universal/enquadrament/imatgeCanvas.js', () => ({
  carregaImatge: dobles.carregaImatge,
  dibuixaVisor: () => true,
  exportaRetall: dobles.exportaRetall,
}));
vi.mock('../../utils/imageUtils.js', () => ({ compressImage: dobles.compressImage }));

import { PerfilEditor } from './PerfilEditor.jsx';
import { AVIS_GPS_ELIMINAT_PERFIL } from '../../components/universal/enquadrament/DialegEnquadrament.jsx';
import { ETIQUETA_CONSERVA_EXIF } from '../../components/universal/enquadrament/exifIncrustat.js';
import { dataOriginal, gpsTorre, jpegAmbExif, orientacio } from '../../components/universal/enquadrament/jpegProva.js';
import { oblidaEntitatDelProjecte } from '../../config/navigation.js';
import { cuaDesament } from '../../data/autodesament/cua.js';
import { ambitDe } from '../../data/autodesament/ambit.js';

const CONFIG = Object.freeze({ tenantId: '00000000-0000-4000-8000-000000000000' });
const jo = { id: 'jo', mena: 'persona', nom: 'Pep', rol: 'Persona', dades: { id: 'U', full_name: 'Pep', town_name: 'La Torre' } };
const agent = { id: 'A', mena: 'agent', nom: 'IAIA', rol: 'Agent IA', dades: { name: 'IAIA' } };
const org = { id: 'O', mena: 'empresa', nom: 'Forn', rol: 'Membre', dades: { name: 'Forn', visibility: 'public', role: 'owner' } };
const fotoGps = () => new File([jpegAmbExif({ ifd0: [orientacio(1)], exif: dataOriginal('2024:06:29 12:00:00'), gps: gpsTorre() })], 'casa.jpg', { type: 'image/jpeg' });

beforeEach(async () => {
  m.updateProfile = vi.fn(async (canvis) => ({ id: 'U', ...canvis }));
  m.updateOrganization = vi.fn(async (id, canvis) => ({ id, ...canvis }));
  m.showToast = vi.fn();
  m.perfil = {
    identitats: [], guardarCampPerfil: vi.fn(), pujaMitja: vi.fn(async () => '/assets/nou.webp'), recarrega: vi.fn(),
    autodesament: { ambit: ambitDe(CONFIG, 'U'), context: CONFIG },
  };
  await cuaDesament.reinicia();
  dobles.carregaImatge.mockReset().mockResolvedValue({ amplada: 2000, alcada: 1500, tipus: 'image/jpeg', element: {}, allibera: vi.fn() });
  dobles.exportaRetall.mockReset().mockResolvedValue(new File(['y'], 'enquadrament.jpg', { type: 'image/jpeg' }));
  dobles.compressImage.mockReset().mockResolvedValue('data:image/webp;base64,AAAA');
  dobles.extensions.mockClear();
  vi.stubGlobal('fetch', vi.fn(async () => ({ blob: async () => new Blob(['w'], { type: 'image/webp' }) })));
});
afterEach(() => {
  cleanup();
  oblidaEntitatDelProjecte();
  vi.unstubAllGlobals();
});

const desplegable = () => document.querySelector('.sdp-editor-document details.sdp-edicio-avancada');
const obriEdicioAvancada = () => {
  const detalls = desplegable();
  if (!detalls.open) fireEvent.click(detalls.querySelector('summary.sdp-edicio-avancada__resum'));
};
const selector = (camp) => document.querySelector(`input[type="file"][data-imatge-de-fitxa="${camp}"]`);
async function triaLaCapcalera(identitat) {
  render(<PerfilEditor identitat={identitat} />);
  obriEdicioAvancada();
  fireEvent.click(screen.getByRole('button', { name: 'Capçalera' }));
  await act(async () => { fireEvent.change(selector('heroImage'), { target: { files: [fotoGps()] } }); });
  await act(async () => {});
  return screen.getByRole('dialog', { name: 'Retalla la capçalera' });
}
const casella = (dialeg) => within(dialeg).queryByRole('checkbox', { name: new RegExp(ETIQUETA_CONSERVA_EXIF) });

describe('P1-64 · la capçalera de la fitxa: identitat només per a la persona', () => {
  test('persona: cap casella, l’avís literal; desada neta (cap conservaExif) i l’avís també en un toast', async () => {
    const dialeg = await triaLaCapcalera(jo);
    expect(await within(dialeg).findByText(AVIS_GPS_ELIMINAT_PERFIL)).toBeTruthy();
    expect(casella(dialeg)).toBeNull();
    fireEvent.click(within(dialeg).getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Retalla la capçalera' })).toBeNull());
    expect(m.updateProfile).toHaveBeenCalledWith({ hero_url: '/assets/nou.webp' }, CONFIG);
    expect(dobles.compressImage).toHaveBeenCalled();
    expect(dobles.compressImage.mock.calls.every(([, opcions]) => opcions?.conservaExif !== true)).toBe(true);
    expect(m.showToast).toHaveBeenCalledWith(AVIS_GPS_ELIMINAT_PERFIL, 'info');
  });

  test.each([['una organització', org], ['un agent', agent]])('%s: la casella hi és (marcada) i cap avís de perfil', async (_cas, identitat) => {
    const dialeg = await triaLaCapcalera(identitat);
    await waitFor(() => expect(casella(dialeg)).not.toBeNull());
    expect(casella(dialeg).checked).toBe(true);
    expect(within(dialeg).queryByText(AVIS_GPS_ELIMINAT_PERFIL)).toBeNull();
  });
});

describe('P1-64 · el text del Perfil no demana l’EXIF de les fotos del cos', () => {
  test.each([['la persona', jo], ['una organització', org], ['un agent', agent]])('%s: les extensions no reben cap demanaExif', (_cas, identitat) => {
    render(<PerfilEditor identitat={identitat} />);
    expect(dobles.extensions).toHaveBeenCalled();
    for (const [opcions] of dobles.extensions.mock.calls) expect(Object.hasOwn(opcions ?? {}, 'demanaExif'), identitat.nom).toBe(false);
  });
});
