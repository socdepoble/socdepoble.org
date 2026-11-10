/**
 * Ordre del Mestre 261109 · R15a (PRIV-01, R15A-PAQ-02) · Les fotos locals de
 * La Parròquia (src/assets/bar/parroquia/, fora de git per .gitignore) no ixen
 * mai en un build públic, encara que existisquen al disc de qui compila.
 *
 * Per què un connector i no només la bandera: src/apps/plataforma/menjarIBeure.js
 * fa `import('…/parroquiaFotos.js')` dins d'una branca que en producció és
 * morta, però Rollup carrega el destí de tot import() en construir el graf,
 * abans de podar-lo. La glob eager `?url` de parroquiaFotos.js fa que
 * vite:asset emeta cada bitmap en el `load`, i després ningú no poda els
 * recursos orfes (el build final de la ronda 3 en va emetre 397, 135 MB).
 *
 * Tres capes, en una sola funció per als tres builds (web, natiu i autònom):
 *   1. Fora de DEV i sense VITE_SDP_BAR_LLAVOR_LA_PARROQUIA=1, el mòdul es
 *      resol (resolveId, i el load com a xarxa) a un mòdul virtual amb la
 *      mateixa API: el manifest sense URL, cap foto de producte i la carta
 *      intacta. Cap glob, cap bitmap.
 *   2. En compilar, la bandera es definix com a literal (define), perquè la
 *      branca morta es plegue igual a tots els mòduls que la miren.
 *   3. Si, tot i així, el paquet porta un recurs amb nom de foto original
 *      (p-<sha256 de 64 hex>-…), el build falla.
 * En desenvolupament i a les proves (DEV) no fa res: vi.stubEnv continua
 * governant la bandera.
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadEnv } from 'vite';

export const BANDERA_FOTOS_PARROQUIA = 'VITE_SDP_BAR_LLAVOR_LA_PARROQUIA';
export const MODUL_FOTOS_PARROQUIA = 'src/data/menjarIBeure/parroquiaFotos.js';
export const MANIFEST_FOTOS_PARROQUIA = 'src/data/menjarIBeure/parroquiaFotos.generated.json';
export const ID_FOTOS_BUIDES = '\0sdp-fotos-parroquia-buides';
/** El nom que l'importador dona als originals (p-<sha256>) més el hash de Vite. */
export const RECURS_FOTO_ORIGINAL = /(?:^|\/)p-[0-9a-f]{64}[-.]/;

const posix = (cami) => cami.split(path.sep).join('/');
const senseConsulta = (id) => id.replace(/[?#].*$/, '');
/* Vite resol als camins reals (/var → /private/var a macOS, enllaços): es comparen així. */
const real = (cami) => {
  try { return posix(fs.realpathSync(cami)); } catch { return posix(cami); }
};

/** El mòdul virtual: la mateixa API que parroquiaFotos.js, sense cap bitmap ni URL. */
export function codiFotosBuides(manifest) {
  return [
    `import MANIFEST from ${JSON.stringify(posix(manifest))};`,
    '/* Build públic: les fotos de La Parròquia no hi són (tooling/vite/fotos-parroquia-privades.mjs). */',
    'export function indexFotosParroquia() { return structuredClone(MANIFEST); }',
    'export function fotoDeProducteParroquia() { return null; }',
    'export function incorporaFotosParroquia(carta) { return carta; }',
    ''
  ].join('\n');
}

/** La bandera tal com la veu Vite: els .env de envDir i l'entorn del procés. */
export function valorDeLaBandera(config = {}, mode = 'production') {
  const arrel = path.resolve(config.root ?? process.cwd());
  if (config.envDir === false) return String(process.env[BANDERA_FOTOS_PARROQUIA] ?? '');
  const envDir = path.resolve(arrel, config.envDir ?? '');
  return String(loadEnv(mode, envDir, BANDERA_FOTOS_PARROQUIA)[BANDERA_FOTOS_PARROQUIA] ?? '');
}

export default function fotosParroquiaPrivades() {
  let valor = '';
  let actiu = false;
  let desti = null;
  let manifest = null;
  let publicPhotos = null;
  return {
    name: 'sdp-fotos-parroquia-privades',
    enforce: 'pre',
    config(config, { mode, command }) {
      valor = valorDeLaBandera(config, mode);
      if (command !== 'build') return null;
      return { define: { [`import.meta.env.${BANDERA_FOTOS_PARROQUIA}`]: JSON.stringify(valor) } };
    },
    configResolved(config) {
      actiu = !config.env.DEV && valor !== '1';
      desti = real(path.resolve(config.root, MODUL_FOTOS_PARROQUIA));
      manifest = path.resolve(config.root, MANIFEST_FOTOS_PARROQUIA);
      publicPhotos = config.publicDir ? path.resolve(config.publicDir, 'assets/uploads/tpv-parroquia') : null;
    },
    buildStart() {
      if (!actiu || !publicPhotos || !fs.existsSync(publicPhotos)) return;
      const pendent = [publicPhotos];
      while (pendent.length) {
        const current = pendent.pop();
        const info = fs.lstatSync(current);
        if (!info.isDirectory()) {
          this.error('Fotos originals de La Parròquia en public/assets/uploads/tpv-parroquia/. Retira-les del directori públic abans de compilar; no s’han eliminat els originals locals.');
        }
        for (const entrada of fs.readdirSync(current)) pendent.push(path.join(current, entrada));
      }
    },
    async resolveId(font, importador, opcions) {
      if (!actiu || !font.includes('parroquiaFotos')) return null;
      const resolt = await this.resolve(font, importador, { ...opcions, skipSelf: true });
      return resolt && real(senseConsulta(resolt.id)) === desti ? ID_FOTOS_BUIDES : null;
    },
    load(id) {
      if (!actiu) return null;
      if (id !== ID_FOTOS_BUIDES && (id.startsWith('\0') || !id.includes('parroquiaFotos') || real(senseConsulta(id)) !== desti)) return null;
      return codiFotosBuides(manifest);
    },
    generateBundle(_opcions, paquet) {
      if (!actiu) return;
      const fotos = Object.keys(paquet).filter((nom) => RECURS_FOTO_ORIGINAL.test(nom));
      if (fotos.length) {
        this.error(`${fotos.length} fotos originals de La Parròquia en un build públic (${fotos.slice(0, 3).join(', ')}…). Només amb ${BANDERA_FOTOS_PARROQUIA}=1.`);
      }
    }
  };
}
