/* Gauntlet 261025_0545 (carril de la vista del xat) · El compositor:
   el focus que no se'n va en enviar (XU-01), el Retorn que decidix el tipus
   d'entrada i no l'amplària (XU-03), la composició d'un IME que no envia ni
   cancel·la res (XU-06), el comptador que només s'anuncia als llindars
   (XU-16), la direcció del text (XU-14) i la interpolació amb funció (TE-03). */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import Compositor from './Compositor.jsx';

const t = (_, alternativa) => alternativa;
const TACTIL = '(hover: none) and (pointer: coarse)';

afterEach(() => {
  cleanup();
  delete globalThis.matchMedia;
});

/* Un pare de veres: el valor viu a l'estat i enviar el buida, com Conversa. */
function Prova({ inicial = '', mida = 'ample', onEnvia = () => {}, ...props }) {
  const [valor, setValor] = useState(inicial);
  return (
    <AppGridContext.Provider value={{ mida, setPanellObert: vi.fn() }}>
      <Compositor valor={valor} onCanvia={setValor} onEnvia={() => { onEnvia(valor); setValor(''); }} t={t} {...props} />
    </AppGridContext.Provider>
  );
}

const camp = () => screen.getByRole('textbox', { name: 'Escriu un missatge' });
const envia = () => screen.getByRole('button', { name: 'Envia' });
const tactil = (es) => {
  globalThis.matchMedia = (consulta) => ({ matches: es && consulta === TACTIL, media: consulta, addEventListener() {}, removeEventListener() {} });
};

describe('XU-01 · enviar no treu el focus del camp', () => {
  test('prémer el botó (ratolí o dit) no li dona el focus: el teclat del mòbil no es tanca', () => {
    render(<Prova inicial="hola" />);
    camp().focus();
    /* fireEvent torna false si el pare ha cridat preventDefault. */
    expect(fireEvent.mouseDown(envia())).toBe(false);
    fireEvent.click(envia());
    expect(document.activeElement).toBe(camp());
  });

  test('amb el teclat sobre el botó (Tab i Retorn), en enviar el focus torna al camp i no cau a <body>', () => {
    const onEnvia = vi.fn();
    render(<Prova inicial="hola" onEnvia={onEnvia} />);
    envia().focus();
    expect(document.activeElement).toBe(envia());
    fireEvent.click(envia());
    expect(onEnvia).toHaveBeenCalledWith('hola');
    expect(envia().disabled).toBe(true);
    expect(document.activeElement).toBe(camp());
  });

  test('sense el focus al compositor, enviar no l’hi porta', () => {
    render(<><Prova inicial="hola" /><button type="button">Fora</button></>);
    screen.getByRole('button', { name: 'Fora' }).focus();
    fireEvent.click(envia());
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Fora' }));
  });
});

describe('XU-03 · el Retorn segons el tipus d’entrada, no l’amplària', () => {
  test('estret amb ratolí i teclat (una columna de WordPress, mitja finestra): Retorn envia i el teclat diu «envia»', () => {
    tactil(false);
    const onEnvia = vi.fn();
    render(<Prova mida="estret" inicial="prova" onEnvia={onEnvia} />);
    expect(camp().getAttribute('enterkeyhint')).toBe('send');
    fireEvent.keyDown(camp(), { key: 'Enter', shiftKey: true });
    expect(onEnvia).not.toHaveBeenCalled();
    fireEvent.keyDown(camp(), { key: 'Enter' });
    expect(onEnvia).toHaveBeenCalledWith('prova');
  });

  test('estret i tàctil (el mòbil): Retorn fa salt de línia, com sempre', () => {
    tactil(true);
    const onEnvia = vi.fn();
    render(<Prova mida="estret" inicial="prova" onEnvia={onEnvia} />);
    expect(camp().getAttribute('enterkeyhint')).toBe('enter');
    expect(fireEvent.keyDown(camp(), { key: 'Enter' })).toBe(true);
    expect(onEnvia).not.toHaveBeenCalled();
  });

  test('ample, tàctil o no: Retorn envia, com abans', () => {
    tactil(true);
    const onEnvia = vi.fn();
    render(<Prova inicial="prova" onEnvia={onEnvia} />);
    fireEvent.keyDown(camp(), { key: 'Enter' });
    expect(onEnvia).toHaveBeenCalledTimes(1);
  });
});

