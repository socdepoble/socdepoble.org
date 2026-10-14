import { describe, expect, test } from 'vitest';
import { ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG } from '../../data/identitatsSeed.js';
/* Onada 8 (261009) · El pilot porta al seu perfil (RUTA_PERFIL_PROJECTE), ja no a /projecte. */
import { RUTA_PERFIL_PROJECTE } from '../../config/navigation.js';
import { DEFAULT_AUTHOR } from '../../components/universal/UniversalUtils.js';
import {
  ETIQUETA_IA, avatarDeLaBarraDeFitxa, esFitxaDelPilot, etiquetesDeFitxa, pobleDeFitxa, potEditarFitxa, rutaDeFitxaPublica, slugDEntitat,
} from './fitxaDePerfil.js';

/* Ordre del Mestre (261008, «Les vistes») · Les funcions pures que l'apartat
   i la seua pàgina comparteixen amb l'editor de la fitxa. Són còpies de la
   lògica de PerfilEditor.jsx: estes proves fixen que diuen el mateix (les
   rutes, les mateixes que PerfilEditor.test.jsx). Dades sintètiques. */

const jo = { id: 'jo', mena: 'persona', nom: 'Pep', rol: 'Persona', dades: { town_name: 'La Torre' } };
const org = (role, dades = {}) => ({ id: 'O', mena: 'empresa', nom: 'Forn', rol: 'Empresa', dades: { role, ...dades } });
const agent = { id: 'A', mena: 'agent', nom: 'IAIA', rol: 'Agent IA', dades: { name: 'IAIA' } };

describe('rutaDeFitxaPublica', () => {
  test('persona per dades.id, grup a /grup, entitat a /empresa, pilot al seu perfil, agent a /perfil, sense id null', () => {
    expect(rutaDeFitxaPublica({ ...jo, dades: { id: 'U' } })).toBe('/gent/U');
    expect(rutaDeFitxaPublica(jo)).toBeNull();
    expect(rutaDeFitxaPublica({ id: 'G', mena: 'grup', nom: 'Colla' })).toBe('/grup/G');
    expect(rutaDeFitxaPublica({ id: 'O', mena: 'empresa', nom: 'Forn' })).toBe('/empresa/O');
    expect(rutaDeFitxaPublica({ id: ENTITAT_PILOT_ID, mena: 'empresa', nom: 'Sóc de Poble' })).toBe(RUTA_PERFIL_PROJECTE);
    expect(rutaDeFitxaPublica(agent)).toBe('/perfil/A');
    expect(rutaDeFitxaPublica(null)).toBeNull();
  });

  test('l’entitat pilot es reconeix pel slug (un UUID en remot), mai un grup, una persona ni un agent', () => {
    const uuid = '5b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6';
    expect(rutaDeFitxaPublica({ id: uuid, mena: 'empresa', nom: 'X', dades: { slug: ENTITAT_PILOT_SLUG } })).toBe(RUTA_PERFIL_PROJECTE);
    expect(rutaDeFitxaPublica({ id: uuid, mena: 'empresa', nom: 'X', dades: { slug: 'forn' } })).toBe(`/empresa/${uuid}`);
    expect(rutaDeFitxaPublica({ id: 'G', mena: 'grup', nom: 'Colla', dades: { slug: ENTITAT_PILOT_SLUG } })).toBe('/grup/G');
    expect(rutaDeFitxaPublica({ ...agent, dades: { slug: ENTITAT_PILOT_SLUG } })).toBe('/perfil/A');
    expect(rutaDeFitxaPublica({ ...jo, dades: { id: 'U', slug: ENTITAT_PILOT_SLUG } })).toBe('/gent/U');
    expect(rutaDeFitxaPublica({ mena: 'empresa', nom: 'X', dades: { slug: ENTITAT_PILOT_SLUG } })).toBeNull();
  });

  test('slugDEntitat: només d’una organització que no és un grup', () => {
    expect(slugDEntitat(org('owner', { slug: 'forn' }))).toBe('forn');
    expect(slugDEntitat(org('owner'))).toBe('');
    expect(slugDEntitat({ id: 'G', mena: 'grup', dades: { slug: 'colla' } })).toBe('');
    expect(slugDEntitat({ ...jo, dades: { slug: 'pep' } })).toBe('');
    expect(slugDEntitat(agent)).toBe('');
  });
});

