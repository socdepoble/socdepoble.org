import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { ETIQUETA_CONSERVA_EXIF } from './enquadrament/exifIncrustat.js';
import { dataOriginal, gpsTorre, jpegAmbExif } from '../../../tests/helpers/jpegProva.js';

/* T46 (ordre del Mestre, 260928) · el re-enquadrament dins de la closca. La
   closca sencera pinta una UniversalPage: fora el router, els avisos i el
   resolutor d'assets. jsdom no té canvas: la frontera amb el navegador
   (imatgeCanvas.js) i compressImage se simulen. */
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', () => ({ resolveAsset: (uri) => uri, resolRecursPropi: (valor) => valor }));
const dobles = vi.hoisted(() => ({ carregaImatge: vi.fn(), exportaRetall: vi.fn(), compressImage: vi.fn() }));
vi.mock('./enquadrament/imatgeCanvas.js', () => ({
  carregaImatge: dobles.carregaImatge,
  dibuixaVisor: () => true,
  exportaRetall: dobles.exportaRetall,
}));
vi.mock('../../utils/imageUtils.js', () => ({ compressImage: dobles.compressImage }));
import {
  AJUDA_FORMA_CAPCALERA, AJUDA_FORMA_LLIURE, DESCRIPCIO_ENQUADRAMENT_CAPCALERA, FORMATS_CAPCALERA, UniversalEditorShell,
} from './UniversalEditorShell.jsx';
import { FORMATS } from './enquadrament/enquadrament.js';
import { ERROR_PRESSUPOST, QUALITAT_MINIMA } from '../../utils/pujadaImatge.js';

const CURT = 'data:image/webp;base64,AAAA';
const DESAR = 'Desar l’enquadrament';
const DIALEG = { name: 'Enquadrar la imatge' };
/* P0-80 / IDEA-211 (llei del Mestre, 09-11-2026: ENQUADRAMENT NO DESTRUCTIU) ·
   La capçalera es puja sencera i el marc va al fragment de la heroImage: el
   quadrat de sèrie, centrat i sense ampliar. */
const MARC_QUADRAT = '#sdp-crop=format=1%3A1&zoom=1&cx=0.5&cy=0.5';
const foto = (tipus = 'image/jpeg') => new File(['x'], 'foto.jpg', { type: tipus });

beforeEach(() => {
  dobles.carregaImatge.mockReset().mockResolvedValue({ amplada: 800, alcada: 400, tipus: 'image/jpeg', element: {}, allibera: vi.fn() });
  dobles.exportaRetall.mockReset().mockResolvedValue(new File(['y'], 'enquadrament.jpg', { type: 'image/jpeg' }));
  dobles.compressImage.mockReset().mockResolvedValue(CURT);
});

afterEach(cleanup);

const arbre = (props) => (
  <UniversalEditorShell id="d1" titleHtml="Títol" subtitleHtml="" leadHtml="" {...props}>
    <div data-testid="cos" />
  </UniversalEditorShell>
);
const closca = (props = {}) => {
  const onSaveField = props.onSaveField || vi.fn();
  const onToast = props.onToast || vi.fn();
  const vista = render(arbre({ ...props, onSaveField, onToast }));
  return { ...vista, onSaveField, onToast, props: { ...props, onSaveField, onToast } };
};
const inputHero = (container) => container.querySelector('.hero-image input[type="file"]');
const tria = async (container, fitxer) => {
  await act(async () => { fireEvent.change(inputHero(container), { target: { files: [fitxer] } }); });
};

test('T46 · sense onHeroEdit, una foto nova obri el diàleg sense desar res; Cancel·lar no desa', async () => {
  const vista = closca();
  const fitxer = foto();
  await tria(vista.container, fitxer);
  expect(vista.getByRole('dialog', DIALEG)).toBeTruthy();
  expect(dobles.carregaImatge).toHaveBeenCalledWith(fitxer, expect.objectContaining({ signal: expect.any(Object) }));
  expect(vista.onSaveField).not.toHaveBeenCalled();
  await act(async () => { fireEvent.click(vista.getByRole('button', { name: 'Cancel·lar' })); });
  expect(vista.queryByRole('dialog', DIALEG)).toBeNull();
  expect(vista.onSaveField).not.toHaveBeenCalled();
});

test('P0-80 · «Desar l’enquadrament» puja la foto SENCERA pel camí de sempre, desa el marc al fragment i el focus va a la capçalera nova', async () => {
  const vista = closca();
  await tria(vista.container, foto());
  await act(async () => { fireEvent.click(vista.getByRole('button', { name: DESAR })); });
  /* 800×400 en quadrat: el quadrat central.
     Gauntlet 261016 (Bloc 1, Llei del Quadrat) · Actualitzada a posta: abans el
     retall ixia a la seua mida (400 × 400, sense ampliar); ara la capçalera ix
     a 1.200 × 1.200 exactes, la mateixa imatge que la targeta. */
  /* P0-80 · Actualitzada a posta: cap retall. 800 × 400 ix sencera, a 1.200
     pel costat llarg, i el quadrat central viatja al fragment. */
  expect(dobles.exportaRetall).toHaveBeenCalledWith({}, { x: 0, y: 0, w: 800, h: 400 }, { amplada: 1200, alcada: 600, tipus: 'image/jpeg' });
  const exportat = await dobles.exportaRetall.mock.results[0].value;
  expect(dobles.compressImage).toHaveBeenCalledWith(exportat, { maxSize: 1200, format: 'image/webp', quality: 0.8 });
  expect(vista.onSaveField).toHaveBeenCalledWith('heroImage', `${CURT}${MARC_QUADRAT}`, 'd1');
  expect(vista.queryByRole('dialog', DIALEG)).toBeNull();
  // El pare torna la capçalera desada: el focus hi va, i la vista la pinta amb el seu marc (la base, en la forma del marc).
  await act(async () => { vista.rerender(arbre({ ...vista.props, heroImage: `${CURT}${MARC_QUADRAT}` })); });
  const imatge = vista.container.querySelector('img.sdp-hero__imatge');
  expect(imatge).not.toBeNull();
  expect(imatge.getAttribute('src')).toBe(CURT);
  expect(imatge.classList.contains('sdp-imatge-enquadrada--marc')).toBe(true);
  expect(document.activeElement).toBe(imatge);
});

