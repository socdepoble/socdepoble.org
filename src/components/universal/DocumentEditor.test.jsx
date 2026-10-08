import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, render, cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ richText: null, llavorNota: '<h3>Llavor del Bloc</h3>' }));
// El motor TipTap no entra en joc: es prova l'estructura de l'editor. El hook
// és un vi.fn per a vore què rep (la llavor del cos).
vi.mock('./richText', () => {
  mocks.richText = vi.fn(() => null);
  return {
    useUniversalRichText: mocks.richText,
    useTipTapToolbarAdapter: () => ({ state: {}, exec: {} }),
    /* T41 · la barra muda, amb el botó PUBLICAR (per a provar que obri el selector). */
    UniversalRichTextToolbar: ({ onPublish, publishLabel, publishPopup }) => (
      <div className="sdp-editor-tools" data-testid="eines">
        <button type="button" aria-haspopup={publishPopup || undefined} onClick={onPublish}>{publishLabel || 'Publicar'}</button>
      </div>
    ),
    UniversalRichTextContent: () => <div data-testid="cos" />
  };
});
vi.mock('./richText/extensions', () => ({ extensionsRiques: () => [] }));
// Com a HEAD: la llavor per defecte ve del Bloc de Notes (deute previ conservat
// per ordre del Mestre). Un valor reconeixible per a vore que és la que arriba.
vi.mock('../../sections/notes/NotesSection.jsx', () => ({ LLAVOR_NOTA: mocks.llavorNota }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_clau, text) => text }) }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('./NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../config/assetResolver', async (importOriginal) => ({ ...(await importOriginal()), resolveAsset: (uri) => uri }));
import { DocumentEditor } from './DocumentEditor.jsx';
import { AVIS_PREVISUALITZACIO, AVISOS_TARGETA_VIVA } from './TargetaViva.jsx';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const DOC = { id: 'd1', title: 'Títol', subtitle: '', lead: '', content: '', formattedDate: '01/01/26', formattedTime: '10:00' };
const editor = (adapter) => render(<DocumentEditor adapter={{ document: DOC, labels: [{ text: 'Sistema' }], ...adapter }} />);
const classesDe = (el) => [...el.children].map((e) => e.className || e.dataset.testid);

test('E1 · no hi ha barra grisa: la fila d’eines va seguida del document (barra blava a la fila 2)', () => {
  const { container } = editor({});
  const shell = container.querySelector('.sdp-editor-shell-atomic');
  expect([...shell.children].map((e) => e.className)).toEqual(['sdp-editor-tools', 'sdp-editor-document']);
  expect(shell.querySelector('.sdp-editor-document').firstElementChild.firstElementChild.className).toBe('bar-blue');
  expect(container.querySelector('.sdp-editor-meta')).toBeNull();
  expect(container.querySelector('select.sdp-copyright-selector')).toBeNull();
});

test('D13 · amb «davall-entradilla» la barra blava és la fila 1 i les eines baixen davall de l’entradilla', () => {
  const { container } = editor({ posicioEines: 'davall-entradilla' });
  const shell = container.querySelector('.sdp-editor-shell-atomic');
  expect(classesDe(shell)).toEqual(['sdp-editor-document']);
  const contenidor = shell.querySelector('.sdp-editor-document').firstElementChild;
  expect(contenidor.firstElementChild.className).toBe('bar-blue');
  const article = contenidor.querySelector('article.content-wrapper');
  expect(classesDe(article)).toEqual(['page-intro', 'sdp-editor-eines', 'cos']);
  expect(container.querySelectorAll('.sdp-editor-tools')).toHaveLength(1);
  expect(article.querySelector('.sdp-editor-eines > .sdp-editor-tools')).not.toBeNull();
});

test('D13 · un valor desconegut de posicioEines es comporta com «dalt»', () => {
  const { container } = editor({ posicioEines: 'baix' });
  const shell = container.querySelector('.sdp-editor-shell-atomic');
  expect(classesDe(shell)).toEqual(['sdp-editor-tools', 'sdp-editor-document']);
  expect(container.querySelector('.sdp-editor-eines')).toBeNull();
  expect(classesDe(container.querySelector('article.content-wrapper'))).toEqual(['page-intro', 'cos']);
});

test('D13 · posicioEines i seedContent no arriben al DOM ni fan avisos de React', () => {
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  const { container } = editor({ posicioEines: 'davall-entradilla', seedContent: '<p>Llavor</p>' });
  expect(container.querySelector('[posicioeines], [posicioEines], [seedcontent], [seedContent]')).toBeNull();
  const avisos = errors.mock.calls.map((crida) => crida.map(String).join(' '));
  expect(avisos.filter((text) => /posicioEines|seedContent/i.test(text))).toEqual([]);
});

test('llavor del cos: sense seedContent val LLAVOR_NOTA (el Bloc no la passa); un valor explícit mana, també null', () => {
  editor({});
  expect(mocks.richText).toHaveBeenLastCalledWith(expect.objectContaining({ seedContent: mocks.llavorNota }));
  cleanup();
  editor({ seedContent: undefined });
  expect(mocks.richText).toHaveBeenLastCalledWith(expect.objectContaining({ seedContent: mocks.llavorNota }));
  cleanup();
  editor({ seedContent: null });
  expect(mocks.richText).toHaveBeenLastCalledWith(expect.objectContaining({ seedContent: null }));
  cleanup();
  editor({ seedContent: '<p>Llavor</p>' });
  expect(mocks.richText).toHaveBeenLastCalledWith(expect.objectContaining({ seedContent: '<p>Llavor</p>' }));
});

test('cap botó EDITAR dins de l’editor, ni amb document ni a l’estat buit', () => {
  const ambDocument = editor({});
  expect(ambDocument.container.textContent).not.toMatch(/EDITAR/);
  ambDocument.unmount();
  const buit = render(<DocumentEditor adapter={{ document: null, emptyDocument: { title: 'Benvinguda' } }} />);
  expect(buit.container.textContent).not.toMatch(/EDITAR/);
});

test('punt 7 · la botonera de classificació va davall del títol, i la llicència davall de la botonera', () => {
  const { container } = editor({
    classificacio: <div data-testid="botonera">Botonera</div>,
    llicencia: <button type="button">Llicència</button>
  });
  const capcalera = container.querySelector('header.page-title');
  const ranura = capcalera.querySelector('.page-title-classificacio');
  expect(ranura.previousElementSibling.tagName).toBe('H1');
  expect(ranura.children).toHaveLength(2);
  expect(ranura.firstElementChild.dataset.testid).toBe('botonera');
  expect(ranura.lastElementChild.querySelector('button')?.textContent).toBe('Llicència');
  expect(capcalera.querySelector('.page-title-labels')).toBeNull();
});

