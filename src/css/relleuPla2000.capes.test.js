/**
 * Ordre del Mestre (18-10-2026, relleu del Pla 2000) · Correccions de la
 * revisió que només són CSS. jsdom no calcula la cascada: es comprova la regla
 * escrita (capa, @media, ordre i especificitat), com pindolaAvatarDesactivada.
 *   · Punt 3 · El visor de «Multimèdia» del Perfil viu dins de .perfil-pagina,
 *     i el `.sdp-boto` de PerfilShell.css (layer(components), després de
 *     components.css) pintava de blau el secundari i el perill: es restituïxen
 *     dins del visor amb els valors de les varietats (a /multimedia, res no
 *     canvia), a modules.css (el bloc del visor no nomena cap .sdp-boto), i el
 *     [aria-expanded="true"] del crom hi conserva la seua vora.
 *   · Punt 1 · La píndola triada del Mercat, amb els colors del sistema en
 *     colors forçats; «Esgotat» de la fitxa de la variant, a 16px.
 *   · Punt 2 · Mentre puja la foto nova, el cercle de l'avatar ho diu: el
 *     cursor d'espera i el carregador que gira.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Regles fulla d'un full: { prelud, cos, pares, ordre } (pares: els blocs que la contenen). */
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
      if (marc && !marc.fills) {
        eixida.push({ prelud: marc.prelud, cos: tros.replace(/\s+/g, ' ').trim(), pares: pila.map((p) => p.prelud), ordre: eixida.length });
      }
      tros = '';
    } else {
      tros += c;
    }
  }
  return eixida;
}

const declaracions = (cos) => Object.fromEntries(cos.split(';')
  .map((d) => d.trim())
  .filter((d) => d.includes(':'))
  .map((d) => [d.slice(0, d.indexOf(':')).trim(), d.slice(d.indexOf(':') + 1).trim()]));

/** Especificitat (classes, atributs i pseudoclasses) d'un selector sense id ni element; :where() no compta. */
function especificitat(selector) {
  const net = selector.replace(/:where\([^()]*\)/g, '').replace(/::[\w-]+/g, '').replace(/\[[^\]]*\]/g, '.atribut');
  return (net.match(/\.[\w-]+/g) || []).length + (net.match(/:[\w-]+/g) || []).length;
}

const llig = (ruta) => regles(readFileSync(resolve(process.cwd(), ruta), 'utf8'));
const COMPONENTS = llig('src/css/components.css');
const MODULS = llig('src/css/modules.css');
const PERFIL = llig('src/sections/profile/PerfilShell.css');
const unica = (full, prelud) => {
  const trobades = full.filter((r) => r.prelud === prelud);
  expect(trobades, prelud).toHaveLength(1);
  return trobades[0];
};
const RATOLI = '@media (hover: hover) and (pointer: fine)';

