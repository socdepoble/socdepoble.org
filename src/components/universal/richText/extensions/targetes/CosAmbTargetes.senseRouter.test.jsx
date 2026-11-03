/**
 * CosAmbTargetes.senseRouter.test.jsx — O5-CLAUDE-1 (ordre del Mestre, Onada 5)
 *
 * Una targeta incrustada que es pinta fora de RouterProvider (una prova, una
 * lectura fora de l'app) no tomba el cos: es llig, els seus enllaços són <a>
 * amb la mateixa ruta i no ofereix Connectar. Dins d'un encaminador, el DOM
 * dels enllaços és el de sempre (el Link de l'app).
 */
import { afterEach, describe, expect, test } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { CosAmbTargetes } from './CosAmbTargetes.jsx';
import { segmentsAmbTargetes } from './formaDelGrup.js';
import { MemoryRouter } from '../../../../../app/contexts/RouterContext';
import { sanitizeHtml } from '../../../../../utils/sanitize.js';

const HTML = '<p>Abans.</p><div data-sdp-targetes="" class="sdp-targetes" data-forma="sola" data-alineacio="dreta">'
  + '<div data-sdp-targeta="pagina:drets-autor" class="sdp-targeta" data-ruta="/page/drets-autor" data-titol="Drets d\'autor"'
  + ' data-subtitol="Totes les llicències, explicades amb paraules de poble" data-autor="Sóc de Poble" data-autor-ruta="/projecte">'
  + '<a href="/page/drets-autor" rel="noopener noreferrer nofollow">Drets d\'autor</a></div></div><p>Després.</p>';

const segments = () => segmentsAmbTargetes(sanitizeHtml(HTML));
afterEach(cleanup);

describe('CosAmbTargetes fora de RouterProvider', () => {
  test('la targeta es pinta com la reserva de l’HTML, amb els trossos de text, sense cap error', () => {
    const { container } = render(<CosAmbTargetes segments={segments()} className="cms-preview" />);
    expect(container.querySelector('article.cms-preview.sdp-amb-targetes')).not.toBeNull();
    const targeta = container.querySelector('.sdp-targetes > .sdp-targeta');
    expect(targeta).not.toBeNull();
    expect([...targeta.querySelectorAll('a')].map((a) => [a.getAttribute('href'), a.textContent]))
      .toEqual([['/page/drets-autor', "Drets d'autor"]]);
    expect(targeta.querySelector('.sp-card')).toBeNull();
    expect(container.textContent).toContain('Abans.');
    expect(container.textContent).toContain('Després.');
  });

  test('dins d’un encaminador, la targeta de sempre (UniversalCard) cap a la mateixa ruta', () => {
    const { container } = render(<MemoryRouter><CosAmbTargetes segments={segments()} /></MemoryRouter>);
    const targeta = container.querySelector('.sdp-targetes > .sdp-targeta');
    expect(targeta.querySelector('a.sp-card-link-overlay').getAttribute('href')).toBe('/page/drets-autor');
  });

  test('una ruta perillosa a la instantània no arriba a cap href', () => {
    const perillosa = HTML.replaceAll('/page/drets-autor', 'javascript:alert(1)');
    const { container } = render(<CosAmbTargetes segments={segmentsAmbTargetes(sanitizeHtml(perillosa))} />);
    expect([...container.querySelectorAll('a')].some((a) => /^javascript:/i.test(a.getAttribute('href') || ''))).toBe(false);
  });
});
