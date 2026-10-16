/**
 * Onada 10 (261010; decisió del Mestre del 261010) · Les targetes dels tres
 * usuaris fundacionals (Javi Llinares, Sóc de Poble i la IAIA MarIA) no van
 * mai al Mur: ixen quan se'ls busca al Cercador (/cerca).
 *
 * Ací no es redissenya res: es prova, amb les dades de veres de la llavor (el
 * catàleg d'agents del contingut base i el padró del xat, en el mateix ordre
 * que useCercaGlobal), que el Cercador els troba amb la seua cara, la seua
 * etiqueta i l'enllaç al seu perfil, i que cap dels tres té una pàgina del
 * sistema (SYSTEM_PAGES és el que el Mur barreja amb les publicacions).
 *
 * Gauntlet 261016 (Bloc -1) · El nom canònic públic de la persona pilot és
 * «Javi Llinares», també al catàleg i al padró de llavor. El cognom es troba
 * sense sessió, amb la foto del padró pilot, mai el logotip de l'entitat.
 * Compartir el nom no fusiona dues fitxes ni canvia els seus enllaços.
 *
 * Gauntlet 261016 (Bloc 3.5.1; ordre del Mestre: «Tria i deixa un sol perfil
 * per a cadascuna») · La regla del nom continua valent per als homònims, però
 * la persona de la sessió i la seua fitxa del catàleg ja no són dues: en
 * llavor, qui té sessió declara els àlies de la persona pilot (aliesDeLActor)
 * i el '0001' és un d'ells (clauFundacional). Es fusionen per eixa identitat
 * declarada (ambLaIdentitatPropia), mai pel nom.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../data/identitat.js', () => ({ usuariDeSessio: () => null, getDefaultUserId: () => 'convidat-seed' }));

import { ambLaIdentitatPropia, cercaEntrades, deAgent, deIdentitat, deMembre } from './indexCerca.js';
import { rutaDePerfil } from '../../config/navigation.js';
import { SYSTEM_PAGES } from '../../config/systemPages.js';
import { AGENTS_MAP } from '../../data/agentsSeed.js';
import {
  ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG, IAIA_ID, PERSONA_PILOT, agentIASeed, aliesDeLActor
} from '../../data/identitatsSeed.js';
import { localXat, reiniciaLocalXat } from '../../data/localXat.js';
import { XAT_SEED_IDS } from '../../data/xatSeed.js';
import { AGENT_LIST } from '../profile/profileContent.js';
import { PAGE_COPY } from '../text/pageContent.js';

const SEED = { dataMode: 'seed' };
const ETIQUETA_IA = 'Intel·ligència artificial';
const OPCIONS = { locale: 'ca-ES', etiquetes: { ia: ETIQUETA_IA } };

/* L'índex de persones i entitats de /cerca en llavor i sense sessió: el
   padró abans que el catàleg, com a useCercaGlobal. */
async function indexDeLaLlavor() {
  const padro = await localXat.carregaMembres(null, SEED);
  return [
    ...padro.map((membre) => deMembre(membre, { ...OPCIONS, fitxesDePersones: true })),
    ...AGENT_LIST.map((agent) => deAgent(agent, OPCIONS))
  ].filter(Boolean);
}

let index;
beforeEach(async () => {
  reiniciaLocalXat();
  index = await indexDeLaLlavor();
});

