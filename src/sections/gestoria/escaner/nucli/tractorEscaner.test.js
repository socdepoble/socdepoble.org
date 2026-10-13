// @vitest-environment node
/* Gestoria · Escàner Local · el tractor 'gestoria.escaner' (ordre del Mestre,
   13-10-2026, pla 261013_1405, front D): fail-closed (cap fitxer es llista ni
   es llig sense l'aprovació vigent del seu manifest), què llig (la llista
   sencera, l'empremta dels que comparteixen mida i el cap dels extractes
   llegibles; mai la identitat, l'arxiu ni les credencials), la cancel·lació,
   la Font oblidada i les limitacions. Un autenticador WebAuthn simulat signa
   de veres i la porta ho verifica. Arbres i extractes SINTÈTICS fets ací:
   cap nom ni valor real (entitat 9999 de prova). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test, vi } from 'vitest';
import { creaAutenticadorSimulat } from '../../../../../tests/helpers/autenticadorSimulat.js';
import { ErrorAprovacio, preparaRegistre } from '../../../tractors/nucli/aprovacio.js';
import { construixTractor, empremtaDe, textosPerRuta } from '../../../tractors/registreTractors.js';
import { fontDesDeFitxers, oblidaFont } from '../../font/fontNavegador.js';
import { ErrorTractor } from '../../nucli/tractor.js';
import {
  NUCLI_ESCANER, TRACTORS_GESTORIA, TRACTOR_CORREUS, TRACTOR_ESCANER, TRACTOR_FACTURES, TRACTOR_HISTORIC, TRACTOR_TAULER, UI_ESCANER
} from '../../tractors.js';
import { formatDelCap } from './escaner.js';
import { CODIS_TRACTOR_ESCANER, ErrorEscaner, FASES_ESCANER, LIMITS_ESCANER, executaTractorEscaner } from './tractorEscaner.js';

/* El cap de cada extracte passa per formatDelCap de veres; l'espia només apunta quin text rep. */
vi.mock('./escaner.js', async (importOriginal) => {
  const real = await importOriginal();
  return { ...real, formatDelCap: vi.fn(real.formatDelCap) };
});

const ARA = Date.UTC(2026, 9, 13, 8, 0, 0);
const DIA = 86400000;
const AVUI = { a: 2026, m: 10, d: 13 };
const EMPREMTA = `sha256:${'ab'.repeat(32)}`;
const ALTRA_EMPREMTA = `sha256:${'cd'.repeat(32)}`;
const MODIFICAT = 1760000000000;

const autenticador = await creaAutenticadorSimulat();
const MANIFEST_ALTERAT = Object.freeze({ ...TRACTOR_ESCANER, descripcio: 'Una altra descripció.' });
const SIGNATS = new Map(await Promise.all([TRACTOR_ESCANER, TRACTOR_TAULER, MANIFEST_ALTERAT].map(async (manifest, i) => [
  manifest, await autenticador.signa({ manifest, empremta: EMPREMTA, ara: ARA - 60000, nonce: new Uint8Array(16).fill(i + 40) })
])));

function aprovacioDe(manifest, { empremta = EMPREMTA, registres, ara = ARA } = {}) {
  return {
    manifest, empremta, registres: registres ?? [SIGNATS.get(manifest)], claus: autenticador.claus,
    origen: autenticador.origen, rpId: autenticador.rpId, ara
  };
}
const APROVACIO = aprovacioDe(TRACTOR_ESCANER);
const errorDe = (promesa) => promesa.then(() => null, (error) => error);

