/* Onada 4 · revisió adversarial (K2) · Límits de pes als fluxos amb retallador.
 * La pujada de sempre talla a 5 MB (MIDA_MAXIMA_IMATGE) i el retallador admet
 * 25 MB (PES_MAXIM_ENTRADA). Abans, l'avatar validava l'ENTRADA amb els 5 MB:
 * una foto de mòbil de 6-8 MB no arribava mai al retallador. Ara:
 *   · l'entrada d'un flux amb retallador es valida amb el límit del retallador;
 *   · el que ix del retallador continua passant pels 5 MB de sempre;
 *   · «Només la capçalera» (sense retallador) no canvia: 5 MB.
 * Onada 4 (retallador senzill, 261008) · La fitxa del Perfil ja no munta
 * DialegCapcaleraAvatar: els seus botons (useImatgeDeFitxa) admeten 10 MB i
 * el retall que ix, també.
 * Onada 6 (verificació, 261009) · DialegCapcaleraAvatar ja no existix
 * (261008) i esta prova l'importava: el fitxer no carregava. Les regles K2
 * del retallador T46 de l'avatar es comproven ara on el munta el Perfil,
 * l'ajust d'imatge (DetallAjust, via useEnquadramentAvatar). Les assercions
 * del retallador (rectangle, mida i tipus del retall, el que es comprimix) són
 * les mateixes; les del diàleg es lligen a la sortida de DetallAjust: l'avís
 * en línia (role="alert") en lloc d'onError, i pujaMitja i la previsualització
 * en lloc d'onImageUpload i onDesaCamp. Tres regles eren només del diàleg i no
 * tenen codi vigent (vegeu el bloc «Regles que ja no existixen»).
 * useHeroImageHandler (validaFitxerImatge), useEnquadramentAvatar,
 * DialegEnquadrament i DetallAjust són reals; jsdom no té canvas: la frontera
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
import DetallAjust from './DetallAjust.jsx';
import { useImatgeDeFitxa } from './useImatgeDeFitxa.jsx';
import { MIDA_MAXIMA_IMATGE } from '../../hooks/useHeroImageHandler.js';
import { PES_MAXIM_ENTRADA } from '../../components/universal/enquadrament/limits.js';
import { AJUDA_FOTO, ERROR_PES_FOTO, PES_MAXIM_FOTO } from '../../components/universal/enquadrament/useEnquadramentImatge.jsx';

const MB = 1024 * 1024;
const RETALLADOR = { name: 'Enquadrar l’avatar' };
const URL_MITJA = 'sdp-media://mitjans/t/u/avatars/a.webp';
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

/* ── El retallador T46 de l'avatar, a l'ajust d'imatge (DetallAjust) ──
   Onada 6 (verificació, 261009) · Les regles K2 que es comprovaven al diàleg
   intermedi del Perfil, ara sobre l'únic lloc del Perfil que munta este
   retallador (useEnquadramentAvatar; fora del Perfil, només l'espècimen del
   catàleg de disseny). «Puja el retall» es llig a pujaMitja, la pujada de
   DetallAjust. */

const AJUST_FOTO = Object.freeze({ id: 'avatar', lloc: 'fitxa', titol: 'Foto de perfil', camp: 'avatar_url', tipus: 'imatge', valor: '', obert: true });
const PERSONA = Object.freeze({ id: 'jo', mena: 'persona', nom: 'Pep', dades: {} });

function obriAjust() {
  const pujaMitja = vi.fn(async () => URL_MITJA);
  render(<DetallAjust ajust={AJUST_FOTO} identitat={PERSONA} guardarAjust={vi.fn()} pujaMitja={pujaMitja} />);
  return { pujaMitja };
}
async function triaAjust(fitxer) {
  await act(async () => {
    fireEvent.change(screen.getByLabelText('Nou valor per a foto de perfil:'), { target: { files: [fitxer] } });
  });
  await act(async () => {});
}
const desa = () => act(async () => {
  fireEvent.click(within(screen.getByRole('dialog', RETALLADOR)).getByRole('button', { name: 'Desar l’enquadrament' }));
});

