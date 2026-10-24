/* Fase D (261020, tasca 2; pla 261020_1300) · ProveidorModeracio amb un port
   de mentida (cap adaptador: E1 de tractor-enxufe) i un amfitrió de diàlegs
   de prova que només en guarda les props. El conjunt de bloquejos per àmbit,
   la capa optimista (amagar a l'instant, revertir si el servidor diu que no,
   la sessió si no hi ha migració), la identitat estable de les funcions
   (crítica 261020, 12), el focus quan l'obridor desapareix i la porta de les
   normes només amb refs (crítica 261020, 11). */
import React, { StrictMode } from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const m = vi.hoisted(() => ({
  session: { currentUser: { id: 'A' }, generacio: 1 }, toast: vi.fn(), caps: new Set(),
  llistaBloquejos: vi.fn(), bloquejaAutor: vi.fn(), desbloquejaAutor: vi.fn(), denunciaContingut: vi.fn(),
  estatNormes: vi.fn(), acceptaNormes: vi.fn()
}));
vi.mock('./SessionContext.jsx', () => ({ useSession: () => m.session }));
vi.mock('../../host.js', () => ({ quanLlest: async () => undefined }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: m.toast }) }));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: (nom) => m.caps.has(nom),
  llistaBloquejos: (...a) => m.llistaBloquejos(...a),
  bloquejaAutor: (...a) => m.bloquejaAutor(...a),
  desbloquejaAutor: (...a) => m.desbloquejaAutor(...a),
  denunciaContingut: (...a) => m.denunciaContingut(...a),
  estatNormes: (...a) => m.estatNormes(...a),
  acceptaNormes: (...a) => m.acceptaNormes(...a)
}));
import { ProveidorModeracio } from './ModeracioContext.jsx';
import { useModeracio } from '../../components/PedraSeca/hooks/moderacioDePoble.js';
import { getVal, setVal } from '../../config/storage.js';
import { CODI_MODERACIO, VERSIO_NORMES_CONVIVENCIA, errorDeModeracio } from '../../data/contracte.js';

const POBLE = '7a1b2c3d-4e5f-4a60-8b71-c2d3e4f5a6b7';
const REMOT = Object.freeze({ dataMode: 'remote', supabaseUrl: 'http://localhost:54321', tenantId: POBLE });
const PEPA = Object.freeze({ tipus: 'persona', id: 'pepa', nom: 'Pepa', creatAl: '2026-10-19T10:00:00Z' });
const OBJECTIU = Object.freeze({
  tipus: 'publicacio', id: 'p1', titol: 'Fira', autor: Object.freeze({ tipus: 'persona', id: 'pepa', nom: 'Pepa' }), filId: null, bloquejable: true
});
const DE_PEPA = { id: 'p1', ownerUserId: 'pepa' };

const deferred = () => { let resol, rebutja; const promesa = new Promise((a, b) => { resol = a; rebutja = b; }); return { promesa, resol, rebutja }; };
let valor;
let dialegs;
function Sonda() { valor = useModeracio(); return null; }
function DialegsDeProva(props) { dialegs = props; return null; }
const arbre = (config = REMOT, { ambDialegs = true, fills = null } = {}) => (
  <StrictMode>
    <ProveidorModeracio config={config} Dialegs={ambDialegs ? DialegsDeProva : null}>
      <Sonda />
      {fills}
    </ProveidorModeracio>
  </StrictMode>
);
async function munta(config = REMOT, opcions) {
  const vista = render(arbre(config, opcions));
  await waitFor(() => expect(valor.estatBloquejos).toBe('llest'));
  return vista;
}

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  valor = null; dialegs = null;
  m.session = { currentUser: { id: 'A' }, generacio: 1 };
  m.caps = new Set(['moderacio', 'normesConvivencia']);
  m.llistaBloquejos.mockResolvedValue([PEPA]);
  m.estatNormes.mockResolvedValue({ versio: VERSIO_NORMES_CONVIVENCIA, acceptadaAl: null });
});
/* Actualitzada a posta (261024 T2): el record del dispositiu és { versio, servidor: true }
   i la versió es llig del contracte (2026-10-24), no d'una data copiada. */
const RECORD = Object.freeze({ versio: VERSIO_NORMES_CONVIVENCIA, servidor: true });
afterEach(() => { cleanup(); });

