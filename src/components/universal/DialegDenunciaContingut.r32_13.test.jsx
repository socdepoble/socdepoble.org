import '../../../tests/helpers/diccionaris.js';
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { delVal } from '../../config/storage.js';
import { ModeracioContext } from '../PedraSeca/hooks/moderacioDePoble.js';
import { DialegDenunciaContingut } from './DialegDenunciaContingut.jsx';
import {
  CLAU_CUA_DENUNCIES_LSSI,
  MOTIUS_DENUNCIA_LSSI,
  TEXTOS_DENUNCIA_CONTINGUT,
  lligCuaDenunciesLocals,
  textosDenunciaContingut
} from './i18nDenunciaContingut.js';

const OBJECTIU_PROVA = Object.freeze({
  tipus: 'publicacio',
  id: 'post-lssi-01',
  titol: 'Anunci sospitós al Mercat',
  autor: Object.freeze({ tipus: 'persona', id: 'autor-99', nom: ' Pere Foraster ' }),
  bloquejable: true
});

function netejaDialegsJSDOM() {
  for (const d of document.querySelectorAll('dialog')) d.remove();
}

beforeEach(() => {
  delVal(CLAU_CUA_DENUNCIES_LSSI);
  /* Polyfill lleuger de showModal/close en JSDOM si cal */
  if (typeof HTMLDialogElement !== 'undefined') {
    if (!HTMLDialogElement.prototype.showModal) {
      HTMLDialogElement.prototype.showModal = function showModal() {
        this.setAttribute('open', '');
      };
    }
    if (!HTMLDialogElement.prototype.close) {
      HTMLDialogElement.prototype.close = function close() {
        this.removeAttribute('open');
      };
    }
  }
});

afterEach(() => {
  cleanup();
  netejaDialegsJSDOM();
  delVal(CLAU_CUA_DENUNCIES_LSSI);
});

