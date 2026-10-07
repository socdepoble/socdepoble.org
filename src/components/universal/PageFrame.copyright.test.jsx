/**
 * Ordre del Mestre (261007) · El copyright de la capçalera d'una pàgina és
 * un enllaç a la pàgina «Drets d'autor» (/page/drets-autor), SEMPRE, siga
 * quin siga el text. El paràgraf de sempre (.sp-card-copyright
 * .page-title-copyright) es queda i l'enllaç va dins, amb el LinkComponent
 * de les etiquetes: un <a> sense router, el Link de l'app amb router
 * (UniversalPage hi passa Link).
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
vi.mock('../../config/assetResolver', () => ({ resolveAsset: (uri) => uri }));
vi.mock('../PedraSeca/hooks/useAccions.js', () => ({ useAccions: () => ({}) }));
import { Link, MemoryRouter, useLocation } from '../../app/contexts/RouterContext';
import { PageFrame } from './PageFrame.jsx';
import { COPYRIGHT_SDP } from './editorial.js';

afterEach(cleanup);

const COPYRIGHTS = [COPYRIGHT_SDP, '© Pepet', 'CC BY-SA 4.0 · Sóc de Poble'];

test.each(COPYRIGHTS)('sense router, un <a> a /page/drets-autor dins del paràgraf de sempre: «%s»', (copyright) => {
  const { container } = render(<PageFrame title="Títol" copyright={copyright} authorName="Pepa" authorHref="/gent/pepa" />);
  const paragraf = container.querySelector('header.page-title > p.sp-card-copyright.page-title-copyright');
  expect(paragraf.outerHTML).toBe(
    '<p class="sp-card-copyright page-title-copyright">'
    + `<a href="/page/drets-autor" class="sp-card-copyright__enllac">${copyright}</a></p>`
  );
  // El text del paràgraf continua sent el copyright (les proves de la Wiki i del Disseny el lligen així).
  expect(paragraf.textContent).toBe(copyright);
});

test('sense copyright, cap paràgraf ni cap enllaç de drets', () => {
  const { container } = render(<PageFrame title="Títol" authorName="Pepa" authorHref="/gent/pepa" />);
  expect(container.querySelector('.page-title-copyright')).toBeNull();
  expect(container.querySelector('.sp-card-copyright__enllac')).toBeNull();
});

function Ubicacio() {
  const { pathname } = useLocation();
  return <output data-testid="ubicacio">{pathname}</output>;
}

test('amb el Link de l’app (el de UniversalPage), el clic navega a la pàgina dels drets', () => {
  render(
    <MemoryRouter rutaInicial="/legal">
      <PageFrame title="Legal i privacitat" copyright="© Pepet" LinkComponent={Link} authorName="Pepa" authorHref="/gent/pepa" />
      <Ubicacio />
    </MemoryRouter>
  );
  const enllac = screen.getByRole('link', { name: '© Pepet' });
  expect(enllac.className).toBe('sp-card-copyright__enllac');
  expect(enllac.getAttribute('href')).toBe('/page/drets-autor');
  expect(enllac.closest('p').className).toBe('sp-card-copyright page-title-copyright');
  fireEvent.click(enllac);
  expect(screen.getByTestId('ubicacio').textContent).toBe('/page/drets-autor');
});
