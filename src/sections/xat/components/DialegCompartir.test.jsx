/* 261026 (prompt 261026_1615, tasca 2) · «Envia a…»: el que arriba del menú
   «Compartir» del dispositiu espera que la persona trie la conversa. Els lots
   ixen del registre de veres (config/compartirNatiu.js), amb la forma que hi
   deixa el pont natiu. Triar no descarta res; tancar, sí. */
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import DialegCompartir from './DialegCompartir.jsx';
import { compartitPendent, descartaCompartit, lliuraCompartit } from '../../../config/compartirNatiu.js';

const t = (_, alternativa) => alternativa;
const foto = (nom = 'foto') => new Blob([nom], { type: 'image/jpeg' });
const FILS = [
  { id: 'f-festes', tipus: 'grup', name: 'Comissió de festes', ultimText: 'Dissabte, sopar' },
  { id: 'f-javi', name: 'Javi Llinares', ultimText: 'Bon dia' }
];

/* El lot, tal com el deixa el registre. */
const lot = (dades) => { lliuraCompartit(dades); return compartitPendent(); };

let props;
beforeEach(() => {
  descartaCompartit();
  props = { obert: true, fils: FILS, tornar: '/xat', onTria: vi.fn(), onDescarta: vi.fn(), onVes: vi.fn(), locale: 'ca-ES', t };
});
afterEach(() => { cleanup(); descartaCompartit(); });

const dialeg = (nom = 'Envia a…') => screen.getByRole('dialog', { name: nom });

test('sense lot no pinta res, ni tan sols obert', () => {
  const vista = render(<DialegCompartir {...props} lot={null} />);
  expect(vista.container.firstChild).toBeNull();
  expect(screen.queryByRole('dialog')).toBeNull();
});

test.each([
  ['una imatge', { fitxers: [foto()] }, 'Tens una imatge per enviar. Tria la conversa.'],
  ['tres imatges', { fitxers: [foto('a'), foto('b'), foto('c')], text: 'Mireu' }, 'Tens 3 imatges per enviar. Tria la conversa.'],
  ['només text', { text: '  Ens veiem a la plaça  ' }, 'Tens un text per enviar. Tria la conversa.']
])('el resum del lot (%s) diu què hi ha per enviar', (_, dades, resum) => {
  render(<DialegCompartir {...props} lot={lot(dades)} />);
  const finestra = dialeg();
  expect(within(finestra).getByText(resum)).toBeTruthy();
  expect(within(finestra).queryByText(/no es poden enviar/)).toBeNull();
  expect(within(finestra).getByRole('button', { name: 'Descarta' })).toBeTruthy();
});

test('llista les converses amb FilaConversa, marca l’oberta i triar-ne una crida onTria amb el fil', () => {
  render(<DialegCompartir {...props} lot={lot({ fitxers: [foto()] })} filActiuId="f-javi" />);
  const llista = within(dialeg()).getByRole('list', { name: 'Converses on es pot enviar' });
  const files = within(llista).getAllByRole('button');
  expect(files).toHaveLength(2);
  expect(files[0].textContent).toContain('Comissió de festes');
  expect(files[0].textContent).toContain('Dissabte, sopar');
  expect(files[0].getAttribute('aria-current')).toBeNull();
  expect(files[1].getAttribute('aria-current')).toBe('true');
  fireEvent.click(files[0]);
  expect(props.onTria).toHaveBeenCalledOnce();
  expect(props.onTria).toHaveBeenCalledWith(FILS[0]);
  expect(props.onDescarta).not.toHaveBeenCalled();
});

/* Triar tanca per la via pròpia (obert=false): no avisa onTanca i el lot no es perd. */
test('triar la conversa tanca el diàleg sense descartar el lot', () => {
  const pendent = lot({ fitxers: [foto()] });
  function Arnes() {
    const [obert, setObert] = useState(true);
    return <DialegCompartir {...props} lot={pendent} obert={obert} onTria={(fil) => { props.onTria(fil); setObert(false); }} />;
  }
  render(<Arnes />);
  fireEvent.click(within(dialeg()).getByRole('button', { name: /Javi Llinares/ }));
  expect(props.onTria).toHaveBeenCalledWith(FILS[1]);
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(props.onDescarta).not.toHaveBeenCalled();
  expect(compartitPendent()).toBe(pendent);
});