test('T46 · si no es pot desar, el missatge ix dins del diàleg (també en toast) i continua obert', async () => {
  dobles.compressImage.mockRejectedValue(new Error('No s’ha pogut comprimir la imatge.'));
  const vista = closca();
  await tria(vista.container, foto());
  await act(async () => { fireEvent.click(vista.getByRole('button', { name: DESAR })); });
  expect(vista.getByRole('dialog', DIALEG)).toBeTruthy();
  expect(vista.getByRole('alert').textContent).toBe('No s’ha pogut comprimir la imatge.');
  expect(vista.onToast).toHaveBeenCalledWith('No s’ha pogut comprimir la imatge.', 'error');
  expect(vista.onSaveField).not.toHaveBeenCalled();
});

test('T46 · amb capçalera i sense onHeroEdit, el panell d’edició porta «Enquadrar», que obri la imatge desada', async () => {
  const vista = closca({ heroImage: '/assets/h.webp' });
  await act(async () => {});
  expect(vista.queryByRole('button', { name: 'Enquadrar' })).toBeNull();
  fireEvent.click(vista.container.querySelector('img.sdp-hero__imatge'));
  const enquadrar = vista.getByRole('button', { name: 'Enquadrar' });
  expect(enquadrar.getAttribute('aria-haspopup')).toBe('dialog');
  // Va abans d'«Enrere» i «Esborrar».
  expect([...enquadrar.parentElement.children].map((b) => b.textContent.trim())).toEqual(['Enquadrar', 'Enrere', 'Esborrar']);
  await act(async () => { fireEvent.click(enquadrar); });
  expect(vista.getByRole('dialog', DIALEG)).toBeTruthy();
  expect(dobles.carregaImatge).toHaveBeenCalledWith('/assets/h.webp', expect.any(Object));
});

test('IDEA-20 · re-enquadrar la capçalera desada obri en «Original» (mai el quadrat, que la tornaria a tallar); una foto nova, en quadrat', async () => {
  const vista = closca({ heroImage: '/assets/panoramica.webp' });
  await act(async () => {});
  fireEvent.click(vista.container.querySelector('img.sdp-hero__imatge'));
  await act(async () => { fireEvent.click(vista.getByRole('button', { name: 'Enquadrar' })); });
  const dialeg = vista.getByRole('dialog', DIALEG);
  expect(within(dialeg).getByRole('radio', { name: /^Original/ }).checked).toBe(true);
  expect(within(dialeg).getByRole('radio', { name: /^Quadrat \(1:1\)/ }).checked).toBe(false);
});

test('T46 · una capçalera sdp-media:// que no es pot resoldre no ofereix «Enquadrar»', async () => {
  const vista = closca({ heroImage: 'sdp-media://mitjans_privats/t/u/notes/a.webp' });
  await act(async () => {});
  fireEvent.click(vista.container.querySelector('img.sdp-hero__imatge'));
  expect(vista.queryByRole('button', { name: 'Enquadrar' })).toBeNull();
  expect(vista.getByRole('button', { name: 'Enrere' })).toBeTruthy();
});

test('T46 · el Perfil (onHeroEdit) queda igual: ni «Enquadrar» ni diàleg, i el fitxer es desa directe', async () => {
  const onHeroEdit = vi.fn();
  const vista = closca({ heroImage: '/assets/h.webp', onHeroEdit, heroEditLabel: 'Editar capçalera i avatar' });
  await act(async () => {});
  fireEvent.click(vista.container.querySelector('img.sdp-hero__imatge'));
  expect(vista.queryByRole('button', { name: 'Enquadrar' })).toBeNull();
  await tria(vista.container, foto());
  expect(vista.queryByRole('dialog', DIALEG)).toBeNull();
  expect(dobles.carregaImatge).not.toHaveBeenCalled();
  expect(vista.onSaveField).toHaveBeenCalledWith('heroImage', CURT, 'd1');
});

test('T46 · un fitxer que no és imatge no obri el diàleg i dona l’avís de sempre', async () => {
  const vista = closca();
  await tria(vista.container, foto('application/pdf'));
  expect(vista.queryByRole('dialog', DIALEG)).toBeNull();
  expect(vista.onToast).toHaveBeenCalledWith('Només imatges, de moment.', 'error');
  expect(vista.onSaveField).not.toHaveBeenCalled();
});

/* Poliment T46 (ordre del Mestre, 260928) · Escape tanca el diàleg encara que
   estiga desant, i el desat continua. Mentre la capçalera puja no s'obri cap
   altre enquadrament ni es tria cap fitxer: un desat antic no pot tancar el
   diàleg d'un altre ni trepitjar-ne un de més nou. */
