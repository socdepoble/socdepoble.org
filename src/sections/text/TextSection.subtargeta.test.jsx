/**
 * O4-CLAUDE-2 (ordre del Mestre, 261102 21:38; Onada 4 Nocturna) · La
 * primitiva única «Subtargeta» a la lectura:
 *  · és HTML pur que el sanejador ja admet, byte a byte (src/utils/sanitize.js
 *    no canvia): <div class="sdp-subtargeta" data-sdp-subtargeta=""> amb el
 *    títol (el primer encapçalament), la metadada opcional (el primer
 *    paràgraf) i el cos ric;
 *  · es pinta tal qual dins d'article.cms-preview (TextSection, les pàgines
 *    del sistema) i d'article.detail-content (renderRichText: ItemDetail,
 *    Visor, Wiki…), sense cap hidratació (no és cap grup de targetes);
 *  · les tres pàgines que la fan servir (projecte, descarregues i
 *    fediversity) la conserven després del sanejador, amb el seu títol;
 *  · el bloc .sdp-subtargeta de modules.css: la caixa de targeta Pedra Seca
 *    amb tokens, el títol i la metadada per estructura (cap classe al
 *    contingut), fora del bloc T7 de les targetes incrustades.
 * L'editor (el node sdpSubtargeta) el prova
 * components/universal/richText/extensions/subtargeta.test.js.
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../app/contexts/UIContext', () => ({ useUIStateOpcional: () => null, useUIActions: () => ({ t: (_, alternativa) => alternativa }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
/* La pàgina, reduïda al que rep: el cos pintat (com TextSection.recursos.test.jsx). */
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ children }) => React.createElement('div', { 'data-pagina': '' }, children)
}));

import TextSection from './TextSection.jsx';
import { PAGE_COPY } from './pageContent.js';
import { renderRichText } from '../detail/detailRichText.jsx';
import { sanitizeHtml } from '../../utils/sanitize.js';

const PRIMITIVA = '<div class="sdp-subtargeta" data-sdp-subtargeta=""><h4>Arquitectura</h4><p>160 h · 8.000 €</p><h5>Fet hui</h5><ul><li>Un port neutral.</li></ul><p>Un <a href="/pobles" rel="noopener noreferrer nofollow">enllaç</a>.</p></div>';
const COS = `<h3>Secció</h3><p>Abans.</p>${PRIMITIVA}<p>Després.</p>`;

afterEach(cleanup);

describe('el sanejador, tal qual', () => {
  test('la primitiva passa byte a byte: cap etiqueta, classe ni marca de més o de menys', () => {
    expect(sanitizeHtml(PRIMITIVA)).toBe(PRIMITIVA);
    expect(sanitizeHtml(COS)).toBe(COS);
  });

  test('un intent de plegar-la (details/summary) o d’estilar-la a mà no hi passa: es queda la caixa estàtica', () => {
    const net = sanitizeHtml('<div class="sdp-subtargeta" data-sdp-subtargeta="" style="color:red" onclick="x()"><details open><summary>T</summary><p>c</p></details></div>');
    expect(net).toBe('<div class="sdp-subtargeta" data-sdp-subtargeta="">T<p>c</p></div>');
  });
});

describe('la lectura: dins de la carta, sense hidratació', () => {
  test('article.cms-preview (TextSection): la caixa és un fill directe, amb el títol i la metadada per estructura', () => {
    const { container } = render(<TextSection page={{ title: 'Prova', html: COS }} pageKey="prova" />);
    const article = container.querySelector('[data-pagina] > article.cms-preview');
    expect(article.innerHTML).toBe(sanitizeHtml(COS));
    const caixa = article.querySelector(':scope > div.sdp-subtargeta[data-sdp-subtargeta]');
    expect(caixa.firstElementChild.tagName).toBe('H4');
    expect(caixa.querySelector(':scope > :first-child + p').textContent).toBe('160 h · 8.000 €');
    expect(article.classList.contains('sdp-amb-targetes')).toBe(false);
  });

  test('article.detail-content (renderRichText): el mateix HTML sanejat, la mateixa caixa', () => {
    const { container } = render(renderRichText(COS));
    const article = container.firstElementChild;
    expect([article.tagName, article.className]).toEqual(['ARTICLE', 'detail-content']);
    expect(article.innerHTML).toBe(sanitizeHtml(COS));
    expect(article.querySelector(':scope > .sdp-subtargeta > h4').textContent).toBe('Arquitectura');
  });

  test.each([
    /* C2-04 (àrbitre) · «Les quatre infografies històriques» es queda fora: el seu primer
       paràgraf és cos (l'avís d'honestedat), i la caixa el pintaria com una metadada. */
    ['projecte', 'H3', ['D’on venim']],
    // P0-62 bis (08-11-2026; ordre del Mestre al xat de Claude) · Davant, la caixa dels tres passos de Google Play.
    ['descarregues', 'H5', ['Els tres passos a Google Play', "A l'ordinador", 'Al mòbil i a la tauleta']],
    ['fediversity', 'H4', [
      '1 · Arquitectura Model B (160 h · 8.000 €)',
      '2 · UX/WCAG AAA + Fletxes IDEA-58 + Traductor Apertium IDEA-31 (240 h · 12.000 €)',
      '3 · Mòduls Cívics + Karpathy + Open Data Municipal + ActivityPub (440 h · 22.000 €)',
      '4 · Proves, seguretat i empaquetat reproduïble (160 h · 8.000 €)'
    ]]
  ])('%s: les seues subtargetes arriben pintades, amb el títol com a primer fill', (clau, nivell, titols) => {
    const { container } = render(<TextSection page={PAGE_COPY[clau]} pageKey={clau} />);
    /* Ordre 261103_0522, T2.6 (Gauntlet O7-9, ronda 2; PC-02) · projecte i fediversity porten una targeta
       incrustada i el cos va per CosAmbTargetes: la caixa és filla d'un tros .sdp-cos-tros (display: contents),
       mai del grup de targetes. descarregues continua pel camí de sempre. Prova posada al dia a propòsit. */
    const caixes = [...container.querySelectorAll('article.cms-preview > div.sdp-subtargeta[data-sdp-subtargeta], article.cms-preview.sdp-amb-targetes > .sdp-cos-tros > div.sdp-subtargeta[data-sdp-subtargeta]')];
    expect(caixes.map((caixa) => [caixa.firstElementChild.tagName, caixa.firstElementChild.textContent])).toEqual(titols.map((titol) => [nivell, titol]));
    expect(container.querySelectorAll('.sdp-subtargeta .sdp-subtargeta')).toHaveLength(0);
    expect(container.querySelectorAll('.sdp-targetes .sdp-subtargeta')).toHaveLength(0);
  });
});

