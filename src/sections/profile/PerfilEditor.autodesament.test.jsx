import React from 'react';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* ═══════════════════════════════════════════════════════════════════
   T47 · AUTODESAMENT DEL PERFIL, DE PUNTA A PUNTA (lent A)

   El Mestre: «L'H2 s'ha guardat, però el text de l'entradilla s'ha
   esborrat» en anar-se'n i tornar. Criteri: com Google Docs, el que
   s'escriu no es perd mai.

   Ací no es mocka cap peça de la cadena de desat: EditableField →
   UniversalEditorShell (debounce, blur, desmuntatge) → DocumentEditor →
   PerfilEditor.saveRemote → PerfilContext.guardarCampPerfil → port.
   Només es mocka el port, amb el mateix magatzem que fa de servidor en
   mode seed (localPerfils, el mode de .env.local) i els CHECK de la
   base de dades remota. Fora queden el router, els avisos, TipTap i les
   peces que no desen res.

   «Eixir i tornar» és el que fa App.jsx:680: la ruta el-meu-perfil
   desmunta PerfilShell sencer (i el seu PerfilProvider) i, en tornar,
   el torna a muntar i a llegir del servidor. «Canviar d'apartat» és
   PerfilShell.jsx:74: el PerfilProvider viu i PerfilEditor es remunta.
   ═══════════════════════════════════════════════════════════════════ */

const m = vi.hoisted(() => ({
  user: { id: 'U-t47', email: 'pep@poble.test', user_metadata: { full_name: 'Pep' } },
  servidor: null,
  toast: null,
  pausaMetadades: null,
}));

vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => () => {}, Link: 'a', useLocation: () => ({ pathname: '/el-meu-perfil' }),
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: (...args) => m.toast?.(...args) }),
}));
vi.mock('../../config/assetResolver', () => ({ resolveAsset: (uri) => uri }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, text) => text }) }));
vi.mock('../../components/universal/richText', () => ({
  useUniversalRichText: () => null,
  useTipTapToolbarAdapter: () => ({ state: {}, exec: {} }),
  UniversalRichTextToolbar: () => null,
  UniversalRichTextContent: () => null,
}));
vi.mock('../../components/universal/richText/extensions', () => ({ extensionsRiques: () => [] }));
vi.mock('../notes/NotesSection.jsx', () => ({ LLAVOR_NOTA: '<p>llavor</p>' }));
vi.mock('../../components/universal/DocumentPrintPreview.jsx', () => ({ default: () => null }));
vi.mock('./SelectorIdentitat.jsx', () => ({ SelectorIdentitat: () => null }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSession: () => ({ currentUser: m.user, generacio: 1 }) }));
/* La sessió no canvia en cap prova: capturaSessio no avorta mai. */
vi.mock('../../data/identitat.js', () => ({ versioSessio: 1, entradaSessio: () => 1, capturaSessio: () => () => {} }));
vi.mock('../../data/backendPort.js', () => ({
  getCurrentUser: () => m.user,
  teCapacitat: () => true,
  getProfile: (...args) => m.servidor.getProfile(...args),
  updateProfile: (...args) => m.servidor.updateProfile(...args),
  listMyOrganizations: async () => [],
  listMyAgents: async () => [],
  updateOrganization: async () => { throw new Error('Fora de la lent A.'); },
  updateAgent: async () => { throw new Error('Fora de la lent A.'); },
  updateUserPassword: async () => {},
  uploadToStorage: async () => ({ url: '' }),
  resolveAsset: async (ref) => ref,
  createOrganization: async () => { throw new Error('Fora de la lent A.'); },
}));

import { createLocalPerfilsAdapter } from '../../data/localPerfils.js';
import { sanitizeHtml } from '../../utils/sanitize.js';
import { aHtml } from './perfilCamps.js';
import { PerfilProvider, usePerfil } from './PerfilContext.jsx';
import { PerfilEditor } from './PerfilEditor.jsx';

/* Els CHECK de profiles a la base de dades remota:
   supabase/migrations/2609261500_identitat_perfil_f1.sql:41 (lema) i :78 (bio).
   Si una migració els canvia, canvieu-los ací: el servidor de mentida ha de
   rebutjar el mateix que el de veres. */
const CHECK_BD = Object.freeze({ lema: 120, bio: 500 });
/* Columnes que updateProfile remot copia a user_metadata amb un PUT a GoTrue
   DESPRÉS del PATCH (src/data/supabase/auth.js:165 i :211-222). */
const METADADES = new Set(['full_name', 'avatar_url', 'visibility', 'town_name', 'bio', 'is_public']);

const deferred = () => { let resolve; const promise = new Promise((r) => { resolve = r; }); return { promise, resolve }; };

function creaServidor() {
  const bd = createLocalPerfilsAdapter();
  return {
    getProfile: async () => bd.getProfile(m.user),
    updateProfile: async (updates) => {
      for (const [columna, maxim] of Object.entries(CHECK_BD)) {
        if (typeof updates?.[columna] === 'string' && [...updates[columna]].length > maxim) {
          throw new Error(`Supabase 400: {"code":"23514","message":"new row for relation \\"profiles\\" violates check constraint \\"profiles_${columna}_llargaria\\""}`);
        }
      }
      /* El PATCH confirma ací: la fila tornada és la d'este moment. */
      const fila = bd.updateProfile(m.user, updates);
      /* Amb camps de user_metadata, updateProfile encara espera el PUT de GoTrue. */
      const pausa = m.pausaMetadades;
      if (pausa && Object.keys(updates || {}).some((k) => METADADES.has(k))) await pausa.promise;
      return fila;
    },
  };
}

