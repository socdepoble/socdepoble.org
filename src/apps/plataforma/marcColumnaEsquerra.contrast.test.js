// @vitest-environment node
/**
 * Onada R30 · CONTRAST-MARC-01 · El text nu de MarcColumna en la columna esquerra de les
 * micro-apps (ClosaAplicacio: Salut, Arbre Genealògic; el «Carregant…» del Bar).
 *
 * La columna esquerra pinta el Grafit 700 de la navegació (`--app-grid-bg-esquerra`,
 * AppGridShell.css) i el cos de MarcColumna no té superfície pròpia. En tema clar, el paràgraf
 * nu (`--sdp-text-cos`) hi queia a 1,00:1, l'etiqueta de camp a 1,73:1 i l'estat del fitxer i el
 * «Carregant…» a 1,23:1 (mesurat en Chrome amb el CSS real). La correcció només recoloreja eixe
 * text amb el text del crom: cap fons nou, cap peça amb superfície pròpia (alertes, diàlegs) i
 * cap canvi en tema fosc, que ja passava de 7:1 (Llei del Píxel).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const senseComentaris = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '');

const TOKENS = llig('src/css/tokens.css');
const CANON = llig('src/css/design-tokens.css');
const GRAELLA = senseComentaris(llig('src/css/app-grid-shell.css'));
/* Onada R32.11 · Gemini lot_01 (dieta del CSS) · El bloc catalegColleccio, MarcColumna inclosa, va
   eixir de modules.css cap al full diferit diferit-cataleg-colleccio.css, que MarcColumna.jsx adopta a
   la seua arrel (el document o el shadow root de <soc-de-poble>). Les regles es busquen allí. */
const FULL_DIFERIT = 'src/css/diferit-cataleg-colleccio.css';
const MODULES = senseComentaris(llig(FULL_DIFERIT));
const MARC = llig('src/components/PedraSeca/organismes/MarcColumna.jsx');
const COS = '.app-grid-column--left > .sdp-marc-columna > .sdp-marc-columna__cos';

const declaracions = (text) => Object.fromEntries(
  [...senseComentaris(text).matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()])
);

function bloc(text, selector) {
  const inici = text.indexOf(`\n${selector} {`);
  expect(inici, `falta el bloc ${selector}`).toBeGreaterThan(-1);
  const obre = text.indexOf('{', inici);
  let prof = 0;
  for (let i = obre; i < text.length; i++) {
    if (text[i] === '{') prof++;
    if (text[i] === '}' && --prof === 0) return text.slice(obre + 1, i);
  }
  throw new Error(`bloc sense tancar: ${selector}`);
}

const CLAR = {
  ...declaracions(CANON),
  ...declaracions(bloc(TOKENS, ':root, :host, .sdp-root')),
  ...declaracions(bloc(GRAELLA, '.app-grid-page'))
};
const BANCAL = {
  ...CLAR,
  ...declaracions(bloc(TOKENS, ':root[data-contrast="bancal"], :host([data-contrast="bancal"]),\n:root[data-contrast="bancal"] .sdp-root, :host([data-contrast="bancal"]) .sdp-root'))
};

function hex(valor, mapa, vistos = new Set()) {
  return valor.replace(/var\((--[\w-]+)\)/g, (_, nom) => {
    expect(vistos.has(nom), `cicle a ${nom}`).toBe(false);
    expect(mapa[nom], `falta ${nom}`).toBeDefined();
    return hex(mapa[nom], mapa, new Set([...vistos, nom]));
  }).trim();
}

