/* 261026 (prompt 261026_1615, tasques 1 i 2) · El registre del menú «Compartir»
   (compartirNatiu.js): un sol lot pendent, congelat i estable per a
   useSyncExternalStore, que només pren la conversa triada. Cada cas carrega un
   mòdul nou: el registre és d'estat de mòdul. Tot és sintètic. */
import { afterEach, describe, expect, test, vi } from 'vitest';

const carrega = async () => {
  vi.resetModules();
  return import('./compartirNatiu.js');
};
const foto = (nom = 'captura.png') => new File(['px'], nom, { type: 'image/png' });

describe('lliurar un lot', () => {
  test('sense res per lliurar torna null, no guarda cap lot i no avisa ningú', async () => {
    const r = await carrega();
    const oient = vi.fn();
    r.subscriuCompartit(oient);
    expect(r.lliuraCompartit()).toBeNull();
    expect(r.lliuraCompartit({})).toBeNull();
    expect(r.lliuraCompartit({ fitxers: [], text: '   \n\t ', rebutjats: 0 })).toBeNull();
    expect(r.lliuraCompartit({ fitxers: 'no és llista', text: 42, rebutjats: -3 })).toBeNull();
    expect(r.lliuraCompartit({ rebutjats: Number.NaN })).toBeNull();
    expect(r.compartitPendent()).toBeNull();
    expect(oient).not.toHaveBeenCalled();
  });

  test('només compten Blob i File; la resta i els que passen de 10 van a rebutjats', async () => {
    const r = await carrega();
    const bons = Array.from({ length: 12 }, (_, i) => (i % 2 ? foto(`f${i}.png`) : new Blob([String(i)], { type: 'image/jpeg' })));
    const entrada = [bons[0], 'file:///captura.png', { uri: 'x' }, null, ...bons.slice(1)];
    const id = r.lliuraCompartit({ fitxers: entrada, rebutjats: 2.9 });
    const lot = r.compartitPendent();
    expect(id).toBe(lot.id);
    expect(lot.fitxers).toHaveLength(r.MAX_FITXERS_COMPARTITS);
    // Identitat, no forma: dos File buits són «iguals» per a toEqual.
    expect(lot.fitxers.every((f, i) => f === bons[i])).toBe(true);
    // 2 del natiu (arrodonit avall) + 3 que no són fitxers + 2 que sobren.
    expect(lot.rebutjats).toBe(7);
    expect(lot.desti).toBeNull();
    // Tocar la llista d'entrada després no canvia el lot.
    entrada.length = 0;
    expect(r.compartitPendent().fitxers).toHaveLength(10);
  });

  test('el text arriba retallat d\'espais i tallat a 4096 caràcters', async () => {
    const r = await carrega();
    r.lliuraCompartit({ text: '  \n hola, veïnat \t ' });
    expect(r.compartitPendent().text).toBe('hola, veïnat');
    r.lliuraCompartit({ text: `   ${'a'.repeat(r.MAX_TEXT_COMPARTIT + 500)}   ` });
    expect(r.compartitPendent().text).toBe('a'.repeat(r.MAX_TEXT_COMPARTIT));
    expect(r.MAX_TEXT_COMPARTIT).toBe(4096);
  });

  test('un lot nou substituïx el que encara no s\'havia triat', async () => {
    const r = await carrega();
    const primer = r.lliuraCompartit({ fitxers: [foto('a.png')], text: 'vell' });
    const nou = foto('b.png');
    const segon = r.lliuraCompartit({ fitxers: [nou] });
    expect(segon).toBe(primer + 1);
    expect(r.compartitPendent()).toEqual({ id: segon, fitxers: [nou], text: '', rebutjats: 0, desti: null, propietari: null });
    expect(r.compartitPendent().fitxers[0]).toBe(nou);
  });
});

describe('la instantània', () => {
  test('és congelada i el mateix objecte fins al canvi següent', async () => {
    const r = await carrega();
    r.lliuraCompartit({ fitxers: [foto(), foto('b.png')], text: 'peu' });
    const abans = r.compartitPendent();
    expect(r.compartitPendent()).toBe(abans);
    expect(Object.isFrozen(abans) && Object.isFrozen(abans.fitxers)).toBe(true);
    expect(() => { abans.text = 'canviat'; }).toThrow(TypeError);
    expect(() => { abans.fitxers.push(foto('c.png')); }).toThrow(TypeError);
    // Un intent fallit de triar ni de prendre no la canvia.
    expect(r.triaDestiCompartit('')).toBe(false);
    expect(r.triaDestiCompartit(null)).toBe(false);
    expect(r.prenFitxerCompartit('7')).toBeNull();
    expect(r.compartitPendent()).toBe(abans);
    expect(r.triaDestiCompartit(7)).toBe(true);
    const despres = r.compartitPendent();
    expect(despres).not.toBe(abans);
    expect(despres.desti).toBe('7');
    expect(Object.isFrozen(despres) && Object.isFrozen(despres.fitxers)).toBe(true);
    expect(r.compartitPendent()).toBe(despres);
    expect(abans.desti).toBeNull();
  });
});

