/**
 * legalLayoutIdea373.test.jsx — Onada v1.2.26 · Lot G26-4
 *
 * Verifica les quatre garanties del Kit G26-4:
 *   1. IDEA-373: /legal integra TaulerTelemetria dins `<article class="cms-preview sdp-amb-targetes">`
 *      abans del clearfix `::after`, retira tots els `<hr>` decoratius sobrers en lectura, normalitza
 *      els 3 `<h3>` històrics en majúscules a caixa natural d'oració sense mutar `legalContent.html`
 *      (`SDP-RGPD-021`, SHA_25 intacte), i lleva `display: grid`, `width: 100%` i `border-block-start`
 *      de `.sdp-telemetria` perquè `H3`/`H4` fluïsquen al costat de la targeta flotant.
 *   2. IDEA-374: auditoria editorial Pedra Seca a `pageContent.js`, `pageContent.r10.js` i `llicencies.js`
 *      (caixa natural d'oració, «de poble» en usos culturals i «fer servir / utilitzar» en lloc d'«usar»).
 *   3. P2 CDP #1: contrast AAA (>= 7:1) dels botons foscos del xat (`.sdp-xat-obri-rail` i `.sdp-xat-titol-seccio`).
 *   4. P2 CDP #2: `AppGridShell` a 375 px sincronitza `inert="true"`, `el.inert === true` i `aria-hidden="true"`
 *      en totes les columnes plegades.
 */
import React from 'react';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn(), t: (_, alternativa) => alternativa }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIStateOpcional: () => null, useUIActions: () => ({ t: mocks.t, language: 'ca' }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => mocks.navigate, Link: 'a' }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ children }) => React.createElement('div', { 'data-pagina': '' }, children),
}));

import TextSection from './TextSection.jsx';
import TaulerTelemetria from './TaulerTelemetria.jsx';
import { PAGE_COPY } from './pageContent.js';
import { legalContent } from './legalContent.js';
import { projeccioLecturaLegal } from './projeccioLecturaLegal.js';
import { localitzaPagina } from './pageContent.r10.js';
import { LLICENCIES } from '../../components/universal/drets/llicencies.js';
import { configTelemetria } from '../../data/telemetria.js';
import AppGridShell from '../../components/layout/AppGridShell.jsx';

