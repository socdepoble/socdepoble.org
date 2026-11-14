/**
 * serveiXat.llinatgeR26.test.js — Microsondes permanents de les troballes
 * R25.2-X01 i R25.2-X02 de l'auditoria de Codex (261114_1737), contrastades
 * amb el contracte REAL de la sessió:
 *
 *   · `src/data/identitat.js`: `desaSessio` (entrada nova o renovació),
 *     `esborraSessio` (eixida), `entradaSessio()` (una renovació no la mou;
 *     eixir o tornar a entrar, inclús amb el mateix UUID, sí) i el blob de
 *     l'usuari desat, que és el que llig `runtime.js` (`actorDesat`) perquè
 *     amb el JWT caducat `usuariDeSessio()` ja torna null.
 *   · `src/data/supabase/runtime.js`: `getBackendConfigurat` torna un booleà,
 *     no un objecte amb l'abast; l'abast és `backendScope(config)` de la
 *     configuració amb què viatja el transport.
 *   · `src/data/supabase/xat.js` (`errorDeXat`): una fallada de JWT arriba al
 *     servei normalitzada (`code: 'SESSIO_CADUCADA'`, la resposta crua a
 *     `cause`), no amb `status: 401` al primer nivell.
 *
 * Cap prova toca la xarxa: el transport i la renovació són dobles, però la
 * identitat és el mòdul de veres.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

const USUARI = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const ALTRE_USUARI = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const FIL = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const FIL_2 = 'abababab-abab-4bab-8bab-abababababab';
const UUID_1 = '11111111-1111-4111-8111-111111111111';
const ORG = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const CONFIG_A = Object.freeze({ dataMode: 'remote', backendUrl: 'https://a.example.test', supabaseAnonKey: 'sb_publishable_prova_a' });
const CONFIG_B = Object.freeze({ dataMode: 'remote', backendUrl: 'https://b.example.test', supabaseAnonKey: 'sb_publishable_prova_b' });

const b64 = (valor) => btoa(JSON.stringify(valor)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const jwtAmbExp = (expSegons) => `${b64({ alg: 'none' })}.${b64({ sub: USUARI, exp: expSegons })}.c2ln`;
const sessio = (token, id = USUARI) => ({ access_token: token, refresh_token: 'rt-sintetic', user: { id } });

/* La forma exacta que torna `errorDeXat` de supabase/xat.js davant un «JWT expired» de PostgREST. */
const errorJwtDelPort = () => Object.assign(
  new Error('La sessió ha caducat. Si us plau, torna a iniciar sessió.'),
  { code: 'SESSIO_CADUCADA', retriable: false, cause: { message: 'JWT expired', code: 'PGRST301', status: 401 } },
);
/* La de supabase/xat.js quan el JWT ja ha caducat al rellotge i usuariDeSessio() torna null. */
const errorSenseJwtDelPort = () => Object.assign(new Error('Cal iniciar sessió per a escriure al xat.'), { code: 'SESSIO', retriable: false });

async function carrega() {
  vi.resetModules();
  const identitat = await import('../../identitat.js');
  const servei = await import('../serveiXat.js');
  return { identitat, ...servei };
}

function entra(identitat, config = CONFIG_A, token = 'tok-entrada', id = USUARI) {
  identitat.configuraBackendSessio(config);
  expect(identitat.desaSessio(sessio(token, id))).toBe(true);
}

function confirmacio(payload, seq = 42) {
  return { id: payload.id, seq, text: payload.text };
}

afterEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  vi.resetModules();
});

