/* Gauntlet Loop 261029 (cicle 1, P1-71) · Una instància nova d'un mòdul de
   context no en crea cap de nou.

   El defecte. Amb el servidor de Vite engegat, afegir un comentari a
   GraellaAlbumLocal.jsx amb /multimedia obert tombava el Mas sencer a
   l'ErrorBoundary de l'arrel: «useSession ha de ser usat dins de
   SessionProvider». Vite marca a cada edició tots els ascendents del fitxer
   editat, i SessionContext.jsx n'és un de quasi tot (→ backendPort.js →
   host.js → PedraSecaEmbed.jsx → App.jsx). La frontera de React Refresh en
   carregava una instància nova (?t=…) amb un createContext nou: React Refresh
   posava el proveïdor nou a l'arbre muntat, i ProveidorModeracio, que no
   s'havia tornat a executar, llegia el context vell.

   El remei canònic de React Fast Refresh: cada createContext viu en un
   objectesDeContext.js que només importa React. Cap edició de l'App el marca,
   i totes les instàncies d'un .jsx de context fan servir el mateix objecte.
   Esta prova ho comprova de dues maneres:
   · En execució: un segon import del .jsx amb una consulta distinta
     (`?instancia=hmr`) és una instància nova del mòdul, com la que servix
     Vite amb un ?t= nou, i els seus ganxos han de vore el proveïdor de la
     primera.
   · En la font: cap ascendent de l'App (src/app/App.jsx) no crida
     createContext, llevat d'un mòdul que només exporta components (React
     Refresh hi canvia el proveïdor i els consumidors alhora); els
     objectesDeContext.js no importen res més que React, i només els importa
     el .jsx del seu context.
   En producció no hi ha HMR: res d'açò canvia el paquet. */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

/* La sessió, simulada com a barraSenseProveidors.test.jsx: ningú dins. Sense
   compte, IdentitatProvider no crida el port. */
