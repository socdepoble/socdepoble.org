import { describe, expect, test } from 'vitest';
import { ROLS_DE_LA_VISTA, ROL_PER_DEFECTE, TEXTOS_ROL, accioDInclusio, etiquetaDeRol, opcionsDeRol, opcionsDeRolDemanat } from './rolsDInclusio.js';
import { createTranslator } from '../../../config/i18n.js';
/* Els cinc diccionaris, carregats abans de cap prova (createTranslator('es') parla castellà). */
import '../../../../tests/helpers/diccionaris.js';

/* FEDI-22 (ordre del Mestre, 261103) · Els tres rols de la tria: cap opció que
   el servidor rebutge ni que enganye. «Treballador / Soci» no s'escriu mai. */
const resum = (opcions) => opcions.map(({ valor, desactivada = false, ajuda }) => ({ valor, desactivada, ajuda }));

describe('opcionsDeRol · incloure una persona', () => {
  test('la propietària: Administrador actiu, Treballador / Soci desactivat amb el motiu, Usuari / Membre per defecte', () => {
    expect(ROLS_DE_LA_VISTA).toEqual(['admin', 'treballador', 'member']);
    expect(ROL_PER_DEFECTE).toBe('member');
    const opcions = opcionsDeRol({ rolPropi: 'owner', rolActual: null });
    expect(opcions.map((o) => o.etiqueta)).toEqual(['Administrador', 'Treballador / Soci', 'Usuari / Membre']);
    expect(resum(opcions)).toEqual([
      { valor: 'admin', desactivada: false, ajuda: TEXTOS_ROL.adminAjuda[1] },
      { valor: 'treballador', desactivada: true, ajuda: TEXTOS_ROL.treballadorPendent[1] },
      { valor: 'member', desactivada: false, ajuda: TEXTOS_ROL.membreAjuda[1] }
    ]);
  });

  test('una administradora: Administrador desactivat, amb «Només la propietària…»', () => {
    const [admin] = opcionsDeRol({ rolPropi: 'admin', rolActual: null });
    expect(admin).toMatchObject({ valor: 'admin', desactivada: true, ajuda: 'Només la propietària de l’entitat nomena administradores.' });
  });

  test('si ja en forma part, cap opció: el que es pot fer ho diu accioDInclusio', () => {
    for (const rolActual of ['owner', 'admin', 'member']) {
      expect(opcionsDeRol({ rolPropi: 'owner', rolActual }), rolActual).toEqual([]);
    }
  });

  test('amb el traductor de veres, en castellà', () => {
    const t = createTranslator('es');
    expect(opcionsDeRol({ rolPropi: 'owner', t }).map((o) => o.etiqueta)).toEqual(['Administrador', 'Trabajador / Socio', 'Usuario / Miembro']);
    expect(etiquetaDeRol('treballador', t)).toBe('Trabajador / Socio');
    expect(etiquetaDeRol('owner', t)).toBe('');
  });
});

describe('accioDInclusio · què s’escriu', () => {
  test('segons el rol actual: propietària o administradora, res (mai es degrada); membre, només l’ascens de la propietària', () => {
    expect(accioDInclusio({ rolActual: 'owner', rolPropi: 'owner' })).toBeNull();
    expect(accioDInclusio({ rolActual: 'admin', rolPropi: 'owner', rolTriat: 'member' })).toBeNull();
    expect(accioDInclusio({ rolActual: 'member', rolPropi: 'owner' })).toEqual({ tipus: 'ascens', rol: 'admin', confirma: true });
    expect(accioDInclusio({ rolActual: 'member', rolPropi: 'admin' })).toBeNull();
  });

  test('sense rol actual: membre en 1 clic; administradora només la propietària i amb confirmació', () => {
    expect(accioDInclusio({ rolActual: null, rolPropi: 'admin', rolTriat: 'member' })).toEqual({ tipus: 'alta', rol: 'member', confirma: false });
    expect(accioDInclusio({ rolActual: null, rolPropi: 'owner', rolTriat: 'admin' })).toEqual({ tipus: 'alta', rol: 'admin', confirma: true });
    expect(accioDInclusio({ rolActual: null, rolPropi: 'admin', rolTriat: 'admin' })).toBeNull();
    expect(accioDInclusio()).toEqual({ tipus: 'alta', rol: 'member', confirma: false });
  });

  test('«Treballador / Soci» no surt mai en cap escriptura', () => {
    for (const rolActual of [null, 'member', 'admin', 'owner', 'treballador']) {
      for (const rolPropi of ['owner', 'admin', null]) {
        for (const rolTriat of ['admin', 'treballador', 'member', 'owner']) {
          const accio = accioDInclusio({ rolActual, rolPropi, rolTriat });
          if (accio) expect(['member', 'admin'], `${rolActual}/${rolPropi}/${rolTriat}`).toContain(accio.rol);
        }
      }
    }
    expect(accioDInclusio({ rolActual: null, rolPropi: 'owner', rolTriat: 'treballador' })).toBeNull();
  });
});

