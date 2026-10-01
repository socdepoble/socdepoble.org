import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
/* T5 · Base dels recursos a l'editor. useResolvedAsset publica la URL en un
   efecte: el primer commit pinta la reserva i el navegador ja la demana. Amb
   base, eixa reserva ha de penjar del paquet; si no, la capçalera i el logo
   viatjaven primer a l'arrel de l'amfitrió (404) i després es corregien.
   Ací el resolutor és el de veritat: no es simula assetResolver. */
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
import { UniversalEditorShell } from './UniversalEditorShell.jsx';
import { fixaBaseRecursos } from '../../config/assetResolver.js';

const PAQUET = 'https://wp.example/wp-content/plugins/socdepoble-enxufe/dist';
const HERO = '/assets/notes/bloc_notes_vintage.jpg';
const LOGO = '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg';

afterEach(() => {
  cleanup();
  fixaBaseRecursos('/');
});

/* Tots els valors que ha portat el src de cada imatge, des del primer commit.
   El contenidor s'observa ABANS de muntar: cada canvi posterior deixa el valor
   anterior (oldValue). React 18 torna a assignar el src d'una <img> en
   muntar-la (commitMount), així que el valor del primer commit hi queda
   sempre registrat, encara que no canvie. */
function valorsDelSrc(props) {
  const container = document.body.appendChild(document.createElement('div'));
  const observador = new MutationObserver(() => {});
  observador.observe(container, { subtree: true, attributes: true, attributeFilter: ['src'], attributeOldValue: true });
  render(
    <UniversalEditorShell id="d1" titleHtml="Títol" subtitleHtml="" leadHtml="" {...props}>
      <div data-testid="cos" />
    </UniversalEditorShell>,
    { container }
  );
  const registres = observador.takeRecords();
  observador.disconnect();
  const valors = (selector) => {
    const imatge = container.querySelector(selector);
    if (!imatge) return null;
    const historia = registres.filter((r) => r.target === imatge).map((r) => r.oldValue);
    return [...new Set([...historia, imatge.getAttribute('src')])];
  };
  return { hero: valors('img.sdp-hero__imatge'), logo: valors('img.sdp-logo-personalitzat'), container };
}

test('sense base, la capçalera i el logo només han portat el valor de sempre', () => {
  const { hero, logo } = valorsDelSrc({ heroImage: HERO, logoImage: LOGO });
  expect(hero).toEqual([HERO]);
  expect(logo).toEqual([LOGO]);
});

test('amb base, el primer commit ja porta la capçalera i el logo del paquet: cap render intermedi amb el valor cru', () => {
  fixaBaseRecursos(PAQUET);
  const { hero, logo } = valorsDelSrc({ heroImage: HERO, logoImage: LOGO });
  expect(hero).toEqual([`${PAQUET}${HERO}`]);
  expect(logo).toEqual([`${PAQUET}${LOGO}`]);
});

test('amb base, una referència sdp-media:// sense resoldre continua sense src a la reserva', () => {
  fixaBaseRecursos(PAQUET);
  const { container } = valorsDelSrc({ heroImage: 'sdp-media://mitjans/u/capcalera.jpg' });
  const imatge = container.querySelector('img.sdp-hero__imatge');
  expect(imatge).not.toBeNull();
  expect(imatge.hasAttribute('src')).toBe(false);
});
