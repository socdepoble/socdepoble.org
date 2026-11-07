import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { calculaBackoffBateriaMinuts, CLAU_STORAGE_EMERGENCIES, TEXTOS_EMERGENCIES_OFFLINE } from '../../config/batecDeVida.js';
import { STORAGE_PREFIX } from '../../config/storage.js';
import {
  MARGE_SILENCI_QR_VEINAL,
  MIDA_MATRIU_QR_VEINAL,
  codificaMatriuQrVeinal,
  decodificaMatriuQrVeinal,
} from '../../utils/qrDibuix.js';
import { lligQrIndependent } from '../../../tests/helpers/lectorQrIndependent.js';
import ProtocolEmergenciesOfflineCard from './ProtocolEmergenciesOfflineCard.jsx';

/* Refugis de prova amb la forma de la configuració del poble (tenant): font i data. */
const REFUGIS_PROVA = [
  {
    id: 'refugi-prova',
    nom: { ca: 'Refugi de prova', en: 'Test shelter' },
    ubicacio: { ca: 'Carrer de prova, 1', en: 'Test street, 1' },
    telefon: '900000000',
    font: 'Ban municipal de prova',
    dataFont: '2026-11-07',
  },
  { id: 'refugi-sense-font', nom: 'Refugi sense font', ubicacio: 'Plaça de prova', telefon: '900000001' },
];

