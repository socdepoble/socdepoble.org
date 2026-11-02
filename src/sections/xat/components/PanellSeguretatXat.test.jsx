/* P1-12 pas 17 (pla 261101_1246, T7 · S5) · El diàleg «Xifratge i número de
   seguretat»: s'obri des del «⋯» de la capçalera amb el seu títol, només calcula
   el número mentre és obert i en un directe, i en tancar-se torna el focus al
   «⋯». El número ve d'un hook simulat (cap mòdul del xifratge). */
import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { createTranslator } from '../../../config/i18n.js';
import { estatXifratgeDelFil } from '../estatXifratgeFil.js';

const m = vi.hoisted(() => ({ crides: [], ambits: [], muntatges: 0, extres: {} }));
vi.mock('../useSeguretatDelFil.js', async () => {
  const { useState } = await import('react');
  return {
    useNumeroSeguretat: (opcions) => {
      /* M02 · Cada instància nova del hook (un bloc del número muntat de nou) compta. */
      useState(() => ++m.muntatges);
      m.crides.push({ obert: opcions.obert, potVerificar: opcions.potVerificar, fil: opcions.fil?.id });
      m.ambits.push(opcions.ambit);
      return opcions.obert && opcions.potVerificar
        ? { estat: 'llest', numero: '04126 39587 61203 88451 27904 53316 70258 19643 95072 31480 66817 42935', kid: 'k', verificat: false, avis: null, ocupat: false, marca: m.marca, ...m.extres }
        : { estat: 'inactiu', marca: m.marca };
    }
  };
});
vi.mock('../../../app/contexts/RouterContext', async () => {
  const { createElement } = await import('react');
  return { Link: ({ to, children, ...rest }) => createElement('a', { href: to, ...rest }, children) };
});

const { default: PanellSeguretatXat } = await import('./PanellSeguretatXat.jsx');
const { default: CapcaleraConversa } = await import('./CapcaleraConversa.jsx');
const { XatContext } = await import('../XatContext.jsx');

afterEach(() => { cleanup(); m.crides = []; m.ambits = []; m.muntatges = 0; m.extres = {}; });

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

/* M02 (marató 261101_2143; disseny §4.4) · El panell rep els canvis de la instància
   única de Conversa: amb un número pendent, «He parlat amb {nom}: continua» accepta
   el canvi d'este kid; una marca sobre el pendent torna a llegir els canvis; quan els
   pendents canvien, el número es torna a calcular (el bloc es torna a muntar). */
const PEPA = '22222222-2222-4222-8222-222222222222';
const canvisDe = (pendents, extres = {}) => ({ pendents, ocupat: false, error: null, refresca: vi.fn(), ...extres });

test('M02 · número pendent: els dos botons, «continua» accepta el canvi del kid que es mostra', () => {
  m.marca = vi.fn();
  m.extres = { pendent: true };
  const onAccepta = vi.fn();
  render(<PanellSeguretatXat obert onTanca={() => {}} fil={FIL} estat={DIRECTE} nom="Pepa" t={ca}
    canvis={canvisDe([{ usuari: PEPA, motiu: 'sense-continuitat', kidFixat: 'v', kidNou: 'k' }])} onAccepta={onAccepta} />);
  expect(screen.getByText('Clau nova sense confirmar')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'He parlat amb Pepa: continua' }));
  expect(onAccepta).toHaveBeenCalledWith(PEPA, 'k');
});

test('M02 · una marca sobre un número pendent torna a llegir els canvis; sobre un de no pendent, no', async () => {
  m.marca = vi.fn(async () => {});
  m.extres = { pendent: true };
  const canvis = canvisDe([{ usuari: PEPA, motiu: 'verificat', kidFixat: 'v', kidNou: 'k' }]);
  render(<PanellSeguretatXat obert onTanca={() => {}} fil={FIL} estat={DIRECTE} nom="Pepa" t={ca} canvis={canvis} onAccepta={() => {}} />);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Marca com a verificat' })); });
  expect(m.marca).toHaveBeenCalledWith(true);
  expect(canvis.refresca).toHaveBeenCalledTimes(1);
  cleanup();
  m.extres = {};
  const senseCanvi = canvisDe([]);
  render(<PanellSeguretatXat obert onTanca={() => {}} fil={FIL} estat={DIRECTE} nom="Pepa" t={ca} canvis={senseCanvi} onAccepta={() => {}} />);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Marca com a verificat' })); });
  expect(senseCanvi.refresca).not.toHaveBeenCalled();
});

test('M02 · quan els pendents canvien, el número es torna a calcular (bloc nou); si no canvien, no', () => {
  m.marca = vi.fn();
  const pendent = { usuari: PEPA, motiu: 'sense-continuitat', kidFixat: 'v', kidNou: 'k' };
  const panell = (canvis) => <PanellSeguretatXat obert onTanca={() => {}} fil={FIL} estat={DIRECTE} nom="Pepa" t={ca} canvis={canvis} onAccepta={() => {}} />;
  const { rerender } = render(panell(canvisDe([pendent])));
  const abans = m.muntatges;
  rerender(panell(canvisDe([{ ...pendent }])));
  expect(m.muntatges).toBe(abans);
  rerender(panell(canvisDe([])));
  expect(m.muntatges).toBe(abans + 1);
  rerender(panell(canvisDe([{ ...pendent, kidNou: 'k2' }])));
  expect(m.muntatges).toBe(abans + 2);
});

test('M02 · signaturaDelsPendents: persona i kid nou, ordenada; sense canvis, buida', async () => {
  const { signaturaDelsPendents } = await import('./PanellSeguretatXat.jsx');
  expect(signaturaDelsPendents(null)).toBe('');
  expect(signaturaDelsPendents({ pendents: [{ usuari: 'b', kidNou: '2' }, { usuari: 'a', kidNou: null }] })).toBe('a:|b:2');
});
