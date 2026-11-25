/**
 * lot-g4-teclat-universal-v1225.test.jsx — Bateria de verificació del Lot G4
 * (Onada v1.2.25 · IDEA-355: Navegació universal per teclat ↑/↓/←/→ en les 3
 * columnes d'AppGridShell amb guarda absoluta sobre TipTap, inputs i modals).
 */
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import AppGridShell from '../src/components/layout/AppGridShell.jsx';
import {
  esOrigenEditableOModal,
  gestionaNavegacioTeclatColumnes,
  origenRealDeTecla
} from '../src/hooks/useNavegacioTeclatColumnes.js';

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  }
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1400 });
});

afterEach(() => {
  cleanup();
});

function EscenariTresColumnes() {
  const [activa, setActiva] = useState('conv-1');
  const [text, setText] = useState('Hola');
  return (
    <AppGridShell
      leftColumn={(
        <nav aria-label="Menú lateral">
          <ul>
            <li><button type="button" className="nav-item" aria-current="page">Tots</button></li>
            <li><button type="button" className="nav-item">Destacats</button></li>
            <li><button type="button" className="nav-item">Multimèdia</button></li>
          </ul>
        </nav>
      )}
      middleColumn={(
        <ul aria-label="Converses">
          {['conv-1', 'conv-2', 'conv-3'].map((id, i) => (
            <li key={id}>
              <button
                type="button"
                className="sdp-xat-fila"
                aria-current={activa === id ? 'true' : undefined}
                onClick={() => setActiva(id)}
              >
                {`Conversa ${i + 1}`}
              </button>
            </li>
          ))}
        </ul>
      )}
      rightColumn={(
        <div data-testid="detall-obert">
          <h2>{`Detall ${activa}`}</h2>
          <button type="button">Respon</button>
          <input aria-label="Cerca ràpida" value={text} onChange={(e) => setText(e.target.value)} />
          <textarea aria-label="Nota lliure" defaultValue="Text de prova" />
          <div className="ProseMirror" contentEditable="true" suppressContentEditableWarning aria-label="Editor TipTap">
            Paràgraf editable
          </div>
          <dialog open aria-label="Diàleg de prova">
            <button type="button">Botó dins diàleg</button>
          </dialog>
        </div>
      )}
    />
  );
}

describe('Lot G4 · IDEA-355 · Navegació universal per teclat en 3 columnes', () => {
  test('↑/↓ a Columna 2 obri en viu la conversa seleccionada i Home/End van als extrems', () => {
    render(<EscenariTresColumnes />);
    const c1 = screen.getByRole('button', { name: 'Conversa 1' });
    const c2 = screen.getByRole('button', { name: 'Conversa 2' });
    const c3 = screen.getByRole('button', { name: 'Conversa 3' });

    c1.focus();
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Detall conv-1');

    fireEvent.keyDown(c1, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(c2);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Detall conv-2');

    fireEvent.keyDown(c2, { key: 'End' });
    expect(document.activeElement).toBe(c3);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Detall conv-3');

    fireEvent.keyDown(c3, { key: 'Home' });
    expect(document.activeElement).toBe(c1);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Detall conv-1');
  });

  test('←/→ salten entre Columna 1, Columna 2 i Columna 3 amb focus visible AAA', () => {
    render(<EscenariTresColumnes />);
    const navTots = screen.getByRole('button', { name: 'Tots' });
    const c1 = screen.getByRole('button', { name: 'Conversa 1' });
    const botoRespon = screen.getByRole('button', { name: 'Respon' });

    navTots.focus();
    fireEvent.keyDown(navTots, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(c1);

    fireEvent.keyDown(c1, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(botoRespon);

    fireEvent.keyDown(botoRespon, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(c1);

    fireEvent.keyDown(c1, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(navTots);
  });

  test('guarda d’or: mai captura fletxes dins de TipTap (.ProseMirror), <input>, <textarea>, diàleg obert ni amb modificadors', () => {
    render(<EscenariTresColumnes />);
    const input = screen.getByLabelText('Cerca ràpida');
    const textarea = screen.getByLabelText('Nota lliure');
    const tiptap = screen.getByLabelText('Editor TipTap');
    const botoDialeg = screen.getByRole('button', { name: 'Botó dins diàleg' });

    for (const el of [input, textarea, tiptap, botoDialeg]) {
      el.focus();
      for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']) {
        const noPrevent = fireEvent.keyDown(el, { key });
        expect(noPrevent, `${el.getAttribute('aria-label') || el.textContent} · ${key}`).toBe(true);
        expect(document.activeElement).toBe(el);
      }
    }

    // Amb modificadors (Alt / Ctrl / Meta / Shift), tampoc captura
    const c1 = screen.getByRole('button', { name: 'Conversa 1' });
    c1.focus();
    expect(fireEvent.keyDown(c1, { key: 'ArrowDown', altKey: true })).toBe(true);
    expect(fireEvent.keyDown(c1, { key: 'ArrowRight', metaKey: true })).toBe(true);
    expect(document.activeElement).toBe(c1);
  });

  test('suport Shadow DOM: origenRealDeTecla usa composedPath()[0] i respecta inputs dins shadowRoot', () => {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    const inputIntern = document.createElement('input');
    inputIntern.type = 'text';
    shadow.appendChild(inputIntern);
    document.body.appendChild(host);

    const fakeEvent = {
      key: 'ArrowLeft',
      target: host,
      composedPath: () => [inputIntern, shadow, host, document.body]
    };
    expect(origenRealDeTecla(fakeEvent)).toBe(inputIntern);
    expect(esOrigenEditableOModal(fakeEvent)).toBe(true);
    expect(gestionaNavegacioTeclatColumnes(fakeEvent, document.body)).toBe(false);

    host.remove();
  });
});
