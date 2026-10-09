/* T10 (ordre del Mestre, 261001) · La vista Setmana (esquelet): capçaleres de
   dia triables, franja de tot el dia, graella de 24 h amb els blocs
   posicionats per propietats CSS (mai un style en JSX) i la línia d'«ara»
   només la setmana de hui. */
import { act, cleanup, render, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { VistaSetmana } from './VistaSetmana.jsx';
import { creaEsdeveniment } from '../../../utils/esdeveniment.js';

afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

const DILLUNS = new Date(2026, 8, 28);
const AVUI = new Date(2026, 9, 1, 12, 0);
const ARA = new Date(2026, 9, 1, 12, 34);
const concert = creaEsdeveniment({ id: 'concert', titol: 'Concert', inici: { dataHora: '2026-09-29T10:00' }, fi: { dataHora: '2026-09-29T11:30' } });
const assaig = creaEsdeveniment({ id: 'assaig', titol: 'Assaig', inici: { dataHora: '2026-09-29T10:30' }, fi: { dataHora: '2026-09-29T12:00' } });
const festes = creaEsdeveniment({ id: 'festes', titol: 'Festes', inici: { data: '2026-09-28' }, fi: { data: '2026-10-04' } });
const ball = creaEsdeveniment({ id: 'ball', titol: 'Ball', inici: { dataHora: '2026-10-02T22:00' }, fi: { dataHora: '2026-10-03T02:00' } });
const ESDEVENIMENTS = [concert, null, assaig, festes, ball];
const dataLlarga = (d) => d.toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const pinta = (props = {}) => render(
  <VistaSetmana esdeveniments={ESDEVENIMENTS} dilluns={DILLUNS} avui={AVUI} ara={ARA} locale="ca-ES" titol="Setmana del poble" {...props} />
);

test('set capçaleres de dia: botons amb aria-pressed, hui amb aria-current i el nom amb el recompte i els títols', () => {
  const onTriaDia = vi.fn();
  const { getByRole } = pinta({ diaTriat: '2026-09-29', onTriaDia });
  const capcal = getByRole('region', { name: 'Setmana del poble' }).querySelector('.sdp-cal-setmana__capcal');
  const dies = within(capcal).getAllByRole('button');
  expect(dies).toHaveLength(7);
  expect(dies.map((d) => d.getAttribute('aria-pressed'))).toEqual(['false', 'true', 'false', 'false', 'false', 'false', 'false']);
  expect(dies[3].getAttribute('aria-current')).toBe('date');
  expect(capcal.querySelectorAll('[aria-current="date"]')).toHaveLength(1);
  expect(dies[1].getAttribute('aria-label')).toBe(`${dataLlarga(new Date(2026, 8, 29))} · 3 esdeveniments: Festes, Concert, Assaig`);
  expect(dies[6].getAttribute('aria-label')).toBe(`${dataLlarga(new Date(2026, 9, 4))} · 0 esdeveniments`);
  act(() => dies[4].click());
  expect(onTriaDia).toHaveBeenLastCalledWith('2026-10-02');
});

test('sense onTriaDia, les capçaleres són quietes', () => {
  const { container } = pinta();
  expect(container.querySelector('.sdp-cal-setmana__capcal button')).toBeNull();
  expect(container.querySelectorAll('.sdp-cal-setmana__cap .sdp-cal-dia')).toHaveLength(7);
});

test('cada dia és una llista ordenada amb el seu nom; cada bloc diu l’hora i el títol', () => {
  const { getByRole } = pinta();
  const dimarts = getByRole('list', { name: dataLlarga(new Date(2026, 8, 29)) });
  expect(dimarts.tagName).toBe('OL');
  expect(within(dimarts).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['10:00–11:30 Concert', '10:30–12:00 Assaig']);
  // El Ball passa de mitjanit: un tros cada dia, amb les hores reals.
  expect(within(getByRole('list', { name: dataLlarga(new Date(2026, 9, 3)) })).getByRole('listitem').textContent).toBe('22:00–02:00 Ball');
  expect(within(getByRole('list', { name: dataLlarga(new Date(2026, 8, 28)) })).queryAllByRole('listitem')).toEqual([]);
});

test('els blocs es posicionen per propietats CSS: minut d’inici, fi visual, columna i amplada', () => {
  const { getByRole } = pinta();
  const [primer, segon] = within(getByRole('list', { name: dataLlarga(new Date(2026, 8, 29)) })).getAllByRole('listitem');
  const vars = (el) => ['inici', 'fi', 'col', 'cols', 'amplada'].map((n) => el.style.getPropertyValue(`--sdp-cal-${n}`));
  expect(vars(primer)).toEqual(['600', '690', '0', '2', '1']);
  expect(vars(segon)).toEqual(['630', '720', '1', '2', '1']);
});

test('la franja de tot el dia: una barra per setmana amb les línies de graella', () => {
  const { getByRole } = pinta();
  const franja = getByRole('list', { name: 'Tot el dia' });
  const [barra] = within(franja).getAllByRole('listitem');
  expect(barra.textContent).toBe('Festes');
  expect(['col-inici', 'col-fi', 'carril'].map((n) => barra.style.getPropertyValue(`--sdp-cal-${n}`))).toEqual(['1', '7', '1']);
});

test('cap atribut style escrit en JSX: només les propietats --sdp-cal-* que posa la ref', () => {
  const { container } = pinta();
  const ambEstil = [...container.querySelectorAll('[style]')];
  expect(ambEstil.length).toBeGreaterThan(0);
  for (const el of ambEstil) expect(el.getAttribute('style')).toMatch(/^(--sdp-cal-[a-z-]+: ?[^;]+; ?)+$/);
});

test('la línia d’«ara» només ix la setmana de hui, al dia i al minut d’ara', () => {
  const { container, rerender } = pinta();
  const linies = container.querySelectorAll('.sdp-cal-setmana__ara');
  expect(linies).toHaveLength(1);
  expect(linies[0].getAttribute('aria-hidden')).toBe('true');
  expect(linies[0].style.getPropertyValue('--sdp-cal-minut')).toBe('754');
  expect(linies[0].closest('.sdp-cal-setmana__columna').querySelector('ol').getAttribute('aria-label')).toBe(dataLlarga(new Date(2026, 9, 1)));
  rerender(<VistaSetmana esdeveniments={ESDEVENIMENTS} dilluns={new Date(2026, 9, 5)} avui={AVUI} ara={ARA} locale="ca-ES" />);
  expect(container.querySelector('.sdp-cal-setmana__ara')).toBeNull();
});

test('sense «ara» fixa, la línia baixa amb el rellotge al canvi de cada minut', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 1, 12, 0, 30));
  const { container } = render(<VistaSetmana esdeveniments={[]} dilluns={DILLUNS} avui={new Date()} locale="ca-ES" />);
  const minut = () => container.querySelector('.sdp-cal-setmana__ara').style.getPropertyValue('--sdp-cal-minut');
  expect(minut()).toBe('720');
  act(() => { vi.advanceTimersByTime(30000); });
  expect(minut()).toBe('721');
  act(() => { vi.advanceTimersByTime(60000); });
  expect(minut()).toBe('722');
});

