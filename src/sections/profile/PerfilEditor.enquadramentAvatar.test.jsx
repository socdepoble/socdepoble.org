/* Onada 4 · T3 (RETALLADOR.txt §3, AV.txt §8) · Perfil › avatar, de punta a
 * punta: el botó de la capçalera obri DialegCapcaleraAvatar, la foto passa pel
 * retallador només en quadrat i ix per la pujada de sempre (useHeroImageHandler
 * → pujaMitja, el port del Perfil → 'sdp-media://mitjans/…'), amb UN sol
 * fitxer. jsdom no té canvas: la frontera amb el navegador (imatgeCanvas.js),
 * compressImage i el fetch del data URL se simulen. La resta és real. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ adapter: null, guardar: vi.fn(), puja: vi.fn(), toast: vi.fn(), recarrega: vi.fn(), identitats: [],
  autodesament: null, updateProfile: vi.fn(), updateOrganization: vi.fn(), updateAgent: vi.fn() }));
const dobles = vi.hoisted(() => ({ carregaImatge: vi.fn(), exportaRetall: vi.fn(), compressImage: vi.fn() }));
vi.mock('../../components/universal/DocumentEditor', () => ({ DocumentEditor: ({ adapter }) => { m.adapter = adapter; return null; } }));
vi.mock('./PerfilContext.jsx', () => ({ usePerfil: () => ({ guardarCampPerfil: m.guardar, pujaMitja: m.puja, recarrega: m.recarrega,
  identitats: m.identitats, autodesament: m.autodesament }) }));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.toast }) }));
vi.mock('../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  getCurrentUser: () => ({ id: 'U' }),
  updateProfile: (...args) => m.updateProfile(...args),
  updateOrganization: (...args) => m.updateOrganization(...args),
  updateAgent: (...args) => m.updateAgent(...args),
}));
vi.mock('../../components/universal/enquadrament/imatgeCanvas.js', () => ({
  carregaImatge: dobles.carregaImatge,
  dibuixaVisor: () => true,
  exportaRetall: dobles.exportaRetall,
}));
vi.mock('../../utils/imageUtils.js', () => ({ compressImage: dobles.compressImage }));
import { PerfilEditor } from './PerfilEditor.jsx';
import { cuaDesament } from '../../data/autodesament/cua.js';
import { ambitDe } from '../../data/autodesament/ambit.js';

const CONFIG = Object.freeze({ tenantId: '00000000-0000-4000-8000-000000000000' });
const jo = { id: 'jo', mena: 'persona', nom: 'Pep', rol: 'Persona', avatar: 'a.webp', dades: { full_name: 'Pep', is_public: false, town_name: 'La Torre' } };
const CURT = 'data:image/webp;base64,AAAA';
const RETALLADOR = { name: 'Enquadrar l’avatar' };
const MITJA_AVATAR = 'sdp-media://mitjans/t/u/avatars/a.webp';

beforeEach(async () => {
  m.adapter = null; m.guardar.mockReset().mockResolvedValue(undefined); m.puja.mockReset(); m.toast.mockReset();
  m.recarrega.mockReset(); m.identitats = [];
  m.updateProfile.mockReset().mockImplementation(async (canvis) => ({ id: 'U', ...canvis }));
  m.updateOrganization.mockReset().mockImplementation(async (id, canvis) => ({ id, ...canvis }));
  m.updateAgent.mockReset().mockImplementation(async (id, canvis) => ({ id, ...canvis }));
  m.autodesament = { ambit: ambitDe(CONFIG, 'U'), context: CONFIG };
  await cuaDesament.reinicia();
  dobles.carregaImatge.mockReset().mockResolvedValue({ amplada: 1600, alcada: 1200, tipus: 'image/jpeg', element: {}, allibera: vi.fn() });
  dobles.exportaRetall.mockReset().mockResolvedValue(new File(['y'], 'enquadrament.jpg', { type: 'image/jpeg' }));
  dobles.compressImage.mockReset().mockResolvedValue(CURT);
  vi.stubGlobal('fetch', vi.fn(async () => ({ blob: async () => new Blob(['w'], { type: 'image/webp' }) })));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const foto = () => new File(['x'], 'foto.jpg', { type: 'image/jpeg' });

/** Obri «Editar capçalera i avatar», tria el destí i la foto. */
async function triaFoto(desti, fitxer = foto()) {
  const acaba = vi.fn();
  render(<PerfilEditor identitat={jo} />);
  act(() => m.adapter.onHeroEdit({ acaba }));
  const dialeg = screen.getByRole('dialog', { name: 'Capçalera i avatar' });
  fireEvent.click(within(dialeg).getByRole('radio', { name: desti }));
  const boto = within(dialeg).getByRole('button', { name: 'Triar la imatge' });
  boto.focus();
  await act(async () => {
    fireEvent.change(dialeg.querySelector('input[type="file"]'), { target: { files: [fitxer] } });
  });
  await act(async () => {});
  return { acaba, boto, fitxer };
}

const desa = () => act(async () => {
  fireEvent.click(within(screen.getByRole('dialog', RETALLADOR)).getByRole('button', { name: 'Desar l’enquadrament' }));
});

