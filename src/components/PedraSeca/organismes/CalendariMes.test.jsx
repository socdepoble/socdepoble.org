/* T40 (ordre del Mestre, 260928) · El mes compartit Consola–editor. La prova
   clau és la de la Llei del Píxel: NavegacioMes + GraellaMes pinten EXACTAMENT
   el DOM que CalendariMapa escrivia a mà abans del trasllat.
   T6-T8 (260930) · La Consola pinta ara amb CalendariEsdeveniments: el mateix
   DOM amb una sola diferència, la classe de la variant gran de T7. */
import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { GraellaMes, NavegacioMes } from './CalendariMes.jsx';
import { CalendariEsdeveniments } from './CalendariEsdeveniments.jsx';
import { Boto } from '../atoms/Boto.jsx';
import { Taula } from './Taula.jsx';
import { DIES_CURTS, DIES_LLARGS, graellaMes } from '../../../utils/calendari.js';
import { creaEsdeveniment } from '../../../utils/esdeveniment.js';

afterEach(cleanup);

const AVUI = new Date(2026, 8, 28, 10, 0);
const AMB_XIP = new Set([1, 28]);

/* El marcatge de CalendariMapa.jsx abans de T40, literal (amb un xip fals).
   `classeT7`: l'única classe que T7 hi afig, a la regió de la graella. */
