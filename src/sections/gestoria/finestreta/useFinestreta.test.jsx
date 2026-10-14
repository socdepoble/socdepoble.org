/* Finestreta · useFinestreta. Ordre del Mestre, 13-10-2026 (pla 261013_1405,
   front H). La porta del tractor (amb el catàleg real del manifest i un
   autenticador WebAuthn simulat), el selector de la carpeta dins del clic, la
   taula sense cap byte, les marques (d'una en una i de colp, només dels
   'demanar' i sense llegir res), la lectura que fusiona propostes sense
   desar res, les decisions que desen NOMÉS perAlCofre(fitxa), la fitxa desada
   que es llig i no es trepitja si és invàlida, el bloqueig del cofre que ho
   buida tot i (Front 6) els papers de «D’on ix»: tornar-los a llegir amb
   l'empremta, la URL de l'entorn i la seua revocació, l'aprovació llegida de nou a cada comprovació i les carreres
   (cap URL si la carpeta s'oblida a mitja empremta). La persistència és un doble del cofre (persistenciaDelCofre té
   les seues proves a cofre/). Papers sintètics; el NIF es genera calculant-ne
   la lletra, cap s'escriu sencer. */
import { webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { creaAutenticadorSimulat } from '../../../../tests/helpers/autenticadorSimulat.js';
import { preparaRegistre } from '../../tractors/nucli/aprovacio.js';
import { crearMagatzemMemoria } from '../../tractors/nucli/magatzem.js';
import { construixTractor, empremtaDe } from '../../tractors/registreTractors.js';
import { TRACTOR_IDENTITAT } from '../tractors.js';
import { afegixTitular, entraAMa, fitxaBuida, llegixDelCofre, nouIdFitxa, perAlCofre } from './nucli/fitxaIdentitat.js';
import { ALIES_TITULARS, SENSE_CARPETA_PAPER, VIDA_PAPER_MS, clauConfianca, clauPaper, useFinestreta } from './useFinestreta.js';

const subtle = webcrypto.subtle;
const ARA = Date.UTC(2026, 9, 13, 14, 0, 0);
const rellotge = () => ARA;
const autenticador = await creaAutenticadorSimulat({ subtle });
/* El catàleg amb el tractor nou (TRACTORS_GESTORIA encara no el porta: l'hi afig la integració). */
const TEXTOS = new Map([...TRACTOR_IDENTITAT.fonts, TRACTOR_IDENTITAT.fitxa].map((ruta) => [ruta, readFileSync(path.join(process.cwd(), ruta), 'utf8')]));
const TRACTORS = Object.freeze([construixTractor(TRACTOR_IDENTITAT, TEXTOS)]);
const INFO = await empremtaDe(TRACTORS[0], subtle);
const entornTractors = { location: { origin: autenticador.origen, hostname: autenticador.rpId }, crypto: webcrypto };

const LLETRES = 'TRWAGMYFPDXBNJZSQVHLCKE';
const dni = (n) => `${String(n).padStart(8, '0')}${LLETRES[n % 23]}`;
const PERSONA = dni(27182818);
const VIDA_LABORAL = [
  'INFORME DE VIDA LABORAL',
  'TEXT SENTINELLA PRIVAT',
  'Nombre y apellidos: FERRANDO PUIG, ROSA',
  `D.N.I.: ${PERSONA}`,
  'Fecha de nacimiento: 15/03/1975'
].join('\n');
const RUTES = Object.freeze({
  vida: '01_Identitat_Legal/251003_vida_laboral.txt',
  opac: '01_Identitat_Legal/escanejat_0001.txt',
  opac2: '01_Identitat_Legal/escanejat_0002.txt',
  opacSuma: '03_Burocracia/SUMA/document_0007.txt',
  salut: '01_Identitat_Legal/informe_medico.txt',
  fora: '02_Facturacio/factura.pdf'
});
/* La carpeta amb els tres opacs (dos d'identitat i un de SUMA), el permés, el de salut i el de fora. */
const AMB_OPACS = Object.freeze(Object.fromEntries(
  [RUTES.vida, RUTES.opac, RUTES.opac2, RUTES.opacSuma, RUTES.salut, RUTES.fora].map((ruta) => [ruta, VIDA_LABORAL])
));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

async function magatzemAprovat() {
  const magatzem = crearMagatzemMemoria();
  await magatzem.afegixClau(autenticador.clau);
  await magatzem.afegixRegistre(await autenticador.signa({
    manifest: TRACTOR_IDENTITAT, empremta: INFO.empremta, ara: ARA - 60000, nonce: new Uint8Array(16).fill(5)
  }));
  return magatzem;
}

/* Els fitxers d'un <input webkitdirectory>: la ruta porta davant el nom de la carpeta triada. */
function fitxers(textos = { [RUTES.vida]: VIDA_LABORAL, [RUTES.opac]: VIDA_LABORAL, [RUTES.salut]: VIDA_LABORAL, [RUTES.fora]: VIDA_LABORAL }) {
  return Object.entries(textos).map(([ruta, text]) => {
    const bytes = new TextEncoder().encode(text);
    return { name: ruta.split('/').pop(), size: bytes.length, webkitRelativePath: `gestoria/${ruta}`, ruta, arrayBuffer: vi.fn(async () => bytes.slice().buffer) };
  });
}
const llegits = (llista) => llista.filter((f) => f.arrayBuffer.mock.calls.length).map((f) => f.ruta).sort();

/* Un handle de carpeta fals (File System Access): entries(), getDirectoryHandle i getFileHandle. */
function handleFals(arbre, nom = 'gestoria') {
  const lectures = [];
  const fitxer = (ruta) => ({
    kind: 'file', name: ruta.split('/').pop(),
    getFile: async () => ({
      size: arbre[ruta].length, lastModified: ARA,
      arrayBuffer: async () => {
        lectures.push(ruta);
        return new TextEncoder().encode(arbre[ruta]).buffer;
      }
    })
  });
  const carpeta = (prefix, nomCarpeta) => ({
    kind: 'directory', name: nomCarpeta,
    async *entries() {
      const fills = new Map();
      for (const ruta of Object.keys(arbre).filter((r) => r.startsWith(prefix))) {
        const [primer, ...resta] = ruta.slice(prefix.length).split('/');
        fills.set(primer, resta.length ? carpeta(`${prefix}${primer}/`, primer) : fitxer(ruta));
      }
      yield* fills.entries();
    },
    getDirectoryHandle: async (n) => carpeta(`${prefix}${n}/`, n),
    getFileHandle: async (n) => {
      if (!(`${prefix}${n}` in arbre)) throw Object.assign(new Error('absent'), { name: 'NotFoundError' });
      return fitxer(`${prefix}${n}`);
    }
  });
  return { handle: carpeta('', nom), lectures };
}

/* Un doble del cofre: desa còpies JSON i avisa els subscriptors com cofre.subscriu. */
function persistenciaDeProva(inicial = null) {
  let desat = inicial;
  const subscriptors = new Set();
  return {
    llig: vi.fn(async () => (desat === null ? null : JSON.parse(JSON.stringify(desat)))),
    desa: vi.fn(async (valor) => { desat = JSON.parse(JSON.stringify(valor)); }),
    subscriu: vi.fn((fn) => {
      subscriptors.add(fn);
      return () => subscriptors.delete(fn);
    }),
    avisa: (canvi) => subscriptors.forEach((fn) => fn(canvi)),
    desat: () => desat
  };
}

async function munta({ magatzem, persistencia, entorn = entornTractors, tractors = TRACTORS, subtle: s = subtle } = {}) {
  const propi = magatzem ?? await magatzemAprovat();
  const vista = renderHook(() => useFinestreta({ magatzem: propi, subtle: s, tractors, entorn, rellotge, persistencia }));
  await waitFor(() => expect(vista.result.current.porta.carregant).toBe(false), { timeout: 5000 });
  if (persistencia) await waitFor(() => expect(vista.result.current.fitxaLlegida).toBe(true));
  return vista;
}

async function llegix(result, llista = fitxers()) {
  await act(async () => { expect(await result.current.usaFitxers(llista)).toBe(true); });
  act(() => result.current.commutaMarcat(RUTES.opac));
  await act(async () => { expect(await result.current.llig()).toBe(true); });
  return llista;
}

describe('la porta del tractor', () => {
  test('sense l’aprovació, ni el selector ni els fitxers: cap pas comença', async () => {
    const entorn = { ...entornTractors, showDirectoryPicker: vi.fn() };
    const { result } = await munta({ magatzem: crearMagatzemMemoria(), entorn });
    expect(result.current.aprovat).toBe(false);
    expect(result.current.fila.estat).toBe('pendent');
    expect(result.current.potTriarCarpeta).toBe(true);
    await act(async () => { expect(await result.current.triaCarpeta()).toBe(false); });
    const llista = fitxers();
    await act(async () => { expect(await result.current.usaFitxers(llista)).toBe(false); });
    expect(entorn.showDirectoryPicker).not.toHaveBeenCalled();
    expect(result.current.pla).toBe(null);
    expect(llegits(llista)).toEqual([]);
  });

  test('sense el tractor al catàleg (abans que la integració l’hi afija), cap fila: no està aprovat', async () => {
    const { result } = await munta({ tractors: [] });
    expect(result.current.fila).toBe(null);
    expect(result.current.aprovat).toBe(false);
  });
});

describe('la carpeta i la taula «Què llegiré i què no»', () => {
  test('el selector s’obri dins del clic, abans de cap espera; la taula no llig cap byte', async () => {
    const { handle, lectures } = handleFals({ [RUTES.vida]: VIDA_LABORAL, [RUTES.salut]: VIDA_LABORAL });
    const entorn = { ...entornTractors, showDirectoryPicker: vi.fn(() => Promise.resolve(handle)) };
    const { result } = await munta({ entorn });
    await waitFor(() => expect(result.current.aprovat).toBe(true));
    let promesa;
    act(() => {
      promesa = result.current.triaCarpeta();
      /* Encara dins del gest: el selector ja s'ha demanat, sense haver esperat res. */
      expect(entorn.showDirectoryPicker).toHaveBeenCalledTimes(1);
    });
    await act(async () => { expect(await promesa).toBe(true); });
    expect(entorn.showDirectoryPicker).toHaveBeenCalledWith({ mode: 'read' });
    expect(result.current.nomCarpeta).toBe('gestoria');
    expect(result.current.pla.decisions.map((d) => [d.ruta, d.decisio])).toEqual([[RUTES.vida, 'llegir'], [RUTES.salut, 'ometre']]);
    expect(lectures).toEqual([]);
    /* I la lectura llig el permés, mai el vetat. */
    await act(async () => { expect(await result.current.llig()).toBe(true); });
    expect(lectures).toEqual([RUTES.vida]);
  });

  test('cancel·lar el selector no és cap error', async () => {
    const entorn = { ...entornTractors, showDirectoryPicker: vi.fn(() => Promise.reject(Object.assign(new Error('x'), { name: 'AbortError' }))) };
    const { result } = await munta({ entorn });
    await waitFor(() => expect(result.current.aprovat).toBe(true));
    await act(async () => { expect(await result.current.triaCarpeta()).toBe(false); });
    expect(result.current.error).toBe(null);
    expect(result.current.ocupat).toBe(null);
  });

  test('sense selector de carpetes, els fitxers de l’input: la taula, cap byte, i només els «demanar» es marquen', async () => {
    const { result } = await munta();
    expect(result.current.potTriarCarpeta).toBe(false);
    const llista = fitxers();
    await act(async () => { expect(await result.current.usaFitxers(llista)).toBe(true); });
    expect(llegits(llista)).toEqual([]);
    const decisions = Object.fromEntries(result.current.pla.decisions.map((d) => [d.ruta, d.decisio]));
    expect(decisions).toEqual({ [RUTES.vida]: 'llegir', [RUTES.opac]: 'demanar', [RUTES.salut]: 'ometre', [RUTES.fora]: 'ometre' });
    act(() => result.current.commutaMarcat(RUTES.salut));
    act(() => result.current.commutaMarcat(RUTES.vida));
    expect(result.current.marcats).toEqual([]);
    act(() => result.current.commutaMarcat(RUTES.opac));
    expect(result.current.marcats).toEqual([RUTES.opac]);
    act(() => result.current.commutaMarcat(RUTES.opac));
    expect(result.current.marcats).toEqual([]);
  });

  test('marcaTotsDemanar marca de colp només els «demanar», sense repetir-ne cap ni llegir res; desmarcaTotsDemanar ho buida', async () => {
    const { result } = await munta();
    const llista = fitxers(AMB_OPACS);
    await act(async () => { expect(await result.current.usaFitxers(llista)).toBe(true); });
    const decisions = Object.fromEntries(result.current.pla.decisions.map((d) => [d.ruta, d.decisio]));
    expect(decisions).toEqual({
      [RUTES.vida]: 'llegir', [RUTES.opac]: 'demanar', [RUTES.opac2]: 'demanar', [RUTES.opacSuma]: 'demanar',
      [RUTES.salut]: 'ometre', [RUTES.fora]: 'ometre'
    });
    /* Un ja marcat a mà: el bloc el conserva al davant i no el repetix. */
    act(() => result.current.commutaMarcat(RUTES.opac2));
    act(() => result.current.marcaTotsDemanar());
    expect(result.current.marcats[0]).toBe(RUTES.opac2);
    expect([...result.current.marcats].sort()).toEqual([RUTES.opac, RUTES.opac2, RUTES.opacSuma].sort());
    for (const ruta of [RUTES.vida, RUTES.salut, RUTES.fora]) expect(result.current.marcats, ruta).not.toContain(ruta);
    /* Idempotent: una segona crida torna el mateix estat. */
    const abans = result.current.marcats;
    act(() => result.current.marcaTotsDemanar());
    expect(result.current.marcats).toBe(abans);
    /* Marcar no és llegir. */
    expect(llegits(llista)).toEqual([]);
    act(() => result.current.desmarcaTotsDemanar());
    expect(result.current.marcats).toEqual([]);
    const buit = result.current.marcats;
    act(() => result.current.desmarcaTotsDemanar());
    expect(result.current.marcats).toBe(buit);
  });

  test('sense taula, marcar-los o desmarcar-los tots no fa res', async () => {
    const { result } = await munta();
    act(() => result.current.marcaTotsDemanar());
    act(() => result.current.desmarcaTotsDemanar());
    expect(result.current.pla).toBe(null);
    expect(result.current.marcats).toEqual([]);
  });

  test('mentre llig, les marques no canvien: ni en bloc ni d’una en una', async () => {
    const { result } = await munta();
    const llista = fitxers(AMB_OPACS);
    await act(async () => { expect(await result.current.usaFitxers(llista)).toBe(true); });
    act(() => result.current.commutaMarcat(RUTES.opac));
    let promesa;
    act(() => { promesa = result.current.llig(); });
    expect(result.current.ocupat).toBe('llegint');
    act(() => result.current.desmarcaTotsDemanar());
    act(() => result.current.marcaTotsDemanar());
    act(() => result.current.commutaMarcat(RUTES.opac2));
    expect(result.current.marcats).toEqual([RUTES.opac]);
    await act(async () => { expect(await promesa).toBe(true); });
    expect(llegits(llista)).toEqual([RUTES.vida, RUTES.opac].sort());
  });

  test('marcar-los tots i llegir: el permés i tots els opacs; el de salut i el de fora, mai', async () => {
    const { result } = await munta();
    const llista = fitxers(AMB_OPACS);
    await act(async () => { expect(await result.current.usaFitxers(llista)).toBe(true); });
    act(() => result.current.marcaTotsDemanar());
    await act(async () => { expect(await result.current.llig()).toBe(true); });
    const esperats = [RUTES.vida, RUTES.opac, RUTES.opac2, RUTES.opacSuma].sort();
    expect(llegits(llista)).toEqual(esperats);
    expect(result.current.lectura.llegits.map((l) => l.ruta).sort()).toEqual(esperats);
    const salut = llista.find((f) => f.ruta === RUTES.salut);
    expect(salut.arrayBuffer).not.toHaveBeenCalled();
  });
});

describe('la lectura i la fitxa', () => {
  test('llig el permés i el marcat, fusiona les propostes a un titular nou sense dades, i no desa res', async () => {
    const persistencia = persistenciaDeProva();
    const { result } = await munta({ persistencia });
    const generacio = result.current.generacio;
    const llista = await llegix(result);
    expect(llegits(llista)).toEqual([RUTES.vida, RUTES.opac].sort());
    const { fitxa } = result.current;
    expect(fitxa.titulars).toHaveLength(1);
    expect(fitxa.titulars[0]).toMatchObject({ tipus: 'persona', ambit: 'LLAR', alies: ALIES_TITULARS.LLAR });
    expect(fitxa.titulars[0].id).toMatch(/^tit_[a-p]{16}$/);
    const camps = fitxa.titulars[0].camps;
    expect(camps['identificacio.nom']).toMatchObject({ valor: 'ROSA', estat: 'proposat', confirmat: null });
    expect(camps['identificacio.nif'].fonts.map((f) => f.ruta).sort()).toEqual([RUTES.vida, RUTES.opac].sort());
    expect(result.current.confiances.get(clauConfianca('identificacio.nif', PERSONA))).toBe('alta');
    expect(result.current.lectura.llegits.map((l) => l.ruta).sort()).toEqual([RUTES.vida, RUTES.opac].sort());
    expect(result.current.generacio).not.toBe(generacio);
    expect(JSON.stringify(result.current.lectura)).not.toContain('SENTINELLA');
    expect(persistencia.desa).not.toHaveBeenCalled();
  });

  test('les decisions desen NOMÉS perAlCofre(fitxa); un rebuig que no canvia els confirmats no desa; un valor que no quadra no entra', async () => {
    const persistencia = persistenciaDeProva();
    const { result } = await munta({ persistencia });
    await llegix(result);
    const titular = result.current.fitxa.titulars[0].id;
    act(() => { expect(result.current.confirma({ titular, camp: 'identificacio.nom' })).toBe(null); });
    await waitFor(() => expect(persistencia.desa).toHaveBeenCalledTimes(1));
    const registre = persistencia.desa.mock.calls[0][0];
    expect(registre).toEqual(perAlCofre(result.current.fitxa));
    expect(Object.keys(registre.titulars[0].camps)).toEqual(['identificacio.nom']);
    expect(registre.titulars[0].camps['identificacio.nom']).toMatchObject({ valor: 'ROSA', estat: 'confirmat', alternatives: [] });
    expect(() => llegixDelCofre(registre)).not.toThrow();
    expect(JSON.stringify(registre)).not.toContain(PERSONA);

    act(() => { expect(result.current.rebutja({ titular, camp: 'identificacio.cognom2' })).toBe(null); });
    expect(result.current.fitxa.titulars[0].camps['identificacio.cognom2']).toBeUndefined();
    /* Un NIF en un camp de nom (la regressió Xylella) no entra, i res es desa. */
    let motiu;
    act(() => { motiu = result.current.entraAMa({ titular, camp: 'identificacio.cognom1', text: PERSONA }); });
    expect(motiu).toMatch(/identificador personal|forma vàlida/);
    expect(result.current.fitxa.titulars[0].camps['identificacio.cognom1'].estat).toBe('proposat');
    await act(async () => { await Promise.resolve(); });
    expect(persistencia.desa).toHaveBeenCalledTimes(1);

    act(() => { expect(result.current.entraAMa({ camp: 'contacte.correu', text: 'rosa@exemple.cat' })).toBe(null); });
    await waitFor(() => expect(persistencia.desa).toHaveBeenCalledTimes(2));
    expect(persistencia.desat().titulars[0].camps['contacte.correu']).toMatchObject({ estat: 'confirmat', fonts: [{ tipus: 'manual' }] });
  });

  test('un import entrat a mà es llig en euros i crea l’activitat de la persona', async () => {
    const persistencia = persistenciaDeProva();
    const { result } = await munta({ persistencia });
    act(() => { expect(result.current.entraAMa({ camp: 'seguretatSocial.baseCotitzacio', text: '1.234,56' })).toBe(null); });
    const [llar, activitat] = result.current.fitxa.titulars;
    expect(llar.ambit).toBe('LLAR');
    expect(activitat).toMatchObject({ ambit: 'ACTIVITAT', persona: llar.id, alies: ALIES_TITULARS.ACTIVITAT });
    expect(activitat.camps['seguretatSocial.baseCotitzacio']).toMatchObject({ valor: 123456, estat: 'confirmat' });
    let motiu;
    act(() => { motiu = result.current.entraAMa({ camp: 'seguretatSocial.baseCotitzacio', text: 'molts diners' }); });
    expect(motiu).toMatch(/import/);
    await waitFor(() => expect(persistencia.desa).toHaveBeenCalledTimes(1));
  });

  test('oblida: fora la carpeta, la taula i les propostes; els confirmats es queden', async () => {
    const { result } = await munta({ persistencia: persistenciaDeProva() });
    await llegix(result);
    const titular = result.current.fitxa.titulars[0].id;
    act(() => { result.current.confirma({ titular, camp: 'identificacio.nom' }); });
    act(() => result.current.oblida());
    expect(result.current.pla).toBe(null);
    expect(result.current.lectura).toBe(null);
    expect(result.current.teCarpeta).toBe(false);
    expect(result.current.confiances.size).toBe(0);
    expect(Object.keys(result.current.fitxa.titulars[0].camps)).toEqual(['identificacio.nom']);
    /* La carpeta s'ha desenxufat: no es pot tornar a llegir. */
    await act(async () => { expect(await result.current.llig()).toBe(false); });
  });
});

/* Front 6 (ordre del Mestre del 14-10-2026, pla 261013_1930: «Fitxa + obrir el PDF»): els papers de «D’on ix». L'URL
   i els temporitzadors de l'entorn són falsos: es veu quina URL es crea, quina es revoca i quan caduca. */
function entornAmbPapers() {
  let urls = 0;
  let temps = 0;
  const pendents = new Map();
  const url = { createObjectURL: vi.fn(() => `blob:paper-${++urls}`), revokeObjectURL: vi.fn() };
  const entorn = {
    ...entornTractors, URL: url,
    setTimeout: vi.fn((fn, ms) => {
      pendents.set(++temps, { fn, ms });
      return temps;
    }),
    clearTimeout: vi.fn((id) => { pendents.delete(id); })
  };
  return { entorn, url, pendents };
}
/* Un subtle que pot retindre l'empremta (digest) del pròxim paper llegit (el text de VIDA_LABORAL) fins que la prova
   l'allibera. Obri la finestra de la carrera: font.llig ja ha tornat els bytes i la Font, oblidada ara, no faria fallar
   res; només la guarda del hook (la carpeta d'abans de comprovar ha de ser la d'ara) impedix que naixca una URL. */
function subtleRetenible() {
  let retencio = null;
  const decodificador = new TextDecoder();
  const port = new Proxy(subtle, {
    get(target, key) {
      if (key !== 'digest') {
        const v = Reflect.get(target, key, target);
        return typeof v === 'function' ? v.bind(target) : v;
      }
      return (algorisme, dades) => {
        if (!retencio || retencio.agafada || decodificador.decode(dades) !== VIDA_LABORAL) return target.digest(algorisme, dades);
        const meua = retencio;
        meua.agafada = true;
        meua.arriba();
        return meua.solta.then(() => target.digest(algorisme, dades));
      };
    }
  });
  /* Arma la retenció (una sola): `arribada` es complix quan el digest hi arriba, i `allibera` el deixa continuar. */
  const reten = () => {
    let arriba;
    let allibera;
    const arribada = new Promise((resol) => { arriba = resol; });
    const solta = new Promise((resol) => { allibera = resol; });
    retencio = { agafada: false, arriba, solta };
    return { arribada, allibera };
  };
  return { port, reten };
}
/* La font d'un paper llegit, tal com la porta la proposta del NIF. */
const fontDelPaper = (result, ruta = RUTES.vida) => result.current.fitxa.titulars[0].camps['identificacio.nif'].fonts.find((f) => f.ruta === ruta);
async function preparat(result, fontDoc) {
  let resultat;
  await act(async () => { resultat = await result.current.preparaPaper(fontDoc); });
  return resultat;
}

describe('els papers de «D’on ix»: comprovar-los i preparar-los per a obrir', () => {
  test('sense carpeta, cap; amb la carpeta viva, el torna a llegir, en comprova l’empremta i fa la URL amb l’URL de l’entorn', async () => {
    const { entorn, url } = entornAmbPapers();
    const { result } = await munta({ entorn });
    expect(result.current.potObrirPaper).toBe(false);
    expect(await preparat(result, { tipus: 'document', ruta: RUTES.vida, sha256: 'ab'.repeat(32) }))
      .toEqual({ motiu: SENSE_CARPETA_PAPER, codi: 'SENSE_CARPETA' });

    const llista = await llegix(result);
    expect(result.current.potObrirPaper).toBe(true);
    const fontDoc = fontDelPaper(result);
    const vida = llista.find((f) => f.ruta === RUTES.vida);
    expect(vida.arrayBuffer).toHaveBeenCalledTimes(1);
    expect(await preparat(result, fontDoc)).toEqual({ url: 'blob:paper-1' });
    /* S'ha tornat a llegir, amb el MIME fix i els bytes sencers. */
    expect(vida.arrayBuffer).toHaveBeenCalledTimes(2);
    expect(url.createObjectURL).toHaveBeenCalledTimes(1);
    const [blob] = url.createObjectURL.mock.calls[0];
    expect(blob.type).toBe('text/plain;charset=utf-8');
    expect(blob.size).toBe(new TextEncoder().encode(VIDA_LABORAL).length);
    expect(result.current.papersComprovats.get(clauPaper(fontDoc))).toBe('blob:paper-1');
    /* Una font que no és un paper, cap. */
    expect(await preparat(result, { tipus: 'manual' })).toMatchObject({ codi: 'PARAMETRES_INVALIDS' });
    expect(url.createObjectURL).toHaveBeenCalledTimes(1);
  });

  test('cada URL viu 120 s com a molt; una segona comprovació del mateix paper revoca la d’abans', async () => {
    const { entorn, url, pendents } = entornAmbPapers();
    const { result } = await munta({ entorn });
    await llegix(result);
    const fontDoc = fontDelPaper(result);
    await preparat(result, fontDoc);
    expect(entorn.setTimeout).toHaveBeenCalledWith(expect.any(Function), VIDA_PAPER_MS);
    expect(VIDA_PAPER_MS).toBe(120000);
    expect(await preparat(result, fontDoc)).toEqual({ url: 'blob:paper-2' });
    expect(url.revokeObjectURL).toHaveBeenCalledWith('blob:paper-1');
    expect(entorn.clearTimeout).toHaveBeenCalledWith(1);
    expect(result.current.papersComprovats.get(clauPaper(fontDoc))).toBe('blob:paper-2');
    /* Passen els 120 s: la URL es revoca i el paper ja no es pot obrir sense tornar-lo a comprovar. */
    expect([...pendents.values()].map((p) => p.ms)).toEqual([VIDA_PAPER_MS]);
    act(() => [...pendents.values()][0].fn());
    expect(url.revokeObjectURL).toHaveBeenLastCalledWith('blob:paper-2');
    expect(result.current.papersComprovats.size).toBe(0);
  });

  test('«Oblida» revoca totes les URL, n’atura els temporitzadors i potObrirPaper torna a ser fals', async () => {
    const { entorn, url, pendents } = entornAmbPapers();
    const { result } = await munta({ entorn });
    await llegix(result);
    await preparat(result, fontDelPaper(result));
    await preparat(result, fontDelPaper(result, RUTES.opac));
    expect(result.current.papersComprovats.size).toBe(2);
    act(() => result.current.oblida());
    expect(url.revokeObjectURL.mock.calls.map(([revocada]) => revocada).sort()).toEqual(['blob:paper-1', 'blob:paper-2']);
    expect(pendents.size).toBe(0);
    expect(result.current.papersComprovats.size).toBe(0);
    expect(result.current.potObrirPaper).toBe(false);
  });

  test('el bloqueig del cofre revoca les URL', async () => {
    const { entorn, url } = entornAmbPapers();
    const persistencia = persistenciaDeProva();
    const { result } = await munta({ entorn, persistencia });
    await llegix(result);
    await preparat(result, fontDelPaper(result));
    act(() => persistencia.avisa({ estat: 'bloquejat', motiu: 'inactivitat' }));
    expect(url.revokeObjectURL).toHaveBeenCalledWith('blob:paper-1');
    expect(result.current.papersComprovats.size).toBe(0);
    expect(result.current.potObrirPaper).toBe(false);
  });

  test('el desmuntatge revoca les URL', async () => {
    const { entorn, url, pendents } = entornAmbPapers();
    const { result, unmount } = await munta({ entorn });
    await llegix(result);
    await preparat(result, fontDelPaper(result));
    unmount();
    expect(url.revokeObjectURL).toHaveBeenCalledWith('blob:paper-1');
    expect(pendents.size).toBe(0);
  });

  test('un paper que ha canviat: PAPER_CANVIAT, cap URL', async () => {
    const { entorn, url } = entornAmbPapers();
    const { result } = await munta({ entorn });
    const llista = await llegix(result);
    const vida = llista.find((f) => f.ruta === RUTES.vida);
    vida.arrayBuffer.mockImplementation(async () => new TextEncoder().encode(`${VIDA_LABORAL}\nUna línia de més`).buffer);
    expect(await preparat(result, fontDelPaper(result))).toEqual({
      motiu: 'Este paper no és el que es va llegir: ha canviat o és d’una altra carpeta.', codi: 'PAPER_CANVIAT'
    });
    expect(url.createObjectURL).not.toHaveBeenCalled();
    expect(result.current.papersComprovats.size).toBe(0);
  });

  /* Revisió del 14-10-2026: «Obri’l» no ha d'obrir mai els bytes d'una carpeta desenxufada ni d'un paper que ja no
     passa la comprovació. */
  test('una carpeta nova revoca les URL dels papers comprovats de l’anterior', async () => {
    const { entorn, url, pendents } = entornAmbPapers();
    const { result } = await munta({ entorn });
    await llegix(result);
    expect(await preparat(result, fontDelPaper(result))).toEqual({ url: 'blob:paper-1' });
    expect(pendents.size).toBe(1);
    await act(async () => { expect(await result.current.usaFitxers(fitxers())).toBe(true); });
    expect(url.revokeObjectURL).toHaveBeenCalledWith('blob:paper-1');
    expect(pendents.size).toBe(0);
    expect(result.current.papersComprovats.size).toBe(0);
  });

  test('una comprovació que falla revoca la URL d’abans del mateix paper', async () => {
    const { entorn, url, pendents } = entornAmbPapers();
    const { result } = await munta({ entorn });
    const llista = await llegix(result);
    const fontDoc = fontDelPaper(result);
    expect(await preparat(result, fontDoc)).toEqual({ url: 'blob:paper-1' });
    const vida = llista.find((f) => f.ruta === RUTES.vida);
    vida.arrayBuffer.mockImplementation(async () => new TextEncoder().encode(`${VIDA_LABORAL}\nUna línia de més`).buffer);
    expect(await preparat(result, fontDoc)).toMatchObject({ codi: 'PAPER_CANVIAT' });
    expect(url.revokeObjectURL).toHaveBeenCalledWith('blob:paper-1');
    expect(url.createObjectURL).toHaveBeenCalledTimes(1);
    expect(pendents.size).toBe(0);
    expect(result.current.papersComprovats.has(clauPaper(fontDoc))).toBe(false);
  });

  /* Les carreres (revisió del 14-10-2026): el paper ja s'ha tornat a llegir i se n'està calculant l'empremta quan la
     carpeta s'oblida. Res falla dins del tractor; és la guarda del hook la que no deixa nàixer cap URL, cap temporitzador
     ni cap entrada a papersComprovats, que després del bloqueig o d'«Oblida» viuria fins a 120 s. */
  test.each([
    ['el bloqueig del cofre', ({ persistencia }) => act(() => persistencia.avisa({ estat: 'bloquejat', motiu: 'inactivitat' }))],
    ['«Oblida»', ({ result }) => act(() => result.current.oblida())],
    ['el desmuntatge', ({ unmount }) => unmount()]
  ])('%s a mitja comprovació (relectura feta, empremta en curs): cap URL naix després (FONT_OBLIDADA)', async (_cas, interromp) => {
    const { entorn, url, pendents } = entornAmbPapers();
    const { port, reten } = subtleRetenible();
    const persistencia = persistenciaDeProva();
    const vista = await munta({ entorn, persistencia, subtle: port });
    const { result } = vista;
    const llista = await llegix(result);
    const vida = llista.find((f) => f.ruta === RUTES.vida);
    const fontDoc = fontDelPaper(result);
    const retencio = reten();
    let comprovacio;
    await act(async () => {
      comprovacio = result.current.preparaPaper(fontDoc);
      await retencio.arribada;
    });
    /* La finestra: els bytes ja han tornat (la segona lectura del paper) i l'empremta espera. */
    expect(vida.arrayBuffer).toHaveBeenCalledTimes(2);
    interromp({ ...vista, persistencia });
    let resultat;
    await act(async () => {
      retencio.allibera();
      resultat = await comprovacio;
    });
    expect(resultat).toEqual({ motiu: 'La carpeta ha canviat mentre es comprovava el paper: torna-ho a provar.', codi: 'FONT_OBLIDADA' });
    expect(url.createObjectURL).not.toHaveBeenCalled();
    expect(entorn.setTimeout).not.toHaveBeenCalled();
    expect(pendents.size).toBe(0);
    expect(result.current.papersComprovats.size).toBe(0);
  });

  test('mentre es llig la carpeta, «Comprova el paper» no torna a llegir res (OCUPAT) i potObrirPaper és fals', async () => {
    const { entorn, url } = entornAmbPapers();
    const { port, reten } = subtleRetenible();
    const { result } = await munta({ entorn, subtle: port });
    const llista = await llegix(result);
    const fontDoc = fontDelPaper(result);
    /* Una segona lectura, aturada en l'empremta del primer paper. */
    const retencio = reten();
    let lectura;
    await act(async () => {
      lectura = result.current.llig();
      await retencio.arribada;
    });
    expect(result.current.ocupat).toBe('llegint');
    expect(result.current.potObrirPaper).toBe(false);
    const abans = llista.map((f) => f.arrayBuffer.mock.calls.length);
    const resultat = await preparat(result, fontDoc);
    expect(resultat).toMatchObject({ codi: 'OCUPAT' });
    expect(resultat.motiu).not.toContain(RUTES.vida);
    expect(llista.map((f) => f.arrayBuffer.mock.calls.length)).toEqual(abans);
    expect(url.createObjectURL).not.toHaveBeenCalled();
    await act(async () => {
      retencio.allibera();
      expect(await lectura).toBe(true);
    });
    expect(result.current.potObrirPaper).toBe(true);
  });

  test('l’aprovació es torna a llegir en cada comprovació: revocada després de la lectura, ni relectura ni URL', async () => {
    const { entorn, url } = entornAmbPapers();
    const magatzem = await magatzemAprovat();
    const { result } = await munta({ entorn, magatzem });
    const llista = await llegix(result);
    const vida = llista.find((f) => f.ruta === RUTES.vida);
    await magatzem.afegixRegistre(preparaRegistre({
      manifest: TRACTOR_IDENTITAT, empremta: INFO.empremta, decisio: 'revocat', nivell: 'confirmacio', ara: ARA - 1000, nonce: new Uint8Array(16).fill(9)
    }));
    /* La porta de la vista no s'ha tornat a carregar i el creu aprovat: la comprovació no se'n fia. */
    expect(result.current.aprovat).toBe(true);
    expect(result.current.potObrirPaper).toBe(true);
    const resultat = await preparat(result, fontDelPaper(result));
    expect(resultat).toMatchObject({ codi: 'APROVACIO_REVOCADA' });
    expect(resultat.motiu).not.toContain(RUTES.vida);
    expect(vida.arrayBuffer).toHaveBeenCalledTimes(1);
    expect(url.createObjectURL).not.toHaveBeenCalled();
    expect(result.current.papersComprovats.size).toBe(0);
  });
});

describe('el cofre', () => {
  function fitxaDesada() {
    const id = nouIdFitxa('tit', new Uint8Array(8).fill(3));
    const ara = new Date(ARA).toISOString();
    const amb = afegixTitular(fitxaBuida(), { id, tipus: 'persona', ambit: 'LLAR', alies: 'Persona titular' }, { ara });
    return perAlCofre(entraAMa(amb, { titular: id, camp: 'identificacio.nom', valor: 'Rosa' }, { ara }));
  }

  test('la fitxa desada es llig en obrir: només els confirmats', async () => {
    const desada = fitxaDesada();
    const { result } = await munta({ persistencia: persistenciaDeProva(desada) });
    expect(result.current.fitxa).toEqual(desada);
    expect(result.current.errorPersistencia).toBe(null);
  });

  test('un registre que no és una fitxa vàlida no es mostra ni es trepitja mai', async () => {
    const persistencia = persistenciaDeProva({ schema: 'una-altra-cosa', titulars: [{ alies: 'x' }] });
    const { result } = await munta({ persistencia });
    expect(result.current.desaBlocat).toBe(true);
    expect(result.current.errorPersistencia).toMatch(/no és una fitxa d’identitat vàlida/);
    expect(result.current.fitxa.titulars).toEqual([]);
    act(() => { expect(result.current.entraAMa({ camp: 'contacte.correu', text: 'rosa@exemple.cat' })).toBe(null); });
    await act(async () => { await Promise.resolve(); });
    expect(persistencia.desa).not.toHaveBeenCalled();
    expect(persistencia.desat().schema).toBe('una-altra-cosa');
  });

  test('el bloqueig ho buida tot (la fitxa, les propostes, la taula, la lectura i la carpeta); l’obertura torna a llegir la fitxa', async () => {
    const desada = fitxaDesada();
    const persistencia = persistenciaDeProva(desada);
    const { result } = await munta({ persistencia });
    await llegix(result);
    expect(result.current.fitxa.titulars[0].camps['identificacio.cognom1'].estat).toBe('proposat');

    act(() => persistencia.avisa({ estat: 'bloquejat', motiu: 'inactivitat' }));
    expect(result.current.persistenciaBloquejada).toBe(true);
    expect(result.current.fitxaLlegida).toBe(false);
    expect(result.current.fitxa.titulars).toEqual([]);
    expect(result.current.pla).toBe(null);
    expect(result.current.lectura).toBe(null);
    expect(result.current.teCarpeta).toBe(false);
    expect(result.current.confiances.size).toBe(0);
    await act(async () => { expect(await result.current.llig()).toBe(false); });
    await act(async () => { expect(await result.current.usaFitxers(fitxers())).toBe(false); });
    let motiu;
    act(() => { motiu = result.current.confirma({ titular: desada.titulars[0].id, camp: 'identificacio.nom' }); });
    expect(motiu).toMatch(/obri el cofre/);

    act(() => persistencia.avisa({ estat: 'obert', motiu: 'obert' }));
    await waitFor(() => expect(result.current.fitxaLlegida).toBe(true));
    expect(result.current.fitxa).toEqual(desada);
    expect(result.current.pla).toBe(null);
    expect(persistencia.desa).not.toHaveBeenCalled();
  });
});
