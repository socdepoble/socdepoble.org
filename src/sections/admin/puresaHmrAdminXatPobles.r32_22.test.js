// @vitest-environment node
/**
 * puresaHmrAdminXatPobles.r32_22.test.js — Segona escombrada de puresa HMR / Vite Fast Refresh (Onada R32.22 · T2).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import { describe, expect, test, vi } from 'vitest';
import { FACETA_TAXONOMIA, dataLlegible, nomFitxerExportacio, payloadDe } from './facetaTaxonomiaModel.js';
import { NOM_FACTOR, XIFRES_CODI, nomesXifres, textDErrorSegonFactor } from './segonFactorModel.js';
import { RECURSOS_CATALEG_CANONICS, clauRecursValida, esActorSdp } from './panellTraspasPublicacioModel.js';
import { APARELLS, LIMIT_PERSONES, SENSE_XIFRA, dadesDEntitat, dadesDePersona, filesValides } from './indicadorsAdminModel.js';
import { actualitzaInsigniaApp, quantsNoLlegits, textNoLlegits } from '../xat/comptadorGlobalXatModel.js';
import { TEXTOS_CONSTRUCCIO, VISTES_EN_CONSTRUCCIO, textosDeVista } from '../xat/components/vistaEnConstruccioModel.js';
import { COLLECCIONS_RESUM, MAXIM_BYTES_OPENDATA, TEXTOS_RESTAURADOR } from '../pobles/restauradorOpenDataModel.js';

const ARREL = process.cwd();

const MODULS_JSX_PURS = Object.freeze([
  'src/sections/admin/SegonFactor.jsx',
  'src/sections/admin/PanellTraspasPublicacioInline.jsx',
  'src/sections/admin/IndicadorsAdmin.jsx',
  'src/sections/xat/ComptadorGlobalXat.jsx',
  'src/sections/xat/components/VistaEnConstruccio.jsx',
  'src/sections/pobles/RestauradorOpenData.jsx',
]);

function exportsDeclarats(relPath) {
  const font = readFileSync(path.join(ARREL, relPath), 'utf8');
  const ast = parse(font, { sourceType: 'module', plugins: ['jsx'] });
  const noms = [];
  for (const node of ast.program.body) {
    if (node.type === 'ExportNamedDeclaration') {
      if (node.declaration?.type === 'FunctionDeclaration' && node.declaration.id) {
        noms.push({ nom: node.declaration.id.name, reexport: false });
      } else if (node.declaration?.type === 'VariableDeclaration') {
        for (const decl of node.declaration.declarations) {
          if (decl.id.type === 'Identifier') noms.push({ nom: decl.id.name, reexport: false });
        }
      }
      for (const spec of node.specifiers || []) {
        if (spec.exported.type === 'Identifier') {
          noms.push({ nom: spec.exported.name, reexport: Boolean(node.source) });
        }
      }
    } else if (node.type === 'ExportDefaultDeclaration') {
      noms.push({ nom: 'default', reexport: false });
    }
  }
  return noms;
}

describe('Onada R32.22 · T2 · Puresa HMR dels 7 components .jsx i contracte pur dels 7 *Model.js', () => {
  test.each(MODULS_JSX_PURS)('%s exporta exclusivament components React PascalCase o default', (relPath) => {
    const exp = exportsDeclarats(relPath);
    expect(exp.length).toBeGreaterThan(0);
    for (const { nom } of exp) {
      expect(nom === 'default' || /^[A-Z][A-Za-z0-9]*$/.test(nom), `${relPath}: export no-component «${nom}»`).toBe(true);
      expect(/^[A-Z0-9_]+$/.test(nom), `${relPath}: constant UPPER_CASE «${nom}» dins de .jsx`).toBe(false);
    }
  });

  // v1.2.16: l'integrador aplica la costura opcional d'R32.22
  // (admin_section_faceta_taxonomia_hmr.patch). AdminSection.jsx importa
  // FACETA_TAXONOMIA de facetaTaxonomiaModel.js i el pont es retira.
  test('FacetaTaxonomia.jsx només declara el component React (pont FACETA_TAXONOMIA retirat a la v1.2.16)', () => {
    const exp = exportsDeclarats('src/sections/admin/FacetaTaxonomia.jsx');
    expect(exp).toEqual([
      { nom: 'FacetaTaxonomia', reexport: false },
      { nom: 'default', reexport: false },
    ]);
  });

  test('facetaTaxonomiaModel, segonFactorModel, panellTraspasPublicacioModel i indicadorsAdminModel conserven semàntica exacta', () => {
    expect(FACETA_TAXONOMIA.id).toBe('taxonomia');
    expect(nomFitxerExportacio(new Date('2026-11-20T12:00:00Z'))).toBe('taxonomia-2026-11-20.json');
    expect(dataLlegible('invalid')).toBe('');
    expect(payloadDe({ pagines: {}, categories: [' A ', 'A'], etiquetes: [] })).toEqual({
      v: 1,
      pagines: {},
      categories: ['A'],
      etiquetes: [],
    });

    expect(NOM_FACTOR).toBe('Autenticador del Mestre');
    expect(XIFRES_CODI).toBe(6);
    expect(nomesXifres('12a34b5678')).toBe('123456');
    expect(typeof textDErrorSegonFactor(new Error('x'))).toBe('string');

    expect(esActorSdp('soc-de-poble_official')).toBe(true);
    expect(esActorSdp('altre-actor')).toBe(false);
    expect(clauRecursValida('')).toBe('pagina:receptes');
    expect(RECURSOS_CATALEG_CANONICS.length).toBeGreaterThanOrEqual(10);

    expect(LIMIT_PERSONES).toBe(500);
    expect(SENSE_XIFRA).toBe('sense xifra');
    expect(APARELLS).toHaveLength(4);
    expect(filesValides([null, { created_at: '2026-01-01', last_sign_in_at: null, secret: 'x' }]).map(dadesDePersona)).toEqual([
      { created_at: '2026-01-01', last_sign_in_at: null },
    ]);
    expect(dadesDEntitat({ kind: 'group', name: 'x' })).toEqual({ kind: 'group' });
  });

  test('comptadorGlobalXatModel, vistaEnConstruccioModel i restauradorOpenDataModel conserven paritat funcional', () => {
    expect(quantsNoLlegits(4)).toBe(4);
    expect(quantsNoLlegits(-1)).toBe(0);
    expect(textNoLlegits(1)).toBe('Un missatge no llegit');
    expect(textNoLlegits(5)).toBe('5 missatges no llegits');

    const setAppBadge = vi.fn(() => Promise.resolve());
    actualitzaInsigniaApp(3, { setAppBadge });
    expect(setAppBadge).toHaveBeenCalledWith(3);

    expect(Object.keys(VISTES_EN_CONSTRUCCIO)).toEqual(['telefonades']);
    expect(TEXTOS_CONSTRUCCIO.titol[1]).toBe('En construcció');
    expect(textosDeVista('inexistent', (_, r) => r)).toBeNull();
    expect(textosDeVista('destacats', (_, r) => r)).toBeNull();
    expect(textosDeVista('telefonades', (_, r) => r)?.accio).toEqual({ tipus: 'nou', etiqueta: 'Nova telefonada' });

    expect(COLLECCIONS_RESUM).toEqual(['noticies', 'agenda', 'directori', 'memoria', 'memoriaOral']);
    expect(MAXIM_BYTES_OPENDATA).toBe(64 * 1024 * 1024);
    expect(TEXTOS_RESTAURADOR.titol[0]).toBe('section.pobles.restaurador.titol');
  });
});
