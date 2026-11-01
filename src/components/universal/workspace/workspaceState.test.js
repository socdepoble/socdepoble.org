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
