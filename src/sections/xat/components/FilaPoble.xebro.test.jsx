import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';

/* Correcció de l'Onada 6 (QA visual: /xat a 1280×900, «Gent de la Torre»
   feia 161px en una caixa de 156 i es pintava «Gent de la To…») · El xebró
   de les files de comunitat torna al nom 8px de l'aire transparent de la
   icona: marges negatius de --sdp-space-1. jsdom no pinta: es comprova el DOM
   i la regla escrita. Verificat al navegador: la caixa del nom passa de 156 a
   164px i «Gent de la Torre» en fa 160,6. */
vi.mock('../../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ towns: [] }) }));
import FilaPoble from './FilaPoble.jsx';

afterEach(cleanup);

const net = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
const XEBRO = '.sdp-xat-fila__xebro { flex: none; color: var(--sdp-text-suau); margin-inline: calc(var(--sdp-space-1) * -1); }';

test('la fila del poble porta el nom sencer al DOM i el xebró de 20px al costat', () => {
  const t = (_clau, defecte) => defecte;
  const { container } = render(<FilaPoble poble={{ id: 'la-torre-de-les-macanes', nom: 'Gent de la Torre' }} onObri={() => {}} t={t} />);
  const cap = container.querySelector('.sdp-xat-fila--comunitat .sdp-xat-fila__cap');
  expect(cap.querySelector('.sdp-xat-fila__nom').firstChild.textContent).toBe('Gent de la Torre');
  const xebro = cap.querySelector('svg.sdp-xat-fila__xebro');
  expect(xebro).not.toBeNull();
  expect(xebro.getAttribute('width')).toBe('20');
  expect(xebro.previousElementSibling.classList.contains('sdp-xat-fila__nom')).toBe(true);
});

test('el xebró dona al nom l’aire de la icona amb marges negatius del sistema d’espais, dins de @layer components', () => {
  const moduls = net('src/css/modules.css');
  expect(moduls).toContain(XEBRO);
  expect(moduls.split('.sdp-xat-fila__xebro {').length).toBe(2);
  const abans = moduls.slice(0, moduls.indexOf(XEBRO));
  const tram = abans.slice(abans.lastIndexOf('@layer components {'));
  expect(abans.lastIndexOf('@layer components {')).toBeGreaterThan(-1);
  expect(tram.split('{').length - tram.split('}').length).toBe(1);
  // El nom continua sent el que s'encongix (amb punts suspensius si de cas).
  expect(moduls).toContain('.sdp-xat-fila__nom { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;');
});
