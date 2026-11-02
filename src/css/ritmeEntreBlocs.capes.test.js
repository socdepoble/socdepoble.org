import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

/* PS-06 i PS-10 (B7f, marató 261101_2143; ordre del Mestre i default D-3).
   PS-06 · Un sol espaiat entre targetes i blocs. Entre files de targetes
   d'una .sdp-card-grid hi havia 56px (el gap de 24 més el marge de baix de 32
   de la .sp-card) i a /connectar, 44 entre l'Alerta filla i el bloc següent
   (el gap de 32 més els 12 de l'Alerta). Ara 24 i 32: el gap i prou. Sota
   l'última fila, el píxel de sempre: els 32 del marge passen a coixí de baix
   de la graella (correcció ARB-B7f-01 de l'àrbitre, 261102).
   PS-10 · El Mur en mòbil: amb la pàgina a 480px o menys, les píndoles del
   Mur en una fila que llisca i sense l'entradeta.
   jsdom no aplica capes, @container ni @media. La prova fa la cascada ella
   mateixa, com barraBlavaEstreta: jsdom diu quins selectors casen amb el
   DOM i la prova aplica capes, consultes, importància, especificitat i
   ordre de font sobre els fulls de veres (components, modules, taulers,
   tipografia estreta i utilitats, l'ordre d'index.css). Que el DOM de la
   prova és el del Mur de veres ho prova MurSection.pedra.test.jsx. La mesura
   amb Chrome headless aïllat (abans 698 i 56; després 542 i 24) és al
   registre del carril M22-B7f-MUR. */

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

/** Parteix per `sep` fora de parèntesis (un espai: qualsevol blanc). */
function parteix(text, sep) {
  const parts = [];
  let fons = 0;
  let tros = '';
  for (const c of text) {
    if (c === '(') fons += 1;
    else if (c === ')') fons -= 1;
    if (fons === 0 && (sep === ' ' ? /\s/.test(c) : c === sep)) {
      if (tros.trim()) parts.push(tros.trim());
      tros = '';
    } else {
      tros += c;
    }
  }
  if (tros.trim()) parts.push(tros.trim());
  return parts;
}

/** Les propietats llargues que mira esta prova (la resta, tal qual). */
function llargues(cos) {
  const d = {};
  for (const declaracio of parteix(cos, ';')) {
    const k = declaracio.indexOf(':');
    if (k < 0) continue;
    const prop = declaracio.slice(0, k).trim().toLowerCase();
    if (prop.startsWith('--')) continue;
    const brut = declaracio.slice(k + 1).trim();
    const imp = /!important$/.test(brut);
    const valor = brut.replace(/\s*!important$/, '');
    const v = parteix(valor, ' ');
    const posa = (p, x) => { d[p] = { valor: x, imp }; };
    if (prop === 'margin') { posa('margin-top', v[0]); posa('margin-bottom', v[2] ?? v[0]); }
    else if (prop === 'margin-block') { posa('margin-top', v[0]); posa('margin-bottom', v[1] ?? v[0]); }
    else if (prop === 'margin-block-start') posa('margin-top', valor);
    else if (prop === 'margin-block-end') posa('margin-bottom', valor);
    else if (prop === 'padding') posa('padding-bottom', v[2] ?? v[0]);
    else if (prop === 'padding-block') posa('padding-bottom', v[1] ?? v[0]);
    else if (prop === 'padding-block-end') posa('padding-bottom', valor);
    else if (prop === 'overscroll-behavior' || prop === 'overscroll-behavior-x') posa('overscroll-behavior-inline', v[0]);
    else if (prop === 'overflow') posa('overflow-x', v[0]);
    else if (prop === 'overflow-inline') posa('overflow-x', valor);
    else if (prop === 'flex-flow') { for (const x of v) if (/^(no)?wrap(-reverse)?$/.test(x)) posa('flex-wrap', x); }
    else if (prop === 'place-content') posa('justify-content', v[1] ?? v[0]);
    else if (prop === 'gap') { posa('row-gap', v[0]); posa('column-gap', v[1] ?? v[0]); }
    else if (prop === 'flex') posa('flex-shrink', v[0] === 'none' ? '0' : (v.length > 1 && /^\d*\.?\d+$/.test(v[1]) ? v[1] : '1'));
    else posa(prop, valor);
  }
  return d;
}

