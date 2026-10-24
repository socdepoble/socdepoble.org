// @vitest-environment node
/* Lector de notícies · l'API pública mínima de les fonts personals (SN,
   261003) sobre el magatzem de veres i el navegador fals de P2, amb el port
   de la llavor per a les categories. Adreces d'example.org: cap dada personal. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import { creaCanalFals, creaIdbFals, creaLocksFals } from '../../utils/__fixtures__/navegadorFals.js';
import { creaFontNoticies } from './fontNoticies.js';
import { TRAMS_GESTIO, creaFontsPersonals, destinacioDe, llevaDelMagatzem } from './fontsPersonals.js';
import { creaAdaptadorLlavor } from './llavor/fontLlavor.js';
import { creaMagatzemLector } from './magatzem.js';
import { idFontPersonal } from './nucli/index.js';

const URL_FONT = 'https://www.example.org/noticies';
const ARA = Date.UTC(2026, 9, 3, 10, 30);

function prepara({ ambPort = true } = {}) {
  const idb = creaIdbFals();
  const locks = creaLocksFals();
  const canal = creaCanalFals();
  const oberts = [];
  const obriMagatzem = () => {
    const magatzem = creaMagatzemLector({ idb: idb.idb, navegador: { locks }, Canal: canal.Canal });
    oberts.push(magatzem);
    return magatzem;
  };
  let ports = 0;
  const font = () => {
    ports += 1;
    return ambPort ? creaFontNoticies(creaAdaptadorLlavor({ ara: ARA })) : null;
  };
  const api = creaFontsPersonals({ obriMagatzem, font });
  return { idb, canal, api, oberts, obriMagatzem, ports: () => ports };
}

const vius = [];
afterEach(() => {
  while (vius.length) vius.pop().tanca();
});

describe('creaFontsPersonals', () => {
  test('sense obriMagatzem no es pot crear', () => {
    expect(() => creaFontsPersonals({})).toThrow(TypeError);
  });

  test('les categories són les del port (id i nom), i el port es crea una sola vegada', async () => {
    const { api, ports } = prepara();
    expect(ports()).toBe(0);
    expect(await api.categories()).toEqual([
      { id: 'ajuntament', nom: 'Ajuntament i serveis' }, { id: 'festes', nom: 'Cultura i festes' },
      { id: 'camp', nom: 'Camp i temps' }, { id: 'esports', nom: 'Esports' }
    ]);
    await api.categories();
    expect(ports()).toBe(1);
    expect(api.nomMaxim).toBe(80);
  });

  test('sense port, cap categoria', async () => {
    expect(await prepara({ ambPort: false }).api.categories()).toEqual([]);
  });

  test('afig una font pendent: es desa, es llista i cada operació tanca el seu magatzem', async () => {
    const { api, idb, oberts } = prepara();
    const font = await api.afigFontPersonal({ url: URL_FONT, nom: '  La Veu  ', categoriaId: 'festes' });
    expect(font).toEqual({ id: idFontPersonal(URL_FONT), nom: 'La Veu', url: URL_FONT, categoriaId: 'festes' });
    expect(await api.llistaFontsPersonals()).toEqual([font]);
    expect(oberts.length).toBe(2);
    expect(idb.registre.obertes).toBe(0);
    /* Cap bloqueig demanat: el magatzem de pas no reté la pestanya escriptora. */
    expect(oberts.every((magatzem) => magatzem.mode === 'lliure')).toBe(true);
  });

  test('una adreça que no és web, sense nom, una categoria inventada o repetida: un Error amb el motiu, el codi i el camp', async () => {
    const { api } = prepara();
    await expect(api.afigFontPersonal({ url: 'javascript:alert(1)', nom: 'X' }))
      .rejects.toMatchObject({ codi: 'url-no-web', camp: 'url', message: expect.stringMatching(/http o https/) });
    await expect(api.afigFontPersonal({ url: '', nom: 'X' })).rejects.toMatchObject({ codi: 'url', camp: 'url' });
    await expect(api.afigFontPersonal({ url: URL_FONT, nom: ' ' })).rejects.toMatchObject({ codi: 'nom', camp: 'nom', message: 'Cal un nom per a la font.' });
    await expect(api.afigFontPersonal({ url: URL_FONT, nom: 'X', categoriaId: 'inventada' })).rejects.toMatchObject({ codi: 'categoria', camp: 'categoria' });
    await api.afigFontPersonal({ url: URL_FONT, nom: 'X' });
    await expect(api.afigFontPersonal({ url: URL_FONT, nom: 'Una altra' })).rejects.toMatchObject({ codi: 'repetida', camp: null });
    expect((await api.llistaFontsPersonals()).map((f) => f.nom)).toEqual(['X']);
  });

  test('sense port, una categoria no es pot validar: es rebutja', async () => {
    const { api } = prepara({ ambPort: false });
    await expect(api.afigFontPersonal({ url: URL_FONT, nom: 'X', categoriaId: 'festes' })).rejects.toMatchObject({ codi: 'categoria' });
    expect((await api.afigFontPersonal({ url: URL_FONT, nom: 'X' })).categoriaId).toBeNull();
  });

  test('lleva una font; la segona vegada no hi és', async () => {
    const { api } = prepara();
    const font = await api.afigFontPersonal({ url: URL_FONT, nom: 'X' });
    expect(await api.llevaFontPersonal(font.id)).toBe(true);
    expect(await api.llevaFontPersonal(font.id)).toBe(false);
    expect(await api.llistaFontsPersonals()).toEqual([]);
  });

  test.each([
    ['sense IndexedDB', () => null],
    ['IndexedDB que no s’obri (navegació privada de Firefox)', () => creaIdbFals({ fallaObrir: true }).idb]
  ])('correcció SN-R2 · %s: afegir i llevar llancen «no-persistent» i no escriuen res', async (_que, idb) => {
    const oberts = [];
    const api = creaFontsPersonals({
      obriMagatzem: () => {
        const magatzem = creaMagatzemLector({ idb: idb(), navegador: { locks: creaLocksFals() }, Canal: creaCanalFals().Canal });
        oberts.push(magatzem);
        return magatzem;
      }
    });
    await expect(api.afigFontPersonal({ url: URL_FONT, nom: 'La Veu' }))
      .rejects.toMatchObject({ codi: 'no-persistent', camp: null, message: expect.stringMatching(/^Este navegador no deixa guardar dades/) });
    await expect(api.llevaFontPersonal(idFontPersonal(URL_FONT))).rejects.toMatchObject({ codi: 'no-persistent' });
    expect(await api.llistaFontsPersonals()).toEqual([]);
    expect(oberts.length).toBe(3);
    expect(oberts.every((magatzem) => magatzem.persistent === false)).toBe(true);
  });

  test('un Lector obert en una altra pestanya se n’assabenta per l’avís de canvi, sense cap valor al canal', async () => {
    const { api, canal, obriMagatzem } = prepara();
    const lector = obriMagatzem();
    vius.push(lector);
    const avisos = [];
    lector.subscriu((avis) => avisos.push(avis));
    await api.afigFontPersonal({ url: URL_FONT, nom: 'La Veu' });
    await new Promise((resolve) => { setTimeout(resolve, 5); });
    expect(avisos).toContainEqual({ tipus: 'canvi', store: 'lector', local: false });
    expect(JSON.stringify(canal.enviats)).not.toMatch(/example|Veu/);
    expect((await lector.llegixPersonals()).fonts.map((f) => f.nom)).toEqual(['La Veu']);
  });
});

