/* R51 (P0-46 / IDEA-177; forat G3 de l'auditoria R11) · L'avís de les
   alertes vigents del Mur pinta el títol cru de cada alerta. Amb un
   translation_mode protegit ('none', la revisada o un mode invàlid) el títol
   porta translate="no" i el Traduir de la pàgina (blocsTraduibles) no l'envia
   al motor; sense mode o amb l'automàtica, el DOM de sempre. L'arnés
   d'AlertaMunicipal.test.jsx. */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children)
}));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIActions: () => ({ t: (_, alternativa) => alternativa }),
  useUIState: () => ({ externalConfig: {} })
}));
import { RegioAlertesVigents } from './AlertaMunicipal.jsx';
import { blocsTraduibles } from '../../components/universal/traduccio/blocsTraduibles.js';
import { ofereixTraduir, planTraduccioPublicacio } from '../../components/universal/traduccio/planTraduccioPublicacio.js';

afterEach(cleanup);

const alerta = (id, title, extra = {}) => ({ item: { id, type: 'feed', title, ...extra }, tipus: 'alerta' });
const pinta = (alertes) => render(<RegioAlertesVigents activa alertes={alertes} />).container;
const enllac = (arrel, titol) => [...arrel.querySelectorAll('a.sdp-mur-alertes__enllac')].find((a) => a.textContent === titol);

test.each([
  ['sense mode', {}, null],
  ['l’automàtica', { translation_mode: 'on_the_fly', source_language: 'ca' }, null],
  ['«none»', { translation_mode: 'none', source_language: 'ca' }, 'no'],
  ['la revisada', { translation_mode: 'curated_5_langs', source_language: 'es' }, 'no'],
  ['un mode que no existix', { translation_mode: 'auto', source_language: 'ca' }, 'no'],
  /* Troballa DQ-01 · El veredicte del pla, el de la targeta de l'alerta al Mur: l'automàtica sense
     llengua original (o amb una que no és de les cinc) és un error, també a l'avís. */
  ['l’automàtica sense llengua original', { translation_mode: 'on_the_fly' }, 'no'],
  ['l’automàtica amb una llengua de fora de les cinc', { translation_mode: 'on_the_fly', source_language: 'fr' }, 'no']
])('%s: l’atribut translate del títol de l’alerta', (_, extra, esperat) => {
  const arrel = pinta([alerta('a1', 'Tall d’aigua', extra)]);
  expect(enllac(arrel, 'Tall d’aigua').getAttribute('translate')).toBe(esperat);
});

test('el Traduir de la pàgina no envia el títol d’una alerta protegida; el d’una alerta de sempre, sí', () => {
  const arrel = pinta([
    alerta('a1', 'Tall d’aigua de sempre'),
    alerta('a2', 'Bàndol sense traducció', { translation_mode: 'none', source_language: 'ca' })
  ]);
  const textos = blocsTraduibles(arrel).map(({ text }) => text).join('\n');
  expect(textos).toContain('Tall d’aigua de sempre');
  expect(textos).not.toContain('Bàndol sense traducció');
});

/* Troballa DQ-01 · L'avís i la targeta no discrepen: l'alerta que la targeta del Mur pinta amb
   l'error (sense Traduir, translate="no" a l'article) tampoc no ix cap al motor des de l'avís. */
test('l’avís i la targeta de l’alerta tenen el mateix veredicte (el del pla)', () => {
  const casos = [{}, { translation_mode: 'on_the_fly', source_language: 'ca' }, { translation_mode: 'on_the_fly' },
    { translation_mode: 'on_the_fly', source_language: 'fr' }, { translation_mode: 'none', source_language: 'ca' }];
  for (const [index, extra] of casos.entries()) {
    const titol = `Alerta ${index}`;
    const arrel = pinta([alerta(`a${index}`, titol, extra)]);
    const targetaTraduible = ofereixTraduir(planTraduccioPublicacio({ id: `a${index}`, type: 'feed', title: titol, ...extra }, 'ca'));
    expect(enllac(arrel, titol).getAttribute('translate'), titol).toBe(targetaTraduible ? null : 'no');
    cleanup();
  }
});