/** Especificitat [a, b, c] (Selectors 4: :where 0; :not/:is/:has, la del més específic). */
function especificitat(selector) {
  let a = 0; let b = 0; let c = 0; let resta = '';
  for (let i = 0; i < selector.length; i += 1) {
    const m = /^::?([-\w]+)\(/.exec(selector.slice(i));
    if (m) {
      let fons = 0; let j = i + m[0].length - 1;
      for (; j < selector.length; j += 1) {
        if (selector[j] === '(') fons += 1;
        else if (selector[j] === ')' && (fons -= 1) === 0) break;
      }
      const dins = selector.slice(i + m[0].length, j);
      if (['not', 'is', 'has', 'matches'].includes(m[1])) {
        const max = parteix(dins, ',').map(especificitat).reduce((x, y) => (compara(x, y) >= 0 ? x : y), [0, 0, 0]);
        a += max[0]; b += max[1]; c += max[2];
      } else if (m[1] !== 'where') {
        if (m[0].startsWith('::')) c += 1; else b += 1;
      }
      resta += ' ';
      i = j;
      continue;
    }
    resta += selector[i];
  }
  resta = resta.replace(/\[[^\]]*\]/g, () => { b += 1; return ' '; })
    .replace(/::[-\w]+/g, () => { c += 1; return ' '; })
    .replace(/:[-\w]+/g, () => { b += 1; return ' '; })
    .replace(/#[-\w]+/g, () => { a += 1; return ' '; })
    .replace(/\.[-\w]+/g, () => { b += 1; return ' '; });
  for (const t of resta.split(/[\s>+~]+/)) if (/^[a-zA-Z][-\w]*$/.test(t)) c += 1;
  return [a, b, c];
}
function compara(x, y) {
  for (let i = 0; i < Math.max(x.length, y.length); i += 1) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) - (y[i] ?? 0);
  return 0;
}
const casa = (el, selector) => { try { return el.matches(selector); } catch { return false; } };

/* L'ordre de les capes (index.css: reset, sdp, legacy, components,
   utilities); sense capa, per damunt de totes. */
const CAPES = ['reset', 'sdp', 'legacy', 'components', 'utilities'];
const capaDe = (pares) => {
  const l = pares.find((p) => p.startsWith('@layer '));
  return l ? CAPES.indexOf(l.slice(7).trim()) : CAPES.length;
};

/* Els fulls que escriuen en components o més amunt, en l'ordre d'index.css.
   base, sdp, wiki i layout (capes de davall) no poden guanyar a cap regla
   de components: no hi entren. */
const FULLS = ['src/css/components.css', 'src/css/modules.css', 'src/css/taulers.css', 'src/css/tipografia-estreta.css', 'src/css/utilities.css'];
const REGLES = FULLS.flatMap((ruta) => regles(llig(ruta)).map((r) => ({ ...r, ruta })))
  .filter((r) => !r.prelud.startsWith('@'))
  .map((r, ordre) => ({ ...r, ordre, capa: capaDe(r.pares), selectors: parteix(r.prelud, ','), decl: llargues(r.cos) }));

function avaluaMedia(consulta, finestra) {
  return consulta.split(/\s+and\s+/).every((f) => {
    const t = f.trim();
    if (t === 'screen' || t === 'all' || t === 'only screen') return true;
    const m = /^\((max|min)-width: ([\d.]+)(px|rem|em)\)$/.exec(t);
    /* Hover fi, moviment reduït, esquema fosc, impressió…: fora del model. */
    if (!m) return false;
    const px = Number(m[2]) * (m[3] === 'px' ? 1 : 16);
    return m[1] === 'max' ? finestra <= px : finestra >= px;
  });
}
/* ctx: { contenidors (el navegador els coneix), finestra, contenidor (l'ample
   del contenidor més pròxim de l'element, la .sdp-universal-page-container) }. */
