// @vitest-environment node
/* Gestoria · documents · catàleg de tipus. La taula del MAPA §3.2, congelada:
   37 tipus amb QUÈ ÉS, PER A QUÈ SERVIX i QUAN ES POT ESBORRAR, àmbit,
   sensibilitat, protecció i una regla de conservació ben formada. */
import { describe, expect, test } from 'vitest';
import {
  AMBITS, AVIS_TERMINI, CATALEG_TIPUS, DATES_BASE, ETIQUETES_FET, PROTECCIONS, REGLES, SENSIBILITATS, TIPUS_DESCONEGUT,
  esTipus, fitxaTipus, teTermini, tipusDocument
} from './catalegTipus.js';

const perId = (id) => CATALEG_TIPUS.find((t) => t.id === id);

describe('la taula congelada', () => {
  test('37 tipus amb id únic i tots els camps de text', () => {
    expect(CATALEG_TIPUS).toHaveLength(37);
    expect(new Set(CATALEG_TIPUS.map((t) => t.id)).size).toBe(37);
    for (const t of CATALEG_TIPUS) {
      for (const camp of ['id', 'nom', 'queEs', 'perAQueServix', 'quanEsborrar']) {
        expect(typeof t[camp], `${t.id}.${camp}`).toBe('string');
        expect(t[camp].trim().length, `${t.id}.${camp}`).toBeGreaterThan(1);
      }
      expect(AMBITS, t.id).toContain(t.ambit);
      expect(SENSIBILITATS, t.id).toContain(t.sensibilitat);
      expect(PROTECCIONS, t.id).toContain(t.protegit);
    }
  });

  test('els textos de la taula són literals: l’apòstrof recte, com al MAPA', () => {
    expect(perId('rebut-pagament').quanEsborrar).toBe("Quan ja no el necessite ni la factura ni l'expedient; com a mínim 4 anys");
    expect(perId('pressupost').quanEsborrar).toBe("El no acceptat, un any després de caducar [PROPOSTA]; l'acceptat, amb la seua factura");
    const textos = CATALEG_TIPUS.flatMap((t) => [t.nom, t.queEs, t.perAQueServix, t.quanEsborrar].map((text) => [t.id, text]));
    expect(textos.filter(([, text]) => text.includes('’'))).toEqual([]);
  });

  test('tot està congelat: la taula, cada tipus, les regles i els fets condicionals', () => {
    expect(Object.isFrozen(CATALEG_TIPUS)).toBe(true);
    for (const t of CATALEG_TIPUS) {
      expect(Object.isFrozen(t), t.id).toBe(true);
      expect(Object.isFrozen(t.conservacio), t.id).toBe(true);
      for (const r of t.conservacio) {
        expect(Object.isFrozen(r), t.id).toBe(true);
        if (r.si) expect(Object.isFrozen(r.si), t.id).toBe(true);
      }
    }
    expect(() => { CATALEG_TIPUS[0].nom = 'un altre'; }).toThrow(TypeError);
  });

  test('cada regla de conservació és ben formada i només fa servir dates i fets coneguts', () => {
    for (const t of CATALEG_TIPUS) {
      expect(t.conservacio.length, t.id).toBeGreaterThan(0);
      const fixes = t.conservacio.filter((r) => ['mai', 'persona', 'arxiu'].includes(r.regla));
      // Una regla fixa va sola: no es barreja amb terminis ni condicions.
      if (fixes.length) expect(t.conservacio, t.id).toHaveLength(1);
      for (const r of t.conservacio) {
        expect(REGLES, t.id).toContain(r.regla);
        if (r.regla === 'termini') {
          expect(Object.keys(DATES_BASE), t.id).toContain(r.des);
          expect(Number.isInteger(r.anys) && r.anys >= 0, t.id).toBe(true);
          for (const fet of r.si ?? []) expect(Object.keys(ETIQUETES_FET), `${t.id}: ${fet}`).toContain(fet);
        }
        if (r.regla === 'condicio') {
          expect(Object.keys(ETIQUETES_FET), `${t.id}: ${r.fet}`).toContain(r.fet);
          expect(typeof r.valor, t.id).toBe('boolean');
        }
      }
    }
  });
});

describe('els principis', () => {
  test('el desconegut no es proposa mai: regla «mai», protegit sempre, sensibilitat desconeguda', () => {
    const d = perId(TIPUS_DESCONEGUT);
    expect(d.conservacio).toEqual([{ regla: 'mai' }]);
    expect(d.protegit).toBe('sempre');
    expect(d.sensibilitat).toBe('desconeguda');
  });

  test('P3 · identitat, escriptures i herència, marca, salut i el llibre fiscal estan protegits sempre', () => {
    for (const id of ['document-identitat', 'titol-propietat', 'expedient-marca', 'incapacitat-temporal', 'mostra-salut', 'llibre-verifactu']) {
      expect(perId(id).protegit, id).toBe('sempre');
    }
    // Les subvencions vives i les factures, fins al venciment.
    for (const id of ['subvencio', 'factura-emesa', 'factura-rebuda', 'declaracio-renda']) expect(perId(id).protegit, id).toBe('fins-venciment');
  });

  test('la salut i les credencials: només les decidix la persona, mai l’app', () => {
    for (const t of CATALEG_TIPUS.filter((x) => ['salut', 'credencial'].includes(x.sensibilitat))) {
      expect(t.conservacio, t.id).toEqual([{ regla: 'persona' }]);
      expect(t.protegit, t.id).toBe('sempre');
    }
  });

  test('la factura: el termini més llarg sempre aplicable (6) i 10 si hi ha bases negatives', () => {
    expect(perId('factura-emesa').conservacio).toEqual([
      { regla: 'termini', des: 'exercici', anys: 6 },
      { regla: 'termini', des: 'exercici', anys: 10, si: ['basesNegatives'] }
    ]);
    expect(perId('factura-rebuda').conservacio).toEqual(perId('factura-emesa').conservacio);
  });
});

describe('les consultes', () => {
  test('tipusDocument: un id estrany torna el desconegut, mai s’inventa un tipus', () => {
    expect(tipusDocument('factura-emesa').id).toBe('factura-emesa');
    for (const estrany of ['factura', '', null, undefined, 42, 'constructor', '__proto__']) {
      expect(tipusDocument(estrany).id, String(estrany)).toBe(TIPUS_DESCONEGUT);
      expect(esTipus(estrany), String(estrany)).toBe(false);
    }
  });

  test('fitxaTipus: tot termini amb data diu «a verificar amb la gestoria»; la resta, tal qual', () => {
    for (const t of CATALEG_TIPUS) {
      const fitxa = fitxaTipus(t.id);
      if (teTermini(t.id)) expect(fitxa.quanEsborrar, t.id).toBe(`${t.quanEsborrar} (${AVIS_TERMINI})`);
      else expect(fitxa.quanEsborrar, t.id).toBe(t.quanEsborrar);
      expect(fitxa).toMatchObject({ id: t.id, queEs: t.queEs, perAQueServix: t.perAQueServix, ambit: t.ambit });
    }
    expect(AVIS_TERMINI).toBe('a verificar amb la gestoria');
    expect(fitxaTipus('factura-emesa').quanEsborrar).toMatch(/a verificar amb la gestoria\)$/);
    expect(fitxaTipus('llibre-verifactu').quanEsborrar).not.toMatch(/a verificar/);
  });
});
