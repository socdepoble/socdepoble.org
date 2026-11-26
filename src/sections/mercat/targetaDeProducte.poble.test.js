/**
 * R22 (Llibre Mestre, «4a Etiqueta Geogràfica Final») · Les etiquetes d'una
 * targeta del Mercat es lligen d'esquerra a dreta: Mercat → categoria curta →
 * subfamília humana → poble, i el poble va SEMPRE l'últim i porta a
 * /pobles/<slug>, no al perfil de qui ven. El text és el nom curt si la fitxa
 * del poble porta etiqueta_curta_poble o, sense, el nom oficial. Hui cap fitxa
 * real no el porta ni el pot posar ningú: «La Torre» només ix de les dades
 * sintètiques d'estes proves.
 */
import { describe, expect, test } from 'vitest';
import { propsDeTargetaDeProducte } from './targetaDeProducte.js';

const TORRE = { id: 'la-torre-de-les-macanes', title: 'La Torre de les Maçanes', etiqueta_curta_poble: 'La Torre' };
const OLI = {
  id: 'oli-sintetic', type: 'product', title: 'Oli sintètic', category_slug: 'alimentacio', tag: 'oli-verge-extra',
  author_name: 'Venedora sintètica', author_role: 'business', author_entity_id: 'almassera-sintetica',
  poble_id: 'la-torre-de-les-macanes'
};
const textos = (props) => props.labels.map((l) => l.text);

describe('propsDeTargetaDeProducte · la pastilla del poble', () => {
  test('ordre canònic amb Mur+Mercat, amb el nom curt al final i enllaçat a la pàgina del poble', () => {
    const props = propsDeTargetaDeProducte(OLI, undefined, { towns: [TORRE] });
    expect(textos(props)).toEqual(['Mur', 'Mercat', 'Alimentació', 'Oli Verge Extra', 'La Torre']);
    expect(props.labels.at(-1)).toEqual({ text: 'La Torre', href: '/pobles/la-torre-de-les-macanes', className: 'sdp-badge-tag sp-card-label--enllac' });
    expect(props.authorHref).toBeTruthy();
    expect(props.authorHref.startsWith('/pobles')).toBe(false);
  });

  test('sense nom curt (null, buit o només espais), el nom oficial de la fitxa', () => {
    for (const etiqueta_curta_poble of [null, undefined, '', '   ', 7, 'x'.repeat(61)]) {
      const props = propsDeTargetaDeProducte(OLI, undefined, { towns: [{ ...TORRE, etiqueta_curta_poble }] });
      expect(props.labels.at(-1).text).toBe('La Torre de les Maçanes');
    }
  });

  test('també casa pel lloc de qui publica quan no declara poble_id', () => {
    const props = propsDeTargetaDeProducte({ ...OLI, poble_id: undefined, population: 'La Torre de les Maçanes' }, undefined, { towns: [TORRE] });
    expect(props.labels.at(-1).href).toBe('/pobles/la-torre-de-les-macanes');
  });

  test('amb variants, la categoria va després dels dos sistemes i el recompte va just davant del poble', () => {
    const variacions = [{ id: 'a' }, { id: 'b' }];
    const props = propsDeTargetaDeProducte({ ...OLI, variations: variacions }, undefined, { towns: [TORRE] });
    expect(textos(props)).toEqual(['Mur', 'Mercat', 'Alimentació', 'Oli Verge Extra', '2 variants', 'La Torre']);
    expect(textos(propsDeTargetaDeProducte({ ...OLI, variations: variacions }))).toEqual(['Mur', 'Mercat', 'Alimentació', 'Oli Verge Extra', '2 variants']);
  });

  test('sense fitxes, sense fitxa que hi case o amb un slug que no és canònic: cap pastilla de poble i les altres intactes', () => {
    const esperat = ['Mur', 'Mercat', 'Alimentació', 'Oli Verge Extra'];
    expect(textos(propsDeTargetaDeProducte(OLI))).toEqual(esperat);
    expect(textos(propsDeTargetaDeProducte(OLI, undefined, { towns: [] }))).toEqual(esperat);
    expect(textos(propsDeTargetaDeProducte(OLI, undefined, { towns: [{ id: 'penaguila', title: 'Penàguila' }] }))).toEqual(esperat);
    expect(textos(propsDeTargetaDeProducte(OLI, undefined, { towns: [{ ...TORRE, id: 'La Torre!', title: 'La Torre de les Maçanes' }] }))).toEqual(esperat);
    expect(textos(propsDeTargetaDeProducte({ ...OLI, poble_id: undefined }, undefined, { towns: [TORRE] }))).toEqual(esperat);
  });

  test('el text no ve mai del payload de la publicació', () => {
    const props = propsDeTargetaDeProducte({ ...OLI, town: { slug: 'la-torre-de-les-macanes', name: 'Falsa', etiqueta_curta_poble: 'Falsa' } }, undefined, { towns: [TORRE] });
    expect(props.labels.at(-1).text).toBe('La Torre');
  });
});