test('sense botonera, l’editor conserva les píndoles de sempre', () => {
  const { container } = editor({});
  expect(container.querySelector('header.page-title .page-title-labels')).not.toBeNull();
  expect(container.querySelector('.page-title-classificacio')).toBeNull();
});

/* ── T41 (ordre del Mestre, 260928) · PUBLICAR i la bola del món ────────── */
const publicar = () => screen.getByRole('button', { name: 'Publicar' });

test('T41 · PUBLICAR obri el selector de visibilitat i NO publica', () => {
  const publish = vi.fn();
  const onTria = vi.fn();
  editor({ publish, visibilitat: { onTria } });
  expect(publicar().getAttribute('aria-haspopup')).toBe('dialog');
  expect(screen.queryByRole('dialog')).toBeNull();
  act(() => { fireEvent.click(publicar()); });
  expect(screen.getByRole('dialog', { name: 'Qui ho pot vore?' })).toBeTruthy();
  expect(publish).not.toHaveBeenCalled();
  expect(onTria).not.toHaveBeenCalled();
});

test('T41 · la bola del món de la barra taronja obri el mateix selector (una sola instància)', () => {
  const { container } = editor({});
  const bola = container.querySelector('.bar-orange button[aria-haspopup="dialog"].btn-icon-orange');
  expect(bola.getAttribute('aria-label')).toBe('Privat: canviar la visibilitat');
  act(() => { fireEvent.click(bola); });
  expect(screen.getAllByRole('dialog')).toHaveLength(1);
  expect(bola.getAttribute('aria-expanded')).toBe('true');
  // Germà de la closca, fora de la barra taronja (que T38 amaga en mòbil).
  expect(screen.getByRole('dialog').closest('.bar-orange')).toBeNull();
});

test('T41 · confirmar crida visibilitat.onTria(publica, document) i tanca', async () => {
  const onTria = vi.fn().mockResolvedValue(true);
  editor({ visibilitat: { onTria } });
  act(() => { fireEvent.click(publicar()); });
  const dialeg = screen.getByRole('dialog');
  act(() => { fireEvent.click(within(dialeg).getByRole('radio', { name: /Públic/ })); });
  await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Fer-lo públic' })); });
  expect(onTria).toHaveBeenCalledWith(true, DOC);
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('T41 · sense adaptador de visibilitat: «pública» crida publish(document); un document públic no es pot fer privat', async () => {
  const publish = vi.fn().mockResolvedValue(true);
  editor({ publish });
  act(() => { fireEvent.click(publicar()); });
  act(() => { fireEvent.click(within(screen.getByRole('dialog')).getByRole('radio', { name: /Públic/ })); });
  await act(async () => { fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Fer-lo públic' })); });
  expect(publish).toHaveBeenCalledWith(DOC);
  cleanup();
  render(<DocumentEditor adapter={{ document: { ...DOC, isPublished: true }, publish }} />);
  act(() => { fireEvent.click(publicar()); });
  expect(within(screen.getByRole('dialog')).getByRole('radio', { name: /Privat/ }).disabled).toBe(true);
});

test('T41 · en canviar de document (Perfil, sense key per identitat), el selector es tanca sol', () => {
  const adapter = { document: DOC, visibilitat: { onTria: vi.fn() } };
  const { rerender } = render(<DocumentEditor adapter={adapter} />);
  act(() => { fireEvent.click(publicar()); });
  expect(screen.getByRole('dialog')).toBeTruthy();
  rerender(<DocumentEditor adapter={{ ...adapter, document: { ...DOC, id: 'd2' } }} />);
  expect(screen.queryByRole('dialog')).toBeNull();
  // Tornar al primer document no el torna a obrir.
  rerender(<DocumentEditor adapter={adapter} />);
  expect(screen.queryByRole('dialog')).toBeNull();
});

/* ── T40 (ordre del Mestre, 260928) · la data de publicació ─────────────── */
test('T40 · amb ambDataPublicacio, triar un dia desa publishDate per updateLocal i saveRemote', () => {
  const updateLocal = vi.fn();
  const saveRemote = vi.fn();
  const { container } = editor({ ambDataPublicacio: true, updateLocal, saveRemote });
  const pastilla = container.querySelector('.bar-orange .btn-date-time');
  expect(pastilla.tagName).toBe('BUTTON');
  act(() => { fireEvent.click(pastilla); });
  const dialeg = screen.getByRole('dialog', { name: 'Data de publicació' });
  act(() => { fireEvent.click(dialeg.querySelector('.sdp-calendari__dia')); });
  expect(updateLocal).toHaveBeenCalledWith('d1', 'publishDate', expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/));
  expect(saveRemote).toHaveBeenCalledWith('d1', 'publishDate', updateLocal.mock.calls[0][2]);
});

test('T40 · avisDataPublicacio arriba dins del calendari; sense ambDataPublicacio no es pinta', () => {
  const avis = 'Al servidor encara no hi ha on guardar la data de publicació.';
  const { container } = editor({ ambDataPublicacio: true, avisDataPublicacio: avis });
  act(() => { fireEvent.click(container.querySelector('.bar-orange .btn-date-time')); });
  const dialeg = screen.getByRole('dialog', { name: 'Data de publicació' });
  expect(within(dialeg).getByRole('status').textContent).toContain(avis);
  cleanup();
  const perfil = editor({ avisDataPublicacio: avis });
  expect(perfil.container.querySelector('.bar-orange .btn-date-time').tagName).toBe('TIME');
  expect(document.body.textContent).not.toContain(avis);
});

test('T40 · sense ambDataPublicacio (el Perfil), la data continua sent el <time> de sempre', () => {
  const { container } = editor({});
  expect(container.querySelector('.bar-orange .btn-date-time').tagName).toBe('TIME');
});

test('T40 · l’estat buit ja no pinta cap passarel·la d’identitat a la barra taronja', () => {
  const buit = render(<DocumentEditor adapter={{ document: null, emptyDocument: { title: 'Fitxa' }, identityActions: <div className="perfil-selector" /> }} />);
  expect(buit.container.querySelector('.perfil-selector')).toBeNull();
  expect(buit.container.querySelector('.bar-orange .btn-date-time')).not.toBeNull();
});

/* T65 (decisió del Mestre, 260928: «Editable, signa Sóc de Poble») · L'estat
   buit pinta a la barra taronja l'autoria que li dona l'adaptador (NotesEditor
   hi passa la de la nota de benvinguda): nom, poble i avatar oficial. */
test('T65 · l’estat buit signa a la barra taronja amb el nom, el poble i l’avatar de l’adaptador', () => {
  const logo = '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg';
  const buit = render(<DocumentEditor adapter={{
    document: null, emptyDocument: { title: 'Bloc de notes' },
    barAuthorName: 'Sóc de Poble', barAuthorLocation: 'La Torre de les Maçanes', barAuthorAvatar: logo
  }} />);
  const barra = buit.container.querySelector('.bar-orange');
  expect(barra.querySelector('.sp-card-author-name').textContent).toBe('Sóc de Poble');
  expect(barra.querySelector('.sp-card-author-location').textContent).toBe('La Torre de les Maçanes');
  expect(barra.querySelector('img.sp-card-avatar').getAttribute('src')).toBe(logo);
  // Amb avatar, la silueta de reserva queda amagada.
  expect(barra.querySelector('.sp-card-avatar--fallback').classList.contains('sp-card-avatar--amagat')).toBe(true);
});

/* Ordre del Mestre (261007) · «Quan isquen, les barres taronges han de portar
   a la pàgina de l'autor que l'ha creada». La clau barAuthorHref de
   l'adaptador fa de l'autoria (avatar i nom) un enllaç, a l'editor i a
   l'estat buit. Sense la clau (o amb null), el DOM de sempre. */
const autoriaDe = (container) => container.querySelector('section.bar-orange > .sp-card-author');

test('261007 · amb barAuthorHref, l’autoria de la barra taronja de l’editor porta a la pàgina de qui signa', () => {
  const { container } = editor({ barAuthorName: 'Pep', barAuthorLocation: 'La Torre', barAuthorHref: '/gent/U' });
  const autor = autoriaDe(container);
  expect(autor.matches('a.sp-card-author.sp-card-author-link')).toBe(true);
  expect(autor.getAttribute('href')).toBe('/gent/U');
  expect(autor.querySelector('.sp-card-author-name').textContent).toBe('Pep');
  expect(autor.querySelector('.sp-card-author-location').textContent).toBe('La Torre');
  // La clau no arriba al DOM com a atribut.
  expect(container.querySelector('[barauthorhref], [barAuthorHref]')).toBeNull();
});

test('261007 · a l’estat buit, barAuthorHref també fa de l’autoria un enllaç', () => {
  const { container } = render(<DocumentEditor adapter={{
    document: null, emptyDocument: { title: 'Bloc de notes' },
    barAuthorName: 'Sóc de Poble', barAuthorLocation: 'La Torre de les Maçanes', barAuthorHref: '/projecte'
  }} />);
  const autor = autoriaDe(container);
  expect(autor.matches('a.sp-card-author-link')).toBe(true);
  expect(autor.getAttribute('href')).toBe('/projecte');
  expect(autor.querySelector('.sp-card-author-name').textContent).toBe('Sóc de Poble');
});

test('261007 · sense barAuthorHref (o amb null), l’autoria amb nom continua sent el <div> de sempre', () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 7, 1, 0));
  try {
    const senseClau = editor({ barAuthorName: 'Pep' });
    const autor = autoriaDe(senseClau.container);
    expect(autor.tagName).toBe('DIV');
    expect(autor.className).toBe('sp-card-author');
    expect(senseClau.container.querySelector('.bar-orange a')).toBeNull();
    const html = senseIds(senseClau.container.innerHTML);
    cleanup();
    const ambNull = editor({ barAuthorName: 'Pep', barAuthorHref: null });
    expect(senseIds(ambNull.container.innerHTML)).toBe(html);
    cleanup();
    // L'estat buit amb nom i sense ruta tampoc s'inventa cap enllaç.
    const buit = render(<DocumentEditor adapter={{ document: null, emptyDocument: { title: 'Fitxa' }, barAuthorName: 'Pep' }} />);
    expect(autoriaDe(buit.container).tagName).toBe('DIV');
  } finally {
    vi.useRealTimers();
  }
});

