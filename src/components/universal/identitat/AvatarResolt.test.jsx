/**
 * AvatarResolt · XAT-02 (ordre del Mestre, 261014, pla 261014_0210).
 *   · Una foto o un logo pujats ('sdp-media://…') els resol el port. Si el
 *     port torna encara la referència opaca (l'adaptador ho fa quan no pot
 *     firmar una URL de mitjans_privats), es pinten les inicials: mai un
 *     <img src="sdp-media://…">.
 *   · Resolta a una URL vàlida, o amb una font que no és del port, el mateix
 *     Avatar que abans (Llei del Píxel).
 */
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ mitjans: true, resol: vi.fn() }));
vi.mock('../../../data/backendPort.js', async (importOriginal) => ({
  ...(await importOriginal()),
  teCapacitat: (cap) => cap === 'mitjans' && mocks.mitjans,
  resolveAsset: (ref, opcions) => mocks.resol(ref, opcions)
}));

import { AvatarResolt } from './AvatarResolt.jsx';
import { Avatar } from '../../PedraSeca/index.js';
import { permetOrigenMitjans } from '../../../utils/sanitize.js';

const NODE = 'https://node-avatar-resolt.example';
const PUJADA = 'sdp-media://mitjans/t/u/organitzacions/logo.webp';
const PRIVADA = 'sdp-media://mitjans_privats/t/u/avatars/cara.webp';
const RESOLTA = `${NODE}/storage/v1/object/public/mitjans/t/u/organitzacions/logo.webp`;
const PROPS = Object.freeze({ nom: 'Forn de la Plaça', mida: 'md', llavor: 'forn', alt: '', titol: '' });

/* act buida el treball pendent de React en eixir: el valor resolt ja s'ha pintat. */
const buida = () => act(async () => { await new Promise((resolt) => { setTimeout(resolt, 0); }); });

beforeAll(() => permetOrigenMitjans(NODE));
beforeEach(() => {
  mocks.mitjans = true;
  mocks.resol.mockReset();
  mocks.resol.mockImplementation(async () => RESOLTA);
});
afterEach(() => cleanup());

test('si el port torna la referència encara opaca, inicials i cap <img> (també amb espais davant)', async () => {
  for (const ref of [PUJADA, PRIVADA, `  ${PRIVADA}`]) {
    mocks.resol.mockReset();
    mocks.resol.mockImplementation(async (r) => r);
    const { container } = render(<AvatarResolt {...PROPS} src={ref} />);
    await waitFor(() => expect(mocks.resol).toHaveBeenCalledWith(ref.trim(), expect.anything()));
    await buida();
    expect(container.querySelector('img'), ref).toBeNull();
    expect(container.querySelector('[aria-hidden="true"]').textContent).toBe('FD');
    /* El mateix DOM que l'Avatar sense imatge. */
    const sense = render(<Avatar {...PROPS} />);
    expect(container.firstElementChild.isEqualNode(sense.container.firstElementChild), ref).toBe(true);
    cleanup();
  }
});

test('resolta a una URL vàlida, la imatge de sempre: el mateix DOM que Avatar amb la URL', async () => {
  const { container } = render(<AvatarResolt {...PROPS} src={PUJADA} />);
  await waitFor(() => expect(container.querySelector('img')?.getAttribute('src')).toBe(RESOLTA));
  const directe = render(<Avatar {...PROPS} src={RESOLTA} />);
  expect(container.firstElementChild.isEqualNode(directe.container.firstElementChild)).toBe(true);
});

test('una font que no és del port no passa pel port i pinta el mateix Avatar', async () => {
  for (const src of ['/assets/fotos/iaia-maria.png', 'data:image/png;base64,iVBORw0KGgo=', RESOLTA]) {
    const { container } = render(<AvatarResolt {...PROPS} src={src} />);
    await waitFor(() => expect(container.querySelector('img')?.getAttribute('src')).toBe(src));
    const directe = render(<Avatar {...PROPS} src={src} />);
    expect(container.firstElementChild.isEqualNode(directe.container.firstElementChild), src).toBe(true);
    cleanup();
  }
  expect(mocks.resol).not.toHaveBeenCalled();
});

test('sense la capacitat «mitjans», inicials i el port no es crida', async () => {
  mocks.mitjans = false;
  const { container } = render(<AvatarResolt {...PROPS} src={PUJADA} />);
  await buida();
  expect(container.querySelector('img')).toBeNull();
  expect(container.querySelector('[aria-hidden="true"]').textContent).toBe('FD');
  expect(mocks.resol).not.toHaveBeenCalled();
});
