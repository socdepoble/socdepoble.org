import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { ETIQUETA_CONSERVA_EXIF } from './enquadrament/exifIncrustat.js';
import { dataOriginal, gpsTorre, jpegAmbExif } from './enquadrament/jpegProva.js';

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
import { AJUDA_FORMA_CAPCALERA, FORMATS_CAPCALERA, UniversalEditorShell } from './UniversalEditorShell.jsx';
import { ERROR_PRESSUPOST, QUALITAT_MINIMA } from '../../utils/pujadaImatge.js';

const CURT = 'data:image/webp;base64,AAAA';
const DESAR = 'Desar l’enquadrament';
const DIALEG = { name: 'Enquadrar la imatge' };
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

test('T46 · «Desar l’enquadrament» passa el retall pel camí de sempre i el focus va a la capçalera nova', async () => {
  const vista = closca();
  await tria(vista.container, foto());
  await act(async () => { fireEvent.click(vista.getByRole('button', { name: DESAR })); });
  /* 800×400 en quadrat: el quadrat central.
     Gauntlet 261016 (Bloc 1, Llei del Quadrat) · Actualitzada a posta: abans el
     retall ixia a la seua mida (400 × 400, sense ampliar); ara la capçalera ix
     a 1.200 × 1.200 exactes, la mateixa imatge que la targeta. */
  expect(dobles.exportaRetall).toHaveBeenCalledWith({}, { x: 200, y: 0, w: 400, h: 400 }, { amplada: 1200, alcada: 1200, tipus: 'image/jpeg' });
  const exportat = await dobles.exportaRetall.mock.results[0].value;
  expect(dobles.compressImage).toHaveBeenCalledWith(exportat, { maxSize: 1200, format: 'image/webp', quality: 0.8 });
  expect(vista.onSaveField).toHaveBeenCalledWith('heroImage', CURT, 'd1');
  expect(vista.queryByRole('dialog', DIALEG)).toBeNull();
  // El pare torna la capçalera desada: el focus hi va.
  await act(async () => { vista.rerender(arbre({ ...vista.props, heroImage: CURT })); });
  const imatge = vista.container.querySelector('img.sdp-hero__imatge');
  expect(imatge).not.toBeNull();
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
  expect(vista.onSaveField).toHaveBeenCalledWith('heroImage', CURT, 'd1');
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
  expect(dobles.compressImage).toHaveBeenCalledWith(exportat, { maxSize: 1200, format: 'image/webp', quality: 0.8, conservaExif: true, original: fitxer });
  expect(vista.onSaveField).toHaveBeenCalledWith('heroImage', CURT, 'd1');
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
   targeta són la MATEIXA imatge de 1.200 × 1.200. Abans el diàleg de la closca
   oferia «Original», «Apaisat» i «Panoràmic», i el retall ixia a la seua mida
   (compressImage només limita el costat llarg): la capçalera d'una nota podia
   ser de 1.200 × 675 i la targeta, una altra imatge. */
test('Bloc 1 · el diàleg de la capçalera només oferix el quadrat, amb la seua ajuda', async () => {
  const vista = closca();
  await tria(vista.container, foto());
  const dialeg = vista.getByRole('dialog', DIALEG);
  const formes = within(dialeg).getAllByRole('radio');
  expect(formes.map((r) => [r.value, r.checked])).toEqual([['1:1', true]]);
  expect(within(dialeg).getByRole('radio', { name: /^Quadrat \(1:1\)/ })).toBeTruthy();
  expect(within(dialeg).getByText(AJUDA_FORMA_CAPCALERA)).toBeTruthy();
  expect(within(dialeg).queryByRole('radio', { name: /Original|Apaisat|Panoràmic/ })).toBeNull();
  expect(FORMATS_CAPCALERA.map((f) => [f.valor, f.ratio])).toEqual([['1:1', 1]]);
  expect(Object.isFrozen(FORMATS_CAPCALERA) && Object.isFrozen(FORMATS_CAPCALERA[0])).toBe(true);
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

test('Bloc 1 · una capçalera apaïsada ja desada (1.200 × 675) es torna a enquadrar en quadrat, a 1.200 × 1.200', async () => {
  dobles.carregaImatge.mockResolvedValue({ amplada: 1200, alcada: 675, tipus: 'image/webp', element: {}, allibera: vi.fn() });
  const vista = closca({ heroImage: '/assets/h.webp' });
  await act(async () => {});
  fireEvent.click(vista.container.querySelector('img.sdp-hero__imatge'));
  await act(async () => { fireEvent.click(vista.getByRole('button', { name: 'Enquadrar' })); });
  await act(async () => { fireEvent.click(vista.getByRole('button', { name: DESAR })); });
  // Una adreça no diu el seu tipus abans de carregar-se: JPEG, com la capçalera del Perfil (configDeForma).
  expect(dobles.exportaRetall.mock.calls[0].slice(1)).toEqual([
    { x: 263, y: 0, w: 675, h: 675 },
    { amplada: 1200, alcada: 1200, tipus: 'image/jpeg' },
  ]);
  expect(vista.onSaveField).toHaveBeenCalledWith('heroImage', CURT, 'd1');
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
