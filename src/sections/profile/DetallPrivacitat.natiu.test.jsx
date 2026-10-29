import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/* Gauntlet 261025_0545 (BOT-04; RGPD art. 20) · «Descarregar les meues
   dades» dins de l'app nativa. El WebView de Capacitor no desa cap enllaç
   blob: amb `download` (iOS el passa a UIApplication.open i el cancel·la;
   Android no té cap DownloadListener): la vista no fa eixe clic ni diu que
   el fitxer és a les descàrregues. Oferix el que sí que funciona, sense cap
   dependència nova: el menú de compartir del sistema amb el fitxer (Web Share,
   si el WebView l'admet per a este fitxer), copiar el text i, sempre, el JSON
   en un quadre de només lectura. A la web, el de sempre, byte a byte.
   Els mateixos dobles que DetallPrivacitat.test.jsx. */
const m = vi.hoisted(() => ({
  caps: new Set(['compte']), navigate: vi.fn(),
  exporta: vi.fn(), estatBaixa: vi.fn(), demana: vi.fn(), cancela: vi.fn(),
  estatConsentiment: vi.fn(), registra: vi.fn(), revoca: vi.fn(), sessio: null,
}));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => m.navigate, Link: ({ to, children }) => <a href={to}>{children}</a> }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSessioOpcional: () => m.sessio }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ title, children }) => <main><header className="page-title"><h1>{title}</h1></header>{children}</main>,
}));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: (cap) => m.caps.has(cap),
  exportaLesMeuesDades: m.exporta, estatBaixa: m.estatBaixa, demanaBaixa: m.demana, cancelaBaixa: m.cancela,
  estatConsentiment: m.estatConsentiment, registraConsentiment: m.registra, revocaConsentiment: m.revoca,
}));
import { DetallPrivacitat, nomFitxerExportacio } from './DetallPrivacitat.jsx';

const config = { tenantId: '00000000-0000-4000-8000-000000000000' };
const jo = { id: 'jo', mena: 'persona', nom: 'Pep', dades: { full_name: 'Pep', email: 'pep@poble.test', is_public: false, town_name: 'La Torre' } };
const DADES = Object.freeze({ format: 'socdepoble.exportacio.v1', perfil: { full_name: 'Pep' }, notes: [{ titol: 'Recepta' }] });
const JSON_DADES = JSON.stringify(DADES, null, 2);
/* L'afirmació falsa de l'informe: «Ja tens el fitxer … a les descàrregues». */
const DESCARREGUES = /Ja tens el fitxer .* a les descàrregues/;

/* El navegador: les APIs que jsdom no porta es posen i es lleven a cada prova. */
const posa = (objecte, nom, valor) => Object.defineProperty(objecte, nom, { value: valor, configurable: true, writable: true });
const lleva = (objecte, nom) => { delete objecte[nom]; };
let clics;

async function demanaLesDades() {
  render(<DetallPrivacitat identitat={jo} config={config} onPerfilCanviat={vi.fn()} onSessioTancada={vi.fn()} />);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Descarregar les meues dades' })); });
  expect(m.exporta).toHaveBeenCalledWith({ ...config, signal: expect.any(AbortSignal) });
}
const quadre = () => screen.queryByRole('textbox', { name: 'Les teues dades, en JSON' });
const botoCompartir = () => screen.queryByRole('button', { name: 'Compartir el fitxer' });
const botoCopiar = () => screen.queryByRole('button', { name: 'Copiar el text' });

beforeEach(() => {
  m.caps = new Set(['compte']);
  for (const f of [m.navigate, m.exporta, m.estatBaixa, m.demana, m.cancela, m.estatConsentiment, m.registra, m.revoca]) f.mockReset();
  m.estatBaixa.mockResolvedValue({ demanada: false, demanadaAl: null, purgaPrevistaAl: null });
  m.exporta.mockResolvedValue(DADES);
  clics = [];
  URL.createObjectURL = vi.fn(() => 'blob:x');
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function clic() { clics.push(this.download); });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  lleva(window, 'Capacitor');
  lleva(navigator, 'share');
  lleva(navigator, 'canShare');
  lleva(navigator, 'clipboard');
});

