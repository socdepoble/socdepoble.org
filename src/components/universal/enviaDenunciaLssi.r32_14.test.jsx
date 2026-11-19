import '../../../tests/helpers/diccionaris.js';
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/* Costura R32.14 (Carril 1) · DialegDenunciaContingut ↔ denunciesDiligents.
   El port i la configuració es simulen: la prova fixa l'orquestració, no el SQL
   (els 33 casos PostgreSQL 18.6 de Codex cobrixen el servidor). */
const port = vi.hoisted(() => ({
  capacitats: new Set(['moderacio', 'denunciesDiligents']),
  registraDenunciaDiligent: vi.fn(),
  denunciaContingut: vi.fn()
}));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: (nom) => port.capacitats.has(nom),
  registraDenunciaDiligent: (...a) => port.registraDenunciaDiligent(...a),
  denunciaContingut: (...a) => port.denunciaContingut(...a)
}));
vi.mock('../../config/backendConfig.js', () => ({
  normalizeBackendConfig: (config = {}) => ({ dataMode: config.dataMode ?? 'remote' })
}));

const { enviaDenunciaLssi, nouIdOperacioDenuncia } = await import('./enviaDenunciaLssi.js');
const { DialegDenunciaContingut } = await import('./DialegDenunciaContingut.jsx');
const { CLAU_CUA_DENUNCIES_LSSI, lligCuaDenunciesLocals, textosDenunciaContingut } = await import('./i18nDenunciaContingut.js');
const { delVal } = await import('../../config/storage.js');

const PUB = '3f2b8c1e-5d4a-4b6c-9e7f-1a2b3c4d5e6f';
const OP = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
const REMOT = Object.freeze({ dataMode: 'remote' });
const absent = () => Object.assign(new Error('falta registra_denuncia_diligent'), { status: 404, postgrestCode: 'PGRST202' });

beforeEach(() => {
  port.capacitats = new Set(['moderacio', 'denunciesDiligents']);
  port.registraDenunciaDiligent.mockReset();
  port.denunciaContingut.mockReset();
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
  vi.unstubAllGlobals();
});