test('Onada 4 · T3 · «Només l’avatar»: retallador 1:1 → UNA pujada pel port (carpeta avatars) amb el fitxer retallat → avatar_url', async () => {
  m.puja.mockResolvedValue(MITJA_AVATAR);
  const { acaba } = await triaFoto('Només l’avatar');
  const retallador = screen.getByRole('dialog', RETALLADOR);
  expect(within(retallador).getAllByRole('radio').map((r) => r.value)).toEqual(['1:1']);
  // Res no puja abans d'enquadrar.
  expect(m.puja).not.toHaveBeenCalled();
  await desa();
  // 1600×1200 en quadrat: el quadrat central de 1200.
  expect(dobles.exportaRetall).toHaveBeenCalledTimes(1);
  expect(dobles.exportaRetall.mock.calls[0][1]).toEqual({ x: 200, y: 0, w: 1200, h: 1200 });
  const retallat = await dobles.exportaRetall.mock.results[0].value;
  // La compressió de sempre de l'avatar (600 px), sobre el fitxer RETALLAT.
  expect(dobles.compressImage).toHaveBeenCalledTimes(1);
  expect(dobles.compressImage.mock.calls[0][0]).toBe(retallat);
  expect(dobles.compressImage.mock.calls[0][1]).toEqual({ maxSize: 600, format: 'image/webp', quality: 0.8 });
  // Una sola pujada, un sol fitxer, a la carpeta de la persona.
  expect(m.puja).toHaveBeenCalledTimes(1);
  const [pujat, carpeta] = m.puja.mock.calls[0];
  expect(pujat).toBeInstanceOf(File);
  expect(pujat.name).toBe('logoImage.webp');
  expect(carpeta).toBe('avatars');
  // Desat per la cua de la fitxa, al camp de l'avatar i a cap altre.
  expect(m.updateProfile).toHaveBeenCalledTimes(1);
  expect(m.updateProfile).toHaveBeenCalledWith({ avatar_url: MITJA_AVATAR }, CONFIG);
  expect(acaba).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('dialog', RETALLADOR)).toBeNull();
});

test('Onada 4 · T3 · cancel·lar el retallador: cap pujada, l’avatar d’abans intacte i el focus torna a «Triar la imatge»', async () => {
  m.puja.mockResolvedValue(MITJA_AVATAR);
  const { acaba, boto } = await triaFoto('Només l’avatar');
  const retallador = screen.getByRole('dialog', RETALLADOR);
  // El focus és dins del retallador (com en un navegador, que l'hi porta en obrir-lo).
  within(retallador).getByLabelText('Ampliació').focus();
  expect(document.activeElement).not.toBe(boto);
  await act(async () => { fireEvent.click(within(retallador).getByRole('button', { name: 'Cancel·lar' })); });
  expect(screen.queryByRole('dialog', RETALLADOR)).toBeNull();
  expect(dobles.exportaRetall).not.toHaveBeenCalled();
  expect(dobles.compressImage).not.toHaveBeenCalled();
  expect(m.puja).not.toHaveBeenCalled();
  expect(m.updateProfile).not.toHaveBeenCalled();
  expect(acaba).not.toHaveBeenCalled();
  expect(document.activeElement).toBe(boto);
});

test('Onada 4 · T3 · «La mateixa per a les dues»: la capçalera puja la foto sencera (1200 px) i només l’avatar passa pel retallador (600 px)', async () => {
  m.puja.mockResolvedValueOnce('sdp-media://mitjans/t/u/avatars/hero.webp').mockResolvedValueOnce(MITJA_AVATAR);
  const { fitxer } = await triaFoto('La mateixa per a les dues');
  expect(m.puja).not.toHaveBeenCalled();
  await desa();
  const retallat = await dobles.exportaRetall.mock.results[0].value;
  expect(dobles.exportaRetall).toHaveBeenCalledTimes(1);
  expect(dobles.compressImage.mock.calls.map(([f, o]) => [f, o.maxSize])).toEqual([[fitxer, 1200], [retallat, 600]]);
  expect(m.puja.mock.calls.map(([f, carpeta]) => [f.name, carpeta])).toEqual([['heroImage.webp', 'avatars'], ['logoImage.webp', 'avatars']]);
  expect(m.updateProfile.mock.calls.map(([canvis]) => canvis)).toEqual([
    { hero_url: 'sdp-media://mitjans/t/u/avatars/hero.webp' },
    { avatar_url: MITJA_AVATAR },
  ]);
  expect(screen.queryByRole('dialog', RETALLADOR)).toBeNull();
});

test('Onada 4 · T3 · «Només la capçalera» no obri el retallador de l’avatar: una pujada, la foto sencera', async () => {
  m.puja.mockResolvedValue('sdp-media://mitjans/t/u/avatars/hero.webp');
  const { fitxer } = await triaFoto('Només la capçalera');
  expect(screen.queryByRole('dialog', RETALLADOR)).toBeNull();
  expect(dobles.carregaImatge).not.toHaveBeenCalled();
  expect(dobles.compressImage.mock.calls.map(([f, o]) => [f, o.maxSize])).toEqual([[fitxer, 1200]]);
  expect(m.puja).toHaveBeenCalledTimes(1);
  expect(m.updateProfile).toHaveBeenCalledWith({ hero_url: 'sdp-media://mitjans/t/u/avatars/hero.webp' }, CONFIG);
});
