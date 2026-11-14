/* R24 · xat_entrega (IDEA-260 b, P0-2 i P2-9) · Funcions pures de l'entrega
   en segon pla: quines converses ha de descarregar l'aplicació perquè el
   remitent veja ✓✓ gris («ha arribat a l'aplicació»), el rebut propi i si el
   servidor informa de l'entrega a la fila mapejada, i l'anotació honesta del
   ✓ quan el servidor no ho sap. */
import { describe, expect, it } from 'vitest';
import { combinaMissatges, filsPerEntregar, mapejaFil } from './missatges.js';

const uuid = n => `24000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const fil = (n, extra = {}) => mapejaFil({
  id: uuid(n), tipus: 'directe', titol: `Fil ${n}`, ultimSeq: 5, rebutFinsSeq: 2, llegitFinsSeq: 2,
  ultimAutorId: 'altra', ultimAl: `2026-11-14T0${n % 10}:00:00Z`, ...extra
});
const ids = llista => llista.map(f => f.id);

describe('mapejaFil · rebut propi, coneixement de l’entrega i E2EE', () => {
  it('conserva el rebut propi i diu si el servidor informa de l’entrega', () => {
    expect(fil(1)).toMatchObject({ rebutFinsSeq: 2, rebutsConeguts: false });
    expect(fil(1, { rebutPelsAltresFinsSeq: 0 })).toMatchObject({ rebutsConeguts: true, rebutPelsAltresFinsSeq: 0 });
    expect(fil(1, { epocaActual: 2 }).e2ee).toBe(true);
    expect(Object.hasOwn(fil(1, { epocaActual: 0 }), 'e2ee')).toBe(false);
  });
});

describe('filsPerEntregar', () => {
  it('sis converses amb novetats ⇒ les cinc més actives, per activitat', () => {
    const fils = [1, 2, 3, 4, 5, 6].map(n => fil(n));
    expect(ids(filsPerEntregar(fils))).toEqual([6, 5, 4, 3, 2].map(uuid));
    expect(filsPerEntregar(fils, { maxim: 2 })).toHaveLength(2);
    expect(filsPerEntregar(fils, { maxim: 0 })).toEqual([]);
  });

  it('exclou ajuda, ids no UUID, l’obert, comunitats, el propi, visitant, E2EE i l’autor bloquejat', () => {
    const fils = [
      fil(1, { perDefecte: 'javi' }),
      { ...fil(2), id: 'fake-javi' },
      fil(3),
      fil(4, { tipus: 'comunitat' }),
      fil(5, { esPropi: true }),
      fil(6, { participant: false }),
      fil(7, { epocaActual: 1 }),
      fil(8, { ultimAutorId: 'bloquejada' }),
      fil(9)
    ];
    const resultat = filsPerEntregar(fils, { actiuId: uuid(3), bloquejat: id => id === 'bloquejada' });
    expect(ids(resultat)).toEqual([uuid(9)]);
  });

  it('només amb novetats: respecta el rebut propi i el cursor que ja s’ha descarregat', () => {
    const fils = [fil(1, { rebutFinsSeq: 5 }), fil(2), fil(3)];
    expect(ids(filsPerEntregar(fils, { cursors: { [uuid(2)]: 5 } }))).toEqual([uuid(3)]);
    expect(filsPerEntregar('no és una llista')).toEqual([]);
  });
});

describe('combinaMissatges · el ✓ diu la veritat quan el servidor no informa de l’entrega', () => {
  const meu = seq => ({ id: `m${seq}`, seq, sender: 'me', estatEnviament: 'enviat' });
  const seu = seq => ({ id: `s${seq}`, seq, sender: 'them', estatEnviament: 'enviat' });

  it('sense rebuts coneguts, el propi enviat va anotat; el llegit i el dels altres no', () => {
    const [enviat, llegit, altre] = combinaMissatges([meu(3), meu(1), seu(2)], [], 1, 0, false);
    expect(enviat).toMatchObject({ estatEnviament: 'enviat', rebutsConeguts: false });
    expect(llegit.estatEnviament).toBe('llegit');
    expect(Object.hasOwn(llegit, 'rebutsConeguts')).toBe(false);
    expect(Object.hasOwn(altre, 'rebutsConeguts')).toBe(false);
  });

  it('amb rebuts coneguts, cap anotació i la mateixa identitat si res no canvia', () => {
    const servidor = [meu(3)];
    const [m] = combinaMissatges(servidor, [], 0, 0, true);
    expect(m).toBe(servidor[0]);
    const anotat = combinaMissatges(servidor, [], 0, 0, false);
    expect(combinaMissatges(anotat, [], 0, 0, false)[0]).toBe(anotat[0]);
    const [netejat] = combinaMissatges(anotat, [], 0, 3, true);
    expect(netejat.estatEnviament).toBe('lliurat');
    expect(Object.hasOwn(netejat, 'rebutsConeguts')).toBe(false);
  });
});
