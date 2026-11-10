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
const OPT_INS = new Set(['compteOperatiu', 'compteModeProva', 'compteSenseSessio', 'publicacioOperativa', 'credencialsDeProva', 'contrasenyaLocal', 'destinatariDirecte', 'transportXifrat', 'filDirecte', 'adminMultipobleAutoritzat', 'tenantAdministrat', 'iaiaOperativa', 'xatRitmeOperatiu']);
const casosDelXat = () => CASOS.filter((c) => c.requerix.some((clau) => CLAUS_DEL_XAT.has(clau)));

/**
 * Una passada del kit sencer amb `prepara` (la sessió) abans i, en acabar,
 * les omissions per a la comprovació de cada describe.
 */
function passada(nom, { crea, prepara = () => {}, omissionsAdmeses, ambSessio = false }) {
  describe(`conformitat del port · adaptador local · ${nom}`, () => {
    const adaptador = crea();
    const ctx = contextDeConformitat({ config: {}, escriptures: true, escenaris: { projeccionsOperatives: true, projeccionsSenseSessio: true, contrasenyaLocal: true, compteOperatiu: ambSessio, compteSenseSessio: !ambSessio, publicacioOperativa: ambSessio, destinatariDirecte: ambSessio ? '2e3f4051-6b7c-4d8e-9fa0-b1c2d3e4f5a6' : null } });
    const resultats = new Map();
    const invocats = new Set();
    beforeAll(async () => {
      prepara(adaptador);
      if (ambSessio) ctx.destinatariDirecte = (await adaptador.carregaMembres('', {})).find(m => m.tipus === 'persona' && m.usuari_id !== adaptador.getCurrentUser()?.id)?.usuari_id ?? null;
    });
    afterAll(() => adaptador.destroy());

    test('el port l’accepta: nucli sencer, cap capacitat a mitges i només les no declarades a posta', () => {
      expect(() => validaBackendImplementation(adaptador)).not.toThrow();
      expect(CONTRACTE_NUCLI.filter((metode) => typeof adaptador[metode] !== 'function')).toEqual([]);
      const parcials = Object.entries(CAPACITATS).filter(([, metodes]) => {
        const presents = metodes.filter((metode) => typeof adaptador[metode] === 'function').length;
        return presents > 0 && presents < metodes.length;
      });
      expect(parcials).toEqual([]);
      expect(Object.keys(CAPACITATS)).toHaveLength(51);
      expect(CAPACITATS_NO_DECLARADES).toEqual(['administracioSessions','curadoriaCultural','iaia','xatRitme','importacioPaquetMunicipal','verificacioCorreu','recuperacioCorreu']);
      expect(noDeclarades(adaptador)).toEqual(CAPACITATS_NO_DECLARADES);
    });

    for (const [index, c] of CASOS.entries()) {
      test(`${index + 1}. ${c.titol}`, async () => {
        let crides = 0;
        const instrumentat = { ...adaptador };
        if (typeof adaptador[c.metode] === 'function') instrumentat[c.metode] = (...args) => { crides++; invocats.add(c.metode); return adaptador[c.metode](...args); };
        const resultat = await executaCas(c, instrumentat, ctx);
        expect(crides).toBe(resultat.estat === 'omés' ? 0 : 1);
        if (c.metode === 'demanaBaixa' && c.requerix.includes('compteOperatiu') && resultat.estat === 'ok') expect(adaptador.getCurrentUser()).toBeNull();
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
      const esperades = CASOS.filter(c => !absents.includes(c.capacitat) && (omissionsAdmeses().includes(c) || c.requerix.some(k => OPT_INS.has(k) && !ctx[k])));
      expect(resta).toEqual(esperades);
      expect(adaptador.getCurrentUser()).toBeNull();
    });

    test('cens d’invocacions reals i omissions de la passada', () => {
      const omesos = [...resultats.values()].filter(r => r.estat === 'omés').length;
      console.info('FEDI17_CENS', JSON.stringify({ passada: `local ${nom}`, casos: CASOS.length, correctes: CASOS.length - omesos, omesos, invocats: [...invocats].sort() }));
      expect(invocats).toEqual(new Set(CASOS.filter((c, i) => resultats.get(i)?.estat === 'ok').map(c => c.metode)));
    });

    test('cap petició de xarxa en tota la passada' , () => {
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
  ambSessio: true,
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

/* FEDI-17 · La baixa del cicle també tanca sessió. Esta passada aïllada
   comença amb sessió viva perquè un logout que no fera res no passe. */
test('logout local amb sessió activa l’esborra; el mutant no-op queda refutat', async () => {
  const adaptador = creaAdaptadorLocal({ mode: 'local' });
  const c = CASOS.find(cas => cas.metode === 'logout');
  const prova = async candidat => {
    configuraBackendSessio(adaptador.configuracio);
    expect(desaSessio({ access_token: 'logout-opac-local', user: { id: PERSONA } })).toBe(true);
    expect(adaptador.getCurrentUser()?.id).toBe(PERSONA);
    const resultat = await executaCas(c, candidat, contextDeConformitat({ config: adaptador.configuracio, escriptures: true }));
    return resultat.estat === 'ok' && adaptador.getCurrentUser() === null;
  };
  try {
    expect(await prova({ ...adaptador, logout: async () => {} })).toBe(false);
    expect(await prova(adaptador)).toBe(true);
  } finally {
    esborraSessio({ abast: 'tot' });
    await adaptador.destroy();
  }
});
