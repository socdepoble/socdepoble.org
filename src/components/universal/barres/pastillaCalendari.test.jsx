/**
 * Ordre del Mestre, 261001 (tasca 4, «la Boina Taronja») · La pastilla de
 * data de les targetes (UniversalCard) i de la barra taronja de les pàgines
 * (UniversalPage → PageFrame → BarraTaronja), en LECTURA:
 *   · porta l'hora quan la font en té, i una font de només dia es pinta sense
 *     hora (Pedra Seca §10: l'hora no s'inventa);
 *   · és un botó que obri el Calendari global, amb un nom accessible que diu
 *     el que es veu (l'hora i el dia, en eixe ordre) i on porta, i el clic no
 *     arriba a qui l'envolta.
 * Carril A (ordre del Mestre, 261001) · Porta al MES de la targeta
 * (/calendari?mes=AAAA-MM, mes local), no al dia (abans ?date=AAAA-MM-DD),
 * perquè davall del calendari isquen totes les targetes d'eixe període.
 * Routers de veres (MemoryRouter): una sonda llig on ha portat cada clic.
 */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation, useNavigate } from '../../../app/contexts/RouterContext';
import { SECTIONS } from '../../../config/sections.js';
import { cursorDeMes } from '../../../sections/calendari/calendariGlobal.js';
import {
  ACCIO_PASTILLA_CALENDARI, RUTA_CALENDARI, dataDElement, dataHoraDeBarra, etiquetaPastillaCalendari,
  mesDeLaPastilla, rutaCalendariDelMes
} from '../editorial.js';
import { UniversalCard } from '../../PedraSeca/organismes/UniversalCard.jsx';
import { BarraTaronja } from './BarraTaronja.jsx';
import { DinsDelCalendari } from './pastillaCalendari.js';
import { UniversalPage } from '../UniversalPage.jsx';
import EspecimenControlsBarra from '../../../sections/disseny/cataleg/detalls/EspecimenControlsBarra.jsx';
import EspecimenUniversalCard from '../../../sections/disseny/cataleg/detalls/EspecimenUniversalCard.jsx';

beforeEach(() => { vi.stubEnv('TZ', 'Europe/Madrid'); });
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

/* On és l'app ara mateix (camí i consulta), escrit en un node que la prova llig. */
function Sonda() {
  const { pathname, search } = useLocation();
  return <output data-testid="on-soc">{`${pathname}${search ? `?${search}` : ''}`}</output>;
}
const onSoc = () => screen.getByTestId('on-soc').textContent;
const ambRouter = (node, rutaInicial = '/mur') => render(
  <MemoryRouter rutaInicial={rutaInicial}>{node}<Sonda /></MemoryRouter>
);
const textos = (pastilla) => [...pastilla.querySelectorAll('span')].map((s) => s.textContent);