describe('punt 3 · el visor del Perfil: el secundari i el perill, com a tota l’app', () => {
  test('els mateixos valors que les varietats de Pedra Seca, a @layer components de modules.css', () => {
    const base = declaracions(unica(COMPONENTS, '.sdp-boto--secundari').cos);
    const secundari = unica(MODULS, '.sdp-visor .sdp-boto--secundari');
    expect(secundari.pares).toEqual(['@layer components']);
    expect(declaracions(secundari.cos)).toEqual({
      background: base.background, color: base.color, border: `2px solid ${base['border-color']}`,
    });
    const perillBase = declaracions(unica(COMPONENTS, '.sdp-boto--perill').cos);
    const perill = unica(MODULS, '.sdp-visor .sdp-boto--perill');
    expect(perill.pares).toEqual(['@layer components']);
    expect(declaracions(perill.cos)).toEqual({ background: perillBase.background, color: perillBase.color, border: '2px solid transparent' });
    // El bloc del visor de components.css no nomena cap .sdp-boto (el carrusel en depén).
    expect(COMPONENTS.filter((r) => /\.sdp-visor/.test(r.prelud) && /\.sdp-boto/.test(r.prelud))).toEqual([]);
  });

  test('guanyen al `.sdp-boto` de Perfil (repòs i hover), i el hover és només amb ratolí', () => {
    const perfil = unica(PERFIL, ':where(.perfil-pagina) .sdp-boto');
    const perfilHover = unica(PERFIL, ':where(.perfil-pagina) .sdp-boto:hover:not(:disabled)');
    expect(especificitat('.sdp-visor .sdp-boto--secundari')).toBeGreaterThan(especificitat(perfil.prelud));
    for (const varietat of ['secundari', 'perill']) {
      const hover = unica(MODULS, `.sdp-visor .sdp-boto--${varietat}:hover:not(:disabled)`);
      expect(hover.pares).toEqual(['@layer components', RATOLI]);
      expect(especificitat(hover.prelud)).toBeGreaterThan(especificitat(perfilHover.prelud));
    }
  });

  /* Comprovació al navegador (18-10-2026) · El farcit de `.sdp-boto` del Perfil
     deixava a 0 px d'ample la icona dels botons del crom del visor: el visor
     hi torna el seu (el de components.css), amb un pes més que el del Perfil. */
  test('els botons d’icona del visor recuperen el seu farcit dins del Perfil', () => {
    const delVisor = declaracions(unica(COMPONENTS, '.sdp-visor__boto').cos);
    const torna = unica(MODULS, '.sdp-visor .sdp-visor__boto');
    expect(torna.pares).toEqual(['@layer components']);
    expect(declaracions(torna.cos)).toEqual({ padding: delVisor.padding });
    expect(delVisor.padding).toBe('0');
    const perfil = unica(PERFIL, ':where(.perfil-pagina) .sdp-boto');
    expect(declaracions(perfil.cos).padding).toBeTruthy();
    expect(especificitat(torna.prelud)).toBeGreaterThan(especificitat(perfil.prelud));
  });

  test('el botó d’Informació desplegat conserva la vora de l’acció: un pes més que la restitució', () => {
    const desplegat = declaracions(unica(COMPONENTS, '.sdp-visor__boto[aria-expanded="true"]').cos);
    const torna = unica(MODULS, '.sdp-visor .sdp-boto--secundari[aria-expanded="true"]');
    expect(declaracions(torna.cos)).toEqual(desplegat);
    expect(especificitat(torna.prelud)).toBeGreaterThan(especificitat('.sdp-visor .sdp-boto--secundari'));
  });
});

describe('punt 1 · el selector de variants del Mercat', () => {
  test('en colors forçats, la triada porta els colors de selecció del sistema (sense apagar els forçats)', () => {
    const triada = '.sdp-variant__control:checked + .sdp-variant__pindola';
    const forcada = MODULS.filter((r) => r.prelud === triada && r.pares.includes('@media (forced-colors: active)'));
    expect(forcada).toHaveLength(1);
    expect(forcada[0].pares).toEqual(['@layer components', '@media (forced-colors: active)']);
    expect(declaracions(forcada[0].cos)).toEqual({ 'border-color': 'Highlight', background: 'Highlight', color: 'HighlightText' });
    expect(forcada[0].cos).not.toContain('forced-color-adjust');
    const normal = MODULS.find((r) => r.prelud === triada && r.pares.length === 1);
    expect(normal.ordre).toBeLessThan(forcada[0].ordre);
  });

  test('«Esgotat» de la fitxa de la variant, a 16px, com el de la píndola', () => {
    const fitxa = unica(MODULS, '.sdp-compra__text .sdp-insignia');
    expect(fitxa.pares).toEqual(['@layer components']);
    expect(declaracions(fitxa.cos)).toEqual({ 'font-size': 'var(--sdp-text-small)' });
    expect(declaracions(unica(MODULS, '.sdp-variant__pindola .sdp-variant__estat').cos)['font-size']).toBe('var(--sdp-text-small)');
  });
});

describe('punt 2 · el cercle de l’avatar mentre puja la foto nova', () => {
  test('el cursor d’espera i el carregador que gira (spin, el d’este full), a @layer components; la foto, sense opacitat', () => {
    expect(declaracions(unica(MODULS, '.page-title-avatar--canvia[aria-busy="true"]').cos)).toEqual({ cursor: 'progress' });
    const gir = unica(MODULS, '.page-title-avatar__gir');
    expect(gir.pares).toEqual(['@layer components']);
    expect(declaracions(gir.cos).animation).toMatch(/^spin /);
    expect(MODULS.some((r) => r.pares.at(-1) === '@keyframes spin')).toBe(true);
    expect(MODULS.filter((r) => r.prelud.includes('aria-busy') && /opacity/.test(r.cos))).toEqual([]);
  });
});