describe('la IAIA MarIA', () => {
  test('es troba com a persona, amb el seu avatar, l’etiqueta d’intel·ligència artificial i l’enllaç al seu perfil', () => {
    const { llista, perTipus } = cercaEntrades(index, 'iaia maria', 'persones');
    expect(perTipus.persones).toBe(1);
    expect(llista).toHaveLength(1);
    const [iaia] = llista;
    expect([iaia.clau, iaia.tipus, iaia.titol]).toEqual([`persones:${IAIA_ID}`, 'persones', 'IAIA MarIA']);
    expect(iaia.avatar).toEqual({ nom: 'IAIA MarIA', src: AGENTS_MAP.IAIA.avatar_url, llavor: IAIA_ID });
    expect(iaia.meta[0]).toBe(ETIQUETA_IA);
    expect(iaia.meta).toContain(AGENTS_MAP.IAIA.role);
    expect(iaia.href).toBe(rutaDePerfil('ia', IAIA_ID));
    expect(iaia.href).toBe(`/perfil/${IAIA_ID}`);
    /* El perfil també s'obri pel seu slug declarat. */
    expect(agentIASeed('iaia-maria')?.id).toBe(IAIA_ID);
  });

  test('«Escriu-li» porta a la seua conversa de la llista del Xat, la mateixa del botó de /iaia', () => {
    const [iaia] = cercaEntrades(index, 'iaia', 'persones').llista;
    expect(iaia.accio).toEqual({ tipus: 'escriu', href: `/xat/${XAT_SEED_IDS.filIaia}` });
  });

  test('també es troba pel rol i pel lema, i no és cap entitat', () => {
    for (const consulta of ['matriarca', 'pensant en global', 'IAIA']) {
      expect([consulta, cercaEntrades(index, consulta, 'persones').llista.map((entrada) => entrada.titol)]).toEqual([consulta, ['IAIA MarIA']]);
    }
    expect(cercaEntrades(index, 'iaia', 'entitats').total).toBe(0);
  });
});

describe('Sóc de Poble', () => {
  test('es troba com a entitat, amb el seu logo i l’enllaç a /empresa/socdepoble', () => {
    const { llista } = cercaEntrades(index, 'sóc de poble', 'entitats');
    expect(llista).toHaveLength(1);
    const [entitat] = llista;
    expect([entitat.clau, entitat.tipus, entitat.titol]).toEqual([`entitats:${ENTITAT_PILOT_ID}`, 'entitats', 'Sóc de Poble']);
    expect(entitat.href).toBe('/empresa/socdepoble');
    expect(entitat.href).toBe(rutaDePerfil('entitat', ENTITAT_PILOT_SLUG));
    expect(entitat.avatar.src).toBe(AGENTS_MAP.SOCDEPOBLE.avatar_url);
    expect(entitat.accio).toMatchObject({ tipus: 'escriu' });
    /* Sense accents ni majúscules, i pel nom del domini. */
    expect(cercaEntrades(index, 'SOC DE POBLE', 'entitats').total).toBe(1);
    expect(cercaEntrades(index, 'socdepoble', 'entitats').total).toBe(1);
  });
});

