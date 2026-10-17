/* Gauntlet 261016_1530 (Bloc 3.6.6; relleu F25) · En llavor i en local, la
   IAIA MarIA contesta amb els 3 documents més pròxims de la Wiki de Poble
   (data/iaiaLocal.js): una línia per document amb el títol i la ruta
   /wikidepoble?item=<slug>. A la seua bombolla (per id i signant com a IA,
   mai pel nom) cada ruta és un enllaç intern de l'app. Cap altra bombolla no
   canvia: ni la d'una persona, ni la d'una altra IA, ni la de la IAIA en mode
   de selecció o sense rutes. */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import Bombolla from './Bombolla.jsx';
import { createTranslator } from '../../../config/i18n.js';
import { IAIA_ID, RESPOSTA_IAIA } from '../../../data/identitatsSeed.js';
import { componResposta, rutaDeDocumentWiki } from '../../../data/iaiaLocal.js';

afterEach(cleanup);

const t = createTranslator('ca');
const DOCUMENTS = [
  { id: 'soci_sollutia', titol: 'Sollutia, soci d’infraestructura' },
  { id: 'ADR-2026-09-SOLLUTIA-MODEL-B', titol: 'Model B' },
  { id: '00_index', titol: 'Índex mestre de la Wiki' }
];
const RESPOSTA_WIKI = componResposta(DOCUMENTS);
const missatge = (extra) => ({ id: 'm-1', sender: 'other', creatAl: '2026-10-16T08:00:00Z', ...extra });
const pinta = (dades, opcions = {}, onCanvi = undefined) => render(
  <MemoryRouter onCanvi={onCanvi}>
    <ul><Bombolla missatge={missatge(dades)} locale="ca-ES" t={t} {...opcions} /></ul>
  </MemoryRouter>
);
const DE_LA_IAIA = { author: 'IAIA MarIA', usuariId: IAIA_ID, is_ai: true };
const textDeLaBombolla = (container) => container.querySelector('p.sdp-xat-bombolla__text');

test('la resposta de la Wiki: cada ruta és un enllaç intern a la seua fitxa de la Wiki, amb el títol al costat', () => {
  const { container } = pinta({ ...DE_LA_IAIA, text: RESPOSTA_WIKI });
  const paragraf = textDeLaBombolla(container);
  const enllacos = [...paragraf.querySelectorAll('a')];
  expect(enllacos.map((a) => [a.getAttribute('href'), a.textContent, a.className])).toEqual(
    DOCUMENTS.map(({ id }) => [rutaDeDocumentWiki(id), rutaDeDocumentWiki(id), 'sdp-xat-enllac'])
  );
  /* Interns: cap pestanya nova. */
  expect(enllacos.every((a) => !a.hasAttribute('target') && !a.hasAttribute('rel'))).toBe(true);
  /* El text que es llig és el text del missatge, caràcter a caràcter. */
  expect(paragraf.textContent).toBe(RESPOSTA_WIKI);
  for (const { titol } of DOCUMENTS) expect(paragraf.textContent).toContain(`· ${titol} — `);
});

test('un clic obri el document a la Wiki de Poble dins de l’app', () => {
  const onCanvi = vi.fn();
  pinta({ ...DE_LA_IAIA, text: RESPOSTA_WIKI }, {}, onCanvi);
  fireEvent.click(screen.getByRole('link', { name: rutaDeDocumentWiki('soci_sollutia') }));
  expect(onCanvi).toHaveBeenLastCalledWith('/wikidepoble?item=soci_sollutia');
});

test('un enllaç extern dins d’una resposta de la IAIA continua sent el de sempre (pestanya nova)', () => {
  const { container } = pinta({ ...DE_LA_IAIA, text: 'Mira https://socdepoble.org i /wikidepoble?item=genoma' });
  const [externa, interna] = [...textDeLaBombolla(container).querySelectorAll('a')];
  expect([externa.getAttribute('href'), externa.getAttribute('target'), externa.getAttribute('rel')]).toEqual(['https://socdepoble.org/', '_blank', 'noopener noreferrer']);
  expect(interna.getAttribute('href')).toBe('/wikidepoble?item=genoma');
});

test('la frase de sempre de la IAIA es pinta com abans: un sol span, cap enllaç', () => {
  const { container } = pinta({ ...DE_LA_IAIA, text: RESPOSTA_IAIA });
  expect(textDeLaBombolla(container).innerHTML).toBe(`<span>${RESPOSTA_IAIA}</span>`);
});

test.each([
  ['una persona', { author: 'Toni', usuariId: 'u-toni' }, {}],
  ['una altra IA', { author: 'El Gall', usuariId: 'gall', is_ai: true }, {}],
  ['una IA amb el nom de la IAIA i un altre id', { author: 'IAIA MarIA', usuariId: 'iaia-1', is_ai: true }, {}],
  ['qui té l’id de la IAIA però no signa com a IA', { author: 'Maria', usuariId: IAIA_ID }, { esGrup: true }],
  ['la IAIA en mode de selecció', DE_LA_IAIA, { seleccio: { actiu: true, triat: false, onAlterna: () => {} } }],
  ['un missatge propi', { usuariId: 'jo', sender: 'me' }, {}]
])('%s: les rutes es queden en text, amb el DOM de sempre', (_qui, dades, opcions) => {
  const { container } = pinta({ ...dades, text: RESPOSTA_WIKI }, opcions);
  const paragraf = textDeLaBombolla(container);
  expect(paragraf.querySelectorAll('a')).toHaveLength(0);
  expect(paragraf.innerHTML).toBe(`<span>${RESPOSTA_WIKI}</span>`);
});
