/**
 * vite.modul.config.js — el build d'un mòdul opcional (contracte sdp.modul.v1,
 * ADR-2026-12, Onada 6).
 *
 * Un mòdul és una app de src/apps/<id> que no viatja dins del paquet del
 * nucli: es compila a banda, l'amfitrió la registra i la plataforma en
 * carrega el cos només quan algú l'obri (src/apps/plataforma/carregaModul.js).
 *
 * Ordre (NO VERIFICADA amb la CLI: el 261009 el hook no deixava compilar;
 * la mecànica i les guardes, sí, amb builds en memòria del mòdul de prova i
 * de la Gestoria sencera a src/apps/plataforma/modulDeBuild.test.jsx):
 *
 *   SDP_MODUL=gestoria npx vite build -c vite.modul.config.js
 *
 * Emet a wordpress-plugin/moduls/<id>/dist/ (fora de git, com tot dist):
 *   · cos-<hash>.js     · el cos, un script clàssic (IIFE) que en executar-se
 *                         crida SocDePoble.lliuraCos('<id>', () => Component).
 *                         No porta React, ni la plataforma, ni el router, ni
 *                         la Pedra Seca, ni l'espai de treball (1.2.0): els
 *                         pren de SocDePoble.nucli, les portes de
 *                         src/apps/plataforma/contracteNucli.js.
 *   · estils-<hash>.css · si el cos importa CSS (el 261009, cap app ho fa).
 *   · modul.js          · el registre, un script clàssic menut que crida
 *                         SocDePoble.registraModul(manifest) amb l'URL del
 *                         cos (germà d'ell mateix) i la seua integritat sha384.
 *   · sdp-modul.json    · la fitxa de distribució: esquema, id, versió, rang
 *                         del nucli i sha256 i SRI de cada fitxer. La signatura
 *                         Ed25519 és de l'empaquetador (pas P7 de l'ADR, pendent).
 *
 * Guardes (el build s'atura): un React, un react-dom o un scheduler propis;
 * qualsevol fitxer de src/app/contexts, src/data, host.js o config/storage.js
 * dins del cos (el Model B i els contexts de la pàgina); plataforma, Pedra
 * Seca o espai de treball que no siguen del nucli; un nom que el nucli no
 * exposa; un import() que no s'haja pogut inlinar; qualsevol canal de xarxa;
 * un magatzem del navegador que el mòdul no declara; i una URL de fora que no
 * siga una dada declarada pel mòdul (src/apps/plataforma/guardesDelModul.js).
 *
 * La Gestoria, a més, guarda el seu doble pany: AppGestoria només porta les
 * vistes en desenvolupament (privacitat.test.js). Mentre el Mestre no el
 * llevi (fase 2 de l'ADR), el cos de la Gestoria compilat ací només pinta
 * «La Gestoria no és en este paquet».
 */
import { defineConfig, loadEnv } from 'vite';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';
import {
  ESQUEMA_MODUL, VERSIO_NUCLI, exposaElNom, globalDeLaPorta, nucliSatisfa, portaDeLaFont
} from './src/apps/plataforma/contracteNucli.js';
import { infraccionsDelText } from './src/apps/plataforma/guardesDelModul.js';
import { esIdApp, validaManifestApp } from './src/apps/plataforma/manifestApp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const FITXER_REGISTRE = 'modul.js';
export const FITXER_FITXA = 'sdp-modul.json';
const ENTRADA_VIRTUAL = 'virtual:sdp-cos';
const ENTRADA_RESOLTA = `\0${ENTRADA_VIRTUAL}`;
/* Una integritat qualsevol amb la forma bona, només per a validar el manifest abans de compilar. */
const INTEGRITAT_PROVISIONAL = `sha384-${'A'.repeat(64)}`;

const sha256 = (dades) => createHash('sha256').update(dades).digest('hex');
const sri384 = (dades) => `sha384-${createHash('sha384').update(dades).digest('base64')}`;
const posix = (ruta) => ruta.split(path.sep).join('/');

/** El rang del nucli que demana un mòdul compilat contra esta versió: '^<major>.<menor>'. */
export function rangDelNucli(versio = VERSIO_NUCLI) {
  const [major, menor] = versio.split('.');
  return `^${major}.${menor}`;
}

/**
 * Les dades del manifest d'una app (src/apps/<id>/manifest.js) sense
 * executar Vite: el fitxer és DADA PURA (manifestApp.js), amb el literal de
 * compilació de `carrega` com a única expressió. Es reemplaça el literal per
 * false, s'avalua en una caixa buida i se'n lleva `carrega`. També torna el
 * component que carregava (el `import('./AppX.jsx')` del literal).
 * @returns {{ dades: object, component: string }}
 */
