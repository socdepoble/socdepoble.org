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
