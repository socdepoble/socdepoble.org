// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Importa } from './Intercanvi.jsx';

const { g, parseja, navega } = vi.hoisted(() => ({
  g: { carregat: true, nomesLectura: false, anyActual: 2026, complet: {}, importa: vi.fn() },
  parseja: vi.fn(), navega: vi.fn()
}));
vi.mock('../../../components/PedraSeca/index.js', () => ({
  Accions: ({ children }) => <div>{children}</div>,
  Alerta: ({ children }) => <div role="alert">{children}</div>,
  AreaText: () => null,
  Boto: ({ children, onClick, disabled }) => <button onClick={onClick} disabled={disabled}>{children}</button>,
  Camp: ({ children, etiqueta }) => <label>{etiqueta}{children}</label>,
  CampFitxer: ({ onChange, disabled }) => <input type="file" onChange={onChange} disabled={disabled} />,
  DialegConfirmacio: ({ obert, onConfirma }) => obert
    ? <div role="dialog"><button onClick={onConfirma}>confirma</button></div> : null,
  GrupOpcions: () => null,
  Pila: ({ children }) => <div>{children}</div>
}));
vi.mock('../../plataforma/index.js', () => ({ useApp: () => ({ ruta: (...parts) => parts.join('/') }) }));
vi.mock('../gedcom/index.js', () => ({
  TIPUS_GED: 'text/plain', TIPUS_JSON: 'application/json', creaCopiaJson: vi.fn(), descarregaText: vi.fn(),
  escriuGedcom: vi.fn(), llegeixCopiaJson: parseja, llegeixGedcom: parseja, llegeixFitxerArbre: parseja, lligTextFitxerArbre: fitxer => fitxer.text(), nomFitxer: vi.fn()
}));
vi.mock('../nucli/index.js', () => ({ MIDA_MAXIMA_IMPORTACIO: 8 * 1024 * 1024, useGenealogia: () => g }));
vi.mock('../textos.js', () => ({ textError: error => error.message, textCodiLectura: codi => String(codi) }));
vi.mock('./comunes.jsx', () => ({
  BotoCopia: () => null, CasellaVius: () => null, EnllacBoto: () => null,
  MarcGenealogia: ({ children }) => <main>{children}</main>, useIdioma: () => 'ca',
  useNavegaGenealogia: () => navega,
  useT: () => (clau, valors) => clau + (valors ? ':' + JSON.stringify(valors) : '')
}));

const ajornada = () => {
  let resol;
  let rebutja;
  const promise = new Promise((a, b) => { resol = a; rebutja = b; });
  return { promise, resol, rebutja };
};
const fitxer = text => ({ name: 'sintetic.ged', size: 10, text: () => Promise.resolve(text) });
const tria = file => fireEvent.change(screen.getByLabelText('importa.fitxer'), { target: { files: file ? [file] : [] } });
const settle = async () => { await act(async () => { await Promise.resolve(); }); };

beforeEach(() => {
  vi.clearAllMocks();
  g.complet = {};
  g.importa.mockResolvedValue('nou');
  parseja.mockImplementation(text => ({
    ok: true, errors: [], avisos: [], versio: '7.0',
    complet: { arbre: { id: text }, persones: Array.from({ length: text === 'B' ? 2 : 1 }, () => ({})), relacions: [] }
  }));
});
afterEach(cleanup);

test('una lectura antiga no substituïx la previsualització més nova ni torna a parsejar', async () => {
  const lenta = ajornada();
  render(<Importa />);
  tria({ name: 'sintetic-a.ged', size: 10, text: () => lenta.promise });
  tria(fitxer('B'));
  await settle();
  expect(screen.getByText('importa.recompte:{"persones":2,"relacions":0}')).toBeTruthy();
  await act(async () => { lenta.resol('A'); });
  expect(parseja).toHaveBeenCalledOnce();
  expect(parseja.mock.calls[0][0]).toBe('B');
  expect(screen.getByText('importa.recompte:{"persones":2,"relacions":0}')).toBeTruthy();
});

test.each(['cancel', 'gran', 'unmount'])('invalida la lectura pendent quan arriba %s', async mode => {
  const lenta = ajornada();
  const vista = render(<Importa />);
  tria({ name: 'sintetic.ged', size: 10, text: () => lenta.promise });
  if (mode === 'unmount') vista.unmount();
  else if (mode === 'gran') tria({ name: 'gran.ged', size: 9 * 1024 * 1024, text: vi.fn() });
  else tria(null);
  await act(async () => { lenta.resol('A'); });
  expect(parseja).not.toHaveBeenCalled();
  expect(screen.queryByRole('button', { name: 'importa.desaNou' })).toBeNull();
});

test('un rebuig antic no reemplaça l’estat de la selecció vigent', async () => {
  const lenta = ajornada();
  render(<Importa />);
  tria({ name: 'sintetic.ged', size: 10, text: () => lenta.promise });
  tria(fitxer('B'));
  await settle();
  await act(async () => { lenta.rebutja(new Error('error antic')); });
  expect(screen.queryByText('error antic')).toBeNull();
  expect(screen.getByText('importa.recompte:{"persones":2,"relacions":0}')).toBeTruthy();
});

test('canviar fitxer tanca la confirmació de substitució de la selecció anterior', async () => {
  render(<Importa />);
  tria(fitxer('A'));
  await settle();
  fireEvent.click(screen.getByRole('button', { name: 'importa.substituix' }));
  expect(screen.getByRole('dialog')).toBeTruthy();
  tria(fitxer('B'));
  expect(screen.queryByRole('dialog')).toBeNull();
  await settle();
  expect(g.importa).not.toHaveBeenCalled();
});

test('una desada captura la previsualització i impedix un segon commit simultani', async () => {
  const desada = ajornada();
  g.importa.mockReturnValue(desada.promise);
  const vista = render(<Importa />);
  tria(fitxer('B'));
  await settle();
  const boto = screen.getByRole('button', { name: 'importa.desaNou' });
  fireEvent.click(boto);
  fireEvent.click(boto);
  expect(g.importa).toHaveBeenCalledOnce();
  expect(g.importa.mock.calls[0][0].arbre.id).toBe('B');
  expect(screen.getByLabelText('importa.fitxer').disabled).toBe(true);
  vista.unmount();
  await act(async () => { desada.resol('fet'); });
  expect(navega).not.toHaveBeenCalled();
});
