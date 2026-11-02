/* B8C-5 (marató 261101_2143; B8-CLIENT §5.1) · El diàleg «Silencia les
   notificacions d’esta conversa»: DialegConfirmacio + GrupOpcions de Pedra Seca.
   jsdom no té showModal: es fa com el navegador (obri i enfoca el primer
   control), com a AvisOblitXat.test.jsx. */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../../../tests/helpers/diccionaris.js';
import { createTranslator } from '../../../config/i18n.js';
import DialegSilenci from './DialegSilenci.jsx';

const ca = createTranslator('ca');
const TITOL = 'Silencia les notificacions d’esta conversa';
const dialeg = () => document.querySelector('dialog');
const obert = () => dialeg()?.hasAttribute('open') === true;
const ràdio = (nom) => screen.getByRole('radio', { name: nom });

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value() {
    this.setAttribute('open', '');
    (this.querySelector('[autofocus]') || this.querySelector('button:not(:disabled)'))?.focus();
  } });
});
afterEach(() => {
  cleanup();
  delete HTMLDialogElement.prototype.showModal;
});

describe('tancat', () => {
  test('fins que s’obri la primera vegada no pinta cap node (la conversa té el DOM de sempre)', () => {
    const { container } = render(<DialegSilenci obert={false} onTanca={vi.fn()} onConfirma={vi.fn()} t={ca} />);
    expect(container.innerHTML).toBe('');
    expect(dialeg()).toBeNull();
  });
});

describe('obert', () => {
  test('accessible: nom, descripció, la llegenda i les tres durades; «8 hores» triat per defecte', () => {
    render(<DialegSilenci obert onTanca={vi.fn()} onConfirma={vi.fn()} t={ca} />);
    expect(obert()).toBe(true);
    const finestra = screen.getByRole('dialog', { name: TITOL });
    const descripcio = document.getElementById(finestra.getAttribute('aria-describedby'));
    expect(descripcio.textContent).toBe('Ningú de la conversa ho sabrà. Els missatges continuaran arribant, però sense avís.');
    expect(screen.getByRole('group', { name: 'Durant quant de temps' })).toBeTruthy();
    expect(screen.getAllByRole('radio').map((r) => r.labels[0].textContent)).toEqual(['8 hores', '1 setmana', 'Sempre']);
    expect(ràdio('8 hores').checked).toBe(true);
    expect(screen.getByRole('button', { name: 'Silencia' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel·la' })).toBeTruthy();
  });

  test('«Silencia» crida onConfirma(\'8h\'); després de triar «Sempre», onConfirma(\'sempre\')', () => {
    const onConfirma = vi.fn();
    render(<DialegSilenci obert onTanca={vi.fn()} onConfirma={onConfirma} t={ca} />);
    fireEvent.click(screen.getByRole('button', { name: 'Silencia' }));
    expect(onConfirma).toHaveBeenLastCalledWith('8h');
    fireEvent.click(ràdio('Sempre'));
    expect(ràdio('Sempre').checked).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Silencia' }));
    expect(onConfirma).toHaveBeenLastCalledWith('sempre');
    fireEvent.click(ràdio('1 setmana'));
    fireEvent.click(screen.getByRole('button', { name: 'Silencia' }));
    expect(onConfirma).toHaveBeenLastCalledWith('1setmana');
    expect(onConfirma).toHaveBeenCalledTimes(3);
  });

  test('«Cancel·la» tanca sense confirmar res', () => {
    const onConfirma = vi.fn();
    const onTanca = vi.fn();
    render(<DialegSilenci obert onTanca={onTanca} onConfirma={onConfirma} t={ca} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel·la' }));
    expect(onTanca).toHaveBeenCalledTimes(1);
    expect(onConfirma).not.toHaveBeenCalled();
  });

  test('amb `carregant`, «Silencia» està desactivat i no confirma, i les durades tampoc es poden canviar', () => {
    const onConfirma = vi.fn();
    render(<DialegSilenci obert carregant onTanca={vi.fn()} onConfirma={onConfirma} t={ca} />);
    const silencia = screen.getByRole('button', { name: /Treballant|Silencia/ });
    expect(silencia.disabled).toBe(true);
    fireEvent.click(silencia);
    expect(onConfirma).not.toHaveBeenCalled();
    expect(screen.getByRole('group', { name: 'Durant quant de temps' }).disabled).toBe(true);
  });

  test('cada obertura torna a començar per «8 hores»; tancat, es queda muntat i tancat', () => {
    const props = { onTanca: vi.fn(), onConfirma: vi.fn(), t: ca };
    const { rerender } = render(<DialegSilenci obert {...props} />);
    fireEvent.click(ràdio('Sempre'));
    rerender(<DialegSilenci obert={false} {...props} />);
    expect(dialeg()).not.toBeNull();
    rerender(<DialegSilenci obert {...props} />);
    expect(ràdio('8 hores').checked).toBe(true);
  });

  test('en castellà, els textos del diccionari', () => {
    render(<DialegSilenci obert onTanca={vi.fn()} onConfirma={vi.fn()} t={createTranslator('es')} />);
    expect(screen.getByRole('dialog', { name: 'Silenciar las notificaciones de esta conversación' })).toBeTruthy();
    expect(screen.getAllByRole('radio').map((r) => r.labels[0].textContent)).toEqual(['8 horas', '1 semana', 'Siempre']);
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeTruthy();
  });
});
