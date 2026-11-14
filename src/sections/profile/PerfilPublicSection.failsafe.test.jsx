/**
 * Gauntlet 261022_0225 (Tasca 1: «Erradicació del Spinner Infinit»; T9-1,
 * T9-4 i P4b-3 de l'auditoria) · La fitxa pública mai es queda en «Carregant
 * el perfil…» per sempre:
 *   · si en 3 s el host (quanLlest) i la consulta (loadPerfilPublic) no han
 *     acabat, la càrrega s'avorta i es pinta la reserva local de la clau (els
 *     àlies de la persona pilot, la IA del paquet, les entitats del Mestre) o
 *     un avís amb «Torna-ho a provar», sense bloquejar la navegació;
 *   · passat el termini, cap resposta tardana ni cap consulta nova;
 *   · en desmuntar o en canviar de clau, el termini es lleva i la càrrega
 *     s'avorta (el senyal arriba a quanLlest i a loadPerfilPublic);
 *   · un `agents` nou no torna a carregar la fitxa (T9-1);
 *   · mentre carrega, el títol del document no diu «Perfil no trobat» (T9-4);
 *   · «Escriu-li al xat» de la fitxa del paquet de Javi no porta a un directe
 *     que el servidor rebutja (P4b-3).
 * Temporitzadors falsos: cap espera de veres.
 */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '../../../tests/helpers/diccionaris.js';

const m = vi.hoisted(() => ({
  id: 'ruta', config: {}, capacitat: true, load: vi.fn(), quanLlest: async () => {}, seo: vi.fn(), navigate: vi.fn(),
  renders: [], t: (_, alternativa) => alternativa, xat: { senseSessio: false },
  identitat: { memberships: [], actor: null, setActor: vi.fn() }
}));
vi.mock('../xat/XatContext', () => ({ useXat: () => m.xat }));
vi.mock('../../app/contexts/IdentitatContext.jsx', () => ({ useIdentitat: () => m.identitat }));
vi.mock('../../app/contexts/RouterContext', () => ({
  useLocation: () => ({ search: '' }),
  useParams: () => ({ agentId: m.id }),
  useNavigate: () => m.navigate
}));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: m.t }),
  useUIState: () => ({ externalConfig: m.config })
}));
vi.mock('../../hooks/useSEO', () => ({ useSEO: (opcions) => m.seo(opcions) }));
vi.mock('../../data/backendPort.js', () => ({ teCapacitat: () => m.capacitat, loadPerfilPublic: (...args) => m.load(...args) }));
vi.mock('../../host.js', () => ({ quanLlest: (opcions) => m.quanLlest(opcions) }));
/* La resolució de l'entitat del projecte (una crida pròpia a loadPerfilPublic en remot) no és d'esta prova. */
vi.mock('../../hooks/useEntitatDelProjecte.js', () => ({ useEntitatDelProjecte: () => 0 }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: (props) => {
    m.renders.push(props);
    return (
      <div>
        <header className="page-title"><h1>{props.title}</h1></header>
        {props.subtitle ? <h2>{props.subtitle}</h2> : null}
        {props.lead ? <p className="lead">{props.lead}</p> : null}
        {props.children}
      </div>
    );
  }
}));
import PerfilPublicSection, { TERMINI_DEL_PERFIL_MS, TERMINI_DEL_REINTENT_MS, perfilDeLaPersonaPilot } from './PerfilPublicSection.jsx';
import { createTranslator } from '../../config/i18n.js';
import { SessionContext } from '../../app/contexts/objectesDeContext.js';

const CARREGANT = 'Carregant el perfil…';
const SENSE_RESPOSTA = 'No s’ha pogut carregar el perfil';
const SENSE_RESPOSTA_TEXT = 'El servidor de poble no respon ara mateix. Pots tornar-ho a provar o continuar navegant.';
const ENTRADILLA_DE_JAVI = "Dissenyador gràfic, sempre disposat a integrar-me en equips de treball on aprendre i aportar valor als projectes. Dins de l'Associació El Rentonar, coordine el Projecte Sóc de Poble.";
const UUID_JAVI = '7a7a7a7a-1b1b-4c4c-8d8d-9e9e9e9e9e9e';
const PERSONA = Object.freeze({
  tipus: 'persona', id: '5b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6', slug: null, nom: 'Pepa Soler', avatar: '', hero: '', lema: '', bio: '',
  presentacioHtml: '', poble: 'Benilloba', esIA: false, publicat: true, propietari: false, copyright: '', emoticona: ''
});

