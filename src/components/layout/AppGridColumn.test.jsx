/* Prompt 261014_0400 (ordre del Mestre), front B · El botó [|<] és la parella
   PanelLeftClose / PanelLeftOpen: la columna es plega cap a l'esquerra amb
   PanelLeftClose i el rail plegat l'obri amb PanelLeftOpen (divisòria a
   l'esquerra i xebró «>»). El rail plegat del Workspace obria amb
   PanelRightOpen (divisòria a la dreta i xebró «<») i cap prova no ho veia.
   Qui passa `icona` explícita (el Xat, la roda Settings mirall de la T24) la
   conserva. */
import { createRef } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { Folder, Settings } from 'lucide-react';
import AppGridColumn from './AppGridColumn.jsx';
import { AppGridContext } from './contextDeLaGraella.js';

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

/* PS-11 (marató 261101, B7e; default D-1 del Mestre) · A la Columna 1 estreta
   (201 px a 1024) el [|<] repetit amaga el títol. La CSS (modules.css, bloc
   P1-28) l'amaga només si porta data-germana-de-la-icona; ací es comprova
   que la marca va només on hi ha un altre botó que plega el mateix, i que
   el focus en desplegar mai no cau en el botó que es pot amagar. */
describe('AppGridColumn · PS-11, el [|<] germà de la icona es marca', () => {
  const replega = () => screen.getByRole('button', { name: 'Replegar CARPETES' });
  const icona = () => screen.queryByRole('button', { name: 'Plegar la columna CARPETES' });
  const enGraella = (mida, ui) => <AppGridContext.Provider value={{ mida }}>{ui}</AppGridContext.Provider>;

  test('amb icona germana: el [|<] porta la marca, i la icona plega el mateix (una sola crida a onReplega per clic)', () => {
    const onReplega = vi.fn();
    render(<AppGridColumn titol="CARPETES" icona={Folder} onReplega={onReplega} />);
    expect(replega().hasAttribute('data-germana-de-la-icona')).toBe(true);
    expect(icona()).not.toBeNull();
    expect(icona().hasAttribute('data-germana-de-la-icona')).toBe(false);
    /* Amagar el [|<] no lleva cap acció: la icona fa exactament el mateix. */
    fireEvent.click(icona());
    expect(onReplega).toHaveBeenCalledTimes(1);
    fireEvent.click(replega());
    expect(onReplega).toHaveBeenCalledTimes(2);
  });

  test('amb icona germana, també en «ample», en «mitja» i en «estret» amb replegaCompacte', () => {
    for (const [mida, extra] of [['ample', {}], ['mitja', {}], ['estret', { replegaCompacte: true }]]) {
      render(enGraella(mida, <AppGridColumn titol="CARPETES" icona={Folder} onReplega={() => {}} {...extra} />));
      expect(replega().hasAttribute('data-germana-de-la-icona'), mida).toBe(true);
      cleanup();
    }
  });

  test('sense icona germana el [|<] és l’únic que plega: mai porta la marca', () => {
    const casos = [
      ['sense icona', <AppGridColumn key="a" titol="CARPETES" onReplega={() => {}} />],
      ['amb `esquerra` davant', <AppGridColumn key="b" titol="CARPETES" icona={Folder} esquerra={<span>Tot</span>} onReplega={() => {}} />],
      ['amb `startActions` davant', <AppGridColumn key="c" titol="CARPETES" icona={Folder} startActions={[{ id: 'tot', etiqueta: 'Tot', icona: Settings, onAcciona: () => {} }]} onReplega={() => {}} />],
      ['en «estret» sense replegaCompacte', enGraella('estret', <AppGridColumn key="d" titol="CARPETES" icona={Folder} onReplega={() => {}} />)],
    ];
    for (const [cas, ui] of casos) {
      render(ui);
      expect(icona(), cas).toBeNull();
      expect(replega().hasAttribute('data-germana-de-la-icona'), cas).toBe(false);
      cleanup();
    }
  });

  test('sense onReplega no hi ha [|<] ni cap marca', () => {
    const { container } = render(<AppGridColumn titol="CARPETES" icona={Folder} />);
    expect(container.querySelector('[data-germana-de-la-icona]')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Replegar CARPETES' })).toBeNull();
  });

  test('el focus en desplegar (collapseBtnRef) va a la icona quan el [|<] es pot amagar, i al [|<] quan és l’únic', () => {
    const ambGermana = createRef();
    render(<AppGridColumn titol="CARPETES" icona={Folder} onReplega={() => {}} collapseBtnRef={ambGermana} />);
    expect(ambGermana.current).toBe(icona());
    expect(ambGermana.current.hasAttribute('data-germana-de-la-icona')).toBe(false);
    cleanup();
    const sola = createRef();
    render(<AppGridColumn titol="CARPETES" onReplega={() => {}} collapseBtnRef={sola} />);
    expect(sola.current).toBe(replega());
  });

  test('la marca és un atribut del DOM sense valor, no una prop: cap altre botó de la capçalera la porta', () => {
    const { container } = render(<AppGridColumn titol="CARPETES" icona={Folder} plegable obert onPlega={() => {}} onReplega={() => {}}
      endActions={[{ id: 'roda', etiqueta: 'Configuració', icona: Settings, onAcciona: () => {} }]} />);
    const marcats = [...container.querySelectorAll('[data-germana-de-la-icona]')];
    expect(marcats).toEqual([replega()]);
    expect(marcats[0].getAttribute('data-germana-de-la-icona')).toBe('');
    /* Fill directe del grup d'accions: el selector de la CSS hi va amb «>». */
    expect(marcats[0].parentElement.classList.contains('app-grid-col-header__accions')).toBe(true);
  });

  test('ni el rail plegat ni la capçalera sencera (el Xat) porten la marca', () => {
    const plegat = render(<AppGridColumn variant="collapsed" titol="CARPETES" icona={Folder} onReplega={() => {}} />);
    expect(plegat.container.querySelector('[data-germana-de-la-icona]')).toBeNull();
    cleanup();
    const xat = render(<AppGridColumn titol="Menú" icona={Settings} replegaTotaCapcalera onReplega={() => {}} />);
    expect(xat.container.querySelector('[data-germana-de-la-icona]')).toBeNull();
  });
});
