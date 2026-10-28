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
const dobles = vi.hoisted(() => ({ carregaImatge: vi.fn(), exportaRetall: vi.fn(), compressImage: vi.fn(), avisDeLaFoto: null }));
vi.mock('../../components/universal/enquadrament/imatgeCanvas.js', () => ({
  carregaImatge: dobles.carregaImatge,
  dibuixaVisor: () => true,
  exportaRetall: dobles.exportaRetall,
}));
vi.mock('../../utils/imageUtils.js', () => ({ compressImage: dobles.compressImage }));
/* Gauntlet 261016 (F1) · La compressió de veres; només quan una prova posa
   `avisDeLaFoto`, fotoDinsDelPressupost el llança tal qual, sense comprimir. */
vi.mock('../../utils/pujadaImatge.js', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    fotoDinsDelPressupost: (...args) => (dobles.avisDeLaFoto == null
      ? original.fotoDinsDelPressupost(...args)
      : Promise.reject(new Error(dobles.avisDeLaFoto))),
  };
});
import DetallAjust from './DetallAjust.jsx';
import { AVISOS_DE_LA_FOTO } from '../../utils/pujadaImatge.js';
import { AVIS_GPS_ELIMINAT_PERFIL } from '../../components/universal/enquadrament/DialegEnquadrament.jsx';
import { ETIQUETA_CONSERVA_CAMERA, exifPublicable } from '../../components/universal/enquadrament/exifIncrustat.js';
import { TIPUS, jpegAmbExif } from '../../components/universal/enquadrament/jpegProva.js';

const FOTO = Object.freeze({ id: 'avatar', lloc: 'fitxa', titol: 'Foto de perfil', camp: 'avatar_url', tipus: 'imatge', valor: '', obert: true });
const jo = Object.freeze({ id: 'jo', mena: 'persona', nom: 'Pep', dades: {} });
const RETALLADOR = { name: 'Enquadrar l’avatar' };
const MITJA = 'sdp-media://mitjans/t/u/avatars/a.webp';

beforeEach(() => {
  dobles.avisDeLaFoto = null;
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
  // Gauntlet 261016 (Bloc 1, Llei del Quadrat) · l'avatar, a 400 px (abans 600).
  expect(dobles.compressImage).toHaveBeenCalledWith(retallat, { maxSize: 400, format: 'image/webp', quality: 0.8 });
  expect(pujaMitja).toHaveBeenCalledTimes(1);
  const [fitxer, carpeta] = pujaMitja.mock.calls[0];
  expect(fitxer).toBeInstanceOf(File);
  expect(fitxer.name).toBe('avatar.webp');
  expect(carpeta).toBe('avatars');
  expect(screen.queryByRole('dialog', RETALLADOR)).toBeNull();
  expect(screen.getByRole('status').textContent).toBe('Imatge pujada. Ara dóna-li a Guardar.');
  expect(screen.getByAltText('Previsualització').getAttribute('src')).toBe(MITJA);
});

/* Gauntlet 261016 (Bloc 1) · Un navegador sense codificador WebP en canvas
   (Safari 16) torna PNG. Abans l'avatar pujava així, avatar.png; ara la foto
   es torna a codificar en JPEG (el PNG no cabria al pressupost) i puja
   avatar.jpg, de tipus image/jpeg: el nom diu el que porta. El fetch torna
   els bytes de veres. */
const PNG = String.fromCharCode(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13) + 'IHDR';
const JPEG = String.fromCharCode(0xff, 0xd8, 0xff, 0xe0, 0, 16) + 'JFIF\u0000xxxxx';
function fetchDeVeres() {
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    const tipus = /^data:([^;,]*)/.exec(url)?.[1] || '';
    const bytes = Uint8Array.from(atob(url.slice(url.indexOf(',') + 1)), (c) => c.charCodeAt(0));
    return { blob: async () => new Blob([bytes], { type: tipus }) };
  }));
}

test('Gauntlet 261016 · un canvas sense WebP (Safari 16): la foto es torna a codificar en JPEG i puja avatar.jpg', async () => {
  dobles.compressImage.mockImplementation(async (_f, { format }) => (format === 'image/jpeg'
    ? `data:image/jpeg;base64,${btoa(JPEG)}`
    : `data:image/png;base64,${btoa(PNG)}`));
  fetchDeVeres();
  const pujaMitja = vi.fn(async () => MITJA);
  munta(pujaMitja);
  await tria();
  await desa();
  expect(dobles.compressImage.mock.calls.map(([, o]) => o)).toEqual([
    { maxSize: 400, format: 'image/webp', quality: 0.8 },
    { maxSize: 400, format: 'image/jpeg', quality: 0.8 },
  ]);
  const [fitxer, carpeta] = pujaMitja.mock.calls[0];
  expect([fitxer.name, fitxer.type, fitxer.size, carpeta]).toEqual(['avatar.jpg', 'image/jpeg', JPEG.length, 'avatars']);
});

/* Gauntlet 261016 (Bloc 1) · L'avatar entra al pressupost de les fotos:
   menys de 80.000 bytes, baixant només la qualitat. Si ni la més baixa hi
   cap, no puja res i es diu per què (no un error de connexió). */