describe('potEditarFitxa', () => {
  test('la persona, els agents i qui és propietària o administradora; mai un membre', () => {
    expect(potEditarFitxa(jo)).toBe(true);
    expect(potEditarFitxa(agent)).toBe(true);
    expect(potEditarFitxa(org('owner'))).toBe(true);
    expect(potEditarFitxa(org('admin'))).toBe(true);
    expect(potEditarFitxa(org('member'))).toBe(false);
    expect(potEditarFitxa(org(undefined))).toBe(false);
    expect(potEditarFitxa({ id: 'G', mena: 'grup', nom: 'Colla', dades: { role: 'owner' } })).toBe(true);
    expect(potEditarFitxa(null)).toBe(false);
  });

  test('amb una baixa en curs o amb la fila de reserva, la fitxa és de lectura', () => {
    expect(potEditarFitxa({ ...jo, dades: { baixa_demanada_at: '2026-09-26T10:00:00Z' } })).toBe(false);
    expect(potEditarFitxa({ ...jo, dades: { reserva: true } })).toBe(false);
    // Una organització no té ni baixa ni reserva: la decidix el rol.
    expect(potEditarFitxa(org('owner', { baixa_demanada_at: '2026-09-26T10:00:00Z', reserva: true }))).toBe(true);
  });
});

describe('pobleDeFitxa', () => {
  test('la persona, el seu poble', () => {
    expect(pobleDeFitxa(jo, [jo])).toBe('La Torre');
    expect(pobleDeFitxa({ ...jo, dades: {} }, [jo])).toBe('');
  });

  test('una organització, el seu poble o cap: mai el de la persona (decisió del Mestre, 261008)', () => {
    expect(pobleDeFitxa(org('owner', { town_name: 'Alcoi' }), [jo])).toBe('Alcoi');
    expect(pobleDeFitxa(org('owner'), [jo])).toBe('');
  });

  test('un agent IA, el seu o, si no en té, el de la persona que l’administra', () => {
    expect(pobleDeFitxa(agent, [jo, agent])).toBe('La Torre');
    expect(pobleDeFitxa({ ...agent, dades: { town_name: 'Ibi' } }, [jo])).toBe('Ibi');
    expect(pobleDeFitxa(agent)).toBe('');
  });
});

describe('etiquetesDeFitxa', () => {
  test('el rol i, si cal, la baixa, la falta de connexió o l’avís d’IA', () => {
    expect(etiquetesDeFitxa(jo)).toEqual([{ text: 'Persona' }]);
    expect(etiquetesDeFitxa(org('member'))).toEqual([{ text: 'Empresa' }]);
    expect(etiquetesDeFitxa({ ...jo, dades: { baixa_demanada_at: '2026-09-26T10:00:00Z' } })).toEqual([{ text: 'Persona' }, { text: 'Baixa en curs' }]);
    expect(etiquetesDeFitxa({ ...jo, dades: { reserva: true } })).toEqual([{ text: 'Persona' }, { text: 'Sense connexió' }]);
    expect(etiquetesDeFitxa(agent)).toEqual([{ text: 'Agent IA' }, { text: ETIQUETA_IA }]);
    expect(ETIQUETA_IA).toBe('Intel·ligència artificial');
  });
});

/* Prompt 261014_0400 (ordre del Mestre, tasca 4: «Quan l'usuari actua com a
   Sóc de Poble, la barra taronja ha de carregar automàticament l'autoria
   oficial», el PNG verd, «evitant en qualsevol cas la silueta negra») · Una
   sola regla per a la barra taronja i la targeta viva de la fitxa, la que
   lligen l'editor (PerfilEditor), «Les vistes» (DetallVistes) i «El compte»
   (DetallCompte). El pilot, pel slug declarat o per l'id de la llavor (el
   criteri de l'ordre E, esRutaDelProjecte), porta el PNG verd oficial siga
   quin siga el logo de la fila; qualsevol altra fitxa, l'avatar que ja tenia. */
