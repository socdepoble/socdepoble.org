// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { creaIdbFals } from '../../../utils/__fixtures__/navegadorFals.js';
import { activaArbre, actualitzaArbre, carregaArbre, carregaMeta, creaMagatzemGenealogia, desaArbre, esborraArbre } from '../magatzem.js';
import { ANY, ARA, complet, persona, rel, uid } from './__fixtures__/arbreSintetic.js';
import { detectaDuplicats, fusionaDuplicats } from './duplicats.js';

const base = () => complet([
  persona(1, { nom: 'Sintètica', cognom1: 'Mostra', naixement: '1901', lloc: 'Poble inventat', notes: 'Nota de prova A' }),
  persona(2, { nom: 'Sintetica', cognom1: 'Mostra', naixement: '1901-02-03', lloc: 'Poble inventat', notes: 'Nota de prova B' }),
  persona(3, { nom: 'Diferent', cognom1: 'Mostra', naixement: '1901-02-03', lloc: 'Poble inventat' }),
  persona(4, { nom: 'Progenitor de prova' })
], [rel(5, 'progenitor', 4, 1), rel(6, 'progenitor', 4, 2)], { arrelId: uid(2) });

const parell = { conserva: uid(2), duplicada: uid(1), motiu: 'lloc-any' };
const fusiona = (arbre, confirmada = true) => fusionaDuplicats(arbre, { ...parell, confirmada, ara: ARA, anyActual: ANY });

describe('deduplicació local assistida', () => {
  it('suggerix de manera estable sense crear parentiu ni retornar dades de persones', () => {
    const arbre = base();
    expect(detectaDuplicats(arbre)).toEqual([parell]);
    expect(detectaDuplicats({ ...arbre, persones: [...arbre.persones].reverse() })).toEqual([parell]);
    expect(JSON.stringify(detectaDuplicats(arbre))).not.toMatch(/Sintètica|Mostra|1901|Poble inventat/);
    expect(arbre.relacions).toHaveLength(2);
  });

  it('demana confirmació i reassigna fonts, arrel i vincles en IndexedDB', async () => {
    const { idb } = creaIdbFals();
    const a = creaMagatzemGenealogia({ idb, navegador: null, Canal: null, anyActual: ANY });
    const b = creaMagatzemGenealogia({ idb, navegador: null, Canal: null, anyActual: ANY });
    const arbre = base();
    const id = arbre.arbre.id;
    await desaArbre(a, arbre);
    await expect(actualitzaArbre(a, id, (vigent) => fusiona(vigent, false))).rejects.toThrow(TypeError);
    expect(await carregaArbre(b, id)).toEqual(arbre);

    await actualitzaArbre(a, id, (vigent) => fusiona(vigent));
    const desat = await carregaArbre(b, id);
    expect(desat.persones.map((p) => p.id)).toEqual([uid(2), uid(3), uid(4)]);
    expect(desat.persones[0]).toMatchObject({
      naixement: { any: 1901, mes: 2, dia: 3 }, notes: 'Nota de prova B\n\nNota de prova A'
    });
    expect(desat.arbre.arrelId).toBe(uid(2));
    expect(desat.relacions.map(({ de, a }) => [de, a])).toEqual([[uid(4), uid(2)]]);
    expect(detectaDuplicats(desat)).toEqual([]);
    await expect(actualitzaArbre(a, id, (vigent) => fusiona(vigent))).rejects.toMatchObject({ clau: 'duplicat-conflicte' });
    expect(await carregaArbre(b, id)).toEqual(desat);
  });

  it('rebutja un conflicte de dades i una unió que convertiria algú en avantpassat propi', () => {
    const conflictiu = base();
    conflictiu.persones[0].viva = 'si';
    conflictiu.persones[1].viva = 'no';
    expect(() => fusiona(conflictiu)).toThrow(TypeError);
    const avantpassat = base();
    avantpassat.relacions = [rel(5, 'progenitor', 1, 4), rel(6, 'progenitor', 4, 2)];
    expect(() => fusiona(avantpassat)).toThrow(TypeError);
  });

  it('la restauració i l’esborrat rebutgen una preimatge canviada per una altra pestanya', async () => {
    const { idb } = creaIdbFals();
    const crea = () => creaMagatzemGenealogia({ idb, navegador: null, Canal: null, anyActual: ANY });
    const a = crea();
    const b = crea();
    const inicial = base();
    const id = inicial.arbre.id;
    await desaArbre(a, inicial, { activa: true, nou: true });
    const esperat = await carregaArbre(a, id);
    await actualitzaArbre(b, id, (vigent) => ({ ...vigent, arbre: { ...vigent.arbre, titol: 'Títol concurrent' } }));
    await expect(desaArbre(a, inicial, { esperat, activa: true })).rejects.toMatchObject({ clau: 'desactualitzat' });
    await expect(esborraArbre(a, id, esperat)).rejects.toMatchObject({ clau: 'desactualitzat' });
    await expect(desaArbre(a, inicial, { nou: true })).rejects.toMatchObject({ clau: 'repetit' });
    expect((await carregaArbre(a, id)).arbre.titol).toBe('Títol concurrent');
    await esborraArbre(b, id);
    await expect(activaArbre(a, id)).rejects.toMatchObject({ clau: 'desactualitzat' });
    expect((await carregaMeta(a)).arbreActiu).toBeNull();
    await expect(actualitzaArbre(a, id, () => inicial)).rejects.toMatchObject({ clau: 'desactualitzat' });
    expect(await carregaArbre(a, id)).toBeNull();
  });
});
