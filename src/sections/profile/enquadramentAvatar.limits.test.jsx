/* Onada 4 · revisió adversarial (K2) · Límits de pes als fluxos amb retallador.
 * La pujada de sempre talla a 5 MB (MIDA_MAXIMA_IMATGE) i el retallador admet
 * 25 MB (PES_MAXIM_ENTRADA). Abans, l'avatar validava l'ENTRADA amb els 5 MB:
 * una foto de mòbil de 6-8 MB no arribava mai al retallador. Ara:
 *   · l'entrada d'un flux amb retallador es valida amb el límit del retallador;
 *   · el que ix del retallador continua passant pels 5 MB de sempre;
 *   · «Només la capçalera» (sense retallador) no canvia: 5 MB.
 * Onada 4 (retallador senzill, 261008) · La fitxa del Perfil ja no munta
 * DialegCapcaleraAvatar: els seus botons (useImatgeDeFitxa) admeten 10 MB i
 * el retall que ix, també. DialegCapcaleraAvatar i DetallAjust conserven els
 * seus límits (les proves de dalt i de davall).
 * useHeroImageHandler, useEnquadramentAvatar, DialegEnquadrament i
 * DialegCapcaleraAvatar són reals; jsdom no té canvas: la frontera
 * (imatgeCanvas.js), compressImage i el fetch del data URL se simulen. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
vi.mock('../../app/contexts/RouterContext', () => ({ Link: 'a', useNavigate: () => vi.fn() }));
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
import { DialegCapcaleraAvatar } from './DialegCapcaleraAvatar.jsx';
import DetallAjust from './DetallAjust.jsx';
import { useImatgeDeFitxa } from './useImatgeDeFitxa.jsx';
import { MIDA_MAXIMA_IMATGE } from '../../hooks/useHeroImageHandler.js';
import { PES_MAXIM_ENTRADA } from '../../components/universal/enquadrament/limits.js';
import { AJUDA_FOTO, ERROR_PES_FOTO, PES_MAXIM_FOTO } from '../../components/universal/enquadrament/useEnquadramentImatge.jsx';

const MB = 1024 * 1024;
const RETALLADOR = { name: 'Enquadrar l’avatar' };
const URL_MITJA = 'sdp-media://mitjans/t/u/avatars/a.webp';
const ERROR_5MB = 'La imatge passa de 5 MB. És massa pesada per processar-la.';
const ERROR_25MB = 'La imatge passa de 25 MB. És massa pesada per processar-la.';

/** Una foto de `mb` megabytes (només la mida: el contingut no es llig). */
function foto(mb, nom = 'IMG_2041.jpg', tipus = 'image/jpeg') {
  const fitxer = new File(['x'], nom, { type: tipus });
  Object.defineProperty(fitxer, 'size', { value: Math.round(mb * MB) });
  return fitxer;
}
const retallat = (mb = 0.3) => foto(mb, 'enquadrament.jpg');

