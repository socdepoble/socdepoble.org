/* S'executa DESPRÉS de vite build; jsdom ja és dependència de desenvolupament.
   Pla 261028_1526 (P1-61, Fase 2) · Lleva del <head> el que és de la ruta
   (títol, descripció, robots, og:* i twitter:* de la pàgina, canonical) i hi
   deixa un sol forat (SOCIAL_SLOT). Conserva el que és del lloc: og:site_name,
   og:locale, la CSP, el JSON-LD WebSite i cada script i link. */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { SOCIAL_SLOT } from './social-edge.mjs';

/* Les propietats og: que són del lloc i no de cap ruta: es queden sense marca. */
const DEL_LLOC = ['og:site_name', 'og:locale'];
const selectorDeRuta = ['title', 'meta[name="description" i]', 'meta[name="robots" i]',
  `meta[property^="og:" i]${DEL_LLOC.map(nom => `:not([property="${nom}" i])`).join('')}`, 'meta[name^="og:" i]',
  'meta[name^="twitter:" i]', 'meta[property^="twitter:" i]', 'link[rel~="canonical" i]'].join(',');

export function prepareShell(html, JSDOM) {
  const dom = new JSDOM(html); // sense runScripts ni recursos remots.
  const document = dom.window.document;
  if (!document.head || !/<head(?:\s|>)/i.test(html) || html.includes(SOCIAL_SLOT)) throw new Error('HTML sense head o marcador duplicat');
  document.head.querySelectorAll(selectorDeRuta).forEach(node => node.remove());
  // Un sol node de cada propietat del lloc: el primer.
  for (const nom of DEL_LLOC) {
    [...document.head.querySelectorAll(`meta[property="${nom}" i]`)].slice(1).forEach(node => node.remove());
  }
  document.head.appendChild(document.createComment('SDP_SOCIAL_HEAD'));
  const template = dom.serialize();
  dom.window.close();
  if (template.split(SOCIAL_SLOT).length !== 2) throw new Error('Cal un únic slot social');
  return { sourceSha256: createHash('sha256').update(html).digest('hex'), template };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) throw new Error('Ús: node prepare-social-shell.mjs dist/index.html dist-edge/social-shell.json');
  const { JSDOM } = await import('jsdom');
  const shell = prepareShell(fs.readFileSync(input, 'utf8'), JSDOM);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(shell));
  console.log(JSON.stringify({ valid: true, sourceSha256: shell.sourceSha256 }));
}
