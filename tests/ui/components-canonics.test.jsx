/**
 * Components canònics de Pedra Seca sobre React 18 i RTL.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, within, fireEvent, cleanup } from '@testing-library/react';
import { Camp, CampText, Interruptor, GrupOpcions } from '../../src/components/PedraSeca/organismes/formulari.jsx';
import { Alerta } from '../../src/components/PedraSeca/molecules/Alerta.jsx';
import { Pestanyes } from '../../src/components/PedraSeca/organismes/Pestanyes.jsx';
import { finestraPagines } from '../../src/components/PedraSeca/organismes/navegacio.jsx';
import { Dialeg } from '../../src/components/PedraSeca/organismes/Dialeg.jsx';
import { Boto } from '../../src/components/PedraSeca/atoms/Boto.jsx';
import { Insignia } from '../../src/components/PedraSeca/atoms/Insignia.jsx';

afterEach(cleanup);

describe('Camp', () => {
  it('connecta etiqueta, ajuda i error amb el control', () => {
    render(<Camp etiqueta="Telèfon" ajuda="9 dígits" error="Falta un dígit" obligatori><CampText /></Camp>);
    const input = screen.getByRole('textbox', { name: /Telèfon/ });
    expect(screen.getByLabelText(/Telèfon/)).toBe(input);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.required).toBe(true);
    const desc = input.getAttribute('aria-describedby').split(' ')
      .map(id => document.getElementById(id).textContent);
    expect(desc).toEqual(['9 dígits', 'Falta un dígit']);
  });

  it('un control fora de <Camp> falla tancat', () => {
    const errorEsperat = /<CampText> ha d'anar dins de <Camp>/;
    const evitaInformeDuplicat = event => {
      if (errorEsperat.test(event.message)) event.preventDefault();
    };
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    window.addEventListener('error', evitaInformeDuplicat);
    try {
      expect(() => render(<CampText />)).toThrow(errorEsperat);
    } finally {
      window.removeEventListener('error', evitaInformeDuplicat);
      err.mockRestore();
    }
  });
});

describe('Interruptor i GrupOpcions', () => {
  it('l’interruptor és un switch amb estat en text', () => {
    const onCanvi = vi.fn();
    render(<Interruptor etiqueta="Avisos" actiu={false} onCanvi={onCanvi} />);
    const sw = screen.getByRole('switch', { name: 'Avisos' });
    expect(sw.getAttribute('aria-checked')).toBe('false');
    expect(sw.textContent).toContain('No');
    fireEvent.click(sw);
    expect(onCanvi).toHaveBeenCalledWith(true);
  });

  it('els ràdios viuen dins d’un fieldset amb llegenda', () => {
    render(<GrupOpcions llegenda="Mida" valor="a" opcions={[
      { valor: 'a', etiqueta: 'A' }, { valor: 'b', etiqueta: 'B' }
    ]} />);
    const grup = screen.getByRole('group', { name: 'Mida' });
    expect(grup.tagName).toBe('FIELDSET');
    expect(within(grup).getByRole('radio', { name: 'A' }).checked).toBe(true);
    expect(within(grup).getByRole('radio', { name: 'B' }).checked).toBe(false);
  });
});

describe('Alerta', () => {
  it('només l’error interromp (role=alert); la resta és status', () => {
    const { rerender } = render(<Alerta to="info">x</Alerta>);
    expect(screen.getByRole('status')).toBeTruthy();
    rerender(<Alerta to="error">x</Alerta>);
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByRole('alert').className).toContain('sdp-alerta--error');
  });
});

describe('Pestanyes', () => {
  it('fletxes, Inici i Fi mouen focus i selecció; només l’activa és tabulable', () => {
    render(<Pestanyes etiqueta="Fitxa" pestanyes={[
      { id: 'a', etiqueta: 'A', contingut: 'pa' },
      { id: 'b', etiqueta: 'B', contingut: 'pb' },
      { id: 'c', etiqueta: 'C', contingut: 'pc' }
    ]} />);
    const [a, b, c] = screen.getAllByRole('tab');
    expect([a.tabIndex, b.tabIndex, c.tabIndex]).toEqual([0, -1, -1]);
    fireEvent.keyDown(a, { key: 'ArrowLeft' });
    expect(c.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(c);
    expect(screen.getByRole('tabpanel').textContent).toBe('pc');
    expect([a.tabIndex, b.tabIndex, c.tabIndex]).toEqual([-1, -1, 0]);
    fireEvent.keyDown(c, { key: 'Home' });
    expect(a.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(a);
    fireEvent.keyDown(a, { key: 'End' });
    expect(document.activeElement).toBe(c);
    fireEvent.keyDown(c, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(a);
  });
});

describe('Paginacio', () => {
  it('mai més de 7 posicions i sempre primera i última', () => {
    expect(finestraPagines(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(finestraPagines(6, 12)).toEqual([1, '…', 5, 6, 7, '…', 12]);
    expect(finestraPagines(1, 12)).toEqual([1, 2, '…', 12]);
    expect(finestraPagines(12, 12)).toEqual([1, '…', 11, 12]);
    for (let p = 1; p <= 40; p++) expect(finestraPagines(p, 40).length).toBeLessThanOrEqual(7);
  });
});

describe('Dialeg', () => {
  it('té nom accessible i avisa el pare amb Escape sense tancar-se sol', () => {
    const onTanca = vi.fn();
    const { rerender } = render(<Dialeg obert titol="Canviar nom" onTanca={onTanca}>cos</Dialeg>);
    const d = screen.getByRole('dialog', { name: 'Canviar nom' });
    expect(d.open).toBe(true);
    const ev = new Event('cancel', { cancelable: true });
    fireEvent(d, ev);
    expect(ev.defaultPrevented).toBe(true);
    expect(onTanca).toHaveBeenCalledWith('esc');
    expect(d.open).toBe(true);
    rerender(<Dialeg obert={false} titol="Canviar nom" onTanca={onTanca}>cos</Dialeg>);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('Boto i Insignia', () => {
  it('carregant desactiva i anuncia', () => {
    const onClick = vi.fn();
    const { rerender } = render(<Boto carregant onClick={onClick}>Desar</Boto>);
    const b = screen.getByRole('button', { name: 'Treballant…' });
    expect(b.disabled).toBe(true);
    expect(b.getAttribute('aria-busy')).toBe('true');
    fireEvent.click(b);
    expect(onClick).not.toHaveBeenCalled();
    rerender(<Boto onClick={onClick}>Desar</Boto>);
    fireEvent.click(screen.getByRole('button', { name: 'Desar' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('insígnia de taxonomia reusa les classes vives', () => {
    render(<><Insignia tipus="sistema">Mur</Insignia><Insignia to="exit">Ok</Insignia></>);
    expect(screen.getByText('Mur').className).toBe('sdp-badge-system');
    expect(screen.getByText('Ok').className).toBe('sdp-insignia sdp-insignia--exit');
  });
});