/* T47 · Lent C · Prova de regressió permanent de l'autodesament de la fitxa.
 *
 * El Mestre: «L'H2 s'ha guardat, però el text de l'entradilla s'ha esborrat»
 * en navegar fora del Perfil i tornar-hi. Criteri: com Google Docs, tot el que
 * s'escriu es guarda sol, sense botó i sense pèrdues.
 *
 * L'arbre és el de veres (PerfilProvider + PerfilEditor + DocumentEditor +
 * UniversalEditorShell). Només es fingix el que no és de la fitxa: el servidor
 * (backendPort, amb els CHECK de la migració 2609261500), el motor TipTap del
 * cos, els avisos i el router. «Navegar fora» és desmuntar l'arbre sencer, com
 * fa la ruta /el-meu-perfil (App.jsx: PerfilShell munta PerfilProvider).
 *
 * La prova no fixa COM es desa (IndexedDB, memòria, cua…): només el contracte
 * que la persona veu. Cada cas usa una persona diferent perquè cap esborrany
 * d'un cas contamine l'altre.
 */
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ servidor: null, usuari: null, toast: null }));

/* El servidor fingit aplica els mateixos CHECK que profiles: lema ≤ 256
   (2609281500_lema_entradilla_256.sql, T49) i bio ≤ 500
   (2609261500_identitat_perfil_f1.sql). */
vi.mock('../../data/backendPort.js', async (importOriginal) => {
  const real = await importOriginal();
  const { LIMITS_TEXT } = await import('./perfilCamps.js');
  const viola = (columna, valor) => {
    const limit = LIMITS_TEXT[columna];
    return limit && typeof valor === 'string' && [...valor].length > limit[1];
  };
  return {
    ...real,
    teCapacitat: () => false,
    getCurrentUser: () => m.usuari,
    getProfile: async () => ({ ...m.servidor }),
    listMyOrganizations: async () => [],
    listMyAgents: async () => [],
    updateProfile: async (canvis) => {
      for (const [columna, valor] of Object.entries(canvis || {})) {
        if (viola(columna, valor)) {
          throw new Error(`Supabase 400: {"code":"23514","message":"new row for relation \\"profiles\\" violates check constraint \\"profiles_${columna}_llargaria\\""}`);
        }
      }
      Object.assign(m.servidor, canvis);
      return { ...m.servidor };
    },
    resolveAsset: async (ref) => ref,
  };
});
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: m.usuari, generacio: 1 }) }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.toast }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_clau, text) => text, normalizeSearchText: (s) => s }),
  useUIState: () => ({ locale: 'ca', externalConfig: {} }),
  useUI: () => ({ externalConfig: {} }),
}));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
/* El cos (TipTap) no entra en joc: el defecte és de l'H2 i l'entradilla. */
vi.mock('../../components/universal/richText', () => ({
  useUniversalRichText: () => null,
  useTipTapToolbarAdapter: () => ({ state: {}, exec: {} }),
  UniversalRichTextToolbar: () => <div className="sdp-editor-tools" />,
  UniversalRichTextContent: () => <div data-testid="cos" />,
}));
vi.mock('../../components/universal/richText/extensions', () => ({ extensionsRiques: () => [] }));
vi.mock('../../sections/notes/NotesSection.jsx', () => ({ LLAVOR_NOTA: '<p>Llavor</p>' }));
/* Fora del que es prova (i en obres per un altre torn). */
vi.mock('../../components/universal/DocumentPrintPreview.jsx', () => ({ default: () => null }));

import { PerfilProvider, usePerfil } from './PerfilContext.jsx';
import { PerfilEditor } from './PerfilEditor.jsx';
import { LIMITS_TEXT } from './perfilCamps.js';

