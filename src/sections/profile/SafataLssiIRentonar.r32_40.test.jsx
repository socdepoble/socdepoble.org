import '../../../tests/helpers/diccionaris.js';
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext.jsx';
import { delVal } from '../../config/storage.js';
import { DialegDenunciaContingut } from '../../components/universal/DialegDenunciaContingut.jsx';
import {
  CLAU_CUA_DENUNCIES_LSSI,
  desaDenunciaEnCuaLocal,
  detallPerAlPortModeracio,
  lligCuaDenunciesLocals,
  textosDenunciaContingut
} from '../../components/universal/i18nDenunciaContingut.js';
import {
  aplicaRevisioDenunciaDiligent,
  coaccionaFilaSafataRemota
} from './admin/serveiSafataDenunciesDiligents.js';
import DocumentacioHistoricaRentonar from './DocumentacioHistoricaRentonar.jsx';

const ID_DENUNCIA = '11111111-2222-4333-8444-555555555555';
const ID_PUB = '66666666-7777-4888-8999-aaaaaaaaaaaa';
const CONFIG_REMOT = Object.freeze({
  backendId: 'supabase',
  dataMode: 'remote',
  supabaseUrl: 'https://socdepoble.supabase.co',
  supabaseAnonKey: 'anon-test-key',
  tenantId: '00000000-0000-4000-8000-000000000001'
});

beforeEach(() => {
  delVal(CLAU_CUA_DENUNCIES_LSSI);
  if (typeof HTMLDialogElement !== 'undefined') {
    HTMLDialogElement.prototype.showModal ??= function showModal() { this.setAttribute('open', ''); };
    HTMLDialogElement.prototype.close ??= function close() { this.removeAttribute('open'); };
  }
});

afterEach(() => {
  cleanup();
  for (const d of document.querySelectorAll('dialog')) d.remove();
  delVal(CLAU_CUA_DENUNCIES_LSSI);
  vi.restoreAllMocks();
});