describe('peces pures (editorial.js)', () => {
  test('la ruta del Calendari és la mateixa de config/sections.js', () => {
    expect(SECTIONS.find((s) => s.id === 'calendari')?.path).toBe(RUTA_CALENDARI);
  });

  test('guarda: la zona de València s’aplica de veres al worker', () => {
    expect(new Date(2026, 0, 15).getTimezoneOffset()).toBe(-60);
  });

  test('el mes de la pastilla: primer el dateTime, en mes LOCAL; si no, el dia de pantalla', () => {
    expect(mesDeLaPastilla({ dateTime: '2026-09-25T15:12:23+02:00', date: '01/01/20' })).toBe('2026-09');
    // Un instant en UTC a la vora de la mitjanit (i del mes): el local, no el d'UTC.
    expect(mesDeLaPastilla({ dateTime: '2026-09-30T22:30:00Z' })).toBe('2026-10');
    expect(mesDeLaPastilla({ dateTime: '2026-09-30T21:30:00Z' })).toBe('2026-09');
    expect(mesDeLaPastilla({ dateTime: '2026-10-12T09:00' })).toBe('2026-10');
    // Una font de només dia també té mes.
    expect(mesDeLaPastilla({ dateTime: '2026-11-14' })).toBe('2026-11');
    expect(mesDeLaPastilla({ date: '10/09/26' })).toBe('2026-09');
    // Un dia sense zeros, com el que pinta l'ICU: el lector també el llig.
    expect(mesDeLaPastilla({ date: '15/8/2026' })).toBe('2026-08');
    for (const brossa of [{}, { date: 'demà' }, { date: '31/02/26' }, { dateTime: '', date: '' }, undefined]) {
      expect(mesDeLaPastilla(brossa)).toBeNull();
    }
  });

  test('la ruta en eixe mes; sense un mes vàlid, el Calendari tal qual', () => {
    expect(rutaCalendariDelMes('2026-09')).toBe('/calendari?mes=2026-09');
    expect(rutaCalendariDelMes('1000-01')).toBe('/calendari?mes=1000-01');
    for (const brossa of [null, undefined, '', '2026-13', '2026-00', '2026-9', '0026-01', '0999-12', '2026-09-24', '09/2026', 'demà']) {
      expect(rutaCalendariDelMes(brossa)).toBe('/calendari');
    }
  });

  /* La pastilla escriu el ?mes= i la pàgina el llig (calendariGlobal.js ·
     cursorDeMes): les dues han de dir el mateix de cada valor, o la pastilla
     portaria a un mes que la pàgina no sap obrir. */
  test('la ruta de la pastilla i el lector de la pàgina diuen el mateix de cada mes', () => {
    for (const mes of ['2026-09', '1000-01', '9999-12', '2026-13', '2026-00', '2026-9', '0026-01', '0999-12', '2026-09-24', '', 'demà']) {
      expect(rutaCalendariDelMes(mes) !== RUTA_CALENDARI, mes).toBe(cursorDeMes(mes) !== null);
    }
  });

  /* WCAG 2.5.3 (revisió del carril A) · El nom conté el text visible en el
     mateix ordre: DateTimeControl pinta primer l'hora i després el dia. */
  test('el nom accessible diu l’hora (si n’hi ha) i el dia, en l’ordre que es veuen, i on porta', () => {
    expect(ACCIO_PASTILLA_CALENDARI).toBe('Obri el calendari d’eixe mes');
    expect(etiquetaPastillaCalendari({ time: '19:22', date: '30/09/26' })).toBe('19:22 30/09/26 · Obri el calendari d’eixe mes');
    expect(etiquetaPastillaCalendari({ time: '', date: '24/09/26' })).toBe('24/09/26 · Obri el calendari d’eixe mes');
    expect(etiquetaPastillaCalendari({})).toBe(ACCIO_PASTILLA_CALENDARI);
  });

  /* La causa de «només 24/09/26»: les targetes de dalt del Mur són pàgines del
     sistema (PAGE_COPY), amb la data com un DIA serialitzat a la mitjanit UTC.
     La regla les pinta sense hora. Amb una font que porta hora, l'hora hi és. */
  test('una font de només dia no porta hora; una font amb hora, sí (regla §10)', () => {
    expect(dataHoraDeBarra({ creat: '2026-09-24T00:00:00.000Z' })).toEqual({ time: '', date: '24/09/26', dateTime: '2026-09-24' });
    expect(dataHoraDeBarra({ creat: '2026-09-29T10:30:00+02:00' })).toMatchObject({ time: '10:30', date: '29/09/26' });
    expect(dataHoraDeBarra({ creat: '2026-09-29T08:30:00.000Z' })).toMatchObject({ time: '10:30', date: '29/09/26' });
  });
});

