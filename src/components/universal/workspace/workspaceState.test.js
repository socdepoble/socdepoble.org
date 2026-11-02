import { describe, expect, it } from 'vitest';
import { ALL_CATEGORY_ID, createWorkspaceState, primerElementTriable, workspaceReducer } from './workspaceState.js';

describe('workspaceReducer', () => {
  it('conserva la identitat de l’estat quan selection/sync no canvia res', () => {
    const state = createWorkspaceState({ categoryId: 'formularis', itemId: 'camp' });

    const next = workspaceReducer(state, {
      type: 'selection/sync',
      categoryId: 'formularis',
      itemId: 'camp'
    });

    expect(next).toBe(state);
  });

  it('crea un estat nou quan selection/sync canvia la selecció', () => {
    const state = createWorkspaceState({ categoryId: 'formularis', itemId: 'camp' });

    const next = workspaceReducer(state, {
      type: 'selection/sync',
      categoryId: 'navegacio',
      itemId: 'molla'
    });

    expect(next).not.toBe(state);
    expect(next.activeCategoryId).toBe('navegacio');
    expect(next.activeItemId).toBe('molla');
  });
});


it('category/select només espera una autotria quan l’acció ho declara explícitament',()=>{
 const state=createWorkspaceState({categoryId:'a',itemId:'nota'});
 const normal=workspaceReducer(state,{type:'category/select',categoryId:'b',itemId:null});
 const ajornat=workspaceReducer(state,{type:'category/select',categoryId:'b',itemId:null,needsInitialSelection:true});
 expect(normal.needsInitialSelection).toBe(false);
 expect(ajornat.needsInitialSelection).toBe(true);
 expect(ajornat.activeCategoryId).toBe('b');expect(ajornat.activeItemId).toBeNull();
});

/* T11-03 (marató 261101_2143) · El primer element de la tria automàtica: a
   «Tot», el primer amb `fixatATot: true` (el booleà); si no, el primer. */
describe('primerElementTriable', () => {
  const A = Object.freeze({ id: 'a' });
  const FIXAT = Object.freeze({ id: 'fixat', fixatATot: true });
  const ALTRE_FIXAT = Object.freeze({ id: 'altre', fixatATot: true });

  it('sense elements (llista buida, null o una no-llista), null', () => {
    expect(primerElementTriable([], ALL_CATEGORY_ID)).toBeNull();
    expect(primerElementTriable(null, ALL_CATEGORY_ID)).toBeNull();
    expect(primerElementTriable(undefined, 'carpeta')).toBeNull();
    expect(primerElementTriable({ 0: FIXAT, length: 1 }, ALL_CATEGORY_ID)).toBeNull();
  });

  it('a «Tot», el fixat encara que no siga el primer de l’entrada', () => {
    expect(primerElementTriable([A, FIXAT], ALL_CATEGORY_ID)).toBe(FIXAT);
  });

  it('a «Tot» sense cap fixat, el primer de l’entrada', () => {
    expect(primerElementTriable([A, { id: 'b' }], ALL_CATEGORY_ID)).toBe(A);
  });

  /* ARB-T11C-01 · Amb dos fixats mana l'entrada, no `sortBy` (que viu a
     UniversalWorkspace): la paritat amb la primera fila pintada només val amb
     un sol fixat. Deute nou de T11-03 (pujar `sortBy` al context). */
  it('amb dos fixats, el primer de l’entrada (no el de l’ordenació de la llista)', () => {
    expect(primerElementTriable([A, ALTRE_FIXAT, FIXAT], ALL_CATEGORY_ID)).toBe(ALTRE_FIXAT);
  });

  it('fora de «Tot», el fixat no passa davant', () => {
    expect(primerElementTriable([A, FIXAT], 'carpeta')).toBe(A);
  });

  it('només el booleà fixa: una cadena \'true\' o un 1, no', () => {
    expect(primerElementTriable([A, { id: 'cadena', fixatATot: 'true' }, { id: 'u', fixatATot: 1 }], ALL_CATEGORY_ID)).toBe(A);
  });

  it('un forat a la llista no peta en buscar el fixat', () => {
    expect(primerElementTriable([null, FIXAT], ALL_CATEGORY_ID)).toBe(FIXAT);
  });
});

