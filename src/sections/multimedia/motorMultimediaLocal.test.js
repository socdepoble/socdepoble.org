// @vitest-environment node
/**
 * motorMultimediaLocal.test.js — El motor del Gestor d'arxius locals
 * (IDEA-54/55 · Onada 261029_1605): tipus i MIME, la Font (llista robusta,
 * llig amb límit, info, fitxer), el text (UTF-8 estricte, BOM, salts,
 * conflictes), el SHA-256 i els duplicats exactes, la WebP, l'àlbum, l'anàlisi
 * amb bessones entre carpetes i el camí feliç de les operacions físiques.
 * Les proves de seguretat són a motorMultimediaLocal.seguretat.test.js.
 */
import { webcrypto } from 'node:crypto';
import { describe, expect, test, vi } from 'vitest';
import {
  CarpetaFalsa,
  FitxerFals,
  arbreMultimedia,
  bytesPngFals,
  bytesWebpFals,
  carpetesFalses,
  contingutFals,
  nodeFals,
  rutesFalses,
  textFals
} from '../../../tests/helpers/carpetaLocalFalsa.js';
import { TIPUS, jpegAmbExif } from '../../../tests/helpers/jpegProva.js';
import {
  CARPETA_ORIGINALS_RASTER,
  EXTENSIONS_ESCRIPTURA_LOCAL,
  EXTENSIONS_TEXT_LOCAL,
  MAX_LECTURA_IMATGE_LOCAL_BYTES,
  MIDA_PAGINA_ALBUM,
  MIDA_PAGINA_TAULA,
  analitzaCarpetaMultimediaLocal,
  calculaHashFitxerLocal,
  carpetaDeRuta,
  cercaDuplicatsExactesLocals,
  codificaTextLocal,
  creaBibliotecaCarpetesLocals,
  creaFitxerMarkdownLocal,
  creaRegistreUrlsLocals,
  dataUrlSvgLocal,
  demanaCarpeta,
  desaWebpALaCarpetaLocal,
  desaWebpIMouOriginalLocal,
  desarWebpEnHandleLocal,
  esBytesPdf,
  esBytesWebp,
  esTextEditableLocal,
  esTextLlegibleLocal,
  escriuTextLocal,
  etiquetesEstatLocal,
  fontDesDeFitxers,
  fontDesDeHandle,
  indexaDuplicatsExactes,
  inspeccionaImatgeLocal,
  llegixTextLocal,
  mimeDeRuta,
  mimeDeVisorLocal,
  nomSegurDeCarpetaLocal,
  nomSegurDeFitxerLocal,
  oblidaFont,
  paginaLocal,
  potMoureOriginalRaster,
  potTriarCarpeta,
  rutaBessonaWebp,
  rutaDestiDeMoviment,
  rutaOriginalsRasterDe,
  saltsDeLiniaDe,
  suggerixPobleLocal,
  tipusMitjaDe,
  verificaPermisCarpetaLocal,
  vistaDe,
  vistaDeExtensio
} from './motorMultimediaLocal.js';

const text = (bytes) => new TextDecoder().decode(bytes);
const codi = async (promesa) => {
  try {
    await promesa;
  } catch (error) {
    return error?.codi ?? error?.name;
  }
  return 'SENSE_ERROR';
};
const errorDe = async (promesa) => {
  try {
    await promesa;
  } catch (error) {
    return error;
  }
  throw new Error('Esperava un error.');
};

describe('tipus, vistes i MIME', () => {
  test.each([
    ['foto.png', 'imatge', 'imatge', 'image/png', 'image/png'],
    ['FOTO.JPG', 'imatge', 'imatge', 'image/jpeg', 'image/jpeg'],
    ['a.jpeg', 'imatge', 'imatge', 'image/jpeg', 'image/jpeg'],
    ['a.webp', 'imatge', 'imatge', 'image/webp', 'image/webp'],
    ['a.gif', 'imatge', 'imatge', 'image/gif', 'image/gif'],
    ['a.avif', 'imatge', 'imatge', 'image/avif', 'image/avif'],
    ['logo.svg', 'imatge', 'svg', 'image/svg+xml', null],
    ['so.mp3', 'audio', 'audio', 'audio/mpeg', 'audio/mpeg'],
    ['so.wav', 'audio', 'audio', 'audio/wav', 'audio/wav'],
    ['so.ogg', 'audio', 'audio', 'audio/ogg', 'audio/ogg'],
    ['so.m4a', 'audio', 'audio', 'audio/mp4', 'audio/mp4'],
    ['so.flac', 'audio', 'audio', 'audio/flac', 'audio/flac'],
    ['so.aac', 'audio', 'audio', 'audio/aac', 'audio/aac'],
    ['v.mp4', 'video', 'video', 'video/mp4', 'video/mp4'],
    ['v.webm', 'video', 'video', 'video/webm', 'video/webm'],
    ['v.mov', 'video', 'video', 'video/quicktime', 'video/quicktime'],
    ['v.m4v', 'video', 'video', 'video/mp4', 'video/mp4'],
    ['n.md', 'text', 'text', 'text/markdown', null],
    ['n.markdown', 'text', 'text', 'text/markdown', null],
    ['n.txt', 'text', 'text', 'text/plain', null],
    ['d.json', 'text', 'text', 'application/json', null],
    ['d.csv', 'text', 'text', 'text/csv', null],
    ['d.tsv', 'text', 'text', 'text/tab-separated-values', null],
    ['d.yml', 'text', 'text', 'application/yaml', null],
    ['d.yaml', 'text', 'text', 'application/yaml', null],
    ['o.canvas', 'text', 'text', 'application/json', null],
    ['p.html', 'codi', 'codi', 'text/html', null],
    ['p.htm', 'codi', 'codi', 'text/html', null],
    ['p.xhtml', 'codi', 'codi', 'application/xhtml+xml', null],
    ['p.css', 'codi', 'codi', 'text/css', null],
    ['p.js', 'codi', 'codi', 'text/javascript', null],
    ['p.mjs', 'codi', 'codi', 'text/javascript', null],
    ['p.xml', 'codi', 'codi', 'application/xml', null],
    ['c.vcf', 'codi', 'codi', 'text/vcard', null],
    ['r.log', 'codi', 'codi', 'text/plain', null],
    ['acta.pdf', 'document', 'pdf', 'application/pdf', 'application/pdf'],
    ['f.xls', 'document', 'cap', 'application/vnd.ms-excel', null],
    ['f.xlsx', 'document', 'cap', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null],
    ['f.ods', 'document', 'cap', 'application/vnd.oasis.opendocument.spreadsheet', null],
    ['README', 'altre', 'cap', 'application/octet-stream', null],
    ['.bashrc', 'altre', 'cap', 'application/octet-stream', null],
    ['x.af', 'altre', 'cap', 'application/octet-stream', null]
  ])('%s → %s, vista %s, %s, visor %s', (ruta, tipus, vista, mime, visor) => {
    expect(tipusMitjaDe(ruta)).toBe(tipus);
    expect(vistaDe(ruta)).toBe(vista);
    expect(mimeDeRuta(ruta)).toBe(mime);
    expect(mimeDeVisorLocal(ruta)).toBe(visor);
  });

  test('editables, llegibles, llista blanca d’escriptura i vista d’una extensió', () => {
    expect([...EXTENSIONS_TEXT_LOCAL]).toEqual(['md', 'markdown', 'txt', 'json', 'csv', 'tsv', 'yml', 'yaml', 'canvas']);
    expect([...EXTENSIONS_ESCRIPTURA_LOCAL].sort()).toEqual([...EXTENSIONS_TEXT_LOCAL, 'webp'].sort());
    for (const ext of ['html', 'css', 'js', 'xml', 'vcf', 'log', 'svg', 'png']) expect(EXTENSIONS_ESCRIPTURA_LOCAL.has(ext)).toBe(false);
    expect(esTextEditableLocal('a/b.MD')).toBe(true);
    expect(esTextEditableLocal('a/b.html')).toBe(false);
    expect(esTextLlegibleLocal('a/b.html')).toBe(true);
    expect(esTextLlegibleLocal('a/b.png')).toBe(false);
    expect(vistaDeExtensio('PNG')).toBe('imatge');
    expect(vistaDeExtensio('svg')).toBe('svg');
    expect(MIDA_PAGINA_ALBUM).toBe(24);
    expect(MIDA_PAGINA_TAULA).toBe(100);
    expect(carpetaDeRuta('a/b/c.png')).toBe('a/b');
    expect(carpetaDeRuta('c.png')).toBe('');
  });

  test('l’anàlisi marca .md com a text i .pdf com a document sense canviar els comptadors d’imatges', () => {
    const r = analitzaCarpetaMultimediaLocal([
      { ruta: 'a/nota.md', mida: 10 },
      { ruta: 'a/acta.pdf', mida: 10 },
      { ruta: 'a/foto.png', mida: 10 },
      { ruta: 'b/web.html', mida: 10 }
    ]);
    const perRuta = new Map(r.elements.map((e) => [e.ruta, e]));
    expect(perRuta.get('a/nota.md')).toMatchObject({ tipus: 'text', vista: 'text', carpeta: 'a' });
    expect(perRuta.get('a/acta.pdf')).toMatchObject({ tipus: 'document', vista: 'pdf' });
    expect(perRuta.get('b/web.html')).toMatchObject({ tipus: 'codi', vista: 'codi' });
    expect(r.resum.totalImatges).toBe(1);
    expect(r.resum.totalFitxers).toBe(4);
    expect(r.carpetes).toEqual(['a', 'b']);
  });
});