describe('UniversalCard · la boina taronja', () => {
  const targeta = (item, props = {}) => {
    const data = dataDElement(item);
    return (
      <UniversalCard title={item.title} author="Sóc de Poble" mainHref="/mur/p1"
        time={data.time} date={data.date} dateTime={data.dateTime} {...props} />
    );
  };

  test('amb una font que porta hora, la pastilla pinta l’hora i el dia, com la munta el Mur', () => {
    const { container } = ambRouter(targeta({ title: 'Crònica', created_at: '2026-09-29T08:30:00Z' }));
    expect(textos(container.querySelector('.sp-card-header .btn-date-time'))).toEqual(['10:30', '29/09/26']);
  });

  test('una font de només dia (la data d’una pàgina del sistema) es pinta sense hora inventada', () => {
    const { container } = ambRouter(targeta({ title: 'Wiki de Poble', created_at: '2026-09-24T00:00:00.000Z' }));
    expect(textos(container.querySelector('.sp-card-header .btn-date-time'))).toEqual(['24/09/26']);
  });

  test('la pastilla és un botó amb nom que diu on porta, i obri el Calendari en el mes de la targeta', () => {
    const { container } = ambRouter(targeta({ title: 'Crònica', created_at: '2026-09-29T08:30:00Z' }));
    const pastilla = within(container).getByRole('button', { name: '10:30 29/09/26 · Obri el calendari d’eixe mes' });
    expect(pastilla.classList.contains('btn-date-time')).toBe(true);
    expect(pastilla.getAttribute('title')).toBe('10:30 29/09/26 · Obri el calendari d’eixe mes');
    act(() => { fireEvent.click(pastilla); });
    expect(onSoc()).toBe('/calendari?mes=2026-09');
  });

  /* Carril A · A la vora de la mitjanit del canvi de mes, el mes LOCAL que
     pinta la pastilla: les dos targetes són del 30-09 en UTC. */
  test('el 30/09 a les 23:30 de València porta a setembre; l’1/10 a les 00:10, a octubre', () => {
    const setembre = ambRouter(targeta({ title: 'Vetlada', created_at: '2026-09-30T21:30:00Z' }));
    const deSetembre = setembre.container.querySelector('.btn-date-time');
    expect(textos(deSetembre)).toEqual(['23:30', '30/09/26']);
    act(() => { fireEvent.click(deSetembre); });
    expect(onSoc()).toBe('/calendari?mes=2026-09');
    cleanup();
    const octubre = ambRouter(targeta({ title: 'Ball', created_at: '2026-09-30T22:10:00+00:00' }));
    const dOctubre = octubre.container.querySelector('.btn-date-time');
    expect(textos(dOctubre)).toEqual(['00:10', '01/10/26']);
    act(() => { fireEvent.click(dOctubre); });
    expect(onSoc()).toBe('/calendari?mes=2026-10');
  });

  test('el clic no arriba a la targeta ni a qui l’envolta, ni obri l’element', () => {
    const envolta = vi.fn();
    const onMainClick = vi.fn();
    const { container } = ambRouter(
      <div onClick={envolta}>{targeta({ title: 'Crònica', created_at: '2026-09-29T08:30:00Z' }, { mainHref: undefined, onMainClick })}</div>
    );
    act(() => { fireEvent.click(container.querySelector('.btn-date-time')); });
    expect(envolta).not.toHaveBeenCalled();
    expect(onMainClick).not.toHaveBeenCalled();
    expect(onSoc()).toBe('/calendari?mes=2026-09');
  });

  /* Revisió del carril A (P3) · Dins del Calendari les targetes de davall
     també porten pastilla: el clic reemplaça l'entrada, com les fletxes i els
     dies, i un sol «Enrere» torna d'on es venia. Fora, apila com sempre. */
  test('dins del Calendari la pastilla reemplaça l’entrada de l’historial: un sol «Enrere» torna d’on es venia', () => {
    function Enrere() {
      const navigate = useNavigate();
      return <button type="button" onClick={() => navigate(-1)}>Enrere</button>;
    }
    const { container } = ambRouter(
      <>
        {targeta({ title: 'Des del Mur', created_at: '2026-09-29T08:30:00Z' })}
        <DinsDelCalendari.Provider value>
          {targeta({ title: 'Samarreta', created_at: '2026-09-30T12:07:00Z' })}
          {targeta({ title: 'Constitució', created_at: '2026-09-29T15:37:00Z' })}
          {targeta({ title: 'Agost', created_at: '2026-08-20T09:00:00Z' })}
        </DinsDelCalendari.Provider>
        <Enrere />
      </>
    );
    const [deFora, ...deDins] = container.querySelectorAll('button.btn-date-time');
    act(() => { fireEvent.click(deFora); });
    expect(onSoc()).toBe('/calendari?mes=2026-09');
    for (const pastilla of deDins) act(() => { fireEvent.click(pastilla); });
    expect(onSoc()).toBe('/calendari?mes=2026-08');
    act(() => { fireEvent.click(screen.getByRole('button', { name: 'Enrere' })); });
    expect(onSoc()).toBe('/mur');
  });

  /* Fase visual (prompt 261001_0445) · Dins de les vistes noves la pàgina
     posa una funció (mes) => ruta: la pastilla porta a la vista Mes i
     continua reemplaçant l'entrada. Una funció que no torna cap ruta deixa la
     de sempre; sense mes vàlid, la funció rep null. */
  test('el context pot ser una funció (mes) => ruta: la pastilla hi porta, amb replace', () => {
    function Enrere() {
      const navigate = useNavigate();
      return <button type="button" onClick={() => navigate(-1)}>Enrere</button>;
    }
    const rebuts = [];
    const cap = (mes) => {
      rebuts.push(mes);
      return mes ? `/calendari?vista=mes&mes=${mes}` : null;
    };
    const { container } = ambRouter(
      <>
        {targeta({ title: 'Des del Mur', created_at: '2026-09-29T08:30:00Z' })}
        <DinsDelCalendari.Provider value={cap}>
          {targeta({ title: 'Samarreta', created_at: '2026-09-30T12:07:00Z' })}
          {targeta({ title: 'Agost', created_at: '2026-08-20T09:00:00Z' })}
        </DinsDelCalendari.Provider>
        <DinsDelCalendari.Provider value={() => ''}>
          {targeta({ title: 'Sense ruta', created_at: '2026-07-02T09:00:00Z' })}
        </DinsDelCalendari.Provider>
        <Enrere />
      </>
    );
    const [deFora, setembre, agost, juliol] = container.querySelectorAll('button.btn-date-time');
    act(() => { fireEvent.click(deFora); });
    expect(onSoc()).toBe('/calendari?mes=2026-09');
    act(() => { fireEvent.click(setembre); });
    expect(onSoc()).toBe('/calendari?vista=mes&mes=2026-09');
    act(() => { fireEvent.click(agost); });
    expect(onSoc()).toBe('/calendari?vista=mes&mes=2026-08');
    expect(rebuts).toEqual(['2026-09', '2026-08']);
    act(() => { fireEvent.click(juliol); });
    expect(onSoc()).toBe('/calendari?mes=2026-07');
    // El primer clic, de fora, apila; els tres de dins reemplacen: un sol «Enrere» torna al Mur.
    act(() => { fireEvent.click(screen.getByRole('button', { name: 'Enrere' })); });
    expect(onSoc()).toBe('/mur');
  });

  test('un onDateTime propi mana (i conserva el nom de sempre); onDateTime={false}, un <time> sense clic', () => {
    const propi = vi.fn();
    const { container } = ambRouter(targeta({ title: 'Nota', created_at: '2026-09-29T08:30:00Z' }, { onDateTime: propi }));
    const boto = container.querySelector('button.btn-date-time');
    expect(boto.getAttribute('aria-label')).toBe('Data i hora: 10:30: 29/09/26');
    act(() => { fireEvent.click(boto); });
    expect(propi).toHaveBeenCalledTimes(1);
    expect(onSoc()).toBe('/mur');
    cleanup();
    const quiet = ambRouter(targeta({ title: 'Nota', created_at: '2026-09-29T08:30:00Z' }, { onDateTime: false }));
    expect(quiet.container.querySelector('time.btn-date-time').getAttribute('datetime')).toBe('2026-09-29T10:30:00+02:00');
    expect(quiet.container.querySelector('button.btn-date-time')).toBeNull();
  });
});

