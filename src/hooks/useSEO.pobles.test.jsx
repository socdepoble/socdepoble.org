import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { routeAllowsIndex, useSEO } from './useSEO.js';
import { RouteSEO } from './RouteSEO.jsx';

const state = vi.hoisted(() => ({ location: { pathname: '/pobles/sella', search: '' }, asset: ruta => ruta }));
vi.mock('../app/contexts/UIContext', () => ({
  useUIState: () => ({ externalConfig: { manageDocumentHead: true } }),
  useUIActions: () => ({ resolveAsset: state.asset })
}));
vi.mock('../app/contexts/RouterContext', () => ({
  useLocation: () => state.location,
  useRouter: () => ({ basename: '' })
}));

function Fitxa({ metadata, index = true }) {
  useSEO({ title: 'Sella', description: 'Memòria del poble', metadata, index });
  return null;
}
function Pagina({ carregada = false, metadata, index }) {
  return <><RouteSEO />{carregada && <Fitxa metadata={metadata} index={index} />}</>;
}
const robots = () => document.querySelector('meta[name="robots"]')?.getAttribute('content');
const canonical = () => document.querySelector('link[rel="canonical"]');
const contrastat = { contingut_local_verificat: true, content: 'Crònica local contrastada per la redacció.' };

beforeEach(() => {
  state.location = { pathname: '/pobles/sella', search: '' };
  const title = document.createElement('title');
  title.textContent = 'Amfitrió';
  document.head.replaceChildren(title);
});
afterEach(cleanup);

test.each(['/pobles/sella', '/poblacio/sella'])('%s falla tancada al fallback i durant càrrega; només indexa contingut local verificat', ruta => {
  state.location = { pathname: ruta, search: '' };
  const vista = render(<Pagina />);
  expect(robots()).toBe('noindex, nofollow');
  expect(canonical()).toBeNull();

  vista.rerender(<Pagina carregada />);
  expect(robots()).toBe('noindex, nofollow');
  for (const metadata of [
    { content: 'Plantilla genèrica del poble' },
    { contingut_local_verificat: 'true', content: 'Crònica local' },
    { contingut_local_verificat: true, content: '<p> </p>' }
  ]) {
    vista.rerender(<Pagina carregada metadata={metadata} />);
    expect(robots()).toBe('noindex, nofollow');
  }

  vista.rerender(<Pagina carregada metadata={contrastat} />);
  expect(robots()).toBeUndefined();
  expect(canonical().getAttribute('href')).toMatch(new RegExp(`${ruta}$`));
  vista.rerender(<Pagina carregada metadata={{ ...contrastat, contingut_local_verificat: false }} />);
  expect(robots()).toBe('noindex, nofollow');
  expect(canonical()).toBeNull();

  vista.rerender(<Pagina carregada metadata={contrastat} index={false} />);
  expect(robots()).toBe('noindex, nofollow');
  vista.rerender(<Pagina carregada metadata={contrastat} />);
  expect(robots()).toBeUndefined();
  vista.rerender(<Pagina />);
  expect(robots()).toBe('noindex, nofollow');
});

/* v1.2.18 · Gauntlet R1 (L3-01) · El router obri /pob%6Ces/sella i /%70obles/sella
   com a /pobles/sella (safeDecode dels paràmetres), però location.pathname
   conserva el text cru. La fitxa d'eixos àlies tampoc s'indexa sense contingut
   local verificat, ni al fallback, ni durant la càrrega, ni amb la plantilla. */
test.each(['/pob%6Ces/sella', '/%70obles/sella', '/poblaci%6F/sella'])('%s (àlies codificat) falla tancada com la ruta neta', ruta => {
  state.location = { pathname: ruta, search: '' };
  const vista = render(<Pagina />);
  expect(robots()).toBe('noindex, nofollow');
  expect(canonical()).toBeNull();
  for (const metadata of [undefined, { content: 'Plantilla genèrica del poble' }, { contingut_local_verificat: 'true', content: 'Crònica local' }]) {
    vista.rerender(<Pagina carregada metadata={metadata} />);
    expect(robots()).toBe('noindex, nofollow');
    expect(canonical()).toBeNull();
  }
  vista.rerender(<Pagina carregada metadata={contrastat} />);
  expect(robots()).toBeUndefined();
  /* v1.2.19 · Gauntlet R2 de la v1.2.18 (L2R2-03) · I el canonical apunta a la ruta neta, no a l'àlies. */
  expect(canonical().getAttribute('href')).toMatch(new RegExp(`${ruta.replace('%6C', 'l').replace('%70', 'p').replace('%6F', 'o')}$`));
  expect(canonical().getAttribute('href')).not.toContain('%');
  expect(routeAllowsIndex(ruta, { content: 'Plantilla genèrica del poble' })).toBe(false);
  expect(routeAllowsIndex(ruta, contrastat)).toBe(true);
});

test('v1.2.18 · Gauntlet R1 (L3-01) · la llista privada també decidix amb el tram descodificat', () => {
  for (const ruta of ['/%6Eotes', '/x%61t/1', '/gestori%61', '/%74ractors/x']) expect(routeAllowsIndex(ruta), ruta).toBe(false);
  // Una seqüència invàlida no llança: es queda crua i no és cap ruta privada.
  for (const ruta of ['/mercat/%', '/%E0%A4%A']) expect(routeAllowsIndex(ruta), ruta).toBe(true);
});

test('la llista de pobles continua indexable sense autoritzar cap fitxa buida', () => {
  state.location = { pathname: '/pobles', search: '' };
  const vista = render(<Pagina />);
  expect(robots()).toBeUndefined();
  state.location = { pathname: '/pobles/altre-poble', search: '' };
  vista.rerender(<Pagina />);
  expect(robots()).toBe('noindex, nofollow');
  expect(canonical()).toBeNull();
});