/* ── Extractes sintètics (les posicions de nucli/c43.js) ─────────────────── */
const xifres = (n, llargaria) => String(n).padStart(llargaria, '0');
const text = (valor, llargaria) => String(valor).padEnd(llargaria, ' ').slice(0, llargaria);
const N43 = [
  `119999000100000043212606012606302${xifres(100000, 14)}9783${text('TITULAR SINTETIC', 26)}${text('', 3)}`,
  `22${text('', 4)}000126061026061099000${'1'}${xifres(2500, 14)}${xifres(0, 10)}${text('', 12)}${text('', 16)}`,
  `3399990001000000432100001${xifres(2500, 14)}00000${xifres(0, 14)}2${xifres(97500, 14)}978${text('', 4)}`,
  `88${'9'.repeat(18)}${xifres(3, 6)}${text('', 54)}`
].join('\r\n');
const CSV_TAULER = [
  'Fecha,F. valor,Concepto,Importe,Saldo',
  '2026-06-10,2026-06-10,COMPRA PROVA,-25.00,975.00',
  '2026-06-11,2026-06-11,ALTRA PROVA,-5.00,970.00'
].join('\n');

const F = '02_Facturacio';
const B = `${F}/2026_Bancs`;
/* L'arbre: dues factures iguals en dos trimestres (empremta), i al costat fitxers de la mateixa mida que
   mai es lligen (la identitat, l'arxiu i una credencial), un full del banc, una factura de mida única i un ocult. */
const ARBRE = Object.freeze({
  [`${B}/moviments_compte.n43`]: N43,
  [`${B}/bancpoble.csv`]: CSV_TAULER,
  [`${B}/moviments_export.xls`]: 'FULL-DE-CALCUL-PROVA',
  [`${F}/2025_4T/2025-4T-llibre_exemple.pdf`]: 'PDF-PROVA-A',
  [`${F}/2026_1T/2025-4T-llibre_exemple.pdf`]: 'PDF-PROVA-A',
  [`${F}/2026_3T/proveidor_alfa.pdf`]: 'PDF-UNIC',
  '01_Identitat_Legal/Persona/document_escanejat.pdf': 'PDF-PROVA-B',
  '90_Arxiu_Historic/Banc_Historic/extracte_2019.pdf': 'PDF-PROVA-C',
  '90_Arxiu_Historic/certificat_antic.pfx': 'PDF-PROVA-D',
  '.DS_Store': 'x'
});
const LLEGITS_ESPERATS = [
  `${F}/2025_4T/2025-4T-llibre_exemple.pdf`, `${F}/2026_1T/2025-4T-llibre_exemple.pdf`, `${B}/bancpoble.csv`, `${B}/moviments_compte.n43`
];

const bytesDe = (contingut) => (typeof contingut === 'string' ? new TextEncoder().encode(contingut) : contingut);

/* Una Font de prova: el contracte de font/fontNavegador.js, amb els fitxers que es demanen apuntats. */
function fontDe(fitxers, { nom = 'Gestoria_Prova', limitacions = [], llig } = {}) {
  const continguts = new Map(Object.entries(fitxers).map(([ruta, c]) => [ruta, bytesDe(c)]));
  const llegits = [];
  return {
    nom,
    limitacions,
    llegits,
    llista: vi.fn(async () => [...continguts].map(([ruta, b]) => ({ ruta, mida: b.length, modificat: MODIFICAT }))),
    llig: vi.fn(llig ?? (async (ruta) => {
      llegits.push(ruta);
      if (!continguts.has(ruta)) throw new ErrorTractor('FITXER_ILLEGIBLE', 'No és entre els triats.');
      return continguts.get(ruta).slice();
    })),
    escriu: vi.fn()
  };
}

function pendent() {
  let resol;
  const promesa = new Promise((si) => { resol = si; });
  return { promesa, resol };
}