test('T46 · mentre la capçalera es desa, ni un altre enquadrament ni un altre fitxer; en acabar, tot torna', async () => {
  let resol;
  dobles.compressImage.mockImplementationOnce(() => new Promise((r) => { resol = r; }));
  const vista = closca();
  await tria(vista.container, foto());
  await act(async () => { fireEvent.click(vista.getByRole('button', { name: DESAR })); });
  await act(async () => { fireEvent(vista.getByRole('dialog', DIALEG), new Event('cancel', { cancelable: true })); });
  expect(vista.queryByRole('dialog', DIALEG)).toBeNull();
  const editar = vista.getByRole('button', { name: /Editar capçalera/ });
  expect(editar.disabled).toBe(true);
  expect(vista.getByText(/Encara s’està desant la imatge/)).toBeTruthy();
  await tria(vista.container, foto());
  expect(vista.queryByRole('dialog', DIALEG)).toBeNull();
  expect(dobles.carregaImatge).toHaveBeenCalledTimes(1);
  await act(async () => { resol(CURT); });
  expect(vista.onSaveField).toHaveBeenCalledTimes(1);
  expect(vista.onSaveField).toHaveBeenCalledWith('heroImage', `${CURT}${MARC_QUADRAT}`, 'd1');
  expect(vista.getByRole('button', { name: /Editar capçalera/ }).disabled).toBe(false);
  expect(vista.queryByText(/Encara s’està desant la imatge/)).toBeNull();
  // Acabat el desat, un enquadrament nou s'obri i cap desat vell el tanca.
  await tria(vista.container, foto());
  expect(vista.getByRole('dialog', DIALEG)).toBeTruthy();
});

/* Ordre del Mestre (261007, ordre E) i esmena 1 del pla 261007_1645 · La
   germana de la de dalt per al logotip, que ara pinta el mateix control
   (ImageUploaderUI): mentre puja, «Editar logotip» desactivat, l'ajuda ho diu i
   un altre fitxer no es processa. Abans, el segon trepitjava el primer. La
   capçalera no es bloqueja: cada control, la seua pujada. */
const inputLogo = (container) => container.querySelector('.page-title-logo-personalitzat input[type="file"]');
const triaLogo = async (container, fitxer) => {
  await act(async () => { fireEvent.change(inputLogo(container), { target: { files: [fitxer] } }); });
};

test('ordre E · mentre el logotip es desa, cap altre fitxer; en acabar, tot torna', async () => {
  let resol;
  dobles.compressImage.mockImplementationOnce(() => new Promise((r) => { resol = r; }));
  const vista = closca();
  await triaLogo(vista.container, foto());
  const editar = vista.getByRole('button', { name: 'Editar logotip' });
  expect(editar.disabled).toBe(true);
  expect(vista.container.querySelector('.page-title-logo-personalitzat .sdp-camp__ajuda').textContent).toMatch(/Encara s’està desant la imatge/);
  // La capçalera no puja: el seu botó continua viu.
  expect(vista.getByRole('button', { name: 'Editar capçalera' }).disabled).toBe(false);
  await triaLogo(vista.container, foto());
  expect(dobles.compressImage).toHaveBeenCalledTimes(1);
  expect(inputLogo(vista.container).value).toBe('');
  await act(async () => { resol(CURT); });
  expect(vista.onSaveField).toHaveBeenCalledTimes(1);
  expect(vista.onSaveField).toHaveBeenCalledWith('logoImage', CURT, 'd1');
  expect(vista.getByRole('button', { name: 'Editar logotip' }).disabled).toBe(false);
  expect(vista.queryByText(/Encara s’està desant la imatge/)).toBeNull();
  // Acabat el desat, un fitxer nou sí que es processa.
  await triaLogo(vista.container, foto());
  expect(dobles.compressImage).toHaveBeenCalledTimes(2);
});

test('ordre E · amb logotip i mentre se’n desa un de nou, «Esborrar» també es desactiva', async () => {
  let resol;
  dobles.compressImage.mockImplementationOnce(() => new Promise((r) => { resol = r; }));
  const vista = closca({ logoImage: '/assets/l.webp' });
  await act(async () => {});
  fireEvent.click(vista.container.querySelector('img.sdp-logo-personalitzat'));
  expect(vista.getByRole('button', { name: 'Esborrar' }).disabled).toBe(false);
  await triaLogo(vista.container, foto());
  expect(vista.getByRole('button', { name: 'Esborrar' }).disabled).toBe(true);
  expect(vista.getByRole('button', { name: 'Enrere' }).disabled).toBe(false);
  await act(async () => { resol(CURT); });
  expect(vista.onSaveField).toHaveBeenCalledWith('logoImage', CURT, 'd1');
});

test('T46 · si mentre arriba la capçalera s’escriu en un altre camp, el focus no es mou i queda desarmat', async () => {
  const vista = closca();
  await tria(vista.container, foto());
  await act(async () => { fireEvent.click(vista.getByRole('button', { name: DESAR })); });
  expect(vista.queryByRole('dialog', DIALEG)).toBeNull();
  const titol = vista.container.querySelector('.editor-title-input');
  act(() => { titol.focus(); });
  await act(async () => { vista.rerender(arbre({ ...vista.props, heroImage: CURT })); });
  expect(document.activeElement).toBe(titol);
  // Desarmat: una capçalera posterior tampoc no mou el focus.
  act(() => { titol.blur(); });
  await act(async () => { vista.rerender(arbre({ ...vista.props, heroImage: `${CURT}B` })); });
  expect(document.activeElement).toBe(document.body);
});

test('T46 · amb el diàleg tancat, la closca té els fills de sempre', () => {
  const { container } = closca();
  expect([...container.querySelector('.sdp-editor-shell-atomic').children].map((e) => e.className)).toEqual(['sdp-editor-document']);
});

