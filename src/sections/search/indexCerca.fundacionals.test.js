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

import { ambLaIdentitatPropia, cercaEntrades, deAgent, deIdentitat, deMembre, dePagina } from './indexCerca.js';
import { PAGES_SEED } from '../../data/appSeed.js';
import { RUTA_FITXA_IAIA, rutaDePerfil } from '../../config/navigation.js';
import { SYSTEM_PAGES } from '../../config/systemPages.js';
import { AGENTS_MAP } from '../../data/agentsSeed.js';
import {
  ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG, ENTITAT_RENTONAR_SLUG, IAIA_ID, PERSONA_PILOT, POBLE_FUNDACIONAL, agentIASeed, aliesDeLActor
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
    /* Gauntlet 261016_1530 (Bloc 3.6.3; F65; ordre del Mestre: /iaia «és on
       s'ha d'accedir des del xat i des del cercador») · Actualitzada a posta:
       abans fixava /perfil/<id>. La fitxa neta de la IAIA és /iaia
       (RUTA_FITXA_IAIA); /perfil/<id> continua obrint la mateixa fitxa i
       rutaDePerfil no canvia. */
    expect(iaia.href).toBe(RUTA_FITXA_IAIA);
    expect(iaia.href).toBe('/iaia');
    expect(rutaDePerfil('ia', IAIA_ID)).toBe(`/perfil/${IAIA_ID}`);
    /* El perfil també s'obri pel seu slug declarat. */
    expect(agentIASeed('iaia-maria')?.id).toBe(IAIA_ID);
  });

  test('Bloc 3.6.3 · només la IAIA, pel seu id i amb el tipus d’IA, va a /iaia: cap altra IA ni cap homònim', () => {
    const iaDelCataleg = deAgent({ id: 'gall', name: 'El Gall', type: 'AI' }, OPCIONS);
    expect(iaDelCataleg.href).toBe('/perfil/gall');
    const homonima = deMembre({ usuari_id: 'u-maria', nom: 'IAIA MarIA', tipus: 'persona' }, { ...OPCIONS, fitxesDePersones: true });
    expect(homonima.href).toBe('/gent/u-maria');
    const ambSonId = deMembre({ usuari_id: IAIA_ID, nom: 'IAIA MarIA', tipus: 'persona' }, { ...OPCIONS, fitxesDePersones: true });
    expect(ambSonId.href).toBe(`/gent/${IAIA_ID}`);
  });

  test('Bloc 3.6.3 · la fila del padró de la IAIA enllaça a /iaia també sense fitxes de persones (la fitxa ix del paquet)', () => {
    const fila = deMembre({ usuari_id: IAIA_ID, nom: 'IAIA MarIA', tipus: 'ia' }, OPCIONS);
    expect([fila.href, fila.accio]).toEqual(['/iaia', { tipus: 'escriu', href: `/xat?amb=${IAIA_ID}` }]);
    /* Una altra persona o IA del padró, com sempre: sense fitxesDePersones, cap enllaç. */
    expect(deMembre({ usuari_id: 'u-pepa', nom: 'Pepa', tipus: 'persona' }, OPCIONS).href).toBeNull();
    expect(deMembre({ usuari_id: 'gall', nom: 'El Gall', tipus: 'ia' }, OPCIONS).href).toBeNull();
  });

  /* Bloc 3.6.3 (F64 i F65) · Al Cercador, la IAIA (persones) porta a la seua
     fitxa, /iaia, i el manifest «L'Ànima de la IAIA» (pàgines, la llavor de
     PAGE_COPY que llig useCercaGlobal) a /anima: cap resultat no confon les dues. */
  test('Bloc 3.6.3 · la IAIA ix a /iaia i el manifest, a les pàgines, a /anima', () => {
    const pagines = PAGES_SEED.map(dePagina).filter(Boolean);
    const manifest = cercaEntrades(pagines, 'còdex forense', 'pagines').llista;
    expect(manifest.map((entrada) => [entrada.id, entrada.titol, entrada.href])).toEqual([['anima', PAGE_COPY.anima.title, '/anima']]);
    expect(pagines.filter((entrada) => entrada.href === RUTA_FITXA_IAIA)).toEqual([]);
    const tot = [...index, ...pagines];
    const iaia = cercaEntrades(tot, 'iaia maria', 'persones').llista;
    expect(iaia.map((entrada) => entrada.href)).toEqual([RUTA_FITXA_IAIA]);
    expect(tot.filter((entrada) => entrada.href === '/anima').map((entrada) => entrada.clau)).toEqual(['pagines:anima']);
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
    /* Bloc 3.6.3 (F65) · Actualitzada a posta: la IAIA, a la seua fitxa neta /iaia (abans /perfil/<id>). */
    expect(troba('iaia', 'persones')).toEqual([['IAIA MarIA', RUTA_FITXA_IAIA, `/xat?amb=${IAIA_ID}`]]);
    expect(troba('sóc de poble', 'entitats')).toEqual([['Sóc de Poble', '/empresa/socdepoble', '/xat?amb=socdepoble']]);
    expect(troba('javi', 'persones')).toEqual([['Javi Llinares', '/gent/0001', '/xat?amb=0001']]);
    const [iaia] = cercaEntrades(padro, 'iaia', 'persones').llista;
    expect([iaia.meta, iaia.avatar.src]).toEqual([[ETIQUETA_IA], AGENTS_MAP.IAIA.avatar_url]);
  });

  /* Gauntlet 261016 (Bloc 3.5.2; ordre del Mestre: «Prohibit mostrar entitats
     sense poble») · En local el padró no porta cap poble i no hi ha catàleg:
     abans «Sóc de Poble» eixia a /cerca sense poble. */
  test('Bloc 3.5.2 · «Sóc de Poble» ix amb el seu poble i es troba per ell; la IAIA i la persona pilot, la meta de sempre', async () => {
    const padro = (await localXat.carregaMembres(null, { dataMode: 'local' }))
      .map((membre) => deMembre(membre, { ...OPCIONS, fitxesDePersones: true }));
    const [entitat] = cercaEntrades(padro, 'sóc de poble', 'entitats').llista;
    expect([entitat.id, entitat.meta]).toEqual([ENTITAT_PILOT_SLUG, [POBLE_FUNDACIONAL]]);
    expect(cercaEntrades(padro, 'torre maçanes', 'entitats').llista.map((e) => e.id)).toEqual([ENTITAT_PILOT_SLUG]);
    const [javi] = cercaEntrades(padro, 'javi', 'persones').llista;
    expect(javi.meta).toEqual([]);
  });
});