describe('avatarDeLaBarraDeFitxa', () => {
  const PNG_VERD = '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png';
  const uuid = '5b0c1d2e-3f40-4a51-8b62-7c83d94ea5f6';
  const LOGOS_DE_LA_FILA = [null, undefined, '', 'sdp-media://organitzacions/x.png', '/assets/x.webp'];

  test('el pilot, pel slug declarat (un UUID en remot) o per l’id de la llavor: el PNG verd oficial, mai la silueta ni el logo de la fila', () => {
    expect(DEFAULT_AUTHOR.avatarUrl).toBe(PNG_VERD);
    const pilots = [
      { id: uuid, mena: 'empresa', nom: 'Sóc de Poble', dades: { slug: ENTITAT_PILOT_SLUG, role: 'owner' } },
      { id: uuid, mena: 'empresa', nom: 'Un altre nom', dades: { slug: ENTITAT_PILOT_SLUG, role: 'member' } },
      { id: ENTITAT_PILOT_ID, mena: 'empresa', nom: 'Sóc de Poble', dades: { role: 'owner' } },
    ];
    for (const identitat of pilots) {
      for (const logo of LOGOS_DE_LA_FILA) expect([identitat.id, logo, avatarDeLaBarraDeFitxa(identitat, logo)]).toEqual([identitat.id, logo, PNG_VERD]);
    }
  });

  test('una altra organització, l’homònima amb un altre slug, un grup, una persona o un agent: l’avatar resolt, sense canvis', () => {
    const altres = [
      { id: 'O', mena: 'empresa', nom: 'Forn', dades: { slug: 'forn', role: 'owner' } },
      { id: uuid, mena: 'empresa', nom: 'Sóc de Poble', dades: { slug: 'soc-de-poble-de-relleu', role: 'owner' } },
      { id: 'G', mena: 'grup', nom: 'Colla', dades: { slug: ENTITAT_PILOT_SLUG, role: 'owner' } },
      { ...jo, nom: 'Sóc de Poble', dades: { id: 'U', slug: ENTITAT_PILOT_SLUG } },
      { ...agent, dades: { slug: ENTITAT_PILOT_SLUG } },
    ];
    for (const identitat of altres) {
      for (const logo of LOGOS_DE_LA_FILA) expect([identitat.id, logo, avatarDeLaBarraDeFitxa(identitat, logo)]).toEqual([identitat.id, logo, logo]);
    }
    // Sense identitat, el que arriba.
    expect(avatarDeLaBarraDeFitxa(null, '')).toBe('');
    expect(avatarDeLaBarraDeFitxa(undefined, '/assets/a.webp')).toBe('/assets/a.webp');
  });

  /* Revisió del prompt 261014_0400 · El criteri, a soles: el que lligen
     «Les vistes» i l'editor per a no demanar al port un logo que la fitxa
     del pilot no pinta. El mateix pilot i les mateixes altres de dalt. */
  test('esFitxaDelPilot: el pilot pel slug declarat o per l’id de la llavor; mai pel nom, un grup, una persona ni un agent', () => {
    expect(esFitxaDelPilot({ id: uuid, mena: 'empresa', nom: 'Un altre nom', dades: { slug: ENTITAT_PILOT_SLUG, role: 'member' } })).toBe(true);
    expect(esFitxaDelPilot({ id: ENTITAT_PILOT_ID, mena: 'empresa', nom: 'Sóc de Poble', dades: { role: 'owner' } })).toBe(true);
    expect(esFitxaDelPilot({ id: 'O', mena: 'empresa', nom: 'Forn', dades: { slug: 'forn', role: 'owner' } })).toBe(false);
    expect(esFitxaDelPilot({ id: uuid, mena: 'empresa', nom: 'Sóc de Poble', dades: { slug: 'soc-de-poble-de-relleu' } })).toBe(false);
    expect(esFitxaDelPilot({ id: 'G', mena: 'grup', nom: 'Colla', dades: { slug: ENTITAT_PILOT_SLUG } })).toBe(false);
    expect(esFitxaDelPilot({ ...jo, nom: 'Sóc de Poble', dades: { id: 'U', slug: ENTITAT_PILOT_SLUG } })).toBe(false);
    expect(esFitxaDelPilot({ ...agent, dades: { slug: ENTITAT_PILOT_SLUG } })).toBe(false);
    expect(esFitxaDelPilot(null)).toBe(false);
  });
});
