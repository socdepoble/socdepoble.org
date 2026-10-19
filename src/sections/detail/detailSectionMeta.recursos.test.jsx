/** T5 · Les imatges del cos dels detalls (variacions del Mercat i element de
 *  Multimèdia) amb la base dels recursos. Sense base, el src de sempre. */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { buildDetailSectionMeta, buildMercatDetailSectionMeta, buildMultimediaDetailSectionMeta } from './detailSectionMeta.jsx';
import { fixaBaseRecursos } from '../../config/assetResolver.js';
import { SECTIONS } from '../../config/sections.js';
import { permetOrigenMitjans } from '../../utils/sanitize.js';

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

/* Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 1) · Expectativa
   actualitzada a propòsit: el Mercat ja no pinta una targeta per variació,
   sinó el selector i la foto de la variant triada. Les fotos de les
   variacions es recullen triant-les una per una, en l'ordre de les dades. */
const srcsDeLesVariacions = (node) => {
  const { container } = render(<>{node}</>);
  const resultat = within(container).getAllByRole('radio').map((radio) => {
    fireEvent.click(radio);
    return container.querySelector('.sdp-compra__foto')?.getAttribute('src') ?? null;
  });
  cleanup();
  return resultat;
};

/* Decisió 3 del Mestre (261007, confirmada: «Imatges externes al Mur:
   PROHIBIDES (PRIVACITAT)») · Relleu 261007 (peça «imatges-detall») · Les
   variacions són del Mercat, una secció del Mur: la foto d'una variació d'un
   origen absolut només es pinta si és nostre, i abans es pintava qualsevol.
   L'origen del paquet el registra la configuració, com l'element
   <soc-de-poble> amb el seu plugin-url (PedraSecaEmbed.jsx,
   _aplicaBaseRecursos): les dues proves el registren abans (idempotent, sense
   dependre de l'ordre). El cas de fora el fixa
   ItemDetailSection.imatgesPropies.test.jsx. */
test('sense base, les variacions del Mercat i l’element de Multimèdia porten el src de sempre', () => {
  permetOrigenMitjans(PAQUET);
  expect(srcsDeLesVariacions(buildMercatDetailSectionMeta({ t }).renderBody(PRODUCTE)))
    .toEqual([LOGO, `${PAQUET}/assets/mercat/ampolla.jpg`]);
  expect(srcsDe(buildMultimediaDetailSectionMeta({ t }).renderBody(ELEMENT))).toEqual(['/assets/towns/tibi/1.jpg']);
});

test('amb base, els /assets/ pengen del paquet i un valor ja resolt no es duplica', () => {
  fixaBaseRecursos(PAQUET);
  permetOrigenMitjans(PAQUET);
  expect(srcsDeLesVariacions(buildMercatDetailSectionMeta({ t }).renderBody(PRODUCTE)))
    .toEqual([`${PAQUET}${LOGO}`, `${PAQUET}/assets/mercat/ampolla.jpg`]);
  expect(srcsDe(buildMultimediaDetailSectionMeta({ t }).renderBody(ELEMENT)))
    .toEqual([`${PAQUET}/assets/towns/tibi/1.jpg`]);
});

/* Auditoria 261007 (B) · El «Torna» d'un detall no trobat (ItemDetailSection)
   navega a listPath: cada llista ha de ser una secció viva, mai la 404. Els
   actes tornen a /calendari, no a /events (cap ruta d'un sol tram). */
test('el listPath de cada detall és el path d’una secció viva; els actes, /calendari', () => {
  const metes = buildDetailSectionMeta({ t });
  const paths = new Set(SECTIONS.map((seccio) => seccio.path));
  expect(metes.events.listPath).toBe('/calendari');
  for (const [id, meta] of Object.entries(metes)) {
    expect(paths.has(meta.listPath), `${id} → ${meta.listPath}`).toBe(true);
  }
});

test('multimèdia no oferix una supressió fictícia al superadmin sense acció del port', () => {
  const { container } = render(buildMultimediaDetailSectionMeta({ t, rol: 'superadmin' }).renderBody(ELEMENT));
  expect(screen.queryByRole('button', { name: 'Esborra element de l’arxiu' })).toBeNull();
  expect(container.querySelector('button')).toBeNull();
  expect(container.querySelector('[style], .sdp-toolbar-admin')).toBeNull();
  expect(screen.getByRole('img', { name: 'Era' }).getAttribute('src')).toBe(ELEMENT.src);
});