describe('R25.2-X01 · llinatge real (backend, tenant, usuari, actor i generació de login)', () => {
  it('contracte real: getBackendConfigurat és booleà i l\'abast del llinatge és el de la config del transport', async () => {
    /* El contracte booleà de getBackendConfigurat es prova al costat del mòdul
       (src/data/supabase/runtime.backendConfigurat.contracte.test.js): Porta Enxufe E1. */
    const { identitat, creaServeiXat } = await carrega();
    entra(identitat, CONFIG_A);

    const enviaMissatge = vi.fn(async (_fil, payload) => confirmacio(payload));
    const servei = creaServeiXat({ enviaMissatge, refreshSession: vi.fn(async () => false), escoltaCanvisSessio: null });

    // Amb la config del backend de la sessió, s'envia.
    await expect(servei.enviaMissatge(FIL, { client_msg_id: UUID_1, text: 'Hola' }, { ...CONFIG_A })).resolves
      .toMatchObject({ id: UUID_1, seq: 42 });
    expect(enviaMissatge).toHaveBeenCalledTimes(1);

    // Amb la config d'un altre backend (sense sessió seua), res no ix: abans hi queia
    // per a tots dos la mateixa sentinella i el transport viatjava igualment.
    await expect(servei.enviaMissatge(FIL, { text: 'Cap a un altre backend' }, { ...CONFIG_B })).rejects
      .toMatchObject({ codi: 'SESSIO_CADUCADA', retriable: false });
    expect(enviaMissatge).toHaveBeenCalledTimes(1);
  });

  it('una renovació vàlida (desaSessio amb renovacio) conserva el llinatge: un sol refresc amb la config i un sol reintent', async () => {
    const { identitat, creaServeiXat } = await carrega();
    entra(identitat, CONFIG_A);
    const generacioAbans = identitat.entradaSessio();

    const enviaMissatge = vi.fn(async (_fil, payload) => {
      if (enviaMissatge.mock.calls.length === 1) throw errorJwtDelPort();
      return confirmacio(payload, 7);
    });
    const refreshSession = vi.fn(async () => identitat.desaSessio(sessio('tok-renovat'), { renovacio: true }));
    const servei = creaServeiXat({ enviaMissatge, refreshSession, escoltaCanvisSessio: null });

    const resposta = await servei.enviaMissatge(FIL, { client_msg_id: UUID_1, text: 'Bon dia' }, { ...CONFIG_A });

    expect(identitat.entradaSessio()).toBe(generacioAbans);
    expect(resposta).toMatchObject({ id: UUID_1, client_msg_id: UUID_1, seq: 7 });
    expect(refreshSession).toHaveBeenCalledTimes(1);
    // La renovació rep la config del backend del transport (auth.refreshSession comprova esBackendDeSessio(config)).
    expect(refreshSession.mock.calls[0][0]).toMatchObject({ backendUrl: CONFIG_A.backendUrl });
    expect(refreshSession.mock.calls[0][0]).not.toHaveProperty('signal');
    expect(enviaMissatge).toHaveBeenCalledTimes(2);
    expect(enviaMissatge.mock.calls[1][1]).toBe(enviaMissatge.mock.calls[0][1]);
  });

  it('JWT caducat al rellotge: el blob desat manté l\'usuari, es renova i es reintenta (com actorDesat de runtime.js)', async () => {
    const { identitat, creaServeiXat } = await carrega();
    entra(identitat, CONFIG_A, jwtAmbExp(Math.floor(Date.now() / 1000) - 60));
    expect(identitat.usuariDeSessio()).toBeNull();

    const enviaMissatge = vi.fn(async (_fil, payload) => {
      if (enviaMissatge.mock.calls.length === 1) throw errorSenseJwtDelPort();
      return confirmacio(payload, 3);
    });
    const refreshSession = vi.fn(async () => identitat.desaSessio(sessio('tok-renovat'), { renovacio: true }));
    const servei = creaServeiXat({ enviaMissatge, refreshSession, escoltaCanvisSessio: null });

    await expect(servei.enviaMissatge(FIL, { text: 'Des del bancal' }, { ...CONFIG_A })).resolves.toMatchObject({ seq: 3 });
    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(enviaMissatge).toHaveBeenCalledTimes(2);
  });

  it('logout → login del MATEIX UUID durant el refresc trenca el llinatge: cap reintent', async () => {
    const { identitat, creaServeiXat } = await carrega();
    entra(identitat, CONFIG_A);

    const enviaMissatge = vi.fn(async () => { throw errorJwtDelPort(); });
    const refreshSession = vi.fn(async () => {
      identitat.esborraSessio();
      expect(identitat.desaSessio(sessio('tok-entrada-nova'))).toBe(true);
      return true;
    });
    const servei = creaServeiXat({ enviaMissatge, refreshSession, escoltaCanvisSessio: null });

    await expect(servei.enviaMissatge(FIL, { text: 'De la sessió vella' }, { ...CONFIG_A })).rejects
      .toMatchObject({ codi: 'SESSIO_CANVIADA', retriable: false });
    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(enviaMissatge).toHaveBeenCalledTimes(1);
  });

  it('les opcions de la crida no poden congelar el llinatge (usuariId/generacioLogin/backendScope es rebutgen abans del transport)', async () => {
    const { identitat, creaServeiXat } = await carrega();
    entra(identitat, CONFIG_A);
    const enviaMissatge = vi.fn(async (_fil, payload) => confirmacio(payload));
    const servei = creaServeiXat({ enviaMissatge, refreshSession: vi.fn(async () => true), escoltaCanvisSessio: null });

    for (const clau of ['usuariId', 'generacioLogin', 'backendScope']) {
      await expect(servei.enviaMissatge(FIL, { text: `Amb ${clau}` }, { ...CONFIG_A, [clau]: clau === 'usuariId' ? USUARI : 7 }))
        .rejects.toMatchObject({ codi: 'ENTRADA_INVALIDA', retriable: false });
    }
    expect(enviaMissatge).not.toHaveBeenCalled();
  });

  it('logout → login del mateix UUID amb generacioLogin fixada a les opcions ja no passa per continuïtat', async () => {
    const { identitat, creaServeiXat } = await carrega();
    entra(identitat, CONFIG_A);
    const generacio = identitat.entradaSessio();
    const enviaMissatge = vi.fn(async () => { throw errorJwtDelPort(); });
    const refreshSession = vi.fn(async () => {
      identitat.esborraSessio();
      identitat.desaSessio(sessio('tok-entrada-nova'));
      return true;
    });
    const servei = creaServeiXat({ enviaMissatge, refreshSession, escoltaCanvisSessio: null });

    // Microsonda de Codex: amb la generació i l'usuari fixats a les opcions, la comprovació viva
    // comparava la foto amb ella mateixa i el reintent eixia amb la sessió nova.
    await expect(servei.enviaMissatge(FIL, { text: 'Fixa la generació' }, { ...CONFIG_A, generacioLogin: generacio, usuariId: USUARI }))
      .rejects.toMatchObject({ codi: 'ENTRADA_INVALIDA', retriable: false });
    expect(enviaMissatge).not.toHaveBeenCalled();
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it('actor: comOrgId a les opcions sense font viva es rebutja; amb font viva, un canvi d\'actor durant el refresc avorta', async () => {
    const { identitat, creaServeiXat } = await carrega();
    entra(identitat, CONFIG_A);

    const enviaSenseFont = vi.fn(async (_fil, payload) => confirmacio(payload));
    const serveiSenseFont = creaServeiXat({ enviaMissatge: enviaSenseFont, refreshSession: vi.fn(), escoltaCanvisSessio: null });
    await expect(serveiSenseFont.enviaMissatge(FIL, { text: 'Com a botiga' }, { ...CONFIG_A, comOrgId: ORG }))
      .rejects.toMatchObject({ codi: 'ACTOR_SENSE_FONT_VIVA', retriable: false });
    expect(enviaSenseFont).not.toHaveBeenCalled();

    let actorViu = ORG;
    const enviaMissatge = vi.fn(async () => { throw errorJwtDelPort(); });
    const refreshSession = vi.fn(async () => {
      actorViu = null; // la barra negra torna a la persona mentre es renova
      return identitat.desaSessio(sessio('tok-renovat'), { renovacio: true });
    });
    const servei = creaServeiXat({ enviaMissatge, refreshSession, obteActorOrgId: () => actorViu, escoltaCanvisSessio: null });

    await expect(servei.enviaMissatge(FIL, { text: 'Oferta del forn' }, { ...CONFIG_A, comOrgId: ORG }))
      .rejects.toMatchObject({ codi: 'SESSIO_CANVIADA' });
    expect(enviaMissatge).toHaveBeenCalledTimes(1);
    // Les claus pròpies del servei no viatgen dins de la config del transport.
    expect(enviaMissatge.mock.calls[0][2]).not.toHaveProperty('comOrgId');
    expect(enviaMissatge.mock.calls[0][2]).not.toHaveProperty('obteActorOrgId');
  });

  it('canvi de persona durant el primer transport: la resposta no s\'entrega a la sessió nova', async () => {
    const { identitat, creaServeiXat } = await carrega();
    entra(identitat, CONFIG_A);
    const enviaMissatge = vi.fn(async (_fil, payload) => {
      identitat.esborraSessio();
      identitat.desaSessio(sessio('tok-altre', ALTRE_USUARI));
      return confirmacio(payload);
    });
    const servei = creaServeiXat({ enviaMissatge, refreshSession: vi.fn(), escoltaCanvisSessio: null });

    await expect(servei.enviaMissatge(FIL, { text: 'Resposta tardana' }, { ...CONFIG_A })).rejects
      .toMatchObject({ codi: 'SESSIO_CANVIADA' });
  });

  it('el mateix client_msg_id en un altre fil es rebutja abans de la xarxa (p_id global: SDP-XAT-008 al servidor)', async () => {
    const { identitat, creaServeiXat } = await carrega();
    entra(identitat, CONFIG_A);
    const enviaMissatge = vi.fn(async (_fil, payload) => confirmacio(payload));
    const servei = creaServeiXat({ enviaMissatge, refreshSession: vi.fn(), escoltaCanvisSessio: null });

    await servei.enviaMissatge(FIL, { client_msg_id: UUID_1, text: 'Al fil 1' }, { ...CONFIG_A });
    await expect(servei.enviaMissatge(FIL_2, { client_msg_id: UUID_1, text: 'Al fil 1' }, { ...CONFIG_A }))
      .rejects.toMatchObject({ codi: 'COLISIO_PAYLOAD_IDEMPOTENT' });
    expect(enviaMissatge).toHaveBeenCalledTimes(1);
  });

  it('classifica com a renovable la forma real del port i continua excloent 403 / RLS dins de cause', async () => {
    const { esErrorJwtCaducat } = await carrega();
    expect(esErrorJwtCaducat(errorJwtDelPort())).toBe(true);
    expect(esErrorJwtCaducat(errorSenseJwtDelPort())).toBe(true);
    expect(esErrorJwtCaducat(Object.assign(new Error('x'), { code: 'XAT', cause: { status: 401 } }))).toBe(true);
    expect(esErrorJwtCaducat(Object.assign(new Error('x'), { code: 'SENSE_PERMIS', cause: { status: 401 } }))).toBe(false);
    expect(esErrorJwtCaducat(Object.assign(new Error('x'), { code: 'XAT', cause: { status: 403, message: 'JWT expired' } }))).toBe(false);
    expect(esErrorJwtCaducat(Object.assign(new Error('x'), { code: 'XAT', cause: { code: '42501' } }))).toBe(false);
    expect(esErrorJwtCaducat(Object.assign(new Error('Operació cancel·lada'), { name: 'AbortError', code: 'AbortError' }))).toBe(false);
    expect(esErrorJwtCaducat(Object.assign(new Error('Temps'), { name: 'TimeoutError', code: 'TimeoutError' }))).toBe(false);
  });
});

describe('R25.2-X02 · AbortSignal viu per intent i cancel·lació definitiva', () => {
  function operacio() {
    let passa;
    const relleu = new Promise((resol) => { passa = resol; });
    return { controller: new AbortController(), relleu, passa };
  }

  it('el reintent rep el senyal VIU del relleu (no el de l\'operació que la renovació ha avortat) i eixe senyal el cancel·la', async () => {
    const { identitat, creaServeiXat } = await carrega();
    entra(identitat, CONFIG_A);
    const op1 = operacio();
    let op2 = null;
    let opViva = op1;
    let resolReintent;

    const senyalsRebuts = [];
    const enviaMissatge = vi.fn((_fil, payload, config) => {
      senyalsRebuts.push(config.signal);
      if (senyalsRebuts.length === 1) return Promise.reject(errorJwtDelPort());
      return new Promise((resol, rebutja) => {
        resolReintent = () => resol(confirmacio(payload));
        config.signal.addEventListener('abort', () => rebutja(new DOMException('Operació cancel·lada', 'AbortError')), { once: true });
      });
    });
    const refreshSession = vi.fn(async () => {
      // XatContext rota l'operació en renovar-se el JWT: la vella s'avorta i el relleu passa a la nova.
      op2 = operacio();
      op1.controller.abort();
      op1.passa(op2);
      opViva = op2;
      return identitat.desaSessio(sessio('tok-renovat'), { renovacio: true });
    });
    const servei = creaServeiXat({ enviaMissatge, refreshSession, escoltaCanvisSessio: null });

    const enviament = servei.enviaMissatge(FIL, { text: 'Amb relleu' }, {
      ...CONFIG_A,
      obteSenyalIntent: () => (opViva.controller.signal.aborted ? null : opViva.controller.signal),
    });

    await vi.waitFor(() => expect(senyalsRebuts).toHaveLength(2));
    expect(op1.controller.signal.aborted).toBe(true); // la renovació ha avortat l'operació vella
    expect(senyalsRebuts[1]).not.toBe(senyalsRebuts[0]);
    expect(senyalsRebuts[1]).not.toBe(op1.controller.signal);
    expect(senyalsRebuts[1].aborted).toBe(false); // el de l'intent 2 és nou i penja d'op2

    // El senyal viu d'op2 governa el reintent: si op2 s'avorta (canvi d'actor, desmuntatge), el reintent cau.
    op2.controller.abort();
    await expect(enviament).rejects.toMatchObject({ codi: 'OPERACIO_CANCELADA', retriable: false });
    expect(senyalsRebuts[1].aborted).toBe(true);
    expect(resolReintent).toBeTypeOf('function');
  }, 4000);

  it('un relleu nul (canvi d\'àmbit o desmuntatge) cancel·la definitivament: cap reintent', async () => {
    const { identitat, creaServeiXat } = await carrega();
    entra(identitat, CONFIG_A);
    let viu = new AbortController();
    const enviaMissatge = vi.fn(async () => { throw errorJwtDelPort(); });
    const refreshSession = vi.fn(async () => {
      viu.abort();
      viu = null;
      return identitat.desaSessio(sessio('tok-renovat'), { renovacio: true });
    });
    const servei = creaServeiXat({ enviaMissatge, refreshSession, escoltaCanvisSessio: null });

    await expect(servei.enviaMissatge(FIL, { text: 'Sense relleu' }, { ...CONFIG_A, obteSenyalIntent: () => viu?.signal ?? null }))
      .rejects.toMatchObject({ codi: 'OPERACIO_CANCELADA', definitiu: true, retriable: false });
    expect(enviaMissatge).toHaveBeenCalledTimes(1);
  });

  it('el senyal avortat no es recicla: si el relleu torna un senyal ja avortat, no hi ha transport', async () => {
    const { identitat, creaServeiXat } = await carrega();
    entra(identitat, CONFIG_A);
    const mort = new AbortController();
    mort.abort();
    const enviaMissatge = vi.fn(async (_fil, payload) => confirmacio(payload));
    const servei = creaServeiXat({ enviaMissatge, refreshSession: vi.fn(), escoltaCanvisSessio: null });

    await expect(servei.enviaMissatge(FIL, { text: 'Senyal mort' }, { ...CONFIG_A, obteSenyalIntent: () => mort.signal }))
      .rejects.toMatchObject({ codi: 'OPERACIO_CANCELADA', definitiu: true });
    expect(enviaMissatge).not.toHaveBeenCalled();
  });

  it('logout amb l\'avís sdp:auth-change avorta el transport en vol i no espera la resposta', async () => {
    const { identitat, creaServeiXat } = await carrega();
    entra(identitat, CONFIG_A);
    let senyalTransport = null;
    const enviaMissatge = vi.fn((_fil, _payload, config) => {
      senyalTransport = config.signal;
      return new Promise(() => {}); // el transport no respon mai i ignora l'abort
    });
    const servei = creaServeiXat({ enviaMissatge, refreshSession: vi.fn() });

    const enviament = servei.enviaMissatge(FIL, { text: 'En vol' }, { ...CONFIG_A });
    expect(senyalTransport?.aborted).toBe(false);

    identitat.esborraSessio();
    window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: null } }));

    await expect(enviament).rejects.toMatchObject({ codi: 'SESSIO_CANVIADA', retriable: false });
    expect(senyalTransport.aborted).toBe(true);
  }, 4000);

  it('una renovació (mateixa persona i entrada) avisada amb sdp:auth-change NO avorta el transport en vol', async () => {
    const { identitat, creaServeiXat } = await carrega();
    entra(identitat, CONFIG_A);
    let resol;
    let senyalTransport = null;
    const enviaMissatge = vi.fn((_fil, payload, config) => {
      senyalTransport = config.signal;
      return new Promise((r) => { resol = () => r(confirmacio(payload, 5)); });
    });
    const servei = creaServeiXat({ enviaMissatge, refreshSession: vi.fn() });

    const enviament = servei.enviaMissatge(FIL, { text: 'Renovació pel camí' }, { ...CONFIG_A });
    identitat.desaSessio(sessio('tok-renovat'), { renovacio: true });
    window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: { id: USUARI } } }));
    expect(senyalTransport.aborted).toBe(false);
    resol();
    await expect(enviament).resolves.toMatchObject({ seq: 5 });
  }, 4000);

  it('tanca() (desmuntatge) cancel·la definitivament el que espera el refresc i rebutja els enviaments nous', async () => {
    const { identitat, creaServeiXat } = await carrega();
    entra(identitat, CONFIG_A);
    const enviaMissatge = vi.fn(async () => { throw errorJwtDelPort(); });
    const refreshSession = vi.fn(() => new Promise(() => {})); // el refresc penja
    const servei = creaServeiXat({ enviaMissatge, refreshSession, escoltaCanvisSessio: null });

    const enviament = servei.enviaMissatge(FIL, { text: 'Abans de desmuntar' }, { ...CONFIG_A });
    await vi.waitFor(() => expect(refreshSession).toHaveBeenCalledTimes(1));

    servei.tanca('desmuntatge');
    await expect(enviament).rejects.toMatchObject({ codi: 'SERVEI_TANCAT', definitiu: true, retriable: false });
    await expect(servei.enviaMissatge(FIL, { text: 'Després' }, { ...CONFIG_A })).rejects
      .toMatchObject({ codi: 'SERVEI_TANCAT' });
    expect(enviaMissatge).toHaveBeenCalledTimes(1);
  }, 4000);

  it('cancelaTot() talla el transport en vol amb un senyal propi, i l\'operació següent naix amb un senyal nou', async () => {
    const { identitat, creaServeiXat } = await carrega();
    entra(identitat, CONFIG_A);
    const senyals = [];
    const enviaMissatge = vi.fn((_fil, payload, config) => {
      senyals.push(config.signal);
      if (senyals.length === 1) return new Promise(() => {});
      return Promise.resolve(confirmacio(payload, 9));
    });
    const servei = creaServeiXat({ enviaMissatge, refreshSession: vi.fn(), escoltaCanvisSessio: null });

    const primer = servei.enviaMissatge(FIL, { text: 'Primer' }, { ...CONFIG_A });
    servei.cancelaTot('canvi-actor');
    await expect(primer).rejects.toMatchObject({ codi: 'OPERACIO_CANCELADA', definitiu: true });
    expect(senyals[0].aborted).toBe(true);

    await expect(servei.enviaMissatge(FIL, { text: 'Segon' }, { ...CONFIG_A })).resolves.toMatchObject({ seq: 9 });
    expect(senyals[1]).not.toBe(senyals[0]);
    expect(senyals[1].aborted).toBe(false);
  }, 4000);
});

