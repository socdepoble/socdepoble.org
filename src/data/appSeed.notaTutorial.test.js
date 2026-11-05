// @vitest-environment node
/* O6-CLAUDE-2 (ordre del Mestre, Onada 6, 261103; Gauntlet O6, NOTA-01) · La Card tutorial «Bloc de
   notes» (NOTES_SEED[0]) no tenia cap guarda: la versió anterior es va quedar desfasada sense que
   caiguera cap prova. Esta fixa la forma editorial de l'Onada 6 (subtítols <h4> i paràgrafs, cap
   llista de punts), la densitat de negretes d'escaneig de cada paràgraf i que els noms de la
   interfície que cita la Card existixen de veres al codi que la pinta. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { NOTES_SEED } from './appSeed.js';

const CONTINGUT = NOTES_SEED[0].content;
const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const SEGMENTADOR = new Intl.Segmenter('ca', { granularity: 'word' });
const paraules = (text) => [...SEGMENTADOR.segment(text)].filter((tros) => tros.isWordLike).length;
/* El contracte de l'Onada 6: ≥40 paraules → 6–8 <strong>; 25–39 → 5–7; 12–24 → 2–4; <12 → 1–3. */
const tram = (n) => (n >= 40 ? [6, 8] : n >= 25 ? [5, 7] : n >= 12 ? [2, 4] : [1, 3]);

describe('NOTES_SEED[0] · la Card tutorial «Bloc de notes»', () => {
  test('subtítols <h4> i paràgrafs, sense llistes de punts', () => {
    expect(NOTES_SEED[0].title).toBe('Bloc de notes');
    expect(CONTINGUT).not.toMatch(/<ul\b|<li\b/);
    expect(CONTINGUT.match(/<h4>/g) ?? []).toHaveLength(6);
  });

  test('cada paràgraf porta les negretes d’escaneig del seu tram, cap pla', () => {
    const paragrafs = CONTINGUT.match(/<p>[\s\S]*?<\/p>/g) ?? [];
    expect(paragrafs.length).toBeGreaterThan(0);
    for (const p of paragrafs) {
      const n = paraules(p.replace(/<[^>]+>/g, ''));
      const [minim, maxim] = tram(n);
      const negretes = (p.match(/<strong>/g) ?? []).length;
      expect(negretes, p.slice(0, 80)).toBeGreaterThanOrEqual(minim);
      expect(negretes, p.slice(0, 80)).toBeLessThanOrEqual(maxim);
    }
  });

  test('els noms de la interfície que cita la Card són els del codi', () => {
    for (const [nom, fitxer] of [
      ['Edició avançada', 'src/components/universal/UniversalEditorShell.jsx'],
      ['On es publica?', 'src/components/universal/ambits/BlocAmbit.jsx'],
      ['Vista en format Card', 'src/components/universal/ambits/BlocAmbit.jsx'],
      ['CREAR NOTA', 'src/sections/notes/NotesSection.jsx'],
      ['Publicar', 'src/components/universal/UniversalToolbar.jsx']
    ]) {
      expect(CONTINGUT, nom).toContain(nom);
      expect(llig(fitxer), `${nom} a ${fitxer}`).toContain(nom);
    }
  });
});