beforeEach(() => {
  dobles.carregaImatge.mockReset().mockResolvedValue({ amplada: 4000, alcada: 3000, tipus: 'image/jpeg', element: {}, allibera: vi.fn() });
  dobles.exportaRetall.mockReset().mockImplementation(async () => retallat());
  dobles.compressImage.mockReset().mockResolvedValue('data:image/webp;base64,AAAA');
  vi.stubGlobal('fetch', vi.fn(async () => ({ blob: async () => new Blob(['w'], { type: 'image/webp' }) })));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test('els dos límits són els que diu la doctrina: 5 MB la pujada i 25 MB el retallador', () => {
  expect(MIDA_MAXIMA_IMATGE).toBe(5 * MB);
  expect(PES_MAXIM_ENTRADA).toBe(25 * MB);
});

/* ── La fitxa del Perfil (DialegCapcaleraAvatar) ── */

function obriFitxa() {
  const p = { onTanca: vi.fn(), onDesaCamp: vi.fn(), onError: vi.fn(), onImageUpload: vi.fn(async () => URL_MITJA) };
  const vista = render(<DialegCapcaleraAvatar obert {...p} />);
  return { ...vista, ...p };
}
async function tria(vista, desti, fitxer) {
  fireEvent.click(screen.getByRole('radio', { name: desti }));
  await act(async () => {
    fireEvent.change(vista.container.querySelector('input[type="file"]'), { target: { files: [fitxer] } });
  });
  await act(async () => {});
}
const desa = () => act(async () => {
  fireEvent.click(within(screen.getByRole('dialog', RETALLADOR)).getByRole('button', { name: 'Desar l’enquadrament' }));
});

test('K2 · «Només l’avatar» amb una foto de mòbil de 7 MB: arriba al retallador i puja el retall', async () => {
  const vista = obriFitxa();
  const original = foto(7);
  await tria(vista, 'Només l’avatar', original);
  expect(vista.onError).not.toHaveBeenCalled();
  expect(screen.getByRole('dialog', RETALLADOR)).toBeTruthy();
  await desa();
  expect(dobles.exportaRetall).toHaveBeenCalledTimes(1);
  expect(dobles.exportaRetall.mock.calls[0].slice(1)).toEqual([
    { x: 500, y: 0, w: 3000, h: 3000 },
    { amplada: 1200, alcada: 1200, tipus: 'image/jpeg' },
  ]);
  const ix = await dobles.exportaRetall.mock.results[0].value;
  expect(dobles.compressImage.mock.calls.map(([f, o]) => [f, o.maxSize])).toEqual([[ix, 600]]);
  expect(vista.onImageUpload).toHaveBeenCalledTimes(1);
  expect(vista.onDesaCamp.mock.calls).toEqual([['logoImage', URL_MITJA]]);
  expect(vista.onTanca).toHaveBeenCalledWith('desat');
});

test('K2 · una foto QUADRADA desada sense ampliar també ix recodificada del retallador: mai l’original de 7 MB', async () => {
  dobles.carregaImatge.mockResolvedValue({ amplada: 3000, alcada: 3000, tipus: 'image/jpeg', element: {}, allibera: vi.fn() });
  const vista = obriFitxa();
  const original = foto(7);
  await tria(vista, 'Només l’avatar', original);
  await desa();
  // Sencera, però recodificada amb el mateix tipus i la mateixa mida que el camí T46.
  expect(dobles.exportaRetall.mock.calls[0].slice(1)).toEqual([
    { x: 0, y: 0, w: 3000, h: 3000 },
    { amplada: 1200, alcada: 1200, tipus: 'image/jpeg' },
  ]);
  expect(dobles.compressImage).toHaveBeenCalledTimes(1);
  expect(dobles.compressImage.mock.calls[0][0]).not.toBe(original);
  expect(vista.onError).not.toHaveBeenCalled();
  expect(vista.onDesaCamp.mock.calls).toEqual([['logoImage', URL_MITJA]]);
});

test('K2 · un PNG (logotip amb transparència) ix en PNG del retallador, com al camí T46', async () => {
  dobles.carregaImatge.mockResolvedValue({ amplada: 800, alcada: 800, tipus: 'image/png', element: {}, allibera: vi.fn() });
  const vista = obriFitxa();
  await tria(vista, 'Només l’avatar', foto(1, 'logo.png', 'image/png'));
  await desa();
  expect(dobles.exportaRetall.mock.calls[0][2]).toEqual({ amplada: 800, alcada: 800, tipus: 'image/png' });
});

test('K2 · «La mateixa per a les dues» amb 7 MB: la capçalera puja l’original acceptat pel retallador i l’avatar, el retall', async () => {
  const vista = obriFitxa();
  const original = foto(7);
  await tria(vista, 'La mateixa per a les dues', original);
  expect(vista.onError).not.toHaveBeenCalled();
  await desa();
  const ix = await dobles.exportaRetall.mock.results[0].value;
  expect(dobles.compressImage.mock.calls.map(([f, o]) => [f, o.maxSize])).toEqual([[original, 1200], [ix, 600]]);
  expect(vista.onImageUpload).toHaveBeenCalledTimes(2);
  expect(vista.onDesaCamp.mock.calls.map(([camp]) => camp)).toEqual(['heroImage', 'logoImage']);
  expect(vista.onTanca).toHaveBeenCalledWith('desat');
});

test('K2 · «Només la capçalera» (sense retallador) no canvia: 7 MB es rebutja amb l’avís de 5 MB', async () => {
  const vista = obriFitxa();
  await tria(vista, 'Només la capçalera', foto(7));
  expect(vista.onError).toHaveBeenCalledWith(ERROR_5MB);
  expect(screen.queryByRole('dialog', RETALLADOR)).toBeNull();
  expect(dobles.compressImage).not.toHaveBeenCalled();
  expect(vista.onImageUpload).not.toHaveBeenCalled();
});

test('K2 · més de 25 MB: l’avís del límit del retallador i cap retallador', async () => {
  const vista = obriFitxa();
  await tria(vista, 'Només l’avatar', foto(26));
  expect(vista.onError).toHaveBeenCalledWith(ERROR_25MB);
  expect(screen.queryByRole('dialog', RETALLADOR)).toBeNull();
  expect(dobles.carregaImatge).not.toHaveBeenCalled();
});

test('K2 · el que IX del retallador continua limitat a 5 MB: un retall de 6 MB no puja i l’avís ix dins', async () => {
  dobles.exportaRetall.mockImplementation(async () => retallat(6));
  const vista = obriFitxa();
  await tria(vista, 'Només l’avatar', foto(7));
  await desa();
  expect(within(screen.getByRole('dialog', RETALLADOR)).getByRole('alert').textContent).toBe(ERROR_5MB);
  expect(dobles.compressImage).not.toHaveBeenCalled();
  expect(vista.onImageUpload).not.toHaveBeenCalled();
  expect(vista.onDesaCamp).not.toHaveBeenCalled();
});

/* ── La fitxa del Perfil, Onada 4 (retallador senzill, 261008) ──
   Ja no passa pel diàleg intermedi: cada botó (useImatgeDeFitxa) admet fins a
   10 MB i el retall que ix passa pel mateix límit, no pels 5 MB de sempre.
   Correcció de la revisió (261008) · Ací només es comprova que el límit i el
   text que el diu (AJUDA_FOTO) coincidixen. Que cada botó el diga abans de
   triar es comprova botó a botó a PerfilEditor.imatges.test.jsx (amb les
   proves [DEFECTE] dels que encara no el diuen). */

function Fitxa({ camp, forma, ...p }) {
  const imatge = useImatgeDeFitxa({ camp, forma, ...p });
  return <>{imatge.input}{imatge.dialeg}</>;
}
function obriFitxaNova(camp = 'logoImage', forma = 'avatar') {
  const p = { onDesaCamp: vi.fn(), onError: vi.fn(), onImageUpload: vi.fn(async () => URL_MITJA) };
  const vista = render(<Fitxa camp={camp} forma={forma} {...p} />);
  return { ...vista, ...p };
}
async function triaNova(vista, fitxer) {
  await act(async () => {
    fireEvent.change(vista.container.querySelector('input[type="file"]'), { target: { files: [fitxer] } });
  });
  await act(async () => {});
}

test('Onada 4 · el límit de la fitxa és de 10 MB i el text d’ajuda (AJUDA_FOTO) diu el mateix límit i els mateixos formats', () => {
  expect(PES_MAXIM_FOTO).toBe(10 * MB);
  expect(AJUDA_FOTO).toBe('PNG, JPEG o WebP, fins a 10 MB.');
  expect(AJUDA_FOTO).toContain(`${PES_MAXIM_FOTO / MB} MB`);
});

test('Onada 4 · una foto de mòbil de 9 MB arriba al retall de l’avatar i en puja UN fitxer, el retallat', async () => {
  const vista = obriFitxaNova();
  const original = foto(9);
  await triaNova(vista, original);
  expect(vista.onError).not.toHaveBeenCalled();
  await act(async () => {
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Retalla la foto' })).getByRole('button', { name: 'Guardar' }));
  });
  const ix = await dobles.exportaRetall.mock.results[0].value;
  expect(dobles.compressImage.mock.calls.map(([f, o]) => [f, o.maxSize])).toEqual([[ix, 600]]);
  expect(dobles.compressImage.mock.calls[0][0]).not.toBe(original);
  expect(vista.onImageUpload).toHaveBeenCalledTimes(1);
  expect(vista.onDesaCamp.mock.calls).toEqual([['logoImage', URL_MITJA]]);
});

test('Onada 4 · més de 10 MB (11 MB, que abans el retallador admetia): l’avís de la fitxa i cap retall', async () => {
  const vista = obriFitxaNova('heroImage', 'capcalera');
  await triaNova(vista, foto(11));
  expect(vista.onError).toHaveBeenCalledWith(ERROR_PES_FOTO);
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(dobles.carregaImatge).not.toHaveBeenCalled();
});

test('Onada 4 · el retall que ix de la fitxa passa pel límit de 10 MB, no pels 5 de sempre: un de 6 MB puja', async () => {
  dobles.exportaRetall.mockImplementation(async () => retallat(6));
  const vista = obriFitxaNova('heroImage', 'capcalera');
  await triaNova(vista, foto(8));
  await act(async () => {
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Retalla la capçalera' })).getByRole('button', { name: 'Guardar' }));
  });
  expect(screen.queryByRole('alert')).toBeNull();
  expect(vista.onImageUpload).toHaveBeenCalledTimes(1);
  expect(vista.onDesaCamp.mock.calls).toEqual([['heroImage', URL_MITJA]]);
});

/* ── L'ajust d'imatge (DetallAjust) ── */

test('K2 · DetallAjust: una foto de 7 MB arriba al retallador i puja un sol fitxer', async () => {
  const ajust = { id: 'avatar', lloc: 'fitxa', titol: 'Foto de perfil', camp: 'avatar_url', tipus: 'imatge', valor: '', obert: true };
  const pujaMitja = vi.fn(async () => URL_MITJA);
  render(<DetallAjust ajust={ajust} identitat={{ id: 'jo', mena: 'persona', nom: 'Pep', dades: {} }} guardarAjust={vi.fn()} pujaMitja={pujaMitja} />);
  await act(async () => {
    fireEvent.change(screen.getByLabelText('Nou valor per a foto de perfil:'), { target: { files: [foto(7)] } });
  });
  await act(async () => {});
  expect(screen.getByRole('dialog', RETALLADOR)).toBeTruthy();
  await desa();
  expect(pujaMitja).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('dialog', RETALLADOR)).toBeNull();
});
