import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { construeixManifest } from '../../../tooling/wiki/compile-wiki-to-app.mjs';
import { publicWikiFiles } from '../../../tooling/wiki/lib/publication-policy.mjs';
import { parseFrontmatter } from '../../../tooling/wiki/lib/frontmatter.mjs';
import { markdownProse } from '../../../tooling/lib/markdown-prose.mjs';
import { parseMarkdown } from './parseMarkdown.js';
import { sanitizeHtml } from '../../utils/sanitize.js';

const temporals = [];
afterEach(() => { for (const dir of temporals.splice(0)) fs.rmSync(dir, { recursive: true, force: true }); });
const pinta = md => {
  const root = document.createElement('div');
  root.innerHTML = sanitizeHtml(parseMarkdown(md, { entradilla: false }), { llistesNumerades: true }); // com la Wiki (WC-06)
  return root;
};

describe('Wiki O7 · font → manifest → HTML sanejat', () => {
  it('el compilador conserva blocs, numeració i negretes de la font', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sdp-wiki-o7-'));
    temporals.push(root);
    fs.mkdirSync(path.join(root, '_wiki_de_poble/01_ser'), { recursive: true });
    const body = '# Document\n\n## Passos\n\n4. **Primer** pas.\n\n   Explicació **amb\n   salt de línia** i [[segon|enllaç]].\n\n   - detall\n\n5. Segon pas.\n\n[Consulta](?item=segon) la mateixa frase\ncontinuada en una sola mida de paràgraf.\n';
    fs.writeFileSync(path.join(root, '_wiki_de_poble/01_ser/prova.md'), `---\ntype: document\nstatus: canonic\ndescription: Document de prova\n---\n${body}`);
    const manifest = construeixManifest(root);
    expect(manifest.items).toHaveLength(1);
    expect(manifest.items[0].content).toBe(body.replace('[[segon|enllaç]]', '[enllaç](?item=segon)'));
    const rendered = pinta(manifest.items[0].content);
    expect(rendered.querySelectorAll(':scope > ol')).toHaveLength(1);
    expect(rendered.querySelector('ol').start).toBe(4);
    expect(rendered.querySelectorAll(':scope > ol > li')).toHaveLength(2);
    expect(rendered.querySelector('li ul li').textContent).toBe('detall');
    expect([...rendered.querySelectorAll('strong')].map(n => n.textContent)).toContain('amb salt de línia');
    expect(rendered.querySelector(':scope > p > a').parentElement.textContent).toContain('frase continuada');
  });

  /* Gauntlet O7 · WD-03 · prompt_local i prompt_consell són plantilles
     canòniques: document.mjs en copia els blocs fixos a cada document nou i
     els rebuts en guarden el SHA-256. La passada de negretes hi espera la
     proposta a MarIA (versió de la ruta i entrada a l'Historial). Fins llavors
     se n'audita la jerarquia, i l'excepció cau sola: si ja no fa falta, la
     prova falla perquè es lleve. */
  const PLANTILLES_SENSE_PASSADA = [
    '_wiki_de_poble/03_actuar/plantilles/prompt_consell.md',
    '_wiki_de_poble/03_actuar/plantilles/prompt_local.md'
  ];

  it('el corpus canònic manté jerarquia i lectura diagonal en els paràgrafs llargs', () => {
    const root = process.cwd();
    const files = publicWikiFiles(root, { extensions: ['.md'] });
    // 05_social continua fora de la frontera pública; també s'audita al disc.
    files.push(path.join(root, '_wiki_de_poble/05_social/00_explorador_social.md'));
    const errors = [];
    const pendents = new Set();
    let paragrafs = 0;
    for (const file of files) {
      const relative = path.relative(root, file);
      const body = parseFrontmatter(fs.readFileSync(file, 'utf8')).body;
      const headings = [...markdownProse(body).matchAll(/^(#{1,6})[ \t]+(.+)$/gm)];
      let previous = 0;
      if (!headings.some(h => h[1].length === 2)) errors.push(`${relative}: falta H2`);
      for (const h of headings) {
        if (h[1].length > previous + 1) errors.push(`${relative}: salt H${previous}→H${h[1].length}`);
        previous = h[1].length;
      }
      // Índexs, labels i frases curtes no s'omplin artificialment de negreta.
      // Codi i taules no són paràgrafs; els <p> dins de llistes sí que compten.
      for (const p of pinta(body).querySelectorAll('p')) {
        if (p.textContent.trim().split(/\s+/).length < 45) continue;
        paragrafs += 1;
        const strong = p.querySelectorAll('strong').length;
        if (strong >= 6 && strong <= 8) continue;
        if (PLANTILLES_SENSE_PASSADA.includes(relative)) pendents.add(relative);
        else errors.push(`${relative}: ${strong} negretes a «${p.textContent.slice(0, 60)}»`);
      }
    }
    expect(files.length).toBeGreaterThan(80);
    expect(paragrafs).toBeGreaterThan(200);
    expect(errors).toEqual([]);
    expect([...pendents].sort()).toEqual(PLANTILLES_SENSE_PASSADA);
  });
});
