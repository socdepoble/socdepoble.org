/* Gauntlet 261030 (f4b, B3-FITXA-FALS) · La fitxa web d'una imatge publicada
   (FitxaWeb, la pàgina ?item= de /multimedia) pinta les dades de la foto amb
   filesDelPanell, sense l'origen de la pàgina. L'ordre B3 (Copiar l'enllaç de
   la imatge) és només del panell del visor: la fitxa es queda amb les files
   d'abans i mai diu «No té cap enllaç públic d’este lloc» d'una foto pública
   (el visor de la mateixa foto en dona la URL). La Pàgina Universal es
   substituïx per una que només pinta el cos (com
   PaginesEspaiMultimedia.traduccio.test.jsx, que no el pinta). */
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext.jsx';

vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ children }) => <main>{children}</main>
}));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, text) => text }), useUIStateOpcional: () => null }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ towns: [] }) }));
import { FitxaWeb } from './PaginesEspaiMultimedia.jsx';
import { oblidaMetadades } from './useMetadadesFoto.js';

const t = (_clau, text) => text;
const espai = { t, cens: null, obriVisor: () => {}, visorObert: false, refTitol: null };
/* Les dues fotos públiques de la troballa (el cens d'imatges de dev). */
const FOTOS = [
  { id: 'cens-img-pi-pla-verd', title: 'El pi del Pla Verd', tag: 'Arxiu', src: '/assets/img/pi-pla-verd.jpg' },
  { id: 'cens-nano-cards-mur-nano-card', title: 'Mur', tag: 'Arxiu', source: 'Nano Banana', origen: 'ia', src: '/assets/nano_cards/mur_nano_card.jpg' }
];
const FILES_DE_LA_FITXA = ['Data i hora de captura', 'Coordenades GPS', 'Càmera', 'Resolució', 'Autor', 'Poble', 'Drets d’ús', 'Origen', 'Publicat a'];

beforeEach(() => {
  oblidaMetadades();
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('sense xarxa'); }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test('les files de la fitxa són les d’abans de B3: cap «Enllaç de la imatge» ni «No té cap enllaç públic»', () => {
  for (const item of FOTOS) {
    const { container } = render(<MemoryRouter rutaInicial="/multimedia"><FitxaWeb espai={espai} item={item} /></MemoryRouter>);
    const dades = container.querySelector('.sdp-arxiu-local__dades');
    expect([item.id, [...dades.querySelectorAll('dt')].map((dt) => dt.textContent)]).toEqual([item.id, FILES_DE_LA_FITXA]);
    expect([item.id, container.textContent.includes('No té cap enllaç públic'), container.textContent.includes('Enllaç de la imatge')]).toEqual([item.id, false, false]);
    expect([item.id, [...container.querySelectorAll('button')].map((boto) => boto.textContent)]).toEqual([item.id, ['Veure la imatge a pantalla completa']]);
    cleanup();
  }
});
