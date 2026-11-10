import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import DetallCataleg from './DetallCataleg.jsx';

describe('pàgina de detall del catàleg', () => {
  it('requerix el context del Workspace i refusa una pàgina solta', () => {
    expect(() => renderToStaticMarkup(<DetallCataleg title="Rebost" />)).toThrow('useWorkspace ha de viure dins de WorkspaceProvider');
  });
});
