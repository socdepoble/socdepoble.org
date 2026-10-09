// @vitest-environment node
/* Les portes del cofre xifrat (Onada 6, ordre del Mestre, 261009): el seu
   bloc CSS a modules.css amb només tokens declarats, cada classe del JSX amb
   regla, i la higiene criptogràfica per text: cap clau exportada, cap
   generació ni desembolcallat fora del nucli, cap traça a la consola, cap
   canal entre pestanyes ni de xarxa, IndexedDB només al magatzem i el nucli
   pur. ESLint i les regles generals de Pedra Seca ja les passa
   gestoria/qualitat.test.js, que llig tot el carril. Els patrons es componen
   a trossos perquè les portes que llegixen src/ no els troben ací. */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const CARRIL = 'src/sections/gestoria/cofre';
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');

function fitxersDe(directori) {
  const fitxers = [];
  for (const entrada of readdirSync(path.join(ARREL, directori), { withFileTypes: true })) {
    const ruta = `${directori}/${entrada.name}`;
    if (entrada.isDirectory()) fitxers.push(...fitxersDe(ruta));
    else if (/\.jsx?$/.test(entrada.name)) fitxers.push(ruta);
  }
  return fitxers.sort();
}
const TOTS = fitxersDe(CARRIL);
const PRODUCCIO = TOTS.filter((f) => !/\.test\.jsx?$/.test(f));
const JSX = PRODUCCIO.filter((f) => f.endsWith('.jsx'));
const senseComentaris = (codi) => codi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const MARCA = '/* ── GESTORIA COFRE (261009) ── */';
function blocCofre() {
  const css = llig('src/css/modules.css');
  const inici = css.indexOf(MARCA);
  expect(inici, 'falta el bloc del cofre a modules.css').toBeGreaterThan(-1);
  expect(css.indexOf(MARCA, inici + 1), 'el marcador ha de ser únic').toBe(-1);
  const obri = css.indexOf('{', inici);
  let profunditat = 0;
  for (let i = obri; i < css.length; i++) {
    if (css[i] === '{') profunditat += 1;
    if (css[i] === '}') profunditat -= 1;
    if (profunditat === 0) return css.slice(inici, i + 1);
  }
  throw new Error('El bloc del cofre no es tanca.');
}

describe('el cens', () => {
  test('el nucli, el magatzem, l’autobloqueig, el cofre, el hook i la porta, cadascun amb prova (el hook, a través de la porta)', () => {
    expect(PRODUCCIO).toEqual([
      `${CARRIL}/PortaCofre.jsx`, `${CARRIL}/autobloqueig.js`, `${CARRIL}/cofre.js`, `${CARRIL}/magatzemCofre.js`,
      `${CARRIL}/nucli/cripto.js`, `${CARRIL}/useCofre.js`
    ]);
    const parelles = [
      ['PortaCofre.jsx', 'PortaCofre.test.jsx'], ['autobloqueig.js', 'autobloqueig.test.js'], ['cofre.js', 'cofre.test.js'],
      ['magatzemCofre.js', 'magatzemCofre.test.js'], ['nucli/cripto.js', 'nucli/cripto.test.js'], ['useCofre.js', 'PortaCofre.test.jsx']
    ];
    expect(parelles.map(([font]) => `${CARRIL}/${font}`).sort()).toEqual(PRODUCCIO);
    for (const [font, prova] of parelles) {
      expect(TOTS, font).toContain(`${CARRIL}/${prova}`);
      const base = font.split('/').at(-1).replace(/\.jsx?$/, '');
      expect(llig(`${CARRIL}/${prova}`), `${prova} no importa ${font}`).toMatch(new RegExp(`from '\\./(?:nucli/)?${base}\\.jsx?'`));
    }
  });
});

