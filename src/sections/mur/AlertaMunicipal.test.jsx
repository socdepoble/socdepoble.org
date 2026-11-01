/**
 * T3.3 (marató nocturna 261101, carril B3) · El distintiu d'alerta municipal
 * a la targeta del Mur (TargetaDelMur + AlertaMunicipal.jsx):
 *  · amb `alertaMunicipal`, text visible, icona redundant i vora del seu to;
 *  · sense la prop (o amb un tipus desconegut), el DOM de sempre (Llei del Píxel);
 *  · mai a una pàgina del sistema ni a un producte;
 *  · contrast AAA (≥ 7:1) del text sobre el seu fons en clar i en fosc, i
 *    vores i enllaços d'avís per damunt dels seus mínims, calculats amb els
 *    tokens de tokens.css i les regles escrites (jsdom no pinta).
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa }),
  useUIState: () => ({ externalConfig: {} })
}));
import { TargetaDelMur } from './TargetaDelMur.jsx';
import { DistintiuAlertaMunicipal, RegioAlertesVigents } from './AlertaMunicipal.jsx';
import { contrast } from '../../config/contrast.js';

afterEach(cleanup);

const PUBLICACIO = Object.freeze({
  id: 'aigua', type: 'feed', title: 'Tall d’aigua dimecres', subtitle: 'De 9 a 14 h',
  description: 'Obres a la xarxa del carrer Major.', created_at: '2026-11-01T08:00:00.000Z',
  labels: [{ text: 'Bàndol urgent', className: 'sdp-badge-category' }], author_org_id: 'aj-1', author_name: 'Ajuntament'
});
const html = (props) => {
  const { container } = render(<TargetaDelMur item={PUBLICACIO} {...props} />);
  const text = container.innerHTML;
  cleanup();
  return text;
};
/* Els id de useId canvien entre muntatges: es comparen sense ells. */
const senseIds = (text) => text.replace(/«r[0-9a-z]+»|:r[0-9a-z]+:|_r_[0-9a-z]+_/g, 'ID');

describe('el distintiu a la targeta', () => {
  test('sense la prop, amb null o amb un tipus desconegut, el DOM de sempre', () => {
    const sempre = senseIds(html({}));
    expect(sempre).not.toMatch(/sdp-mur-alerta/);
    expect(senseIds(html({ alertaMunicipal: null }))).toBe(sempre);
    expect(senseIds(html({ alertaMunicipal: 'urgentissim' }))).toBe(sempre);
    expect(senseIds(html({ alertaMunicipal: 'toString' }))).toBe(sempre);
  });

  test('amb «bandol_urgent»: el text visible, la icona amagada, la vora d’avís, i res més del cos canvia', () => {
    const { container } = render(<TargetaDelMur item={PUBLICACIO} alertaMunicipal="bandol_urgent" />);
    const article = container.querySelector('article');
    expect(article.classList.contains('sdp-mur-alerta-targeta--avis')).toBe(true);
    const distintiu = article.querySelector('.sp-card-body .sdp-mur-alerta');
    expect(distintiu.tagName).toBe('P');
    expect(distintiu.textContent).toBe('Bàndol urgent');
    expect(distintiu.querySelector('.sdp-insignia--avis svg').getAttribute('aria-hidden')).toBe('true');
    expect(distintiu.closest('[role], [aria-live]')).toBeNull();
    // El títol, el subtítol, la descripció i les etiquetes de sempre continuen.
    expect(article.querySelector('.sp-card-title').textContent).toBe(PUBLICACIO.title);
    expect(article.querySelector('.sp-card-subtitle').textContent).toBe(PUBLICACIO.subtitle);
    expect(article.querySelector('.sp-card-text p.sp-card-text').textContent).toBe(PUBLICACIO.description);
    expect([...article.querySelectorAll('.sp-card-labels li')].map((li) => li.textContent)).toEqual(['Bàndol urgent']);
    // Ordre: títol → subtítol → distintiu → descripció.
    const ordre = [...article.querySelectorAll('.sp-card-title, .sp-card-subtitle, .sdp-mur-alerta, p.sp-card-text')].map((el) => el.className);
    expect(ordre).toEqual(['sp-card-title', 'sp-card-subtitle', 'sdp-mur-alerta', 'sp-card-text']);
  });

  test('amb «alerta»: Alerta municipal amb el to de perill; una entradeta de text també es conserva', () => {
    const { container } = render(<TargetaDelMur item={{ ...PUBLICACIO, lead: 'Entradeta.' }} alertaMunicipal="alerta" />);
    const article = container.querySelector('article');
    expect(article.classList.contains('sdp-mur-alerta-targeta--perill')).toBe(true);
    expect(article.querySelector('.sdp-mur-alerta .sdp-insignia--error').textContent).toBe('Alerta municipal');
    expect(article.querySelector('.sp-card-text p.sp-card-text').textContent).toBe('Entradeta.');
  });

  test('mai a una pàgina del sistema ni a un producte del Mercat', () => {
    for (const item of [
      { ...PUBLICACIO, id: 'consola', isSystem: true, type: 'sistema', mainHref: '/consola' },
      { ...PUBLICACIO, id: 'cistella', type: 'market' },
      { ...PUBLICACIO, id: 'samarreta', type: 'product' }
    ]) {
      const { container } = render(<TargetaDelMur item={item} alertaMunicipal="alerta" />);
      expect(container.querySelector('.sdp-mur-alerta'), item.id).toBeNull();
      expect(container.querySelector('article').className, item.id).not.toMatch(/sdp-mur-alerta-targeta/);
      cleanup();
    }
  });

  test('les peces soles: un tipus desconegut no pinta res, i la regió inactiva tampoc', () => {
    expect(render(<DistintiuAlertaMunicipal tipus="hasOwnProperty" />).container.innerHTML).toBe('');
    cleanup();
    expect(render(<RegioAlertesVigents alertes={[{ item: PUBLICACIO, tipus: 'alerta' }]} />).container.innerHTML).toBe('');
    cleanup();
    const { container } = render(<RegioAlertesVigents activa alertes={[{ item: PUBLICACIO, tipus: 'desconegut' }]} />);
    expect(container.innerHTML).toBe('<div role="status"></div>');
  });
});

