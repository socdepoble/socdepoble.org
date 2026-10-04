import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
vi.mock('../../app/contexts/RouterContext', () => ({ Link: 'a', useNavigate: () => vi.fn() }));
/* El pipeline d'imatge real (compressió amb canvas) no corre a jsdom: el mock
   conserva el contracte (només imatges, i desa per onSaveField). La validació
   (validaFitxerImatge) és la real: el retallador la fa servir abans d'obrir-se.
   Onada 4 · T3 · «trenca.jpg» simula una pujada que falla. */
vi.mock('../../hooks/useHeroImageHandler.js', async (importOriginal) => ({
  ...(await importOriginal()),
  default: ({ fieldName, onSaveField, onError }) => ({
    handleFileChange: async (e) => {
      const fitxer = e.target.files[0];
      if (!fitxer.type.startsWith('image/')) { onError('Només imatges, de moment.'); return; }
      if (fitxer.name === 'trenca.jpg') { onError('Sense xarxa.'); return; }
      onSaveField(fieldName, `${fieldName}:${fitxer.name}`);
    },
  }),
}));
/* Onada 4 · T3 · jsdom no té canvas: la frontera del retallador amb el navegador se simula. */
const dobles = vi.hoisted(() => ({ carregaImatge: vi.fn(), exportaRetall: vi.fn() }));
vi.mock('../../components/universal/enquadrament/imatgeCanvas.js', () => ({
  carregaImatge: dobles.carregaImatge,
  dibuixaVisor: () => true,
  exportaRetall: dobles.exportaRetall,
}));
import { DialegCapcaleraAvatar } from './DialegCapcaleraAvatar.jsx';

const RETALLADOR = { name: 'Enquadrar l’avatar' };
const DESAR = 'Desar l’enquadrament';
const retallat = (nom = 'enquadrament.jpg') => new File(['y'], nom, { type: 'image/jpeg' });

beforeEach(() => {
  dobles.carregaImatge.mockReset().mockResolvedValue({ amplada: 800, alcada: 400, tipus: 'image/jpeg', element: {}, allibera: vi.fn() });
  dobles.exportaRetall.mockReset().mockResolvedValue(retallat());
});
afterEach(cleanup);

const obri = (props = {}) => {
  const p = { onTanca: vi.fn(), onDesaCamp: vi.fn(), onError: vi.fn(), ...props };
  return { ...render(<DialegCapcaleraAvatar obert {...p} />), ...p };
};

async function tria(container, opcio, fitxer = new File(['x'], 'foto.webp', { type: 'image/webp' })) {
  if (opcio) fireEvent.click(screen.getByRole('radio', { name: opcio }));
  await act(async () => {
    fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [fitxer] } });
  });
  // El retallador carrega la foto en un efecte.
  await act(async () => {});
}

const retallador = () => screen.getByRole('dialog', RETALLADOR);
const accepta = () => act(async () => {
  fireEvent.click(within(retallador()).getByRole('button', { name: DESAR }));
});

test('T35 · per defecte la imatge va només a la capçalera i el diàleg tanca amb «desat»', async () => {
  const { container, onDesaCamp, onTanca } = obri();
  await tria(container);
  expect(onDesaCamp.mock.calls).toEqual([['heroImage', 'heroImage:foto.webp']]);
  expect(onTanca).toHaveBeenCalledWith('desat');
  // La capçalera sola no passa pel retallador (AV.txt §8).
  expect(screen.queryByRole('dialog', RETALLADOR)).toBeNull();
  expect(dobles.carregaImatge).not.toHaveBeenCalled();
});

test('Onada 4 · T3 · «Només l’avatar»: la foto obri el retallador només en quadrat, sense geolocalització, i encara no desa res', async () => {
  const fitxer = new File(['x'], 'foto.webp', { type: 'image/webp' });
  const { container, onDesaCamp, onTanca } = obri();
  await tria(container, 'Només l’avatar', fitxer);
  const dialeg = retallador();
  const formes = within(dialeg).getAllByRole('radio');
  expect(formes.map((r) => r.value)).toEqual(['1:1']);
  expect(formes[0].checked).toBe(true);
  expect(within(dialeg).queryByRole('checkbox')).toBeNull();
  expect(dobles.carregaImatge).toHaveBeenCalledWith(fitxer, expect.objectContaining({ signal: expect.any(Object) }));
  expect(onDesaCamp).not.toHaveBeenCalled();
  expect(onTanca).not.toHaveBeenCalled();
});

