import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import Conversa from './Conversa.jsx';
import { creaIdbFals } from '../../../utils/__fixtures__/navegadorFals.js';

const t = (_, alternativa) => alternativa;
const FIL = { id: 'iaia-local-00000000-0000-4000-8000-000000000077', tipus: 'iaia', sessioLocalIAIA: true, filLocalIAIA: true, name: 'Mercat', potEscriure: true };
beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value() { this.setAttribute('open', ''); } });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value() { this.removeAttribute('open'); this.dispatchEvent(new Event('close')); } });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); delete HTMLDialogElement.prototype.showModal; delete HTMLDialogElement.prototype.close; });
function pinta(onOblidaSessioIAIA, fil = FIL) {
  render(<MemoryRouter><AppGridContext.Provider value={{ mida: 'ample' }}><Conversa
    fil={fil} messages={[]} onSendMessage={vi.fn()} t={t} onOblidaSessioIAIA={onOblidaSessioIAIA}
  /></AppGridContext.Provider></MemoryRouter>);
}
function demanaOblit() {
  fireEvent.click(screen.getByRole('button', { name: 'Opcions de la conversa' }));
  fireEvent.click(screen.getByRole('menuitem', { name: 'Oblida esta conversa' }));
}
test('el menú del fil IAIA confirma amb el diàleg existent, cancel·lar no escriu i confirmar oblida el fil', async () => {
  const oblida = vi.fn().mockResolvedValue(true);
  pinta(oblida);
  demanaOblit();
  expect(screen.getByRole('dialog', { name: 'Oblida esta conversa' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel·lar' }));
  expect(oblida).not.toHaveBeenCalled();
  demanaOblit();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Oblida la conversa' })); });
  expect(oblida).toHaveBeenCalledExactlyOnceWith(FIL.id);
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});
test('quota fallida manté la confirmació oberta, anuncia l’error i permet tornar-ho a provar', async () => {
  const oblida = vi.fn().mockRejectedValueOnce(new DOMException('Quota', 'QuotaExceededError')).mockResolvedValue(true);
  pinta(oblida);
  demanaOblit();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Oblida la conversa' })); });
  expect(screen.getByRole('alert').textContent).toBe('No s’ha pogut oblidar la conversa. Torna-ho a provar.');
  expect(screen.getByRole('dialog')).toBeTruthy();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Oblida la conversa' })); });
  expect(oblida).toHaveBeenCalledTimes(2);
});
test('el xat públic de la IAIA sense respostes locals no oferix esborrar res', () => {
  pinta(vi.fn(), { ...FIL, id: 'public-iaia', tipus: 'grup', sessioLocalIAIA: false });
  fireEvent.click(screen.getByRole('button', { name: 'Opcions de la conversa' }));
  expect(screen.queryByRole('menuitem', { name: 'Oblida esta conversa' })).toBeNull();
});

/* R21 (carril f1) · honestedat_textos-07 i regressio_ui_xat-06. Cada via diu
   el que fa de veritat, i en confirmar el focus torna al «⋯» (WCAG 2.4.3),
   no a <body>, encara que ja no quede res per oblidar i l'acció desaparega. */
const contingutDelDisc = (fals) => JSON.stringify([...fals.bases].map(([nom, base]) => [
  nom, [...base.stores].map(([store, magatzem]) => [store, [...magatzem.files.values()]])
]));
const PUBLIC = { id: 'public-iaia', tipus: 'grup', name: 'IAIA MarIA', potEscriure: true, subjecte: { tipus: 'pagina', id: '/iaia' } };
const opcions = () => screen.getByRole('button', { name: 'Opcions de la conversa' });
const buida = () => act(async () => { for (let i = 0; i < 20; i += 1) await Promise.resolve(); });
async function pregunta(text) {
  const camp = screen.getByRole('textbox', { name: 'Escriu un missatge' });
  fireEvent.change(camp, { target: { value: text } });
  await act(async () => { fireEvent.keyDown(camp, { key: 'Enter' }); });
  await buida();
}

test('R21 · al xat públic, «Oblida les respostes de la IAIA» diu que les preguntes continuen al servidor, no toca IndexedDB, no deixa tornar una resposta tardana i torna el focus al «⋯»', async () => {
  const fals = creaIdbFals();
  const obri = vi.spyOn(fals.idb, 'open');
  vi.stubGlobal('indexedDB', fals.idb);
  vi.stubGlobal('BroadcastChannel', null);
  let tardana;
  const cervell = vi.fn((text) => (text === 'Segona' ? new Promise((r) => { tardana = r; }) : Promise.resolve('Resposta privada de prova')));
  render(<MemoryRouter><AppGridContext.Provider value={{ mida: 'ample' }}><Conversa
    fil={PUBLIC} messages={[]} onSendMessage={vi.fn().mockResolvedValue(undefined)} t={t} cortesiaIAIA respostaLocalIAIA={cervell}
  /></AppGridContext.Provider></MemoryRouter>);
  await pregunta('Primera');
  await pregunta('Segona');
  expect(screen.getByText('Resposta privada de prova')).toBeTruthy();

  fireEvent.click(opcions());
  expect(screen.queryByRole('menuitem', { name: 'Oblida esta conversa' })).toBeNull();
  fireEvent.click(screen.getByRole('menuitem', { name: 'Oblida les respostes de la IAIA' }));
  const dialeg = screen.getByRole('dialog', { name: 'Oblida les respostes de la IAIA' });
  expect(dialeg.textContent).toContain('Les preguntes que has enviat no s’esborren: continuen al servidor');
  expect(dialeg.textContent).not.toContain('títol guardat');
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Oblida les respostes' })); });
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(screen.queryByText('Resposta privada de prova')).toBeNull();
  expect(document.activeElement).toBe(opcions());
  expect(document.activeElement).not.toBe(document.body);

  await act(async () => { tardana('Resposta tardana'); });
  await buida();
  expect(screen.queryByText('Resposta tardana')).toBeNull();
  await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
  expect(obri.mock.calls.map(([nom]) => nom)).not.toContain('xat-iaia-titols');
  expect(contingutDelDisc(fals)).not.toContain('Resposta privada');
});

test('R21 · al fil principal iaia-local, el text diu que el dispositiu no en guarda cap còpia i el focus torna al «⋯» quan el fil es buida', async () => {
  const BENVINGUDA = { id: 'iaia-local:benvinguda', sender: 'other', author: 'IAIA MarIA', usuariId: 'iaia', is_ai: true, text: 'Benvinguda', creatAl: '2026-11-12T15:00:00.000Z' };
  const INICIALS = [
    BENVINGUDA,
    { id: 'iaia-local:p1', sender: 'me', author: 'Jo', text: 'Pregunta local', creatAl: '2026-11-12T15:01:00.000Z' },
    { id: 'iaia-local:p1:resposta', sender: 'other', author: 'IAIA MarIA', usuariId: 'iaia', is_ai: true, text: 'Resposta local', creatAl: '2026-11-12T15:01:01.000Z' }
  ];
  const oblida = vi.fn();
  function FilLocal() {
    const [missatges, posaMissatges] = useState(INICIALS);
    return <Conversa fil={{ id: 'iaia-local', tipus: 'iaia', filLocalIAIA: true, sessioLocalIAIA: false, name: 'IAIA MarIA', potEscriure: true }}
      messages={missatges} onSendMessage={vi.fn()} t={t}
      onOblidaSessioIAIA={async (id) => { oblida(id); posaMissatges([BENVINGUDA]); return true; }} />;
  }
  render(<MemoryRouter><AppGridContext.Provider value={{ mida: 'ample' }}><FilLocal /></AppGridContext.Provider></MemoryRouter>);
  demanaOblit();
  const dialeg = screen.getByRole('dialog', { name: 'Oblida esta conversa' });
  expect(dialeg.textContent).toContain('Este dispositiu no en guarda cap còpia.');
  expect(dialeg.textContent).not.toContain('títol guardat');
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Oblida la conversa' })); });
  expect(oblida).toHaveBeenCalledExactlyOnceWith('iaia-local');
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(screen.queryByText('Pregunta local')).toBeNull();
  expect(document.activeElement).toBe(opcions());
  fireEvent.click(opcions());
  expect(screen.queryByRole('menuitem', { name: 'Oblida esta conversa' })).toBeNull();
});
