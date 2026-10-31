// @vitest-environment node
/* IDEA-55 + P1-71 (Onada 261029_1605, Bloc E) · El model pur de l'espai de
   treball de /multimedia: ids opacs i salats, categories, ítems, selecció
   efectiva de la URL i paràmetres que s'hi escriuen. */
import { describe, expect, test } from 'vitest';
import {
  ARREL_LOCAL, CATEGORIA_PORTADA, GALERIA_CRONOLOGIA, GALERIA_IAIA, GALERIA_TOTS, ITEM_PORTADA, MAX_ARXIUS_A_LA_LLISTA,
  PREFIX_ARXIU_LOCAL, PREFIX_CARPETA_LOCAL, TOT, construeixCategoriesMultimedia, construeixItemsMultimedia, demandaDeLaUrl,
  esIdLocal, hash53, idArxiuLocal, idCarpetaLocal, idVistaDe, indexaArbreLocal, itemPerDefecte, mateixaSeleccio, mitjansValids,
  paramsDeSeleccio, seleccioEfectiva, subtitolLocal
} from './arbreMultimedia.js';

const TEXTOS = Object.freeze({
  titol: 'Arxiu visual',
  senseData: 'Sense data',
  portada: 'Arxiu Visual i Gestor d’Arxius',
  portadaSubtitol: 'Fototeca publicada i carpetes del teu ordinador',
  galeriaTots: 'Galeria publicada · Tots',
  galeriaIaia: 'Creacions IAIA / Nano Banana',
  cronologia: 'Cronologia per mesos',
  local: 'Carpeta local · Volums muntats',
  vistaCarpeta: 'Fototeca de «{nom}»',
  imatges: '{n} imatges',
  arxius: '{n} arxius · {pes}',
  document: 'Document',
  senseTitol: 'Imatge sense títol',
  llistaRetallada: 'La llista mostra {n} de {total} arxius; la Fototeca els té tots.',
  insignies: {
    publicada: 'Publicada', bessonaWebp: 'Bessona WebP', inedita: 'Inèdita', pesAlt: 'Pes alt', duplicada: 'Duplicada',
    possibleDuplicat: 'Possible duplicat'
  }
});

const SAL = '6f1c2e44-9a3b-4f7d-8c55-1d2e3f4a5b6c';
const el = (ruta, extra = {}) => {
  const barra = ruta.lastIndexOf('/');
  const nom = ruta.slice(barra + 1);
  const punt = nom.lastIndexOf('.');
  const ext = punt > 0 ? nom.slice(punt + 1) : '';
  const imatge = ['png', 'jpg', 'webp', 'svg'].includes(ext);
  return {
    ruta, nom, carpeta: barra > 0 ? ruta.slice(0, barra) : '', ext, tipus: imatge ? 'imatge' : 'text',
    vista: imatge ? (ext === 'svg' ? 'svg' : 'imatge') : 'text', mida: 2048, modificat: Date.UTC(2026, 9, 1), ...extra
  };
};

