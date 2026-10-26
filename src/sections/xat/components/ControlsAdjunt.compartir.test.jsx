/* 261026 (prompt 261026_1615, tasca 2) · Una imatge del menú «Compartir» del
   dispositiu, triada per a esta conversa a «Envia a…», entra al compositor com
   si l'haguera triat la persona: la miniatura, el peu amb el text compartit i
   «Envia el fitxer». Res no s'envia tot sol. El registre és el de veres
   (config/compartirNatiu.js); preparaAdjunt i el port, de mentides, com a
   ControlsAdjunt.test.jsx. */
import { StrictMode } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import ControlsAdjunt from './ControlsAdjunt.jsx';
import { compartitPendent, descartaCompartit, lliuraCompartit, registraAlliberadorCompartit, triaDestiCompartit } from '../../../config/compartirNatiu.js';
import { MISSATGE_QUOTA_XAT } from '../../../data/xatMultimedia.js';

const m = vi.hoisted(() => ({ preparaAdjunt: vi.fn(), gravaVeu: vi.fn() }));
vi.mock('../adjuntLocal.js', async (importOriginal) => ({ ...(await importOriginal()), preparaAdjunt: m.preparaAdjunt, gravaVeu: m.gravaVeu, mimeDeGravacio: () => 'audio/mp4' }));
vi.mock('../../../data/backendPort.js', () => ({ quotaXat: vi.fn(), teCapacitat: () => true, urlAdjuntXat: vi.fn(), descartaAdjuntXat: vi.fn() }));

const t = (_, alternativa) => alternativa;
const fil = { id: 'fil-A' };
const deferred = () => { let resolve, reject; const promise = new Promise((r, j) => { resolve = r; reject = j; }); return { promise, resolve, reject }; };
const PEU = 'Text del fitxer (opcional)';
/* Els fitxers que arriben del dispositiu i l'adjunt preparat de cadascun. */
const captura = new Blob(['captura'], { type: 'image/png' });
const segona = new Blob(['segona'], { type: 'image/jpeg' });
const preparatDe = (fitxer) => ({ id: fitxer === segona ? 'id-segona' : 'id-captura', tipus: 'imatge', fitxer: new Blob(['webp'], { type: 'image/webp' }) });

/* Gauntlet 261026_1615 (Codex C1615-02/03 / Gemini G1615-04) · El pont natiu
   diu com s'allibera la seua còpia de cada fitxer: ací, una espia que apunta
   les rutes. */
const allibera = vi.fn();

