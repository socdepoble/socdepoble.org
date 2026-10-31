// @vitest-environment node
/**
 * motorMultimediaLocal.seguretat.test.js — Les garanties del motor del Gestor
 * d'arxius locals (IDEA-54/55 · Onada 261029_1605) que no es poden trencar:
 * rutes trampa a l'origen i al destí, llista blanca d'escriptura, permisos,
 * moure sense perdre mai l'única còpia (col·lisions, origen editat a mitja
 * còpia, verificació que falla, esborrat que falla), àlies de majúscules i
 * d'Unicode del disc del Mac, cap operació en una font de només lectura, cap
 * blob: de HTML/SVG/JS i la frontera del mòdul. Entra al precommit pel nom.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import {
  CarpetaFalsa,
  FitxerFals,
  arbreMultimedia,
  bytesPngFals,
  bytesWebpFals,
  contingutFals,
  instantaniaFalsa,
  nodeFals,
  textFals
} from '../../../tests/helpers/carpetaLocalFalsa.js';
import {
  CODIS_ERROR_ARXIU_LOCAL,
  ErrorArxiuLocal,
  MIDA_TROS_VERIFICACIO_LOCAL,
  MIMES_VISOR_LOCAL,
  creaFitxerMarkdownLocal,
  creaRegistreUrlsLocals,
  desaWebpALaCarpetaLocal,
  desaWebpIMouOriginalLocal,
  escriuTextLocal,
  esRutaEscrivibleLocal,
  esRutaSeguraLocal,
  potMoureOriginalRaster,
  fontDesDeFitxers,
  fontDesDeHandle,
  llegixTextLocal,
  mimeDeRuta,
  mimeDeVisorLocal,
  oblidaFont
} from './motorMultimediaLocal.js';

const RUTES_TRAMPA = Object.freeze(['../fora.md', '/abs.md', 'a//b.md', 'a\\b.md', '.ocult.md', 'sub/.DS_Store', 'a/./b.md', 'a/../b.md', '__MACOSX/x.md', '', 42, null]);

const codi = async (promesa) => {
  try {
    await promesa;
  } catch (error) {
    return error?.codi ?? error?.name;
  }
  return 'SENSE_ERROR';
};
const errorDe = async (promesa) => {
  try {
    await promesa;
  } catch (error) {
    return error;
  }
  throw new Error('Esperava un error.');
};
const removeEntries = (arrel) => arrel.registre.filter((e) => e[0] === 'removeEntry');
const toquen = (arrel, ruta) => arrel.registre.filter((e) => e[1] === ruta && ['removeEntry', 'createWritable', 'escriu'].includes(e[0]));

describe('rutes trampa: RUTA_INVALIDA i l’arbre intacte, abans de demanar cap permís', () => {
  test.each(RUTES_TRAMPA.map((r) => [r]))('%j', async (ruta) => {
    const arrel = arbreMultimedia();
    const abans = instantaniaFalsa(arrel);
    const font = fontDesDeHandle(arrel);
    const crides = [
      font.llig(ruta), font.info(ruta), font.fitxer(ruta), font.escriu(ruta, new Uint8Array(1)),
      llegixTextLocal(font, ruta), escriuTextLocal(font, ruta, 'x', { sobreescriu: true }),
      desaWebpALaCarpetaLocal(font, ruta, bytesWebpFals()), desaWebpIMouOriginalLocal(font, ruta, bytesWebpFals()),
      font.mou(ruta, 'documents_i_pdfs/x.md'), font.mou('00_inbox/nota.md', ruta),
      font.reanomena(ruta, 'nou'), font.creaCarpeta(ruta), font.elimina(ruta)
    ];
    if (ruta !== '') crides.push(creaFitxerMarkdownLocal(font, { carpeta: ruta, nom: 'x' }));
    for (const crida of crides) expect(await codi(crida)).toBe('RUTA_INVALIDA');
    expect(instantaniaFalsa(arrel)).toEqual(abans);
    expect(arrel.consultes).toEqual([]);
    expect(arrel.peticions).toEqual([]);
    expect(esRutaSeguraLocal(ruta)).toBe(false);
  });

  test('un nom nou amb barres o només punts no és cap nom: NOM_INVALID sense tocar res', async () => {
    const arrel = arbreMultimedia();
    const abans = instantaniaFalsa(arrel);
    const font = fontDesDeHandle(arrel);
    for (const nom of ['../fora', 'a/b', 'a\\b', '..', '...', '', '   ', 'CON', 42]) {
      expect(await codi(font.reanomena('00_inbox/nota.md', nom))).toBe('NOM_INVALID');
    }
    expect(await codi(font.mou('00_inbox/nota.md', 'documents_i_pdfs/a:b.md'))).toBe('NOM_INVALID');
    expect(instantaniaFalsa(arrel)).toEqual(abans);
    expect(arrel.consultes).toEqual([]);
  });
});

describe('escriure', () => {
  test('mai crea carpetes, tret de creaCarpetes:true', async () => {
    const arrel = arbreMultimedia();
    const font = fontDesDeHandle(arrel);
    expect(await codi(font.escriu('nova/carpeta/x.md', new Uint8Array(1)))).toBe('CARPETA_NO_TROBADA');
    expect(nodeFals(arrel, 'nova')).toBeNull();
    expect(await codi(font.escriu('nova/carpeta/x.md', new Uint8Array(1), { creaCarpetes: true }))).toBe('SENSE_ERROR');
    expect(nodeFals(arrel, 'nova/carpeta/x.md')).not.toBeNull();
  });

  test('amb el permís denegat o una SecurityError en demanar-lo: ESCRIPTURA_DENEGADA i res escrit', async () => {
    for (const demanats of [{ readwrite: 'denied' }, { readwrite: new DOMException('sense gest', 'SecurityError') }]) {
      const arrel = arbreMultimedia({ permisos: { readwrite: 'prompt' }, demanats });
      const abans = instantaniaFalsa(arrel);
      const font = fontDesDeHandle(arrel);
      expect(await codi(font.escriu('x.md', new Uint8Array(1)))).toBe('ESCRIPTURA_DENEGADA');
      expect(await codi(font.mou('00_inbox/nota.md', 'documents_i_pdfs/nota.md'))).toBe('ESCRIPTURA_DENEGADA');
      expect(await codi(font.reanomena('00_inbox/nota.md', 'nova'))).toBe('ESCRIPTURA_DENEGADA');
      expect(await codi(font.creaCarpeta('nova'))).toBe('ESCRIPTURA_DENEGADA');
      expect(await codi(font.elimina('00_inbox/nota.md'))).toBe('ESCRIPTURA_DENEGADA');
      expect(await codi(escriuTextLocal(font, 'llegeix-me.txt', 'x', { sobreescriu: true }))).toBe('ESCRIPTURA_DENEGADA');
      expect(instantaniaFalsa(arrel)).toEqual(abans);
    }
  });

  test('una escriptura que falla fa abort() i el contingut vell queda intacte', async () => {
    const arrel = arbreMultimedia();
    arrel.injectaFallada('write', { ruta: 'llegeix-me.txt' });
    const font = fontDesDeHandle(arrel);
    const error = await errorDe(font.escriu('llegeix-me.txt', new TextEncoder().encode('nou'), { sobreescriu: true }));
    expect(error.codi).toBe('ESCRIPTURA_FALLIDA');
    expect(error.cause?.name).toBe('QuotaExceededError');
    expect(textFals(arrel, 'llegeix-me.txt')).toBe('Llegeix-me\n');
    expect(arrel.registre.filter((e) => e[0] === 'abort').map((e) => e[1])).toEqual(['llegeix-me.txt']);
  });

  test('fora de la llista blanca: ESCRIPTURA_NO_PERMESA sense consultar cap permís', async () => {
    const arrel = arbreMultimedia();
    const font = fontDesDeHandle(arrel);
    for (const ruta of ['x.exe', 'x.sh', 'x.png', 'x.svg', 'x.html', 'x.htm', 'x.js', 'x.css', 'x.xml', 'x.vcf', 'sense-extensio']) {
      expect(await codi(font.escriu(ruta, new Uint8Array(1)))).toBe('ESCRIPTURA_NO_PERMESA');
    }
    expect(await codi(font.escriu('x.webp', bytesPngFals()))).toBe('NO_ES_WEBP');
    expect(arrel.consultes).toEqual([]);
    expect(await codi(escriuTextLocal(font, 'x.html', '<script>', { sobreescriu: true }))).toBe('ESCRIPTURA_NO_PERMESA');
  });

  test('extensionsEscriptura pot estrényer la llista blanca, mai eixamplar-la', async () => {
    const arrel = arbreMultimedia();
    const font = fontDesDeHandle(arrel, { extensionsEscriptura: ['html', 'md', 'js'] });
    expect(await codi(font.escriu('x.html', new Uint8Array(1)))).toBe('ESCRIPTURA_NO_PERMESA');
    expect(await codi(font.escriu('x.txt', new Uint8Array(1)))).toBe('ESCRIPTURA_NO_PERMESA');
    expect(await codi(font.escriu('x.md', new Uint8Array(1)))).toBe('SENSE_ERROR');
  });

  test('sobreescriu només amb true: «si» o 1 donen FITXER_JA_EXISTEIX', async () => {
    const arrel = arbreMultimedia();
    const font = fontDesDeHandle(arrel);
    for (const sobreescriu of ['si', 1, 'true', {}]) {
      expect(await codi(font.escriu('llegeix-me.txt', new Uint8Array(1), { sobreescriu }))).toBe('FITXER_JA_EXISTEIX');
    }
    expect(textFals(arrel, 'llegeix-me.txt')).toBe('Llegeix-me\n');
  });
});

describe('després d’oblidar la font', () => {
  test('tots els mètodes donen FONT_OBLIDADA i el handle és null', async () => {
    const arrel = arbreMultimedia();
    const abans = instantaniaFalsa(arrel);
    const font = fontDesDeHandle(arrel);
    oblidaFont(font);
    for (const crida of [
      font.llista(), font.llig('llegeix-me.txt'), font.info('llegeix-me.txt'), font.fitxer('llegeix-me.txt'),
      font.escriu('x.md', new Uint8Array(1)), font.mou('00_inbox/nota.md', 'documents_i_pdfs/nota.md'),
      font.reanomena('00_inbox/nota.md', 'nova'), font.creaCarpeta('nova'), font.elimina('llegeix-me.txt'),
      desaWebpIMouOriginalLocal(font, '00_inbox/esbos_festa_tibi.png', bytesWebpFals()),
      llegixTextLocal(font, 'llegeix-me.txt')
    ]) {
      expect(await codi(crida)).toBe('FONT_OBLIDADA');
    }
    expect(font.handle).toBeNull();
    expect(instantaniaFalsa(arrel)).toEqual(abans);
  });

  test('oblidar-la a mitja còpia: s’esborra la còpia i l’original es queda', async () => {
    const arrel = arbreMultimedia({ midaTros: 5 });
    const font = fontDesDeHandle(arrel);
    const original = contingutFals(arrel, '00_inbox/nota.md');
    arrel.enLlegirTros = ({ index }) => {
      if (index === 1) oblidaFont(font);
    };
    expect(await codi(font.mou('00_inbox/nota.md', 'documents_i_pdfs/nota.md'))).toBe('FONT_OBLIDADA');
    expect(contingutFals(arrel, '00_inbox/nota.md')).toEqual(original);
    expect(nodeFals(arrel, 'documents_i_pdfs/nota.md')).toBeNull();
    expect(removeEntries(arrel).map((e) => e[1])).toEqual(['documents_i_pdfs/nota.md']);
  });
});

describe('moure: mai es perd l’única còpia', () => {
  test('col·lisió al destí: FITXER_JA_EXISTEIX abans de crear res, sense removeEntry', async () => {
    const arrel = arbreMultimedia({}, { documents_i_pdfs: { 'nota.md': 'una altra nota' } });
    const abans = instantaniaFalsa(arrel);
    const font = fontDesDeHandle(arrel);
    expect(await codi(font.mou('00_inbox/nota.md', 'documents_i_pdfs/nota.md'))).toBe('FITXER_JA_EXISTEIX');
    expect(await codi(font.mou('00_inbox/nota.md', '00_inbox/nano_vinyeta.png'))).toBe('EXTENSIO_NO_CONSERVADA');
    expect(await codi(font.reanomena('00_inbox/esbos_festa_tibi.png', 'nano_vinyeta'))).toBe('FITXER_JA_EXISTEIX');
    expect(await codi(font.mou('00_inbox/nota.md', 'documents_i_pdfs'))).toBe('EXTENSIO_NO_CONSERVADA');
    expect(instantaniaFalsa(arrel)).toEqual(abans);
    expect(removeEntries(arrel)).toEqual([]);
    expect(arrel.registre.filter((e) => e[0] === 'createWritable')).toEqual([]);
  });

  test('una carpeta amb el nom del destí també és col·lisió; la carpeta destí ha d’existir; només fitxers', async () => {
    const arrel = arbreMultimedia({}, { b: { 'nota.md': {} } });
    const abans = instantaniaFalsa(arrel);
    const font = fontDesDeHandle(arrel);
    expect(await codi(font.mou('00_inbox/nota.md', 'b/nota.md'))).toBe('FITXER_JA_EXISTEIX');
    expect(await codi(font.mou('00_inbox/nota.md', 'no-hi-és/nota.md'))).toBe('CARPETA_NO_TROBADA');
    expect(await codi(font.mou('00_inbox/no-hi-és.md', 'b/x.md'))).toBe('FITXER_ILLEGIBLE');
    expect(await codi(font.mou('b/nota.md', 'documents_i_pdfs/nota.md'))).toBe('NO_ES_FITXER');
    expect(instantaniaFalsa(arrel)).toEqual(abans);
    expect(removeEntries(arrel)).toEqual([]);
  });

  test('si algú crea el destí entre la comprovació i la creació, no es trepitja ni s’esborra', async () => {
    const arrel = arbreMultimedia();
    const desti = nodeFals(arrel, 'documents_i_pdfs');
    const original = desti.getFileHandle.bind(desti);
    desti.getFileHandle = async (nom, opcions) => {
      if (opcions?.create && !desti.fills.has(nom)) desti.afig(nom, 'intrús');
      return original(nom, opcions);
    };
    const font = fontDesDeHandle(arrel);
    expect(await codi(font.mou('00_inbox/nota.md', 'documents_i_pdfs/nota.md'))).toBe('FITXER_JA_EXISTEIX');
    expect(textFals(arrel, 'documents_i_pdfs/nota.md')).toBe('intrús');
    expect(textFals(arrel, '00_inbox/nota.md')).toBe('# Nota\n\nHola, poble.\n');
    expect(removeEntries(arrel)).toEqual([]);
  });

  test('l’origen editat des de fora a mitja còpia: CONFLICTE_DISC, s’esborra la còpia i l’original no es toca', async () => {
    for (const lecturaEstricta of [false, true]) {
      const arrel = arbreMultimedia({ midaTros: 4, lecturaEstricta });
      const font = fontDesDeHandle(arrel);
      arrel.enLlegirTros = ({ fitxer, index }) => {
        if (index === 0 && fitxer.name === 'nota.md') fitxer.modificaDesDeFora('# Nota editada per Obsidian\n');
      };
      expect(await codi(font.mou('00_inbox/nota.md', 'documents_i_pdfs/nota.md'))).toBe('CONFLICTE_DISC');
      expect(textFals(arrel, '00_inbox/nota.md')).toBe('# Nota editada per Obsidian\n');
      expect(nodeFals(arrel, 'documents_i_pdfs/nota.md')).toBeNull();
      expect(toquen(arrel, '00_inbox/nota.md')).toEqual([]);
    }
  });

  test('la verificació falla (mida o SHA-256): MOVIMENT_NO_VERIFICAT, removeEntry mai a l’origen', async () => {
    for (const mode of ['trunca', 'altera']) {
      const arrel = arbreMultimedia();
      arrel.corrompEscriptura({ ruta: 'documents_i_pdfs/nota.md', mode });
      const font = fontDesDeHandle(arrel);
      const original = contingutFals(arrel, '00_inbox/nota.md');
      const error = await errorDe(font.mou('00_inbox/nota.md', 'documents_i_pdfs/nota.md'));
      expect(error).toBeInstanceOf(ErrorArxiuLocal);
      expect(error.codi).toBe('MOVIMENT_NO_VERIFICAT');
      expect(contingutFals(arrel, '00_inbox/nota.md')).toEqual(original);
      expect(nodeFals(arrel, 'documents_i_pdfs/nota.md')).toBeNull();
      expect(removeEntries(arrel).map((e) => e[1])).toEqual(['documents_i_pdfs/nota.md']);
    }
  });

  test('una escriptura o un close que fallen: ESCRIPTURA_FALLIDA, sense còpia i amb l’origen intacte', async () => {
    for (const operacio of ['createWritable', 'write', 'close']) {
      const arrel = arbreMultimedia();
      arrel.injectaFallada(operacio, { ruta: 'documents_i_pdfs/nota.md' });
      const font = fontDesDeHandle(arrel);
      expect(await codi(font.mou('00_inbox/nota.md', 'documents_i_pdfs/nota.md'))).toBe('ESCRIPTURA_FALLIDA');
      expect(textFals(arrel, '00_inbox/nota.md')).toBe('# Nota\n\nHola, poble.\n');
      expect(nodeFals(arrel, 'documents_i_pdfs/nota.md')).toBeNull();
      expect(toquen(arrel, '00_inbox/nota.md')).toEqual([]);
    }
  });

  test('si no es pot esborrar l’original, es desfà la còpia; si tampoc, MOVIMENT_INCOMPLET (dues còpies, cap perduda)', async () => {
    const arrel = arbreMultimedia();
    arrel.injectaFallada('removeEntry', { ruta: '00_inbox/nota.md' });
    const font = fontDesDeHandle(arrel);
    expect(await codi(font.mou('00_inbox/nota.md', 'documents_i_pdfs/nota.md'))).toBe('ESCRIPTURA_FALLIDA');
    expect(nodeFals(arrel, '00_inbox/nota.md')).not.toBeNull();
    expect(nodeFals(arrel, 'documents_i_pdfs/nota.md')).toBeNull();

    const dues = arbreMultimedia();
    dues.injectaFallada('removeEntry');
    const error = await errorDe(fontDesDeHandle(dues).mou('00_inbox/nota.md', 'documents_i_pdfs/nota.md'));
    expect(error.codi).toBe('MOVIMENT_INCOMPLET');
    expect(error.detall).toEqual({ origen: '00_inbox/nota.md', desti: 'documents_i_pdfs/nota.md' });
    expect(textFals(dues, '00_inbox/nota.md')).toBe(textFals(dues, 'documents_i_pdfs/nota.md'));
  });

  test('si l’origen desapareix a mitja còpia, la còpia verificada es conserva', async () => {
    const arrel = arbreMultimedia();
    const font = fontDesDeHandle(arrel);
    arrel.enLlegirTros = ({ fitxer }) => {
      if (fitxer.name === 'nota.md') nodeFals(arrel, '00_inbox').fills.delete('nota.md');
    };
    const error = await errorDe(font.mou('00_inbox/nota.md', 'documents_i_pdfs/nota.md'));
    expect(error.codi).toBe('CONFLICTE_DISC');
    expect(error.detall).toEqual({ copiaConservada: 'documents_i_pdfs/nota.md' });
    expect(textFals(arrel, 'documents_i_pdfs/nota.md')).toBe('# Nota\n\nHola, poble.\n');
  });

  test('si la verificació falla i l’origen ha desaparegut, la còpia (l’única) es conserva', async () => {
    const arrel = arbreMultimedia();
    arrel.corrompEscriptura({ ruta: 'documents_i_pdfs/nota.md', mode: 'altera' });
    arrel.enLlegirTros = ({ fitxer }) => {
      if (fitxer.name === 'nota.md') nodeFals(arrel, '00_inbox').fills.delete('nota.md');
    };
    const error = await errorDe(fontDesDeHandle(arrel).mou('00_inbox/nota.md', 'documents_i_pdfs/nota.md'));
    expect(error.codi).toBe('CONFLICTE_DISC');
    expect(error.detall).toEqual({ copiaConservada: 'documents_i_pdfs/nota.md' });
    expect(nodeFals(arrel, 'documents_i_pdfs/nota.md')).not.toBeNull();
    expect(removeEntries(arrel)).toEqual([]);
  });

  test('si removeEntry esborra l’original però avisa d’error, el moviment s’ha fet i la còpia es queda', async () => {
    const arrel = arbreMultimedia();
    const inbox = nodeFals(arrel, '00_inbox');
    const original = inbox.removeEntry.bind(inbox);
    inbox.removeEntry = async (nom, opcions) => {
      await original(nom, opcions);
      throw new DOMException('esborrat, però amb avís', 'UnknownError');
    };
    const r = await fontDesDeHandle(arrel).mou('00_inbox/nota.md', 'documents_i_pdfs/nota.md');
    expect(r).toMatchObject({ ruta: 'documents_i_pdfs/nota.md', origen: '00_inbox/nota.md' });
    expect(textFals(arrel, 'documents_i_pdfs/nota.md')).toBe('# Nota\n\nHola, poble.\n');
    expect(nodeFals(arrel, '00_inbox/nota.md')).toBeNull();
  });

  test('un doble clic (dos moviments del mateix fitxer alhora) no perd cap còpia', async () => {
    for (const desti of [['documents_i_pdfs/nota.md', 'documents_i_pdfs/nota.md'], ['documents_i_pdfs/nota.md', 'nota.md']]) {
      const arrel = arbreMultimedia({ midaTros: 3 });
      const font = fontDesDeHandle(arrel);
      const resultats = await Promise.allSettled([font.mou('00_inbox/nota.md', desti[0]), font.mou('00_inbox/nota.md', desti[1])]);
      expect(resultats.map((r) => r.status)).toEqual(['fulfilled', 'rejected']);
      expect(resultats[1].reason.codi).toBe('FITXER_ILLEGIBLE');
      expect(textFals(arrel, 'documents_i_pdfs/nota.md')).toBe('# Nota\n\nHola, poble.\n');
      expect(nodeFals(arrel, '00_inbox/nota.md')).toBeNull();
    }
  });

  test('escriure sense sobreescriure no trepitja un fitxer que algú crea entre la comprovació i la creació', async () => {
    const arrel = arbreMultimedia();
    const inbox = nodeFals(arrel, '00_inbox');
    const original = inbox.getFileHandle.bind(inbox);
    inbox.getFileHandle = async (nom, opcions) => {
      if (opcions?.create && !inbox.fills.has(nom)) inbox.afig(nom, 'intrús');
      return original(nom, opcions);
    };
    const font = fontDesDeHandle(arrel);
    expect(await codi(creaFitxerMarkdownLocal(font, { carpeta: '00_inbox', nom: 'nova' }))).toBe('FITXER_JA_EXISTEIX');
    expect(await codi(desaWebpALaCarpetaLocal(font, '00_inbox/nano_vinyeta.webp', bytesWebpFals()))).toBe('FITXER_JA_EXISTEIX');
    expect(textFals(arrel, '00_inbox/nova.md')).toBe('intrús');
    expect(arrel.registre.filter((e) => e[0] === 'createWritable')).toEqual([]);
  });

  test('cap operació no fa servir mai removeEntry amb recursive', async () => {
    const arrel = arbreMultimedia({}, { buida: {}, plena: { '.DS_Store': 'x' } });
    const font = fontDesDeHandle(arrel);
    await font.mou('00_inbox/nota.md', 'documents_i_pdfs/nota.md');
    await font.reanomena('documents_i_pdfs/nota.md', 'acta-nota');
    await font.elimina('documents_i_pdfs/acta-nota.md');
    await font.elimina('buida');
    expect(await codi(font.elimina('plena'))).toBe('CARPETA_NO_BUIDA');
    expect(nodeFals(arrel, 'plena/.DS_Store')).not.toBeNull();
    expect(removeEntries(arrel).length).toBeGreaterThan(0);
    expect(removeEntries(arrel).every((e) => e[2].recursive === false)).toBe(true);
  });
});

describe('majúscules i Unicode: el disc del Mac veu el mateix fitxer', () => {
  test('canvis només de majúscules o de forma Unicode: NOM_EQUIVALENT abans de demanar cap permís', async () => {
    const nfd = 'café.png';
    const arrel = new CarpetaFalsa('m', { a: { 'foto.png': bytesPngFals(), [nfd]: bytesPngFals(), 'x.png': bytesPngFals() }, A: {} });
    const abans = instantaniaFalsa(arrel);
    const font = fontDesDeHandle(arrel);
    expect(await codi(font.reanomena('a/foto.png', 'Foto'))).toBe('NOM_EQUIVALENT');
    expect(await codi(font.reanomena('a/foto.png', 'FOTO.png'))).toBe('NOM_EQUIVALENT');
    expect(await codi(font.reanomena(`a/${nfd}`, 'café'))).toBe('NOM_EQUIVALENT');
    expect(await codi(font.mou('a/x.png', 'A/x.png'))).toBe('NOM_EQUIVALENT');
    expect(await codi(font.mou('a/x.png', 'a/x.png'))).toBe('MATEIXA_RUTA');
    expect(await codi(font.reanomena('a/x.png', 'x'))).toBe('MATEIXA_RUTA');
    expect(instantaniaFalsa(arrel)).toEqual(abans);
    expect(arrel.consultes).toEqual([]);
  });

  test('en un disc insensible a majúscules, el destí àlies d’un altre fitxer és col·lisió i no s’esborra res', async () => {
    const arrel = new CarpetaFalsa('apfs', { a: { 'foto.jpg': 'A' }, b: { 'foto.jpg': 'B' } }, { insensible: true });
    const abans = instantaniaFalsa(arrel);
    const font = fontDesDeHandle(arrel);
    expect(await codi(font.mou('a/foto.jpg', 'b/Foto.JPG'))).toBe('FITXER_JA_EXISTEIX');
    expect(await codi(font.mou('a/foto.jpg', 'B/foto.jpg'))).toBe('FITXER_JA_EXISTEIX');
    expect(instantaniaFalsa(arrel)).toEqual(abans);
    expect(removeEntries(arrel)).toEqual([]);
  });

  test('defensa en profunditat: carpetes que el disc veu com la mateixa i noms equivalents → NOM_EQUIVALENT', async () => {
    const arrel = new CarpetaFalsa('apfs', { Fotos: { 'x.png': bytesPngFals() } }, { insensible: true });
    const font = fontDesDeHandle(arrel);
    const fotos = nodeFals(arrel, 'Fotos');
    /* Un altre camí cap a la mateixa carpeta (com un enllaç del sistema). */
    arrel.fills.set('alies', fotos);
    expect(await codi(font.mou('Fotos/x.png', 'alies/X.png'))).toBe('NOM_EQUIVALENT');
    expect(nodeFals(arrel, 'Fotos/x.png')).not.toBeNull();
    expect(removeEntries(arrel)).toEqual([]);
  });
});