describe('prendre els fitxers i el text', () => {
  test('sense lot, triar torna false', async () => {
    const r = await carrega();
    expect(r.triaDestiCompartit('1')).toBe(false);
    expect(r.prenFitxerCompartit('1')).toBeNull();
    expect(r.prenTextCompartit('1')).toBe('');
  });

  test('només la conversa triada pren, amb el text de peu del primer fitxer i queden decreixent', async () => {
    const r = await carrega();
    const [a, b, c] = [foto('a.png'), foto('b.png'), foto('c.png')];
    r.lliuraCompartit({ fitxers: [a, b, c], text: 'mira la plaça' });
    // Abans de triar ningú no pren res.
    expect(r.prenFitxerCompartit('42')).toBeNull();
    r.triaDestiCompartit(42);
    expect(r.prenFitxerCompartit('41')).toBeNull();
    expect(r.prenFitxerCompartit(41)).toBeNull();
    expect(r.prenTextCompartit(42)).toBe('');
    // Número o cadena: es comparen com a String.
    const primer = r.prenFitxerCompartit('42');
    expect(primer).toEqual({ fitxer: a, peu: 'mira la plaça', queden: 2, lot: 1, desti: '42', propietari: null, generacio: 0 });
    expect(primer.fitxer).toBe(a);
    expect(r.compartitPendent().text).toBe('');
    const segon = r.prenFitxerCompartit(42);
    expect(segon).toMatchObject({ fitxer: b, peu: '', queden: 1 });
    expect(segon.fitxer).toBe(b);
    expect(r.compartitPendent().fitxers[0]).toBe(c);
    const tercer = r.prenFitxerCompartit('42');
    expect(tercer).toMatchObject({ fitxer: c, peu: '', queden: 0 });
    expect(tercer.fitxer).toBe(c);
    // L'últim fitxer s'emporta el lot.
    expect(r.compartitPendent()).toBeNull();
    expect(r.prenFitxerCompartit('42')).toBeNull();
  });

  test('un lot només de text: cap fitxer, el text es pren una sola vegada i el lot se\'n va', async () => {
    const r = await carrega();
    r.lliuraCompartit({ text: ' enllaç a la festa ' });
    expect(r.prenTextCompartit('fil-1')).toBe('');
    r.triaDestiCompartit('fil-1');
    expect(r.prenFitxerCompartit('fil-1')).toBeNull();
    expect(r.prenTextCompartit('fil-2')).toBe('');
    expect(r.prenTextCompartit('fil-1')).toBe('enllaç a la festa');
    expect(r.compartitPendent()).toBeNull();
    expect(r.prenTextCompartit('fil-1')).toBe('');
  });

  test('un lot només de rebutjats es queda fins que es descarta', async () => {
    const r = await carrega();
    expect(r.lliuraCompartit({ fitxers: ['content://no-llegible'], rebutjats: 1 })).toBe(1);
    const lot = r.compartitPendent();
    expect(lot).toMatchObject({ fitxers: [], text: '', rebutjats: 2 });
    expect(r.triaDestiCompartit('9')).toBe(true);
    expect(r.prenFitxerCompartit('9')).toBeNull();
    expect(r.prenTextCompartit('9')).toBe('');
    expect(r.compartitPendent()).toMatchObject({ rebutjats: 2, desti: '9' });
    r.descartaCompartit();
    expect(r.compartitPendent()).toBeNull();
  });
});

describe('els oients', () => {
  test('cada canvi avisa amb el lot nou; un oient que llança no talla els altres; desubscriure funciona', async () => {
    const r = await carrega();
    const trencat = vi.fn(() => { throw new Error('peta'); });
    const bo = vi.fn();
    const efimer = vi.fn();
    r.subscriuCompartit(trencat);
    r.subscriuCompartit(bo);
    const deixa = r.subscriuCompartit(efimer);
    expect(r.subscriuCompartit('no és funció')()).toBeUndefined();

    r.lliuraCompartit({ fitxers: [foto(), foto('b.png')], text: 'peu' });
    expect(bo).toHaveBeenLastCalledWith(r.compartitPendent());
    expect(trencat).toHaveBeenCalledTimes(1);
    expect(efimer).toHaveBeenCalledTimes(1);

    deixa();
    r.triaDestiCompartit('3');
    expect(bo).toHaveBeenLastCalledWith(expect.objectContaining({ desti: '3' }));
    r.prenFitxerCompartit('3');
    expect(bo.mock.lastCall[0].fitxers).toHaveLength(1);
    r.prenFitxerCompartit('3');
    expect(bo).toHaveBeenLastCalledWith(null);
    expect(bo).toHaveBeenCalledTimes(4);
    expect(trencat).toHaveBeenCalledTimes(4);
    expect(efimer).toHaveBeenCalledTimes(1);

    // Ni un descart sense lot ni un lliurament buit avisen.
    r.descartaCompartit();
    r.lliuraCompartit({ text: '   ' });
    expect(bo).toHaveBeenCalledTimes(4);

    r.lliuraCompartit({ text: 'només text' });
    r.triaDestiCompartit('3');
    r.prenTextCompartit('3');
    expect(bo).toHaveBeenLastCalledWith(null);
    r.lliuraCompartit({ rebutjats: 1 });
    r.descartaCompartit();
    expect(bo).toHaveBeenLastCalledWith(null);
    expect(bo).toHaveBeenCalledTimes(9);
  });
});

/* Gauntlet 261026_1615 (Codex C1615-01/02/03/08, Gemini G1615-00/04) · El lot
   és de qui tria la conversa, prendre un fitxer no el perd i la còpia nativa
   només s'allibera quan s'envia, es descarta, el lot se substituïx o no hi cap.
   Les rutes són inventades: l'alliberador és un vi.fn, cap pont de veres. */
const ruta = (nom) => `/natiu/${nom}.png`;
const lotAmbRutes = (...noms) => ({ fitxers: noms.map((nom) => foto(`${nom}.png`)), rutes: noms.map(ruta) });
const ambAlliberador = async () => {
  const r = await carrega();
  const allibera = vi.fn();
  r.registraAlliberadorCompartit(allibera);
  return { r, allibera };
};
/* Identitat, no forma: la posició de cada File dins dels originals (-1 si és un altre). */
const quins = (llista, originals) => llista.map((fitxer) => originals.indexOf(fitxer));