test('una setmana que no és la de hui no programa cap temporitzador', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 1, 12, 0, 30));
  render(<VistaSetmana esdeveniments={[]} dilluns={new Date(2026, 9, 12)} avui={new Date()} locale="ca-ES" />);
  expect(vi.getTimerCount()).toBe(0);
});

/* Fase visual (prompt 261001_0445) · El mode el decidix l'amplada del
   contenidor: jsdom no fa layout, i la simulem amb getBoundingClientRect i un
   ResizeObserver que avisa quan volem. */
function simulaAmplada(inicial) {
  let ample = inicial;
  let avisa = () => {};
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback) { avisa = callback; }
    observe() {}
    disconnect() {}
  });
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ width: ample }));
  return (nova) => { ample = nova; act(() => { avisa(); }); };
}
const regio = (getByRole) => getByRole('region', { name: 'Setmana del poble' });
const columnes = (container) => [...container.querySelectorAll('.sdp-cal-setmana__columna ol')].map((ol) => ol.getAttribute('aria-label'));
const premuts = (container) => [...container.querySelectorAll('.sdp-cal-setmana__capcal button')].map((b) => b.getAttribute('aria-pressed'));

test('sense amplada coneguda (jsdom), set columnes i cap modificador: el mode de sempre', () => {
  const { getByRole, container } = pinta();
  expect(regio(getByRole).className).toBe('sdp-cal-setmana');
  expect(columnes(container)).toHaveLength(7);
});

