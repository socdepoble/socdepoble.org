/**
 * Proves de la llesca editorial 260925: les funcions pures d'editorial.js i
 * la capçalera que en resulta a Disseny Pedra Seca (portada i espècimen).
 * Fitxer .js: sense JSX, amb createElement.
 */
import { createElement as h } from 'react';
import { render, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const disseny = vi.hoisted(() => ({ itemId: null }));

vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => () => {},
  useSearchParams: () => [new URLSearchParams(disseny.itemId ? `item=${disseny.itemId}` : ''), () => {}],
  Link: 'a'
}));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: () => {} }) }));
vi.mock('../../config/assetResolver', () => ({ resolveAsset: (uri) => uri }));
vi.mock('./workspace/UniversalWorkspace.jsx', async () => {
  const { createElement } = await import('react');
  return {
    UniversalWorkspace: ({ model, renderDetail }) => createElement('div', null, renderDetail({
      item: model.items.find((item) => item.id === (disseny.itemId ?? '__intro'))
    }))
  };
});
vi.mock('../../sections/disseny/cataleg/detailRegistry', () => ({
  CATALOG_DETAIL_LOADERS: { 'fonaments/contracte': () => null, 'estructura/shell': () => null }
}));

import {
  COPYRIGHT_SDP, MARGE_INSERCIO_MS, dataDElement, dataDeDocument, dataDeFila, dataDelNom, dataHoraDeBarra, diaAmbHora,
  formatDate, formatTime, llevaPuntFinal, momentDElement, pindolesUniques
} from './editorial.js';
import DesignSection from '../../sections/disseny/DesignSection.jsx';
import { VERSIO_CATALEG } from '../../sections/disseny/cataleg/versio.js';
import { PAGE_COPY } from '../../sections/text/pageContent.js';
import { legalContent } from '../../sections/text/legalContent.js';

afterEach(() => { cleanup(); disseny.itemId = null; });

describe('llevaPuntFinal', () => {
  it.each([
    ['Títol.', 'Títol'],
    ['Títol', 'Títol'],
    ['Títol.   ', 'Títol'],
    ['Títol .', 'Títol'],
    ['Versió 1.2 del pla.', 'Versió 1.2 del pla'],
    ['Continuarà...', 'Continuarà...'],
    ['Continuarà…', 'Continuarà…'],
    ['Dos punts..', 'Dos punts..'],
    ['Sense espais finals   ', 'Sense espais finals'],
    ['.', '.'],
    ['', '']
  ])('%j → %j', (entrada, eixida) => {
    expect(llevaPuntFinal(entrada)).toBe(eixida);
  });

  it('només lleva UN punt i no toca els de dins', () => {
    expect(llevaPuntFinal('A. B. C.')).toBe('A. B. C');
  });

  it('allò que no és text passa tal qual, amb la mateixa identitat', () => {
    const node = { type: 'span' };
    expect(llevaPuntFinal(node)).toBe(node);
    expect(llevaPuntFinal(null)).toBeNull();
    expect(llevaPuntFinal(undefined)).toBeUndefined();
    expect(llevaPuntFinal(3)).toBe(3);
  });
});

/* D9 · formatDate i formatTime passen pel mateix lector que la pastilla: cap
   format propi, cap `new Date(text)` que llija un dia en UTC. */
describe('formatDate i formatTime (el lector de la pastilla)', () => {
  it('amb hora: el mateix dia i la mateixa hora que la pastilla', () => {
    const iso = '2026-09-25T13:12:23.715Z';
    const { time, date } = dataHoraDeBarra({ creat: iso });
    expect([formatTime(iso), formatDate(iso)]).toEqual([time, date]);
  });

  it('un dia sol és el dia del text (també a l’oest de Greenwich) i no porta hora', () => {
    expect(formatDate('2026-09-21')).toBe('21/09/26');
    expect(formatTime('2026-09-21')).toBe('');
    // El copy de PAGE_COPY (mitjanit UTC exacta): el dia, mai unes «02:00».
    expect([formatTime('2026-08-11T00:00:00.000Z'), formatDate('2026-08-11T00:00:00.000Z')]).toEqual(['', '11/08/26']);
  });

  it('sense data, o amb una que no és data, no pinten res', () => {
    expect(formatDate('')).toBe('');
    expect(formatTime(undefined)).toBe('');
    expect(formatDate('demà')).toBe('');
    expect(formatTime('demà')).toBe('');
  });
});

