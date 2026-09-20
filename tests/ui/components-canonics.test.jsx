/**
 * Components canònics de Pedra Seca. `render` de Preact directe, com la resta
 * de proves de ui/: @testing-library/react pinta amb el react-dom real.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render as pinta, act } from '@testing-library/react';
import { Camp, CampText, Interruptor, GrupOpcions } from '../../src/components/PedraSeca/organismes/formulari.jsx';
import { Alerta } from '../../src/components/PedraSeca/molecules/Alerta.jsx';
import { Pestanyes } from '../../src/components/PedraSeca/organismes/Pestanyes.jsx';
import { finestraPagines } from '../../src/components/PedraSeca/organismes/navegacio.jsx';
import { Dialeg } from '../../src/components/PedraSeca/organismes/Dialeg.jsx';
import { Boto } from '../../src/components/PedraSeca/atoms/Boto.jsx';
import { Insignia } from '../../src/components/PedraSeca/atoms/Insignia.jsx';

let arrel;
beforeEach(() => { arrel = document.createElement('div'); document.body.appendChild(arrel); });
afterEach(() => { pinta(null, arrel); arrel.remove(); });
const render = (vnode) => { act(() => { pinta(vnode, arrel); }); return { container: arrel, rerender: (v) => act(() => { pinta(v, arrel); }) }; };
const $ = (sel) => arrel.querySelector(sel);
const $$ = (sel) => [...arrel.querySelectorAll(sel)];
const clica = (el) => act(() => { el.click(); });
const tecla = (el, key) => act(() => { el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })); });

describe('Camp', () => {
  it('connecta etiqueta, ajuda i error amb el control', () => {
    render(<Camp etiqueta="Telèfon" ajuda="9 dígits" error="Falta un dígit" obligatori><CampText /></Camp>);
    const input = $('input');
    expect($('label').htmlFor).toBe(input.id);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.required).toBe(true);
    const desc = input.getAttribute('aria-describedby').split(' ').map((id) => document.getElementById(id).textContent);
    expect(desc).toEqual(['9 dígits', 'Falta un dígit']);
  });
  it('un control fora de <Camp> falla tancat', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<CampText />)).toThrow(/dins de <Camp>/);
    err.mockRestore();
  });
});

describe('Interruptor i GrupOpcions', () => {
  it('l’interruptor és un switch amb estat en text', () => {
    const onCanvi = vi.fn();
    render(<Interruptor etiqueta="Avisos" actiu={false} onCanvi={onCanvi} />);
    const sw = $('[role="switch"]');
    expect(document.getElementById(sw.getAttribute('aria-labelledby')).textContent).toBe('Avisos');
    expect(sw.getAttribute('aria-checked')).toBe('false');
    expect(sw.textContent).toContain('No');
    clica(sw);
    expect(onCanvi).toHaveBeenCalledWith(true);
  });
  it('els ràdios viuen dins d’un fieldset amb llegenda', () => {
    render(<GrupOpcions llegenda="Mida" valor="a" opcions={[{ valor: 'a', etiqueta: 'A' }, { valor: 'b', etiqueta: 'B' }]} />);
    const grup = $('fieldset');
    expect(grup.querySelector('legend').textContent).toBe('Mida');
    expect($$('input[type="radio"]')[0].checked).toBe(true);
  });
});

describe('Alerta', () => {
  it('només l’error interromp (role=alert); la resta és status', () => {
    const { rerender } = render(<Alerta to="info">x</Alerta>);
    expect($('[role="status"]')).toBeTruthy();
    rerender(<Alerta to="error">x</Alerta>);
    expect($('[role="alert"]').className).toContain('sdp-alerta--error');
  });
});

describe('Pestanyes', () => {
  it('fletxes, Inici i Fi mouen focus i selecció; només l’activa és tabulable', () => {
    render(<Pestanyes etiqueta="Fitxa" pestanyes={[
      { id: 'a', etiqueta: 'A', contingut: 'pa' }, { id: 'b', etiqueta: 'B', contingut: 'pb' }, { id: 'c', etiqueta: 'C', contingut: 'pc' },
    ]} />);
    const [a, , c] = $$('[role="tab"]');
    expect(a.tabIndex).toBe(0);
    tecla(a, 'ArrowLeft');
    expect(c.getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(c);
    expect($$('[role="tabpanel"]').filter((p) => !p.hidden).map((p) => p.textContent)).toEqual(['pc']);
    tecla(c, 'Home');
    expect(a.getAttribute('aria-selected')).toBe('true');
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
  it('té nom accessible i avisa el pare en lloc de tancar-se sol amb Escape', () => {
    const onTanca = vi.fn();
    render(<Dialeg obert titol="Canviar nom" onTanca={onTanca}>cos</Dialeg>);
    const d = $('dialog');
    expect(d.hasAttribute('open')).toBe(true);
    expect(document.getElementById(d.getAttribute('aria-labelledby')).textContent).toBe('Canviar nom');
    const ev = new Event('cancel', { cancelable: true });
    act(() => { d.dispatchEvent(ev); });
    expect(ev.defaultPrevented).toBe(true);
    expect(onTanca).toHaveBeenCalledWith('esc');
  });
});

describe('Boto i Insignia', () => {
  it('carregant desactiva i anuncia', () => {
    render(<Boto carregant>Desar</Boto>);
    const b = $('button');
    expect(b.disabled).toBe(true);
    expect(b.getAttribute('aria-busy')).toBe('true');
    expect(b.textContent).toContain('Treballant');
  });
  it('insígnia de taxonomia reusa les classes vives', () => {
    const { container } = render(<><Insignia tipus="sistema">Mur</Insignia><Insignia to="exit">Ok</Insignia></>);
    expect(container.children[0].className).toBe('sdp-badge-system');
    expect(container.children[1].className).toBe('sdp-insignia sdp-insignia--exit');
  });
});
