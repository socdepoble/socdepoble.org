/* Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 3) · Les tres props
   OPCIONALS que hi posa «Multimèdia» del Perfil (filesInicials, ometFiles i
   infoInicial): sense elles, el visor de sempre, fila per fila; amb elles, les
   files de més al davant, les omeses fora i el panell desplegat. I, per a tot
   qui el munta (auditoria Codex 2030, §4.1), una referència opaca sense la URL
   del port no es pinta mai crua en un <img>. */
import { act, cleanup, render, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, text) => text }) }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ towns: [{ id: 'tibi', title: 'Tibi' }] }) }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useLocation: () => ({ pathname: '/multimedia', search: '', state: null, hash: '' }),
  Link: ({ to, children }) => <a href={to}>{children}</a>,
}));
import { VisorDeLArxiu } from './VisorDeLArxiu.jsx';
import { oblidaMetadades } from './useMetadadesFoto.js';

const TIBI = { id: 'town-tibi', title: 'Tibi', src: '/assets/towns/tibi/1.jpg', tag: 'Poble', source: 'Tibi', article: { sectionId: 'pobles', id: 'tibi' } };
const visor = () => document.querySelector('dialog.sdp-visor');
const etiquetes = () => [...visor().querySelectorAll('.sdp-visor__clau')].map((e) => e.textContent);
const botoInfo = () => within(visor()).getByRole('button', { name: 'Informació de la imatge' });

beforeEach(() => {
  oblidaMetadades();
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('sense xarxa'); }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('el visor de l’Arxiu · les props opcionals del Perfil', () => {
  test('sense les props noves, les files de sempre i el panell plegat', () => {
    render(<VisorDeLArxiu llista={[TIBI]} index={0} />);
    expect(visor().hasAttribute('open')).toBe(true);
    expect(botoInfo().getAttribute('aria-expanded')).toBe('false');
    expect(etiquetes()).toEqual([
      'Data i hora de captura', 'Coordenades GPS', 'Càmera', 'Resolució', 'Autor', 'Poble', 'Drets d’ús', 'Origen', 'Publicat a',
      'Comentar', 'Connectar',
    ]);
  });

  test('filesInicials al davant, ometFiles fora i infoInicial desplega el panell', () => {
    const files = [{ clau: 'accions-perfil', etiqueta: 'Accions', valor: <button type="button">Posa com a avatar</button> }];
    render(<VisorDeLArxiu llista={[TIBI]} index={0} filesInicials={files} ometFiles={['poble', 'publicat']} infoInicial />);
    expect(botoInfo().getAttribute('aria-expanded')).toBe('true');
    expect(etiquetes()[0]).toBe('Accions');
    expect(etiquetes()).not.toContain('Poble');
    expect(etiquetes()).not.toContain('Publicat a');
    expect(etiquetes()).toContain('Resolució');
    expect(within(visor()).getByRole('button', { name: 'Posa com a avatar' })).toBeTruthy();
  });

  test('tancat, les files de més no es pinten', () => {
    const files = [{ clau: 'accions-perfil', etiqueta: 'Accions', valor: 'x' }];
    render(<VisorDeLArxiu llista={[TIBI]} index={-1} filesInicials={files} infoInicial />);
    expect(visor().hasAttribute('open')).toBe(false);
    expect(visor().querySelectorAll('.sdp-visor__fila')).toHaveLength(0);
  });

  test('una referència opaca sense la URL del port no es pinta crua; amb la URL, sí, i l’EXIF no es demana', () => {
    const opaca = { id: 'p', title: 'Pujada', src: 'sdp-media://mitjans/t/u/avatars/a.webp' };
    const { rerender } = render(<VisorDeLArxiu llista={[opaca]} index={0} />);
    expect(visor().querySelector('img')).toBeNull();
    expect(visor().textContent).toContain('Esta entrada no porta cap imatge.');
    act(() => rerender(<VisorDeLArxiu llista={[{ ...opaca, srcDelPort: 'https://fitxers.test/a.webp' }]} index={0} />));
    expect(visor().querySelector('img.sdp-visor__imatge').getAttribute('src')).toBe('https://fitxers.test/a.webp');
    expect(fetch).not.toHaveBeenCalled();
  });
});