/* T51 · Regla del Mestre (260928): cap document existeix sense data. En
   lectura, la de creació o la de l'última modificació si és posterior; mai
   buida, mai guionets, mai inventada. */
describe('dataHoraDeBarra i dataDeDocument (T51)', () => {
  const dos = (n) => String(n).padStart(2, '0');
  /* La pastilla que s'espera d'un instant, amb el calendari local: la prova
     no depén de la zona horària de qui l'executa. */
  const pastilla = (d) => ({
    time: `${dos(d.getHours())}:${dos(d.getMinutes())}`,
    date: `${dos(d.getDate())}/${dos(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)}`
  });
  const ISO_LOCAL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;

  it('només creació: la de creació, amb dd/mm/aa, hh:mm i un ISO local de veres', () => {
    const data = dataHoraDeBarra({ creat: '2026-09-21T10:30:00' });
    expect(data).toMatchObject({ time: '10:30', date: '21/09/26' });
    expect(data.dateTime).toMatch(ISO_LOCAL);
    expect(data.dateTime.startsWith('2026-09-21T10:30:00')).toBe(true);
    expect(new Date(data.dateTime).getTime()).toBe(new Date(2026, 8, 21, 10, 30).getTime());
  });

  it('modificat després de crear: guanya la modificació (la més recent de les dues)', () => {
    const fonts = { creat: '2026-09-01T08:00:00', modificat: '2026-09-27T19:45:00' };
    expect(dataDeDocument(fonts).font).toBe('modificat');
    expect(dataHoraDeBarra(fonts)).toMatchObject({ time: '19:45', date: '27/09/26' });
  });

  it('una modificació anterior o igual a la creació no la trepitja', () => {
    expect(dataDeDocument({ creat: '2026-09-21T10:30:00', modificat: '2026-09-20T10:30:00' }).font).toBe('creat');
    expect(dataDeDocument({ creat: '2026-09-21T10:30:00', modificat: '2026-09-21T10:30:00' }).font).toBe('creat');
    expect(dataHoraDeBarra({ creat: '2026-09-21T10:30:00', modificat: 'demà' })).toMatchObject({ time: '10:30', date: '21/09/26' });
  });

  it('sense creació però amb modificació: la de modificació', () => {
    expect(dataHoraDeBarra({ modificat: '2026-09-27T19:45:00' })).toMatchObject({ time: '19:45', date: '27/09/26' });
  });

  it('T40 · la data triada al calendari fa d’origen en lloc de la de creació; una modificació posterior encara guanya', () => {
    expect(dataDeDocument({ publicat: '2026-10-05T08:30:00', creat: '2026-09-01T10:00:00' }).font).toBe('publicat');
    expect(dataHoraDeBarra({ publicat: '2026-10-05T08:30:00', creat: '2026-09-01T10:00:00' })).toMatchObject({ time: '08:30', date: '05/10/26' });
    expect(dataDeDocument({ publicat: '2026-09-02T08:30:00', modificat: '2026-09-03T09:00:00' }).font).toBe('modificat');
    // Una data triada que no és data no amaga la de creació.
    expect(dataDeDocument({ publicat: 'demà', creat: '2026-09-01T10:00:00' }).font).toBe('creat');
  });

  it('cada camp pot ser una llista de candidats: compta el primer que és una data real', () => {
    expect(dataHoraDeBarra({ creat: [undefined, 'no és data', '2026-09-21T08:00', '2026-01-01'] })).toMatchObject({ time: '08:00', date: '21/09/26' });
    expect(dataHoraDeBarra({ creat: [null, ''] })).toEqual({ time: '', date: '', dateTime: '' });
  });

  it('una instantània en UTC («Z») es pinta amb l’hora i el dia locals', () => {
    const iso = '2026-09-25T13:12:23.715Z';
    const data = dataHoraDeBarra({ modificat: iso });
    expect(data).toMatchObject(pastilla(new Date(iso)));
    expect(data.dateTime).toMatch(ISO_LOCAL);
    expect(new Date(data.dateTime).getTime()).toBe(Date.parse('2026-09-25T13:12:23Z'));
  });

  it('el format de Postgres i PostgREST (sis decimals, «+00») es llig igual en tots els navegadors', () => {
    const instant = Date.UTC(2026, 8, 28, 10, 15, 30);
    for (const valor of ['2026-09-28T10:15:30.123456+00:00', '2026-09-28 10:15:30.123456+00', '2026-09-28T12:15:30+0200']) {
      const data = dataHoraDeBarra({ creat: valor });
      expect(new Date(data.dateTime).getTime()).toBe(instant);
      expect(data).toMatchObject(pastilla(new Date(instant)));
    }
  });

  it('un Date vàlid també és una data real (l’editor hi posa la d’ara)', () => {
    const ara = new Date(2026, 8, 28, 16, 5, 9);
    expect(dataHoraDeBarra({ creat: ara })).toMatchObject({ time: '16:05', date: '28/09/26' });
    expect(dataHoraDeBarra({ creat: new Date('no') })).toEqual({ time: '', date: '', dateTime: '' });
  });

  it('una data sense hora dona el dia exacte i cap hora inventada', () => {
    expect(dataHoraDeBarra({ creat: '2026-09-21' })).toEqual({ time: '', date: '21/09/26', dateTime: '2026-09-21' });
    expect(dataHoraDeBarra({ creat: '2028-02-29' })).toEqual({ time: '', date: '29/02/28', dateTime: '2028-02-29' });
    expect(dataHoraDeBarra({ creat: '5/9/26' })).toEqual({ time: '', date: '05/09/26', dateTime: '2026-09-05' });
    expect(dataHoraDeBarra({ creat: '05/09/2026' })).toEqual({ time: '', date: '05/09/26', dateTime: '2026-09-05' });
  });

  it.each([
    [''], ['260921'], ['demà'], ['2026-13-45'], ['2026-02-30'], ['2026-02-31T10:00'], ['2026-04-31'],
    ['2026-09-21T24:00'], ['2026-09-21T10:60'], ['31/02/26'], [undefined], [null], [20260921], [{}]
  ])('sense cap data real (%j) no se n’inventa cap: els tres camps buits', (valor) => {
    expect(dataDeDocument({ creat: valor, modificat: valor, publicat: valor })).toBeNull();
    expect(dataHoraDeBarra({ creat: valor })).toEqual({ time: '', date: '', dateTime: '' });
  });

  it('sense fonts, cap data (i mai la d’ara)', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2030-01-02T03:04:00Z'));
    try {
      expect(dataHoraDeBarra()).toEqual({ time: '', date: '', dateTime: '' });
      expect(dataHoraDeBarra({})).toEqual({ time: '', date: '', dateTime: '' });
    } finally {
      vi.useRealTimers();
    }
  });

  it('dataDeFila: created_at i updated_at d’una fila del servidor', () => {
    expect(dataDeFila({ created_at: '2026-08-01T09:00:00Z', updated_at: '2026-09-27T17:30:00Z' }))
      .toEqual(dataHoraDeBarra({ modificat: '2026-09-27T17:30:00Z' }));
    expect(dataDeFila({ created_at: '2026-08-01T09:00:00Z' })).toEqual(dataHoraDeBarra({ creat: '2026-08-01T09:00:00Z' }));
    expect(dataDeFila(null)).toEqual({ time: '', date: '', dateTime: '' });
  });

  /* D5 · Un dia escrit a mà i serialitzat (mitjanit UTC exacta) és un dia
     sol com a data de creació: sense les «02:00» que ningú no ha escrit. */
  it('D5 · la data del copy (AAAA-MM-DDT00:00:00.000Z) com a creació és el dia sol, en qualsevol zona', () => {
    expect(dataHoraDeBarra({ creat: '2026-08-20T00:00:00.000Z' })).toEqual({ time: '', date: '20/08/26', dateTime: '2026-08-20' });
    expect(dataDeDocument({ creat: '2026-08-20T00:00:00.000Z' })).toMatchObject({ ambHora: false, font: 'creat' });
    // També dins d'una llista de candidats.
    expect(dataHoraDeBarra({ creat: [null, '2026-09-24T00:00:00.000Z'] })).toMatchObject({ time: '', date: '24/09/26' });
    // Totes les dates del copy de les pàgines són dies sols: cap no porta hora a la pastilla.
    for (const pagina of [...Object.values(PAGE_COPY), legalContent].filter((p) => p?.date)) {
      expect(dataHoraDeBarra({ creat: pagina.date }).time).toBe('');
      expect(dataHoraDeBarra({ creat: pagina.date }).date).toMatch(/^\d{2}\/\d{2}\/\d{2}$/);
    }
  });

  it('D5 · només la forma exacta i només a `creat`: una hora de veres continua sent una hora', () => {
    const minut = '2026-08-20T00:01:00.000Z';
    expect(dataHoraDeBarra({ creat: minut }).time).not.toBe('');
    // Postgres no escriu la forma del copy: «+00:00» és un instant.
    expect(dataHoraDeBarra({ creat: '2026-08-20T00:00:00+00:00' }).time).not.toBe('');
    // La data triada al calendari (T40) pot caure a la mitjanit UTC (les 02:00 d'estiu): és una hora.
    expect(dataDeDocument({ publicat: '2026-08-20T00:00:00.000Z' })).toMatchObject({ ambHora: true, font: 'publicat' });
    // Una modificació ve d'un rellotge: és una hora.
    expect(dataDeDocument({ modificat: '2026-08-20T00:00:00.000Z' })).toMatchObject({ ambHora: true, font: 'modificat' });
  });

  it('D5 · el dia sol de creació compta com la mitjanit local per a la regla de la més recent', () => {
    expect(dataDeDocument({ creat: '2026-09-24T00:00:00.000Z', modificat: '2026-09-24T08:00:00' }).font).toBe('modificat');
    expect(dataDeDocument({ creat: '2026-09-24T00:00:00.000Z', modificat: '2026-09-23T22:00:00' }).font).toBe('creat');
  });
});

