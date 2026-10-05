/** T5 · Les imatges del cos dels detalls (variacions del Mercat i element de
 *  Multimèdia) amb la base dels recursos. Sense base, el src de sempre. */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { buildMercatDetailSectionMeta, buildMultimediaDetailSectionMeta } from './detailSectionMeta.jsx';
import { fixaBaseRecursos } from '../../config/assetResolver.js';

const PAQUET = 'https://wp.example/wp-content/plugins/socdepoble-enxufe/dist';
const LOGO = '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg';
const t = (_clau, text) => text;

const PRODUCTE = {
  title: 'Oli',
  variations: [
    { name: 'Garrafa', image: LOGO, price: '20 €' },
    { name: 'Ampolla', image: `${PAQUET}/assets/mercat/ampolla.jpg`, price: '8 €' }
  ]
};
const ELEMENT = { title: 'Era', src: '/assets/towns/tibi/1.jpg', tag: 'Poble' };

afterEach(() => {
  cleanup();
  fixaBaseRecursos('/');
});

const srcsDe = (node) => {
  const { container } = render(<>{node}</>);
  const resultat = [...container.querySelectorAll('img')].map((img) => img.getAttribute('src'));
  cleanup();
  return resultat;
};

test('sense base, les variacions del Mercat i l’element de Multimèdia porten el src de sempre', () => {
  expect(srcsDe(buildMercatDetailSectionMeta({ t }).renderBody(PRODUCTE)))
    .toEqual([LOGO, `${PAQUET}/assets/mercat/ampolla.jpg`]);
  expect(srcsDe(buildMultimediaDetailSectionMeta({ t }).renderBody(ELEMENT))).toEqual(['/assets/towns/tibi/1.jpg']);
});

test('amb base, els /assets/ pengen del paquet i un valor ja resolt no es duplica', () => {
  fixaBaseRecursos(PAQUET);
  expect(srcsDe(buildMercatDetailSectionMeta({ t }).renderBody(PRODUCTE)))
    .toEqual([`${PAQUET}${LOGO}`, `${PAQUET}/assets/mercat/ampolla.jpg`]);
  expect(srcsDe(buildMultimediaDetailSectionMeta({ t }).renderBody(ELEMENT)))
    .toEqual([`${PAQUET}/assets/towns/tibi/1.jpg`]);
});

test('multimèdia no oferix una supressió fictícia al superadmin sense acció del port', () => {
  const { container } = render(buildMultimediaDetailSectionMeta({ t, rol: 'superadmin' }).renderBody(ELEMENT));
  expect(screen.queryByRole('button', { name: 'Esborra element de l’arxiu' })).toBeNull();
  expect(container.querySelector('button')).toBeNull();
  expect(container.querySelector('[style], .sdp-toolbar-admin')).toBeNull();
  expect(screen.getByRole('img', { name: 'Era' }).getAttribute('src')).toBe(ELEMENT.src);
});