describe('fail-closed: sense l’aprovació del seu manifest, cap fitxer es llista ni es llig', () => {
  const revocada = [
    SIGNATS.get(TRACTOR_ESCANER),
    preparaRegistre({ manifest: TRACTOR_ESCANER, empremta: EMPREMTA, decisio: 'revocat', nivell: 'confirmacio', ara: ARA - 1000, nonce: new Uint8Array(16).fill(9) })
  ];
  test.each([
    ['sense cap registre', aprovacioDe(TRACTOR_ESCANER, { registres: [] }), 'APROVACIO_REQUERIDA'],
    ['amb l’aprovació del tractor del Tauler', aprovacioDe(TRACTOR_TAULER), 'APROVACIO_REQUERIDA'],
    ['amb l’empremta divergent', aprovacioDe(TRACTOR_ESCANER, { empremta: ALTRA_EMPREMTA }), 'EMPREMTA_DIVERGENT'],
    ['amb un manifest alterat', aprovacioDe(MANIFEST_ALTERAT), 'EMPREMTA_DIVERGENT'],
    ['amb l’aprovació revocada', aprovacioDe(TRACTOR_ESCANER, { registres: revocada }), 'APROVACIO_REVOCADA'],
    ['amb l’aprovació caducada', aprovacioDe(TRACTOR_ESCANER, { ara: ARA + 91 * DIA }), 'APROVACIO_CADUCADA'],
    ['amb una signatura de cap clau registrada', { ...aprovacioDe(TRACTOR_ESCANER), claus: [] }, 'SIGNATURA_INVALIDA'],
    ['sense aprovació', undefined, 'APROVACIO_REQUERIDA']
  ])('%s: ErrorAprovacio, i ni llista ni llig', async (_cas, aprovacio, codi) => {
    const font = fontDe(ARBRE);
    const error = await errorDe(executaTractorEscaner({ font, aprovacio, avui: AVUI }));
    expect(error).toBeInstanceOf(ErrorAprovacio);
    expect(error.codi).toBe(codi);
    expect(font.llista).not.toHaveBeenCalled();
    expect(font.llig).not.toHaveBeenCalled();
  });
});