/* Integració 261104 (àrbitre) amb FEDI-23 de Codex · Si el servidor desa les
   funcions (ambFuncions), «Treballador / Soci» és una alta més d'1 clic, sense
   autoritat. La resta de regles no canvien: mai es degrada ni es canvia una
   funció des d'ací. */
describe('ambFuncions · el servidor desa «Treballador / Soci»', () => {
  test('les opcions: Treballador / Soci actiu, amb la seua ajuda; Administrador continua sent de la propietària', () => {
    expect(resum(opcionsDeRol({ rolPropi: 'admin', ambFuncions: true }))).toEqual([
      { valor: 'admin', desactivada: true, ajuda: TEXTOS_ROL.adminNomesPropietaria[1] },
      { valor: 'treballador', desactivada: false, ajuda: TEXTOS_ROL.treballadorAjuda[1] },
      { valor: 'member', desactivada: false, ajuda: TEXTOS_ROL.membreAjuda[1] }
    ]);
    expect(opcionsDeRol({ rolPropi: 'owner', rolActual: 'member', ambFuncions: true })).toEqual([]);
  });

  test('l’alta de treballador és d’1 clic; amb un rol actual, res de nou', () => {
    for (const rolPropi of ['owner', 'admin']) {
      expect(accioDInclusio({ rolPropi, rolTriat: 'treballador', ambFuncions: true })).toEqual({ tipus: 'alta', rol: 'treballador', confirma: false });
    }
    for (const rolActual of ['member', 'admin', 'owner']) {
      const accio = accioDInclusio({ rolActual, rolPropi: 'owner', rolTriat: 'treballador', ambFuncions: true });
      if (accio) expect(accio).toEqual({ tipus: 'ascens', rol: 'admin', confirma: true });
    }
    expect(accioDInclusio({ rolPropi: 'admin', rolTriat: 'admin', ambFuncions: true })).toBeNull();
    expect(accioDInclusio({ rolPropi: 'owner', rolTriat: 'owner', ambFuncions: true })).toBeNull();
  });

  test('només true activa les funcions: un valor estrany és com sense', () => {
    for (const ambFuncions of [false, undefined, 'true', 1, {}]) {
      expect(accioDInclusio({ rolPropi: 'owner', rolTriat: 'treballador', ambFuncions })).toBeNull();
      expect(opcionsDeRol({ rolPropi: 'owner', ambFuncions })[1].desactivada).toBe(true);
    }
  });
});

describe('opcionsDeRolDemanat · demanar formar part d’una entitat', () => {
  test('tres opcions actives, membre per defecte; l’ajuda d’Administrador uneix les dues frases (C12)', () => {
    const opcions = opcionsDeRolDemanat();
    expect(opcions.map((o) => [o.valor, Boolean(o.desactivada)])).toEqual([['admin', false], ['treballador', false], ['member', false]]);
    expect(opcions[0].ajuda).toBe(`${TEXTOS_ROL.adminAjuda[1]} ${TEXTOS_ROL.adminNomesPropietaria[1]}`);
    expect(opcions[1].ajuda).toBe(TEXTOS_ROL.treballadorDemana[1]);
    expect(opcions[2].ajuda).toBe(TEXTOS_ROL.membreAjuda[1]);
  });

  test('les reserves són el valor del diccionari ca, lletra per lletra', () => {
    const ca = createTranslator('ca');
    for (const [clau, reserva] of Object.values(TEXTOS_ROL)) expect(ca(clau, ''), clau).toBe(reserva);
  });
});