describe('Onada R32.13 · Lot 03 (P0-114 Escut 2) · DialegDenunciaContingut LSSI Art. 16', () => {
  test('paritat de les 5 llengües (ca, es, en, eu, gl), 5 motius estructurats i Llei 32 = 0', () => {
    const llengues = ['ca', 'es', 'en', 'eu', 'gl'];
    expect(Object.keys(TEXTOS_DENUNCIA_CONTINGUT).sort()).toEqual([...llengues].sort());
    expect(MOTIUS_DENUNCIA_LSSI).toEqual([
      'contingut_illicit',
      'suplantacio',
      'assetjament',
      'spam',
      'drets_autor'
    ]);

    for (const lang of llengues) {
      const tx = textosDenunciaContingut(lang);
      expect(Object.keys(tx.motius)).toEqual([...MOTIUS_DENUNCIA_LSSI]);
      for (const valor of Object.values(tx)) {
        if (typeof valor === 'string') {
          expect(valor.toLowerCase()).not.toContain('servidor del poble');
          expect(valor.toLowerCase()).not.toMatch(/\busar\b/);
        }
      }
      for (const motiu of MOTIUS_DENUNCIA_LSSI) {
        expect(tx.motius[motiu].etiqueta.length).toBeGreaterThan(3);
        expect(tx.motius[motiu].ajuda.length).toBeGreaterThan(10);
      }
    }
  });

  test.each(['ca', 'es', 'en', 'eu', 'gl'])('%s: pinta els 5 motius LSSI i valida l’estat Empty / Error sense motiu', (lang) => {
    const tx = textosDenunciaContingut(lang);
    render(
      <DialegDenunciaContingut
        obert
        objectiu={OBJECTIU_PROVA}
        idioma={lang}
        onTanca={vi.fn()}
      />
    );

    expect(document.querySelector('[data-estat-denuncia="empty"]')).not.toBeNull();
    expect(screen.getByText(tx.estatBuitAjuda)).toBeTruthy();

    for (const clau of MOTIUS_DENUNCIA_LSSI) {
      expect(screen.getByRole('radio', { name: new RegExp(tx.motius[clau].etiqueta) })).toBeTruthy();
    }

    fireEvent.click(screen.getByRole('button', { name: tx.envia }));
    expect(document.querySelector('[data-estat-denuncia="error"]')).not.toBeNull();
    expect(screen.getByRole('alert').textContent).toContain(tx.errorMotiu);
  });

  test('cobrix els estats Loading -> Success (servidor) + Bloqueja també i cua local auditada deduplicada', async () => {
    let resolEnviament;
    const onEnvia = vi.fn(() => new Promise((resolve) => { resolEnviament = resolve; }));
    const demanaBloqueig = vi.fn();
    const onTanca = vi.fn();

    render(
      <ModeracioContext.Provider value={{ disponible: true, potBloquejar: true, demanaBloqueig }}>
        <DialegDenunciaContingut
          obert
          objectiu={OBJECTIU_PROVA}
          idioma="ca"
          onTanca={onTanca}
          onEnvia={onEnvia}
        />
      </ModeracioContext.Provider>
    );

    const tx = textosDenunciaContingut('ca');
    fireEvent.click(screen.getByRole('radio', { name: new RegExp(tx.motius.suplantacio.etiqueta) }));
    fireEvent.change(screen.getByLabelText(new RegExp('^Fets o context verificable')), {
      target: { value: 'Utilitza el nom d’un comerç del poble sense permís.' }
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: tx.envia }));
    });
    expect(document.querySelector('[data-estat-denuncia="loading"]')).not.toBeNull();

    await act(async () => {
      resolEnviament({ parcial: false, repetida: false });
    });

    expect(document.querySelector('[data-estat-denuncia="success"]')).not.toBeNull();
    expect(screen.getByText(tx.exitServidor)).toBeTruthy();

    const cua = lligCuaDenunciesLocals();
    expect(cua).toHaveLength(1);
    expect(cua[0]).toMatchObject({
      norma: 'LSSI-art-16',
      tipus: 'publicacio',
      recursId: 'post-lssi-01',
      motiu: 'suplantacio',
      estatSincronitzacio: 'servidor'
    });

    const botoBloqueig = screen.getByRole('button', { name: 'Bloqueja també Pere Foraster' });
    fireEvent.click(botoBloqueig);
    expect(onTanca).toHaveBeenCalledWith('bloqueja');
    expect(demanaBloqueig).toHaveBeenCalledTimes(1);
  });

  test('cobrix l’estat Partial (cua local auditada quan el servidor encara no confirma) i l’estat Permission', async () => {
    const onEnviaParcial = vi.fn().mockResolvedValue({ parcial: true, repetida: false });
    const { rerender } = render(
      <DialegDenunciaContingut
        obert
        objectiu={OBJECTIU_PROVA}
        idioma="es"
        onTanca={vi.fn()}
        onEnvia={onEnviaParcial}
      />
    );

    const txEs = textosDenunciaContingut('es');
    fireEvent.click(screen.getByRole('radio', { name: new RegExp(txEs.motius.drets_autor.etiqueta) }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: txEs.envia }));
    });

    expect(document.querySelector('[data-estat-denuncia="partial"]')).not.toBeNull();
    expect(screen.getByText(txEs.parcialCuaLocal)).toBeTruthy();
    expect(lligCuaDenunciesLocals()[0].estatSincronitzacio).toBe('cua-local');

    rerender(
      <DialegDenunciaContingut
        obert
        objectiu={{ ...OBJECTIU_PROVA, propietari: true }}
        idioma="gl"
        onTanca={vi.fn()}
      />
    );

    const txGl = textosDenunciaContingut('gl');
    const permisBox = document.querySelector('[data-estat-denuncia="permission"]');
    expect(permisBox).not.toBeNull();
    expect(within(permisBox).getByText(txGl.permisDenegat)).toBeTruthy();
  });
});
