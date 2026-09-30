import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

/* T9 (ordre del Mestre, 260930) · Cap taula fa scroll vertical propi.
   L'únic desplaçament de .sdp-taula és l'horitzontal (pantalles estretes);
   el vertical és sempre el de la pàgina (.app-main__content). El modificador
   que tancava Inventari i Entrades en una caixa de 70vh, amb la capçalera
   enganxada dins, ha desaparegut del CSS i del JSX (opció B del pla).
   jsdom no calcula el layout: es comproven les regles dels fulls. */

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(resolve(ARREL, ruta), 'utf8');
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Fitxers d'una carpeta, recursivament, que casen amb l'extensió. */
function fitxers(carpeta, extensio) {
  const eixida = [];
  for (const nom of readdirSync(resolve(ARREL, carpeta))) {
    const ruta = join(carpeta, nom);
    if (statSync(resolve(ARREL, ruta)).isDirectory()) eixida.push(...fitxers(ruta, extensio));
    else if (extensio.test(nom)) eixida.push(ruta);
  }
  return eixida;
}

/* El valor es compara sense `!important`: la prioritat no canvia què fa la
   declaració, i amb ella el detector callaria (o donaria un fals positiu). */
const valorNet = (valor) => valor.join(':').trim().toLowerCase().replace(/\s*!\s*important$/, '');

