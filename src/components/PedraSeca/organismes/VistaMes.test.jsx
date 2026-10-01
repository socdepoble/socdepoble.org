/* T10 (ordre del Mestre, 261001) · La vista Mes: els dies dels altres mesos
   marcats, una barra per setmana per als actes de diversos dies i el «+N més»
   dins del botó del dia.
   Fase visual (prompt 261001_0445) · Les setmanes justes (4-6 files), el nom
   curt del mes a l'1 d'un mes veí, el color de cada font, els punts dels actes
   amb hora, el mode compacte del contenidor estret, la densitat i la vista 2
   setmanes (N setmanes des d'un dilluns). */
import { act, cleanup, render, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { VistaMes } from './VistaMes.jsx';
import { creaEsdeveniment } from '../../../utils/esdeveniment.js';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const OCTUBRE = { any: 2026, mes: 9 };
const AVUI = new Date(2026, 9, 1, 12, 0);
const festes = creaEsdeveniment({ id: 'festes', titol: 'Festes', inici: { data: '2026-09-28' }, fi: { data: '2026-10-04' } });
const llarg = creaEsdeveniment({ id: 'llarg', titol: 'Exposició', inici: { data: '2026-10-09' }, fi: { data: '2026-10-14' } });
const cinc = Array.from({ length: 5 }, (_, i) => creaEsdeveniment({ id: `a${i}`, titol: `Acte ${i}`, inici: { dataHora: `2026-10-21T1${i}:00` } }));
const ESDEVENIMENTS = [festes, null, llarg, ...cinc];
const dataLlarga = (d) => d.toLocaleDateString('ca-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const pinta = (props = {}) => render(
  <VistaMes esdeveniments={ESDEVENIMENTS} cursor={OCTUBRE} avui={AVUI} locale="ca-ES" titol="Mes del poble" {...props} />
);
/* jsdom no fa layout: l'amplada del contenidor es simula al node de l'arrel. */
const ambAmplada = (ample) => vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function amplada() {
  return { width: this.classList.contains('sdp-cal-mes') ? ample : 0 };
});

test('les setmanes justes: octubre de 2026 en fa cinc, març de 2026 sis i febrer de 2027 quatre', () => {
  const files = (cursor, props) => {
    const { container } = render(<VistaMes esdeveniments={[]} cursor={cursor} avui={AVUI} locale="ca-ES" {...props} />);
    const fila = [...container.querySelectorAll('.sdp-cal-mes__fila')];
    expect(fila.every((f) => f.querySelectorAll('.sdp-cal-mes__cella').length === 7)).toBe(true);
    cleanup();
    return fila.length;
  };
  expect(files(OCTUBRE)).toBe(5);
  expect(files({ any: 2026, mes: 2 })).toBe(6);
  expect(files({ any: 2027, mes: 1 })).toBe(4);
  // L'API de sempre: setmanes={6} és la graella fixa de sis setmanes.
  expect(files({ any: 2027, mes: 1 }, { setmanes: 6 })).toBe(6);
});

/* Revisió de la fase visual · Sense titol, el nom de la regió apostrofa la
   preposició davant de vocal: «d’octubre», «d’abril», «d’agost». La resta
   del text («octubre del 2026») és la del locale (ICU). */
test('sense titol, la regió diu «Calendari d’octubre…» i «Calendari de setembre…»', () => {
  const nom = (cursor) => {
    const { container } = render(<VistaMes esdeveniments={[]} cursor={cursor} avui={AVUI} locale="ca-ES" />);
    const text = container.querySelector('.sdp-cal-mes').getAttribute('aria-label');
    cleanup();
    return text;
  };
  const mesAny = (any, mes) => new Date(any, mes, 1).toLocaleDateString('ca-ES', { month: 'long', year: 'numeric' });
  expect(nom(OCTUBRE)).toBe(`Calendari d’${mesAny(2026, 9)}`);
  expect(nom(OCTUBRE)).toMatch(/^Calendari d’octubre /);
  expect(nom({ any: 2026, mes: 8 })).toBe(`Calendari de ${mesAny(2026, 8)}`);
  expect(nom({ any: 2027, mes: 3 })).toMatch(/^Calendari d’abril /);
  expect(nom({ any: 2027, mes: 7 })).toMatch(/^Calendari d’agost /);
  expect(nom({ any: 2027, mes: 3 })).not.toMatch(/ de [aeiou]/);
});