/* Gauntlet 261016 (Bloc 1.2, mandat del Mestre, pla §0.1.3) · La capçalera de
   les Notes oferix la casella «Conserva la ubicació i la data de la foto»
   quan la foto en porta, marcada de sèrie, i la tria arriba a compressImage.
   Les fotos de dalt («x») no en porten: cap casella i la crida de sempre. */
const CASELLA = { name: new RegExp(ETIQUETA_CONSERVA_EXIF) };
const ambGps = () => new File([jpegAmbExif({ exif: dataOriginal('2017:05:14 10:22:33'), gps: gpsTorre() })], 'arbre.jpg', { type: 'image/jpeg' });

test('Bloc 1.2 · una foto amb GPS: la casella, marcada de sèrie, fa que compressImage reba conservaExif i l’original', async () => {
  const vista = closca();
  const fitxer = ambGps();
  await tria(vista.container, fitxer);
  const casella = await within(vista.getByRole('dialog', DIALEG)).findByRole('checkbox', CASELLA);
  expect(casella.checked).toBe(true);
  await act(async () => { fireEvent.click(vista.getByRole('button', { name: DESAR })); });
  const exportat = await dobles.exportaRetall.mock.results[0].value;
  // P1-64 · Amb una ubicació, també la precisió de sèrie (l'exacta, decisió 8 del Mestre 261028).
  expect(dobles.compressImage).toHaveBeenCalledWith(exportat, {
    maxSize: 1200, format: 'image/webp', quality: 0.8, conservaExif: true, original: fitxer, precisio: 'exacta',
  });
  expect(vista.onSaveField).toHaveBeenCalledWith('heroImage', `${CURT}${MARC_QUADRAT}`, 'd1');
});

/* P1-64 (pla 261028_1526 §3.1.1) · Les píndoles de la precisió del hero: la
   triada arriba a processaFitxer i a compressImage (el fitxer ix arrodonit). */
test('P1-64 · la precisió triada al diàleg del hero arriba a compressImage', async () => {
  const vista = closca();
  const fitxer = ambGps();
  await tria(vista.container, fitxer);
  const dialeg = vista.getByRole('dialog', DIALEG);
  await within(dialeg).findByRole('checkbox', CASELLA);
  fireEvent.click(within(dialeg).getByRole('radio', { name: 'Només el poble' }));
  expect(within(dialeg).getByText(/^Es desarà: 38\.59, -0\.42 \(uns 1\.000 m\)\./)).toBeTruthy();
  await act(async () => { fireEvent.click(vista.getByRole('button', { name: DESAR })); });
  expect(dobles.compressImage.mock.calls[0][1]).toMatchObject({ conservaExif: true, original: fitxer, precisio: 'poble' });
});

test('Bloc 1.2 · desmarcada, la crida de sempre (la foto ix neta); sense EXIF, ni casella', async () => {
  const vista = closca();
  await tria(vista.container, ambGps());
  fireEvent.click(await within(vista.getByRole('dialog', DIALEG)).findByRole('checkbox', CASELLA));
  await act(async () => { fireEvent.click(vista.getByRole('button', { name: DESAR })); });
  expect(dobles.compressImage.mock.calls.map(([, o]) => o)).toEqual([{ maxSize: 1200, format: 'image/webp', quality: 0.8 }]);
  await tria(vista.container, foto());
  await act(async () => {});
  expect(within(vista.getByRole('dialog', DIALEG)).queryByRole('checkbox')).toBeNull();
});

/* Gauntlet 261016 (Bloc 1, Llei del Quadrat; pla §0.1.1) · La capçalera i la
   targeta eren la MATEIXA imatge de 1.200 × 1.200, i el diàleg de la closca
   només oferia el quadrat.
   Directiva del Mestre (261024, àudio 22:47) · Actualitzada a posta: «el
   quadrat únic és una limitació inacceptable». El diàleg torna a oferir totes
   les formes del model, amb el quadrat marcat de sèrie i la seua ajuda
   (recomanat), i a la resta l'ajuda que diu el que fa la targeta (la retalla
   en quadrat). */
test('Directiva 261024 · el diàleg de la capçalera oferix totes les formes, el quadrat de sèrie, amb les seues ajudes', async () => {
  const vista = closca();
  await tria(vista.container, foto());
  const dialeg = vista.getByRole('dialog', DIALEG);
  const formes = within(dialeg).getAllByRole('radio');
  expect(formes.map((r) => r.value)).toEqual(['1:1', 'original', '4:3', '3:2', '16:9', '21:9', '4:5', '3:4', '9:16']);
  expect(formes.filter((r) => r.checked).map((r) => r.value)).toEqual(['1:1']);
  expect(within(dialeg).getByRole('radio', { name: /^Quadrat \(1:1\)/ })).toBeTruthy();
  expect(within(dialeg).getByRole('radio', { name: /^Superpanoràmic \(21:9\)/ })).toBeTruthy();
  expect(within(dialeg).getByRole('radio', { name: /^Vertical llarg \(9:16\)/ })).toBeTruthy();
  expect(within(dialeg).getAllByText(AJUDA_FORMA_CAPCALERA)).toHaveLength(1);
  expect(within(dialeg).getAllByText(AJUDA_FORMA_LLIURE)).toHaveLength(FORMATS.length - 1);
  expect(dialeg.querySelector('.sdp-dialeg__descripcio').textContent).toBe(DESCRIPCIO_ENQUADRAMENT_CAPCALERA);
  expect(DESCRIPCIO_ENQUADRAMENT_CAPCALERA).not.toMatch(/quadrat/);
  // Les mateixes files del model (valor, etiqueta i proporció), cadascuna amb la seua ajuda.
  const senseAjuda = (f) => [f.valor, f.etiqueta, f.ratio];
  expect(FORMATS_CAPCALERA.map(senseAjuda)).toEqual(FORMATS.map(senseAjuda));
  expect(FORMATS_CAPCALERA.map((f) => f.ajuda)).toEqual(FORMATS.map((f) => (f.valor === '1:1' ? AJUDA_FORMA_CAPCALERA : AJUDA_FORMA_LLIURE)));
  expect(Object.isFrozen(FORMATS_CAPCALERA) && FORMATS_CAPCALERA.every((f) => Object.isFrozen(f))).toBe(true);
});

