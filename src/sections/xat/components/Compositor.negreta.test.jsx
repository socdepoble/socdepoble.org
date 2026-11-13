/* R21.8 (substituïx el botó visible [N] d'IDEA-53) · «Escriure en negreta» viu
   dins del menú del [+] (davall de les opcions d'adjunts, i com a única opció
   quan el node no té adjunts), deixant la barra inferior 100% neta com a
   WhatsApp: [+] [😊 Escriu…] [🎤 / ✈️]. Cmd/Ctrl+B continua idèntic, i un camp
   amb només `**` es considera buit a efectes d'enviament. */
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
/* Gauntlet R22 (xat-02) · Sense adjunts, el + es diu «Més opcions»: no promet adjuntar. */
const mes = () => screen.getByRole('button', { name: 'Més opcions' });
const clicaNegreta = () => {
  fireEvent.click(mes());
  fireEvent.click(screen.getByRole('menuitem', { name: 'Escriure en negreta' }));
};
const tria = (inici, fi = inici) => { camp().focus(); camp().setSelectionRange(inici, fi); };
const seleccio = () => [camp().selectionStart, camp().selectionEnd];

describe('«Escriure en negreta» dins del menú + (R21.8)', () => {
  test('cap botó [N] dins del camp; l’opció viu dins del menú del +', () => {
    render(<Prova />);
    expect(screen.queryByRole('button', { name: 'Negreta' })).toBeNull();
    expect(document.querySelector('.sdp-xat-compositor__negreta')).toBeNull();
    expect(camp().parentElement.classList.contains('sdp-xat-compositor__camp--negreta')).toBe(false);
    expect(screen.queryByRole('button', { name: 'Adjunta' })).toBeNull();
    fireEvent.click(mes());
    const item = screen.getByRole('menuitem', { name: 'Escriure en negreta' });
    expect(item).toBeTruthy();
  });

  test('desactivat amb el camp: el + queda aria-disabled i no obri el menú', () => {
    render(<Prova desactivat />);
    expect(mes().getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(mes());
    expect(screen.queryByRole('menu')).toBeNull();
  });

  test('amb selecció: embolica, tanca el menú i la selecció i el focus tornen al camp; repetir desfà', async () => {
    const onCanvia = vi.fn();
    render(<Prova inicial="Bon dia" onCanvia={onCanvia} />);
    tria(4, 7);
    clicaNegreta();
    await waitFor(() => expect(camp().value).toBe('Bon *dia*'));
    expect(screen.queryByRole('menu')).toBeNull();
    expect(onCanvia).toHaveBeenLastCalledWith('Bon *dia*');
    expect(seleccio()).toEqual([5, 8]);
    expect(document.activeElement).toBe(camp());
    clicaNegreta();
    await waitFor(() => expect(camp().value).toBe('Bon dia'));
    expect(seleccio()).toEqual([4, 7]);
  });

  test('en camp buit: inserix ** amb el cursor al mig (*|*), però NO activa Envia ni envia ** buits', async () => {
    const onEnvia = vi.fn();
    render(<Prova inicial="" onEnvia={onEnvia} />);
    clicaNegreta();
    await waitFor(() => expect(camp().value).toBe('**'));
    expect(seleccio()).toEqual([1, 1]);
    expect(document.activeElement).toBe(camp());
    expect(screen.getByRole('button', { name: 'Envia' }).disabled).toBe(true);
    fireEvent.keyDown(camp(), { key: 'Enter' });
    expect(onEnvia).not.toHaveBeenCalled();
  });

  test('sense selecció després de text: ** amb el cursor al mig, i Retorn envia quan ja hi ha text real', async () => {
    const onEnvia = vi.fn();
    render(<Prova inicial="Hola " onEnvia={onEnvia} />);
    tria(5);
    clicaNegreta();
    await waitFor(() => expect(camp().value).toBe('Hola **'));
    expect(seleccio()).toEqual([6, 6]);
    expect(fireEvent.keyDown(camp(), { key: 'Enter' })).toBe(false);
    expect(onEnvia).toHaveBeenCalledWith('Hola **');
  });

  test('sense selecció enmig d’una paraula: literal, cap embolcall de paraula', async () => {
    render(<Prova inicial="hola" />);
    tria(2);
    clicaNegreta();
    await waitFor(() => expect(camp().value).toBe('ho**la'));
    expect(seleccio()).toEqual([3, 3]);
  });

  test('amb el focus fora, s’aplica a l’última selecció del camp i el focus hi torna', async () => {
    render(<Prova inicial="Bon dia" />);
    tria(4, 7);
    fireEvent.select(camp());
    screen.getByRole('button', { name: 'Fora' }).focus();
    clicaNegreta();
    await waitFor(() => expect(camp().value).toBe('Bon *dia*'));
    expect(document.activeElement).toBe(camp());
    expect(seleccio()).toEqual([5, 8]);
  });

  test('si no hi cap (4.096), no canvia res ni avisa el pare', () => {
    const onCanvia = vi.fn();
    const ple = 'a'.repeat(4095);
    render(<Prova inicial={ple} onCanvia={onCanvia} />);
    tria(0, ple.length);
    clicaNegreta();
    expect(camp().value).toBe(ple);
    expect(onCanvia).not.toHaveBeenCalled();
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

  test('Cmd+B també', async () => {
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
