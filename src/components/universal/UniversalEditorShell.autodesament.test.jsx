import React from 'react';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* T47 · LENT B (la closca i la navegació) · prova de regressió permanent.

   El Mestre: «L'H2 s'ha guardat, però el text de l'entradilla s'ha esborrat»
   en navegar fora del Perfil i tornar. Ací es munta la cadena real
   PerfilProvider → PerfilEditor → DocumentEditor → UniversalEditorShell (i el
   useUniversalRichText de veres), amb un servidor de mentides en memòria, i es
   canvia de «ruta» com fa Routes: el PerfilShell sencer (proveïdor inclòs) es
   desmunta. O d'apartat, com la columna 2: només es desmunta la fitxa.

   Criteri d'acceptació (Google Docs): el que s'ha escrit, en tornar, hi és. */

const m = vi.hoisted(() => ({ servidor: null, toast: null, editor: null, retard: null }));

vi.mock('../../app/contexts/SessionContext.jsx', async (importOriginal) => ({
  ...(await importOriginal()),
  useSession: () => ({ currentUser: { id: 'u1' } }),
}));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  getCurrentUser: () => ({ id: 'u1', email: 'pep@poble.test' }),
  getProfile: async () => ({ ...m.servidor }),
  listMyOrganizations: async () => [],
  listMyAgents: async () => [],
  /* El PATCH de profiles (return=representation): el servidor aplica el canvi
     en arribar i torna la fila SENCERA tal com era en eixe moment. Amb
     `m.retard`, la resposta viatja quan la prova ho diu. */
  updateProfile: async (canvis) => {
    Object.assign(m.servidor, canvis);
    const fila = { ...m.servidor };
    return m.retard ? m.retard(fila) : fila;
  },
  teCapacitat: () => false,
  resolveAsset: async (ref) => ref,
}));
vi.mock('../../app/contexts/UIContext', async (importOriginal) => ({
  ...(await importOriginal()),
  useUIActions: () => ({ t: (_clau, text) => text }),
}));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('../../config/assetResolver.js', () => ({ resolveAsset: (uri) => uri }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: (...args) => m.toast(...args) }) }));
/* Peces alienes a l'autodesament (i algunes en obres d'altres torns): fora. */
vi.mock('../../sections/profile/SelectorIdentitat.jsx', () => ({ SelectorIdentitat: () => null }));
vi.mock('../../sections/notes/NotesSection.jsx', () => ({ LLAVOR_NOTA: '<p>Llavor</p>' }));
vi.mock('./DocumentPrintPreview.jsx', () => ({ default: () => null }));
vi.mock('./CopyrightSelector.jsx', () => ({ default: () => null }));
vi.mock('./richText/extensions', () => ({ extensionsRiques: () => [] }));
/* El motor TipTap és el de veres (useUniversalRichText amb debounce de 800 ms):
   només es captura la instància per a escriure al cos, i fora la barra d'eines. */
vi.mock('./richText', async (importOriginal) => ({
  ...(await importOriginal()),
  useTipTapToolbarAdapter: (editor) => { m.editor = editor; return { state: {}, exec: {} }; },
  UniversalRichTextToolbar: () => null,
}));

import { PerfilProvider, usePerfil } from '../../sections/profile/PerfilContext.jsx';
import { PerfilEditor } from '../../sections/profile/PerfilEditor.jsx';
import { sanitizeHtml } from '../../utils/sanitize.js';

const CONFIG = Object.freeze({ tenantId: 'poble-proves' });

function Fitxa() {
  const { identitats, carregant } = usePerfil();
  if (carregant) return <p>Carregant el teu perfil…</p>;
  const jo = identitats.find((identitat) => identitat.id === 'jo');
  return <PerfilEditor key={jo.id} identitat={jo} />;
}

/* Com App.jsx i PerfilShell: la ruta /el-meu-perfil porta el PerfilProvider a
   dins (canviar de ruta el desmunta sencer); dins, la columna 2 tria l'apartat
   (canviar d'apartat només desmunta la fitxa). */
function App({ ruta = 'perfil', apartat = 'fitxa' }) {
  if (ruta !== 'perfil') return <p>Mur</p>;
  return (
    <PerfilProvider config={CONFIG}>
      {apartat === 'fitxa' ? <Fitxa /> : <p>El compte</p>}
    </PerfilProvider>
  );
}

/* Una tecla: el navegador ja ha escrit al DOM quan arriba l'«input». Passa pel
   sanejador per complir la porta tractor-innerhtml (també als tests). */
function tecleja(camp, html) {
  camp.innerHTML = sanitizeHtml(html);
  fireEvent.input(camp);
}