test('contenidor estret (352px = 22em): la tira, set botons de dia i la graella d’un sol dia, hui si no n’hi ha cap de triat', () => {
  simulaAmplada(352);
  const onTriaDia = vi.fn();
  const { getByRole, container } = pinta({ onTriaDia });
  expect(regio(getByRole).classList.contains('sdp-cal-setmana--tira')).toBe(true);
  expect(container.querySelectorAll('.sdp-cal-setmana__capcal button')).toHaveLength(7);
  expect(columnes(container)).toEqual([dataLlarga(new Date(2026, 9, 1))]);
  // El dia mostrat està premut; tocar-lo quan no està triat el tria.
  expect(premuts(container)).toEqual(['false', 'false', 'false', 'true', 'false', 'false', 'false']);
  act(() => container.querySelectorAll('.sdp-cal-setmana__capcal button')[3].click());
  expect(onTriaDia).toHaveBeenLastCalledWith('2026-10-01');
});

test('a la tira, el dia triat de la setmana es mostra i tornar-lo a tocar no el lleva; un altre dia sí que es tria', () => {
  simulaAmplada(352);
  const onTriaDia = vi.fn();
  const { container } = pinta({ diaTriat: '2026-09-29', onTriaDia });
  expect(columnes(container)).toEqual([dataLlarga(new Date(2026, 8, 29))]);
  expect(premuts(container)).toEqual(['false', 'true', 'false', 'false', 'false', 'false', 'false']);
  const botons = container.querySelectorAll('.sdp-cal-setmana__capcal button');
  act(() => botons[1].click());
  expect(onTriaDia).not.toHaveBeenCalled();
  act(() => botons[5].click());
  expect(onTriaDia).toHaveBeenLastCalledWith('2026-10-03');
});

test('a la tira, un dia triat d’una altra setmana i hui fora: es mostra el dilluns', () => {
  simulaAmplada(352);
  const { container } = render(
    <VistaSetmana esdeveniments={ESDEVENIMENTS} dilluns={new Date(2026, 9, 5)} avui={AVUI} ara={ARA} diaTriat="2026-09-29"
      onTriaDia={() => {}} locale="ca-ES" titol="Setmana del poble" />
  );
  expect(columnes(container)).toEqual([dataLlarga(new Date(2026, 9, 5))]);
});

test('a la tira sense onTriaDia, els botons porten el dia ells mateixos', () => {
  simulaAmplada(352);
  const { container } = pinta();
  const botons = container.querySelectorAll('.sdp-cal-setmana__capcal button');
  expect(botons).toHaveLength(7);
  act(() => botons[1].click());
  expect(columnes(container)).toEqual([dataLlarga(new Date(2026, 8, 29))]);
  act(() => botons[1].click());
  expect(columnes(container)).toEqual([dataLlarga(new Date(2026, 8, 29))]);
});

test('a la tira, un punt diu quins dies tenen actes; la línia d’«ara» només ix si el dia mostrat és hui', () => {
  simulaAmplada(352);
  const { container, rerender } = pinta({ onTriaDia: () => {} });
  const punts = [...container.querySelectorAll('.sdp-cal-setmana__capcal .sdp-cal-dia__punt')];
  expect(punts.map((p) => p.classList.contains('sdp-cal-dia__punt--ple'))).toEqual([true, true, true, true, true, true, false]);
  expect(punts.every((p) => p.getAttribute('aria-hidden') === 'true')).toBe(true);
  const ara = container.querySelectorAll('.sdp-cal-setmana__ara');
  expect(ara).toHaveLength(1);
  expect(ara[0].closest('.sdp-cal-setmana__columna').querySelector('ol').getAttribute('aria-label')).toBe(dataLlarga(new Date(2026, 9, 1)));
  rerender(<VistaSetmana esdeveniments={ESDEVENIMENTS} dilluns={DILLUNS} avui={AVUI} ara={ARA} diaTriat="2026-09-30" onTriaDia={() => {}} locale="ca-ES" titol="Setmana del poble" />);
  expect(container.querySelector('.sdp-cal-setmana__ara')).toBeNull();
});

