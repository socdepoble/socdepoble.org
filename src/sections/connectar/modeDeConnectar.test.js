import { describe, expect, test } from 'vitest';
import { TIPUS_SOCIALS, botoPrincipalDeLaRelacio, disposicioDeLaVista, entitatsPerIncloure, esPerfilSocial } from './modeDeConnectar.js';
import { origenDeLaConnexio, actorsPerConnectar } from './ConnectarSection.jsx';

/* FEDI-22 (ordre del Mestre, 261103; captura 261103_2055) · La disposició de
   /connectar: 'social' (un perfil amb relació, o la fitxa carregant) o
   'element'. C1 · sense dependre d'orgId. */
const origen = (consulta) => origenDeLaConnexio(new URLSearchParams(consulta));

describe('disposicioDeLaVista · taula de veritat', () => {
  test('un perfil de persona, d’entitat o de grup amb relació, o amb la fitxa carregant, és social', () => {
    for (const objecte of ['persona', 'entitat', 'grup']) {
      const esPerfil = esPerfilSocial(origen(`item_id=x&sectionId=perfil&objecte=${objecte}`));
      expect(esPerfil, objecte).toBe(true);
      expect(disposicioDeLaVista({ esPerfil, ambRelacio: true }), objecte).toBe('social');
      expect(disposicioDeLaVista({ esPerfil, carregantFitxa: true }), objecte).toBe('social');
    }
    expect(TIPUS_SOCIALS).toEqual(['persona', 'entitat', 'grup']);
  });

  test('C1 · un perfil d’entitat amb ?organitzacio però sense relació és element', () => {
    const esPerfil = esPerfilSocial(origen('item_id=o1&sectionId=perfil&objecte=entitat&organitzacio=o1'));
    expect(disposicioDeLaVista({ esPerfil, ambRelacio: false, carregantFitxa: false })).toBe('element');
  });

  test('una IA, un perfil sense camins, el Mur, el Mercat, un poble, una pàgina o sense secció: element', () => {
    expect(esPerfilSocial(origen('item_id=iaia-maria&sectionId=perfil&objecte=ia'))).toBe(false);
    expect(disposicioDeLaVista({ esPerfil: true })).toBe('element');
    for (const consulta of [
      'item_id=p1&sectionId=mur', 'item_id=samarreta&sectionId=mercat', 'item_id=sella&sectionId=pobles&objecte=poble',
      'item_id=legal&sectionId=page&objecte=pagina', ''
    ]) {
      const esPerfil = esPerfilSocial(origen(consulta));
      expect(esPerfil, consulta).toBe(false);
      expect(disposicioDeLaVista({ esPerfil, ambRelacio: true, carregantFitxa: true }), consulta).toBe('element');
    }
    expect(disposicioDeLaVista()).toBe('element');
  });
});

describe('botoPrincipalDeLaRelacio', () => {
  test('sense contacte, entrar; abans, connectar; sense sessió, entrar (C3); comprovant, cap', () => {
    expect(botoPrincipalDeLaRelacio({ teContacte: false, estat: 'no-segueix' })).toBe('entra');
    expect(botoPrincipalDeLaRelacio({ teContacte: true, estat: 'no-segueix' })).toBe('connecta');
    expect(botoPrincipalDeLaRelacio({ teContacte: true, estat: 'sense-sessio' })).toBe('entra');
    expect(botoPrincipalDeLaRelacio({ teContacte: true, estat: 'comprovant' })).toBeNull();
  });

  test('ja connectats o sense poder connectar des d’ací: escriure-li, o res si el destí és teu', () => {
    for (const estat of ['segueix', 'no-disponible', 'no-seguible']) {
      expect(botoPrincipalDeLaRelacio({ teContacte: true, estat }), estat).toBe('escriu');
      expect(botoPrincipalDeLaRelacio({ teContacte: true, estat, propi: true }), estat).toBeNull();
    }
    expect(botoPrincipalDeLaRelacio({ teContacte: true, estat: 'desconegut' })).toBeNull();
  });
});

describe('entitatsPerIncloure (C2) · la mateixa font que «Connectar com a»', () => {
  const TONI = { tipus: 'persona', id: 'U', nom: 'Toni Ferrer' };
  const RENTONAR = { tipus: 'entitat', id: 'org-r', nom: 'El Rentonar', rol: 'owner', kind: 'entity', poble: '  Relleu ' };
  const FORN = { tipus: 'entitat', id: 'org-f', nom: 'Forn de la Torre', rol: 'admin', kind: 'company' };
  const COLLA = { tipus: 'entitat', id: 'org-c', nom: 'Colla', rol: 'member', kind: 'group' };

  test('només les entitats que administra, amb el seu rol, l’etiqueta del selector i el poble (RA-05); mai la persona ni un membre', () => {
    const identitats = [TONI, RENTONAR, FORN, COLLA];
    const actors = actorsPerConnectar(identitats);
    expect(entitatsPerIncloure(actors, identitats)).toEqual([
      { valor: 'org-r', etiqueta: 'El Rentonar (entitat)', nom: 'El Rentonar', rol: 'owner', poble: 'Relleu' },
      { valor: 'org-f', etiqueta: 'Forn de la Torre (empresa)', nom: 'Forn de la Torre', rol: 'admin', poble: '' }
    ]);
  });

  test('sense barrets, cap; amb entrades que no són llistes, cap', () => {
    expect(entitatsPerIncloure(actorsPerConnectar([TONI]), [TONI])).toEqual([]);
    expect(entitatsPerIncloure(null, null)).toEqual([]);
    expect(entitatsPerIncloure([{ valor: 'org-r', etiqueta: 'x', nom: 'x' }], [])).toEqual([]);
  });
});
