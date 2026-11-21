// @vitest-environment node
/* P0-ANDROID-PUSH (v1.2.16) · B8b · Després d'entrar o de crear el compte, qui venia d'un enllaç de
   lectura compartit hi torna (tercera excepció escrita a l'ordre 261002; prompt 0216, T2.4). Llista
   tancada de cinc famílies: cap URL externa, cap «//», cap /calendari ni cap ruta d'administració.
   rutaEntrada.test.js no canvia: aterratgeDespresDEntrar és el mateix. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { aterratgeAmbLectura, esTornadaDeLectura, senseSeguiment } from './tornadaDeLectura.js';
import { MAXIM_TORNADA, RUTA_COMPTE, RUTA_DESPRES_D_ENTRAR, aterratgeDespresDEntrar, rutaDEntrada } from './rutaEntrada.js';

describe('P0-ANDROID-PUSH · B8b · torna a la fitxa de lectura', () => {
  test.each([
    '/events/aplec-2023',
    '/events/7b0c2f8e-3d1a-4a52-9c1e-2f3b4c5d6e7f',
    '/mur/abc-123',
    '/mercat/oli-500#preu',
    '/page/rutes-de-poble',
    '/pobles/la-torre-de-les-macanes',
    '/pobles/l%C3%A0ger'
  ])('%s', (tornada) => {
    expect(esTornadaDeLectura(tornada)).toBe(true);
    expect(aterratgeAmbLectura(tornada)).toBe(tornada);
  });

  test('la tornada que construïx rutaDEntrada (la barra negra, l’accés del Xat) i que llig /registre', () => {
    const ida = rutaDEntrada({ mode: 'entrar', tornar: '/events/aplec-2023' });
    expect(ida).toBe('/registre?mode=entrar&tornar=%2Fevents%2Faplec-2023');
    expect(aterratgeAmbLectura(new URLSearchParams(ida.split('?')[1]).get('tornar'))).toBe('/events/aplec-2023');
    const crea = rutaDEntrada({ mode: 'crear', tornar: '/mur/abc-123' });
    expect(aterratgeAmbLectura(new URLSearchParams(crea.split('?')[1]).get('tornar'))).toBe('/mur/abc-123');
  });
});

/* Gauntlet v1.2.16, ronda 2 (L1R2-01) · Facebook i Instagram afigen ?fbclid= (o ?igshid=) a cada
   enllaç eixint, i les campanyes ?utm_*: la barra negra els posa a la tornada (rutaSencera,
   useIdentitatDeLaBarra.js). Es lleven NOMÉS eixos, d'una llista tancada, i es torna a la fitxa
   neta; amb qualsevol altra clau, la tornada no canvia i va al perfil, com abans. */
