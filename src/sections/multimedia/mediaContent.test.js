/**
 * Onada 12 (261011; ordres 261011_0130, punt 1: «hi ha dos Mac Mini») · Una
 * entrada de Multimèdia derivada d'un article és una FOTO d'eixe article: mai
 * l'avatar ni el logotip de qui signa, mai el text de venda sencer, i sempre
 * diu de quin article és (`article`). Es prova amb la llavor de veres.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { MEDIA_ITEMS, fotosDeLAgenda, fotosDelMercat, fotosDelMur, fotosDelsPobles, fusionaMitjans } from './mediaContent.js';
import { LEGACY_MEDIA } from './legacyMedia.js';
import { MARKET_ITEMS } from '../mercat/marketContent.js';
import { TOWNS } from '../pobles/townsContent.js';

const LOGO = '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png';
const perId = (id) => MEDIA_ITEMS.find((item) => item.id === id);

describe('MEDIA_ITEMS (la llavor de Multimèdia)', () => {
  test('cap id repetit', () => {
    const ids = MEDIA_ITEMS.map((item) => item.id);
    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
  });

  test('cap entrada porta de foto un logotip ni l’avatar de qui ven', () => {
    const deQuiVen = new Set(MARKET_ITEMS.flatMap((item) => [item.avatar_url, item.author_avatar]).filter(Boolean));
    expect(deQuiVen.has(LOGO)).toBe(true);
    expect(MEDIA_ITEMS.filter((item) => /\/logo-/.test(String(item.src))).map((item) => item.id)).toEqual([]);
    expect(MEDIA_ITEMS.filter((item) => item.article && deQuiVen.has(item.src)).map((item) => item.id)).toEqual([]);
    /* Troballa oberta (decisió del Mestre): l'arxiu (legacyMedia.js) porta com
       a «Fotografia històrica» la foto de perfil de la persona pilot, que és
       també l'avatar de qui ven el Mac Mini. No és una entrada derivada i
       esta nit no es toca; la prova la deixa a la vista. */
    expect(MEDIA_ITEMS.filter((item) => !item.article && deQuiVen.has(item.src)).map((item) => item.id)).toEqual(['foto-javi']);
  });

  test('totes les fotos existixen a public/', () => {
    const absents = MEDIA_ITEMS.filter((item) => !existsSync(path.join(process.cwd(), 'public', item.src))).map((item) => `${item.id}: ${item.src}`);
    expect(absents).toEqual([]);
  });

  /* Onada 0.3 (Gauntlet 261016, I35) · Esta prova fixava els ids per posició
     (market-0, market-1). L'ordre nova els vol estables per article: ara són
     market-<id del producte>, i supabase/seed.sql porta els mateixos. */
  test('el Mac Mini i la Samarreta hi són UNA vegada, amb la seua primera foto i el seu article', () => {
    const mac = MARKET_ITEMS.find((item) => item.id === 'mac-mini-m4');
    const samarreta = MARKET_ITEMS.find((item) => item.id === 'samarreta-socdepoble');
    const delMercat = MEDIA_ITEMS.filter((item) => item.tag === 'Mercat');
    expect(delMercat.map((item) => [item.id, item.title, item.src, item.article])).toEqual([
      ['market-mac-mini-m4', mac.title, '/assets/uploads/brain/mac_mini_m4_1787721966622.jpg', { sectionId: 'mercat', id: 'mac-mini-m4' }],
      ['market-samarreta-socdepoble', samarreta.title, '/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/01-chica-jersey.png', { sectionId: 'mercat', id: 'samarreta-socdepoble' }]
    ]);
    /* La foto no és una segona fitxa del producte: el text de venda no hi viatja. */
    expect(perId('market-mac-mini-m4').description).toBe(mac.subtitle);
    expect(perId('market-mac-mini-m4').description).not.toContain('Processador');
    expect(perId('market-mac-mini-m4').searchText).not.toContain('processador');
    expect(MEDIA_ITEMS.filter((item) => item.title === mac.title)).toHaveLength(1);
  });

  test('cada foto derivada nomena el seu article; l’arxiu, cap', () => {
    for (const town of TOWNS) expect(perId(`town-${town.id}`)).toMatchObject({ src: town.image_url, article: { sectionId: 'pobles', id: town.id } });
    expect(LEGACY_MEDIA.filter((item) => 'article' in item)).toEqual([]);
    expect(MEDIA_ITEMS).toHaveLength(LEGACY_MEDIA.length + MARKET_ITEMS.length + TOWNS.length);
  });
});

