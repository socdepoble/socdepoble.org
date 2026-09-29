import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { EmoticonaBarra, NOM_TRIAR_EMOTICONA } from './EmoticonaBarra.jsx';

/* T51 (ordre del Mestre, 260928) · L'espai central de la barra taronja. El
   mode es deduïx d'`onObri`: amb ell, edició (botó); sense, lectura. */
afterEach(cleanup);

const pinta = (props) => render(<EmoticonaBarra {...props} />).container.firstElementChild;

test('edició sense emoticona: un <button aria-haspopup="dialog"> amb la ploma de lucide, decorativa', () => {
  const onObri = vi.fn();
  const boto = pinta({ onObri });
  expect(boto.tagName).toBe('BUTTON');
  expect(boto.getAttribute('type')).toBe('button');
  expect(boto.getAttribute('aria-haspopup')).toBe('dialog');
  expect(boto.getAttribute('aria-label')).toBe(NOM_TRIAR_EMOTICONA);
  expect(boto.getAttribute('title')).toBe(NOM_TRIAR_EMOTICONA);
  expect(boto.className).toBe('sdp-emoticona-barra sdp-emoticona-barra--boto');
  const ploma = boto.querySelector('svg.lucide-feather');
  expect(ploma).not.toBeNull();
  expect(ploma.classList.contains('icon')).toBe(true);
  expect(ploma.getAttribute('aria-hidden')).toBe('true');
  act(() => { fireEvent.click(boto); });
  expect(onObri).toHaveBeenCalledTimes(1);
});

test('edició amb emoticona: el botó la mostra (sense ploma) i el nom diu quina és', () => {
  const boto = pinta({ onObri: () => {}, emoticona: '🍅' });
  expect(boto.tagName).toBe('BUTTON');
  expect(boto.querySelector('svg')).toBeNull();
  expect(boto.querySelector('.sdp-emoticona-barra__glif').textContent).toBe('🍅');
  expect(boto.querySelector('.sdp-emoticona-barra__glif').getAttribute('aria-hidden')).toBe('true');
  expect(boto.getAttribute('aria-label')).toBe('Emoticona del document: 🍅. Canviar-la');
});

test('edició amb un valor que no és un sol emoji: la ploma, com sense emoticona', () => {
  const boto = pinta({ onObri: () => {}, emoticona: '🍅 Tomaques' });
  expect(boto.querySelector('svg.lucide-feather')).not.toBeNull();
  expect(boto.getAttribute('aria-label')).toBe(NOM_TRIAR_EMOTICONA);
});

test('lectura amb emoticona triada: role="img" amb nom, cap botó ni ploma', () => {
  const glif = pinta({ emoticona: '🌿' });
  expect(glif.tagName).toBe('SPAN');
  expect(glif.className).toBe('sdp-emoticona-barra sdp-emoticona-barra--glif');
  expect(glif.getAttribute('role')).toBe('img');
  expect(glif.getAttribute('aria-label')).toBe('Emoticona del document: 🌿');
  expect(glif.textContent).toBe('🌿');
  expect(glif.querySelector('svg')).toBeNull();
});

test('lectura sense emoticona: una cel·la buida que conserva l’espai, amagada al lector', () => {
  for (const emoticona of [undefined, '', null, 'text']) {
    const cella = pinta({ emoticona });
    expect(cella.tagName).toBe('SPAN');
    expect(cella.className).toBe('sdp-emoticona-barra sdp-emoticona-barra--buida');
    expect(cella.getAttribute('aria-hidden')).toBe('true');
    expect(cella.childNodes).toHaveLength(0);
    cleanup();
  }
});

test('un onObri que no és una funció no fa botó (lectura)', () => {
  const cella = pinta({ onObri: true, emoticona: '' });
  expect(cella.tagName).toBe('SPAN');
});
