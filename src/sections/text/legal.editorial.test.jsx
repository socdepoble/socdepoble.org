/* O6 · La lectura pot afegir èmfasi, mai modificar la política 2.3 segellada.
   La prova compara els bytes de cada paràgraf i de la resta del document:
   només <strong> sense atributs és admissible en els 29 paràgrafs plans. */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { legalContent } from './legalContent.js';
import { CosDeLaPagina } from './TextSection.jsx';

const SHA_23 = 'abd827d07af5aa30dc364f156a551deed4e9a43a830b9f57eca5a861ea4eadca';
const paragrafs = html => [...html.matchAll(/<p>[\s\S]*?<\/p>/g)].map(m => m[0]);
const sql23 = readFileSync(resolve(process.cwd(), 'supabase/migrations/2611012257_politica_privacitat_2_3.sql'), 'utf8');
const font = sql23.split('$politica_2_3$')[1];
const anteriors = paragrafs(font);
const plans = anteriors.map((p, i) => p.includes('<strong>') ? null : i).filter(i => i !== null);
const lectura24 = legalContent.html;
const nouRotul = "<p><em>Versió 2.4 · En vigor des del 3 de novembre de 2026. Substitueix qualsevol versió anterior d'aquest text.</em></p>";
const cosComparat = font.replace(anteriors[0], nouRotul);

function problemesDeProjeccio(original, lectura) {
  const problemes = [];
  const a = paragrafs(original), b = paragrafs(lectura);
  if (a.length !== b.length) problemes.push('nombre de paràgrafs');
  if (original.replace(/<p>[\s\S]*?<\/p>/g, '<p></p>') !== lectura.replace(/<p>[\s\S]*?<\/p>/g, '<p></p>')) problemes.push('fora dels paràgrafs');
  for (const [i, p] of a.entries()) {
    if (p.includes('<strong>')) {
      if (p !== b[i]) problemes.push(`èmfasi anterior ${i}`);
    } else if (p !== b[i]?.replace(/<\/?strong>/g, '')) problemes.push(`text, atributs o etiquetes ${i}`);
  }
  return problemes;
}

afterEach(cleanup);

describe('font històrica 2.3 intacta i font editorial 2.4 de /legal', () => {
  test('la font històrica conserva exactament l’empremta de 2.3, 72 paràgrafs i els 29 plans anteriors', () => {
    expect(createHash('sha256').update(font).digest('hex')).toBe(SHA_23);
    expect(anteriors).toHaveLength(72);
    expect(plans).toHaveLength(29);
  });

  test('la 2.4 afegix només strong i el rètol nou: cap altre canvi de text, atribut, enllaç, dada o èmfasi anterior', () => {
    const lectura = lectura24;
    expect(problemesDeProjeccio(cosComparat, lectura)).toEqual([]);
    const doc = document.createElement('div'); doc.innerHTML = lectura;
    const p = [...doc.querySelectorAll('p')];
    for (const i of plans) {
      const marques = [...p[i].querySelectorAll('strong')];
      expect(marques.length, `paràgraf ${i}`).toBeGreaterThanOrEqual(6);
      expect(marques.length, `paràgraf ${i}`).toBeLessThanOrEqual(8);
      for (const marca of marques) expect([marca.attributes.length, marca.querySelector('strong'), marca.textContent.trim().length > 0]).toEqual([0, null, true]);
    }
    expect(paragrafs(lectura)[0].replace(/<\/?strong>/g, '')).toBe(nouRotul);
  });

  test('la comprovació rebutja mutacions del text, hrefs, atributs, etiquetes, estructura i èmfasi anterior', () => {
    const lectura = lectura24;
    const mutants = [
      lectura.replace('NIF 21476359V', 'NIF 00000000X'),
      lectura.replace('href="mailto:socdepoble@socdepoble.org"', 'href="https://altre.invalid"'),
      lectura.replace('<strong>Versió 2.4</strong>', '<strong class="x">Versió 2.4</strong>'),
      lectura.replace('<strong>Versió 2.4</strong>', '<b>Versió 2.4</b>'),
      lectura.replace("<strong>l'avís legal</strong>", "l'avís legal"),
      lectura.replace('<h3>AVÍS LEGAL</h3>', '<h3>AVÍS CANVIAT</h3>'),
      lectura + '<script>canvi()</script>'
    ];
    for (const mutant of mutants) {
      expect(mutant).not.toBe(lectura);
      expect(problemesDeProjeccio(cosComparat, mutant).length).toBeGreaterThan(0);
    }
  });

  test('el lector real pinta 6–8 negretes en cadascun dels 29 paràgrafs plans, conservant les paraules', () => {
    const html = plans.map(i => paragrafs(lectura24)[i]).join('');
    const { container } = render(<CosDeLaPagina html={html} />);
    const p = [...container.querySelectorAll('article.cms-preview > p')];
    expect(p).toHaveLength(29);
    const textAbans = document.createElement('div'); textAbans.innerHTML = html;
    expect(container.textContent).toBe(textAbans.textContent);
    for (const node of p) {
      expect(node.querySelectorAll('strong').length).toBeGreaterThanOrEqual(6);
      expect(node.querySelectorAll('strong').length).toBeLessThanOrEqual(8);
    }
  });

  test('la versió nova és el text de PAGE_COPY sense cap API de projecció ni canvi de metadades', async () => {
    const { PAGE_COPY } = await import('./pageContent.js');
    expect(PAGE_COPY.legal).toBe(legalContent);
    expect(legalContent.date).toBe('2026-09-09T00:00:00.000Z');
    expect(paragrafs(lectura24).filter(p => !p.includes('<strong>'))).toHaveLength(0);
  });
});
