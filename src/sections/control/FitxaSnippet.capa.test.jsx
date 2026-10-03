/* CU (Onada 3, correcció de la revisió, 261003) · La fitxa del Snippet amb la
   capa del paquet DE VERES: capaDelPaquet no se substituïx.

   capaDelPaquet() torna la capa FIXADA abans que la de compilació
   (capaDelPaquet.js), i les dos entrades pròpies (main.jsx i embed.jsx) la
   fixen. Per això afegir `snippetChromeUrl` només a CAPA_DE_COMPILACIO no
   activaria mai el botó: cal també a CLAUS_DEL_PAQUET i a les dos crides de
   fixaCapaDelPaquet (la recepta sencera és a la nota CU.txt, §5).

   Les dos proves són les dos cares de la recepta i només en corre una:
     · avui la capa no admet la clau: fixar-la llança i, amb la capa que fixen
       les entrades, el botó queda desactivat;
     · quan la clau entre a CLAUS_DEL_PAQUET, la segona es posa en marxa sola i
       comprova que una capa fixada amb la clau activa el botó. */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { CLAUS_DEL_PAQUET, capaDelPaquet, fixaCapaDelPaquet } from '../../config/capaDelPaquet.js';
import { CLAU_URL_SNIPPET } from './destiSnippet.js';

vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ children }) => <section data-pagina="fitxa">{children}</section>
}));

import { FitxaSnippet } from './FitxaSnippet.jsx';

const BOTIGA = 'https://chromewebstore.google.com/detail/snippet/abcdefghijklmnop';
const LA_CAPA_ADMET_LA_CLAU = CLAUS_DEL_PAQUET.includes(CLAU_URL_SNIPPET);

afterEach(cleanup);

test.runIf(!LA_CAPA_ADMET_LA_CLAU)('avui la capa del paquet no admet la clau del Snippet: fixar-la llança, i amb la capa de les entrades el botó queda desactivat', () => {
  expect(() => fixaCapaDelPaquet({ [CLAU_URL_SNIPPET]: BOTIGA })).toThrow(CLAU_URL_SNIPPET);
  /* Com main.jsx i embed.jsx: la capa fixada mana sobre la de compilació. */
  fixaCapaDelPaquet({ supabaseUrl: 'https://paquet.supabase.test', dataMode: 'seed' });
  expect(capaDelPaquet()).not.toHaveProperty(CLAU_URL_SNIPPET);
  render(<FitxaSnippet />);
  expect(screen.getByRole('button', { name: 'Instal·la a Chrome' }).disabled).toBe(true);
  expect(screen.queryByRole('link')).toBeNull();
});

test.runIf(LA_CAPA_ADMET_LA_CLAU)('amb la clau a la capa fixada (com han de fer main.jsx i embed.jsx), el botó és un enllaç', () => {
  fixaCapaDelPaquet({ supabaseUrl: 'https://paquet.supabase.test', [CLAU_URL_SNIPPET]: BOTIGA });
  render(<FitxaSnippet />);
  expect(screen.getByRole('link', { name: /Instal·la a Chrome/ }).getAttribute('href')).toBe(BOTIGA);
  expect(screen.queryByRole('button', { name: 'Instal·la a Chrome' })).toBeNull();
});
