// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';
import { afterEach, describe, expect, test, vi } from 'vitest';
import fotosParroquiaPrivades, {
  BANDERA_FOTOS_PARROQUIA, ID_FOTOS_BUIDES, MODUL_FOTOS_PARROQUIA, RECURS_FOTO_ORIGINAL
} from '../../../tooling/vite/fotos-parroquia-privades.mjs';
import { fotoDeProducteParroquia, indexFotosParroquia } from './parroquiaFotos.js';
import { llavorLaParroquiaR14 } from '../../apps/bar/llavors/laParroquia.js';
import { imatgeDe } from '../../apps/bar/vistes/vestits.js';

/* Ordre del Mestre 261109 · R15a (PRIV-01..03, R15A-PAQ-01/02) · Els 397 bitmaps
   no són al repositori (.gitignore): només en local, per als builds opt-in. El
   manifest sí que es versiona i es prova sencer; dels bitmaps, només que, si hi
   són en local, quadren byte a byte amb el manifest. */
const CARPETA = 'src/assets/bar/parroquia';
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const locals = () => (existsSync(CARPETA) ? readdirSync(CARPETA).filter((nom) => !nom.startsWith('.')).sort() : []);

describe('Authorized original La Parròquia photos', () => {
  test('398 original records name 397 content-addressed bitmaps, with complete lineage; local bitmaps, if any, match byte for byte', () => {
    const index = indexFotosParroquia();
    expect(index.imatges).toHaveLength(398);
    const assets = new Map(index.imatges.map((image) => [image.fitxer, image]));
    expect(assets.size).toBe(397);
    expect(index.resum).toMatchObject({ bitmapsOriginals: 398, assetsUnics: 397 });
    expect(index.resum.bytesOriginals).toBe(index.imatges.reduce((total, image) => total + image.bytes, 0));
    for (const [file, image] of assets) {
      expect(file).toMatch(/^p-[a-f0-9]{64}\.(?:jpg|png|webp)$/);
      expect(file.slice(2, 66)).toBe(image.sha256);
      expect(Number.isInteger(image.bytes) && image.bytes > 0).toBe(true);
      expect(image.transformacio).toBe('cap_copia_exacta');
      expect(image.rutaOriginal).toBeTruthy();
    }
    const presents = locals();
    // Cap fitxer local fora del manifest: la carpeta només pot portar els originals autoritzats.
    expect(presents.filter((file) => !assets.has(file))).toEqual([]);
    for (const file of presents) {
      const bytes = readFileSync(path.join(CARPETA, file));
      expect(sha256(bytes), file).toBe(assets.get(file).sha256);
      expect(bytes.byteLength, file).toBe(assets.get(file).bytes);
    }
    // La URL només existix per als bitmaps presents en local.
    const presentSet = new Set(presents);
    for (const image of index.imatges) expect(Boolean(image.url), image.fitxer).toBe(presentSet.has(image.fitxer));
    process.stdout.write(`Parròquia · bitmaps en local: ${presents.length}/397 (fora del repositori).\n`);
  });

  test('existing map is reconciled exactly; missing and three historically uncertain associations remain identified', () => {
    const index = indexFotosParroquia();
    expect(index.associacions).toHaveLength(199);
    expect(index.resum.estatsMapa).toEqual({ disponible: 188, pendent_confirmacio_semantica: 3, pendent_font: 8 });
    const calamar = index.associacions.find((a) => a.destiOrigen === 'plats-combinats/plat-de-calamar-a-la-planxa');
    expect(calamar).toMatchObject({ estat: 'disponible', metode: 'nom_fitxer_i_categoria_exactes' });
    expect(calamar.rutaOriginal).toContain('/M1-Plats/');
    const fitxers = new Set(index.imatges.map((image) => image.fitxer));
    expect(index.associacions.filter((a) => a.estat === 'disponible').every((a) => fitxers.has(a.fitxer))).toBe(true);
  });

  test('the actual seed shows exact-match photos only for local bitmaps and retains product IDs in UniversalItemCataleg', async () => {
    const { carta } = await llavorLaParroquiaR14();
    const presents = new Set(locals());
    const bombo = carta.productes.find((p) => p.id === 'bombo');
    const ambFoto = carta.productes.filter((p) => p.imatge.origen === 'corpus-parroquia');
    const fitxerDe = new Map(indexFotosParroquia().imatges.map((image) => [image.sha256, image.fitxer]));
    // Cada foto que la llavor mostra és un original present en local, amb la seua URL.
    for (const producte of ambFoto) {
      expect(presents.has(fitxerDe.get(producte.imatge.sha256)), producte.id).toBe(true);
      expect(producte.imatge.url, producte.id).toBeTruthy();
      expect(imatgeDe(producte)).toBe(producte.imatge.url);
    }
    expect(carta.fotosParroquia.productesAmbFoto).toBe(ambFoto.length);
    if (presents.size === 397) {
      expect(bombo.imatge).toMatchObject({ estat: 'definitiva', origen: 'corpus-parroquia' });
      expect(bombo.imatge.rutaOriginal).toContain('/B1-Cafeteria/cafeteria-bombo.jpg');
      expect(imatgeDe(bombo)).toBe(bombo.imatge.url);
      expect(carta.fotosParroquia.productesAmbFoto).toBeGreaterThanOrEqual(188);
    }
    if (presents.size === 0) {
      expect(ambFoto).toEqual([]);
      expect(bombo.imatge.origen).not.toBe('corpus-parroquia');
    }
    process.stdout.write(`Parròquia originals: ${carta.fotosParroquia.productesAmbFoto}/327 productes amb foto exacta; 398 registres, 397 bitmaps únics, ${presents.size} en local.\n`);
    expect(carta.itemsCataleg.map((item) => item.id)).toEqual(carta.productes.map((p) => p.id));
    expect(new Set(carta.itemsCataleg.map((item) => item.id)).size).toBe(327);
    expect(carta.itemsCataleg[0]).toMatchObject({ id: bombo.id, tipus: 'producte', font: { document: '¡¡¡TPV/export_items.csv', sha256: '3a9843712130bdcf7adeea8ab54e675b2af645b9e41a3e1953e4dd0681fc359e' } });
    expect(carta.itemsCataleg[0].dades.variants).toEqual(bombo.variants);
    for (const mapping of indexFotosParroquia().associacions.filter((a) => a.confirmacioPendent)) {
      const producte = carta.productes.find((p) => `${p.categoriaOrigenId}/${p.imatge.slug}` === mapping.destiOrigen);
      expect(producte).toBeTruthy();
      expect(fotoDeProducteParroquia(producte)).toBeNull();
    }
  });

  test('unmatched names never acquire a guessed photo and original-photo URLs cannot redirect elsewhere', () => {
    const image = indexFotosParroquia().imatges[0];
    expect(fotoDeProducteParroquia({ categoriaId: 'tapes', categoriaHostaleria: 'M4', imatge: { slug: 'no-coincidix-amb-cap-foto' }, variants: [] })).toBeNull();
    expect(imatgeDe({ imatge: { estat: 'definitiva', origen: 'corpus-parroquia', sha256: image.sha256, url: '//invalid.example/photo.jpg' } })).toBeUndefined();
    expect(imatgeDe({ imatge: { estat: 'definitiva', origen: 'corpus-parroquia', sha256: image.sha256, url: 'data:text/html;base64,AAAA' } })).toBeUndefined();
  });

  test('the repository never carries the bitmaps: the folder is ignored and nothing under it is versioned', (context) => {
    expect(readFileSync('.gitignore', 'utf8')).toMatch(/^\/src\/assets\/bar\/parroquia\/$/m);
    if (spawnSync('git', ['--version']).status !== 0) { context.skip(); return; }
    const fitxers = [...new Set(indexFotosParroquia().imatges.map((image) => image.fitxer))];
    const ignorats = spawnSync('git', ['check-ignore', '--no-index', '--stdin'], { input: fitxers.map((file) => `${CARPETA}/${file}`).join('\n') });
    expect(ignorats.stdout.toString().trim().split('\n')).toHaveLength(397);
    const privats = ['_wiki_de_poble/90_arxiu_historic/2026-11/08/foto.jpg',
      '_wiki_de_poble/04_escriptori/01_produccio/261107_1615_captura_supabase_sessions_origen_entrada_reals.jpg',
      '_wiki_de_poble/04_escriptori/01_produccio/261108_1406_captura_notes_enganxar_text_brut_h1_entradilla_cos_netejar_format.jpg'];
    for (const cami of privats) expect(spawnSync('git', ['check-ignore', '--no-index', '-q', cami]).status, cami).toBe(0);
    // La glob de parroquiaFotos.js no troba res en un clon: cap fitxer de la carpeta és a l'índex.
    const versionats = spawnSync('git', ['ls-files', '--', CARPETA]);
    if (versionats.status === 0) expect(versionats.stdout.toString().trim()).toBe('');
  });
});

