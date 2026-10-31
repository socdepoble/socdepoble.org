import '../../../../tests/helpers/diccionaris.js';
import { existsSync, readFileSync } from 'node:fs';
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
/* tractor-vocabulari (ordre del Mestre, 261030) · El full de la consulta és el
   bloc ConsultaIAIA de src/css/modules.css, entre les seues marques. */
const blocConsultaIAIA = () => {
  const tot = readFileSync(resolve(process.cwd(), 'src/css/modules.css'), 'utf8');
  const inici = tot.indexOf('/* ═══ BLOC ConsultaIAIA · ');
  const fi = tot.indexOf('/* ═══ FI DEL BLOC ConsultaIAIA ═══ */');
  if (inici < 0 || fi < inici) throw new Error('modules.css no té el bloc ConsultaIAIA');
  return tot.slice(inici, fi);
};
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
  /* tractor-vocabulari (261030) · El full és el bloc ConsultaIAIA de modules.css,
     que index.css importa sense layer(): arriba igual al Shadow DOM. */
  const propi = blocConsultaIAIA();
  expect(declaracions(propi, '.sdp-iaia-consulta .sdp-boto[aria-disabled="true"]'))
    .toEqual(declaracions(llig('src/css/components.css'), '.sdp-boto:disabled'));
  expect(propi.replace(/\/\*[\s\S]*?\*\//g, '').trim()).toMatch(/^@layer components \{/);
  expect(llig('src/css/index.css')).toContain("@import url('./modules.css');");
  expect(llig('src/css/index.css')).not.toContain('ConsultaIAIA.css');
  expect(existsSync(resolve(process.cwd(), 'src/sections/xat/components/ConsultaIAIA.css'))).toBe(false);
});

test('sense una font que responga, ho diu i diu on preguntar', async () => {
  munta(vi.fn().mockResolvedValue({ estat: 'sense_resultats', fonts: [] })); pregunta();
  await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/^No ho trobe a la Wiki pública\..*grup General de la comunitat Sóc de Poble/));
});

/* Ordre del Mestre (30-10-2026; f4 D.2, P1-49) · L'estat buit diu la veritat:
   el nom de l'eina ja el busca la consulta (iaiaLocal.js · cercaGuiada), i
   aconsellar-lo després que no ha eixit era prometre el que no troba. En les
   cinc llengües, i el text de reserva del component és el del valencià.
   Gauntlet f4a (corrector iaia-consulta; iaia-consulta-asercio-negativa-feble)
   · El text sencer de cada llengua, lletra per lletra: vetar una sola frase
   deixava passar la mateixa promesa escrita d'una altra manera («Escribe solo
   el nombre de la sección y lo encontrarás»). Qualsevol canvi del consell ha
   de passar per ací, i cada text diu que potser la Wiki encara no en parla. */
test('f4 D.2 · l’estat buit no promet que el nom de l’eina ho trobe, en cap llengua', async () => {
  munta(vi.fn().mockResolvedValue({ estat: 'sense_resultats', fonts: [] })); pregunta();
  await waitFor(() => expect(screen.getByRole('status').textContent).toBe(createTranslator('ca')('section.xat.iaia.consulta.buit')));
  const veritat = {
    ca: 'No ho trobe a la Wiki pública. Potser encara no en parla, o ho diu amb altres paraules. Pots preguntar-ho al grup General de la comunitat Sóc de Poble, on et pot contestar una persona.',
    es: 'No lo encuentro en la Wiki pública. Quizá todavía no habla de ello, o lo dice con otras palabras. Puedes preguntarlo en el grupo General de la comunidad Sóc de Poble, donde te puede contestar una persona.',
    en: 'I can\'t find it in the public Wiki. Maybe it doesn\'t cover it yet, or it says it in other words. You can ask in the General group of the Sóc de Poble community, where a person can answer you.',
    eu: 'Ez dut Wiki publikoan aurkitzen. Agian oraindik ez du horri buruz ezer esaten, edo beste hitz batzuekin esaten du. Sóc de Poble komunitateko «General» taldean galde dezakezu, han pertsona batek erantzun diezazuke.',
    gl: 'Non o atopo na Wiki pública. Quizais aínda non fala diso, ou dio con outras palabras. Podes preguntalo no grupo «General» da comunidade Sóc de Poble, onde che pode responder unha persoa.'
  };
  for (const [llengua, text] of Object.entries(veritat)) {
    expect([llengua, createTranslator(llengua)('section.xat.iaia.consulta.buit')]).toEqual([llengua, text]);
  }
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
   no canvia: obri el diàleg. jsdom no pinta: es comprova la regla escrita.
   P1-37 (261026_2057) · Els marges són els tokens del botó de bloc
   (--sdp-boto-marge-*, tokens.css), que valen els mateixos 16 i 12px
   (src/css/botons.capes.test.js). Expectativa actualitzada a propòsit. */
test('P1-37 · la píndola de la IAIA respira: marges de la reixeta, amplària del contenidor, la mateixa funció', () => {
  munta(vi.fn());
  const boto = screen.getByRole('button', { name: 'Pregunta a la IAIA' });
  expect([...boto.classList]).toEqual(['sdp-xat-pindola', 'sdp-xat-pindola--iaia']);
  const propi = blocConsultaIAIA().replace(/\/\*[\s\S]*?\*\//g, '');
  const bloc = propi.slice(propi.indexOf('.sdp-xat-pindola.sdp-xat-pindola--iaia')).match(/\{([^}]*)\}/)[1];
  expect(bloc.split(';').map((d) => d.trim().replace(/\s+/g, ' ')).filter(Boolean).sort())
    .toEqual(['margin-block: var(--sdp-boto-marge-block)', 'margin-inline: var(--sdp-boto-marge-inline)', 'width: auto']);
  fireEvent.click(boto);
  expect(screen.getByLabelText('Què necessites saber?')).toBeTruthy();
});