export function llegixManifestDelModul({ id, carpeta }) {
  const fitxer = path.join(carpeta, 'manifest.js');
  const codi = fs.readFileSync(fitxer, 'utf8');
  const component = codi.match(/import\('\.\/([A-Za-z0-9_]+\.jsx)'\)/);
  if (!component) throw new Error(`[sdp-modul] ${posix(fitxer)}: no hi ha cap import('./AppX.jsx') a carrega.`);
  if (/^\s*(?:import|export\s+(?!default\b))/m.test(codi)) {
    throw new Error(`[sdp-modul] ${posix(fitxer)}: el manifest d'un mòdul ha de ser dada pura, sense imports ni altres exports.`);
  }
  const variable = `VITE_SDP_APP_${id.toUpperCase().replace(/-/g, '_')}`;
  const cos = codi
    .replace(/import\.meta\.env\.DEV/g, 'false')
    .replace(new RegExp(`import\\.meta\\.env\\.${variable}`, 'g'), 'undefined')
    .replace(/^\s*export\s+default\s+/m, 'return ');
  if (cos.includes('import.meta')) throw new Error(`[sdp-modul] ${posix(fitxer)}: import.meta fora del literal de compilació.`);
  const avaluat = new vm.Script(`(function () {\n${cos}\n})()`, { filename: fitxer }).runInNewContext({});
  if (!avaluat || typeof avaluat !== 'object' || avaluat.id !== id) throw new Error(`[sdp-modul] ${posix(fitxer)}: el manifest no és el de «${id}».`);
  if (avaluat.carrega !== null) throw new Error(`[sdp-modul] ${posix(fitxer)}: fora de desenvolupament, carrega ha de valdre null.`);
  /* Dades planes d'este món (no de la caixa del vm), sense `carrega`. */
  const net = JSON.parse(JSON.stringify({ ...avaluat, carrega: undefined }));
  return { dades: Object.freeze(net), component: path.join(carpeta, component[1]) };
}

/* Només ASCII: un script clàssic es descodifica amb el charset de la pàgina
   (el mateix criteri que el carregador del paquet, vite.standalone.config.js).
   Tot el que no és ASCII ix com a \uXXXX, vàlid en cadenes, plantilles,
   expressions regulars i identificadors. */
export function nomesAscii(codi) {
  return codi.replace(/[^\u0000-~]/g, (caracter) => `\\u${caracter.charCodeAt(0).toString(16).padStart(4, '0')}`);
}

/** El manifest sdp.app.v1 d'un mòdul: les dades més el cos, els estils i el rang del nucli. Valida o llança. */
export function manifestDelModul(dades, { cos, estils, nucli = rangDelNucli() }) {
  const manifest = { ...dades, cos, ...(estils ? { estils } : {}), nucli };
  const { ok, errors } = validaManifestApp(manifest, { origen: 'modul' });
  if (!ok) throw new Error(`[sdp-modul] Manifest de «${dades.id}» invàlid:\n- ${errors.join('\n- ')}`);
  if (!nucliSatisfa(nucli, VERSIO_NUCLI)) throw new Error(`[sdp-modul] El rang ${nucli} no el satisfà este nucli (${VERSIO_NUCLI}).`);
  return manifest;
}

/**
 * El codi de modul.js: un script clàssic, sense cap global escrita, que
 * registra el mòdul amb l'URL absoluta del cos, germà d'ell mateix
 * (document.currentScript, sense la consulta ?ver=). El provisional del
 * paquet l'encua si encara no ha arribat l'API real.
 */
export function codiDelRegistre({ dades, cos, estils, nucli = rangDelNucli() }) {
  const id = JSON.stringify(dades.id);
  const manifest = JSON.stringify({ ...dades, nucli });
  const recurs = (clau, { fitxer, integrity }) => `  manifest.${clau} = { cami: new URL(${JSON.stringify(fitxer)}, script.src).href, integrity: ${JSON.stringify(integrity)} };\n`;
  const codi = '(function () {\n'
    + "  'use strict';\n"
    + '  var script = document.currentScript;\n'
    + '  var sdp = window.SocDePoble;\n'
    + "  if (!script || !script.src || !sdp || typeof sdp.registraModul !== 'function') {\n"
    + `    console.error('[sdp-modul] ' + ${id} + ': cal un <script src> clàssic, després del paquet de Sóc de Poble.');\n`
    + '    return;\n'
    + '  }\n'
    + `  var manifest = ${manifest};\n`
    + recurs('cos', cos)
    + (estils ? recurs('estils', estils) : '')
    + '  Promise.resolve(sdp.registraModul(manifest)).then(function (resultat) {\n'
    + `    if (!resultat || !resultat.ok) console.error('[sdp-modul] ' + ${id} + ' no s’ha registrat:', resultat && resultat.errors);\n`
    + '  }, function (error) {\n'
    + `    console.error('[sdp-modul] ' + ${id} + ' no s’ha registrat:', error);\n`
    + '  });\n'
    + '})();\n';
  const ascii = nomesAscii(codi);
  new vm.Script(ascii, { filename: FITXER_REGISTRE });
  return ascii;
}

