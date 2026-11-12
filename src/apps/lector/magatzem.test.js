// @vitest-environment node
/* Lector de notícies · el magatzem local amb el navegador fals de P2
   (IndexedDB, Web Locks i BroadcastChannel fets a mà, sense dependències). */
import { afterEach, describe, expect, test } from 'vitest';
import { creaCanalFals, creaIdbFals, creaLocksFals } from '../../utils/__fixtures__/navegadorFals.js';
import { CLAU_ESTAT, CLAU_PERSONALS, NOM_BASE, STORE, creaMagatzemLector } from './magatzem.js';
import {
  afigPersonal, commutaDespres, commutaSeguiment, estatInicial, marcaLlegit, personalsInicials, validaFontPersonal
} from './nucli/index.js';

const oberts = [];
afterEach(() => {
  while (oberts.length) oberts.pop().tanca();
});

function navegador() {
  const idb = creaIdbFals();
  const locks = creaLocksFals();
  const canal = creaCanalFals();
  const pestanya = () => {
    const magatzem = creaMagatzemLector({ idb: idb.idb, navegador: { locks }, Canal: canal.Canal });
    oberts.push(magatzem);
    return magatzem;
  };
  return { idb, canal, pestanya };
}

const espera = (ms = 5) => new Promise((resolve) => { setTimeout(resolve, ms); });
const resum = { id: 'veu-1', fontId: 'veu', titol: 'Títol', enllac: 'https://example.org/1', data: null, autor: null, resum: 'r', imatge: null };

describe('llegir i desar', () => {
  test('el primer dia llig l’estat inicial; el que es desa es torna a llegir igual, en un sol registre', async () => {
    const { idb, pestanya } = navegador();
    const magatzem = pestanya();
    expect(await magatzem.llegix()).toEqual(estatInicial());
    const estat = commutaSeguiment(commutaDespres(marcaLlegit(estatInicial(), 'veu-1'), resum), 'radio');
    expect(await magatzem.desa(estat)).toEqual(estat);
    expect(await magatzem.llegix()).toEqual(estat);
    expect(magatzem.persistent).toBe(true);
    const files = idb.files(NOM_BASE, STORE);
    expect(files).toHaveLength(1);
    expect(files[0].id).toBe(CLAU_ESTAT);
  });

  test('la llista blanca: el que no és de l’estat no arriba mai al disc', async () => {
    const { idb, pestanya } = navegador();
    await pestanya().desa({ ...estatInicial(), secret: 'no', despres: [{ ...resum, contingutHtml: '<p>x</p>' }], llegits: ['MAL'] });
    const [registre] = idb.files(NOM_BASE, STORE);
    expect(Object.keys(registre).sort()).toEqual(['despres', 'esquema', 'id', 'llegits', 'noSeguides']);
    expect(registre.llegits).toEqual([]);
    expect(Object.keys(registre.despres[0])).not.toContain('contingutHtml');
  });

  test('un registre corrupte al disc es llig net', async () => {
    const { idb, pestanya } = navegador();
    const magatzem = pestanya();
    await magatzem.desa(estatInicial());
    idb.bases.get(NOM_BASE).stores.get(STORE).files.set(CLAU_ESTAT, { id: CLAU_ESTAT, llegits: 'trencat', despres: 4 });
    expect(await magatzem.llegix()).toEqual(estatInicial());
  });
});

describe('sense base local i diverses pestanyes', () => {
  test('sense IndexedDB treballa en memòria i ho diu (persistent: false)', async () => {
    const magatzem = creaMagatzemLector({ idb: null, navegador: {}, Canal: null });
    oberts.push(magatzem);
    expect(magatzem.persistent).toBe(false);
    const estat = marcaLlegit(estatInicial(), 'a');
    await magatzem.desa(estat);
    expect(await magatzem.llegix()).toEqual(estat);
  });

  test('una escriu i l’altra llig, i el canal no porta cap valor', async () => {
    const { canal, pestanya } = navegador();
    const a = pestanya();
    const b = pestanya();
    expect(await a.obtinBloqueig()).toBe('escriptora');
    expect(await b.obtinBloqueig()).toBe('lectora');
    await expect(b.desa(estatInicial())).rejects.toMatchObject({ codi: 'NOMES_LECTURA' });
    const avisos = [];
    b.subscriu((avis) => avisos.push(avis));
    await a.desa(commutaDespres(estatInicial(), resum));
    await espera();
    expect(avisos).toContainEqual({ tipus: 'canvi', store: STORE, local: false });
    expect(JSON.stringify(canal.enviats)).not.toMatch(/veu|Títol|example/);
    expect((await b.llegix()).despres.map((d) => d.id)).toEqual(['veu-1']);
  });
});

