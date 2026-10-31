/* P1-12 pas 17 (D-09; pla 261029_1605, C.1) · L'avís d'OBLIT_FALLIT en eixir.
   jsdom no té showModal: es fa com el navegador (obri i enfoca el primer
   control), igual que DialegsModeracio.test.jsx. Les reserves del codi són
   el text valencià del diccionari (paritat provada). */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import CA from '../../../config/idiomes/ca.js';

const m = vi.hoisted(() => ({ showToast: vi.fn(), claus: [] }));
vi.mock('../../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (clau, alternativa) => { m.claus.push([clau, alternativa]); return alternativa; } })
}));
vi.mock('../../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.showToast }) }));
import AvisOblitXat from './AvisOblitXat.jsx';

const fallit = (quanMs = 1) => Object.freeze({ estat: 'OBLIT_FALLIT', pendents: Object.freeze(['indexeddb']), quanMs });
const OBLIDAT = Object.freeze({ estat: 'oblidat', pendents: Object.freeze([]), quanMs: 2 });
const TITOL = 'No s’han pogut esborrar les claus del xat';
const diferit = () => { let resol; let rebutja; const promesa = new Promise((a, b) => { resol = a; rebutja = b; }); return { promesa, resol, rebutja }; };
const dialeg = () => document.querySelector('dialog');
const obert = () => dialeg()?.hasAttribute('open') === true;
const boto = (nom) => screen.getByRole('button', { name: nom });

beforeEach(() => {
  m.showToast.mockReset();
  m.claus = [];
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value() {
    this.setAttribute('open', '');
    (this.querySelector('[autofocus]') || this.querySelector('button:not(:disabled)'))?.focus();
  } });
});
afterEach(() => {
  cleanup();
  delete HTMLDialogElement.prototype.showModal;
});

describe('quan no pinta res', () => {
  test.each([
    ['sense estat', null, false],
    ['amb l’oblit fet', OBLIDAT, false],
    ['amb una persona dins (encara que haja fallat)', fallit(), true]
  ])('%s: cap node, cap diàleg', (_, oblit, ambSessio) => {
    const { container } = render(<AvisOblitXat oblit={oblit} reintenta={vi.fn()} ambSessio={ambSessio} />);
    expect(container.innerHTML).toBe('');
    expect(dialeg()).toBeNull();
  });

  test('sense props (com fora del proveïdor) tampoc', () => {
    const { container } = render(<AvisOblitXat />);
    expect(container.innerHTML).toBe('');
  });
});