describe('fotosDelMercat', () => {
  const base = { id: 'p', title: 'Oli', seller: 'Pepa', subtitle: 'Collita 2026', created_at: '2026-09-01T10:00:00.000Z' };

  test('un producte sense cap foto pròpia no fa entrada: ni amb l’avatar a avatar_url, ni copiat a image_url o image', () => {
    expect(fotosDelMercat([{ ...base, avatar_url: LOGO }])).toEqual([]);
    expect(fotosDelMercat([{ ...base, avatar_url: LOGO, image_url: LOGO, image: LOGO }])).toEqual([]);
    expect(fotosDelMercat([{ ...base, author_avatar: '/assets/cara.png', images: ['/assets/cara.png'] }])).toEqual([]);
    expect(fotosDelMercat([base])).toEqual([]);
  });

  test('primer `images`; sense, image_url i image', () => {
    expect(fotosDelMercat([{ ...base, avatar_url: LOGO, images: ['/assets/a.png', '/assets/b.png'], image_url: '/assets/c.png' }])[0].src).toBe('/assets/a.png');
    expect(fotosDelMercat([{ ...base, avatar_url: LOGO, image_url: '/assets/c.png' }])[0].src).toBe('/assets/c.png');
    expect(fotosDelMercat([{ ...base, images: [], image: ['/assets/d.png'] }])[0].src).toBe('/assets/d.png');
  });

  /* Correcció D4 (261011, refutació del front 1) · LÍMIT CONEGUT. L'avatar es
     descarta per igualtat de cadena, no amb camiDeLaMarca (UniversalUtils.js),
     que iguala el logotip PNG i el seu SVG d'abans: eixe mòdul importa sense
     extensió i arrossega el router, i mediaContent.js és de la cadena que el
     generador de la llavor carrega amb node pla. Un producte amb l'avatar en
     .png i el MATEIX logotip en .svg a image_url encara faria entrada. Cap
     producte de la llavor ni del seed.sql ho porta (ho fixen les proves «cap
     entrada porta de foto un logotip» d'ací i de seedSql.multimedia.test.js).
     El dia que camiDeLaMarca visca en un mòdul pur, esta prova s'ha de girar. */
  test('[LÍMIT] l’avatar en PNG i el mateix logotip en SVG a image_url: no es reconeixen com el mateix recurs', () => {
    const SVG = '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg';
    expect(fotosDelMercat([{ ...base, avatar_url: LOGO, image_url: SVG }]).map((foto) => foto.src)).toEqual([SVG]);
  });

  test('la forma de l’entrada (l’id, el de l’article)', () => {
    expect(fotosDelMercat([{ ...base, images: ['/assets/a.png'] }])).toEqual([{
      id: 'market-p', title: 'Oli', subtitle: 'Pepa', description: 'Collita 2026', src: '/assets/a.png', kind: 'image', tag: 'Mercat',
      source: 'Pepa', created_at: '2026-09-01T10:00:00.000Z', sectionId: 'multimedia', article: { sectionId: 'mercat', id: 'p' },
      searchText: 'oli collita 2026 pepa mercat'
    }]);
  });

  test('l’id no depén de la posició: un producte nou al davant no canvia el de la resta; sense id, la posició', () => {
    const oli = { ...base, images: ['/assets/a.png'] };
    const mel = { ...base, id: 'mel', images: ['/assets/m.png'] };
    expect(fotosDelMercat([oli]).map((f) => f.id)).toEqual(['market-p']);
    expect(fotosDelMercat([mel, oli]).map((f) => f.id)).toEqual(['market-mel', 'market-p']);
    expect(fotosDelMercat([{ ...oli, id: undefined }, { ...mel, id: '' }]).map((f) => f.id)).toEqual(['market-0', 'market-1']);
  });
});

describe('fotosDelMur i fotosDelsPobles', () => {
  test('una publicació sense portada no fa entrada; amb portada, nomena el seu article', () => {
    const fotos = fotosDelMur([
      { id: 'sense', title: 'Sense foto', avatar_url: LOGO },
      { id: 'amb', title: 'Fira', image_url: ['/assets/fira.jpg'], author: 'Pepa', content: 'Dissabte.', created_at: '2026-09-02T10:00:00.000Z' }
    ]);
    expect(fotos).toHaveLength(1);
    /* Onada 0.3 (I35) · Abans feed-1 (la posició); ara, l'id de l'article. */
    expect(fotos[0]).toMatchObject({ id: 'feed-amb', src: '/assets/fira.jpg', article: { sectionId: 'mur', id: 'amb' } });
  });

  test('un poble: la foto de la seua fitxa i el seu article', () => {
    expect(fotosDelsPobles([{ id: 'tibi', title: 'Tibi', type: 'town', content: 'Un pantà.', image_url: '/assets/towns/tibi/1.jpg', created_at: '2026-08-16T08:00:00.000Z' }])).toEqual([{
      id: 'town-tibi', title: 'Tibi', subtitle: 'town', description: 'Un pantà.', src: '/assets/towns/tibi/1.jpg', kind: 'image', tag: 'Poble',
      source: 'Tibi', created_at: '2026-08-16T08:00:00.000Z', sectionId: 'multimedia', article: { sectionId: 'pobles', id: 'tibi' },
      searchText: 'tibi un panta. poble'
    }]);
  });
});

