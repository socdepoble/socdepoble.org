/**
 * GraellaTargetes · el contenidor de les UniversalCard de les llistes de les
 * apps (ordre del Mestre, 261004, prompt 261004_0515). No és cap targeta: la
 * graella de sempre (div.sdp-card-grid), la columna de les planes
 * (div.sdp-card-llista) i, amb categories, les seccions de SeccionsCategoria.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext';

vi.mock('../../universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));

import { GraellaTargetes } from './GraellaTargetes.jsx';
import { UniversalCard } from './UniversalCard.jsx';

afterEach(cleanup);

const CATEGORIES = [
  { id: 'b', nom: 'Del camp', visible: true, ordre: 1 },
  { id: 'a', nom: 'Del poble', visible: true, ordre: 0 },
  { id: 'c', nom: 'Amagada', visible: false, ordre: 2 }
];
const ELEMENTS = [
  { id: 'n1', categoriaId: 'a', titol: 'Biblioteca' },
  { id: 'n2', categoriaId: 'b', titol: 'Oliva' },
  { id: 'n3', categoriaId: 'a', titol: 'Llavador' },
  { id: 'n4', categoriaId: 'c', titol: 'No es veu' },
  { id: 5, categoriaId: 'a', titol: 'Sense id de text' },
  null
];
const targeta = (element) => <UniversalCard key={element.id} headingLevel="h4" title={element.titol} />;
const pinta = (node) => render(<MemoryRouter>{node}</MemoryRouter>).container;

describe('sense seccions', () => {
  test('els fills ja fets van dins de la graella de sempre, en ordre', () => {
    const arrel = pinta(
      <GraellaTargetes etiqueta="Notícies">
        <UniversalCard title="U" />
        <UniversalCard title="D" />
      </GraellaTargetes>
    );
    const graella = screen.getByRole('group', { name: 'Notícies' });
    expect(graella.className).toBe('sdp-card-grid');
    expect([...graella.children].map((e) => e.querySelector('.sp-card-title').textContent)).toEqual(['U', 'D']);
    expect(arrel.querySelectorAll('ul, li')).toHaveLength(0);
  });

  test('amb elements, children(element) pinta cada targeta; només els que tenen id de text', () => {
    pinta(<GraellaTargetes elements={ELEMENTS} etiqueta="Totes">{targeta}</GraellaTargetes>);
    const graella = screen.getByRole('group', { name: 'Totes' });
    expect(within(graella).getAllByRole('heading', { level: 4 }).map((h) => h.textContent))
      .toEqual(['Biblioteca', 'Oliva', 'Llavador', 'No es veu']);
  });

  test('variant llista: la columna de les targetes planes', () => {
    pinta(<GraellaTargetes elements={ELEMENTS.slice(0, 2)} variant="llista" etiqueta="Revista">
      {(element) => <UniversalCard key={element.id} variant="pla" title={element.titol} />}
    </GraellaTargetes>);
    const llista = screen.getByRole('group', { name: 'Revista' });
    expect(llista.className).toBe('sdp-card-llista');
    expect([...llista.children].map((e) => e.className)).toEqual(['sp-card sp-card--pla', 'sp-card sp-card--pla']);
  });

  test('sense etiqueta, cap rol ni nom inventat', () => {
    const arrel = pinta(<GraellaTargetes elements={ELEMENTS.slice(0, 1)}>{targeta}</GraellaTargetes>);
    const graella = arrel.querySelector('.sdp-card-grid');
    expect(graella.hasAttribute('role')).toBe(false);
    expect(graella.hasAttribute('aria-label')).toBe(false);
  });

  test('buida: el `buit` que passa qui la munta, o res', () => {
    expect(pinta(<GraellaTargetes elements={[]}>{targeta}</GraellaTargetes>).innerHTML).toBe('');
    cleanup();
    pinta(<GraellaTargetes elements={[]} buit={<p>Cap notícia</p>}>{targeta}</GraellaTargetes>);
    expect(screen.getByText('Cap notícia')).toBeTruthy();
    cleanup();
    expect(pinta(<GraellaTargetes />).innerHTML).toBe('');
    cleanup();
    /* Una funció sense elements no té res a pintar; uns elements sense funció, tampoc. */
    expect(pinta(<GraellaTargetes>{targeta}</GraellaTargetes>).innerHTML).toBe('');
    cleanup();
    expect(pinta(<GraellaTargetes elements={ELEMENTS} />).innerHTML).toBe('');
  });
});

