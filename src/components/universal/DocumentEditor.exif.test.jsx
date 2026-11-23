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
/* Gauntlet R22 (ronda 4) · jsdom no té canvas: el diàleg de la capçalera carrega, dibuixa i exporta per dobles. */
vi.mock('./enquadrament/imatgeCanvas.js', () => ({
  carregaImatge: vi.fn(async () => ({ amplada: 800, alcada: 400, tipus: 'image/jpeg', element: {}, allibera: () => {} })),
  dibuixaVisor: () => true,
  exportaRetall: vi.fn(async () => new File(['y'], 'enquadrament.jpg', { type: 'image/jpeg' })),
}));
vi.mock('./richText/extensions', async (importOriginal) => {
  const real = await importOriginal();
  m.extensions = vi.fn(real.extensionsRiques);
  return { ...real, extensionsRiques: (...args) => m.extensions(...args) };
});
import { DocumentEditor } from './DocumentEditor.jsx';
import { exifPublicable } from './enquadrament/exifIncrustat.js';
import { AVIS_UBICACIO_AMAGADA, AVIS_UBICACIO_CONSERVADA, ETIQUETA_AMAGA_LLOC } from './enquadrament/DialegEnquadrament.jsx';
import { TIPUS, dataOriginal, gpsTorre, jpegAmbExif } from '../../../tests/helpers/jpegProva.js';

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
/* v1.2.23 · IDEA-331 (ordre del Mestre 261123) · REAPUNTADES A POSTA: la foto de
   prova porta GPS, i la casella «Conserva la ubicació i la data de la foto»
   marcada de sèrie és ara l'interruptor «Amaga el lloc» apagat de sèrie
   (role="switch", checked = !conserva), amb l'avís literal del Mestre en lloc de
   «Si la deixes marcada, la ubicació…». L'invariant és el mateix: de sèrie es
   conserva, un toc resol { conserva: false }. */
const INTERRUPTOR = { name: new RegExp(ETIQUETA_AMAGA_LLOC) };

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
/* v1.2.23 · costura privacitat del cos del Perfil · exifTriatEnPujar tot sol (sense
   fotosDePublicacio) no canvia res: la mateixa crida, sense la clau. */
test.each([
  ['sense la clau', {}], ['false', { fotosDePublicacio: false }], ['un valor que no és true', { fotosDePublicacio: 'si' }],
  ['absent amb exifTriatEnPujar', { exifTriatEnPujar: true }],
])(
  'fotosDePublicacio %s: la crida de sempre a les extensions, sense demanaExif ni diàleg',
  (_cas, extra) => {
    pinta(extra);
    const [opcions] = m.extensions.mock.calls.at(-1);
    expect(opcions).toEqual({ onImageUpload: undefined, ambTargetes: false, onToast: expect.any(Function) });
    expect(Object.hasOwn(opcions, 'demanaExif')).toBe(false);
    expect(screen.queryByRole('dialog', TITOL)).toBeNull();
  },
);

test('la pregunta: l’interruptor «Amaga el lloc» apagat i l’avís del Mestre, l’exacta de sèrie; «Inserir» resol amb la tria i tanca', async () => {
  pinta();
  const { resposta } = await pregunta();
  const dialeg = screen.getByRole('dialog', TITOL);
  expect(within(dialeg).getByRole('switch', INTERRUPTOR).checked).toBe(false);
  expect(within(dialeg).getByText(AVIS_UBICACIO_CONSERVADA)).toBeTruthy();
  expect(within(dialeg).getByRole('radio', { name: 'Exacta' }).checked).toBe(true);
  fireEvent.click(within(dialeg).getByRole('radio', { name: 'Uns 100 m' }));
  await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Inserir' })); });
  await expect(resposta).resolves.toEqual({ conserva: true, precisio: '100m' });
  expect(screen.queryByRole('dialog', TITOL)).toBeNull();
});

