import { describe, expect, test } from 'vitest';
import { ETIQUETES_TIPUS, MINIM_CERCA, accionsSobre, candidatsDeMembre, clauDeMembre, ordenaMembres } from './membresModel.js';

/* Ordre del Mestre (261008, grup C) · El model pur dels membres d'una
   organització: l'ordre de la llista, què s'oferix sobre cada membre (les
   decisions del Mestre) i els candidats a membre. */
const persona = (id, nom, rol = 'member') => ({ tipus: 'persona', id, nom, avatar: '', rol, desDe: null });
const org = (id, nom) => ({ tipus: 'organitzacio', id, nom, avatar: '', rol: 'member', desDe: null });

describe('ordenaMembres', () => {
  test('la propietària, les administradores i els membres; persones abans que organitzacions; per nom (ca)', () => {
    const entrada = [
      org('o1', 'Àgora'), persona('p3', 'Zoe'), persona('p2', 'Èlia', 'admin'), persona('p1', 'Pepa', 'owner'),
      persona('p4', 'Andreu'), persona('p5', 'Bernat', 'admin'), null,
    ];
    const copia = [...entrada];
    expect(ordenaMembres(entrada).map((m) => m.id)).toEqual(['p1', 'p5', 'p2', 'p4', 'p3', 'o1']);
    // No muta l'entrada.
    expect(entrada).toEqual(copia);
  });

  test('sense llista, una llista buida; un rol desconegut va al final', () => {
    expect(ordenaMembres(undefined)).toEqual([]);
    expect(ordenaMembres(null)).toEqual([]);
    expect(ordenaMembres([persona('x', 'X', 'rar'), persona('y', 'Y')]).map((m) => m.id)).toEqual(['y', 'x']);
  });
});

describe('accionsSobre (decisions del Mestre)', () => {
  const owner = { rolMeu: 'owner', jo: 'JO' };
  const admin = { rolMeu: 'admin', jo: 'JO' };

  test('la propietària: nomena, degrada i lleva; la propietària i ella mateixa, intocables', () => {
    expect(accionsSobre(persona('P', 'Pepa', 'owner'), owner)).toEqual({ rol: null, lleva: false });
    expect(accionsSobre(persona('JO', 'Jo', 'admin'), owner)).toEqual({ rol: null, lleva: false });
    expect(accionsSobre(persona('A', 'Admin', 'admin'), owner)).toEqual({ rol: 'member', lleva: true });
    expect(accionsSobre(persona('M', 'Membre'), owner)).toEqual({ rol: 'admin', lleva: true });
    expect(accionsSobre(org('O', 'Colla'), owner)).toEqual({ rol: null, lleva: true });
  });

  test('una administradora: només lleva membres i organitzacions; cap administradora ni cap nomenament', () => {
    expect(accionsSobre(persona('A', 'Admin', 'admin'), admin)).toEqual({ rol: null, lleva: false });
    expect(accionsSobre(persona('M', 'Membre'), admin)).toEqual({ rol: null, lleva: true });
    expect(accionsSobre(org('O', 'Colla'), admin)).toEqual({ rol: null, lleva: true });
    expect(accionsSobre(persona('P', 'Pepa', 'owner'), admin)).toEqual({ rol: null, lleva: false });
    expect(accionsSobre(persona('JO', 'Jo', 'admin'), admin)).toEqual({ rol: null, lleva: false });
  });

  test('qui no administra, o un membre estrany, no té cap acció', () => {
    expect(accionsSobre(persona('M', 'Membre'), { rolMeu: 'member', jo: 'JO' })).toEqual({ rol: null, lleva: false });
    expect(accionsSobre(persona('M', 'Membre'), {})).toEqual({ rol: null, lleva: false });
    expect(accionsSobre(null, owner)).toEqual({ rol: null, lleva: false });
    expect(accionsSobre({ tipus: 'ia', id: 'X', rol: 'member' }, owner)).toEqual({ rol: null, lleva: false });
    // L'id es compara com a text: el seed fa servir '0001'.
    expect(accionsSobre(persona(1, 'U'), { rolMeu: 'owner', jo: '1' })).toEqual({ rol: null, lleva: false });
  });
});

describe('candidatsDeMembre', () => {
  const persones = [
    { usuari_id: 'P', nom: 'Pepa Forner', tipus: 'persona', avatar_url: '/p.webp', fil_id: null },
    { usuari_id: 'Q', nom: 'Quique', avatar_url: null },
    { usuari_id: 'E', nom: 'Forn Vell', tipus: 'entitat', avatar_url: null },
    { usuari_id: 'I', nom: 'IAIA MarIA', tipus: 'ia', avatar_url: null },
    { usuari_id: 'JO', nom: 'Jo', tipus: 'persona' },
    { nom: 'Sense id', tipus: 'persona' },
    { usuari_id: 'P', nom: 'Pepa Forner', tipus: 'persona' },
  ];
  const organitzacions = [
    { id: 'O', name: 'Forn', role: 'owner' },
    { id: 'G', name: 'Colla del Forn', role: 'admin', logo_url: '/g.webp' },
    { id: 'H', name: 'Forners', role: 'member' },
    { id: 'C', name: 'Cooperatíva Agrícola', role: 'owner' },
  ];

  test('persones del padró (també sense tipus) i organitzacions que administra, sense la mateixa, sense ella i sense repetits', () => {
    expect(candidatsDeMembre({ persones, organitzacions, orgId: 'O', jo: 'JO' })).toEqual([
      { tipus: 'persona', id: 'P', nom: 'Pepa Forner', avatar: '/p.webp' },
      { tipus: 'persona', id: 'Q', nom: 'Quique', avatar: '' },
      { tipus: 'organitzacio', id: 'G', nom: 'Colla del Forn', avatar: '/g.webp' },
      { tipus: 'organitzacio', id: 'C', nom: 'Cooperatíva Agrícola', avatar: '' },
    ]);
  });

  test('el text filtra les organitzacions sense accents ni majúscules; les persones ja venen cercades', () => {
    const ids = candidatsDeMembre({ persones, organitzacions, orgId: 'O', text: '  COOPERATIVA agri ' }).map(clauDeMembre);
    expect(ids).toEqual(['persona:P', 'persona:Q', 'persona:JO', 'organitzacio:C']);
  });

  test('qui ja és membre no s’oferix', () => {
    const membres = [{ tipus: 'persona', id: 'P' }, { tipus: 'organitzacio', id: 'G' }, null];
    expect(candidatsDeMembre({ persones, organitzacions, membres, orgId: 'O', jo: 'JO' }).map(clauDeMembre))
      .toEqual(['persona:Q', 'organitzacio:C']);
  });

  test('sense dades, cap candidat', () => {
    expect(candidatsDeMembre()).toEqual([]);
    expect(candidatsDeMembre({ persones: null, organitzacions: undefined, membres: 'x' })).toEqual([]);
  });
});

test('la clau, les etiquetes i el mínim de la cerca', () => {
  expect(clauDeMembre({ tipus: 'persona', id: 7 })).toBe('persona:7');
  expect(clauDeMembre(null)).toBe(':');
  expect(ETIQUETES_TIPUS).toEqual({ persona: 'Persona', organitzacio: 'Organització' });
  expect(MINIM_CERCA).toBe(2);
});
