/* Prompt 261014_0400 (ordre del Mestre), front B · El botó [|<] és la parella
   PanelLeftClose / PanelLeftOpen: la columna es plega cap a l'esquerra amb
   PanelLeftClose i el rail plegat l'obri amb PanelLeftOpen (divisòria a
   l'esquerra i xebró «>»). El rail plegat del Workspace obria amb
   PanelRightOpen (divisòria a la dreta i xebró «<») i cap prova no ho veia.
   Qui passa `icona` explícita (el Xat, la roda Settings mirall de la T24) la
   conserva. */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { Settings } from 'lucide-react';
import AppGridColumn from './AppGridColumn.jsx';

afterEach(() => cleanup());

const iconesDe = (boto) => [...boto.querySelectorAll('svg')].map((svg) => svg.getAttribute('class'));

describe('AppGridColumn · la parella del plegat [|<]', () => {
  test('rail plegat sense icona: l’expandir porta PanelLeftOpen i mai PanelRightOpen', () => {
    const { container } = render(<AppGridColumn variant="collapsed" titol="CARPETES" onReplega={() => {}} />);
    const expandir = screen.getByRole('button', { name: 'Expandir CARPETES' });
    expect(iconesDe(expandir)).toEqual(['lucide lucide-panel-left-open']);
    expect(container.querySelector('svg.lucide-panel-right-open')).toBeNull();
  });

  test('rail plegat amb icona={Settings} (el Xat): la roda, cap panell', () => {
    const { container } = render(<AppGridColumn variant="collapsed" titol="Menú" icona={Settings} onReplega={() => {}} />);
    expect(iconesDe(screen.getByRole('button', { name: 'Expandir Menú' }))).toEqual(['lucide lucide-settings']);
    expect(container.querySelector('svg.lucide-panel-left-open, svg.lucide-panel-right-open')).toBeNull();
  });

  test('columna oberta: el Replegar porta PanelLeftClose, l’altra meitat de la parella', () => {
    render(<AppGridColumn titol="CARPETES" onReplega={() => {}} />);
    expect(iconesDe(screen.getByRole('button', { name: 'Replegar CARPETES' }))).toEqual(['lucide lucide-panel-left-close']);
  });
});

/* Prompt 261014_0400 (ordre del Mestre), front B, correcció dels revisors ·
   La fila 2 del rail plegat (AppGridShell.css) només és de l'acció quan n'hi
   ha una (la roda de Disseny, Wiki i Perfil; la lupa de la llista en «ample»):
   és l'única que ocupa eixa fila també oberta. Amb dues (al Bloc, «Configurar
   categories» i la roda; en «mitja» i «estret», l'obridor de la navegació i la
   lupa) la fila 2 se la quedava la primera i la segona baixava 10px més, i
   el bot entre plegada i oberta creixia. Sense :has(), AppGridColumn marca
   el cas amb una classe. */
describe('AppGridColumn · el rail plegat marca si porta una sola acció', () => {
  const roda = { id: 'settings', etiqueta: 'Configuració', icona: Settings, onAcciona: () => {} };
  const obridor = { id: 'obri', etiqueta: 'CARPETES', icona: Settings, onAcciona: () => {} };
  const capcalera = (container) => container.querySelector('.app-grid-col-header--collapsed');

  test('una sola acció (la roda): app-grid-col-header--una-accio', () => {
    const { container } = render(<AppGridColumn variant="collapsed" titol="CARPETES" endActions={[roda]} onReplega={() => {}} />);
    expect(capcalera(container).classList.contains('app-grid-col-header--una-accio')).toBe(true);
  });

  test('dues accions (el Bloc, o l’obridor i la lupa en «mitja»): sense la marca', () => {
    const bloc = render(<AppGridColumn variant="collapsed" titol="CARPETES" endActions={[obridor, roda]} onReplega={() => {}} />);
    expect(capcalera(bloc.container).classList.contains('app-grid-col-header--una-accio')).toBe(false);
    cleanup();
    const mitja = render(<AppGridColumn variant="collapsed" titol="NOTES" startActions={[obridor]} endActions={[roda]} onReplega={() => {}} />);
    expect(capcalera(mitja.container).classList.contains('app-grid-col-header--una-accio')).toBe(false);
  });

  test('cap acció (el Xat): sense la marca', () => {
    const { container } = render(<AppGridColumn variant="collapsed" titol="Menú" icona={Settings} onReplega={() => {}} />);
    expect(capcalera(container).classList.contains('app-grid-col-header--una-accio')).toBe(false);
  });
});