describe('selector', () => {
  test('potTriarCarpeta i demanaCarpeta amb mode, id i errors traduïts amb cause', async () => {
    expect(potTriarCarpeta({})).toBe(false);
    expect(await codi(demanaCarpeta({ entorn: {} }))).toBe('SELECTOR_NO_DISPONIBLE');
    expect(await codi(demanaCarpeta({ mode: 'tot', entorn: {} }))).toBe('PARAMETRES_INVALIDS');
    const h = new CarpetaFalsa('triada');
    const entorn = { showDirectoryPicker: vi.fn(async () => h) };
    expect(await demanaCarpeta({ mode: 'readwrite', entorn })).toBe(h);
    expect(entorn.showDirectoryPicker).toHaveBeenCalledWith({ mode: 'readwrite', id: 'sdp-arxius-locals' });
    await demanaCarpeta({ entorn, id: 'no vàlid!' });
    expect(entorn.showDirectoryPicker).toHaveBeenLastCalledWith({ mode: 'read' });
    for (const [nom, esperat] of [['AbortError', 'SELECCIO_CANCELLADA'], ['SecurityError', 'CAL_GEST'], ['NotAllowedError', 'CAL_GEST'], ['TypeError', 'SELECTOR_FALLIT']]) {
      const causa = nom === 'TypeError' ? new TypeError('x') : new DOMException('x', nom);
      const error = await errorDe(demanaCarpeta({ entorn: { showDirectoryPicker: async () => { throw causa; } } }));
      expect(error.codi).toBe(esperat);
      expect(error.cause).toBe(causa);
      expect(error.name).toBe('ErrorArxiuLocal');
    }
  });

  test('Gauntlet 261029 c1 · en un marc d’un altre origen no es pot triar carpeta (SELECTOR_NO_DISPONIBLE, sense cridar el selector)', async () => {
    const bloquejat = () => { throw new DOMException('Blocked a frame from accessing a cross-origin frame.', 'SecurityError'); };
    const showDirectoryPicker = vi.fn(async () => new CarpetaFalsa('mai'));
    const alie = { showDirectoryPicker, top: { get location() { return bloquejat(); } } };
    expect(potTriarCarpeta(alie)).toBe(false);
    expect(potTriarCarpeta({ showDirectoryPicker, get top() { return bloquejat(); } })).toBe(false);
    expect(await codi(demanaCarpeta({ entorn: alie }))).toBe('SELECTOR_NO_DISPONIBLE');
    expect(showDirectoryPicker).not.toHaveBeenCalled();
    /* Pàgina de dalt, o marc del mateix origen: sí. */
    const dalt = { showDirectoryPicker };
    dalt.top = dalt;
    expect(potTriarCarpeta(dalt)).toBe(true);
    expect(potTriarCarpeta({ showDirectoryPicker, top: { location: { href: 'https://socdepoble.org/' } } })).toBe(true);
    expect(potTriarCarpeta({ showDirectoryPicker })).toBe(true);
  });
});

