/* Gauntlet 261017 (M07, C07) · On porta /multimedia/:itemId
   (rutesMultimedia.js · destiDeMultimedia). Els casos de sempre (els de
   panellDeLaFoto.test.js, copiats ací perquè la peça tinga la seua prova), el
   fragment que es perdia (la reproducció de Codex: '#galeria') i el prefix en
   qualsevol caixa. Pura: cap router, cap DOM. */
import { describe, expect, test } from 'vitest';
import { destiDeMultimedia } from './rutesMultimedia.js';

describe('destiDeMultimedia', () => {
  test('town-<slug> a /pobles/<slug> amb la consulta; la resta, a l’Arxiu amb el visor obert', () => {
    expect(destiDeMultimedia('town-benifallim')).toBe('/pobles/benifallim');
    expect(destiDeMultimedia('town-la-torre-de-les-macanes', '?a=1&b=dos')).toBe('/pobles/la-torre-de-les-macanes?a=1&b=dos');
    expect(destiDeMultimedia('nano-mur')).toBe('/multimedia?foto=nano-mur');
    expect(destiDeMultimedia('market-mac-mini-m4', '?x=1')).toBe('/multimedia?x=1&foto=market-mac-mini-m4');
    expect(destiDeMultimedia('foto amb espai & coses')).toBe('/multimedia?foto=foto+amb+espai+%26+coses');
    expect(destiDeMultimedia('town-')).toBe('/multimedia?foto=town-');
    expect([destiDeMultimedia(''), destiDeMultimedia(null), destiDeMultimedia(undefined)]).toEqual([null, null, null]);
  });

  test('C07 · el fragment es conserva darrere de la consulta, als dos destins', () => {
    expect(destiDeMultimedia('town-benifallim', '?tema=flora&tema=aigua', '#galeria'))
      .toBe('/pobles/benifallim?tema=flora&tema=aigua#galeria');
    expect(destiDeMultimedia('town-benifallim', '', '#galeria')).toBe('/pobles/benifallim#galeria');
    expect(destiDeMultimedia('nano-mur', '?origen=xat', '#info')).toBe('/multimedia?origen=xat&foto=nano-mur#info');
    // Un '?' dins del fragment és del fragment: no toca la consulta.
    expect(destiDeMultimedia('town-sella', '?a=1', '#x?b=2')).toBe('/pobles/sella?a=1#x?b=2');
  });

  test('un fragment buit, sense «#» o que no és text no afig res', () => {
    for (const hash of ['', '#', 'galeria', null, undefined, 42, {}]) {
      expect([hash, destiDeMultimedia('town-benifallim', '?a=1', hash)]).toEqual([hash, '/pobles/benifallim?a=1']);
    }
    expect(destiDeMultimedia('nano-mur', '', '#')).toBe('/multimedia?foto=nano-mur');
  });

  test('la consulta es conserva pel valor, amb les claus repetides i en el seu ordre (com el router)', () => {
    expect(destiDeMultimedia('town-tibi', '?debug')).toBe('/pobles/tibi?debug=');
    expect(destiDeMultimedia('town-tibi', 'q=a%20b&r=a+b')).toBe('/pobles/tibi?q=a+b&r=a+b');
    expect(destiDeMultimedia('town-tibi', '?t=1&t=2&u=3')).toBe('/pobles/tibi?t=1&t=2&u=3');
    // Una consulta que no és text no trenca res.
    expect(destiDeMultimedia('town-tibi', null)).toBe('/pobles/tibi');
  });

  test('el prefix en qualsevol caixa porta al poble; l’id del poble torna a minúscules', () => {
    expect(destiDeMultimedia('Town-Benifallim')).toBe('/pobles/benifallim');
    expect(destiDeMultimedia('TOWN-LA-TORRE-DE-LES-MACANES', '?a=1', '#galeria')).toBe('/pobles/la-torre-de-les-macanes?a=1#galeria');
    expect(destiDeMultimedia('tOwN-sella')).toBe('/pobles/sella');
    expect(destiDeMultimedia('Town-')).toBe('/multimedia?foto=Town-');
    // Amb el prefix canònic (el que escriu l'app), l'id tal qual: el de resolveItemPath.
    expect(destiDeMultimedia('town-Benifallim')).toBe('/pobles/Benifallim');
    // Un id que només comença semblant no és d'un poble.
    expect(destiDeMultimedia('townhall-1')).toBe('/multimedia?foto=townhall-1');
    expect(destiDeMultimedia('my-town-x')).toBe('/multimedia?foto=my-town-x');
  });

  test('el slug es codifica: cap «/», «?» ni «#» no se n’escapa, i el destí és sempre una ruta de l’app', () => {
    expect(destiDeMultimedia('town-penàguila')).toBe('/pobles/pen%C3%A0guila');
    expect(destiDeMultimedia('town-a/b')).toBe('/pobles/a%2Fb');
    expect(destiDeMultimedia('town-a?b#c', '?x=1', '#h')).toBe('/pobles/a%3Fb%23c?x=1#h');
    expect(destiDeMultimedia('town-/fora.example')).toBe('/pobles/%2Ffora.example');
    for (const id of ['town-//fora.example', 'town-\\fora.example', '//fora.example', 'https://fora.example/x']) {
      const desti = destiDeMultimedia(id, '?a=1', '#h');
      expect([id, desti.startsWith('/'), desti.startsWith('//'), desti.includes('\\')]).toEqual([id, true, false, false]);
    }
  });

  test('determinista: la mateixa entrada, el mateix destí', () => {
    const una = destiDeMultimedia('Town-Penàguila', '?a=1', '#g');
    expect(destiDeMultimedia('Town-Penàguila', '?a=1', '#g')).toBe(una);
    expect(una).toBe('/pobles/pen%C3%A0guila?a=1#g');
  });
});