describe('BarraTaronja i UniversalPage · la barra de pàgina', () => {
  test('BarraTaronja: etiquetaData dona nom a la pastilla; sense, el de sempre', () => {
    const { container } = render(<BarraTaronja authorName="Pepa" time="10:30" date="24/09/26" dateTime="2026-09-24T10:30"
      onDateTime={() => {}} etiquetaData="10:30 24/09/26 · Obri el calendari d’eixe mes" />);
    expect(container.querySelector('.bar-actions button.btn-date-time').getAttribute('aria-label'))
      .toBe('10:30 24/09/26 · Obri el calendari d’eixe mes');
    cleanup();
    const sense = render(<BarraTaronja authorName="Pepa" time="10:30" date="24/09/26" onDateTime={() => {}} />);
    expect(sense.container.querySelector('.bar-actions .btn-date-time').getAttribute('aria-label')).toBe('Data i hora: 10:30: 24/09/26');
  });

  test('UniversalPage en lectura: la pastilla de la barra taronja obri el Calendari en el mes de la pàgina', () => {
    const { container } = ambRouter(
      <UniversalPage chrome="context" title="Constitució" time="10:30" date="24/09/26" dateTime="2026-09-24T10:30:00+02:00" />,
      '/constitucio'
    );
    const pastilla = within(container.querySelector('section.bar-orange')).getByRole('button', { name: '10:30 24/09/26 · Obri el calendari d’eixe mes' });
    expect(textos(pastilla)).toEqual(['10:30', '24/09/26']);
    act(() => { fireEvent.click(pastilla); });
    expect(onSoc()).toBe('/calendari?mes=2026-09');
  });

  test('UniversalPage: un dia sol, sense hora ni al text ni al nom; i el mes local, no el d’UTC', () => {
    const dia = ambRouter(<UniversalPage chrome="context" title="Legal" date="09/09/26" dateTime="2026-09-09" />, '/legal');
    const pastilla = within(dia.container.querySelector('section.bar-orange')).getByRole('button', { name: '09/09/26 · Obri el calendari d’eixe mes' });
    expect(textos(pastilla)).toEqual(['09/09/26']);
    act(() => { fireEvent.click(pastilla); });
    expect(onSoc()).toBe('/calendari?mes=2026-09');
    cleanup();
    const vora = ambRouter(<UniversalPage chrome="context" title="Ball" time="00:30" date="01/10/26" dateTime="2026-09-30T22:30:00Z" />, '/ball');
    act(() => { fireEvent.click(vora.container.querySelector('section.bar-orange .btn-date-time')); });
    expect(onSoc()).toBe('/calendari?mes=2026-10');
  });

  test('UniversalPage: un onDateTime propi continua manant, amb el nom de sempre', () => {
    const propi = vi.fn();
    const { container } = ambRouter(<UniversalPage chrome="context" title="X" time="10:30" date="24/09/26" onDateTime={propi} />, '/x');
    const pastilla = container.querySelector('section.bar-orange .btn-date-time');
    expect(pastilla.getAttribute('aria-label')).toBe('Data i hora: 10:30: 24/09/26');
    act(() => { fireEvent.click(pastilla); });
    expect(propi).toHaveBeenCalledTimes(1);
    expect(onSoc()).toBe('/x');
  });
});