describe('Font sobre un handle', () => {
  test('llista: rutes ordenades, sense ocults, carpetes recorregudes i limitacions buides', async () => {
    const arrel = arbreMultimedia({}, { buida: {} });
    const font = fontDesDeHandle(arrel);
    const llista = await font.llista();
    expect(llista.map((e) => e.ruta)).toEqual([
      '00_inbox/esbos_festa_tibi.png', '00_inbox/nano_vinyeta.png', '00_inbox/nota.md',
      'documents_i_pdfs/acta.pdf', 'llegeix-me.txt', 'originals_raster_public/assets/uploads/brain/x.jpg'
    ]);
    expect(llista[0]).toEqual({ ruta: '00_inbox/esbos_festa_tibi.png', mida: 72, modificat: expect.any(Number) });
    expect(font.carpetes).toEqual([
      '00_inbox', 'buida', 'documents_i_pdfs', 'originals_raster_public', 'originals_raster_public/assets',
      'originals_raster_public/assets/uploads', 'originals_raster_public/assets/uploads/brain'
    ]);
    expect(font.limitacions).toEqual([]);
    expect(font.nom).toBe('_multimedia_de_poble');
    expect(font.handle).toBe(arrel);
  });

  test('un fitxer il·legible no tomba el llistat; una subcarpeta il·legible tampoc', async () => {
    const arrel = new CarpetaFalsa('c', {
      'bo.txt': 'bo',
      'dolent.txt': new FitxerFals('dolent.txt', 'x', { fallaLectura: true }),
      tancada: new CarpetaFalsa('tancada', { 'y.txt': 'y' }, { fallaRecorregut: true })
    });
    const font = fontDesDeHandle(arrel);
    expect((await font.llista()).map((e) => e.ruta)).toEqual(['bo.txt']);
    expect(font.limitacions.map((l) => l.codi)).toEqual(['FITXER_ILLEGIBLE', 'CARPETA_ILLEGIBLE']);
  });

  test('PROFUNDITAT_MAXIMA i CARPETA_TRUNCADA', async () => {
    const fonda = fontDesDeHandle(new CarpetaFalsa('c', { a: { b: { c: { 'x.txt': 'x' } } }, 'r.txt': 'r' }), { profunditat: 2 });
    expect((await fonda.llista()).map((e) => e.ruta)).toEqual(['r.txt']);
    expect(fonda.limitacions.map((l) => l.codi)).toEqual(['PROFUNDITAT_MAXIMA']);
    const plena = fontDesDeHandle(new CarpetaFalsa('c', { '1.txt': '1', '2.txt': '2', '3.txt': '3' }), { maxFitxers: 2 });
    expect(await plena.llista()).toHaveLength(2);
    expect(plena.limitacions.map((l) => l.codi)).toEqual(['CARPETA_TRUNCADA']);
  });

  test('un recorregut sense permís dona FONT_ILLEGIBLE amb la causa', async () => {
    const error = await errorDe(fontDesDeHandle(new CarpetaFalsa('c', {}, { fallaRecorregut: true })).llista());
    expect(error.codi).toBe('FONT_ILLEGIBLE');
    expect(error.cause?.name).toBe('NotAllowedError');
  });

  test('llig amb midaMaxima, absent amb causa, info i fitxer (Blob de tipus segur, sense llegir bytes)', async () => {
    const arrel = arbreMultimedia({}, { 'pagina.html': '<script>alert(1)</script>', 'logo.svg': '<svg/>' });
    const font = fontDesDeHandle(arrel);
    expect(text(await font.llig('llegeix-me.txt'))).toBe('Llegeix-me\n');
    expect(await codi(font.llig('llegeix-me.txt', { midaMaxima: 4 }))).toBe('FITXER_MASSA_GRAN');
    const absent = await errorDe(font.llig('00_inbox/no.png'));
    expect(absent.codi).toBe('FITXER_ILLEGIBLE');
    expect(absent.cause?.name).toBe('NotFoundError');
    expect(await font.info('00_inbox/nota.md')).toEqual({ ruta: '00_inbox/nota.md', mida: 21, modificat: expect.any(Number) });
    const node = nodeFals(arrel, '00_inbox/nano_vinyeta.png');
    const blob = await font.fitxer('00_inbox/nano_vinyeta.png');
    expect(blob.type).toBe('image/png');
    expect(blob.size).toBe(72);
    expect(node.lectures).toBe(0);
    expect((await font.fitxer('pagina.html')).type).toBe('application/octet-stream');
    expect((await font.fitxer('logo.svg')).type).toBe('application/octet-stream');
  });

  test('escriu i les operacions només existixen amb getFileHandle; fontDesDeFitxers no en té cap', () => {
    const senseEscriure = { kind: 'directory', name: 'x', async *entries() { /* buida */ } };
    const font = fontDesDeHandle(senseEscriure);
    for (const metode of ['escriu', 'mou', 'reanomena', 'creaCarpeta', 'elimina']) {
      expect(font[metode]).toBeUndefined();
      expect(typeof fontDesDeHandle(new CarpetaFalsa('c'))[metode]).toBe('function');
      expect(fontDesDeFitxers([])[metode]).toBeUndefined();
    }
    expect(Object.isFrozen(font)).toBe(true);
    expect(() => fontDesDeHandle({ kind: 'file' })).toThrow(expect.objectContaining({ codi: 'PARAMETRES_INVALIDS' }));
  });

  test('oblidaFont torna cert una sola vegada i deixa el handle a null', async () => {
    const font = fontDesDeHandle(arbreMultimedia());
    await font.llista();
    expect(oblidaFont(font)).toBe(true);
    expect(oblidaFont(font)).toBe(false);
    expect(oblidaFont({})).toBe(false);
    expect(font.handle).toBeNull();
    expect(font.carpetes).toEqual([]);
    expect(font.limitacions).toEqual([]);
  });
});

describe('Font sobre fitxers (webkitdirectory)', () => {
  const fitxer = (rel, contingut) => {
    const f = new File([contingut], rel.split('/').pop(), { lastModified: 77 });
    Object.defineProperty(f, 'webkitRelativePath', { value: rel });
    return f;
  };

  test('nom, llista sense ocults, carpetes, llig, info i fitxer; només lectura', async () => {
    const font = fontDesDeFitxers([
      fitxer('_cultura_de_poble/a/nota.md', '# Nota\n'),
      fitxer('_cultura_de_poble/.DS_Store', 'x'),
      fitxer('_cultura_de_poble/a/b/foto.png', 'png'),
      fitxer('_cultura_de_poble/pagina.html', '<p>')
    ]);
    expect(font.nom).toBe('_cultura_de_poble');
    expect(font.handle).toBeNull();
    expect((await font.llista()).map((e) => e.ruta)).toEqual(['a/b/foto.png', 'a/nota.md', 'pagina.html']);
    expect(font.carpetes).toEqual(['a', 'a/b']);
    expect(text(await font.llig('a/nota.md'))).toBe('# Nota\n');
    expect(await codi(font.llig('a/nota.md', { midaMaxima: 2 }))).toBe('FITXER_MASSA_GRAN');
    expect(await codi(font.llig('a/no.md'))).toBe('FITXER_ILLEGIBLE');
    expect(await font.info('a/nota.md')).toEqual({ ruta: 'a/nota.md', mida: 7, modificat: 77 });
    expect((await font.fitxer('a/b/foto.png')).type).toBe('image/png');
    expect((await font.fitxer('pagina.html')).type).toBe('application/octet-stream');
    oblidaFont(font);
    expect(await codi(font.llista())).toBe('FONT_OBLIDADA');
    expect(font.carpetes).toEqual([]);
  });
});