test('a la tira, la franja és la del dia mostrat: una columna, oberta pels dos costats si l’acte continua', () => {
  simulaAmplada(352);
  const { getByRole } = pinta({ onTriaDia: () => {} });
  const [barra] = within(getByRole('list', { name: 'Tot el dia' })).getAllByRole('listitem');
  expect(barra.textContent).toBe('Festes');
  expect(['col-inici', 'col-fi', 'carril'].map((n) => barra.style.getPropertyValue(`--sdp-cal-${n}`))).toEqual(['1', '2', '1']);
  expect(barra.classList.contains('sdp-cal-barra--abans')).toBe(true);
  expect(barra.classList.contains('sdp-cal-barra--despres')).toBe(true);
});

test('en eixamplar-se el contenidor, la tira torna a les set columnes (i a l’inrevés)', () => {
  const canvia = simulaAmplada(352);
  const { getByRole, container } = pinta({ onTriaDia: () => {} });
  expect(columnes(container)).toHaveLength(1);
  canvia(1024);
  expect(regio(getByRole).className).toBe('sdp-cal-setmana');
  expect(columnes(container)).toHaveLength(7);
  canvia(600);
  expect(columnes(container)).toHaveLength(1);
});

test('cap atribut style escrit en JSX tampoc a la tira', () => {
  simulaAmplada(352);
  const { container } = pinta({ onTriaDia: () => {} });
  const ambEstil = [...container.querySelectorAll('[style]')];
  expect(ambEstil.length).toBeGreaterThan(0);
  for (const el of ambEstil) expect(el.getAttribute('style')).toMatch(/^(--sdp-cal-[a-z-]+: ?[^;]+; ?)+$/);
});

test('cada bloc i cada barra porten la classe de color de la seua font (i la resta, la de publicació)', () => {
  const ambFont = (tipus, extra) => creaEsdeveniment({ id: `f-${tipus}`, titol: `Acte ${tipus}`, font: { tipus }, ...extra });
  const llista = [
    ambFont('producte', { inici: { dataHora: '2026-09-28T09:00' }, fi: { dataHora: '2026-09-28T10:00' } }),
    ambFont('esdeveniment', { inici: { dataHora: '2026-09-29T09:00' }, fi: { dataHora: '2026-09-29T10:00' } }),
    ambFont('agenda', { inici: { dataHora: '2026-09-30T09:00' }, fi: { dataHora: '2026-09-30T10:00' } }),
    ambFont('pagina', { inici: { data: '2026-10-01' } }),
    ambFont('poble', { inici: { dataHora: '2026-10-02T09:00' }, fi: { dataHora: '2026-10-02T10:00' } }),
    creaEsdeveniment({ id: 'sense', titol: 'Acte sense font', inici: { data: '2026-10-03' } })
  ];
  const { getByRole } = pinta({ esdeveniments: llista });
  const peces = [...regio(getByRole).querySelectorAll('.sdp-cal-setmana__bloc, .sdp-cal-barra')];
  const font = (el) => [...el.classList].find((c) => c.startsWith('sdp-cal-font--'));
  expect(Object.fromEntries(peces.map((el) => [el.textContent.replace(/^[\d:–]+ /, ''), font(el)]))).toEqual({
    'Acte producte': 'sdp-cal-font--producte',
    'Acte esdeveniment': 'sdp-cal-font--esdeveniment',
    'Acte agenda': 'sdp-cal-font--agenda',
    'Acte pagina': 'sdp-cal-font--pagina',
    'Acte poble': 'sdp-cal-font--publicacio',
    'Acte sense font': 'sdp-cal-font--publicacio'
  });
});