describe('el manifest i les fonts', () => {
  test('dades personals, signatura, cap xarxa, no escriu res, i fonts congelades, ordenades i sense repetits', () => {
    expect(TRACTOR_ESCANER).toMatchObject({
      schema: 'sdp.tractor.v1', id: 'gestoria.escaner', versio: '1.0.0', dadesPersonals: true, nivellMinim: 'signatura', xarxa: 'cap',
      escriu: ['Res'], fitxa: 'src/sections/gestoria/fitxes/gestoria_escaner.md', caducitatDies: 90
    });
    expect(Object.isFrozen(TRACTOR_ESCANER) && Object.isFrozen(TRACTOR_ESCANER.fonts) && Object.isFrozen(TRACTOR_ESCANER.llig)).toBe(true);
    expect(Object.isFrozen(UI_ESCANER) && Object.isFrozen(NUCLI_ESCANER)).toBe(true);
    expect([...TRACTOR_ESCANER.fonts]).toEqual([...TRACTOR_ESCANER.fonts].sort());
    expect(new Set(TRACTOR_ESCANER.fonts).size).toBe(TRACTOR_ESCANER.fonts.length);
    expect(TRACTOR_ESCANER.llig.join(' ')).toMatch(/4 kB/);
  });

  test('cap font nova de l’Escàner (escaner/, documents/) és font dels altres quatre: les seues empremptes no canvien', () => {
    const nous = (ruta) => ruta.startsWith('src/sections/gestoria/escaner/') || ruta.startsWith('src/sections/gestoria/documents/');
    for (const manifest of [TRACTOR_FACTURES, TRACTOR_CORREUS, TRACTOR_TAULER, TRACTOR_HISTORIC]) {
      expect(manifest.fonts.filter(nous), manifest.id).toEqual([]);
    }
    // L'alta al catàleg (TRACTORS_GESTORIA) és de la integració: ací només es comprova que no hi entra d'amagat un altre id.
    expect(TRACTORS_GESTORIA.filter((m) => m.id === TRACTOR_ESCANER.id && m !== TRACTOR_ESCANER)).toEqual([]);
  });

  /* El text que serviria Vite al catàleg (el mateix glob que registreTractors.js): la fitxa i cada font hi són,
     i l'empremta es pot calcular. Sense, el panell de Tractors el diria «incomplet» i no es podria aprovar. */
  test('la fitxa i cada font existixen: l’empremta es calcula, sense cap font absent', async () => {
    const FITXERS = import.meta.glob(
      ['../../**/*.{js,jsx,md}', '../../../tractors/**/*.{js,jsx}', '!**/*.test.*', '!**/__fixtures__/**'],
      { query: '?raw', import: 'default', eager: true }
    );
    const tractor = construixTractor(TRACTOR_ESCANER, textosPerRuta(FITXERS, 'src/sections/gestoria/escaner/nucli'));
    expect(tractor.fontsAbsents).toEqual([]);
    expect(await empremtaDe(tractor)).toMatchObject({ id: 'gestoria.escaner', estat: 'ok', fontsAbsents: [] });
  });

  /* El graf estàtic de les quatre entrades, resseguit pel text (sense import() dinàmics, que nucli/tractor.js
     només fa per als altres tractors): cada fitxer dels carrils és a les fonts (o és el fitxer dels manifests), i
     cada font pròpia (UI_ESCANER, NUCLI_ESCANER) hi és de veres. No arriba mai al cofre ni a l'Històric. */
  test('les fonts són el graf estàtic sencer de PanellEscaner, useEscaner, tractorEscaner i escaner', () => {
    const ARREL = process.cwd();
    const dinsCarrils = (ruta) => ruta.startsWith('src/sections/gestoria/') || ruta.startsWith('src/sections/tractors/');
    const especificadors = (codi) => [...codi.matchAll(/(?:\bfrom\s*|\bimport\s+)(['"])([^'"\n]+)\1/g)].map((m) => m[2]);
    const resol = (des, especificador) => {
      const base = path.posix.normalize(path.posix.join(path.posix.dirname(des), especificador.split('?')[0]));
      return [base, `${base}.js`, `${base}.jsx`].find((r) => /\.(?:js|jsx)$/.test(r)) ?? base;
    };
    const vistos = new Set();
    const pendents = [...UI_ESCANER, 'src/sections/gestoria/escaner/nucli/tractorEscaner.js', 'src/sections/gestoria/escaner/nucli/escaner.js'];
    while (pendents.length) {
      const ruta = pendents.pop();
      if (vistos.has(ruta)) continue;
      vistos.add(ruta);
      for (const especificador of especificadors(readFileSync(path.join(ARREL, ruta), 'utf8'))) {
        if (!especificador.startsWith('.')) continue;
        const desti = resol(ruta, especificador);
        if (dinsCarrils(desti)) pendents.push(desti);
      }
    }
    const graf = [...vistos].sort();
    const fora = graf.filter((ruta) => !TRACTOR_ESCANER.fonts.includes(ruta) && ruta !== 'src/sections/gestoria/tractors.js');
    expect(fora).toEqual([]);
    expect([...UI_ESCANER, ...NUCLI_ESCANER].filter((ruta) => !graf.includes(ruta))).toEqual([]);
    expect(graf.filter((ruta) => /\/(?:cofre|historic|despeses)\/|simulacio\.js$/.test(ruta))).toEqual([]);
  });
});

describe('amb l’aprovació vigent', () => {
  test('llig només les factures i els extractes que comparteixen mida i el cap dels extractes llegibles; mai la identitat, l’arxiu ni la credencial', async () => {
    const font = fontDe(ARBRE);
    const r = await executaTractorEscaner({ font, aprovacio: APROVACIO, avui: AVUI });
    expect([...font.llegits].sort()).toEqual(LLEGITS_ESPERATS);
    expect(font.escriu).not.toHaveBeenCalled();
    expect(r.illegibles).toEqual([]);
    expect(r.radiografia).toMatchObject({ esquema: 'sdp.gestoria.radiografia.v1', carpeta: 'Gestoria_Prova', fitxers: 9 });
    const perRuta = Object.fromEntries(r.extractes.map((f) => [f.ruta, f]));
    expect(perRuta[`${B}/moviments_compte.n43`]).toMatchObject({ format: 'n43', preseleccionat: true, seleccionable: true });
    expect(perRuta[`${B}/bancpoble.csv`]).toMatchObject({ format: 'csv-tauler', preseleccionat: true });
    expect(perRuta[`${B}/moviments_export.xls`]).toMatchObject({ format: 'xls', preseleccionat: false, codi: 'EXTRACTE_NO_LLEGIBLE' });
    expect(r.duplicats).toEqual([expect.objectContaining({
      codi: 'DUPLICAT_ENTRE_TRIMESTRES', severitat: 'alta', original: `${F}/2025_4T/2025-4T-llibre_exemple.pdf`,
      copies: [`${F}/2026_1T/2025-4T-llibre_exemple.pdf`]
    })]);
    expect(r.alertes.map((a) => a.ruta)).toEqual(['90_Arxiu_Historic/certificat_antic.pfx']);
    expect(r.radiografia.identitat).toEqual({ carpetes: 1, fitxers: 1 });
  });

  test('el resultat no porta mai bytes ni text dels fitxers', async () => {
    const r = await executaTractorEscaner({ font: fontDe(ARBRE), aprovacio: APROVACIO, avui: AVUI });
    const json = JSON.stringify(r);
    for (const contingut of ['TITULAR SINTETIC', 'COMPRA PROVA', 'PDF-PROVA', 'FULL-DE-CALCUL']) expect(json).not.toContain(contingut);
    expect(JSON.stringify(r.radiografia)).not.toMatch(/2026_Bancs|Identitat_Legal|\.pdf/);
  });

  test('del cap d’un extracte, com a molt 4 kB tallats a l’última línia sencera, i el format ix igual', async () => {
    formatDelCap.mockClear();
    const files = Array.from({ length: 200 }, (_, i) => `2026-06-${xifres((i % 28) + 1, 2)},2026-06-${xifres((i % 28) + 1, 2)},PROVA ${i},-1.00,${1000 - i}.00`);
    const llarg = ['Fecha,F. valor,Concepto,Importe,Saldo', ...files].join('\n');
    expect(bytesDe(llarg).length).toBeGreaterThan(LIMITS_ESCANER.bytesCap);
    const r = await executaTractorEscaner({ font: fontDe({ [`${B}/llarg.csv`]: llarg }), aprovacio: APROVACIO, avui: AVUI });
    expect(r.extractes).toEqual([expect.objectContaining({ ruta: `${B}/llarg.csv`, format: 'csv-tauler', preseleccionat: true })]);
    expect(formatDelCap).toHaveBeenCalledTimes(1);
    const [cap, ext] = formatDelCap.mock.calls[0];
    expect(ext).toBe('csv');
    expect(bytesDe(cap).length).toBeLessThanOrEqual(LIMITS_ESCANER.bytesCap);
    expect(cap.endsWith('\n')).toBe(true);
  });

  test('un extracte que també comparteix mida es llig una sola vegada: l’empremta i el cap ixen dels mateixos bytes', async () => {
    const font = fontDe({ [`${B}/banc_a.csv`]: CSV_TAULER, [`${B}/banc_b.csv`]: CSV_TAULER });
    const r = await executaTractorEscaner({ font, aprovacio: APROVACIO, avui: AVUI });
    expect(font.llig).toHaveBeenCalledTimes(2);
    expect(r.extractes.map((f) => [f.ruta, f.format, f.preseleccionat, f.codi])).toEqual([
      [`${B}/banc_a.csv`, 'csv-tauler', true, null],
      [`${B}/banc_b.csv`, 'csv-tauler', false, 'DUPLICAT_EXACTE']
    ]);
  });

  test('les limitacions de la Font són avisos FONT_LIMITADA de la radiografia', async () => {
    const font = fontDe(ARBRE, { limitacions: [{ codi: 'MASSA_FITXERS', missatge: 'La carpeta té més fitxers dels que es llisten.' }] });
    const r = await executaTractorEscaner({ font, aprovacio: APROVACIO, avui: AVUI });
    expect(r.radiografia.avisos).toEqual(expect.arrayContaining([
      expect.objectContaining({ codi: 'FONT_LIMITADA', missatge: 'La carpeta té més fitxers dels que es llisten.' })
    ]));
  });

  test('un fitxer que no es pot llegir no atura la resta: va a illegibles i la radiografia en diu el compte, sense la ruta', async () => {
    const font = fontDe(ARBRE);
    const original = font.llig.getMockImplementation();
    font.llig.mockImplementation(async (ruta) => {
      if (ruta.endsWith('.n43')) throw new ErrorTractor('FITXER_ILLEGIBLE', 'Fallada sintètica.');
      return original(ruta);
    });
    const r = await executaTractorEscaner({ font, aprovacio: APROVACIO, avui: AVUI });
    expect(r.illegibles).toEqual([{ ruta: `${B}/moviments_compte.n43`, codi: 'FITXER_ILLEGIBLE', missatge: expect.any(String) }]);
    expect(r.extractes.find((f) => f.ruta.endsWith('.n43'))).toMatchObject({ format: 'no', preseleccionat: false, codi: 'EXTRACTE_NO_LLEGIBLE' });
    expect(r.radiografia.avisos).toEqual(expect.arrayContaining([expect.objectContaining({ codi: 'FONT_LIMITADA', missatge: expect.stringMatching(/^Un fitxer no s'ha pogut llegir/) })]));
    expect(JSON.stringify(r.radiografia)).not.toContain('moviments_compte');
    expect(r.duplicats).toHaveLength(1);
  });

  test('un extracte més gran del que llig el Tauler no es llig: FITXER_MASSA_GRAN', async () => {
    const font = fontDe({ [`${B}/moviments_compte.n43`]: N43 });
    const r = await executaTractorEscaner({ font, aprovacio: APROVACIO, avui: AVUI, limits: { midaExtracte: 64 } });
    expect(font.llig).not.toHaveBeenCalled();
    expect(r.illegibles).toEqual([expect.objectContaining({ codi: 'FITXER_MASSA_GRAN' })]);
    expect(r.extractes[0]).toMatchObject({ format: 'no', preseleccionat: false });
  });

  test('una carpeta sense cap fitxer visible és CARPETA_BUIDA, i no es llig res', async () => {
    const font = fontDe({ '.DS_Store': 'x', '__MACOSX/a.pdf': 'y' });
    const error = await errorDe(executaTractorEscaner({ font, aprovacio: APROVACIO, avui: AVUI }));
    expect(error).toBeInstanceOf(ErrorEscaner);
    expect(error.codi).toBe('CARPETA_BUIDA');
    expect(CODIS_TRACTOR_ESCANER).toContain(error.codi);
    expect(font.llig).not.toHaveBeenCalled();
  });

  test('sense una Font de veres, FONT_INVALIDA; un error inesperat de la Font, ERROR_INTERN', async () => {
    const sense = await errorDe(executaTractorEscaner({ font: { llista: async () => [] }, aprovacio: APROVACIO }));
    expect(sense).toMatchObject({ name: 'ErrorEscaner', codi: 'FONT_INVALIDA' });
    const font = fontDe(ARBRE);
    font.llista.mockRejectedValueOnce(new TypeError('sintètic'));
    const intern = await errorDe(executaTractorEscaner({ font, aprovacio: APROVACIO }));
    expect(intern).toMatchObject({ name: 'ErrorEscaner', codi: 'ERROR_INTERN' });
  });

  test('el progrés passa per les fases en ordre, i un error de qui el pinta no atura l’anàlisi', async () => {
    const vistes = [];
    const onProgres = vi.fn(({ fase }) => {
      vistes.push(fase);
      throw new Error('La UI ha fallat.');
    });
    const r = await executaTractorEscaner({ font: fontDe(ARBRE), aprovacio: APROVACIO, avui: AVUI, onProgres });
    expect(r.radiografia.fitxers).toBe(9);
    const ordre = [...new Set(vistes)];
    expect(ordre).toEqual([...FASES_ESCANER]);
  });
});

describe('la cancel·lació i la Font oblidada', () => {
  test('un senyal ja cancel·lat rebutja abans de llistar res', async () => {
    const controlador = new AbortController();
    controlador.abort();
    const font = fontDe(ARBRE);
    const error = await errorDe(executaTractorEscaner({ font, aprovacio: APROVACIO, signal: controlador.signal }));
    expect(error).toMatchObject({ name: 'ErrorEscaner', codi: 'LECTURA_CANCELLADA' });
    expect(font.llista).not.toHaveBeenCalled();
  });

  test('cancel·lar durant la verificació criptogràfica no llista ni llig res', async () => {
    const controlador = new AbortController();
    const original = globalThis.crypto.subtle;
    const subtle = new Proxy(original, {
      get(target, key) {
        const valor = Reflect.get(target, key, target);
        if (key === 'verify') return async (...args) => {
          const valid = await valor.apply(target, args);
          controlador.abort();
          return valid;
        };
        return typeof valor === 'function' ? valor.bind(target) : valor;
      }
    });
    const font = fontDe(ARBRE);
    const error = await errorDe(executaTractorEscaner({ font, aprovacio: APROVACIO, subtle, signal: controlador.signal }));
    expect(controlador.signal.aborted).toBe(true);
    expect(error).toMatchObject({ name: 'ErrorEscaner', codi: 'LECTURA_CANCELLADA' });
    expect(font.llista).not.toHaveBeenCalled();
    expect(font.llig).not.toHaveBeenCalled();
  });

  test('cancel·lar mentre llig un fitxer: els seus bytes es descarten i no se’n comença cap altre ni hi ha resultat parcial', async () => {
    const controlador = new AbortController();
    const espera = pendent();
    const font = fontDe(ARBRE, { llig: () => espera.promesa });
    const feina = errorDe(executaTractorEscaner({ font, aprovacio: APROVACIO, avui: AVUI, signal: controlador.signal }));
    await vi.waitFor(() => expect(font.llig).toHaveBeenCalledTimes(1));
    controlador.abort();
    espera.resol(bytesDe('PDF-PROVA-A'));
    const error = await feina;
    expect(error).toMatchObject({ name: 'ErrorEscaner', codi: 'LECTURA_CANCELLADA' });
    expect(font.llig).toHaveBeenCalledTimes(1);
  });

  /* La Font de veres (fontDesDeFitxers), amb fitxers sintètics de l'<input webkitdirectory>. */
  const fitxer = (ruta, contingut, { onLlig } = {}) => {
    const bytes = bytesDe(contingut);
    return {
      name: ruta.split('/').pop(), size: bytes.length, lastModified: MODIFICAT, webkitRelativePath: `Gestoria_Prova/${ruta}`,
      arrayBuffer: vi.fn(async () => {
        onLlig?.();
        return bytes.slice().buffer;
      })
    };
  };

  test('amb la Font oblidada abans de començar, FONT_OBLIDADA passa tal qual', async () => {
    const font = fontDesDeFitxers([fitxer(`${B}/moviments_compte.n43`, N43)]);
    oblidaFont(font);
    const error = await errorDe(executaTractorEscaner({ font, aprovacio: APROVACIO, avui: AVUI }));
    expect(error).toBeInstanceOf(ErrorTractor);
    expect(error.codi).toBe('FONT_OBLIDADA');
  });

  test('amb la Font oblidada a mitjan lectura, FONT_OBLIDADA atura l’anàlisi i no es llig cap altre fitxer', async () => {
    let font = null;
    const segon = fitxer(`${B}/zz_moviments.csv`, CSV_TAULER);
    font = fontDesDeFitxers([fitxer(`${B}/moviments_compte.n43`, N43, { onLlig: () => oblidaFont(font) }), segon]);
    const error = await errorDe(executaTractorEscaner({ font, aprovacio: APROVACIO, avui: AVUI }));
    expect(error).toBeInstanceOf(ErrorTractor);
    expect(error.codi).toBe('FONT_OBLIDADA');
    expect(segon.arrayBuffer).not.toHaveBeenCalled();
  });

  test('la Font de veres: la carpeta del selector és el nom, i les rutes van sense el primer segment', async () => {
    const font = fontDesDeFitxers([fitxer(`${B}/moviments_compte.n43`, N43), fitxer(`${F}/2026_3T/proveidor_alfa.pdf`, 'PDF-UNIC')]);
    const r = await executaTractorEscaner({ font, aprovacio: APROVACIO, avui: AVUI });
    expect(r.radiografia.carpeta).toBe('Gestoria_Prova');
    expect(r.extractes).toEqual([expect.objectContaining({ ruta: `${B}/moviments_compte.n43`, format: 'n43', preseleccionat: true })]);
  });
});