/* Tenant sintètic en forma d'UUID: backendScope (backendConfig.js) en rebutja qualsevol altre. */
const CONFIG = Object.freeze({ tenantId: '00000000-0000-4000-8000-00000000a7e5', dataMode: 'remote' });
const MAXIM_LEMA = LIMITS_TEXT.lema[1];
/* Una entradilla «llarga» és la que passa del límit de la columna, siga quin siga. */
const ENTRADILLA_LLARGA = 'Pedra seca i trellat al Comtat, on cada marge conta una historia vella. '
  .repeat(6).slice(0, MAXIM_LEMA + 30).trim();
const BIO_NOVA = 'Llauradora de secà i guardiana de marges';
const ENTRADILLA_CURTA = 'Del Comtat i de la Foia';

/* Com PerfilShell.renderDetail: la fitxa de la persona quan el perfil ja és llegit. */
function Fitxa() {
  const { identitats, carregant } = usePerfil();
  if (carregant) return null;
  const persona = identitats.find((identitat) => identitat.mena === 'persona');
  return persona ? <PerfilEditor key={persona.id} identitat={persona} /> : null;
}

async function obriFitxa() {
  const vista = render(<PerfilProvider config={CONFIG}><Fitxa /></PerfilProvider>);
  await waitFor(() => expect(document.querySelector('.editor-lead-input')).not.toBeNull());
  return vista;
}

const camp = (selector) => document.querySelector(selector);

/* Una tecla: el navegador ja ha escrit al DOM quan arriba l'«input». */
function escriu(element, text) {
  fireEvent.focus(element);
  element.textContent = text;
  fireEvent.input(element);
}

beforeEach(() => {
  m.toast = vi.fn();
});
afterEach(cleanup);

test('T47 · l’entradilla més llarga que el límit no es perd en eixir del Perfil i tornar-hi (l’H2 sí que arriba)', async () => {
  m.usuari = { id: 'persona-lentc-1' };
  m.servidor = { id: m.usuari.id, full_name: 'Pepa', bio: 'Llauradora', lema: 'Del Comtat', presentacio_html: '', is_public: false };
  expect([...ENTRADILLA_LLARGA].length).toBeGreaterThan(MAXIM_LEMA);

  const abans = await obriFitxa();
  escriu(camp('.editor-subtitle-input'), BIO_NOVA);
  fireEvent.blur(camp('.editor-subtitle-input'));
  escriu(camp('.editor-lead-input'), ENTRADILLA_LLARGA);
  fireEvent.blur(camp('.editor-lead-input'));
  // El que el Mestre va vore: l'H2 arriba al servidor.
  await waitFor(() => expect(m.servidor.bio).toBe(BIO_NOVA), { timeout: 3000 });

  abans.unmount(); // navegar a una altra secció
  await obriFitxa(); // tornar al Perfil

  // Contracte: el text escrit continua on la persona el va deixar…
  expect(camp('.editor-lead-input').textContent.trim()).toBe(ENTRADILLA_LLARGA);
  // …i la raó per la qual encara no és al servidor es veu en línia, no en un avís efímer.
  const alertes = screen.queryAllByRole('alert').map((el) => el.textContent);
  expect(alertes.some((text) => text.includes(String(MAXIM_LEMA)))).toBe(true);
});

test('T47 · el que s’escriu a l’entradilla arriba al servidor encara que la fitxa es desmunte sense blur', async () => {
  /* Tornar arrere amb el navegador, el gest de lliscar o una drecera de teclat
     desmunten la ruta sense blur: només queda el desat pendent del debounce, el
     mateix camí que fa servir el cos (TipTap no desa en perdre el focus). */
  m.usuari = { id: 'persona-lentc-2' };
  m.servidor = { id: m.usuari.id, full_name: 'Pep', bio: 'Pastor', lema: 'De la Serra', presentacio_html: '', is_public: false };

  const abans = await obriFitxa();
  escriu(camp('.editor-lead-input'), ENTRADILLA_CURTA);
  abans.unmount();

  await waitFor(() => expect(m.servidor.lema).toBe(ENTRADILLA_CURTA), { timeout: 3000 });
  await obriFitxa();
  expect(camp('.editor-lead-input').textContent.trim()).toBe(ENTRADILLA_CURTA);
});