/* ── Rondes 2 i 3 del Gauntlet R26 · El senyal del relleu i la rotació de la UI ──
   XatContext rota la seua operació a CADA renovació del JWT (scopeKey porta
   `generacio`): avorta la vella i, en el mateix commit, la rellevada passa a
   la nova (o a null si l'àmbit canvia o el proveïdor es desmunta). Les
   microsondes S1a/S1b del verificador independent mostraven que qualsevol
   avortament del senyal del relleu era definitiu: la renovació mateixa matava
   el reintent. La ronda 2 ho va corregir reenviant; la ronda 3 (microsondes V1
   i V2) ho fa SEGUINT el relleu sense tallar el transport, i només amb una font
   viva de l'actor. `cadenaOperacions` modela eixa cadena de relleus. */
function cadenaOperacions() {
  const nova = () => {
    let passa = null;
    const relleu = new Promise((resol) => { passa = resol; });
    return { controller: new AbortController(), relleu, passa };
  };
  let actual = nova();
  return {
    get actual() { return actual; },
    /* L'ordre de XatContext: la neteja avorta la vella, l'efecte crea la nova i li passa el relleu. */
    renova() {
      const vella = actual;
      vella.controller.abort();
      actual = nova();
      vella.passa(actual);
    },
    canviaAmbit() {
      const vella = actual;
      vella.controller.abort();
      actual = nova();
      vella.passa(null);
    },
  };
}