describe('ids opacs', () => {
  test('deterministes, amb prefix, sense rutes, noms ni extensions; la sal els canvia i l’arrel és local_root', () => {
    const carpeta = idCarpetaLocal(SAL, '00_inbox/esbossos');
    const arxiu = idArxiuLocal(SAL, '00_inbox/nota.md');
    expect(idCarpetaLocal(SAL, '00_inbox/esbossos')).toBe(carpeta);
    expect(idArxiuLocal(SAL, '00_inbox/nota.md')).toBe(arxiu);
    expect(carpeta.startsWith(PREFIX_CARPETA_LOCAL)).toBe(true);
    expect(arxiu.startsWith(PREFIX_ARXIU_LOCAL)).toBe(true);
    for (const id of [carpeta, arxiu]) {
      expect(id).not.toMatch(/\/|inbox|nota|esbossos|\.md/);
      expect(id).toMatch(/^__l[cf]_[0-9a-z]+$/);
    }
    expect(idCarpetaLocal('una-altra-sal', '00_inbox/esbossos')).not.toBe(carpeta);
    expect(idArxiuLocal('una-altra-sal', '00_inbox/nota.md')).not.toBe(arxiu);
    expect(idCarpetaLocal(SAL, '')).toBe(ARREL_LOCAL);
    expect(hash53('a')).not.toBe(hash53('b'));
  });

  test('E4 · dos volums d’esta sessió (sal aleatòria) amb la mateixa ruta donen ids diferents; sense sal, un diccionari no basta', () => {
    const a = `sessio:fitxers:${globalThis.crypto.randomUUID()}`;
    const b = `sessio:fitxers:${globalThis.crypto.randomUUID()}`;
    expect(idCarpetaLocal(a, '00_inbox')).not.toBe(idCarpetaLocal(b, '00_inbox'));
    /* L'id d'abans (un comptador, «sessio:fitxers:1») es podia revertir provant noms habituals. */
    const diccionari = ['00_inbox', 'documents_i_pdfs', 'originals_raster_public'];
    const id = idCarpetaLocal(a, '00_inbox');
    expect(diccionari.filter((nom) => idCarpetaLocal('sessio:fitxers:1', nom) === id)).toEqual([]);
  });

  test('les col·lisions es resolen amb _2, _3… en l’ordre de les rutes', () => {
    const index = indexaArbreLocal({
      sal: SAL,
      carpetes: ['b', 'a'],
      elements: [el('b/y.md'), el('a/x.md')],
      hash: () => 'x'
    });
    expect(index.categories.map((c) => c.id)).toEqual(['__lc_x', '__lc_x_2']);
    expect(index.idDeCarpeta.get('a')).toBe('__lc_x');
    expect(index.idDeCarpeta.get('b')).toBe('__lc_x_2');
    expect(index.idDArxiu.get('a/x.md')).toBe('__lf_x');
    expect(index.idDArxiu.get('b/y.md')).toBe('__lf_x_2');
    expect(index.arxiuDeId.get('__lf_x_2').ruta).toBe('b/y.md');
  });

  test('esIdLocal reconeix l’arrel, les carpetes, els arxius i les seues vistes; res més', () => {
    expect(esIdLocal(ARREL_LOCAL)).toBe(true);
    expect(esIdLocal(idVistaDe(ARREL_LOCAL))).toBe(true);
    expect(esIdLocal('__lc_abc')).toBe(true);
    expect(esIdLocal('__lf_abc')).toBe(true);
    expect(esIdLocal(idVistaDe('__lc_abc'))).toBe(true);
    expect(esIdLocal(GALERIA_TOTS)).toBe(false);
    expect(esIdLocal('town-tibi')).toBe(false);
    expect(esIdLocal(null)).toBe(false);
  });
});

describe('categories', () => {
  test('ordre: portada, les tres galeries, els mesos (fills de la Cronologia, en la llengua) i Carpeta local amb les carpetes', () => {
    const index = indexaArbreLocal({ sal: SAL, carpetes: ['00_inbox', 'a/b/c'], elements: [el('00_inbox/x.png')] });
    const categories = construeixCategoriesMultimedia({
      grupsMes: [{ key: '2026-08', items: [] }, { key: 'sense-data', items: [] }], index, textos: TEXTOS, locale: 'es-ES'
    });
    expect(categories.slice(0, 7).map((c) => c.id)).toEqual([
      CATEGORIA_PORTADA, GALERIA_TOTS, GALERIA_IAIA, GALERIA_CRONOLOGIA, 'mes_2026-08', 'mes_sense-data', ARREL_LOCAL
    ]);
    expect(categories[0].label).toBe('Arxiu Visual i Gestor d’Arxius');
    expect(categories[4]).toMatchObject({ parentId: GALERIA_CRONOLOGIA, label: 'Agosto de 2026' });
    expect(categories[5].label).toBe('Sense data');
    const locals = categories.slice(7);
    /* Les mares que falten (a, a/b) també hi són, i el pare d'una carpeta de primer nivell és local_root. */
    expect(locals.map((c) => c.label)).toEqual(['00_inbox', 'a', 'b', 'c']);
    expect(locals[0].parentId).toBe(ARREL_LOCAL);
    expect(locals[3].parentId).toBe(locals[2].id);
    expect(locals[2].parentId).toBe(locals[1].id);
    /* Gauntlet 261029 (cicle 1) · Triada, «Carpeta local» es desplega sola; cap altra arrel ho demana. */
    expect(categories.filter((c) => c.expandOnSelect === true).map((c) => c.id)).toEqual([ARREL_LOCAL]);
  });

  test('un nom amb controls de direcció del text es pinta amb «�» (cap extensió falsejada)', () => {
    const index = indexaArbreLocal({ sal: SAL, carpetes: ['noms‮rars'], elements: [el('noms‮rars/RTL_‮gnp.md')] });
    const categories = construeixCategoriesMultimedia({ grupsMes: [], index, textos: TEXTOS });
    expect(categories.at(-1).label).toBe('noms�rars');
  });

  test('sense volum obert, Carpeta local no té fills', () => {
    const categories = construeixCategoriesMultimedia({ grupsMes: [], index: null, textos: TEXTOS });
    expect(categories.map((c) => c.id)).toEqual([CATEGORIA_PORTADA, GALERIA_TOTS, GALERIA_IAIA, GALERIA_CRONOLOGIA, ARREL_LOCAL]);
  });
});

