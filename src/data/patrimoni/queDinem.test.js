// @vitest-environment node
/* Onada R14 · Receptari «Què dinem?» (Associació Gastronòmica i Cultural «Fins rebentar com Sangonereta», 2019).
   Blinda el mòdul de dades net: les 149 receptes de l'índex del llibre, slugs estables, làmines i PDF al disc,
   vídeos verificats i cap camp ni text que el llibre no done. Els mots vetats van escrits amb classes de caràcters
   perquè la mateixa cerca de text no trobe esta prova. */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  OBRA_QUE_DINEM, RECEPTES_QUE_DINEM, RECOMPTES_QUE_DINEM, liniesIngredients, receptaPerSlug
} from './queDinem.js';

const PUBLIC = path.join(process.cwd(), 'public');
const DIR_LAMINES = path.join(PUBLIC, 'assets/uploads/patrimoni/que-dinem');
const ARREL_CULTURA = process.env.SDP_CULTURA_DE_POBLE || path.resolve(process.cwd(), '..', '_cultura_de_poble');
const LAMINES_FONT = path.join(ARREL_CULTURA, 'menjar_i_beure_de_poble', 'imatges_llibre_que_dinem_webp');
const SHA_PDF = '399d2f54abdba0fb4c75f0e4d1b60744f2b19ed0bdf781ae186e5758bc86fddd';
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

/* Els 47 identificadors que el PDF imprimix i que l'oEmbed de YouTube va respondre (200) com a vídeos del canal
   «Sangonereta Gastronomia» (triatge R14, 08-11-2026). */
const VIDEOS_VERIFICATS = Object.freeze([
  '0DfRcq-Oxi8', '0UGzAU_Euok', '2ARmuJR1Nv0', '4mJJZ7nbnf4', '5wbFXYfz1iQ', '7YHl3O2G1gY', '87Ef4uPgjiI',
  '8KraFBG_Hj4', '8iEDAK02GRI', 'ADIV7rdbGoc', 'DsEhUWicM3Q', 'GbNXpky2ywA', 'GjH7LEmBegE', 'IaC_Kt0jRrE',
  'LivAt9NLagY', 'NBDzGUNdzLA', 'NNYeov3B6Ww', 'NiMYLO26cp0', 'Nqa_4CYk_0M', 'OagpIN80sRE', 'PtU2iBb-U4c',
  'Q3QYEIKRjTs', 'Qcml4Zi8n8A', 'TR9o3LAN_YQ', 'VsxAAV3If5U', 'YLvgEcMj4qE', 'ZAF09BRZpU4', 'aqzDNz_guic',
  'bkiLNneekaE', 'c0r0RBW5tqM', 'cq2a-rmwXBs', 'cx7g2LW3ayo', 'hX17FkEzDzw', 'j1Qz8TSkvkA', 'j7BFmZ2xlXY',
  'jjiuqw1bqUU', 'kUGJh6fWUVA', 'm0C-_8hciyk', 'mHiYM03At-0', 'pJBbOyegKDE', 'pkXqyFoJiUo', 'rYPg0TGXgjQ',
  'tU6ZoSqp4wo', 'uRZzvLV3gIE', 'wR-6GwTigM4', 'xBAv9FYHDUE', 'xj3i3YcULw8'
]);

const CAMPS_RECEPTA = ['apartat', 'ingredients', 'lamina', 'notes', 'numero', 'pagina', 'pagines', 'preparacio', 'slug', 'titol', 'youtubeId'];
const CAMPS_OBRA = ['any', 'apartats', 'associacio', 'canalVideos', 'dipositLegal', 'isbnImpres', 'isbnValid', 'lloc', 'pdf', 'pdfBytes', 'permis', 'titol'];
/* Res del que el kit afegia per damunt del llibre. */
const VETATS = [
  /al[·.]?l[eè]rg/i, /alerg/i, /escandall/i, /\bpreus?\b/i, /\bpvp\b/i, /\bkm\s*0\b/i, /nano\s*banana/i,
  /pep\s+casc[a]nt/i, /casc[a]nt/i, /mas[i]a/i, /comensal/i, /\bracions?\b/i, /la\s+parr[oò]quia/i,
  /cooperativa\s+la\s+torre/i, /pebras[s]os/i, /segellat\s+al\s+node/i, /\btraces\b/i, /mercadona/i
];
const textDe = (valor) => JSON.stringify(valor);
const totesLesLinies = (r) => [
  r.titol, ...r.ingredients.flatMap((b) => [b.titol, ...b.linies]), ...r.preparacio.flatMap((b) => [b.titol, ...b.linies]), ...r.notes
].filter((t) => t !== null);