describe('C1615-01 · el lot és de qui tria la conversa', () => {
  test('un lot triat per A no el pren B ni una crida sense persona; A sí, i ningú no allibera res', async () => {
    const { r, allibera } = await ambAlliberador();
    const { fitxers, rutes } = lotAmbRutes('a', 'b');
    const [a, b] = fitxers;
    r.lliuraCompartit({ fitxers, rutes, text: 'per a A' });
    expect(r.triaDestiCompartit('5', 'A')).toBe(true);
    const triat = r.compartitPendent();
    expect(triat).toMatchObject({ desti: '5', propietari: 'A' });
    expect(r.prenFitxerCompartit('5', 'B')).toBeNull();
    // Un lot amb amo no és «de qualsevol»: sense persona tampoc es pren.
    expect(r.prenFitxerCompartit('5')).toBeNull();
    expect(r.prenFitxerCompartit('5', '')).toBeNull();
    expect(r.compartitPendent()).toBe(triat);
    const pres = r.prenFitxerCompartit('5', 'A');
    expect(pres).toEqual({ fitxer: a, peu: 'per a A', queden: 1, lot: 1, desti: '5', propietari: 'A', generacio: 0 });
    expect(pres.fitxer).toBe(a);
    expect(r.prenFitxerCompartit('5', 'B')).toBeNull();
    expect(r.prenFitxerCompartit('5', 'A').fitxer).toBe(b);
    expect(r.compartitPendent()).toBeNull();
    expect(allibera).not.toHaveBeenCalled();
  });

  test('el text d\'un lot triat per A tampoc el pren B; l\'amo es compara com a String', async () => {
    const r = await carrega();
    r.lliuraCompartit({ text: 'enllaç per a A' });
    r.triaDestiCompartit(3, 7);
    expect(r.compartitPendent()).toMatchObject({ desti: '3', propietari: '7' });
    expect(r.prenTextCompartit(3, 8)).toBe('');
    expect(r.prenTextCompartit(3)).toBe('');
    expect(r.compartitPendent()).toMatchObject({ text: 'enllaç per a A' });
    expect(r.prenTextCompartit('3', 7)).toBe('enllaç per a A');
    expect(r.compartitPendent()).toBeNull();
  });

  test('eixir amb feina en vol: el descart allibera els pendents i el fitxer que A tenia a la mà ja no torna', async () => {
    const { r, allibera } = await ambAlliberador();
    const { fitxers, rutes } = lotAmbRutes('a', 'b', 'c');
    r.lliuraCompartit({ fitxers, rutes, text: 'peu' });
    r.triaDestiCompartit('5', 'A');
    const pres = r.prenFitxerCompartit('5', 'A');
    expect(pres.fitxer).toBe(fitxers[0]);
    // XatContext: la sessió canvia mentre el compositor encara prepara la foto.
    r.descartaCompartit();
    expect(r.compartitPendent()).toBeNull();
    expect(allibera.mock.calls).toEqual([[[ruta('b'), ruta('c')]]]);
    // La preparació d'A s'avorta després del descart: el fitxer no torna...
    expect(r.tornaFitxerCompartit(pres)).toBe(false);
    expect(r.compartitPendent()).toBeNull();
    // ...i se n'allibera la còpia, una sola vegada encara que es torne a intentar.
    expect(allibera).toHaveBeenCalledTimes(2);
    expect(allibera).toHaveBeenLastCalledWith([ruta('a')]);
    expect(r.tornaFitxerCompartit(pres)).toBe(false);
    expect(allibera).toHaveBeenCalledTimes(2);
  });

  test('si A tenia a la mà l\'únic fitxer (ja no quedava lot), el descart igualment li impedix tornar', async () => {
    const { r, allibera } = await ambAlliberador();
    r.lliuraCompartit(lotAmbRutes('a'));
    r.triaDestiCompartit('5', 'A');
    const pres = r.prenFitxerCompartit('5', 'A');
    expect(r.compartitPendent()).toBeNull();
    // Sense lot pendent el descart no allibera res, però el que hi ha en vol caduca.
    r.descartaCompartit();
    expect(allibera).not.toHaveBeenCalled();
    expect(r.tornaFitxerCompartit(pres)).toBe(false);
    expect(r.compartitPendent()).toBeNull();
    expect(allibera.mock.calls).toEqual([[[ruta('a')]]]);
  });

  test('B entra i comparteix: el fitxer que A tenia en vol no es cola al lot de B', async () => {
    const { r, allibera } = await ambAlliberador();
    r.lliuraCompartit(lotAmbRutes('a', 'b'));
    r.triaDestiCompartit('5', 'A');
    const presA = r.prenFitxerCompartit('5', 'A');
    r.descartaCompartit();
    allibera.mockClear();
    const deB = lotAmbRutes('c');
    const idB = r.lliuraCompartit(deB);
    r.triaDestiCompartit('5', 'B');
    const delDeB = r.compartitPendent();
    expect(r.tornaFitxerCompartit(presA)).toBe(false);
    expect(r.compartitPendent()).toBe(delDeB);
    expect(delDeB).toMatchObject({ id: idB, desti: '5', propietari: 'B' });
    expect(quins(delDeB.fitxers, deB.fitxers)).toEqual([0]);
    expect(allibera.mock.calls).toEqual([[[ruta('a')]]]);
    // Cada descart puja la generació, també el que ja no trobava cap lot.
    expect(r.prenFitxerCompartit('5', 'B')).toMatchObject({ fitxer: deB.fitxers[0], generacio: 1 });
    r.descartaCompartit();
    r.descartaCompartit();
    r.lliuraCompartit(lotAmbRutes('d'));
    r.triaDestiCompartit('5', 'B');
    expect(r.prenFitxerCompartit('5', 'B').generacio).toBe(3);
  });
});

