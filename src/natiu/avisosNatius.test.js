// @vitest-environment node
/* Ordre del Mestre (261026, prompt 261026_1615, tasca 3) · L'adaptador dels
   avisos natius del xat (avisosNatius.js) amb un connector fals (vi.fn per a
   createChannel, schedule, els permisos i addListener): mai es carrega el de
   veres. A Android el canal «xat» es crea una vegada; a iOS, mai. */
import { describe, expect, test, vi } from 'vitest';
import { CANAL_XAT, creaAvisosNatius } from './avisosNatius.js';

function connectorFals() {
  const ln = {
    createChannel: vi.fn(async () => undefined),
    schedule: vi.fn(async () => ({ notifications: [{ id: 1 }] })),
    checkPermissions: vi.fn(async () => ({ display: 'prompt' })),
    requestPermissions: vi.fn(async () => ({ display: 'granted' })),
    addListener: vi.fn(async () => ({ remove: async () => {} }))
  };
  // Com el mòdul de veres: el connector hi va dins (vegeu carregaPerDefecte).
  return { ln, carregaConnector: vi.fn(async () => ({ LocalNotifications: ln })) };
}
const AVIS = Object.freeze({ id: 7, titol: 'Maria', cos: 'Bon dia!', filId: 'fil-1' });
const CANAL_ESPERAT = Object.freeze({
  id: 'xat',
  name: 'Missatges del xat',
  description: 'Avisos dels missatges nous de Sóc de Poble',
  importance: 4,
  visibility: 0,
  vibration: true,
  lights: true
});
/* addListener s'enganxa després de carregar el connector: una volta de temporitzador ho buida. */
const buida = () => new Promise((resol) => { setTimeout(resol, 0); });
const PENJADA = Symbol('penjada');
function abansDe(ms, promesa) {
  let temporitzador;
  const espera = new Promise((resol) => { temporitzador = setTimeout(() => resol(PENJADA), ms); });
  return Promise.race([promesa, espera]).finally(() => clearTimeout(temporitzador));
}

describe('la plataforma', () => {
  /* Revisió 261026 · Només Android: a iOS el WebView es congela en segon pla i
     cap sondeig hi arriba; iOS esperarà el push. */
  test('null fora de l’App i a iOS; a Android, l’adaptador sense carregar res encara', () => {
    const { carregaConnector } = connectorFals();
    for (const plataforma of ['web', 'electron', 'ios', 'IOS', '', undefined]) {
      expect(creaAvisosNatius({ plataforma, carregaConnector })).toBeNull();
    }
    expect(creaAvisosNatius()).toBeNull();
    expect(creaAvisosNatius({ plataforma: 'android', carregaConnector }).plataforma).toBe('android');
    expect(carregaConnector).not.toHaveBeenCalled();
  });
});