test('Gauntlet 261016 · un avatar que pesa massa fins i tot comprimit: l’avís del pressupost, dins i fora, i cap pujada', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  dobles.compressImage.mockResolvedValue(`data:image/webp;base64,${btoa(`RIFF\u0000\u0000\u0000\u0000WEBPVP8 ${'x'.repeat(90000)}`)}`);
  fetchDeVeres();
  const pujaMitja = vi.fn(async () => MITJA);
  munta(pujaMitja);
  await tria();
  await desa();
  const missatge = 'La imatge pesa massa fins i tot comprimida; prova amb una altra foto.';
  /* Gauntlet 261016 (P1 de l'auditoria adversarial) · Abans, els sis intents
     de l'escala fixa (0,8 → 0,4); ara, la cerca de la qualitat, que acaba a la
     mínima (0,04) quan no hi cap res. */
  expect(dobles.compressImage.mock.calls.map(([, o]) => [o.maxSize, o.quality])).toEqual(
    [0.8, 0.4, 0.2, 0.08, 0.04].map((q) => [400, q]),
  );
  expect(pujaMitja).not.toHaveBeenCalled();
  expect(within(screen.getByRole('dialog', RETALLADOR)).getByRole('alert').textContent).toContain(missatge);
  expect(screen.getAllByRole('alert').map((a) => a.textContent)).toContain(missatge);
  expect(warn).not.toHaveBeenCalled();
});

/* Gauntlet 261016 (F1) · Abans només es reconeixien ERROR_PRESSUPOST i
   ERROR_PRESSUPOST_EXIF: els avisos nous de la foto (el de la càmera i els de
   l'EXIF que no es pot conservar) eixien com un error de connexió. Ara tots
   els d'esAvisDeLaFoto (AVISOS_DE_LA_FOTO, pujadaImatge.js) es diuen tal
   qual, dins del retallador i al formulari, i cap no s'anota com una fallada
   de la xarxa. */
const MARCA_MODEL = [{ tag: 0x010f, tipus: TIPUS.ASCII, valors: 'Canon' }, { tag: 0x0110, tipus: TIPUS.ASCII, valors: 'EOS R6' }];
const ERROR_CONNEXIO = 'S\'ha produït un error al pujar la imatge. Comprova la teua connexió.';
const avisos = () => screen.getAllByRole('alert').map((a) => a.textContent);

/* P1-64 (pla 261028_1526 §3.1.1; Mestre 261028, decisió 7) · ACTUALITZADA A
   POSTA. Abans, l'avatar oferia la casella de la càmera, marcada de sèrie, i
   l'EXIF que no hi cabia donava l'avís de la càmera. Ara l'avatar és
   identitat: cap casella, compressImage sense conservaExif i cap avís del GPS
   si la foto no en portava. */
test('P1-64 · una foto amb només les dades de la càmera: sense casella de la càmera; compressImage sense conservaExif, i cap avís del GPS', async () => {
  const camera = new File([jpegAmbExif({ ifd0: MARCA_MODEL })], 'camera.jpg', { type: 'image/jpeg' });
  expect((await exifPublicable(camera)).tiff.length).toBeGreaterThan(1);
  const pujaMitja = vi.fn(async () => MITJA);
  munta(pujaMitja);
  await tria(camera);
  const retallador = screen.getByRole('dialog', RETALLADOR);
  expect(within(retallador).queryByRole('checkbox', { name: new RegExp(ETIQUETA_CONSERVA_CAMERA) })).toBeNull();
  expect(within(retallador).queryByRole('checkbox')).toBeNull();
  await desa();
  expect(dobles.compressImage.mock.calls[0][1]).toEqual({ maxSize: 400, format: 'image/webp', quality: 0.8 });
  expect(pujaMitja).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('status').textContent).toBe('Imatge pujada. Ara dóna-li a Guardar.');
  expect(screen.queryByText(new RegExp(AVIS_GPS_ELIMINAT_PERFIL))).toBeNull();
});

test.each(AVISOS_DE_LA_FOTO.map((avis) => [avis]))('Gauntlet 261016 (F1) · cada avís de la foto es diu tal qual, dins i fora, i no puja res: «%s»', async (avis) => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  dobles.avisDeLaFoto = avis;
  const pujaMitja = vi.fn(async () => MITJA);
  munta(pujaMitja);
  await tria();
  await desa();
  expect(pujaMitja).not.toHaveBeenCalled();
  expect(within(screen.getByRole('dialog', RETALLADOR)).getByRole('alert').textContent).toContain(avis);
  expect(avisos()).toContain(avis);
  expect(avisos().join('|')).not.toContain(ERROR_CONNEXIO);
  expect(warn).not.toHaveBeenCalled();
});

test('Gauntlet 261016 (F1) · control: una fallada que no és cap avís de la foto continua sent l’error de connexió, i s’anota', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  dobles.avisDeLaFoto = 'Failed to fetch';
  const pujaMitja = vi.fn(async () => MITJA);
  munta(pujaMitja);
  await tria();
  await desa();
  expect(pujaMitja).not.toHaveBeenCalled();
  expect(within(screen.getByRole('dialog', RETALLADOR)).getByRole('alert').textContent).toContain(ERROR_CONNEXIO);
  expect(avisos()).toContain(ERROR_CONNEXIO);
  expect(avisos().join('|')).not.toContain('Failed to fetch');
  expect(warn).toHaveBeenCalledTimes(1);
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