describe('Javi Llinares', () => {
  test('la persona pilot del catàleg es troba com a persona, amb l’enllaç al seu perfil', () => {
    const { llista } = cercaEntrades(index, 'javi', 'persones');
    expect(llista).toHaveLength(1);
    const [javi] = llista;
    expect([javi.clau, javi.tipus, javi.titol]).toEqual([`persones:${AGENTS_MAP.JAVI.id}`, 'persones', 'Javi Llinares']);
    expect(javi.href).toBe('/gent/0001');
    expect(javi.href).toBe(rutaDePerfil('persona', AGENTS_MAP.JAVI.id));
    expect(javi.accio).toEqual({ tipus: 'escriu', href: `/xat?amb=${AGENTS_MAP.JAVI.id}` });
  });

  /* Gauntlet 261016 (Bloc 3.5.1; ordre del Mestre: «Tria i deixa un sol
     perfil per a cadascuna») · Prova actualitzada a propòsit. Abans fixava
     dues fitxes «Javi Llinares» (la sessió 'u-javi' cap a /el-meu-perfil i el
     '0001' del catàleg cap a /gent/0001), per la regla del Bloc -1 «compartir
     el nom no les fusiona». Eixa regla es manté per als homònims (prova
     següent) i en remot (D1). La fusió d'ací no és pel nom: és per identitat
     declarada. En llavor, qui té sessió porta els àlies de la persona pilot
     (aliesDeLActor) i el '0001' n'és un (clauFundacional). */
  const SESSIO = Object.freeze({ tipus: 'persona', id: 'u-javi', nom: 'Javi Llinares', avatar: PERSONA_PILOT.avatar, rol: 'persona' });
  const fitxaPropia = (identitat = SESSIO) => deIdentitat(identitat, { ...OPCIONS, nomCompte: 'El teu compte' });
  const aliesDeLaSessio = (dataMode) => [...aliesDeLActor(SESSIO, { dataMode })];
  const resum = (llista) => llista.map((entrada) => [entrada.clau, entrada.id, entrada.tipus, entrada.titol, entrada.href, entrada.avatar.src]);
  const PROPIA = ['persones:u-javi', 'u-javi', 'persones', 'Javi Llinares', '/el-meu-perfil', PERSONA_PILOT.avatar];

  test('Bloc 3.5.1 · en llavor amb sessió, el nom sencer troba una sola fitxa: la pròpia, sense «Escriu-li»', () => {
    const entrades = ambLaIdentitatPropia([fitxaPropia(), ...index], aliesDeLaSessio('seed'));
    for (const [consulta, tipus] of [['javi llinares', 'persones'], ['javi llinares', 'tot'], ['llinares', 'tot'], ['javi', 'persones']]) {
      const resultat = cercaEntrades(entrades, consulta, tipus);
      expect([consulta, tipus, resultat.perTipus.persones, resum(resultat.llista)]).toEqual([consulta, tipus, 1, [PROPIA]]);
      expect(resultat.llista[0].accio).toBeNull();
    }
    /* El text del catàleg també compta: el seu rol troba la fitxa pròpia. */
    expect(resum(cercaEntrades(entrades, 'coordinador', 'persones').llista)).toEqual([PROPIA]);
    /* La IAIA i l'entitat pilot no es toquen. */
    expect(cercaEntrades(entrades, 'iaia', 'persones').llista.map((entrada) => entrada.clau)).toEqual([`persones:${IAIA_ID}`]);
    expect(cercaEntrades(entrades, 'sóc de poble', 'entitats').llista.map((entrada) => entrada.clau)).toEqual([`entitats:${ENTITAT_PILOT_ID}`]);
  });

  test('Bloc 3.5.1 · una sessió amb l’id d’un àlies de la persona pilot també és ella, sense cap altre àlies', () => {
    const propia = fitxaPropia({ ...SESSIO, id: PERSONA_PILOT.slug });
    const { llista } = cercaEntrades(ambLaIdentitatPropia([propia, ...index]), 'javi llinares', 'persones');
    expect(llista.map((entrada) => [entrada.clau, entrada.href])).toEqual([[`persones:${PERSONA_PILOT.slug}`, '/el-meu-perfil']]);
  });

  test('Bloc 3.5.1 · la regla del Bloc -1 es manté per als homònims: un altre id amb el mateix nom és una altra fitxa', () => {
    const homonim = deMembre({ usuari_id: 'u-pepa', nom: 'Javi Llinares', tipus: 'persona' }, { ...OPCIONS, fitxesDePersones: true });
    const entrades = ambLaIdentitatPropia([fitxaPropia(), homonim, ...index], aliesDeLaSessio('seed'));
    const { llista } = cercaEntrades(entrades, 'javi llinares', 'persones');
    expect(llista.map((entrada) => [entrada.clau, entrada.titol, entrada.href, entrada.accio?.href ?? null])).toEqual([
      ['persones:u-javi', 'Javi Llinares', '/el-meu-perfil', null],
      ['persones:u-pepa', 'Javi Llinares', '/gent/u-pepa', '/xat?amb=u-pepa']
    ]);
  });

  test('Bloc 3.5.1 · en remot el compte no declara cap àlies de la persona pilot: el mateix nom no el fusiona (D1)', () => {
    const entrades = ambLaIdentitatPropia([fitxaPropia(), ...index], aliesDeLaSessio('remote'));
    expect(cercaEntrades(entrades, 'javi llinares', 'persones').llista.map((entrada) => [entrada.clau, entrada.href])).toEqual([
      ['persones:u-javi', '/el-meu-perfil'],
      ['persones:0001', '/gent/0001']
    ]);
  });

  test('Bloc 3.5.1 · sense sessió no hi ha fitxa pròpia i l’índex no canvia', () => {
    expect(ambLaIdentitatPropia(index, aliesDeLaSessio('seed'))).toEqual(index);
  });

  /* Bloc -1 (261016) · El cognom ja és públic. El padró i el catàleg de la
     mateixa persona es dedupliquen per ID i mantenen la foto personal. */
  test('Gauntlet 261016 · sense sessió, el cognom troba un perfil públic amb la foto del padró pilot', () => {
    for (const [consulta, tipus] of [['llinares', 'tot'], ['javi llinares', 'tot'], ['javi llinares', 'persones']]) {
      const resultat = cercaEntrades(index, consulta, tipus);
      expect(resultat.total).toBe(1);
      expect(resultat.llista.map((entrada) => [entrada.clau, entrada.id, entrada.tipus, entrada.titol, entrada.href, entrada.avatar.src]))
        .toEqual([['persones:0001', '0001', 'persones', 'Javi Llinares', '/gent/0001', PERSONA_PILOT.avatar]]);
      expect(resultat.llista[0].avatar.src).toBe(AGENTS_MAP.JAVI.avatar_url);
      expect(resultat.llista[0].avatar.src).not.toBe(AGENTS_MAP.SOCDEPOBLE.avatar_url);
    }
  });
});