/* SN (261003) · Les fonts que afig la persona (des del Snippet Curador del
   Bloc) van en un segon registre del mateix store. */
describe('les fonts personals, en un registre a banda', () => {
  const FONT = validaFontPersonal({ url: 'https://example.org/feed', nom: 'La Veu del Barri' }).font;
  const afig = (registre) => afigPersonal(registre, FONT).registre;

  test('el primer dia no n’hi ha; s’afigen en una transacció i es desen a banda de l’estat', async () => {
    const { idb, pestanya } = navegador();
    const magatzem = pestanya();
    expect(await magatzem.llegixPersonals()).toEqual(personalsInicials());
    await magatzem.desa(estatInicial());
    expect((await magatzem.actualitzaPersonals(afig)).fonts).toEqual([FONT]);
    expect(await magatzem.llegixPersonals()).toEqual({ esquema: 1, fonts: [FONT] });
    expect(idb.files(NOM_BASE, STORE).map((registre) => registre.id)).toEqual([CLAU_ESTAT, CLAU_PERSONALS]);
    expect(await magatzem.llegix()).toEqual(estatInicial());
  });

  test('la llista blanca: el que no és d’una font personal no arriba al disc', async () => {
    const { idb, pestanya } = navegador();
    await pestanya().actualitzaPersonals(() => ({ esquema: 1, secret: 'no', fonts: [{ ...FONT, secret: 'no' }, { url: 'javascript:x', nom: 'X' }] }));
    const [registre] = idb.files(NOM_BASE, STORE);
    expect(Object.keys(registre).sort()).toEqual(['esquema', 'fonts', 'id']);
    expect(registre.fonts).toEqual([{ ...FONT }]);
  });

  test('desar l’estat sencer (la pestanya escriptora) no xafa les fonts que ha afegit una altra', async () => {
    const { pestanya } = navegador();
    const lector = pestanya();
    const snippet = pestanya();
    expect(await lector.obtinBloqueig()).toBe('escriptora');
    await lector.desa(estatInicial());
    /* El snippet no demana el bloqueig: el registre és un altre i el canvi és atòmic. */
    await snippet.actualitzaPersonals(afig);
    await lector.desa(marcaLlegit(estatInicial(), 'veu-1'));
    expect((await lector.llegixPersonals()).fonts).toEqual([FONT]);
    expect((await snippet.llegix()).llegits).toEqual(['veu-1']);
  });

  test('una operació que no canvia res no escriu ni avisa; una pestanya lectora no hi pot escriure', async () => {
    const { canal, pestanya } = navegador();
    const a = pestanya();
    const b = pestanya();
    await a.actualitzaPersonals(afig);
    await espera();
    const enviats = canal.enviats.length;
    expect((await a.actualitzaPersonals(afig)).fonts).toEqual([FONT]);
    await espera();
    expect(canal.enviats).toHaveLength(enviats);
    expect(await a.obtinBloqueig()).toBe('escriptora');
    expect(await b.obtinBloqueig()).toBe('lectora');
    await expect(b.actualitzaPersonals((registre) => ({ ...registre, fonts: [] }))).rejects.toMatchObject({ codi: 'NOMES_LECTURA' });
  });
});

test('una còpia del producte conserva les fonts i lectures locals i és repetible', async () => {
  const origen = navegador().pestanya();
  const desti = navegador().pestanya();
  const font = validaFontPersonal({ url: 'https://example.org/feed', nom: 'Font de prova' }).font;
  const antiga = await desti.llegix();
  await origen.actualitzaPersonals((actual) => afigPersonal(actual, font).registre);
  await origen.desa(marcaLlegit(estatInicial(), 'veu-1'));
  const text = await origen.exportaCopia();

  await desti.desa(marcaLlegit(antiga, 'veu-2'), antiga);
  await expect(desti.desa(marcaLlegit(antiga, 'veu-3'), antiga)).rejects.toMatchObject({ codi: 'CONFLICTE' });
  await desti.importaCopia(text);
  await desti.importaCopia(text);
  expect((await desti.llegix()).llegits).toEqual(['veu-2', 'veu-1']);
  expect((await desti.llegixPersonals()).fonts).toEqual([font]);

  const incompleta = JSON.stringify({ ...JSON.parse(text), personals: { fonts: [{ url: 'javascript:alert(1)', nom: 'X' }] } });
  const abans = await desti.exportaCopia();
  await expect(desti.importaCopia(incompleta)).rejects.toMatchObject({ codi: 'COPIA_INVALIDA' });
  expect(await desti.exportaCopia()).toBe(abans);
});

