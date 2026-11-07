import { describe, expect, test } from 'vitest';
import {
  FACETA_3_CATEGORIES_MARES_IA,
  FACETA_4_ETIQUETES_SKOS,
  ARTICLES_SIMULADOR_IA_425,
} from './tesaurusDoctoralSocDePoble.js';
import { MANIFEST_DE_POBLE_POST } from '../../sections/mur/feedSeed.js';
import { CALENDAR_EVENTS, CURSOS_PEDRA_EN_SEC_2026_EVENT } from '../../sections/mur/eventsSeed.js';
import { NOVES_TECNOLOGIES_CULTURA_RURAL_POST } from '../../sections/mur/articles/novesTecnologiesCulturaRuralContent.js';
import { PAGINES_PATRIMONI_R9 } from '../../sections/text/pageContent.patrimoniR9.js';
import { PAGE_COPY } from '../../sections/text/pageContent.js';

const CATEGORIES_MARES_CANONIQUES_6 = [
  '⚖️ Defensa del Territori, Ecologia i Reivindicació',
  '🌾 Recursos Locals, Agricultura i Sobirania',
  '🌿 Natura i Patrimoni',
  '🎭 Cultura, Música i Llengua',
  '🤝 Món Rural',
  '💻 Tecnologia Lliure, Dades Obertes i Disseny',
];

const ETIQUETES_ANTIGUES_EXTIRPADES = [
  'Posant en Valor els Recursos Locals',
  'Reivindicant',
  'Esdeveniments',
  'Agenda',
  'Pedra en sec',
  'Formació agrària',
  'Arbres',
  'Árboles',
  'Trees',
  'Zuhaitzak',
  'Árbores',
  'Noves tecnologies',
];

