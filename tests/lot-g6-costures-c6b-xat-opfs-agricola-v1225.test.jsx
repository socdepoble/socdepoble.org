import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../src/app/contexts/RouterContext.jsx';
import { AppGridContext } from '../src/components/layout/AppGridShell.jsx';
import { CosCopiaSeguretatXat, MOTOR_COPIA, restauraCopiaLocal } from '../src/sections/xat/components/PaginaCopiaSeguretatXat.jsx';
import { exportaCopiaSeguretatXat } from '../src/data/xat/copiaSeguretatPortatil.js';
import { textDErrorAdjunt } from '../src/sections/xat/adjuntLocal.js';
import BarraCercaConversa from '../src/sections/xat/components/BarraCercaConversa.jsx';
import Bombolla from '../src/sections/xat/components/Bombolla.jsx';
import Conversa from '../src/sections/xat/components/Conversa.jsx';
import { GestorMultimediaLocal } from '../src/sections/multimedia/GestorMultimediaLocal.jsx';
import CalendariAgricolaLlavorsView from '../src/sections/patrimoni/CalendariAgricolaLlavorsView.jsx';
import { creaIdbFals } from '../src/utils/__fixtures__/navegadorFals.js';

const t = (_clau, reserva) => reserva;

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Lot G6 · Costures C1+C6↔G1, C2+C6a↔G2, XAT-B01/B03 i ML-15', () => {
  test('P1 Restauració G1 · rebutja explícitament sense IndexedDB i en QuotaExceededError', async () => {
    const abast = { tenantId: 'poble-1', usuariId: 'u-1' };
    await expect(
      restauraCopiaLocal({ fils: [{ id: 'f1' }], missatges: [{ id: 'm1', text: 'Hola' }] }, { abast, indexedDB: null })
    ).rejects.toMatchObject({ codi: 'RESTAURACIO_SENSE_IDB' });

    const idbQuota = {
      open() {
        const req = {};
        queueMicrotask(() => {
          req.error = Object.assign(new Error('Quota plena'), { name: 'QuotaExceededError' });
          req.onerror?.();
        });
        return req;
      },
    };
    await expect(
      restauraCopiaLocal({ fils: [{ id: 'f1' }], missatges: [{ id: 'm1', text: 'Hola' }] }, { abast, indexedDB: idbQuota })
    ).rejects.toMatchObject({ codi: 'RESTAURACIO_QUOTA' });
  });

  test('P1 Restauració G1 · aplica edicions i làpides (tombstones) sense resurrecció en IndexedDB real', async () => {
    const { idb } = creaIdbFals();
    const abast = { tenantId: 'poble-1', usuariId: 'u-1' };

    const r1 = await restauraCopiaLocal({
      fils: [{ id: 'f1', name: 'Plaça' }],
      missatges: [
        { id: 'm1', text: 'Original', creatAl: '2026-11-24T10:00:00.000Z' },
        { id: 'm2', text: 'Per esborrar', creatAl: '2026-11-24T10:01:00.000Z' },
      ],
    }, { abast, indexedDB: idb });
    expect(r1).toMatchObject({ filsNous: 1, missatgesNous: 2, durable: true });

    // Segona importació: edita m1 i posa làpida (tombstone) a m2
    const r2 = await restauraCopiaLocal({
      fils: [{ id: 'f1', name: 'Plaça' }],
      missatges: [
        { id: 'm1', text: 'Editat', creatAl: '2026-11-24T10:00:00.000Z', editatAl: '2026-11-24T10:05:00.000Z' },
        { id: 'm2', text: '', esborrat: true, esborratAl: '2026-11-24T10:06:00.000Z' },
      ],
    }, { abast, indexedDB: idb });
    expect(r2).toMatchObject({ missatgesNous: 0, missatgesActualitzats: 2, durable: true });

    // Tercera importació antiga: m2 NO pot ressuscitar mai
    const r3 = await restauraCopiaLocal({
      fils: [{ id: 'f1', name: 'Plaça' }],
      missatges: [
        { id: 'm2', text: 'Ressuscitat?', creatAl: '2026-11-24T10:01:00.000Z' },
      ],
    }, { abast, indexedDB: idb });
    expect(r3).toMatchObject({ missatgesNous: 0, missatgesActualitzats: 0, duplicatsOmesos: 2 });
  });

  test('Documents C1+G1 · textDErrorAdjunt traduïx document-format, document-mida i document-contingut en 5 llengües', () => {
    for (const lang of ['ca', 'es', 'en', 'eu', 'gl']) {
      expect(textDErrorAdjunt({ code: 'document-format' }, t, '', lang)).toMatch(/PDF/i);
      expect(textDErrorAdjunt({ code: 'document-mida' }, t, '', lang)).toMatch(/10 MB/i);
      expect(textDErrorAdjunt({ code: 'document-contingut' }, t, '', lang).length).toBeGreaterThan(10);
    }
  });

  test('Cerca C1+G1 · BarraCercaConversa notifica consulta fora del render i accepta resultatsExterns', () => {
    const onCanviaConsulta = vi.fn();
    const onVesAlMissatge = vi.fn();
    render(
      <BarraCercaConversa
        id="cerca-1"
        missatges={[]}
        onCanviaConsulta={onCanviaConsulta}
        resultatsExterns={[{ id: 'm-antic-1' }]}
        onVesAlMissatge={onVesAlMissatge}
        idioma="ca"
      />
    );
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'festa' } });
    expect(onCanviaConsulta).toHaveBeenCalledWith('festa');
    expect(onVesAlMissatge).toHaveBeenCalledWith('m-antic-1', { enfoca: false });
  });

  /* K-G6-PENDENT (integració v1.2.25) · La bombolla rep onCancelaEnviament (XatContext.cancelaEnviament
     per XatSection i Conversa): el rètol «Cancel·la l’enviament» ara també crida la cancel·lació, i no
     onElimina (el diàleg d'eliminar). Abans la prova només mirava el rètol, i el clic obria el diàleg. */
  test('XAT-B01 · Bombolla pendent oferix «Cancel·la l’enviament» en 5 llengües en lloc d’«Elimina»', () => {
    const missatge = { id: 'm-pend', sender: 'me', text: 'Sense xarxa', estatEnviament: 'pendent' };
    const onElimina = vi.fn();
    const onCancelaEnviament = vi.fn();
    render(
      <MemoryRouter>
        <ol className="sdp-xat-missatges">
          <Bombolla
            missatge={missatge}
            onElimina={onElimina}
            onCancelaEnviament={onCancelaEnviament}
            locale="es-ES"
            t={t}
          />
        </ol>
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Opcions del missatge' }));
    expect(screen.queryByRole('menuitem', { name: 'Elimina' })).toBeNull();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Cancelar envío' }));
    expect(onCancelaEnviament).toHaveBeenCalledTimes(1);
    expect(onCancelaEnviament.mock.calls[0][0]).toBe(missatge);
    expect(onElimina).not.toHaveBeenCalled();
  });

  test('XAT-B03 · Conversa sense onNouGrupReenvia NO mostra botó fals «Nou grup» al diàleg «Reenvia a…»', () => {
    render(
      <MemoryRouter>
        <AppGridContext.Provider value={{ mida: 'ample' }}>
          <Conversa
            fil={{ id: 'f1', tipus: 'grup', name: 'Plaça', potEscriure: true }}
            messages={[{ id: 'm1', seq: 1, sender: 'other', author: 'Anna', text: 'Text privat secret', estatEnviament: 'enviat' }]}
            onSendMessage={vi.fn()}
            onReenviaMissatge={vi.fn()}
            locale="ca-ES"
            t={t}
          />
        </AppGridContext.Provider>
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reenvia' }));
    const dialeg = screen.getByRole('dialog', { name: 'Reenvia a…' });
    expect(within(dialeg).queryByRole('button', { name: 'Nou grup' })).toBeNull();
  });

  /* D-REENVIA, opció (b) (integració v1.2.25, Guàrdia #7 de MarIA, Pla 261125_0321 §6) · XAT-B03 tancat:
     sense el motor (cap onReenviaMissatge), triar una altra conversa al diàleg «Reenvia a…» hi porta i prou.
     Cap ruta no porta el text del missatge (ni ?context= ni cap altre paràmetre), i «Nou grup» no s'oferix.
     Al fil actual, el text s'envia com abans (onSendMessage). Amb l'opció (a), la ruta duia ?context=. */
  const reenviaSenseMotor = () => {
    const rutes = [];
    const onSendMessage = vi.fn();
    const fil = { id: 'f1', tipus: 'grup', name: 'Plaça', potEscriure: true };
    const altre = { id: 'f 2', tipus: 'grup', name: 'Comissió de festes', potEscriure: true };
    render(
      <MemoryRouter rutaInicial="/xat/f1" onCanvi={(ruta) => rutes.push(ruta)}>
        <AppGridContext.Provider value={{ mida: 'ample' }}>
          <Conversa
            fil={fil}
            canals={[fil, altre]}
            messages={[{ id: 'm1', seq: 1, sender: 'other', author: 'Anna', text: 'Text privat secret', estatEnviament: 'enviat' }]}
            onSendMessage={onSendMessage}
            locale="ca-ES"
            t={t}
          />
        </AppGridContext.Provider>
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reenvia' }));
    const dialeg = screen.getByRole('dialog', { name: 'Reenvia a…' });
    expect(within(dialeg).queryByRole('button', { name: 'Nou grup' })).toBeNull();
    return { rutes, onSendMessage, dialeg };
  };

  test('XAT-B03 · D-REENVIA (b) · sense motor, reenviar a una altra conversa no posa el text a la URL', () => {
    const { rutes, onSendMessage, dialeg } = reenviaSenseMotor();
    expect(rutes).toEqual(['/xat/f1']);
    fireEvent.click(within(dialeg).getByRole('button', { name: /Comissió de festes/ }));
    expect(rutes).toEqual(['/xat/f1', '/xat/f%202']);
    expect(decodeURIComponent(rutes.join('\n'))).not.toMatch(/context|Text privat secret|\?/);
    expect(onSendMessage).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog', { name: 'Reenvia a…' })).toBeNull();
  });

  test('XAT-B03 · D-REENVIA (b) · sense motor, al fil actual el text s’envia i no es navega', () => {
    const { rutes, onSendMessage, dialeg } = reenviaSenseMotor();
    fireEvent.click(within(dialeg).getByRole('button', { name: /Plaça/ }));
    expect(onSendMessage).toHaveBeenCalledTimes(1);
    expect(onSendMessage.mock.calls[0][0]).toMatchObject({ id: 'f1' });
    expect(onSendMessage.mock.calls[0][1]).toBe('Text privat secret');
    expect(rutes).toEqual(['/xat/f1']);
  });

  test('C2+C6a+G2 · Multimèdia respecta façana amb font.handle===null, potEscriure:false i volum.oblida()', async () => {
    const oblidaVolum = vi.fn();
    const importaFitxers = vi.fn().mockResolvedValue({ importats: ['foto.jpg'], tipus: 'opfs' });
    const fontC6a = Object.freeze({
      nom: 'Còpia privada',
      handle: null,
      potEscriure: false,
      llista: vi.fn().mockResolvedValue([]),
      fitxer: vi.fn(),
      escriu: vi.fn(),
    });
    const creaVolumOpfs = vi.fn().mockResolvedValue({
      font: fontC6a,
      tipus: 'opfs',
      privatDelNavegador: true,
      importaFitxers,
      oblida: oblidaVolum,
    });
    const { unmount } = render(<GestorMultimediaLocal creaVolumOpfs={creaVolumOpfs} entorn={{ navigator: {} }} />);
    const input = screen.getByTestId('input-fitxers-ipad-multimedia-local');
    const foto = new File(['abc'], 'foto.jpg', { type: 'image/jpeg' });
    await act(async () => {
      fireEvent.change(input, { target: { files: [foto] } });
    });
    await waitFor(() => expect(importaFitxers).toHaveBeenCalledTimes(1));
    // Re-importar NO torna a crear volum encara que font.handle === null (contracte C6a)
    await act(async () => {
      fireEvent.change(input, { target: { files: [foto] } });
    });
    expect(creaVolumOpfs).toHaveBeenCalledTimes(1);
    unmount();
    expect(oblidaVolum).toHaveBeenCalled();
  });

  test('C2+G2 · CalendariAgricola espera ACK de onCanviSubscripcio i revertix en rebuig', async () => {
    const onCanvi = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ ok: true });
    render(<CalendariAgricolaLlavorsView onCanviSubscripcio={onCanvi} />);
    const boto = screen.getByRole('button', { name: 'Activa recordatori local' });

    await act(async () => { fireEvent.click(boto); });
    expect(boto.getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByText(/No s’ha pogut actualitzar/i)).toBeTruthy();

    await act(async () => { fireEvent.click(boto); });
    expect(onCanvi).toHaveBeenLastCalledWith(expect.objectContaining({ actiu: true, activa: true }));
    expect(boto.getAttribute('aria-pressed')).toBe('true');
  });

  test('C6b Restauració · amb error commitConfirmat:true neteja confirmació i informa sense rollback fals', async () => {
    const abast = { usuariId: '0b6a1f5e-6a2c-4f3e-9d1a-2b3c4d5e6f70', tenantId: '2d8c3b70-8c4e-4b50-9f3c-4d5e6f708192' };
    const clau = 'clau-commit-confirmat-2026';
    const copia = await exportaCopiaSeguretatXat({
      ...abast,
      fils: [{ id: '3e9d4c81-9d5f-4c61-8a4d-5e6f708192a3', tipus: 'directe', titol: 'Rosa' }],
      missatges: [{ id: '5a0b6ea3-0b71-4e83-8c6f-708192a3b4c5', filId: '3e9d4c81-9d5f-4c61-8a4d-5e6f708192a3', seq: 1, usuariId: abast.usuariId, text: 'Hola', creatAl: '2026-11-10T08:00:00.000Z' }],
      contrasenya: clau,
    });
    const bytes = new TextEncoder().encode(copia);
    const arxiu = { name: 'copia.sdpbackup', size: bytes.length, arrayBuffer: async () => bytes.buffer.slice(0) };
    const motor = {
      ...MOTOR_COPIA,
      restaura: vi.fn().mockRejectedValue(Object.assign(new Error('Sessió revocada post-commit'), { commitConfirmat: true, rebut: { id: 'r1' } })),
    };

    render(<CosCopiaSeguretatXat accio="restaura" abast={abast} idioma="ca" locale="ca-ES" motor={motor} />);
    fireEvent.change(screen.getByLabelText('Arxiu de la còpia'), { target: { files: [arxiu] } });
    await screen.findByText('Arxiu triat: copia.sdpbackup', {}, { timeout: 10000 });
    fireEvent.change(screen.getByLabelText('Contrasenya de la còpia'), { target: { value: clau } });
    fireEvent.click(screen.getByRole('button', { name: 'Revisa la còpia' }));
    const botoConfirma = await screen.findByRole('button', { name: 'Restaura en este aparell' }, { timeout: 10000 });
    fireEvent.click(botoConfirma);
    expect(await screen.findByText(/ja s’havia confirmat en este aparell/i, {}, { timeout: 10000 })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Restaura en este aparell' })).toBeNull();
  });
});
