import { describe, expect, it } from 'vitest';
import {
  anteposaPoble, avatarDelPoble, comunitatsAmbCaraDelPoble, esComunitatDelPoble, filsAmbCaraDelPoble, generalDeComunitat,
  objecteDelPoble, pobleDeConfig, rutaSobreDelPoble
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

describe('avatarDelPoble (Onada 3, P2)', () => {
  const TORRE = { id: POBLE.id, avatar_url: '/assets/towns/la-torre-de-les-macanes/2.jpg', image_url: '/assets/towns/la-torre-de-les-macanes/1.jpg' };

  it('la cara de la fitxa de Pobles, amb la precedència de la targeta de /pobles', () => {
    expect(avatarDelPoble(POBLE, [{ id: 'sella', avatar_url: '/x.jpg' }, TORRE])).toBe(TORRE.avatar_url);
    expect(avatarDelPoble(POBLE, [{ id: POBLE.id, image_url: TORRE.image_url }])).toBe(TORRE.image_url);
    expect(avatarDelPoble(POBLE, [{ id: POBLE.id, imageSrc: '/assets/towns/a.jpg' }])).toBe('/assets/towns/a.jpg');
  });

  it('en remot la fitxa pot portar un UUID: també es troba per slug', () => {
    expect(avatarDelPoble(POBLE, [{ id: '44444444-4444-4444-8444-444444444444', slug: POBLE.id, avatar_url: TORRE.avatar_url }])).toBe(TORRE.avatar_url);
  });

  it('sense poble, sense fitxes o sense imatge: null, cap cara inventada', () => {
    expect(avatarDelPoble(null, [TORRE])).toBeNull();
    expect(avatarDelPoble(POBLE, undefined)).toBeNull();
    expect(avatarDelPoble(POBLE, [])).toBeNull();
    expect(avatarDelPoble(POBLE, [null, { id: 'sella', avatar_url: '/x.jpg' }])).toBeNull();
    expect(avatarDelPoble(POBLE, [{ id: POBLE.id }])).toBeNull();
  });
});

describe('la comunitat del poble amb la cara del poble (Onada 3, P2, revisió)', () => {
  const CARA = '/assets/towns/la-torre-de-les-macanes/2.jpg';
  const subjecte = { tipus: 'poble', id: 'uuid-torre', ruta: '/pobles/la-torre-de-les-macanes' };
  const torre = { id: 'c-torre', tipus: 'comunitat', subjecte, avatar_url: null };
  const avisos = { id: 'a-torre', tipus: 'canal', comunitatId: 'c-torre', subjecte, avatar_url: null };
  const general = { id: 'g-torre', tipus: 'grup', comunitatId: 'c-torre', subjecte, avatar_url: null };
  const sdp = { id: 'c-sdp', tipus: 'comunitat', subjecte: { tipus: 'entitat', id: 'sdp' }, avatar_url: null };
  const directe = { id: 'd', tipus: 'directe', avatar_url: null };

  it('com arriba del servidor (sense imatge), la comunitat del poble porta la cara; els seus fills i la resta, no', () => {
    const fils = [directe, torre, avisos, general, sdp];
    const vestits = filsAmbCaraDelPoble(fils, POBLE, CARA);
    expect(vestits.map((f) => f.avatar_url)).toEqual([null, CARA, null, null, null]);
    expect(fils[1].avatar_url).toBeNull();
    expect(vestits[0]).toBe(directe);
  });

  it('les comunitats agrupades, amb la mateixa regla sobre el seu fil', () => {
    const comunitats = [{ fil: sdp, fills: [] }, { fil: torre, fills: [avisos, general] }];
    const vestides = comunitatsAmbCaraDelPoble(comunitats, POBLE, CARA);
    expect(vestides[1].fil.avatar_url).toBe(CARA);
    expect(vestides[1].fills).toBe(comunitats[1].fills);
    expect(vestides[0]).toBe(comunitats[0]);
  });

  it('la imatge del fil, si en té, mana', () => {
    const propia = { ...torre, avatar_url: '/assets/propia.jpg' };
    const fils = [propia];
    expect(filsAmbCaraDelPoble(fils, POBLE, CARA)).toBe(fils);
    const comunitats = [{ fil: propia, fills: [] }];
    expect(comunitatsAmbCaraDelPoble(comunitats, POBLE, CARA)).toBe(comunitats);
  });

  it('sense poble, sense cara o sense la comunitat: la mateixa llista (socdepoble.org no canvia)', () => {
    const fils = [directe, torre];
    expect(filsAmbCaraDelPoble(fils, null, CARA)).toBe(fils);
    expect(filsAmbCaraDelPoble(fils, POBLE, null)).toBe(fils);
    const senseTorre = [directe, sdp];
    expect(filsAmbCaraDelPoble(senseTorre, POBLE, CARA)).toBe(senseTorre);
    const comunitats = [{ fil: torre, fills: [] }];
    expect(comunitatsAmbCaraDelPoble(comunitats, null, CARA)).toBe(comunitats);
    expect(comunitatsAmbCaraDelPoble(comunitats, POBLE, null)).toBe(comunitats);
    expect(filsAmbCaraDelPoble(undefined, POBLE, CARA)).toBeUndefined();
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
