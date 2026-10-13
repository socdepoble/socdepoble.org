/* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B) · «A la part dreta
   de la barra taronja, SEMPRE la data i l'hora vives». RellotgeViu és la
   pastilla de sempre (<time>, sense clic ni regió viva) amb l'hora d'ara,
   renovada al canvi de cada minut per un sol temporitzador (useAra). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, render, screen } from '@testing-library/react';
import { ESLint } from 'eslint';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { RellotgeViu, etiquetaRellotge } from './RellotgeViu.jsx';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');

describe('la pastilla viva', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 13, 9, 59, 30));
  });
  afterEach(() => { cleanup(); vi.useRealTimers(); });

  test('un <time class="btn-date-time"> amb hh:mm, dd/mm/aa, el dateTime local i el nom accessible', () => {
    const { container } = render(<RellotgeViu />);
    const pastilla = container.firstElementChild;
    expect(container.children).toHaveLength(1);
    expect(pastilla.tagName).toBe('TIME');
    expect(pastilla.className).toBe('btn-date-time');
    expect([...pastilla.children].map((fill) => fill.textContent)).toEqual(['09:59', '13/10/26']);
    expect(pastilla.getAttribute('datetime')).toBe('2026-10-13T09:59');
    expect(pastilla.getAttribute('aria-label')).toBe('Data i hora d’ara: 09:59 del 13/10/26');
  });

  test('no és cap botó ni cap regió viva: no s’anuncia a cada minut', () => {
    const { container } = render(<RellotgeViu />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(container.querySelector('[aria-live], [role="status"], [role="timer"], [role="log"]')).toBeNull();
    expect(container.querySelector('[style]')).toBeNull();
  });

  test('al canvi de minut, l’hora nova; al canvi de dia, el dia nou', () => {
    const { container } = render(<RellotgeViu />);
    const pastilla = () => container.querySelector('time');
    act(() => { vi.advanceTimersByTime(29999); });
    expect(pastilla().textContent).toBe('09:5913/10/26');
    act(() => { vi.advanceTimersByTime(1); });
    expect(pastilla().textContent).toBe('10:0013/10/26');
    expect(pastilla().getAttribute('aria-label')).toBe('Data i hora d’ara: 10:00 del 13/10/26');
    expect(pastilla().getAttribute('datetime')).toBe('2026-10-13T10:00');
    /* Fins a mitjanit: de 10:00 a 00:00 de l'endemà, 14 hores. */
    act(() => { vi.advanceTimersByTime(14 * 60 * 60000); });
    expect(pastilla().textContent).toBe('00:0014/10/26');
    expect(vi.getTimerCount()).toBe(1);
  });

  test('en desmuntar, cap temporitzador', () => {
    const { unmount } = render(<RellotgeViu />);
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  test('amb un rellotge injectat, l’hora és la seua (el de la Gestoria i el de les proves)', () => {
    const ms = new Date(2026, 0, 2, 7, 5, 0).getTime();
    const { container } = render(<RellotgeViu rellotge={() => ms} />);
    const pastilla = container.querySelector('time');
    expect(pastilla.textContent).toBe('07:0502/01/26');
    expect(pastilla.getAttribute('datetime')).toBe('2026-01-02T07:05');
  });

  test('l’etiqueta es pot personalitzar i és el nom accessible; buida, la de sempre', () => {
    const { container } = render(<RellotgeViu etiqueta="Ara mateix a la Gestoria" />);
    expect(container.querySelector('time').getAttribute('aria-label')).toBe('Ara mateix a la Gestoria');
    cleanup();
    const buida = render(<RellotgeViu etiqueta="" />);
    expect(buida.container.querySelector('time').getAttribute('aria-label')).toBe('Data i hora d’ara: 09:59 del 13/10/26');
  });

  test('etiquetaRellotge, sola: l’hora i el dia en l’ordre en què es veuen', () => {
    expect(etiquetaRellotge({ time: '18:42', date: '31/12/26' })).toBe('Data i hora d’ara: 18:42 del 31/12/26');
  });
});

/* Pedra Seca §9 · L'espècimen va primer: les expressions de la porta
   tooling/gates/tractor-cataleg.mjs (C1 registrat, C2 viu en un espècimen
   que l'importa per una ruta de PedraSeca). Com BotoTornarADalt, no entra a
   la façana index.js ni al nucli de les apps: l'importa PaginaApp. */
describe('el catàleg i el nucli', () => {
  test('porta del catàleg: registrat «viu» a fonaments i pintat de veres a EspecimenControlsBarra', () => {
    const registre = llig('src/sections/disseny/cataleg/registre.js');
    const entrades = [...registre.matchAll(/\{\s*nom:\s*'([^']+)',\s*fitxer:\s*'([^']+)'[^}]*estat:\s*'(\w+)'([^}]*)\}/g)]
      .map(([, nom, fitxer, estat, resta]) => ({ nom, fitxer, estat, fora: /fora:\s*true/.test(resta) }));
    expect(entrades.filter((e) => e.nom === 'RellotgeViu'))
      .toEqual([{ nom: 'RellotgeViu', fitxer: 'PedraSeca/atoms/RellotgeViu.jsx', estat: 'viu', fora: false }]);
    expect(registre).toMatch(/nom: 'RellotgeViu', fitxer: 'PedraSeca\/atoms\/RellotgeViu\.jsx', pagina: 'fonaments'/);
    const especimen = llig('src/sections/disseny/cataleg/detalls/EspecimenControlsBarra.jsx');
    const importats = [...especimen.matchAll(/import\s*\{([^}]+)\}\s*from\s*'[^']*(?:components\/(?:ui|PedraSeca)\/[^']+|UniversalElements)'/g)]
      .flatMap((m) => m[1].split(',').map((s) => s.trim()));
    expect(importats).toContain('RellotgeViu');
    expect(especimen).toMatch(/<RellotgeViu\b/);
    const codi = llig('src/components/PedraSeca/atoms/RellotgeViu.jsx');
    expect(codi).not.toMatch(/from '\.\.\/index\.js'|\sstyle=|className=/);
    /* Un sol component PascalCase exportat (C1): etiquetaRellotge és una funció. */
    expect([...codi.matchAll(/^export\s+(?:function|const)\s+([A-Z]\w*)/gm)].map((m) => m[1])).toEqual(['RellotgeViu']);
  });

  test('no entra a la façana de PedraSeca ni al contracte del nucli', () => {
    expect(llig('src/components/PedraSeca/index.js')).not.toMatch(/RellotgeViu/);
    expect(llig('src/apps/plataforma/contracteNucli.js')).not.toMatch(/RellotgeViu/);
  });

  test('ESLint amb zero missatges, avisos inclosos, als fitxers del rellotge, del seu ganxo i del seu espècimen', async () => {
    const FITXERS = [
      'src/components/PedraSeca/atoms/RellotgeViu.jsx', 'src/components/PedraSeca/atoms/RellotgeViu.test.jsx',
      'src/hooks/useAra.js', 'src/hooks/useAra.test.jsx',
      'src/sections/disseny/cataleg/detalls/EspecimenControlsBarra.jsx', 'src/sections/disseny/cataleg/versio.js'
    ];
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(FITXERS.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(FITXERS.length);
    expect(missatges).toEqual([]);
  }, 120000);
});