describe('L1R2-01 · els paràmetres de seguiment no tanquen la tornada a la fitxa', () => {
  test.each([
    ['fbclid (Facebook)', '/events/aplec-2023?fbclid=IwAR0abcDEF', '/events/aplec-2023'],
    ['utm_source i utm_medium', '/mur/abc-123?utm_source=whatsapp&utm_medium=social', '/mur/abc-123'],
    ['igshid (Instagram)', '/mercat/oli-500?igshid=xyz', '/mercat/oli-500'],
    ['gclid (Google)', '/pobles/la-torre-de-les-macanes?gclid=Cj0K', '/pobles/la-torre-de-les-macanes'],
    ['una pàgina amb utm_campaign', '/page/rutes-de-poble?utm_campaign=tardor', '/page/rutes-de-poble'],
    ['la clau en majúscules', '/events/aplec-2023?FBCLID=x&UTM_Source=y', '/events/aplec-2023'],
    ['una clau sense valor', '/events/aplec-2023?fbclid', '/events/aplec-2023'],
    ['amb un fragment net', '/events/aplec-2023?fbclid=x#comentaris', '/events/aplec-2023#comentaris']
  ])('%s: torna a la fitxa neta', (_nom, tornar, fitxa) => {
    expect(senseSeguiment(tornar)).toBe(fitxa);
    expect(aterratgeAmbLectura(tornar)).toBe(fitxa);
  });

  test('la tornada que construïx la barra negra amb ?fbclid= torna a la fitxa', () => {
    const ida = rutaDEntrada({ mode: 'entrar', tornar: '/events/aplec-2023?fbclid=IwAR0abcDEF' });
    expect(ida).toBe('/registre?mode=entrar&tornar=%2Fevents%2Faplec-2023%3Ffbclid%3DIwAR0abcDEF');
    expect(aterratgeAmbLectura(new URLSearchParams(ida.split('?')[1]).get('tornar'))).toBe('/events/aplec-2023');
  });

  test.each([
    ['una consulta que actua', '/mur/abc?connectar=1'],
    ['una consulta mixta', '/mur/abc?fbclid=x&connectar=1'],
    ['una clau de seguiment codificada amb una altra que actua', '/mur/abc?fbclid=x&%63onnectar=1'],
    ['un fragment amb consulta', '/events/a#a?b=1'],
    ['seguiment i un fragment brut', '/events/aplec-2023?fbclid=x#<script>'],
    ['una consulta buida', '/events/aplec-2023?'],
    ['una consulta de només separadors', '/events/aplec-2023?&&'],
    ['una clau buida', '/events/aplec-2023?=x'],
    ['una clau que només s’hi assembla', '/events/aplec-2023?fbclidx=1'],
    ['un prefix utm sense guió baix', '/events/aplec-2023?utmsource=x'],
    ['el Xat amb seguiment', '/xat?fbclid=x'],
    ['la llista del Mur amb seguiment', '/mur?utm_source=x'],
    ['un mes del calendari amb seguiment', '/calendari?mes=2026-11&utm_source=x'],
    ['el calendari amb només seguiment', '/calendari?fbclid=x'],
    ['un segment ocult amb seguiment', '/mur/.ocult?fbclid=x'],
    ['l’administració amb seguiment', '/admin/usuaris?utm_source=x']
  ])('%s: continua anant al perfil', (_nom, tornar) => {
    expect(aterratgeAmbLectura(tornar)).toBe(RUTA_DESPRES_D_ENTRAR);
  });

  test('sense consulta, o amb qualsevol altra clau, senseSeguiment torna la tornada tal qual', () => {
    for (const tornada of ['/events/aplec-2023', '/mercat/oli-500#preu', '/events/a#a?b=1', '/mur/abc?connectar=1', '/mur/abc?fbclid=x&connectar=1', '/events/aplec-2023?']) {
      expect(senseSeguiment(tornada)).toBe(tornada);
    }
  });

  test('la Gestoria amb seguiment continua manant amb la consulta sencera (aterratgeDespresDEntrar)', () => {
    const tornar = '/app/gestoria/tauler?utm_source=x';
    expect(aterratgeAmbLectura(tornar)).toBe(aterratgeDespresDEntrar(tornar));
    expect(aterratgeAmbLectura(tornar)).toBe(tornar);
  });

  test('temps lineal amb una consulta hostil de seguiment del màxim permès', () => {
    const peca = 'fbclid=a&';
    const voltes = Math.floor((MAXIM_TORNADA - 20) / peca.length);
    const hostil = `/mercat/oli?${peca.repeat(voltes)}`;
    const mixta = `/mercat/oli?${peca.repeat(voltes)}x=1`;
    expect(mixta.length).toBeLessThanOrEqual(MAXIM_TORNADA);
    const inici = performance.now();
    expect(aterratgeAmbLectura(hostil)).toBe('/mercat/oli');
    expect(aterratgeAmbLectura(mixta)).toBe(RUTA_DESPRES_D_ENTRAR);
    expect(performance.now() - inici).toBeLessThan(25);
  });
});

