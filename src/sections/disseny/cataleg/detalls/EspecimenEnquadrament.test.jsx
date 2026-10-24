/* Onada 4 · T3 · l'espècimen del retallador (sdp-pedra-seca §9): la capçalera
   de T46 i el cas de l'avatar, només en quadrat, amb l'avatar de veres de la
   IAIA (el fitxer del repositori, sense tocar-lo). jsdom no té canvas: la
   frontera amb el navegador (imatgeCanvas.js) se simula. Sense h1, sense
   style= i sense cap avís de React. */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const dobles = vi.hoisted(() => ({ carregaImatge: vi.fn(), exportaRetall: vi.fn() }));
vi.mock('../../../../components/universal/enquadrament/imatgeCanvas.js', () => ({
  carregaImatge: dobles.carregaImatge,
  dibuixaVisor: () => true,
  exportaRetall: dobles.exportaRetall,
}));
import { MemoryRouter } from '../../../../app/contexts/RouterContext.jsx';
import EspecimenEnquadrament from './EspecimenEnquadrament.jsx';
import { dataOriginal, gpsTorre, jpegAmbExif, orientacio } from '../../../../components/universal/enquadrament/jpegProva.js';

const IAIA = '/assets/fotos/iaia-maria.png';
let errors;
beforeEach(() => {
  errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  dobles.carregaImatge.mockReset().mockResolvedValue({ amplada: 1024, alcada: 1024, tipus: 'image/png', element: {}, allibera: vi.fn() });
  dobles.exportaRetall.mockReset().mockResolvedValue(new File(['y'], 'enquadrament.png', { type: 'image/png' }));
  // jsdom no porta objectURL: la vista del resultat en necessita una.
  URL.createObjectURL = vi.fn(() => 'blob:prova');
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => {
  const crides = errors.mock.calls.map((c) => String(c[0]).slice(0, 200));
  errors.mockRestore();
  cleanup();
  delete URL.createObjectURL;
  delete URL.revokeObjectURL;
  expect(crides).toEqual([]);
});

const munta = () => render(<MemoryRouter><EspecimenEnquadrament /></MemoryRouter>);

it('pinta la capçalera, l’avatar i la geolocalització voluntària, amb l’avatar d’avui de la IAIA', () => {
  const { container } = munta();
  expect(container.querySelector('h1')).toBeNull();
  expect(container.querySelector('[style]')).toBeNull();
  expect([...container.querySelectorAll('.sdp-especimen h4')].map((h) => h.textContent).slice(0, 3))
    .toEqual(['Capçalera', 'Avatar: només quadrat', 'Geolocalització voluntària']);
  expect(screen.getByAltText('IAIA MarIA').getAttribute('src')).toBe(IAIA);
  // Tancat, cap diàleg muntat.
  expect(container.querySelector('dialog')).toBeNull();
});

it('«Enquadrar l’avatar de la IAIA» obri el retallador de l’avatar: només el quadrat, amb la imatge del repositori', async () => {
  munta();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Enquadrar l’avatar de la IAIA' })); });
  await act(async () => {});
  const dialeg = screen.getByRole('dialog', { name: 'Enquadrar l’avatar' });
  expect(within(dialeg).getAllByRole('radio').map((r) => r.value)).toEqual(['1:1']);
  expect(dobles.carregaImatge).toHaveBeenCalledWith(IAIA, expect.objectContaining({ signal: expect.any(Object) }));
  // Ampliada, el retall ix com a resultat (sense pujar res).
  act(() => { fireEvent.change(within(dialeg).getByLabelText('Ampliació'), { target: { value: '2' } }); });
  await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Desar l’enquadrament' })); });
  expect(dobles.exportaRetall.mock.calls[0][1]).toEqual({ x: 256, y: 256, w: 512, h: 512 });
  /* Gauntlet 261016 (Bloc 1, Llei del Quadrat) · El retall ix a 400 × 400
     exactes (sortidaAvatar), també d'una adreça (en JPEG: no en sap el tipus
     abans de carregar-la). Abans, a la mida del retall (512 × 512). */
  expect(dobles.exportaRetall.mock.calls[0][2]).toEqual({ amplada: 400, alcada: 400, tipus: 'image/jpeg' });
  expect(screen.queryByRole('dialog', { name: 'Enquadrar l’avatar' })).toBeNull();
  expect(screen.getByAltText('L’avatar enquadrat')).toBeTruthy();
  /* Gauntlet 261016 (Bloc 1, Llei del Quadrat) · Actualitzada a posta: el peu
     diu la mida exacta que ix del retallador (400 × 400, MIDA_AVATAR), i que
     la compressió ja no la torna a reduir. Abans deia «fins a 400 px» (i, abans
     encara, els 600 del logotip). */
  const peu = screen.getByText(/forma 1:1/).textContent;
  expect(peu).toContain('400 × 400 px exactes, forma 1:1');
  expect(peu).toContain('compressió de l’avatar (WebP, 400 × 400 px, sense tornar-lo a reduir)');
  expect(peu).not.toContain('600');
  expect(peu).not.toContain('fins a');
});

/* Onada 4 · revisió adversarial (K1) · Els selectors de fitxers amagats, en l'ordre de l'espècimen. */
const selectors = (container) => [...container.querySelectorAll('input[type="file"]')];
async function triaFitxer(input, fitxer) {
  await act(async () => { fireEvent.change(input, { target: { files: [fitxer] } }); });
  await act(async () => {});
}

it('K1 · geolocalització: el resultat ensenya les coordenades que arriben com a tercer argument (metadades.geolocalitzacio)', async () => {
  const { container } = munta();
  const foto = new File([jpegAmbExif({ ifd0: [orientacio(1)], exif: dataOriginal('2017:05:14 10:22:33', '+02:00'), gps: gpsTorre() })],
    'arbre.jpg', { type: 'image/jpeg' });
  await triaFitxer(selectors(container)[2], foto);
  const dialeg = screen.getByRole('dialog', { name: 'Enquadrar la imatge' });
  await act(async () => { fireEvent.click(within(dialeg).getByRole('checkbox', { name: /Vull geolocalitzar aquesta imatge/ })); });
  await act(async () => {}); // la lectura del Blob
  expect(within(dialeg).getByLabelText('Latitud').value).toBe('38.5919');
  await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Desar l’enquadrament' })); });
  const peu = screen.getByAltText('El resultat de l’enquadrament amb l’opció de geolocalitzar').closest('figure').textContent;
  expect(peu).toContain('coordenades 38.59, -0.42 (uns 1.000 m), llegides de l’original');
  expect(peu).toContain('presa el 2017-05-14T10:22:33+02:00');
  expect(peu).not.toContain('Cap coordenada');
  // Amb la geolocalització, «sencera» també es recodifica: el peu no ha de dir el contrari.
  expect(dobles.exportaRetall).toHaveBeenCalledTimes(1);
  expect(peu).not.toContain('sense tornar-la a codificar');
});

it('K1 · el peu només diu «sense tornar-la a codificar» quan el fitxer és de veres l’original (capçalera T46), mai a l’avatar', async () => {
  const { container } = munta();
  const quadrada = () => new File(['x'], 'quadrada.png', { type: 'image/png' });
  // Capçalera (T46): quadrada, sense ampliar → el mateix File.
  await triaFitxer(selectors(container)[0], quadrada());
  await act(async () => { fireEvent.click(within(screen.getByRole('dialog', { name: 'Enquadrar la imatge' })).getByRole('button', { name: 'Desar l’enquadrament' })); });
  expect(dobles.exportaRetall).not.toHaveBeenCalled();
  expect(screen.getByAltText('El resultat de l’enquadrament').closest('figure').textContent)
    .toContain('1024 × 1024 px, forma 1:1, 1 KB (la foto sencera, sense tornar-la a codificar)');
  // Avatar: una foto nova ix sempre recodificada del retallador.
  await triaFitxer(selectors(container)[1], quadrada());
  await act(async () => { fireEvent.click(within(screen.getByRole('dialog', { name: 'Enquadrar l’avatar' })).getByRole('button', { name: 'Desar l’enquadrament' })); });
  expect(dobles.exportaRetall).toHaveBeenCalledTimes(1);
  /* Gauntlet 261016 (Bloc 1, Llei del Quadrat) · Actualitzada a posta: la
     foto sencera de 1024 px ix a 400 × 400 exactes (abans, 1024 × 1024), en
     PNG com el camí T46, i el peu diu la mida de veres. */
  expect(dobles.exportaRetall.mock.calls[0][2]).toEqual({ amplada: 400, alcada: 400, tipus: 'image/png' });
  const peuAvatar = screen.getByAltText('L’avatar enquadrat').closest('figure').textContent;
  expect(peuAvatar).toContain('400 × 400 px exactes, forma 1:1');
  expect(peuAvatar).not.toContain('sense tornar-la a codificar');
});

/* Gauntlet 261016 (Bloc 1, Llei del Quadrat, i Bloc 1.2, mandat de l'EXIF) ·
   El catàleg encara deia «capçalera 1.200 × 675 / 16:9» i «fins a 400 px», i
   no documentava la casella de l'EXIF (ofereixConservarExif) ni la clau
   metadades.exif d'onDesa.
   Directiva del Mestre (261024, àudio 22:47) · Actualitzada a posta: la
   capçalera ja no és quadrada per força. El contracte diu la forma lliure
   (el quadrat de sèrie) i la seua eixida, 1.200 pel costat llarg
   (sortida.costatLlarg), i ja no la diu quadrada de 1.200 × 1.200. */
it('Directiva 261024 · el contracte diu la capçalera de forma lliure (1.200 pel costat llarg), l’avatar de 400 × 400 i la casella de l’EXIF', () => {
  const { container } = munta();
  const text = container.textContent;
  expect(text).not.toMatch(/capçalera quadrada|la capçalera, 1\.200 × 1\.200|només oferix el quadrat|capçalera 16:9/);
  expect(text).toContain('sortida.costatLlarg');
  expect(text).toContain('la capçalera, 1.200 pel costat llarg (1.200 × 1.200 en quadrat, 1.200 × 675 en 16:9, 675 × 1.200 en 9:16)');
  expect(text).toContain("'1:1' | 'original' | '4:3' | '3:2' | '16:9' | '21:9' | '4:5' | '3:4' | '9:16'");
  expect(text).toContain('l’avatar, 400 × 400');
  expect(text).toContain('ofereixConservarExif');
  expect(text).toContain('metadades.exif: { conservaExif: true, original } (marcada) o { conservaExif: false } (desmarcada)');
  expect(text).toContain('Conserva la ubicació i la data de la foto');
  expect(screen.getByRole('button', { name: 'Capçalera de forma lliure (1.200 pel costat llarg)' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: /Capçalera quadrada|16:9/ })).toBeNull();
});
