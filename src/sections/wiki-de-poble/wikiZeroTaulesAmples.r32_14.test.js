// @vitest-environment node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { publicWikiFiles } from '../../../tooling/wiki/lib/publication-policy.mjs';
import { markdownProse } from '../../../tooling/lib/markdown-prose.mjs';
import { parseDocument } from '../../../tooling/documental/core.mjs';
import { parseMarkdown } from './parseMarkdown.js';
import { wikiManifest } from '../../data/wikiManifest.js';

const ARREL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

const CENS_18_P0_128 = Object.freeze([
  '_wiki_de_poble/01_ser/00_index_identitat.md',
  '_wiki_de_poble/01_ser/03_equip_ia.md',
  '_wiki_de_poble/01_ser/03_llibre_d_or_memoria_episodica.md',
  '_wiki_de_poble/01_ser/04_taula_potencia_models.md',
  '_wiki_de_poble/02_saber/00_arquitectura_tecnica_unificada.md',
  '_wiki_de_poble/02_saber/03_consola_termodinamica/00_portada.md',
  '_wiki_de_poble/02_saber/03_consola_termodinamica/01_fluxos_skills.md',
  '_wiki_de_poble/02_saber/03_consola_termodinamica/02_calendari.md',
  '_wiki_de_poble/02_saber/03_consola_termodinamica/03_inventari_skills.md',
  '_wiki_de_poble/02_saber/03_consola_termodinamica/05_actors_i_salut.md',
  '_wiki_de_poble/02_saber/architecture/guia_publicacio_app_store_i_google_play.md',
  '_wiki_de_poble/02_saber/architecture/perfil_minim_allotjament_node_municipal.md',
  '_wiki_de_poble/02_saber/core_registre_automillora.md',
  '_wiki_de_poble/02_saber/doc_logos_oficials.md',
  '_wiki_de_poble/02_saber/protocols_tecnics/index_trellat.md',
  '_wiki_de_poble/02_saber/protocols_tecnics/successio_lazaro_execucio.md',
  '_wiki_de_poble/02_saber/protocols_tecnics/taxonomia_documental.md',
  '_wiki_de_poble/02_saber/sistema_immunitari.md',
]);

function taulesAmplesDe(markdown) {
  const prose = markdownProse(markdown, { preserveInlineCode: true });
  const lines = prose.split(/\r?\n/);
  const trobades = [];
  let i = 0;
  while (i < lines.length) {
    if (/^\s*\|.*\|\s*$/.test(lines[i]) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      const cols = lines[i].split('|').slice(1, -1).length;
      if (cols >= 3) trobades.push({ linia: i + 1, columnes: cols, capcalera: lines[i].trim() });
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) i += 1;
    } else {
      i += 1;
    }
  }
  return trobades;
}

describe('P0-128 (R32.14) · Zero taules amples (>= 3 columnes) a tota la Wiki pública', () => {
  test('cap dels 88 fitxers seleccionats per publicWikiFiles conté taules >= 3 columnes', () => {
    const publics = publicWikiFiles(ARREL);
    expect(publics.length).toBeGreaterThanOrEqual(80);
    const infraccions = [];
    for (const abs of publics) {
      const rel = path.relative(ARREL, abs).split(path.sep).join('/');
      const amples = taulesAmplesDe(fs.readFileSync(abs, 'utf8'));
      for (const t of amples) infraccions.push(`${rel}:${t.linia} (${t.columnes} col)`);
    }
    expect(infraccions).toEqual([]);
  });

  test('els 18 documents convertits a R32.14 mantenen jerarquia H1-H6 estricta sense salts ni negretes al títol', () => {
    for (const rel of CENS_18_P0_128) {
      const raw = fs.readFileSync(path.join(ARREL, rel), 'utf8');
      const prose = markdownProse(raw, { preserveInlineCode: true });
      const linies = prose.split(/\r?\n/);
      const h1 = linies.filter((l) => /^#\s+/.test(l));
      expect(h1, rel).toHaveLength(1);
      let nivellPrevi = 0;
      linies.forEach((l, idx) => {
        const m = /^(#{1,6})\s+(.+?)\s*$/.exec(l);
        if (!m) return;
        const nivell = m[1].length;
        const titol = m[2];
        if (nivellPrevi > 0) expect(nivell, `${rel}:${idx + 1}`).toBeLessThanOrEqual(nivellPrevi + 1);
        expect(titol, `${rel}:${idx + 1}`).not.toMatch(/\*\*/);
        nivellPrevi = nivell;
      });
    }
  });

  test('cap document compilat a wikiManifest.items renderitza cap <tr> amb >= 3 cel·les <th>/<td>', () => {
    const docs = wikiManifest.items;
    expect(docs.length).toBeGreaterThanOrEqual(80);
    const filesAmples = [];
    for (const doc of docs) {
      const html = parseMarkdown(doc.content || '', { entradilla: false });
      for (const m of html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
        const nCeles = [...m[1].matchAll(/<t[hd]\b/g)].length;
        if (nCeles >= 3) filesAmples.push(`${doc.id} (${nCeles} cel·les)`);
      }
    }
    expect(filesAmples).toEqual([]);
  });

  test('les dues taules normatives curtes de 2 columnes (taxonomia i inventari_skills) es conserven intactes', () => {
    const maxCelesPerFila = (html) => Math.max(0, ...[...html.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((m) => [...m[1].matchAll(/<t[hd]\b/g)].length));
    const taxHtml = parseMarkdown(
      parseDocument(fs.readFileSync(path.join(ARREL, '_wiki_de_poble/02_saber/protocols_tecnics/taxonomia_documental.md'), 'utf8')).body,
      { entradilla: false },
    );
    expect(taxHtml).toContain('<td><code>auditoria</code></td>');
    expect(maxCelesPerFila(taxHtml)).toBe(2);

    const invHtml = parseMarkdown(
      parseDocument(fs.readFileSync(path.join(ARREL, '_wiki_de_poble/02_saber/03_consola_termodinamica/03_inventari_skills.md'), 'utf8')).body,
      { entradilla: false },
    );
    expect(invHtml).toContain('<td>skills actives</td>');
    expect(maxCelesPerFila(invHtml)).toBe(2);
  });
});