describe('BOT-04 · dins de l’app nativa', () => {
  beforeEach(() => { posa(window, 'Capacitor', { isNativePlatform: () => true }); });

  test('cap clic de descàrrega, cap enllaç blob: i mai «a les descàrregues»; el JSON, en un quadre de només lectura', async () => {
    await demanaLesDades();
    expect(clics).toEqual([]);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(screen.queryByText(DESCARREGUES)).toBeNull();
    expect(screen.getByText(`Les teues dades ja estan preparades. Dins de l’app no es poden desar soles a les descàrregues: guarda-les tu com a ${nomFitxerExportacio()}.`)).toBeTruthy();
    const text = quadre();
    expect(text.value).toBe(JSON_DADES);
    expect(text.readOnly).toBe(true);
  });

  test('amb Web Share per a fitxers: «Compartir el fitxer» envia el JSON amb el nom del dia, i només llavors diu que s’ha enviat', async () => {
    const share = vi.fn(async () => {});
    const canShare = vi.fn((dades) => Array.isArray(dades?.files) && dades.files.every((f) => f instanceof File));
    posa(navigator, 'share', share);
    posa(navigator, 'canShare', canShare);
    await demanaLesDades();
    expect(share).not.toHaveBeenCalled();
    await act(async () => { fireEvent.click(botoCompartir()); });
    expect(share).toHaveBeenCalledTimes(1);
    const [{ files }] = share.mock.calls[0];
    expect(files).toHaveLength(1);
    expect(files[0].name).toBe(nomFitxerExportacio());
    expect(files[0].type).toBe('application/json');
    expect(await files[0].text()).toBe(JSON_DADES);
    expect(screen.getByText(`Fet: has enviat el fitxer ${nomFitxerExportacio()} des del menú de compartir.`)).toBeTruthy();
    expect(screen.queryByText(DESCARREGUES)).toBeNull();
    expect(clics).toEqual([]);
  });

  test('si la persona tanca el menú de compartir (AbortError), cap avís', async () => {
    posa(navigator, 'share', vi.fn(async () => { throw new DOMException('Cancel·lat', 'AbortError'); }));
    posa(navigator, 'canShare', () => true);
    await demanaLesDades();
    await act(async () => { fireEvent.click(botoCompartir()); });
    expect(screen.queryByText(/Fet: has enviat/)).toBeNull();
    expect(screen.queryByText(/No s’ha pogut compartir/)).toBeNull();
  });

  test('si compartir falla per una altra raó, ho diu i remet al text', async () => {
    posa(navigator, 'share', vi.fn(async () => { throw new DOMException('Sense gest', 'NotAllowedError'); }));
    posa(navigator, 'canShare', () => true);
    await demanaLesDades();
    await act(async () => { fireEvent.click(botoCompartir()); });
    expect(screen.getByText('No s’ha pogut compartir el fitxer. Copia’n el text i desa’l tu.')).toBeTruthy();
    expect(screen.queryByText(/Fet: has enviat/)).toBeNull();
  });

  test('si el WebView no pot compartir este fitxer (canShare fals, o sense Web Share), cap botó de compartir', async () => {
    posa(navigator, 'share', vi.fn());
    posa(navigator, 'canShare', () => false);
    await demanaLesDades();
    expect(botoCompartir()).toBeNull();
    expect(quadre().value).toBe(JSON_DADES);
    cleanup();
    lleva(navigator, 'canShare');
    await demanaLesDades();
    expect(botoCompartir()).toBeNull();
  });

  test('«Copiar el text» porta el JSON al porta-retalls i diu com desar-lo', async () => {
    const writeText = vi.fn(async () => {});
    posa(navigator, 'clipboard', { writeText });
    await demanaLesDades();
    await act(async () => { fireEvent.click(botoCopiar()); });
    expect(writeText).toHaveBeenCalledWith(JSON_DADES);
    expect(screen.getByText(`Text copiat. Enganxa’l en una nota o un correu i desa’l com a ${nomFitxerExportacio()}.`)).toBeTruthy();
  });

  test('si copiar falla, ho diu; sense porta-retalls, cap botó de copiar però el quadre hi és', async () => {
    posa(navigator, 'clipboard', { writeText: vi.fn(async () => { throw new Error('denegat'); }) });
    await demanaLesDades();
    await act(async () => { fireEvent.click(botoCopiar()); });
    expect(screen.getByText('No s’ha pogut copiar el text. Selecciona’l al quadre i copia’l tu.')).toBeTruthy();
    cleanup();
    lleva(navigator, 'clipboard');
    await demanaLesDades();
    expect(botoCopiar()).toBeNull();
    expect(quadre().value).toBe(JSON_DADES);
  });

  test('l’entrada nativa registrada també compta com a app nativa (sense pont de Capacitor)', async () => {
    lleva(window, 'Capacitor');
    vi.resetModules();
    const entrada = await import('../../config/entradaNativa.js');
    entrada.registraEntradaNativa({ plataforma: 'android', proveidors: [], demana: async () => ({}) });
    const { DetallPrivacitat: Vista } = await import('./DetallPrivacitat.jsx');
    render(<Vista identitat={jo} config={config} onPerfilCanviat={vi.fn()} onSessioTancada={vi.fn()} />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Descarregar les meues dades' })); });
    expect(clics).toEqual([]);
    expect(screen.queryByText(DESCARREGUES)).toBeNull();
    expect(quadre().value).toBe(JSON_DADES);
  });
});

describe('BOT-04 · a la web, el de sempre', () => {
  test('descàrrega amb l’enllaç i l’avís de les descàrregues, encara que hi haja Web Share i porta-retalls', async () => {
    posa(navigator, 'share', vi.fn());
    posa(navigator, 'canShare', () => true);
    posa(navigator, 'clipboard', { writeText: vi.fn() });
    await demanaLesDades();
    expect(clics).toEqual([nomFitxerExportacio()]);
    expect(screen.getByText(`Ja tens el fitxer ${nomFitxerExportacio()} a les descàrregues.`)).toBeTruthy();
    expect(quadre()).toBeNull();
    expect(botoCompartir()).toBeNull();
    expect(botoCopiar()).toBeNull();
    expect(navigator.share).not.toHaveBeenCalled();
  });
});
