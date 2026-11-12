// @vitest-environment node
/* P0-24 (G2120-07, marató 261101_2143) · La pila de capes de l'Arrere d'Android. */
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  ABSORCIO_ENRERE_MS, _reiniciaPilaEnrere, capesEnrereObertes, escoltaCapesEnrere, obriCapaEnrere, tancaCapaSuperior,
  teCapaEnrereDamunt
} from './pilaEnrere.js';

afterEach(() => { _reiniciaPilaEnrere(); vi.restoreAllMocks(); });

describe('pilaEnrere', () => {
  test('obri A i B: Arrere tanca B, després A, i amb la pila buida no consumix (el natiu navega)', () => {
    const ordre = [];
    const lleva = {};
    lleva.A = obriCapaEnrere(() => { ordre.push('A'); lleva.A(); });
    lleva.B = obriCapaEnrere(() => { ordre.push('B'); lleva.B(); });
    expect(capesEnrereObertes()).toBe(2);
    expect(tancaCapaSuperior(1000)).toBe(true);
    expect(tancaCapaSuperior(2000)).toBe(true);
    expect(ordre).toEqual(['B', 'A']);
    expect(capesEnrereObertes()).toBe(0);
    expect(tancaCapaSuperior(3000)).toBe(false);
  });

  test('llevar una capa del mig (desmuntatge fora d’ordre) no lleva la de dalt', () => {
    const tancaB = vi.fn();
    const llevaA = obriCapaEnrere(() => {});
    obriCapaEnrere(tancaB);
    llevaA();
    expect(capesEnrereObertes()).toBe(1);
    expect(tancaCapaSuperior(1000)).toBe(true);
    expect(tancaB).toHaveBeenCalledTimes(1);
  });

  /* Corrector 261102 (ARB-B3B-03) · Llevar una capa del mig no desfà l'absorció
     de la de dalt: abans, la tornava a cridar als 10 ms (doble onTanca). */
  test('llevar una capa del mig dins de la finestra no torna a cridar la de dalt', () => {
    const tancaC = vi.fn();
    obriCapaEnrere(() => {});
    const llevaB = obriCapaEnrere(() => {});
    obriCapaEnrere(tancaC);
    expect(tancaCapaSuperior(1000)).toBe(true);
    llevaB();
    expect(capesEnrereObertes()).toBe(2);
    expect(tancaCapaSuperior(1010)).toBe(true);
    expect(tancaC).toHaveBeenCalledTimes(1);
    // Passada la finestra, la de dalt que encara no s'ha tancat es torna a demanar.
    expect(tancaCapaSuperior(1000 + ABSORCIO_ENRERE_MS)).toBe(true);
    expect(tancaC).toHaveBeenCalledTimes(2);
  });

  test('un segon Arrere dins de la finestra no torna a tancar la mateixa capa (cap doble navigate(-1))', () => {
    const tanca = vi.fn();
    obriCapaEnrere(tanca);
    expect(tancaCapaSuperior(1000)).toBe(true);
    expect(tancaCapaSuperior(1000 + ABSORCIO_ENRERE_MS - 1)).toBe(true);
    expect(tanca).toHaveBeenCalledTimes(1);
    // Passada la finestra, la capa que no s'ha tancat (bloquejant, o ocupada) es torna a demanar.
    expect(tancaCapaSuperior(1000 + ABSORCIO_ENRERE_MS)).toBe(true);
    expect(tanca).toHaveBeenCalledTimes(2);
  });

  test('si la pila canvia (la capa obri una confirmació), la petició anterior ja no absorbix res', () => {
    const editor = vi.fn();
    obriCapaEnrere(editor);
    expect(tancaCapaSuperior(1000)).toBe(true);
    const llevaConfirma = obriCapaEnrere(() => llevaConfirma());
    expect(tancaCapaSuperior(1010)).toBe(true); // tanca la confirmació
    expect(capesEnrereObertes()).toBe(1);
    expect(tancaCapaSuperior(1020)).toBe(true); // torna a demanar l'editor, dins dels 400 ms
    expect(editor).toHaveBeenCalledTimes(2);
  });

  test('una capa que llança continua consumint l’Arrere i ho diu a la consola; qui lleva és idempotent', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const lleva = obriCapaEnrere(() => { throw new Error('trencada'); });
    expect(tancaCapaSuperior(1000)).toBe(true);
    expect(error).toHaveBeenCalledTimes(1);
    expect(String(error.mock.calls[0][0])).toMatch(/pilaEnrere/);
    lleva(); lleva();
    expect(capesEnrereObertes()).toBe(0);
  });

  test('els oients reben el nombre de capes en cada canvi; un de trencat no talla els altres', () => {
    const vist = [];
    escoltaCapesEnrere(() => { throw new Error('x'); });
    const deixa = escoltaCapesEnrere((n) => vist.push(n));
    const lleva = obriCapaEnrere(() => {});
    lleva();
    lleva(); // ja no hi era: cap avís
    deixa();
    obriCapaEnrere(() => {});
    expect(vist).toEqual([1, 0]);
  });

  test('una tanca o un oient que no són funcions no entren enlloc', () => {
    obriCapaEnrere(null)();
    obriCapaEnrere('tanca');
    expect(capesEnrereObertes()).toBe(0);
    expect(() => escoltaCapesEnrere(undefined)()).not.toThrow();
    expect(tancaCapaSuperior(1000)).toBe(false);
  });

  test('P0-24b (R21) · teCapaEnrereDamunt: cert només per a una capa apuntada amb una altra damunt', () => {
    const a = () => {};
    const b = () => {};
    const llevaA = obriCapaEnrere(a);
    expect(teCapaEnrereDamunt(a)).toBe(false);
    const llevaB = obriCapaEnrere(b);
    expect(teCapaEnrereDamunt(a)).toBe(true);
    expect(teCapaEnrereDamunt(b)).toBe(false);
    // Una funció que no és a la pila (o cap) no té res damunt: el seu Escape, com sempre.
    expect(teCapaEnrereDamunt(() => {})).toBe(false);
    expect(teCapaEnrereDamunt(null)).toBe(false);
    llevaB();
    expect(teCapaEnrereDamunt(a)).toBe(false);
    llevaA();
    expect(teCapaEnrereDamunt(a)).toBe(false);
  });

  test('P0-24b (R21, verificació adversària) · teCapaEnrereDamunt només compta les capes del mateix àmbit', () => {
    const instanciaA = {};
    const instanciaB = {};
    const menuA = () => {};
    const menuB = () => {};
    const dialegA = () => {};
    obriCapaEnrere(menuA, instanciaA);
    obriCapaEnrere(menuB, instanciaB);
    // La capa de l'altra instància és més amunt a la pila, però el seu Escape no arriba mai ací.
    expect(teCapaEnrereDamunt(menuA)).toBe(false);
    obriCapaEnrere(dialegA, instanciaA);
    expect(teCapaEnrereDamunt(menuA)).toBe(true);
    expect(teCapaEnrereDamunt(menuB)).toBe(false);
    // Sense àmbit (la SPA), totes les capes són de la mateixa: el LIFO de sempre.
    const sota = () => {};
    const dalt = () => {};
    _reiniciaPilaEnrere();
    obriCapaEnrere(sota);
    obriCapaEnrere(dalt, undefined);
    expect(teCapaEnrereDamunt(sota)).toBe(true);
    // L'Arrere natiu (una sola instància) no mira l'àmbit: tanca la de dalt.
    const tancades = [];
    _reiniciaPilaEnrere();
    obriCapaEnrere(() => tancades.push('A'), instanciaA);
    obriCapaEnrere(() => tancades.push('B'), instanciaB);
    expect(tancaCapaSuperior(1000)).toBe(true);
    expect(tancades).toEqual(['B']);
  });
});