/* P0-80 / IDEA-211 · Actualitzada a posta: abans, 16:9 ixia a 1.200 × 675,
   9:16 a 675 × 1.200 i 21:9 a 1.200 × 514, retallades. Ara la foto de
   4.000 × 2.000 ix SENCERA a 1.200 × 600 en totes, i la forma viatja al
   fragment; la pujada no la torna a reduir. */
test('P0-80 · una capçalera en 16:9, 9:16 o 21:9 ix sencera (1.200 × 600) amb la forma al fragment; la pujada no la torna a reduir', async () => {
  dobles.carregaImatge.mockResolvedValue({ amplada: 4000, alcada: 2000, tipus: 'image/jpeg', element: {}, allibera: vi.fn() });
  const SENCERA = [{ x: 0, y: 0, w: 4000, h: 2000 }, { amplada: 1200, alcada: 600, tipus: 'image/jpeg' }];
  const casos = [['16:9', '16%3A9'], ['9:16', '9%3A16'], ['21:9', '21%3A9']];
  for (const [forma, codificada] of casos) {
    dobles.exportaRetall.mockClear();
    dobles.compressImage.mockClear();
    const vista = closca();
    await tria(vista.container, foto());
    const dialeg = vista.getByRole('dialog', DIALEG);
    act(() => { fireEvent.click(within(dialeg).getByRole('radio', { name: new RegExp(`\\(${forma}\\)`) })); });
    await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: DESAR })); });
    expect(dobles.exportaRetall.mock.calls.map((c) => c.slice(1)), forma).toEqual([SENCERA]);
    const exportat = await dobles.exportaRetall.mock.results[0].value;
    expect(dobles.compressImage, forma).toHaveBeenCalledWith(exportat, { maxSize: 1200, format: 'image/webp', quality: 0.8 });
    expect(vista.onSaveField, forma).toHaveBeenCalledWith('heroImage', `${CURT}#sdp-crop=format=${codificada}&zoom=1&cx=0.5&cy=0.5`, 'd1');
    cleanup();
  }
});

test('Bloc 1 · una foto ja quadrada desada sencera també ix recodificada a 1.200 × 1.200: mai l’original', async () => {
  dobles.carregaImatge.mockResolvedValue({ amplada: 1000, alcada: 1000, tipus: 'image/png', element: {}, allibera: vi.fn() });
  const vista = closca();
  const original = foto('image/png');
  await tria(vista.container, original);
  await act(async () => { fireEvent.click(vista.getByRole('button', { name: DESAR })); });
  // Sencera i més menuda: s'amplia a la mida exacta (el PNG conserva la transparència fins a la compressió).
  expect(dobles.exportaRetall).toHaveBeenCalledWith({}, { x: 0, y: 0, w: 1000, h: 1000 }, { amplada: 1200, alcada: 1200, tipus: 'image/png' });
  const exportat = await dobles.exportaRetall.mock.results[0].value;
  expect(dobles.compressImage.mock.calls.map(([f, o]) => [f, o.maxSize])).toEqual([[exportat, 1200]]);
  expect(dobles.compressImage.mock.calls[0][0]).not.toBe(original);
  expect(vista.onSaveField).toHaveBeenCalledWith('heroImage', CURT, 'd1');
});

/* Actualitzada a posta (IDEA-20, revisió adversarial 261024) · Re-enquadrar
   una capçalera apaïsada ja desada obri en «Original»: desar-la sense tocar
   res no la torna a tallar (no hi ha res a desar). El quadrat de 1.200 × 1.200
   només ix si la persona el tria. */
/* P0-80 / IDEA-211 · Actualitzada a posta: triar el quadrat ja no torna a
   tallar la capçalera desada (abans ixia un retall de 1.200 × 1.200): es desa
   la mateixa adreça amb el quadrat al fragment, sense cap exportació ni pujada. */
test('IDEA-20 + P0-80 · una capçalera apaïsada ja desada s’obri en «Original» i no es torna a tallar; triada en quadrat, només el fragment', async () => {
  dobles.carregaImatge.mockResolvedValue({ amplada: 1200, alcada: 675, tipus: 'image/webp', element: {}, allibera: vi.fn() });
  const vista = closca({ heroImage: '/assets/h.webp' });
  await act(async () => {});
  fireEvent.click(vista.container.querySelector('img.sdp-hero__imatge'));
  await act(async () => { fireEvent.click(vista.getByRole('button', { name: 'Enquadrar' })); });
  await act(async () => { fireEvent.click(vista.getByRole('button', { name: DESAR })); });
  expect(dobles.exportaRetall).not.toHaveBeenCalled();
  expect(vista.onSaveField).not.toHaveBeenCalled();
  await act(async () => { fireEvent.click(vista.getByRole('button', { name: 'Enquadrar' })); });
  await act(async () => { fireEvent.click(within(vista.getByRole('dialog', DIALEG)).getByRole('radio', { name: /^Quadrat \(1:1\)/ })); });
  await act(async () => { fireEvent.click(vista.getByRole('button', { name: DESAR })); });
  expect(dobles.exportaRetall).not.toHaveBeenCalled();
  expect(dobles.compressImage).not.toHaveBeenCalled();
  expect(vista.onSaveField).toHaveBeenCalledWith('heroImage', `/assets/h.webp${MARC_QUADRAT}`, 'd1');
});

