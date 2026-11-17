// @vitest-environment node
/* v1.2.7 · R325-03 · La banda beta (BandaBetaMicroApp, full diferit src/css/diferit-banda-beta.css) feia
   101 px a 320 px i 80 px a 375 px, fixos en cada vista de Gestoria, Bar, Nevera, Salut, Genealogia i
   Lector: les llistes de les apps d'inset absolut perdien eixos píxels. En estret es compacta (coixí i
   interlineat), sense amagar ni retallar cap paraula a 320 px (WCAG 1.4.10), i a ≥ 768 px no canvia res.
   Vitest no fa disseny: la prova és sobre la font. Les mesures de Chrome headless són a l'informe. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const css = readFileSync(path.join(process.cwd(), 'src/css/diferit-banda-beta.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const ESTRET = '@media (max-width: 767.98px)';

/* El cos d'un bloc { … } que comença a `inici` (la clau oberta), amb niuament. */
function bloc(text, inici) {
  let nivell = 0;
  for (let i = inici; i < text.length; i += 1) {
    if (text[i] === '{') nivell += 1;
    else if (text[i] === '}' && --nivell === 0) return text.slice(inici + 1, i);
  }
  throw new Error('bloc sense tancar');
}
const regles = (text) => Object.fromEntries([...text.matchAll(/([^{}@]+)\{([^{}]*)\}/g)]
  .map(([, selector, cos]) => [selector.trim(), Object.fromEntries(cos.split(';').map((d) => d.trim()).filter(Boolean)
    .map((d) => d.split(/:(.*)/s).slice(0, 2).map((part) => part.trim())))]));

const capa = bloc(css, css.indexOf('{', css.indexOf('@layer components')));
const posEstret = capa.indexOf(ESTRET);
const estret = posEstret >= 0 ? bloc(capa, capa.indexOf('{', posEstret)) : '';
const base = regles(posEstret >= 0 ? capa.slice(0, posEstret) + capa.slice(capa.indexOf('{', posEstret) + estret.length + 2) : capa);

describe('R325-03 · la banda beta es compacta en estret, sense retallar res', () => {
  test('a ≥ 768 px la banda és la d’abans (coixí de 8 i 16 px, interlineat 1,5, lletra meta)', () => {
    expect(base['.sdp-banda-beta'].padding).toBe('var(--sdp-space-2) var(--sdp-space-4)');
    expect(base['.sdp-banda-beta__text']['line-height']).toBe('1.5');
    expect(base['.sdp-banda-beta__text']['font-size']).toBe('var(--sdp-text-meta)');
  });

  test('hi ha un sol bloc estret, dins de @layer components, que compacta el coixí i l’interlineat', () => {
    expect(capa.split(ESTRET)).toHaveLength(2);
    expect(css.split('@media')).toHaveLength(2);
    const compacte = regles(estret);
    expect(Object.keys(compacte).sort()).toEqual(['.sdp-banda-beta', '.sdp-banda-beta__text']);
    expect(compacte['.sdp-banda-beta']).toEqual({ padding: 'var(--sdp-space-1) var(--sdp-space-2)' });
    expect(compacte['.sdp-banda-beta__text']).toEqual({ 'line-height': '1.3' });
  });

  test('cap text amagat ni retallat a 320 px: ni alçada màxima, ni overflow, ni línies tallades, ni lletra per davall del sòl', () => {
    const vetat = /max-(?:block-size|height)|overflow\s*:|line-clamp|text-overflow|white-space\s*:\s*nowrap|display\s*:\s*none|font-size/;
    expect(estret).not.toMatch(vetat);
    expect(base['.sdp-banda-beta__text']['white-space']).toBe('normal');
  });
});