/* La recepta de cablejat: el senyal de l'operació VIVA del mateix àmbit. No espera
   cap rotació futura; només segueix el relleu si la que té ja està avortada. */
function relleuDeLaCrida(cadena) {
  let viu = cadena.actual;
  return async () => {
    while (viu?.controller.signal.aborted) viu = await viu.relleu;
    return viu?.controller.signal ?? null;
  };
}

/* Un transport que respecta l'abort i, si cal, fa alguna cosa un tic després d'eixir. */
function transportPenjat(config, desprès = null) {
  return new Promise((_resol, rebutja) => {
    config.signal.addEventListener('abort', () => rebutja(new DOMException('Operació cancel·lada', 'AbortError')), { once: true });
    if (desprès) setTimeout(desprès, 0);
  });
}

/* Un transport que respecta l'abort, fa `abans` un tic després d'eixir i respon `valor` després. */
function transportQueRespon(config, valor, abans = null, retardMs = 5) {
  return new Promise((resol, rebutja) => {
    config.signal.addEventListener('abort', () => rebutja(new DOMException('Operació cancel·lada', 'AbortError')), { once: true });
    if (abans) setTimeout(abans, 0);
    setTimeout(() => resol(valor), retardMs);
  });
}

/* Model de `xat_envia_xifrat` (2610311800_e2ee_fases_1b_1c_rpcs_i_adjunts.sql): el
   mateix p_id amb un altre sobre és SDP-XAT-008; amb el mateix, la fila desada.
   `transport` fa com el decorador (xifratXat.js · motor.prepara): torna a xifrar a
   cada crida (nf i iv nous). El servidor desa en arribar i la resposta torna tard. */
