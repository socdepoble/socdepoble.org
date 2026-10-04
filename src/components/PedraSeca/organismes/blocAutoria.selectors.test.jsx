/**
 * Front «autoria» (261004) · Els dos selectors del bloc propi de modules.css
 * casen amb el DOM de veres de les peces, i només on toca:
 *  · `.sdp-card-llista > .sp-card` · les targetes planes de la variant
 *    'llista' de GraellaTargetes (la «Revista» del Lector), no les de la
 *    graella: la targeta ocupa la columna, sense el sostre de la del Mur.
 *  · `.sp-card-link-overlay[aria-keyshortcuts]` · el sobreposat d'una
 *    targeta amb acció secundària (enllaç o botó), mai el d'una sense: sense
 *    la prop, el píxel no canvia.
 * Els selectors es lligen del full, no s'escriuen ací: si el bloc canvia, la
 * prova ho veu. jsdom no aplica el full; la regla la comprova
 * qualitat.nucliApps.test.js.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext';

vi.mock('../../universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));

import { GraellaTargetes } from './GraellaTargetes.jsx';
import { UniversalCard } from './UniversalCard.jsx';

const MODULES = readFileSync(path.join(process.cwd(), 'src/css/modules.css'), 'utf8');
const inici = MODULES.indexOf('Front «autoria».');
const bloc = inici < 0 ? '' : MODULES.slice(MODULES.indexOf('@layer components {', inici), MODULES.indexOf('\n}\n', inici) + 2);
/* Els selectors de les regles del bloc, en ordre. */
const SELECTORS = [...bloc.matchAll(/^\s{2}([^{}\n]+?)\s*\{/gm)].map((m) => m[1].trim());
const [LLISTA, SOBREPOSAT] = SELECTORS;

const pinta = (node) => render(<MemoryRouter>{node}</MemoryRouter>).container;

afterEach(cleanup);

describe('el bloc del front «autoria» casa amb el DOM de les peces', () => {
  test('el full porta les dues regles del bloc', () => {
    expect(SELECTORS).toEqual(['.sdp-card-llista > .sp-card', '.sp-card-link-overlay[aria-keyshortcuts]']);
  });

  test('la targeta plana de la variant llista, sí; la de la graella, no', () => {
    const llista = pinta(
      <GraellaTargetes variant="llista" etiqueta="Revista">
        <UniversalCard variant="pla" title="U" />
        <UniversalCard variant="pla" title="D" />
      </GraellaTargetes>
    );
    const planes = [...llista.querySelectorAll('.sp-card')];
    expect(planes).toHaveLength(2);
    expect(planes.map((targeta) => targeta.matches(LLISTA))).toEqual([true, true]);
    cleanup();
    const graella = pinta(<GraellaTargetes etiqueta="Notícies"><UniversalCard title="U" /></GraellaTargetes>);
    expect(graella.querySelector('.sp-card').matches(LLISTA)).toBe(false);
  });

  test('el sobreposat amb acció secundària, sí (enllaç i botó); sense, no', () => {
    const secundaria = () => {};
    const enllac = pinta(<UniversalCard title="A" mainHref="/mur/a" onAccioSecundaria={secundaria} />);
    expect(enllac.querySelector('.sp-card-link-overlay').matches(SOBREPOSAT)).toBe(true);
    cleanup();
    const boto = pinta(<UniversalCard title="B" onMainClick={() => {}} onAccioSecundaria={secundaria} />);
    const sobreposatBoto = boto.querySelector('.sp-card-link-overlay');
    expect(sobreposatBoto.tagName).toBe('BUTTON');
    expect(sobreposatBoto.matches(SOBREPOSAT)).toBe(true);
    cleanup();
    const sense = pinta(<UniversalCard title="C" mainHref="/mur/c" />);
    expect(sense.querySelector('.sp-card-link-overlay').matches(SOBREPOSAT)).toBe(false);
  });
});
