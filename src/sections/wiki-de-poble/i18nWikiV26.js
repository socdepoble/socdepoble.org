/**
 * i18nWikiV26.js — Diccionari diferit en 5 llengües (ca, es, en, eu, gl) per a
 * la Wiki de Poble v1.2.26 (IDEA-364 Esborranys + D4 Opció B Skills públiques).
 *
 * Claus amb prefix exclusiu `wikidepobleEsborrany*` i `wikidepobleSkills*` per
 * garantir zero col·lisió amb altres lots i +0 B al nucli WP d'arrencada.
 */

const TEXTOS = Object.freeze({
  ca: Object.freeze({
    wikidepobleEsborranyTitol: 'Esborrany en revisió',
    wikidepobleEsborranyCos: 'Este document de la Wiki de Poble es troba en fase d’esborrany i revisió activa. Es publica per transparència, però no s’indexa als cercadors fins a la validació editorial definitiva.',
    wikidepobleEsborranyEtiqueta: 'Esborrany',
    wikidepobleSkillsCarpeta: 'Skills i Tractors',
    wikidepobleSkillsGrupNucli: 'Nucli (core-*)',
    wikidepobleSkillsGrupProducte: 'Producte i Pedra Seca (sdp-*)',
    wikidepobleSkillsGrupWiki: 'Wiki i Coneixement (wiki-*)',
    wikidepobleSkillsGrupAltres: 'Altres skills',
    wikidepobleSkillsSubtitol: 'Tractors operatius publicats des de .agents/skills/',
    wikidepobleSkillsCarregant: 'Carregant l’índex de skills…',
    wikidepobleSkillsCarregantFitxa: 'Carregant la skill…',
    wikidepobleSkillsErrorIndex: 'No s’ha pogut carregar l’índex públic de skills.',
    wikidepobleSkillsErrorFitxa: 'No s’ha pogut carregar el fitxer Markdown d’esta skill.',
    wikidepobleSkillsBuida: 'No hi ha cap skill publicada en esta carpeta.',
    wikidepobleSkillsBaixaMd: 'Baixar Markdown (.md)',
    wikidepobleSkillsVeureAlGraf: 'Vore al graf de la Consola',
    wikidepobleSkillsQuadreTitol: 'Fitxa tècnica de la skill',
    wikidepobleSkillsIdentificador: 'Identificador',
    wikidepobleSkillsNucli: 'Nucli del sistema',
    wikidepobleSkillsNucliSi: 'Sí (core)',
    wikidepobleSkillsNucliNo: 'No',
    wikidepobleSkillsEtiquetes: 'Etiquetes',
    wikidepobleSkillsMida: 'Mida del document',
    wikidepobleSkillsFontUnica: 'Font única publicada',
    wikidepobleSkillsCapEtiqueta: 'Sense etiquetes'
  }),
  es: Object.freeze({
    wikidepobleEsborranyTitol: 'Borrador en revisión',
    wikidepobleEsborranyCos: 'Este documento de la Wiki de Poble está en fase de borrador y revisión activa. Se publica por transparencia, pero no se indexa en buscadores hasta su validación editorial definitiva.',
    wikidepobleEsborranyEtiqueta: 'Borrador',
    wikidepobleSkillsCarpeta: 'Skills y Tractores',
    wikidepobleSkillsGrupNucli: 'Núcleo (core-*)',
    wikidepobleSkillsGrupProducte: 'Producto y Pedra Seca (sdp-*)',
    wikidepobleSkillsGrupWiki: 'Wiki y Conocimiento (wiki-*)',
    wikidepobleSkillsGrupAltres: 'Otras skills',
    wikidepobleSkillsSubtitol: 'Tractores operativos publicados desde .agents/skills/',
    wikidepobleSkillsCarregant: 'Cargando el índice de skills…',
    wikidepobleSkillsCarregantFitxa: 'Cargando la skill…',
    wikidepobleSkillsErrorIndex: 'No se ha podido cargar el índice público de skills.',
    wikidepobleSkillsErrorFitxa: 'No se ha podido cargar el archivo Markdown de esta skill.',
    wikidepobleSkillsBuida: 'No hay ninguna skill publicada en esta carpeta.',
    wikidepobleSkillsBaixaMd: 'Descargar Markdown (.md)',
    wikidepobleSkillsVeureAlGraf: 'Ver en el grafo de la Consola',
    wikidepobleSkillsQuadreTitol: 'Ficha técnica de la skill',
    wikidepobleSkillsIdentificador: 'Identificador',
    wikidepobleSkillsNucli: 'Núcleo del sistema',
    wikidepobleSkillsNucliSi: 'Sí (core)',
    wikidepobleSkillsNucliNo: 'No',
    wikidepobleSkillsEtiquetes: 'Etiquetas',
    wikidepobleSkillsMida: 'Tamaño del documento',
    wikidepobleSkillsFontUnica: 'Fuente única publicada',
    wikidepobleSkillsCapEtiqueta: 'Sin etiquetas'
  }),
  en: Object.freeze({
    wikidepobleEsborranyTitol: 'Draft under review',
    wikidepobleEsborranyCos: 'This Wiki de Poble document is a draft under active review. It is published for transparency, but excluded from search engine indexing until final editorial approval.',
    wikidepobleEsborranyEtiqueta: 'Draft',
    wikidepobleSkillsCarpeta: 'Skills and Tractors',
    wikidepobleSkillsGrupNucli: 'Core (core-*)',
    wikidepobleSkillsGrupProducte: 'Product and Pedra Seca (sdp-*)',
    wikidepobleSkillsGrupWiki: 'Wiki and Knowledge (wiki-*)',
    wikidepobleSkillsGrupAltres: 'Other skills',
    wikidepobleSkillsSubtitol: 'Operational tractors published from .agents/skills/',
    wikidepobleSkillsCarregant: 'Loading skills index…',
    wikidepobleSkillsCarregantFitxa: 'Loading skill…',
    wikidepobleSkillsErrorIndex: 'Could not load the public skills index.',
    wikidepobleSkillsErrorFitxa: 'Could not load the Markdown file for this skill.',
    wikidepobleSkillsBuida: 'No published skills in this folder.',
    wikidepobleSkillsBaixaMd: 'Download Markdown (.md)',
    wikidepobleSkillsVeureAlGraf: 'View in Console graph',
    wikidepobleSkillsQuadreTitol: 'Skill technical sheet',
    wikidepobleSkillsIdentificador: 'Identifier',
    wikidepobleSkillsNucli: 'System core',
    wikidepobleSkillsNucliSi: 'Yes (core)',
    wikidepobleSkillsNucliNo: 'No',
    wikidepobleSkillsEtiquetes: 'Tags',
    wikidepobleSkillsMida: 'Document size',
    wikidepobleSkillsFontUnica: 'Published single source',
    wikidepobleSkillsCapEtiqueta: 'No tags'
  }),
  eu: Object.freeze({
    wikidepobleEsborranyTitol: 'Zirriborroa berrikuspenean',
    wikidepobleEsborranyCos: 'Wiki de Poble dokumentu hau zirriborro eta berrikuspen fasean dago. Gardentasunez argitaratzen da, baina ez da bilatzaileetan indexatzen behin betiko onespena jaso arte.',
    wikidepobleEsborranyEtiqueta: 'Zirriborroa',
    wikidepobleSkillsCarpeta: 'Skill-ak eta Traktoreak',
    wikidepobleSkillsGrupNucli: 'Nukleoa (core-*)',
    wikidepobleSkillsGrupProducte: 'Produktua eta Pedra Seca (sdp-*)',
    wikidepobleSkillsGrupWiki: 'Wikia eta Ezagutza (wiki-*)',
    wikidepobleSkillsGrupAltres: 'Beste skill batzuk',
    wikidepobleSkillsSubtitol: '.agents/skills/ karpetatik argitaratutako traktore operatiboak',
    wikidepobleSkillsCarregant: 'Skill-en aurkibidea kargatzen…',
    wikidepobleSkillsCarregantFitxa: 'Skill-a kargatzen…',
    wikidepobleSkillsErrorIndex: 'Ezin izan da skill-en aurkibide publikoa kargatu.',
    wikidepobleSkillsErrorFitxa: 'Ezin izan da skill honen Markdown fitxategia kargatu.',
    wikidepobleSkillsBuida: 'Ez dago argitaratutako skill-ik karpeta honetan.',
    wikidepobleSkillsBaixaMd: 'Deskargatu Markdown (.md)',
    wikidepobleSkillsVeureAlGraf: 'Ikusi Kontsolako grafoan',
    wikidepobleSkillsQuadreTitol: 'Skill-aren fitxa teknikoa',
    wikidepobleSkillsIdentificador: 'Identifikatzailea',
    wikidepobleSkillsNucli: 'Sistemaren nukleoa',
    wikidepobleSkillsNucliSi: 'Bai (core)',
    wikidepobleSkillsNucliNo: 'Ez',
    wikidepobleSkillsEtiquetes: 'Etiketak',
    wikidepobleSkillsMida: 'Dokumentuaren tamaina',
    wikidepobleSkillsFontUnica: 'Argitaratutako iturri bakarra',
    wikidepobleSkillsCapEtiqueta: 'Etiketarik gabe'
  }),
  gl: Object.freeze({
    wikidepobleEsborranyTitol: 'Borrador en revisión',
    wikidepobleEsborranyCos: 'Este documento da Wiki de Poble atópase en fase de borrador e revisión activa. Publícase por transparencia, pero non se indexa nos buscadores ata a validación editorial definitiva.',
    wikidepobleEsborranyEtiqueta: 'Borrador',
    wikidepobleSkillsCarpeta: 'Skills e Tractores',
    wikidepobleSkillsGrupNucli: 'Núcleo (core-*)',
    wikidepobleSkillsGrupProducte: 'Produto e Pedra Seca (sdp-*)',
    wikidepobleSkillsGrupWiki: 'Wiki e Coñecemento (wiki-*)',
    wikidepobleSkillsGrupAltres: 'Outras skills',
    wikidepobleSkillsSubtitol: 'Tractores operativos publicados desde .agents/skills/',
    wikidepobleSkillsCarregant: 'Cargando o índice de skills…',
    wikidepobleSkillsCarregantFitxa: 'Cargando a skill…',
    wikidepobleSkillsErrorIndex: 'Non se puido cargar o índice público de skills.',
    wikidepobleSkillsErrorFitxa: 'Non se puido cargar o ficheiro Markdown desta skill.',
    wikidepobleSkillsBuida: 'Non hai ningunha skill publicada neste cartafol.',
    wikidepobleSkillsBaixaMd: 'Descargar Markdown (.md)',
    wikidepobleSkillsVeureAlGraf: 'Ver no grafo da Consola',
    wikidepobleSkillsQuadreTitol: 'Ficha técnica da skill',
    wikidepobleSkillsIdentificador: 'Identificador',
    wikidepobleSkillsNucli: 'Núcleo do sistema',
    wikidepobleSkillsNucliSi: 'Si (core)',
    wikidepobleSkillsNucliNo: 'Non',
    wikidepobleSkillsEtiquetes: 'Etiquetas',
    wikidepobleSkillsMida: 'Tamaño do documento',
    wikidepobleSkillsFontUnica: 'Fonte única publicada',
    wikidepobleSkillsCapEtiqueta: 'Sen etiquetas'
  })
});

export function codiIdiomaWikiV26(idioma) {
  const curt = String(idioma || 'ca').trim().toLowerCase().slice(0, 2);
  return Object.hasOwn(TEXTOS, curt) ? curt : 'ca';
}

export function textosWikiV26(idioma = 'ca') {
  return TEXTOS[codiIdiomaWikiV26(idioma)];
}

export const CLAUS_I18N_WIKI_V26 = Object.freeze(Object.keys(TEXTOS.ca));
export const DICCIONARIS_I18N_WIKI_V26 = TEXTOS;
