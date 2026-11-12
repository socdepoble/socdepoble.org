/* P0-115 + P0-116 (R18, ordre del Mestre 261111) · «unificant la Columna 2 tant a /page/arbres-monumentals com a
   /page/receptes amb les files compactes de /disseny i /wikidepoble» i les 3 icones de vista (Canònica, Gran, Quadrícula 2×2). */
import { webcrypto } from 'node:crypto';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext';
import { UniversalWorkspace } from '../../components/universal/workspace/UniversalWorkspace.jsx';
import { desaVista } from '../../components/universal/workspace/vistaCataleg.js';
import { ARBRES_MONUMENTALS_2020 } from '../../data/patrimoni/arbresMonumentals2020.js';
import { LLIBRES_ARBRES_MONUMENTALS } from '../../data/patrimoni/llibresArbresMonumentals.js';
import { RECEPTES_QUE_DINEM, laminaDeRecepta } from '../../data/patrimoni/queDinem.js';
import NaturaPatrimoniWorkspaceSection from './NaturaPatrimoniWorkspaceSection.jsx';
import ReceptesWorkspaceSection from './ReceptesWorkspaceSection.jsx';
import { sanitizeHtml } from '../../utils/sanitize.js';

const LLIBRE_ID = LLIBRES_ARBRES_MONUMENTALS[0].id;
const idArbre = (arbre) => `${LLIBRE_ID}:${arbre.id}`;

