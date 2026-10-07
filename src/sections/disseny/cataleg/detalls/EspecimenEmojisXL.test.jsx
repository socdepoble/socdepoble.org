import { act, cleanup, fireEvent, render, waitFor, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

/* Ordre del Mestre (261007) · «Assignar»: el Bloc de notes és un useNotes de
   mentida (null, com fora de l'App, si la prova no en posa cap), la Wiki
   compilada, una de mostra, i les eines locals de la Wiki, cap (la pantalla
   les demana a WikiDePobleSection en desenvolupament; les seues proves són
   a AssignacioEmoji.test.jsx i destinsEmoji.test.js). */
const bloc = vi.hoisted(() => ({ valor: null }));
vi.mock('../../../notes/NotesContext.jsx', () => ({ useNotes: () => bloc.valor }));
vi.mock('../../../../data/wikiManifest.js', () => ({
  wikiManifest: { categories: [], items: [{ id: 'genoma', title: 'Genoma', subtitle: 'Qui som', categoryId: null }] }
}));
vi.mock('../../../wiki-de-poble/WikiDePobleSection.jsx', () => ({ modulsLocalsActius: () => ({ categories: [], items: [] }) }));

import EmojisXL from './EspecimenEmojisXL.jsx';
import { NotificationProvider } from '../../../../components/universal/NotificationContext.jsx';

/* Cada muntatge pinta 3972 targetes amb dos botons (uns 2 s a jsdom): amb la
   suite sencera en paral·lel, els 5 s per defecte no basten. */
vi.setConfig({ testTimeout: 30000 });

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  bloc.valor = null;
});

function munta(embolcall = null) {
  const Embolcall = embolcall;
  const vista = render(Embolcall ? <Embolcall><EmojisXL /></Embolcall> : <EmojisXL />);
  const boto = (codi) => vista.container.querySelector(`button[data-emoji-code="${codi}"]`);
  const assigna = (codi) => boto(codi).closest('.sdp-emojis-xl__targeta').querySelector('.sdp-emojis-xl__assigna');
  const estat = () => vista.container.querySelector('[role="status"]');
  return { ...vista, boto, assigna, estat };
}

/* La pantalla és un <dialog>. Ella mateixa (lazyRoute) i la Wiki compilada hi
   arriben amb importacions dinàmiques: mentrestant, «Carregant els destins…». */
async function obriPantalla(assigna) {
  fireEvent.click(assigna);
  const dialeg = document.querySelector('dialog');
  const carregant = within(dialeg).queryByText('Carregant els destins…');
  await within(dialeg).findByText('Genoma', {}, { timeout: 15000 });
  const tornar = within(dialeg.querySelector('.sdp-pantalla-completa__barra'))
    .getByRole('button', { name: 'Tornar de la pantalla completa' });
  return { dialeg, tornar, carregant };
}

test('el catàleg té 3972 targetes úniques i els 10 grups oberts: copiar amb nom visible i glif decoratiu, i «Assignar» blau', () => {
  const { container, boto, assigna } = munta();
  expect(within(container).getByRole('region', { name: 'Directori d’emoticones' }))
    .toBe(container.querySelector('.sdp-emojis-xl'));
  const grups = [...container.querySelectorAll('.sdp-emojis-xl details')];
  expect(grups).toHaveLength(10);
  expect(grups.every((grup) => grup.open)).toBe(true);
  const copiar = [...container.querySelectorAll('.sdp-emojis-xl__graella .sdp-emojis-xl__boto')];
  expect(copiar).toHaveLength(3972);
  expect(new Set(copiar.map((node) => node.dataset.emojiCode)).size).toBe(3972);
  expect(container.querySelectorAll('.sdp-emojis-xl__graella li > .sdp-emojis-xl__targeta')).toHaveLength(3972);
  expect(container.querySelectorAll('.sdp-emojis-xl__graella .sdp-emojis-xl__assigna')).toHaveLength(3972);
  expect(container.querySelectorAll('.sdp-emojis-xl__graella button')).toHaveLength(3972 * 2);
  const primera = boto('1F600');
  expect(primera.getAttribute('type')).toBe('button');
  expect(within(primera).getByText('grinning face').getAttribute('lang')).toBe('en');
  expect(primera.querySelector('.sdp-emojis-xl__glif').getAttribute('aria-hidden')).toBe('true');
  expect(within(grups[0]).getByRole('button', { name: 'Copia grinning face' })).toBe(primera);
  /* Dins de la targeta, davall del botó de copiar: el Boto primari, amb el
     nom «Assignar {emoji} {nom}» i sense id fins que obri la pantalla. */
  const blau = assigna('1F600');
  expect([...primera.parentElement.children]).toEqual([primera, blau]);
  expect(blau.className).toBe('sdp-boto sdp-boto--primari sdp-emojis-xl__assigna');
  expect(blau.getAttribute('type')).toBe('button');
  expect(blau.textContent).toBe('Assignar');
  expect(blau.getAttribute('aria-label')).toBe('Assignar 😀 grinning face');
  expect(blau.getAttribute('aria-haspopup')).toBe('dialog');
  expect(blau.hasAttribute('id')).toBe(false);
  expect(within(grups[0]).getByRole('button', { name: 'Assignar 😀 grinning face' })).toBe(blau);
  expect(document.querySelector('dialog')).toBeNull();
});

