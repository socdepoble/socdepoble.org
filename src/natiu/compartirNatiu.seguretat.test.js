// @vitest-environment node
/* Ordre del Mestre (261026, prompt 261026_1615, tasques 1 i 2) · El receptor
   del menú «Compartir» (compartirNatiu.js) amb un pont fals de Capacitor
   (addListener, convertFileSrc i nativePromise) i un llegix fals en lloc de
   fetch: cap fitxer ni connector de veres. La finestra és un EventTarget amb
   el CustomEvent del sistema, per escoltar «sdp:compartir_natiu» de debò. */
import { describe, expect, test, vi } from 'vitest';
import { ESDEVENIMENT_FINESTRA, creaReceptorCompartit } from './compartirNatiu.js';
import { MAX_FITXERS_COMPARTITS, MAX_TEXT_COMPARTIT } from '../config/compartirNatiu.js';

const MB_20 = 20 * 1024 * 1024;
const urlDe = (ruta) => `https://localhost/_capacitor_file_${ruta}`;
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);
const respostaBona = () => ({ ok: true, status: 200, blob: async () => new Blob([PNG], { type: 'image/png' }) });
const imatge = (ruta, extra = {}) => ({ ruta, mime: 'image/png', mida: PNG.length, nom: ruta.split('/').pop(), ...extra });

/* Cada URL torna el PNG de 7 bytes; `respostes` en canvia unes quantes (un Error, el llegix llança). */
function llegixFals(respostes = {}) {
  return vi.fn(async (url) => {
    const resposta = respostes[url];
    if (resposta instanceof Error) throw resposta;
    return resposta ?? respostaBona();
  });
}

function muntatge({ llegix = llegixFals(), finestra: base = {} } = {}) {
  const oients = [];
  const pont = {
    addListener: vi.fn((connector, nom, cb) => { oients.push(cb); return { remove: () => {} }; }),
    convertFileSrc: vi.fn(urlDe),
    nativePromise: vi.fn(async () => ({}))
  };
  const finestra = Object.assign(new EventTarget(), { Capacitor: pont, CustomEvent: globalThis.CustomEvent }, base);
  const avisos = [];
  finestra.addEventListener(ESDEVENIMENT_FINESTRA, (e) => avisos.push(e.detail));
  const receptor = creaReceptorCompartit({ finestra, llegix });
  const lliura = vi.fn();
  /* Com el natiu: crida el callback de l'esdeveniment retingut. */
  const comparteix = (dades, error) => oients.at(-1)(dades, error);
  return { pont, receptor, lliura, llegix, avisos, comparteix };
}

/* El llegix fals i l'allibera només fan microtasques: una volta de temporitzador ho buida tot. */
const buida = () => new Promise((resol) => { setTimeout(resol, 0); });
const promesaOberta = () => {
  let resol;
  const promesa = new Promise((r) => { resol = r; });
  return { promesa, resol };
};

describe('el pont', () => {
  test('fora de l’App (sense addListener o sense convertFileSrc) torna null', () => {
    expect(creaReceptorCompartit({ finestra: {} })).toBeNull();
    expect(creaReceptorCompartit({ finestra: null })).toBeNull();
    expect(creaReceptorCompartit({ finestra: { Capacitor: { addListener: () => {} } } })).toBeNull();
    expect(creaReceptorCompartit({ finestra: { Capacitor: { convertFileSrc: () => '' } } })).toBeNull();
    expect(creaReceptorCompartit({ finestra: { Capacitor: { addListener: 'no', convertFileSrc: () => '' } } })).toBeNull();
    // La finestra per defecte és globalThis, que ací no porta pont.
    expect(creaReceptorCompartit()).toBeNull();
  });

  test('escolta s’enganxa a CompartirNatiu/compartit; sense funció o si addListener llança, false', async () => {
    const { pont, receptor, lliura } = muntatge();
    await expect(receptor.escolta(lliura)).resolves.toBe(true);
    expect(pont.addListener).toHaveBeenCalledTimes(1);
    expect(pont.addListener).toHaveBeenCalledWith('CompartirNatiu', 'compartit', expect.any(Function));
    await expect(receptor.escolta('no')).resolves.toBe(false);
    expect(pont.addListener).toHaveBeenCalledTimes(1);
    pont.addListener.mockImplementationOnce(() => { throw new Error('sense connector'); });
    await expect(receptor.escolta(lliura)).resolves.toBe(false);
  });
});