describe('text', () => {
  const amb = (fills, opcions) => {
    const arrel = new CarpetaFalsa('t', fills, opcions);
    return { arrel, font: fontDesDeHandle(arrel) };
  };

  test('llig UTF-8 amb accents, BOM, salts, data i si és editable', async () => {
    const { font } = amb({
      'a.md': 'Plaça, cançó i l·lusió\n',
      'bom.txt': new Uint8Array([0xef, 0xbb, 0xbf, 0x68, 0x6f, 0x6c, 0x61, 0x0d, 0x0a]),
      'mixt.csv': 'a\r\nb\nc',
      'cr.txt': 'a\rb',
      'pla.json': '{}',
      'web.html': '<b>x</b>\n'
    });
    const a = await llegixTextLocal(font, 'a.md');
    expect(a).toEqual({ ruta: 'a.md', text: 'Plaça, cançó i l·lusió\n', mida: 28, ambBom: false, salts: 'lf', modificat: expect.any(Number), editable: true });
    const bom = await llegixTextLocal(font, 'bom.txt');
    expect(bom.text).toBe('hola\r\n');
    expect(bom.ambBom).toBe(true);
    expect(bom.salts).toBe('crlf');
    expect((await llegixTextLocal(font, 'mixt.csv')).salts).toBe('mixt');
    expect((await llegixTextLocal(font, 'cr.txt')).salts).toBe('mixt');
    expect((await llegixTextLocal(font, 'pla.json')).salts).toBeNull();
    const html = await llegixTextLocal(font, 'web.html');
    expect(html.editable).toBe(false);
    expect(html.text).toBe('<b>x</b>\n');
  });

  test('NO_ES_UTF8, NO_ES_TEXT (extensió i U+0000) i FITXER_MASSA_GRAN', async () => {
    const { font } = amb({
      'trencat.txt': new Uint8Array([0xc3, 0x28]),
      'binari.txt': new Uint8Array([0x61, 0x00, 0x62]),
      'foto.png': bytesPngFals(),
      'gran.md': 'x'.repeat(100)
    });
    expect(await codi(llegixTextLocal(font, 'trencat.txt'))).toBe('NO_ES_UTF8');
    expect(await codi(llegixTextLocal(font, 'binari.txt'))).toBe('NO_ES_TEXT');
    expect(await codi(llegixTextLocal(font, 'foto.png'))).toBe('NO_ES_TEXT');
    expect(await codi(llegixTextLocal(font, 'gran.md', { midaMaxima: 10 }))).toBe('FITXER_MASSA_GRAN');
  });

  test('saltsDeLiniaDe i codificaTextLocal (BOM i CRLF, sense duplicar cap \\r)', () => {
    expect(saltsDeLiniaDe('a\nb')).toBe('lf');
    expect(saltsDeLiniaDe('a\r\nb')).toBe('crlf');
    expect(saltsDeLiniaDe('a\r\nb\n')).toBe('mixt');
    expect(saltsDeLiniaDe('ab')).toBeNull();
    expect(Array.from(codificaTextLocal('a\r\nb\nc', { salts: 'crlf', ambBom: true }))).toEqual([0xef, 0xbb, 0xbf, 0x61, 0x0d, 0x0a, 0x62, 0x0d, 0x0a, 0x63]);
    expect(text(codificaTextLocal('a\r\nb\rc'))).toBe('a\nb\nc');
    expect(text(codificaTextLocal('à'))).toBe('à');
  });

  test('escriuTextLocal: no sobreescriu sense permís explícit i, amb ell, desa els bytes exactes', async () => {
    const { arrel, font } = amb({ 'n.md': 'vell' });
    expect(await codi(escriuTextLocal(font, 'n.md', 'nou'))).toBe('FITXER_JA_EXISTEIX');
    const llegit = await llegixTextLocal(font, 'n.md');
    const r = await escriuTextLocal(font, 'n.md', 'línia 1\nlínia 2', { sobreescriu: true, ambBom: true, salts: 'crlf', modificatEsperat: llegit.modificat });
    expect(r).toMatchObject({ ruta: 'n.md', sobreescrit: true });
    expect(r.modificat).toBe(nodeFals(arrel, 'n.md').modificat);
    expect(r.modificat).not.toBe(llegit.modificat);
    expect(Array.from(contingutFals(arrel, 'n.md').slice(0, 3))).toEqual([0xef, 0xbb, 0xbf]);
    expect(text(contingutFals(arrel, 'n.md').slice(3))).toBe('línia 1\r\nlínia 2');
    expect(await codi(escriuTextLocal(font, 'nou.md', 'hola'))).toBe('SENSE_ERROR');
    expect(textFals(arrel, 'nou.md')).toBe('hola');
  });

  test('escriuTextLocal: NOMES_LECTURA, ESCRIPTURA_NO_PERMESA i CONFLICTE_DISC (canviat o desaparegut)', async () => {
    const { arrel, font } = amb({ 'n.md': 'vell', 'foto.png': bytesPngFals() });
    expect(await codi(escriuTextLocal(fontDesDeFitxers([]), 'n.md', 'x', { sobreescriu: true }))).toBe('NOMES_LECTURA');
    expect(await codi(escriuTextLocal(font, 'foto.png', 'x', { sobreescriu: true }))).toBe('ESCRIPTURA_NO_PERMESA');
    expect(await codi(escriuTextLocal(font, 'n.md', 7, { sobreescriu: true }))).toBe('PARAMETRES_INVALIDS');
    const llegit = await llegixTextLocal(font, 'n.md');
    nodeFals(arrel, 'n.md').modificaDesDeFora('editat per Obsidian');
    const error = await errorDe(escriuTextLocal(font, 'n.md', 'meu', { sobreescriu: true, modificatEsperat: llegit.modificat }));
    expect(error.codi).toBe('CONFLICTE_DISC');
    expect(error.detall).toEqual({ modificat: nodeFals(arrel, 'n.md').modificat, mida: 19 });
    expect(textFals(arrel, 'n.md')).toBe('editat per Obsidian');
    await arrel.removeEntry('n.md');
    expect(await codi(escriuTextLocal(font, 'n.md', 'meu', { sobreescriu: true, modificatEsperat: llegit.modificat }))).toBe('CONFLICTE_DISC');
    expect(rutesFalses(arrel)).toEqual(['foto.png']);
  });

  test('escriuTextLocal amb una font que no és del motor: la versió esperada es comprova abans d’encuar', async () => {
    const aliena = {
      handle: null,
      info: vi.fn(async (ruta) => ({ ruta, mida: 3, modificat: 5 })),
      escriu: vi.fn(async (ruta, bytes) => ({ ruta, mida: bytes.byteLength, sobreescrit: true }))
    };
    expect(await codi(escriuTextLocal(aliena, 'n.md', 'x', { sobreescriu: true, modificatEsperat: 4 }))).toBe('CONFLICTE_DISC');
    expect(await codi(escriuTextLocal(aliena, 'n.md', 'x', { sobreescriu: true, modificatEsperat: 5, midaEsperada: 2 }))).toBe('CONFLICTE_DISC');
    expect(aliena.escriu).not.toHaveBeenCalled();
    const r = await escriuTextLocal(aliena, 'n.md', 'xyz', { sobreescriu: true, modificatEsperat: 5, midaEsperada: 3 });
    expect(r).toEqual({ ruta: 'n.md', mida: 3, sobreescrit: true, modificat: 5 });
    expect(aliena.escriu).toHaveBeenCalledWith('n.md', expect.any(Uint8Array), { sobreescriu: true });
  });

  test('creaFitxerMarkdownLocal: nom segur, cap sufix si ja existix, carpeta absent, nom buit i contingut', async () => {
    const { arrel, font } = amb({ notes: { 'acta.md': 'vella' } });
    const r = await creaFitxerMarkdownLocal(font, { carpeta: 'notes', nom: 'Acta: ple?' });
    expect(r).toEqual({ ruta: 'notes/Acta- ple-.md', nom: 'Acta- ple-.md', mida: 13 });
    expect(textFals(arrel, 'notes/Acta- ple-.md')).toBe('# Acta- ple-\n');
    expect(await codi(creaFitxerMarkdownLocal(font, { carpeta: 'notes', nom: 'acta' }))).toBe('FITXER_JA_EXISTEIX');
    expect(textFals(arrel, 'notes/acta.md')).toBe('vella');
    expect(rutesFalses(arrel).filter((ruta) => ruta.includes('(2)'))).toEqual([]);
    expect(await codi(creaFitxerMarkdownLocal(font, { carpeta: 'no-hi-és', nom: 'x' }))).toBe('CARPETA_NO_TROBADA');
    expect(carpetesFalses(arrel)).toEqual(['notes']);
    expect(await codi(creaFitxerMarkdownLocal(font, { carpeta: '../fora', nom: 'x' }))).toBe('RUTA_INVALIDA');
    const ara = () => new Date(2026, 9, 29, 17, 5).getTime();
    expect((await creaFitxerMarkdownLocal(font, { nom: '   ', ara })).ruta).toBe('nota-20261029-1705.md');
    expect((await creaFitxerMarkdownLocal(font, { carpeta: '(arrel)', nom: 'propi', contingut: 'cos' })).ruta).toBe('propi.md');
    expect(textFals(arrel, 'propi.md')).toBe('cos');
    expect(await codi(creaFitxerMarkdownLocal(fontDesDeFitxers([]), { nom: 'x' }))).toBe('NOMES_LECTURA');
  });

  test.each([
    ['CON', 'nota-20261029-1705.md'],
    ['lpt3.txt', 'nota-20261029-1705.md'],
    ['.ocult', 'ocult.md'],
    ['x.md', 'x.md'],
    ['x.MD', 'x.md'],
    ['  a   b  ', 'a b.md'],
    ['a\u0000b\u0007c', 'abc.md'],
    ['café', 'café.md'],
    ['foto‮gnp.exe', 'fotognp.exe.md'],
    ['a/b\\c:d*e?f"g<h>i|j', 'a-b-c-d-e-f-g-h-i-j.md'],
    ['---...nom...', 'nom.md'],
    ['', 'nota-20261029-1705.md']
  ])('nomSegurDeFitxerLocal(%j) → %j', (entrada, esperat) => {
    expect(nomSegurDeFitxerLocal(entrada, { ara: () => new Date(2026, 9, 29, 17, 5).getTime() })).toBe(esperat);
  });

  test('nomSegurDeFitxerLocal talla a 120 punts de codi i a 255 bytes; nomSegurDeCarpetaLocal', () => {
    expect(nomSegurDeFitxerLocal('a'.repeat(130))).toBe(`${'a'.repeat(120)}.md`);
    const emojis = nomSegurDeFitxerLocal('\u{1F600}'.repeat(100));
    expect(new TextEncoder().encode(emojis).byteLength).toBeLessThanOrEqual(255);
    expect(emojis).toBe(`${'\u{1F600}'.repeat(63)}.md`);
    expect(nomSegurDeFitxerLocal('x', { extensio: 'txt' })).toBe('x.txt');
    expect(nomSegurDeCarpetaLocal('a:b')).toBe('a-b');
    expect(nomSegurDeCarpetaLocal('')).toBeNull();
    expect(nomSegurDeCarpetaLocal('NUL')).toBeNull();
    expect(nomSegurDeCarpetaLocal('...')).toBeNull();
  });
});