describe('avisa', () => {
  test('Android: el canal «xat» es crea una sola vegada, abans del primer schedule, també amb dos avisos alhora', async () => {
    const { ln, carregaConnector } = connectorFals();
    const avisos = creaAvisosNatius({ plataforma: 'android', carregaConnector });
    await Promise.all([avisos.avisa(AVIS), avisos.avisa({ ...AVIS, id: 8 })]);
    await avisos.avisa({ ...AVIS, id: 9 });
    expect(ln.createChannel).toHaveBeenCalledTimes(1);
    expect(ln.createChannel).toHaveBeenCalledWith(CANAL_ESPERAT);
    expect(ln.schedule).toHaveBeenCalledTimes(3);
    expect(ln.createChannel.mock.invocationCallOrder[0]).toBeLessThan(ln.schedule.mock.invocationCallOrder[0]);
    expect(carregaConnector).toHaveBeenCalledTimes(1);
  });

  test('Android: el nom i la descripció del canal es poden traduir', async () => {
    const { ln, carregaConnector } = connectorFals();
    await creaAvisosNatius({ plataforma: 'android', canal: { nom: 'Chat', descripcio: 'Mensajes nuevos' }, carregaConnector }).avisa(AVIS);
    expect(ln.createChannel).toHaveBeenCalledWith({ ...CANAL_ESPERAT, name: 'Chat', description: 'Mensajes nuevos' });
  });

  test('Android: el canal es pot donar com a funció, llegida en crear-lo (amb el diccionari ja carregat)', async () => {
    const { ln, carregaConnector } = connectorFals();
    const canal = vi.fn(() => ({ nom: 'Mensajes del chat', descripcio: 'Avisos' }));
    const avisos = creaAvisosNatius({ plataforma: 'android', canal, carregaConnector });
    expect(canal).not.toHaveBeenCalled();
    await avisos.avisa(AVIS);
    expect(ln.createChannel).toHaveBeenCalledWith({ ...CANAL_ESPERAT, name: 'Mensajes del chat', description: 'Avisos' });
  });

  test('el schedule porta el fil com a fil de l’avís i com a extra; sense fil, el grup «xat»', async () => {
    expect(CANAL_XAT).toBe('xat');
    const { ln, carregaConnector } = connectorFals();
    const avisos = creaAvisosNatius({ plataforma: 'android', carregaConnector });
    await expect(avisos.avisa(AVIS)).resolves.toBeUndefined();
    /* Revisió 261026 · isExactNotification: false. Sense, el connector obria
       «Alarmes i recordatoris» a Android 12+ en lloc d'avisar. */
    expect(ln.schedule).toHaveBeenLastCalledWith({
      notifications: [{
        id: 7, title: 'Maria', body: 'Bon dia!', isExactNotification: false, channelId: 'xat', group: 'xat', threadIdentifier: 'fil-1', autoCancel: true, extra: { filId: 'fil-1' }
      }]
    });
    await avisos.avisa({ id: 8, titol: 'Pere', cos: 'Hola' });
    const [avis] = ln.schedule.mock.lastCall[0].notifications;
    expect(avis).toMatchObject({ id: 8, threadIdentifier: 'xat', group: 'xat', channelId: 'xat' });
    expect(avis.extra.filId).toBeUndefined();
  });

  test('un canal que no es crea es torna a provar a l’avís següent, i sense canal no s’avisa', async () => {
    const { ln, carregaConnector } = connectorFals();
    ln.createChannel.mockRejectedValueOnce(new Error('canal'));
    const avisos = creaAvisosNatius({ plataforma: 'android', carregaConnector });
    await expect(avisos.avisa(AVIS)).rejects.toThrow('canal');
    expect(ln.schedule).not.toHaveBeenCalled();
    await avisos.avisa(AVIS);
    expect(ln.createChannel).toHaveBeenCalledTimes(2);
    expect(ln.schedule).toHaveBeenCalledTimes(1);
  });
});

/* Gauntlet 261026_1615 (Codex C1615-09) · avisa() espera el canal abans del
   schedule. Si mentrestant la persona torna a l'App (i la barra es neteja), o
   tanca la sessió, l'avís ja no ha d'eixir: `vigent` es consulta DESPRÉS del
   canal. Tot amb promeses controlades: cap temporitzador. */