vi.mock('../../data/sessionService.js', () => ({
  getSessionState: () => ({ usuari: null, estat: 'fora', rol: null, generacio: 1, nivell: null }),
  subscribeSession: () => () => {},
  setSessionConfig: () => () => {},
  renovaAra: () => {}
}));
vi.mock('../../data/autodesament/sessio.js', () => ({
  reprenSessio: () => {},
  eixDeLaSessio: async () => {},
  preparaEixida: async () => ({ pendents: [] })
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
const CONFIG = Object.freeze({ supabaseUrl: 'https://poble.test', supabaseAnonKey: 'anon', tenantId: '00000000-0000-4000-8000-000000000000' });

/* Cada objectesDeContext.js, el .jsx que l'importa i els objectes que en pren. */
const PROPIETARIS = Object.freeze({
  'src/app/contexts/objectesDeContext.js': {
    'src/app/contexts/SessionContext.jsx': ['SessionContext'],
    'src/app/contexts/IdentitatContext.jsx': ['IdentitatContext'],
    'src/app/contexts/CoreContentContext.jsx': ['CoreContentContext'],
    'src/app/contexts/UIContext.jsx': ['UIActionsContext', 'UIContext'],
    'src/app/contexts/RouterContext.jsx': ['RouteParamsContext', 'RouterContext', 'RouterPrefixContext']
  },
  'src/sections/xat/objectesDeContext.js': { 'src/sections/xat/XatContext.jsx': ['XatContext'] },
  'src/sections/mur/objectesDeContext.js': { 'src/sections/mur/MurContext.jsx': ['MurContext'] },
  'src/sections/multimedia/objectesDeContext.js': { 'src/sections/multimedia/MultimediaContext.jsx': ['MultimediaContext'] },
  'src/sections/notes/objectesDeContext.js': {
    'src/sections/notes/NotesContext.jsx': ['NotesContext'],
    'src/sections/notes/NotesDataContext.jsx': ['NotesDataContext']
  },
  'src/sections/profile/objectesDeContext.js': { 'src/sections/profile/PerfilContext.jsx': ['PerfilContext'] },
  'src/sections/consola/objectesDeContext.js': { 'src/sections/consola/peces.jsx': ['PrivacitatConsola'] },
  'src/apps/plataforma/objectesDeContext.js': { 'src/apps/plataforma/PlataformaContext.jsx': ['RegistreContext'] }
});

describe('en execució · dues instàncies d’un mòdul de context comparteixen el context', () => {
  test('SessionContext.jsx: useSession() de la instància nova veu el SessionProvider de la vella', async () => {
    const vella = await import('./SessionContext.jsx');
    const nova = await import('./SessionContext.jsx?instancia=hmr');
    expect(nova, 'sanitat: la consulta ha de donar una instància nova del mòdul').not.toBe(vella);
    expect(nova.useSession).not.toBe(vella.useSession);
    const vist = {};
    function Sonda() {
      vist.vella = vella.useSessioOpcional();
      vist.nova = nova.useSession();
      return null;
    }
    await act(async () => {
      render(<vella.SessionProvider config={CONFIG}><Sonda /></vella.SessionProvider>);
    });
    expect(vist.nova).toBe(vist.vella);
    expect(vist.nova.estat).toBe('fora');
  });

  test('IdentitatContext.jsx: useIdentitat() de la instància nova veu l’IdentitatProvider de la vella', async () => {
    const sessio = await import('./SessionContext.jsx');
    const vella = await import('./IdentitatContext.jsx');
    const nova = await import('./IdentitatContext.jsx?instancia=hmr');
    expect(nova.useIdentitat).not.toBe(vella.useIdentitat);
    const vist = {};
    function Sonda() {
      vist.vella = vella.useIdentitatOpcional();
      vist.nova = nova.useIdentitat();
      return null;
    }
    await act(async () => {
      render(
        <sessio.SessionProvider config={CONFIG}>
          <vella.IdentitatProvider config={CONFIG}><Sonda /></vella.IdentitatProvider>
        </sessio.SessionProvider>
      );
    });
    expect(vist.nova).toBe(vist.vella);
  });

  test('UIContext.jsx: useUIState() i useUIActions() de la instància nova veuen l’UIProvider de la vella', async () => {
    /* jsdom no porta matchMedia: el doble de UIContext.tema.test.jsx. */
    vi.stubGlobal('matchMedia', vi.fn((query) => ({
      matches: false, media: query, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    })));
    const vella = await import('./UIContext.jsx');
    const nova = await import('./UIContext.jsx?instancia=hmr');
    expect(nova.useUIState).not.toBe(vella.useUIState);
    const vist = {};
    function Sonda() {
      vist.estat = [vella.useUIStateOpcional(), nova.useUIState()];
      vist.accions = [vella.useUIActionsOpcional(), nova.useUIActions()];
      return null;
    }
    await act(async () => {
      render(<vella.UIProvider externalConfig={{}}><Sonda /></vella.UIProvider>);
    });
    expect(vist.estat[1]).toBe(vist.estat[0]);
    expect(vist.accions[1]).toBe(vist.accions[0]);
  });

  test('RouterContext.jsx: useRouter() i useParams() de la instància nova veuen el router de la vella', async () => {
    const vella = await import('./RouterContext.jsx');
    const nova = await import('./RouterContext.jsx?instancia=hmr');
    expect(nova.useRouter).not.toBe(vella.useRouter);
    const vist = {};
    function Sonda() {
      vist.router = [vella.useRouter(), nova.useRouter()];
      vist.params = [vella.useParams(), nova.useParams()];
      return null;
    }
    await act(async () => {
      render(<vella.MemoryRouter rutaInicial="/xat"><Sonda /></vella.MemoryRouter>);
    });
    expect(vist.router[1]).toBe(vist.router[0]);
    expect(vist.params[1]).toBe(vist.params[0]);
  });

  test('els objectes exportats (XatContext, PrivacitatConsola) són el mateix en totes les instàncies', async () => {
    const [xatVell, xatNou, pecesVella, pecesNova] = await Promise.all([
      import('../../sections/xat/XatContext.jsx'),
      import('../../sections/xat/XatContext.jsx?instancia=hmr'),
      import('../../sections/consola/peces.jsx'),
      import('../../sections/consola/peces.jsx?instancia=hmr')
    ]);
    expect(xatNou).not.toBe(xatVell);
    expect(xatNou.XatContext).toBe(xatVell.XatContext);
    expect(pecesNova).not.toBe(pecesVella);
    expect(pecesNova.PrivacitatConsola).toBe(pecesVella.PrivacitatConsola);
  });
});

/* ── En la font ────────────────────────────────────────────────────────────
   El graf d'imports de src/ (sense proves ni __fixtures__), com el veu Vite:
   estàtics, reexportacions, import(), require i import.meta.glob. Els
   comentaris no compten. Un import amb consulta (?raw, ?url…) o un glob amb
   `query` porta el text o l'adreça del fitxer, no l'executa: és una fulla, i
   no fa ascendent de res. */
const senseComentaris = (codi) => codi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const ESPECIFICADOR = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)(['"`])([^'"`\n]+)\1/g;
const GLOB = /\bimport\.meta\.glob(?:Eager)?\s*\(\s*(\[[^\]]*\]|(['"`])[^'"`\n]+\2)\s*(?:,\s*(\{[^}]*\}))?/g;
const LITERAL = /(['"`])([^'"`\n]+)\1/g;
const CODI = /\.(?:[cm]?js|jsx)$/;
const esProva = (ruta) => /\.test\.[cm]?jsx?$/.test(ruta) || ruta.includes('/__fixtures__/');

function fitxersDe(directori) {
  return readdirSync(path.join(ARREL, directori), { withFileTypes: true }).flatMap((entrada) => {
    const ruta = `${directori}/${entrada.name}`;
    if (entrada.isDirectory()) return fitxersDe(ruta);
    return CODI.test(entrada.name) && !esProva(ruta) ? [ruta] : [];
  });
}

/* Un especificador relatiu o amb l'àlies @/ (vite.config.js), des de l'arrel. */
function camiDe(des, especificador) {
  if (especificador.startsWith('@/')) return `src/${especificador.slice(2)}`;
  if (especificador.startsWith('.')) return path.posix.normalize(path.posix.join(path.posix.dirname(des), especificador));
  return null;
}

/* El fitxer de codi d'un especificador, o null: un paquet, una adreça o un
   import amb consulta. */
function resol(des, especificador) {
  if (especificador.includes('?')) return null;
  const base = camiDe(des, especificador);
  if (!base) return null;
  return [base, `${base}.js`, `${base}.jsx`, `${base}.mjs`, `${base}/index.js`, `${base}/index.jsx`]
    .find((candidat) => CODI.test(candidat) && existsSync(path.join(ARREL, candidat))) || null;
}

/* Un patró de glob (*, ** i {a,b}) com a expressió regular sobre el camí. */
const escapa = (text) => text.replace(/[.+^$()|[\]\\]/g, '\\$&');
function globARegex(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    if (glob.startsWith('**/', i)) { re += '(?:.*/)?'; i += 2; }
    else if (glob.startsWith('**', i)) { re += '.*'; i += 1; }
    else if (glob[i] === '*') re += '[^/]*';
    else if (glob[i] === '?') re += '[^/]';
    else if (glob[i] === '{') {
      const fi = glob.indexOf('}', i);
      re += `(?:${glob.slice(i + 1, fi).split(',').map(escapa).join('|')})`;
      i = fi;
    } else re += escapa(glob[i]);
  }
  return new RegExp(`^${re}$`);
}

const FONTS = fitxersDe('src');
const CODIS = new Map(FONTS.map((ruta) => [ruta, senseComentaris(llig(ruta))]));
const especificadorsDe = (codi) => [...codi.matchAll(ESPECIFICADOR)].map((m) => m[2]);

/* Els mòduls que un import.meta.glob executa: els dels patrons positius (FONTS
   ja no porta proves ni __fixtures__); amb `query` o `as`, cap. */
function delGlob(des, patrons, opcions = '') {
  if (/\b(?:query|as)\s*:/.test(opcions)) return [];
  return [...patrons.matchAll(LITERAL)].map((l) => l[2]).filter((p) => !p.startsWith('!'))
    .map((p) => camiDe(des, p)).filter(Boolean)
    .flatMap((cami) => FONTS.filter((ruta) => ruta !== des && globARegex(cami).test(ruta)));
}

const GRAF = new Map(FONTS.map((ruta) => {
  const codi = CODIS.get(ruta);
  const destins = especificadorsDe(codi).map((e) => resol(ruta, e)).filter(Boolean);
  for (const m of codi.matchAll(GLOB)) destins.push(...delGlob(ruta, m[1], m[3]));
  return [ruta, new Set(destins)];
}));

/* Els ascendents d'un fitxer: tot mòdul que hi arriba per imports. */
function ascendentsDe(fitxer) {
  const importadors = new Map();
  for (const [ruta, destins] of GRAF) {
    for (const desti of destins) {
      if (!importadors.has(desti)) importadors.set(desti, []);
      importadors.get(desti).push(ruta);
    }
  }
  const vistos = new Set();
  const pendents = [fitxer];
  while (pendents.length) {
    for (const importador of importadors.get(pendents.pop()) || []) {
      if (!vistos.has(importador)) { vistos.add(importador); pendents.push(importador); }
    }
  }
  return vistos;
}

/* Els noms exportats d'un mòdul (sense comentaris), o '*' per a un `export *`. */
function exportsDe(codi) {
  const noms = [];
  for (const m of codi.matchAll(/\bexport\s+(default\s+)?(?:async\s+)?(?:function\*?|class|const|let|var)\s+([A-Za-z_$][\w$]*)/g)) noms.push(m[2]);
  noms.push(...[...codi.matchAll(/\bexport\s+default\s+(?!(?:async\s+)?(?:function|class)\b)/g)].map(() => 'default'));
  for (const m of codi.matchAll(/\bexport\s*\{([^}]*)\}/g)) {
    noms.push(...m[1].split(',').map((tros) => tros.trim().split(/\s+as\s+/).pop()).filter(Boolean));
  }
  if (/\bexport\s*\*/.test(codi)) noms.push('*');
  return noms;
}
const CREA_CONTEXT = /\bcreateContext\s*\(/;

describe('en la font · els objectes de context viuen fora del cicle de l’App', () => {
  const APP = 'src/app/App.jsx';
  const ascendents = ascendentsDe(APP);

  test('sanitat: el graf es llig i l’App té ascendents (main.jsx, PedraSecaEmbed.jsx)', () => {
    expect(FONTS.length).toBeGreaterThan(500);
    expect(FONTS).toContain(APP);
    expect([...ascendents]).toEqual(expect.arrayContaining(['src/main.jsx', 'src/PedraSecaEmbed.jsx']));
  });

  test('cap ascendent de l’App crida createContext, llevat d’un mòdul que només exporta components', () => {
    const infraccions = [...ascendents].sort().filter((ruta) => CREA_CONTEXT.test(CODIS.get(ruta))).flatMap((ruta) => {
      const noms = exportsDe(CODIS.get(ruta));
      /* Un mòdul que només exporta components és una frontera de React
         Refresh: el proveïdor i els consumidors del seu context intern es
         canvien alhora. Qualsevol altre export (un ganxo, el mateix objecte
         de context, una constant) deixa consumidors lligats al context vell. */
      const nomesComponents = noms.length > 0 && noms.every((nom) => /^[A-Z]/.test(nom))
        && !/\bexport\s+(?:const|let|var)\b/.test(CODIS.get(ruta));
      return nomesComponents ? [] : [`${ruta}: crida createContext i exporta ${noms.filter((n) => !/^[A-Z]/.test(n)).join(', ') || 'objectes'}`];
    });
    expect(infraccions, 'mou el createContext a l’objectesDeContext.js de la carpeta (vegeu src/app/contexts/objectesDeContext.js)').toEqual([]);
  });

  test.each(Object.entries(PROPIETARIS))('%s només importa React i només exporta createContext', (objectes, propietaris) => {
    const codi = CODIS.get(objectes);
    expect(especificadorsDe(codi)).toEqual(['react']);
    expect(ascendents.has(objectes)).toBe(false);
    const declarats = [...codi.matchAll(/^export const ([A-Za-z_$][\w$]*) = createContext\([^\n]*\);$/gm)].map((m) => m[1]).sort();
    expect(declarats).toEqual(Object.values(propietaris).flat().sort());
    expect(exportsDe(codi).sort()).toEqual(declarats);
  });

  test.each(Object.entries(PROPIETARIS))('%s: només l’importen els .jsx del seu context', (objectes, propietaris) => {
    const importadors = FONTS.filter((ruta) => GRAF.get(ruta).has(objectes)).sort();
    expect(importadors).toEqual(Object.keys(propietaris).sort());
  });

  const CASOS = Object.values(PROPIETARIS).flatMap((propietaris) => Object.entries(propietaris));
  test.each(CASOS)('%s pren de objectesDeContext.js %j i no crida createContext', (ruta, noms) => {
    const codi = CODIS.get(ruta);
    expect(CREA_CONTEXT.test(codi)).toBe(false);
    const importacio = codi.match(/\bimport\s*\{([^}]*)\}\s*from\s*'\.\/objectesDeContext\.js'/);
    expect(importacio, `${ruta} no importa de ./objectesDeContext.js`).not.toBeNull();
    expect(importacio[1].split(',').map((n) => n.trim()).filter(Boolean).sort()).toEqual([...noms].sort());
  });
});
