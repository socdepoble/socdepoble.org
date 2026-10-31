/* IDEA-55 (Onada 261029_1605) · De text local a nota del Bloc de Notes:
   títol des del primer «# », títols rebaixats fora del codi, escapat abans de
   sanejar, cap script ni cap .vcf. */
import { describe, expect, test } from 'vitest';
import { MAX_TEXT_NOTA_BYTES, bytesDeText, notaDelFitxerLocal } from './notaDelFitxerLocal.js';

describe('notaDelFitxerLocal', () => {
  test('Markdown: el primer «# » és el títol, la resta de títols baixa dos nivells i la carpeta és f-notes', () => {
    const nota = notaDelFitxerLocal({ nom: 'llista.md', text: '# Llista\r\n\r\nOli i **pa**.\r\n\r\n## Secció\r\n' });
    expect(nota.title).toBe('Llista');
    expect(nota.folderId).toBe('f-notes');
    expect(nota.content).toContain('Oli');
    expect(nota.content).toContain('<strong>pa</strong>');
    expect(nota.content).toMatch(/<h[4-6][^>]*>Secció<\/h[4-6]>/);
    expect(nota.content).not.toMatch(/<h[1-3][ >]/);
  });

  test('dins d’un bloc de codi, «#» no és un títol', () => {
    const nota = notaDelFitxerLocal({ nom: 'codi.md', text: '```\n# no és títol\n```\n\n# De veres\n' });
    expect(nota.title).toBe('De veres');
    expect(nota.content).toContain('# no és títol');
  });

  test('sense «# », el títol és el nom sense extensió', () => {
    expect(notaDelFitxerLocal({ nom: 'idees soltes.md', text: 'res' }).title).toBe('idees soltes');
  });

  test('l’HTML i els scripts d’un fitxer no arriben mai a la nota', () => {
    const md = notaDelFitxerLocal({ nom: 'x.md', text: '# T\n\n<script>alert(1)</script><img src=x onerror=alert(2)>' });
    expect(md.content).not.toMatch(/<script|onerror/i);
    const txt = notaDelFitxerLocal({ nom: 'x.txt', text: '<script>alert(1)</script> l’aigua < 5 litres & la pedra' });
    expect(txt.content).toMatch(/^<pre><code>/);
    expect(txt.content).not.toContain('<script');
    expect(txt.content).toContain('&lt;script&gt;');
    expect(txt.content).toContain('&lt; 5 litres &amp; la pedra');
  });

  test('JSON, CSV i la resta de text editable van dins d’un <pre>', () => {
    for (const nom of ['dades.json', 'taula.csv', 'conf.yml', 'tauler.canvas', 'columnes.tsv']) {
      const nota = notaDelFitxerLocal({ nom, text: '{"a":1}' });
      expect([nom, nota.content.startsWith('<pre><code>')]).toEqual([nom, true]);
    }
  });

  test('codi, registres i contactes (.vcf) no s’envien', () => {
    for (const nom of ['contacte.vcf', 'pagina.html', 'estil.css', 'app.js', 'registre.log', 'foto.png', '']) {
      expect([nom, notaDelFitxerLocal({ nom, text: 'x' })]).toEqual([nom, null]);
    }
  });

  test('el topall és de 512 KiB, en bytes UTF-8', () => {
    expect(MAX_TEXT_NOTA_BYTES).toBe(512 * 1024);
    expect(bytesDeText('àé')).toBe(4);
  });
});
