// @vitest-environment node
/* Ordre del Mestre (261021, prompt 261021_0015, tasca 3) · el magatzem de
   l'oferta d'instal·lar a l'ordinador (beforeinstallprompt). Tot amb dobles:
   cap navegador, com registre.test.js. */
import { describe, expect, test, vi } from 'vitest';
import { INSTALACIO, MODES_D_APP, capturaInstalacio, creaInstalacio, esFinestraDApp, motiuPerNoOferir } from './instalacio.js';

/** Una finestra i un navigator de Chrome d'escriptori, en condicions d'oferir. */
function entorn({ suport = true, segur = true, incrustat = false, capacitor, modes = [], standalone, mobil } = {}) {
  const escoltes = new Map();
  const navegador = { standalone, userAgentData: mobil === undefined ? undefined : { mobile: mobil } };
  const finestra = {
    isSecureContext: segur,
    navigator: navegador,
    matchMedia: vi.fn((consulta) => ({ matches: modes.some((mode) => consulta === `(display-mode: ${mode})`) })),
    addEventListener: vi.fn((tipus, funcio) => escoltes.set(tipus, funcio)),
    removeEventListener: vi.fn((tipus, funcio) => { if (escoltes.get(tipus) === funcio) escoltes.delete(tipus); }),
    Capacitor: capacitor
  };
  if (suport) finestra.onbeforeinstallprompt = null;
  finestra.self = finestra;
  finestra.top = incrustat ? {} : finestra;
  return { finestra, navegador, escoltes };
}

/** Un BeforeInstallPromptEvent de mostra; `prompt` resol amb l'elecció com Chrome nou. */
function oferta({ outcome = 'accepted', prompt } = {}) {
  return {
    preventDefault: vi.fn(),
    prompt: prompt || vi.fn(() => Promise.resolve({ outcome, platform: 'web' })),
    userChoice: Promise.resolve({ outcome, platform: 'web' })
  };
}

describe('motiuPerNoOferir (pura)', () => {
  test('Chrome d\'escriptori, segur, fora d\'iframe i sense instal·lar: s\'oferix', () => {
    const { finestra, navegador } = entorn({ mobil: false });
    expect(motiuPerNoOferir({ finestra, navegador })).toBeNull();
    // Sense userAgentData (cap senyal de mòbil) també.
    expect(motiuPerNoOferir(entorn())).toBeNull();
  });

  test('cada motiu, en l\'ordre de la llista', () => {
    expect(motiuPerNoOferir()).toBe('sense-finestra');
    expect(motiuPerNoOferir({ finestra: {} })).toBe('sense-finestra');
    expect(motiuPerNoOferir(entorn({ suport: false }))).toBe('sense-suport');
    expect(motiuPerNoOferir(entorn({ segur: false }))).toBe('context-insegur');
    expect(motiuPerNoOferir(entorn({ incrustat: true }))).toBe('incrustat');
    expect(motiuPerNoOferir(entorn({ capacitor: { isNativePlatform: () => true } }))).toBe('nativa');
    expect(motiuPerNoOferir(entorn({ modes: ['standalone'] }))).toBe('instalada');
    expect(motiuPerNoOferir(entorn({ modes: ['window-controls-overlay'] }))).toBe('instalada');
    expect(motiuPerNoOferir(entorn({ standalone: true }))).toBe('instalada');
    expect(motiuPerNoOferir(entorn({ mobil: true }))).toBe('mobil');
  });

  test('un Capacitor web (isNativePlatform false) o trencat no és l\'app nativa', () => {
    expect(motiuPerNoOferir(entorn({ capacitor: { isNativePlatform: () => false } }))).toBeNull();
    expect(motiuPerNoOferir(entorn({ capacitor: { isNativePlatform: () => { throw new Error('pont'); } } }))).toBeNull();
  });

  test('un top que llança en llegir-lo és un iframe d\'un altre origen', () => {
    const { finestra, navegador } = entorn();
    Object.defineProperty(finestra, 'top', { get() { throw new Error('SecurityError'); } });
    expect(motiuPerNoOferir({ finestra, navegador })).toBe('incrustat');
  });
});