describe('una font de només lectura no escriu ni mou res', () => {
  test('fontDesDeFitxers: cap mètode d’escriptura i les funcions del motor donen NOMES_LECTURA', async () => {
    const f = new File(['hola'], 'nota.md');
    Object.defineProperty(f, 'webkitRelativePath', { value: 'c/nota.md' });
    const g = new File([bytesPngFals()], 'foto.png');
    Object.defineProperty(g, 'webkitRelativePath', { value: 'c/foto.png' });
    const font = fontDesDeFitxers([f, g]);
    for (const metode of ['escriu', 'mou', 'reanomena', 'creaCarpeta', 'elimina']) expect(font[metode]).toBeUndefined();
    expect(await codi(escriuTextLocal(font, 'nota.md', 'x', { sobreescriu: true }))).toBe('NOMES_LECTURA');
    expect(await codi(creaFitxerMarkdownLocal(font, { nom: 'x' }))).toBe('NOMES_LECTURA');
    expect(await codi(desaWebpALaCarpetaLocal(font, 'foto.webp', bytesWebpFals()))).toBe('NOMES_LECTURA');
    expect(await codi(desaWebpIMouOriginalLocal(font, 'foto.png', bytesWebpFals()))).toBe('NOMES_LECTURA');
    expect((await llegixTextLocal(font, 'nota.md')).editable).toBe(false);
  });
});

