/**
 * Escombrada del xat amb la base dels recursos (T5, 261001).
 *
 * El camí de veritat dels dos 404 de gentdelatorre.net: la llavor del xat
 * (localXat en mode seed) → mapejaFil → les files de la llista. La IAIA
 * arriba amb l'avatar vigent d'AGENTS_MAP i la comunitat «Sóc de Poble» amb
 * el logo cuadrat-verd. Sense base han de quedar com sempre; amb la base del
 * paquet, cap <img> del xat pot demanar '/assets/…' a l'arrel de l'amfitrió.
 * No es munta la secció sencera (contextos, rail, mides): les files són on es
 * pinten els avatars, i és el que es compta.
 */
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test } from 'vitest';
import FilaConversa, { FilaComunitat } from '../../../sections/xat/components/FilaConversa.jsx';
import { agrupaComunitats, mapejaFil } from '../../../sections/xat/missatges.js';
import { localXat, reiniciaLocalXat } from '../../../data/localXat.js';
import { fixaBaseRecursos } from '../../../config/assetResolver.js';
import { CARA_DE_LA_IAIA } from '../../../data/xatsPerDefecte.js';

/* Onada 6 (tasca 12) · La IAIA arriba amb l'avatar d'AGENTS_MAP i el xat en
   pinta la cara: «Festa del Poble», enquadrada (CaraXat). */
const IAIA = CARA_DE_LA_IAIA.src;
/* Onada 8 (261009) · El logo de la comunitat és el PNG de la llavor (abans, l'SVG). */
const LOGO = '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png';
/* Mateix origen que la pàgina, com el plugin-url de WordPress. */
const PAQUET = `${window.location.origin}/wp-content/plugins/socdepoble-enxufe/dist`;
const t = (_clau, alternativa) => alternativa;

beforeEach(() => reiniciaLocalXat());
afterEach(() => {
  cleanup();
  fixaBaseRecursos('/');
});

async function pintaLaLlistaDelXat() {
  const fils = (await localXat.loadFils({ dataMode: 'seed', tenantId: '00000000-0000-0000-0000-000000000000' })).map((fil) => mapejaFil(fil));
  const { container } = render(
    <>
      {agrupaComunitats(fils).map((comunitat) => (
        <FilaComunitat key={comunitat.fil.id} comunitat={comunitat} onObri={() => {}} t={t} />
      ))}
      {fils.filter((fil) => fil.tipus !== 'comunitat').map((fil) => (
        <FilaConversa key={fil.id} fil={fil} onSelect={() => {}} t={t} locale="ca-ES" />
      ))}
    </>
  );
  return [...container.querySelectorAll('img')].map((img) => img.getAttribute('src'));
}

test('sense base, la llista del xat pinta la IAIA i el logo de la comunitat com sempre', async () => {
  const srcs = await pintaLaLlistaDelXat();
  expect(srcs).toContain(IAIA);
  expect(srcs).toContain(LOGO);
});

test('amb la base del paquet, cap img del xat demana /assets/ a l’arrel: la IAIA i el logo pengen del paquet', async () => {
  fixaBaseRecursos(PAQUET);
  const srcs = await pintaLaLlistaDelXat();
  expect(srcs.filter((src) => src.startsWith('/assets/'))).toEqual([]);
  expect(srcs).toContain(`${PAQUET}${IAIA}`);
  expect(srcs).toContain(`${PAQUET}${LOGO}`);
});