/** Els mòduls foscos, recuperats NOMÉS del SVG pintat (paper + un sol camí de tinta). */
function matriuDelSvg(svg) {
  const [x0, y0, costat, costat2] = svg.getAttribute('viewBox').split(/\s+/).map(Number);
  expect([x0, y0, costat2]).toEqual([0, 0, costat]);
  const paper = svg.querySelector('rect.sdp-admin-qr__paper');
  expect([paper.getAttribute('width'), paper.getAttribute('height')]).toEqual([String(costat), String(costat)]);
  expect(svg.querySelectorAll('path').length).toBe(1);
  const d = svg.querySelector('path.sdp-admin-qr__tinta').getAttribute('d');
  const llenc = Array.from({ length: costat }, () => Array(costat).fill(0));
  for (const m of d.matchAll(/M(\d+) (\d+)h(\d+)v1h-(\d+)z/g)) {
    const [x, y, ample] = m.slice(1).map(Number);
    for (let i = 0; i < ample; i += 1) llenc[y][x + i] = 1;
  }
  const marge = MARGE_SILENCI_QR_VEINAL;
  for (let y = 0; y < costat; y += 1) {
    for (let x = 0; x < costat; x += 1) {
      if (x < marge || y < marge || x >= costat - marge || y >= costat - marge) expect(llenc[y][x]).toBe(0);
    }
  }
  return llenc.slice(marge, -marge).map((fila) => fila.slice(marge, -marge));
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe('IDEA-124 · ProtocolEmergenciesOfflineCard (DANA / Apagada + Persistència verificada + QR SVG decodificable)', () => {
  it('calcula backoff exponencial estricte amb sostre de 60 minuts i té els 5 idiomes complets', () => {
    expect(calculaBackoffBateriaMinuts(0)).toBe(1);
    expect(calculaBackoffBateriaMinuts(3)).toBe(8);
    expect(calculaBackoffBateriaMinuts(99)).toBe(60);
    for (const lang of ['ca', 'es', 'en', 'eu', 'gl']) {
      expect(TEXTOS_EMERGENCIES_OFFLINE[lang].title.length).toBeGreaterThan(5);
      expect(TEXTOS_EMERGENCIES_OFFLINE[lang].btnQueueOkOffline.length).toBeGreaterThan(5);
    }
  });

  it('codifica i decodifica de forma determinista la matriu QR ISO/IEC 18004 Level M 29x29 llegible pel lector independent', () => {
    const codi = 'SDP-OK-202611070730';
    const matriu = codificaMatriuQrVeinal(codi);
    expect(matriu.length).toBe(MIDA_MATRIU_QR_VEINAL);
    expect(matriu[0].length).toBe(MIDA_MATRIU_QR_VEINAL);

    const decodificat = decodificaMatriuQrVeinal(matriu);
    expect(decodificat.valid).toBe(true);
    expect(decodificat.text).toBe(codi);

    const independent = lligQrIndependent(matriu.map((f) => f.map((b) => b === 1)));
    expect(independent.text).toBe(codi);
    expect(independent.versio).toBe(3);

    // Si es corromp un Finder Pattern, el descodificador ho detecta
    const corrupta = matriu.map((f) => [...f]);
    corrupta[0][0] = 0;
    expect(decodificaMatriuQrVeinal(corrupta).valid).toBe(false);
  });

  it('mostra els refugis del poble, valida la persistència abans de confirmar i pinta el codi en un SVG de paper i tinta', () => {
    const onEstatEncuat = vi.fn();
    render(<ProtocolEmergenciesOfflineCard idioma="ca" refugis={REFUGIS_PROVA} onEstatEncuat={onEstatEncuat} />);

    expect(screen.getByText('Refugi de prova (900000000)')).toBeTruthy();
    expect(screen.getByText(/Font: Ban municipal de prova · 2026-11-07/)).toBeTruthy();
    // Sense font, el telèfon no s'atribuïx al lloc.
    expect(screen.getByText('Refugi sense font')).toBeTruthy();
    expect(screen.queryByText(/900000001/)).toBeNull();
    expect(screen.queryByText(/Backoff/)).toBeNull();

    const mostra = screen.getByRole('button', { name: '📱 Mostrar Codi Veïnal d’Estat (Sense Internet)' });
    expect(mostra.disabled).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: '💚 Desar «Estic bé» en este mòbil' }));
    expect(onEstatEncuat).toHaveBeenCalledOnce();
    expect(onEstatEncuat.mock.calls[0][0].dadesMediquesEnClar).toBe(false);
    expect(onEstatEncuat.mock.calls[0][0]).not.toHaveProperty('prioritat');
    expect(onEstatEncuat.mock.calls[0][0]).not.toHaveProperty('backoffMinuts');
    expect(screen.getByRole('status').textContent).toContain('Estat «Estic bé» desat en este mòbil.');

    // Passa per la capa única src/config/storage.js (amb el seu prefix), no per una clau crua.
    expect(JSON.parse(window.localStorage.getItem(STORAGE_PREFIX + CLAU_STORAGE_EMERGENCIES)).codiVeinal)
      .toBe(onEstatEncuat.mock.calls[0][0].codiVeinal);
    expect(window.localStorage.getItem(CLAU_STORAGE_EMERGENCIES)).toBeNull();

    expect(mostra.disabled).toBe(false);
    fireEvent.click(mostra);
    expect(screen.getByTestId('codi-qr-veinal')).toBeTruthy();
    const svg = screen.getByTestId('codi-qr-veinal-svg');
    expect(svg.tagName.toLowerCase()).toBe('svg');
    expect(svg.getAttribute('viewBox')).toBe(`0 0 ${MIDA_MATRIU_QR_VEINAL + 2 * MARGE_SILENCI_QR_VEINAL} ${MIDA_MATRIU_QR_VEINAL + 2 * MARGE_SILENCI_QR_VEINAL}`);
    expect(svg.querySelector('[fill]')).toBeNull();
    const matriuExtraida = matriuDelSvg(svg);
    const decodificat = decodificaMatriuQrVeinal(matriuExtraida);
    expect(decodificat.valid).toBe(true);
    expect(decodificat.text).toBe(onEstatEncuat.mock.calls[0][0].codiVeinal);
    expect(lligQrIndependent(matriuExtraida.map((f) => f.map((b) => b === 1))).text).toBe(
      onEstatEncuat.mock.calls[0][0].codiVeinal,
    );
  });

  it('forma el codi «Estic bé» amb l’hora local del mòbil i no en UTC', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-07T09:30:00.000Z'));
    const ara = new Date();
    const dos = (n) => String(n).padStart(2, '0');
    const codiEsperat = `SDP-OK-${ara.getFullYear()}${dos(ara.getMonth() + 1)}${dos(ara.getDate())}${dos(ara.getHours())}${dos(ara.getMinutes())}`;
    const onEstatEncuat = vi.fn();
    render(<ProtocolEmergenciesOfflineCard idioma="ca" onEstatEncuat={onEstatEncuat} />);
    fireEvent.click(screen.getByRole('button', { name: '💚 Desar «Estic bé» en este mòbil' }));
    expect(onEstatEncuat.mock.calls[0][0].codiVeinal).toBe(codiEsperat);
    vi.useRealTimers();
  });

  it('NO confirma encuat si l’storage falla (QuotaExceededError) i mostra alerta + QR directe de socors', () => {
    const storageRebutjat = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    const onEstatEncuat = vi.fn();
    const onErrorPersistencia = vi.fn();

    render(
      <ProtocolEmergenciesOfflineCard
        idioma="ca"
        storage={storageRebutjat}
        onEstatEncuat={onEstatEncuat}
        onErrorPersistencia={onErrorPersistencia}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '💚 Desar «Estic bé» en este mòbil' }));
    expect(onEstatEncuat).not.toHaveBeenCalled();
    expect(onErrorPersistencia).toHaveBeenCalledOnce();
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByRole('alert').textContent).toContain('Error de persistència local');
    expect(screen.getByTestId('codi-qr-veinal-svg')).toBeTruthy();
  });

  it('sense refugis publicats no n’inventa cap: estat buit amb el 112, i els noms es traduïxen', () => {
    const { unmount } = render(<ProtocolEmergenciesOfflineCard idioma="ca" />);
    expect(screen.getByTestId('refugis-buit').textContent).toBe('L’Ajuntament encara no ha publicat cap refugi. En cas d’emergència, truca al 112.');
    expect(screen.queryByText(/Casa de la Cultura|Pavelló|Generador|VHF|061/)).toBeNull();
    expect(screen.queryByText(/100%|pre-cache/)).toBeNull();
    unmount();

    render(<ProtocolEmergenciesOfflineCard idioma="en" refugis={REFUGIS_PROVA} />);
    expect(screen.getByText('Test shelter (900000000)')).toBeTruthy();
    expect(screen.getByText(/Test street, 1 · Source: Ban municipal de prova/)).toBeTruthy();
    expect(screen.getByRole('button', { name: '💚 Save “I am OK” on this phone' }).className).toContain('sdp-boto--primari');
  });

  it('el paper i la tinta del codi són tokens que cap tema no redefinix (no s’inverteix en fosc)', () => {
    const css = readdirSync(path.join(process.cwd(), 'src/css'))
      .filter((f) => f.endsWith('.css'))
      .map((f) => readFileSync(path.join(process.cwd(), 'src/css', f), 'utf8'))
      .join('\n');
    expect(css).toMatch(/\.sdp-admin-qr__paper \{ fill: var\(--sdp-sobre-roca\); \}/);
    expect(css).toMatch(/\.sdp-admin-qr__tinta \{ fill: var\(--sdp-fons-roca\); \}/);
    expect(css.match(/--sdp-sobre-roca\s*:/g)).toHaveLength(1);
    expect(css.match(/--sdp-fons-roca\s*:/g)).toHaveLength(1);
  });

  it('cap text promet sincronització, cua, backoff ni disponibilitat 100 % sense Internet, en cap idioma', () => {
    const claus = Object.keys(TEXTOS_EMERGENCIES_OFFLINE.ca).sort();
    for (const lang of ['ca', 'es', 'en', 'eu', 'gl']) {
      const t = TEXTOS_EMERGENCIES_OFFLINE[lang];
      expect(Object.keys(t).sort()).toEqual(claus);
      const tot = Object.values(t).join(' ');
      expect(tot).not.toMatch(/backoff|100\s?%|pre-cache|sincroni|encua|encola|queue|ilobiratu|ràdio|radio|irrati/i);
    }
    // L2-04 · el basc conserva «ni travesses barrancs» i «o veí» (no verificat per cap parlant nadiu).
    expect(TEXTOS_EMERGENCIES_OFFLINE.eu.elderStep1).toContain('ez zeharkatu errekak edo sakanak');
    expect(TEXTOS_EMERGENCIES_OFFLINE.eu.elderStep3).toContain('edo bizilagunari');
  });
});
