import { describe, expect, test } from 'vitest';
import {
  IDIOMES_CORREU_BENVINGUDA,
  PLANTILLA_SUPABASE_AUTH_TEMPLATES_SQL,
  generaCorreuBenvinguda,
  normalitzaIdiomaCorreu,
} from './correuBenvinguda.js';

describe('correuBenvinguda · IDEA-72 (Plantilla càlida post-registre en 5 idiomes)', () => {
  test.each(IDIOMES_CORREU_BENVINGUDA)('genera assumpte, textPla i HTML Pedra Seca complet en %s amb els 3 passos i signatura', (idioma) => {
    const correu = generaCorreuBenvinguda({
      nom: 'Alfredo Llorens',
      poble: 'La Torre de les Maçanes',
      idioma,
    });

    expect(correu.idioma).toBe(idioma);
    expect(correu.assumpte).toContain('Sóc de Poble');
    expect(correu.textPla).toContain('Alfredo Llorens');
    expect(correu.textPla).toContain('La Torre de les Maçanes');
    expect(correu.textPla).toContain('(/mur)');
    expect(correu.textPla).toContain('(/xat)');
    expect(correu.textPla).toContain('(/pobles)');
    expect(correu.textPla).toContain('Javi Llinares');
    expect(correu.textPla).toContain('IAIA MarIA');

    expect(correu.html).toContain(`<html lang="${idioma}">`);
    expect(correu.html).toContain('{{ .ConfirmationURL }}');
    expect(correu.html).toContain('https://socdepoble.org');
  });

  test('escapa qualsevol intent d’injecció HTML o esquema javascript: en nom, poble i URL', () => {
    const correu = generaCorreuBenvinguda({
      nom: '<script>alert(1)</script>',
      poble: '<img src=x onerror=alert(1)>',
      idioma: 'xx-inexistent',
      urlConfirmacio: 'javascript:alert(1)',
    });

    expect(correu.idioma).toBe('ca');
    expect(correu.html).not.toContain('<script>');
    expect(correu.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(correu.html).not.toContain('javascript:alert(1)');
    expect(PLANTILLA_SUPABASE_AUTH_TEMPLATES_SQL).toContain('{{ .ConfirmationURL }}');
  });

  test('normalitzaIdiomaCorreu resol variants amb regió com es-ES o en-GB i torna a ca per defecte', () => {
    expect(normalitzaIdiomaCorreu('es-ES')).toBe('es');
    expect(normalitzaIdiomaCorreu('EN-GB')).toBe('en');
    expect(normalitzaIdiomaCorreu('eu_ES')).toBe('eu');
    expect(normalitzaIdiomaCorreu('gl')).toBe('gl');
    expect(normalitzaIdiomaCorreu('fr')).toBe('ca');
  });
});
