import { Profiler } from 'react';
import { act, cleanup, render, waitFor, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import logoDark from '../assets/ui/logo-socdepoble-rect-negre.svg';
import logoLight from '../assets/ui/logo-socdepoble-rect-blanc.svg';
import fontBrandMark from './BrandMark.jsx?raw';
import BrandMark from './BrandMark.jsx';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

// Cada render té el seu contenidor: la prova de la variant dark en munta quatre alhora.
const marca = (vista) => within(vista.container).getByRole('img', { name: 'Sóc de Poble' });
/* Tots els atributs de l'<img>, en l'ordre del DOM: el render d'abans, atribut per atribut. */
const atributs = (img) => [...img.attributes].map(({ name, value }) => [name, value]);
const ESPERATS = (src) => [
  ['class', 'mobileBrandMark'], ['src', src], ['alt', 'Sóc de Poble'], ['width', '300'], ['height', '78'], ['fetchpriority', 'high']
];

test('la marca light es pinta de seguida, atribut per atribut com abans, també sense variant', () => {
  for (const props of [{ variant: 'light' }, {}]) {
    const img = marca(render(<BrandMark {...props} className="mobileBrandMark" />));
    expect(atributs(img)).toEqual(ESPERATS(logoLight));
    cleanup();
  }
});

/* Onada 7 (261009) · El negre es carrega amb import() i es guarda per a la
   resta de muntatges. Esta prova ha de ser el primer render de la variant
   dark del fitxer: és l'única que el veu en fred, abans que arribe.
   Revisió adversarial de l'Onada 7 · Les instàncies muntades en fred que
   passen a dark quan el negre ja hi és el pinten de seguida, i la que ha
   canviat a light abans de la resposta no es torna a pintar: ho compta un
   Profiler, perquè el DOM no ho diria (una light pinta el blanc igualment). */
test('la marca dark: la reserva amb els mateixos atributs i després el negre; qui ha passat a light no es torna a pintar, i qui torna a dark el té en el primer render', async () => {
  const error = vi.spyOn(console, 'error');
  // Muntada en light abans de cap càrrega: quan passe a dark, el negre ja serà a la memòria.
  const clara = render(<BrandMark variant="light" className="mobileBrandMark" />);
  const vista = render(<BrandMark variant="dark" className="mobileBrandMark" />);
  const img = marca(vista);
  const reserva = img.getAttribute('src');
  // La reserva ocupa el lloc del logotip: un SVG transparent amb la seua proporció, sense xarxa.
  expect(reserva.startsWith('data:image/svg+xml,')).toBe(true);
  expect(decodeURIComponent(reserva)).toContain("viewBox='0 0 300 78'");
  expect([logoDark, logoLight]).not.toContain(reserva);
  expect(atributs(img)).toEqual(ESPERATS(reserva));

  // Abans que arribe: una que passa a light, amb les seues pintades comptades, i una que es desmunta.
  const pintades = [];
  const comptada = (variant) => (
    <Profiler id="canviada" onRender={(_, fase) => pintades.push(fase)}>
      <BrandMark variant={variant} className="mobileBrandMark" />
    </Profiler>
  );
  const canviada = render(comptada('dark'));
  canviada.rerender(comptada('light'));
  expect(atributs(marca(canviada))).toEqual(ESPERATS(logoLight));
  render(<BrandMark variant="dark" className="mobileBrandMark" />).unmount();
  const pintadesAbans = pintades.length;

  await waitFor(() => expect(img.getAttribute('src')).toBe(logoDark));
  // Que s'acabe qualsevol pintada encara a la cua abans de comptar.
  await act(async () => { await new Promise((resol) => { setTimeout(resol, 0); }); });
  expect(marca(vista)).toBe(img);
  expect(atributs(img)).toEqual(ESPERATS(logoDark));
  // La resposta ja no era per a la canviada: cap pintada més (la bandera viu de BrandMark.jsx).
  expect(pintades).toHaveLength(pintadesAbans);
  expect(atributs(marca(canviada))).toEqual(ESPERATS(logoLight));

  // Cap de les dues va guardar el negre a l'estat, i el primer render a dark ja el porta.
  clara.rerender(<BrandMark variant="dark" className="mobileBrandMark" />);
  expect(atributs(marca(clara))).toEqual(ESPERATS(logoDark));
  canviada.rerender(comptada('dark'));
  expect(atributs(marca(canviada))).toEqual(ESPERATS(logoDark));
  // Les seues promeses ja resoltes tornen a pintar dins d'act: el mateix logotip.
  await act(async () => {});
  expect(atributs(marca(clara))).toEqual(ESPERATS(logoDark));
  expect(atributs(marca(canviada))).toEqual(ESPERATS(logoDark));
  // React 18 ja ignora un setState després del desmuntatge: ací només es comprova que no hi ha cap error.
  expect(error).not.toHaveBeenCalled();
});

test('amb el negre ja carregat, un muntatge nou el pinta de seguida i la variant pot anar i tornar', async () => {
  const primera = render(<BrandMark variant="dark" className="mobileBrandMark" />);
  await waitFor(() => expect(marca(primera).getAttribute('src')).toBe(logoDark));
  cleanup();
  const vista = render(<BrandMark variant="dark" className="mobileBrandMark" />);
  expect(atributs(marca(vista))).toEqual(ESPERATS(logoDark));
  vista.rerender(<BrandMark variant="light" className="mobileBrandMark" />);
  expect(atributs(marca(vista))).toEqual(ESPERATS(logoLight));
  vista.rerender(<BrandMark variant="dark" className="mobileBrandMark" />);
  expect(atributs(marca(vista))).toEqual(ESPERATS(logoDark));
});

/* El que fa baixar el tros d'entrada: el negre no és cap import estàtic. Al
   paquet de WordPress Vite inlinaria el seu SVG dins de l'entrada. */
test('el font: el blanc és un import estàtic; el negre, només un import() i cap import estàtic', () => {
  expect(fontBrandMark).toMatch(/^import logoLight from '\.\.\/assets\/ui\/logo-socdepoble-rect-blanc\.svg';$/m);
  expect(fontBrandMark).not.toMatch(/^\s*import\s[^(]*logo-socdepoble-rect-negre\.svg/m);
  expect(fontBrandMark.match(/import\('\.\.\/assets\/ui\/logo-socdepoble-rect-negre\.svg'\)/g)).toHaveLength(1);
  expect(/\sstyle=[{"]/.test(fontBrandMark)).toBe(false);
});