/* T51 · La data d'un element de secció (Mur, Mercat, agenda…): pura, aquí,
   perquè el detall, el lector de connexions i el MAS la compartixen. */
describe('dataDElement', () => {
  it('el dia i l’hora propis (agenda), la triada al calendari, la creació i la modificació posterior', () => {
    // Un acte: el seu dia i la seua hora, encara que la fila siga d'abans.
    expect(dataDElement({ date: '2026-10-05', time: '18:30', created_at: '2026-09-01T10:00:00Z' }))
      .toMatchObject({ date: '05/10/26', time: '18:30' });
    // Un acte sense hora de veres: el dia, sense hora inventada.
    expect(dataDElement({ date: '2026-10-05', time: 'Tot el dia' })).toEqual({ date: '05/10/26', time: '', dateTime: '2026-10-05' });
    // Un `date` que no és data no amaga la triada al calendari (T40).
    expect(dataDElement({ date: 'dissabte', publish_date: '2026-10-05T08:30:00', created_at: '2026-09-01T10:00:00' }))
      .toMatchObject({ date: '05/10/26', time: '08:30' });
    // Només creació; i una modificació posterior a la creació, que guanya.
    expect(dataDElement({ created_at: '2026-09-01T10:00:00' })).toMatchObject({ date: '01/09/26', time: '10:00' });
    expect(dataDElement({ created_at: '2026-09-01T10:00:00', updated_at: '2026-09-20T12:15:00' })).toMatchObject({ date: '20/09/26', time: '12:15' });
    // Sense cap font real, res (i mai la d'ara).
    expect(dataDElement({ title: 'Sense data' })).toEqual({ time: '', date: '', dateTime: '' });
    expect(dataDElement(null)).toEqual({ time: '', date: '', dateTime: '' });
  });

  it('una publicació de section_submissions editada (updated_at de PostgREST) mostra la d’edició', () => {
    const fila = { created_at: '2026-09-01T10:00:00.123456+00:00', updated_at: '2026-09-20T12:15:00.654321+00:00' };
    expect(dataDElement(fila)).toEqual(dataHoraDeBarra({ modificat: fila.updated_at }));
  });

  /* W3A D1 · updated_at naix a la inserció amb el `default now()` del
     servidor, uns mil·lisegons després del created_at que posa el client: no
     és cap edició, i no pot trepitjar la data triada ni la de creació. */
  it('D1 · l’updated_at de la inserció (dins del marge) no compta com a modificació', () => {
    expect(MARGE_INSERCIO_MS).toBe(60000);
    const insercio = { created_at: '2026-09-28T10:00:00.120+00:00', updated_at: '2026-09-28T10:00:00.183412+00:00' };
    // Amb data triada al calendari anterior a publicar: la triada, no l'hora d'inserció.
    expect(dataDElement({ ...insercio, publish_date: '2026-09-01T09:00:00' })).toEqual(dataHoraDeBarra({ publicat: '2026-09-01T09:00:00' }));
    // Un acte de l'agenda publicat després del seu dia: el dia de l'acte.
    expect(dataDElement({ ...insercio, date: '2026-09-20', time: '18:30' })).toMatchObject({ date: '20/09/26', time: '18:30' });
    // Sense res més: la de creació (font `creat`, no `modificat`).
    expect(dataDElement(insercio)).toEqual(dataHoraDeBarra({ creat: insercio.created_at }));
    // Just al límit (60 s exactes) encara és la inserció.
    expect(dataDElement({ created_at: '2026-09-28T10:00:00Z', updated_at: '2026-09-28T10:01:00Z', publish_date: '2026-09-01T09:00:00' }))
      .toMatchObject({ date: '01/09/26', time: '09:00' });
  });

  it('D1 · una edició de veres (més d’un minut després de crear) sí que guanya a la triada anterior', () => {
    const editada = { created_at: '2026-09-28T10:00:00Z', updated_at: '2026-09-28T10:01:00.001Z', publish_date: '2026-09-01T09:00:00' };
    expect(dataDElement(editada)).toEqual(dataHoraDeBarra({ modificat: editada.updated_at }));
    expect(dataDElement({ ...editada, updated_at: '2026-09-29T08:00:00Z' })).toEqual(dataHoraDeBarra({ modificat: '2026-09-29T08:00:00Z' }));
    // Sense created_at llegible, l'updated_at és l'única font real i compta.
    expect(dataDElement({ updated_at: '2026-09-29T08:00:00Z' })).toEqual(dataHoraDeBarra({ modificat: '2026-09-29T08:00:00Z' }));
  });

  /* T51 · L'ordre del Mur ix de la mateixa data que la pastilla. */
  it('momentDElement: l’instant de la mateixa data que pinta dataDElement; null sense cap data real', () => {
    expect(momentDElement({ date: '2026-10-05', time: '18:30', created_at: '2026-09-01T10:00:00Z' })).toBe(new Date(2026, 9, 5, 18, 30).getTime());
    // Un dia sol és la mitjanit LOCAL d'aquell dia, com a la pastilla.
    expect(momentDElement({ created_at: '2026-08-20T00:00:00.000Z' })).toBe(new Date(2026, 7, 20).getTime());
    // L'updated_at de la inserció no mou l'ordre; una edició de veres, sí.
    expect(momentDElement({ created_at: '2026-09-28T10:00:00Z', updated_at: '2026-09-28T10:00:00.200Z' })).toBe(Date.parse('2026-09-28T10:00:00Z'));
    expect(momentDElement({ created_at: '2026-09-28T10:00:00Z', updated_at: '2026-09-29T10:00:00Z' })).toBe(Date.parse('2026-09-29T10:00:00Z'));
    expect(momentDElement({ title: 'Sense data' })).toBeNull();
    expect(momentDElement(null)).toBeNull();
  });
});

