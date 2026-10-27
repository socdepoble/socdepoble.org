import '../../../../tests/helpers/diccionaris.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import { createTranslator } from '../../../config/i18n.js';
import EN from '../../../config/idiomes/en.js';
import { SALUTACIO_TECNICA_IAIA } from '../../../data/iaiaTextos.js';
import ConsultaIAIA from './ConsultaIAIA.jsx';
const t = (_clau, reserva) => reserva;
afterEach(cleanup);
const munta = (consulta, { prepara = vi.fn(), traductor = t } = {}) => render(<MemoryRouter><ConsultaIAIA t={traductor} consulta={consulta} prepara={prepara} /></MemoryRouter>);
const pregunta = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Pregunta a la IAIA' }));
  fireEvent.change(screen.getByLabelText('Què necessites saber?'), { target: { value: 'Com funciona Sollutia?' } });
  fireEvent.click(screen.getByRole('button', { name: 'Consultar' }));
};

test('només consulta després de l’acció explícita i mostra text de font amb enllaç', async () => {
  const consulta = vi.fn().mockResolvedValue({ estat: 'resposta', fonts: [{ id: 'model', titol: 'Model B', fragment: 'Sollutia només llig.', ruta: '/wikidepoble?item=model' }] });
  munta(consulta);
  expect(consulta).not.toHaveBeenCalled();
  pregunta();
  expect(await screen.findByText('Sollutia només llig.')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Model B' }).getAttribute('href')).toBe('/wikidepoble?item=model');
  expect(screen.getByText(/no s’envia al xat compartit/)).toBeTruthy();
  expect(consulta).toHaveBeenCalledTimes(1);
});

test('tancar cancel·la la consulta, tornar a obrir no mostra una resposta antiga', async () => {
  let resol;
  const consulta = vi.fn(() => new Promise((r) => { resol = r; }));
  munta(consulta); pregunta();
  const signal = consulta.mock.calls[0][1].signal;
  fireEvent.click(screen.getByRole('button', { name: 'Tancar' }));
  expect(signal.aborted).toBe(true);
  resol({ estat: 'resposta', fonts: [{ id: 'old', titol: 'Antiga', fragment: 'Resposta antiga', ruta: '/wikidepoble?item=old' }] });
  fireEvent.click(screen.getByRole('button', { name: 'Pregunta a la IAIA' }));
  await waitFor(() => expect(screen.queryByText('Resposta antiga')).toBeNull());
  expect(screen.getByLabelText('Què necessites saber?').value).toBe('');
});

test('un error conserva la pregunta i permet tornar a provar', async () => {
  const consulta = vi.fn().mockRejectedValue(new Error('fallada'));
  munta(consulta); pregunta();
  expect(await screen.findByText(/Ara no puc llegir la Wiki/)).toBeTruthy();
  expect(screen.getByLabelText('Què necessites saber?').value).toBe('Com funciona Sollutia?');
  expect(screen.getByRole('button', { name: 'Consultar' }).disabled).toBe(false);
});

/* Gauntlet 261022_0225 (crítica Claude) · IAIA-3. Un control desactivat
   perd el focus (Chrome l'envia a <body>, fora del diàleg modal). */
test('mentre consulta, cap control es desactiva: el focus es queda al botó i un segon clic no torna a consultar', async () => {
  let resol;
  const consulta = vi.fn(() => new Promise((r) => { resol = r; }));
  munta(consulta);
  fireEvent.click(screen.getByRole('button', { name: 'Pregunta a la IAIA' }));
  fireEvent.change(screen.getByLabelText('Què necessites saber?'), { target: { value: 'Com funciona Sollutia?' } });
  const boto = screen.getByRole('button', { name: 'Consultar' });
  boto.focus();
  fireEvent.click(boto);
  const camp = screen.getByLabelText('Què necessites saber?');
  const durant = screen.getByRole('button', { name: 'Consultant la Wiki…' });
  expect([camp.disabled, camp.readOnly]).toEqual([false, true]);
  expect([durant.disabled, durant.getAttribute('aria-disabled')]).toEqual([false, 'true']);
  expect(document.activeElement).toBe(durant);
  fireEvent.click(durant);
  expect(consulta).toHaveBeenCalledTimes(1);
  await act(async () => { resol({ estat: 'sense_resultats', fonts: [] }); });
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Consultar' }));
  expect(camp.readOnly).toBe(false);
});

test('la zona viva anuncia una frase curta, no els fragments de les fonts', async () => {
  const fragment = 'Sollutia és l’amfitrió i el soci d’infraestructura de Sóc de Poble.';
  const consulta = vi.fn().mockResolvedValue({ estat: 'resposta', fonts: [
    { id: 'a', titol: 'Model B', fragment, ruta: '/wikidepoble?item=a' },
    { id: 'b', titol: 'Soci', fragment: 'Una altra font.', ruta: '/wikidepoble?item=b' }
  ] });
  munta(consulta); pregunta();
  expect(await screen.findByText(fragment)).toBeTruthy();
  const viva = screen.getByRole('status');
  expect(viva.textContent).toBe('He trobat 2 fonts a la Wiki.');
  expect(viva.querySelector('a, article')).toBeNull();
});

/* Revisió de la crítica · Llei del Píxel. El cos del diàleg és una graella
   amb buit: la zona viva i les fonts hi entren com una sola peça, com abans. */
test('la zona viva i les fonts són una sola peça de la graella del cos', async () => {
  munta(vi.fn().mockResolvedValue({ estat: 'resposta', fonts: [{ id: 'a', titol: 'Model B', fragment: 'Sollutia només llig.', ruta: '/wikidepoble?item=a' }] }));
  pregunta();
  const article = (await screen.findByText('Sollutia només llig.')).closest('article');
  const peca = screen.getByRole('status').parentElement;
  expect(article.parentElement).toBe(peca);
  expect(peca.parentElement.classList.contains('sdp-xat-dialeg__cos')).toBe(true);
  expect([...peca.parentElement.children].map((fill) => fill.tagName)).toEqual(['P', 'P', 'FORM', 'DIV']);
});

/* Revisió de la crítica · El botó pendent porta aria-disabled, no disabled:
   s'apaga igual que un .sdp-boto:disabled, dins de la capa que arriba al Shadow DOM. */
test('el botó pendent s’apaga com un botó desactivat', () => {
  const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
  const declaracions = (css, selector) => {
    const bloc = css.slice(css.indexOf(selector)).match(/\{([^}]*)\}/)[1];
    return bloc.split(';').map((d) => d.trim()).filter(Boolean).sort();
  };
  const propi = llig('src/sections/xat/components/ConsultaIAIA.css');
  expect(declaracions(propi, '.sdp-iaia-consulta .sdp-boto[aria-disabled="true"]'))
    .toEqual(declaracions(llig('src/css/components.css'), '.sdp-boto:disabled'));
  expect(propi.trim()).toMatch(/^@layer components \{/);
  expect(llig('src/css/index.css')).toContain("@import url('../sections/xat/components/ConsultaIAIA.css');");
});

test('sense una font que responga, ho diu i diu on preguntar', async () => {
  munta(vi.fn().mockResolvedValue({ estat: 'sense_resultats', fonts: [] })); pregunta();
  await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/^No ho trobe a la Wiki pública\..*grup General de la comunitat Sóc de Poble/));
});

