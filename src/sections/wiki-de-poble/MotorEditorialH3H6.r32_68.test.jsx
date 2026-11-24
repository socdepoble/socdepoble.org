import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { extreuEditorial, parseMarkdown } from './parseMarkdown.js';
import { sanitizeHtml } from '../../utils/sanitize.js';

vi.mock('../../components/universal/workspace/UniversalWorkspace.jsx', () => ({
  UniversalWorkspace: ({ model, renderDetail, className }) => (
    <div className={className}>
      {renderDetail({ item: model.items.find((i) => i.id === 'successio_lazaro') })}
    </div>
  ),
}));

vi.mock('../../data/wikiManifest.js', async (importOriginal) => {
  const real = await importOriginal();
  return {
    wikiManifest: {
      categories: [{ id: 'folder:02_saber', parentId: null, label: 'SABER' }],
      items: [
        ...real.wikiManifest.items.slice(0, 12),
        {
          id: 'successio_lazaro',
          title: 'Successió Lázaro',
          subtitle: 'Continuïtat humana i tècnica de Sóc de Poble',
          categoryId: 'folder:02_saber',
          tags: ['saber', 'governanca'],
          attributes: {
            type: 'document',
            status: 'canonic',
            date: '2026-11-24',
            description: 'Continuïtat humana i tècnica de Sóc de Poble',
          },
          content: [
            '# Successió Lázaro',
            '',
            'Protocol viu perquè **qualsevol persona de confiança** puga mantindre **Sóc de Poble** amb claredat.',
            '',
            '## 1. Objectiu i abast',
            '',
            'Aquesta guia reuneix els **passos essencials** per cuidar el projecte.',
            '',
            '### 1.1 Responsables',
            '',
            '- Equip humà de La Torre.',
            '',
            '#### 1.1.1 Contactes',
            '',
            'Detall operatiu.',
            '',
            '##### 1.1.1.1 Nota',
            '',
            'Observació final.',
            '',
            '###### 1.1.1.1.1 Subnota',
            '',
            'Tancament.',
          ].join('\n'),
        },
      ],
    },
  };
});

vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ search: '?item=successio_lazaro', pathname: '/wikidepoble' }),
  Link: 'a',
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));
vi.mock('../../hooks/useSEO.js', () => ({ useSEO: () => {} }));
vi.mock('../consola/ConsolaSection.jsx', () => ({
  ConsolaIncrustada: () => <p>Consola</p>,
}));

import WikiDePobleSection from './WikiDePobleSection.jsx';

afterEach(cleanup);

describe('IDEA-344 (R32.68) · Motor editorial H3–H6 a la Wiki i neteja de falsos .h2', () => {
  it('mapeja ## -> <h3>, ### -> <h4>, #### -> <h5>, #####/###### -> <h6> sense cap class="h2..h6"', () => {
    const editorial = extreuEditorial(
      '# Títol\n\nEntradilla.\n\n## Secció H3\n\n### Apartat H4\n\n#### Detall H5\n\n##### Nota H6\n\n###### Subnota H6'
    );
    const root = document.createElement('div');
    root.innerHTML = sanitizeHtml(parseMarkdown(editorial.cos, { entradilla: false }));
    const headings = [...root.querySelectorAll('h1, h2, h3, h4, h5, h6')];
    expect(headings.map((h) => [h.tagName, h.getAttribute('class'), h.textContent])).toEqual([
      ['H3', null, 'Secció H3'],
      ['H4', null, 'Apartat H4'],
      ['H5', null, 'Detall H5'],
      ['H6', null, 'Nota H6'],
      ['H6', null, 'Subnota H6'],
    ]);
  });

  it('renderitza WikiDetail amb H1 -> H2 -> .lead -> H3 (Quadre ISO) -> H3..H6 i Índex TOC canònic', () => {
    const { container } = render(<WikiDePobleSection />);
    expect(container.querySelector('header.page-title h1')?.textContent).toBe('Successió Lázaro');
    expect(container.querySelector('.page-intro h2')?.textContent).toBe(
      'Continuïtat humana i tècnica de Sóc de Poble'
    );
    expect(container.querySelector('.page-intro p.lead')?.textContent).toContain(
      'qualsevol persona de confiança'
    );

    const iso = screen.getByRole('heading', { name: 'Quadre de Comandament ISO', level: 3 });
    expect(iso.getAttribute('class')).toBeNull();

    const bodyHeadings = [...container.querySelectorAll('article.content-wrapper :is(h1,h2,h3,h4,h5,h6)')];
    expect(bodyHeadings.map((h) => [h.tagName, h.className, h.textContent])).toEqual([
      ['H2', '', 'Continuïtat humana i tècnica de Sóc de Poble'],
      ['H3', '', 'Quadre de Comandament ISO'],
      ['H3', '', '1. Objectiu i abast'],
      ['H4', '', '1.1 Responsables'],
      ['H5', '', '1.1.1 Contactes'],
      ['H6', '', '1.1.1.1 Nota'],
      ['H6', '', '1.1.1.1.1 Subnota'],
    ]);

    fireEvent.click(container.querySelector('button[aria-label="Índex de secció"]'));
    expect([...document.querySelectorAll('.toc-nav li')].map((li) => [li.className, li.textContent])).toEqual([
      ['toc-item toc-level-1', 'Successió Lázaro'],
      ['toc-item toc-level-2', 'Continuïtat humana i tècnica de Sóc de Poble'],
      ['toc-item toc-level-3', 'Quadre de Comandament ISO'],
      ['toc-item toc-level-3', '1. Objectiu i abast'],
      ['toc-item toc-level-4', '1.1 Responsables'],
      ['toc-item toc-level-5', '1.1.1 Contactes'],
      ['toc-item toc-level-6', '1.1.1.1 Nota'],
      ['toc-item toc-level-6', '1.1.1.1.1 Subnota'],
    ]);
  });

  it('wiki.css ha eliminat totes les regles heretades de h3.h2 / h6.h5 / .h2 i conserva el ritme de llistes sota h3..h6', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/css/wiki.css'), 'utf8');
    expect(css).not.toMatch(/h3\.h2|h6\.h5|\.h1\b|\.h2\b|\.h3\b|\.h4\b|\.h5\b/);
    expect(css).toContain(':is(h3, h4, h5, h6) + :is(ul, ol)');
  });
});