describe('«Desar .webp i moure l’original»', () => {
  test('les dues col·lisions es comproven abans d’escriure res', async () => {
    const ambWebp = arbreMultimedia({}, { '00_inbox': { 'x.png': bytesPngFals(), 'x.webp': bytesWebpFals() } });
    const abans = instantaniaFalsa(ambWebp);
    const e1 = await errorDe(desaWebpIMouOriginalLocal(fontDesDeHandle(ambWebp), '00_inbox/x.png', bytesWebpFals(9)));
    expect(e1.codi).toBe('FITXER_JA_EXISTEIX');
    expect(e1.detall).toEqual({ ruta: '00_inbox/x.webp', quina: 'webp' });
    expect(instantaniaFalsa(ambWebp)).toEqual(abans);

    const ambOriginal = arbreMultimedia({}, { '00_inbox': { 'x.png': bytesPngFals() }, originals_raster_public: { 'x.png': bytesPngFals(3) } });
    const abans2 = instantaniaFalsa(ambOriginal);
    const e2 = await errorDe(desaWebpIMouOriginalLocal(fontDesDeHandle(ambOriginal), '00_inbox/x.png', bytesWebpFals()));
    expect(e2.codi).toBe('FITXER_JA_EXISTEIX');
    expect(e2.detall).toEqual({ ruta: 'originals_raster_public/x.png', quina: 'original' });
    expect(instantaniaFalsa(ambOriginal)).toEqual(abans2);
  });

  test('si el moviment falla, ORIGINAL_NO_MOGUT diu que la .webp sí que s’ha desat', async () => {
    const arrel = arbreMultimedia();
    arrel.corrompEscriptura({ ruta: 'originals_raster_public/esbos_festa_tibi.png' });
    const error = await errorDe(desaWebpIMouOriginalLocal(fontDesDeHandle(arrel), '00_inbox/esbos_festa_tibi.png', bytesWebpFals()));
    expect(error.codi).toBe('ORIGINAL_NO_MOGUT');
    expect(error.cause?.codi).toBe('MOVIMENT_NO_VERIFICAT');
    expect(error.detall).toEqual({ webp: '00_inbox/esbos_festa_tibi.webp', desti: 'originals_raster_public/esbos_festa_tibi.png' });
    expect(nodeFals(arrel, '00_inbox/esbos_festa_tibi.webp')).not.toBeNull();
    expect(contingutFals(arrel, '00_inbox/esbos_festa_tibi.png')).toEqual(bytesPngFals(64, 2));
  });

  test('no es crea cap carpeta fora d’originals_raster_public i no s’oferix per a un original ja arxivat', async () => {
    const arrel = new CarpetaFalsa('c', { a: { b: { 'x.png': bytesPngFals() } } });
    const font = fontDesDeHandle(arrel);
    const r = await desaWebpIMouOriginalLocal(font, 'a/b/x.png', bytesWebpFals());
    expect(r.original.ruta).toBe('originals_raster_public/b/x.png');
    expect(arrel.registre.filter((e) => e[0] === 'getDirectoryHandle' && e[2].create).map((e) => e[1]))
      .toEqual(['originals_raster_public', 'originals_raster_public/b']);
    expect(await codi(desaWebpIMouOriginalLocal(font, 'originals_raster_public/b/x.png', bytesWebpFals()))).toBe('PARAMETRES_INVALIDS');
    expect(await codi(desaWebpIMouOriginalLocal(font, 'a/b/x.webp', bytesWebpFals()))).toBe('PARAMETRES_INVALIDS');
    expect(await codi(desaWebpIMouOriginalLocal(font, 'a/b/y.png', bytesPngFals()))).toBe('NO_ES_WEBP');
  });

  test('un moviment públic no pot crear carpetes noves', async () => {
    const arrel = arbreMultimedia();
    const font = fontDesDeHandle(arrel);
    expect(await codi(font.mou('00_inbox/nota.md', 'originals_raster_public/nou/nota.md'))).toBe('CARPETA_NO_TROBADA');
    expect(nodeFals(arrel, 'originals_raster_public/nou')).toBeNull();
  });
});