/* Gauntlet 261016 (Bloc 3.5.2; ordre del Mestre: «Prohibit mostrar entitats
   sense poble») · El poble d'una entitat del Cercador: el del servidor si n'hi
   ha; si no, el de la llavor o, per a les entitats del Mestre, el seu
   (POBLE_FUNDACIONAL). Cap altra entitat no se n'inventa cap, mai pel nom ni
   pel slug de la fila. */
describe('Bloc 3.5.2 · cap entitat sense poble al Cercador', () => {
  const entitat = (extra) => deMembre({ tipus: 'entitat', nom: 'Sóc de Poble', ...extra }, OPCIONS);
  const UUID = '5b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6';

  test('una fila del padró de les entitats del Mestre (id o àlies declarat) sense poble porta el seu', () => {
    for (const id of [ENTITAT_PILOT_SLUG, 'soc-de-poble_official', ENTITAT_RENTONAR_SLUG]) {
      const fila = entitat({ usuari_id: id });
      expect([id, fila.meta]).toEqual([id, [POBLE_FUNDACIONAL]]);
      expect([id, cercaEntrades([fila], 'maçanes', 'entitats').total]).toEqual([id, 1]);
    }
  });

  test('el poble que diu el servidor sempre mana', () => {
    expect(entitat({ usuari_id: ENTITAT_PILOT_SLUG, town_name: 'Benilloba' }).meta).toEqual(['Benilloba']);
    expect(entitat({ usuari_id: 'o-forn', nom: 'Forn de la Plaça', town_name: ' Penàguila ' }).meta).toEqual(['Penàguila']);
  });

  test('una altra entitat sense poble no se n’inventa cap: ni pel nom, ni amb un UUID no declarat', () => {
    expect(entitat({ usuari_id: 'o-forn', nom: 'Forn de la Plaça' }).meta).toEqual([]);
    expect(entitat({ usuari_id: UUID }).meta).toEqual([]);
  });

  test('una persona o una IA del padró no hi guanyen cap poble, encara que siguen de les identitats del Mestre', () => {
    expect(deMembre({ usuari_id: AGENTS_MAP.JAVI.id, nom: 'Javi Llinares', tipus: 'persona', town_name: 'Benilloba' }, OPCIONS).meta).toEqual([]);
    expect(deMembre({ usuari_id: IAIA_ID, nom: 'IAIA MarIA', tipus: 'ia' }, OPCIONS).meta).toEqual([ETIQUETA_IA]);
  });

  test('una entitat de la sessió (IdentitatContext) porta el poble de la pertinença o, si en falta, el de les del Mestre', () => {
    const propia = (extra) => deIdentitat({ tipus: 'entitat', nom: 'Sóc de Poble', slug: ENTITAT_PILOT_SLUG, poble: '', ...extra }, OPCIONS);
    expect(propia({ id: ENTITAT_PILOT_ID }).meta).toEqual([POBLE_FUNDACIONAL]);
    expect(propia({ id: ENTITAT_PILOT_ID, poble: 'Benilloba' }).meta).toEqual(['Benilloba']);
    /* El slug de la fila no prova res (revisió adversarial, encàrrec C). */
    expect(propia({ id: UUID }).meta).toEqual([]);
    expect(propia({ id: 'o-forn', nom: 'Forn', slug: 'forn' }).meta).toEqual([]);
    /* La persona, la de sempre: el poble de la sessió. */
    expect(deIdentitat({ tipus: 'persona', id: 'u-javi', nom: 'Javi Llinares' }, { ...OPCIONS, poble: 'La Vila' }).meta).toEqual(['La Vila']);
  });

  test('en llavor (padró i catàleg), «Sóc de Poble» porta el poble una sola vegada', () => {
    const [sdp] = cercaEntrades(index, 'sóc de poble', 'entitats').llista;
    expect(sdp.meta.filter((valor) => valor === POBLE_FUNDACIONAL)).toEqual([POBLE_FUNDACIONAL]);
    expect(sdp.meta).toContain(AGENTS_MAP.SOCDEPOBLE.role);
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
