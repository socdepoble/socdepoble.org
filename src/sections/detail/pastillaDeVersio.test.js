// @vitest-environment node
/* P1-46 (Llibre Mestre, Fita 10; guàrdia nocturna 261030, Fase 3) · La
   pastilla de versió de /page/descarregues (pastillaDeVersio.js): la versió
   de package.json, una sola font, i l'enllaç a /versions; cap altra pàgina. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { PAGINA_DE_LA_PASTILLA, pastillaDeVersio } from './pastillaDeVersio.js';
import { SYSTEM_PAGES } from '../../config/systemPages.js';

const { version } = JSON.parse(readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
const t = (clau, reserva) => ({ 'section.text.versio': 'Version' }[clau] ?? reserva);

describe('pastillaDeVersio', () => {
  test('Descàrregues: «Versió» + la versió de package.json, etiqueta de tipus i enllaç a /versions', () => {
    expect(PAGINA_DE_LA_PASTILLA).toBe('descarregues');
    expect(pastillaDeVersio('descarregues', (_c, r) => r, null))
      .toEqual({ text: `Versió ${version}`, className: 'sdp-badge-tag', href: '/versions' });
    // /versions és una pàgina del sistema de veres.
    expect(SYSTEM_PAGES.find((p) => p.key === 'versions')?.href).toBe('/versions');
  });

  test('el nom ve del traductor de la interfície; sense traductor, en valencià', () => {
    expect(pastillaDeVersio('descarregues', t, null).text).toBe(`Version ${version}`);
    expect(pastillaDeVersio('descarregues', undefined, null).text).toBe(`Versió ${version}`);
    expect(pastillaDeVersio('descarregues', () => '', null).text).toBe(`Versió ${version}`);
  });

  test('amb el build segellat (aammdd), el segell; un segell que no és de sis xifres, res', () => {
    expect(pastillaDeVersio('descarregues', t, '261030').text).toBe(`Version ${version} (build 261030)`);
    for (const build of ['2610301', '26103', 'abcdef', '', 261030, undefined, null]) {
      expect(pastillaDeVersio('descarregues', t, build).text, String(build)).toBe(`Version ${version}`);
    }
  });

  test('cap altra pàgina en porta: null', () => {
    for (const clau of ['consola', 'xat', 'drets-autor', 'versions', 'Descarregues', '', undefined, null, 'constructor']) {
      expect(pastillaDeVersio(clau, t), String(clau)).toBeNull();
    }
  });

  test('cap promesa de botiga: el text és només la versió', () => {
    expect(pastillaDeVersio('descarregues', t, '261030').text).not.toMatch(/prompte|aviat|pròximament|soon|Google|App Store/i);
  });
});
