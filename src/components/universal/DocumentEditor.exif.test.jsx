/* P1-64 (pla 261028_1526 §3.1.1; Mestre 261028, decisió 8) · El diàleg menut
   de DocumentEditor per a l'EXIF d'una foto del cos (l'ordre «/» Imatge li
   passa demanaExif): la casella «Conserva la ubicació i la data de la foto»,
   marcada de sèrie, les píndoles de la precisió (l'exacta de sèrie) i
   «Inserir». Tancat, cap node al DOM. TipTap i les extensions són els de
   veres; només es captura la crida a extensionsRiques. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({ extensions: null }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, text) => text }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
vi.mock('./richText', async (importOriginal) => ({
  ...(await importOriginal()),
  useTipTapToolbarAdapter: () => ({ state: {}, exec: {} }),
  UniversalRichTextToolbar: () => null,
}));
vi.mock('./richText/extensions', async (importOriginal) => {
  const real = await importOriginal();
  m.extensions = vi.fn(real.extensionsRiques);
  return { ...real, extensionsRiques: (...args) => m.extensions(...args) };
});
import { DocumentEditor } from './DocumentEditor.jsx';
import { ETIQUETA_CONSERVA_EXIF, exifPublicable } from './enquadrament/exifIncrustat.js';
import { dataOriginal, gpsTorre, jpegAmbExif } from '../../../tests/helpers/jpegProva.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  m.extensions.mockClear();
});

const DOC = Object.freeze({ id: 'd1', title: 'Títol', subtitle: '', lead: '', content: '<p>Hola</p>', formattedDate: '01/01/26', formattedTime: '10:00' });
/* Revisió adversarial 261028 · La pregunta és opt-in: només el cos d'una publicació (fotosDePublicacio). */
const adaptador = (extra = { fotosDePublicacio: true }) => ({ document: DOC, labels: [], seedContent: null, updateLocal: vi.fn(), saveRemote: vi.fn(), ...extra });
const pinta = (extra) => render(<DocumentEditor adapter={adaptador(extra)} />);
const demanaExif = () => m.extensions.mock.calls.at(-1)[0].demanaExif;
const foto = () => new File([jpegAmbExif({ exif: dataOriginal('2017:05:14 10:22:33'), gps: gpsTorre() })], 'font.jpg', { type: 'image/jpeg' });
const TITOL = { name: 'Esta foto porta la seua ubicació o la data' };

/* Torna { resposta }: una promesa tornada tal qual des d'una funció async s'esperaria ací mateix. */
async function pregunta() {
  const original = foto();
  const exif = await exifPublicable(original);
  let resposta;
  await act(async () => { resposta = demanaExif()(original, exif); });
  return { resposta };
}

test('tancat, cap diàleg; demanaExif és estable entre renders', () => {
  const vista = pinta();
  expect(screen.queryByRole('dialog', TITOL)).toBeNull();
  const primera = demanaExif();
  vista.rerender(<DocumentEditor adapter={adaptador()} />);
  expect(demanaExif()).toBe(primera);
});

/* Revisió adversarial 261028 (bloquejant) · El text del Perfil (identitat) i el
   catàleg no porten la clau: l'ordre «/» Imatge no rep cap demanaExif i la foto
   del cos entra neta, com abans de P1-64. Només true l'activa. */
test.each([['sense la clau', {}], ['false', { fotosDePublicacio: false }], ['un valor que no és true', { fotosDePublicacio: 'si' }]])(
  'fotosDePublicacio %s: la crida de sempre a les extensions, sense demanaExif ni diàleg',
  (_cas, extra) => {
    pinta(extra);
    const [opcions] = m.extensions.mock.calls.at(-1);
    expect(opcions).toEqual({ onImageUpload: undefined, ambTargetes: false, onToast: expect.any(Function) });
    expect(Object.hasOwn(opcions, 'demanaExif')).toBe(false);
    expect(screen.queryByRole('dialog', TITOL)).toBeNull();
  },
);

test('la pregunta: la casella marcada, l’exacta de sèrie; «Inserir» resol amb la tria i tanca', async () => {
  pinta();
  const { resposta } = await pregunta();
  const dialeg = screen.getByRole('dialog', TITOL);
  expect(within(dialeg).getByRole('checkbox', { name: new RegExp(ETIQUETA_CONSERVA_EXIF) }).checked).toBe(true);
  expect(within(dialeg).getByRole('radio', { name: 'Exacta' }).checked).toBe(true);
  fireEvent.click(within(dialeg).getByRole('radio', { name: 'Uns 100 m' }));
  await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Inserir' })); });
  await expect(resposta).resolves.toEqual({ conserva: true, precisio: '100m' });
  expect(screen.queryByRole('dialog', TITOL)).toBeNull();
});

test('desmarcada, «Inserir» resol { conserva: false }; Cancel·lar resol null', async () => {
  pinta();
  let { resposta } = await pregunta();
  fireEvent.click(screen.getByRole('checkbox', { name: new RegExp(ETIQUETA_CONSERVA_EXIF) }));
  expect(screen.queryByRole('radiogroup', { name: 'Precisió de la ubicació' })).toBeNull();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Inserir' })); });
  await expect(resposta).resolves.toEqual({ conserva: false, precisio: 'exacta' });
  ({ resposta } = await pregunta());
  await act(async () => { fireEvent.click(within(screen.getByRole('dialog', TITOL)).getByRole('button', { name: 'Cancel·lar' })); });
  await expect(resposta).resolves.toBeNull();
});

test('si l’editor es desmunta amb la pregunta oberta, es cancel·la (null): l’ordre no queda penjada', async () => {
  const vista = pinta();
  const { resposta } = await pregunta();
  vista.unmount();
  await expect(resposta).resolves.toBeNull();
});