const penjat = () => new Promise(() => {});
function diferit() {
  let resol;
  const promesa = new Promise((resolve) => { resol = resolve; });
  return { promesa, resol };
}
const buida = () => act(async () => {});
const avanca = (ms) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });
const h1 = () => screen.getByRole('heading', { level: 1 }).textContent;
const titolsPintats = () => m.renders.map((props) => props.title);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  vi.clearAllMocks();
  m.id = 'ruta';
  m.config = { dataMode: 'remote' };
  m.capacitat = true;
  m.quanLlest = async () => {};
  m.load.mockReset();
  m.renders = [];
  m.xat = { senseSessio: false };
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Tasca 1 · el termini de 3 s', () => {
  test('el termini és de 3 s', () => {
    expect(TERMINI_DEL_PERFIL_MS).toBe(3000);
  });

  test('/javillinares sense resposta: «Carregant…» fins als 3 s i, llavors, la fitxa autèntica del paquet; la consulta s’avorta', async () => {
    m.id = 'javillinares';
    const servidor = diferit();
    m.load.mockReturnValue(servidor.promesa);
    render(<PerfilPublicSection />);
    await buida();
    expect(h1()).toBe(CARREGANT);
    /* T9-4 · Mentre carrega, el títol del document ho diu, i no s'indexa. */
    expect(m.seo).toHaveBeenLastCalledWith(expect.objectContaining({ title: CARREGANT, index: false }));
    expect(m.seo.mock.calls.map(([opcions]) => opcions.title)).not.toContain('Perfil no trobat');
    await avanca(TERMINI_DEL_PERFIL_MS - 1);
    expect(h1()).toBe(CARREGANT);
    await avanca(1);
    expect(h1()).toBe('Javi Llinares');
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('La Torre de les Maçanes');
    expect(document.querySelector('p.lead').textContent).toBe(ENTRADILLA_DE_JAVI);
    expect(m.seo).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'Javi Llinares', index: true }));
    /* El termini és estricte: la consulta s'avorta i una resposta tardana ja no canvia res. */
    const [[, opcions]] = m.load.mock.calls;
    expect(opcions.signal.aborted).toBe(true);
    servidor.resol({ ...PERSONA, id: UUID_JAVI, nom: 'Javi Llinares (servidor)', poble: 'La Torre de les Maçanes' });
    await buida();
    expect(h1()).toBe('Javi Llinares');
    expect(titolsPintats()).not.toContain('Javi Llinares (servidor)');
  });

  test('una clau sense reserva: l’avís amb «Torna-ho a provar», que torna a llançar la càrrega i avorta l’anterior', async () => {
    m.id = 'pepa-soler';
    m.load.mockReturnValueOnce(penjat()).mockResolvedValueOnce(PERSONA);
    render(<PerfilPublicSection />);
    await buida();
    await avanca(TERMINI_DEL_PERFIL_MS);
    expect(h1()).toBe(SENSE_RESPOSTA);
    expect(document.querySelector('p.lead').textContent).toBe(SENSE_RESPOSTA_TEXT);
    expect(m.seo).toHaveBeenLastCalledWith(expect.objectContaining({ title: SENSE_RESPOSTA, index: false }));
    /* REV-PERF-9 · L'avís també s'anuncia (el «Carregant…» era una regió viva). */
    expect(screen.getByRole('alert').textContent).toBe(SENSE_RESPOSTA);
    /* La navegació no queda bloquejada: el directori és a un clic. */
    fireEvent.click(screen.getByRole('button', { name: 'Torna al directori' }));
    expect(m.navigate).toHaveBeenCalledWith('/perfil');
    const primer = m.load.mock.calls[0][1].signal;
    fireEvent.click(screen.getByRole('button', { name: 'Torna-ho a provar' }));
    await buida();
    expect(primer.aborted).toBe(true);
    expect(m.load).toHaveBeenCalledTimes(2);
    expect(h1()).toBe('Pepa Soler');
  });

  test('passat el termini, una resposta tardana no canvia l’avís: la fitxa arriba amb «Torna-ho a provar»', async () => {
    m.id = 'pepa-soler';
    const servidor = diferit();
    m.load.mockReturnValueOnce(servidor.promesa).mockResolvedValueOnce(PERSONA);
    render(<PerfilPublicSection />);
    await buida();
    await avanca(TERMINI_DEL_PERFIL_MS);
    expect(h1()).toBe(SENSE_RESPOSTA);
    servidor.resol(PERSONA);
    await buida();
    expect(h1()).toBe(SENSE_RESPOSTA);
    fireEvent.click(screen.getByRole('button', { name: 'Torna-ho a provar' }));
    await buida();
    expect(h1()).toBe('Pepa Soler');
  });

  test('REV-PERF-2 · «Torna-ho a provar» de la mateixa clau té el temps d’una petició; una clau nova torna als 3 s', async () => {
    m.id = 'pepa-soler';
    m.load.mockImplementation(() => penjat());
    const { rerender } = render(<PerfilPublicSection />);
    await buida();
    /* La primera, sense: el pressupost de l'adaptador són els mateixos 3 s. */
    expect(m.load.mock.calls[0][1]).not.toHaveProperty('terminiMs');
    await avanca(TERMINI_DEL_PERFIL_MS);
    expect(h1()).toBe(SENSE_RESPOSTA);
    fireEvent.click(screen.getByRole('button', { name: 'Torna-ho a provar' }));
    await buida();
    expect(m.load.mock.calls[1][1].terminiMs).toBe(TERMINI_DEL_REINTENT_MS);
    await avanca(TERMINI_DEL_PERFIL_MS);
    expect(h1()).toBe(CARREGANT);
    await avanca(TERMINI_DEL_REINTENT_MS - TERMINI_DEL_PERFIL_MS - 1);
    expect(h1()).toBe(CARREGANT);
    await avanca(1);
    expect(h1()).toBe(SENSE_RESPOSTA);
    m.id = 'forn';
    rerender(<PerfilPublicSection />);
    await buida();
    expect(m.load.mock.calls[2][1]).not.toHaveProperty('terminiMs');
    await avanca(TERMINI_DEL_PERFIL_MS - 1);
    expect(h1()).toBe(CARREGANT);
    await avanca(1);
    expect(h1()).toBe(SENSE_RESPOSTA);
  });

  test('una fallada de la càrrega no és «Perfil no trobat»: sense reserva, l’avís; amb reserva, la fitxa del paquet', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    m.id = 'pepa-soler';
    m.load.mockRejectedValue(new Error('xarxa'));
    const { unmount } = render(<PerfilPublicSection />);
    await buida();
    expect(h1()).toBe(SENSE_RESPOSTA);
    unmount();
    m.id = '0001';
    render(<PerfilPublicSection />);
    await buida();
    expect(h1()).toBe('Javi Llinares');
  });

  test('el host que no arrenca: el senyal arriba a quanLlest, el termini l’avorta i un host tardà ja no enceta cap consulta', async () => {
    m.id = '0001';
    const host = diferit();
    m.quanLlest = vi.fn(() => host.promesa);
    render(<PerfilPublicSection />);
    await buida();
    expect(m.quanLlest).toHaveBeenCalledWith({ signal: expect.any(AbortSignal) });
    expect(m.load).not.toHaveBeenCalled();
    const [[{ signal }]] = m.quanLlest.mock.calls;
    await avanca(TERMINI_DEL_PERFIL_MS - 1);
    expect(signal.aborted).toBe(false);
    await avanca(1);
    expect(h1()).toBe('Javi Llinares');
    expect(signal.aborted).toBe(true);
    host.resol();
    await buida();
    expect(m.load).not.toHaveBeenCalled();
  });

  test('en canviar de clau i en desmuntar: la càrrega s’avorta, el termini es lleva i no hi ha cap pintat tardà', async () => {
    m.id = 'pepa-soler';
    m.load.mockImplementation(() => penjat());
    const { rerender, unmount } = render(<PerfilPublicSection />);
    await buida();
    await avanca(1500);
    const primer = m.load.mock.calls[0][1].signal;
    m.id = 'forn';
    rerender(<PerfilPublicSection />);
    await buida();
    expect(primer.aborted).toBe(true);
    expect(m.load).toHaveBeenCalledTimes(2);
    /* El termini de la primera clau (als 3 s) ja no hi és. */
    await avanca(1500);
    expect(h1()).toBe(CARREGANT);
    /* El de la segona, 3 s després del canvi. */
    await avanca(1500);
    expect(h1()).toBe(SENSE_RESPOSTA);
    const segon = m.load.mock.calls[1][1].signal;
    m.id = 'pepa-soler';
    rerender(<PerfilPublicSection />);
    await buida();
    expect(segon.aborted).toBe(true);
    const tercer = m.load.mock.calls[2][1].signal;
    unmount();
    expect(tercer.aborted).toBe(true);
    const pintats = m.renders.length;
    await avanca(TERMINI_DEL_PERFIL_MS * 2);
    expect(m.renders.length).toBe(pintats);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('T9-1 · un `agents` nou no torna a carregar la fitxa', () => {
  test.each(['remote', 'seed'])('mode %s amb la capacitat de directori: una sola consulta i cap «Carregant…» enmig', async (dataMode) => {
    m.config = { dataMode };
    m.id = 'pepa-soler';
    m.load.mockResolvedValue(PERSONA);
    const { rerender } = render(<PerfilPublicSection agents={[]} />);
    await buida();
    expect(h1()).toBe('Pepa Soler');
    const despresDeLaPrimera = m.renders.length;
    rerender(<PerfilPublicSection agents={[]} />);
    await buida();
    rerender(<PerfilPublicSection agents={[{ id: 'altre', name: 'Altre', type: 'PERSON' }]} />);
    await buida();
    expect(m.load).toHaveBeenCalledTimes(1);
    expect(titolsPintats().slice(despresDeLaPrimera)).not.toContain(CARREGANT);
    expect(h1()).toBe('Pepa Soler');
  });

  test('sense la capacitat (el catàleg), un catàleg nou es torna a llegir sense buidar la pantalla', async () => {
    m.config = { dataMode: 'seed' };
    m.capacitat = false;
    m.id = 'pep';
    const { rerender } = render(<PerfilPublicSection agents={[{ id: 'pep', name: 'Pep', type: 'PERSON' }]} />);
    await buida();
    expect(h1()).toBe('Pep');
    const despresDeLaPrimera = m.renders.length;
    rerender(<PerfilPublicSection agents={[{ id: 'pep', name: 'Pep del Forn', type: 'PERSON' }]} />);
    await buida();
    expect(h1()).toBe('Pep del Forn');
    expect(titolsPintats().slice(despresDeLaPrimera)).not.toContain(CARREGANT);
    expect(m.load).not.toHaveBeenCalled();
  });
});

describe('P4b-3 · «Escriu-li al xat» de la fitxa del paquet de Javi', () => {
  /* Onada R24.2 (R21.2-F01, decisió del Mestre del 14-11-2026) · El paquet
     declara l'UUID del compte de producció de Javi: en remot amb sessió, la
     fitxa del paquet ja en coneix el compte i el botó obri el directe real.
     Sense UUID declarat (el contracte d'abans), rutaDelXatDeJavi torna null i
     el botó no es pinta: ho cobrix XatSection.actorsPermanents (P1-70) i,
     per a la fitxa, l'última prova d'este bloc. */
  test('en remot amb sessió, amb l’UUID de Javi declarat: el botó obri el directe amb el seu compte real', async () => {
    m.id = 'javillinares';
    m.load.mockResolvedValue(null);
    render(<PerfilPublicSection />);
    await buida();
    expect(h1()).toBe('Javi Llinares');
    fireEvent.click(screen.getByRole('button', { name: 'Escriu-li al xat' }));
    expect(m.navigate).toHaveBeenCalledWith('/xat?amb=c7cc745b-2c54-4739-b9c1-add751aac3c4');
  });

  test('en remot sense sessió: el seu xat de només lectura, com la seua fila del Xat', async () => {
    m.id = 'javillinares';
    m.xat = { senseSessio: true };
    m.load.mockResolvedValue(null);
    render(<PerfilPublicSection />);
    await buida();
    fireEvent.click(screen.getByRole('button', { name: 'Escriu-li al xat' }));
    expect(m.navigate).toHaveBeenCalledWith('/xat/fake-javi');
  });

  test('en llavor: el directe del padró, com abans', async () => {
    m.config = { dataMode: 'seed' };
    m.id = '0001';
    m.load.mockResolvedValue(perfilDeLaPersonaPilot());
    render(<PerfilPublicSection />);
    await buida();
    fireEvent.click(screen.getByRole('button', { name: 'Escriu-li al xat' }));
    expect(m.navigate).toHaveBeenCalledWith('/xat?amb=0001');
  });

  test('la fitxa del servidor (un UUID) continua amb el directe de sempre', async () => {
    m.id = UUID_JAVI;
    m.load.mockResolvedValue({ ...PERSONA, id: UUID_JAVI, nom: 'Javi Llinares' });
    render(<PerfilPublicSection />);
    await buida();
    fireEvent.click(screen.getByRole('button', { name: 'Escriu-li al xat' }));
    expect(m.navigate).toHaveBeenCalledWith(`/xat?amb=${UUID_JAVI}`);
  });

  /* Onada R24.2 (revisió adversarial) · Amb l'UUID declarat, la fitxa de la
     persona pilot mirada per ella mateixa (la sessió és el seu compte: l'UUID
     declarat o el correu acreditat) portava «Escriu-li al xat» cap a
     /xat?amb=<el seu UUID>, el xat amb ella mateixa. Ara és «a mi mateix»:
     cap botó i, sense cap botó a la fila, cap fila d'accions (REV-PERF-7). */
  const UUID_JAVI_REAL = 'c7cc745b-2c54-4739-b9c1-add751aac3c4';
  const ambSessio = (currentUser, fitxa) => <SessionContext.Provider value={{ currentUser }}>{fitxa}</SessionContext.Provider>;
  test.each([
    ['l’UUID declarat', { id: UUID_JAVI_REAL }],
    ['el correu acreditat', { id: '5a5a5a5a-0000-4000-8000-0000000000aa', email: 'SocDePobleCom@gmail.com', email_confirmed_at: '2026-10-18T10:00:00Z' }]
  ])('R24.2 · en remot, la persona pilot amb sessió (%s) a /javillinares: cap «Escriu-li al xat» ni fila d’accions', async (_, usuari) => {
    m.id = 'javillinares';
    m.load.mockResolvedValue(null);
    render(ambSessio(usuari, <PerfilPublicSection />));
    await buida();
    expect(h1()).toBe('Javi Llinares');
    expect(screen.queryByRole('button', { name: 'Escriu-li al xat' })).toBeNull();
    expect(document.querySelector('.sdp-alerta__accions--centrades')).toBeNull();
    expect(m.navigate).not.toHaveBeenCalled();
  });

  test('R24.2 · en remot, la persona pilot amb sessió a la fitxa del servidor (/gent/<el seu UUID>): cap directe amb ella mateixa; «Edita la fitxa» es queda', async () => {
    m.id = UUID_JAVI_REAL;
    m.load.mockResolvedValue({ ...PERSONA, id: UUID_JAVI_REAL, nom: 'Javi Llinares', propietari: true });
    render(ambSessio({ id: UUID_JAVI_REAL }, <PerfilPublicSection />));
    await buida();
    expect(h1()).toBe('Javi Llinares');
    expect(screen.queryByRole('button', { name: 'Escriu-li al xat' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Edita la fitxa' }));
    expect(m.navigate.mock.calls).toEqual([['/el-meu-perfil']]);
  });

  test('R24.2 · en remot, un veí amb sessió a /javillinares conserva el directe amb el compte real de Javi', async () => {
    m.id = 'javillinares';
    m.load.mockResolvedValue(null);
    render(ambSessio({ id: PERSONA.id }, <PerfilPublicSection />));
    await buida();
    fireEvent.click(screen.getByRole('button', { name: 'Escriu-li al xat' }));
    expect(m.navigate).toHaveBeenCalledWith(`/xat?amb=${UUID_JAVI_REAL}`);
  });

  /* Revisió adversarial (Onada R24.2) · El contracte d'abans de declarar
     l'UUID, que continua valent per a un paquet sense cap UUID de Javi a
     IDS_REMOTS_FUNDACIONALS: en remot amb sessió, rutaDelXatDeJavi torna null,
     el botó no es pinta i la fila d'accions tampoc (REV-PERF-7). Mòduls nous
     (resetModules) amb el padró sense l'UUID (doMock); els vi.mock d'este
     fitxer continuen valent. Els tres ajudants exportats que prenen
     IDS_REMOTS_FUNDACIONALS per defecte el lligen dins del seu mòdul (el
     doMock no hi arriba): el doble els passa la llista buida. La sessió va
     pel SessionContext dels mòduls nous. */
  test('sense UUID de Javi declarat, en remot amb sessió el botó no es pinta (ni la fila d’accions)', async () => {
    vi.resetModules();
    vi.doMock('../../data/identitatsSeed.js', async (importOriginal) => {
      const original = await importOriginal();
      const idsRemots = Object.freeze({ ...original.IDS_REMOTS_FUNDACIONALS, [original.PERSONA_PILOT.slug]: Object.freeze([]) });
      return {
        ...original,
        IDS_REMOTS_FUNDACIONALS: idsRemots,
        esComptePersonaPilot: (objecte, opcions = {}) => original.esComptePersonaPilot(objecte, { idsRemots, ...opcions }),
        clauFundacional: (perfil, opcions = {}) => original.clauFundacional(perfil, { idsRemots, ...opcions }),
        fundacionalDeLaClau: (clau, opcions = {}) => original.fundacionalDeLaClau(clau, { idsRemots, ...opcions })
      };
    });
    try {
      const { default: PerfilSenseUuid } = await import('./PerfilPublicSection.jsx');
      const { SessionContext: SessioSenseUuid } = await import('../../app/contexts/objectesDeContext.js');
      const { rutaDelXatDeJavi } = await import('../xat/useObriXatPerDefecte.js');
      expect(rutaDelXatDeJavi('remote')).toBeNull();
      m.id = 'javillinares';
      m.load.mockResolvedValue(null);
      render(<SessioSenseUuid.Provider value={{ currentUser: { id: PERSONA.id } }}><PerfilSenseUuid /></SessioSenseUuid.Provider>);
      await buida();
      expect(h1()).toBe('Javi Llinares');
      expect(screen.queryByRole('button', { name: 'Escriu-li al xat' })).toBeNull();
      expect(document.querySelector('.sdp-alerta__accions--centrades')).toBeNull();
      expect(m.navigate).not.toHaveBeenCalled();
    } finally {
      vi.doUnmock('../../data/identitatsSeed.js');
      vi.resetModules();
    }
  });
});

describe('les claus noves de l’avís', () => {
  test.each([
    ['section.perfil.public.senseResposta', SENSE_RESPOSTA],
    ['section.perfil.public.senseRespostaText', SENSE_RESPOSTA_TEXT],
    /* REV-PERF-3 · El títol de la càrrega (també el del document) i el botó del directori. */
    ['section.perfil.public.carregant', CARREGANT],
    ['section.perfil.public.directori', 'Torna al directori']
  ])('%s: el valencià és la reserva i les altres quatre llengües tenen la seua', (clau, valencia) => {
    expect(createTranslator('ca')(clau)).toBe(valencia);
    for (const codi of ['es', 'en', 'eu', 'gl']) {
      const valor = createTranslator(codi)(clau);
      expect([codi, valor !== clau && valor !== valencia]).toEqual([codi, true]);
    }
  });
});
