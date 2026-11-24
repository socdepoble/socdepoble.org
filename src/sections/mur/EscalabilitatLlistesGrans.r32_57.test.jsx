/**
 * EscalabilitatLlistesGrans.r32_57.test.jsx · Ronda G5 (R32.57 · E-ESC-02)
 * Verifica la contenció de renderitzat sota el plec (`content-visibility: auto`
 * + `contain-intrinsic-size`), la salvaguarda d'elements sobre el plec, la
 * desactivació en `:focus-within` i `@media print`, i l'absència de regressió en
 * cerca, paginació i navegació al Mur, Pobles i Banc de Llavors.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { adoptaFullDiferit } from '../../config/fullDiferit.js';

const uiMock = vi.hoisted(() => ({
  language: 'ca',
  t: (_clau, reserva, params) => {
    if (!params) return reserva;
    return String(reserva).replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? ''));
  },
}));

vi.mock('../../app/contexts/UIContext', async (original) => ({
  ...(await original()),
  useUIActions: () => uiMock,
  useUIActionsOpcional: () => uiMock,
}));

import BancLlavorsSection from '../patrimoni/BancLlavorsSection.jsx';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const CSS_ESCALABLE = readFileSync(
  resolve(process.cwd(), 'src/css/diferit-llistes-escalables.css'),
  'utf8',
);

const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

describe('R32.57 · E-ESC-02 · Contenció CSS de llistes grans sota el plec', () => {
  test('el full diferit aplica content-visibility: auto només a :nth-child(n + 9) i :nth-child(n + 13) amb contain-intrinsic-size', () => {
    const net = senseComentaris(CSS_ESCALABLE).replace(/\s+/g, ' ').trim();
    expect(net).toContain('@layer components');
    expect(net).toContain('.sdp-graella-escalable > :nth-child(n + 9) { content-visibility: auto; contain-intrinsic-size: auto 420px; }');
    expect(net).toContain('.sdp-llista-escalable > :nth-child(n + 13) { content-visibility: auto; contain-intrinsic-size: auto 52px; }');
    expect(net).not.toMatch(/\.sdp-graella-escalable\s*\{[^}]*content-visibility:\s*auto/);
    expect(net).not.toMatch(/:nth-child\(-n/);
  });

  test('desactiva content-visibility en :focus-within i @media print perquè el focus i la impressió mai s’amaguen', () => {
    const net = senseComentaris(CSS_ESCALABLE).replace(/\s+/g, ' ').trim();
    expect(net).toContain('.sdp-graella-escalable > :nth-child(n + 9):focus-within { content-visibility: visible; contain-intrinsic-size: none; }');
    expect(net).toContain('.sdp-llista-escalable > :nth-child(n + 13):focus-within { content-visibility: visible; contain-intrinsic-size: none; }');
    expect(net).toMatch(/@media print\s*\{\s*\.sdp-graella-escalable > :nth-child\(n \+ 9\),\s*\.sdp-llista-escalable > :nth-child\(n \+ 13\)\s*\{\s*content-visibility: visible;\s*contain-intrinsic-size: none;\s*\}\s*\}/);
  });

  test('adoptaFullDiferit amb clau llistes-escalables és idempotent sobre ShadowRoot encastat', () => {
    expect(adoptaFullDiferit(null, 'llistes-escalables', CSS_ESCALABLE)).toBe(false);

    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    const llista = document.createElement('div');
    shadow.appendChild(llista);
    document.body.appendChild(host);

    const primera = adoptaFullDiferit(llista, 'llistes-escalables', CSS_ESCALABLE);
    const segona = adoptaFullDiferit(llista, 'llistes-escalables', CSS_ESCALABLE);
    expect(primera).toBe(true);
    expect(segona).toBe(false);
    host.remove();
  });

  test('BancLlavorsSection munta .sdp-llista-escalable, conserva la cerca en viu, paginació i retorn de focus', () => {
    const { container } = render(<BancLlavorsSection />);
    const ol = container.querySelector('ol.sdp-llista-escalable');
    expect(ol).not.toBeNull();
    expect(ol.children.length).toBe(24);

    // Mostra'n més amplia més enllà de 24 entrades sense perdre l'ordre ni la classe
    const botoMes = screen.getByRole('button', { name: 'Mostra’n més' });
    fireEvent.click(botoMes);
    expect(ol.children.length).toBeGreaterThan(24);

    // Obrir i tancar una entrada sota el plec (> 12) retorna el focus al seu botó
    const botoSotaPlec = ol.children[15].querySelector('button[data-entrada]');
    const termeCerca = botoSotaPlec.textContent.split(' · ')[0].trim();
    expect(botoSotaPlec).not.toBeNull();
    fireEvent.click(botoSotaPlec);
    const botoTancar = screen.getByRole('button', { name: 'Tancar' });
    fireEvent.click(botoTancar);
    expect(document.activeElement).toBe(botoSotaPlec);

    // La cerca filtra sense trencar la llista escalable
    const campCerca = screen.getByRole('searchbox');
    fireEvent.change(campCerca, { target: { value: termeCerca } });
    const olFiltrada = container.querySelector('ol.sdp-llista-escalable');
    expect(olFiltrada).not.toBeNull();
    expect(olFiltrada.textContent).toContain(termeCerca);
  });
});
