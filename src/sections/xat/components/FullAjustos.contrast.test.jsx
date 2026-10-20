/* D6 · Mode Bancal (Q1 del Mestre, 261004) · El control «Contrast» del full
   «Ajustos» del Xat, muntat de veres dins de ClosCaXat (el mateix banc que
   FullAjustos.test.jsx): a l'Aparença, al costat del Tema, un grup amb nom
   «Contrast» i tres opcions («Normal», «Bancal (exterior, màxim contrast)»,
   «Segons el sistema») amb aria-pressed i ✓; triar-ne una crida setContrast
   a l'acte, sense botó de desar. Les cinc claus noves tenen valor propi en
   les cinc llengües, i les files fan servir el sòl tàctil del sistema.
   jsdom no té showModal: el Dialeg hi posa `open`. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { delVal, getVal, setVal } from '../../../config/storage.js';
import { SUPPORTED_LANGUAGES, createTranslator } from '../../../config/i18n.js';
import { FONT_DELS_DICCIONARIS as fontI18n } from '../../../../tests/helpers/diccionaris.js';

/* Vitest buida els .css importats: el full es llig del disc, com les proves de capes. */
const fontModuls = readFileSync(resolve(process.cwd(), 'src/css/modules.css'), 'utf8');
import { PREFERENCIES_CONTRAST } from '../../../config/theme.js';
import { OPCIONS_CONTRAST, cercaAjustos, etiquetaDeFila, paginaAjustos } from '../ajustosXat.js';
import ClosCaXat, { BotoObriRail, CLAU_RAIL } from './ClosCaXat.jsx';
import PanellInicialMobil from './PanellInicialMobil.jsx';

const mocks = vi.hoisted(() => ({
  setTheme: vi.fn(),
  setContrast: vi.fn(),
  setLanguage: vi.fn(),
  contrast: 'normal'
}));

vi.mock('../../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/xat' }),
  useSearchParams: () => [new URLSearchParams()],
  useParams: () => ({})
}));
vi.mock('../../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa, setTheme: mocks.setTheme, setContrast: mocks.setContrast, setLanguage: mocks.setLanguage }),
  useUIState: () => ({ themePreference: 'light', contrastPreference: mocks.contrast, language: 'ca' })
}));
vi.mock('../../../app/contexts/CoreContentContext', () => ({
  useCoreContent: () => ({ status: 'ready', towns: [] })
}));
vi.mock('../XatContext', () => ({
  useXat: () => ({ comunitats: [], joId: 'jo', joNom: 'Javi Llinares', chatThreads: [] })
}));
vi.mock('../../../app/contexts/SessionContext.jsx', () => ({
  useSessioOpcional: () => null,
  useSession: () => null
}));

Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get() { return 1280; } });

let abans = null;
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  abans = getVal(CLAU_RAIL);
  setVal(CLAU_RAIL, 'obert');
  mocks.setTheme.mockReset();
  mocks.setContrast.mockReset();
  mocks.setLanguage.mockReset();
  mocks.contrast = 'normal';
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  if (abans == null) delVal(CLAU_RAIL);
  else setVal(CLAU_RAIL, abans);
});

const full = () => screen.getByRole('dialog', { name: 'Ajustos' });
const fila = (nom) => within(full()).getByRole('button', { name: new RegExp(`^${nom}`) });

function obriAparenca() {
  render(
    <ClosCaXat
      middleTitle="Xats"
      middleColumn={<aside className="sdp-workspace-column" aria-label="Xats"><PanellInicialMobil /><BotoObriRail etiqueta="Menú" /></aside>}
      rightColumn={<div />}
    />
  );
  fireEvent.click(within(document.getElementById('app-grid-sidebar')).getByRole('button', { name: 'Tu: ajustos' }));
  fireEvent.click(fila('Aparença'));
}

const opcionsDe = (grup) => within(grup).getAllByRole('button').map((b) => [b.textContent, b.getAttribute('aria-pressed')]);

