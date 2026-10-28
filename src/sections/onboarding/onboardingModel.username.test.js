// @vitest-environment node
/* P1-68 (pla 261028_1526, §3.8.2.3; decisions del Mestre, 261028) · La regla
   de l'identificador @usuari al client. Els resultats de la taula de noms
   (sintètics) són els de private.usuari_base de 2610282100 executada a
   PGlite 0.3.16 (verificació d'una sola sessió de la línia, 48/48 iguals; i
   la del fixer, 158 noms i entrades sense cap diferència, amb les còpies, el
   límit de 100 i les fundacionals a private.ajustos); la paritat literal amb
   el SQL la guarda src/data/supabase/usuariIPoble.migracio.test.js. */
import { describe, expect, test } from 'vitest';
import {
  ACCENTS_USERNAME, ARRELS_RESERVADES_USERNAME, LLIGADURES_USERNAME, MAXIM_CANDIDATS_USERNAME, MAXIM_USERNAME, MISSATGES_USERNAME,
  MISSATGE_USERNAME_FORMA, MISSATGE_USERNAME_RESERVAT, PARTICULES_USERNAME, PREFIXOS_RESERVATS_USERNAME, USERNAMES_FUNDACIONALS,
  USERNAMES_RESERVATS, USERNAME_DE_RESERVA, ambSufixUsername, baseDeUsername, errorDUsername, esUsernameReservat,
  netejaUsernameEnEscriure, normalitzaUsername, primerUsernameLliure, proposaUsername, validaUsername
} from './onboardingModel.js';
import { AGENTS_IA_SEED, CLAUS_FUNDACIONALS, PERSONA_PILOT } from '../../data/identitatsSeed.js';

/* [nom, base] · Verificats a PGlite contra private.usuari_base. */
const NOMS_I_BASES = Object.freeze([
  ['Joan Peris Gómez', 'joanperis'],
  ['Núria Col·lell i Ferrer', 'nuriacollell'],
  ['Maria de la Cruz Soler', 'mariacruz'],
  ["Pere d'Alcoi", 'perealcoi'],
  ['ÀNGELS  Ŀlorca', 'angelsllorca'],
  ['Veí/na', 'veina'],
  ['Ana-María López', 'anamaria'],
  ['Œdipe Ærø', 'oedipeaero'],
  ['李雷', ''],
  ['', ''],
  ['Josep  Maria  Vidal', 'josepmaria'],
  ['Jordi Pujolàs Carbó Martínez', 'jordipujolas'],
  ['Ignasi Col.lell', 'ignasicollell'],
  ['X', 'x'],
  ['Ramón Y Cajal', 'ramoncajal'],
  ['Anna Pérez Soler', 'annaperez'],
  ['ÉRIC ÇALÓ', 'ericcalo'],
  ['Straße Groß', 'strassegross'],
  ['İlker Kaya', 'lkerkaya'],
  ['Anna-Maria Van der Berg', 'annamaria'],
  ['Mª Àngels Puig', 'mangels'],
  ['AbcdefghijklmnopqrstuvwxyzAbcdef Llarguíssim', 'abcdefghijklmnopqrstuvwx'],
  ['Óscar Ferrer', 'oscarferrer'],
  /* Fixer (revisió de paritat, troballa 3): una partícula al principi, una
     İ que no és cap partícula i una xifra dins del nom. */
  ['De la Fuente Ana', 'fuenteana'],
  ['Kİm Lee', 'km'],
  ['Joan 2n Peris', 'joan2n']
]);

describe('P1-68 · la base de l’identificador', () => {
  test.each(NOMS_I_BASES)('%j → %j', (nom, base) => {
    expect(baseDeUsername(nom)).toBe(base);
  });

  test('cap NFD ni \\p{M}: les taules són explícites i del mateix llarg', () => {
    expect([...ACCENTS_USERNAME.de]).toHaveLength([...ACCENTS_USERNAME.a].length);
    expect(ACCENTS_USERNAME.a).toMatch(/^[a-z]+$/);
    for (const [de, a] of LLIGADURES_USERNAME) expect([de.length, /^[a-z]+$/.test(a)]).toEqual([1, true]);
    expect(PARTICULES_USERNAME).toContain('de');
    expect(PARTICULES_USERNAME).toContain('van');
  });
});

