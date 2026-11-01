/* Gauntlet 2 · 261101 · Y-Notes · Les opcions compactes de la barra d'eines
   (el botó «⋯», «Format del text», per davall de 500 px) i les capes que les
   envolten.
     · G2-N-01 · L'Escape que les tanca queda atés: l'Escape del detall de la
       Columna 3 (gestionaEscapeDelDetall, IDEA-58), que espera a la finestra,
       ja no porta el focus a la fitxa activa de la Columna 2. La tecla naix
       al botó Negreta i bombolleja pel detall, com a Chrome (abans la prova
       la disparava directament a la finestra, fora del detall, i no ho veia).
     · G2-MO-02 (WCAG 2.4.3) · Proposa Card, l'última opció, obri una finestra
       modal (la fitxa de memòria oral, un <dialog>). Un clic o un Escape de
       dins de la finestra no són «fora»: les opcions continuen obertes i, en
       tancar-se la fitxa, el focus torna a Proposa Card, visible, i no al
       <body>. En l'encastat del WordPress la barra queda inert darrere de la
       capa modal (modalLocal.js), i tampoc no es plega. */
import React, { useRef, useState } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import UniversalToolbar from './UniversalToolbar.jsx';
import { gestionaEscapeDelDetall } from './workspace/navegacioTeclat.js';
import { Dialeg } from '../PedraSeca/index.js';

const ACCIONS = {
  toggleSubheading: () => {}, toggleH4: () => {}, toggleH5: () => {}, toggleH6: () => {}, toggleHeading: () => {},
  toggleBold: () => {}, toggleItalic: () => {}, toggleStrike: () => {}, toggleList: () => {}, toggleOrderedList: () => {},
  toggleCitacio: () => {}, insertDivisor: () => {}
};

/* Compacta: l'amplada mesurada de la barra és de 320 px. */
const compacta = () => vi.stubGlobal('ResizeObserver', class {
  constructor(callback) { this.callback = callback; }
  observe() { this.callback([{ contentRect: { width: 320 } }]); }
  disconnect() {}
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const barra = () => screen.getByRole('group', { name: 'Eines de l\'editor' });
const format = () => within(barra()).getByRole('button', { name: 'Format del text' });
const opcions = () => document.getElementById(format().getAttribute('aria-controls'));
/* L'Escape del detall espera a la finestra fins al final de la tasca (setTimeout 0). */
const finalDeLaTasca = () => act(() => new Promise((resol) => { setTimeout(resol, 0); }));

/* El detall de l'espai de treball: la llista de la Columna 2, amb la seua
   fitxa activa, i la Columna 3 amb l'onKeyDown d'UniversalWorkspace. */
function Detall({ children }) {
  const llista = useRef(null);
  return (
    <>
      <ul className="sdp-gestor-llista" ref={llista}>
        <li aria-current="true"><button type="button" className="sdp-gestor-fitxa">Bloc de notes</button></li>
      </ul>
      <section tabIndex={-1} onKeyDown={(event) => gestionaEscapeDelDetall(event, llista.current)}>
        {children}
      </section>
    </>
  );
}

test('G2-N-01 · compacta, dins del detall: l’Escape des de Negreta tanca les opcions, queda atés i el focus torna a «⋯», no a la fitxa', async () => {
  compacta();
  render(<Detall><UniversalToolbar formatActions={ACCIONS} onPublish={() => {}} /></Detall>);
  fireEvent.click(format());
  expect(opcions().hidden).toBe(false);
  const negreta = within(opcions()).getByRole('button', { name: 'Negreta' });
  negreta.focus();
  // fireEvent torna false quan algú ha cridat preventDefault.
  expect(fireEvent.keyDown(negreta, { key: 'Escape' })).toBe(false);
  await finalDeLaTasca();
  expect(opcions().hidden).toBe(true);
  expect(document.activeElement).toBe(format());
});

test('G2-N-01 · control: amb les opcions plegades, l’Escape des de «⋯» és del detall i torna a la fitxa activa', async () => {
  compacta();
  render(<Detall><UniversalToolbar formatActions={ACCIONS} onPublish={() => {}} /></Detall>);
  format().focus();
  expect(fireEvent.keyDown(format(), { key: 'Escape' })).toBe(false);
  await finalDeLaTasca();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Bloc de notes' }));
});

/* Proposa Card obri la fitxa en un Dialeg de Pedra Seca, com DocumentEditor
   (FitxaMemoriaOral). jsdom no té showModal: Dialeg posa l'atribut open. */
function AmbFitxa() {
  const [obert, setObert] = useState(false);
  return (
    <>
      <UniversalToolbar formatActions={ACCIONS} onPublish={() => {}} onProposaCard={() => setObert(true)} />
      <Dialeg obert={obert} onTanca={() => setObert(false)} titol="Fitxa de memòria oral">
        <button type="button">Descarrega la fitxa</button>
      </Dialeg>
    </>
  );
}

test('G2-MO-02 · compacta: un clic o un Escape de dins de la fitxa no pleguen les opcions, i en tancar-la el focus torna a Proposa Card', () => {
  compacta();
  render(<AmbFitxa />);
  fireEvent.click(format());
  const proposa = within(opcions()).getByRole('button', { name: 'Proposa Card' });
  proposa.focus();
  fireEvent.click(proposa);
  const dialeg = document.querySelector('dialog');
  expect(dialeg.open).toBe(true);
  const dins = within(dialeg).getByRole('button', { name: 'Descarrega la fitxa' });
  // Un clic dins de la fitxa i un al vel (el clic al ::backdrop apunta al <dialog>).
  fireEvent.pointerDown(dins);
  fireEvent.pointerDown(dialeg);
  expect(opcions().hidden).toBe(false);
  // L'Escape de dins és de la fitxa: la barra no el consumix (el <dialog> s'ha de poder tancar).
  dins.focus();
  expect(fireEvent.keyDown(dins, { key: 'Escape' })).toBe(true);
  expect(opcions().hidden).toBe(false);
  // El navegador demana tancar la finestra (cancel) i Dialeg torna el focus a qui l'havia oberta.
  fireEvent(dialeg, new Event('cancel', { cancelable: true }));
  expect(dialeg.open).toBe(false);
  expect(opcions().hidden).toBe(false);
  expect(document.activeElement).toBe(proposa);
  expect(proposa.closest('[hidden]')).toBeNull();
  // Fora de cap finestra, les opcions es pleguen com sempre.
  fireEvent.pointerDown(document.body);
  expect(opcions().hidden).toBe(true);
});

test('G2-MO-02 · encastat: darrere d’una capa modal local (la barra inert), ni un clic ni un Escape pleguen les opcions', () => {
  compacta();
  const { container } = render(<UniversalToolbar formatActions={ACCIONS} onPublish={() => {}} onProposaCard={() => {}} />);
  fireEvent.click(format());
  container.setAttribute('inert', '');
  fireEvent.pointerDown(document.body);
  expect(fireEvent.keyDown(document.body, { key: 'Escape' })).toBe(true);
  expect(opcions().hidden).toBe(false);
  container.removeAttribute('inert');
  expect(fireEvent.keyDown(document.body, { key: 'Escape' })).toBe(false);
  expect(opcions().hidden).toBe(true);
});
