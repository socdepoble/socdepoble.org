import { expect, test } from 'vitest';
import { CATEGORIES_CANONIQUES_BASE, NOMS_ETIQUETES_CANONIQUES_49 } from './vocabulariCanonic.js';
import { ARTICLES_SIMULADOR_IA_425, FACETA_4_ETIQUETES_SKOS } from './tesaurusDoctoralSocDePoble.js';
import { construeixBrainTaxonomia, filtraBrainTaxonomia, idCategoriaBrain, idEtiquetaBrain, PROPOSTES_NOMS_BRAIN, simulaBrainTaxonomia } from './brainTaxonomia.js';

const article = (id, labels, rest = {}) => ({ id, title: `Article ${id}`, labels, ...rest });
const observades = (model) => model.links.filter((link) => link.tipus === 'coaparicio');

test('el vocabulari real manté55nodes, quatre dimensions de lectura i zero conceptes inventats', () => {
  const model = construeixBrainTaxonomia();
  expect(model.nodes).toHaveLength(Object.keys(CATEGORIES_CANONIQUES_BASE).length + NOMS_ETIQUETES_CANONIQUES_49.length);
  expect(model.nodes).toHaveLength(55);
  expect(model.nodes.filter((node) => node.faceta === 'entitat')).toHaveLength(13);
  expect(model.nodes.filter((node) => node.faceta === 'format')).toHaveLength(8);
  expect(model.nodes.filter((node) => node.faceta === 'tema')).toHaveLength(28);
  for (const nom of ['Opinió', 'Noticies', 'Propostes']) expect(model.nodes.find((node) => node.label === nom).faceta).toBe('format');
  expect(model.nodes.some((node) => ['Govern', 'Podcast'].includes(node.label))).toBe(false);
  expect(PROPOSTES_NOMS_BRAIN['tecnologia-lliure']).toBe('💻 Tecnologia Lliure');
  expect(filtraBrainTaxonomia(model, 'redundancies').nodes.length).toBeGreaterThan(0);
});

test('una associació compta documents únics, no repeticions de tags ni de files', () => {
  const model = construeixBrainTaxonomia({ publicacions: [article('a', ['Herbari', 'Herbari', 'Llavors']), article('a', ['Herbari', 'Llavors']), article('b', ['Herbari', 'Llavors'])] });
  expect(model.documents).toHaveLength(2);
  expect(observades(model)).toHaveLength(1);
  expect(observades(model)[0].weight).toBe(2);
  expect(observades(model)[0].documents.map((id) => JSON.parse(id).at(-1))).toEqual(['a', 'b']);
});

test('ids iguals entre WordPress, Mur i Mercat no es fusionen sense prova d’identitat', () => {
  const model = construeixBrainTaxonomia({ historics: [{ id: 7, etiquetesOriginals: ['Herbari', 'Llavors'] }], publicacions: [article(7, ['Herbari', 'Llavors']), article(7, ['Herbari', 'Llavors'], { _brainColleccio: 'mercat' })] });
  expect(model.documents).toHaveLength(3);
  expect(observades(model)[0].weight).toBe(3);
});

test('una publicació amb fontWordPress explícita es deduplica amb el document original', () => {
  const model = construeixBrainTaxonomia({ historics: [{ id: 7, link: 'https://socdepoble.net/article/', etiquetesOriginals: ['Herbari', 'Llavors'] }], publicacions: [article('replica', ['Herbari', 'Llavors'], { source_url: 'https://socdepoble.net/article/' })] });
  expect(model.documents).toHaveLength(1);
  expect(observades(model)[0].weight).toBe(1);
  expect(model.documents[0].fonts).toEqual(['wordpress', 'mur']);
});

test('categories IA pendents i etiquetesNetes proposades no es convertixen en metadades observades', () => {
  const model = construeixBrainTaxonomia({ historics: [{ id: 1, title: 'Herbari', categoriaTematicaProposadaId: 'natura-excursions', etiquetesNetes: ['Herbari'] }] });
  expect(model.documents[0].nodes).toEqual([]);
  expect(model.cobertura.documentsSenseNoms).toBe(1);
  expect(observades(model)).toEqual([]);
});