test('T35 + T3 · «Només l’avatar» desa UN fitxer, el retallat, i no toca la capçalera', async () => {
  const { container, onDesaCamp, onTanca } = obri();
  await tria(container, 'Només l’avatar');
  await accepta();
  // 800×400 en quadrat: el quadrat central.
  expect(dobles.exportaRetall).toHaveBeenCalledTimes(1);
  expect(dobles.exportaRetall.mock.calls[0][1]).toEqual({ x: 200, y: 0, w: 400, h: 400 });
  expect(onDesaCamp.mock.calls).toEqual([['logoImage', 'logoImage:enquadrament.jpg']]);
  expect(onTanca).toHaveBeenCalledTimes(1);
  expect(onTanca).toHaveBeenCalledWith('desat');
  expect(screen.queryByRole('dialog', RETALLADOR)).toBeNull();
});

test('T35 + T3 · «La mateixa per a les dues»: només l’avatar es retalla; capçalera (foto sencera) i avatar, en sèrie, i tanca una vegada', async () => {
  const ordre = [];
  let allibera;
  const onDesaCamp = vi.fn((camp) => {
    ordre.push(`inici:${camp}`);
    if (camp === 'heroImage') return new Promise((r) => { allibera = () => { ordre.push('fi:heroImage'); r(); }; });
    return undefined;
  });
  const { container, onTanca } = obri({ onDesaCamp });
  await tria(container, 'La mateixa per a les dues');
  // Res no puja abans d'enquadrar l'avatar.
  expect(onDesaCamp).not.toHaveBeenCalled();
  await accepta();
  /* L'avatar no comença fins que el servidor ha contestat la capçalera. */
  expect(ordre).toEqual(['inici:heroImage']);
  await act(async () => { allibera(); });
  expect(ordre).toEqual(['inici:heroImage', 'fi:heroImage', 'inici:logoImage']);
  expect(onDesaCamp.mock.calls).toEqual([['heroImage', 'heroImage:foto.webp'], ['logoImage', 'logoImage:enquadrament.jpg']]);
  expect(dobles.exportaRetall).toHaveBeenCalledTimes(1);
  expect(onTanca).toHaveBeenCalledTimes(1);
  expect(onTanca).toHaveBeenCalledWith('desat');
});

test('Onada 4 · T3 · cancel·lar el retallador no desa res (tampoc la capçalera a «les dues») i el focus torna a «Triar la imatge»', async () => {
  const { container, onDesaCamp, onTanca } = obri();
  fireEvent.click(screen.getByRole('radio', { name: 'La mateixa per a les dues' }));
  const boto = screen.getByRole('button', { name: 'Triar la imatge' });
  boto.focus();
  await tria(container);
  // El focus és dins del retallador (un navegador l'hi porta en obrir-lo).
  within(retallador()).getByLabelText('Ampliació').focus();
  expect(document.activeElement).not.toBe(boto);
  await act(async () => { fireEvent.click(within(retallador()).getByRole('button', { name: 'Cancel·lar' })); });
  expect(screen.queryByRole('dialog', RETALLADOR)).toBeNull();
  expect(onDesaCamp).not.toHaveBeenCalled();
  expect(dobles.exportaRetall).not.toHaveBeenCalled();
  expect(onTanca).not.toHaveBeenCalled();
  expect(document.activeElement).toBe(boto);
  // El diàleg dels destins continua obert: es pot triar una altra foto.
  expect(screen.getByRole('dialog', { name: 'Capçalera i avatar' })).toBeTruthy();
});

