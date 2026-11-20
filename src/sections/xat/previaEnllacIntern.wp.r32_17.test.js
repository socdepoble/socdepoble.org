import { afterEach, describe, expect, test } from 'vitest';
import {
  fixaBaseRecursos,
  fixaPoliticaDeMitjans
} from '../../config/assetResolver.js';
import { MITJANS_EXTERNS_DEL_DIRECTORI } from '../../config/politicaDeMitjans.js';
import {
  extreuPreviaInterna,
  resolMiniaturaPreviaInterna
} from './previaEnllacIntern.js';

describe('Onada R32.17 · Lot 03 · Miniatures d’enllaç intern del Xat al connector WordPress', () => {
  afterEach(() => {
    fixaBaseRecursos('/');
    fixaPoliticaDeMitjans(null);
  });

  test('sense base d’amfitrió ni política, conserva el camí canònic /assets/… intacte (Llei del Píxel)', () => {
    const mur = extreuPreviaInterna('Mireu https://socdepoble.org/mur/copies-seguretat-farcellet');
    expect(mur).toMatchObject({
      ruta: '/mur/copies-seguretat-farcellet',
      domini: 'socdepoble.org',
      imatgeUrl: '/assets/mur/copies_seguretat_farcellet_hero.webp'
    });

    const pagina = extreuPreviaInterna('Consulteu /page/guia per començar.');
    expect(pagina).toMatchObject({
      ruta: '/page/guia',
      domini: 'socdepoble.org',
      imatgeUrl: '/assets/soc_de_poble_ibanez.webp'
    });

    expect(resolMiniaturaPreviaInterna('assets/soc_de_poble_ibanez.webp')).toBe('/assets/soc_de_poble_ibanez.webp');
  });

  test('incrustat en un connector WordPress autònom (amb base de paquet), resol la miniatura dins del paquet dist/', () => {
    fixaBaseRecursos('https://ajuntament.poble.cat/wp-content/plugins/socdepoble/dist/');

    const pagina = extreuPreviaInterna('Llegiu https://socdepoble.org/page/node-zero');
    expect(pagina?.imatgeUrl).toBe(
      'https://ajuntament.poble.cat/wp-content/plugins/socdepoble/dist/assets/soc_de_poble_ibanez.webp'
    );

    const iaia = extreuPreviaInterna('Parleu amb /iaia quan vulgueu.');
    expect(iaia?.imatgeUrl).toBe(
      'https://ajuntament.poble.cat/wp-content/plugins/socdepoble/dist/assets/uploads/brain/xat_portada.webp'
    );

    expect(resolMiniaturaPreviaInterna('assets/soc_de_poble_ibanez.webp')).toBe(
      'https://ajuntament.poble.cat/wp-content/plugins/socdepoble/dist/assets/soc_de_poble_ibanez.webp'
    );
  });

  test('en la variant del directori WordPress.org (assets/mur/ extern), resol Mur a socdepoble.org i la miniatura base al paquet', () => {
    fixaBaseRecursos('https://ajuntament.poble.cat/wp-content/plugins/socdepoble/dist');
    fixaPoliticaDeMitjans({
      origen: MITJANS_EXTERNS_DEL_DIRECTORI.origen,
      externs: MITJANS_EXTERNS_DEL_DIRECTORI.prefixos,
      bessones: ['assets/avatars/iaia_comic_matriarch.png']
    });

    const farcellet = extreuPreviaInterna('https://socdepoble.org/mur/copies-seguretat-farcellet');
    expect(farcellet?.imatgeUrl).toBe(
      'https://socdepoble.org/assets/mur/copies_seguretat_farcellet_hero.webp'
    );

    const guia = extreuPreviaInterna('Vegeu /page/guia');
    expect(guia?.imatgeUrl).toBe(
      'https://ajuntament.poble.cat/wp-content/plugins/socdepoble/dist/assets/soc_de_poble_ibanez.webp'
    );

    const iaia = extreuPreviaInterna('Entreu a /anima');
    expect(iaia?.imatgeUrl).toBe(
      'https://socdepoble.org/assets/uploads/brain/xat_portada.webp'
    );
  });
});
