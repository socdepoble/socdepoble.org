import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn() }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
import { BarraTaronja } from '../../components/universal/barres/BarraTaronja.jsx';
import { UniversalCard } from '../../components/PedraSeca/organismes/UniversalCard.jsx';

/* Pla 261018_1605 (Tasca 2) · Expectativa actualitzada a propòsit: ordre del
   Mestre (18-10-2026, 20:5x) · Dins del Perfil (.perfil-pagina), l'autoria de
   la barra taronja i de la targeta és «Javi Llinares / La Torre de les
   Maçanes»: el poble net i directe davall del nom, sense cap punt volat ni
   espai davant. Ja no hi ha cap regla pròpia del Perfil (abans, un separador
   generat «· » i les dues peces en línia): manen les regles globals de
   sempre, una línia per al nom i una altra per al poble, cadascuna amb tota
   l'amplada. jsdom no pinta: es comprova el CSS escrit i el DOM de la barra i
   de la targeta. Model: BarraTaronja.centreBuit.test.jsx. */
afterEach(cleanup);

const net = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');

/* Les regles d'un full que nomenen l'autoria de la barra i de la targeta. */
const reglesDAutoria = (css) => (css.match(/[^{}]*\{[^{}]*\}/g) || [])
  .map((regla) => regla.trim())
  .filter((regla) => /sp-card-author-(info|name|location)/.test(regla.split('{')[0]));

const FULLS = ['src/css/components.css', 'src/css/modules.css', 'src/sections/profile/PerfilShell.css'];
const POBLE = 'La Torre de les Maçanes';

describe('Pla 261018_1605 · Tasca 2 · el poble, net davall del nom a la barra del Perfil', () => {
  test('cap full no porta una regla de l’autoria pròpia del Perfil, ni cap text generat davant del poble', () => {
    for (const full of FULLS) {
      const regles = reglesDAutoria(net(full));
      expect(regles.filter((regla) => regla.includes('.perfil-pagina'))).toEqual([]);
      expect(regles.filter((regla) => /::?(before|after)/.test(regla.split('{')[0]))).toEqual([]);
      expect(regles.join(' ')).not.toContain('content:');
    }
  });

  test('les regles de sempre: el nom i el poble en columna, cadascun en una línia amb tota l’amplada', () => {
    const regles = reglesDAutoria(net('src/css/components.css'));
    const de = (selector) => regles.find((regla) => regla.startsWith(`${selector} {`));
    expect(de('.sp-card-author-info')).toBe('.sp-card-author-info { display: flex; flex-direction: column; flex: 1; min-width: 0; }');
    for (const selector of ['.sp-card-author-name', '.sp-card-author-location']) {
      for (const declaracio of ['display: block;', 'white-space: nowrap;', 'overflow: hidden;', 'text-overflow: ellipsis;']) {
        expect(de(selector)).toContain(declaracio);
      }
    }
  });

  test('a la barra del Perfil, el poble és el germà just després del nom i porta només el seu nom', () => {
    const { container } = render(<div className="perfil-pagina"><BarraTaronja authorName="Javi Llinares" authorLocation={POBLE} /></div>);
    const nom = container.querySelector('.sp-card-author-info > .sp-card-author-name');
    expect(nom.textContent).toBe('Javi Llinares');
    expect(nom.nextElementSibling.classList.contains('sp-card-author-location')).toBe(true);
    expect(nom.nextElementSibling.textContent).toBe(POBLE);
  });

  test('també a la capçalera de la targeta (UniversalCard) dins del Perfil', () => {
    const { container } = render(
      <div className="perfil-pagina"><UniversalCard title="Fitxa" hasFooter={false} author="Javi Llinares" location={POBLE} /></div>,
    );
    const poble = container.querySelector('.sp-card-author-info > .sp-card-author-name + .sp-card-author-location');
    expect(poble).not.toBeNull();
    expect(poble.textContent).toBe(POBLE);
  });
});
