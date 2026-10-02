/**
 * Bucle adversarial (auditoria Codex 261002_0148, punt 11) · La casella «He
 * revisat el full i l'adjunt» val per als BYTES exactes que s'exporten. El
 * primer cas és el reproductor de Codex, portat tal qual: muta un byte del
 * mateix array i torna a pintar amb el mateix objecte. Dades sintètiques.
 */
import { webcrypto } from 'node:crypto';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import EnviamentGestoria from './EnviamentGestoria.jsx';
import { TIPUS_XLSX } from './correuGestoria.js';
import { copiaAdjunts, empremtaAdjunts } from './revisioAdjunts.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const { subtle } = webcrypto;
const PER = 'gestoria@example.org';
const casella = () => screen.getByRole('checkbox', { name: 'He revisat el full i l\'adjunt abans d\'enviar-lo' });
const boto = (nom) => screen.getByRole('button', { name: nom });
const EML = 'Descarrega l\'esborrany (.eml)';
const GMAIL = 'Obri la redacció de Gmail';
const CANVIAT = /El full ha canviat des que l’has revisat/;
const ajudaDeLaCasella = () => screen.getByText(/^Empremta SHA-256 del que has revisat:|^Este navegador no pot calcular/);

/* L'adjunt de l'.eml en bytes: el base64 de la part que porta el nom del fitxer. */
function bytesAdjuntDeLEml(dades, nom) {
  const eml = new TextDecoder().decode(dades);
  const inici = eml.indexOf(`filename="${nom}"`);
  const cos = eml.slice(eml.indexOf('\r\n\r\n', inici) + 4, eml.indexOf('\r\n--', inici));
  return new Uint8Array(Buffer.from(cos.replace(/\r\n/g, ''), 'base64'));
}

/* L'empremta es mostra en huit grups de huit xifres hexadecimals. */
const EMPREMTA = /^Empremta SHA-256 del que has revisat: (?:[0-9a-f]{8} ){7}[0-9a-f]{8}$/;

async function revisa() {
  fireEvent.click(casella());
  await waitFor(() => expect(ajudaDeLaCasella().textContent).toMatch(EMPREMTA));
}

test('mutar els bytes del mateix adjunt invalida la revisió abans de descarregar', () => {
  const descarrega = vi.fn();
  const adjunts = [{ nom: 'sintetic.xlsx', tipus: 'application/octet-stream', dades: new Uint8Array([1, 2, 3]) }];
  const props = { any: 2026, t: 3, adjunts, descarrega, navegador: {}, inicials: { per: 'gestoria@example.org', nom: 'Prova' } };
  const { rerender } = render(<EnviamentGestoria {...props} />);
  fireEvent.click(screen.getByRole('checkbox'));
  adjunts[0].dades[0] = 9;
  rerender(<EnviamentGestoria {...props} />);
  fireEvent.click(screen.getByRole('button', { name: /Descarrega.*eml/ }));
  expect(descarrega).not.toHaveBeenCalled();
});

test('amb l’empremta ja calculada, mutar un byte del mateix array desmarca la revisió i ho diu; res no ix', async () => {
  const descarrega = vi.fn();
  const obri = vi.fn();
  const adjunts = [{ nom: 'sintetic.xlsx', tipus: TIPUS_XLSX, dades: new Uint8Array([0x50, 0x4b, 3, 4, 5]) }];
  const props = { any: 2026, t: 3, adjunts, descarrega, obri, subtle, navegador: {}, inicials: { per: PER, nom: 'Prova' } };
  const { rerender } = render(<EnviamentGestoria {...props} />);
  await revisa();
  adjunts[0].dades[4] = 6;
  rerender(<EnviamentGestoria {...props} />);
  fireEvent.click(boto(EML));
  fireEvent.click(boto(GMAIL));
  expect(descarrega).not.toHaveBeenCalled();
  expect(obri).not.toHaveBeenCalled();
  expect(casella().checked).toBe(false);
  expect(screen.getByText(CANVIAT)).toBeTruthy();
  expect(document.activeElement).toBe(casella());
  // Tornar a revisar el full nou el dona per bo, i l'.eml porta els bytes nous.
  await revisa();
  fireEvent.click(boto(EML));
  expect(descarrega).toHaveBeenCalledTimes(1);
  expect([...bytesAdjuntDeLEml(descarrega.mock.calls[0][0].dades, 'sintetic.xlsx')]).toEqual([0x50, 0x4b, 3, 4, 6]);
});

test('l’.eml conté exactament els bytes revisats, encara que l’array original canvie després d’exportar', async () => {
  const descarrega = vi.fn();
  const original = Uint8Array.from({ length: 300 }, (_, i) => (i * 37) % 256);
  const adjunts = [{ nom: 'Facturacio_sintetica.xlsx', tipus: TIPUS_XLSX, dades: original }];
  render(<EnviamentGestoria any={2026} t={3} adjunts={adjunts} descarrega={descarrega} subtle={subtle} navegador={{}} inicials={{ per: PER, nom: 'Prova' }} />);
  await revisa();
  fireEvent.click(boto(EML));
  expect(descarrega).toHaveBeenCalledTimes(1);
  const exportats = bytesAdjuntDeLEml(descarrega.mock.calls[0][0].dades, 'Facturacio_sintetica.xlsx');
  expect(Buffer.compare(Buffer.from(exportats), Buffer.from(original))).toBe(0);
  // L'empremta que es mostra és la dels bytes exportats (amb el nom i el tipus, en forma canònica).
  const mostrada = ajudaDeLaCasella().textContent.split(': ')[1].replace(/ /g, '');
  const copia = copiaAdjunts([{ nom: 'Facturacio_sintetica.xlsx', tipus: TIPUS_XLSX, dades: exportats }]);
  expect(mostrada).toBe(await empremtaAdjunts(copia, subtle));
  // El que s'ha exportat és una còpia: mutar l'original no la toca.
  original[0] ^= 0xff;
  expect(exportats[0]).not.toBe(original[0]);
});

