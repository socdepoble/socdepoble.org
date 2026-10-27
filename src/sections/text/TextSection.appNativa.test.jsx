/**
 * Pla 261027_0845 (Guarda Nocturna), T1-06 · El Full de ruta (/roadmap) i
 * l'Avís legal (/legal), pintats per TextSection dins de l'app nativa (el pont
 * de Capacitor que llig esAppNativa): ni el cos, ni la capçalera, ni la
 * descripció de la pàgina (useSEO) no nomenen cap altra plataforma mòbil
 * (regla 2.3.10 de l'App Store). A la web, el text de sempre.
 *
 * L'arnés de TextSection.targetes.test.jsx: la pàgina reduïda als seus fills,
 * amb les props a la vista. L'Avís legal porta la targeta incrustada de
 * «Drets d'autor», i per això hi ha el router i els avisos.
 */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ props: null, seo: vi.fn(), navigate: vi.fn(), toast: vi.fn(), t: (_, alternativa) => alternativa }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: mocks.t }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: (...args) => mocks.seo(...args) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => mocks.navigate, Link: 'a' }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ children, ...props }) => {
    mocks.props = props;
    return React.createElement('div', { 'data-pagina': '' }, children);
  }
}));
import TextSection, { CosDeLaPagina } from './TextSection.jsx';
import { PAGE_COPY } from './pageContent.js';

/* La regla de la prova (T1-06). Les mencions d'Apple (App Store, iPhone, iOS)
   hi poden ser: la regla només parla de les ALTRES plataformes. També amb un
   guió baix o un guionet (google_play, com en un nom de fitxer). */
const PROHIBIDES = /Google[\s_-]*Play|Android|Play[\s_-]*Store|APK/i;

/* Tot el que la persona pot llegir o sentir: el cos (també els comentaris i
   els atributs, per si de cas), les props de la capçalera i el que rep useSEO. */
function pintat(clau) {
  const { container } = render(<TextSection page={PAGE_COPY[clau]} pageKey={clau} />);
  const cos = container.querySelector('[data-pagina]');
  return {
    cos,
    text: cos.textContent,
    html: cos.innerHTML,
    capcalera: JSON.stringify(mocks.props),
    seo: JSON.stringify(mocks.seo.mock.calls)
  };
}

afterEach(() => {
  cleanup();
  delete window.Capacitor;
});
beforeEach(() => {
  mocks.props = null;
  mocks.seo.mockClear();
});

describe('dins de l’app nativa', () => {
  beforeEach(() => {
    window.Capacitor = { isNativePlatform: () => true };
  });

  test.each(['roadmap', 'legal'])('/%s: cap altra plataforma al cos, a la capçalera ni a la descripció', (clau) => {
    const { text, html, capcalera, seo } = pintat(clau);
    expect(text.length).toBeGreaterThan(1000);
    expect(text).not.toMatch(PROHIBIDES);
    expect(html).not.toMatch(PROHIBIDES);
    expect(capcalera).not.toMatch(PROHIBIDES);
    expect(seo).not.toMatch(PROHIBIDES);
    expect(mocks.props.title).toBe(PAGE_COPY[clau].title);
  });

  test('/legal: la frase de la baixa es queda sencera, sense la llista de dispositius; l’àncora i la targeta, al seu lloc', () => {
    const { cos, text } = pintat('legal');
    expect(text).toContain("Pots esborrar el teu compte de Sóc de Poble (el web socdepoble.org i l'aplicació Sóc de Poble) quan vulgues i sense cap cost.");
    expect(text).toContain("si entres amb Apple a l'aplicació de l'iPhone");
    expect(cos.querySelectorAll('[data-sdp-ancora="esborra-compte"]')).toHaveLength(1);
    const carta = cos.querySelector('article.cms-preview.sdp-amb-targetes .sdp-targetes > .sdp-targeta > article.sp-card');
    expect(carta.querySelector('a.sp-card-link-overlay').getAttribute('to')).toBe('/page/drets-autor');
  });

  test('CosDeLaPagina sola (la que pinten PublicacioDetall i PluginPage) també adapta', () => {
    const { container } = render(<CosDeLaPagina html="<p>Hola.</p><p>Baixa-la de Google Play.</p><!-- Android -->" />);
    expect(container.innerHTML).toBe('<article class="cms-preview"><p>Hola.</p></article>');
  });
});

describe('a la web (Llei del Píxel)', () => {
  test('/legal diu el que ha dit sempre, i la pàgina és el mateix objecte', () => {
    const { text } = pintat('legal');
    expect(text).toContain("l'aplicació Sóc de Poble per a Android i iPhone");
    expect(mocks.props.lead).toBe(PAGE_COPY.legal.lead);
  });

  test('CosDeLaPagina deixa l’HTML com estava', () => {
    const { container } = render(<CosDeLaPagina html="<p>Baixa-la de Google Play.</p>" />);
    expect(container.innerHTML).toBe('<article class="cms-preview"><p>Baixa-la de Google Play.</p></article>');
  });
});