/* processaFitxer rep la forma 'capcalera': el camí de les fotos, amb la mida
   fixa i el pressupost (fotoDinsDelPressupost), mai el del logotip.
   Gauntlet 261016 (P1 de l'auditoria adversarial) · Abans, els sis intents de
   l'escala fixa (0,8 → 0,4); ara, la cerca de la qualitat, que acaba a la
   mínima quan no hi cap res. */
test('Bloc 1 · si ni la qualitat més baixa hi cap, l’error del pressupost ix dins del diàleg; la mida no baixa mai de 1.200', async () => {
  dobles.compressImage.mockResolvedValue(`data:image/webp;base64,${'A'.repeat(120000)}`);
  const vista = closca();
  await tria(vista.container, foto());
  await act(async () => { fireEvent.click(vista.getByRole('button', { name: DESAR })); });
  expect(dobles.compressImage.mock.calls.map(([, o]) => [o.maxSize, o.quality])).toEqual([0.8, 0.4, 0.2, 0.08, 0.04].map((q) => [1200, q]));
  expect(dobles.compressImage.mock.calls.at(-1)[1].quality).toBe(QUALITAT_MINIMA);
  expect(within(vista.getByRole('dialog', DIALEG)).getByRole('alert').textContent).toBe(ERROR_PRESSUPOST);
  expect(vista.onSaveField).not.toHaveBeenCalled();
});

/* P0-80 / IDEA-211 (llei del Mestre, 09-11-2026: ENQUADRAMENT NO DESTRUCTIU) ·
   El viatge d'anada i tornada a la closca de les Notes: una capçalera amb el
   seu marc es pinta amb el marc (la base, en la forma del marc), s'obri
   sencera en el seu marc i, en moure'l, es desa la heroImage DESADA amb el
   marc nou: cap exportació, cap pujada, cap retall. */
test('P0-80 · re-enquadrar una capçalera amb marc: sencera al diàleg, el marc nou al fragment, cap pujada', async () => {
  dobles.carregaImatge.mockResolvedValue({ amplada: 4000, alcada: 3000, tipus: 'image/webp', element: {}, allibera: vi.fn() });
  const desada = '/assets/h.webp#sdp-crop=format=16%3A9&zoom=1.5&cx=0.4&cy=0.6';
  const vista = closca({ heroImage: desada });
  await act(async () => {});
  const imatge = vista.container.querySelector('img.sdp-hero__imatge');
  expect(imatge.getAttribute('src')).toBe('/assets/h.webp');
  expect(imatge.classList.contains('sdp-imatge-enquadrada--marc')).toBe(true);
  fireEvent.click(imatge);
  await act(async () => { fireEvent.click(vista.getByRole('button', { name: 'Enquadrar' })); });
  expect(dobles.carregaImatge.mock.calls[0][0]).toBe('/assets/h.webp');
  const dialeg = vista.getByRole('dialog', DIALEG);
  expect(dialeg.querySelector('input[type="radio"][value="16:9"]').checked).toBe(true);
  expect(within(dialeg).getByLabelText('Ampliació').getAttribute('aria-valuetext')).toBe('150 %');
  act(() => { fireEvent.change(within(dialeg).getByLabelText('Ampliació'), { target: { value: '2' } }); });
  await act(async () => { fireEvent.click(vista.getByRole('button', { name: DESAR })); });
  expect(dobles.exportaRetall).not.toHaveBeenCalled();
  expect(dobles.compressImage).not.toHaveBeenCalled();
  expect(vista.onSaveField.mock.calls).toEqual([['heroImage', '/assets/h.webp#sdp-crop=format=16%3A9&zoom=2&cx=0.4&cy=0.6', 'd1']]);
  expect(vista.queryByRole('dialog', DIALEG)).toBeNull();
});

/* R16a (revisió final, troballa 3, P1 de privadesa) · Re-enquadrar una
   capçalera desada amb GPS a l'EXIF: una precisió més grossa que la del
   fitxer torna a pujar la foto SENCERA (la compressió hi arrodonix el GPS) i
   desa l'adreça nova amb el marc. Abans es desava només el fragment i el
   fitxer públic es quedava amb la ubicació exacta. */
const HERO_DESAT = '/assets/h.jpg#sdp-crop=format=16%3A9&zoom=1.5&cx=0.4&cy=0.6';
const jpegGps = (gps) => new Blob([jpegAmbExif({ exif: dataOriginal('2017:05:14 10:22:33'), gps })], { type: 'image/jpeg' });
const reobriCapcalera = async (blob) => {
  dobles.carregaImatge.mockResolvedValue({ amplada: 4000, alcada: 3000, tipus: 'image/jpeg', element: {}, allibera: vi.fn(), blob });
  const vista = closca({ heroImage: HERO_DESAT });
  await act(async () => {});
  fireEvent.click(vista.container.querySelector('img.sdp-hero__imatge'));
  await act(async () => { fireEvent.click(vista.getByRole('button', { name: 'Enquadrar' })); });
  const dialeg = vista.getByRole('dialog', DIALEG);
  const casella = await within(dialeg).findByRole('checkbox', CASELLA);
  return { vista, dialeg, casella };
};

