/**
 * Onada R26 · El grup de publicació de la barra de l'editor no s'encongix fora de compacte.
 *
 * Mesurat en Chrome amb el UniversalToolbar real, els fulls i la font reals: amb l'etiqueta
 * llarga («Publicar al Mur», «Actualitzar al Mur»…), deixar encongir el grup passava la barra
 * a dues files (109 px en lloc de 58) entre 500 i 618 px en les cinc llengües; amb
 * flex-shrink: 0 fora de compacte, 0 casos de dues files i 0 desbordaments. En compacte
 * (menys de 500 px) la barra conserva «Publicar» i el seu comportament de sempre.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

const MODULS = readFileSync(resolve(process.cwd(), 'src/css/modules.css'), 'utf8');

describe('barra de l’editor · grup de publicació', () => {
  test('fora de compacte, el grup de publicació porta flex-shrink: 0 dins de @layer components', () => {
    const regla = /\.sdp-editor-tools:not\(\[data-compact="true"\]\) \.sdp-editor-tools__group--publicacio \{ flex-shrink: 0; \}/;
    expect(MODULS).toMatch(regla);
    const posicio = MODULS.search(regla);
    const capa = MODULS.lastIndexOf('@layer components {', posicio);
    expect(capa).toBeGreaterThan(-1);
    expect(MODULS.slice(capa, posicio)).not.toMatch(/\n\}\n/);
  });

  test('en compacte no s’hi afig cap regla que impedisca encongir el grup', () => {
    expect(MODULS).not.toMatch(/(?<!:not\()\[data-compact="true"\][^{]*\.sdp-editor-tools__group--publicacio\s*\{[^}]*flex-shrink:\s*0/);
  });
});