function servidorXifrat() {
  const files = new Map();
  let seq = 0;
  const desa = (payload) => {
    const xifrat = { ct: globalThis.crypto.randomUUID() };
    const existent = files.get(payload.id);
    if (existent) {
      if (existent.xifrat.ct !== xifrat.ct) {
        throw Object.assign(new Error('SDP-XAT-008: identificador d’un altre enviament.'), { code: 'SDP-XAT-008' });
      }
      return existent;
    }
    const fila = Object.freeze({ id: payload.id, seq: ++seq, text: null, xifrat });
    files.set(payload.id, fila);
    return fila;
  };
  return {
    files,
    transport(config, payload, abans = null) {
      let fila;
      try {
        fila = desa(payload);
      } catch (err) {
        return Promise.reject(err);
      }
      return transportQueRespon(config, fila, abans);
    },
  };
}

describe('R26 rondes 2 i 3 · el senyal del relleu: amb font viva de l\'actor, una rotació de la UI se segueix sense reenviar', () => {
  it('S1a · relleu ingenu i rotació DESPRÉS que el reintent ha eixit: se segueix el relleu, el reintent no es talla i no es reenvia', async () => {
    const { identitat, creaServeiXat } = await carrega();
    entra(identitat, CONFIG_A);
    const cadena = cadenaOperacions();
    const senyals = [];
    const enviaMissatge = vi.fn((_fil, payload, config) => {
      senyals.push(config.signal);
      if (senyals.length === 1) return Promise.reject(errorJwtDelPort());
      // El reintent ja ha eixit; la UI rota l'operació un tic després (sessionService puja generacio).
      return transportQueRespon(config, confirmacio(payload, 21), () => cadena.renova());
    });
    const refreshSession = vi.fn(async () => identitat.desaSessio(sessio('tok-renovat'), { renovacio: true }));
    const servei = creaServeiXat({ enviaMissatge, refreshSession, obteActorOrgId: () => null, escoltaCanvisSessio: null });
    const relleu = vi.fn(() => cadena.actual.controller.signal); // ingenu: l'operació viva ara mateix

    const resposta = await servei.enviaMissatge(FIL, { client_msg_id: UUID_1, text: 'Rotació tardana' }, {
      ...CONFIG_A,
      obteSenyalIntent: relleu,
    });

    expect(resposta).toMatchObject({ id: UUID_1, client_msg_id: UUID_1, seq: 21 });
    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(enviaMissatge).toHaveBeenCalledTimes(2); // l'enviament i el reintent del 401: cap reenviament pel salt
    expect(enviaMissatge.mock.calls[1][1]).toBe(enviaMissatge.mock.calls[0][1]);
    expect(senyals[1].aborted).toBe(false); // la rotació no talla el transport en vol
    expect(relleu.mock.calls.map(([arg]) => arg)).toEqual([{ intent: 0, salt: 0 }, { intent: 1, salt: 0 }, { intent: 1, salt: 1 }]);
    expect(servei.comptaEnVol()).toBe(0);
  }, 4000);

  it('S1b · una renovació aliena durant l\'intent 0 (mateix llinatge) no cancel·la: se segueix el relleu i s\'entrega la resposta del mateix transport', async () => {
    const { identitat, creaServeiXat } = await carrega();
    entra(identitat, CONFIG_A);
    const cadena = cadenaOperacions();
    const enviaMissatge = vi.fn((_fil, payload, config) => transportQueRespon(config, confirmacio(payload, 8), () => {
      // Una altra part de l'app ha renovat el JWT: la mateixa persona i la mateixa entrada.
      identitat.desaSessio(sessio('tok-alie'), { renovacio: true });
      cadena.renova();
    }));
    const refreshSession = vi.fn();
    const servei = creaServeiXat({ enviaMissatge, refreshSession, obteActorOrgId: () => null, escoltaCanvisSessio: null });

    await expect(servei.enviaMissatge(FIL, { client_msg_id: UUID_1, text: 'Renovació aliena' }, {
      ...CONFIG_A, obteSenyalIntent: relleuDeLaCrida(cadena),
    })).resolves.toMatchObject({ id: UUID_1, seq: 8 });
    expect(refreshSession).not.toHaveBeenCalled();
    expect(enviaMissatge).toHaveBeenCalledTimes(1);
    expect(enviaMissatge.mock.calls[0][2].signal.aborted).toBe(false);
  }, 4000);

  it('V2 · fil E2EE (transport que torna a xifrar): la rotació no reenvia amb un sobre nou; s\'entrega la fila que el servidor ja ha desat', async () => {
    const { identitat, creaServeiXat } = await carrega();
    entra(identitat, CONFIG_A);
    const cadena = cadenaOperacions();
    const servidor = servidorXifrat();
    const enviaMissatge = vi.fn((_fil, payload, config) => servidor.transport(config, payload, () => {
      identitat.desaSessio(sessio('tok-alie'), { renovacio: true });
      cadena.renova();
    }));
    const servei = creaServeiXat({ enviaMissatge, refreshSession: vi.fn(), obteActorOrgId: () => null, escoltaCanvisSessio: null });

    const resposta = await servei.enviaMissatge(FIL, { client_msg_id: UUID_1, text: 'Xifrat' }, {
      ...CONFIG_A, obteSenyalIntent: relleuDeLaCrida(cadena),
    });
    expect(resposta).toMatchObject({ id: UUID_1, seq: 1 });
    expect(enviaMissatge).toHaveBeenCalledTimes(1); // cap sobre nou per al mateix p_id: cap SDP-XAT-008
    expect(servidor.files.size).toBe(1);
  }, 4000);

  it('V2 · sense font viva de l\'actor, el mateix fil E2EE acaba en OPERACIO_CANCELADA (com a la ronda 1), mai en SDP-XAT-008', async () => {
    const { identitat, creaServeiXat } = await carrega();
    entra(identitat, CONFIG_A);
    const cadena = cadenaOperacions();
    const servidor = servidorXifrat();
    const enviaMissatge = vi.fn((_fil, payload, config) => servidor.transport(config, payload, () => {
      identitat.desaSessio(sessio('tok-alie'), { renovacio: true });
      cadena.renova();
    }));
    const servei = creaServeiXat({ enviaMissatge, refreshSession: vi.fn(), escoltaCanvisSessio: null });

    await expect(servei.enviaMissatge(FIL, { client_msg_id: UUID_1, text: 'Xifrat' }, {
      ...CONFIG_A, obteSenyalIntent: relleuDeLaCrida(cadena),
    })).rejects.toMatchObject({ codi: 'OPERACIO_CANCELADA', motiu: 'SENYAL_INTENT_AVORTAT', definitiu: true, retriable: false });
    expect(enviaMissatge).toHaveBeenCalledTimes(1);
  }, 4000);

  it('els salts del relleu tenen sostre: tres rotacions amb el transport en vol acaben en OPERACIO_CANCELADA definitiva', async () => {
    const { identitat, creaServeiXat } = await carrega();
    entra(identitat, CONFIG_A);
    const cadena = cadenaOperacions();
    const enviaMissatge = vi.fn((_fil, _payload, config) => transportPenjat(config, () => {
      cadena.renova();
      setTimeout(() => {
        cadena.renova();
        setTimeout(() => cadena.renova(), 0);
      }, 0);
    }));
    const servei = creaServeiXat({ enviaMissatge, refreshSession: vi.fn(), obteActorOrgId: () => null, escoltaCanvisSessio: null });

    await expect(servei.enviaMissatge(FIL, { text: 'Rotacions sense fi' }, { ...CONFIG_A, obteSenyalIntent: relleuDeLaCrida(cadena) }))
      .rejects.toMatchObject({ codi: 'OPERACIO_CANCELADA', motiu: 'SALTS_RELLEU_ESGOTATS', definitiu: true, retriable: false });
    expect(enviaMissatge).toHaveBeenCalledTimes(1); // se seguixen dos salts; cap reenviament
    expect(enviaMissatge.mock.calls[0][2].signal.aborted).toBe(true); // la decisió definitiva talla el transport
  }, 4000);

  it('`salt` és local de l\'intent: la primera crida de l\'intent 1 és salt 0 encara que l\'intent 0 haja seguit el relleu', async () => {
    const { identitat, creaServeiXat } = await carrega();
    entra(identitat, CONFIG_A);
    const cadena = cadenaOperacions();
    const enviaMissatge = vi.fn((_fil, payload) => {
      if (enviaMissatge.mock.calls.length === 1) {
        return new Promise((_resol, rebutja) => {
          setTimeout(() => cadena.renova(), 0); // una renovació aliena durant l'intent 0…
          setTimeout(() => rebutja(errorJwtDelPort()), 5); // …i el mateix transport torna 401
        });
      }
      return Promise.resolve(confirmacio(payload, 30));
    });
    const refreshSession = vi.fn(async () => identitat.desaSessio(sessio('tok-renovat'), { renovacio: true }));
    const servei = creaServeiXat({ enviaMissatge, refreshSession, obteActorOrgId: () => null, escoltaCanvisSessio: null });
    const relleu = vi.fn(() => cadena.actual.controller.signal);

    await expect(servei.enviaMissatge(FIL, { text: 'Salt per intent' }, { ...CONFIG_A, obteSenyalIntent: relleu }))
      .resolves.toMatchObject({ seq: 30 });
    expect(relleu.mock.calls.map(([arg]) => arg)).toEqual([{ intent: 0, salt: 0 }, { intent: 0, salt: 1 }, { intent: 1, salt: 0 }]);
    expect(enviaMissatge).toHaveBeenCalledTimes(2);
  }, 4000);

  it('la resposta no s\'entrega mentre el relleu decidix: si torna null després d\'arribar l\'ACK, és RELLEU_NUL i no es resol', async () => {
    const { identitat, creaServeiXat } = await carrega();
    entra(identitat, CONFIG_A);
    const viu = new AbortController();
    const enviaMissatge = vi.fn((_fil, payload, config) => transportQueRespon(config, confirmacio(payload, 11), () => viu.abort(), 2));
    const servei = creaServeiXat({ enviaMissatge, refreshSession: vi.fn(), obteActorOrgId: () => null, escoltaCanvisSessio: null });
    let crides = 0;
    const relleu = () => {
      crides += 1;
      if (crides === 1) return viu.signal;
      return new Promise((resol) => { setTimeout(() => resol(null), 15); }); // decidix després de l'ACK
    };

    await expect(servei.enviaMissatge(FIL, { text: 'Decisió tardana' }, { ...CONFIG_A, obteSenyalIntent: relleu }))
      .rejects.toMatchObject({ codi: 'OPERACIO_CANCELADA', motiu: 'RELLEU_NUL', definitiu: true });
    expect(enviaMissatge).toHaveBeenCalledTimes(1);
  }, 4000);

  it('una rotació entre la resposta del relleu i el transport es decidix ABANS d\'enviar: un sol transport, amb el senyal ja seguit', async () => {
    const { identitat, creaServeiXat } = await carrega();
    entra(identitat, CONFIG_A);
    const cadena = cadenaOperacions();
    const enviaMissatge = vi.fn((_fil, payload) => Promise.resolve(confirmacio(payload, 17)));
    const servei = creaServeiXat({ enviaMissatge, refreshSession: vi.fn(), obteActorOrgId: () => null, escoltaCanvisSessio: null });
    const relleu = vi.fn(() => {
      const senyal = cadena.actual.controller.signal;
      // Dos tics després: quan el relleu ja ha respost i abans que el servei cree el seguiment.
      if (relleu.mock.calls.length === 1) queueMicrotask(() => queueMicrotask(() => cadena.renova()));
      return senyal;
    });

    await expect(servei.enviaMissatge(FIL, { text: 'Rotació abans d\'eixir' }, { ...CONFIG_A, obteSenyalIntent: relleu }))
      .resolves.toMatchObject({ seq: 17 });
    expect(relleu.mock.calls.map(([arg]) => arg)).toEqual([{ intent: 0, salt: 0 }, { intent: 0, salt: 1 }]);
    expect(enviaMissatge).toHaveBeenCalledTimes(1);
    expect(relleu.mock.invocationCallOrder[1]).toBeLessThan(enviaMissatge.mock.invocationCallOrder[0]);
  }, 4000);

  it('eixir i tornar a entrar (mateix UUID) amb la rotació: SESSIO_CANVIADA i cap reenviament', async () => {
    const { identitat, creaServeiXat } = await carrega();
    entra(identitat, CONFIG_A);
    const cadena = cadenaOperacions();
    const enviaMissatge = vi.fn((_fil, _payload, config) => transportPenjat(config, () => {
      identitat.esborraSessio();
      identitat.desaSessio(sessio('tok-entrada-nova'));
      cadena.renova(); // encara que la UI ho prenga per una renovació, el llinatge ja no és el mateix
    }));
    const servei = creaServeiXat({ enviaMissatge, refreshSession: vi.fn(), escoltaCanvisSessio: null });

    await expect(servei.enviaMissatge(FIL, { text: 'De la sessió vella' }, { ...CONFIG_A, obteSenyalIntent: relleuDeLaCrida(cadena) }))
      .rejects.toMatchObject({ codi: 'SESSIO_CANVIADA', retriable: false });
    expect(enviaMissatge).toHaveBeenCalledTimes(1);
  }, 4000);

  it('canvi d\'actor amb el relleu cablejat i font viva: el transport en vol cau amb SESSIO_CANVIADA, sense reenviament', async () => {
    const { identitat, creaServeiXat } = await carrega();
    entra(identitat, CONFIG_A);
    const cadena = cadenaOperacions();
    let actorViu = ORG;
    const enviaMissatge = vi.fn((_fil, _payload, config) => transportPenjat(config, () => {
      actorViu = null; // la barra negra torna a la persona: XatContext canvia d'àmbit
      cadena.canviaAmbit();
    }));
    const servei = creaServeiXat({ enviaMissatge, refreshSession: vi.fn(), obteActorOrgId: () => actorViu, escoltaCanvisSessio: null });

    await expect(servei.enviaMissatge(FIL, { text: 'Com a forn' }, { ...CONFIG_A, comOrgId: ORG, obteSenyalIntent: relleuDeLaCrida(cadena) }))
      .rejects.toMatchObject({ codi: 'SESSIO_CANVIADA', retriable: false });
    expect(enviaMissatge).toHaveBeenCalledTimes(1);
  }, 4000);

  it('canvi d\'àmbit amb font viva (la persona): el relleu torna null i la cancel·lació és definitiva (RELLEU_NUL)', async () => {
    const { identitat, creaServeiXat } = await carrega();
    entra(identitat, CONFIG_A);
    const cadena = cadenaOperacions();
    const enviaMissatge = vi.fn((_fil, _payload, config) => transportPenjat(config, () => cadena.canviaAmbit()));
    const servei = creaServeiXat({ enviaMissatge, refreshSession: vi.fn(), obteActorOrgId: () => null, escoltaCanvisSessio: null });

    await expect(servei.enviaMissatge(FIL, { text: 'Personal' }, { ...CONFIG_A, obteSenyalIntent: relleuDeLaCrida(cadena) }))
      .rejects.toMatchObject({ codi: 'OPERACIO_CANCELADA', motiu: 'RELLEU_NUL', definitiu: true });
    expect(enviaMissatge).toHaveBeenCalledTimes(1);
  }, 4000);

  it('un relleu que torna a donar el mateix senyal ja avortat no es recicla (SENYAL_AVORTAT)', async () => {
    const { identitat, creaServeiXat } = await carrega();
    entra(identitat, CONFIG_A);
    const unic = new AbortController();
    const enviaMissatge = vi.fn((_fil, _payload, config) => transportPenjat(config, () => unic.abort()));
    const servei = creaServeiXat({ enviaMissatge, refreshSession: vi.fn(), obteActorOrgId: () => null, escoltaCanvisSessio: null });

    await expect(servei.enviaMissatge(FIL, { text: 'Sempre el mateix' }, { ...CONFIG_A, obteSenyalIntent: () => unic.signal }))
      .rejects.toMatchObject({ codi: 'OPERACIO_CANCELADA', motiu: 'SENYAL_AVORTAT', definitiu: true });
    expect(enviaMissatge).toHaveBeenCalledTimes(1);
  }, 4000);

  it('un transport que ignora l\'abort i respon tard: se segueix el relleu i s\'entrega la seua resposta, sense reenviar', async () => {
    const { identitat, creaServeiXat } = await carrega();
    entra(identitat, CONFIG_A);
    const cadena = cadenaOperacions();
    const enviaMissatge = vi.fn((_fil, payload) => new Promise((resol) => {
      setTimeout(() => cadena.renova(), 0);
      setTimeout(() => resol(confirmacio(payload, 13)), 5); // sord a l'abort
    }));
    const servei = creaServeiXat({ enviaMissatge, refreshSession: vi.fn(), obteActorOrgId: () => null, escoltaCanvisSessio: null });

    await expect(servei.enviaMissatge(FIL, { text: 'Transport sord' }, { ...CONFIG_A, obteSenyalIntent: relleuDeLaCrida(cadena) }))
      .resolves.toMatchObject({ seq: 13 });
    expect(enviaMissatge).toHaveBeenCalledTimes(1);
  }, 4000);

  it('contracte de la capçalera: sense relleu ni avís, un canvi d\'actor no talla el transport; revalidaEnVol() del cablejat, sí', async () => {
    const { identitat, creaServeiXat } = await carrega();
    entra(identitat, CONFIG_A);
    let actorViu = ORG;
    let senyalTransport = null;
    const enviaMissatge = vi.fn((_fil, _payload, config) => {
      senyalTransport = config.signal;
      return new Promise(() => {}); // penjat i sord a l'abort
    });
    const servei = creaServeiXat({ enviaMissatge, refreshSession: vi.fn(), obteActorOrgId: () => actorViu, escoltaCanvisSessio: null });

    const enviament = servei.enviaMissatge(FIL, { text: 'Com a forn' }, { ...CONFIG_A, comOrgId: ORG });
    // IdentitatContext.setActor no emet cap avís: sense relleu ni crida del cablejat, res no ho veu.
    actorViu = null;
    await new Promise((resol) => { setTimeout(resol, 0); });
    expect(senyalTransport.aborted).toBe(false);
    expect(servei.comptaEnVol()).toBe(1);

    servei.revalidaEnVol();
    await expect(enviament).rejects.toMatchObject({ codi: 'SESSIO_CANVIADA', retriable: false });
    expect(senyalTransport.aborted).toBe(true);
    expect(servei.comptaEnVol()).toBe(0);
  }, 4000);
});

