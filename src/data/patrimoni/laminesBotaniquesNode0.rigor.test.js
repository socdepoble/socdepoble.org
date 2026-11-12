// @vitest-environment node
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { midesWebp } from '../../../tooling/patrimoni/mides-webp.mjs';
import { ARBRES_MONUMENTALS_2020 } from './arbresMonumentals2020.js';
import { FONTS_BANC_LLAVORS, entradesDelCataleg } from './bancLlavors.js';
import { ESPECIES_HERBARI_LA_TORRE_117 } from './herbariLaTorre117.js';
import { LAMINES_BOTANIQUES_NODE0, obteLaminaBotanicaNode0, potMostrarVariantBotanica } from './laminesBotaniquesNode0.js';

const arrelPublica = resolve('public');
const directori = '/assets/uploads/patrimoni';
const variants = ['v1-habit', 'v2-macro', 'v3-llavor'];
const recreacionsEnQuarantena = JSON.parse(readFileSync('tooling/patrimoni/lamines-sintetiques-r19.json', 'utf8'));
const pendents = new Map([
  ['atles-14-all', 'v1-habit'],
  ['atles-28-cigro', 'v2-macro'],
  ['avl-11-alfabeguera-de-fulla-morada', 'v3-llavor'],
  ['cv-05-alberginia-llistada-de-gandia', 'v2-macro'],
  ['cv-13-tomaca-de-pera', 'v3-llavor']
]);

const fonts = {
  herbari: ESPECIES_HERBARI_LA_TORRE_117,
  'banc-de-llavors': FONTS_BANC_LLAVORS.flatMap((font) => entradesDelCataleg(font.id))
};

function binomiDeLaFont(nom) {
  const [genere, epitet, tercer] = nom.trim().split(/\s+/u);
  const binomi = epitet === '×' || epitet === 'x' ? `${genere} × ${tercer}` : `${genere} ${epitet}`;
  // La transcripció literal manté les errates i la nomenclatura original.
  if (binomi === 'Olea europea') return 'Olea europaea';
  if (binomi === 'Lycopersicon esculentum') return 'Solanum lycopersicum';
  return binomi;
}

const trets = {
  'Prunus dulcis': [/alternes/i, /oblongolanceolades/i, /solitàries o geminades/i, /drupa/i],
  'Olea europaea': [/oposades/i, /marge enter/i, /revers argentat/i, /tetràmeres/i, /dos estams/i, /drupa/i],
  'Ceratonia siliqua': [/paripinnades/i, /marge enter/i, /apètales/i, /llegum indehiscent/i, /lenticulars/i],
  'Quercus ilex': [/monoica/i, /aments/i, /gla/i, /cúpula/i],
  'Arbutus unedo': [/serrades/i, /urceolada/i, /roja i tuberculada/i],
  'Ficus carica': [/lòbuls palmats/i, /dins del siconi/i],
  'Punica granatum': [/fulles simples/i, /marge enter/i, /balàustia/i],
  'Laurus nobilis': [/dioic/i, /umbel·les axil·lars/i, /baia negra/i],
  'Rosmarinus officinalis': [/oposades/i, /marge enter i revolut/i, /núcules/i],
  'Thymus vulgaris': [/oposades/i, /revolut/i, /núcules/i],
  'Lavandula angustifolia': [/oposades/i, /espiga/i, /núcules/i],
  'Ocimum basilicum': [/oposades/i, /esquizocarp/i, /quatre núcules/i],
  'Solanum lycopersicum': [/pinnades/i, /flors grogues/i, /baia/i, /llavors aplanades/i],
  'Solanum melongena': [/alternes/i, /violàcia/i, /baia/i],
  'Capsicum annuum': [/fulles simples/i, /marge enter/i, /baia/i],
  'Allium sativum': [/linears/i, /bulb compost/i, /umbel·la/i],
  'Cicer arietinum': [/imparipinnades/i, /axil·lars i solitàries/i, /llegum curt/i],
  'Vicia faba': [/paripinnades/i, /marge enter/i, /llegum allargat/i]
};