describe('amb seccions', () => {
  test('una secció per categoria visible, en l’ordre de la persona, cadascuna amb la seua graella', () => {
    const arrel = pinta(<GraellaTargetes elements={ELEMENTS} categories={CATEGORIES}>{targeta}</GraellaTargetes>);
    const seccions = [...arrel.querySelectorAll('section.sdp-seccio')];
    expect(seccions.map((s) => s.querySelector('.sdp-seccio__nom').textContent)).toEqual(['Del poble', 'Del camp']);
    expect(seccions.map((s) => s.querySelector('.sdp-seccio__cap').tagName)).toEqual(['H3', 'H3']);
    for (const seccio of seccions) {
      const cos = seccio.querySelector('.sdp-seccio__cos');
      expect([...cos.children].map((e) => e.className)).toEqual(['sdp-card-grid']);
    }
    expect([...seccions[0].querySelectorAll('.sp-card-title')].map((t) => t.textContent)).toEqual(['Biblioteca', 'Llavador']);
    expect([...seccions[1].querySelectorAll('.sp-card-title')].map((t) => t.textContent)).toEqual(['Oliva']);
    expect(arrel.textContent).not.toContain('No es veu');
  });

  test('el nivell de la capçalera es configura (3 a 6), i un nivell de fora torna a 3', () => {
    let arrel = pinta(<GraellaTargetes elements={ELEMENTS} categories={CATEGORIES} nivell={5}>{targeta}</GraellaTargetes>);
    expect([...arrel.querySelectorAll('.sdp-seccio__cap')].map((c) => c.tagName)).toEqual(['H5', 'H5']);
    cleanup();
    arrel = pinta(<GraellaTargetes elements={ELEMENTS} categories={CATEGORIES} nivell={1}>{targeta}</GraellaTargetes>);
    expect([...arrel.querySelectorAll('.sdp-seccio__cap')].map((c) => c.tagName)).toEqual(['H3', 'H3']);
  });

  test('en variant llista, cada secció porta la columna de les planes', () => {
    const arrel = pinta(<GraellaTargetes elements={ELEMENTS} categories={CATEGORIES} variant="llista">{targeta}</GraellaTargetes>);
    expect([...arrel.querySelectorAll('.sdp-seccio__cos > div')].map((d) => d.className)).toEqual(['sdp-card-llista', 'sdp-card-llista']);
  });

  test('sense cap element visible, el `buit`', () => {
    pinta(<GraellaTargetes elements={[]} categories={CATEGORIES} buit={<p>Res a llegir</p>}>{targeta}</GraellaTargetes>);
    expect(screen.getByText('Res a llegir')).toBeTruthy();
  });
});

/* Ordre del Mestre, 261004 (integració final, front «lector-nevera») · En la variant 'llista' la
   targeta ocupa tota la columna i la imatge 1:1 no hi pot ocupar tota l'amplària: un sostre amb
   token, centrat. El selector es llig del full (no s'escriu ací) i ha de casar amb el contenidor
   de la imatge de la variant llista, mai amb el de la graella. jsdom no aplica el full. */
describe('el sostre de la imatge en la variant llista (modules.css)', () => {
  const MODULES = readFileSync(path.join(process.cwd(), 'src/css/modules.css'), 'utf8');
  const inici = MODULES.indexOf('Front «lector-nevera».');
  const bloc = inici < 0 ? '' : MODULES.slice(MODULES.indexOf('@layer components {', inici), MODULES.indexOf('\n}\n', inici) + 2);
  const regles = new Map([...bloc.matchAll(/^\s{2}([^{}\n]+?)\s*\{([^{}]*)\}/gm)].map((m) => [m[1].trim(), m[2]]));
  const SOSTRE = '.sdp-card-llista > .sp-card > .sp-card-media-container';
  const IMATGE = 'https://example.org/foto.jpg';

  test('el bloc viu dins de @layer components i el sostre és un token, centrat', () => {
    expect(bloc.startsWith('@layer components {')).toBe(true);
    expect(regles.get(SOSTRE)).toMatch(/max-inline-size:\s*var\(--sdp-targeta-incrustada-ample\);/);
    expect(regles.get(SOSTRE)).toMatch(/margin-inline:\s*auto;/);
    /* Només tokens: cap px, cap color cru, cap :has(). */
    const net = bloc.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(/\d+px|#[0-9a-fA-F]{3,8}\b|\brgba?\(/.test(net)).toBe(false);
    expect(new RegExp([':ha', 's\\('].join('')).test(net)).toBe(false);
  });

  test('casa amb la imatge de la targeta plana de la llista; no amb la de la graella', () => {
    const llista = pinta(
      <GraellaTargetes variant="llista" etiqueta="Revista">
        <UniversalCard variant="pla" title="Amb foto" imageUrl={IMATGE} />
      </GraellaTargetes>
    );
    expect(llista.querySelectorAll(SOSTRE)).toHaveLength(1);
    expect(llista.querySelector(SOSTRE).querySelector('img.sp-card-media')).not.toBeNull();
    cleanup();
    const graella = pinta(
      <GraellaTargetes etiqueta="Targetes">
        <UniversalCard title="Amb foto" imageUrl={IMATGE} />
      </GraellaTargetes>
    );
    expect(graella.querySelector('.sp-card-media-container')).not.toBeNull();
    expect(graella.querySelectorAll(SOSTRE)).toHaveLength(0);
  });
});