describe('cap blob: perillós', () => {
  test('mimeDeVisorLocal mai torna HTML, XHTML, JS, SVG ni XML, i el registre d’URL els refusa', () => {
    const perillosos = ['text/html', 'application/xhtml+xml', 'text/javascript', 'image/svg+xml', 'application/xml', 'text/xml', 'text/plain'];
    const extensions = ['html', 'htm', 'xhtml', 'svg', 'js', 'mjs', 'css', 'xml', 'md', 'txt', 'json', 'vcf', 'log', 'canvas', 'csv', 'yml', 'png', 'pdf', 'mp4', 'mp3', 'exe', 'shtml'];
    for (const ext of extensions) expect(perillosos).not.toContain(mimeDeVisorLocal(`x.${ext}`));
    for (const mime of perillosos) expect(MIMES_VISOR_LOCAL.has(mime)).toBe(false);
    const urlApi = { createObjectURL: () => 'blob:x', revokeObjectURL: () => {} };
    const registre = creaRegistreUrlsLocals({ urlApi });
    for (const ext of ['html', 'svg', 'js', 'xml']) {
      expect(registre.crea(new Blob(['<script>'], { type: mimeDeRuta(`x.${ext}`) }))).toBeNull();
      expect(registre.crea(new Blob(['<script>'], { type: `${mimeDeRuta(`x.${ext}`)};charset=utf-8` }))).toBeNull();
    }
    expect(registre.vives).toBe(0);
  });

  test('font.fitxer d’un .html o d’un .svg torna un Blob de descàrrega, mai text/html ni image/svg+xml', async () => {
    const arrel = new CarpetaFalsa('x', { 'a.html': '<script>alert(1)</script>', 'b.svg': '<svg onload="x()"/>' });
    expect(nodeFals(arrel, 'a.html')).toBeInstanceOf(FitxerFals);
    const font = fontDesDeHandle(arrel);
    expect((await font.fitxer('a.html')).type).toBe('application/octet-stream');
    expect((await font.fitxer('b.svg')).type).toBe('application/octet-stream');
  });
});

