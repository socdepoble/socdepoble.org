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

afterEach(cleanup);
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