describe('un lot', () => {
  /* Gauntlet 261026_1615 (Codex C1615-03/08) · La còpia nativa ja no s'allibera
     en llegir-la: viatja amb el lot (rutes) i l'allibera el registre quan
     s'envia o es descarta. Les URL de l'avís a la finestra continuen vàlides. */
  test('una captura arriba com a File net, amb la seua ruta, el text i els rebutjats; la còpia no s’allibera encara i s’avisa la finestra', async () => {
    const { pont, receptor, lliura, llegix, avisos, comparteix } = muntatge();
    await receptor.escolta(lliura);
    comparteix({ fitxers: [imatge('/data/x.png', { nom: 'cap/tura.png' })], text: '  Mira açò  ', assumpte: '', rebutjats: 1 });
    await buida();
    expect(lliura).toHaveBeenCalledTimes(1);
    const [[lot]] = lliura.mock.calls;
    expect(lot).toEqual({ fitxers: [expect.any(File)], rutes: ['/data/x.png'], text: 'Mira açò', rebutjats: 1 });
    const [fitxer] = lot.fitxers;
    expect(fitxer).toMatchObject({ name: 'cap_tura.png', type: 'image/png', size: PNG.length });
    expect(new Uint8Array(await fitxer.arrayBuffer())).toEqual(PNG);
    expect(pont.convertFileSrc).toHaveBeenCalledWith('/data/x.png');
    expect(llegix).toHaveBeenCalledWith(urlDe('/data/x.png'));
    // La còpia nativa bona continua al disc: cap allibera en llegir-la.
    expect(pont.nativePromise).not.toHaveBeenCalled();
    // L'allibera, quan cal, la crida el registre amb receptor.allibera.
    receptor.allibera(['/data/x.png']);
    await buida();
    expect(pont.nativePromise).toHaveBeenCalledWith('CompartirNatiu', 'allibera', { rutes: ['/data/x.png'] });
    expect(avisos).toEqual([{ imatgeUri: urlDe('/data/x.png'), imatgesUri: [urlDe('/data/x.png')], text: 'Mira açò', rebutjats: 1 }]);
  });

  test('el nom només es mostra: sense barres ni caràcters de control, 120 caràcters com a molt, i «captura» si no n’hi ha', async () => {
    const { receptor, lliura, comparteix } = muntatge();
    await receptor.escolta(lliura);
    comparteix({ fitxers: [
      imatge('/d/1.png', { nom: 'a\\b.png' }),
      imatge('/d/2.png', { nom: 'línia\nnova\u0007.png' }),
      imatge('/d/3.png', { nom: '   ' }),
      imatge('/d/4.png', { nom: undefined }),
      imatge('/d/5.png', { nom: 'x'.repeat(130) })
    ] });
    await buida();
    const [[lot]] = lliura.mock.calls;
    expect(lot.fitxers.map((f) => f.name)).toEqual(['a_b.png', 'línia_nova_.png', 'captura', 'captura', 'x'.repeat(120)]);
    expect(lot.rebutjats).toBe(0);
  });

  test('cada entrada dolenta compta com a rebutjada i la bona passa; només s’alliberen les rutes dolentes', async () => {
    const llegix = llegixFals({
      [urlDe('/data/404.png')]: { ok: false, status: 404 },
      [urlDe('/data/buit.png')]: { ok: true, status: 200, blob: async () => new Blob([]) },
      // Diu 7 bytes però en porta més de 20 MB.
      [urlDe('/data/menteix.png')]: { ok: true, status: 200, blob: async () => ({ size: MB_20 + 1 }) },
      [urlDe('/data/trenca.webp')]: new Error('xarxa')
    });
    const { pont, receptor, lliura, avisos, comparteix } = muntatge({ llegix });
    await receptor.escolta(lliura);
    comparteix({ fitxers: [
      imatge('/data/bo.png'),
      imatge('/data/doc.pdf', { mime: 'application/pdf' }),
      imatge('data/relatiu.png'),
      imatge('/data/gran.png', { mida: MB_20 + 1 }),
      imatge('/data/404.png'),
      imatge('/data/buit.png'),
      imatge('/data/menteix.png', { mime: 'image/jpeg' }),
      imatge('/data/trenca.webp', { mime: 'image/webp' }),
      null
    ], rebutjats: 2 });
    await buida();
    const [[lot]] = lliura.mock.calls;
    expect(lot.fitxers.map((f) => f.name)).toEqual(['bo.png']);
    expect(lot.rebutjats).toBe(2 + 8);
    // El format, la ruta relativa i la mida declarada es rebutgen sense llegir res.
    expect(llegix.mock.calls.map(([url]) => url)).toEqual(
      ['/data/bo.png', '/data/404.png', '/data/buit.png', '/data/menteix.png', '/data/trenca.webp'].map(urlDe)
    );
    expect(lot.rutes).toEqual(['/data/bo.png']);
    expect(pont.nativePromise).toHaveBeenCalledTimes(1);
    expect(pont.nativePromise.mock.calls[0][2].rutes).toEqual([
      '/data/doc.pdf', 'data/relatiu.png', '/data/gran.png', '/data/404.png', '/data/buit.png', '/data/menteix.png', '/data/trenca.webp'
    ]);
    expect(avisos).toEqual([{ imatgeUri: urlDe('/data/bo.png'), imatgesUri: [urlDe('/data/bo.png')], text: '', rebutjats: 10 }]);
  });

  test('més de 10 entrades: es llegixen les 10 primeres i la resta compta com a rebutjada', async () => {
    expect(MAX_FITXERS_COMPARTITS).toBe(10);
    const { receptor, lliura, llegix, comparteix } = muntatge();
    await receptor.escolta(lliura);
    const rutes = Array.from({ length: 12 }, (_, i) => `/data/${i}.png`);
    comparteix({ fitxers: rutes.map((ruta) => imatge(ruta)), rebutjats: 'brossa' });
    await buida();
    const [[lot]] = lliura.mock.calls;
    expect(lot.fitxers.map((f) => f.name)).toEqual(rutes.slice(0, 10).map((ruta) => ruta.split('/').pop()));
    expect(lot.rebutjats).toBe(2);
    expect(llegix).toHaveBeenCalledTimes(10);
    expect(llegix).not.toHaveBeenCalledWith(urlDe('/data/10.png'));
    // Les dos que passen del límit no arribaran mai al registre: fora la còpia.
    expect(lot.rutes).toEqual(rutes.slice(0, 10));
  });

  test.each([
    ['assumpte i text: s’ajunten', { assumpte: 'Receptes', text: 'La coca de llanda' }, 'Receptes\n\nLa coca de llanda'],
    ['el text ja comença per l’assumpte: només el text', { assumpte: 'Mira', text: 'Mira açò: https://exemple.org' }, 'Mira açò: https://exemple.org'],
    ['només assumpte', { assumpte: '  Només assumpte ', text: '   ' }, 'Només assumpte'],
    ['només text', { text: ' Només text ' }, 'Només text'],
    ['un assumpte que no és text no compta', { assumpte: 42, text: 'x' }, 'x']
  ])('%s', async (_, dades, esperat) => {
    const { pont, receptor, lliura, avisos, comparteix } = muntatge();
    await receptor.escolta(lliura);
    comparteix(dades);
    await buida();
    expect(lliura).toHaveBeenCalledWith({ fitxers: [], rutes: [], text: esperat, rebutjats: 0 });
    expect(avisos).toEqual([{ imatgeUri: null, imatgesUri: [], text: esperat, rebutjats: 0 }]);
    // Sense cap fitxer no hi ha res a alliberar.
    expect(pont.nativePromise).not.toHaveBeenCalled();
  });

  test('l’assumpte més el text no passen mai del màxim', async () => {
    const { receptor, lliura, comparteix } = muntatge();
    await receptor.escolta(lliura);
    comparteix({ assumpte: 'Assumpte', text: 'b'.repeat(MAX_TEXT_COMPARTIT + 50) });
    await buida();
    const [[{ text }]] = lliura.mock.calls;
    expect(text).toHaveLength(MAX_TEXT_COMPARTIT);
    expect(text.startsWith('Assumpte\n\nbbb')).toBe(true);
  });
});