/** La fitxa de distribució (sdp-modul.json). `fitxers`: { registre, cos, estils? } amb { cami, contingut }. */
export function fitxaDelModul({ dades, versio, generat, nucli = rangDelNucli(), fitxers }) {
  const descriu = ({ cami, contingut }) => ({ cami, mida: contingut.length, sha256: sha256(contingut), integrity: sri384(contingut) });
  return {
    schema: ESQUEMA_MODUL,
    id: dades.id,
    versio,
    generat,
    nucli,
    registre: descriu(fitxers.registre),
    cos: descriu(fitxers.cos),
    ...(fitxers.estils ? { estils: descriu(fitxers.estils) } : {}),
    manifest: dades
  };
}

/* El fitxer o el paquet d'una importació, des de l'arrel del repositori. */
const fontDe = (arrel, id) => (path.isAbsolute(id) ? posix(path.relative(arrel, id)) : id);

/**
 * Les infraccions d'un cos compilat (el chunk de Rollup), com a text. Buit si
 * és net. `carpeta`: la de l'app, el codi propi del mòdul. `id`: el mòdul,
 * per a les adreces i els magatzems que declara (guardesDelModul.js).
 */
export function infraccionsDelCos(chunk, arrel, carpeta = null, id = null) {
  const trobades = [];
  const propia = carpeta ? `${fontDe(arrel, carpeta)}/` : null;
  for (const id of Object.keys(chunk.modules || {})) {
    if (id.startsWith('\0')) continue;
    if (/node_modules[\\/](?:react|react-dom|scheduler)[\\/]/.test(id)) { trobades.push(`porta el seu React: ${id}`); continue; }
    const font = fontDe(arrel, id);
    if (propia && font.startsWith(propia)) continue;
    if (/^src\/(?:app\/contexts|data)\//.test(font) || font === 'src/host.js' || font === 'src/config/storage.js') {
      trobades.push(`porta el nucli de la pàgina (context, dades o host): ${font}`);
    } else if (/^src\/(?:apps\/plataforma|components\/PedraSeca)\//.test(font)) {
      trobades.push(`porta plataforma o Pedra Seca fora del nucli ${VERSIO_NUCLI}: ${font}`);
    } else if (/^src\/components\/universal\/workspace\//.test(font)) {
      /* Nucli 1.2.0 (261016): l'espai de treball és de la pàgina (porta 'workspace'). Una peça de
         dins al cos seria una segona còpia dels seus contexts (WorkspaceContext, GlifCategoriaContext). */
      trobades.push(`porta l'espai de treball fora del nucli ${VERSIO_NUCLI}: ${font}`);
    }
  }
  for (const [importat, noms] of Object.entries(chunk.importedBindings || {})) {
    const porta = portaDeLaFont(importat);
    if (!porta) { trobades.push(`importa ${importat}, que no és del nucli`); continue; }
    for (const nom of noms) {
      if (!exposaElNom(porta, nom)) trobades.push(`importa ${nom === '*' ? 'tot' : nom} de ${importat}: el nucli ${VERSIO_NUCLI} no l'exposa`);
    }
  }
  if (chunk.dynamicImports?.length) trobades.push(`porta import() sense inlinar: ${chunk.dynamicImports.join(', ')}`);
  trobades.push(...infraccionsDelText(chunk.code, { id }));
  return trobades;
}

/**
 * El plugin del mòdul: l'entrada virtual (el cos que lliura el component),
 * les guardes i els fitxers de registre i de distribució.
 */
