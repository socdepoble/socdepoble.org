/* Gauntlet 261022_0225 (crítica Claude) · IAIA-4. La primera bombolla de la
   IAIA al xat de mostra és la salutació del Mestre en la llengua de la
   interfície, com la segona (section.xat.fake.iaia2). Abans era el literal
   valencià en les cinc llengües. */
import '../../../../tests/helpers/diccionaris.js';
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { useContext } from 'react';

const llengua = vi.hoisted(() => ({ codi: 'ca' }));
vi.mock('../../../app/contexts/UIContext.jsx', async () => {
  const { createTranslator } = await import('../../../config/i18n.js');
  return {
    useUIActions: () => ({ t: createTranslator(llengua.codi) }),
    useUIState: () => ({ externalConfig: {} })
  };
});
vi.mock('../../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ status: 'ready', towns: [] }) }));

import FakeChatOnboarding from './FakeChatOnboarding.jsx';
import { XatContext } from '../XatContext.jsx';
import { BENVINGUDA_IAIA } from '../../../data/identitatsSeed.js';
import CA from '../../../config/idiomes/ca.js';
import EN from '../../../config/idiomes/en.js';
import ES from '../../../config/idiomes/es.js';

let valor;
function Sonda() {
  valor = useContext(XatContext);
  return null;
}
const primeraDeLaIAIA = (codi) => {
  llengua.codi = codi;
  render(<FakeChatOnboarding originalContext={{ senseSessio: true, comunitats: [] }}><Sonda /></FakeChatOnboarding>);
  return valor.getThreadMessages('fake-iaia').map((missatge) => missatge.text);
};

afterEach(cleanup);

test('en valencià, la salutació literal del Mestre', () => {
  expect(CA['section.xat.iaia.salutacio']).toBe(BENVINGUDA_IAIA);
  expect(primeraDeLaIAIA('ca')).toEqual([BENVINGUDA_IAIA, CA['section.xat.fake.iaia2']]);
});

test.each([['en', EN], ['es', ES]])('en %s, les dos bombolles de la IAIA en la mateixa llengua', (codi, diccionari) => {
  expect(primeraDeLaIAIA(codi)).toEqual([diccionari['section.xat.iaia.salutacio'], diccionari['section.xat.fake.iaia2']]);
  expect(diccionari['section.xat.iaia.salutacio']).not.toBe(BENVINGUDA_IAIA);
});

test('la clau antiga section.xat.fake.iaia1 ja no és a cap diccionari', () => {
  expect(Object.hasOwn(CA, 'section.xat.fake.iaia1')).toBe(false);
  expect(Object.hasOwn(EN, 'section.xat.fake.iaia1')).toBe(false);
});
