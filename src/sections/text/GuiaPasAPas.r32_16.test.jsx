import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext.jsx';
import { resolvePageSlugPath } from '../../config/navigation.js';
import AparadorGuiaPasAPas from './AparadorGuiaPasAPas.jsx';
import {
  CODIS_IDIOMA_GUIA_PAS_A_PAS,
  textosAparadorGuia
} from './i18nAparadorGuiaPasAPas.js';
import { PAGE_COPY } from './pageContent.js';
import { PASSOS_POTS_FER, RUTA_POTS_FER } from './pageContent.potsFer.js';
import { localitzaPagina } from './pageContent.r10.js';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

const mocks = vi.hoisted(() => ({ language: 'ca' }));
vi.mock('../../app/contexts/UIContext.jsx', () => ({
  useUIActionsOpcional: () => ({ language: mocks.language })
}));

afterEach(() => {
  cleanup();
  mocks.language = 'ca';
});

function comptaStrong(htmlOProsa) {
  return [...String(htmlOProsa).matchAll(/<strong>[\s\S]*?<\/strong>/g)].length;
}

describe('Onada R32.16 · T2 (IDEA-287) · Guia pas a pas en 5 llengües sota Llei 35, Llei 32 i P0-128', () => {
  test('/page/guia resol netament cap a la ruta canònica /page/tot-el-que-pots-fer', () => {
    expect(RUTA_POTS_FER).toBe('/page/tot-el-que-pots-fer');
    expect(resolvePageSlugPath('guia')).toBe('/page/tot-el-que-pots-fer');
    expect(PASSOS_POTS_FER).toHaveLength(13);
  });

  test('cada paràgraf dels 13 passos en les 5 llengües conté entre 6 i 8 etiquetes <strong>, 0 taules i complix Llei 32', () => {
    const base = PAGE_COPY['tot-el-que-pots-fer'];
    for (const llengua of CODIS_IDIOMA_GUIA_PAS_A_PAS) {
      const pagina = localitzaPagina(base, llengua, 'tot-el-que-pots-fer');
      expect(pagina.html).not.toMatch(/<table\b/i);
      expect(pagina.html).not.toMatch(/sobir[àa]|soberan|sovereign|subiran/i);
      expect(pagina.html).not.toMatch(/Offline[- ]First|Local[- ]First/i);

      const paragrafs = [...pagina.html.matchAll(/<p>([\s\S]*?)<\/p>/g)].map((m) => m[1]);
      expect(paragrafs, llengua).toHaveLength(13);
      paragrafs.forEach((p, i) => {
        const nStrong = comptaStrong(p);
        expect(nStrong, `${llengua} pas ${i + 1}: ${nStrong} strong`).toBeGreaterThanOrEqual(6);
        expect(nStrong, `${llengua} pas ${i + 1}: ${nStrong} strong`).toBeLessThanOrEqual(8);
      });
    }
  });

  test('AparadorGuiaPasAPas pinta QuadreDeComandament, mostres inerts amb aria-hidden i 6-8 <strong> per paràgraf en 5 llengües', () => {
    for (const llengua of CODIS_IDIOMA_GUIA_PAS_A_PAS) {
      cleanup();
      mocks.language = llengua;
      const tx = textosAparadorGuia(llengua);

      for (const clau of ['quadreIntro', 'mostresIntro', 'einesExtraParagraf']) {
        const nStrong = comptaStrong(tx[clau]);
        expect(nStrong, `${llengua}.${clau}: ${nStrong}`).toBeGreaterThanOrEqual(6);
        expect(nStrong, `${llengua}.${clau}: ${nStrong}`).toBeLessThanOrEqual(8);
      }

      const textComplet = JSON.stringify(tx);
      expect(textComplet).not.toMatch(/sobir[àa]|soberan|sovereign|subiran/i);
      expect(textComplet).not.toMatch(/Offline[- ]First|Local[- ]First/i);

      const { container } = render(
        <MemoryRouter rutaInicial="/page/tot-el-que-pots-fer">
          <AparadorGuiaPasAPas language={llengua} />
        </MemoryRouter>
      );

      expect(container.querySelector('.sdp-quadre')).toBeTruthy();
      expect(screen.getByText(tx.estatText)).toBeTruthy();
      const mostresInertes = container.querySelectorAll('.sdp-especimen__viu[aria-hidden="true"]');
      expect(mostresInertes).toHaveLength(2);
      for (const mostra of mostresInertes) {
        expect(mostra.hasAttribute('inert')).toBe(true);
      }
      expect(container.querySelectorAll('a.sdp-boto')).toHaveLength(5);
    }
  });

  test('el capítol públic _wiki_de_poble/01_ser/guia_pas_a_pas.md seguix P0-128 (0 taules), jerarquia H1-H3 i Llei 32', () => {
    const md = fs.readFileSync(path.join(ARREL, '_wiki_de_poble/01_ser/guia_pas_a_pas.md'), 'utf8');
    expect(md).toContain('type: document');
    expect(md).toContain('status: canonic');
    expect(md).toContain('/page/tot-el-que-pots-fer');
    expect(md).toContain('/page/guia');
    expect(md).not.toMatch(/^\s*\|.*\|/m);
    expect(md).not.toMatch(/sobir[àa]|soberan|sovereign|subiran/i);
    expect(md).not.toMatch(/Offline[- ]First|Local[- ]First/i);
  });
});