describe('P1-68 · la proposta', () => {
  test('la base; massa curta, «veina»; reservada, amb -2; sense sufix possible, «veina»', () => {
    expect(proposaUsername('Anna Pérez Soler')).toBe('annaperez');
    expect(proposaUsername('X')).toBe(USERNAME_DE_RESERVA);
    expect(proposaUsername('李雷')).toBe('veina');
    expect(proposaUsername(PERSONA_PILOT.nom)).toBe(`${PERSONA_PILOT.slug}-2`);
    expect(proposaUsername('Consola Nova')).toBe('consolanova');
    /* Fixer (revisió de paritat, troballa 3): el llindar de 3 és «>=». */
    expect(proposaUsername('Pep')).toBe('pep');
    expect(proposaUsername('Al')).toBe('veina');
    expect(proposaUsername('Kİm Lee')).toBe('veina');
    /* Fixer (revisió de seguretat, troballes 1 i 5): una base que no pot dur
       cap sufix (la seua -2 també és reservada) no espera cap -N. */
    for (const nom of ['Rentonar', 'Baixa', 'Iaia Maria', 'Mestre', 'Socdepoble Oficial']) expect(proposaUsername(nom), nom).toBe('veina');
  });

  test('la llista reservada, les identitats fundacionals i la IAIA, en la forma d’un identificador', () => {
    const FORMA = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    for (const clau of [...CLAUS_FUNDACIONALS, ...PERSONA_PILOT.alies, ...AGENTS_IA_SEED.map((agent) => agent.slug)].filter((c) => FORMA.test(String(c)))) {
      expect(esUsernameReservat(clau), clau).toBe(true);
    }
    /* Fixer (revisió de seguretat, troballa 6): cap nom de persona a la llista
       literal (la del SQL); les fundacionals ixen de PERSONA_PILOT. */
    expect(USERNAMES_FUNDACIONALS.length).toBeGreaterThan(0);
    for (const clau of USERNAMES_FUNDACIONALS) {
      expect(USERNAMES_RESERVATS, clau).not.toContain(clau);
      expect([PERSONA_PILOT.slug, ...PERSONA_PILOT.alies], clau).toContain(clau);
    }
    expect(USERNAMES_RESERVATS).not.toContain(PERSONA_PILOT.slug);
    expect(new Set(USERNAMES_RESERVATS).size).toBe(USERNAMES_RESERVATS.length);
    expect(USERNAMES_RESERVATS.every((r) => FORMA.test(r))).toBe(true);
    expect(esUsernameReservat('baixa-0a1b2c3d4e5f')).toBe(true);
    expect(esUsernameReservat('baixa')).toBe(true);
    expect(esUsernameReservat('baixador')).toBe(false);
  });

  test('les còpies de les identitats de la plataforma són reservades; un nom que només s’hi assembla, no', () => {
    expect(ARRELS_RESERVADES_USERNAME).toEqual(expect.arrayContaining(PREFIXOS_RESERVATS_USERNAME));
    for (const copia of ['iaia-maria-2', 'iaiamaria', 'socdepoble-2', 'soc-de-poble2', 'soc-de-poble-oficial', 'socdepoblex', 'rentonar-7',
      'admin-2', 'superadmin3', 'mestre-10', 'iaia2', 'iaiamaria-pep']) {
      expect(esUsernameReservat(copia), copia).toBe(true);
    }
    for (const nom of ['mestrejoan', 'iaiapepa', 'rentonera', 'admina-puig', 'joan-mestre', 'soc-pep', 'pepa-2']) {
      expect(esUsernameReservat(nom), nom).toBe(false);
    }
  });
});