function complix(pare, ctx) {
  if (pare.startsWith('@layer ')) return true;
  const cont = /^@container(?: ([-\w]+))? \((max|min)-width: ([\d.]+)px\)$/.exec(pare);
  if (cont) {
    if (!ctx.contenidors) return false;
    const ample = !cont[1] ? ctx.contenidor : (cont[1] === 'sdp-arrel' ? ctx.finestra : null);
    /* Un contenidor amb nom que no és cap avantpassat dels elements de la prova. */
    if (ample === null) return false;
    return cont[2] === 'max' ? ample <= Number(cont[3]) : ample >= Number(cont[3]);
  }
  if (pare.startsWith('@container')) return false;
  if (pare.startsWith('@media ')) return pare.slice(7).split(',').some((q) => avaluaMedia(q.trim(), ctx.finestra));
  if (pare === '@supports not (container-type: inline-size)') return !ctx.contenidors;
  if (pare === '@supports (container-type: inline-size)') return ctx.contenidors;
  if (pare.startsWith('@supports not')) return false;
  if (pare.startsWith('@supports')) return true;
  return false;
}

/** La declaració que guanya per a `prop` en `el` (null si cap regla la posa). */
function calcula(el, prop, ctx, regles_ = REGLES) {
  let guanya = null;
  for (const r of regles_) {
    const d = r.decl[prop];
    if (!d) continue;
    if (!r.pares.every((p) => complix(p, ctx))) continue;
    let esp = null;
    for (const s of r.selectors) {
      if (!casa(el, s)) continue;
      const e = especificitat(s);
      if (!esp || compara(e, esp) > 0) esp = e;
    }
    if (!esp) continue;
    /* !important: guanya a la normal i, entre importants, la capa de davall. */
    const clau = [d.imp ? 1 : 0, d.imp ? -r.capa : r.capa, ...esp, r.ordre];
    if (!guanya || compara(clau, guanya.clau) >= 0) guanya = { valor: d.valor, clau, regla: `${r.ruta}: ${r.prelud}` };
  }
  return guanya;
}
const valor = (el, prop, ctx, regles_) => calcula(el, prop, ctx, regles_)?.valor ?? null;

/* Tokens d'espai (tokens.css, :root) a píxels. */
const TOKENS = llig('src/css/tokens.css');
function px(v) {
  if (v === null || v === undefined) return 0;
  const t = v.trim();
  const amb = /^var\((--[-\w]+)\s*(?:,\s*(.+))?\)$/.exec(t);
  if (amb) {
    const m = new RegExp(`${amb[1]}\\s*:\\s*([^;]+);`).exec(TOKENS);
    if (m) return px(m[1]);
    if (amb[2] !== undefined) return px(amb[2]);
    throw new Error(`token desconegut: ${amb[1]}`);
  }
  if (t === '0' || t === 'auto') return 0;
  const n = /^(-?\d*\.?\d+)(px|rem)$/.exec(t);
  if (n) return Number(n[1]) * (n[2] === 'rem' ? 16 : 1);
  throw new Error(`el model no sap llegir «${v}»`);
}

/** Un fragment de DOM dins del document (jsdom ha de vore els avantpassats). */
function dom(html) {
  const arrel = document.createElement('div');
  /* Fragment de prova escrit a la mateixa prova: es parseja amb DOMParser i es mouen els nodes. */
  arrel.replaceChildren(...new DOMParser().parseFromString(html, 'text/html').body.childNodes);
  document.body.replaceChildren(arrel);
  return arrel;
}

/* Els contextos de la mesura: el mòbil de 385 i de 360 (la pàgina és el
   contenidor), l'escriptori de 1280 (la columna «contained» de 1020) i els
   mateixos en un navegador sense @container (Chrome 100 a 104). */
const CONTEXTOS = {
  'mòbil 385': { contenidors: true, finestra: 385, contenidor: 385 },
  'mòbil 360': { contenidors: true, finestra: 360, contenidor: 360 },
  'escriptori 1280': { contenidors: true, finestra: 1280, contenidor: 1020 },
  'mòbil 385 sense @container': { contenidors: false, finestra: 385, contenidor: 385 },
  'escriptori 1280 sense @container': { contenidors: false, finestra: 1280, contenidor: 1020 },
};
const RITME = [0, 8, 16, 24, 32, 48];

