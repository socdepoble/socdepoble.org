/** FEDI-03 · ZIP restaurable determinista del snapshot públic versionat.
 * Ni el build ni les lectures del ZIP de desenvolupament consulten la xarxa
 * o carreguen credencials. L'epoch és el del snapshot, no el rellotge.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

async function paquetDe(arrel) {
  const fitxer = path.join(arrel, 'public/opendata/snapshot-public.json');
  const stat = await fs.stat(fitxer);
  if (stat.size > 4 * 1024 * 1024) throw new RangeError('Snapshot públic de més de 4 MB.');
  const snapshot = JSON.parse(await fs.readFile(fitxer, 'utf8'));
  // URL calculada: el carregador de vite.config no ha d'empaquetar l'arbre
  // del frontend que l'exportador pot carregar en diferit.
  const { generaOpenData } = await import(pathToFileURL(path.join(arrel, 'tooling/seo/genera-opendata.mjs')).href);
  const { paquet } = await generaOpenData({ arrel, snapshot, escriu: false });
  return paquet;
}
const empremta = paquet => `${paquet.sha256}  ${paquet.nomFitxer}\n`;

export default function opendataPublica({ arrel = process.cwd() } = {}) {
  let root = arrel;
  return {
    name: 'socdepoble-opendata-publica',
    configResolved(config) { root = config.root || root; },
    async generateBundle() {
      const paquet = await paquetDe(root);
      this.emitFile({ type: 'asset', fileName: `opendata/${paquet.nomFitxer}`, source: paquet.zip });
      this.emitFile({ type: 'asset', fileName: `opendata/${paquet.nomFitxer}.sha256`, source: empremta(paquet) });
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost');
        if (!/^\/opendata\/dades-obertes-[a-z0-9-]+-\d{8}\.zip(?:\.sha256)?$/.test(url.pathname)) return next();
        if (!['GET', 'HEAD'].includes(req.method)) { res.statusCode = 405; res.setHeader('Allow', 'GET, HEAD'); return res.end(); }
        try {
          const paquet = await paquetDe(root);
          const nom = url.pathname.slice('/opendata/'.length);
          if (nom !== paquet.nomFitxer && nom !== `${paquet.nomFitxer}.sha256`) { res.statusCode = 404; return res.end(); }
          const resum = nom.endsWith('.sha256');
          const cos = resum ? empremta(paquet) : paquet.zip;
          res.statusCode = 200;
          res.setHeader('Content-Type', resum ? 'text/plain; charset=utf-8' : 'application/zip');
          res.setHeader('Cache-Control', 'no-store');
          res.setHeader('Content-Length', Buffer.byteLength(cos));
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.end(req.method === 'HEAD' ? undefined : cos);
        } catch (e) { next(e); }
      });
    },
  };
}
