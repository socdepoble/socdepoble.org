import { afterEach, expect, test } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { renderHtmlEditorial } from './htmlEditorial.jsx';
import { CosAmbTargetes } from './extensions/targetes/CosAmbTargetes.jsx';
import { segmentsAmbTargetes } from './extensions/targetes/formaDelGrup.js';
import { sanitizeHtml } from '../../../utils/sanitize.js';

afterEach(cleanup);
const VIDEO = '<div data-sdp-youtube="TlZWYbnGuCE" data-titol="Memòria local"><a href="https://www.youtube.com/watch?v=TlZWYbnGuCE">Reserva</a></div>';
const TARGETA = '<div data-sdp-targetes="" data-forma="sola" data-alineacio="dreta"><div data-sdp-targeta="pagina:legal" data-titol="Legal" data-ruta="/page/legal"></div></div>';
const ABANS = '<p><a href="https://font.example/abans">Font abans</a></p>';
const DESPRES = '<p><a href="https://font.example/despres" rel="sponsored">Font després</a></p>';

test.each([
  [true, 'noopener noreferrer', 'sponsored noopener noreferrer'],
  [false, 'ugc nofollow noopener noreferrer', 'ugc nofollow sponsored noopener noreferrer']
])('text + targeta + vídeo conserva la qualificació editorial=%s en els dos camins de lectura', (editorial, ordinari, sponsored) => {
  const opcions = { enllacosEditorials: editorial };
  const segments = segmentsAmbTargetes(sanitizeHtml(ABANS + TARGETA + VIDEO + DESPRES, opcions));
  expect(segments.some(segment => segment.tipus === 'targetes')).toBe(true);
  const { container } = render(<CosAmbTargetes segments={segments} enllacosEditorials={editorial} />);
  expect(container.querySelectorAll('.sdp-targetes .sdp-targeta')).toHaveLength(1);
  expect(container.querySelector('a[href="https://font.example/abans"]').getAttribute('rel')).toBe(ordinari);
  expect(container.querySelector('a[href="https://font.example/despres"]').getAttribute('rel')).toBe(sponsored);
  expect(container.querySelector('[data-sdp-youtube="TlZWYbnGuCE"] button')).not.toBeNull();
  expect(container.querySelector('iframe')).toBeNull();
});

test('l’HTML aportat no pot atribuir-se confiança editorial pel rel i no contamina la lectura següent', () => {
  const html = '<p><a href="https://font.example/abans" rel="editorial dofollow">Font abans</a></p>' + VIDEO;
  const trusted = render(<>{renderHtmlEditorial(html, { enllacosEditorials: true })}</>);
  expect(trusted.container.querySelector('a[href="https://font.example/abans"]').getAttribute('rel')).toBe('noopener noreferrer');
  trusted.unmount();
  const usuari = render(<>{renderHtmlEditorial(html)}</>);
  expect(usuari.container.querySelector('a[href="https://font.example/abans"]').getAttribute('rel')).toBe('ugc nofollow noopener noreferrer');
});
