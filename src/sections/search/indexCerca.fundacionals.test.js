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
 * Les proves marcades [DEFECTE] reproduïxen el que hui NO passa, perquè conste
 * amb evidència: no són cap contracte, i han de canviar quan el Mestre ho
 * decidisca.
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('../../data/identitat.js', () => ({ usuariDeSessio: () => null, getDefaultUserId: () => 'convidat-seed' }));

import { cercaEntrades, deAgent, deIdentitat, deMembre } from './indexCerca.js';
import { rutaDePerfil } from '../../config/navigation.js';
import { SYSTEM_PAGES } from '../../config/systemPages.js';
import { AGENTS_MAP } from '../../data/agentsSeed.js';
import { ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG, IAIA_ID, PERSONA_PILOT, agentIASeed } from '../../data/identitatsSeed.js';
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
    expect([javi.clau, javi.tipus, javi.titol]).toEqual([`persones:${AGENTS_MAP.JAVI.id}`, 'persones', 'Javi']);
    expect(javi.href).toBe('/gent/0001');
    expect(javi.href).toBe(rutaDePerfil('persona', AGENTS_MAP.JAVI.id));
    expect(javi.accio).toEqual({ tipus: 'escriu', href: `/xat?amb=${AGENTS_MAP.JAVI.id}` });
  });

  test('amb la seua sessió, es troba pel nom sencer i l’enllaç és el del seu perfil', () => {
    const jo = deIdentitat({ tipus: 'persona', id: 'u-javi', nom: 'Javi Llinares', avatar: PERSONA_PILOT.avatar }, { ...OPCIONS, nomCompte: 'El teu compte' });
    const { llista } = cercaEntrades([jo, ...index], 'javi llinares', 'persones');
    expect(llista.map((entrada) => [entrada.titol, entrada.href, entrada.avatar.src])).toEqual([['Javi Llinares', '/el-meu-perfil', PERSONA_PILOT.avatar]]);
  });

  test('[DEFECTE] en llavor i sense sessió, el cognom no el troba i la seua targeta porta el logo de l’entitat', () => {
    /* La llavor l'anomena «Javi» (agentsSeed.js i el padró del xat): cap font
       de l'índex porta «Llinares». Pendent del Mestre. */
    expect(cercaEntrades(index, 'llinares').total).toBe(0);
    expect(cercaEntrades(index, 'javi llinares').total).toBe(0);
    /* I la seua cara al Cercador és la del catàleg (el logo de l'entitat), no
       la foto del padró pilot (PERSONA_PILOT.avatar). */
    const [javi] = cercaEntrades(index, 'javi', 'persones').llista;
    expect(javi.avatar.src).toBe(AGENTS_MAP.SOCDEPOBLE.avatar_url);
    expect(javi.avatar.src).not.toBe(PERSONA_PILOT.avatar);
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
    expect(troba('javi', 'persones')).toEqual([['Javi', '/gent/0001', '/xat?amb=0001']]);
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
