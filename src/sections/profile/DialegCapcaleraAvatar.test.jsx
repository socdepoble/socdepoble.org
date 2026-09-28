import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
vi.mock('../../app/contexts/RouterContext', () => ({ Link: 'a', useNavigate: () => vi.fn() }));
/* El pipeline d'imatge real (compressió amb canvas) no corre a jsdom: el mock
   conserva el contracte (només imatges, i desa per onSaveField). */
vi.mock('../../hooks/useHeroImageHandler.js', () => ({
  default: ({ fieldName, onSaveField, onError }) => ({
    handleFileChange: async (e) => {
      const fitxer = e.target.files[0];
      if (!fitxer.type.startsWith('image/')) { onError('Només imatges, de moment.'); return; }
      onSaveField(fieldName, `${fieldName}:${fitxer.name}`);
    },
  }),
}));
import { DialegCapcaleraAvatar } from './DialegCapcaleraAvatar.jsx';

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
}

test('T35 · per defecte la imatge va només a la capçalera i el diàleg tanca amb «desat»', async () => {
  const { container, onDesaCamp, onTanca } = obri();
  await tria(container);
  expect(onDesaCamp.mock.calls).toEqual([['heroImage', 'heroImage:foto.webp']]);
  expect(onTanca).toHaveBeenCalledWith('desat');
});

test('T35 · «Només l’avatar» no toca la capçalera', async () => {
  const { container, onDesaCamp } = obri();
  await tria(container, 'Només l’avatar');
  expect(onDesaCamp.mock.calls).toEqual([['logoImage', 'logoImage:foto.webp']]);
});

test('T35 · «La mateixa per a les dues» desa capçalera i avatar, en sèrie, i tanca una vegada', async () => {
  const ordre = [];
  let allibera;
  const onDesaCamp = vi.fn((camp) => {
    ordre.push(`inici:${camp}`);
    if (camp === 'heroImage') return new Promise((r) => { allibera = () => { ordre.push('fi:heroImage'); r(); }; });
    return undefined;
  });
  const { container, onTanca } = obri({ onDesaCamp });
  fireEvent.click(screen.getByRole('radio', { name: 'La mateixa per a les dues' }));
  await act(async () => {
    fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [new File(['x'], 'foto.webp', { type: 'image/webp' })] } });
  });
  /* L'avatar no comença fins que el servidor ha contestat la capçalera. */
  expect(ordre).toEqual(['inici:heroImage']);
  await act(async () => { allibera(); });
  expect(ordre).toEqual(['inici:heroImage', 'fi:heroImage', 'inici:logoImage']);
  expect(onDesaCamp.mock.calls.map((c) => c[0])).toEqual(['heroImage', 'logoImage']);
  expect(onTanca).toHaveBeenCalledTimes(1);
});

test('T35 · un fitxer que no és imatge avisa, no desa res i el diàleg continua obert', async () => {
  const { container, onDesaCamp, onTanca, onError } = obri();
  await tria(container, 'La mateixa per a les dues', new File(['x'], 'nota.pdf', { type: 'application/pdf' }));
  expect(onError).toHaveBeenCalledWith('Només imatges, de moment.');
  expect(onDesaCamp).not.toHaveBeenCalled();
  expect(onTanca).not.toHaveBeenCalled();
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