/* Onada 0.3 (Gauntlet 261016, I35 i M03) · Les fotos de l'Agenda i la fusió
   amb el que porta el port. */
describe('fotosDeLAgenda', () => {
  const aplec = { id: 'aplec', title: 'Aplec', subtitle: 'Al territori', author_name: 'Sóc de Poble', author_avatar: LOGO, image_url: '/assets/events/cartell.jpg', date: '2023-01-29' };

  test('el cartell de l’acte, amb el seu article; mai l’avatar de qui signa', () => {
    expect(fotosDeLAgenda([aplec])).toEqual([{
      id: 'event-aplec', title: 'Aplec', subtitle: 'Al territori', description: '', src: '/assets/events/cartell.jpg', kind: 'image', tag: 'Agenda',
      source: 'Sóc de Poble', created_at: null, sectionId: 'multimedia', article: { sectionId: 'events', id: 'aplec' },
      searchText: 'aplec al territori soc de poble agenda'
    }]);
    expect(fotosDeLAgenda([{ ...aplec, image_url: LOGO }])).toEqual([]);
    expect(fotosDeLAgenda([{ ...aplec, image_url: null }])).toEqual([]);
  });

  test('la data és la de l’article, no la del dia de l’acte; `images` primer', () => {
    const [foto] = fotosDeLAgenda([{ ...aplec, created_at: '2026-09-01T10:00:00.000Z', images: ['/assets/a.jpg'] }]);
    expect([foto.created_at, foto.src]).toEqual(['2026-09-01T10:00:00.000Z', '/assets/a.jpg']);
    expect(fotosDeLAgenda([{ ...aplec, publish_date: '2026-09-02T10:00:00.000Z' }])[0].created_at).toBe('2026-09-02T10:00:00.000Z');
  });
});

