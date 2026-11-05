import { CarpetaFalsa } from '../../../tests/helpers/carpetaLocalFalsa.js';
import { creaBloquejosOpfsFalsos } from '../../../tests/helpers/bloquejosOpfsFalsos.js';
import { webcrypto } from 'node:crypto';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import ModeRural from './ModeRural.jsx';
import { creaSessioRural } from '../../data/sessioRural.js';
import { desaSessio, esborraSessio } from '../../data/identitat.js';
import { TEXTOS_MODE_RURAL } from './textosModeRural.js';

const m = vi.hoisted(() => ({ usuari: { id: 'persona-a' }, actorKey: 'persona:a', config: { dataMode: 'seed', backendUrl: '', tenantId: 'torre' } }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSessioOpcional: () => ({ currentUser: m.usuari }) }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitatOpcional: () => ({ actorKey: m.actorKey }) }));
vi.mock('../../app/contexts/UIContext.jsx', () => ({ useUIState: () => ({ externalConfig: m.config }), useUIActions: () => ({ t: (_, reserva) => reserva }) }));
vi.mock('../../app/contexts/CoreContentContext.jsx', () => ({ useCoreContent: () => ({ towns: [{ id: 'torre', name: 'La Torre de les Maçanes' }] }) }));
vi.mock('../../config/backendConfig.js', () => ({ normalizeBackendConfig: c => c, backendScope: () => 'seed:torre' }));
vi.mock('../../components/universal/UniversalPage.jsx', () => ({ UniversalPage: ({ title, children }) => <section><header className="page-title"><h1>{title}</h1></header>{children}</section> }));
const memoria = new Map();
const creades = [];
const fabrica = vi.fn(async opcions => {
  const s = await creaSessioRural({ ...opcions, motor: 'memoria', memoria, crypto: webcrypto });
  creades.push(s); return s;
});
/* Mateixa emulació nativa que Dialeg.test.jsx: no enfocar un dialog tancat;
   showModal obri i enfoca abans que el component trie Cancel·lar. */
const focusNatiu = HTMLElement.prototype.focus;
const dialegNatiu = Object.getOwnPropertyDescriptors(HTMLDialogElement.prototype);
beforeEach(() => {
  m.usuari = { id: 'persona-a' }; m.actorKey = 'persona:a';
  m.config = { dataMode: 'seed', backendUrl: '', tenantId: 'torre' };
  memoria.clear(); fabrica.mockClear(); vi.stubGlobal('crypto', webcrypto);
  vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(function (...args) {
    if (this.closest('dialog') && !this.closest('dialog').open) return undefined;
    return focusNatiu.apply(this, args);
  });
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value() {
      this.setAttribute('open', '');
      (this.querySelector('[autofocus]') || this.querySelector('button:not(:disabled)'))?.focus();
    } },
    close: { configurable: true, value() { this.removeAttribute('open'); this.dispatchEvent(new Event('close')); } },
  });
});
afterEach(() => {
  cleanup(); creades.splice(0).forEach(s => s.close()); vi.unstubAllGlobals(); vi.restoreAllMocks();
  for (const clau of ['showModal', 'close']) {
    if (dialegNatiu[clau]) Object.defineProperty(HTMLDialogElement.prototype, clau, dialegNatiu[clau]);
    else delete HTMLDialogElement.prototype[clau];
  }
});
const activa = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Activar en este dispositiu' }));
  await screen.findByRole('textbox', { name: /^Títol de la nota/ });
};

test('sense sessió no s’obri persistència ni es pinta cap acció d’escriptura', () => {
  m.usuari = null; render(<ModeRural fabrica={fabrica} onBack={() => {}} />);
  expect(screen.queryByRole('button', { name: 'Activar en este dispositiu' })).toBeNull();
  expect(fabrica).not.toHaveBeenCalled();
});

test('activació explícita, nota real, cua i paquet visibles sense cap operació remota', async () => {
  render(<ModeRural fabrica={fabrica} onBack={() => {}} />);
  expect(fabrica).not.toHaveBeenCalled();
  await activa();
  fireEvent.change(screen.getByRole('textbox', { name: /^Títol de la nota/ }), { target: { value: 'Camí' } });
  fireEvent.change(screen.getByRole('textbox', { name: /^Text de la nota/ }), { target: { value: 'Font disponible' } });
  fireEvent.click(screen.getByRole('button', { name: 'Desar la nota al dispositiu' }));
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('1'));
  expect(screen.getByRole('listitem').textContent).toContain('Font disponible');
  fireEvent.click(screen.getByRole('button', { name: 'Preparar còpia de les notes' }));
  await screen.findByRole('textbox', { name: 'Contingut del fitxer preparat' });
  const paquet = JSON.parse(screen.getByRole('textbox', { name: 'Contingut del fitxer preparat' }).value);
  expect(Object.values(paquet.fitxers)[0]).toContain('Font disponible');
});

