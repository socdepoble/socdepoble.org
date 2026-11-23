import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';

/* ═══════════════════════════════════════════════════════════════════
   v1.2.23 · IDEA-331 (ordre del Mestre 261123) · costura privacitat del cos
   del Perfil · De punta a punta DES DEL PERFIL: PerfilEditor de veres →
   DocumentEditor de veres → les extensions i l'ordre «/» Imatge de veres →
   compressImage de veres (sobre un canvas fals) → uploadMedia del Perfil
   (pujaMitja, carpeta avatars, organitzacions o agents: l'espai públic).
   El cos de la fitxa conserva de sèrie la ubicació, amb l'avís del Mestre i
   l'interruptor «Amaga el lloc» apagat, en les cinc llengües. I com que puja
   directe a l'espai públic, sense cap promoció que tríe, el fitxer porta la
   MATEIXA tria que la promoció deixa a les Notes (preparaTiffTriat: la
   ubicació i la data), mai la marca, el model, el número de sèrie ni el nom
   de qui té la càmera; l'avís no en promet cap. Si PerfilEditor deixa de
   passar exifTriatEnPujar, la foto pujaria el bloc sencer i esta prova cau
   (la del verificador: «exifTriat false» no el fixava cap prova del Perfil).
   Els mocks de context són els de PerfilEditor.gpsIdentitat.test.jsx.
   ═══════════════════════════════════════════════════════════════════ */

const m = vi.hoisted(() => ({ perfil: null, showToast: null, t: null, extensions: null }));
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
  useUIActions: () => ({ t: m.t }),
  useUIActionsOpcional: () => ({ t: m.t }),
}));
vi.mock('../../components/universal/ContentProvider', () => ({ useContent: () => null }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.showToast }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: () => false,
  getCurrentUser: () => ({ id: 'U' }),
  updateProfile: vi.fn(async (canvis) => ({ id: 'U', ...canvis })),
  updateOrganization: vi.fn(async (id, canvis) => ({ id, ...canvis })),
}));
vi.mock('./PerfilContext.jsx', () => ({ usePerfil: () => m.perfil }));
vi.mock('../../components/universal/richText', () => ({
  useUniversalRichText: () => null,
  useTipTapToolbarAdapter: () => ({ state: {}, exec: {} }),
  UniversalRichTextToolbar: () => null,
  UniversalRichTextContent: () => null,
}));
/* Les extensions de veres: només se'n guarda la crida per a llançar l'ordre «/» Imatge que han configurat. */
vi.mock('../../components/universal/richText/extensions', async (importOriginal) => {
  const real = await importOriginal();
  m.extensions = vi.fn(real.extensionsRiques);
  return { ...real, extensionsRiques: (...args) => m.extensions(...args) };
});
vi.mock('../../components/universal/DocumentPrintPreview.jsx', () => ({ default: () => null }));

import { PerfilEditor } from './PerfilEditor.jsx';
import { createTranslator } from '../../config/i18n.js';
import CA from '../../config/idiomes/ca.js';
import ES from '../../config/idiomes/es.js';
import EN from '../../config/idiomes/en.js';
import EU from '../../config/idiomes/eu.js';
import GL from '../../config/idiomes/gl.js';
import { llegixExif, teExif } from '../../components/universal/enquadrament/exif.js';
import {
  APP0_JFIF, IMATGE, SOI, TIPUS, app1Exif, concatena, dataOriginal, gpsTorre, orientacio, tiff,
} from '../../../tests/helpers/jpegProva.js';
import { oblidaEntitatDelProjecte } from '../../config/navigation.js';
import { cuaDesament } from '../../data/autodesament/cua.js';
import { ambitDe } from '../../data/autodesament/ambit.js';

const DICCIONARIS = Object.freeze({ ca: CA, es: ES, en: EN, eu: EU, gl: GL });
const CONFIG = Object.freeze({ tenantId: '00000000-0000-4000-8000-000000000000' });
const jo = { id: 'jo', mena: 'persona', nom: 'Pep', rol: 'Persona', dades: { id: 'U', full_name: 'Pep', town_name: 'La Torre' } };
const agent = { id: 'A', mena: 'agent', nom: 'IAIA', rol: 'Agent IA', dades: { name: 'IAIA' } };
const org = { id: 'O', mena: 'empresa', nom: 'Forn', rol: 'Membre', dades: { name: 'Forn', visibility: 'public', role: 'owner' } };

