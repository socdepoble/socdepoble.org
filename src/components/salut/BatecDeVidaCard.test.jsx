import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BATEC_DE_VIDA_ACTIU, CLAU_STORAGE_BATEC, TEXTOS_BATEC_DE_VIDA } from '../../config/batecDeVida.js';
import { STORAGE_PREFIX } from '../../config/storage.js';
import {
  ajustaFiPausaNocturna,
  creaMonitorBatecDeVida,
  esHoraNocturna,
} from '../../services/batecDeVidaMonitor.js';
import BatecDeVidaCard from './BatecDeVidaCard.jsx';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.useRealTimers();
});

const T = (h, m = 0, d = 7) => new Date(2026, 10, d, h, m, 0).getTime();
const magatzem = (inicial) => {
  const m = new Map(Object.entries(inicial || {}));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), mapa: m };
};

describe('IDEA-123 · BatecDeVidaCard + batecDeVidaMonitor (Finestra 6h dia + Pausa nocturna 09:00 + 15 min cortesia + Opt-in estricte + Deduplicació)', () => {
  it('manté BATEC_DE_VIDA_ACTIU = false per defecte i respecta l’opt-in estricte (prémer Estic bé no força actiu=true)', () => {
    expect(BATEC_DE_VIDA_ACTIU).toBe(false);
    for (const lang of ['ca', 'es', 'en', 'eu', 'gl']) {
      expect(TEXTOS_BATEC_DE_VIDA[lang].title.length).toBeGreaterThan(5);
      expect(TEXTOS_BATEC_DE_VIDA[lang].btnImOk.length).toBeGreaterThan(5);
    }

    const onBatecEmes = vi.fn();
    render(
      <BatecDeVidaCard
        idioma="ca"
        personesConfianca={[{ id: 'germa-1', nom: 'Germà' }]}
        onBatecEmes={onBatecEmes}
      />,
    );

    expect(screen.getByText('Opt-in desactivat per defecte')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '💚 Estic bé (Enviar batec ara)' }));
    expect(onBatecEmes).toHaveBeenCalledOnce();
    expect(onBatecEmes.mock.calls[0][0].actiu).toBe(false);
    expect(onBatecEmes.mock.calls[0][0].gpsTracked).toBe(false);
    expect(screen.getByText('Opt-in desactivat per defecte')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Activar Batec de Vida' }));
    expect(screen.getByText('Batec actiu (finestra diürna 6h)')).toBeTruthy();
  });

  it('mostra l’avís amable de cortesia de 15 minuts i es neteja en confirmar', () => {
    render(<BatecDeVidaCard idioma="ca" actiuInicial={true} avisCortesiaInicial={true} />);
    const btn = screen.getByRole('button', { name: '💚 Tot bé? Toca ací per confirmar' });
    expect(btn).toBeTruthy();
    fireEvent.click(btn);
    expect(screen.getByRole('button', { name: '💚 Estic bé (Enviar batec ara)' })).toBeTruthy();
  });

  it('monitoritza 6h d’inactivitat diürna, dispara 15 min de cortesia, cancel·la si hi ha moviment i deduplica l’alerta al germà', () => {
    const iniciDiaMs = new Date(2026, 10, 7, 10, 0, 0).getTime(); // 10:00 AM local
    let rellotgeMs = iniciDiaMs;
    const onAvisCortesia = vi.fn();
    const onCancelCortesia = vi.fn();
    const onAlertaConfianca = vi.fn();

    const monitor = creaMonitorBatecDeVida({
      actiuInicial: true,
      intervalDiaHores: 6,
      minutsGraciaCortesia: 15,
      personesConfianca: [{ id: 'germa-1', nom: 'Germà' }],
      nowFn: () => rellotgeMs,
      onAvisCortesia,
      onCancelCortesia,
      onAlertaConfianca,
    });

    // Als 5h 59m encara no hi ha avís
    rellotgeMs = iniciDiaMs + (5 * 60 + 59) * 60 * 1000;
    monitor.avalua(rellotgeMs);
    expect(onAvisCortesia).not.toHaveBeenCalled();
    expect(onAlertaConfianca).not.toHaveBeenCalled();

    // A les 6h 00m (16:00) salta l'avís de cortesia de 15 minuts
    rellotgeMs = iniciDiaMs + 6 * 3600 * 1000;
    monitor.avalua(rellotgeMs);
    expect(onAvisCortesia).toHaveBeenCalledOnce();
    expect(onAlertaConfianca).not.toHaveBeenCalled();

    // Als 10 minuts de cortesia (16:10) el telèfon es mou -> cancel·la l'alerta!
    rellotgeMs = iniciDiaMs + 6 * 3600 * 1000 + 10 * 60 * 1000;
    monitor.registraActivitat(rellotgeMs);
    expect(onCancelCortesia).toHaveBeenCalledOnce();
    expect(onAlertaConfianca).not.toHaveBeenCalled();

    // Nou cicle des de les 16:10 -> si passen 6h a les 22:10 (horari nocturn!), es posposa fins a les 09:00 de l'endemà!
    const instantNocturn2210 = rellotgeMs + 6 * 3600 * 1000; // 22:10
    expect(esHoraNocturna(instantNocturn2210)).toBe(true);
    const instantEndema0900 = ajustaFiPausaNocturna(instantNocturn2210);
    const dataEndema = new Date(instantEndema0900);
    expect(dataEndema.getHours()).toBe(9);
    expect(dataEndema.getMinutes()).toBe(0);

    // Durant la nit (23:30) no molesta ni dispara cortesia
    rellotgeMs = new Date(2026, 10, 7, 23, 30, 0).getTime();
    monitor.avalua(rellotgeMs);
    expect(onAvisCortesia).toHaveBeenCalledTimes(1);

    // A les 09:00 de l'endemà es dispara la cortesia del segon cicle
    rellotgeMs = instantEndema0900;
    monitor.avalua(rellotgeMs);
    expect(onAvisCortesia).toHaveBeenCalledTimes(2);
    expect(onAlertaConfianca).not.toHaveBeenCalled();

    // A les 09:15 (passats els 15 minuts de gràcia sense moviment) avisa al germà una sola vegada (deduplicat)
    rellotgeMs = instantEndema0900 + 15 * 60 * 1000;
    monitor.avalua(rellotgeMs);
    monitor.avalua(rellotgeMs + 5 * 60 * 1000);
    expect(onAlertaConfianca).toHaveBeenCalledOnce();
    expect(onAlertaConfianca.mock.calls[0][0].destinataris).toEqual([{ id: 'germa-1', nom: 'Germà' }]);
    expect(onAlertaConfianca.mock.calls[0][0].gpsTracked).toBe(false);
  });

  it('els botons porten la varietat canònica i l’estat passa per src/config/storage.js', () => {
    render(<BatecDeVidaCard idioma="ca" actiuInicial={true} />);
    const estic = screen.getByRole('button', { name: '💚 Estic bé (Enviar batec ara)' });
    expect(estic.className).toContain('sdp-boto--primari');
    expect(estic.hasAttribute('variant')).toBe(false);
    expect(screen.getByRole('button', { name: 'Pausar amb 1 toc' }).className).toContain('sdp-boto--fantasma');
    fireEvent.click(estic);
    expect(JSON.parse(window.localStorage.getItem(STORAGE_PREFIX + CLAU_STORAGE_BATEC)).ultimBatecAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(window.localStorage.getItem(CLAU_STORAGE_BATEC)).toBeNull();
  });

  it('mostra l’hora de l’últim batec en hora local, no en UTC', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-07T09:30:00.000Z'));
    const ara = new Date();
    const dos = (n) => String(n).padStart(2, '0');
    const esperat = `${ara.getFullYear()}-${dos(ara.getMonth() + 1)}-${dos(ara.getDate())} ${dos(ara.getHours())}:${dos(ara.getMinutes())}:00`;
    render(<BatecDeVidaCard idioma="ca" storage={magatzem()} />);
    fireEvent.click(screen.getByRole('button', { name: '💚 Estic bé (Enviar batec ara)' }));
    expect(screen.getByText(esperat)).toBeTruthy();
  });

  it('un estat desat estrany (instant numèric o text no data) no fa petar la targeta', () => {
    const ms = Date.UTC(2026, 10, 7, 8, 0, 0);
    const local = new Date(ms);
    const dos = (n) => String(n).padStart(2, '0');
    const esperat = `${local.getFullYear()}-${dos(local.getMonth() + 1)}-${dos(local.getDate())} ${dos(local.getHours())}:${dos(local.getMinutes())}:00`;
    const numeric = magatzem({ [CLAU_STORAGE_BATEC]: JSON.stringify({ actiu: true, ultimBatecAt: ms }) });
    const { unmount } = render(<BatecDeVidaCard idioma="ca" storage={numeric} />);
    expect(screen.getByText(esperat)).toBeTruthy();
    unmount();
    const brossa = magatzem({ [CLAU_STORAGE_BATEC]: JSON.stringify({ actiu: true, ultimBatecAt: { x: 1 } }) });
    render(<BatecDeVidaCard idioma="ca" storage={brossa} />);
    expect(screen.getByText('Encara no s’ha emés cap batec hui')).toBeTruthy();
  });

  it('«Estic bé» no reprén una pausa i el botó de pausa diu «Reprendre» mentre està pausat', () => {
    const st = magatzem({ [CLAU_STORAGE_BATEC]: JSON.stringify({ actiu: true, pausat: true }) });
    render(<BatecDeVidaCard idioma="ca" storage={st} />);
    expect(screen.getByText('Pausat temporalment')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '💚 Estic bé (Enviar batec ara)' }));
    expect(screen.getByText('Pausat temporalment')).toBeTruthy();
    expect(JSON.parse(st.mapa.get(CLAU_STORAGE_BATEC)).pausat).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Reprendre amb 1 toc' }));
    expect(screen.getByText('Batec actiu (finestra diürna 6h)')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Pausar amb 1 toc' })).toBeTruthy();
  });

  it('l’interval i l’hora de despertar desats arriben a tots els textos', () => {
    const st = magatzem({ [CLAU_STORAGE_BATEC]: JSON.stringify({ actiu: true, intervalDiaHores: 4, horaDespertar: '07:00' }) });
    render(<BatecDeVidaCard idioma="ca" storage={st} />);
    expect(screen.getByText('4h · 15 min')).toBeTruthy();
    expect(screen.getByText('☀️ Cada 4 hores de dia')).toBeTruthy();
    expect(screen.getByText('🌙 Pausa nocturna fins a les 07:00')).toBeTruthy();
    expect(screen.getByText('Batec actiu (finestra diürna 4h)')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Batec de Vida · Tranquil·litat Familiar (4h)' })).toBeTruthy();
  });

  it('cap text promet consentiment bilateral; els 5 idiomes tenen les mateixes claus', () => {
    const claus = Object.keys(TEXTOS_BATEC_DE_VIDA.ca).sort();
    for (const lang of ['ca', 'es', 'en', 'eu', 'gl']) {
      expect(Object.keys(TEXTOS_BATEC_DE_VIDA[lang]).sort()).toEqual(claus);
      expect(Object.values(TEXTOS_BATEC_DE_VIDA[lang]).join(' ')).not.toMatch(/bilateral|alde biko/i);
    }
  });

  it('la cortesia de 15 minuts es garantix encara que l’avaluació arribe tard', () => {
    let ara = T(10);
    const onAvisCortesia = vi.fn();
    const onAlertaConfianca = vi.fn();
    const m = creaMonitorBatecDeVida({ actiuInicial: true, nowFn: () => ara, onAvisCortesia, onAlertaConfianca });
    ara = T(17); // primera avaluació 7 h després (app suspesa)
    m.avalua(ara);
    expect(onAvisCortesia).toHaveBeenCalledOnce();
    expect(onAvisCortesia.mock.calls[0][0].deadlineMs).toBe(T(17, 15));
    expect(onAlertaConfianca).not.toHaveBeenCalled();
    m.avalua(T(17, 14));
    expect(onAlertaConfianca).not.toHaveBeenCalled();
    m.avalua(T(17, 15));
    expect(onAlertaConfianca).toHaveBeenCalledOnce();
  });

  it('pausar amb l’avís pendent el cancel·la (onCancelCortesia) i reprendre reinicia el cicle', () => {
    let ara = T(10);
    const onAvisCortesia = vi.fn();
    const onCancelCortesia = vi.fn();
    const onAlertaConfianca = vi.fn();
    const m = creaMonitorBatecDeVida({ actiuInicial: true, nowFn: () => ara, onAvisCortesia, onCancelCortesia, onAlertaConfianca });
    m.avalua(T(16, 1));
    expect(onAvisCortesia).toHaveBeenCalledOnce();
    m.setPausat(true, T(16, 2));
    expect(onCancelCortesia).toHaveBeenCalledOnce();
    expect(m.getEstat().avisCortesiaPendent).toBe(false);
    m.setPausat(false, T(20));
    expect(m.getEstat().ultimMovimentMs).toBe(T(20));
    expect(onAvisCortesia).toHaveBeenCalledOnce();
    expect(onAlertaConfianca).not.toHaveBeenCalled();
  });

  it('una pausa que comença després de mitjanit acaba el mateix dia; una que travessa mitjanit, l’endemà', () => {
    expect(new Date(ajustaFiPausaNocturna(T(5), '09:00', '01:00')).getDate()).toBe(7);
    expect(new Date(ajustaFiPausaNocturna(T(2), '09:00', '00:00')).getDate()).toBe(7);
    const endema = new Date(ajustaFiPausaNocturna(T(23), '09:00', '22:00'));
    expect([endema.getDate(), endema.getHours(), endema.getMinutes()]).toEqual([8, 9, 0]);
    const matinada = new Date(ajustaFiPausaNocturna(T(3), '09:00', '22:00'));
    expect([matinada.getDate(), matinada.getHours()]).toEqual([7, 9]);
  });

  /* R11 Loop 3 · Com diu el README del kit («a partir de les 09:15»): si el termini cau de nit, la
     cortesia torna a comptar 15 minuts sencers des de les 09:00. Abans saltava a les 09:00 en punt
     (de 21:46 a 21:59, només 1–14 minuts de dia per a confirmar). */
  it('S4 · l’alerta mai salta dins la pausa nocturna (22:05) si la cortesia ha començat a les 21:50: es posposa a les 09:15', () => {
    let ara = T(15, 50);
    const onAvisCortesia = vi.fn();
    const onAlertaConfianca = vi.fn();
    const m = creaMonitorBatecDeVida({ actiuInicial: true, nowFn: () => ara, onAvisCortesia, onAlertaConfianca });
    m.avalua(T(21, 50));
    expect(onAvisCortesia).toHaveBeenCalledOnce();
    expect(onAvisCortesia.mock.calls[0][0].deadlineMs).toBe(T(9, 15, 8));
    ara = T(22, 5);
    m.avalua(ara);
    expect(onAlertaConfianca).not.toHaveBeenCalled();
    m.avalua(T(9, 0, 8));
    m.avalua(T(9, 14, 8));
    expect(onAlertaConfianca).not.toHaveBeenCalled();
    m.avalua(T(9, 15, 8));
    expect(onAlertaConfianca).toHaveBeenCalledOnce();
    expect(onAlertaConfianca.mock.calls[0][0].alertedAtMs).toBe(T(9, 15, 8));
    // Control: de dia, la cortesia continua sent de 15 minuts exactes.
    const dia = vi.fn();
    const m2 = creaMonitorBatecDeVida({ actiuInicial: true, nowFn: () => T(12), onAvisCortesia: dia });
    m2.avalua(T(18));
    expect(dia.mock.calls[0][0].deadlineMs).toBe(T(18, 15));
  });

  it('R11 Loop 3 (L2-04) · sense persones de confiança no es pot activar, i la targeta diu que ningú no serà avisat i que només vigila amb la pàgina oberta', () => {
    const onOptInChange = vi.fn();
    render(<BatecDeVidaCard idioma="ca" storage={magatzem()} onOptInChange={onOptInChange} />);
    const ca = TEXTOS_BATEC_DE_VIDA.ca;
    expect(screen.getByTestId('batec-sense-destinataris').textContent).toBe(ca.noTrustedContactsNotice);
    expect(screen.getByTestId('batec-nomes-pagina-oberta').textContent).toBe(ca.foregroundOnlyNotice);
    const activar = screen.getByRole('button', { name: ca.btnToggleActive });
    expect(activar.disabled).toBe(true);
    fireEvent.click(activar);
    expect(onOptInChange).not.toHaveBeenCalled();
    expect(screen.getByText(ca.badgeOff)).toBeTruthy();
  });

  it('R11 Loop 3 (L2-04) · actiu d’abans i sense ningú vinculat: es pot desactivar, i l’alerta diu què passa (no un comptador)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 7, 10, 0, 0));
    const st = magatzem({ [CLAU_STORAGE_BATEC]: JSON.stringify({ actiu: true, iniciFinestraAt: new Date(2026, 10, 7, 10, 0, 0).toISOString() }) });
    render(<BatecDeVidaCard idioma="ca" storage={st} intervalAvaluacioMs={60000} />);
    const ca = TEXTOS_BATEC_DE_VIDA.ca;
    expect(screen.getByRole('button', { name: ca.btnDisableActive }).disabled).toBe(false);
    act(() => { vi.advanceTimersByTime((6 * 60 + 16) * 60 * 1000); });
    const alerta = screen.getByRole('alert').textContent;
    expect(alerta).toContain('Han passat 6 h sense cap batec');
    expect(alerta).toContain(ca.noOneWarned);
    expect(alerta).not.toContain(ca.trustedContactsLabel);
    for (const lang of ['es', 'en', 'eu', 'gl']) {
      expect(TEXTOS_BATEC_DE_VIDA[lang].localAlert).toContain('{hores}');
    }
  });

  it('S5 + S6 · la targeta connecta creaMonitorBatecDeVida amb temporitzador quan està activa i declara l’alerta local amb honestedat', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 7, 10, 0, 0));
    const onAvisCortesia = vi.fn();
    render(
      <BatecDeVidaCard
        idioma="ca"
        actiuInicial={true}
        intervalAvaluacioMs={60000}
        onAvisCortesia={onAvisCortesia}
      />,
    );
    expect(screen.getByText(/alerta local de contacte/)).toBeTruthy();
    vi.advanceTimersByTime(6 * 3600 * 1000 + 60000);
    expect(onAvisCortesia).toHaveBeenCalledOnce();
  });
});
