import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');
const sitemapPath = path.join(rootDir, 'public', 'sitemap.xml');

// Llista de rutes públiques a indexar
const rutesPúbliques = [
  { path: '/', priority: 1.0, changefreq: 'daily' },
  { path: '/mur', priority: 0.9, changefreq: 'daily' },
  { path: '/mercat', priority: 0.8, changefreq: 'daily' },
  { path: '/pobles', priority: 0.7, changefreq: 'weekly' },
  { path: '/registre', priority: 0.8, changefreq: 'monthly' },
  { path: '/legal', priority: 0.5, changefreq: 'yearly' },
  { path: '/versions', priority: 0.5, changefreq: 'monthly' },
];

const domini = 'https://socdepoble.org';

function generarSitemap() {
  const urlset = rutesPúbliques.map(ruta => `
  <url>
    <loc>${domini}${ruta.path === '/' ? '' : ruta.path}</loc>
    <changefreq>${ruta.changefreq}</changefreq>
    <priority>${ruta.priority.toFixed(1)}</priority>
  </url>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlset}
</urlset>
`;

  fs.writeFileSync(sitemapPath, xml);
  console.log(`[OK] sitemap.xml generat amb èxit a: ${sitemapPath}`);
}

generarSitemap();
