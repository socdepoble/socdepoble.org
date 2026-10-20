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
import { CODI_MODERACIO, errorDeModeracio } from '../../data/contracte.js';

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
  m.estatNormes.mockResolvedValue({ versio: '2026-10-20', acceptadaAl: null });
});
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
    m.acceptaNormes.mockResolvedValueOnce({ versio: '2026-10-20', acceptadaAl: '2026-10-20T12:00:00Z' });
    let despres;
    await act(async () => {
      await dialegs.normes.onAccepta();
      despres = valor.asseguraNormes();   // encara el valor d'abans del pintat
    });
    expect(m.acceptaNormes).toHaveBeenCalledWith('2026-10-20', REMOT);
    await expect(primera).resolves.toBe(true);
    await expect(despres).resolves.toBe(true);
    expect(getVal('normes-convivencia:A', null)).toBe('2026-10-20');
    expect(dialegs.normes.obert).toBe(false);
    expect(valor.normesPendents).toBe(false);
  });

  test('ja acceptades en este dispositiu: resol true sense obrir res ni preguntar al servidor', async () => {
    setVal('normes-convivencia:A', '2026-10-20');
    await munta();
    expect(valor.normesPendents).toBe(false);
    await expect(valor.asseguraNormes()).resolves.toBe(true);
    expect(dialegs.normes.obert).toBe(false);
    expect(m.estatNormes).not.toHaveBeenCalled();
  });

  test('el servidor diu que ja les havia acceptades: es recorda sense obrir res', async () => {
    m.estatNormes.mockResolvedValue({ versio: '2026-10-20', acceptadaAl: '2026-10-19T09:00:00Z' });
    await munta();
    await waitFor(() => expect(valor.normesPendents).toBe(false));
    expect(m.estatNormes).toHaveBeenCalledWith(expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(getVal('normes-convivencia:A', null)).toBe('2026-10-20');
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

  test('un error en desar continua obert i rebutja amb el code; sense migració s’accepta en este dispositiu', async () => {
    await munta();
    let promesa;
    act(() => { promesa = valor.asseguraNormes(); });
    m.acceptaNormes.mockRejectedValueOnce(errorDeModeracio(CODI_MODERACIO.DESCONEGUT));
    let error;
    await act(async () => { error = await dialegs.normes.onAccepta().catch((e) => e); });
    expect(error).toMatchObject({ code: 'desconegut' });
    expect(dialegs.normes.obert).toBe(true);
    m.acceptaNormes.mockRejectedValueOnce(errorDeModeracio(CODI_MODERACIO.NO_DISPONIBLE));
    await act(async () => { await dialegs.normes.onAccepta(); });
    await expect(promesa).resolves.toBe(true);
    expect(getVal('normes-convivencia:A', null)).toBe('2026-10-20');
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
    await act(async () => { tardana.resol({ versio: '2026-10-20', acceptadaAl: '2026-10-19T09:00:00Z' }); });
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