describe('R26 ronda 3 · sense font viva de l\'actor, un senyal del relleu que cau amb el transport en vol és definitiu (microsonda V1)', () => {
  for (const [nom, rota] of [['canvi d\'àmbit', (cadena) => cadena.canviaAmbit()], ['renovació', (cadena) => cadena.renova()]]) {
    it(`V1 · relleu ingenu i ${nom} en vol: OPERACIO_CANCELADA, ni reenviament ni resposta de l'àmbit vell`, async () => {
      const { identitat, creaServeiXat } = await carrega();
      entra(identitat, CONFIG_A);
      const cadena = cadenaOperacions();
      const senyals = [];
      const enviaMissatge = vi.fn((_fil, payload, config) => {
        senyals.push(config.signal);
        if (senyals.length === 1) return transportQueRespon(config, confirmacio(payload, 4), () => rota(cadena));
        return Promise.resolve(confirmacio(payload, 5));
      });
      const servei = creaServeiXat({ enviaMissatge, refreshSession: vi.fn(), escoltaCanvisSessio: null });

      await expect(servei.enviaMissatge(FIL, { text: 'Com a forn, sense font de l\'actor' }, {
        ...CONFIG_A,
        obteSenyalIntent: () => cadena.actual.controller.signal, // ingenu: l'operació viva, siga de l'àmbit que siga
      })).rejects.toMatchObject({ codi: 'OPERACIO_CANCELADA', motiu: 'SENYAL_INTENT_AVORTAT', definitiu: true, retriable: false });
      expect(enviaMissatge).toHaveBeenCalledTimes(1);
      expect(senyals[0].aborted).toBe(true); // fallada tancada: el transport es talla
      expect(servei.comptaEnVol()).toBe(0);
    }, 4000);
  }

  it('V1 · sense font viva, un transport sord que no respon mai: la rotació és definitiva i la promesa es liquida', async () => {
    const { identitat, creaServeiXat } = await carrega();
    entra(identitat, CONFIG_A);
    const cadena = cadenaOperacions();
    const enviaMissatge = vi.fn(() => {
      setTimeout(() => cadena.renova(), 0);
      return new Promise(() => {}); // sord a l'abort i sense resposta
    });
    const servei = creaServeiXat({ enviaMissatge, refreshSession: vi.fn(), escoltaCanvisSessio: null });

    await expect(servei.enviaMissatge(FIL, { text: 'Transport sord' }, { ...CONFIG_A, obteSenyalIntent: relleuDeLaCrida(cadena) }))
      .rejects.toMatchObject({ codi: 'OPERACIO_CANCELADA', motiu: 'SENYAL_INTENT_AVORTAT', definitiu: true });
    expect(enviaMissatge).toHaveBeenCalledTimes(1);
  }, 4000);
});