// ADV-MEDIA-4 · La quota desada és per port: cada prova en porta un de nou.
let servei;
beforeEach(() => {
  vi.clearAllMocks();
  descartaCompartit();
  registraAlliberadorCompartit(allibera);
  servei = { teCapacitat: () => true, quotaXat: vi.fn().mockResolvedValue({ usats: 0, limit: 20_000_000 }) };
  m.preparaAdjunt.mockImplementation(async (fitxer) => preparatDe(fitxer));
  vi.stubGlobal('URL', { createObjectURL: vi.fn().mockReturnValue('blob:compartit'), revokeObjectURL: vi.fn() });
  for (const metode of ['pause', 'load']) vi.spyOn(HTMLMediaElement.prototype, metode).mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
});
afterEach(() => { cleanup(); descartaCompartit(); registraAlliberadorCompartit(null); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

/* La persona ja ha triat esta conversa a «Envia a…». */
const compartitPer = (filId, dades) => { lliuraCompartit(dades); triaDestiCompartit(filId); };
const pinta = (envia = vi.fn().mockResolvedValue([{ id: 'm' }]), extra = {}) => {
  render(<ControlsAdjunt usuariId="A" fil={fil} servei={servei} onEnvia={envia} t={t} {...extra} />);
  return envia;
};
const peu = () => screen.getByRole('textbox', { name: PEU });
const selector = () => screen.getByLabelText('Tria una foto o un vídeo de fins a 10 segons');

test('amb la quota llegida, la imatge compartida es prepara amb el text de peu i no s’envia sola', async () => {
  const quota = deferred();
  servei.quotaXat.mockReturnValueOnce(quota.promise);
  compartitPer('fil-A', { fitxers: [captura], text: '  Mireu el cartell  ' });
  const envia = pinta();
  // Sense quota encara no hi ha panell: el lot espera, sencer.
  await act(async () => {});
  expect(m.preparaAdjunt).not.toHaveBeenCalled();
  expect(compartitPendent().fitxers).toEqual([captura]);
  await act(async () => { quota.resolve({ usats: 0, limit: 20_000_000 }); });
  expect((await screen.findByAltText('Foto adjunta')).getAttribute('src')).toBe('blob:compartit');
  expect(m.preparaAdjunt).toHaveBeenCalledOnce();
  expect(m.preparaAdjunt.mock.calls[0][0]).toBe(captura);
  expect(peu().value).toBe('Mireu el cartell');
  // El registre ja no el té: un sol fitxer, i el text ha anat de peu.
  expect(compartitPendent()).toBeNull();
  expect(envia).not.toHaveBeenCalled();
});

test('el peu s’edita i «Envia el fitxer» envia l’adjunt preparat amb el text retallat', async () => {
  compartitPer('fil-A', { fitxers: [captura], text: 'Mireu el cartell' });
  const envia = pinta();
  await screen.findByAltText('Foto adjunta');
  fireEvent.change(peu(), { target: { value: '  Festes de la Torre, dissabte  ' } });
  expect(peu().value).toBe('  Festes de la Torre, dissabte  ');
  fireEvent.click(screen.getByRole('button', { name: 'Envia el fitxer' }));
  await waitFor(() => expect(envia).toHaveBeenCalledOnce());
  const [quin, adjunt, opcions] = envia.mock.calls[0];
  expect(quin).toBe(fil);
  expect(adjunt).toMatchObject({ id: 'id-captura', tipus: 'imatge', text: 'Festes de la Torre, dissabte' });
  expect(opcions.signal).toBeInstanceOf(AbortSignal);
  await waitFor(() => expect(screen.queryByAltText('Foto adjunta')).toBeNull());
  expect(screen.queryByRole('textbox', { name: PEU })).toBeNull();
});

test('sense peu, o només amb espais, l’adjunt viatja sense la clau text', async () => {
  compartitPer('fil-A', { fitxers: [captura] });
  const envia = pinta();
  await screen.findByAltText('Foto adjunta');
  expect(peu().value).toBe('');
  fireEvent.change(peu(), { target: { value: '   ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Envia el fitxer' }));
  await waitFor(() => expect(envia).toHaveBeenCalledOnce());
  expect(envia.mock.calls[0][1]).not.toHaveProperty('text');
  expect(envia.mock.calls[0][1]).toEqual(preparatDe(captura));
});

/* Revisió 261026 · Prendre el primer fitxer avisa el registre i React tornava
   a pintar abans del setOcupat de tria(): l'efecte en prenia un altre i
   avortava el primer. Ara una guarda (ref) ho impedix: el segon espera. */
test('amb dos fitxers, el segon arriba quan s’ha enviat el primer, i sense el peu del primer', async () => {
  compartitPer('fil-A', { fitxers: [captura, segona], text: 'Les dues cares' });
  const envia = pinta();
  await screen.findByAltText('Foto adjunta');
  expect(m.preparaAdjunt).toHaveBeenCalledOnce();
  expect(peu().value).toBe('Les dues cares');
  // Mentre el primer és al compositor, el segon espera al registre.
  expect(compartitPendent().fitxers).toEqual([segona]);
  fireEvent.click(screen.getByRole('button', { name: 'Envia el fitxer' }));
  await waitFor(() => expect(m.preparaAdjunt).toHaveBeenCalledTimes(2));
  expect(m.preparaAdjunt.mock.calls[1][0]).toBe(segona);
  expect(envia.mock.calls[0][1]).toMatchObject({ id: 'id-captura', text: 'Les dues cares' });
  await screen.findByAltText('Foto adjunta');
  expect(peu().value).toBe('');
  expect(compartitPendent()).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Envia el fitxer' }));
  await waitFor(() => expect(envia).toHaveBeenCalledTimes(2));
  expect(envia.mock.calls[1][1]).toEqual(preparatDe(segona));
});

test('un lot per a una altra conversa, o sense conversa triada, no es pren; triar esta, sí', async () => {
  lliuraCompartit({ fitxers: [captura], text: 'Per a la Comissió' });
  pinta();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Foto o vídeo' }).disabled).toBe(false));
  await act(async () => {});
  expect(m.preparaAdjunt).not.toHaveBeenCalled();
  await act(async () => { triaDestiCompartit('fil-B'); });
  expect(m.preparaAdjunt).not.toHaveBeenCalled();
  expect(screen.queryByAltText('Foto adjunta')).toBeNull();
  expect(screen.queryByRole('textbox', { name: PEU })).toBeNull();
  expect(compartitPendent()).toMatchObject({ desti: 'fil-B', text: 'Per a la Comissió' });
  expect(compartitPendent().fitxers).toEqual([captura]);
  // La persona canvia d'idea i el tria per a esta conversa, amb el panell obert.
  await act(async () => { triaDestiCompartit('fil-A'); });
  await screen.findByAltText('Foto adjunta');
  expect(m.preparaAdjunt.mock.calls[0][0]).toBe(captura);
  expect(peu().value).toBe('Per a la Comissió');
});

/* Les notes de veu no porten peu: tampoc el que haja quedat d'una imatge
   compartida que no s'ha pogut preparar. */
test('una nota de veu mai no mostra el camp de peu ni l’envia', async () => {
  vi.stubGlobal('navigator', { ...globalThis.navigator, mediaDevices: { getUserMedia: vi.fn() } });
  m.preparaAdjunt.mockRejectedValueOnce(new Error('Imatge malmesa'));
  const nota = deferred();
  m.gravaVeu.mockResolvedValueOnce({ atura: vi.fn(), cancella: vi.fn(), resultat: nota.promise });
  compartitPer('fil-A', { fitxers: [captura], text: 'Mireu el cartell' });
  const envia = pinta();
  expect((await screen.findByRole('alert')).textContent).toBe('Imatge malmesa');
  expect(m.preparaAdjunt.mock.calls[0][0]).toBe(captura);
  const grava = screen.getByRole('button', { name: 'Grava àudio' });
  await waitFor(() => expect(grava.disabled).toBe(false));
  fireEvent.click(grava);
  await screen.findByRole('timer');
  await act(async () => { nota.resolve({ id: 'veu', tipus: 'veu', duradaMs: 3_000, fitxer: new Blob(['veu'], { type: 'audio/mp4' }) }); });
  await screen.findByRole('button', { name: 'Reprodueix el missatge de veu' });
  expect(screen.queryByRole('textbox', { name: PEU })).toBeNull();
  expect(screen.queryByPlaceholderText('Afig un text…')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Envia el fitxer' }));
  await waitFor(() => expect(envia).toHaveBeenCalledOnce());
  expect(envia.mock.calls[0][1]).not.toHaveProperty('text');
  expect(envia.mock.calls[0][1]).toMatchObject({ id: 'veu', tipus: 'veu' });
});

/* Revisió 261026 · El peu és només de les imatges del menú «Compartir» (l'abast
   de l'ordre): una foto triada a mà torna a ser com abans, sense camp. */
test('«Cancel·la» buida el peu: la foto següent, triada a mà, no l’hereta ni porta camp de peu', async () => {
  compartitPer('fil-A', { fitxers: [captura], text: 'Mireu el cartell' });
  pinta();
  await screen.findByAltText('Foto adjunta');
  expect(peu().value).toBe('Mireu el cartell');
  fireEvent.click(screen.getByRole('button', { name: 'Cancel·la' }));
  await waitFor(() => expect(screen.queryByAltText('Foto adjunta')).toBeNull());
  expect(screen.queryByRole('textbox', { name: PEU })).toBeNull();
  // El lot ja s'havia pres: cancel·lar no el torna a carregar.
  expect(compartitPendent()).toBeNull();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Foto o vídeo' }).disabled).toBe(false));
  fireEvent.change(screen.getByLabelText('Tria una foto o un vídeo de fins a 10 segons'), { target: { files: [segona] } });
  await screen.findByAltText('Foto adjunta');
  expect(m.preparaAdjunt).toHaveBeenCalledTimes(2);
  expect(screen.queryByRole('textbox', { name: PEU })).toBeNull();
});

/* Revisió 261026 · Una imatge compartida que no s'ha pogut preparar no
   s'emporta el text del lot: va al compositor per onTextOrfe, una sola volta, i
   el peu queda buit. La foto següent, triada a mà, ix sense camp i sense text.
   Esta comprovació repetix el rescat (onTextOrfe) i el buidatge del peu. */
const rescatIFotoAMa = async ({ onTextOrfe, envia, alerta }) => {
  expect((await screen.findByRole('alert')).textContent).toBe(alerta);
  expect(m.preparaAdjunt.mock.calls[0][0]).toBe(captura);
  await waitFor(() => expect(onTextOrfe).toHaveBeenCalledOnce());
  // El registre ja ha llevat els espais: el text arriba net.
  expect(onTextOrfe).toHaveBeenCalledWith('Mireu el cartell');
  expect(screen.queryByAltText('Foto adjunta')).toBeNull();
  expect(screen.queryByRole('textbox', { name: PEU })).toBeNull();
  // El lot ja s'ha pres sencer: el text no hi torna.
  expect(compartitPendent()).toBeNull();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Foto o vídeo' }).disabled).toBe(false));
  fireEvent.change(selector(), { target: { files: [segona] } });
  await screen.findByAltText('Foto adjunta');
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.queryByRole('textbox', { name: PEU })).toBeNull();
  expect(screen.queryByPlaceholderText('Afig un text…')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Envia el fitxer' }));
  await waitFor(() => expect(envia).toHaveBeenCalledOnce());
  expect(envia.mock.calls[0][1]).not.toHaveProperty('text');
  expect(envia.mock.calls[0][1]).toEqual(preparatDe(segona));
  expect(onTextOrfe).toHaveBeenCalledOnce();
};

test('si la imatge compartida no es pot preparar, el text va a onTextOrfe i la foto triada a mà ix sense text', async () => {
  m.preparaAdjunt.mockRejectedValueOnce(new Error('Imatge malmesa'));
  const onTextOrfe = vi.fn();
  compartitPer('fil-A', { fitxers: [captura], text: '  Mireu el cartell  ' });
  const envia = pinta(undefined, { onTextOrfe });
  await rescatIFotoAMa({ onTextOrfe, envia, alerta: 'Imatge malmesa' });
});

test('si la imatge compartida no cap a la quota (SDP-XAT-020), el text també va a onTextOrfe', async () => {
  // Queden 10 bytes: la captura preparada en fa 64 i no hi cap; la foto triada a mà, 4.
  servei.quotaXat.mockResolvedValue({ usats: 19_999_990, limit: 20_000_000 });
  const gran = { id: 'id-captura', tipus: 'imatge', fitxer: new Blob(['x'.repeat(64)], { type: 'image/webp' }) };
  m.preparaAdjunt.mockImplementation(async (fitxer) => (fitxer === captura ? gran : preparatDe(fitxer)));
  const onTextOrfe = vi.fn();
  compartitPer('fil-A', { fitxers: [captura], text: 'Mireu el cartell' });
  const envia = pinta(undefined, { onTextOrfe });
  await rescatIFotoAMa({ onTextOrfe, envia, alerta: MISSATGE_QUOTA_XAT });
  expect(m.preparaAdjunt).toHaveBeenCalledTimes(2);
});

/* El peu és només del menú «Compartir»: una foto triada a mà, ni quan falla
   ni quan es prepara, no toca onTextOrfe, no porta camp i no envia text. */
test('una foto triada a mà mai no mostra el camp de peu, i l’adjunt viatja sense la clau text', async () => {
  m.preparaAdjunt.mockRejectedValueOnce(new Error('Imatge malmesa'));
  const onTextOrfe = vi.fn();
  const envia = pinta(undefined, { onTextOrfe });
  const boto = await screen.findByRole('button', { name: 'Foto o vídeo' });
  await waitFor(() => expect(boto.disabled).toBe(false));
  fireEvent.change(selector(), { target: { files: [segona] } });
  expect((await screen.findByRole('alert')).textContent).toBe('Imatge malmesa');
  await act(async () => {});
  expect(onTextOrfe).not.toHaveBeenCalled();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Foto o vídeo' }).disabled).toBe(false));
  fireEvent.change(selector(), { target: { files: [captura] } });
  await screen.findByAltText('Foto adjunta');
  expect(screen.queryByRole('textbox', { name: PEU })).toBeNull();
  expect(screen.queryByPlaceholderText('Afig un text…')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Envia el fitxer' }));
  await waitFor(() => expect(envia).toHaveBeenCalledOnce());
  expect(envia.mock.calls[0][1]).not.toHaveProperty('text');
  expect(envia.mock.calls[0][1]).toEqual(preparatDe(captura));
  expect(onTextOrfe).not.toHaveBeenCalled();
});

/* ── Gauntlet 261026_1615 (Codex C1615-02/03/08 / Gemini G1615-04) ──────────
   El fitxer compartit que té el compositor (enMaRef) encara és del lot: si no
   s'envia torna al registre amb el seu peu (tornaFitxerCompartit), i la seua
   còpia nativa només s'allibera quan s'envia, quan la persona el cancel·la o
   quan no s'ha pogut preparar. Cada prova porta un fitxer nou amb la seua ruta
   (el registre la lliga a l'objecte, en un WeakMap): així es veu què
   s'allibera i què torna. */
const RUTA = 'file:///cache/compartit/captura.png';
const ambRuta = ({ text = 'Mireu el cartell', propietari = null } = {}) => {
  const fitxer = new Blob(['captura'], { type: 'image/png' });
  lliuraCompartit({ fitxers: [fitxer], rutes: [RUTA], text });
  triaDestiCompartit('fil-A', propietari);
  return fitxer;
};
const munta = ({ envia = vi.fn().mockResolvedValue([{ id: 'm' }]), ...props } = {}) => {
  const controls = (extra = {}) => <ControlsAdjunt usuariId="A" fil={fil} servei={servei} onEnvia={envia} t={t} {...props} {...extra} />;
  const vista = render(controls());
  return { envia, ...vista, repinta: (extra) => vista.rerender(controls(extra)) };
};
/* El lot torna sencer: el mateix fitxer, el peu i la conversa triada. */
const tornatAlLot = (fitxer, text = 'Mireu el cartell') => {
  const lot = compartitPendent();
  expect(lot).toMatchObject({ desti: 'fil-A', text });
  expect(lot.fitxers).toHaveLength(1);
  expect(lot.fitxers[0]).toBe(fitxer);
};

/* (a) Conversa munta uns controls nous a cada fil: tancar-la mentre es
   prepara la imatge no la perd. La preparació que acaba tard ja no la pren. */
test('si la conversa es tanca mentre es prepara, el fitxer torna al lot amb el peu i no s’allibera; en tornar, es prepara una sola volta', async () => {
  const preparacio = deferred();
  m.preparaAdjunt.mockImplementationOnce(() => preparacio.promise);
  const fitxer = ambRuta();
  const { unmount } = munta();
  await waitFor(() => expect(m.preparaAdjunt).toHaveBeenCalledOnce());
  expect(m.preparaAdjunt.mock.calls[0][0]).toBe(fitxer);
  // En mà: el registre ja no el té.
  expect(compartitPendent()).toBeNull();
  unmount();
  tornatAlLot(fitxer);
  // La preparació acaba després de tancar: ni el torna a prendre ni l'allibera.
  await act(async () => { preparacio.resolve(preparatDe(fitxer)); });
  tornatAlLot(fitxer);
  expect(allibera).not.toHaveBeenCalled();
  // La persona torna a la conversa: el mateix fitxer, una sola miniatura.
  munta();
  expect(await screen.findAllByAltText('Foto adjunta')).toHaveLength(1);
  expect(m.preparaAdjunt).toHaveBeenCalledTimes(2);
  expect(m.preparaAdjunt.mock.calls[1][0]).toBe(fitxer);
  expect(peu().value).toBe('Mireu el cartell');
  expect(compartitPendent()).toBeNull();
  await act(async () => {});
  expect(m.preparaAdjunt).toHaveBeenCalledTimes(2);
  expect(allibera).not.toHaveBeenCalled();
});

/* (b) Amb la quota ja desada (QUOTES_DESADES), l'efecte pren el fitxer en el
   primer pintat, i StrictMode desmunta i torna a muntar els efectes abans que
   la preparació comence. El fitxer ha d'acabar en un sol lloc: preparat al
   compositor, no també al registre (on el tornaria a prendre en enviar-lo). */
test('amb StrictMode i la quota desada, el fitxer compartit es prepara una volta, queda en mà i en enviar-lo s’allibera sense tornar', async () => {
  // Un primer muntatge només per a desar la quota d'esta persona en este port.
  const primer = munta();
  await screen.findByRole('button', { name: 'Foto o vídeo' });
  primer.unmount();
  const fitxer = ambRuta();
  const envia = vi.fn().mockResolvedValue([{ id: 'm' }]);
  render(<StrictMode><ControlsAdjunt usuariId="A" fil={fil} servei={servei} onEnvia={envia} t={t} /></StrictMode>);
  expect(await screen.findAllByAltText('Foto adjunta')).toHaveLength(1);
  expect(peu().value).toBe('Mireu el cartell');
  await act(async () => {});
  expect(m.preparaAdjunt).toHaveBeenCalledOnce();
  expect(m.preparaAdjunt.mock.calls[0][0]).toBe(fitxer);
  // Cap pèrdua i cap duplicat: és al compositor, no també al registre.
  expect(compartitPendent()).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Envia el fitxer' }));
  await waitFor(() => expect(envia).toHaveBeenCalledOnce());
  await waitFor(() => expect(screen.queryByAltText('Foto adjunta')).toBeNull());
  await act(async () => {});
  // Enviat una sola volta: no torna a aparéixer per a enviar-lo de nou.
  expect(m.preparaAdjunt).toHaveBeenCalledOnce();
  expect(compartitPendent()).toBeNull();
  expect(allibera).toHaveBeenCalledOnce();
  expect(allibera).toHaveBeenCalledWith([RUTA]);
});

/* (c) Preparat però sense enviar: tancar la conversa el torna al lot. */
test('preparat però sense enviar, tancar la conversa el torna al lot amb el peu, sense alliberar-ne la còpia', async () => {
  const fitxer = ambRuta();
  const { unmount } = munta();
  await screen.findByAltText('Foto adjunta');
  expect(compartitPendent()).toBeNull();
  unmount();
  tornatAlLot(fitxer);
  expect(allibera).not.toHaveBeenCalled();
});

/* (c) Canviar de conversa amb els mateixos controls (fil.id): torna al lot, i
   l'altra conversa no el pren perquè no és la triada. */
test('preparat però sense enviar, canviar de conversa el torna al lot; l’altra no el pren, i tornar-hi el prepara de nou', async () => {
  const fitxer = ambRuta();
  const { repinta } = munta();
  await screen.findByAltText('Foto adjunta');
  repinta({ fil: { id: 'fil-B' } });
  await waitFor(() => expect(screen.queryByAltText('Foto adjunta')).toBeNull());
  await act(async () => {});
  tornatAlLot(fitxer);
  expect(m.preparaAdjunt).toHaveBeenCalledOnce();
  expect(screen.queryByRole('textbox', { name: PEU })).toBeNull();
  repinta({ fil });
  expect(await screen.findAllByAltText('Foto adjunta')).toHaveLength(1);
  expect(m.preparaAdjunt).toHaveBeenCalledTimes(2);
  expect(m.preparaAdjunt.mock.calls[1][0]).toBe(fitxer);
  expect(peu().value).toBe('Mireu el cartell');
  expect(compartitPendent()).toBeNull();
  expect(allibera).not.toHaveBeenCalled();
});

/* (d) Enviat: la còpia nativa ja sobra, i tancar després no torna res. */
test('en enviar-lo bé, la còpia s’allibera una sola volta amb la seua ruta i res no torna al lot', async () => {
  ambRuta();
  const { envia, unmount } = munta();
  await screen.findByAltText('Foto adjunta');
  expect(allibera).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Envia el fitxer' }));
  await waitFor(() => expect(envia).toHaveBeenCalledOnce());
  await waitFor(() => expect(allibera).toHaveBeenCalledOnce());
  expect(allibera).toHaveBeenCalledWith([RUTA]);
  expect(compartitPendent()).toBeNull();
  unmount();
  expect(compartitPendent()).toBeNull();
  expect(allibera).toHaveBeenCalledOnce();
});

/* (d) «També si la conversa s'ha tancat mentre pujava» (ControlsAdjunt.envia):
   el port confirma l'enviament després del desmuntatge. */
test('si la conversa es tanca mentre puja i el port confirma l’enviament, la còpia s’allibera i el fitxer no torna al lot', async () => {
  const pujada = deferred();
  const envia = vi.fn(() => pujada.promise);
  ambRuta();
  const { unmount } = munta({ envia });
  await screen.findByAltText('Foto adjunta');
  fireEvent.click(screen.getByRole('button', { name: 'Envia el fitxer' }));
  await waitFor(() => expect(envia).toHaveBeenCalledOnce());
  unmount();
  await act(async () => { pujada.resolve([{ id: 'm' }]); });
  // Ja s'ha enviat: si tornara al lot, la persona el tornaria a enviar.
  expect(compartitPendent()).toBeNull();
  expect(allibera).toHaveBeenCalledOnce();
  expect(allibera).toHaveBeenCalledWith([RUTA]);
});

/* (e) «Cancel·la» és la persona qui no el vol: la còpia se'n va i no torna. */
test('«Cancel·la» allibera la còpia i res no torna al lot, tampoc en tancar la conversa després', async () => {
  ambRuta();
  const { unmount } = munta();
  await screen.findByAltText('Foto adjunta');
  fireEvent.click(screen.getByRole('button', { name: 'Cancel·la' }));
  await waitFor(() => expect(screen.queryByAltText('Foto adjunta')).toBeNull());
  expect(allibera).toHaveBeenCalledOnce();
  expect(allibera).toHaveBeenCalledWith([RUTA]);
  expect(compartitPendent()).toBeNull();
  unmount();
  expect(compartitPendent()).toBeNull();
  expect(allibera).toHaveBeenCalledOnce();
});

/* (e) «Cancel·la» mentre encara es prepara: tria() s'avorta, però la persona
   ja ha dit que no el vol. La preparació que acaba tard no el pinta. */
test('«Cancel·la» mentre es prepara allibera la còpia; la preparació tardana ni el pinta ni el torna al lot', async () => {
  const preparacio = deferred();
  m.preparaAdjunt.mockImplementationOnce(() => preparacio.promise);
  const fitxer = ambRuta();
  munta();
  fireEvent.click(await screen.findByRole('button', { name: 'Cancel·la' }));
  expect(allibera).toHaveBeenCalledOnce();
  expect(allibera).toHaveBeenCalledWith([RUTA]);
  await act(async () => { preparacio.resolve(preparatDe(fitxer)); });
  expect(screen.queryByAltText('Foto adjunta')).toBeNull();
  expect(compartitPendent()).toBeNull();
  expect(m.preparaAdjunt).toHaveBeenCalledOnce();
  expect(allibera).toHaveBeenCalledOnce();
});

/* 'fallida' · La imatge no s'ha pogut preparar: la còpia s'allibera (no
   tornarà a servir) i el lot no la torna a oferir. El text va a onTextOrfe. */
test('si la imatge compartida no es pot preparar, la còpia s’allibera una volta i no torna al lot', async () => {
  m.preparaAdjunt.mockRejectedValueOnce(new Error('Imatge malmesa'));
  const onTextOrfe = vi.fn();
  ambRuta();
  const { unmount } = munta({ onTextOrfe });
  expect((await screen.findByRole('alert')).textContent).toBe('Imatge malmesa');
  await waitFor(() => expect(allibera).toHaveBeenCalledOnce());
  expect(allibera).toHaveBeenCalledWith([RUTA]);
  expect(onTextOrfe).toHaveBeenCalledWith('Mireu el cartell');
  expect(compartitPendent()).toBeNull();
  unmount();
  expect(compartitPendent()).toBeNull();
  expect(allibera).toHaveBeenCalledOnce();
});

/* (f) C1615-01 · El lot és de qui ha triat la conversa (propietari). Una
   altra persona amb la mateixa conversa al davant (el mateix mòbil, una altra
   sessió) no el pren; la mateixa persona, sí. */
test('un lot que ha triat una altra persona per a esta conversa no es pren; el de la mateixa persona, sí', async () => {
  const fitxer = ambRuta({ propietari: 'A', text: 'Només per a A' });
  const deB = munta({ usuariId: 'B' });
  await waitFor(() => expect(screen.getByRole('button', { name: 'Foto o vídeo' }).disabled).toBe(false));
  await act(async () => {});
  expect(m.preparaAdjunt).not.toHaveBeenCalled();
  expect(screen.queryByAltText('Foto adjunta')).toBeNull();
  expect(screen.queryByRole('textbox', { name: PEU })).toBeNull();
  expect(compartitPendent()).toMatchObject({ desti: 'fil-A', propietari: 'A', text: 'Només per a A' });
  expect(compartitPendent().fitxers[0]).toBe(fitxer);
  deB.unmount();
  expect(allibera).not.toHaveBeenCalled();
  munta({ usuariId: 'A' });
  expect(await screen.findAllByAltText('Foto adjunta')).toHaveLength(1);
  expect(m.preparaAdjunt.mock.calls[0][0]).toBe(fitxer);
  expect(peu().value).toBe('Només per a A');
  expect(compartitPendent()).toBeNull();
});
