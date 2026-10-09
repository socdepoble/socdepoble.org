import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

/* Correcció de l'Onada 6 (QA visual: /consola/inventari a 1280×900, la taula
   feia 1.341px dins de 925 i la columna «Accions» començava a x=1.481, fora
   de la finestra) · La columna d'accions porta la seua classe a la capçalera
   i a cada fila, i des de 721px s'enganxa a la dreta de la taula que es
   desplaça. jsdom no pinta: es comprova el DOM que la CSS necessita i la
   regla escrita. Verificat al navegador (1280×900: «Accions» a x=1.052-1.225,
   dins de la finestra; 375×812: com abans). */
vi.mock('../../../app/contexts/RouterContext', () => ({
  useNavigate: () => () => {},
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>,
  useSearchParams: () => [new URLSearchParams(''), () => {}]
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: () => {} })
}));
import { InventariMapa } from './InventariMapa.jsx';

afterEach(cleanup);

const n = (id, atributs = {}) => ({ id, tipus: 'skill', font: null, atributs });
const MAPA = Object.freeze({
  schema: 'sdp.mapa.v1', generat: '2026-10-09T01:41:50.088Z', tall: null,
  nodes: [n('skill:sdp-workflow', { core: true }), n('skill:core-higiene-escriptori')],
  arestes: [], tasques: [],
  avisos: [{ node: 'skill:core-higiene-escriptori', codi: 'frontmatter-invalid', severitat: 'alta', evidencia: 'x' }],
  salut: []
});

test('la columna d’accions porta la seua classe a la capçalera i a cada fila; la caixa de la taula, cap de pròpia (T9)', () => {
  render(<InventariMapa mapa={MAPA} locale="ca-ES" />);
  const regio = screen.getByRole('region', { name: 'Inventari de skills' });
  expect(regio.className).toBe('sdp-taula sdp-taula--densa');
  const capcalera = [...regio.querySelectorAll('thead th')];
  expect(capcalera.at(-1).textContent).toBe('Accions');
  expect(capcalera.at(-1).className).toBe('sdp-inventari__accions');
  expect(capcalera.filter((th) => th.classList.contains('sdp-inventari__accions'))).toHaveLength(1);
  const files = [...regio.querySelectorAll('tbody tr')];
  expect(files).toHaveLength(2);
  for (const fila of files) {
    const ultima = fila.lastElementChild;
    expect(ultima.className).toBe('sdp-inventari__accions');
    expect(ultima.querySelector('.sdp-explorador__accions button')).not.toBeNull();
  }
});

const net = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');

const ENGANXADA = '@media (min-width: 721px) { .sdp-inventari__accions { position: sticky; inset-inline-end: 0; '
  + 'z-index: 1; background: var(--sdp-fons-app); border-inline-start: 1px solid var(--sdp-vora); } '
  + 'tbody tr:nth-child(even) > .sdp-inventari__accions { background: var(--sdp-fons-subtil); } }';
const HOVER = '@media (min-width: 721px) and (hover: hover) and (pointer: fine) { '
  + 'tbody tr:hover > .sdp-inventari__accions { background: var(--sdp-accent-subtil); } }';

test('des de 721px s’enganxa a la dreta amb el fons de la seua fila i una vora, dins de @layer components; cap ombra', () => {
  const moduls = net('src/css/modules.css');
  expect(moduls).toContain(ENGANXADA);
  expect(moduls).toContain(HOVER);
  // El hover va darrere de la fila parell: guanya per ordre amb la mateixa especificitat.
  expect(moduls.indexOf(HOVER)).toBeGreaterThan(moduls.indexOf(ENGANXADA));
  const abans = moduls.slice(0, moduls.indexOf(ENGANXADA));
  const tram = abans.slice(abans.lastIndexOf('@layer components {'));
  expect(abans.lastIndexOf('@layer components {')).toBeGreaterThan(-1);
  expect(tram.split('{').length - tram.split('}').length).toBe(1);
  expect(ENGANXADA + HOVER).not.toMatch(/box-shadow/);
  /* Els fons són els mateixos tokens que pinten les files a sdp.css. */
  const sdp = net('src/css/sdp.css');
  expect(sdp).toContain(':where(thead th) { background: var(--sdp-fons-app);');
  expect(sdp).toContain(':where(tbody tr:nth-child(even)) { background: var(--sdp-fons-subtil); }');
  expect(sdp).toContain(':where(tbody tr:hover) { background: var(--sdp-accent-subtil); }');
});