test('blocs curts en una línia «HH:MM Títol»: la fi queda per al lector; els llargs diuen l’interval', () => {
  const llista = [
    creaEsdeveniment({ id: 'zero', titol: 'Acte A', inici: { dataHora: '2026-09-28T09:00' } }),
    creaEsdeveniment({ id: 'mitja', titol: 'Acte B', inici: { dataHora: '2026-09-29T09:00' }, fi: { dataHora: '2026-09-29T09:30' } }),
    creaEsdeveniment({ id: 'hora', titol: 'Acte C', inici: { dataHora: '2026-09-30T09:00' }, fi: { dataHora: '2026-09-30T10:00' } }),
    creaEsdeveniment({ id: 'llarg', titol: 'Acte D', inici: { dataHora: '2026-10-02T09:00' }, fi: { dataHora: '2026-10-02T11:00' } })
  ];
  const { container } = pinta({ esdeveniments: llista });
  const blocs = [...container.querySelectorAll('.sdp-cal-setmana__bloc')];
  const forma = (el) => [...el.classList].find((c) => c.startsWith('sdp-cal-setmana__bloc--')) ?? 'llarg';
  expect(blocs.map((el) => [el.textContent, forma(el)])).toEqual([
    ['09:00 Acte A', 'sdp-cal-setmana__bloc--curt'],
    ['09:00–09:30 Acte B', 'sdp-cal-setmana__bloc--curt'],
    ['09:00–10:00 Acte C', 'sdp-cal-setmana__bloc--una-linia'],
    ['09:00–11:00 Acte D', 'llarg']
  ]);
  expect(blocs[1].querySelector('.sdp-sr-only').textContent).toBe('–09:30');
  expect(blocs[0].querySelector('.sdp-sr-only')).toBeNull();
  expect(blocs[2].querySelector('.sdp-sr-only')).toBeNull();
});

test('el rang d’hores és dinàmic: de 7 a 22 si cap acte en surt, sense rotular la primera hora', () => {
  const { container } = pinta({ esdeveniments: [concert, assaig] });
  const graella = container.querySelector('.sdp-cal-setmana__graella');
  expect(graella.getAttribute('style')).toMatch(/--sdp-cal-hora-inicial: ?7;/);
  expect(graella.getAttribute('style')).toMatch(/--sdp-cal-hores: ?15;/);
  const hores = [...container.querySelectorAll('.sdp-cal-setmana__hora')];
  expect(hores).toHaveLength(15);
  expect(hores[0].textContent).toBe('');
  expect(hores.slice(1).map((li) => li.textContent)).toEqual(Array.from({ length: 14 }, (_, i) => `${String(8 + i).padStart(2, '0')}:00`));
});

test('el rang s’estén fins als actes de matinada i de nit, i fins a la línia d’«ara»', () => {
  const { container, rerender } = pinta();
  const graella = () => container.querySelector('.sdp-cal-setmana__graella').getAttribute('style');
  // El Ball creua la mitjanit: de 0 a 24.
  expect(graella()).toMatch(/--sdp-cal-hora-inicial: ?0;/);
  expect(graella()).toMatch(/--sdp-cal-hores: ?24;/);
  rerender(<VistaSetmana esdeveniments={[]} dilluns={DILLUNS} avui={AVUI} ara={new Date(2026, 9, 1, 6, 15)} locale="ca-ES" titol="Setmana del poble" />);
  expect(graella()).toMatch(/--sdp-cal-hora-inicial: ?6;/);
  expect(graella()).toMatch(/--sdp-cal-hores: ?16;/);
});

test('un acte sense fi a les 23:56 es pinta des de les 23:30 (l’alçada mínima abans de mitjanit) i diu l’hora real', () => {
  const tard = creaEsdeveniment({ id: 'tard', titol: 'Acte tard', inici: { dataHora: '2026-10-01T23:56' } });
  const { container } = pinta({ esdeveniments: [tard] });
  const [bloc] = container.querySelectorAll('.sdp-cal-setmana__bloc');
  expect(['inici', 'fi'].map((n) => bloc.style.getPropertyValue(`--sdp-cal-${n}`))).toEqual(['1410', '1440']);
  expect(bloc.textContent).toBe('23:56 Acte tard');
  expect(bloc.classList.contains('sdp-cal-setmana__bloc--curt')).toBe(true);
  const graella = container.querySelector('.sdp-cal-setmana__graella').getAttribute('style');
  expect(graella).toMatch(/--sdp-cal-hora-inicial: ?7;/);
  expect(graella).toMatch(/--sdp-cal-hores: ?17;/);
});