describe('SHA-256 i duplicats exactes', () => {
  const cripto = webcrypto;

  test('el vector «abc» i SENSE_CRIPTO', async () => {
    const font = fontDesDeHandle(new CarpetaFalsa('h', { 'abc.txt': 'abc' }));
    expect(await calculaHashFitxerLocal(font, 'abc.txt', { cripto })).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(await codi(calculaHashFitxerLocal(font, 'abc.txt', { cripto: {} }))).toBe('SENSE_CRIPTO');
    expect(await codi(calculaHashFitxerLocal(font, 'abc.txt', { cripto, midaMaxima: 2 }))).toBe('FITXER_MASSA_GRAN');
  });

  test('només es lligen els de mida compartida; grups entre subcarpetes; els buits fora', async () => {
    const arrel = new CarpetaFalsa('d', {
      a: { 'u.bin': 'mateix', 'unic.bin': 'res-de-res-igual' },
      b: { 'v.bin': 'mateix', 'w.bin': 'altre!' },
      'buit1.txt': '',
      'buit2.txt': ''
    });
    const font = fontDesDeHandle(arrel);
    const entrades = await font.llista();
    const progres = vi.fn();
    const r = await cercaDuplicatsExactesLocals(font, entrades, { cripto, enProgres: progres });
    expect(r.grups).toEqual([{ hash: expect.stringMatching(/^[0-9a-f]{64}$/), mida: 6, rutes: ['a/u.bin', 'b/v.bin'] }]);
    expect(r.analitzats).toBe(3);
    expect(r.bytesLlegits).toBe(18);
    expect(r).toMatchObject({ omesos: [], truncat: false, cancellat: false });
    expect(nodeFals(arrel, 'a/unic.bin').lectures).toBe(0);
    expect(nodeFals(arrel, 'buit1.txt').lectures).toBe(0);
    expect(progres).toHaveBeenCalledTimes(3);
    expect(progres).toHaveBeenLastCalledWith({ fets: 3, total: 3, bytesLlegits: 18 });
    const index = indexaDuplicatsExactes(r.grups);
    expect(index.get('a/u.bin')).toEqual({ hash: r.grups[0].hash, altres: ['b/v.bin'] });
    expect(index.has('b/w.bin')).toBe(false);
  });

  test('pressupost (mai un grup a mitges), senyal avortat, il·legibles i un progrés que llança', async () => {
    const arrel = new CarpetaFalsa('d', {
      'a1.bin': 'aa', 'a2.bin': 'aa',
      'b1.bin': 'bbb', 'b2.bin': 'bbb', 'b3.bin': 'bbb',
      'c1.bin': new FitxerFals('c1.bin', 'cccc'), 'c2.bin': 'cccc'
    });
    const font = fontDesDeHandle(arrel);
    const entrades = await font.llista();
    const truncat = await cercaDuplicatsExactesLocals(font, entrades, { cripto, maxFitxers: 4 });
    expect(truncat.truncat).toBe(true);
    expect(truncat.grups.map((g) => g.rutes)).toEqual([['a1.bin', 'a2.bin']]);

    const control = new AbortController();
    control.abort();
    const lectures = () => rutesFalses(arrel).map((ruta) => nodeFals(arrel, ruta).lectures);
    const abans = lectures();
    const cancellat = await cercaDuplicatsExactesLocals(font, entrades, { cripto, senyal: control.signal });
    expect(cancellat).toMatchObject({ grups: [], cancellat: true, analitzats: 0 });
    expect(lectures()).toEqual(abans);

    nodeFals(arrel, 'c1.bin').fallaLectura = true;
    const ambOmes = await cercaDuplicatsExactesLocals(font, entrades, { cripto, enProgres: () => { throw new Error('UI trencada'); } });
    expect(ambOmes.omesos).toEqual([{ ruta: 'c1.bin', codi: 'FITXER_ILLEGIBLE' }]);
    expect(ambOmes.grups.map((g) => g.rutes)).toEqual([['a1.bin', 'a2.bin'], ['b1.bin', 'b2.bin', 'b3.bin']]);
    expect(await codi(cercaDuplicatsExactesLocals(font, entrades, { cripto: null }))).toBe('SENSE_CRIPTO');
  });
});

