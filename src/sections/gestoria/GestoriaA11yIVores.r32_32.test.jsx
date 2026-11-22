import React from 'react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { CODIS_IDIOMA_GESTORIA, tg, tga } from './i18nGestoria.js';
import { importsEnEuros } from './useGestoria.js';
import { CopiaLlibre, dataHoraSeguraDeCopia } from './facturar/CopiaLlibre.jsx';
import { avuiDe } from './finestreta/Finestreta.jsx';
import { pastillaDe } from './historic/Historic.jsx';

afterEach(cleanup);

describe('R32.32 · Diccionari modular a11y de la Gestoria en 5 llengües', () => {
  const CLAUS_ESTATIQUES = [
    'facturesExclosesAria', 'importsJaEnEuros', 'tornaProposta', 'qrCotejoAria',
    'papersNomOpacAria', 'comprovaPaper', 'obriPestanya', 'lligLo',
    'confirmaEste', 'rebutjaL', 'lesTeuesReglesAria'
  ];

  test('retorna traduccions completes en ca, es, en, eu i gl i respecta WCAG 2.5.3', () => {
    for (const idioma of CODIS_IDIOMA_GESTORIA) {
      for (const clau of CLAUS_ESTATIQUES) {
        const valor = tga(idioma, clau);
        expect(typeof valor).toBe('string');
        expect(valor.trim().length).toBeGreaterThan(2);
        expect(valor).not.toBe(clau);
      }
      const fila = tga(idioma, 'nomFilaFactura', true, 1, 'F-01');
      expect(fila).toContain('F-01');
      expect(tga(idioma, 'celEditableAria', tg(idioma, 'Total'), false, 2)).toContain('2');
      expect(tga(idioma, 'totalEurosCarrecAria', fila)).toContain(fila);

      // WCAG 2.5.3 (Label in Name): cada aria-label d'acció comença pel text visible del control.
      expect(tga(idioma, 'aplicaTotalEurosAria', fila).startsWith(tg(idioma, 'Aplica'))).toBe(true);
      expect(tga(idioma, 'cancellaPasEurosAria', fila).startsWith(tg(idioma, 'Cancel·la'))).toBe(true);
      expect(tga(idioma, 'importsJaEnEurosAria', fila).startsWith(tga(idioma, 'importsJaEnEuros'))).toBe(true);
      expect(tga(idioma, 'mouAFacturesAria', true, fila).startsWith(tga(idioma, 'mouAFactures', true))).toBe(true);
      expect(tga(idioma, 'mouAFacturesAria', false, fila).startsWith(tga(idioma, 'mouAFactures', false))).toBe(true);
      expect(tga(idioma, 'tornaPropostaAria', 'F-9').startsWith(tga(idioma, 'tornaProposta'))).toBe(true);
      expect(tga(idioma, 'comprovaPaperAria', 'a.pdf').startsWith(tga(idioma, 'comprovaPaper'))).toBe(true);
      expect(tga(idioma, 'obriPestanyaAria', 'a.pdf').startsWith(tga(idioma, 'obriPestanya'))).toBe(true);
      expect(tga(idioma, 'lligLoAria', 'a.pdf').startsWith(tga(idioma, 'lligLo'))).toBe(true);
      expect(tga(idioma, 'confirmaEsteAria', 'NIF').startsWith(tga(idioma, 'confirmaEste'))).toBe(true);
      expect(tga(idioma, 'rebutjaLAria', 'NIF').startsWith(tga(idioma, 'rebutjaL'))).toBe(true);
      expect(tga(idioma, 'llevaReglaAria', 'ACME').startsWith(tg(idioma, 'Lleva'))).toBe(true);
      expect(tga(idioma, 'llevaTramAria', 2).startsWith(tg(idioma, 'Lleva'))).toBe(true);
      expect(tga(idioma, 'avisosAnyAria', 2026)).toContain('2026');
      expect(tga(idioma, 'tramsAria', 'Escala estatal', 2026)).toContain('2026');
      expect(tga(idioma, 'editaTramsTitol', 'Escala estatal', 2026)).toContain('2026');
    }
  });

  test('conserva les cadenes valencianes byte a byte en idioma ca', () => {
    expect(tga('ca', 'facturesExclosesAria')).toBe('Factures excloses');
    expect(tga('ca', 'qrCotejoAria')).toBe('Codi QR de cotejo de la factura a l’AEAT');
    expect(tga('ca', 'papersNomOpacAria')).toBe('Papers de nom opac');
    expect(tga('ca', 'lesTeuesReglesAria')).toBe('Les teues regles');
    expect(tga('ca', 'nomFilaFactura', true, 1, 'A-1')).toBe('l’ingrés 1 («A-1»)');
    expect(tga('ca', 'nomFilaFactura', false, 2, '')).toBe('la despesa 2');
    expect(tga('ca', 'tornaPropostaAria', '')).toBe('Torna a la proposta la factura sense número');
    expect(tga('ca', 'llevaReglaAria', ' OpenAI ')).toBe('Lleva la regla « OpenAI »');
    expect(tga('ca', 'editaTramsTitol', 'Escala estatal', 2025)).toBe('Edita els trams (escala estatal, 2025)');
  });
});

