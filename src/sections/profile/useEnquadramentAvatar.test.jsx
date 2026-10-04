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
import { FORMAT_AVATAR, FORMATS_AVATAR, TITOL_ENQUADRAMENT_AVATAR, useEnquadramentAvatar } from './useEnquadramentAvatar.jsx';

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