test('canviar identitat tanca el motor i no revela notes de l’anterior', async () => {
  const { rerender } = render(<ModeRural fabrica={fabrica} onBack={() => {}} />);
  await activa();
  await creades[0].desaNota({ title: 'Només A', content: 'Dades A' });
  m.usuari = { id: 'persona-b' }; m.actorKey = 'persona:b';
  rerender(<ModeRural fabrica={fabrica} onBack={() => {}} />);
  expect(screen.queryByText('Dades A')).toBeNull();
  await expect(creades[0].estat()).rejects.toThrow('tancat');
  await activa();
  expect(screen.getByRole('status').textContent).toContain('0');
});

test('tancar mentre s’activa allibera el motor tardà', async () => {
  let resol;
  const close = vi.fn();
  const retardada = vi.fn(() => new Promise(r => { resol = r; }));
  const { unmount } = render(<ModeRural fabrica={retardada} onBack={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: 'Activar en este dispositiu' }));
  unmount(); resol({ close });
  await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
});

async function desaNota(title, content) {
  fireEvent.change(screen.getByRole('textbox', { name: /^Títol de la nota/ }), { target: { value: title } });
  fireEvent.change(screen.getByRole('textbox', { name: /^Text de la nota/ }), { target: { value: content } });
  fireEvent.click(screen.getByRole('button', { name: 'Desar la nota al dispositiu' }));
  await screen.findByText(content, { selector: 'li p' });
  await waitFor(() => expect(screen.getByRole('button', { name: 'Preparar còpia de les notes' }).disabled).toBe(false));
}
async function preparaDelta() {
  fireEvent.click(screen.getByRole('button', { name: 'Preparar paquet d’emergència signat' }));
  await waitFor(() => expect(screen.getByRole('textbox', { name: /^Clau pública de confiança/ }).value).not.toBe(''));
  return screen.getByRole('textbox', { name: 'Contingut del fitxer preparat' }).value;
}
const pendents = n => expect(screen.getByRole('status').textContent).toContain(`pendents: ${n}.`);
const obriEsborrat = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Esborrar les dades d’este espai rural' }));
  return screen.getByRole('dialog', { name: 'Esborrar les dades d’este espai rural' });
};

test('consolidar conserva notes i avisos, buida el diari i permet desar i reactivar', async () => {
  render(<ModeRural fabrica={fabrica} onBack={() => {}} />);
  await activa();
  await desaNota('Abans', 'Contingut conservat'); pendents(1);
  fireEvent.click(screen.getByRole('button', { name: 'Consolidar el diari local' }));
  await waitFor(() => pendents(0));
  expect(screen.getByText('Contingut conservat', { selector: 'li p' })).toBeTruthy();
  const checkpoint = await creades[0].estat();
  expect(checkpoint.notes).toHaveLength(1); expect(checkpoint.bans).toHaveLength(1);
  expect(screen.getByRole('button', { name: 'Consolidar el diari local' }).disabled).toBe(true);
  await desaNota('Després', 'Nova nota després del checkpoint'); pendents(1);
  fireEvent.click(screen.getByRole('button', { name: 'Tancar el mode rural' }));
  await activa(); pendents(1);
  expect(screen.getAllByRole('listitem')).toHaveLength(2);
  expect(screen.getByText('Contingut conservat', { selector: 'li p' })).toBeTruthy();
});

test('Cancel·lar té el focus i conserva notes, diari, fitxer preparat i clau pública', async () => {
  render(<ModeRural fabrica={fabrica} onBack={() => {}} />);
  await activa(); await desaNota('Conservar', 'No s’ha d’esborrar');
  const preparat = await preparaDelta();
  const publica = screen.getByRole('textbox', { name: /^Clau pública de confiança/ }).value;
  const dialeg = obriEsborrat();
  const cancela = within(dialeg).getByRole('button', { name: 'Cancel·lar' });
  expect(document.activeElement).toBe(cancela);
  fireEvent.click(cancela);
  expect(screen.queryByRole('dialog')).toBeNull(); pendents(1);
  expect(screen.getByRole('textbox', { name: 'Contingut del fitxer preparat' }).value).toBe(preparat);
  expect(screen.getByRole('textbox', { name: /^Clau pública de confiança/ }).value).toBe(publica);
  fireEvent.click(screen.getByRole('button', { name: 'Tancar el mode rural' }));
  await activa(); pendents(1);
  expect(screen.getByText('No s’ha d’esborrar', { selector: 'li p' })).toBeTruthy();
});

