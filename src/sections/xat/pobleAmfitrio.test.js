import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { MOCK_TOWNS } from '../pobles/townsSeed.js';
import {
  POBLE_PER_DEFECTE, anteposaPoble, avatarDelPoble, comunitatsAmbCaraDelPoble, esComunitatDelPoble, filsAmbCaraDelPoble, generalDeComunitat,
  objecteDelPoble, pobleDeConfig, rutaSobreDelPoble
} from './pobleAmfitrio.js';
import { objecteDeSobre } from './XatSection.jsx';

const POBLE = { id: 'la-torre-de-les-macanes', nom: 'Gent de la Torre' };
const SELLA = { id: 'sella', nom: 'Gent de Sella' };

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

  /* Onada 6 (pla 261009_0245, ítem 4) · Amb les fitxes i sense nomPoble, el
     nom de la gent de la fitxa (author, o nomDeLaGent del seu nom). */
  it('Onada 6 · amb les fitxes i sense nomPoble declarat, el nom de la gent de la fitxa', () => {
    const towns = [{ id: 'sella', title: 'Sella', author: 'Gent de Sella' }, { id: 'el-campello', title: 'El Campello' }];
    expect(objecteDelPoble({ id: 'sella', nom: '' }, towns).titol).toBe('Gent de Sella');
    expect(objecteDelPoble({ id: 'el-campello', nom: '' }, towns).titol).toBe('Gent del Campello');
    expect(new URL(rutaSobreDelPoble({ id: 'sella', nom: '' }, towns), 'https://x.invalid').searchParams.get('titol')).toBe('Gent de Sella');
    // El nom declarat per l'amfitrió mana; un poble que no és a les fitxes, l'id.
    expect(objecteDelPoble(POBLE, towns).titol).toBe('Gent de la Torre');
    expect(objecteDelPoble({ id: 'enlloc', nom: '' }, towns).titol).toBe('enlloc');
  });
});

describe('avatarDelPoble (Onada 3, P2)', () => {
  const TORRE = { id: POBLE.id, avatar_url: '/assets/towns/la-torre-de-les-macanes/2.jpg', image_url: '/assets/towns/la-torre-de-les-macanes/1.jpg' };

  it('la cara de la fitxa de Pobles, amb la precedència de la targeta de /pobles', () => {
    expect(avatarDelPoble(POBLE, [{ id: 'sella', avatar_url: '/x.jpg' }, TORRE])).toBe(TORRE.avatar_url);
    /* P1-70 (261029) · La precedència image_url / imageSrc es prova amb un
       poble que no és la Torre: la Torre sense avatar_url porta la seua foto
       de la llavor (prova de baix). */
    expect(avatarDelPoble(SELLA, [{ id: SELLA.id, image_url: '/assets/towns/sella/1.jpg' }])).toBe('/assets/towns/sella/1.jpg');
    expect(avatarDelPoble(SELLA, [{ id: SELLA.id, imageSrc: '/assets/towns/a.jpg' }])).toBe('/assets/towns/a.jpg');
  });

  it('en remot la fitxa pot portar un UUID: també es troba per slug', () => {
    expect(avatarDelPoble(POBLE, [{ id: '44444444-4444-4444-8444-444444444444', slug: POBLE.id, avatar_url: TORRE.avatar_url }])).toBe(TORRE.avatar_url);
  });

  /* P1-70 (261029) · Derogat per a la Torre (prova de baix); per als altres pobles, igual. */
  it('sense poble, o un altre poble sense fitxa o sense imatge: null, cap cara inventada', () => {
    expect(avatarDelPoble(null, [TORRE])).toBeNull();
    expect(avatarDelPoble(SELLA, undefined)).toBeNull();
    expect(avatarDelPoble(SELLA, [])).toBeNull();
    expect(avatarDelPoble(SELLA, [null, { id: 'altea', avatar_url: '/x.jpg' }])).toBeNull();
    expect(avatarDelPoble(SELLA, [{ id: SELLA.id }])).toBeNull();
  });

  /* P1-70 (ordre del Mestre, 261029 18:20) · «Gent de la Torre», mai «GD»: la
     foto de la llavor (townsSeed.js) quan el node no en dona cap avatar_url. */
  it('P1-70 · la Torre sense fitxa, sense fitxes o sense avatar_url porta la seua foto de la llavor; la fitxa del node mana', () => {
    expect(POBLE_PER_DEFECTE.avatar).toBe('/assets/towns/la-torre-de-les-macanes/2.jpg');
    expect(POBLE_PER_DEFECTE.avatar).toBe(MOCK_TOWNS.find((town) => town.id === POBLE.id).avatar_url);
    expect(existsSync(path.join(process.cwd(), 'public', POBLE_PER_DEFECTE.avatar))).toBe(true);
    expect(existsSync(path.join(process.cwd(), 'public', POBLE_PER_DEFECTE.avatar.replace(/\.jpg$/, '.webp')))).toBe(true);
    for (const towns of [undefined, [], [null], [{ id: POBLE.id }], [{ id: POBLE.id, image_url: TORRE.image_url }]]) {
      expect(avatarDelPoble(POBLE, towns)).toBe(POBLE_PER_DEFECTE.avatar);
    }
    expect(avatarDelPoble({ id: POBLE.id, nom: '' }, [])).toBe(POBLE_PER_DEFECTE.avatar);
    expect(avatarDelPoble(POBLE, [{ id: POBLE.id, avatar_url: '/assets/towns/la-torre-de-les-macanes/2.webp' }])).toBe('/assets/towns/la-torre-de-les-macanes/2.webp');
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
