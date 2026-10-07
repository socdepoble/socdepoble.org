/**
 * Ordre del Mestre (261007) · El copyright de la targeta sense router
 * llegible: un mock que només porta useNavigate (el de NotaFitxa.test.jsx i
 * de moltes proves de secció) o una peça pintada fora de RouterProvider. La
 * targeta no tomba i l'enllaç és un <a> amb la mateixa ruta i la mateixa
 * classe que el Link: el DOM és el mateix.
 */
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('../../../app/contexts/RouterContext', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('../../universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
import { UniversalCard } from './UniversalCard.jsx';

afterEach(cleanup);

test('sense router, el copyright és un <a> a /page/drets-autor i la targeta es pinta sencera', () => {
  const { container } = render(<UniversalCard title="Nota" body="Text" copyright="© Pepet" hasFooter={false} />);
  expect(container.querySelector('article.sp-card')).not.toBeNull();
  expect(container.querySelector('.sp-card-body > p.sp-card-copyright').outerHTML).toBe(
    '<p class="sp-card-copyright"><a href="/page/drets-autor" class="sp-card-copyright__enllac">© Pepet</a></p>'
  );
});