test('confirmar esborra les dades persistents de l’espai i neteja fitxer, clau i esborrany', async () => {
  render(<ModeRural fabrica={fabrica} onBack={() => {}} />);
  await activa(); await desaNota('Privada', 'Contingut que cal esborrar'); await preparaDelta();
  fireEvent.change(screen.getByRole('textbox', { name: /^Títol de la nota/ }), { target: { value: 'Esborrany' } });
  fireEvent.change(screen.getByRole('textbox', { name: /^Text de la nota/ }), { target: { value: 'Text no desat' } });
  const antiga = creades[0];
  fireEvent.click(within(obriEsborrat()).getByRole('button', { name: 'Esborra les dades locals' }));
  await screen.findByRole('button', { name: 'Activar en este dispositiu' });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.queryByRole('textbox', { name: 'Contingut del fitxer preparat' })).toBeNull();
  expect(screen.queryByText('Contingut que cal esborrar')).toBeNull();
  await expect(antiga.estat()).rejects.toThrow('tancat');
  await activa(); pendents(0);
  expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  expect(screen.getByRole('textbox', { name: /^Clau pública de confiança/ }).value).toBe('');
  expect(screen.getByRole('textbox', { name: /^Títol de la nota/ }).value).toBe('');
  expect(screen.getByRole('textbox', { name: /^Text de la nota/ }).value).toBe('');
  const estat = await creades.at(-1).estat(); expect(estat.notes).toHaveLength(0); expect(estat.bans).toHaveLength(0);
  await desaNota('Nova', 'Nota després de l’esborrat'); pendents(1);
});

test('canviar només actor neteja l’estat visible i manté les dades en l’àmbit original', async () => {
  const { rerender } = render(<ModeRural fabrica={fabrica} onBack={() => {}} />);
  await activa(); await desaNota('Actor A', 'Només actor A'); await preparaDelta();
  m.actorKey = 'entitat:b'; rerender(<ModeRural fabrica={fabrica} onBack={() => {}} />);
  expect(screen.queryByRole('textbox', { name: 'Contingut del fitxer preparat' })).toBeNull();
  expect(screen.queryByText('Només actor A')).toBeNull();
  await expect(creades[0].estat()).rejects.toThrow('tancat');
  await activa(); pendents(0); expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  m.actorKey = 'persona:a'; rerender(<ModeRural fabrica={fabrica} onBack={() => {}} />);
  await activa(); pendents(1); expect(screen.getByText('Només actor A', { selector: 'li p' })).toBeTruthy();
});

test('tancar la sessió neteja el fitxer i no deixa reactivar ni escriure', async () => {
  const { rerender } = render(<ModeRural fabrica={fabrica} onBack={() => {}} />);
  await activa(); await desaNota('Privada', 'Dades del compte'); await preparaDelta();
  m.usuari = null; rerender(<ModeRural fabrica={fabrica} onBack={() => {}} />);
  expect(screen.queryByRole('button', { name: 'Activar en este dispositiu' })).toBeNull();
  expect(screen.queryAllByRole('textbox')).toHaveLength(0);
  expect(screen.queryByText('Dades del compte')).toBeNull();
  await expect(creades[0].estat()).rejects.toThrow('tancat');
});

test('fàbrica tardana després de canviar actor es tanca sense substituir el motor nou', async () => {
  let resol;
  const retardada = new Promise(r => { resol = r; });
  const close = vi.fn(); const estatAntic = vi.fn();
  const mixta = vi.fn().mockImplementationOnce(() => retardada).mockImplementation(fabrica);
  const { rerender } = render(<ModeRural fabrica={mixta} onBack={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: 'Activar en este dispositiu' }));
  m.actorKey = 'entitat:b'; rerender(<ModeRural fabrica={mixta} onBack={() => {}} />);
  await activa();
  await act(async () => { resol({ close, estat: estatAntic }); await retardada; });
  expect(close).toHaveBeenCalledTimes(1); expect(estatAntic).not.toHaveBeenCalled();
  await desaNota('Actor B', 'El motor nou continua disponible'); pendents(1);
});

