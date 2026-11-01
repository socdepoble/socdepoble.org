/* P0-24 (G2120-07, marató 261101_2143) · L'Arrere d'Android i l'Escape
   comparteixen camí: els dos criden onTanca('esc'). Diàlegs niats: l'Arrere
   tanca el de dalt primer, i una confirmació destructiva mai confirma. */
import React, { useState } from 'react';
import { act, cleanup, render, renderHook, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { Dialeg, DialegConfirmacio } from './Dialeg.jsx';
import { useCapaEnrere } from '../hooks/useCapaEnrere.js';
import { _reiniciaPilaEnrere, capesEnrereObertes, obriCapaEnrere, tancaCapaSuperior } from '../../../config/pilaEnrere.js';

afterEach(() => { cleanup(); _reiniciaPilaEnrere(); });

/* Cada Arrere, un segon més tard: fora de la finestra d'absorció. */
let rellotge = 10_000;
const arrere = () => { let r; act(() => { rellotge += 1000; r = tancaCapaSuperior(rellotge); }); return r; };

function Dos({ onTanca }) {
  const [a, setA] = useState(true);
  const [b, setB] = useState(true);
  return (
    <>
      <Dialeg obert={a} titol="A" onTanca={(m) => { onTanca('A', m); setA(false); }}><p>a</p></Dialeg>
      <Dialeg obert={b} titol="B" onTanca={(m) => { onTanca('B', m); setB(false); }}><p>b</p></Dialeg>
    </>
  );
}

test('obri A i B: Arrere tanca B, Arrere tanca A, el tercer no consumix (el natiu navega)', () => {
  const onTanca = vi.fn();
  render(<Dos onTanca={onTanca} />);
  expect(capesEnrereObertes()).toBe(2);
  expect(arrere()).toBe(true);
  expect(onTanca).toHaveBeenLastCalledWith('B', 'esc');
  expect(screen.queryByRole('dialog', { name: 'B' })).toBeNull();
  expect(screen.getByRole('dialog', { name: 'A' })).toBeTruthy();
  expect(capesEnrereObertes()).toBe(1);
  expect(arrere()).toBe(true);
  expect(onTanca).toHaveBeenLastCalledWith('A', 'esc');
  expect(onTanca).toHaveBeenCalledTimes(2);
  expect(arrere()).toBe(false);
});

test('Escape (cancel cancel·lable) i Arrere arriben al pare amb el mateix motiu', () => {
  const onTanca = vi.fn();
  render(<Dialeg obert titol="C" onTanca={onTanca}><p>c</p></Dialeg>);
  const d = screen.getByRole('dialog', { name: 'C' });
  act(() => { d.dispatchEvent(new Event('cancel', { cancelable: true })); });
  arrere();
  expect(onTanca.mock.calls).toEqual([['esc'], ['esc']]);
});

test('una confirmació destructiva mai confirma amb Arrere: tanca com «Cancel·lar» i la de sota queda', () => {
  const onConfirma = vi.fn();
  const onTancaConfirma = vi.fn();
  const onTancaEditor = vi.fn();
  render(
    <>
      <Dialeg obert titol="Editor" onTanca={onTancaEditor}><p>e</p></Dialeg>
      <DialegConfirmacio obert destructiu titol="Descartar canvis?" onTanca={onTancaConfirma} onConfirma={onConfirma} />
    </>
  );
  expect(arrere()).toBe(true);
  expect(onTancaConfirma).toHaveBeenCalledWith('esc');
  expect(onConfirma).not.toHaveBeenCalled();
  expect(onTancaEditor).not.toHaveBeenCalled();
});

/* Corrector 261102 (ARB-B3B-01) · Només torna a pintar el de SOTA: si el
   hook es tornara a apuntar a cada pintat, A pujaria damunt de B. */
let repintaEditor;
function Editor({ onTanca }) {
  const [versio, setVersio] = useState(0);
  repintaEditor = () => setVersio((v) => v + 1);
  return <Dialeg obert titol="A" onTanca={(m) => onTanca(versio, m)}><p>{versio}</p></Dialeg>;
}
function Confirmacio({ onTanca }) {
  const [obert, setObert] = useState(true);
  return <Dialeg obert={obert} titol="B" onTanca={(m) => { onTanca(m); setObert(false); }}><p>b</p></Dialeg>;
}

test('el de sota torna a pintar amb un onTanca nou: no puja damunt i, quan li toca, crida el nou', () => {
  const deA = vi.fn();
  const deB = vi.fn();
  render(<><Editor onTanca={deA} /><Confirmacio onTanca={deB} /></>);
  act(() => { repintaEditor(); });
  expect(capesEnrereObertes()).toBe(2);
  expect(arrere()).toBe(true);
  expect(deB).toHaveBeenCalledWith('esc');
  expect(deA).not.toHaveBeenCalled();
  expect(arrere()).toBe(true);
  expect(deA.mock.calls).toEqual([[1, 'esc']]);
});

/* Corrector 261102 (ARB-B3B-03, A5) · El hook sol: Dialeg li passa una
   clausura sobre el seu propi ref i amagaria un ref del hook que no s'actualitza. */
test('useCapaEnrere: canviar tanca no reordena la pila i l’Arrere crida la més nova', () => {
  const vella = vi.fn();
  const nova = vi.fn();
  const deDalt = vi.fn();
  const { rerender, unmount } = renderHook(({ tanca }) => useCapaEnrere(true, tanca), { initialProps: { tanca: vella } });
  const llevaDalt = obriCapaEnrere(deDalt);
  rerender({ tanca: nova });
  expect(capesEnrereObertes()).toBe(2);
  expect(tancaCapaSuperior(100_000)).toBe(true);
  expect(deDalt).toHaveBeenCalledTimes(1);
  llevaDalt();
  expect(tancaCapaSuperior(101_000)).toBe(true);
  expect(nova).toHaveBeenCalledTimes(1);
  expect(vella).not.toHaveBeenCalled();
  unmount();
  expect(capesEnrereObertes()).toBe(0);
});

test('un diàleg tancat (obert=false) no és a la pila, i en obrir-se hi entra', () => {
  const { rerender } = render(<DialegConfirmacio obert={false} titol="D" onTanca={() => {}} onConfirma={() => {}} />);
  expect(capesEnrereObertes()).toBe(0);
  rerender(<DialegConfirmacio obert titol="D" onTanca={() => {}} onConfirma={() => {}} />);
  expect(capesEnrereObertes()).toBe(1);
  rerender(<DialegConfirmacio obert={false} titol="D" onTanca={() => {}} onConfirma={() => {}} />);
  expect(capesEnrereObertes()).toBe(0);
});

test('desmuntar un diàleg obert el trau de la pila', () => {
  const { unmount } = render(<Dialeg obert titol="E" onTanca={() => {}} />);
  expect(capesEnrereObertes()).toBe(1);
  unmount();
  expect(capesEnrereObertes()).toBe(0);
});
