/* T1 · D01 (assalt 261101) · El kit de conformitat del port (kit.js) passat
   sencer al segon adaptador, en tres passades i sense xarxa: la llavor sense
   sessió, la llavor amb sessió i el mode local sense llavor. El corredor és el
   de conformitat.test.js (CASOS + contextDeConformitat + executaCas), amb les
   escriptures activades. Els recomptes es calculen del contracte: si un altre
   carril hi afig una capacitat, una que este node no declara compta com a
   omesa per capacitat absent (CAPACITATS_NO_DECLARADES), i qualsevol altra
   omissió és una falla. */
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { validaBackendImplementation } from '../backendPort.js';
import { CAPACITATS, CONTRACTE_NUCLI } from '../contracte.js';
import { CASOS, contextDeConformitat, executaCas } from '../conformitat/kit.js';
import { configuraBackendSessio, desaSessio, esborraSessio } from '../identitat.js';
import { esperaLaIAIA, reiniciaLocalXat } from '../localXat.js';
import { CAPACITATS_NO_DECLARADES, creaAdaptadorLocal } from './adaptadorLocal.js';

const xarxa = vi.fn(() => { throw new Error('XARXA_PROHIBIDA_A_LA_CONFORMITAT'); });
beforeAll(() => {
  vi.stubGlobal('fetch', xarxa);
  reiniciaLocalXat();
});
afterAll(async () => {
  await esperaLaIAIA();
  esborraSessio({ abast: 'tot' });
  reiniciaLocalXat();
  vi.unstubAllGlobals();
});

/* Les capacitats que l'adaptador no declara: cap mètode del grup. */
const noDeclarades = (adaptador) => Object.keys(CAPACITATS)
  .filter((capacitat) => CAPACITATS[capacitat].every((metode) => typeof adaptador[metode] !== 'function'));
/* Els casos que depenen d'un fil real del Xat (un cas anterior deixa filId, filEscrivible o la subscripció). */
const CLAUS_DEL_XAT = new Set(['filId', 'filEscrivible', 'subscrit', 'seqEnviat']);
const casosDelXat = () => CASOS.filter((c) => c.requerix.some((clau) => CLAUS_DEL_XAT.has(clau)));

/**
 * Una passada del kit sencer amb `prepara` (la sessió) abans i, en acabar,
 * les omissions per a la comprovació de cada describe.
 */
function passada(nom, { crea, prepara = () => {}, omissionsAdmeses }) {
  describe(`conformitat del port · adaptador local · ${nom}`, () => {
    const adaptador = crea();
    const ctx = contextDeConformitat({ config: {}, escriptures: true });
    const resultats = new Map();
    beforeAll(() => prepara(adaptador));
    afterAll(() => adaptador.destroy());

    test('el port l’accepta: nucli sencer, cap capacitat a mitges i només les no declarades a posta', () => {
      expect(() => validaBackendImplementation(adaptador)).not.toThrow();
      expect(CONTRACTE_NUCLI.filter((metode) => typeof adaptador[metode] !== 'function')).toEqual([]);
      const parcials = Object.entries(CAPACITATS).filter(([, metodes]) => {
        const presents = metodes.filter((metode) => typeof adaptador[metode] === 'function').length;
        return presents > 0 && presents < metodes.length;
      });
      expect(parcials).toEqual([]);
      expect(noDeclarades(adaptador).filter((capacitat) => !CAPACITATS_NO_DECLARADES.includes(capacitat))).toEqual([]);
    });

    for (const [index, c] of CASOS.entries()) {
      test(`${index + 1}. ${c.titol}`, async () => {
        const resultat = await executaCas(c, adaptador, ctx);
        resultats.set(index, resultat);
        expect(resultat.falles, resultat.falles.join(' · ')).toEqual([]);
        expect(resultat.estat).not.toBe('falla');
      });
    }

    test('només s’ometen els casos admesos', () => {
      expect(resultats.size).toBe(CASOS.length);
      const absents = noDeclarades(adaptador);
      const omesos = CASOS.map((c, index) => [c, resultats.get(index)]).filter(([, r]) => r.estat === 'omés');
      /* Una capacitat no declarada a posta: el kit l'omet amb el seu motiu, i res més. */
      const perCapacitat = omesos.filter(([c, r]) => c.capacitat && absents.includes(c.capacitat) && r.motiu === `capacitat ${c.capacitat} absent`);
      const resta = omesos.filter((omes) => !perCapacitat.includes(omes)).map(([c]) => c);
      expect(resta.map((c) => c.metode)).toEqual(omissionsAdmeses().map((c) => c.metode));
      expect(resta).toEqual(omissionsAdmeses());
    });

    test('cap petició de xarxa en tota la passada', () => {
      expect(xarxa).not.toHaveBeenCalled();
    });

    test('el context del kit diu d’on ha tret el fil', () => {
      if (omissionsAdmeses().length) {
        expect(ctx.filId).toBeNull();
      } else {
        expect(ctx.filId).toEqual(expect.any(String));
        expect(ctx.filEscrivible).toEqual(expect.any(String));
        expect(ctx.subscrit).toBe(true);
      }
    });
  });
}

passada('seed sense sessió', {
  crea: () => creaAdaptadorLocal({ mode: 'seed' }),
  prepara: () => { esborraSessio({ abast: 'tot' }); },
  omissionsAdmeses: () => []
});

const PERSONA = '1d2e3f40-5a6b-4c7d-8e9f-a0b1c2d3e4f5';
passada('seed amb sessió', {
  crea: () => creaAdaptadorLocal({ mode: 'seed' }),
  prepara(adaptador) {
    configuraBackendSessio(adaptador.configuracio);
    expect(desaSessio({ access_token: 'testimoni-opac-local', user: { id: PERSONA, email: 'proves@poble.invalid' } })).toBe(true);
  },
  omissionsAdmeses: () => []
});

/* En local no hi ha cap fil real: el kit no tria mai una fila d'ajuda
   (Conversa.perDefecte), i els casos que demanen un fil s'ometen. */
passada('local sense llavor', {
  crea: () => creaAdaptadorLocal({ mode: 'local' }),
  prepara: () => { esborraSessio({ abast: 'tot' }); },
  omissionsAdmeses: casosDelXat
});