test('«Descarta», la X i Escape descarten el lot', () => {
  render(<DialegCompartir {...props} lot={lot({ fitxers: [foto()] })} />);
  const finestra = dialeg();
  fireEvent.click(within(finestra).getByRole('button', { name: 'Descarta' }));
  expect(props.onDescarta).toHaveBeenCalledTimes(1);
  fireEvent.click(within(finestra).getByRole('button', { name: 'Tancar' }));
  expect(props.onDescarta).toHaveBeenCalledTimes(2);
  fireEvent(finestra, new Event('cancel', { cancelable: true }));
  expect(props.onDescarta).toHaveBeenCalledTimes(3);
  expect(props.onDescarta).toHaveBeenLastCalledWith('esc');
  expect(props.onTria).not.toHaveBeenCalled();
});

/* Sense sessió, «Entrar» porta a l'entrada i el lot espera a la tornada (rutaEntrada.js). */
test('sense sessió demana entrar, amb la tornada al Xat, i no llista cap conversa', () => {
  render(<DialegCompartir {...props} lot={lot({ fitxers: [foto()] })} senseSessio tornar="/xat?fil=f-festes" />);
  const finestra = dialeg();
  expect(within(finestra).getByRole('status').textContent).toContain('Entra per enviar-ho.');
  expect(within(finestra).queryByRole('list')).toBeNull();
  expect(within(finestra).queryByRole('button', { name: /Comissió de festes/ })).toBeNull();
  fireEvent.click(within(finestra).getByRole('button', { name: 'Entrar' }));
  expect(props.onVes).toHaveBeenCalledWith(`/registre?${new URLSearchParams({ mode: 'entrar', tornar: '/xat?fil=f-festes' })}`);
  expect(props.onDescarta).not.toHaveBeenCalled();
  expect(compartitPendent()).not.toBeNull();
});

test('sense cap conversa on enviar-ho, ho diu en lloc de la llista', () => {
  render(<DialegCompartir {...props} lot={lot({ text: 'Hola' })} fils={[]} />);
  const finestra = dialeg();
  expect(within(finestra).getByRole('status').textContent).toBe('Encara no tens cap conversa on es puga enviar.');
  expect(within(finestra).queryByRole('list')).toBeNull();
  expect(within(finestra).getByRole('button', { name: 'Descarta' })).toBeTruthy();
});

test('els fitxers rebutjats es diuen amb el nombre, i la resta del lot es pot enviar', () => {
  // Un PDF que el pont ja ha rebutjat i una entrada que no és cap fitxer: dos.
  render(<DialegCompartir {...props} lot={lot({ fitxers: [foto(), 'no-es-un-fitxer'], rebutjats: 1 })} />);
  const finestra = dialeg();
  expect(within(finestra).getByText('Tens una imatge per enviar. Tria la conversa.')).toBeTruthy();
  expect(within(finestra).getByText('2 fitxers no es poden enviar al xat: només fotos JPEG, PNG, WebP o GIF de fins a 20 MB.').getAttribute('role')).toBe('status');
  expect(within(finestra).getAllByRole('button', { name: /Comissió de festes|Javi Llinares/ })).toHaveLength(2);
});

test('un lot només de rebutjats diu que no s’ha pogut rebre i es tanca amb «Entesos»', () => {
  render(<DialegCompartir {...props} lot={lot({ rebutjats: 3 })} senseSessio />);
  const finestra = dialeg('No s’ha pogut rebre');
  expect(within(finestra).getByRole('status').textContent).toBe('3 fitxers no es poden enviar al xat: només fotos JPEG, PNG, WebP o GIF de fins a 20 MB.');
  expect(within(finestra).queryByText(/Tria la conversa/)).toBeNull();
  expect(within(finestra).queryByRole('list')).toBeNull();
  // Ni la llista ni l'entrada: no hi ha res per enviar.
  expect(within(finestra).queryByRole('button', { name: 'Entrar' })).toBeNull();
  expect(within(finestra).queryByRole('button', { name: 'Descarta' })).toBeNull();
  fireEvent.click(within(finestra).getByRole('button', { name: 'Entesos' }));
  expect(props.onDescarta).toHaveBeenCalledOnce();
});

