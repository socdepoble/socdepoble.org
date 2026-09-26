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
  COPYRIGHT_SDP, dataDocument, formatDate, formatTime, llevaPuntFinal, pindolesUniques
} from './editorial.js';
import DesignSection from '../../sections/disseny/DesignSection.jsx';
import { PAGE_COPY } from '../../sections/text/pageContent.js';

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

describe('formatDate i formatTime (traslladats de TextSection i de la Wiki)', () => {
  const iso = '2026-08-11T00:00:00.000Z';

  it('pinten el mateix que abans per a una data vàlida', () => {
    const d = new Date(iso);
    expect(formatDate(iso)).toBe(d.toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }));
    expect(formatTime(iso)).toBe(d.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' }));
  });

  it('sense data no pinten res, i amb una data invàlida no s’inventen hora', () => {
    expect(formatDate('')).toBe('');
    expect(formatTime(undefined)).toBe('');
    expect(formatDate('demà')).toBe('demà');
    expect(formatTime('demà')).toBe('');
  });
});

describe('dataDocument', () => {
  it('una data sense hora dona el dia exacte, sense hora inventada', () => {
    expect(dataDocument('2026-09-21')).toEqual({ dateTime: '2026-09-21', date: '21/09/26', time: '' });
  });

  it('amb hora, la pinta com les portades', () => {
    const valor = '2026-09-21T10:30:00';
    expect(dataDocument(valor)).toEqual({ dateTime: valor, date: formatDate(valor), time: formatTime(valor) });
  });

  it('el 29 de febrer d’un any de traspàs sí que existix', () => {
    expect(dataDocument('2028-02-29')).toEqual({ dateTime: '2028-02-29', date: '29/02/28', time: '' });
  });

  it('«AAAA-MM-DD hh:mm» amb espai es llig amb «T»', () => {
    expect(dataDocument('2026-09-21 10:30').dateTime).toBe('2026-09-21T10:30');
  });

  it.each([
    [''], ['260921'], ['demà'], ['2026-13-45'], ['2026-02-30'], ['2026-02-31T10:00'], ['2026-04-31'],
    [undefined], [null], [20260921], [['2026-09-21']]
  ])(
    'sense data real (%j) no hi ha data', (valor) => {
      expect(dataDocument(valor)).toBeNull();
    }
  );
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
    const data = arrel.querySelector('.bar-orange .btn-date-time');
    expect(data.textContent).toBe(`${formatTime(page.date)}${formatDate(page.date)}`);
  });

  it('espècimen: família, «En curs» i etiquetes; entradilla honesta i cap data inventada', () => {
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
    expect(arrel.querySelector('.btn-date-time')).toBeNull();
  });

  it('espècimen sense subtítol: l’H2 és la família del catàleg', () => {
    disseny.itemId = 'estructura-shell';
    const arrel = pinta();
    expect(arrel.querySelector('.page-intro h2').textContent).toBe('Estructura');
    expect(pindoles(arrel).map(([text]) => text)).toEqual(['Estructura', 'En curs']);
  });
});
