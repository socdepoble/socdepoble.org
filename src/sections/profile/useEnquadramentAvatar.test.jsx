import { act, cleanup, render, screen, within, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/* Onada 4 · T3 · el retallador de l'avatar. jsdom no té canvas: la frontera
   amb el navegador (imatgeCanvas.js) se simula. */
const dobles = vi.hoisted(() => ({ carregaImatge: vi.fn(), exportaRetall: vi.fn() }));
vi.mock('../../components/universal/enquadrament/imatgeCanvas.js', () => ({
  carregaImatge: dobles.carregaImatge,
  dibuixaVisor: () => true,
  exportaRetall: dobles.exportaRetall,
}));
import {
  EXACTA_AVATAR, FORMAT_AVATAR, FORMATS_AVATAR, TITOL_ENQUADRAMENT_AVATAR, sortidaAvatar, useEnquadramentAvatar,
} from './useEnquadramentAvatar.jsx';

beforeEach(() => {
  dobles.carregaImatge.mockReset().mockResolvedValue({ amplada: 1000, alcada: 500, tipus: 'image/png', element: {}, allibera: vi.fn() });
  dobles.exportaRetall.mockReset().mockResolvedValue(new File(['y'], 'enquadrament.png', { type: 'image/png' }));
});
afterEach(cleanup);

/* Un consumidor mínim: el que obri, el que puja i el diàleg. */
function Prova({ onEnquadrat, onError, font }) {
  const enquadrament = useEnquadramentAvatar({ onEnquadrat, onError });
  return (
    <>
      <button type="button" onClick={() => enquadrament.obri(font)}>Canvia la foto</button>
      <output>{enquadrament.obert ? 'obert' : 'tancat'}</output>
      {enquadrament.dialeg}
    </>
  );
}

const obri = async () => {
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Canvia la foto' })); });
  await act(async () => {});
};

test('Onada 4 · T3 · l’avatar només té una forma: el quadrat del model, amb una ajuda pròpia', () => {
  expect(FORMAT_AVATAR).toBe('1:1');
  expect(FORMATS_AVATAR).toHaveLength(1);
  expect(FORMATS_AVATAR[0]).toMatchObject({ valor: '1:1', ratio: 1, etiqueta: 'Quadrat (1:1)' });
  expect(FORMATS_AVATAR[0].ajuda).toContain('L’avatar sempre és quadrat');
  expect(Object.isFrozen(FORMATS_AVATAR) && Object.isFrozen(FORMATS_AVATAR[0])).toBe(true);
});

test('Onada 4 · T3 · una foto que no es pot processar avisa i no obri res', async () => {
  const onError = vi.fn();
  render(<Prova font={new File(['x'], 'nota.pdf', { type: 'application/pdf' })} onEnquadrat={vi.fn()} onError={onError} />);
  await obri();
  expect(onError).toHaveBeenCalledWith('Només imatges, de moment.');
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.getByRole('status').textContent).toBe('tancat');
});

test('Onada 4 · T3 · una adreça ja resolta (l’espècimen) s’obri sense validar-la com a fitxer', async () => {
  const onError = vi.fn();
  render(<Prova font="/assets/fotos/iaia-maria.png" onEnquadrat={vi.fn()} onError={onError} />);
  await obri();
  expect(onError).not.toHaveBeenCalled();
  expect(screen.getByRole('dialog', { name: TITOL_ENQUADRAMENT_AVATAR })).toBeTruthy();
  expect(dobles.carregaImatge).toHaveBeenCalledWith('/assets/fotos/iaia-maria.png', expect.objectContaining({ signal: expect.any(Object) }));
});

/* Onada 4 (retallador senzill, 261008) · Ara és un embolcall de
   useEnquadramentImatge: els seus consumidors (DetallAjust, el diàleg
   intermedi i l'espècimen) continuen veient el retallador T46, no la finestra
   senzilla de la fitxa del Perfil. */
test('Onada 4 · l’embolcall conserva el retallador T46: «Desar l’enquadrament», la X i la Forma; cap fila de zoom ni màscara', async () => {
  render(<Prova font={new File(['x'], 'foto.png', { type: 'image/png' })} onEnquadrat={vi.fn()} />);
  await obri();
  const dialeg = screen.getByRole('dialog', { name: TITOL_ENQUADRAMENT_AVATAR });
  expect(within(dialeg).getByRole('button', { name: 'Desar l’enquadrament' })).toBeTruthy();
  expect(within(dialeg).getByRole('button', { name: 'Tancar' })).toBeTruthy();
  expect(within(dialeg).getByLabelText('Posició horitzontal')).toBeTruthy();
  expect(dialeg.querySelector('legend').textContent).toBe('Forma');
  expect(dialeg.querySelector('.sdp-enquadrament__zoom')).toBeNull();
  expect(dialeg.querySelector('.sdp-enquadrament__visor-caixa')).toBeNull();
  expect(within(dialeg).queryByRole('button', { name: 'Guardar' })).toBeNull();
});