describe('R32.14 · enviaDenunciaLssi (diligent → moderació → cua local)', () => {
  test('una publicació amb UUID va pel workflow diligent amb motiu del contracte, detall LSSI i UUID d’operació', async () => {
    port.registraDenunciaDiligent.mockResolvedValue({ id: PUB, estat: 'rebuda', versio: 1, repetida: false });
    const r = await enviaDenunciaLssi({ objectiu: { tipus: 'publicacio', id: PUB }, motiu: 'spam', detall: ' Venda falsa ', operacioId: OP, config: REMOT });
    expect(r).toEqual({ servidor: true, repetida: false, via: 'diligent' });
    expect(port.registraDenunciaDiligent).toHaveBeenCalledWith(
      { publicacioId: PUB, motiu: 'spam_frau', detall: '[LSSI-16:spam] Venda falsa', operacioId: OP }, REMOT);
    expect(port.denunciaContingut).not.toHaveBeenCalled();
  });

  test('Llei 0 · sense el SQL diligent a producció (404 PGRST202) cau al port de moderació amb la forma { objecte }', async () => {
    port.registraDenunciaDiligent.mockRejectedValue(absent());
    port.denunciaContingut.mockResolvedValue({ rebuda: true, repetida: true });
    const r = await enviaDenunciaLssi({
      objectiu: { tipus: 'producte', id: PUB, autor: { tipus: 'persona', id: 'p-1' } },
      motiu: 'contingut_illicit', detall: '', operacioId: OP, config: REMOT
    });
    expect(r).toEqual({ servidor: true, repetida: true, via: 'moderacio' });
    expect(port.denunciaContingut).toHaveBeenCalledWith({
      objecte: { tipus: 'producte', id: PUB }, motiu: 'ofensiu', detall: '[LSSI-16:contingut_illicit]',
      autor: { tipus: 'persona', id: 'p-1' }
    }, REMOT);
  });

  test('sense resposta del servidor diligent no fa un segon intent per l’altre port', async () => {
    port.registraDenunciaDiligent.mockRejectedValue(Object.assign(new Error('xarxa'), { status: 0 }));
    const r = await enviaDenunciaLssi({ objectiu: { tipus: 'esdeveniment', id: PUB }, motiu: 'spam', operacioId: OP, config: REMOT });
    expect(r.servidor).toBe(false);
    expect(port.denunciaContingut).not.toHaveBeenCalled();
  });

  test('un perfil, o un id que no és UUID, no entra mai al workflow diligent', async () => {
    port.denunciaContingut.mockResolvedValue({ rebuda: true, repetida: false });
    await enviaDenunciaLssi({ objectiu: { tipus: 'persona', id: PUB, autor: { tipus: 'persona', id: PUB } }, motiu: 'suplantacio', operacioId: OP, config: REMOT });
    await enviaDenunciaLssi({ objectiu: { tipus: 'publicacio', id: 'post-lssi-01' }, motiu: 'spam', operacioId: OP, config: REMOT });
    expect(port.registraDenunciaDiligent).not.toHaveBeenCalled();
    expect(port.denunciaContingut).toHaveBeenCalledTimes(2);
    expect(port.denunciaContingut.mock.calls[0][0].objecte).toEqual({ tipus: 'persona', id: PUB });
  });

  test('mode local de dades, sense xarxa o sense port: mai «servidor»', async () => {
    port.denunciaContingut.mockResolvedValue({ rebuda: true, repetida: false });
    expect((await enviaDenunciaLssi({ objectiu: { tipus: 'publicacio', id: PUB }, motiu: 'spam', operacioId: OP, config: { dataMode: 'seed' } })).servidor).toBe(false);
    vi.stubGlobal('navigator', { onLine: false });
    expect((await enviaDenunciaLssi({ objectiu: { tipus: 'publicacio', id: PUB }, motiu: 'spam', operacioId: OP, config: REMOT })).servidor).toBe(false);
    vi.unstubAllGlobals();
    port.capacitats = new Set();
    expect((await enviaDenunciaLssi({ objectiu: { tipus: 'persona', id: PUB }, motiu: 'spam', operacioId: OP, config: REMOT })).servidor).toBe(false);
    expect(port.registraDenunciaDiligent).not.toHaveBeenCalled();
    expect(port.denunciaContingut).not.toHaveBeenCalled();
  });

  test('el límit es propaga com a error; una moderació no disponible queda a la cua (parcial)', async () => {
    port.denunciaContingut.mockRejectedValueOnce(Object.assign(new Error('límit'), { code: 'limit' }));
    await expect(enviaDenunciaLssi({ objectiu: { tipus: 'entitat', id: PUB }, motiu: 'spam', operacioId: OP, config: REMOT })).rejects.toMatchObject({ code: 'limit' });
    port.denunciaContingut.mockRejectedValueOnce(Object.assign(new Error('no'), { code: 'no-disponible' }));
    expect(await enviaDenunciaLssi({ objectiu: { tipus: 'entitat', id: PUB }, motiu: 'spam', operacioId: OP, config: REMOT }))
      .toMatchObject({ servidor: false });
  });

  test('Gauntlet R32.14 · una publicació del Mur públic va al port de moderació amb murPublic', async () => {
    port.capacitats = new Set(['moderacio']);
    port.denunciaContingut.mockResolvedValue({ rebuda: true, repetida: false });
    await enviaDenunciaLssi({ objectiu: { tipus: 'publicacio', id: PUB, murPublic: true }, motiu: 'spam', operacioId: OP, config: REMOT });
    expect(port.denunciaContingut.mock.calls[0][0]).toMatchObject({ objecte: { tipus: 'publicacio', id: PUB }, murPublic: true });
  });

  test('nouIdOperacioDenuncia torna un UUID v4', () => {
    expect(nouIdOperacioDenuncia()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

describe('R32.14 · el diàleg sense onEnvia (muntatge real de fitxes i perfils)', () => {
  const omple = async (tx, text) => {
    fireEvent.click(screen.getByRole('radio', { name: new RegExp(tx.motius.spam.etiqueta) }));
    fireEvent.change(screen.getByLabelText(/^Fets o context verificable/), { target: { value: text } });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: tx.envia })); });
  };

  test('persistix el UUID abans del primer intent i el reutilitza en el replay del mateix avís', async () => {
    port.registraDenunciaDiligent
      .mockRejectedValueOnce(Object.assign(new Error('xarxa'), { status: 0 }))
      .mockResolvedValueOnce({ id: PUB, estat: 'rebuda', versio: 1, repetida: true });
    const tx = textosDenunciaContingut('ca');
    const objectiu = { tipus: 'publicacio', id: PUB, titol: 'Anunci' };
    const { rerender } = render(<DialegDenunciaContingut obert objectiu={objectiu} idioma="ca" config={REMOT} onTanca={vi.fn()} />);
    await omple(tx, 'Estafa evident');
    expect(document.querySelector('[data-estat-denuncia="partial"]')).not.toBeNull();
    const [primera] = lligCuaDenunciesLocals();
    expect(primera).toMatchObject({ estatSincronitzacio: 'cua-local', recursId: PUB });
    expect(primera.operacioId).toMatch(/^[0-9a-f-]{36}$/);

    rerender(<DialegDenunciaContingut obert={false} objectiu={objectiu} idioma="ca" config={REMOT} onTanca={vi.fn()} />);
    rerender(<DialegDenunciaContingut obert objectiu={objectiu} idioma="ca" config={REMOT} onTanca={vi.fn()} />);
    await omple(tx, 'Estafa evident');
    expect(document.querySelector('[data-estat-denuncia="success"]')).not.toBeNull();
    expect(screen.getByText(tx.exitRepetida)).toBeTruthy();
    const ops = port.registraDenunciaDiligent.mock.calls.map(([entrada]) => entrada.operacioId);
    expect(ops).toEqual([primera.operacioId, primera.operacioId]);
    expect(lligCuaDenunciesLocals()[0]).toMatchObject({ estatSincronitzacio: 'servidor', operacioId: primera.operacioId });
  });

  test('Gauntlet R32.14 · després d’una confirmació, un avís nou amb el mateix text pren un UUID nou i «repetida» només ve del servidor', async () => {
    port.registraDenunciaDiligent
      .mockResolvedValueOnce({ id: PUB, estat: 'rebuda', versio: 1, repetida: false })
      .mockResolvedValueOnce({ id: PUB, estat: 'rebuda', versio: 1, repetida: false });
    const tx = textosDenunciaContingut('ca');
    const objectiu = { tipus: 'publicacio', id: PUB, titol: 'Anunci' };
    const { rerender } = render(<DialegDenunciaContingut obert objectiu={objectiu} idioma="ca" config={REMOT} onTanca={vi.fn()} />);
    await omple(tx, '');
    rerender(<DialegDenunciaContingut obert={false} objectiu={objectiu} idioma="ca" config={REMOT} onTanca={vi.fn()} />);
    rerender(<DialegDenunciaContingut obert objectiu={objectiu} idioma="ca" config={REMOT} onTanca={vi.fn()} />);
    await omple(tx, '');
    const [a, b] = port.registraDenunciaDiligent.mock.calls.map(([entrada]) => entrada.operacioId);
    expect(a).not.toBe(b);
    expect(screen.getByText(tx.exitServidor)).toBeTruthy();
    expect(screen.queryByText(tx.exitRepetida)).toBeNull();
  });

  test('Gauntlet R32.14 · el detall que la persona pot escriure, amb el prefix del motiu, cap sencer als 1.000 dels ports', async () => {
    const { MAXIM_DETALL_DENUNCIA_LSSI, MOTIUS_DENUNCIA_LSSI, detallPerAlPortModeracio } = await import('./i18nDenunciaContingut.js');
    for (const motiu of MOTIUS_DENUNCIA_LSSI) {
      const detall = `${'x'.repeat(MAXIM_DETALL_DENUNCIA_LSSI - 1)}Z`;
      const port = detallPerAlPortModeracio(motiu, detall);
      expect(port.length, motiu).toBeLessThanOrEqual(1000);
      expect(port.endsWith('Z'), motiu).toBe(true);
    }
  });

  test('regressió Gemini R32.13 · el port de moderació rep { objecte: { tipus, id } }, no { tipus, id }', async () => {
    port.denunciaContingut.mockResolvedValue({ rebuda: true, repetida: false });
    const tx = textosDenunciaContingut('ca');
    render(<DialegDenunciaContingut obert objectiu={{ tipus: 'entitat', id: PUB, titol: 'Cooperativa' }} idioma="ca" config={REMOT} onTanca={vi.fn()} />);
    await omple(tx, '');
    expect(port.denunciaContingut.mock.calls[0][0]).toMatchObject({ objecte: { tipus: 'entitat', id: PUB }, motiu: 'spam_frau' });
    expect(document.querySelector('[data-estat-denuncia="success"]')).not.toBeNull();
    expect(screen.getByText(tx.exitServidor)).toBeTruthy();
  });

  test('cap text promet un termini de revisió ni una sincronització que no existix', () => {
    for (const lang of ['ca', 'es', 'en', 'eu', 'gl']) {
      const tx = textosDenunciaContingut(lang);
      for (const clau of ['descripcio', 'exitServidor', 'exitRepetida', 'parcialCuaLocal']) {
        expect(tx[clau]).not.toMatch(/24/);
      }
      expect(tx.parcialCuaLocal).not.toMatch(/sincronitz|sincroniz|sync|sinkroniza/i);
    }
  });
});