describe('diaAmbHora', () => {
  it.each([
    [['2026-10-05', '18:30'], '2026-10-05T18:30'],
    [['2026-10-05', '9.05'], '2026-10-05T09:05'],
    [['2026-10-05', '18:30h'], '2026-10-05T18:30'],
    [['2026-10-05', 'Tot el dia'], '2026-10-05'],
    [['2026-10-05', '25:00'], '2026-10-05'],
    [['2026-10-05', undefined], '2026-10-05'],
    [['dissabte', '18:30'], 'dissabte'],
    [[undefined, '18:30'], undefined]
  ])('%j → %j', ([dia, hora], eixida) => {
    expect(diaAmbHora(dia, hora)).toBe(eixida);
  });
});

describe('dataDelNom (segell aammdd_hhmm de la taxonomia)', () => {
  it.each([
    ['260913_0635_arquitectura_perfil_universal', '2026-09-13T06:35'],
    ['260928_acta_marmota', '2026-09-28'],
    ['260913', '2026-09-13'],
    ['260231_1200_informe', null],
    ['260913_2561_informe', null],
    ['2609131_informe', null],
    ['00_index', null],
    ['ADR-2026-08-ONLINE-FIRST', null],
    [undefined, null]
  ])('%j → %j', (nom, eixida) => {
    expect(dataDelNom(nom)).toBe(eixida);
  });
});

