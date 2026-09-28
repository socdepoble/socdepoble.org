import React from 'react';
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
vi.mock('../../config/assetResolver', () => ({ resolveAsset: (uri) => uri }));
import { DocumentEditor } from './DocumentEditor.jsx';

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

/* ── T39 (ordre del Mestre, 260928) · drets d'autor a pantalla completa ─── */
const botoDrets = () => screen.getByRole('button', { name: /Elegir drets d'autor/ });

test('T39 · el botó de sempre obri la vista dins de la columna; la closca s’amaga però continua MUNTADA', () => {
  const { container } = editor({ updateLocal: vi.fn(), saveRemote: vi.fn() });
  const shell = container.querySelector('.sdp-editor-shell-atomic');
  const cos = screen.getByTestId('cos');
  expect(botoDrets().className).toBe('sdp-copyright-selector');
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
  expect(vista().queryByRole('textbox')).toBeNull();
  expect(vista().queryByRole('status')).toBeNull();
  act(() => { fireEvent.click(vista().getByRole('button', { name: 'Tornar al document' })); });
  rerender(<DocumentEditor adapter={adapter} />);
  act(() => { fireEvent.click(botoDrets()); });
  expect(vista().getByRole('textbox').value).toBe('Fotos del Mas');
  // «Cancel·lar» el descarta: la vista torna a començar pel valor d'ara.
  act(() => { fireEvent.click(vista().getByRole('button', { name: 'Cancel·lar' })); });
  act(() => { fireEvent.click(botoDrets()); });
  expect(vista().queryByRole('textbox')).toBeNull();
  expect(vista().getByRole('radio', { name: /Tots els drets reservats/ }).checked).toBe(true);
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
  expect(vista.getByRole('radio', { name: /^© Pep Tots els drets reservats/ })).toBeTruthy();
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