describe('R26 ronda 2 · classificació fidel quan la renovació falla', () => {
  it('una ALTRA sessió viva després d\'un refresc fallit és SESSIO_CANVIADA, no SESSIO_CADUCADA', async () => {
    const { identitat, creaServeiXat } = await carrega();
    entra(identitat, CONFIG_A);
    const enviaMissatge = vi.fn(async () => { throw errorJwtDelPort(); });
    const refreshFals = vi.fn(async () => {
      identitat.esborraSessio();
      identitat.desaSessio(sessio('tok-altre', ALTRE_USUARI));
      return false;
    });
    const servei = creaServeiXat({ enviaMissatge, refreshSession: refreshFals, escoltaCanvisSessio: null });
    await expect(servei.enviaMissatge(FIL, { text: 'Refresc fals' }, { ...CONFIG_A }))
      .rejects.toMatchObject({ codi: 'SESSIO_CANVIADA', retriable: false });

    const refreshLlanca = vi.fn(async () => {
      identitat.esborraSessio();
      identitat.desaSessio(sessio('tok-tercer', USUARI));
      throw new Error('Error de servidor (503)');
    });
    const serveiB = creaServeiXat({ enviaMissatge, refreshSession: refreshLlanca, escoltaCanvisSessio: null });
    await expect(serveiB.enviaMissatge(FIL, { text: 'Refresc que llança' }, { ...CONFIG_A }))
      .rejects.toMatchObject({ codi: 'SESSIO_CANVIADA', retriable: false });
    expect(enviaMissatge).toHaveBeenCalledTimes(2);
  });

  it('sense cap sessió després del refresc (auth.js tanca la pestanya amb un refresh token revocat) continua sent SESSIO_CADUCADA refreshFallit', async () => {
    const { identitat, creaServeiXat } = await carrega();
    entra(identitat, CONFIG_A);
    const enviaMissatge = vi.fn(async () => { throw errorJwtDelPort(); });
    const refreshSession = vi.fn(async () => {
      identitat.esborraSessio({ abast: 'pestanya' }); // renova(): 400/401 → tanca({ abast: 'pestanya' }) → false
      return false;
    });
    const servei = creaServeiXat({ enviaMissatge, refreshSession, escoltaCanvisSessio: null });
    await expect(servei.enviaMissatge(FIL, { text: 'Refresh revocat' }, { ...CONFIG_A }))
      .rejects.toMatchObject({ codi: 'SESSIO_CADUCADA', refreshFallit: true, retriable: false });
    expect(enviaMissatge).toHaveBeenCalledTimes(1);
  });
});