describe('PS-06 · entre targetes d’una graella, el gap i prou', () => {
  /* Els consumidors de .sdp-card-grid: el Mur, el Mercat, /pobles, el
     Calendari i el Control (graella nua), la Nevera, la Consola i el Tauler
     de la Gestoria. */
  const GRAELLES = {
    nua: '<div class="sdp-card-grid"><article class="sp-card"></article><article class="sp-card"></article></div>',
    nevera: '<div data-sdp-app="nevera"><div class="sdp-card-grid"><article class="sp-card"></article><article class="sp-card"></article></div></div>',
    consola: '<nav class="sdp-card-grid sdp-consola__graella"><article class="sp-card"></article><article class="sp-card"></article></nav>',
    gestoria: '<div class="sdp-card-grid sdp-gestoria-tauler__graella"><article class="sp-card sdp-gestoria-tauler__targeta"></article><article class="sp-card sdp-gestoria-tauler__targeta"></article></div>',
  };
  const buitEntreFiles = (html, ctx, regles_) => {
    const arrel = dom(`<div class="sdp-universal-page-container"><div class="content-wrapper">${html}</div></div>`);
    const graella = arrel.querySelector('.sdp-card-grid');
    const [primera, segona] = graella.querySelectorAll(':scope > .sp-card');
    /* En una graella els marges no es fonen: marge de baix + gap de fila + marge de dalt. */
    return px(valor(primera, 'margin-bottom', ctx, regles_)) + px(valor(graella, 'row-gap', ctx, regles_)) + px(valor(segona, 'margin-top', ctx, regles_));
  };

  test('una sola regla, la generalitzada, dins de @layer components de modules.css; la de la Nevera ja no hi és', () => {
    const generals = REGLES.filter((r) => r.prelud === '.sdp-card-grid > .sp-card');
    expect(generals.map((r) => [r.ruta, r.pares, r.cos])).toEqual([['src/css/modules.css', ['@layer components'], 'margin-block-end: 0;']]);
    expect(REGLES.filter((r) => r.selectors.some((s) => /\[data-sdp-app="nevera"\]\s+\.sdp-card-grid\s*>\s*\.sp-card$/.test(s)))).toEqual([]);
    /* El gap de la graella, el canònic, no es toca. */
    expect(REGLES.filter((r) => r.prelud === '.sdp-card-grid').map((r) => r.decl['row-gap']?.valor)).toEqual(['var(--sdp-space-6)']);
  });

  test.each(Object.keys(GRAELLES))('graella %s: 24px entre files en tots els contextos', (nom) => {
    for (const [ctxNom, ctx] of Object.entries(CONTEXTOS)) {
      const buit = buitEntreFiles(GRAELLES[nom], ctx);
      expect(buit, `${nom} · ${ctxNom}`).toBe(24);
      expect(RITME, `${nom} · ${ctxNom}`).toContain(buit);
    }
  });

  test('la prova mossega: sense la regla nova, el buit torna a ser 56', () => {
    const senseRegla = REGLES.filter((r) => r.prelud !== '.sdp-card-grid > .sp-card');
    expect(buitEntreFiles(GRAELLES.nua, CONTEXTOS['mòbil 385'], senseRegla)).toBe(56);
    expect(buitEntreFiles(GRAELLES.consola, CONTEXTOS['escriptori 1280'], senseRegla)).toBe(56);
  });

  /* Correcció de l'àrbitre (ARB-B7f-01, 261102) · El marge de l'última fila
     també separava la graella del bloc següent. Sota l'última targeta (dins de
     la caixa de la graella): marge de baix de la targeta + coixí de baix de la
     graella. Ha de ser el de HEAD: 32 a les graelles de targetes, 0 a la
     Nevera (ja no en portava), a la graella buida i a la de /dispositius. */
  const LANE = (r) => r.prelud === '.sdp-card-grid > .sp-card' || r.selectors.some((s) => /^\.sdp-card-grid:not\(:empty\)$|^\.devices-panel__body > \.sdp-card-grid$/.test(s));
  const cua = (html, ctx, regles_) => {
    const arrel = dom(`<div class="sdp-universal-page-container"><div class="content-wrapper">${html}<section><h2>Bloc següent</h2></section></div></div>`);
    const graella = arrel.querySelector('.sdp-card-grid');
    const ultima = graella.lastElementChild;
    return (ultima ? px(valor(ultima, 'margin-bottom', ctx, regles_)) : 0) + px(valor(graella, 'padding-bottom', ctx, regles_));
  };

  test('el coixí: una regla per a les graelles amb fills i una per a les que no en portaven, dins de @layer components de modules.css', () => {
    const coixi = REGLES.filter((r) => r.decl['padding-bottom'] && r.selectors.some((s) => /\.sdp-card-grid$/.test(s) || /\.sdp-card-grid:not\(:empty\)$/.test(s)));
    expect(coixi.map((r) => [r.ruta, r.pares, r.prelud, r.cos])).toEqual([
      ['src/css/modules.css', ['@layer components'], '.sdp-card-grid:not(:empty)', 'padding-block-end: var(--sdp-space-8);'],
      ['src/css/modules.css', ['@layer components'], '[data-sdp-app="nevera"] .sdp-card-grid, .devices-panel__body > .sdp-card-grid', 'padding-block-end: 0;'],
    ]);
  });

  test.each(['nua', 'consola', 'gestoria'])('graella %s: sota l’última fila, els 32 de sempre en tots els contextos (el bloc següent no s’hi enganxa)', (nom) => {
    const head = REGLES.filter((r) => !LANE(r));
    for (const [ctxNom, ctx] of Object.entries(CONTEXTOS)) {
      expect(cua(GRAELLES[nom], ctx), `${nom} · ${ctxNom}`).toBe(32);
      expect(cua(GRAELLES[nom], ctx), `${nom} · ${ctxNom} (HEAD)`).toBe(cua(GRAELLES[nom], ctx, head));
    }
  });

  test('sense coixí on HEAD no en tenia: la Nevera, la graella buida i la de /dispositius (.card--soft)', () => {
    const devices = '<div class="devices-panel__body"><div class="sdp-card-grid"><article class="card--soft"></article><article class="card--soft"></article></div></div>';
    for (const [ctxNom, ctx] of Object.entries(CONTEXTOS)) {
      expect(cua(GRAELLES.nevera, ctx), `nevera · ${ctxNom}`).toBe(0);
      expect(cua('<div class="sdp-card-grid"></div>', ctx), `buida · ${ctxNom}`).toBe(0);
      expect(cua(devices, ctx), `dispositius · ${ctxNom}`).toBe(0);
    }
  });

  test('la prova mossega: sense el coixí, la graella queda enganxada al bloc següent (0), i entre files continuen els 24', () => {
    const senseCoixi = REGLES.filter((r) => !(r.decl['padding-bottom'] && r.prelud === '.sdp-card-grid:not(:empty)'));
    expect(cua(GRAELLES.nua, CONTEXTOS['mòbil 385'], senseCoixi)).toBe(0);
    expect(cua(GRAELLES.consola, CONTEXTOS['escriptori 1280'], senseCoixi)).toBe(0);
    expect(buitEntreFiles(GRAELLES.nua, CONTEXTOS['mòbil 385'])).toBe(24);
  });

  test('la columna (.sdp-card-llista) i la targeta solta conserven el marge de 32 (Llei del Píxel)', () => {
    const arrel = dom('<div class="sdp-universal-page-container"><div class="content-wrapper">'
      + '<div class="sdp-card-llista"><article class="sp-card" id="llista"></article></div>'
      + '<article class="sp-card" id="solta"></article></div></div>');
    for (const [ctxNom, ctx] of Object.entries(CONTEXTOS)) {
      expect(px(valor(arrel.querySelector('#llista'), 'margin-bottom', ctx)), ctxNom).toBe(32);
      expect(px(valor(arrel.querySelector('#solta'), 'margin-bottom', ctx)), ctxNom).toBe(32);
    }
  });
});

