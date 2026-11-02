import fs from 'node:fs';
import path from 'node:path';

/** Metadades de Finder: qualsevol segment, sense excloure .well-known. */
export function esResiduFinder(nom) {
  return nom === '.DS_Store' || nom === '.DS-Store' || nom.startsWith('._');
}

/** Inventari determinista de public/, abans de llegir o copiar cap residu. */
export function recursosPublicsNets(directori) {
  const fitxers = [];
  if (!directori || !fs.existsSync(directori)) return fitxers;
  const recorre = (abs, rel) => {
    for (const entrada of fs.readdirSync(abs, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (esResiduFinder(entrada.name)) continue;
      const fill = path.join(abs, entrada.name);
      const cami = rel ? `${rel}/${entrada.name}` : entrada.name;
      // Public és una font de distribució: cap enllaç pot fer llegir fora d'ella.
      if (entrada.isSymbolicLink()) throw new Error(`[sdp-public-net] Enllaç simbòlic a public/: ${cami}`);
      if (entrada.isDirectory()) recorre(fill, cami);
      else if (entrada.isFile()) fitxers.push(cami);
      else throw new Error(`[sdp-public-net] Recurs no regular a public/: ${cami}`);
    }
  };
  recorre(directori, '');
  return fitxers.sort();
}

/** Retira només residus de l'eixida; mai recorre enllaços simbòlics. */
export function retiraResidusFinder(directori) {
  const retirats = [];
  if (!fs.existsSync(directori)) return retirats;
  if (!fs.lstatSync(directori).isDirectory()) throw new Error('[sdp-public-net] L’eixida no és un directori real.');
  const recorre = (abs, rel) => {
    for (const entrada of fs.readdirSync(abs, { withFileTypes: true })) {
      const fill = path.join(abs, entrada.name);
      const cami = rel ? `${rel}/${entrada.name}` : entrada.name;
      if (esResiduFinder(entrada.name)) {
        fs.rmSync(fill, { recursive: true, force: true });
        retirats.push(cami);
      } else if (entrada.isDirectory()) recorre(fill, cami);
    }
  };
  recorre(directori, '');
  return retirats.sort();
}

/**
 * O3-CODEX-3 · El web substituïx copyPublicDir per assets filtrats de Rollup.
 * public/ queda intacte; .well-known, .htaccess i els recursos legítims viatgen.
 * Els generadors (federació/App Links) tenen prioritat, com quan Vite copiava
 * public/ abans de generar els seus fitxers. WP/natiu ja exclouen tots els
 * ocults amb recursosPublicsDelPlugin; els mòduls no copien public/.
 */
export default function publicNet() {
  let config;
  return {
    name: 'sdp-public-net',
    apply: 'build',
    config() { return { build: { copyPublicDir: false } }; },
    configResolved(resolta) { config = resolta; },
    generateBundle: {
      order: 'post',
      handler(_opcions, paquet) {
        for (const fileName of recursosPublicsNets(config.publicDir)) {
          if (Object.hasOwn(paquet, fileName)) continue;
          this.emitFile({ type: 'asset', fileName, source: fs.readFileSync(path.join(config.publicDir, fileName)) });
        }
      }
    },
    writeBundle(opcions) {
      const eixida = path.resolve(config.root, opcions.dir || config.build.outDir);
      const rel = path.relative(config.root, eixida);
      if (!rel || rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
        throw new Error('[sdp-public-net] L’eixida ha de ser estrictament dins del projecte.');
      }
      // Un avantpassat simbòlic no dona permís per a netejar un arbre exterior.
      let actual = config.root;
      for (const segment of rel.split(path.sep)) {
        actual = path.join(actual, segment);
        if (fs.existsSync(actual) && fs.lstatSync(actual).isSymbolicLink()) {
          throw new Error('[sdp-public-net] Enllaç simbòlic en la ruta de l’eixida.');
        }
      }
      retiraResidusFinder(eixida);
    }
  };
}
