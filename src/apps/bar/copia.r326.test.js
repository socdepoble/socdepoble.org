// @vitest-environment node
import { afterEach, describe, expect, test } from 'vitest';
import { creaMagatzemBar } from './magatzem.js';
import { afegeixProducte, aplicaDescompte, canviaQuantitat, creaComanda, totals } from './nucli/comanda.js';
import { tanca } from './nucli/cobrament.js';
import { obriTorn } from './nucli/torn.js';
import { llavorCarta } from './nucli/llavor.js';
import { creaCanalFals, creaIdbFals, creaLocksFals } from '../../utils/__fixtures__/navegadorFals.js';

/* FISC-01 (R32.6): l'app mateixa deixa una línia amb un descompte d'import
   més gran que el seu brut (descompte i després menys unitats; descompteLinia
   el limita al brut). La còpia d'eixe dispositiu s'ha de poder restaurar. */
const ARA = '2026-11-17T09:00:00.000Z';
const oberts = [];
function magatzem() {
  const m = creaMagatzemBar({ idb: creaIdbFals().idb, navegador: { locks: creaLocksFals() }, Canal: creaCanalFals().Canal });
  oberts.push(m);
  return m;
}
afterEach(() => { for (const m of oberts.splice(0)) m.base.tanca(); });

async function comandaAmbDescompteBaixat(m) {
  await m.carrega();
  await m.obriTorn(obriTorn({ id: 't-fisc01', fonsInicialCents: 0, ara: ARA }), [], null);
  const producte = llavorCarta().productes.find((p) => p.id === 'tallat');
  let c = afegeixProducte(creaComanda({ id: 'c-fisc01', tornId: 't-fisc01', origen: { tipus: 'barra' }, ara: ARA }), {
    producte, quantitat: 3, ivaPerDefecte: 10
  }, { idLinia: 'l-fisc01', ara: ARA });
  c = aplicaDescompte(c, 'l-fisc01', { tipus: 'import', valor: 380, motiu: 'Client habitual' }, { ara: ARA });
  c = canviaQuantitat(c, 'l-fisc01', 1, { ara: ARA });
  return m.desaComanda(c);
}

async function restauraEnUnDispositiuNou(text) {
  const desti = magatzem();
  await desti.carrega();
  const resum = await desti.restauraCopia(text);
  return { resum, bolcat: JSON.parse(await desti.exportaCopia(new Date(ARA))) };
}

describe('FISC-01: la còpia accepta el descompte d’import que l’app deixa per damunt del brut', () => {
  test('amb la comanda oberta, la restauració ho accepta i no reescala res', async () => {
    const m = magatzem();
    const c = await comandaAmbDescompteBaixat(m);
    expect(c.linies[0]).toMatchObject({ quantitat: 1, preuUnitariCents: 130, descompte: { tipus: 'import', valor: 380 } });
    expect(totals(c)).toMatchObject({ brutCents: 130, descomptesCents: 130, totalCents: 0, pendentCents: 0 });

    const oberta = await restauraEnUnDispositiuNou(await m.exportaCopia(new Date(ARA)));
    expect(oberta.resum).toEqual({ torns: 1, tiquets: 0 });
    expect(oberta.bolcat.comandes[0].linies[0]).toMatchObject({ quantitat: 1, descompte: { tipus: 'import', valor: 380 } });
  });

  test('amb el tiquet tancat, la restauració ho accepta i el total continua a 0', async () => {
    const m = magatzem();
    const c = await comandaAmbDescompteBaixat(m);
    await m.tancaComanda(tanca(c, { numero: 1, ara: ARA }));
    const tancada = await restauraEnUnDispositiuNou(await m.exportaCopia(new Date(ARA)));
    expect(tancada.resum).toEqual({ torns: 1, tiquets: 1 });
    expect(tancada.bolcat.comandes).toEqual([]);
    expect(tancada.bolcat.tiquets[0].linies[0]).toMatchObject({ quantitat: 1, descompte: { tipus: 'import', valor: 380 } });
    expect(tancada.bolcat.tiquets[0].totals).toMatchObject({ brutCents: 130, descomptesCents: 130, totalCents: 0 });
  });

  test('un percentatge per damunt de 100 continua refusat', async () => {
    const m = magatzem();
    await comandaAmbDescompteBaixat(m);
    const copia = JSON.parse(await m.exportaCopia(new Date(ARA)));
    copia.comandes[0].linies[0].descompte = { tipus: 'percent', valor: 101, motiu: 'Prova' };
    const desti = magatzem();
    await desti.carrega();
    await expect(desti.restauraCopia(JSON.stringify(copia))).rejects.toMatchObject({ codi: 'COPIA_INVALIDA' });
  });
});
