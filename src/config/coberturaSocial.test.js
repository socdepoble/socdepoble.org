// @vitest-environment node
/* Ordre del Mestre (30-10-2026, prompt 2208; QA-VES-01 i QA-VES-02 de Codex) ·
   Client i prerender diuen el mateix. Per a cada ruta nova del manifest social
   (tooling/seo/build-social-manifest.mjs, sobre l'arbre viu i estricte), el
   títol, la descripció i la URL d'og:image són exactament els de la funció que
   crida el client:
     · /plugin/<id>: metadadesDePlugin sobre el registre de veres (PLUGINS), la
       de PluginPage. Fixa també que la lectura per AST del build llig els
       mateixos camps i la mateixa il·lustració que la fàbrica plugin();
     · /page/<clau>: metadadesDePagina de PAGE_COPY (TextSection, des de
       PageDetailSection), i /disseny, la de PAGE_COPY.disseny (DesignSection);
     · /wikidepoble: metadadesDeDocumentWiki sense ?item= (WikiDetail);
     · /consola, /consola/<id> i /consola/govern/<id>: rutesPubliquesDeLaConsola
       (seoConsola.js, la de ConsolaSection · seoDe).
   Les opcions del selector són les del client a producció i a dev (l'origen
   https://socdepoble.org). */
import { describe, expect, test } from 'vitest';
import { buildSocialManifest, PAGINES_INFORMATIVES } from '../../tooling/seo/build-social-manifest.mjs';
import { ORIGEN_SOCIAL_PER_DEFECTE } from './imatgeSocial.js';
import { metadadesDePagina, metadadesDePlugin } from './metadadesSocials.js';
import { PLUGINS, rutaDelPlugin } from '../sections/plugins/registrePlugins.js';
import { PAGE_COPY } from '../sections/text/pageContent.js';
import { metadadesDeDocumentWiki } from '../sections/wiki-de-poble/seoWiki.js';
import { rutesPubliquesDeLaConsola } from '../sections/consola/seoConsola.js';

const OPCIONS = Object.freeze({ origen: ORIGEN_SOCIAL_PER_DEFECTE, permesos: [] });
const { manifest } = await buildSocialManifest({ root: process.cwd(), origin: ORIGEN_SOCIAL_PER_DEFECTE, estricte: true });

/* El que compara: títol, descripció i URL de la imatge (el manifest hi afig
   l'alt en text pla, el canonical i el tipus, que el client calcula a part). */
const delClient = ({ title, description, image }) => ({ title, description, image: image?.url ?? null });
const delManifest = (entrada) => {
  expect(entrada, 'absent del manifest').toBeTruthy();
  return { title: entrada.title, description: entrada.description, image: entrada.image.url };
};

describe('client i prerender: el mateix head a cada ruta nova del manifest social', () => {
  test('els plugins del manifest són exactament els del registre', () => {
    expect(Object.keys(manifest.routes).filter((ruta) => ruta.startsWith('/plugin/')).sort())
      .toEqual(PLUGINS.map((plugin) => rutaDelPlugin(plugin.id)).sort());
    expect(PLUGINS).toHaveLength(8);
  });

  test.each(PLUGINS.map((plugin) => [rutaDelPlugin(plugin.id), plugin]))('%s · PluginPage (metadadesDePlugin)', (ruta, plugin) => {
    const client = metadadesDePlugin(plugin, OPCIONS);
    expect(client.imatge.estat).toBe('triada');
    expect(delManifest(manifest.routes[ruta])).toEqual(delClient(client));
    expect(manifest.routes[ruta].image.alt).toBe(client.image.alt);
  });

  test.each([...PAGINES_INFORMATIVES.map((clau) => [`/page/${clau}`, clau]), ['/disseny', 'disseny']])(
    '%s · TextSection o DesignSection (metadadesDePagina)', (ruta, clau) => {
      expect(delManifest(manifest.routes[ruta])).toEqual(delClient(metadadesDePagina(PAGE_COPY[clau], OPCIONS)));
    }
  );

  test('/wikidepoble · WikiDetail (metadadesDeDocumentWiki sense ?item=)', () => {
    const client = metadadesDeDocumentWiki(null, '', []);
    expect(client.image).toBeTruthy();
    expect(delManifest(manifest.routes['/wikidepoble'])).toEqual(delClient(client));
  });

  test.each(rutesPubliquesDeLaConsola(OPCIONS).map((head) => [head.ruta, head]))('%s · ConsolaSection (seoConsola.js)', (ruta, head) => {
    expect(head.imatge.estat).toBe('triada');
    expect(delManifest(manifest.routes[ruta])).toEqual(delClient(head));
  });
});