describe('WebP', () => {
  test('esBytesWebp, esBytesPdf, rutaBessonaWebp', () => {
    expect(esBytesWebp(bytesWebpFals())).toBe(true);
    expect(esBytesWebp(bytesPngFals())).toBe(false);
    expect(esBytesWebp(new Uint8Array(4))).toBe(false);
    expect(esBytesWebp('RIFF____WEBP')).toBe(false);
    expect(esBytesPdf(new TextEncoder().encode('%PDF-1.7'))).toBe(true);
    expect(esBytesPdf(bytesPngFals())).toBe(false);
    expect(rutaBessonaWebp('00_inbox/foto.PNG')).toBe('00_inbox/foto.webp');
  });

  test('desa a la bessona; amb el permís en prompt fa una petició; no sobreescriu sense confirmar', async () => {
    const arrel = arbreMultimedia({ permisos: { readwrite: 'prompt' } });
    const font = fontDesDeHandle(arrel);
    const ruta = rutaBessonaWebp('00_inbox/esbos_festa_tibi.png');
    const r = await desaWebpALaCarpetaLocal(font, ruta, bytesWebpFals(20));
    expect(r).toEqual({ ruta: '00_inbox/esbos_festa_tibi.webp', mida: 32, sobreescrit: false, modificat: nodeFals(arrel, ruta).modificat });
    expect(arrel.peticions).toEqual(['readwrite']);
    expect(await codi(desaWebpALaCarpetaLocal(font, ruta, bytesWebpFals(40)))).toBe('FITXER_JA_EXISTEIX');
    expect(contingutFals(arrel, ruta).byteLength).toBe(32);
    expect((await desaWebpALaCarpetaLocal(font, ruta, bytesWebpFals(40), { sobreescriu: true })).sobreescrit).toBe(true);
    expect(contingutFals(arrel, ruta).byteLength).toBe(52);
    expect(await codi(desaWebpALaCarpetaLocal(font, '00_inbox/x.webp', bytesPngFals()))).toBe('NO_ES_WEBP');
    expect(await codi(desaWebpALaCarpetaLocal(font, '00_inbox/x.png', bytesWebpFals()))).toBe('ESCRIPTURA_NO_PERMESA');
    expect(await codi(desaWebpALaCarpetaLocal(fontDesDeFitxers([]), 'x.webp', bytesWebpFals()))).toBe('NOMES_LECTURA');
    const denegada = fontDesDeHandle(arbreMultimedia({ permisos: { readwrite: 'prompt' }, demanats: { readwrite: 'denied' } }));
    expect(await codi(desaWebpALaCarpetaLocal(denegada, 'x.webp', bytesWebpFals()))).toBe('ESCRIPTURA_DENEGADA');
  });

  test('compatibilitat: desarWebpEnHandleLocal sobreescriu, crea carpetes i torna la ruta', async () => {
    const arrel = arbreMultimedia();
    expect(await desarWebpEnHandleLocal(arrel, '/nova/sub/x.webp', bytesWebpFals())).toBe('nova/sub/x.webp');
    expect(await desarWebpEnHandleLocal(arrel, 'nova/sub/x.webp', bytesWebpFals(30))).toBe('nova/sub/x.webp');
    expect(contingutFals(arrel, 'nova/sub/x.webp').byteLength).toBe(42);
    expect(await codi(desarWebpEnHandleLocal(arrel, 'x.png', bytesWebpFals()))).toBe('ESCRIPTURA_NO_PERMESA');
    expect(await codi(desarWebpEnHandleLocal(arrel, '../x.webp', bytesWebpFals()))).toBe('RUTA_INVALIDA');
    expect(await codi(desarWebpEnHandleLocal(null, 'x.webp', bytesWebpFals()))).toBe('NOMES_LECTURA');
  });

  test('«Desar .webp i moure l’original»: les rutes i quan s’oferix', () => {
    expect(CARPETA_ORIGINALS_RASTER).toBe('originals_raster_public');
    expect(rutaOriginalsRasterDe('00_inbox/x.png')).toBe('originals_raster_public/x.png');
    expect(rutaOriginalsRasterDe('00_inbox/a/b/x.png')).toBe('originals_raster_public/a/b/x.png');
    expect(rutaOriginalsRasterDe('x.png')).toBe('originals_raster_public/x.png');
    expect(potMoureOriginalRaster('00_inbox/x.png')).toBe(true);
    expect(potMoureOriginalRaster('x.jpg')).toBe(true);
    expect(potMoureOriginalRaster('originals_raster_public/x.png')).toBe(false);
    expect(potMoureOriginalRaster('Originals_Raster_Public/x.png')).toBe(false);
    expect(potMoureOriginalRaster('00_inbox/x.webp')).toBe(false);
    expect(potMoureOriginalRaster('../x.png')).toBe(false);
    expect(rutaDestiDeMoviment('00_inbox/nota.md', 'documents_i_pdfs')).toBe('documents_i_pdfs/nota.md');
    expect(rutaDestiDeMoviment('00_inbox/nota.md', '(arrel)')).toBe('nota.md');
    expect(rutaDestiDeMoviment('00_inbox/nota.md', '')).toBe('nota.md');
  });

  test('desa la .webp, mou l’original (creant carpetes només dins d’originals_raster_public) i l’anàlisi les aparella', async () => {
    const arrel = arbreMultimedia({}, { treball: { festa: { 'cartell.png': bytesPngFals(900, 4) } } });
    const font = fontDesDeHandle(arrel);
    const r = await desaWebpIMouOriginalLocal(font, 'treball/festa/cartell.png', bytesWebpFals(100));
    expect(r.webp).toEqual({ ruta: 'treball/festa/cartell.webp', mida: 112, sobreescrit: false, modificat: nodeFals(arrel, 'treball/festa/cartell.webp').modificat });
    expect(r.original).toEqual({ ruta: 'originals_raster_public/festa/cartell.png', origen: 'treball/festa/cartell.png', mida: 908, verificacio: 'bytes' });
    expect(nodeFals(arrel, 'treball/festa/cartell.png')).toBeNull();
    expect(contingutFals(arrel, 'originals_raster_public/festa/cartell.png')).toEqual(bytesPngFals(900, 4));
    const analisi = analitzaCarpetaMultimediaLocal(await font.llista());
    const perRuta = new Map(analisi.elements.map((e) => [e.ruta, e]));
    expect(perRuta.get('originals_raster_public/festa/cartell.png')).toMatchObject({
      teBessonaLocal: true, bessonaEntreCarpetes: true, bessonaWebpRuta: 'treball/festa/cartell.webp', inedita: false, duplicada: false, estalviBytes: 796
    });
    expect(perRuta.get('treball/festa/cartell.webp')).toMatchObject({
      teBessonaLocal: true, originalRasterRuta: 'originals_raster_public/festa/cartell.png', duplicada: false
    });
  });
});

