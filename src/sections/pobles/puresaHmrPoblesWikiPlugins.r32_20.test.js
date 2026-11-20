// @vitest-environment node
/**
 * puresaHmrPoblesWikiPlugins.r32_20.test.js — Onada R32.20 · Lot 2
 *
 * Verifica la puresa d'exportacions Fast Refresh / HMR en pobles/,
 * wiki-de-poble/ i plugins/: els components .jsx exporten components React
 * (PascalCase o classe React) mentre les constants i funcions pures viuen als
 * mòduls germans *Model.js.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const llig = (rel) => readFileSync(path.join(ARREL, rel), 'utf8');

function exportacionsAmbNomDe(rel) {
  const ast = parse(llig(rel), { sourceType: 'module', plugins: ['jsx'] });
  const noms = [];
  let teDefault = false;
  for (const node of ast.program.body) {
    if (node.type === 'ExportDefaultDeclaration') {
      teDefault = true;
    } else if (node.type === 'ExportNamedDeclaration') {
      if (node.declaration) {
        if (node.declaration.id?.name) {
          noms.push(node.declaration.id.name);
        } else if (node.declaration.declarations) {
          for (const d of node.declaration.declarations) {
            if (d.id?.name) noms.push(d.id.name);
          }
        }
      }
      for (const s of node.specifiers || []) {
        const exp = s.exported?.name || s.exported?.value;
        if (exp) noms.push(exp);
      }
    }
  }
  return { teDefault, noms: noms.sort() };
}

describe('Onada R32.20 · Lot 2 · Puresa HMR / Fast Refresh en pobles/, wiki-de-poble/ i plugins/', () => {
  test.each([
    ['src/sections/pobles/DetallPoble.jsx', true, []],
    ['src/sections/pobles/SubnavigacioPoblesIGent.jsx', true, []],
    ['src/sections/pobles/EntitatsDelPoble.jsx', true, ['EntitatsDelPoble']],
    ['src/sections/pobles/CreditsDeViquipedia.jsx', false, ['CreditsDeViquipedia']],
    ['src/sections/plugins/PluginPage.jsx', true, []]
  ])('%s exporta exclusivament components React (cap constant ni funció auxiliar)', (rel, esperaDefault, esperaNoms) => {
    const { teDefault, noms } = exportacionsAmbNomDe(rel);
    expect(teDefault).toBe(esperaDefault);
    expect(noms).toEqual(esperaNoms);
    for (const nom of noms) {
      expect(/^[A-Z]/.test(nom), `${rel}: ${nom} ha de ser PascalCase`).toBe(true);
    }
  });

  test('WikiDePobleSection.jsx ha extret les 7 constants i funcions pures a wikiDePobleModel.js', () => {
    const { teDefault, noms } = exportacionsAmbNomDe('src/sections/wiki-de-poble/WikiDePobleSection.jsx');
    expect(teDefault).toBe(true);
    expect(noms).toEqual(['BarreraDeLaConsola', 'modulsLocalsActius']);
    const model = exportacionsAmbNomDe('src/sections/wiki-de-poble/wikiDePobleModel.js');
    expect(model.noms).toEqual([
      'AVIS_EINA_LOCAL_SENSE_TRADUCCIO',
      'CATEGORIA_INICIAL_WIKI',
      'DATA_DOCUMENTACIO',
      'TEXTOS_ESPAI_WIKI',
      'TIPUS_DOCUMENTACIO',
      'copyDePortada',
      'dataDeDocumentWiki',
      'destiInternDeWiki',
      'documentacioMaquinariaActiva',
      'modulsLocalsActius'
    ]);
  });

  test('els sis mòduls *Model.js exporten les utilitats pures sense JSX', () => {
    for (const rel of [
      'src/sections/pobles/detallPobleModel.js',
      'src/sections/pobles/subnavigacioPoblesIGentModel.js',
      'src/sections/pobles/entitatsDelPobleModel.js',
      'src/sections/pobles/creditsDeViquipediaModel.js',
      'src/sections/plugins/pluginPageModel.js',
      'src/sections/wiki-de-poble/wikiDePobleModel.js'
    ]) {
      const codi = llig(rel);
      expect(/<[A-Za-z]/.test(codi), `${rel} no ha de tindre JSX`).toBe(false);
    }
  });
});