describe('pindolesUniques', () => {
  it('lleva buits i duplicats sense mirar la caixa; guanya la primera', () => {
    const carpeta = { text: 'SABER', className: 'sdp-badge-system' };
    const resultat = pindolesUniques([
      carpeta,
      false,
      null,
      { text: '  ', className: 'sdp-badge-tag' },
      { text: 'saber', className: 'sdp-badge-tag' },
      'wiki',
      { text: 'Wiki', className: 'sdp-badge-tag' }
    ]);
    expect(resultat).toEqual([carpeta, 'wiki']);
  });

  it('una entrada que no és llista dona una llista buida', () => {
    expect(pindolesUniques(null)).toEqual([]);
  });
});

it('el copyright compartit és el que pintava TextSection', () => {
  expect(COPYRIGHT_SDP).toBe('© Sóc de Poble / Fet per la IAIA i Nano Banana');
});

describe('Disseny Pedra Seca · capçalera editorial', () => {
  const pinta = () => render(h(DesignSection)).container;
  const pindoles = (arrel) => [...arrel.querySelectorAll('.page-title-labels > li')]
    .map((li) => [li.textContent, li.className.replace('sp-card-label ', '')]);

  it('portada: logo, H1, píndoles de PAGE_COPY, copyright, H2, entradilla i data', () => {
    const page = PAGE_COPY.disseny;
    const arrel = pinta();
    expect(arrel.querySelectorAll('header.page-title .page-title-logo')).toHaveLength(2);
    expect(arrel.querySelector('header.page-title h1').textContent).toBe(page.title);
    expect(pindoles(arrel)).toEqual(page.labels.map((label) => [label.text, label.className]));
    expect(arrel.querySelector('.page-title-copyright').textContent).toBe(COPYRIGHT_SDP);
    expect(arrel.querySelector('.page-intro h2').textContent).toBe(llevaPuntFinal(page.subtitle));
    expect(arrel.querySelector('.page-intro p.lead').textContent).toBe(page.lead);
    expect(arrel.querySelector('.hero-image img').getAttribute('alt')).toBe(page.imageAlt);
    // D5 · la data del copy és un dia: la pastilla porta el dia i cap «02:00».
    const data = arrel.querySelector('.bar-orange .btn-date-time');
    expect([...data.querySelectorAll('span')].map((s) => s.textContent)).toEqual([formatDate(page.date)]);
    expect(formatTime(page.date)).toBe('');
  });

  it('espècimen: família, «En curs» i etiquetes; entradilla honesta i la data real de la versió del catàleg', () => {
    disseny.itemId = 'fonaments-contracte';
    const arrel = pinta();
    expect(arrel.querySelector('header.page-title h1').textContent).toBe('Contracte de Pedra Seca');
    expect(arrel.querySelectorAll('header.page-title .page-title-logo')).toHaveLength(2);
    expect(pindoles(arrel)).toEqual([
      ['Fonaments', 'sdp-badge-system'],
      ['En curs', 'sdp-badge-category'],
      ['llei', 'sdp-badge-tag'],
      ['arquitectura', 'sdp-badge-tag'],
      ['sistema', 'sdp-badge-tag']
    ]);
    expect(arrel.querySelector('.page-title-copyright').textContent).toBe(COPYRIGHT_SDP);
    expect(arrel.querySelector('.page-intro h2').textContent).toBe('Lleis, arquitectura universal i pàgines de sistema');
    expect(arrel.querySelector('.page-intro p.lead').textContent).toMatch(/Fonaments.*en curs/);
    // T51 · cap document sense data: la de la versió del catàleg, amb hora.
    // D7 · comparat amb el valor calculat: la prova no depén de la zona horària.
    const d = new Date(VERSIO_CATALEG);
    const dos = (n) => String(n).padStart(2, '0');
    const { time, date } = dataHoraDeBarra({ modificat: VERSIO_CATALEG });
    expect([time, date]).toEqual([
      `${dos(d.getHours())}:${dos(d.getMinutes())}`,
      `${dos(d.getDate())}/${dos(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)}`
    ]);
    const pastilla = arrel.querySelector('.bar-orange .btn-date-time');
    expect([...pastilla.querySelectorAll('span')].map((s) => s.textContent)).toEqual([time, date]);
  });

  it('VERSIO_CATALEG (cataleg/versio.js) és una data real amb hora i zona, i no ve del futur', () => {
    expect(dataDeDocument({ creat: VERSIO_CATALEG })).toMatchObject({ ambHora: true });
    expect(VERSIO_CATALEG).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
    expect(Date.parse(VERSIO_CATALEG)).toBeLessThanOrEqual(Date.now());
  });

  it('espècimen sense subtítol: l’H2 és la família del catàleg', () => {
    disseny.itemId = 'estructura-shell';
    const arrel = pinta();
    expect(arrel.querySelector('.page-intro h2').textContent).toBe('Estructura');
    expect(pindoles(arrel).map(([text]) => text)).toEqual(['Estructura', 'En curs']);
  });
});