/* ── T51 (ordre del Mestre, 260928) · data sempre plena i espai central ── */
test('T51 · l’estat buit porta la data I l’hora d’ara (abans només l’hora), en un <time> amb dateTime', () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 28, 10, 7));
  try {
    const buit = render(<DocumentEditor adapter={{ document: null, emptyDocument: { title: 'Fitxa' } }} />);
    const pastilla = buit.container.querySelector('.bar-orange .btn-date-time');
    expect(pastilla.tagName).toBe('TIME');
    expect([...pastilla.querySelectorAll('span')].map((s) => s.textContent)).toEqual(['10:07', '28/09/26']);
    expect(pastilla.getAttribute('datetime')).toBe('2026-09-28T10:07');
    // L'estat buit és lectura: cap botó d'emoticona ni ploma.
    expect(buit.container.querySelector('.bar-orange .sdp-emoticona-barra--boto')).toBeNull();
  } finally {
    vi.useRealTimers();
  }
});

test('T51 · les claus emoticona i onObriEmoticona de l’adaptador arriben a l’espai central de la barra', () => {
  const onObriEmoticona = vi.fn();
  const { container } = editor({ emoticona: '🌿', onObriEmoticona });
  const boto = container.querySelector('.bar-orange > .sdp-emoticona-barra--boto');
  expect(boto.textContent).toBe('🌿');
  act(() => { fireEvent.click(boto); });
  expect(onObriEmoticona).toHaveBeenCalledTimes(1);
  // No arriben al DOM com a atributs.
  expect(container.querySelector('[emoticona], [onobriemoticona]')).toBeNull();
  cleanup();
  // Sense les claus (una fitxa sense camp d'emoticona), la cel·la buida de lectura.
  const senseCamp = editor({});
  expect(senseCamp.container.querySelector('.bar-orange > .sdp-emoticona-barra--buida')).not.toBeNull();
});

/* T66b (sdp-pedra-seca §10: «en lectura, l'emoticona triada») · L'estat buit
   és lectura: pinta l'emoticona que dona l'adaptador (la fitxa d'una persona
   en baixa o de reserva) i, sense, la cel·la buida. Mai el botó ni la ploma,
   encara que l'adaptador porte onObriEmoticona. */
const buitAmb = (claus) => render(<DocumentEditor adapter={{ document: null, emptyDocument: { title: 'Fitxa' }, ...claus }} />);