const ui = vi.hoisted(() => ({ language: 'ca', t: (_clau, reserva) => reserva }));
vi.mock('../../app/contexts/UIContext', async (orig) => ({ ...(await orig()), useUIActions: () => ui, useUIActionsOpcional: () => ui }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../text/TextSection', () => ({ default: ({ children }) => <article>{children}</article>, CosDeLaPagina: ({ html }) => <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} /> }));
/* Un sol doble de UniversalPage: el specifier amb `.jsx` i el que no en porta resolen al mateix mòdul, i
   Vitest el mocka per identitat resolta. L'H1 viu dins de header.page-title, com a PageFrame. */
vi.mock('../../components/universal/UniversalPage.jsx', () => ({ UniversalPage: ({ title, children }) => <article>{title ? <header className="page-title"><h1>{title}</h1></header> : null}{children}</article> }));
vi.mock('../../hooks/useSEO.js', () => ({ useSEO: () => {} }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));

beforeEach(() => {
  vi.stubGlobal('crypto', webcrypto);
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1440);
  desaVista('arbres-monumentals-r18', 'canonica');
  desaVista('receptes-p069', 'canonica');
});
afterEach(() => {
  cleanup();
  desaVista('arbres-monumentals-r18', 'canonica');
  desaVista('receptes-p069', 'canonica');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function filaDeDisseny(item) {
  const { container, unmount } = render(
    <MemoryRouter rutaInicial="/disseny">
      <UniversalWorkspace model={{ status: 'ready', canAutoSelect: () => false, categories: [], items: [item] }} renderDetail={() => null} />
    </MemoryRouter>
  );
  const html = container.querySelector('ul.sdp-gestor-llista > li > button.sdp-gestor-fitxa')?.outerHTML ?? container.innerHTML;
  unmount();
  return html;
}
function normalitzaFila(boto) {
  const copia = boto.cloneNode(true);
  copia.removeAttribute('data-element');
  copia.removeAttribute('aria-label');
  const media = copia.querySelector('.sdp-gestor-fitxa__media');
  if (media) {
    const status = media.getAttribute('data-asset-status');
    media.removeAttribute('data-asset-status');
    media.setAttribute('aria-hidden', 'true');
    if (status !== null) media.setAttribute('data-asset-status', status);
  }
  copia.querySelector('.sdp-gestor-fitxa__text')?.removeAttribute('lang');
  copia.querySelector('img')?.setAttribute('alt', '');
  return copia.outerHTML;
}
const munta = (ruta, node) => render(<MemoryRouter rutaInicial={ruta}>{node}</MemoryRouter>);

describe('P0-115 + P0-116 · Columna 2 canònica i 3 modes de vista', () => {
  it('/page/arbres-monumentals: els 19 arbres es mostren amb DefaultItemCard, com la fila de /disseny', () => {
    const { container } = munta('/page/arbres-monumentals', <NaturaPatrimoniWorkspaceSection page={{ title: 'Arbres', html: '<p>Intro</p>' }} />);
    const llista = container.querySelector('#app-grid-list');
    const files = [...llista.querySelectorAll('ul.sdp-gestor-llista > li > button.sdp-gestor-fitxa')];
    expect(files).toHaveLength(19);
    expect(llista.querySelectorAll('.sp-card')).toHaveLength(0);
    expect(files.map((fila) => fila.getAttribute('data-element'))).toEqual(ARBRES_MONUMENTALS_2020.map(idArbre));

    const arbre = ARBRES_MONUMENTALS_2020[0];
    const fila = files[0];
    expect(fila.querySelector('.sdp-gestor-fitxa__titol').textContent).toBe(`#${arbre.ordre} · ${arbre.nom}`);
    expect(fila.querySelector('.sdp-gestor-fitxa__subtitol').textContent).toBe(`${arbre.especieCientifica} (${arbre.nomComu})`);
    expect(fila.querySelector('img.sdp-gestor-fitxa__imatge')).toBeTruthy();
    expect(normalitzaFila(fila)).toBe(filaDeDisseny({
      id: idArbre(arbre),
      title: `#${arbre.ordre} · ${arbre.nom}`,
      subtitle: `${arbre.especieCientifica} (${arbre.nomComu})`,
      image: arbre.fotos.foto2007
    }));
  });

  it('/page/receptes: totes les 149 files són DefaultItemCard per defecte', () => {
    const { container } = munta('/page/receptes', <ReceptesWorkspaceSection page={{}} />);
    const llista = container.querySelector('#app-grid-list');
    const files = [...llista.querySelectorAll('ul.sdp-gestor-llista > li > button.sdp-gestor-fitxa')];
    expect(files).toHaveLength(RECEPTES_QUE_DINEM.length);
    expect(llista.querySelectorAll('.sp-card')).toHaveLength(0);

    const recepta = RECEPTES_QUE_DINEM[78];
    const fila = llista.querySelector(`button.sdp-gestor-fitxa[data-element="${recepta.slug}"]`);
    expect(fila.querySelector('.sdp-gestor-fitxa__titol').textContent).toBe(recepta.titol);
    expect(normalitzaFila(fila)).toBe(filaDeDisseny({ id: recepta.slug, title: recepta.titol, image: laminaDeRecepta(recepta).src }));
  });

  it('la fila triada porta aria-current i obri la fitxa al detall', async () => {
    const arbre15 = ARBRES_MONUMENTALS_2020.find((a) => a.ordre === 15);
    const id15 = idArbre(arbre15);
    const { container } = munta('/page/arbres-monumentals', <NaturaPatrimoniWorkspaceSection page={{ title: 'Arbres', html: '<p>Intro</p>' }} />);
    const fila = container.querySelector(`#app-grid-list .sdp-gestor-fitxa[data-element="${id15}"]`);
    fireEvent.click(fila);
    expect(container.querySelector(`#app-grid-list .sdp-gestor-fitxa[data-element="${id15}"]`).getAttribute('aria-current')).toBe('true');
    expect(await within(container.querySelector('#app-grid-main')).findByRole('heading', { level: 1, name: /#15 · Pi dels Arrendaors/i })).toBeTruthy();
  });

  it('les 3 icones de vista (Canònica, Gran, Quadrícula 2×2) commuten entre DefaultItemCard i UniversalCard', () => {
    const { container } = munta('/page/arbres-monumentals', <NaturaPatrimoniWorkspaceSection page={{ title: 'Arbres', html: '<p>Intro</p>' }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Gran', exact: true }));
    expect(container.querySelectorAll('#app-grid-list article.sp-card')).toHaveLength(19);
    expect(container.querySelectorAll('#app-grid-list .sdp-gestor-fitxa')).toHaveLength(0);

    fireEvent.click(screen.getByRole('button', { name: 'Quadrícula 2×2', exact: true }));
    expect(container.querySelectorAll('#app-grid-list article.sp-card')).toHaveLength(19);

    fireEvent.click(screen.getByRole('button', { name: 'Canònica', exact: true }));
    expect(container.querySelectorAll('#app-grid-list .sdp-gestor-fitxa')).toHaveLength(19);
  });
});