describe('Onada R32.40 · Anti-boicot LSSI Zalgo/UTF-16, Safata 1.000 punts de codi i Rentonar WAI-ARIA tabs', () => {
  test('anti-boicot LSSI: un anunci amb títol Zalgo (>64 marques combinants) o surrogat solt es pot denunciar sense TypeError', async () => {
    const titolHostil = `Oferta trampa a\u0301${'\u0301'.repeat(80)} \uD800 final`;
    const onEnvia = vi.fn().mockResolvedValue({ parcial: false, repetida: false });
    const tx = textosDenunciaContingut('ca');

    render(
      <DialegDenunciaContingut
        obert
        objectiu={{ tipus: 'publicacio', id: ID_PUB, titol: titolHostil }}
        idioma="ca"
        onTanca={vi.fn()}
        onEnvia={onEnvia}
      />
    );

    fireEvent.click(screen.getByRole('radio', { name: new RegExp(tx.motius.spam.etiqueta) }));
    fireEvent.change(screen.getByLabelText(/^Fets o context verificable/), {
      target: { value: 'Títol manipulat per intentar bloquejar el botó de denúncia.' }
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: tx.envia }));
    });

    expect(document.querySelector('[data-estat-denuncia="success"]')).not.toBeNull();
    expect(onEnvia).toHaveBeenCalledOnce();
    const cua = lligCuaDenunciesLocals();
    expect(cua).toHaveLength(1);
    expect(cua[0].titol).toContain('Oferta trampa');
    expect(cua[0].titol).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/);
  });

  test('desaDenunciaEnCuaLocal llança detall-massa-llarg (>1.024 caràcters) en lloc de null.trim() i detallPerAlPortModeracio no trenca parells surrogats', () => {
    expect(() =>
      desaDenunciaEnCuaLocal({
        tipus: 'publicacio',
        recursId: ID_PUB,
        titol: 'Normal',
        motiu: 'spam',
        detall: 'x'.repeat(1100)
      })
    ).toThrow(expect.objectContaining({ code: 'detall-massa-llarg' }));

    // Prefix '[LSSI-16:contingut_illicit] ' té 28 caràcters; 971 'a' + '😀' posa el surrogat alt a l'índex 999!
    const ambEmojiAlTall = `${'a'.repeat(971)}😀final`;
    const portPayload = detallPerAlPortModeracio('contingut_illicit', ambEmojiAlTall);
    expect(portPayload.length).toBeLessThanOrEqual(1000);
    // Zero surrogats solts invàlids al final
    const darrerCodi = portPayload.charCodeAt(portPayload.length - 1);
    expect(darrerCodi < 0xd800 || darrerCodi > 0xdbff).toBe(true);
  });

  test('coaccionaFilaSafataRemota conserva els 1.000 punts de codi visibles després del prefix LSSI-16 i aplicaRevisioDenunciaDiligent preserva operacioId davant rebut invàlid', async () => {
    const cos1000 = `${'e'.repeat(999)}Z`;
    const fila = coaccionaFilaSafataRemota({
      id: ID_DENUNCIA,
      publicacioId: ID_PUB,
      motiu: 'ofensiu',
      detall: `[LSSI-16:contingut_illicit] ${cos1000}`,
      estat: 'rebuda',
      versio: 1
    });

    expect(fila.submotiuLssi).toBe('contingut_illicit');
    expect(Array.from(fila.detall)).toHaveLength(1000);
    expect(fila.detall.endsWith('Z')).toBe(true);

    const registreOperacions = new Map();
    const crides = [];
    let retornaInvalid = true;
    const port = {
      teCapacitat: () => true,
      revisaDenunciaDiligent: vi.fn(async (payload) => {
        crides.push(payload.operacioId);
        if (retornaInvalid) {
          retornaInvalid = false;
          return { id: null, estat: 'inventat', versio: NaN };
        }
        return { id: payload.id, estat: payload.estat, versio: payload.versio + 1, repetida: false };
      })
    };

    const opcions = {
      id: ID_DENUNCIA,
      estatEsperat: 'rebuda',
      versio: 1,
      estat: 'en_revisio',
      justificacio: 'Revisió motivada per moderació humana.',
      config: CONFIG_REMOT,
      registreOperacions
    };

    await expect(aplicaRevisioDenunciaDiligent(opcions, port)).rejects.toMatchObject({
      code: 'REBUT_REVISIO_INVALID'
    });
    expect(registreOperacions.size).toBe(1);

    const rebutValid = await aplicaRevisioDenunciaDiligent(opcions, port);
    expect(crides).toHaveLength(2);
    expect(crides[1]).toBe(crides[0]);
    expect(rebutValid.operacioId).toBe(crides[0]);
    expect(registreOperacions.size).toBe(0);
  });

  test('DocumentacioHistoricaRentonar aplica roving tabIndex, navegació amb fletxes/Home/End i tabIndex=0 al panell d’Estatuts sense interactius', () => {
    render(
      <MemoryRouter>
        <DocumentacioHistoricaRentonar />
      </MemoryRouter>
    );

    const seccio = screen.getByTestId('documentacio-historica-rentonar');
    const tabs = within(seccio).getAllByRole('tab');
    expect(tabs.map((t) => t.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);

    tabs[0].focus();
    fireEvent.keyDown(tabs[0], { key: 'ArrowRight' });
    expect(tabs.map((t) => t.getAttribute('tabindex'))).toEqual(['-1', '0', '-1']);
    expect(document.activeElement).toBe(tabs[1]);

    const panellEstatuts = within(seccio).getByRole('tabpanel');
    expect(panellEstatuts.id).toBe('panel-rentonar-estatuts');
    expect(panellEstatuts.getAttribute('tabindex')).toBe('0');

    fireEvent.keyDown(tabs[1], { key: 'End' });
    expect(tabs.map((t) => t.getAttribute('tabindex'))).toEqual(['-1', '-1', '0']);
    expect(document.activeElement).toBe(tabs[2]);
    expect(within(seccio).getByRole('tabpanel').id).toBe('panel-rentonar-acta');

    fireEvent.keyDown(tabs[2], { key: 'ArrowRight' });
    expect(tabs.map((t) => t.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);
    expect(document.activeElement).toBe(tabs[0]);

    fireEvent.keyDown(tabs[0], { key: 'ArrowLeft' });
    expect(tabs.map((t) => t.getAttribute('tabindex'))).toEqual(['-1', '-1', '0']);
    expect(document.activeElement).toBe(tabs[2]);

    fireEvent.keyDown(tabs[2], { key: 'Home' });
    expect(tabs.map((t) => t.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);
    expect(document.activeElement).toBe(tabs[0]);
  });
});
