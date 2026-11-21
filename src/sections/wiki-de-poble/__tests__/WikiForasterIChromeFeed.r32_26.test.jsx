import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { copyDePortada, PORTADA_WIKI_BRUGUERA } from '../wikiDePobleModel.js';
import { PageFrame } from '../../../components/universal/PageFrame.jsx';
import { PAGE_CHROME_MODES } from '../../../components/universal/UniversalUtils.js';

vi.mock('../../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(),
  Link: 'a',
}));

vi.mock('../../../components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

afterEach(() => {
  cleanup();
});

describe('R32.26 · lot_03 · Portada Bruguera de la Wiki i chrome="feed" opt-in', () => {
  /* v1.2.17 · Gauntlet R2 (L3R2-04) · La vinyeta ja és al copy (PAGE_COPY.wikidepoble): copyDePortada
     torna a ser la de la v1.2.16 i no substituïx res, perquè la vista, el <head> i el prerender lligen
     el mateix copy (seoWiki.test.js). */
  test('la portada de la Wiki porta la vinyeta Bruguera en valencià des del copy i respecta imatges pròpies', () => {
    const portada = copyDePortada(null, 'wikidepoble');
    expect(portada.image).toBe(PORTADA_WIKI_BRUGUERA.image);
    expect(portada.imageAlt).toBe(PORTADA_WIKI_BRUGUERA.imageAlt);
    expect(portada.imageAlt).toContain('WIKI DE POBLE');
    expect(portada.imageWidth).toBe(1024);
    expect(portada.imageHeight).toBe(1024);
    expect(PORTADA_WIKI_BRUGUERA.imageWebp).toBe('/assets/ui/plugins/wikidepoble_vinyeta.webp');

    const personalitzada = copyDePortada(
      { wikidepoble: { title: 'Wiki pròpia', image: '/assets/propia.webp', imageAlt: 'Alt propi' } },
      'wikidepoble',
    );
    expect(personalitzada.image).toBe('/assets/propia.webp');
    expect(personalitzada.imageAlt).toBe('Alt propi');
  });

  test('chrome="feed" està registrat, conserva BarraBlava, BarraTaronja, H1, H2 i accioPrincipal, i omet 3r logo i .lead', () => {
    expect(PAGE_CHROME_MODES.has('feed')).toBe(true);

    const { container } = render(
      <PageFrame
        chrome="feed"
        layout="contained"
        title="Mur"
        subtitle="Publicacions recents"
        lead="Text llarg que en mode feed no ha d'ocupar el primer plànol."
        accioPrincipal={<button type="button">Publicar al Mur</button>}
      >
        <div data-testid="contingut-taulell">Targeta 1</div>
      </PageFrame>,
    );

    const arrel = container.querySelector('.sdp-universal-page-container');
    expect(arrel.classList.contains('sdp-universal-page-container--feed')).toBe(true);
    expect(container.querySelector('header.bar-blue')).not.toBeNull();
    expect(container.querySelector('section.bar-orange')).not.toBeNull();
    expect(container.querySelector('header.page-title h1').textContent).toBe('Mur');
    expect(container.querySelector('header.page-title img.page-title-logo')).toBeNull();
    expect(screen.getByRole('button', { name: 'Publicar al Mur' })).not.toBeNull();
    expect(container.querySelector('.page-intro h2').textContent).toBe('Publicacions recents');
    expect(container.querySelector('.page-intro p.lead')).toBeNull();
    expect(screen.getByTestId('contingut-taulell').textContent).toBe('Targeta 1');
  });

  /* v1.2.17 · IDEA-313 deroga les dues propostes de R32.26 (cinta i hostaleria): la benvinguda del
     Foraster té ara una sola forma, provada a src/sections/xat/components/AcollidaForasterXat.test.jsx. */
});
