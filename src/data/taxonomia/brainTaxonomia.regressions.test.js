import { expect, test } from 'vitest';
import { construeixBrainTaxonomia, idEtiquetaBrain, PROPOSTES_MESTRE_BRAIN, projectaBrainTaxonomia } from './brainTaxonomia.js';

test('els gèneres editorials són formats i les sis propostes no alteren el cens canònic', () => {
  const model = construeixBrainTaxonomia();
  for (const etiqueta of ['Opinió', 'Noticies', 'Propostes']) expect(model.nodes.find((node) => node.id === idEtiquetaBrain(etiqueta)).faceta).toBe('format');
  expect(model.nodes).toHaveLength(55);
  expect(model.nodes.some((node) => node.label === '🏛️ Govern i Poble')).toBe(false);
  expect(PROPOSTES_MESTRE_BRAIN).toEqual(['⚖️ Defensa del Territori', '🌾 Terra i Rebost', '🏛️ Govern i Poble', '🌿 Natura i Patrimoni', '🎭 Cultura i Festa', '🤝 Comunitat i Cures']);
});

test.each([false, true])('IC01: només una autoritat efectiva per id natiu després de corregir source_url; invers=%s', (invers) => {
  const historics = [{ id: 7, link: 'https://socdepoble.net/old', etiquetesOriginals: ['Fotos'] }, { id: 8, link: 'https://socdepoble.net/new', etiquetesOriginals: ['Vídeos'] }];
  const publicacions = [
    { id: 'same', backend_id: 'B', tenant_id: 'T', source_url: historics[0].link, updated_at: '2026-11-07T00:00:00Z', labels: ['Herbari', 'Llavors'] },
    { id: 'same', backend_id: 'B', tenant_id: 'T', source_url: historics[1].link, updated_at: '2026-11-08T00:00:00Z', labels: ['Projectes'], wp_id: 8 },
  ];
  const model = construeixBrainTaxonomia({ historics, publicacions: invers ? [...publicacions].reverse() : publicacions });
  expect(model.documents).toHaveLength(2);
  expect(model.documents.filter((doc) => doc.observacioEfectiva.origen === 'mur')).toHaveLength(1);
  expect(model.documents.find((doc) => JSON.parse(doc.id)[2] === '7').nodes).toEqual([idEtiquetaBrain('Fotos')]);
  expect(model.links.filter((link) => link.tipus === 'coaparicio')).toEqual([]);
});

test('IC03: nom igual/buit no canvia res; nom coincident conserva identitats amb col·lisió explícita', () => {
  const model = construeixBrainTaxonomia({ publicacions: [{ id: 'a', labels: ['Herbari', 'Llavors'] }] });
  for (const valor of ['Herbari', '   ']) expect(projectaBrainTaxonomia(model, { noms: { [idEtiquetaBrain('Herbari')]: valor } }).afectats).toEqual([]);
  const projeccio = projectaBrainTaxonomia(model, { noms: { [idEtiquetaBrain('Herbari')]: 'Llavors' } });
  expect(projeccio.afectats).toHaveLength(1);
  expect(projeccio.documents[0].nodes).toHaveLength(2);
  expect(projeccio.collisions).toContainEqual({ nom: 'llavors', ids: [idEtiquetaBrain('Herbari'), idEtiquetaBrain('Llavors')] });
});