/* Peça C (ordre del Mestre, 261007, prompt 261007_1628) · Una sola
   implementació de llevar una font personal (llevaDelMagatzem): la de l'API
   (llevaFontPersonal, amb la guarda del disc) i la de la vista
   (useFontsPersonals.lleva) hi passen. Abans cadascuna en portava una còpia. */
describe('llevaDelMagatzem: l’única manera de llevar una font personal', () => {
  test('lleva en una transacció i torna si l’ha llevada i el registre net', async () => {
    const { api, obriMagatzem } = prepara();
    const font = await api.afigFontPersonal({ url: URL_FONT, nom: 'La Veu' });
    const magatzem = obriMagatzem();
    vius.push(magatzem);
    expect(await llevaDelMagatzem(magatzem, font.id)).toMatchObject({ llevada: true, registre: { fonts: [] } });
    expect(await llevaDelMagatzem(magatzem, font.id)).toMatchObject({ llevada: false, registre: { fonts: [] } });
    expect(await api.llistaFontsPersonals()).toEqual([]);
  });

  test('l’API i el hook de la vista la fan servir; cap còpia de la lògica', () => {
    const llig = (fitxer) => readFileSync(path.join(process.cwd(), 'src/apps/lector', fitxer), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    const api = llig('fontsPersonals.js');
    const vista = llig('useFontsPersonals.js');
    expect(api.match(/llevaPersonal\(/g)).toHaveLength(1);
    expect(api).toMatch(/return \(await llevaDelMagatzem\(magatzem, id\)\)\.llevada;/);
    expect(vista).not.toMatch(/llevaPersonal|actualitzaPersonals/);
    expect(vista).toMatch(/await llevaDelMagatzem\(magatzem, id\)/);
  });
});

describe('destinacioDe: la forma de la plataforma', () => {
  /* Actualitzada a posta (261024 Lector): ordre del Mestre de les 15:05, la gestió de fonts ja no és
     cap pàgina (/fonts/colleccio): les fonts viuen a l'arbre de les notícies, i els trams porten a la
     font nova, dins de la seua carpeta (o de «Hui», sense carpeta). */
  test('nomMaxim, categories i afig, que torna l’id, el nom i els trams de la font a l’arbre de les notícies', async () => {
    const { api } = prepara();
    const desti = destinacioDe(api);
    expect(Object.isFrozen(desti)).toBe(true);
    expect(desti.nomMaxim).toBe(80);
    expect((await desti.categories()).map((c) => c.id)).toEqual(['ajuntament', 'festes', 'camp', 'esports']);
    expect(await desti.afig({ url: URL_FONT, nom: 'La Veu', categoriaId: 'camp' }))
      .toEqual({ id: idFontPersonal(URL_FONT), nom: 'La Veu', trams: ['noticies', 'camp', idFontPersonal(URL_FONT)] });
    const sense = 'https://example.org/sense-carpeta';
    expect(await desti.afig({ url: sense, nom: 'Sense' }))
      .toEqual({ id: idFontPersonal(sense), nom: 'Sense', trams: ['noticies', 'hui', idFontPersonal(sense)] });
    expect(TRAMS_GESTIO).toEqual(['noticies']);
    await expect(desti.afig({ url: 'ftp://example.org', nom: 'X' })).rejects.toMatchObject({ codi: 'url-no-web' });
  });
});