describe('fusionaMitjans', () => {
  test('el del port es queda tal qual i davant; una foto viva entra si ni el seu id ni el seu src ja hi són', () => {
    const port = [{ id: 'market-0', src: '/assets/mac.jpg' }, { id: 'nano-mur', src: '/assets/nano.jpg' }, { id: 'sense-src' }];
    const vives = [
      { id: 'market-mac-mini-m4', src: '/assets/mac.jpg' },
      { id: 'nano-mur', src: '/assets/altra.jpg' },
      { id: 'feed-p1', src: '/assets/fira.jpg' },
      { id: 'feed-p2' },
      { id: 'feed-p3', src: '/assets/fira.jpg' }
    ];
    expect(fusionaMitjans(port, vives).map((item) => item.id)).toEqual(['market-0', 'nano-mur', 'sense-src', 'feed-p1']);
    expect(fusionaMitjans(port, vives)[0]).toBe(port[0]);
  });

  test('sense res, cap mitjà; sense port, les vives deduplicades', () => {
    expect(fusionaMitjans(undefined, undefined)).toEqual([]);
    expect(fusionaMitjans(null, [{ id: 'a', src: '/x.jpg' }, { id: 'a', src: '/y.jpg' }]).map((item) => item.src)).toEqual(['/x.jpg']);
  });

  /* Revisió adversarial del 261016 · La fila remota d'app_content
     'mediaItems' de producció, d'abans de l'Onada 12: market-0 i market-1 per
     posició, sense `article`, el Mac Mini amb la foto de perfil de qui ven i la
     Samarreta amb el logotip SVG. Les fotos vives porten un altre id i un
     altre src, i abans entraven totes dues: el mateix article dues vegades. */
  const mac = MARKET_ITEMS.find((item) => item.id === 'mac-mini-m4');
  const samarreta = MARKET_ITEMS.find((item) => item.id === 'samarreta-socdepoble');
  const REMOT = [
    { id: 'market-0', title: mac.title, subtitle: 'Javi Llinares', src: '/assets/uploads/gent/javi-llinares/avatars/javi-llinares-perfil-1200px.jpg', kind: 'image', tag: 'Mercat', source: 'Javi Llinares', created_at: mac.created_at, sectionId: 'multimedia' },
    { id: 'market-1', title: samarreta.title, subtitle: 'Sóc de Poble', src: '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg', kind: 'image', tag: 'Mercat', source: 'Sóc de Poble', created_at: samarreta.created_at, sectionId: 'multimedia' },
    { id: 'town-tibi', title: 'Tibi', src: '/assets/towns/tibi/1.jpg', tag: 'Poble', article: { sectionId: 'pobles', id: 'tibi' } }
  ];

  test('una sola entrada per article: la foto viva ocupa el lloc de l’entrada rància del mateix article, amb la seua foto i el seu article', () => {
    const fusio = fusionaMitjans(REMOT, fotosDelMercat(MARKET_ITEMS));
    expect(fusio.map((item) => [item.id, item.src])).toEqual([
      ['market-mac-mini-m4', '/assets/uploads/brain/mac_mini_m4_1787721966622.jpg'],
      ['market-samarreta-socdepoble', '/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/01-chica-jersey.png'],
      ['town-tibi', '/assets/towns/tibi/1.jpg']
    ]);
    expect(fusio.filter((item) => item.title === mac.title)).toHaveLength(1);
    expect(fusio.every((item) => item.article)).toBe(true);
    expect(fusio[2]).toBe(REMOT[2]);
  });

  test('sense la viva, una rància amb un logotip, un SVG o un avatar no entra; amb una foto de veres, es queda tal qual', () => {
    expect(fusionaMitjans(REMOT, []).map((item) => item.id)).toEqual(['town-tibi']);
    const fira = { id: 'feed-2', title: 'Fira', src: '/assets/fira.jpg', tag: 'Mur' };
    expect(fusionaMitjans([fira], [])[0]).toBe(fira);
    /* Un mitjà del port que no és cap derivada rància (una pujada, l'arxiu) no es toca, encara que siga un SVG. */
    const pujada = { id: 'pujada-1', title: 'Esquema', src: '/assets/uploads/esquema.svg' };
    expect(fusionaMitjans([pujada], [])).toEqual([pujada]);
  });

  test('una entrada del port sense article amb el mateix id que una viva que el porta (les town-* remotes): la viva, al seu lloc', () => {
    const remot = [{ id: 'town-tibi', title: 'Tibi', src: '/assets/towns/tibi/1.jpg', tag: 'Poble' }, { id: 'nano-mur', src: '/assets/nano.jpg' }];
    const [viva] = fotosDelsPobles([{ id: 'tibi', title: 'Tibi', image_url: '/assets/towns/tibi/1.jpg' }]);
    const fusio = fusionaMitjans(remot, [viva]);
    expect(fusio.map((item) => item.id)).toEqual(['town-tibi', 'nano-mur']);
    expect(fusio[0]).toBe(viva);
    expect(fusio[0].article).toEqual({ sectionId: 'pobles', id: 'tibi' });
    /* Sense viva, la del port tal qual. */
    expect(fusionaMitjans(remot, [])[0]).toBe(remot[0]);
  });

  test('si la foto viva ja era al port, la rància sobra: cap article repetit ni cap id repetit', () => {
    const [viva] = fotosDelMercat([{ id: 'oli', title: 'Oli', seller: 'Pepa', images: ['/assets/oli.jpg'], created_at: '2026-09-01T10:00:00.000Z' }]);
    const rancia = { id: 'market-0', title: 'Oli', src: '/assets/oli-vell.jpg', tag: 'Mercat', created_at: '2026-09-01T10:00:00.000Z' };
    expect(fusionaMitjans([rancia, viva], [viva]).map((item) => item.id)).toEqual(['market-oli']);
  });

  test('amb els àlies del cens, la còpia que porta el port compta com l’original: el cens no l’afig dues vegades', () => {
    const copia = '/assets/uploads/gent/javi-llinares/avatars/javi-llinares-perfil-1200px.jpg';
    const original = '/assets/fotos/javi-llinares-perfil-1200px.jpg';
    const port = [{ id: 'foto-vella', title: 'Javi Llinares', src: copia }];
    const delCens = [{ id: 'cens-fotos-javi-llinares-perfil-1200px', src: original }, { id: 'cens-altra', src: '/assets/altra.jpg' }];
    expect(fusionaMitjans(port, delCens, { alies: new Map([[copia, original]]) }).map((item) => item.id)).toEqual(['foto-vella', 'cens-altra']);
    expect(fusionaMitjans(port, delCens).map((item) => item.id)).toEqual(['foto-vella', 'cens-fotos-javi-llinares-perfil-1200px', 'cens-altra']);
  });
});
