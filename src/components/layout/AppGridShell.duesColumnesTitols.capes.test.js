// @vitest-environment node
/* D-R32.3-PIXEL (v1.2.6, decisió del Mestre, 261117) · Al Perfil en dues
   columnes (duesColumnesEstret) cap títol d'apartat es parteix a mitja paraula
   a 320, 360 ni 375 px, i res no canvia per damunt de 400 px.

   Abans, a 320 px, «Multimèd|ia», «Empaque|tats», «Desplega|ment»,
   «Importaci|ó»… (Chrome headless sobre el DOM real del Perfil): la paraula més
   llarga d'un títol del sistema no cabia sencera en la línia i
   overflow-wrap: break-word la tallava sense guionet. La correcció no toca eixa
   protecció (noms d'aplicacions federades i adreces llargues de les dades
   d'usuari): ajusta la lletra del títol als talls de la casa del contenidor
   sdp-arrel (layout.css: 400 i 359).

   jsdom no resol @container ni pinta lletra. La prova fixa la regla al text de
   la CSS (sense comentaris) i fa l'aritmètica de la línia amb els tokens. Les
   amplàries de paraula són la mesura de Chrome del 261117 amb la cara estreta
   de public/fonts (el hash en fixa el fitxer: si la font canvia, cal tornar a
   mesurar). La geometria de veres (Range.getClientRects i scrollWidth a 320,
   359, 360, 375, 400, 401, 414, 430, 768 i 1440 px) és al registre del carril. */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Regles fulla en ordre de font: { prelud, cos, pares }. */
function regles(css) {
  const eixida = [];
  const pila = [];
  let tros = '';
  for (const c of senseComentaris(css)) {
    if (c === '{') {
      if (pila.length) pila[pila.length - 1].fills = true;
      pila.push({ prelud: tros.split(';').pop().trim().replace(/\s+/g, ' '), fills: false });
      tros = '';
    } else if (c === '}') {
      const marc = pila.pop();
      if (marc && !marc.fills) eixida.push({ prelud: marc.prelud, cos: tros.replace(/\s+/g, ' ').trim(), pares: pila.map((p) => p.prelud) });
      tros = '';
    } else {
      tros += c;
    }
  }
  return eixida;
}

const declaracions = (cos) => Object.fromEntries(cos.split(';').map((d) => d.trim()).filter(Boolean)
  .map((d) => [d.slice(0, d.indexOf(':')).trim(), d.slice(d.indexOf(':') + 1).trim()]));

const MODE = '.app-grid-shell[data-layout="estret"][data-dues-columnes="true"][data-panell="left"]';
const TITOL = `${MODE} .sdp-gestor-fitxa__titol`;
const ROTOL = `${MODE} .app-grid-col-header__titol`;
const CONTENIDOR = (px) => `@container sdp-arrel (max-width: ${px}px)`;
const RESERVA = '@supports not (container-type: inline-size)';
const MEDIA = (px) => `@media (max-width: ${px}px)`;

const modules = regles(llig('src/css/modules.css'));
const graella = regles(llig('src/components/layout/AppGridShell.css'));

/* La regla única amb eixe selector i eixes condicions (la capa components de
   modules.css no compta: AppGridShell.css hi entra sencer per l'@import). */
const unaRegla = (llista, prelud, pares) => {
  const trobades = llista.filter((r) => r.prelud === prelud
    && JSON.stringify(r.pares.filter((p) => p !== '@layer components')) === JSON.stringify(pares));
  expect(trobades, `${pares.join(' > ')} > ${prelud}`).toHaveLength(1);
  return { ...trobades[0], decl: declaracions(trobades[0].cos), index: llista.indexOf(trobades[0]) };
};

describe('títol d’apartat del Perfil en dues columnes (modules.css)', () => {
  test('fins a 400 px de contenidor, la mida xicoteta en SemiCondensed; fins a 359, la meta en Condensed', () => {
    for (const pares of [[CONTENIDOR(400)], [RESERVA, MEDIA(400)]]) {
      expect(unaRegla(modules, TITOL, pares).decl).toEqual({
        'font-size': 'var(--sdp-text-small)',
        'font-stretch': 'var(--sdp-font-amplada-semi)',
      });
    }
    for (const pares of [[CONTENIDOR(359)], [RESERVA, MEDIA(359)]]) {
      expect(unaRegla(modules, TITOL, pares).decl).toEqual({
        'font-size': 'var(--sdp-text-meta)',
        'font-stretch': 'var(--sdp-font-amplada-estreta)',
      });
    }
  });

  test('l’esglaó de 359 va darrere del de 400 (mateixa especificitat: guanya per ordre), també a la reserva @media', () => {
    expect(unaRegla(modules, TITOL, [CONTENIDOR(359)]).index).toBeGreaterThan(unaRegla(modules, TITOL, [CONTENIDOR(400)]).index);
    expect(unaRegla(modules, TITOL, [RESERVA, MEDIA(359)]).index).toBeGreaterThan(unaRegla(modules, TITOL, [RESERVA, MEDIA(400)]).index);
  });

  test('els talls són els de la casa (layout.css ja els té al contenidor sdp-arrel)', () => {
    const layout = senseComentaris(llig('src/css/layout.css'));
    expect(layout).toContain(CONTENIDOR(400));
    expect(layout).toContain(CONTENIDOR(359));
  });

  test('Llei del Píxel · cap regla nova del títol fora del mode dues columnes: la base i la de les Notes queden com eren', () => {
    const delTitol = modules.filter((r) => r.prelud.split(',').some((s) => s.trim().endsWith('.sdp-gestor-fitxa__titol')));
    const fora = delTitol.filter((r) => !r.prelud.includes('[data-dues-columnes="true"]'));
    expect(fora.map((r) => r.prelud)).toEqual(['.sdp-gestor-fitxa__titol', '.sdp-bloc-list--notes .sdp-gestor-fitxa__titol']);
    expect(fora.every((r) => !('font-stretch' in declaracions(r.cos)))).toBe(true);
    const base = declaracions(fora[0].cos);
    expect([base['font-size'], base['-webkit-line-clamp'], base['overflow-wrap']]).toEqual(['var(--sdp-text-base)', '2', 'break-word']);
  });

  test('la protecció de les dades d’usuari es queda: cap anywhere, break-all ni guionet automàtic al mode dues columnes', () => {
    const delMode = [...modules, ...graella].filter((r) => r.prelud.includes('[data-dues-columnes="true"]'));
    for (const r of delMode) {
      const d = declaracions(r.cos);
      expect(d['overflow-wrap'] ?? 'break-word', r.prelud).toBe('break-word');
      expect(d['word-break'], r.prelud).toBeUndefined();
      expect(d.hyphens ?? 'none', r.prelud).not.toBe('auto');
    }
  });
});