test('si el tenant no identifica un poble, mostra el poble per defecte (La Torre de les Maçanes) i els 3 punts simples sense sigles obscures', () => {
  m.config = { dataMode: 'seed', backendUrl: '', tenantId: 'desconegut' };
  render(<ModeRural fabrica={fabrica} onBack={() => {}} />);
  expect(screen.getByText('La Torre de les Maçanes')).toBeTruthy();
  expect(screen.queryByText('Poble pendent d’identificar')).toBeNull();
  expect(screen.getByText('Per a què servix el Mode rural?')).toBeTruthy();
  expect(screen.getByText(/^1\. Apuntar notes de camp/)).toBeTruthy();
  expect(screen.getByText(/^2\. Guardar una còpia/)).toBeTruthy();
  expect(screen.getByText(/^3\. Preparar i verificar paquets/)).toBeTruthy();
  expect(fabrica).not.toHaveBeenCalled();
});

test('una confirmació pendent que acaba després del canvi d’actor no altera l’espai nou', async () => {
  let acaba;
  const pendent = new Promise(r => { acaba = r; });
  const esborra = vi.fn(() => pendent);
  const diferida = vi.fn(async opcions => ({ ...await fabrica(opcions), esborraTot: esborra }));
  const { rerender } = render(<ModeRural fabrica={diferida} onBack={() => {}} />);
  await activa(); await desaNota('Origen', 'Només origen');
  fireEvent.click(within(obriEsborrat()).getByRole('button', { name: 'Esborra les dades locals' }));
  expect(esborra).toHaveBeenCalledTimes(1);
  m.actorKey = 'entitat:b'; rerender(<ModeRural fabrica={fabrica} onBack={() => {}} />);
  await activa(); await desaNota('Destí', 'Dades de l’espai nou');
  await act(async () => { acaba(true); await pendent; });
  expect(screen.getByText('Dades de l’espai nou', { selector: 'li p' })).toBeTruthy(); pendents(1);
  expect(screen.queryByRole('dialog')).toBeNull();
});


function fabricaOpfs() {
  const root = new CarpetaFalsa('opfs'), locks = creaBloquejosOpfsFalsos(), storage = { getDirectory: async () => root };
  const original = globalThis.navigator;
  vi.stubGlobal('navigator', new Proxy(original, { get(target, key) { if (key === 'storage') return storage; if (key === 'locks') return locks; return Reflect.get(target, key, target); } }));
  const fabrica = vi.fn(async options => { const s = await creaSessioRural({ ...options, storage, locks, crypto: webcrypto, BroadcastChannel: null }); creades.push(s); return s; });
  return { fabrica, storage, locks };
}
const activaOpfs = async () => { fireEvent.click(screen.getByRole('button', { name: 'Activar edició compartida entre finestres' })); await screen.findByRole('textbox', { name: /^Títol de la nota/ }); };