test('«Amaga el lloc» encés (un toc), «Inserir» resol { conserva: false }; Cancel·lar resol null', async () => {
  pinta();
  let { resposta } = await pregunta();
  fireEvent.click(screen.getByRole('switch', INTERRUPTOR));
  expect(screen.getByRole('switch', INTERRUPTOR).checked).toBe(true);
  expect(screen.getByText(AVIS_UBICACIO_AMAGADA)).toBeTruthy();
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

/* Gauntlet R22 (ronda 4) · Les fotos d'una publicació de les Notes (la
   capçalera i les del cos) ixen al Mur per la promoció, que només hi deixa la
   tria de preparaTiffTriat: amb la ubicació o la data, cap dada de la càmera.
   L'avís de la casella no en pot prometre cap (exifTriat). */
const fotoDeMobil = () => new File([jpegAmbExif({
  ifd0: [{ tag: 0x010f, tipus: TIPUS.ASCII, valors: 'NIKON' }, { tag: 0x0110, tipus: TIPUS.ASCII, valors: 'D850' }],
  exif: [...dataOriginal('2017:05:14 10:22:33'), { tag: 0xa431, tipus: TIPUS.ASCII, valors: '0123456789' }],
  gps: gpsTorre(),
})], 'mobil.jpg', { type: 'image/jpeg' });
const TAMBE_CAMERA = /També es publicaran les dades de la càmera/;

test('R22 (ronda 4) · foto del cos amb ubicació i càmera: l’avís només diu la ubicació', async () => {
  pinta();
  const original = fotoDeMobil();
  const exif = await exifPublicable(original);
  await act(async () => { demanaExif()(original, exif); });
  const dialeg = screen.getByRole('dialog', TITOL);
  expect(within(dialeg).getByText(AVIS_UBICACIO_CONSERVADA)).toBeTruthy();
  expect(within(dialeg).queryByText(TAMBE_CAMERA)).toBeNull();
});

/* v1.2.23 · IDEA-331 (ordre del Mestre 261123) · El cos del Perfil (fotosDePublicacio)
   també conserva de sèrie.
   v1.2.23 · costura privacitat del cos del Perfil · REAPUNTADA A POSTA: abans, amb
   exifTriat false, el Perfil pujava el bloc sencer i l'avís deia la càmera. Ara
   (exifTriatEnPujar) puja la tria de les Notes, i l'avís és el mateix que a les Notes:
   cap dada de la càmera (els bytes, a DocumentEditor.ubicacioPerDefecte.idea331). Les
   extensions reben exifTriatEnPujar només amb fotosDePublicacio. */
test.each([
  ['Notes (sense exifTriatEnPujar)', { fotosDePublicacio: true }, false],
  ['Perfil (exifTriatEnPujar)', { fotosDePublicacio: true, exifTriatEnPujar: true }, true],
])('IDEA-331 · foto del cos amb ubicació i càmera, %s: l’interruptor apagat i l’avís del Mestre, sense la càmera', async (_cas, extra, triatEnPujar) => {
  pinta(extra);
  const [opcions] = m.extensions.mock.calls.at(-1);
  expect(opcions.exifTriatEnPujar === true).toBe(triatEnPujar);
  expect(Object.hasOwn(opcions, 'exifTriatEnPujar')).toBe(triatEnPujar);
  const original = fotoDeMobil();
  const exif = await exifPublicable(original);
  let resposta;
  await act(async () => { resposta = demanaExif()(original, exif); });
  const dialeg = screen.getByRole('dialog', TITOL);
  expect(within(dialeg).getByRole('switch', INTERRUPTOR).checked).toBe(false);
  expect(within(dialeg).getByText(AVIS_UBICACIO_CONSERVADA)).toBeTruthy();
  expect(within(dialeg).queryByText(TAMBE_CAMERA)).toBeNull();
  fireEvent.click(within(dialeg).getByRole('switch', INTERRUPTOR));
  await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Inserir' })); });
  await expect(resposta).resolves.toEqual({ conserva: false, precisio: 'exacta' });
});

test.each([
  ['amb fotosDePublicacio (les Notes): l’avís de la tria, sense la càmera', { fotosDePublicacio: true }, false],
  ['sense (una destinació que puja el bloc sencer): l’avís de sempre, amb la càmera', {}, true],
  /* v1.2.23 · costura privacitat del cos del Perfil · exifTriatEnPujar no passa per ...rest
     (que va darrere a la closca). La capçalera de la closca no tria a la pujada: amb
     fotosDePublicacio i exifTriatEnPujar, l'avís diu la càmera, com sense fotosDePublicacio
     (el Perfil té la seua capçalera, onHeroEdit, i no hi passa); tot sol, com sense. */
  ['amb fotosDePublicacio i exifTriatEnPujar: el bloc preparat, amb la càmera', { fotosDePublicacio: true, exifTriatEnPujar: true }, true],
  ['amb exifTriatEnPujar sense fotosDePublicacio: com sense, amb la càmera', { exifTriatEnPujar: true }, true],
])('R22 (ronda 4) · la capçalera %s', async (_cas, extra, ambCamera) => {
  const vista = pinta(extra);
  await act(async () => {
    fireEvent.change(vista.container.querySelector('.hero-image input[type="file"]'), { target: { files: [fotoDeMobil()] } });
  });
  const dialeg = screen.getByRole('dialog', { name: 'Enquadrar la imatge' });
  expect((await within(dialeg).findByRole('switch', INTERRUPTOR)).checked).toBe(false);
  expect(within(dialeg).queryByText(TAMBE_CAMERA) !== null).toBe(ambCamera);
  expect(within(dialeg).getByText(new RegExp(`^${AVIS_UBICACIO_CONSERVADA}`))).toBeTruthy();
});
