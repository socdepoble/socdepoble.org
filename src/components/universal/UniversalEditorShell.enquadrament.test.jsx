import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

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
import { UniversalEditorShell } from './UniversalEditorShell.jsx';

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
  // 800×400 en quadrat: el quadrat central, sense ampliar.
  expect(dobles.exportaRetall).toHaveBeenCalledWith({}, { x: 200, y: 0, w: 400, h: 400 }, { amplada: 400, alcada: 400, tipus: 'image/jpeg' });
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