describe('bloquejos', () => {
  test('carrega els de la persona de la sessió i amaga el que signa', async () => {
    await munta();
    expect(m.llistaBloquejos).toHaveBeenCalledWith(expect.objectContaining({ tenantId: POBLE, signal: expect.any(AbortSignal) }));
    expect(valor).toMatchObject({ disponible: true, potBloquejar: true, estatBloquejos: 'llest', codiErrorBloquejos: null });
    expect(valor.bloquejats).toEqual([PEPA]);
    expect(valor.esPersonaBloquejada('pepa')).toBe(true);
    expect(valor.esPersonaBloquejada('joan')).toBe(false);
    expect(valor.esElementBloquejat(DE_PEPA)).toBe(true);
    expect(valor.esElementBloquejat({ id: 'p2', ownerUserId: 'joan' })).toBe(false);
  });

  test('sense la capacitat no es demana res i no hi ha moderació', async () => {
    m.caps = new Set();
    await munta();
    expect(m.llistaBloquejos).not.toHaveBeenCalled();
    expect(valor).toMatchObject({ disponible: false, potBloquejar: false, bloquejats: [] });
  });

  test('una renovació del JWT amb la mateixa llista conserva la identitat de les funcions (cap targeta no torna a pintar)', async () => {
    const vista = await munta();
    const { esElementBloquejat, esPersonaBloquejada, bloquejats } = valor;
    m.llistaBloquejos.mockResolvedValue([{ ...PEPA }]);
    m.session = { ...m.session, generacio: 2 };
    vista.rerender(arbre());
    await waitFor(() => expect(m.llistaBloquejos.mock.calls.length).toBeGreaterThanOrEqual(2));
    await act(async () => {});
    expect(valor.esElementBloquejat).toBe(esElementBloquejat);
    expect(valor.esPersonaBloquejada).toBe(esPersonaBloquejada);
    expect(valor.bloquejats).toBe(bloquejats);
  });

  test('bloquejar amaga a l’instant, abans que respondga el servidor; l’èxit tanca i avisa', async () => {
    m.llistaBloquejos.mockResolvedValue([]);
    await munta();
    expect(valor.esElementBloquejat(DE_PEPA)).toBe(false);
    act(() => valor.demanaBloqueig(OBJECTIU));
    expect(dialegs.bloqueig).toMatchObject({ obert: true, objectiu: OBJECTIU });
    const servidor = deferred();
    m.bloquejaAutor.mockReturnValueOnce(servidor.promesa);
    let confirma;
    act(() => { confirma = dialegs.bloqueig.onConfirma(); });
    expect(valor.esElementBloquejat(DE_PEPA)).toBe(true);
    expect(dialegs.bloqueig.obert).toBe(true);
    expect(m.bloquejaAutor).toHaveBeenCalledWith({ tipus: 'persona', id: 'pepa', nom: 'Pepa' }, REMOT);
    await act(async () => { servidor.resol({ ...PEPA, creatAl: '2026-10-20T12:00:00Z' }); await confirma; });
    expect(dialegs.bloqueig.obert).toBe(false);
    expect(m.toast).toHaveBeenCalledWith('Has bloquejat Pepa.', 'success');
    expect(valor.bloquejats).toEqual([{ ...PEPA, creatAl: '2026-10-20T12:00:00Z' }]);
  });

  test('si el servidor ho rebutja, la clau torna a com era, el diàleg continua obert i rep el code', async () => {
    m.llistaBloquejos.mockResolvedValue([]);
    await munta();
    act(() => valor.demanaBloqueig(OBJECTIU));
    m.bloquejaAutor.mockRejectedValueOnce(errorDeModeracio(CODI_MODERACIO.LIMIT));
    let error;
    await act(async () => { error = await dialegs.bloqueig.onConfirma().catch((e) => e); });
    expect(error).toMatchObject({ code: 'limit' });
    expect(valor.esElementBloquejat(DE_PEPA)).toBe(false);
    expect(dialegs.bloqueig.obert).toBe(true);
    expect(m.toast).not.toHaveBeenCalled();
  });

  test('sense la migració (no-disponible), el bloqueig dura la sessió i ho diu l’avís', async () => {
    m.llistaBloquejos.mockResolvedValue([]);
    await munta();
    act(() => valor.demanaBloqueig(OBJECTIU));
    m.bloquejaAutor.mockRejectedValueOnce(errorDeModeracio(CODI_MODERACIO.NO_DISPONIBLE));
    await act(async () => { await dialegs.bloqueig.onConfirma(); });
    expect(valor.esElementBloquejat(DE_PEPA)).toBe(true);
    expect(dialegs.bloqueig.obert).toBe(false);
    expect(m.toast).toHaveBeenCalledWith('Has bloquejat Pepa en esta sessió: el servidor encara no guarda els bloquejos.', 'info');
  });

  test('desbloquejar lleva i avisa; si falla, torna a com era i rebutja amb el code', async () => {
    await munta();
    m.desbloquejaAutor.mockRejectedValueOnce(errorDeModeracio(CODI_MODERACIO.DESCONEGUT));
    let error;
    await act(async () => { error = await valor.desbloqueja({ tipus: 'persona', id: 'pepa' }).catch((e) => e); });
    expect(error).toMatchObject({ code: 'desconegut' });
    expect(valor.esPersonaBloquejada('pepa')).toBe(true);
    m.desbloquejaAutor.mockResolvedValueOnce({ desbloquejat: true });
    await act(async () => { await valor.desbloqueja({ tipus: 'persona', id: 'pepa' }); });
    expect(valor.esPersonaBloquejada('pepa')).toBe(false);
    expect(valor.bloquejats).toEqual([]);
    expect(m.toast).toHaveBeenCalledWith('Has desbloquejat Pepa.', 'success');
    /* Tornar a bloquejar després de desbloquejar torna a amagar (crítica 261020, 2). */
    act(() => valor.demanaBloqueig(OBJECTIU));
    m.bloquejaAutor.mockResolvedValueOnce(PEPA);
    await act(async () => { await dialegs.bloqueig.onConfirma(); });
    expect(valor.esPersonaBloquejada('pepa')).toBe(true);
  });

  test('canviar de persona buida la capa de la sessió i torna a carregar', async () => {
    m.llistaBloquejos.mockResolvedValue([]);
    const vista = await munta();
    act(() => valor.demanaBloqueig(OBJECTIU));
    m.bloquejaAutor.mockRejectedValueOnce(errorDeModeracio(CODI_MODERACIO.NO_DISPONIBLE));
    await act(async () => { await dialegs.bloqueig.onConfirma(); });
    expect(valor.esPersonaBloquejada('pepa')).toBe(true);
    m.session = { currentUser: { id: 'B' }, generacio: 2 };
    vista.rerender(arbre());
    expect(valor.esPersonaBloquejada('pepa')).toBe(false);
    await waitFor(() => expect(valor.estatBloquejos).toBe('llest'));
    expect(valor.esPersonaBloquejada('pepa')).toBe(false);
  });

  test('un visitant del remot denuncia però no bloqueja', async () => {
    m.session = { currentUser: null, generacio: 1 };
    m.llistaBloquejos.mockResolvedValue([]);
    await munta();
    expect(valor).toMatchObject({ disponible: true, potBloquejar: false });
  });
});

