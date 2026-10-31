/* IDEA-53 (pla 261029_1605, Bloc B) · El botó [N] i Cmd/Ctrl+B al
   compositor, amb el comportament literal del pla: amb text seleccionat
   l'embolica amb *…* (o el desembolica si ja era negreta) i la selecció i el
   focus es queden al camp; sense selecció, insereix ** amb el cursor al mig.
   El botó no pren el focus al camp, la drecera respecta l'IME i no commuta
   amb la tecla mantinguda, i Retorn i Escape continuen com sempre. */
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import { buidaRecents } from '../emoticonesXat.js';
import Compositor from './Compositor.jsx';

/* El catàleg de veres pesa 292 kB: ací, una família sintètica. */
vi.mock('../../notes/canalEmojis.js', () => ({
  carregaCatalegEmojis: async () => ({
    GRUPS_EMOJIS: [
      { id: 'cares-emocions', nom: 'Cares', emojis: [['1F600', '😀', 'grinning face']] }
    ]
  })
}));

afterEach(() => { cleanup(); buidaRecents(); vi.unstubAllGlobals(); });

const t = (_, alternativa) => alternativa;

function Prova({ inicial = '', onCanvia = () => {}, onEnvia = () => {}, ...props }) {
  const [valor, setValor] = useState(inicial);
  return (
    <AppGridContext.Provider value={{ mida: 'ample', setPanellObert: vi.fn() }}>
      <Compositor
        valor={valor}
        onCanvia={(nou) => { onCanvia(nou); setValor(nou); }}
        onEnvia={() => { onEnvia(valor); setValor(''); }}
        t={t}
        {...props}
      />
      <button type="button">Fora</button>
    </AppGridContext.Provider>
  );
}

const camp = () => screen.getByRole('textbox', { name: 'Escriu un missatge' });
const negreta = () => screen.getByRole('button', { name: 'Negreta' });
const tria = (inici, fi = inici) => { camp().focus(); camp().setSelectionRange(inici, fi); };
const seleccio = () => [camp().selectionStart, camp().selectionEnd];

