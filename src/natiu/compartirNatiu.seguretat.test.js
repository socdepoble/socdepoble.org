// @vitest-environment node
/* Ordre del Mestre (261026, prompt 261026_1615, tasques 1 i 2) · El receptor
   del menú «Compartir» (compartirNatiu.js) amb un pont fals de Capacitor
   (addListener, convertFileSrc i nativePromise) i un llegix fals en lloc de
   fetch: cap fitxer ni connector de veres. La finestra és un EventTarget amb
   el CustomEvent del sistema, per escoltar «sdp:compartir_natiu» de debò. */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { ESDEVENIMENT_FINESTRA, creaReceptorCompartit } from './compartirNatiu.js';
import {
  MAX_FITXERS_COMPARTITS, MAX_TEXT_COMPARTIT, canviaSessioCompartit, compartitPendent, descartaCompartit,
  lliuraCompartit, registraAlliberadorCompartit, registraTalladorCompartit, sessioCompartit
} from '../config/compartirNatiu.js';

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

function muntatge({ llegix = llegixFals(), finestra: base = {}, sessio, registraTallador } = {}) {
  const oients = [];
  const pont = {
    addListener: vi.fn((connector, nom, cb) => { oients.push(cb); return { remove: () => {} }; }),
    convertFileSrc: vi.fn(urlDe),
    nativePromise: vi.fn(async () => ({}))
  };
  const finestra = Object.assign(new EventTarget(), { Capacitor: pont, CustomEvent: globalThis.CustomEvent }, base);
  const avisos = [];
  finestra.addEventListener(ESDEVENIMENT_FINESTRA, (e) => avisos.push(e.detail));
  const receptor = creaReceptorCompartit({ finestra, llegix, sessio, registraTallador });
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

/* Pla 261028_1526 (Bloc D, P1-31) · El receptor amb el registre de veres, com
   el connecta entrada.jsx: sessio = sessioCompartit, lliura = lliuraCompartit i
   l'alliberador del registre = receptor.allibera. Si la sessió canvia
   (canviaSessioCompartit, XatContext) mentre es llig, el lot no arriba a
   ningú: ni registre ni finestra, i s'alliberen totes les còpies. El «Descarta»
   del diàleg (descartaCompartit) no és cap canvi de sessió: el lot entra. */
describe('P1-31 · un canvi de sessió amb la lectura en vol', () => {
  afterEach(() => { descartaCompartit(); registraAlliberadorCompartit(null); registraTalladorCompartit(null); vi.unstubAllGlobals(); });
  const ambRegistre = (opcions = {}) => {
    const m = muntatge({ ...opcions, sessio: sessioCompartit });
    registraAlliberadorCompartit(m.receptor.allibera);
    m.lliura.mockImplementation(lliuraCompartit);
    return m;
  };
  /* Una entrada dolenta (sobrant), una de llegida, la que es llig i una per llegir. */
  const QUATRE = ['/data/doc.pdf', '/data/1.png', '/data/2.png', '/data/3.png'];
  const quatre = () => [imatge(QUATRE[0], { mime: 'application/pdf' }), ...QUATRE.slice(1).map((ruta) => imatge(ruta))];
  const enVol = (on, oberta) => (on === 'llegix'
    ? { [urlDe('/data/2.png')]: oberta.promesa }
    : { [urlDe('/data/2.png')]: { ok: true, status: 200, blob: () => oberta.promesa } });
  const resolDe = (on) => (on === 'llegix' ? respostaBona() : new Blob([PNG], { type: 'image/png' }));

  test.each(['llegix', 'blob'])('la sessió canvia mentre espera %s: ni lliura ni avís, i s’alliberen totes les rutes, també les ja llegides', async (on) => {
    const oberta = promesaOberta();
    const { pont, receptor, lliura, llegix, avisos, comparteix } = ambRegistre({ llegix: llegixFals(enVol(on, oberta)) });
    await receptor.escolta(lliura);
    comparteix({ fitxers: quatre(), text: 'la foto d’A' });
    await buida();
    expect(llegix.mock.calls.map(([url]) => url)).toEqual([urlDe('/data/1.png'), urlDe('/data/2.png')]);
    canviaSessioCompartit();
    oberta.resol(resolDe(on));
    await buida();
    expect(lliura).not.toHaveBeenCalled();
    expect(avisos).toEqual([]);
    expect(compartitPendent()).toBeNull();
    // La resta ni es llig.
    expect(llegix).toHaveBeenCalledTimes(2);
    expect(pont.nativePromise.mock.calls).toEqual([['CompartirNatiu', 'allibera', { rutes: QUATRE }]]);
  });

  test.each(['llegix', 'blob'])('el «Descarta» del diàleg mentre espera %s no caduca el lot nou: entra sencer i només s’alliberen el descartat i el sobrant', async (on) => {
    const oberta = promesaOberta();
    const { pont, receptor, lliura, avisos, comparteix } = ambRegistre({ llegix: llegixFals(enVol(on, oberta)) });
    await receptor.escolta(lliura);
    // El lot que la persona tenia davant i descarta.
    lliuraCompartit({ fitxers: [new File([PNG], 'vell.png', { type: 'image/png' })], rutes: ['/data/vell.png'] });
    const epoca = sessioCompartit();
    comparteix({ fitxers: quatre(), text: 'el nou' });
    await buida();
    descartaCompartit();
    oberta.resol(resolDe(on));
    await buida();
    expect(sessioCompartit()).toBe(epoca);
    expect(lliura).toHaveBeenCalledTimes(1);
    expect(lliura.mock.calls[0][0]).toMatchObject({ rutes: QUATRE.slice(1), text: 'el nou', rebutjats: 1, sessio: epoca });
    const lot = compartitPendent();
    expect(lot).toMatchObject({ text: 'el nou', rebutjats: 1, desti: null, propietari: null });
    expect(lot.fitxers.map((f) => f.name)).toEqual(['1.png', '2.png', '3.png']);
    expect(avisos).toHaveLength(1);
    expect(pont.nativePromise.mock.calls.map(([, , { rutes }]) => rutes)).toEqual([['/data/vell.png'], ['/data/doc.pdf']]);
  });

  test('un lot que esperava a la cua, també només de text, caduca sense llegir-se; el que arriba després del canvi entra', async () => {
    const oberta = promesaOberta();
    const { pont, receptor, lliura, llegix, avisos, comparteix } = ambRegistre({ llegix: llegixFals({ [urlDe('/data/1.png')]: oberta.promesa }) });
    await receptor.escolta(lliura);
    comparteix({ fitxers: [imatge('/data/1.png')], text: 'primer' });
    comparteix({ fitxers: [imatge('/data/2.png')], text: 'a la cua' });
    comparteix({ text: 'només text, a la cua' });
    await buida();
    canviaSessioCompartit();
    oberta.resol(respostaBona());
    await buida();
    expect(lliura).not.toHaveBeenCalled();
    expect(avisos).toEqual([]);
    expect(llegix).toHaveBeenCalledTimes(1);
    expect(pont.nativePromise.mock.calls.map(([, , { rutes }]) => rutes)).toEqual([['/data/1.png'], ['/data/2.png']]);

    // La persona nova comparteix: és de la seua sessió.
    comparteix({ fitxers: [imatge('/data/3.png')], text: 'de la sessió nova' });
    await buida();
    expect(lliura).toHaveBeenCalledTimes(1);
    expect(lliura.mock.calls[0][0]).toMatchObject({ rutes: ['/data/3.png'], sessio: sessioCompartit() });
    expect(compartitPendent()).toMatchObject({ text: 'de la sessió nova' });
    expect(avisos.map((detall) => detall.text)).toEqual(['de la sessió nova']);
  });

  test('l’hora de l’intent natiu (rebutMs) arriba al registre: d’abans del tall, el lot no entra, se n’alliberen les còpies i la finestra no el veu', async () => {
    const { pont, receptor, lliura, avisos, comparteix } = ambRegistre();
    await receptor.escolta(lliura);
    canviaSessioCompartit(5000);
    // Copiat al natiu en la sessió d'abans, anunciat (i llegit) després del canvi.
    comparteix({ fitxers: [imatge('/data/a.png')], text: 'd’A', rebutMs: 4000 });
    await buida();
    expect(lliura).toHaveBeenCalledTimes(1);
    expect(lliura.mock.calls[0][0]).toMatchObject({ rutes: ['/data/a.png'], rebutMs: 4000, sessio: sessioCompartit() });
    expect(lliura.mock.results[0].value).toBeNull();
    expect(compartitPendent()).toBeNull();
    expect(avisos).toEqual([]);
    expect(pont.nativePromise.mock.calls).toEqual([['CompartirNatiu', 'allibera', { rutes: ['/data/a.png'] }]]);

    comparteix({ fitxers: [imatge('/data/b.png')], text: 'de B', rebutMs: 6000 });
    await buida();
    expect(compartitPendent()).toMatchObject({ text: 'de B' });
    expect(avisos.map((detall) => detall.text)).toEqual(['de B']);
  });

  test('rebutMs només passa si és un número finit; sense getter de sessió, el lot no porta època', async () => {
    const { receptor, lliura, comparteix } = muntatge();
    await receptor.escolta(lliura);
    for (const rebutMs of [1234, '1234', null, Number.NaN, Number.POSITIVE_INFINITY, undefined]) comparteix({ text: 't', rebutMs });
    await buida();
    expect(lliura.mock.calls.map(([lot]) => lot.rebutMs)).toEqual([1234, undefined, undefined, undefined, undefined, undefined]);
    expect(lliura.mock.calls.every(([lot]) => lot.sessio === undefined)).toBe(true);
    // Un getter que no és funció compta com a cap.
    const sense = muntatge({ sessio: 'no és funció' });
    await sense.receptor.escolta(sense.lliura);
    sense.comparteix({ text: 'x' });
    await buida();
    expect(sense.lliura.mock.calls[0][0]).toMatchObject({ text: 'x' });
    expect(sense.lliura.mock.calls[0][0].sessio).toBeUndefined();
  });

  /* Revisió del Bloc D (mutants R2 i R3) · Després del canvi, res més del lot
     caducat: ni el cos (fins a 20 MB a la memòria) ni cap File. La comprovació
     de la volta següent i la del registre ja l'aturarien, però més tard. */
  test('si la sessió canvia mentre espera llegix, el cos (blob) ni es demana', async () => {
    const oberta = promesaOberta();
    const blob = vi.fn(async () => new Blob([PNG], { type: 'image/png' }));
    const { pont, receptor, lliura, comparteix } = ambRegistre({ llegix: llegixFals({ [urlDe('/data/2.png')]: oberta.promesa }) });
    await receptor.escolta(lliura);
    comparteix({ fitxers: [imatge('/data/1.png'), imatge('/data/2.png')] });
    await buida();
    canviaSessioCompartit();
    oberta.resol({ ok: true, status: 200, blob });
    await buida();
    expect(blob).not.toHaveBeenCalled();
    expect(lliura).not.toHaveBeenCalled();
    expect(pont.nativePromise.mock.calls).toEqual([['CompartirNatiu', 'allibera', { rutes: ['/data/1.png', '/data/2.png'] }]]);
  });

  test('si la sessió canvia mentre espera blob, no es fa cap File del lot caducat', async () => {
    let creats = 0;
    const Original = globalThis.File;
    vi.stubGlobal('File', class extends Original { constructor(...args) { super(...args); creats += 1; } });
    const oberta = promesaOberta();
    const { pont, receptor, lliura, comparteix } = ambRegistre({
      llegix: llegixFals({ [urlDe('/data/1.png')]: { ok: true, status: 200, blob: () => oberta.promesa } })
    });
    await receptor.escolta(lliura);
    comparteix({ fitxers: [imatge('/data/1.png')] });
    await buida();
    canviaSessioCompartit();
    oberta.resol(new Blob([PNG], { type: 'image/png' }));
    await buida();
    expect(creats).toBe(0);
    expect(lliura).not.toHaveBeenCalled();
    expect(pont.nativePromise.mock.calls).toEqual([['CompartirNatiu', 'allibera', { rutes: ['/data/1.png'] }]]);
  });

  /* El tall també arriba al natiu (CompartirNatiuPlugin.tallaSessio): hi esborra
     les còpies d'abans i talla la que encara es copiava. Com entrada.jsx: el
     receptor registra el seu tallaSessio al registre, i canviaSessioCompartit el crida. */
  test('el receptor registra tallaSessio i el canvi de sessió el demana al connector; el «Descarta» no', async () => {
    const { pont, receptor } = ambRegistre({ registraTallador: registraTalladorCompartit });
    lliuraCompartit({ text: 'el lot que la persona descarta' });
    descartaCompartit();
    await buida();
    expect(pont.nativePromise).not.toHaveBeenCalled();
    canviaSessioCompartit();
    await buida();
    expect(pont.nativePromise.mock.calls).toEqual([['CompartirNatiu', 'tallaSessio', {}]]);
    receptor.tallaSessio();
    await buida();
    expect(pont.nativePromise).toHaveBeenCalledTimes(2);
  });

  test('tallaSessio mai llança ni deixa cap rebuig sense amo: sense nativePromise, o si el connector no el té (iOS)', async () => {
    const senseAmo = vi.fn();
    process.on('unhandledRejection', senseAmo);
    try {
      /* Funcions nues, no vi.fn: el vi.fn s'enganxa a la promesa que torna i
         amagaria el rebuig sense capturar que vigila `senseAmo`. */
      const demanats = [];
      const falla = muntatge();
      falla.pont.nativePromise = (...args) => { demanats.push(args); return Promise.reject(new Error('UNIMPLEMENTED')); };
      expect(() => falla.receptor.tallaSessio()).not.toThrow();
      const llanca = muntatge();
      llanca.pont.nativePromise = () => { throw new Error('pont trencat'); };
      expect(() => llanca.receptor.tallaSessio()).not.toThrow();
      const sense = muntatge();
      delete sense.pont.nativePromise;
      expect(() => sense.receptor.tallaSessio()).not.toThrow();
      // Un registrador que llança no tomba el receptor.
      const trencat = muntatge({ registraTallador: () => { throw new Error('registre trencat'); } });
      expect(trencat.receptor).not.toBeNull();
      await buida();
      expect(demanats).toEqual([['CompartirNatiu', 'tallaSessio', {}]]);
      expect(senseAmo).not.toHaveBeenCalled();
      // Un registrador que no és funció no es crida.
      expect(muntatge({ registraTallador: 'no' }).receptor).not.toBeNull();
    } finally {
      process.off('unhandledRejection', senseAmo);
    }
  });
});
