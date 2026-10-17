/* Onada 0.3 (Gauntlet 261016, M06) · Les files del panell del visor
   (panellDeLaFoto.js): les metadades completes, parcials i privades; el que
   no se sap, «Desconegut», mai inventat; mentre es llig l'EXIF, «Llegint…». */
import { describe, expect, test } from 'vitest';
import { COPYRIGHT_SDP, COPYRIGHT_VIQUIPEDIA } from '../../components/universal/editorial.js';
import { objecteDe, rutaConnectarObjecte, rutaXatDePagina } from '../../config/navigation.js';
import { autorDeclarat, filesDelPanell, formataCamera, formataDataHora, formataGps, formataResolucio, pobleDe } from './panellDeLaFoto.js';
import { destiDeMultimedia } from './rutesMultimedia.js';
import { LEGACY_MEDIA } from './legacyMedia.js';
import { fotosDeLAgenda, fotosDelMercat, fotosDelMur } from './mediaContent.js';

const valors = (files) => Object.fromEntries(files.map((fila) => [fila.clau, fila.valor]));
const rutes = (files) => Object.fromEntries(files.filter((fila) => fila.ruta).map((fila) => [fila.clau, fila.ruta]));

const EXIF = {
  dataCaptura: '2017-05-14T10:22:33+02:00',
  gps: { lat: 38.5919, lng: -0.4184, altitud: 456.7 },
  camera: { marca: 'Canon', model: 'Canon EOS 5D' },
  autor: 'Pepa Garcia',
  copyright: '(c) Pepa Garcia'
};

/* Revisió adversarial del 261016 · Darrere de «Publicat a», Comentar i
   Connectar: els enllaços de la pàgina /multimedia/<id> d'abans del visor. */
const ACCIONS = { comentar: 'Obrir el xat de la foto', connectar: 'Connectar la foto' };

