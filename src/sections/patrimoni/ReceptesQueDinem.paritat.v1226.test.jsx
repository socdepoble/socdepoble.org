/**
 * C26-2 #4 (Gauntlet c13, v1.2.26) · Paritat Card ↔ UniversalPage del llibre «Què dinem?». Llibre Mestre, IDEA-365
 * (21:58, punt 1: «qualsevol canvi de Categories de Sistema i etiquetes d'una card s'aplica exactament igual a la
 * seua UniversalPage») i IDEA-367 (23:06, punt 3: la card del llibre porta Mur + Catàlegs + PDF, FORA Sistema).
 * La portada del lector (/page/receptes/que-dinem) porta les mateixes píndoles que la seua card del /mur, en la
 * llengua de la interfície i cap a les mateixes rutes, i darrere el lloc i l'any de l'edició, una metadada del
 * registre que no és taxonomia (D3 de l'integrador): text inert.
 */
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const ui = vi.hoisted(() => {
  const estat = { language: 'ca' };
  estat.accions = () => ({ language: estat.language, t: (_clau, reserva) => reserva });
  return estat;
});
vi.mock('../../app/contexts/UIContext', async (original) => ({ ...await original(), useUIActions: () => ui.accions(), useUIActionsOpcional: () => ui.accions() }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast() {} }) }));
vi.mock('../text/TextSection', () => ({ default: ({ children }) => <article>{children}</article> }));
vi.mock('../../hooks/useSEO.js', () => ({ useSEO() {} }));

import { MemoryRouter } from '../../app/contexts/RouterContext';
import ReceptesWorkspaceSection, { etiquetesDeLaPortadaQueDinem } from './ReceptesWorkspaceSection.jsx';
import { TargetaDelMur } from '../mur/TargetaDelMur.jsx';
import { targetesDeSistema } from '../mur/targetesMur.js';
import { PAGE_COPY } from '../text/pageContent.js';
import { OBRA_QUE_DINEM } from '../../data/patrimoni/queDinem.js';
import { rutaDePindola } from '../../components/PedraSeca/organismes/rutaDePindola.js';
import { IDIOMES_TAXONOMIA, nomEstructural } from '../../data/taxonomia/taxonomiaCanonica.js';

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1440);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); ui.language = 'ca'; });

const LLOC_I_ANY = `${OBRA_QUE_DINEM.lloc} · ${OBRA_QUE_DINEM.any}`;
/* [text, classe, ruta] de les píndoles pintades, en l'ordre de la peça. */
const pindoles = (arrel) => [...arrel.querySelectorAll('li.sp-card-label')].map((li) => [
  li.textContent, li.className.replace(/^sp-card-label\s*/, ''), li.querySelector('a')?.getAttribute('href') ?? null
]);

describe('C26-2 #4 · «Què dinem?»: la card del /mur i la portada del llibre porten les mateixes píndoles', () => {
  test.each(IDIOMES_TAXONOMIA)('%s · Mur + Catàlegs + PDF a les dues, amb les mateixes rutes; la portada, darrere, el lloc i l’any sense enllaç', (idioma) => {
    ui.language = idioma;
    const card = targetesDeSistema(PAGE_COPY, { nativa: false, language: idioma }).find((c) => c.id === 'que-dinem');
    const deLaCard = pindoles(render(<MemoryRouter rutaInicial="/mur"><TargetaDelMur item={card} /></MemoryRouter>).container);
    const deLaPortada = etiquetesDeLaPortadaQueDinem(idioma).map((label) => [label.text, label.className, rutaDePindola(label)]);
    expect(deLaCard.map(([text]) => text)).toEqual(['Mur', 'Catàlegs', 'PDF'].map((nom) => nomEstructural(nom, idioma)));
    expect(deLaCard.map(([, , ruta]) => ruta)).toEqual(['/mur', '/categoria/catalegs', '/categoria/pdf']);
    expect(deLaPortada.slice(0, -1)).toEqual(deLaCard);
    expect(deLaPortada.at(-1)).toEqual([LLOC_I_ANY, 'sdp-badge-category', null]);
  });

  test('la portada pintada a /page/receptes/que-dinem: les quatre píndoles, i la del lloc i l’any és text', () => {
    const { container } = render(
      <MemoryRouter rutaInicial="/page/receptes/que-dinem"><ReceptesWorkspaceSection page={{}} itemSlug="que-dinem" /></MemoryRouter>
    );
    const capcalera = [...container.querySelectorAll('header.page-title')].find((h) => h.querySelector('h1')?.textContent === OBRA_QUE_DINEM.titol);
    expect(capcalera).toBeTruthy();
    expect(pindoles(capcalera)).toEqual([
      ['Mur', 'sdp-badge-system', '/mur'],
      ['Catàlegs', 'sdp-badge-system', '/categoria/catalegs'],
      ['PDF', 'sdp-badge-system', '/categoria/pdf'],
      [LLOC_I_ANY, 'sdp-badge-category', null]
    ]);
  });
});
