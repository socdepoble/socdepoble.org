/* T4: transicions reals del DOM del selector. El model es controla;
   no s'afirma que la fixture siga una aprovació humana. */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { PortaTauler } from './Tauler.jsx';

const modelDe = (canvis = {}) => ({ porta: { carregant: false }, fila: { estat: 'aprovat' }, aprovat: true,
  llegint: false, error: null, lectura: null, generacio: 0, llig: vi.fn(), oblida: vi.fn(), ...canvis });
const lectura = { avisos: [] };
function munta(canvis = {}) {
  let model = modelDe(canvis);
  const renderitza = () => <><button>Fora del Tauler</button><PortaTauler tauler={model} onObreTractors={vi.fn()} /></>;
  const vista = render(renderitza());
  const actualitza = (p) => { model = { ...model, ...p }; vista.rerender(renderitza()); };
  return { actualitza, model, vista };
}
const selector = () => screen.getByRole('button', { name: /Tria els extractes del banc/ });
const estat = () => screen.getByRole('status', { name: 'Estat de la lectura' });
afterEach(() => { cleanup(); document.body.removeAttribute('tabindex'); });

test('Oblida durant la lectura torna el focus al selector nou i anuncia la cancel·lació', () => {
  const v = munta({ llegint: true });
  v.model.oblida.mockImplementation(() => v.actualitza({ generacio: 1, llegint: false }));
  const boto = screen.getByRole('button', { name: 'Oblida les dades' });
  boto.focus();
  fireEvent.click(boto);
  expect(document.activeElement).toBe(selector());
  expect(estat().textContent).toMatch(/Lectura cancel·lada/);
});
test('Oblida dades acabades torna el focus i anuncia només l’oblit', () => {
  const v = munta({ lectura });
  v.model.oblida.mockImplementation(() => v.actualitza({ generacio: 1, lectura: null }));
  const boto = screen.getByRole('button', { name: 'Oblida les dades' });
  boto.focus(); fireEvent.click(boto);
  expect(document.activeElement).toBe(selector());
  expect(estat().textContent).toBe('Les dades s’han oblidat.');
});
test('la lectura completada recupera el selector substituït i anuncia el final', () => {
  const v = munta(); const anterior = selector(); anterior.focus();
  v.actualitza({ llegint: true });
  v.actualitza({ llegint: false, lectura, generacio: 1 });
  expect(anterior.isConnected).toBe(false);
  expect(document.activeElement).toBe(selector());
  expect(estat().textContent).toBe('Lectura completada.');
});
test('una lectura fallida recupera el selector si el focus s’havia perdut en deshabilitar-lo', () => {
  const v = munta(); selector().focus(); v.actualitza({ llegint: true });
  // Un navegador pot perdre el focus quan es deshabilita el selector.
  document.body.tabIndex = -1; document.body.focus();
  expect(document.activeElement).toBe(document.body);
  v.actualitza({ llegint: false, error: 'Error sintètic' });
  expect(document.activeElement).toBe(selector());
  expect(estat().textContent).not.toMatch(/completada/);
});
test('el final respecta el focus d’un control alié connectat', () => {
  const v = munta(); selector().focus(); v.actualitza({ llegint: true });
  const fora = screen.getByRole('button', { name: 'Fora del Tauler' }); fora.focus();
  v.actualitza({ llegint: false, lectura, generacio: 1 });
  expect(document.activeElement).toBe(fora);
});
test('la regió d’estat ja existix abans d’una lectura i no declara aprovacions', () => {
  munta(); expect(estat().textContent).toBe('');
  expect(estat().getAttribute('aria-atomic')).toBe('true');
});
test('un focus alié dins d’un amfitrió Shadow DOM també es conserva', () => {
  const host = document.createElement('div'); document.body.append(host);
  const shadow = host.attachShadow({ mode: 'open' });
  let model = modelDe();
  const arbre = () => <><button>Fora del Tauler</button><PortaTauler tauler={model} onObreTractors={vi.fn()} /></>;
  const v = render(arbre(), { container: shadow, baseElement: host });
  const q = within(shadow);
  q.getByRole('button', { name: /Tria els extractes del banc/ }).focus();
  model = { ...model, llegint: true }; v.rerender(arbre());
  const fora = q.getByRole('button', { name: 'Fora del Tauler' }); fora.focus();
  model = { ...model, llegint: false, lectura, generacio: 1 }; v.rerender(arbre());
  expect(shadow.activeElement).toBe(fora); host.remove();
});

for (const accio of ['completa', 'oblida']) {
  test(`en Shadow DOM ${accio} recupera el focus del control retirat`, () => {
    const host = document.createElement('div'); document.body.append(host);
    const shadow = host.attachShadow({ mode: 'open' });
    let model = modelDe(accio === 'oblida' ? { llegint: true } : {});
    const arbre = () => <PortaTauler tauler={model} onObreTractors={vi.fn()} />;
    const v = render(arbre(), { container: shadow, baseElement: host }); const q = within(shadow);
    const actualitza = (p) => { model = { ...model, ...p }; v.rerender(arbre()); };
    if (accio === 'oblida') {
      model.oblida.mockImplementation(() => actualitza({ llegint: false, generacio: 1 }));
      const boto = q.getByRole('button', { name: 'Oblida les dades' }); boto.focus(); fireEvent.click(boto);
    } else {
      q.getByRole('button', { name: /Tria els extractes del banc/ }).focus();
      actualitza({ llegint: true }); actualitza({ llegint: false, lectura, generacio: 1 });
    }
    expect(shadow.activeElement).toBe(q.getByRole('button', { name: /Tria els extractes del banc/ }));
    host.remove();
  });
}