describe('PS-06 · /connectar: entre l’Alerta filla i el bloc següent, el gap de 32', () => {
  const html = '<div class="sdp-universal-page-container"><div class="sdp-connectar">'
    + '<div role="status" class="sdp-alerta sdp-alerta--avis" id="filla"><div class="sdp-alerta__cos"><p class="sdp-alerta__titol">Mode Foraster actiu</p></div></div>'
    + '<section class="sdp-connectar__objecte" id="objecte"><div role="status" class="sdp-alerta sdp-alerta--avis" id="dins"></div></section>'
    + '<div class="sdp-connectar__peu"><div role="alert" class="sdp-alerta sdp-alerta--error" id="peu"></div></div>'
    + '</div></div>';
  /* Columna flex: marge de baix de l'Alerta + gap + marge de dalt del bloc següent. */
  const buit = (arrel, ctx, regles_) => px(valor(arrel.querySelector('#filla'), 'margin-bottom', ctx, regles_))
    + px(valor(arrel.querySelector('.sdp-connectar'), 'row-gap', ctx, regles_))
    + px(valor(arrel.querySelector('#objecte'), 'margin-top', ctx, regles_));

  test('32 en tots els contextos, i l’Alerta filla ja no porta marge de dalt', () => {
    const arrel = dom(html);
    for (const [ctxNom, ctx] of Object.entries(CONTEXTOS)) {
      expect(buit(arrel, ctx), ctxNom).toBe(32);
      expect(px(valor(arrel.querySelector('#filla'), 'margin-top', ctx)), ctxNom).toBe(0);
    }
  });

  test('les Alertes de dins d’una secció o del peu conserven els 12 de sempre', () => {
    const arrel = dom(html);
    for (const id of ['dins', 'peu']) {
      const el = arrel.querySelector(`#${id}`);
      expect([valor(el, 'margin-top', CONTEXTOS['mòbil 385']), valor(el, 'margin-bottom', CONTEXTOS['mòbil 385'])], id)
        .toEqual(['var(--sdp-space-3)', 'var(--sdp-space-3)']);
    }
  });

  test('la prova mossega: sense la regla nova, el buit torna a ser 44', () => {
    const senseRegla = REGLES.filter((r) => r.prelud !== '.sdp-connectar > .sdp-alerta');
    expect(buit(dom(html), CONTEXTOS['mòbil 385'], senseRegla)).toBe(44);
  });
});