test('K2 · DetallAjust · una foto de mòbil de 7 MB: arriba al retallador i puja el retall', async () => {
  const { pujaMitja } = obriAjust();
  await triaAjust(foto(7));
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.getByRole('dialog', RETALLADOR)).toBeTruthy();
  await desa();
  expect(dobles.exportaRetall).toHaveBeenCalledTimes(1);
  expect(dobles.exportaRetall.mock.calls[0].slice(1)).toEqual([
    { x: 500, y: 0, w: 3000, h: 3000 },
    { amplada: 1200, alcada: 1200, tipus: 'image/jpeg' },
  ]);
  const ix = await dobles.exportaRetall.mock.results[0].value;
  expect(dobles.compressImage.mock.calls.map(([f, o]) => [f, o.maxSize])).toEqual([[ix, 600]]);
  expect(pujaMitja).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('dialog', RETALLADOR)).toBeNull();
  expect(screen.getByAltText('Previsualització').getAttribute('src')).toBe(URL_MITJA);
});

test('K2 · DetallAjust · una foto QUADRADA desada sense ampliar també ix recodificada del retallador: mai l’original de 7 MB', async () => {
  dobles.carregaImatge.mockResolvedValue({ amplada: 3000, alcada: 3000, tipus: 'image/jpeg', element: {}, allibera: vi.fn() });
  const { pujaMitja } = obriAjust();
  const original = foto(7);
  await triaAjust(original);
  await desa();
  // Sencera, però recodificada amb el mateix tipus i la mateixa mida que el camí T46.
  expect(dobles.exportaRetall.mock.calls[0].slice(1)).toEqual([
    { x: 0, y: 0, w: 3000, h: 3000 },
    { amplada: 1200, alcada: 1200, tipus: 'image/jpeg' },
  ]);
  expect(dobles.compressImage).toHaveBeenCalledTimes(1);
  expect(dobles.compressImage.mock.calls[0][0]).not.toBe(original);
  expect(screen.queryByRole('alert')).toBeNull();
  expect(pujaMitja).toHaveBeenCalledTimes(1);
});

test('K2 · DetallAjust · un PNG (logotip amb transparència) ix en PNG del retallador, com al camí T46', async () => {
  dobles.carregaImatge.mockResolvedValue({ amplada: 800, alcada: 800, tipus: 'image/png', element: {}, allibera: vi.fn() });
  obriAjust();
  await triaAjust(foto(1, 'logo.png', 'image/png'));
  await desa();
  expect(dobles.exportaRetall.mock.calls[0][2]).toEqual({ amplada: 800, alcada: 800, tipus: 'image/png' });
});

test('K2 · DetallAjust · més de 25 MB: l’avís del límit del retallador i cap retallador', async () => {
  const { pujaMitja } = obriAjust();
  await triaAjust(foto(26));
  expect(screen.getByRole('alert').textContent).toBe(ERROR_25MB);
  expect(screen.queryByRole('dialog', RETALLADOR)).toBeNull();
  expect(dobles.carregaImatge).not.toHaveBeenCalled();
  expect(pujaMitja).not.toHaveBeenCalled();
});

/* ── Regles que ja no existixen ──
   Onada 6 (verificació, 261009) · Tres regles d'esta prova eren del diàleg
   intermedi (DialegCapcaleraAvatar) i cap codi vigent no les té. No es
   fabriquen en verd; es deixen escrites perquè el Mestre decidisca si cal
   tornar-les a tindre:
   · «La mateixa per a les dues»: una sola foto per a la capçalera (original,
     1.200 px) i per a l'avatar (el retall, 600 px). La fitxa ja no ho
     oferix: cada imatge té el seu botó (useImatgeDeFitxa).
   · «Només la capçalera» sense retallador, amb l'avís de 5 MB («La imatge
     passa de 5 MB…»): la capçalera de la fitxa passa ara pel retall amb el límit
     de 10 MB (les proves «Onada 4» de davall).
   · El retall de l'avatar limitat a 5 MB a l'eixida (un retall de 6 MB no
     pujava i l'avís eixia dins): era la pujada del diàleg (processaFitxer de
     useHeroImageHandler). DetallAjust redueix el retall a 600 px en WebP
     amb compressImage i no hi aplica cap límit de pes; la fitxa hi aplica el
     de 10 MB (prova «un de 6 MB puja»). */

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
