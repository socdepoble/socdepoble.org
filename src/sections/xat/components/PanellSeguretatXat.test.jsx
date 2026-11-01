/* P1-12 pas 17 (pla 261101_1246, T7 · S5) · El diàleg «Xifratge i número de
   seguretat»: s'obri des del «⋯» de la capçalera amb el seu títol, només calcula
   el número mentre és obert i en un directe, i en tancar-se torna el focus al
   «⋯». El número ve d'un hook simulat (cap mòdul del xifratge). */
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { createTranslator } from '../../../config/i18n.js';
import { estatXifratgeDelFil } from '../estatXifratgeFil.js';

const m = vi.hoisted(() => ({ crides: [], ambits: [] }));
vi.mock('../useSeguretatDelFil.js', () => ({
  useNumeroSeguretat: (opcions) => {
    m.crides.push({ obert: opcions.obert, potVerificar: opcions.potVerificar, fil: opcions.fil?.id });
    m.ambits.push(opcions.ambit);
    return opcions.obert && opcions.potVerificar
      ? { estat: 'llest', numero: '04126 39587 61203 88451 27904 53316 70258 19643 95072 31480 66817 42935', kid: 'k', verificat: false, avis: null, ocupat: false, marca: m.marca }
      : { estat: 'inactiu', marca: m.marca };
  }
}));
vi.mock('../../../app/contexts/RouterContext', async () => {
  const { createElement } = await import('react');
  return { Link: ({ to, children, ...rest }) => createElement('a', { href: to, ...rest }, children) };
});

const { default: PanellSeguretatXat } = await import('./PanellSeguretatXat.jsx');
const { default: CapcaleraConversa } = await import('./CapcaleraConversa.jsx');
const { XatContext } = await import('../XatContext.jsx');

afterEach(() => { cleanup(); m.crides = []; m.ambits = []; });

const ca = createTranslator('ca');
const FIL = { id: 'd-pepa', tipus: 'directe', name: 'Pepa', altres: [{ id: 'P', tipus: 'persona' }], altresNoms: ['Pepa'] };
const DIRECTE = estatXifratgeDelFil({ actiu: true, abast: { xifrat: true, bloquejat: false, motiu: 'directe-persona', tipusFil: 'directe' }, entornSegur: true });

function Arnes({ estat = DIRECTE }) {
  const [obert, setObert] = useState(false);
  return (
    <>
      <CapcaleraConversa fil={FIL} onTorna={() => {}} onSeleccionar={() => {}} t={ca}
        accioXifratge={{ etiqueta: 'Xifratge i número de seguretat', onTria: () => setObert(true) }} />
      <PanellSeguretatXat obert={obert} onTanca={() => setObert(false)} fil={FIL} estat={estat} nom="Pepa" t={ca} />
    </>
  );
}

test('tancat: cap número; obert des del «⋯»: el títol, el número i la marca; en tancar, el focus torna al «⋯»', () => {
  m.marca = vi.fn();
  render(<Arnes />);
  expect(m.crides.every((c) => c.obert === false)).toBe(true);
  expect(screen.queryByRole('group', { name: 'Número de seguretat' })).toBeNull();

  const opcions = screen.getByRole('button', { name: 'Opcions de la conversa' });
  fireEvent.click(opcions);
  fireEvent.click(screen.getByRole('menuitem', { name: 'Xifratge i número de seguretat' }));
  const dialeg = document.querySelector('dialog.sdp-xat-dialeg');
  expect(dialeg.open).toBe(true);
  expect(dialeg.querySelector('h2').textContent).toBe('Xifratge i número de seguretat');
  expect(m.crides.at(-1)).toEqual({ obert: true, potVerificar: true, fil: 'd-pepa' });
  expect(screen.getByRole('group', { name: 'Número de seguretat' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Marca com a verificat' }));
  expect(m.marca).toHaveBeenCalledWith(true);

  fireEvent.click(screen.getByRole('button', { name: 'Tancar' }));
  expect(dialeg.open).toBe(false);
  expect(document.activeElement).toBe(opcions);
});

test('en un grup: el diàleg no demana cap número (potVerificar fals)', () => {
  m.marca = vi.fn();
  const grup = estatXifratgeDelFil({ actiu: true, abast: { xifrat: true, bloquejat: false, motiu: 'grup-privat', tipusFil: 'grup' }, entornSegur: true });
  render(<Arnes estat={grup} />);
  fireEvent.click(screen.getByRole('button', { name: 'Opcions de la conversa' }));
  fireEvent.click(screen.getByRole('menuitem', { name: 'Xifratge i número de seguretat' }));
  expect(m.crides.at(-1)).toEqual({ obert: true, potVerificar: false, fil: 'd-pepa' });
  expect(screen.getByText('En un grup, el número de seguretat es compara amb cada persona des del vostre xat privat.')).toBeTruthy();
  expect(screen.queryByRole('group', { name: 'Número de seguretat' })).toBeNull();
});

/* PC155-02 · L'àmbit de dades del xat (ambitEstable: backend, persona i actor)
   arriba al hook com a `ambit`, i canvia quan canvia la persona; fora del
   proveïdor, null (useXat torna l'àmbit buit i no llança). */
test('PC155-02 · el panell passa l’àmbit del xat al hook del número', () => {
  m.marca = vi.fn();
  const AMBIT_ANNA = '["backend:x","anna","persona:anna"]';
  const AMBIT_BERTA = '["backend:x","berta","persona:berta"]';
  const panell = (ambit) => (
    <XatContext.Provider value={{ ambitEstable: ambit }}>
      <PanellSeguretatXat obert onTanca={() => {}} fil={FIL} estat={DIRECTE} nom="Pepa" t={ca} />
    </XatContext.Provider>
  );
  const { rerender, unmount } = render(panell(AMBIT_ANNA));
  expect(m.ambits.at(-1)).toBe(AMBIT_ANNA);
  rerender(panell(AMBIT_BERTA));
  expect(m.ambits.at(-1)).toBe(AMBIT_BERTA);
  unmount();
  render(<PanellSeguretatXat obert onTanca={() => {}} fil={FIL} estat={DIRECTE} nom="Pepa" t={ca} />);
  expect(m.ambits.at(-1)).toBeNull();
});
