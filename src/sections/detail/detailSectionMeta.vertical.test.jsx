/**
 * IDEA-61 (T0, prompt 261102_1532) · El detall S2 d'una fitxa vertical
 * (buildVerticalDetailSectionMeta): la meta del Mur amb els elements
 * filtrats per àmbit (també una 'tancada': el detall continua existint),
 * l'etiqueta de l'àmbit, la llista /<ambit> i, al cos, ABANS del cos de
 * sempre, la fitxa de lectura: la Insígnia d'estat i cada camp del
 * contracte present a `dades`, en un <dl>, amb els enums traduïts. Les dades
 * es tornen a coaccionar en pintar: un valor hostil del jsonb no es pinta.
 * El patró és detailSectionMeta.mercat.test.jsx (render del renderBody).
 */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';

import { buildDetailSectionMeta, buildVerticalDetailSectionMeta, esSeccioDelMur } from './detailSectionMeta.jsx';

const t = (_, alternativa) => alternativa;
const CREAT = '2026-11-02T10:00:00.000Z';
const viatge = {
  id: 'v1', type: 'vehicle', title: 'Viatge a Alcoi', ambit: 'vehicle', estat: 'reservat', created_at: CREAT, content: '<p>Isc a les huit.</p>',
  dades: { modalitat: 'oferisc_places', lloc_eixida: 'La Torre', lloc_arribada: 'Alcoi', data_eixida: '2026-11-15', hora_eixida: '08:00', places: 3, aportacio: '5 €' }
};
const oferta = { id: 't1', type: 'treball', title: 'Forner', ambit: 'treball', estat: 'disponible', created_at: CREAT, dades: { modalitat: 'oferta_feina', ofici: 'Forn', contacte: 'Al forn, de matí' } };
const casa = { id: 'h1', type: 'habitatge', title: 'Casa al carrer Major', ambit: 'habitatge', estat: 'tancat', created_at: CREAT, dades: { modalitat: 'venda', preu: '90.000 €', superficie_m2: 120, habitacions: 3, estat_immoble: 'a_reformar' } };
const deSempre = { id: 'p1', type: 'feed', title: 'La fira', created_at: CREAT, content: '<p>Diumenge.</p>' };
const FEED = [viatge, oferta, casa, deSempre];

const pinta = (ambit, item) => render(buildVerticalDetailSectionMeta(ambit, { feedPosts: FEED, t }).renderBody(item));
const files = (container) => {
  const dl = container.querySelector('dl');
  const dts = [...dl.querySelectorAll('dt')].map((dt) => dt.textContent);
  const dds = [...dl.querySelectorAll('dd')].map((dd) => dd.textContent);
  return dts.map((dt, i) => [dt, dds[i]]);
};

afterEach(cleanup);

describe('la meta d’una vertical', () => {
  test.each([['vehicle', 'Compartir cotxe', ['v1']], ['treball', 'Treball', ['t1']], ['habitatge', 'Habitatge', ['h1']]])(
    '%s: l’etiqueta de l’àmbit, la llista /<ambit>, només els seus elements (també una tancada) i el mode estricte del Mur',
    (ambit, etiqueta, ids) => {
      const meta = buildVerticalDetailSectionMeta(ambit, { feedPosts: FEED, t });
      expect([meta.title, meta.label, meta.listPath]).toEqual([etiqueta, etiqueta, `/${ambit}`]);
      expect(meta.items.map((item) => item.id)).toEqual(ids);
      expect(esSeccioDelMur(meta)).toBe(true);
      expect(esSeccioDelMur(ambit)).toBe(true);
      expect(meta.getTitle(meta.items[0])).toBe(meta.items[0].title);
    }
  );

  test('el registre del detall porta les tres metes, amb les publicacions del Mur', () => {
    const registre = buildDetailSectionMeta({ events: [], feedPosts: FEED, marketItems: [], mediaItems: [], notes: [], towns: [], t });
    expect(['vehicle', 'treball', 'habitatge'].map((ambit) => [ambit, registre[ambit].listPath, registre[ambit].items.map((item) => item.id)]))
      .toEqual([['vehicle', '/vehicle', ['v1']], ['treball', '/treball', ['t1']], ['habitatge', '/habitatge', ['h1']]]);
    /* El Mur de sempre no canvia: tots els feedPosts. */
    expect(registre.mur.items).toBe(FEED);
  });
});

