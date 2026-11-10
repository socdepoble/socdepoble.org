// @vitest-environment node
/* PRIVADESA-01 (R15b) · El text d'una referència a l'Herbari, al Banc de llavors o a Què dinem? ve de la fitxa
   canònica pel seu id, mai de la fila; la fila que no casa no es pinta. El text canònic és el mateix que el catàleg
   pinta i publica (paritat amb modelHerbariWorkspace i els models de BancLlavors i Receptes). */
import { describe, expect, test } from 'vitest';
import { ambTextCanonic, carregaFitxesCanoniques, fitxesCanoniquesCarregades, fontsCanoniquesPendents, objecteDeProjeccioCataleg } from './fitxesCanoniquesCataleg.js';
import { projeccioCatalegDe } from './projeccionsCataleg.js';
import { objectiuDeTargeta } from '../config/moderacio.js';
import { ESPECIES_HERBARI_LA_TORRE_117 } from './patrimoni/herbariLaTorre117.js';
import { FONTS_BANC_LLAVORS, entradesDelCataleg } from './patrimoni/bancLlavors.js';
import { RECEPTES_QUE_DINEM } from './patrimoni/queDinem.js';
import { modelHerbariWorkspace } from '../sections/patrimoni/modelHerbariWorkspace.js';
import { textosHerbari } from '../sections/patrimoni/textosHerbari.js';

const ALTRA = '6a7b8c9d-0e1f-4a2b-8c3d-4e5f6a7b8c9d', JO = '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5';
const fila = (font, id, extra = {}) => ({ id: '0f1e2d3c-4b5a-4968-8776-655443322110', ownerUserId: ALTRA, sectionId: 'mur',
  title: 'TEXT OFENSIU', subtitle: 'subtítol fals', entradilla: 'entradilla falsa', description: 'entradilla falsa', author_name: 'TEXT OFENSIU',
  projeccioCataleg: { v: 1, font, id, destins: ['mur'], audiencia: 'publica' }, ...extra });

describe('les fonts canòniques', () => {
  test('mentre la font no s’ha carregat, la referència no es pinta (mai el text de la fila)', () => {
    const item = fila('receptes', RECEPTES_QUE_DINEM[0].slug);
    if (!fitxesCanoniquesCarregades('receptes')) expect(ambTextCanonic(item, 'ca')).toBeNull();
    expect(fontsCanoniquesPendents([item, fila('nevera', 'oli')], 'ca')).toEqual(fitxesCanoniquesCarregades('receptes') ? [] : ['receptes']);
  });

  test('una fila amb text fals d’una font canònica es pinta amb el text canònic; la que no casa, no es pinta', async () => {
    await Promise.all(['herbari', 'llavors', 'receptes'].map(font => carregaFitxesCanoniques(font, 'ca')));
    const especie = ESPECIES_HERBARI_LA_TORRE_117[0];
    const herbari = projeccioCatalegDe(ambTextCanonic(fila('herbari', especie.id), 'ca'));
    expect(herbari.font).toMatchObject({ title: especie.nomValencia, subtitle: especie.nomCientific });
    expect([herbari.font.title, herbari.font.subtitle, herbari.font.lead].join(' ')).not.toMatch(/OFENSIU|fals/);
    const font = FONTS_BANC_LLAVORS[0], entrada = entradesDelCataleg(font.id)[0];
    expect(projeccioCatalegDe(ambTextCanonic(fila('llavors', entrada.id), 'ca')).font)
      .toEqual({ font: 'llavors', id: entrada.id, title: entrada.nom, subtitle: entrada.nomCientific || '', lead: font.autoria });
    const recepta = RECEPTES_QUE_DINEM[0];
    expect(projeccioCatalegDe(ambTextCanonic(fila('receptes', recepta.slug), 'ca')).font)
      .toEqual({ font: 'receptes', id: recepta.slug, title: recepta.titol, subtitle: '', lead: '' });
    for (const font of ['herbari', 'llavors', 'receptes']) expect(ambTextCanonic(fila(font, 'x'), 'ca')).toBeNull();
    expect(ambTextCanonic({ id: 'sense-marca', title: 'x' }, 'ca')).toBeNull();
  });

  test('les fonts de la persona (Rebost, Bar) no tenen fitxa al codi: passen tal qual', () => {
    const item = fila('nevera', 'oli-de-la-cooperativa');
    expect(ambTextCanonic(item, 'ca')).toBe(item);
  });

  test('paritat: el text canònic és el que el catàleg publica (capturaFontCataleg de cada model)', async () => {
    for (const llengua of ['ca', 'es', 'en', 'eu', 'gl']) {
      await carregaFitxesCanoniques('herbari', llengua);
      const model = modelHerbariWorkspace(textosHerbari(llengua));
      for (const item of model.items) {
        expect(fitxesCanoniquesCarregades('herbari', llengua).get(item.id), `${llengua} ${item.id}`)
          .toEqual({ title: item.title, subtitle: item.subtitle || '', lead: item.lead || '' });
      }
    }
    await carregaFitxesCanoniques('llavors');
    for (const font of FONTS_BANC_LLAVORS) {
      for (const entrada of entradesDelCataleg(font.id)) {
        expect(fitxesCanoniquesCarregades('llavors').get(entrada.id))
          .toEqual({ title: entrada.nom, subtitle: entrada.nomCientific || '', lead: font.autoria || '' });
      }
    }
    await carregaFitxesCanoniques('receptes');
    expect(fitxesCanoniquesCarregades('receptes').size).toBe(RECEPTES_QUE_DINEM.length);
  });
});

describe('la via de denúncia i bloqueig', () => {
  test('una referència d’altri porta l’objecte del Mur, amb un nom neutre i mai el títol de la fila', () => {
    const objecte = objecteDeProjeccioCataleg(fila('nevera', 'oli'), JO, 'qui ha publicat esta referència');
    expect(objecte).toMatchObject({ tipus: 'publicacio', id: '0f1e2d3c-4b5a-4968-8776-655443322110', seccio: 'mur',
      autor: { tipus: 'persona', id: ALTRA, nom: 'qui ha publicat esta referència' } });
    expect(objectiuDeTargeta(objecte)).toMatchObject({ tipus: 'publicacio', bloquejable: true, autor: { tipus: 'persona', id: ALTRA } });
  });

  test('ni la pròpia, ni la local pendent, ni una fila que no és cap referència', () => {
    expect(objecteDeProjeccioCataleg(fila('nevera', 'oli', { ownerUserId: JO }), JO.toUpperCase(), 'x')).toBeUndefined();
    expect(objecteDeProjeccioCataleg(fila('nevera', 'oli', { _projeccioLocal: true }), null, 'x')).toBeUndefined();
    expect(objecteDeProjeccioCataleg({ id: 'p1', ownerUserId: ALTRA }, JO, 'x')).toBeUndefined();
  });

  test('sense sessió, totes les referències són d’altri (es poden denunciar)', () => {
    expect(objecteDeProjeccioCataleg(fila('nevera', 'oli'), null, 'x')?.autor?.id).toBe(ALTRA);
  });
});