/* IAIA-5 · La salutació, una sola vegada. */
test('a una salutació, la salutació no es repetix: una frase curta demana la pregunta', async () => {
  munta(vi.fn().mockResolvedValue({ estat: 'salutacio', text: SALUTACIO_TECNICA_IAIA, fonts: [] })); pregunta();
  await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/^Digues-me què vols fer/));
  expect(screen.getAllByText(SALUTACIO_TECNICA_IAIA)).toHaveLength(1);
});

/* IAIA-7 · La Wiki s'escalfa en obrir el diàleg, no abans ni sense obrir-lo. */
test('la Wiki comença a carregar quan el diàleg porta un moment obert', async () => {
  const prepara = vi.fn();
  munta(vi.fn(), { prepara });
  await new Promise((r) => setTimeout(r, 350));
  expect(prepara).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Pregunta a la IAIA' }));
  await waitFor(() => expect(prepara).toHaveBeenCalledTimes(1));
});

test('obrir i tancar de seguida no demana la Wiki', async () => {
  const prepara = vi.fn();
  munta(vi.fn(), { prepara });
  fireEvent.click(screen.getByRole('button', { name: 'Pregunta a la IAIA' }));
  fireEvent.click(screen.getByRole('button', { name: 'Tancar' }));
  await new Promise((r) => setTimeout(r, 350));
  expect(prepara).not.toHaveBeenCalled();
});

/* IAIA-4 · La salutació del Mestre, en la llengua de la interfície. */
test('en anglés, la salutació de la consulta és la del diccionari', () => {
  munta(vi.fn(), { traductor: createTranslator('en') });
  fireEvent.click(screen.getByRole('button', { name: EN['section.xat.iaia.consulta.obrir'] }));
  expect(screen.getByText(EN['section.xat.iaia.salutacio'])).toBeTruthy();
  expect(screen.queryByText(SALUTACIO_TECNICA_IAIA)).toBeNull();
});

/* Ordre del Mestre (261026_2126; P1-37) · «Pregunta a la IAIA» ja no va
   enganxat al compositor ni a les vores de la conversa: la píndola de sèrie,
   amb el seu modificador, respira amb els espais de la reixeta (16px als
   costats, 12px dalt i baix) i el contenidor li dona l'amplària. La funció
   no canvia: obri el diàleg. jsdom no pinta: es comprova la regla escrita. */
test('P1-37 · la píndola de la IAIA respira: marges de la reixeta, amplària del contenidor, la mateixa funció', () => {
  munta(vi.fn());
  const boto = screen.getByRole('button', { name: 'Pregunta a la IAIA' });
  expect([...boto.classList]).toEqual(['sdp-xat-pindola', 'sdp-xat-pindola--iaia']);
  const propi = readFileSync(resolve(process.cwd(), 'src/sections/xat/components/ConsultaIAIA.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const bloc = propi.slice(propi.indexOf('.sdp-xat-pindola.sdp-xat-pindola--iaia')).match(/\{([^}]*)\}/)[1];
  expect(bloc.split(';').map((d) => d.trim().replace(/\s+/g, ' ')).filter(Boolean).sort())
    .toEqual(['margin-block: var(--sdp-space-3)', 'margin-inline: var(--sdp-space-4)', 'width: auto']);
  fireEvent.click(boto);
  expect(screen.getByLabelText('Què necessites saber?')).toBeTruthy();
});