test('els dies dels mesos veïns, atenuats; l’1 de novembre diu «1 de nov.»; hui, un de sol', () => {
  const { container } = pinta({ onTriaDia: () => {} });
  const fora = [...container.querySelectorAll('.sdp-cal-dia--fora')].map((d) => d.textContent);
  expect(fora).toEqual(['28', '29', '30', '1 de nov.']);
  expect(container.querySelectorAll('[aria-current="date"]')).toHaveLength(1);
  expect(container.querySelector('[aria-current="date"] .sdp-cal-dia__numero').textContent).toBe('1');
  // Cap altre dia porta el nom del mes.
  expect([...container.querySelectorAll('.sdp-cal-dia__numero')].filter((n) => /\D/.test(n.textContent)).map((n) => n.textContent)).toEqual(['1 de nov.']);
});

test('el nom de cada dia diu la data llarga, el recompte i els títols; les barres són aria-hidden', () => {
  const { getByRole, container } = pinta({ onTriaDia: () => {}, diaTriat: '2026-10-02' });
  const mes = getByRole('region', { name: 'Mes del poble' });
  const dies = within(mes).getAllByRole('button');
  expect(dies).toHaveLength(35);
  expect(dies[4].getAttribute('aria-label')).toBe(`${dataLlarga(new Date(2026, 9, 2))} · 1 esdeveniment: Festes`);
  expect(dies[4].getAttribute('aria-pressed')).toBe('true');
  expect(dies[6].getAttribute('aria-label')).toBe(`${dataLlarga(new Date(2026, 9, 4))} · 0 esdeveniments`);
  expect([...container.querySelectorAll('.sdp-cal-mes__barres')].every((ol) => ol.getAttribute('aria-hidden') === 'true')).toBe(true);
});

test('un acte de diversos dies és una barra per setmana, posicionada per les línies de graella', () => {
  const { container } = pinta();
  const files = container.querySelectorAll('.sdp-cal-mes__fila');
  const barres = (fila) => [...fila.querySelectorAll('.sdp-cal-barra')]
    .map((b) => [b.textContent, ...['col-inici', 'col-fi', 'carril'].map((n) => b.style.getPropertyValue(`--sdp-cal-${n}`))]);
  expect(barres(files[0])).toEqual([['Festes', '1', '7', '1']]);
  // L'exposició del 9 al 13: divendres i cap de setmana, i de dilluns a dimarts de la següent.
  expect(barres(files[1])).toEqual([['Exposició', '5', '8', '1']]);
  expect(barres(files[2])).toEqual([['Exposició', '1', '3', '1']]);
  // Sense font, el color d'una publicació (classeDeFont).
  expect(files[1].querySelector('.sdp-cal-barra').className).toBe('sdp-cal-barra sdp-cal-font--publicacio sdp-cal-barra--despres');
  expect(files[2].querySelector('.sdp-cal-barra').className).toBe('sdp-cal-barra sdp-cal-font--publicacio sdp-cal-barra--abans');
});

test('cinc actes un dia amb tres carrils: dos punts amb l’hora i «+3 més» dins del botó, que tria el dia', () => {
  const onTriaDia = vi.fn();
  const { container } = pinta({ onTriaDia });
  const fila = container.querySelectorAll('.sdp-cal-mes__fila')[3];
  expect([...fila.querySelectorAll('.sdp-cal-barra--punt')].map((p) => p.textContent)).toEqual(['10:00 Acte 0', '11:00 Acte 1']);
  const mes = fila.querySelector('.sdp-cal-mes__mes');
  expect(mes.textContent).toBe('+3 més');
  const boto = mes.closest('button');
  // WCAG 2.5.3 (revisió de T10): el nom conté el text visible, «21» i «+3 més», en el mateix ordre.
  expect(boto.getAttribute('aria-label')).toBe(`${dataLlarga(new Date(2026, 9, 21))} · 5 esdeveniments: Acte 0, Acte 1, Acte 2, Acte 3, Acte 4 · +3 més`);
  act(() => boto.click());
  expect(onTriaDia).toHaveBeenLastCalledWith('2026-10-21');
  expect(container.querySelectorAll('.sdp-cal-mes__mes')).toHaveLength(1);
});