test('Onada 4 · T3 · si l’avatar falla després de la capçalera, l’avís ix dins del retallador i tornar a desar només puja l’avatar', async () => {
  dobles.exportaRetall.mockResolvedValueOnce(retallat('trenca.jpg'));
  const { container, onDesaCamp, onTanca, onError } = obri();
  await tria(container, 'La mateixa per a les dues');
  await accepta();
  expect(within(retallador()).getByRole('alert').textContent).toContain('Sense xarxa.');
  expect(onError).toHaveBeenCalledWith('Sense xarxa.');
  expect(onTanca).not.toHaveBeenCalled();
  expect(onDesaCamp.mock.calls).toEqual([['heroImage', 'heroImage:foto.webp']]);
  await accepta();
  expect(onDesaCamp.mock.calls).toEqual([['heroImage', 'heroImage:foto.webp'], ['logoImage', 'logoImage:enquadrament.jpg']]);
  expect(onTanca).toHaveBeenCalledTimes(1);
  expect(onTanca).toHaveBeenCalledWith('desat');
  expect(screen.queryByRole('dialog', RETALLADOR)).toBeNull();
});

test('T35 · un fitxer que no és imatge avisa, no desa res i el diàleg continua obert', async () => {
  const { container, onDesaCamp, onTanca, onError } = obri();
  await tria(container, 'La mateixa per a les dues', new File(['x'], 'nota.pdf', { type: 'application/pdf' }));
  expect(onError).toHaveBeenCalledWith('Només imatges, de moment.');
  expect(onDesaCamp).not.toHaveBeenCalled();
  expect(onTanca).not.toHaveBeenCalled();
  // Onada 4 · T3 · tampoc s'obri el retallador.
  expect(screen.queryByRole('dialog', RETALLADOR)).toBeNull();
});

test('T35 · «Llevar l’avatar» només ix si n’hi ha, i el buida', async () => {
  const onDesaCamp = vi.fn(); const onTanca = vi.fn();
  const { rerender } = render(<DialegCapcaleraAvatar obert onTanca={onTanca} onDesaCamp={onDesaCamp} />);
  expect(screen.queryByRole('button', { name: 'Llevar l’avatar' })).toBeNull();
  rerender(<DialegCapcaleraAvatar obert ambAvatar onTanca={onTanca} onDesaCamp={onDesaCamp} />);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Llevar l’avatar' })); });
  expect(onDesaCamp).toHaveBeenCalledWith('logoImage', '');
  expect(onTanca).toHaveBeenCalledWith('desat');
});

test('T35 · tancar el selector de fitxers sense triar no tanca el diàleg', () => {
  const { container, onTanca } = obri();
  const input = container.querySelector('input[type="file"]');
  const dialeg = container.querySelector('dialog') || document.querySelector('dialog');
  const arriba = vi.fn();
  dialeg.addEventListener('cancel', arriba);
  input.dispatchEvent(new Event('cancel', { bubbles: true }));
  expect(arriba).not.toHaveBeenCalled();
  expect(onTanca).not.toHaveBeenCalled();
});

test('T35 · mentre treballa, Esc sí que tanca (el navegador pot tancar el <dialog> pel seu compte); la X no', async () => {
  let allibera;
  const onDesaCamp = vi.fn(() => new Promise((r) => { allibera = r; }));
  const { container, onTanca } = obri({ onDesaCamp });
  await act(async () => {
    fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [new File(['x'], 'foto.webp', { type: 'image/webp' })] } });
  });
  fireEvent.click(screen.getByRole('button', { name: 'Tancar' }));
  expect(onTanca).not.toHaveBeenCalled();
  const dialeg = document.querySelector('dialog');
  dialeg.dispatchEvent(new Event('cancel', { cancelable: true }));
  expect(onTanca).toHaveBeenCalledWith('esc');
  await act(async () => { allibera(); });
  expect(onTanca).toHaveBeenLastCalledWith('desat');
});

test('T35 · les tres opcions són les del pla, amb la capçalera marcada per defecte', () => {
  obri();
  expect(screen.getAllByRole('radio').map((r) => r.closest('.sdp-casella').textContent)).toEqual(['Només la capçalera', 'Només l’avatar', 'La mateixa per a les dues']);
  expect(screen.getByRole('radio', { name: 'Només la capçalera' }).checked).toBe(true);
});
