import { describe, expect, it } from 'vitest';
import { createWorkspaceState, workspaceReducer } from './workspaceState.js';

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