const CONFIG = Object.freeze({});

function Fitxa({ apartat }) {
  const { identitats, carregant, error } = usePerfil();
  if (carregant) return <p role="status">Carregant el teu perfil…</p>;
  if (error) return <p role="alert">{error}</p>;
  const jo = identitats.find((i) => i.id === 'jo');
  return apartat === 'fitxa' ? <PerfilEditor key={jo.id} identitat={jo} /> : <p>El compte</p>;
}

function App({ ruta = 'perfil', apartat = 'fitxa' }) {
  if (ruta !== 'perfil') return <main>El Mur</main>;
  return (
    <PerfilProvider config={CONFIG}>
      <Fitxa apartat={apartat} />
    </PerfilProvider>
  );
}

const camp = (nom) => document.querySelector(`.editor-${nom}-input`);

async function obri() {
  const vista = render(<App />);
  await waitFor(() => expect(camp('lead')).not.toBeNull());
  return vista;
}

/* Una tecla: el navegador ja ha escrit al DOM quan arriba l'«input».
   Passa pel sanejador per complir la porta tractor-innerhtml. */
function escriu(nom, text) {
  const el = camp(nom);
  fireEvent.focus(el);
  el.innerHTML = sanitizeHtml(aHtml(text));
  fireEvent.input(el);
}
const ix = (nom) => fireEvent.blur(camp(nom));

async function eixIRetorna(vista) {
  await act(async () => { vista.rerender(<App ruta="mur" />); });
  await act(async () => { vista.rerender(<App ruta="perfil" />); });
  await waitFor(() => expect(camp('lead')).not.toBeNull());
}

const avisos = () => JSON.stringify(m.toast.mock.calls);

/* 183 caràcters: una entradilla normal, d'una o dues frases. */
const ENTRADILLA = 'Visc a la Torre de les Maçanes des de sempre. Cultive tomaques de penjar, ajude a l’associació de veïns i crec que el poble té futur si el fem entre tots, amb trellat i sense presses.';

beforeEach(() => {
  m.servidor = creaServidor();
  m.toast = vi.fn();
  m.pausaMetadades = null;
});
afterEach(cleanup);

test('control · una H2 curta, eixida amb blur, sobreviu a eixir de la ruta i tornar', async () => {
  const vista = await obri();
  await act(async () => { escriu('subtitle', 'Llaurador de la Torre'); ix('subtitle'); });
  await eixIRetorna(vista);
  expect(camp('subtitle').textContent).toBe('Llaurador de la Torre');
});

test('T47 · el cas del Mestre: l’H2 es guarda, i una entradilla llarga tampoc no es pot perdre en eixir i tornar', async () => {
  expect([...ENTRADILLA].length).toBeGreaterThan(CHECK_BD.lema);
  const vista = await obri();
  await act(async () => { escriu('subtitle', 'Llaurador'); ix('subtitle'); });
  await act(async () => { escriu('lead', ENTRADILLA); ix('lead'); });
  await eixIRetorna(vista);
  expect(camp('subtitle').textContent).toBe('Llaurador');
  expect(camp('lead').textContent, `avisos: ${avisos()}`).toBe(ENTRADILLA);
});

test('control · sense blur, canviar d’apartat (el PerfilProvider viu) sí que buida la cua i desa', async () => {
  const vista = await obri();
  await act(async () => { escriu('lead', 'Del Mas de Baix'); });
  await act(async () => { vista.rerender(<App apartat="compte" />); });
  await act(async () => { vista.rerender(<App apartat="fitxa" />); });
  expect(camp('lead').textContent).toBe('Del Mas de Baix');
});

test('T47 · el que encara esperava el debounce (800 ms) no es perd si la ruta es desmunta sense blur', async () => {
  /* Sense blur: gest d'enrere del trackpad, botó enrere del navegador o una drecera
     de teclat. El Perfil sencer es desmunta abans que la closca buide la cua. */
  const vista = await obri();
  await act(async () => { escriu('lead', 'Del Mas de Baix'); });
  await eixIRetorna(vista);
  expect(camp('lead').textContent, `avisos: ${avisos()}`).toBe('Del Mas de Baix');
});

test('T47 · la resposta tardana de l’H2 (PATCH i després PUT de GoTrue) no torna l’entradilla desada al valor d’abans', async () => {
  const vista = await obri();
  m.pausaMetadades = deferred();
  /* A: el PATCH de bio confirma de seguida; el PUT de user_metadata s'endarrereix. */
  await act(async () => { escriu('subtitle', 'Llaurador'); ix('subtitle'); });
  /* B: lema no va a user_metadata; el seu PATCH respon abans que A. */
  await act(async () => { escriu('lead', 'Del Mas de Baix'); ix('lead'); });
  await act(async () => { m.pausaMetadades.resolve(); });
  /* El servidor ho té tot: el defecte és de l'estat del client. */
  expect(await m.servidor.getProfile()).toMatchObject({ bio: 'Llaurador', lema: 'Del Mas de Baix' });
  /* «El compte» i tornar a «La fitxa»: el PerfilProvider viu, PerfilEditor es remunta. */
  await act(async () => { vista.rerender(<App apartat="compte" />); });
  await act(async () => { vista.rerender(<App apartat="fitxa" />); });
  expect(camp('lead').textContent).toBe('Del Mas de Baix');
});
