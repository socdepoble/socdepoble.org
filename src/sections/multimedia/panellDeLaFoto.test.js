/* Onada 0.3 (Gauntlet 261016, M06) · Les files del panell del visor
   (panellDeLaFoto.js): les metadades completes, parcials i privades; el que
   no se sap, «Desconegut», mai inventat; mentre es llig l'EXIF, «Llegint…». */
import { describe, expect, test, vi } from 'vitest';
import { COPYRIGHT_SDP, COPYRIGHT_VIQUIPEDIA } from '../../components/universal/editorial.js';
import { objecteDe, rutaConnectarObjecte, rutaXatDePagina } from '../../config/navigation.js';
import { fixaBaseRecursos, fixaPoliticaDeMitjans, resolRecursPropi, resolRecursosDeHtml } from '../../config/assetResolver.js';
import { autorDeclarat, enllacPublicDe, filesDelPanell, formataCamera, formataDataHora, formataGps, formataResolucio, pobleDe } from './panellDeLaFoto.js';
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
/* Ordre del Mestre (30-10-2026, B3) · Sense origen de la pàgina, o sense cap URL pública, la fila ho diu. */
const SENSE_ENLLAC = 'No té cap enllaç públic d’este lloc';

describe('filesDelPanell', () => {
  test('completes: data i hora (amb els segons), GPS, càmera, resolució, autor, poble, drets, origen, l’article, Comentar i Connectar', () => {
    const item = { id: 'feed-p1', title: 'Fira', src: '/assets/fira.jpg', tag: 'Mur', source: 'Ajuntament', article: { sectionId: 'mur', id: 'p1' } };
    const files = filesDelPanell(item, {
      exif: EXIF, estatExif: 'llest', mides: { amplada: 4032, alcada: 3024 }, estatMides: 'llest', origenPagina: 'https://socdepoble.org'
    });
    expect(files.map((fila) => fila.clau)).toEqual(['data', 'gps', 'camera', 'resolucio', 'autor', 'poble', 'drets', 'origen', 'publicat', 'enllac', 'comentar', 'connectar']);
    expect(valors(files)).toEqual({
      data: '14/05/2017 10:22:33', gps: '38.59190, -0.41840 · 456,7 m', camera: 'Canon EOS 5D', resolucio: '4032 × 3024 px', autor: 'Pepa Garcia',
      poble: 'Desconegut', drets: '(c) Pepa Garcia', origen: 'Fotografia', publicat: 'Mur · Fira', enllac: 'https://socdepoble.org/assets/fira.jpg', ...ACCIONS
    });
    /* B3 · La fila de l'enllaç porta la URL per a copiar-la, i no és cap ruta interna. */
    expect(files.find((fila) => fila.clau === 'enllac')).toEqual({
      clau: 'enllac', etiqueta: 'Enllaç de la imatge', valor: 'https://socdepoble.org/assets/fira.jpg', enllac: 'https://socdepoble.org/assets/fira.jpg'
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

  /* Gauntlet 261030 (f4b, B3-FITXA-FALS) · La fila «Enllaç de la imatge» és
     del visor, que passa l'origen de la pàgina. Sense (la fitxa ?item= de
     /multimedia), no se sap si n'hi ha cap: la fila no hi és, i mai diu «No
     té cap enllaç públic d’este lloc» d'una foto pública de /assets/. */
  test('sense origen de la pàgina, la fila de l’enllaç no hi és (no es diu que no n’hi ha cap)', () => {
    const publica = { id: 'nano-mur', title: 'Mur', src: '/assets/nano_cards/mur_nano_card.jpg', tag: 'Arxiu', source: 'Nano Banana', origen: 'ia' };
    for (const opcions of [{}, { origenPagina: null }, { origenPagina: '' }, { resol: (src) => src }]) {
      const files = filesDelPanell(publica, opcions);
      expect([opcions, files.map((fila) => fila.clau)]).toEqual([opcions, ['data', 'gps', 'camera', 'resolucio', 'autor', 'poble', 'drets', 'origen', 'publicat', 'comentar', 'connectar']]);
      expect([opcions, JSON.stringify(files).includes(SENSE_ENLLAC)]).toEqual([opcions, false]);
    }
    // Amb l'origen (el visor), la fila hi és: la URL d'una pública i, a l'Arxiu (avisSenseEnllac), d'un arxiu local, el text de quan no n'hi ha cap.
    expect(filesDelPanell(publica, { origenPagina: 'http://localhost:3340' }).find((fila) => fila.clau === 'enllac').enllac)
      .toBe('http://localhost:3340/assets/nano_cards/mur_nano_card.jpg');
    expect(filesDelPanell({ id: 'x', src: 'blob:http://localhost:3340/u' }, { origenPagina: 'http://localhost:3340', avisSenseEnllac: true }).find((fila) => fila.clau === 'enllac').valor)
      .toBe(SENSE_ENLLAC);
  });

  /* Ordre del Mestre (30-10-2026, prompt 2208, T4.2; QA-T3-UX-01) · «No té cap
     enllaç públic d’este lloc» és NOMÉS de l'Arxiu (avisSenseEnllac). Fora (el
     visor d'una publicació, el del Perfil, qualsevol altre), una foto sense
     enllaç públic no porta la fila; amb un enllaç públic, la fila hi és igual. */
  test('fora de l’Arxiu, sense enllaç públic, cap fila d’enllaç; amb un, la fila amb la URL; a l’Arxiu, el text de sempre', () => {
    const ORIGEN = 'http://localhost:3340';
    const sensePublic = [
      { id: '__lf_9x7k2', src: 'blob:http://localhost:3340/u' },
      { id: 'pujada', src: 'sdp-media://mitjans/t/u/avatars/a.webp', srcDelPort: 'https://abc.supabase.co/storage/v1/object/public/mitjans/t/u/avatars/a.webp' },
      { id: 'fora', src: 'https://cdn.example/x.jpg' },
      { id: 'cami', src: '/fotos/placa.jpg' }
    ];
    for (const item of sensePublic) {
      for (const opcions of [{ origenPagina: ORIGEN }, { origenPagina: ORIGEN, avisSenseEnllac: false }, { origenPagina: ORIGEN, avisSenseEnllac: 'si' }]) {
        const files = filesDelPanell(item, opcions);
        expect([item.id, opcions, files.some((fila) => fila.clau === 'enllac')]).toEqual([item.id, opcions, false]);
        expect([item.id, JSON.stringify(files).includes(SENSE_ENLLAC)]).toEqual([item.id, false]);
      }
      expect([item.id, filesDelPanell(item, { origenPagina: ORIGEN, avisSenseEnllac: true }).find((fila) => fila.clau === 'enllac')])
        .toEqual([item.id, { clau: 'enllac', etiqueta: 'Enllaç de la imatge', valor: SENSE_ENLLAC }]);
    }
    // Amb un enllaç públic, la fila hi és, dins i fora de l'Arxiu, al mateix lloc.
    const publica = { id: 'nano-mur', src: '/assets/nano_cards/mur_nano_card.jpg' };
    for (const avisSenseEnllac of [false, true]) {
      const files = filesDelPanell(publica, { origenPagina: ORIGEN, avisSenseEnllac });
      expect(files.map((fila) => fila.clau)).toEqual(['data', 'gps', 'camera', 'resolucio', 'autor', 'poble', 'drets', 'origen', 'publicat', 'enllac', 'comentar', 'connectar']);
      expect(files.find((fila) => fila.clau === 'enllac').enllac).toBe(`${ORIGEN}/assets/nano_cards/mur_nano_card.jpg`);
    }
    // Sense l'origen de la pàgina (la fitxa ?item=), cap fila, ni a l'Arxiu (B3-FITXA-FALS).
    expect(filesDelPanell(publica, { avisSenseEnllac: true }).some((fila) => fila.clau === 'enllac')).toBe(false);
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

/* Ordre del Mestre (30-10-2026, B3) · «Copiar l’enllaç de la imatge» al visor:
   només la URL pública i absoluta del lloc d'un recurs de /assets/. Mai un arxiu
   local (blob:, data:, file:, camins del disc, ids opacs de l'espai), mai una
   referència opaca del port ni la seua URL signada, mai un altre origen. */
describe('enllacPublicDe (B3)', () => {
  const ORIGEN = 'http://localhost:3340';

  test('el recurs públic de l’Arxiu: la URL absoluta del lloc, resolta com la pinta el visor', () => {
    expect(enllacPublicDe({ id: 'cens-img-pi-pla-verd', src: '/assets/img/pi-pla-verd.jpg' }, { origen: ORIGEN }))
      .toBe('http://localhost:3340/assets/img/pi-pla-verd.jpg');
    // Dins d'un amfitrió (WordPress), el paquet; amb la política de mitjans, la bessona.
    const resol = vi.fn(() => 'https://amfitrio.example/wp-content/plugins/socdepoble/dist/assets/img/pi-pla-verd.webp');
    expect(enllacPublicDe({ id: 'x', src: ' /assets/img/pi-pla-verd.jpg ' }, { origen: 'https://amfitrio.example', resol }))
      .toBe('https://amfitrio.example/wp-content/plugins/socdepoble/dist/assets/img/pi-pla-verd.webp');
    expect(resol).toHaveBeenCalledWith('/assets/img/pi-pla-verd.jpg');
    // A l'app nativa, l'origen públic (origenDeLaPagina): mai capacitor://localhost.
    expect(enllacPublicDe({ id: 'x', src: '/assets/img/pi.jpg' }, { origen: 'https://socdepoble.org', resol: (src) => src.replace(/\.jpg$/, '.webp') }))
      .toBe('https://socdepoble.org/assets/img/pi.webp');
    // La consulta es conserva; els espais, codificats; una URL absoluta del mateix origen dins de /assets/, tal qual.
    expect(enllacPublicDe({ id: 'x', src: '/assets/fotos/a.jpg?v=2' }, { origen: ORIGEN })).toBe('http://localhost:3340/assets/fotos/a.jpg?v=2');
    expect(enllacPublicDe({ id: 'x', src: '/assets/uploads/poble/tibi/DSC 0032.JPG' }, { origen: ORIGEN })).toBe('http://localhost:3340/assets/uploads/poble/tibi/DSC%200032.JPG');
    expect(enllacPublicDe({ id: 'x', src: 'http://localhost:3340/assets/x.jpg' }, { origen: ORIGEN })).toBe('http://localhost:3340/assets/x.jpg');
    // La foto publicada d'una persona és pública: l'enllaç hi és (el GPS, no).
    const fotoJavi = LEGACY_MEDIA.find((item) => item.id === 'foto-javi');
    const files = filesDelPanell(fotoJavi, { persona: true, origenPagina: ORIGEN });
    expect(files.find((fila) => fila.clau === 'enllac').enllac).toBe(`${ORIGEN}${fotoJavi.src}`);
    expect(valors(files).gps).toBe('No es mostren en la foto d’una persona');
  });

  /* Gauntlet 261030 (f4b, B3-AMFITRIO-FALS-NEGATIU) · Dins d'un amfitrió, una
     foto que ja arriba resolta (els pobles i el Mercat, resolts en importar-se;
     el cos d'una publicació, resolRecursosDeHtml) porta el mateix enllaç que
     la crua, tal qual i sense tornar-la a resoldre. */
  test('dins d’un amfitrió, la forma ja resolta del mateix fitxer dona el mateix enllaç que la crua (resolRecursPropi de veres)', () => {
    const PAGINA = 'https://poble.example';
    const PAQUET = 'https://poble.example/wp-content/plugins/soc-de-poble/dist';
    const CAMI = '/wp-content/plugins/soc-de-poble/dist';
    const resol = vi.fn(resolRecursPropi);
    try {
      // La base absoluta del paquet (la de l'script del connector).
      fixaBaseRecursos(PAQUET);
      const crua = enllacPublicDe({ id: 'cens-x', src: '/assets/towns/tibi/1.jpg' }, { origen: PAGINA, resol });
      expect(crua).toBe(`${PAQUET}/assets/towns/tibi/1.jpg`);
      const resolta = resolRecursPropi('/assets/towns/tibi/1.jpg');
      expect(enllacPublicDe({ id: 'town-tibi', src: resolta }, { origen: PAGINA, resol })).toBe(crua);
      // El cos d'una publicació (resolRecursosDeHtml), amb la consulta.
      const delCos = /src="([^"]+)"/.exec(resolRecursosDeHtml('<img src="/assets/img/que-es-socdepoble-1.webp?v=3">'))[1];
      expect(enllacPublicDe({ id: 'cos-1', src: delCos }, { origen: PAGINA, resol })).toBe(`${PAQUET}/assets/img/que-es-socdepoble-1.webp?v=3`);
      // La fila del panell, igual que la de la crua.
      expect(filesDelPanell({ id: 'town-tibi', src: resolta }, { origenPagina: PAGINA, resol }).find((f) => f.clau === 'enllac'))
        .toEqual({ clau: 'enllac', etiqueta: 'Enllaç de la imatge', valor: crua, enllac: crua });
      // Una base que és un camí: la resolta comença per '/wp-content/…', no per '/assets/'.
      fixaBaseRecursos(CAMI);
      const resoltaCami = resolRecursPropi('/assets/towns/tibi/1.jpg');
      expect(resoltaCami).toBe(`${CAMI}/assets/towns/tibi/1.jpg`);
      expect(enllacPublicDe({ id: 'x', src: resoltaCami }, { origen: PAGINA, resol })).toBe(`${PAGINA}${CAMI}/assets/towns/tibi/1.jpg`);
      expect(enllacPublicDe({ id: 'x', src: '/assets/towns/tibi/1.jpg' }, { origen: PAGINA, resol })).toBe(`${PAGINA}${CAMI}/assets/towns/tibi/1.jpg`);
      // L'origen extern de la política de mitjans (el paquet del directori demana l'arxiu a socdepoble.org).
      fixaBaseRecursos('/');
      fixaPoliticaDeMitjans({ origen: 'https://socdepoble.org', externs: ['assets/uploads/'], bessones: [] });
      const externa = resolRecursPropi('/assets/uploads/brain/hero.png');
      expect(externa).toBe('https://socdepoble.org/assets/uploads/brain/hero.png');
      expect(enllacPublicDe({ id: 'x', src: externa }, { origen: PAGINA, resol })).toBe(externa);
      expect(enllacPublicDe({ id: 'x', src: '/assets/uploads/brain/hero.png' }, { origen: PAGINA, resol })).toBe(externa);
    } finally {
      fixaBaseRecursos('/');
      fixaPoliticaDeMitjans(null);
    }
    // Sense resolutor, la forma resolta no passa (com abans): cap enllaç inventat.
    expect(enllacPublicDe({ id: 'x', src: `${PAQUET}/assets/towns/tibi/1.jpg` }, { origen: PAGINA })).toBeNull();
  });

  /* Gauntlet 261030 (f4b, f4b-fronteres-fora-del-precommit) · La privacitat de l'enllaç (cap arxiu
     local, cap camí del disc, cap blob:, cap referència opaca ni URL signada, cap altre origen; sense
     origen de la pàgina o amb un resolutor que no torna http(s), cap enllaç) viu a
     panellDeLaFoto.enllac.seguretat.test.js, que corre al pre-commit. */

  test('la fila, traduïda: l’etiqueta i el text de quan no n’hi ha cap (l’Arxiu)', () => {
    const t = (clau, reserva) => ({ 'section.multimedia.visor.enllac': 'Image link', 'section.multimedia.visor.senseEnllac': 'It has no public link on this site' })[clau] || reserva;
    const sense = filesDelPanell({ id: 'x', src: 'blob:http://localhost/u' }, { t, origenPagina: ORIGEN, avisSenseEnllac: true }).find((f) => f.clau === 'enllac');
    expect(sense).toEqual({ clau: 'enllac', etiqueta: 'Image link', valor: 'It has no public link on this site' });
    const amb = filesDelPanell({ id: 'x', src: '/assets/a.jpg' }, { t, origenPagina: ORIGEN }).find((f) => f.clau === 'enllac');
    expect(amb).toEqual({ clau: 'enllac', etiqueta: 'Image link', valor: `${ORIGEN}/assets/a.jpg`, enllac: `${ORIGEN}/assets/a.jpg` });
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