/* Gauntlet 261029_1858 (llavors de Gemini i Codex) · QA-A02, QA-A03 i QA-A05. */
describe('QA-A02 · moure verifica el CONTINGUT per a qualsevol mida abans d’esborrar l’origen', () => {
  test('més de 50 MiB, la còpia de la mateixa mida i un byte diferent: MOVIMENT_NO_VERIFICAT i l’origen es conserva', async () => {
    const mida = 50 * 1024 * 1024 + 1024;
    const gran = new Uint8Array(mida);
    for (let i = 0; i < mida; i += 4093) gran[i] = i & 0xff;
    const arrel = new CarpetaFalsa('v', { a: { 'video.mp4': gran }, b: {} }, { midaTros: 4 * 1024 * 1024 });
    arrel.corrompEscriptura({ ruta: 'b/video.mp4', mode: 'altera' });
    const error = await errorDe(fontDesDeHandle(arrel).mou('a/video.mp4', 'b/video.mp4'));
    expect(error.codi).toBe('MOVIMENT_NO_VERIFICAT');
    expect(Buffer.compare(nodeFals(arrel, 'a/video.mp4').contingut, gran)).toBe(0);
    expect(nodeFals(arrel, 'b/video.mp4')).toBeNull();
    expect(removeEntries(arrel).map((e) => e[1])).toEqual(['b/video.mp4']);
    /* Mai sencer en memòria: cap arrayBuffer() del fitxer, només trossos de com a molt 4 MiB. */
    expect(arrel.registre.filter((e) => e[0] === 'arrayBuffer')).toEqual([]);
    const trossos = arrel.registre.filter((e) => e[0] === 'llegeixTros');
    expect(trossos.length).toBe(2 * Math.ceil(mida / MIDA_TROS_VERIFICACIO_LOCAL));
    expect(trossos.every(([, , inici, fi]) => fi - inici > 0 && fi - inici <= MIDA_TROS_VERIFICACIO_LOCAL)).toBe(true);
    expect(MIDA_TROS_VERIFICACIO_LOCAL).toBeGreaterThanOrEqual(1024 * 1024);
    expect(MIDA_TROS_VERIFICACIO_LOCAL).toBeLessThanOrEqual(4 * 1024 * 1024);
  });

  test('l’origen canvia després de verificar i abans d’esborrar-lo: CONFLICTE_DISC, la còpia s’esborra i l’editat es queda', async () => {
    const arrel = arbreMultimedia();
    const nota = nodeFals(arrel, '00_inbox/nota.md');
    const getFile = nota.getFile.bind(nota);
    let crides = 0;
    nota.getFile = async () => {
      crides += 1;
      /* 1a: la còpia; 2a: la verificació; 3a: la recomprovació just abans d'esborrar. */
      if (crides === 3) nota.modificaDesDeFora('# Editada just ara\n');
      return getFile();
    };
    expect(await codi(fontDesDeHandle(arrel).mou('00_inbox/nota.md', 'documents_i_pdfs/nota.md'))).toBe('CONFLICTE_DISC');
    expect(textFals(arrel, '00_inbox/nota.md')).toBe('# Editada just ara\n');
    expect(nodeFals(arrel, 'documents_i_pdfs/nota.md')).toBeNull();
  });

  test('oblidar la font (eixida de sessió) atura la còpia i la verificació: cap tros més i la còpia s’esborra', async () => {
    const arrel = arbreMultimedia({ midaTros: 5 });
    const font = fontDesDeHandle(arrel);
    arrel.enLlegirTros = ({ index }) => {
      if (index === 1) oblidaFont(font);
    };
    expect(await codi(font.mou('00_inbox/nota.md', 'documents_i_pdfs/nota.md'))).toBe('FONT_OBLIDADA');
    expect(arrel.registre.filter((e) => e[0] === 'write')).toHaveLength(2);
    expect(arrel.registre.filter((e) => e[0] === 'llegeixTros')).toEqual([]);

    const dos = arbreMultimedia();
    const font2 = fontDesDeHandle(dos);
    const nota = nodeFals(dos, '00_inbox/nota.md');
    const getFile = nota.getFile.bind(nota);
    let crides = 0;
    nota.getFile = async () => {
      crides += 1;
      if (crides === 2) oblidaFont(font2);
      return getFile();
    };
    expect(await codi(font2.mou('00_inbox/nota.md', 'documents_i_pdfs/nota.md'))).toBe('FONT_OBLIDADA');
    expect(dos.registre.filter((e) => e[0] === 'llegeixTros')).toEqual([]);
    expect(nodeFals(dos, 'documents_i_pdfs/nota.md')).toBeNull();
    expect(textFals(dos, '00_inbox/nota.md')).toBe('# Nota\n\nHola, poble.\n');
  });

  test('si no es pot comparar (lectura de la còpia o de l’origen que falla, API absent): MOVIMENT_INCOMPLET, cap esborrat', async () => {
    const senseSlice = (arrel) => {
      const nota = nodeFals(arrel, '00_inbox/nota.md');
      const getFile = nota.getFile.bind(nota);
      nota.getFile = async () => {
        const fitxer = await getFile();
        Object.defineProperty(fitxer, 'slice', { configurable: true, value: undefined });
        return fitxer;
      };
    };
    const casos = [
      (arrel) => arrel.injectaFallada('llegeixTros', { ruta: 'documents_i_pdfs/nota.md' }),
      (arrel) => arrel.injectaFallada('llegeixTros', { ruta: '00_inbox/nota.md' }),
      senseSlice
    ];
    for (const prepara of casos) {
      const arrel = arbreMultimedia();
      prepara(arrel);
      const error = await errorDe(fontDesDeHandle(arrel).mou('00_inbox/nota.md', 'documents_i_pdfs/nota.md'));
      expect(error.codi).toBe('MOVIMENT_INCOMPLET');
      expect(error.detall).toEqual({
        origen: '00_inbox/nota.md', desti: 'documents_i_pdfs/nota.md', copiaConservada: 'documents_i_pdfs/nota.md', motiu: 'SENSE_VERIFICAR'
      });
      expect(textFals(arrel, '00_inbox/nota.md')).toBe('# Nota\n\nHola, poble.\n');
      expect(textFals(arrel, 'documents_i_pdfs/nota.md')).toBe('# Nota\n\nHola, poble.\n');
      expect(removeEntries(arrel)).toEqual([]);
    }
  });
});

