import { slugRevisionsDoctoralsArbre } from './esquemaDoctoralArbres.js';
import { DRETS_CATALEG_ARBRES } from '../../sections/text/pageContent.dretsPatrimoni.js';
import { ARBRES_MONUMENTALS_2020, FONT_CATALEG_ARBRES_2020 } from './arbresMonumentals2020.js';
import { FONT_ARBRES_MONUMENTALS } from './arbresMonumentals.js';

/** Cada llibre aporta la seua portada, font i exemplars al mateix Workspace. */
export const LLIBRES_ARBRES_MONUMENTALS = Object.freeze([
  Object.freeze({
    id: 'la-torre-de-les-macanes',
    titol: 'Arbres Emblemàtics i Monumentals de La Torre de les Maçanes',
    etiquetaNavegacio: 'Catàleg d’Arbres Monumentals de La Torre de les Maçanes',
    poble: 'La Torre de les Maçanes',
    autoria: Object.freeze({
      nom: 'Associació El Rentonar',
      poble: 'La Torre de les Maçanes',
      ruta: '/rentonar',
      logo: '/assets/events/aplec-2023/logo-rentonar-300x300.png',
      altLogo: 'Logotip de l’Associació El Rentonar',
      drets: DRETS_CATALEG_ARBRES
    }),
    portada: Object.freeze({ wpId: FONT_ARBRES_MONUMENTALS.wpId, slug: FONT_ARBRES_MONUMENTALS.slug }),
    fontDoctoral: Object.freeze({ id: 'la-torre-de-les-macanes-2007-2020', ...FONT_CATALEG_ARBRES_2020 }),
    exemplars: ARBRES_MONUMENTALS_2020
  })
]);

/** Projecció de lectura. Les dades botàniques conserven la seua referència. */
export function modelLlibresArbres(llibres, textos) {
  const ids = new Set();
  const categories = [];
  const items = [];
  for (const llibre of llibres) {
    if (typeof llibre.fontDoctoral?.id !== 'string' || !llibre.fontDoctoral.id.trim()) {
      throw new TypeError('Cada llibre requerix la seua font doctoral amb un identificador explícit.');
    }
    try {
      slugRevisionsDoctoralsArbre('validacio-font', llibre.fontDoctoral.id);
    } catch {
      throw new TypeError('L’identificador de la font doctoral ha de ser un slug vàlid.');
    }
    if (typeof llibre.id !== 'string' || !llibre.id || ids.has(llibre.id)) {
      throw new TypeError('Cada llibre requerix un identificador propi.');
    }
    ids.add(llibre.id);
    const filtres = [
      ['monumentals', textos.monumentals, arbre => arbre.monumental === true],
      ['emblematics', textos.emblematics, arbre => arbre.monumental === false],
      ['acces', textos.acces, arbre => arbre.accesLliure === true],
      ['seguiment', textos.seguiment, arbre => Boolean(arbre.fotos?.foto2020)]
    ];
    categories.push({
      id: llibre.id, slugRuta: llibre.id, label: llibre.etiquetaNavegacio || llibre.titol,
      count: llibre.exemplars.length, expandOnSelect: true, selectOnRepeat: true
    });
    for (const [id, label, accepta] of filtres) {
      const categoryId = `${llibre.id}:${id}`;
      if (ids.has(categoryId)) throw new TypeError('Cada categoria requerix un identificador propi.');
      ids.add(categoryId);
      categories.push({
        id: categoryId, parentId: llibre.id, llibreId: llibre.id, label,
        count: llibre.exemplars.filter(accepta).length
      });
    }
    const portadaId = `portada-${llibre.id}`;
    if (ids.has(portadaId)) throw new TypeError('La portada requerix un identificador propi.');
    ids.add(portadaId);
    items.push({
      id: portadaId, portadaLlibre: true, title: textos.portada, subtitle: llibre.titol,
      categoryIds: [llibre.id], glyph: '📖', lang: textos.language, llibre,
      fontImportada: llibre.portada?.wpId ? { font: 'importacio-wp', id: String(llibre.portada.wpId) } : null,
      searchText: `${textos.portada} ${llibre.titol} ${llibre.poble} ${llibre.portada?.slug || ''}`
    });
    for (const arbre of llibre.exemplars) {
      if (typeof arbre.id !== 'string' || !arbre.id) throw new TypeError('L’exemplar requerix un identificador de text.');
      const itemId = `${llibre.id}:${arbre.id}`;
      if (ids.has(itemId)) {
        throw new TypeError('Cada exemplar requerix un identificador propi dins del seu llibre.');
      }
      ids.add(itemId);
      const compartit = llibres.filter(l => l.exemplars.some(exemplar => exemplar.id === arbre.id)).length > 1;
      items.push({
        id: itemId, slugRuta: compartit ? `${llibre.id}--${arbre.id}` : arbre.id,
        title: `#${arbre.ordre} · ${arbre.nom}`,
        subtitle: `${arbre.especieCientifica} (${arbre.nomComu})`,
        lead: `${arbre.paratge} · ${arbre.categoria}`,
        imageUrl: arbre.fotos?.foto2007, imageAlt: `${arbre.nom} (${arbre.especieCientifica})`,
        glyph: '🌳',
        categoryIds: [llibre.id, ...filtres.filter(([, , accepta]) => accepta(arbre)).map(([id]) => `${llibre.id}:${id}`)],
        arbre, llibre,
        searchText: [arbre.ordre, arbre.nom, arbre.especieCientifica, arbre.nomComu,
          arbre.paratge, arbre.categoria, arbre.propietari, llibre.poble].join(' ')
      });
    }
  }
  return { status: 'ready', canAutoSelect: () => false, categories, items };
}
