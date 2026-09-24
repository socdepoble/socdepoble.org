import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
const fixture = vi.hoisted(() => ({ content: Array.from({ length: 6 }, (_, i) => `${'#'.repeat(i + 1)} Nivell ${i + 1}`).join('\n\n') }));
vi.mock('../../components/universal/workspace/UniversalWorkspace.jsx', () => ({ UniversalWorkspace: ({ model, renderDetail, className }) => <div className={className}>{renderDetail({ item: model.items.find(item => item.id === '00_index') })}</div> }));
vi.mock('../../components/universal/UniversalPage.jsx', () => ({ UniversalPage: ({ title, children }) => <main><header className="page-title"><h1>{title}</h1></header>{children}</main> }));
vi.mock('../../data/wikiManifest.js', () => ({ wikiManifest: { categories: [], items: [{ id: '00_index', title: 'Wiki de Poble', get content() { return fixture.content; } }] } }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), useLocation: () => ({ search: '?item=00_index' }) }));
vi.mock('../../components/universal/graph/BrainGraph', () => ({ default: () => null }));
vi.mock('../consola/ConsolaSection.jsx', () => ({ ConsolaPanells: () => null }));
import WikiDePobleSection from './WikiDePobleSection';
afterEach(() => { cleanup(); document.head.querySelectorAll('style[data-test]').forEach(node => node.remove()); });

test('un sol h1 de pàgina; Markdown h1–h6 passa a h2,h3,h4,h5,h6,h6', () => {
  render(<WikiDePobleSection />);
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Wiki de Poble');
  const headings = document.querySelectorAll('.sdp-prose :is(h2,h3,h4,h5,h6)');
  expect([...headings].map(node => node.tagName)).toEqual(['H2', 'H3', 'H4', 'H5', 'H6', 'H6']);
  expect([...headings].map(node => node.className)).toEqual(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
});