describe('P0-ANDROID-PUSH · B8b · continua anant al perfil', () => {
  test.each([
    ['cap tornada', null],
    ['un valor que no és text', 42],
    ['la llista del Mur', '/mur'],
    ['una consulta que actua', '/mur/abc?connectar=1'],
    ['dos segments', '/mur/a/b'],
    ['un segment ocult', '/mur/.ocult'],
    ['un segment de punts', '/mur/..'],
    ['un segment de punts codificat', '/mur/%2e%2e'],
    ['un escapament mal format', '/mur/abc%2'],
    ['les Notes', '/notes/x'],
    ['Connectar', '/connectar?abast=poble'],
    ['el Xat amb un objecte', '/xat?sobre=poble:x'],
    ['el Xat', '/xat'],
    ['una pàgina amb majúscules', '/page/Rutes'],
    ['un fragment brut', '/mercat/oli#<script>'],
    ['un fragment amb consulta', '/events/aplec-2023#a?b=1'],
    ['el calendari que desa', '/calendari?mode=desa'],
    ['un mes del calendari', '/calendari?mes=2026-11'],
    ['un dia del calendari', '/calendari?date=2026-11-22'],
    ['l’administració', '/admin/usuaris'],
    ['el Panell de Control', '/control'],
    ['la Consola', '/consola'],
    ['una URL externa', 'https://dolent.test/events/aplec-2023'],
    ['una adreça sense esquema', '//dolent.test/events/aplec-2023'],
    ['una barra inversa', '/events/\\dolent.test'],
    ['un espai', '/events/aplec 2023'],
    ['un salt de línia', '/events/aplec\n2023'],
    ['l’entrada mateixa', '/registre?tornar=%2Fevents%2Faplec-2023'],
    ['massa llarga', `/events/${'a'.repeat(MAXIM_TORNADA)}`],
    ['un id massa llarg per a la fitxa', `/events/${'a'.repeat(201)}`]
  ])('%s', (_nom, tornar) => {
    expect(aterratgeAmbLectura(tornar)).toBe(RUTA_DESPRES_D_ENTRAR);
  });

  test('la Gestoria i «El compte» continuen manant a través d’aterratgeAmbLectura', () => {
    for (const tornar of ['/app/gestoria/tauler', '/app/gestoria/impostos?any=2026', RUTA_COMPTE]) {
      expect(aterratgeAmbLectura(tornar)).toBe(aterratgeDespresDEntrar(tornar));
      expect(aterratgeAmbLectura(tornar)).toBe(tornar);
    }
    expect(aterratgeAmbLectura('/app/bar/carta')).toBe(RUTA_DESPRES_D_ENTRAR);
  });

  test('temps lineal amb una tornada hostil del màxim permès', () => {
    const hostil = `/mercat/${'a%2'.repeat(Math.floor((MAXIM_TORNADA - 10) / 3))}`;
    const inici = performance.now();
    expect(aterratgeAmbLectura(hostil)).toBe(RUTA_DESPRES_D_ENTRAR);
    expect(performance.now() - inici).toBeLessThan(25);
  });
});

/* [VA-2] El mòdul no pot caure a l'arrencada estàtica del connector de WordPress: només l'importa
   OnboardingSection.jsx (tros diferit), mai App.jsx, rutaEntrada.js ni cap altre mòdul de la closca. */
test('B8b · cap mòdul de la closca d’arrencada importa tornadaDeLectura.js', () => {
  const llig = (ruta) => readFileSync(path.join(process.cwd(), ruta), 'utf8');
  for (const ruta of ['src/app/App.jsx', 'src/config/rutaEntrada.js', 'src/PedraSecaEmbed.jsx', 'src/main.jsx', 'src/embed.jsx']) {
    expect(llig(ruta), ruta).not.toContain('tornadaDeLectura');
  }
  expect(llig('src/sections/onboarding/OnboardingSection.jsx')).toContain("import { aterratgeAmbLectura } from '../../config/tornadaDeLectura.js';");
});