test('punts i barres: l’acte amb hora porta el punt i l’hora; la barra, només el títol', () => {
  const { container } = pinta();
  const punts = [...container.querySelectorAll('.sdp-cal-barra--punt')];
  expect(punts.length).toBeGreaterThan(0);
  expect(punts.every((p) => p.querySelector('.sdp-cal-mes__punt') && p.querySelector('.sdp-cal-mes__hora'))).toBe(true);
  expect(punts[0].querySelector('.sdp-cal-mes__hora').textContent).toBe('10:00');
  const barres = [...container.querySelectorAll('.sdp-cal-barra:not(.sdp-cal-barra--punt)')];
  expect(barres.map((b) => b.textContent)).toEqual(['Festes', 'Exposició', 'Exposició']);
  expect(barres.some((b) => b.querySelector('.sdp-cal-mes__punt, .sdp-cal-mes__hora'))).toBe(false);
});

test('cada peça porta la classe de color de la seua font; les desconegudes, la de publicació', () => {
  const deFont = (tipus, dia, inici) => creaEsdeveniment({
    id: `f-${tipus}`, titol: `Acte ${tipus}`, inici: inici ? { dataHora: `${dia}T${inici}` } : { data: dia }, font: { tipus }
  });
  const esdeveniments = [
    deFont('esdeveniment', '2026-10-05'), deFont('publicacio', '2026-10-06'), deFont('producte', '2026-10-07', '09:00'),
    deFont('pagina', '2026-10-08'), deFont('agenda', '2026-10-09', '18:30'), deFont('poble', '2026-10-10')
  ];
  const { container } = pinta({ esdeveniments });
  const color = (titol) => [...container.querySelectorAll('.sdp-cal-barra')].find((b) => b.textContent.endsWith(titol)).className
    .split(' ').filter((c) => c.startsWith('sdp-cal-font--'));
  expect(color('Acte esdeveniment')).toEqual(['sdp-cal-font--esdeveniment']);
  expect(color('Acte publicacio')).toEqual(['sdp-cal-font--publicacio']);
  expect(color('Acte producte')).toEqual(['sdp-cal-font--producte']);
  expect(color('Acte pagina')).toEqual(['sdp-cal-font--pagina']);
  expect(color('Acte agenda')).toEqual(['sdp-cal-font--agenda']);
  expect(color('Acte poble')).toEqual(['sdp-cal-font--publicacio']);
});

test('amb més carrils hi caben tots; l’arrel diu quants n’hi ha', () => {
  const { container } = pinta({ maxCarrils: 6 });
  expect(container.querySelector('.sdp-cal-mes__mes')).toBeNull();
  expect(container.querySelector('.sdp-cal-mes').style.getPropertyValue('--sdp-cal-carrils')).toBe('6');
  for (const el of container.querySelectorAll('[style]')) expect(el.getAttribute('style')).toMatch(/^(--sdp-cal-[a-z-]+: ?[^;]+; ?)+$/);
});

test('sense onTriaDia, els dies són quiets', () => {
  const { container } = pinta();
  expect(container.querySelector('.sdp-cal-mes__dies button')).toBeNull();
  expect(container.querySelectorAll('.sdp-cal-mes__cella .sdp-cal-dia')).toHaveLength(35);
});

/* Revisió de T10 · Sense botons, les barres continuen aria-hidden i cada dia
   amb actes porta el recompte i els títols en text per al lector: el mode
   quiet no amaga cap acte. Un dia sense actes no en diu res. */
test('en el mode quiet, el lector llig el recompte i els títols de cada dia; les barres continuen aria-hidden', () => {
  const { container } = pinta();
  const cella = (n) => container.querySelectorAll('.sdp-cal-mes__cella .sdp-cal-dia')[n];
  // La cel·la 23 és el 21 d'octubre: els cinc actes, i el «+3 més» visible abans.
  expect(cella(23).textContent).toBe('21+3 més · 5 esdeveniments: Acte 0, Acte 1, Acte 2, Acte 3, Acte 4');
  expect(cella(23).querySelector('.sdp-sr-only').textContent).toBe(' · 5 esdeveniments: Acte 0, Acte 1, Acte 2, Acte 3, Acte 4');
  expect(cella(4).querySelector('.sdp-sr-only').textContent).toBe(' · 1 esdeveniment: Festes');
  expect(cella(6).querySelector('.sdp-sr-only')).toBeNull();
  expect([...container.querySelectorAll('.sdp-cal-mes__barres')].every((ol) => ol.getAttribute('aria-hidden') === 'true')).toBe(true);
});

