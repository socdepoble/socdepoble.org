/* v1.2.17 · Gauntlet R1 (L3-10) · El plec de BandaBetaMicroApp (Gemini R32.26): la general es plega amb
   UN sol botó amb aria-expanded que no es desmunta (el focus no cau a <body>, WCAG 2.4.3) i, plegada, el
   seu nom és el text visible (WCAG 2.5.3). La fiscal (Verifactu / AEAT) no es plega mai: sencera i sense botó. */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { LLENGUES_APP } from '../../../apps/plataforma/manifestApp.js';
import { getVal, setVal } from '../../../config/storage.js';
import { BandaBetaMicroApp } from './BandaBetaMicroApp.jsx';
import {
  TEXTOS_BANDA_BETA_FISCAL,
  TEXTOS_BANDA_BETA_GENERAL,
  bandaBetaPlegable,
  bandaBetaPlegada,
  desaBandaBetaPlegada,
} from './textosBandaBeta.js';

const neteja = () => {
  desaBandaBetaPlegada('general', false);
  try { window.localStorage.clear(); } catch { /* sense emmagatzematge */ }
};

/* El text que es veu dins del botó: sense els fills aria-hidden (🧪 i la fletxa). */
const textVisible = (boto) => [...boto.childNodes]
  .filter((node) => !(node.nodeType === 1 && node.getAttribute('aria-hidden') === 'true'))
  .map((node) => node.textContent)
  .join('')
  .trim();

beforeEach(neteja);
afterEach(() => {
  cleanup();
  neteja();
});

describe('v1.2.17 · Gauntlet R1 (L3-10) · BandaBetaMicroApp: un sol control de plec, focus estable i la fiscal sencera', () => {
  test.each(LLENGUES_APP)('general (%s): el mateix botó plega i desplega, amb aria-expanded, el nom amb el text visible i el focus al seu lloc', (lang) => {
    const tx = TEXTOS_BANDA_BETA_GENERAL[lang];
    const { container } = render(<BandaBetaMicroApp idioma={lang} avisBeta="general" />);
    const banda = container.querySelector('aside.sdp-banda-beta');
    expect(banda.textContent).toBe(tx.text);
    expect(screen.getAllByRole('button')).toHaveLength(1);

    const boto = screen.getByRole('button', { name: tx.plega });
    expect(boto.getAttribute('aria-expanded')).toBe('true');
    expect(boto.getAttribute('title')).toBe(tx.plega);
    const text = container.querySelector('.sdp-banda-beta__text');
    expect(boto.getAttribute('aria-controls')).toBe(text.id);
    expect(textVisible(boto)).toBe('');

    boto.focus();
    fireEvent.click(boto);
    /* El mateix node: ni s'ha desmuntat ni el focus ha caigut a <body>. */
    expect(boto.isConnected).toBe(true);
    expect(document.activeElement).toBe(boto);
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(boto.getAttribute('aria-expanded')).toBe('false');
    expect(boto.hasAttribute('aria-label')).toBe(false);
    expect(boto.hasAttribute('aria-controls')).toBe(false);
    expect(textVisible(boto)).toBe(tx.etiquetaCurta);
    expect(screen.getByRole('button', { name: tx.etiquetaCurta })).toBe(boto);
    expect(container.querySelector('.sdp-banda-beta__text')).toBeNull();
    expect(banda.getAttribute('data-plegada')).toBe('true');
    expect(bandaBetaPlegada('general')).toBe(true);

    fireEvent.click(boto);
    expect(document.activeElement).toBe(boto);
    expect(boto.getAttribute('aria-expanded')).toBe('true');
    expect(banda.textContent).toBe(tx.text);
    expect(bandaBetaPlegada('general')).toBe(false);
  });

  test('general: l’aparell se’n recorda en tornar a muntar-la', () => {
    const primera = render(<BandaBetaMicroApp idioma="ca" avisBeta="general" />);
    fireEvent.click(screen.getByRole('button', { name: TEXTOS_BANDA_BETA_GENERAL.ca.plega }));
    primera.unmount();
    const segona = render(<BandaBetaMicroApp idioma="ca" avisBeta="general" />);
    expect(segona.container.querySelector('aside')?.getAttribute('data-plegada')).toBe('true');
    expect(screen.getByRole('button', { name: TEXTOS_BANDA_BETA_GENERAL.ca.etiquetaCurta }).getAttribute('aria-expanded')).toBe('false');
  });

  test.each(LLENGUES_APP)('fiscal (%s): sempre sencera i sense control de plec, encara que la general estiga plegada o hi haja un plec fiscal antic desat', (lang) => {
    desaBandaBetaPlegada('general', true);
    setVal('banda_beta_plegada_v1_fiscal', true);
    const { container } = render(<BandaBetaMicroApp idioma={lang} avisBeta="fiscal" />);
    const banda = container.querySelector('aside.sdp-banda-beta[data-sdp-banda-beta="fiscal"]');
    expect(banda.textContent).toBe(TEXTOS_BANDA_BETA_FISCAL[lang].text);
    expect(banda.className).toBe('sdp-banda-beta');
    expect(banda.hasAttribute('data-plegada')).toBe(false);
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('fiscal: ni es llig ni es desa cap plec; la general sí', () => {
    expect(bandaBetaPlegable('fiscal')).toBe(false);
    expect(bandaBetaPlegable('general')).toBe(true);
    expect(desaBandaBetaPlegada('fiscal', true)).toBe(false);
    expect(bandaBetaPlegada('fiscal')).toBe(false);
    expect(getVal('banda_beta_plegada_v1_general', null)).toBeNull();
    expect(desaBandaBetaPlegada('general', true)).toBe(true);
    expect(bandaBetaPlegada('general')).toBe(true);
    expect(bandaBetaPlegada('fiscal')).toBe(false);
  });

  test('canviar de general plegada a fiscal (l’espècimen) mostra la fiscal sencera, i en tornar la general continua plegada', () => {
    desaBandaBetaPlegada('general', true);
    const { container, rerender } = render(<BandaBetaMicroApp idioma="ca" avisBeta="general" />);
    expect(container.querySelector('aside')?.getAttribute('data-plegada')).toBe('true');
    rerender(<BandaBetaMicroApp idioma="ca" avisBeta="fiscal" />);
    expect(container.querySelector('aside')?.textContent).toBe(TEXTOS_BANDA_BETA_FISCAL.ca.text);
    expect(screen.queryByRole('button')).toBeNull();
    rerender(<BandaBetaMicroApp idioma="ca" avisBeta="general" />);
    expect(container.querySelector('aside')?.getAttribute('data-plegada')).toBe('true');
  });
});