test('«Assignar» obri una pantalla completa (cap menú flotant) amb l’emoji i els quatre grups; «Tornar» i Escape la tanquen i el focus torna', async () => {
  const { assigna } = munta();
  const formatge = assigna('1F9C0');
  let { dialeg, tornar, carregant } = await obriPantalla(formatge);
  /* La primera obertura del fitxer: la pantalla encara no havia arribat. */
  expect(carregant?.closest('[role="status"]')).toBeTruthy();
  expect(dialeg.getAttribute('aria-label')).toBe('Assignar 🧀 cheese wedge');
  expect(dialeg.className).toContain('sdp-pantalla-completa');
  expect(document.activeElement).toBe(tornar);
  const pantalla = dialeg.querySelector('.sdp-pantalla-completa__visor > .sdp-assigna-emoji');
  expect(pantalla.querySelector('.sdp-assigna-emoji__cap .sdp-emojis-xl__glif').textContent).toBe('🧀');
  expect(within(pantalla).getByRole('heading', { level: 2 }).textContent).toBe('cheese wedge');
  expect([...pantalla.querySelectorAll('.sdp-xat-seccio__titol')].map((h) => h.textContent))
    .toEqual(['Notes personals', 'Wiki de Poble', 'Disseny', 'Pàgines de Sóc de Poble']);
  /* Fora de l'App (sense Bloc), ho diu en lloc d'una llista buida. */
  expect(within(pantalla.querySelector('.sdp-xat-seccio')).getByRole('status').textContent).toBe('El Bloc de notes no està disponible ací.');
  expect(formatge.id).not.toBe('');

  act(() => { tornar.click(); });
  expect(document.querySelector('dialog')).toBeNull();
  expect(document.activeElement).toBe(formatge);

  ({ dialeg } = await obriPantalla(formatge));
  act(() => { dialeg.dispatchEvent(new Event('cancel', { cancelable: true })); });
  expect(document.querySelector('dialog')).toBeNull();
  expect(document.activeElement).toBe(formatge);
});

test('assignar a una nota de veres: canal del Bloc (camp icon), la pantalla es tanca, el toast ho diu i el focus torna', async () => {
  const setLocalNoteField = vi.fn();
  bloc.valor = { notes: [{ id: 'n1', title: 'La nota', icon: '' }], status: 'ready', teSessio: true, setLocalNoteField };
  const { assigna } = munta(NotificationProvider);
  const formatge = assigna('1F9C0');
  const { dialeg } = await obriPantalla(formatge);
  const notes = dialeg.querySelector('.sdp-xat-seccio');
  fireEvent.click(within(notes).getByRole('button', { name: /^La nota/ }));
  expect(setLocalNoteField).toHaveBeenCalledExactlyOnceWith('n1', 'icon', '🧀');
  expect(document.querySelector('dialog')).toBeNull();
  expect(document.activeElement).toBe(formatge);
  expect(document.body.querySelector('[role="alert"]').textContent).toContain('Fet: 🧀 és ara l’emoji de «La nota».');
});

test('copiar passa només el glif al porta-retalls i anuncia èxit amb un status accessible sense provider', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('navigator', { clipboard: { writeText } });
  const { boto, estat } = munta();
  fireEvent.click(boto('1F1EA 1F1F8'));
  expect(writeText).toHaveBeenCalledExactlyOnceWith('🇪🇸');
  await waitFor(() => expect(estat().textContent).toBe('Copiat: flag: Spain.'));
  expect(estat().getAttribute('aria-live')).toBe('polite');
  expect(estat().getAttribute('aria-atomic')).toBe('true');
});

test('un rebuig de permisos anuncia la fallada i no afirma que haja copiat', async () => {
  vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denegat')) } });
  const { boto, estat } = munta();
  fireEvent.click(boto('1F600'));
  await waitFor(() => expect(estat().textContent).toBe('No s’ha pogut copiar: grinning face. Torna-ho a provar.'));
});

test('sense API de porta-retalls el resultat diu que la còpia no està disponible', () => {
  vi.stubGlobal('navigator', {});
  const { boto, estat } = munta();
  fireEvent.click(boto('1F600'));
  expect(estat().textContent).toBe('La còpia no està disponible en aquest navegador.');
});

test('un navegador que llança una excepció síncrona també anuncia una fallada honesta', () => {
  vi.stubGlobal('navigator', { clipboard: { writeText: () => { throw new Error('bloquejat'); } } });
  const { boto, estat } = munta();
  fireEvent.click(boto('1F600'));
  expect(estat().textContent).toBe('No s’ha pogut copiar: grinning face. Torna-ho a provar.');
});

test('mentre espera diu Copiant; només l’últim clic pot canviar el resultat, resolent o rebutjant', async () => {
  const pendents = [];
  const writeText = vi.fn(() => new Promise((resolve, reject) => pendents.push({ resolve, reject })));
  vi.stubGlobal('navigator', { clipboard: { writeText } });
  const { boto, estat } = munta();
  fireEvent.click(boto('1F600'));
  expect(estat().textContent).toBe('Copiant: grinning face…');
  fireEvent.click(boto('1F603'));
  expect(estat().textContent).toBe('Copiant: grinning face with big eyes…');
  await act(async () => { pendents[0].resolve(); });
  expect(estat().textContent).toBe('Copiant: grinning face with big eyes…');
  await act(async () => { pendents[1].resolve(); });
  expect(estat().textContent).toBe('Copiat: grinning face with big eyes.');

  fireEvent.click(boto('1F600'));
  fireEvent.click(boto('1F603'));
  await act(async () => { pendents[2].reject(new Error('resposta antiga')); });
  expect(estat().textContent).toBe('Copiant: grinning face with big eyes…');
  await act(async () => { pendents[3].reject(new Error('denegat')); });
  expect(estat().textContent).toBe('No s’ha pogut copiar: grinning face with big eyes. Torna-ho a provar.');
});