describe('CSS del cofre', () => {
  test('una capa components, amb només tokens declarats, sense fallback ni ombres', () => {
    const bloc = blocCofre();
    expect(bloc).toMatch(/^\/\* ── GESTORIA COFRE \(261009\) ── \*\/\n@layer components \{/);
    const tokens = llig('src/css/tokens.css');
    const usats = [...new Set([...bloc.matchAll(/var\((--[\w-]+)([^)]*)\)/g)].map((m) => {
      expect(m[2], `fallback a ${m[1]}`).toBe('');
      return m[1];
    }))];
    expect(usats.length).toBeGreaterThan(10);
    expect(usats.filter((t) => !new RegExp(`${t}\\s*:`).test(tokens))).toEqual([]);
    expect(bloc).not.toMatch(/box-shadow|#[0-9a-fA-F]{3,8}\b|rgba?\(|--sdp-(?:pedra|error|avis|exit)-\d|\{\s*\}|:hover/);
  });

  test('rem en múltiples de 0,25, lletra de la seua escala, radis amb token i outline només amb :focus-visible', () => {
    const bloc = blocCofre().replace(/\/\*[\s\S]*?\*\//g, '');
    for (const [, valor] of bloc.matchAll(/(\d*\.?\d+)rem/g)) expect(Number(valor) % 0.25, `${valor}rem`).toBe(0);
    for (const [, valor] of bloc.matchAll(/font-size:\s*([^;]+);/g)) {
      expect(['var(--sdp-text-small)', 'var(--sdp-text-base)', 'var(--sdp-text-h4)', 'var(--sdp-text-h5)']).toContain(valor.trim());
    }
    for (const [, valor] of bloc.matchAll(/border-radius:\s*([^;]+);/g)) expect(valor.trim()).toMatch(/^var\(--sdp-radi-[a-z]+\)$/);
    for (const [, selector] of bloc.matchAll(/([^{}]+)\{[^{}]*outline:/g)) {
      for (const part of selector.split(',')) expect(part.trim(), 'outline sense :focus-visible').toMatch(/:focus-visible$/);
    }
  });

  test('tota classe del JSX té regla: la pròpia al bloc del cofre i la resta al full canònic', () => {
    const bloc = blocCofre();
    const canonic = ['components.css', 'modules.css'].map((f) => llig(`src/css/${f}`)).join('\n');
    const classes = [...new Set(JSX.flatMap((fitxer) => [...llig(fitxer).matchAll(/className="([^"]+)"/g)]
      .flatMap(([, valor]) => valor.split(/\s+/).filter(Boolean))))];
    expect(classes.length).toBeGreaterThan(8);
    for (const classe of classes) {
      expect(classe, `${classe} sense prefix`).toMatch(/^sdp-/);
      const propia = classe.startsWith('sdp-gestoria-cofre');
      expect(new RegExp(`\\.${classe}(?![\\w-])`).test(propia ? bloc : canonic), `.${classe} no té regla`).toBe(true);
    }
    // Les pròpies del bloc, totes en ús: cap regla òrfena.
    const delBloc = [...new Set([...bloc.matchAll(/\.(sdp-gestoria-cofre[\w-]*)/g)].map((m) => m[1]))];
    expect(delBloc.filter((classe) => !classes.includes(classe))).toEqual([]);
  });
});

describe('higiene criptogràfica', () => {
  test('cap clau exportada; generar i desembolcallar claus, només al nucli', () => {
    const exporta = new RegExp(['export', 'Key\\s*\\('].join(''));
    const genera = new RegExp(['generate', 'Key\\s*\\(|unwrap', 'Key\\s*\\(|wrap', 'Key\\s*\\(|derive', '(?:Key|Bits)\\s*\\('].join(''));
    for (const fitxer of PRODUCCIO) {
      const codi = senseComentaris(llig(fitxer));
      expect(exporta.test(codi), `${fitxer}: exporta una clau`).toBe(false);
      if (fitxer !== `${CARRIL}/nucli/cripto.js`) expect(genera.test(codi), `${fitxer}: maneja claus fora del nucli`).toBe(false);
    }
    // Al nucli, una sola clau extraïble (la DEK nova, per a embolcallar-la) i el desembolcallat extraïble només a petició.
    const nucli = senseComentaris(llig(`${CARRIL}/nucli/cripto.js`));
    expect(nucli.match(/,\s*true,\s*\[/g)).toHaveLength(1);
    expect(nucli).toContain("{ extraible = false } = {}");
    expect(nucli).toContain("{ name: 'AES-KW', length: 256 }, false, ['wrapKey', 'unwrapKey']");
  });

  test('cap traça a la consola, ni xarxa, ni canal entre pestanyes, ni emmagatzematge fora del magatzem', () => {
    const vetats = [
      [/\bconsole\s*\./, 'consola'],
      [new RegExp(['\\bfet', 'ch\\s*\\(|XMLHttp', 'Request|WebSo', 'cket|EventSo', 'urce|sendBea', 'con'].join('')), 'xarxa'],
      [new RegExp(['Broadcast', 'Channel|post', 'Message|Shared', 'Worker'].join('')), 'canal'],
      [new RegExp(['\\blocal', 'Storage|\\bsession', 'Storage|document\\.coo', 'kie|\\bcaches\\.'].join('')), 'emmagatzematge'],
      [/\bhttps?:\/\//, 'URL'],
      [/\bdebugger\b/, 'debugger']
    ];
    for (const fitxer of PRODUCCIO) {
      const codi = llig(fitxer);
      for (const [patro, que] of vetats) expect(patro.test(codi), `${fitxer}: ${que}`).toBe(false);
    }
    const idb = new RegExp(['\\bindexed', 'DB\\b'].join(''));
    expect(PRODUCCIO.filter((fitxer) => idb.test(llig(fitxer)))).toEqual([`${CARRIL}/magatzemCofre.js`]);
  });

  test('el nucli és pur: sense globals, DOM, React ni imports', () => {
    const nucli = senseComentaris(llig(`${CARRIL}/nucli/cripto.js`));
    expect(nucli).not.toMatch(/\b(?:globalThis|window|document|navigator|self)\b|import\.meta|\bimport\b|\brequire\s*\(/);
  });
});