describe('la cua i els casos estranys', () => {
  test('dos lots seguits es processen en ordre: el segon no es llig fins que acaba el primer', async () => {
    const primer = promesaOberta();
    const { pont, receptor, lliura, llegix, avisos, comparteix } = muntatge({ llegix: llegixFals({ [urlDe('/data/1.png')]: primer.promesa }) });
    await receptor.escolta(lliura);
    comparteix({ fitxers: [imatge('/data/1.png')], text: 'primer' });
    comparteix({ fitxers: [imatge('/data/2.png')], text: 'segon' });
    await buida();
    expect(lliura).not.toHaveBeenCalled();
    expect(llegix).toHaveBeenCalledTimes(1);
    primer.resol(respostaBona());
    await buida();
    expect(lliura.mock.calls.map(([lot]) => lot.text)).toEqual(['primer', 'segon']);
    expect(avisos.map((detall) => detall.text)).toEqual(['primer', 'segon']);
    expect(lliura.mock.calls.map(([lot]) => lot.rutes)).toEqual([['/data/1.png'], ['/data/2.png']]);
    expect(pont.nativePromise).not.toHaveBeenCalled();
  });

  test('un lliura que llança no talla la cua: el lot següent arriba igual', async () => {
    const { receptor, lliura, comparteix } = muntatge();
    lliura.mockImplementationOnce(() => { throw new Error('registre trencat'); });
    await receptor.escolta(lliura);
    comparteix({ text: 'u' });
    comparteix({ text: 'dos' });
    await buida();
    expect(lliura.mock.calls.map(([lot]) => lot.text)).toEqual(['u', 'dos']);
  });

  test('un callback amb error o sense dades no fa res, i el següent bo sí', async () => {
    const { pont, receptor, lliura, llegix, avisos, comparteix } = muntatge();
    await receptor.escolta(lliura);
    comparteix(null);
    comparteix(undefined);
    comparteix({ fitxers: [imatge('/data/x.png')], text: 'x' }, { message: 'error natiu' });
    await buida();
    expect(lliura).not.toHaveBeenCalled();
    expect(llegix).not.toHaveBeenCalled();
    expect(pont.nativePromise).not.toHaveBeenCalled();
    expect(avisos).toEqual([]);
    comparteix({ text: 'ara sí' });
    await buida();
    expect(lliura).toHaveBeenCalledWith({ fitxers: [], rutes: [], text: 'ara sí', rebutjats: 0 });
  });

  test('sense CustomEvent ni nativePromise, o amb un allibera que falla, el lot arriba igual', async () => {
    const sense = muntatge({ finestra: { CustomEvent: undefined } });
    delete sense.pont.nativePromise;
    await sense.receptor.escolta(sense.lliura);
    sense.comparteix({ fitxers: [imatge('/data/x.png')] });
    await buida();
    expect(sense.lliura).toHaveBeenCalledTimes(1);
    expect(sense.lliura.mock.calls[0][0].fitxers).toHaveLength(1);
    expect(sense.avisos).toEqual([]);

    // Sense nativePromise, alliberar no fa res ni llança.
    expect(() => sense.receptor.allibera(['/data/x.png'])).not.toThrow();

    const falla = muntatge();
    falla.pont.nativePromise.mockRejectedValueOnce(new Error('allibera'));
    await falla.receptor.escolta(falla.lliura);
    // Una entrada dolenta es llibera en llegir-la; si l'allibera falla, el lot arriba igual.
    falla.comparteix({ fitxers: [imatge('/data/x.png'), imatge('/data/doc.pdf', { mime: 'application/pdf' })] });
    await buida();
    expect(falla.lliura).toHaveBeenCalledTimes(1);
    expect(falla.pont.nativePromise).toHaveBeenCalledTimes(1);
  });
});
