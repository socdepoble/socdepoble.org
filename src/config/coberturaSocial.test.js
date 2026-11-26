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
import { readFileSync } from 'node:fs';
import { PAGINES_EDITORIALS_TAXONOMIA, resolPaginaEditorialTaxonomia } from '../data/taxonomia/taxonomiaPublicacio.js';
import { resolComarcaPerSlug } from '../data/taxonomia/taxonomiaGeografica.js';
import { ambPreposicioDe, entradetaDeComarca, textosTaxonomiaV26 } from '../data/taxonomia/i18nTaxonomiaV26.js';
import { comarcaDelPoble } from '../sections/pobles/territoriDelPoble.js';
import { MOCK_TOWNS } from '../sections/pobles/townsSeed.js';

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

/* v1.2.26 (IDEA-370 i IDEA-360; les rutes de G26-2) · Les pàgines editorials del catàleg finit de taxonomia i les
   comarques: el head que registra el client amb useSEO (PaginaEditorialEtiqueta i PaginaComarca), sense imatge pròpia,
   indexable. El catàleg editorial, amb resolPaginaEditorialTaxonomia sense edicions del CMS; les comarques, amb
   resolComarcaPerSlug sobre els pobles de la llavor (els del client sense remot) i els textos en valencià. */
const PAGINES_EDITORIAL_I_COMARCA = Object.freeze({
  editorial: readFileSync(new URL('../sections/taxonomia/PaginaEditorialEtiqueta.jsx', import.meta.url), 'utf8'),
  comarca: readFileSync(new URL('../sections/pobles/PaginaComarca.jsx', import.meta.url), 'utf8')
});
const txCa = textosTaxonomiaV26('ca');
const COMARQUES = [...new Set(MOCK_TOWNS.map(comarcaDelPoble).filter(Boolean))].sort().map((slug) => resolComarcaPerSlug(slug, MOCK_TOWNS)).filter((c) => c?.pobles.length);

describe('client i prerender: el mateix head a les pàgines de taxonomia i de comarca', () => {
  test('el client registra eixe head: «H1 · H2» i l’entradeta, i «<comarca> · Xarxa de Pobles» i l’entradeta de la comarca', () => {
    // La forma del títol i de la descripció dins de la crida a useSEO (la condició que l'envolta pot créixer).
    expect(PAGINES_EDITORIAL_I_COMARCA.editorial).toMatch(/useSEO\(\{\s*title:[^\n]*`\$\{editorial\.h1\} · \$\{editorial\.h2\}`[^\n]*\n\s*description:[^\n]*\beditorial\.entradeta\b/);
    expect(PAGINES_EDITORIAL_I_COMARCA.comarca).toMatch(/useSEO\(\{\s*title:[^\n]*`\$\{comarca\.nom\} · \$\{tx\.taxonomiaV26XarxaPobles\}`[^\n]*\n\s*description: entradeta,/);
    expect(PAGINES_EDITORIAL_I_COMARCA.comarca).toMatch(/entradetaDeComarca\(comarca\.nom, language\)/);
  });

  test.each(PAGINES_EDITORIALS_TAXONOMIA.map((p) => [`/${p.tipus}/${p.slug}`]))('%s · PaginaEditorialEtiqueta (resolPaginaEditorialTaxonomia)', (ruta) => {
    const editorial = resolPaginaEditorialTaxonomia(ruta);
    expect(delManifest(manifest.routes[ruta])).toEqual({ title: `${editorial.h1} · ${editorial.h2}`, description: editorial.entradeta, image: generica });
    expect([manifest.routes[ruta].index, manifest.routes[ruta].canonical]).toEqual([true, `${ORIGEN_SOCIAL_PER_DEFECTE}${ruta}`]);
  });

  test('les 12 Categories de Sistema i cada etiqueta comuna del catàleg, ni una ruta més', () => {
    expect(PAGINES_EDITORIALS_TAXONOMIA.filter((p) => p.tipus === 'categoria')).toHaveLength(12);
    expect(Object.keys(manifest.routes).filter((ruta) => /^\/(?:categoria|etiqueta)\//.test(ruta)).sort())
      .toEqual(PAGINES_EDITORIALS_TAXONOMIA.map((p) => `/${p.tipus}/${p.slug}`).sort());
  });

  test('cada comarca dels pobles de la llavor · PaginaComarca (resolComarcaPerSlug), ni una ruta més', () => {
    expect(COMARQUES.length).toBeGreaterThan(0);
    expect(Object.keys(manifest.routes).filter((ruta) => ruta.startsWith('/comarca/')).sort()).toEqual(COMARQUES.map((c) => `/comarca/${c.slug}`).sort());
    for (const comarca of COMARQUES) {
      const ruta = `/comarca/${comarca.slug}`;
      expect(delManifest(manifest.routes[ruta]), ruta).toEqual({ title: `${comarca.nom} · ${txCa.taxonomiaV26XarxaPobles}`,
        description: entradetaDeComarca(comarca.nom, 'ca'), image: generica });
      expect(manifest.routes[ruta].index, ruta).toBe(true);
    }
  });

  /* Integrador C1-3 (verificador R2-5/R2-6, P2) · El head que llegixen els rastrejadors parla en valencià
     normatiu: «de» es contrau amb l'article de la comarca. */
  test('l’entradeta de cada comarca contrau l’article: «del Comtat», «de l’Alacantí», mai «de El» ni «de L’»', () => {
    for (const comarca of COMARQUES) {
      const descripcio = manifest.routes[`/comarca/${comarca.slug}`].description;
      expect([comarca.slug, /\bde (?:El|La|Els|Les|L['’])/.test(descripcio)]).toEqual([comarca.slug, false]);
    }
    expect(ambPreposicioDe('El Comtat')).toBe('del Comtat');
    expect(ambPreposicioDe("L'Alacantí")).toBe("de l'Alacantí");
    expect(ambPreposicioDe('La Marina Alta')).toBe('de la Marina Alta');
    expect(ambPreposicioDe('Els Ports')).toBe('dels Ports');
    expect(ambPreposicioDe('Les Valls')).toBe('de les Valls');
    expect(ambPreposicioDe('Safor')).toBe('de Safor');
    expect(entradetaDeComarca('El Comtat', 'ca')).toContain('vinculades a la comarca del Comtat dins');
    expect(entradetaDeComarca('El Comtat', 'es')).toContain('de El Comtat');
  });
});
