import React from 'react';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* P0-58 (IDEA-189) · L'enganxat pla d'una línia als camps de la capçalera
   també val per a la fitxa del Perfil (nom, H2 i lema), de punta a punta:
   EditableField → UniversalEditorShell → DocumentEditor → PerfilEditor →
   PerfilContext → port. Només es mocka el port (amb el magatzem del mode
   seed) i les peces que no desen res, com PerfilEditor.autodesament.test.jsx.
   El comptador (T47) es mou amb el que s'enganxa, el lema que viatja és text
   pla i el Perfil no reparteix res (no porta «Proposa Card»). Dades
   sintètiques. */

const m = vi.hoisted(() => ({
  user: { id: 'U-p058', email: 'pep@poble.test', user_metadata: { full_name: 'Pep' } },
  servidor: null,
  toast: null,
}));

vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => () => {}, Link: 'a', useLocation: () => ({ pathname: '/el-meu-perfil' }),
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: (...args) => m.toast?.(...args) }),
}));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, text) => text }) }));
vi.mock('../../components/universal/richText', () => ({
  useUniversalRichText: () => null,
  useTipTapToolbarAdapter: () => ({ state: {}, exec: {} }),
  UniversalRichTextToolbar: () => null,
  UniversalRichTextContent: () => null,
}));
vi.mock('../../components/universal/richText/extensions', () => ({ extensionsRiques: () => [] }));
vi.mock('../../components/universal/DocumentPrintPreview.jsx', () => ({ default: () => null }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: m.user, generacio: 1 }) }));
vi.mock('../../data/identitat.js', () => ({ versioSessio: 1, entradaSessio: () => 1, capturaSessio: () => () => {} }));
vi.mock('../../data/backendPort.js', () => ({
  getCurrentUser: () => m.user,
  teCapacitat: () => true,
  getProfile: (...args) => m.servidor.getProfile(...args),
  updateProfile: (...args) => m.servidor.updateProfile(...args),
  listMyOrganizations: async () => [],
  listMyAgents: async () => [],
  updateOrganization: async () => { throw new Error('Fora d’esta prova.'); },
  updateAgent: async () => { throw new Error('Fora d’esta prova.'); },
  updateUserPassword: async () => {},
  uploadToStorage: async () => ({ url: '' }),
  resolveAsset: async (ref) => ref,
  createOrganization: async () => { throw new Error('Fora d’esta prova.'); },
}));

import { createLocalPerfilsAdapter } from '../../data/localPerfils.js';
import { PerfilProvider, usePerfil } from './PerfilContext.jsx';
import { PerfilEditor } from './PerfilEditor.jsx';

function creaServidor() {
  const bd = createLocalPerfilsAdapter();
  return {
    getProfile: async () => bd.getProfile(m.user),
    updateProfile: async (updates) => bd.updateProfile(m.user, updates),
  };
}

function Fitxa() {
  const { identitats, carregant, error } = usePerfil();
  if (carregant) return <p role="status">Carregant el teu perfil…</p>;
  if (error) return <p role="alert">{error}</p>;
  const jo = identitats.find((i) => i.id === 'jo');
  return <PerfilEditor key={jo.id} identitat={jo} />;
}

const camp = (nom) => document.querySelector(`.editor-${nom}-input`);
const portaretalls = ({ html = '', text = '' } = {}) => ({
  getData: (tipus) => (tipus === 'text/html' ? html : tipus === 'text/plain' ? text : ''),
});
/* La persona selecciona tot el camp (la fitxa de llavor ja porta text) i hi enganxa. */
function enganxaDamunt(el, dades) {
  fireEvent.focus(el);
  const rang = document.createRange();
  rang.selectNodeContents(el);
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(rang);
  fireEvent.paste(el, { clipboardData: portaretalls(dades) });
}

async function obri() {
  const vista = render(<PerfilProvider config={{}}><Fitxa /></PerfilProvider>);
  await waitFor(() => expect(camp('lead')).not.toBeNull());
  return vista;
}

/* 183 caràcters, dues vegades: passa del límit del lema (256). */
const ENTRADILLA = 'Visc a la Torre de les Maçanes des de sempre. Cultive tomaques de penjar, ajude a l’associació de veïns i crec que el poble té futur si el fem entre tots, amb trellat i sense presses.';

beforeEach(() => {
  m.servidor = creaServidor();
  m.toast = vi.fn();
});
afterEach(cleanup);

test('el comptador del lema es mou amb el que s’enganxa (text pla d’una línia, sense etiquetes)', async () => {
  await obri();
  expect(document.querySelector('.sdp-avis-camp__comptador')).toBeNull();
  const html = `<p><strong>${ENTRADILLA}</strong></p><p><code>${ENTRADILLA}</code></p>`;
  await act(async () => { enganxaDamunt(camp('lead'), { html }); });
  const esperat = `${ENTRADILLA} ${ENTRADILLA}`;
  expect(camp('lead').textContent).toBe(esperat);
  expect(camp('lead').querySelector('*')).toBeNull();
  expect(document.querySelector('.sdp-avis-camp__comptador').textContent).toBe(`Entradilla: ${[...esperat].length} de 256 caràcters`);
});

test('el lema enganxat viatja al servidor com a text pla (en eixir del camp)', async () => {
  const updateProfile = vi.spyOn(m.servidor, 'updateProfile');
  await obri();
  await act(async () => {
    enganxaDamunt(camp('subtitle'), { html: '<p><span style="color:red">Llaurador</span><br>de la <code>Torre</code></p>' });
    fireEvent.blur(camp('subtitle'));
  });
  await waitFor(() => expect(updateProfile.mock.calls.some(([canvis]) => canvis?.bio === 'Llaurador de la Torre')).toBe(true));
  expect(JSON.stringify(updateProfile.mock.calls)).not.toMatch(/<code>|<span|<br/);
});

test('el Perfil no reparteix: un document enganxat al nom buit entra d’una línia', async () => {
  await obri();
  const nom = camp('title');
  const subtitol = camp('subtitle').textContent;
  const entradilla = camp('lead').textContent;
  await act(async () => {
    fireEvent.focus(nom);
    // La persona buida el nom i hi enganxa un document sencer.
    nom.replaceChildren();
    fireEvent.input(nom);
    fireEvent.paste(nom, { clipboardData: portaretalls({ html: '<p>Pep</p><p>Llaurador</p><p>De la Torre.</p>' }) });
  });
  expect(nom.textContent).toBe('Pep Llaurador De la Torre.');
  expect([camp('subtitle').textContent, camp('lead').textContent]).toEqual([subtitol, entradilla]);
});