/* El que NO ha d'eixir mai a l'espai públic: la marca, el model, el número de sèrie i el nom. */
const CAMERA = Object.freeze(['NIKON', 'D850', '0123456789', 'Pep Garcia']);
const FOTO = concatena(SOI, APP0_JFIF, app1Exif(tiff({
  ifd0: [orientacio(1), { tag: 0x010f, tipus: TIPUS.ASCII, valors: CAMERA[0] }, { tag: 0x0110, tipus: TIPUS.ASCII, valors: CAMERA[1] }],
  exif: [
    ...dataOriginal('2024:06:29 12:00:00', '+02:00'),
    { tag: 0xa430, tipus: TIPUS.ASCII, valors: CAMERA[3] },
    { tag: 0xa431, tipus: TIPUS.ASCII, valors: CAMERA[2] },
  ],
  gps: gpsTorre(),
})), IMATGE);
const SORTIDA_CANVAS = concatena(SOI, APP0_JFIF, IMATGE);

const aBase64 = (bytes) => btoa(String.fromCharCode(...bytes));
function deDataUrl(url) {
  const coma = url.indexOf(',');
  const capcalera = url.slice(0, coma);
  const binari = capcalera.includes(';base64') ? atob(url.slice(coma + 1)) : decodeURIComponent(url.slice(coma + 1));
  return { tipus: /^data:([^;,]*)/.exec(capcalera)?.[1] || '', bytes: Uint8Array.from(binari, (c) => c.charCodeAt(0)) };
}
const bytesDe = (blob) => new Promise((resol, rebutja) => {
  const lector = new FileReader();
  lector.onload = () => resol(new Uint8Array(lector.result));
  lector.onerror = () => rebutja(lector.error);
  lector.readAsArrayBuffer(blob);
});
const conteText = (bytes, text) => {
  const marca = [...text].map((c) => c.charCodeAt(0));
  return bytes.some((_, i) => marca.every((b, k) => bytes[i + k] === b));
};

class ImatgeFalsa {
  constructor() {
    this.width = 0;
    this.height = 0;
  }

  set src(url) {
    this.url = url;
    queueMicrotask(() => {
      this.width = 3000;
      this.height = 2000;
      this.onload?.();
    });
  }

  get src() {
    return this.url;
  }
}

beforeEach(async () => {
  m.t = createTranslator('ca');
  m.showToast = vi.fn();
  m.perfil = {
    identitats: [], guardarCampPerfil: vi.fn(), pujaMitja: vi.fn(async () => '/assets/cos.webp'), recarrega: vi.fn(),
    autodesament: { ambit: ambitDe(CONFIG, 'U'), context: CONFIG },
  };
  await cuaDesament.reinicia();
  vi.stubGlobal('Image', ImatgeFalsa);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ({ clearRect: vi.fn(), drawImage: vi.fn(), fillRect: vi.fn() }));
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation((tipus = 'image/png') => `data:${tipus};base64,${aBase64(SORTIDA_CANVAS)}`);
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    const { tipus, bytes } = deDataUrl(url);
    return { blob: async () => new Blob([bytes], { type: tipus }) };
  }));
});
afterEach(() => {
  cleanup();
  oblidaEntitatDelProjecte();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/* El selector de fitxers del cos: en fer-li click, «tria» la foto. */
function triaRa(fitxer) {
  vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(function tria() {
    Object.defineProperty(this, 'files', { value: [fitxer], configurable: true });
    this.dispatchEvent(new Event('change'));
  });
}
function editorFals() {
  const cadena = { focus: () => cadena, deleteRange: () => cadena, setImage: vi.fn(() => cadena), run: vi.fn(() => true) };
  return { editor: { chain: () => cadena }, cadena };
}

/* Munta la fitxa, llança l'ordre «/» Imatge que han configurat les extensions del Perfil i torna la pregunta oberta. */
async function obriLaPregunta(identitat) {
  render(<PerfilEditor identitat={identitat} />);
  const ordre = m.extensions.mock.results.at(-1).value
    .find((extensio) => extensio.name === 'sdpSlashMenu').options.ordres.find((o) => o.id === 'imatge');
  triaRa(new File([FOTO], 'IMG_2041.jpg', { type: 'image/jpeg' }));
  const { editor, cadena } = editorFals();
  let execucio;
  await act(async () => { execucio = ordre.executa({ editor, range: { from: 1, to: 2 } }); });
  const dialeg = await screen.findByRole('dialog');
  return { dialeg, cadena, execucio };
}
async function insereix({ dialeg, execucio }, dic = CA) {
  await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: dic['editor.imatge.exif.inserir'] })); });
  await act(async () => { await execucio; });
  await waitFor(() => expect(m.perfil.pujaMitja).toHaveBeenCalledTimes(1));
  expect(m.showToast.mock.calls.filter(([, tipus]) => tipus === 'error')).toEqual([]);
  const [fitxer, carpeta] = m.perfil.pujaMitja.mock.calls[0];
  return { bytes: await bytesDe(fitxer), carpeta };
}