describe('ítems', () => {
  const hostil = JSON.parse('{"toString":0}');
  const totes = [
    { id: 'town-tibi', title: 'Tibi', tag: 'Poble', src: '/assets/towns/tibi/1.jpg', created_at: '2026-08-16T08:00:00.000Z' },
    { id: 'nano-mur', title: 'Mur', tag: 'Arxiu', src: '/assets/nano_cards/mur.jpg', created_at: '2023-01-01T00:00:00Z' },
    { id: '__intro', title: 'Intrús' },
    { id: 'town-tibi', title: 'Repetit' },
    { id: 'hostil', title: hostil, tag: hostil, src: hostil }
  ];
  const grupsMes = [{ key: '2026-08', items: [totes[0]] }, { key: '2023-01', items: [totes[1]] }];

  test('catàleg: categories de cada foto (IAIA només si és d’IA), cap id «__…», cap repetit, cap objecte com a text', () => {
    const items = construeixItemsMultimedia({ cataleg: { totes, deLaIaia: [totes[1]], grupsMes }, textos: TEXTOS });
    const tibi = items.find((i) => i.id === 'town-tibi');
    const mur = items.find((i) => i.id === 'nano-mur');
    expect(tibi.categoryIds).toEqual([GALERIA_TOTS, GALERIA_CRONOLOGIA, 'mes_2026-08']);
    expect(mur.categoryIds).toEqual([GALERIA_TOTS, GALERIA_CRONOLOGIA, 'mes_2023-01', GALERIA_IAIA]);
    expect(tibi.subtitle).toMatch(/^Poble · Agost de?l? 2026$/);
    expect(items.filter((i) => i.id === 'town-tibi')).toHaveLength(1);
    expect(items.some((i) => i.title === 'Intrús')).toBe(false);
    const h = items.find((i) => i.id === 'hostil');
    expect([h.title, h.image, typeof h.subtitle]).toEqual(['Imatge sense títol', undefined, 'string']);
    expect(mitjansValids(totes).map((m) => m.id)).toEqual(['town-tibi', 'nano-mur', 'hostil']);
  });

  test('ordre del model: portada, vistes de galeria (amb la data més nova), vista local i després el catàleg', () => {
    const items = construeixItemsMultimedia({ cataleg: { totes, deLaIaia: [totes[1]], grupsMes }, textos: TEXTOS });
    expect(items.slice(0, 7).map((i) => i.id)).toEqual([
      ITEM_PORTADA, idVistaDe(GALERIA_TOTS), idVistaDe(GALERIA_IAIA), idVistaDe(GALERIA_CRONOLOGIA), idVistaDe('mes_2026-08'),
      idVistaDe('mes_2023-01'), idVistaDe(ARREL_LOCAL)
    ]);
    const vistaTots = items[1];
    expect(vistaTots).toMatchObject({ title: 'Fototeca de «Galeria publicada · Tots»', subtitle: '3 imatges', updatedAt: '2026-08-16T08:00:00.000Z' });
    expect(items[6].title).toBe('Carpeta local · Volums muntats');
  });

  test('locals: només els directes de la carpeta activa, més el seleccionat; la vista la primera, amb la data més nova', () => {
    const elements = [
      el('00_inbox/a.png', { modificat: Date.UTC(2026, 9, 2) }),
      el('00_inbox/nota.md'),
      el('00_inbox/sub/b.png', { modificat: Date.UTC(2026, 9, 9) }),
      el('documents/acta.md')
    ];
    const index = indexaArbreLocal({ sal: SAL, carpetes: [], elements });
    const items = construeixItemsMultimedia({
      index, elements, nomVolum: '_multimedia', carpetaActiva: '00_inbox', rutaSeleccionada: 'documents/acta.md',
      miniatures: new Map([['00_inbox/a.png', 'blob:prova/1']]), textos: TEXTOS, icones: { tipus: { imatge: 'I', text: 'T', document: 'D' } }
    });
    const locals = items.filter((i) => i.id.startsWith(PREFIX_ARXIU_LOCAL));
    expect(locals.map((i) => i.title)).toEqual(['a.png', 'nota.md', 'acta.md']);
    expect(locals[0]).toMatchObject({ image: 'blob:prova/1', icon: 'I', categoryIds: [index.idDeCarpeta.get('00_inbox')] });
    expect(locals[1].image).toBeUndefined();
    expect(locals[2].categoryIds).toEqual([index.idDeCarpeta.get('documents')]);
    const vista = items.find((i) => i.id === idVistaDe(index.idDeCarpeta.get('00_inbox')));
    expect(vista).toMatchObject({ title: 'Fototeca de «00_inbox»', subtitle: '3 arxius · 6 KB' });
    /* La data de la vista és la més nova (també la de les subcarpetes): amb l'ordenació per data, va la primera. */
    expect(vista.updatedAt).toBe(new Date(Date.UTC(2026, 9, 9)).toISOString());
    expect(items.find((i) => i.id === idVistaDe(ARREL_LOCAL)).title).toBe('Fototeca de «_multimedia»');
    for (const item of locals) expect(item.id).not.toMatch(/inbox|nota|acta/);
  });

  test(`el tall a ${MAX_ARXIUS_A_LA_LLISTA}: les més recents, i la vista ho diu`, () => {
    const elements = Array.from({ length: MAX_ARXIUS_A_LA_LLISTA + 5 }, (_, i) => el(`gran/f${i}.md`, { modificat: 1000 + i }));
    const index = indexaArbreLocal({ sal: SAL, carpetes: [], elements });
    const items = construeixItemsMultimedia({ index, elements, carpetaActiva: 'gran', textos: TEXTOS });
    const locals = items.filter((i) => i.id.startsWith(PREFIX_ARXIU_LOCAL));
    expect(locals).toHaveLength(MAX_ARXIUS_A_LA_LLISTA);
    expect(locals.some((i) => i.title === 'f0.md')).toBe(false);
    expect(items.find((i) => i.id === idVistaDe(index.idDeCarpeta.get('gran'))).subtitle)
      .toBe(`La llista mostra ${MAX_ARXIUS_A_LA_LLISTA} de ${MAX_ARXIUS_A_LA_LLISTA + 5} arxius; la Fototeca els té tots.`);
  });
});

