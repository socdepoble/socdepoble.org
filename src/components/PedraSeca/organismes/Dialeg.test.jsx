/* T40–T41 (ordre del Mestre, 260928) · poliment · El <dialog> natiu i l'estat
   de React no poden divergir. Dos Escape seguits: el segon `cancel` ja no és
   cancel·lable i el navegador tanca el diàleg pel seu compte. jsdom no té
   showModal (el Dialeg posa l'atribut `open`): el tancament natiu s'emula
   com el fa el navegador (fora `open` i l'esdeveniment `close`). */
import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { Dialeg } from './Dialeg.jsx';

afterEach(cleanup);

function Arnes({ onTanca = () => {}, accepta = true }) {
  const [obert, setObert] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setObert(true)}>Obrir</button>
      <Dialeg obert={obert} titol="Prova" onTanca={(...args) => { onTanca(...args); if (accepta) setObert(false); }}>
        <p>Cos</p>
      </Dialeg>
    </>
  );
}

const tancaNatiu = (dialeg) => act(() => {
  dialeg.removeAttribute('open');
  dialeg.dispatchEvent(new Event('close'));
});

test('si el navegador tanca el <dialog> pel seu compte, avisa el pare amb «esc» i { forcat: true }', () => {
  const onTanca = vi.fn();
  render(<Arnes onTanca={onTanca} />);
  const dialeg = screen.getByRole('dialog', { name: 'Prova' });
  tancaNatiu(dialeg);
  expect(onTanca).toHaveBeenCalledWith('esc', { forcat: true });
  expect(screen.queryByRole('dialog')).toBeNull();
  // El pare l'ha donat per tancat: es pot tornar a obrir.
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'Obrir' })); });
  expect(screen.getByRole('dialog', { name: 'Prova' })).toBeTruthy();
});

test('el tancament que ordena el pare (obert=false) no torna a cridar onTanca', () => {
  const onTanca = vi.fn();
  render(<Arnes onTanca={onTanca} />);
  const dialeg = screen.getByRole('dialog', { name: 'Prova' });
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'Tancar' })); });
  expect(onTanca).toHaveBeenCalledTimes(1);
  expect(onTanca).toHaveBeenCalledWith('boto');
  // L'esdeveniment `close` del tancament propi arriba després: ja no és cap sorpresa.
  act(() => { dialeg.dispatchEvent(new Event('close')); });
  expect(onTanca).toHaveBeenCalledTimes(1);
});

test('el primer Escape (cancel·lable) continua sent del pare: el <dialog> no es tanca a esquenes de React', () => {
  const onTanca = vi.fn();
  render(<Arnes onTanca={onTanca} accepta={false} />);
  const dialeg = screen.getByRole('dialog', { name: 'Prova' });
  const cancel = new Event('cancel', { cancelable: true });
  act(() => { dialeg.dispatchEvent(cancel); });
  expect(cancel.defaultPrevented).toBe(true);
  expect(onTanca).toHaveBeenCalledWith('esc');
  expect(screen.getByRole('dialog', { name: 'Prova' })).toBeTruthy();
});
