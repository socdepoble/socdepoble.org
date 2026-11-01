import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';

/* ═══════════════════════════════════════════════════════════════════
   P1-22 (T5c, correcció G1 de l'assalt 261101) · ELS FORMATS ADMESOS DE LA
   CLOSCA DEL PERFIL, EN LA LLENGUA DE LA INTERFÍCIE

   La línia «PNG, JPEG o WebP, fins a 10 MB.» (AJUDA_FOTO) de la ranura del
   logotip i de la capçalera (heroEditHelp, ajudaAmbImatge, logoEditHelp) es
   pintava en valencià amb la interfície en anglés. De punta a punta, com
   PerfilEditor.logotip.test.jsx, amb el traductor anglés de veres.
   ═══════════════════════════════════════════════════════════════════ */

const m = vi.hoisted(() => ({ perfil: null, llengua: 'en' }));
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
vi.mock('../../app/contexts/UIContext', async () => {
  const { createTranslator } = await import('../../config/i18n.js');
  const accions = () => ({ t: createTranslator(m.llengua) });
  return { useUI: () => ({ externalConfig: {} }), useUIActions: accions, useUIActionsOpcional: accions };
});
vi.mock('../../components/universal/ContentProvider', () => ({ useContent: () => null }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({ ...(await importOriginal()), teCapacitat: () => false }));
vi.mock('./PerfilContext.jsx', () => ({ usePerfil: () => m.perfil }));
vi.mock('../../components/universal/richText', () => ({
  useUniversalRichText: () => null,
  useTipTapToolbarAdapter: () => ({ state: {}, exec: {} }),
  UniversalRichTextToolbar: () => null,
  UniversalRichTextContent: () => null,
}));
vi.mock('../../components/universal/richText/extensions', () => ({ extensionsRiques: () => [] }));
vi.mock('../../components/universal/DocumentPrintPreview.jsx', () => ({ default: () => null }));

import { PerfilEditor } from './PerfilEditor.jsx';
import { oblidaEntitatDelProjecte } from '../../config/navigation.js';
import { AJUDA_FOTO } from '../../components/universal/enquadrament/useEnquadramentImatge.jsx';
import EN from '../../config/idiomes/en.js';

const org = { id: 'O', mena: 'empresa', nom: 'Forn', rol: 'Membre', dades: { name: 'Forn', visibility: 'public', role: 'owner' } };

beforeEach(() => {
  m.perfil = { identitats: [], autodesament: null, guardarCampPerfil: vi.fn(), pujaMitja: vi.fn(), recarrega: vi.fn() };
  m.llengua = 'en';
});
afterEach(() => { cleanup(); oblidaEntitatDelProjecte(); });

const desplegable = () => document.querySelector('.sdp-editor-document details.sdp-edicio-avancada');
const obriEdicioAvancada = () => {
  fireEvent.click(desplegable().querySelector('summary.sdp-edicio-avancada__resum'));
  return desplegable();
};
const ajudes = (ranura) => [...desplegable().querySelectorAll(`[data-sdp-ranura="${ranura}"] .sdp-camp__ajuda`)].map((p) => p.textContent);

test('en: la ranura del logotip i la de la capçalera diuen els formats admesos en anglés', () => {
  render(<PerfilEditor identitat={org} />);
  obriEdicioAvancada();
  expect(EN['editor.enquadrament.ajudaFoto']).toBe('PNG, JPEG or WebP, up to 10 MB.');
  expect(ajudes('logotip')).toContain(EN['editor.enquadrament.ajudaFoto']);
  expect(ajudes('capcalera')).toContain(EN['editor.enquadrament.ajudaFoto']);
  expect(desplegable().textContent).not.toContain(AJUDA_FOTO);
});

test('ca: el valencià de sempre, lletra per lletra', () => {
  m.llengua = 'ca';
  render(<PerfilEditor identitat={org} />);
  obriEdicioAvancada();
  expect(ajudes('logotip')).toContain(AJUDA_FOTO);
  expect(ajudes('capcalera')).toContain(AJUDA_FOTO);
});