describe('el botó [N]', () => {
  test('dins del camp, darrere del textarea; títol literal i drecera declarada', () => {
    render(<Prova />);
    const boto = negreta();
    expect(boto.type).toBe('button');
    expect(boto.getAttribute('title')).toBe('Negreta (⌘B / Ctrl+B)');
    expect(boto.getAttribute('aria-keyshortcuts')).toBe('Meta+B Control+B');
    expect(boto.parentElement).toBe(camp().parentElement);
    expect(boto.parentElement.classList.contains('sdp-xat-compositor__camp--negreta')).toBe(true);
    expect(camp().compareDocumentPosition(boto) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // La lletra és decorativa: el nom accessible és «Negreta».
    expect(boto.querySelector('.sdp-xat-compositor__negreta-lletra').getAttribute('aria-hidden')).toBe('true');
    expect(boto.textContent).toBe('N');
  });

  test('desactivat amb el camp', () => {
    render(<Prova desactivat />);
    expect(negreta().disabled).toBe(true);
  });

  test('no pren el focus al camp (mousedown consumit)', () => {
    render(<Prova inicial="Bon dia" />);
    tria(4, 7);
    expect(fireEvent.mouseDown(negreta())).toBe(false);
    expect(document.activeElement).toBe(camp());
  });

  test('amb selecció: embolica, la selecció i el focus es queden sobre el text; un segon clic desfà', async () => {
    const onCanvia = vi.fn();
    render(<Prova inicial="Bon dia" onCanvia={onCanvia} />);
    tria(4, 7);
    fireEvent.click(negreta());
    await waitFor(() => expect(camp().value).toBe('Bon *dia*'));
    expect(onCanvia).toHaveBeenLastCalledWith('Bon *dia*');
    expect(seleccio()).toEqual([5, 8]);
    expect(document.activeElement).toBe(camp());
    fireEvent.click(negreta());
    await waitFor(() => expect(camp().value).toBe('Bon dia'));
    expect(seleccio()).toEqual([4, 7]);
  });

  test('sense selecció: ** amb el cursor al mig, i Retorn envia com sempre', async () => {
    const onEnvia = vi.fn();
    render(<Prova inicial="Hola " onEnvia={onEnvia} />);
    tria(5);
    fireEvent.click(negreta());
    await waitFor(() => expect(camp().value).toBe('Hola **'));
    expect(seleccio()).toEqual([6, 6]);
    expect(fireEvent.keyDown(camp(), { key: 'Enter' })).toBe(false);
    expect(onEnvia).toHaveBeenCalledWith('Hola **');
  });

  test('sense selecció enmig d’una paraula: literal, cap embolcall de paraula', async () => {
    render(<Prova inicial="hola" />);
    tria(2);
    fireEvent.click(negreta());
    await waitFor(() => expect(camp().value).toBe('ho**la'));
    expect(seleccio()).toEqual([3, 3]);
  });

  test('amb el focus fora, s’aplica a l’última selecció del camp i el focus hi torna', async () => {
    render(<Prova inicial="Bon dia" />);
    tria(4, 7);
    fireEvent.select(camp());
    screen.getByRole('button', { name: 'Fora' }).focus();
    fireEvent.click(negreta());
    await waitFor(() => expect(camp().value).toBe('Bon *dia*'));
    expect(document.activeElement).toBe(camp());
    expect(seleccio()).toEqual([5, 8]);
  });

  test('si no hi cap (4.096), no canvia res ni avisa el pare', () => {
    const onCanvia = vi.fn();
    const ple = 'a'.repeat(4095);
    render(<Prova inicial={ple} onCanvia={onCanvia} />);
    tria(0, ple.length);
    fireEvent.click(negreta());
    expect(camp().value).toBe(ple);
    expect(onCanvia).not.toHaveBeenCalled();
  });

  test('amb el calaix d’emoticones obert en ample, [N] no el tanca', async () => {
    render(<Prova inicial="Bon dia" />);
    fireEvent.click(screen.getByRole('button', { name: 'Emoticones' }), { detail: 1 });
    await waitFor(() => expect(screen.getByRole('dialog', { name: 'Emoticones' })).toBeTruthy());
    tria(4, 7);
    fireEvent.pointerDown(negreta());
    fireEvent.mouseDown(negreta());
    fireEvent.click(negreta());
    await waitFor(() => expect(camp().value).toBe('Bon *dia*'));
    expect(screen.getByRole('dialog', { name: 'Emoticones' })).toBeTruthy();
  });
});

describe('la drecera Cmd/Ctrl+B', () => {
  test('Ctrl+B embolica la selecció i queda consumit', async () => {
    render(<Prova inicial="Bon dia" />);
    tria(0, 3);
    expect(fireEvent.keyDown(camp(), { key: 'b', ctrlKey: true })).toBe(false);
    await waitFor(() => expect(camp().value).toBe('*Bon* dia'));
    expect(seleccio()).toEqual([1, 4]);
  });

  test('Cmd+B també (és el que diu el títol)', async () => {
    render(<Prova inicial="Bon dia" />);
    tria(4, 7);
    expect(fireEvent.keyDown(camp(), { key: 'b', metaKey: true })).toBe(false);
    await waitFor(() => expect(camp().value).toBe('Bon *dia*'));
  });

  test('la tecla mantinguda es consumix però no commuta una volta i una altra', () => {
    const onCanvia = vi.fn();
    render(<Prova inicial="Bon dia" onCanvia={onCanvia} />);
    tria(4, 7);
    expect(fireEvent.keyDown(camp(), { key: 'b', ctrlKey: true, repeat: true })).toBe(false);
    expect(onCanvia).not.toHaveBeenCalled();
    expect(camp().value).toBe('Bon dia');
  });

  test.each([
    ['Ctrl+Maj+B', { key: 'B', ctrlKey: true, shiftKey: true }],
    ['Ctrl+Alt+B (AltGr)', { key: 'b', ctrlKey: true, altKey: true }],
    ['B sola', { key: 'b' }]
  ])('%s no és la drecera: no es consumix', (_nom, tecla) => {
    const onCanvia = vi.fn();
    render(<Prova inicial="Bon dia" onCanvia={onCanvia} />);
    tria(4, 7);
    expect(fireEvent.keyDown(camp(), tecla)).toBe(true);
    expect(onCanvia).not.toHaveBeenCalled();
  });

  test('mentre un IME compon, la drecera és seua', () => {
    const onCanvia = vi.fn();
    render(<Prova inicial="Bon dia" onCanvia={onCanvia} />);
    tria(4, 7);
    fireEvent.compositionStart(camp());
    expect(fireEvent.keyDown(camp(), { key: 'b', ctrlKey: true })).toBe(true);
    expect(onCanvia).not.toHaveBeenCalled();
    fireEvent.compositionEnd(camp());
    expect(fireEvent.keyDown(camp(), { key: 'b', ctrlKey: true, keyCode: 229 })).toBe(true);
    expect(onCanvia).not.toHaveBeenCalled();
  });

  test('Escape continua cancel·lant la resposta', () => {
    const onEscapa = vi.fn();
    render(<Prova inicial="Bon dia" onEscapa={onEscapa} />);
    camp().focus();
    expect(fireEvent.keyDown(camp(), { key: 'Escape' })).toBe(false);
    expect(onEscapa).toHaveBeenCalledOnce();
  });
});