/* Revisió 261026 · Mentre el Xat encara llig les converses (status no 'ready'),
   una llista buida no vol dir que no n'hi haja cap: diu «Carregant…». */
test('carregant i sense fils encara, diu «Carregant…» i no que no hi ha cap conversa', () => {
  const vista = render(<DialegCompartir {...props} lot={lot({ fitxers: [foto()] })} fils={[]} carregant />);
  let finestra = dialeg();
  expect(within(finestra).getByRole('status').textContent).toBe('Carregant…');
  expect(within(finestra).queryByText('Encara no tens cap conversa on es puga enviar.')).toBeNull();
  expect(within(finestra).queryByRole('list')).toBeNull();
  expect(within(finestra).getByRole('button', { name: 'Descarta' })).toBeTruthy();
  // Acabada la lectura sense cap conversa, ara sí que ho diu.
  vista.rerender(<DialegCompartir {...props} lot={compartitPendent()} fils={[]} carregant={false} />);
  finestra = dialeg();
  expect(within(finestra).getByRole('status').textContent).toBe('Encara no tens cap conversa on es puga enviar.');
  expect(within(finestra).queryByText('Carregant…')).toBeNull();
});

test('carregant amb fils ja llegits, els llista igual', () => {
  render(<DialegCompartir {...props} lot={lot({ fitxers: [foto()] })} carregant />);
  const finestra = dialeg();
  const llista = within(finestra).getByRole('list', { name: 'Converses on es pot enviar' });
  expect(within(llista).getAllByRole('button')).toHaveLength(2);
  expect(within(finestra).queryByText('Carregant…')).toBeNull();
  expect(within(finestra).queryByRole('status')).toBeNull();
});

/* Revisió 261026 · Descartat el lot (el registre torna null), el diàleg no es
   desmunta de colp: es tanca per la seua via (el <dialog> perd `open`; jsdom no
   té showModal i el Dialeg posa i lleva l'atribut) amb l'últim lot pintat, i el
   focus torna a l'element que l'havia obert. Amb obert=true encara, també es
   tanca: sense lot viu no hi ha res per enviar. */
test.each([
  ['el Xat el tanca alhora', false],
  ['encara amb obert=true', true]
])('descartat el lot, el <dialog> es tanca sense desmuntar-se i torna el focus (%s)', (_, obertDespres) => {
  const pendent = lot({ fitxers: [foto()] });
  const ambOrigen = (extra) => (
    <>
      <button type="button">Origen</button>
      <DialegCompartir {...props} {...extra} />
    </>
  );
  const vista = render(ambOrigen({ lot: null }));
  const origen = screen.getByRole('button', { name: 'Origen' });
  origen.focus();
  vista.rerender(ambOrigen({ lot: pendent }));
  const finestra = dialeg();
  expect(finestra.hasAttribute('open')).toBe(true);
  const descarta = within(finestra).getByRole('button', { name: 'Descarta' });
  descarta.focus();
  fireEvent.click(descarta);
  expect(props.onDescarta).toHaveBeenCalledOnce();
  vista.rerender(ambOrigen({ lot: null, obert: obertDespres }));
  // El mateix element, encara al document, ara tancat i fora de l'arbre accessible.
  expect(finestra.isConnected).toBe(true);
  expect(vista.container.querySelector('dialog')).toBe(finestra);
  expect(finestra.hasAttribute('open')).toBe(false);
  expect(finestra.open).toBe(false);
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(finestra.textContent).toContain('Tens una imatge per enviar. Tria la conversa.');
  expect(document.activeElement).toBe(origen);
  // Un lot nou torna a obrir el mateix diàleg amb el resum nou.
  vista.rerender(ambOrigen({ lot: lot({ text: 'Ens veiem a la plaça' }) }));
  expect(dialeg()).toBe(finestra);
  expect(finestra.hasAttribute('open')).toBe(true);
  expect(within(finestra).getByText('Tens un text per enviar. Tria la conversa.')).toBeTruthy();
  // I descartat este, el que es tanca és el darrer lot, no el primer.
  vista.rerender(ambOrigen({ lot: null, obert: obertDespres }));
  expect(finestra.hasAttribute('open')).toBe(false);
  expect(finestra.textContent).toContain('Tens un text per enviar. Tria la conversa.');
  expect(finestra.textContent).not.toContain('Tens una imatge per enviar.');
});