test('Gmail descarrega una còpia dels bytes revisats, mai la referència de l’adjunt', async () => {
  const descarrega = vi.fn();
  const adjunts = [{ nom: 'sintetic.xlsx', tipus: TIPUS_XLSX, dades: new Uint8Array([0x50, 0x4b, 7, 8]) }];
  render(<EnviamentGestoria any={2026} t={3} adjunts={adjunts} descarrega={descarrega} obri={vi.fn()} subtle={subtle} navegador={{}} inicials={{ per: PER, nom: 'Prova' }} />);
  await revisa();
  fireEvent.click(boto(GMAIL));
  const [{ nom, tipus, dades }] = descarrega.mock.calls[0];
  expect({ nom, tipus, bytes: [...dades] }).toEqual({ nom: 'sintetic.xlsx', tipus: TIPUS_XLSX, bytes: [0x50, 0x4b, 7, 8] });
  expect(dades).not.toBe(adjunts[0].dades);
  expect(dades.buffer).not.toBe(adjunts[0].dades.buffer);
});

test('canviar el destinatari després de revisar invalida la revisió (T4)', async () => {
  const descarrega = vi.fn();
  const adjunts = [{ nom: 'sintetic.xlsx', tipus: TIPUS_XLSX, dades: new Uint8Array([0x50, 0x4b, 9]) }];
  render(<EnviamentGestoria any={2026} t={3} adjunts={adjunts} descarrega={descarrega} subtle={subtle} navegador={{}} inicials={{ per: PER, nom: 'Prova' }} />);
  await revisa();
  fireEvent.change(screen.getByRole('textbox', { name: /^Destinatari/ }), { target: { value: 'altra-gestoria@example.org' } });
  expect(casella().checked).toBe(false);
  expect(screen.getByText(/Has canviat el destinatari/)).toBeTruthy();
  fireEvent.click(boto(EML));
  expect(descarrega).not.toHaveBeenCalled();
  await revisa();
  fireEvent.click(boto(EML));
  expect(new TextDecoder().decode(descarrega.mock.calls[0][0].dades)).toMatch(/^To: altra-gestoria@example\.org\r\n/);
});

test('mentre es calcula l’empremta no ix res, i ho diu', async () => {
  let acaba;
  const lent = { digest: vi.fn((algorisme, dades) => new Promise((resol) => { acaba = () => resol(subtle.digest(algorisme, dades)); })) };
  const descarrega = vi.fn();
  const adjunts = [{ nom: 'sintetic.xlsx', tipus: TIPUS_XLSX, dades: new Uint8Array([1]) }];
  render(<EnviamentGestoria any={2026} t={3} adjunts={adjunts} descarrega={descarrega} subtle={lent} navegador={{}} inicials={{ per: PER, nom: 'Prova' }} />);
  fireEvent.click(casella());
  expect(casella().checked).toBe(true);
  fireEvent.click(boto(EML));
  expect(descarrega).not.toHaveBeenCalled();
  expect(screen.getByText(/Encara s’està calculant l’empremta/)).toBeTruthy();
  expect(lent.digest).toHaveBeenCalledWith('SHA-256', expect.any(Uint8Array));
  acaba();
  await waitFor(() => expect(ajudaDeLaCasella().textContent).toMatch(EMPREMTA));
  fireEvent.click(boto(EML));
  expect(descarrega).toHaveBeenCalledTimes(1);
});

test('sense crypto.subtle la casella no es pot marcar, i diu per què', () => {
  render(<EnviamentGestoria any={2026} t={3} adjunts={[{ nom: 'sintetic.xlsx', tipus: TIPUS_XLSX, dades: new Uint8Array([1]) }]}
    descarrega={vi.fn()} subtle={null} navegador={{}} inicials={{ per: PER, nom: 'Prova' }} />);
  expect(casella().disabled).toBe(true);
  expect(ajudaDeLaCasella().textContent).toMatch(/connexió segura/);
  expect(casella().getAttribute('aria-describedby')).toContain(ajudaDeLaCasella().id);
});

test('si el càlcul de l’empremta falla, la casella es desmarca i ho diu', async () => {
  const trencat = { digest: vi.fn(() => Promise.reject(new Error('sense motor'))) };
  render(<EnviamentGestoria any={2026} t={3} adjunts={[{ nom: 'sintetic.xlsx', tipus: TIPUS_XLSX, dades: new Uint8Array([1]) }]}
    descarrega={vi.fn()} subtle={trencat} navegador={{}} inicials={{ per: PER, nom: 'Prova' }} />);
  fireEvent.click(casella());
  await waitFor(() => expect(casella().checked).toBe(false));
  expect(screen.getByText(/No s’ha pogut calcular l’empremta/)).toBeTruthy();
});