test('T66b · l’estat buit pinta en lectura l’emoticona de l’adaptador, sense botó', () => {
  const onObriEmoticona = vi.fn();
  const { container } = buitAmb({ emoticona: '🌾', onObriEmoticona });
  const barra = container.querySelector('section.bar-orange');
  /* Derogat per l'ordre del Mestre del 261004 (prompt 261004_0515) · T6: l'autor per
     defecte de l'estat buit enllaça a /projecte, i l'autoria porta la classe de l'enllaç. */
  expect([...barra.children].map((e) => e.className)).toEqual(['sp-card-author sp-card-author-link', 'sdp-emoticona-barra sdp-emoticona-barra--glif', 'bar-actions']);
  const glif = barra.querySelector('.sdp-emoticona-barra--glif');
  expect(glif.getAttribute('role')).toBe('img');
  expect(glif.getAttribute('aria-label')).toBe('Emoticona del document: 🌾');
  expect(glif.textContent).toBe('🌾');
  expect(barra.querySelector('button.sdp-emoticona-barra--boto')).toBeNull();
  expect(barra.querySelector('svg.lucide-feather')).toBeNull();
  expect(onObriEmoticona).not.toHaveBeenCalled();
  // La clau no arriba al DOM com a atribut.
  expect(container.querySelector('[emoticona], [onobriemoticona]')).toBeNull();
});

test('T66b · a l’estat buit, sense emoticona (o amb text que no és un emoji), la cel·la buida de sempre', () => {
  for (const emoticona of [undefined, '', 'tomaca']) {
    const { container } = buitAmb({ emoticona });
    expect(container.querySelector('section.bar-orange > .sdp-emoticona-barra--buida'), String(emoticona)).not.toBeNull();
    expect(container.querySelector('.sdp-emoticona-barra--glif'), String(emoticona)).toBeNull();
    expect(container.querySelector('.sdp-emoticona-barra--boto'), String(emoticona)).toBeNull();
    cleanup();
  }
});

/* ── T50 (decisió del Mestre, 260928: «Llista + dreta si hi cap») ──────── */
test('T50 · sense la clau targetaViva, el DOM de sempre: cap embolcall, cap aside ni xip «Vista targeta»', () => {
  const { container } = editor({ updateLocal: vi.fn() });
  expect(container.querySelector('.sdp-editor-amb-targeta')).toBeNull();
  expect(container.querySelector('.sdp-targeta-viva')).toBeNull();
  expect(container.querySelector('.sp-card')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Vista targeta' })).toBeNull();
  // La closca continua sent filla directa del contenidor de l'editor.
  expect(container.querySelector('.sdp-editor-shell-atomic').parentElement).toBe(container);
});

test('T50 · amb targetaViva, la closca i l’aside de la targeta viuen dins d’un embolcall constant', () => {
  const { container } = editor({ targetaViva: true, updateLocal: vi.fn(), barAuthorName: 'Pep', barAuthorLocation: 'La Torre' });
  const graella = container.querySelector('.sdp-editor-amb-targeta > .sdp-editor-amb-targeta__graella');
  expect([...graella.children].map((e) => e.className)).toEqual(['sdp-editor-shell-atomic', 'sdp-targeta-viva']);
  const aside = graella.querySelector('aside.sdp-targeta-viva');
  expect(aside.getAttribute('aria-label')).toBe('Previsualització de la targeta');
  const targeta = aside.querySelector('article.sp-card.sp-card--pla');
  expect(targeta.querySelector('.sp-card-title').textContent).toBe('Títol');
  // Signa com la barra taronja i porta les mateixes píndoles.
  expect(targeta.querySelector('.sp-card-author-name').textContent).toBe('Pep');
  expect(targeta.querySelector('.sp-card-author-location').textContent).toBe('La Torre');
  expect(within(targeta).getByText('Sistema')).toBeTruthy();
  // La clau no arriba al DOM.
  expect(container.querySelector('[targetaviva], [targetaViva]')).toBeNull();
});

test('T50 · en tornar a pintar amb el mateix id, la targeta canvia i la closca (i TipTap) és el mateix node', () => {
  const adapter = { document: DOC, labels: [], targetaViva: true, updateLocal: vi.fn() };
  const { container, rerender } = render(<DocumentEditor adapter={adapter} />);
  const shell = container.querySelector('.sdp-editor-shell-atomic');
  const cos = screen.getByTestId('cos');
  rerender(<DocumentEditor adapter={{ ...adapter, document: { ...DOC, title: '<p>Tomaques&nbsp;<b>de penjar</b></p>', icon: '🍅' } }} />);
  expect(container.querySelector('.sdp-targeta-viva .sp-card-title').textContent).toBe('Tomaques de penjar');
  expect(container.querySelector('.sdp-targeta-viva .sdp-emoticona-barra').textContent).toBe('🍅');
  expect(container.querySelector('.sdp-editor-shell-atomic')).toBe(shell);
  expect(screen.getByTestId('cos')).toBe(cos);
});

test('T50 · el xip «Vista targeta» va davall del títol, amb Vista A4, i obri la targeta en un diàleg', () => {
  const { container } = editor({ targetaViva: true, updateLocal: vi.fn() });
  const control = container.querySelector('header.page-title .sdp-copyright-control');
  const xip = within(control).getByRole('button', { name: 'Vista targeta' });
  const botons = within(control).getAllByRole('button').map((b) => b.textContent);
  expect(botons.slice(-3)).toEqual(['Vista A4 / PDF', 'Crear portada', 'Vista targeta']);
  act(() => { fireEvent.click(xip); });
  const dialeg = screen.getByRole('dialog', { name: 'Vista targeta' });
  expect(dialeg.querySelector('.sp-card-title').textContent).toBe('Títol');
  // Els botons de la targeta no fan res: l'avís de previsualització.
  act(() => { fireEvent.click(within(dialeg).getByRole('button', { name: /Comentar Títol/ })); });
  expect(screen.getByRole('dialog', { name: 'Això és una previsualització' })).toBeTruthy();
});

/* Poliment T50 (revisió de W3B1, D3) · La clau avisTargetaViva porta els textos
   del consumidor a l'aside i al xip. Els diàlegs tancats ja són al DOM: es
   llig la descripció de cadascun (la del xip és la germana del botó). */
const descripcioDe = (dialeg) => dialeg.querySelector('.sdp-dialeg__descripcio').textContent;
const dialegsDeLaTargeta = (container) => {
  const aside = container.querySelector('aside.sdp-targeta-viva');
  const xip = within(container.querySelector('header.page-title .sdp-copyright-control')).getByRole('button', { name: 'Vista targeta' });
  return { aside, xip, avisAside: aside.querySelector('dialog'), vista: xip.nextElementSibling };
};
const senseIds = (html) => html.replace(/:r[0-9a-z]+:/g, ':id:');

test('T50 · sense avisTargetaViva, l’aside i el xip conserven la reserva; null és el mateix DOM que sense la clau', () => {
  /* Rellotge fix: la pastilla i la targeta pinten l'hora d'ara (regla
     d'edició) i un canvi de minut entre els dos renders no pot tombar la prova. */
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 28, 10, 7));
  try {
    const { container } = editor({ targetaViva: true, updateLocal: vi.fn() });
    const { avisAside, vista } = dialegsDeLaTargeta(container);
    expect(descripcioDe(avisAside)).toBe(AVIS_PREVISUALITZACIO.descripcio);
    expect(descripcioDe(vista)).toBe(AVIS_PREVISUALITZACIO.vista);
    const senseClau = senseIds(container.innerHTML);
    cleanup();
    const ambNull = editor({ targetaViva: true, updateLocal: vi.fn(), avisTargetaViva: null });
    expect(senseIds(ambNull.container.innerHTML)).toBe(senseClau);
  } finally {
    vi.useRealTimers();
  }
});