test('densitat compacta: la forma de cada bloc seguix els llindars de la compacta (70 i 90 minuts, una línia de títol menys)', () => {
  const llista = [
    creaEsdeveniment({ id: 'setanta', titol: 'Acte A', inici: { dataHora: '2026-09-29T09:00' }, fi: { dataHora: '2026-09-29T10:10' } }),
    creaEsdeveniment({ id: 'noranta', titol: 'Acte B', inici: { dataHora: '2026-09-30T09:00' }, fi: { dataHora: '2026-09-30T10:30' } })
  ];
  const formes = (container) => [...container.querySelectorAll('.sdp-cal-setmana__bloc')]
    .map((el) => [...el.classList].find((c) => c.startsWith('sdp-cal-setmana__bloc--')) ?? 'llarg');
  const { container, rerender } = pinta({ esdeveniments: llista });
  expect(formes(container)).toEqual(['sdp-cal-setmana__bloc--dues-linies', 'llarg']);
  rerender(<VistaSetmana esdeveniments={llista} dilluns={DILLUNS} avui={AVUI} ara={ARA} locale="ca-ES" titol="Setmana del poble" densitat="compacta" />);
  expect(formes(container)).toEqual(['sdp-cal-setmana__bloc--una-linia', 'sdp-cal-setmana__bloc--dues-linies']);
});

test('densitat: compacta posa el seu modificador; normal i responsiva, cap', () => {
  const { getByRole, rerender } = pinta({ densitat: 'compacta' });
  expect(regio(getByRole).className).toBe('sdp-cal-setmana sdp-cal-setmana--compacta');
  for (const densitat of ['normal', 'responsiva', 'desconeguda']) {
    rerender(<VistaSetmana esdeveniments={ESDEVENIMENTS} dilluns={DILLUNS} avui={AVUI} ara={ARA} locale="ca-ES" titol="Setmana del poble" densitat={densitat} />);
    expect(regio(getByRole).className).toBe('sdp-cal-setmana');
  }
});

/* ── Onada 6 (prompt 261009_0230, punt 1; pla de l'Onada 5, tasca 16) ─────
   Clicar un esdeveniment porta a la pàgina de la seua publicació. Fora de la
   capa aria-hidden del mes, l'enllaç és al lector i al teclat. */
const RUTES = new Map([[concert, '/events/concert'], [festes, '/events/festes']]);
const rutaDe = (esd) => RUTES.get(esd) ?? null;

test('Onada 6 · Llei del Píxel: sense rutaDeLEsdeveniment, o sense cap ruta, el DOM de sempre', () => {
  const sense = pinta({ onTriaDia: () => {} }).container.innerHTML.replace(/\s(id|aria-labelledby)="[^"]*"/g, ' $1="·"');
  cleanup();
  const senseRuta = pinta({ onTriaDia: () => {}, rutaDeLEsdeveniment: () => null }).container.innerHTML.replace(/\s(id|aria-labelledby)="[^"]*"/g, ' $1="·"');
  expect(senseRuta).toBe(sense);
  expect(sense).not.toContain('sdp-cal-enllac');
});

test('Onada 6 · amb ruta, el títol del bloc i de la barra de la franja és l’enllaç a la publicació (Link del router); el text no canvia', () => {
  const triats = [];
  const Enllac = ({ to, children, ...resta }) => <a href={to} data-router="si" {...resta} onClick={(event) => event.preventDefault()}>{children}</a>;
  const { getByRole, container } = pinta({ onTriaDia: (clau) => triats.push(clau), rutaDeLEsdeveniment: rutaDe, LinkComponent: Enllac });
  const dimarts = getByRole('list', { name: dataLlarga(new Date(2026, 8, 29)) });
  expect(within(dimarts).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['10:00–11:30 Concert', '10:30–12:00 Assaig']);
  const concertEnllac = within(dimarts).getByRole('link', { name: 'Concert' });
  expect([concertEnllac.getAttribute('href'), concertEnllac.dataset.router, concertEnllac.className]).toEqual(['/events/concert', 'si', 'sdp-cal-enllac']);
  expect(concertEnllac.parentElement.className).toBe('sdp-cal-setmana__titol');
  // L'Assaig no té ruta: cap enllaç.
  expect(within(dimarts).queryByRole('link', { name: 'Assaig' })).toBeNull();
  // La franja de tot el dia: la barra de les Festes porta el seu enllaç i el modificador.
  const franja = container.querySelector('.sdp-cal-setmana__barres');
  const barra = within(franja).getByRole('link', { name: 'Festes' });
  expect(barra.getAttribute('href')).toBe('/events/festes');
  expect(barra.parentElement.classList.contains('sdp-cal-barra--enllac')).toBe(true);
  // Clicar l'enllaç no tria cap dia.
  act(() => barra.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
  expect(triats).toEqual([]);
});

/* Revisió del front calendari · En pantalla tàctil l'enllaç no rep el toc
   (pointer-events, que jsdom no aplica: el toc arriba al bloc, no a l'enllaç).
   Tocar un bloc, o clicar la columna fora de l'enllaç, tria el dia, com el
   quadre del Mes; una barra de la franja tria el seu primer dia de la
   setmana. El dia triat no es lleva així. */
const clica = (el) => act(() => { el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); });

