/**
 * AssaigPlaca5PerfilsR32_59.test.jsx — Ronda G6 (R32.59_gemini) · Assaig a la Plaça
 * amb 5 perfils rurals post-fortificació.
 *
 * Verifica els 4 invariants empírics caçats i corregits durant la sessió CDP:
 *   1. BarraTaronja en contenidors estrets (<= 367px i <= 280px) amb data-centre="buit"
 *      oculta per CSS `.sdp-emoticona-barra` perquè `.bar-actions` no siga expulsada a
 *      una segona fila fora del fons taronja damunt del logotip o d'«Edició avançada».
 *   2. Els enllaços del Camí i Arbre Territorial (`.sdp-arbre a`) garanteixen alçada
 *      tàctil mínima `var(--sdp-touch-min)` (44px) i escalen a `3rem` (48px) en
 *      `Mode Bancal + Mode Sènior` (`data-sdp-senior="true"`).
 *   3. `ControlSection` oculta reactivament la targeta d'IA `control-card-nodrir-iaia`
 *      quan l'usuari activa «Experiència 100 % humana» (`nivellIaia === 0`) fins i tot
 *      amb `VITE_SDP_CURADORIA_CULTURAL=1`, i habilita `gestionaTeclaGraella` a totes
 *      les graelles `.sdp-card-grid`.
 *   4. `PillToggle` i `Botonera` permeten desplaçar el focus horitzontalment (o
 *      verticalment en `Botonera vertical`) amb `ArrowRight`/`ArrowLeft`/`Home`/`End`
 *      sense alterar `Tab` ni `aria-pressed`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';
import { MemoryRouter } from '../../app/contexts/RouterContext';
import { PillToggle } from '../../components/PedraSeca/molecules/PillToggle.jsx';
import { Botonera } from '../../components/PedraSeca/molecules/Botonera.jsx';
import { activaModeHumaPur } from '../realitat/nivellIaia.js';

vi.mock('../../components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({
    t: (_clau, reserva) => reserva,
    resolveAsset: (v) => v,
    language: 'ca',
  }),
  useUIState: () => ({ externalConfig: { dataMode: 'seed' }, language: 'ca' }),
  useUIActionsOpcional: () => ({
    t: (_clau, reserva) => reserva,
    language: 'ca',
  }),
  useUIStateOpcional: () => ({ language: 'ca' }),
}));
vi.mock('../../components/universal/EixidaSegura.jsx', () => ({
  useEixidaSegura: () => ({ demana: vi.fn(), ocupat: false, avis: null, error: null }),
}));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ title, children }) => (
    <section data-pagina="control">
      <p data-titol="pagina">{title}</p>
      {children}
    </section>
  ),
}));

import ControlSection from './ControlSection.jsx';

describe('R32.59 · Assaig a la Plaça (5 perfils rurals post-fortificació)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    cleanup();
  });

  test('CSS BarraTaronja <=367px amb data-centre="buit" retira la caixa de .sdp-emoticona-barra i .sdp-arbre a garanteix diana tàctil >=44px i 3rem en Sènior', () => {
    const componentsCss = fs.readFileSync(path.resolve(process.cwd(), 'src/css/components.css'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ');
    const seniorCss = fs.readFileSync(path.resolve(process.cwd(), 'src/css/diferit-mode-senior.css'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ');

    expect(componentsCss).toContain('section.bar-orange[data-centre="buit"] > .sdp-emoticona-barra { display: none; }');
    expect(componentsCss).toContain('.sdp-molla__enllac, .sdp-arbre a { display: inline-flex; align-items: center; min-height: var(--sdp-touch-min);');
    expect(seniorCss).toContain('.sdp-arbre a');
    expect(seniorCss).toContain('min-height: 3rem;');
  });

  test('ControlSection amaga reactivament La IAIA Sabuda en Experiència 100 % humana i exposa data-graella-teclat a les graelles', () => {
    vi.stubEnv('VITE_SDP_CURADORIA_CULTURAL', '1');
    act(() => { activaModeHumaPur(false); });

    const { container } = render(
      <MemoryRouter rutaInicial="/control">
        <ControlSection />
      </MemoryRouter>,
    );

    expect(screen.queryByTestId('control-card-nodrir-iaia')).not.toBeNull();
    const graelles = container.querySelectorAll('.sdp-card-grid[data-graella-teclat]');
    expect(graelles.length).toBeGreaterThanOrEqual(3);

    act(() => { activaModeHumaPur(true); });
    expect(screen.queryByTestId('control-card-nodrir-iaia')).toBeNull();

    act(() => { activaModeHumaPur(false); });
    expect(screen.queryByTestId('control-card-nodrir-iaia')).not.toBeNull();
  });

  test('PillToggle i Botonera mouen el focus amb ArrowRight, ArrowLeft, Home i End', () => {
    const opcions = [
      { valor: 'all', text: 'Mostrar tot' },
      { valor: 'sistema', text: 'Sóc de Poble' },
      { valor: 'mercat', text: 'Mercat' },
      { valor: 'mapa', text: 'Mapa' },
    ];
    render(
      <MemoryRouter rutaInicial="/mur">
        <PillToggle etiqueta="Filtres del mur" opcions={opcions} valor="all" />
        <Botonera
          etiqueta="Seccions"
          opcions={[
            { valor: 'xat', to: '/xat', text: 'Xat', activa: true },
            { valor: 'mur', to: '/mur', text: 'Mur' },
            { valor: 'pobles', to: '/pobles', text: 'Pobles' },
          ]}
        />
      </MemoryRouter>,
    );

    const grup = screen.getByRole('group', { name: 'Filtres del mur' });
    const botons = [...grup.querySelectorAll('button')];
    botons[0].focus();
    fireEvent.keyDown(botons[0], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(botons[1]);
    fireEvent.keyDown(botons[1], { key: 'End' });
    expect(document.activeElement).toBe(botons[3]);
    fireEvent.keyDown(botons[3], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(botons[0]);
    fireEvent.keyDown(botons[0], { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(botons[3]);
    fireEvent.keyDown(botons[3], { key: 'Home' });
    expect(document.activeElement).toBe(botons[0]);

    const nav = screen.getByRole('navigation', { name: 'Seccions' });
    const links = [...nav.querySelectorAll('a')];
    links[0].focus();
    fireEvent.keyDown(links[0], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(links[1]);
    fireEvent.keyDown(links[1], { key: 'End' });
    expect(document.activeElement).toBe(links[2]);
  });
});