describe('inspeccionaImatgeLocal', () => {
  test('passa midaMaxima, torna exif.camera com a objecte i un blob de MIME segur', async () => {
    const jpeg = jpegAmbExif({ ifd0: [{ tag: 0x010f, tipus: TIPUS.ASCII, valors: 'Canon' }, { tag: 0x0110, tipus: TIPUS.ASCII, valors: 'EOS' }] });
    const font = fontDesDeHandle(new CarpetaFalsa('i', { 'foto.jpg': jpeg }));
    const espia = { llig: vi.fn((ruta, opcions) => font.llig(ruta, opcions)) };
    const info = await inspeccionaImatgeLocal(espia, 'foto.jpg');
    expect(espia.llig).toHaveBeenCalledWith('foto.jpg', { midaMaxima: MAX_LECTURA_IMATGE_LOCAL_BYTES });
    expect(info.exif.camera).toEqual({ marca: 'Canon', model: 'EOS' });
    expect(info.mime).toBe('image/jpeg');
    expect(info.blob.type).toBe('image/jpeg');
    expect(info.dataUrl).toBeNull();
  });

  test('un SVG no fa cap blob: només data: (fins a 1 MiB) i sense EXIF', async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';
    const font = fontDesDeHandle(new CarpetaFalsa('i', { 'logo.svg': svg }));
    const info = await inspeccionaImatgeLocal(font, 'logo.svg');
    expect(info.blob).toBeNull();
    expect(info.mime).toBeNull();
    expect(info.exif).toBeNull();
    expect(info.dataUrl).toBe(`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`);
    expect(dataUrlSvgLocal(new Uint8Array(1024 * 1024 + 1))).toBeNull();
  });
});

describe('àlbum', () => {
  test('paginaLocal tanca la pàgina dins del rang', () => {
    const llista = Array.from({ length: 50 }, (_, i) => i);
    expect(paginaLocal(llista, 1)).toMatchObject({ pagina: 1, pagines: 3, total: 50 });
    expect(paginaLocal(llista, 1).elements).toHaveLength(24);
    expect(paginaLocal(llista, 3).elements).toEqual([48, 49]);
    expect(paginaLocal(llista, 99).pagina).toBe(3);
    expect(paginaLocal(llista, -4).pagina).toBe(1);
    expect(paginaLocal(llista, Number.NaN).pagina).toBe(1);
    expect(paginaLocal([], 2)).toEqual({ elements: [], pagina: 1, pagines: 1, total: 0 });
    expect(paginaLocal(llista, 2, 100).pagines).toBe(1);
  });

  test('creaRegistreUrlsLocals: només MIME de la llista blanca, revoca i revocaTot', () => {
    let n = 0;
    const urlApi = { createObjectURL: vi.fn(() => `blob:fals/${(n += 1)}`), revokeObjectURL: vi.fn() };
    const registre = creaRegistreUrlsLocals({ urlApi });
    const u1 = registre.crea(new Blob(['x'], { type: 'image/png' }));
    const u2 = registre.crea(new Blob(['x'], { type: 'video/mp4' }));
    expect(registre.crea(new Blob(['<p>'], { type: 'text/html' }))).toBeNull();
    expect(registre.crea(new Blob(['<svg/>'], { type: 'image/svg+xml' }))).toBeNull();
    expect(registre.crea(new Blob(['x']))).toBeNull();
    expect(registre.crea(null)).toBeNull();
    expect(registre.vives).toBe(2);
    expect(registre.revoca(u1)).toBe(true);
    expect(registre.revoca(u1)).toBe(false);
    registre.revocaTot();
    expect(registre.vives).toBe(0);
    expect(urlApi.revokeObjectURL.mock.calls.map((c) => c[0])).toEqual([u1, u2]);
  });

  test('etiquetesEstatLocal: exacte per hash davant del possible duplicat', () => {
    const el = { ruta: 'a.png', emparelladaWeb: true, teBessonaLocal: true, inedita: false, pesAlt: true, duplicada: true };
    expect(etiquetesEstatLocal(el)).toEqual(['publicada', 'bessonaWebp', 'pesAlt', 'possibleDuplicat']);
    expect(etiquetesEstatLocal(el, new Map([['a.png', {}]]))).toEqual(['publicada', 'bessonaWebp', 'pesAlt', 'duplicada']);
    expect(etiquetesEstatLocal({ ruta: 'b.png', inedita: true }, new Set(['a.png']))).toEqual(['inedita']);
    expect(etiquetesEstatLocal(null)).toEqual([]);
  });
});

describe('anàlisi: bessones entre carpetes', () => {
  test('un ràster i una webp amb el mateix nom en carpetes diferents són bessones, mai duplicades', () => {
    const r = analitzaCarpetaMultimediaLocal([
      { ruta: 'originals_raster_public/a/foto.png', mida: 600000 },
      { ruta: '00_inbox/a/foto.webp', mida: 100000 },
      { ruta: 'altres/foto.webp', mida: 90000 },
      { ruta: 'x/repetida.png', mida: 5000 },
      { ruta: 'y/repetida.png', mida: 7000 }
    ]);
    const perRuta = new Map(r.elements.map((e) => [e.ruta, e]));
    expect(perRuta.get('originals_raster_public/a/foto.png')).toMatchObject({
      teBessonaLocal: true, bessonaEntreCarpetes: true, bessonaWebpRuta: '00_inbox/a/foto.webp', inedita: false, duplicada: false, pesAlt: false, estalviBytes: 500000
    });
    /* Les dues webp amb el mateix nom sí que són possibles duplicades entre elles. */
    expect(perRuta.get('00_inbox/a/foto.webp')).toMatchObject({ originalRasterRuta: 'originals_raster_public/a/foto.png', duplicada: true, coincidenciesNom: ['altres/foto.webp'] });
    expect(perRuta.get('x/repetida.png')).toMatchObject({ duplicada: true, inedita: true, teBessonaLocal: false });
    expect(r.resum.totalBessonesLocals).toBe(3);
    expect(r.resum.estalviBessonesBytes).toBe(500000);
  });

  test('la parella de la mateixa carpeta té prioritat i el cens web porta l’origen', () => {
    const cens = new Map([['/assets/uploads/brain/x.webp', { titol: 'X', ambit: 'contingut', origen: 'ia', poble: 'tibi' }]]);
    const r = analitzaCarpetaMultimediaLocal([
      { ruta: 'originals_raster_public/assets/uploads/brain/x.jpg', mida: 10 },
      { ruta: 'a/y.png', mida: 10 },
      { ruta: 'a/y.webp', mida: 5 },
      { ruta: 'b/y.webp', mida: 5 }
    ], { cens });
    const perRuta = new Map(r.elements.map((e) => [e.ruta, e]));
    expect(perRuta.get('originals_raster_public/assets/uploads/brain/x.jpg').parellaWeb).toEqual({
      src: '/assets/uploads/brain/x.webp', titol: 'X', ambit: 'contingut', poble: 'tibi', origen: 'ia'
    });
    expect(perRuta.get('a/y.png')).toMatchObject({ bessonaWebpRuta: 'a/y.webp', bessonaEntreCarpetes: false });
    expect(suggerixPobleLocal({ ruta: 'x.jpg', parellaWeb: perRuta.get('originals_raster_public/assets/uploads/brain/x.jpg').parellaWeb }))
      .toMatchObject({ poble: { id: 'tibi' }, origen: 'ia', categoria: 'contingut' });
  });
});