describe('filesDelPanell', () => {
  test('completes: data i hora (amb els segons), GPS, càmera, resolució, autor, poble, drets, origen, l’article, Comentar i Connectar', () => {
    const item = { id: 'feed-p1', title: 'Fira', src: '/assets/fira.jpg', tag: 'Mur', source: 'Ajuntament', article: { sectionId: 'mur', id: 'p1' } };
    const files = filesDelPanell(item, { exif: EXIF, estatExif: 'llest', mides: { amplada: 4032, alcada: 3024 }, estatMides: 'llest' });
    expect(files.map((fila) => fila.clau)).toEqual(['data', 'gps', 'camera', 'resolucio', 'autor', 'poble', 'drets', 'origen', 'publicat', 'comentar', 'connectar']);
    expect(valors(files)).toEqual({
      data: '14/05/2017 10:22:33', gps: '38.59190, -0.41840 · 456,7 m', camera: 'Canon EOS 5D', resolucio: '4032 × 3024 px', autor: 'Pepa Garcia',
      poble: 'Desconegut', drets: '(c) Pepa Garcia', origen: 'Fotografia', publicat: 'Mur · Fira', ...ACCIONS
    });
    const objecte = objecteDe(item, 'multimedia');
    expect(rutes(files)).toEqual({ publicat: '/mur/p1', comentar: rutaXatDePagina(objecte), connectar: rutaConnectarObjecte(objecte) });
    /* El fil de xat de la foto és el de sempre (multimedia:<id>), i Connectar s'emporta l'objecte. */
    expect(rutes(files).comentar).toMatch(/^\/xat\?sobre=multimedia:feed-p1&titol=Fira(?:&|$)/);
    expect(new URLSearchParams(rutes(files).connectar.split('?')[1]).get('objecte')).toBe('multimedia');
    expect(new URLSearchParams(rutes(files).connectar.split('?')[1]).get('item_id')).toBe('feed-p1');
  });

  test('parcials: sense EXIF, «Desconegut», mai inventat; l’autor és qui signa; una il·lustració porta els drets de Sóc de Poble', () => {
    const item = { id: 'nano-mur', title: 'Mur', src: '/assets/nano_cards/mur_nano_card.jpg', tag: 'Arxiu', source: 'Nano Banana', origen: 'ia' };
    expect(valors(filesDelPanell(item, { estatExif: 'sense' }))).toEqual({
      data: 'Desconegut', gps: 'Desconegut', camera: 'Desconegut', resolucio: 'Desconegut', autor: 'Nano Banana', poble: 'Desconegut',
      drets: COPYRIGHT_SDP, origen: 'Il·lustració d’IA', publicat: 'Cap article: és de l’arxiu', ...ACCIONS
    });
  });

  test('sense id, ni Comentar ni Connectar: no hi ha cap objecte a qui obrir el xat', () => {
    expect(filesDelPanell({ src: '/x.jpg' }).map((fila) => fila.clau)).toEqual(['data', 'gps', 'camera', 'resolucio', 'autor', 'poble', 'drets', 'origen', 'publicat']);
  });

  /* Gauntlet 261017 (C05 de Codex: «la resolució coneguda no s'ha d'ocultar
     perquè falte EXIF») · Les mides reals de la foto pintada, a part de
     l'EXIF: sense EXIF, la resolució continua; mentre carrega, «Llegint…»;
     si no carrega, «Desconegut». */
  test('la resolució, darrere de la càmera: les mides de la foto pintada, sense dependre de l’EXIF', () => {
    const item = { id: 'x', src: '/x.jpg' };
    const resolucio = (opcions) => filesDelPanell(item, opcions).find((fila) => fila.clau === 'resolucio');
    expect(resolucio({ estatExif: 'sense', mides: { amplada: 1200, alcada: 800 }, estatMides: 'llest' }))
      .toEqual({ clau: 'resolucio', etiqueta: 'Resolució', valor: '1200 × 800 px' });
    expect(resolucio({ estatExif: 'llegint', mides: { amplada: 1200, alcada: 800 }, estatMides: 'llest' }).valor).toBe('1200 × 800 px');
    expect(resolucio({ estatExif: 'llest', estatMides: 'llegint' }).valor).toBe('Llegint…');
    expect(resolucio({ estatExif: 'llegint', estatMides: 'sense' }).valor).toBe('Desconegut');
    expect(resolucio({ mides: { amplada: 0, alcada: 800 }, estatMides: 'llest' }).valor).toBe('Desconegut');
    const traduida = resolucio({ mides: { amplada: 2, alcada: 1 }, estatMides: 'llest', t: (clau, reserva) => (clau === 'section.multimedia.visor.resolucio' ? 'Resolution' : reserva) });
    expect([traduida.etiqueta, traduida.valor]).toEqual(['Resolution', '2 × 1 px']);
  });

  /* Gauntlet 261017 (C04) · El poble d'una publicació ve pel nom: sense slug
     del cens, el nom tal qual i sense enllaç; amb, el del cens mana. */
  test('el poble pel nom d’una publicació: el nom, sense enllaç; el slug, si el porta, mana', () => {
    const perNom = filesDelPanell({ src: '/x.jpg', nomPoble: ' La Torre de les Maçanes ' });
    expect(valors(perNom).poble).toBe('La Torre de les Maçanes');
    expect(rutes(perNom).poble).toBeUndefined();
    const ambSlug = filesDelPanell({ src: '/x.jpg', nomPoble: 'Torre', poble: 'tibi' }, { nomDelPoble: () => 'Tibi' });
    expect([valors(ambSlug).poble, rutes(ambSlug).poble]).toEqual(['Tibi', '/pobles/tibi']);
    expect(valors(filesDelPanell({ src: '/x.jpg', nomPoble: '  ' })).poble).toBe('Desconegut');
  });

  /* Revisió adversarial del 261016 (M06: «mostrar desconegut sense inventar
     informació») · Cap reserva inventada a l'Autor: ni «Soc de Poble» per a
     una foto derivada sense autor, ni «Fotògraf Sóc de Poble» per a la foto
     de la persona pilot. */
  test('l’autor: el de l’EXIF; si no, el declarat; si ningú no el declara, «Desconegut»', () => {
    const autor = (item, opcions) => valors(filesDelPanell(item, { estatExif: 'sense', ...opcions })).autor;
    const [delMur] = fotosDelMur([{ id: 'p', title: 'Fira', image_url: '/assets/fira.jpg' }]);
    const [delMercat] = fotosDelMercat([{ id: 'oli', title: 'Oli', images: ['/assets/oli.jpg'] }]);
    const [delAgenda] = fotosDeLAgenda([{ id: 'aplec', title: 'Aplec', image_url: '/assets/cartell.jpg' }]);
    for (const item of [delMur, delMercat, delAgenda]) {
      expect(item, item.id).not.toHaveProperty('source');
      expect(autor(item), item.id).toBe('Desconegut');
    }
    const fotoJavi = LEGACY_MEDIA.find((item) => item.id === 'foto-javi');
    expect(autorDeclarat(fotoJavi)).toBeNull();
    expect(autor(fotoJavi)).toBe('Desconegut');
    expect(autor(fotoJavi, { exif: { autor: 'Pepa Garcia' }, estatExif: 'llest' })).toBe('Pepa Garcia');
    expect(autor(fotosDelMur([{ id: 'p', image_url: '/assets/fira.jpg', author: 'Ajuntament de Tibi' }])[0])).toBe('Ajuntament de Tibi');
    expect([autorDeclarat({ source: '  ' }), autorDeclarat({ autor: ' Pepa ', source: 'Arxiu' }), autorDeclarat({ tag: 'Poble', source: 'Tibi' }), autorDeclarat(null)])
      .toEqual([null, 'Pepa', null, null]);
  });

  test('mentre es llig l’EXIF: «Llegint…» als camps que en depenen', () => {
    const v = valors(filesDelPanell({ id: 'x', src: '/x.jpg' }, { estatExif: 'llegint' }));
    expect([v.data, v.gps, v.camera, v.autor]).toEqual(['Llegint…', 'Llegint…', 'Llegint…', 'Llegint…']);
    expect(v.drets).toBe('No declarats');
  });

  test('privades: la foto d’una persona no diu on es va fer', () => {
    const v = valors(filesDelPanell({ id: 'foto-javi', src: '/assets/fotos/javi-llinares-perfil-1200px.jpg', origen: 'foto' }, { exif: EXIF, estatExif: 'llest', persona: true }));
    expect(v.gps).toBe('No es mostren en la foto d’una persona');
    expect(v.drets).toBe('(c) Pepa Garcia');
  });

  test('un poble: el seu nom amb l’enllaç a la pàgina canònica, i els drets de la Viquipèdia; l’autor no és el nom del poble', () => {
    const item = { id: 'town-tibi', title: 'Tibi', src: '/assets/towns/tibi/1.jpg', tag: 'Poble', source: 'Tibi', article: { sectionId: 'pobles', id: 'tibi' } };
    const files = filesDelPanell(item, { estatExif: 'sense', nomDelPoble: (slug) => (slug === 'tibi' ? 'Tibi' : null) });
    expect(valors(files)).toMatchObject({ poble: 'Tibi', drets: COPYRIGHT_VIQUIPEDIA, autor: 'Desconegut', publicat: 'Pobles · Tibi' });
    const deLaFoto = objecteDe(item, 'multimedia');
    expect(rutes(files)).toEqual({ poble: '/pobles/tibi', publicat: '/pobles/tibi', comentar: rutaXatDePagina(deLaFoto), connectar: rutaConnectarObjecte(deLaFoto) });
    /* Una foto del cens d'un poble: el slug, el nom si el proveïdor el sap. */
    const fotoDelCens = { id: 'cens-x', title: 'La Torre', src: '/assets/uploads/poble/la-torre-de-les-macanes/DSC00320.JPG', poble: 'la-torre-de-les-macanes' };
    const delCens = filesDelPanell(fotoDelCens, { nomDelPoble: () => 'La Torre de les Maçanes' });
    expect(valors(delCens)).toMatchObject({ poble: 'La Torre de les Maçanes', drets: 'No declarats', origen: 'Fotografia' });
    const delCensObjecte = objecteDe(fotoDelCens, 'multimedia');
    expect(rutes(delCens)).toEqual({ poble: '/pobles/la-torre-de-les-macanes', comentar: rutaXatDePagina(delCensObjecte), connectar: rutaConnectarObjecte(delCensObjecte) });
  });

  test('la data i el GPS de la pujada (ADR D6) manen sobre l’EXIF; els textos passen pel traductor', () => {
    const item = { id: 'p', src: '/x.jpg', dataCaptura: '2020-01-02T03:04:05', geolocalitzacio: { lat: 38.6, lng: -0.4, precisio_m: 100 } };
    const v = valors(filesDelPanell(item, { exif: EXIF, estatExif: 'llest', t: (clau, reserva) => (clau === 'section.multimedia.visor.dretsNoDeclarats' ? 'Not declared' : reserva) }));
    expect([v.data, v.gps]).toEqual(['02/01/2020 03:04:05', '38.60000, -0.40000']);
    expect(filesDelPanell(null)).toEqual([]);
  });
});

