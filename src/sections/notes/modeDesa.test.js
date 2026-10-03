/* T7C (P1) · modeDesa.js: el Snippet Curador a la URL del Bloc, i el
   bookmarklet del comentari del mòdul, executat. Dades sintètiques. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import {
  CLAUS_BLOC, CLAUS_DESA, MODE_DESA, carpetaDeDesa, entradaDeDesa, esModeDesa, escriuDesa, llegixDesa, paramsDeLaNota
} from './modeDesa.js';
import { CARPETA_CONNECTATS } from './carpetes.js';

const CARPETES = Object.freeze([
  { id: 'f-mur', nom: 'Mur', parentId: null },
  { id: 'f-tic', nom: 'TIC', parentId: null },
  { id: 'f-foto', nom: 'Foto', parentId: 'f-tic' }
]);
const URL_PROVA = 'https://exemple.org/article';

describe('les claus', () => {
  test('mode=desa obri el snippet; la nota del Bloc es diu «nota»', () => {
    expect(MODE_DESA).toBe('desa');
    expect(CLAUS_DESA).toEqual({ mode: 'mode', categoria: 'categoria', etiqueta: 'etiqueta', emoticona: 'emoticona' });
    expect(CLAUS_BLOC).toEqual({ item: 'nota' });
  });

  test('esModeDesa: només amb mode=desa, i accepta text o URLSearchParams', () => {
    expect(esModeDesa(new URLSearchParams('mode=desa&url=x'))).toBe(true);
    expect(esModeDesa('mode=desa')).toBe(true);
    expect(esModeDesa('mode=entrar')).toBe(false);
    expect(esModeDesa('nota=n1')).toBe(false);
    expect(esModeDesa(null)).toBe(false);
  });
});

describe('carpetaDeDesa', () => {
  test('la de la URL si és del Bloc (també niada); si no, la Safata d’Entrada', () => {
    expect(carpetaDeDesa('mode=desa&carpeta=f-foto', CARPETES)).toBe('f-foto');
    expect(carpetaDeDesa('mode=desa&carpeta=f-inventada', CARPETES)).toBe(CARPETA_CONNECTATS);
    expect(carpetaDeDesa('mode=desa', CARPETES)).toBe(CARPETA_CONNECTATS);
    expect(carpetaDeDesa('mode=desa&carpeta=', CARPETES)).toBe(CARPETA_CONNECTATS);
  });
});

describe('llegixDesa', () => {
  test('el contingut de fora amb les regles de /connectar, i la tria', () => {
    const lectura = llegixDesa(`mode=desa&url=${encodeURIComponent(URL_PROVA)}&titol=Un+article&categoria=Sistema&categoria=+Hort+&categoria=Sistema&etiqueta=Reg&emoticona=%F0%9F%8D%85`);
    expect(lectura.contingut).toEqual({
      ok: true,
      valor: { url: URL_PROVA, lloc: 'exemple.org', titol: 'Un article', subtitol: '', entradilla: '' }
    });
    expect(lectura.categories).toEqual(['Sistema', 'Hort']);
    expect(lectura.etiquetes).toEqual(['Reg']);
    expect(lectura.emoticona).toBe('🍅');
  });

  test('sense adreça, cap contingut; una adreça que no és web, el motiu', () => {
    expect(llegixDesa('mode=desa').contingut).toBeNull();
    const dolenta = llegixDesa('mode=desa&url=javascript%3Aalert(1)').contingut;
    expect(dolenta.ok).toBe(false);
    expect(dolenta.errors.url).toMatch(/http o https/);
  });

  test('una emoticona que no és un sol emoji no compta', () => {
    expect(llegixDesa('mode=desa&emoticona=hola').emoticona).toBe('');
    expect(llegixDesa('mode=desa&emoticona=%F0%9F%8D%85%F0%9F%8D%85').emoticona).toBe('');
    expect(llegixDesa('mode=desa').emoticona).toBe('');
  });
});

describe('escriuDesa', () => {
  const BASE = `mode=desa&url=${encodeURIComponent(URL_PROVA)}&titol=T`;

  test('escriu cada camp i conserva la resta de la consulta', () => {
    const next = escriuDesa(BASE, { carpeta: 'f-foto', categories: ['Sistema', 'Hort'], etiquetes: ['Reg'], emoticona: '🍅' });
    expect(next.get('mode')).toBe('desa');
    expect(next.get('url')).toBe(URL_PROVA);
    expect(next.get('titol')).toBe('T');
    expect(next.get('carpeta')).toBe('f-foto');
    expect(next.getAll('categoria')).toEqual(['Sistema', 'Hort']);
    expect(next.getAll('etiqueta')).toEqual(['Reg']);
    expect(next.get('emoticona')).toBe('🍅');
  });

  test('undefined no toca; una llista substituïx o, buida, esborra; una emoticona buida s’esborra', () => {
    const abans = escriuDesa(BASE, { carpeta: 'f-mur', categories: ['Sistema'], etiquetes: ['Reg', 'Hort'], emoticona: '🍅' });
    const despres = escriuDesa(abans, { etiquetes: [], emoticona: '' });
    expect(despres.get('carpeta')).toBe('f-mur');
    expect(despres.getAll('categoria')).toEqual(['Sistema']);
    expect(despres.has('etiqueta')).toBe(false);
    expect(despres.has('emoticona')).toBe(false);
    expect(escriuDesa(abans, { emoticona: 'text' }).has('emoticona')).toBe(false);
    expect(escriuDesa(abans, {}).toString()).toBe(abans.toString());
  });

  test('anada i tornada: el que s’escriu és el que es llig', () => {
    const tria = { categories: ['Sistema'], etiquetes: ['Reg', 'Hort'], emoticona: '🍅' };
    const lectura = llegixDesa(escriuDesa(BASE, { carpeta: 'f-foto', ...tria }));
    expect({ categories: lectura.categories, etiquetes: lectura.etiquetes, emoticona: lectura.emoticona }).toEqual(tria);
    expect(carpetaDeDesa(escriuDesa(BASE, { carpeta: 'f-foto' }), CARPETES)).toBe('f-foto');
  });
});

describe('paramsDeLaNota', () => {
  test('la consulta del Bloc amb la nota, sense res del snippet', () => {
    expect(paramsDeLaNota({ carpeta: 'f-foto', nota: 'n9' }).toString()).toBe('carpeta=f-foto&nota=n9');
    expect(paramsDeLaNota({ carpeta: 'f-foto' }).toString()).toBe('carpeta=f-foto');
  });
});

describe('entradaDeDesa', () => {
  const valor = llegixDesa(`url=${encodeURIComponent(URL_PROVA)}&titol=Un+article&entradilla=Resum`).contingut.valor;

  test('notaDeContingutExtern a la carpeta triada, amb categories, etiquetes i emoticona', () => {
    const entrada = entradaDeDesa(valor, { carpeta: 'f-foto', categories: ['Sistema'], etiquetes: ['Reg'], emoticona: '🍅' });
    expect(entrada).toMatchObject({
      title: 'Un article',
      lead: 'Resum',
      folderId: 'f-foto',
      categories: ['Sistema'],
      tags: ['Reg'],
      icon: '🍅',
      origen: { tipus: 'extern', url: URL_PROVA, titol: 'Un article' }
    });
    expect(entrada.content).toContain(`href="${URL_PROVA}"`);
  });

  test('sense tria, ni categories, ni etiquetes, ni emoticona; sense carpeta, la Safata', () => {
    const entrada = entradaDeDesa(valor);
    expect(entrada.folderId).toBe(CARPETA_CONNECTATS);
    expect(['categories', 'tags', 'icon'].filter((camp) => camp in entrada)).toEqual([]);
  });

  test('un contingut que no val no fa cap entrada', () => {
    expect(entradaDeDesa({ url: 'ftp://exemple.org', titol: 'X' })).toBeNull();
  });
});

describe('el bookmarklet del comentari', () => {
  const font = readFileSync(path.join(process.cwd(), 'src/sections/notes/modeDesa.js'), 'utf8');
  const trobat = font.match(/BOOKMARKLET: javascript:(.+)$/m);

  /* L'executa com ho faria el navegador, amb la pàgina de fora simulada. */
  function executa({ href, titol = '', seleccio = null }) {
    const oberts = [];
    const bookmarklet = new Function('location', 'document', 'getSelection', 'open', trobat[1]);
    bookmarklet({ href }, { title: titol }, () => seleccio, (url, nom, opcions) => { oberts.push({ url, nom, opcions }); });
    return oberts;
  }

  test('el comentari porta el bookmarklet', () => {
    expect(trobat).not.toBeNull();
  });

  test('obri una finestra amb un snippet vàlid: url, títol i el text seleccionat', () => {
    const [obert, ...resta] = executa({ href: URL_PROVA, titol: 'Un article', seleccio: '  Un tros triat  ' });
    expect(resta).toEqual([]);
    const desti = new URL(obert.url);
    expect(`${desti.origin}${desti.pathname}`).toBe('https://socdepoble.org/notes');
    expect(obert.opcions).toBe('width=480,height=720');
    expect(esModeDesa(desti.searchParams)).toBe(true);
    expect(llegixDesa(desti.searchParams).contingut).toEqual({
      ok: true,
      valor: { url: URL_PROVA, lloc: 'exemple.org', titol: 'Un article', subtitol: '', entradilla: 'Un tros triat' }
    });
  });

  test('sense selecció no hi ha entradeta, i un títol llarg es talla al límit i continua sent vàlid', () => {
    const [obert] = executa({ href: URL_PROVA, titol: 'a'.repeat(1000), seleccio: null });
    const desti = new URL(obert.url);
    expect(desti.searchParams.has('entradilla')).toBe(false);
    const { contingut } = llegixDesa(desti.searchParams);
    expect(contingut.ok).toBe(true);
    expect(contingut.valor.titol).toHaveLength(300);
  });

  /* Correcció T7C-R5 · La consulta que obri la finestra arriba al servidor
     de Sóc de Poble abans de cap clic: el fragment (#access_token=… d'una
     tornada OAuth, l'ancoratge d'una pàgina) no hi viatja. La consulta de la
     pàgina sí: sovint és l'adreça mateixa (?v=…). */
  test('el fragment de la pàgina no viatja: l’adreça s’envia sense #, amb la seua consulta', () => {
    const [obert] = executa({ href: `${URL_PROVA}?v=7#access_token=sintetic-no-real&estat=x`, titol: 'T' });
    const desti = new URL(obert.url);
    expect(desti.searchParams.get('url')).toBe(`${URL_PROVA}?v=7`);
    expect(obert.url).not.toContain('access_token');
    expect(llegixDesa(desti.searchParams).contingut.valor.url).toBe(`${URL_PROVA}?v=7`);
  });

  test('una selecció llarga es talla al límit de l’entradeta', () => {
    const [obert] = executa({ href: URL_PROVA, titol: 'T', seleccio: 'b'.repeat(1000) });
    const { contingut } = llegixDesa(new URL(obert.url).searchParams);
    expect(contingut.ok).toBe(true);
    expect(contingut.valor.entradilla).toHaveLength(256);
  });
});