describe('IDEA-331 · el cos del Perfil, des de la fitxa: avís i interruptor en cinc llengües', () => {
  test.each(Object.keys(DICCIONARIS))('%s: «Amaga el lloc» apagat i l’avís del Mestre, sense la càmera', async (llengua) => {
    const dic = DICCIONARIS[llengua];
    m.t = createTranslator(llengua);
    const { dialeg, execucio } = await obriLaPregunta(jo);
    const interruptor = within(dialeg).getByRole('switch', {
      name: `${dic['section.xat.adjunts.amagaLloc']} (${dic['section.xat.adjunts.publicaSenseGeolocalitzacio']})`,
    });
    expect(interruptor.checked).toBe(false);
    expect(document.getElementById(interruptor.getAttribute('aria-describedby')).textContent).toBe(dic['editor.enquadrament.ubicacioConservada']);
    fireEvent.click(within(dialeg).getByRole('button', { name: dic['editor.imatge.exif.cancela'] }));
    await act(async () => { await execucio; });
    expect(m.perfil.pujaMitja).not.toHaveBeenCalled();
  });
});

describe('IDEA-331 · el cos del Perfil, des de la fitxa: el fitxer que puja a l’espai públic', () => {
  test.each([['la persona', jo, 'avatars'], ['una organització', org, 'organitzacions'], ['un agent', agent, 'agents']])(
    '%s · «Inserir» de sèrie: la ubicació i la data, mai la càmera, la sèrie ni el nom',
    async (_cas, identitat, carpetaEsperada) => {
      const pregunta = await obriLaPregunta(identitat);
      const { bytes, carpeta } = await insereix(pregunta);
      expect(carpeta).toBe(carpetaEsperada);
      expect(teExif(bytes)).toBe(true);
      expect(llegixExif(bytes, { ambCamera: true })).toMatchObject({
        gps: { lat: 38.5919, lng: -0.4184 }, dataCaptura: '2024-06-29T12:00:00+02:00', camera: null,
      });
      for (const text of CAMERA) expect(conteText(bytes, text), text).toBe(false);
      expect(pregunta.cadena.setImage).toHaveBeenCalledWith(expect.objectContaining({ src: '/assets/cos.webp', lat: '38.5919', lng: '-0.4184', precisio: 'exacta' }));
    },
  );

  test('la persona · amb «Amaga el lloc» (un toc): puja els bytes del canvas, sense EXIF ni GPS', async () => {
    const pregunta = await obriLaPregunta(jo);
    fireEvent.click(within(pregunta.dialeg).getByRole('switch', { name: /Amaga el lloc/ }));
    const { bytes } = await insereix(pregunta);
    expect([...bytes]).toEqual([...SORTIDA_CANVAS]);
    expect(teExif(bytes)).toBe(false);
    expect(llegixExif(bytes).gps).toBeNull();
    expect(pregunta.cadena.setImage).toHaveBeenCalledWith({ src: '/assets/cos.webp', alt: 'IMG_2041.jpg' });
  });
});
