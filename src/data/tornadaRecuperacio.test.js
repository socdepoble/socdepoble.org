// @vitest-environment-options {"url": "https://gentdelatorre.net/una/pagina?x=1"}
/* R · Onada 3 (261003) · Lectura i neteja pura de la tornada d'un enllaç de
   recuperació de contrasenya (tornadaRecuperacio.js). */
import { afterEach, describe, expect, it } from 'vitest';
import {
  MOTIU_TORNADA, llegixTornadaDeRecuperacio, netejaTornadaDeRecuperacio, rutaSenseRecuperacio
} from './tornadaRecuperacio.js';

const PAGINA = 'https://gentdelatorre.net/una/pagina?x=1';
const HASH = 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c';

afterEach(() => { window.history.replaceState(null, '', '/una/pagina?x=1'); });

describe('llegixTornadaDeRecuperacio', () => {
  it('llig el token_hash del fragment (la forma recomanada) i també de la consulta', () => {
    expect(llegixTornadaDeRecuperacio(`${PAGINA}#token_hash=${HASH}&type=recovery`)).toEqual({ tokenHash: HASH });
    expect(llegixTornadaDeRecuperacio(`${PAGINA}&token_hash=${HASH}&type=recovery`)).toEqual({ tokenHash: HASH });
    expect(llegixTornadaDeRecuperacio(`${PAGINA}#type=recovery&token_hash=pkce_${HASH}`)).toEqual({ tokenHash: `pkce_${HASH}` });
  });

  it('reconeix la forma implícita només per a dir-ho, mai en torna cap token', () => {
    expect(llegixTornadaDeRecuperacio(`${PAGINA}#access_token=a&refresh_token=b&type=recovery`)).toEqual({ motiu: MOTIU_TORNADA.IMPLICITA });
  });

  it('un token_hash amb una forma estranya no s’accepta', () => {
    for (const dolent of ['curt', 'amb espai aaaaaaaaaaaaaaaaa', `${HASH}"}`, 'a'.repeat(300)]) {
      expect(llegixTornadaDeRecuperacio(`${PAGINA}#token_hash=${encodeURIComponent(dolent)}&type=recovery`), dolent)
        .toEqual({ motiu: MOTIU_TORNADA.MALFORMADA });
    }
  });

  it('sense type=recovery no és cap tornada de recuperació (ni una d’alta, ni la d’OAuth, ni una pàgina normal)', () => {
    expect(llegixTornadaDeRecuperacio(`${PAGINA}#token_hash=${HASH}&type=signup`)).toBeNull();
    expect(llegixTornadaDeRecuperacio(`${PAGINA}&code=abc`)).toBeNull();
    expect(llegixTornadaDeRecuperacio(`${PAGINA}#access_token=a&type=signup`)).toBeNull();
    expect(llegixTornadaDeRecuperacio(PAGINA)).toBeNull();
    expect(llegixTornadaDeRecuperacio('no és una url')).toBeNull();
    expect(llegixTornadaDeRecuperacio(undefined)).toBeNull();
  });
});

describe('rutaSenseRecuperacio', () => {
  it('lleva el fragment de recuperació sencer i deixa la consulta literal', () => {
    expect(rutaSenseRecuperacio(`https://gentdelatorre.net/una/pagina?buit&a=b%20c#token_hash=${HASH}&type=recovery`))
      .toBe('/una/pagina?buit&a=b%20c');
    expect(rutaSenseRecuperacio(`${PAGINA}#access_token=a&refresh_token=b&type=recovery`)).toBe('/una/pagina?x=1');
  });

  it('de la consulta lleva token_hash i type=recovery, i res més', () => {
    expect(rutaSenseRecuperacio(`https://gentdelatorre.net/una/pagina?x=1&token_hash=${HASH}&type=recovery&y=2`))
      .toBe('/una/pagina?x=1&y=2');
    expect(rutaSenseRecuperacio(`https://gentdelatorre.net/una/pagina?token_hash=${HASH}&type=recovery`)).toBe('/una/pagina');
  });

  it('un `type` de la pàgina amfitriona sense token_hash no és nostre, i un fragment seu tampoc', () => {
    expect(rutaSenseRecuperacio('https://gentdelatorre.net/botiga?type=recovery')).toBe('/botiga?type=recovery');
    expect(rutaSenseRecuperacio(`https://gentdelatorre.net/botiga?type=producte&token_hash=${HASH}`)).toBe('/botiga?type=producte');
    expect(rutaSenseRecuperacio('https://gentdelatorre.net/botiga?x=1#seccio-3')).toBe('/botiga?x=1#seccio-3');
  });

  it('una entrada que no és URL torna null', () => {
    expect(rutaSenseRecuperacio('::')).toBeNull();
  });
});

describe('netejaTornadaDeRecuperacio', () => {
  it('reescriu la barra d’adreces sense afegir cap entrada a l’historial i conserva l’estat', () => {
    window.history.replaceState({ propi: 1 }, '', `/una/pagina?x=1#token_hash=${HASH}&type=recovery`);
    const llargada = window.history.length;
    netejaTornadaDeRecuperacio();
    expect(window.location.href).toBe(PAGINA);
    expect(window.history.length).toBe(llargada);
    expect(window.history.state).toEqual({ propi: 1 });
  });

  it('sense restes no toca res', () => {
    window.history.replaceState(null, '', '/una/pagina?x=1#seccio');
    netejaTornadaDeRecuperacio();
    expect(window.location.href).toBe(`${PAGINA}#seccio`);
  });
});