const espera = (vista, selector) => waitFor(() => {
  const element = vista.container.querySelector(selector);
  if (!element) throw new Error(`Encara no hi ha ${selector}`);
  return element;
});

/* Deixa córrer les promeses pendents (els PATCH del servidor de mentides). */
const buidaMicrotasques = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });

beforeEach(() => {
  m.servidor = { id: 'u1', full_name: 'Pep', bio: '', lema: '', presentacio_html: '', is_public: false, town_name: 'La Torre' };
  m.toast = vi.fn();
  m.editor = null;
  m.retard = null;
});
afterEach(cleanup);

test('T47 · l’entradilla escrita just abans d’anar-se’n hi és en tornar (l’H2 ja es desava)', async () => {
  const vista = render(<App />);

  // L'H2: s'escriu i s'ix del camp cap a l'entradilla (Tab o clic). El blur el desa.
  const h2 = await espera(vista, '.editor-subtitle-input');
  fireEvent.focus(h2);
  tecleja(h2, 'Llaurador de secà');
  fireEvent.blur(h2);
  await buidaMicrotasques();
  expect(m.servidor.bio).toBe('Llaurador de secà');

  // L'entradilla: s'escriu i, abans de 800 ms i sense cap blur que arribe a React,
  // la ruta canvia (enrere del navegador, drecera de teclat o navegació
  // programada). En un desmuntatge React té el sistema d'esdeveniments apagat
  // durant el commit: el blur que el navegador puga disparar no arriba a onBlur.
  // Només queda el flush de desmuntatge de la closca.
  const entradilla = vista.container.querySelector('.editor-lead-input');
  fireEvent.focus(entradilla);
  tecleja(entradilla, 'Del Mas de la Torre, on el secà encara parla.');
  vista.rerender(<App ruta="mur" />);
  await buidaMicrotasques();

  // Tornar a la fitxa.
  vista.rerender(<App />);
  const h2Tornada = await espera(vista, '.editor-subtitle-input');
  expect(h2Tornada.textContent).toBe('Llaurador de secà');
  expect(vista.container.querySelector('.editor-lead-input').textContent)
    .toBe('Del Mas de la Torre, on el secà encara parla.');
});

test('T47 · el cos escrit just abans d’eixir amb un clic tampoc es perd', async () => {
  const vista = render(<App />);
  await espera(vista, '.editor-lead-input');
  await waitFor(() => expect(m.editor).toBeTruthy());

  // El cos (TipTap) no desa en perdre el focus: només al cap de 800 ms o en
  // desmuntar-se. Un clic a un enllaç del rail abans de 800 ms desmunta la ruta.
  act(() => { m.editor.commands.insertContent('Presentació del Mas'); });
  vista.rerender(<App ruta="mur" />);
  await buidaMicrotasques();

  expect(m.servidor.presentacio_html).toContain('Presentació del Mas');
});

test('T47 · la resposta tardana del desat de l’H2 no esborra l’entradilla ja desada', async () => {
  const respostes = [];
  m.retard = (fila) => new Promise((resolve) => respostes.push(() => resolve(fila)));
  const vista = render(<App />);

  // Dos camps seguits, dos PATCH en vol: A (bio) i després B (lema).
  const h2 = await espera(vista, '.editor-subtitle-input');
  fireEvent.focus(h2); tecleja(h2, 'Llaurador'); fireEvent.blur(h2);
  const entradilla = vista.container.querySelector('.editor-lead-input');
  fireEvent.focus(entradilla); tecleja(entradilla, 'Del Mas'); fireEvent.blur(entradilla);
  await buidaMicrotasques();
  expect(respostes).toHaveLength(2);
  expect(m.servidor).toMatchObject({ bio: 'Llaurador', lema: 'Del Mas' });

  // Les respostes tornen desordenades: primer B, després A, que porta la fila
  // d'abans de B (lema buit). No cal mala sort de xarxa: en remot, bio fa dos
  // viatges (PATCH i PUT de GoTrue, src/data/supabase/auth.js:211-221) i lema
  // només un; A es resol per força després de B si B ix abans que acabe el PUT.
  await act(async () => { respostes[1](); });
  await act(async () => { respostes[0](); });

  // «El compte» i tornar a «La fitxa»: el servidor té les dues coses.
  vista.rerender(<App apartat="compte" />);
  vista.rerender(<App />);
  await espera(vista, '.editor-lead-input');
  expect(vista.container.querySelector('.editor-subtitle-input').textContent).toBe('Llaurador');
  expect(vista.container.querySelector('.editor-lead-input').textContent).toBe('Del Mas');
});