describe('R26 ronda 2 · llavor/local: el convidat és la persona local (decisió declarada)', () => {
  it('en llavor el convidat d\'identitat() envia com joId de XatContext, amb un llinatge estable; en remot sense sessió, no', async () => {
    const { identitat, creaServeiXat } = await carrega();
    const CONFIG_LLAVOR = Object.freeze({ dataMode: 'seed', backendUrl: 'https://a.example.test', supabaseAnonKey: 'sb_publishable_prova_a' });
    identitat.configuraBackendSessio(CONFIG_LLAVOR);
    const convidat = identitat.identitat();
    expect(convidat.autenticat).toBe(false);
    expect(identitat.identitat().id).toBe(convidat.id);

    const enviaMissatge = vi.fn(async (_fil, payload) => confirmacio(payload, 4));
    const servei = creaServeiXat({ enviaMissatge, refreshSession: vi.fn(), escoltaCanvisSessio: null });
    await expect(servei.enviaMissatge(FIL, { text: 'Des de la llavor' }, { ...CONFIG_LLAVOR })).resolves.toMatchObject({ seq: 4 });
    expect(enviaMissatge).toHaveBeenCalledTimes(1);

    await expect(servei.enviaMissatge(FIL, { text: 'Remot sense sessió' }, { ...CONFIG_A }))
      .rejects.toMatchObject({ codi: 'SESSIO_CADUCADA', retriable: false });
    expect(enviaMissatge).toHaveBeenCalledTimes(1);
  });
});