describe('Què dinem? · les 149 receptes de l’índex', () => {
  it('n’hi ha 149, numerades de l’1 al 149 en l’ordre de l’índex i de les pàgines', () => {
    expect(RECEPTES_QUE_DINEM).toHaveLength(149);
    RECEPTES_QUE_DINEM.forEach((r, i) => {
      expect(r.numero).toBe(i + 1);
      if (i > 0) expect(r.pagina).toBeGreaterThan(RECEPTES_QUE_DINEM[i - 1].pagina);
      expect(r.pagines[0]).toBe(r.pagina);
    });
  });

  it('cap recepta de fora de l’índex: ni la cloenda de la p. 163 ni variants de títol inventat', () => {
    expect(RECEPTES_QUE_DINEM.some((r) => r.pagina === 163 || /conclusi[oó]/i.test(r.titol))).toBe(false);
    expect(RECEPTES_QUE_DINEM.some((r) => /\(variant/i.test(r.titol))).toBe(false);
  });

  it('cada recepta porta només els camps permesos, i les dades estan congelades', () => {
    for (const r of RECEPTES_QUE_DINEM) expect(Object.keys(r).sort()).toEqual(CAMPS_RECEPTA);
    expect(Object.keys(OBRA_QUE_DINEM).sort()).toEqual(CAMPS_OBRA);
    expect(Object.isFrozen(RECEPTES_QUE_DINEM)).toBe(true);
    expect(Object.isFrozen(RECEPTES_QUE_DINEM[0])).toBe(true);
    expect(Object.isFrozen(RECEPTES_QUE_DINEM[0].ingredients[0].linies)).toBe(true);
    expect(Object.isFrozen(OBRA_QUE_DINEM.apartats)).toBe(true);
  });

  it('l’apartat és el de l’índex del llibre, per rang de pàgines', () => {
    const rang = { entrades: [9, 54], plats: [56, 114], postres: [116, 155], licors: [157, 162] };
    expect(OBRA_QUE_DINEM.apartats.map((a) => a.id)).toEqual(Object.keys(rang));
    for (const r of RECEPTES_QUE_DINEM) {
      const [de, a] = rang[r.apartat];
      expect(r.pagina >= de && r.pagina <= a, `#${r.numero} p. ${r.pagina} fora de ${r.apartat}`).toBe(true);
    }
  });

  it('cada recepta té ingredients i preparació, també les que el kit duia buides (receptes 7, 15, 18 i 43)', () => {
    for (const r of RECEPTES_QUE_DINEM) {
      expect(liniesIngredients(r).length, `#${r.numero} sense ingredients`).toBeGreaterThan(0);
      expect(r.preparacio.flatMap((b) => b.linies).length, `#${r.numero} sense preparació`).toBeGreaterThan(0);
      for (const t of totesLesLinies(r)) {
        expect(typeof t).toBe('string');
        expect(t).toBe(t.trim());
        expect(t).not.toMatch(/\s{2,}/);
        /* Cap rastre d'URL ni de paràmetres de consulta (la recepta 48 duia «&feature=youtu.be» com a nota). */
        expect(t, `#${r.numero}`).not.toMatch(/https?:|www\.|youtu\.be|youtube\.com|watch\?|[?&][a-z_]+=/i);
        /* Un pronom feble amb guionet enganxat a un altre («traieu-losen»): guionet de final de línia llevat per error. */
        expect(t, `#${r.numero}`).not.toMatch(/-(?:l[aeio]s?|[nv]os|[mst]e)(?:en|hi|ho|ne)(?![\p{L}])/iu);
      }
    }
    expect(RECEPTES_QUE_DINEM[47].notes).toEqual([]);
    expect(RECEPTES_QUE_DINEM[134].preparacio.flatMap((b) => b.linies).join(' ')).toContain('traieu-los-en');
    expect(RECEPTES_QUE_DINEM[65].preparacio.flatMap((b) => b.linies).join(' ')).toContain('col.loqueu-los');
  });

  it('cap capçalera del llibre convertida en pas ni línies d’ingredients fusionades', () => {
    const capcalera = (l) => l.length < 60 && !/[.:;]$/.test(l) && (l.match(/\p{Lu}/gu) || []).length >= (l.match(/\p{L}/gu) || []).length * 0.7;
    for (const r of RECEPTES_QUE_DINEM) {
      for (const l of r.preparacio.flatMap((b) => b.linies)) expect(capcalera(l), `#${r.numero} «${l}»`).toBe(false);
      for (const l of liniesIngredients(r)) expect(l, `#${r.numero}`).not.toMatch(/\s-\p{L}/u);
    }
    const titols = (n, camp) => RECEPTES_QUE_DINEM[n - 1][camp].map((b) => b.titol);
    expect(titols(79, 'ingredients')).toEqual(['Ingredients de la verdura', 'Ingredients de la carn', 'Ingredients de les pilotes']);
    expect(titols(79, 'preparacio')).toEqual(['Preparació de les pilotes', 'Preparació general']);
    expect(titols(80, 'preparacio')).toEqual(['Preparació de les pilotes', 'Preparació general']);
    expect(titols(115, 'ingredients')).toEqual(['Ingredients per a la pasta', 'Farciment de tomaca', 'Variant', 'Farciment de verdura']);
    expect(titols(118, 'ingredients')).toEqual([null, 'Ingredients per l’almívar']);
    expect(liniesIngredients(RECEPTES_QUE_DINEM[61])).toHaveLength(10);
  });
});

describe('Què dinem? · slugs', () => {
  it('són únics, en minúscula i sense accents', () => {
    const slugs = RECEPTES_QUE_DINEM.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(149);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  it('són estables: canviar-ne un trenca enllaços publicats i ha de ser una decisió explícita', () => {
    expect(RECEPTES_QUE_DINEM[0].slug).toBe('pa-rustic');
    expect(RECEPTES_QUE_DINEM[78].slug).toBe('olla-de-carn');
    expect(RECEPTES_QUE_DINEM[148].slug).toBe('herbero');
    expect(sha256(RECEPTES_QUE_DINEM.map((r) => r.slug).join('\n'))).toBe('50d14305c94a33be276af01ed19a51f347e92601e6972db0e0fb6260261ab0d5');
  });

  it('receptaPerSlug és exacta: un slug inexistent torna null, sense cerca difusa', () => {
    expect(receptaPerSlug('pa-rustic')).toBe(RECEPTES_QUE_DINEM[0]);
    for (const r of RECEPTES_QUE_DINEM) expect(receptaPerSlug(r.slug)).toBe(r);
    for (const dolent of ['pa-rusti', 'Pa-Rustic', ' pa-rustic', 'pa-rustic ', 'pa rustic', 'pa', '', 'constructor', '__proto__', 'toString']) {
      expect(receptaPerSlug(dolent), JSON.stringify(dolent)).toBeNull();
    }
    for (const dolent of [undefined, null, 1, {}, ['pa-rustic']]) expect(receptaPerSlug(dolent)).toBeNull();
  });
});

describe('Què dinem? · làmines, PDF i vídeos', () => {
  it('cada làmina existix al disc, és la de la pàgina de la recepta i no es repetix', () => {
    const usades = RECEPTES_QUE_DINEM.map((r) => r.lamina).filter(Boolean);
    expect(new Set(usades).size).toBe(usades.length);
    for (const r of RECEPTES_QUE_DINEM) {
      if (!r.lamina) continue;
      expect(r.lamina).toMatch(/^\/assets\/uploads\/patrimoni\/que-dinem\/p\d{3}\.webp$/);
      expect(existsSync(path.join(PUBLIC, r.lamina)), r.lamina).toBe(true);
      const pag = Number(/p(\d{3})\.webp$/.exec(r.lamina)[1]);
      expect(r.pagines, `#${r.numero}`).toContain(pag);
    }
  });

  it('mapatge corregit: recepta 115 → p127, recepta 126 sense làmina, p009 només per al pa i cap foto de grup (p163)', () => {
    expect(RECEPTES_QUE_DINEM[114].lamina).toBe('/assets/uploads/patrimoni/que-dinem/p127.webp');
    expect(RECEPTES_QUE_DINEM[125].lamina).toBeNull();
    expect(RECEPTES_QUE_DINEM.filter((r) => r.lamina?.endsWith('/p009.webp')).map((r) => r.numero)).toEqual([1]);
    expect(textDe(RECEPTES_QUE_DINEM)).not.toContain('p163');
  });

  it('al directori públic no hi ha cap làmina sense recepta, ni la p163', () => {
    const disc = readdirSync(DIR_LAMINES).filter((n) => n.endsWith('.webp')).sort();
    const usades = RECEPTES_QUE_DINEM.map((r) => r.lamina).filter(Boolean).map((l) => path.basename(l)).sort();
    expect(disc).toEqual(usades);
  });

  it.skipIf(!existsSync(LAMINES_FONT))('quan la font és al disc, cada làmina és byte a byte la del llibre', () => {
    for (const r of RECEPTES_QUE_DINEM.filter((x) => x.lamina)) {
      const nom = path.basename(r.lamina);
      expect(sha256(readFileSync(path.join(DIR_LAMINES, nom))), nom).toBe(sha256(readFileSync(path.join(LAMINES_FONT, nom))));
    }
  });

  it('el PDF descarregable és el del llibre (SHA-256)', () => {
    expect(OBRA_QUE_DINEM.pdf).toBe('/assets/uploads/patrimoni/que-dinem/llibre-que-dinem.pdf');
    expect(sha256(readFileSync(path.join(PUBLIC, OBRA_QUE_DINEM.pdf)))).toBe(SHA_PDF);
    /* La mida que diu el botó de descàrrega és la del fitxer. */
    expect(OBRA_QUE_DINEM.pdfBytes).toBe(statSync(path.join(PUBLIC, OBRA_QUE_DINEM.pdf)).size);
  });

  it('cada vídeo té 11 caràcters, és dels verificats i no es repetix (les variants no hereten vídeo)', () => {
    const ids = RECEPTES_QUE_DINEM.map((r) => r.youtubeId).filter(Boolean);
    for (const id of ids) {
      expect(id).toMatch(/^[A-Za-z0-9_-]{11}$/);
      expect(VIDEOS_VERIFICATS).toContain(id);
    }
    expect(new Set(ids).size).toBe(ids.length);
    expect([...new Set(ids)].sort()).toEqual([...VIDEOS_VERIFICATS].sort());
  });
});

describe('Què dinem? · crèdits i res inventat', () => {
  it('els crèdits són els del llibre; l’ISBN imprés es mostra literal i marcat com a no vàlid', () => {
    expect(OBRA_QUE_DINEM.titol).toBe('Què dinem?');
    expect(OBRA_QUE_DINEM.associacio).toContain('Fins rebentar com Sangonereta');
    expect(OBRA_QUE_DINEM.lloc).toBe('Muro, El Comtat');
    expect(OBRA_QUE_DINEM.any).toBe(2019);
    expect(OBRA_QUE_DINEM.dipositLegal).toBe('A 373-2019');
    expect(OBRA_QUE_DINEM.isbnImpres).toBe('978 84 09 131910 1');
    expect(OBRA_QUE_DINEM.isbnValid).toBe(false);
    expect(OBRA_QUE_DINEM.canalVideos).toBe('Sangonereta Gastronomia');
  });

  it('cap camp ni text vetat a les dades exportades', () => {
    const tot = textDe({ OBRA_QUE_DINEM, RECEPTES_QUE_DINEM });
    for (const patro of VETATS) expect(tot, String(patro)).not.toMatch(patro);
  });

  it('cap mot vetat tampoc al fitxer de dades (comentaris inclosos)', () => {
    const font = readFileSync(path.join(process.cwd(), 'src/data/patrimoni/queDinem.js'), 'utf8');
    for (const patro of VETATS) expect(font, String(patro)).not.toMatch(patro);
  });

  it('els recomptes es calculen de les dades', () => {
    expect(RECOMPTES_QUE_DINEM.receptes).toBe(RECEPTES_QUE_DINEM.length);
    expect(RECOMPTES_QUE_DINEM.receptes).toBe(149);
    expect(RECOMPTES_QUE_DINEM.videos).toBe(new Set(RECEPTES_QUE_DINEM.map((r) => r.youtubeId).filter(Boolean)).size);
    expect(RECOMPTES_QUE_DINEM.videos).toBe(47);
    expect(RECOMPTES_QUE_DINEM.receptesAmbVideo).toBe(RECEPTES_QUE_DINEM.filter((r) => r.youtubeId).length);
    expect(RECOMPTES_QUE_DINEM.lamines).toBe(148);
    expect(Object.values(RECOMPTES_QUE_DINEM.perApartat).reduce((a, b) => a + b, 0)).toBe(149);
  });
});