test('FEDI15 · OPFS és opt-in explícit i edita amb base antiga mentre una altra sessió canvia la nota', async () => {
  const { fabrica } = fabricaOpfs(); render(<ModeRural fabrica={fabrica} onBack={() => {}} />);
  expect(fabrica).not.toHaveBeenCalled(); await activaOpfs();
  expect(fabrica.mock.calls[0][0]).toMatchObject({ motor: 'opfs', crdt: true });
  await desaNota('Compartida', 'abc'); const a = creades[0], id = (await a.estat()).notes[0].id;
  fireEvent.click(screen.getByRole('button', { name: 'Editar nota: Compartida' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Desar canvis de la nota' })).toBeTruthy());
  const b = await creaSessioRural({ ...fabrica.mock.calls[0][0], storage: navigator.storage, locks: navigator.locks, crypto: webcrypto, BroadcastChannel: null }); creades.push(b);
  const db = await b.preparaEdicio(id); await b.editaNota({ id, title: db.nota.title, content: 'abYc', base: db.base });
  fireEvent.change(screen.getByRole('textbox', { name: /^Text de la nota/ }), { target: { value: 'aXbc' } });
  fireEvent.click(screen.getByRole('button', { name: 'Desar canvis de la nota' }));
  await screen.findByText('aXbYc', { selector: 'li p' }); expect((await a.estat()).notes).toHaveLength(1);
});

test('FEDI15 · variants MV visibles i resolució explícita del títol, sense perdre història', async () => {
  const { fabrica } = fabricaOpfs(); render(<ModeRural fabrica={fabrica} onBack={() => {}} />); await activaOpfs(); await desaNota('Base', 'abc');
  const a = creades[0], id = (await a.estat()).notes[0].id, base = await a.preparaEdicio(id);
  const b = await creaSessioRural({ ...fabrica.mock.calls[0][0], storage: navigator.storage, locks: navigator.locks, crypto: webcrypto, BroadcastChannel: null }); creades.push(b); const db = await b.preparaEdicio(id);
  await a.editaNota({ id, title: 'Títol A', content: 'abc', base: base.base }); await b.editaNota({ id, title: 'Títol B', content: 'abc', base: db.base });
  fireEvent.click(screen.getByRole('button', { name: 'Actualitzar notes' })); await screen.findByText('Esta nota té variants de metadades pendents de revisar.');
  fireEvent.click(screen.getByRole('button', { name: /^Editar nota:/ }));
  const variants = await screen.findByRole('region', { name: 'Variants pendents de decidir' }); expect(within(variants).getByText('Títol A')).toBeTruthy(); expect(within(variants).getByText('Títol B')).toBeTruthy();
  fireEvent.click(within(variants).getByRole('button', { name: 'Usar aquesta variant: Títol de la nota · Títol A' }));
  fireEvent.click(screen.getByRole('button', { name: 'Desar canvis de la nota' })); await waitFor(async () => expect((await a.estat()).notes[0].variants.title).toBeUndefined());
  expect((await a.estat()).notes[0].title).toBe('Títol A'); expect((await a.exportaVault()).crdt.ops.length).toBeGreaterThanOrEqual(4);
});

test('FEDI15 · una fàbrica que torna memòria no pot anunciar OPFS actiu', async () => {
  fabricaOpfs(); render(<ModeRural fabrica={fabrica} onBack={() => {}} />); await activaOpfs().catch(() => {});
  await screen.findByText('No s’ha pogut activar l’edició compartida entre finestres. Revisa la disponibilitat del navegador i torna-ho a provar.');
  expect(screen.queryByText('Edició compartida activa en este navegador. Les versions concurrents es conserven en el mateix document.')).toBeNull();
  expect(screen.queryByRole('textbox', { name: /^Títol de la nota/ })).toBeNull();
});


test('reentrada real del mateix usuari durant activació rebutja el motor tardà sense dependre de rerender',async()=>{
 desaSessio({access_token:'local-test',user:{id:'persona-a'}});
 let release;const close=vi.fn(),estat=vi.fn(async()=>({notes:[],bans:[],pendents:0,bytesCua:0,limitBytesCua:1024,cadenaValida:true}));
 const delayed=()=>new Promise(r=>{release=()=>r({close,estat});});render(<ModeRural fabrica={delayed} onBack={()=>{}}/>);
 fireEvent.click(screen.getByRole('button',{name:'Activar en este dispositiu'}));
 esborraSessio({abast:'pestanya'});desaSessio({access_token:'local-test-2',user:{id:'persona-a'}});await act(async()=>release());
 expect(close).toHaveBeenCalledTimes(1);expect(estat).not.toHaveBeenCalled();expect(screen.queryByRole('textbox',{name:/^Títol de la nota/})).toBeNull();
});

test('reentrada real del mateix usuari canvia la clau de muntatge i retira còpia i editor',async()=>{
 desaSessio({access_token:'local-test',user:{id:'persona-a'}});const view=render(<ModeRural fabrica={fabrica} onBack={()=>{}}/>);await activa();await desaNota('Entrada A','Dades privades A');
 fireEvent.click(screen.getByRole('button',{name:'Preparar còpia de les notes'}));await screen.findByRole('textbox',{name:'Contingut del fitxer preparat'});
 esborraSessio({abast:'pestanya'});desaSessio({access_token:'local-test-2',user:{id:'persona-a'}});view.rerender(<ModeRural fabrica={fabrica} onBack={()=>{}}/>);
 expect(screen.queryByText('Dades privades A')).toBeNull();expect(screen.queryByRole('textbox',{name:'Contingut del fitxer preparat'})).toBeNull();await expect(creades[0].estat()).rejects.toThrow('tancat');
});


test('DOMException nativa de carpeta es mostra i allibera el control sense error del gestor',async()=>{
 vi.stubGlobal('showDirectoryPicker',async()=>{throw new DOMException('Permís de carpeta denegat.','NotAllowedError');});render(<ModeRural fabrica={fabrica} onBack={()=>{}}/>);await activa();
 fireEvent.click(screen.getByRole('button',{name:'Sincronitzar una carpeta'}));await screen.findByText('Permís de carpeta denegat.');
 expect(screen.getByRole('button',{name:'Sincronitzar una carpeta'}).disabled).toBe(false);
});

/* control-04 (revisió del Panell, 261104) · Amb un diàleg de confirmació
   obert (showModal), la resta del document és inert sota el vel: l'error d'una
   confirmació fallida pintat fora del <dialog> no es veu ni s'anuncia, i el
   diàleg es queda obert sense dir res. Com a DetallPrivacitat.jsx, l'error es
   pinta dins del diàleg obert, una sola vegada; en Cancel·lar, torna a la
   pàgina. jsdom no modela inert: per això es mira on és l'alerta. */
const errorAmbCodi = (code) => Object.assign(new Error(code), { code });

test('control-04 · si «Esborra les dades locals» falla, l’error es pinta dins del diàleg obert, i en Cancel·lar torna a la pàgina', async () => {
  const falla = vi.fn(async (opcions) => ({ ...await fabrica(opcions), esborraTot: async () => { throw errorAmbCodi('SDP-STORE-QUOTA'); } }));
  render(<ModeRural fabrica={falla} onBack={() => {}} />);
  await activa(); await desaNota('Conservar', 'No s’ha d’esborrar');
  const dialeg = obriEsborrat();
  /* Llei del Píxel · abans de confirmar, el diàleg no porta cap cos. */
  expect(dialeg.querySelector('.sdp-dialeg__cos')).toBeNull();
  fireEvent.click(within(dialeg).getByRole('button', { name: 'Esborra les dades locals' }));
  const alerta = await within(dialeg).findByRole('alert');
  expect(alerta.textContent).toBe(TEXTOS_MODE_RURAL.crdtQuota[1]);
  expect(screen.getAllByRole('alert')).toEqual([alerta]);
  expect(dialeg.open).toBe(true);
  fireEvent.click(within(dialeg).getByRole('button', { name: 'Cancel·lar' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  const [deLaPagina] = screen.getAllByRole('alert');
  expect(screen.getAllByRole('alert')).toHaveLength(1);
  expect(deLaPagina.closest('dialog')).toBeNull();
  expect(deLaPagina.textContent).toBe(TEXTOS_MODE_RURAL.crdtQuota[1]);
  pendents(1);
});

test('control-04 · si «Elimina aquesta nota» falla, l’error es pinta dins del seu diàleg obert', async () => {
  const { fabrica: opfs } = fabricaOpfs();
  const falla = vi.fn(async (opcions) => ({ ...await opfs(opcions), eliminaNota: async () => { throw errorAmbCodi('RURAL_DIARI_PLE'); } }));
  render(<ModeRural fabrica={falla} onBack={() => {}} />);
  await activaOpfs(); await desaNota('Plena', 'El diari és ple');
  fireEvent.click(screen.getByRole('button', { name: 'Eliminar nota: Plena' }));
  const dialeg = await screen.findByRole('dialog', { name: 'Eliminar nota' });
  expect(dialeg.querySelector('.sdp-dialeg__cos')).toBeNull();
  fireEvent.click(within(dialeg).getByRole('button', { name: 'Elimina aquesta nota' }));
  const alerta = await within(dialeg).findByRole('alert');
  expect(alerta.textContent).toBe(TEXTOS_MODE_RURAL.diariPle[1]);
  expect(screen.getAllByRole('alert')).toEqual([alerta]);
  expect(screen.getByText('El diari és ple', { selector: 'li p' })).toBeTruthy();
});

test('control-04 · un error anterior no entra a la confirmació d’esborrat: es queda on era', async () => {
  render(<ModeRural fabrica={fabrica} onBack={() => {}} />);
  await activa();
  const gran = { name: 'notes.json', size: 4 * 1024 * 1024 + 1, text: async () => '{}' };
  fireEvent.change(document.querySelector('input[type="file"]'), { target: { files: [gran] } });
  const anterior = await screen.findByRole('alert');
  const dialeg = obriEsborrat();
  expect(dialeg.querySelector('.sdp-dialeg__cos')).toBeNull();
  expect(within(dialeg).queryByRole('alert')).toBeNull();
  expect(screen.getAllByRole('alert')).toEqual([anterior]);
});