test('Onada 4 · T3 · desar passa el retall a onEnquadrat i, si acaba bé, tanca; si llança, l’avís ix dins i continua obert', async () => {
  const onEnquadrat = vi.fn().mockRejectedValueOnce(new Error('Sense xarxa.')).mockResolvedValueOnce(undefined);
  render(<Prova font={new File(['x'], 'foto.png', { type: 'image/png' })} onEnquadrat={onEnquadrat} />);
  await obri();
  const dialeg = screen.getByRole('dialog', { name: TITOL_ENQUADRAMENT_AVATAR });
  await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Desar l’enquadrament' })); });
  expect(within(dialeg).getByRole('alert').textContent).toContain('Sense xarxa.');
  expect(screen.getByRole('status').textContent).toBe('obert');
  await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Desar l’enquadrament' })); });
  expect(onEnquadrat).toHaveBeenCalledTimes(2);
  const [fitxer, info] = onEnquadrat.mock.calls[1];
  expect(fitxer.name).toBe('enquadrament.png');
  expect(info).toMatchObject({ format: '1:1', rect: { x: 250, y: 0, w: 500, h: 500 }, sencera: false });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.getByRole('status').textContent).toBe('tancat');
});

/* Gauntlet 261016 (Bloc 1, Llei del Quadrat: «avatars, quadrat de 400 × 400
   px») · Abans sortidaAvatar exportava fins a 1.200 px (MIDA_SORTIDA) i una
   adreça no en tenia (null): el retall ixia a la seua mida. Ara, 400 × 400
   exactes (MIDA_AVATAR), amb el tipus del camí T46. */
test('Bloc 1 · sortidaAvatar: 400 × 400 exactes, amb el tipus del camí T46 (una adreça, JPEG)', () => {
  const exacta = { amplada: 400, alcada: 400 };
  expect(EXACTA_AVATAR).toEqual(exacta);
  expect(Object.isFrozen(EXACTA_AVATAR)).toBe(true);
  expect(sortidaAvatar(new File(['x'], 'logo.png', { type: 'image/png' }))).toEqual({ ampladaMaxima: 400, format: 'image/png', exacta });
  expect(sortidaAvatar(new File(['x'], 'foto.jpg', { type: 'image/jpeg' }))).toEqual({ ampladaMaxima: 400, format: 'image/jpeg', exacta });
  expect(sortidaAvatar('/assets/fotos/iaia-maria.png')).toEqual({ ampladaMaxima: 400, format: 'image/jpeg', exacta });
});

test('Bloc 1 · una adreça ja resolta retallada ix a 400 × 400 exactes; desada sencera, no hi ha res a desar (T46)', async () => {
  const onEnquadrat = vi.fn();
  render(<Prova font="/assets/fotos/iaia-maria.png" onEnquadrat={onEnquadrat} />);
  await obri();
  // 1000×500 en quadrat: el retall no és la foto sencera.
  await act(async () => { fireEvent.click(within(screen.getByRole('dialog', { name: TITOL_ENQUADRAMENT_AVATAR })).getByRole('button', { name: 'Desar l’enquadrament' })); });
  expect(dobles.exportaRetall.mock.calls[0].slice(1)).toEqual([{ x: 250, y: 0, w: 500, h: 500 }, { amplada: 400, alcada: 400, tipus: 'image/jpeg' }]);
  expect(onEnquadrat).toHaveBeenCalledTimes(1);
  cleanup();
  dobles.exportaRetall.mockClear();
  dobles.carregaImatge.mockResolvedValue({ amplada: 800, alcada: 800, tipus: 'image/png', element: {}, allibera: vi.fn() });
  const sencera = vi.fn();
  render(<Prova font="/assets/fotos/iaia-maria.png" onEnquadrat={sencera} />);
  await obri();
  await act(async () => { fireEvent.click(within(screen.getByRole('dialog', { name: TITOL_ENQUADRAMENT_AVATAR })).getByRole('button', { name: 'Desar l’enquadrament' })); });
  expect(dobles.exportaRetall).not.toHaveBeenCalled();
  expect(sencera).not.toHaveBeenCalled();
  expect(screen.queryByRole('dialog')).toBeNull();
});
