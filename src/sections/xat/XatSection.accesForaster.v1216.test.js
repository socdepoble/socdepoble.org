// @vitest-environment node
/* P0-ANDROID-PUSH (v1.2.16) · L'accés del Xat, la porta del Foraster (doctrina del Mestre, 261121
   01:55: / aterra sempre a /xat; prompt 0216, T2.5). jsdom no resol la cascada: es comproven les
   fonts. El DOM el comprova XatSection.avatars.test.jsx.
   · B9 · Un sol verb, «Entrar», en les 5 llengües: la clau de /registre i de la barra negra; la vella
     «Connectar-se» ja no és a cap diccionari (també resta bytes del tros `ca` d'arrencada, [VA2-19]).
   · B11b · El Sènior escala només l'accés ([VA2-20]): les píndoles a 56 px; cap regla per a les files, per a les
     bombolles ni (IDEA-323.3, v1.2.22) per a cap paràgraf de l'accés.
   · B11c · La fila del xip «Lletra gran», al full diferit; modules.css (arrencada de WordPress) no hi
     porta cap regla .sdp-mode-senior-.
   v1.2.18 · Gauntlet R1 (L1-01) · modules.css ja no és intacte: l'Onada R32.28 (C-2) hi deixa la regla
     de «Descarrega l'App» dins de la fila (.sdp-xat-acces > .sdp-alerta__accions >
     .sdp-xat-acces__descarrega), que fixa XatSection.acces.capes.test.js. Sense cap regla del xip. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import CA from '../../config/idiomes/ca.js';
import ES from '../../config/idiomes/es.js';
import EN from '../../config/idiomes/en.js';
import EU from '../../config/idiomes/eu.js';
import GL from '../../config/idiomes/gl.js';

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const senseComentaris = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '');
const net = (text) => text.replace(/\s+/g, ' ').trim();
const SENIOR = net(':is(:root[data-sdp-senior="true"], :host([data-sdp-senior="true"]), .sdp-root[data-sdp-senior="true"])');

/** Les regles d'un full: [{ selectors: string[], decl: Record<string,string> }] (sense @media). */
function regles(full) {
  const sortida = [];
  for (const m of senseComentaris(full).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = net(m[1].split(';').pop().replace(/^@layer\s+\w+\s*\{?/, ''));
    const decl = {};
    for (const d of m[2].split(';')) {
      const [prop, ...resta] = d.split(':');
      if (prop && resta.length) decl[net(prop)] = net(resta.join(':'));
    }
    sortida.push({ selector, decl });
  }
  return sortida;
}

describe('B9 · un sol verb a l’accés del Xat', () => {
  const DICCIONARIS = { ca: CA, es: ES, en: EN, eu: EU, gl: GL };
  test.each(Object.entries(DICCIONARIS))('%s: «Entrar» és la clau de l’entrada i «Connectar-se» ja no hi és', (_llengua, dic) => {
    expect(typeof dic['section.login.loginButton']).toBe('string');
    expect(dic['section.login.loginButton'].trim().length).toBeGreaterThan(0);
    expect(Object.hasOwn(dic, 'section.xat.sessio.connectar')).toBe(false);
  });

  test('els textos de les 5 llengües són els de /registre: Entrar, Entrar, Sign in, Sartu, Entrar', () => {
    expect([CA, ES, EN, EU, GL].map((dic) => dic['section.login.loginButton'])).toEqual(['Entrar', 'Entrar', 'Sign in', 'Sartu', 'Entrar']);
  });

  test('AccesAlXat demana «Entrar» i mai la clau vella', () => {
    const font = llig('src/sections/xat/XatSection.jsx');
    const acces = font.slice(font.indexOf('function AccesAlXat('), font.indexOf('function AccesAlXat(') + 2000);
    expect(acces).toContain("{t('section.login.loginButton', 'Entrar')}");
    expect(font).not.toContain('section.xat.sessio.connectar');
  });

  /* Gauntlet v1.2.16 (L1-01, L6-P2-01) · El Foraster també veu el botó d'entrada als diàlegs sense
     sessió (conversa nova i compartir): ha de dir el mateix verb que l'accés. La clau de cada botó
     que porta a rutaDEntrada({ tornar }) es llig de la font; el text, dels cinc diccionaris. */
  const ENTRADES = ['src/sections/xat/XatSection.jsx', 'src/sections/xat/components/DialegNovaConversa.jsx',
    'src/sections/xat/components/DialegCompartir.jsx'];
  const BOTO_ENTRAR = /rutaDEntrada\(\{ tornar \}\)\)\}>\s*\{t\('([\w.-]+)'/g;
  const clausDEntrada = Object.fromEntries(ENTRADES.map((ruta) => [ruta, [...llig(ruta).matchAll(BOTO_ENTRAR)].map((m) => m[1])]));

  test('cada porta d’entrada del Xat (l’accés i els dos diàlegs) té un sol botó «Entrar»', () => {
    for (const ruta of ENTRADES) expect(clausDEntrada[ruta], ruta).toHaveLength(1);
  });

  test.each(Object.entries(DICCIONARIS))('%s: els diàlegs sense sessió diuen el mateix verb que l’accés', (llengua, dic) => {
    const verb = dic['section.login.loginButton'];
    for (const ruta of ENTRADES) {
      for (const clau of clausDEntrada[ruta]) expect(dic[clau], `${llengua} · ${ruta} · ${clau}`).toBe(verb);
    }
    expect(Object.hasOwn(dic, 'section.xat.sessio.entrar'), `${llengua}: la clau vella, sense consumidor`).toBe(false);
  });
});

describe('B11b · el Sènior escala l’accés del Xat i res més', () => {
  const diferit = llig('src/css/diferit-mode-senior.css');
  const totes = regles(diferit);

  test('les píndoles de l’accés entren a la llista de 56 px, només dins de .sdp-xat-acces', () => {
    const dianes = totes.find((r) => r.selector.startsWith(SENIOR) && r.selector.includes('.sdp-mode-senior-xip') && r.decl['min-height'] === '3.5rem');
    expect(dianes, 'la regla de les dianes Sènior').toBeTruthy();
    expect(dianes.selector).toContain('.sdp-xat-acces .sdp-xat-pindola');
    /* La píndola en línia dins de text (DialegCompartir, DialegNovaConversa) no hi entra. */
    expect(net(senseComentaris(diferit))).not.toMatch(/[(,] \.sdp-xat-pindola[ ,)]/);
  });

  /* IDEA-323.3 (v1.2.22, ordre del Mestre del 261122) · L'accés ja no porta la benvinguda (la diu la targeta
     d'acollida de dalt): fora la seua escala Sènior. S'actualitza a posta. */
  test('IDEA-323.3 · l’accés no porta cap benvinguda: cap regla Sènior per al paràgraf', () => {
    expect(totes.some((r) => r.selector.includes('.sdp-xat-acces > p'))).toBe(false);
  });

  test('[VA2-20] cap regla per a les files ni per a les bombolles del Xat', () => {
    const codi = senseComentaris(diferit);
    for (const classe of ['.sdp-xat-fila', '.sdp-xat-bombolla', '.sdp-xat-llista']) expect(codi, classe).not.toContain(classe);
  });
});

describe('B11c · la fila del xip «Lletra gran», al full diferit', () => {
  const totes = regles(llig('src/css/diferit-mode-senior.css'));
  const de = (selector) => totes.find((r) => r.selector === selector)?.decl ?? null;

  /* v1.2.18 · Gauntlet R1 (L1-01, L1-02) · Les declaracions finals de la franja de l'Onada R32.28
     (C-2): flex: 1 1 auto, com «Descarrega l'App», i com a molt el 100% de la fila amb un mínim vàlid
     (auto). Expectativa actualitzada a propòsit. */
  test('la franja s’estira com la píndola veïna, sense marge, i el xip n’ocupa l’amplària', () => {
    expect(de('.sdp-xat-acces .sdp-mode-senior-franja')).toEqual({
      flex: '1 1 auto', 'min-inline-size': 'auto', 'max-inline-size': '100%', margin: '0',
    });
    expect(de('.sdp-xat-acces .sdp-mode-senior-xip')).toEqual({ 'inline-size': '100%' });
  });

  test('entre la fila del xip i la parella, només el buit de l’alerta', () => {
    expect(de('.sdp-xat-acces > .sdp-alerta__accions + .sdp-alerta__accions')).toEqual({ 'margin-top': '0' });
  });

  test('modules.css, que viatja a l’arrencada de WordPress, no porta cap regla del xip', () => {
    const modules = senseComentaris(llig('src/css/modules.css'));
    expect(modules).not.toContain('.sdp-mode-senior-');
  });

  test('cap :has() al full diferit (Baseline 2022)', () => {
    expect(senseComentaris(llig('src/css/diferit-mode-senior.css'))).not.toContain(':has(');
  });
});
