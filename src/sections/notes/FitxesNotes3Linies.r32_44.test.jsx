import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../hooks/useResolvedAsset.js', () => ({
  useResolvedAsset: (ref) => ref,
  useResolvedAssetState: (ref) => ({
    url: ref,
    status: ref ? 'ready' : 'idle',
    error: null,
    isLoading: false,
    retry: () => {},
    cancel: () => {}
  })
}));
vi.mock('../detail/elementDeSeccio.js', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    useOriginalDeConnexio: () => ({
      targeta: {
        titol: 'Crònica connectada de prova amb un títol molt llarg que ocupa dues línies completes sense tallar-se',
        subtitol: 'Subtítol complet d’una sola línia amb punts suspensius al final',
        entradilla: 'Entradilla de reserva',
        imatge: '/assets/uploads/prova.webp',
        autor: { nom: 'Sóc de Poble' },
        data: { date: '22/11/26', dateTime: '2026-11-22T10:00:00Z' }
      }
    })
  };
});

import { NotaFitxa } from './NotaFitxa.jsx';
import { ConnexioFitxa } from './ConnexioFitxa.jsx';
import { PublicacioFitxa } from './PublicacioDetall.jsx';
import { publicacioComANota } from './masDeLUsuari.js';

afterEach(cleanup);

describe('IDEA-325 · Fitxes de NOTES amb 3 línies completes (2 títol + 1 subtítol, zero 3a línia tallada)', () => {
  test('PublicacioFitxa unifica .sdp-nota-fitxa__capcalera (títol + data tabular a la dreta) i 1 línia d’entradilla', () => {
    const publicacio = publicacioComANota({
      id: 'copies-seguretat',
      title: 'Còpies de seguretat a Sóc de Poble: del llibre de comptes del mas al rellotge del servidor i la ciència de les dades',
      entradilla: 'Com blindem les dades de la comunitat amb snapshots horaris i verificació criptogràfica.',
      date: '2026-11-14T10:30:00.000Z',
      image_url: '/assets/uploads/copies.webp'
    }, 'mur');

    const { container } = render(
      <div className="sdp-bloc-list--notes">
        <PublicacioFitxa item={publicacio} active={true} onSelect={() => {}} />
      </div>
    );

    const boto = container.querySelector('button.sdp-gestor-fitxa');
    expect(boto).not.toBeNull();
    expect(boto.classList.contains('is-active')).toBe(true);
    expect(boto.getAttribute('aria-current')).toBe('true');

    const capcalera = boto.querySelector(':scope > .sdp-gestor-fitxa__text > .sdp-nota-fitxa__capcalera');
    expect(capcalera).not.toBeNull();

    const titol = capcalera.querySelector(':scope > .sdp-gestor-fitxa__titol');
    const data = capcalera.querySelector(':scope > time.sdp-nota-fitxa__data');
    expect(titol?.textContent).toContain('Còpies de seguretat a Sóc de Poble');
    expect(data?.textContent).toMatch(/14\/11\/26/);

    const subtitol = boto.querySelector(':scope > .sdp-gestor-fitxa__text > .sdp-gestor-fitxa__subtitol');
    expect(subtitol?.textContent).toBe(
      'Com blindem les dades de la comunitat amb snapshots horaris i verificació criptogràfica.'
    );
  });

  test('NotaFitxa, PublicacioFitxa i ConnexioFitxa comparteixen la mateixa anatomia de capçalera + 1 subtítol', () => {
    const notaItem = {
      id: 'n-llarga',
      title: 'Títol llarg de nota per a comprovar les dues línies completes a la columna central',
      subtitle: '22/11/26',
      updatedAt: '2026-11-22T12:00:00Z',
      excerpt: 'Resum d’una sola línia',
      data: { title: 'Títol llarg de nota per a comprovar les dues línies completes a la columna central', lead: 'Resum d’una sola línia' }
    };
    const connexioItem = {
      id: 'c-llarga',
      data: { title: '', origen: { objecte: 'publicacio' }, updatedAt: '2026-11-22T12:00:00Z' }
    };
    const pubItem = publicacioComANota({
      id: 'p-llarga',
      title: 'Publicació amb títol de dues línies completes',
      post_subtitle: 'Subtítol de la crònica',
      date: '2026-11-22T12:00:00Z'
    }, 'mur');

    const { container } = render(
      <div className="sdp-bloc-list--notes">
        <NotaFitxa item={notaItem} active={false} onSelect={() => {}} />
        <PublicacioFitxa item={pubItem} active={false} onSelect={() => {}} />
        <ConnexioFitxa item={connexioItem} active={false} onSelect={() => {}} />
      </div>
    );

    const fitxes = [...container.querySelectorAll('button.sdp-gestor-fitxa')];
    expect(fitxes).toHaveLength(3);
    for (const fitxa of fitxes) {
      expect(fitxa.querySelector(':scope > .sdp-gestor-fitxa__text > .sdp-nota-fitxa__capcalera > .sdp-gestor-fitxa__titol')).not.toBeNull();
      expect(fitxa.querySelector(':scope > .sdp-gestor-fitxa__text > .sdp-nota-fitxa__capcalera > time.sdp-nota-fitxa__data')).not.toBeNull();
      expect(fitxa.querySelectorAll('.sdp-gestor-fitxa__subtitol')).toHaveLength(1);
    }
  });

  test('CSS de .sdp-bloc-list--notes blinda flex-grow 0 al títol (màx 2 línies) i 1 línia amb el·lipsi al subtítol (≤ 86px)', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/css/modules.css'), 'utf8');
    const blocTitol = /\.sdp-bloc-list--notes\s+\.sdp-gestor-fitxa__titol\s*\{([^}]+)\}/.exec(css)?.[1] ?? '';
    expect(blocTitol).toMatch(/flex\s*:\s*0\s+1\s+auto/);
    expect(blocTitol).toMatch(/max-block-size\s*:\s*calc\(2\s*\*\s*1\.3em\)/);
    expect(blocTitol).toMatch(/line-height\s*:\s*1\.3/);

    const blocData = /\.sdp-nota-fitxa__data\s*\{([^}]+)\}/.exec(css)?.[1] ?? '';
    expect(blocData).toMatch(/margin-inline-start\s*:\s*auto/);
    expect(blocData).toMatch(/font-variant-numeric\s*:\s*tabular-nums/);

    const blocSubtitol = /\.sdp-bloc-list--notes\s+\.sdp-gestor-fitxa__subtitol\s*\{([^}]+)\}/.exec(css)?.[1] ?? '';
    expect(blocSubtitol).toMatch(/white-space\s*:\s*nowrap/);
    expect(blocSubtitol).toMatch(/text-overflow\s*:\s*ellipsis/);
    expect(blocSubtitol).toMatch(/max-block-size\s*:\s*1\.3em/);
    expect(blocSubtitol).not.toMatch(/line-clamp\s*:\s*2/);

    // Pressupost vertical dins --sdp-bloc-fitxa-mida (86px): 2*16*1.3 + 4 + 1*14*1.3 + 16 = 79.8 <= 86
    const pressupost = 2 * 16 * 1.3 + 4 + 1 * 14 * 1.3 + 16;
    expect(pressupost).toBeLessThanOrEqual(86);
  });
});