describe('avisa amb vigent (la carrera del canal)', () => {
  /** Un connector amb el primer createChannel pendent fins que es crida obri(). */
  function canalDiferit() {
    const { ln, carregaConnector } = connectorFals();
    ln.removeAllDeliveredNotifications = vi.fn(async () => undefined);
    let obri = null;
    let senyala;
    const demanat = new Promise((resol) => { senyala = resol; });
    ln.createChannel.mockImplementationOnce(() => new Promise((resol) => {
      obri = () => resol(undefined);
      senyala();
    }));
    return { ln, carregaConnector, demanat, obri: () => obri() };
  }

  test('vigent() passa a false mentre es crea el canal (la barra s’ha netejat): cap schedule', async () => {
    const { ln, carregaConnector, demanat, obri } = canalDiferit();
    const avisos = creaAvisosNatius({ plataforma: 'android', carregaConnector });
    let enSegonPla = true;
    const vigent = vi.fn(() => enSegonPla);
    const avis = avisos.avisa({ ...AVIS, vigent });
    await demanat;
    expect(ln.createChannel).toHaveBeenCalledTimes(1);
    expect(ln.schedule).not.toHaveBeenCalled();

    // La persona torna a l'App: la barra es neteja i l'avís deixa de ser vigent.
    enSegonPla = false;
    await avisos.netejaAvisos();
    expect(ln.removeAllDeliveredNotifications).toHaveBeenCalledTimes(1);
    obri();
    await expect(avis).resolves.toBeUndefined();
    expect(vigent).toHaveBeenCalled();
    expect(vigent.mock.results.at(-1).value).toBe(false);
    expect(ln.schedule).not.toHaveBeenCalled();

    // El canal ja és fet: l'avís següent, vigent, sí que ix i no el torna a crear.
    await avisos.avisa({ ...AVIS, id: 8, vigent: () => true });
    expect(ln.createChannel).toHaveBeenCalledTimes(1);
    expect(ln.schedule).toHaveBeenCalledTimes(1);
    expect(ln.schedule.mock.lastCall[0].notifications[0].id).toBe(8);
  });

  test('vigent() continua true quan el canal ja és fet: un schedule, sense vigent dins de l’avís', async () => {
    const { ln, carregaConnector, demanat, obri } = canalDiferit();
    const avisos = creaAvisosNatius({ plataforma: 'android', carregaConnector });
    const vigent = vi.fn(() => true);
    const avis = avisos.avisa({ ...AVIS, vigent });
    await demanat;
    expect(ln.schedule).not.toHaveBeenCalled();
    obri();
    await avis;
    expect(vigent).toHaveBeenCalled();
    expect(ln.schedule).toHaveBeenCalledTimes(1);
    expect(ln.createChannel.mock.invocationCallOrder[0]).toBeLessThan(ln.schedule.mock.invocationCallOrder[0]);
    const [enviat] = ln.schedule.mock.lastCall[0].notifications;
    expect(enviat).toMatchObject({ id: 7, title: 'Maria', body: 'Bon dia!', channelId: 'xat', extra: { filId: 'fil-1' } });
    expect(enviat).not.toHaveProperty('vigent');
  });

  test('sense vigent (o amb null), avisa com sempre, també amb el canal diferit', async () => {
    for (const opcions of [{ ...AVIS }, { ...AVIS, vigent: null }, { ...AVIS, vigent: undefined }]) {
      const { ln, carregaConnector, demanat, obri } = canalDiferit();
      const avis = creaAvisosNatius({ plataforma: 'android', carregaConnector }).avisa(opcions);
      await demanat;
      expect(ln.schedule).not.toHaveBeenCalled();
      obri();
      await expect(avis).resolves.toBeUndefined();
      expect(ln.schedule, String(opcions.vigent)).toHaveBeenCalledTimes(1);
    }
  });

  test('vigent() false des del principi: cap schedule', async () => {
    const { ln, carregaConnector } = connectorFals();
    const vigent = vi.fn(() => false);
    await creaAvisosNatius({ plataforma: 'android', carregaConnector }).avisa({ ...AVIS, vigent });
    expect(vigent).toHaveBeenCalled();
    expect(ln.schedule).not.toHaveBeenCalled();
  });
});

describe('els permisos', () => {
  test('estatPermis i demanaPermis tornen només display', async () => {
    const { ln, carregaConnector } = connectorFals();
    ln.checkPermissions.mockResolvedValueOnce({ display: 'denied', altra: 'cosa' });
    const avisos = creaAvisosNatius({ plataforma: 'android', carregaConnector });
    await expect(avisos.estatPermis()).resolves.toBe('denied');
    await expect(avisos.demanaPermis()).resolves.toBe('granted');
    ln.checkPermissions.mockResolvedValueOnce(undefined);
    await expect(avisos.estatPermis()).resolves.toBeUndefined();
    expect(ln.checkPermissions).toHaveBeenCalledTimes(2);
    expect(ln.requestPermissions).toHaveBeenCalledTimes(1);
  });

  test('una càrrega fallida no queda guardada: la crida següent ho torna a provar, i la bona sí', async () => {
    const { carregaConnector } = connectorFals();
    carregaConnector.mockRejectedValueOnce(new Error('sense connector'));
    const avisos = creaAvisosNatius({ plataforma: 'android', carregaConnector });
    await expect(avisos.estatPermis()).rejects.toThrow('sense connector');
    await expect(avisos.estatPermis()).resolves.toBe('prompt');
    await expect(avisos.demanaPermis()).resolves.toBe('granted');
    expect(carregaConnector).toHaveBeenCalledTimes(2);
  });
});