describe('operacions físiques: el camí feliç', () => {
  test('mou per trossos, verifica el contingut byte a byte (per trossos) i esborra l’origen sense recursive', async () => {
    const arrel = arbreMultimedia({ midaTros: 7 });
    const font = fontDesDeHandle(arrel);
    const original = contingutFals(arrel, '00_inbox/nota.md');
    const r = await font.mou('00_inbox/nota.md', rutaDestiDeMoviment('00_inbox/nota.md', 'documents_i_pdfs'));
    expect(r).toEqual({ ruta: 'documents_i_pdfs/nota.md', origen: '00_inbox/nota.md', mida: 21, verificacio: 'bytes' });
    expect(contingutFals(arrel, 'documents_i_pdfs/nota.md')).toEqual(original);
    expect(nodeFals(arrel, '00_inbox/nota.md')).toBeNull();
    expect(arrel.registre.filter((e) => e[0] === 'write').map((e) => e[2])).toEqual([7, 7, 7]);
    expect(arrel.registre.filter((e) => e[0] === 'removeEntry')).toEqual([['removeEntry', '00_inbox/nota.md', { recursive: false }]]);
    /* QA-A02: cap fitxer sencer en memòria; l'origen d'ara i la còpia es comparen per trossos. */
    expect(arrel.registre.filter((e) => e[0] === 'arrayBuffer')).toEqual([]);
    expect(arrel.registre.filter((e) => e[0] === 'llegeixTros').map((e) => e.slice(1)))
      .toEqual([['00_inbox/nota.md', 0, 21], ['documents_i_pdfs/nota.md', 0, 21]]);
  });

  test('el permís readwrite és la primera espera: la petició va abans de tocar cap carpeta', async () => {
    const arrel = arbreMultimedia({ permisos: { readwrite: 'prompt' } });
    const font = fontDesDeHandle(arrel);
    await font.mou('llegeix-me.txt', '00_inbox/llegeix-me.txt');
    const primeraPeticio = arrel.registre.findIndex((e) => e[0] === 'request');
    const primerAcces = arrel.registre.findIndex((e) => ['getDirectoryHandle', 'getFileHandle', 'getFile'].includes(e[0]));
    expect(primeraPeticio).toBeGreaterThanOrEqual(0);
    expect(primeraPeticio).toBeLessThan(primerAcces);
    expect(arrel.peticions).toEqual(['readwrite']);
  });

  test('reanomena conserva l’extensió tal com és al disc', async () => {
    const arrel = new CarpetaFalsa('r', { a: { 'foto.PNG': bytesPngFals(), 'b.md': 'b' } });
    const font = fontDesDeHandle(arrel);
    expect((await font.reanomena('a/foto.PNG', 'festa major')).ruta).toBe('a/festa major.PNG');
    expect((await font.reanomena('a/festa major.PNG', 'cartell.png')).ruta).toBe('a/cartell.PNG');
    expect((await font.reanomena('a/cartell.PNG', 'foto.de.la.festa')).ruta).toBe('a/foto.de.la.festa.PNG');
    expect((await font.reanomena('a/b.md', 'Acta: ple')).ruta).toBe('a/Acta- ple.md');
    expect(rutesFalses(arrel)).toEqual(['a/Acta- ple.md', 'a/foto.de.la.festa.PNG']);
  });

  test('creaCarpeta: el pare ha d’existir, el nom es neteja i no se’n trepitja cap', async () => {
    const arrel = arbreMultimedia();
    const font = fontDesDeHandle(arrel);
    expect(await font.creaCarpeta('documents_i_pdfs/2026')).toEqual({ ruta: 'documents_i_pdfs/2026' });
    expect(await font.creaCarpeta('festa: major')).toEqual({ ruta: 'festa- major' });
    expect(await codi(font.creaCarpeta('documents_i_pdfs/2026'))).toBe('FITXER_JA_EXISTEIX');
    expect(await codi(font.creaCarpeta('llegeix-me.txt'))).toBe('FITXER_JA_EXISTEIX');
    expect(await codi(font.creaCarpeta('no/hi/és'))).toBe('CARPETA_NO_TROBADA');
    expect(await codi(font.creaCarpeta('a/CON'))).toBe('NOM_INVALID');
    expect(carpetesFalses(arrel)).toContain('documents_i_pdfs/2026');
    expect(arrel.registre.filter((e) => e[0] === 'getDirectoryHandle' && e[2].create).map((e) => e[1])).toEqual(['documents_i_pdfs/2026', 'festa- major']);
  });

  test('elimina: fitxers i carpetes buides, mai recursive; la llista nova ja no els porta', async () => {
    const arrel = arbreMultimedia({}, { buida: {} });
    const font = fontDesDeHandle(arrel);
    expect(await font.elimina('00_inbox/nota.md')).toEqual({ ruta: '00_inbox/nota.md', tipus: 'fitxer' });
    expect(await font.elimina('buida')).toEqual({ ruta: 'buida', tipus: 'carpeta' });
    expect(await codi(font.elimina('documents_i_pdfs'))).toBe('CARPETA_NO_BUIDA');
    expect(await codi(font.elimina('00_inbox/nota.md'))).toBe('FITXER_ILLEGIBLE');
    expect((await font.llista()).map((e) => e.ruta)).not.toContain('00_inbox/nota.md');
    expect(font.carpetes).not.toContain('buida');
    expect(arrel.registre.filter((e) => e[0] === 'removeEntry').every((e) => e[2].recursive === false)).toBe(true);
  });
});

describe('reexportacions', () => {
  test('la interfície importa d’un sol lloc la biblioteca, els permisos i el suggeriment', () => {
    expect(typeof creaBibliotecaCarpetesLocals).toBe('function');
    expect(typeof verificaPermisCarpetaLocal).toBe('function');
    expect(typeof suggerixPobleLocal).toBe('function');
  });
});