describe('OBLIT_FALLIT sense sessió', () => {
  test('diàleg accessible: nom, descripció i dos botons; el focus va al primer control', () => {
    const oblit = fallit();
    render(<AvisOblitXat oblit={oblit} reintenta={vi.fn()} ambSessio={false} />);
    expect(obert()).toBe(true);
    const finestra = screen.getByRole('dialog', { name: TITOL });
    const descripcio = document.getElementById(finestra.getAttribute('aria-describedby'));
    expect(descripcio.textContent).toMatch(/torna-ho a provar/i);
    expect(boto('Entesos')).toBeTruthy();
    expect(boto('Torna-ho a provar')).toBeTruthy();
    expect(finestra.contains(document.activeElement)).toBe(true);
    /* Cap estil en línia: l'àrea tàctil la dona .sdp-boto (--sdp-touch-min). */
    for (const b of [boto('Entesos'), boto('Torna-ho a provar')]) {
      expect(b.getAttribute('style')).toBeNull();
      expect(b.classList.contains('sdp-boto')).toBe(true);
    }
  });

  test('«Entesos» el tanca fins a un estat nou; Escape també', () => {
    const oblit = fallit();
    const v = render(<AvisOblitXat oblit={oblit} reintenta={vi.fn()} ambSessio={false} />);
    fireEvent.click(boto('Entesos'));
    expect(obert()).toBe(false);
    v.rerender(<AvisOblitXat oblit={oblit} reintenta={vi.fn()} ambSessio={false} />);
    expect(obert()).toBe(false);
    const nou = fallit(2);
    v.rerender(<AvisOblitXat oblit={nou} reintenta={vi.fn()} ambSessio={false} />);
    expect(obert()).toBe(true);
    const cancel = new Event('cancel', { cancelable: true });
    act(() => { dialeg().dispatchEvent(cancel); });
    expect(cancel.defaultPrevented).toBe(true);
    expect(obert()).toBe(false);
  });

  test('entrar amb sessió el tanca; eixir amb el mateix estat el torna a obrir', () => {
    const oblit = fallit();
    const v = render(<AvisOblitXat oblit={oblit} reintenta={vi.fn()} ambSessio={false} />);
    v.rerender(<AvisOblitXat oblit={oblit} reintenta={vi.fn()} ambSessio />);
    expect(obert()).toBe(false);
    v.rerender(<AvisOblitXat oblit={oblit} reintenta={vi.fn()} ambSessio={false} />);
    expect(obert()).toBe(true);
  });

  test('«Torna-ho a provar»: una sola crida sense arguments, ocupat mentre vola, «fet» només si s’ha oblidat', async () => {
    const vol = diferit();
    const reintenta = vi.fn(() => vol.promesa);
    const oblit = fallit();
    /* On era el focus abans que s'obrira (p. ex. l'enllaç d'entrar, després d'eixir). */
    const abans = document.createElement('button');
    abans.textContent = 'Entra';
    document.body.appendChild(abans);
    abans.focus();
    const v = render(<AvisOblitXat oblit={oblit} reintenta={reintenta} ambSessio={false} />);
    expect(document.activeElement).not.toBe(abans);
    const confirma = boto('Torna-ho a provar');
    await act(async () => { fireEvent.click(confirma); });
    await act(async () => { fireEvent.click(confirma); });
    expect(reintenta).toHaveBeenCalledTimes(1);
    expect(reintenta.mock.calls[0]).toEqual([]);
    expect(confirma.disabled).toBe(true);
    expect(confirma.getAttribute('aria-busy')).toBe('true');
    expect(m.showToast).not.toHaveBeenCalled();
    await act(async () => { vol.resol(OBLIDAT); await vol.promesa; });
    expect(m.showToast).toHaveBeenCalledTimes(1);
    expect(m.showToast).toHaveBeenCalledWith('Les claus del xat d’este aparell ja s’han esborrat.', 'success');
    /* El proveïdor passa l'estat nou: el diàleg es tanca i el focus torna on era. */
    v.rerender(<AvisOblitXat oblit={OBLIDAT} reintenta={reintenta} ambSessio={false} />);
    expect(obert()).toBe(false);
    expect(dialeg()).not.toBeNull();
    expect(document.activeElement).toBe(abans);
    abans.remove();
  });

  test('un reintent que torna a fallar no diu «fet» i deixa el diàleg obert i el botó actiu', async () => {
    const reintenta = vi.fn(async () => fallit(3));
    render(<AvisOblitXat oblit={fallit()} reintenta={reintenta} ambSessio={false} />);
    await act(async () => { fireEvent.click(boto('Torna-ho a provar')); });
    expect(reintenta).toHaveBeenCalledTimes(1);
    expect(m.showToast).not.toHaveBeenCalled();
    expect(obert()).toBe(true);
    expect(boto('Torna-ho a provar').disabled).toBe(false);
  });

  test.each([
    ['rebutja', () => Promise.reject(new Error('inesperat'))],
    ['torna null (bandera apagada o sense servei)', async () => null]
  ])('un reintent que %s no diu «fet» ni llança', async (_, impl) => {
    const reintenta = vi.fn(impl);
    render(<AvisOblitXat oblit={fallit()} reintenta={reintenta} ambSessio={false} />);
    await act(async () => { fireEvent.click(boto('Torna-ho a provar')); });
    expect(m.showToast).not.toHaveBeenCalled();
    expect(boto('Torna-ho a provar').disabled).toBe(false);
  });

  test('sense `reintenta` el botó no fa res', async () => {
    render(<AvisOblitXat oblit={fallit()} ambSessio={false} />);
    await act(async () => { fireEvent.click(boto('Torna-ho a provar')); });
    expect(m.showToast).not.toHaveBeenCalled();
    expect(obert()).toBe(true);
  });
});

test('les cinc claus section.xat.oblit.* són al diccionari i la reserva del codi és el seu text valencià', async () => {
  const reintenta = vi.fn(async () => OBLIDAT);
  render(<AvisOblitXat oblit={fallit()} reintenta={reintenta} ambSessio={false} />);
  await act(async () => { fireEvent.click(boto('Torna-ho a provar')); });
  const usades = new Map(m.claus);
  expect([...usades.keys()].sort()).toEqual([
    'section.xat.oblit.fallit.cos', 'section.xat.oblit.fallit.entesos', 'section.xat.oblit.fallit.reintenta',
    'section.xat.oblit.fallit.titol', 'section.xat.oblit.fet'
  ]);
  for (const [clau, reserva] of usades) expect(CA[clau]).toBe(reserva);
});