function lum(h) {
  expect(h, 'color opac de sis xifres').toMatch(/^#[0-9a-f]{6}$/i);
  const [r, g, b] = h.slice(1).match(/../g).map((x) => parseInt(x, 16) / 255)
    .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const ratio = (a, b) => {
  const [la, lb] = [lum(a), lum(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

/* Les regles més internes del full (selector + cos), amb la capa que les embolcalla. */
function regles(css) {
  const eixida = [];
  const pila = [];
  let tros = 0;
  for (let i = 0; i < css.length; i += 1) {
    if (css[i] === '{') {
      pila.push({ selector: css.slice(tros, i).trim(), inici: i + 1 });
      tros = i + 1;
    } else if (css[i] === '}') {
      const bloc = pila.pop();
      const cos = css.slice(bloc.inici, i);
      if (!cos.includes('{')) eixida.push({ selector: bloc.selector, cos, capes: pila.map((b) => b.selector) });
      tros = i + 1;
    } else if (css[i] === ';' && !pila.length) tros = i + 1;
  }
  return eixida;
}

const propietats = (cos) => Object.fromEntries([...cos.matchAll(/([\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
const DEL_COS = regles(MODULES).filter((r) => r.selector.includes(COS));

describe('R30 · CONTRAST-MARC-01 · text nu del cos de MarcColumna en la columna esquerra', () => {
  test('la premissa: el Grafit de la columna esquerra i el text de cos de Pedra Seca no es distingixen en tema clar', () => {
    expect(bloc(GRAELLA, '.app-grid-page .app-grid-column--left')).toMatch(/background:\s*var\(--app-grid-bg-esquerra\)/);
    const fons = hex('var(--app-grid-bg-esquerra)', CLAR);
    expect(ratio(hex('var(--sdp-text-cos)', CLAR), fons), 'si ja es distingixen, la regla potser sobra').toBeLessThan(1.5);
  });

  test('dues regles, només de color, dins de @layer components, només en tema clar i fora de les superfícies pròpies', () => {
    expect(DEL_COS.map((r) => propietats(r.cos))).toEqual([
      { color: 'var(--sdp-crom-text)' },
      { color: 'var(--sdp-crom-text-secundari)' }
    ]);
    for (const regla of DEL_COS) {
      expect(regla.capes).toEqual(['@layer components']);
      const parts = regla.selector.split(/,\s*\n\s*/);
      expect(parts).toHaveLength(2);
      expect(parts[0].startsWith(`:root:not([data-theme="dark"]) ${COS} `)).toBe(true);
      expect(parts[1].startsWith(`:host(:not([data-theme="dark"])) ${COS} `)).toBe(true);
      for (const part of parts) expect(part.endsWith(':not(:is(.sdp-alerta, dialog) *)')).toBe(true);
    }
    expect(DEL_COS[0].selector).toContain(':is(p:not([class]), .sdp-camp__etiqueta)');
    expect(DEL_COS[1].selector).toContain(':is(.sdp-camp-fitxer__estat, .sdp-carregant)');
  });

  test('les regles arriben on es pinta MarcColumna: el marc adopta el full diferit a la seua arrel', () => {
    expect(MARC).toMatch(/import\s+(\w+)\s+from\s+'\.\.\/\.\.\/\.\.\/css\/diferit-cataleg-colleccio\.css\?inline'/);
    const [, nomCss] = MARC.match(/import\s+(\w+)\s+from\s+'\.\.\/\.\.\/\.\.\/css\/diferit-cataleg-colleccio\.css\?inline'/);
    expect(MARC).toMatch(new RegExp(`adoptaFullDiferit\\(el, 'cataleg-colleccio', ${nomCss}\\)`));
    expect(MARC).toMatch(/<div ref=\{adoptaEstilsDiferits\} className=\{\['sdp-marc-columna', className\]/);
  });

  test('el text recolorejat fa ≥ 7:1 sobre el Grafit en clar i en Bancal', () => {
    expect(DEL_COS).toHaveLength(2);
    for (const [mode, mapa] of Object.entries({ clar: CLAR, bancal: BANCAL })) {
      const fons = hex('var(--app-grid-bg-esquerra)', mapa);
      for (const regla of DEL_COS) {
        const { color } = propietats(regla.cos);
        expect(ratio(hex(color, mapa), fons), `${color} sobre el Grafit · ${mode}`).toBeGreaterThanOrEqual(7);
      }
    }
  });
});