describe('esFinestraDApp', () => {
  test('qualsevol dels quatre modes de finestra del manifest, o navigator.standalone', () => {
    expect([...MODES_D_APP]).toEqual(['standalone', 'minimal-ui', 'fullscreen', 'window-controls-overlay']);
    expect(Object.isFrozen(MODES_D_APP)).toBe(true);
    for (const mode of MODES_D_APP) expect(esFinestraDApp(entorn({ modes: [mode] }).finestra), mode).toBe(true);
    expect(esFinestraDApp(entorn({ modes: ['browser'] }).finestra)).toBe(false);
    expect(esFinestraDApp(entorn({ standalone: true }).finestra)).toBe(true);
  });

  test('sense matchMedia, o si llança, no és cap senyal', () => {
    expect(esFinestraDApp(undefined)).toBe(false);
    expect(esFinestraDApp({})).toBe(false);
    expect(esFinestraDApp({ matchMedia: () => { throw new Error('res'); } })).toBe(false);
  });
});

describe('creaInstalacio · captura', () => {
  test('amb un motiu no registra cap escolta', () => {
    const magatzem = creaInstalacio();
    for (const opcions of [{ suport: false }, { segur: false }, { incrustat: true }, { modes: ['standalone'] }]) {
      const { finestra, navegador } = entorn(opcions);
      const resultat = magatzem.captura({ finestra, navegador });
      expect(resultat.escolta).toBe(false);
      expect(typeof resultat.motiu).toBe('string');
      expect(magatzem.motiuDeLaCaptura()).toBe(resultat.motiu);
      expect(finestra.addEventListener).not.toHaveBeenCalled();
    }
    expect(magatzem.captura({ finestra: undefined, navegador: undefined })).toEqual({ escolta: false, motiu: 'sense-finestra' });
  });

  /* P1-69 (ordre del Mestre, 261028 20:13) · Al mòbil s'escolta, però sense
     preventDefault (Chrome conserva la seua oferta), i la pastilla de la
     barra negra continua sent d'escriptori: pot() no veu l'oferta del mòbil. */
  test('P1-69 · al mòbil escolta i guarda l’oferta sense preventDefault: ofereix() sí, pot() no', async () => {
    const { finestra, navegador, escoltes } = entorn({ mobil: true });
    const magatzem = creaInstalacio();
    expect(magatzem.motiuDeLaCaptura()).toBe('sense-captura');
    expect(magatzem.captura({ finestra, navegador }).escolta).toBe(true);
    expect(magatzem.motiuDeLaCaptura()).toBe('mobil');
    expect([...escoltes.keys()].sort()).toEqual(['appinstalled', 'beforeinstallprompt']);
    const e = oferta();
    escoltes.get('beforeinstallprompt')(e);
    expect(e.preventDefault).not.toHaveBeenCalled();
    expect([magatzem.ofereix(), magatzem.pot()]).toEqual([true, false]);
    // El botó de Descàrregues l'obri igual: una volta, de manera síncrona.
    const promesa = magatzem.demana();
    expect(e.prompt).toHaveBeenCalledTimes(1);
    expect(magatzem.ofereix()).toBe(false);
    await expect(promesa).resolves.toBe('accepted');
  });

  /* Revisió adversarial de P1-69 (261028) · La tauleta Android diu
     userAgentData.mobile === false, però és Android: sense preventDefault
     (Chrome conserva la seua oferta) i fora de la pastilla d'escriptori. */
  test('P1-69 · Android també a la tauleta (o sense userAgentData): sense preventDefault, ofereix() sí, pot() no', () => {
    const tauletes = [
      { userAgentData: { mobile: false, platform: 'Android' } },
      { userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' }
    ];
    for (const navegador of tauletes) {
      const { finestra, escoltes } = entorn();
      const magatzem = creaInstalacio();
      expect(magatzem.captura({ finestra, navegador }).escolta).toBe(true);
      expect(magatzem.motiuDeLaCaptura()).toBeNull();
      const e = oferta();
      escoltes.get('beforeinstallprompt')(e);
      expect([e.preventDefault.mock.calls.length, magatzem.ofereix(), magatzem.pot()]).toEqual([0, true, false]);
    }
    // Linux d'escriptori no és Android: la pastilla, com sempre.
    const { finestra, escoltes } = entorn();
    const magatzem = creaInstalacio();
    magatzem.captura({ finestra, navegador: { userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', userAgentData: { mobile: false, platform: 'Linux' } } });
    const e = oferta();
    escoltes.get('beforeinstallprompt')(e);
    expect([e.preventDefault.mock.calls.length, magatzem.pot()]).toEqual([1, true]);
  });

  /* Revisió adversarial de P1-69 · Safari i Firefox no tenen l'esdeveniment
     ('sense-suport' ve abans d''incrustat'): dins d'un iframe, Descàrregues
     ha de saber que la pàgina és de l'amfitrió. La pastilla no canvia. */
  test('P1-69 · Safari dins d’un iframe: motiuDeLaCaptura() és incrustat i el motiu que torna, el de sempre', () => {
    const magatzem = creaInstalacio();
    const { finestra, navegador } = entorn({ suport: false, incrustat: true });
    expect(magatzem.captura({ finestra, navegador })).toEqual({ escolta: false, motiu: 'sense-suport' });
    expect(magatzem.motiuDeLaCaptura()).toBe('incrustat');
    const creuat = entorn({ suport: false });
    Object.defineProperty(creuat.finestra, 'top', { get() { throw new Error('SecurityError'); } });
    magatzem.captura(creuat);
    expect(magatzem.motiuDeLaCaptura()).toBe('incrustat');
    magatzem.captura(entorn({ suport: false }));
    expect(magatzem.motiuDeLaCaptura()).toBe('sense-suport');
    expect(finestra.addEventListener).not.toHaveBeenCalled();
  });

  /* Revisió adversarial de P1-69 · Al mòbil l'oferta pròpia de Chrome és el
     camí principal: la instal·lació es fa en qualsevol pàgina, i Descàrregues
     ho ha de saber quan s'hi arriba després. */
  test('P1-69 · estaInstalada(): appinstalled (amb oferta o sense) se’n recorda; una oferta nova o una captura nova l’obliden', () => {
    const { finestra, navegador, escoltes } = entorn({ mobil: true });
    const magatzem = creaInstalacio();
    magatzem.captura({ finestra, navegador });
    const avisat = vi.fn();
    magatzem.subscriu(avisat);
    expect(magatzem.estaInstalada()).toBe(false);
    // Pel menú del navegador, sense cap oferta guardada: també compta, i avisa una volta.
    escoltes.get('appinstalled')({});
    expect([magatzem.estaInstalada(), avisat.mock.calls.length]).toEqual([true, 1]);
    escoltes.get('appinstalled')({});
    expect(avisat).toHaveBeenCalledTimes(1);
    // El navegador la torna a oferir: ja no hi és.
    escoltes.get('beforeinstallprompt')(oferta());
    expect([magatzem.estaInstalada(), magatzem.ofereix()]).toEqual([false, true]);
    escoltes.get('appinstalled')({});
    expect([magatzem.estaInstalada(), magatzem.ofereix()]).toEqual([true, false]);
    magatzem.captura({ finestra, navegador });
    expect(magatzem.estaInstalada()).toBe(false);
  });

  test('P1-69 · a escriptori, ofereix() i pot() diuen el mateix i motiuDeLaCaptura() és null', () => {
    const { finestra, navegador, escoltes } = entorn({ mobil: false });
    const magatzem = creaInstalacio();
    magatzem.captura({ finestra, navegador });
    expect(magatzem.motiuDeLaCaptura()).toBeNull();
    expect([magatzem.ofereix(), magatzem.pot()]).toEqual([false, false]);
    escoltes.get('beforeinstallprompt')(oferta());
    expect([magatzem.ofereix(), magatzem.pot()]).toEqual([true, true]);
    escoltes.get('appinstalled')({});
    expect([magatzem.ofereix(), magatzem.pot()]).toEqual([false, false]);
  });

  test('sense motiu escolta beforeinstallprompt i appinstalled', () => {
    const { finestra, navegador, escoltes } = entorn();
    const resultat = creaInstalacio().captura({ finestra, navegador });
    expect(resultat.escolta).toBe(true);
    expect([...escoltes.keys()].sort()).toEqual(['appinstalled', 'beforeinstallprompt']);
  });

  test('l\'oferta: preventDefault una volta, pot() passa a true i els subscriptors ho saben', () => {
    const { finestra, navegador, escoltes } = entorn();
    const magatzem = creaInstalacio();
    const avisat = vi.fn();
    magatzem.subscriu(avisat);
    magatzem.captura({ finestra, navegador });
    expect(magatzem.pot()).toBe(false);
    const e = oferta();
    escoltes.get('beforeinstallprompt')(e);
    expect(e.preventDefault).toHaveBeenCalledTimes(1);
    expect(magatzem.pot()).toBe(true);
    expect(avisat).toHaveBeenCalledTimes(1);
  });

  test('appinstalled buida l\'oferta i avisa', () => {
    const { finestra, navegador, escoltes } = entorn();
    const magatzem = creaInstalacio();
    magatzem.captura({ finestra, navegador });
    escoltes.get('beforeinstallprompt')(oferta());
    const avisat = vi.fn();
    magatzem.subscriu(avisat);
    escoltes.get('appinstalled')({});
    expect(magatzem.pot()).toBe(false);
    expect(avisat).toHaveBeenCalledTimes(1);
    // Sense oferta, una altra instal·lació (pel menú del navegador) no avisa de franc.
    escoltes.get('appinstalled')({});
    expect(avisat).toHaveBeenCalledTimes(1);
  });

  test('deixa() retira les dos escoltes, i una captura nova deixa l\'anterior', () => {
    const { finestra, navegador, escoltes } = entorn();
    const magatzem = creaInstalacio();
    const primera = magatzem.captura({ finestra, navegador });
    const oferir = escoltes.get('beforeinstallprompt');
    magatzem.captura({ finestra, navegador });
    expect(finestra.removeEventListener).toHaveBeenCalledWith('beforeinstallprompt', oferir);
    expect(finestra.addEventListener).toHaveBeenCalledTimes(4);
    expect(escoltes.size).toBe(2);
    finestra.removeEventListener.mockClear();
    primera.deixa();
    expect(finestra.removeEventListener).toHaveBeenCalledTimes(2);
  });

  test('un subscriptor que llança no para els altres; la baixa el retira', () => {
    const { finestra, navegador, escoltes } = entorn();
    const magatzem = creaInstalacio();
    magatzem.subscriu(() => { throw new Error('trencat'); });
    const bo = vi.fn();
    const baixa = magatzem.subscriu(bo);
    magatzem.captura({ finestra, navegador });
    expect(() => escoltes.get('beforeinstallprompt')(oferta())).not.toThrow();
    expect(bo).toHaveBeenCalledTimes(1);
    baixa();
    escoltes.get('appinstalled')({});
    expect(bo).toHaveBeenCalledTimes(1);
    expect(magatzem.subscriu('no-és-funció')()).toBeUndefined();
  });
});

describe('creaInstalacio · demana', () => {
  function ambOferta(e) {
    const { finestra, navegador, escoltes } = entorn();
    const magatzem = creaInstalacio();
    magatzem.captura({ finestra, navegador });
    escoltes.get('beforeinstallprompt')(e);
    return magatzem;
  }

  test('crida prompt() de manera síncrona, una volta, i buida el magatzem abans de resoldre', async () => {
    const e = oferta({ outcome: 'accepted' });
    const magatzem = ambOferta(e);
    const avisat = vi.fn();
    magatzem.subscriu(avisat);
    const promesa = magatzem.demana();
    // Encara dins del clic: cap await abans de prompt().
    expect(e.prompt).toHaveBeenCalledTimes(1);
    expect(magatzem.pot()).toBe(false);
    expect(avisat).toHaveBeenCalledTimes(1);
    await expect(promesa).resolves.toBe('accepted');
  });

  test('dismissed, i una segona crida sense oferta torna no-disponible sense cridar res', async () => {
    const e = oferta({ outcome: 'dismissed' });
    const magatzem = ambOferta(e);
    await expect(magatzem.demana()).resolves.toBe('dismissed');
    await expect(magatzem.demana()).resolves.toBe('no-disponible');
    expect(e.prompt).toHaveBeenCalledTimes(1);
    expect(magatzem.estaInstalada()).toBe(false);
  });

  test('P1-69 · «accepted» deixa estaInstalada() a true i avisa', async () => {
    const magatzem = ambOferta(oferta({ outcome: 'accepted' }));
    const avisat = vi.fn();
    magatzem.subscriu(avisat);
    await expect(magatzem.demana()).resolves.toBe('accepted');
    expect(magatzem.estaInstalada()).toBe(true);
    // Una per a l'oferta gastada i una per a la instal·lació.
    expect(avisat).toHaveBeenCalledTimes(2);
  });

  test('Chrome antic: prompt() resol buit i l\'elecció ve de userChoice', async () => {
    const e = oferta({ outcome: 'dismissed', prompt: vi.fn(() => Promise.resolve()) });
    await expect(ambOferta(e).demana()).resolves.toBe('dismissed');
  });

  test('mai no llança: un prompt que llança, que rebutja o sense elecció resol error', async () => {
    const llança = oferta({ prompt: vi.fn(() => { throw new DOMException('sense activació', 'NotAllowedError'); }) });
    const magatzem = ambOferta(llança);
    let promesa;
    expect(() => { promesa = magatzem.demana(); }).not.toThrow();
    await expect(promesa).resolves.toBe('error');
    expect(magatzem.pot()).toBe(false);

    const rebutja = oferta({ prompt: vi.fn(() => Promise.reject(new Error('no'))) });
    await expect(ambOferta(rebutja).demana()).resolves.toBe('error');

    const muda = { preventDefault: vi.fn(), prompt: vi.fn(() => undefined) };
    await expect(ambOferta(muda).demana()).resolves.toBe('error');
  });

  test('una oferta nova després de rebutjar-la torna a mostrar el botó', () => {
    const { finestra, navegador, escoltes } = entorn();
    const magatzem = creaInstalacio();
    magatzem.captura({ finestra, navegador });
    escoltes.get('beforeinstallprompt')(oferta({ outcome: 'dismissed' }));
    magatzem.demana();
    expect(magatzem.pot()).toBe(false);
    escoltes.get('beforeinstallprompt')(oferta());
    expect(magatzem.pot()).toBe(true);
  });
});

describe('el de la pàgina', () => {
  test('INSTALACIO és congelat, amb referències estables, i capturaInstalacio n\'és la captura', () => {
    expect(Object.isFrozen(INSTALACIO)).toBe(true);
    expect(Object.keys(INSTALACIO).sort()).toEqual(['captura', 'demana', 'estaInstalada', 'motiuDeLaCaptura', 'ofereix', 'pot', 'subscriu']);
    expect(capturaInstalacio).toBe(INSTALACIO.captura);
    expect(INSTALACIO.pot).toBe(INSTALACIO.pot);
  });

  test('a Node (sense window) no escolta res ni llança', () => {
    expect(capturaInstalacio()).toEqual({ escolta: false, motiu: 'sense-finestra' });
    expect(INSTALACIO.pot()).toBe(false);
  });
});