test('T50 · amb avisTargetaViva, l’aside i el xip diuen el text del consumidor; la clau no arriba al DOM', () => {
  const avis = AVISOS_TARGETA_VIVA.notes;
  const { container } = editor({ targetaViva: true, updateLocal: vi.fn(), avisTargetaViva: avis });
  const { aside, xip, avisAside, vista } = dialegsDeLaTargeta(container);
  expect(descripcioDe(avisAside)).toBe(avis.descripcio);
  expect(descripcioDe(vista)).toBe(avis.vista);
  // Una acció de l'aside obri l'avís del consumidor.
  act(() => { fireEvent.click(within(aside).getByRole('button', { name: /Comentar Títol/ })); });
  expect(descripcioDe(screen.getByRole('dialog', { name: avis.titol }))).toBe(avis.descripcio);
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'Entesos' })); });
  // La targeta del diàleg del xip també el rep.
  act(() => { fireEvent.click(xip); });
  const dialeg = screen.getByRole('dialog', { name: 'Vista targeta' });
  act(() => { fireEvent.click(within(dialeg).getByRole('button', { name: /Comentar Títol/ })); });
  expect(descripcioDe(screen.getByRole('dialog', { name: avis.titol }))).toBe(avis.descripcio);
  expect(container.querySelector('[avistargetaviva], [avisTargetaViva]')).toBeNull();
  expect(container.innerHTML).not.toContain(AVIS_PREVISUALITZACIO.vista);
});

test('T50 · amb la vista de drets oberta, l’embolcall s’amaga sencer (--drets) i la closca continua muntada', () => {
  const { container } = editor({ targetaViva: true, updateLocal: vi.fn(), saveRemote: vi.fn() });
  const shell = container.querySelector('.sdp-editor-shell-atomic');
  act(() => { fireEvent.click(botoDrets()); });
  const embolcall = container.querySelector('.sdp-editor-amb-targeta');
  expect(embolcall.classList.contains('sdp-editor-amb-targeta--drets')).toBe(true);
  expect(container.querySelector('section.sdp-drets').nextElementSibling).toBe(embolcall);
  expect(container.querySelector('.sdp-editor-shell-atomic')).toBe(shell);
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'Tornar al document' })); });
  expect(embolcall.className).toBe('sdp-editor-amb-targeta');
});

/* jsdom no calcula @container: es comprova la regla escrita (com PageFrame.capes). */
const cssNet = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
const blocQueConte = (text, obertura, regla) => {
  for (let obri = text.indexOf(obertura); obri >= 0; obri = text.indexOf(obertura, obri + 1)) {
    let fons = 0;
    for (let i = text.indexOf('{', obri); i < text.length; i += 1) {
      if (text[i] === '{') fons += 1;
      else if (text[i] === '}' && (fons -= 1) === 0) {
        const bloc = text.slice(obri, i + 1);
        if (bloc.includes(regla)) return bloc;
        break;
      }
    }
  }
  return '';
};

test('T50 · CSS: contenidor amb nom, aside només a partir de 60rem (i el xip amagat), xarxa sense @container', () => {
  const components = cssNet('src/css/components.css');
  const tokens = cssNet('src/css/tokens.css');
  expect(tokens).toMatch(/--sdp-targeta-viva-ample: [\d.]+rem;/);
  const capa = blocQueConte(components, '@layer components {', '.sdp-editor-amb-targeta {');
  expect(capa).toContain('container: sdp-editor-targeta / inline-size;');
  // Fora del @container (Chrome 100 i Firefox 100): cap aside, el xip es veu.
  expect(capa).toContain('.sdp-targeta-viva { display: none; }');
  expect(capa).toContain('.sdp-editor-amb-targeta--drets { display: none; }');
  expect(capa).toContain('.sdp-editor-amb-targeta .sdp-boto-targeta-viva { display: var(--targeta-viva-xip, inline-flex); }');
  const ample = blocQueConte(capa, '@container sdp-editor-targeta (min-width: 60rem) {', '.sdp-targeta-viva {');
  expect(ample).toContain('grid-template-columns: minmax(0, 1fr) var(--sdp-targeta-viva-ample);');
  expect(ample).toContain('display: block;');
  expect(ample).toContain('overflow-y: auto;');
  // El xip no consulta cap contenidor (Chrome no la reavaluava dins d'un altre
  // contenidor): la graella, filla directa, li passa `none` per herència.
  expect(ample).toContain('--targeta-viva-xip: none;');
  expect(ample).not.toContain('.sdp-boto-targeta-viva');
  // Cap @container sense nom per a la targeta viva: consultaria la pàgina, no l'editor.
  expect(blocQueConte(components, '@container (', '.sdp-targeta-viva')).toBe('');
});

test('T50 · a l’estat buit (sense document) no hi ha targeta viva: la UniversalPage de sempre', () => {
  const buit = render(<DocumentEditor adapter={{ document: null, emptyDocument: { title: 'Fitxa' }, targetaViva: true }} />);
  expect(buit.container.querySelector('.sdp-editor-amb-targeta')).toBeNull();
  expect(buit.container.querySelector('.sdp-targeta-viva')).toBeNull();
  expect(buit.container.firstElementChild.className).toBe('sdp-editor-shell-atomic');
});

