/* R3-FT-02 · Calaix real amb Dialeg: handlers de teclat i cicle de focus.
   jsdom no executa Tab/activació nativa: no se simulen polsacions amb clics.
   La tabulació intermèdia i Intro/Espai dels botons continuen requerint navegador. */
import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
vi.mock('../../../hooks/useResolvedAsset.js', () => ({ useResolvedAsset: () => '' }));
import { CalaixIdentitats } from './CalaixIdentitats.jsx';

const IDENTITATS = [
  { tipus: 'persona', id: 'u-1', nom: 'Pepa Soler', rol: 'persona' },
  { tipus: 'entitat', id: 'o-1', nom: 'Forn de la Torre', rol: 'owner', activa: true },
  { tipus: 'entitat', id: 'o-2', nom: 'Colla', rol: 'admin' }
];
afterEach(() => {
  cleanup();
  document.querySelectorAll('soc-de-poble').forEach(node => node.remove());
  vi.restoreAllMocks();
});
function Arnes({ onTanca = () => {} }) {
  const [obert, setObert] = useState(false);
  return <>
    <button type="button" onClick={() => setObert(true)}>Tria identitat</button>
    <button type="button">Acció de fons</button>
    <CalaixIdentitats obert={obert} identitats={IDENTITATS} onTanca={motiu => {
      onTanca(motiu); setObert(false);
    }} />
  </>;
}
function muntaLocal(element = <Arnes />) {
  const host = document.createElement('soc-de-poble'); document.body.append(host);
  const shadow = host.attachShadow({ mode: 'closed' });
  const root = document.createElement('div'); root.className = 'sdp-root'; shadow.append(root);
  const muntatge = document.createElement('div'); root.append(muntatge);
  return { host, shadow, root, muntatge, ...render(element, { container: muntatge, baseElement: root }) };
}
function obri(vista) {
  // No consultar tots els rols amb el dialog encara tancat: jsdom cacheja
  // l’estil UA display:none dins del shadow i no l’invalida amb open=true.
  const disparador = (vista.muntatge ?? vista.container).querySelector('button');
  expect(disparador.textContent).toBe('Tria identitat');
  disparador.focus(); fireEvent.click(disparador);
  const dialeg = within(vista.root ?? vista.container).getByRole('dialog', { name: 'Amb qui actues?' });
  return { disparador, dialeg };
}
function tecla(node, key, extra = {}) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, composed: true, ...extra });
  fireEvent(node, event); return event;
}

test('encastat: focus inicial dins del calaix i Tab/Maj+Tab tanquen només els extrems del recorregut real', () => {
  const vista = muntaLocal();
  const { dialeg } = obri(vista);
  const botons = within(dialeg).getAllByRole('button');
  const primer = within(dialeg).getByRole('button', { name: 'Tancar' });
  const ultim = within(dialeg).getByRole('button', { name: 'La meua fitxa i ajustos' });
  expect(botons).toHaveLength(6);
  expect(botons.every(boto => boto.type === 'button' && boto.tabIndex === 0 && !boto.disabled)).toBe(true);
  expect(botons.slice(1, 4).map(boto => boto.textContent)).toEqual([
    expect.stringContaining('Pepa Soler'), expect.stringContaining('Forn de la Torre'), expect.stringContaining('Colla')
  ]);
  expect(vista.shadow.activeElement).toBe(primer);
  expect(vista.muntatge.getAttribute('inert')).toBe('');
  expect(vista.muntatge.getAttribute('aria-hidden')).toBe('true');
  ultim.focus();
  expect(tecla(ultim, 'Tab').defaultPrevented).toBe(true);
  expect(vista.shadow.activeElement).toBe(primer);
  expect(tecla(primer, 'Tab', { shiftKey: true }).defaultPrevented).toBe(true);
  expect(vista.shadow.activeElement).toBe(ultim);
  // Un control d'identitat intermedi conserva el Tab del navegador.
  botons[2].focus();
  expect(tecla(botons[2], 'Tab').defaultPrevented).toBe(false);
  expect(vista.shadow.activeElement).toBe(botons[2]);
});

test('encastat: Escape des d’una identitat tanca una vegada, allibera el fons i restaura el disparador; reobrir funciona', () => {
  const onTanca = vi.fn();
  const vista = muntaLocal(<Arnes onTanca={onTanca} />);
  const { dialeg, disparador } = obri(vista);
  const identitat = within(dialeg).getByRole('button', { name: /Colla/ });
  identitat.focus();
  expect(tecla(identitat, 'Escape').defaultPrevented).toBe(true);
  expect(onTanca).toHaveBeenCalledExactlyOnceWith('esc');
  expect(dialeg.open).toBe(false);
  expect(dialeg.parentElement.hidden).toBe(true);
  expect(vista.muntatge.hasAttribute('inert')).toBe(false);
  expect(vista.muntatge.hasAttribute('aria-hidden')).toBe(false);
  expect(vista.shadow.activeElement).toBe(disparador);
  fireEvent.click(disparador);
  const reobert = within(vista.root).getByRole('dialog', { name: 'Amb qui actues?' });
  expect(vista.shadow.activeElement).toBe(within(reobert).getByRole('button', { name: 'Tancar' }));
});

test('encastat: la guarda no pren Tab ni Escape d’una altra instància ni de l’amfitrió', () => {
  const onTanca = vi.fn();
  const altra = muntaLocal(<button type="button">Un altre poble</button>);
  const vista = muntaLocal(<Arnes onTanca={onTanca} />);
  obri(vista);
  const altreBoto = within(altra.root).getByRole('button', { name: 'Un altre poble' });
  altreBoto.focus();
  expect(tecla(altreBoto, 'Tab').defaultPrevented).toBe(false);
  expect(tecla(altreBoto, 'Escape').defaultPrevented).toBe(false);
  expect(altra.shadow.activeElement).toBe(altreBoto);
  expect(altra.muntatge.hasAttribute('inert')).toBe(false);
  const fora = document.createElement('button'); document.body.append(fora);
  try {
    fora.focus();
    expect(tecla(fora, 'Tab').defaultPrevented).toBe(false);
    expect(tecla(fora, 'Escape').defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(fora);
    expect(onTanca).not.toHaveBeenCalled();
  } finally { fora.remove(); }
});

test('SPA: el cancel del diàleg natiu segueix Escape, tanca l’estat controlat i retorna al disparador', () => {
  const onTanca = vi.fn();
  const vista = render(<Arnes onTanca={onTanca} />);
  const { dialeg, disparador } = obri(vista);
  const cancel = new Event('cancel', { cancelable: true });
  act(() => { dialeg.dispatchEvent(cancel); });
  expect(cancel.defaultPrevented).toBe(true);
  expect(onTanca).toHaveBeenCalledExactlyOnceWith('esc');
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(disparador);
});
