// @vitest-environment node
/* Arbre Genealògic · xifrat local opcional (P1-81 / IDEA-253). WebCrypto de
   Node (globalThis.crypto.subtle) i l'IndexedDB fals de les proves: el que es
   mira és el que arriba al «disc», no només la memòria. Iteracions de proves
   (1000), com MIN_ITERACIONS_PROVES del cofre. Dades sintètiques. */
import { describe, expect, test } from 'vitest';
import { creaIdbFals } from '../../../utils/__fixtures__/navegadorFals.js';
import { creaMagatzemIdb } from '../../../utils/magatzemLocal.js';
import { ANY, ARA, complet, persona, rel } from './__fixtures__/arbreSintetic.js';
import {
  NOM_BASE, VERSIO_BASE, activaXifrat, carregaEstatGenealogia, creaMagatzemGenealogia, desaArbre, desaCofre, desaMeta,
  desactivaXifrat, obreCofre, obreCofreAmbClau, parametresXifrat
} from '../magatzem.js';
import { netejaArbre, netejaPersona, netejaRelacio, netejaEntrevista } from './model.js';
import { BYTES_IV, MIN_ITERACIONS, aBase64, deBase64, derivaClau, desxifra, exigixFrase, nousParametres, xifra } from './xifratLocal.js';

const FRASE = 'quatre paraules ben llargues';
const PROVES = { iteracions: MIN_ITERACIONS };
const crea = (idb) => creaMagatzemGenealogia({ idb, navegador: null, Canal: null, anyActual: ANY });

async function ambArbre() {
  const fals = creaIdbFals();
  const magatzem = crea(fals.idb);
  const c = complet([persona(1, { nom: 'Vicenta', cognom1: 'Ferrer', naixement: '1908' }), persona(2, { nom: 'Pere', cognom1: 'Ferrer' })], [rel(10, 'progenitor', 1, 2)]);
  await desaArbre(magatzem, { ...c, entrevista: { arbreId: c.arbre.id, pas: 1, respostes: { casa: 'Ca Ferrer' }, completada: false, modificada: ARA } }, { activa: true });
  await desaMeta(magatzem, 'avis', { acceptatA: ARA, versio: 1 });
  return { fals, magatzem, original: await magatzem.bolca() };
}
const disc = (fals) => Object.fromEntries(['arbres', 'persones', 'relacions', 'entrevistes', 'meta', 'cofre'].map((s) => [s, fals.files(NOM_BASE, s)]));
const capgira = (b64, posicio = 0) => {
  const bytes = deBase64(b64);
  bytes[posicio] ^= 1;
  return aBase64(bytes);
};

describe('el sobre (xifratLocal.js)', () => {
  test('la clau derivada no és extraïble: exportKey rebutja', async () => {
    const clau = await derivaClau(FRASE, nousParametres(MIN_ITERACIONS).sal, MIN_ITERACIONS);
    expect(clau.extractable).toBe(false);
    expect(clau.algorithm).toMatchObject({ name: 'AES-GCM', length: 256 });
    expect([...clau.usages].sort()).toEqual(['decrypt', 'encrypt']);
    await expect(globalThis.crypto.subtle.exportKey('raw', clau)).rejects.toThrow();
  });

  test('la regla de la frase: la del cofre de la Gestoria (12 caràcters o 4 paraules, variada i no previsible)', () => {
    expect(() => exigixFrase('curta')).toThrow(expect.objectContaining({ codi: 'frase-curta' }));
    for (const repetida of ['aaaaaaaaaaaa', '111111111111', 'abababababab']) {
      expect(() => exigixFrase(repetida), repetida).toThrow(expect.objectContaining({ codi: 'frase-repetida' }));
    }
    for (const previsible of ['123456789012', 'abcdefghijkl', 'aaa bbb ccc ddd']) {
      expect(() => exigixFrase(previsible), previsible).toThrow(expect.objectContaining({ codi: 'frase-previsible' }));
    }
    expect(() => exigixFrase(12)).toThrow(expect.objectContaining({ codi: 'frase-invalida' }));
    expect(() => exigixFrase('x'.repeat(1025))).toThrow(expect.objectContaining({ codi: 'frase-llarga' }));
    expect(exigixFrase(FRASE)).toBe(FRASE);
  });

  test('cada xifrat porta un IV nou; un byte canviat o una altra AAD fan fallar l’autenticació', async () => {
    const clau = await derivaClau(FRASE, nousParametres(MIN_ITERACIONS).sal, MIN_ITERACIONS);
    const a = await xifra(clau, { nom: 'Vicenta' });
    const b = await xifra(clau, { nom: 'Vicenta' });
    expect(deBase64(a.iv)).toHaveLength(BYTES_IV);
    expect(a.iv).not.toBe(b.iv);
    expect(await desxifra(clau, a)).toEqual({ nom: 'Vicenta' });
    const falla = expect.objectContaining({ codi: 'frase-incorrecta' });
    await expect(desxifra(clau, { ...a, ct: capgira(a.ct) })).rejects.toThrow(falla);
    await expect(desxifra(clau, { ...a, iv: capgira(a.iv) })).rejects.toThrow(falla);
    await expect(desxifra(clau, a, 'sdp.altra.v1')).rejects.toThrow(falla);
    await expect(desxifra(clau, { ...a, iv: 'no és base64' })).rejects.toThrow(expect.objectContaining({ codi: 'sobre-invalid' }));
  });
});