/* B6-B2 (IDEA-46, marató 261101_2143) · `ambConsulta: false` deixa passar la
   consulta (la secció ja dona els elements de la seua cerca) i manté la
   carpeta, l'àmbit i les etiquetes. Només el booleà false: la resta, com
   sempre. (Import propi: este bloc és l'únic tros del fitxer compartit que
   toca B6-B2; les importacions s'eleven igualment.) */
import { filterWorkspaceItems as filtraElements } from './workspaceState.js';

describe('filterWorkspaceItems · ambConsulta', () => {
  const ELEMENTS = Object.freeze([
    Object.freeze({ id: 't', title: 'Tomaques', categoryIds: ['hort'], tags: ['estiu'] }),
    Object.freeze({ id: 'c', title: 'Carxofes', categoryIds: ['hort'], tags: ['hivern'] }),
    Object.freeze({ id: 'p', title: 'Pebreres', categoryIds: ['planter'], tags: ['estiu'] }),
    Object.freeze({ id: 'g', title: 'Gallines', categoryIds: ['corral'], searchText: 'ous' })
  ]);
  const estat = (canvis = {}) => ({ activeCategoryId: ALL_CATEGORY_ID, activeTagIds: [], query: 'tomaq', ...canvis });
  const ids = (llista) => llista.map((element) => element.id);

  it('sense opcions, o amb ambConsulta:true, la consulta filtra com sempre', () => {
    expect(ids(filtraElements(ELEMENTS, estat()))).toEqual(['t']);
    expect(ids(filtraElements(ELEMENTS, estat(), { ambConsulta: true }))).toEqual(['t']);
  });

  it('amb ambConsulta:false, cap element no cau per la consulta', () => {
    expect(ids(filtraElements(ELEMENTS, estat(), { ambConsulta: false }))).toEqual(['t', 'c', 'p', 'g']);
    expect(ids(filtraElements(ELEMENTS, estat({ query: 'ous' }), { ambConsulta: false }))).toEqual(['t', 'c', 'p', 'g']);
  });

  it('amb ambConsulta:false, la categoria, l’àmbit i les etiquetes continuen filtrant', () => {
    expect(ids(filtraElements(ELEMENTS, estat({ activeCategoryId: 'hort' }), { ambConsulta: false }))).toEqual(['t', 'c']);
    expect(ids(filtraElements(ELEMENTS, estat({ activeCategoryId: 'hort' }), { ambit: new Set(['hort', 'planter']), ambConsulta: false })))
      .toEqual(['t', 'c', 'p']);
    expect(ids(filtraElements(ELEMENTS, estat({ activeTagIds: ['estiu'] }), { ambConsulta: false }))).toEqual(['t', 'p']);
    expect(ids(filtraElements(ELEMENTS, estat({ activeCategoryId: 'hort', activeTagIds: ['hivern'] }), { ambConsulta: false }))).toEqual(['c']);
  });

  it('només el booleà false la desactiva: null, 0, \'\' o \'false\' filtren com sempre', () => {
    for (const valor of [null, 0, '', 'false', undefined]) {
      expect(ids(filtraElements(ELEMENTS, estat(), { ambConsulta: valor }))).toEqual(['t']);
    }
  });

  it('la consulta buida o d’espais no filtra, amb ambConsulta o sense', () => {
    expect(ids(filtraElements(ELEMENTS, estat({ query: '   ' })))).toEqual(['t', 'c', 'p', 'g']);
    expect(ids(filtraElements(ELEMENTS, estat({ query: '' }), { ambConsulta: false }))).toEqual(['t', 'c', 'p', 'g']);
  });
});