const SHA_25_SEGELLAT = 'ea13f0c4ca8f69ebf8c29035d6f7804d401d48dbdc6e3b5d5fb2b1b975fc1fc7';
const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('IDEA-373 · /legal: TaulerTelemetria dins .sdp-amb-targetes, zero <hr> i caixa d’oració', () => {
  test('legalContent.html conserva intacta l’empremta segellada SDP-RGPD-021 (SHA_25 i 60.638 B UTF-8 / 59.594 caràcters)', () => {
    expect(legalContent.html.length).toBe(59594);
    expect(Buffer.byteLength(legalContent.html, 'utf8')).toBe(60638);
    expect(createHash('sha256').update(legalContent.html, 'utf8').digest('hex')).toBe(SHA_25_SEGELLAT);
  });

  test('projeccioLecturaLegal retira tots els <hr> decoratius i passa els H3 històrics a caixa natural d’oració', () => {
    const projectat = projeccioLecturaLegal(legalContent.html);
    expect(projectat).not.toMatch(/<hr\b/i);
    expect(projectat).toContain('<h3>Avís legal</h3>');
    expect(projectat).toContain('<h3>Política de privacitat i protecció de dades</h3>');
    expect(projectat).toContain('<h3>Emmagatzematge al teu dispositiu (política de galetes)</h3>');
    expect(projectat).toContain("<h3>Reconeixements i fonts d'inspiració</h3>");
    expect(projectat).not.toContain('<h3>AVÍS LEGAL</h3>');
    expect(projectat).not.toContain('<h3>POLÍTICA DE PRIVACITAT I PROTECCIÓ DE DADES</h3>');
    expect(projectat).not.toContain('<h3>EMMAGATZEMATGE AL TEU DISPOSITIU (POLÍTICA DE GALETES)</h3>');
  });

  /* Lot C1-3 (Gauntlet G26, Lent 2, punt 6; zero ReDoS de core-seguretat-audit) · Amb el \s* inicial,
     PATRO_HR_DECORATIU tornava a recórrer una tirada d'espais sense cap <hr> des de cada posició:
     80.000 espais costaven uns 3,2 s (×4 per cada ×2). Sense, el cost és lineal (uns 0,2 ms). */
  test('projeccioLecturaLegal és lineal amb una tirada de 80.000 espais (molt per davall d’1 s)', () => {
    const entrada = `${legalContent.html}${' '.repeat(80000)}`;
    const inici = performance.now();
    const projectat = projeccioLecturaLegal(entrada);
    const durada = performance.now() - inici;
    expect(durada).toBeLessThan(250);
    expect(projectat).not.toMatch(/<hr\b/i);
    expect(projectat.endsWith(' '.repeat(80000))).toBe(true);
  });

  test('/legal munta TaulerTelemetria DINS d’<article class="cms-preview sdp-amb-targetes"> i amb zero <hr>', () => {
    const { container } = render(
      <TextSection page={PAGE_COPY.legal} pageKey="legal">
        <TaulerTelemetria config={configTelemetria({})} />
      </TextSection>
    );
    const article = container.querySelector('[data-pagina] > article.cms-preview.sdp-amb-targetes');
    expect(article).not.toBeNull();
    const telemetria = article.querySelector(':scope > section.sdp-telemetria');
    expect(telemetria).not.toBeNull();
    expect(container.querySelectorAll('[data-pagina] > section.sdp-telemetria')).toHaveLength(0);
    expect(article.querySelectorAll('hr')).toHaveLength(0);
    expect(telemetria.querySelector('h3')?.textContent).toBe('Telemetria: què comptem i com ho pots comprovar');
  });

  test('modules.css pinta .sdp-telemetria com a block sense grid, width: 100%, border-block-start ni margin: 0 en títols', () => {
    const css = llig('src/css/modules.css');
    const bloc = css.match(/\.sdp-telemetria\s*\{[^}]*\}/)?.[0] || '';
    expect(bloc).toContain('display: block');
    expect(bloc).not.toContain('display: grid');
    expect(bloc).not.toContain('width: 100%');
    expect(bloc).not.toContain('border-block-start');
    expect(css).not.toMatch(/\.sdp-telemetria\s*>\s*h3,\s*\.sdp-telemetria\s*>\s*h4/);
  });
});

describe('IDEA-374 · Auditoria editorial Pedra Seca a pageContent.js, pageContent.r10.js i llicencies.js', () => {
  test('constitucio, anima, wikidepoble i roadmap fan servir caixa natural d’oració als títols', () => {
    expect(PAGE_COPY.constitucio.html).toContain('<h3>Marc normatiu del projecte</h3>');
    expect(PAGE_COPY.constitucio.html).toContain('<h4>Capítol I: Accessibilitat i usabilitat universal</h4>');
    expect(PAGE_COPY.constitucio.html).toContain('<h5>1. Prioritat de les persones grans</h5>');
    expect(PAGE_COPY.constitucio.html).toContain('<h5>15. Evolució tecnològica i memòria del territori</h5>');
    expect(PAGE_COPY.constitucio.html).not.toContain('Marc Normatiu del Projecte');
    expect(PAGE_COPY.anima.html).toContain('<h3>El despertar de la nina de silici</h3>');
    expect(PAGE_COPY.wikidepoble.html).toContain('<h3>Estructura del coneixement tècnic i documental</h3>');
    expect(PAGE_COPY.roadmap.html).toContain('<h3>Els inicis: la llavor del 18 de gener</h3>');
    expect(PAGE_COPY.roadmap.html).toContain('<h3>Collita tancada (fet)</h3>');
    expect(PAGE_COPY.roadmap.html).toContain('<h3>Sementeres vives (beta)</h3>');
    expect(PAGE_COPY.roadmap.html).toContain('<h3>Llavors (totes les idees)</h3>');
  });

  test('drets-autor, llicencies.js i pageContent.r10.js compleixen «de poble» i eviten «usar»', () => {
    expect(PAGE_COPY['drets-autor'].html).toContain('<strong>gent de poble</strong>');
    expect(PAGE_COPY['drets-autor'].html).not.toContain('copiar, adaptar i usar');
    expect(PAGE_COPY['drets-autor'].html).not.toContain('qualsevol la pot usar');
    for (const l of LLICENCIES) {
      expect(l.explicacio).not.toMatch(/\busar\b/i);
      expect(l.exemple).not.toMatch(/\busa\b/i);
    }
    expect(localitzaPagina(PAGE_COPY['node-zero'], 'ca').html).toContain('cadència pròpia de poble');
    /* Lot C1-3 (Gauntlet G26, Lent 2, punt 17) · IDEA-374 (Llibre Mestre, l. 3999) demana, punt (3), «text
       viu en valencià net»: la forma «de poble» és del valencià. En castellà, «de pueblo» pot tindre sentit
       pejoratiu i la doctrina no el demana: la traducció conserva «del pueblo», el text d'abans del kit. */
    expect(localitzaPagina(PAGE_COPY['node-zero'], 'es').html).toContain('cadencia propia del pueblo');
    expect(localitzaPagina(PAGE_COPY['node-zero'], 'es').html).not.toContain('cadencia propia de pueblo');
    expect(localitzaPagina(PAGE_COPY.disseny, 'es').html).toContain('quien la utiliza cada día');
    expect(localitzaPagina(PAGE_COPY.disseny, 'gl').html).toContain('quen a utiliza cada día');
  });
});