describe('C1615-02 · prendre un fitxer no el perd', () => {
  test('tornar-lo el posa al capdavant amb el seu peu, l\'ordre es manté i es torna a prendre el mateix File', async () => {
    const { r, allibera } = await ambAlliberador();
    const { fitxers, rutes } = lotAmbRutes('a', 'b', 'c');
    const id = r.lliuraCompartit({ fitxers, rutes, text: 'la plaça', rebutjats: 1 });
    r.triaDestiCompartit('5', 'A');
    const oient = vi.fn();
    r.subscriuCompartit(oient);
    const pres = r.prenFitxerCompartit('5', 'A');
    expect(quins(r.compartitPendent().fitxers, fitxers)).toEqual([1, 2]);
    expect(r.compartitPendent().text).toBe('');
    expect(r.tornaFitxerCompartit(pres)).toBe(true);
    const tornat = r.compartitPendent();
    expect(oient).toHaveBeenLastCalledWith(tornat);
    expect(tornat).toMatchObject({ id, text: 'la plaça', rebutjats: 1, desti: '5', propietari: 'A' });
    expect(quins(tornat.fitxers, fitxers)).toEqual([0, 1, 2]);
    expect(Object.isFrozen(tornat) && Object.isFrozen(tornat.fitxers)).toBe(true);
    const altra = r.prenFitxerCompartit('5', 'A');
    expect(altra.fitxer).toBe(pres.fitxer);
    expect(altra).toEqual(pres);
    expect(allibera).not.toHaveBeenCalled();
  });

  test('dos presos que tornen a l\'inrevés deixen la cua com estava, amb el peu al primer', async () => {
    const { r, allibera } = await ambAlliberador();
    const { fitxers, rutes } = lotAmbRutes('a', 'b', 'c');
    r.lliuraCompartit({ fitxers, rutes, text: 'peu' });
    r.triaDestiCompartit('5', 'A');
    const primer = r.prenFitxerCompartit('5', 'A');
    const segon = r.prenFitxerCompartit('5', 'A');
    expect(segon.peu).toBe('');
    expect(r.tornaFitxerCompartit(segon)).toBe(true);
    expect(r.compartitPendent().text).toBe('');
    expect(r.tornaFitxerCompartit(primer)).toBe(true);
    expect(quins(r.compartitPendent().fitxers, fitxers)).toEqual([0, 1, 2]);
    expect(r.compartitPendent().text).toBe('peu');
    const represos = [1, 2, 3].map(() => r.prenFitxerCompartit('5', 'A'));
    expect(quins(represos.map((p) => p.fitxer), fitxers)).toEqual([0, 1, 2]);
    expect(represos.map((p) => p.peu)).toEqual(['peu', '', '']);
    expect(represos.map((p) => p.queden)).toEqual([2, 1, 0]);
    expect(r.compartitPendent()).toBeNull();
    expect(allibera).not.toHaveBeenCalled();
  });

  test('tornar l\'últim fitxer refà el lot amb el mateix id, destí i amo', async () => {
    const { r, allibera } = await ambAlliberador();
    // Un lot anterior, substituït: l'id del bo no és 1.
    r.lliuraCompartit(lotAmbRutes('vell'));
    const { fitxers, rutes } = lotAmbRutes('a');
    const id = r.lliuraCompartit({ fitxers, rutes, text: 'només una' });
    expect(id).toBe(2);
    allibera.mockClear();
    r.triaDestiCompartit('5', 'A');
    const pres = r.prenFitxerCompartit('5', 'A');
    expect(r.compartitPendent()).toBeNull();
    expect(r.tornaFitxerCompartit(pres)).toBe(true);
    const refet = r.compartitPendent();
    expect(refet).toMatchObject({ id, text: 'només una', desti: '5', propietari: 'A' });
    expect(quins(refet.fitxers, fitxers)).toEqual([0]);
    expect(Object.isFrozen(refet) && Object.isFrozen(refet.fitxers)).toBe(true);
    // Continua sent d'A i de la conversa 5.
    expect(r.prenFitxerCompartit('5', 'B')).toBeNull();
    expect(r.prenFitxerCompartit('6', 'A')).toBeNull();
    expect(r.prenFitxerCompartit('5', 'A')).toEqual(pres);
    expect(allibera).not.toHaveBeenCalled();
  });

  test('un lot nou mentre el compositor tenia un fitxer: el fitxer no s\'hi cola i se n\'allibera la còpia', async () => {
    const { r, allibera } = await ambAlliberador();
    r.lliuraCompartit({ ...lotAmbRutes('a', 'b'), text: 'vell' });
    r.triaDestiCompartit('5', 'A');
    const pres = r.prenFitxerCompartit('5', 'A');
    const nou = lotAmbRutes('c');
    const idNou = r.lliuraCompartit(nou);
    // El lot substituït s'allibera sencer, menys el que és a la mà.
    expect(allibera.mock.calls).toEqual([[[ruta('b')]]]);
    expect(r.tornaFitxerCompartit(pres)).toBe(false);
    expect(allibera).toHaveBeenCalledTimes(2);
    expect(allibera).toHaveBeenLastCalledWith([ruta('a')]);
    expect(r.compartitPendent()).toEqual({ id: idNou, fitxers: [nou.fitxers[0]], text: '', rebutjats: 0, desti: null, propietari: null });
    expect(r.compartitPendent().fitxers[0]).toBe(nou.fitxers[0]);
  });

  test('tornar el que no és un pres no toca el lot ni allibera res', async () => {
    const { r, allibera } = await ambAlliberador();
    r.lliuraCompartit(lotAmbRutes('a'));
    const lot = r.compartitPendent();
    for (const dolent of [null, undefined, {}, { fitxer: ruta('a'), lot: 1, generacio: 0 }]) {
      expect(r.tornaFitxerCompartit(dolent)).toBe(false);
    }
    expect(r.compartitPendent()).toBe(lot);
    expect(allibera).not.toHaveBeenCalled();
  });
});