/* ── T39 (ordre del Mestre, 260928) · drets d'autor a pantalla completa ─── */
const botoDrets = () => screen.getByRole('button', { name: /Elegir drets d'autor/ });

test('T39 · el botó de sempre obri la vista dins de la columna; la closca s’amaga però continua MUNTADA', () => {
  const { container } = editor({ updateLocal: vi.fn(), saveRemote: vi.fn() });
  const shell = container.querySelector('.sdp-editor-shell-atomic');
  const cos = screen.getByTestId('cos');
  expect(botoDrets().className).toBe('sdp-classificacio-pindola');
  expect(botoDrets().getAttribute('aria-haspopup')).toBeNull();
  expect(container.querySelector('section.sdp-drets')).toBeNull();
  act(() => { fireEvent.click(botoDrets()); });
  const vista = container.querySelector('section.sdp-drets');
  expect(vista).not.toBeNull();
  // Germana ABANS de la closca, dins de la mateixa columna; cap diàleg.
  expect(vista.nextElementSibling).toBe(shell);
  expect(screen.queryByRole('dialog')).toBeNull();
  // La mateixa closca i el mateix cos (TipTap no es desmunta), només amagada.
  expect(container.querySelector('.sdp-editor-shell-atomic')).toBe(shell);
  expect(shell.classList.contains('sdp-editor-shell-atomic--amagat')).toBe(true);
  expect(screen.getByTestId('cos')).toBe(cos);
  expect(classesDe(shell)).toEqual(['sdp-editor-tools', 'sdp-editor-document']);
});

test('T39 · desar passa pel camí de sempre (updateLocal + saveRemote), tanca la vista i torna el focus al botó', () => {
  const updateLocal = vi.fn();
  const saveRemote = vi.fn();
  const { container } = editor({ updateLocal, saveRemote });
  const boto = botoDrets();
  act(() => { fireEvent.click(boto); });
  const vista = within(container.querySelector('section.sdp-drets'));
  act(() => { fireEvent.click(vista.getByRole('radio', { name: /^CC BY 4\.0/ })); });
  act(() => { fireEvent.click(vista.getByRole('button', { name: 'Desar autoria' })); });
  expect(updateLocal).toHaveBeenCalledWith('d1', 'copyright', 'CC BY 4.0');
  expect(saveRemote).toHaveBeenCalledWith('d1', 'copyright', 'CC BY 4.0');
  expect(container.querySelector('section.sdp-drets')).toBeNull();
  const shell = container.querySelector('.sdp-editor-shell-atomic');
  expect(shell.className).toBe('sdp-editor-shell-atomic');
  expect(document.activeElement).toBe(boto);
});

test('T39 · Escape i «Tornar al document» tornen sense desar res', () => {
  const updateLocal = vi.fn();
  const saveRemote = vi.fn();
  const { container } = editor({ updateLocal, saveRemote });
  act(() => { fireEvent.click(botoDrets()); });
  act(() => { fireEvent.keyDown(container.querySelector('section.sdp-drets'), { key: 'Escape' }); });
  expect(container.querySelector('section.sdp-drets')).toBeNull();
  act(() => { fireEvent.click(botoDrets()); });
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'Tornar al document' })); });
  expect(container.querySelector('section.sdp-drets')).toBeNull();
  expect(updateLocal).not.toHaveBeenCalled();
  expect(saveRemote).not.toHaveBeenCalled();
});

/* Poliment T39 · T47 (ordre del Mestre, 260928) · Escape dins del text lliure
   tancava la vista i el text escrit es perdia. L'esborrany (tria i text) es
   conserva per document i torna en reobrir; la casella de CC0 no. «Cancel·lar»
   i desar el descarten; un altre document no l'hereta. */
test('T39 · Escape dins del text lliure no perd l’esborrany: en reobrir torna la tria i el text, sense la casella', () => {
  const updateLocal = vi.fn();
  const saveRemote = vi.fn();
  const adapter = { document: DOC, updateLocal, saveRemote };
  const { container, rerender } = render(<DocumentEditor adapter={adapter} />);
  const vista = () => within(container.querySelector('section.sdp-drets'));
  act(() => { fireEvent.click(botoDrets()); });
  act(() => { fireEvent.click(vista().getByRole('radio', { name: /Text lliure personalitzat/ })); });
  act(() => { fireEvent.click(vista().getByRole('checkbox')); });
  const area = vista().getByRole('textbox');
  act(() => { fireEvent.change(area, { target: { value: 'Fotos del Mas' } }); });
  act(() => { fireEvent.keyDown(area, { key: 'Escape' }); });
  expect(container.querySelector('section.sdp-drets')).toBeNull();
  expect(updateLocal).not.toHaveBeenCalled();
  act(() => { fireEvent.click(botoDrets()); });
  expect(vista().getByRole('radio', { name: /Text lliure personalitzat/ }).checked).toBe(true);
  expect(vista().getByRole('textbox').value).toBe('Fotos del Mas');
  expect(vista().getByRole('checkbox').checked).toBe(false);
  expect(vista().getByRole('status').textContent).toContain('Res no canvia fins que prems «Desar autoria»');
  // «Tornar al document» també el conserva; un altre document no l'hereta.
  act(() => { fireEvent.click(vista().getByRole('button', { name: 'Tornar al document' })); });
  rerender(<DocumentEditor adapter={{ ...adapter, document: { ...DOC, id: 'd2' } }} />);
  act(() => { fireEvent.click(botoDrets()); });
  // D15 (ordre del Mestre, 260930): d2 no té copyright i arriba com «© Sóc de
  // Poble», que ara preselecciona «Copyright (C)» amb el seu text. No hereta
  // l'esborrany «lliure» de d1.
  expect(vista().getByRole('radio', { name: /Copyright \(C\)/ }).checked).toBe(true);
  expect(vista().getByRole('textbox').value).toBe('© Sóc de Poble');
  expect(vista().queryByRole('status')).toBeNull();
  act(() => { fireEvent.click(vista().getByRole('button', { name: 'Tornar al document' })); });
  rerender(<DocumentEditor adapter={adapter} />);
  act(() => { fireEvent.click(botoDrets()); });
  expect(vista().getByRole('textbox').value).toBe('Fotos del Mas');
  // «Cancel·lar» el descarta: la vista torna a començar pel valor d'ara.
  act(() => { fireEvent.click(vista().getByRole('button', { name: 'Cancel·lar' })); });
  act(() => { fireEvent.click(botoDrets()); });
  // D15 · el valor d'ara («© Sóc de Poble») és «Copyright (C)» amb el seu text.
  expect(vista().getByRole('textbox').value).toBe('© Sóc de Poble');
  expect(vista().getByRole('radio', { name: /Copyright \(C\)/ }).checked).toBe(true);
});

test('T39 · desar descarta l’esborrany', () => {
  const updateLocal = vi.fn();
  const { container } = editor({ updateLocal, saveRemote: vi.fn() });
  const vista = () => within(container.querySelector('section.sdp-drets'));
  act(() => { fireEvent.click(botoDrets()); });
  act(() => { fireEvent.click(vista().getByRole('radio', { name: /^CC BY 4\.0/ })); });
  act(() => { fireEvent.click(vista().getByRole('button', { name: 'Desar autoria' })); });
  expect(updateLocal).toHaveBeenCalledWith('d1', 'copyright', 'CC BY 4.0');
  act(() => { fireEvent.click(botoDrets()); });
  expect(vista().queryByRole('status')).toBeNull();
});