describe('PS-10 · el Mur en mòbil (default D-3): píndoles en una fila que llisca i sense entradeta', () => {
  /* L'estructura del Mur (PageFrame + MurSection; la de veres la comprova
     MurSection.pedra.test.jsx), amb el calendari de la pestanya Calendari. */
  const pagina = (classe) => dom(`<div class="sdp-universal-page-container sdp-universal-page-container--contained ${classe}">`
    + '<article class="content-wrapper">'
    + '<div class="page-intro"><h2>Publicacions recents</h2><p class="lead" id="entradeta">Explora el mur públic</p></div>'
    + '<div class="content-wrapper">'
    + '<div role="group" aria-label="Filtres del mur" class="sdp-pindola" id="filtres">'
    + ['Mostrar tot', 'Sóc de Poble', 'Mercat', 'Calendari', 'Mapa'].map((t, i) => `<button type="button" class="sdp-pindola__opcio" aria-pressed="${i === 0}">${t}</button>`).join('')
    + '</div>'
    + '<div class="sdp-cal-navegacio"><h3 class="sdp-cal-navegacio__titol">Novembre</h3>'
    + '<div role="group" aria-label="Vista" class="sdp-pindola sdp-cal-vistes" id="vistes"><button type="button" class="sdp-pindola__opcio" aria-pressed="true">Mes</button></div></div>'
    + '<div class="sdp-card-grid"><article class="sp-card"></article></div>'
    + '</div></article></div>');
  const estat = (arrel, ctx, regles_) => ({
    wrap: valor(arrel.querySelector('#filtres'), 'flex-wrap', ctx, regles_),
    justify: valor(arrel.querySelector('#filtres'), 'justify-content', ctx, regles_),
    overflowX: valor(arrel.querySelector('#filtres'), 'overflow-x', ctx, regles_),
    /* El lliscament de la fila no arrossega la pàgina (ARB-B7f-03, 261102). */
    overscroll: valor(arrel.querySelector('#filtres'), 'overscroll-behavior-inline', ctx, regles_),
    opcions: [...arrel.querySelectorAll('#filtres > button')].map((b) => [valor(b, 'flex-shrink', ctx, regles_), valor(b, 'white-space', ctx, regles_)]),
    entradeta: valor(arrel.querySelector('#entradeta'), 'display', ctx, regles_),
  });
  const MOBIL = { wrap: 'nowrap', justify: 'flex-start', overflowX: 'auto', overscroll: 'contain', opcions: Array(5).fill(['0', 'nowrap']), entradeta: 'none' };
  const COM_SEMPRE = { wrap: 'wrap', justify: 'center', overflowX: null, overscroll: null, opcions: Array(5).fill([null, null]), entradeta: null };

  test.each(['mòbil 385', 'mòbil 360', 'mòbil 385 sense @container'])('%s: una fila que llisca i l’entradeta fora', (ctxNom) => {
    expect(estat(pagina('sdp-pagina-mur'), CONTEXTOS[ctxNom])).toEqual(MOBIL);
  });

  test.each(['escriptori 1280', 'escriptori 1280 sense @container'])('%s: les píndoles i l’entradeta de sempre', (ctxNom) => {
    expect(estat(pagina('sdp-pagina-mur'), CONTEXTOS[ctxNom])).toEqual(COM_SEMPRE);
  });

  test('mana l’ample de la pàgina, no el de la finestra: una columna de 470 en una finestra de 1280 també', () => {
    expect(estat(pagina('sdp-pagina-mur'), { contenidors: true, finestra: 1280, contenidor: 470 })).toEqual(MOBIL);
    expect(estat(pagina('sdp-pagina-mur'), { contenidors: true, finestra: 385, contenidor: 481 })).toEqual(COM_SEMPRE);
  });

  test('només el Mur: una altra pàgina i el selector de vistes del calendari del Mur no canvien', () => {
    for (const ctxNom of ['mòbil 385', 'mòbil 385 sense @container']) {
      const ctx = CONTEXTOS[ctxNom];
      expect(estat(pagina(''), ctx), ctxNom).toEqual(COM_SEMPRE);
      const vistes = pagina('sdp-pagina-mur').querySelector('#vistes');
      expect([valor(vistes, 'flex-wrap', ctx), valor(vistes, 'overflow-x', ctx), valor(vistes, 'overscroll-behavior-inline', ctx), valor(vistes, 'justify-content', ctx)], ctxNom)
        .toEqual(['wrap', null, null, 'flex-start']);
    }
  });

  test('la xarxa sense @container porta les mateixes regles que el bloc @container', () => {
    const delMur = (r) => r.selectors.some((s) => s.startsWith('.sdp-pagina-mur '));
    const ambContenidor = REGLES.filter((r) => delMur(r) && r.pares.includes('@container (max-width: 480px)'));
    const xarxa = REGLES.filter((r) => delMur(r) && r.pares.includes('@supports not (container-type: inline-size)') && r.pares.includes('@media (max-width: 480px)'));
    expect(ambContenidor.length).toBe(3);
    expect(xarxa.map((r) => [r.prelud, r.cos])).toEqual(ambContenidor.map((r) => [r.prelud, r.cos]));
    expect(REGLES.filter(delMur).length).toBe(6);
    expect(new Set(REGLES.filter(delMur).map((r) => r.ruta))).toEqual(new Set(['src/css/modules.css']));
  });

  test('la prova mossega: sense les regles del Mur, el mòbil torna a les dues files i a l’entradeta', () => {
    const senseMur = REGLES.filter((r) => !r.selectors.some((s) => s.startsWith('.sdp-pagina-mur ')));
    expect(estat(pagina('sdp-pagina-mur'), CONTEXTOS['mòbil 385'], senseMur)).toEqual(COM_SEMPRE);
  });
});