describe('C1615-03/08 · la còpia nativa només s\'allibera quan ja no tornarà', () => {
  test('ni lliurar, ni triar, ni prendre alliberen; enviar-lo allibera exactament la seua ruta, una sola vegada', async () => {
    const { r, allibera } = await ambAlliberador();
    r.lliuraCompartit(lotAmbRutes('a', 'b'));
    r.triaDestiCompartit('5', 'A');
    const presA = r.prenFitxerCompartit('5', 'A');
    expect(allibera).not.toHaveBeenCalled();
    const lot = r.compartitPendent();
    const oient = vi.fn();
    r.subscriuCompartit(oient);
    r.alliberaFitxerCompartit(presA);
    expect(allibera.mock.calls).toEqual([[[ruta('a')]]]);
    // Alliberar no toca el lot ni avisa ningú.
    expect(r.compartitPendent()).toBe(lot);
    expect(oient).not.toHaveBeenCalled();
    r.alliberaFitxerCompartit(presA);
    expect(allibera).toHaveBeenCalledTimes(1);
    const presB = r.prenFitxerCompartit('5', 'A');
    expect(allibera).toHaveBeenCalledTimes(1);
    r.alliberaFitxerCompartit(presB);
    expect(allibera).toHaveBeenCalledTimes(2);
    expect(allibera).toHaveBeenLastCalledWith([ruta('b')]);
    // Ja no queda res: un descart no torna a alliberar.
    r.descartaCompartit();
    expect(allibera).toHaveBeenCalledTimes(2);
  });

  test('descartar allibera d\'una vegada els pendents, en l\'ordre del lot; l\'enviat no es repetix i el de la mà se n\'allibera en tornar', async () => {
    const { r, allibera } = await ambAlliberador();
    r.lliuraCompartit(lotAmbRutes('a', 'b', 'c', 'd'));
    r.triaDestiCompartit('5', 'A');
    const enviat = r.prenFitxerCompartit('5', 'A');
    const enMa = r.prenFitxerCompartit('5', 'A');
    r.alliberaFitxerCompartit(enviat);
    r.descartaCompartit();
    expect(r.tornaFitxerCompartit(enMa)).toBe(false);
    expect(allibera.mock.calls).toEqual([[[ruta('a')]], [[ruta('c'), ruta('d')]], [[ruta('b')]]]);
  });

  test('un lot nou allibera el que substituïx, triat o no, i un lliurament buit no substituïx res', async () => {
    const { r, allibera } = await ambAlliberador();
    r.lliuraCompartit(lotAmbRutes('a', 'b'));
    expect(allibera).not.toHaveBeenCalled();
    r.lliuraCompartit(lotAmbRutes('c', 'd'));
    expect(allibera.mock.calls).toEqual([[[ruta('a'), ruta('b')]]]);
    r.triaDestiCompartit('5', 'A');
    const triat = r.compartitPendent();
    // Un lliurament sense res no és cap lot: el triat es queda i no s'allibera.
    expect(r.lliuraCompartit({ fitxers: [], rutes: [], text: '  ' })).toBeNull();
    expect(r.compartitPendent()).toBe(triat);
    expect(allibera).toHaveBeenCalledTimes(1);
    r.lliuraCompartit(lotAmbRutes('e'));
    expect(allibera.mock.calls).toEqual([[[ruta('a'), ruta('b')]], [[ruta('c'), ruta('d')]]]);
    // El nou conserva la seua fins que es descarta.
    r.descartaCompartit();
    expect(allibera).toHaveBeenCalledTimes(3);
    expect(allibera).toHaveBeenLastCalledWith([ruta('e')]);
  });

  test('més de 10 en el lliurament: les que sobren s\'alliberen de seguida, les 10 del lot no', async () => {
    const { r, allibera } = await ambAlliberador();
    const deu = Array.from({ length: 10 }, (_, i) => `d${i}`);
    r.lliuraCompartit(lotAmbRutes(...deu));
    expect(allibera).not.toHaveBeenCalled();
    r.descartaCompartit();
    expect(allibera.mock.calls).toEqual([[deu.map(ruta)]]);
    allibera.mockClear();

    const dotze = Array.from({ length: 12 }, (_, i) => `f${i}`);
    const { fitxers, rutes } = lotAmbRutes(...dotze);
    r.lliuraCompartit({ fitxers, rutes });
    expect(allibera.mock.calls).toEqual([[[ruta('f10'), ruta('f11')]]]);
    const lot = r.compartitPendent();
    expect(quins(lot.fitxers, fitxers)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(lot.rebutjats).toBe(2);
    r.descartaCompartit();
    expect(allibera).toHaveBeenCalledTimes(2);
    expect(allibera).toHaveBeenLastCalledWith(dotze.slice(0, 10).map(ruta));
  });

  test('un alliberador que llança o rebutja no trenca el registre', async () => {
    const r = await carrega();
    const fuites = vi.fn();
    process.on('unhandledRejection', fuites);
    try {
      const llanca = vi.fn(() => { throw new Error('pont trencat'); });
      r.registraAlliberadorCompartit(llanca);
      const oient = vi.fn();
      r.subscriuCompartit(oient);
      r.lliuraCompartit(lotAmbRutes('a', 'b'));
      // Passar de 10 i substituir criden l'alliberador, que llança: el lot nou entra igual.
      const onze = Array.from({ length: 11 }, (_, i) => `s${i}`);
      const segon = lotAmbRutes(...onze);
      expect(() => r.lliuraCompartit(segon)).not.toThrow();
      expect(llanca.mock.calls).toEqual([[[ruta('s10')]], [[ruta('a'), ruta('b')]]]);
      expect(quins(r.compartitPendent().fitxers, segon.fitxers)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      r.triaDestiCompartit('5');
      const pres = r.prenFitxerCompartit('5');
      expect(() => r.alliberaFitxerCompartit(pres)).not.toThrow();
      expect(llanca).toHaveBeenLastCalledWith([ruta('s0')]);

      /* Ara el pont rebutja, de manera asíncrona: el descart acaba igual. Funció
         nua, no vi.fn: el vi.fn s'enganxa a la promesa que torna (settledResults)
         i amagaria el rebuig sense capturar que ha de vigilar `fuites`. */
      const rebutjades = [];
      r.registraAlliberadorCompartit((rutes) => { rebutjades.push(rutes); return Promise.reject(new Error('el natiu diu que no')); });
      expect(() => r.descartaCompartit()).not.toThrow();
      expect(rebutjades).toEqual([onze.slice(1, 10).map(ruta)]);
      expect(r.compartitPendent()).toBeNull();
      expect(oient).toHaveBeenLastCalledWith(null);

      // El registre continua viu: el lot següent arriba i es pren.
      const tercer = lotAmbRutes('t');
      expect(r.lliuraCompartit(tercer)).toBe(3);
      r.triaDestiCompartit('5');
      expect(r.prenFitxerCompartit('5').fitxer).toBe(tercer.fitxers[0]);
      await new Promise((resol) => { setTimeout(resol, 0); });
      expect(fuites).not.toHaveBeenCalled();
    } finally {
      process.off('unhandledRejection', fuites);
    }
  });

  test('sense ruta no hi ha res a alliberar: les rutes van alineades amb l\'entrada i una ruta buida o que no és text no compta', async () => {
    const { r, allibera } = await ambAlliberador();
    const [a, b, c, d] = ['a', 'b', 'c', 'd'].map((nom) => foto(`${nom}.png`));
    r.lliuraCompartit({ fitxers: [a, 'content://brossa', b, c, d], rutes: [ruta('a'), '/natiu/brossa', '', 42, ruta('d')] });
    expect(r.compartitPendent().rebutjats).toBe(1);
    r.descartaCompartit();
    expect(allibera.mock.calls).toEqual([[[ruta('a'), ruta('d')]]]);
    allibera.mockClear();

    // Un lot sense rutes, o amb rutes que no són llista: prendre'l, enviar-lo i descartar-lo no criden el pont.
    r.lliuraCompartit({ fitxers: [foto('e.png'), foto('f.png')] });
    r.triaDestiCompartit('5');
    r.alliberaFitxerCompartit(r.prenFitxerCompartit('5'));
    r.descartaCompartit();
    r.lliuraCompartit({ fitxers: [foto('g.png')], rutes: 'no és llista' });
    r.descartaCompartit();
    // Ni el que no és un pres.
    for (const dolent of [null, undefined, {}, { fitxer: ruta('a') }]) {
      expect(() => r.alliberaFitxerCompartit(dolent)).not.toThrow();
    }
    expect(allibera).not.toHaveBeenCalled();
  });

  test('l\'alliberador es pot llevar (el que no és funció el lleva) i un de nou rep les rutes següents', async () => {
    const { r, allibera } = await ambAlliberador();
    r.registraAlliberadorCompartit('no és funció');
    r.lliuraCompartit(lotAmbRutes('a'));
    expect(() => r.descartaCompartit()).not.toThrow();
    expect(allibera).not.toHaveBeenCalled();
    const nou = vi.fn();
    r.registraAlliberadorCompartit(nou);
    r.lliuraCompartit(lotAmbRutes('b'));
    r.descartaCompartit();
    expect(nou.mock.calls).toEqual([[[ruta('b')]]]);
    expect(allibera).not.toHaveBeenCalled();
  });
});

/* Gauntlet 261026_1615 · Revisió de Claude · Un fitxer pres d'un lot que ja ha
   estat substituït (un altre lot ha arribat i s'ha pres sencer) no pot fer tornar
   el lot vell a la vida: s'allibera i el nou continua sent el bo. */
describe('un lot substituït no torna a la vida', () => {
  test('sense cap lot pendent, tornar un fitxer d’un lot anterior l’allibera', async () => {
    const r = await carrega();
    const alliberador = vi.fn();
    r.registraAlliberadorCompartit(alliberador);
    const a = foto('a.png');
    const c = foto('c.png');
    r.lliuraCompartit({ fitxers: [a], rutes: ['/a'], text: 'vell' });
    r.triaDestiCompartit(5, 'A');
    const presA = r.prenFitxerCompartit(5, 'A');
    r.lliuraCompartit({ fitxers: [c], rutes: ['/c'] });
    r.triaDestiCompartit(6, 'A');
    const presC = r.prenFitxerCompartit(6, 'A');
    expect(r.compartitPendent()).toBeNull();
    expect(r.tornaFitxerCompartit(presA)).toBe(false);
    expect(r.compartitPendent()).toBeNull();
    expect(alliberador).toHaveBeenCalledWith(['/a']);
    // El nou sí que pot tornar.
    expect(r.tornaFitxerCompartit(presC)).toBe(true);
    expect(r.compartitPendent().fitxers[0]).toBe(c);
  });
});

/* Pla 261028_1526 (Bloc D, P1-31) · El canvi de sessió té època pròpia. El que
   el pont llegia (sessio) o el natiu copiava (rebutMs) abans del canvi ja no
   entra: s'alliberen les còpies i no s'avisa ningú. El «Descarta» del diàleg no
   és cap canvi de sessió: un lot que encara es llegia sí que entra. */
describe('P1-31 · l’època de la sessió', () => {
  test('després de canviaSessioCompartit, un lliurament amb la sessió d’abans no entra: allibera totes les rutes, no avisa i no toca el lot', async () => {
    const { r, allibera } = await ambAlliberador();
    const abans = r.sessioCompartit();
    const oient = vi.fn();
    r.subscriuCompartit(oient);
    r.canviaSessioCompartit();
    expect(r.sessioCompartit()).toBe(abans + 1);
    // Sense lot pendent el canvi no avisa (com descartaCompartit).
    expect(oient).not.toHaveBeenCalled();
    const vell = lotAmbRutes('a', 'b');
    expect(r.lliuraCompartit({ ...vell, text: 'd’A', rebutjats: 1, sessio: abans })).toBeNull();
    expect(r.compartitPendent()).toBeNull();
    expect(oient).not.toHaveBeenCalled();
    expect(allibera.mock.calls).toEqual([[[ruta('a'), ruta('b')]]]);

    // Un lot de la sessió nova sí que entra; un altre de la vella no el substituïx ni n'allibera res.
    const nou = lotAmbRutes('c');
    const id = r.lliuraCompartit({ ...nou, sessio: r.sessioCompartit() });
    const lot = r.compartitPendent();
    expect(lot).toMatchObject({ id, desti: null, propietari: null });
    expect(quins(lot.fitxers, nou.fitxers)).toEqual([0]);
    allibera.mockClear();
    oient.mockClear();
    expect(r.lliuraCompartit({ ...lotAmbRutes('d'), sessio: abans })).toBeNull();
    expect(r.compartitPendent()).toBe(lot);
    expect(oient).not.toHaveBeenCalled();
    expect(allibera.mock.calls).toEqual([[[ruta('d')]]]);
    // L'id no s'ha gastat: el lot següent és l'id + 1.
    expect(r.lliuraCompartit({ text: 'següent', sessio: r.sessioCompartit() })).toBe(id + 1);
  });

  test('canviaSessioCompartit descarta com descartaCompartit: allibera el lot i el fitxer de la mà ja no torna', async () => {
    const { r, allibera } = await ambAlliberador();
    r.lliuraCompartit(lotAmbRutes('a', 'b'));
    r.triaDestiCompartit('5', 'A');
    const pres = r.prenFitxerCompartit('5', 'A');
    r.canviaSessioCompartit();
    expect(r.compartitPendent()).toBeNull();
    expect(allibera.mock.calls).toEqual([[[ruta('b')]]]);
    expect(r.tornaFitxerCompartit(pres)).toBe(false);
    expect(allibera).toHaveBeenLastCalledWith([ruta('a')]);
  });

  test('un lliurament amb rebutMs d’abans del tall no entra (allibera, no avisa); del tall ençà, o sense hora vàlida, sí', async () => {
    const { r, allibera } = await ambAlliberador();
    // Abans de cap canvi no hi ha tall: un intent de fa temps (les restes en arrencar) entra.
    expect(r.lliuraCompartit({ ...lotAmbRutes('vell'), rebutMs: 1 })).toBe(1);
    r.descartaCompartit();
    allibera.mockClear();
    r.canviaSessioCompartit(5000);
    const oient = vi.fn();
    r.subscriuCompartit(oient);
    expect(r.lliuraCompartit({ ...lotAmbRutes('a', 'b'), text: 'en vol', rebutMs: 4999 })).toBeNull();
    expect(r.compartitPendent()).toBeNull();
    expect(oient).not.toHaveBeenCalled();
    expect(allibera.mock.calls).toEqual([[[ruta('a'), ruta('b')]]]);
    // Al mateix mil·lisegon del tall, o després, és de la sessió nova.
    expect(r.lliuraCompartit({ ...lotAmbRutes('c'), rebutMs: 5000 })).toBe(2);
    expect(r.lliuraCompartit({ ...lotAmbRutes('d'), rebutMs: 9000 })).toBe(3);
    // Una hora que no és un número finit no talla res.
    for (const [i, rebutMs] of [undefined, Number.NaN, '1', null, Number.NEGATIVE_INFINITY].entries()) {
      expect(r.lliuraCompartit({ ...lotAmbRutes(`x${i}`), rebutMs }), String(rebutMs)).toBe(4 + i);
    }
  });

  test('el «Descarta» del diàleg (descartaCompartit) no canvia la sessió: un lot que encara es llegia entra igual', async () => {
    const { r, allibera } = await ambAlliberador();
    r.lliuraCompartit({ ...lotAmbRutes('vell'), text: 'el que la persona descarta' });
    // Mentrestant el pont ja llig un lot nou: en va prendre l'època en rebre'l.
    const deLaLectura = r.sessioCompartit();
    r.descartaCompartit();
    expect(r.sessioCompartit()).toBe(deLaLectura);
    expect(allibera.mock.calls).toEqual([[[ruta('vell')]]]);
    allibera.mockClear();
    const nou = lotAmbRutes('nou');
    const id = r.lliuraCompartit({ ...nou, text: 'el nou', sessio: deLaLectura, rebutMs: Date.now() });
    expect(id).toBe(2);
    expect(r.compartitPendent()).toMatchObject({ id, text: 'el nou', desti: null, propietari: null });
    expect(quins(r.compartitPendent().fitxers, nou.fitxers)).toEqual([0]);
    expect(allibera).not.toHaveBeenCalled();
  });

  test('un lot amb amo no el retria ningú més, ni una crida sense persona; l’amo sí, i el sense amo, qualsevol', async () => {
    const r = await carrega();
    r.lliuraCompartit({ text: 'per a A' });
    expect(r.triaDestiCompartit('5', 'A')).toBe(true);
    const triat = r.compartitPendent();
    expect(r.triaDestiCompartit('6', 'B')).toBe(false);
    expect(r.triaDestiCompartit('6')).toBe(false);
    expect(r.triaDestiCompartit('6', '')).toBe(false);
    expect(r.compartitPendent()).toBe(triat);
    expect(r.triaDestiCompartit(6, 'A')).toBe(true);
    expect(r.compartitPendent()).toMatchObject({ desti: '6', propietari: 'A' });
    r.lliuraCompartit({ text: 'de ningú' });
    expect(r.triaDestiCompartit('1')).toBe(true);
    expect(r.triaDestiCompartit('2', 'B')).toBe(true);
    expect(r.compartitPendent()).toMatchObject({ desti: '2', propietari: 'B' });
  });

  test('reiniciaDestiCompartit torna a «Envia a…» només un lot sense amo amb destí; no descarta ni allibera res', async () => {
    const { r, allibera } = await ambAlliberador();
    expect(r.reiniciaDestiCompartit()).toBe(false);
    const { fitxers, rutes } = lotAmbRutes('a');
    const id = r.lliuraCompartit({ fitxers, rutes, text: 'peu' });
    const oient = vi.fn();
    r.subscriuCompartit(oient);
    // Sense destí no hi ha res a tornar: ni avís.
    expect(r.reiniciaDestiCompartit()).toBe(false);
    expect(oient).not.toHaveBeenCalled();
    r.triaDestiCompartit('5');
    expect(r.reiniciaDestiCompartit()).toBe(true);
    const tornat = r.compartitPendent();
    expect(oient).toHaveBeenLastCalledWith(tornat);
    expect(tornat).toMatchObject({ id, text: 'peu', desti: null, propietari: null });
    expect(quins(tornat.fitxers, fitxers)).toEqual([0]);
    expect(Object.isFrozen(tornat) && Object.isFrozen(tornat.fitxers)).toBe(true);
    // Un lot amb amo no es toca (el canvi de sessió ja l'hauria descartat).
    r.triaDestiCompartit('5', 'A');
    const triat = r.compartitPendent();
    expect(r.reiniciaDestiCompartit()).toBe(false);
    expect(r.compartitPendent()).toBe(triat);
    expect(allibera).not.toHaveBeenCalled();
  });
});

/* Pla 261028_1526 (Bloc D, P1-31) · El tall arriba al natiu: el tallador que
   registra el pont (receptor.tallaSessio) esborra allí les còpies d'abans i
   talla la que encara es copiava, també si el procés mor a mitges. Només el
   canvi de sessió el crida; el «Descarta» del diàleg, no. */
describe('P1-31 · el tall arriba al natiu', () => {
  test('canviaSessioCompartit crida el tallador una vegada, després del descart; descartaCompartit no el crida', async () => {
    const { r, allibera } = await ambAlliberador();
    const tallador = vi.fn();
    r.registraTalladorCompartit(tallador);
    r.lliuraCompartit(lotAmbRutes('a'));
    r.descartaCompartit();
    expect(tallador).not.toHaveBeenCalled();
    r.lliuraCompartit(lotAmbRutes('b'));
    r.canviaSessioCompartit();
    expect(tallador).toHaveBeenCalledTimes(1);
    expect(tallador).toHaveBeenCalledWith();
    // El lot pendent s'allibera abans de tallar (el natiu el trobaria igual, però en ordre).
    expect(allibera.mock.invocationCallOrder.at(-1)).toBeLessThan(tallador.mock.invocationCallOrder[0]);
    r.canviaSessioCompartit();
    expect(tallador).toHaveBeenCalledTimes(2);
  });

  test('un tallador que llança o rebutja no tomba el canvi; un que no és funció el desregistra', async () => {
    const r = await carrega();
    const senseAmo = vi.fn();
    process.on('unhandledRejection', senseAmo);
    try {
      r.registraTalladorCompartit(() => { throw new Error('natiu trencat'); });
      r.lliuraCompartit({ text: 'u' });
      expect(() => r.canviaSessioCompartit()).not.toThrow();
      expect(r.compartitPendent()).toBeNull();
      expect(r.sessioCompartit()).toBe(1);
      r.registraTalladorCompartit(() => Promise.reject(new Error('sense connector')));
      expect(() => r.canviaSessioCompartit()).not.toThrow();
      await new Promise((resol) => { setTimeout(resol, 0); });
      expect(senseAmo).not.toHaveBeenCalled();
      const vell = vi.fn();
      r.registraTalladorCompartit(vell);
      r.registraTalladorCompartit('no');
      r.canviaSessioCompartit();
      expect(vell).not.toHaveBeenCalled();
      expect(r.sessioCompartit()).toBe(3);
    } finally {
      process.off('unhandledRejection', senseAmo);
    }
  });

  /* L'hora de l'intent només talla el que encara podia estar en vol (5 minuts:
     més que tota una còpia nativa). Un intent més vell que això, després d'un
     tall, és un rellotge que ha tornat arrere: la compartició és bona. */
  test('rebutMs talla fins a 5 minuts abans del tall, ni un mil·lisegon més', async () => {
    const { r, allibera } = await ambAlliberador();
    const EN_VOL = 5 * 60 * 1000;
    const tall = 10 * EN_VOL;
    r.canviaSessioCompartit(tall);
    expect(r.lliuraCompartit({ ...lotAmbRutes('vora'), rebutMs: tall - EN_VOL })).toBeNull();
    expect(allibera.mock.calls).toEqual([[[ruta('vora')]]]);
    allibera.mockClear();
    const id = r.lliuraCompartit({ ...lotAmbRutes('enrere'), rebutMs: tall - EN_VOL - 1 });
    expect(id).not.toBeNull();
    expect(r.compartitPendent()).toMatchObject({ id, desti: null, propietari: null });
    expect(allibera).not.toHaveBeenCalled();
    // La sessió del lot continua tallant, tinga l'hora que tinga.
    expect(r.lliuraCompartit({ ...lotAmbRutes('vella'), sessio: 0, rebutMs: tall - EN_VOL - 1 })).toBeNull();
  });
});

/* Revisió del Bloc D (mutant E1) · El receptor de l'entrada nativa és el que
   porta l'època (sessioCompartit) i registra el tallador: sense, el tall de
   sessió no arriba ni a la lectura en vol ni al natiu. L'entrada s'avalua com a
   natiu/entrada.test.jsx (host, React i l'App, simulats); el registre és el de
   veres, la mateixa instància que llig l'entrada. */
describe('P1-31 · l’entrada nativa connecta el receptor al registre', () => {
  afterEach(() => {
    for (const modul of ['../host.js', 'react-dom/client', '../PedraSecaEmbed.jsx', '../css/index.css?inline']) vi.doUnmock(modul);
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    document.body.replaceChildren();
  });

  test('un canvi de sessió amb la compartició en vol: no arriba al registre, se n’allibera la còpia i el natiu talla', async () => {
    vi.resetModules();
    vi.doMock('../host.js', () => ({ configura: vi.fn(), arrenca: vi.fn(async () => ({ fase: 'segellat' })) }));
    vi.doMock('react-dom/client', () => ({ createRoot: () => ({ render: () => {} }) }));
    vi.doMock('../PedraSecaEmbed.jsx', () => ({ default: () => null }));
    vi.doMock('../css/index.css?inline', () => ({ default: '' }));
    vi.stubEnv('VITE_SUPABASE_URL', 'https://paquet.supabase.test');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'sb_publishable_del_paquet');
    const oients = [];
    const pont = {
      getPlatform: () => 'android',
      addListener: vi.fn((connector, nom, cb) => { oients.push(cb); return { remove: () => {} }; }),
      convertFileSrc: (r) => `https://localhost/_capacitor_file_${r}`,
      nativePromise: vi.fn(async () => ({}))
    };
    vi.stubGlobal('Capacitor', pont);
    let resol;
    vi.stubGlobal('fetch', vi.fn(() => new Promise((r) => { resol = r; })));
    document.body.replaceChildren(Object.assign(document.createElement('div'), { id: 'root' }));
    await import('../natiu/entrada.jsx');
    const r = await import('./compartirNatiu.js');
    const buida = () => new Promise((fet) => { setTimeout(fet, 0); });
    await buida();
    expect(pont.addListener).toHaveBeenCalledWith('CompartirNatiu', 'compartit', expect.any(Function));
    oients.at(-1)({ fitxers: [{ ruta: '/data/a.png', mime: 'image/png', mida: 3, nom: 'a.png' }], text: 'd’A' });
    await buida();
    r.canviaSessioCompartit();
    resol({ ok: true, status: 200, blob: async () => new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' }) });
    await buida();
    expect(r.compartitPendent()).toBeNull();
    expect(pont.nativePromise.mock.calls).toEqual([
      ['CompartirNatiu', 'tallaSessio', {}],
      ['CompartirNatiu', 'allibera', { rutes: ['/data/a.png'] }]
    ]);
  });
});
