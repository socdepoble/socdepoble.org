/**
 * R22 (Llibre Mestre, «4a Etiqueta Geogràfica Final») · La pàgina d'un
 * producte del Mercat porta la pastilla del poble com a última etiqueta, la
 * mateixa que la seua targeta. Una pàgina de poble no la porta (ja és el
 * poble). El Mur i l'Agenda encara no la porten (abast parcial de R22,
 * pendent del Mestre): estes proves no ho fixen com a comportament volgut.
 * Dades sintètiques.
 */
import { expect, test, vi } from 'vitest';

vi.mock('../mur/MurContext', () => ({ useMur: () => ({ status: 'ready', feedPosts: [], events: [], marketItems: [] }) }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ status: 'ready', towns: [] }) }));
vi.mock('../multimedia/MultimediaContext', () => ({ useMultimedia: () => ({ status: 'ready', mediaItems: [] }) }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: (_, alternativa) => alternativa }) }));

import { paginaDElement } from './elementDeSeccio.js';
import { buildDetailSectionMeta, buildMercatDetailSectionMeta, buildPoblesDetailSectionMeta } from './detailSectionMeta.jsx';

const t = (_, alternativa) => alternativa;
const TORRE = { id: 'la-torre-de-les-macanes', title: 'La Torre de les Maçanes', provincia: 'Alacant', comarca: "L'Alacantí", etiqueta_curta_poble: 'La Torre' };
const OLI = { id: 'oli-sintetic', title: 'Oli sintètic', category_slug: 'alimentacio', tag: 'oli-verge-extra', poble_id: 'la-torre-de-les-macanes' };

test('la pàgina d’un producte acaba amb la pastilla del poble, enllaçada a /pobles/<slug>', () => {
  const labels = paginaDElement(buildMercatDetailSectionMeta({ marketItems: [OLI], t, towns: [TORRE] }), OLI).labels;
  expect(labels.at(-1)).toEqual({ text: 'La Torre', href: '/pobles/la-torre-de-les-macanes', className: 'sdp-badge-tag sp-card-label--enllac' });
  expect(labels[0]).toEqual({ text: 'Mercat', className: 'sdp-badge-system' });
});

test('el Mercat de buildDetailSectionMeta rep les fitxes de /pobles', () => {
  const metes = buildDetailSectionMeta({ events: [], feedPosts: [], marketItems: [OLI], mediaItems: [], notes: [], towns: [TORRE], t });
  expect(paginaDElement(metes.mercat, OLI).labels.at(-1).href).toBe('/pobles/la-torre-de-les-macanes');
});

test('sense fitxes o sense fitxa que hi case, les etiquetes de sempre', () => {
  expect(paginaDElement(buildMercatDetailSectionMeta({ marketItems: [OLI], t }), OLI).labels).toEqual([{ text: 'Mercat', className: 'sdp-badge-system' }]);
  expect(paginaDElement(buildMercatDetailSectionMeta({ marketItems: [OLI], t, towns: [{ id: 'penaguila', title: 'Penàguila' }] }), OLI).labels)
    .toEqual([{ text: 'Mercat', className: 'sdp-badge-system' }]);
});

test('a la pàgina d’un poble no s’hi afig la seua pròpia pastilla de poble', () => {
  const poble = paginaDElement(buildPoblesDetailSectionMeta({ towns: [TORRE], t }), TORRE).labels;
  expect(poble.map((l) => l.text)).toEqual(['Poble', 'Alacant', "L'Alacantí"]);
  expect(poble.some((l) => l.href)).toBe(false);
});