describe('R32.32 · Blindatge de vores aritmètiques i de dates a la Gestoria', () => {
  test('importsEnEuros mai produeix NaN ni -0 amb total zero, camps buits o abonaments', () => {
    const buidaZero = importsEnEuros({ subtotal: 0, iva: 0, total: 0, retencio: 0 }, 0);
    expect(buidaZero).toEqual({ subtotal: 0, iva: 0, total: 0, retencio: 0 });
    expect(Object.values(buidaZero).some((v) => Number.isNaN(v) || Object.is(v, -0))).toBe(false);

    const carrecSobreTotalZero = importsEnEuros({ subtotal: 0, iva: 0, total: 0, retencio: 0 }, 1500);
    expect(carrecSobreTotalZero).toEqual({ subtotal: 1500, iva: 0, total: 1500, retencio: 0 });

    const abonament = importsEnEuros({ subtotal: -1000, iva: 0, total: -1000, retencio: 0 }, -920);
    expect(abonament).toEqual({ subtotal: -920, iva: 0, total: -920, retencio: 0 });
    expect(Object.is(abonament.iva, -0)).toBe(false);
    expect(Object.is(abonament.retencio, -0)).toBe(false);

    const normal = importsEnEuros({ subtotal: 10000, iva: 2100, total: 12100 }, 11000);
    expect(normal.subtotal + normal.iva).toBe(11000);
    expect(normal.total).toBe(11000);
  });

  test('CopiaLlibre i dataHoraSeguraDeCopia no llancen RangeError ni TypeError amb instant corrupte o dades buides', () => {
    expect(dataHoraSeguraDeCopia(NaN)).toBeNull();
    expect(dataHoraSeguraDeCopia('data-corrupta')).toBeNull();
    expect(dataHoraSeguraDeCopia(1e20)).toBeNull();
    expect(dataHoraSeguraDeCopia(null)).toBeNull();

    const fCorrupte = {
      perfil: { copia: { instant: 'instant-corrupte', dades: undefined } },
      config: null,
      cadena: [],
      informe: { valida: true },
      ocupat: null,
      potTriarCarpeta: false,
      avis: null,
      tancaAvis: vi.fn(),
      exporta: vi.fn(),
      restaura: vi.fn()
    };
    const { container } = render(<CopiaLlibre f={fCorrupte} idioma="es" />);
    expect(container.textContent).toContain('«sense nom»');
    expect(container.textContent).not.toContain('NaN');
  });

  test('avuiDe i pastillaDe rebutgen timestamps fora de rang o invàlids sense emetre NaN', () => {
    for (const rellotge of [() => NaN, () => 'no-es-data', () => 1e20]) {
      const iso = avuiDe(rellotge);
      expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(iso).not.toContain('NaN');
    }
    expect(pastillaDe(1e20)).toBeNull();
    expect(pastillaDe(-1e20)).toBeNull();
    expect(pastillaDe(NaN)).toBeNull();
    expect(pastillaDe(Infinity)).toBeNull();
    expect(pastillaDe(Date.UTC(2026, 10, 21, 10, 30))).not.toBeNull();
  });
});