describe('QA-A03 · la versió esperada d’un text es comprova dins de la cua, just abans d’escriure', () => {
  test('dues escriptures encuades amb la mateixa expectativa: la primera desa i la segona dona CONFLICTE_DISC', async () => {
    const arrel = arbreMultimedia();
    const font = fontDesDeHandle(arrel);
    const llegit = await llegixTextLocal(font, 'llegeix-me.txt');
    const esperat = { sobreescriu: true, modificatEsperat: llegit.modificat, midaEsperada: llegit.mida };
    const [primera, segona] = await Promise.allSettled([
      escriuTextLocal(font, 'llegeix-me.txt', 'primera', esperat),
      escriuTextLocal(font, 'llegeix-me.txt', 'segona', esperat)
    ]);
    expect(primera.status).toBe('fulfilled');
    expect(primera.value.modificat).toBe(nodeFals(arrel, 'llegeix-me.txt').modificat);
    expect([segona.status, segona.reason?.codi]).toEqual(['rejected', 'CONFLICTE_DISC']);
    expect(textFals(arrel, 'llegeix-me.txt')).toBe('primera');
    expect(arrel.registre.filter((e) => e[0] === 'createWritable')).toHaveLength(1);
  });

  test('un canvi de fora mentre l’escriptura espera a la cua: CONFLICTE_DISC i el text de fora es queda', async () => {
    const arrel = arbreMultimedia();
    const font = fontDesDeHandle(arrel);
    const llegit = await llegixTextLocal(font, 'llegeix-me.txt');
    let solta;
    const porta = new Promise((resol) => {
      solta = resol;
    });
    const consulta = arrel.queryPermission.bind(arrel);
    let bloqueja = true;
    arrel.queryPermission = async (opcions) => {
      if (bloqueja) {
        bloqueja = false;
        await porta;
      }
      return consulta(opcions);
    };
    /* Un moviment ocupa la cua (espera el permís); el desat entra darrere. */
    const mou = font.mou('00_inbox/nano_vinyeta.png', 'documents_i_pdfs/nano_vinyeta.png');
    await new Promise((resol) => setTimeout(resol, 0));
    const desa = codi(escriuTextLocal(font, 'llegeix-me.txt', 'meu', { sobreescriu: true, modificatEsperat: llegit.modificat, midaEsperada: llegit.mida }));
    await new Promise((resol) => setTimeout(resol, 0));
    nodeFals(arrel, 'llegeix-me.txt').modificaDesDeFora('editat per Obsidian\n');
    solta();
    await mou;
    expect(await desa).toBe('CONFLICTE_DISC');
    expect(textFals(arrel, 'llegeix-me.txt')).toBe('editat per Obsidian\n');
  });

  test('la mateixa data però una altra mida també és conflicte; un tipus estrany, PARAMETRES_INVALIDS', async () => {
    const arrel = arbreMultimedia();
    const font = fontDesDeHandle(arrel);
    const llegit = await llegixTextLocal(font, 'llegeix-me.txt');
    nodeFals(arrel, 'llegeix-me.txt').modificaDesDeFora('canviat sense canviar la data\n', { modificat: llegit.modificat });
    const error = await errorDe(escriuTextLocal(font, 'llegeix-me.txt', 'meu', { sobreescriu: true, modificatEsperat: llegit.modificat, midaEsperada: llegit.mida }));
    expect(error.codi).toBe('CONFLICTE_DISC');
    expect(error.detall).toEqual({ modificat: llegit.modificat, mida: 30 });
    expect(await codi(font.escriu('llegeix-me.txt', new Uint8Array(1), { sobreescriu: true, midaEsperada: llegit.mida }))).toBe('CONFLICTE_DISC');
    expect(await codi(font.escriu('llegeix-me.txt', new Uint8Array(1), { sobreescriu: true, modificatEsperat: 'ahir' }))).toBe('PARAMETRES_INVALIDS');
    expect(await codi(escriuTextLocal(font, 'llegeix-me.txt', 'x', { sobreescriu: true, midaEsperada: -1 }))).toBe('PARAMETRES_INVALIDS');
    expect(textFals(arrel, 'llegeix-me.txt')).toBe('canviat sense canviar la data\n');
    expect(arrel.registre.filter((e) => e[0] === 'createWritable')).toEqual([]);
  });
});