describe('subtitolLocal', () => {
  test('carpeta · KB · ESTATS en majúscules; DOCUMENT per a tot el que no és una imatge', () => {
    const publicada = el('a/x.png', { emparelladaWeb: true, teBessonaLocal: true, mida: 4096 });
    expect(subtitolLocal(publicada, null, TEXTOS)).toBe('a · 4 KB · PUBLICADA · BESSONA WEBP');
    const inedita = el('x.png', { inedita: true, pesAlt: true });
    expect(subtitolLocal(inedita, null, TEXTOS)).toBe('/ · 2 KB · INÈDITA · PES ALT');
    expect(subtitolLocal(inedita, new Set(['x.png']), TEXTOS)).toBe('/ · 2 KB · INÈDITA · PES ALT · DUPLICADA');
    const nota = el('a/nota.md');
    expect(subtitolLocal(nota, null, TEXTOS)).toBe('a · 2 KB · DOCUMENT');
    expect(subtitolLocal(nota, new Set(['a/nota.md']), TEXTOS)).toBe('a · 2 KB · DOCUMENT · DUPLICADA');
  });
});

describe('seleccioEfectiva', () => {
  const elements = [el('00_inbox/nota.md'), el('00_inbox/a.png')];
  const index = indexaArbreLocal({ sal: SAL, carpetes: ['00_inbox', 'buida'], elements });
  const inbox = index.idDeCarpeta.get('00_inbox');
  const nota = index.idDArxiu.get('00_inbox/nota.md');
  const ids = new Set(['town-tibi']);

  test('buit, portada, categoria, foto i ítem del catàleg', () => {
    expect(seleccioEfectiva({}, { idsCataleg: ids })).toEqual({ categoryId: CATEGORIA_PORTADA, itemId: ITEM_PORTADA, local: null });
    expect(seleccioEfectiva({ categoria: GALERIA_IAIA }, { idsCataleg: ids })).toMatchObject({ categoryId: GALERIA_IAIA, itemId: idVistaDe(GALERIA_IAIA) });
    expect(seleccioEfectiva({ categoria: TOT }, { idsCataleg: ids })).toMatchObject({ categoryId: TOT, itemId: ITEM_PORTADA });
    expect(seleccioEfectiva({ foto: 'town-tibi' }, { idsCataleg: ids })).toMatchObject({ categoryId: GALERIA_TOTS, itemId: 'town-tibi' });
    expect(seleccioEfectiva({ foto: 'town-tibi', categoria: GALERIA_IAIA }, { idsCataleg: ids })).toMatchObject({ categoryId: GALERIA_IAIA, itemId: 'town-tibi' });
    /* Una ?foto= absent, amb el catàleg ja carregat, no és cap ítem (no hi ha cap reconciliació que hi lluite). */
    expect(seleccioEfectiva({ foto: 'no-hi-es' }, { idsCataleg: ids })).toMatchObject({ categoryId: CATEGORIA_PORTADA, itemId: ITEM_PORTADA });
    expect(seleccioEfectiva({ foto: 'no-hi-es' }, { idsCataleg: ids, catalegLlest: false })).toMatchObject({ itemId: 'no-hi-es' });
    expect(seleccioEfectiva({ item: 'town-tibi' }, { idsCataleg: ids })).toMatchObject({ categoryId: GALERIA_TOTS, itemId: 'town-tibi' });
    expect(seleccioEfectiva({ item: 'town-tibi', categoria: 'mes_2026-08' }, { idsCataleg: ids })).toMatchObject({ categoryId: 'mes_2026-08' });
    expect(seleccioEfectiva({ item: idVistaDe(GALERIA_TOTS) }, { idsCataleg: ids })).toMatchObject({ categoryId: GALERIA_TOTS });
  });

  test('locals: sense volum obert, l’arrel (sense tocar la URL); amb el volum, l’arxiu o la carpeta; desapareguda, l’arrel', () => {
    const arrel = { categoryId: ARREL_LOCAL, itemId: idVistaDe(ARREL_LOCAL), local: { carpeta: '', ruta: null } };
    expect(seleccioEfectiva({ categoria: inbox, item: nota }, { index: null })).toEqual(arrel);
    expect(seleccioEfectiva({ categoria: inbox, item: nota }, { index })).toEqual({
      categoryId: inbox, itemId: nota, local: { carpeta: '00_inbox', ruta: '00_inbox/nota.md' }
    });
    /* La categoria la mana l'arxiu (un enllaç vell d'abans de moure'l). */
    expect(seleccioEfectiva({ categoria: ARREL_LOCAL, item: nota }, { index })).toMatchObject({ categoryId: inbox });
    expect(seleccioEfectiva({ categoria: inbox }, { index })).toEqual({
      categoryId: inbox, itemId: idVistaDe(inbox), local: { carpeta: '00_inbox', ruta: null }
    });
    expect(seleccioEfectiva({ categoria: '__lc_desapareguda' }, { index })).toEqual(arrel);
    expect(seleccioEfectiva({ categoria: inbox, item: '__lf_desaparegut' }, { index })).toMatchObject({ categoryId: inbox, itemId: idVistaDe(inbox) });
    expect(seleccioEfectiva({ categoria: ARREL_LOCAL }, { index: null })).toEqual(arrel);
  });

  test('demandaDeLaUrl: el catàleg i els ids locals profunds esperen; la portada i l’arrel local, no', () => {
    expect(demandaDeLaUrl({})).toEqual({ cataleg: false, localProfund: false });
    expect(demandaDeLaUrl({ categoria: ARREL_LOCAL })).toEqual({ cataleg: false, localProfund: false });
    expect(demandaDeLaUrl({ categoria: inbox, item: nota })).toEqual({ cataleg: false, localProfund: true });
    expect(demandaDeLaUrl({ item: 'cens-towns-tibi-2' })).toEqual({ cataleg: true, localProfund: false });
    expect(demandaDeLaUrl({ foto: 'town-tibi' }).cataleg).toBe(true);
    expect(demandaDeLaUrl({ categoria: 'mes_2026-08' }).cataleg).toBe(true);
  });
});