describe('el CSS: el bloc .sdp-subtargeta de modules.css', () => {
  const moduls = readFileSync(resolve(process.cwd(), 'src/css/modules.css'), 'utf8');
  const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
  const inici = moduls.indexOf('/* ═══ SUBTARGETA · O4-CLAUDE-2');
  const bloc = senseComentaris(moduls.slice(inici, moduls.indexOf('/* ── GESTORIA TAULER', inici))).trim();
  const regla = (selector) => {
    const i = bloc.indexOf(`${selector} {`);
    return i < 0 ? null : bloc.slice(i, bloc.indexOf('}', i));
  };

  test('un sol bloc dins de @layer components, fora del bloc T7 de les targetes incrustades', () => {
    expect(inici).toBeGreaterThan(moduls.indexOf('/* ═══ MODE BANCAL'));
    expect(bloc.startsWith('@layer components {')).toBe(true);
    expect(senseComentaris(moduls).match(/\.sdp-subtargeta \{/g)).toHaveLength(1);
  });

  test('la caixa de targeta Pedra Seca: superfície, vora, radi i ombra suau de les targetes, coixí de la reixeta', () => {
    const caixa = regla('.sdp-subtargeta');
    for (const declaracio of [
      'background: var(--sdp-fons-superficie)', 'border: 1px solid var(--sdp-vora)', 'border-radius: var(--sdp-radi-m)',
      'box-shadow: var(--sdp-ombra-1)', 'padding: var(--sdp-space-4) var(--sdp-space-5)', 'margin-block: var(--sdp-space-6)', 'clear: both'
    ]) expect(caixa, declaracio).toContain(declaracio);
  });

  test('el títol i la metadada per estructura (cap classe al contingut): l’aspecte del títol de targeta i el text suau', () => {
    const titol = regla('.sdp-subtargeta > :first-child');
    // C2-08 (àrbitre) · El pes, en token (--sdp-pes-extra, 800), no en literal.
    for (const declaracio of ['font-size: var(--sdp-text-h5)', 'font-weight: var(--sdp-pes-extra)', 'color: var(--sdp-accio-text)', 'border-bottom: 1px solid var(--sdp-vora)']) {
      expect(titol, declaracio).toContain(declaracio);
    }
    expect(bloc).not.toMatch(/font-weight:\s*\d/);
    const meta = regla('.sdp-subtargeta > :first-child + p');
    expect(meta).toContain('color: var(--sdp-text-suau)');
    expect(meta).toContain('font-size: var(--sdp-text-small)');
    expect(regla('.sdp-subtargeta.ProseMirror-selectednode')).toContain('outline: var(--sdp-focus-gruix) solid var(--sdp-focus)');
  });

  /* O4 (D5) · En un contenidor de més de 848px, els h5 de dins («Fet hui (verificable)») feien
     26px (--sdp-fluid-h5 en cqi) i el títol h4 de la caixa, 24: la jerarquia visual, al revés
     de la del DOM. Els apartats de darrere del títol queden fitats a --sdp-text-h6 (20px). */
  test('els apartats de dins de la caixa mai passen del títol', () => {
    const apartats = regla('.sdp-subtargeta > :first-child ~ :is(h3, h4, h5)');
    expect(apartats).not.toBeNull();
    expect(apartats).toContain('font-size: min(var(--sdp-fluid-h5), var(--sdp-text-h6))');
    expect(apartats).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  /* C2-03 (àrbitre) · L'últim fill (el paràgraf o la llista final, amb el seu --sdp-mb-p o
     --sdp-mb-ul de base.css) no suma marge al coixí de baix: la caixa queda quadrada, el mateix
     coixí a dalt i a baix. Dins de @layer components, que va darrere de legacy (base.css). */
  test('l’últim fill de la caixa, sense marge de baix', () => {
    expect(regla('.sdp-subtargeta > :last-child')).toContain('margin-block-end: 0');
    const capes = readFileSync(resolve(process.cwd(), 'src/css/index.css'), 'utf8').match(/@layer ([\w, ]+);/)[1].split(/,\s*/);
    expect(capes.indexOf('components')).toBeGreaterThan(capes.indexOf('legacy'));
  });

  test('només tokens: cap color cru, cap selector de pare ni de contenidor, cap ranura de dades', () => {
    expect(bloc).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/);
    expect(bloc).not.toMatch(/:has\(|@container|data-sdp-ranura/);
    for (const [, valor] of bloc.matchAll(/(?:margin|padding|gap)[\w-]*:\s*([^;]+);/g)) {
      expect(valor.trim(), valor).toMatch(/^(?:0|var\(--sdp-space-\d+\))(?:\s+(?:0|var\(--sdp-space-\d+\)))*$/);
    }
  });
});