test('contenidor estret (360 px): mode compacte, tires i punts sense text, «+3» i el mateix nom del dia', () => {
  ambAmplada(360);
  const { container } = pinta({ onTriaDia: () => {} });
  expect(container.querySelector('.sdp-cal-mes').className).toBe('sdp-cal-mes sdp-cal-mes--compacte');
  const peces = [...container.querySelectorAll('.sdp-cal-barra')];
  expect(peces.length).toBeGreaterThan(0);
  expect(peces.every((p) => p.textContent === '')).toBe(true);
  expect(peces.filter((p) => p.matches('.sdp-cal-barra--punt')).every((p) => p.querySelector('.sdp-cal-mes__punt'))).toBe(true);
  const mes = container.querySelector('.sdp-cal-mes__mes');
  expect(mes.textContent).toBe('+3');
  // El nom conté el text visible («21» i «+3»), en el mateix ordre.
  expect(mes.closest('button').getAttribute('aria-label'))
    .toBe(`${dataLlarga(new Date(2026, 9, 21))} · 5 esdeveniments: Acte 0, Acte 1, Acte 2, Acte 3, Acte 4 · +3 més`);
  // En compacte, l'1 de novembre és el número sol (el nom del botó porta la data llarga).
  expect([...container.querySelectorAll('.sdp-cal-dia--fora')].map((d) => d.textContent)).toEqual(['28', '29', '30', '1']);
});

test('contenidor ample (1024 px) o desconegut: mode ample, amb el text a les peces', () => {
  ambAmplada(1024);
  const { container } = pinta();
  expect(container.querySelector('.sdp-cal-mes').className).toBe('sdp-cal-mes');
  expect(container.querySelector('.sdp-cal-barra').textContent).toBe('Festes');
});

test('densitat: «normal» no es fa mai compacta; «compacta» ho diu a l’arrel; una desconeguda és «responsiva»', () => {
  ambAmplada(360);
  const classe = (densitat) => {
    const { container } = pinta({ densitat });
    const text = container.querySelector('.sdp-cal-mes').className;
    cleanup();
    return text;
  };
  expect(classe('normal')).toBe('sdp-cal-mes');
  expect(classe('compacta')).toBe('sdp-cal-mes sdp-cal-mes--compacte sdp-cal-mes--densitat-compacta');
  expect(classe('responsiva')).toBe('sdp-cal-mes sdp-cal-mes--compacte');
  expect(classe('xyz')).toBe('sdp-cal-mes sdp-cal-mes--compacte');
});

test('dues setmanes des d’un dilluns: dues files, cap dia atenuat, l’1 d’octubre amb el mes i sis carrils', () => {
  const avui = new Date(2026, 9, 7, 12);
  const { container, getByRole } = render(
    <VistaMes esdeveniments={ESDEVENIMENTS} dilluns={new Date(2026, 8, 30)} avui={avui} locale="ca-ES" onTriaDia={() => {}} />
  );
  const curta = (d) => d.toLocaleDateString('ca-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  const regio = getByRole('region', { name: `Calendari del ${curta(new Date(2026, 8, 28))} al ${curta(new Date(2026, 9, 11))}` });
  expect(regio.querySelectorAll('.sdp-cal-mes__fila')).toHaveLength(2);
  expect(within(regio).getAllByRole('button')).toHaveLength(14);
  expect(container.querySelector('.sdp-cal-dia--fora')).toBeNull();
  const numeros = [...container.querySelectorAll('.sdp-cal-dia__numero')].map((n) => n.textContent);
  expect(numeros[3]).toBe(new Date(2026, 9, 1).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' }));
  expect(numeros.filter((n) => /\D/.test(n))).toHaveLength(1);
  expect(container.querySelector('.sdp-cal-mes').style.getPropertyValue('--sdp-cal-carrils')).toBe('6');
  expect(container.querySelector('[aria-current="date"]').getAttribute('aria-label')).toBe(`${dataLlarga(avui)} · 0 esdeveniments`);
  // Les barres del període: les festes (28-09 a 03-10) i l'exposició, que continua després de l'11.
  expect([...container.querySelectorAll('.sdp-cal-barra')].map((b) => b.textContent)).toEqual(['Festes', 'Exposició']);
});