describe('paramsDeSeleccio', () => {
  test('omet els valors per defecte i la vista, conserva foto i els paràmetres aliens, lleva pagina', () => {
    const abans = new URLSearchParams('x=1&foto=town-tibi&pagina=3&categoria=galeria_iaia&item=nano-mur');
    expect(paramsDeSeleccio(abans, { categoryId: CATEGORIA_PORTADA, itemId: ITEM_PORTADA }).toString()).toBe('x=1&foto=town-tibi');
    expect(paramsDeSeleccio(abans, { categoryId: CATEGORIA_PORTADA, itemId: null }).toString()).toBe('x=1&foto=town-tibi');
    expect(paramsDeSeleccio(abans, { categoryId: GALERIA_TOTS, itemId: idVistaDe(GALERIA_TOTS) }).toString())
      .toBe('x=1&foto=town-tibi&categoria=galeria_tots');
    expect(paramsDeSeleccio(abans, { categoryId: GALERIA_TOTS, itemId: 'town-tibi' }).toString())
      .toBe('x=1&foto=town-tibi&categoria=galeria_tots&item=town-tibi');
    expect(paramsDeSeleccio(abans, { categoryId: '__lc_x', itemId: null }).toString()).toBe('x=1&foto=town-tibi&categoria=__lc_x');
    expect(paramsDeSeleccio(abans, { categoryId: TOT, itemId: ITEM_PORTADA }).toString()).toBe('x=1&foto=town-tibi&categoria=__all__');
    expect(abans.toString()).toBe('x=1&foto=town-tibi&pagina=3&categoria=galeria_iaia&item=nano-mur');
  });

  /* Gauntlet 261029 (cicle 1) · La secció de l'Índex és de la pàgina d'abans: la
     d'una pàgina local podia portar el nom d'un volum a una galeria publicada. */
  test('canviar de selecció lleva ?seccio=', () => {
    const abans = new URLSearchParams('categoria=__lc_x&seccio=diagnostic-de-fotos-privades-maria');
    expect(paramsDeSeleccio(abans, { categoryId: GALERIA_TOTS, itemId: null }).toString()).toBe('categoria=galeria_tots');
    expect(paramsDeSeleccio(abans, { categoryId: CATEGORIA_PORTADA, itemId: null }).toString()).toBe('');
  });

  test('mateixaSeleccio: un itemId null és la vista de la categoria', () => {
    expect(mateixaSeleccio({ categoryId: GALERIA_TOTS, itemId: null }, { categoryId: GALERIA_TOTS, itemId: idVistaDe(GALERIA_TOTS) })).toBe(true);
    expect(mateixaSeleccio({ categoryId: CATEGORIA_PORTADA, itemId: null }, { categoryId: CATEGORIA_PORTADA, itemId: ITEM_PORTADA })).toBe(true);
    expect(mateixaSeleccio({ categoryId: GALERIA_TOTS, itemId: 'a' }, { categoryId: GALERIA_TOTS, itemId: 'b' })).toBe(false);
    expect(itemPerDefecte('__lc_x')).toBe(idVistaDe('__lc_x'));
  });
});