describe('el control «Contrast»', () => {
  test('a l’Aparença, entre el Tema i la Llengua, un grup amb nom «Contrast» i les tres opcions', () => {
    obriAparenca();
    const grups = [...full().querySelectorAll('[role="group"]')].map((g) => g.querySelector('h3')?.textContent);
    expect(grups).toEqual(['Tema', 'Contrast', 'Llengua']);
    const contrast = within(full()).getByRole('group', { name: 'Contrast' });
    expect(opcionsDe(contrast)).toEqual([
      ['Normal', 'true'], ['Bancal (exterior, màxim contrast)', 'false'], ['Segons el sistema', 'false']
    ]);
    /* El ✓ només a la triada. */
    const [normal, bancal] = within(contrast).getAllByRole('button');
    expect(normal.querySelector('svg.lucide-check')).toBeTruthy();
    expect(bancal.querySelector('svg.lucide-check')).toBeNull();
  });

  test('triar «Bancal» crida setContrast a l’acte, sense tocar el tema ni la llengua', () => {
    obriAparenca();
    const contrast = within(full()).getByRole('group', { name: 'Contrast' });
    fireEvent.click(within(contrast).getByRole('button', { name: 'Bancal (exterior, màxim contrast)' }));
    expect(mocks.setContrast).toHaveBeenCalledTimes(1);
    expect(mocks.setContrast).toHaveBeenCalledWith('bancal');
    fireEvent.click(within(contrast).getByRole('button', { name: 'Segons el sistema' }));
    expect(mocks.setContrast).toHaveBeenLastCalledWith('sistema');
    expect(mocks.setTheme).not.toHaveBeenCalled();
    expect(mocks.setLanguage).not.toHaveBeenCalled();
    expect(within(full()).queryByRole('button', { name: /Desa|Guardar/ })).toBeNull();
  });

  test('l’estat del context mana sobre el ✓: «Segons el sistema» desat es veu triat', () => {
    mocks.contrast = 'sistema';
    obriAparenca();
    const contrast = within(full()).getByRole('group', { name: 'Contrast' });
    expect(opcionsDe(contrast).map(([, premut]) => premut)).toEqual(['false', 'false', 'true']);
  });

  test('les files del control són les de sempre: el sòl tàctil del sistema (--sdp-touch) i sense estil en línia', () => {
    obriAparenca();
    const botons = within(within(full()).getByRole('group', { name: 'Contrast' })).getAllByRole('button');
    for (const boto of botons) {
      expect(boto.classList.contains('sdp-xat-ajustos__fila')).toBe(true);
      expect(boto.getAttribute('type')).toBe('button');
      expect(boto.hasAttribute('style')).toBe(false);
    }
    const regla = fontModuls.match(/\.sdp-xat-ajustos__fila \{[^}]*\}/)?.[0] ?? '';
    expect(regla).toContain('min-block-size: var(--sdp-touch)');
  });
});

describe('el model i la cerca', () => {
  test('les opcions són les preferències de theme.js, en el mateix ordre', () => {
    expect(OPCIONS_CONTRAST.map((o) => o.opcio)).toEqual(PREFERENCIES_CONTRAST);
    const grup = paginaAjustos('aparenca').grups.find((g) => g.seleccio === 'contrast');
    expect(grup.files).toBe(OPCIONS_CONTRAST);
    expect(etiquetaDeFila(grup.files[1])).toBe('Bancal (exterior, màxim contrast)');
  });

  test('«contrast», «sol» i «exterior» troben la secció Contrast a l’Aparença', () => {
    for (const terme of ['contrast', 'sol', 'exterior']) {
      const [primer] = cercaAjustos(terme);
      expect([terme, etiquetaDeFila(primer.fila)]).toEqual([terme, 'Contrast']);
      expect(primer).toMatchObject({ pagina: 'aparenca', cami: ['arrel', 'aparenca'] });
    }
  });
});

describe('les claus i18n del contrast', () => {
  const CLAUS = {
    'section.xat.ajustos.contrast': 'Contrast',
    'section.xat.ajustos.contrast.normal': 'Normal',
    'section.xat.ajustos.contrast.bancal': 'Bancal (exterior, màxim contrast)',
    'section.xat.ajustos.contrast.sistema': 'Segons el sistema',
    'section.xat.ajustos.contrast.paraules': 'sol exterior llegibilitat lectura'
  };
  const LLENGUES = SUPPORTED_LANGUAGES.map(({ code }) => code);

  test.each(Object.entries(CLAUS))('%s: valor propi en les cinc llengües, una sola vegada cadascuna, i el valencià és el text del model', (clau, valencia) => {
    expect(createTranslator('ca')(clau)).toBe(valencia);
    for (const codi of LLENGUES) {
      const valor = createTranslator(codi)(clau);
      expect([codi, typeof valor === 'string' && valor !== clau && valor.length > 0]).toEqual([codi, true]);
    }
    expect([clau, fontI18n.split(`'${clau}':`).length - 1]).toEqual([clau, LLENGUES.length]);
  });

  test('la «Bancal» traduïda conserva el nom propi', () => {
    for (const codi of LLENGUES) {
      expect([codi, createTranslator(codi)('section.xat.ajustos.contrast.bancal').startsWith('Bancal (')]).toEqual([codi, true]);
    }
  });
});
