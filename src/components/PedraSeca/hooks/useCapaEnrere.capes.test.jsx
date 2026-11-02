/* P0-24b (T2, prompt 261102_1532) · Les capes flotants que no són <dialog>
   també són a la pila de l'Arrere d'Android (config/pilaEnrere.js), cada una
   amb el MATEIX camí que el seu Escape: el menú emergent (useMenuEmergent:
   tanca i torna el focus al botó), el desplegable (Dropdown: es tanca), el
   calaix d'emoticones del xat (SelectorEmoticones: onTanca) i la pàgina
   d'emojis (PaginaEmojis: onTornar). Patró: organismes/Dialeg.enrere.test.jsx. */
import { useRef, useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { useMenuEmergent } from './useMenuEmergent.js';
import { Dropdown, DropdownItem } from '../molecules/Dropdown.jsx';
import { PaginaEmojis } from '../../universal/classificacio/PaginaEmojis.jsx';
import SelectorEmoticones from '../../../sections/xat/components/SelectorEmoticones.jsx';
import { _reiniciaPilaEnrere, capesEnrereObertes, tancaCapaSuperior } from '../../../config/pilaEnrere.js';

afterEach(() => { cleanup(); _reiniciaPilaEnrere(); });

/* Cada Arrere, un segon més tard: fora de la finestra d'absorció. */
let rellotge = 10_000;
const arrere = () => { let r; act(() => { rellotge += 1000; r = tancaCapaSuperior(rellotge); }); return r; };

const FILES = '[role="menuitem"]';
const t = (_, alternativa) => alternativa;
/* Un catàleg buit que arriba de seguida: el calaix i la pàgina no en necessiten cap. */
const senseCataleg = () => Promise.resolve({ GRUPS_EMOJIS: [] });
const res = () => {};

/* Un botó que obri i un menú d'una fila, amb el hook i res més (el patró de
   useMenuEmergent.test.jsx). Qui el munta ho fa en obrir-lo: ací, en pintar-lo. */
function Menu({ onTanca, mostra = false }) {
  const boto = useRef(null);
  const { ref, mouFocus } = useMenuEmergent({ files: FILES, onTria: res, onTanca, botoRef: boto, mostra });
  return (
    <>
      <button type="button" ref={boto}>Obri</button>
      <div ref={ref} role="menu" aria-label="Prova" onKeyDown={mouFocus}>
        <button type="button" role="menuitem">U</button>
      </div>
    </>
  );
}

describe('useMenuEmergent', () => {
  test('el menú obert és a la pila; l’Arrere fa el camí de l’Escape (tanca i torna el focus al botó); desmuntar el lleva', () => {
    const onTanca = vi.fn();
    const { unmount } = render(<Menu onTanca={onTanca} />);
    expect(capesEnrereObertes()).toBe(1);
    expect(document.activeElement).toBe(screen.getByRole('menuitem'));
    // L'Escape: tanca i torna el focus al botó.
    fireEvent.keyDown(screen.getByRole('menuitem'), { key: 'Escape' });
    expect(onTanca).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Obri' }));
    // L'Arrere: el mateix.
    screen.getByRole('menuitem').focus();
    expect(arrere()).toBe(true);
    expect(onTanca).toHaveBeenCalledTimes(2);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Obri' }));
    unmount();
    expect(capesEnrereObertes()).toBe(0);
    expect(arrere()).toBe(false);
  });

  test('amb mostra (l’espècimen del catàleg) no s’apunta cap capa', () => {
    const onTanca = vi.fn();
    render(<Menu onTanca={onTanca} mostra />);
    expect(capesEnrereObertes()).toBe(0);
    expect(arrere()).toBe(false);
    expect(onTanca).not.toHaveBeenCalled();
  });
});

describe('Dropdown', () => {
  test('tancat no és a la pila; obert, sí; l’Arrere el tanca, com l’Escape', () => {
    render(<Dropdown trigger="Opcions"><DropdownItem onClick={res}>Fila</DropdownItem></Dropdown>);
    const disparador = screen.getByRole('button', { name: 'Opcions' });
    expect(capesEnrereObertes()).toBe(0);
    fireEvent.click(disparador);
    expect(screen.getByRole('button', { name: 'Fila' })).toBeTruthy();
    expect(capesEnrereObertes()).toBe(1);
    expect(arrere()).toBe(true);
    expect(screen.queryByRole('button', { name: 'Fila' })).toBeNull();
    expect(capesEnrereObertes()).toBe(0);
    // L'Escape, el mateix camí.
    fireEvent.click(disparador);
    expect(capesEnrereObertes()).toBe(1);
    fireEvent.keyDown(disparador, { key: 'Escape' });
    expect(screen.queryByRole('button', { name: 'Fila' })).toBeNull();
    expect(capesEnrereObertes()).toBe(0);
  });
});

describe('SelectorEmoticones', () => {
  test('el calaix (muntat només obert) és a la pila; l’Arrere crida onTanca, com l’Escape; desmuntar el lleva', async () => {
    const onTanca = vi.fn();
    const { unmount } = render(<SelectorEmoticones id="e" t={t} onTria={res} onTanca={onTanca} carregaCataleg={senseCataleg} />);
    expect(capesEnrereObertes()).toBe(1);
    // El catàleg (buit) ja ha arribat: només queda «Del poble».
    await waitFor(() => expect(screen.getAllByRole('tab')).toHaveLength(1));
    expect(arrere()).toBe(true);
    expect(onTanca).toHaveBeenCalledTimes(1);
    const esdeveniment = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    act(() => { screen.getByRole('tab').dispatchEvent(esdeveniment); });
    expect(onTanca).toHaveBeenCalledTimes(2);
    unmount();
    expect(capesEnrereObertes()).toBe(0);
    expect(arrere()).toBe(false);
  });
});

describe('PaginaEmojis', () => {
  test('la pàgina (muntada només oberta) és a la pila; l’Arrere crida onTornar, com l’Escape; desmuntar-la la lleva', async () => {
    const onTornar = vi.fn();
    const { unmount } = render(<PaginaEmojis onTornar={onTornar} onTria={res} carregaCataleg={senseCataleg} />);
    expect(capesEnrereObertes()).toBe(1);
    // El catàleg (buit) ja ha arribat: la graella pinta el cercador.
    await screen.findByRole('searchbox');
    expect(arrere()).toBe(true);
    expect(onTornar).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onTornar).toHaveBeenCalledTimes(2);
    unmount();
    expect(capesEnrereObertes()).toBe(0);
    expect(arrere()).toBe(false);
  });
});

/* L'ordre és el d'obertura: el calaix damunt del menú es tanca primer. El
   calaix es desmunta en tancar-se, com fa el Compositor; el menú (mock) no. */
function MenuICalaix({ ordre }) {
  const [calaix, setCalaix] = useState(true);
  return (
    <>
      <Menu onTanca={() => ordre.push('menu')} />
      {calaix ? (
        <SelectorEmoticones id="e2" t={t} onTria={res} onTanca={() => { ordre.push('calaix'); setCalaix(false); }} carregaCataleg={senseCataleg} />
      ) : null}
    </>
  );
}

test('dues capes: l’Arrere tanca la de dalt (el calaix) i després la de sota (el menú)', async () => {
  const ordre = [];
  render(<MenuICalaix ordre={ordre} />);
  await waitFor(() => expect(screen.getAllByRole('tab')).toHaveLength(1));
  expect(capesEnrereObertes()).toBe(2);
  expect(arrere()).toBe(true);
  expect(ordre).toEqual(['calaix']);
  expect(screen.queryByRole('tab')).toBeNull();
  expect(capesEnrereObertes()).toBe(1);
  expect(arrere()).toBe(true);
  expect(ordre).toEqual(['calaix', 'menu']);
});
