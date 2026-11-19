import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { run as runDesignGuard } from '../../tooling/gates/design_guard.mjs';

const ARREL = path.resolve(import.meta.dirname, '../..');

describe('R32.11 · Lot 03 · Píxel Multi-Contenidor (280–960px), WCAG 2.2 AAA i Design Guard 0/0', () => {
  test('Design Guard assoleix 0 crítics i 0 avisos (zero div-soup en tot src/)', async () => {
    const res = await runDesignGuard({ root: path.join(ARREL, 'src') });
    expect(res.data.summary).toEqual({ critical: 0, warning: 0 });
  });

  test('BarraTaronja protegeix min-width >= 44px de sp-card-author en contenidors estrets (280px i 320px)', () => {
    const css = fs.readFileSync(path.join(ARREL, 'src/css/components.css'), 'utf8');
    expect(css).toContain('@container (max-width: 367px)');
    expect(css).toContain('grid-template-columns: minmax(var(--sdp-touch), 1fr) auto max-content;');
    expect(css).toContain('@container (max-width: 280px)');
  });

  test('Casella i GrupOpcions estenen l’etiqueta clicable a tota l’alçada tàctil >= 44px', () => {
    const css = fs.readFileSync(path.join(ARREL, 'src/css/components.css'), 'utf8');
    expect(css).toMatch(/\.sdp-casella__etiqueta\s*\{[^}]*flex:\s*1\s+1\s+auto;[^}]*min-height:\s*var\(--sdp-touch\);/);
  });

  test('El logotip editable d’Edició avançada garanteix min-height >= 44px i object-fit: contain', () => {
    const css = fs.readFileSync(path.join(ARREL, 'src/css/modules.css'), 'utf8');
    expect(css).toMatch(/\.sdp-logo-personalitzat\.sdp-logo-personalitzat--editable\s*\{[^}]*min-height:\s*var\(--sdp-touch\);[^}]*object-fit:\s*contain;/);
  });

  test('Bombolla usa <article> semàntic i EspecimenXat encapsula les mostres en <section>', () => {
    const bombolla = fs.readFileSync(path.join(ARREL, 'src/sections/xat/components/Bombolla.jsx'), 'utf8');
    const especimen = fs.readFileSync(path.join(ARREL, 'src/sections/disseny/cataleg/detalls/EspecimenXat.jsx'), 'utf8');
    expect(bombolla).toContain('<article className={bombollaClass}>');
    expect(especimen).toContain('<section className="sdp-especimen__mostra" data-especimen="r32-7-xat-espill-11-opcions"');
    expect(especimen).toContain('<section data-especimen="r32-8-xat-ubicacio-i-avis"');
  });
});