const INVISIBLES = Object.freeze(['\u0000', '\u0007', '\u001f', '\u007f', '\u0085', '\u009f', '‪', '‮', '⁦', '⁩', '‏', '؜']);

describe('QA-A05 · cap ruta que canvia el disc porta invisibles; llegir-les i obrir-les, sí', () => {
  test.each(INVISIBLES.map((c) => [c.codePointAt(0).toString(16).padStart(4, '0').toUpperCase(), c]))('U+%s', async (_, c) => {
    const nom = `fitxer${c}gnp.md`;
    const carpeta = `carpeta${c}x`;
    const arrel = arbreMultimedia({}, { [nom]: 'amagat\n', [carpeta]: { 'dins.md': 'dins\n', 'foto.png': bytesPngFals() } });
    const abans = instantaniaFalsa(arrel);
    const font = fontDesDeHandle(arrel);
    const crides = {
      escriu: font.escriu(`00_inbox/n${c}.md`, new Uint8Array(1)),
      escriuDinsDeCarpeta: font.escriu(`${carpeta}/nou.md`, new Uint8Array(1)),
      mouOrigen: font.mou(nom, 'documents_i_pdfs/net.md'),
      mouDesti: font.mou('00_inbox/nota.md', `${carpeta}/nota.md`),
      mouNomDesti: font.mou('00_inbox/nota.md', `documents_i_pdfs/no${c}ta.md`),
      reanomena: font.reanomena(nom, 'net'),
      reanomenaDinsDeCarpeta: font.reanomena(`${carpeta}/dins.md`, 'fora'),
      creaCarpeta: font.creaCarpeta(`nova${c}`),
      creaCarpetaDins: font.creaCarpeta(`${carpeta}/sub`),
      elimina: font.elimina(nom),
      eliminaCarpeta: font.elimina(carpeta),
      escriuTextLocal: escriuTextLocal(font, nom, 'x', { sobreescriu: true }),
      creaFitxerMarkdownLocal: creaFitxerMarkdownLocal(font, { carpeta, nom: 'nou' }),
      desaWebpALaCarpetaLocal: desaWebpALaCarpetaLocal(font, `00_inbox/f${c}.webp`, bytesWebpFals()),
      desaWebpIMouOriginalLocal: desaWebpIMouOriginalLocal(font, `${carpeta}/foto.png`, bytesWebpFals())
    };
    for (const [operacio, crida] of Object.entries(crides)) {
      const error = await errorDe(crida);
      expect([operacio, error.codi, error.detall]).toEqual([operacio, 'RUTA_INVALIDA', { motiu: 'CARACTERS_INVISIBLES' }]);
    }
    expect(instantaniaFalsa(arrel)).toEqual(abans);
    expect(arrel.consultes).toEqual([]);
    expect(arrel.peticions).toEqual([]);
    expect(esRutaEscrivibleLocal(nom)).toBe(false);
    expect(potMoureOriginalRaster(`${carpeta}/foto.png`)).toBe(false);
    /* La lectura dels noms que ja hi són continua: es llisten, es lligen i s'obrin (sense editor). */
    expect(esRutaSeguraLocal(nom)).toBe(true);
    expect((await font.llista()).map((e) => e.ruta)).toEqual(expect.arrayContaining([nom, `${carpeta}/dins.md`, `${carpeta}/foto.png`]));
    expect(new TextDecoder().decode(await font.llig(nom))).toBe('amagat\n');
    expect((await font.info(`${carpeta}/dins.md`)).mida).toBe(5);
    expect((await font.fitxer(`${carpeta}/foto.png`)).type).toBe('image/png');
    const llegit = await llegixTextLocal(font, nom);
    expect([llegit.text, llegit.editable]).toEqual(['amagat\n', false]);
  });

  test('els noms nets de sempre continuen sent escrivibles', () => {
    for (const ruta of ['00_inbox/nota.md', 'café/festa major.png', 'a/b/c.webp']) expect(esRutaEscrivibleLocal(ruta)).toBe(true);
  });
});