describe('denúncies', () => {
  test('envia l’objectiu amb l’autor i el fil; «Bloqueja també» passa al bloqueig amb el mateix obridor', async () => {
    m.llistaBloquejos.mockResolvedValue([]);
    await munta();
    const boto = document.createElement('button');
    document.body.append(boto);
    act(() => valor.demanaDenuncia({ ...OBJECTIU, tipus: 'missatge', id: 'm1', filId: 'f1' }, boto));
    expect(dialegs.denuncia).toMatchObject({ obert: true, potBloquejarTambe: true });
    m.denunciaContingut.mockResolvedValueOnce({ rebuda: true, repetida: false });
    await expect(dialegs.denuncia.onEnvia({ motiu: 'ofensiu', detall: 'x' })).resolves.toEqual({ rebuda: true, repetida: false });
    expect(m.denunciaContingut).toHaveBeenCalledWith({
      objecte: { tipus: 'missatge', id: 'm1' }, motiu: 'ofensiu', detall: 'x', autor: { tipus: 'persona', id: 'pepa' }, filId: 'f1'
    }, REMOT);
    expect(m.toast).not.toHaveBeenCalled();
    act(() => dialegs.denuncia.onBloqueja());
    expect(dialegs.denuncia.obert).toBe(false);
    expect(dialegs.bloqueig).toMatchObject({ obert: true, objectiu: expect.objectContaining({ id: 'm1' }) });
    boto.remove();
  });

  test('«Bloqueja també» no s’oferix si ja està bloquejat o no és bloquejable', async () => {
    await munta();
    act(() => valor.demanaDenuncia(OBJECTIU));
    expect(dialegs.denuncia.potBloquejarTambe).toBe(false);
    act(() => valor.demanaDenuncia({ ...OBJECTIU, autor: { tipus: 'persona', id: 'joan', nom: 'Joan' }, bloquejable: false }));
    expect(dialegs.denuncia.potBloquejarTambe).toBe(false);
  });

  test('en tancar, si l’obridor ja no hi és (la targeta amagada), el focus va al main', async () => {
    m.llistaBloquejos.mockResolvedValue([]);
    const main = document.createElement('main');
    main.tabIndex = -1;
    const boto = document.createElement('button');
    main.append(boto);
    document.body.append(main);
    await munta();
    act(() => valor.demanaBloqueig(OBJECTIU, boto));
    boto.remove();
    act(() => dialegs.bloqueig.onTanca());
    await waitFor(() => expect(document.activeElement).toBe(main));
    main.remove();
  });
});