describe('P0-118 · Integritat de les làmines botàniques del Node 0', () => {
  const llista = Object.entries(LAMINES_BOTANIQUES_NODE0);
  const index = Object.fromEntries(Object.entries(fonts).map(([colleccio, files]) =>
    [colleccio, new Map(files.map((fitxa) => [fitxa.id, fitxa]))]));

  test('conserva l’índex de cada font i lliga cada làmina al seu id i binomi', () => {
    expect(llista.length).toBeGreaterThan(0);
    for (const [colleccio, files] of Object.entries(fonts)) {
      expect(index[colleccio].size).toBe(files.length);
      expect(files.every((fitxa) => typeof fitxa.nomCientific === 'string' && fitxa.nomCientific.trim())).toBe(true);
    }
    for (const [id, lamina] of llista) {
      const font = index[lamina.colleccio]?.get(id);
      expect(lamina.id).toBe(id);
      expect(font, id).toBeDefined();
      expect(lamina.nomCientific, id).toBe(font.nomCientific);
      expect(lamina.binomiNet, id).toBe(binomiDeLaFont(font.nomCientific));
    }
    expect(obteLaminaBotanicaNode0('__proto__')).toBeNull();
  });

  test('conserva el cens de les recreacions retirades i impedix servir-ne les preimatges', () => {
    expect(recreacionsEnQuarantena).toHaveLength(67);
    const rutes = new Set();
    for (const v of recreacionsEnQuarantena) {
      const lamina = LAMINES_BOTANIQUES_NODE0[v.id];
      expect(lamina, v.id).toBeDefined();
      expect(variants, v.src).toContain(v.variant);
      expect(v.src).toBe(`${directori}/${lamina.colleccio}/${v.id}-${v.variant}.webp`);
      expect(rutes.has(v.src), v.src).toBe(false);
      rutes.add(v.src);
      expect(v.sha256, v.src).toMatch(/^[0-9a-f]{64}$/u);
      expect([v.width, v.height], v.src).toEqual([768, 576]);
      expect(['pendent', 'rebutjada'], v.src).toContain(v.estatVisual);
      const actiu = resolve(arrelPublica, `.${v.src}`);
      if (existsSync(actiu)) expect(createHash('sha256').update(readFileSync(actiu)).digest('hex'), v.src).not.toBe(v.sha256);
    }
    for (const [id, lamina] of llista) {
      const absents = variants.filter((v) => !rutes.has(`${directori}/${lamina.colleccio}/${id}-${v}.webp`));
      expect(absents, id).toEqual(pendents.has(id) ? [pendents.get(id)] : []);
    }
  });

  test('només existixen les variants publicables i en comprova les rutes, dimensions i SHA-256', () => {
    const rutes = new Set();
    for (const [id, lamina] of llista) {
      const tipus = new Set(lamina.variants.map((v) => v.variant));
      expect(tipus.size, id).toBe(lamina.variants.length);
      for (const v of lamina.variants) {
        expect(variants, id).toContain(v.variant);
        expect(v.src).toBe(`${directori}/${lamina.colleccio}/${id}-${v.variant}.webp`);
        expect(rutes.has(v.src), v.src).toBe(false);
        rutes.add(v.src);
        expect(potMostrarVariantBotanica(v), v.src).toBe(true);
        const bytes = readFileSync(resolve(arrelPublica, `.${v.src}`));
        expect(bytes.readUInt32LE(4) + 8, v.src).toBe(bytes.length);
        expect(midesWebp(bytes), v.src).toEqual({ ample: v.width, alt: v.height });
        expect(createHash('sha256').update(bytes).digest('hex'), v.src).toBe(v.sha256);
      }
      const publicada = obteLaminaBotanicaNode0(id);
      expect(publicada.variants).toEqual(lamina.variants.filter(potMostrarVariantBotanica));
      expect(publicada.imatgePrincipal).toBe(publicada.variants[0]?.src ?? null);
    }
    for (const colleccio of Object.keys(fonts)) {
      const fitxers = readdirSync(resolve(arrelPublica, `.${directori}/${colleccio}`)).filter((f) => f !== 'datapackage.json');
      for (const fitxer of fitxers) expect(rutes.has(`${directori}/${colleccio}/${fitxer}`), fitxer).toBe(true);
    }
  });

  test('només activa fotografies amb atribució i quatre revisions, i recreacions amb tres revisions', () => {
    const candidata = {
      estatVisual: 'verificada', tipusImatge: 'fotografia-real-verificada',
      titolImatge: 'Fotografia de prova', autor: 'Persona de prova', llicencia: 'CC-BY-SA-4.0',
      llicenciaUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
      urlOrigen: 'https://commons.wikimedia.org/wiki/File:Prova.webp',
      verificadors: ['Claude', 'Codex', 'Gemini Carbon']
    };
    expect(potMostrarVariantBotanica(candidata)).toBe(false);
    const revisada = { ...candidata, verificadors: [...candidata.verificadors, 'Node 0'] };
    expect(potMostrarVariantBotanica(revisada)).toBe(true);
    expect(potMostrarVariantBotanica({ ...revisada, urlOrigen: 'https://commons.wikimedia.org/wiki/Olea_europaea' })).toBe(false);
    expect(potMostrarVariantBotanica({ ...revisada, llicenciaUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' })).toBe(false);
    expect(potMostrarVariantBotanica({ ...candidata, tipusImatge: 'recreacio-auditada' })).toBe(true);
    expect(potMostrarVariantBotanica({ ...candidata, tipusImatge: 'recreacio-auditada', urlOrigen: 'javascript:void(0)' })).toBe(false);
    expect(potMostrarVariantBotanica({ ...candidata, estatVisual: 'rebutjada' })).toBe(false);
  });

  test('vincula CC BY 3.0 US a la seua URL canònica i conserva les altres guardes', () => {
    const fotografia = {
      estatVisual: 'verificada', tipusImatge: 'fotografia-real-verificada',
      titolImatge: 'Fotografia de prova', autor: 'Persona de prova',
      llicencia: 'CC-BY-3.0-US',
      llicenciaUrl: 'https://creativecommons.org/licenses/by/3.0/us/',
      urlOrigen: 'https://commons.wikimedia.org/wiki/File:Prova.webp',
      verificadors: ['Claude', 'Codex', 'Gemini Carbon', 'Node 0']
    };
    expect(potMostrarVariantBotanica(fotografia)).toBe(true);
    expect(potMostrarVariantBotanica({
      ...fotografia, urlOrigen: 'https://www.gbif.org/occurrence/123'
    })).toBe(true);
    expect(potMostrarVariantBotanica({
      ...fotografia, tipusImatge: 'recreacio-auditada',
      verificadors: ['Claude', 'Codex', 'Gemini Carbon']
    })).toBe(true);
    const rebutjos = [
      { llicenciaUrl: 'https://creativecommons.org/licenses/by/3.0/' },
      { llicenciaUrl: 'https://creativecommons.org/licenses/by-sa/3.0/us/' },
      { llicenciaUrl: 'http://creativecommons.org/licenses/by/3.0/us/' },
      { llicenciaUrl: 'https://creativecommons.org/licenses/by/3.0/us' },
      { llicenciaUrl: 'https://creativecommons.org/licenses/by/3.0/us/?x=1' },
      { llicenciaUrl: 'https://creativecommons.org/licenses/by/3.0/us/#x' },
      { llicenciaUrl: 'https://creativecommons.org/licenses/by/3.0/us/deed.ca' },
      { llicenciaUrl: 'https://creativecommons.org.evil.test/licenses/by/3.0/us/' },
      { llicencia: 'CC-BY-3.0' },
      { llicencia: 'CC-BY-SA-3.0' },
      { llicencia: 'CC-BY-SA-3.0-US' },
      { llicencia: 'CC-BY-4.0-US' },
      { llicencia: 'CC-BY-3.0-ES' },
      { llicencia: 'CC-BY-3.0-us' },
      { llicencia: 'CC-BY-3.0-US ' },
      { llicencia: 'CC-BY-3.0-US\n' },
      { estatVisual: 'pendent' },
      { autor: '' },
      { titolImatge: ' ' },
      { tipusImatge: 'desconegut' },
      { urlOrigen: 'https://commons.wikimedia.org/wiki/Olea_europaea' },
      { urlOrigen: 'https://example.org/wiki/File:Prova.webp' },
      { urlOrigen: 'https://persona@commons.wikimedia.org/wiki/File:Prova.webp' },
      { urlOrigen: 'http://commons.wikimedia.org/wiki/File:Prova.webp' },
      { verificadors: ['Claude', 'Codex', 'Gemini Carbon'] }
    ];
    for (const canvi of rebutjos) {
      expect(potMostrarVariantBotanica({ ...fotografia, ...canvi }), JSON.stringify(canvi)).toBe(false);
    }
    for (const llicencia of ['CC-BY-3.0', 'CC-BY-SA-4.0']) {
      const ruta = llicencia === 'CC-BY-3.0' ? 'by/3.0' : 'by-sa/4.0';
      expect(potMostrarVariantBotanica({
        ...fotografia, llicencia, llicenciaUrl: `https://creativecommons.org/licenses/${ruta}/`
      })).toBe(true);
    }
  });

  test('detecta regressions morfològiques i barbarismes coneguts', () => {
    const barbarismes = /\b(?:lanceolol\p{L}*|llanceol\p{L}*|buidrat|tetracheni|tetracopa|baquerí|grogossos)\b/iu;
    const errorsPerTaxo = {
      'Olea europaea': /\baltern\p{L}*|serrat\p{L}*|pentàmer\p{L}*|al voltant del tàlem/iu,
      'Ceratonia siliqua': /\bbipinn\p{L}*|serrat\p{L}*/iu,
      'Prunus dulcis': /\bcapçud\p{L}*/iu,
      'Quercus ilex': /\bdioic\p{L}*/iu,
      'Ficus carica': /\bsíliqu\p{L}*/iu,
      'Punica granatum': /\bcàpsul\p{L}*/iu,
      'Ocimum basilicum': /\baquen\p{L}*/iu
    };
    for (const [id, { binomiNet, morfologiaDoctoralCa }] of llista) {
      expect(morfologiaDoctoralCa, id).not.toMatch(barbarismes);
      if (errorsPerTaxo[binomiNet]) expect(morfologiaDoctoralCa, id).not.toMatch(errorsPerTaxo[binomiNet]);
      for (const tret of trets[binomiNet] ?? []) expect(morfologiaDoctoralCa, id).toMatch(tret);
    }
  });

  test('els WebP documentals d’arbres pertanyen a l’id de la fitxa i són llegibles', () => {
    const rutes = new Set();
    for (const arbre of ARBRES_MONUMENTALS_2020) {
      expect(arbre.especieCientifica).toMatch(/^\p{Lu}\p{L}+\s+\p{Ll}\p{L}+/u);
      for (const [camp, sufix] of [['foto2007', '2007'], ['fotoDetall2007', 'detall-2007'], ['foto2020', '2020']]) {
        const src = arbre.fotos[camp];
        if (!src) continue;
        expect(src).toBe(`${directori}/arbres-2020/${arbre.id}-${sufix}.webp`);
        const mida = midesWebp(readFileSync(resolve(arrelPublica, `.${src}`)));
        expect(mida?.ample, src).toBeGreaterThan(0);
        expect(mida?.alt, src).toBeGreaterThan(0);
        rutes.add(src);
      }
    }
    const fitxers = readdirSync(resolve(arrelPublica, `.${directori}/arbres-2020`)).filter((f) => f.endsWith('.webp'));
    expect([...rutes].sort()).toEqual(fitxers.map((f) => `${directori}/arbres-2020/${f}`).sort());
  });

  test('l’índex de làmines només té una entrada dinàmica des del codi de producció', () => {
    const fitxers = readdirSync('src', { recursive: true }).filter((f) => /\.[jt]sx?$/u.test(f) && !/\.test\./u.test(f));
    const imports = fitxers.flatMap((f) => {
      const codi = readFileSync(resolve('src', f), 'utf8');
      return /['"][^'"]*\/laminesBotaniquesNode0\.js['"]/u.test(codi) ? [[f, codi]] : [];
    });
    expect(imports.map(([f]) => f)).toEqual(['sections/patrimoni/useLaminesBotaniquesNode0.js']);
    expect(imports[0][1]).toMatch(/import\('\.\.\/\.\.\/data\/patrimoni\/laminesBotaniquesNode0\.js'\)/u);
  });
});
