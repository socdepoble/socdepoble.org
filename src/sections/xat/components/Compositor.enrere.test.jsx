/* P0-24b (T2b, prompt 261102_1532) · El menú d'adjunts «+» del Compositor és a
   la pila de l'Arrere d'Android (config/pilaEnrere.js) amb el MATEIX camí que
   el seu Escape (tancaMenu: es tanca i el focus torna al +). El menú i el
   calaix d'emoticones (SelectorEmoticones, ja apuntat) no s'obrin mai alhora:
   una sola capa. Patró: PedraSeca/organismes/Dialeg.enrere.test.jsx. */
import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ImagePlus, Mic } from 'lucide-react';
import { afterEach, expect, test, vi } from 'vitest';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import Compositor from './Compositor.jsx';
import { _reiniciaPilaEnrere, capesEnrereObertes, tancaCapaSuperior } from '../../../config/pilaEnrere.js';

/* El catàleg de veres pesa 292 kB: ací, una família sintètica. */
vi.mock('../../notes/canalEmojis.js', () => ({
  carregaCatalegEmojis: async () => ({ GRUPS_EMOJIS: [{ id: 'cares-emocions', nom: 'Cares', emojis: [['1F600', '😀', 'grinning face']] }] })
}));

afterEach(() => { cleanup(); _reiniciaPilaEnrere(); });

/* Cada Arrere, un segon més tard: fora de la finestra d'absorció. */
let rellotge = 10_000;
const arrere = () => { let r; act(() => { rellotge += 1000; r = tancaCapaSuperior(rellotge); }); return r; };

const t = (_, alternativa) => alternativa;
/* L'objecte que dona ControlsAdjunt, sintètic (Compositor.adjunts.test.jsx). */
const fesAdjunts = () => ({
  etiqueta: 'Adjunta', etiquetaMenu: 'Adjunts del xat', refBoto: { current: null }, refPrimari: { current: null }, bloquejat: false,
  opcions: [{ id: 'fotos', etiqueta: 'Fotos i vídeos', icona: ImagePlus, onTria: vi.fn() }],
  peuMenu: ['0,0 de 20 MB del xat'],
  primari: { clau: 'grava', etiqueta: 'Grava àudio', icona: Mic, onClick: vi.fn(), nomesBuit: true }
});

function Prova(props) {
  const [valor, setValor] = useState('');
  const [adjunts] = useState(fesAdjunts);
  return (
    <AppGridContext.Provider value={{ mida: 'ample', setPanellObert: vi.fn() }}>
      <Compositor valor={valor} onCanvia={setValor} onEnvia={vi.fn()} t={t} adjunts={adjunts} {...props} />
    </AppGridContext.Provider>
  );
}

const mes = () => screen.getByRole('button', { name: 'Adjunta' });
const menu = () => screen.queryByRole('menu', { name: 'Adjunts del xat' });
const carona = () => screen.getByRole('button', { name: 'Emoticones' });
const calaix = () => screen.queryByRole('dialog', { name: 'Emoticones' });
/* Obri el calaix amb el ratolí i espera el catàleg. */
async function obriCalaix() {
  fireEvent.click(carona(), { detail: 1 });
  await screen.findByRole('tab', { name: 'Cares' });
}

test('el menú «+» obert és a la pila; l’Arrere fa el camí de l’Escape (tanca i torna el focus al +); tancat o desmuntat, cap capa', () => {
  const { unmount } = render(<Prova />);
  expect(capesEnrereObertes()).toBe(0);
  fireEvent.click(mes());
  expect(menu()).toBeTruthy();
  expect(capesEnrereObertes()).toBe(1);
  expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Fotos i vídeos' }));
  // L'Escape del menú: tanca (consumit) i torna el focus al +.
  expect(fireEvent.keyDown(document.activeElement, { key: 'Escape' })).toBe(false);
  expect(menu()).toBeNull();
  expect(document.activeElement).toBe(mes());
  expect(capesEnrereObertes()).toBe(0);
  // L'Arrere: el mateix.
  fireEvent.click(mes());
  expect(capesEnrereObertes()).toBe(1);
  expect(arrere()).toBe(true);
  expect(menu()).toBeNull();
  expect(mes().getAttribute('aria-expanded')).toBe('false');
  expect(document.activeElement).toBe(mes());
  expect(capesEnrereObertes()).toBe(0);
  expect(arrere()).toBe(false);
  fireEvent.click(mes());
  expect(capesEnrereObertes()).toBe(1);
  unmount();
  expect(capesEnrereObertes()).toBe(0);
});

test('el menú i el calaix no s’obrin alhora: obrir l’un tanca l’altre i la pila té sempre una sola capa', async () => {
  render(<Prova />);
  await obriCalaix();
  expect(capesEnrereObertes()).toBe(1);
  fireEvent.click(mes());
  expect(calaix()).toBeNull();
  expect(menu()).toBeTruthy();
  expect(capesEnrereObertes()).toBe(1);
  expect(arrere()).toBe(true);
  expect(menu()).toBeNull();
  expect(capesEnrereObertes()).toBe(0);
  // I al revés: la carona amb el menú obert.
  fireEvent.click(mes());
  expect(capesEnrereObertes()).toBe(1);
  await obriCalaix();
  expect(menu()).toBeNull();
  expect(calaix()).toBeTruthy();
  expect(capesEnrereObertes()).toBe(1);
  expect(arrere()).toBe(true);
  expect(calaix()).toBeNull();
  expect(capesEnrereObertes()).toBe(0);
  expect(arrere()).toBe(false);
});

test('bloquejar els adjunts (preparant, gravant) tanca el menú tot sol i el lleva de la pila', () => {
  const adjunts = fesAdjunts();
  const { rerender } = render(<Prova adjunts={adjunts} />);
  fireEvent.click(mes());
  expect(menu()).toBeTruthy();
  expect(capesEnrereObertes()).toBe(1);
  rerender(<Prova adjunts={{ ...adjunts, bloquejat: true }} />);
  expect(menu()).toBeNull();
  expect(capesEnrereObertes()).toBe(0);
  expect(arrere()).toBe(false);
});