describe('P2 CDP · Contrast botons foscos xat (AAA) i inert en columna mòbil plegada', () => {
  test('botons foscos del xat (.sdp-xat-obri-rail i .sdp-xat-titol-seccio) pinten text amb --sdp-crom-text (AAA >= 7:1)', () => {
    const css = llig('src/css/modules.css');
    /* Lot C1-3 (Gauntlet G26, Lent 2, punt 1) · Retall sense canvi de conducta: la regla pròpia de
       .sdp-xat-obri-rail era redundant, perquè l'únic element que la porta (BotoObriRail, ClosCaXat.jsx)
       també porta .sdp-xat-titol-seccio, i la regla d'eixa classe, amb la mateixa especificitat i
       posterior, ja li posa el text en --sdp-crom-text i la icona en --sdp-crom-actiu-fons. L'oracle
       fixa ara eixa garantia en lloc del text de la regla esborrada. */
    expect(llig('src/sections/xat/components/ClosCaXat.jsx').match(/className="[^"]*\bsdp-xat-obri-rail\b[^"]*"/g))
      .toEqual(['className="sdp-xat-titol-seccio sdp-xat-obri-rail"']);
    expect(css).toMatch(/\.sdp-xat \.sdp-xat-titol-seccio\s*\{[^}]*color:\s*var\(--sdp-crom-text\);/);
    expect(css).toMatch(/\.sdp-xat \.sdp-xat-titol-seccio\s*>\s*svg\s*\{\s*color:\s*var\(--sdp-crom-actiu-fons\);/);
  });

  test('AppGridShell a 375 px aplica inert (atribut i propietat DOM .inert === true) a totes les columnes plegades', () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(375);
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
    const { container } = render(
      <AppGridShell
        leftColumn={<button type="button">Carpeta 1</button>}
        middleColumn={<button type="button">Element 1</button>}
        rightColumn={<button type="button">Detall</button>}
      />
    );
    const sidebar = container.querySelector('#app-grid-sidebar');
    const list = container.querySelector('#app-grid-list');
    const main = container.querySelector('#app-grid-main');
    expect(sidebar.getAttribute('aria-hidden')).toBe('true');
    expect(sidebar.getAttribute('inert')).toBe('true');
    expect(sidebar.inert).toBe(true);
    expect(list.getAttribute('aria-hidden')).toBe('true');
    expect(list.getAttribute('inert')).toBe('true');
    expect(list.inert).toBe(true);
    expect(main.getAttribute('aria-hidden')).toBeNull();
    expect(main.getAttribute('inert')).toBeNull();
    expect(Boolean(main.inert)).toBe(false);
  });
});
