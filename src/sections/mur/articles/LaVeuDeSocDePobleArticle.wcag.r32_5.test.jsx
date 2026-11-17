import '../../../../tests/helpers/diccionaris.js';
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { RouterProvider } from '../../../app/contexts/RouterContext.jsx';
import { UIContext } from '../../../app/contexts/objectesDeContext.js';
import { LA_VEU_DE_SOC_DE_POBLE_POST, LA_VEU_DE_SOC_DE_POBLE_RUTA } from './laVeuDeSocDePobleContent.js';
import { LaVeuDeSocDePobleArticle } from './LaVeuDeSocDePobleArticle.jsx';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function muntaArticle(idioma = 'ca') {
  return render(
    <UIContext.Provider value={{ language: idioma }}>
      <RouterProvider initialPath={LA_VEU_DE_SOC_DE_POBLE_RUTA}>
        <LaVeuDeSocDePobleArticle item={LA_VEU_DE_SOC_DE_POBLE_POST} />
      </RouterProvider>
    </UIContext.Provider>
  );
}

describe('R32.5 · Lot 03 · LaVeuDeSocDePobleArticle 4 estats accessibles WCAG AAA per teclat', () => {
  test('exposa els 4 estats explícits (repos -> carregant -> reproduint -> error), operació per teclat (±5s / Escape) i transcripció oberta en error', async () => {
    let resolPlay;
    const playSpy = vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function mockPlay() {
      Object.defineProperty(this, 'paused', { value: false, configurable: true });
      return new Promise((resolve) => { resolPlay = resolve; });
    });
    const pauseSpy = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function mockPause() {
      Object.defineProperty(this, 'paused', { value: true, configurable: true });
      this.dispatchEvent(new Event('pause'));
    });

    const { container } = muntaArticle('ca');
    const items = container.querySelectorAll('.sdp-banc-veus__item');
    expect(items).toHaveLength(7);

    const primer = items[0];
    const audio = primer.querySelector('audio.sdp-banc-veus__audio');

    /* 1. Estat inicial: repos */
    expect(primer.getAttribute('data-estat-audio')).toBe('repos');
    const botoEscolta = within(primer).getByRole('button', { name: /Escolta la mostra de Gina/i });
    expect(botoEscolta.getAttribute('aria-pressed')).toBe('false');

    /* 2. Estat: carregant (amb <progress> semàntic i aria-busy="true") */
    fireEvent.click(botoEscolta);
    expect(playSpy).toHaveBeenCalledTimes(1);
    expect(primer.getAttribute('data-estat-audio')).toBe('carregant');
    expect(primer.querySelector('progress.sdp-banc-veus__progres')).not.toBeNull();
    expect(within(primer).getByRole('button', { name: /Atura la càrrega de Gina/i }).getAttribute('aria-busy')).toBe('true');

    /* 3. Estat: reproduint (rellotge tabular, control de posició amb ArrowRight/ArrowLeft ±5s i Escape per pausar) */
    Object.defineProperty(audio, 'duration', { value: 12, configurable: true });
    fireEvent.loadedMetadata(audio);
    await act(async () => {
      resolPlay();
      fireEvent.playing(audio);
    });
    expect(primer.getAttribute('data-estat-audio')).toBe('reproduint');
    expect(within(primer).getByRole('button', { name: /Pausa la mostra de Gina/i }).getAttribute('aria-pressed')).toBe('true');

    const slider = within(primer).getByRole('slider', { name: /Posició de la mostra de Gina/i });
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(Number(slider.value)).toBe(5);
    fireEvent.keyDown(slider, { key: 'ArrowLeft' });
    expect(Number(slider.value)).toBe(0);

    /* Escape pausa immediatament i torna a repos */
    fireEvent.keyDown(primer, { key: 'Escape' });
    expect(pauseSpy).toHaveBeenCalled();
    expect(primer.getAttribute('data-estat-audio')).toBe('repos');

    /* 4. Estat: error (role="alert", botó de reintent i obertura automàtica de l'alternativa textual) */
    fireEvent.error(audio);
    expect(primer.getAttribute('data-estat-audio')).toBe('error');
    const alerta = within(primer).getByRole('alert');
    expect(alerta.textContent).toContain('No s’ha pogut carregar l’àudio de Gina');
    expect(within(alerta).getByRole('button', { name: 'Torna a provar la mostra' })).toBeTruthy();
    expect(primer.querySelector('details.sdp-banc-veus__transcripcio').hasAttribute('open')).toBe(true);
  });

  /* Vitest no processa el CSS (un import ?inline hi torna ''): la prova és sobre les fonts. */
  test('el CSS dels 4 estats és un full diferit (src/css/diferit-la-veu.css) que adopta l’article, fora de l’arrencada', () => {
    const llig = (rel) => readFileSync(path.join(process.cwd(), rel), 'utf8');
    const full = llig('src/css/diferit-la-veu.css');
    for (const classe of ['sdp-banc-veus__audio--sincronitzat', 'sdp-banc-veus__controlador', 'sdp-banc-veus__progres', 'sdp-banc-veus__posicio', 'sdp-banc-veus__transcripcio-cos']) {
      expect(full).toContain(`.${classe}`);
      expect(llig('src/css/modules.css')).not.toContain(`.${classe}`);
      expect(llig('src/css/components.css')).not.toContain(`.${classe}`);
    }
    const article = llig('src/sections/mur/articles/LaVeuDeSocDePobleArticle.jsx');
    expect(article).toContain("import cssLaVeu from '../../../css/diferit-la-veu.css?inline';");
    expect(article).toContain("useFullDiferit(bancVeusRef, 'la-veu', cssLaVeu);");
  });

  test.each([
    ['es', /Escuchar la muestra de/i],
    ['en', /Play sample for/i],
    ['eu', /Entzun .* ahotsaren lagina/i],
    ['gl', /Escoitar a mostra de/i],
  ])('traduïx els controls accessibles del banc de mostres en %s', (idioma, patro) => {
    const { container } = muntaArticle(idioma);
    const primer = container.querySelector('.sdp-banc-veus__item');
    expect(within(primer).getByRole('button', { name: patro })).toBeTruthy();
  });
});
