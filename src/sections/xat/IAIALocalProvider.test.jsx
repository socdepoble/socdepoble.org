import { act, cleanup, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { XatContext, useXat } from './XatContext.jsx';
import IAIALocalProvider from './IAIALocalProvider.jsx';
import { ID_FIL_LOCAL_IAIA, RUTA_XAT_DE_LA_IAIA, RUTA_XAT_LOCAL_IAIA, rutaDelXatDeLaIAIA } from './useObriXatPerDefecte.js';
import { BENVINGUDA_IAIA, RESPOSTA_IAIA } from '../../data/identitatsSeed.js';
import { respostaDeLaIAIA } from '../../data/iaiaLocal.js';
import { IAIA_ID } from '../../data/identitatsSeed.js';
import { AJUDA_PER_CLAU } from '../../data/xatsPerDefecte.js';
import { contactesDAjuda } from './contactesAjuda.js';
import { creaCanalFals, creaIdbFals } from '../../utils/__fixtures__/navegadorFals.js';
import * as sessionsIAIA from './sessionsIAIALocals.js';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const base = () => ({
  modeDades: 'remote', joId: 'usuari-a', ambitEstable: 'poble:usuari-a', senseSessio: false,
  chatThreads: [{ id: 'public-iaia', tipus: 'grup', subjecte: { tipus: 'pagina', id: '/iaia' } }, { id: 'javi', tipus: 'directe' }],
  sendChatMessage: vi.fn().mockResolvedValue([{ id: 'real' }]), getThreadMessages: vi.fn().mockReturnValue([{ id: 'public' }]),
  obriFil: vi.fn(), marcaVist: vi.fn(), marcaLlegides: vi.fn().mockResolvedValue([]), filCarregat: () => false
});
const setup = (original = base(), respostaIAIA = respostaDeLaIAIA) => {
  const Wrapper = ({ children }) => <XatContext.Provider value={original}><IAIALocalProvider respostaIAIA={respostaIAIA}>{children}</IAIALocalProvider></XatContext.Provider>;
  return { ...renderHook(useXat, { wrapper: Wrapper }), original };
};
const fil = (result) => result.current.chatThreads.find((f) => f.id === ID_FIL_LOCAL_IAIA);
const missatges = (result) => result.current.getThreadMessages(ID_FIL_LOCAL_IAIA);

describe('IAIA local amb sessió Supabase', () => {
  it('pinta la benvinguda en el primer render sense esperar cap canvi extern', () => {
    function Historial() {
      const xat = useXat();
      return <p>{xat.getThreadMessages(ID_FIL_LOCAL_IAIA).map((m) => m.text).join('\n')}</p>;
    }
    render(<XatContext.Provider value={base()}><IAIALocalProvider><Historial /></IAIALocalProvider></XatContext.Provider>);
    expect(screen.getByText(BENVINGUDA_IAIA)).toBeTruthy();
  });
  it('el camí de l’assistent i el del grup públic són diferents, sense canviar l’anònim ni la llavor', () => {
    expect(rutaDelXatDeLaIAIA('remote')).toBe(RUTA_XAT_LOCAL_IAIA);
    expect(RUTA_XAT_LOCAL_IAIA).not.toBe(RUTA_XAT_DE_LA_IAIA);
    expect(rutaDelXatDeLaIAIA('remote', true)).toBe('/xat/fake-iaia');
    expect(rutaDelXatDeLaIAIA('local')).toContain('?amb=');
  });
  it('contesta amb l’Atles real sense esperar la xarxa ni publicar pregunta o resposta al port', async () => {
    const original = base();
    original.status = 'loading'; original.avis = 'Sense xarxa';
    original.sendChatMessage.mockImplementation(() => new Promise(() => {}));
    const { result } = setup(original);
    expect(result.current.avis).toBeNull();
    expect(result.current.avisLlista).toBe('Sense xarxa');
    let enviats;
    await act(async () => { enviats = await result.current.sendChatMessage(fil(result), 'Què és el Mercat?'); });
    await waitFor(() => expect(missatges(result)).toHaveLength(3));
    expect(missatges(result).at(-1).text).toContain('/mercat');
    expect(enviats[0].text).toBe('Què és el Mercat?');
    expect(original.sendChatMessage).not.toHaveBeenCalled();
    expect(original.getThreadMessages).not.toHaveBeenCalled();
    act(() => { result.current.obriFil(ID_FIL_LOCAL_IAIA); result.current.marcaVist(ID_FIL_LOCAL_IAIA, 3); });
    expect(original.obriFil).toHaveBeenCalledWith(null);
    expect(original.marcaVist).not.toHaveBeenCalled();
  });
  it('el grup públic i les persones conserven les lectures i enviaments originals', async () => {
    const { result, original } = setup();
    expect(result.current.chatThreads.map((f) => f.id)).toContain('public-iaia');
    const huma = result.current.chatThreads.find((f) => f.id === 'javi');
    await act(async () => { await result.current.sendChatMessage(huma, 'Bon dia', { respostaA: 'cita' }); });
    expect(original.sendChatMessage).toHaveBeenCalledWith(huma, 'Bon dia', { respostaA: 'cita' });
    expect(result.current.getThreadMessages('public-iaia')).toEqual([{ id: 'public' }]);
  });
  it('una primera resposta lenta no bloqueja la següent, i cadascuna queda darrere de la seua pregunta', async () => {
    let resol;
    const { result } = setup(base(), (text) => text === 'Primera' ? new Promise((r) => { resol = r; }) : 'Segona resposta');
    await act(async () => { await result.current.sendChatMessage(fil(result), 'Primera'); await result.current.sendChatMessage(fil(result), 'Segona'); });
    expect(missatges(result).map((m) => m.text).slice(1)).toEqual(['Primera', 'Segona', 'Segona resposta']);
    await act(async () => { resol('Primera resposta'); });
    expect(missatges(result).map((m) => m.text).slice(1)).toEqual(['Primera', 'Primera resposta', 'Segona', 'Segona resposta']);
  });
  it('un error local dona resposta de reserva; la IAIA apagada no admet cap pregunta', async () => {
    const { result } = setup(base(), () => { throw new Error('no carregat'); });
    await act(async () => { await result.current.sendChatMessage(fil(result), 'Pregunta'); });
    await waitFor(() => expect(missatges(result).at(-1).text).toBe(RESPOSTA_IAIA));
    cleanup();
    const original = { ...base(), iaiaApagada: true };
    const respon = vi.fn();
    const apagat = setup(original, respon);
    expect(fil(apagat.result)).toBeUndefined();
    await act(async () => { expect(await apagat.result.current.sendChatMessage({ id: ID_FIL_LOCAL_IAIA }, 'Hola')).toEqual([]); });
    expect(respon).not.toHaveBeenCalled();
  });
  it('un àmbit nou no rep la resposta tardana de l’anterior', async () => {
    let resol;
    const respostaIAIA = () => new Promise((r) => { resol = r; });
    const original = base();
    const Wrapper = ({ children }) => <XatContext.Provider value={original}><IAIALocalProvider key={original.ambitEstable} respostaIAIA={respostaIAIA}>{children}</IAIALocalProvider></XatContext.Provider>;
    const { result, rerender } = renderHook(useXat, { wrapper: Wrapper });
    await act(async () => { await result.current.sendChatMessage(fil(result), 'Privat de A'); });
    original.ambitEstable = 'poble:usuari-b'; original.joId = 'usuari-b';
    rerender();
    await act(async () => { resol('Secret de A'); });
    expect(missatges(result)).toHaveLength(1);
    expect(JSON.stringify(missatges(result))).not.toContain('Secret de A');
  });
});

/* xat-flux-05 (T7a, 261104) · El padró remot (membres_del_poble) no porta cap
   contacte de tipus 'ia': «Nova conversa» (contactesDAjuda) pintava «IAIA
   MarIA · No disponible» mentre el seu xat local era a la llista i /iaia
   l'obria. El proveïdor l'afig al padró amb el fil local (obriConversaAmb hi
   navega pel fil_id), com fa el xat de mostra (FakeChatOnboarding). */
describe('xat-flux-05 · la IAIA local és al padró de «Nova conversa»', () => {
  const JOSE = { usuari_id: 'u-jose', nom: 'José', tipus: 'persona' };
  const ambPadro = (padro, extra = {}) => ({ ...base(), cercaMembres: vi.fn(async () => padro), ...extra });

  it('afig la IAIA (tipus ia, amb el fil local) al padró del port, i contactesDAjuda ja no la dona per no disponible', async () => {
    const { result, original } = setup(ambPadro([JOSE]));
    let membres;
    await act(async () => { membres = await result.current.cercaMembres(null); });
    expect(original.cercaMembres).toHaveBeenCalledWith(null);
    expect(membres.map((m) => m.usuari_id)).toEqual(['u-jose', IAIA_ID]);
    const iaia = membres.at(-1);
    expect(iaia).toMatchObject({ tipus: 'ia', fil_id: ID_FIL_LOCAL_IAIA, nom: AJUDA_PER_CLAU.iaia.nom, avatar_url: AJUDA_PER_CLAU.iaia.avatar });
    const ajuda = contactesDAjuda(membres).find((m) => m.tipus === 'ia');
    expect(ajuda.noDisponible).toBeUndefined();
    expect(ajuda.fil_id).toBe(ID_FIL_LOCAL_IAIA);
  });

  it('la referència es manté entre renders (el diàleg i la cerca no tornen a demanar el padró a cada missatge)', async () => {
    const { result, rerender } = setup(ambPadro([JOSE]));
    const primera = result.current.cercaMembres;
    await act(async () => { await result.current.sendChatMessage(fil(result), 'Hola'); });
    rerender();
    expect(result.current.cercaMembres).toBe(primera);
  });

  it('amb la IAIA apagada no hi és; si el port ja la porta, no es duplica', async () => {
    const apagada = setup(ambPadro([JOSE], { iaiaApagada: true }));
    await act(async () => { expect(await apagada.result.current.cercaMembres(null)).toEqual([JOSE]); });
    cleanup();
    const delPort = { usuari_id: IAIA_ID, nom: 'IAIA MarIA', tipus: 'ia' };
    const ambElPort = setup(ambPadro([JOSE, delPort]));
    let membres;
    await act(async () => { membres = await ambElPort.result.current.cercaMembres('ia'); });
    expect(membres).toEqual([JOSE, delPort]);
  });

  it('un error del port arriba al diàleg', async () => {
    const error = new Error('Sense padró');
    const { result } = setup({ ...base(), cercaMembres: vi.fn(async () => { throw error; }) });
    await act(async () => { await expect(result.current.cercaMembres(null)).rejects.toBe(error); });
  });
});

it('obri sessions privades distintes i conserva només els títols en reobrir el Xat', async () => {
  vi.stubGlobal('indexedDB', creaIdbFals().idb);
  vi.stubGlobal('BroadcastChannel', null);
  const original = base();
  const { result, unmount } = setup(original, () => 'Resposta efímera');
  let primer;
  act(() => { primer = result.current.novaSessioIAIA(); });
  expect(result.current.novaSessioIAIA()).toBe(primer);
  const filDe = (id) => result.current.chatThreads.find((f) => f.id === id);
  await act(async () => {
    await result.current.sendChatMessage(filDe(primer), 'Què és el Mercat? Text complet.');
    await result.current.sendChatMessage(filDe(primer), 'Ara la Biblioteca');
  });
  let segon;
  act(() => { segon = result.current.novaSessioIAIA(); });
  expect(segon).not.toBe(primer);
  await act(async () => {
    await result.current.sendChatMessage(filDe(segon), 'Camins de muntanya');
    expect(await result.current.sendChatMessage({ id: 'iaia-local-desconegut' }, 'Inexistent')).toEqual([]);
  });
  await waitFor(() => expect(filDe(primer)?.title).toBe('el Mercat'));
  expect(filDe(segon).title).toBe('Camins de muntanya');
  expect(result.current.getThreadMessages(segon).map(({ text }) => text)).toEqual([BENVINGUDA_IAIA, 'Camins de muntanya', 'Resposta efímera']);
  expect(original.sendChatMessage).not.toHaveBeenCalled();
  unmount();

  const restaurat = setup(original).result;
  await waitFor(() => expect(restaurat.current.chatThreads.find((f) => f.id === primer)?.title).toBe('el Mercat'));
  expect(restaurat.current.chatThreads.find((f) => f.id === segon)?.title).toBe('Camins de muntanya');
  expect(restaurat.current.getThreadMessages(primer).map(({ text }) => text)).toEqual([BENVINGUDA_IAIA]);
  const altre = setup({ ...original, joId: 'usuari-b', ambitEstable: 'poble:usuari-b' }).result;
  await waitFor(() => expect(altre.current.esperaSessioIAIA(primer)).toBe(false));
  expect(altre.current.chatThreads.some((f) => f.id === primer || f.id === segon)).toBe(false);
});

it('espera el títol abans de mostrar el primer missatge i els enviaments que el seguixen', async () => {
  vi.stubGlobal('indexedDB', creaIdbFals().idb);
  vi.stubGlobal('BroadcastChannel', null);
  const registre = sessionsIAIA.creaRegistreSessionsIAIA();
  const { promise, resolve } = Promise.withResolvers();
  const desaPrimerTitol = vi.fn(async (...args) => {
    await promise;
    return registre.desaPrimerTitol(...args);
  });
  const fabrica = vi.spyOn(sessionsIAIA, 'creaRegistreSessionsIAIA').mockReturnValue({ ...registre, desaPrimerTitol });
  const resposta = vi.fn(() => 'Resposta efímera');
  try {
    const { result } = setup(base(), resposta);
    let id;
    act(() => { id = result.current.novaSessioIAIA(); });
    const filNou = result.current.chatThreads.find((fil) => fil.id === id);
    let primer, segon;
    await act(async () => {
      primer = result.current.sendChatMessage(filNou, 'Què és el Mercat?');
      segon = result.current.sendChatMessage(filNou, 'Ara la Biblioteca');
    });
    await waitFor(() => expect(desaPrimerTitol).toHaveBeenCalledOnce());
    expect(resposta).not.toHaveBeenCalled();
    expect(result.current.chatThreads.find((fil) => fil.id === id)?.title).not.toBe('el Mercat');
    expect(result.current.getThreadMessages(id).map(({ text }) => text)).toEqual([BENVINGUDA_IAIA]);
    await act(async () => { resolve(); await Promise.all([primer, segon]); });
    expect(result.current.getThreadMessages(id).filter(({ sender }) => sender === 'me').map(({ text }) => text))
      .toEqual(['Què és el Mercat?', 'Ara la Biblioteca']);
    expect(await registre.llig('poble:usuari-a')).toEqual([{ id, titol: 'el Mercat' }]);
  } finally {
    resolve();
    fabrica.mockRestore();
  }
});


it('oblida un fil actiu amb resposta pendent, conserva els altres i no el restaura en una segona pestanya', async () => {
  const fals = creaIdbFals(), canals = creaCanalFals();
  vi.stubGlobal('indexedDB', fals.idb);
  vi.stubGlobal('BroadcastChannel', canals.Canal);
  const pendent = Promise.withResolvers();
  let senyal;
  const a = setup(base(), (text, { signal }) => { if (text.startsWith('Mercat')) { senyal = signal; return pendent.promise; } return 'Biblioteca oberta'; });
  let id;
  act(() => { id = a.result.current.novaSessioIAIA(); });
  const filA = a.result.current.chatThreads.find(f => f.id === id);
  await act(async () => { await a.result.current.sendChatMessage(filA, 'Mercat. Cos que no ha de persistir.'); });
  let altre;
  act(() => { altre = a.result.current.novaSessioIAIA(); });
  await act(async () => { await a.result.current.sendChatMessage(a.result.current.chatThreads.find(f => f.id === altre), 'Biblioteca'); });
  const b = setup(base());
  await waitFor(() => expect(b.result.current.chatThreads.some(f => f.id === id)).toBe(true));
  await act(async () => { expect(await b.result.current.oblidaSessioIAIA(id)).toBe(true); });
  await waitFor(() => expect(a.result.current.sessioIAIAOblidada(id)).toBe(true));
  expect(senyal.aborted).toBe(true);
  await act(async () => { pendent.resolve('Resposta que arriba massa tard'); });
  expect(a.result.current.getThreadMessages(id)).toEqual([]);
  await act(async () => { expect(await a.result.current.sendChatMessage(filA, 'Una altra pregunta tardana')).toEqual([]); });
  expect(a.result.current.chatThreads.some(f => f.id === id)).toBe(false);
  expect(a.result.current.getThreadMessages(altre).at(-1).text).toBe('Biblioteca oberta');
  expect(b.result.current.chatThreads.find(f => f.id === altre)?.title).toBe('Biblioteca');
  expect(JSON.stringify(fals.files('xat-iaia-titols', 'titols'))).not.toMatch(/Mercat|Cos que|Resposta que/);
  a.unmount(); b.unmount();
  const c = setup(base());
  await waitFor(() => expect(c.result.current.esperaSessioIAIA(id)).toBe(false));
  expect(c.result.current.chatThreads.some(f => f.id === id)).toBe(false);
  expect(c.result.current.getThreadMessages(ID_FIL_LOCAL_IAIA)).toHaveLength(1);
});

it('oblida també l’esborrany mentre el primer títol està esperant i no publica la pregunta tardana', async () => {
  vi.stubGlobal('indexedDB', creaIdbFals().idb);
  vi.stubGlobal('BroadcastChannel', null);
  const registre = sessionsIAIA.creaRegistreSessionsIAIA();
  const pendent = Promise.withResolvers();
  const desa = vi.fn(async (...args) => { await pendent.promise; return registre.desaPrimerTitol(...args); });
  const fabrica = vi.spyOn(sessionsIAIA, 'creaRegistreSessionsIAIA').mockReturnValue({ ...registre, desaPrimerTitol: desa });
  const resposta = vi.fn(() => 'Resposta');
  try {
    const { result } = setup(base(), resposta);
    let id;
    act(() => { id = result.current.novaSessioIAIA(); });
    const filNou = result.current.chatThreads.find(f => f.id === id);
    let enviant;
    await act(async () => { enviant = result.current.sendChatMessage(filNou, 'Tema privat'); });
    await waitFor(() => expect(desa).toHaveBeenCalledOnce());
    await act(async () => { await result.current.oblidaSessioIAIA(id); });
    await act(async () => { pendent.resolve(); expect(await enviant).toEqual([]); });
    expect(result.current.chatThreads.some(f => f.id === id)).toBe(false);
    expect(result.current.getThreadMessages(id)).toEqual([]);
    expect(resposta).not.toHaveBeenCalled();
    expect(await registre.llig('poble:usuari-a')).toEqual([]);
    let nou;
    act(() => { nou = result.current.novaSessioIAIA(); });
    expect(nou).not.toBe(id);
  } finally { pendent.resolve(); fabrica.mockRestore(); }
});

it('una quota fallida conserva el títol, propaga l’error i admet el reintent', async () => {
  vi.stubGlobal('indexedDB', creaIdbFals().idb);
  vi.stubGlobal('BroadcastChannel', null);
  const registre = sessionsIAIA.creaRegistreSessionsIAIA();
  const quota = Object.assign(new Error('Quota plena'), { name: 'QuotaExceededError' });
  const oblida = vi.fn().mockRejectedValueOnce(quota).mockImplementation((...args) => registre.oblidaSessio(...args));
  const fabrica = vi.spyOn(sessionsIAIA, 'creaRegistreSessionsIAIA').mockReturnValue({ ...registre, oblidaSessio: oblida });
  try {
    const { result } = setup();
    let id;
    act(() => { id = result.current.novaSessioIAIA(); });
    await act(async () => { await result.current.sendChatMessage(result.current.chatThreads.find(f => f.id === id), 'Biblioteca'); });
    await act(async () => { await expect(result.current.oblidaSessioIAIA(id)).rejects.toBe(quota); });
    expect(result.current.chatThreads.find(f => f.id === id)?.title).toBe('Biblioteca');
    expect(result.current.sessioIAIAOblidada(id)).toBe(false);
    await act(async () => { expect(await result.current.oblidaSessioIAIA(id)).toBe(true); });
    expect(result.current.chatThreads.some(f => f.id === id)).toBe(false);
  } finally { fabrica.mockRestore(); }
});

it('el proveïdor es buida en canviar persona o backend sense necessitar un key extern', async () => {
  vi.stubGlobal('indexedDB', creaIdbFals().idb);
  vi.stubGlobal('BroadcastChannel', null);
  const original = { ...base(), ambitEstable: JSON.stringify(['backend-a', 'usuari-a', 'actor-a']) };
  const pendent = Promise.withResolvers();
  const { result, rerender } = setup(original, () => pendent.promise);
  let id;
  act(() => { id = result.current.novaSessioIAIA(); });
  await act(async () => { await result.current.sendChatMessage(result.current.chatThreads.find(f => f.id === id), 'Pregunta efímera'); });
  const enviaAntic = result.current.sendChatMessage;
  original.ambitEstable = JSON.stringify(['backend-b', 'usuari-a', 'actor-a']);
  rerender();
  await act(async () => { pendent.resolve('Resposta antiga'); });
  expect(result.current.chatThreads.some(f => f.id === id)).toBe(false);
  expect(result.current.getThreadMessages(id)).toEqual([]);
  await act(async () => { expect(await enviaAntic({ id }, 'Una pregunta antiga')).toEqual([]); });
  original.joId = 'usuari-b'; original.ambitEstable = JSON.stringify(['backend-b', 'usuari-b', 'actor-a']);
  rerender();
  expect(result.current.getThreadMessages(ID_FIL_LOCAL_IAIA).map(m => m.text)).toEqual([BENVINGUDA_IAIA]);
});


it('eixir de la persona buida també els fils en memòria d’una altra pestanya i invalida una resposta tardana', async () => {
  const fals = creaIdbFals(), canals = creaCanalFals();
  vi.stubGlobal('indexedDB', fals.idb);
  vi.stubGlobal('BroadcastChannel', canals.Canal);
  const original = { ...base(), ambitEstable: JSON.stringify(['backend-a', 'usuari-a', 'actor-a']) };
  const pendent = Promise.withResolvers();
  let senyal;
  const { result } = setup(original, (_, { signal }) => { senyal = signal; return pendent.promise; });
  let id;
  act(() => { id = result.current.novaSessioIAIA(); });
  await act(async () => { await result.current.sendChatMessage(result.current.chatThreads.find(f => f.id === id), 'Tema privat'); });
  const registre = sessionsIAIA.creaRegistreSessionsIAIA();
  try {
    await act(async () => { await registre.oblidaPersona('usuari-a'); });
    await waitFor(() => expect(result.current.chatThreads.some(f => f.id === id)).toBe(false));
    expect(senyal.aborted).toBe(true);
    await act(async () => { pendent.resolve('Resposta antiga'); });
    expect(result.current.getThreadMessages(id)).toEqual([]);
    expect(JSON.stringify(fals.files('xat-iaia-titols', 'titols'))).not.toContain('Tema privat');
  } finally { pendent.resolve(); registre.tanca(); }
});


it('una lectura que acaba tard no restaura el títol que una notificació més nova ja ha oblidat', async () => {
  vi.stubGlobal('indexedDB', creaIdbFals().idb);
  vi.stubGlobal('BroadcastChannel', null);
  const registre = sessionsIAIA.creaRegistreSessionsIAIA();
  const id = 'iaia-local-00000000-0000-4000-8000-000000000066';
  await registre.desaPrimerTitol('poble:usuari-a', id, 'Mercat');
  const pendent = Promise.withResolvers();
  let primera = true, estatAntic;
  const lligEstat = vi.fn(async (...args) => {
    const estat = await registre.lligEstat(...args);
    if (primera) { primera = false; estatAntic = estat; return pendent.promise; }
    return estat;
  });
  const fabrica = vi.spyOn(sessionsIAIA, 'creaRegistreSessionsIAIA').mockReturnValue({ ...registre, lligEstat });
  try {
    const { result } = setup();
    await waitFor(() => expect(estatAntic?.sessions).toEqual([{ id, titol: 'Mercat' }]));
    await act(async () => { await registre.oblidaSessio('poble:usuari-a', id); });
    await waitFor(() => expect(result.current.sessioIAIAOblidada(id)).toBe(true));
    await act(async () => { pendent.resolve(estatAntic); });
    expect(result.current.chatThreads.some(f => f.id === id)).toBe(false);
    expect(result.current.getThreadMessages(id)).toEqual([]);
  } finally { pendent.resolve(estatAntic); fabrica.mockRestore(); }
});