/* En local el contingut base no porta catàleg d'agents (supabase/content.js):
   l'índex de persones i entitats és només el padró del xat. */
describe('en local, sense catàleg', () => {
  test('el padró sol ja troba els tres, amb l’enllaç al perfil i «Escriu-li»', async () => {
    const padro = (await localXat.carregaMembres(null, { dataMode: 'local' }))
      .map((membre) => deMembre(membre, { ...OPCIONS, fitxesDePersones: true }));
    const troba = (consulta, tipus) => cercaEntrades(padro, consulta, tipus).llista
      .map((entrada) => [entrada.titol, entrada.href, entrada.accio?.href]);
    expect(troba('iaia', 'persones')).toEqual([['IAIA MarIA', `/perfil/${IAIA_ID}`, `/xat?amb=${IAIA_ID}`]]);
    expect(troba('sóc de poble', 'entitats')).toEqual([['Sóc de Poble', '/empresa/socdepoble', '/xat?amb=socdepoble']]);
    expect(troba('javi', 'persones')).toEqual([['Javi Llinares', '/gent/0001', '/xat?amb=0001']]);
    const [iaia] = cercaEntrades(padro, 'iaia', 'persones').llista;
    expect([iaia.meta, iaia.avatar.src]).toEqual([[ETIQUETA_IA], AGENTS_MAP.IAIA.avatar_url]);
  });
});

describe('cap dels tres té una targeta de sistema al Mur', () => {
  test('SYSTEM_PAGES no porta cap clau ni cap ruta seua', () => {
    const seues = new Set([
      'iaia', 'ia', 'anima', 'iaia-maria', IAIA_ID,
      'socdepoble', 'soc-de-poble', ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG,
      'javi', 'javillinares', AGENTS_MAP.JAVI.id, ...PERSONA_PILOT.alies
    ]);
    expect(SYSTEM_PAGES.filter((pagina) => seues.has(pagina.key)).map((pagina) => pagina.key)).toEqual([]);
    const rutesDePerfil = /^\/(?:perfil|gent|empresa|grup|ajuntament|iaia|el-meu-perfil)(?:\/|$)/;
    expect(SYSTEM_PAGES.filter((pagina) => rutesDePerfil.test(pagina.href)).map((pagina) => pagina.href)).toEqual([]);
  });

  test('cap pàgina del sistema es diu com ells', () => {
    const noms = new Set(['IAIA MarIA', 'Sóc de Poble', 'Javi', 'Javi Llinares']);
    const titols = SYSTEM_PAGES.map((pagina) => PAGE_COPY[pagina.key]?.title).filter(Boolean);
    expect(titols).toHaveLength(SYSTEM_PAGES.length);
    expect(titols.filter((titol) => noms.has(titol))).toEqual([]);
  });
});