/* El connector de tooling/vite/fotos-parroquia-privades.mjs, als tres builds
   (web, natiu i autònom). Les proves de build usen un projecte de prova amb un
   bitmap sintètic present i la mateixa guarda que src/apps/plataforma/menjarIBeure.js:
   sense el connector, el bitmap s'emet (el defecte de PRIV-01); amb el connector,
   no, i l'opt-in continua funcionant. */
describe('Public builds never emit the local La Parròquia photos (tooling/vite/fotos-parroquia-privades.mjs)', () => {
  const temporals = [];
  afterEach(() => {
    vi.unstubAllEnvs();
    while (temporals.length) rmSync(temporals.pop(), { recursive: true, force: true });
  });
  const envBuit = () => {
    const carpeta = mkdtempSync(path.join(tmpdir(), 'sdp-fotos-env-'));
    temporals.push(carpeta);
    return carpeta;
  };

  const guardaReal = () => {
    const font = readFileSync('src/apps/plataforma/menjarIBeure.js', 'utf8');
    const guarda = /const carregaFotos = import\.meta\.env\.DEV \|\| import\.meta\.env\.VITE_SDP_BAR_LLAVOR_LA_PARROQUIA === '1'\s*\? \(\) => import\('\.\.\/\.\.\/data\/menjarIBeure\/parroquiaFotos\.js'\)\s*: null;/.exec(font);
    expect(guarda, 'la guarda de menjarIBeure.js').toBeTruthy();
    return guarda[0];
  };

  function projecte({ bandera } = {}) {
    const arrel = mkdtempSync(path.join(tmpdir(), 'sdp-fotos-parroquia-'));
    temporals.push(arrel);
    const dades = path.join(arrel, 'src/data/menjarIBeure');
    const fotos = path.join(arrel, 'src/assets/bar/parroquia');
    const plataforma = path.join(arrel, 'src/apps/plataforma');
    for (const carpeta of [dades, fotos, plataforma]) mkdirSync(carpeta, { recursive: true });
    // Més de 4 KB: per davall, Vite l'incrustaria com a data: en lloc d'emetre'l.
    const bytes = Buffer.concat([Buffer.from('sdp-foto-sintetica-parroquia'), Buffer.alloc(8192, 0x5a)]);
    const sha = sha256(bytes);
    const fitxer = `p-${sha}.jpg`;
    writeFileSync(path.join(fotos, fitxer), bytes);
    copyFileSync('src/data/menjarIBeure/parroquiaFotos.js', path.join(dades, 'parroquiaFotos.js'));
    const manifest = { versio: 1, imatges: [{ fitxer, sha256: sha, bytes: bytes.length, categoria: null, nomFitxerOriginal: 'sintetica.jpg',
      rutaOriginal: 'prova/sintetica.jpg', transformacio: 'cap_copia_exacta', publicacioAutoritzada: 'prova' }],
    associacions: [], resum: { bitmapsOriginals: 1, assetsUnics: 1, bytesOriginals: bytes.length } };
    writeFileSync(path.join(dades, 'parroquiaFotos.generated.json'), JSON.stringify(manifest));
    writeFileSync(path.join(plataforma, 'entrada.js'), `${guardaReal()}\nexport function carregaFotosParroquia() { return carregaFotos ? carregaFotos() : null; }\n`);
    writeFileSync(path.join(plataforma, 'api.js'), "export { indexFotosParroquia, fotoDeProducteParroquia, incorporaFotosParroquia } from '../../data/menjarIBeure/parroquiaFotos.js';\n");
    if (bandera) writeFileSync(path.join(arrel, '.env'), `${BANDERA_FOTOS_PARROQUIA}=${bandera}\n`);
    return { arrel, fitxer, sha, manifest, bytes };
  }

  async function compila(arrel, { connector = true, entrada = 'src/apps/plataforma/entrada.js', write = false } = {}) {
    // Un build de producció de veritat (Vitest corre amb NODE_ENV=test, i Vite en trauria DEV=true).
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv(BANDERA_FOTOS_PARROQUIA, undefined);
    const resultat = await build({ configFile: false, root: arrel, envDir: arrel, logLevel: 'silent', mode: 'production', publicDir: false,
      plugins: connector ? [fotosParroquiaPrivades()] : [],
      build: { write, minify: false, outDir: path.join(arrel, 'dist'), emptyOutDir: true,
        rollupOptions: { input: path.join(arrel, entrada), preserveEntrySignatures: 'strict', output: { entryFileNames: '[name].mjs' } } } });
    return Array.isArray(resultat) ? resultat.flatMap((r) => r.output) : resultat.output;
  }

  const codiDe = (eixida) => eixida.filter((o) => o.type === 'chunk').map((o) => o.code).join('\n');
  const fotosDe = (eixida) => eixida.filter((o) => RECURS_FOTO_ORIGINAL.test(o.fileName));

  test('control: without the plugin the dead import() still emits the local bitmap (the PRIV-01 defect)', async () => {
    const { arrel, sha } = projecte();
    const eixida = await compila(arrel, { connector: false });
    expect(fotosDe(eixida).map((o) => o.fileName)).toEqual([expect.stringMatching(new RegExp(`^assets/p-${sha}-[\\w-]+\\.jpg$`))]);
  }, 60000);

  test('public build: no bitmap, no manifest, no import() of the photos', async () => {
    const { arrel, sha } = projecte();
    const eixida = await compila(arrel);
    expect(fotosDe(eixida)).toEqual([]);
    expect(eixida.filter((o) => o.type === 'asset')).toEqual([]);
    expect(eixida.filter((o) => o.type === 'chunk')).toHaveLength(1);
    const codi = codiDe(eixida);
    expect(codi).toContain('carregaFotosParroquia');
    expect(codi).not.toContain('import(');
    expect(codi).not.toContain(sha);
    expect(codi).not.toContain('bitmapsOriginals');
  }, 60000);

  test('opt-in build (VITE_SDP_BAR_LLAVOR_LA_PARROQUIA=1) still carries the photos', async () => {
    const { arrel, sha } = projecte({ bandera: '1' });
    const eixida = await compila(arrel);
    const [foto] = fotosDe(eixida);
    expect(foto?.fileName).toMatch(new RegExp(`^assets/p-${sha}-`));
    expect(codiDe(eixida)).toContain(foto.fileName);
  }, 60000);

  test('the virtual module keeps the API: manifest without URLs, no product photo, the menu untouched', async () => {
    const { arrel, manifest } = projecte();
    const eixida = await compila(arrel, { entrada: 'src/apps/plataforma/api.js', write: true });
    expect(fotosDe(eixida)).toEqual([]);
    const codi = codiDe(eixida);
    expect(codi).not.toMatch(/data:image|import\.meta\.glob/);
    const api = await import(/* @vite-ignore */ pathToFileURL(path.join(arrel, 'dist/api.mjs')).href);
    const index = api.indexFotosParroquia();
    expect(index).toEqual(manifest);
    expect(index.imatges.every((image) => !('url' in image))).toBe(true);
    expect(api.fotoDeProducteParroquia({ categoriaId: 'cafeteria', imatge: { slug: 'sintetica' }, variants: [] })).toBeNull();
    const carta = { productes: [{ id: 'bombo', imatge: { slug: 'bombo', estat: 'marcador' } }] };
    expect(api.incorporaFotosParroquia(carta)).toBe(carta);
  }, 60000);

  test('hooks: resolveId and load only in a public build; the flag becomes a literal only when building', async () => {
    const arrel = path.resolve('.');
    const desti = path.join(arrel, MODUL_FOTOS_PARROQUIA).split(path.sep).join('/');
    const importador = path.join(arrel, 'src/apps/plataforma/menjarIBeure.js');
    const context = { resolve: async (font) => ({ id: font.endsWith('parroquiaFotos.js') ? desti : path.join(arrel, 'src/data/menjarIBeure/parroquiaFotos.generated.json') }) };
    const connector = (env, command = 'build', mode = 'production') => {
      vi.stubEnv(BANDERA_FOTOS_PARROQUIA, env.bandera);
      const plugin = fotosParroquiaPrivades();
      const config = plugin.config({ root: arrel, envDir: envBuit() }, { mode, command });
      plugin.configResolved({ root: arrel, env: { DEV: env.DEV } });
      return { plugin, config };
    };
    const publica = connector({ DEV: false, bandera: undefined });
    expect(publica.plugin.enforce).toBe('pre');
    expect(publica.config).toEqual({ define: { 'import.meta.env.VITE_SDP_BAR_LLAVOR_LA_PARROQUIA': '""' } });
    expect(await publica.plugin.resolveId.call(context, '../../data/menjarIBeure/parroquiaFotos.js', importador, {})).toBe(ID_FOTOS_BUIDES);
    expect(await publica.plugin.resolveId.call(context, './parroquiaFotos.generated.json', importador, {})).toBeNull();
    expect(await publica.plugin.resolveId.call(context, './mercadona.js', importador, {})).toBeNull();
    const buit = publica.plugin.load(ID_FOTOS_BUIDES);
    expect(buit).toMatch(/export function indexFotosParroquia\(\)/);
    expect(buit).toMatch(/export function fotoDeProducteParroquia\(\) \{ return null; \}/);
    expect(buit).toMatch(/export function incorporaFotosParroquia\(carta\) \{ return carta; \}/);
    expect(buit).not.toMatch(/import\.meta\.glob|assets\/bar/);
    expect(publica.plugin.load(desti)).toBe(buit);
    expect(publica.plugin.load(`${desti}?import`)).toBe(buit);
    expect(publica.plugin.load(path.join(arrel, 'src/data/menjarIBeure/mercadona.js'))).toBeNull();
    for (const inactiu of [connector({ DEV: true, bandera: undefined }), connector({ DEV: false, bandera: '1' })]) {
      expect(await inactiu.plugin.resolveId.call(context, '../../data/menjarIBeure/parroquiaFotos.js', importador, {})).toBeNull();
      expect(inactiu.plugin.load(ID_FOTOS_BUIDES)).toBeNull();
      expect(inactiu.plugin.load(desti)).toBeNull();
    }
    expect(connector({ DEV: false, bandera: '1' }).config).toEqual({ define: { 'import.meta.env.VITE_SDP_BAR_LLAVOR_LA_PARROQUIA': '"1"' } });
    // Desenvolupament i Vitest: cap define, perquè vi.stubEnv continue governant la bandera.
    expect(connector({ DEV: true, bandera: undefined }, 'serve', 'development').config).toBeNull();
  });

  test('the bundle gate fails a public build that would still carry an original photo', () => {
    vi.stubEnv(BANDERA_FOTOS_PARROQUIA, undefined);
    const plugin = fotosParroquiaPrivades();
    plugin.config({ root: '.', envDir: envBuit() }, { mode: 'production', command: 'build' });
    plugin.configResolved({ root: path.resolve('.'), env: { DEV: false } });
    const context = { error: (missatge) => { throw new Error(missatge); } };
    const foto = `assets/p-${'a'.repeat(64)}-Bx9_k2Lq.jpg`;
    expect(() => plugin.generateBundle.call(context, {}, { [foto]: {}, 'assets/index-Bx9_k2Lq.js': {} })).toThrow(/fotos originals de La Parròquia/);
    expect(() => plugin.generateBundle.call(context, {}, { 'assets/p-curt-Bx9_k2Lq.jpg': {}, 'assets/index-Bx9_k2Lq.js': {} })).not.toThrow();
  });

  test('the three public configs (web, native, standalone) mount the plugin', () => {
    for (const config of ['vite.config.js', 'vite.natiu.config.js', 'vite.standalone.config.js']) {
      const font = readFileSync(config, 'utf8');
      expect(font, config).toContain("import fotosParroquiaPrivades from './tooling/vite/fotos-parroquia-privades.mjs';");
      expect(font.slice(font.indexOf('plugins: ['), font.indexOf('plugins: [') + 600), config).toContain('fotosParroquiaPrivades(),');
    }
  });
});