describe('normes de convivència', () => {
  test('dues crides alhora comparteixen la MATEIXA promesa; acceptar crida acceptaNormes, ho recorda i la següent resol a l’instant', async () => {
    await munta();
    expect(valor.normesPendents).toBe(true);
    let primera, segona;
    act(() => { primera = valor.asseguraNormes(); segona = valor.asseguraNormes(); });
    expect(segona).toBe(primera);
    expect(dialegs.normes.obert).toBe(true);
    m.acceptaNormes.mockResolvedValueOnce({ versio: VERSIO_NORMES_CONVIVENCIA, acceptadaAl: '2026-10-24T12:00:00Z' });
    let despres;
    await act(async () => {
      await dialegs.normes.onAccepta();
      despres = valor.asseguraNormes();   // encara el valor d'abans del pintat
    });
    expect(m.acceptaNormes).toHaveBeenCalledWith(VERSIO_NORMES_CONVIVENCIA, REMOT);
    await expect(primera).resolves.toBe(true);
    await expect(despres).resolves.toBe(true);
    expect(getVal('normes-convivencia:A', null)).toEqual(RECORD);
    expect(dialegs.normes.obert).toBe(false);
    expect(valor.normesPendents).toBe(false);
  });

  test('ja acceptades i confirmades pel servidor en este dispositiu: resol true sense obrir res ni preguntar al servidor', async () => {
    setVal('normes-convivencia:A', RECORD);
    await munta();
    expect(valor.normesPendents).toBe(false);
    await expect(valor.asseguraNormes()).resolves.toBe(true);
    expect(dialegs.normes.obert).toBe(false);
    expect(m.estatNormes).not.toHaveBeenCalled();
  });

  /* T2 (261024; Codex C-02) · El record antic (la versió sola, de quan sense
     migració s'acceptava només al dispositiu) i el d'una versió anterior ja no
     obrin la porta: es pregunta al servidor i, si no la té, es torna a demanar. */
  test('un record antic o d’una altra versió no compta: es pregunta al servidor i la porta continua tancada', async () => {
    for (const record of [VERSIO_NORMES_CONVIVENCIA, { versio: '2026-10-20', servidor: true }, { versio: VERSIO_NORMES_CONVIVENCIA }]) {
      m.estatNormes.mockClear();
      setVal('normes-convivencia:A', record);
      const vista = await munta();
      await waitFor(() => expect(m.estatNormes).toHaveBeenCalled());
      expect(valor.normesPendents, JSON.stringify(record)).toBe(true);
      let promesa;
      act(() => { promesa = valor.asseguraNormes(); });
      expect(dialegs.normes.obert).toBe(true);
      act(() => dialegs.normes.onTanca());
      await expect(promesa).resolves.toBe(false);
      vista.unmount();
    }
  });

  test('el servidor diu que ja les havia acceptades: es recorda sense obrir res', async () => {
    m.estatNormes.mockResolvedValue({ versio: VERSIO_NORMES_CONVIVENCIA, acceptadaAl: '2026-10-24T09:00:00Z' });
    await munta();
    await waitFor(() => expect(valor.normesPendents).toBe(false));
    expect(m.estatNormes).toHaveBeenCalledWith(expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(getVal('normes-convivencia:A', null)).toEqual(RECORD);
  });

  test('«Ara no» i l’enllaç a /legal declinen: false', async () => {
    await munta();
    let promesa;
    act(() => { promesa = valor.asseguraNormes(); });
    act(() => dialegs.normes.onTanca());
    await expect(promesa).resolves.toBe(false);
    act(() => { promesa = valor.asseguraNormes(); });
    act(() => dialegs.normes.onTanca('legal'));
    await expect(promesa).resolves.toBe(false);
    expect(dialegs.normes.obert).toBe(false);
    expect(getVal('normes-convivencia:A', null)).toBeNull();
  });

  /* Actualitzada a posta (261024 T2): Codex C-02. Abans, sense migració
     ('no-disponible') l'acceptació es quedava al dispositiu i la porta s'obria;
     ara rebutja, el diàleg continua obert, no es desa res i la porta espera. */
  test('un error en desar, també sense migració (no-disponible), continua obert, rebutja amb el code i no desa res', async () => {
    await munta();
    let promesa;
    let resolta = false;
    act(() => { promesa = valor.asseguraNormes(); promesa.then(() => { resolta = true; }); });
    for (const codi of [CODI_MODERACIO.DESCONEGUT, CODI_MODERACIO.NO_DISPONIBLE]) {
      m.acceptaNormes.mockRejectedValueOnce(errorDeModeracio(codi));
      let error;
      await act(async () => { error = await dialegs.normes.onAccepta().catch((e) => e); });
      expect(error).toMatchObject({ code: codi });
      expect(dialegs.normes.obert).toBe(true);
      expect(getVal('normes-convivencia:A', null)).toBeNull();
      expect(valor.normesPendents).toBe(true);
      expect(resolta).toBe(false);
    }
    /* Quan el servidor ja la desa, la mateixa porta pendent s'obri. */
    m.acceptaNormes.mockResolvedValueOnce({ versio: VERSIO_NORMES_CONVIVENCIA, acceptadaAl: '2026-10-24T12:00:00Z' });
    await act(async () => { await dialegs.normes.onAccepta(); });
    await expect(promesa).resolves.toBe(true);
    expect(getVal('normes-convivencia:A', null)).toEqual(RECORD);
  });

  test('en remot sense la capacitat normesConvivencia no hi ha on desar-la: rebutja amb no-disponible sense cridar el port', async () => {
    m.caps = new Set(['moderacio']);
    await munta();
    let promesa;
    act(() => { promesa = valor.asseguraNormes(); });
    let error;
    await act(async () => { error = await dialegs.normes.onAccepta().catch((e) => e); });
    expect(error).toMatchObject({ code: CODI_MODERACIO.NO_DISPONIBLE });
    expect(m.acceptaNormes).not.toHaveBeenCalled();
    expect(dialegs.normes.obert).toBe(true);
    expect(getVal('normes-convivencia:A', null)).toBeNull();
    act(() => dialegs.normes.onTanca());
    await expect(promesa).resolves.toBe(false);
  });

  test('una resposta tardana de l’estat per a A no accepta per a B; canviar de persona resol la pendent amb false', async () => {
    const tardana = deferred();
    m.estatNormes.mockReturnValueOnce(tardana.promesa);
    const vista = await munta();
    let promesa;
    act(() => { promesa = valor.asseguraNormes(); });
    m.session = { currentUser: { id: 'B' }, generacio: 2 };
    vista.rerender(arbre());
    await expect(promesa).resolves.toBe(false);
    await act(async () => { tardana.resol({ versio: VERSIO_NORMES_CONVIVENCIA, acceptadaAl: '2026-10-24T09:00:00Z' }); });
    await waitFor(() => expect(valor.estatBloquejos).toBe('llest'));
    expect(valor.normesPendents).toBe(true);
    expect(getVal('normes-convivencia:B', null)).toBeNull();
  });

  test('la porta no s’aplica en llavor, sense sessió ni sense amfitrió de diàlegs', async () => {
    for (const [config, sessio, ambDialegs] of [[{ dataMode: 'seed' }, { id: 'A' }, true], [REMOT, null, true], [REMOT, { id: 'A' }, false]]) {
      m.session = { currentUser: sessio, generacio: 1 };
      const vista = await munta(config, { ambDialegs });
      expect(valor.normesPendents).toBe(false);
      await expect(valor.asseguraNormes()).resolves.toBe(true);
      vista.unmount();
    }
    expect(m.estatNormes).not.toHaveBeenCalled();
  });
});

/* Integració 261024 (Codex C-02) · El servidor rebutja igualment (SDP-MOD-428,
   2610241400_normes_exigides_ugc.sql): qui rep el rebuig crida
   asseguraNormes({ rebutjades: true }). El record d'este dispositiu per a la
   versió vigent s'oblida, l'estat del servidor ja no les accepta (el
   disparador mana) i el diàleg es torna a obrir; només una acceptació
   explícita torna a obrir la porta. Sense porta, false: ningú no reintenta. */
describe('normes de convivència · el rebuig del servidor (SDP-MOD-428)', () => {
  test('oblida el record, torna a obrir el diàleg i, acceptades, ho desa i resol true', async () => {
    setVal('normes-convivencia:A', RECORD);
    await munta();
    expect(valor.normesPendents).toBe(false);
    /* L'estat del servidor diria que sí (una altra versió, una altra base): no compta. */
    m.estatNormes.mockResolvedValue({ versio: VERSIO_NORMES_CONVIVENCIA, acceptadaAl: '2026-10-24T09:00:00Z' });
    let promesa;
    let segona;
    act(() => { promesa = valor.asseguraNormes({ rebutjades: true }); segona = valor.asseguraNormes({ rebutjades: true }); });
    expect(segona).toBe(promesa);
    expect(dialegs.normes.obert).toBe(true);
    expect(getVal('normes-convivencia:A', null)).toBeNull();
    await act(async () => {});
    expect(valor.normesPendents).toBe(true);
    expect(m.estatNormes).not.toHaveBeenCalled();
    /* La porta de sempre també espera la mateixa resposta. */
    expect(valor.asseguraNormes()).toBe(promesa);
    m.acceptaNormes.mockResolvedValueOnce({ versio: VERSIO_NORMES_CONVIVENCIA, acceptadaAl: '2026-10-24T12:00:00Z' });
    await act(async () => { await dialegs.normes.onAccepta(); });
    await expect(promesa).resolves.toBe(true);
    expect(m.acceptaNormes).toHaveBeenCalledWith(VERSIO_NORMES_CONVIVENCIA, REMOT);
    expect(getVal('normes-convivencia:A', null)).toEqual(RECORD);
    expect(valor.normesPendents).toBe(false);
    await expect(valor.asseguraNormes()).resolves.toBe(true);
  });

  test('declinar resol false i el record continua oblidat: la crida següent torna a preguntar', async () => {
    setVal('normes-convivencia:A', RECORD);
    await munta();
    let promesa;
    act(() => { promesa = valor.asseguraNormes({ rebutjades: true }); });
    act(() => dialegs.normes.onTanca());
    await expect(promesa).resolves.toBe(false);
    expect(getVal('normes-convivencia:A', null)).toBeNull();
    expect(valor.normesPendents).toBe(true);
    act(() => { promesa = valor.asseguraNormes(); });
    expect(dialegs.normes.obert).toBe(true);
    act(() => dialegs.normes.onTanca());
    await expect(promesa).resolves.toBe(false);
  });

  test('un esdeveniment o qualsevol altra opció no és cap rebuig', async () => {
    setVal('normes-convivencia:A', RECORD);
    await munta();
    for (const opcions of [{ type: 'click' }, { rebutjades: 'si' }, null]) {
      await expect(valor.asseguraNormes(opcions)).resolves.toBe(true);
    }
    expect(dialegs.normes.obert).toBe(false);
    expect(getVal('normes-convivencia:A', null)).toEqual(RECORD);
  });

  test('sense porta (llavor, sense sessió o sense amfitrió) resol false sense obrir res ni oblidar res', async () => {
    for (const [config, sessio, ambDialegs] of [[{ dataMode: 'seed' }, { id: 'A' }, true], [REMOT, null, true], [REMOT, { id: 'A' }, false]]) {
      m.session = { currentUser: sessio, generacio: 1 };
      setVal('normes-convivencia:A', RECORD);
      const vista = await munta(config, { ambDialegs });
      await expect(valor.asseguraNormes({ rebutjades: true })).resolves.toBe(false);
      expect(dialegs?.normes?.obert ?? false).toBe(false);
      expect(getVal('normes-convivencia:A', null)).toEqual(RECORD);
      vista.unmount();
    }
  });
});