test('T39 · dretsAutor arriba a la vista (herència) i no al DOM; l’autor per defecte és el de la barra taronja', () => {
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  const { container } = editor({
    updateLocal: vi.fn(), barAuthorName: 'Pep',
    dretsAutor: { ambit: 'publicacio', perDefecte: 'CC BY-SA 4.0' },
  });
  act(() => { fireEvent.click(botoDrets()); });
  const vista = within(container.querySelector('section.sdp-drets'));
  expect(vista.getByRole('status').textContent).toContain('«CC BY-SA 4.0»');
  // D15 · l'antetítol continua sent «© autor»; el nom de l'opció és «Copyright (C)».
  expect(vista.getByRole('radio', { name: /^© Pep Copyright \(C\)/ })).toBeTruthy();
  expect(container.querySelector('[dretsautor], [dretsAutor]')).toBeNull();
  expect(errors.mock.calls.map((c) => c.map(String).join(' ')).filter((t) => /dretsAutor/i.test(t))).toEqual([]);
});

test('T39 · en canviar de document la vista es tanca sola; sense updateLocal no hi ha botó', () => {
  const adapter = { document: DOC, updateLocal: vi.fn() };
  const { container, rerender } = render(<DocumentEditor adapter={adapter} />);
  act(() => { fireEvent.click(botoDrets()); });
  expect(container.querySelector('section.sdp-drets')).not.toBeNull();
  rerender(<DocumentEditor adapter={{ ...adapter, document: { ...DOC, id: 'd2' } }} />);
  expect(container.querySelector('section.sdp-drets')).toBeNull();
  expect(container.querySelector('.sdp-editor-shell-atomic--amagat')).toBeNull();
  cleanup();
  editor({});
  expect(screen.queryByRole('button', { name: /Elegir drets d'autor/ })).toBeNull();
});

/* ── Decisió del Mestre (261008) · drets d'autor dins de l'editor ───────────
   En edició, la línia del copyright de davall del títol obri la vista de
   drets (no porta a /page/drets-autor, que trau la persona de l'editor), i la
   píndola diu la llicència triada. En lectura (l'estat buit), en una
   connexió (ranura `llicencia`) i sense updateLocal, l'enllaç de sempre. */
const copyrightDeLaCapcalera = (container) => container.querySelector('header.page-title > p.sp-card-copyright.page-title-copyright');

test('261008 · en edició, el copyright de la capçalera és un botó que obri la vista de drets i no navega', () => {
  const { container } = editor({ updateLocal: vi.fn(), saveRemote: vi.fn() });
  const boto = copyrightDeLaCapcalera(container).firstElementChild;
  expect(boto.tagName).toBe('BUTTON');
  expect(boto.className).toBe('sp-card-copyright__enllac');
  expect(boto.hasAttribute('data-sdp-drets')).toBe(true);
  expect(boto.hasAttribute('href')).toBe(false);
  expect(boto.textContent).toBe('© Sóc de Poble');
  expect(boto.getAttribute('aria-label')).toBe("© Sóc de Poble: canviar els drets d'autor");
  expect(container.querySelector('a.sp-card-copyright__enllac')).toBeNull();
  const ruta = window.location.pathname;
  act(() => { fireEvent.click(boto); });
  expect(container.querySelector('section.sdp-drets')).not.toBeNull();
  expect(window.location.pathname).toBe(ruta);
  // La closca s'amaga però continua muntada (el mateix camí que la píndola).
  expect(container.querySelector('.sdp-editor-shell-atomic').classList.contains('sdp-editor-shell-atomic--amagat')).toBe(true);
});

test('261008 · en tornar de la vista oberta des del copyright, el focus torna al copyright; desar va pel camí de sempre', () => {
  const updateLocal = vi.fn();
  const saveRemote = vi.fn();
  const { container } = editor({ updateLocal, saveRemote });
  const boto = copyrightDeLaCapcalera(container).firstElementChild;
  act(() => { fireEvent.click(boto); });
  act(() => { fireEvent.click(screen.getByRole('button', { name: 'Tornar al document' })); });
  expect(container.querySelector('section.sdp-drets')).toBeNull();
  expect(document.activeElement).toBe(boto);
  act(() => { fireEvent.click(boto); });
  const vista = within(container.querySelector('section.sdp-drets'));
  act(() => { fireEvent.click(vista.getByRole('radio', { name: /^CC BY 4\.0/ })); });
  act(() => { fireEvent.click(vista.getByRole('button', { name: 'Desar autoria' })); });
  expect(updateLocal).toHaveBeenCalledWith('d1', 'copyright', 'CC BY 4.0');
  expect(saveRemote).toHaveBeenCalledWith('d1', 'copyright', 'CC BY 4.0');
  expect(document.activeElement).toBe(boto);
});

test('261008 · l’estat buit (lectura) i un document sense updateLocal conserven l’enllaç a /page/drets-autor', () => {
  const buit = render(<DocumentEditor adapter={{ document: null, emptyDocument: { title: 'Benvinguda', copyright: '© Sóc de Poble' }, updateLocal: vi.fn() }} />);
  const enllac = copyrightDeLaCapcalera(buit.container).firstElementChild;
  expect(enllac.tagName).toBe('A');
  expect(enllac.getAttribute('href')).toBe('/page/drets-autor');
  expect(buit.container.querySelector('[data-sdp-drets]')).toBeNull();
  cleanup();
  const senseEdicio = editor({});
  expect(copyrightDeLaCapcalera(senseEdicio.container).firstElementChild.tagName).toBe('A');
  expect(senseEdicio.container.querySelector('[data-sdp-drets]')).toBeNull();
});

test('261008 · una connexió (ranura llicencia, drets de l’original) conserva l’enllaç: cap botó de drets', () => {
  const { container } = editor({ updateLocal: vi.fn(), llicencia: <p className="sdp-llicencia-original">Drets de l’original</p> });
  const enllac = copyrightDeLaCapcalera(container).firstElementChild;
  expect(enllac.tagName).toBe('A');
  expect(enllac.getAttribute('href')).toBe('/page/drets-autor');
  expect(container.querySelector('[data-sdp-drets]')).toBeNull();
  // Un adaptador no pot colar onCanviaCopyright per ...rest: DocumentEditor mana després.
  cleanup();
  const colat = editor({ updateLocal: vi.fn(), llicencia: <p>Drets de l’original</p>, onCanviaCopyright: vi.fn() });
  expect(copyrightDeLaCapcalera(colat.container).firstElementChild.tagName).toBe('A');
});

test('261008 · sense llicència triada, la píndola de sempre: «Elegir drets d’autor», buida, amb data-sdp-drets', () => {
  const { container } = editor({ updateLocal: vi.fn() });
  const pindola = botoDrets();
  expect(pindola.hasAttribute('data-sdp-drets')).toBe(true);
  expect(pindola.getAttribute('aria-label')).toBeNull();
  expect(pindola.getAttribute('title')).toBe('© Sóc de Poble');
  expect(pindola.querySelector('.sp-card-label').className).toBe('sp-card-label sdp-badge-buit');
  // La reserva «© Sóc de Poble» no és cap llicència triada.
  expect(container.querySelector('.sdp-copyright-control').textContent).not.toContain('Drets d’autor:');
});

test('261008 · amb llicència triada, la píndola la mostra plena i diu «Drets d’autor: X»; un clic torna a obrir la vista', () => {
  const { container } = render(<DocumentEditor adapter={{ document: { ...DOC, copyright: 'CC BY 4.0' }, updateLocal: vi.fn(), saveRemote: vi.fn() }} />);
  expect(screen.queryByRole('button', { name: /Elegir drets d'autor/ })).toBeNull();
  const pindola = screen.getByRole('button', { name: "Drets d'autor: CC BY 4.0" });
  expect(pindola.className).toBe('sdp-classificacio-pindola');
  expect(pindola.hasAttribute('data-sdp-drets')).toBe(true);
  expect(pindola.querySelector('.sp-card-label').className).toBe('sp-card-label sdp-badge-system');
  expect(pindola.querySelector('.sdp-classificacio-pindola__text').textContent).toBe('CC BY 4.0');
  // La línia de la capçalera també la diu, i també obri la vista.
  expect(copyrightDeLaCapcalera(container).firstElementChild.getAttribute('aria-label')).toBe("CC BY 4.0: canviar els drets d'autor");
  act(() => { fireEvent.click(pindola); });
  const vista = within(container.querySelector('section.sdp-drets'));
  expect(vista.getByRole('radio', { name: /^CC BY 4\.0/ }).checked).toBe(true);
});

/* Correcció de la revisió (261008) · Al Perfil, document.copyright porta el
   «© Nom» de lectura (perfilCamps) encara que ningú no haja triat res, i les
   notes noves hereten la llicència per defecte. La clau dretsTriats diu la
   triada de veres: amb ella, la píndola no anuncia com a triat el que no ho és. */
test('261008 · dretsTriats mana en la píndola: buit o null, «Elegir drets d’autor» encara que document.copyright porte «© Pepa»', () => {
  const ambNom = { ...DOC, copyright: '© Pepa' };
  for (const dretsTriats of ['', null, '   ', 7]) {
    const { container, unmount } = render(<DocumentEditor adapter={{ document: ambNom, updateLocal: vi.fn(), dretsTriats }} />);
    const pindola = screen.getByRole('button', { name: /Elegir drets d'autor/ });
    expect(pindola.querySelector('.sp-card-label').className, String(dretsTriats)).toBe('sp-card-label sdp-badge-buit');
    expect(screen.queryByRole('button', { name: /^Drets d'autor:/ })).toBeNull();
    // La línia de la capçalera continua dient el copyright del document, i obri la vista.
    expect(copyrightDeLaCapcalera(container).firstElementChild.textContent).toBe('© Pepa');
    // La clau no arriba al DOM.
    expect(container.querySelector('[dretstriats], [dretsTriats]')).toBeNull();
    unmount();
  }
});

test('261008 · dretsTriats amb una llicència: la píndola plena la diu, encara que document.copyright en porte una altra', () => {
  render(<DocumentEditor adapter={{ document: { ...DOC, copyright: '© Pepa' }, updateLocal: vi.fn(), dretsTriats: 'CC BY-SA 4.0' }} />);
  const pindola = screen.getByRole('button', { name: "Drets d'autor: CC BY-SA 4.0" });
  expect(pindola.querySelector('.sp-card-label').className).toBe('sp-card-label sdp-badge-system');
  expect(pindola.querySelector('.sdp-classificacio-pindola__text').textContent).toBe('CC BY-SA 4.0');
});

test('261008 · sense la clau dretsTriats (Notes), el DOM de sempre: mana document.copyright', () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 8, 12, 0));
  try {
    const doc = { ...DOC, copyright: 'CC BY 4.0' };
    const senseClau = render(<DocumentEditor adapter={{ document: doc, updateLocal: vi.fn() }} />);
    expect(screen.getByRole('button', { name: "Drets d'autor: CC BY 4.0" })).toBeTruthy();
    const html = senseIds(senseClau.container.innerHTML);
    cleanup();
    const ambUndefined = render(<DocumentEditor adapter={{ document: doc, updateLocal: vi.fn(), dretsTriats: undefined }} />);
    expect(senseIds(ambUndefined.container.innerHTML)).toBe(html);
  } finally {
    vi.useRealTimers();
  }
});

/* ── CONTRACTE-3 (pla 261008_1201) · ambVistes ──────────────────────────── */
const botonsDelControl = (container) => [...container.querySelectorAll('header.page-title .sdp-copyright-control button')]
  .filter((b) => !b.closest('dialog')).map((b) => b.textContent);

test('CONTRACTE-3 · ambVistes={false}: ni Vista A4, ni Crear portada, ni el xip; el botó dels drets i l’aside es queden', () => {
  const { container } = editor({ targetaViva: true, updateLocal: vi.fn(), ambVistes: false });
  expect(botonsDelControl(container)).toEqual(["Elegir drets d'autor"]);
  expect(screen.queryByRole('button', { name: 'Vista A4 / PDF' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Crear portada' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Vista targeta' })).toBeNull();
  expect(container.querySelector('aside.sdp-targeta-viva .sp-card')).not.toBeNull();
  // La clau no arriba al DOM.
  expect(container.querySelector('[ambvistes], [ambVistes]')).toBeNull();
});

test('CONTRACTE-3 · ambVistes={true} és el DOM de sempre (el de sense la clau)', () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 8, 12, 0));
  try {
    const senseClau = editor({ targetaViva: true, updateLocal: vi.fn() });
    expect(botonsDelControl(senseClau.container).slice(-3)).toEqual(['Vista A4 / PDF', 'Crear portada', 'Vista targeta']);
    const html = senseIds(senseClau.container.innerHTML);
    cleanup();
    const ambTrue = editor({ targetaViva: true, updateLocal: vi.fn(), ambVistes: true });
    expect(senseIds(ambTrue.container.innerHTML)).toBe(html);
  } finally {
    vi.useRealTimers();
  }
});

test('CONTRACTE-3 · ambVistes={false} sense targeta viva ni drets (sense updateLocal): cap control buit davall del títol', () => {
  const { container } = editor({ ambVistes: false });
  expect(container.querySelector('.sdp-copyright-control')).toBeNull();
  expect(container.querySelector('.page-title-classificacio')).toBeNull();
});