/* ── Contrast, amb els tokens de tokens.css i les regles escrites ────────── */
const llig = (cami) => readFileSync(resolve(process.cwd(), cami), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const TOKENS = llig('src/css/tokens.css');
const INICI_FOSC = TOKENS.indexOf(':root[data-theme="dark"], :host([data-theme="dark"])');
const CLAR = TOKENS.slice(0, INICI_FOSC);
const FOSC = TOKENS.slice(INICI_FOSC, TOKENS.indexOf('}', INICI_FOSC));
const declaracio = (text, nom) => new RegExp(`(?<![\\w-])${nom}\\s*:\\s*([^;]+);`).exec(text)?.[1].trim() ?? null;
function hex(nom, tema) {
  const valor = (n) => (tema === 'fosc' && declaracio(FOSC, n)) || declaracio(CLAR, n);
  let v = valor(nom);
  for (let i = 0; i < 8 && v?.startsWith('var('); i += 1) v = valor(v.slice(4, -1).trim());
  return v;
}
/** Les declaracions d'un selector exacte d'un full (l'última guanya). */
function regla(full, selector) {
  const net = (text) => text.replace(/\s+/g, ' ').trim();
  const eixida = {};
  for (const m of llig(full).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!net(m[1]).split(',').map(net).includes(selector)) continue;
    for (const d of m[2].split(';')) {
      const [prop, ...resta] = d.split(':');
      if (prop?.trim()) eixida[net(prop)] = net(resta.join(':'));
    }
  }
  return eixida;
}
const token = (valor) => /var\((--[\w-]+)\)/.exec(valor)?.[1];

describe('contrast AAA en clar i en fosc', () => {
  test('les regles del Mur citen els tokens del semàfor', () => {
    expect(regla('src/css/modules.css', '.sp-card.sdp-mur-alerta-targeta--perill').border).toBe('2px solid var(--sdp-error-text)');
    expect(regla('src/css/modules.css', '.sp-card.sdp-mur-alerta-targeta--avis').border).toBe('2px solid var(--sdp-avis-text)');
    expect(regla('src/css/modules.css', '.sp-card-body .sdp-mur-alerta .sdp-insignia')['font-size']).toBe('var(--sdp-text-base)');
    expect(regla('src/css/modules.css', '.sdp-mur-alertes__enllac')).toMatchObject({
      color: 'var(--sdp-accio-text)', 'text-decoration': 'underline', 'min-block-size': 'var(--sdp-touch)'
    });
    expect(regla('src/css/components.css', '.sdp-insignia--error')).toMatchObject({ background: 'var(--sdp-error-fons)', color: 'var(--sdp-error-text)' });
    expect(regla('src/css/components.css', '.sdp-insignia--avis')).toMatchObject({ background: 'var(--sdp-avis-fons)', color: 'var(--sdp-avis-text)' });
    expect(regla('src/css/components.css', '.sdp-alerta--avis')).toMatchObject({ background: 'var(--sdp-avis-fons)', color: 'var(--sdp-avis-text)' });
  });

  test.each(['clar', 'fosc'])('tema %s: text ≥ 7:1, vora de la targeta ≥ 3:1', (tema) => {
    const parells = [
      ['distintiu d’alerta', regla('src/css/components.css', '.sdp-insignia--error')],
      ['distintiu de bàndol', regla('src/css/components.css', '.sdp-insignia--avis')],
      ['avís de dalt', regla('src/css/components.css', '.sdp-alerta--avis')]
    ];
    for (const [nom, { color, background }] of parells) {
      const [text, fons] = [hex(token(color), tema), hex(token(background), tema)];
      expect(text, nom).toMatch(/^#[0-9a-f]{6}$/i);
      expect(fons, nom).toMatch(/^#[0-9a-f]{6}$/i);
      expect(contrast(text, fons), `${nom} (${tema}: ${text} sobre ${fons})`).toBeGreaterThanOrEqual(7);
    }
    const enllac = hex(token(regla('src/css/modules.css', '.sdp-mur-alertes__enllac').color), tema);
    expect(contrast(enllac, hex('--sdp-avis-fons', tema)), `enllaç de l’avís (${tema})`).toBeGreaterThanOrEqual(7);
    for (const classe of ['.sp-card.sdp-mur-alerta-targeta--perill', '.sp-card.sdp-mur-alerta-targeta--avis']) {
      const vora = hex(token(regla('src/css/modules.css', classe).border), tema);
      expect(contrast(vora, hex('--sdp-fons-targeta', tema)), `${classe} (${tema})`).toBeGreaterThanOrEqual(3);
    }
  });
});