describe('contracte i frontera', () => {
  const llegix = (nom) => readFileSync(new URL(`./${nom}`, import.meta.url), 'utf8');
  const FONTS = ['motorMultimediaLocal.js', 'bibliotecaCarpetesLocals.js', 'suggerimentPobleLocal.js'];
  const t = (...trossos) => trossos.join('');

  test('cada codi que llança el motor és a CODIS_ERROR_ARXIU_LOCAL, i cada codi de la llista es fa servir', () => {
    const font = llegix('motorMultimediaLocal.js');
    const llancats = new Set([...font.matchAll(/falla\(\s*'([A-Z_0-9]+)'/g)].map((m) => m[1]));
    expect([...llancats].filter((c) => !CODIS_ERROR_ARXIU_LOCAL.includes(c))).toEqual([]);
    expect(CODIS_ERROR_ARXIU_LOCAL.filter((c) => !llancats.has(c))).toEqual([]);
    expect(new Set(CODIS_ERROR_ARXIU_LOCAL).size).toBe(CODIS_ERROR_ARXIU_LOCAL.length);
  });

  test('els tres mòduls no importen els carrils privats ni parlen amb la xarxa ni amb l’emmagatzematge web', () => {
    const especificador = /(?:\bfrom\s*|\bimport\s*\(\s*)(['"])([^'"\n]+)\1/g;
    const prohibits = [
      t('fet', 'ch('), t('XMLHttp', 'Request'), t('send', 'Beacon'), t('local', 'Storage'), t('session', 'Storage'),
      t('inner', 'HTML'), t('dangerously', 'SetInnerHTML'), t('con', 'sole.'), t('ev', 'al('), t('new Fun', 'ction')
    ];
    for (const nom of FONTS) {
      const font = llegix(nom);
      const especificadors = [...font.matchAll(especificador)].map((m) => m[2]);
      expect(especificadors.filter((e) => new RegExp(t('gest', 'oria|trac', 'tors')).test(e))).toEqual([]);
      for (const patro of prohibits) expect(font.includes(patro), `${nom}: ${patro}`).toBe(false);
    }
    expect(llegix('bibliotecaCarpetesLocals.js')).not.toMatch(/^import\s/m);
  });

  test('cap removeEntry amb recursive al codi del motor', () => {
    expect(llegix('motorMultimediaLocal.js')).not.toMatch(new RegExp(t('recur', 'sive\\s*:\\s*true')));
  });
});
