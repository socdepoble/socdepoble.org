import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useElementFullscreen } from './useElementFullscreen.js';

function Visor({ children }) {
  const { elementRef, toggleFullscreen } = useElementFullscreen();
  return <><button onClick={toggleFullscreen}>Obri</button><section ref={elementRef} data-testid="visor">{children}</section></>;
}
const tab = (node, shiftKey = false) => {
  const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, composed: true, cancelable: true });
  fireEvent(node, event);
  return event;
};
beforeEach(() => { vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue([{ width: 1, height: 1 }]); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); delete document.fullscreenElement; delete document.exitFullscreen; delete HTMLElement.prototype.requestFullscreen; });

test('l’ordre és tabindex positiu ascendent, empat DOM i després controls ordinaris', () => {
  render(<Visor><button>Zero</button><span tabIndex={3}>Tres</span><span tabIndex={1}>U</span><span tabIndex={1}>U bis</span><button tabIndex={-1}>Negatiu</button></Visor>);
  fireEvent.click(screen.getByText('Obri'));
  expect(document.activeElement).toBe(screen.getByText('U'));
  expect(tab(document.activeElement).defaultPrevented).toBe(true);
  expect(document.activeElement).toBe(screen.getByText('U bis'));
  tab(document.activeElement); expect(document.activeElement).toBe(screen.getByText('Tres'));
  tab(document.activeElement); expect(document.activeElement).toBe(screen.getByText('Zero'));
  tab(document.activeElement); expect(document.activeElement).toBe(screen.getByText('U'));
  tab(document.activeElement, true); expect(document.activeElement).toBe(screen.getByText('Zero'));
});

test('descarta visibilitat hidden/collapse, display none en ancestres i subarbres inert', () => {
  render(<Visor><div data-testid="ocult"><button>Invisible</button></div><div data-testid="collapsat"><button>Col·lapsat</button></div><div data-testid="sense-caixa"><button>Sense caixa</button></div><div inert=""><button>Inert</button></div><button>Vigent</button></Visor>);
  /* Onada R30 · Design Guard (cap style= en JSX, tampoc a les proves): l'estil es posa al node, després de pintar. */
  screen.getByTestId('ocult').style.visibility = 'hidden';
  screen.getByTestId('collapsat').style.visibility = 'collapse';
  screen.getByTestId('sense-caixa').style.display = 'none';
  fireEvent.click(screen.getByText('Obri'));
  expect(document.activeElement).toBe(screen.getByText('Vigent'));
  tab(document.activeElement, true); expect(document.activeElement).toBe(screen.getByText('Vigent'));
});

test('els controls d’un shadow obert interior participen en la contenció i no escapen', () => {
  render(<Visor><div data-testid="host" /><button>Darrer</button></Visor>);
  const shadow = screen.getByTestId('host').attachShadow({ mode: 'open' });
  const button = document.createElement('button'); button.textContent = 'Dins'; shadow.append(button);
  fireEvent.click(screen.getByText('Obri'));
  expect(shadow.activeElement).toBe(button);
  tab(button); expect(document.activeElement).toBe(screen.getByText('Darrer'));
  tab(document.activeElement); expect(shadow.activeElement).toBe(button);
});

test('incrustat en shadow tancat, detecta inert del host extern i no enfoca els fills', () => {
  const host = document.createElement('div'); document.body.append(host);
  const shadow = host.attachShadow({ mode: 'closed' });
  const container = document.createElement('div'); shadow.append(container);
  try {
    render(<Visor><button>Dins</button></Visor>, { container });
    host.setAttribute('inert', '');
    const queries = within(container); fireEvent.click(queries.getByText('Obri'));
    expect(shadow.activeElement).not.toBe(queries.getByText('Dins'));
  } finally { cleanup(); host.remove(); }
});

test('eixida de fullscreen natiu restaura el focus original encara que siga fora del visor', async () => {
  Object.defineProperty(document, 'fullscreenElement', { configurable: true, writable: true, value: null });
  HTMLElement.prototype.requestFullscreen = vi.fn(function () { document.fullscreenElement = this; document.dispatchEvent(new Event('fullscreenchange')); return Promise.resolve(); });
  document.exitFullscreen = vi.fn(() => { document.fullscreenElement = null; document.dispatchEvent(new Event('fullscreenchange')); return Promise.resolve(); });
  render(<Visor><button>Dins</button></Visor>);
  const trigger = screen.getByText('Obri'); trigger.focus(); fireEvent.click(trigger);
  expect(document.activeElement).toBe(screen.getByText('Dins'));
  await act(async () => { await document.exitFullscreen(); });
  expect(document.activeElement).toBe(trigger);
});

test('un grup de ràdios ocupa un sol punt de Tab, el marcat, i les fletxes són natives', () => {
  render(<Visor><input type="radio" name="mode" aria-label="Mode A" /><input type="radio" name="mode" aria-label="Mode B" defaultChecked /><button>Darrer</button></Visor>);
  fireEvent.click(screen.getByText('Obri'));
  expect(document.activeElement).toBe(screen.getByLabelText('Mode B'));
  tab(document.activeElement); expect(document.activeElement).toBe(screen.getByText('Darrer'));
  tab(document.activeElement, true); expect(document.activeElement).toBe(screen.getByLabelText('Mode B'));
  const event=new KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true,cancelable:true});fireEvent(document.activeElement,event);
  expect(event.defaultPrevented).toBe(false);
});
test('ràdios amb nom igual de formularis diferents mantenen els seus punts de Tab', () => {
  render(<Visor><form><input type="radio" name="mode" aria-label="Primer formulari" defaultChecked /></form><form><input type="radio" name="mode" aria-label="Segon formulari" defaultChecked /></form><button>Darrer</button></Visor>);
  fireEvent.click(screen.getByText('Obri'));
  expect(document.activeElement).toBe(screen.getByLabelText('Primer formulari'));
  tab(document.activeElement); expect(document.activeElement).toBe(screen.getByLabelText('Segon formulari'));
});

test('Tab conserva els editors contenteditable arrel, exclou niats, fieldset disabled i inputs ocults', () => {
  render(<Visor><fieldset disabled><button>Desactivat</button></fieldset><input type="hidden" /><div contentEditable suppressContentEditableWarning data-testid="editable">Editor<div contentEditable suppressContentEditableWarning data-testid="nested">Niat</div></div><button>Darrer</button></Visor>);
  fireEvent.click(screen.getByText('Obri'));
  expect(document.activeElement).toBe(screen.getByTestId('editable'));
  tab(document.activeElement); expect(document.activeElement).toBe(screen.getByText('Darrer'));
  tab(document.activeElement); expect(document.activeElement).toBe(screen.getByTestId('editable'));
});

/* Onada R30 · FOCUS-02 · Un control que el navegador no deixa enfocar (i que el filtre no ha
   sabut descartar) no encalla Tab: es passa al següent, endavant i enrere. */
test('Tab salta un control que refusa el focus i no queda encallat', () => {
  render(<Visor><button>Primer</button><button>Refusa</button><button>Darrer</button></Visor>);
  vi.spyOn(screen.getByText('Refusa'), 'focus').mockImplementation(() => {});
  fireEvent.click(screen.getByText('Obri'));
  expect(document.activeElement).toBe(screen.getByText('Primer'));
  tab(document.activeElement); expect(document.activeElement).toBe(screen.getByText('Darrer'));
  tab(document.activeElement, true); expect(document.activeElement).toBe(screen.getByText('Primer'));
});