function MesAntic({ cursor, avui, locale, classeT7 }) {
  const setmanes = graellaMes(cursor.any, cursor.mes);
  const titolMes = new Date(cursor.any, cursor.mes, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  const esAvui = (dia) => dia === avui.getDate() && cursor.mes === avui.getMonth() && cursor.any === avui.getFullYear();
  return (
    <>
      <div className="sdp-consola__capcal">
        <Boto varietat="secundari" onClick={() => {}} aria-label="Mes anterior">‹</Boto>
        <Boto varietat="secundari" onClick={() => {}}>Hui</Boto>
        <Boto varietat="secundari" onClick={() => {}} aria-label="Mes següent">›</Boto>
      </div>
      <Taula titol={`Calendari de ${titolMes}`} className={classeT7}>
        <caption>{titolMes}</caption>
        <thead>
          <tr>{DIES_CURTS.map((d, i) => <th key={d} scope="col"><abbr title={DIES_LLARGS[i]}>{d}</abbr></th>)}</tr>
        </thead>
        <tbody>
          {setmanes.map((setmana) => (
            <tr key={setmana.find(Boolean)}>
              {setmana.map((dia, i) => (
                <td key={dia ?? `buit-${i}`}>
                  {dia ? <>
                    {esAvui(dia) ? <><strong>{dia}</strong><span className="sdp-nomes-lector"> (hui)</span></> : dia}
                    {AMB_XIP.has(dia) ? [<div key="x"><span>xip</span></div>] : []}
                  </> : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Taula>
    </>
  );
}

function MesNou({ cursor, avui, locale }) {
  return (
    <>
      <NavegacioMes className="sdp-consola__capcal" cursor={cursor} onCanvia={() => {}} avui={avui} />
      <GraellaMes any={cursor.any} mes={cursor.mes} locale={locale} avui={avui}
        renderDia={(dia, { numero }) => (
          <>
            {numero}
            {AMB_XIP.has(dia) ? [<div key="x"><span>xip</span></div>] : []}
          </>
        )} />
    </>
  );
}

test('Llei del Píxel · NavegacioMes + GraellaMes pinten el mateix DOM que abans del trasllat', () => {
  for (const cursor of [{ any: 2026, mes: 8 }, { any: 2026, mes: 1 }, { any: 2027, mes: 0 }]) {
    const antic = render(<MesAntic cursor={cursor} avui={AVUI} locale="ca-ES" />).container.innerHTML;
    cleanup();
    const nou = render(<MesNou cursor={cursor} avui={AVUI} locale="ca-ES" />).container.innerHTML;
    cleanup();
    expect(nou).toBe(antic);
  }
});

/* Els mateixos xips dels dies 1 i 28, com a esdeveniment del model. */
const XIPS = [creaEsdeveniment({ id: 'xip', titol: 'xip', inici: { data: '2020-01-01' }, recurrencia: ['RRULE:FREQ=MONTHLY;BYMONTHDAY=1,28'] })];

test('Llei del Píxel · la Consola (CalendariEsdeveniments) pinta el DOM de T40 amb només la classe de T7', () => {
  for (const cursor of [{ any: 2026, mes: 8 }, { any: 2026, mes: 1 }, { any: 2027, mes: 0 }]) {
    const antic = render(<MesAntic cursor={cursor} avui={AVUI} locale="ca-ES" classeT7="sdp-calendari--gran" />).container.innerHTML;
    cleanup();
    const nou = render(
      <CalendariEsdeveniments esdeveniments={XIPS} cursor={cursor} avui={AVUI} locale="ca-ES"
        navegacioClassName="sdp-consola__capcal" renderEsdeveniment={() => <div><span>xip</span></div>} />
    ).container.innerHTML;
    cleanup();
    expect(nou).toBe(antic);
  }
});

test('NavegacioMes: noms, className i «Hui» torna al mes d’avui', () => {
  const onCanvia = vi.fn();
  const { container, getByRole } = render(
    <NavegacioMes className="barra" cursor={{ any: 2026, mes: 0 }} onCanvia={onCanvia} avui={AVUI} />
  );
  expect(container.firstElementChild.className).toBe('barra');
  act(() => getByRole('button', { name: 'Mes anterior' }).click());
  expect(onCanvia).toHaveBeenLastCalledWith({ any: 2025, mes: 11 });
  act(() => getByRole('button', { name: 'Mes següent' }).click());
  expect(onCanvia).toHaveBeenLastCalledWith({ any: 2026, mes: 1 });
  act(() => getByRole('button', { name: 'Hui' }).click());
  expect(onCanvia).toHaveBeenLastCalledWith({ any: 2026, mes: 8 });
});

/* Ordre del Mestre, 261001 · La ranura `accions` de NavegacioMes (el botó de
   pantalla completa de /calendari): l'últim fill de la barra, darrere de «›».
   Sense, el DOM de sempre (les proves de la Llei del Píxel de dalt). */
test('NavegacioMes amb accions: el node és l’últim fill de la barra, darrere de «Mes següent»', () => {
  const { container, getByRole } = render(
    <NavegacioMes className="barra" cursor={{ any: 2026, mes: 9 }} onCanvia={() => {}} avui={AVUI}
      accions={<button type="button">Pantalla completa</button>} />
  );
  const barra = container.firstElementChild;
  expect(barra.lastElementChild).toBe(getByRole('button', { name: 'Pantalla completa' }));
  expect(barra.lastElementChild.previousElementSibling).toBe(getByRole('button', { name: 'Mes següent' }));
  expect(barra.children).toHaveLength(4);
  cleanup();
  const sense = render(<NavegacioMes className="barra" cursor={{ any: 2026, mes: 9 }} onCanvia={() => {}} avui={AVUI} />).container.innerHTML;
  cleanup();
  const ambNull = render(<NavegacioMes className="barra" cursor={{ any: 2026, mes: 9 }} onCanvia={() => {}} avui={AVUI} accions={null} />).container.innerHTML;
  expect(ambNull).toBe(sense);
});

test('GraellaMes: caption, set capçaleres amb abbr i el dia de hui per al lector', () => {
  const { container, getByRole } = render(<GraellaMes any={2026} mes={8} locale="ca-ES" avui={AVUI} />);
  const regio = getByRole('region');
  expect(regio.getAttribute('aria-label')).toMatch(/^Calendari de /);
  expect(regio.className).toBe('sdp-taula');
  expect(container.querySelector('caption').textContent).toBe(regio.getAttribute('aria-label').replace('Calendari de ', ''));
  const abbrs = [...container.querySelectorAll('thead th abbr')];
  expect(abbrs.map((a) => a.getAttribute('title'))).toEqual([...DIES_LLARGS]);
  const dies = [...container.querySelectorAll('tbody td')].filter((td) => td.textContent);
  expect(dies).toHaveLength(30);
  expect(container.querySelector('tbody strong').textContent).toBe('28');
  expect(container.querySelector('tbody .sdp-nomes-lector').textContent).toBe(' (hui)');
});

test('GraellaMes compacta: una classe més i renderDia substituïx la cel·la', () => {
  const { container } = render(
    <GraellaMes any={2026} mes={8} locale="ca-ES" avui={AVUI} compacta titol="Tria el dia"
      renderDia={(dia, { esAvui }) => <button type="button" aria-current={esAvui ? 'date' : undefined}>{dia}</button>} />
  );
  const regio = container.querySelector('[role="region"]');
  expect(regio.className).toBe('sdp-taula sdp-calendari--compacte');
  expect(regio.getAttribute('aria-label')).toBe('Tria el dia');
  expect(container.querySelectorAll('tbody button')).toHaveLength(30);
  expect(container.querySelector('button[aria-current="date"]').textContent).toBe('28');
  expect(container.querySelector('tbody strong')).toBeNull();
});