test('R16a · capçalera desada amb GPS, «Només el poble» i un marc nou: puja la foto SENCERA amb la precisió i desa l’adreça nova amb el marc', async () => {
  const blob = jpegGps(gpsTorre());
  const { vista, dialeg } = await reobriCapcalera(blob);
  fireEvent.click(within(dialeg).getByRole('radio', { name: 'Només el poble' }));
  act(() => { fireEvent.change(within(dialeg).getByLabelText('Ampliació'), { target: { value: '2' } }); });
  await act(async () => { fireEvent.click(vista.getByRole('button', { name: DESAR })); });
  expect(dobles.exportaRetall.mock.calls.map((c) => c[1])).toEqual([{ x: 0, y: 0, w: 4000, h: 3000 }]);
  const exportat = await dobles.exportaRetall.mock.results[0].value;
  expect(dobles.compressImage).toHaveBeenCalledWith(exportat, expect.objectContaining({ conservaExif: true, original: blob, precisio: 'poble' }));
  expect(vista.onSaveField.mock.calls).toEqual([['heroImage', `${CURT}#sdp-crop=format=16%3A9&zoom=2&cx=0.4&cy=0.6`, 'd1']]);
  expect(vista.queryByRole('dialog', DIALEG)).toBeNull();
});

test('R16a · només la precisió, amb el marc igual: també puja la foto nova i hi conserva el marc', async () => {
  const blob = jpegGps(gpsTorre());
  const { vista, dialeg } = await reobriCapcalera(blob);
  fireEvent.click(within(dialeg).getByRole('radio', { name: 'Uns 100 m' }));
  await act(async () => { fireEvent.click(vista.getByRole('button', { name: DESAR })); });
  expect(dobles.compressImage.mock.calls[0][1]).toMatchObject({ conservaExif: true, original: blob, precisio: '100m' });
  expect(vista.onSaveField.mock.calls).toEqual([['heroImage', `${CURT}#sdp-crop=format=16%3A9&zoom=1.5&cx=0.4&cy=0.6`, 'd1']]);
});

test('R16a · el camí invers: desmarcar la casella puja la foto sencera neta, amb el marc', async () => {
  const { vista, casella } = await reobriCapcalera(jpegGps(gpsTorre()));
  fireEvent.click(casella);
  await act(async () => { fireEvent.click(vista.getByRole('button', { name: DESAR })); });
  expect(dobles.exportaRetall.mock.calls.map((c) => c[1])).toEqual([{ x: 0, y: 0, w: 4000, h: 3000 }]);
  expect(dobles.compressImage.mock.calls.map(([, o]) => o)).toEqual([{ maxSize: 1200, format: 'image/webp', quality: 0.8 }]);
  expect(vista.onSaveField.mock.calls).toEqual([['heroImage', `${CURT}#sdp-crop=format=16%3A9&zoom=1.5&cx=0.4&cy=0.6`, 'd1']]);
});

test('R16a · una capçalera que ja porta el GPS al poble s’obri en «Només el poble» i un marc nou només en canvia el fragment', async () => {
  const poble = gpsTorre({ lat: [[3859, 100], [0, 1], [0, 1]], lng: [[42, 100], [0, 1], [0, 1]] });
  const { vista, dialeg } = await reobriCapcalera(jpegGps(poble));
  expect(within(dialeg).getByRole('radio', { name: 'Només el poble' }).checked).toBe(true);
  act(() => { fireEvent.change(within(dialeg).getByLabelText('Ampliació'), { target: { value: '2' } }); });
  await act(async () => { fireEvent.click(vista.getByRole('button', { name: DESAR })); });
  expect(dobles.exportaRetall).not.toHaveBeenCalled();
  expect(dobles.compressImage).not.toHaveBeenCalled();
  expect(vista.onSaveField.mock.calls).toEqual([['heroImage', '/assets/h.jpg#sdp-crop=format=16%3A9&zoom=2&cx=0.4&cy=0.6', 'd1']]);
});

/* Revisió final R16a (troballa 1, WCAG 2.4.7) · Amb un marc ampliat (zoom per damunt d'1), la
   capçalera es pinta amb transform i clip-path (modules.css, bloc ENQUADRAMENT NO DESTRUCTIU), i el
   clip-path retallava també l'anell de focus de l'<img> enfocable: ni el Tab ni enfocaHero deixaven
   cap anell visible. El control és llavors un <button> sense pell que embolcalla la foto
   (.sdp-hero__obridor): el Tab i enfocaHero hi van, i la foto retallada ja no és cap control. Amb
   zoom 1 (cap retall), l'<img> de sempre i el focus a la foto (la prova P0-80 de dalt). Mesurat amb
   Chrome i tecles reals a eines_fc (Notes, Perfil, 375/768/1440, clar i fosc). */
