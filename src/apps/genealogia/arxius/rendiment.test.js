// @vitest-environment node
/* Arbre Genealògic · prompts i consultes amb un arbre al límit admés per la
   importació (MAX_PERSONES). Abans, la protecció de vius es calculava
   persona a persona i reindexava l'arbre sencer a cada crida: el cost era
   quadràtic i la pestanya es penjava. Ara el conjunt de vius es calcula una
   sola vegada. El llindar de temps és ample (màquines lentes de CI): un cost
   quadràtic amb 20.000 persones passaria de llarg dels segons. A més, la
   regla dels 100 anys no tapa una persona que la família diu que viu. */
import { describe, expect, test } from 'vitest';
import { ANY, complet, persona, rel, uid } from '../nucli/__fixtures__/arbreSintetic.js';
import { MAX_PERSONES } from '../nucli/index.js';
import { generaConsultes } from './consultes.js';
import { generaPrompt } from './prompts.js';

function arbreGran() {
  const persones = [];
  const relacions = [];
  for (let i = 1; i <= MAX_PERSONES; i += 1) {
    persones.push(persona(i, { nom: `Nom${i}`, cognom1: 'Exemple', sexe: i % 2 ? 'M' : 'F', naixement: String(1700 + (i % 300)), lloc: 'Poble Inventat' }));
    /* Cada persona parell és progenitora de la següent, i la 4 apadrina les primeres. */
    if (i % 2 === 0 && i < MAX_PERSONES) relacions.push(rel(100000 + i, 'progenitor', i, i + 1));
    if (i > 4 && i < 2000) relacions.push(rel(200000 + i, 'padri', 4, i));
  }
  return complet(persones, relacions, { arrelId: uid(4), poble: 'Poble Inventat' });
}

describe('arbres grans', () => {
  test(`generaPrompt i generaConsultes amb ${MAX_PERSONES} persones no tenen cost quadràtic`, () => {
    const arbre = arbreGran();
    const inici = performance.now();
    const prompt = generaPrompt('gps', arbre, { personaId: uid(4), anyActual: ANY });
    const consultes = generaConsultes(arbre, uid(5), { anyActual: ANY });
    const ms = performance.now() - inici;
    expect(prompt.ok).toBe(true);
    expect(consultes.ok).toBe(true);
    expect(ms).toBeLessThan(15000);
  }, 60000);
});

describe('la resposta «viu» guanya a la regla dels 100 anys', () => {
  test('una iaia marcada viva nascuda fa 100 anys no genera consultes ni ix al prompt', () => {
    const iaia = persona(1, { nom: 'Iaiaqz', cognom1: 'Centenariqz', sexe: 'F', naixement: String(ANY - 100), viva: 'si', lloc: 'Poble Inventat' });
    const fill = persona(2, { nom: 'Fill', cognom1: 'Exemple', sexe: 'M', naixement: '1900', viva: 'no' });
    const arbre = complet([iaia, fill], [rel(10, 'progenitor', 1, 2)], { arrelId: uid(2) });
    expect(generaConsultes(arbre, uid(1), { anyActual: ANY })).toEqual({ ok: false, motiu: 'persona-viva', consultes: [] });
    const prompt = generaPrompt('cerca-arxius', arbre, { personaId: uid(2), anyActual: ANY });
    expect(prompt.ok).toBe(true);
    expect(prompt.text).not.toContain('Iaiaqz');
    expect(prompt.text).not.toContain('Centenariqz');
    /* Sense la marca, la regla literal (nascuda fa 100 anys o més) ja no la protegix. */
    const desconeguda = complet([{ ...iaia, viva: 'desconegut' }, fill], [rel(10, 'progenitor', 1, 2)], { arrelId: uid(2) });
    expect(generaConsultes(desconeguda, uid(1), { anyActual: ANY }).ok).toBe(true);
  });
});
