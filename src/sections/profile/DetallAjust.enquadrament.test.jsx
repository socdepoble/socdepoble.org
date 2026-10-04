/* Onada 4 · T3 (RETALLADOR.txt §3) · L'ajust d'imatge de DetallAjust passa pel
 * mateix retallador en quadrat que la fitxa (useEnquadramentAvatar) abans de la
 * pujada de sempre. jsdom no té canvas: la frontera amb el navegador
 * (imatgeCanvas.js), compressImage i el fetch del data URL se simulen. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn() }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({
  useSession: () => ({ logout: vi.fn(), preparaEixida: vi.fn(async () => []) }),
}));
const dobles = vi.hoisted(() => ({ carregaImatge: vi.fn(), exportaRetall: vi.fn(), compressImage: vi.fn() }));
vi.mock('../../components/universal/enquadrament/imatgeCanvas.js', () => ({
  carregaImatge: dobles.carregaImatge,
  dibuixaVisor: () => true,
  exportaRetall: dobles.exportaRetall,
}));
vi.mock('../../utils/imageUtils.js', () => ({ compressImage: dobles.compressImage }));
import DetallAjust from './DetallAjust.jsx';

const FOTO = Object.freeze({ id: 'avatar', lloc: 'fitxa', titol: 'Foto de perfil', camp: 'avatar_url', tipus: 'imatge', valor: '', obert: true });
const jo = Object.freeze({ id: 'jo', mena: 'persona', nom: 'Pep', dades: {} });
const RETALLADOR = { name: 'Enquadrar l’avatar' };
const MITJA = 'sdp-media://mitjans/t/u/avatars/a.webp';

beforeEach(() => {
  dobles.carregaImatge.mockReset().mockResolvedValue({ amplada: 900, alcada: 1200, tipus: 'image/jpeg', element: {}, allibera: vi.fn() });
  dobles.exportaRetall.mockReset().mockResolvedValue(new File(['y'], 'enquadrament.jpg', { type: 'image/jpeg' }));
  dobles.compressImage.mockReset().mockResolvedValue('data:image/webp;base64,AAAA');
  vi.stubGlobal('fetch', vi.fn(async () => ({ blob: async () => new Blob(['w'], { type: 'image/webp' }) })));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const munta = (pujaMitja) => render(<DetallAjust ajust={FOTO} identitat={jo} guardarAjust={vi.fn()} pujaMitja={pujaMitja} />);
const selector = () => screen.getByLabelText('Nou valor per a foto de perfil:');
async function tria(fitxer = new File(['x'], 'foto.jpg', { type: 'image/jpeg' })) {
  selector().focus();
  await act(async () => { fireEvent.change(selector(), { target: { files: [fitxer] } }); });
  await act(async () => {});
  return fitxer;
}
const desa = () => act(async () => {
  fireEvent.click(within(screen.getByRole('dialog', RETALLADOR)).getByRole('button', { name: 'Desar l’enquadrament' }));
});

test('Onada 4 · T3 · la foto obri el retallador en quadrat; desar puja UN fitxer, el retallat, a la carpeta de la persona', async () => {
  const pujaMitja = vi.fn(async () => MITJA);
  munta(pujaMitja);
  await tria();
  const retallador = screen.getByRole('dialog', RETALLADOR);
  expect(within(retallador).getAllByRole('radio').map((r) => r.value)).toEqual(['1:1']);
  expect(pujaMitja).not.toHaveBeenCalled();
  await desa();
  // 900×1200 en quadrat: el quadrat central de 900.
  expect(dobles.exportaRetall.mock.calls[0][1]).toEqual({ x: 0, y: 150, w: 900, h: 900 });
  const retallat = await dobles.exportaRetall.mock.results[0].value;
  expect(dobles.compressImage).toHaveBeenCalledTimes(1);
  expect(dobles.compressImage).toHaveBeenCalledWith(retallat, { maxSize: 600, format: 'image/webp', quality: 0.8 });
  expect(pujaMitja).toHaveBeenCalledTimes(1);
  const [fitxer, carpeta] = pujaMitja.mock.calls[0];
  expect(fitxer).toBeInstanceOf(File);
  expect(fitxer.name).toBe('avatar.webp');
  expect(carpeta).toBe('avatars');
  expect(screen.queryByRole('dialog', RETALLADOR)).toBeNull();
  expect(screen.getByRole('status').textContent).toBe('Imatge pujada. Ara dóna-li a Guardar.');
  expect(screen.getByAltText('Previsualització').getAttribute('src')).toBe(MITJA);
});

test('Onada 4 · T3 · cancel·lar no puja res i el focus torna al selector de fitxers', async () => {
  const pujaMitja = vi.fn(async () => MITJA);
  munta(pujaMitja);
  await tria();
  const retallador = screen.getByRole('dialog', RETALLADOR);
  within(retallador).getByLabelText('Ampliació').focus();
  await act(async () => { fireEvent.click(within(retallador).getByRole('button', { name: 'Cancel·lar' })); });
  expect(screen.queryByRole('dialog', RETALLADOR)).toBeNull();
  expect(pujaMitja).not.toHaveBeenCalled();
  expect(dobles.compressImage).not.toHaveBeenCalled();
  expect(screen.queryByAltText('Previsualització')).toBeNull();
  expect(document.activeElement).toBe(selector());
});

test('Onada 4 · T3 · si el servidor no torna adreça, l’avís ix dins del retallador (que continua obert) i al formulari', async () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  const pujaMitja = vi.fn(async () => null);
  munta(pujaMitja);
  await tria();
  await desa();
  const retallador = screen.getByRole('dialog', RETALLADOR);
  expect(within(retallador).getByRole('alert').textContent).toContain('No s\'ha pogut pujar la imatge al servidor.');
  expect(pujaMitja).toHaveBeenCalledTimes(1);
  expect(screen.queryByAltText('Previsualització')).toBeNull();
});

test('Onada 4 · T3 · un fitxer que no és imatge, o sense pujada al servidor: l’avís de sempre i cap retallador', async () => {
  const pujaMitja = vi.fn(async () => MITJA);
  const { unmount } = munta(pujaMitja);
  await tria(new File(['x'], 'nota.pdf', { type: 'application/pdf' }));
  expect(screen.getByRole('alert').textContent).toBe('Només imatges, de moment.');
  expect(screen.queryByRole('dialog', RETALLADOR)).toBeNull();
  unmount();
  munta(undefined);
  await tria();
  expect(screen.getByRole('alert').textContent).toBe('El servidor no admet pujada d\'imatges.');
  expect(screen.queryByRole('dialog', RETALLADOR)).toBeNull();
  expect(pujaMitja).not.toHaveBeenCalled();
});