describe('la base xifrada (magatzem.js)', () => {
  test('anada i tornada: el que s’obri és igual al bolcat d’abans', async () => {
    const { magatzem, original } = await ambArbre();
    expect(original.persones.map((p) => p.nom)).toEqual(['Vicenta', 'Pere']);
    await activaXifrat(magatzem, FRASE, PROVES);
    const { memoria } = await obreCofre(magatzem, FRASE, { anyActual: ANY });
    expect(memoria.persistent).toBe(false);
    expect(await memoria.bolca()).toEqual(original);
    const estat = await carregaEstatGenealogia(memoria);
    expect(estat.complet.persones.map((p) => p.nom)).toEqual(['Vicenta', 'Pere']);
    expect(estat.xifrat).toBe(false);
  });

  test('a IndexedDB no queda cap dada en clar: els stores buits i un sol registre al cofre', async () => {
    const { fals, magatzem } = await ambArbre();
    await activaXifrat(magatzem, FRASE, PROVES);
    const bolcat = await magatzem.bolca();
    const text = JSON.stringify(bolcat) + JSON.stringify(disc(fals));
    expect(text).not.toMatch(/Vicenta|Ferrer|Pere|1908/);
    for (const store of ['persones', 'relacions', 'arbres', 'entrevistes']) {
      expect(bolcat[store], store).toHaveLength(0);
      expect(fals.files(NOM_BASE, store), store).toHaveLength(0);
    }
    expect(fals.files(NOM_BASE, 'cofre')).toHaveLength(1);
    expect(Object.keys(fals.files(NOM_BASE, 'cofre')[0]).sort()).toEqual(['ct', 'id', 'iv', 'v']);
    expect(fals.files(NOM_BASE, 'meta').map((r) => r.clau)).toEqual(['xifrat']);
    expect(await parametresXifrat(magatzem)).toMatchObject({ versio: 1, iteracions: MIN_ITERACIONS });
    expect((await carregaEstatGenealogia(magatzem)).xifrat).toBe(true);
    expect(fals.registre.obrides.every(([nom, versio]) => nom === NOM_BASE && versio === VERSIO_BASE)).toBe(true);
  });

  test('una frase errònia rebutja amb frase-incorrecta i no toca el disc', async () => {
    const { fals, magatzem } = await ambArbre();
    await activaXifrat(magatzem, FRASE, PROVES);
    const abans = disc(fals);
    await expect(obreCofre(magatzem, 'una altra frase incorrecta')).rejects.toThrow(expect.objectContaining({ codi: 'frase-incorrecta' }));
    await expect(desactivaXifrat(magatzem, 'una altra frase incorrecta')).rejects.toThrow(expect.objectContaining({ codi: 'frase-incorrecta' }));
    expect(disc(fals)).toEqual(abans);
  });

  test('el cofre alterat al disc (text xifrat o IV) no s’obri', async () => {
    const { fals, magatzem } = await ambArbre();
    await activaXifrat(magatzem, FRASE, PROVES);
    const [sobre] = fals.files(NOM_BASE, 'cofre');
    for (const alterat of [{ ...sobre, ct: capgira(sobre.ct, 3) }, { ...sobre, iv: capgira(sobre.iv, 5) }]) {
      await magatzem.desa('cofre', alterat);
      await expect(obreCofre(magatzem, FRASE)).rejects.toThrow(expect.objectContaining({ codi: 'frase-incorrecta' }));
    }
    await expect(magatzem.desa('cofre', { ...sobre, ct: 'això no és base64' })).rejects.toThrow(TypeError);
    await expect(magatzem.desa('cofre', { ...sobre, id: 'un-altre' })).rejects.toThrow(TypeError);
  });

  test('desaCofre: IV nou a cada desat, i el que s’hi escriu en memòria arriba xifrat', async () => {
    const { fals, magatzem } = await ambArbre();
    const clau = await activaXifrat(magatzem, FRASE, PROVES);
    const { memoria, sal } = await obreCofreAmbClau(magatzem, clau, { anyActual: ANY });
    await desaCofre(magatzem, memoria, clau, { sal });
    const primer = fals.files(NOM_BASE, 'cofre')[0].iv;
    const vigent = await carregaEstatGenealogia(memoria);
    await desaArbre(memoria, { ...vigent.complet, persones: [...vigent.complet.persones, persona(3, { nom: 'Rosalia' })] });
    await desaCofre(magatzem, memoria, clau, { sal });
    const segon = fals.files(NOM_BASE, 'cofre')[0].iv;
    expect(segon).not.toBe(primer);
    expect(JSON.stringify(disc(fals))).not.toMatch(/Rosalia|Vicenta/);
    const { memoria: tornada } = await obreCofre(magatzem, FRASE, { anyActual: ANY });
    expect((await tornada.totes('persones')).map((p) => p.nom)).toContain('Rosalia');
    await expect(desaCofre(magatzem, memoria, clau, { sal: nousParametres(MIN_ITERACIONS).sal })).rejects.toThrow(expect.objectContaining({ codi: 'xifrat-canviat' }));
  });

  test('desaCofre amb `iv`: si el cofre del disc no és el que es va llegir, no escriu res', async () => {
    const { fals, magatzem } = await ambArbre();
    const clau = await activaXifrat(magatzem, FRASE, PROVES);
    const obert = await obreCofreAmbClau(magatzem, clau, { anyActual: ANY });
    expect(obert.iv).toBe(fals.files(NOM_BASE, 'cofre')[0].iv);
    const nou = await desaCofre(magatzem, obert.memoria, clau, { sal: obert.sal, iv: obert.iv });
    expect(nou).toBe(fals.files(NOM_BASE, 'cofre')[0].iv);
    const abans = disc(fals);
    await expect(desaCofre(magatzem, obert.memoria, clau, { sal: obert.sal, iv: obert.iv }))
      .rejects.toThrow(expect.objectContaining({ camp: 'arbre', clau: 'desactualitzat' }));
    expect(disc(fals)).toEqual(abans);
  });

  test('amb la base xifrada, desaArbre al disc es nega a escriure en clar', async () => {
    const { fals, magatzem } = await ambArbre();
    await activaXifrat(magatzem, FRASE, PROVES);
    const c = complet([persona(7, { nom: 'Vicenta' })]);
    await expect(desaArbre(magatzem, c)).rejects.toThrow(expect.objectContaining({ codi: 'xifrat-tancat' }));
    expect(fals.files(NOM_BASE, 'persones')).toEqual([]);
    await expect(activaXifrat(magatzem, FRASE, PROVES)).rejects.toThrow(expect.objectContaining({ codi: 'ja-xifrat' }));
  });

  test('activaXifrat demana una frase vàlida i no toca res si és curta', async () => {
    const { fals, magatzem, original } = await ambArbre();
    await expect(activaXifrat(magatzem, 'curta', PROVES)).rejects.toThrow(expect.objectContaining({ codi: 'frase-curta' }));
    expect(await magatzem.bolca()).toEqual(original);
    expect(fals.files(NOM_BASE, 'cofre')).toEqual([]);
  });

  test('desactivaXifrat torna la base en clar, tal com era, i sense cofre', async () => {
    const { fals, magatzem, original } = await ambArbre();
    await activaXifrat(magatzem, FRASE, PROVES);
    await desactivaXifrat(magatzem, FRASE);
    expect(await magatzem.bolca()).toEqual(original);
    expect(fals.files(NOM_BASE, 'cofre')).toEqual([]);
    expect(await parametresXifrat(magatzem)).toBeNull();
  });

  test('una base de la versió 1 (en clar) puja a la 2 amb el cofre buit i les dades intactes', async () => {
    const fals = creaIdbFals();
    const v1 = creaMagatzemIdb({
      nom: NOM_BASE, versio: 1, idb: fals.idb, navegador: null, Canal: null,
      stores: { arbres: { clau: 'id' }, persones: { clau: 'id', indexs: ['arbreId'] }, relacions: { clau: 'id', indexs: ['arbreId'] }, entrevistes: { clau: 'arbreId' }, meta: { clau: 'clau' } },
      llistaBlanca: { arbres: netejaArbre, persones: (r) => netejaPersona(r, { anyActual: ANY }), relacions: netejaRelacio, entrevistes: netejaEntrevista, meta: ['clau', 'valor'] }
    });
    const c = complet([persona(1, { nom: 'Vicenta' })]);
    await v1.desaTots('arbres', [c.arbre]);
    await v1.desaTots('persones', c.persones);
    const migrat = await crea(fals.idb).bolca();
    expect(migrat.cofre).toEqual([]);
    expect(migrat.persones).toEqual(c.persones);
    expect(fals.registre.obrides.map(([, versio]) => versio)).toContain(VERSIO_BASE);
    expect(VERSIO_BASE).toBe(2);
  });
});
