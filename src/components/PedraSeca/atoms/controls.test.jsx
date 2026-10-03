import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { ActionControl, IconButton } from './controls.jsx';

afterEach(cleanup);

/* T7 (P7) · `ariaDisabled`: un botó inoperatiu que es pot enfocar i llegir.
   No és `disabled`: el clic continua arribant a qui el munta (el seu avís). */
test('T7 · ActionControl pinta aria-disabled i continua actiu i clicable', () => {
  const onClick = vi.fn();
  const { getByRole } = render(<ActionControl label="Connectar" onClick={onClick} ariaDisabled="true">Connectar</ActionControl>);
  const boto = getByRole('button', { name: 'Connectar' });
  expect(boto.getAttribute('aria-disabled')).toBe('true');
  expect(boto.disabled).toBe(false);
  boto.focus();
  expect(document.activeElement).toBe(boto);
  fireEvent.click(boto);
  expect(onClick).toHaveBeenCalledTimes(1);
});

test('T7 · IconButton passa ariaDisabled a ActionControl, amb la seua classe de sempre', () => {
  const { getByRole } = render(<IconButton label="Compartir" onClick={() => {}} ariaDisabled="true"><span /></IconButton>);
  const boto = getByRole('button', { name: 'Compartir' });
  expect(boto.getAttribute('aria-disabled')).toBe('true');
  expect(boto.className).toBe('sp-card-action');
});

test('T7 · sense ariaDisabled, el marcatge de sempre: cap atribut aria-disabled', () => {
  const { container } = render(
    <>
      <ActionControl label="A" onClick={() => {}}>A</ActionControl>
      <IconButton label="B" onClick={() => {}}><span /></IconButton>
      <IconButton label="C" presentation><span /></IconButton>
    </>
  );
  expect(container.querySelectorAll('[aria-disabled]')).toHaveLength(0);
  // Sense onClick continua sent un botó desactivat de veres (presentation).
  expect(container.querySelector('button[aria-label="C"]').disabled).toBe(true);
});