test('la categoria efectiva del DTO sí que participa en la coaparició observada', () => {
  const model = construeixBrainTaxonomia({ publicacions: [article(1, ['Herbari'], { category: 'natura-excursions' })] });
  expect(observades(model)[0]).toMatchObject({ source: idCategoriaBrain('natura-excursions'), target: idEtiquetaBrain('Herbari'), weight: 1 });
});

test('SKOS declarat i candidatura editorial no reben un pes documental inventat', () => {
  const model = construeixBrainTaxonomia({ skos: [{ name: 'Herbari', broaderTermId: 'natura-excursions' }] });
  const jerarquies = model.links.filter((link) => link.tipus === 'skos');
  expect(jerarquies).toHaveLength(1);
  expect(jerarquies[0]).toMatchObject({ source: idEtiquetaBrain('Herbari'), target: idCategoriaBrain('natura-excursions'), documents: [] });
  expect(jerarquies[0].weight).toBeUndefined();
  const candidatures = model.links.filter((link) => link.tipus === 'candidatura');
  expect(candidatures).toHaveLength(7);
  expect(candidatures.every((link) => link.proposta && link.discontinu && link.weight === undefined)).toBe(true);
});

test('corpus històric real425: conserva originals i declara l’absència de categories efectives', () => {
  const model = construeixBrainTaxonomia({ historics: ARTICLES_SIMULADOR_IA_425, skos: FACETA_4_ETIQUETES_SKOS });
  expect(model.cobertura.historicsRebuts).toBe(425);
  expect(model.documents).toHaveLength(425);
  const categories = model.nodes.filter((node) => node.type === 'category');
  expect(categories).toHaveLength(6);
  expect(model.nodes.filter((node) => node.type !== 'category')).toHaveLength(49);
  expect(categories.every((node) => node.documents.length === 0)).toBe(true);
  expect(model.cobertura.vivaParcial).toBe(true);
  expect(model.cobertura.nomsNoCanonics.length).toBeGreaterThan(0);
  expect(model.nodes.find((node) => node.label === 'Rutes').documents).toHaveLength(98);
  // Dos originals conserven Esdeveniments, llevat abans del camp derivat etiquetesNetes.
  expect(model.nodes.find((node) => node.label === 'Activitats').documents).toHaveLength(80);
  expect(model.nodes.find((node) => node.label === 'Arbres Monumentals').documents).toHaveLength(23);
  expect(model.cobertura.documentsSenseNoms).toBe(45);
});

test('STR02: mateix id en dos orígens WordPress o dos tenants no fabrica una coaparició', () => {
  const model = construeixBrainTaxonomia({ historics: [{ id: 7, link: 'https://socdepoble.net/a', etiquetesOriginals: ['Fotos'] }, { id: 7, link: 'https://another.example/a', etiquetesOriginals: ['Vídeos'] }], publicacions: [article('a', ['Fotos'], { tenant_id: 'A' }), article('a', ['Vídeos'], { tenant_id: 'B' })] });
  expect(model.documents).toHaveLength(4);
  expect(observades(model)).toEqual([]);
});

test('STR03/04: wp_id amb origen explícit deduplica i categoria_tematica_id preval sobre proposta', () => {
  const model = construeixBrainTaxonomia({ historics: [{ id: 7, link: 'https://socdepoble.net/a', etiquetesOriginals: ['Fotos'] }], publicacions: [article('publicat', ['Patrimoni'], { wp_id: 7, source_origin: 'https://socdepoble.net', categoria_tematica_id: 'natura-excursions' })] });
  expect(model.documents).toHaveLength(1);
  expect(model.documents[0].nodes).toContain(idCategoriaBrain('natura-excursions'));
  expect(model.documents[0].nodes).not.toContain(idEtiquetaBrain('Fotos'));
});

test('STR05: les etiquetes de versions diferents no formen una parella observada', () => {
  const model = construeixBrainTaxonomia({ historics: [{ id: 7, link: 'https://socdepoble.net/a', etiquetesOriginals: ['Fotos'] }], publicacions: [article('actual', ['Vídeos'], { source_url: 'https://socdepoble.net/a' })] });
  expect(model.documents).toHaveLength(1);
  expect(observades(model)).toEqual([]);
  expect(model.documents[0].observacions).toHaveLength(2);
});

