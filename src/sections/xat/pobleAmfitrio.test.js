import { describe, expect, it } from 'vitest';
import {
  anteposaPoble, esComunitatDelPoble, generalDeComunitat, objecteDelPoble, pobleDeConfig, rutaSobreDelPoble
} from './pobleAmfitrio.js';
import { objecteDeSobre } from './XatSection.jsx';

const POBLE = { id: 'la-torre-de-les-macanes', nom: 'Gent de la Torre' };

const comunitat = (id, subjecte, fills = []) => ({ fil: { id, tipus: 'comunitat', subjecte }, fills });
const filaDe = (c) => ({ clau: `comunitat:${c.fil.id}`, tipus: 'comunitat', comunitat: c });
const filaFil = (id) => ({ clau: id, tipus: 'fil', fil: { id } });

describe('pobleDeConfig', () => {
  it('llig i torna a sanejar el poble i el nom de l\'amfitrió', () => {
    expect(pobleDeConfig({ poble: 'la-torre-de-les-macanes', nomPoble: '  Gent   de la Torre ' })).toEqual(POBLE);
    expect(pobleDeConfig({ poble: 'La-Torre-De-Les-Macanes' })).toEqual({ id: 'la-torre-de-les-macanes', nom: '' });
  });

  it('sense poble vàlid no hi ha res (socdepoble.org no canvia)', () => {
    expect(pobleDeConfig(undefined)).toBeNull();
    expect(pobleDeConfig({ nomPoble: 'Gent de la Torre' })).toBeNull();
    expect(pobleDeConfig({ poble: '../fora' })).toBeNull();
    expect(pobleDeConfig({ poble: 42 })).toBeNull();
  });
});

describe('el subjecte i la ruta del poble', () => {
  it('és el mateix objecte que llig l\'efecte ?sobre= del Xat', () => {
    const objecte = objecteDelPoble(POBLE);
    expect(objecte).toEqual({
      tipus: 'poble', id: 'la-torre-de-les-macanes', titol: 'Gent de la Torre', ruta: '/pobles/la-torre-de-les-macanes'
    });
    const url = new URL(rutaSobreDelPoble(POBLE), 'https://x.invalid');
    expect(url.pathname).toBe('/xat');
    const p = url.searchParams;
    expect(objecteDeSobre(p.get('sobre'), p.get('titol'), p.get('ruta'))).toEqual(objecte);
  });

  it('sense nom, el títol és l\'id', () => {
    expect(objecteDelPoble({ id: 'sella', nom: '' }).titol).toBe('sella');
  });
});

describe('esComunitatDelPoble i generalDeComunitat', () => {
  it('reconeix la comunitat per id (seed) o per ruta canònica (remot amb UUID)', () => {
    expect(esComunitatDelPoble(comunitat('c1', { tipus: 'poble', id: POBLE.id }), POBLE)).toBe(true);
    expect(esComunitatDelPoble(comunitat('c2', { tipus: 'poble', id: 'uuid-1', ruta: '/pobles/la-torre-de-les-macanes' }), POBLE)).toBe(true);
    expect(esComunitatDelPoble(comunitat('c3', { tipus: 'entitat', id: POBLE.id }), POBLE)).toBe(false);
    expect(esComunitatDelPoble(comunitat('c4', { tipus: 'poble', id: 'sella' }), POBLE)).toBe(false);
    expect(esComunitatDelPoble(comunitat('c5', null), POBLE)).toBe(false);
    expect(esComunitatDelPoble(comunitat('c1', { tipus: 'poble', id: POBLE.id }), null)).toBe(false);
  });

  it('el General és el grup, no el canal d\'Avisos', () => {
    const c = comunitat('c', { tipus: 'poble', id: POBLE.id }, [{ id: 'av', tipus: 'canal' }, { id: 'gen', tipus: 'grup' }]);
    expect(generalDeComunitat(c).id).toBe('gen');
    expect(generalDeComunitat(comunitat('c', null, [{ id: 'av', tipus: 'canal' }]))).toBeNull();
    expect(generalDeComunitat(null)).toBeNull();
  });
});

describe('anteposaPoble', () => {
  const sdp = comunitat('sdp', { tipus: 'entitat', id: 'sdp' });
  const torre = comunitat('torre', { tipus: 'poble', id: POBLE.id });
  const files = [filaDe(sdp), filaFil('a'), filaDe(torre), filaFil('b')];

  it('sense poble, la llista no canvia (la mateixa referència)', () => {
    expect(anteposaPoble(files, { poble: null, comunitats: [sdp, torre] })).toBe(files);
  });

  it('la comunitat del poble puja la primera, marcada', () => {
    const resultat = anteposaPoble(files, { poble: POBLE, comunitats: [sdp, torre] });
    expect(resultat.map((f) => f.clau)).toEqual(['comunitat:torre', 'comunitat:sdp', 'a', 'b']);
    expect(resultat[0].delPoble).toBe(true);
    expect(files[2].delPoble).toBeUndefined();
  });

  it('sense comunitat, una fila virtual al capdamunt', () => {
    const resultat = anteposaPoble(files.filter((f) => f.clau !== 'comunitat:torre'), { poble: POBLE, comunitats: [sdp] });
    expect(resultat[0]).toEqual({ clau: `poble:${POBLE.id}`, tipus: 'poble', poble: POBLE, delPoble: true });
    expect(resultat).toHaveLength(4);
  });

  it('sense fila virtual, si així es demana (selecció de xats)', () => {
    const sense = files.filter((f) => f.clau !== 'comunitat:torre');
    expect(anteposaPoble(sense, { poble: POBLE, comunitats: [sdp], virtual: false })).toBe(sense);
  });

  it('una comunitat del poble arxivada (fora de files) no inventa cap fila', () => {
    const sense = [filaDe(sdp), filaFil('a')];
    expect(anteposaPoble(sense, { poble: POBLE, comunitats: [sdp, torre] })).toBe(sense);
  });
});