test('Revisió · tocar un bloc (fora de l’enllaç) o la columna tria el seu dia; el triat no es lleva; l’enllaç no tria', () => {
  const triats = [];
  const Enllac = ({ to, children, ...resta }) => <a href={to} {...resta} onClick={(event) => event.preventDefault()}>{children}</a>;
  const { getByRole, container, rerender } = pinta({ onTriaDia: (clau) => triats.push(clau), rutaDeLEsdeveniment: rutaDe, LinkComponent: Enllac });
  const dimarts = getByRole('list', { name: dataLlarga(new Date(2026, 8, 29)) });
  const [blocConcert, blocAssaig] = within(dimarts).getAllByRole('listitem');
  clica(blocConcert.querySelector('.sdp-cal-setmana__quan'));
  clica(blocAssaig.querySelector('.sdp-cal-setmana__titol'));
  expect(triats).toEqual(['2026-09-29', '2026-09-29']);
  // La columna buida d'un altre dia (el divendres).
  clica(getByRole('list', { name: dataLlarga(new Date(2026, 9, 2)) }).closest('.sdp-cal-setmana__columna'));
  expect(triats.at(-1)).toBe('2026-10-02');
  // L'enllaç és de l'enllaç: cap dia.
  const abans = triats.length;
  clica(within(dimarts).getByRole('link', { name: 'Concert' }));
  expect(triats).toHaveLength(abans);
  // El dia que ja està triat no es lleva tocant-ne un bloc.
  rerender(<VistaSetmana esdeveniments={ESDEVENIMENTS} dilluns={DILLUNS} avui={AVUI} ara={ARA} locale="ca-ES" titol="Setmana del poble"
    diaTriat="2026-09-29" onTriaDia={(clau) => triats.push(clau)} rutaDeLEsdeveniment={rutaDe} LinkComponent={Enllac} />);
  clica(container.querySelector('.sdp-cal-setmana__bloc .sdp-cal-setmana__quan'));
  expect(triats).toHaveLength(abans);
});

test('Revisió · tocar una barra de la franja tria el seu primer dia de la setmana; sense dia triable, res', () => {
  const triats = [];
  const { container } = pinta({ onTriaDia: (clau) => triats.push(clau) });
  const barres = [...container.querySelectorAll('.sdp-cal-setmana__barres > li')];
  const festes = barres.find((li) => li.textContent === 'Festes');
  clica(festes);
  expect(triats).toEqual(['2026-09-28']);
  cleanup();
  // Sense onTriaDia (i fora de la tira), els blocs i les columnes són quiets.
  const quiet = pinta();
  clica(quiet.container.querySelector('.sdp-cal-setmana__bloc'));
  clica(quiet.container.querySelector('.sdp-cal-setmana__columna'));
  expect(quiet.container.querySelector('[aria-pressed="true"]')).toBeNull();
});

test('Revisió · a la tira, tocar un bloc tria el dia mostrat (hui, si no n’hi havia cap de triat)', () => {
  simulaAmplada(352);
  const triats = [];
  const { container } = render(
    <VistaSetmana esdeveniments={ESDEVENIMENTS} dilluns={DILLUNS} avui={new Date(2026, 8, 29, 9, 0)} ara={ARA} locale="ca-ES"
      titol="Setmana del poble" onTriaDia={(clau) => triats.push(clau)} />
  );
  expect(columnes(container)).toEqual([dataLlarga(new Date(2026, 8, 29))]);
  clica(container.querySelector('.sdp-cal-setmana__bloc'));
  expect(triats).toEqual(['2026-09-29']);
});