describe('P0-40 / IDEA-167 (Kit R88) · Recategorització de totes les Cards publicades i extirpació d’etiquetes antigues', () => {
  test('1. Tesaurus Doctoral consolida les 6 Categories Mares i les etiquetes #Rutes (182) i #Associacionisme (999) sense categories mares antigues', () => {
    expect(FACETA_3_CATEGORIES_MARES_IA.map((c) => c.label)).toEqual(CATEGORIES_MARES_CANONIQUES_6);
    expect(FACETA_4_ETIQUETES_SKOS).toHaveLength(111);

    const tagRutes = FACETA_4_ETIQUETES_SKOS.find((t) => t.id === 182);
    const tagAssoc = FACETA_4_ETIQUETES_SKOS.find((t) => t.id === 999);
    expect(tagRutes).toMatchObject({
      name: 'Rutes',
      slug: 'rutes',
      broaderTermLabel: '🌿 Natura i Patrimoni',
      useFor: ['Excursions', 'Camins', 'Tracks'],
    });
    expect(tagAssoc).toMatchObject({
      name: 'Associacionisme',
      slug: 'associacionisme',
      broaderTermLabel: '🤝 Món Rural',
      useFor: ['Associacions', 'Col·lectius', 'Comunitat'],
    });

    const categoriesMaresSet = new Set(CATEGORIES_MARES_CANONIQUES_6);
    for (const tag of FACETA_4_ETIQUETES_SKOS) {
      expect(categoriesMaresSet.has(tag.broaderTermLabel), `${tag.name} -> ${tag.broaderTermLabel}`).toBe(true);
    }
    for (const art of ARTICLES_SIMULADOR_IA_425) {
      expect(categoriesMaresSet.has(art.categoriaTematicaProposadaLabel), `${art.id} -> ${art.categoriaTematicaProposadaLabel}`).toBe(true);
    }
  });

  test('2. Manifest de Poble elimina les etiquetes antigues i usa la categoria mare i etiquetes canòniques (Aplec pel Territori, Associacionisme)', () => {
    expect(MANIFEST_DE_POBLE_POST.category).toBe('⚖️ Defensa del Territori, Ecologia i Reivindicació');
    expect(MANIFEST_DE_POBLE_POST.tags).toEqual(['Aplec pel Territori', 'Associacionisme']);
    expect(MANIFEST_DE_POBLE_POST.labels).toEqual([
      { text: '⚖️ Defensa del Territori, Ecologia i Reivindicació', className: 'sdp-badge-category' },
      { text: 'Aplec pel Territori', className: 'sdp-badge-tag' },
      { text: 'Associacionisme', className: 'sdp-badge-tag' },
    ]);
    for (const antiga of ETIQUETES_ANTIGUES_EXTIRPADES) {
      expect(MANIFEST_DE_POBLE_POST.tags).not.toContain(antiga);
      expect(MANIFEST_DE_POBLE_POST.labels.map((l) => l.text)).not.toContain(antiga);
    }
  });

  test('3. Cursos de pedra en sec i 2n Aplec pel Territori substitueixen Agenda, Pedra en sec i Formació agrària per categories mares i etiquetes canòniques', () => {
    expect(CURSOS_PEDRA_EN_SEC_2026_EVENT.category).toBe('🌾 Recursos Locals, Agricultura i Sobirania');
    // Cadena R11, Loop 3 (L2-08) · «#Pedra Seca», com nomena P0-40 (Llibre, línia 439).
    expect(CURSOS_PEDRA_EN_SEC_2026_EVENT.tags).toEqual(['Pedra Seca', 'Bioconstrucció', 'Patrimoni', 'Activitats']);
    expect(CURSOS_PEDRA_EN_SEC_2026_EVENT.labels.map((l) => l.text)).toEqual([
      '🌾 Recursos Locals, Agricultura i Sobirania',
      'Pedra Seca',
      'Bioconstrucció',
      'Patrimoni',
      'Activitats',
    ]);

    const aplec = CALENDAR_EVENTS.find((e) => e.id === 'aplec-2023');
    expect(aplec.category).toBe('⚖️ Defensa del Territori, Ecologia i Reivindicació');
    // Cadena R11, Loop 3 (L2-07 i L2-08) · les etiquetes de WP 16880 (Incendis, no Rutes) i la mare enllaça el dia de l'acte.
    expect(aplec.tags).toEqual(['Aplec pel Territori', 'Incendis', 'Associacionisme']);
    expect(aplec.labels[0]).toEqual({ text: aplec.category, className: 'sdp-badge-category sp-card-label--enllac', href: '/calendari?vista=mes&date=2023-01-29' });
    const wp16880 = ARTICLES_SIMULADOR_IA_425.find((a) => a.id === 16880);
    expect(wp16880?.etiquetesNetes).toEqual(aplec.tags);
    const assoc = FACETA_4_ETIQUETES_SKOS.find((t) => t.id === 999);
    expect(assoc.count).toBe(ARTICLES_SIMULADOR_IA_425.filter((a) => a.etiquetesNetes.includes('Associacionisme')).length);

    for (const antiga of ETIQUETES_ANTIGUES_EXTIRPADES) {
      expect(CURSOS_PEDRA_EN_SEC_2026_EVENT.labels.map((l) => l.text)).not.toContain(antiga);
      expect(aplec.labels.map((l) => l.text)).not.toContain(antiga);
    }
  });

  test('4. Noves tecnologies aplicades a la cultura rural (Pou de Neu 3D) usa categoria mare i etiquetes SKOS canòniques', () => {
    expect(NOVES_TECNOLOGIES_CULTURA_RURAL_POST.category).toBe('🌿 Natura i Patrimoni');
    expect(NOVES_TECNOLOGIES_CULTURA_RURAL_POST.tags).toEqual(['Patrimoni', 'Pou de neu', 'Pedra Seca']);
    expect(NOVES_TECNOLOGIES_CULTURA_RURAL_POST.labels.map((l) => l.text)).toEqual([
      '🌿 Natura i Patrimoni',
      'Patrimoni',
      'Pou de neu',
      'Pedra Seca',
    ]);
    for (const antiga of ETIQUETES_ANTIGUES_EXTIRPADES) {
      expect(NOVES_TECNOLOGIES_CULTURA_RURAL_POST.tags).not.toContain(antiga);
    }
  });

  test('5. Les 5 cards de patrimoni (anatomia-rural, herbari, banc-de-llavors, rutes-de-poble, arbres-monumentals) usen la categoria mare nova i Arbres Monumentals en les 5 llengües', () => {
    expect(PAGE_COPY['anatomia-rural'].labels.map((l) => l.text)).toEqual([
      'Sistema',
      '🌿 Natura i Patrimoni',
      'Patrimoni',
      'Pou de neu',
      'Pedra Seca',
    ]);
    expect(PAGE_COPY.herbari.labels.map((l) => l.text)).toEqual([
      'Sistema',
      '🌿 Natura i Patrimoni',
      'Herbari',
    ]);
    expect(PAGINES_PATRIMONI_R9['banc-de-llavors'].labels.map((l) => l.text)).toEqual([
      'Sistema',
      '🌾 Recursos Locals, Agricultura i Sobirania',
      'Llavors',
    ]);
    expect(PAGINES_PATRIMONI_R9['rutes-de-poble'].labels.map((l) => l.text)).toEqual([
      'Sistema',
      '🌿 Natura i Patrimoni',
      'Rutes',
    ]);
    expect(PAGINES_PATRIMONI_R9['arbres-monumentals'].labels.map((l) => l.text)).toEqual([
      'Sistema',
      '🌿 Natura i Patrimoni',
      'Arbres Monumentals',
    ]);

    const arbresTrad = PAGINES_PATRIMONI_R9['arbres-monumentals'].translations;
    expect(arbresTrad.es.labels.map((l) => l.text)).toEqual(['Sistema', '🌿 Naturaleza y Patrimonio', 'Árboles Monumentales']);
    expect(arbresTrad.en.labels.map((l) => l.text)).toEqual(['System', '🌿 Nature and Heritage', 'Monumental Trees']);
    expect(arbresTrad.eu.labels.map((l) => l.text)).toEqual(['Sistema', '🌿 Natura eta Ondarea', 'Zuhaitz Monumentalak']);
    expect(arbresTrad.gl.labels.map((l) => l.text)).toEqual(['Sistema', '🌿 Natureza e Patrimonio', 'Árbores Monumentais']);

    for (const slug of ['anatomia-rural', 'herbari', 'banc-de-llavors', 'rutes-de-poble', 'arbres-monumentals']) {
      const pag = PAGE_COPY[slug];
      const textos = [
        ...pag.labels.map((l) => l.text),
        ...Object.values(pag.translations || {}).flatMap((tr) => (tr.labels || []).map((l) => l.text)),
      ];
      for (const antiga of ['Arbres', 'Árboles', 'Trees', 'Zuhaitzak', 'Árbores', 'Pedra seca']) {
        expect(textos, `${slug} no pot portar ${antiga}`).not.toContain(antiga);
      }
    }
  });

  /* Arbitratge R46, Loop 3 (R88-C2-04, arreglo de l'àrbitre R88) · La 182 de WP («Excursions») es diu «Rutes»:
     cap terme relacionat ni cap etiqueta neta crua nomena un terme que no és a F4. «Excursions» queda a
     etiquetesOriginals (història de WP) i a useFor. */
  test('6. el tesaurus no deixa cap terme relacionat orfe i «Excursions» només queda com a història', () => {
    const noms = new Set(FACETA_4_ETIQUETES_SKOS.map((t) => t.name));
    const relacionatsOrfes = FACETA_4_ETIQUETES_SKOS.flatMap((t) => (t.relatedTerms || []).filter((r) => !noms.has(r)).map((r) => `${t.name}:${r}`));
    expect(relacionatsOrfes).toEqual([]);
    const ambNom = (camp, nom) => ARTICLES_SIMULADOR_IA_425.filter((a) => a[camp].includes(nom)).length;
    expect([ambNom('etiquetesNetes', 'Rutes'), ambNom('etiquetesOriginals', 'Excursions')]).toEqual([98, 98]);
  });
});