describe('escoltaToc', () => {
  test('només passa els tocs amb un filId de text no buit, i només el filId', async () => {
    const { ln, carregaConnector } = connectorFals();
    const fn = vi.fn();
    expect(creaAvisosNatius({ plataforma: 'android', carregaConnector }).escoltaToc(fn)).toBeUndefined();
    await buida();
    expect(ln.addListener).toHaveBeenCalledTimes(1);
    const [[nom, oient]] = ln.addListener.mock.calls;
    expect(nom).toBe('localNotificationActionPerformed');
    oient({ actionId: 'tap', notification: { id: 7, title: 'Maria', extra: { filId: 'fil-1' } } });
    for (const accio of [
      { notification: { extra: { filId: '' } } },
      { notification: { extra: { filId: 42 } } },
      { notification: { extra: { filId: ['fil-1'] } } },
      { notification: { extra: null } },
      { notification: {} },
      {},
      null,
      undefined
    ]) oient(accio);
    expect(fn.mock.calls).toEqual([[{ filId: 'fil-1' }]]);
  });

  test('si el connector no carrega, no llança ni deixa cap rebuig solt', async () => {
    const { ln, carregaConnector } = connectorFals();
    carregaConnector.mockRejectedValueOnce(new Error('sense connector'));
    const fn = vi.fn();
    expect(() => creaAvisosNatius({ plataforma: 'android', carregaConnector }).escoltaToc(fn)).not.toThrow();
    await buida();
    expect(ln.addListener).not.toHaveBeenCalled();
    expect(fn).not.toHaveBeenCalled();
  });
});

/* El connector de veres és un Proxy de Capacitor que respon a qualsevol nom,
   també a `then`, sense cridar mai cap callback: una promesa resolta amb ell
   no es resol mai. L'adaptador no el torna mai d'una funció async. */
describe('el Proxy de Capacitor', () => {
  test('un connector que respon a «then» no penja cap crida', async () => {
    const { ln } = connectorFals();
    const trampa = new Proxy(ln, { get: (objectiu, nom) => (nom === 'then' ? () => {} : objectiu[nom]) });
    // La trampa és de veres: resoldre una promesa amb ella la deixa penjada.
    await expect(abansDe(50, Promise.resolve(trampa))).resolves.toBe(PENJADA);
    const avisos = creaAvisosNatius({ plataforma: 'android', carregaConnector: async () => ({ LocalNotifications: trampa }) });
    await expect(abansDe(1000, avisos.estatPermis())).resolves.toBe('prompt');
    await expect(abansDe(1000, avisos.demanaPermis())).resolves.toBe('granted');
    await expect(abansDe(1000, avisos.avisa(AVIS).then(() => 'fet'))).resolves.toBe('fet');
    expect(ln.createChannel).toHaveBeenCalledTimes(1);
    expect(ln.schedule).toHaveBeenCalledTimes(1);

    const registrat = new Promise((resol) => {
      ln.addListener.mockImplementationOnce(async (nom, oient) => { resol(oient); return { remove: async () => {} }; });
    });
    const fn = vi.fn();
    avisos.escoltaToc(fn);
    const oient = await abansDe(1000, registrat);
    expect(oient).toBeTypeOf('function');
    oient({ notification: { extra: { filId: 'fil-9' } } });
    expect(fn).toHaveBeenCalledWith({ filId: 'fil-9' });
  });
});