test('l’OPML importa les subscripcions, és repetible i conserva lectures i notícies desades', async () => {
  const m = navegador().pestanya();
  const estat = commutaDespres(marcaLlegit(estatInicial(), 'veu-2'), resum);
  await m.desa(estat);
  const xml = '<?xml version="1.0"?><opml version="2.0"><head><title>Fonts de prova</title></head><body>'
    + '<outline text="Carpeta"><outline text="Font nova" type="rss" xmlUrl="https://example.org/rss?a=1&amp;b=2"/></outline>'
    + '</body></opml>';
  for (const correcte of [
    xml, xml.replace('version="1.0"', 'version="1.0" encoding="UTF-8" standalone="yes"'),
    xml.replace('text="Font nova"', 'text="Font nova" xmlns:ex="urn:prova" ex:color="verd"')
  ]) await m.importaCopia(correcte);
  expect(await m.llegix()).toEqual(estat);
  expect((await m.llegixPersonals()).fonts).toEqual([
    validaFontPersonal({ nom: 'Font nova', url: 'https://example.org/rss?a=1&b=2' }).font
  ]);
});

test('un OPML truncat, malformat, amb DTD, duplicats o adreces invàlides no canvia cap registre', async () => {
  const m = navegador().pestanya();
  await m.desa(marcaLlegit(estatInicial(), 'veu-2'));
  const outline = '<outline text="Font nova" type="rss" xmlUrl="https://example.org/rss"/>';
  const opml = (contingut) => `<opml version="2.0"><body>${contingut}</body></opml>`;
  const correcte = opml(outline);
  const abans = await m.exportaCopia();
  const corruptes = [
    correcte.slice(0, -1), correcte.slice(0, correcte.indexOf('xmlUrl') + 12),
    opml(`${outline}${outline}`), opml(outline.replace('https://example.org/rss', 'javascript:alert(1)')),
    opml(outline.replace('https://example.org/rss', ['https://usuari:secret', 'example.org/rss'].join('@'))),
    opml(outline.replace('text="Font nova"', 'text=Font')),
    opml(outline.replace('text="Font nova"', 'text="Font nova" text="Altra"')),
    opml(outline.replace('text="Font nova"', 'text="Font &inexistent;"')),
    opml(outline.replace('text="Font nova"', 'text="Font &#0;"')),
    opml(outline.replace('type="rss" ', 'type="rss"')),
    opml(outline.replace('text="Font nova"', 'text="Font <nova"')),
    `<!DOCTYPE opml [<!ENTITY prova "font">]>${correcte}`,
    `${correcte}${correcte}`, `${correcte}<!--`, correcte.replace('</body>', '</altre>'),
    opml(`${outline}<!-- x--y -->`), opml(`${outline}<!-- x--->`), opml(`${outline}]]>`),
    opml(outline.replace('Font nova', `Font ${String.fromCharCode(0xD800)}`)),
    correcte.replace('<body>', '<x:body>').replace('</body>', '</x:body>'),
    opml(outline.replace('outline ', 'x:y:outline ')),
    opml(outline.replace('outline ', 'outline x:extra="valor" ')),
    correcte.replace('<opml ', `<opml${String.fromCharCode(0xA0)}`),
    `${String.fromCharCode(0xA0)}${correcte}`,
    `<?xml nonsense?>${correcte}`, `${correcte}<?xml version="1.0"?>`,
    `<?xml version="1.0"?><?xml version="1.0"?>${correcte}`,
    opml(`${outline}<!-- ${String.fromCharCode(1)} -->`),
    opml(outline.replace('outline ', 'outline xmlns:xml="urn:incorrecte" ')),
    opml(outline.replace('outline ', 'outline xmlns:a="urn:prova" xmlns:b="urn:prova" a:x="1" b:x="2" ')),
    opml(Array.from({ length: 101 }, (_, i) => outline.replace('example.org/rss', `example.org/${i}`)).join(''))
  ];
  for (const xml of corruptes) {
    await expect(m.importaCopia(xml)).rejects.toMatchObject({ codi: 'COPIA_INVALIDA' });
    expect(await m.exportaCopia()).toBe(abans);
  }
});