export function pluginDelModul({ id, arrel, carpeta, dades, component, versio, generat }) {
  return {
    name: 'sdp-modul',
    apply: 'build',
    resolveId(font) {
      return font === ENTRADA_VIRTUAL ? ENTRADA_RESOLTA : null;
    },
    load(idModul) {
      if (idModul !== ENTRADA_RESOLTA) return null;
      return `import Component from ${JSON.stringify(posix(component))};\n`
        + `SocDePoble.lliuraCos(${JSON.stringify(id)}, function () { return Component; });\n`;
    },
    /* Després de la minificació de Vite: el cos també és un script clàssic. */
    renderChunk: {
      order: 'post',
      handler(codi) {
        return nomesAscii(codi);
      }
    },
    generateBundle(_opcions, paquet) {
      const chunks = Object.values(paquet).filter((fitxer) => fitxer.type === 'chunk');
      if (chunks.length !== 1 || !chunks[0].isEntry) this.error(`El cos d'un mòdul és un sol script i n'hi ha ${chunks.length}.`);
      const [cos] = chunks;
      const infraccions = infraccionsDelCos(cos, arrel, carpeta, id);
      if (infraccions.length) this.error(`El cos de «${id}» no és un mòdul net:\n- ${infraccions.join('\n- ')}`);

      const fulls = Object.values(paquet).filter((fitxer) => fitxer.type === 'asset' && fitxer.fileName.endsWith('.css'));
      if (fulls.length > 1) this.error(`El cos de «${id}» ha emés ${fulls.length} fulls d'estils i n'ha de portar un com a molt.`);
      let estils = null;
      if (fulls.length) {
        const contingut = Buffer.from(fulls[0].source);
        estils = { cami: `estils-${sha256(contingut).slice(0, 8)}.css`, contingut };
        delete paquet[fulls[0].fileName];
        this.emitFile({ type: 'asset', fileName: estils.cami, source: contingut });
      }
      const delCos = { cami: cos.fileName, contingut: Buffer.from(cos.code) };
      const recurs = (fitxer) => (fitxer ? { fitxer: fitxer.cami, integrity: sri384(fitxer.contingut) } : null);
      manifestDelModul(dades, { cos: { cami: `/${delCos.cami}`, integrity: sri384(delCos.contingut) },
        estils: estils ? { cami: `/${estils.cami}`, integrity: sri384(estils.contingut) } : null });
      const registre = { cami: FITXER_REGISTRE, contingut: Buffer.from(codiDelRegistre({ dades, cos: recurs(delCos), estils: recurs(estils) })) };
      this.emitFile({ type: 'asset', fileName: FITXER_REGISTRE, source: registre.contingut });
      const fitxa = fitxaDelModul({ dades, versio, generat, fitxers: { registre, cos: delCos, ...(estils ? { estils } : {}) } });
      this.emitFile({ type: 'asset', fileName: FITXER_FITXA, source: `${JSON.stringify(fitxa, null, 2)}\n` });
    }
  };
}

/**
 * La configuració de Vite per a un mòdul. `carpeta`: la de l'app (per
 * defecte, src/apps/<id>). `plugins`: els de JSX (el default hi posa
 * @vitejs/plugin-react; les proves, l'esbuild de Vite).
 */
export function configDelModul({
  id, arrel = __dirname, carpeta = path.join(arrel, 'src/apps', id || ''), outDir = path.join(arrel, 'wordpress-plugin/moduls', id || '', 'dist'),
  versio = '0.0.0-dev', generat = new Date().toISOString(), plugins = []
}) {
  if (!esIdApp(id)) throw new Error(`[sdp-modul] SDP_MODUL ha de ser l'id d'una app (src/apps/<id>), no «${id}».`);
  const { dades, component } = llegixManifestDelModul({ id, carpeta });
  manifestDelModul(dades, { cos: { cami: '/cos.js', integrity: INTEGRITAT_PROVISIONAL } });
  const externa = (font, _importador, resolta) => {
    if (font === ENTRADA_VIRTUAL || font.startsWith('\0')) return false;
    if (!resolta && !path.isAbsolute(font)) return Boolean(portaDeLaFont(font));
    return Boolean(portaDeLaFont(fontDe(arrel, font)));
  };
  return {
    root: arrel,
    configFile: false,
    publicDir: false,
    /* Cap VITE_* del projecte entra al cos: cap variable porta este prefix. */
    envPrefix: 'SDP_MODUL_PUBLIC_',
    plugins: [...plugins, pluginDelModul({ id, arrel, carpeta, dades, component, versio, generat })],
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    resolve: { alias: { '@': path.join(arrel, 'src') } },
    build: {
      target: 'es2022',
      outDir,
      emptyOutDir: true,
      copyPublicDir: false,
      manifest: false,
      sourcemap: false,
      cssCodeSplit: false,
      modulePreload: false,
      lib: {
        entry: component,
        name: 'SdpCosDelModul',
        formats: ['iife'],
        fileName: () => 'cos-[hash].js'
      },
      rollupOptions: {
        input: ENTRADA_VIRTUAL,
        external: externa,
        output: {
          interop: 'default',
          inlineDynamicImports: true,
          globals: (font) => {
            const porta = portaDeLaFont(fontDe(arrel, font));
            return porta ? globalDeLaPorta(porta) : undefined;
          },
          paths: (font) => fontDe(arrel, font)
        }
      }
    }
  };
}

const versioDePackageJson = () => JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8')).version;

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const { default: react } = await import('@vitejs/plugin-react');
  const generat = env.SOURCE_DATE_EPOCH ? new Date(Number(env.SOURCE_DATE_EPOCH) * 1000).toISOString() : undefined;
  return configDelModul({
    id: env.SDP_MODUL,
    versio: env.SDP_VERSIO ? String(env.SDP_VERSIO).trim() : `${versioDePackageJson()}-dev`,
    ...(generat ? { generat } : {}),
    plugins: [react()]
  });
});
