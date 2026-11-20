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
   https://socdepoble.org).
   P0-SEO-UNIVERSAL (ordre del Mestre, 13-11-2026) · I les famílies que faltaven:
     · les fitxes públiques del paquet (/javillinares, /socdepoble, /rentonar i /iaia, i cada clau
       declarada en cada família del Router): metadadesDePerfil sobre ambReservaDelPaquet, les mateixes
       funcions que crida PerfilPublicSection, i la canònica de rutaPublicaDePerfil;
     · /perfil, el directori: el títol i el subtítol que pinta ProfileSection
       (encapcalamentDirectoriGent amb el diccionari valencià);
     · les cinc verticals: el kicker i el subtítol de TEXTOS_VERTICALS (SeccioVertical). */
import { describe, expect, test } from 'vitest';
import { buildSocialManifest, PAGINES_INFORMATIVES } from '../../tooling/seo/build-social-manifest.mjs';
import { ORIGEN_SOCIAL_PER_DEFECTE } from './imatgeSocial.js';
import { metadadesDePagina, metadadesDePlugin } from './metadadesSocials.js';
import { PLUGINS, rutaDelPlugin } from '../sections/plugins/registrePlugins.js';
import { PAGE_COPY } from '../sections/text/pageContent.js';
import { metadadesDeDocumentWiki } from '../sections/wiki-de-poble/seoWiki.js';
import { rutesPubliquesDeLaConsola } from '../sections/consola/seoConsola.js';
import { CLAUS_RESERVADES, indexDePerfil, metadadesDePerfil, rutaPublicaDePerfil, schemaDePerfil } from './metadadesDePerfil.js';
import { ambReservaDelPaquet } from '../sections/profile/perfilsDelPaquet.js';
import { encapcalamentDirectoriGent } from '../sections/pobles/subnavigacioPoblesIGentModel.js';
import { AMBITS_VERTICALS, TEXTOS_VERTICALS } from '../sections/verticals/SeccioVertical.jsx';
import ca from './idiomes/ca.js';
import { CAP_SOCIAL_BASE } from './imatgeSocial.js';

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
    /* COMMIT R6 (d79a0b530) · L'Arbre Genealògic (IDEA-100) és el nové plugin.
       P0-114 (ordre del Mestre, 261111) · L'Avisador, el desé: /plugin/avisador també és al manifest
       social, amb la seua variant (avisador_vinyeta-social-1200x630.jpg). */
    expect(PLUGINS).toHaveLength(10);
    expect(Object.keys(manifest.routes)).toContain('/plugin/avisador');
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

/* P0-SEO-UNIVERSAL (ordre del Mestre, 13-11-2026) · Les fitxes públiques, el directori i les verticals. */
const FAMILIES = Object.freeze(['perfil', 'gent', 'empresa', 'entitats', 'ajuntament', 'grup']);
const tradueix = ([clau, reserva]) => (typeof ca[clau] === 'string' && ca[clau].trim() ? ca[clau] : reserva);
/* Les claus per a les quals el paquet té fitxa (la reserva de la fitxa pública sense servidor). */
const CLAUS_DEL_PAQUET = CLAUS_RESERVADES.filter((clau) => ambReservaDelPaquet(clau, null));
const generica = `${ORIGEN_SOCIAL_PER_DEFECTE}${CAP_SOCIAL_BASE.image.url}`;

describe('client i prerender: el mateix head a les fitxes públiques, al directori i a les verticals', () => {
  test('les claus del paquet amb fitxa són les de la persona pilot, les dos entitats fundacionals i la IAIA', () => {
    expect(CLAUS_DEL_PAQUET.length).toBeGreaterThanOrEqual(11);
    expect(new Set(CLAUS_DEL_PAQUET.map((clau) => rutaPublicaDePerfil(ambReservaDelPaquet(clau, null))))).toEqual(new Set(['/javillinares', '/socdepoble', '/rentonar', '/iaia']));
  });

  test.each(CLAUS_DEL_PAQUET.map((clau) => [clau]))('la clau «%s» · PerfilPublicSection (metadadesDePerfil sobre ambReservaDelPaquet)', (clau) => {
    const perfil = ambReservaDelPaquet(clau, null);
    const client = metadadesDePerfil(perfil, OPCIONS);
    const canonica = rutaPublicaDePerfil(perfil);
    const entrada = manifest.routes[canonica];
    // El manifest diu el mateix que el client: títol, descripció i imatge (o la targeta genèrica si la fitxa no en té).
    expect(delManifest(entrada)).toEqual({ title: client.title, description: client.description, image: client.image?.url ?? generica });
    expect(client.imatge.estat).not.toBe('bloquejada');
    expect(entrada.canonical).toBe(`${ORIGEN_SOCIAL_PER_DEFECTE}${canonica}`);
    expect([entrada.schema, entrada.index]).toEqual([schemaDePerfil(perfil), indexDePerfil(perfil, canonica)]);
    // En cada família del Router, la clau és la canònica o un àlies seu: el mateix head, amb el canonical del destí.
    for (const familia of FAMILIES) {
      const cami = `/${familia}/${clau}`;
      expect(cami === canonica ? canonica : manifest.aliases[cami], cami).toBe(canonica);
    }
  });

  test('/perfil · ProfileSection (encapcalamentDirectoriGent amb el diccionari valencià), sense indexar', () => {
    const reserves = encapcalamentDirectoriGent('ca');
    const { titol, subtitol } = encapcalamentDirectoriGent('ca', tradueix(['section.profile.title', reserves.titol]), tradueix(['section.profile.subtitle', reserves.subtitol]));
    expect(delManifest(manifest.routes['/perfil'])).toEqual({ title: titol, description: subtitol, image: generica });
    expect([manifest.routes['/perfil'].index, manifest.routes['/perfil'].compartible]).toEqual([false, true]);
  });

  test.each(AMBITS_VERTICALS.map((ambit) => [`/${ambit}`, ambit]))('%s · SeccioVertical (el kicker i el subtítol de TEXTOS_VERTICALS)', (ruta, ambit) => {
    expect(delManifest(manifest.routes[ruta])).toEqual({ title: tradueix(TEXTOS_VERTICALS[ambit].kicker), description: tradueix(TEXTOS_VERTICALS[ambit].subtitle), image: generica });
    expect(manifest.routes[ruta].index).toBe(true);
  });
});