const MARC_AMPLIAT = '#sdp-crop=format=16%3A9&zoom=1.5&cx=0.4&cy=0.6';
test('R16a · amb un marc ampliat, el control és el botó que embolcalla la foto, i enfocaHero hi torna el focus', async () => {
  dobles.carregaImatge.mockResolvedValue({ amplada: 4000, alcada: 3000, tipus: 'image/webp', element: {}, allibera: vi.fn() });
  const vista = closca({ heroImage: `/assets/h.webp${MARC_AMPLIAT}` });
  await act(async () => {});
  const imatge = vista.container.querySelector('img.sdp-hero__imatge');
  const control = imatge.parentElement;
  expect(control.matches('.hero-image > button.sdp-hero__obridor[type="button"]')).toBe(true);
  expect([...control.children]).toEqual([imatge]);
  expect(control.getAttribute('title')).toBe('Clica per canviar la imatge');
  expect(vista.getByRole('button', { name: 'Capçalera' })).toBe(control);
  // La foto retallada ja no és cap control: ni role, ni tabindex, ni nom, ni títol; l'alt es queda.
  expect(['role', 'tabindex', 'aria-label', 'title'].filter((a) => imatge.hasAttribute(a))).toEqual([]);
  expect(imatge.getAttribute('alt')).toBe('Capçalera');
  expect(imatge.classList.contains('sdp-imatge-enquadrada--marc')).toBe(true);
  // El clic de la foto arriba al botó: el panell de sempre, «Enquadrar» i el diàleg.
  fireEvent.click(imatge);
  await act(async () => { fireEvent.click(vista.getByRole('button', { name: 'Enquadrar' })); });
  act(() => { fireEvent.change(within(vista.getByRole('dialog', DIALEG)).getByLabelText('Ampliació'), { target: { value: '2' } }); });
  await act(async () => { fireEvent.click(vista.getByRole('button', { name: DESAR })); });
  const nova = '/assets/h.webp#sdp-crop=format=16%3A9&zoom=2&cx=0.4&cy=0.6';
  expect(vista.onSaveField.mock.calls).toEqual([['heroImage', nova, 'd1']]);
  await act(async () => { vista.rerender(arbre({ ...vista.props, heroImage: nova })); });
  // Enrere torna la foto i enfocaHero hi porta el focus: al botó, no a la foto retallada.
  await act(async () => { fireEvent.click(vista.getByRole('button', { name: 'Enrere' })); });
  const nouControl = vista.container.querySelector('.hero-image > button.sdp-hero__obridor');
  expect(nouControl.firstElementChild).toBe(vista.container.querySelector('img.sdp-hero__imatge'));
  expect(document.activeElement).toBe(nouControl);
});

test('R16a · amb onHeroEdit (el Perfil), el botó de la foto ampliada porta el nom de les opcions; amb zoom 1 o sense marc, l’<img> de sempre', async () => {
  const onHeroEdit = vi.fn();
  const vista = closca({ heroImage: `/assets/h.webp${MARC_AMPLIAT}`, onHeroEdit, heroEditLabel: 'Capçalera' });
  await act(async () => {});
  const control = vista.getByRole('button', { name: 'Opcions de la capçalera' });
  expect(control.className).toBe('sdp-hero__obridor');
  expect(control.firstElementChild).toBe(vista.container.querySelector('img.sdp-hero__imatge'));
  expect(vista.getAllByRole('button', { name: 'Capçalera' })).toHaveLength(1);
  for (const heroImage of [`/assets/h.webp${MARC_QUADRAT}`, '/assets/h.webp']) {
    cleanup();
    const sense = closca({ heroImage, onHeroEdit, heroEditLabel: 'Capçalera' });
    await act(async () => {});
    expect(sense.container.querySelector('.sdp-hero__obridor')).toBeNull();
    const img = sense.container.querySelector('img.sdp-hero__imatge');
    expect([img.getAttribute('role'), img.getAttribute('tabindex'), img.getAttribute('aria-label')]).toEqual(['button', '0', 'Opcions de la capçalera']);
    expect(img.parentElement.classList.contains('hero-image')).toBe(true);
  }
});

test('R16a · CSS: el botó de la foto ampliada, sense pell, sense retall i sense punter fora de la foto, dins del bloc del marc', () => {
  const llig = (fitxer) => readFileSync(path.join(process.cwd(), fitxer), 'utf8');
  const net = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
  const modules = llig('src/css/modules.css');
  const bloc = net(modules.slice(modules.indexOf('/* ═══ BLOC ENQUADRAMENT NO DESTRUCTIU'), modules.indexOf('/* ═══ FI DEL BLOC ENQUADRAMENT NO DESTRUCTIU ═══ */')));
  const regla = (selector) => {
    const inici = bloc.indexOf(`${selector} {`);
    expect(inici).toBeGreaterThan(-1);
    return bloc.slice(inici + selector.length + 2, bloc.indexOf('}', inici)).trim();
  };
  expect(bloc.trim().startsWith('@layer components {')).toBe(true);
  expect(regla('.sdp-hero__obridor')).toBe('display: block; inline-size: 100%; min-inline-size: 0; min-block-size: 0; margin: 0; padding: 0; '
    + 'border: 0; border-radius: 0; background: transparent; color: inherit; font: inherit; appearance: none; transform: none; pointer-events: none;');
  expect(regla('.sdp-hero__obridor > img')).toBe('pointer-events: auto;');
  // Cap altra regla de cap full no li dona retall, desbordament ni li lleva l'anell.
  for (const full of ['src/css/modules.css', 'src/css/components.css', 'src/css/layout.css', 'src/css/base.css', 'src/css/utilities.css']) {
    const css = net(llig(full));
    for (const m of css.matchAll(/([^{}]*\.sdp-hero__obridor[^{}]*)\{([^}]*)\}/g)) {
      expect(m[2]).not.toMatch(/clip-path|overflow|outline/);
    }
  }
  // La línia d'ajuda de davall conserva el seu color també amb el botó (components.css).
  expect(net(llig('src/css/components.css'))).toContain('.hero-image > .sdp-hero__obridor + .sdp-camp > .sdp-camp__ajuda, .hero-image > img + .sdp-camp > .sdp-camp__ajuda {');
});
