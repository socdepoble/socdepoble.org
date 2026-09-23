/**
 * wiki-watcher.mjs — Sincronització en calent de la Wiki cap a l'aplicació.
 *
 * Fins ara `compile-wiki-to-app.mjs` només corria al `prebuild`: en
 * desenvolupament, `src/data/wikiManifest.js` era un artefacte congelat i editar
 * un Markdown de la Wiki no tenia cap efecte fins a fer un build sencer.
 *
 * Set decisions, i el motiu de cadascuna:
 *
 * 1. `apply: 'serve'` — el build ja té `prebuild`. Recompilar durant el build
 *    duplicaria faena i podria competir amb ell.
 * 2. Escriptura condicional — `compila()` no toca el fitxer si el contingut
 *    generat és idèntic. Sense això cada desat innocu canvia l'`mtime`, Vite
 *    reinvalida i el navegador parpelleja: la diferència entre un watcher i un
 *    bucle.
 * 3. `full-reload`, no HMR fi — `wikiManifest.js` és un `export const` de ~257 KB
 *    consumit per dos components. Un HMR granular exigiria convertir-lo en un
 *    store reactiu, i això és un altre projecte.
 * 4. Retard de 120 ms — desar des d'Obsidian dispara diversos esdeveniments
 *    (fitxer temporal + renom). Sense debounce es recompila tres voltes per desat.
 * 5. Àmbit idèntic al compilador — només `01_ser`, `02_saber` i `03_actuar`.
 *    L'Escriptori i `90_arxiu_historic/` no entren mai a l'aplicació (AGENTS §5).
 * 6. Els errors no maten el servidor — un frontmatter a mig escriure és l'estat
 *    normal mentre s'escriu. Overlay i avant.
 * 7. `rag-index.json` i `slugIndex.json` queden fora a propòsit — viuen a
 *    `public/`, que Vite servix del disc, i són bastant més cars de regenerar.
 */
import path from 'node:path';
import { compila, PUBLIC_WIKI_DIRS, WIKI_DIR, OUT_REL } from '../wiki/compile-wiki-to-app.mjs';

const prefixos = PUBLIC_WIKI_DIRS.map((d) => `${WIKI_DIR}/${d}/`);

/** Un fitxer entra al manifest? Mateix àmbit que el compilador, ni un més. */
export function dinsAmbit(arrel, fitxer) {
  const rel = path.relative(arrel, fitxer).split(path.sep).join('/');
  if (rel.startsWith('..')) return false;
  if (!rel.endsWith('.md') && !rel.endsWith('.json')) return false;
  if (path.basename(rel).startsWith('.')) return false;
  // Documents solts de l'arrel de la Wiki (00_index.md) i les tres públiques.
  if (/^_wiki_de_poble\/[^/]+\.(md|json)$/.test(rel)) return true;
  return prefixos.some((p) => rel.startsWith(p));
}

export default function wikiWatcher({ arrel = process.cwd(), retard = 120 } = {}) {
  let temporitzador = null;

  return {
    name: 'sdp-wiki-watcher',
    apply: 'serve',
    configureServer(server) {
      const manifestAbs = path.join(arrel, OUT_REL);

      const recompila = () => {
        clearTimeout(temporitzador);
        temporitzador = setTimeout(() => {
          try {
            const r = compila({ root: arrel });
            if (!r.changed) return;
            const mod = server.moduleGraph.getModuleById(manifestAbs);
            if (mod) server.moduleGraph.invalidateModule(mod);
            server.ws.send({ type: 'full-reload', path: '*' });
            server.config.logger.info(`[wiki] manifest recompilat: ${r.items} documents, ${r.categories} categories`);
          } catch (e) {
            server.config.logger.error(`[wiki] ${e.message}`);
            server.ws.send({ type: 'error', err: { message: `[wiki] ${e.message}`, stack: '' } });
          }
        }, retard);
      };

      for (const dir of PUBLIC_WIKI_DIRS) server.watcher.add(path.join(arrel, WIKI_DIR, dir));
      for (const esdeveniment of ['add', 'change', 'unlink']) {
        server.watcher.on(esdeveniment, (f) => { if (dinsAmbit(arrel, f)) recompila(); });
      }
    },
    buildEnd() {
      clearTimeout(temporitzador);
    }
  };
}
