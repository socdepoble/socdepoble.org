/* R32.6 · El mateix gest envia foto/vídeo i text. DOM i ports controlats:
   estes proves no acrediten selector, teclat ni HEIC d'un telèfon físic. */
import { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { AppGridContext } from '../../../components/layout/AppGridShell.jsx';
import { compartitPendent, descartaCompartit, lliuraCompartit, registraAlliberadorCompartit, triaDestiCompartit } from '../../../config/compartirNatiu.js';
import Compositor from './Compositor.jsx';
import ControlsAdjunt from './ControlsAdjunt.jsx';

const m = vi.hoisted(() => ({ preparaAdjunt: vi.fn() }));
vi.mock('../adjuntLocal.js', async (original) => ({ ...(await original()), preparaAdjunt: m.preparaAdjunt, mimeDeGravacio: () => null }));
vi.mock('../../../data/backendPort.js', () => ({ quotaXat: vi.fn(), teCapacitat: () => true, descartaAdjuntXat: vi.fn(), urlAdjuntXat: vi.fn() }));

const t = (_, alternativa) => alternativa;
const FIL = { id: 'fil-A' };
const FOTO = new File(['foto'], 'foto.jpg', { type: 'image/jpeg' });
const diferit = () => {
  let resolve, reject;
  const promise = new Promise((r, j) => { resolve = r; reject = j; });
  return { promise, resolve, reject };
};
let servei;
let ordre;
beforeEach(() => {
  vi.clearAllMocks(); descartaCompartit(); ordre = 0;
  servei = { teCapacitat: () => true, quotaXat: vi.fn().mockResolvedValue({ usats: 0, limit: 20_000_000 }) };
  m.preparaAdjunt.mockImplementation(async (fitxer) => ({ id: `adjunt-${++ordre}`, tipus: 'imatge', fitxer }));
  vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:preparat'), revokeObjectURL: vi.fn() });
  for (const metode of ['pause', 'load']) vi.spyOn(HTMLMediaElement.prototype, metode).mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
});
afterEach(() => { cleanup(); descartaCompartit(); registraAlliberadorCompartit(null); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

function Barra({ fil = FIL, inicial = '', onEnvia, onText = vi.fn(), onAdjunts = () => {}, ...props }) {
  const [valor, setValor] = useState(inicial);
  return <AppGridContext.Provider value={{ mida: 'ample' }}>
    <ControlsAdjunt fil={fil} servei={servei} usuariId="A" t={t} onEnvia={onEnvia}
      onTextOrfe={(text) => setValor((abans) => abans.trim() ? `${abans}\n\n${text}` : text)} {...props}>
      {(adjunts) => {
        onAdjunts(adjunts);
        return <Compositor fil={fil} valor={valor} onCanvia={setValor} onEnvia={() => { onText(valor); setValor(''); }} adjunts={adjunts} t={t} />;
      }}
    </ControlsAdjunt>
  </AppGridContext.Provider>;
}
const principal = () => screen.getByRole('textbox', { name: 'Escriu un missatge' });
const boto = () => document.querySelector('.sdp-xat-compositor__envia');
const peu = () => screen.getByRole('textbox', { name: 'Text del fitxer (opcional)' });
const canvia = (text) => fireEvent.change(principal(), { target: { value: text } });
const tria = async () => {
  await waitFor(() => expect(screen.getByRole('button', { name: 'Adjunta' }).hasAttribute('aria-disabled')).toBe(false));
  fireEvent.change(screen.getByLabelText('Tria una foto o un vídeo de fins a 60 segons'), { target: { files: [FOTO] } });
  await screen.findByRole('button', { name: 'Envia el fitxer' });
};
const ack = (_fil, adjunt) => Promise.resolve([{ id: adjunt.id, text: adjunt.text ?? null }]);

test('el selector conserva els formats i vídeos anteriors i admet fotos mòbils per MIME i extensió', async () => {
  render(<Barra onEnvia={vi.fn(ack)} />);
  const selector = await screen.findByLabelText('Tria una foto o un vídeo de fins a 60 segons');
  expect(selector.accept.split(',')).toEqual(expect.arrayContaining([
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/heic', 'image/heif',
    '.heic', '.heif', '.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', 'video/mp4', 'video/webm', 'video/quicktime', '.mp4', '.webm', '.mov'
  ]));
});

test.each(['imatge', 'video'])('%s i principal viatgen junts; només l’ACK amb el mateix text buida el camp', async (tipus) => {
  const pendent = diferit(); const onText = vi.fn();
  m.preparaAdjunt.mockResolvedValueOnce({ id: 'un-sol-id', tipus, fitxer: FOTO, duradaMs: tipus === 'video' ? 1_000 : undefined });
  const onEnvia = vi.fn(() => pendent.promise);
  render(<Barra inicial="  Mireu el cartell  " onEnvia={onEnvia} onText={onText} />);
  await tria(); fireEvent.click(boto());
  expect(onEnvia).toHaveBeenCalledOnce();
  expect(onEnvia.mock.calls[0][1]).toMatchObject({ id: 'un-sol-id', tipus, text: 'Mireu el cartell' });
  expect(principal().value).toBe('  Mireu el cartell  ');
  expect(onText).not.toHaveBeenCalled();
  await act(async () => pendent.resolve([{ id: 'un-sol-id', text: 'Mireu el cartell' }]));
  await waitFor(() => expect(principal().value).toBe(''));
  expect(screen.queryByRole('button', { name: 'Cancel·la' })).toBeNull();
});

test.each(['rebuig', 'array buit', 'sense retorn'])('%s conserva principal, adjunt i ID per al reintent', async (fallada) => {
  const onEnvia = vi.fn().mockImplementationOnce(() => fallada === 'rebuig' ? Promise.reject(new Error('Xarxa interrompuda')) : Promise.resolve(fallada === 'array buit' ? [] : undefined)).mockImplementation(ack);
  render(<Barra inicial="Per a vosaltres" onEnvia={onEnvia} />);
  await tria(); fireEvent.click(boto());
  await screen.findByRole('alert');
  expect(principal().value).toBe('Per a vosaltres');
  expect(screen.getByAltText('Foto adjunta')).toBeTruthy();
  fireEvent.click(boto());
  await waitFor(() => expect(principal().value).toBe(''));
  expect(onEnvia).toHaveBeenCalledTimes(2);
  expect(onEnvia.mock.calls[0][1]).toMatchObject({ id: 'adjunt-1', text: 'Per a vosaltres' });
  expect(onEnvia.mock.calls[1][1]).toMatchObject({ id: 'adjunt-1', text: 'Per a vosaltres' });
});

test('dos enviaments abans de repintar i Retorn mentre puja només fan una crida', async () => {
  const pendent = diferit(); const onEnvia = vi.fn(() => pendent.promise); let controls;
  render(<Barra inicial="Una vegada" onEnvia={onEnvia} onAdjunts={(a) => { controls = a; }} />);
  await tria();
  const accio = controls.primari.onClick;
  act(() => { accio({ text: 'Una vegada' }); accio({ text: 'Una vegada' }); });
  fireEvent.keyDown(principal(), { key: 'Enter' }); fireEvent.click(boto(), { detail: 2 });
  expect(onEnvia).toHaveBeenCalledOnce();
  await act(async () => pendent.resolve([{ id: 'adjunt-1', text: 'Una vegada' }]));
});

test('Retorn i submit, amb foto preparada, envien el fitxer i el principal sense missatge de text separat', async () => {
  const pendent = diferit(); const onText = vi.fn(); const onEnvia = vi.fn(() => pendent.promise);
  render(<Barra inicial="Amb teclat" onEnvia={onEnvia} onText={onText} />);
  await tria(); fireEvent.keyDown(principal(), { key: 'Enter' });
  fireEvent.submit(principal().closest('form'));
  expect(onEnvia).toHaveBeenCalledOnce(); expect(onText).not.toHaveBeenCalled();
  expect(onEnvia.mock.calls[0][1].text).toBe('Amb teclat');
  await act(async () => pendent.resolve([{ id: 'adjunt-1', text: 'Amb teclat' }]));
  await waitFor(() => expect(principal().value).toBe(''));
});

test('editar i desfer mentre puja conserva el principal encara que torne al mateix valor', async () => {
  const pendent = diferit();
  render(<Barra inicial="Primer text" onEnvia={vi.fn(() => pendent.promise)} />);
  await tria(); fireEvent.click(boto());
  canvia('Un altre text'); canvia('Primer text');
  await act(async () => pendent.resolve([{ id: 'adjunt-1', text: 'Primer text' }]));
  await waitFor(() => expect(screen.queryByAltText('Foto adjunta')).toBeNull());
  expect(principal().value).toBe('Primer text');
});

test('un ACK antic d’un reintent confirmat retira l’adjunt però conserva el principal editat', async () => {
  const onEnvia = vi.fn().mockRejectedValueOnce(new Error('ACK perdut')).mockResolvedValueOnce([{ id: 'adjunt-1', text: 'Text inicial' }]);
  render(<Barra inicial="Text inicial" onEnvia={onEnvia} />);
  await tria(); fireEvent.click(boto()); await screen.findByRole('alert');
  canvia('Text nou'); fireEvent.click(boto());
  await waitFor(() => expect(screen.queryByAltText('Foto adjunta')).toBeNull());
  expect(principal().value).toBe('Text nou');
  expect(onEnvia.mock.calls[1][1]).toMatchObject({ id: 'adjunt-1', text: 'Text nou' });
});

test('un ACK sense camp de text no acredita haver inclòs el principal', async () => {
  render(<Barra inicial="Cal conservar-lo" onEnvia={vi.fn().mockResolvedValue([{ id: 'adjunt-1' }])} />);
  await tria(); fireEvent.click(boto());
  await waitFor(() => expect(screen.queryByAltText('Foto adjunta')).toBeNull());
  expect(principal().value).toBe('Cal conservar-lo');
});

test('una quota que no torna després de l’ACK no retarda buidar el principal ni permet duplicar-lo amb Retorn', async () => {
  const onText = vi.fn();
  servei.quotaXat.mockResolvedValueOnce({ usats: 0, limit: 20_000_000 }).mockReturnValueOnce(new Promise(() => {}));
  render(<Barra inicial="Peu confirmat" onEnvia={vi.fn(ack)} onText={onText} />);
  await tria(); fireEvent.click(boto());
  await waitFor(() => expect(principal().value).toBe(''));
  fireEvent.keyDown(principal(), { key: 'Enter' });
  expect(onText).not.toHaveBeenCalled();
});

test('un refresh de quota 401 després de l’ACK conserva èxit i quota anterior; el menú avisa i permet reintentar', async () => {
  const pendent = diferit();
  servei.quotaXat.mockResolvedValueOnce({ usats: 1_000_000, limit: 20_000_000 })
    .mockRejectedValueOnce(Object.assign(new Error('401'), { code: 'sessio-caducada' }))
    .mockReturnValueOnce(pendent.promise);
  render(<Barra inicial="Publicat" onEnvia={vi.fn(ack)} />);
  await tria(); fireEvent.click(boto());
  await waitFor(() => expect(principal().value).toBe(''));
  expect(screen.queryByRole('alert')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Adjunta' }));
  expect(screen.getByText('1,0 de 20 MB del xat')).toBeTruthy();
  expect(screen.getByText('No hem pogut llegir l’espai que et queda per a fitxers.')).toBeTruthy();
  expect(screen.getByRole('menuitem', { name: 'Fotos i vídeos' })).toBeTruthy();
  fireEvent.click(screen.getByRole('menuitem', { name: 'Torna-ho a provar' }));
  await act(async () => pendent.resolve({ usats: 2_000_000, limit: 20_000_000 }));
  fireEvent.click(screen.getByRole('button', { name: 'Adjunta' }));
  expect(screen.getByText('2,0 de 20 MB del xat')).toBeTruthy();
  expect(screen.queryByText('No hem pogut llegir l’espai que et queda per a fitxers.')).toBeNull();
  expect(screen.queryByRole('menuitem', { name: 'Torna-ho a provar' })).toBeNull();
});

test('un refresc antic de quota que acaba després d’una lectura nova no la sobreescriu', async () => {
  const antic = diferit();
  servei.quotaXat.mockResolvedValueOnce({ usats: 0, limit: 20_000_000 })
    .mockReturnValueOnce(antic.promise)
    .mockResolvedValueOnce({ usats: 3_000_000, limit: 20_000_000 });
  const config = { backend_url: 'https://poble.invalid', accessToken: 'primer' };
  const onEnvia = vi.fn(ack);
  const vista = render(<Barra inicial="Publicat" onEnvia={onEnvia} externalConfig={config} />);
  await tria(); fireEvent.click(boto()); await waitFor(() => expect(principal().value).toBe(''));
  vista.rerender(<Barra onEnvia={onEnvia} externalConfig={{ ...config, accessToken: 'renovat' }} />);
  await waitFor(() => expect(servei.quotaXat).toHaveBeenCalledTimes(3));
  await act(async () => antic.resolve({ usats: 1_000_000, limit: 20_000_000 }));
  fireEvent.click(screen.getByRole('button', { name: 'Adjunta' }));
  expect(screen.getByText('3,0 de 20 MB del xat')).toBeTruthy();
});

test('config renovada equivalent conserva foto, principal i la pujada en curs', async () => {
  const pendent = diferit(); const onEnvia = vi.fn(() => pendent.promise);
  const config = { backend_url: 'https://poble.invalid', accessToken: 'primer' };
  const vista = render(<Barra inicial="Continuem" onEnvia={onEnvia} externalConfig={config} />);
  await tria();
  vista.rerender(<Barra inicial="Continuem" onEnvia={onEnvia} externalConfig={{ ...config, accessToken: 'renovat' }} />);
  expect(screen.getByAltText('Foto adjunta')).toBeTruthy();
  fireEvent.click(boto());
  const signal = onEnvia.mock.calls[0][2].signal;
  vista.rerender(<Barra inicial="Continuem" onEnvia={onEnvia} externalConfig={{ ...config, accessToken: 'tercer' }} />);
  expect(signal.aborted).toBe(false); expect(principal().value).toBe('Continuem');
  await act(async () => pendent.resolve([{ id: 'adjunt-1', text: 'Continuem' }]));
  await waitFor(() => expect(principal().value).toBe(''));
});

test('canviar de fil i tornar amb el mateix text no deixa que l’ACK antic es menge la foto o el principal nous', async () => {
  const pendent = diferit(); const onEnvia = vi.fn(() => pendent.promise);
  const vista = render(<Barra inicial="Mateix text" onEnvia={onEnvia} />);
  await tria(); fireEvent.click(boto());
  const signal = onEnvia.mock.calls[0][2].signal;
  vista.rerender(<Barra fil={{ id: 'fil-B' }} onEnvia={onEnvia} />);
  expect(signal.aborted).toBe(true);
  vista.rerender(<Barra fil={FIL} onEnvia={onEnvia} />);
  await tria();
  await act(async () => pendent.resolve([{ id: 'adjunt-1', text: 'Mateix text' }]));
  expect(screen.getByAltText('Foto adjunta')).toBeTruthy();
  expect(principal().value).toBe('Mateix text');
  fireEvent.click(boto()); expect(onEnvia.mock.calls[1][1].id).toBe('adjunt-2');
});

test('cancel·lar i preparar-ne una altra ignora l’ACK i el progrés tardans de la primera', async () => {
  const pendent = diferit(); const onEnvia = vi.fn(() => pendent.promise);
  render(<Barra inicial="El peu continua" onEnvia={onEnvia} />);
  await tria(); fireEvent.click(boto());
  const primera = onEnvia.mock.calls[0][2];
  fireEvent.click(screen.getByRole('button', { name: 'Cancel·la' }));
  await tria();
  await act(async () => { primera.onProgres(0.9); pendent.resolve([{ id: 'adjunt-1', text: 'El peu continua' }]); });
  expect(screen.getByAltText('Foto adjunta')).toBeTruthy(); expect(principal().value).toBe('El peu continua');
  expect(screen.queryByRole('progressbar')).toBeNull();
});

test.each(['rebuig', 'ACK tardà'])('Cancel·la un Compartir durant pujada (%s): allibera la còpia una vegada i no el torna a oferir', async (final) => {
  const pendent = diferit(); const allibera = vi.fn();
  registraAlliberadorCompartit(allibera);
  const fitxer = new File(['compartida'], 'compartida.jpg', { type: 'image/jpeg' });
  lliuraCompartit({ fitxers: [fitxer], rutes: ['file:///cache/r32_6-cancel.jpg'], text: 'Peu compartit' }); triaDestiCompartit('fil-A');
  const onEnvia = vi.fn(() => pendent.promise);
  const vista = render(<Barra inicial="Text que conserve" onEnvia={onEnvia} />);
  await screen.findByAltText('Foto adjunta'); fireEvent.click(boto());
  fireEvent.click(screen.getByRole('button', { name: 'Cancel·la' }));
  expect(onEnvia.mock.calls[0][2].signal.aborted).toBe(true);
  // La persona continua en un altre fil mentre es resol la cancel·lació.
  vista.rerender(<Barra fil={{ id: 'fil-B' }} onEnvia={onEnvia} />);
  await act(async () => {
    if (final === 'rebuig') pendent.reject(new DOMException('Cancel·lat', 'AbortError'));
    else pendent.resolve([{ id: 'adjunt-1', text: 'Peu compartit\n\nText que conserve' }]);
  });
  await waitFor(() => expect(allibera).toHaveBeenCalledOnce());
  expect(allibera).toHaveBeenCalledWith(['file:///cache/r32_6-cancel.jpg']);
  expect(compartitPendent()).toBeNull();
  expect(principal().value).toBe('Text que conserve');
  expect(screen.queryByRole('alert')).toBeNull();
  vista.rerender(<Barra fil={FIL} onEnvia={onEnvia} />);
  await act(async () => {});
  expect(m.preparaAdjunt).toHaveBeenCalledOnce();
  expect(screen.queryByAltText('Foto adjunta')).toBeNull();
  expect(compartitPendent()).toBeNull();
});

test('tancar la conversa durant una pujada compartida fallida torna el fitxer al lot en lloc de descartar-lo', async () => {
  const pendent = diferit(); const allibera = vi.fn(); registraAlliberadorCompartit(allibera);
  const fitxer = new File(['compartida'], 'pendent.jpg', { type: 'image/jpeg' });
  lliuraCompartit({ fitxers: [fitxer], rutes: ['file:///cache/r32_6-pendent.jpg'], text: 'Encara pendent' }); triaDestiCompartit('fil-A');
  const vista = render(<Barra onEnvia={vi.fn(() => pendent.promise)} />);
  await screen.findByAltText('Foto adjunta'); fireEvent.click(boto()); vista.unmount();
  await act(async () => pendent.reject(new DOMException('Conversa tancada', 'AbortError')));
  expect(compartitPendent()).toMatchObject({ desti: 'fil-A', text: 'Encara pendent' });
  expect(compartitPendent().fitxers[0]).toBe(fitxer);
  expect(allibera).not.toHaveBeenCalled();
});

test('Compartir conserva el peu propi i afegix el principal; Retorn al peu usa la mateixa acció', async () => {
  lliuraCompartit({ fitxers: [FOTO], text: 'Text compartit' }); triaDestiCompartit('fil-A');
  const onEnvia = vi.fn(ack);
  render(<Barra inicial="Text principal" onEnvia={onEnvia} />);
  await screen.findByAltText('Foto adjunta');
  fireEvent.keyDown(peu(), { key: 'Enter' });
  await waitFor(() => expect(principal().value).toBe(''));
  expect(onEnvia).toHaveBeenCalledOnce();
  expect(onEnvia.mock.calls[0][1].text).toBe('Text compartit\n\nText principal');
});

test('un ACK vell després d’editar el peu compartit el rescata al principal, sense perdre cap dels dos textos nous', async () => {
  lliuraCompartit({ fitxers: [FOTO], text: 'Peu antic' }); triaDestiCompartit('fil-A');
  const onEnvia = vi.fn().mockRejectedValueOnce(new Error('ACK perdut')).mockResolvedValueOnce([{ id: 'adjunt-1', text: 'Peu antic\n\nPrincipal antic' }]);
  render(<Barra inicial="Principal antic" onEnvia={onEnvia} />);
  await screen.findByAltText('Foto adjunta'); fireEvent.click(boto()); await screen.findByRole('alert');
  fireEvent.change(peu(), { target: { value: 'Peu nou' } }); canvia('Principal nou'); fireEvent.click(boto());
  await waitFor(() => expect(screen.queryByAltText('Foto adjunta')).toBeNull());
  expect(principal().value).toBe('Principal nou\n\nPeu nou');
});

test('un peu combinat de 4096 caràcters s’envia sencer i un de 4097 conserva els dos camps', async () => {
  lliuraCompartit({ fitxers: [FOTO], text: 'a'.repeat(4093) }); triaDestiCompartit('fil-A');
  const onEnvia = vi.fn(ack);
  render(<Barra inicial="bb" onEnvia={onEnvia} />);
  await screen.findByAltText('Foto adjunta'); fireEvent.click(boto());
  expect((await screen.findByRole('alert')).textContent).toContain('4096');
  expect(onEnvia).not.toHaveBeenCalled(); expect(principal().value).toBe('bb'); expect(peu().value).toHaveLength(4093);
  canvia('b'); fireEvent.click(boto());
  await waitFor(() => expect(principal().value).toBe(''));
  expect(onEnvia.mock.calls[0][1].text).toHaveLength(4096);
});

test('una nota de veu no absorbeix el principal ni el buida en confirmar-se', async () => {
  m.preparaAdjunt.mockResolvedValueOnce({ id: 'veu', tipus: 'veu', duradaMs: 1000, fitxer: new Blob(['veu'], { type: 'audio/mp4' }) });
  const onEnvia = vi.fn(ack);
  render(<Barra inicial="Text independent" onEnvia={onEnvia} />);
  await tria(); fireEvent.click(boto());
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Cancel·la' })).toBeNull());
  expect(onEnvia.mock.calls[0][1]).not.toHaveProperty('text');
  expect(principal().value).toBe('Text independent');
});