/** Regles fulla d'un full (també les de dins de @media i @layer). */
function regles(css) {
  const eixida = [];
  for (const m of senseComentaris(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const prelud = m[1].split(';').pop().trim();
    if (!prelud || prelud.startsWith('@')) continue;
    eixida.push({
      selectors: prelud.split(',').map((s) => s.trim().replace(/\s+/g, ' ')),
      declaracions: m[2].split(';').map((d) => d.split(':')).filter((p) => p.length >= 2)
        .map(([prop, ...valor]) => [prop.trim().toLowerCase(), valorNet(valor)]),
    });
  }
  return eixida;
}

/* La taula i les seues variants (--densa, --plana…), no altres blocs. */
const TAULA = /\.sdp-taula(?:--[\w-]+)?(?![\w-])/;
const LIMITS = new Set(['max-height', 'max-block-size']);
const ALTURES = new Set(['height', 'block-size']);
/* `overlay` és l'àlies antic d'`auto` a Chrome: també fa scroll propi. */
const DESPLACA = /^(?:auto|scroll|overlay)$/;

/** L'eix vertical d'una declaració d'overflow, o null si no el fixa. */
function overflowVertical(prop, valor) {
  if (prop === 'overflow-y' || prop === 'overflow-block') return valor;
  if (prop !== 'overflow') return null;
  const parts = valor.split(/\s+/);
  return parts[1] ?? parts[0];   // `overflow: x y`; un sol valor val per als dos eixos
}

/** L'últim compost d'un selector: el subjecte de la regla. */
const subjecte = (selector) => selector.split(/[\s>+~]+/).pop();
const nomenaClasse = (compost, classe) => new RegExp(`\\.${classe}(?![\\w-])`).test(compost);

/**
 * Declaracions que donarien a una taula un límit o un scroll vertical propi.
 * `caixes`: classes que arriben al div de .sdp-taula per `className`
 * (classesDeCaixa); una regla que les té de subjecte jutja la caixa mateixa.
 */
function infraccions(css, caixes = []) {
  const eixida = [];
  for (const r of regles(css)) {
    const deTaula = r.selectors.filter((s) => TAULA.test(s));
    const deCaixa = r.selectors.filter((s) => caixes.some((c) => nomenaClasse(subjecte(s), c)));
    if (!deTaula.length && !deCaixa.length) continue;
    // El subjecte és la caixa de la taula si l'últim compost la nomena.
    const caixa = deCaixa.length > 0 || deTaula.some((s) => TAULA.test(subjecte(s)));
    const selectors = [...new Set([...deTaula, ...deCaixa])];
    for (const [prop, valor] of r.declaracions) {
      const vertical = overflowVertical(prop, valor);
      if ((LIMITS.has(prop) && valor !== 'none')
        || (caixa && ALTURES.has(prop) && valor !== 'auto')
        || (vertical && DESPLACA.test(vertical))) {
        eixida.push(`${selectors.join(', ')} { ${prop}: ${valor} }`);
      }
    }
  }
  return eixida;
}

/* Correcció de T9 (260930) · Taula.jsx posa el seu `className` al mateix div
   que .sdp-taula, que és el contenidor de scroll: per ací va arribar el
   modificador de 70vh. Es recullen de les vistes (sense proves) que pinten
   <Taula> o <GraellaMes>, que la pinta: l'atribut literal i, si és una
   variable, les classes literals de la seua declaració (`const classe = […]`). */
const VISTA = /^(?!.*\.test\.[jt]sx?$).*\.[jt]sx?$/;
const CRIDA_TAULA = /<(?:Taula|GraellaMes)\b[^<]*?className=(?:"([^"]*)"|\{(\w+)\})/g;
const CLASSE_LITERAL = /['"`](sdp-[\w-]+)['"`]/g;

function classesDeCaixa(rutes) {
  const classes = new Set();
  for (const ruta of rutes) {
    const codi = llig(ruta);
    for (const [, literal, variable] of codi.matchAll(CRIDA_TAULA)) {
      if (literal) for (const c of literal.split(/\s+/).filter(Boolean)) classes.add(c);
      const declaracio = variable && new RegExp(`const ${variable}\\s*=([^;]*);`).exec(codi);
      if (declaracio) for (const [, c] of declaracio[1].matchAll(CLASSE_LITERAL)) classes.add(c);
    }
  }
  return [...classes].sort();
}

describe('T9 · taules sense scroll vertical intern', () => {
  test('el detector reconeix la caixa de 70vh i deixa passar el scroll horitzontal', () => {
    expect(infraccions('.sdp-taula--vella { max-height: 70vh; overflow: auto; }')).toHaveLength(2);
    expect(infraccions('@layer sdp { .sdp-taula { overflow-y: scroll; } }')).toHaveLength(1);
    expect(infraccions('.sdp-taula { height: 20rem; }')).toHaveLength(1);
    expect(infraccions('.sdp-taula { overflow-x: auto; overscroll-behavior-inline: contain; }')).toEqual([]);
    expect(infraccions('.sdp-taula :where(table) { display: table; overflow: visible; }')).toEqual([]);
    expect(infraccions('.sdp-taula-alt { max-height: 70vh; }')).toEqual([]);
  });

  test('el detector no s’esquiva amb !important ni amb overlay', () => {
    expect(infraccions('.sdp-taula { overflow-y: auto !important; }')).toHaveLength(1);
    expect(infraccions('.sdp-taula { overflow: auto !important; }')).toHaveLength(1);
    expect(infraccions('.sdp-taula { overflow: hidden auto!important; }')).toHaveLength(1);
    expect(infraccions('.sdp-taula { overflow-y: overlay; }')).toHaveLength(1);
    expect(infraccions('.sdp-taula { max-height: 70vh !important; }')).toHaveLength(1);
    expect(infraccions('.sdp-taula { max-height: none !important; overflow-x: auto !important; }')).toEqual([]);
  });

  test('una classe que arriba a la caixa per className també es jutja, però no els seus descendents', () => {
    const caixes = ['sdp-calendari__taula', 'sdp-calendari--gran'];
    expect(infraccions('.sdp-calendari__taula { max-height: 70vh; overflow: auto; }', caixes)).toHaveLength(2);
    expect(infraccions('.sdp-calendari--gran { block-size: 30rem; }', caixes)).toHaveLength(1);
    expect(infraccions('.sdp-calendari--gran table { overflow: auto; }', caixes)).toEqual([]);
    expect(infraccions('.sdp-calendari--gran .sdp-calendari__pindola { max-height: 2rem; }', caixes)).toEqual([]);
    // Sense la llista, eixa caixa passaria desapercebuda: per això es recull.
    expect(infraccions('.sdp-calendari__taula { max-height: 70vh; }')).toEqual([]);
  });

  const vistes = () => [...fitxers('src/sections', VISTA), ...fitxers('src/components', VISTA)];

  test('es recullen les classes que les vistes passen a la Taula', () => {
    const caixes = classesDeCaixa(vistes());
    // Literal (CalendariMapa) i per variable (CalendariMes i CalendariEsdeveniments).
    expect(caixes).toEqual(expect.arrayContaining(['sdp-calendari__taula', 'sdp-calendari--compacte', 'sdp-calendari--gran']));
  });

  test('cap full de src posa límit ni scroll vertical a .sdp-taula ni a les classes de la seua caixa', () => {
    const caixes = classesDeCaixa(vistes());
    const trobades = fitxers('src', /\.css$/).flatMap((ruta) => infraccions(llig(ruta), caixes).map((i) => `${ruta}: ${i}`));
    expect(trobades).toEqual([]);
  });

  test('la taula conserva el desplaçament horitzontal per a pantalles estretes', () => {
    const base = regles(llig('src/css/sdp.css')).filter((r) => r.selectors.includes('.sdp-taula'));
    expect(base.some((r) => r.declaracions.some(([p, v]) => p === 'overflow-x' && v === 'auto'))).toBe(true);
  });

  /* El nom es compon perquè cap porta de vocabulari confonga esta prova amb
     un ús de la classe. Les proves en queden fora: les que el nomenen és per
     a comprovar que no hi és. */
  const MODIFICADOR = ['sdp-taula', 'llarga'].join('--');

  test('el modificador de la caixa llarga no torna a cap full ni a cap vista', () => {
    const ambModificador = [...fitxers('src', /\.css$/), ...vistes()]
      .filter((ruta) => llig(ruta).includes(MODIFICADOR));
    expect(ambModificador).toEqual([]);
  });
});