test('STR06: àlies declarats conserven la traça; una proposta de categoria no compta', () => {
  const model = construeixBrainTaxonomia({ historics: [{ id: 1, etiquetesOriginals: ['Excursions', 'Rutes', 'Esdeveniments'], categoriaTematicaProposadaId: 'natura-excursions' }], skos: FACETA_4_ETIQUETES_SKOS });
  expect(model.documents[0].nodes).toEqual([idEtiquetaBrain('Activitats'), idEtiquetaBrain('Rutes')]);
  expect(model.documents[0].assignacions.some((valor) => valor.original === 'Excursions' && valor.canonic === 'Rutes')).toBe(true);
});

test('àlies SKOS sense diferència de caixa/accents s’accepten; l’ambigüitat queda sense assignar', () => {
  const model = construeixBrainTaxonomia({ skos: [{ name: 'Herbari', useFor: ['Ambigua'] }, { name: 'Llavors', useFor: ['Ambigua'] }, ...FACETA_4_ETIQUETES_SKOS], publicacions: [article('a', ['arbres', 'Videos', 'Ambigua'])] });
  expect(model.documents[0].nodes).toEqual([idEtiquetaBrain('Arbres Monumentals'), idEtiquetaBrain('Vídeos')]);
  expect(model.cobertura.nomsAmbigus).toContain('Ambigua');
});

test('la versió vigent preval encara que el lot arribe desordenat', () => {
  const model = construeixBrainTaxonomia({ publicacions: [article('a', ['Vídeos'], { backend_id: 'B', tenant_id: 'T', updated_at: '2026-11-08T12:00:00Z' }), article('a', ['Fotos'], { backend_id: 'B', tenant_id: 'T', updated_at: '2026-11-07T12:00:00Z' })] });
  expect(model.documents).toHaveLength(1);
  expect(model.documents[0].nodes).toEqual([idEtiquetaBrain('Vídeos')]);
  expect(observades(model)).toEqual([]);
});

test('un wp_id sense origen no s’atribuïx al lloc fix; un DTO buit no hereta etiquetes històriques', () => {
  const historic = { id: 7, link: 'https://socdepoble.net/a', etiquetesOriginals: ['Fotos'] };
  expect(construeixBrainTaxonomia({ historics: [historic], publicacions: [article('a', [], { wp_id: 7 })] }).documents).toHaveLength(2);
  const model = construeixBrainTaxonomia({ historics: [historic], publicacions: [{ id: 'a', source_url: historic.link }] });
  expect(model.documents).toHaveLength(1);
  expect(model.documents[0].nodes).toEqual([]);
});

test('un corpus viu complet s’acredita explícitament; files sense identitat i noms desconeguts són visibles', () => {
  const model = construeixBrainTaxonomia({ publicacions: [{ labels: ['Herbari'] }, article('a', ['Nom alié'])], coberturaViva: { parcial: false, estat: 'ready' } });
  expect(model.cobertura).toMatchObject({ senseIdentitat: 1, documentsSenseNoms: 1, vivaParcial: false, estatViu: 'ready', nomsNoCanonics: ['Nom alié'] });
});

test('simular nom i fusió és immutable, deduplica les píndoles i no escriu el vocabulari', () => {
  const model = construeixBrainTaxonomia({ publicacions: [article('a', ['Projectes', 'Projecte Sóc de Poble'])] });
  const original = JSON.stringify(model);
  const resultat = simulaBrainTaxonomia(model, { noms: { [idEtiquetaBrain('Projectes')]: 'Projectes del poble' }, fusio: { origen: idEtiquetaBrain('Projecte Sóc de Poble'), desti: idEtiquetaBrain('Projectes') } });
  expect(resultat[0].labels).toEqual([{ text: 'Projectes del poble', className: 'sdp-badge-tag' }]);
  expect(JSON.stringify(model)).toBe(original);
  expect(NOMS_ETIQUETES_CANONIQUES_49).toContain('Projecte Sóc de Poble');
});
