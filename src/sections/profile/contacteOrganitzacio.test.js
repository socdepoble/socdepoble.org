import { expect, test } from 'vitest';
import { enllacMailto, textAjudaCorreu, validaCorreu } from './contacteOrganitzacio.js';

/* T43 (ordre del Mestre, 260928) · textos del correu de l'organització. */

test('només la persona titular veu el seu correu; la resta llig qui és, no quin correu té', () => {
  expect(textAjudaCorreu({ origen: 'creador', correu: 'jo@poble.cat' })).toContain('al teu correu (jo@poble.cat), perquè vas crear l’organització');
  const altra = textAjudaCorreu({ origen: 'creador', correu: null });
  expect(altra).toContain('al correu de la persona que la va crear');
  expect(altra).not.toContain('@');
  expect(textAjudaCorreu({ origen: 'propietaria', correu: 'jo@poble.cat' })).toContain('perquè en tens la propietat');
  expect(textAjudaCorreu({ origen: 'propietaria', correu: null })).toContain('la persona que en té la propietat');
  expect(textAjudaCorreu({ origen: 'cap' })).toContain('no rebrà avisos per correu');
  expect(textAjudaCorreu(undefined)).toContain('no rebrà avisos per correu');
  for (const text of [altra, textAjudaCorreu({ origen: 'cap' })]) expect(text).toContain('només el veuen les persones que l’administren');
});

test('el mailto només es munta sobre un correu segur: cap capçalera injectada', () => {
  expect(enllacMailto(' forn@exemple.cat ')).toBe('mailto:forn@exemple.cat');
  for (const dolent of ['', null, 'forn@exemple.cat?cc=altre@x.cat', 'forn@exemple.cat&body=hola', 'a b@x.cat', 'forn@exemple.cat\nBcc: x@y.cat', 'javascript:alert(1)']) {
    expect(enllacMailto(dolent), String(dolent)).toBeNull();
  }
  expect(validaCorreu('forn@exemple.cat')).toBe(true);
});
