import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useElementFullscreen } from './useElementFullscreen.js';

function Visor({ inertAlPrincipi = false }) {
  const { elementRef, toggleFullscreen } = useElementFullscreen();
  return <section ref={elementRef} data-testid="visor">
    {inertAlPrincipi ? <div inert=""><button>Control inactiu</button></div> : null}
    <button onClick={toggleFullscreen}>Pantalla completa</button>
    <button>Últim control tabulable</button>
    <button tabIndex={-1}>Control només programàtic</button>
  </section>;
}

beforeEach(() => {
  vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue([{ width: 1, height: 1 }]);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test('Tab des de l’últim control tabulable torna al primer, excloent tabindex negatiu', async () => {
  render(<Visor />);
  fireEvent.click(screen.getByRole('button', { name: 'Pantalla completa' }));
  const primer = screen.getByRole('button', { name: 'Pantalla completa' });
  const darrer = screen.getByRole('button', { name: 'Últim control tabulable' });
  act(() => darrer.focus());
  const ev = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
  fireEvent(darrer, ev);
  expect(ev.defaultPrevented).toBe(true);
  expect(document.activeElement).toBe(primer);
});

test('la contenció del focus ignora controls d’un subarbre inert encara que tinguen caixa visible', async () => {
  render(<Visor inertAlPrincipi />);
  const primer = screen.getByRole('button', { name: 'Pantalla completa' });
  fireEvent.click(primer);
  const visor = screen.getByTestId('visor');
  act(() => visor.focus());
  fireEvent.keyDown(visor, { key: 'Tab' });
  expect(document.activeElement).toBe(primer);
});
