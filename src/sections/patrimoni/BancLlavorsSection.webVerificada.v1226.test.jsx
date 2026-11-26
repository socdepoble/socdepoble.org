/**
 * C26-2 #13 (Gauntlet c13, v1.2.26) · Les webs del Banc de llavors que encara no ha comprovat cap persona
 * (webVerificada: false: el Catàleg valencià i l'Atles de Catalunya) no es pinten com a enllaç a la fitxa de la
 * font (FitxaDeLaFont): l'adreça és text, sense «s’obri en una finestra nova». Les fonts verificades no canvien
 * cap píxel: el mateix <a> de sempre. La mateixa regla que la presentació del llibre (catalegsMultipoble.js).
 */
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { FONTS_BANC_LLAVORS } from '../../data/patrimoni/bancLlavors.js';
import { FitxaDeLaFont } from './BancLlavorsSection.jsx';
import { CODIS_LLENGUA_BIBLIOTECA_AGRICOLA } from './i18nBibliotecaAgricola.js';

afterEach(cleanup);

const tr = (_clau, reserva) => reserva;
const font = (id) => FONTS_BANC_LLAVORS.find((f) => f.id === id);
const SENSE_COMPROVAR = ['cataleg-valencia', 'atles-catalunya'];
const FINESTRA_NOVA = '(s’obri en una finestra nova)';

describe('C26-2 #13 · webs sense comprovar al Banc de llavors', () => {
  test('les dades: només el Catàleg valencià i l’Atles de Catalunya porten una web sense comprovar', () => {
    expect(FONTS_BANC_LLAVORS.filter((f) => f.webVerificada === false).map((f) => f.id)).toEqual(SENSE_COMPROVAR);
    for (const id of SENSE_COMPROVAR) expect([id, /^https:\/\//.test(font(id).web)]).toEqual([id, true]);
  });

  test.each(CODIS_LLENGUA_BIBLIOTECA_AGRICOLA)('%s · la fitxa de la font sense comprovar no porta cap <a>: l’adreça és text', (llengua) => {
    for (const id of SENSE_COMPROVAR) {
      const { container, unmount } = render(<FitxaDeLaFont font={font(id)} tr={tr} llengua={llengua} />);
      expect([id, container.querySelectorAll('a').length]).toEqual([id, 0]);
      const fila = [...container.querySelectorAll('tbody tr')].find((filera) => filera.querySelector('th')?.textContent === 'Web de l’entitat');
      expect([id, fila?.querySelector('td')?.textContent]).toEqual([id, font(id).web.replace(/^https:\/\//, '')]);
      expect([id, container.textContent.includes(FINESTRA_NOVA)]).toEqual([id, false]);
      unmount();
    }
  });

  test('les fonts verificades, com sempre: l’enllaç a una finestra nova', () => {
    const verificades = FONTS_BANC_LLAVORS.filter((f) => f.web && f.webVerificada !== false);
    expect(verificades.map((f) => f.id)).toEqual(['avl-mallorca', 'oliveres-gva-ivia']);
    for (const f of verificades) {
      const { container, unmount } = render(<FitxaDeLaFont font={f} tr={tr} />);
      const enllac = container.querySelector('tbody a');
      expect([f.id, enllac?.getAttribute('href'), enllac?.getAttribute('target'), enllac?.getAttribute('rel')])
        .toEqual([f.id, f.web, '_blank', 'noopener noreferrer']);
      expect([f.id, enllac.textContent]).toEqual([f.id, f.web.replace(/^https:\/\//, '')]);
      expect([f.id, enllac.closest('td').textContent]).toEqual([f.id, `${enllac.textContent} ${FINESTRA_NOVA}`]);
      unmount();
    }
  });
});
