/**
 * Ordre del Mestre (261007) · Correcció C9 · useMenuEmergent, el comportament
 * únic dels menús emergents (MenuTraduir i MenuComentar). Les proves de cada
 * menú (BarraBlava.traduir.test.jsx i BarraBlava.comentar.test.jsx) en
 * cobrixen el focus, l'Escape, el clic fora i les fletxes; ací, el que només
 * es veu des del hook: les escoltes a l'arrel del node dins d'un ShadowRoot
 * (WordPress), l'ordre de la tria i el mode `mostra`.
 */
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { useMenuEmergent } from './useMenuEmergent.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

const FILES = '[role="menuitem"]';

/* Un botó que obri i un menú de dues files, amb el hook i res més. */
function Prova({ onTria, onTanca, mostra = false }) {
  const boto = useRef(null);
  const { ref, tria, mouFocus } = useMenuEmergent({ files: FILES, onTria, onTanca, botoRef: boto, mostra });
  return (
    <>
      <button type="button" ref={boto}>Obri</button>
      <div ref={ref} role="menu" aria-label="Prova" onKeyDown={mouFocus}>
        <button type="button" role="menuitem" onClick={() => tria('u')}>U</button>
        <button type="button" role="menuitem" onClick={() => tria('dos')}>Dos</button>
      </div>
      <button type="button">Fora del menú</button>
    </>
  );
}

/* Una instància dins d'un ShadowRoot, com el Web Component a WordPress. */
function dinsDeShadow() {
  const host = document.createElement('soc-de-poble');
  document.body.append(host);
  const shadow = host.attachShadow({ mode: 'open' });
  const muntatge = document.createElement('div');
  shadow.append(muntatge);
  return { shadow, muntatge };
}

describe('261007 · useMenuEmergent', () => {
  test('dins d’un ShadowRoot les escoltes van a l’arrel de la instància, no al document de l’amfitrió', () => {
    const { shadow, muntatge } = dinsDeShadow();
    const deLArrel = vi.spyOn(shadow, 'addEventListener');
    const delDocument = vi.spyOn(document, 'addEventListener');
    const onTanca = vi.fn();
    render(<Prova onTria={vi.fn()} onTanca={onTanca} />, { container: muntatge });
    expect(deLArrel.mock.calls.map(([tipus]) => tipus).sort()).toEqual(['keydown', 'pointerdown']);
    expect(delDocument.mock.calls.filter(([tipus]) => tipus === 'keydown' || tipus === 'pointerdown')).toEqual([]);
    const [u] = shadow.querySelectorAll(FILES);
    // El focus entra a la primera fila.
    expect(shadow.activeElement).toBe(u);
    // Un clic dins de la instància però fora del menú el tanca; sobre el botó, no.
    act(() => { fireEvent.pointerDown(shadow.querySelector('button')); });
    expect(onTanca).not.toHaveBeenCalled();
    const fora = [...shadow.querySelectorAll('button')].find((b) => b.textContent === 'Fora del menú');
    act(() => { fireEvent.pointerDown(fora); });
    expect(onTanca).toHaveBeenCalledTimes(1);
    // L'Escape el tanca, queda consumit i torna el focus al botó.
    const noCancellat = fireEvent.keyDown(u, { key: 'Escape' });
    expect(noCancellat).toBe(false);
    expect(onTanca).toHaveBeenCalledTimes(2);
    expect(shadow.activeElement).toBe(shadow.querySelector('button'));
  });

  test('desmuntar el menú lleva les escoltes de l’arrel', () => {
    const { shadow, muntatge } = dinsDeShadow();
    const lleva = vi.spyOn(shadow, 'removeEventListener');
    const { unmount } = render(<Prova onTria={vi.fn()} onTanca={vi.fn()} />, { container: muntatge });
    unmount();
    expect(lleva.mock.calls.map(([tipus]) => tipus).sort()).toEqual(['keydown', 'pointerdown']);
  });

  test('la tria: primer tanca, després torna el focus al botó i, al final, passa el valor', () => {
    const ordre = [];
    const onTanca = vi.fn(() => ordre.push(['tanca', document.activeElement.textContent]));
    const onTria = vi.fn((valor) => ordre.push(['tria', valor, document.activeElement.textContent]));
    const { getByRole } = render(<Prova onTria={onTria} onTanca={onTanca} />);
    fireEvent.click(getByRole('menuitem', { name: 'Dos' }));
    expect(ordre).toEqual([['tanca', 'U'], ['tria', 'dos', 'Obri']]);
  });

  test('mostra: cap focus furtat, cap escolta ni tria; les fletxes, Inici i Fi continuen', () => {
    const fora = document.createElement('button');
    document.body.append(fora);
    fora.focus();
    const delDocument = vi.spyOn(document, 'addEventListener');
    const onTria = vi.fn();
    const onTanca = vi.fn();
    const { getAllByRole } = render(<Prova onTria={onTria} onTanca={onTanca} mostra />);
    expect(document.activeElement).toBe(fora);
    expect(delDocument.mock.calls.filter(([tipus]) => tipus === 'keydown' || tipus === 'pointerdown')).toEqual([]);
    const [u, dos] = getAllByRole('menuitem');
    fireEvent.click(dos);
    fireEvent.keyDown(u, { key: 'Escape' });
    expect([onTria.mock.calls.length, onTanca.mock.calls.length]).toEqual([0, 0]);
    u.focus();
    fireEvent.keyDown(u, { key: 'End' });
    expect(document.activeElement).toBe(dos);
    fireEvent.keyDown(dos, { key: 'Home' });
    expect(document.activeElement).toBe(u);
    fireEvent.keyDown(u, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(dos);
  });
});