describe('Espècimens del catàleg · la pastilla amb hora i clicable', () => {
  test('Controls de barra: la barra taronja de lectura porta hora i obri el Calendari', () => {
    ambRouter(<EspecimenControlsBarra />, '/disseny');
    const lectura = screen.getByRole('region', { name: 'Autoria i data (espècimen, lectura)' });
    const pastilla = within(lectura).getByRole('button', { name: '11:00 25/04/26 · Obri el calendari d’eixe mes' });
    expect(textos(pastilla)).toEqual(['11:00', '25/04/26']);
    act(() => { fireEvent.click(pastilla); });
    expect(onSoc()).toBe('/calendari?mes=2026-04');
  });

  test('UniversalCard: la targeta del Mur porta hora i obri el Calendari; la de només lectura continua quieta', () => {
    const { container } = ambRouter(<EspecimenUniversalCard />, '/disseny');
    const pastilla = within(container).getByRole('button', { name: '10:00 07/08/22 · Obri el calendari d’eixe mes' });
    expect(textos(pastilla)).toEqual(['10:00', '07/08/22']);
    act(() => { fireEvent.click(pastilla); });
    expect(onSoc()).toBe('/calendari?mes=2022-08');
    // La Consola (onDateTime={false}): un <time> amb hora, sense clic.
    const consola = [...container.querySelectorAll('article.sp-card')].find((a) => a.textContent.includes('Calendari de processos'));
    expect(consola.querySelector('time.btn-date-time').getAttribute('datetime')).toBe('2026-09-26T01:42:00');
    // Cap targeta de lectura sense nom de destí: totes les que tenen clic diuen on porten.
    const ambClic = [...container.querySelectorAll('.sp-card-header button.btn-date-time')];
    expect(ambClic.length).toBeGreaterThan(0);
    for (const boto of ambClic) expect(boto.getAttribute('aria-label')).toMatch(/ · Obri el calendari d’eixe mes$/);
  });
});