describe('XU-06 · la composició d’un IME (Safari: compositionend abans del keydown, keyCode 229)', () => {
  test('el Retorn que confirma la composició no envia', () => {
    const onEnvia = vi.fn();
    render(<Prova inicial="にほん" onEnvia={onEnvia} />);
    fireEvent.keyDown(camp(), { key: 'Enter', keyCode: 229, which: 229 });
    expect(onEnvia).not.toHaveBeenCalled();
    /* Safari: compositionend arriba abans del keydown que confirma, i eixe
       keydown ja no diu isComposing però porta el 229. */
    fireEvent.compositionStart(camp());
    fireEvent.compositionEnd(camp());
    fireEvent.keyDown(camp(), { key: 'Enter', keyCode: 229, which: 229 });
    expect(onEnvia).not.toHaveBeenCalled();
  });

  /* Revisió 261025 · Chrome amb l'IME coreà (Windows i Mac) i Gboard a
     Android disparen compositionend i tot seguit un Retorn de veres (13):
     eixe Retorn és de qui escriu i envia, com abans del Gauntlet. */
  test('Chrome coreà o Gboard: el Retorn de veres que ve just després de compositionend envia', () => {
    const onEnvia = vi.fn();
    render(<Prova inicial="안녕" onEnvia={onEnvia} />);
    fireEvent.compositionStart(camp());
    fireEvent.keyDown(camp(), { key: 'Enter', keyCode: 229, which: 229, isComposing: true });
    expect(onEnvia).not.toHaveBeenCalled();
    fireEvent.compositionEnd(camp());
    expect(fireEvent.keyDown(camp(), { key: 'Enter', keyCode: 13, which: 13 })).toBe(false);
    expect(onEnvia).toHaveBeenCalledTimes(1);
    expect(onEnvia).toHaveBeenCalledWith('안녕');
  });

  test('una composició que no acaba mai (sense compositionend) no deixa morts Retorn ni Escape: en eixir del camp es desfà', () => {
    const onEnvia = vi.fn();
    const onEscapa = vi.fn();
    render(<Prova inicial="hola" onEnvia={onEnvia} onEscapa={onEscapa} />);
    fireEvent.compositionStart(camp());
    fireEvent.blur(camp());
    fireEvent.focus(camp());
    fireEvent.keyDown(camp(), { key: 'Escape', keyCode: 27, which: 27 });
    expect(onEscapa).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(camp(), { key: 'Enter', keyCode: 13, which: 13 });
    expect(onEnvia).toHaveBeenCalledWith('hola');
  });

  test('passada la composició, Retorn torna a enviar', () => {
    vi.useFakeTimers();
    try {
      const onEnvia = vi.fn();
      render(<Prova inicial="にほん" onEnvia={onEnvia} />);
      fireEvent.compositionStart(camp());
      fireEvent.compositionEnd(camp());
      vi.advanceTimersByTime(1000);
      fireEvent.keyDown(camp(), { key: 'Enter' });
      expect(onEnvia).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  test('Escape durant la composició no cancel·la la resposta (és de l’IME)', () => {
    const onEscapa = vi.fn();
    render(<Prova inicial="にほん" onEscapa={onEscapa} />);
    fireEvent.compositionStart(camp());
    expect(fireEvent.keyDown(camp(), { key: 'Escape', keyCode: 229 })).toBe(true);
    expect(fireEvent.keyDown(camp(), { key: 'Escape' })).toBe(true);
    expect(onEscapa).not.toHaveBeenCalled();
    fireEvent.compositionEnd(camp());
  });
});

describe('XU-16 · el comptador', () => {
  test('el número visible no és una regió en viu; l’avís per al lector només canvia als llindars', () => {
    const { rerender } = render(
      <AppGridContext.Provider value={{ mida: 'ample', setPanellObert: vi.fn() }}>
        <Compositor valor={'a'.repeat(3899)} onCanvia={() => {}} onEnvia={() => {}} t={t} />
      </AppGridContext.Provider>
    );
    const pinta = (n) => rerender(
      <AppGridContext.Provider value={{ mida: 'ample', setPanellObert: vi.fn() }}>
        <Compositor valor={'a'.repeat(n)} onCanvia={() => {}} onEnvia={() => {}} t={t} />
      </AppGridContext.Provider>
    );
    const viu = () => document.querySelector('form [aria-live]');
    expect(viu().textContent).toBe('');
    pinta(3900);
    const comptador = document.getElementById('xat-message-comptador');
    expect(comptador.textContent).toBe('3900 de 4096 caràcters');
    expect(comptador.hasAttribute('aria-live')).toBe(false);
    expect(viu().textContent).toBe('3900 de 4096 caràcters');
    pinta(3901);
    pinta(3950);
    expect(comptador.textContent).toBe('3950 de 4096 caràcters');
    expect(viu().textContent).toBe('3900 de 4096 caràcters');
    pinta(4000);
    expect(viu().textContent).toBe('4000 de 4096 caràcters');
    pinta(4096);
    expect(viu().textContent).toBe('4096 de 4096 caràcters');
    pinta(10);
    expect(viu().textContent).toBe('');
  });
});

test('XU-14 · el camp pren la direcció del text que s’hi escriu (dir="auto")', () => {
  render(<Prova />);
  expect(camp().getAttribute('dir')).toBe('auto');
});

test('TE-03 · un nom amb «$&», «$\'» o «$`» es pinta tal qual a la línia de qui signa i a l’avís públic', () => {
  const fil = { id: 'c', tipus: 'directe', comEntitat: true, entitatNom: "Bar $` $& $' Co", subjecte: { titol: "Plaça $'" } };
  render(<Prova fil={fil} />);
  expect(screen.getByText("Escrius com a Bar $` $& $' Co.")).toBeTruthy();
  expect(screen.getByText("Escrius al xat públic de «Plaça $'».")).toBeTruthy();
});
