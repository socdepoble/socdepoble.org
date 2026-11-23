import { describe, expect, test } from 'vitest';
import {
  LLENGUES_CORREU,
  REMITENT_CORREU_CANONIC,
  generaCorreuBenvinguda,
  validaUrlConfirmacio,
} from './benvingudaVerificacio.js';

describe('benvingudaVerificacio · IDEA-72 / AH-11 (plantilla multilingüe des de socdepoble@socdepoble.org)', () => {
  test.each(LLENGUES_CORREU)('genera assumpte, text pla i HTML accessible en %s amb remitent socdepoble@socdepoble.org', (llengua) => {
    const correu = generaCorreuBenvinguda({
      nom: 'Alfredo Llorens Jordá',
      usuari: 'alfredollorens',
      poble: 'La Torre de les Maçanes',
      urlConfirmacio: 'https://socdepoble.org/registre?confirma=123',
      llengua,
    });

    expect(correu.from).toBe(`Sóc de Poble <${REMITENT_CORREU_CANONIC}>`);
    expect(correu.replyTo).toBe(REMITENT_CORREU_CANONIC);
    expect(correu.llengua).toBe(llengua);
    expect(correu.subject).toContain('Sóc de Poble');
    expect(correu.text).toContain('Alfredo Llorens Jordá');
    expect(correu.text).toContain('@alfredollorens');
    expect(correu.text).toContain('La Torre de les Maçanes');
    expect(correu.text).toContain('https://socdepoble.org/registre?confirma=123');
    expect(correu.html).toContain(`lang="${llengua}"`);
    expect(correu.html).toContain('href="https://socdepoble.org/registre?confirma=123"');
  });

  test('escapa HTML maliciós al nom i rebutja URLs externes no autoritzades', () => {
    const correu = generaCorreuBenvinguda({
      nom: '<script>alert(1)</script>',
      usuari: 'usuari',
      urlConfirmacio: 'https://atacant.evil/phish',
      llengua: 'ca',
    });

    expect(correu.html).not.toContain('<script>');
    expect(correu.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(correu.urlConfirmacio).toBe('https://socdepoble.org/registre');
    expect(validaUrlConfirmacio('javascript:alert(1)')).toBe('https://socdepoble.org/registre');
  });

  test.each(LLENGUES_CORREU)('R32.45 · canònic %s: poble i usuari escapats, URL sense esquema actiu i signatura institucional', llengua => {
    const correu = generaCorreuBenvinguda({ nom: '<script>canari</script>', poble: '<img src=x onerror=canari>', usuari: '<b>canari</b>', urlConfirmacio: 'javascript:canari', llengua });
    expect(correu.html).not.toContain('<script>');
    expect(correu.html).not.toContain('<img');
    expect(correu.html).not.toContain('<b>canari</b>');
    expect(correu.html).toContain('&lt;script&gt;canari&lt;/script&gt;');
    expect(correu.html).toContain('&lt;img src=x onerror=canari&gt;');
    expect(correu.html).toContain('&lt;b&gt;canari&lt;/b&gt;');
    expect(correu.html).not.toContain('javascript:');
    expect(correu.text).toContain(REMITENT_CORREU_CANONIC);
    expect(correu.html).toContain(`lang="${llengua}"`);
  });

  test('R32.45 · llengua desconeguda usa el canònic valencià', () => {
    expect(generaCorreuBenvinguda({ llengua: 'xx' }).llengua).toBe('ca');
  });
});
