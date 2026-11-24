/**
 * TeclatFocusAAAR32_57.test.jsx · Ronda G5 (R32.57 · U-DIS-02)
 * Verifica:
 * 1. Navegació 2D per teclat (`gestionaTeclaGraella`: ← → ↑ ↓ Home End) a les
 *    graelles de MercatSection, SeccioVertical i CalendariDelPoble.
 * 2. Restauració segura de focus en desmuntatge condicional (`{obert && <Dialeg obert />}`)
 *    a la SPA sense fals `esc` forçat, i protecció contra nodes desconnectats o `[inert]`/`[hidden]`.
 * 3. Contenció CSS d'overscroll en modals nadius (`:where(dialog:modal)` i `:where(dialog)::backdrop`
 *    amb `overscroll-behavior: contain` + `overflow: hidden` sense mutar `html`/`body` → CLS = 0).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

const estatMocks = vi.hoisted(() => ({
  mur: null,
  navigate: vi.fn(),
}));

vi.mock('../../../app/contexts/RouterContext', () => ({
  useNavigate: () => estatMocks.navigate,
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children),
}));
vi.mock('../../universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));
vi.mock('../../../app/contexts/UIContext', async (original) => ({
  ...(await original()),
  useUIActions: () => ({ language: 'ca', t: (_k, fb) => fb }),
  useUIState: () => ({ language: 'ca', externalConfig: {} }),
  useUIStateOpcional: () => ({ language: 'ca', externalConfig: {} }),
}));
vi.mock('../../../app/contexts/CoreContentContext', () => ({
  useCoreContent: () => ({ towns: [], status: 'ready' }),
}));
vi.mock('../../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../../sections/mur/MurContext', () => ({
  useMur: () => estatMocks.mur,
}));
vi.mock('../../universal/workspace/ProjeccionsEnSuperficie.jsx', () => ({
  default: () => null,
}));

import { Dialeg, DialegConfirmacio } from './Dialeg.jsx';
import MercatSection from '../../../sections/mercat/MercatSection.jsx';
import SeccioVertical from '../../../sections/verticals/SeccioVertical.jsx';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function simulaGeometria2Columnes(graella) {
  vi.spyOn(document.documentElement, 'getBoundingClientRect').mockReturnValue({
    x: 0, y: 0, top: 0, left: 0, right: 1200, bottom: 900, width: 1200, height: 900,
  });
  const celles = [...graella.children];
  celles.forEach((cella, i) => {
    const col = i % 2;
    const fila = Math.floor(i / 2);
    const rect = {
      x: col * 400,
      y: fila * 320,
      left: col * 400,
      right: col * 400 + 380,
      top: fila * 320,
      bottom: fila * 320 + 300,
      width: 380,
      height: 300,
    };
    vi.spyOn(cella, 'getBoundingClientRect').mockReturnValue(rect);
    vi.spyOn(cella, 'getClientRects').mockReturnValue([rect]);
  });
}

describe('R32.57 · U-DIS-02 · Navegació 2D per teclat a Mercat i Verticals', () => {
  test('MercatSection exposa data-graella-teclat i recorre productes amb ArrowRight, ArrowDown, Home i End', () => {
    estatMocks.mur = {
      status: 'ready',
      error: null,
      refresh: vi.fn(),
      sortedMarketItems: [
        { id: 'p1', type: 'market', title: 'Oli novell', created_at: '2026-11-01T10:00:00Z' },
        { id: 'p2', type: 'market', title: 'Mel de romer', created_at: '2026-11-02T10:00:00Z' },
        { id: 'p3', type: 'market', title: 'Ametlla marcona', created_at: '2026-11-03T10:00:00Z' },
        { id: 'p4', type: 'market', title: 'Pa de llenya', created_at: '2026-11-04T10:00:00Z' },
      ],
    };
    const { container } = render(<MercatSection />);
    const graella = container.querySelector('.sdp-card-grid.sdp-graella-escalable[data-graella-teclat]');
    expect(graella).not.toBeNull();
    simulaGeometria2Columnes(graella);

    const enllacos = [...graella.querySelectorAll('article.sp-card')].map((card) =>
      card.querySelector('a, button'),
    );
    expect(enllacos).toHaveLength(4);

    enllacos[0].focus();
    fireEvent.keyDown(enllacos[0], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(enllacos[1]);

    fireEvent.keyDown(enllacos[1], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(enllacos[3]);

    fireEvent.keyDown(enllacos[3], { key: 'Home' });
    expect(document.activeElement).toBe(enllacos[0]);

    fireEvent.keyDown(enllacos[0], { key: 'End' });
    expect(document.activeElement).toBe(enllacos[3]);
  });

  test('SeccioVertical exposa data-graella-teclat i mou el focus 2D entre ofertes verticals', () => {
    estatMocks.mur = {
      status: 'ready',
      error: null,
      refresh: vi.fn(),
      sortedFeedPosts: [1, 2, 3, 4].map((n) => ({
        id: `v${n}`,
        type: 'vehicle',
        ambit: 'vehicle',
        estat: 'disponible',
        title: `Viatge ${n}`,
        created_at: `2026-11-0${n}T09:00:00Z`,
        dades: { modalitat: 'oferisc_places', lloc_eixida: 'La Torre', lloc_arribada: 'Alcoi', places: 2 },
      })),
    };
    const { container } = render(<SeccioVertical ambit="vehicle" />);
    const graella = container.querySelector('.sdp-card-grid.sdp-graella-escalable[data-graella-teclat]');
    expect(graella).not.toBeNull();
    simulaGeometria2Columnes(graella);

    const objectius = [...graella.querySelectorAll('article.sp-card')].map((card) =>
      card.querySelector('a, button'),
    );
    objectius[0].focus();
    fireEvent.keyDown(objectius[0], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(objectius[2]);

    fireEvent.keyDown(objectius[2], { key: 'ArrowUp' });
    expect(document.activeElement).toBe(objectius[0]);
  });
});

describe('R32.57 · U-DIS-02 · Restauració segura de focus en Dialeg i overscroll CSS', () => {
  test('desmuntar condicionalment un DialegConfirmacio a la SPA retorna el focus al disparador sense avisos espuris', () => {
    const onTanca = vi.fn();
    function ConsumidorCondicional() {
      const [obert, setObert] = useState(false);
      return (
        <div>
          <button type="button" onClick={() => setObert(true)}>Esborrar element</button>
          {obert ? (
            <DialegConfirmacio
              obert
              destructiu
              titol="Segur que vols esborrar-ho?"
              onTanca={(motiu, info) => {
                onTanca(motiu, info);
                setObert(false);
              }}
              onConfirma={() => setObert(false)}
            />
          ) : null}
        </div>
      );
    }

    render(<ConsumidorCondicional />);
    const disparador = screen.getByRole('button', { name: 'Esborrar element' });
    disparador.focus();
    fireEvent.click(disparador);

    const cancelar = screen.getByRole('button', { name: 'Cancel·lar' });
    expect(document.activeElement).toBe(cancelar);

    fireEvent.click(cancelar);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onTanca).toHaveBeenCalledTimes(1);
    expect(onTanca).toHaveBeenCalledWith('boto', undefined);
    expect(document.activeElement).toBe(disparador);
  });

  test('si el disparador passa a estar [inert], [hidden] o desconnectat en tancar, no intenta enfocar-lo', () => {
    const embolcall = document.createElement('div');
    const disparador = document.createElement('button');
    disparador.textContent = 'Disparador efímer';
    embolcall.appendChild(disparador);
    document.body.appendChild(embolcall);
    disparador.focus();

    const focusSpy = vi.spyOn(disparador, 'focus');
    const { unmount } = render(
      <Dialeg obert titol="Modal temporal" onTanca={() => {}}>
        <button type="button">Dins</button>
      </Dialeg>,
    );
    focusSpy.mockClear();

    embolcall.setAttribute('inert', '');
    unmount();
    expect(focusSpy).not.toHaveBeenCalled();
    embolcall.remove();
  });

  test('sdp.css conté overscroll-behavior: contain a :where(dialog:modal) i overflow: hidden + overscroll-behavior: contain a :where(dialog)::backdrop', () => {
    const sdpCss = readFileSync(resolve(process.cwd(), 'src/css/sdp.css'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ');
    expect(sdpCss).toContain(':where(dialog:modal) { overscroll-behavior: contain; }');
    expect(sdpCss).toContain(':where(dialog)::backdrop { background: var(--sdp-fons-vel); overflow: hidden; overscroll-behavior: contain; }');

    const calendariJsx = readFileSync(resolve(process.cwd(), 'src/sections/calendari/CalendariDelPoble.jsx'), 'utf8');
    expect(calendariJsx).toContain('onKeyDown={gestionaTeclaGraella}');
    expect(calendariJsx).toContain('data-graella-teclat=""');
  });
});