describe('rètol de columna en dues columnes (AppGridShell.css)', () => {
  test('fins a 359 px, el rètol («APARTATS») passa a Condensed i no se’n retalla cap lletra', () => {
    for (const pares of [[CONTENIDOR(359)], [RESERVA, MEDIA(359)]]) {
      expect(unaRegla(graella, ROTOL, pares).decl).toEqual({ 'font-stretch': 'var(--sdp-font-amplada-estreta)' });
    }
  });

  test('la separació icona-text de l’harmonització (261018) no es toca al mode dues columnes', () => {
    const plec = [...modules, ...graella].filter((r) => r.prelud.includes('[data-dues-columnes="true"]') && r.prelud.includes('app-grid-col-header__plec'));
    expect(plec).toEqual([]);
  });
});

describe('aritmètica de la línia amb els tokens (mesura de Chrome, 261117)', () => {
  const tokens = senseComentaris(llig('src/css/tokens.css'));
  const px = (nom) => {
    const m = tokens.match(new RegExp(`--${nom}:\\s*(\\d+(?:\\.\\d+)?)px`));
    expect(m, nom).not.toBeNull();
    return Number(m[1]);
  };
  /* Columna d'APARTATS: 11 de 20 parts (AppGridShell.css, 9fr i 11fr). Línia del
     títol: la columna menys el marcador de 3 px de la fitxa, la miniatura
     (--sdp-alt-accio) i el coixí lateral (--sdp-space-3) a banda i banda. */
  const linia = (finestra) => (finestra * 11) / 20 - 3 - px('sdp-alt-accio') - 2 * px('sdp-space-3');
  /* Negreta de Noto Sans (cara variable wdth+wght de public/fonts), en px. La
     paraula més llarga dels títols del sistema del Perfil és «Desplegament». */
  const DESPLEGAMENT = { 'small-semi': 107, 'meta-estreta': 86, 'base-normal': 131 };

  test('la cara estreta mesurada és la que servix el lloc', () => {
    const fitxer = readFileSync(resolve(process.cwd(), 'public/fonts/noto-sans-wdth-wght-latin.woff2'));
    expect(createHash('sha256').update(fitxer).digest('hex')).toBe('28a840bc6b70be55fe3ac10e4d2e91455dc4a84c97442a9f4b6a5c97a54d5d74');
  });

  test('la graella de dues columnes i la fitxa són les de la mesura', () => {
    expect(unaRegla(graella, `${MODE} .app-grid-content`, []).decl['grid-template-columns']).toBe('minmax(0, 9fr) minmax(0, 11fr)');
    expect(unaRegla(modules, `${MODE} .sdp-gestor-fitxa__text`, []).decl.padding).toBe('var(--sdp-space-2) var(--sdp-space-3)');
    expect(unaRegla(modules, `${MODE} .sdp-gestor-fitxa__media`, []).decl.width).toBe('var(--sdp-alt-accio)');
  });

  test('cada esglaó deixa almenys 4 px de marge a la paraula més llarga; per damunt de 400, la lletra de sempre ja hi cabia', () => {
    for (const finestra of [320, 359]) expect(linia(finestra) - DESPLEGAMENT['meta-estreta']).toBeGreaterThanOrEqual(4);
    for (const finestra of [360, 375, 400]) expect(linia(finestra) - DESPLEGAMENT['small-semi']).toBeGreaterThanOrEqual(4);
    expect(linia(401) - DESPLEGAMENT['base-normal']).toBeGreaterThanOrEqual(4);
    /* I sense l'esglaó de 359, la xicoteta SemiCondensed no hi cabria a 320. */
    expect(linia(320)).toBeLessThan(DESPLEGAMENT['small-semi']);
  });
});