describe('P1-68 · el primer lliure (private.usuari_lliure)', () => {
  test('el sufix, dins dels 30 caràcters i sense guionet davant', () => {
    expect(ambSufixUsername('pepa', 2)).toBe('pepa-2');
    expect(ambSufixUsername('a'.repeat(30), 2)).toBe(`${'a'.repeat(28)}-2`);
    expect(ambSufixUsername(`${'a'.repeat(26)}-bcd`, 10)).toBe(`${'a'.repeat(26)}-10`);
    expect(ambSufixUsername('a'.repeat(30), 100)).toHaveLength(MAXIM_USERNAME);
  });

  test('salta els ocupats i els reservats; una base reservada amb -2; una sense sufix possible, «veina»', () => {
    const ocupats = new Set(['pepa', 'pepa-2', 'veina']);
    const ocupat = (candidat) => ocupats.has(candidat);
    expect(primerUsernameLliure('pepa', { ocupat })).toBe('pepa-3');
    expect(primerUsernameLliure('consola', { ocupat })).toBe('consola-2');
    expect(primerUsernameLliure('ab', { ocupat })).toBe('veina-2');
    expect(primerUsernameLliure('baixa', { ocupat })).toBe('veina-2');
    expect(primerUsernameLliure('iaia-maria', { ocupat })).toBe('veina-2');
  });

  test(`com a molt ${MAXIM_CANDIDATS_USERNAME} candidats; després, 'veina-' i 8 xifres a l’atzar`, () => {
    const mirats = [];
    const ocupat = (candidat) => { mirats.push(candidat); return mirats.length <= 150; };
    const atzar = () => '0a1b2c3d-4e5f-4000-8000-000000000000';
    expect(primerUsernameLliure('pepa', { ocupat, atzar })).toBe('veina-0a1b2c3d');
    expect(mirats).toHaveLength(MAXIM_CANDIDATS_USERNAME);
    expect(mirats.at(-1)).toBe(`pepa-${MAXIM_CANDIDATS_USERNAME}`);
    expect(primerUsernameLliure('pepa', { ocupat: () => true })).toMatch(/^veina-[0-9a-f]{8}$/);
  });
});

describe('P1-68 · escrit a mà', () => {
  test('normalitza com el servidor (private.usuari_normalitzat)', () => {
    expect(normalitzaUsername('@Joan.Peris')).toBe('joan-peris');
    expect(normalitzaUsername('  Joan  Peris ')).toBe('joan-peris');
    expect(normalitzaUsername('JOAN__P')).toBe('joan-p');
    expect(normalitzaUsername('-x-')).toBe('x');
    expect(normalitzaUsername('@@')).toBe('');
    expect(normalitzaUsername('àéíóú-ÀÉÍÓÚ')).toBe('aeiou-aeiou');
    expect(normalitzaUsername('a'.repeat(40))).toHaveLength(MAXIM_USERNAME);
    expect(normalitzaUsername('ab-cd-'.repeat(8))).toBe('ab-cd-ab-cd-ab-cd-ab-cd-ab-cd');
  });

  test('mentre s’escriu, el guionet del final es queda', () => {
    expect(netejaUsernameEnEscriure('Joan-')).toBe('joan-');
    expect(netejaUsernameEnEscriure('Joan P')).toBe('joan-p');
    expect(netejaUsernameEnEscriure('-joan')).toBe('joan');
  });

  test('valida la forma, els límits i la reserva (llevat del que ja té)', () => {
    expect(validaUsername('ab')).toBe(MISSATGE_USERNAME_FORMA);
    expect(validaUsername('abc')).toBeNull();
    expect(validaUsername('a'.repeat(30))).toBeNull();
    expect(validaUsername('a'.repeat(31))).toBe(MISSATGE_USERNAME_FORMA);
    expect(validaUsername('Joan')).toBe(MISSATGE_USERNAME_FORMA);
    expect(validaUsername('joan_p')).toBe(MISSATGE_USERNAME_FORMA);
    expect(validaUsername('joan--p')).toBe(MISSATGE_USERNAME_FORMA);
    expect(validaUsername('consola')).toBe(MISSATGE_USERNAME_RESERVAT);
    expect(validaUsername(PERSONA_PILOT.slug, { actual: PERSONA_PILOT.slug })).toBeNull();
    expect(validaUsername(PERSONA_PILOT.slug)).toBe(MISSATGE_USERNAME_RESERVAT);
    expect(validaUsername('iaia-maria-2')).toBe(MISSATGE_USERNAME_RESERVAT);
  });
});

describe('P1-68 · els errors', () => {
  test('cada codi de desa_el_meu_usuari té la seua frase; ocupat porta la proposta', () => {
    for (const codi of ['SDP-USER-000', 'SDP-USER-001', 'SDP-USER-002', 'SDP-USER-003', 'SDP-USER-004', 'SDP-USER-005', 'SDP-USER-006', 'SDP-USER-007']) {
      expect(MISSATGES_USERNAME[codi], codi).toMatch(/\.$/);
    }
    const ocupat = errorDUsername('ocupat', { proposta: 'annaperez-2' });
    expect(ocupat).toMatchObject({ code: 'ocupat', proposta: 'annaperez-2' });
    expect(ocupat.message).toContain('@annaperez-2');
    expect(errorDUsername('INVENTAT').code).toBe('DESCONEGUT');
  });
});