describe('els formats', () => {
  /* Revisió adversarial del 261016 · «Data i hora exactes» (pla 261016_1530):
     abans es tallaven els segons de DateTimeOriginal. */
  test('la data i l’hora del text tal qual, amb els segons i sense zona; la càmera sense repetir la marca; el GPS amb cinc decimals', () => {
    expect([formataDataHora('2017-05-14T10:22:33+02:00'), formataDataHora('2017-05-14 10:22:33'), formataDataHora('2017-05-14T10:22'), formataDataHora('2017-05-14'), formataDataHora('ahir'), formataDataHora(null)])
      .toEqual(['14/05/2017 10:22:33', '14/05/2017 10:22:33', '14/05/2017 10:22', '14/05/2017', null, null]);
    expect([formataCamera({ marca: 'Canon', model: 'Canon EOS 5D' }), formataCamera({ marca: 'SONY', model: 'DSC-RX100' }), formataCamera({ marca: null, model: 'X' }), formataCamera(null)])
      .toEqual(['Canon EOS 5D', 'SONY DSC-RX100', 'X', null]);
    expect([formataGps({ lat: 1, lng: 2, altitud: null }), formataGps({ lat: 'x', lng: 2 }), formataGps(null)]).toEqual(['1.00000, 2.00000', null, null]);
  });

  test('formataResolucio: enters positius, «amplada × alçada px»; la resta, null (mai inventada)', () => {
    expect(formataResolucio({ amplada: 4032, alcada: 3024 })).toBe('4032 × 3024 px');
    expect(formataResolucio({ amplada: '640', alcada: '480' })).toBe('640 × 480 px');
    for (const mides of [null, undefined, {}, { amplada: 0, alcada: 10 }, { amplada: 10, alcada: -1 }, { amplada: Number.NaN, alcada: 10 }, { amplada: 10.5, alcada: 10 }, { amplada: Infinity, alcada: 10 }]) {
      expect(formataResolucio(mides), JSON.stringify(mides)).toBeNull();
    }
  });

  test('pobleDe: el del cens o el de l’article d’un poble', () => {
    expect([pobleDe({ poble: 'tibi' }), pobleDe({ article: { sectionId: 'pobles', id: 'sella' } }), pobleDe({ article: { sectionId: 'mur', id: 'p' } })]).toEqual(['tibi', 'sella', null]);
  });
});

describe('destiDeMultimedia (rutesMultimedia.js)', () => {
  test('town-<slug> a /pobles/<slug> amb la consulta; la resta, a l’Arxiu amb el visor obert', () => {
    expect(destiDeMultimedia('town-benifallim')).toBe('/pobles/benifallim');
    expect(destiDeMultimedia('town-la-torre-de-les-macanes', '?a=1&b=dos')).toBe('/pobles/la-torre-de-les-macanes?a=1&b=dos');
    expect(destiDeMultimedia('nano-mur')).toBe('/multimedia?foto=nano-mur');
    expect(destiDeMultimedia('market-mac-mini-m4', '?x=1')).toBe('/multimedia?x=1&foto=market-mac-mini-m4');
    expect(destiDeMultimedia('foto amb espai & coses')).toBe('/multimedia?foto=foto+amb+espai+%26+coses');
    expect(destiDeMultimedia('town-')).toBe('/multimedia?foto=town-');
    expect([destiDeMultimedia(''), destiDeMultimedia(null)]).toEqual([null, null]);
  });
});