describe('la fitxa de lectura, davant del cos de sempre', () => {
  test('vehicle: l’estat com a Insígnia i cada camp present, amb el rètol del contracte i l’enum traduït', () => {
    const { container } = pinta('vehicle', viatge);
    expect(files(container)).toEqual([
      ['Estat', 'Reservat'],
      ['Modalitat', 'Oferisc places'],
      ['Lloc d’eixida', 'La Torre'],
      ['Lloc d’arribada', 'Alcoi'],
      ['Dia d’eixida', '2026-11-15'],
      ['Hora d’eixida', '08:00'],
      ['Places disponibles', '3'],
      ['Aportació per plaça', '5 €']
    ]);
    const insignia = container.querySelector('dl dd .sdp-insignia');
    expect(insignia.className).toBe('sdp-insignia sdp-insignia--avis');
    expect(insignia.textContent).toBe('Reservat');
    /* La fitxa va ABANS del cos de sempre. P0-34 (261107): la fila de píndoles
       inventada ja no hi és; l'àncora és el paràgraf del contingut. */
    const dl = container.querySelector('dl');
    expect(container.querySelector('.badge-row')).toBeNull();
    const cos = [...container.querySelectorAll('p')].find((el) => el.textContent === 'Isc a les huit.');
    expect(cos).toBeTruthy();
    expect(dl.compareDocumentPosition(cos) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.textContent).toContain('Isc a les huit.');
  });

  test('habitatge: la superfície amb la unitat, l’estat de l’immoble traduït i el to de «Tancat»', () => {
    const { container } = pinta('habitatge', casa);
    expect(files(container)).toEqual([
      ['Estat', 'Tancat'],
      ['Modalitat', 'Venda'],
      ['Preu', '90.000 €'],
      ['Superfície (m²)', '120 m²'],
      ['Habitacions', '3'],
      ['Estat de l’immoble', 'Per a reformar']
    ]);
    expect(container.querySelector('dl dd .sdp-insignia').className).toBe('sdp-insignia sdp-insignia--error');
  });

  test('treball: el camp de contacte es llig al detall (la fitxa és per a contactar), i l’estat de sèrie és Disponible', () => {
    const { container } = pinta('treball', oferta);
    expect(files(container)).toEqual([
      ['Estat', 'Disponible'],
      ['Modalitat', 'Oferta de feina'],
      ['Ofici o sector', 'Forn'],
      ['Com contactar', 'Al forn, de matí']
    ]);
    expect(container.querySelector('dl dd .sdp-insignia').className).toBe('sdp-insignia sdp-insignia--exit');
  });

  test('un jsonb hostil: un enum fora de la llista, un enter fora de rang, una data falsa i una clau desconeguda no es pinten; l’estat desconegut cau a Disponible', () => {
    const hostil = {
      ...viatge, estat: 'constructor',
      dades: { modalitat: 'tot_gratis', places: 99, data_eixida: '2026-02-30', lloc_eixida: '  La Torre  ', __proto__: { lloc_arribada: 'Fals' }, hack: '<script>' }
    };
    const { container } = pinta('vehicle', hostil);
    expect(files(container)).toEqual([['Estat', 'Disponible'], ['Lloc d’eixida', 'La Torre']]);
    expect(container.innerHTML).not.toContain('<script>');
    expect(container.textContent).not.toContain('Fals');
  });

  test('sense dades (una fitxa buida o un valor que no és objecte), només l’estat', () => {
    for (const dades of [undefined, null, 'text', 42, []]) {
      const { container } = pinta('vehicle', { ...viatge, dades });
      expect([dades, files(container)]).toEqual([dades, [['Estat', 'Reservat']]]);
      cleanup();
    }
  });
});

/* Correcció L3-A2 · /mur/<id> és la ruta del subjecte del xat (contracte.js ·
   PREFIX_DE_SUBJECTE.publicacio = '/mur/') i elementDeSeccio hi resol
   qualsevol feedPost: la meta del Mur també pinta la fitxa d'una fitxa
   d'àmbit, una sola vegada i idèntica a la de la vertical; una publicació
   sense àmbit queda byte a byte com sempre. */
describe('la fitxa de lectura també a /mur/<id> (correcció L3-A2)', () => {
  const registre = () => buildDetailSectionMeta({ events: [], feedPosts: FEED, marketItems: [], mediaItems: [], notes: [], towns: [], t });

  test('la meta del Mur pinta el <dl> d’una fitxa d’àmbit davant del cos, una sola vegada i idèntic al de la vertical', () => {
    const mur = render(registre().mur.renderBody(viatge)).container;
    expect(files(mur)[0]).toEqual(['Estat', 'Reservat']);
    expect(mur.querySelectorAll('dl')).toHaveLength(1);
    expect(mur.querySelectorAll('.sdp-insignia')).toHaveLength(1);
    const cosMur = [...mur.querySelectorAll('p')].find((el) => el.textContent === 'Isc a les huit.');
    expect(mur.querySelector('dl').compareDocumentPosition(cosMur) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const html = mur.innerHTML;
    cleanup();
    const vertical = render(registre().vehicle.renderBody(viatge)).container;
    expect(vertical.querySelectorAll('dl')).toHaveLength(1);
    expect(vertical.innerHTML).toBe(html);
  });

  test('una publicació de sempre a la meta del Mur: cap <dl> ni insígnia, i el mateix HTML amb les claus inertes de «mur»', () => {
    const sense = render(registre().mur.renderBody(deSempre)).container;
    expect(sense.querySelector('dl')).toBeNull();
    expect(sense.querySelector('.sdp-insignia')).toBeNull();
    /* P0-34 (261107): cap barra inventada d'autor, poble, comentaris i m'agrada. */
    expect(sense.querySelector('.badge-row')).toBeNull();
    expect(sense.textContent).toContain('Diumenge.');
    const html = sense.innerHTML;
    cleanup();
    const amb = render(registre().mur.renderBody({ ...deSempre, ambit: 'mur', estat: 'disponible', dades: {} })).container;
    expect(amb.innerHTML).toBe(html);
  });

  test('una fitxa de mercat que arribe a la meta del Mur: els camps del Mercat, coaccionats', () => {
    const producte = { id: 'm1', type: 'product', title: 'Oli', ambit: 'mercat', estat: 'disponible', created_at: CREAT, dades: { preu: '12 €', categoria: 'Oli', hack: '<b>x</b>' } };
    const { container } = render(registre().mur.renderBody(producte));
    expect(files(container)).toEqual([['Estat', 'Disponible'], ['Preu', '12 €'], ['Categoria', 'Oli']]);
    expect(container.innerHTML).not.toContain('<b>x</b>');
  });
});
